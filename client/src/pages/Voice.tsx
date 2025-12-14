import { useState } from "react";
import { ArrowLeft, Minus, Plus, X, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { products } from "@/data/products";
import { VoiceAssistant } from "@/components/VoiceAssistant";

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
        {/* Order List Section */}
        {orderItems.length > 0 && (
          <div className="px-4 py-4">
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
          <VoiceAssistant />
        </main>
      </div>
    </div>
  );
}
