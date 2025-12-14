import React, { useEffect, useRef, useState } from "react";
import { useScribe } from "@elevenlabs/react";

type VoiceToTextComponentProps = {
  wsUrl?: string;
  tokenEndpoint?: string; // returns { token: string }
};

function defaultWsUrl(): string {
  if (typeof window === "undefined") return "ws://localhost/api/v1/websocket/";
  const scheme = window.location.protocol === "https:" ? "wss" : "ws";
  return `${scheme}://${window.location.host}/api/v1/websocket/`;
}

export default function VoiceToTextComponent({
  wsUrl,
  tokenEndpoint = "/api/v1/elevenlabs-token/",
}: VoiceToTextComponentProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");

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

  useEffect(() => {
    const url = wsUrl ?? defaultWsUrl();
    setConnectionStatus("Connecting...");

    const ws = new WebSocket(url);
    websocketRef.current = ws;

    ws.onopen = () => setConnectionStatus("Connected");
    ws.onclose = () => setConnectionStatus("Disconnected");
    ws.onerror = () => setConnectionStatus("Error: WebSocket connection error");

    return () => {
      try {
        scribe.disconnect();
      } catch {
        // ignore
      }
      try {
        ws.close();
      } catch {
        // ignore
      }
      websocketRef.current = null;
    };
  }, [wsUrl, scribe]);

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

  return (
    <div>
      <div>Status: {connectionStatus}</div>
      <div>Transcript: {transcript || "..."}</div>

      <button type="button" onClick={startRecording} disabled={isRecording}>
        Start
      </button>
      <button type="button" onClick={stopRecording} disabled={!isRecording}>
        Stop
      </button>
    </div>
  );
}

export const TestButton = VoiceToTextComponent;