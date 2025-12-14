import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMemo, useState, useEffect } from "react";
import { Package, ArrowDownCircle, ArrowUpCircle, MapPin, ArrowLeft, X, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Order = {
  id: string;
  total: number;
  status: "pending" | "accepted" | "declined";
  placedAt: string;
  items: { name: string; qty: number; price: number; alternatives?: { name: string; price: number }[] }[];
};

type InventoryItem = { sku: string; name: string; qty: number; site: string };
type Shipment = {
  id: string;
  type: "incoming" | "outgoing";
  ref: string;
  eta?: string;
  etd?: string;
  items: number;
  site: string;
};

// Mock data
const mockOrders: Order[] = [
  {
    id: "ORD-1001",
    total: 1290,
    status: "pending",
    placedAt: "2025-12-12",
    items: [
      {
        name: "Motor Assembly",
        qty: 2,
        price: 450,
        alternatives: [
          { name: "Motor Assembly v2", price: 430 },
          { name: "Motor Compact", price: 410 },
        ],
      },
      {
        name: "Sensor Kit",
        qty: 3,
        price: 130,
        alternatives: [{ name: "Sensor Kit Pro", price: 150 }],
      },
    ],
  },
  {
    id: "ORD-1000",
    total: 845,
    status: "accepted",
    placedAt: "2025-12-11",
    items: [
      {
        name: "Sample Item",
        qty: 5,
        price: 169,
        alternatives: [{ name: "Sample Item Eco", price: 159 }],
      },
    ],
  },
];

const mockInventory: InventoryItem[] = [
  { sku: "ABC-123", name: "Sample Item", qty: 120, site: "Overview" },
  { sku: "DEF-456", name: "Motor Assembly", qty: 42, site: "Site A" },
  { sku: "XYZ-789", name: "Sensor Kit", qty: 18, site: "Site B" },
];

const mockShipments: Shipment[] = [
  { id: "SHP-001", type: "incoming", ref: "PO-7781", eta: "2025-12-15", items: 320, site: "Overview" },
  { id: "SHP-002", type: "outgoing", ref: "SO-9912", etd: "2025-12-14", items: 140, site: "Site A" },
  { id: "SHP-003", type: "incoming", ref: "PO-7799", eta: "2025-12-16", items: 80, site: "Site B" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sites, setSites] = useState<string[]>(["Overview", "Site A", "Site B"]);
  const [site, setSite] = useState<string>("Overview");
  const [newSite, setNewSite] = useState("");
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [newItem, setNewItem] = useState<{ sku: string; name: string; qty: number }>({ sku: "", name: "", qty: 0 });

  // Editable shipments state
  const [shipments, setShipments] = useState<Shipment[]>(mockShipments);
  const [newShipment, setNewShipment] = useState<Shipment>({
    id: "",
    type: "incoming",
    ref: "",
    eta: "",
    etd: "",
    items: 0,
    site,
  });

  const filteredInventory = useMemo(() => inventory.filter((i) => i.site === site), [inventory, site]);
  const incoming = useMemo(() => shipments.filter((s) => s.type === "incoming" && s.site === site), [shipments, site]);
  const outgoing = useMemo(() => shipments.filter((s) => s.type === "outgoing" && s.site === site), [shipments, site]);

  const addSite = () => {
    const name = newSite.trim();
    if (!name || sites.includes(name)) return;
    setSites((prev) => [...prev, name]);
    setNewSite("");
    setSite(name);
  };

  const removeSite = (name: string) => {
    if (name === "Overview") return;
    setSites((prev) => prev.filter((s) => s !== name));
    setInventory((prev) => prev.filter((i) => i.site !== name));
    setShipments((prev) => prev.filter((s) => s.site !== name));
    if (site === name) setSite("Overview");
  };

  const handleInventoryChange = (sku: string, field: "name" | "qty", value: string) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.sku === sku && item.site === site
          ? { ...item, [field]: field === "qty" ? Number(value) || 0 : value }
          : item
      )
    );
  };

  const removeInventoryItem = (sku: string) => {
    setInventory((prev) => prev.filter((item) => !(item.sku === sku && item.site === site)));
  };

  const addInventoryItem = () => {
    const sku = newItem.sku.trim();
    const name = newItem.name.trim();
    if (!sku || !name) return;
    setInventory((prev) => [...prev, { sku, name, qty: Number(newItem.qty) || 0, site }]);
    setNewItem({ sku: "", name: "", qty: 0 });
  };

  // Shipments editing
  const handleShipmentChange = (id: string, field: keyof Shipment, value: string | number) => {
    setShipments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: field === "items" ? Number(value) || 0 : value } : s))
    );
  };

  const removeShipment = (id: string) => {
    setShipments((prev) => prev.filter((s) => s.id !== id));
  };

  const addShipment = () => {
    if (!newShipment.ref.trim()) return;
    const id = `SHP-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setShipments((prev) => [
      ...prev,
      {
        ...newShipment,
        id,
        site,
        items: Number(newShipment.items) || 0,
        eta: newShipment.type === "incoming" ? newShipment.eta : undefined,
        etd: newShipment.type === "outgoing" ? newShipment.etd : undefined,
      },
    ]);
    setNewShipment({ id: "", type: "incoming", ref: "", eta: "", etd: "", items: 0, site });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 md:px-6 md:pt-6">
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4" />
            Admin Bereich
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">Inventory, shipments, and orders.</p>
        </div>
      </div>

      <div className="px-4 md:px-6 pb-6">
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="inventory" className="flex-1 md:flex-none text-sm md:text-base">Inventory</TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 md:flex-none text-sm md:text-base">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-5 mt-4">
            {/* Site selector & manage */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm text-muted-foreground">Site</label>
                <select
                  className="border rounded px-3 py-2.5 text-sm bg-background min-w-[180px]"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                >
                  {sites.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {site !== "Overview" && (
                  <button
                    className="ml-2 inline-flex items-center px-2.5 py-2 text-sm rounded border border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => removeSite(site)}
                    aria-label="Remove site"
                    title="Remove site"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <input
                  className="border rounded px-3 py-2 text-sm bg-background flex-1"
                  placeholder="New site name"
                  value={newSite}
                  onChange={(e) => setNewSite(e.target.value)}
                />
                <button
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded bg-primary text-primary-foreground hover:opacity-90"
                  onClick={addSite}
                >
                  <Plus className="w-4 h-4" /> Add Site
                </button>
              </div>
            </div>

            {/* KPIs */}
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
                hint={`${incoming.length || "No"} inbound`}
              />
              <KpiCard
                icon={<ArrowUpCircle className="w-5 h-5 text-amber-500" />}
                title="Outgoing"
                value={outgoing.reduce((sum, s) => sum + s.items, 0).toLocaleString()}
                hint={`${outgoing.length || "No"} outbound`}
              />
            </div>

            {/* Inventory table with edit/remove */}
            <section className="border rounded-2xl p-4 bg-card/60 backdrop-blur space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Current Inventory</h2>
                  <p className="text-xs text-muted-foreground">Stock levels for {site}</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border bg-background">
                <table className="w-full text-sm md:text-base table-fixed">
                  <thead className="bg-muted/50">
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 px-3 w-28">SKU</th>
                      <th className="py-2 px-3 w-1/2">Name</th>
                      <th className="py-2 px-3 w-24 text-right">Qty</th>
                      <th className="py-2 px-3 w-20 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr className="border-t">
                        <td className="py-3 px-3 text-sm text-muted-foreground h-12" colSpan={4}>
                          No inventory for this site.
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((item) => (
                        <tr key={item.sku} className="border-t">
                          <td className="py-2 px-3 font-medium h-12">{item.sku}</td>
                          <td className="py-2 px-3 h-12">
                            <input
                              className="w-full border rounded px-2 py-1 text-sm bg-background"
                              value={item.name}
                              onChange={(e) => handleInventoryChange(item.sku, "name", e.target.value)}
                            />
                          </td>
                          <td className="py-2 px-3 h-12 text-right">
                            <input
                              type="number"
                              className="w-20 border rounded px-2 py-1 text-sm text-right bg-background"
                              value={item.qty}
                              onChange={(e) => handleInventoryChange(item.sku, "qty", e.target.value)}
                            />
                          </td>
                          <td className="py-2 px-3 h-12 text-right">
                            <button
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => removeInventoryItem(item.sku)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add inventory item */}
              <div className="flex flex-col md:flex-row gap-2 pt-2">
                <input
                  className="border rounded px-3 py-2 text-sm bg-background flex-1"
                  placeholder="SKU"
                  value={newItem.sku}
                  onChange={(e) => setNewItem((p) => ({ ...p, sku: e.target.value }))}
                />
                <input
                  className="border rounded px-3 py-2 text-sm bg-background flex-1"
                  placeholder="Name"
                  value={newItem.name}
                  onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                />
                <input
                  type="number"
                  className="border rounded px-3 py-2 text-sm bg-background w-24"
                  placeholder="Qty"
                  value={newItem.qty}
                  onChange={(e) => setNewItem((p) => ({ ...p, qty: Number(e.target.value) || 0 }))}
                />
                <button
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded bg-primary text-primary-foreground hover:opacity-90"
                  onClick={addInventoryItem}
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
            </section>

            {/* Incoming / Outgoing editable lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ShipmentList
                title="Incoming Goods"
                accent="blue"
                shipments={incoming}
                onChange={handleShipmentChange}
                onRemove={removeShipment}
              />
              <ShipmentList
                title="Outgoing Goods"
                accent="amber"
                shipments={outgoing}
                onChange={handleShipmentChange}
                onRemove={removeShipment}
              />
            </div>

            {/* Add shipment */}
            <section className="border rounded-2xl p-4 bg-card/60 backdrop-blur space-y-3 shadow-sm">
              <h3 className="font-semibold">Add Shipment</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                <select
                  className="border rounded px-3 py-2 text-sm bg-background"
                  value={newShipment.type}
                  onChange={(e) => setNewShipment((p) => ({ ...p, type: e.target.value as Shipment["type"] }))}
                >
                  <option value="incoming">Incoming</option>
                  <option value="outgoing">Outgoing</option>
                </select>
                <input
                  className="border rounded px-3 py-2 text-sm bg-background"
                  placeholder="Reference"
                  value={newShipment.ref}
                  onChange={(e) => setNewShipment((p) => ({ ...p, ref: e.target.value }))}
                />
                <input
                  className="border rounded px-3 py-2 text-sm bg-background"
                  placeholder={newShipment.type === "incoming" ? "ETA (YYYY-MM-DD)" : "ETD (YYYY-MM-DD)"}
                  value={newShipment.type === "incoming" ? newShipment.eta : newShipment.etd}
                  onChange={(e) =>
                    setNewShipment((p) =>
                      p.type === "incoming" ? { ...p, eta: e.target.value } : { ...p, etd: e.target.value }
                    )
                  }
                />
                <input
                  type="number"
                  className="border rounded px-3 py-2 text-sm bg-background"
                  placeholder="Items"
                  value={newShipment.items}
                  onChange={(e) => setNewShipment((p) => ({ ...p, items: Number(e.target.value) || 0 }))}
                />
              </div>
              <button
                className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded bg-primary text-primary-foreground hover:opacity-90"
                onClick={addShipment}
              >
                <Plus className="w-4 h-4" /> Add Shipment to {site}
              </button>
            </section>
          </TabsContent>

          <TabsContent value="orders">
            <AdminOrders />
          </TabsContent>
        </Tabs>
      </div>
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
    <div className="border rounded-2xl p-4 bg-card/70 backdrop-blur flex items-start gap-3 shadow-sm">
      <div className="p-2 rounded-lg bg-muted/70">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

// Editable shipment list
function ShipmentList({
  title,
  shipments,
  accent,
  onChange,
  onRemove,
}: {
  title: string;
  shipments: Shipment[];
  accent: "blue" | "amber";
  onChange: (id: string, field: keyof Shipment, value: string | number) => void;
  onRemove: (id: string) => void;
}) {
  const accentClass =
    accent === "blue"
      ? "text-blue-600 bg-blue-50/60 dark:bg-blue-500/10"
      : "text-amber-600 bg-amber-50/60 dark:bg-amber-500/10";

  return (
    <section className="border rounded-2xl p-4 bg-card/60 backdrop-blur space-y-3 shadow-sm">
      <h3 className="font-semibold">{title}</h3>
      {shipments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No shipments.</p>
      ) : (
        <div className="space-y-2">
          {shipments.map((s) => (
            <div key={s.id} className="border rounded-lg p-3 bg-background flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] px-2 py-1 rounded-full ${accentClass}`}>
                    {s.type === "incoming" ? "Incoming" : "Outgoing"}
                  </span>
                  <input
                    className="border rounded px-2 py-1 text-sm bg-background"
                    value={s.ref}
                    onChange={(e) => onChange(s.id, "ref", e.target.value)}
                  />
                </div>
                <button className="text-muted-foreground hover:text-destructive" onClick={() => onRemove(s.id)} aria-label="Remove shipment" title="Remove shipment">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  className="border rounded px-2 py-1 text-sm bg-background"
                  placeholder="ETA"
                  value={s.type === "incoming" ? s.eta || "" : ""}
                  disabled={s.type !== "incoming"}
                  onChange={(e) => onChange(s.id, "eta", e.target.value)}
                />
                <input
                  className="border rounded px-2 py-1 text-sm bg-background"
                  placeholder="ETD"
                  value={s.type === "outgoing" ? s.etd || "" : ""}
                  disabled={s.type !== "outgoing"}
                  onChange={(e) => onChange(s.id, "etd", e.target.value)}
                />
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-sm bg-background"
                  placeholder="Items"
                  value={s.items}
                  onChange={(e) => onChange(s.id, "items", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [selectedAlternatives, setSelectedAlternatives] = useState<Record<string, string>>({});

  const sortedOrders = [...orders].sort((a, b) => {
    const statusOrder = { pending: 0, accepted: 1, declined: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const handleStatusChange = (orderId: string, newStatus: "accepted" | "declined") => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              items:
                newStatus === "accepted"
                  ? o.items.map((item) => {
                      const key = `${o.id}-${item.name}`;
                      const altName = selectedAlternatives[key];
                      if (!altName) return item;
                      const alt = item.alternatives?.find((a) => a.name === altName);
                      if (!alt) return item;
                      return { ...item, name: alt.name, price: alt.price };
                    })
                  : o.items,
            }
          : o
      )
    );
    setSelectedOrder(null);
    setExpandedItems({});
    setSelectedAlternatives({});
  };

  const toggleExpand = (orderId: string, itemName: string) => {
    const key = `${orderId}-${itemName}`;
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAlternative = (orderId: string, itemName: string, altName: string) => {
    const key = `${orderId}-${itemName}`;
    setSelectedAlternatives((prev) => {
      if (prev[key] === altName) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: altName };
    });
  };

  useEffect(() => {
    if (selectedOrder) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [selectedOrder]);

  return (
    <div className="border rounded-2xl p-4 bg-card/60 backdrop-blur space-y-3 shadow-sm">
      <h2 className="font-semibold">Orders</h2>
      <p className="text-sm text-muted-foreground">Review, choose alternatives, and accept/decline.</p>

      <div className="space-y-2">
        {sortedOrders.map((o) => (
          <div
            key={o.id}
            onClick={() => setSelectedOrder(o)}
            className="border rounded-lg p-4 bg-card flex items-center justify-between cursor-pointer hover:bg-card/80 transition"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{o.id}</span>
                <StatusPill status={o.status} />
              </div>
              <p className="text-sm text-muted-foreground">Items: {o.items.length} · Placed {o.placedAt}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">€{o.total.toLocaleString()}</div>
              <span className="text-xs text-muted-foreground">Click to review</span>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <>
          <div className="fixed inset-0 bg-black/80 z-50" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="bg-background border rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedOrder.id}</h2>
                  <p className="text-xs text-muted-foreground">Placed {selectedOrder.placedAt}</p>
                </div>
                <button className="p-2 hover:bg-muted rounded-lg" onClick={() => setSelectedOrder(null)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Products</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => {
                    const key = `${selectedOrder.id}-${item.name}`;
                    const isExpanded = expandedItems[key];
                    const chosenAlt = selectedAlternatives[key];
                    const unitPrice =
                      chosenAlt
                        ? item.alternatives?.find((a) => a.name === chosenAlt)?.price ?? item.price
                        : item.price;
                    const unitTotal = unitPrice * item.qty;

                    return (
                      <div key={key} className="rounded-xl border bg-card/60 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold">{chosenAlt || item.name}</div>
                            <div className="text-xs text-muted-foreground">Qty: {item.qty}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">€{unitTotal.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">€{unitPrice.toLocaleString()} / unit</div>
                          </div>
                        </div>

                        {item.alternatives && item.alternatives.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center gap-3">
                              <button
                                className="text-xs text-primary hover:underline"
                                onClick={() => toggleExpand(selectedOrder.id, item.name)}
                              >
                                {isExpanded ? "Hide alternatives" : "Show alternatives"}
                              </button>
                              {chosenAlt && (
                                <button
                                  className="text-xs text-muted-foreground hover:underline"
                                  onClick={() => selectAlternative(selectedOrder.id, item.name, chosenAlt)}
                                >
                                  Clear selection
                                </button>
                              )}
                            </div>

                            {isExpanded && (
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {item.alternatives.map((alt) => {
                                  const selected = chosenAlt === alt.name;
                                  return (
                                    <button
                                      key={alt.name}
                                      className={`text-left rounded-lg border p-3 transition ${
                                        selected ? "border-primary bg-primary/10" : "hover:bg-muted"
                                      }`}
                                      onClick={() => selectAlternative(selectedOrder.id, item.name, alt.name)}
                                    >
                                      <div className="text-sm font-medium">{alt.name}</div>
                                      <div className="text-xs text-muted-foreground">€{alt.price.toLocaleString()} / unit</div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm font-semibold">Order Total</span>
                <span className="text-sm font-semibold">€{selectedOrder.total.toLocaleString()}</span>
              </div>

              {selectedOrder.status === "pending" ? (
                <div className="flex gap-3 pt-2">
                  <button
                    className="flex-1 px-3 py-3 text-sm rounded-lg border border-green-500 text-green-600 hover:bg-green-50 font-medium"
                    onClick={() => handleStatusChange(selectedOrder.id, "accepted")}
                  >
                    Accept
                  </button>
                  <button
                    className="flex-1 px-3 py-3 text-sm rounded-lg border border-red-500 text-red-600 hover:bg-red-50 font-medium"
                    onClick={() => handleStatusChange(selectedOrder.id, "declined")}
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-2">
                  Status: <StatusPill status={selectedOrder.status} />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: "pending" | "accepted" | "declined" }) {
  const colors = {
    pending: "bg-amber-100 text-amber-700 border border-amber-200",
    accepted: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    declined: "bg-red-100 text-red-700 border border-red-200",
  };
  const labels = { pending: "Pending", accepted: "Accepted", declined: "Declined" };
  return <span className={`text-[11px] px-2 py-1 rounded-full ${colors[status]}`}>{labels[status]}</span>;
}