import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Edit,
  Wallet,
  Phone,
  Mail,
  MapPin,
  User,
  Building2,
  Landmark,
  Globe,
  Network,
  Wifi,
  BarChart3,
  History,
  Headphones,
  Package,
  Star,
  CheckCircle,
  XCircle,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Zap,
  Clock,
  ExternalLink,
  Lock,
  Shield,
  Plus,
  Trash2,
  Link2,
  AlertCircle,
  FileWarning,
  FileText,
  CreditCard,
  Server,
  Layers,
  GitBranch,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type {
  Vendor,
  VendorPackage,
  VendorWalletTransaction,
  VendorBandwidthLink,
  VendorPanelLink,
  InsertVendorPanelLink,
  InsertVendorBandwidthLink,
  InsertVendor,
} from "@shared/schema";

const formatPKR = (value: string | number | null | undefined) => {
  const num = Number(value || 0);
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

type PanelLinkForm = {
  panelName: string;
  panelUrl: string;
  panelUsername: string;
  city: string;
  walletBalance: string;
  monthlyFee: string;
  status: string;
  notes: string;
  serviceType: string;
  networkInterface: string;
  portDetails: string;
  popLocation: string;
};

const emptyPanelLinkForm: PanelLinkForm = {
  panelName: "", panelUrl: "", panelUsername: "", city: "",
  walletBalance: "0", monthlyFee: "0", status: "active", notes: "",
  serviceType: "fiber", networkInterface: "", portDetails: "", popLocation: "",
};

type AddPkgForm = {
  panelLinkId: string;
  packageName: string;
  speed: string;
  vendorPrice: string;
  ispSellingPrice: string;
  resellerPrice: string;
  dataLimit: string;
  validity: string;
  isActive: boolean;
};

const emptyAddPkgForm: AddPkgForm = {
  panelLinkId: "", packageName: "", speed: "",
  vendorPrice: "0", ispSellingPrice: "0", resellerPrice: "",
  dataLimit: "", validity: "30 days", isActive: true,
};

type EditVendorForm = {
  name: string; contactPerson: string; phone: string; email: string;
  address: string; city: string; serviceType: string; ntn: string;
  bankName: string; bankAccountTitle: string; bankAccountNumber: string; bankBranchCode: string;
  slaLevel: string; totalBandwidth: string; usedBandwidth: string; bandwidthCost: string;
  contractStartDate: string; contractEndDate: string;
  contractType: string; paymentTerms: string; autoRenewal: boolean; penaltyClause: string;
  panelUrl: string; panelUsername: string; status: string;
};

function vendorToEditForm(v: Vendor): EditVendorForm {
  return {
    name: v.name || "", contactPerson: v.contactPerson || "", phone: v.phone || "",
    email: v.email || "", address: v.address || "", city: v.city || "",
    serviceType: v.serviceType || "fiber", ntn: v.ntn || "",
    bankName: v.bankName || "", bankAccountTitle: v.bankAccountTitle || "",
    bankAccountNumber: v.bankAccountNumber || "", bankBranchCode: v.bankBranchCode || "",
    slaLevel: v.slaLevel || "standard", totalBandwidth: v.totalBandwidth || "",
    usedBandwidth: v.usedBandwidth || "", bandwidthCost: v.bandwidthCost || "0",
    contractStartDate: v.contractStartDate || "", contractEndDate: v.contractEndDate || "",
    contractType: v.contractType || "monthly", paymentTerms: v.paymentTerms || "net30",
    autoRenewal: v.autoRenewal ?? false, penaltyClause: v.penaltyClause || "",
    panelUrl: v.panelUrl || "", panelUsername: v.panelUsername || "", status: v.status || "active",
  };
}

type BwLinkForm = {
  linkName: string; city: string; popLocation: string; startDate: string;
  billingType: string; status: string; serviceType: string;
  bandwidthMbps: string; bandwidthRate: string; tax: string; currency: string; exchangeRate: string; totalMonthlyCost: string;
  ipAddress: string; vlanDetail: string; portDetails: string;
  routingType: string; networkInterface: string; gateway: string;
  dnsServers: string; asNumber: string; bgpConfig: string;
  notes: string;
};
const emptyBwLinkForm: BwLinkForm = {
  linkName: "", city: "", popLocation: "", startDate: "",
  billingType: "full_month", status: "active", serviceType: "fiber",
  bandwidthMbps: "", bandwidthRate: "", tax: "19.5", currency: "PKR", exchangeRate: "1", totalMonthlyCost: "",
  ipAddress: "", vlanDetail: "", portDetails: "",
  routingType: "static", networkInterface: "", gateway: "",
  dnsServers: "", asNumber: "", bgpConfig: "",
  notes: "",
};
function bwLinkToForm(l: VendorBandwidthLink): BwLinkForm {
  return {
    linkName: l.linkName || "", city: l.city || "", popLocation: l.popLocation || "", startDate: l.startDate || "",
    billingType: l.billingType || "full_month", status: l.status || "active", serviceType: l.serviceType || "fiber",
    bandwidthMbps: l.bandwidthMbps || "", bandwidthRate: l.bandwidthRate || "", tax: (l as any).tax || "19.5",
    currency: (l as any).currency || "PKR", exchangeRate: (l as any).exchangeRate || "1",
    totalMonthlyCost: l.totalMonthlyCost || "",
    ipAddress: l.ipAddress || "", vlanDetail: l.vlanDetail || "", portDetails: l.portDetails || "",
    routingType: l.routingType || "static", networkInterface: l.networkInterface || "", gateway: l.gateway || "",
    dnsServers: l.dnsServers || "", asNumber: l.asNumber || "", bgpConfig: l.bgpConfig || "",
    notes: l.notes || "",
  };
}

type DplcLinkForm = {
  linkName: string; siteACity: string; siteBCity: string; startDate: string;
  billingType: string; status: string; notes: string; vlanDetail: string;
  bandwidthMbps: string; bandwidthRate: string; tax: string; currency: string; exchangeRate: string; totalMonthlyCost: string;
  siteAInterface: string; siteAPort: string; siteATowerId: string;
  siteBInterface: string; siteBPort: string; siteBTowerId: string;
};
const emptyDplcForm: DplcLinkForm = {
  linkName: "", siteACity: "", siteBCity: "", startDate: "",
  billingType: "full_month", status: "active", notes: "", vlanDetail: "",
  bandwidthMbps: "", bandwidthRate: "", tax: "19.5", currency: "PKR", exchangeRate: "1", totalMonthlyCost: "",
  siteAInterface: "", siteAPort: "", siteATowerId: "",
  siteBInterface: "", siteBPort: "", siteBTowerId: "",
};

function calcBwLinkCost(mbps: string, rate: string, tax: string, currency: string, exchangeRate: string): string {
  const base = Number(mbps || 0) * Number(rate || 0);
  const basePkr = currency === "USD" ? base * Number(exchangeRate || 1) : base;
  const taxAmt = basePkr * (Number(tax || 0) / 100);
  return (basePkr + taxAmt).toFixed(2);
}

export default function VendorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [profileTab, setProfileTab] = useState("overview");

  // Panel link dialog state
  const [plDialogOpen, setPlDialogOpen] = useState(false);
  const [editingPl, setEditingPl] = useState<VendorPanelLink | null>(null);
  const [plForm, setPlForm] = useState<PanelLinkForm>(emptyPanelLinkForm);
  const [plDeleteId, setPlDeleteId] = useState<number | null>(null);

  // Add Package dialog state
  const [addPkgOpen, setAddPkgOpen] = useState(false);
  const [addPkgForm, setAddPkgForm] = useState<AddPkgForm>(emptyAddPkgForm);
  const [addPkgSubmitting, setAddPkgSubmitting] = useState(false);

  // Edit Vendor dialog state
  const [editVendorOpen, setEditVendorOpen] = useState(false);
  const [editVendorForm, setEditVendorForm] = useState<EditVendorForm | null>(null);
  const [editVendorSubmitting, setEditVendorSubmitting] = useState(false);

  // Add/Edit BW link dialog state
  const [bwLinkDialogOpen, setBwLinkDialogOpen] = useState(false);
  const [editingBwLink, setEditingBwLink] = useState<VendorBandwidthLink | null>(null);
  const [bwLinkForm, setBwLinkForm] = useState<BwLinkForm>(emptyBwLinkForm);
  const [bwLinkFormTab, setBwLinkFormTab] = useState("basic");
  const [bwLinkSubmitting, setBwLinkSubmitting] = useState(false);

  // DPLC Link dialog state (separate dedicated dialog)
  const [dplcDialogOpen, setDplcDialogOpen] = useState(false);
  const [dplcFormTab, setDplcFormTab] = useState("basic");
  const [dplcForm, setDplcForm] = useState<DplcLinkForm>(emptyDplcForm);
  const [dplcSubmitting, setDplcSubmitting] = useState(false);

  // Outstanding payment dialog state
  const [outstandingOpen, setOutstandingOpen] = useState(false);
  const [selectedBwLink, setSelectedBwLink] = useState<VendorBandwidthLink | null>(null);
  const [outstandingForm, setOutstandingForm] = useState({ amount: "", bwLinkName: "", period: "", notes: "" });

  // Inline Payment/Recharge dialog state
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [rechargeForm, setRechargeForm] = useState({
    amount: "", reference: "", paymentMethod: "bank_transfer",
    performedBy: "", notes: "", paymentStatus: "paid",
  });
  const [rechargeSubmitting, setRechargeSubmitting] = useState(false);

  // Deduct Balance dialog state
  const [deductOpen, setDeductOpen] = useState(false);
  const [deductForm, setDeductForm] = useState({
    amount: "", reference: "", reason: "", performedBy: "", notes: "",
  });
  const [deductSubmitting, setDeductSubmitting] = useState(false);

  // Delete vendor state
  const [deleteVendorOpen, setDeleteVendorOpen] = useState(false);
  const [deleteVendorSubmitting, setDeleteVendorSubmitting] = useState(false);

  // Status toggle state
  const [statusToggling, setStatusToggling] = useState(false);

  // Generate monthly bill state
  const [generateBillOpen, setGenerateBillOpen] = useState(false);
  const [generateBillForm, setGenerateBillForm] = useState({ period: "", notes: "" });

  // Package edit/delete state
  const [editingPkg, setEditingPkg] = useState<VendorPackage | null>(null);

  const { data: settingsData } = useQuery<{ key: string; value: string }[]>({ queryKey: ["/api/settings"] });
  const defaultUsdRate = settingsData?.find(s => s.key === "general.usd_to_pkr_rate")?.value || "";

  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: allBwLinks } = useQuery<VendorBandwidthLink[]>({
    queryKey: ["/api/vendor-bandwidth-links"],
  });

  const { data: allPackages } = useQuery<VendorPackage[]>({
    queryKey: ["/api/vendor-packages"],
  });

  const { data: allPanelLinks } = useQuery<VendorPanelLink[]>({
    queryKey: ["/api/vendor-panel-links"],
  });

  const vendor = vendors?.find(v => v.id === Number(id)) ?? null;
  const vendorType = vendor?.vendorType === "panel" ? "panel" : "bandwidth";

  const { data: txns } = useQuery<VendorWalletTransaction[]>({
    queryKey: ["/api/vendor-wallet-transactions", vendor?.id],
    enabled: !!vendor,
    queryFn: async () => {
      if (!vendor) return [];
      const res = await fetch(`/api/vendor-wallet-transactions/${vendor.id}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const invalidatePanelLinks = () => queryClient.invalidateQueries({ queryKey: ["/api/vendor-panel-links"] });

  const createPlMutation = useMutation({
    mutationFn: (data: Omit<InsertVendorPanelLink, "id">) => apiRequest("POST", "/api/vendor-panel-links", data).then(r => r.json()),
    onSuccess: () => { invalidatePanelLinks(); setPlDialogOpen(false); toast({ title: "Panel link added" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updatePlMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertVendorPanelLink> }) => apiRequest("PATCH", `/api/vendor-panel-links/${id}`, data).then(r => r.json()),
    onSuccess: () => { invalidatePanelLinks(); setPlDialogOpen(false); toast({ title: "Panel link updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deletePlMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/vendor-panel-links/${id}`),
    onSuccess: () => { invalidatePanelLinks(); setPlDeleteId(null); toast({ title: "Panel link deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const outstandingMutation = useMutation({
    mutationFn: (data: { vendorId: number; amount: number; period: string; bwLinkName?: string; notes?: string; performedBy?: string }) =>
      apiRequest("POST", "/api/vendor-wallet/outstanding", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-wallet-transactions", vendor?.id] });
      setOutstandingOpen(false);
      setOutstandingForm({ amount: "", bwLinkName: "", period: "", notes: "" });
      toast({ title: "Outstanding payment recorded", description: "The old pending payment has been added to the wallet ledger." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const submitOutstanding = () => {
    if (!vendor) return;
    const amt = parseFloat(outstandingForm.amount);
    if (!outstandingForm.amount || isNaN(amt) || amt <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid positive amount.", variant: "destructive" }); return;
    }
    if (!outstandingForm.period.trim()) {
      toast({ title: "Period is required", description: "Please specify the billing period (e.g. March 2025).", variant: "destructive" }); return;
    }
    outstandingMutation.mutate({
      vendorId: vendor.id,
      amount: amt,
      period: outstandingForm.period.trim(),
      bwLinkName: outstandingForm.bwLinkName || undefined,
      notes: outstandingForm.notes || undefined,
      performedBy: "Admin",
    });
  };

  const openEditVendor = () => {
    if (!vendor) return;
    setEditVendorForm(vendorToEditForm(vendor));
    setEditVendorOpen(true);
  };

  const submitEditVendor = async () => {
    if (!vendor || !editVendorForm) return;
    if (!editVendorForm.name.trim()) {
      toast({ title: "Vendor name is required", variant: "destructive" }); return;
    }
    if (!editVendorForm.phone.trim()) {
      toast({ title: "Phone number is required", variant: "destructive" }); return;
    }
    setEditVendorSubmitting(true);
    try {
      await apiRequest("PATCH", `/api/vendors/${vendor.id}`, {
        name: editVendorForm.name.trim(),
        contactPerson: editVendorForm.contactPerson.trim() || null,
        phone: editVendorForm.phone.trim(),
        email: editVendorForm.email.trim() || null,
        address: editVendorForm.address.trim() || null,
        city: editVendorForm.city.trim() || null,
        serviceType: editVendorForm.serviceType,
        ntn: editVendorForm.ntn.trim() || null,
        bankName: editVendorForm.bankName.trim() || null,
        bankAccountTitle: editVendorForm.bankAccountTitle.trim() || null,
        bankAccountNumber: editVendorForm.bankAccountNumber.trim() || null,
        bankBranchCode: editVendorForm.bankBranchCode.trim() || null,
        slaLevel: editVendorForm.slaLevel,
        totalBandwidth: editVendorForm.totalBandwidth.trim() || null,
        usedBandwidth: editVendorForm.usedBandwidth.trim() || null,
        bandwidthCost: editVendorForm.bandwidthCost || "0",
        contractStartDate: editVendorForm.contractStartDate || null,
        contractEndDate: editVendorForm.contractEndDate || null,
        contractType: editVendorForm.contractType || null,
        paymentTerms: editVendorForm.paymentTerms || null,
        autoRenewal: editVendorForm.autoRenewal,
        penaltyClause: editVendorForm.penaltyClause.trim() || null,
        panelUrl: editVendorForm.panelUrl.trim() || null,
        panelUsername: editVendorForm.panelUsername.trim() || null,
        status: editVendorForm.status,
      } as Partial<InsertVendor>);
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setEditVendorOpen(false);
      setEditVendorForm(null);
      toast({ title: "Vendor profile updated" });
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to update vendor", variant: "destructive" });
    } finally {
      setEditVendorSubmitting(false);
    }
  };

  const openAddPkg = () => { setEditingPkg(null); setAddPkgForm(emptyAddPkgForm); setAddPkgOpen(true); };
  const openEditPkg = (pkg: VendorPackage) => {
    setEditingPkg(pkg);
    setAddPkgForm({
      panelLinkId: pkg.panelLinkId ? String(pkg.panelLinkId) : "",
      packageName: pkg.packageName || "",
      speed: pkg.speed || "",
      vendorPrice: pkg.vendorPrice || "0",
      ispSellingPrice: pkg.ispSellingPrice || "0",
      resellerPrice: pkg.resellerPrice || "",
      dataLimit: pkg.dataLimit || "",
      validity: pkg.validity || "30 days",
      isActive: pkg.isActive !== false,
    });
    setAddPkgOpen(true);
  };
  const handleDeletePkg = async (pkgId: number, pkgName: string) => {
    if (!confirm(`Delete package "${pkgName}"?`)) return;
    try {
      await apiRequest("DELETE", `/api/vendor-packages/${pkgId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-packages"] });
      toast({ title: "Package deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const submitAddPkg = async () => {
    if (!addPkgForm.packageName.trim()) {
      toast({ title: "Package name is required", variant: "destructive" }); return;
    }
    if (!addPkgForm.vendorPrice || !addPkgForm.ispSellingPrice) {
      toast({ title: "Vendor price and ISP price are required", variant: "destructive" }); return;
    }
    setAddPkgSubmitting(true);
    const payload = {
      vendorId: Number(id),
      panelLinkId: addPkgForm.panelLinkId ? Number(addPkgForm.panelLinkId) : null,
      packageName: addPkgForm.packageName.trim(),
      speed: addPkgForm.speed.trim() || null,
      vendorPrice: addPkgForm.vendorPrice,
      ispSellingPrice: addPkgForm.ispSellingPrice,
      resellerPrice: addPkgForm.resellerPrice || null,
      dataLimit: addPkgForm.dataLimit.trim() || null,
      validity: addPkgForm.validity.trim() || "30 days",
      isActive: addPkgForm.isActive,
    };
    try {
      if (editingPkg) {
        await apiRequest("PATCH", `/api/vendor-packages/${editingPkg.id}`, payload);
        toast({ title: "Package updated successfully" });
      } else {
        await apiRequest("POST", "/api/vendor-packages", payload);
        toast({ title: "Package added successfully" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-packages"] });
      setAddPkgOpen(false);
      setAddPkgForm(emptyAddPkgForm);
      setEditingPkg(null);
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to save package", variant: "destructive" });
    } finally {
      setAddPkgSubmitting(false);
    }
  };

  const openAddPl = () => { setEditingPl(null); setPlForm(emptyPanelLinkForm); setPlDialogOpen(true); };
  const openEditPl = (pl: VendorPanelLink) => {
    setEditingPl(pl);
    setPlForm({
      panelName: pl.panelName || "",
      panelUrl: pl.panelUrl || "",
      panelUsername: pl.panelUsername || "",
      city: pl.city || "",
      walletBalance: pl.walletBalance || "0",
      monthlyFee: pl.monthlyFee || "0",
      status: pl.status || "active",
      notes: pl.notes || "",
      serviceType: pl.serviceType || "fiber",
      networkInterface: pl.networkInterface || "",
      portDetails: pl.portDetails || "",
      popLocation: pl.popLocation || "",
    });
    setPlDialogOpen(true);
  };

  const submitPlForm = () => {
    if (!plForm.panelName.trim()) {
      toast({ title: "Panel name is required", variant: "destructive" }); return;
    }
    const payload = {
      vendorId: Number(id),
      panelName: plForm.panelName,
      panelUrl: plForm.panelUrl || null,
      panelUsername: plForm.panelUsername || null,
      city: plForm.city || null,
      walletBalance: plForm.walletBalance || "0",
      monthlyFee: plForm.monthlyFee || "0",
      status: plForm.status || "active",
      notes: plForm.notes || null,
      serviceType: plForm.serviceType || null,
      networkInterface: plForm.networkInterface || null,
      portDetails: plForm.portDetails || null,
      popLocation: plForm.popLocation || null,
    };
    if (editingPl) {
      updatePlMutation.mutate({ id: editingPl.id, data: payload });
    } else {
      createPlMutation.mutate(payload as InsertVendorPanelLink);
    }
  };

  const openAddBwLink = () => {
    setEditingBwLink(null);
    setBwLinkForm(emptyBwLinkForm);
    setBwLinkFormTab("basic");
    setBwLinkDialogOpen(true);
  };
  const openEditBwLink = (link: VendorBandwidthLink) => {
    setEditingBwLink(link);
    setBwLinkForm(bwLinkToForm(link));
    setBwLinkFormTab("basic");
    setBwLinkDialogOpen(true);
  };
  const handleSubmitBwLink = async () => {
    if (!bwLinkForm.linkName.trim()) { toast({ title: "Link Name is required", variant: "destructive" }); setBwLinkFormTab("basic"); return; }
    if (!bwLinkForm.bandwidthMbps || !bwLinkForm.bandwidthRate) { toast({ title: "Bandwidth and Rate are required", variant: "destructive" }); setBwLinkFormTab("bandwidth"); return; }
    setBwLinkSubmitting(true);
    try {
      const payload: InsertVendorBandwidthLink = {
        vendorId: Number(id),
        linkName: bwLinkForm.linkName,
        city: bwLinkForm.city || null,
        popLocation: bwLinkForm.popLocation || null,
        startDate: bwLinkForm.startDate || null,
        billingType: bwLinkForm.billingType || "full_month",
        status: bwLinkForm.status || "active",
        serviceType: bwLinkForm.serviceType || "fiber",
        bandwidthMbps: bwLinkForm.bandwidthMbps || "0",
        bandwidthRate: bwLinkForm.bandwidthRate || "0",
        tax: bwLinkForm.tax || "0",
        currency: bwLinkForm.currency || "PKR",
        exchangeRate: bwLinkForm.exchangeRate || "1",
        totalMonthlyCost: bwLinkForm.totalMonthlyCost || "0",
        ipAddress: bwLinkForm.ipAddress || null,
        vlanDetail: bwLinkForm.vlanDetail || null,
        portDetails: bwLinkForm.portDetails || null,
        routingType: bwLinkForm.routingType || "static",
        networkInterface: bwLinkForm.networkInterface || null,
        gateway: bwLinkForm.gateway || null,
        dnsServers: bwLinkForm.dnsServers || null,
        asNumber: bwLinkForm.asNumber || null,
        bgpConfig: bwLinkForm.bgpConfig || null,
        notes: bwLinkForm.notes || null,
      };
      if (editingBwLink) {
        await apiRequest("PATCH", `/api/vendor-bandwidth-links/${editingBwLink.id}`, payload);
        toast({ title: "Bandwidth link updated" });
      } else {
        await apiRequest("POST", "/api/vendor-bandwidth-links", payload);
        toast({ title: "Bandwidth link added" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-bandwidth-links"] });
      setBwLinkDialogOpen(false);
      setEditingBwLink(null);
      setBwLinkForm(emptyBwLinkForm);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBwLinkSubmitting(false);
    }
  };

  const handleSubmitDplcLink = async () => {
    if (!dplcForm.linkName.trim()) { toast({ title: "Link Name is required", variant: "destructive" }); setDplcFormTab("basic"); return; }
    if (!dplcForm.bandwidthMbps || !dplcForm.bandwidthRate) { toast({ title: "Bandwidth and Rate are required", variant: "destructive" }); setDplcFormTab("bandwidth"); return; }
    setDplcSubmitting(true);
    try {
      const payload: InsertVendorBandwidthLink = {
        vendorId: Number(id),
        linkName: dplcForm.linkName,
        city: dplcForm.siteACity || null,
        popLocation: dplcForm.siteBCity || null,
        startDate: dplcForm.startDate || null,
        billingType: dplcForm.billingType || "full_month",
        status: dplcForm.status || "active",
        serviceType: "dplc",
        bandwidthMbps: dplcForm.bandwidthMbps || "0",
        bandwidthRate: dplcForm.bandwidthRate || "0",
        tax: dplcForm.tax || "0",
        currency: dplcForm.currency || "PKR",
        exchangeRate: dplcForm.exchangeRate || "1",
        totalMonthlyCost: dplcForm.totalMonthlyCost || "0",
        ipAddress: null,
        vlanDetail: dplcForm.vlanDetail || null,
        portDetails: dplcForm.siteAPort || null,
        routingType: "static",
        networkInterface: dplcForm.siteAInterface || null,
        gateway: dplcForm.siteBInterface || null,
        dnsServers: dplcForm.siteATowerId || null,
        asNumber: dplcForm.siteBPort || null,
        bgpConfig: dplcForm.siteBTowerId || null,
        notes: dplcForm.notes || null,
      };
      await apiRequest("POST", "/api/vendor-bandwidth-links", payload);
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-bandwidth-links"] });
      setDplcDialogOpen(false);
      setDplcForm(emptyDplcForm);
      setDplcFormTab("basic");
      toast({ title: "DPLC link added successfully" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setDplcSubmitting(false);
    }
  };

  const handleRechargeSubmit = async () => {
    const amt = parseFloat(rechargeForm.amount);
    if (!rechargeForm.amount || isNaN(amt) || amt <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" }); return;
    }
    setRechargeSubmitting(true);
    try {
      await apiRequest("POST", "/api/vendor-wallet/recharge", {
        vendorId: Number(id),
        amount: amt,
        reference: rechargeForm.reference || `PAY-${Date.now()}`,
        paymentMethod: rechargeForm.paymentMethod,
        performedBy: rechargeForm.performedBy || "Admin",
        notes: rechargeForm.notes || null,
        paymentStatus: rechargeForm.paymentStatus,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-wallet-transactions", Number(id)] });
      setRechargeOpen(false);
      setRechargeForm({ amount: "", reference: "", paymentMethod: "bank_transfer", performedBy: "", notes: "", paymentStatus: "paid" });
      toast({ title: "Payment recorded", description: `${formatPKR(amt)} payment has been added to the wallet ledger.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRechargeSubmitting(false);
    }
  };

  const handleDeductSubmit = async () => {
    const amt = parseFloat(deductForm.amount);
    if (!deductForm.amount || isNaN(amt) || amt <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" }); return;
    }
    setDeductSubmitting(true);
    try {
      await apiRequest("POST", "/api/vendor-wallet/deduct", {
        vendorId: Number(id),
        amount: amt,
        reference: deductForm.reference || `DED-${Date.now()}`,
        reason: deductForm.reason || null,
        performedBy: deductForm.performedBy || "Admin",
        notes: deductForm.notes || null,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-wallet-transactions", Number(id)] });
      setDeductOpen(false);
      setDeductForm({ amount: "", reference: "", reason: "", performedBy: "", notes: "" });
      toast({ title: "Balance deducted", description: `${formatPKR(amt)} has been deducted from the wallet.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setDeductSubmitting(false);
    }
  };

  const handleDeleteVendor = async () => {
    if (!vendor) return;
    setDeleteVendorSubmitting(true);
    try {
      await apiRequest("DELETE", `/api/vendors/${vendor.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Vendor deleted", description: `${vendor.name} has been removed.` });
      setLocation("/vendors");
    } catch (e: any) {
      toast({ title: "Cannot delete", description: e.message, variant: "destructive" });
    } finally {
      setDeleteVendorSubmitting(false);
      setDeleteVendorOpen(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!vendor) return;
    const newStatus = vendor.status === "active" ? "inactive" : "active";
    setStatusToggling(true);
    try {
      await apiRequest("PATCH", `/api/vendors/${vendor.id}`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: `Vendor ${newStatus === "active" ? "activated" : "deactivated"}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setStatusToggling(false);
    }
  };

  const handleGenerateBill = async () => {
    if (!vendor || bwLinks.length === 0) return;
    const period = generateBillForm.period.trim();
    if (!period) { toast({ title: "Period is required", variant: "destructive" }); return; }
    const totalCost = bwLinks.filter(l => l.status === "active").reduce((s, l) => s + Number(l.totalMonthlyCost || 0), 0);
    if (totalCost <= 0) { toast({ title: "No active BW links with cost", variant: "destructive" }); return; }
    try {
      for (const link of bwLinks.filter(l => l.status === "active" && Number(l.totalMonthlyCost || 0) > 0)) {
        await apiRequest("POST", "/api/vendor-wallet/outstanding", {
          vendorId: vendor.id,
          amount: Number(link.totalMonthlyCost),
          period,
          bwLinkName: link.linkName,
          notes: generateBillForm.notes || `Monthly bill – ${period}`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-wallet-transactions", vendor.id] });
      setGenerateBillOpen(false);
      setGenerateBillForm({ period: "", notes: "" });
      toast({ title: "Monthly bill generated", description: `${formatPKR(totalCost)} outstanding added for ${period}.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteTransaction = async (txnId: number) => {
    if (!confirm("Delete this transaction? The wallet balance will be recalculated.")) return;
    try {
      await apiRequest("DELETE", `/api/vendor-wallet-transactions/${txnId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-wallet-transactions", Number(id)] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Transaction deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const bwLinks = (allBwLinks || []).filter(l => l.vendorId === Number(id));
  const panelLinks = (allPanelLinks || []).filter(l => l.vendorId === Number(id));
  const pkgs = (allPackages || []).filter(p => p.vendorId === Number(id));
  const transactions = txns || [];

  const contractDiff = vendor?.contractEndDate
    ? Math.ceil((new Date(vendor.contractEndDate).getTime() - Date.now()) / 86400000)
    : null;
  const totalMonthlyCost = bwLinks.reduce((s, l) => s + Number(l.totalMonthlyCost || 0), 0);
  const totalMbps = bwLinks.reduce((s, l) => s + Number(l.bandwidthMbps || 0), 0);
  const walletBalance = Number(vendor?.walletBalance || 0);
  const totalRecharged = transactions
    .filter(t => t.type === "recharge" || t.type === "credit")
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalDebited = transactions
    .filter(t => t.type === "debit" || t.type === "deduct" || t.type === "outstanding")
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalOutstanding = transactions
    .filter(t => t.type === "outstanding")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const backUrl = `/vendors?tab=${vendorType === "panel" ? "panel-vendors" : "bandwidth-vendors"}`;

  if (vendorsLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground text-sm">Vendor not found.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setLocation("/vendors")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Vendors
        </Button>
      </div>
    );
  }

  return (
    <div className="page-fade-in">
      {/* Back bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b bg-background/80 sticky top-0 z-30 backdrop-blur-sm">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 text-xs"
          onClick={() => setLocation(backUrl)}
          data-testid="button-vendor-profile-back"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {vendorType === "panel" ? "Panel Vendors" : "Bandwidth Vendors"}
        </Button>
        <span className="text-muted-foreground text-xs hidden sm:block">/ Vendor Profile</span>
        <span className="text-xs font-medium hidden sm:block truncate">{vendor.name}</span>
      </div>

      {/* Hero Header */}
      <div className="vendor-page-header px-6 py-6 relative overflow-hidden border-b">
        <div className="flex items-start gap-5 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-3xl shrink-0 shadow-sm">
            {vendor.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate" data-testid="text-vendor-profile-name">{vendor.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge variant="secondary" className="text-xs">
                {vendorType === "bandwidth"
                  ? <><Wifi className="h-3 w-3 mr-1" />Bandwidth Vendor</>
                  : <><Globe className="h-3 w-3 mr-1" />Panel Vendor</>}
              </Badge>
              <Badge variant={vendor.status === "active" ? "default" : "destructive"} className="text-xs">
                {vendor.status === "active" ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                <span className="capitalize">{vendor.status}</span>
              </Badge>
              {vendor.slaLevel && (
                <Badge variant="outline" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />{vendor.slaLevel} SLA
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-2.5 text-muted-foreground text-sm">
              {vendor.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{vendor.phone}</span>}
              {vendor.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{vendor.email}</span>}
              {vendor.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{vendor.city}</span>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="no-default-hover-elevate"
              onClick={() => setLocation(backUrl)}
              data-testid="button-vendor-profile-back-hero"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Back
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white no-default-hover-elevate"
              onClick={() => setRechargeOpen(true)}
              data-testid="button-vendor-profile-recharge-hero"
            >
              <ArrowDownLeft className="h-3.5 w-3.5 mr-1.5" />{vendorType === "panel" ? "Recharge" : "Send Payment"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="no-default-hover-elevate border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30"
              onClick={() => setDeductOpen(true)}
              data-testid="button-vendor-profile-deduct-hero"
            >
              <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />Deduct
            </Button>
            <Button
              size="sm"
              variant="outline"
              className={`no-default-hover-elevate ${vendor.status === "active" ? "border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30" : "border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"}`}
              onClick={handleToggleStatus}
              disabled={statusToggling}
              data-testid="button-vendor-profile-toggle-status"
            >
              {vendor.status === "active" ? <XCircle className="h-3.5 w-3.5 mr-1.5" /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
              {statusToggling ? "..." : vendor.status === "active" ? "Deactivate" : "Activate"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="no-default-hover-elevate"
              onClick={openEditVendor}
              data-testid="button-vendor-profile-edit-hero"
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />Edit Profile
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="no-default-hover-elevate border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={() => setDeleteVendorOpen(true)}
              data-testid="button-vendor-profile-delete-hero"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete
            </Button>
          </div>
        </div>

        {/* Quick stats pills */}
        <div className="flex flex-wrap gap-3 mt-5 relative z-10">
          <div className="bg-muted rounded-xl px-4 py-2.5 min-w-[100px]">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Wallet Balance</p>
            <p className="text-lg font-bold">{formatPKR(walletBalance)}</p>
          </div>
          {vendorType === "panel" && (
            <div className="bg-muted rounded-xl px-4 py-2.5 min-w-[100px]">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Panel Links</p>
              <p className="text-lg font-bold">{panelLinks.length}</p>
            </div>
          )}
          {vendorType === "panel" && (
            <div className="bg-muted rounded-xl px-4 py-2.5 min-w-[100px]">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Packages</p>
              <p className="text-lg font-bold">{pkgs.length}</p>
            </div>
          )}
          {vendorType === "bandwidth" && (
            <div className="bg-muted rounded-xl px-4 py-2.5 min-w-[100px]">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Bandwidth</p>
              <p className="text-lg font-bold">{totalMbps} <span className="text-sm font-normal">Mbps</span></p>
            </div>
          )}
          <div className="bg-muted rounded-xl px-4 py-2.5 min-w-[100px]">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Transactions</p>
            <p className="text-lg font-bold">{transactions.length}</p>
          </div>
          {contractDiff !== null && (
            <div className={`rounded-xl px-4 py-2.5 min-w-[100px] ${contractDiff < 0 ? "bg-red-100 dark:bg-red-950/40" : contractDiff <= 30 ? "bg-amber-100 dark:bg-amber-950/40" : "bg-muted"}`}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Contract</p>
              <p className="text-lg font-bold">{contractDiff < 0 ? "Expired" : `${contractDiff}d left`}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs value={profileTab} onValueChange={setProfileTab}>
        {/* Sticky Tab Bar */}
        <div className="border-b bg-background sticky top-[53px] z-20 px-5">
          <TabsList className="h-auto p-0 bg-transparent rounded-none gap-0 w-full justify-start flex-wrap">
            <TabsTrigger value="overview" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 gap-1.5 px-4"><BarChart3 className="h-3.5 w-3.5" />Overview</TabsTrigger>
            <TabsTrigger value="info" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 gap-1.5 px-4"><User className="h-3.5 w-3.5" />Basic Info</TabsTrigger>
            {vendorType === "bandwidth"
              ? <TabsTrigger value="links" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 gap-1.5 px-4"><Network className="h-3.5 w-3.5" />BW Links{bwLinks.length > 0 && <Badge variant="secondary" className="ml-1 no-default-active-elevate text-[10px] px-1.5 py-0">{bwLinks.length}</Badge>}</TabsTrigger>
              : <TabsTrigger value="links" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 gap-1.5 px-4"><Globe className="h-3.5 w-3.5" />Panel Links{panelLinks.length > 0 && <Badge variant="secondary" className="ml-1 no-default-active-elevate text-[10px] px-1.5 py-0">{panelLinks.length}</Badge>}</TabsTrigger>}
            {vendorType === "panel" && <TabsTrigger value="packages" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 gap-1.5 px-4"><Package className="h-3.5 w-3.5" />Packages{pkgs.length > 0 && <Badge variant="secondary" className="ml-1 no-default-active-elevate text-[10px] px-1.5 py-0">{pkgs.length}</Badge>}</TabsTrigger>}
            <TabsTrigger value="financial" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 gap-1.5 px-4"><DollarSign className="h-3.5 w-3.5" />Financial</TabsTrigger>
            <TabsTrigger value="banking" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 gap-1.5 px-4"><Landmark className="h-3.5 w-3.5" />Banking</TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 gap-1.5 px-4"><History className="h-3.5 w-3.5" />Transactions{transactions.length > 0 && <Badge variant="secondary" className="ml-1 no-default-active-elevate text-[10px] px-1.5 py-0">{transactions.length}</Badge>}</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="p-5">

          {/* ─── OVERVIEW ─── */}
          <TabsContent value="overview" className="space-y-5 mt-0">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-1.5"><div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-950"><Wallet className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Wallet</p></div>
                  <p className={`text-xl font-bold leading-tight ${walletBalance >= 0 ? "text-purple-600 dark:text-purple-400" : "text-red-600 dark:text-red-400"}`}>{formatPKR(walletBalance)}</p>
                </CardContent>
              </Card>
              {vendorType === "bandwidth" && (
                <Card>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center gap-2 mb-1.5"><div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-950"><DollarSign className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly Cost</p></div>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 leading-tight">{formatPKR(totalMonthlyCost)}</p>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`p-1.5 rounded-md ${vendorType === "bandwidth" ? "bg-blue-100 dark:bg-blue-950" : "bg-cyan-100 dark:bg-cyan-950"}`}>
                      {vendorType === "bandwidth" ? <Network className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> : <Globe className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{vendorType === "bandwidth" ? "BW Links" : "Panel Links"}</p>
                  </div>
                  <p className="text-xl font-bold leading-tight">{vendorType === "bandwidth" ? bwLinks.length : panelLinks.length}</p>
                </CardContent>
              </Card>
              {vendorType === "bandwidth" && (
                <Card>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center gap-2 mb-1.5"><div className="p-1.5 rounded-md bg-cyan-100 dark:bg-cyan-950"><Zap className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Mbps</p></div>
                    <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400 leading-tight">{totalMbps}</p>
                  </CardContent>
                </Card>
              )}
              {vendorType === "panel" && (
                <Card>
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex items-center gap-2 mb-1.5"><div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950"><Package className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Packages</p></div>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-tight">{pkgs.length}</p>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-1.5"><div className="p-1.5 rounded-md bg-green-100 dark:bg-green-950"><ArrowDownLeft className="h-3.5 w-3.5 text-green-600 dark:text-green-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Paid</p></div>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400 leading-tight">{formatPKR(totalRecharged)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-1.5"><div className="p-1.5 rounded-md bg-orange-100 dark:bg-orange-950"><AlertCircle className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Outstanding</p></div>
                  <p className="text-xl font-bold text-orange-600 dark:text-orange-400 leading-tight">{formatPKR(totalOutstanding)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Two-column: Vendor Identity + Contract Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10"><Building2 className="h-3.5 w-3.5 text-primary" /></div>
                    Vendor Identity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 bg-muted/40 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center font-bold text-primary text-lg shrink-0">{vendor.name.charAt(0).toUpperCase()}</div>
                      <div><p className="font-semibold text-sm">{vendor.name}</p><p className="text-xs text-muted-foreground capitalize">{vendor.serviceType || vendorType} vendor</p></div>
                    </div>
                    {vendor.contactPerson && (
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Contact Person</p>
                        <p className="text-xs font-medium">{vendor.contactPerson}</p>
                      </div>
                    )}
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Status</p>
                      <p className={`text-xs font-semibold capitalize ${vendor.status === "active" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{vendor.status}</p>
                    </div>
                    {vendor.phone && (
                      <div className="bg-green-50 dark:bg-green-950/40 rounded-lg p-2.5 flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
                        <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Phone</p><p className="text-xs font-medium">{vendor.phone}</p></div>
                      </div>
                    )}
                    {vendor.email && (
                      <div className="bg-blue-50 dark:bg-blue-950/40 rounded-lg p-2.5 flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p><p className="text-xs font-medium truncate">{vendor.email}</p></div>
                      </div>
                    )}
                    {vendor.city && (
                      <div className="bg-amber-50 dark:bg-amber-950/40 rounded-lg p-2.5 flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">City</p><p className="text-xs font-medium">{vendor.city}</p></div>
                      </div>
                    )}
                    {vendor.ntn && (
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">NTN / Tax ID</p>
                        <p className="text-xs font-mono font-semibold">{vendor.ntn}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-yellow-100 dark:bg-yellow-950"><FileText className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" /></div>
                    Contract & Service Level
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">SLA Level</p>
                      <p className={`text-xs font-semibold capitalize ${vendor.slaLevel === "enterprise" ? "text-purple-600 dark:text-purple-400" : vendor.slaLevel === "premium" ? "text-blue-600 dark:text-blue-400" : ""}`}>{vendor.slaLevel || "Standard"}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Contract Type</p>
                      <p className="text-xs font-semibold capitalize">{vendor.contractType || "—"}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Start Date</p>
                      <p className="text-xs font-medium">{vendor.contractStartDate || "—"}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">End Date</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        <p className="text-xs font-medium">{vendor.contractEndDate || "—"}</p>
                        {contractDiff !== null && (
                          contractDiff < 0
                            ? <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-950 px-1 py-0">Expired</Badge>
                            : contractDiff <= 30
                              ? <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-950 px-1 py-0">{contractDiff}d</Badge>
                              : <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-green-600 bg-green-50 dark:text-green-300 dark:bg-green-950 px-1 py-0">{contractDiff}d</Badge>
                        )}
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Payment Terms</p>
                      <p className="text-xs font-semibold">{vendor.paymentTerms === "net30" ? "Net 30" : vendor.paymentTerms === "net15" ? "Net 15" : vendor.paymentTerms === "net45" ? "Net 45" : vendor.paymentTerms === "advance" ? "Advance" : vendor.paymentTerms === "on_delivery" ? "On Delivery" : vendor.paymentTerms || "—"}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Payable Amount</p>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400">{formatPKR(vendor.payableAmount)}</p>
                    </div>
                  </div>
                  {vendor.autoRenewal && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-2.5">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
                      <p className="text-xs text-green-700 dark:text-green-300 font-medium">Auto-Renewal Enabled</p>
                    </div>
                  )}
                  {vendor.penaltyClause && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">Penalty / SLA Notes</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">{vendor.penaltyClause}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Navigation */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5">Quick Navigation</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <button className="group flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors text-left w-full" onClick={() => setProfileTab("info")}>
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0"><User className="h-4 w-4 text-primary" /></div>
                  <div><p className="text-xs font-semibold">Basic Info</p><p className="text-[10px] text-muted-foreground">Contact & business</p></div>
                </button>
                <button className="group flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors text-left w-full" onClick={() => setProfileTab("links")}>
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 group-hover:bg-blue-200 dark:group-hover:bg-blue-900 transition-colors shrink-0">{vendorType === "bandwidth" ? <Network className="h-4 w-4 text-blue-600 dark:text-blue-400" /> : <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />}</div>
                  <div><p className="text-xs font-semibold">{vendorType === "bandwidth" ? "BW Links" : "Panel Links"}</p><p className="text-[10px] text-muted-foreground">{vendorType === "bandwidth" ? `${bwLinks.length} links · ${totalMbps} Mbps` : `${panelLinks.length} links`}</p></div>
                </button>
                <button className="group flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-green-500/50 hover:bg-green-500/5 transition-colors text-left w-full" onClick={() => setProfileTab("financial")}>
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950 group-hover:bg-green-200 dark:group-hover:bg-green-900 transition-colors shrink-0"><DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" /></div>
                  <div><p className="text-xs font-semibold">Financial</p><p className="text-[10px] text-muted-foreground">Contract & billing</p></div>
                </button>
                <button className="group flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-purple-500/50 hover:bg-purple-500/5 transition-colors text-left w-full" onClick={() => setProfileTab("transactions")}>
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950 group-hover:bg-purple-200 dark:group-hover:bg-purple-900 transition-colors shrink-0"><History className="h-4 w-4 text-purple-600 dark:text-purple-400" /></div>
                  <div><p className="text-xs font-semibold">Transactions</p><p className="text-[10px] text-muted-foreground">{transactions.length} records</p></div>
                </button>
              </div>
            </div>
          </TabsContent>

          {/* ─── BASIC INFO ─── */}
          <TabsContent value="info" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10"><User className="h-3.5 w-3.5 text-primary" /></div>
                    Contact & Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {vendor.contactPerson && (
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><User className="h-3.5 w-3.5 text-primary" /></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Contact Person</p><p className="text-sm font-medium">{vendor.contactPerson}</p></div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/40">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0"><Phone className="h-3.5 w-3.5 text-green-600 dark:text-green-400" /></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Phone</p><p className="text-sm font-medium">{vendor.phone}</p></div>
                  </div>
                  {vendor.email && (
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0"><Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p><p className="text-sm font-medium">{vendor.email}</p></div>
                    </div>
                  )}
                  {vendor.city && (
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0"><MapPin className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">City</p><p className="text-sm font-medium">{vendor.city}</p></div>
                    </div>
                  )}
                  {vendor.address && (
                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0 mt-0.5"><Building2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Address</p><p className="text-sm">{vendor.address}</p></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-950"><Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /></div>
                    Business Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Service Type</p>
                      <p className="text-sm font-semibold capitalize">{vendor.serviceType || "—"}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">SLA Level</p>
                      <p className={`text-sm font-semibold capitalize ${vendor.slaLevel === "enterprise" ? "text-purple-600 dark:text-purple-400" : vendor.slaLevel === "premium" ? "text-blue-600 dark:text-blue-400" : ""}`}>{vendor.slaLevel || "Standard"}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Vendor Type</p>
                      <p className="text-sm font-semibold capitalize">{vendor.vendorType || vendorType}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Status</p>
                      <p className={`text-sm font-semibold capitalize ${vendor.status === "active" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{vendor.status}</p>
                    </div>
                  </div>
                  {vendor.ntn && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">NTN / Tax ID</p>
                      <p className="text-sm font-mono font-semibold">{vendor.ntn}</p>
                    </div>
                  )}
                  {vendor.address && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Address</p>
                      <p className="text-xs">{vendor.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Network Infrastructure (BW only) */}
            {vendorType === "bandwidth" && (vendor.networkInterface || vendor.portDetails || vendor.gateway || vendor.dnsServers || vendor.asNumber || vendor.bgpConfig || vendor.routingType) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950"><Network className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /></div>
                    Network & Infrastructure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {vendor.routingType && <div className="bg-muted/50 rounded-lg p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Routing Type</p><p className="text-sm font-semibold capitalize">{vendor.routingType}</p></div>}
                    {vendor.networkInterface && <div className="bg-muted/50 rounded-lg p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Interface</p><p className="text-sm font-mono">{vendor.networkInterface}</p></div>}
                    {vendor.portDetails && <div className="bg-muted/50 rounded-lg p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Port / Slot</p><p className="text-sm font-mono">{vendor.portDetails}</p></div>}
                    {vendor.gateway && <div className="bg-muted/50 rounded-lg p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Gateway</p><p className="text-sm font-mono">{vendor.gateway}</p></div>}
                    {vendor.dnsServers && <div className="bg-muted/50 rounded-lg p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">DNS Servers</p><p className="text-sm font-mono">{vendor.dnsServers}</p></div>}
                    {vendor.asNumber && <div className="bg-muted/50 rounded-lg p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">AS Number</p><p className="text-sm font-mono font-semibold">{vendor.asNumber}</p></div>}
                    {vendor.bgpConfig && <div className="bg-muted/50 rounded-lg p-3 col-span-2"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">BGP Config</p><p className="text-xs font-mono break-all">{vendor.bgpConfig}</p></div>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Support & SLA */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-yellow-100 dark:bg-yellow-950"><Shield className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" /></div>
                  Support & SLA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className={`rounded-xl p-4 text-center ${vendor.slaLevel === "enterprise" ? "bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900" : vendor.slaLevel === "premium" ? "bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900" : "bg-muted/50"}`}>
                    <Star className={`h-7 w-7 mx-auto mb-1.5 ${vendor.slaLevel === "enterprise" ? "text-purple-600 dark:text-purple-400" : vendor.slaLevel === "premium" ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
                    <p className={`text-base font-bold capitalize ${vendor.slaLevel === "enterprise" ? "text-purple-700 dark:text-purple-300" : vendor.slaLevel === "premium" ? "text-blue-700 dark:text-blue-300" : ""}`}>{vendor.slaLevel || "Standard"} SLA</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{vendor.slaLevel === "enterprise" ? "Dedicated account manager" : vendor.slaLevel === "premium" ? "Enhanced support" : "Standard response times"}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <Headphones className="h-7 w-7 mx-auto mb-1.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Response Time</p>
                    <p className="text-base font-bold mt-0.5">{vendor.slaLevel === "enterprise" ? "1 hour" : vendor.slaLevel === "premium" ? "4 hours" : "24 hours"}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <CheckCircle className="h-7 w-7 mx-auto mb-1.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Resolution Time</p>
                    <p className="text-base font-bold mt-0.5">{vendor.slaLevel === "enterprise" ? "4 hours" : vendor.slaLevel === "premium" ? "24 hours" : "72 hours"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── BW LINKS / PANEL LINKS ─── */}
          <TabsContent value="links" className="space-y-4 mt-0">
            {vendorType === "bandwidth" ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex items-center gap-2 mb-1.5"><div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950"><Network className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Links</p></div>
                      <p className="text-2xl font-bold">{bwLinks.length}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{bwLinks.filter(l => l.status === "active").length} active</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex items-center gap-2 mb-1.5"><div className="p-1.5 rounded-md bg-cyan-100 dark:bg-cyan-950"><Zap className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Bandwidth</p></div>
                      <p className="text-2xl font-bold">{totalMbps} <span className="text-sm font-normal text-muted-foreground">Mbps</span></p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex items-center gap-2 mb-1.5"><div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-950"><DollarSign className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly Cost</p></div>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatPKR(totalMonthlyCost)}</p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <CardTitle className="text-sm flex items-center gap-2"><Network className="h-4 w-4 text-primary" />Bandwidth Links ({bwLinks.length})</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950" onClick={() => { setOutstandingForm({ amount: "", bwLinkName: "", period: "", notes: "" }); setOutstandingOpen(true); }} data-testid="button-add-outstanding">
                          <AlertCircle className="h-3.5 w-3.5" />Add Old Outstanding
                        </Button>
                        {bwLinks.length > 0 && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950" onClick={() => {
                            const now = new Date();
                            setGenerateBillForm({ period: now.toLocaleString("en-US", { month: "long", year: "numeric" }), notes: "" });
                            setGenerateBillOpen(true);
                          }} data-testid="button-generate-monthly-bill">
                            <FileText className="h-3.5 w-3.5" />Generate Monthly Bill
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950" onClick={() => { setDplcForm(emptyDplcForm); setDplcFormTab("basic"); setDplcDialogOpen(true); }} data-testid="button-add-dplc-link">
                          <Plus className="h-3.5 w-3.5" />Add DPLC Link
                        </Button>
                        <Button size="sm" className="h-7 text-xs gap-1.5" onClick={openAddBwLink} data-testid="button-add-bw-link">
                          <Plus className="h-3.5 w-3.5" />Add BW Link
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {bwLinks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wifi className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No bandwidth links added yet</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Link Name</TableHead>
                              <TableHead className="text-xs">Type</TableHead>
                              <TableHead className="text-xs">POP / City</TableHead>
                              <TableHead className="text-xs">IP / VLAN</TableHead>
                              <TableHead className="text-xs">Mbps</TableHead>
                              <TableHead className="text-xs">Monthly Cost</TableHead>
                              <TableHead className="text-xs">Billing</TableHead>
                              <TableHead className="text-xs">Start Date</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                              <TableHead className="w-16"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bwLinks.map(link => {
                              const proRataInfo = link.billingType === "pro_rata" && link.startDate && link.totalMonthlyCost ? (() => {
                                const start = new Date(link.startDate);
                                if (isNaN(start.getTime())) return null;
                                const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
                                const remainingDays = daysInMonth - start.getDate() + 1;
                                return { amount: (Number(link.totalMonthlyCost) / daysInMonth * remainingDays).toFixed(2), remainingDays, daysInMonth };
                              })() : null;
                              return (
                                <TableRow key={link.id} className="cursor-pointer hover:bg-primary/5 transition-colors" onClick={() => setSelectedBwLink(link)} data-testid={`row-bwlink-${link.id}`}>
                                  <TableCell className="text-sm font-medium text-primary hover:underline">{link.linkName}</TableCell>
                                  <TableCell><Badge variant="outline" className={`text-[10px] no-default-active-elevate ${link.serviceType === "dplc" ? "text-violet-600 border-violet-300" : link.serviceType === "wireless" ? "text-cyan-600 border-cyan-300" : "text-blue-600 border-blue-300"}`}>{link.serviceType === "dplc" ? "DPLC" : link.serviceType === "wireless" ? "Wireless" : "Fiber"}</Badge></TableCell>
                                  <TableCell className="text-sm">
                                    {link.serviceType === "dplc"
                                      ? (link.city && link.popLocation ? <span className="flex items-center gap-1">{link.city}<span className="text-muted-foreground">→</span>{link.popLocation}</span> : link.city || link.popLocation || "—")
                                      : ([link.popLocation, link.city].filter(Boolean).join(" / ") || "—")}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">{link.serviceType === "dplc" ? (link.vlanDetail || "—") : ([link.ipAddress, link.vlanDetail].filter(Boolean).join(" / ") || "—")}</TableCell>
                                  <TableCell className="text-sm font-bold text-blue-600 dark:text-blue-400">{link.bandwidthMbps} Mbps</TableCell>
                                  <TableCell className="text-sm font-bold">
                                    {formatPKR(link.totalMonthlyCost)}
                                    {(link as any).currency === "USD" && (
                                      <span className="block text-[10px] text-amber-600 font-normal">$ {link.bandwidthRate}/Mbps × {(link as any).exchangeRate}</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {link.billingType === "pro_rata" && proRataInfo ? (
                                      <div>
                                        <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300 no-default-active-elevate">Pro-Rata</Badge>
                                        <div className="text-[10px] text-orange-600 mt-0.5">{formatPKR(proRataInfo.amount)}</div>
                                      </div>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px] text-green-600 border-green-300 no-default-active-elevate">Full Month</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs">{link.startDate || "—"}</TableCell>
                                  <TableCell><Badge variant={link.status === "active" ? "default" : "secondary"} className="text-[10px] no-default-active-elevate capitalize">{link.status}</Badge></TableCell>
                                  <TableCell onClick={e => e.stopPropagation()}>
                                    <div className="flex gap-1">
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400" onClick={() => setSelectedBwLink(link)} data-testid={`button-view-bwlink-${link.id}`} title="View Link Detail"><Eye className="h-3.5 w-3.5" /></Button>
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEditBwLink(link)} data-testid={`button-edit-bwlink-${link.id}`}><Edit className="h-3.5 w-3.5" /></Button>
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-600" onClick={async () => { if (confirm(`Delete link "${link.linkName}"?`)) { await apiRequest("DELETE", `/api/vendor-bandwidth-links/${link.id}`); queryClient.invalidateQueries({ queryKey: ["/api/vendor-bandwidth-links"] }); toast({ title: "Link deleted" }); } }} data-testid={`button-delete-bwlink-${link.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            {bwLinks.length > 1 && (
                              <TableRow className="font-bold bg-muted/60">
                                <TableCell colSpan={3} className="text-xs font-bold">TOTALS</TableCell>
                                <TableCell className="text-sm font-bold text-blue-600 dark:text-blue-400">{totalMbps} Mbps</TableCell>
                                <TableCell className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatPKR(totalMonthlyCost)}</TableCell>
                                <TableCell /><TableCell /><TableCell /><TableCell />
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    {bwLinks.some(l => l.notes) && (
                      <div className="mt-3 space-y-2 pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground">Notes:</p>
                        {bwLinks.filter(l => l.notes).map(link => (
                          <div key={link.id} className="text-xs bg-muted/40 rounded p-2.5"><span className="font-medium">{link.linkName}:</span> {link.notes}</div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Per-link network detail cards */}
                {bwLinks.some(l => l.networkInterface || l.portDetails || l.gateway || l.asNumber || l.routingType || l.dnsServers || l.bgpConfig) && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5">Network Infrastructure Details (per link)</p>
                    <div className="space-y-3">
                      {bwLinks.filter(l => l.networkInterface || l.portDetails || l.gateway || l.asNumber || l.routingType || l.dnsServers || l.bgpConfig).map(link => {
                        const isDplc = link.serviceType === "dplc";
                        return (
                          <Card key={link.id} className={`border-l-4 ${isDplc ? "border-l-violet-500" : "border-l-blue-500"}`}>
                            <CardHeader className="pb-2 pt-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Network className={`h-3.5 w-3.5 ${isDplc ? "text-violet-600 dark:text-violet-400" : "text-blue-600 dark:text-blue-400"}`} />
                                {link.linkName}
                                {isDplc && <Badge variant="outline" className="no-default-active-elevate text-[10px] text-violet-600 dark:text-violet-400 border-violet-300 dark:border-violet-700 ml-1">DPLC</Badge>}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {isDplc ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {(link.networkInterface || link.portDetails || link.dnsServers) && (
                                    <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 p-3">
                                      <p className="text-[10px] font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider mb-2">Site A</p>
                                      <div className="space-y-2">
                                        {link.networkInterface && <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Interface</p><p className="text-xs font-mono">{link.networkInterface}</p></div>}
                                        {link.portDetails && <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Port / Slot</p><p className="text-xs font-mono">{link.portDetails}</p></div>}
                                        {link.dnsServers && <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Exchange / Tower ID</p><p className="text-xs font-mono">{link.dnsServers}</p></div>}
                                      </div>
                                    </div>
                                  )}
                                  {(link.gateway || link.asNumber || link.bgpConfig) && (
                                    <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 p-3">
                                      <p className="text-[10px] font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider mb-2">Site B</p>
                                      <div className="space-y-2">
                                        {link.gateway && <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Interface</p><p className="text-xs font-mono">{link.gateway}</p></div>}
                                        {link.asNumber && <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Port / Slot</p><p className="text-xs font-mono">{link.asNumber}</p></div>}
                                        {link.bgpConfig && <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Exchange / Tower ID</p><p className="text-xs font-mono">{link.bgpConfig}</p></div>}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {link.routingType && <div className="bg-muted/50 rounded-lg p-2.5"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Routing</p><p className="text-xs font-semibold capitalize">{link.routingType}</p></div>}
                                  {link.networkInterface && <div className="bg-muted/50 rounded-lg p-2.5"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Interface</p><p className="text-xs font-mono">{link.networkInterface}</p></div>}
                                  {link.portDetails && <div className="bg-muted/50 rounded-lg p-2.5"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Port / Slot</p><p className="text-xs font-mono">{link.portDetails}</p></div>}
                                  {link.gateway && <div className="bg-muted/50 rounded-lg p-2.5"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Gateway</p><p className="text-xs font-mono">{link.gateway}</p></div>}
                                  {link.dnsServers && <div className="bg-muted/50 rounded-lg p-2.5"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">DNS</p><p className="text-xs font-mono">{link.dnsServers}</p></div>}
                                  {link.asNumber && <div className="bg-muted/50 rounded-lg p-2.5"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">ASN</p><p className="text-xs font-mono font-semibold">{link.asNumber}</p></div>}
                                  {link.bgpConfig && <div className="bg-muted/50 rounded-lg p-2.5 col-span-2"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">BGP Config</p><p className="text-xs font-mono break-all">{link.bgpConfig}</p></div>}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wifi className="h-4 w-4 text-primary" />Service Summary</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-muted/50 rounded-lg p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Contracted BW</p><p className="text-sm font-semibold">{vendor.totalBandwidth || `${totalMbps} Mbps`}</p></div>
                      <div className="bg-muted/50 rounded-lg p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Used Bandwidth</p><p className="text-sm font-semibold">{vendor.usedBandwidth || "—"}</p></div>
                      <div className="bg-muted/50 rounded-lg p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Billing Cost</p><p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{formatPKR(vendor.bandwidthCost)}</p></div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex items-center gap-2 mb-1.5"><div className="p-1.5 rounded-md bg-cyan-100 dark:bg-cyan-950"><Globe className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Links</p></div>
                      <p className="text-2xl font-bold">{panelLinks.length}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{panelLinks.filter(l => l.status === "active").length} active</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex items-center gap-2 mb-1.5"><div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-950"><Wallet className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Panel Balance</p></div>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatPKR(panelLinks.reduce((s, pl) => s + Number(pl.walletBalance || 0), 0))}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex items-center gap-2 mb-1.5"><div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-950"><DollarSign className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly Fees</p></div>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatPKR(panelLinks.reduce((s, pl) => s + Number(pl.monthlyFee || 0), 0))}</p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" />Panel Links ({panelLinks.length})</CardTitle>
                      <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={openAddPl} data-testid="button-add-panel-link"><Plus className="h-3.5 w-3.5" />Add Link</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {panelLinks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No panel links added yet</p>
                        <p className="text-xs mt-1">Add panel links to track multiple panel connections</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Panel Name</TableHead>
                              <TableHead className="text-xs">URL</TableHead>
                              <TableHead className="text-xs">Username</TableHead>
                              <TableHead className="text-xs">City</TableHead>
                              <TableHead className="text-xs">Wallet Balance</TableHead>
                              <TableHead className="text-xs">Monthly Fee</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                              <TableHead className="w-20"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {panelLinks.map(pl => (
                              <TableRow key={pl.id} data-testid={`row-panel-link-${pl.id}`}>
                                <TableCell className="text-sm font-medium">{pl.panelName}</TableCell>
                                <TableCell className="text-xs max-w-[160px]">
                                  {pl.panelUrl ? (
                                    <a href={pl.panelUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 truncate">
                                      <span className="truncate">{pl.panelUrl}</span><ExternalLink className="h-3 w-3 shrink-0" />
                                    </a>
                                  ) : "—"}
                                </TableCell>
                                <TableCell className="font-mono text-xs">{pl.panelUsername || "—"}</TableCell>
                                <TableCell className="text-xs">{pl.city || "—"}</TableCell>
                                <TableCell className={`text-sm font-bold ${Number(pl.walletBalance) >= 0 ? "text-purple-600 dark:text-purple-400" : "text-red-600 dark:text-red-400"}`}>{formatPKR(pl.walletBalance)}</TableCell>
                                <TableCell className="text-sm">{formatPKR(pl.monthlyFee)}</TableCell>
                                <TableCell><Badge variant={pl.status === "active" ? "default" : "secondary"} className="text-[10px] no-default-active-elevate capitalize">{pl.status}</Badge></TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEditPl(pl)} data-testid={`button-edit-panel-link-${pl.id}`}><Edit className="h-3.5 w-3.5" /></Button>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-600" onClick={() => setPlDeleteId(pl.id)} data-testid={`button-delete-panel-link-${pl.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    {panelLinks.some(pl => pl.notes) && (
                      <div className="mt-3 space-y-2 pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground">Notes:</p>
                        {panelLinks.filter(pl => pl.notes).map(pl => (
                          <div key={pl.id} className="text-xs bg-muted/40 rounded p-2.5"><span className="font-medium">{pl.panelName}:</span> {pl.notes}</div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" />Vendor Wallet Summary</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center bg-purple-50 dark:bg-purple-950/40 rounded-lg p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Vendor Balance</p><p className={`text-xl font-bold ${walletBalance >= 0 ? "text-purple-600 dark:text-purple-400" : "text-red-600 dark:text-red-400"}`}>{formatPKR(walletBalance)}</p></div>
                      <div className="text-center bg-green-50 dark:bg-green-950/40 rounded-lg p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total In</p><p className="text-xl font-bold text-green-600 dark:text-green-400">{formatPKR(totalRecharged)}</p></div>
                      <div className="text-center bg-red-50 dark:bg-red-950/40 rounded-lg p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Out</p><p className="text-xl font-bold text-red-600 dark:text-red-400">{formatPKR(totalDebited)}</p></div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ─── PACKAGES (panel only) ─── */}
          {vendorType === "panel" && (
            <TabsContent value="packages" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4 text-primary" />Packages ({pkgs.length})</CardTitle>
                    <div className="flex items-center gap-2">
                      {pkgs.length > 0 && (
                        <Badge variant="secondary" className="no-default-active-elevate text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950">
                          Avg Margin: {formatPKR(pkgs.reduce((s, p) => s + Number(p.ispSellingPrice || 0) - Number(p.vendorPrice || 0), 0) / pkgs.length)}
                        </Badge>
                      )}
                      <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={openAddPkg} data-testid="button-profile-add-package"><Plus className="h-3.5 w-3.5" />Add Package</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {pkgs.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No packages assigned to this vendor</p>
                      <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={openAddPkg} data-testid="button-profile-add-first-package"><Plus className="h-3.5 w-3.5" />Add First Package</Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Package Name</TableHead>
                            <TableHead className="text-xs">Panel Link</TableHead>
                            <TableHead className="text-xs">Speed</TableHead>
                            <TableHead className="text-xs">Vendor Price</TableHead>
                            <TableHead className="text-xs">ISP Price</TableHead>
                            <TableHead className="text-xs">Reseller Price</TableHead>
                            <TableHead className="text-xs">Data Limit</TableHead>
                            <TableHead className="text-xs">Validity</TableHead>
                            <TableHead className="text-xs">Margin</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pkgs.map(pkg => {
                            const margin = Number(pkg.ispSellingPrice || 0) - Number(pkg.vendorPrice || 0);
                            const linkedPanel = pkg.panelLinkId ? panelLinks.find(pl => pl.id === pkg.panelLinkId) : null;
                            return (
                              <TableRow key={pkg.id} data-testid={`row-pkg-${pkg.id}`}>
                                <TableCell className="text-sm font-medium">{pkg.packageName}</TableCell>
                                <TableCell className="text-sm">
                                  {linkedPanel ? (
                                    <div className="flex flex-col"><span className="font-medium text-xs">{linkedPanel.panelName}</span>{linkedPanel.city && <span className="text-[10px] text-muted-foreground">{linkedPanel.city}</span>}</div>
                                  ) : <span className="text-muted-foreground">—</span>}
                                </TableCell>
                                <TableCell className="text-sm">{pkg.speed || "—"}</TableCell>
                                <TableCell className="text-sm">{formatPKR(pkg.vendorPrice)}</TableCell>
                                <TableCell className="text-sm">{formatPKR(pkg.ispSellingPrice)}</TableCell>
                                <TableCell className="text-sm">{pkg.resellerPrice ? formatPKR(pkg.resellerPrice) : "—"}</TableCell>
                                <TableCell className="text-sm">{pkg.dataLimit || "Unlimited"}</TableCell>
                                <TableCell className="text-sm">{pkg.validity || "—"}</TableCell>
                                <TableCell className={`text-sm font-semibold ${margin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{formatPKR(margin)}</TableCell>
                                <TableCell><Badge variant={pkg.isActive !== false ? "default" : "secondary"} className="text-[10px] no-default-active-elevate capitalize">{pkg.isActive !== false ? "Active" : "Inactive"}</Badge></TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEditPkg(pkg)} data-testid={`button-edit-pkg-${pkg.id}`}><Edit className="h-3.5 w-3.5" /></Button>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-600" onClick={() => handleDeletePkg(pkg.id, pkg.packageName)} data-testid={`button-delete-pkg-${pkg.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                                  </div>
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
            </TabsContent>
          )}

          {/* ─── FINANCIAL ─── */}
          <TabsContent value="financial" className="space-y-4 mt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-950"><Wallet className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Wallet Balance</p></div>
                  <p className={`text-xl font-bold ${walletBalance >= 0 ? "text-purple-600 dark:text-purple-400" : "text-red-600 dark:text-red-400"}`}>{formatPKR(walletBalance)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950"><ArrowDownLeft className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Recharged</p></div>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatPKR(totalRecharged)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-md bg-red-100 dark:bg-red-950"><ArrowUpRight className="h-3.5 w-3.5 text-red-600 dark:text-red-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Debited</p></div>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatPKR(totalDebited)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-950"><DollarSign className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Payable Amount</p></div>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{formatPKR(vendor.payableAmount)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-yellow-100 dark:bg-yellow-950"><FileText className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" /></div>
                    Contract Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/50 rounded-lg p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Contract Type</p><p className="text-sm font-semibold capitalize">{vendor.contractType || "—"}</p></div>
                    <div className="bg-muted/50 rounded-lg p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">SLA Level</p><p className={`text-sm font-semibold capitalize ${vendor.slaLevel === "enterprise" ? "text-purple-600 dark:text-purple-400" : vendor.slaLevel === "premium" ? "text-blue-600 dark:text-blue-400" : ""}`}>{vendor.slaLevel || "Standard"}</p></div>
                    <div className="bg-muted/50 rounded-lg p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Start Date</p><p className="text-sm font-medium">{vendor.contractStartDate || "—"}</p></div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">End Date</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        <p className="text-sm font-medium">{vendor.contractEndDate || "—"}</p>
                        {contractDiff !== null && (
                          contractDiff < 0
                            ? <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-950">Expired</Badge>
                            : contractDiff <= 30
                              ? <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-950">{contractDiff}d left</Badge>
                              : <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-green-600 bg-green-50 dark:text-green-300 dark:bg-green-950">{contractDiff}d left</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Payment Terms</p><p className="text-sm font-semibold">{vendor.paymentTerms === "net30" ? "Net 30 Days" : vendor.paymentTerms === "net15" ? "Net 15 Days" : vendor.paymentTerms === "net45" ? "Net 45 Days" : vendor.paymentTerms === "advance" ? "Advance Payment" : vendor.paymentTerms === "on_delivery" ? "On Delivery" : vendor.paymentTerms || "—"}</p></div>
                  {vendor.autoRenewal && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-2.5">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
                      <p className="text-xs text-green-700 dark:text-green-300 font-medium">Auto-Renewal Enabled</p>
                    </div>
                  )}
                  {vendor.penaltyClause && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">Penalty / SLA Notes</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">{vendor.penaltyClause}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10"><History className="h-3.5 w-3.5 text-primary" /></div>
                    Transaction Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-muted/50 rounded-lg p-3 text-center"><p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Transactions</p><p className="text-2xl font-bold">{transactions.length}</p></div>
                    <div className="bg-green-50 dark:bg-green-950/40 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Payments In</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{transactions.filter(t => t.type === "recharge" || t.type === "credit").length}</p>
                      <p className="text-[10px] text-green-600 dark:text-green-400">{formatPKR(totalRecharged)}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/40 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Deductions</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{transactions.filter(t => t.type === "debit" || t.type === "deduct").length}</p>
                      <p className="text-[10px] text-red-600 dark:text-red-400">{formatPKR(totalDebited - totalOutstanding)}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950/40 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Outstanding</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{transactions.filter(t => t.type === "outstanding").length}</p>
                      <p className="text-[10px] text-orange-600 dark:text-orange-400">{formatPKR(totalOutstanding)}</p>
                    </div>
                  </div>
                  {vendorType === "bandwidth" && (
                    <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Monthly Cost (All Links)</p>
                      <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatPKR(totalMonthlyCost)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {vendorType === "bandwidth" && bwLinks.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Monthly Cost Breakdown by Link</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Link Name</TableHead>
                          <TableHead className="text-xs">Mbps</TableHead>
                          <TableHead className="text-xs">Rate/Mbps</TableHead>
                          <TableHead className="text-xs">Monthly Cost</TableHead>
                          <TableHead className="text-xs">% of Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bwLinks.map(link => {
                          const cost = Number(link.totalMonthlyCost || 0);
                          const pct = totalMonthlyCost > 0 ? ((cost / totalMonthlyCost) * 100).toFixed(1) : "0";
                          return (
                            <TableRow key={link.id}>
                              <TableCell className="text-sm font-medium">{link.linkName}</TableCell>
                              <TableCell className="text-sm">{link.bandwidthMbps}</TableCell>
                              <TableCell className="text-sm">{formatPKR(link.bandwidthRate)}</TableCell>
                              <TableCell className="text-sm font-bold">{formatPKR(cost)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-20 bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} /></div>
                                  <span className="text-xs text-muted-foreground">{pct}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {bwLinks.length > 1 && (
                          <TableRow className="bg-muted/60 font-bold">
                            <TableCell className="text-xs font-bold">TOTAL</TableCell>
                            <TableCell className="text-xs font-bold">{totalMbps} Mbps</TableCell>
                            <TableCell />
                            <TableCell className="text-sm font-bold">{formatPKR(totalMonthlyCost)}</TableCell>
                            <TableCell className="text-xs font-bold">100%</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ─── BANKING ─── */}
          <TabsContent value="banking" className="space-y-4 mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10"><Landmark className="h-3.5 w-3.5 text-primary" /></div>
                  Bank Account Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!(vendor.bankName || vendor.bankAccountNumber || vendor.bankAccountTitle) ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Landmark className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No banking details on file</p>
                    <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={openEditVendor} data-testid="button-add-banking-details"><Edit className="h-3.5 w-3.5" />Add Banking Details</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {vendor.bankName && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0"><Landmark className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
                          <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bank Name</p><p className="text-sm font-bold">{vendor.bankName}</p></div>
                        </div>
                      )}
                      {vendor.bankAccountTitle && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0"><User className="h-5 w-5 text-muted-foreground" /></div>
                          <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Account Title</p><p className="text-sm font-bold">{vendor.bankAccountTitle}</p></div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {vendor.bankAccountNumber && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Account Number</p>
                          <p className="text-base font-mono font-bold tracking-wider">{vendor.bankAccountNumber}</p>
                        </div>
                      )}
                      {vendor.bankBranchCode && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Branch Code</p>
                          <p className="text-base font-mono font-bold">{vendor.bankBranchCode}</p>
                        </div>
                      )}
                      {vendor.ntn && (
                        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 rounded-lg p-3">
                          <p className="text-[10px] text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">NTN / Tax ID</p>
                          <p className="text-base font-mono font-bold text-amber-700 dark:text-amber-300">{vendor.ntn}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="bg-muted/30 rounded-xl p-4 border border-muted flex items-start gap-3">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium">Sensitive Information</p>
                <p className="text-xs text-muted-foreground mt-0.5">Banking details are stored securely. To update banking information, use the Edit Profile action.</p>
              </div>
            </div>
          </TabsContent>

          {/* ─── TRANSACTIONS ─── */}
          <TabsContent value="transactions" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4 text-primary" />Transaction History ({transactions.length})</CardTitle>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><ArrowDownLeft className="h-3.5 w-3.5" />In: {formatPKR(totalRecharged)}</span>
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><ArrowUpRight className="h-3.5 w-3.5" />Out: {formatPKR(totalDebited)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No transactions yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Date & Time</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs">Amount</TableHead>
                          <TableHead className="text-xs">Balance After</TableHead>
                          <TableHead className="text-xs">Method</TableHead>
                          <TableHead className="text-xs">Reference</TableHead>
                          <TableHead className="text-xs">By</TableHead>
                          <TableHead className="text-xs">Notes</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map(txn => {
                          const isIn = txn.type === "recharge" || txn.type === "credit";
                          const isOutstanding = txn.type === "outstanding";
                          return (
                            <TableRow key={txn.id} className={isIn ? "bg-green-50/30 dark:bg-green-950/10" : isOutstanding ? "bg-orange-50/40 dark:bg-orange-950/10" : "bg-red-50/30 dark:bg-red-950/10"}>
                              <TableCell className="text-xs whitespace-nowrap">{txn.createdAt ? new Date(txn.createdAt).toLocaleString() : "—"}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${isIn ? "text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950" : isOutstanding ? "text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950" : "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950"}`}>
                                  {isIn ? <ArrowDownLeft className="h-3 w-3 mr-0.5 inline" /> : isOutstanding ? <FileWarning className="h-3 w-3 mr-0.5 inline" /> : <ArrowUpRight className="h-3 w-3 mr-0.5 inline" />}
                                  {isOutstanding ? "Outstanding" : txn.type}
                                </Badge>
                              </TableCell>
                              <TableCell className={`text-sm font-bold ${isIn ? "text-green-600 dark:text-green-400" : isOutstanding ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"}`}>{isIn ? "+" : "-"}{formatPKR(txn.amount)}</TableCell>
                              <TableCell className="text-sm">{formatPKR(txn.balanceAfter)}</TableCell>
                              <TableCell className="text-xs capitalize">{txn.paymentMethod?.replace(/_/g, " ") || txn.reason || "—"}</TableCell>
                              <TableCell className="text-xs font-mono">{txn.reference || "—"}</TableCell>
                              <TableCell className="text-xs">{txn.performedBy || "—"}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{txn.description || txn.notes || "—"}</TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400 hover:text-red-600" onClick={() => handleDeleteTransaction(txn.id)} data-testid={`button-delete-txn-${txn.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
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
          </TabsContent>
        </div>
      </Tabs>

      {/* ─── Inline Send Payment / Recharge Dialog ─── */}
      <Dialog open={rechargeOpen} onOpenChange={open => { if (!open) setRechargeOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
              {vendorType === "panel" ? "Recharge Wallet" : "Record Payment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-muted/40 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Current Balance</p>
                <p className={`text-xl font-bold ${walletBalance < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{formatPKR(walletBalance)}</p>
              </div>
              {rechargeForm.amount && !isNaN(parseFloat(rechargeForm.amount)) && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Balance After</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatPKR(walletBalance + parseFloat(rechargeForm.amount))}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Amount (PKR) <span className="text-red-500">*</span></label>
                <Input type="number" placeholder="0.00" value={rechargeForm.amount} onChange={e => setRechargeForm(f => ({ ...f, amount: e.target.value }))} data-testid="input-recharge-amount" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Payment Method</label>
                <Select value={rechargeForm.paymentMethod} onValueChange={v => setRechargeForm(f => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger data-testid="select-recharge-method"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Status</label>
                <Select value={rechargeForm.paymentStatus} onValueChange={v => setRechargeForm(f => ({ ...f, paymentStatus: v }))}>
                  <SelectTrigger data-testid="select-recharge-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="credit_balance">Credit Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Reference / Voucher No.</label>
                <Input placeholder="e.g. TXN-12345" value={rechargeForm.reference} onChange={e => setRechargeForm(f => ({ ...f, reference: e.target.value }))} data-testid="input-recharge-reference" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Performed By</label>
                <Input placeholder="Admin" value={rechargeForm.performedBy} onChange={e => setRechargeForm(f => ({ ...f, performedBy: e.target.value }))} data-testid="input-recharge-by" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Notes</label>
                <Input placeholder="Optional payment notes" value={rechargeForm.notes} onChange={e => setRechargeForm(f => ({ ...f, notes: e.target.value }))} data-testid="input-recharge-notes" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setRechargeOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleRechargeSubmit} disabled={rechargeSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="button-recharge-submit">
              {rechargeSubmitting ? "Saving..." : vendorType === "panel" ? "Recharge Wallet" : "Record Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Deduct Balance Dialog ─── */}
      <Dialog open={deductOpen} onOpenChange={open => { if (!open) setDeductOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-orange-600" />
              Deduct Balance
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-muted/40 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Current Balance</p>
                <p className={`text-xl font-bold ${walletBalance < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{formatPKR(walletBalance)}</p>
              </div>
              {deductForm.amount && !isNaN(parseFloat(deductForm.amount)) && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Balance After</p>
                  <p className={`text-xl font-bold ${walletBalance - parseFloat(deductForm.amount) < 0 ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`}>{formatPKR(walletBalance - parseFloat(deductForm.amount))}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Amount (PKR) <span className="text-red-500">*</span></label>
                <Input type="number" placeholder="0.00" value={deductForm.amount} onChange={e => setDeductForm(f => ({ ...f, amount: e.target.value }))} data-testid="input-deduct-amount" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Reason</label>
                <Input placeholder="e.g. Bill payment, adjustment" value={deductForm.reason} onChange={e => setDeductForm(f => ({ ...f, reason: e.target.value }))} data-testid="input-deduct-reason" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Reference No.</label>
                <Input placeholder="e.g. BILL-001" value={deductForm.reference} onChange={e => setDeductForm(f => ({ ...f, reference: e.target.value }))} data-testid="input-deduct-reference" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Performed By</label>
                <Input placeholder="Admin" value={deductForm.performedBy} onChange={e => setDeductForm(f => ({ ...f, performedBy: e.target.value }))} data-testid="input-deduct-by" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Notes</label>
                <Input placeholder="Optional notes" value={deductForm.notes} onChange={e => setDeductForm(f => ({ ...f, notes: e.target.value }))} data-testid="input-deduct-notes" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setDeductOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleDeductSubmit} disabled={deductSubmitting} className="bg-orange-600 hover:bg-orange-700 text-white" data-testid="button-deduct-submit">
              {deductSubmitting ? "Deducting..." : "Deduct Balance"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Vendor Confirmation Dialog ─── */}
      <Dialog open={deleteVendorOpen} onOpenChange={setDeleteVendorOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />Delete Vendor
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <p className="text-sm text-muted-foreground">You are about to permanently delete <span className="font-semibold text-foreground">{vendor?.name}</span> and all associated data (links, packages, transactions). This cannot be undone.</p>
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg p-3 text-xs text-red-700 dark:text-red-400">
              All BW links, panel links, packages, and wallet transactions for this vendor will be deleted.
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteVendorOpen(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteVendor} disabled={deleteVendorSubmitting} data-testid="button-confirm-delete-vendor">
              {deleteVendorSubmitting ? "Deleting..." : "Yes, Delete Vendor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Generate Monthly Bill Dialog ─── */}
      <Dialog open={generateBillOpen} onOpenChange={setGenerateBillOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />Generate Monthly Bill
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl p-4">
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">Active BW Links</p>
              {bwLinks.filter(l => l.status === "active").map(l => (
                <div key={l.id} className="flex justify-between items-center text-xs text-blue-600 dark:text-blue-400 py-0.5">
                  <span>{l.linkName}</span>
                  <span className="font-bold">{formatPKR(l.totalMonthlyCost)}</span>
                </div>
              ))}
              <div className="border-t border-blue-200 dark:border-blue-800 mt-2 pt-2 flex justify-between font-bold text-sm text-blue-700 dark:text-blue-300">
                <span>Total Outstanding</span>
                <span>{formatPKR(bwLinks.filter(l => l.status === "active").reduce((s, l) => s + Number(l.totalMonthlyCost || 0), 0))}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Billing Period <span className="text-red-500">*</span></label>
              <Input placeholder="e.g. April 2026" value={generateBillForm.period} onChange={e => setGenerateBillForm(f => ({ ...f, period: e.target.value }))} data-testid="input-generate-bill-period" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Input placeholder="e.g. Monthly bill for April 2026" value={generateBillForm.notes} onChange={e => setGenerateBillForm(f => ({ ...f, notes: e.target.value }))} data-testid="input-generate-bill-notes" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setGenerateBillOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleGenerateBill} data-testid="button-confirm-generate-bill" className="bg-blue-600 hover:bg-blue-700 text-white">
              Generate Bills
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Panel Link Dialog */}
      <Dialog open={plDialogOpen} onOpenChange={setPlDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              {editingPl ? "Edit Panel Link" : "Add Panel Link"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm font-medium">Panel Name <span className="text-red-500">*</span></label>
                <Input
                  placeholder="e.g. Main Panel, City A Panel"
                  value={plForm.panelName}
                  onChange={e => setPlForm(p => ({ ...p, panelName: e.target.value }))}
                  className="mt-1"
                  data-testid="input-panel-link-name"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Panel URL</label>
                <Input
                  placeholder="https://panel.example.com"
                  value={plForm.panelUrl}
                  onChange={e => setPlForm(p => ({ ...p, panelUrl: e.target.value }))}
                  className="mt-1"
                  data-testid="input-panel-link-url"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Panel Username</label>
                <Input
                  placeholder="admin"
                  value={plForm.panelUsername}
                  onChange={e => setPlForm(p => ({ ...p, panelUsername: e.target.value }))}
                  className="mt-1"
                  data-testid="input-panel-link-username"
                />
              </div>
              <div>
                <label className="text-sm font-medium">City</label>
                <Input
                  placeholder="Karachi"
                  value={plForm.city}
                  onChange={e => setPlForm(p => ({ ...p, city: e.target.value }))}
                  className="mt-1"
                  data-testid="input-panel-link-city"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Wallet Balance (PKR)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={plForm.walletBalance}
                  onChange={e => setPlForm(p => ({ ...p, walletBalance: e.target.value }))}
                  className="mt-1"
                  data-testid="input-panel-link-wallet"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Monthly Fee (PKR)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={plForm.monthlyFee}
                  onChange={e => setPlForm(p => ({ ...p, monthlyFee: e.target.value }))}
                  className="mt-1"
                  data-testid="input-panel-link-monthly-fee"
                />
              </div>
              <div className="col-span-2 pt-2 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Network Infrastructure</p>
              </div>
              <div>
                <label className="text-sm font-medium">Service Type</label>
                <Select value={plForm.serviceType} onValueChange={v => setPlForm(p => ({ ...p, serviceType: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-panel-link-service-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fiber">Fiber</SelectItem>
                    <SelectItem value="exchange">Exchange</SelectItem>
                    <SelectItem value="tower">Tower</SelectItem>
                    <SelectItem value="wireless_p2p">Wireless P2P</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">POP Location</label>
                <Input
                  placeholder="e.g. DHA POP-01"
                  value={plForm.popLocation}
                  onChange={e => setPlForm(p => ({ ...p, popLocation: e.target.value }))}
                  className="mt-1"
                  data-testid="input-panel-link-pop"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Interface Type</label>
                <Input
                  placeholder="e.g. GigabitEthernet"
                  value={plForm.networkInterface}
                  onChange={e => setPlForm(p => ({ ...p, networkInterface: e.target.value }))}
                  className="mt-1"
                  data-testid="input-panel-link-interface"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Port / Slot</label>
                <Input
                  placeholder="e.g. Port 1, Slot 2"
                  value={plForm.portDetails}
                  onChange={e => setPlForm(p => ({ ...p, portDetails: e.target.value }))}
                  className="mt-1"
                  data-testid="input-panel-link-port"
                />
              </div>
              <div className="col-span-2 pt-2 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status & Notes</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={plForm.status} onValueChange={v => setPlForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="mt-1" data-testid="select-panel-link-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Optional notes about this panel link..."
                  value={plForm.notes}
                  onChange={e => setPlForm(p => ({ ...p, notes: e.target.value }))}
                  className="mt-1 resize-none"
                  rows={2}
                  data-testid="input-panel-link-notes"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setPlDialogOpen(false)} data-testid="button-cancel-panel-link">Cancel</Button>
              <Button
                onClick={submitPlForm}
                disabled={!plForm.panelName.trim() || createPlMutation.isPending || updatePlMutation.isPending}
                data-testid="button-save-panel-link"
              >
                {(createPlMutation.isPending || updatePlMutation.isPending) ? "Saving..." : editingPl ? "Save Changes" : "Add Link"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={plDeleteId !== null} onOpenChange={open => { if (!open) setPlDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Panel Link</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this panel link? This action cannot be undone.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPlDeleteId(null)} data-testid="button-cancel-delete-panel-link">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => { if (plDeleteId !== null) deletePlMutation.mutate(plDeleteId); }}
              disabled={deletePlMutation.isPending}
              data-testid="button-confirm-delete-panel-link"
            >
              {deletePlMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Package Dialog */}
      <Dialog open={addPkgOpen} onOpenChange={open => { if (!open) { setAddPkgOpen(false); setAddPkgForm(emptyAddPkgForm); setEditingPkg(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />{editingPkg ? "Edit Package" : "Add Package"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {/* Vendor — locked */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Vendor</label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/50 text-sm">
                <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium">{vendor?.name}</span>
                <Badge variant="secondary" className="ml-auto text-[10px] capitalize no-default-active-elevate">{vendor?.vendorType}</Badge>
              </div>
            </div>

            {/* Panel Link */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Link with Panel <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Select
                value={addPkgForm.panelLinkId}
                onValueChange={v => setAddPkgForm(f => ({ ...f, panelLinkId: v === "__none__" ? "" : v }))}
              >
                <SelectTrigger data-testid="select-addpkg-panel-link">
                  <SelectValue placeholder="Select a panel link…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {panelLinks.map(pl => (
                    <SelectItem key={pl.id} value={String(pl.id)}>
                      <div className="flex flex-col">
                        <span className="font-medium">{pl.panelName}</span>
                        {(pl.panelUrl || pl.city) && (
                          <span className="text-[11px] text-muted-foreground">
                            {[pl.panelUrl, pl.city].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {panelLinks.length === 0 && (
                <p className="text-[11px] text-muted-foreground">No panel links configured for this vendor yet.</p>
              )}
            </div>

            {/* Package Name */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Package Name <span className="text-destructive">*</span></label>
              <Input
                placeholder="e.g. 10 Mbps Unlimited"
                value={addPkgForm.packageName}
                onChange={e => setAddPkgForm(f => ({ ...f, packageName: e.target.value }))}
                data-testid="input-addpkg-name"
              />
            </div>

            {/* Speed & Data Limit row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Speed</label>
                <Input
                  placeholder="e.g. 10 Mbps"
                  value={addPkgForm.speed}
                  onChange={e => setAddPkgForm(f => ({ ...f, speed: e.target.value }))}
                  data-testid="input-addpkg-speed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Data Limit</label>
                <Input
                  placeholder="e.g. Unlimited / 100 GB"
                  value={addPkgForm.dataLimit}
                  onChange={e => setAddPkgForm(f => ({ ...f, dataLimit: e.target.value }))}
                  data-testid="input-addpkg-data-limit"
                />
              </div>
            </div>

            {/* Prices row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Vendor Price <span className="text-destructive">*</span></label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={addPkgForm.vendorPrice}
                  onChange={e => setAddPkgForm(f => ({ ...f, vendorPrice: e.target.value }))}
                  data-testid="input-addpkg-vendor-price"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">ISP Price <span className="text-destructive">*</span></label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={addPkgForm.ispSellingPrice}
                  onChange={e => setAddPkgForm(f => ({ ...f, ispSellingPrice: e.target.value }))}
                  data-testid="input-addpkg-isp-price"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Reseller Price</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={addPkgForm.resellerPrice}
                  onChange={e => setAddPkgForm(f => ({ ...f, resellerPrice: e.target.value }))}
                  data-testid="input-addpkg-reseller-price"
                />
              </div>
            </div>

            {/* Margin preview */}
            {addPkgForm.ispSellingPrice && addPkgForm.vendorPrice && (
              <div className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 ${Number(addPkgForm.ispSellingPrice) - Number(addPkgForm.vendorPrice) >= 0 ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"}`}>
                ISP Margin: {formatPKR(Number(addPkgForm.ispSellingPrice) - Number(addPkgForm.vendorPrice))}
              </div>
            )}

            {/* Validity & Status row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Validity</label>
                <Input
                  placeholder="e.g. 30 days"
                  value={addPkgForm.validity}
                  onChange={e => setAddPkgForm(f => ({ ...f, validity: e.target.value }))}
                  data-testid="input-addpkg-validity"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={addPkgForm.isActive ? "active" : "inactive"}
                  onValueChange={v => setAddPkgForm(f => ({ ...f, isActive: v === "active" }))}
                >
                  <SelectTrigger data-testid="select-addpkg-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={() => { setAddPkgOpen(false); setAddPkgForm(emptyAddPkgForm); }} data-testid="button-addpkg-cancel">
                Cancel
              </Button>
              <Button onClick={submitAddPkg} disabled={addPkgSubmitting} data-testid="button-addpkg-submit">
                {addPkgSubmitting ? "Saving…" : editingPkg ? "Update Package" : "Add Package"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      {editVendorForm && (
        <Dialog open={editVendorOpen} onOpenChange={open => { if (!open) { setEditVendorOpen(false); setEditVendorForm(null); } }}>
          <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden p-0 gap-0">
            {/* Hero Header */}
            <div className="rounded-t-lg px-5 py-4 shrink-0 border-b">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold shrink-0 border-2 border-primary/20">
                  {editVendorForm.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold truncate">{editVendorForm.name}</h2>
                    <Badge variant="secondary" className="text-[10px]">
                      {vendorType === "panel" ? "Panel Vendor" : "Bandwidth Vendor"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs mt-0.5">Edit vendor profile — update details across tabs and save</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => { setEditVendorOpen(false); setEditVendorForm(null); }} data-testid="button-editvendor-cancel">Cancel</Button>
                  <Button size="sm" className="font-semibold h-8 px-3 text-xs" onClick={submitEditVendor} disabled={editVendorSubmitting} data-testid="button-editvendor-submit">
                    {editVendorSubmitting ? "Saving…" : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
            {/* Tabbed body */}
            <Tabs defaultValue="vendorinfo" className="flex flex-col overflow-hidden" style={{ maxHeight: "calc(92vh - 80px)" }}>
              <div className="border-b bg-muted/30 px-4 shrink-0">
                <TabsList className="h-auto py-0 bg-transparent gap-0 rounded-none">
                  <TabsTrigger value="vendorinfo" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 gap-1.5 px-3"><User className="h-3.5 w-3.5" />Vendor Info</TabsTrigger>
                  {vendorType === "panel" && <TabsTrigger value="panelinfo" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 gap-1.5 px-3"><Globe className="h-3.5 w-3.5" />Panel Info</TabsTrigger>}
                  {vendorType === "bandwidth" && <TabsTrigger value="bwinfo" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 gap-1.5 px-3"><Network className="h-3.5 w-3.5" />Bandwidth</TabsTrigger>}
                  <TabsTrigger value="packages" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 gap-1.5 px-3"><Package className="h-3.5 w-3.5" />Packages</TabsTrigger>
                  <TabsTrigger value="business" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 gap-1.5 px-3"><Building2 className="h-3.5 w-3.5" />Business & Contract</TabsTrigger>
                  <TabsTrigger value="banking" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 gap-1.5 px-3"><CreditCard className="h-3.5 w-3.5" />Banking</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 overflow-y-auto">
                {/* Vendor Info */}
                <TabsContent value="vendorinfo" className="p-5 space-y-4 mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-sm font-medium">Vendor Name <span className="text-destructive">*</span></label>
                      <Input value={editVendorForm.name} onChange={e => setEditVendorForm(f => f ? { ...f, name: e.target.value } : f)} data-testid="input-editvendor-name" placeholder="Vendor name" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Contact Person</label>
                      <Input value={editVendorForm.contactPerson} onChange={e => setEditVendorForm(f => f ? { ...f, contactPerson: e.target.value } : f)} data-testid="input-editvendor-contact" placeholder="Contact person" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Phone <span className="text-destructive">*</span></label>
                      <Input value={editVendorForm.phone} onChange={e => setEditVendorForm(f => f ? { ...f, phone: e.target.value } : f)} data-testid="input-editvendor-phone" placeholder="Phone number" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Email</label>
                      <Input type="email" value={editVendorForm.email} onChange={e => setEditVendorForm(f => f ? { ...f, email: e.target.value } : f)} data-testid="input-editvendor-email" placeholder="Email address" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">City</label>
                      <Input value={editVendorForm.city} onChange={e => setEditVendorForm(f => f ? { ...f, city: e.target.value } : f)} data-testid="input-editvendor-city" placeholder="City" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-sm font-medium">Address</label>
                      <Input value={editVendorForm.address} onChange={e => setEditVendorForm(f => f ? { ...f, address: e.target.value } : f)} data-testid="input-editvendor-address" placeholder="Address" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={editVendorForm.status} onValueChange={v => setEditVendorForm(f => f ? { ...f, status: v } : f)}>
                        <SelectTrigger data-testid="select-editvendor-status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                {/* Panel Info */}
                {vendorType === "panel" && (
                  <TabsContent value="panelinfo" className="p-5 space-y-4 mt-0">
                    <div className="rounded-lg border border-dashed border-purple-300/50 dark:border-purple-700/50 p-4 bg-purple-50/50 dark:bg-purple-950/20">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-purple-500" />Panel credentials are used for automated recharge and balance queries.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Panel URL</label>
                        <Input value={editVendorForm.panelUrl} onChange={e => setEditVendorForm(f => f ? { ...f, panelUrl: e.target.value } : f)} data-testid="input-editvendor-panel-url" placeholder="e.g. panel.vendor.com" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Panel Username</label>
                        <Input value={editVendorForm.panelUsername} onChange={e => setEditVendorForm(f => f ? { ...f, panelUsername: e.target.value } : f)} data-testid="input-editvendor-panel-username" placeholder="Panel login username" />
                      </div>
                    </div>
                  </TabsContent>
                )}

                {/* Bandwidth Info */}
                {vendorType === "bandwidth" && (
                  <TabsContent value="bwinfo" className="p-5 space-y-4 mt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Total Bandwidth</label>
                        <Input value={editVendorForm.totalBandwidth} onChange={e => setEditVendorForm(f => f ? { ...f, totalBandwidth: e.target.value } : f)} data-testid="input-editvendor-total-bw" placeholder="e.g. 100 Mbps" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Used Bandwidth</label>
                        <Input value={editVendorForm.usedBandwidth} onChange={e => setEditVendorForm(f => f ? { ...f, usedBandwidth: e.target.value } : f)} data-testid="input-editvendor-used-bw" placeholder="e.g. 60 Mbps" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Monthly Cost (PKR)</label>
                        <Input type="number" min="0" value={editVendorForm.bandwidthCost} onChange={e => setEditVendorForm(f => f ? { ...f, bandwidthCost: e.target.value } : f)} data-testid="input-editvendor-bw-cost" />
                      </div>
                    </div>
                  </TabsContent>
                )}

                {/* Packages */}
                <TabsContent value="packages" className="p-5 mt-0">
                  {(() => {
                    const pkgs = (allPackages || []).filter(p => p.vendorId === vendor?.id);
                    return pkgs.length === 0 ? (
                      <div className="text-center py-8 border rounded-lg text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">No packages yet</p>
                        <p className="text-xs mt-1">Close this dialog and use "Add Package" on the profile page to add packages.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground mb-3">{pkgs.length} package(s) configured for this vendor. Manage packages from the profile page.</p>
                        {pkgs.map(pkg => (
                          <div key={pkg.id} data-testid={`row-profile-pkg-${pkg.id}`} className="flex items-center justify-between rounded-lg border px-4 py-3 gap-2">
                            <div>
                              <p className="text-sm font-medium">{pkg.packageName}</p>
                              <p className="text-xs text-muted-foreground">{pkg.speed || "N/A"} · {pkg.dataLimit || "N/A"} · {pkg.validity || "N/A"}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-muted-foreground">Vendor: <span className="font-semibold text-foreground">PKR {Number(pkg.vendorPrice).toLocaleString()}</span></p>
                              <p className="text-xs text-muted-foreground">ISP: <span className="font-semibold text-primary">PKR {Number(pkg.ispSellingPrice).toLocaleString()}</span></p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </TabsContent>

                {/* Business & Contract */}
                <TabsContent value="business" className="p-5 space-y-4 mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Service Type</label>
                      <Select value={editVendorForm.serviceType} onValueChange={v => setEditVendorForm(f => f ? { ...f, serviceType: v } : f)}>
                        <SelectTrigger data-testid="select-editvendor-service-type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fiber">Fiber</SelectItem>
                          <SelectItem value="wireless">Wireless</SelectItem>
                          <SelectItem value="cable">Cable</SelectItem>
                          <SelectItem value="satellite">Satellite</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">SLA Level</label>
                      <Select value={editVendorForm.slaLevel} onValueChange={v => setEditVendorForm(f => f ? { ...f, slaLevel: v } : f)}>
                        <SelectTrigger data-testid="select-editvendor-sla"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">NTN</label>
                      <Input value={editVendorForm.ntn} onChange={e => setEditVendorForm(f => f ? { ...f, ntn: e.target.value } : f)} data-testid="input-editvendor-ntn" placeholder="Tax number" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Contract Type</label>
                      <Select value={editVendorForm.contractType} onValueChange={v => setEditVendorForm(f => f ? { ...f, contractType: v } : f)}>
                        <SelectTrigger data-testid="select-editvendor-contract-type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Payment Terms</label>
                      <Select value={editVendorForm.paymentTerms} onValueChange={v => setEditVendorForm(f => f ? { ...f, paymentTerms: v } : f)}>
                        <SelectTrigger data-testid="select-editvendor-payment-terms"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="advance">Advance Payment</SelectItem>
                          <SelectItem value="net15">Net 15 Days</SelectItem>
                          <SelectItem value="net30">Net 30 Days</SelectItem>
                          <SelectItem value="net45">Net 45 Days</SelectItem>
                          <SelectItem value="on_delivery">On Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Contract Start</label>
                      <Input type="date" value={editVendorForm.contractStartDate} onChange={e => setEditVendorForm(f => f ? { ...f, contractStartDate: e.target.value } : f)} data-testid="input-editvendor-contract-start" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Contract End</label>
                      <Input type="date" value={editVendorForm.contractEndDate} onChange={e => setEditVendorForm(f => f ? { ...f, contractEndDate: e.target.value } : f)} data-testid="input-editvendor-contract-end" />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                        <Switch id="edit-auto-renewal" checked={editVendorForm.autoRenewal} onCheckedChange={v => setEditVendorForm(f => f ? { ...f, autoRenewal: v } : f)} data-testid="switch-editvendor-auto-renewal" />
                        <div>
                          <label htmlFor="edit-auto-renewal" className="text-sm font-medium cursor-pointer">Auto-Renewal</label>
                          <p className="text-xs text-muted-foreground">Automatically renew this contract when it expires</p>
                        </div>
                      </div>
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-sm font-medium">Penalty Clause / SLA Notes</label>
                      <Textarea value={editVendorForm.penaltyClause} onChange={e => setEditVendorForm(f => f ? { ...f, penaltyClause: e.target.value } : f)} data-testid="input-editvendor-penalty" placeholder="Penalty clauses, SLA breach notes..." rows={3} className="resize-none" />
                    </div>
                  </div>
                </TabsContent>

                {/* Banking */}
                <TabsContent value="banking" className="p-5 space-y-4 mt-0">
                  <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 bg-muted/20">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" />Banking details are used for payment processing and reconciliation.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Bank Name</label>
                      <Input value={editVendorForm.bankName} onChange={e => setEditVendorForm(f => f ? { ...f, bankName: e.target.value } : f)} data-testid="input-editvendor-bank-name" placeholder="Bank name" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Account Title</label>
                      <Input value={editVendorForm.bankAccountTitle} onChange={e => setEditVendorForm(f => f ? { ...f, bankAccountTitle: e.target.value } : f)} data-testid="input-editvendor-bank-title" placeholder="Account title" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Account Number</label>
                      <Input value={editVendorForm.bankAccountNumber} onChange={e => setEditVendorForm(f => f ? { ...f, bankAccountNumber: e.target.value } : f)} data-testid="input-editvendor-bank-number" placeholder="Account number" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Branch Code</label>
                      <Input value={editVendorForm.bankBranchCode} onChange={e => setEditVendorForm(f => f ? { ...f, bankBranchCode: e.target.value } : f)} data-testid="input-editvendor-bank-branch" placeholder="Branch code" />
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Add / Edit BW Link Dialog */}
      <Dialog open={bwLinkDialogOpen} onOpenChange={open => { if (!open) { setBwLinkDialogOpen(false); setEditingBwLink(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 gap-0">
          {/* Header */}
          <div className="vendor-page-header px-5 py-4 rounded-t-lg shrink-0 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
                {editingBwLink ? <Edit className="h-4 w-4 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              </div>
              <div>
                <h2 className="text-base font-bold">{editingBwLink ? "Edit Bandwidth Link" : "Add New Bandwidth Link"}</h2>
                <p className="text-muted-foreground text-xs">{editingBwLink ? `Editing: ${editingBwLink.linkName}` : "Fill in the link details across tabs"}</p>
              </div>
            </div>
          </div>

          {/* Wizard tabs */}
          <Tabs value={bwLinkFormTab} onValueChange={setBwLinkFormTab} className="flex flex-col flex-1 overflow-hidden">
            <div className="border-b bg-muted/20 shrink-0">
              <TabsList className="h-auto bg-transparent p-0 w-full justify-start rounded-none">
                {[
                  { v: "basic", label: "Basic Info", icon: <Network className="h-3.5 w-3.5" /> },
                  { v: "bandwidth", label: "Bandwidth & Cost", icon: <Zap className="h-3.5 w-3.5" /> },
                  { v: "connectivity", label: "Connectivity", icon: <Globe className="h-3.5 w-3.5" /> },
                  { v: "network", label: "Network & Infrastructure", icon: <Server className="h-3.5 w-3.5" /> },
                ].map(t => (
                  <TabsTrigger key={t.v} value={t.v} className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5 gap-1.5 px-4">
                    {t.icon}{t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="overflow-y-auto flex-1">
              {/* Basic Info */}
              <TabsContent value="basic" className="p-5 space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Link Name <span className="text-red-500">*</span></label>
                    <Input placeholder="e.g. Link-1 Fiber, Main-Lahore" value={bwLinkForm.linkName} onChange={e => setBwLinkForm(f => ({ ...f, linkName: e.target.value }))} data-testid="input-bwlink-name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input type="date" value={bwLinkForm.startDate} onChange={e => setBwLinkForm(f => ({ ...f, startDate: e.target.value }))} data-testid="input-bwlink-start-date" />
                  </div>
                  {bwLinkForm.serviceType === "dplc" ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-violet-700 dark:text-violet-400">From City / Location (Site A)</label>
                        <Input placeholder="e.g. Lahore – Corporate HQ" value={bwLinkForm.city} onChange={e => setBwLinkForm(f => ({ ...f, city: e.target.value }))} data-testid="input-bwlink-from-city" className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-400" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-violet-700 dark:text-violet-400">To City / Location (Site B)</label>
                        <Input placeholder="e.g. Islamabad – Branch Office" value={bwLinkForm.popLocation} onChange={e => setBwLinkForm(f => ({ ...f, popLocation: e.target.value }))} data-testid="input-bwlink-to-city" className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-400" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">City</label>
                        <Input placeholder="e.g. Lahore" value={bwLinkForm.city} onChange={e => setBwLinkForm(f => ({ ...f, city: e.target.value }))} data-testid="input-bwlink-city" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">POP Location</label>
                        <Input placeholder="e.g. Exchange Road POP" value={bwLinkForm.popLocation} onChange={e => setBwLinkForm(f => ({ ...f, popLocation: e.target.value }))} data-testid="input-bwlink-pop" />
                      </div>
                    </>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Billing Type</label>
                    <Select value={bwLinkForm.billingType} onValueChange={v => setBwLinkForm(f => ({ ...f, billingType: v }))}>
                      <SelectTrigger data-testid="select-bwlink-billing"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_month">Full Month</SelectItem>
                        <SelectItem value="pro_rata">Pro-Rata (Partial 1st Month)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={bwLinkForm.status} onValueChange={v => setBwLinkForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger data-testid="select-bwlink-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Notes</label>
                  <Input placeholder="Optional notes about this link" value={bwLinkForm.notes} onChange={e => setBwLinkForm(f => ({ ...f, notes: e.target.value }))} data-testid="input-bwlink-notes" />
                </div>
              </TabsContent>

              {/* Bandwidth & Cost */}
              <TabsContent value="bandwidth" className="p-5 space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Link Type</label>
                    <Select value={bwLinkForm.serviceType} onValueChange={v => setBwLinkForm(f => ({ ...f, serviceType: v }))}>
                      <SelectTrigger data-testid="select-bwlink-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fiber">Fiber</SelectItem>
                        <SelectItem value="dplc">DPLC</SelectItem>
                        <SelectItem value="wireless">Wireless</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium">Bandwidth (Mbps) <span className="text-red-500">*</span></label>
                    <Input type="number" placeholder="0" value={bwLinkForm.bandwidthMbps} onChange={e => {
                      const mbps = e.target.value;
                      setBwLinkForm(f => ({ ...f, bandwidthMbps: mbps, totalMonthlyCost: calcBwLinkCost(mbps, f.bandwidthRate, f.tax, f.currency, f.exchangeRate) }));
                    }} data-testid="input-bwlink-mbps" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Rate / Mbps <span className="text-red-500">*</span></label>
                    <div className="flex gap-1.5">
                      <Input type="number" placeholder={bwLinkForm.currency === "USD" ? "5" : "1000"} value={bwLinkForm.bandwidthRate} onChange={e => {
                        const rate = e.target.value;
                        setBwLinkForm(f => ({ ...f, bandwidthRate: rate, totalMonthlyCost: calcBwLinkCost(f.bandwidthMbps, rate, f.tax, f.currency, f.exchangeRate) }));
                      }} data-testid="input-bwlink-rate" className="flex-1 min-w-0" />
                      <Select value={bwLinkForm.currency} onValueChange={v => setBwLinkForm(f => ({ ...f, currency: v, exchangeRate: v === "USD" ? (defaultUsdRate || f.exchangeRate || "") : "1", totalMonthlyCost: calcBwLinkCost(f.bandwidthMbps, f.bandwidthRate, f.tax, v, v === "USD" ? (defaultUsdRate || f.exchangeRate || "1") : "1") }))}>
                        <SelectTrigger className="w-20 shrink-0" data-testid="select-bwlink-currency"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="PKR">PKR</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tax %</label>
                    <Input type="number" placeholder="19.5" step="0.1" value={bwLinkForm.tax} onChange={e => {
                      const tax = e.target.value;
                      setBwLinkForm(f => ({ ...f, tax, totalMonthlyCost: calcBwLinkCost(f.bandwidthMbps, f.bandwidthRate, tax, f.currency, f.exchangeRate) }));
                    }} data-testid="input-bwlink-tax" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Total Monthly Cost (PKR)</label>
                    <Input type="number" value={bwLinkForm.totalMonthlyCost} readOnly className="bg-muted/50 font-semibold text-primary" data-testid="input-bwlink-total" />
                  </div>
                </div>
                {bwLinkForm.currency === "USD" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-amber-800 dark:text-amber-300">USD → PKR Exchange Rate <span className="text-red-500">*</span></label>
                      <Input type="number" placeholder="e.g. 280" value={bwLinkForm.exchangeRate} onChange={e => {
                        const v = e.target.value;
                        setBwLinkForm(f => ({ ...f, exchangeRate: v, totalMonthlyCost: calcBwLinkCost(f.bandwidthMbps, f.bandwidthRate, f.tax, f.currency, v) }));
                      }} data-testid="input-bwlink-exchange-rate" className="border-amber-300 dark:border-amber-700" />
                      {defaultUsdRate && <p className="text-[10px] text-amber-700 dark:text-amber-400">Stored rate: 1 USD = {defaultUsdRate} PKR</p>}
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">USD Equivalent</p>
                      <p className="text-xl font-bold text-amber-700 dark:text-amber-300">$ {bwLinkForm.bandwidthMbps && bwLinkForm.bandwidthRate ? (Number(bwLinkForm.bandwidthMbps) * Number(bwLinkForm.bandwidthRate)).toFixed(2) : "0.00"}</p>
                      {bwLinkForm.exchangeRate && <p className="text-xs text-amber-600 dark:text-amber-400">1 USD = {bwLinkForm.exchangeRate} PKR</p>}
                    </div>
                  </div>
                )}
                {bwLinkForm.bandwidthMbps && bwLinkForm.bandwidthRate && (
                  <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl p-4">
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-2">Cost Breakdown</p>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      {bwLinkForm.currency === "USD" ? (
                        <>
                          <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">USD Base</p><p className="text-base font-bold text-blue-600 dark:text-blue-400">$ {(Number(bwLinkForm.bandwidthMbps) * Number(bwLinkForm.bandwidthRate)).toFixed(2)}</p></div>
                          <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">PKR Base</p><p className="text-base font-bold">{formatPKR(((Number(bwLinkForm.bandwidthMbps) * Number(bwLinkForm.bandwidthRate)) * Number(bwLinkForm.exchangeRate || 1)).toFixed(2))}</p></div>
                        </>
                      ) : (
                        <>
                          <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mbps × Rate</p><p className="text-base font-bold text-blue-600 dark:text-blue-400">{formatPKR((Number(bwLinkForm.bandwidthMbps) * Number(bwLinkForm.bandwidthRate)).toFixed(2))}</p></div>
                          <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tax ({bwLinkForm.tax || 0}%)</p><p className="text-base font-bold text-amber-600 dark:text-amber-400">+{formatPKR(((Number(bwLinkForm.bandwidthMbps) * Number(bwLinkForm.bandwidthRate)) * (Number(bwLinkForm.tax || 0) / 100)).toFixed(2))}</p></div>
                        </>
                      )}
                      {bwLinkForm.currency === "USD" && <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tax ({bwLinkForm.tax || 0}%)</p><p className="text-base font-bold text-amber-600 dark:text-amber-400">+{formatPKR(((Number(bwLinkForm.bandwidthMbps) * Number(bwLinkForm.bandwidthRate) * Number(bwLinkForm.exchangeRate || 1)) * (Number(bwLinkForm.tax || 0) / 100)).toFixed(2))}</p></div>}
                      <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly Total (PKR)</p><p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatPKR(bwLinkForm.totalMonthlyCost)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Type</p><p className="text-base font-bold capitalize">{bwLinkForm.serviceType === "dplc" ? "DPLC" : bwLinkForm.serviceType || "Fiber"}</p></div>
                    </div>
                    {bwLinkForm.billingType === "pro_rata" && bwLinkForm.startDate && (() => {
                      const start = new Date(bwLinkForm.startDate);
                      if (isNaN(start.getTime())) return null;
                      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
                      const remainingDays = daysInMonth - start.getDate() + 1;
                      const proRata = (Number(bwLinkForm.totalMonthlyCost) / daysInMonth * remainingDays).toFixed(2);
                      return (
                        <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800 text-center">
                          <p className="text-[10px] text-orange-600 dark:text-orange-400 uppercase tracking-wider">First Month Pro-Rata ({remainingDays}/{daysInMonth} days)</p>
                          <p className="text-base font-bold text-orange-600 dark:text-orange-400">{formatPKR(proRata)}</p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </TabsContent>

              {/* Connectivity */}
              <TabsContent value="connectivity" className="p-5 space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bwLinkForm.serviceType !== "dplc" && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">IP Address / Subnet</label>
                      <Input placeholder="e.g. 192.168.1.1/30" value={bwLinkForm.ipAddress} onChange={e => setBwLinkForm(f => ({ ...f, ipAddress: e.target.value }))} data-testid="input-bwlink-ip" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">VLAN Detail</label>
                    <Input placeholder="e.g. VLAN 100" value={bwLinkForm.vlanDetail} onChange={e => setBwLinkForm(f => ({ ...f, vlanDetail: e.target.value }))} data-testid="input-bwlink-vlan" />
                  </div>
                  {bwLinkForm.serviceType !== "dplc" && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Port / Slot Details</label>
                      <Input placeholder="e.g. Gi0/0/1, Port 4" value={bwLinkForm.portDetails} onChange={e => setBwLinkForm(f => ({ ...f, portDetails: e.target.value }))} data-testid="input-bwlink-port" />
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Network & Infrastructure */}
              <TabsContent value="network" className="p-5 space-y-4 mt-0">
                {bwLinkForm.serviceType === "dplc" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Site A */}
                    <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/30 p-4 space-y-3">
                      <p className="text-sm font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-violet-600 text-white text-[10px] font-bold">A</span>Site A
                      </p>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Interface Type</label>
                        <Input placeholder="e.g. GigabitEthernet0/0, SFP+" value={bwLinkForm.networkInterface} onChange={e => setBwLinkForm(f => ({ ...f, networkInterface: e.target.value }))} data-testid="input-bwlink-interface-a" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Port / Slot Details</label>
                        <Input placeholder="e.g. Port 1, Slot 2" value={bwLinkForm.portDetails} onChange={e => setBwLinkForm(f => ({ ...f, portDetails: e.target.value }))} data-testid="input-bwlink-port-a" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Exchange / Tower ID</label>
                        <Input placeholder="e.g. EX-001, TWR-A" value={bwLinkForm.dnsServers} onChange={e => setBwLinkForm(f => ({ ...f, dnsServers: e.target.value }))} data-testid="input-bwlink-tower-a" />
                      </div>
                    </div>
                    {/* Site B */}
                    <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/30 p-4 space-y-3">
                      <p className="text-sm font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-violet-600 text-white text-[10px] font-bold">B</span>Site B
                      </p>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Interface Type</label>
                        <Input placeholder="e.g. GigabitEthernet1/0, SFP+" value={bwLinkForm.gateway} onChange={e => setBwLinkForm(f => ({ ...f, gateway: e.target.value }))} data-testid="input-bwlink-interface-b" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Port / Slot Details</label>
                        <Input placeholder="e.g. Port 2, Slot 1" value={bwLinkForm.asNumber} onChange={e => setBwLinkForm(f => ({ ...f, asNumber: e.target.value }))} data-testid="input-bwlink-port-b" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Exchange / Tower ID</label>
                        <Input placeholder="e.g. EX-002, TWR-B" value={bwLinkForm.bgpConfig} onChange={e => setBwLinkForm(f => ({ ...f, bgpConfig: e.target.value }))} data-testid="input-bwlink-tower-b" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Routing Type</label>
                        <Select value={bwLinkForm.routingType} onValueChange={v => setBwLinkForm(f => ({ ...f, routingType: v }))}>
                          <SelectTrigger data-testid="select-bwlink-routing"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="static">Static</SelectItem>
                            <SelectItem value="bgp">BGP</SelectItem>
                            <SelectItem value="ospf">OSPF</SelectItem>
                            <SelectItem value="rip">RIP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Network Interface</label>
                        <Input placeholder="e.g. GigabitEthernet0/0/1" value={bwLinkForm.networkInterface} onChange={e => setBwLinkForm(f => ({ ...f, networkInterface: e.target.value }))} data-testid="input-bwlink-interface" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Gateway</label>
                        <Input placeholder="e.g. 192.168.1.1" value={bwLinkForm.gateway} onChange={e => setBwLinkForm(f => ({ ...f, gateway: e.target.value }))} data-testid="input-bwlink-gateway" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">DNS Servers</label>
                        <Input placeholder="e.g. 8.8.8.8, 8.8.4.4" value={bwLinkForm.dnsServers} onChange={e => setBwLinkForm(f => ({ ...f, dnsServers: e.target.value }))} data-testid="input-bwlink-dns" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">AS Number (BGP)</label>
                        <Input placeholder="e.g. AS65000" value={bwLinkForm.asNumber} onChange={e => setBwLinkForm(f => ({ ...f, asNumber: e.target.value }))} data-testid="input-bwlink-asn" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">BGP Config / Neighbor IP</label>
                        <Input placeholder="e.g. 10.0.0.1" value={bwLinkForm.bgpConfig} onChange={e => setBwLinkForm(f => ({ ...f, bgpConfig: e.target.value }))} data-testid="input-bwlink-bgp" />
                      </div>
                    </div>
                    {bwLinkForm.routingType === "bgp" && (
                      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl p-4">
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1.5 mb-1"><Network className="h-3.5 w-3.5" />BGP Routing Selected</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Make sure to fill in the AS Number and BGP Neighbor IP for proper routing configuration.</p>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </div>

            {/* Footer */}
            <div className="border-t px-5 py-3 flex items-center justify-between bg-muted/20 shrink-0">
              <div className="flex gap-2">
                {bwLinkFormTab !== "basic" && (
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    const tabs = ["basic", "bandwidth", "connectivity", "network"];
                    const idx = tabs.indexOf(bwLinkFormTab);
                    if (idx > 0) setBwLinkFormTab(tabs[idx - 1]);
                  }}>← Back</Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setBwLinkDialogOpen(false)}>Cancel</Button>
                {bwLinkFormTab !== "network" ? (
                  <Button type="button" size="sm" onClick={() => {
                    const tabs = ["basic", "bandwidth", "connectivity", "network"];
                    const idx = tabs.indexOf(bwLinkFormTab);
                    setBwLinkFormTab(tabs[idx + 1]);
                  }}>Next →</Button>
                ) : (
                  <Button type="button" size="sm" onClick={handleSubmitBwLink} disabled={bwLinkSubmitting} data-testid="button-save-bwlink">
                    {bwLinkSubmitting ? "Saving..." : editingBwLink ? "Update Link" : "Add Link"}
                  </Button>
                )}
              </div>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ─── Add DPLC Link Dialog ─── */}
      <Dialog open={dplcDialogOpen} onOpenChange={open => { if (!open) { setDplcDialogOpen(false); setDplcForm(emptyDplcForm); setDplcFormTab("basic"); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 gap-0">
          {/* Header */}
          <div className="px-5 py-4 rounded-t-lg shrink-0 border-b bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/40 dark:to-violet-900/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-600/10 border-2 border-violet-300 dark:border-violet-700 flex items-center justify-center shrink-0">
                <GitBranch className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  Add DPLC Link
                  <Badge variant="outline" className="no-default-active-elevate text-[10px] text-violet-600 dark:text-violet-400 border-violet-300 dark:border-violet-700">Dedicated Point-to-Point</Badge>
                </h2>
                <p className="text-muted-foreground text-xs">Configure the DPLC link details — Site A to Site B</p>
              </div>
            </div>
          </div>

          {/* Wizard Tabs */}
          <Tabs value={dplcFormTab} onValueChange={setDplcFormTab} className="flex flex-col flex-1 overflow-hidden">
            <div className="border-b bg-muted/20 shrink-0">
              <TabsList className="h-auto bg-transparent p-0 w-full justify-start rounded-none">
                {[
                  { v: "basic", label: "Basic Info", icon: <Network className="h-3.5 w-3.5" /> },
                  { v: "bandwidth", label: "Bandwidth & Cost", icon: <Zap className="h-3.5 w-3.5" /> },
                  { v: "sites", label: "Site Infrastructure", icon: <Server className="h-3.5 w-3.5 text-violet-500" /> },
                ].map(t => (
                  <TabsTrigger key={t.v} value={t.v} className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:bg-transparent py-2.5 gap-1.5 px-4">
                    {t.icon}{t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="overflow-y-auto flex-1">
              {/* Tab 1 — Basic Info */}
              <TabsContent value="basic" className="p-5 space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium">Link Name <span className="text-red-500">*</span></label>
                    <Input placeholder="e.g. DPLC-LHE-ISB-01" value={dplcForm.linkName} onChange={e => setDplcForm(f => ({ ...f, linkName: e.target.value }))} data-testid="input-dplc-name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-violet-700 dark:text-violet-400">From City / Location <span className="text-[10px] font-normal text-muted-foreground">(Site A)</span></label>
                    <Input placeholder="e.g. Lahore – Corporate HQ" value={dplcForm.siteACity} onChange={e => setDplcForm(f => ({ ...f, siteACity: e.target.value }))} className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-400" data-testid="input-dplc-site-a-city" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-violet-700 dark:text-violet-400">To City / Location <span className="text-[10px] font-normal text-muted-foreground">(Site B)</span></label>
                    <Input placeholder="e.g. Islamabad – Branch Office" value={dplcForm.siteBCity} onChange={e => setDplcForm(f => ({ ...f, siteBCity: e.target.value }))} className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-400" data-testid="input-dplc-site-b-city" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input type="date" value={dplcForm.startDate} onChange={e => setDplcForm(f => ({ ...f, startDate: e.target.value }))} data-testid="input-dplc-start-date" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">VLAN Detail</label>
                    <Input placeholder="e.g. VLAN 200" value={dplcForm.vlanDetail} onChange={e => setDplcForm(f => ({ ...f, vlanDetail: e.target.value }))} data-testid="input-dplc-vlan" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Billing Type</label>
                    <Select value={dplcForm.billingType} onValueChange={v => setDplcForm(f => ({ ...f, billingType: v }))}>
                      <SelectTrigger data-testid="select-dplc-billing"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_month">Full Month</SelectItem>
                        <SelectItem value="pro_rata">Pro-Rata (Partial 1st Month)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={dplcForm.status} onValueChange={v => setDplcForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger data-testid="select-dplc-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium">Notes</label>
                    <Input placeholder="Optional notes about this DPLC link" value={dplcForm.notes} onChange={e => setDplcForm(f => ({ ...f, notes: e.target.value }))} data-testid="input-dplc-notes" />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2 — Bandwidth & Cost */}
              <TabsContent value="bandwidth" className="p-5 space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Link Type</label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-violet-50 dark:bg-violet-950/30 text-sm">
                      <GitBranch className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                      <span className="font-semibold text-violet-700 dark:text-violet-300">DPLC</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium">Bandwidth (Mbps) <span className="text-red-500">*</span></label>
                    <Input type="number" placeholder="0" value={dplcForm.bandwidthMbps} onChange={e => {
                      const mbps = e.target.value;
                      setDplcForm(f => ({ ...f, bandwidthMbps: mbps, totalMonthlyCost: calcBwLinkCost(mbps, f.bandwidthRate, f.tax, f.currency, f.exchangeRate) }));
                    }} data-testid="input-dplc-mbps" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Rate / Mbps <span className="text-red-500">*</span></label>
                    <div className="flex gap-1.5">
                      <Input type="number" placeholder={dplcForm.currency === "USD" ? "5" : "1000"} value={dplcForm.bandwidthRate} onChange={e => {
                        const rate = e.target.value;
                        setDplcForm(f => ({ ...f, bandwidthRate: rate, totalMonthlyCost: calcBwLinkCost(f.bandwidthMbps, rate, f.tax, f.currency, f.exchangeRate) }));
                      }} data-testid="input-dplc-rate" className="flex-1 min-w-0" />
                      <Select value={dplcForm.currency} onValueChange={v => setDplcForm(f => ({ ...f, currency: v, exchangeRate: v === "USD" ? (defaultUsdRate || f.exchangeRate || "") : "1", totalMonthlyCost: calcBwLinkCost(f.bandwidthMbps, f.bandwidthRate, f.tax, v, v === "USD" ? (defaultUsdRate || f.exchangeRate || "1") : "1") }))}>
                        <SelectTrigger className="w-20 shrink-0" data-testid="select-dplc-currency"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="PKR">PKR</SelectItem><SelectItem value="USD">USD</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tax %</label>
                    <Input type="number" placeholder="19.5" step="0.1" value={dplcForm.tax} onChange={e => {
                      const tax = e.target.value;
                      setDplcForm(f => ({ ...f, tax, totalMonthlyCost: calcBwLinkCost(f.bandwidthMbps, f.bandwidthRate, tax, f.currency, f.exchangeRate) }));
                    }} data-testid="input-dplc-tax" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Total Monthly Cost (PKR)</label>
                    <Input type="number" value={dplcForm.totalMonthlyCost} readOnly className="bg-muted/50 font-semibold text-primary" data-testid="input-dplc-total" />
                  </div>
                </div>
                {dplcForm.currency === "USD" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-amber-800 dark:text-amber-300">USD → PKR Exchange Rate <span className="text-red-500">*</span></label>
                      <Input type="number" placeholder="e.g. 280" value={dplcForm.exchangeRate} onChange={e => {
                        const v = e.target.value;
                        setDplcForm(f => ({ ...f, exchangeRate: v, totalMonthlyCost: calcBwLinkCost(f.bandwidthMbps, f.bandwidthRate, f.tax, f.currency, v) }));
                      }} data-testid="input-dplc-exchange-rate" className="border-amber-300 dark:border-amber-700" />
                      {defaultUsdRate && <p className="text-[10px] text-amber-700 dark:text-amber-400">Stored rate: 1 USD = {defaultUsdRate} PKR</p>}
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">USD Equivalent</p>
                      <p className="text-xl font-bold text-amber-700 dark:text-amber-300">$ {dplcForm.bandwidthMbps && dplcForm.bandwidthRate ? (Number(dplcForm.bandwidthMbps) * Number(dplcForm.bandwidthRate)).toFixed(2) : "0.00"}</p>
                      {dplcForm.exchangeRate && <p className="text-xs text-amber-600 dark:text-amber-400">1 USD = {dplcForm.exchangeRate} PKR</p>}
                    </div>
                  </div>
                )}
                {dplcForm.bandwidthMbps && dplcForm.bandwidthRate && (
                  <div className="bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900 rounded-xl p-4">
                    <p className="text-xs text-violet-700 dark:text-violet-300 font-medium mb-2">DPLC Cost Breakdown</p>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      {dplcForm.currency === "USD" ? (
                        <>
                          <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">USD Base</p><p className="text-base font-bold text-violet-600 dark:text-violet-400">$ {(Number(dplcForm.bandwidthMbps) * Number(dplcForm.bandwidthRate)).toFixed(2)}</p></div>
                          <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">PKR Base</p><p className="text-base font-bold">{formatPKR(((Number(dplcForm.bandwidthMbps) * Number(dplcForm.bandwidthRate)) * Number(dplcForm.exchangeRate || 1)).toFixed(2))}</p></div>
                          <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tax ({dplcForm.tax || 0}%)</p><p className="text-base font-bold text-amber-600 dark:text-amber-400">+{formatPKR(((Number(dplcForm.bandwidthMbps) * Number(dplcForm.bandwidthRate) * Number(dplcForm.exchangeRate || 1)) * (Number(dplcForm.tax || 0) / 100)).toFixed(2))}</p></div>
                        </>
                      ) : (
                        <>
                          <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mbps × Rate</p><p className="text-base font-bold text-violet-600 dark:text-violet-400">{formatPKR((Number(dplcForm.bandwidthMbps) * Number(dplcForm.bandwidthRate)).toFixed(2))}</p></div>
                          <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tax ({dplcForm.tax || 0}%)</p><p className="text-base font-bold text-amber-600 dark:text-amber-400">+{formatPKR(((Number(dplcForm.bandwidthMbps) * Number(dplcForm.bandwidthRate)) * (Number(dplcForm.tax || 0) / 100)).toFixed(2))}</p></div>
                        </>
                      )}
                      <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly Total (PKR)</p><p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatPKR(dplcForm.totalMonthlyCost)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Type</p><p className="text-base font-bold text-violet-600 dark:text-violet-400">DPLC</p></div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Tab 3 — Site Infrastructure */}
              <TabsContent value="sites" className="p-5 mt-0">
                <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                  <GitBranch className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <p className="text-xs text-violet-700 dark:text-violet-300">Fill in the physical endpoint details for both sites. These are used for tracking physical infrastructure of the DPLC circuit.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Site A */}
                  <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/30 p-4 space-y-3">
                    <p className="text-sm font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-violet-600 text-white text-[10px] font-bold">A</span>
                      Site A {dplcForm.siteACity && <span className="text-xs font-normal text-muted-foreground">— {dplcForm.siteACity}</span>}
                    </p>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Interface Type</label>
                      <Input placeholder="e.g. GigabitEthernet0/0, SFP+" value={dplcForm.siteAInterface} onChange={e => setDplcForm(f => ({ ...f, siteAInterface: e.target.value }))} data-testid="input-dplc-site-a-interface" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Port / Slot Details</label>
                      <Input placeholder="e.g. Port 1, Slot 2" value={dplcForm.siteAPort} onChange={e => setDplcForm(f => ({ ...f, siteAPort: e.target.value }))} data-testid="input-dplc-site-a-port" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Exchange / Tower ID</label>
                      <Input placeholder="e.g. EX-LHE-001, TWR-A" value={dplcForm.siteATowerId} onChange={e => setDplcForm(f => ({ ...f, siteATowerId: e.target.value }))} data-testid="input-dplc-site-a-tower" />
                    </div>
                  </div>
                  {/* Site B */}
                  <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/30 p-4 space-y-3">
                    <p className="text-sm font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-violet-600 text-white text-[10px] font-bold">B</span>
                      Site B {dplcForm.siteBCity && <span className="text-xs font-normal text-muted-foreground">— {dplcForm.siteBCity}</span>}
                    </p>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Interface Type</label>
                      <Input placeholder="e.g. GigabitEthernet1/0, SFP+" value={dplcForm.siteBInterface} onChange={e => setDplcForm(f => ({ ...f, siteBInterface: e.target.value }))} data-testid="input-dplc-site-b-interface" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Port / Slot Details</label>
                      <Input placeholder="e.g. Port 2, Slot 1" value={dplcForm.siteBPort} onChange={e => setDplcForm(f => ({ ...f, siteBPort: e.target.value }))} data-testid="input-dplc-site-b-port" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Exchange / Tower ID</label>
                      <Input placeholder="e.g. EX-ISB-002, TWR-B" value={dplcForm.siteBTowerId} onChange={e => setDplcForm(f => ({ ...f, siteBTowerId: e.target.value }))} data-testid="input-dplc-site-b-tower" />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>

            {/* Footer */}
            <div className="border-t px-5 py-3 flex items-center justify-between bg-muted/20 shrink-0">
              <div>
                {dplcFormTab !== "basic" && (
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    const tabs = ["basic", "bandwidth", "sites"];
                    const idx = tabs.indexOf(dplcFormTab);
                    if (idx > 0) setDplcFormTab(tabs[idx - 1]);
                  }}>← Back</Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => { setDplcDialogOpen(false); setDplcForm(emptyDplcForm); setDplcFormTab("basic"); }}>Cancel</Button>
                {dplcFormTab !== "sites" ? (
                  <Button type="button" size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => {
                    const tabs = ["basic", "bandwidth", "sites"];
                    const idx = tabs.indexOf(dplcFormTab);
                    setDplcFormTab(tabs[idx + 1]);
                  }}>Next →</Button>
                ) : (
                  <Button type="button" size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleSubmitDplcLink} disabled={dplcSubmitting} data-testid="button-save-dplc-link">
                    {dplcSubmitting ? "Saving..." : "Add DPLC Link"}
                  </Button>
                )}
              </div>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* BW Link Detail Dialog — shows ALL fields */}
      <Dialog open={!!selectedBwLink} onOpenChange={open => { if (!open) setSelectedBwLink(null); }}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-hidden p-0 gap-0">
          {selectedBwLink && (() => {
            const link = selectedBwLink;
            const isDplcLink = link.serviceType === "dplc";
            const proRataInfo = link.billingType === "pro_rata" && link.startDate && link.totalMonthlyCost ? (() => {
              const start = new Date(link.startDate);
              if (isNaN(start.getTime())) return null;
              const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
              const remainingDays = daysInMonth - start.getDate() + 1;
              return { amount: (Number(link.totalMonthlyCost) / daysInMonth * remainingDays).toFixed(2), remainingDays, daysInMonth };
            })() : null;
            const DetailField = ({ label, value, mono, accent }: { label: string; value: string | number | null | undefined; mono?: boolean; accent?: string }) => (
              <div className={`rounded-lg p-3 ${accent || "bg-muted/50"}`}>
                <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${accent ? "font-semibold" : "text-muted-foreground"}`}>{label}</p>
                <p className={`text-sm ${mono ? "font-mono" : ""} ${value ? "font-medium" : "text-muted-foreground italic"}`}>{value || "—"}</p>
              </div>
            );
            return (
              <>
                {/* Header */}
                <div className={`px-5 py-4 rounded-t-lg shrink-0 border-b ${isDplcLink ? "bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/40 dark:to-violet-900/20" : "vendor-page-header"}`}>
                  <div className="flex items-center gap-4">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center border-2 shrink-0 ${isDplcLink ? "bg-violet-600/10 border-violet-300 dark:border-violet-700" : "bg-primary/10 border-primary/20"}`}>
                      <GitBranch className={`h-5 w-5 ${isDplcLink ? "text-violet-600 dark:text-violet-400" : "text-primary"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-bold truncate flex items-center gap-2" data-testid="text-bwlink-detail-name">
                        {link.linkName}
                        {isDplcLink && <Badge variant="outline" className="no-default-active-elevate text-[10px] text-violet-600 dark:text-violet-400 border-violet-300 dark:border-violet-700">DPLC</Badge>}
                      </h2>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                          <Network className="h-3 w-3" />
                          {isDplcLink ? "Dedicated Point-to-Point Link" : "Bandwidth Link"}
                        </span>
                        {isDplcLink && link.city && link.popLocation && (
                          <span className="text-violet-600 dark:text-violet-400 text-xs flex items-center gap-1 font-medium">
                            <MapPin className="h-3 w-3" />{link.city} → {link.popLocation}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className={`no-default-active-elevate text-xs font-semibold ${link.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : link.status === "inactive" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : "bg-yellow-100 text-yellow-700"}`}>
                        {link.status === "active" ? <CheckCircle className="h-3 w-3 mr-0.5" /> : <XCircle className="h-3 w-3 mr-0.5" />}
                        <span className="capitalize">{link.status}</span>
                      </Badge>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setSelectedBwLink(null); openEditBwLink(link); }} data-testid="button-edit-from-detail">
                        <Edit className="h-3 w-3" />Edit
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Content — all fields shown */}
                <div className="overflow-y-auto px-5 py-5 space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={`rounded-xl p-3 text-center border ${isDplcLink ? "bg-violet-50 dark:bg-violet-950/40 border-violet-100 dark:border-violet-900" : "bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900"}`}>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Bandwidth</p>
                      <p className={`text-2xl font-bold ${isDplcLink ? "text-violet-600 dark:text-violet-400" : "text-blue-600 dark:text-blue-400"}`}>{link.bandwidthMbps || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">Mbps</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Rate / Mbps</p>
                      <p className="text-lg font-bold mt-0.5">{link.currency === "USD" ? `$ ${link.bandwidthRate}` : formatPKR(link.bandwidthRate)}</p>
                      <p className="text-[10px] text-muted-foreground">per Mbps ({link.currency || "PKR"})</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Monthly Cost</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatPKR(link.totalMonthlyCost)}</p>
                      <p className="text-[10px] text-muted-foreground">/month (PKR)</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Billing</p>
                      <p className="text-sm font-bold mt-1 capitalize">{link.billingType === "pro_rata" ? "Pro-Rata" : "Full Month"}</p>
                      {link.billingType === "pro_rata" && proRataInfo && (
                        <p className="text-[10px] text-orange-600 dark:text-orange-400">{formatPKR(proRataInfo.amount)} ({proRataInfo.remainingDays}/{proRataInfo.daysInMonth} days)</p>
                      )}
                    </div>
                  </div>

                  {/* Currency & Exchange (always shown) */}
                  <Card>
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />Currency & Cost Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <DetailField label="Currency" value={link.currency || "PKR"} />
                        <DetailField label="Exchange Rate" value={link.currency === "USD" ? `1 USD = ${link.exchangeRate} PKR` : "N/A (PKR)"} />
                        <DetailField label="Tax %" value={link.tax ? `${link.tax}%` : "0%"} />
                        <DetailField label="Service Type" value={isDplcLink ? "DPLC" : link.serviceType ? link.serviceType.charAt(0).toUpperCase() + link.serviceType.slice(1) : "Standard"} />
                      </div>
                      {link.currency === "USD" && link.bandwidthMbps && link.bandwidthRate && (
                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <div className="grid grid-cols-4 gap-3 text-center">
                            <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">USD Base</p><p className="text-base font-bold text-amber-700 dark:text-amber-400">$ {(Number(link.bandwidthMbps) * Number(link.bandwidthRate)).toFixed(2)}</p></div>
                            <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">× Rate</p><p className="text-base font-bold">{link.exchangeRate}</p></div>
                            <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">PKR Base</p><p className="text-base font-bold">{formatPKR((Number(link.bandwidthMbps) * Number(link.bandwidthRate) * Number(link.exchangeRate || 1)).toFixed(2))}</p></div>
                            <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">+ Tax ({link.tax || 0}%)</p><p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatPKR(link.totalMonthlyCost)}</p></div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Location & Connectivity — ALL fields */}
                  <Card>
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" />Location & Connectivity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {isDplcLink ? (
                          <>
                            <DetailField label="Site A City" value={link.city} accent="bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400" />
                            <DetailField label="Site B City" value={link.popLocation} accent="bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400" />
                          </>
                        ) : (
                          <>
                            <DetailField label="City" value={link.city} />
                            <DetailField label="POP Location" value={link.popLocation} />
                          </>
                        )}
                        <DetailField label="IP Address" value={link.ipAddress} mono />
                        <DetailField label="VLAN Detail" value={link.vlanDetail} mono />
                        <DetailField label="Start Date" value={link.startDate} />
                        <DetailField label="Created At" value={link.createdAt ? new Date(link.createdAt).toLocaleString() : null} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Network / Site Infrastructure — ALL fields, always shown */}
                  <Card>
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Network className={`h-3.5 w-3.5 ${isDplcLink ? "text-violet-600 dark:text-violet-400" : "text-blue-600 dark:text-blue-400"}`} />
                        {isDplcLink ? "Site Infrastructure (A ↔ B)" : "Network Infrastructure"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isDplcLink ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/30 p-4 space-y-3">
                            <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-violet-600 text-white text-[10px] font-bold">A</span>
                              Site A {link.city && <span className="text-[10px] font-normal text-muted-foreground ml-1">— {link.city}</span>}
                            </p>
                            <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Interface Type</p><p className={`text-sm font-mono mt-0.5 ${link.networkInterface ? "font-medium" : "text-muted-foreground italic"}`}>{link.networkInterface || "—"}</p></div>
                            <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Port / Slot</p><p className={`text-sm font-mono mt-0.5 ${link.portDetails ? "font-medium" : "text-muted-foreground italic"}`}>{link.portDetails || "—"}</p></div>
                            <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Exchange / Tower ID</p><p className={`text-sm font-mono mt-0.5 ${link.dnsServers ? "font-medium" : "text-muted-foreground italic"}`}>{link.dnsServers || "—"}</p></div>
                          </div>
                          <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/30 p-4 space-y-3">
                            <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-violet-600 text-white text-[10px] font-bold">B</span>
                              Site B {link.popLocation && <span className="text-[10px] font-normal text-muted-foreground ml-1">— {link.popLocation}</span>}
                            </p>
                            <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Interface Type</p><p className={`text-sm font-mono mt-0.5 ${link.gateway ? "font-medium" : "text-muted-foreground italic"}`}>{link.gateway || "—"}</p></div>
                            <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Port / Slot</p><p className={`text-sm font-mono mt-0.5 ${link.asNumber ? "font-medium" : "text-muted-foreground italic"}`}>{link.asNumber || "—"}</p></div>
                            <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Exchange / Tower ID</p><p className={`text-sm font-mono mt-0.5 ${link.bgpConfig ? "font-medium" : "text-muted-foreground italic"}`}>{link.bgpConfig || "—"}</p></div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <DetailField label="Routing Type" value={link.routingType ? link.routingType.charAt(0).toUpperCase() + link.routingType.slice(1) : "Static"} />
                          <DetailField label="Network Interface" value={link.networkInterface} mono />
                          <DetailField label="Port / Slot" value={link.portDetails} mono />
                          <DetailField label="Gateway" value={link.gateway} mono />
                          <DetailField label="DNS Servers" value={link.dnsServers} mono />
                          <DetailField label="AS Number" value={link.asNumber} mono />
                          <div className="md:col-span-3"><DetailField label="BGP Config / Neighbor" value={link.bgpConfig} mono /></div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Notes — always shown */}
                  <Card>
                    <CardHeader className="pb-2 pt-3"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-muted-foreground" />Notes</CardTitle></CardHeader>
                    <CardContent><p className={`text-sm ${link.notes ? "" : "text-muted-foreground italic"}`}>{link.notes || "No notes added."}</p></CardContent>
                  </Card>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Outstanding Payment Dialog */}
      <Dialog open={outstandingOpen} onOpenChange={open => { if (!open) setOutstandingOpen(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <FileWarning className="h-5 w-5" />Add Old Pending Outstanding Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 mb-3 rounded-lg border border-orange-200 bg-orange-50/60 dark:border-orange-800 dark:bg-orange-950/30 p-3">
            <p className="text-xs text-orange-700 dark:text-orange-400 flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              This records a historical outstanding amount owed to this vendor for bandwidth services not yet entered in the system. The wallet balance will go negative by this amount.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount Owed (PKR) <span className="text-red-500">*</span></label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 150000"
                value={outstandingForm.amount}
                onChange={e => setOutstandingForm(f => ({ ...f, amount: e.target.value }))}
                data-testid="input-outstanding-amount"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Billing Period <span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g. March 2025 or Q1 2025"
                value={outstandingForm.period}
                onChange={e => setOutstandingForm(f => ({ ...f, period: e.target.value }))}
                data-testid="input-outstanding-period"
              />
              <p className="text-[10px] text-muted-foreground">The month/period this payment was due for</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Bandwidth Link (optional)</label>
              {bwLinks.length > 0 ? (
                <Select value={outstandingForm.bwLinkName} onValueChange={v => setOutstandingForm(f => ({ ...f, bwLinkName: v === "__none__" ? "" : v }))}>
                  <SelectTrigger data-testid="select-outstanding-link">
                    <SelectValue placeholder="Select a link (or leave blank for all)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— All Links / General —</SelectItem>
                    {bwLinks.map(l => (
                      <SelectItem key={l.id} value={l.linkName}>{l.linkName} {l.city ? `(${l.city})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Link name (optional)"
                  value={outstandingForm.bwLinkName}
                  onChange={e => setOutstandingForm(f => ({ ...f, bwLinkName: e.target.value }))}
                  data-testid="input-outstanding-link-name"
                />
              )}
              <p className="text-[10px] text-muted-foreground">Specify which link this outstanding is for (optional)</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                placeholder="Any additional context about this outstanding payment..."
                rows={2}
                className="resize-none"
                value={outstandingForm.notes}
                onChange={e => setOutstandingForm(f => ({ ...f, notes: e.target.value }))}
                data-testid="input-outstanding-notes"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setOutstandingOpen(false)} data-testid="button-outstanding-cancel">Cancel</Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={submitOutstanding}
              disabled={outstandingMutation.isPending || !outstandingForm.amount || !outstandingForm.period.trim()}
              data-testid="button-outstanding-submit"
            >
              {outstandingMutation.isPending ? "Recording..." : "Record Outstanding"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
