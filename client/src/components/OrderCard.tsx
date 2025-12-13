import { Order, OrderStatus } from "@/data/orders";
import { cn } from "@/lib/utils";
import { ChevronRight, Clock, CheckCircle, XCircle, Truck, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const statusConfig: Record<OrderStatus, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: "Ausstehend", icon: Clock, className: "bg-warning/10 text-warning" },
  approved: { label: "Genehmigt", icon: CheckCircle, className: "bg-success/10 text-success" },
  rejected: { label: "Abgelehnt", icon: XCircle, className: "bg-destructive/10 text-destructive" },
  delivered: { label: "Geliefert", icon: Truck, className: "bg-secondary text-muted-foreground" },
};

interface OrderCardProps {
  order: Order;
  showDetails?: boolean;
  disableLink?: boolean;
}

export function OrderCard({ order, showDetails = false, disableLink = false }: OrderCardProps) {
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  const content = (
    <div className="bg-card rounded-2xl border border-border/50 p-4 card-shadow transition-all duration-200 hover:card-shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{order.id}</span>
            <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium", status.className)}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 truncate">
            {order.projectName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {order.createdAt.toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="text-right shrink-0 flex items-center gap-2">
          <span className="font-bold text-lg">€{order.total.toFixed(2)}</span>
          {!showDetails && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-sm font-medium mb-3">Artikel ({order.items.length})</p>
          <div className="space-y-2.5">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.quantity}× {item.productName}
                </span>
                <span className="font-medium">€{(item.quantity * item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>
          {order.adminNotes && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Admin-Notizen</p>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.adminNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (showDetails || disableLink) return content;

  return (
    <Link to={`/orders/${order.id}`} className="block">
      {content}
    </Link>
  );
}
