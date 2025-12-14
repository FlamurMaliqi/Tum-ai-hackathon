export type OrderStatus = "pending" | "approved" | "rejected" | "delivered";

export interface OrderItemAlternative {
  name: string;
  price: number;
  artikel_id: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  alternatives?: OrderItemAlternative[];
}

export interface Order {
  id: string;
  foremanName: string;
  projectName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  adminNotes?: string;
}

export const mockOrders: Order[] = [
  {
    id: "ORD-001",
    foremanName: "Hans Müller",
    projectName: "tiefbau",
    items: [
      { productId: "W-KABE-008", productName: "Kabelbinder", quantity: 50, unit: "Stk", price: 0.15 },
      { productId: "W-PORE-002", productName: "Porenbetondübel", quantity: 20, unit: "Stk", price: 0.85 },
      { productId: "W-MAGN-001", productName: "Magnetischer Bithalter", quantity: 5, unit: "Stk", price: 1.90 },
      { productId: "W-SCHL-009", productName: "Schleifscheibe", quantity: 3, unit: "Stk", price: 3.20 },
      { productId: "W-MESS-007", productName: "Messband", quantity: 1, unit: "Stk", price: 15.00 },
    ],
    total: 58.60,
    status: "approved",
    createdAt: new Date("2024-01-10T08:30:00"),
    updatedAt: new Date("2024-01-12T14:00:00"),
  },
  {
    id: "ORD-002",
    foremanName: "Klaus Weber",
    projectName: "Hochbau",
    items: [
      { productId: "H-BOHR-012", productName: "Bohrhammer", quantity: 1, unit: "Stk", price: 250.00 },
      { productId: "H-SICH-013", productName: "Sicherheitsbrille", quantity: 2, unit: "Stk", price: 12.50 },
      { productId: "H-KREI-014", productName: "Kreissägeblatt", quantity: 1, unit: "Stk", price: 8.90 },
    ],
    total: 283.90,
    status: "pending",
    createdAt: new Date("2024-01-14T09:15:00"),
    updatedAt: new Date("2024-01-14T09:15:00"),
  },
  {
    id: "ORD-003",
    foremanName: "Peter Schmidt",
    projectName: "tiefbau",
    items: [
      { productId: "W-EDEL-006", productName: "Edelstahlband", quantity: 10, unit: "m", price: 4.50 },
      { productId: "W-KABE-008", productName: "Kabelbinder", quantity: 100, unit: "Stk", price: 0.15 },
      { productId: "W-MAGN-001", productName: "Magnetischer Bithalter", quantity: 8, unit: "Stk", price: 1.90 },
      { productId: "W-SICH-004", productName: "Sicherheitsbrille", quantity: 3, unit: "Stk", price: 12.50 },
    ],
    total: 112.70,
    status: "delivered",
    createdAt: new Date("2024-01-08T07:45:00"),
    updatedAt: new Date("2024-01-10T11:20:00"),
  },
  {
    id: "ORD-004",
    foremanName: "Hans Müller",
    projectName: "Hochbau",
    items: [
      { productId: "H-PORE-011", productName: "Porenbetondübel", quantity: 50, unit: "Stk", price: 0.85 },
      { productId: "H-KABE-018", productName: "Kabelbinder", quantity: 200, unit: "Stk", price: 0.15 },
      { productId: "H-MESS-016", productName: "Messband", quantity: 2, unit: "Stk", price: 15.00 },
      { productId: "H-SCHL-019", productName: "Schleifscheibe", quantity: 5, unit: "Stk", price: 3.20 },
    ],
    total: 118.50,
    status: "pending",
    createdAt: new Date("2024-01-15T10:00:00"),
    updatedAt: new Date("2024-01-15T10:00:00"),
  },
];
