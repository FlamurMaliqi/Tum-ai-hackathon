import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/BottomNav";
import { useCart } from "@/hooks/useCart";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const { addOrder } = useOrders();
  const { toast } = useToast();
  const [foremanName, setForemanName] = useState("Hans Müller");
  const [projectName, setProjectName] = useState("Bauprojekt Mitte");

  const handleSubmitOrder = () => {
    if (items.length === 0) return;
    
    const order = addOrder(items, foremanName, projectName);
    clearCart();
    
    toast({
      title: "Bestellung aufgegeben",
      description: `Bestellung ${order.id} wurde erfolgreich erstellt.`,
    });
    
    navigate("/orders");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="p-4 border-b border-border/50">
          <h1 className="text-xl font-bold">Warenkorb</h1>
        </header>

        <main className="flex flex-col items-center justify-center p-8 min-h-[60vh]">
          <div className="bg-secondary rounded-full p-6 mb-4">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Warenkorb ist leer</h2>
          <p className="text-muted-foreground text-center mb-6">
            Fügen Sie Produkte über die Suche hinzu
          </p>
          <Button onClick={() => navigate("/search")} className="rounded-xl h-12 px-6">
            Produkte suchen
          </Button>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-52">
      <header className="p-4 border-b border-border/50">
        <h1 className="text-xl font-bold">Warenkorb</h1>
        <p className="text-sm text-muted-foreground">{items.length} Artikel</p>
      </header>

      <main className="p-4">
        {/* Order Info */}
        <div className="bg-card rounded-2xl border border-border/50 p-4 mb-4 card-shadow">
          <h2 className="font-semibold mb-3">Bestellinformationen</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Polier</label>
              <Input
                value={foremanName}
                onChange={(e) => setForemanName(e.target.value)}
                className="mt-1 rounded-xl bg-secondary border-0"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Projekt</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="mt-1 rounded-xl bg-secondary border-0"
              />
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="bg-card rounded-2xl border border-border/50 p-4 card-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-medium">{item.product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    €{item.product.price.toFixed(2)} / {item.product.unit}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive h-9 w-9 rounded-xl"
                  onClick={() => removeItem(item.product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center bg-secondary rounded-xl overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-none"
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity - 1)
                    }
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-semibold">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-none"
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity + 1)
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="font-bold text-lg">
                  €{(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Fixed Footer */}
      <div className="fixed bottom-20 left-0 right-0 glass border-t border-border/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-base font-medium text-muted-foreground">Gesamt</span>
          <span className="text-2xl font-bold">€{totalPrice.toFixed(2)}</span>
        </div>
        <Button
          onClick={handleSubmitOrder}
          className="w-full h-14 text-base font-semibold rounded-xl"
          disabled={!foremanName || !projectName}
        >
          Bestellung aufgeben
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
