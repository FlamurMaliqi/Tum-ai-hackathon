import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import { Package, ArrowDownCircle, ArrowUpCircle, MapPin } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Order = {
  id: string;
  customer: string;
  total: number;
  status: "pending" | "accepted";
  placedAt: string;
};

const mockOrders: Order[] = [
  { id: "ORD-1001", customer: "Acme GmbH", total: 1290, status: "pending", placedAt: "2025-12-12" },
  { id: "ORD-1000", customer: "Globex AG", total: 845, status: "accepted", placedAt: "2025-12-11" },
];

type InventoryItem = {
  sku: string;
  name: string;
  qty: number;
  site: string;
};

type Shipment = {
  id: string;
  type: "incoming" | "outgoing";
  ref: string;
  eta?: string;
  etd?: string;
  items: number;
  site: string;
};

const mockInventory: InventoryItem[] = [
  { sku: "ABC-123", name: "Sample Item", qty: 120, site: "Overview" },
  { sku: "DEF-456", name: "Motor Assembly", qty: 42, site: "Site-1" },
  { sku: "XYZ-789", name: "Sensor Kit", qty: 18, site: "Site-2" },
];

const mockShipments: Shipment[] = [
  { id: "SHP-001", type: "incoming", ref: "PO-7781", eta: "2025-12-15", items: 320, site: "Overview" },
  { id: "SHP-002", type: "outgoing", ref: "SO-9912", etd: "2025-12-14", items: 140, site: "Site-1" },
  { id: "SHP-003", type: "incoming", ref: "PO-7799", eta: "2025-12-16", items: 80, site: "Site-2" },
];

export default function AdminDashboard() {
  const [site, setSite] = useState<string>("Overview");
  const navigate = useNavigate();

  const filteredInventory = useMemo(
    () => mockInventory.filter((i) => i.site === site),
    [site]
  );
  const incoming = useMemo(
    () => mockShipments.filter((s) => s.type === "incoming" && s.site === site),
    [site]
  );
  const outgoing = useMemo(
    () => mockShipments.filter((s) => s.type === "outgoing" && s.site === site),
    [site]
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Monitor inventory, inbound and outbound goods, and manage orders.
        </p>
      </div>
       <button
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded border hover:bg-muted transition"
          onClick={() => navigate("/")} // or navigate("/")
        >
          <ArrowLeft className="w-4 h-4" />
          Admin Bereich
        </button>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="inventory" className="flex-1 md:flex-none">
            Inventory
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex-1 md:flex-none">
            Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-5">
          {/* Top controls */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm text-muted-foreground">Site</label>
            </div>
            <select
              className="border rounded px-3 py-2 text-sm w-full md:w-48 bg-background"
              value={site}
              onChange={(e) => setSite(e.target.value)}
            >
              <option value="Overview">Overview</option>
              <option value="Site-1">Site-1</option>
              <option value="Site-2">Site-2</option>
            </select>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KpiCard
              icon={<Package className="w-5 h-5 text-emerald-500" />}
              title="On-hand Units"
              value={filteredInventory.reduce((sum, i) => sum + i.qty, 0).toLocaleString()}
              hint={`Across ${filteredInventory.length} SKUs`}
            />
            <KpiCard
              icon={<ArrowDownCircle className="w-5 h-5 text-blue-500" />}
              title="Incoming"
              value={incoming.reduce((sum, s) => sum + s.items, 0).toLocaleString()}
              hint={`${incoming.length || "No"} active inbound`}
            />
            <KpiCard
              icon={<ArrowUpCircle className="w-5 h-5 text-amber-500" />}
              title="Outgoing"
              value={outgoing.reduce((sum, s) => sum + s.items, 0).toLocaleString()}
              hint={`${outgoing.length || "No"} active outbound`}
            />
          </div>

          {/* Current inventory table */}
          <section className="border rounded-xl p-4 bg-card/50 backdrop-blur">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold">Current Inventory</h2>
                <p className="text-xs text-muted-foreground">
                  Stock levels for {site}
                </p>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border bg-background">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 px-3">SKU</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Qty</th>
                    <th className="py-2 px-3">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td className="py-3 px-3 text-sm text-muted-foreground" colSpan={4}>
                        No inventory for this site.
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => (
                      <tr key={item.sku} className="border-t">
                        <td className="py-2 px-3 font-medium">{item.sku}</td>
                        <td className="py-2 px-3">{item.name}</td>
                        <td className="py-2 px-3">{item.qty}</td>
                        <td className="py-2 px-3">{item.site}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Incoming / Outgoing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ShipmentCard title="Incoming Goods" shipments={incoming} accent="blue" />
            <ShipmentCard title="Outgoing Goods" shipments={outgoing} accent="amber" />
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="border rounded-xl p-4 bg-card/50 backdrop-blur">
            <h2 className="font-semibold mb-2">Orders</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Approve or reject pending orders.
            </p>
            {/* Replace with your existing admin orders UI */}
            <AdminOrders />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({
  icon,
  title,
  value,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="border rounded-xl p-4 bg-card/60 backdrop-blur flex items-start gap-3">
      <div className="p-2 rounded-lg bg-muted/70">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function ShipmentCard({
  title,
  shipments,
  accent,
}: {
  title: string;
  shipments: Shipment[];
  accent: "blue" | "amber";
}) {
  const accentClass =
    accent === "blue" ? "text-blue-600 bg-blue-50/60 dark:bg-blue-500/10" : "text-amber-600 bg-amber-50/60 dark:bg-amber-500/10";

  return (
    <section className="border rounded-xl p-4 bg-card/50 backdrop-blur space-y-3">
      <h3 className="font-semibold">{title}</h3>
      {shipments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No shipments.</p>
      ) : (
        <div className="space-y-2">
          {shipments.map((s) => (
            <div
              key={s.id}
              className="border rounded-lg p-3 bg-background flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] px-2 py-1 rounded-full ${accentClass}`}>
                    {s.type === "incoming" ? "Incoming" : "Outgoing"}
                  </span>
                  <span className="text-sm font-medium">{s.ref}</span>
                </div>
                <span className="text-xs text-muted-foreground">{s.site}</span>
              </div>
              <div className="text-xs text-muted-foreground flex gap-4">
                {s.eta && <span>ETA: {s.eta}</span>}
                {s.etd && <span>ETD: {s.etd}</span>}
                <span>Items: {s.items}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Minimal stub until wired to your existing orders component
function AdminOrders() {
  return (
    <div className="border rounded-lg p-3 bg-background space-y-3">
      <h4 className="font-medium">Orders</h4>
      <p className="text-sm text-muted-foreground">Approve or reject pending orders.</p>
      <div className="space-y-2">
        {mockOrders.map((o) => (
          <div key={o.id} className="border rounded-lg p-3 bg-card/60 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{o.id}</span>
                <StatusPill status={o.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {o.customer} · €{o.total.toLocaleString()} · Placed {o.placedAt}
              </p>
            </div>
            {o.status === "pending" ? (
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm rounded border border-green-500 text-green-600 hover:bg-green-50">
                  Accept
                </button>
                <button className="px-3 py-1 text-sm rounded border border-red-500 text-red-600 hover:bg-red-50">
                  Reject
                </button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Already accepted</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Order["status"] }) {
  const color =
    status === "pending"
      ? "bg-amber-100 text-amber-700 border border-amber-200"
      : "bg-emerald-100 text-emerald-700 border border-emerald-200";
  return (
    <span className={`text-[11px] px-2 py-1 rounded-full ${color}`}>
      {status === "pending" ? "Pending" : "Accepted"}
    </span>
  );
}