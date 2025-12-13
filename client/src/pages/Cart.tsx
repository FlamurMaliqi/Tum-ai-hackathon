import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BottomNav } from "@/components/BottomNav";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useCreateOrder } from "@/hooks/useOrdersBackend";

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const { toast } = useToast();
  const createOrderMutation = useCreateOrder();
  
  const [foremanName, setForemanName] = useState("Hans Müller");
  const [projectName, setProjectName] = useState("Bauprojekt Mitte");
  const [orderNotes, setOrderNotes] = useState("");

  const handleSubmitOrder = async () => {
    if (items.length === 0) return;
    
    if (!foremanName.trim() || !projectName.trim()) {
      toast({
        title: "Informationen erforderlich",
        description: "Bitte geben Sie Polier-Name und Projekt-Name ein.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare order data in backend format
      const orderData = {
        polier_name: foremanName.trim(),
        projekt_name: projectName.trim(),
        items: items.map(item => ({
          artikel_id: item.product.id,
          artikel_name: item.product.name,
          menge: item.quantity,
          einheit: item.product.unit,
          einzelpreis: item.product.price,
        })),
        erstellt_von: undefined, // Can be added later if user authentication is implemented
      };

      const newOrder = await createOrderMutation.mutateAsync(orderData);
      
      clearCart();
      
      // Show different messages based on approval status
      const isAutoApproved = newOrder.status === 'approved';
      
      toast({
        title: isAutoApproved ? "Bestellung genehmigt" : "Bestellung eingereicht",
        description: isAutoApproved 
          ? `Bestellung ${newOrder.id} wurde automatisch genehmigt (unter 100€).`
          : `Bestellung ${newOrder.id} wartet auf Genehmigung (100€ oder mehr).`,
      });
      
      navigate("/orders");
    } catch (error) {
      console.error("Failed to submit order:", error);
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Bestellung konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
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
            {/* Foreman Name */}
            <div>
              <label className="text-sm text-muted-foreground">Polier-Name *</label>
              <Input
                value={foremanName}
                onChange={(e) => setForemanName(e.target.value)}
                placeholder="z.B. Hans Müller"
                className="mt-1 rounded-xl bg-secondary border-0"
              />
            </div>

            {/* Project Name */}
            <div>
              <label className="text-sm text-muted-foreground">Projekt-Name *</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="z.B. Bauprojekt Mitte"
                className="mt-1 rounded-xl bg-secondary border-0"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm text-muted-foreground">Notizen (optional)</label>
              <Textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Zusätzliche Informationen zur Bestellung..."
                className="mt-1 rounded-xl bg-secondary border-0 min-h-[80px]"
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
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-lg font-semibold">
                  €{(item.product.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Checkout Section */}
      <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border/50 p-4 card-shadow">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold">Gesamt</span>
          <span className="text-2xl font-bold text-primary">€{totalPrice.toFixed(2)}</span>
        </div>
        <Button
          onClick={handleSubmitOrder}
          disabled={createOrderMutation.isPending || !foremanName.trim() || !projectName.trim()}
          className="w-full h-12 rounded-xl text-base"
        >
          {createOrderMutation.isPending ? "Wird gesendet..." : "Bestellung aufgeben"}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
