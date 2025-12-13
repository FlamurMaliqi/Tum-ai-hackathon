import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { OrderCard } from "@/components/OrderCard";
import { useOrders } from "@/hooks/useOrders";

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders } = useOrders();

  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="flex items-center gap-3 p-4 border-b border-border/50">
          <Button variant="ghost" size="icon" onClick={() => navigate("/orders")} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Bestellung nicht gefunden</h1>
        </header>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="flex items-center gap-3 p-4 glass border-b border-border/50 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate("/orders")} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">{order.id}</h1>
          <p className="text-sm text-muted-foreground">{order.projectName}</p>
        </div>
      </header>

      <main className="p-4">
        <OrderCard order={order} showDetails />

        <div className="mt-4 bg-card rounded-2xl border border-border/50 p-4 card-shadow">
          <h3 className="font-semibold mb-3">Bestelldetails</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Polier</span>
              <span className="font-medium">{order.foremanName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Projekt</span>
              <span className="font-medium">{order.projectName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Erstellt</span>
              <span className="font-medium">
                {order.createdAt.toLocaleDateString("de-DE")} {order.createdAt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aktualisiert</span>
              <span className="font-medium">
                {order.updatedAt.toLocaleDateString("de-DE")} {order.updatedAt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>

        {/* Admin Notes Section */}
        {order.adminNotes && (
          <div className="mt-4 bg-card rounded-2xl border border-border/50 p-4 card-shadow">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Admin-Notizen</h3>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.adminNotes}</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
