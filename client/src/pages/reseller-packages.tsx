import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, Edit, Trash2, Package, RefreshCw, Copy,
  DollarSign, TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  Tag, Building2, Handshake, Percent, ToggleLeft, ToggleRight,
  Wifi, Star, Filter, MoreHorizontal, ChevronDown, Zap, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertResellerCompanyPackageSchema,
  insertResellerPackageAssignmentSchema,
  insertVendorPackageSchema,
} from "@shared/schema";
import type {
  ResellerCompanyPackage, ResellerPackageAssignment,
  VendorPackage, Vendor, Reseller,
} from "@shared/schema";
import { z } from "zod";

function fmt(n: number | string | undefined | null, d = 2) {
  return Number(n || 0).toLocaleString("en-PK", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function calcSellingPrice(baseCost: number, profitType: string, profitValue: number): number {
  if (profitType === "fixed") return baseCost + profitValue;
  if (profitType === "percentage") return baseCost * (1 + profitValue / 100);
  if (profitType === "custom") return profitValue;
  return baseCost;
}

const SourceBadge = ({ type }: { type: "vendor" | "company" }) =>
  type === "vendor"
    ? <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1"><Handshake className="w-3 h-3" />Vendor</Badge>
    : <Badge className="bg-green-100 text-green-700 border-green-200 gap-1"><Building2 className="w-3 h-3" />Company</Badge>;

// ─── Company Package Form ───────────────────────────────────────────────
const companyPkgFormSchema = insertResellerCompanyPackageSchema.extend({
  speedMbps: z.union([z.number(), z.string()]).transform(v => String(v)),
  uploadMbps: z.union([z.number(), z.string()]).optional().transform(v => v ? String(v) : undefined),
  downloadMbps: z.union([z.number(), z.string()]).optional().transform(v => v ? String(v) : undefined),
  costPerMbps: z.union([z.number(), z.string()]).optional().transform(v => v ? String(v) : undefined),
  profitValue: z.union([z.number(), z.string()]).optional().transform(v => v ? String(v) : "0"),
});
type CompanyPkgForm = z.infer<typeof companyPkgFormSchema>;

// ─── Vendor Package Form ─────────────────────────────────────────────────
const vendorPkgFormSchema = insertVendorPackageSchema.extend({
  vendorPrice: z.union([z.number(), z.string()]).transform(v => String(v)),
  ispSellingPrice: z.union([z.number(), z.string()]).transform(v => String(v)),
  resellerPrice: z.union([z.number(), z.string()]).optional().transform(v => v ? String(v) : undefined),
  ispMargin: z.union([z.number(), z.string()]).optional().transform(v => v ? String(v) : undefined),
  resellerMargin: z.union([z.number(), z.string()]).optional().transform(v => v ? String(v) : undefined),
});
type VendorPkgForm = z.infer<typeof vendorPkgFormSchema>;

export default function ResellerPackagesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("list");
  const [listSearch, setListSearch] = useState("");
  const [listSourceFilter, setListSourceFilter] = useState<"all" | "vendor" | "company">("all");
  const [deleteCompanyId, setDeleteCompanyId] = useState<number | null>(null);
  const [deleteVendorId, setDeleteVendorId] = useState<number | null>(null);
  const [deleteAssignId, setDeleteAssignId] = useState<number | null>(null);
  const [editCompanyPkg, setEditCompanyPkg] = useState<ResellerCompanyPackage | null>(null);
  const [editVendorPkg, setEditVendorPkg] = useState<VendorPackage | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addSourceType, setAddSourceType] = useState<"vendor" | "company">("company");
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignPkgType, setAssignPkgType] = useState<"vendor" | "company">("company");
  const [assignPkgId, setAssignPkgId] = useState<number>(0);
  const [bulkMarginType, setBulkMarginType] = useState("percentage");
  const [bulkMarginValue, setBulkMarginValue] = useState("10");

  // Queries
  const { data: companyPkgs, isLoading: cLoading } = useQuery<ResellerCompanyPackage[]>({
    queryKey: ["/api/reseller-company-packages"],
  });
  const { data: vendorPkgs, isLoading: vLoading } = useQuery<VendorPackage[]>({
    queryKey: ["/api/vendor-packages"],
  });
  const { data: vendors } = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });
  const { data: resellers } = useQuery<Reseller[]>({ queryKey: ["/api/resellers"] });
  const { data: assignments, isLoading: aLoading } = useQuery<ResellerPackageAssignment[]>({
    queryKey: ["/api/reseller-package-assignments"],
  });
  const { data: poolStats } = useQuery<{ costPerMbps?: number }>({
    queryKey: ["/api/bandwidth-pool/stats"],
  });

  // Forms
  const companyForm = useForm<CompanyPkgForm>({
    resolver: zodResolver(companyPkgFormSchema),
    defaultValues: {
      packageName: "", speedMbps: "", uploadMbps: "", downloadMbps: "",
      contentionRatio: "1:1", validity: "30 days", costPerMbps: "",
      profitType: "fixed", profitValue: "0", description: "", isActive: true,
    },
  });

  const vendorForm = useForm<VendorPkgForm>({
    resolver: zodResolver(vendorPkgFormSchema),
    defaultValues: {
      vendorId: 0, packageName: "", speed: "", vendorPrice: "0",
      ispSellingPrice: "0", resellerPrice: "", dataLimit: "", validity: "30 days",
      ispMargin: "", resellerMargin: "", isActive: true,
    },
  });

  const assignForm = useForm({
    defaultValues: {
      resellerId: 0, customPrice: "", profitOverride: "", notes: "", isEnabled: true,
    },
  });

  // Live calculation in company form
  const watchedSpeed = companyForm.watch("speedMbps");
  const watchedCostPerMbps = companyForm.watch("costPerMbps");
  const watchedProfitType = companyForm.watch("profitType");
  const watchedProfitValue = companyForm.watch("profitValue");
  const liveBaseCost = parseFloat(watchedSpeed || "0") * parseFloat(watchedCostPerMbps || "0");
  const liveSellingPrice = calcSellingPrice(liveBaseCost, watchedProfitType, parseFloat(watchedProfitValue || "0"));
  const liveProfit = liveSellingPrice - liveBaseCost;

  // Live calculation in vendor form
  const watchedVendorPrice = vendorForm.watch("vendorPrice");
  const watchedIspSellingPrice = vendorForm.watch("ispSellingPrice");
  const watchedResellerPrice = vendorForm.watch("resellerPrice");
  const liveIspMargin = parseFloat(watchedIspSellingPrice || "0") - parseFloat(watchedVendorPrice || "0");
  const liveResellerMargin = parseFloat(watchedResellerPrice || "0") > 0
    ? parseFloat(watchedResellerPrice || "0") - parseFloat(watchedIspSellingPrice || "0")
    : 0;

  // Mutations - Company Packages
  const createCompanyMutation = useMutation({
    mutationFn: (data: CompanyPkgForm) => apiRequest("POST", "/api/reseller-company-packages", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-company-packages"] });
      setShowAddDialog(false); setEditCompanyPkg(null); companyForm.reset();
      toast({ title: "Company package created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CompanyPkgForm> }) =>
      apiRequest("PATCH", `/api/reseller-company-packages/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-company-packages"] });
      setEditCompanyPkg(null); toast({ title: "Package updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/reseller-company-packages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-company-packages"] });
      setDeleteCompanyId(null); toast({ title: "Package deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Mutations - Vendor Packages
  const createVendorMutation = useMutation({
    mutationFn: (data: VendorPkgForm) => apiRequest("POST", "/api/vendor-packages", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-packages"] });
      setShowAddDialog(false); setEditVendorPkg(null); vendorForm.reset();
      toast({ title: "Vendor package mapping created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateVendorMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<VendorPkgForm> }) =>
      apiRequest("PATCH", `/api/vendor-packages/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-packages"] });
      setEditVendorPkg(null); toast({ title: "Vendor package updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteVendorMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/vendor-packages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-packages"] });
      setDeleteVendorId(null); toast({ title: "Vendor package deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Mutations - Assignments
  const createAssignMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/reseller-package-assignments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-package-assignments"] });
      setShowAssignDialog(false); assignForm.reset();
      toast({ title: "Package assigned to reseller" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleAssignMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: number; isEnabled: boolean }) =>
      apiRequest("PATCH", `/api/reseller-package-assignments/${id}`, { isEnabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/reseller-package-assignments"] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteAssignMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/reseller-package-assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-package-assignments"] });
      setDeleteAssignId(null); toast({ title: "Assignment removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Combined list for "All Packages" tab
  const combinedPackages = useMemo(() => {
    const items: {
      id: string; name: string; source: "vendor" | "company"; vendorName?: string;
      speed: string; costPrice: number; sellingPrice: number; margin: number;
      isActive: boolean; assigned: number;
    }[] = [];

    (vendorPkgs || []).forEach(p => {
      const vendor = (vendors || []).find(v => v.id === p.vendorId);
      const cost = parseFloat(p.vendorPrice || "0");
      const selling = parseFloat(p.ispSellingPrice || "0");
      const assigned = (assignments || []).filter(a => a.packageType === "vendor" && a.vendorPackageId === p.id).length;
      items.push({
        id: `vendor-${p.id}`, name: p.packageName, source: "vendor",
        vendorName: vendor?.companyName || vendor?.name || `Vendor #${p.vendorId}`,
        speed: p.speed || "—", costPrice: cost, sellingPrice: selling,
        margin: selling - cost, isActive: p.isActive, assigned,
      });
    });

    (companyPkgs || []).forEach(p => {
      const cost = parseFloat(p.baseCost || "0");
      const selling = parseFloat(p.sellingPrice || "0");
      const assigned = (assignments || []).filter(a => a.packageType === "company" && a.companyPackageId === p.id).length;
      items.push({
        id: `company-${p.id}`, name: p.packageName, source: "company",
        speed: `${p.speedMbps} Mbps`, costPrice: cost, sellingPrice: selling,
        margin: selling - cost, isActive: p.isActive, assigned,
      });
    });

    return items;
  }, [vendorPkgs, companyPkgs, vendors, assignments]);

  const filteredList = useMemo(() => {
    const q = listSearch.toLowerCase();
    return combinedPackages.filter(p =>
      (listSourceFilter === "all" || p.source === listSourceFilter) &&
      (!q || p.name.toLowerCase().includes(q) || (p.vendorName || "").toLowerCase().includes(q))
    );
  }, [combinedPackages, listSearch, listSourceFilter]);

  const openEditCompany = (p: ResellerCompanyPackage) => {
    setEditCompanyPkg(p);
    companyForm.reset({
      packageName: p.packageName, speedMbps: p.speedMbps, uploadMbps: p.uploadMbps || "",
      downloadMbps: p.downloadMbps || "", contentionRatio: p.contentionRatio || "1:1",
      validity: p.validity || "30 days", costPerMbps: p.costPerMbps || "",
      profitType: p.profitType || "fixed", profitValue: p.profitValue || "0",
      description: p.description || "", isActive: p.isActive,
    });
  };

  const openEditVendor = (p: VendorPackage) => {
    setEditVendorPkg(p);
    vendorForm.reset({
      vendorId: p.vendorId, packageName: p.packageName, speed: p.speed || "",
      vendorPrice: p.vendorPrice, ispSellingPrice: p.ispSellingPrice,
      resellerPrice: p.resellerPrice || "", dataLimit: p.dataLimit || "",
      validity: p.validity || "30 days", ispMargin: p.ispMargin || "",
      resellerMargin: p.resellerMargin || "", isActive: p.isActive,
    });
  };

  const cloneCompanyPkg = (p: ResellerCompanyPackage) => {
    setShowAddDialog(true);
    setAddSourceType("company");
    setTimeout(() => companyForm.reset({
      packageName: `${p.packageName} (Copy)`, speedMbps: p.speedMbps,
      contentionRatio: p.contentionRatio || "1:1", validity: p.validity || "30 days",
      costPerMbps: p.costPerMbps || "", profitType: p.profitType,
      profitValue: p.profitValue || "0", isActive: true,
    }), 0);
  };

  const openAssign = (type: "vendor" | "company", id: number) => {
    setAssignPkgType(type); setAssignPkgId(id);
    setShowAssignDialog(true); assignForm.reset();
  };

  const handleBulkMarginUpdate = async () => {
    const val = parseFloat(bulkMarginValue);
    if (isNaN(val)) return;
    let count = 0;
    for (const p of companyPkgs || []) {
      const base = parseFloat(p.baseCost || "0");
      const selling = calcSellingPrice(base, bulkMarginType, val);
      await apiRequest("PATCH", `/api/reseller-company-packages/${p.id}`, {
        profitType: bulkMarginType, profitValue: String(val), sellingPrice: selling.toFixed(2),
      });
      count++;
    }
    queryClient.invalidateQueries({ queryKey: ["/api/reseller-company-packages"] });
    toast({ title: `Updated ${count} company packages` });
  };

  const isLoading = cLoading || vLoading;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Reseller Packages
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage vendor-based and company-owned reseller packages with full profit control
          </p>
        </div>
        <Button onClick={() => { setShowAddDialog(true); companyForm.reset(); vendorForm.reset(); }} data-testid="btn-add-package">
          <Plus className="w-4 h-4 mr-2" />
          Add Package
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Packages", value: filteredList.length, icon: Package, color: "text-primary" },
          { label: "Vendor Packages", value: (vendorPkgs || []).length, icon: Handshake, color: "text-blue-600" },
          { label: "Company Packages", value: (companyPkgs || []).length, icon: Building2, color: "text-green-600" },
          { label: "Assignments", value: (assignments || []).length, icon: Tag, color: "text-violet-600" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-8 h-8 ${s.color} shrink-0`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="list" data-testid="tab-list"><Package className="w-4 h-4 mr-1" />All Packages</TabsTrigger>
          <TabsTrigger value="company" data-testid="tab-company"><Building2 className="w-4 h-4 mr-1" />Company Packages</TabsTrigger>
          <TabsTrigger value="vendor-mapping" data-testid="tab-vendor"><Handshake className="w-4 h-4 mr-1" />Vendor Mapping</TabsTrigger>
          <TabsTrigger value="profit" data-testid="tab-profit"><Percent className="w-4 h-4 mr-1" />Profit Config</TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments"><Tag className="w-4 h-4 mr-1" />Assignments</TabsTrigger>
        </TabsList>

        {/* ─── ALL PACKAGES LIST ─── */}
        <TabsContent value="list" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search packages..." className="pl-9 w-56" value={listSearch}
                  onChange={e => setListSearch(e.target.value)} data-testid="input-list-search" />
              </div>
              <Select value={listSourceFilter} onValueChange={(v: any) => setListSourceFilter(v)}>
                <SelectTrigger className="w-36" data-testid="select-source-filter">
                  <Filter className="w-3 h-3 mr-1" /><SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="vendor">Vendor Only</SelectItem>
                  <SelectItem value="company">Company Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead className="text-right">Cost Price</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 10 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}</TableRow>
                )) : filteredList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      No packages found. Add a vendor or company package to get started.
                    </TableCell>
                  </TableRow>
                ) : filteredList.map(p => (
                  <TableRow key={p.id} data-testid={`row-pkg-${p.id}`}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><SourceBadge type={p.source} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.vendorName || "—"}</TableCell>
                    <TableCell><span className="font-medium text-blue-600">{p.speed}</span></TableCell>
                    <TableCell className="text-right">PKR {fmt(p.costPrice)}</TableCell>
                    <TableCell className="text-right font-semibold">PKR {fmt(p.sellingPrice)}</TableCell>
                    <TableCell className={`text-right font-bold ${p.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {p.margin >= 0 ? "+" : ""}PKR {fmt(p.margin)}
                      {p.margin < 0 && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{p.assigned} resellers</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? "default" : "secondary"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`btn-actions-${p.id}`}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openAssign(p.source, parseInt(p.id.split("-")[1]))}>
                            <Tag className="w-4 h-4 mr-2" />Assign to Reseller
                          </DropdownMenuItem>
                          {p.source === "company" && (
                            <DropdownMenuItem onClick={() => {
                              const pkg = (companyPkgs || []).find(c => c.id === parseInt(p.id.split("-")[1]));
                              if (pkg) cloneCompanyPkg(pkg);
                            }}>
                              <Copy className="w-4 h-4 mr-2" />Clone
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600" onClick={() => {
                            if (p.source === "company") setDeleteCompanyId(parseInt(p.id.split("-")[1]));
                            else setDeleteVendorId(parseInt(p.id.split("-")[1]));
                          }}>
                            <Trash2 className="w-4 h-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ─── COMPANY PACKAGES ─── */}
        <TabsContent value="company" className="space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm text-muted-foreground">
                Packages created from your own purchased bandwidth. Full cost &amp; pricing control.
              </p>
            </div>
            <Button onClick={() => { setShowAddDialog(true); setAddSourceType("company"); companyForm.reset(); }} data-testid="btn-add-company-pkg">
              <Plus className="w-4 h-4 mr-2" />New Company Package
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cLoading ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-32" /></CardContent></Card>
            )) : (companyPkgs || []).length === 0 ? (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No company packages yet. Create your first one.</p>
              </div>
            ) : (companyPkgs || []).map(p => {
              const base = parseFloat(p.baseCost || "0");
              const selling = parseFloat(p.sellingPrice || "0");
              const profit = selling - base;
              const margin = base > 0 ? ((profit / base) * 100).toFixed(1) : "0";
              const assigned = (assignments || []).filter(a => a.packageType === "company" && a.companyPackageId === p.id).length;
              return (
                <Card key={p.id} className={`relative ${!p.isActive ? "opacity-60" : ""}`} data-testid={`card-company-pkg-${p.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Wifi className="w-4 h-4 text-green-600" />
                          {p.packageName}
                        </CardTitle>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          <SourceBadge type="company" />
                          <Badge variant="outline" className="text-xs">{p.speedMbps} Mbps</Badge>
                          {p.validity && <Badge variant="secondary" className="text-xs">{p.validity}</Badge>}
                        </div>
                      </div>
                      <Switch checked={p.isActive} onCheckedChange={(v) =>
                        updateCompanyMutation.mutate({ id: p.id, data: { isActive: v } })
                      } data-testid={`switch-company-${p.id}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded bg-muted p-2">
                        <p className="text-[10px] text-muted-foreground">Base Cost</p>
                        <p className="text-sm font-semibold text-red-600">PKR {fmt(base)}</p>
                      </div>
                      <div className="rounded bg-muted p-2">
                        <p className="text-[10px] text-muted-foreground">Selling</p>
                        <p className="text-sm font-semibold">PKR {fmt(selling)}</p>
                      </div>
                      <div className={`rounded p-2 ${profit >= 0 ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"}`}>
                        <p className="text-[10px] text-muted-foreground">Profit</p>
                        <p className={`text-sm font-semibold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {profit >= 0 ? "+" : ""}PKR {fmt(profit)}
                        </p>
                      </div>
                    </div>

                    {profit < 0 && (
                      <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded p-2">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Selling below cost! Review pricing.</span>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                      {p.contentionRatio && <span>Contention: {p.contentionRatio}</span>}
                      {p.costPerMbps && <span>Cost/Mbps: PKR {fmt(p.costPerMbps, 4)}</span>}
                      <span className="text-violet-600">Margin: {margin}%</span>
                      <span>{assigned} assigned</span>
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => openEditCompany(p)} data-testid={`btn-edit-company-${p.id}`}>
                        <Edit className="w-3 h-3 mr-1" />Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => cloneCompanyPkg(p)} data-testid={`btn-clone-company-${p.id}`}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => openAssign("company", p.id)} data-testid={`btn-assign-company-${p.id}`}>
                        <Tag className="w-3 h-3 mr-1" />Assign
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteCompanyId(p.id)} data-testid={`btn-delete-company-${p.id}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ─── VENDOR PACKAGES MAPPING ─── */}
        <TabsContent value="vendor-mapping" className="space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              Map upstream vendor packages with markup rules for reseller distribution.
            </p>
            <Button onClick={() => { setShowAddDialog(true); setAddSourceType("vendor"); vendorForm.reset(); }} data-testid="btn-add-vendor-pkg">
              <Plus className="w-4 h-4 mr-2" />Map Vendor Package
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package Name</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead className="text-right">Vendor Price</TableHead>
                  <TableHead className="text-right">ISP Selling</TableHead>
                  <TableHead className="text-right">Reseller Price</TableHead>
                  <TableHead className="text-right">ISP Margin</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vLoading ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 10 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}</TableRow>
                )) : (vendorPkgs || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No vendor packages mapped yet. Click "Map Vendor Package" to start.
                    </TableCell>
                  </TableRow>
                ) : (vendorPkgs || []).map(p => {
                  const vendor = (vendors || []).find(v => v.id === p.vendorId);
                  const ispMargin = parseFloat(p.ispSellingPrice || "0") - parseFloat(p.vendorPrice || "0");
                  return (
                    <TableRow key={p.id} data-testid={`row-vendor-pkg-${p.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5">
                          <Handshake className="w-4 h-4 text-blue-500" />
                          {p.packageName}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{vendor?.companyName || `Vendor #${p.vendorId}`}</TableCell>
                      <TableCell><span className="text-blue-600 font-medium">{p.speed || "—"}</span></TableCell>
                      <TableCell className="text-right text-red-600">PKR {fmt(p.vendorPrice)}</TableCell>
                      <TableCell className="text-right font-semibold">PKR {fmt(p.ispSellingPrice)}</TableCell>
                      <TableCell className="text-right text-violet-600">
                        {p.resellerPrice ? `PKR ${fmt(p.resellerPrice)}` : "—"}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${ispMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                        PKR {fmt(ispMargin)}
                        {ispMargin < 0 && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.validity || "30 days"}</TableCell>
                      <TableCell>
                        <Badge variant={p.isActive ? "default" : "secondary"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditVendor(p)} data-testid={`btn-edit-vendor-${p.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openAssign("vendor", p.id)} data-testid={`btn-assign-vendor-${p.id}`}>
                            <Tag className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteVendorId(p.id)} data-testid={`btn-delete-vendor-${p.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ─── PROFIT CONFIGURATION ─── */}
        <TabsContent value="profit" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bulk Margin Update */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-primary" />
                  Bulk Margin Update
                </CardTitle>
                <CardDescription>Apply a uniform profit rule across all company packages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Profit Type</Label>
                  <Select value={bulkMarginType} onValueChange={setBulkMarginType}>
                    <SelectTrigger data-testid="select-bulk-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount (PKR)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Profit Value</Label>
                  <Input
                    type="number" value={bulkMarginValue}
                    onChange={e => setBulkMarginValue(e.target.value)}
                    placeholder={bulkMarginType === "percentage" ? "e.g. 20" : "e.g. 500"}
                    data-testid="input-bulk-margin"
                  />
                  <p className="text-xs text-muted-foreground">
                    {bulkMarginType === "percentage"
                      ? `Selling Price = Base Cost × (1 + ${bulkMarginValue}%)`
                      : `Selling Price = Base Cost + PKR ${bulkMarginValue}`}
                  </p>
                </div>
                <Button onClick={handleBulkMarginUpdate} className="w-full" data-testid="btn-bulk-update">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Apply to All Company Packages ({(companyPkgs || []).length})
                </Button>
              </CardContent>
            </Card>

            {/* Profit per package preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Package Profit Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(companyPkgs || []).map(p => {
                    const base = parseFloat(p.baseCost || "0");
                    const selling = parseFloat(p.sellingPrice || "0");
                    const profit = selling - base;
                    const margin = base > 0 ? ((profit / base) * 100).toFixed(1) : "0";
                    return (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50" data-testid={`profit-row-${p.id}`}>
                        <div className="flex items-center gap-2">
                          {profit < 0
                            ? <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                            : <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                          <div>
                            <p className="text-sm font-medium">{p.packageName}</p>
                            <p className="text-xs text-muted-foreground">{p.speedMbps} Mbps · {p.profitType}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {profit >= 0 ? "+" : ""}PKR {fmt(profit)}
                          </p>
                          <p className="text-xs text-muted-foreground">{margin}% margin</p>
                        </div>
                      </div>
                    );
                  })}
                  {(companyPkgs || []).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No company packages yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Live Pricing Calculator
              </CardTitle>
              <CardDescription>Preview how profit configuration affects selling price</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Base Cost (PKR)</Label>
                  <Input type="number" placeholder="e.g. 1000" id="calc-base" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Profit Type</Label>
                  <Select defaultValue="fixed">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed (PKR)</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Profit Value</Label>
                  <Input type="number" placeholder="e.g. 200" id="calc-profit" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Result</Label>
                  <div className="h-10 px-3 border rounded-md flex items-center bg-green-50 dark:bg-green-950/20">
                    <span className="text-green-700 font-semibold text-sm">Selling Price Shown Here</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── PACKAGE ASSIGNMENTS ─── */}
        <TabsContent value="assignments" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Package Assignments to Resellers
              </CardTitle>
              <CardDescription>Control which resellers can offer which packages</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reseller</TableHead>
                    <TableHead>Package Type</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead className="text-right">Custom Price</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Assigned On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aLoading ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}</TableRow>
                  )) : (assignments || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No package assignments yet. Assign packages to resellers from the Packages tabs.
                      </TableCell>
                    </TableRow>
                  ) : (assignments || []).map(a => {
                    const reseller = (resellers || []).find(r => r.id === a.resellerId);
                    const vendorPkg = a.packageType === "vendor" ? (vendorPkgs || []).find(p => p.id === a.vendorPackageId) : null;
                    const companyPkg = a.packageType === "company" ? (companyPkgs || []).find(p => p.id === a.companyPackageId) : null;
                    const pkgName = vendorPkg?.packageName || companyPkg?.packageName || "—";
                    return (
                      <TableRow key={a.id} data-testid={`row-assign-${a.id}`}>
                        <TableCell className="font-medium">{reseller?.companyName || reseller?.name || `Reseller #${a.resellerId}`}</TableCell>
                        <TableCell><SourceBadge type={a.packageType as "vendor" | "company"} /></TableCell>
                        <TableCell>{pkgName}</TableCell>
                        <TableCell className="text-right">
                          {a.customPrice ? `PKR ${fmt(a.customPrice)}` : <span className="text-muted-foreground text-sm">Default</span>}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={a.isEnabled}
                            onCheckedChange={v => toggleAssignMutation.mutate({ id: a.id, isEnabled: v })}
                            data-testid={`switch-assign-${a.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {(a.createdAt || "").split("T")[0]}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteAssignId(a.id)} data-testid={`btn-delete-assign-${a.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── ADD PACKAGE DIALOG ─── */}
      <Dialog open={showAddDialog || !!editCompanyPkg || !!editVendorPkg} onOpenChange={(open) => {
        if (!open) { setShowAddDialog(false); setEditCompanyPkg(null); setEditVendorPkg(null); }
      }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editCompanyPkg ? "Edit Company Package" : editVendorPkg ? "Edit Vendor Package Mapping"
                : addSourceType === "company" ? "New Company Package" : "Map Vendor Package"}
            </DialogTitle>
          </DialogHeader>

          {/* Source selector for new packages */}
          {!editCompanyPkg && !editVendorPkg && (
            <div className="flex gap-2 mb-2">
              <Button
                type="button" variant={addSourceType === "company" ? "default" : "outline"}
                className="flex-1 gap-2" onClick={() => setAddSourceType("company")}
                data-testid="btn-source-company"
              >
                <Building2 className="w-4 h-4" />Company Package
              </Button>
              <Button
                type="button" variant={addSourceType === "vendor" ? "default" : "outline"}
                className="flex-1 gap-2" onClick={() => setAddSourceType("vendor")}
                data-testid="btn-source-vendor"
              >
                <Handshake className="w-4 h-4" />Vendor Package
              </Button>
            </div>
          )}

          {/* Company Package Form */}
          {(addSourceType === "company" || editCompanyPkg) && !editVendorPkg && (
            <Form {...companyForm}>
              <form onSubmit={companyForm.handleSubmit(editCompanyPkg
                ? (data) => updateCompanyMutation.mutate({ id: editCompanyPkg.id, data })
                : (data) => createCompanyMutation.mutate(data)
              )} className="space-y-4">
                <FormField control={companyForm.control} name="packageName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Name *</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. Business 10Mbps" data-testid="input-pkg-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-3 gap-3">
                  <FormField control={companyForm.control} name="speedMbps" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Speed (Mbps) *</FormLabel>
                      <FormControl><Input {...field} type="number" placeholder="10" data-testid="input-speed" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={companyForm.control} name="uploadMbps" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload (Mbps)</FormLabel>
                      <FormControl><Input {...field} value={field.value ?? ""} type="number" placeholder="10" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={companyForm.control} name="downloadMbps" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Download (Mbps)</FormLabel>
                      <FormControl><Input {...field} value={field.value ?? ""} type="number" placeholder="10" /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField control={companyForm.control} name="contentionRatio" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contention Ratio</FormLabel>
                      <FormControl>
                        <Select value={field.value ?? "1:1"} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-contention"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["1:1","1:2","1:4","1:8","1:16"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={companyForm.control} name="validity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validity</FormLabel>
                      <FormControl>
                        <Select value={field.value ?? "30 days"} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["7 days","15 days","30 days","60 days","90 days","1 year"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )} />
                </div>

                <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pricing & Profit</p>
                  <FormField control={companyForm.control} name="costPerMbps" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost per Mbps (PKR)</FormLabel>
                      <FormControl><Input {...field} value={field.value ?? ""} type="number" step="0.0001" placeholder="e.g. 100" data-testid="input-cost-per-mbps" /></FormControl>
                      <FormDescription className="text-xs">
                        Base Cost = {fmt(liveBaseCost)} PKR ({watchedSpeed || "0"} Mbps × PKR {watchedCostPerMbps || "0"}/Mbps)
                      </FormDescription>
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={companyForm.control} name="profitType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profit Type</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger data-testid="select-profit-type"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Fixed (PKR)</SelectItem>
                              <SelectItem value="percentage">Percentage (%)</SelectItem>
                              <SelectItem value="custom">Custom Price</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={companyForm.control} name="profitValue" render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {watchedProfitType === "fixed" ? "Profit Amount (PKR)" : watchedProfitType === "percentage" ? "Profit %" : "Selling Price (PKR)"}
                        </FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ""} type="number" placeholder="e.g. 200" data-testid="input-profit-value" /></FormControl>
                      </FormItem>
                    )} />
                  </div>

                  {/* Live preview */}
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="text-center p-2 rounded bg-red-50 dark:bg-red-950/20">
                      <p className="text-[10px] text-muted-foreground">Base Cost</p>
                      <p className="text-sm font-bold text-red-600">PKR {fmt(liveBaseCost)}</p>
                    </div>
                    <div className="text-center p-2 rounded bg-blue-50 dark:bg-blue-950/20">
                      <p className="text-[10px] text-muted-foreground">Selling Price</p>
                      <p className="text-sm font-bold">PKR {fmt(liveSellingPrice)}</p>
                    </div>
                    <div className={`text-center p-2 rounded ${liveProfit >= 0 ? "bg-green-50 dark:bg-green-950/20" : "bg-orange-50 dark:bg-orange-950/20"}`}>
                      <p className="text-[10px] text-muted-foreground">Profit</p>
                      <p className={`text-sm font-bold ${liveProfit >= 0 ? "text-green-600" : "text-orange-600"}`}>
                        {liveProfit >= 0 ? "+" : ""}PKR {fmt(liveProfit)}
                      </p>
                    </div>
                  </div>
                  {liveProfit < 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded p-2">
                      <AlertTriangle className="w-3 h-3" />
                      Warning: Selling price is below cost!
                    </div>
                  )}
                </div>

                <FormField control={companyForm.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea {...field} value={field.value ?? ""} rows={2} placeholder="Optional package description..." /></FormControl>
                  </FormItem>
                )} />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { setShowAddDialog(false); setEditCompanyPkg(null); }}>Cancel</Button>
                  <Button type="submit" disabled={createCompanyMutation.isPending || updateCompanyMutation.isPending} data-testid="btn-submit-company-pkg">
                    {(createCompanyMutation.isPending || updateCompanyMutation.isPending) && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                    {editCompanyPkg ? "Update Package" : "Create Package"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}

          {/* Vendor Package Form */}
          {(addSourceType === "vendor" || editVendorPkg) && !editCompanyPkg && (
            <Form {...vendorForm}>
              <form onSubmit={vendorForm.handleSubmit(editVendorPkg
                ? (data) => updateVendorMutation.mutate({ id: editVendorPkg.id, data })
                : (data) => createVendorMutation.mutate(data)
              )} className="space-y-4">
                <FormField control={vendorForm.control} name="vendorId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor *</FormLabel>
                    <FormControl>
                      <Select value={String(field.value)} onValueChange={v => field.onChange(Number(v))}>
                        <SelectTrigger data-testid="select-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                        <SelectContent>
                          {(vendors || []).map(v => <SelectItem key={v.id} value={String(v.id)}>{v.companyName || v.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-3">
                  <FormField control={vendorForm.control} name="packageName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Name *</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g. 10Mbps Basic" data-testid="input-vendor-pkg-name" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={vendorForm.control} name="speed" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Speed</FormLabel>
                      <FormControl><Input {...field} value={field.value ?? ""} placeholder="e.g. 10Mbps" /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pricing</p>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={vendorForm.control} name="vendorPrice" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor Price *</FormLabel>
                        <FormControl><Input {...field} type="number" placeholder="0" data-testid="input-vendor-price" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={vendorForm.control} name="ispSellingPrice" render={({ field }) => (
                      <FormItem>
                        <FormLabel>ISP Selling Price *</FormLabel>
                        <FormControl><Input {...field} type="number" placeholder="0" data-testid="input-isp-price" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={vendorForm.control} name="resellerPrice" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reseller Price</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ""} type="number" placeholder="0" /></FormControl>
                      </FormItem>
                    )} />
                  </div>

                  {/* Live margins */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 rounded bg-green-50 dark:bg-green-950/20">
                      <p className="text-[10px] text-muted-foreground">ISP Margin</p>
                      <p className={`text-sm font-bold ${liveIspMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                        PKR {fmt(liveIspMargin)}
                        {liveIspMargin < 0 && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded bg-violet-50 dark:bg-violet-950/20">
                      <p className="text-[10px] text-muted-foreground">Reseller Margin</p>
                      <p className="text-sm font-bold text-violet-600">PKR {fmt(liveResellerMargin)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField control={vendorForm.control} name="dataLimit" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Limit</FormLabel>
                      <FormControl><Input {...field} value={field.value ?? ""} placeholder="Unlimited" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={vendorForm.control} name="validity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validity</FormLabel>
                      <FormControl>
                        <Select value={field.value ?? "30 days"} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["7 days","15 days","30 days","60 days","90 days","1 year"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )} />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { setShowAddDialog(false); setEditVendorPkg(null); }}>Cancel</Button>
                  <Button type="submit" disabled={createVendorMutation.isPending || updateVendorMutation.isPending} data-testid="btn-submit-vendor-pkg">
                    {(createVendorMutation.isPending || updateVendorMutation.isPending) && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                    {editVendorPkg ? "Update Mapping" : "Create Mapping"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── ASSIGN DIALOG ─── */}
      <Dialog open={showAssignDialog} onOpenChange={(open) => { if (!open) setShowAssignDialog(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Package to Reseller</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const values = assignForm.getValues();
            if (!values.resellerId) { toast({ title: "Please select a reseller", variant: "destructive" }); return; }
            createAssignMutation.mutate({
              resellerId: Number(values.resellerId),
              packageType: assignPkgType,
              vendorPackageId: assignPkgType === "vendor" ? assignPkgId : undefined,
              companyPackageId: assignPkgType === "company" ? assignPkgId : undefined,
              customPrice: values.customPrice || undefined,
              notes: values.notes || undefined,
              isEnabled: true,
              assignedBy: "admin",
            });
          }} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Reseller *</Label>
              <Select onValueChange={v => assignForm.setValue("resellerId", Number(v))}>
                <SelectTrigger data-testid="select-assign-reseller">
                  <SelectValue placeholder="Choose reseller..." />
                </SelectTrigger>
                <SelectContent>
                  {(resellers || []).filter(r => r.status === "active").map(r => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.companyName || r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom Price (optional)</Label>
              <Input type="number" placeholder="Leave empty to use default price"
                onChange={e => assignForm.setValue("customPrice", e.target.value)}
                data-testid="input-assign-price"
              />
              <p className="text-xs text-muted-foreground">Override the default selling price for this reseller</p>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input placeholder="Optional notes..."
                onChange={e => assignForm.setValue("notes", e.target.value)} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createAssignMutation.isPending} data-testid="btn-submit-assign">
                {createAssignMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                Assign Package
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirms */}
      <AlertDialog open={!!deleteCompanyId} onOpenChange={() => setDeleteCompanyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company Package</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the package. Any existing assignments will be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteCompanyId && deleteCompanyMutation.mutate(deleteCompanyId)} data-testid="btn-confirm-delete-company">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteVendorId} onOpenChange={() => setDeleteVendorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor Package Mapping</AlertDialogTitle>
            <AlertDialogDescription>This will remove the vendor package from the reseller catalog.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteVendorId && deleteVendorMutation.mutate(deleteVendorId)} data-testid="btn-confirm-delete-vendor">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteAssignId} onOpenChange={() => setDeleteAssignId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Assignment</AlertDialogTitle>
            <AlertDialogDescription>This will revoke this reseller's access to the package.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteAssignId && deleteAssignMutation.mutate(deleteAssignId)} data-testid="btn-confirm-delete-assign">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
