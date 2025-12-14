import { useOrders } from "@/hooks/useOrders";
import { BottomNav } from "@/components/BottomNav";
import { OrderCard } from "@/components/OrderCard";
import { Package } from "lucide-react";

export default function Orders() {
  const { orders, isLoading, error } = useOrders();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="p-4 border-b border-border/50">
        <h1 className="text-xl font-bold">Meine Bestellungen</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Lade..." : `${orders.length} Bestellungen`}
        </p>
      </header>

      <main className="p-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-muted-foreground">Lade Bestellungen...</p>
          </div>
        )}
        
        {error && (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-destructive">Fehler beim Laden der Bestellungen</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error.message}
            </p>
          </div>
        )}
        
        {!isLoading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-secondary rounded-full p-6 mb-4">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Keine Bestellungen</h2>
            <p className="text-muted-foreground text-center">
              Sie haben noch keine Bestellungen aufgegeben
            </p>
          </div>
        )}
        
        {!isLoading && !error && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
