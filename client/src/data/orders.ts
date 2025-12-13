export type OrderStatus = "pending" | "approved" | "rejected" | "delivered";

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
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
}

export const mockOrders: Order[] = [
  {
    id: "ORD-001",
    foremanName: "Hans Müller",
    projectName: "Bauprojekt Mitte",
    items: [
      { productId: "C001", productName: "Schraube TX20 4x40", quantity: 500, unit: "Stk", price: 0.08 },
      { productId: "C019", productName: "Arbeitshandschuhe Gr.9", quantity: 10, unit: "Paar", price: 2.50 },
      { productId: "C027", productName: "Panzertape silber", quantity: 5, unit: "Rolle", price: 6.90 },
    ],
    total: 99.50,
    status: "delivered",
    createdAt: new Date("2024-01-10T08:30:00"),
    updatedAt: new Date("2024-01-12T14:00:00"),
  },
  {
    id: "ORD-002",
    foremanName: "Klaus Weber",
    projectName: "Wohnanlage Nord",
    items: [
      { productId: "C067", productName: "Schnellzement 5kg", quantity: 20, unit: "Sack", price: 7.80 },
      { productId: "C045", productName: "Maurerkelle", quantity: 3, unit: "Stk", price: 11.50 },
    ],
    total: 190.50,
    status: "approved",
    createdAt: new Date("2024-01-14T09:15:00"),
    updatedAt: new Date("2024-01-14T11:30:00"),
  },
  {
    id: "ORD-003",
    foremanName: "Peter Schmidt",
    projectName: "Bürogebäude Ost",
    items: [
      { productId: "C075", productName: "Steckdose UP weiß", quantity: 50, unit: "Stk", price: 4.20 },
      { productId: "C076", productName: "Lichtschalter UP weiß", quantity: 30, unit: "Stk", price: 5.80 },
      { productId: "C017", productName: "Installationsdraht 1.5mm", quantity: 200, unit: "m", price: 0.45 },
    ],
    total: 474.00,
    status: "pending",
    createdAt: new Date("2024-01-15T07:45:00"),
    updatedAt: new Date("2024-01-15T07:45:00"),
  },
  {
    id: "ORD-004",
    foremanName: "Hans Müller",
    projectName: "Bauprojekt Mitte",
    items: [
      { productId: "C089", productName: "Wandfarbe weiß 10L", quantity: 10, unit: "Eimer", price: 35.00 },
      { productId: "C088", productName: "Tiefengrund 10L", quantity: 5, unit: "Eimer", price: 24.00 },
      { productId: "C091", productName: "Farbroller 25cm", quantity: 15, unit: "Stk", price: 4.50 },
    ],
    total: 537.50,
    status: "pending",
    createdAt: new Date("2024-01-15T10:00:00"),
    updatedAt: new Date("2024-01-15T10:00:00"),
  },
];
