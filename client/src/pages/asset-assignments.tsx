import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, HardDrive, CheckCircle,
  Wrench, AlertTriangle, XCircle, Router, Network, Cable, MapPin,
  Users, Clock, Eye, Shield, X, Wifi, DollarSign, Calendar,
  Tag, Activity, Box, ArrowRightLeft, UserCheck, Monitor, Server,
  RefreshCw, FileText, Ban, RotateCcw, Cpu, Package,
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
import type { Customer, Asset, Employee, AssetAssignment, AssetAssignmentHistory } from "@shared/schema";

const assignmentFormSchema = z.object({
  customerId: z.number().min(1, "Customer is required"),
  serviceId: z.string().optional(),
  assetId: z.number().min(1, "Asset is required"),
  assetType: z.string().min(1, "Asset type is required"),
  serialNumber: z.string().optional(),
  macAddress: z.string().optional(),
  ipAddress: z.string().optional(),
  vlan: z.string().optional(),
  installationDate: z.string().optional(),
  assignedTechnician: z.string().optional(),
  securityDeposit: z.string().optional(),
  ownershipType: z.string().default("rental"),
  deviceCondition: z.string().default("new"),
  autoProvision: z.boolean().default(false),
  sendConfig: z.boolean().default(false),
  notifyCustomer: z.boolean().default(false),
  generateInvoice: z.boolean().default(false),
  notes: z.string().optional(),
});

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  active: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle, label: "Active" },
  pending: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock, label: "Pending Activation" },
  provisioning: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: RefreshCw, label: "Provisioning" },
  suspended: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: Ban, label: "Suspended" },
  returned: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: RotateCcw, label: "Returned" },
  faulty: { color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", icon: AlertTriangle, label: "Faulty" },
};

const assetTypeIcons: Record<string, any> = {
  ONU: Wifi,
  Router: Router,
  CPE: Monitor,
  Switch: Network,
  "Static IP": Server,
  Modem: Cpu,
  default: HardDrive,
};

const timelineActionColors: Record<string, string> = {
  assigned: "bg-emerald-500",
  "ip_allocated": "bg-blue-500",
  suspended: "bg-purple-500",
  returned: "bg-red-500",
  replaced: "bg-amber-500",
  faulty: "bg-gray-500",
  activated: "bg-green-500",
  provisioned: "bg-cyan-500",
};

