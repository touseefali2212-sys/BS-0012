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
  Package, Plus, Search, Filter, Download, Pencil, Trash2,
  AlertTriangle, Boxes, Layers, Tag, Hash, Wifi, Shield,
  ChevronDown, ChevronUp, X, History, ArrowRightLeft,
  Clock, ShieldCheck, ShieldX, Upload, BarChart3, Eye,
  Calendar, Users, FileText, RefreshCw, CheckCircle
} from "lucide-react";
import type { Batch, SerialNumber, SerialMovement, StockLocation, Product, StockItem } from "@shared/schema";

const batchStatusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  low_stock: { label: "Low Stock", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  depleted: { label: "Depleted", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
  expired: { label: "Expired", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  damaged: { label: "Damaged", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  archived: { label: "Archived", color: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400" },
};

const serialStatusConfig: Record<string, { label: string; color: string; dot: string }> = {
  available: { label: "Available", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", dot: "bg-green-500" },
  reserved: { label: "Reserved", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", dot: "bg-yellow-500" },
  allocated: { label: "Allocated", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", dot: "bg-blue-500" },
  assigned: { label: "Assigned", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", dot: "bg-purple-500" },
  sold: { label: "Sold", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
  damaged: { label: "Damaged", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", dot: "bg-orange-500" },
  returned: { label: "Returned", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400", dot: "bg-gray-500" },
};

const movementRefLabels: Record<string, string> = {
  registration: "Registered",
  bulk_import: "Bulk Import",
  status_change: "Status Change",
  purchase_order: "Purchase Order",
  sales: "Sales",
  transfer: "Transfer",
  allocation: "Allocation",
  assignment: "Assignment",
  return: "Return",
};

export default function BatchSerialPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"batches" | "serials" | "movements">("batches");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [showSerialDialog, setShowSerialDialog] = useState(false);
  const [editingSerial, setEditingSerial] = useState<SerialNumber | null>(null);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showMovementDrawer, setShowMovementDrawer] = useState(false);
  const [selectedSerialForHistory, setSelectedSerialForHistory] = useState<SerialNumber | null>(null);

  const { data: allBatches = [], isLoading: batchLoading } = useQuery<Batch[]>({ queryKey: ["/api/batches"] });
  const { data: allSerials = [], isLoading: serialLoading } = useQuery<SerialNumber[]>({ queryKey: ["/api/serial-numbers"] });
  const { data: allMovements = [] } = useQuery<SerialMovement[]>({ queryKey: ["/api/serial-movements"] });
  const { data: stockLocations = [] } = useQuery<StockLocation[]>({ queryKey: ["/api/stock-locations"] });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: stockItems = [] } = useQuery<StockItem[]>({ queryKey: ["/api/stock-items"] });

  const createBatchMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/batches", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/batches"] }); toast({ title: "Batch created" }); setShowBatchDialog(false); setEditingBatch(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateBatchMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/batches/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/batches"] }); toast({ title: "Batch updated" }); setShowBatchDialog(false); setEditingBatch(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteBatchMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/batches/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/batches"] }); toast({ title: "Batch deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createSerialMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/serial-numbers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/serial-numbers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/serial-movements"] });
      toast({ title: "Serial number registered" }); setShowSerialDialog(false); setEditingSerial(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateSerialMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/serial-numbers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/serial-numbers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/serial-movements"] });
      toast({ title: "Serial updated" }); setShowSerialDialog(false); setEditingSerial(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteSerialMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/serial-numbers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/serial-numbers"] });
      toast({ title: "Serial deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (data: any) => {
      const resp = await apiRequest("POST", "/api/serial-numbers/bulk", data);
      return resp.json();
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/serial-numbers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/serial-movements"] });
      toast({ title: `Imported ${res.created ?? 0} serials${(res.errors ?? 0) > 0 ? `, ${res.errors} errors` : ""}` });
      setShowBulkDialog(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const totalBatches = allBatches.length;
  const totalSerials = allSerials.length;
  const availableSerials = allSerials.filter(s => s.status === "available").length;
  const allocatedSerials = allSerials.filter(s => s.status === "allocated" || s.status === "assigned").length;
  const soldSerials = allSerials.filter(s => s.status === "sold").length;
  const expiredBatches = allBatches.filter(b => b.status === "expired").length;
  const nearExpiryBatches = allBatches.filter(b => {
    if (!b.expiryDate) return false;
    const exp = new Date(b.expiryDate);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 30);
    return exp > new Date() && exp <= threshold;
  }).length;
  const damagedSerials = allSerials.filter(s => s.status === "damaged").length;

  const productNames = useMemo(() => [...new Set([...allBatches.map(b => b.productName), ...allSerials.map(s => s.productName)].filter(Boolean))] as string[], [allBatches, allSerials]);

  const filteredBatches = useMemo(() => {
    return allBatches.filter(b => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!b.batchNumber?.toLowerCase().includes(q) && !b.productName?.toLowerCase().includes(q) && !b.skuCode?.toLowerCase().includes(q)) return false;
      }
      if (filterProduct !== "all" && b.productName !== filterProduct) return false;
      if (filterWarehouse !== "all" && String(b.warehouseId) !== filterWarehouse) return false;
      if (filterStatus !== "all" && b.status !== filterStatus) return false;
      return true;
    });
  }, [allBatches, searchQuery, filterProduct, filterWarehouse, filterStatus]);

  const filteredSerials = useMemo(() => {
    return allSerials.filter(s => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!s.serialNumber?.toLowerCase().includes(q) && !s.macAddress?.toLowerCase().includes(q) && !s.productName?.toLowerCase().includes(q) && !s.imei?.toLowerCase().includes(q)) return false;
      }
      if (filterProduct !== "all" && s.productName !== filterProduct) return false;
      if (filterWarehouse !== "all" && String(s.warehouseId) !== filterWarehouse) return false;
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      return true;
    });
  }, [allSerials, searchQuery, filterProduct, filterWarehouse, filterStatus]);

  const selectedSerialMovements = useMemo(() => {
    if (!selectedSerialForHistory) return [];
    return allMovements.filter(m => m.serialId === selectedSerialForHistory.id).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [selectedSerialForHistory, allMovements]);

  const handleExportSerials = () => {
    const headers = ["Serial Number", "MAC Address", "IMEI", "Batch", "Product", "SKU", "Warehouse", "Status", "Customer", "Invoice", "Warranty Expiry"];
    const rows = filteredSerials.map(s => [
      s.serialNumber, s.macAddress || "", s.imei || "", s.batchNumber || "", s.productName,
      s.skuCode || "", s.warehouseName || "", serialStatusConfig[s.status]?.label || s.status,
      s.assignedCustomerName || "", s.invoiceReference || "", s.warrantyExpiry || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `serials_export_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => { setSearchQuery(""); setFilterProduct("all"); setFilterWarehouse("all"); setFilterStatus("all"); };
  const hasFilters = searchQuery || filterProduct !== "all" || filterWarehouse !== "all" || filterStatus !== "all";

  const tabs = [
    { id: "batches" as const, label: "Batch Management", icon: Layers, count: totalBatches },
    { id: "serials" as const, label: "Serial Numbers", icon: Hash, count: totalSerials },
    { id: "movements" as const, label: "Movement History", icon: History, count: allMovements.length },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Batch & Serial Management</h1>
          <p className="text-muted-foreground mt-1">Track serialized and batch-based products across warehouses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setEditingBatch(null); setShowBatchDialog(true); }} data-testid="button-add-batch">
            <Layers className="h-4 w-4 mr-2" /> Add Batch
          </Button>
          <Button variant="outline" onClick={() => setShowBulkDialog(true)} data-testid="button-bulk-import">
            <Upload className="h-4 w-4 mr-2" /> Bulk Import
          </Button>
          <Button onClick={() => { setEditingSerial(null); setShowSerialDialog(true); }} className="bg-gradient-to-r from-indigo-600 to-emerald-600 text-white" data-testid="button-add-serial">
            <Plus className="h-4 w-4 mr-2" /> Add Serial
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-3">
        {[
          { label: "Total Batches", value: totalBatches, icon: Layers, gradient: "from-indigo-600 to-indigo-800" },
          { label: "Total Serials", value: totalSerials, icon: Hash, gradient: "from-emerald-500 to-emerald-700" },
          { label: "Available", value: availableSerials, icon: CheckCircle, gradient: "from-green-500 to-green-700" },
          { label: "Allocated", value: allocatedSerials, icon: Users, gradient: "from-blue-500 to-blue-700" },
          { label: "Sold", value: soldSerials, icon: Tag, gradient: "from-red-500 to-red-700" },
          { label: "Expired Batches", value: expiredBatches, icon: Clock, gradient: "from-gray-500 to-gray-700" },
          { label: "Near Expiry", value: nearExpiryBatches, icon: AlertTriangle, gradient: "from-amber-500 to-amber-700" },
          { label: "Damaged", value: damagedSerials, icon: ShieldX, gradient: "from-orange-500 to-orange-700" },
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

      <div className="flex gap-1 border-b">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid={`tab-${tab.id}`}>
            <tab.icon className="h-4 w-4" /> {tab.label} <span className="text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={activeTab === "batches" ? "Search batch number, product, SKU..." : activeTab === "serials" ? "Search serial, MAC, IMEI, product..." : "Search movements..."} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} data-testid="button-toggle-filters">
          <Filter className="h-4 w-4 mr-1" /> {showFilters ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
        </Button>
        {activeTab === "serials" && <Button variant="outline" size="sm" onClick={handleExportSerials} data-testid="button-export-serials"><Download className="h-4 w-4 mr-1" /> Export</Button>}
        {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500" data-testid="button-clear-filters"><X className="h-3 w-3 mr-1" /> Clear</Button>}
      </div>

      {showFilters && (
        <Card><CardContent className="p-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Product</Label>
              <Select value={filterProduct} onValueChange={setFilterProduct}>
                <SelectTrigger className="h-8 text-xs" data-testid="filter-product"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {productNames.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Warehouse</Label>
              <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
                <SelectTrigger className="h-8 text-xs" data-testid="filter-warehouse"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {stockLocations.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs" data-testid="filter-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {activeTab === "batches"
                    ? Object.entries(batchStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)
                    : Object.entries(serialStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent></Card>
      )}

      {activeTab === "batches" && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-700 to-emerald-600 text-white">
                <th className="p-2.5 text-left font-medium rounded-tl-lg">Batch #</th>
                <th className="p-2.5 text-left font-medium">Product</th>
                <th className="p-2.5 text-left font-medium">SKU</th>
                <th className="p-2.5 text-left font-medium">Warehouse</th>
                <th className="p-2.5 text-right font-medium">Quantity</th>
                <th className="p-2.5 text-right font-medium">Available</th>
                <th className="p-2.5 text-right font-medium">Reserved</th>
                <th className="p-2.5 text-right font-medium">Allocated</th>
                <th className="p-2.5 text-right font-medium">Unit Cost</th>
                <th className="p-2.5 text-center font-medium">Mfg Date</th>
                <th className="p-2.5 text-center font-medium">Expiry</th>
                <th className="p-2.5 text-center font-medium">Status</th>
                <th className="p-2.5 text-center font-medium rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batchLoading ? (
                <tr><td colSpan={13} className="p-8 text-center text-muted-foreground">Loading batches...</td></tr>
              ) : filteredBatches.length === 0 ? (
                <tr><td colSpan={13} className="p-8 text-center text-muted-foreground">{hasFilters ? "No batches match filters" : "No batches created yet"}</td></tr>
              ) : filteredBatches.map(batch => {
                const sc = batchStatusConfig[batch.status] || batchStatusConfig.active;
                const isNearExpiry = batch.expiryDate && (() => { const e = new Date(batch.expiryDate); const t = new Date(); t.setDate(t.getDate() + 30); return e > new Date() && e <= t; })();
                const linkedSerials = allSerials.filter(s => s.batchId === batch.id);
                return (
                  <tr key={batch.id} className={`border-b hover:bg-muted/50 transition-colors ${isNearExpiry ? "bg-orange-50/30 dark:bg-orange-950/10" : ""}`} data-testid={`row-batch-${batch.id}`}>
                    <td className="p-2.5 font-mono text-xs font-medium">{batch.batchNumber}</td>
                    <td className="p-2.5">{batch.productName}</td>
                    <td className="p-2.5 font-mono text-xs">{batch.skuCode || "—"}</td>
                    <td className="p-2.5 text-xs">{batch.warehouseName || "—"}</td>
                    <td className="p-2.5 text-right font-mono">{batch.quantity}</td>
                    <td className="p-2.5 text-right font-mono text-green-600">{batch.available}</td>
                    <td className="p-2.5 text-right font-mono text-yellow-600">{batch.reserved}</td>
                    <td className="p-2.5 text-right font-mono text-blue-600">{batch.allocated}</td>
                    <td className="p-2.5 text-right font-mono text-xs">{parseFloat(batch.unitCost || "0").toLocaleString()}</td>
                    <td className="p-2.5 text-center text-xs">{batch.manufacturingDate || "—"}</td>
                    <td className={`p-2.5 text-center text-xs ${isNearExpiry ? "text-orange-600 font-medium" : ""}`}>{batch.expiryDate || "—"} {isNearExpiry && <AlertTriangle className="h-3 w-3 inline ml-1 text-orange-500" />}</td>
                    <td className="p-2.5 text-center"><Badge className={`${sc.color} text-[10px]`}>{sc.label}</Badge></td>
                    <td className="p-2.5">
                      <div className="flex items-center justify-center gap-0.5">
                        {linkedSerials.length > 0 && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-indigo-600" title={`${linkedSerials.length} serials`} onClick={() => { setActiveTab("serials"); setFilterProduct(batch.productName); }} data-testid={`button-view-serials-${batch.id}`}>
                            <Hash className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingBatch(batch); setShowBatchDialog(true); }} title="Edit" data-testid={`button-edit-batch-${batch.id}`}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => { if (confirm("Delete this batch?")) deleteBatchMutation.mutate(batch.id); }} title="Delete" data-testid={`button-delete-batch-${batch.id}`}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "serials" && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-700 to-emerald-600 text-white">
                <th className="p-2.5 text-left font-medium rounded-tl-lg">Serial Number</th>
                <th className="p-2.5 text-left font-medium">MAC Address</th>
                <th className="p-2.5 text-left font-medium">IMEI</th>
                <th className="p-2.5 text-left font-medium">Batch</th>
                <th className="p-2.5 text-left font-medium">Product</th>
                <th className="p-2.5 text-left font-medium">Warehouse</th>
                <th className="p-2.5 text-center font-medium">Status</th>
                <th className="p-2.5 text-left font-medium">Customer</th>
                <th className="p-2.5 text-left font-medium">Invoice</th>
                <th className="p-2.5 text-center font-medium">Warranty</th>
                <th className="p-2.5 text-center font-medium">Last Moved</th>
                <th className="p-2.5 text-center font-medium rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {serialLoading ? (
                <tr><td colSpan={12} className="p-8 text-center text-muted-foreground">Loading serials...</td></tr>
              ) : filteredSerials.length === 0 ? (
                <tr><td colSpan={12} className="p-8 text-center text-muted-foreground">{hasFilters ? "No serials match filters" : "No serial numbers registered yet"}</td></tr>
              ) : filteredSerials.map(serial => {
                const sc = serialStatusConfig[serial.status] || serialStatusConfig.available;
                const warrantyExpired = serial.warrantyExpiry && new Date(serial.warrantyExpiry) < new Date();
                return (
                  <tr key={serial.id} className={`border-b hover:bg-muted/50 transition-colors ${serial.status === "sold" ? "opacity-70" : ""}`} data-testid={`row-serial-${serial.id}`}>
                    <td className="p-2.5 font-mono text-xs font-medium">{serial.serialNumber}</td>
                    <td className="p-2.5 font-mono text-xs">{serial.macAddress || "—"}</td>
                    <td className="p-2.5 font-mono text-xs">{serial.imei || "—"}</td>
                    <td className="p-2.5 font-mono text-xs">{serial.batchNumber || "—"}</td>
                    <td className="p-2.5 text-xs">{serial.productName}</td>
                    <td className="p-2.5 text-xs">{serial.warehouseName || "—"}</td>
                    <td className="p-2.5 text-center"><Badge className={`${sc.color} text-[10px]`}>{sc.label}</Badge></td>
                    <td className="p-2.5 text-xs">{serial.assignedCustomerName || "—"}</td>
                    <td className="p-2.5 font-mono text-xs">{serial.invoiceReference || "—"}</td>
                    <td className={`p-2.5 text-center text-xs ${warrantyExpired ? "text-red-600" : ""}`}>
                      {serial.warrantyExpiry || "—"} {warrantyExpired && <span className="text-[9px] text-red-500 block">Expired</span>}
                    </td>
                    <td className="p-2.5 text-center text-xs">{serial.lastMovementDate || "—"}</td>
                    <td className="p-2.5">
                      <div className="flex items-center justify-center gap-0.5">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-indigo-600" onClick={() => { setSelectedSerialForHistory(serial); setShowMovementDrawer(true); }} title="History" data-testid={`button-history-${serial.id}`}><History className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingSerial(serial); setShowSerialDialog(true); }} title="Edit" data-testid={`button-edit-serial-${serial.id}`}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => { if (confirm("Delete this serial?")) deleteSerialMutation.mutate(serial.id); }} title="Delete" data-testid={`button-delete-serial-${serial.id}`}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredSerials.length > 0 && (
            <div className="p-2 border-t text-xs text-muted-foreground flex justify-between">
              <span>Showing {filteredSerials.length} of {allSerials.length} serials</span>
              <span>Available: {filteredSerials.filter(s => s.status === "available").length} • Allocated: {filteredSerials.filter(s => s.status === "allocated" || s.status === "assigned").length} • Sold: {filteredSerials.filter(s => s.status === "sold").length}</span>
            </div>
          )}
        </div>
      )}

      {activeTab === "movements" && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-700 to-emerald-600 text-white">
                <th className="p-2.5 text-left font-medium rounded-tl-lg">Date & Time</th>
                <th className="p-2.5 text-left font-medium">Serial Number</th>
                <th className="p-2.5 text-left font-medium">Type</th>
                <th className="p-2.5 text-left font-medium">Reference</th>
                <th className="p-2.5 text-left font-medium">From</th>
                <th className="p-2.5 text-left font-medium">To</th>
                <th className="p-2.5 text-left font-medium">Customer</th>
                <th className="p-2.5 text-left font-medium">Prev Status</th>
                <th className="p-2.5 text-left font-medium">New Status</th>
                <th className="p-2.5 text-left font-medium">By</th>
                <th className="p-2.5 text-left font-medium rounded-tr-lg">Notes</th>
              </tr>
            </thead>
            <tbody>
              {allMovements.length === 0 ? (
                <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">No serial movements recorded yet</td></tr>
              ) : allMovements.filter(m => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return m.serialNumber?.toLowerCase().includes(q) || m.referenceId?.toLowerCase().includes(q) || m.customerName?.toLowerCase().includes(q);
              }).map(mv => (
                <tr key={mv.id} className="border-b hover:bg-muted/50" data-testid={`row-movement-${mv.id}`}>
                  <td className="p-2.5 text-xs">{mv.createdAt ? new Date(mv.createdAt).toLocaleString() : "—"}</td>
                  <td className="p-2.5 font-mono text-xs font-medium">{mv.serialNumber}</td>
                  <td className="p-2.5 text-xs capitalize">{movementRefLabels[mv.referenceType] || mv.referenceType}</td>
                  <td className="p-2.5 font-mono text-xs">{mv.referenceId || "—"}</td>
                  <td className="p-2.5 text-xs">{mv.sourceWarehouse || "—"}</td>
                  <td className="p-2.5 text-xs">{mv.destinationWarehouse || "—"}</td>
                  <td className="p-2.5 text-xs">{mv.customerName || "—"}</td>
                  <td className="p-2.5 text-center">{mv.previousStatus ? <Badge className={`${serialStatusConfig[mv.previousStatus]?.color || "bg-gray-100 text-gray-800"} text-[9px]`}>{serialStatusConfig[mv.previousStatus]?.label || mv.previousStatus}</Badge> : "—"}</td>
                  <td className="p-2.5 text-center">{mv.newStatus ? <Badge className={`${serialStatusConfig[mv.newStatus]?.color || "bg-gray-100 text-gray-800"} text-[9px]`}>{serialStatusConfig[mv.newStatus]?.label || mv.newStatus}</Badge> : "—"}</td>
                  <td className="p-2.5 text-xs">{mv.performedBy || "—"}</td>
                  <td className="p-2.5 text-xs text-muted-foreground max-w-[150px] truncate">{mv.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showBatchDialog && <BatchDialog batch={editingBatch} products={products} locations={stockLocations} stockItems={stockItems}
        onSave={(data: any) => editingBatch ? updateBatchMutation.mutate({ id: editingBatch.id, data }) : createBatchMutation.mutate(data)}
        onClose={() => { setShowBatchDialog(false); setEditingBatch(null); }}
        isPending={createBatchMutation.isPending || updateBatchMutation.isPending} />}

      {showSerialDialog && <SerialDialog serial={editingSerial} products={products} locations={stockLocations} batches={allBatches}
        onSave={(data: any) => editingSerial ? updateSerialMutation.mutate({ id: editingSerial.id, data }) : createSerialMutation.mutate(data)}
        onClose={() => { setShowSerialDialog(false); setEditingSerial(null); }}
        isPending={createSerialMutation.isPending || updateSerialMutation.isPending} />}

      {showBulkDialog && <BulkImportDialog products={products} locations={stockLocations} batches={allBatches}
        onSave={(data: any) => bulkImportMutation.mutate(data)}
        onClose={() => setShowBulkDialog(false)}
        isPending={bulkImportMutation.isPending} />}

      {showMovementDrawer && selectedSerialForHistory && (
        <Dialog open={true} onOpenChange={() => { setShowMovementDrawer(false); setSelectedSerialForHistory(null); }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Movement History — {selectedSerialForHistory.serialNumber}</DialogTitle></DialogHeader>
            <div className="p-3 bg-muted/50 rounded-lg mb-4">
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div><span className="text-muted-foreground">Product</span><div className="font-medium">{selectedSerialForHistory.productName}</div></div>
                <div><span className="text-muted-foreground">MAC</span><div className="font-mono">{selectedSerialForHistory.macAddress || "—"}</div></div>
                <div><span className="text-muted-foreground">Status</span><div><Badge className={serialStatusConfig[selectedSerialForHistory.status]?.color || ""}>{serialStatusConfig[selectedSerialForHistory.status]?.label || selectedSerialForHistory.status}</Badge></div></div>
                <div><span className="text-muted-foreground">Customer</span><div>{selectedSerialForHistory.assignedCustomerName || "—"}</div></div>
              </div>
            </div>
            {selectedSerialMovements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No movement history</p>
            ) : (
              <div className="space-y-2">
                {selectedSerialMovements.map((mv, idx) => (
                  <div key={mv.id} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-xs ${idx === 0 ? "bg-indigo-600" : "bg-gray-400"}`}>{selectedSerialMovements.length - idx}</div>
                      {idx < selectedSerialMovements.length - 1 && <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700" />}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{movementRefLabels[mv.referenceType] || mv.referenceType}</span>
                        <span className="text-[10px] text-muted-foreground">{mv.createdAt ? new Date(mv.createdAt).toLocaleString() : ""}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                        {mv.previousStatus && mv.newStatus && <div>{mv.previousStatus} → {mv.newStatus}</div>}
                        {mv.sourceWarehouse && <div>From: {mv.sourceWarehouse}</div>}
                        {mv.destinationWarehouse && <div>To: {mv.destinationWarehouse}</div>}
                        {mv.customerName && <div>Customer: {mv.customerName}</div>}
                        {mv.performedBy && <div>By: {mv.performedBy}</div>}
                        {mv.notes && <div className="text-muted-foreground">{mv.notes}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => { setShowMovementDrawer(false); setSelectedSerialForHistory(null); }} data-testid="button-close-history">Close</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function BatchDialog({ batch, products, locations, stockItems, onSave, onClose, isPending }: any) {
  const [productName, setProductName] = useState(batch?.productName || "");
  const [skuCode, setSkuCode] = useState(batch?.skuCode || "");
  const [warehouseId, setWarehouseId] = useState(batch?.warehouseId?.toString() || "");
  const [warehouseName, setWarehouseName] = useState(batch?.warehouseName || "");
  const [quantity, setQuantity] = useState(String(batch?.quantity || 0));
  const [reserved, setReserved] = useState(String(batch?.reserved || 0));
  const [allocated, setAllocated] = useState(String(batch?.allocated || 0));
  const [unitCost, setUnitCost] = useState(batch?.unitCost || "0");
  const [manufacturingDate, setManufacturingDate] = useState(batch?.manufacturingDate || "");
  const [expiryDate, setExpiryDate] = useState(batch?.expiryDate || "");
  const [status, setStatus] = useState(batch?.status || "active");

  const handleProductSelect = (pid: string) => {
    const prod = products.find((p: Product) => p.id === parseInt(pid));
    if (prod) { setProductName(prod.name); setSkuCode(prod.skuCode || ""); setUnitCost(prod.purchaseCost || "0"); }
  };
  const handleWarehouseSelect = (lid: string) => {
    setWarehouseId(lid);
    const loc = locations.find((l: StockLocation) => l.id === parseInt(lid));
    if (loc) setWarehouseName(loc.name);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{batch ? "Edit Batch" : "Create Batch"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Product (from catalog)</Label>
              <Select onValueChange={handleProductSelect}>
                <SelectTrigger data-testid="select-batch-product"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.map((p: Product) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Product Name *</Label><Input value={productName} onChange={e => setProductName(e.target.value)} data-testid="input-batch-product" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>SKU</Label><Input value={skuCode} onChange={e => setSkuCode(e.target.value)} className="font-mono" data-testid="input-batch-sku" /></div>
            <div>
              <Label>Warehouse</Label>
              <Select value={warehouseId} onValueChange={handleWarehouseSelect}>
                <SelectTrigger data-testid="select-batch-warehouse"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{locations.map((l: StockLocation) => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Unit Cost</Label><Input type="number" step="0.01" value={unitCost} onChange={e => setUnitCost(e.target.value)} data-testid="input-batch-cost" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Quantity</Label><Input type="number" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} data-testid="input-batch-qty" /></div>
            <div><Label>Reserved</Label><Input type="number" min="0" value={reserved} onChange={e => setReserved(e.target.value)} data-testid="input-batch-reserved" /></div>
            <div><Label>Allocated</Label><Input type="number" min="0" value={allocated} onChange={e => setAllocated(e.target.value)} data-testid="input-batch-allocated" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Manufacturing Date</Label><Input type="date" value={manufacturingDate} onChange={e => setManufacturingDate(e.target.value)} data-testid="input-batch-mfg" /></div>
            <div><Label>Expiry Date</Label><Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} data-testid="input-batch-expiry" /></div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-batch-status"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(batchStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({
            productName, skuCode, warehouseId: warehouseId ? parseInt(warehouseId) : null, warehouseName,
            quantity: parseInt(quantity) || 0, reserved: parseInt(reserved) || 0, allocated: parseInt(allocated) || 0,
            unitCost, manufacturingDate: manufacturingDate || null, expiryDate: expiryDate || null, status,
          })} disabled={!productName || isPending} className="bg-gradient-to-r from-indigo-600 to-emerald-600 text-white" data-testid="button-save-batch">
            {isPending ? "Saving..." : batch ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SerialDialog({ serial, products, locations, batches, onSave, onClose, isPending }: any) {
  const [serialNumber, setSerialNumber] = useState(serial?.serialNumber || "");
  const [macAddress, setMacAddress] = useState(serial?.macAddress || "");
  const [imei, setImei] = useState(serial?.imei || "");
  const [batchId, setBatchId] = useState(serial?.batchId?.toString() || "");
  const [batchNumber, setBatchNumber] = useState(serial?.batchNumber || "");
  const [productName, setProductName] = useState(serial?.productName || "");
  const [skuCode, setSkuCode] = useState(serial?.skuCode || "");
  const [warehouseId, setWarehouseId] = useState(serial?.warehouseId?.toString() || "");
  const [warehouseName, setWarehouseName] = useState(serial?.warehouseName || "");
  const [status, setStatus] = useState(serial?.status || "available");
  const [assignedCustomerName, setAssignedCustomerName] = useState(serial?.assignedCustomerName || "");
  const [invoiceReference, setInvoiceReference] = useState(serial?.invoiceReference || "");
  const [warrantyExpiry, setWarrantyExpiry] = useState(serial?.warrantyExpiry || "");
  const [notes, setNotes] = useState(serial?.notes || "");

  const handleProductSelect = (pid: string) => {
    const prod = products.find((p: Product) => p.id === parseInt(pid));
    if (prod) {
      setProductName(prod.name); setSkuCode(prod.skuCode || "");
      if (prod.warrantyPeriod) {
        const start = new Date();
        start.setMonth(start.getMonth() + prod.warrantyPeriod);
        setWarrantyExpiry(start.toISOString().split("T")[0]);
      }
    }
  };
  const handleBatchSelect = (bid: string) => {
    setBatchId(bid);
    const b = batches.find((bt: Batch) => bt.id === parseInt(bid));
    if (b) { setBatchNumber(b.batchNumber); setProductName(b.productName); setSkuCode(b.skuCode || ""); setWarehouseId(b.warehouseId?.toString() || ""); setWarehouseName(b.warehouseName || ""); }
  };
  const handleWarehouseSelect = (lid: string) => {
    setWarehouseId(lid);
    const loc = locations.find((l: StockLocation) => l.id === parseInt(lid));
    if (loc) setWarehouseName(loc.name);
  };

  const isSold = serial?.status === "sold";
  const allowedSoldTransitions = ["sold", "returned", "damaged"];
  const statusOptions = isSold
    ? Object.entries(serialStatusConfig).filter(([k]) => allowedSoldTransitions.includes(k))
    : Object.entries(serialStatusConfig);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{serial ? "Edit Serial Number" : "Register Serial Number"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Serial Number *</Label><Input value={serialNumber} onChange={e => setSerialNumber(e.target.value)} className="font-mono" disabled={!!serial} data-testid="input-serial-number" /></div>
            <div><Label>MAC Address</Label><Input value={macAddress} onChange={e => setMacAddress(e.target.value)} className="font-mono" placeholder="AA:BB:CC:DD:EE:FF" data-testid="input-mac" /></div>
            <div><Label>IMEI</Label><Input value={imei} onChange={e => setImei(e.target.value)} className="font-mono" data-testid="input-imei" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Product (from catalog)</Label>
              <Select onValueChange={handleProductSelect}>
                <SelectTrigger data-testid="select-serial-product"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{products.map((p: Product) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Product Name *</Label><Input value={productName} onChange={e => setProductName(e.target.value)} data-testid="input-serial-product" /></div>
            <div>
              <Label>Batch</Label>
              <Select value={batchId} onValueChange={handleBatchSelect}>
                <SelectTrigger data-testid="select-serial-batch"><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>{batches.map((b: Batch) => <SelectItem key={b.id} value={b.id.toString()}>{b.batchNumber} — {b.productName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>SKU</Label><Input value={skuCode} onChange={e => setSkuCode(e.target.value)} className="font-mono" data-testid="input-serial-sku" /></div>
            <div>
              <Label>Warehouse</Label>
              <Select value={warehouseId} onValueChange={handleWarehouseSelect}>
                <SelectTrigger data-testid="select-serial-warehouse"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{locations.map((l: StockLocation) => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="select-serial-status"><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Assigned Customer</Label><Input value={assignedCustomerName} onChange={e => setAssignedCustomerName(e.target.value)} data-testid="input-serial-customer" /></div>
            <div><Label>Invoice Reference</Label><Input value={invoiceReference} onChange={e => setInvoiceReference(e.target.value)} className="font-mono" data-testid="input-serial-invoice" /></div>
            <div><Label>Warranty Expiry</Label><Input type="date" value={warrantyExpiry} onChange={e => setWarrantyExpiry(e.target.value)} data-testid="input-serial-warranty" /></div>
          </div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} data-testid="input-serial-notes" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({
            serialNumber, macAddress: macAddress || null, imei: imei || null,
            batchId: batchId ? parseInt(batchId) : null, batchNumber: batchNumber || null,
            productName, skuCode: skuCode || null,
            warehouseId: warehouseId ? parseInt(warehouseId) : null, warehouseName: warehouseName || null,
            status, assignedCustomerName: assignedCustomerName || null, invoiceReference: invoiceReference || null,
            warrantyStartDate: serial?.warrantyStartDate || new Date().toISOString().split("T")[0],
            warrantyExpiry: warrantyExpiry || null, notes: notes || null,
          })} disabled={!serialNumber || !productName || isPending} className="bg-gradient-to-r from-indigo-600 to-emerald-600 text-white" data-testid="button-save-serial">
            {isPending ? "Saving..." : serial ? "Update" : "Register"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkImportDialog({ products, locations, batches, onSave, onClose, isPending }: any) {
  const [csvText, setCsvText] = useState("");
  const [productName, setProductName] = useState("");
  const [skuCode, setSkuCode] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [warehouseName, setWarehouseName] = useState("");
  const [batchId, setBatchId] = useState("");
  const [batchNumber, setBatchNumber] = useState("");

  const handleProductSelect = (pid: string) => {
    const prod = products.find((p: Product) => p.id === parseInt(pid));
    if (prod) { setProductName(prod.name); setSkuCode(prod.skuCode || ""); }
  };
  const handleWarehouseSelect = (lid: string) => {
    setWarehouseId(lid);
    const loc = locations.find((l: StockLocation) => l.id === parseInt(lid));
    if (loc) setWarehouseName(loc.name);
  };
  const handleBatchSelect = (bid: string) => {
    setBatchId(bid);
    const b = batches.find((bt: Batch) => bt.id === parseInt(bid));
    if (b) setBatchNumber(b.batchNumber);
  };

  const handleImport = () => {
    const lines = csvText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    const serials = lines.map(line => {
      const parts = line.split(",").map(p => p.trim().replace(/^"|"$/g, ""));
      return {
        serialNumber: parts[0] || "",
        macAddress: parts[1] || null,
        imei: parts[2] || null,
        productName, skuCode: skuCode || null,
        warehouseId: warehouseId ? parseInt(warehouseId) : null,
        warehouseName: warehouseName || null,
        batchId: batchId ? parseInt(batchId) : null,
        batchNumber: batchNumber || null,
        status: "available",
        warrantyStartDate: new Date().toISOString().split("T")[0],
      };
    }).filter(s => s.serialNumber);
    onSave({ serials });
  };

  const lineCount = csvText.split("\n").filter(l => l.trim().length > 0).length;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Bulk Serial Import</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Product *</Label>
              <Select onValueChange={handleProductSelect}>
                <SelectTrigger data-testid="select-bulk-product"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.map((p: Product) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Warehouse</Label>
              <Select value={warehouseId} onValueChange={handleWarehouseSelect}>
                <SelectTrigger data-testid="select-bulk-warehouse"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{locations.map((l: StockLocation) => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Batch (optional)</Label>
            <Select value={batchId} onValueChange={handleBatchSelect}>
              <SelectTrigger data-testid="select-bulk-batch"><SelectValue placeholder="Select batch" /></SelectTrigger>
              <SelectContent>{batches.map((b: Batch) => <SelectItem key={b.id} value={b.id.toString()}>{b.batchNumber} — {b.productName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Serial Numbers (one per line: serial, mac, imei)</Label>
            <Textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={8}
              placeholder={"SN-001, AA:BB:CC:DD:EE:01\nSN-002, AA:BB:CC:DD:EE:02\nSN-003"} className="font-mono text-xs" data-testid="input-bulk-csv" />
            <span className="text-xs text-muted-foreground">{lineCount} serial(s) detected</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={!productName || lineCount === 0 || isPending} className="bg-gradient-to-r from-indigo-600 to-emerald-600 text-white" data-testid="button-exec-import">
            {isPending ? "Importing..." : `Import ${lineCount} Serial(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}