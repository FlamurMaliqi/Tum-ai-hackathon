import { useEffect, useRef, useState } from "react";
import { useScribe } from "@elevenlabs/react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";

type VoiceAssistantProps = {
  wsUrl?: string;
  tokenEndpoint?: string;
  className?: string;
};

function defaultWsUrl(language: string = "en"): string {
  if (typeof window === "undefined") return `ws://localhost:8000/api/v1/websocket/?language=${language}`;

  const explicitApiBase = import.meta.env.VITE_API_URL;
  if (typeof explicitApiBase === "string" && explicitApiBase.length > 0) {
    const u = new URL(explicitApiBase);
    const wsProtocol = u.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${u.host}/api/v1/websocket/?language=${language}`;
  }

  const scheme = window.location.protocol === "https:" ? "wss" : "ws";
  return `${scheme}://${window.location.host}/api/v1/websocket/?language=${language}`;
}

export function VoiceAssistant({ wsUrl, tokenEndpoint, className }: VoiceAssistantProps) {
  const { language } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [responseVisible, setResponseVisible] = useState(false);
  const [agentState, setAgentState] = useState<"idle" | "greeting" | "listening" | "thinking" | "responding">("idle");
  const [thinkingDots, setThinkingDots] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState<"Disconnected" | "Connecting..." | "Connected" | `Error: ${string}`>("Disconnected");

  const websocketRef = useRef<WebSocket | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTranscriptRef = useRef<string>("");
  const hasSentRef = useRef<boolean>(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agentStateRef = useRef(agentState);
  const tokenEndpointRef = useRef<string | null>(null);
  const wordRevealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fullResponseRef = useRef<string>("");
  const sentTextRef = useRef<string>("");


  useEffect(() => {
    agentStateRef.current = agentState;
  }, [agentState]);

  useEffect(() => {
    if (agentState !== "thinking") {
      setThinkingDots(1);
      return;
    }
    const interval = setInterval(() => {
      setThinkingDots((d) => (d % 3) + 1);
    }, 400);
    return () => clearInterval(interval);
  }, [agentState]);

  const startWordReveal = (text: string, durationMs: number) => {
    if (wordRevealIntervalRef.current) clearInterval(wordRevealIntervalRef.current);
    const words = text.split(/\s+/);
    if (words.length === 0) { setDisplayedResponse(text); return; }
    const intervalMs = Math.max(50, (durationMs * 0.9) / words.length);
    let wordIndex = 0;
    setDisplayedResponse("");
    wordRevealIntervalRef.current = setInterval(() => {
      wordIndex++;
      if (wordIndex >= words.length) {
        setDisplayedResponse(text);
        if (wordRevealIntervalRef.current) { clearInterval(wordRevealIntervalRef.current); wordRevealIntervalRef.current = null; }
      } else {
        setDisplayedResponse(words.slice(0, wordIndex).join(" "));
      }
    }, intervalMs);
  };

  const reconnectScribe = async () => {
    if (!tokenEndpointRef.current) return;
    try {
      const res = await fetch(tokenEndpointRef.current, { method: "GET", credentials: "include", headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`Token request failed (${res.status})`);
      const body: unknown = await res.json();
      const token = (body as { token?: unknown })?.token;
      if (typeof token !== "string" || token.length === 0) throw new Error("Missing token");
      const scribeLanguageCode = language === "de" ? "de" : "en";
      await scribeRef.current.connect({ token, languageCode: scribeLanguageCode, microphone: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e) { console.error("Scribe reconnect failed:", e); }
  };

  const sendTranscript = (text: string, trigger: string) => {
    if (!text.trim() || hasSentRef.current) return;
    let toSend = text;
    if (sentTextRef.current && text.startsWith(sentTextRef.current)) {
      toSend = text.slice(sentTextRef.current.length).trim();
    }
    if (!toSend) return;
    hasSentRef.current = true;
    sentTextRef.current = text;
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    setAgentState("thinking");
    setTranscript("");
    setTranscriptVisible(false);
    console.log(`[DEBUG] SENDING transcript (${trigger}):`, toSend);
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ type: "transcript", text: toSend }));
    }
  };

  const extractSpeech = (text: string): string => text.replace(/\s*\([^)]*\)\s*$/g, "").trim();

  const resetSilenceTimer = (text: string) => {
    const currentState = agentStateRef.current;
    if (currentState === "thinking" || currentState === "responding") return;
    if (hasSentRef.current) return;
    const newSpeech = extractSpeech(text);
    const lastSpeech = extractSpeech(lastTranscriptRef.current);
    const sentSpeech = extractSpeech(sentTextRef.current);
    if (sentSpeech && newSpeech === sentSpeech) return;
    if (sentSpeech && newSpeech.startsWith(sentSpeech)) {
      const newPart = newSpeech.slice(sentSpeech.length).trim();
      if (!newPart) return;
    }
    if (newSpeech === lastSpeech && lastSpeech !== "") return;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    lastTranscriptRef.current = text;
    if (newSpeech) {
      setTranscriptVisible(true);
      silenceTimerRef.current = setTimeout(() => {
        const stateAtFire = agentStateRef.current;
        if (stateAtFire === "thinking" || stateAtFire === "responding") return;
        if (hasSentRef.current) return;
        const toSend = extractSpeech(lastTranscriptRef.current);
        if (toSend) sendTranscript(toSend, "silence_timer");
      }, 1500);
    }
  };


  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onPartialTranscript: (data) => {
      if (typeof data?.text === "string") {
        setTranscript(data.text);
        resetSilenceTimer(data.text);
      }
    },
    onCommittedTranscript: (data) => {
      const text = typeof data?.text === "string" ? data.text : "";
      const speech = extractSpeech(text);
      if (!speech) return;
      setTranscript(text);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      sendTranscript(speech, "committed");
    },
    onError: (err) => {
      console.error("Scribe error:", err);
      setConnectionStatus(`Error: ${err instanceof Error ? err.message : "Scribe error"}`);
      setIsRecording(false);
    },
    onAuthError: (err) => {
      console.error("Scribe auth error:", err);
      setConnectionStatus(`Error: ${err instanceof Error ? err.message : "Auth error"}`);
      setIsRecording(false);
    },
  });

  const scribeRef = useRef(scribe);
  useEffect(() => { scribeRef.current = scribe; }, [scribe]);

  useEffect(() => {
    const url = wsUrl ?? defaultWsUrl(language);
    setConnectionStatus("Connecting...");
    let ws: WebSocket;
    try { ws = new WebSocket(url); } catch (e) {
      setConnectionStatus(`Error: ${e instanceof Error ? e.message : "Invalid WebSocket URL"}`);
      websocketRef.current = null;
      return;
    }
    websocketRef.current = ws;
    ws.binaryType = "arraybuffer";
    ws.onopen = () => setConnectionStatus("Connected");
    ws.onclose = () => setConnectionStatus("Disconnected");
    ws.onerror = () => setConnectionStatus("Error: WebSocket connection error");
    ws.onmessage = (event) => {
      const data = event.data as unknown;
      if (typeof data === "string") {
        try {
          const msg = JSON.parse(data) as { type?: unknown; [k: string]: unknown };
          const type = msg?.type;
          if (typeof type === "string") {
            console.log("[ws]", msg);
            if (type === "assistant_start") {
              setDisplayedResponse("");
              fullResponseRef.current = "";
              setResponseVisible(false);
              if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
              if (wordRevealIntervalRef.current) { clearInterval(wordRevealIntervalRef.current); wordRevealIntervalRef.current = null; }
              if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
              try { scribeRef.current.disconnect(); } catch { /* ignore */ }
              audioChunksRef.current = [];
            }
            if (type === "assistant_token") {
              const text = typeof msg.text === "string" ? msg.text : "";
              fullResponseRef.current += text;
              setAgentState("responding");
            }
            if (type === "assistant_done") {
              const chunks = audioChunksRef.current;
              if (chunks.length > 0) {
                const blob = new Blob(chunks, { type: "audio/mpeg" });
                const url = URL.createObjectURL(blob);
                audioUrlRef.current = url;
                const audio = new Audio(url);
                audioRef.current = audio;
                audio.onloadedmetadata = () => {
                  setResponseVisible(true);
                  startWordReveal(fullResponseRef.current, audio.duration * 1000);
                };
                audio.onended = () => {
                  if (wordRevealIntervalRef.current) { clearInterval(wordRevealIntervalRef.current); wordRevealIntervalRef.current = null; }
                  setDisplayedResponse(fullResponseRef.current);
                  lastTranscriptRef.current = "";
                  sentTextRef.current = "";
                  hasSentRef.current = false;
                  setTranscript("");
                  void reconnectScribe();
                  setAgentState("listening");
                  fadeTimerRef.current = setTimeout(() => setResponseVisible(false), 1000);
                };
                void audio.play().catch(() => {
                  setDisplayedResponse(fullResponseRef.current);
                  setResponseVisible(true);
                  lastTranscriptRef.current = "";
                  sentTextRef.current = "";
                  hasSentRef.current = false;
                  setTranscript("");
                  void reconnectScribe();
                  fadeTimerRef.current = setTimeout(() => { setAgentState("listening"); setResponseVisible(false); }, 3000);
                });
              } else {
                setDisplayedResponse(fullResponseRef.current);
                setResponseVisible(true);
                lastTranscriptRef.current = "";
                sentTextRef.current = "";
                hasSentRef.current = false;
                setTranscript("");
                void reconnectScribe();
                fadeTimerRef.current = setTimeout(() => { setAgentState("listening"); setResponseVisible(false); }, 3000);
              }
            }
          }
        } catch { console.warn("[ws] non-JSON text frame:", data); }
        return;
      }
      if (data instanceof ArrayBuffer) { audioChunksRef.current.push(new Uint8Array(data)); return; }
      if (data instanceof Blob) { audioChunksRef.current.push(data); }
    };
    return () => {
      try { ws.close(); } catch { /* ignore */ }
      websocketRef.current = null;
      if (audioRef.current) { try { audioRef.current.pause(); } catch { /* ignore */ } audioRef.current = null; }
      if (audioUrlRef.current) { try { URL.revokeObjectURL(audioUrlRef.current); } catch { /* ignore */ } audioUrlRef.current = null; }
    };
  }, [wsUrl, language]);

  useEffect(() => {
    return () => {
      try { scribeRef.current.disconnect(); } catch { /* ignore */ }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (wordRevealIntervalRef.current) clearInterval(wordRevealIntervalRef.current);
    };
  }, []);


  const startRecording = async () => {
    try {
      if (websocketRef.current?.readyState !== WebSocket.OPEN) throw new Error("WebSocket not connected");

      const greetingText = language === "de" 
        ? "Hallo — ich kann dir helfen, eine schnelle Materialbestellung für die Baustelle zusammenzustellen."
        : "Hi — I can help you put together a quick supply order for the site.";
      const greetingAudioFile = language === "de" ? "/greeting_de.mp3" : "/greeting.mp3";
      
      setAgentState("greeting");
      setDisplayedResponse("");
      setResponseVisible(true);
      
      // Try to play greeting audio, fall back to just showing text if audio fails
      let audioPlayed = false;
      try {
        const greetingAudio = new Audio(greetingAudioFile);
        greetingAudio.onloadedmetadata = () => startWordReveal(greetingText, greetingAudio.duration * 1000);
        await greetingAudio.play();
        audioPlayed = true;
        await new Promise<void>((resolve) => {
          greetingAudio.onended = () => { setDisplayedResponse(greetingText); if (wordRevealIntervalRef.current) { clearInterval(wordRevealIntervalRef.current); wordRevealIntervalRef.current = null; } resolve(); };
          greetingAudio.onerror = () => { setDisplayedResponse(greetingText); resolve(); };
        });
      } catch { /* audio failed, will show text below */ }
      
      if (!audioPlayed) {
        // No audio available, just show the text with a brief delay
        setDisplayedResponse(greetingText);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      const resolvedTokenEndpoint = tokenEndpoint ?? apiUrl("/api/v1/elevenlabs-token/");
      tokenEndpointRef.current = resolvedTokenEndpoint;
      const res = await fetch(resolvedTokenEndpoint, { method: "GET", credentials: "include", headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`Token request failed (${res.status})`);
      const body: unknown = await res.json();
      const token = (body as { token?: unknown })?.token;
      if (typeof token !== "string" || token.length === 0) throw new Error("Missing token");

      // Use the appropriate language code for ElevenLabs Scribe STT
      const scribeLanguageCode = language === "de" ? "de" : "en";
      await scribe.connect({ token, languageCode: scribeLanguageCode, microphone: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });

      lastTranscriptRef.current = "";
      hasSentRef.current = false;
      sentTextRef.current = "";
      setTranscript("");
      setTranscriptVisible(false);
      setResponseVisible(true);
      setIsRecording(true);
      setAgentState("listening");
      fadeTimerRef.current = setTimeout(() => setResponseVisible(false), 4000);
    } catch (e) {
      console.error("Start recording failed:", e);
      setConnectionStatus(`Error: ${e instanceof Error ? e.message : "Unknown error"}`);
      setIsRecording(false);
      try { scribe.disconnect(); } catch { /* ignore */ }
    }
  };

  const stopRecording = () => {
    try { scribe.disconnect(); } catch { /* ignore */ }
    tokenEndpointRef.current = null;
    setIsRecording(false);
    setAgentState("idle");
  };

  const handleToggle = () => {
    if (isRecording) stopRecording();
    else void startRecording();
  };

  const getStatusText = () => {
    if (connectionStatus.startsWith("Error:")) return connectionStatus;
    if (connectionStatus === "Disconnected") return language === "de" ? "Getrennt" : "Disconnected";
    if (connectionStatus === "Connecting...") return language === "de" ? "Verbinde..." : "Connecting...";
    if (!isRecording) return language === "de" ? "Klicke auf das Mikrofon zum Starten" : "Click the microphone to begin";
    switch (agentState) {
      case "greeting": return language === "de" ? "Begrüßung..." : "Greeting...";
      case "listening": return language === "de" ? "Höre zu..." : "Listening...";
      case "thinking": return language === "de" ? `Denke nach${".".repeat(thinkingDots)}` : `Thinking${".".repeat(thinkingDots)}`;
      case "responding": return language === "de" ? "Antworte..." : "Responding...";
      default: return language === "de" ? "Bereit" : "Ready";
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      {/* Status Text */}
      <div className="text-center max-w-md">
        <p className={cn(
          "text-base font-medium leading-relaxed transition-colors",
          connectionStatus.startsWith("Error:") ? "text-destructive" :
          agentState === "greeting" ? "text-purple-600" :
          agentState === "listening" ? "text-green-600" :
          agentState === "thinking" ? "text-yellow-600" :
          agentState === "responding" ? "text-blue-600" : "text-foreground"
        )}>
          {getStatusText()}
        </p>
      </div>

      {/* Single text area - shows either transcript or response */}
      <div className="text-center max-w-md min-h-[3rem] flex items-center justify-center">
        <p className={cn(
          "text-base transition-opacity duration-500",
          transcriptVisible && transcript 
            ? "opacity-70 text-muted-foreground italic" 
            : responseVisible && displayedResponse 
              ? "opacity-100 text-foreground" 
              : "opacity-0"
        )}>
          {transcriptVisible && transcript 
            ? extractSpeech(transcript) 
            : displayedResponse || "\u00A0"}
        </p>
      </div>

      {/* Microphone Button */}
      <div className="relative">
        {/* Pulsing ring when actively listening */}
        {agentState === "listening" && (
          <div className="absolute inset-0 -m-3 rounded-full border-2 border-green-500/30 animate-pulse" aria-hidden="true" />
        )}
        <button
          onClick={handleToggle}
          className={cn(
            "relative h-20 w-20 rounded-full flex items-center justify-center transition-all border-2",
            agentState === "listening"
              ? "bg-green-600 border-green-600 hover:bg-green-700"
              : "bg-destructive border-destructive hover:bg-destructive/90"
          )}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {agentState === "listening" ? (
            <Mic className="h-8 w-8 text-white" />
          ) : (
            <MicOff className="h-8 w-8 text-white" />
          )}
        </button>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "h-1.5 w-1.5 rounded-full transition-colors",
          agentState === "listening" ? "bg-green-500" : "bg-destructive/40"
        )} aria-hidden="true" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          {!isRecording ? (language === "de" ? "Bereit" : "Ready") :
           agentState === "listening" ? (language === "de" ? "Höre zu" : "Listening") :
           agentState === "thinking" ? (language === "de" ? "Verarbeite" : "Processing") :
           agentState === "responding" ? (language === "de" ? "Spreche" : "Speaking") : (language === "de" ? "Aktiv" : "Active")}
        </span>
      </div>
    </div>
  );
}

export default VoiceAssistant;