export default function AssetAssignmentsPage() {
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssetAssignment | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailAssignment, setDetailAssignment] = useState<AssetAssignment | null>(null);
  const [assetSearch, setAssetSearch] = useState("");

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: allAssignments = [], isLoading: assignmentsLoading } = useQuery<AssetAssignment[]>({
    queryKey: ["/api/asset-assignments"],
  });

  const { data: customerAssignments = [] } = useQuery<AssetAssignment[]>({
    queryKey: ["/api/asset-assignments/customer", selectedCustomerId],
    queryFn: () => selectedCustomerId ? apiRequest("GET", `/api/asset-assignments/customer/${selectedCustomerId}`).then(r => r.json()) : Promise.resolve([]),
    enabled: !!selectedCustomerId,
  });

  const { data: customerHistory = [] } = useQuery<AssetAssignmentHistory[]>({
    queryKey: ["/api/asset-assignment-history/customer", selectedCustomerId],
    queryFn: () => selectedCustomerId ? apiRequest("GET", `/api/asset-assignment-history/customer/${selectedCustomerId}`).then(r => r.json()) : Promise.resolve([]),
    enabled: !!selectedCustomerId,
  });

  const selectedCustomer = useMemo(() =>
    customers.find(c => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const assignedAssetIds = useMemo(() =>
    new Set(allAssignments.filter(a => a.status === "active" || a.status === "provisioning" || a.status === "pending").map(a => a.assetId)),
    [allAssignments]
  );

  const availableAssets = useMemo(() =>
    assets.filter(a => (a.status === "available" || a.status === "in_stock") && !assignedAssetIds.has(a.id)),
    [assets, assignedAssetIds]
  );

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 50);
    const s = customerSearch.toLowerCase();
    return customers.filter(c =>
      c.fullName.toLowerCase().includes(s) ||
      c.customerId.toLowerCase().includes(s) ||
      c.phone?.toLowerCase().includes(s) ||
      c.area?.toLowerCase().includes(s)
    ).slice(0, 50);
  }, [customers, customerSearch]);

  const filteredAssignments = useMemo(() => {
    let list = selectedCustomerId ? customerAssignments : allAssignments;
    if (assignmentSearch) {
      const s = assignmentSearch.toLowerCase();
      list = list.filter(a =>
        a.assignmentId.toLowerCase().includes(s) ||
        a.serialNumber?.toLowerCase().includes(s) ||
        a.macAddress?.toLowerCase().includes(s) ||
        a.ipAddress?.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== "all") list = list.filter(a => a.status === statusFilter);
    if (typeFilter !== "all") list = list.filter(a => a.assetType === typeFilter);
    return list;
  }, [selectedCustomerId, customerAssignments, allAssignments, assignmentSearch, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const src = selectedCustomerId ? customerAssignments : allAssignments;
    return {
      total: src.length,
      active: src.filter(a => a.status === "active").length,
      suspended: src.filter(a => a.status === "suspended").length,
      returned: src.filter(a => a.status === "returned").length,
      faulty: src.filter(a => a.status === "faulty").length,
      totalDeposit: src.reduce((sum, a) => sum + parseFloat(a.securityDeposit || "0"), 0),
    };
  }, [selectedCustomerId, customerAssignments, allAssignments]);

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      customerId: 0,
      assetId: 0,
      assetType: "",
      ownershipType: "rental",
      deviceCondition: "new",
      autoProvision: false,
      sendConfig: false,
      notifyCustomer: false,
      generateInvoice: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AssignmentFormValues) => {
      const assignmentId = `ASG-${Date.now().toString(36).toUpperCase()}`;
      const res = await apiRequest("POST", "/api/asset-assignments", {
        ...data,
        assignmentId,
        status: "active",
        depositStatus: parseFloat(data.securityDeposit || "0") > 0 ? "collected" : "none",
      });
      return res.json();
    },
    onSuccess: async (created: AssetAssignment) => {
      await apiRequest("POST", "/api/asset-assignment-history", {
        assignmentId: created.id,
        customerId: created.customerId,
        assetId: created.assetId,
        action: "assigned",
        ipAddress: created.ipAddress,
        technician: created.assignedTechnician,
        reason: "New asset assignment",
        notes: created.notes,
        performedBy: "admin",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/asset-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/asset-assignments/customer", created.customerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/asset-assignment-history/customer", created.customerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({ title: "Asset assigned successfully" });
      setShowAssignForm(false);
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: "Failed to assign asset", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AssignmentFormValues> }) => {
      const res = await apiRequest("PATCH", `/api/asset-assignments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-assignments"] });
      if (selectedCustomerId) queryClient.invalidateQueries({ queryKey: ["/api/asset-assignments/customer", selectedCustomerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({ title: "Assignment updated" });
      setEditingAssignment(null);
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/asset-assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-assignments"] });
      if (selectedCustomerId) queryClient.invalidateQueries({ queryKey: ["/api/asset-assignments/customer", selectedCustomerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({ title: "Assignment deleted" });
      setDeleteId(null);
    },
  });

  const statusActionMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: number; status: string; reason: string }) => {
      const res = await apiRequest("PATCH", `/api/asset-assignments/${id}`, { status });
      const updated = await res.json();
      await apiRequest("POST", "/api/asset-assignment-history", {
        assignmentId: id,
        customerId: updated.customerId,
        assetId: updated.assetId,
        action: status,
        ipAddress: updated.ipAddress,
        technician: updated.assignedTechnician,
        reason,
        performedBy: "admin",
      });
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-assignments"] });
      if (selectedCustomerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/asset-assignments/customer", selectedCustomerId] });
        queryClient.invalidateQueries({ queryKey: ["/api/asset-assignment-history/customer", selectedCustomerId] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({ title: "Status updated" });
    },
  });

  const handleOpenAssignForm = () => {
    form.reset({
      customerId: selectedCustomerId || 0,
      assetId: 0,
      assetType: "",
      ownershipType: "rental",
      deviceCondition: "new",
      autoProvision: false,
      sendConfig: false,
      notifyCustomer: false,
      generateInvoice: false,
      installationDate: new Date().toISOString().split("T")[0],
    });
    setEditingAssignment(null);
    setShowAssignForm(true);
  };

  const handleEditAssignment = (assignment: AssetAssignment) => {
    form.reset({
      customerId: assignment.customerId,
      assetId: assignment.assetId,
      assetType: assignment.assetType,
      serialNumber: assignment.serialNumber || "",
      macAddress: assignment.macAddress || "",
      ipAddress: assignment.ipAddress || "",
      vlan: assignment.vlan || "",
      installationDate: assignment.installationDate || "",
      assignedTechnician: assignment.assignedTechnician || "",
      securityDeposit: assignment.securityDeposit || "0",
      ownershipType: assignment.ownershipType,
      deviceCondition: assignment.deviceCondition,
      autoProvision: assignment.autoProvision,
      sendConfig: assignment.sendConfig,
      notifyCustomer: assignment.notifyCustomer,
      generateInvoice: assignment.generateInvoice,
      notes: assignment.notes || "",
      serviceId: assignment.serviceId || "",
    });
    setEditingAssignment(assignment);
    setShowAssignForm(true);
  };

  const onSubmit = (values: AssignmentFormValues) => {
    if (editingAssignment) {
      updateMutation.mutate({ id: editingAssignment.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleAssetSelect = (assetId: number) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      form.setValue("assetId", asset.id);
      form.setValue("assetType", asset.type || "");
      form.setValue("serialNumber", asset.serialNumber || "");
      form.setValue("macAddress", asset.macAddress || "");
      form.setValue("ipAddress", asset.ipAddress || "");
      form.setValue("vlan", asset.vlan || "");
    }
  };

  const getCustomerName = (customerId: number) => {
    const c = customers.find(c => c.id === customerId);
    return c ? c.fullName : `Customer #${customerId}`;
  };

  const getAssetName = (assetId: number) => {
    const a = assets.find(a => a.id === assetId);
    return a ? `${a.name} (${a.assetTag})` : `Asset #${assetId}`;
  };

  if (customersLoading || assignmentsLoading) {
    return (
      <div className="p-6 space-y-6 page-fade-in">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 page-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-teal-600 bg-clip-text text-transparent" data-testid="text-page-title">
            Asset Assignment to Customer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage device allocation, tracking, and service linkage
          </p>
        </div>
        <Button
          onClick={handleOpenAssignForm}
          className="bg-gradient-to-r from-blue-700 to-teal-600 hover:from-blue-800 hover:to-teal-700 text-white"
          data-testid="button-assign-asset"
        >
          <Plus className="h-4 w-4 mr-2" /> Assign Asset
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 text-white border-0 shadow-lg" data-testid="card-stat-total">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-100">Total Assigned</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <HardDrive className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-green-400 text-white border-0 shadow-lg" data-testid="card-stat-active">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-100">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-600 via-purple-500 to-violet-400 text-white border-0 shadow-lg" data-testid="card-stat-suspended">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-100">Suspended</p>
                <p className="text-2xl font-bold">{stats.suspended}</p>
              </div>
              <Ban className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-600 via-red-500 to-orange-400 text-white border-0 shadow-lg" data-testid="card-stat-returned">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-100">Returned</p>
                <p className="text-2xl font-bold">{stats.returned}</p>
              </div>
              <RotateCcw className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-600 via-gray-500 to-slate-400 text-white border-0 shadow-lg" data-testid="card-stat-faulty">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-200">Faulty</p>
                <p className="text-2xl font-bold">{stats.faulty}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-400 text-white border-0 shadow-lg" data-testid="card-stat-deposit">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-teal-100">Total Deposit</p>
                <p className="text-2xl font-bold">₨{stats.totalDeposit.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-teal-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="border shadow-sm" data-testid="card-customer-panel">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-800 to-teal-700 text-white rounded-t-lg">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" /> Customer Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customer..."
                  className="pl-9 h-9 text-sm"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  data-testid="input-customer-search"
                />
              </div>
              {selectedCustomer && (
                <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950/30 dark:to-teal-950/30 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{selectedCustomer.fullName}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedCustomerId(null)} data-testid="button-clear-customer">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p><span className="font-medium">ID:</span> {selectedCustomer.customerId}</p>
                    <p><span className="font-medium">Phone:</span> {selectedCustomer.phone}</p>
                    <p><span className="font-medium">Area:</span> {selectedCustomer.area || "N/A"}</p>
                    <p><span className="font-medium">Connection:</span> {selectedCustomer.connectionType || "N/A"}</p>
                    <p><span className="font-medium">Status:</span>{" "}
                      <Badge variant="outline" className={`text-[10px] ${selectedCustomer.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                        {selectedCustomer.status}
                      </Badge>
                    </p>
                    <p><span className="font-medium">Devices:</span> {customerAssignments.filter(a => a.status === "active").length}</p>
                  </div>
                </div>
              )}
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.id)}
                      className={`w-full text-left p-2 rounded-md text-sm transition-colors hover:bg-accent ${selectedCustomerId === c.id ? "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800" : ""}`}
                      data-testid={`button-select-customer-${c.id}`}
                    >
                      <div className="font-medium truncate">{c.fullName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{c.customerId}</span>
                        <span>•</span>
                        <span>{c.area || "N/A"}</span>
                        <Badge variant="outline" className={`text-[9px] ml-auto ${c.status === "active" ? "text-emerald-600" : "text-red-600"}`}>{c.status}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card className="border shadow-sm" data-testid="card-assignments-table">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-800 to-teal-700 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  {selectedCustomer ? `Assets for ${selectedCustomer.fullName}` : "All Assigned Assets"}
                </CardTitle>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">{filteredAssignments.length} records</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, serial, MAC, IP..."
                    className="pl-9 h-9 text-sm"
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    data-testid="input-assignment-search"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] h-9 text-sm" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="provisioning">Provisioning</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                    <SelectItem value="faulty">Faulty</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px] h-9 text-sm" data-testid="select-type-filter">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="ONU">ONU</SelectItem>
                    <SelectItem value="Router">Router</SelectItem>
                    <SelectItem value="CPE">CPE</SelectItem>
                    <SelectItem value="Switch">Switch</SelectItem>
                    <SelectItem value="Modem">Modem</SelectItem>
                    <SelectItem value="Static IP">Static IP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white text-xs">
                      <th className="text-left p-3 rounded-tl-lg font-medium">Assignment ID</th>
                      <th className="text-left p-3 font-medium">Asset Type</th>
                      <th className="text-left p-3 font-medium">Serial Number</th>
                      <th className="text-left p-3 font-medium">MAC Address</th>
                      <th className="text-left p-3 font-medium">IP Address</th>
                      <th className="text-left p-3 font-medium">VLAN</th>
                      {!selectedCustomerId && <th className="text-left p-3 font-medium">Customer</th>}
                      <th className="text-left p-3 font-medium">Assigned Date</th>
                      <th className="text-left p-3 font-medium">Technician</th>
                      <th className="text-left p-3 font-medium">Deposit</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-right p-3 rounded-tr-lg font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={selectedCustomerId ? 11 : 12} className="text-center py-12 text-muted-foreground">
                          <HardDrive className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                          <p className="font-medium">No assignments found</p>
                          <p className="text-xs mt-1">
                            {selectedCustomerId ? "This customer has no asset assignments yet." : "No asset assignments have been made yet."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredAssignments.map((a, idx) => {
                        const sc = statusConfig[a.status] || statusConfig.active;
                        const StatusIcon = sc.icon;
                        const TypeIcon = assetTypeIcons[a.assetType] || assetTypeIcons.default;
                        return (
                          <tr key={a.id} className={`border-b border-border/50 hover:bg-accent/50 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/20"}`} data-testid={`row-assignment-${a.id}`}>
                            <td className="p-3 font-mono text-xs font-medium text-blue-600 dark:text-blue-400">{a.assignmentId}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <TypeIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{a.assetType}</span>
                              </div>
                            </td>
                            <td className="p-3 font-mono text-xs">{a.serialNumber || "—"}</td>
                            <td className="p-3 font-mono text-xs">{a.macAddress || "—"}</td>
                            <td className="p-3 font-mono text-xs">{a.ipAddress || "—"}</td>
                            <td className="p-3 font-mono text-xs">{a.vlan || "—"}</td>
                            {!selectedCustomerId && <td className="p-3 text-xs">{getCustomerName(a.customerId)}</td>}
                            <td className="p-3 text-xs">{a.installationDate || "—"}</td>
                            <td className="p-3 text-xs">{a.assignedTechnician || "—"}</td>
                            <td className="p-3 text-xs">
                              {parseFloat(a.securityDeposit || "0") > 0 ? (
                                <span className="font-medium">₨{parseFloat(a.securityDeposit || "0").toLocaleString()}</span>
                              ) : "—"}
                            </td>
                            <td className="p-3">
                              <Badge className={`${sc.color} text-[10px] border-0 gap-1`}>
                                <StatusIcon className="h-3 w-3" />
                                {sc.label}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-actions-${a.id}`}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setDetailAssignment(a)} data-testid={`action-view-${a.id}`}>
                                    <Eye className="h-4 w-4 mr-2" /> View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditAssignment(a)} data-testid={`action-edit-${a.id}`}>
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {a.status === "active" && (
                                    <DropdownMenuItem onClick={() => statusActionMutation.mutate({ id: a.id, status: "suspended", reason: "Manual suspension" })}>
                                      <Ban className="h-4 w-4 mr-2" /> Suspend Device
                                    </DropdownMenuItem>
                                  )}
                                  {a.status === "suspended" && (
                                    <DropdownMenuItem onClick={() => statusActionMutation.mutate({ id: a.id, status: "active", reason: "Reactivated" })}>
                                      <CheckCircle className="h-4 w-4 mr-2" /> Reactivate
                                    </DropdownMenuItem>
                                  )}
                                  {(a.status === "active" || a.status === "suspended") && (
                                    <>
                                      <DropdownMenuItem onClick={() => statusActionMutation.mutate({ id: a.id, status: "faulty", reason: "Marked as faulty" })}>
                                        <AlertTriangle className="h-4 w-4 mr-2" /> Mark Faulty
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => statusActionMutation.mutate({ id: a.id, status: "returned", reason: "Returned to inventory" })}>
                                        <RotateCcw className="h-4 w-4 mr-2" /> Return to Inventory
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(a.id)} data-testid={`action-delete-${a.id}`}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {selectedCustomerId && customerHistory.length > 0 && (
            <Card className="border shadow-sm" data-testid="card-assignment-history">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-800 to-teal-700 text-white rounded-t-lg">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Assignment History Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-4">
                    {customerHistory.map((entry) => {
                      const dotColor = timelineActionColors[entry.action] || "bg-gray-400";
                      return (
                        <div key={entry.id} className="relative pl-10" data-testid={`timeline-entry-${entry.id}`}>
                          <div className={`absolute left-[10px] top-1.5 w-3 h-3 rounded-full ${dotColor} ring-2 ring-white dark:ring-slate-900`} />
                          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm capitalize">{entry.action.replace("_", " ")}</span>
                              <span className="text-xs text-muted-foreground">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}</span>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              {entry.ipAddress && <p><span className="font-medium">IP:</span> <span className="font-mono">{entry.ipAddress}</span></p>}
                              {entry.technician && <p><span className="font-medium">Technician:</span> {entry.technician}</p>}
                              {entry.reason && <p><span className="font-medium">Reason:</span> {entry.reason}</p>}
                              {entry.billingImpact && <p><span className="font-medium">Billing Impact:</span> {entry.billingImpact}</p>}
                              {entry.notes && <p><span className="font-medium">Notes:</span> {entry.notes}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showAssignForm} onOpenChange={setShowAssignForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              {editingAssignment ? "Edit Assignment" : "Assign New Asset to Customer"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 border-b pb-1">Section A — Customer & Service</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer *</FormLabel>
                        <Select
                          value={field.value ? String(field.value) : ""}
                          onValueChange={(v) => field.onChange(parseInt(v))}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-form-customer">
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.fullName} ({c.customerId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Service reference" data-testid="input-service-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 border-b pb-1">Section B — Asset Selection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="assetId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Asset from Inventory *</FormLabel>
                          <div className="space-y-2">
                            <Input
                              placeholder="Search by serial, MAC, name..."
                              value={assetSearch}
                              onChange={(e) => setAssetSearch(e.target.value)}
                              data-testid="input-asset-search"
                            />
                            {field.value > 0 && (
                              <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
                                Selected: <span className="font-semibold">{getAssetName(field.value)}</span>
                                <Button variant="ghost" size="sm" className="h-5 ml-2 text-xs" onClick={() => { field.onChange(0); form.setValue("assetType", ""); form.setValue("serialNumber", ""); form.setValue("macAddress", ""); }}>
                                  Clear
                                </Button>
                              </div>
                            )}
                            <ScrollArea className="h-[120px] border rounded-md">
                              <div className="p-1 space-y-0.5">
                                {availableAssets
                                  .filter(a => {
                                    if (!assetSearch) return true;
                                    const s = assetSearch.toLowerCase();
                                    return a.name.toLowerCase().includes(s) || a.serialNumber?.toLowerCase().includes(s) || a.macAddress?.toLowerCase().includes(s) || a.assetTag.toLowerCase().includes(s);
                                  })
                                  .slice(0, 30)
                                  .map(a => (
                                    <button
                                      key={a.id}
                                      type="button"
                                      className={`w-full text-left p-2 rounded text-xs hover:bg-accent transition-colors ${field.value === a.id ? "bg-blue-50 dark:bg-blue-950/30 border border-blue-200" : ""}`}
                                      onClick={() => handleAssetSelect(a.id)}
                                      data-testid={`button-select-asset-${a.id}`}
                                    >
                                      <span className="font-medium">{a.name}</span> — <span className="font-mono text-muted-foreground">{a.assetTag}</span>
                                      {a.serialNumber && <span className="text-muted-foreground"> | SN: {a.serialNumber}</span>}
                                      {a.type && <Badge variant="outline" className="ml-2 text-[9px]">{a.type}</Badge>}
                                    </button>
                                  ))}
                              </div>
                            </ScrollArea>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="assetType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset Type *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-asset-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ONU">ONU</SelectItem>
                            <SelectItem value="Router">Router</SelectItem>
                            <SelectItem value="CPE">CPE</SelectItem>
                            <SelectItem value="Switch">Switch</SelectItem>
                            <SelectItem value="Modem">Modem</SelectItem>
                            <SelectItem value="Static IP">Static IP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Auto-fetched" className="font-mono text-sm" data-testid="input-serial-number" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="macAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MAC Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Auto-fetched" className="font-mono text-sm" data-testid="input-mac-address" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ipAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IP Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Allocate from IPAM" className="font-mono text-sm" data-testid="input-ip-address" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vlan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VLAN</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="VLAN ID" className="font-mono text-sm" data-testid="input-vlan" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deviceCondition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Device Condition</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-device-condition">
                              <SelectValue placeholder="Condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="used">Used</SelectItem>
                            <SelectItem value="refurbished">Refurbished</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 border-b pb-1">Section C — Installation & Billing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="installationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Installation Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-installation-date" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assignedTechnician"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned Technician</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-technician">
                              <SelectValue placeholder="Select technician" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees.map((e) => (
                              <SelectItem key={e.id} value={e.fullName}>{e.fullName} ({e.empCode})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="securityDeposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Deposit Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} placeholder="0.00" data-testid="input-security-deposit" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ownershipType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ownership Type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-ownership-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="rental">Rental</SelectItem>
                            <SelectItem value="one_time_sale">One-Time Sale</SelectItem>
                            <SelectItem value="lease">Lease</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 border-b pb-1">Section D — Automation & Options</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="autoProvision"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-auto-provision" />
                        </FormControl>
                        <FormLabel className="text-xs font-normal">Auto-Provision</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sendConfig"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-send-config" />
                        </FormControl>
                        <FormLabel className="text-xs font-normal">Send Config</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notifyCustomer"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-notify-customer" />
                        </FormControl>
                        <FormLabel className="text-xs font-normal">Notify Customer</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="generateInvoice"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-generate-invoice" />
                        </FormControl>
                        <FormLabel className="text-xs font-normal">Generate Invoice</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Additional notes..." rows={3} data-testid="textarea-notes" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAssignForm(false)} data-testid="button-cancel-form">Cancel</Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-gradient-to-r from-blue-700 to-teal-600 text-white"
                  data-testid="button-submit-assignment"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  {editingAssignment ? "Update Assignment" : "Assign Asset"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailAssignment} onOpenChange={() => setDetailAssignment(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Assignment Details
            </DialogTitle>
          </DialogHeader>
          {detailAssignment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Assignment ID</p>
                    <p className="font-mono font-medium">{detailAssignment.assignmentId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="font-medium">{getCustomerName(detailAssignment.customerId)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Asset Type</p>
                    <p>{detailAssignment.assetType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Serial Number</p>
                    <p className="font-mono">{detailAssignment.serialNumber || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">MAC Address</p>
                    <p className="font-mono">{detailAssignment.macAddress || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">IP Address</p>
                    <p className="font-mono">{detailAssignment.ipAddress || "—"}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className={`${(statusConfig[detailAssignment.status] || statusConfig.active).color} border-0`}>
                      {(statusConfig[detailAssignment.status] || statusConfig.active).label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">VLAN</p>
                    <p className="font-mono">{detailAssignment.vlan || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Installation Date</p>
                    <p>{detailAssignment.installationDate || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Technician</p>
                    <p>{detailAssignment.assignedTechnician || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Security Deposit</p>
                    <p>₨{parseFloat(detailAssignment.securityDeposit || "0").toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ownership</p>
                    <p className="capitalize">{detailAssignment.ownershipType.replace("_", " ")}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                {detailAssignment.autoProvision && <Badge variant="outline" className="text-[10px]">Auto-Provision</Badge>}
                {detailAssignment.sendConfig && <Badge variant="outline" className="text-[10px]">Config Sent</Badge>}
                {detailAssignment.notifyCustomer && <Badge variant="outline" className="text-[10px]">Customer Notified</Badge>}
                {detailAssignment.generateInvoice && <Badge variant="outline" className="text-[10px]">Invoice Generated</Badge>}
              </div>
              {detailAssignment.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm bg-muted/50 rounded p-2">{detailAssignment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this asset assignment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
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
