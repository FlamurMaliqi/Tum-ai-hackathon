import React, { useEffect, useRef, useState } from "react";
import { useScribe } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";

type TestButtonProps = {
  wsUrl?: string;
  tokenEndpoint?: string; // returns { token: string }
  className?: string;
};

function defaultWsUrl(): string {
  // Prefer explicit API base when running the static Docker build (no Vite proxy).
  // Falls back to same-origin (works in Vite dev where /api is proxied, including ws).
  if (typeof window === "undefined") return "ws://localhost:8000/api/v1/websocket/";

  const explicitApiBase = import.meta.env.VITE_API_URL;
  if (typeof explicitApiBase === "string" && explicitApiBase.length > 0) {
    const u = new URL(explicitApiBase);
    const wsProtocol = u.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${u.host}/api/v1/websocket/`;
  }

  const scheme = window.location.protocol === "https:" ? "wss" : "ws";
  return `${scheme}://${window.location.host}/api/v1/websocket/`;
}

export function TestButton({
  wsUrl,
  tokenEndpoint,
  className,
}: TestButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"Disconnected" | "Connecting..." | "Connected" | "Recording..." | `Error: ${string}`>(
    "Disconnected",
  );

  const websocketRef = useRef<WebSocket | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onPartialTranscript: (data) => {
      if (typeof data?.text === "string") setTranscript(data.text);
    },
    onCommittedTranscript: (data) => {
      const text = typeof data?.text === "string" ? data.text : "";
      if (!text.trim()) return;
      setTranscript(text);
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({ type: "transcript", text }));
      }
    },
    onError: (err) => {
      console.error("Scribe error:", err);
      const msg = err instanceof Error ? err.message : "Scribe error";
      setConnectionStatus(`Error: ${msg}`);
      setIsRecording(false);
    },
    onAuthError: (err) => {
      console.error("Scribe auth error:", err);
      const msg = err instanceof Error ? err.message : "Auth error";
      setConnectionStatus(`Error: ${msg}`);
      setIsRecording(false);
    },
  });

  const scribeRef = useRef(scribe);

  useEffect(() => {
    scribeRef.current = scribe;
  }, [scribe]);

  useEffect(() => {
    const url = wsUrl ?? defaultWsUrl();
    setConnectionStatus("Connecting...");

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid WebSocket URL";
      setConnectionStatus(`Error: ${msg}`);
      websocketRef.current = null;
      return;
    }
    websocketRef.current = ws;
    // Prefer ArrayBuffer for binary audio frames (mp3 bytes).
    ws.binaryType = "arraybuffer";

    ws.onopen = () => setConnectionStatus("Connected");
    ws.onclose = () => setConnectionStatus("Disconnected");
    ws.onerror = () => setConnectionStatus("Error: WebSocket connection error");
    ws.onmessage = (event) => {
      const data = event.data as unknown;

      // Text frames (JSON protocol)
      if (typeof data === "string") {
        try {
          const msg = JSON.parse(data) as { type?: unknown; [k: string]: unknown };
          const type = msg?.type;
          if (typeof type === "string") {
            // Useful debugging visibility during end-to-end testing.
            // eslint-disable-next-line no-console
            console.log("[ws]", msg);

            if (type === "assistant_start") {
              audioChunksRef.current = [];
              if (audioRef.current) {
                try {
                  audioRef.current.pause();
                } catch {
                  // ignore
                }
              }
              if (audioUrlRef.current) {
                try {
                  URL.revokeObjectURL(audioUrlRef.current);
                } catch {
                  // ignore
                }
                audioUrlRef.current = null;
              }
            }

            if (type === "assistant_done") {
              const chunks = audioChunksRef.current;
              if (chunks.length > 0) {
                const blob = new Blob(chunks, { type: "audio/mpeg" });
                const url = URL.createObjectURL(blob);
                audioUrlRef.current = url;
                const audio = new Audio(url);
                audioRef.current = audio;
                void audio.play().catch((err) => {
                  // eslint-disable-next-line no-console
                  console.error("Audio playback failed:", err);
                });
              }
            }
          }
        } catch {
          // eslint-disable-next-line no-console
          console.warn("[ws] non-JSON text frame:", data);
        }
        return;
      }

      // Binary frames (mp3 bytes)
      if (data instanceof ArrayBuffer) {
        audioChunksRef.current.push(new Uint8Array(data));
        return;
      }

      if (data instanceof Blob) {
        audioChunksRef.current.push(data);
      }
    };

    return () => {
      try {
        ws.close();
      } catch {
        // ignore
      }
      websocketRef.current = null;

      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          // ignore
        }
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        try {
          URL.revokeObjectURL(audioUrlRef.current);
        } catch {
          // ignore
        }
        audioUrlRef.current = null;
      }
    };
  }, [wsUrl]);

  // Ensure scribe is disconnected on unmount (avoid effect churn in dev)
  useEffect(() => {
    return () => {
      try {
        scribeRef.current.disconnect();
      } catch {
        // ignore
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (websocketRef.current?.readyState !== WebSocket.OPEN) {
        throw new Error("WebSocket not connected");
      }

      const resolvedTokenEndpoint = tokenEndpoint ?? apiUrl("/api/v1/elevenlabs-token/");

      const res = await fetch(resolvedTokenEndpoint, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Token request failed (${res.status})`);

      const body: unknown = await res.json();
      const token = (body as { token?: unknown })?.token;
      if (typeof token !== "string" || token.length === 0) throw new Error("Missing token");

      await scribe.connect({
        token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setIsRecording(true);
      setConnectionStatus("Recording...");
    } catch (e) {
      console.error("Start recording failed:", e);
      const msg = e instanceof Error ? e.message : "Unknown error";
      setConnectionStatus(`Error: ${msg}`);
      setIsRecording(false);
      try {
        scribe.disconnect();
      } catch {
        // ignore
      }
    }
  };

  const stopRecording = () => {
    try {
      scribe.disconnect();
    } catch {
      // ignore
    }
    setIsRecording(false);
    setConnectionStatus(websocketRef.current?.readyState === WebSocket.OPEN ? "Connected" : "Disconnected");
  };

  const handleToggle = () => {
    if (isRecording) stopRecording();
    else void startRecording();
  };

  return (
    <div className={cn("w-full max-w-md flex flex-col items-center gap-2", className)}>
      <Button
        type="button"
        variant="destructive"
        onClick={handleToggle}
        className="w-full h-12 text-base font-semibold"
      >
        {isRecording ? "Stop (Test)" : "Start (Test)"}
      </Button>

      <div className="text-xs text-muted-foreground">
        Status:{" "}
        <span
          className={cn(
            "font-medium",
            connectionStatus.startsWith("Error:")
              ? "text-destructive"
              : connectionStatus === "Connected"
                ? "text-success"
                : connectionStatus === "Recording..."
                  ? "text-primary"
                  : "text-muted-foreground",
          )}
        >
          {connectionStatus}
        </span>
      </div>

      {transcript ? (
        <div className="w-full text-xs text-muted-foreground truncate" title={transcript}>
          Transcript: <span className="text-foreground">{transcript}</span>
        </div>
      ) : null}
    </div>
  );
}

export default TestButton;