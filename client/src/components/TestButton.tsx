import { useEffect, useRef, useState } from "react";
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
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState("");
  const [displayedResponse, setDisplayedResponse] = useState(""); // Text revealed word-by-word
  const [responseVisible, setResponseVisible] = useState(false);
  const [agentState, setAgentState] = useState<"idle" | "greeting" | "listening" | "thinking" | "responding">("idle");
  const [thinkingDots, setThinkingDots] = useState(1); // 1, 2, or 3 dots
  const [connectionStatus, setConnectionStatus] = useState<"Disconnected" | "Connecting..." | "Connected" | `Error: ${string}`>(
    "Disconnected",
  );

  const websocketRef = useRef<WebSocket | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTranscriptRef = useRef<string>("");
  const hasSentRef = useRef<boolean>(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agentStateRef = useRef(agentState); // Ref to avoid stale closures
  const tokenEndpointRef = useRef<string | null>(null); // Store endpoint for fetching fresh tokens
  const wordRevealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fullResponseRef = useRef<string>(""); // Store full response for word reveal

  // Keep ref in sync with state
  useEffect(() => {
    agentStateRef.current = agentState;
  }, [agentState]);

  // Animate thinking dots
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

  // Track what we've already sent to avoid duplicates
  const sentTextRef = useRef<string>("");

  // Start word-by-word text reveal synced to audio duration
  const startWordReveal = (text: string, durationMs: number) => {
    // Clear any existing interval
    if (wordRevealIntervalRef.current) {
      clearInterval(wordRevealIntervalRef.current);
    }
    
    const words = text.split(/\s+/);
    if (words.length === 0) {
      setDisplayedResponse(text);
      return;
    }
    
    // Calculate interval between words based on audio duration
    // Leave some buffer at the end (90% of duration for text)
    const intervalMs = Math.max(50, (durationMs * 0.9) / words.length);
    let wordIndex = 0;
    
    setDisplayedResponse(""); // Start empty
    
    wordRevealIntervalRef.current = setInterval(() => {
      wordIndex++;
      if (wordIndex >= words.length) {
        setDisplayedResponse(text); // Show full text
        if (wordRevealIntervalRef.current) {
          clearInterval(wordRevealIntervalRef.current);
          wordRevealIntervalRef.current = null;
        }
      } else {
        setDisplayedResponse(words.slice(0, wordIndex).join(" "));
      }
    }, intervalMs);
  };

  // Helper to fetch fresh token and reconnect scribe
  const reconnectScribe = async () => {
    if (!tokenEndpointRef.current) return;
    
    try {
      const res = await fetch(tokenEndpointRef.current, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Token request failed (${res.status})`);

      const body: unknown = await res.json();
      const token = (body as { token?: unknown })?.token;
      if (typeof token !== "string" || token.length === 0) throw new Error("Missing token");

      await scribeRef.current.connect({
        token,
        languageCode: "en",
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      console.log("[DEBUG] Scribe reconnected successfully");
    } catch (e) {
      console.error("Scribe reconnect failed:", e);
    }
  };

  // Send transcript after silence
  const sendTranscript = (text: string, trigger: string) => {
    if (!text.trim() || hasSentRef.current) return;
    
    // Only send the NEW part (what we haven't sent before)
    let toSend = text;
    if (sentTextRef.current && text.startsWith(sentTextRef.current)) {
      toSend = text.slice(sentTextRef.current.length).trim();
    }
    
    if (!toSend) return;
    
    hasSentRef.current = true;
    sentTextRef.current = text;
    // Keep lastTranscriptRef set so we can detect if same text keeps coming
    // Don't reset it - that causes the timer to restart on identical partials
    
    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    setAgentState("thinking");
    // Clear transcript display immediately when sending
    setTranscript("");
    setTranscriptVisible(false);
    
    console.log(`[DEBUG ${new Date().toISOString()}] SENDING transcript (${trigger}):`, toSend);
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ type: "transcript", text: toSend }));
    }
  };

  // Extract just the speech content, ignoring annotations like (silence), (no speech detected)
  const extractSpeech = (text: string): string => {
    return text.replace(/\s*\([^)]*\)\s*$/g, "").trim();
  };

  // Reset silence timer on new partial transcript (only if actual speech changed)
  const resetSilenceTimer = (text: string) => {
    // Don't process transcripts while thinking/responding - use ref to avoid stale closure
    const currentState = agentStateRef.current;
    if (currentState === "thinking" || currentState === "responding") {
      return;
    }
    
    // Don't process if we already sent this turn
    if (hasSentRef.current) {
      return;
    }
    
    const newSpeech = extractSpeech(text);
    const lastSpeech = extractSpeech(lastTranscriptRef.current);
    const sentSpeech = extractSpeech(sentTextRef.current);
    
    // If this is the same as what we already sent, ignore it completely
    if (sentSpeech && newSpeech === sentSpeech) {
      return;
    }
    
    // If this starts with what we sent, only consider the new part
    // But if there's no new part yet, don't start a timer
    if (sentSpeech && newSpeech.startsWith(sentSpeech)) {
      const newPart = newSpeech.slice(sentSpeech.length).trim();
      if (!newPart) {
        return; // No new content yet
      }
    }
    
    // Only reset timer if actual speech content changed
    if (newSpeech === lastSpeech && lastSpeech !== "") {
      return; // Same speech, don't reset timer - let it fire
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    lastTranscriptRef.current = text;
    
    // Show transcript when there's speech
    if (newSpeech) {
      setTranscriptVisible(true);
      silenceTimerRef.current = setTimeout(() => {
        // Double-check state at timer fire time
        const stateAtFire = agentStateRef.current;
        if (stateAtFire === "thinking" || stateAtFire === "responding") {
          return;
        }
        if (hasSentRef.current) {
          return;
        }
        const toSend = extractSpeech(lastTranscriptRef.current);
        if (toSend) {
          console.log(`[DEBUG ${new Date().toISOString()}] Silence timer fired`);
          sendTranscript(toSend, "silence_timer");
        }
      }, 1500);
    }
  };

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onPartialTranscript: (data) => {
      if (typeof data?.text === "string") {
        console.log(`[DEBUG ${new Date().toISOString()}] Partial:`, data.text);
        setTranscript(data.text);
        resetSilenceTimer(data.text);
      }
    },
    onCommittedTranscript: (data) => {
      const text = typeof data?.text === "string" ? data.text : "";
      const speech = extractSpeech(text);
      console.log(`[DEBUG ${new Date().toISOString()}] Committed:`, text, "-> speech:", speech);
      if (!speech) return;
      setTranscript(text);
      // Clear timer and send immediately on commit
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      sendTranscript(speech, "committed");
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
              setAssistantResponse("");
              setDisplayedResponse("");
              fullResponseRef.current = "";
              setResponseVisible(false);
              // Stay in "thinking" - we'll switch to "responding" when audio starts
              // Clear any pending fade timer
              if (fadeTimerRef.current) {
                clearTimeout(fadeTimerRef.current);
              }
              // Clear word reveal interval
              if (wordRevealIntervalRef.current) {
                clearInterval(wordRevealIntervalRef.current);
                wordRevealIntervalRef.current = null;
              }
              // Clear silence timer to prevent re-sending
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
              }
              // Disconnect scribe while agent is processing/responding
              try {
                scribeRef.current.disconnect();
              } catch {
                // ignore
              }
              // Prepare for new audio chunks
              audioChunksRef.current = [];
            }

            if (type === "assistant_token") {
              const text = typeof msg.text === "string" ? msg.text : "";
              setAssistantResponse((prev) => {
                const newText = prev + text;
                fullResponseRef.current = newText; // Store for word reveal
                return newText;
              });
              // Don't show text yet - wait for audio to start playing
              setAgentState("responding");
            }

            if (type === "assistant_done") {
              // Don't reset hasSentRef yet - wait until audio finishes
              // This prevents re-sending while audio is playing
              
              const chunks = audioChunksRef.current;
              if (chunks.length > 0) {
                const blob = new Blob(chunks, { type: "audio/mpeg" });
                const url = URL.createObjectURL(blob);
                audioUrlRef.current = url;
                const audio = new Audio(url);
                audioRef.current = audio;
                
                // When we know the duration, start word reveal
                audio.onloadedmetadata = () => {
                  const durationMs = audio.duration * 1000;
                  setResponseVisible(true);
                  startWordReveal(fullResponseRef.current, durationMs);
                };
                
                // Fade out response text after audio finishes, then go back to listening
                audio.onended = () => {
                  // Clear word reveal interval
                  if (wordRevealIntervalRef.current) {
                    clearInterval(wordRevealIntervalRef.current);
                    wordRevealIntervalRef.current = null;
                  }
                  // Show full text at end
                  setDisplayedResponse(fullResponseRef.current);
                  
                  // Reset for next user input
                  lastTranscriptRef.current = "";
                  sentTextRef.current = "";
                  hasSentRef.current = false;
                  setTranscript("");
                  
                  // Reconnect scribe with fresh token
                  void reconnectScribe();
                  
                  setAgentState("listening");
                  fadeTimerRef.current = setTimeout(() => {
                    setResponseVisible(false);
                  }, 1000);
                };
                
                void audio.play().catch((err) => {
                  console.error("Audio playback failed:", err);
                  // Show full text immediately if audio fails
                  setDisplayedResponse(fullResponseRef.current);
                  setResponseVisible(true);
                  
                  // Reset for next input and fade out
                  lastTranscriptRef.current = "";
                  sentTextRef.current = "";
                  hasSentRef.current = false;
                  setTranscript("");
                  
                  // Reconnect scribe with fresh token
                  void reconnectScribe();
                  
                  fadeTimerRef.current = setTimeout(() => {
                    setAgentState("listening");
                    setResponseVisible(false);
                  }, 3000);
                });
              } else {
                // No audio - show full text immediately
                setDisplayedResponse(fullResponseRef.current);
                setResponseVisible(true);
                
                // Reset for next input and fade out
                lastTranscriptRef.current = "";
                sentTextRef.current = "";
                hasSentRef.current = false;
                setTranscript("");
                
                // Reconnect scribe with fresh token
                void reconnectScribe();
                
                fadeTimerRef.current = setTimeout(() => {
                  setAgentState("listening");
                  setResponseVisible(false);
                }, 3000);
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
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
      if (wordRevealIntervalRef.current) {
        clearInterval(wordRevealIntervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (websocketRef.current?.readyState !== WebSocket.OPEN) {
        throw new Error("WebSocket not connected");
      }

      // Play greeting audio with word-by-word text reveal
      const greetingText = "Hi — I can help you put together a quick supply order for the site.";
      setAgentState("greeting");
      setAssistantResponse(greetingText);
      setDisplayedResponse(""); // Start empty for word reveal
      setResponseVisible(true);
      
      try {
        const greetingAudio = new Audio("/greeting.mp3");
        
        // Start word reveal when we know the duration
        greetingAudio.onloadedmetadata = () => {
          const durationMs = greetingAudio.duration * 1000;
          startWordReveal(greetingText, durationMs);
        };
        
        await greetingAudio.play();
        // Wait for greeting to finish before starting recording
        await new Promise<void>((resolve) => {
          greetingAudio.onended = () => {
            // Show full text at end
            setDisplayedResponse(greetingText);
            if (wordRevealIntervalRef.current) {
              clearInterval(wordRevealIntervalRef.current);
              wordRevealIntervalRef.current = null;
            }
            resolve();
          };
          greetingAudio.onerror = () => {
            // Show full text if audio fails
            setDisplayedResponse(greetingText);
            resolve();
          };
        });
      } catch (audioErr) {
        console.warn("Greeting audio failed:", audioErr);
        // Show full text if audio fails
        setDisplayedResponse(greetingText);
      }

      const resolvedTokenEndpoint = tokenEndpoint ?? apiUrl("/api/v1/elevenlabs-token/");
      
      // Store endpoint for reconnection
      tokenEndpointRef.current = resolvedTokenEndpoint;

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
        languageCode: "en", // Force English to prevent wrong language detection
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Reset state for new recording (but keep greeting visible)
      lastTranscriptRef.current = "";
      hasSentRef.current = false;
      sentTextRef.current = "";
      setTranscript("");
      setTranscriptVisible(false);
      // Don't clear assistantResponse - keep the greeting text showing
      setResponseVisible(true);
      
      setIsRecording(true);
      setAgentState("listening");
      
      // Fade out greeting after a bit
      fadeTimerRef.current = setTimeout(() => {
        setResponseVisible(false);
      }, 4000);
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
    tokenEndpointRef.current = null; // Clear endpoint on stop
    setIsRecording(false);
    setAgentState("idle");
  };

  const handleToggle = () => {
    if (isRecording) stopRecording();
    else void startRecording();
  };

  const getStatusDisplay = () => {
    if (connectionStatus.startsWith("Error:")) return connectionStatus;
    if (connectionStatus === "Disconnected") return "Disconnected";
    if (connectionStatus === "Connecting...") return "Connecting...";
    if (!isRecording) return "Ready";
    
    switch (agentState) {
      case "greeting": return "Greeting...";
      case "listening": return "Listening...";
      case "thinking": return `Thinking${".".repeat(thinkingDots)}`;
      case "responding": return "Responding...";
      default: return "Ready";
    }
  };

  return (
    <div className={cn("w-full max-w-md flex flex-col items-center gap-3", className)}>
      <Button
        type="button"
        variant="destructive"
        onClick={handleToggle}
        className="w-full h-12 text-base font-semibold"
      >
        {isRecording ? "Stop" : "Start Voice Assistant"}
      </Button>

      <div className="text-sm font-medium">
        <span
          className={cn(
            connectionStatus.startsWith("Error:")
              ? "text-destructive"
              : agentState === "greeting"
                ? "text-purple-600"
                : agentState === "listening"
                  ? "text-green-600"
                  : agentState === "thinking"
                    ? "text-yellow-600"
                    : agentState === "responding"
                      ? "text-blue-600"
                      : "text-muted-foreground",
          )}
        >
          {getStatusDisplay()}
        </span>
      </div>

      {/* Text display - clean, minimal, just fades in/out */}
      <p 
        className={cn(
          "w-full text-center text-base text-muted-foreground italic transition-opacity duration-500",
          transcriptVisible && transcript ? "opacity-70" : "opacity-0"
        )}
      >
        {extractSpeech(transcript)}
      </p>

      <p 
        className={cn(
          "w-full text-center text-base text-foreground transition-opacity duration-700",
          responseVisible && displayedResponse ? "opacity-100" : "opacity-0"
        )}
      >
        {displayedResponse}
      </p>
    </div>
  );
}

export default TestButton;