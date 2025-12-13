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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 sticky top-0 z-10 glass">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">CMats Assistent</h1>
            <p className="text-xs text-muted-foreground">KI-Sprachbestellung</p>
          </div>
        </div>
        {orderItems.length > 0 && (
          <Button onClick={handleAddToCart} className="rounded-xl gap-2">
            <ShoppingCart className="h-4 w-4" />
            In Warenkorb
          </Button>
        )}
      </header>

      {/* Full Transcript Display */}
      {fullTranscript.length > 0 && (
        <div className="px-4 py-3 flex-shrink-0">
          <p className="text-sm font-medium text-muted-foreground mb-2">Transkript</p>
          <div className="bg-card rounded-xl p-3 card-shadow max-h-32 overflow-y-auto">
            {fullTranscript.map((text, idx) => (
              <p key={idx} className="text-sm mb-1">
                {text}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Order List */}
      {orderItems.length > 0 && (
        <div className="px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Ihre Bestellung</p>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
              {orderItems.length} {orderItems.length === 1 ? "Artikel" : "Artikel"}
            </span>
          </div>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {orderItems.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between bg-card rounded-xl p-3 card-shadow animate-fade-in"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateItemQuantity(item.productId, -10)}
                    className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-semibold text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateItemQuantity(item.productId, 10)}
                    className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center active:scale-95 transition-transform ml-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Voice Interface */}
      <main className="flex-1 flex flex-col items-center justify-end px-6 pb-12">
        {/* Status Text */}
        <div className="text-center max-w-sm mb-8">
          <p
            className={`text-lg font-medium transition-all duration-300 ${
              isRecording ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {currentText}
          </p>
          
          {/* Show partial transcript if available */}
          {scribe.partialTranscript && (
            <p className="text-sm text-primary mt-2 animate-pulse">
              {scribe.partialTranscript}
            </p>
          )}
        </div>

        {/* Animated Orb */}
        <div className="relative mb-6">
          {/* Outer glow rings - only show when recording */}
          {isRecording && (
            <>
              <div className="absolute inset-0 rounded-full bg-primary/20 scale-[1.8] animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-primary/30 scale-[1.4] animate-pulse" />
            </>
          )}

          {/* Main orb button */}
          <button
            onClick={handleToggleRecording}
            disabled={scribe.isConnected && !isRecording}
            className={`relative h-24 w-24 rounded-full flex items-center justify-center transition-all duration-500 ${
              isRecording
                ? "bg-gradient-to-br from-destructive via-destructive/90 to-destructive/70 shadow-2xl shadow-destructive/40"
                : "bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/30"
            }`}
          >
            {isRecording ? (
              <MicOff className="h-10 w-10 text-primary-foreground" />
            ) : (
              <Mic className="h-10 w-10 text-primary-foreground" />
            )}
          </button>
        </div>

        {/* Status Indicator */}
        <div className="mt-6 flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full transition-all ${
              isRecording ? "bg-destructive animate-pulse" : "bg-muted"
            }`}
          />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            {isRecording ? "Aufnahme läuft" : "Bereit"}
          </span>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center max-w-md">
          <p className="text-xs text-muted-foreground">
            {isRecording
              ? "Sprechen Sie Ihre Bestellung. Klicken Sie erneut, um zu stoppen."
              : "Klicken Sie auf das Mikrofon, um mit der Sprachbestellung zu beginnen."}
          </p>
        </div>
      </main>
    </div>
  );
}
