import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Boxes, Plus, Search, Filter, Download, Eye, Pencil, Trash2, ArrowRightLeft,
  AlertTriangle, DollarSign, Package, BarChart3, Warehouse, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, RefreshCw, ClipboardCheck, ShieldCheck, ShieldX, History, MapPin
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from "recharts";
import type { StockItem, StockLocation, StockMovement, StockAdjustment, Product } from "@shared/schema";

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  healthy: { label: "Healthy", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", dot: "bg-green-500" },
  low_stock: { label: "Low Stock", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", dot: "bg-yellow-500" },
  critical: { label: "Critical", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
  out_of_stock: { label: "Out of Stock", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400", dot: "bg-gray-500" },
  reserved: { label: "Reserved", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", dot: "bg-blue-500" },
  in_transit: { label: "In Transit", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", dot: "bg-purple-500" },
};

const movementTypeConfig: Record<string, { label: string; color: string }> = {
  purchase_receipt: { label: "Purchase Receipt", color: "text-green-600" },
  transfer_in: { label: "Transfer In", color: "text-blue-600" },
  transfer_out: { label: "Transfer Out", color: "text-orange-600" },
  allocation: { label: "Allocation", color: "text-purple-600" },
  assignment: { label: "Assignment", color: "text-indigo-600" },
  sales: { label: "Sales", color: "text-red-600" },
  adjustment: { label: "Adjustment", color: "text-amber-600" },
  return: { label: "Return", color: "text-teal-600" },
  write_off: { label: "Write-Off", color: "text-gray-600" },
};

const CHART_COLORS = ["#059669", "#0891b2", "#7c3aed", "#dc2626", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6"];

export default function StockManagementPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferSource, setTransferSource] = useState<StockItem | null>(null);
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [adjustmentItem, setAdjustmentItem] = useState<StockItem | null>(null);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [movementItem, setMovementItem] = useState<StockItem | null>(null);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StockLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: stockItems = [], isLoading } = useQuery<StockItem[]>({ queryKey: ["/api/stock-items"] });
  const { data: stockLocations = [] } = useQuery<StockLocation[]>({ queryKey: ["/api/stock-locations"] });
  const { data: stockMovements = [] } = useQuery<StockMovement[]>({ queryKey: ["/api/stock-movements"] });
  const { data: stockAdjustments = [] } = useQuery<StockAdjustment[]>({ queryKey: ["/api/stock-adjustments"] });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const createItemMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/stock-items", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] }); toast({ title: "Stock item created" }); setShowItemDialog(false); setEditingItem(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/stock-items/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] }); toast({ title: "Stock item updated" }); setShowItemDialog(false); setEditingItem(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/stock-items/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] }); toast({ title: "Stock item deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const transferMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/stock-transfer", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      toast({ title: "Stock transferred" }); setShowTransferDialog(false); setTransferSource(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const adjustmentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/stock-adjustments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      toast({ title: "Adjustment recorded" }); setShowAdjustmentDialog(false); setAdjustmentItem(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const approveAdjustmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/stock-adjustments/${id}/approve`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      toast({ title: "Adjustment processed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const locationMutation = useMutation({
    mutationFn: (data: any) => editingLocation
      ? apiRequest("PATCH", `/api/stock-locations/${editingLocation.id}`, data)
      : apiRequest("POST", "/api/stock-locations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-locations"] });
      toast({ title: editingLocation ? "Location updated" : "Location created" });
      setShowLocationDialog(false); setEditingLocation(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/stock-locations/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/stock-locations"] }); toast({ title: "Location deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const totalValue = stockItems.reduce((s, i) => s + parseFloat(i.totalValue || "0"), 0);
  const totalSKUs = new Set(stockItems.map(i => i.skuCode).filter(Boolean)).size || stockItems.length;
  const totalUnits = stockItems.reduce((s, i) => s + (i.currentQuantity || 0), 0);
  const lowStockItems = stockItems.filter(i => i.status === "low_stock").length;
  const outOfStockItems = stockItems.filter(i => i.status === "out_of_stock").length;
  const reservedStock = stockItems.reduce((s, i) => s + (i.reservedQuantity || 0), 0);
  const inTransitStock = stockItems.reduce((s, i) => s + (i.inTransitQuantity || 0), 0);
  const criticalItems = stockItems.filter(i => i.status === "critical").length;

  const categories = useMemo(() => [...new Set(stockItems.map(i => i.category).filter(Boolean))], [stockItems]);
  const brands = useMemo(() => [...new Set(stockItems.map(i => i.brandName).filter(Boolean))], [stockItems]);

  const filteredItems = useMemo(() => {
    return stockItems.filter(item => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!item.productName?.toLowerCase().includes(q) && !item.skuCode?.toLowerCase().includes(q) && !item.brandName?.toLowerCase().includes(q)) return false;
      }
      if (filterWarehouse !== "all" && String(item.locationId) !== filterWarehouse && item.locationName !== filterWarehouse) return false;
      if (filterCategory !== "all" && item.category !== filterCategory) return false;
      if (filterStatus !== "all" && item.status !== filterStatus) return false;
      if (filterBrand !== "all" && item.brandName !== filterBrand) return false;
      return true;
    });
  }, [stockItems, searchQuery, filterWarehouse, filterCategory, filterStatus, filterBrand]);

  const stockByWarehouse = useMemo(() => {
    const map: Record<string, number> = {};
    stockItems.forEach(i => { const loc = i.locationName || "Unassigned"; map[loc] = (map[loc] || 0) + (i.currentQuantity || 0); });
    return Object.entries(map).map(([name, value]) => ({ name: name.length > 18 ? name.slice(0, 18) + "..." : name, value }));
  }, [stockItems]);

  const stockByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    stockItems.forEach(i => { const cat = i.category || "Other"; map[cat] = (map[cat] || 0) + (i.currentQuantity || 0); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [stockItems]);

  const monthlyMovement = useMemo(() => {
    const map: Record<string, { inQty: number; outQty: number }> = {};
    stockMovements.forEach(m => {
      const month = m.createdAt?.slice(0, 7) || "";
      if (!month) return;
      if (!map[month]) map[month] = { inQty: 0, outQty: 0 };
      map[month].inQty += m.quantityIn || 0;
      map[month].outQty += m.quantityOut || 0;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, data]) => ({ month, ...data }));
  }, [stockMovements]);

  const handleExportCSV = () => {
    const headers = ["Product Name", "Brand", "Category", "SKU", "Location", "Qty", "Reserved", "Available", "Reorder Level", "Avg Cost", "Total Value", "Status"];
    const rows = filteredItems.map(i => [
      i.productName, i.brandName || "", i.category || "", i.skuCode || "", i.locationName || "",
      i.currentQuantity, i.reservedQuantity, i.availableQuantity, i.reorderLevel,
      i.averageCost || "0", i.totalValue || "0", i.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "stock_inventory.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "overview", label: "Stock Overview", icon: BarChart3 },
    { id: "warehouse", label: "Warehouse Matrix", icon: Warehouse },
    { id: "master", label: "Stock Master", icon: Boxes },
    { id: "movements", label: "Movement Log", icon: History },
    { id: "adjustments", label: "Adjustments", icon: ClipboardCheck },
    { id: "reorder", label: "Reorder Alerts", icon: AlertTriangle },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Stock Management</h1>
          <p className="text-muted-foreground mt-1">Monitor, control, and manage inventory across all locations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setEditingLocation(null); setShowLocationDialog(true); }} data-testid="button-add-location">
            <MapPin className="h-4 w-4 mr-2" /> Add Location
          </Button>
          <Button onClick={() => { setEditingItem(null); setShowItemDialog(true); }} className="bg-gradient-to-r from-slate-700 to-emerald-600 text-white" data-testid="button-add-stock">
            <Plus className="h-4 w-4 mr-2" /> Add Stock Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-3">
        {[
          { label: "Inventory Value", value: `PKR ${totalValue >= 1000000 ? (totalValue / 1000000).toFixed(1) + "M" : totalValue >= 1000 ? (totalValue / 1000).toFixed(1) + "K" : totalValue.toFixed(0)}`, icon: DollarSign, gradient: "from-blue-500 to-blue-700", isText: true },
          { label: "Total SKUs", value: totalSKUs, icon: Package, gradient: "from-slate-600 to-slate-800" },
          { label: "Units in Stock", value: totalUnits, icon: Boxes, gradient: "from-emerald-500 to-emerald-700" },
          { label: "Low Stock", value: lowStockItems, icon: TrendingDown, gradient: "from-yellow-500 to-yellow-700" },
          { label: "Out of Stock", value: outOfStockItems, icon: AlertTriangle, gradient: "from-red-500 to-red-700" },
          { label: "Reserved", value: reservedStock, icon: Package, gradient: "from-cyan-500 to-cyan-700" },
          { label: "In Transit", value: inTransitStock, icon: ArrowRightLeft, gradient: "from-purple-500 to-purple-700" },
          { label: "Critical Items", value: criticalItems, icon: AlertTriangle, gradient: "from-rose-500 to-rose-700" },
        ].map((kpi, idx) => (
          <Card key={idx} className={`bg-gradient-to-br ${kpi.gradient} text-white border-0 shadow-lg`} data-testid={`card-kpi-${idx}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2"><kpi.icon className="h-5 w-5 opacity-80" /></div>
              <div className="text-xl font-bold" data-testid={`text-kpi-value-${idx}`}>{kpi.value}</div>
              <div className="text-xs opacity-80 mt-1">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-emerald-600 text-emerald-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid={`tab-${tab.id}`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Stock by Warehouse</CardTitle></CardHeader>
            <CardContent>
              {stockByWarehouse.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No stock data yet</p> : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={stockByWarehouse} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {stockByWarehouse.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Monthly Stock Movement</CardTitle></CardHeader>
            <CardContent>
              {monthlyMovement.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No movement data yet</p> : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyMovement}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="inQty" fill="#059669" name="In" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="outQty" fill="#dc2626" name="Out" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Stock by Category</CardTitle></CardHeader>
            <CardContent>
              {stockByCategory.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No data yet</p> : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stockByCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0891b2" name="Units" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Stock Health Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Healthy Stock", count: stockItems.filter(i => i.status === "healthy").length, color: "bg-green-500", total: stockItems.length },
                  { label: "Low Stock", count: lowStockItems, color: "bg-yellow-500", total: stockItems.length },
                  { label: "Critical", count: criticalItems, color: "bg-red-500", total: stockItems.length },
                  { label: "Out of Stock", count: outOfStockItems, color: "bg-gray-500", total: stockItems.length },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span className="text-sm flex-1">{item.label}</span>
                    <span className="text-sm font-bold">{item.count}</span>
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right">{item.total > 0 ? ((item.count / item.total) * 100).toFixed(0) : 0}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "warehouse" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Warehouse Stock Matrix</h2>
            <Button variant="outline" size="sm" onClick={() => { setEditingLocation(null); setShowLocationDialog(true); }} data-testid="button-add-location-matrix">
              <Plus className="h-3 w-3 mr-1" /> Add Location
            </Button>
          </div>

          {stockLocations.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <Warehouse className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No locations defined yet. Add warehouse or POP locations to see the matrix.</p>
            </CardContent></Card>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {stockLocations.map(loc => {
                  const locItems = stockItems.filter(i => i.locationId === loc.id);
                  const locQty = locItems.reduce((s, i) => s + (i.currentQuantity || 0), 0);
                  const locValue = locItems.reduce((s, i) => s + parseFloat(i.totalValue || "0"), 0);
                  const locLow = locItems.filter(i => i.status === "low_stock" || i.status === "critical").length;
                  return (
                    <Card key={loc.id} className="hover:shadow-md transition-shadow" data-testid={`card-location-${loc.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Warehouse className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium text-sm">{loc.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">{loc.locationType}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                          <div><span className="text-muted-foreground">Items</span><div className="font-bold">{locItems.length}</div></div>
                          <div><span className="text-muted-foreground">Units</span><div className="font-bold">{locQty}</div></div>
                          <div><span className="text-muted-foreground">Value</span><div className="font-bold">PKR {locValue >= 1000 ? (locValue / 1000).toFixed(0) + "K" : locValue.toFixed(0)}</div></div>
                        </div>
                        {locLow > 0 && <div className="mt-2 text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {locLow} low/critical items</div>}
                        <div className="flex gap-1 mt-3">
                          <Button variant="ghost" size="sm" className="h-6 text-xs flex-1" onClick={() => { setEditingLocation(loc); setShowLocationDialog(true); }} data-testid={`button-edit-loc-${loc.id}`}>
                            <Pencil className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 text-xs flex-1 text-red-500" onClick={() => { if (confirm("Delete this location?")) deleteLocationMutation.mutate(loc.id); }} data-testid={`button-delete-loc-${loc.id}`}>
                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 to-emerald-700 text-white">
                      <th className="p-2.5 text-left font-medium rounded-tl-lg">Product</th>
                      {stockLocations.map(loc => (
                        <th key={loc.id} className="p-2.5 text-center font-medium">{loc.name}</th>
                      ))}
                      <th className="p-2.5 text-center font-medium">Reserved</th>
                      <th className="p-2.5 text-center font-medium">In Transit</th>
                      <th className="p-2.5 text-center font-medium rounded-tr-lg">Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const productNames = [...new Set(stockItems.map(i => i.productName))];
                      if (productNames.length === 0) return <tr><td colSpan={stockLocations.length + 4} className="p-8 text-center text-muted-foreground">No stock items yet</td></tr>;
                      return productNames.map((name, idx) => {
                        const items = stockItems.filter(i => i.productName === name);
                        const totalReserved = items.reduce((s, i) => s + (i.reservedQuantity || 0), 0);
                        const totalTransit = items.reduce((s, i) => s + (i.inTransitQuantity || 0), 0);
                        const totalAvailable = items.reduce((s, i) => s + (i.availableQuantity || 0), 0);
                        return (
                          <tr key={idx} className="border-b hover:bg-muted/50">
                            <td className="p-2.5 font-medium">{name}</td>
                            {stockLocations.map(loc => {
                              const locItem = items.find(i => i.locationId === loc.id);
                              const qty = locItem?.currentQuantity || 0;
                              const reorder = locItem?.reorderLevel || 10;
                              const minimum = locItem?.minimumStock || 5;
                              const dotColor = qty <= 0 ? "bg-gray-400" : qty <= minimum ? "bg-red-500" : qty <= reorder ? "bg-yellow-500" : "bg-green-500";
                              return (
                                <td key={loc.id} className="p-2.5 text-center">
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                                    <span className="font-mono">{qty}</span>
                                  </span>
                                </td>
                              );
                            })}
                            <td className="p-2.5 text-center font-mono text-blue-600">{totalReserved}</td>
                            <td className="p-2.5 text-center font-mono text-purple-600">{totalTransit}</td>
                            <td className="p-2.5 text-center font-mono font-medium">{totalAvailable}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "master" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by product, SKU, or brand..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search-stock" />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} data-testid="button-toggle-filters">
              <Filter className="h-4 w-4 mr-2" /> Filters {showFilters ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </Button>
            <Button variant="outline" onClick={handleExportCSV} data-testid="button-export-csv"><Download className="h-4 w-4 mr-2" /> Export</Button>
          </div>

          {showFilters && (
            <Card><CardContent className="p-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">Warehouse</Label>
                  <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
                    <SelectTrigger data-testid="filter-warehouse"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {stockLocations.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger data-testid="filter-category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger data-testid="filter-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Brand</Label>
                  <Select value={filterBrand} onValueChange={setFilterBrand}>
                    <SelectTrigger data-testid="filter-brand"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {brands.map(b => <SelectItem key={b} value={b!}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent></Card>
          )}

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-emerald-700 text-white">
                  <th className="p-2.5 text-left font-medium rounded-tl-lg">Product</th>
                  <th className="p-2.5 text-left font-medium">Brand</th>
                  <th className="p-2.5 text-left font-medium">Category</th>
                  <th className="p-2.5 text-left font-medium">SKU</th>
                  <th className="p-2.5 text-left font-medium">Location</th>
                  <th className="p-2.5 text-right font-medium">Current</th>
                  <th className="p-2.5 text-right font-medium">Reserved</th>
                  <th className="p-2.5 text-right font-medium">Available</th>
                  <th className="p-2.5 text-right font-medium">Reorder Lvl</th>
                  <th className="p-2.5 text-right font-medium">Avg Cost</th>
                  <th className="p-2.5 text-right font-medium">Total Value</th>
                  <th className="p-2.5 text-center font-medium">Status</th>
                  <th className="p-2.5 text-center font-medium rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={13} className="p-8 text-center text-muted-foreground">Loading stock items...</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan={13} className="p-8 text-center text-muted-foreground">No stock items found</td></tr>
                ) : filteredItems.map(item => {
                  const sc = statusConfig[item.status] || statusConfig.healthy;
                  return (
                    <tr key={item.id} className="border-b hover:bg-muted/50 transition-colors" data-testid={`row-stock-${item.id}`}>
                      <td className="p-2.5 font-medium">{item.productName}</td>
                      <td className="p-2.5 text-muted-foreground">{item.brandName || "—"}</td>
                      <td className="p-2.5">{item.category || "—"}</td>
                      <td className="p-2.5 font-mono text-xs">{item.skuCode || "—"}</td>
                      <td className="p-2.5">{item.locationName || "—"}</td>
                      <td className="p-2.5 text-right font-mono">{item.currentQuantity}</td>
                      <td className="p-2.5 text-right font-mono text-blue-600">{item.reservedQuantity}</td>
                      <td className="p-2.5 text-right font-mono font-medium">{item.availableQuantity}</td>
                      <td className="p-2.5 text-right">{item.reorderLevel}</td>
                      <td className="p-2.5 text-right font-mono">{parseFloat(item.averageCost || "0").toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono">{parseFloat(item.totalValue || "0").toLocaleString()}</td>
                      <td className="p-2.5 text-center"><Badge className={`${sc.color} text-xs`}>{sc.label}</Badge></td>
                      <td className="p-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingItem(item); setShowItemDialog(true); }} title="Edit" data-testid={`button-edit-${item.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-amber-600" onClick={() => { setAdjustmentItem(item); setShowAdjustmentDialog(true); }} title="Adjust" data-testid={`button-adjust-${item.id}`}><ClipboardCheck className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600" onClick={() => { setTransferSource(item); setShowTransferDialog(true); }} title="Transfer" data-testid={`button-transfer-${item.id}`}><ArrowRightLeft className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-purple-600" onClick={() => { setMovementItem(item); setShowMovementDialog(true); }} title="Movement History" data-testid={`button-history-${item.id}`}><History className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => { if (confirm("Delete this stock item?")) deleteItemMutation.mutate(item.id); }} title="Delete" data-testid={`button-delete-${item.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "movements" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Stock Movement Log</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                  <th className="p-2.5 text-left font-medium rounded-tl-lg">Date & Time</th>
                  <th className="p-2.5 text-left font-medium">Movement ID</th>
                  <th className="p-2.5 text-left font-medium">Type</th>
                  <th className="p-2.5 text-left font-medium">Product</th>
                  <th className="p-2.5 text-left font-medium">Location</th>
                  <th className="p-2.5 text-right font-medium">Qty In</th>
                  <th className="p-2.5 text-right font-medium">Qty Out</th>
                  <th className="p-2.5 text-right font-medium">Balance</th>
                  <th className="p-2.5 text-left font-medium">By</th>
                  <th className="p-2.5 text-left font-medium rounded-tr-lg">Notes</th>
                </tr>
              </thead>
              <tbody>
                {stockMovements.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">No movements recorded yet</td></tr>
                ) : stockMovements.map(mv => {
                  const tc = movementTypeConfig[mv.movementType] || { label: mv.movementType, color: "text-gray-600" };
                  return (
                    <tr key={mv.id} className="border-b hover:bg-muted/50" data-testid={`row-movement-${mv.id}`}>
                      <td className="p-2.5 text-xs">{mv.createdAt ? new Date(mv.createdAt).toLocaleString() : "—"}</td>
                      <td className="p-2.5 font-mono text-xs">{mv.movementId}</td>
                      <td className={`p-2.5 font-medium text-xs ${tc.color}`}>{tc.label}</td>
                      <td className="p-2.5">{mv.productName || "—"}</td>
                      <td className="p-2.5">{mv.locationName || "—"}</td>
                      <td className="p-2.5 text-right font-mono text-green-600">{(mv.quantityIn || 0) > 0 ? `+${mv.quantityIn}` : "—"}</td>
                      <td className="p-2.5 text-right font-mono text-red-600">{(mv.quantityOut || 0) > 0 ? `-${mv.quantityOut}` : "—"}</td>
                      <td className="p-2.5 text-right font-mono font-medium">{mv.balanceAfter}</td>
                      <td className="p-2.5 text-xs">{mv.performedBy || "—"}</td>
                      <td className="p-2.5 text-xs text-muted-foreground max-w-[200px] truncate">{mv.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "adjustments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Stock Adjustments</h2>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                  <th className="p-2.5 text-left font-medium rounded-tl-lg">Adjustment ID</th>
                  <th className="p-2.5 text-left font-medium">Product</th>
                  <th className="p-2.5 text-left font-medium">Location</th>
                  <th className="p-2.5 text-left font-medium">Type</th>
                  <th className="p-2.5 text-right font-medium">Before</th>
                  <th className="p-2.5 text-right font-medium">Adjustment</th>
                  <th className="p-2.5 text-right font-medium">After</th>
                  <th className="p-2.5 text-left font-medium">Reason</th>
                  <th className="p-2.5 text-center font-medium">Approval</th>
                  <th className="p-2.5 text-left font-medium">By</th>
                  <th className="p-2.5 text-center font-medium rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockAdjustments.length === 0 ? (
                  <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">No adjustments recorded yet</td></tr>
                ) : stockAdjustments.map(adj => {
                  const adjQty = adj.quantityAdjustment || 0;
                  return (
                    <tr key={adj.id} className="border-b hover:bg-muted/50" data-testid={`row-adjustment-${adj.id}`}>
                      <td className="p-2.5 font-mono text-xs">{adj.adjustmentId}</td>
                      <td className="p-2.5">{adj.productName || "—"}</td>
                      <td className="p-2.5">{adj.locationName || "—"}</td>
                      <td className="p-2.5 capitalize text-xs">{adj.adjustmentType?.replace(/_/g, " ")}</td>
                      <td className="p-2.5 text-right font-mono">{adj.quantityBefore}</td>
                      <td className={`p-2.5 text-right font-mono font-medium ${adjQty > 0 ? "text-green-600" : adjQty < 0 ? "text-red-600" : ""}`}>
                        {adjQty > 0 ? `+${adjQty}` : adjQty}
                      </td>
                      <td className="p-2.5 text-right font-mono font-medium">{adj.quantityAfter}</td>
                      <td className="p-2.5 text-xs max-w-[150px] truncate">{adj.reason}</td>
                      <td className="p-2.5 text-center">
                        <Badge className={`text-xs ${adj.approvalStatus === "approved" || adj.approvalStatus === "auto_approved" ? "bg-green-100 text-green-800" : adj.approvalStatus === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                          {adj.approvalStatus === "auto_approved" ? "Auto" : adj.approvalStatus}
                        </Badge>
                      </td>
                      <td className="p-2.5 text-xs">{adj.performedBy || "—"}</td>
                      <td className="p-2.5 text-center">
                        {adj.approvalStatus === "pending" && (
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-green-600" onClick={() => approveAdjustmentMutation.mutate({ id: adj.id, data: { action: "approve", approvedBy: "admin" } })} data-testid={`button-approve-adj-${adj.id}`}><ShieldCheck className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-600" onClick={() => approveAdjustmentMutation.mutate({ id: adj.id, data: { action: "reject", approvedBy: "admin" } })} data-testid={`button-reject-adj-${adj.id}`}><ShieldX className="h-3.5 w-3.5" /></Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "reorder" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Reorder Alerts & Suggestions</h2>
          {(() => {
            const reorderItems = stockItems.filter(i => (i.currentQuantity || 0) <= (i.reorderLevel || 10));
            if (reorderItems.length === 0) return (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>All stock levels are healthy. No reorder alerts.</p>
              </CardContent></Card>
            );
            return (
              <div className="space-y-3">
                {reorderItems.map(item => {
                  const sc = statusConfig[item.status] || statusConfig.healthy;
                  const suggestedOrder = Math.max((item.reorderLevel || 10) * 2 - (item.currentQuantity || 0), 10);
                  const estValue = suggestedOrder * parseFloat(item.averageCost || "0");
                  return (
                    <Card key={item.id} className={`border-l-4 ${item.status === "critical" || item.status === "out_of_stock" ? "border-l-red-500" : "border-l-yellow-500"}`} data-testid={`card-reorder-${item.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="font-medium">{item.productName}</div>
                              <div className="text-xs text-muted-foreground">{item.skuCode || ""} • {item.locationName || "—"} • {item.brandName || ""}</div>
                            </div>
                            <Badge className={sc.color}>{sc.label}</Badge>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">Current</div>
                              <div className="font-mono font-bold text-red-600">{item.currentQuantity}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">Reorder Level</div>
                              <div className="font-mono">{item.reorderLevel}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">Suggested Order</div>
                              <div className="font-mono font-bold text-emerald-600">{suggestedOrder}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-muted-foreground">Est. Value</div>
                              <div className="font-mono">PKR {estValue.toLocaleString()}</div>
                            </div>
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => { setAdjustmentItem(item); setShowAdjustmentDialog(true); }} data-testid={`button-reorder-adjust-${item.id}`}>
                              <RefreshCw className="h-3 w-3 mr-1" /> Quick Adjust
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                <Card className="bg-muted/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="text-sm font-medium">Total Estimated Reorder Value</span>
                    <span className="font-mono font-bold text-lg text-emerald-600">
                      PKR {reorderItems.reduce((s, i) => {
                        const sugQty = Math.max((i.reorderLevel || 10) * 2 - (i.currentQuantity || 0), 10);
                        return s + sugQty * parseFloat(i.averageCost || "0");
                      }, 0).toLocaleString()}
                    </span>
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </div>
      )}

      {showItemDialog && <StockItemDialog item={editingItem} products={products} locations={stockLocations}
        onSave={(data: any) => editingItem ? updateItemMutation.mutate({ id: editingItem.id, data }) : createItemMutation.mutate(data)}
        onClose={() => { setShowItemDialog(false); setEditingItem(null); }}
        isPending={createItemMutation.isPending || updateItemMutation.isPending} />}

      {showTransferDialog && transferSource && <TransferDialog source={transferSource} locations={stockLocations}
        onSave={(data: any) => transferMutation.mutate(data)}
        onClose={() => { setShowTransferDialog(false); setTransferSource(null); }}
        isPending={transferMutation.isPending} />}

      {showAdjustmentDialog && adjustmentItem && <AdjustmentDialog item={adjustmentItem}
        onSave={(data: any) => adjustmentMutation.mutate(data)}
        onClose={() => { setShowAdjustmentDialog(false); setAdjustmentItem(null); }}
        isPending={adjustmentMutation.isPending} />}

      {showMovementDialog && movementItem && <MovementHistoryDialog item={movementItem}
        onClose={() => { setShowMovementDialog(false); setMovementItem(null); }} />}

      {showLocationDialog && <LocationDialog location={editingLocation}
        onSave={(data: any) => locationMutation.mutate(data)}
        onClose={() => { setShowLocationDialog(false); setEditingLocation(null); }}
        isPending={locationMutation.isPending} />}
    </div>
  );
}

function StockItemDialog({ item, products, locations, onSave, onClose, isPending }: any) {
  const [productName, setProductName] = useState(item?.productName || "");
  const [brandName, setBrandName] = useState(item?.brandName || "");
  const [category, setCategory] = useState(item?.category || "");
  const [skuCode, setSkuCode] = useState(item?.skuCode || "");
  const [locationId, setLocationId] = useState(item?.locationId?.toString() || "");
  const [locationName, setLocationName] = useState(item?.locationName || "");
  const [currentQuantity, setCurrentQuantity] = useState(String(item?.currentQuantity || 0));
  const [reservedQuantity, setReservedQuantity] = useState(String(item?.reservedQuantity || 0));
  const [inTransitQuantity, setInTransitQuantity] = useState(String(item?.inTransitQuantity || 0));
  const [reorderLevel, setReorderLevel] = useState(String(item?.reorderLevel || 10));
  const [minimumStock, setMinimumStock] = useState(String(item?.minimumStock || 5));
  const [averageCost, setAverageCost] = useState(item?.averageCost || "0");

  const handleProductSelect = (productId: string) => {
    const prod = products.find((p: Product) => p.id === parseInt(productId));
    if (prod) {
      setProductName(prod.name);
      setBrandName(prod.category || "");
      setSkuCode(prod.skuCode || "");
      setCategory(prod.category || "");
      setAverageCost(prod.purchaseCost || "0");
    }
  };

  const handleLocationSelect = (locId: string) => {
    setLocationId(locId);
    const loc = locations.find((l: StockLocation) => l.id === parseInt(locId));
    if (loc) setLocationName(loc.name);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{item ? "Edit Stock Item" : "Add Stock Item"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Product (from catalog)</Label>
              <Select onValueChange={handleProductSelect}>
                <SelectTrigger data-testid="select-product"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p: Product) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product Name *</Label>
              <Input value={productName} onChange={e => setProductName(e.target.value)} data-testid="input-product-name" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Brand</Label><Input value={brandName} onChange={e => setBrandName(e.target.value)} data-testid="input-brand" /></div>
            <div><Label>Category</Label><Input value={category} onChange={e => setCategory(e.target.value)} data-testid="input-category" /></div>
            <div><Label>SKU Code</Label><Input value={skuCode} onChange={e => setSkuCode(e.target.value)} className="font-mono" data-testid="input-sku" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Location</Label>
              <Select value={locationId} onValueChange={handleLocationSelect}>
                <SelectTrigger data-testid="select-location"><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {locations.map((l: StockLocation) => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Average Cost</Label><Input type="number" step="0.01" value={averageCost} onChange={e => setAverageCost(e.target.value)} data-testid="input-avg-cost" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>Current Quantity</Label><Input type="number" min="0" value={currentQuantity} onChange={e => setCurrentQuantity(e.target.value)} data-testid="input-current-qty" /></div>
            <div><Label>Reserved</Label><Input type="number" min="0" value={reservedQuantity} onChange={e => setReservedQuantity(e.target.value)} data-testid="input-reserved-qty" /></div>
            <div><Label>In Transit</Label><Input type="number" min="0" value={inTransitQuantity} onChange={e => setInTransitQuantity(e.target.value)} data-testid="input-transit-qty" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Reorder Level</Label><Input type="number" min="0" value={reorderLevel} onChange={e => setReorderLevel(e.target.value)} data-testid="input-reorder" /></div>
            <div><Label>Minimum Stock</Label><Input type="number" min="0" value={minimumStock} onChange={e => setMinimumStock(e.target.value)} data-testid="input-min-stock" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-item">Cancel</Button>
          <Button onClick={() => onSave({
            productName, brandName, category, skuCode,
            locationId: locationId ? parseInt(locationId) : null, locationName,
            currentQuantity: parseInt(currentQuantity) || 0, reservedQuantity: parseInt(reservedQuantity) || 0,
            inTransitQuantity: parseInt(inTransitQuantity) || 0, reorderLevel: parseInt(reorderLevel) || 10,
            minimumStock: parseInt(minimumStock) || 5, averageCost,
          })} disabled={!productName || isPending} className="bg-gradient-to-r from-slate-700 to-emerald-600 text-white" data-testid="button-save-item">
            {isPending ? "Saving..." : item ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TransferDialog({ source, locations, onSave, onClose, isPending }: any) {
  const [destLocationId, setDestLocationId] = useState("");
  const [destLocationName, setDestLocationName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");

  const handleDestSelect = (locId: string) => {
    setDestLocationId(locId);
    const loc = locations.find((l: StockLocation) => l.id === parseInt(locId));
    if (loc) setDestLocationName(loc.name);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Transfer Stock</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <div className="font-medium">{source.productName}</div>
            <div className="text-muted-foreground text-xs mt-1">From: {source.locationName || "—"} • Available: {source.availableQuantity}</div>
          </div>
          <div>
            <Label>Destination Location *</Label>
            <Select value={destLocationId} onValueChange={handleDestSelect}>
              <SelectTrigger data-testid="select-dest-location"><SelectValue placeholder="Select destination" /></SelectTrigger>
              <SelectContent>
                {locations.filter((l: StockLocation) => l.id !== source.locationId).map((l: StockLocation) => (
                  <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quantity *</Label>
            <Input type="number" min="1" max={source.availableQuantity} value={quantity} onChange={e => setQuantity(e.target.value)} data-testid="input-transfer-qty" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} data-testid="input-transfer-notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-transfer">Cancel</Button>
          <Button onClick={() => onSave({
            sourceItemId: source.id, destinationLocationId: parseInt(destLocationId),
            destinationLocationName: destLocationName, quantity: parseInt(quantity) || 1,
            performedBy: "admin", notes,
          })} disabled={!destLocationId || !quantity || parseInt(quantity) < 1 || isPending}
            className="bg-gradient-to-r from-slate-700 to-emerald-600 text-white" data-testid="button-execute-transfer">
            {isPending ? "Transferring..." : "Execute Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdjustmentDialog({ item, onSave, onClose, isPending }: any) {
  const [adjustmentType, setAdjustmentType] = useState("physical_count");
  const [quantityAdjustment, setQuantityAdjustment] = useState("0");
  const [reason, setReason] = useState("");

  const adjTypes = [
    { value: "physical_count", label: "Physical Count" },
    { value: "damage", label: "Damage" },
    { value: "lost", label: "Lost Stock" },
    { value: "expired", label: "Expired" },
    { value: "data_correction", label: "Data Correction" },
  ];

  const afterQty = (item.currentQuantity || 0) + (parseInt(quantityAdjustment) || 0);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Stock Adjustment</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <div className="font-medium">{item.productName}</div>
            <div className="text-muted-foreground text-xs mt-1">{item.locationName || "—"} • Current: {item.currentQuantity}</div>
          </div>
          <div>
            <Label>Adjustment Type *</Label>
            <Select value={adjustmentType} onValueChange={setAdjustmentType}>
              <SelectTrigger data-testid="select-adj-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {adjTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quantity Adjustment (positive to add, negative to remove) *</Label>
            <Input type="number" value={quantityAdjustment} onChange={e => setQuantityAdjustment(e.target.value)} data-testid="input-adj-qty" />
            <div className="text-xs mt-1 flex justify-between">
              <span>Current: {item.currentQuantity}</span>
              <span className={`font-medium ${afterQty < 0 ? "text-red-600" : ""}`}>After: {afterQty}</span>
            </div>
          </div>
          <div>
            <Label>Reason *</Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Mandatory reason for adjustment" rows={2} data-testid="input-adj-reason" />
          </div>
          {Math.abs(parseInt(quantityAdjustment) || 0) * parseFloat(item.averageCost || "0") > 50000 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700 dark:text-amber-400">High-value adjustment — will require admin approval.</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-adj">Cancel</Button>
          <Button onClick={() => onSave({
            stockItemId: item.id, adjustmentType, quantityAdjustment: parseInt(quantityAdjustment) || 0,
            reason, performedBy: "admin", productName: item.productName, locationName: item.locationName,
          })} disabled={!reason || afterQty < 0 || isPending}
            className="bg-gradient-to-r from-slate-700 to-emerald-600 text-white" data-testid="button-save-adj">
            {isPending ? "Saving..." : "Record Adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MovementHistoryDialog({ item, onClose }: any) {
  const { data: movements = [] } = useQuery<StockMovement[]>({ queryKey: ["/api/stock-movements", item.id], queryFn: () => fetch(`/api/stock-movements/${item.id}`, { credentials: "include" }).then(r => r.json()) });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Movement History — {item.productName}</DialogTitle></DialogHeader>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-800 to-emerald-700 text-white">
                <th className="p-2 text-left font-medium rounded-tl-lg text-xs">Date</th>
                <th className="p-2 text-left font-medium text-xs">ID</th>
                <th className="p-2 text-left font-medium text-xs">Type</th>
                <th className="p-2 text-right font-medium text-xs">In</th>
                <th className="p-2 text-right font-medium text-xs">Out</th>
                <th className="p-2 text-right font-medium text-xs">Balance</th>
                <th className="p-2 text-left font-medium text-xs rounded-tr-lg">Notes</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No movements for this item</td></tr>
              ) : movements.map(mv => {
                const tc = movementTypeConfig[mv.movementType] || { label: mv.movementType, color: "text-gray-600" };
                return (
                  <tr key={mv.id} className="border-b">
                    <td className="p-2 text-xs">{mv.createdAt ? new Date(mv.createdAt).toLocaleDateString() : "—"}</td>
                    <td className="p-2 font-mono text-xs">{mv.movementId}</td>
                    <td className={`p-2 text-xs font-medium ${tc.color}`}>{tc.label}</td>
                    <td className="p-2 text-right font-mono text-green-600 text-xs">{(mv.quantityIn || 0) > 0 ? `+${mv.quantityIn}` : "—"}</td>
                    <td className="p-2 text-right font-mono text-red-600 text-xs">{(mv.quantityOut || 0) > 0 ? `-${mv.quantityOut}` : "—"}</td>
                    <td className="p-2 text-right font-mono font-medium text-xs">{mv.balanceAfter}</td>
                    <td className="p-2 text-xs text-muted-foreground">{mv.notes || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-close-history">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LocationDialog({ location, onSave, onClose, isPending }: any) {
  const [name, setName] = useState(location?.name || "");
  const [locationType, setLocationType] = useState(location?.locationType || "warehouse");
  const [address, setAddress] = useState(location?.address || "");
  const [manager, setManager] = useState(location?.manager || "");
  const [capacity, setCapacity] = useState(String(location?.capacity || ""));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{location ? "Edit Location" : "Add Location"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} data-testid="input-loc-name" /></div>
            <div>
              <Label>Type</Label>
              <Select value={locationType} onValueChange={setLocationType}>
                <SelectTrigger data-testid="select-loc-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                  <SelectItem value="pop">POP</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="field">Field</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Address</Label><Input value={address} onChange={e => setAddress(e.target.value)} data-testid="input-loc-address" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Manager</Label><Input value={manager} onChange={e => setManager(e.target.value)} data-testid="input-loc-manager" /></div>
            <div><Label>Capacity</Label><Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} data-testid="input-loc-capacity" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-loc">Cancel</Button>
          <Button onClick={() => onSave({ name, locationType, address, manager, capacity: capacity ? parseInt(capacity) : null })}
            disabled={!name || isPending} className="bg-gradient-to-r from-slate-700 to-emerald-600 text-white" data-testid="button-save-loc">
            {isPending ? "Saving..." : location ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}