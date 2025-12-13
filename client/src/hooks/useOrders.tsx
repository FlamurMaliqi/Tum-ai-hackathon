import { createContext, useContext, ReactNode } from "react";
import { Order, OrderStatus } from "@/data/orders";
import { useOrdersBackend, useUpdateOrderStatus } from "./useOrdersBackend";

interface OrdersContextType {
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
  updateOrderStatus: (orderId: string, status: OrderStatus, notes?: string) => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { data: orders = [], isLoading, error } = useOrdersBackend();
  const updateOrderStatusMutation = useUpdateOrderStatus();

  const updateOrderStatus = (orderId: string, status: OrderStatus, notes?: string) => {
    updateOrderStatusMutation.mutate({
      orderId,
      status,
      admin_notizen: notes,
    });
  };

  return (
    <OrdersContext.Provider value={{ orders, isLoading, error: error as Error | null, updateOrderStatus }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return context;
}
