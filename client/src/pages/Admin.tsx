import { useState } from "react";
import { ArrowLeft, Lock, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderCard } from "@/components/OrderCard";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ADMIN_PIN = "1234";

export default function Admin() {
  const navigate = useNavigate();
  const { orders, updateOrderStatus } = useOrders();
  const { toast } = useToast();
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const handlePinSubmit = () => {
    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPin("");
    }
  };

  const handleApprove = (orderId: string) => {
    updateOrderStatus(orderId, "approved");
    toast({
      title: "Bestellung genehmigt",
      description: `Bestellung ${orderId} wurde genehmigt.`,
    });
    setSelectedOrder(null);
  };

  const handleReject = (orderId: string) => {
    updateOrderStatus(orderId, "rejected");
    toast({
      title: "Bestellung abgelehnt",
      description: `Bestellung ${orderId} wurde abgelehnt.`,
      variant: "destructive",
    });
    setSelectedOrder(null);
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const otherOrders = orders.filter((o) => o.status !== "pending");
  const selected = orders.find((o) => o.id === selectedOrder);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex flex-col">
        <header className="flex items-center gap-3 p-4 border-b border-border/50">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Admin-Bereich</h1>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="bg-secondary rounded-full p-6 mb-6">
            <Lock className="h-12 w-12 text-muted-foreground" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">PIN eingeben</h2>
          <p className="text-muted-foreground mb-8 text-center">
            Geben Sie Ihren 4-stelligen Admin-PIN ein
          </p>

          <div className="w-full max-w-xs">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ""));
                setError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
              placeholder="• • • •"
              className={cn(
                "text-center text-2xl tracking-[0.5em] h-14 rounded-xl bg-card border-border/50",
                error && "border-destructive ring-destructive"
              )}
            />
            {error && (
              <p className="text-destructive text-sm text-center mt-2">
                Falscher PIN. Bitte erneut versuchen.
              </p>
            )}
          </div>

          <Button
            onClick={handlePinSubmit}
            className="w-full max-w-xs mt-6 h-12 rounded-xl"
            disabled={pin.length !== 4}
          >
            Anmelden
          </Button>
        </main>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="min-h-screen bg-background">
        <header className="flex items-center gap-3 p-4 glass border-b border-border/50 sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{selected.id}</h1>
            <p className="text-sm text-muted-foreground">{selected.projectName}</p>
          </div>
        </header>

        <main className="p-4 pb-32">
          <OrderCard order={selected} showDetails />

          <div className="mt-4 bg-card rounded-2xl border border-border/50 p-4 card-shadow">
            <h3 className="font-semibold mb-3">Bestelldetails</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Polier</span>
                <span className="font-medium">{selected.foremanName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Projekt</span>
                <span className="font-medium">{selected.projectName}</span>
              </div>
            </div>
          </div>

          {selected.status === "pending" && (
            <div className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 p-4 safe-bottom">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-14 rounded-xl text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleReject(selected.id)}
                >
                  <X className="h-5 w-5 mr-2" />
                  Ablehnen
                </Button>
                <Button
                  className="flex-1 h-14 rounded-xl bg-success hover:bg-success/90"
                  onClick={() => handleApprove(selected.id)}
                >
                  <Check className="h-5 w-5 mr-2" />
                  Genehmigen
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 p-4 glass border-b border-border/50 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Admin-Bereich</h1>
          <p className="text-sm text-muted-foreground">Bestellungen verwalten</p>
        </div>
      </header>

      <main className="p-4">
        {pendingOrders.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <span className="bg-warning text-warning-foreground text-xs px-2.5 py-1 rounded-lg font-bold">
                {pendingOrders.length}
              </span>
              Ausstehende Bestellungen
            </h2>
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order.id)}
                  className="cursor-pointer"
                >
                  <OrderCard order={order} />
                </div>
              ))}
            </div>
          </div>
        )}

        {otherOrders.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">Bearbeitete Bestellungen</h2>
            <div className="space-y-3">
              {otherOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order.id)}
                  className="cursor-pointer"
                >
                  <OrderCard order={order} />
                </div>
              ))}
            </div>
          </div>
        )}

        {orders.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Keine Bestellungen vorhanden</p>
          </div>
        )}
      </main>
    </div>
  );
}
