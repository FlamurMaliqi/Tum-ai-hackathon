import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api";
import { Order, OrderItem, OrderStatus } from "@/data/orders";

// Backend order response type
interface BackendOrder {
  bestell_id: string;
  polier_name: string;
  projekt_name: string;
  gesamt_betrag: number | string;
  status: string;
  admin_notizen?: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
  erstellt_von?: string | null;
  genehmigt_von?: string | null;
  genehmigt_am?: string | null;
  bestellpositionen: BackendOrderItem[];
}

interface BackendAlternative {
  artikel_id: string;
  artikel_name: string;
  lieferant: string;
  preis_eur: number;
  einheit: string;
}

interface BackendOrderItem {
  position_id: number;
  artikel_id: string;
  artikel_name: string;
  menge: number;
  einheit: string;
  einzelpreis: number | string;
  gesamt_preis: number | string;
  position_nummer: number;
  notizen?: string | null;
  alternatives?: BackendAlternative[];
}

// Map backend order to frontend Order
function mapBackendOrderToOrder(backendOrder: BackendOrder): Order {
  const gesamt_betrag = typeof backendOrder.gesamt_betrag === "string" 
    ? parseFloat(backendOrder.gesamt_betrag) 
    : backendOrder.gesamt_betrag;
  
  const items: OrderItem[] = backendOrder.bestellpositionen.map((item) => {
    const einzelpreis = typeof item.einzelpreis === "string" 
      ? parseFloat(item.einzelpreis) 
      : item.einzelpreis;
    
    // Map alternatives if they exist
    const alternatives = item.alternatives?.map((alt) => ({
      name: `${alt.artikel_name} (${alt.lieferant})`,
      price: alt.preis_eur,
      artikel_id: alt.artikel_id,
    })) || [];
    
    return {
      productId: item.artikel_id,
      productName: item.artikel_name,
      quantity: item.menge,
      unit: item.einheit,
      price: einzelpreis,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
    };
  });
  
  // Map status: backend uses 'rejected', frontend uses 'rejected'
  let status: OrderStatus = "pending";
  if (backendOrder.status === "approved") status = "approved";
  else if (backendOrder.status === "rejected") status = "rejected";
  else if (backendOrder.status === "delivered") status = "delivered";
  else status = "pending";
  
  return {
    id: backendOrder.bestell_id,
    foremanName: backendOrder.polier_name,
    projectName: backendOrder.projekt_name,
    items: items,
    total: gesamt_betrag,
    status: status,
    createdAt: new Date(backendOrder.erstellt_am),
    updatedAt: new Date(backendOrder.aktualisiert_am),
    adminNotes: backendOrder.admin_notizen || undefined,
  };
}

async function fetchOrders(): Promise<Order[]> {
  const url = apiUrl("/api/v1/bestellungen/");
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.statusText}`);
  }
  
  const data: BackendOrder[] = await response.json();
  return data.map(mapBackendOrderToOrder);
}

interface CreateOrderRequest {
  polier_name: string;
  projekt_name: string;
  items: Array<{
    artikel_id: string;
    artikel_name: string;
    menge: number;
    einheit: string;
    einzelpreis: number;
  }>;
  erstellt_von?: string;
}

async function createOrder(request: CreateOrderRequest): Promise<Order> {
  const url = apiUrl("/api/v1/bestellungen/");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create order: ${response.statusText}`);
  }
  
  const data: BackendOrder = await response.json();
  return mapBackendOrderToOrder(data);
}

async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  genehmigt_von?: string,
  admin_notizen?: string
): Promise<void> {
  const params = new URLSearchParams({ new_status: status });
  if (genehmigt_von) params.append('genehmigt_von', genehmigt_von);
  if (admin_notizen) params.append('admin_notizen', admin_notizen);
  
  const url = apiUrl(`/api/v1/bestellungen/${orderId}/status?${params.toString()}`);
  
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update order status: ${response.statusText}`);
  }
}

export function useOrdersBackend() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, status, genehmigt_von, admin_notizen }: {
      orderId: string;
      status: OrderStatus;
      genehmigt_von?: string;
      admin_notizen?: string;
    }) => updateOrderStatus(orderId, status, genehmigt_von, admin_notizen),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

