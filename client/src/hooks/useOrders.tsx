import { createContext, useContext, useState, ReactNode } from "react";
import { Order, OrderStatus, mockOrders } from "@/data/orders";
import { CartItem } from "./useCart";

interface OrdersContextType {
  orders: Order[];
  addOrder: (items: CartItem[], foremanName: string, projectName: string) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, notes?: string) => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const addOrder = (items: CartItem[], foremanName: string, projectName: string): Order => {
    const newOrder: Order = {
      id: `ORD-${String(orders.length + 1).padStart(3, "0")}`,
      foremanName,
      projectName,
      items: items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unit: item.product.unit,
        price: item.product.price,
      })),
      total: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, notes?: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status, updatedAt: new Date(), adminNotes: notes || order.adminNotes }
          : order
      )
    );
  };

  return (
    <OrdersContext.Provider value={{ orders, addOrder, updateOrderStatus }}>
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
