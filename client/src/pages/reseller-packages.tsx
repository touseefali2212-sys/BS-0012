import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, Edit, Trash2, Package, RefreshCw, Copy,
  DollarSign, TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  Tag, Building2, Handshake, Percent, Filter, MoreHorizontal,
  Wifi, ChevronDown, ChevronUp, Users, Eye, PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

// ─── Utilities ────────────────────────────────────────────────────────────────
function fmt(n: number | string | undefined | null, d = 2) {
  return Number(n || 0).toLocaleString("en-PK", { minimumFractionDigits: d, maximumFractionDigits: d });
}


function calcAssignTotal(defaultPrice: number, profitType: string, profitValue: number): number {
  if (profitType === "none") return defaultPrice;
  if (profitType === "fixed") return defaultPrice + profitValue;
  if (profitType === "percentage") return defaultPrice * (1 + profitValue / 100);
  if (profitType === "custom") return profitValue;
  return defaultPrice;
}

// ─── Small components ─────────────────────────────────────────────────────────
const SourceBadge = ({ type }: { type: "vendor" | "company" }) =>
  type === "vendor"
    ? <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1 text-[10px]"><Handshake className="w-3 h-3" />Vendor</Badge>
    : <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 text-[10px]"><Building2 className="w-3 h-3" />Company</Badge>;

