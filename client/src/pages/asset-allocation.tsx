import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, CheckCircle, Clock,
  AlertTriangle, XCircle, Eye, X, Calendar, Package, Layers,
  Activity, RefreshCw, Ban, ArrowUpRight, Filter, BarChart3,
  TrendingUp, AlertCircle, Users, ChevronRight, FileText, Zap,
  Warehouse, MapPin, ArrowRightLeft, Shield, Download,
  CircleDot, Timer, CheckSquare, BookOpen, Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTab } from "@/hooks/use-tab";
import type { Asset, AssetAllocation, AssetAllocationHistory } from "@shared/schema";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from "recharts";

const allocationFormSchema = z.object({
  allocationType: z.string().min(1, "Allocation type is required"),
  assetType: z.string().min(1, "Asset type is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  sourceWarehouse: z.string().min(1, "Source warehouse is required"),
  destination: z.string().min(1, "Destination is required"),
  destinationType: z.string().min(1, "Destination type is required"),
  linkedProject: z.string().optional(),
  expectedUsageDate: z.string().optional(),
  reservationExpiry: z.string().optional(),
  priority: z.string().default("normal"),
  justification: z.string().min(1, "Justification is required"),
  requestedBy: z.string().min(1, "Requester is required"),
  approvalRequired: z.boolean().default(true),
  reserveSerials: z.boolean().default(false),
  autoSelect: z.boolean().default(true),
  notifyResponsible: z.boolean().default(false),
  notes: z.string().optional(),
});

type AllocationFormValues = z.infer<typeof allocationFormSchema>;

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  reserved: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock, label: "Reserved" },
  pending_approval: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Timer, label: "Pending Approval" },
  allocated: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle, label: "Allocated" },
  partially_allocated: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: CircleDot, label: "Partially Allocated" },
  cancelled: { color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", icon: Ban, label: "Cancelled" },
  expired: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle, label: "Expired" },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", label: "Low" },
  normal: { color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", label: "Normal" },
  high: { color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400", label: "High" },
  critical: { color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400", label: "Critical" },
  emergency: { color: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400", label: "Emergency" },
};

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

const tabs = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "allocations", label: "All Allocations", icon: Layers },
  { id: "reserved", label: "Reserved Queue", icon: Clock },
  { id: "fulfillment", label: "Fulfillment", icon: CheckSquare },
  { id: "history", label: "Audit Log", icon: BookOpen },
];

export default function AssetAllocationPage() {
  const [activeTab, setActiveTab] = useTab("overview");
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<AssetAllocation | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [isEditing, setIsEditing] = useState(false);

  const { data: allocations = [], isLoading: allocationsLoading } = useQuery<AssetAllocation[]>({
    queryKey: ["/api/asset-allocations"],
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const form = useForm<AllocationFormValues>({
    resolver: zodResolver(allocationFormSchema),
    defaultValues: {
      allocationType: "",
      assetType: "",
      quantity: 1,
      sourceWarehouse: "",
      destination: "",
      destinationType: "",
      linkedProject: "",
      expectedUsageDate: "",
      reservationExpiry: "",
      priority: "normal",
      justification: "",
      requestedBy: "",
      approvalRequired: true,
      reserveSerials: false,
      autoSelect: true,
      notifyResponsible: false,
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AllocationFormValues) => {
      const allocationId = `ALLOC-${String(allocations.length + 1).padStart(4, "0")}`;
      return apiRequest("POST", "/api/asset-allocations", { ...data, allocationId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-allocations"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({ title: "Allocation created", description: "The asset allocation has been created successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create allocation", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AllocationFormValues & { status: string }> }) => {
      return apiRequest("PATCH", `/api/asset-allocations/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-allocations"] });
      setViewDialogOpen(false);
      setIsEditing(false);
      toast({ title: "Allocation updated", description: "The allocation has been updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update allocation", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/asset-allocations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-allocations"] });
      setDeleteDialogOpen(false);
      setSelectedAllocation(null);
      toast({ title: "Allocation deleted", description: "The allocation has been removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete allocation", variant: "destructive" });
    },
  });

  const assetTypes = useMemo(() => [...new Set(assets.map(a => a.type))], [assets]);
  const warehouses = useMemo(() => [...new Set(assets.filter(a => a.location).map(a => a.location!))], [assets]);

  const stats = useMemo(() => {
    const total = allocations.length;
    const reserved = allocations.filter(a => a.status === "reserved").length;
    const allocated = allocations.filter(a => a.status === "allocated").length;
    const pendingApproval = allocations.filter(a => a.status === "pending_approval").length;
    const partiallyAllocated = allocations.filter(a => a.status === "partially_allocated").length;
    const cancelled = allocations.filter(a => a.status === "cancelled").length;
    const expired = allocations.filter(a => a.status === "expired").length;
    const totalQuantity = allocations.reduce((sum, a) => sum + a.quantity, 0);
    const fulfilledQuantity = allocations.reduce((sum, a) => sum + (a.fulfilledQuantity || 0), 0);
    const fulfillmentRate = totalQuantity > 0 ? Math.round((fulfilledQuantity / totalQuantity) * 100) : 0;
    const highPriority = allocations.filter(a => a.priority === "high" || a.priority === "critical" || a.priority === "emergency").length;
    return { total, reserved, allocated, pendingApproval, partiallyAllocated, cancelled, expired, totalQuantity, fulfilledQuantity, fulfillmentRate, highPriority };
  }, [allocations]);

  const filteredAllocations = useMemo(() => {
    return allocations.filter(a => {
      if (filterStatus !== "all" && a.status !== filterStatus) return false;
      if (filterPriority !== "all" && a.priority !== filterPriority) return false;
      if (filterType !== "all" && a.assetType !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          a.allocationId?.toLowerCase().includes(q) ||
          a.assetType?.toLowerCase().includes(q) ||
          a.destination?.toLowerCase().includes(q) ||
          a.requestedBy?.toLowerCase().includes(q) ||
          a.sourceWarehouse?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allocations, filterStatus, filterPriority, filterType, searchQuery]);

  const reservedAllocations = useMemo(() => {
    return allocations.filter(a => a.status === "reserved" || a.status === "pending_approval");
  }, [allocations]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    form.reset();
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (alloc: AssetAllocation) => {
    setIsEditing(true);
    setSelectedAllocation(alloc);
    form.reset({
      allocationType: alloc.allocationType,
      assetType: alloc.assetType,
      quantity: alloc.quantity,
      sourceWarehouse: alloc.sourceWarehouse,
      destination: alloc.destination,
      destinationType: alloc.destinationType,
      linkedProject: alloc.linkedProject || "",
      expectedUsageDate: alloc.expectedUsageDate || "",
      reservationExpiry: alloc.reservationExpiry || "",
      priority: alloc.priority,
      justification: alloc.justification,
      requestedBy: alloc.requestedBy,
      approvalRequired: alloc.approvalRequired,
      reserveSerials: alloc.reserveSerials,
      autoSelect: alloc.autoSelect,
      notifyResponsible: alloc.notifyResponsible,
      notes: alloc.notes || "",
    });
    setCreateDialogOpen(true);
  };

  const handleSubmit = (values: AllocationFormValues) => {
    if (isEditing && selectedAllocation) {
      updateMutation.mutate({ id: selectedAllocation.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleStatusChange = (alloc: AssetAllocation, newStatus: string) => {
    updateMutation.mutate({ id: alloc.id, data: { status: newStatus } });
  };

  const exportCSV = () => {
    const headers = ["Allocation ID", "Type", "Asset Type", "Qty", "Source", "Destination", "Priority", "Status", "Requested By", "Created"];
    const rows = filteredAllocations.map(a => [
      a.allocationId, a.allocationType, a.assetType, a.quantity,
      a.sourceWarehouse, a.destination, a.priority, a.status,
      a.requestedBy, a.createdAt || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "asset_allocations.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (allocationsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const statusPieData = [
    { name: "Reserved", value: stats.reserved, color: "#3b82f6" },
    { name: "Allocated", value: stats.allocated, color: "#10b981" },
    { name: "Pending", value: stats.pendingApproval, color: "#f59e0b" },
    { name: "Partial", value: stats.partiallyAllocated, color: "#8b5cf6" },
    { name: "Cancelled", value: stats.cancelled, color: "#6b7280" },
    { name: "Expired", value: stats.expired, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const typeBarData = assetTypes.map(t => ({
    name: t,
    count: allocations.filter(a => a.assetType === t).length,
    quantity: allocations.filter(a => a.assetType === t).reduce((s, a) => s + a.quantity, 0),
  })).filter(d => d.count > 0);

  const priorityData = [
    { name: "Low", value: allocations.filter(a => a.priority === "low").length },
    { name: "Normal", value: allocations.filter(a => a.priority === "normal").length },
    { name: "High", value: allocations.filter(a => a.priority === "high").length },
    { name: "Critical", value: allocations.filter(a => a.priority === "critical").length },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Asset Allocation</h1>
          <p className="text-muted-foreground mt-1">Reserve, allocate, and track asset distribution across projects and locations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button onClick={handleOpenCreate} data-testid="button-create-allocation">
            <Plus className="h-4 w-4 mr-2" /> New Allocation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Allocations", value: stats.total, icon: Layers, gradient: "from-blue-600 to-blue-400", change: `${stats.totalQuantity} units total` },
          { title: "Reserved", value: stats.reserved, icon: Clock, gradient: "from-sky-600 to-sky-400", change: "Awaiting fulfillment" },
          { title: "Allocated", value: stats.allocated, icon: CheckCircle, gradient: "from-emerald-600 to-emerald-400", change: `${stats.fulfilledQuantity} units fulfilled` },
          { title: "Pending Approval", value: stats.pendingApproval, icon: Timer, gradient: "from-amber-600 to-amber-400", change: "Needs review" },
          { title: "Partially Allocated", value: stats.partiallyAllocated, icon: CircleDot, gradient: "from-purple-600 to-purple-400", change: "In progress" },
          { title: "Fulfillment Rate", value: `${stats.fulfillmentRate}%`, icon: TrendingUp, gradient: "from-teal-600 to-teal-400", change: `${stats.fulfilledQuantity}/${stats.totalQuantity}` },
          { title: "High Priority", value: stats.highPriority, icon: AlertTriangle, gradient: "from-rose-600 to-rose-400", change: "Urgent items" },
          { title: "Cancelled / Expired", value: stats.cancelled + stats.expired, icon: XCircle, gradient: "from-gray-600 to-gray-400", change: `${stats.cancelled} cancelled, ${stats.expired} expired` },
        ].map((card, i) => (
          <Card key={i} className="overflow-hidden border-0 shadow-lg" data-testid={`card-kpi-${i}`}>
            <div className={`bg-gradient-to-r ${card.gradient} p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80">{card.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                </div>
                <card.icon className="h-8 w-8 text-white/60" />
              </div>
              <p className="text-xs text-white/60 mt-2">{card.change}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-1 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`tab-${tab.id}`}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Allocation by Status</CardTitle></CardHeader>
              <CardContent>
                {statusPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {statusPieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No allocation data yet</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Allocations by Asset Type</CardTitle></CardHeader>
              <CardContent>
                {typeBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={typeBarData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" name="Allocations" />
                      <Bar dataKey="quantity" fill="#10b981" name="Units" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Priority Distribution</CardTitle></CardHeader>
            <CardContent>
              {priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={priorityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  <p>No allocations yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              {allocations.length > 0 ? (
                <div className="space-y-3">
                  {allocations.slice(0, 5).map(alloc => {
                    const sc = statusConfig[alloc.status] || statusConfig.reserved;
                    const StatusIcon = sc.icon;
                    return (
                      <div key={alloc.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedAllocation(alloc); setViewDialogOpen(true); }} data-testid={`row-recent-${alloc.id}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${sc.color}`}>
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{alloc.allocationId}</p>
                            <p className="text-sm text-muted-foreground">{alloc.assetType} × {alloc.quantity} → {alloc.destination}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={priorityConfig[alloc.priority]?.color || ""}>{priorityConfig[alloc.priority]?.label || alloc.priority}</Badge>
                          <Badge className={sc.color}>{sc.label}</Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No allocations created yet</p>
                  <p className="text-sm mt-1">Create your first allocation to get started</p>
                  <Button className="mt-4" onClick={handleOpenCreate} data-testid="button-create-first">
                    <Plus className="h-4 w-4 mr-2" /> New Allocation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "allocations" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search allocations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]" data-testid="select-filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[140px]" data-testid="select-filter-priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {Object.entries(priorityConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]" data-testid="select-filter-type">
                <SelectValue placeholder="Asset Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {assetTypes.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                    <th className="px-4 py-3 text-left font-medium">Allocation ID</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Asset Type</th>
                    <th className="px-4 py-3 text-left font-medium">Qty</th>
                    <th className="px-4 py-3 text-left font-medium">Fulfilled</th>
                    <th className="px-4 py-3 text-left font-medium">Source</th>
                    <th className="px-4 py-3 text-left font-medium">Destination</th>
                    <th className="px-4 py-3 text-left font-medium">Priority</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Requested By</th>
                    <th className="px-4 py-3 text-left font-medium">Created</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAllocations.length > 0 ? filteredAllocations.map(alloc => {
                    const sc = statusConfig[alloc.status] || statusConfig.reserved;
                    return (
                      <tr key={alloc.id} className="hover:bg-muted/50 transition-colors" data-testid={`row-allocation-${alloc.id}`}>
                        <td className="px-4 py-3 font-medium">{alloc.allocationId}</td>
                        <td className="px-4 py-3">{alloc.allocationType}</td>
                        <td className="px-4 py-3">{alloc.assetType}</td>
                        <td className="px-4 py-3 text-center">{alloc.quantity}</td>
                        <td className="px-4 py-3 text-center">{alloc.fulfilledQuantity || 0}/{alloc.quantity}</td>
                        <td className="px-4 py-3">{alloc.sourceWarehouse}</td>
                        <td className="px-4 py-3">{alloc.destination}</td>
                        <td className="px-4 py-3">
                          <Badge className={priorityConfig[alloc.priority]?.color || ""}>{priorityConfig[alloc.priority]?.label || alloc.priority}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={sc.color}>{sc.label}</Badge>
                        </td>
                        <td className="px-4 py-3">{alloc.requestedBy}</td>
                        <td className="px-4 py-3 text-muted-foreground">{alloc.createdAt ? new Date(alloc.createdAt).toLocaleDateString() : "—"}</td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${alloc.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedAllocation(alloc); setViewDialogOpen(true); }}>
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEdit(alloc)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {alloc.status === "reserved" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStatusChange(alloc, "allocated")}>
                                    <CheckCircle className="h-4 w-4 mr-2" /> Mark Allocated
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(alloc, "pending_approval")}>
                                    <Timer className="h-4 w-4 mr-2" /> Send for Approval
                                  </DropdownMenuItem>
                                </>
                              )}
                              {alloc.status === "pending_approval" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(alloc, "allocated")}>
                                  <CheckCircle className="h-4 w-4 mr-2" /> Approve & Allocate
                                </DropdownMenuItem>
                              )}
                              {(alloc.status === "reserved" || alloc.status === "pending_approval" || alloc.status === "allocated") && (
                                <DropdownMenuItem onClick={() => handleStatusChange(alloc, "cancelled")} className="text-red-600">
                                  <Ban className="h-4 w-4 mr-2" /> Cancel
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setSelectedAllocation(alloc); setDeleteDialogOpen(true); }} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">
                        <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No allocations found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or create a new allocation</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "reserved" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Reserved & Pending Queue</h2>
            <Badge variant="outline" className="text-lg px-4 py-1">{reservedAllocations.length} items</Badge>
          </div>

          {reservedAllocations.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {reservedAllocations.map(alloc => {
                const sc = statusConfig[alloc.status] || statusConfig.reserved;
                const StatusIcon = sc.icon;
                return (
                  <Card key={alloc.id} className="overflow-hidden" data-testid={`card-reserved-${alloc.id}`}>
                    <div className="flex">
                      <div className={`w-2 bg-gradient-to-b ${alloc.priority === "critical" || alloc.priority === "emergency" ? "from-red-500 to-red-600" : alloc.priority === "high" ? "from-amber-500 to-amber-600" : "from-blue-500 to-blue-600"}`} />
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${sc.color}`}>
                              <StatusIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{alloc.allocationId}</h3>
                                <Badge className={sc.color}>{sc.label}</Badge>
                                <Badge className={priorityConfig[alloc.priority]?.color || ""}>{priorityConfig[alloc.priority]?.label || alloc.priority}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {alloc.assetType} × {alloc.quantity} | {alloc.sourceWarehouse} → {alloc.destination}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {alloc.status === "reserved" && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleStatusChange(alloc, "pending_approval")} data-testid={`button-send-approval-${alloc.id}`}>
                                  <Timer className="h-4 w-4 mr-1" /> Send for Approval
                                </Button>
                                <Button size="sm" onClick={() => handleStatusChange(alloc, "allocated")} data-testid={`button-allocate-${alloc.id}`}>
                                  <CheckCircle className="h-4 w-4 mr-1" /> Allocate Now
                                </Button>
                              </>
                            )}
                            {alloc.status === "pending_approval" && (
                              <Button size="sm" onClick={() => handleStatusChange(alloc, "allocated")} data-testid={`button-approve-${alloc.id}`}>
                                <CheckCircle className="h-4 w-4 mr-1" /> Approve & Allocate
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleStatusChange(alloc, "cancelled")} data-testid={`button-cancel-${alloc.id}`}>
                              <Ban className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Requested By</span>
                            <p className="font-medium">{alloc.requestedBy}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Justification</span>
                            <p className="font-medium truncate">{alloc.justification}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Expected Usage</span>
                            <p className="font-medium">{alloc.expectedUsageDate || "Not specified"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Reservation Expiry</span>
                            <p className="font-medium">{alloc.reservationExpiry || "No expiry"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No reserved or pending allocations</p>
                <p className="text-sm mt-1">All allocations have been processed</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "fulfillment" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.fulfillmentRate}%</p>
                    <p className="text-sm text-muted-foreground">Overall Fulfillment Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalQuantity}</p>
                    <p className="text-sm text-muted-foreground">Total Units Requested</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-200 dark:border-purple-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.fulfilledQuantity}</p>
                    <p className="text-sm text-muted-foreground">Units Fulfilled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Fulfillment Progress</CardTitle></CardHeader>
            <CardContent>
              {allocations.filter(a => a.status !== "cancelled" && a.status !== "expired").length > 0 ? (
                <div className="space-y-4">
                  {allocations.filter(a => a.status !== "cancelled" && a.status !== "expired").map(alloc => {
                    const progress = alloc.quantity > 0 ? Math.round(((alloc.fulfilledQuantity || 0) / alloc.quantity) * 100) : 0;
                    return (
                      <div key={alloc.id} className="p-4 rounded-lg border" data-testid={`row-fulfillment-${alloc.id}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{alloc.allocationId}</span>
                            <Badge variant="outline">{alloc.assetType}</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">{alloc.fulfilledQuantity || 0}/{alloc.quantity} units</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${progress === 100 ? "bg-emerald-500" : progress > 50 ? "bg-blue-500" : "bg-amber-500"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                          <span>{alloc.destination}</span>
                          <span>{progress}% complete</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No active allocations to track</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "history" && <AllocationAuditLog allocations={allocations} />}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Allocation" : "Create New Allocation"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="allocationType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allocation Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-allocation-type"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="project">Project Allocation</SelectItem>
                        <SelectItem value="pop_deployment">POP Deployment</SelectItem>
                        <SelectItem value="customer_installation">Customer Installation</SelectItem>
                        <SelectItem value="maintenance_replacement">Maintenance Replacement</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="stock_transfer">Stock Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="assetType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-asset-type"><SelectValue placeholder="Select asset type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {assetTypes.length > 0 ? assetTypes.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        )) : (
                          <>
                            <SelectItem value="OLT">OLT</SelectItem>
                            <SelectItem value="ONT">ONT</SelectItem>
                            <SelectItem value="router">Router</SelectItem>
                            <SelectItem value="switch">Switch</SelectItem>
                            <SelectItem value="UPS">UPS</SelectItem>
                            <SelectItem value="fiber_cable">Fiber Cable</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} onChange={e => field.onChange(parseInt(e.target.value) || 1)} data-testid="input-quantity" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="priority" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-priority"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(priorityConfig).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="sourceWarehouse" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Warehouse</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-source"><SelectValue placeholder="Select source" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {warehouses.length > 0 ? warehouses.map(w => (
                          <SelectItem key={w} value={w}>{w}</SelectItem>
                        )) : (
                          <>
                            <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                            <SelectItem value="Branch Warehouse">Branch Warehouse</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="destination" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. POP-Downtown, Project X" {...field} data-testid="input-destination" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="destinationType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-dest-type"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="pop">POP</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                        <SelectItem value="field_team">Field Team</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="requestedBy" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested By</FormLabel>
                    <FormControl>
                      <Input placeholder="Name of requester" {...field} data-testid="input-requested-by" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="linkedProject" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Linked Project (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Project name" {...field} data-testid="input-linked-project" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="expectedUsageDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Usage Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-usage-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="reservationExpiry" render={({ field }) => (
                <FormItem>
                  <FormLabel>Reservation Expiry Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-expiry-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="justification" render={({ field }) => (
                <FormItem>
                  <FormLabel>Justification</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe why this allocation is needed..." {...field} data-testid="input-justification" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." {...field} data-testid="input-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="approvalRequired" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-approval" />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Requires Approval</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="reserveSerials" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-reserve-serials" />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Reserve Specific Serials</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="autoSelect" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-auto-select" />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Auto-select Assets (FIFO)</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="notifyResponsible" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-notify" />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Notify Responsible Person</FormLabel>
                  </FormItem>
                )} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-allocation">
                  {(createMutation.isPending || updateMutation.isPending) && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? "Update Allocation" : "Create Allocation"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Allocation Details — {selectedAllocation?.allocationId}</DialogTitle>
          </DialogHeader>
          {selectedAllocation && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className={statusConfig[selectedAllocation.status]?.color || ""}>{statusConfig[selectedAllocation.status]?.label || selectedAllocation.status}</Badge>
                <Badge className={priorityConfig[selectedAllocation.priority]?.color || ""}>{priorityConfig[selectedAllocation.priority]?.label || selectedAllocation.priority}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div><span className="text-muted-foreground">Allocation Type</span><p className="font-medium">{selectedAllocation.allocationType}</p></div>
                  <div><span className="text-muted-foreground">Asset Type</span><p className="font-medium">{selectedAllocation.assetType}</p></div>
                  <div><span className="text-muted-foreground">Quantity</span><p className="font-medium">{selectedAllocation.quantity} (Fulfilled: {selectedAllocation.fulfilledQuantity || 0})</p></div>
                  <div><span className="text-muted-foreground">Source Warehouse</span><p className="font-medium">{selectedAllocation.sourceWarehouse}</p></div>
                  <div><span className="text-muted-foreground">Destination</span><p className="font-medium">{selectedAllocation.destination} ({selectedAllocation.destinationType})</p></div>
                </div>
                <div className="space-y-3">
                  <div><span className="text-muted-foreground">Requested By</span><p className="font-medium">{selectedAllocation.requestedBy}</p></div>
                  <div><span className="text-muted-foreground">Approved By</span><p className="font-medium">{selectedAllocation.approvedBy || "—"}</p></div>
                  <div><span className="text-muted-foreground">Linked Project</span><p className="font-medium">{selectedAllocation.linkedProject || "—"}</p></div>
                  <div><span className="text-muted-foreground">Expected Usage</span><p className="font-medium">{selectedAllocation.expectedUsageDate || "—"}</p></div>
                  <div><span className="text-muted-foreground">Reservation Expiry</span><p className="font-medium">{selectedAllocation.reservationExpiry || "—"}</p></div>
                </div>
              </div>

              {selectedAllocation.justification && (
                <div>
                  <span className="text-sm text-muted-foreground">Justification</span>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{selectedAllocation.justification}</p>
                </div>
              )}

              {selectedAllocation.notes && (
                <div>
                  <span className="text-sm text-muted-foreground">Notes</span>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{selectedAllocation.notes}</p>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm">
                {selectedAllocation.approvalRequired && <Badge variant="outline"><Shield className="h-3 w-3 mr-1" /> Approval Required</Badge>}
                {selectedAllocation.reserveSerials && <Badge variant="outline"><Hash className="h-3 w-3 mr-1" /> Serial Reserved</Badge>}
                {selectedAllocation.autoSelect && <Badge variant="outline"><Zap className="h-3 w-3 mr-1" /> Auto-Select</Badge>}
                {selectedAllocation.notifyResponsible && <Badge variant="outline"><Users className="h-3 w-3 mr-1" /> Notifications</Badge>}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => handleOpenEdit(selectedAllocation)} data-testid="button-edit-from-view">
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                {selectedAllocation.status === "reserved" && (
                  <Button onClick={() => handleStatusChange(selectedAllocation, "allocated")} data-testid="button-allocate-from-view">
                    <CheckCircle className="h-4 w-4 mr-2" /> Allocate
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Allocation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete allocation {selectedAllocation?.allocationId}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAllocation && deleteMutation.mutate(selectedAllocation.id)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AllocationAuditLog({ allocations }: { allocations: AssetAllocation[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(allocations[0]?.id || null);

  const { data: historyItems = [], isLoading } = useQuery<AssetAllocationHistory[]>({
    queryKey: ["/api/asset-allocation-history", selectedId],
    enabled: !!selectedId,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Audit Log</h2>
        {allocations.length > 0 && (
          <Select value={selectedId?.toString() || ""} onValueChange={v => setSelectedId(parseInt(v))}>
            <SelectTrigger className="w-[240px]" data-testid="select-audit-allocation">
              <SelectValue placeholder="Select allocation" />
            </SelectTrigger>
            <SelectContent>
              {allocations.map(a => (
                <SelectItem key={a.id} value={a.id.toString()}>{a.allocationId} — {a.assetType}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : historyItems.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-6">
                {historyItems.map((item, i) => (
                  <div key={item.id} className="relative flex gap-4" data-testid={`row-history-${item.id}`}>
                    <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-background border-2">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">{item.action.replace(/_/g, " ")}</span>
                          {item.previousStatus && item.newStatus && (
                            <span className="text-sm text-muted-foreground">
                              {item.previousStatus} → {item.newStatus}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">{item.actionDate ? new Date(item.actionDate).toLocaleString() : ""}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>By: {item.actionBy}</span>
                        {item.quantityAffected && <span>Qty: {item.quantityAffected}</span>}
                      </div>
                      {item.comments && <p className="text-sm mt-2">{item.comments}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No history entries</p>
            <p className="text-sm mt-1">{selectedId ? "No actions have been recorded for this allocation yet" : "Select an allocation to view its history"}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}