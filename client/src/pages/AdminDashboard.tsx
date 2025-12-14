import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMemo, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Package, ArrowDownCircle, ArrowUpCircle, MapPin, ArrowLeft, X, Plus, Trash2, Loader2, ChevronDown, Check, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOrdersBackend, useUpdateOrderStatus } from "@/hooks/useOrdersBackend";
import { Order as BackendOrder, OrderStatus } from "@/data/orders";
import { useConstructionSites } from "@/hooks/useConstructionSites";
import { useInventory } from "@/hooks/useInventory";

type Order = {
  id: string;
  total: number;
  status: "pending" | "accepted" | "declined";
  placedAt: string;
  items: { name: string; qty: number; price: number; alternatives?: { name: string; price: number }[] }[];
  foremanName?: string;
  projectName?: string;
};

type InventoryItemDisplay = { 
  sku: string; 
  name: string; 
  qty: number; 
  site: string;
  category?: string;
  supplier?: string;
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

// Mock inventory removed - now using backend data

const mockShipments: Shipment[] = [
  { id: "SHP-001", type: "incoming", ref: "PO-7781", eta: "2025-12-15", items: 320, site: "Overview" },
  { id: "SHP-002", type: "outgoing", ref: "SO-9912", etd: "2025-12-14", items: 140, site: "Site A" },
  { id: "SHP-003", type: "incoming", ref: "PO-7799", eta: "2025-12-16", items: 80, site: "Site B" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Fetch construction sites from backend
  const { data: constructionSites = [], isLoading: isLoadingSites } = useConstructionSites();
  const { data: backendInventory = [], isLoading: isLoadingInventory, refetch: refetchInventory } = useInventory();
  
  // Convert construction sites to string array for site selector, with "All" option
  const sites = useMemo(() => {
    return ["All", ...constructionSites.map(site => site.name)];
  }, [constructionSites]);
  
  const [site, setSite] = useState<string>("All");
  const [inventory, setInventory] = useState<InventoryItemDisplay[]>([]);
  const [newItem, setNewItem] = useState<{ sku: string; name: string; qty: number }>({ sku: "", name: "", qty: 0 });
  
  // Update inventory when backend data changes
  useEffect(() => {
    if (backendInventory.length > 0) {
      const mappedInventory: InventoryItemDisplay[] = backendInventory.map(item => ({
        sku: item.artikel_id,
        name: item.artikelname,
        qty: item.quantity || 0,
        site: item.construction_site || "Unbekannt",
        category: item.kategorie,
        supplier: item.lieferant
      }));
      setInventory(mappedInventory);
    } else if (!isLoadingInventory) {
      // Clear inventory if no data and not loading
      setInventory([]);
    }
  }, [backendInventory, isLoadingInventory]);
  
  // Update site when construction sites load (default to "All")
  useEffect(() => {
    if (sites.length > 0 && site === "") {
      setSite("All");
    }
  }, [sites, site]);

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

  const filteredInventory = useMemo(() => {
    if (site === "All") {
      return inventory; // Show all inventory items
    }
    return inventory.filter((i) => i.site === site);
  }, [inventory, site]);
  
  const incoming = useMemo(() => {
    if (site === "All") {
      return shipments.filter((s) => s.type === "incoming");
    }
    return shipments.filter((s) => s.type === "incoming" && s.site === site);
  }, [shipments, site]);
  
  const outgoing = useMemo(() => {
    if (site === "All") {
      return shipments.filter((s) => s.type === "outgoing");
    }
    return shipments.filter((s) => s.type === "outgoing" && s.site === site);
  }, [shipments, site]);

  // Sites are managed in the database, so we don't add/remove them here
  // This would require backend endpoints for creating/deleting construction sites

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
            {/* Construction Site selector */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <select
                  className="border rounded-lg px-4 py-2.5 text-sm bg-background min-w-[200px] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  disabled={isLoadingSites}
                >
                  {isLoadingSites ? (
                    <option>Loading sites...</option>
                  ) : sites.length === 0 ? (
                    <option>No sites available</option>
                  ) : (
                    sites.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Inventory Cards - Mobile First Design */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Current Inventory</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {site === "All" 
                      ? "Stock levels across all construction sites" 
                      : `Stock levels for ${site}`}
                    {!isLoadingInventory && filteredInventory.length > 0 && (
                      <span className="ml-2">
                        • {filteredInventory.length} {filteredInventory.length === 1 ? 'item' : 'items'} 
                        • {filteredInventory.reduce((sum, i) => sum + i.qty, 0).toLocaleString()} total units
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => refetchInventory()}
                  className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
                  title="Refresh inventory"
                  aria-label="Refresh inventory"
                  disabled={isLoadingInventory}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingInventory ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoadingInventory ? (
                <div className="border-2 border-dashed rounded-2xl p-8 bg-card/40 backdrop-blur text-center">
                  <Loader2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3 animate-spin" />
                  <p className="text-sm font-medium text-muted-foreground">Loading inventory...</p>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="border-2 border-dashed rounded-2xl p-8 bg-card/40 backdrop-blur text-center">
                  <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No inventory for this site</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Add items to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredInventory.map((item) => (
                    <div
                      key={item.sku}
                      className="group relative border rounded-xl bg-card/60 backdrop-blur p-4 hover:shadow-md transition-all duration-200 hover:border-primary/30"
                    >
                      {/* SKU Badge */}
                      <div className="flex items-start justify-between mb-3">
                        <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">
                          {item.sku}
                        </span>
                        <button
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          onClick={() => removeInventoryItem(item.sku)}
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Product Name */}
                      <div className="mb-3">
                        <input
                          className="w-full font-semibold text-sm bg-transparent border-0 border-b-2 border-transparent focus:border-primary/50 focus:outline-none focus:ring-0 px-0 py-1 transition-colors"
                          value={item.name}
                          onChange={(e) => handleInventoryChange(item.sku, "name", e.target.value)}
                          placeholder="Product name"
                        />
                        {/* Category and Supplier Info */}
                        {(item.category || item.supplier) && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {item.category && (
                              <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                                {item.category}
                              </span>
                            )}
                            {item.supplier && (
                              <span className="text-xs text-muted-foreground">
                                {item.supplier}
                              </span>
                            )}
                          </div>
                        )}
                        {/* Construction Site Badge */}
                        <div className="mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                            {item.site}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Display */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <span className="text-xs text-muted-foreground font-medium">Quantity</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="w-20 text-right font-semibold text-base bg-muted/50 border border-border/50 rounded-lg px-2 py-1.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                            value={item.qty}
                            onChange={(e) => handleInventoryChange(item.sku, "qty", e.target.value)}
                            min="0"
                          />
                          <span className="text-xs text-muted-foreground">units</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Inventory Item - Mobile Optimized */}
              <div className="border rounded-2xl bg-card/60 backdrop-blur p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Item
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">SKU</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="e.g., ABC-123"
                      value={newItem.sku}
                      onChange={(e) => setNewItem((p) => ({ ...p, sku: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Product Name</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Product name"
                      value={newItem.name}
                      onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Quantity</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        className="flex-1 border rounded-lg px-3 py-2.5 text-sm bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="0"
                        value={newItem.qty || ""}
                        onChange={(e) => setNewItem((p) => ({ ...p, qty: Number(e.target.value) || 0 }))}
                        min="0"
                      />
                      <button
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all font-medium shadow-sm"
                        onClick={addInventoryItem}
                        disabled={!newItem.sku || !newItem.name}
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

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
  const { data: backendOrders = [], isLoading, error } = useOrdersBackend();
  const updateOrderStatusMutation = useUpdateOrderStatus();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [selectedAlternatives, setSelectedAlternatives] = useState<Record<string, string>>({});

  // Calculate dynamic total based on selected alternatives
  const calculateOrderTotal = useMemo(() => {
    if (!selectedOrder) return 0;
    
    return selectedOrder.items.reduce((sum, item) => {
      const key = `${selectedOrder.id}-${item.name}`;
      const chosenAlt = selectedAlternatives[key];
      const unitPrice = chosenAlt
        ? item.alternatives?.find((a) => a.name === chosenAlt)?.price ?? item.price
        : item.price;
      return sum + (unitPrice * item.qty);
    }, 0);
  }, [selectedOrder, selectedAlternatives]);

  // Map backend orders to AdminDashboard Order format
  const orders: Order[] = useMemo(() => {
    return backendOrders.map((backendOrder: BackendOrder) => {
      // Map backend status to admin dashboard status
      let status: "pending" | "accepted" | "declined" = "pending";
      if (backendOrder.status === "approved" || backendOrder.status === "delivered") {
        status = "accepted";
      } else if (backendOrder.status === "rejected") {
        status = "declined";
      }

      // Calculate total from items (always calculate to ensure accuracy)
      const calculatedTotal = backendOrder.items.reduce((sum: number, item: any) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        return sum + itemTotal;
      }, 0);
      
      // Use calculated total if backend total is 0 or invalid, otherwise use backend total
      const backendTotal = backendOrder.total || 0;
      const finalTotal = backendTotal > 0 ? backendTotal : calculatedTotal;

      return {
        id: backendOrder.id,
        total: finalTotal,
        status: status,
        placedAt: backendOrder.createdAt.toLocaleDateString(),
        items: backendOrder.items.map((item) => ({
          name: item.productName,
          qty: item.quantity,
          price: item.price,
          alternatives: item.alternatives,
        })),
        foremanName: backendOrder.foremanName,
        projectName: backendOrder.projectName,
      };
    });
  }, [backendOrders]);

  const sortedOrders = [...orders].sort((a, b) => {
    const statusOrder = { pending: 0, accepted: 1, declined: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const handleStatusChange = (orderId: string, newStatus: "accepted" | "declined") => {
    // Map admin dashboard status to backend status
    const backendStatus: OrderStatus = newStatus === "accepted" ? "approved" : "rejected";
    
    updateOrderStatusMutation.mutate({
      orderId,
      status: backendStatus,
      genehmigt_von: "admin", // You can make this dynamic later
    });

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
      // If clicking the same alternative or original, clear the selection
      if (prev[key] === altName) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      // If clicking original (itemName), clear the selection
      if (altName === itemName) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      // Otherwise, set the new alternative
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

  if (isLoading) {
    return (
      <div className="border rounded-2xl p-4 bg-card/60 backdrop-blur space-y-3 shadow-sm">
        <h2 className="font-semibold">Orders</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-2xl p-4 bg-card/60 backdrop-blur space-y-3 shadow-sm">
        <h2 className="font-semibold">Orders</h2>
        <div className="text-center py-8">
          <p className="text-destructive">Error loading orders</p>
          <p className="text-sm text-muted-foreground mt-2">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-2xl p-4 bg-card/60 backdrop-blur space-y-3 shadow-sm">
      <h2 className="font-semibold">Orders</h2>
      <p className="text-sm text-muted-foreground">Review and accept/decline orders.</p>

      {sortedOrders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No orders found</p>
        </div>
      ) : (
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
              <p className="text-sm text-muted-foreground">
                {o.foremanName && `${o.foremanName} · `}
                {o.projectName && `${o.projectName} · `}
                Items: {o.items.length} · Placed {o.placedAt}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">€{o.total.toLocaleString()}</div>
              <span className="text-xs text-muted-foreground">Click to review</span>
            </div>
          </div>
        ))}
        </div>
      )}

      {selectedOrder && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="bg-background border rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedOrder.id}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedOrder.foremanName && `${selectedOrder.foremanName} · `}
                    {selectedOrder.projectName && `${selectedOrder.projectName} · `}
                    Placed {selectedOrder.placedAt}
                  </p>
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

                    const supplierMatch = chosenAlt ? chosenAlt.match(/\(([^)]+)\)$/) : null;
                    const currentSupplier = supplierMatch ? supplierMatch[1] : null;
                    const isUsingAlternative = chosenAlt && chosenAlt !== item.name;

                    return (
                      <div key={key} className="rounded-xl border bg-card/60 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold">{item.name}</div>
                              {isUsingAlternative && (
                                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                                  {currentSupplier}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">Qty: {item.qty}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">€{unitTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className="text-xs text-muted-foreground">€{unitPrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / unit</div>
                          </div>
                        </div>

                        {item.alternatives && item.alternatives.length > 0 && (
                          <div className="relative">
                            <details className="group">
                              <summary className="flex items-center justify-between cursor-pointer list-none">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                  <Package className="w-3.5 h-3.5" />
                                  <span className="font-medium">
                                    {isUsingAlternative ? 'Change supplier' : 'View alternatives'}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60">
                                    {item.alternatives.length + 1}
                                  </span>
                                </div>
                                <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
                              </summary>
                              <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
                                {/* Original option */}
                                <button
                                  onClick={() => {
                                    const key = `${selectedOrder.id}-${item.name}`;
                                    setSelectedAlternatives((prev) => {
                                      const { [key]: _, ...rest } = prev;
                                      return rest;
                                    });
                                  }}
                                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                                    !chosenAlt
                                      ? "border-primary bg-primary/5 shadow-sm"
                                      : "border-border/50 bg-card/40 hover:border-primary/50 hover:bg-card/60"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                      !chosenAlt ? "border-primary bg-primary" : "border-border"
                                    }`}>
                                      {!chosenAlt && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                    </div>
                                    <div className="text-left">
                                      <div className="text-sm font-medium">{item.name}</div>
                                      <div className="text-xs text-muted-foreground">Current supplier</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-semibold">€{item.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <div className="text-xs text-muted-foreground">per unit</div>
                                  </div>
                                </button>

                                {/* Alternative options */}
                                {item.alternatives.map((alt) => {
                                  const selected = chosenAlt === alt.name;
                                  const altSupplierMatch = alt.name.match(/\(([^)]+)\)$/);
                                  const altSupplier = altSupplierMatch ? altSupplierMatch[1] : 'Alternative';
                                  
                                  return (
                                    <button
                                      key={alt.name}
                                      onClick={() => selectAlternative(selectedOrder.id, item.name, alt.name)}
                                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                                        selected
                                          ? "border-primary bg-primary/5 shadow-sm"
                                          : "border-border/50 bg-card/40 hover:border-primary/50 hover:bg-card/60"
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                          selected ? "border-primary bg-primary" : "border-border"
                                        }`}>
                                          {selected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                        </div>
                                        <div className="text-left">
                                          <div className="text-sm font-medium">{item.name}</div>
                                          <div className="text-xs text-muted-foreground">{altSupplier}</div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm font-semibold">€{alt.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                        <div className="text-xs text-muted-foreground">per unit</div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm font-semibold">Order Total</span>
                <span className="text-lg font-bold">€{calculateOrderTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {selectedOrder.status === "pending" ? (
                <div className="flex gap-3 pt-2">
                  <button
                    className="flex-1 px-3 py-3 text-sm rounded-lg border border-green-500 text-green-600 hover:bg-green-50 font-medium disabled:opacity-50"
                    onClick={() => handleStatusChange(selectedOrder.id, "accepted")}
                    disabled={updateOrderStatusMutation.isPending}
                  >
                    {updateOrderStatusMutation.isPending ? "Processing..." : "Accept"}
                  </button>
                  <button
                    className="flex-1 px-3 py-3 text-sm rounded-lg border border-red-500 text-red-600 hover:bg-red-50 font-medium disabled:opacity-50"
                    onClick={() => handleStatusChange(selectedOrder.id, "declined")}
                    disabled={updateOrderStatusMutation.isPending}
                  >
                    {updateOrderStatusMutation.isPending ? "Processing..." : "Decline"}
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