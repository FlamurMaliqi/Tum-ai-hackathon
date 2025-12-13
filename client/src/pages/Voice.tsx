import { useState, useCallback } from "react";
import { ArrowLeft, Minus, Plus, X, ShoppingCart, Mic, MicOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { products } from "@/data/products";
import { useScribe } from "@elevenlabs/react";

interface VoiceOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
}

export default function Voice() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [orderItems, setOrderItems] = useState<VoiceOrderItem[]>([]);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Send transcript to backend for processing
  const sendToBackend = useCallback(async (text: string) => {
    try {
      const response = await fetch("/api/v1/websocket/process-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });

      if (response.ok) {
        const data = await response.json();
        // Process any order items returned from the backend
        if (data.orderItem) {
          setOrderItems(prev => {
            const existing = prev.find(item => item.productId === data.orderItem.productId);
            if (existing) {
              return prev.map(item =>
                item.productId === data.orderItem.productId
                  ? { ...item, quantity: item.quantity + data.orderItem.quantity }
                  : item
              );
            }
            return [...prev, data.orderItem];
          });
        }
      }
    } catch (err) {
      console.error("Error sending transcript to backend:", err);
    }
  }, []);

  // Configure useScribe hook
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onPartialTranscript: (data) => {
      setPartialTranscript(data.text);
    },
    onCommittedTranscript: (data) => {
      setFinalTranscript(prev => prev + " " + data.text);
      setPartialTranscript("");
      // Send finalized text to backend
      sendToBackend(data.text);
    },
    onError: (error) => {
      console.error("Scribe error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setError(errorMessage);
      setIsConnecting(false);
    },
  });

  // Start listening function
  const startListening = async () => {
    try {
      setError(null);
      setPartialTranscript("");
      setIsConnecting(true);

      // Fetch token from backend
      const response = await fetch("/api/v1/scribe/token");
      if (!response.ok) {
        throw new Error("Failed to fetch ElevenLabs token");
      }

      const data = await response.json();
      const token = data.token;

      if (!token) {
        throw new Error("No token received from server");
      }

      // Connect to ElevenLabs service
      await scribe.connect({
        token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        languageCode: "de", // German for the construction materials app
      });

      setIsConnecting(false);
    } catch (err) {
      console.error("Error starting transcription:", err);
      setError(err instanceof Error ? err.message : "Failed to start listening");
      setIsConnecting(false);
    }
  };

  // Stop listening function
  const stopListening = () => {
    scribe.disconnect();
    setPartialTranscript("");
    setIsConnecting(false);
  };

  const updateItemQuantity = (productId: string, delta: number) => {
    setOrderItems(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setOrderItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleAddToCart = () => {
    orderItems.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        addItem(product, item.quantity);
      }
    });
    navigate("/cart");
  };

  const clearTranscript = () => {
    setFinalTranscript("");
    setPartialTranscript("");
  };

  // Determine status for display
  const getStatusDisplay = () => {
    if (error) return { text: "Fehler", color: "bg-destructive" };
    if (scribe.isConnected) return { text: "Hört zu", color: "bg-success" };
    if (isConnecting) return { text: "Verbinde...", color: "bg-warning" };
    return { text: "Bereit", color: "bg-muted-foreground" };
  };

  const status = getStatusDisplay();

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
          <Button
            onClick={handleAddToCart}
            className="rounded-xl gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            In Warenkorb
          </Button>
        )}
      </header>

      {/* Order List */}
      {orderItems.length > 0 && (
        <div className="px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Ihre Bestellung</p>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
              {orderItems.length} {orderItems.length === 1 ? 'Artikel' : 'Artikel'}
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

      {/* Transcription Display */}
      <div className="px-4 py-3 flex-1 overflow-hidden">
        <div className="bg-card rounded-xl p-4 card-shadow h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Transkription</p>
            {(finalTranscript || partialTranscript) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearTranscript}
                className="text-xs h-7"
              >
                Löschen
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <p className="text-sm">
              {finalTranscript}
              {partialTranscript && (
                <span className="text-muted-foreground italic"> {partialTranscript}</span>
              )}
              {!finalTranscript && !partialTranscript && (
                <span className="text-muted-foreground">
                  Drücken Sie den Mikrofon-Button, um zu beginnen...
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 pb-2">
          <div className="bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Main Voice Interface */}
      <main className="flex flex-col items-center px-6 pb-12">
        {/* Animated Orb / Microphone Button */}
        <div className="relative mb-6">
          {/* Outer glow rings */}
          <div
            className={`absolute inset-0 rounded-full transition-all duration-1000 ${
              scribe.isConnected
                ? "bg-primary/20 scale-[1.8] animate-pulse"
                : isConnecting
                ? "bg-warning/20 scale-[1.4] animate-pulse"
                : "bg-transparent scale-100"
            }`}
          />
          <div
            className={`absolute inset-0 rounded-full transition-all duration-700 ${
              scribe.isConnected
                ? "bg-primary/30 scale-[1.4] animate-pulse"
                : isConnecting
                ? "bg-warning/30 scale-[1.2] animate-pulse"
                : "bg-transparent scale-100"
            }`}
          />

          {/* Main orb button */}
          <button
            onClick={scribe.isConnected ? stopListening : startListening}
            disabled={isConnecting}
            className={`relative h-24 w-24 rounded-full flex items-center justify-center transition-all duration-500 ${
              scribe.isConnected
                ? "bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-2xl shadow-primary/40"
                : isConnecting
                ? "bg-gradient-to-br from-warning/80 to-warning/60 shadow-lg cursor-wait"
                : "bg-gradient-to-br from-secondary to-secondary/80 shadow-xl hover:shadow-primary/20 hover:scale-105"
            }`}
          >
            {scribe.isConnected ? (
              <MicOff className="h-8 w-8 text-primary-foreground" />
            ) : (
              <Mic className={`h-8 w-8 ${isConnecting ? "text-warning-foreground animate-pulse" : "text-foreground"}`} />
            )}
          </button>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3 mb-4">
          <Button
            onClick={startListening}
            disabled={scribe.isConnected || isConnecting}
            variant={scribe.isConnected ? "secondary" : "default"}
            className="rounded-xl"
          >
            <Mic className="h-4 w-4 mr-2" />
            Start
          </Button>
          <Button
            onClick={stopListening}
            disabled={!scribe.isConnected}
            variant="outline"
            className="rounded-xl"
          >
            <MicOff className="h-4 w-4 mr-2" />
            Stop
          </Button>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full transition-all ${status.color} ${
              scribe.isConnected || isConnecting ? "animate-pulse" : ""
            }`}
          />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            {status.text}
          </span>
        </div>
      </main>
    </div>
  );
}
