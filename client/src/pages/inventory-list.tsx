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
  Package, Search, Filter, Download, Eye, Pencil, Trash2, ArrowRightLeft,
  AlertTriangle, DollarSign, Boxes, BarChart3, Warehouse, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, ClipboardCheck, History, X, FileText, Printer,
  ShoppingCart, Archive, RefreshCw, Layers, Tag, MapPin, FileSpreadsheet
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, Legend
} from "recharts";
import type { StockItem, StockLocation, StockMovement, StockAdjustment, Product } from "@shared/schema";

const statusConfig: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  healthy: { label: "In Stock", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", dot: "bg-green-500", bg: "bg-green-500" },
  low_stock: { label: "Low Stock", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", dot: "bg-yellow-500", bg: "bg-yellow-500" },
  critical: { label: "Critical", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500", bg: "bg-red-500" },
  out_of_stock: { label: "Out of Stock", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400", dot: "bg-gray-500", bg: "bg-gray-500" },
  reserved: { label: "Reserved", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", dot: "bg-blue-500", bg: "bg-blue-500" },
  allocated: { label: "Allocated", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", dot: "bg-purple-500", bg: "bg-purple-500" },
  discontinued: { label: "Discontinued", color: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400", dot: "bg-slate-600", bg: "bg-slate-600" },
};

const CHART_COLORS = ["#1E40AF", "#0D9488", "#7c3aed", "#dc2626", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6", "#ea580c", "#84cc16"];

const movementTypeLabels: Record<string, string> = {
  purchase_receipt: "Purchase",
  transfer_in: "Transfer In",
  transfer_out: "Transfer Out",
  allocation: "Allocation",
  assignment: "Assignment",
  sales: "Sales",
  adjustment: "Adjustment",
  return: "Return",
  write_off: "Write-Off",
};

export default function InventoryListPage() {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [detailTab, setDetailTab] = useState<"details" | "warehouse" | "movements">("details");

  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferSource, setTransferSource] = useState<StockItem | null>(null);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);

  const { data: stockItems = [], isLoading } = useQuery<StockItem[]>({ queryKey: ["/api/stock-items"] });
  const { data: stockLocations = [] } = useQuery<StockLocation[]>({ queryKey: ["/api/stock-locations"] });
  const { data: stockMovements = [] } = useQuery<StockMovement[]>({ queryKey: ["/api/stock-movements"] });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/stock-items/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] }); toast({ title: "Stock item updated" }); setShowEditDialog(false); setEditItem(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/stock-items/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] }); toast({ title: "Stock item archived" }); setSelectedItem(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const transferMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/stock-transfer", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      toast({ title: "Transfer completed" }); setShowTransferDialog(false); setTransferSource(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const adjustMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/stock-adjustments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      toast({ title: "Adjustment recorded" }); setShowAdjustDialog(false); setAdjustItem(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const totalProducts = new Set(stockItems.map(i => i.productName)).size;
  const totalQty = stockItems.reduce((s, i) => s + (i.currentQuantity || 0), 0);
  const totalValue = stockItems.reduce((s, i) => s + parseFloat(i.totalValue || "0"), 0);
  const lowStockCount = stockItems.filter(i => i.status === "low_stock").length;
  const outOfStockCount = stockItems.filter(i => i.status === "out_of_stock").length;
  const totalReserved = stockItems.reduce((s, i) => s + (i.reservedQuantity || 0), 0);
  const totalAllocated = stockItems.reduce((s, i) => s + (i.inTransitQuantity || 0), 0);

  const categories = useMemo(() => [...new Set(stockItems.map(i => i.category).filter(Boolean))] as string[], [stockItems]);
  const brands = useMemo(() => [...new Set(stockItems.map(i => i.brandName).filter(Boolean))] as string[], [stockItems]);

  const filteredItems = useMemo(() => {
    return stockItems.filter(item => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !item.productName?.toLowerCase().includes(q) &&
          !item.skuCode?.toLowerCase().includes(q) &&
          !item.brandName?.toLowerCase().includes(q) &&
          !item.category?.toLowerCase().includes(q) &&
          !item.locationName?.toLowerCase().includes(q)
        ) return false;
      }
      if (filterWarehouse !== "all" && String(item.locationId) !== filterWarehouse) return false;
      if (filterCategory !== "all" && item.category !== filterCategory) return false;
      if (filterStatus !== "all" && item.status !== filterStatus) return false;
      if (filterBrand !== "all" && item.brandName !== filterBrand) return false;

      if (quickFilter === "low_stock" && item.status !== "low_stock") return false;
      if (quickFilter === "out_of_stock" && item.status !== "out_of_stock") return false;
      if (quickFilter === "high_value" && parseFloat(item.totalValue || "0") < 100000) return false;
      if (quickFilter === "reserved" && (item.reservedQuantity || 0) <= 0) return false;
      if (quickFilter === "allocated" && (item.inTransitQuantity || 0) <= 0) return false;
      if (quickFilter === "critical" && item.status !== "critical") return false;

      return true;
    });
  }, [stockItems, searchQuery, filterWarehouse, filterCategory, filterStatus, filterBrand, quickFilter]);

  const stockByWarehouse = useMemo(() => {
    const map: Record<string, number> = {};
    stockItems.forEach(i => { const loc = i.locationName || "Unassigned"; map[loc] = (map[loc] || 0) + (i.currentQuantity || 0); });
    return Object.entries(map).map(([name, value]) => ({ name: name.length > 16 ? name.slice(0, 16) + "…" : name, value }));
  }, [stockItems]);

  const stockByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    stockItems.forEach(i => { const cat = i.category || "Other"; map[cat] = (map[cat] || 0) + (i.currentQuantity || 0); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [stockItems]);

  const valueByBrand = useMemo(() => {
    const map: Record<string, number> = {};
    stockItems.forEach(i => { const b = i.brandName || "Other"; map[b] = (map[b] || 0) + parseFloat(i.totalValue || "0"); });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [stockItems]);

  const inventoryGrowth = useMemo(() => {
    const map: Record<string, number> = {};
    stockMovements.forEach(m => {
      const month = m.createdAt?.slice(0, 7) || "";
      if (!month) return;
      map[month] = (map[month] || 0) + (m.quantityIn || 0) - (m.quantityOut || 0);
    });
    let running = 0;
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, net]) => {
      running += net;
      return { month, net: running };
    });
  }, [stockMovements]);

  const lowStockRisk = useMemo(() => {
    return stockItems
      .filter(i => (i.currentQuantity || 0) <= (i.reorderLevel || 10) * 1.5)
      .sort((a, b) => {
        const ra = (a.reorderLevel || 10) > 0 ? (a.currentQuantity || 0) / (a.reorderLevel || 10) : 999;
        const rb = (b.reorderLevel || 10) > 0 ? (b.currentQuantity || 0) / (b.reorderLevel || 10) : 999;
        return ra - rb;
      })
      .slice(0, 10)
      .map(i => ({
        name: (i.productName || "").length > 20 ? (i.productName || "").slice(0, 20) + "…" : (i.productName || ""),
        current: i.currentQuantity || 0,
        reorder: i.reorderLevel || 10,
      }));
  }, [stockItems]);

  const selectedItemMovements = useMemo(() => {
    if (!selectedItem) return [];
    return stockMovements.filter(m => m.stockItemId === selectedItem.id).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [selectedItem, stockMovements]);

  const selectedItemWarehouses = useMemo(() => {
    if (!selectedItem) return [];
    if (selectedItem.productId) {
      return stockItems.filter(i => i.productId === selectedItem.productId);
    }
    if (selectedItem.skuCode) {
      return stockItems.filter(i => i.skuCode === selectedItem.skuCode);
    }
    return stockItems.filter(i => i.productName === selectedItem.productName);
  }, [selectedItem, stockItems]);

  const selectedProduct = useMemo(() => {
    if (!selectedItem?.productId) return null;
    return products.find(p => p.id === selectedItem.productId) || null;
  }, [selectedItem, products]);

  const handleExportCSV = () => {
    const headers = ["SKU", "Product Name", "Brand", "Category", "Warehouse", "Available Qty", "Reserved Qty", "Allocated Qty", "Reorder Level", "Unit Cost", "Total Value", "Status", "Last Updated"];
    const rows = filteredItems.map(i => [
      i.skuCode || "", i.productName, i.brandName || "", i.category || "", i.locationName || "",
      i.availableQuantity, i.reservedQuantity, i.inTransitQuantity, i.reorderLevel,
      i.averageCost || "0", i.totalValue || "0", statusConfig[i.status]?.label || i.status,
      i.createdAt ? new Date(i.createdAt).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `inventory_list_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => { window.print(); };

  const quickFilters = [
    { key: "low_stock", label: "Low Stock", count: lowStockCount, icon: TrendingDown },
    { key: "out_of_stock", label: "Out of Stock", count: outOfStockCount, icon: AlertTriangle },
    { key: "high_value", label: "High Value", count: stockItems.filter(i => parseFloat(i.totalValue || "0") >= 100000).length, icon: DollarSign },
    { key: "critical", label: "Critical", count: stockItems.filter(i => i.status === "critical").length, icon: AlertTriangle },
    { key: "reserved", label: "Reserved", count: stockItems.filter(i => (i.reservedQuantity || 0) > 0).length, icon: Layers },
    { key: "allocated", label: "Allocated", count: stockItems.filter(i => (i.inTransitQuantity || 0) > 0).length, icon: ArrowRightLeft },
  ];

  const clearFilters = () => {
    setSearchQuery("");
    setFilterWarehouse("all");
    setFilterCategory("all");
    setFilterStatus("all");
    setFilterBrand("all");
    setQuickFilter(null);
  };

  const hasActiveFilters = searchQuery || filterWarehouse !== "all" || filterCategory !== "all" || filterStatus !== "all" || filterBrand !== "all" || quickFilter;

  return (
    <div className="flex h-full">
      <div className={`flex-1 p-6 space-y-6 overflow-y-auto ${selectedItem ? "pr-3" : ""}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Inventory List</h1>
            <p className="text-muted-foreground mt-1">Real-time stock visibility across all warehouses and locations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} data-testid="button-export-csv"><Download className="h-4 w-4 mr-1" /> CSV</Button>
            <Button variant="outline" size="sm" onClick={handlePrint} data-testid="button-print"><Printer className="h-4 w-4 mr-1" /> Print</Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {[
            { label: "Total Products", value: totalProducts, icon: Package, gradient: "from-[#1E40AF] to-[#1e3a8a]" },
            { label: "Total Quantity", value: totalQty.toLocaleString(), icon: Boxes, gradient: "from-[#0D9488] to-[#0f766e]" },
            { label: "Inventory Value", value: `PKR ${totalValue >= 1000000 ? (totalValue / 1000000).toFixed(1) + "M" : totalValue >= 1000 ? (totalValue / 1000).toFixed(1) + "K" : totalValue.toFixed(0)}`, icon: DollarSign, gradient: "from-[#1E40AF] to-[#0D9488]" },
            { label: "Low Stock", value: lowStockCount, icon: TrendingDown, gradient: "from-amber-500 to-amber-700" },
            { label: "Out of Stock", value: outOfStockCount, icon: AlertTriangle, gradient: "from-red-500 to-red-700" },
            { label: "Reserved Qty", value: totalReserved, icon: Layers, gradient: "from-[#1E40AF] to-[#2563eb]" },
            { label: "Allocated Qty", value: totalAllocated, icon: ArrowRightLeft, gradient: "from-[#0D9488] to-[#14b8a6]" },
          ].map((kpi, idx) => (
            <Card key={idx} className={`bg-gradient-to-br ${kpi.gradient} text-white border-0 shadow-lg`} data-testid={`card-kpi-${idx}`}>
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between mb-1.5"><kpi.icon className="h-4 w-4 opacity-80" /></div>
                <div className="text-lg font-bold" data-testid={`text-kpi-value-${idx}`}>{kpi.value}</div>
                <div className="text-[10px] opacity-80 mt-0.5">{kpi.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-4">
          <Card className="col-span-1">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Stock by Warehouse</CardTitle></CardHeader>
            <CardContent className="pb-3">
              {stockByWarehouse.length === 0 ? <p className="text-xs text-muted-foreground text-center py-6">No data</p> : (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={stockByWarehouse} cx="50%" cy="50%" outerRadius={60} innerRadius={30} dataKey="value" nameKey="name">
                      {stockByWarehouse.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => v.toLocaleString()} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Inventory Growth Trend</CardTitle></CardHeader>
            <CardContent className="pb-3">
              {inventoryGrowth.length === 0 ? <p className="text-xs text-muted-foreground text-center py-6">No data</p> : (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={inventoryGrowth}>
                    <defs><linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} /><stop offset="95%" stopColor="#0D9488" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="net" stroke="#0D9488" fill="url(#growthFill)" name="Net Stock" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">By Category</CardTitle></CardHeader>
            <CardContent className="pb-3">
              {stockByCategory.length === 0 ? <p className="text-xs text-muted-foreground text-center py-6">No data</p> : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={stockByCategory} layout="vertical" margin={{ left: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={70} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1E40AF" name="Qty" radius={[0, 3, 3, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Low Stock Risk</CardTitle></CardHeader>
            <CardContent className="pb-3">
              {lowStockRisk.length === 0 ? <p className="text-xs text-muted-foreground text-center py-6">All stock healthy</p> : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={lowStockRisk} layout="vertical" margin={{ left: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 7 }} width={75} />
                    <Tooltip />
                    <Bar dataKey="current" fill="#dc2626" name="Current" radius={[0, 3, 3, 0]} barSize={8} />
                    <Bar dataKey="reorder" fill="#f59e0b" name="Reorder Level" radius={[0, 3, 3, 0]} barSize={8} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Value by Brand</CardTitle></CardHeader>
            <CardContent className="pb-3">
              {valueByBrand.length === 0 ? <p className="text-xs text-muted-foreground text-center py-6">No data</p> : (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={valueByBrand} cx="50%" cy="50%" outerRadius={60} innerRadius={30} dataKey="value" nameKey="name">
                      {valueByBrand.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `PKR ${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by product, SKU, brand, category, warehouse..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search-inventory" />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} data-testid="button-toggle-filters">
              <Filter className="h-4 w-4 mr-1" /> Filters {showFilters ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500" data-testid="button-clear-filters">
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {quickFilters.map(qf => (
              <Button key={qf.key} variant={quickFilter === qf.key ? "default" : "outline"} size="sm"
                className={`text-xs h-7 ${quickFilter === qf.key ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white border-0" : ""}`}
                onClick={() => setQuickFilter(quickFilter === qf.key ? null : qf.key)} data-testid={`button-quick-${qf.key}`}>
                <qf.icon className="h-3 w-3 mr-1" /> {qf.label} ({qf.count})
              </Button>
            ))}
          </div>

          {showFilters && (
            <Card><CardContent className="p-3">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Warehouse</Label>
                  <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
                    <SelectTrigger className="h-8 text-xs" data-testid="filter-warehouse"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {stockLocations.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-8 text-xs" data-testid="filter-category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-8 text-xs" data-testid="filter-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Brand</Label>
                  <Select value={filterBrand} onValueChange={setFilterBrand}>
                    <SelectTrigger className="h-8 text-xs" data-testid="filter-brand"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent></Card>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#1E40AF] to-[#0D9488] text-white">
                <th className="p-2.5 text-left font-medium rounded-tl-lg">SKU</th>
                <th className="p-2.5 text-left font-medium">Product Name</th>
                <th className="p-2.5 text-left font-medium">Brand</th>
                <th className="p-2.5 text-left font-medium">Category</th>
                <th className="p-2.5 text-left font-medium">Warehouse</th>
                <th className="p-2.5 text-right font-medium">Available</th>
                <th className="p-2.5 text-right font-medium">Reserved</th>
                <th className="p-2.5 text-right font-medium">Allocated</th>
                <th className="p-2.5 text-right font-medium">Reorder Lvl</th>
                <th className="p-2.5 text-right font-medium">Unit Cost</th>
                <th className="p-2.5 text-right font-medium">Total Value</th>
                <th className="p-2.5 text-center font-medium">Status</th>
                <th className="p-2.5 text-center font-medium">Updated</th>
                <th className="p-2.5 text-center font-medium rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={14} className="p-8 text-center text-muted-foreground">Loading inventory...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={14} className="p-8 text-center text-muted-foreground">
                  {hasActiveFilters ? "No items match your filters" : "No inventory items found"}
                </td></tr>
              ) : filteredItems.map(item => {
                const sc = statusConfig[item.status] || statusConfig.healthy;
                const isLow = item.status === "low_stock";
                const isOut = item.status === "out_of_stock" || item.status === "critical";
                const isHighVal = parseFloat(item.totalValue || "0") >= 100000;
                return (
                  <tr key={item.id}
                    className={`border-b hover:bg-muted/50 transition-colors cursor-pointer ${selectedItem?.id === item.id ? "bg-blue-50 dark:bg-blue-950/20" : ""} ${isLow ? "bg-yellow-50/30 dark:bg-yellow-950/10" : ""} ${isOut ? "bg-red-50/30 dark:bg-red-950/10" : ""} ${isHighVal && !isLow && !isOut ? "bg-blue-50/20 dark:bg-blue-950/5" : ""}`}
                    onClick={() => { setSelectedItem(item); setDetailTab("details"); }}
                    data-testid={`row-inventory-${item.id}`}>
                    <td className="p-2.5 font-mono text-xs">{item.skuCode || "—"}</td>
                    <td className="p-2.5 font-medium">{item.productName}</td>
                    <td className="p-2.5 text-muted-foreground text-xs">{item.brandName || "—"}</td>
                    <td className="p-2.5 text-xs">{item.category || "—"}</td>
                    <td className="p-2.5 text-xs">{item.locationName || "—"}</td>
                    <td className="p-2.5 text-right font-mono font-medium">{item.availableQuantity}</td>
                    <td className="p-2.5 text-right font-mono text-blue-600">{item.reservedQuantity || 0}</td>
                    <td className="p-2.5 text-right font-mono text-purple-600">{item.inTransitQuantity || 0}</td>
                    <td className="p-2.5 text-right text-xs">{item.reorderLevel}</td>
                    <td className="p-2.5 text-right font-mono text-xs">{parseFloat(item.averageCost || "0").toLocaleString()}</td>
                    <td className="p-2.5 text-right font-mono text-xs">{parseFloat(item.totalValue || "0").toLocaleString()}</td>
                    <td className="p-2.5 text-center"><Badge className={`${sc.color} text-[10px]`}>{sc.label}</Badge></td>
                    <td className="p-2.5 text-center text-[10px] text-muted-foreground">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}</td>
                    <td className="p-2.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-0.5">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setSelectedItem(item); setDetailTab("details"); }} title="View Details" data-testid={`button-view-${item.id}`}><Eye className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditItem(item); setShowEditDialog(true); }} title="Edit" data-testid={`button-edit-${item.id}`}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-600" onClick={() => { setTransferSource(item); setShowTransferDialog(true); }} title="Transfer" data-testid={`button-transfer-${item.id}`}><ArrowRightLeft className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-amber-600" onClick={() => { setAdjustItem(item); setShowAdjustDialog(true); }} title="Adjust" data-testid={`button-adjust-${item.id}`}><ClipboardCheck className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-purple-600" onClick={() => { setSelectedItem(item); setDetailTab("movements"); }} title="Stock Ledger" data-testid={`button-ledger-${item.id}`}><History className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => { if (confirm("Delete this stock item? Only items with zero quantity can be deleted.")) deleteItemMutation.mutate(item.id); }} title="Delete" data-testid={`button-delete-${item.id}`}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredItems.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Showing {filteredItems.length} of {stockItems.length} items</span>
            <span>Total filtered value: PKR {filteredItems.reduce((s, i) => s + parseFloat(i.totalValue || "0"), 0).toLocaleString()}</span>
          </div>
        )}
      </div>

      {selectedItem && (
        <div className="w-[420px] border-l bg-card overflow-y-auto shrink-0">
          <div className="sticky top-0 bg-card z-10 border-b">
            <div className="flex items-center justify-between p-4 pb-2">
              <h3 className="font-semibold text-sm">Stock Intelligence</h3>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedItem(null)} data-testid="button-close-detail"><X className="h-4 w-4" /></Button>
            </div>
            <div className="flex gap-1 px-4 pb-2">
              {(["details", "warehouse", "movements"] as const).map(tab => (
                <button key={tab} onClick={() => setDetailTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${detailTab === tab ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white" : "text-muted-foreground hover:bg-muted"}`}
                  data-testid={`tab-detail-${tab}`}>
                  {tab === "details" ? "Details" : tab === "warehouse" ? "Warehouses" : "Movements"}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-4">
            {detailTab === "details" && (
              <>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center text-white">
                        <Package className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{selectedItem.productName}</h4>
                        <div className="text-xs text-muted-foreground font-mono">{selectedItem.skuCode || "No SKU"}</div>
                      </div>
                      <Badge className={statusConfig[selectedItem.status]?.color || ""}>{statusConfig[selectedItem.status]?.label || selectedItem.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <DetailField label="Brand" value={selectedItem.brandName || "—"} />
                      <DetailField label="Category" value={selectedItem.category || "—"} />
                      <DetailField label="Location" value={selectedItem.locationName || "—"} />
                      {selectedProduct && <DetailField label="Model" value={selectedProduct.model || "—"} />}
                      {selectedProduct && <DetailField label="Unit" value={selectedProduct.unitOfMeasure || "—"} />}
                      {selectedProduct && <DetailField label="Warranty" value={selectedProduct.warrantyPeriod ? `${selectedProduct.warrantyPeriod} months` : "—"} />}
                    </div>
                    {selectedProduct?.description && (
                      <div className="pt-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Description</span>
                        <p className="text-xs mt-0.5">{selectedProduct.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Stock Quantities</CardTitle></CardHeader>
                  <CardContent className="pb-3">
                    <div className="grid grid-cols-2 gap-2">
                      <QuantityCard label="Current Stock" value={selectedItem.currentQuantity || 0} color="text-foreground" />
                      <QuantityCard label="Available" value={selectedItem.availableQuantity || 0} color="text-green-600" />
                      <QuantityCard label="Reserved" value={selectedItem.reservedQuantity || 0} color="text-blue-600" />
                      <QuantityCard label="In Transit" value={selectedItem.inTransitQuantity || 0} color="text-purple-600" />
                      <QuantityCard label="Reorder Level" value={selectedItem.reorderLevel || 0} color="text-amber-600" />
                      <QuantityCard label="Minimum Stock" value={selectedItem.minimumStock || 0} color="text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Valuation</CardTitle></CardHeader>
                  <CardContent className="pb-3">
                    <div className="grid grid-cols-2 gap-2">
                      <DetailField label="Unit Cost" value={`PKR ${parseFloat(selectedItem.averageCost || "0").toLocaleString()}`} />
                      <DetailField label="Total Value" value={`PKR ${parseFloat(selectedItem.totalValue || "0").toLocaleString()}`} />
                      {selectedItem.lastReceivedDate && <DetailField label="Last Received" value={selectedItem.lastReceivedDate} />}
                      {selectedItem.lastIssuedDate && <DetailField label="Last Issued" value={selectedItem.lastIssuedDate} />}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { setEditItem(selectedItem); setShowEditDialog(true); }} data-testid="button-detail-edit"><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { setTransferSource(selectedItem); setShowTransferDialog(true); }} data-testid="button-detail-transfer"><ArrowRightLeft className="h-3 w-3 mr-1" /> Transfer</Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { setAdjustItem(selectedItem); setShowAdjustDialog(true); }} data-testid="button-detail-adjust"><ClipboardCheck className="h-3 w-3 mr-1" /> Adjust</Button>
                </div>
              </>
            )}

            {detailTab === "warehouse" && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Warehouse Breakdown — {selectedItem.productName}</CardTitle></CardHeader>
                <CardContent className="pb-3">
                  {selectedItemWarehouses.length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center">No warehouse data</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="p-2 text-left font-medium">Warehouse</th>
                            <th className="p-2 text-right font-medium">Qty</th>
                            <th className="p-2 text-right font-medium">Reserved</th>
                            <th className="p-2 text-right font-medium">Allocated</th>
                            <th className="p-2 text-right font-medium">Available</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedItemWarehouses.map(w => (
                            <tr key={w.id} className="border-b hover:bg-muted/50">
                              <td className="p-2 font-medium">{w.locationName}</td>
                              <td className="p-2 text-right font-mono">{w.currentQuantity}</td>
                              <td className="p-2 text-right font-mono text-blue-600">{w.reservedQuantity}</td>
                              <td className="p-2 text-right font-mono text-purple-600">{w.inTransitQuantity}</td>
                              <td className="p-2 text-right font-mono font-bold">{w.availableQuantity}</td>
                            </tr>
                          ))}
                          <tr className="font-bold bg-muted/30">
                            <td className="p-2">Total</td>
                            <td className="p-2 text-right font-mono">{selectedItemWarehouses.reduce((s, w) => s + (w.currentQuantity || 0), 0)}</td>
                            <td className="p-2 text-right font-mono text-blue-600">{selectedItemWarehouses.reduce((s, w) => s + (w.reservedQuantity || 0), 0)}</td>
                            <td className="p-2 text-right font-mono text-purple-600">{selectedItemWarehouses.reduce((s, w) => s + (w.inTransitQuantity || 0), 0)}</td>
                            <td className="p-2 text-right font-mono">{selectedItemWarehouses.reduce((s, w) => s + (w.availableQuantity || 0), 0)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {detailTab === "movements" && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Stock Movement History</CardTitle></CardHeader>
                <CardContent className="pb-3">
                  {selectedItemMovements.length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center">No movements recorded</p> : (
                    <div className="space-y-2">
                      {selectedItemMovements.map(mv => (
                        <div key={mv.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 border-b last:border-0" data-testid={`movement-entry-${mv.id}`}>
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${(mv.quantityIn || 0) > 0 ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30"}`}>
                            {(mv.quantityIn || 0) > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">{movementTypeLabels[mv.movementType] || mv.movementType}</span>
                              <span className={`text-xs font-mono font-bold ${(mv.quantityIn || 0) > 0 ? "text-green-600" : "text-red-600"}`}>
                                {(mv.quantityIn || 0) > 0 ? `+${mv.quantityIn}` : `-${mv.quantityOut}`}
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                              <span className="font-mono">{mv.movementId}</span>
                              {mv.referenceId && <span>Ref: {mv.referenceId}</span>}
                            </div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                              {mv.performedBy && <span>By: {mv.performedBy}</span>}
                              <span>{mv.createdAt ? new Date(mv.createdAt).toLocaleString() : "—"}</span>
                              <span>Bal: {mv.balanceAfter}</span>
                            </div>
                            {mv.notes && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{mv.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {showTransferDialog && transferSource && <TransferDialog source={transferSource} locations={stockLocations}
        onSave={(data: any) => transferMutation.mutate(data)}
        onClose={() => { setShowTransferDialog(false); setTransferSource(null); }}
        isPending={transferMutation.isPending} />}

      {showAdjustDialog && adjustItem && <AdjustmentDialog item={adjustItem}
        onSave={(data: any) => adjustMutation.mutate(data)}
        onClose={() => { setShowAdjustDialog(false); setAdjustItem(null); }}
        isPending={adjustMutation.isPending} />}

      {showEditDialog && editItem && <EditStockDialog item={editItem}
        onSave={(data: any) => updateItemMutation.mutate({ id: editItem.id, data })}
        onClose={() => { setShowEditDialog(false); setEditItem(null); }}
        isPending={updateItemMutation.isPending} />}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="text-xs font-medium mt-0.5">{value}</div>
    </div>
  );
}

function QuantityCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-2 rounded-lg bg-muted/30 border">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <div className={`text-sm font-bold font-mono mt-0.5 ${color}`}>{value.toLocaleString()}</div>
    </div>
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
              <SelectTrigger data-testid="select-transfer-dest"><SelectValue placeholder="Select destination" /></SelectTrigger>
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
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({
            sourceItemId: source.id, destinationLocationId: parseInt(destLocationId),
            destinationLocationName: destLocationName, quantity: parseInt(quantity) || 1,
            performedBy: "admin", notes,
          })} disabled={!destLocationId || !quantity || parseInt(quantity) < 1 || isPending}
            className="bg-gradient-to-r from-blue-600 to-teal-600 text-white" data-testid="button-exec-transfer">
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

  const afterQty = (item.currentQuantity || 0) + (parseInt(quantityAdjustment) || 0);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Adjust Quantity</DialogTitle></DialogHeader>
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
                <SelectItem value="physical_count">Physical Count</SelectItem>
                <SelectItem value="damage">Damage</SelectItem>
                <SelectItem value="lost">Lost Stock</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="data_correction">Data Correction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quantity Change (+ to add, - to remove) *</Label>
            <Input type="number" value={quantityAdjustment} onChange={e => setQuantityAdjustment(e.target.value)} data-testid="input-adj-qty" />
            <div className="text-xs mt-1 flex justify-between">
              <span>Current: {item.currentQuantity}</span>
              <span className={`font-medium ${afterQty < 0 ? "text-red-600" : ""}`}>After: {afterQty}</span>
            </div>
          </div>
          <div>
            <Label>Reason *</Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for adjustment (required)" rows={2} data-testid="input-adj-reason" />
          </div>
          {Math.abs(parseInt(quantityAdjustment) || 0) * parseFloat(item.averageCost || "0") > 50000 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700 dark:text-amber-400">High-value adjustment — requires approval.</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({
            stockItemId: item.id, adjustmentType, quantityAdjustment: parseInt(quantityAdjustment) || 0,
            reason, performedBy: "admin", productName: item.productName, locationName: item.locationName,
          })} disabled={!reason || afterQty < 0 || isPending}
            className="bg-gradient-to-r from-blue-600 to-teal-600 text-white" data-testid="button-save-adj">
            {isPending ? "Saving..." : "Record Adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditStockDialog({ item, onSave, onClose, isPending }: any) {
  const [currentQuantity, setCurrentQuantity] = useState(String(item.currentQuantity || 0));
  const [reservedQuantity, setReservedQuantity] = useState(String(item.reservedQuantity || 0));
  const [inTransitQuantity, setInTransitQuantity] = useState(String(item.inTransitQuantity || 0));
  const [reorderLevel, setReorderLevel] = useState(String(item.reorderLevel || 10));
  const [minimumStock, setMinimumStock] = useState(String(item.minimumStock || 5));
  const [averageCost, setAverageCost] = useState(item.averageCost || "0");

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit Stock — {item.productName}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Current Qty</Label><Input type="number" min="0" value={currentQuantity} onChange={e => setCurrentQuantity(e.target.value)} data-testid="input-edit-qty" /></div>
            <div><Label className="text-xs">Reserved</Label><Input type="number" min="0" value={reservedQuantity} onChange={e => setReservedQuantity(e.target.value)} data-testid="input-edit-reserved" /></div>
            <div><Label className="text-xs">In Transit</Label><Input type="number" min="0" value={inTransitQuantity} onChange={e => setInTransitQuantity(e.target.value)} data-testid="input-edit-transit" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Reorder Level</Label><Input type="number" min="0" value={reorderLevel} onChange={e => setReorderLevel(e.target.value)} data-testid="input-edit-reorder" /></div>
            <div><Label className="text-xs">Min Stock</Label><Input type="number" min="0" value={minimumStock} onChange={e => setMinimumStock(e.target.value)} data-testid="input-edit-min" /></div>
            <div><Label className="text-xs">Avg Cost</Label><Input type="number" step="0.01" value={averageCost} onChange={e => setAverageCost(e.target.value)} data-testid="input-edit-cost" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({
            currentQuantity: parseInt(currentQuantity) || 0,
            reservedQuantity: parseInt(reservedQuantity) || 0,
            inTransitQuantity: parseInt(inTransitQuantity) || 0,
            reorderLevel: parseInt(reorderLevel) || 10,
            minimumStock: parseInt(minimumStock) || 5,
            averageCost,
          })} disabled={isPending} className="bg-gradient-to-r from-blue-600 to-teal-600 text-white" data-testid="button-save-edit">
            {isPending ? "Saving..." : "Update Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}