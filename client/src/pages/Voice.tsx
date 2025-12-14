import { useState, useEffect } from "react";
import { ArrowLeft, Minus, Plus, X, ShoppingCart, Mic, MicOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { products } from "@/data/products";
import { useScribe } from "@elevenlabs/react";
import { apiUrl } from "@/lib/api";

interface VoiceOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
}

export default function Voice() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [isRecording, setIsRecording] = useState(false);
  const [currentText, setCurrentText] = useState("Klicken Sie auf das Mikrofon, um zu beginnen");
  const [orderItems, setOrderItems] = useState<VoiceOrderItem[]>([]);
  const [fullTranscript, setFullTranscript] = useState<string[]>([]);

  // Initialize ElevenLabs Scribe hook
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onPartialTranscript: (data) => {
      // Show live/partial transcripts as user speaks
      console.log("📝 Partial transcript:", data.text);
      setCurrentText(data.text || "Ich höre zu...");
    },
    onCommittedTranscript: (data) => {
      // When a segment is committed (pause detected), add to full transcript
      const text = data.text || "";
      console.log("✅ Committed transcript:", text);
      if (text.trim()) {
        setFullTranscript((prev) => [...prev, text]);
        setCurrentText("Ich höre zu...");
        
        // TODO: Process the committed text for product extraction
        // This is where you'd implement NLP/AI to extract products and quantities
      }
    },
    onCommittedTranscriptWithTimestamps: (data) => {
      console.log("⏱️ Transcript with timestamps:", data);
    },
    onError: (error) => {
      console.error("❌ Scribe error:", error);
      setCurrentText("Fehler: " + (error.message || "Unbekannter Fehler"));
      setIsRecording(false);
    },
    onOpen: () => {
      console.log("🔌 WebSocket connection opened");
    },
    onClose: () => {
      console.log("🔌 WebSocket connection closed");
    },
  });

  // Fetch token from backend and connect when user starts recording
  const startRecording = async () => {
    try {
      console.log("🎤 Starting recording...");
      console.log("📡 Fetching token from backend...");
      
      // Fetch single-use token from backend
      const response = await fetch(apiUrl("/api/v1/elevenlabs-token/"));
      
      if (!response.ok) {
        console.error("❌ Token fetch failed:", response.status, response.statusText);
        throw new Error("Failed to fetch ElevenLabs token");
      }
      
      const { token } = await response.json();
      console.log("✅ Token received:", token ? `${token.substring(0, 20)}...` : "empty");
      
      console.log("🔌 Connecting to ElevenLabs...");
      
      // Connect to ElevenLabs with microphone
      await scribe.connect({
        token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      
      console.log("✅ Connected successfully!");
      setIsRecording(true);
      setCurrentText("Ich höre zu...");
    } catch (error) {
      console.error("❌ Failed to start recording:", error);
      setCurrentText("Fehler beim Starten der Aufnahme: " + (error instanceof Error ? error.message : "Unbekannter Fehler"));
    }
  };

  // Stop recording
  const stopRecording = () => {
    scribe.disconnect();
    setIsRecording(false);
    setCurrentText("Aufnahme beendet");
  };

  // Toggle recording state
  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Update item quantity
  const updateItemQuantity = (productId: string, delta: number) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  // Remove item from order
  const removeItem = (productId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Add items to cart and navigate
  const handleAddToCart = () => {
    orderItems.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        addItem(product, item.quantity);
      }
    });
    navigate("/cart");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scribe.isConnected) {
        scribe.disconnect();
      }
    };
  }, [scribe]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="flex items-center justify-between h-16 px-4 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-base font-semibold text-foreground leading-tight">
                Voice Assistant
              </h1>
              <p className="text-xs text-muted-foreground leading-tight">
                AI-powered ordering
              </p>
            </div>
          </div>
          {orderItems.length > 0 && (
            <Button 
              onClick={handleAddToCart}
              size="sm"
              className="gap-2 h-9"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Add to Cart</span>
            </Button>
          )}
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 flex flex-col max-w-screen-xl w-full mx-auto">
        {/* Transcript Section */}
        {fullTranscript.length > 0 && (
          <div className="px-4 pt-6 pb-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Transcript
            </h2>
            <div className="bg-muted/30 border border-border rounded-lg p-4 max-h-32 overflow-y-auto">
              <div className="space-y-2">
                {fullTranscript.map((text, idx) => (
                  <p key={idx} className="text-sm text-foreground leading-relaxed">
                    {text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Order List Section */}
        {orderItems.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Current Order
              </h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {orderItems.length} {orderItems.length === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {orderItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between bg-card border border-border rounded-lg p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-sm text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateItemQuantity(item.productId, -10)}
                      className="h-8 w-8 rounded border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-10 text-center font-medium text-sm tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateItemQuantity(item.productId, 10)}
                      className="h-8 w-8 rounded border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="h-8 w-8 rounded border border-destructive/20 bg-background text-destructive flex items-center justify-center hover:bg-destructive/10 transition-colors ml-1"
                      aria-label="Remove item"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voice Interface - Centered */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 min-h-[400px]">
          {/* Status Text */}
          <div className="text-center max-w-md mb-12">
            <p className="text-base font-medium text-foreground leading-relaxed">
              {currentText}
            </p>
            
            {scribe.partialTranscript && (
              <p className="text-sm text-primary mt-3 leading-relaxed">
                {scribe.partialTranscript}
              </p>
            )}
          </div>

          {/* Voice Button */}
          <div className="relative">
            {/* Recording indicator ring */}
            {isRecording && (
              <div 
                className="absolute inset-0 -m-3 rounded-full border-2 border-destructive/30 animate-pulse"
                aria-hidden="true"
              />
            )}

            {/* Main button */}
            <button
              onClick={handleToggleRecording}
              disabled={scribe.isConnected && !isRecording}
              className={`relative h-20 w-20 rounded-full flex items-center justify-center transition-all border-2 ${
                isRecording
                  ? "bg-destructive border-destructive hover:bg-destructive/90"
                  : "bg-primary border-primary hover:bg-primary/90"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? (
                <MicOff className="h-8 w-8 text-primary-foreground" />
              ) : (
                <Mic className="h-8 w-8 text-primary-foreground" />
              )}
            </button>
          </div>

          {/* Status Indicator */}
          <div className="mt-8 flex items-center gap-2">
            <div
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                isRecording ? "bg-destructive" : "bg-muted-foreground/40"
              }`}
              aria-hidden="true"
            />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {isRecording ? "Recording" : "Ready"}
            </span>
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center max-w-md">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isRecording
                ? "Speak your order clearly. Click again to stop recording."
                : "Click the microphone button to begin voice ordering."}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