// Expandable reseller list shown in the Assigned column
function AssignedResellersCell({ resellers }: { resellers: { name: string; price: number; enabled: boolean }[] }) {
  const [open, setOpen] = useState(false);
  if (resellers.length === 0)
    return <span className="text-xs text-muted-foreground italic">None</span>;
  const preview = resellers.slice(0, 2);
  const rest = resellers.slice(2);
  return (
    <div className="space-y-1 min-w-[160px]">
      {preview.map((r, i) => (
        <div key={i} className="flex items-center gap-1 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${r.enabled ? "bg-green-50 border-green-200 text-green-800" : "bg-gray-100 border-gray-200 text-gray-500"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${r.enabled ? "bg-green-500" : "bg-gray-400"}`} />
            {r.name}
          </span>
          <span className="text-[10px] font-semibold text-primary">PKR {fmt(r.price)}</span>
        </div>
      ))}
      {rest.length > 0 && (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <button className="text-[10px] text-blue-600 flex items-center gap-0.5 hover:underline">
              {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {open ? "Show less" : `+${rest.length} more`}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {rest.map((r, i) => (
              <div key={i} className="flex items-center gap-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${r.enabled ? "bg-green-50 border-green-200 text-green-800" : "bg-gray-100 border-gray-200 text-gray-500"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${r.enabled ? "bg-green-500" : "bg-gray-400"}`} />
                  {r.name}
                </span>
                <span className="text-[10px] font-semibold text-primary">PKR {fmt(r.price)}</span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

// ─── Form schemas ─────────────────────────────────────────────────────────────
const companyPkgFormSchema = insertResellerCompanyPackageSchema.extend({
  speedMbps: z.union([z.number(), z.string()]).transform(v => String(v)),
  uploadMbps: z.union([z.number(), z.string()]).optional().transform(v => v ? String(v) : undefined),
  downloadMbps: z.union([z.number(), z.string()]).optional().transform(v => v ? String(v) : undefined),
  costPerMbps: z.union([z.number(), z.string()]).optional().transform(v => v ? String(v) : undefined),
  profitValue: z.union([z.number(), z.string()]).optional().transform(v => v ? String(v) : "0"),
  packagePrice: z.union([z.number(), z.string()]).transform(v => String(v)),
});
type CompanyPkgForm = z.infer<typeof companyPkgFormSchema>;

const vendorPkgFormSchema = insertVendorPackageSchema.extend({
  vendorPrice: z.union([z.number(), z.string()]).transform(v => String(v)),
  ispSellingPrice: z.union([z.number(), z.string()]).transform(v => String(v)),
  resellerPrice: z.union([z.number(), z.string()]).optional().transform(v => v ? String(v) : undefined),
  ispMargin: z.union([z.number(), z.string()]).optional().transform(v => v ? String(v) : undefined),
  resellerMargin: z.union([z.number(), z.string()]).optional().transform(v => v ? String(v) : undefined),
});
type VendorPkgForm = z.infer<typeof vendorPkgFormSchema>;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ResellerPackagesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("list");
  const [listSearch, setListSearch] = useState("");
  const [listSourceFilter, setListSourceFilter] = useState<"all" | "vendor" | "company">("all");
  const [assignSearch, setAssignSearch] = useState("");
  const [assignResellerFilter, setAssignResellerFilter] = useState("all");

  // Dialogs
  const [deleteCompanyId, setDeleteCompanyId] = useState<number | null>(null);
  const [deleteVendorId, setDeleteVendorId] = useState<number | null>(null);
  const [deleteAssignId, setDeleteAssignId] = useState<number | null>(null);
  const [editCompanyPkg, setEditCompanyPkg] = useState<ResellerCompanyPackage | null>(null);
  const [editVendorPkg, setEditVendorPkg] = useState<VendorPackage | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addSourceType, setAddSourceType] = useState<"vendor" | "company">("company");
  const [editAssignment, setEditAssignment] = useState<ResellerPackageAssignment | null>(null);

  // Assign dialog state
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignPkgType, setAssignPkgType] = useState<"vendor" | "company">("company");
  const [assignPkgId, setAssignPkgId] = useState<number>(0);
  const [assignResellerId, setAssignResellerId] = useState<number>(0);
  const [assignProfitType, setAssignProfitType] = useState("none");
  const [assignProfitValue, setAssignProfitValue] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [assignCustomPrice, setAssignCustomPrice] = useState(""); // direct override
  // Vendor-first assign flow (step 1)
  const [assignVendorSource, setAssignVendorSource] = useState<string>(""); // "my-company" | vendor id str
  const [assignPickedPkgId, setAssignPickedPkgId] = useState<number>(0);


  // ── Queries ──
  const { data: companyPkgs, isLoading: cLoading } = useQuery<ResellerCompanyPackage[]>({
    queryKey: ["/api/reseller-company-packages"],
  });
  const { data: vendorPkgs, isLoading: vLoading } = useQuery<VendorPackage[]>({
    queryKey: ["/api/vendor-packages"],
  });
  const { data: vendors } = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });
  const { data: resellers } = useQuery<Reseller[]>({ queryKey: ["/api/resellers"] });
  const { data: companySetting } = useQuery<any>({ queryKey: ["/api/company"] });
  const { data: assignments, isLoading: aLoading } = useQuery<ResellerPackageAssignment[]>({
    queryKey: ["/api/reseller-package-assignments"],
  });

  // ── Forms ──
  const companyForm = useForm<CompanyPkgForm>({
    resolver: zodResolver(companyPkgFormSchema),
    defaultValues: {
      packageName: "", speedMbps: "", uploadMbps: "", downloadMbps: "",
      contentionRatio: "1:1", validity: "30 days", costPerMbps: "",
      profitType: "custom", profitValue: "0", description: "", isActive: true,
      packagePrice: "0",
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

  // ── Live calc - vendor form ──
  const watchedVendorPrice = vendorForm.watch("vendorPrice");
  const watchedIspSellingPrice = vendorForm.watch("ispSellingPrice");
  const watchedResellerPrice = vendorForm.watch("resellerPrice");
  const liveIspMargin = parseFloat(watchedIspSellingPrice || "0") - parseFloat(watchedVendorPrice || "0");
  const liveResellerMargin = parseFloat(watchedResellerPrice || "0") > 0
    ? parseFloat(watchedResellerPrice || "0") - parseFloat(watchedIspSellingPrice || "0")
    : 0;

  // ── Package default price for assign dialog ──
  const assignDefaultPrice = useMemo(() => {
    if (assignPkgType === "company") {
      const p = (companyPkgs || []).find(c => c.id === assignPkgId);
      return parseFloat(p?.sellingPrice || "0");
    } else {
      const p = (vendorPkgs || []).find(v => v.id === assignPkgId);
      return parseFloat(p?.ispSellingPrice || "0");
    }
  }, [assignPkgType, assignPkgId, companyPkgs, vendorPkgs]);

  const assignProfitValueNum = parseFloat(assignProfitValue || "0");
  const liveAssignTotal = assignCustomPrice
    ? parseFloat(assignCustomPrice || "0")
    : calcAssignTotal(assignDefaultPrice, assignProfitType, assignProfitValueNum);

  // ── Selected package info for assign dialog ──
  const assignPkgInfo = useMemo(() => {
    if (assignPkgType === "company") {
      const p = (companyPkgs || []).find(c => c.id === assignPkgId);
      if (!p) return null;
      return { name: p.packageName, speed: `${p.speedMbps} Mbps`, baseCost: parseFloat(p.baseCost || "0"), defaultPrice: parseFloat(p.sellingPrice || "0") };
    } else {
      const p = (vendorPkgs || []).find(v => v.id === assignPkgId);
      const vendor = (vendors || []).find(v => v.id === p?.vendorId);
      if (!p) return null;
      return { name: p.packageName, speed: p.speed || "—", baseCost: parseFloat(p.vendorPrice || "0"), defaultPrice: parseFloat(p.ispSellingPrice || "0"), vendor: vendor?.companyName || vendor?.name };
    }
  }, [assignPkgType, assignPkgId, companyPkgs, vendorPkgs, vendors]);

  // ── Mutations - Company Packages ──
  const createCompanyMutation = useMutation({
    mutationFn: (data: CompanyPkgForm) => {
      const price = String(parseFloat(data.packagePrice || "0").toFixed(2));
      return apiRequest("POST", "/api/reseller-company-packages", {
        ...data, sellingPrice: price, baseCost: price, profitType: "custom", profitValue: price,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-company-packages"] });
      setShowAddDialog(false); setEditCompanyPkg(null); companyForm.reset();
      toast({ title: "Company package created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CompanyPkgForm> }) => {
      const payload: any = { ...data };
      if (data.packagePrice !== undefined) {
        const price = String(parseFloat(data.packagePrice || "0").toFixed(2));
        payload.sellingPrice = price;
        payload.baseCost = price;
        payload.profitType = "custom";
        payload.profitValue = price;
      }
      return apiRequest("PATCH", `/api/reseller-company-packages/${id}`, payload);
    },
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

  // ── Mutations - Vendor Packages ──
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

  // ── Mutations - Assignments ──
  const createAssignMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/reseller-package-assignments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-package-assignments"] });
      setShowAssignDialog(false); resetAssignForm();
      toast({ title: "Package assigned to reseller" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateAssignMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/reseller-package-assignments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-package-assignments"] });
      setEditAssignment(null);
      toast({ title: "Assignment updated" });
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

  // ── Helpers ──
  const resetAssignForm = () => {
    setAssignResellerId(0);
    setAssignProfitType("none");
    setAssignProfitValue("");
    setAssignNotes("");
    setAssignCustomPrice("");
    setAssignVendorSource("");
    setAssignPickedPkgId(0);
  };

  const openAssign = (type: "vendor" | "company", id: number) => {
    setAssignPkgType(type); setAssignPkgId(id);
    resetAssignForm(); setShowAssignDialog(true);
  };

  const openAssignFresh = () => {
    setAssignPkgId(0);
    resetAssignForm();
    setShowAssignDialog(true);
  };

  const stripNum = (v: string | null | undefined) => v ? String(parseFloat(v)) : "";

  const openEditCompany = (p: ResellerCompanyPackage) => {
    setEditCompanyPkg(p);
    companyForm.reset({
      packageName: p.packageName,
      speedMbps: stripNum(p.speedMbps),
      uploadMbps: stripNum(p.uploadMbps),
      downloadMbps: stripNum(p.downloadMbps),
      contentionRatio: p.contentionRatio || "1:1",
      validity: p.validity || "30 days", costPerMbps: p.costPerMbps || "",
      profitType: "custom", profitValue: stripNum(p.sellingPrice) || "0",
      description: p.description || "", isActive: p.isActive,
      packagePrice: stripNum(p.sellingPrice) || "0",
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
    setShowAddDialog(true); setAddSourceType("company");
    setTimeout(() => companyForm.reset({
      packageName: `${p.packageName} (Copy)`,
      speedMbps: stripNum(p.speedMbps),
      uploadMbps: stripNum(p.uploadMbps),
      downloadMbps: stripNum(p.downloadMbps),
      contentionRatio: p.contentionRatio || "1:1", validity: p.validity || "30 days",
      profitType: "custom", profitValue: stripNum(p.sellingPrice) || "0",
      description: p.description || "", isActive: true,
      packagePrice: stripNum(p.sellingPrice) || "0",
    }), 0);
  };


  const handleSubmitAssign = () => {
    if (!assignResellerId) { toast({ title: "Please select a reseller", variant: "destructive" }); return; }
    // Check for duplicate
    const exists = (assignments || []).some(a =>
      a.resellerId === assignResellerId &&
      a.packageType === assignPkgType &&
      (assignPkgType === "company" ? a.companyPackageId === assignPkgId : a.vendorPackageId === assignPkgId)
    );
    if (exists) { toast({ title: "Already assigned", description: "This package is already assigned to this reseller.", variant: "destructive" }); return; }
    createAssignMutation.mutate({
      resellerId: assignResellerId,
      packageType: assignPkgType,
      vendorPackageId: assignPkgType === "vendor" ? assignPkgId : undefined,
      companyPackageId: assignPkgType === "company" ? assignPkgId : undefined,
      customPrice: liveAssignTotal !== assignDefaultPrice ? String(liveAssignTotal.toFixed(2)) : undefined,
      profitMarkup: assignProfitType !== "none" ? String(assignProfitValueNum) : undefined,
      profitMarkupType: assignProfitType !== "none" ? assignProfitType : undefined,
      notes: assignNotes || undefined,
      isEnabled: true,
      assignedBy: "admin",
    });
  };

  // ── Combined packages with per-reseller assignment detail ──
  const combinedPackages = useMemo(() => {
    const items: {
      id: string; name: string; source: "vendor" | "company"; vendorName?: string;
      speed: string; costPrice: number; sellingPrice: number;
      isActive: boolean;
      assignedResellers: { name: string; price: number; enabled: boolean }[];
    }[] = [];

    (vendorPkgs || []).forEach(p => {
      const vendor = (vendors || []).find(v => v.id === p.vendorId);
      const cost = parseFloat(p.vendorPrice || "0");
      const selling = parseFloat(p.ispSellingPrice || "0");
      const pkgAssignments = (assignments || []).filter(a => a.packageType === "vendor" && a.vendorPackageId === p.id);
      const assignedResellers = pkgAssignments.map(a => {
        const r = (resellers || []).find(r => r.id === a.resellerId);
        const price = a.customPrice ? parseFloat(a.customPrice) : selling;
        return { name: r?.companyName || r?.name || `Reseller #${a.resellerId}`, price, enabled: a.isEnabled };
      });
      items.push({
        id: `vendor-${p.id}`, name: p.packageName, source: "vendor",
        vendorName: vendor?.companyName || vendor?.name || `Vendor #${p.vendorId}`,
        speed: p.speed || "—", costPrice: cost, sellingPrice: selling,
        isActive: p.isActive, assignedResellers,
      });
    });

    (companyPkgs || []).forEach(p => {
      const cost = parseFloat(p.baseCost || "0");
      const selling = parseFloat(p.sellingPrice || "0");
      const pkgAssignments = (assignments || []).filter(a => a.packageType === "company" && a.companyPackageId === p.id);
      const assignedResellers = pkgAssignments.map(a => {
        const r = (resellers || []).find(r => r.id === a.resellerId);
        const price = a.customPrice ? parseFloat(a.customPrice) : selling;
        return { name: r?.companyName || r?.name || `Reseller #${a.resellerId}`, price, enabled: a.isEnabled };
      });
      items.push({
        id: `company-${p.id}`, name: p.packageName, source: "company",
        speed: `${p.speedMbps} Mbps`, costPrice: cost, sellingPrice: selling,
        isActive: p.isActive, assignedResellers,
      });
    });

    return items;
  }, [vendorPkgs, companyPkgs, vendors, assignments, resellers]);

  const filteredList = useMemo(() => {
    const q = listSearch.toLowerCase();
    return combinedPackages.filter(p =>
      (listSourceFilter === "all" || p.source === listSourceFilter) &&
      (!q || p.name.toLowerCase().includes(q) || (p.vendorName || "").toLowerCase().includes(q))
    );
  }, [combinedPackages, listSearch, listSourceFilter]);

  // ── Filtered assignments ──
  const filteredAssignments = useMemo(() => {
    const q = assignSearch.toLowerCase();
    return (assignments || []).filter(a => {
      const reseller = (resellers || []).find(r => r.id === a.resellerId);
      const vendorPkg = a.packageType === "vendor" ? (vendorPkgs || []).find(p => p.id === a.vendorPackageId) : null;
      const companyPkg = a.packageType === "company" ? (companyPkgs || []).find(p => p.id === a.companyPackageId) : null;
      const name = vendorPkg?.packageName || companyPkg?.packageName || "";
      const rName = reseller?.companyName || reseller?.name || "";
      const matchSearch = !q || name.toLowerCase().includes(q) || rName.toLowerCase().includes(q);
      const matchReseller = assignResellerFilter === "all" || String(a.resellerId) === assignResellerFilter;
      return matchSearch && matchReseller;
    });
  }, [assignments, assignSearch, assignResellerFilter, resellers, vendorPkgs, companyPkgs]);

  const isLoading = cLoading || vLoading;
  const totalActiveAssignments = (assignments || []).filter(a => a.isEnabled).length;

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Reseller Packages
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage vendor-based and company-owned packages with per-reseller pricing control
          </p>
        </div>
        <Button onClick={() => { setShowAddDialog(true); companyForm.reset(); vendorForm.reset(); }} data-testid="btn-add-package">
          <Plus className="w-4 h-4 mr-2" />Add Package
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Packages", value: combinedPackages.length, icon: Package, color: "text-primary" },
          { label: "Vendor Packages", value: (vendorPkgs || []).length, icon: Handshake, color: "text-blue-600" },
          { label: "Company Packages", value: (companyPkgs || []).length, icon: Building2, color: "text-green-600" },
          { label: "Active Assignments", value: totalActiveAssignments, icon: Users, color: "text-violet-600" },
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
          <TabsTrigger value="vendor-mapping" data-testid="tab-vendor"><Handshake className="w-4 h-4 mr-1" />V-Panel Packages</TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            <Tag className="w-4 h-4 mr-1" />Assignments
            {(assignments || []).length > 0 && (
              <Badge className="ml-1 h-4 px-1 text-[10px]">{(assignments || []).length}</Badge>
            )}
          </TabsTrigger>
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
            <p className="text-xs text-muted-foreground">{filteredList.length} packages</p>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Speed</TableHead>
                    <TableHead className="text-right">Package Price</TableHead>
                    <TableHead>Assigned Resellers & Prices</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}</TableRow>
                  )) : filteredList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        No packages found. Add a vendor or company package to get started.
                      </TableCell>
                    </TableRow>
                  ) : filteredList.map(p => (
                    <TableRow key={p.id} data-testid={`row-pkg-${p.id}`}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><SourceBadge type={p.source} /></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.vendorName || "—"}</TableCell>
                      <TableCell><span className="font-medium text-blue-600 text-sm">{p.speed}</span></TableCell>
                      <TableCell className="text-right font-semibold text-sm">PKR {fmt(p.sellingPrice)}</TableCell>
                      <TableCell className="max-w-[220px]">
                        <AssignedResellersCell resellers={p.assignedResellers} />
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.isActive ? "default" : "secondary"} className="text-xs">
                          {p.isActive ? "Active" : "Inactive"}
                        </Badge>
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
                              <>
                                <DropdownMenuItem onClick={() => {
                                  const pkg = (companyPkgs || []).find(c => c.id === parseInt(p.id.split("-")[1]));
                                  if (pkg) openEditCompany(pkg);
                                }}>
                                  <Edit className="w-4 h-4 mr-2" />Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  const pkg = (companyPkgs || []).find(c => c.id === parseInt(p.id.split("-")[1]));
                                  if (pkg) cloneCompanyPkg(pkg);
                                }}>
                                  <Copy className="w-4 h-4 mr-2" />Clone
                                </DropdownMenuItem>
                              </>
                            )}
                            {p.source === "vendor" && (
                              <DropdownMenuItem onClick={() => {
                                const pkg = (vendorPkgs || []).find(v => v.id === parseInt(p.id.split("-")[1]));
                                if (pkg) openEditVendor(pkg);
                              }}>
                                <Edit className="w-4 h-4 mr-2" />Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
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
            </div>
          </Card>
        </TabsContent>

        {/* ─── COMPANY PACKAGES ─── */}
        <TabsContent value="company" className="space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              Packages created from your own bandwidth. Full cost &amp; pricing control.
            </p>
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
                <p>No company packages yet.</p>
              </div>
            ) : (companyPkgs || []).map(p => {
              const selling = parseFloat(p.sellingPrice || "0");
              const pkgAssign = (assignments || []).filter(a => a.packageType === "company" && a.companyPackageId === p.id);
              const assignedResellersData = pkgAssign.map(a => {
                const r = (resellers || []).find(r => r.id === a.resellerId);
                const price = a.customPrice ? parseFloat(a.customPrice) : selling;
                return { name: r?.companyName || r?.name || `Reseller #${a.resellerId}`, price, enabled: a.isEnabled };
              });
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
                      <Switch checked={p.isActive} onCheckedChange={v =>
                        updateCompanyMutation.mutate({ id: p.id, data: { isActive: v } })
                      } data-testid={`switch-company-${p.id}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded bg-primary/5 border border-primary/20 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Package Price</p>
                      <p className="text-xl font-bold text-primary">PKR {fmt(selling)}</p>
                      {p.validity && <p className="text-[10px] text-muted-foreground mt-0.5">per {p.validity}</p>}
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                      {p.uploadMbps && <span>↑ {p.uploadMbps} Mbps</span>}
                      {p.downloadMbps && <span>↓ {p.downloadMbps} Mbps</span>}
                      {p.contentionRatio && <span>Ratio: {p.contentionRatio}</span>}
                    </div>
                    {assignedResellersData.length > 0 && (
                      <div className="border-t pt-2 space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Assigned Resellers</p>
                        <AssignedResellersCell resellers={assignedResellersData} />
                      </div>
                    )}
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

        {/* ─── V-PANEL PACKAGES ─── */}
        <TabsContent value="vendor-mapping" className="space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              Packages sourced from vendor panels, ready for reseller distribution.
            </p>
            <Button onClick={() => { setShowAddDialog(true); setAddSourceType("vendor"); vendorForm.reset(); }} data-testid="btn-add-vendor-pkg">
              <Plus className="w-4 h-4 mr-2" />Add V-Panel Package
            </Button>
          </div>

          {vLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" /><Skeleton className="h-16 w-full" /><Skeleton className="h-8 w-full" />
                </CardContent></Card>
              ))}
            </div>
          ) : (vendorPkgs || []).length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Handshake className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No V-Panel packages added yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(vendorPkgs || []).map(p => {
                const vendor = (vendors || []).find(v => v.id === p.vendorId);
                const sellingPrice = parseFloat(p.ispSellingPrice || "0");
                const pkgAssign = (assignments || []).filter(a => a.packageType === "vendor" && a.vendorPackageId === p.id);
                const assignedResellersData = pkgAssign.map(a => {
                  const r = (resellers || []).find(r => r.id === a.resellerId);
                  const price = a.customPrice ? parseFloat(a.customPrice) : sellingPrice;
                  return { name: r?.companyName || r?.name || `Reseller #${a.resellerId}`, price, enabled: a.isEnabled };
                });
                return (
                  <Card key={p.id} className={`relative ${!p.isActive ? "opacity-60" : ""}`} data-testid={`card-vendor-pkg-${p.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Handshake className="w-4 h-4 text-blue-500" />
                            {p.packageName}
                          </CardTitle>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/20">V-Panel</Badge>
                            {p.speed && <Badge variant="outline" className="text-xs">{p.speed}</Badge>}
                            {p.validity && <Badge variant="secondary" className="text-xs">{p.validity}</Badge>}
                          </div>
                        </div>
                        <Switch checked={p.isActive} onCheckedChange={v =>
                          updateVendorMutation.mutate({ id: p.id, data: { isActive: v } })
                        } data-testid={`switch-vendor-${p.id}`} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Package Price</p>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-400">PKR {fmt(sellingPrice)}</p>
                        {p.validity && <p className="text-[10px] text-muted-foreground mt-0.5">per {p.validity}</p>}
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="rounded bg-muted/60 p-1.5">
                          <p className="text-[9px] text-muted-foreground leading-tight">Vendor Price</p>
                          <p className="text-xs font-semibold text-red-600">PKR {fmt(parseFloat(p.vendorPrice || "0"))}</p>
                        </div>
                        <div className="rounded bg-muted/60 p-1.5">
                          <p className="text-[9px] text-muted-foreground leading-tight">ISP Margin</p>
                          <p className={`text-xs font-semibold ${(sellingPrice - parseFloat(p.vendorPrice || "0")) >= 0 ? "text-green-600" : "text-red-600"}`}>
                            PKR {fmt(sellingPrice - parseFloat(p.vendorPrice || "0"))}
                          </p>
                        </div>
                        <div className="rounded bg-muted/60 p-1.5">
                          <p className="text-[9px] text-muted-foreground leading-tight">Reseller Price</p>
                          <p className="text-xs font-semibold text-violet-600">
                            {p.resellerPrice ? `PKR ${fmt(parseFloat(p.resellerPrice))}` : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                        {vendor && <span className="font-medium text-foreground">{vendor.name}</span>}
                        {p.dataLimit && <span>Data: {p.dataLimit}</span>}
                      </div>
                      {assignedResellersData.length > 0 && (
                        <div className="border-t pt-2 space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Assigned Resellers</p>
                          <AssignedResellersCell resellers={assignedResellersData} />
                        </div>
                      )}
                      <div className="flex gap-1.5 pt-1">
                        <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => openEditVendor(p)} data-testid={`btn-edit-vendor-${p.id}`}>
                          <Edit className="w-3 h-3 mr-1" />Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => openAssign("vendor", p.id)} data-testid={`btn-assign-vendor-${p.id}`}>
                          <Tag className="w-3 h-3 mr-1" />Assign
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteVendorId(p.id)} data-testid={`btn-delete-vendor-${p.id}`}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>


        {/* ─── ASSIGNMENTS ─── */}
        <TabsContent value="assignments" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search reseller or package..." className="pl-9 w-56" value={assignSearch}
                  onChange={e => setAssignSearch(e.target.value)} data-testid="input-assign-search" />
              </div>
              <Select value={assignResellerFilter} onValueChange={setAssignResellerFilter}>
                <SelectTrigger className="w-44" data-testid="select-reseller-filter">
                  <Users className="w-3 h-3 mr-1" /><SelectValue placeholder="All Resellers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resellers</SelectItem>
                  {(resellers || []).map(r => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.companyName || r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">{filteredAssignments.length} assignments</p>
              <Button size="sm" onClick={openAssignFresh} data-testid="btn-assign-new">
                <Plus className="w-4 h-4 mr-1" />Assign Package
              </Button>
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reseller</TableHead>
                    <TableHead>Package Type</TableHead>
                    <TableHead>Package Name</TableHead>
                    <TableHead className="text-right">Default Price</TableHead>
                    <TableHead className="text-right">Profit Markup</TableHead>
                    <TableHead className="text-right">Reseller Price</TableHead>
                    <TableHead className="text-right">ISP Profit/Unit</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Assigned On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aLoading ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}</TableRow>
                  )) : filteredAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No assignments found. Assign packages to resellers from the packages tabs.
                      </TableCell>
                    </TableRow>
                  ) : filteredAssignments.map(a => {
                    const reseller = (resellers || []).find(r => r.id === a.resellerId);
                    const vendorPkg = a.packageType === "vendor" ? (vendorPkgs || []).find(p => p.id === a.vendorPackageId) : null;
                    const companyPkg = a.packageType === "company" ? (companyPkgs || []).find(p => p.id === a.companyPackageId) : null;
                    const pkgName = vendorPkg?.packageName || companyPkg?.packageName || "—";
                    const defaultPrice = vendorPkg
                      ? parseFloat(vendorPkg.ispSellingPrice || "0")
                      : companyPkg ? parseFloat(companyPkg.sellingPrice || "0") : 0;
                    const resellerPrice = a.customPrice ? parseFloat(a.customPrice) : defaultPrice;
                    const ispProfit = resellerPrice - (vendorPkg ? parseFloat(vendorPkg.vendorPrice || "0") : companyPkg ? parseFloat(companyPkg.baseCost || "0") : 0);
                    const markupStr = (a as any).profitMarkup && (a as any).profitMarkupType
                      ? `${fmt((a as any).profitMarkup)} ${(a as any).profitMarkupType === "percentage" ? "%" : "PKR"}`
                      : "—";
                    return (
                      <TableRow key={a.id} data-testid={`row-assign-${a.id}`}>
                        <TableCell className="font-medium">
                          {reseller?.companyName || reseller?.name || `Reseller #${a.resellerId}`}
                        </TableCell>
                        <TableCell><SourceBadge type={a.packageType as "vendor" | "company"} /></TableCell>
                        <TableCell className="text-sm">{pkgName}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">PKR {fmt(defaultPrice)}</TableCell>
                        <TableCell className="text-right text-sm text-violet-600">{markupStr}</TableCell>
                        <TableCell className="text-right font-semibold text-sm">PKR {fmt(resellerPrice)}</TableCell>
                        <TableCell className={`text-right font-bold text-sm ${ispProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {ispProfit >= 0 ? "+" : ""}PKR {fmt(ispProfit)}
                        </TableCell>
                        <TableCell>
                          <Switch checked={a.isEnabled}
                            onCheckedChange={v => toggleAssignMutation.mutate({ id: a.id, isEnabled: v })}
                            data-testid={`switch-assign-${a.id}`} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{String(a.createdAt || "").split("T")[0]}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditAssignment(a)} data-testid={`btn-edit-assign-${a.id}`}>
                              <PenLine className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteAssignId(a.id)} data-testid={`btn-delete-assign-${a.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── ADD/EDIT PACKAGE DIALOG ─── */}
      <Dialog open={showAddDialog || !!editCompanyPkg || !!editVendorPkg} onOpenChange={(open) => {
        if (!open) { setShowAddDialog(false); setEditCompanyPkg(null); setEditVendorPkg(null); }
      }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editCompanyPkg ? "Edit Company Package" : editVendorPkg ? "Edit Vendor Package"
                : addSourceType === "company" ? "New Company Package" : "Map Vendor Package"}
            </DialogTitle>
          </DialogHeader>

          {!editCompanyPkg && !editVendorPkg && (
            <div className="flex gap-2 mb-2">
              <Button type="button" variant={addSourceType === "company" ? "default" : "outline"} className="flex-1 gap-2"
                onClick={() => setAddSourceType("company")} data-testid="btn-source-company">
                <Building2 className="w-4 h-4" />Company Package
              </Button>
              <Button type="button" variant={addSourceType === "vendor" ? "default" : "outline"} className="flex-1 gap-2"
                onClick={() => setAddSourceType("vendor")} data-testid="btn-source-vendor">
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

                {/* Vendor (company name) — read-only display */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Vendor</Label>
                  <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    <Building2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium">{companySetting?.companyName || "My Company"}</span>
                    <Badge variant="outline" className="ml-auto text-[10px]">My Company</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: "speedMbps" as const, label: "Speed (Mbps) *", placeholder: "10" },
                    { name: "uploadMbps" as const, label: "Upload (Mbps)", placeholder: "10" },
                    { name: "downloadMbps" as const, label: "Download (Mbps)", placeholder: "10" },
                  ].map(f => (
                    <FormField key={f.name} control={companyForm.control} name={f.name} render={({ field }) => (
                      <FormItem>
                        <FormLabel>{f.label}</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ""} type="number" placeholder={f.placeholder} data-testid={`input-${f.name}`} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField control={companyForm.control} name="contentionRatio" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contention Ratio</FormLabel>
                      <Select value={field.value ?? "1:1"} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["1:1","1:2","1:4","1:8","1:16"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={companyForm.control} name="validity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validity</FormLabel>
                      <Select value={field.value ?? "30 days"} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["7 days","15 days","30 days","60 days","90 days","1 year"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>

                <FormField control={companyForm.control} name="packagePrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Price (PKR) *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">PKR</span>
                        <Input {...field} value={field.value ?? ""} type="number" min="0" step="0.01"
                          placeholder="e.g. 2000" className="pl-14" data-testid="input-package-price" />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      This is the selling price of the package for resellers.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={companyForm.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea {...field} value={field.value ?? ""} rows={2} placeholder="Optional..." /></FormControl>
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
                    <Select value={String(field.value)} onValueChange={v => field.onChange(Number(v))}>
                      <SelectTrigger data-testid="select-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                      <SelectContent>
                        {(vendors || []).map(v => <SelectItem key={v.id} value={String(v.id)}>{v.companyName || v.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 rounded bg-green-50 dark:bg-green-950/20">
                      <p className="text-[10px] text-muted-foreground">ISP Margin</p>
                      <p className={`text-sm font-bold ${liveIspMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                        PKR {fmt(liveIspMargin)}{liveIspMargin < 0 && <AlertTriangle className="w-3 h-3 inline ml-1" />}
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
                      <Select value={field.value ?? "30 days"} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["7 days","15 days","30 days","60 days","90 days","1 year"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
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
      <Dialog open={showAssignDialog} onOpenChange={open => { if (!open) { setShowAssignDialog(false); resetAssignForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Tag className="w-5 h-5" />Assign Package to Reseller</DialogTitle>
            {assignPkgId > 0 && (
              <DialogDescription>Set a custom reseller price by adding a profit markup on top of the default package price.</DialogDescription>
            )}
          </DialogHeader>

          {/* ── Step 1: Vendor + Package Picker (fresh flow) ── */}
          {assignPkgId === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Select a vendor source and then choose a package to assign to a reseller.</p>

              {/* Vendor selector */}
              <div className="space-y-1.5">
                <Label>Select Vendor / Source *</Label>
                <Select value={assignVendorSource} onValueChange={v => { setAssignVendorSource(v); setAssignPickedPkgId(0); }} data-testid="select-assign-vendor">
                  <SelectTrigger>
                    <SelectValue placeholder="Choose vendor or your company..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="my-company">
                      ★ {companySetting?.companyName || "My Company"} (My Company)
                    </SelectItem>
                    {(vendors || []).map(v => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.companyName || v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Package selector — shown once a vendor/source is picked */}
              {assignVendorSource && (
                <div className="space-y-1.5">
                  <Label>Select Package *</Label>
                  <Select value={assignPickedPkgId > 0 ? String(assignPickedPkgId) : ""} onValueChange={v => setAssignPickedPkgId(Number(v))} data-testid="select-assign-package">
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a package..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assignVendorSource === "my-company"
                        ? (companyPkgs || []).filter(p => p.isActive).map(p => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.packageName} — PKR {fmt(p.sellingPrice)} {p.speedMbps ? `(${p.speedMbps} Mbps)` : ""}
                            </SelectItem>
                          ))
                        : (vendorPkgs || []).filter(p => p.vendorId === Number(assignVendorSource) && p.isActive).map(p => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.packageName} — PKR {fmt(p.ispSellingPrice)} {p.speed ? `(${p.speed})` : ""}
                            </SelectItem>
                          ))
                      }
                      {assignVendorSource === "my-company" && (companyPkgs || []).filter(p => p.isActive).length === 0 && (
                        <div className="px-3 py-4 text-sm text-muted-foreground text-center">No active company packages found.</div>
                      )}
                      {assignVendorSource !== "my-company" && (vendorPkgs || []).filter(p => p.vendorId === Number(assignVendorSource) && p.isActive).length === 0 && (
                        <div className="px-3 py-4 text-sm text-muted-foreground text-center">No active packages for this vendor.</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setShowAssignDialog(false); resetAssignForm(); }}>Cancel</Button>
                <Button
                  disabled={!assignPickedPkgId}
                  onClick={() => {
                    const type = assignVendorSource === "my-company" ? "company" : "vendor";
                    setAssignPkgType(type);
                    setAssignPkgId(assignPickedPkgId);
                  }}
                  data-testid="btn-assign-continue"
                >
                  Continue
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ── Step 2: Reseller + Pricing (shown once package is selected) ── */}
          {assignPkgId > 0 && (
          <>
          {/* Package info box */}
          {assignPkgInfo && (
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold text-sm flex items-center gap-1">
                    <Wifi className="w-4 h-4 text-primary" />{assignPkgInfo.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Speed: {assignPkgInfo.speed}</p>
                  {assignPkgInfo.vendor && <p className="text-xs text-muted-foreground">Vendor: {assignPkgInfo.vendor}</p>}
                  {assignVendorSource && (
                    <button
                      type="button"
                      className="text-xs text-primary underline mt-1"
                      onClick={() => { setAssignPkgId(0); setAssignPickedPkgId(0); }}
                    >
                      ← Change Package
                    </button>
                  )}
                </div>
                <SourceBadge type={assignPkgType} />
              </div>
              <Separator />
              <div className="rounded bg-blue-50 dark:bg-blue-950/20 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Default Selling Price</p>
                <p className="text-sm font-bold text-blue-700">PKR {fmt(assignPkgInfo.defaultPrice)}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Reseller selector */}
            <div className="space-y-2">
              <Label>Select Reseller *</Label>
              <Select onValueChange={v => setAssignResellerId(Number(v))}>
                <SelectTrigger data-testid="select-assign-reseller">
                  <SelectValue placeholder="Choose reseller..." />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const alreadyAssigned = new Set(
                      (assignments || [])
                        .filter(a =>
                          a.packageType === assignPkgType &&
                          (assignPkgType === "company" ? a.companyPackageId === assignPkgId : a.vendorPackageId === assignPkgId)
                        )
                        .map(a => a.resellerId)
                    );
                    const available = (resellers || []).filter(r => r.status === "active" && !alreadyAssigned.has(r.id));
                    if (available.length === 0)
                      return <div className="px-3 py-4 text-sm text-muted-foreground text-center">All active resellers are already assigned this package.</div>;
                    return available.map(r => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.companyName || r.name}</SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>

            {/* Profit markup section */}
            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <DollarSign className="w-3 h-3" />Reseller Price Configuration
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Profit Mode</Label>
                  <Select value={assignProfitType} onValueChange={v => { setAssignProfitType(v); setAssignCustomPrice(""); }} data-testid="select-assign-profit-type">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Markup (Default Price)</SelectItem>
                      <SelectItem value="fixed">Fixed Add-on (PKR)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="custom">Custom Total Price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {assignProfitType !== "none" && assignProfitType !== "custom" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      {assignProfitType === "fixed" ? "Add-on Amount (PKR)" : "Markup Percentage (%)"}
                    </Label>
                    <Input
                      type="number" value={assignProfitValue}
                      onChange={e => setAssignProfitValue(e.target.value)}
                      placeholder={assignProfitType === "fixed" ? "e.g. 200" : "e.g. 15"}
                      data-testid="input-assign-profit-value"
                    />
                  </div>
                )}

                {assignProfitType === "custom" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Custom Total Price (PKR)</Label>
                    <Input
                      type="number" value={assignCustomPrice}
                      onChange={e => setAssignCustomPrice(e.target.value)}
                      placeholder="Enter total price for reseller"
                      data-testid="input-assign-custom-price"
                    />
                  </div>
                )}
              </div>

              {/* Live pricing breakdown */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Pricing Breakdown</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Package Default Price</span>
                    <span className="font-medium">PKR {fmt(assignDefaultPrice)}</span>
                  </div>
                  {assignProfitType !== "none" && (
                    <div className="flex justify-between text-violet-600">
                      <span>
                        + Your Profit Markup
                        {assignProfitType === "fixed" && assignProfitValue && ` (PKR ${fmt(assignProfitValue)})`}
                        {assignProfitType === "percentage" && assignProfitValue && ` (${assignProfitValue}%)`}
                      </span>
                      <span className="font-medium">PKR {fmt(Math.max(0, liveAssignTotal - assignDefaultPrice))}</span>
                    </div>
                  )}
                  <Separator className="my-1" />
                  <div className="flex justify-between text-base font-bold">
                    <span>Reseller Total Price</span>
                    <span className="text-primary">PKR {fmt(liveAssignTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">Notes (optional)</Label>
              <Input placeholder="e.g. Special rate for premium reseller..."
                value={assignNotes} onChange={e => setAssignNotes(e.target.value)} data-testid="input-assign-notes" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setShowAssignDialog(false); resetAssignForm(); }}>Cancel</Button>
            <Button onClick={handleSubmitAssign} disabled={createAssignMutation.isPending} data-testid="btn-submit-assign">
              {createAssignMutation.isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Assign at PKR {fmt(liveAssignTotal)}
            </Button>
          </DialogFooter>
          </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── EDIT ASSIGNMENT DIALOG ─── */}
      {editAssignment && (() => {
        const vendorPkg = editAssignment.packageType === "vendor" ? (vendorPkgs || []).find(p => p.id === editAssignment.vendorPackageId) : null;
        const companyPkg = editAssignment.packageType === "company" ? (companyPkgs || []).find(p => p.id === editAssignment.companyPackageId) : null;
        const pkgName = vendorPkg?.packageName || companyPkg?.packageName || "—";
        const reseller = (resellers || []).find(r => r.id === editAssignment.resellerId);
        const defPrice = vendorPkg ? parseFloat(vendorPkg.ispSellingPrice || "0") : companyPkg ? parseFloat(companyPkg.sellingPrice || "0") : 0;
        const baseCostV = vendorPkg ? parseFloat(vendorPkg.vendorPrice || "0") : companyPkg ? parseFloat(companyPkg.baseCost || "0") : 0;
        return (
          <Dialog open={true} onOpenChange={() => setEditAssignment(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><PenLine className="w-4 h-4" />Edit Assignment</DialogTitle>
              </DialogHeader>
              <EditAssignmentForm
                assignment={editAssignment}
                pkgName={pkgName}
                resellerName={reseller?.companyName || reseller?.name || ""}
                defaultPrice={defPrice}
                baseCost={baseCostV}
                pkgType={editAssignment.packageType as "vendor" | "company"}
                onSave={(data) => updateAssignMutation.mutate({ id: editAssignment.id, data })}
                onCancel={() => setEditAssignment(null)}
                isPending={updateAssignMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Delete confirms */}
      <AlertDialog open={!!deleteCompanyId} onOpenChange={() => setDeleteCompanyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company Package</AlertDialogTitle>
            <AlertDialogDescription>Permanently deletes the package and affects all assignments.</AlertDialogDescription>
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
            <AlertDialogDescription>Removes this vendor package from the reseller catalog.</AlertDialogDescription>
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
            <AlertDialogDescription>Revokes this reseller's access to the package.</AlertDialogDescription>
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

// ─── Edit Assignment Form (sub-component) ─────────────────────────────────────
function EditAssignmentForm({ assignment, pkgName, resellerName, defaultPrice, baseCost, pkgType, onSave, onCancel, isPending }: {
  assignment: ResellerPackageAssignment;
  pkgName: string;
  resellerName: string;
  defaultPrice: number;
  baseCost: number;
  pkgType: "vendor" | "company";
  onSave: (data: any) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const currentPrice = assignment.customPrice ? parseFloat(assignment.customPrice) : defaultPrice;
  const [profitType, setProfitType] = useState<string>((assignment as any).profitMarkupType || "custom");
  const [profitValue, setProfitValue] = useState(
    (assignment as any).profitMarkup || String(currentPrice)
  );
  const [notes, setNotes] = useState(assignment.notes || "");
  const [isEnabled, setIsEnabled] = useState(assignment.isEnabled);

  const profitVal = parseFloat(profitValue || "0");
  const liveTotal = profitType === "custom"
    ? profitVal
    : profitType === "fixed" ? defaultPrice + profitVal
    : profitType === "percentage" ? defaultPrice * (1 + profitVal / 100)
    : defaultPrice;


  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{pkgName}</span>
          <SourceBadge type={pkgType} />
        </div>
        <p className="text-xs text-muted-foreground">Reseller: <span className="font-medium text-foreground">{resellerName}</span></p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Price Mode</Label>
          <Select value={profitType} onValueChange={setProfitType}>
            <SelectTrigger data-testid="select-edit-profit-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Default Price</SelectItem>
              <SelectItem value="fixed">Fixed Add-on (PKR)</SelectItem>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
              <SelectItem value="custom">Custom Total Price</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {profitType !== "none" && (
          <div className="space-y-1.5">
            <Label className="text-xs">
              {profitType === "fixed" ? "Add-on (PKR)" : profitType === "percentage" ? "Markup %" : "Total Price (PKR)"}
            </Label>
            <Input type="number" value={profitValue} onChange={e => setProfitValue(e.target.value)}
              data-testid="input-edit-profit-value" />
          </div>
        )}
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Default Price</span>
          <span>PKR {fmt(defaultPrice)}</span>
        </div>
        <Separator className="my-1" />
        <div className="flex justify-between font-bold">
          <span>Reseller Price</span>
          <span className="text-primary">PKR {fmt(profitType === "none" ? defaultPrice : liveTotal)}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Notes</Label>
        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." />
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={isEnabled} onCheckedChange={setIsEnabled} data-testid="switch-edit-enabled" />
        <Label className="text-sm">{isEnabled ? "Enabled for reseller" : "Disabled for reseller"}</Label>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button disabled={isPending} onClick={() => {
          const finalPrice = profitType === "none" ? undefined : (profitType === "custom" ? liveTotal : liveTotal);
          onSave({
            customPrice: profitType !== "none" ? String(liveTotal.toFixed(2)) : undefined,
            profitMarkup: profitType !== "none" && profitType !== "custom" ? String(profitVal) : undefined,
            profitMarkupType: profitType !== "none" && profitType !== "custom" ? profitType : undefined,
            notes: notes || undefined,
            isEnabled,
          });
        }} data-testid="btn-save-edit-assign">
          {isPending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </DialogFooter>
    </div>
  );
}
