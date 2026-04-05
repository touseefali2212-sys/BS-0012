import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Truck,
  Phone,
  Mail,
  Shield,
  Wifi,
  Wallet,
  RefreshCw,
  Package,
  CheckCircle,
  Globe,
  User,
  ArrowUpDown,
  CreditCard,
  Calendar,
  Activity,
  Eye,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  BarChart3,
  TrendingUp,
  Download,
  FileText,
  BookOpen,
  History,
  Clock,
  Zap,
  Building2,
  Printer,
} from "lucide-react";
import { useTab } from "@/hooks/use-tab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertVendorSchema,
  type Vendor,
  type InsertVendor,
  insertVendorPackageSchema,
  type VendorPackage,
  type InsertVendorPackage,
  type VendorWalletTransaction,
  type VendorBandwidthLink,
  type InsertVendorBandwidthLink,
  type BandwidthChangeHistory,
} from "@shared/schema";
import { z } from "zod";

const escHtml = (str: string | number | null | undefined): string => {
  return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

const formatPKR = (value: string | number | null | undefined) => {
  const num = Number(value || 0);
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

const vendorFormSchema = insertVendorSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number is required"),
  serviceType: z.string().min(1, "Service type is required"),
});

const packageFormSchema = insertVendorPackageSchema.extend({
  packageName: z.string().min(2, "Package name is required"),
  vendorPrice: z.string().min(1, "Vendor price is required"),
  ispSellingPrice: z.string().min(1, "ISP selling price is required"),
});

