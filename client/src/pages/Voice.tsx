import { useState, useEffect } from "react";
import { ArrowLeft, Minus, Plus, X, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { products } from "@/data/products";

interface VoiceOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
}

const mockOrderSequence = [
  { productId: "C001", name: "Schraube TX20 4x40", quantity: 100, unit: "Stk" },
  { productId: "C005", name: "Dübel 8mm", quantity: 50, unit: "Stk" },
  { productId: "C024", name: "Arbeitshandschuhe Gr. 9", quantity: 10, unit: "Paar" },
];

const mockResponses = [
  "Verstanden! Ich habe 100 Schrauben TX20 4x40 zu Ihrer Bestellung hinzugefügt.",
  "Kein Problem! Ich füge 50 Dübel 8mm hinzu.",
  "Alles klar! 10 Paar Arbeitshandschuhe Größe 9 wurden hinzugefügt.",
  "Die Bestellung ist bereit. Sagen Sie 'Bestellen' zum Abschließen.",
];

export default function Voice() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [status, setStatus] = useState<"listening" | "processing" | "speaking">("listening");
  const [currentText, setCurrentText] = useState("Ich höre zu...");
  const [responseIndex, setResponseIndex] = useState(0);
  const [orderItems, setOrderItems] = useState<VoiceOrderItem[]>([]);

  useEffect(() => {
    if (status === "listening") {
      const timer = setTimeout(() => {
        setStatus("processing");
        setCurrentText("Verarbeite...");
      }, 3000);
      return () => clearTimeout(timer);
    }
    
    if (status === "processing") {
      const timer = setTimeout(() => {
        setStatus("speaking");
        // Add item to order list
        if (responseIndex < mockOrderSequence.length) {
          const newItem = mockOrderSequence[responseIndex];
          setOrderItems(prev => {
            const existing = prev.find(item => item.productId === newItem.productId);
            if (existing) {
              return prev.map(item => 
                item.productId === newItem.productId 
                  ? { ...item, quantity: item.quantity + newItem.quantity }
                  : item
              );
            }
            return [...prev, newItem];
          });
        }
        setCurrentText(mockResponses[responseIndex % mockResponses.length]);
        setResponseIndex((prev) => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
    
    if (status === "speaking") {
      const timer = setTimeout(() => {
        setStatus("listening");
        setCurrentText("Ich höre zu...");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, responseIndex]);

  const handleVoiceClick = () => {
    if (status === "speaking") {
      setStatus("listening");
      setCurrentText("Ich höre zu...");
    }
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

      {/* Main Voice Interface */}
      <main className="flex-1 flex flex-col items-center justify-end px-6 pb-12">
        {/* Status Text - moved above orb */}
        <div className="text-center max-w-sm mb-8">
          <p 
            className={`text-lg font-medium transition-all duration-300 ${
              status === "speaking" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {currentText}
          </p>
        </div>

        {/* Animated Orb */}
        <div className="relative mb-6">
          {/* Outer glow rings */}
          <div 
            className={`absolute inset-0 rounded-full transition-all duration-1000 ${
              status === "listening" 
                ? "bg-primary/20 scale-[1.8] animate-pulse" 
                : status === "speaking"
                ? "bg-primary/15 scale-[1.6]"
                : "bg-transparent scale-100"
            }`} 
          />
          <div 
            className={`absolute inset-0 rounded-full transition-all duration-700 ${
              status === "listening" 
                ? "bg-primary/30 scale-[1.4] animate-pulse" 
                : status === "speaking"
                ? "bg-primary/25 scale-[1.3]"
                : "bg-transparent scale-100"
            }`} 
          />
          
          {/* Main orb button */}
          <button
            onClick={handleVoiceClick}
            className={`relative h-24 w-24 rounded-full flex items-center justify-center transition-all duration-500 ${
              status === "listening"
                ? "bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-2xl shadow-primary/40"
                : status === "processing"
                ? "bg-gradient-to-br from-primary/80 to-primary/60 shadow-lg"
                : "bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/30"
            }`}
          >
            {/* Animated wave bars */}
            <div className="flex items-center justify-center gap-0.5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`bg-primary-foreground rounded-full transition-all ${
                    status === "listening" || status === "speaking"
                      ? "w-1.5 animate-pulse"
                      : "w-1.5 h-5"
                  }`}
                  style={{
                    height: status === "listening" || status === "speaking" 
                      ? `${Math.random() * 24 + 12}px` 
                      : "20px",
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: status === "speaking" ? "0.3s" : "0.5s",
                  }}
                />
              ))}
            </div>
          </button>
        </div>

        {/* Status Indicator */}
        <div className="mt-6 flex items-center gap-2">
          <div 
            className={`h-2 w-2 rounded-full transition-all ${
              status === "listening"
                ? "bg-success animate-pulse"
                : status === "processing"
                ? "bg-warning animate-pulse"
                : "bg-primary animate-pulse"
            }`} 
          />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            {status === "listening" && "Hört zu"}
            {status === "processing" && "Verarbeitet"}
            {status === "speaking" && "Antwort"}
          </span>
        </div>
      </main>
    </div>
  );
}
