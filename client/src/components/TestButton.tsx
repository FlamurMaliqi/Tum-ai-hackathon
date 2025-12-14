import React, { useEffect, useRef, useState } from "react";
import { useScribe } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TestButtonProps = {
  wsUrl?: string;
  tokenEndpoint?: string; // returns { token: string }
  className?: string;
};

function defaultWsUrl(): string {
  if (typeof window === "undefined") return "ws://localhost/api/v1/websocket/";
  const scheme = window.location.protocol === "https:" ? "wss" : "ws";
  return `${scheme}://${window.location.host}/api/v1/websocket/`;
}

export function TestButton({
  wsUrl,
  tokenEndpoint = "/api/v1/elevenlabs-token/",
  className,
}: TestButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"Disconnected" | "Connecting..." | "Connected" | "Recording..." | `Error: ${string}`>(
    "Disconnected",
  );

  const websocketRef = useRef<WebSocket | null>(null);

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

    ws.onopen = () => setConnectionStatus("Connected");
    ws.onclose = () => setConnectionStatus("Disconnected");
    ws.onerror = () => setConnectionStatus("Error: WebSocket connection error");

    return () => {
      try {
        ws.close();
      } catch {
        // ignore
      }
      websocketRef.current = null;
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

      const res = await fetch(tokenEndpoint, {
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