const rechargeSchema = z.object({
  vendorId: z.number().min(1, "Vendor is required"),
  amount: z.string().min(1, "Amount is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  performedBy: z.string().min(1, "Recharge by is required"),
  approvedBy: z.string().optional(),
  notes: z.string().optional(),
  reference: z.string().optional(),
});

const deductSchema = z.object({
  vendorId: z.number().min(1, "Vendor is required"),
  amount: z.string().min(1, "Amount is required"),
  reason: z.string().min(1, "Reason is required"),
  performedBy: z.string().min(1, "Deduct by is required"),
  approvedBy: z.string().optional(),
  notes: z.string().optional(),
  reference: z.string().optional(),
});

const statusColors: Record<string, string> = {
  active: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950",
  inactive: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950",
};

const typeColors: Record<string, string> = {
  bandwidth: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950",
  panel: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950",
};

function VendorTypesTab() {
  const [, changeTab] = useTab("types");
  const { toast } = useToast();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addTypeDialogOpen, setAddTypeDialogOpen] = useState(false);
  const [editingTypeIdx, setEditingTypeIdx] = useState<number | null>(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");
  const [newTypeBillingModel, setNewTypeBillingModel] = useState("fixed");
  const [customTypes, setCustomTypes] = useState<Array<{ name: string; description: string; billingModel: string; createdAt: string }>>(() => {
    try {
      const saved = localStorage.getItem("custom_vendor_types");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const { data: vendors, isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: vendorPackages } = useQuery<VendorPackage[]>({
    queryKey: ["/api/vendor-packages"],
  });

  const handleAddType = () => {
    if (!newTypeName.trim()) {
      toast({ title: "Type name is required", variant: "destructive" });
      return;
    }
    if (editingTypeIdx !== null) {
      const updated = customTypes.map((ct, i) => i === editingTypeIdx ? {
        ...ct,
        name: newTypeName.trim(),
        description: newTypeDescription.trim(),
        billingModel: newTypeBillingModel,
      } : ct);
      setCustomTypes(updated);
      localStorage.setItem("custom_vendor_types", JSON.stringify(updated));
      toast({ title: "Vendor type updated successfully" });
    } else {
      const newType = {
        name: newTypeName.trim(),
        description: newTypeDescription.trim(),
        billingModel: newTypeBillingModel,
        createdAt: new Date().toISOString().split("T")[0],
      };
      const updated = [...customTypes, newType];
      setCustomTypes(updated);
      localStorage.setItem("custom_vendor_types", JSON.stringify(updated));
      toast({ title: "Vendor type added successfully" });
    }
    setAddTypeDialogOpen(false);
    setEditingTypeIdx(null);
    setNewTypeName("");
    setNewTypeDescription("");
    setNewTypeBillingModel("fixed");
  };

  const openEditType = (idx: number) => {
    const ct = customTypes[idx];
    setEditingTypeIdx(idx);
    setNewTypeName(ct.name);
    setNewTypeDescription(ct.description);
    setNewTypeBillingModel(ct.billingModel);
    setAddTypeDialogOpen(true);
  };

  const handleDeleteType = (index: number) => {
    const updated = customTypes.filter((_, i) => i !== index);
    setCustomTypes(updated);
    localStorage.setItem("custom_vendor_types", JSON.stringify(updated));
    toast({ title: "Vendor type removed" });
  };

  const allVendors = vendors || [];
  const allPackages = vendorPackages || [];

  const bandwidthVendors = allVendors.filter(v => v.vendorType === "bandwidth");
  const panelVendors = allVendors.filter(v => v.vendorType === "panel");
  const activeBandwidth = bandwidthVendors.filter(v => v.status === "active").length;
  const activePanel = panelVendors.filter(v => v.status === "active").length;
  const totalBandwidthCost = bandwidthVendors.reduce((s, v) => s + Number(v.bandwidthCost || 0), 0);
  const totalWalletBalance = panelVendors.reduce((s, v) => s + Number(v.walletBalance || 0), 0);
  const bandwidthPackageCount = allPackages.filter(p => {
    const vendor = allVendors.find(v => v.id === p.vendorId);
    return vendor?.vendorType === "bandwidth";
  }).length;
  const panelPackageCount = allPackages.filter(p => {
    const vendor = allVendors.find(v => v.id === p.vendorId);
    return vendor?.vendorType === "panel";
  }).length;

  const filteredVendors = allVendors.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.contactPerson || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.phone || "").includes(search);
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const bandwidthFiltered = filteredVendors.filter(v => v.vendorType === "bandwidth");
  const panelFiltered = filteredVendors.filter(v => v.vendorType === "panel");

  return (
    <div className="space-y-6 page-fade-in" data-testid="tab-content-types">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Vendor Types Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage and monitor bandwidth and panel vendors</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canCreate("vendors") && (
            <Button className="btn-vendor-primary no-default-hover-elevate no-default-active-elevate" onClick={() => { setEditingTypeIdx(null); setNewTypeName(""); setNewTypeDescription(""); setNewTypeBillingModel("fixed"); setAddTypeDialogOpen(true); }} data-testid="button-add-vendor-type">
              <Plus className="h-4 w-4 mr-1" />
              Add New Vendor Type
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => changeTab("packages")} data-testid="button-manage-packages">
            <Package className="h-4 w-4 mr-1" />
            Manage Packages
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="vendor-type-stats">
        <div className="vendor-stat-card stat-blue p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Bandwidth Vendors</p>
              <p className="text-2xl font-bold mt-1">{bandwidthVendors.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{activeBandwidth} Active</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <Wifi className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="vendor-stat-card stat-green p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Panel Vendors</p>
              <p className="text-2xl font-bold mt-1">{panelVendors.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{activePanel} Active</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="vendor-stat-card stat-purple p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Monthly BW Cost</p>
              <p className="text-2xl font-bold mt-1">{formatPKR(totalBandwidthCost)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{bandwidthPackageCount} Packages</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
        </div>
        <div className="vendor-stat-card stat-amber p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Wallet Balance</p>
              <p className="text-2xl font-bold mt-1">{formatPKR(totalWalletBalance)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{panelPackageCount} Packages</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="vendor-filter-bar">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-vendor-types"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]" data-testid="select-vendor-type-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => { setSearch(""); setStatusFilter("all"); }} data-testid="button-reset-type-filters">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      <div className="vendor-section-divider" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950 p-2">
                  <Wifi className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Bandwidth Vendors (CIR-Based)</CardTitle>
                  <CardDescription>Fixed monthly cost, dedicated bandwidth</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="no-default-active-elevate">{bandwidthFiltered.length} Vendor{bandwidthFiltered.length !== 1 ? "s" : ""}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {["Fixed Monthly Cost", "Dedicated Bandwidth", "SLA Guarantee", "No Per-User Billing"].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            {isLoading ? (
              <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : bandwidthFiltered.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <Wifi className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No bandwidth vendors found</p>
                <Button size="sm" variant="ghost" onClick={() => changeTab("add")} className="mt-1 text-blue-600 dark:text-blue-400">Add one now</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {bandwidthFiltered.map(v => (
                  <div key={v.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors" data-testid={`card-bandwidth-vendor-${v.id}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold text-xs shrink-0">
                        {v.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{v.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{v.totalBandwidth || "N/A"}</span>
                          <span>·</span>
                          <span>{formatPKR(v.bandwidthCost)}/mo</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${statusColors[v.status || "active"]}`}>
                        {v.status || "Active"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-bw-vendor-actions-${v.id}`}>
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => changeTab("list")}>
                            <Edit className="h-4 w-4 mr-2" />
                            View / Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => changeTab("packages")}>
                            <Package className="h-4 w-4 mr-2" />
                            View Packages
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-md bg-purple-50 dark:bg-purple-950 p-2">
                  <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Panel Vendors (Recharge-Based)</CardTitle>
                  <CardDescription>Wallet system, pay-per-activation</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="no-default-active-elevate">{panelFiltered.length} Vendor{panelFiltered.length !== 1 ? "s" : ""}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {["Pay-Per-Activation", "Wallet System", "Package Mapping", "Usage-Based Billing"].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            {isLoading ? (
              <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : panelFiltered.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No panel vendors found</p>
                <Button size="sm" variant="ghost" onClick={() => changeTab("add")} className="mt-1 text-purple-600 dark:text-purple-400">Add one now</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {panelFiltered.map(v => (
                  <div key={v.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors" data-testid={`card-panel-vendor-${v.id}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-700 dark:text-purple-300 font-semibold text-xs shrink-0">
                        {v.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{v.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Balance: {formatPKR(v.walletBalance)}</span>
                          {v.panelUrl && (
                            <>
                              <span>·</span>
                              <a href={v.panelUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
                                <Globe className="h-3 w-3" /> Panel
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${statusColors[v.status || "active"]}`}>
                        {v.status || "Active"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-panel-vendor-actions-${v.id}`}>
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => changeTab("list")}>
                            <Edit className="h-4 w-4 mr-2" />
                            View / Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => changeTab("wallet")}>
                            <Wallet className="h-4 w-4 mr-2" />
                            Manage Wallet
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => changeTab("packages")}>
                            <Package className="h-4 w-4 mr-2" />
                            View Packages
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {customTypes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-sm">Custom Vendor Types</CardTitle>
              <Badge variant="secondary" className="no-default-active-elevate">{customTypes.length} Type{customTypes.length !== 1 ? "s" : ""}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {customTypes.map((ct, idx) => (
                <div key={idx} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors" data-testid={`card-custom-type-${idx}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-semibold text-xs shrink-0">
                        {ct.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{ct.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{ct.billingModel} billing</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-custom-type-actions-${idx}`}>
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit("vendors") && (
                          <DropdownMenuItem onClick={() => openEditType(idx)} data-testid={`button-edit-type-${idx}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Type
                          </DropdownMenuItem>
                        )}
                        {canDelete("vendors") && (
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteType(idx)} data-testid={`button-delete-type-${idx}`}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {ct.description && (
                    <p className="text-xs text-muted-foreground mt-2">{ct.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">Added: {ct.createdAt}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Quick Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="vendor-table-enterprise">
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead className="text-center">Bandwidth (CIR)</TableHead>
                  <TableHead className="text-center">Panel (Recharge)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { feature: "Billing Model", bw: "Fixed Monthly", panel: "Pay-Per-Use" },
                  { feature: "Pricing", bw: "Bulk Rate", panel: "Per Activation" },
                  { feature: "Wallet Required", bw: "No", panel: "Yes" },
                  { feature: "SLA Support", bw: "Yes", panel: "Varies" },
                  { feature: "Best For", bw: "Dedicated Lines", panel: "Reseller Models" },
                  { feature: "Active Vendors", bw: String(activeBandwidth), panel: String(activePanel) },
                  { feature: "Total Packages", bw: String(bandwidthPackageCount), panel: String(panelPackageCount) },
                  { feature: "Monthly Cost", bw: formatPKR(totalBandwidthCost), panel: formatPKR(totalWalletBalance) + " (balance)" },
                  { feature: "Payment Type", bw: "Invoice / Bank Transfer", panel: "Wallet Recharge" },
                  { feature: "Contract Based", bw: "Yes", panel: "Optional" },
                ].map(row => (
                  <TableRow key={row.feature}>
                    <TableCell className="font-medium text-sm">{row.feature}</TableCell>
                    <TableCell className="text-center text-sm">{row.bw}</TableCell>
                    <TableCell className="text-center text-sm">{row.panel}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addTypeDialogOpen} onOpenChange={(open) => { setAddTypeDialogOpen(open); if (!open) setEditingTypeIdx(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingTypeIdx !== null ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingTypeIdx !== null ? "Edit Vendor Type" : "Add New Vendor Type"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Type Name</Label>
              <Input
                placeholder="e.g. IPTV Provider, Cloud Service"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                data-testid="input-new-type-name"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Description</Label>
              <Textarea
                placeholder="Describe this vendor type..."
                value={newTypeDescription}
                onChange={(e) => setNewTypeDescription(e.target.value)}
                rows={3}
                data-testid="textarea-new-type-description"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Billing Model</Label>
              <Select value={newTypeBillingModel} onValueChange={setNewTypeBillingModel}>
                <SelectTrigger data-testid="select-new-type-billing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Monthly</SelectItem>
                  <SelectItem value="usage">Usage-Based</SelectItem>
                  <SelectItem value="prepaid">Prepaid / Recharge</SelectItem>
                  <SelectItem value="commission">Commission-Based</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTypeDialogOpen(false)} data-testid="button-cancel-add-type">Cancel</Button>
            <Button onClick={handleAddType} data-testid="button-save-vendor-type">
              {editingTypeIdx !== null ? "Update Type" : "Add Vendor Type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type PanelPackageRow = {
  packageName: string;
  speed: string;
  vendorPrice: string;
  ispSellingPrice: string;
  resellerPrice: string;
  dataLimit: string;
  validity: string;
};

type BandwidthLinkRow = {
  linkName: string;
  ipAddress: string;
  vlanDetail: string;
  city: string;
  bandwidthMbps: string;
  bandwidthRate: string;
  totalMonthlyCost: string;
  notes: string;
};

function AddVendorTab() {
  const { toast } = useToast();
  const [, changeTab] = useTab("list");
  const [panelPackages, setPanelPackages] = useState<PanelPackageRow[]>([]);
  const [showAddPkgRow, setShowAddPkgRow] = useState(false);
  const [newPkg, setNewPkg] = useState<PanelPackageRow>({
    packageName: "", speed: "", vendorPrice: "", ispSellingPrice: "", resellerPrice: "", dataLimit: "", validity: "30 days",
  });
  const [bandwidthLinks, setBandwidthLinks] = useState<BandwidthLinkRow[]>([]);
  const [showAddLinkRow, setShowAddLinkRow] = useState(false);
  const [newLink, setNewLink] = useState<BandwidthLinkRow>({
    linkName: "", ipAddress: "", vlanDetail: "", city: "", bandwidthMbps: "", bandwidthRate: "", totalMonthlyCost: "", notes: "",
  });

  const form = useForm<InsertVendor>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: "",
      vendorType: "bandwidth",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      serviceType: "fiber",
      ntn: "",
      bankAccount: "",
      bankName: "",
      bankAccountTitle: "",
      bankAccountNumber: "",
      bankBranchCode: "",
      slaLevel: "standard",
      totalBandwidth: "",
      usedBandwidth: "",
      bandwidthCost: "0",
      city: "",
      contractStartDate: "",
      contractEndDate: "",
      walletBalance: "0",
      panelUrl: "",
      panelUsername: "",
      status: "active",
    },
  });

  const vendorType = form.watch("vendorType");

  const createMutation = useMutation({
    mutationFn: async (data: InsertVendor) => {
      const res = await apiRequest("POST", "/api/vendors", data);
      return res.json();
    },
    onSuccess: async (vendor: Vendor) => {
      let extraMsg = "";
      if (vendorType === "panel" && panelPackages.length > 0) {
        try {
          await Promise.all(panelPackages.map(pkg =>
            apiRequest("POST", "/api/vendor-packages", {
              vendorId: vendor.id,
              packageName: pkg.packageName,
              speed: pkg.speed,
              vendorPrice: pkg.vendorPrice || "0",
              ispSellingPrice: pkg.ispSellingPrice || "0",
              resellerPrice: pkg.resellerPrice || "0",
              dataLimit: pkg.dataLimit,
              validity: pkg.validity || "30 days",
            })
          ));
          queryClient.invalidateQueries({ queryKey: ["/api/vendor-packages"] });
          extraMsg = ` with ${panelPackages.length} package(s)`;
        } catch {
          toast({ title: "Vendor created but some packages failed", variant: "destructive" });
        }
      }
      if (vendorType === "bandwidth" && bandwidthLinks.length > 0) {
        try {
          await Promise.all(bandwidthLinks.map(link =>
            apiRequest("POST", "/api/vendor-bandwidth-links", {
              vendorId: vendor.id,
              linkName: link.linkName,
              ipAddress: link.ipAddress || null,
              vlanDetail: link.vlanDetail || null,
              city: link.city || null,
              bandwidthMbps: link.bandwidthMbps || "0",
              bandwidthRate: link.bandwidthRate || "0",
              totalMonthlyCost: link.totalMonthlyCost || "0",
              notes: link.notes || null,
            })
          ));
          queryClient.invalidateQueries({ queryKey: ["/api/vendor-bandwidth-links"] });
          extraMsg = ` with ${bandwidthLinks.length} bandwidth link(s)`;
        } catch {
          toast({ title: "Vendor created but some bandwidth links failed", variant: "destructive" });
        }
      }
      toast({ title: `Vendor created successfully${extraMsg}` });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      form.reset();
      setPanelPackages([]);
      setBandwidthLinks([]);
      changeTab("list");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addPackageRow = () => {
    if (!newPkg.packageName.trim()) {
      toast({ title: "Package name is required", variant: "destructive" });
      return;
    }
    if (!newPkg.vendorPrice || !newPkg.ispSellingPrice) {
      toast({ title: "Vendor price and ISP price are required", variant: "destructive" });
      return;
    }
    setPanelPackages([...panelPackages, { ...newPkg }]);
    setNewPkg({ packageName: "", speed: "", vendorPrice: "", ispSellingPrice: "", resellerPrice: "", dataLimit: "", validity: "30 days" });
    setShowAddPkgRow(false);
  };

  const removePackageRow = (index: number) => {
    setPanelPackages(panelPackages.filter((_, i) => i !== index));
  };

  const addLinkRow = () => {
    if (!newLink.linkName.trim()) {
      toast({ title: "Link name is required", variant: "destructive" });
      return;
    }
    if (!newLink.bandwidthMbps || !newLink.bandwidthRate) {
      toast({ title: "Bandwidth Mbps and Rate are required", variant: "destructive" });
      return;
    }
    const totalCost = (Number(newLink.bandwidthMbps) * Number(newLink.bandwidthRate)).toFixed(2);
    setBandwidthLinks([...bandwidthLinks, { ...newLink, totalMonthlyCost: totalCost }]);
    setNewLink({ linkName: "", ipAddress: "", vlanDetail: "", city: "", bandwidthMbps: "", bandwidthRate: "", totalMonthlyCost: "", notes: "" });
    setShowAddLinkRow(false);
  };

  const removeLinkRow = (index: number) => {
    setBandwidthLinks(bandwidthLinks.filter((_, i) => i !== index));
  };

  return (
    <div className="page-fade-in" data-testid="tab-content-add">
      <Card>
        <CardHeader>
          <CardTitle>Add New Vendor</CardTitle>
          <CardDescription>Fill in the details below to register a new vendor</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter vendor name" data-testid="input-vendor-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vendorType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "bandwidth"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-vendor-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bandwidth">Bandwidth (CIR-Based)</SelectItem>
                          <SelectItem value="panel">Panel (Recharge-Based)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact person name" data-testid="input-vendor-contact-person" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="03XX-XXXXXXX" data-testid="input-vendor-phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@example.com" data-testid="input-vendor-email" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "fiber"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-vendor-service-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fiber">Fiber</SelectItem>
                          <SelectItem value="wireless">Wireless</SelectItem>
                          <SelectItem value="cable">Cable</SelectItem>
                          <SelectItem value="satellite">Satellite</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Full address" data-testid="input-vendor-address" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {vendorType === "bandwidth" && (
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Lahore, Karachi, Islamabad" data-testid="input-vendor-city" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="ntn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NTN</FormLabel>
                      <FormControl>
                        <Input placeholder="Tax registration number" data-testid="input-vendor-ntn" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. HBL, MCB, UBL" data-testid="input-vendor-bank-name" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankAccountTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Account holder name" data-testid="input-vendor-bank-title" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number / IBAN</FormLabel>
                      <FormControl>
                        <Input placeholder="Account number or IBAN" data-testid="input-vendor-bank-number" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankBranchCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Branch code" data-testid="input-vendor-branch-code" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slaLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SLA Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "standard"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-vendor-sla-level">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contractStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" data-testid="input-vendor-contract-start" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contractEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract End Date</FormLabel>
                      <FormControl>
                        <Input type="date" data-testid="input-vendor-contract-end" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {vendorType === "bandwidth" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="totalBandwidth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Bandwidth</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 100 Mbps" data-testid="input-vendor-total-bandwidth" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="usedBandwidth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Used Bandwidth</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 60 Mbps" data-testid="input-vendor-used-bandwidth" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bandwidthCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Bandwidth Cost (Monthly)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" data-testid="input-vendor-bandwidth-cost" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="text-sm font-semibold flex items-center gap-1.5">
                          <Wifi className="h-4 w-4" />
                          Bandwidth Links & IP/VLAN Details
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Add multiple bandwidth links with IP addresses and VLAN details</p>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => setShowAddLinkRow(true)} data-testid="button-add-bw-link">
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Link
                      </Button>
                    </div>

                    {bandwidthLinks.length > 0 && (
                      <Card>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">Link Name</TableHead>
                                  <TableHead className="text-xs">IP Address</TableHead>
                                  <TableHead className="text-xs">VLAN</TableHead>
                                  <TableHead className="text-xs">City</TableHead>
                                  <TableHead className="text-xs">Mbps</TableHead>
                                  <TableHead className="text-xs">Rate/Mbps</TableHead>
                                  <TableHead className="text-xs">Monthly Cost</TableHead>
                                  <TableHead className="w-10"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {bandwidthLinks.map((link, idx) => (
                                  <TableRow key={idx} data-testid={`row-bw-link-${idx}`}>
                                    <TableCell className="text-sm font-medium">{link.linkName}</TableCell>
                                    <TableCell className="text-sm font-mono">{link.ipAddress || "N/A"}</TableCell>
                                    <TableCell className="text-sm">{link.vlanDetail || "N/A"}</TableCell>
                                    <TableCell className="text-sm">{link.city || "N/A"}</TableCell>
                                    <TableCell className="text-sm">{link.bandwidthMbps}</TableCell>
                                    <TableCell className="text-sm">{formatPKR(link.bandwidthRate)}</TableCell>
                                    <TableCell className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatPKR(link.totalMonthlyCost)}</TableCell>
                                    <TableCell>
                                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeLinkRow(idx)} data-testid={`button-remove-link-${idx}`}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {bandwidthLinks.length > 1 && (
                                  <TableRow className="font-bold bg-muted/50">
                                    <TableCell colSpan={4} className="text-xs font-bold">TOTALS</TableCell>
                                    <TableCell className="text-xs font-bold">{bandwidthLinks.reduce((s, l) => s + Number(l.bandwidthMbps || 0), 0)} Mbps</TableCell>
                                    <TableCell></TableCell>
                                    <TableCell className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                      {formatPKR(bandwidthLinks.reduce((s, l) => s + Number(l.totalMonthlyCost || 0), 0))}
                                    </TableCell>
                                    <TableCell></TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {showAddLinkRow && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">New Bandwidth Link</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs font-medium">Link Name *</Label>
                              <Input
                                placeholder="e.g. Link-1 Fiber"
                                value={newLink.linkName}
                                onChange={(e) => setNewLink({ ...newLink, linkName: e.target.value })}
                                data-testid="input-new-link-name"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium">IP Address</Label>
                              <Input
                                placeholder="e.g. 192.168.1.1/30"
                                value={newLink.ipAddress}
                                onChange={(e) => setNewLink({ ...newLink, ipAddress: e.target.value })}
                                data-testid="input-new-link-ip"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium">VLAN Detail</Label>
                              <Input
                                placeholder="e.g. VLAN 100"
                                value={newLink.vlanDetail}
                                onChange={(e) => setNewLink({ ...newLink, vlanDetail: e.target.value })}
                                data-testid="input-new-link-vlan"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <Label className="text-xs font-medium">City</Label>
                              <Input
                                placeholder="e.g. Lahore"
                                value={newLink.city}
                                onChange={(e) => setNewLink({ ...newLink, city: e.target.value })}
                                data-testid="input-new-link-city"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Bandwidth (Mbps) *</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={newLink.bandwidthMbps}
                                onChange={(e) => {
                                  const mbps = e.target.value;
                                  const cost = (Number(mbps) * Number(newLink.bandwidthRate || 0)).toFixed(2);
                                  setNewLink({ ...newLink, bandwidthMbps: mbps, totalMonthlyCost: cost });
                                }}
                                data-testid="input-new-link-mbps"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Rate per Mbps (PKR) *</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={newLink.bandwidthRate}
                                onChange={(e) => {
                                  const rate = e.target.value;
                                  const cost = (Number(newLink.bandwidthMbps || 0) * Number(rate)).toFixed(2);
                                  setNewLink({ ...newLink, bandwidthRate: rate, totalMonthlyCost: cost });
                                }}
                                data-testid="input-new-link-rate"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Total Monthly Cost (PKR)</Label>
                              <Input
                                type="number"
                                placeholder="Auto-calculated"
                                value={newLink.totalMonthlyCost}
                                readOnly
                                className="bg-muted/50 font-semibold"
                                data-testid="input-new-link-total-cost"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium">Notes</Label>
                            <Input
                              placeholder="Optional notes about this link"
                              value={newLink.notes}
                              onChange={(e) => setNewLink({ ...newLink, notes: e.target.value })}
                              data-testid="input-new-link-notes"
                            />
                          </div>
                          {newLink.bandwidthMbps && newLink.bandwidthRate && (
                            <div className="text-xs text-muted-foreground">
                              Total Cost: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatPKR(Number(newLink.bandwidthMbps) * Number(newLink.bandwidthRate))} / month</span>
                              {" "}({newLink.bandwidthMbps} Mbps × {formatPKR(newLink.bandwidthRate)}/Mbps)
                            </div>
                          )}
                          <div className="flex items-center gap-2 justify-end">
                            <Button type="button" size="sm" variant="outline" onClick={() => { setShowAddLinkRow(false); setNewLink({ linkName: "", ipAddress: "", vlanDetail: "", city: "", bandwidthMbps: "", bandwidthRate: "", totalMonthlyCost: "", notes: "" }); }} data-testid="button-cancel-new-link">
                              Cancel
                            </Button>
                            <Button type="button" size="sm" onClick={addLinkRow} data-testid="button-save-new-link">
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Add Link
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {bandwidthLinks.length === 0 && !showAddLinkRow && (
                      <div className="text-center py-4 border rounded-lg text-muted-foreground text-sm">
                        <Wifi className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
                        <p className="text-xs">No bandwidth links added yet. Click "Add Link" to add IP/VLAN details.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {vendorType === "panel" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="panelUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Panel URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://panel.vendor.com" data-testid="input-vendor-panel-url" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="panelUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Panel Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Username" data-testid="input-vendor-panel-username" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="walletBalance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wallet Balance</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" data-testid="input-vendor-wallet-balance" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="text-sm font-semibold flex items-center gap-1.5">
                          <Package className="h-4 w-4" />
                          Vendor Packages
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Add packages that this panel vendor offers</p>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => setShowAddPkgRow(true)} data-testid="button-add-panel-package">
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Package
                      </Button>
                    </div>

                    {panelPackages.length > 0 && (
                      <Card>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">Package Name</TableHead>
                                  <TableHead className="text-xs">Speed</TableHead>
                                  <TableHead className="text-xs">Vendor Price</TableHead>
                                  <TableHead className="text-xs">ISP Price</TableHead>
                                  <TableHead className="text-xs">Reseller Price</TableHead>
                                  <TableHead className="text-xs">Data Limit</TableHead>
                                  <TableHead className="text-xs">Validity</TableHead>
                                  <TableHead className="text-xs">Margin</TableHead>
                                  <TableHead className="w-10"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {panelPackages.map((pkg, idx) => (
                                  <TableRow key={idx} data-testid={`row-new-pkg-${idx}`}>
                                    <TableCell className="text-sm font-medium">{pkg.packageName}</TableCell>
                                    <TableCell className="text-sm">{pkg.speed || "N/A"}</TableCell>
                                    <TableCell className="text-sm">{formatPKR(pkg.vendorPrice)}</TableCell>
                                    <TableCell className="text-sm">{formatPKR(pkg.ispSellingPrice)}</TableCell>
                                    <TableCell className="text-sm">{formatPKR(pkg.resellerPrice || 0)}</TableCell>
                                    <TableCell className="text-sm">{pkg.dataLimit || "Unlimited"}</TableCell>
                                    <TableCell className="text-sm">{pkg.validity}</TableCell>
                                    <TableCell className="text-sm text-green-600 dark:text-green-400 font-medium">
                                      {formatPKR(Number(pkg.ispSellingPrice || 0) - Number(pkg.vendorPrice || 0))}
                                    </TableCell>
                                    <TableCell>
                                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removePackageRow(idx)} data-testid={`button-remove-pkg-${idx}`}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {showAddPkgRow && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">New Package</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs font-medium">Package Name *</Label>
                              <Input
                                placeholder="e.g. 10 Mbps Unlimited"
                                value={newPkg.packageName}
                                onChange={(e) => setNewPkg({ ...newPkg, packageName: e.target.value })}
                                data-testid="input-new-pkg-name"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Speed</Label>
                              <Input
                                placeholder="e.g. 10 Mbps"
                                value={newPkg.speed}
                                onChange={(e) => setNewPkg({ ...newPkg, speed: e.target.value })}
                                data-testid="input-new-pkg-speed"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Data Limit</Label>
                              <Input
                                placeholder="Unlimited"
                                value={newPkg.dataLimit}
                                onChange={(e) => setNewPkg({ ...newPkg, dataLimit: e.target.value })}
                                data-testid="input-new-pkg-data-limit"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <Label className="text-xs font-medium">Vendor Price (PKR) *</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={newPkg.vendorPrice}
                                onChange={(e) => setNewPkg({ ...newPkg, vendorPrice: e.target.value })}
                                data-testid="input-new-pkg-vendor-price"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium">ISP Selling Price (PKR) *</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={newPkg.ispSellingPrice}
                                onChange={(e) => setNewPkg({ ...newPkg, ispSellingPrice: e.target.value })}
                                data-testid="input-new-pkg-isp-price"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Reseller Price (PKR)</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={newPkg.resellerPrice}
                                onChange={(e) => setNewPkg({ ...newPkg, resellerPrice: e.target.value })}
                                data-testid="input-new-pkg-reseller-price"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium">Validity</Label>
                              <Input
                                placeholder="30 days"
                                value={newPkg.validity}
                                onChange={(e) => setNewPkg({ ...newPkg, validity: e.target.value })}
                                data-testid="input-new-pkg-validity"
                              />
                            </div>
                          </div>
                          {newPkg.vendorPrice && newPkg.ispSellingPrice && (
                            <div className="text-xs text-muted-foreground">
                              ISP Margin: <span className="font-semibold text-green-600 dark:text-green-400">{formatPKR(Number(newPkg.ispSellingPrice) - Number(newPkg.vendorPrice))}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 justify-end">
                            <Button type="button" size="sm" variant="outline" onClick={() => { setShowAddPkgRow(false); setNewPkg({ packageName: "", speed: "", vendorPrice: "", ispSellingPrice: "", resellerPrice: "", dataLimit: "", validity: "30 days" }); }} data-testid="button-cancel-new-pkg">
                              Cancel
                            </Button>
                            <Button type="button" size="sm" onClick={addPackageRow} data-testid="button-save-new-pkg">
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              Add Package
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {panelPackages.length === 0 && !showAddPkgRow && (
                      <div className="text-center py-4 border rounded-lg text-muted-foreground text-sm">
                        <Package className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
                        <p className="text-xs">No packages added yet. Click "Add Package" to create one.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "active"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-vendor-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end gap-3 flex-wrap">
                <Button type="button" variant="secondary" onClick={() => changeTab("list")} data-testid="button-cancel-vendor">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="btn-vendor-primary no-default-hover-elevate no-default-active-elevate" data-testid="button-save-vendor">
                  {createMutation.isPending ? "Creating..." : "Create Vendor"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function VendorListTab() {
  const { toast } = useToast();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [, changeTab] = useTab("list");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [profileVendor, setProfileVendor] = useState<Vendor | null>(null);
  const [walletVendor, setWalletVendor] = useState<Vendor | null>(null);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editBwLinkDialogOpen, setEditBwLinkDialogOpen] = useState(false);
  const [editBwLinkTarget, setEditBwLinkTarget] = useState<number | null>(null);
  const [editBwLinkItem, setEditBwLinkItem] = useState<VendorBandwidthLink | null>(null);

  const { data: vendors, isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: vendorPackages } = useQuery<VendorPackage[]>({
    queryKey: ["/api/vendor-packages"],
  });

  const { data: allBwLinks } = useQuery<VendorBandwidthLink[]>({
    queryKey: ["/api/vendor-bandwidth-links"],
  });

  const getVendorBwLinks = (vendorId: number) => (allBwLinks || []).filter(l => l.vendorId === vendorId);

  const { data: walletTransactions } = useQuery<VendorWalletTransaction[]>({
    queryKey: ["/api/vendor-wallet-transactions", walletVendor?.id],
    enabled: !!walletVendor,
    queryFn: async () => {
      if (!walletVendor) return [];
      const res = await fetch(`/api/vendor-wallet-transactions/${walletVendor.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const getVendorPackages = (vendorId: number) => (vendorPackages || []).filter(p => p.vendorId === vendorId);
  const getVendorTotalPayments = (vendorId: number) => {
    return getVendorPackages(vendorId).reduce((sum, p) => sum + Number(p.vendorPrice || 0), 0);
  };

  const editBwLinkForm = useForm<InsertVendorBandwidthLink>({
    defaultValues: { vendorId: 0, linkName: "", ipAddress: "", vlanDetail: "", city: "", bandwidthMbps: "0", bandwidthRate: "0", totalMonthlyCost: "0", notes: "" },
  });

  const editCreateBwLink = useMutation({
    mutationFn: async (data: InsertVendorBandwidthLink) => {
      const res = await apiRequest("POST", "/api/vendor-bandwidth-links", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-bandwidth-links"] });
      toast({ title: "Bandwidth link created" });
      setEditBwLinkDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const editUpdateBwLink = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertVendorBandwidthLink> }) => {
      const res = await apiRequest("PATCH", `/api/vendor-bandwidth-links/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-bandwidth-links"] });
      toast({ title: "Bandwidth link updated" });
      setEditBwLinkDialogOpen(false);
      setEditBwLinkItem(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const editDeleteBwLink = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/vendor-bandwidth-links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-bandwidth-links"] });
      toast({ title: "Bandwidth link deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const exportVendorsCSV = () => {
    const allV = filtered;
    const headers = ["Name", "Type", "Contact Person", "Phone", "Email", "Service Type", "Status", "SLA Level", "City", "Bandwidth Cost", "Wallet Balance", "Contract Start", "Contract End"];
    const rows = allV.map(v => [
      v.name, v.vendorType, v.contactPerson || "", v.phone, v.email || "", v.serviceType, v.status, v.slaLevel || "",
      v.city || "", v.bandwidthCost || "0", v.walletBalance || "0", v.contractStartDate || "", v.contractEndDate || ""
    ]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendors_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateVendorsPDF = () => {
    if (filtered.length === 0) return;
    const rows = filtered.map(v => `
      <tr>
        <td>${escHtml(v.name)}</td>
        <td><span class="badge ${v.vendorType === "bandwidth" ? "badge-blue" : "badge-purple"}">${v.vendorType === "bandwidth" ? "Bandwidth" : "Panel"}</span></td>
        <td>${escHtml(v.contactPerson || "—")}</td>
        <td>${escHtml(v.phone)}</td>
        <td>${escHtml(v.email || "—")}</td>
        <td class="capitalize">${escHtml(v.serviceType)}</td>
        <td><span class="badge ${v.status === "active" ? "badge-green" : "badge-red"}">${escHtml(v.status)}</span></td>
        <td class="capitalize">${escHtml(v.slaLevel || "Standard")}</td>
        <td>${v.vendorType === "bandwidth" ? formatPKR(v.bandwidthCost) : formatPKR(v.walletBalance)}</td>
        <td>${escHtml(v.contractEndDate || "—")}</td>
      </tr>`).join("");
    const html = `<!DOCTYPE html><html><head><title>Vendor List Report</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 20px; }
      h1 { font-size: 16px; margin-bottom: 2px; }
      .meta { font-size: 11px; color: #555; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #1e293b; color: #fff; padding: 7px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
      td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
      tr:nth-child(even) td { background: #f8fafc; }
      .capitalize { text-transform: capitalize; }
      .badge { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
      .badge-blue { background: #dbeafe; color: #1d4ed8; }
      .badge-purple { background: #f3e8ff; color: #7c3aed; }
      .badge-green { background: #dcfce7; color: #15803d; }
      .badge-red { background: #fef2f2; color: #dc2626; }
      .footer { margin-top: 16px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
      @media print { body { padding: 10mm; } }
    </style></head><body>
    <h1>Vendor List Report</h1>
    <p class="meta">
      <strong>Total:</strong> ${filtered.length} vendors &nbsp;&nbsp;
      <strong>Active:</strong> ${filtered.filter(v => v.status === "active").length} &nbsp;&nbsp;
      <strong>Bandwidth:</strong> ${filtered.filter(v => v.vendorType === "bandwidth").length} &nbsp;&nbsp;
      <strong>Panel:</strong> ${filtered.filter(v => v.vendorType === "panel").length} &nbsp;&nbsp;
      <strong>Generated:</strong> ${new Date().toLocaleString()}
    </p>
    <table>
      <thead><tr>
        <th>Name</th><th>Type</th><th>Contact</th><th>Phone</th><th>Email</th>
        <th>Service</th><th>Status</th><th>SLA</th><th>Cost/Balance</th><th>Contract End</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="footer">NetSphere Enterprise — Vendor List Report</p>
    </body></html>`;
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const form = useForm<InsertVendor>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: "",
      vendorType: "bandwidth",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      serviceType: "fiber",
      ntn: "",
      bankAccount: "",
      bankName: "",
      bankAccountTitle: "",
      bankAccountNumber: "",
      bankBranchCode: "",
      slaLevel: "standard",
      totalBandwidth: "",
      usedBandwidth: "",
      bandwidthCost: "0",
      contractStartDate: "",
      contractEndDate: "",
      walletBalance: "0",
      panelUrl: "",
      panelUsername: "",
      status: "active",
    },
  });

  const vendorType = form.watch("vendorType");

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertVendor> }) => {
      const res = await apiRequest("PATCH", `/api/vendors/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDialogOpen(false);
      setEditingVendor(null);
      form.reset();
      toast({ title: "Vendor updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/vendors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Vendor deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    form.reset({
      name: vendor.name,
      vendorType: vendor.vendorType || "bandwidth",
      contactPerson: vendor.contactPerson || "",
      phone: vendor.phone,
      email: vendor.email || "",
      address: vendor.address || "",
      city: vendor.city || "",
      serviceType: vendor.serviceType,
      ntn: vendor.ntn || "",
      bankAccount: vendor.bankAccount || "",
      bankName: vendor.bankName || "",
      bankAccountTitle: vendor.bankAccountTitle || "",
      bankAccountNumber: vendor.bankAccountNumber || "",
      bankBranchCode: vendor.bankBranchCode || "",
      slaLevel: vendor.slaLevel || "standard",
      totalBandwidth: vendor.totalBandwidth || "",
      usedBandwidth: vendor.usedBandwidth || "",
      bandwidthCost: vendor.bandwidthCost || "0",
      contractStartDate: vendor.contractStartDate || "",
      contractEndDate: vendor.contractEndDate || "",
      walletBalance: vendor.walletBalance || "0",
      panelUrl: vendor.panelUrl || "",
      panelUsername: vendor.panelUsername || "",
      status: vendor.status,
    });
    setDialogOpen(true);
  };

  const filtered = (vendors || []).filter((v) => {
    const matchSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.phone.includes(search) ||
      (v.contactPerson || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.email || "").toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || v.vendorType === typeFilter;
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  }).sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "name") return a.name.localeCompare(b.name) * dir;
    if (sortField === "type") return (a.vendorType || "").localeCompare(b.vendorType || "") * dir;
    if (sortField === "status") return a.status.localeCompare(b.status) * dir;
    if (sortField === "cost") {
      const aCost = a.vendorType === "bandwidth" ? Number(a.bandwidthCost || 0) : Number(a.walletBalance || 0);
      const bCost = b.vendorType === "bandwidth" ? Number(b.bandwidthCost || 0) : Number(b.walletBalance || 0);
      return (aCost - bCost) * dir;
    }
    return 0;
  });

  return (
    <div className="space-y-4 page-fade-in" data-testid="tab-content-list">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="vendor-stat-card stat-blue p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Vendors</p>
              <p className="text-2xl font-bold mt-1">{(vendors || []).length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="vendor-stat-card stat-green p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Active</p>
              <p className="text-2xl font-bold mt-1">{(vendors || []).filter(v => v.status === "active").length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="vendor-stat-card stat-purple p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Monthly Cost</p>
              <p className="text-2xl font-bold mt-1">{formatPKR((vendors || []).filter(v => v.vendorType === "bandwidth").reduce((s, v) => s + Number(v.bandwidthCost || 0), 0))}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="vendor-stat-card stat-amber p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Expiring Contracts</p>
              <p className="text-2xl font-bold mt-1">{(vendors || []).filter(v => {
                if (!v.contractEndDate) return false;
                const end = new Date(v.contractEndDate);
                const now = new Date();
                const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                return diff >= 0 && diff <= 30;
              }).length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Next 30 days</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>
      <div className="vendor-filter-bar">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-vendors"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-type-filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bandwidth">Bandwidth</SelectItem>
                <SelectItem value="panel">Panel</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortField} onValueChange={(v) => { setSortField(v); setSortDir("asc"); }}>
              <SelectTrigger className="w-[140px]" data-testid="select-sort-field">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="cost">Cost/Balance</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")} data-testid="button-toggle-sort">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
              {sortDir === "asc" ? "A\u2192Z" : "Z\u2192A"}
            </Button>
            <Button size="sm" variant="outline" onClick={exportVendorsCSV} data-testid="button-export-vendors-csv">
              <Download className="h-3.5 w-3.5 mr-1" />
              Export CSV
            </Button>
            <Button size="sm" variant="outline" onClick={generateVendorsPDF} data-testid="button-generate-vendors-pdf">
              <FileText className="h-3.5 w-3.5 mr-1" />
              Generate PDF
            </Button>
            {canCreate("vendors") && (
              <Button size="sm" className="btn-vendor-primary no-default-hover-elevate no-default-active-elevate" onClick={() => changeTab("add")} data-testid="button-add-new-vendor">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add New Vendor
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span>Showing {filtered.length} of {(vendors || []).length} vendors</span>
        {(search || typeFilter !== "all" || statusFilter !== "all") && (
          <Button size="sm" variant="ghost" onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }} data-testid="button-clear-filters">
            Clear Filters
          </Button>
        )}
      </div>
      {(() => {
        const expiring = (vendors || []).filter(v => {
          if (!v.contractEndDate) return false;
          const end = new Date(v.contractEndDate);
          const now = new Date();
          const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return diff >= 0 && diff <= 60;
        });
        if (expiring.length === 0) return null;
        return (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30">
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Contract Expiry Alerts</p>
                  <div className="mt-2 space-y-1.5">
                    {expiring.map(v => {
                      const end = new Date(v.contractEndDate!);
                      const now = new Date();
                      const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={v.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium">{v.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Expires: {v.contractEndDate}</span>
                            <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${daysLeft <= 7 ? "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950" : daysLeft <= 30 ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950" : "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950"}`}>
                              {daysLeft} days left
                            </Badge>
                            <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => openEdit(v)} data-testid={`button-renew-contract-${v.id}`}>
                              <Edit className="h-3 w-3 mr-1" />
                              Renew
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Truck className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No vendors found</p>
              <p className="text-sm mt-1">Add your first vendor to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="vendor-table-enterprise">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Payment / Cost</TableHead>
                    <TableHead className="hidden md:table-cell">Bandwidth / Wallet</TableHead>
                    <TableHead className="hidden lg:table-cell">Packages</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden xl:table-cell">Contract</TableHead>
                    <TableHead className="hidden xl:table-cell">SLA</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((vendor) => {
                    const pkgs = getVendorPackages(vendor.id);
                    return (
                    <TableRow key={vendor.id} data-testid={`row-vendor-${vendor.id}`}>
                      <TableCell>
                        <div className="font-medium">{vendor.name}</div>
                        {vendor.contactPerson && (
                          <div className="text-xs text-muted-foreground">{vendor.contactPerson}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${typeColors[vendor.vendorType || "bandwidth"] || ""}`}>
                          {vendor.vendorType === "panel" ? "Panel" : "Bandwidth"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {vendor.phone}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {vendor.vendorType === "bandwidth" ? (
                          <div>
                            <span className="text-xs font-medium">{formatPKR(vendor.bandwidthCost)}</span>
                            <span className="text-[10px] text-muted-foreground block">/month fixed</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs font-medium">{formatPKR(getVendorTotalPayments(vendor.id))}</span>
                            <span className="text-[10px] text-muted-foreground block">total pkg cost</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {vendor.vendorType === "bandwidth" ? (
                          <div>
                            <span className="text-xs font-medium">{vendor.usedBandwidth || "0"} / {vendor.totalBandwidth || "0"}</span>
                            <span className="text-[10px] text-muted-foreground block">used / total</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs font-medium">{formatPKR(vendor.walletBalance)}</span>
                            <span className="text-[10px] text-muted-foreground block">wallet balance</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="no-default-active-elevate text-[10px]">
                            <Package className="h-3 w-3 mr-0.5" />
                            {pkgs.length}
                          </Badge>
                          {pkgs.length > 0 && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[80px]" title={pkgs.map(p => p.packageName).join(", ")}>
                              {pkgs[0].packageName}{pkgs.length > 1 ? ` +${pkgs.length - 1}` : ""}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`no-default-active-elevate text-[10px] capitalize ${statusColors[vendor.status] || ""}`}
                        >
                          {vendor.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {vendor.contractEndDate ? (
                          <div className="text-xs">
                            <span className="text-muted-foreground">{vendor.contractEndDate}</span>
                            {(() => {
                              const end = new Date(vendor.contractEndDate);
                              const now = new Date();
                              const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                              if (diff < 0) return <span className="block text-red-500 font-medium">Expired</span>;
                              if (diff <= 30) return <span className="block text-amber-500 font-medium">{diff}d left</span>;
                              return null;
                            })()}
                          </div>
                        ) : <span className="text-xs text-muted-foreground">N/A</span>}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${
                          vendor.slaLevel === "enterprise" ? "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950" :
                          vendor.slaLevel === "premium" ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950" :
                          "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-950"
                        }`}>
                          {vendor.slaLevel || "Standard"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${vendor.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setProfileVendor(vendor)} data-testid={`button-view-profile-${vendor.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            {canEdit("vendors") && (
                              <DropdownMenuItem onClick={() => openEdit(vendor)} data-testid={`button-edit-${vendor.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Profile
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setWalletVendor(vendor)} data-testid={`button-wallet-${vendor.id}`}>
                              <Wallet className="h-4 w-4 mr-2" />
                              Wallet & Transactions
                            </DropdownMenuItem>
                            {canDelete("vendors") && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete vendor "${vendor.name}"?`)) {
                                    deleteMutation.mutate(vendor.id);
                                  }
                                }}
                                data-testid={`button-delete-${vendor.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => {
              if (editingVendor) {
                updateMutation.mutate({ id: editingVendor.id, data });
              }
            })} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input data-testid="input-edit-vendor-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vendorType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "bandwidth"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-vendor-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bandwidth">Bandwidth</SelectItem>
                          <SelectItem value="panel">Panel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input data-testid="input-edit-contact-person" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input data-testid="input-edit-vendor-phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input data-testid="input-edit-vendor-email" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "fiber"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-service-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fiber">Fiber</SelectItem>
                          <SelectItem value="wireless">Wireless</SelectItem>
                          <SelectItem value="cable">Cable</SelectItem>
                          <SelectItem value="satellite">Satellite</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea data-testid="input-edit-vendor-address" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Lahore" data-testid="input-edit-vendor-city" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="ntn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NTN</FormLabel>
                      <FormControl>
                        <Input data-testid="input-edit-vendor-ntn" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. HBL, MCB, UBL" data-testid="input-edit-vendor-bank-name" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankAccountTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Account holder name" data-testid="input-edit-vendor-bank-title" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number / IBAN</FormLabel>
                      <FormControl>
                        <Input placeholder="Account number or IBAN" data-testid="input-edit-vendor-bank-number" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankBranchCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Branch code" data-testid="input-edit-vendor-branch-code" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slaLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SLA Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "standard"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-sla-level">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {vendorType === "bandwidth" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="totalBandwidth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Bandwidth</FormLabel>
                        <FormControl>
                          <Input data-testid="input-edit-total-bandwidth" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="usedBandwidth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Used Bandwidth</FormLabel>
                        <FormControl>
                          <Input data-testid="input-edit-used-bandwidth" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bandwidthCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bandwidth Cost</FormLabel>
                        <FormControl>
                          <Input type="number" data-testid="input-edit-bandwidth-cost" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {vendorType === "bandwidth" && editingVendor && (() => {
                const vendorBwLinks = getVendorBwLinks(editingVendor.id);
                return (
                  <Card className="border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-1.5">
                          <Globe className="h-4 w-4" />
                          Bandwidth Links ({vendorBwLinks.length})
                        </CardTitle>
                        <Button type="button" size="sm" variant="outline" onClick={() => { setEditBwLinkTarget(editingVendor.id); setEditBwLinkItem(null); editBwLinkForm.reset({ vendorId: editingVendor.id, linkName: "", ipAddress: "", vlanDetail: "", city: "", bandwidthMbps: "0", bandwidthRate: "0", totalMonthlyCost: "0", notes: "" }); setEditBwLinkDialogOpen(true); }} data-testid="button-edit-add-bw-link">
                          <Plus className="h-3 w-3 mr-1" />
                          Add Link
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {vendorBwLinks.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">No bandwidth links yet</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Link Name</TableHead>
                                <TableHead className="text-xs">IP Address</TableHead>
                                <TableHead className="text-xs">VLAN</TableHead>
                                <TableHead className="text-xs">City</TableHead>
                                <TableHead className="text-xs">Mbps</TableHead>
                                <TableHead className="text-xs">Cost</TableHead>
                                <TableHead className="text-xs">Status</TableHead>
                                <TableHead className="w-8"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {vendorBwLinks.map(link => (
                                <TableRow key={link.id}>
                                  <TableCell className="text-xs font-medium">{link.linkName}</TableCell>
                                  <TableCell className="text-xs font-mono">{link.ipAddress || "N/A"}</TableCell>
                                  <TableCell className="text-xs">{link.vlanDetail || "N/A"}</TableCell>
                                  <TableCell className="text-xs">{link.city || "N/A"}</TableCell>
                                  <TableCell className="text-xs font-semibold">{link.bandwidthMbps}</TableCell>
                                  <TableCell className="text-xs font-semibold text-blue-600 dark:text-blue-400">{formatPKR(link.totalMonthlyCost)}</TableCell>
                                  <TableCell>
                                    <Badge variant={link.status === "active" ? "default" : "secondary"} className="text-[10px] no-default-active-elevate">{link.status}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6">
                                          <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => { setEditBwLinkTarget(editingVendor.id); setEditBwLinkItem(link); editBwLinkForm.reset({ vendorId: link.vendorId, linkName: link.linkName, ipAddress: link.ipAddress || "", vlanDetail: link.vlanDetail || "", city: link.city || "", bandwidthMbps: link.bandwidthMbps || "0", bandwidthRate: link.bandwidthRate || "0", totalMonthlyCost: link.totalMonthlyCost || "0", notes: link.notes || "" }); setEditBwLinkDialogOpen(true); }}>
                                          <Edit className="h-3.5 w-3.5 mr-2" />Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm(`Delete link "${link.linkName}"?`)) editDeleteBwLink.mutate(link.id); }}>
                                          <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {vendorBwLinks.length > 1 && (
                                <TableRow className="font-bold bg-muted/50">
                                  <TableCell colSpan={4} className="text-xs font-bold">TOTALS</TableCell>
                                  <TableCell className="text-xs font-bold">{vendorBwLinks.reduce((s, l) => s + Number(l.bandwidthMbps || 0), 0)} Mbps</TableCell>
                                  <TableCell className="text-xs font-bold text-blue-600 dark:text-blue-400">{formatPKR(vendorBwLinks.reduce((s, l) => s + Number(l.totalMonthlyCost || 0), 0))}</TableCell>
                                  <TableCell colSpan={2}></TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              {vendorType === "panel" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="panelUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Panel URL</FormLabel>
                        <FormControl>
                          <Input data-testid="input-edit-panel-url" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="panelUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Panel Username</FormLabel>
                        <FormControl>
                          <Input data-testid="input-edit-panel-username" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="walletBalance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Balance</FormLabel>
                        <FormControl>
                          <Input type="number" data-testid="input-edit-wallet-balance" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contractStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" data-testid="input-edit-contract-start" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contractEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract End Date</FormLabel>
                      <FormControl>
                        <Input type="date" data-testid="input-edit-contract-end" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "active"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-vendor-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-update-vendor">
                  {updateMutation.isPending ? "Updating..." : "Update Vendor"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!profileVendor} onOpenChange={(open) => { if (!open) setProfileVendor(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Vendor Profile
            </DialogTitle>
          </DialogHeader>
          {profileVendor && (() => {
            const pkgs = getVendorPackages(profileVendor.id);
            const bwLinks = getVendorBwLinks(profileVendor.id);
            return (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                    {profileVendor.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{profileVendor.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${typeColors[profileVendor.vendorType || "bandwidth"] || ""}`}>
                        {profileVendor.vendorType === "panel" ? "Panel" : "Bandwidth"}
                      </Badge>
                      <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[profileVendor.status] || ""}`}>
                        {profileVendor.status}
                      </Badge>
                      {profileVendor.slaLevel && (
                        <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${
                          profileVendor.slaLevel === "enterprise" ? "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950" :
                          profileVendor.slaLevel === "premium" ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950" :
                          "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-950"
                        }`}>
                          {profileVendor.slaLevel}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {profileVendor.contactPerson && (
                    <div className="text-sm"><span className="text-muted-foreground text-xs block">Contact Person</span>{profileVendor.contactPerson}</div>
                  )}
                  <div className="text-sm"><span className="text-muted-foreground text-xs block">Phone</span>{profileVendor.phone}</div>
                  {profileVendor.email && (
                    <div className="text-sm"><span className="text-muted-foreground text-xs block">Email</span>{profileVendor.email}</div>
                  )}
                  <div className="text-sm"><span className="text-muted-foreground text-xs block">Service Type</span><span className="capitalize">{profileVendor.serviceType}</span></div>
                  {profileVendor.city && (
                    <div className="text-sm"><span className="text-muted-foreground text-xs block">City</span>{profileVendor.city}</div>
                  )}
                  {profileVendor.ntn && (
                    <div className="text-sm"><span className="text-muted-foreground text-xs block">NTN</span>{profileVendor.ntn}</div>
                  )}
                  {(profileVendor.bankName || profileVendor.bankAccountTitle || profileVendor.bankAccountNumber) && (
                    <div className="text-sm space-y-0.5">
                      <span className="text-muted-foreground text-xs block">Bank Details</span>
                      {profileVendor.bankName && <div>{profileVendor.bankName}</div>}
                      {profileVendor.bankAccountTitle && <div className="text-xs text-muted-foreground">{profileVendor.bankAccountTitle}</div>}
                      {profileVendor.bankAccountNumber && <div className="font-mono text-xs">{profileVendor.bankAccountNumber}</div>}
                      {profileVendor.bankBranchCode && <div className="text-xs text-muted-foreground">Branch: {profileVendor.bankBranchCode}</div>}
                    </div>
                  )}
                  {profileVendor.bankAccount && !profileVendor.bankName && !profileVendor.bankAccountNumber && (
                    <div className="text-sm"><span className="text-muted-foreground text-xs block">Bank Account</span>{profileVendor.bankAccount}</div>
                  )}
                  {profileVendor.contractStartDate && (
                    <div className="text-sm"><span className="text-muted-foreground text-xs block">Contract Start</span>{profileVendor.contractStartDate}</div>
                  )}
                  {profileVendor.contractEndDate && (
                    <div className="text-sm">
                      <span className="text-muted-foreground text-xs block">Contract End</span>
                      <span>{profileVendor.contractEndDate}</span>
                      {(() => {
                        const end = new Date(profileVendor.contractEndDate);
                        const now = new Date();
                        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        if (diff < 0) return <Badge variant="secondary" className="no-default-active-elevate ml-1 text-[10px] text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-950">Expired</Badge>;
                        if (diff <= 30) return <Badge variant="secondary" className="no-default-active-elevate ml-1 text-[10px] text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-950">{diff}d left</Badge>;
                        return <Badge variant="secondary" className="no-default-active-elevate ml-1 text-[10px] text-green-600 bg-green-50 dark:text-green-300 dark:bg-green-950">{diff}d left</Badge>;
                      })()}
                    </div>
                  )}
                </div>

                {profileVendor.address && (
                  <div className="text-sm"><span className="text-muted-foreground text-xs block">Address</span>{profileVendor.address}</div>
                )}

                {profileVendor.vendorType === "bandwidth" && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1.5"><Wifi className="h-4 w-4" /> Bandwidth Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-sm"><span className="text-muted-foreground text-xs block">Total Bandwidth</span>{profileVendor.totalBandwidth || "N/A"}</div>
                        <div className="text-sm"><span className="text-muted-foreground text-xs block">Used Bandwidth</span>{profileVendor.usedBandwidth || "N/A"}</div>
                        <div className="text-sm"><span className="text-muted-foreground text-xs block">Monthly Cost</span>{formatPKR(profileVendor.bandwidthCost)}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {profileVendor.vendorType === "bandwidth" && bwLinks.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1.5">
                        <Globe className="h-4 w-4" />
                        Bandwidth Links ({bwLinks.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Link Name</TableHead>
                              <TableHead className="text-xs">IP Address</TableHead>
                              <TableHead className="text-xs">VLAN</TableHead>
                              <TableHead className="text-xs">City</TableHead>
                              <TableHead className="text-xs">Mbps</TableHead>
                              <TableHead className="text-xs">Rate</TableHead>
                              <TableHead className="text-xs">Monthly Cost</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bwLinks.map(link => (
                              <TableRow key={link.id}>
                                <TableCell className="text-sm font-medium">{link.linkName}</TableCell>
                                <TableCell className="text-sm font-mono">{link.ipAddress || "N/A"}</TableCell>
                                <TableCell className="text-sm">{link.vlanDetail || "N/A"}</TableCell>
                                <TableCell className="text-sm">{link.city || "N/A"}</TableCell>
                                <TableCell className="text-sm font-semibold">{link.bandwidthMbps}</TableCell>
                                <TableCell className="text-sm">{formatPKR(link.bandwidthRate)}</TableCell>
                                <TableCell className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatPKR(link.totalMonthlyCost)}</TableCell>
                                <TableCell>
                                  <Badge variant={link.status === "active" ? "default" : "secondary"} className="text-[10px] no-default-active-elevate">{link.status}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                            {bwLinks.length > 1 && (
                              <TableRow className="font-bold bg-muted/50">
                                <TableCell colSpan={4} className="text-xs font-bold">TOTALS</TableCell>
                                <TableCell className="text-xs font-bold">{bwLinks.reduce((s, l) => s + Number(l.bandwidthMbps || 0), 0)} Mbps</TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatPKR(bwLinks.reduce((s, l) => s + Number(l.totalMonthlyCost || 0), 0))}</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {profileVendor.vendorType === "panel" && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1.5"><Wallet className="h-4 w-4" /> Panel Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-sm"><span className="text-muted-foreground text-xs block">Wallet Balance</span>{formatPKR(profileVendor.walletBalance)}</div>
                        {profileVendor.panelUrl && (
                          <div className="text-sm"><span className="text-muted-foreground text-xs block">Panel URL</span>
                            <a href={profileVendor.panelUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-xs">{profileVendor.panelUrl}</a>
                          </div>
                        )}
                        {profileVendor.panelUsername && (
                          <div className="text-sm"><span className="text-muted-foreground text-xs block">Panel Username</span>{profileVendor.panelUsername}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Package className="h-4 w-4" />
                      Allowed Packages ({pkgs.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pkgs.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">No packages assigned to this vendor</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Package</TableHead>
                              <TableHead className="text-xs">Speed</TableHead>
                              <TableHead className="text-xs">Vendor Price</TableHead>
                              <TableHead className="text-xs">ISP Price</TableHead>
                              <TableHead className="text-xs">Margin</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pkgs.map(pkg => (
                              <TableRow key={pkg.id}>
                                <TableCell className="text-sm font-medium">{pkg.packageName}</TableCell>
                                <TableCell className="text-sm">{pkg.speed || "N/A"}</TableCell>
                                <TableCell className="text-sm">{formatPKR(pkg.vendorPrice)}</TableCell>
                                <TableCell className="text-sm">{formatPKR(pkg.ispSellingPrice)}</TableCell>
                                <TableCell className="text-sm text-green-600 dark:text-green-400 font-medium">
                                  {formatPKR(Number(pkg.ispSellingPrice || 0) - Number(pkg.vendorPrice || 0))}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileVendor(null)}>Close</Button>
            <Button onClick={() => { if (profileVendor) { openEdit(profileVendor); setProfileVendor(null); } }} data-testid="button-profile-edit">
              <Edit className="h-4 w-4 mr-1" />
              Edit Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!walletVendor} onOpenChange={(open) => { if (!open) setWalletVendor(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet & Transactions - {walletVendor?.name}
            </DialogTitle>
          </DialogHeader>
          {walletVendor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-green-50 dark:bg-green-950">
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Balance</p>
                        <p className="text-lg font-bold">{formatPKR(walletVendor.walletBalance)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950">
                        <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Transactions</p>
                        <p className="text-lg font-bold">{(walletTransactions || []).length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  {(walletTransactions || []).length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>No transactions yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Date</TableHead>
                            <TableHead className="text-xs">Type</TableHead>
                            <TableHead className="text-xs">Amount</TableHead>
                            <TableHead className="text-xs">Balance After</TableHead>
                            <TableHead className="text-xs">Note</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(walletTransactions || []).map((txn) => (
                            <TableRow key={txn.id}>
                              <TableCell className="text-xs">{txn.createdAt ? new Date(txn.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${txn.type === "recharge" ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" : "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950"}`}>
                                  {txn.type === "recharge" ? (
                                    <><ArrowDownLeft className="h-3 w-3 mr-0.5" /> Recharge</>
                                  ) : (
                                    <><ArrowUpRight className="h-3 w-3 mr-0.5" /> Deduct</>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell className={`text-sm font-medium ${txn.type === "recharge" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                {txn.type === "recharge" ? "+" : "-"}{formatPKR(txn.amount)}
                              </TableCell>
                              <TableCell className="text-sm">{formatPKR(txn.balanceAfter)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{txn.description || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalletVendor(null)}>Close</Button>
            <Button onClick={() => { setWalletVendor(null); changeTab("wallet"); }} data-testid="button-go-wallet-tab">
              <Wallet className="h-4 w-4 mr-1" />
              Manage Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editBwLinkDialogOpen} onOpenChange={setEditBwLinkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editBwLinkItem ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editBwLinkItem ? "Edit Bandwidth Link" : "Add New Bandwidth Link"}
            </DialogTitle>
          </DialogHeader>
          <Form {...editBwLinkForm}>
            <form onSubmit={editBwLinkForm.handleSubmit((data) => editBwLinkItem ? editUpdateBwLink.mutate({ id: editBwLinkItem.id, data }) : editCreateBwLink.mutate(data))} className="space-y-4">
              <FormField control={editBwLinkForm.control} name="linkName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Link Name *</FormLabel>
                  <FormControl><Input placeholder="e.g. Link-1 Fiber" data-testid="input-edit-bw-link-name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField control={editBwLinkForm.control} name="ipAddress" render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Address</FormLabel>
                    <FormControl><Input placeholder="e.g. 192.168.1.1/30" data-testid="input-edit-bw-link-ip" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editBwLinkForm.control} name="vlanDetail" render={({ field }) => (
                  <FormItem>
                    <FormLabel>VLAN Detail</FormLabel>
                    <FormControl><Input placeholder="e.g. VLAN 100" data-testid="input-edit-bw-link-vlan" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editBwLinkForm.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl><Input placeholder="e.g. Lahore" data-testid="input-edit-bw-link-city" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField control={editBwLinkForm.control} name="bandwidthMbps" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bandwidth (Mbps) *</FormLabel>
                    <FormControl><Input type="number" placeholder="0" data-testid="input-edit-bw-link-mbps" {...field} onChange={(e) => {
                      field.onChange(e.target.value);
                      const rate = editBwLinkForm.getValues("bandwidthRate");
                      editBwLinkForm.setValue("totalMonthlyCost", (Number(e.target.value) * Number(rate || 0)).toFixed(2));
                    }} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editBwLinkForm.control} name="bandwidthRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate per Mbps (PKR) *</FormLabel>
                    <FormControl><Input type="number" placeholder="0" data-testid="input-edit-bw-link-rate" {...field} onChange={(e) => {
                      field.onChange(e.target.value);
                      const mbps = editBwLinkForm.getValues("bandwidthMbps");
                      editBwLinkForm.setValue("totalMonthlyCost", (Number(mbps || 0) * Number(e.target.value)).toFixed(2));
                    }} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editBwLinkForm.control} name="totalMonthlyCost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Monthly Cost (PKR)</FormLabel>
                    <FormControl><Input type="number" placeholder="Auto-calculated" className="bg-muted/50 font-semibold" data-testid="input-edit-bw-link-total" {...field} readOnly /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={editBwLinkForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Input placeholder="Optional notes" data-testid="input-edit-bw-link-notes" {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setEditBwLinkDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={editCreateBwLink.isPending || editUpdateBwLink.isPending} data-testid="button-save-edit-bw-link">
                  {(editCreateBwLink.isPending || editUpdateBwLink.isPending) ? "Saving..." : editBwLinkItem ? "Update Link" : "Create Link"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BandwidthVendorsTab() {
  const { toast } = useToast();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [, changeTab] = useTab("bandwidth-vendors");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [profileVendor, setProfileVendor] = useState<Vendor | null>(null);
  const [walletVendor, setWalletVendor] = useState<Vendor | null>(null);
  const [editBwLinkDialogOpen, setEditBwLinkDialogOpen] = useState(false);
  const [editBwLinkTarget, setEditBwLinkTarget] = useState<number | null>(null);
  const [editBwLinkItem, setEditBwLinkItem] = useState<VendorBandwidthLink | null>(null);

  const { data: vendors, isLoading } = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });
  const { data: vendorPackages } = useQuery<VendorPackage[]>({ queryKey: ["/api/vendor-packages"] });
  const { data: allBwLinks } = useQuery<VendorBandwidthLink[]>({ queryKey: ["/api/vendor-bandwidth-links"] });
  const { data: walletTransactions } = useQuery<VendorWalletTransaction[]>({
    queryKey: ["/api/vendor-wallet-transactions", walletVendor?.id],
    enabled: !!walletVendor,
    queryFn: async () => {
      if (!walletVendor) return [];
      const res = await fetch(`/api/vendor-wallet-transactions/${walletVendor.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const getVendorBwLinks = (vendorId: number) => (allBwLinks || []).filter(l => l.vendorId === vendorId);
  const getVendorPackages = (vendorId: number) => (vendorPackages || []).filter(p => p.vendorId === vendorId);

  const editBwLinkForm = useForm<InsertVendorBandwidthLink>({
    defaultValues: { vendorId: 0, linkName: "", ipAddress: "", vlanDetail: "", city: "", bandwidthMbps: "0", bandwidthRate: "0", totalMonthlyCost: "0", notes: "" },
  });

  const editCreateBwLink = useMutation({
    mutationFn: async (data: InsertVendorBandwidthLink) => {
      const res = await apiRequest("POST", "/api/vendor-bandwidth-links", data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vendor-bandwidth-links"] }); toast({ title: "Bandwidth link created" }); setEditBwLinkDialogOpen(false); },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const editUpdateBwLink = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertVendorBandwidthLink> }) => {
      const res = await apiRequest("PATCH", `/api/vendor-bandwidth-links/${id}`, data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vendor-bandwidth-links"] }); toast({ title: "Bandwidth link updated" }); setEditBwLinkDialogOpen(false); setEditBwLinkItem(null); },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const editDeleteBwLink = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/vendor-bandwidth-links/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vendor-bandwidth-links"] }); toast({ title: "Bandwidth link deleted" }); },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const form = useForm<InsertVendor>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: { name: "", vendorType: "bandwidth", contactPerson: "", phone: "", email: "", address: "", city: "", serviceType: "fiber", ntn: "", bankAccount: "", bankName: "", bankAccountTitle: "", bankAccountNumber: "", bankBranchCode: "", slaLevel: "standard", totalBandwidth: "", usedBandwidth: "", bandwidthCost: "0", contractStartDate: "", contractEndDate: "", walletBalance: "0", panelUrl: "", panelUsername: "", status: "active" },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertVendor> }) => {
      const res = await apiRequest("PATCH", `/api/vendors/${id}`, data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vendors"] }); queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] }); setDialogOpen(false); setEditingVendor(null); form.reset(); toast({ title: "Vendor updated successfully" }); },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/vendors/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vendors"] }); queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] }); toast({ title: "Vendor deleted successfully" }); },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    form.reset({ name: vendor.name, vendorType: vendor.vendorType || "bandwidth", contactPerson: vendor.contactPerson || "", phone: vendor.phone, email: vendor.email || "", address: vendor.address || "", city: vendor.city || "", serviceType: vendor.serviceType, ntn: vendor.ntn || "", bankAccount: vendor.bankAccount || "", bankName: vendor.bankName || "", bankAccountTitle: vendor.bankAccountTitle || "", bankAccountNumber: vendor.bankAccountNumber || "", bankBranchCode: vendor.bankBranchCode || "", slaLevel: vendor.slaLevel || "standard", totalBandwidth: vendor.totalBandwidth || "", usedBandwidth: vendor.usedBandwidth || "", bandwidthCost: vendor.bandwidthCost || "0", contractStartDate: vendor.contractStartDate || "", contractEndDate: vendor.contractEndDate || "", walletBalance: vendor.walletBalance || "0", panelUrl: vendor.panelUrl || "", panelUsername: vendor.panelUsername || "", status: vendor.status });
    setDialogOpen(true);
  };

  const bwVendors = (vendors || []).filter(v => v.vendorType === "bandwidth");
  const totalMonthly = bwVendors.reduce((s, v) => s + Number(v.bandwidthCost || 0), 0);
  const activeCount = bwVendors.filter(v => v.status === "active").length;
  const expiringCount = bwVendors.filter(v => { if (!v.contractEndDate) return false; const diff = (new Date(v.contractEndDate).getTime() - Date.now()) / 86400000; return diff >= 0 && diff <= 30; }).length;
  const totalActiveLinks = (allBwLinks || []).filter(l => l.status === "active").length;

  const filtered = bwVendors.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.phone.includes(search) || (v.contactPerson || "").toLowerCase().includes(search.toLowerCase()) || (v.email || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "name") return a.name.localeCompare(b.name) * dir;
    if (sortField === "cost") return (Number(a.bandwidthCost || 0) - Number(b.bandwidthCost || 0)) * dir;
    if (sortField === "status") return a.status.localeCompare(b.status) * dir;
    return 0;
  });

  const exportCSV = () => {
    const headers = ["Name", "Contact Person", "Phone", "Email", "City", "Service Type", "Total BW", "Used BW", "Monthly Cost", "SLA", "Contract Start", "Contract End", "Status"];
    const rows = filtered.map(v => [v.name, v.contactPerson || "", v.phone, v.email || "", v.city || "", v.serviceType, v.totalBandwidth || "", v.usedBandwidth || "", v.bandwidthCost || "0", v.slaLevel || "", v.contractStartDate || "", v.contractEndDate || "", v.status]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `bandwidth_vendors_${new Date().toISOString().split("T")[0]}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const generatePDF = () => {
    if (filtered.length === 0) return;
    const rows = filtered.map(v => {
      const links = getVendorBwLinks(v.id);
      const diff = v.contractEndDate ? Math.ceil((new Date(v.contractEndDate).getTime() - Date.now()) / 86400000) : null;
      return `<tr>
        <td>${escHtml(v.name)}${v.contactPerson ? `<br><small>${escHtml(v.contactPerson)}</small>` : ""}</td>
        <td>${escHtml(v.phone)}</td>
        <td class="capitalize">${escHtml(v.serviceType)}</td>
        <td>${escHtml(v.usedBandwidth || "0")} / ${escHtml(v.totalBandwidth || "0")} Mbps</td>
        <td>${links.length} (${links.filter(l => l.status === "active").length} active)</td>
        <td>${escHtml(v.bandwidthCost || "0")}</td>
        <td class="capitalize">${escHtml(v.slaLevel || "Standard")}</td>
        <td>${v.contractEndDate ? `${escHtml(v.contractEndDate)}${diff !== null && diff <= 30 ? ` <span class="exp">(${diff}d)</span>` : ""}` : "—"}</td>
        <td><span class="badge ${v.status === "active" ? "badge-green" : "badge-red"}">${escHtml(v.status)}</span></td>
      </tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html><head><title>Bandwidth Vendors Report</title>
    <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:Arial,sans-serif; font-size:11px; color:#111; padding:20px; }
    h1 { font-size:16px; margin-bottom:2px; } .meta { font-size:11px; color:#555; margin-bottom:16px; }
    table { width:100%; border-collapse:collapse; } th { background:#1e3a5f; color:#fff; padding:7px 8px; text-align:left; font-size:10px; text-transform:uppercase; }
    td { padding:6px 8px; border-bottom:1px solid #e2e8f0; vertical-align:top; } tr:nth-child(even) td { background:#f0f7ff; }
    .capitalize { text-transform:capitalize; } .exp { color:#d97706; font-weight:600; }
    .badge { padding:2px 6px; border-radius:4px; font-size:9px; font-weight:600; text-transform:uppercase; }
    .badge-green { background:#dcfce7; color:#15803d; } .badge-red { background:#fef2f2; color:#dc2626; }
    .footer { margin-top:16px; font-size:10px; color:#888; text-align:center; border-top:1px solid #e2e8f0; padding-top:8px; }
    </style></head><body>
    <h1>Bandwidth Vendors Report</h1>
    <p class="meta"><strong>Total:</strong> ${filtered.length} &nbsp; <strong>Active:</strong> ${activeCount} &nbsp; <strong>Total Monthly Cost:</strong> PKR ${totalMonthly.toLocaleString()} &nbsp; <strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <table><thead><tr><th>Name</th><th>Phone</th><th>Service</th><th>BW Used/Total</th><th>Links</th><th>Monthly Cost (PKR)</th><th>SLA</th><th>Contract End</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p class="footer">NetSphere Enterprise — Bandwidth Vendors Report</p></body></html>`;
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) return;
    win.document.write(html); win.document.close(); win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  return (
    <div className="space-y-4 page-fade-in" data-testid="tab-content-bandwidth-vendors">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="vendor-stat-card stat-blue p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">BW Vendors</p>
              <p className="text-2xl font-bold mt-1">{bwVendors.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <Wifi className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="vendor-stat-card stat-green p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Active</p>
              <p className="text-2xl font-bold mt-1">{activeCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{totalActiveLinks} active links</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="vendor-stat-card stat-purple p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Monthly Cost</p>
              <p className="text-lg font-bold mt-1">{formatPKR(totalMonthly)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">total bandwidth spend</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="vendor-stat-card stat-amber p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Expiring (30d)</p>
              <p className="text-2xl font-bold mt-1">{expiringCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">contracts expiring</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="vendor-filter-bar">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search bandwidth vendors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-search-bw-vendors" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]" data-testid="select-bw-status-filter"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortField} onValueChange={v => { setSortField(v); setSortDir("asc"); }}>
              <SelectTrigger className="w-[130px]" data-testid="select-bw-sort-field"><SelectValue placeholder="Sort By" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="cost">Monthly Cost</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")} data-testid="button-bw-toggle-sort">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" />{sortDir === "asc" ? "A→Z" : "Z→A"}
            </Button>
            <Button size="sm" variant="outline" onClick={exportCSV} data-testid="button-export-bw-csv"><Download className="h-3.5 w-3.5 mr-1" />Export CSV</Button>
            <Button size="sm" variant="outline" onClick={generatePDF} data-testid="button-generate-bw-pdf"><FileText className="h-3.5 w-3.5 mr-1" />Generate PDF</Button>
            {canCreate("vendors") && (
              <Button size="sm" className="btn-vendor-primary no-default-hover-elevate no-default-active-elevate" onClick={() => changeTab("add")} data-testid="button-add-bw-vendor">
                <Plus className="h-3.5 w-3.5 mr-1" />Add Bandwidth Vendor
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span>Showing {filtered.length} of {bwVendors.length} bandwidth vendors</span>
        {(search || statusFilter !== "all") && (
          <Button size="sm" variant="ghost" onClick={() => { setSearch(""); setStatusFilter("all"); }} data-testid="button-clear-bw-filters">Clear Filters</Button>
        )}
      </div>

      {(() => {
        const expiring = bwVendors.filter(v => { if (!v.contractEndDate) return false; const diff = (new Date(v.contractEndDate).getTime() - Date.now()) / 86400000; return diff >= 0 && diff <= 60; });
        if (expiring.length === 0) return null;
        return (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30">
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Contract Expiry Alerts</p>
                  <div className="mt-2 space-y-1.5">
                    {expiring.map(v => {
                      const daysLeft = Math.ceil((new Date(v.contractEndDate!).getTime() - Date.now()) / 86400000);
                      return (
                        <div key={v.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium">{v.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Expires: {v.contractEndDate}</span>
                            <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${daysLeft <= 7 ? "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950" : daysLeft <= 30 ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950" : "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950"}`}>{daysLeft} days left</Badge>
                            <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => openEdit(v)} data-testid={`button-renew-bw-${v.id}`}><Edit className="h-3 w-3 mr-1" />Renew</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Wifi className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No bandwidth vendors found</p>
              <p className="text-sm mt-1">Add your first bandwidth vendor to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="vendor-table-enterprise">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Service</TableHead>
                    <TableHead className="hidden md:table-cell">BW (Used / Total)</TableHead>
                    <TableHead className="hidden lg:table-cell">BW Links</TableHead>
                    <TableHead className="hidden md:table-cell">Monthly Cost</TableHead>
                    <TableHead className="hidden lg:table-cell">SLA</TableHead>
                    <TableHead className="hidden xl:table-cell">Contract End</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(vendor => {
                    const bwLinks = getVendorBwLinks(vendor.id);
                    const activeLinks = bwLinks.filter(l => l.status === "active").length;
                    return (
                      <TableRow key={vendor.id} data-testid={`row-bw-vendor-${vendor.id}`}>
                        <TableCell>
                          <div className="font-medium">{vendor.name}</div>
                          {vendor.contactPerson && <div className="text-xs text-muted-foreground">{vendor.contactPerson}</div>}
                          {vendor.city && <div className="text-xs text-muted-foreground">{vendor.city}</div>}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{vendor.phone}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs capitalize">{vendor.serviceType}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div>
                            <span className="text-xs font-medium">{vendor.usedBandwidth || "0"} / {vendor.totalBandwidth || "0"}</span>
                            <span className="text-[10px] text-muted-foreground block">used / total Mbps</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="no-default-active-elevate text-[10px]"><Globe className="h-3 w-3 mr-0.5" />{bwLinks.length}</Badge>
                            {activeLinks > 0 && <span className="text-[10px] text-green-600 dark:text-green-400">{activeLinks} active</span>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div>
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{formatPKR(vendor.bandwidthCost)}</span>
                            <span className="text-[10px] text-muted-foreground block">/month</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${vendor.slaLevel === "enterprise" ? "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950" : vendor.slaLevel === "premium" ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950" : "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-950"}`}>{vendor.slaLevel || "Standard"}</Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {vendor.contractEndDate ? (
                            <div className="text-xs">
                              <span className="text-muted-foreground">{vendor.contractEndDate}</span>
                              {(() => { const diff = Math.ceil((new Date(vendor.contractEndDate).getTime() - Date.now()) / 86400000); if (diff < 0) return <span className="block text-red-500 font-medium">Expired</span>; if (diff <= 30) return <span className="block text-amber-500 font-medium">{diff}d left</span>; return null; })()}
                            </div>
                          ) : <span className="text-xs text-muted-foreground">N/A</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[vendor.status] || ""}`}>{vendor.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-bw-actions-${vendor.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setProfileVendor(vendor)} data-testid={`button-bw-view-profile-${vendor.id}`}><Eye className="h-4 w-4 mr-2" />View Profile</DropdownMenuItem>
                              {canEdit("vendors") && <DropdownMenuItem onClick={() => openEdit(vendor)} data-testid={`button-bw-edit-${vendor.id}`}><Edit className="h-4 w-4 mr-2" />Edit Profile</DropdownMenuItem>}
                              <DropdownMenuItem onClick={() => setWalletVendor(vendor)} data-testid={`button-bw-wallet-${vendor.id}`}><Wallet className="h-4 w-4 mr-2" />Wallet & Transactions</DropdownMenuItem>
                              {canDelete("vendors") && (
                                <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm(`Delete vendor "${vendor.name}"?`)) deleteMutation.mutate(vendor.id); }} data-testid={`button-bw-delete-${vendor.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Bandwidth Vendor</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(data => { if (editingVendor) updateMutation.mutate({ id: editingVendor.id, data }); })} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input data-testid="input-bw-edit-name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input data-testid="input-bw-edit-contact" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input data-testid="input-bw-edit-phone" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input data-testid="input-bw-edit-email" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="serviceType" render={({ field }) => (<FormItem><FormLabel>Service Type</FormLabel><Select onValueChange={field.onChange} value={field.value || "fiber"}><FormControl><SelectTrigger data-testid="select-bw-edit-service"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="fiber">Fiber</SelectItem><SelectItem value="wireless">Wireless</SelectItem><SelectItem value="cable">Cable</SelectItem><SelectItem value="satellite">Satellite</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g. Lahore" data-testid="input-bw-edit-city" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="totalBandwidth" render={({ field }) => (<FormItem><FormLabel>Total Bandwidth (Mbps)</FormLabel><FormControl><Input data-testid="input-bw-edit-total-bw" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="usedBandwidth" render={({ field }) => (<FormItem><FormLabel>Used Bandwidth (Mbps)</FormLabel><FormControl><Input data-testid="input-bw-edit-used-bw" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bandwidthCost" render={({ field }) => (<FormItem><FormLabel>Monthly Cost (PKR)</FormLabel><FormControl><Input type="number" data-testid="input-bw-edit-cost" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="slaLevel" render={({ field }) => (<FormItem><FormLabel>SLA Level</FormLabel><Select onValueChange={field.onChange} value={field.value || "standard"}><FormControl><SelectTrigger data-testid="select-bw-edit-sla"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="standard">Standard</SelectItem><SelectItem value="premium">Premium</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="contractStartDate" render={({ field }) => (<FormItem><FormLabel>Contract Start</FormLabel><FormControl><Input type="date" data-testid="input-bw-edit-contract-start" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="contractEndDate" render={({ field }) => (<FormItem><FormLabel>Contract End</FormLabel><FormControl><Input type="date" data-testid="input-bw-edit-contract-end" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="bankName" render={({ field }) => (<FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g. HBL" data-testid="input-bw-edit-bank" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bankAccountTitle" render={({ field }) => (<FormItem><FormLabel>Account Title</FormLabel><FormControl><Input placeholder="Holder name" data-testid="input-bw-edit-bank-title" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bankAccountNumber" render={({ field }) => (<FormItem><FormLabel>Account No / IBAN</FormLabel><FormControl><Input data-testid="input-bw-edit-bank-number" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              {editingVendor && (() => {
                const vendorBwLinks = getVendorBwLinks(editingVendor.id);
                return (
                  <Card className="border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-1.5"><Globe className="h-4 w-4" />Bandwidth Links ({vendorBwLinks.length})</CardTitle>
                        <Button type="button" size="sm" variant="outline" onClick={() => { setEditBwLinkTarget(editingVendor.id); setEditBwLinkItem(null); editBwLinkForm.reset({ vendorId: editingVendor.id, linkName: "", ipAddress: "", vlanDetail: "", city: "", bandwidthMbps: "0", bandwidthRate: "0", totalMonthlyCost: "0", notes: "" }); setEditBwLinkDialogOpen(true); }} data-testid="button-bw-edit-add-link"><Plus className="h-3 w-3 mr-1" />Add Link</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {vendorBwLinks.length === 0 ? <p className="text-xs text-muted-foreground text-center py-3">No bandwidth links yet</p> : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader><TableRow><TableHead className="text-xs">Link Name</TableHead><TableHead className="text-xs">IP</TableHead><TableHead className="text-xs">City</TableHead><TableHead className="text-xs">Mbps</TableHead><TableHead className="text-xs">Cost</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="w-8"></TableHead></TableRow></TableHeader>
                            <TableBody>
                              {vendorBwLinks.map(link => (
                                <TableRow key={link.id}>
                                  <TableCell className="text-xs font-medium">{link.linkName}</TableCell>
                                  <TableCell className="text-xs font-mono">{link.ipAddress || "N/A"}</TableCell>
                                  <TableCell className="text-xs">{link.city || "N/A"}</TableCell>
                                  <TableCell className="text-xs font-semibold">{link.bandwidthMbps}</TableCell>
                                  <TableCell className="text-xs font-semibold text-blue-600 dark:text-blue-400">{formatPKR(link.totalMonthlyCost)}</TableCell>
                                  <TableCell><Badge variant={link.status === "active" ? "default" : "secondary"} className="text-[10px] no-default-active-elevate">{link.status}</Badge></TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-3 w-3" /></Button></DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => { setEditBwLinkTarget(editingVendor.id); setEditBwLinkItem(link); editBwLinkForm.reset({ vendorId: link.vendorId, linkName: link.linkName, ipAddress: link.ipAddress || "", vlanDetail: link.vlanDetail || "", city: link.city || "", bandwidthMbps: link.bandwidthMbps || "0", bandwidthRate: link.bandwidthRate || "0", totalMonthlyCost: link.totalMonthlyCost || "0", notes: link.notes || "" }); setEditBwLinkDialogOpen(true); }}><Edit className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm(`Delete link "${link.linkName}"?`)) editDeleteBwLink.mutate(link.id); }}><Trash2 className="h-3.5 w-3.5 mr-2" />Delete</DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {vendorBwLinks.length > 1 && (
                                <TableRow className="font-bold bg-muted/50">
                                  <TableCell colSpan={3} className="text-xs font-bold">TOTALS</TableCell>
                                  <TableCell className="text-xs font-bold">{vendorBwLinks.reduce((s, l) => s + Number(l.bandwidthMbps || 0), 0)} Mbps</TableCell>
                                  <TableCell className="text-xs font-bold text-blue-600 dark:text-blue-400">{formatPKR(vendorBwLinks.reduce((s, l) => s + Number(l.totalMonthlyCost || 0), 0))}</TableCell>
                                  <TableCell colSpan={2}></TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}
              <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value || "active"}><FormControl><SelectTrigger data-testid="select-bw-edit-status"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-bw-update-vendor">{updateMutation.isPending ? "Updating..." : "Update Vendor"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!profileVendor} onOpenChange={open => { if (!open) setProfileVendor(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />Vendor Profile</DialogTitle></DialogHeader>
          {profileVendor && (() => {
            const pkgs = getVendorPackages(profileVendor.id);
            const bwLinks = getVendorBwLinks(profileVendor.id);
            return (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">{profileVendor.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <h3 className="text-lg font-semibold">{profileVendor.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950">Bandwidth</Badge>
                      <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[profileVendor.status] || ""}`}>{profileVendor.status}</Badge>
                      {profileVendor.slaLevel && <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${profileVendor.slaLevel === "enterprise" ? "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950" : profileVendor.slaLevel === "premium" ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950" : "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-950"}`}>{profileVendor.slaLevel}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {profileVendor.contactPerson && <div className="text-sm"><span className="text-muted-foreground text-xs block">Contact</span>{profileVendor.contactPerson}</div>}
                  <div className="text-sm"><span className="text-muted-foreground text-xs block">Phone</span>{profileVendor.phone}</div>
                  {profileVendor.email && <div className="text-sm"><span className="text-muted-foreground text-xs block">Email</span>{profileVendor.email}</div>}
                  <div className="text-sm"><span className="text-muted-foreground text-xs block">Service Type</span><span className="capitalize">{profileVendor.serviceType}</span></div>
                  {profileVendor.city && <div className="text-sm"><span className="text-muted-foreground text-xs block">City</span>{profileVendor.city}</div>}
                  {profileVendor.ntn && <div className="text-sm"><span className="text-muted-foreground text-xs block">NTN</span>{profileVendor.ntn}</div>}
                  {(profileVendor.bankName || profileVendor.bankAccountNumber) && (
                    <div className="text-sm space-y-0.5"><span className="text-muted-foreground text-xs block">Bank</span>{profileVendor.bankName && <div>{profileVendor.bankName}</div>}{profileVendor.bankAccountTitle && <div className="text-xs text-muted-foreground">{profileVendor.bankAccountTitle}</div>}{profileVendor.bankAccountNumber && <div className="font-mono text-xs">{profileVendor.bankAccountNumber}</div>}</div>
                  )}
                  {profileVendor.contractStartDate && <div className="text-sm"><span className="text-muted-foreground text-xs block">Contract Start</span>{profileVendor.contractStartDate}</div>}
                  {profileVendor.contractEndDate && (
                    <div className="text-sm"><span className="text-muted-foreground text-xs block">Contract End</span><span>{profileVendor.contractEndDate}</span>
                      {(() => { const diff = Math.ceil((new Date(profileVendor.contractEndDate).getTime() - Date.now()) / 86400000); if (diff < 0) return <Badge variant="secondary" className="no-default-active-elevate ml-1 text-[10px] text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-950">Expired</Badge>; if (diff <= 30) return <Badge variant="secondary" className="no-default-active-elevate ml-1 text-[10px] text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-950">{diff}d left</Badge>; return <Badge variant="secondary" className="no-default-active-elevate ml-1 text-[10px] text-green-600 bg-green-50 dark:text-green-300 dark:bg-green-950">{diff}d left</Badge>; })()}
                    </div>
                  )}
                </div>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Wifi className="h-4 w-4" />Bandwidth Details</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-sm"><span className="text-muted-foreground text-xs block">Total Bandwidth</span>{profileVendor.totalBandwidth || "N/A"}</div>
                      <div className="text-sm"><span className="text-muted-foreground text-xs block">Used Bandwidth</span>{profileVendor.usedBandwidth || "N/A"}</div>
                      <div className="text-sm"><span className="text-muted-foreground text-xs block">Monthly Cost</span>{formatPKR(profileVendor.bandwidthCost)}</div>
                    </div>
                  </CardContent>
                </Card>
                {bwLinks.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Globe className="h-4 w-4" />Bandwidth Links ({bwLinks.length})</CardTitle></CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader><TableRow><TableHead className="text-xs">Link Name</TableHead><TableHead className="text-xs">IP</TableHead><TableHead className="text-xs">City</TableHead><TableHead className="text-xs">Mbps</TableHead><TableHead className="text-xs">Rate</TableHead><TableHead className="text-xs">Monthly Cost</TableHead><TableHead className="text-xs">Status</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {bwLinks.map(link => (
                              <TableRow key={link.id}>
                                <TableCell className="text-sm font-medium">{link.linkName}</TableCell>
                                <TableCell className="text-sm font-mono">{link.ipAddress || "N/A"}</TableCell>
                                <TableCell className="text-sm">{link.city || "N/A"}</TableCell>
                                <TableCell className="text-sm font-semibold">{link.bandwidthMbps}</TableCell>
                                <TableCell className="text-sm">{formatPKR(link.bandwidthRate)}</TableCell>
                                <TableCell className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatPKR(link.totalMonthlyCost)}</TableCell>
                                <TableCell><Badge variant={link.status === "active" ? "default" : "secondary"} className="text-[10px] no-default-active-elevate">{link.status}</Badge></TableCell>
                              </TableRow>
                            ))}
                            {bwLinks.length > 1 && (
                              <TableRow className="font-bold bg-muted/50">
                                <TableCell colSpan={3} className="text-xs font-bold">TOTALS</TableCell>
                                <TableCell className="text-xs font-bold">{bwLinks.reduce((s, l) => s + Number(l.bandwidthMbps || 0), 0)} Mbps</TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatPKR(bwLinks.reduce((s, l) => s + Number(l.totalMonthlyCost || 0), 0))}</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {pkgs.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Package className="h-4 w-4" />Packages ({pkgs.length})</CardTitle></CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader><TableRow><TableHead className="text-xs">Package</TableHead><TableHead className="text-xs">Speed</TableHead><TableHead className="text-xs">Vendor Price</TableHead><TableHead className="text-xs">ISP Price</TableHead><TableHead className="text-xs">Margin</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {pkgs.map(pkg => (
                              <TableRow key={pkg.id}>
                                <TableCell className="text-sm font-medium">{pkg.packageName}</TableCell>
                                <TableCell className="text-sm">{pkg.speed || "N/A"}</TableCell>
                                <TableCell className="text-sm">{formatPKR(pkg.vendorPrice)}</TableCell>
                                <TableCell className="text-sm">{formatPKR(pkg.ispSellingPrice)}</TableCell>
                                <TableCell className="text-sm text-green-600 dark:text-green-400 font-medium">{formatPKR(Number(pkg.ispSellingPrice || 0) - Number(pkg.vendorPrice || 0))}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileVendor(null)}>Close</Button>
            <Button onClick={() => { if (profileVendor) { openEdit(profileVendor); setProfileVendor(null); } }} data-testid="button-bw-profile-edit"><Edit className="h-4 w-4 mr-1" />Edit Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!walletVendor} onOpenChange={open => { if (!open) setWalletVendor(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Wallet & Transactions — {walletVendor?.name}</DialogTitle></DialogHeader>
          {walletVendor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card><CardContent className="pt-4 pb-3 px-4"><div className="flex items-center gap-2"><div className="p-2 rounded-md bg-green-50 dark:bg-green-950"><DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" /></div><div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Balance</p><p className="text-lg font-bold">{formatPKR(walletVendor.walletBalance)}</p></div></div></CardContent></Card>
                <Card><CardContent className="pt-4 pb-3 px-4"><div className="flex items-center gap-2"><div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950"><Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div><div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Transactions</p><p className="text-lg font-bold">{(walletTransactions || []).length}</p></div></div></CardContent></Card>
              </div>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Transaction History</CardTitle></CardHeader>
                <CardContent>
                  {(walletTransactions || []).length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm"><Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No transactions yet</p></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Amount</TableHead><TableHead className="text-xs">Balance After</TableHead><TableHead className="text-xs">Note</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {(walletTransactions || []).map(txn => (
                            <TableRow key={txn.id}>
                              <TableCell className="text-xs">{txn.createdAt ? new Date(txn.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                              <TableCell><Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${txn.type === "recharge" ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" : "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950"}`}>{txn.type === "recharge" ? <><ArrowDownLeft className="h-3 w-3 mr-0.5" />Recharge</> : <><ArrowUpRight className="h-3 w-3 mr-0.5" />Deduct</>}</Badge></TableCell>
                              <TableCell className={`text-sm font-medium ${txn.type === "recharge" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{txn.type === "recharge" ? "+" : "-"}{formatPKR(txn.amount)}</TableCell>
                              <TableCell className="text-sm">{formatPKR(txn.balanceAfter)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{txn.description || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalletVendor(null)}>Close</Button>
            <Button onClick={() => { setWalletVendor(null); changeTab("wallet"); }} data-testid="button-bw-go-wallet-tab"><Wallet className="h-4 w-4 mr-1" />Manage Wallet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editBwLinkDialogOpen} onOpenChange={setEditBwLinkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2">{editBwLinkItem ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}{editBwLinkItem ? "Edit Bandwidth Link" : "Add New Bandwidth Link"}</DialogTitle></DialogHeader>
          <Form {...editBwLinkForm}>
            <form onSubmit={editBwLinkForm.handleSubmit(data => editBwLinkItem ? editUpdateBwLink.mutate({ id: editBwLinkItem.id, data }) : editCreateBwLink.mutate(data))} className="space-y-4">
              <FormField control={editBwLinkForm.control} name="linkName" render={({ field }) => (<FormItem><FormLabel>Link Name *</FormLabel><FormControl><Input placeholder="e.g. Link-1 Fiber" data-testid="input-bw-link-name" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField control={editBwLinkForm.control} name="ipAddress" render={({ field }) => (<FormItem><FormLabel>IP Address</FormLabel><FormControl><Input placeholder="192.168.1.1/30" data-testid="input-bw-link-ip" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editBwLinkForm.control} name="vlanDetail" render={({ field }) => (<FormItem><FormLabel>VLAN Detail</FormLabel><FormControl><Input placeholder="VLAN 100" data-testid="input-bw-link-vlan" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editBwLinkForm.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g. Lahore" data-testid="input-bw-link-city" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField control={editBwLinkForm.control} name="bandwidthMbps" render={({ field }) => (<FormItem><FormLabel>Bandwidth (Mbps) *</FormLabel><FormControl><Input type="number" placeholder="0" data-testid="input-bw-link-mbps" {...field} onChange={e => { field.onChange(e.target.value); editBwLinkForm.setValue("totalMonthlyCost", (Number(e.target.value) * Number(editBwLinkForm.getValues("bandwidthRate") || 0)).toFixed(2)); }} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editBwLinkForm.control} name="bandwidthRate" render={({ field }) => (<FormItem><FormLabel>Rate per Mbps (PKR)</FormLabel><FormControl><Input type="number" placeholder="0" data-testid="input-bw-link-rate" {...field} onChange={e => { field.onChange(e.target.value); editBwLinkForm.setValue("totalMonthlyCost", (Number(editBwLinkForm.getValues("bandwidthMbps") || 0) * Number(e.target.value)).toFixed(2)); }} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={editBwLinkForm.control} name="totalMonthlyCost" render={({ field }) => (<FormItem><FormLabel>Total Monthly Cost (PKR)</FormLabel><FormControl><Input type="number" className="bg-muted/50 font-semibold" data-testid="input-bw-link-total" {...field} readOnly /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={editBwLinkForm.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Input placeholder="Optional notes" data-testid="input-bw-link-notes" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setEditBwLinkDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={editCreateBwLink.isPending || editUpdateBwLink.isPending} data-testid="button-save-bw-link">{(editCreateBwLink.isPending || editUpdateBwLink.isPending) ? "Saving..." : editBwLinkItem ? "Update Link" : "Create Link"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PanelVendorsTab() {
  const { toast } = useToast();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [, changeTab] = useTab("panel-vendors");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [profileVendor, setProfileVendor] = useState<Vendor | null>(null);
  const [walletVendor, setWalletVendor] = useState<Vendor | null>(null);

  const { data: vendors, isLoading } = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });
  const { data: vendorPackages } = useQuery<VendorPackage[]>({ queryKey: ["/api/vendor-packages"] });
  const { data: walletTransactions } = useQuery<VendorWalletTransaction[]>({
    queryKey: ["/api/vendor-wallet-transactions", walletVendor?.id],
    enabled: !!walletVendor,
    queryFn: async () => {
      if (!walletVendor) return [];
      const res = await fetch(`/api/vendor-wallet-transactions/${walletVendor.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const getVendorPackages = (vendorId: number) => (vendorPackages || []).filter(p => p.vendorId === vendorId);
  const getVendorTotalPayable = (vendorId: number) => getVendorPackages(vendorId).reduce((s, p) => s + Number(p.vendorPrice || 0), 0);

  const form = useForm<InsertVendor>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: { name: "", vendorType: "panel", contactPerson: "", phone: "", email: "", address: "", city: "", serviceType: "fiber", ntn: "", bankAccount: "", bankName: "", bankAccountTitle: "", bankAccountNumber: "", bankBranchCode: "", slaLevel: "standard", totalBandwidth: "", usedBandwidth: "", bandwidthCost: "0", contractStartDate: "", contractEndDate: "", walletBalance: "0", panelUrl: "", panelUsername: "", status: "active" },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertVendor> }) => {
      const res = await apiRequest("PATCH", `/api/vendors/${id}`, data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vendors"] }); queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] }); setDialogOpen(false); setEditingVendor(null); form.reset(); toast({ title: "Vendor updated successfully" }); },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/vendors/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/vendors"] }); queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] }); toast({ title: "Vendor deleted successfully" }); },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    form.reset({ name: vendor.name, vendorType: vendor.vendorType || "panel", contactPerson: vendor.contactPerson || "", phone: vendor.phone, email: vendor.email || "", address: vendor.address || "", city: vendor.city || "", serviceType: vendor.serviceType, ntn: vendor.ntn || "", bankAccount: vendor.bankAccount || "", bankName: vendor.bankName || "", bankAccountTitle: vendor.bankAccountTitle || "", bankAccountNumber: vendor.bankAccountNumber || "", bankBranchCode: vendor.bankBranchCode || "", slaLevel: vendor.slaLevel || "standard", totalBandwidth: vendor.totalBandwidth || "", usedBandwidth: vendor.usedBandwidth || "", bandwidthCost: vendor.bandwidthCost || "0", contractStartDate: vendor.contractStartDate || "", contractEndDate: vendor.contractEndDate || "", walletBalance: vendor.walletBalance || "0", panelUrl: vendor.panelUrl || "", panelUsername: vendor.panelUsername || "", status: vendor.status });
    setDialogOpen(true);
  };

  const panelVendors = (vendors || []).filter(v => v.vendorType === "panel");
  const totalWallet = panelVendors.reduce((s, v) => s + Number(v.walletBalance || 0), 0);
  const activeCount = panelVendors.filter(v => v.status === "active").length;
  const totalPackages = panelVendors.reduce((s, v) => s + getVendorPackages(v.id).length, 0);
  const totalPayable = panelVendors.reduce((s, v) => s + getVendorTotalPayable(v.id), 0);

  const filtered = panelVendors.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.phone.includes(search) || (v.contactPerson || "").toLowerCase().includes(search.toLowerCase()) || (v.email || "").toLowerCase().includes(search.toLowerCase()) || (v.panelUrl || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "name") return a.name.localeCompare(b.name) * dir;
    if (sortField === "wallet") return (Number(a.walletBalance || 0) - Number(b.walletBalance || 0)) * dir;
    if (sortField === "payable") return (getVendorTotalPayable(a.id) - getVendorTotalPayable(b.id)) * dir;
    if (sortField === "status") return a.status.localeCompare(b.status) * dir;
    return 0;
  });

  const exportCSV = () => {
    const headers = ["Name", "Contact Person", "Phone", "Email", "City", "Service Type", "Wallet Balance", "Panel URL", "Panel Username", "Packages", "Payable Amount", "Status"];
    const rows = filtered.map(v => [v.name, v.contactPerson || "", v.phone, v.email || "", v.city || "", v.serviceType, v.walletBalance || "0", v.panelUrl || "", v.panelUsername || "", getVendorPackages(v.id).length, getVendorTotalPayable(v.id), v.status]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `panel_vendors_${new Date().toISOString().split("T")[0]}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const generatePDF = () => {
    if (filtered.length === 0) return;
    const rows = filtered.map(v => {
      const pkgs = getVendorPackages(v.id);
      return `<tr>
        <td>${escHtml(v.name)}${v.contactPerson ? `<br><small>${escHtml(v.contactPerson)}</small>` : ""}</td>
        <td>${escHtml(v.phone)}</td>
        <td class="capitalize">${escHtml(v.serviceType)}</td>
        <td>${escHtml(v.walletBalance || "0")}</td>
        <td>${v.panelUrl ? `<a href="${escHtml(v.panelUrl)}">${escHtml(v.panelUrl)}</a>` : "—"}</td>
        <td>${escHtml(v.panelUsername || "—")}</td>
        <td>${pkgs.length}</td>
        <td>${escHtml(String(getVendorTotalPayable(v.id)))}</td>
        <td><span class="badge ${v.status === "active" ? "badge-green" : "badge-red"}">${escHtml(v.status)}</span></td>
      </tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html><head><title>Panel Vendors Report</title>
    <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:Arial,sans-serif; font-size:11px; color:#111; padding:20px; }
    h1 { font-size:16px; margin-bottom:2px; } .meta { font-size:11px; color:#555; margin-bottom:16px; }
    table { width:100%; border-collapse:collapse; } th { background:#4c1d95; color:#fff; padding:7px 8px; text-align:left; font-size:10px; text-transform:uppercase; }
    td { padding:6px 8px; border-bottom:1px solid #e2e8f0; vertical-align:top; } tr:nth-child(even) td { background:#faf5ff; }
    .capitalize { text-transform:capitalize; } a { color:#7c3aed; }
    .badge { padding:2px 6px; border-radius:4px; font-size:9px; font-weight:600; text-transform:uppercase; }
    .badge-green { background:#dcfce7; color:#15803d; } .badge-red { background:#fef2f2; color:#dc2626; }
    .footer { margin-top:16px; font-size:10px; color:#888; text-align:center; border-top:1px solid #e2e8f0; padding-top:8px; }
    </style></head><body>
    <h1>Panel Vendors Report</h1>
    <p class="meta"><strong>Total:</strong> ${filtered.length} &nbsp; <strong>Active:</strong> ${activeCount} &nbsp; <strong>Total Wallet:</strong> PKR ${totalWallet.toLocaleString()} &nbsp; <strong>Total Packages:</strong> ${totalPackages} &nbsp; <strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <table><thead><tr><th>Name</th><th>Phone</th><th>Service</th><th>Wallet Balance (PKR)</th><th>Panel URL</th><th>Panel Username</th><th>Packages</th><th>Payable (PKR)</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p class="footer">NetSphere Enterprise — Panel Vendors Report</p></body></html>`;
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) return;
    win.document.write(html); win.document.close(); win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  return (
    <div className="space-y-4 page-fade-in" data-testid="tab-content-panel-vendors">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="vendor-stat-card stat-purple p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Panel Vendors</p>
              <p className="text-2xl font-bold mt-1">{panelVendors.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
              <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="vendor-stat-card stat-green p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Active</p>
              <p className="text-2xl font-bold mt-1">{activeCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="vendor-stat-card stat-blue p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Wallet</p>
              <p className="text-lg font-bold mt-1">{formatPKR(totalWallet)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">combined balance</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="vendor-stat-card stat-amber p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Packages</p>
              <p className="text-2xl font-bold mt-1">{totalPackages}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatPKR(totalPayable)} payable</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
              <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="vendor-filter-bar">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search panel vendors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-search-panel-vendors" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]" data-testid="select-panel-status-filter"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortField} onValueChange={v => { setSortField(v); setSortDir("asc"); }}>
              <SelectTrigger className="w-[140px]" data-testid="select-panel-sort-field"><SelectValue placeholder="Sort By" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="wallet">Wallet Balance</SelectItem>
                <SelectItem value="payable">Payable Amount</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")} data-testid="button-panel-toggle-sort">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1" />{sortDir === "asc" ? "A→Z" : "Z→A"}
            </Button>
            <Button size="sm" variant="outline" onClick={exportCSV} data-testid="button-export-panel-csv"><Download className="h-3.5 w-3.5 mr-1" />Export CSV</Button>
            <Button size="sm" variant="outline" onClick={generatePDF} data-testid="button-generate-panel-pdf"><FileText className="h-3.5 w-3.5 mr-1" />Generate PDF</Button>
            {canCreate("vendors") && (
              <Button size="sm" className="btn-vendor-primary no-default-hover-elevate no-default-active-elevate" onClick={() => changeTab("add")} data-testid="button-add-panel-vendor">
                <Plus className="h-3.5 w-3.5 mr-1" />Add Panel Vendor
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span>Showing {filtered.length} of {panelVendors.length} panel vendors</span>
        {(search || statusFilter !== "all") && (
          <Button size="sm" variant="ghost" onClick={() => { setSearch(""); setStatusFilter("all"); }} data-testid="button-clear-panel-filters">Clear Filters</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Globe className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No panel vendors found</p>
              <p className="text-sm mt-1">Add your first panel vendor to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="vendor-table-enterprise">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Service</TableHead>
                    <TableHead className="hidden md:table-cell">Wallet Balance</TableHead>
                    <TableHead className="hidden lg:table-cell">Panel URL</TableHead>
                    <TableHead className="hidden lg:table-cell">Packages</TableHead>
                    <TableHead className="hidden xl:table-cell">Payable Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(vendor => {
                    const pkgs = getVendorPackages(vendor.id);
                    const payable = getVendorTotalPayable(vendor.id);
                    return (
                      <TableRow key={vendor.id} data-testid={`row-panel-vendor-${vendor.id}`}>
                        <TableCell>
                          <div className="font-medium">{vendor.name}</div>
                          {vendor.contactPerson && <div className="text-xs text-muted-foreground">{vendor.contactPerson}</div>}
                          {vendor.city && <div className="text-xs text-muted-foreground">{vendor.city}</div>}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{vendor.phone}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs capitalize">{vendor.serviceType}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div>
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">{formatPKR(vendor.walletBalance)}</span>
                            <span className="text-[10px] text-muted-foreground block">wallet balance</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {vendor.panelUrl ? (
                            <div>
                              <a href={vendor.panelUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block max-w-[160px]" title={vendor.panelUrl}>{vendor.panelUrl}</a>
                              {vendor.panelUsername && <span className="text-[10px] text-muted-foreground">{vendor.panelUsername}</span>}
                            </div>
                          ) : <span className="text-xs text-muted-foreground">Not set</span>}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="no-default-active-elevate text-[10px]"><Package className="h-3 w-3 mr-0.5" />{pkgs.length}</Badge>
                            {pkgs.length > 0 && <span className="text-[10px] text-muted-foreground truncate max-w-[80px]" title={pkgs.map(p => p.packageName).join(", ")}>{pkgs[0].packageName}{pkgs.length > 1 ? ` +${pkgs.length - 1}` : ""}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <div>
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{formatPKR(payable)}</span>
                            <span className="text-[10px] text-muted-foreground block">total pkg cost</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[vendor.status] || ""}`}>{vendor.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-panel-actions-${vendor.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setProfileVendor(vendor)} data-testid={`button-panel-view-profile-${vendor.id}`}><Eye className="h-4 w-4 mr-2" />View Profile</DropdownMenuItem>
                              {canEdit("vendors") && <DropdownMenuItem onClick={() => openEdit(vendor)} data-testid={`button-panel-edit-${vendor.id}`}><Edit className="h-4 w-4 mr-2" />Edit Profile</DropdownMenuItem>}
                              <DropdownMenuItem onClick={() => setWalletVendor(vendor)} data-testid={`button-panel-wallet-${vendor.id}`}><Wallet className="h-4 w-4 mr-2" />Wallet & Transactions</DropdownMenuItem>
                              {canDelete("vendors") && (
                                <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm(`Delete vendor "${vendor.name}"?`)) deleteMutation.mutate(vendor.id); }} data-testid={`button-panel-delete-${vendor.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Panel Vendor</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(data => { if (editingVendor) updateMutation.mutate({ id: editingVendor.id, data }); })} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input data-testid="input-panel-edit-name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input data-testid="input-panel-edit-contact" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input data-testid="input-panel-edit-phone" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input data-testid="input-panel-edit-email" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="panelUrl" render={({ field }) => (<FormItem><FormLabel>Panel URL</FormLabel><FormControl><Input placeholder="https://panel.example.com" data-testid="input-panel-edit-url" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="panelUsername" render={({ field }) => (<FormItem><FormLabel>Panel Username</FormLabel><FormControl><Input data-testid="input-panel-edit-username" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="walletBalance" render={({ field }) => (<FormItem><FormLabel>Wallet Balance (PKR)</FormLabel><FormControl><Input type="number" data-testid="input-panel-edit-wallet" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="serviceType" render={({ field }) => (<FormItem><FormLabel>Service Type</FormLabel><Select onValueChange={field.onChange} value={field.value || "fiber"}><FormControl><SelectTrigger data-testid="select-panel-edit-service"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="fiber">Fiber</SelectItem><SelectItem value="wireless">Wireless</SelectItem><SelectItem value="cable">Cable</SelectItem><SelectItem value="satellite">Satellite</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g. Lahore" data-testid="input-panel-edit-city" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="bankName" render={({ field }) => (<FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g. HBL" data-testid="input-panel-edit-bank" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bankAccountTitle" render={({ field }) => (<FormItem><FormLabel>Account Title</FormLabel><FormControl><Input data-testid="input-panel-edit-bank-title" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bankAccountNumber" render={({ field }) => (<FormItem><FormLabel>Account No / IBAN</FormLabel><FormControl><Input data-testid="input-panel-edit-bank-number" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="contractStartDate" render={({ field }) => (<FormItem><FormLabel>Contract Start</FormLabel><FormControl><Input type="date" data-testid="input-panel-edit-contract-start" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="contractEndDate" render={({ field }) => (<FormItem><FormLabel>Contract End</FormLabel><FormControl><Input type="date" data-testid="input-panel-edit-contract-end" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value || "active"}><FormControl><SelectTrigger data-testid="select-panel-edit-status"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-panel-update-vendor">{updateMutation.isPending ? "Updating..." : "Update Vendor"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!profileVendor} onOpenChange={open => { if (!open) setProfileVendor(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />Vendor Profile</DialogTitle></DialogHeader>
          {profileVendor && (() => {
            const pkgs = getVendorPackages(profileVendor.id);
            return (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">{profileVendor.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <h3 className="text-lg font-semibold">{profileVendor.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950">Panel</Badge>
                      <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[profileVendor.status] || ""}`}>{profileVendor.status}</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {profileVendor.contactPerson && <div className="text-sm"><span className="text-muted-foreground text-xs block">Contact</span>{profileVendor.contactPerson}</div>}
                  <div className="text-sm"><span className="text-muted-foreground text-xs block">Phone</span>{profileVendor.phone}</div>
                  {profileVendor.email && <div className="text-sm"><span className="text-muted-foreground text-xs block">Email</span>{profileVendor.email}</div>}
                  <div className="text-sm"><span className="text-muted-foreground text-xs block">Service Type</span><span className="capitalize">{profileVendor.serviceType}</span></div>
                  {profileVendor.city && <div className="text-sm"><span className="text-muted-foreground text-xs block">City</span>{profileVendor.city}</div>}
                  {profileVendor.ntn && <div className="text-sm"><span className="text-muted-foreground text-xs block">NTN</span>{profileVendor.ntn}</div>}
                  {(profileVendor.bankName || profileVendor.bankAccountNumber) && (
                    <div className="text-sm space-y-0.5"><span className="text-muted-foreground text-xs block">Bank</span>{profileVendor.bankName && <div>{profileVendor.bankName}</div>}{profileVendor.bankAccountTitle && <div className="text-xs text-muted-foreground">{profileVendor.bankAccountTitle}</div>}{profileVendor.bankAccountNumber && <div className="font-mono text-xs">{profileVendor.bankAccountNumber}</div>}</div>
                  )}
                </div>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Wallet className="h-4 w-4" />Panel Details</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-sm"><span className="text-muted-foreground text-xs block">Wallet Balance</span><span className="font-semibold text-purple-600 dark:text-purple-400">{formatPKR(profileVendor.walletBalance)}</span></div>
                      {profileVendor.panelUrl && <div className="text-sm"><span className="text-muted-foreground text-xs block">Panel URL</span><a href={profileVendor.panelUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-xs">{profileVendor.panelUrl}</a></div>}
                      {profileVendor.panelUsername && <div className="text-sm"><span className="text-muted-foreground text-xs block">Panel Username</span>{profileVendor.panelUsername}</div>}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Package className="h-4 w-4" />Packages ({pkgs.length})</CardTitle></CardHeader>
                  <CardContent>
                    {pkgs.length === 0 ? <p className="text-xs text-muted-foreground text-center py-3">No packages assigned</p> : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader><TableRow><TableHead className="text-xs">Package</TableHead><TableHead className="text-xs">Speed</TableHead><TableHead className="text-xs">Vendor Price</TableHead><TableHead className="text-xs">ISP Price</TableHead><TableHead className="text-xs">Margin</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {pkgs.map(pkg => (
                              <TableRow key={pkg.id}>
                                <TableCell className="text-sm font-medium">{pkg.packageName}</TableCell>
                                <TableCell className="text-sm">{pkg.speed || "N/A"}</TableCell>
                                <TableCell className="text-sm">{formatPKR(pkg.vendorPrice)}</TableCell>
                                <TableCell className="text-sm">{formatPKR(pkg.ispSellingPrice)}</TableCell>
                                <TableCell className="text-sm text-green-600 dark:text-green-400 font-medium">{formatPKR(Number(pkg.ispSellingPrice || 0) - Number(pkg.vendorPrice || 0))}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileVendor(null)}>Close</Button>
            <Button onClick={() => { if (profileVendor) { openEdit(profileVendor); setProfileVendor(null); } }} data-testid="button-panel-profile-edit"><Edit className="h-4 w-4 mr-1" />Edit Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!walletVendor} onOpenChange={open => { if (!open) setWalletVendor(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Wallet & Transactions — {walletVendor?.name}</DialogTitle></DialogHeader>
          {walletVendor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card><CardContent className="pt-4 pb-3 px-4"><div className="flex items-center gap-2"><div className="p-2 rounded-md bg-purple-50 dark:bg-purple-950"><Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" /></div><div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Balance</p><p className="text-lg font-bold">{formatPKR(walletVendor.walletBalance)}</p></div></div></CardContent></Card>
                <Card><CardContent className="pt-4 pb-3 px-4"><div className="flex items-center gap-2"><div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950"><Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div><div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Transactions</p><p className="text-lg font-bold">{(walletTransactions || []).length}</p></div></div></CardContent></Card>
              </div>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Transaction History</CardTitle></CardHeader>
                <CardContent>
                  {(walletTransactions || []).length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm"><Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No transactions yet</p></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Amount</TableHead><TableHead className="text-xs">Balance After</TableHead><TableHead className="text-xs">Note</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {(walletTransactions || []).map(txn => (
                            <TableRow key={txn.id}>
                              <TableCell className="text-xs">{txn.createdAt ? new Date(txn.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                              <TableCell><Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${txn.type === "recharge" ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" : "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950"}`}>{txn.type === "recharge" ? <><ArrowDownLeft className="h-3 w-3 mr-0.5" />Recharge</> : <><ArrowUpRight className="h-3 w-3 mr-0.5" />Deduct</>}</Badge></TableCell>
                              <TableCell className={`text-sm font-medium ${txn.type === "recharge" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{txn.type === "recharge" ? "+" : "-"}{formatPKR(txn.amount)}</TableCell>
                              <TableCell className="text-sm">{formatPKR(txn.balanceAfter)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{txn.description || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalletVendor(null)}>Close</Button>
            <Button onClick={() => { setWalletVendor(null); changeTab("wallet"); }} data-testid="button-panel-go-wallet-tab"><Wallet className="h-4 w-4 mr-1" />Manage Wallet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VendorPackagesTab() {
  const { toast } = useToast();
  const [vendorFilter, setVendorFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<VendorPackage | null>(null);
  const [pkgSearch, setPkgSearch] = useState("");
  const [pkgStatusFilter, setPkgStatusFilter] = useState("all");

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: packages, isLoading } = useQuery<VendorPackage[]>({
    queryKey: ["/api/vendor-packages"],
  });

  const form = useForm<InsertVendorPackage>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      vendorId: 0,
      packageName: "",
      speed: "",
      vendorPrice: "0",
      ispSellingPrice: "0",
      resellerPrice: "0",
      dataLimit: "",
      validity: "30 days",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertVendorPackage) => {
      const res = await apiRequest("POST", "/api/vendor-packages", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-packages"] });
      setDialogOpen(false);
      setEditingPkg(null);
      form.reset();
      toast({ title: "Package created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertVendorPackage> }) => {
      const res = await apiRequest("PATCH", `/api/vendor-packages/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-packages"] });
      setDialogOpen(false);
      setEditingPkg(null);
      form.reset();
      toast({ title: "Package updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/vendor-packages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-packages"] });
      toast({ title: "Package deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/vendor-packages/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-packages"] });
      toast({ title: "Package status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const duplicatePackage = (pkg: VendorPackage) => {
    setEditingPkg(null);
    form.reset({
      vendorId: pkg.vendorId,
      packageName: pkg.packageName + " (Copy)",
      speed: pkg.speed || "",
      vendorPrice: pkg.vendorPrice || "0",
      ispSellingPrice: pkg.ispSellingPrice || "0",
      resellerPrice: pkg.resellerPrice || "0",
      dataLimit: pkg.dataLimit || "",
      validity: pkg.validity || "30 days",
    });
    setDialogOpen(true);
  };

  const exportPackagesCSV = () => {
    if (filtered.length === 0) return;
    const headers = ["Package Name", "Vendor", "Speed", "Vendor Price", "ISP Selling Price", "Reseller Price", "ISP Margin", "Data Limit", "Validity", "Status"];
    const rows = filtered.map(p => [
      p.packageName, vendorMap[p.vendorId] || "Unknown", p.speed || "", p.vendorPrice || "0",
      p.ispSellingPrice || "0", p.resellerPrice || "0", String(calcMargin(p.ispSellingPrice, p.vendorPrice)),
      p.dataLimit || "Unlimited", p.validity || "30 days", p.isActive ? "Active" : "Inactive"
    ]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendor_packages_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePackagesPDF = () => {
    if (filtered.length === 0) return;
    const rows = filtered.map(p => {
      const margin = calcMargin(p.ispSellingPrice, p.vendorPrice);
      return `<tr>
        <td>${escHtml(p.packageName)}</td>
        <td>${escHtml(vendorMap[p.vendorId] || "Unknown")}</td>
        <td>${escHtml(p.speed || "—")}</td>
        <td>${formatPKR(p.vendorPrice)}</td>
        <td>${formatPKR(p.ispSellingPrice)}</td>
        <td>${formatPKR(p.resellerPrice)}</td>
        <td class="${margin >= 0 ? "text-green" : "text-red"}">${formatPKR(margin)}</td>
        <td>${escHtml(p.dataLimit || "Unlimited")}</td>
        <td>${escHtml(p.validity || "30 days")}</td>
        <td><span class="badge ${p.isActive ? "badge-green" : "badge-red"}">${p.isActive ? "Active" : "Inactive"}</span></td>
      </tr>`;
    }).join("");
    const totalMargin = filtered.reduce((sum, p) => sum + calcMargin(p.ispSellingPrice, p.vendorPrice), 0);
    const html = `<!DOCTYPE html><html><head><title>Vendor Packages Report</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 20px; }
      h1 { font-size: 16px; margin-bottom: 2px; }
      .meta { font-size: 11px; color: #555; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #1e293b; color: #fff; padding: 7px 6px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
      td { padding: 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
      tr:nth-child(even) td { background: #f8fafc; }
      .text-green { color: #15803d; font-weight: 600; }
      .text-red { color: #dc2626; font-weight: 600; }
      .badge { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
      .badge-green { background: #dcfce7; color: #15803d; }
      .badge-red { background: #fef2f2; color: #dc2626; }
      .footer { margin-top: 16px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
      @media print { body { padding: 10mm; } }
    </style></head><body>
    <h1>Vendor Packages Report</h1>
    <p class="meta">
      <strong>Total:</strong> ${filtered.length} packages &nbsp;&nbsp;
      <strong>Active:</strong> ${filtered.filter(p => p.isActive).length} &nbsp;&nbsp;
      <strong>Total ISP Margin:</strong> ${formatPKR(totalMargin)} &nbsp;&nbsp;
      <strong>Generated:</strong> ${new Date().toLocaleString()}
    </p>
    <table>
      <thead><tr>
        <th>Package</th><th>Vendor</th><th>Speed</th><th>Vendor Price</th><th>ISP Price</th>
        <th>Reseller Price</th><th>ISP Margin</th><th>Data Limit</th><th>Validity</th><th>Status</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="footer">NetSphere Enterprise — Vendor Packages Report</p>
    </body></html>`;
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const openCreate = () => {
    setEditingPkg(null);
    form.reset({
      vendorId: 0,
      packageName: "",
      speed: "",
      vendorPrice: "0",
      ispSellingPrice: "0",
      resellerPrice: "0",
      dataLimit: "",
      validity: "30 days",
    });
    setDialogOpen(true);
  };

  const openEdit = (pkg: VendorPackage) => {
    setEditingPkg(pkg);
    form.reset({
      vendorId: pkg.vendorId,
      packageName: pkg.packageName,
      speed: pkg.speed || "",
      vendorPrice: pkg.vendorPrice || "0",
      ispSellingPrice: pkg.ispSellingPrice || "0",
      resellerPrice: pkg.resellerPrice || "0",
      dataLimit: pkg.dataLimit || "",
      validity: pkg.validity || "30 days",
    });
    setDialogOpen(true);
  };

  const vendorMap = (vendors || []).reduce((acc, v) => {
    acc[v.id] = v.name;
    return acc;
  }, {} as Record<number, string>);

  const filtered = (packages || []).filter((p) => {
    const matchVendor = vendorFilter === "all" || String(p.vendorId) === vendorFilter;
    const matchSearch = !pkgSearch || 
      p.packageName.toLowerCase().includes(pkgSearch.toLowerCase()) ||
      (p.speed || "").toLowerCase().includes(pkgSearch.toLowerCase());
    const matchStatus = pkgStatusFilter === "all" || 
      (pkgStatusFilter === "active" && p.isActive) || 
      (pkgStatusFilter === "inactive" && !p.isActive);
    return matchVendor && matchSearch && matchStatus;
  });

  const calcMargin = (selling: string | null, vendor: string | null) => {
    const s = Number(selling || 0);
    const v = Number(vendor || 0);
    return s - v;
  };

  const [bwLinkDialogOpen, setBwLinkDialogOpen] = useState(false);
  const [bwLinkEditing, setBwLinkEditing] = useState<VendorBandwidthLink | null>(null);
  const [bwVendorFilter, setBwVendorFilter] = useState("all");

  const bandwidthVendors = (vendors || []).filter(v => v.vendorType === "bandwidth");

  const { data: bwLinks } = useQuery<VendorBandwidthLink[]>({
    queryKey: ["/api/vendor-bandwidth-links"],
  });

  const filteredBwLinks = (bwLinks || []).filter(l =>
    bwVendorFilter === "all" || String(l.vendorId) === bwVendorFilter
  );

  const bwLinkForm = useForm<InsertVendorBandwidthLink>({
    defaultValues: {
      vendorId: 0,
      linkName: "",
      ipAddress: "",
      vlanDetail: "",
      city: "",
      bandwidthMbps: "0",
      bandwidthRate: "0",
      totalMonthlyCost: "0",
      notes: "",
    },
  });

  const createBwLink = useMutation({
    mutationFn: async (data: InsertVendorBandwidthLink) => {
      const res = await apiRequest("POST", "/api/vendor-bandwidth-links", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-bandwidth-links"] });
      toast({ title: "Bandwidth link created successfully" });
      setBwLinkDialogOpen(false);
      bwLinkForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateBwLink = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertVendorBandwidthLink> }) => {
      const res = await apiRequest("PATCH", `/api/vendor-bandwidth-links/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-bandwidth-links"] });
      toast({ title: "Bandwidth link updated" });
      setBwLinkDialogOpen(false);
      setBwLinkEditing(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteBwLink = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/vendor-bandwidth-links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-bandwidth-links"] });
      toast({ title: "Bandwidth link deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleBwLinkStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/vendor-bandwidth-links/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-bandwidth-links"] });
      toast({ title: "Link status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openEditBwLink = (link: VendorBandwidthLink) => {
    setBwLinkEditing(link);
    bwLinkForm.reset({
      vendorId: link.vendorId,
      linkName: link.linkName,
      ipAddress: link.ipAddress || "",
      vlanDetail: link.vlanDetail || "",
      city: link.city || "",
      bandwidthMbps: link.bandwidthMbps || "0",
      bandwidthRate: link.bandwidthRate || "0",
      totalMonthlyCost: link.totalMonthlyCost || "0",
      notes: link.notes || "",
    });
    setBwLinkDialogOpen(true);
  };

  return (
    <div className="space-y-4 page-fade-in" data-testid="tab-content-packages">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="vendor-stat-card stat-blue p-4">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Total Packages</p>
          <p className="text-2xl font-bold mt-1">{(packages || []).length}</p>
        </div>
        <div className="vendor-stat-card stat-green p-4">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Active Packages</p>
          <p className="text-2xl font-bold mt-1">{(packages || []).filter(p => p.isActive).length}</p>
        </div>
        <div className="vendor-stat-card stat-purple p-4">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Avg ISP Margin</p>
          <p className="text-2xl font-bold mt-1">{formatPKR((packages || []).length > 0 ? (packages || []).reduce((s, p) => s + (Number(p.ispSellingPrice || 0) - Number(p.vendorPrice || 0)), 0) / (packages || []).length : 0)}</p>
        </div>
        <div className="vendor-stat-card stat-amber p-4">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Total Vendor Cost</p>
          <p className="text-2xl font-bold mt-1">{formatPKR((packages || []).reduce((s, p) => s + Number(p.vendorPrice || 0), 0))}</p>
        </div>
      </div>

      <div className="vendor-filter-bar">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search packages..."
                className="pl-9 w-[200px]"
                value={pkgSearch}
                onChange={(e) => setPkgSearch(e.target.value)}
                data-testid="input-search-packages"
              />
            </div>
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="w-[220px]" data-testid="select-package-vendor-filter">
                <SelectValue placeholder="Filter by vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {(vendors || []).map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={pkgStatusFilter} onValueChange={setPkgStatusFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-package-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{filtered.length} packages</span>
            <Button size="sm" variant="outline" onClick={() => exportPackagesCSV()} data-testid="button-export-packages-csv">
              <Download className="h-3.5 w-3.5 mr-1" />
              Export CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => generatePackagesPDF()} data-testid="button-generate-packages-pdf">
              <FileText className="h-3.5 w-3.5 mr-1" />
              Generate PDF
            </Button>
            <Button className="btn-vendor-primary no-default-hover-elevate no-default-active-elevate" onClick={openCreate} data-testid="button-add-package">
              <Plus className="h-4 w-4 mr-1" />
              Add Package
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No packages found</p>
              <p className="text-sm mt-1">Add vendor packages to manage pricing</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="vendor-table-enterprise">
                <TableHeader>
                  <TableRow>
                    <TableHead>Package Name</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Speed</TableHead>
                    <TableHead>Vendor Price</TableHead>
                    <TableHead>ISP Price</TableHead>
                    <TableHead className="hidden md:table-cell">Reseller Price</TableHead>
                    <TableHead className="hidden md:table-cell">ISP Margin</TableHead>
                    <TableHead className="hidden lg:table-cell">Reseller Margin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((pkg) => (
                    <TableRow key={pkg.id} data-testid={`row-package-${pkg.id}`}>
                      <TableCell className="font-medium">{pkg.packageName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{vendorMap[pkg.vendorId] || "Unknown"}</TableCell>
                      <TableCell>{pkg.speed || "N/A"}</TableCell>
                      <TableCell>{formatPKR(pkg.vendorPrice)}</TableCell>
                      <TableCell>{formatPKR(pkg.ispSellingPrice)}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatPKR(pkg.resellerPrice)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="vendor-profit-badge">
                          {formatPKR(calcMargin(pkg.ispSellingPrice, pkg.vendorPrice))}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {pkg.resellerPrice && Number(pkg.resellerPrice) > 0 ? (
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            {formatPKR(Number(pkg.resellerPrice || 0) - Number(pkg.vendorPrice || 0))}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">N/A</span>}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`no-default-active-elevate text-[10px] ${pkg.isActive ? statusColors.active : statusColors.inactive}`}
                        >
                          {pkg.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-pkg-actions-${pkg.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(pkg)} data-testid={`button-edit-pkg-${pkg.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Package
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicatePackage(pkg)} data-testid={`button-duplicate-pkg-${pkg.id}`}>
                              <Plus className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStatusMutation.mutate({ id: pkg.id, isActive: !pkg.isActive })} data-testid={`button-toggle-pkg-${pkg.id}`}>
                              {pkg.isActive ? (
                                <><Shield className="h-4 w-4 mr-2" />Deactivate</>
                              ) : (
                                <><CheckCircle className="h-4 w-4 mr-2" />Activate</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                if (confirm(`Delete package "${pkg.packageName}"?`)) {
                                  deleteMutation.mutate(pkg.id);
                                }
                              }}
                              data-testid={`button-delete-pkg-${pkg.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPkg ? "Edit Package" : "Add Vendor Package"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => {
              if (editingPkg) {
                updateMutation.mutate({ id: editingPkg.id, data });
              } else {
                createMutation.mutate(data);
              }
            })} className="space-y-4">
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-pkg-vendor">
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(vendors || []).map((v) => (
                          <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="packageName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 10 Mbps Unlimited" data-testid="input-pkg-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="speed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Speed</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 10 Mbps" data-testid="input-pkg-speed" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Limit</FormLabel>
                      <FormControl>
                        <Input placeholder="Unlimited" data-testid="input-pkg-data-limit" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="vendorPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor Price</FormLabel>
                      <FormControl>
                        <Input type="number" data-testid="input-pkg-vendor-price" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ispSellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ISP Price</FormLabel>
                      <FormControl>
                        <Input type="number" data-testid="input-pkg-isp-price" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="resellerPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reseller Price</FormLabel>
                      <FormControl>
                        <Input type="number" data-testid="input-pkg-reseller-price" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="validity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validity</FormLabel>
                    <FormControl>
                      <Input placeholder="30 days" data-testid="input-pkg-validity" {...field} value={field.value || "30 days"} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-package">
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingPkg ? "Update Package" : "Create Package"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bandwidth Links Management Section */}
      <div className="mt-8 space-y-4">
        <div className="vendor-page-header px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Bandwidth Links & IP/VLAN Management
            </h2>
            <p className="text-sm text-white/70 mt-1">Manage bandwidth links, IP addresses, and VLAN details for bandwidth vendors</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70">{(bwLinks || []).length} links</span>
            <Button className="btn-vendor-primary no-default-hover-elevate no-default-active-elevate" onClick={() => { setBwLinkEditing(null); bwLinkForm.reset({ vendorId: 0, linkName: "", ipAddress: "", vlanDetail: "", city: "", bandwidthMbps: "0", bandwidthRate: "0", totalMonthlyCost: "0", notes: "" }); setBwLinkDialogOpen(true); }} data-testid="button-add-bandwidth-link">
              <Plus className="h-4 w-4 mr-1" />
              Add Link
            </Button>
          </div>
        </div>

        <div className="vendor-filter-bar">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={bwVendorFilter} onValueChange={setBwVendorFilter}>
                <SelectTrigger className="w-[220px]" data-testid="select-bw-vendor-filter">
                  <SelectValue placeholder="Filter by vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bandwidth Vendors</SelectItem>
                  {bandwidthVendors.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {filteredBwLinks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Wifi className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">No bandwidth links found. Add links from "Add Vendor" or click "Add Link" above.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="vendor-table-enterprise">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Link Name</TableHead>
                      <TableHead className="text-xs">Vendor</TableHead>
                      <TableHead className="text-xs">IP Address</TableHead>
                      <TableHead className="text-xs">VLAN</TableHead>
                      <TableHead className="text-xs">City</TableHead>
                      <TableHead className="text-xs">Mbps</TableHead>
                      <TableHead className="text-xs">Rate/Mbps</TableHead>
                      <TableHead className="text-xs">Monthly Cost</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBwLinks.map((link) => {
                      const vendor = (vendors || []).find(v => v.id === link.vendorId);
                      return (
                        <TableRow key={link.id} data-testid={`row-bw-link-${link.id}`}>
                          <TableCell className="text-sm font-medium">{link.linkName}</TableCell>
                          <TableCell className="text-sm">{vendor?.name || "Unknown"}</TableCell>
                          <TableCell className="text-sm font-mono">{link.ipAddress || "N/A"}</TableCell>
                          <TableCell className="text-sm">{link.vlanDetail || "N/A"}</TableCell>
                          <TableCell className="text-sm">{link.city || "N/A"}</TableCell>
                          <TableCell className="text-sm font-semibold">{link.bandwidthMbps}</TableCell>
                          <TableCell className="text-sm">{formatPKR(link.bandwidthRate)}</TableCell>
                          <TableCell className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatPKR(link.totalMonthlyCost)}</TableCell>
                          <TableCell>
                            <Badge variant={link.status === "active" ? "default" : "secondary"} className="text-[10px] no-default-active-elevate">
                              {link.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-bw-link-actions-${link.id}`}>
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditBwLink(link)} data-testid={`button-edit-bw-link-${link.id}`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Link
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleBwLinkStatus.mutate({ id: link.id, status: link.status === "active" ? "inactive" : "active" })} data-testid={`button-toggle-bw-link-${link.id}`}>
                                  {link.status === "active" ? <><Shield className="h-4 w-4 mr-2" />Deactivate</> : <><CheckCircle className="h-4 w-4 mr-2" />Activate</>}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm(`Delete link "${link.linkName}"?`)) deleteBwLink.mutate(link.id); }} data-testid={`button-delete-bw-link-${link.id}`}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredBwLinks.length > 1 && (
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell colSpan={5} className="text-xs font-bold">TOTALS</TableCell>
                        <TableCell className="text-xs font-bold">{filteredBwLinks.reduce((s, l) => s + Number(l.bandwidthMbps || 0), 0)} Mbps</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatPKR(filteredBwLinks.reduce((s, l) => s + Number(l.totalMonthlyCost || 0), 0))}</TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bandwidth Link Add/Edit Dialog */}
      <Dialog open={bwLinkDialogOpen} onOpenChange={setBwLinkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {bwLinkEditing ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {bwLinkEditing ? "Edit Bandwidth Link" : "Add New Bandwidth Link"}
            </DialogTitle>
          </DialogHeader>
          <Form {...bwLinkForm}>
            <form onSubmit={bwLinkForm.handleSubmit((data) => bwLinkEditing ? updateBwLink.mutate({ id: bwLinkEditing.id, data }) : createBwLink.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField control={bwLinkForm.control} name="vendorId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor *</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value ? String(field.value) : ""}>
                      <FormControl><SelectTrigger data-testid="select-bw-link-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {bandwidthVendors.map((v) => (
                          <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={bwLinkForm.control} name="linkName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Name *</FormLabel>
                    <FormControl><Input placeholder="e.g. Link-1 Fiber" data-testid="input-bw-link-name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField control={bwLinkForm.control} name="ipAddress" render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Address</FormLabel>
                    <FormControl><Input placeholder="e.g. 192.168.1.1/30" data-testid="input-bw-link-ip" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={bwLinkForm.control} name="vlanDetail" render={({ field }) => (
                  <FormItem>
                    <FormLabel>VLAN Detail</FormLabel>
                    <FormControl><Input placeholder="e.g. VLAN 100" data-testid="input-bw-link-vlan" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={bwLinkForm.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl><Input placeholder="e.g. Lahore" data-testid="input-bw-link-city" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField control={bwLinkForm.control} name="bandwidthMbps" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bandwidth (Mbps) *</FormLabel>
                    <FormControl><Input type="number" placeholder="0" data-testid="input-bw-link-mbps" {...field} onChange={(e) => {
                      field.onChange(e.target.value);
                      const rate = bwLinkForm.getValues("bandwidthRate");
                      bwLinkForm.setValue("totalMonthlyCost", (Number(e.target.value) * Number(rate || 0)).toFixed(2));
                    }} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={bwLinkForm.control} name="bandwidthRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate per Mbps (PKR) *</FormLabel>
                    <FormControl><Input type="number" placeholder="0" data-testid="input-bw-link-rate" {...field} onChange={(e) => {
                      field.onChange(e.target.value);
                      const mbps = bwLinkForm.getValues("bandwidthMbps");
                      bwLinkForm.setValue("totalMonthlyCost", (Number(mbps || 0) * Number(e.target.value)).toFixed(2));
                    }} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={bwLinkForm.control} name="totalMonthlyCost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Monthly Cost (PKR)</FormLabel>
                    <FormControl><Input type="number" placeholder="Auto-calculated" className="bg-muted/50 font-semibold" data-testid="input-bw-link-total" {...field} readOnly /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={bwLinkForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Input placeholder="Optional notes" data-testid="input-bw-link-notes" {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setBwLinkDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createBwLink.isPending || updateBwLink.isPending} data-testid="button-save-bw-link">
                  {(createBwLink.isPending || updateBwLink.isPending) ? "Saving..." : bwLinkEditing ? "Update Link" : "Create Link"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WalletTab() {
  const { toast } = useToast();
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [selectedVendorName, setSelectedVendorName] = useState("");
  const [selectedVendorType, setSelectedVendorType] = useState<string>("panel");
  const [txnVendorId, setTxnVendorId] = useState<string>("none");
  const [deductDialogOpen, setDeductDialogOpen] = useState(false);
  const [txnDateFrom, setTxnDateFrom] = useState("");
  const [txnDateTo, setTxnDateTo] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailTxn, setDetailTxn] = useState<VendorWalletTransaction | null>(null);
  const [walletViewFilter, setWalletViewFilter] = useState<"all" | "bandwidth" | "panel">("all");
  const [editTxnDialogOpen, setEditTxnDialogOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<VendorWalletTransaction | null>(null);
  const [bankEditMode, setBankEditMode] = useState(false);
  const [bankEditData, setBankEditData] = useState({ bankName: "", bankAccountTitle: "", bankAccountNumber: "", bankBranchCode: "" });
  const [txnBankEditMode, setTxnBankEditMode] = useState(false);
  const [txnBankEditData, setTxnBankEditData] = useState({ bankName: "", bankAccountTitle: "", bankAccountNumber: "", bankBranchCode: "" });

  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });
  const { data: allLinks } = useQuery<VendorBandwidthLink[]>({ queryKey: ["/api/vendor-bandwidth-links"] });

  const { data: transactions, isLoading: txnLoading } = useQuery<VendorWalletTransaction[]>({
    queryKey: ["/api/vendor-wallet-transactions", txnVendorId],
    enabled: txnVendorId !== "none",
    queryFn: async () => {
      if (txnVendorId === "none") return [];
      const endpoint = txnVendorId === "all"
        ? "/api/vendor-wallet-transactions/all"
        : `/api/vendor-wallet-transactions/${txnVendorId}`;
      const res = await fetch(endpoint, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const rechargeForm = useForm<z.infer<typeof rechargeSchema>>({
    resolver: zodResolver(rechargeSchema),
    defaultValues: {
      vendorId: 0,
      amount: "",
      paymentMethod: "",
      performedBy: "",
      approvedBy: "",
      notes: "",
      reference: "",
    },
  });

  const rechargeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof rechargeSchema>) => {
      const res = await apiRequest("POST", "/api/vendor-wallet/recharge", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-wallet-transactions"] });
      if (txnVendorId !== "none") {
        queryClient.invalidateQueries({ queryKey: ["/api/vendor-wallet-transactions", txnVendorId] });
      }
      setRechargeDialogOpen(false);
      rechargeForm.reset();
      toast({ title: selectedVendorType === "bandwidth" ? "Payment sent successfully" : "Wallet recharged successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deductForm = useForm<z.infer<typeof deductSchema>>({
    resolver: zodResolver(deductSchema),
    defaultValues: {
      vendorId: 0,
      amount: "",
      reason: "",
      performedBy: "",
      approvedBy: "",
      notes: "",
      reference: "",
    },
  });

  const deductMutation = useMutation({
    mutationFn: async (data: z.infer<typeof deductSchema>) => {
      const res = await apiRequest("POST", "/api/vendor-wallet/deduct", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-wallet-transactions"] });
      if (txnVendorId !== "none") {
        queryClient.invalidateQueries({ queryKey: ["/api/vendor-wallet-transactions", txnVendorId] });
      }
      setDeductDialogOpen(false);
      deductForm.reset();
      toast({ title: selectedVendorType === "bandwidth" ? "Refund processed successfully" : "Wallet deducted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const editTxnForm = useForm({
    defaultValues: {
      amount: "",
      paymentMethod: "",
      performedBy: "",
      approvedBy: "",
      notes: "",
      reason: "",
    },
  });

  const editTxnMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, string> }) => {
      const res = await apiRequest("PATCH", `/api/vendor-wallet-transactions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-wallet-transactions"] });
      if (txnVendorId !== "none") {
        queryClient.invalidateQueries({ queryKey: ["/api/vendor-wallet-transactions", txnVendorId] });
      }
      setEditTxnDialogOpen(false);
      setEditingTxn(null);
      toast({ title: "Transaction updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const saveBankDetailsMutation = useMutation({
    mutationFn: async ({ vendorId, data }: { vendorId: number; data: Record<string, string> }) => {
      const res = await apiRequest("PATCH", `/api/vendors/${vendorId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setBankEditMode(false);
      setTxnBankEditMode(false);
      toast({ title: "Bank details updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openEditTxn = (txn: VendorWalletTransaction) => {
    setEditingTxn(txn);
    editTxnForm.reset({
      amount: txn.amount || "",
      paymentMethod: txn.paymentMethod || "",
      performedBy: txn.performedBy || "",
      approvedBy: txn.approvedBy || "",
      notes: txn.notes || "",
      reason: txn.reason || "",
    });
    setEditTxnDialogOpen(true);
  };

  const allVendorsList = vendors || [];
  const panelVendors = allVendorsList.filter((v) => v.vendorType === "panel");
  const bandwidthVendors = allVendorsList.filter((v) => v.vendorType === "bandwidth");
  const walletVendors = walletViewFilter === "all" ? [...panelVendors, ...bandwidthVendors] : walletViewFilter === "panel" ? panelVendors : bandwidthVendors;

  const getVendorLinks = (vendorId: number) => (allLinks || []).filter(l => l.vendorId === vendorId && l.status === "active");
  const getVendorTotalMonthlyDues = (vendorId: number) => getVendorLinks(vendorId).reduce((s, l) => s + Number(l.totalMonthlyCost || 0), 0);

  const isRecharge = (type: string) => type === "credit" || type === "recharge";
  const totalRecharges = (transactions || []).filter(t => isRecharge(t.type)).reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalDeductions = (transactions || []).filter(t => !isRecharge(t.type)).reduce((s, t) => s + Number(t.amount || 0), 0);

  const filteredTransactions = (transactions || []).filter(txn => {
    if (!txnDateFrom && !txnDateTo) return true;
    const txnDate = txn.createdAt ? new Date(txn.createdAt) : null;
    if (!txnDate) return true;
    if (txnDateFrom && txnDate < new Date(txnDateFrom)) return false;
    if (txnDateTo && txnDate > new Date(txnDateTo + "T23:59:59")) return false;
    return true;
  });

  const buildVendorSlipHtml = (txnList: typeof filteredTransactions, vendor?: typeof txnVendor) => {
    const slips = txnList.map((txn) => {
      const isCredit = isRecharge(txn.type);
      const txnLabel = isCredit ? (isTxnVendorBandwidth ? "Payment" : "Recharge") : (isTxnVendorBandwidth ? "Refund" : "Deduction");
      return `
        <div class="slip">
          <div class="slip-header">
            <h2>Vendor Transaction Slip</h2>
            <span class="slip-id">${txn.reference || `TXN-${txn.id}`}</span>
          </div>
          ${vendor ? `<div class="vendor-info"><b>${vendor.name}</b> &mdash; ${vendor.vendorType}</div>` : ""}
          <table>
            <tr><td>Type</td><td><b>${txnLabel}</b></td></tr>
            <tr><td>Amount</td><td><b style="color:${isCredit ? "green" : "red"}">${isCredit ? "+" : "-"}${formatPKR(txn.amount)}</b></td></tr>
            <tr><td>Balance After</td><td>${formatPKR(txn.balanceAfter)}</td></tr>
            <tr><td>Date / Time</td><td>${txn.createdAt ? new Date(txn.createdAt).toLocaleString() : "N/A"}</td></tr>
            ${txn.paymentMethod ? `<tr><td>Payment Method</td><td>${txn.paymentMethod.replace(/_/g, " ")}</td></tr>` : ""}
            ${vendor && (vendor.bankName || vendor.bankAccountNumber) ? `<tr><td>Bank Account</td><td>${vendor.bankName || ""}${vendor.bankAccountNumber ? ` — ${vendor.bankAccountNumber}` : ""}</td></tr>` : ""}
            ${txn.performedBy ? `<tr><td>Performed By</td><td>${txn.performedBy}</td></tr>` : ""}
            ${txn.approvedBy ? `<tr><td>Approved By</td><td>${txn.approvedBy}</td></tr>` : ""}
            ${txn.description ? `<tr><td>Description</td><td>${txn.description}</td></tr>` : ""}
            ${txn.notes ? `<tr><td>Notes</td><td>${txn.notes}</td></tr>` : ""}
          </table>
          <div class="slip-footer">NetSphere Enterprise &mdash; Printed on ${new Date().toLocaleString()}</div>
        </div>`;
    }).join('<div class="page-break"></div>');
    return `<!DOCTYPE html><html><head><title>Vendor Transaction Slips</title><style>
      body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; }
      .slip { padding: 24px; max-width: 480px; margin: 0 auto; border: 1px solid #ccc; border-radius: 8px; margin-bottom: 24px; }
      .slip-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
      .slip-header h2 { margin: 0; font-size: 16px; }
      .slip-id { font-family: monospace; font-size: 12px; color: #555; }
      .vendor-info { font-size: 11px; color: #444; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 5px 2px; vertical-align: top; }
      td:first-child { color: #666; width: 42%; }
      .slip-footer { margin-top: 14px; border-top: 1px solid #eee; padding-top: 8px; font-size: 10px; color: #888; text-align: center; }
      .page-break { page-break-after: always; }
      @media print { body { margin: 10mm; } .slip { border: none; } }
    </style></head><body>${slips}</body></html>`;
  };

  const printVendorSlip = (txn: typeof filteredTransactions[0]) => {
    const win = window.open("", "_blank", "width=600,height=700");
    if (!win) return;
    win.document.write(buildVendorSlipHtml([txn], txnVendor));
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  const printAllVendorSlips = () => {
    if (!filteredTransactions.length) return;
    const win = window.open("", "_blank", "width=700,height=800");
    if (!win) return;
    win.document.write(buildVendorSlipHtml(filteredTransactions, txnVendor));
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  const openRecharge = (vendorId: number, vendorName: string, vendorType: string) => {
    setSelectedVendorId(vendorId);
    setSelectedVendorName(vendorName);
    setSelectedVendorType(vendorType);
    setBankEditMode(false);
    rechargeForm.reset({ vendorId, amount: "", paymentMethod: "", performedBy: "", approvedBy: "", notes: "", reference: "" });
    setRechargeDialogOpen(true);
  };

  const openDeduct = (vendorId: number, vendorName: string, vendorType: string) => {
    setSelectedVendorId(vendorId);
    setSelectedVendorName(vendorName);
    setSelectedVendorType(vendorType);
    deductForm.reset({ vendorId, amount: "", reason: "", performedBy: "", approvedBy: "", notes: "", reference: "" });
    setDeductDialogOpen(true);
  };

  const isBandwidthSelected = selectedVendorType === "bandwidth";
  const selectedVendor = selectedVendorId ? allVendorsList.find(v => v.id === selectedVendorId) : null;
  const txnVendor = (txnVendorId !== "none" && txnVendorId !== "all") ? allVendorsList.find(v => String(v.id) === txnVendorId) : null;
  const isTxnVendorBandwidth = txnVendor?.vendorType === "bandwidth";

  const totalWalletBalance = walletVendors.reduce((s, v) => s + Number(v.walletBalance || 0), 0);
  const totalMonthlyDues = bandwidthVendors.reduce((s, v) => s + getVendorTotalMonthlyDues(v.id), 0);

  return (
    <div className="space-y-6 page-fade-in" data-testid="tab-content-wallet">
      <div className="vendor-wallet-hero px-6 py-6 text-white">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-5 w-5 text-white/80" />
                <h2 className="text-lg font-bold">Vendor Wallet & Billing</h2>
              </div>
              <p className="text-sm text-white/60">Manage wallet balances, billing & dues for all vendors</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-white/60 uppercase tracking-wider">Total Balance</p>
                <p className="text-2xl font-bold" data-testid="text-total-wallet-balance">{formatPKR(totalWalletBalance)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60 uppercase tracking-wider">Monthly Dues</p>
                <p className="text-2xl font-bold" data-testid="text-total-monthly-dues">{formatPKR(totalMonthlyDues)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60 uppercase tracking-wider">Vendors</p>
                <p className="text-2xl font-bold">{walletVendors.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant={walletViewFilter === "all" ? "default" : "outline"} onClick={() => setWalletViewFilter("all")} data-testid="button-filter-all">All Vendors ({panelVendors.length + bandwidthVendors.length})</Button>
        <Button size="sm" variant={walletViewFilter === "bandwidth" ? "default" : "outline"} onClick={() => setWalletViewFilter("bandwidth")} data-testid="button-filter-bandwidth">Bandwidth ({bandwidthVendors.length})</Button>
        <Button size="sm" variant={walletViewFilter === "panel" ? "default" : "outline"} onClick={() => setWalletViewFilter("panel")} data-testid="button-filter-panel">Panel ({panelVendors.length})</Button>
      </div>

      {vendorsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : walletVendors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Wallet className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No vendors found</p>
            <p className="text-sm mt-1">Add vendors to manage wallets and billing</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {walletVendors.map((vendor) => {
            const isBandwidth = vendor.vendorType === "bandwidth";
            const vendorLinks = getVendorLinks(vendor.id);
            const monthlyDues = getVendorTotalMonthlyDues(vendor.id);
            const balance = Number(vendor.walletBalance || 0);

            return (
              <Card key={vendor.id} className={`overflow-hidden ${isBandwidth ? "border-blue-200 dark:border-blue-800" : "border-purple-200 dark:border-purple-800"}`} data-testid={`card-wallet-${vendor.id}`}>
                <div className={`px-4 py-2 ${isBandwidth ? "bg-blue-50 dark:bg-blue-950" : "bg-purple-50 dark:bg-purple-950"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold">{vendor.name}</span>
                    <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${isBandwidth ? "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900" : "text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900"}`}>{isBandwidth ? "Bandwidth" : "Panel"}</Badge>
                  </div>
                </div>
                <CardContent className="pt-3 pb-4 px-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Wallet Balance</span>
                    <span className={`font-semibold text-lg ${balance > 0 ? "text-green-600 dark:text-green-400" : balance < 0 ? "text-red-600 dark:text-red-400" : ""}`}>{formatPKR(balance)}</span>
                  </div>
                  {isBandwidth && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Monthly Dues</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">{formatPKR(monthlyDues)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Active Links</span>
                        <span className="text-sm font-medium">{vendorLinks.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Bandwidth</span>
                        <span className="text-sm font-medium">{vendorLinks.reduce((s, l) => s + Number(l.bandwidthMbps || 0), 0)} Mbps</span>
                      </div>
                    </>
                  )}
                  {!isBandwidth && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Payable Amount</span>
                        <span className="text-sm font-medium">{formatPKR(vendor.payableAmount)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{isBandwidth ? "Last Payment" : "Last Recharge"}</span>
                    <span className="text-sm">{vendor.lastRechargeDate ? new Date(vendor.lastRechargeDate).toLocaleDateString() : "Never"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      className="btn-vendor-primary no-default-hover-elevate no-default-active-elevate"
                      onClick={() => openRecharge(vendor.id, vendor.name, vendor.vendorType)}
                      data-testid={`button-recharge-${vendor.id}`}
                    >
                      <ArrowDownLeft className="h-4 w-4 mr-1" />
                      {isBandwidth ? "Send Payment" : "Recharge"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openDeduct(vendor.id, vendor.name, vendor.vendorType)}
                      data-testid={`button-deduct-${vendor.id}`}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      {isBandwidth ? "Refund" : "Deduct"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {txnVendorId !== "none" && transactions && transactions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="vendor-stat-card stat-green p-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold">{isTxnVendorBandwidth ? "Total Payments" : "Total Recharges"}</p>
            <p className="text-xl font-bold mt-1 vendor-ledger-credit">{formatPKR(totalRecharges)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{(transactions || []).filter(t => isRecharge(t.type)).length} transactions</p>
          </div>
          <div className="vendor-stat-card stat-rose p-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold">{isTxnVendorBandwidth ? "Total Refunds" : "Total Deductions"}</p>
            <p className="text-xl font-bold mt-1 vendor-ledger-debit">{formatPKR(totalDeductions)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{(transactions || []).filter(t => !isRecharge(t.type)).length} transactions</p>

          </div>
          <div className="vendor-stat-card stat-blue p-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Net Flow</p>
            <p className="text-xl font-bold mt-1">{formatPKR(totalRecharges - totalDeductions)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{isTxnVendorBandwidth ? "Payments - Refunds" : "Recharges - Deductions"}</p>
          </div>
          <div className="vendor-stat-card stat-purple p-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Total Transactions</p>
            <p className="text-xl font-bold mt-1">{(transactions || []).length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">All time</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">Transaction History</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {filteredTransactions.length > 0 && (
                <Button variant="outline" size="sm" onClick={printAllVendorSlips} data-testid="button-print-all-vendor-slips">
                  <Printer className="h-4 w-4 mr-1" />
                  Print All Slips
                </Button>
              )}
              <Select value={txnVendorId} onValueChange={(v) => { setTxnVendorId(v); setTxnBankEditMode(false); }}>
                <SelectTrigger className="w-[220px]" data-testid="select-wallet-vendor">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select Vendor</SelectItem>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {[...panelVendors, ...bandwidthVendors].map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>{v.name} ({v.vendorType})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" className="w-[150px]" value={txnDateFrom} onChange={(e) => setTxnDateFrom(e.target.value)} placeholder="From" data-testid="input-txn-date-from" />
              <Input type="date" className="w-[150px]" value={txnDateTo} onChange={(e) => setTxnDateTo(e.target.value)} placeholder="To" data-testid="input-txn-date-to" />
              {(txnDateFrom || txnDateTo) && (
                <Button size="sm" variant="ghost" onClick={() => { setTxnDateFrom(""); setTxnDateTo(""); }} data-testid="button-clear-date-filter">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {txnVendor && (
            <div className="mx-4 mt-3 mb-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 p-3 space-y-2" data-testid="txn-vendor-bank-details">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Payment Transfer Details
                </p>
                {!txnBankEditMode ? (
                  <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs text-blue-600 dark:text-blue-400" onClick={() => { setTxnBankEditMode(true); setTxnBankEditData({ bankName: txnVendor.bankName || "", bankAccountTitle: txnVendor.bankAccountTitle || "", bankAccountNumber: txnVendor.bankAccountNumber || "", bankBranchCode: txnVendor.bankBranchCode || "" }); }} data-testid="button-txn-edit-bank">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setTxnBankEditMode(false)} data-testid="button-txn-cancel-bank-edit">Cancel</Button>
                    <Button type="button" size="sm" className="h-6 px-2 text-xs" disabled={saveBankDetailsMutation.isPending} onClick={() => { if (txnVendor) saveBankDetailsMutation.mutate({ vendorId: txnVendor.id, data: txnBankEditData }); }} data-testid="button-txn-save-bank">
                      {saveBankDetailsMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                <div><span className="text-muted-foreground">Vendor:</span> <span className="font-medium">{txnVendor.name}</span></div>
                <div><span className="text-muted-foreground">Type:</span> <span className="font-medium capitalize">{txnVendor.vendorType}</span></div>
                <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{txnVendor.phone || "—"}</span></div>
                <div><span className="text-muted-foreground">Wallet Balance:</span> <span className="font-medium">{formatPKR(txnVendor.walletBalance)}</span></div>
              </div>
              <div className="border-t border-blue-200 dark:border-blue-800 pt-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Bank Account</p>
                {txnBankEditMode ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Bank Name</label>
                      <Input className="h-7 text-xs" placeholder="e.g. HBL, MCB" value={txnBankEditData.bankName} onChange={(e) => setTxnBankEditData(p => ({ ...p, bankName: e.target.value }))} data-testid="input-txn-bank-edit-name" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Account Title</label>
                      <Input className="h-7 text-xs" placeholder="Account holder" value={txnBankEditData.bankAccountTitle} onChange={(e) => setTxnBankEditData(p => ({ ...p, bankAccountTitle: e.target.value }))} data-testid="input-txn-bank-edit-title" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Account / IBAN</label>
                      <Input className="h-7 text-xs font-mono" placeholder="Account number or IBAN" value={txnBankEditData.bankAccountNumber} onChange={(e) => setTxnBankEditData(p => ({ ...p, bankAccountNumber: e.target.value }))} data-testid="input-txn-bank-edit-number" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Branch Code</label>
                      <Input className="h-7 text-xs" placeholder="Branch code" value={txnBankEditData.bankBranchCode} onChange={(e) => setTxnBankEditData(p => ({ ...p, bankBranchCode: e.target.value }))} data-testid="input-txn-bank-edit-branch" />
                    </div>
                  </div>
                ) : (txnVendor.bankName || txnVendor.bankAccountTitle || txnVendor.bankAccountNumber) ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                    <div><span className="text-muted-foreground">Bank:</span> <span className="font-medium">{txnVendor.bankName || "—"}</span></div>
                    <div><span className="text-muted-foreground">Title:</span> <span className="font-medium">{txnVendor.bankAccountTitle || "—"}</span></div>
                    <div><span className="text-muted-foreground">Account:</span> <span className="font-medium font-mono">{txnVendor.bankAccountNumber || "—"}</span></div>
                    {txnVendor.bankBranchCode && (
                      <div><span className="text-muted-foreground">Branch:</span> <span className="font-medium">{txnVendor.bankBranchCode}</span></div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No bank details added. Click Edit to add bank account info for payment transfers.</p>
                )}
              </div>
            </div>
          )}
          {txnVendorId === "none" ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Select a vendor</p>
              <p className="text-sm mt-1">Choose a vendor from the dropdown to view transactions</p>
            </div>
          ) : txnLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !filteredTransactions || filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No transactions found</p>
              <p className="text-sm mt-1">No wallet transactions for this vendor yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="vendor-table-enterprise">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance After</TableHead>
                    <TableHead className="hidden md:table-cell">Payment Method</TableHead>
                    <TableHead className="hidden md:table-cell">Performed By</TableHead>
                    <TableHead className="hidden md:table-cell">Approved By</TableHead>
                    <TableHead className="text-right">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((txn) => (
                    <TableRow key={txn.id} data-testid={`row-txn-${txn.id}`}>
                      <TableCell className="text-sm">{txn.createdAt ? new Date(txn.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell className="text-sm font-medium">{allVendorsList.find(v => v.id === txn.vendorId)?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`no-default-active-elevate text-[10px] capitalize ${
                            isRecharge(txn.type) ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" :
                            "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950"
                          }`}
                        >
                          {isRecharge(txn.type) ? (isTxnVendorBandwidth ? "Payment" : "Recharge") : (isTxnVendorBandwidth ? "Refund" : "Deduction")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={isRecharge(txn.type) ? "vendor-ledger-credit font-medium" : "vendor-ledger-debit font-medium"}>
                          {isRecharge(txn.type) ? "+" : "-"}{formatPKR(txn.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{formatPKR(txn.balanceAfter)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        <span className="text-muted-foreground">{txn.paymentMethod || "-"}</span>
                        {txnVendor && (txnVendor.bankName || txnVendor.bankAccountNumber) && (
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5 leading-tight">
                            {txnVendor.bankName}{txnVendor.bankAccountNumber ? ` — ${txnVendor.bankAccountNumber}` : ""}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{txn.performedBy || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{txn.approvedBy || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEditTxn(txn)} data-testid={`button-edit-txn-${txn.id}`}>
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setDetailTxn(txn); setDetailDialogOpen(true); }} data-testid={`button-detail-txn-${txn.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Detail
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => printVendorSlip(txn)} data-testid={`button-print-slip-txn-${txn.id}`}>
                            <Printer className="h-3.5 w-3.5 mr-1" />
                            Print
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rechargeDialogOpen} onOpenChange={setRechargeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5 text-green-600" />
              {isBandwidthSelected ? "Send Payment" : "Recharge Wallet"}
            </DialogTitle>
          </DialogHeader>
          {selectedVendorName && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 mb-1">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{selectedVendorName}</span>
            </div>
          )}
          {selectedVendor && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 p-3 space-y-1.5" data-testid="vendor-bank-details">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Vendor Bank Account
                </p>
                {!bankEditMode ? (
                  <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs text-blue-600 dark:text-blue-400" onClick={() => { setBankEditMode(true); setBankEditData({ bankName: selectedVendor.bankName || "", bankAccountTitle: selectedVendor.bankAccountTitle || "", bankAccountNumber: selectedVendor.bankAccountNumber || "", bankBranchCode: selectedVendor.bankBranchCode || "" }); }} data-testid="button-edit-bank">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setBankEditMode(false)} data-testid="button-cancel-bank-edit">Cancel</Button>
                    <Button type="button" size="sm" className="h-6 px-2 text-xs" disabled={saveBankDetailsMutation.isPending} onClick={() => { if (selectedVendorId) saveBankDetailsMutation.mutate({ vendorId: selectedVendorId, data: bankEditData }); }} data-testid="button-save-bank">
                      {saveBankDetailsMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                )}
              </div>
              {bankEditMode ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Bank Name</label>
                    <Input className="h-7 text-xs" placeholder="e.g. HBL, MCB" value={bankEditData.bankName} onChange={(e) => setBankEditData(p => ({ ...p, bankName: e.target.value }))} data-testid="input-bank-edit-name" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Account Title</label>
                    <Input className="h-7 text-xs" placeholder="Account holder" value={bankEditData.bankAccountTitle} onChange={(e) => setBankEditData(p => ({ ...p, bankAccountTitle: e.target.value }))} data-testid="input-bank-edit-title" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-muted-foreground">Account Number / IBAN</label>
                    <Input className="h-7 text-xs font-mono" placeholder="Account number or IBAN" value={bankEditData.bankAccountNumber} onChange={(e) => setBankEditData(p => ({ ...p, bankAccountNumber: e.target.value }))} data-testid="input-bank-edit-number" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Branch Code</label>
                    <Input className="h-7 text-xs" placeholder="Branch code" value={bankEditData.bankBranchCode} onChange={(e) => setBankEditData(p => ({ ...p, bankBranchCode: e.target.value }))} data-testid="input-bank-edit-branch" />
                  </div>
                </div>
              ) : (selectedVendor.bankName || selectedVendor.bankAccountTitle || selectedVendor.bankAccountNumber) ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="text-xs"><span className="text-muted-foreground">Bank:</span> <span className="font-medium">{selectedVendor.bankName || "—"}</span></div>
                  <div className="text-xs"><span className="text-muted-foreground">Title:</span> <span className="font-medium">{selectedVendor.bankAccountTitle || "—"}</span></div>
                  <div className="text-xs col-span-2"><span className="text-muted-foreground">Account:</span> <span className="font-medium font-mono">{selectedVendor.bankAccountNumber || "—"}</span></div>
                  {selectedVendor.bankBranchCode && (
                    <div className="text-xs"><span className="text-muted-foreground">Branch:</span> <span className="font-medium">{selectedVendor.bankBranchCode}</span></div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No bank details added. Click Edit to add bank account info.</p>
              )}
            </div>
          )}
          <Form {...rechargeForm}>
            <form onSubmit={rechargeForm.handleSubmit((data) => rechargeMutation.mutate(data))} className="space-y-4">
              <FormField
                control={rechargeForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Payment Method *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-recharge-payment-method">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="online_transfer">Online Transfer</SelectItem>
                        <SelectItem value="jazzcash">JazzCash</SelectItem>
                        <SelectItem value="easypaisa">Easypaisa</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={rechargeForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (PKR) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter amount" data-testid="input-recharge-amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={rechargeForm.control}
                  name="performedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isBandwidthSelected ? "Paid By" : "Recharge By"} *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Admin" data-testid="input-recharge-by" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={rechargeForm.control}
                  name="approvedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approved By</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Manager" data-testid="input-recharge-approved-by" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={rechargeForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any additional notes..." className="resize-none" rows={2} data-testid="input-recharge-notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setRechargeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={rechargeMutation.isPending} data-testid="button-submit-recharge">
                  {rechargeMutation.isPending ? "Processing..." : isBandwidthSelected ? "Send Payment" : "Recharge"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={deductDialogOpen} onOpenChange={setDeductDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-red-600" />
              {isBandwidthSelected ? "Process Refund" : "Deduct from Wallet"}
            </DialogTitle>
          </DialogHeader>
          {selectedVendorName && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 mb-1">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{selectedVendorName}</span>
            </div>
          )}
          <Form {...deductForm}>
            <form onSubmit={deductForm.handleSubmit((data) => deductMutation.mutate(data))} className="space-y-4">
              <FormField
                control={deductForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Monthly bandwidth payment" data-testid="input-deduct-reason" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={deductForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (PKR) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter amount" data-testid="input-deduct-amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={deductForm.control}
                  name="performedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isBandwidthSelected ? "Refund By" : "Deduct By"} *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Admin" data-testid="input-deduct-by" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={deductForm.control}
                  name="approvedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approved By</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Manager" data-testid="input-deduct-approved-by" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={deductForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any additional notes..." className="resize-none" rows={2} data-testid="input-deduct-notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDeductDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={deductMutation.isPending} data-testid="button-submit-deduct">
                  {deductMutation.isPending ? "Processing..." : isBandwidthSelected ? "Process Refund" : "Deduct"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Transaction Detail
            </DialogTitle>
          </DialogHeader>
          {detailTxn && (() => {
            const detailVendor = allVendorsList.find(v => v.id === detailTxn.vendorId);
            const totalPayable = Number(detailTxn.amount || 0);
            const balAfter = Number(detailTxn.balanceAfter || 0);
            const prevBalance = isRecharge(detailTxn.type) ? balAfter - totalPayable : balAfter + totalPayable;
            const dues = prevBalance < 0 ? Math.abs(prevBalance) : 0;
            return (
            <div className="space-y-3" data-testid="detail-txn-content">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Badge variant="secondary" className={`no-default-active-elevate ${isRecharge(detailTxn.type) ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" : "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950"}`}>
                  {isRecharge(detailTxn.type) ? (isTxnVendorBandwidth ? "Payment" : "Recharge") : (isTxnVendorBandwidth ? "Refund" : "Deduction")}
                </Badge>
                <span className={`text-xl font-bold ${isRecharge(detailTxn.type) ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {isRecharge(detailTxn.type) ? "+" : "-"}{formatPKR(detailTxn.amount)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vendor Name</span>
                  <span className="font-medium" data-testid="detail-vendor-name">{detailVendor?.name || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date / Time</span>
                  <span className="font-medium" data-testid="detail-date">{detailTxn.createdAt ? new Date(detailTxn.createdAt).toLocaleString() : "N/A"}</span>
                </div>
                <div className="border-t my-1" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount Payable</span>
                  <span className="font-medium" data-testid="detail-total-payable">{formatPKR(totalPayable)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium text-green-600 dark:text-green-400" data-testid="detail-amount-paid">{formatPKR(detailTxn.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dues</span>
                  <span className={`font-medium ${dues > 0 ? "text-red-600 dark:text-red-400" : ""}`} data-testid="detail-dues">{formatPKR(dues)}</span>
                </div>
                <div className="border-t my-1" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium capitalize" data-testid="detail-payment-method">{detailTxn.paymentMethod ? detailTxn.paymentMethod.replace(/_/g, " ") : "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Transfer Account</span>
                  <span className="font-medium text-right max-w-[60%] truncate" data-testid="detail-transfer-account">
                    {detailVendor && (detailVendor.bankName || detailVendor.bankAccountNumber)
                      ? `${detailVendor.bankName || ""}${detailVendor.bankAccountNumber ? ` — ${detailVendor.bankAccountNumber}` : ""}`
                      : "—"}
                  </span>
                </div>
                <div className="border-t my-1" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Performed By</span>
                  <span className="font-medium" data-testid="detail-performed-by">{detailTxn.performedBy || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Approved By</span>
                  <span className="font-medium" data-testid="detail-approved-by">{detailTxn.approvedBy || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-medium" data-testid="detail-reference">{detailTxn.reference || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Description</span>
                  <span className="font-medium text-right max-w-[60%]" data-testid="detail-description">{detailTxn.description || "—"}</span>
                </div>
                {detailTxn.notes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground block mb-1">Notes</span>
                    <p className="p-2 rounded bg-muted/50 text-sm">{detailTxn.notes}</p>
                  </div>
                )}
              </div>
            </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)} data-testid="button-close-vendor-detail">
              Close
            </Button>
            {detailTxn && (
              <Button onClick={() => printVendorSlip(detailTxn)} data-testid="button-print-vendor-slip">
                <Printer className="h-4 w-4 mr-1" />
                Print Slip
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editTxnDialogOpen} onOpenChange={setEditTxnDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Transaction
            </DialogTitle>
          </DialogHeader>
          {editingTxn && (
            <Form {...editTxnForm}>
              <form onSubmit={editTxnForm.handleSubmit((data) => editTxnMutation.mutate({ id: editingTxn.id, data }))} className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <Badge variant="secondary" className={`no-default-active-elevate ${isRecharge(editingTxn.type) ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" : "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950"}`}>
                    {isRecharge(editingTxn.type) ? (isTxnVendorBandwidth ? "Payment" : "Recharge") : (isTxnVendorBandwidth ? "Refund" : "Deduction")}
                  </Badge>
                  <span className={`text-xl font-bold ${isRecharge(editingTxn.type) ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {isRecharge(editingTxn.type) ? "+" : "-"}{formatPKR(editingTxn.amount)}
                  </span>
                </div>
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transaction Details</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{editingTxn.createdAt ? new Date(editingTxn.createdAt).toLocaleString() : "N/A"}</span></div>
                    <div><span className="text-muted-foreground">Balance After:</span> <span className="font-medium">{formatPKR(editingTxn.balanceAfter)}</span></div>
                    {editingTxn.reference && (
                      <div className="col-span-2"><span className="text-muted-foreground">Reference:</span> <span className="font-medium">{editingTxn.reference}</span></div>
                    )}
                    {editingTxn.description && (
                      <div className="col-span-2"><span className="text-muted-foreground">Description:</span> <span className="font-medium">{editingTxn.description}</span></div>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <FormField
                    control={editTxnForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (PKR)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="1" placeholder="Amount" data-testid="input-edit-txn-amount" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editTxnForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-txn-payment-method">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="online_transfer">Online Transfer</SelectItem>
                            <SelectItem value="jazzcash">JazzCash</SelectItem>
                            <SelectItem value="easypaisa">Easypaisa</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editTxnForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                          <Input placeholder="Reason" data-testid="input-edit-txn-reason" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={editTxnForm.control}
                      name="performedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Performed By</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Admin" data-testid="input-edit-txn-performed-by" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editTxnForm.control}
                      name="approvedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Approved By</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Manager" data-testid="input-edit-txn-approved-by" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={editTxnForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Additional notes..." className="resize-none" rows={2} data-testid="input-edit-txn-notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setEditTxnDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editTxnMutation.isPending} data-testid="button-submit-edit-txn">
                    {editTxnMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccountLedgerTab() {
  const [selectedVendorId, setSelectedVendorId] = useState<string>("none");
  const [ledgerDateFrom, setLedgerDateFrom] = useState("");
  const [ledgerDateTo, setLedgerDateTo] = useState("");
  const [ledgerDetailOpen, setLedgerDetailOpen] = useState(false);
  const [ledgerDetailTxn, setLedgerDetailTxn] = useState<VendorWalletTransaction | null>(null);

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: transactions, isLoading: txnLoading } = useQuery<VendorWalletTransaction[]>({
    queryKey: ["/api/vendor-wallet-transactions", selectedVendorId],
    enabled: selectedVendorId !== "none",
    queryFn: async () => {
      if (selectedVendorId === "none") return [];
      const endpoint = selectedVendorId === "all"
        ? "/api/vendor-wallet-transactions/all"
        : `/api/vendor-wallet-transactions/${selectedVendorId}`;
      const res = await fetch(endpoint, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const allVendors = vendors || [];
  const selectedVendor = selectedVendorId === "all" ? null : allVendors.find(v => String(v.id) === selectedVendorId);
  const isRecharge = (type: string) => type === "credit" || type === "recharge";
  const isBandwidthVendor = selectedVendor?.vendorType === "bandwidth";

  let runningBalance = 0;
  const ledgerEntries = (transactions || []).map(txn => {
    const isCredit = txn.type === "credit" || txn.type === "recharge";
    const debit = !isCredit ? Number(txn.amount || 0) : 0;
    const credit = isCredit ? Number(txn.amount || 0) : 0;
    runningBalance = Number(txn.balanceAfter || 0);
    return { ...txn, debit, credit, runningBalance };
  });

  const filteredLedger = ledgerEntries.filter(entry => {
    if (!ledgerDateFrom && !ledgerDateTo) return true;
    const entryDate = entry.createdAt ? new Date(entry.createdAt) : null;
    if (!entryDate) return true;
    if (ledgerDateFrom && entryDate < new Date(ledgerDateFrom)) return false;
    if (ledgerDateTo && entryDate > new Date(ledgerDateTo + "T23:59:59")) return false;
    return true;
  });

  const totalDebits = filteredLedger.reduce((s, e) => s + e.debit, 0);
  const totalCredits = filteredLedger.reduce((s, e) => s + e.credit, 0);

  return (
    <div className="space-y-6 page-fade-in" data-testid="tab-content-account">
      <div className="vendor-wallet-hero px-6 py-6 text-white">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-5 w-5 text-white/80" />
                <h2 className="text-lg font-bold">Vendor Financial Overview</h2>
              </div>
              <p className="text-sm text-white/60">Account ledger and transaction history</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-white/60 uppercase tracking-wider">Total Payable</p>
                <p className="text-xl font-bold">{formatPKR(allVendors.reduce((s, v) => s + Number(v.payableAmount || 0), 0))}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60 uppercase tracking-wider">Wallet Balance</p>
                <p className="text-xl font-bold">{formatPKR(allVendors.reduce((s, v) => s + Number(v.walletBalance || 0), 0))}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60 uppercase tracking-wider">BW Cost/Mo</p>
                <p className="text-xl font-bold">{formatPKR(allVendors.filter(v => v.vendorType === "bandwidth").reduce((s, v) => s + Number(v.bandwidthCost || 0), 0))}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="vendor-filter-bar">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
              <SelectTrigger className="w-[260px]" data-testid="select-ledger-vendor">
                <SelectValue placeholder="Select vendor to view ledger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select Vendor</SelectItem>
                <SelectItem value="all">All Vendors</SelectItem>
                {allVendors.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>{v.name} ({v.vendorType})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" className="w-[150px]" value={ledgerDateFrom} onChange={(e) => setLedgerDateFrom(e.target.value)} data-testid="input-ledger-date-from" />
            <Input type="date" className="w-[150px]" value={ledgerDateTo} onChange={(e) => setLedgerDateTo(e.target.value)} data-testid="input-ledger-date-to" />
            {(ledgerDateFrom || ledgerDateTo) && (
              <Button size="sm" variant="ghost" onClick={() => { setLedgerDateFrom(""); setLedgerDateTo(""); }}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              if (filteredLedger.length === 0) return;
              const headers = ["Date", "Vendor Name", "Description", "Payment Method", "Performed By", "Approved By", "Debit", "Credit", "Running Balance"];
              const rows = filteredLedger.map(e => [
                e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "N/A",
                selectedVendor?.name || "",
                e.description || (e.type === "recharge" ? "Wallet Recharge" : "Wallet Deduction"),
                e.paymentMethod || "",
                e.performedBy || "",
                e.approvedBy || "",
                e.debit > 0 ? String(e.debit) : "0",
                e.credit > 0 ? String(e.credit) : "0",
                String(e.runningBalance)
              ]);
              rows.push(["", "", "TOTALS", "", "", "", String(totalDebits), String(totalCredits), ""]);
              const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `vendor_ledger_${selectedVendor?.name || "all"}_${new Date().toISOString().split("T")[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }} data-testid="button-export-ledger-csv">
              <Download className="h-3.5 w-3.5 mr-1" />
              Export CSV
            </Button>
            <Button className="btn-vendor-accent no-default-hover-elevate no-default-active-elevate" onClick={() => {
              if (filteredLedger.length === 0) return;
              const dateRange = ledgerDateFrom || ledgerDateTo
                ? `${ledgerDateFrom || "—"} to ${ledgerDateTo || "—"}`
                : "All Dates";
              const rows = filteredLedger.map((e) => `
                <tr>
                  <td>${e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "N/A"}</td>
                  <td>${selectedVendor?.name || "—"}</td>
                  <td>${e.description || (e.type === "recharge" || e.type === "credit" ? "Wallet Recharge" : "Wallet Deduction")}</td>
                  <td>${e.paymentMethod ? e.paymentMethod.replace(/_/g, " ") : "—"}</td>
                  <td>${e.performedBy || "—"}</td>
                  <td>${e.approvedBy || "—"}</td>
                  <td class="debit">${e.debit > 0 ? formatPKR(e.debit) : "—"}</td>
                  <td class="credit">${e.credit > 0 ? formatPKR(e.credit) : "—"}</td>
                  <td class="balance">${formatPKR(e.runningBalance)}</td>
                </tr>`).join("");
              const html = `<!DOCTYPE html><html><head><title>Vendor Ledger — ${selectedVendor?.name || ""}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 20px; }
                h1 { font-size: 16px; margin-bottom: 2px; }
                .meta { font-size: 11px; color: #555; margin-bottom: 16px; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #1e293b; color: #fff; padding: 7px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
                td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
                tr:nth-child(even) td { background: #f8fafc; }
                .debit { color: #dc2626; font-weight: 600; }
                .credit { color: #16a34a; font-weight: 600; }
                .balance { font-weight: 600; }
                tfoot td { font-weight: 700; background: #f1f5f9; border-top: 2px solid #cbd5e1; padding: 8px; }
                tfoot .debit { color: #dc2626; }
                tfoot .credit { color: #16a34a; }
                .footer { margin-top: 16px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
                @media print { body { padding: 10mm; } }
              </style></head><body>
              <h1>Vendor Account Ledger</h1>
              <p class="meta">
                <strong>Vendor:</strong> ${selectedVendor?.name || "All Vendors"} &nbsp;&nbsp;
                <strong>Type:</strong> ${selectedVendor?.vendorType || "—"} &nbsp;&nbsp;
                <strong>Date Range:</strong> ${dateRange} &nbsp;&nbsp;
                <strong>Wallet Balance:</strong> ${formatPKR(selectedVendor?.walletBalance)} &nbsp;&nbsp;
                <strong>Printed:</strong> ${new Date().toLocaleString()}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Date</th><th>Vendor Name</th><th>Description</th>
                    <th>Payment Method</th><th>Performed By</th><th>Approved By</th>
                    <th>Debit</th><th>Credit</th><th>Running Balance</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
                <tfoot>
                  <tr>
                    <td colspan="6"><strong>TOTALS</strong></td>
                    <td class="debit">${formatPKR(totalDebits)}</td>
                    <td class="credit">${formatPKR(totalCredits)}</td>
                    <td class="balance">${formatPKR(totalCredits - totalDebits)}</td>
                  </tr>
                </tfoot>
              </table>
              <p class="footer">NetSphere Enterprise — Vendor Account Ledger Report</p>
              </body></html>`;
              const win = window.open("", "_blank", "width=1100,height=800");
              if (!win) return;
              win.document.write(html);
              win.document.close();
              win.focus();
              setTimeout(() => { win.print(); }, 400);
            }} data-testid="button-download-ledger">
              <FileText className="h-4 w-4 mr-1" />
              Print / PDF
            </Button>
          </div>
        </div>
      </div>

      {(selectedVendor || selectedVendorId === "all") && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="vendor-stat-card stat-blue p-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Vendor</p>
            <p className="text-lg font-bold mt-1">{selectedVendor ? selectedVendor.name : "All Vendors"}</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{selectedVendor ? `${selectedVendor.vendorType} vendor` : `${allVendors.length} vendors`}</p>
          </div>
          <div className="vendor-stat-card stat-green p-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Wallet Balance</p>
            <p className="text-lg font-bold mt-1">{formatPKR(selectedVendor ? selectedVendor.walletBalance : allVendors.reduce((s, v) => s + Number(v.walletBalance || 0), 0))}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Current balance</p>
          </div>
          <div className="vendor-stat-card stat-purple p-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold">Transactions</p>
            <p className="text-lg font-bold mt-1">{ledgerEntries.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total entries</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Ledger Entries
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {selectedVendorId === "none" ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">Select a vendor</p>
              <p className="text-sm mt-1">Choose a vendor or "All Vendors" from the dropdown to view the ledger</p>
            </div>
          ) : txnLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filteredLedger.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No ledger entries</p>
              <p className="text-sm mt-1">No transactions found for this vendor</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="vendor-table-enterprise">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="hidden md:table-cell">Payment Method</TableHead>
                    <TableHead className="hidden md:table-cell">Performed By</TableHead>
                    <TableHead className="hidden lg:table-cell">Approved By</TableHead>
                    <TableHead>Debit</TableHead>
                    <TableHead>Credit</TableHead>
                    <TableHead>Running Balance</TableHead>
                    <TableHead className="text-right">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLedger.map((entry) => (
                    <TableRow key={entry.id} data-testid={`row-ledger-${entry.id}`}>
                      <TableCell className="text-sm">{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell className="text-sm font-medium">{selectedVendor?.name || allVendors.find(v => v.id === entry.vendorId)?.name || "—"}</TableCell>
                      <TableCell className="text-sm">{entry.description || (entry.type === "recharge" ? "Wallet Recharge" : "Wallet Deduction")}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground capitalize">{entry.paymentMethod ? entry.paymentMethod.replace(/_/g, " ") : "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{entry.performedBy || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{entry.approvedBy || "—"}</TableCell>
                      <TableCell>
                        {entry.debit > 0 ? (
                          <span className="vendor-ledger-debit text-sm font-medium">{formatPKR(entry.debit)}</span>
                        ) : <span className="text-muted-foreground text-sm">-</span>}
                      </TableCell>
                      <TableCell>
                        {entry.credit > 0 ? (
                          <span className="vendor-ledger-credit text-sm font-medium">{formatPKR(entry.credit)}</span>
                        ) : <span className="text-muted-foreground text-sm">-</span>}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{formatPKR(entry.runningBalance)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => { setLedgerDetailTxn(entry); setLedgerDetailOpen(true); }} data-testid={`button-ledger-detail-${entry.id}`}>
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredLedger.length > 0 && (
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-sm font-bold">TOTALS</TableCell>
                      <TableCell className="hidden md:table-cell"></TableCell>
                      <TableCell className="hidden md:table-cell"></TableCell>
                      <TableCell className="hidden lg:table-cell"></TableCell>
                      <TableCell>
                        <span className="vendor-ledger-debit text-sm font-bold">{formatPKR(totalDebits)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="vendor-ledger-credit text-sm font-bold">{formatPKR(totalCredits)}</span>
                      </TableCell>
                      <TableCell className="text-sm font-bold">{formatPKR(totalCredits - totalDebits)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={ledgerDetailOpen} onOpenChange={setLedgerDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Transaction Detail
            </DialogTitle>
          </DialogHeader>
          {ledgerDetailTxn && (() => {
            const detailVendor = allVendors.find(v => v.id === ledgerDetailTxn.vendorId);
            const totalPayable = Number(ledgerDetailTxn.amount || 0);
            const balAfter = Number(ledgerDetailTxn.balanceAfter || 0);
            const prevBalance = isRecharge(ledgerDetailTxn.type) ? balAfter - totalPayable : balAfter + totalPayable;
            const dues = prevBalance < 0 ? Math.abs(prevBalance) : 0;
            return (
            <div className="space-y-3" data-testid="ledger-detail-content">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <Badge variant="secondary" className={`no-default-active-elevate ${isRecharge(ledgerDetailTxn.type) ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" : "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950"}`}>
                  {isRecharge(ledgerDetailTxn.type) ? (isBandwidthVendor ? "Payment" : "Recharge") : (isBandwidthVendor ? "Refund" : "Deduction")}
                </Badge>
                <span className={`text-xl font-bold ${isRecharge(ledgerDetailTxn.type) ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {isRecharge(ledgerDetailTxn.type) ? "+" : "-"}{formatPKR(ledgerDetailTxn.amount)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vendor Name</span>
                  <span className="font-medium" data-testid="ledger-detail-vendor-name">{detailVendor?.name || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date / Time</span>
                  <span className="font-medium" data-testid="ledger-detail-date">{ledgerDetailTxn.createdAt ? new Date(ledgerDetailTxn.createdAt).toLocaleString() : "N/A"}</span>
                </div>
                <div className="border-t my-1" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount Payable</span>
                  <span className="font-medium" data-testid="ledger-detail-total-payable">{formatPKR(totalPayable)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium text-green-600 dark:text-green-400" data-testid="ledger-detail-amount-paid">{formatPKR(ledgerDetailTxn.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dues</span>
                  <span className={`font-medium ${dues > 0 ? "text-red-600 dark:text-red-400" : ""}`} data-testid="ledger-detail-dues">{formatPKR(dues)}</span>
                </div>
                <div className="border-t my-1" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium capitalize" data-testid="ledger-detail-payment-method">{ledgerDetailTxn.paymentMethod ? ledgerDetailTxn.paymentMethod.replace(/_/g, " ") : "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Transfer Account</span>
                  <span className="font-medium text-right max-w-[60%] truncate" data-testid="ledger-detail-transfer-account">
                    {detailVendor && (detailVendor.bankName || detailVendor.bankAccountNumber)
                      ? `${detailVendor.bankName || ""}${detailVendor.bankAccountNumber ? ` — ${detailVendor.bankAccountNumber}` : ""}`
                      : "—"}
                  </span>
                </div>
                <div className="border-t my-1" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Performed By</span>
                  <span className="font-medium" data-testid="ledger-detail-performed-by">{ledgerDetailTxn.performedBy || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Approved By</span>
                  <span className="font-medium" data-testid="ledger-detail-approved-by">{ledgerDetailTxn.approvedBy || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-medium" data-testid="ledger-detail-reference">{ledgerDetailTxn.reference || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Description</span>
                  <span className="font-medium text-right max-w-[60%]" data-testid="ledger-detail-description">{ledgerDetailTxn.description || "—"}</span>
                </div>
                {ledgerDetailTxn.notes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground block mb-1">Notes</span>
                    <p className="p-2 rounded bg-muted/50 text-sm">{ledgerDetailTxn.notes}</p>
                  </div>
                )}
              </div>
            </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BandwidthChangesTab() {
  const { toast } = useToast();
  const [, changeTab] = useTab("bandwidth-changes");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [linkFilter, setLinkFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<VendorBandwidthLink | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyLink, setHistoryLink] = useState<VendorBandwidthLink | null>(null);

  const { data: vendors } = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });
  const { data: allLinks } = useQuery<VendorBandwidthLink[]>({ queryKey: ["/api/vendor-bandwidth-links"] });
  const { data: allHistory } = useQuery<BandwidthChangeHistory[]>({ queryKey: ["/api/bandwidth-change-history"] });

  const { data: linkHistory } = useQuery<BandwidthChangeHistory[]>({
    queryKey: ["/api/bandwidth-change-history/by-link", historyLink?.id],
    enabled: !!historyLink,
    queryFn: async () => {
      if (!historyLink) return [];
      const res = await fetch(`/api/bandwidth-change-history/by-link/${historyLink.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const bandwidthVendors = (vendors || []).filter(v => v.vendorType === "bandwidth");
  const getVendorName = (vendorId: number) => bandwidthVendors.find(v => v.id === vendorId)?.name || "Unknown";
  const getLinkName = (linkId: number) => (allLinks || []).find(l => l.id === linkId)?.linkName || "Unknown";

  const filteredLinks = (allLinks || []).filter(link => {
    if (vendorFilter !== "all" && link.vendorId !== Number(vendorFilter)) return false;
    if (link.status !== "active") return false;
    return true;
  });

  const filteredHistory = (allHistory || []).filter(h => {
    if (vendorFilter !== "all" && h.vendorId !== Number(vendorFilter)) return false;
    if (linkFilter !== "all" && h.linkId !== Number(linkFilter)) return false;
    if (typeFilter !== "all" && h.changeType !== typeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const vName = getVendorName(h.vendorId).toLowerCase();
      const lName = getLinkName(h.linkId).toLowerCase();
      if (!vName.includes(term) && !lName.includes(term) && !(h.reason || "").toLowerCase().includes(term)) return false;
    }
    return true;
  });

  const exportBwChangesCSV = () => {
    if (filteredHistory.length === 0) return;
    const headers = ["Date", "Vendor", "Link", "Type", "Previous BW (Mbps)", "New BW (Mbps)", "Previous Rate", "New Rate", "Cost Impact", "Reason", "Requested By"];
    const rows = filteredHistory.map(h => [
      h.createdAt ? new Date(h.createdAt).toLocaleString() : "N/A",
      getVendorName(h.vendorId), getLinkName(h.linkId),
      h.changeType, h.previousMbps || "", h.newMbps || "",
      h.previousRate || "", h.newRate || "", h.costImpact || "0",
      h.reason || "", h.requestedBy || ""
    ]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bandwidth_changes_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateBwChangesPDF = () => {
    if (filteredHistory.length === 0) return;
    const rows = filteredHistory.map(h => `
      <tr>
        <td>${h.createdAt ? new Date(h.createdAt).toLocaleDateString() : "N/A"}</td>
        <td>${escHtml(getVendorName(h.vendorId))}</td>
        <td>${escHtml(getLinkName(h.linkId))}</td>
        <td><span class="badge ${h.changeType === "upgrade" ? "badge-green" : h.changeType === "downgrade" ? "badge-red" : "badge-blue"}">${escHtml(h.changeType)}</span></td>
        <td>${escHtml(h.previousMbps || "—")} Mbps</td>
        <td>${escHtml(h.newMbps || "—")} Mbps</td>
        <td>${formatPKR(h.previousRate)}</td>
        <td>${formatPKR(h.newRate)}</td>
        <td class="${Number(h.costImpact || 0) >= 0 ? "text-green" : "text-red"}">${formatPKR(h.costImpact)}</td>
        <td>${escHtml(h.reason || "—")}</td>
      </tr>`).join("");
    const totalImpact = filteredHistory.reduce((sum, h) => sum + Number(h.costImpact || 0), 0);
    const html = `<!DOCTYPE html><html><head><title>Bandwidth Changes Report</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 20px; }
      h1 { font-size: 16px; margin-bottom: 2px; }
      .meta { font-size: 11px; color: #555; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #1e293b; color: #fff; padding: 7px 6px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
      td { padding: 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; font-size: 10px; }
      tr:nth-child(even) td { background: #f8fafc; }
      .text-green { color: #15803d; font-weight: 600; }
      .text-red { color: #dc2626; font-weight: 600; }
      .badge { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
      .badge-green { background: #dcfce7; color: #15803d; }
      .badge-red { background: #fef2f2; color: #dc2626; }
      .badge-blue { background: #dbeafe; color: #1d4ed8; }
      .footer { margin-top: 16px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
      @media print { body { padding: 10mm; } }
    </style></head><body>
    <h1>Bandwidth Changes Report</h1>
    <p class="meta">
      <strong>Total Changes:</strong> ${filteredHistory.length} &nbsp;&nbsp;
      <strong>Upgrades:</strong> ${filteredHistory.filter(h => h.changeType === "upgrade").length} &nbsp;&nbsp;
      <strong>Downgrades:</strong> ${filteredHistory.filter(h => h.changeType === "downgrade").length} &nbsp;&nbsp;
      <strong>Net Cost Impact:</strong> ${formatPKR(totalImpact)} &nbsp;&nbsp;
      <strong>Generated:</strong> ${new Date().toLocaleString()}
    </p>
    <table>
      <thead><tr>
        <th>Date</th><th>Vendor</th><th>Link</th><th>Type</th><th>Prev BW</th>
        <th>New BW</th><th>Prev Rate</th><th>New Rate</th><th>Cost Impact</th><th>Reason</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="footer">NetSphere Enterprise — Bandwidth Changes Report</p>
    </body></html>`;
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const upgradeForm = useForm({
    defaultValues: { newMbps: "", newRate: "", reason: "", requestedBy: "", effectiveDate: new Date().toISOString().split("T")[0], notes: "" },
  });

  const upgradeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bandwidth-upgrade-downgrade", {
        linkId: selectedLink!.id,
        ...data,
      });
      return res.json();
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bandwidth-change-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bandwidth-change-history/by-link"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-bandwidth-links"] });
      const changeLabel = result.changeType === "upgrade" ? "Upgraded" : result.changeType === "downgrade" ? "Downgraded" : "Rate Changed";
      toast({ title: `Bandwidth ${changeLabel}`, description: `${selectedLink?.linkName} updated successfully` });
      setUpgradeDialogOpen(false);
      setSelectedLink(null);
      upgradeForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const newMbpsWatch = upgradeForm.watch("newMbps");
  const newRateWatch = upgradeForm.watch("newRate");
  const newCost = Number(newMbpsWatch || 0) * Number(newRateWatch || 0);
  const currentCost = selectedLink ? Number(selectedLink.totalMonthlyCost || 0) : 0;
  const costDiff = newCost - currentCost;

  const totalUpgrades = (allHistory || []).filter(h => h.changeType === "upgrade").length;
  const totalDowngrades = (allHistory || []).filter(h => h.changeType === "downgrade").length;
  const totalRateChanges = (allHistory || []).filter(h => h.changeType === "rate_change").length;

  const changeTypeStyles: Record<string, { icon: any; color: string; label: string }> = {
    upgrade: { icon: ArrowUp, color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950", label: "Upgrade" },
    downgrade: { icon: ArrowDown, color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950", label: "Downgrade" },
    rate_change: { icon: RefreshCw, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950", label: "Rate Change" },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950">
                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Links</p>
                <p className="text-xl font-bold" data-testid="text-active-links-count">{(allLinks || []).filter(l => l.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-950">
                <ArrowUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Upgrades</p>
                <p className="text-xl font-bold" data-testid="text-upgrades-count">{totalUpgrades}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950">
                <ArrowDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Downgrades</p>
                <p className="text-xl font-bold" data-testid="text-downgrades-count">{totalDowngrades}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950">
                <RefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rate Changes</p>
                <p className="text-xl font-bold" data-testid="text-rate-changes-count">{totalRateChanges}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Bandwidth Upgrade / Downgrade
            </CardTitle>
          </div>
          <CardDescription>Select a bandwidth link to upgrade or downgrade its capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <Select value={vendorFilter} onValueChange={(v) => { setVendorFilter(v); setLinkFilter("all"); }}>
              <SelectTrigger className="w-[220px]" data-testid="select-bwc-vendor-filter">
                <SelectValue placeholder="Filter by Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bandwidth Vendors</SelectItem>
                {bandwidthVendors.map(v => (
                  <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredLinks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium">No active bandwidth links found</p>
              <p className="text-sm">Add bandwidth links from the Vendor List or Packages tab</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Link Name</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Current Mbps</TableHead>
                    <TableHead>Rate/Mbps</TableHead>
                    <TableHead>Monthly Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLinks.map(link => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">{getVendorName(link.vendorId)}</TableCell>
                      <TableCell className="font-medium">{link.linkName}</TableCell>
                      <TableCell className="font-mono text-sm">{link.ipAddress || "N/A"}</TableCell>
                      <TableCell>{link.city || "N/A"}</TableCell>
                      <TableCell className="font-semibold">{link.bandwidthMbps} Mbps</TableCell>
                      <TableCell>{formatPKR(link.bandwidthRate)}</TableCell>
                      <TableCell className="font-semibold text-blue-600 dark:text-blue-400">{formatPKR(link.totalMonthlyCost)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950" onClick={() => { setSelectedLink(link); upgradeForm.reset({ newMbps: "", newRate: link.bandwidthRate || "", reason: "", requestedBy: "", effectiveDate: new Date().toISOString().split("T")[0], notes: "" }); setUpgradeDialogOpen(true); }} data-testid={`button-upgrade-link-${link.id}`}>
                            <ArrowUp className="h-3.5 w-3.5 mr-1" />
                            Upgrade
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950" onClick={() => { setSelectedLink(link); upgradeForm.reset({ newMbps: "", newRate: link.bandwidthRate || "", reason: "", requestedBy: "", effectiveDate: new Date().toISOString().split("T")[0], notes: "" }); setUpgradeDialogOpen(true); }} data-testid={`button-downgrade-link-${link.id}`}>
                            <ArrowDown className="h-3.5 w-3.5 mr-1" />
                            Downgrade
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setHistoryLink(link); setHistoryDialogOpen(true); }} data-testid={`button-history-link-${link.id}`}>
                            <History className="h-3.5 w-3.5 mr-1" />
                            History
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Change History Log
          </CardTitle>
          <CardDescription>Complete history of all bandwidth upgrades, downgrades, and rate changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search history..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} data-testid="input-bwc-search" />
            </div>
            <Select value={linkFilter} onValueChange={setLinkFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-bwc-link-filter">
                <SelectValue placeholder="Filter by Link" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Links</SelectItem>
                {(allLinks || []).filter(l => vendorFilter === "all" || l.vendorId === Number(vendorFilter)).map(l => (
                  <SelectItem key={l.id} value={String(l.id)}>{l.linkName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-bwc-type-filter">
                <SelectValue placeholder="Change Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="upgrade">Upgrades</SelectItem>
                <SelectItem value="downgrade">Downgrades</SelectItem>
                <SelectItem value="rate_change">Rate Changes</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 ml-auto">
              <Button size="sm" variant="outline" onClick={exportBwChangesCSV} data-testid="button-export-bwc-csv">
                <Download className="h-3.5 w-3.5 mr-1" />
                Export CSV
              </Button>
              <Button size="sm" variant="outline" onClick={generateBwChangesPDF} data-testid="button-generate-bwc-pdf">
                <FileText className="h-3.5 w-3.5 mr-1" />
                Generate PDF
              </Button>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium">No change history found</p>
              <p className="text-sm">Bandwidth changes will appear here after performing upgrades or downgrades</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead>New</TableHead>
                    <TableHead>Cost Impact</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map(record => {
                    const style = changeTypeStyles[record.changeType] || changeTypeStyles.upgrade;
                    const TypeIcon = style.icon;
                    const costChange = Number(record.newCost || 0) - Number(record.previousCost || 0);
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {record.effectiveDate || record.createdAt?.split("T")[0] || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{getVendorName(record.vendorId)}</TableCell>
                        <TableCell className="font-medium">{getLinkName(record.linkId)}</TableCell>
                        <TableCell>
                          <Badge className={`${style.color} no-default-active-elevate`}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {style.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-medium">{record.previousMbps} Mbps</span>
                            <span className="text-muted-foreground text-xs block">@ {formatPKR(record.previousRate)}/Mbps</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-medium">{record.newMbps} Mbps</span>
                            <span className="text-muted-foreground text-xs block">@ {formatPKR(record.newRate)}/Mbps</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${costChange > 0 ? "text-red-600 dark:text-red-400" : costChange < 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                            {costChange > 0 ? "+" : ""}{formatPKR(costChange)}
                          </span>
                          <span className="text-xs text-muted-foreground block">{formatPKR(record.previousCost)} → {formatPKR(record.newCost)}</span>
                        </TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">{record.reason || "-"}</TableCell>
                        <TableCell className="text-sm">{record.requestedBy || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === "completed" ? "default" : record.status === "pending" ? "secondary" : "outline"} className="text-[10px] no-default-active-elevate">
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Bandwidth Upgrade / Downgrade
            </DialogTitle>
          </DialogHeader>
          {selectedLink && (
            <div className="space-y-4">
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50">
                <CardContent className="pt-3 pb-3 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{selectedLink.linkName}</span>
                    <Badge variant="outline" className="no-default-active-elevate">{getVendorName(selectedLink.vendorId)}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Current Mbps</p>
                      <p className="font-bold">{selectedLink.bandwidthMbps}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Rate/Mbps</p>
                      <p className="font-bold">{formatPKR(selectedLink.bandwidthRate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Monthly Cost</p>
                      <p className="font-bold text-blue-600 dark:text-blue-400">{formatPKR(selectedLink.totalMonthlyCost)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <form onSubmit={upgradeForm.handleSubmit((data) => upgradeMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>New Bandwidth (Mbps) *</Label>
                    <Input type="number" placeholder="e.g. 500" data-testid="input-new-mbps" {...upgradeForm.register("newMbps", { required: true })} />
                  </div>
                  <div>
                    <Label>New Rate per Mbps (PKR) *</Label>
                    <Input type="number" placeholder="e.g. 100" data-testid="input-new-rate" {...upgradeForm.register("newRate", { required: true })} />
                  </div>
                </div>

                {(newMbpsWatch && newRateWatch) && (
                  <Card className={`${costDiff > 0 ? "border-red-200 dark:border-red-800" : costDiff < 0 ? "border-green-200 dark:border-green-800" : "border-gray-200 dark:border-gray-800"}`}>
                    <CardContent className="pt-3 pb-3 px-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">New Monthly Cost</p>
                          <p className="text-lg font-bold">{formatPKR(newCost)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase">Difference</p>
                          <p className={`text-lg font-bold ${costDiff > 0 ? "text-red-600 dark:text-red-400" : costDiff < 0 ? "text-green-600 dark:text-green-400" : ""}`}>
                            {costDiff > 0 ? "+" : ""}{formatPKR(costDiff)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Badge className={`no-default-active-elevate ${Number(newMbpsWatch) > Number(selectedLink.bandwidthMbps) ? "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-950" : Number(newMbpsWatch) < Number(selectedLink.bandwidthMbps) ? "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950" : "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950"}`}>
                          {Number(newMbpsWatch) > Number(selectedLink.bandwidthMbps) ? "UPGRADE" : Number(newMbpsWatch) < Number(selectedLink.bandwidthMbps) ? "DOWNGRADE" : "RATE CHANGE"}
                          : {selectedLink.bandwidthMbps} → {newMbpsWatch} Mbps
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Effective Date</Label>
                    <Input type="date" data-testid="input-effective-date" {...upgradeForm.register("effectiveDate")} />
                  </div>
                  <div>
                    <Label>Requested By</Label>
                    <Input placeholder="e.g. Admin" data-testid="input-requested-by" {...upgradeForm.register("requestedBy")} />
                  </div>
                </div>
                <div>
                  <Label>Reason</Label>
                  <Input placeholder="e.g. Customer demand increase" data-testid="input-change-reason" {...upgradeForm.register("reason")} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input placeholder="Additional notes..." data-testid="input-change-notes" {...upgradeForm.register("notes")} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setUpgradeDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={upgradeMutation.isPending} data-testid="button-submit-change">
                    {upgradeMutation.isPending ? "Processing..." : "Apply Change"}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Change History - {historyLink?.linkName}
            </DialogTitle>
          </DialogHeader>
          {historyLink && (
            <div className="space-y-4">
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50">
                <CardContent className="pt-3 pb-3 px-4">
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Vendor</p>
                      <p className="font-medium">{getVendorName(historyLink.vendorId)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Current Mbps</p>
                      <p className="font-bold">{historyLink.bandwidthMbps}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Rate/Mbps</p>
                      <p className="font-bold">{formatPKR(historyLink.bandwidthRate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Monthly Cost</p>
                      <p className="font-bold text-blue-600 dark:text-blue-400">{formatPKR(historyLink.totalMonthlyCost)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {(!linkHistory || linkHistory.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No changes recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkHistory.map((record, idx) => {
                    const style = changeTypeStyles[record.changeType] || changeTypeStyles.upgrade;
                    const TypeIcon = style.icon;
                    const costChange = Number(record.newCost || 0) - Number(record.previousCost || 0);
                    return (
                      <Card key={record.id} className="relative">
                        {idx < linkHistory.length - 1 && (
                          <div className="absolute left-7 top-full w-px h-3 bg-border" />
                        )}
                        <CardContent className="pt-3 pb-3 px-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${style.color} mt-0.5`}>
                              <TypeIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <Badge className={`${style.color} no-default-active-elevate`}>{style.label}</Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {record.effectiveDate || record.createdAt?.split("T")[0] || "N/A"}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-3 text-sm mt-2">
                                <div>
                                  <p className="text-[10px] text-muted-foreground uppercase">Bandwidth</p>
                                  <p><span className="text-muted-foreground line-through mr-1">{record.previousMbps}</span> → <span className="font-bold">{record.newMbps} Mbps</span></p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-muted-foreground uppercase">Rate</p>
                                  <p><span className="text-muted-foreground line-through mr-1">{formatPKR(record.previousRate)}</span> → <span className="font-bold">{formatPKR(record.newRate)}</span></p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-muted-foreground uppercase">Cost Impact</p>
                                  <p className={`font-bold ${costChange > 0 ? "text-red-600 dark:text-red-400" : costChange < 0 ? "text-green-600 dark:text-green-400" : ""}`}>
                                    {costChange > 0 ? "+" : ""}{formatPKR(costChange)}
                                  </p>
                                </div>
                              </div>
                              {(record.reason || record.requestedBy || record.notes) && (
                                <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                                  {record.reason && <p><span className="font-medium">Reason:</span> {record.reason}</p>}
                                  {record.requestedBy && <p><span className="font-medium">Requested by:</span> {record.requestedBy}</p>}
                                  {record.notes && <p><span className="font-medium">Notes:</span> {record.notes}</p>}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function VendorsPage() {
  const [tab] = useTab("list");

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto page-fade-in">
      <div className="vendor-page-header px-6 py-5 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-vendors-title">Vendor Management</h1>
            <p className="text-sm text-white/70 mt-0.5">Enterprise vendor operations, billing & package management</p>
          </div>
        </div>
      </div>

      {tab === "types" && <VendorTypesTab />}
      {tab === "add" && <AddVendorTab />}
      {tab === "list" && <VendorListTab />}
      {tab === "bandwidth-vendors" && <BandwidthVendorsTab />}
      {tab === "panel-vendors" && <PanelVendorsTab />}
      {tab === "packages" && <VendorPackagesTab />}
      {tab === "bandwidth-changes" && <BandwidthChangesTab />}
      {tab === "wallet" && <WalletTab />}
      {tab === "account" && <AccountLedgerTab />}
    </div>
  );
}
