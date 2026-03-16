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
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText, Plus, Search, Filter, Download, Eye, Pencil, Trash2,
  CheckCircle2, XCircle, Package, AlertTriangle, DollarSign, Clock,
  TrendingUp, ShoppingCart, BarChart3, Truck, ChevronDown, ChevronUp, X
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import type { PurchaseOrder, PurchaseOrderItem, Supplier, Product } from "@shared/schema";

type POWithItems = PurchaseOrder & { items?: PurchaseOrderItem[] };

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Draft", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: FileText },
  pending_approval: { label: "Pending Approval", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  approved: { label: "Approved", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: CheckCircle2 },
  partially_received: { label: "Partially Received", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: Package },
  fully_received: { label: "Fully Received", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400", icon: XCircle },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  unpaid: { label: "Unpaid", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  partial: { label: "Partial", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  paid: { label: "Paid", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
};

const CHART_COLORS = ["#059669", "#0891b2", "#7c3aed", "#dc2626", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6"];

export default function PurchaseOrdersPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [editingPO, setEditingPO] = useState<POWithItems | null>(null);
  const [viewingPO, setViewingPO] = useState<POWithItems | null>(null);
  const [receivingPO, setReceivingPO] = useState<POWithItems | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: purchaseOrders = [], isLoading } = useQuery<PurchaseOrder[]>({ queryKey: ["/api/purchase-orders"] });
  const { data: suppliers = [] } = useQuery<Supplier[]>({ queryKey: ["/api/suppliers"] });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/purchase-orders", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] }); toast({ title: "Purchase Order created" }); setActiveTab("list"); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/purchase-orders/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] }); toast({ title: "Purchase Order updated" }); setEditingPO(null); setViewingPO(null); setReceivingPO(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/purchase-orders/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] }); toast({ title: "Purchase Order deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthlyPOs = purchaseOrders.filter(po => po.poDate?.startsWith(thisMonth));
  const totalPOsThisMonth = monthlyPOs.length;
  const pendingApprovals = purchaseOrders.filter(po => po.status === "pending_approval").length;
  const approvedPOs = purchaseOrders.filter(po => po.status === "approved").length;
  const partiallyReceived = purchaseOrders.filter(po => po.status === "partially_received").length;
  const fullyReceived = purchaseOrders.filter(po => po.status === "fully_received").length;
  const totalPurchaseValue = purchaseOrders.reduce((s, po) => s + parseFloat(po.grandTotal || "0"), 0);
  const outstandingValue = purchaseOrders.filter(po => !["fully_received", "cancelled", "rejected"].includes(po.status)).reduce((s, po) => s + parseFloat(po.grandTotal || "0") - parseFloat(po.receivedAmount || "0"), 0);
  const totalDraftPOs = purchaseOrders.filter(po => po.status === "draft").length;

  const supplierMap = useMemo(() => Object.fromEntries(suppliers.map(s => [s.id, s])), [suppliers]);

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const sName = supplierMap[po.supplierId]?.companyName || "";
        if (!po.poNumber?.toLowerCase().includes(q) && !sName.toLowerCase().includes(q)) return false;
      }
      if (filterStatus !== "all" && po.status !== filterStatus) return false;
      if (filterSupplier !== "all" && String(po.supplierId) !== filterSupplier) return false;
      if (filterPayment !== "all" && po.paymentStatus !== filterPayment) return false;
      if (filterWarehouse !== "all" && po.warehouseDestination !== filterWarehouse) return false;
      return true;
    });
  }, [purchaseOrders, searchQuery, filterStatus, filterSupplier, filterPayment, filterWarehouse, supplierMap]);

  const purchasesBySupplier = useMemo(() => {
    const map: Record<string, number> = {};
    purchaseOrders.forEach(po => {
      const name = supplierMap[po.supplierId]?.companyName || "Unknown";
      map[name] = (map[name] || 0) + parseFloat(po.grandTotal || "0");
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + "..." : name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [purchaseOrders, supplierMap]);

  const monthlyTrend = useMemo(() => {
    const map: Record<string, number> = {};
    purchaseOrders.forEach(po => {
      const month = po.poDate?.slice(0, 7) || "";
      if (month) map[month] = (map[month] || 0) + parseFloat(po.grandTotal || "0");
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, value]) => ({ month, value }));
  }, [purchaseOrders]);

  const statusDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    purchaseOrders.forEach(po => {
      const label = statusConfig[po.status]?.label || po.status;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [purchaseOrders]);

  const warehouses = useMemo(() => [...new Set(purchaseOrders.map(po => po.warehouseDestination).filter(Boolean))], [purchaseOrders]);

  const handleExportCSV = () => {
    const headers = ["PO Number", "Supplier", "Warehouse", "PO Date", "Delivery Date", "Grand Total", "Status", "Payment Status"];
    const rows = filteredPOs.map(po => [
      po.poNumber, supplierMap[po.supplierId]?.companyName || "", po.warehouseDestination || "",
      po.poDate, po.expectedDeliveryDate || "", po.grandTotal || "0", po.status, po.paymentStatus || "unpaid",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "purchase_orders.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "overview", label: "PO Overview", icon: BarChart3 },
    { id: "create", label: "Create PO", icon: Plus },
    { id: "list", label: "PO Master List", icon: FileText },
    { id: "receiving", label: "Receiving & GRN", icon: Truck },
    { id: "financial", label: "Financial Tracking", icon: DollarSign },
  ];

  const fmt = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : n >= 1000 ? (n / 1000).toFixed(1) + "K" : n.toFixed(0);
  const fmtCurrency = (n: number) => "PKR " + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Manage procurement workflow, approvals, and receiving</p>
        </div>
        <Button onClick={() => { setActiveTab("create"); setEditingPO(null); }} className="bg-gradient-to-r from-slate-700 to-emerald-600 text-white" data-testid="button-create-po">
          <Plus className="h-4 w-4 mr-2" /> New Purchase Order
        </Button>
      </div>

      <div className="grid grid-cols-8 gap-3">
        {[
          { label: "Total POs (Month)", value: totalPOsThisMonth, icon: FileText, gradient: "from-slate-600 to-slate-800" },
          { label: "Pending Approvals", value: pendingApprovals, icon: Clock, gradient: "from-yellow-500 to-yellow-700" },
          { label: "Approved POs", value: approvedPOs, icon: CheckCircle2, gradient: "from-purple-500 to-purple-700" },
          { label: "Partially Received", value: partiallyReceived, icon: Package, gradient: "from-emerald-500 to-emerald-700" },
          { label: "Fully Received", value: fullyReceived, icon: CheckCircle2, gradient: "from-green-500 to-green-700" },
          { label: "Purchase Value", value: fmtCurrency(totalPurchaseValue), icon: DollarSign, gradient: "from-blue-500 to-blue-700", isText: true },
          { label: "Outstanding Value", value: fmtCurrency(outstandingValue), icon: AlertTriangle, gradient: "from-red-500 to-red-700", isText: true },
          { label: "Draft POs", value: totalDraftPOs, icon: FileText, gradient: "from-cyan-500 to-cyan-700" },
        ].map((kpi, idx) => (
          <Card key={idx} className={`bg-gradient-to-br ${kpi.gradient} text-white border-0 shadow-lg`} data-testid={`card-kpi-${idx}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="h-5 w-5 opacity-80" />
              </div>
              <div className="text-xl font-bold" data-testid={`text-kpi-value-${idx}`}>{kpi.isText ? kpi.value : kpi.value}</div>
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

      {activeTab === "overview" && <OverviewTab purchasesBySupplier={purchasesBySupplier} monthlyTrend={monthlyTrend} statusDistribution={statusDistribution} purchaseOrders={purchaseOrders} supplierMap={supplierMap} />}
      {activeTab === "create" && <CreateEditTab suppliers={suppliers} products={products} editingPO={editingPO} onSave={(data: any) => editingPO ? updateMutation.mutate({ id: editingPO.id, data }) : createMutation.mutate(data)} isPending={createMutation.isPending || updateMutation.isPending} onCancel={() => { setEditingPO(null); setActiveTab("list"); }} />}
      {activeTab === "list" && (
        <POListTab purchaseOrders={filteredPOs} supplierMap={supplierMap} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          filterStatus={filterStatus} setFilterStatus={setFilterStatus} filterSupplier={filterSupplier} setFilterSupplier={setFilterSupplier}
          filterPayment={filterPayment} setFilterPayment={setFilterPayment} filterWarehouse={filterWarehouse} setFilterWarehouse={setFilterWarehouse}
          showFilters={showFilters} setShowFilters={setShowFilters} warehouses={warehouses} suppliers={suppliers}
          onView={async (po) => {
            try {
              const res = await fetch(`/api/purchase-orders/${po.id}`, { credentials: "include" });
              const full = await res.json();
              setViewingPO(full);
            } catch { setViewingPO(po as POWithItems); }
          }}
          onEdit={(po) => { setEditingPO(po as POWithItems); setActiveTab("create"); }}
          onApprove={(po) => updateMutation.mutate({ id: po.id, data: { status: "approved", approvedBy: "admin", approvedDate: new Date().toISOString().split("T")[0] } })}
          onReject={(po) => updateMutation.mutate({ id: po.id, data: { status: "rejected", rejectedBy: "admin", rejectionReason: "Not approved" } })}
          onCancel={(po) => updateMutation.mutate({ id: po.id, data: { status: "cancelled" } })}
          onSubmit={(po) => updateMutation.mutate({ id: po.id, data: { status: "pending_approval" } })}
          onDelete={(po) => { if (confirm("Delete this PO?")) deleteMutation.mutate(po.id); }}
          onExportCSV={handleExportCSV}
          onReceive={async (po) => {
            try {
              const res = await fetch(`/api/purchase-orders/${po.id}`, { credentials: "include" });
              const full = await res.json();
              setReceivingPO(full);
            } catch { setReceivingPO(po as POWithItems); }
          }}
          isLoading={isLoading}
        />
      )}
      {activeTab === "receiving" && <ReceivingTab purchaseOrders={purchaseOrders.filter(po => ["approved", "partially_received"].includes(po.status))} supplierMap={supplierMap} onReceive={async (po) => {
        try {
          const res = await fetch(`/api/purchase-orders/${po.id}`, { credentials: "include" });
          const full = await res.json();
          setReceivingPO(full);
        } catch { setReceivingPO(po as POWithItems); }
      }} />}
      {activeTab === "financial" && <FinancialTab purchaseOrders={purchaseOrders} supplierMap={supplierMap} onRecordPayment={(po, amount) => {
        const newPaid = parseFloat(po.paidAmount || "0") + amount;
        const total = parseFloat(po.grandTotal || "0");
        const paymentStatus = newPaid >= total ? "paid" : newPaid > 0 ? "partial" : "unpaid";
        updateMutation.mutate({ id: po.id, data: { paidAmount: newPaid.toFixed(2), paymentStatus } });
      }} />}

      {viewingPO && <PODetailDialog po={viewingPO} supplierMap={supplierMap} onClose={() => setViewingPO(null)} />}
      {receivingPO && <ReceivingDialog po={receivingPO} onClose={() => setReceivingPO(null)} onSave={(items) => {
        const allReceived = items.every((it: any) => it.receivedQuantity >= it.quantity);
        const anyReceived = items.some((it: any) => it.receivedQuantity > 0);
        const newStatus = allReceived ? "fully_received" : anyReceived ? "partially_received" : receivingPO.status;
        const receivedTotal = items.reduce((s: number, it: any) => s + (it.receivedQuantity * parseFloat(it.unitPrice || "0")), 0);
        Promise.all(items.map((it: any) => apiRequest("PATCH", `/api/purchase-order-items/${it.id}`, {
          receivedQuantity: it.receivedQuantity, damagedQuantity: it.damagedQuantity, shortQuantity: it.shortQuantity,
          serialNumbers: it.serialNumbers, inspectionStatus: it.inspectionStatus,
        }))).then(() => {
          updateMutation.mutate({ id: receivingPO.id, data: { status: newStatus, receivedAmount: receivedTotal.toFixed(2) } });
        });
      }} />}

    </div>
  );
}

function OverviewTab({ purchasesBySupplier, monthlyTrend, statusDistribution, purchaseOrders, supplierMap }: any) {
  const recentPOs = purchaseOrders.slice(0, 8);
  return (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle className="text-sm">Purchases by Supplier</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={purchasesBySupplier} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {purchasesBySupplier.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `PKR ${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Monthly Procurement Trend</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `PKR ${v.toLocaleString()}`} />
              <Area type="monotone" dataKey="value" stroke="#059669" fill="#059669" fillOpacity={0.2} name="Purchase Value" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">PO Status Distribution</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#059669" name="Count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Recent Purchase Orders</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentPOs.length === 0 && <p className="text-sm text-muted-foreground">No purchase orders yet</p>}
            {recentPOs.map((po: PurchaseOrder) => {
              const sc = statusConfig[po.status] || statusConfig.draft;
              return (
                <div key={po.id} className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/50 transition-colors" data-testid={`recent-po-${po.id}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium">{po.poNumber}</span>
                    <span className="text-sm text-muted-foreground">{supplierMap[po.supplierId]?.companyName || "—"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">PKR {parseFloat(po.grandTotal || "0").toLocaleString()}</span>
                    <Badge className={`${sc.color} text-xs`}>{sc.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateEditTab({ suppliers, products, editingPO, onSave, isPending, onCancel }: any) {
  const [supplierId, setSupplierId] = useState(editingPO?.supplierId?.toString() || "");
  const [warehouse, setWarehouse] = useState(editingPO?.warehouseDestination || "");
  const [poDate, setPoDate] = useState(editingPO?.poDate || new Date().toISOString().split("T")[0]);
  const [deliveryDate, setDeliveryDate] = useState(editingPO?.expectedDeliveryDate || "");
  const [paymentTerms, setPaymentTerms] = useState(editingPO?.paymentTerms || "cash");
  const [currency, setCurrency] = useState(editingPO?.currency || "PKR");
  const [linkedAllocation, setLinkedAllocation] = useState(editingPO?.linkedAllocationId || "");
  const [priority, setPriority] = useState(editingPO?.priorityLevel || "normal");
  const [approvalRequired, setApprovalRequired] = useState(editingPO?.approvalRequired ?? true);
  const [shippingCost, setShippingCost] = useState(editingPO?.shippingCost || "0");
  const [additionalCharges, setAdditionalCharges] = useState(editingPO?.additionalCharges || "0");
  const [notes, setNotes] = useState(editingPO?.notes || "");
  const [lineItems, setLineItems] = useState<any[]>(editingPO?.items?.map((it: any) => ({
    productId: it.productId, productName: it.productName, description: it.description || "",
    quantity: it.quantity, unitPrice: it.unitPrice || "0", discount: it.discount || "0", tax: it.tax || "0",
  })) || []);

  const addLineItem = () => setLineItems([...lineItems, { productId: null, productName: "", description: "", quantity: 1, unitPrice: "0", discount: "0", tax: "0" }]);
  const removeLineItem = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));
  const updateLineItem = (idx: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "productId" && value) {
      const prod = products.find((p: Product) => p.id === parseInt(value));
      if (prod) {
        updated[idx].productName = prod.name;
        updated[idx].unitPrice = prod.purchaseCost || "0";
        updated[idx].description = prod.model || "";
      }
    }
    setLineItems(updated);
  };

  const calcLineTotal = (item: any) => {
    const qty = parseInt(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const disc = parseFloat(item.discount) || 0;
    const tax = parseFloat(item.tax) || 0;
    return qty * price * (1 - disc / 100) * (1 + tax / 100);
  };

  const subtotal = lineItems.reduce((s, it) => s + calcLineTotal(it), 0);
  const taxAmount = lineItems.reduce((s, it) => {
    const qty = parseInt(it.quantity) || 0;
    const price = parseFloat(it.unitPrice) || 0;
    const disc = parseFloat(it.discount) || 0;
    const tax = parseFloat(it.tax) || 0;
    return s + (qty * price * (1 - disc / 100) * tax / 100);
  }, 0);
  const grandTotal = subtotal + parseFloat(shippingCost || "0") + parseFloat(additionalCharges || "0");

  const selectedSupplier = suppliers.find((s: Supplier) => s.id === parseInt(supplierId));
  const creditExceeded = selectedSupplier && parseFloat(selectedSupplier.creditLimit || "0") > 0 &&
    grandTotal > parseFloat(selectedSupplier.creditLimit || "0") - parseFloat(selectedSupplier.outstandingPayable || "0");

  const handleSubmit = () => {
    if (!supplierId) return;
    onSave({
      supplierId: parseInt(supplierId), warehouseDestination: warehouse, poDate, expectedDeliveryDate: deliveryDate,
      paymentTerms, currency, linkedAllocationId: linkedAllocation, priorityLevel: priority,
      approvalRequired, shippingCost, additionalCharges, notes,
      subtotal: subtotal.toFixed(2), taxAmount: taxAmount.toFixed(2), grandTotal: grandTotal.toFixed(2),
      status: editingPO?.status || "draft",
      items: lineItems.map(it => ({
        productId: it.productId ? parseInt(it.productId) : null, productName: it.productName,
        description: it.description, quantity: parseInt(it.quantity) || 1,
        unitPrice: it.unitPrice, discount: it.discount, tax: it.tax,
      })),
    });
  };

  const activeSuppliers = suppliers.filter((s: Supplier) => s.status === "active");

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{editingPO ? `Edit PO: ${editingPO.poNumber}` : "Create New Purchase Order"}</h2>

      <Card>
        <CardHeader><CardTitle className="text-sm">PO Header</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>PO Number</Label>
              <Input value={editingPO?.poNumber || "Auto-generated"} disabled className="font-mono" data-testid="input-po-number" />
            </div>
            <div>
              <Label>Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId} data-testid="select-supplier">
                <SelectTrigger data-testid="select-supplier-trigger"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {activeSuppliers.map((s: Supplier) => <SelectItem key={s.id} value={s.id.toString()}>{s.companyName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Warehouse Destination</Label>
              <Input value={warehouse} onChange={e => setWarehouse(e.target.value)} placeholder="Main Warehouse" data-testid="input-warehouse" />
            </div>
            <div>
              <Label>PO Date *</Label>
              <Input type="date" value={poDate} onChange={e => setPoDate(e.target.value)} data-testid="input-po-date" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Expected Delivery Date</Label>
              <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} data-testid="input-delivery-date" />
            </div>
            <div>
              <Label>Payment Terms</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger data-testid="select-payment-terms"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="net_15">Net 15</SelectItem>
                  <SelectItem value="net_30">Net 30</SelectItem>
                  <SelectItem value="net_60">Net 60</SelectItem>
                  <SelectItem value="net_90">Net 90</SelectItem>
                  <SelectItem value="advance">Advance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger data-testid="select-currency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PKR">PKR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority Level</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger data-testid="select-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Linked Allocation / Request ID</Label>
              <Input value={linkedAllocation} onChange={e => setLinkedAllocation(e.target.value)} placeholder="Optional" data-testid="input-linked-allocation" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox checked={approvalRequired} onCheckedChange={(v) => setApprovalRequired(!!v)} data-testid="checkbox-approval-required" />
              <Label className="cursor-pointer">Approval Required</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {creditExceeded && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2" data-testid="alert-credit-exceeded">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700 dark:text-red-400">
            Warning: This PO total (PKR {grandTotal.toLocaleString()}) may exceed the supplier's available credit limit.
          </span>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Line Items</CardTitle>
          <Button size="sm" variant="outline" onClick={addLineItem} data-testid="button-add-line-item"><Plus className="h-3 w-3 mr-1" /> Add Item</Button>
        </CardHeader>
        <CardContent>
          {lineItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No line items. Click "Add Item" to start.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 to-emerald-700 text-white">
                    <th className="p-2 text-left font-medium rounded-tl-lg">Product</th>
                    <th className="p-2 text-left font-medium">Description</th>
                    <th className="p-2 text-right font-medium w-20">Qty</th>
                    <th className="p-2 text-right font-medium w-28">Unit Price</th>
                    <th className="p-2 text-right font-medium w-20">Disc %</th>
                    <th className="p-2 text-right font-medium w-20">Tax %</th>
                    <th className="p-2 text-right font-medium w-28">Subtotal</th>
                    <th className="p-2 text-center font-medium rounded-tr-lg w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <Select value={item.productId?.toString() || ""} onValueChange={(v) => updateLineItem(idx, "productId", v)}>
                          <SelectTrigger className="h-8 text-xs" data-testid={`select-line-product-${idx}`}><SelectValue placeholder="Select product" /></SelectTrigger>
                          <SelectContent>
                            {products.map((p: Product) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {!item.productId && <Input className="h-8 text-xs mt-1" placeholder="Or type name" value={item.productName} onChange={e => updateLineItem(idx, "productName", e.target.value)} data-testid={`input-line-name-${idx}`} />}
                      </td>
                      <td className="p-2"><Input className="h-8 text-xs" value={item.description} onChange={e => updateLineItem(idx, "description", e.target.value)} data-testid={`input-line-desc-${idx}`} /></td>
                      <td className="p-2"><Input className="h-8 text-xs text-right" type="number" min="1" value={item.quantity} onChange={e => updateLineItem(idx, "quantity", e.target.value)} data-testid={`input-line-qty-${idx}`} /></td>
                      <td className="p-2"><Input className="h-8 text-xs text-right" type="number" step="0.01" value={item.unitPrice} onChange={e => updateLineItem(idx, "unitPrice", e.target.value)} data-testid={`input-line-price-${idx}`} /></td>
                      <td className="p-2"><Input className="h-8 text-xs text-right" type="number" step="0.1" value={item.discount} onChange={e => updateLineItem(idx, "discount", e.target.value)} data-testid={`input-line-discount-${idx}`} /></td>
                      <td className="p-2"><Input className="h-8 text-xs text-right" type="number" step="0.1" value={item.tax} onChange={e => updateLineItem(idx, "tax", e.target.value)} data-testid={`input-line-tax-${idx}`} /></td>
                      <td className="p-2 text-right font-mono text-xs font-medium">{calcLineTotal(item).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td className="p-2 text-center">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => removeLineItem(idx)} data-testid={`button-remove-line-${idx}`}><X className="h-3 w-3" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Footer & Totals</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <Label>Shipping Cost</Label>
                <Input type="number" step="0.01" value={shippingCost} onChange={e => setShippingCost(e.target.value)} data-testid="input-shipping-cost" />
              </div>
              <div>
                <Label>Additional Charges</Label>
                <Input type="number" step="0.01" value={additionalCharges} onChange={e => setAdditionalCharges(e.target.value)} data-testid="input-additional-charges" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} data-testid="input-notes" />
              </div>
            </div>
            <div className="space-y-2 bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-mono">{subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between text-sm"><span>Tax Amount</span><span className="font-mono">{taxAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between text-sm"><span>Shipping</span><span className="font-mono">{parseFloat(shippingCost || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between text-sm"><span>Additional</span><span className="font-mono">{parseFloat(additionalCharges || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
              <hr />
              <div className="flex justify-between text-base font-bold"><span>Grand Total</span><span className="font-mono text-emerald-600">{currency} {grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} data-testid="button-cancel-po">Cancel</Button>
        <Button onClick={handleSubmit} disabled={!supplierId || lineItems.length === 0 || isPending}
          className="bg-gradient-to-r from-slate-700 to-emerald-600 text-white" data-testid="button-save-po">
          {isPending ? "Saving..." : editingPO ? "Update Purchase Order" : "Create Purchase Order"}
        </Button>
      </div>
    </div>
  );
}

function POListTab({ purchaseOrders, supplierMap, searchQuery, setSearchQuery, filterStatus, setFilterStatus, filterSupplier, setFilterSupplier, filterPayment, setFilterPayment, filterWarehouse, setFilterWarehouse, showFilters, setShowFilters, warehouses, suppliers, onView, onEdit, onApprove, onReject, onCancel, onSubmit, onDelete, onExportCSV, onReceive, isLoading }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by PO number or supplier..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search-po" />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} data-testid="button-toggle-filters">
          <Filter className="h-4 w-4 mr-2" /> Filters {showFilters ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
        </Button>
        <Button variant="outline" onClick={onExportCSV} data-testid="button-export-csv"><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-4">
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
                <Label className="text-xs">Supplier</Label>
                <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                  <SelectTrigger data-testid="filter-supplier"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.map((s: Supplier) => <SelectItem key={s.id} value={s.id.toString()}>{s.companyName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Payment Status</Label>
                <Select value={filterPayment} onValueChange={setFilterPayment}>
                  <SelectTrigger data-testid="filter-payment"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {Object.entries(paymentStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Warehouse</Label>
                <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
                  <SelectTrigger data-testid="filter-warehouse"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {warehouses.map((w: string) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-slate-800 to-emerald-700 text-white">
              <th className="p-3 text-left font-medium rounded-tl-lg">PO Number</th>
              <th className="p-3 text-left font-medium">Supplier</th>
              <th className="p-3 text-left font-medium">Warehouse</th>
              <th className="p-3 text-left font-medium">PO Date</th>
              <th className="p-3 text-left font-medium">Delivery Date</th>
              <th className="p-3 text-right font-medium">Total Amount</th>
              <th className="p-3 text-right font-medium">Received</th>
              <th className="p-3 text-center font-medium">Payment</th>
              <th className="p-3 text-center font-medium">Status</th>
              <th className="p-3 text-center font-medium rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Loading purchase orders...</td></tr>
            ) : purchaseOrders.length === 0 ? (
              <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">No purchase orders found</td></tr>
            ) : purchaseOrders.map((po: PurchaseOrder) => {
              const sc = statusConfig[po.status] || statusConfig.draft;
              const ps = paymentStatusConfig[po.paymentStatus || "unpaid"] || paymentStatusConfig.unpaid;
              return (
                <tr key={po.id} className="border-b hover:bg-muted/50 transition-colors" data-testid={`row-po-${po.id}`}>
                  <td className="p-3 font-mono font-medium">{po.poNumber}</td>
                  <td className="p-3">{supplierMap[po.supplierId]?.companyName || "—"}</td>
                  <td className="p-3">{po.warehouseDestination || "—"}</td>
                  <td className="p-3">{po.poDate}</td>
                  <td className="p-3">{po.expectedDeliveryDate || "—"}</td>
                  <td className="p-3 text-right font-mono">PKR {parseFloat(po.grandTotal || "0").toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">PKR {parseFloat(po.receivedAmount || "0").toLocaleString()}</td>
                  <td className="p-3 text-center"><Badge className={`${ps.color} text-xs`}>{ps.label}</Badge></td>
                  <td className="p-3 text-center"><Badge className={`${sc.color} text-xs`}>{sc.label}</Badge></td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onView(po)} data-testid={`button-view-${po.id}`}><Eye className="h-3.5 w-3.5" /></Button>
                      {po.status === "draft" && <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(po)} data-testid={`button-edit-${po.id}`}><Pencil className="h-3.5 w-3.5" /></Button>}
                      {po.status === "draft" && <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600" onClick={() => onSubmit(po)} title="Submit for Approval" data-testid={`button-submit-${po.id}`}><TrendingUp className="h-3.5 w-3.5" /></Button>}
                      {po.status === "pending_approval" && <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600" onClick={() => onApprove(po)} data-testid={`button-approve-${po.id}`}><CheckCircle2 className="h-3.5 w-3.5" /></Button>}
                      {po.status === "pending_approval" && <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600" onClick={() => onReject(po)} data-testid={`button-reject-${po.id}`}><XCircle className="h-3.5 w-3.5" /></Button>}
                      {["approved", "partially_received"].includes(po.status) && <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-emerald-600" onClick={() => onReceive(po)} title="Receive Goods" data-testid={`button-receive-${po.id}`}><Truck className="h-3.5 w-3.5" /></Button>}
                      {["draft", "pending_approval", "approved"].includes(po.status) && <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500" onClick={() => onCancel(po)} data-testid={`button-cancel-${po.id}`}><XCircle className="h-3.5 w-3.5" /></Button>}
                      {(po.status === "draft" || po.status === "cancelled") && <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => onDelete(po)} data-testid={`button-delete-${po.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReceivingTab({ purchaseOrders, supplierMap, onReceive }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">POs Ready for Receiving</h2>
      {purchaseOrders.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          <Truck className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No purchase orders are ready for receiving.</p>
          <p className="text-xs mt-1">Only approved or partially received POs appear here.</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {purchaseOrders.map((po: PurchaseOrder) => {
            const sc = statusConfig[po.status] || statusConfig.draft;
            return (
              <Card key={po.id} className="hover:shadow-md transition-shadow" data-testid={`card-receiving-${po.id}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="font-mono font-medium">{po.poNumber}</span>
                      <p className="text-xs text-muted-foreground mt-1">{supplierMap[po.supplierId]?.companyName || "—"}</p>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Warehouse:</span> {po.warehouseDestination || "—"}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Total:</span> <span className="font-mono">PKR {parseFloat(po.grandTotal || "0").toLocaleString()}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Received:</span> <span className="font-mono">PKR {parseFloat(po.receivedAmount || "0").toLocaleString()}</span>
                    </div>
                    <Badge className={sc.color}>{sc.label}</Badge>
                  </div>
                  <Button size="sm" onClick={() => onReceive(po)} className="bg-emerald-600 text-white" data-testid={`button-start-receiving-${po.id}`}>
                    <Truck className="h-4 w-4 mr-2" /> Receive Goods
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FinancialTab({ purchaseOrders, supplierMap, onRecordPayment }: any) {
  const [paymentAmounts, setPaymentAmounts] = useState<Record<number, string>>({});
  const activePOs = purchaseOrders.filter((po: PurchaseOrder) => !["draft", "cancelled", "rejected"].includes(po.status));
  const totalPOValue = activePOs.reduce((s: number, po: PurchaseOrder) => s + parseFloat(po.grandTotal || "0"), 0);
  const totalPaid = activePOs.reduce((s: number, po: PurchaseOrder) => s + parseFloat(po.paidAmount || "0"), 0);
  const outstanding = totalPOValue - totalPaid;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0">
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 opacity-80 mb-2" />
            <div className="text-xl font-bold" data-testid="text-total-po-value">PKR {totalPOValue.toLocaleString()}</div>
            <div className="text-xs opacity-80">Total PO Value</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white border-0">
          <CardContent className="p-4">
            <CheckCircle2 className="h-5 w-5 opacity-80 mb-2" />
            <div className="text-xl font-bold" data-testid="text-total-paid">PKR {totalPaid.toLocaleString()}</div>
            <div className="text-xs opacity-80">Amount Paid</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-700 text-white border-0">
          <CardContent className="p-4">
            <AlertTriangle className="h-5 w-5 opacity-80 mb-2" />
            <div className="text-xl font-bold" data-testid="text-outstanding">PKR {outstanding.toLocaleString()}</div>
            <div className="text-xs opacity-80">Outstanding Balance</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0">
          <CardContent className="p-4">
            <TrendingUp className="h-5 w-5 opacity-80 mb-2" />
            <div className="text-xl font-bold" data-testid="text-payment-ratio">{totalPOValue > 0 ? ((totalPaid / totalPOValue) * 100).toFixed(1) : 0}%</div>
            <div className="text-xs opacity-80">Payment Ratio</div>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
              <th className="p-3 text-left font-medium rounded-tl-lg">PO Number</th>
              <th className="p-3 text-left font-medium">Supplier</th>
              <th className="p-3 text-right font-medium">PO Value</th>
              <th className="p-3 text-right font-medium">Paid</th>
              <th className="p-3 text-right font-medium">Outstanding</th>
              <th className="p-3 text-center font-medium">Payment Status</th>
              <th className="p-3 text-left font-medium">Due Date</th>
              <th className="p-3 text-center font-medium rounded-tr-lg">Record Payment</th>
            </tr>
          </thead>
          <tbody>
            {activePOs.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No active purchase orders</td></tr>
            ) : activePOs.map((po: PurchaseOrder) => {
              const total = parseFloat(po.grandTotal || "0");
              const paid = parseFloat(po.paidAmount || "0");
              const bal = total - paid;
              const ps = paymentStatusConfig[po.paymentStatus || "unpaid"] || paymentStatusConfig.unpaid;
              return (
                <tr key={po.id} className="border-b hover:bg-muted/50" data-testid={`row-financial-${po.id}`}>
                  <td className="p-3 font-mono font-medium">{po.poNumber}</td>
                  <td className="p-3">{supplierMap[po.supplierId]?.companyName || "—"}</td>
                  <td className="p-3 text-right font-mono">PKR {total.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-green-600">PKR {paid.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-red-600">PKR {bal.toLocaleString()}</td>
                  <td className="p-3 text-center"><Badge className={ps.color}>{ps.label}</Badge></td>
                  <td className="p-3">{po.paymentDueDate || "—"}</td>
                  <td className="p-3">
                    {bal > 0 && (
                      <div className="flex items-center gap-2 justify-center">
                        <Input type="number" step="0.01" placeholder="Amount" className="h-7 w-28 text-xs"
                          value={paymentAmounts[po.id] || ""} onChange={e => setPaymentAmounts({ ...paymentAmounts, [po.id]: e.target.value })}
                          data-testid={`input-payment-${po.id}`} />
                        <Button size="sm" className="h-7 text-xs" onClick={() => {
                          const amt = parseFloat(paymentAmounts[po.id] || "0");
                          if (amt > 0 && amt <= bal) {
                            onRecordPayment(po, amt);
                            setPaymentAmounts({ ...paymentAmounts, [po.id]: "" });
                          }
                        }} data-testid={`button-pay-${po.id}`}>Pay</Button>
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
  );
}

function PODetailDialog({ po, supplierMap, onClose }: { po: POWithItems; supplierMap: Record<number, Supplier>; onClose: () => void }) {
  const sc = statusConfig[po.status] || statusConfig.draft;
  const ps = paymentStatusConfig[po.paymentStatus || "unpaid"] || paymentStatusConfig.unpaid;
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono">{po.poNumber}</span>
            <Badge className={sc.color}>{sc.label}</Badge>
            <Badge className={ps.color}>{ps.label}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Supplier:</span><br /><strong>{supplierMap[po.supplierId]?.companyName || "—"}</strong></div>
            <div><span className="text-muted-foreground">Warehouse:</span><br /><strong>{po.warehouseDestination || "—"}</strong></div>
            <div><span className="text-muted-foreground">PO Date:</span><br /><strong>{po.poDate}</strong></div>
            <div><span className="text-muted-foreground">Expected Delivery:</span><br /><strong>{po.expectedDeliveryDate || "—"}</strong></div>
            <div><span className="text-muted-foreground">Payment Terms:</span><br /><strong>{po.paymentTerms}</strong></div>
            <div><span className="text-muted-foreground">Currency:</span><br /><strong>{po.currency}</strong></div>
            <div><span className="text-muted-foreground">Priority:</span><br /><strong className="capitalize">{po.priorityLevel}</strong></div>
            <div><span className="text-muted-foreground">Approval Required:</span><br /><strong>{po.approvalRequired ? "Yes" : "No"}</strong></div>
          </div>

          {po.items && po.items.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 to-emerald-700 text-white">
                    <th className="p-2 text-left font-medium rounded-tl-lg">Product</th>
                    <th className="p-2 text-left font-medium">Description</th>
                    <th className="p-2 text-right font-medium">Qty</th>
                    <th className="p-2 text-right font-medium">Unit Price</th>
                    <th className="p-2 text-right font-medium">Disc %</th>
                    <th className="p-2 text-right font-medium">Tax %</th>
                    <th className="p-2 text-right font-medium">Subtotal</th>
                    <th className="p-2 text-right font-medium">Received</th>
                    <th className="p-2 text-center font-medium rounded-tr-lg">Inspection</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2">{item.productName}</td>
                      <td className="p-2 text-muted-foreground">{item.description || "—"}</td>
                      <td className="p-2 text-right">{item.quantity}</td>
                      <td className="p-2 text-right font-mono">{parseFloat(item.unitPrice || "0").toLocaleString()}</td>
                      <td className="p-2 text-right">{item.discount}%</td>
                      <td className="p-2 text-right">{item.tax}%</td>
                      <td className="p-2 text-right font-mono">{parseFloat(item.subtotal || "0").toLocaleString()}</td>
                      <td className="p-2 text-right">{item.receivedQuantity || 0} / {item.quantity}</td>
                      <td className="p-2 text-center capitalize">{item.inspectionStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{parseFloat(po.subtotal || "0").toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Tax</span><span className="font-mono">{parseFloat(po.taxAmount || "0").toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span className="font-mono">{parseFloat(po.shippingCost || "0").toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Additional Charges</span><span className="font-mono">{parseFloat(po.additionalCharges || "0").toLocaleString()}</span></div>
            <hr />
            <div className="flex justify-between font-bold text-base"><span>Grand Total</span><span className="font-mono text-emerald-600">{po.currency} {parseFloat(po.grandTotal || "0").toLocaleString()}</span></div>
            <div className="flex justify-between text-green-600"><span>Amount Paid</span><span className="font-mono">{parseFloat(po.paidAmount || "0").toLocaleString()}</span></div>
            <div className="flex justify-between text-red-600"><span>Outstanding</span><span className="font-mono">{(parseFloat(po.grandTotal || "0") - parseFloat(po.paidAmount || "0")).toLocaleString()}</span></div>
          </div>

          {po.notes && (
            <div className="text-sm"><span className="text-muted-foreground">Notes:</span><p className="mt-1">{po.notes}</p></div>
          )}

          {po.approvedBy && <div className="text-sm"><span className="text-muted-foreground">Approved by:</span> {po.approvedBy} on {po.approvedDate}</div>}
          {po.rejectedBy && <div className="text-sm text-red-600"><span className="text-muted-foreground">Rejected by:</span> {po.rejectedBy} — {po.rejectionReason}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-close-detail">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReceivingDialog({ po, onClose, onSave }: { po: POWithItems; onClose: () => void; onSave: (items: any[]) => void }) {
  const [items, setItems] = useState(
    (po.items || []).map(it => ({
      ...it,
      receivedQuantity: it.receivedQuantity || 0,
      damagedQuantity: it.damagedQuantity || 0,
      shortQuantity: it.shortQuantity || 0,
      serialNumbers: it.serialNumbers || "",
      inspectionStatus: it.inspectionStatus || "pending",
    }))
  );

  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive Goods — {po.poNumber}</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-800 to-emerald-700 text-white">
                <th className="p-2 text-left font-medium rounded-tl-lg">Product</th>
                <th className="p-2 text-right font-medium">Ordered</th>
                <th className="p-2 text-right font-medium">Received</th>
                <th className="p-2 text-right font-medium">Damaged</th>
                <th className="p-2 text-right font-medium">Short</th>
                <th className="p-2 text-left font-medium">Serial Numbers</th>
                <th className="p-2 text-center font-medium rounded-tr-lg">Inspection</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2 font-medium">{item.productName}</td>
                  <td className="p-2 text-right">{item.quantity}</td>
                  <td className="p-2"><Input type="number" min="0" max={item.quantity} className="h-7 w-20 text-xs text-right ml-auto" value={item.receivedQuantity} onChange={e => updateItem(idx, "receivedQuantity", parseInt(e.target.value) || 0)} data-testid={`input-received-${idx}`} /></td>
                  <td className="p-2"><Input type="number" min="0" className="h-7 w-20 text-xs text-right ml-auto" value={item.damagedQuantity} onChange={e => updateItem(idx, "damagedQuantity", parseInt(e.target.value) || 0)} data-testid={`input-damaged-${idx}`} /></td>
                  <td className="p-2"><Input type="number" min="0" className="h-7 w-20 text-xs text-right ml-auto" value={item.shortQuantity} onChange={e => updateItem(idx, "shortQuantity", parseInt(e.target.value) || 0)} data-testid={`input-short-${idx}`} /></td>
                  <td className="p-2"><Input className="h-7 text-xs" placeholder="e.g. SN001, SN002" value={item.serialNumbers} onChange={e => updateItem(idx, "serialNumbers", e.target.value)} data-testid={`input-serials-${idx}`} /></td>
                  <td className="p-2">
                    <Select value={item.inspectionStatus} onValueChange={v => updateItem(idx, "inspectionStatus", v)}>
                      <SelectTrigger className="h-7 text-xs" data-testid={`select-inspection-${idx}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="passed">Passed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-receiving">Cancel</Button>
          <Button onClick={() => onSave(items)} className="bg-emerald-600 text-white" data-testid="button-save-receiving">Save Receiving Data</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}