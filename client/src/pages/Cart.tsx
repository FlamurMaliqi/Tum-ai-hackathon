import { useState, useEffect } from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNav } from "@/components/BottomNav";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

interface Bauprojekt {
  id: number;
  name: string;
  description: string;
  location: string;
  status: string;
}

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Bauprojekt[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(apiUrl("/api/v1/bauprojekte/?status=active"));
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };
    
    fetchProjects();
  }, []);

  const handleSubmitOrder = async () => {
    if (items.length === 0) return;
    
    if (!selectedProjectId) {
      toast({
        title: "Projekt erforderlich",
        description: "Bitte wählen Sie ein Bauprojekt aus.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare order data
      const orderData = {
        projekt_id: parseInt(selectedProjectId),
        items: items.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          unit: item.product.unit,
        })),
        notes: orderNotes || null,
      };

      // Submit order to backend
      const response = await fetch(apiUrl("/api/v1/bestellungen/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit order");
      }

      const newOrder = await response.json();
      
      clearCart();
      
      toast({
        title: "Bestellung aufgegeben",
        description: `Bestellung #${newOrder.id} wurde erfolgreich erstellt.`,
      });
      
      navigate("/orders");
    } catch (error) {
      console.error("Failed to submit order:", error);
      toast({
        title: "Fehler",
        description: "Bestellung konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
            {/* Project Selection */}
            <div>
              <label className="text-sm text-muted-foreground">Bauprojekt *</label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="mt-1 rounded-xl bg-secondary border-0">
                  <SelectValue placeholder="Projekt auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {projects.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Keine Projekte verfügbar
                    </SelectItem>
                  ) : (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{project.name}</span>
                          {project.location && (
                            <span className="text-xs text-muted-foreground">{project.location}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
          disabled={isSubmitting || !selectedProjectId}
          className="w-full h-12 rounded-xl text-base"
        >
          {isSubmitting ? "Wird gesendet..." : "Bestellung aufgeben"}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
