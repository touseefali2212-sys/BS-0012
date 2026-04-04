import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Handshake,
  Phone,
  Mail,
  MapPin,
  Users,
  Percent,
  Shield,
  Network,
  Store,
  Tag,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
  CreditCard,
  RefreshCw,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Globe,
  Key,
  Hash,
  Calendar,
  Building2,
  Landmark,
  ScrollText,
  Map as MapIcon,
  Briefcase,
  Upload,
  ChevronRight,
  ChevronLeft,
  Wifi,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  Activity,
  Ban,
  KeyRound,
  UserCheck,
  ChevronDown,
  X,
  ExternalLink,
  Clock,
  Banknote,
  Target,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
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
  DropdownMenuSeparator,
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTab } from "@/hooks/use-tab";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertResellerSchema,
  insertResellerTypeSchema,
  type Reseller,
  type InsertReseller,
  type ResellerType,
  type InsertResellerType,
  type Vendor,
  type ResellerWalletTransaction,
  type Package,
  type CompanyBankAccount,
} from "@shared/schema";
import { z } from "zod";

const formatPKR = (value: string | number | null | undefined) => {
  const num = parseFloat(String(value || "0"));
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

const resellerFormSchema = insertResellerSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number is required"),
});

const iconMap: Record<string, LucideIcon> = {
  shield: Shield, network: Network, store: Store, tag: Tag, users: Users,
  globe: Globe, key: Key, handshake: Handshake, wallet: Wallet, hash: Hash,
  creditcard: CreditCard, dollar: DollarSign, percent: Percent, barChart3: BarChart3,
};

const colorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  pink: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
};

const iconOptions = ["shield", "network", "store", "tag", "users", "globe", "key", "handshake", "wallet", "hash", "creditcard", "dollar", "percent"];
const colorOptions = ["blue", "teal", "violet", "amber", "green", "red", "indigo", "slate", "pink", "cyan", "orange"];
const commissionModelOptions = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed", label: "Fixed Amount" },
  { value: "bulk", label: "Bulk / Volume" },
  { value: "tiered", label: "Tiered" },
];

const statusColors: Record<string, string> = {
  active: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950",
  inactive: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950",
  suspended: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950",
  blocked: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900",
  corporate: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950",
};

export default function ResellersPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [tab, changeTab] = useTab("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState("");
  const [detailReseller, setDetailReseller] = useState<Reseller | null>(null);
  const [detailTab, setDetailTab] = useState("profile");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null);
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [rechargeReseller, setRechargeReseller] = useState<Reseller | null>(null);
  const [rechargeVendorRows, setRechargeVendorRows] = useState<Array<{ id: string; vendorId: string; amount: string }>>([{ id: "1", vendorId: "", amount: "" }]);
  const [rechargeVendorId, setRechargeVendorId] = useState("");
  const [rechargePaidAmount, setRechargePaidAmount] = useState("");
  const [rechargeReference, setRechargeReference] = useState("");
  const [rechargePaymentMethod, setRechargePaymentMethod] = useState("cash_in_hand");
  const [rechargePaymentStatus, setRechargePaymentStatus] = useState("paid");
  const [rechargeRemarks, setRechargeRemarks] = useState("");
  const [rechargeBankAccountId, setRechargeBankAccountId] = useState("");
  const [rechargeSenderName, setRechargeSenderName] = useState("");
  const [rechargeCreditEntry, setRechargeCreditEntry] = useState("");
  const [rechargeSubmitting, setRechargeSubmitting] = useState(false);
  const [deductDialogOpen, setDeductDialogOpen] = useState(false);
  const [deductReseller, setDeductReseller] = useState<Reseller | null>(null);
  const [deductReversalTxn, setDeductReversalTxn] = useState<ResellerWalletTransaction | null>(null);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustReseller, setAdjustReseller] = useState<Reseller | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"credit" | "debit">("credit");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustReference, setAdjustReference] = useState("");
  const [txnTypeFilter, setTxnTypeFilter] = useState("all");
  const [txnSearch, setTxnSearch] = useState("");
  const [selectedWalletResellerId, setSelectedWalletResellerId] = useState<string>("");
  const [viewWalletTxn, setViewWalletTxn] = useState<ResellerWalletTransaction | null>(null);
  const [editWalletTxn, setEditWalletTxn] = useState<ResellerWalletTransaction | null>(null);
  const [editWalletRef, setEditWalletRef] = useState("");
  const [editWalletPayStatus, setEditWalletPayStatus] = useState("paid");
  const [editWalletPaidAmount, setEditWalletPaidAmount] = useState("");
  const [editWalletMethod, setEditWalletMethod] = useState("cash_in_hand");
  const [editWalletBankAccId, setEditWalletBankAccId] = useState("");
  const [editWalletSenderName, setEditWalletSenderName] = useState("");
  const [editWalletNotes, setEditWalletNotes] = useState("");
  const [deleteWalletTxnId, setDeleteWalletTxnId] = useState<number | null>(null);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ResellerType | null>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [addedPackages, setAddedPackages] = useState<Array<{
    packageId: number; packageName: string; speed: string; dataLimit: string;
    vendorId: string; vendorPrice: string; resellerPrice: string; profit: string;
  }>>([]);
  const [pkgForm, setPkgForm] = useState({ packageId: "", vendorId: "", vendorPrice: "0", resellerPrice: "0" });
  const [addedVendorPanels, setAddedVendorPanels] = useState<Array<{
    vendorId: number; vendorName: string; panelUrl: string; panelUsername: string; panelPassword: string;
  }>>([]);
  const [vpForm, setVpForm] = useState({ vendorId: "", panelUrl: "", panelUsername: "", panelPassword: "" });
  const [showVpPassword, setShowVpPassword] = useState(false);

  const { data: resellers, isLoading } = useQuery<Reseller[]>({
    queryKey: ["/api/resellers"],
  });

  const { data: resellerTypesList, isLoading: isLoadingTypes } = useQuery<ResellerType[]>({
    queryKey: ["/api/reseller-types"],
  });

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: packagesList } = useQuery<Package[]>({
    queryKey: ["/api/packages"],
  });

  const { data: walletTransactions, isLoading: isLoadingTransactions } =
    useQuery<ResellerWalletTransaction[]>({
      queryKey: ["/api/reseller-wallet-transactions", selectedWalletResellerId],
      enabled: !!selectedWalletResellerId,
    });

  const { data: companyBankAccounts } = useQuery<CompanyBankAccount[]>({
    queryKey: ["/api/company-bank-accounts"],
  });

  const resellerDefaults: InsertReseller = {
    name: "", resellerType: "authorized_dealer", gender: "", occupation: "", dateOfBirth: "",
    fatherName: "", contactName: "", phone: "", secondaryPhone: "", email: "", cnic: "", ntn: "",
    registrationFormNo: "", address: "", city: "", area: "", territory: "",
    profilePicture: "", cnicPicture: "", registrationFormPicture: "",
    vendorId: undefined, packageId: undefined, assignedPackages: "",
    commissionRate: "10", commissionPaymentMethod: "wallet",
    commissionPaymentFrequency: "monthly", walletBalance: "0", creditLimit: "0",
    securityDeposit: "0", totalCustomers: 0, agreementStartDate: "", agreementEndDate: "",
    agreementType: "standard", autoRenewal: false,
    joinDate: "", uplinkType: "", uplink: "", exchangeTowerPopName: "", portId: "", vlanId: "",
    media: "", vendorPanelAllowed: false, panelUrl: "", panelUsername: "", panelPassword: "",
    assignedVendorPanels: "", vlanIdAllowed: false, vlanIdNote: "",
    connectionType: "", bandwidthPlan: "", ipAssignment: "dynamic", nasId: "", serviceZone: "",
    bankName: "", bankAccountTitle: "", bankAccountNumber: "", bankBranchCode: "",
    billingCycle: "monthly", paymentMethod: "cash", openingBalance: "0",
    supportLevel: "standard", maxCustomerLimit: 0, notes: "", status: "active",
  };

  const editForm = useForm<InsertReseller>({
    resolver: zodResolver(resellerFormSchema),
    defaultValues: { ...resellerDefaults },
  });

  const fromQueryId = new URLSearchParams(window.location.search).get("fromQuery");

  const addForm = useForm<InsertReseller>({
    resolver: zodResolver(resellerFormSchema),
    defaultValues: { ...resellerDefaults },
  });

  const { data: fromQueryData } = useQuery<any>({
    queryKey: ["/api/customer-queries", fromQueryId],
    enabled: !!fromQueryId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertReseller) => {
      const res = await apiRequest("POST", "/api/resellers", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      addForm.reset();
      toast({ title: "Reseller created successfully" });
      if (fromQueryId) {
        apiRequest("POST", `/api/customer-queries/${fromQueryId}/convert`, { customerId: data.id }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["/api/customer-queries"] });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Auto-pre-fill when navigated from Convert flow
  useEffect(() => {
    if (!fromQueryData) return;
    const q = fromQueryData;
    addForm.reset({
      ...resellerDefaults,
      name: q.name || "",
      phone: q.phone || "",
      email: q.email || "",
      address: q.address || "",
      city: q.city || "",
      area: q.area || "",
      fatherName: q.fatherName || "",
      gender: q.gender || "",
      cnic: q.nidNumber || "",
      notes: q.remarks || "",
      ...(q.panelVendorId ? { vendorId: q.panelVendorId } : {}),
      ...(q.panelUsersCapacity ? { maxCustomerLimit: q.panelUsersCapacity } : {}),
    });
  }, [fromQueryData]);

  useEffect(() => {
    if (rechargeReseller) {
      const lim = parseFloat(String(rechargeReseller.creditLimit || "0"));
      setRechargeCreditEntry(lim > 0 ? lim.toFixed(2) : "0.00");
    }
  }, [rechargeReseller]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertReseller> }) => {
      const res = await apiRequest("PATCH", `/api/resellers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setEditDialogOpen(false);
      setEditingReseller(null);
      editForm.reset();
      toast({ title: "Reseller updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/resellers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Reseller deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rechargeApiCall = useMutation({
    mutationFn: async (data: { resellerId: number; amount: number; reference: string; paymentMethod?: string; remarks?: string; paymentStatus?: string; paidAmount?: number; senderName?: string; vendorId?: number; bankAccountId?: number }) => {
      const res = await apiRequest("POST", "/api/reseller-wallet/recharge", data);
      return res.json();
    },
  });

  const updateWalletTxnMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, any> }) => {
      const res = await apiRequest("PATCH", `/api/reseller-wallet-transactions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-wallet-transactions", selectedWalletResellerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-wallet-transactions/all"] });
      setEditWalletTxn(null);
      toast({ title: "Transaction updated successfully" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const deleteWalletTxnMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reseller-wallet-transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-wallet-transactions", selectedWalletResellerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-wallet-transactions/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      setDeleteWalletTxnId(null);
      toast({ title: "Transaction deleted" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const deductMutation = useMutation({
    mutationFn: async (data: { resellerId: number; amount: number; reference?: string; category?: string }) => {
      const res = await apiRequest("POST", "/api/reseller-wallet/deduct", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-wallet-transactions", selectedWalletResellerId] });
      setDeductDialogOpen(false);
      setDeductReseller(null);
      setDeductReversalTxn(null);
      toast({ title: "Recharge reversed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async (data: { resellerId: number; amount: number; reference?: string; category?: string }) => {
      const endpoint = adjustType === "credit" ? "/api/reseller-wallet/recharge" : "/api/reseller-wallet/deduct";
      const res = await apiRequest("POST", endpoint, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-wallet-transactions", selectedWalletResellerId] });
      setAdjustDialogOpen(false);
      setAdjustReseller(null);
      setAdjustAmount("");
      setAdjustType("credit");
      setAdjustReason("");
      setAdjustReference("");
      toast({ title: "Adjustment entry recorded successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const typeForm = useForm<InsertResellerType>({
    resolver: zodResolver(insertResellerTypeSchema),
    defaultValues: {
      key: "", label: "", description: "", icon: "shield", color: "blue", isDefault: false, status: "active",
      commissionModel: "percentage", defaultCommissionRate: "10", territoryExclusive: false,
      allowSubResellers: false, allowCustomBranding: false, allowApiAccess: false,
      walletEnabled: true, minCustomers: 0, maxCustomers: 0, features: "", sortOrder: 0,
    },
  });

  const createTypeMutation = useMutation({
    mutationFn: async (data: InsertResellerType) => { const r = await apiRequest("POST", "/api/reseller-types", data); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/reseller-types"] }); setTypeDialogOpen(false); typeForm.reset(); toast({ title: "Reseller type created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertResellerType> }) => { const r = await apiRequest("PATCH", `/api/reseller-types/${id}`, data); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/reseller-types"] }); setTypeDialogOpen(false); setEditingType(null); typeForm.reset(); toast({ title: "Reseller type updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/reseller-types/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/reseller-types"] }); toast({ title: "Reseller type deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openCreateType = () => {
    setEditingType(null);
    typeForm.reset({
      key: "", label: "", description: "", icon: "shield", color: "blue", isDefault: false, status: "active",
      commissionModel: "percentage", defaultCommissionRate: "10", territoryExclusive: false,
      allowSubResellers: false, allowCustomBranding: false, allowApiAccess: false,
      walletEnabled: true, minCustomers: 0, maxCustomers: 0, features: "", sortOrder: 0,
    });
    setTypeDialogOpen(true);
  };

  const openEditType = (t: ResellerType) => {
    setEditingType(t);
    typeForm.reset(t as any);
    setTypeDialogOpen(true);
  };

  const onTypeSubmit = (data: InsertResellerType) => {
    if (editingType) updateTypeMutation.mutate({ id: editingType.id, data });
    else createTypeMutation.mutate(data);
  };

  const openEdit = (reseller: Reseller) => {
    setEditingReseller(reseller);
    const r = reseller;
    editForm.reset({
      name: r.name, resellerType: r.resellerType || "authorized_dealer",
      gender: r.gender || "", occupation: r.occupation || "", dateOfBirth: r.dateOfBirth || "",
      fatherName: r.fatherName || "", contactName: r.contactName || "",
      phone: r.phone, secondaryPhone: r.secondaryPhone || "",
      email: r.email || "", cnic: r.cnic || "", ntn: r.ntn || "",
      registrationFormNo: r.registrationFormNo || "",
      address: r.address || "", city: r.city || "", area: r.area || "", territory: r.territory || "",
      profilePicture: r.profilePicture || "", cnicPicture: r.cnicPicture || "",
      registrationFormPicture: r.registrationFormPicture || "",
      vendorId: r.vendorId ?? undefined, packageId: r.packageId ?? undefined,
      assignedPackages: r.assignedPackages || "",
      commissionType: (r as any).commissionType || "fixed_rate",
      commissionRate: r.commissionRate || "10",
      commissionProfitRate: (r as any).commissionProfitRate || "0",
      commissionPaymentMethod: r.commissionPaymentMethod || "wallet",
      commissionPaymentFrequency: r.commissionPaymentFrequency || "monthly",
      walletBalance: r.walletBalance || "0", creditLimit: r.creditLimit || "0",
      securityDeposit: r.securityDeposit || "0", totalCustomers: r.totalCustomers || 0,
      agreementStartDate: r.agreementStartDate || "", agreementEndDate: r.agreementEndDate || "",
      agreementType: r.agreementType || "standard", autoRenewal: r.autoRenewal ?? false,
      joinDate: r.joinDate || "", uplinkType: r.uplinkType || "", uplink: r.uplink || "",
      exchangeTowerPopName: r.exchangeTowerPopName || "", portId: r.portId || "", vlanId: r.vlanId || "",
      media: r.media || "", vendorPanelAllowed: r.vendorPanelAllowed ?? false,
      panelUrl: r.panelUrl || "", panelUsername: r.panelUsername || "", panelPassword: r.panelPassword || "",
      assignedVendorPanels: r.assignedVendorPanels || "", vlanIdAllowed: r.vlanIdAllowed ?? false, vlanIdNote: r.vlanIdNote || "",
      connectionType: r.connectionType || "", bandwidthPlan: r.bandwidthPlan || "",
      ipAssignment: r.ipAssignment || "dynamic", nasId: r.nasId || "", serviceZone: r.serviceZone || "",
      bankName: r.bankName || "", bankAccountTitle: r.bankAccountTitle || "",
      bankAccountNumber: r.bankAccountNumber || "", bankBranchCode: r.bankBranchCode || "",
      billingCycle: r.billingCycle || "monthly", paymentMethod: r.paymentMethod || "cash",
      openingBalance: r.openingBalance || "0", supportLevel: r.supportLevel || "standard",
      maxCustomerLimit: r.maxCustomerLimit || 0, notes: r.notes || "", status: r.status,
    });
    setEditDialogOpen(true);
  };

  const onEditSubmit = (data: InsertReseller) => {
    if (editingReseller) {
      updateMutation.mutate({ id: editingReseller.id, data });
    }
  };

  const handleFileUpload = async (file: File, fieldName: "profilePicture" | "cnicPicture" | "registrationFormPicture") => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/document", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();
      if (data.url) addForm.setValue(fieldName, data.url);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const selectedPkg = (packagesList || []).find(p => String(p.id) === pkgForm.packageId);
  const pkgProfit = (parseFloat(pkgForm.resellerPrice || "0") - parseFloat(pkgForm.vendorPrice || "0")).toFixed(2);

  const handleAddPackage = () => {
    if (!selectedPkg) return;
    if (addedPackages.some(p => p.packageId === selectedPkg.id)) return;
    const vendorName = (vendors || []).find(v => String(v.id) === pkgForm.vendorId)?.name || pkgForm.vendorId;
    setAddedPackages(prev => [...prev, {
      packageId: selectedPkg.id, packageName: selectedPkg.name,
      speed: selectedPkg.speed || "N/A", dataLimit: selectedPkg.dataLimit || "Unlimited",
      vendorId: vendorName, vendorPrice: pkgForm.vendorPrice || "0",
      resellerPrice: pkgForm.resellerPrice || "0", profit: pkgProfit,
    }]);
    const ids = [...addedPackages.map(p => p.packageId), selectedPkg.id].join(",");
    addForm.setValue("assignedPackages", ids);
    addForm.setValue("packageId", selectedPkg.id);
    setPkgForm({ packageId: "", vendorId: "", vendorPrice: "0", resellerPrice: "0" });
  };

  const handleRemovePackage = (pkgId: number) => {
    const updated = addedPackages.filter(p => p.packageId !== pkgId);
    setAddedPackages(updated);
    addForm.setValue("assignedPackages", updated.map(p => p.packageId).join(","));
  };

  const onAddSubmit = (data: InsertReseller) => {
    createMutation.mutate(data, {
      onSuccess: () => { setWizardStep(1); setAddedPackages([]); setPkgForm({ packageId: "", vendorId: "", vendorPrice: "0", resellerPrice: "0" }); setAddedVendorPanels([]); setVpForm({ vendorId: "", panelUrl: "", panelUsername: "", panelPassword: "" }); },
    });
  };

  const handleRecharge = async () => {
    if (!rechargeReseller || rechargeSubmitting) return;
    const validRows = rechargeVendorRows.filter(r => r.amount && parseFloat(r.amount) > 0);
    if (validRows.length === 0) return;
    setRechargeSubmitting(true);
    try {
      const totalRechargeAmt = validRows.reduce((s, r) => s + parseFloat(r.amount), 0);
      const isPaidType = rechargePaymentStatus === "paid" || rechargePaymentStatus === "credit_balance";
      // Total paid — default to full amount when paid; for credit_balance use entered amount
      const totalPaidAmt = isPaidType
        ? (rechargePaidAmount ? parseFloat(rechargePaidAmount) : (rechargePaymentStatus === "paid" ? totalRechargeAmt : 0))
        : 0;
      // Fill rows sequentially: pay each row in full before moving to the next
      let paidRemaining = totalPaidAmt;
      for (const row of validRows) {
        const rowAmt = parseFloat(row.amount);
        const rowPaidAmt = isPaidType ? Math.min(rowAmt, paidRemaining) : 0;
        paidRemaining = Math.max(0, paidRemaining - rowAmt);
        // Per-row payment status
        const rowPayStatus = !isPaidType
          ? rechargePaymentStatus
          : rowPaidAmt >= rowAmt
            ? (rechargePaymentStatus === "credit_balance" ? "credit_balance" : "paid")
            : rowPaidAmt > 0
              ? "partial"
              : "unpaid";
        await rechargeApiCall.mutateAsync({
          resellerId: rechargeReseller.id,
          amount: rowAmt,
          reference: rechargeReference,
          paymentMethod: rechargePaymentMethod,
          paymentStatus: rowPayStatus,
          remarks: rechargeRemarks || undefined,
          paidAmount: isPaidType ? rowPaidAmt : undefined,
          senderName: rechargeSenderName || undefined,
          vendorId: row.vendorId && row.vendorId !== "none" ? parseInt(row.vendorId) : undefined,
          bankAccountId: rechargeBankAccountId && rechargeBankAccountId !== "none" ? parseInt(rechargeBankAccountId) : undefined,
        });
      }
      // For credit_balance: deduct the total credit used from the wallet balance
      if (rechargePaymentStatus === "credit_balance" && totalPaidAmt > 0) {
        await apiRequest("POST", "/api/reseller-wallet/deduct", {
          resellerId: rechargeReseller.id,
          amount: totalPaidAmt,
          reference: rechargeReference || undefined,
          category: "credit_balance_payment",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-wallet-transactions", selectedWalletResellerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/company-bank-accounts"] });
      setRechargeDialogOpen(false);
      setRechargeReseller(null);
      setRechargeVendorRows([{ id: "1", vendorId: "", amount: "" }]);
      setRechargeVendorId("");
      setRechargePaidAmount("");
      setRechargeReference("");
      setRechargePaymentMethod("cash_in_hand");
      setRechargePaymentStatus("paid");
      setRechargeRemarks("");
      setRechargeBankAccountId("");
      setRechargeSenderName("");
      setRechargeCreditEntry("");
      toast({ title: `Wallet recharged successfully${validRows.length > 1 ? ` (${validRows.length} entries)` : ""}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setRechargeSubmitting(false);
    }
  };

  const filtered = (resellers || []).filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search) ||
      (r.contactName || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.email || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchArea = areaFilter === "all" || r.area === areaFilter;
    const matchQuick = !quickFilter ||
      (quickFilter === "credit_exceeded" && parseFloat(String(r.walletBalance || "0")) < 0) ||
      (quickFilter === "suspended" && r.status === "inactive");
    return matchSearch && matchStatus && matchArea && matchQuick;
  });

  const allAreas = Array.from(new Set((resellers || []).map(r => r.area).filter(Boolean))) as string[];
  const totalResellers = (resellers || []).length;
  const activeResellers = (resellers || []).filter(r => r.status === "active").length;
  const suspendedResellers = (resellers || []).filter(r => r.status === "inactive").length;
  const totalRevenue = (resellers || []).reduce((sum, r) => sum + parseFloat(String(r.walletBalance || "0")), 0);
  const outstandingBalance = (resellers || []).reduce((sum, r) => { const bal = parseFloat(String(r.walletBalance || "0")); return bal < 0 ? sum + Math.abs(bal) : sum; }, 0);
  const totalCommission = (resellers || []).reduce((sum, r) => sum + parseFloat(String(r.commissionRate || "0")), 0);

  const getVendorName = (vendorId: number | null) => {
    if (!vendorId || !vendors) return "N/A";
    const vendor = vendors.find((v) => v.id === vendorId);
    return vendor ? vendor.name : "N/A";
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-resellers-title">
            Resellers
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage reseller and partner relationships
          </p>
        </div>
        {tab === "list" && (
          <Button onClick={() => setLocation("/resellers/add")} data-testid="button-add-reseller" className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] hover:from-[#001f42] hover:to-[#0044cc]">
            <Plus className="h-4 w-4 mr-1" />
            Add Reseller
          </Button>
        )}
      </div>

      {tab === "types" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="no-default-active-elevate text-sm px-3 py-1" data-testid="text-reseller-types-count">
                {(resellerTypesList || []).length} Type{(resellerTypesList || []).length !== 1 ? "s" : ""} & Roles
              </Badge>
            </div>
            <Button onClick={openCreateType} data-testid="button-add-reseller-type" className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] hover:from-[#001f42] hover:to-[#0044cc]">
              <Plus className="h-4 w-4 mr-1" />Add New Type & Role
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Types</p>
                <p className="text-2xl font-bold" data-testid="text-types-total">{(resellerTypesList || []).length}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-types-active">{(resellerTypesList || []).filter(t => t.status === "active").length}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-teal-500">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Territory Exclusive</p>
                <p className="text-2xl font-bold text-teal-600" data-testid="text-types-exclusive">{(resellerTypesList || []).filter(t => t.territoryExclusive).length}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">API Access Enabled</p>
                <p className="text-2xl font-bold text-amber-600" data-testid="text-types-api">{(resellerTypesList || []).filter(t => t.allowApiAccess).length}</p>
              </CardContent>
            </Card>
          </div>

          {isLoadingTypes ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : (resellerTypesList || []).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Handshake className="h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium">No reseller types defined</p>
                <p className="text-sm mt-1">Add your first type & role to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(resellerTypesList || []).map((type) => {
                const IconComp = iconMap[type.icon || "shield"] || Shield;
                const colorClass = colorMap[type.color || "blue"] || colorMap.blue;
                const features = (type.features || "").split(",").filter(Boolean);
                return (
                  <Card key={type.id} data-testid={`card-reseller-type-${type.id}`} className="relative">
                    <div className="absolute top-3 right-3 flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditType(type)} data-testid={`button-edit-type-${type.id}`}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      {!type.isDefault && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTypeMutation.mutate(type.id)} data-testid={`button-delete-type-${type.id}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${colorClass}`}>
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {type.label}
                            {type.isDefault && <Badge variant="secondary" className="no-default-active-elevate text-[9px]">Default</Badge>}
                          </CardTitle>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{type.key}</p>
                        </div>
                      </div>
                      {type.description && <CardDescription className="mt-2 text-xs">{type.description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-[10px] capitalize gap-1">
                          <DollarSign className="h-3 w-3" />{type.commissionModel} — {type.defaultCommissionRate}%
                        </Badge>
                        <Badge variant={type.status === "active" ? "secondary" : "outline"} className={`no-default-active-elevate text-[10px] capitalize ${type.status === "active" ? "text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-950" : "text-red-600"}`}>
                          {type.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          {type.territoryExclusive ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />}
                          <span className={type.territoryExclusive ? "text-foreground" : "text-muted-foreground"}>Territory Exclusive</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          {type.allowSubResellers ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />}
                          <span className={type.allowSubResellers ? "text-foreground" : "text-muted-foreground"}>Sub-Resellers</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          {type.allowCustomBranding ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />}
                          <span className={type.allowCustomBranding ? "text-foreground" : "text-muted-foreground"}>Custom Branding</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          {type.allowApiAccess ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />}
                          <span className={type.allowApiAccess ? "text-foreground" : "text-muted-foreground"}>API Access</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          {type.walletEnabled ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />}
                          <span className={type.walletEnabled ? "text-foreground" : "text-muted-foreground"}>Wallet</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {type.minCustomers || 0}–{type.maxCustomers || "∞"} customers
                        </div>
                      </div>
                      {features.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Features</p>
                          <div className="flex flex-wrap gap-1">
                            {features.map(f => (
                              <Badge key={f} variant="outline" className="text-[10px] font-normal">{f.trim()}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "add" && (
        <Form {...addForm}>
          <form onSubmit={addForm.handleSubmit(onAddSubmit)}>
            <div className="flex items-center gap-0 mb-6">
              {[
                { step: 1, label: "Personal Info", icon: User },
                { step: 2, label: "Packages", icon: Tag },
                { step: 3, label: "Network & Service", icon: Wifi },
                { step: 4, label: "Billing and Account", icon: CreditCard },
              ].map((s, i) => (
                <div key={s.step} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => setWizardStep(s.step)}
                    data-testid={`wizard-step-${s.step}`}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all w-full ${
                      wizardStep === s.step
                        ? "bg-blue-600 text-white shadow-md"
                        : wizardStep > s.step
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      wizardStep === s.step ? "bg-white text-blue-600" : wizardStep > s.step ? "bg-blue-200 text-blue-700" : "bg-gray-300 text-gray-600"
                    }`}>{s.step}</span>
                    <s.icon className="h-4 w-4 hidden sm:block" />
                    <span className="hidden md:inline">{s.label}</span>
                  </button>
                  {i < 3 && <ChevronRight className="h-4 w-4 mx-1 text-gray-400 flex-shrink-0" />}
                </div>
              ))}
            </div>

            {wizardStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" /> Personal Info</CardTitle>
                  <CardDescription>Enter the reseller's personal details and upload required documents.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={addForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl><Input placeholder="Full name" data-testid="input-add-reseller-name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addForm.control} name="gender" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger data-testid="select-add-reseller-gender"><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={addForm.control} name="occupation" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation</FormLabel>
                        <FormControl><Input placeholder="e.g. Engineer, Teacher" data-testid="input-add-reseller-occupation" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addForm.control} name="dateOfBirth" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl><Input type="date" data-testid="input-add-reseller-dob" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={addForm.control} name="fatherName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Father Name</FormLabel>
                        <FormControl><Input placeholder="Father's full name" data-testid="input-add-reseller-father-name" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addForm.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl><Input placeholder="Address" data-testid="input-add-reseller-address" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={addForm.control} name="cnic" render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNIC</FormLabel>
                        <FormControl><Input placeholder="National ID" data-testid="input-add-reseller-cnic" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addForm.control} name="registrationFormNo" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Form No</FormLabel>
                        <FormControl><Input placeholder="Registration form number" data-testid="input-add-reseller-reg-form-no" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={addForm.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks / Special Note</FormLabel>
                      <FormControl><Textarea placeholder="Any special notes or remarks..." rows={3} data-testid="input-add-reseller-notes" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Profile Picture</p>
                      <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors" data-testid="upload-profile-picture">
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{addForm.watch("profilePicture") ? "File uploaded" : "Choose file"}</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "profilePicture"); }} />
                      </label>
                      {addForm.watch("profilePicture") && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Uploaded</p>}
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">CNIC Picture</p>
                      <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors" data-testid="upload-cnic-picture">
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{addForm.watch("cnicPicture") ? "File uploaded" : "Choose file"}</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "cnicPicture"); }} />
                      </label>
                      {addForm.watch("cnicPicture") && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Uploaded</p>}
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Registration Form Picture</p>
                      <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors" data-testid="upload-reg-form-picture">
                        <Upload className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{addForm.watch("registrationFormPicture") ? "File uploaded" : "Choose file"}</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "registrationFormPicture"); }} />
                      </label>
                      {addForm.watch("registrationFormPicture") && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Uploaded</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {wizardStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Tag className="h-5 w-5" /> Packages</CardTitle>
                  <CardDescription>Select packages and configure reseller type, vendor, and commission settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Package Name <span className="text-red-500">*</span></label>
                      <Select onValueChange={(val) => setPkgForm(prev => ({ ...prev, packageId: val }))} value={pkgForm.packageId}>
                        <SelectTrigger data-testid="select-pkg-name" className="mt-1"><SelectValue placeholder="Select Package" /></SelectTrigger>
                        <SelectContent>
                          {(packagesList || []).map(p => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Speed</label>
                      <Input className="mt-1 bg-gray-50 dark:bg-gray-900" placeholder="e.g. 10 Mbps" readOnly value={selectedPkg?.speed || ""} data-testid="input-pkg-speed" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Data Limit</label>
                      <Input className="mt-1 bg-gray-50 dark:bg-gray-900" placeholder="Unlimited" readOnly value={selectedPkg?.dataLimit || "Unlimited"} data-testid="input-pkg-data-limit" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium">Vendor ID</label>
                      <Select onValueChange={(val) => setPkgForm(prev => ({ ...prev, vendorId: val }))} value={pkgForm.vendorId}>
                        <SelectTrigger data-testid="select-pkg-vendor" className="mt-1"><SelectValue placeholder="Vendor Name" /></SelectTrigger>
                        <SelectContent>
                          {(vendors || []).map(v => (
                            <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Vendor Price</label>
                      <Input type="number" step="0.01" className="mt-1" placeholder="0" value={pkgForm.vendorPrice} onChange={(e) => setPkgForm(prev => ({ ...prev, vendorPrice: e.target.value }))} data-testid="input-pkg-vendor-price" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Reseller Price</label>
                      <Input type="number" step="0.01" className="mt-1" placeholder="0" value={pkgForm.resellerPrice} onChange={(e) => setPkgForm(prev => ({ ...prev, resellerPrice: e.target.value }))} data-testid="input-pkg-reseller-price" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Profit</label>
                      <Input className="mt-1 bg-gray-50 dark:bg-gray-900 font-semibold" readOnly value={pkgProfit} data-testid="input-pkg-profit" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setPkgForm({ packageId: "", vendorId: "", vendorPrice: "0", resellerPrice: "0" })} data-testid="button-pkg-cancel">Cancel</Button>
                    <Button type="button" onClick={handleAddPackage} disabled={!selectedPkg} data-testid="button-add-package" className="bg-blue-600 hover:bg-blue-700">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Add Package
                    </Button>
                  </div>

                  {addedPackages.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-semibold mb-3">Added Packages ({addedPackages.length})</p>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700">
                            <TableHead className="text-white">Package</TableHead>
                            <TableHead className="text-white">Speed</TableHead>
                            <TableHead className="text-white">Data Limit</TableHead>
                            <TableHead className="text-white">Vendor</TableHead>
                            <TableHead className="text-white">Vendor Price</TableHead>
                            <TableHead className="text-white">Reseller Price</TableHead>
                            <TableHead className="text-white">Profit</TableHead>
                            <TableHead className="text-white">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {addedPackages.map((p, idx) => (
                            <TableRow key={p.packageId} className={idx % 2 === 0 ? "bg-white dark:bg-gray-950" : "bg-gray-50 dark:bg-gray-900"}>
                              <TableCell className="font-medium">{p.packageName}</TableCell>
                              <TableCell>{p.speed}</TableCell>
                              <TableCell>{p.dataLimit}</TableCell>
                              <TableCell>{p.vendorId}</TableCell>
                              <TableCell>{formatPKR(p.vendorPrice)}</TableCell>
                              <TableCell>{formatPKR(p.resellerPrice)}</TableCell>
                              <TableCell className={parseFloat(p.profit) >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{formatPKR(p.profit)}</TableCell>
                              <TableCell>
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemovePackage(p.packageId)} data-testid={`button-remove-pkg-${p.packageId}`}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {wizardStep === 3 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg py-3 px-4">
                    <CardTitle className="text-base flex items-center gap-2"><Network className="h-5 w-5" /> NETWORK</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={addForm.control} name="joinDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Join Date</FormLabel>
                          <FormControl><Input type="date" data-testid="input-add-reseller-join-date" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addForm.control} name="uplinkType" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Uplink Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger data-testid="select-add-reseller-uplink-type"><SelectValue placeholder="Select uplink type" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="exchange">Exchange</SelectItem>
                              <SelectItem value="tower">Tower</SelectItem>
                              <SelectItem value="pop">POP</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addForm.control} name="uplink" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Uplink</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger data-testid="select-add-reseller-uplink"><SelectValue placeholder="Select uplink" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="fiber">Fiber</SelectItem>
                              <SelectItem value="wireless">Wireless</SelectItem>
                              <SelectItem value="ethernet">Ethernet</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={addForm.control} name="exchangeTowerPopName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exchange / Tower / POP Name</FormLabel>
                          <FormControl><Input placeholder="Enter name" data-testid="input-add-reseller-exchange-name" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addForm.control} name="portId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port ID</FormLabel>
                          <FormControl><Input placeholder="Enter port ID" data-testid="input-add-reseller-port-id" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addForm.control} name="vlanId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vlan ID</FormLabel>
                          <FormControl><Input placeholder="Enter VLAN ID" data-testid="input-add-reseller-vlan-id" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={addForm.control} name="media" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Media</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl><SelectTrigger data-testid="select-add-reseller-media"><SelectValue placeholder="Select media" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="dish">Dish</SelectItem>
                              <SelectItem value="sfp">SFP</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg py-3 px-4">
                    <CardTitle className="text-base flex items-center gap-2"><Globe className="h-5 w-5" /> SERVICES</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={addForm.control} name="vendorPanelAllowed" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vendor Panel Allowed</FormLabel>
                          <div className="flex items-center gap-3 pt-1">
                            <button
                              type="button"
                              data-testid="toggle-add-reseller-vendor-panel"
                              onClick={() => field.onChange(!field.value)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${field.value ? "bg-blue-600" : "bg-gray-300"}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${field.value ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                            <span className={`text-sm font-medium ${field.value ? "text-blue-600" : "text-gray-500"}`}>{field.value ? "Yes" : "No"}</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className="border rounded-lg p-4 bg-slate-50/50 space-y-4">
                      <h4 className="text-sm font-semibold text-slate-700">Add Vendor Panel</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Vendor Name <span className="text-red-500">*</span></label>
                          <Select value={vpForm.vendorId} onValueChange={(val) => setVpForm({ ...vpForm, vendorId: val })}>
                            <SelectTrigger data-testid="select-add-vp-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                            <SelectContent>{(vendors || []).map((v) => (<SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Panel URL <span className="text-red-500">*</span></label>
                          <Input placeholder="https://panel.example.com" data-testid="input-add-vp-panel-url" value={vpForm.panelUrl} onChange={(e) => setVpForm({ ...vpForm, panelUrl: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Panel Login Username <span className="text-red-500">*</span></label>
                          <Input placeholder="Enter username" data-testid="input-add-vp-panel-username" value={vpForm.panelUsername} onChange={(e) => setVpForm({ ...vpForm, panelUsername: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Panel Login Password <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <Input
                              type={showVpPassword ? "text" : "password"}
                              placeholder="Enter password"
                              data-testid="input-add-vp-panel-password"
                              value={vpForm.panelPassword}
                              onChange={(e) => setVpForm({ ...vpForm, panelPassword: e.target.value })}
                            />
                            <button
                              type="button"
                              data-testid="toggle-vp-password-visibility"
                              onClick={() => setShowVpPassword(!showVpPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showVpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" size="sm" data-testid="btn-cancel-vp" onClick={() => { setVpForm({ vendorId: "", panelUrl: "", panelUsername: "", panelPassword: "" }); setShowVpPassword(false); }}>Cancel</Button>
                        <Button type="button" size="sm" data-testid="btn-add-vp" className="bg-gradient-to-r from-[#002B5B] to-[#007BFF] text-white" onClick={() => {
                          if (!vpForm.vendorId || !vpForm.panelUrl || !vpForm.panelUsername || !vpForm.panelPassword) return;
                          const vendor = (vendors || []).find(v => v.id === parseInt(vpForm.vendorId));
                          const newPanel = {
                            vendorId: parseInt(vpForm.vendorId),
                            vendorName: vendor?.name || "Unknown",
                            panelUrl: vpForm.panelUrl,
                            panelUsername: vpForm.panelUsername,
                            panelPassword: vpForm.panelPassword,
                          };
                          const updated = [...addedVendorPanels, newPanel];
                          setAddedVendorPanels(updated);
                          addForm.setValue("assignedVendorPanels", JSON.stringify(updated));
                          setVpForm({ vendorId: "", panelUrl: "", panelUsername: "", panelPassword: "" });
                          setShowVpPassword(false);
                        }}>
                          <Plus className="h-4 w-4 mr-1" /> Add Vendor Panel
                        </Button>
                      </div>
                    </div>

                    {addedVendorPanels.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                              <th className="px-3 py-2 text-left font-medium">Vendor Name</th>
                              <th className="px-3 py-2 text-left font-medium">Panel URL</th>
                              <th className="px-3 py-2 text-left font-medium">Username</th>
                              <th className="px-3 py-2 text-left font-medium">Password</th>
                              <th className="px-3 py-2 text-center font-medium w-16">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {addedVendorPanels.map((vp, idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                <td className="px-3 py-2 font-medium text-slate-700">{vp.vendorName}</td>
                                <td className="px-3 py-2 text-blue-600 underline truncate max-w-[200px]" title={vp.panelUrl}>{vp.panelUrl}</td>
                                <td className="px-3 py-2">{vp.panelUsername}</td>
                                <td className="px-3 py-2 font-mono text-xs">{"••••••••"}</td>
                                <td className="px-3 py-2 text-center">
                                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    data-testid={`btn-delete-vp-${idx}`}
                                    onClick={() => {
                                      const updated = addedVendorPanels.filter((_, i) => i !== idx);
                                      setAddedVendorPanels(updated);
                                      addForm.setValue("assignedVendorPanels", updated.length > 0 ? JSON.stringify(updated) : "");
                                    }}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <FormField control={addForm.control} name="vlanIdAllowed" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vlan ID Allowed</FormLabel>
                          <div className="flex items-center gap-3 pt-1">
                            <button
                              type="button"
                              data-testid="toggle-add-reseller-vlan-allowed"
                              onClick={() => field.onChange(!field.value)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${field.value ? "bg-blue-600" : "bg-gray-300"}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${field.value ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                            <span className={`text-sm font-medium ${field.value ? "text-blue-600" : "text-gray-500"}`}>{field.value ? "Yes" : "No"}</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="md:col-span-2">
                        <FormField control={addForm.control} name="vlanIdNote" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vlan ID Note</FormLabel>
                            <FormControl><Input placeholder="Enter VLAN ID note" data-testid="input-add-reseller-vlan-note" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {wizardStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5" /> Billing and Account</CardTitle>
                  <CardDescription>Set up billing, banking, agreement, and financial details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={addForm.control} name="walletBalance" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Wallet Balance</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-add-reseller-wallet-balance" {...field} value={field.value || "0"} onChange={(e) => field.onChange(e.target.value)} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addForm.control} name="creditLimit" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credit Limit</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-add-reseller-credit-limit" {...field} value={field.value || "0"} onChange={(e) => field.onChange(e.target.value)} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addForm.control} name="securityDeposit" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Deposit</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-add-reseller-security-deposit" {...field} value={field.value || "0"} onChange={(e) => field.onChange(e.target.value)} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={addForm.control} name="openingBalance" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opening Balance</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-add-reseller-opening-balance" {...field} value={field.value || "0"} onChange={(e) => field.onChange(e.target.value)} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addForm.control} name="billingCycle" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Cycle</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "monthly"}>
                          <FormControl><SelectTrigger data-testid="select-add-reseller-billing-cycle"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addForm.control} name="paymentMethod" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "cash"}>
                          <FormControl><SelectTrigger data-testid="select-add-reseller-payment-method"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="online">Online Payment</SelectItem>
                            <SelectItem value="wallet">Wallet</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={addForm.control} name="ntn" render={({ field }) => (
                      <FormItem>
                        <FormLabel>NTN (National Tax Number)</FormLabel>
                        <FormControl><Input placeholder="NTN number" data-testid="input-add-reseller-ntn" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addForm.control} name="status" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "active"}>
                          <FormControl><SelectTrigger data-testid="select-add-reseller-status"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="border-t pt-4 mt-2">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3"><Landmark className="h-4 w-4" /> Bank Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={addForm.control} name="bankName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl><Input placeholder="e.g. HBL, MCB, UBL" data-testid="input-add-reseller-bank-name" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addForm.control} name="bankAccountTitle" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Title</FormLabel>
                          <FormControl><Input placeholder="Account holder name" data-testid="input-add-reseller-bank-title" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <FormField control={addForm.control} name="bankAccountNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account / IBAN Number</FormLabel>
                          <FormControl><Input placeholder="Account number or IBAN" data-testid="input-add-reseller-bank-account" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addForm.control} name="bankBranchCode" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch Code</FormLabel>
                          <FormControl><Input placeholder="Branch code" data-testid="input-add-reseller-bank-branch" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                  <div className="border-t pt-4 mt-2">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3"><ScrollText className="h-4 w-4" /> Agreement & Contract</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={addForm.control} name="agreementType" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agreement Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "standard"}>
                            <FormControl><SelectTrigger data-testid="select-add-reseller-agreement-type"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addForm.control} name="agreementStartDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl><Input type="date" data-testid="input-add-reseller-agreement-start" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={addForm.control} name="agreementEndDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl><Input type="date" data-testid="input-add-reseller-agreement-end" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="mt-3">
                      <FormField control={addForm.control} name="autoRenewal" render={({ field }) => (
                        <FormItem className="flex items-center gap-3 space-y-0">
                          <FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="switch-add-reseller-auto-renewal" /></FormControl>
                          <FormLabel className="cursor-pointer">Auto Renewal</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between items-center pt-2">
              <div>
                {wizardStep > 1 && (
                  <Button type="button" variant="outline" onClick={() => setWizardStep(wizardStep - 1)} data-testid="button-wizard-back">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                )}
                {wizardStep === 1 && (
                  <Button type="button" variant="outline" onClick={() => { addForm.reset(); setWizardStep(1); }} data-testid="button-wizard-cancel">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                {wizardStep < 4 && (
                  <Button type="button" onClick={() => setWizardStep(wizardStep + 1)} data-testid="button-wizard-next" className="bg-blue-600 hover:bg-blue-700">
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
                {wizardStep === 4 && (
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-add-reseller" className="bg-blue-600 hover:bg-blue-700">
                    {createMutation.isPending ? "Creating..." : "Create Reseller"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      )}

      {tab === "list" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Total Resellers", value: totalResellers, icon: Users, color: "from-blue-600 to-blue-500", textColor: "text-white" },
              { label: "Active Resellers", value: activeResellers, icon: CheckCircle2, color: "from-green-600 to-green-500", textColor: "text-white" },
              { label: "Suspended", value: suspendedResellers, icon: Ban, color: "from-red-600 to-red-500", textColor: "text-white" },
              { label: "Total Revenue", value: formatPKR(totalRevenue), icon: TrendingUp, color: "from-teal-600 to-teal-500", textColor: "text-white", isFinancial: true },
              { label: "Outstanding", value: formatPKR(outstandingBalance), icon: AlertTriangle, color: "from-orange-600 to-orange-500", textColor: "text-white", isFinancial: true },
              { label: "Avg Commission", value: totalResellers > 0 ? (totalCommission / totalResellers).toFixed(1) + "%" : "0%", icon: Percent, color: "from-purple-600 to-purple-500", textColor: "text-white" },
            ].map((kpi, idx) => (
              <Card key={idx} className={`bg-gradient-to-br ${kpi.color} border-0 shadow-lg overflow-hidden relative`} data-testid={`kpi-card-${idx}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-white/80">{kpi.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${kpi.textColor}`} data-testid={`kpi-value-${idx}`}>
                        {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
                      </p>
                    </div>
                    <div className="bg-white/15 p-2 rounded-lg">
                      <kpi.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4" /> Advanced Filter & Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                <div className="relative flex-1 w-full sm:max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, phone, email, company..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-resellers"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Suspended</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={areaFilter} onValueChange={setAreaFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-area-filter">
                    <SelectValue placeholder="Area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    {allAreas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: "credit_exceeded", label: "Credit Limit Exceeded", icon: AlertTriangle, color: "text-orange-700 bg-orange-50 border-orange-200" },
                  { key: "suspended", label: "Suspended", icon: Ban, color: "text-red-700 bg-red-50 border-red-200" },
                ].map(qf => (
                  <Button
                    key={qf.key}
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid={`quick-filter-${qf.key}`}
                    className={`text-xs gap-1 ${quickFilter === qf.key ? qf.color + " border-2 font-semibold" : ""}`}
                    onClick={() => setQuickFilter(quickFilter === qf.key ? "" : qf.key)}
                  >
                    <qf.icon className="h-3 w-3" /> {qf.label}
                  </Button>
                ))}
                {(search || statusFilter !== "all" || areaFilter !== "all" || quickFilter) && (
                  <Button type="button" variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={() => { setSearch(""); setStatusFilter("all"); setAreaFilter("all"); setQuickFilter(""); }} data-testid="btn-clear-filters">
                    <X className="h-3 w-3" /> Clear All
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Reseller List</CardTitle>
                <Badge variant="secondary" className="no-default-active-elevate">{filtered.length} of {totalResellers}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-14 w-full" />))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Handshake className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No resellers found</p>
                  <p className="text-sm mt-1">Adjust filters or add your first reseller</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#1c67d4] text-white">
                        <th className="px-3 py-2.5 text-left font-medium text-xs">Reseller Name</th>
                        <th className="px-3 py-2.5 text-left font-medium text-xs hidden md:table-cell">Contact</th>
                        <th className="px-3 py-2.5 text-left font-medium text-xs hidden md:table-cell">Area / Zone</th>
                        <th className="px-3 py-2.5 text-left font-medium text-xs hidden lg:table-cell">Vendor Type</th>
                        <th className="px-3 py-2.5 text-right font-medium text-xs hidden lg:table-cell">Credit Balance</th>
                        <th className="px-3 py-2.5 text-right font-medium text-xs hidden lg:table-cell">Credit Limit</th>
                        <th className="px-3 py-2.5 text-left font-medium text-xs hidden lg:table-cell">Commission</th>
                        <th className="px-3 py-2.5 text-center font-medium text-xs hidden md:table-cell">Customers</th>
                        <th className="px-3 py-2.5 text-center font-medium text-xs">Status</th>
                        <th className="px-3 py-2.5 text-center font-medium text-xs w-14">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((reseller, idx) => {
                        const walletBal = parseFloat(String(reseller.walletBalance || "0"));
                        const creditLim = parseFloat(String(reseller.creditLimit || "0"));
                        const isLowCredit = walletBal < 0;
                        return (
                          <tr
                            key={reseller.id}
                            data-testid={`row-reseller-${reseller.id}`}
                            className={`border-b border-slate-100 dark:border-slate-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer ${idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/60"}`}
                            onClick={() => setLocation(`/resellers/${reseller.id}`)}
                          >
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#002B5B] to-[#007BFF] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {reseller.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm" data-testid={`text-name-${reseller.id}`}>{reseller.name}</div>
                                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" /> {reseller.phone}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 hidden md:table-cell">
                              <div className="text-sm">{reseller.contactName || "—"}</div>
                              <div className="text-[11px] text-muted-foreground">{reseller.email || ""}</div>
                            </td>
                            <td className="px-3 py-2.5 hidden md:table-cell">
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span>{reseller.area || reseller.city || "—"}</span>
                              </div>
                              {reseller.territory && <div className="text-[11px] text-muted-foreground">{reseller.territory}</div>}
                            </td>
                            <td className="px-3 py-2.5 hidden lg:table-cell">
                              <span className="text-sm">{getVendorName(reseller.vendorId)}</span>
                            </td>
                            <td className="px-3 py-2.5 hidden lg:table-cell text-right">
                              <span className={`text-sm font-semibold tabular-nums ${isLowCredit ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-100"}`} data-testid={`text-wallet-${reseller.id}`}>
                                {formatPKR(reseller.walletBalance)}
                              </span>
                              {isLowCredit && <div className="text-[10px] text-red-500 flex items-center justify-end gap-0.5"><AlertTriangle className="h-3 w-3" /> Low</div>}
                            </td>
                            <td className="px-3 py-2.5 hidden lg:table-cell text-right">
                              <span className="text-sm tabular-nums text-slate-600">{formatPKR(reseller.creditLimit)}</span>
                            </td>
                            <td className="px-3 py-2.5 hidden lg:table-cell">
                              {(() => {
                                const ct = (reseller as any).commissionType || "fixed_rate";
                                const rate = reseller.commissionRate || "10";
                                const profitRate = (reseller as any).commissionProfitRate || "0";
                                return (
                                  <div className="space-y-0.5">
                                    {(ct === "fixed_rate" || ct === "both") && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Fixed</span>
                                        <span className="text-sm font-bold text-teal-700 dark:text-teal-400">{rate}%</span>
                                      </div>
                                    )}
                                    {(ct === "profit_percentage" || ct === "both") && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Profit</span>
                                        <span className="text-sm font-bold text-purple-700 dark:text-purple-400">{profitRate}%</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-3 py-2.5 hidden md:table-cell text-center">
                              <span className="text-sm font-medium">{reseller.totalCustomers || 0}</span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <Badge
                                variant="secondary"
                                className={`no-default-active-elevate text-[10px] capitalize ${statusColors[reseller.status] || ""}`}
                                data-testid={`badge-status-${reseller.id}`}
                              >
                                {reseller.status === "inactive" ? "Suspended" : reseller.status}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-actions-${reseller.id}`}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                  <DropdownMenuItem onClick={() => setLocation(`/resellers/${reseller.id}`)} data-testid={`action-view-${reseller.id}`}>
                                    <Eye className="h-4 w-4 mr-2" /> View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setLocation(`/resellers/${reseller.id}/edit`)} data-testid={`button-edit-${reseller.id}`}>
                                    <Edit className="h-4 w-4 mr-2" /> Edit Reseller
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setRechargeReseller(reseller); setRechargeVendorRows([{ id: "1", vendorId: "", amount: "" }]); setRechargeVendorId(""); setRechargePaidAmount(""); setRechargeReference(""); setRechargePaymentMethod("cash_in_hand"); setRechargePaymentStatus("paid"); setRechargeRemarks(""); setRechargeBankAccountId(""); setRechargeSenderName(""); setRechargeDialogOpen(true); }} data-testid={`action-credit-${reseller.id}`}>
                                    <Wallet className="h-4 w-4 mr-2" /> Adjust Credit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedWalletResellerId(String(reseller.id)); changeTab("wallet"); }} data-testid={`action-transactions-${reseller.id}`}>
                                    <FileText className="h-4 w-4 mr-2" /> View Transactions
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const newStatus = reseller.status === "active" ? "inactive" : "active";
                                      editMutation.mutate({ id: reseller.id, data: { ...reseller, status: newStatus } as InsertReseller });
                                    }}
                                    data-testid={`action-toggle-status-${reseller.id}`}
                                  >
                                    {reseller.status === "active" ? (
                                      <><Ban className="h-4 w-4 mr-2 text-red-500" /> <span className="text-red-600">Suspend</span></>
                                    ) : (
                                      <><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> <span className="text-green-600">Activate</span></>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => deleteMutation.mutate(reseller.id)}
                                    className="text-destructive"
                                    data-testid={`button-delete-${reseller.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {detailReseller && (
        <div className="fixed inset-0 z-50 flex justify-end" data-testid="reseller-detail-panel">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailReseller(null)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-950 shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="bg-gradient-to-r from-[#002B5B] to-[#007BFF] text-white p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold">Reseller Details</h3>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => setDetailReseller(null)} data-testid="btn-close-detail">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                  {detailReseller.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-lg">{detailReseller.name}</div>
                  <div className="text-sm text-white/80">{detailReseller.phone} {detailReseller.email ? `• ${detailReseller.email}` : ""}</div>
                </div>
              </div>
              <Badge className={`mt-2 text-[10px] capitalize ${detailReseller.status === "active" ? "bg-green-500/30 text-green-100 border-green-400/50" : "bg-red-500/30 text-red-100 border-red-400/50"}`}>
                {detailReseller.status === "inactive" ? "Suspended" : detailReseller.status}
              </Badge>
            </div>

            <div className="flex border-b bg-slate-50">
              {[
                { key: "profile", label: "Profile", icon: Building2 },
                { key: "customers", label: "Customers", icon: Users },
                { key: "financial", label: "Financial", icon: DollarSign },
                { key: "panel", label: "Panel", icon: Globe },
              ].map(t => (
                <button
                  key={t.key}
                  type="button"
                  data-testid={`detail-tab-${t.key}`}
                  onClick={() => setDetailTab(t.key)}
                  className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1 border-b-2 transition-colors ${detailTab === t.key ? "border-blue-600 text-blue-700 bg-white" : "border-transparent text-muted-foreground hover:text-slate-600"}`}
                >
                  <t.icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {detailTab === "profile" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Contact Person", value: detailReseller.contactName || "—" },
                      { label: "CNIC", value: detailReseller.cnic || "—" },
                      { label: "NTN", value: detailReseller.ntn || "—" },
                      { label: "Father Name", value: detailReseller.fatherName || "—" },
                      { label: "Gender", value: detailReseller.gender ? detailReseller.gender.charAt(0).toUpperCase() + detailReseller.gender.slice(1) : "—" },
                      { label: "Date of Birth", value: detailReseller.dateOfBirth || "—" },
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-3">
                        <div className="text-[11px] text-muted-foreground font-medium">{item.label}</div>
                        <div className="text-sm font-medium text-slate-800 mt-0.5">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-[11px] text-muted-foreground font-medium">Address</div>
                    <div className="text-sm text-slate-800 mt-0.5">{detailReseller.address || "—"}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "City", value: detailReseller.city || "—" },
                      { label: "Area", value: detailReseller.area || "—" },
                      { label: "Territory", value: detailReseller.territory || "—" },
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-3">
                        <div className="text-[11px] text-muted-foreground font-medium">{item.label}</div>
                        <div className="text-sm font-medium text-slate-800 mt-0.5">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Vendor", value: getVendorName(detailReseller.vendorId) },
                      { label: "Join Date", value: detailReseller.joinDate || "—" },
                      { label: "Agreement Start", value: detailReseller.agreementStartDate || "—" },
                      { label: "Agreement End", value: detailReseller.agreementEndDate || "—" },
                      { label: "Uplink Type", value: detailReseller.uplinkType ? detailReseller.uplinkType.charAt(0).toUpperCase() + detailReseller.uplinkType.slice(1) : "—" },
                      { label: "Uplink", value: detailReseller.uplink ? detailReseller.uplink.charAt(0).toUpperCase() + detailReseller.uplink.slice(1) : "—" },
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-3">
                        <div className="text-[11px] text-muted-foreground font-medium">{item.label}</div>
                        <div className="text-sm font-medium text-slate-800 mt-0.5">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailTab === "customers" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Total Customers</p>
                        <p className="text-2xl font-bold text-green-700" data-testid="detail-total-customers">{detailReseller.totalCustomers || 0}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Max Limit</p>
                        <p className="text-2xl font-bold text-blue-700">{detailReseller.maxCustomerLimit || "Unlimited"}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Customer details will be shown here once connected</p>
                  </div>
                </div>
              )}

              {detailTab === "financial" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Credit Balance", value: formatPKR(detailReseller.walletBalance), color: parseFloat(String(detailReseller.walletBalance || "0")) < 0 ? "text-red-700" : "text-green-700" },
                      { label: "Credit Limit", value: formatPKR(detailReseller.creditLimit), color: "text-blue-700" },
                      { label: "Security Deposit", value: formatPKR(detailReseller.securityDeposit), color: "text-slate-700" },
                      { label: "Opening Balance", value: formatPKR(detailReseller.openingBalance), color: "text-slate-700" },
                    ].map((item, i) => (
                      <Card key={i} className="border-l-4 border-l-teal-500">
                        <CardContent className="p-3">
                          <p className="text-[11px] text-muted-foreground">{item.label}</p>
                          <p className={`text-lg font-bold tabular-nums ${item.color}`}>{item.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="rounded-lg border border-teal-100 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/20 p-3 space-y-2">
                    <div className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wide">Commission Details</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white dark:bg-slate-900 rounded-md p-2">
                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Type</div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-0.5 capitalize">
                          {(detailReseller as any).commissionType === "profit_percentage" ? "% of Profit" : (detailReseller as any).commissionType === "both" ? "Fixed + Profit %" : "Fixed Rate %"}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-md p-2">
                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Payment</div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 mt-0.5 capitalize">{(detailReseller.commissionPaymentMethod || "wallet").replace(/_/g, " ")} · {detailReseller.commissionPaymentFrequency || "monthly"}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {((detailReseller as any).commissionType === "fixed_rate" || (detailReseller as any).commissionType === "both" || !(detailReseller as any).commissionType) && (
                        <div className="bg-teal-100/60 dark:bg-teal-900/30 rounded-md p-2">
                          <div className="text-[10px] text-teal-700 dark:text-teal-300 font-medium uppercase tracking-wide">Fixed Rate</div>
                          <div className="text-lg font-bold text-teal-700 dark:text-teal-400">{detailReseller.commissionRate || "10"}%</div>
                          <div className="text-[10px] text-muted-foreground">of selling price</div>
                        </div>
                      )}
                      {((detailReseller as any).commissionType === "profit_percentage" || (detailReseller as any).commissionType === "both") && (
                        <div className="bg-purple-100/60 dark:bg-purple-900/30 rounded-md p-2">
                          <div className="text-[10px] text-purple-700 dark:text-purple-300 font-medium uppercase tracking-wide">Profit Rate</div>
                          <div className="text-lg font-bold text-purple-700 dark:text-purple-400">{(detailReseller as any).commissionProfitRate || "0"}%</div>
                          <div className="text-[10px] text-muted-foreground">of package profit</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Billing Cycle", value: (detailReseller.billingCycle || "monthly") },
                      { label: "Payment Method", value: (detailReseller.commissionPaymentMethod || "wallet").replace(/_/g, " ") },
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                        <div className="text-[11px] text-muted-foreground font-medium">{item.label}</div>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-0.5 capitalize">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Bank Name", value: detailReseller.bankName || "—" },
                      { label: "Account Title", value: detailReseller.bankAccountTitle || "—" },
                      { label: "Account Number", value: detailReseller.bankAccountNumber || "—" },
                      { label: "Branch Code", value: detailReseller.bankBranchCode || "—" },
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-3">
                        <div className="text-[11px] text-muted-foreground font-medium">{item.label}</div>
                        <div className="text-sm font-medium text-slate-800 mt-0.5">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailTab === "panel" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-[11px] text-muted-foreground font-medium">Vendor Panel Allowed</div>
                      <Badge className={`mt-1 text-[10px] ${detailReseller.vendorPanelAllowed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {detailReseller.vendorPanelAllowed ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-[11px] text-muted-foreground font-medium">VLAN ID Allowed</div>
                      <Badge className={`mt-1 text-[10px] ${detailReseller.vlanIdAllowed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {detailReseller.vlanIdAllowed ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                  {detailReseller.vlanIdNote && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-[11px] text-muted-foreground font-medium">VLAN ID Note</div>
                      <div className="text-sm text-slate-800 mt-0.5">{detailReseller.vlanIdNote}</div>
                    </div>
                  )}
                  {(() => {
                    let panels: Array<{ vendorName: string; panelUrl: string; panelUsername: string }> = [];
                    try { if (detailReseller.assignedVendorPanels) panels = JSON.parse(detailReseller.assignedVendorPanels); } catch {}
                    if (panels.length === 0) return (
                      <div className="bg-slate-50 rounded-lg p-6 text-center text-muted-foreground">
                        <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No vendor panels assigned</p>
                      </div>
                    );
                    return (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-slate-700">Assigned Vendor Panels</h4>
                        {panels.map((p, i) => (
                          <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-sm text-slate-800">{p.vendorName}</div>
                              <Badge variant="outline" className="text-[10px]">Panel #{i + 1}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                              <div><span className="text-muted-foreground">URL:</span> <span className="text-blue-600">{p.panelUrl}</span></div>
                              <div><span className="text-muted-foreground">Username:</span> {p.panelUsername}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Port ID", value: detailReseller.portId || "—" },
                      { label: "VLAN ID", value: detailReseller.vlanId || "—" },
                      { label: "Media", value: detailReseller.media ? detailReseller.media.toUpperCase() : "—" },
                      { label: "Exchange/Tower/POP", value: detailReseller.exchangeTowerPopName || "—" },
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-3">
                        <div className="text-[11px] text-muted-foreground font-medium">{item.label}</div>
                        <div className="text-sm font-medium text-slate-800 mt-0.5">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t">
                <Button size="sm" className="flex-1 bg-gradient-to-r from-[#002B5B] to-[#007BFF] text-white" onClick={() => { setLocation(`/resellers/${detailReseller.id}/edit`); setDetailReseller(null); }} data-testid="detail-btn-edit">
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setRechargeReseller(detailReseller); setRechargeVendorRows([{ id: "1", vendorId: "", amount: "" }]); setRechargeVendorId(""); setRechargePaidAmount(""); setRechargeReference(""); setRechargePaymentMethod("cash_in_hand"); setRechargePaymentStatus("paid"); setRechargeRemarks(""); setRechargeBankAccountId(""); setRechargeSenderName(""); setRechargeDialogOpen(true); setDetailReseller(null); }} data-testid="detail-btn-credit">
                  <Wallet className="h-4 w-4 mr-1" /> Adjust Credit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "wallet" && (() => {
        const isAllResellers = selectedWalletResellerId === "all";
        const selReseller = selectedWalletResellerId && !isAllResellers ? (resellers || []).find(r => r.id === parseInt(selectedWalletResellerId)) : null;
        const allResellers = resellers || [];
        const walletBal = isAllResellers ? allResellers.reduce((s, r) => s + parseFloat(String(r.walletBalance || "0")), 0) : (selReseller ? parseFloat(String(selReseller.walletBalance || "0")) : 0);
        const creditLim = isAllResellers ? allResellers.reduce((s, r) => s + parseFloat(String(r.creditLimit || "0")), 0) : (selReseller ? parseFloat(String(selReseller.creditLimit || "0")) : 0);
        const availableCredit = creditLim + walletBal;
        const isLowBalance = !isAllResellers && walletBal < 500 && walletBal >= 0;
        const isCreditExceeded = !isAllResellers && walletBal < 0 && Math.abs(walletBal) > creditLim;
        const txns = walletTransactions || [];
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const monthTxns = txns.filter(t => { const d = new Date(t.createdAt); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; });
        const totalRechargeMonth = monthTxns.filter(t => t.type === "credit" && t.category === "recharge").reduce((s, t) => s + parseFloat(String(t.amount || "0")), 0);
        const totalDeductionMonth = monthTxns.filter(t => t.type === "debit" && t.category !== "credit_balance_payment").reduce((s, t) => s + parseFloat(String(t.amount || "0")), 0);
        const totalPaidMonth = monthTxns.filter(t => t.type === "credit" && (t as any).paymentStatus === "paid" && t.category === "recharge").reduce((s, t) => s + parseFloat(String((t as any).paidAmount || t.amount || "0")), 0);
        const totalUnpaidAll = txns.filter(t => t.type === "credit" && ((t as any).paymentStatus === "unpaid" || (t as any).paymentStatus === "partial")).reduce((s, t) => {
          const amt = parseFloat(String(t.amount || "0"));
          const paid = parseFloat(String((t as any).paidAmount || "0"));
          return s + (amt - paid);
        }, 0);
        const secDeposit = isAllResellers ? allResellers.reduce((s, r) => s + parseFloat(String(r.securityDeposit || "0")), 0) : (selReseller ? parseFloat(String(selReseller.securityDeposit || "0")) : 0);
        const filteredTxns = txns.filter(t => {
          const matchType = txnTypeFilter === "all" || t.type === txnTypeFilter;
          const matchSearch = !txnSearch || (t.reference || "").toLowerCase().includes(txnSearch.toLowerCase()) || (t.description || "").toLowerCase().includes(txnSearch.toLowerCase());
          return matchType && matchSearch;
        });
        return (
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Wallet className="h-5 w-5" /> Select Reseller</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Select value={selectedWalletResellerId} onValueChange={(val) => { setSelectedWalletResellerId(val); setTxnTypeFilter("all"); setTxnSearch(""); }}>
                  <SelectTrigger className="w-full sm:w-[300px]" data-testid="select-wallet-reseller">
                    <SelectValue placeholder="Choose a reseller to manage wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resellers</SelectItem>
                    {(resellers || []).map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.name} — {formatPKR(r.walletBalance)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isAllResellers && (
                  <Badge variant="secondary" className="no-default-active-elevate text-[10px]">
                    <Users className="h-3 w-3 mr-1" /> {allResellers.length} Resellers
                  </Badge>
                )}
                {selReseller && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selReseller.phone}</span>
                    {selReseller.area && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {selReseller.area}</span>}
                    <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[selReseller.status] || ""}`}>
                      {selReseller.status === "inactive" ? "Suspended" : selReseller.status}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {(selReseller || isAllResellers) && (
            <>
              {isCreditExceeded && (
                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-3" data-testid="alert-credit-exceeded">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">Credit Limit Exceeded</p>
                    <p className="text-xs text-red-600 dark:text-red-500">This reseller has exceeded their credit limit. Consider suspending or adjusting the limit.</p>
                  </div>
                </div>
              )}
              {isLowBalance && (
                <div className="bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg p-3 flex items-center gap-3" data-testid="alert-low-balance">
                  <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">Low Balance Warning</p>
                    <p className="text-xs text-orange-600 dark:text-orange-500">Wallet balance is below PKR 500. Recharge recommended.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  {
                    label: isAllResellers ? "Total Wallet Balance" : "Wallet Balance",
                    sublabel: "Current Month",
                    value: formatPKR(walletBal),
                    sub: `${monthTxns.filter(t => t.type === "credit").length} recharges this month`,
                    icon: Wallet,
                    color: walletBal < 0 ? "from-red-600 to-red-500" : "from-emerald-600 to-emerald-500",
                    badge: walletBal < 0 ? "Overdrawn" : null,
                    badgeColor: "bg-white/20",
                  },
                  {
                    label: "Recharge",
                    sublabel: "Current Month",
                    value: formatPKR(totalRechargeMonth),
                    sub: `${monthTxns.filter(t => t.type === "credit").length} transactions`,
                    icon: ArrowUpCircle,
                    color: "from-teal-600 to-teal-500",
                    badge: null, badgeColor: "",
                  },
                  {
                    label: "Paid Payment",
                    sublabel: "Current Month",
                    value: formatPKR(totalPaidMonth),
                    sub: `${monthTxns.filter(t => t.type === "credit" && (t as any).paymentStatus === "paid").length} paid transactions`,
                    icon: CheckCircle2,
                    color: "from-green-600 to-green-500",
                    badge: null, badgeColor: "",
                  },
                  {
                    label: "Unpaid Balance",
                    sublabel: "All-time Unpaid",
                    value: formatPKR(totalUnpaidAll),
                    sub: `${txns.filter(t => t.type === "credit" && ((t as any).paymentStatus === "unpaid" || (t as any).paymentStatus === "partial")).length} unpaid entries`,
                    icon: AlertTriangle,
                    color: totalUnpaidAll > 0 ? "from-rose-600 to-rose-500" : "from-slate-500 to-slate-400",
                    badge: totalUnpaidAll > 0 ? "Pending" : null,
                    badgeColor: "bg-white/20",
                  },
                  {
                    label: isAllResellers ? "Total Credit Limit" : "Credit Limit",
                    sublabel: "Configured Limit",
                    value: formatPKR(creditLim),
                    sub: `Available: ${formatPKR(availableCredit)}`,
                    subHighlight: true,
                    icon: Shield,
                    color: "from-blue-600 to-blue-500",
                    badge: null, badgeColor: "",
                  },
                  {
                    label: isAllResellers ? "Total Security Deposit" : "Security Deposit",
                    sublabel: "On File",
                    value: formatPKR(secDeposit),
                    sub: isAllResellers ? `${allResellers.length} resellers` : (selReseller?.area || "—"),
                    icon: Landmark,
                    color: "from-violet-600 to-violet-500",
                    badge: null, badgeColor: "",
                  },
                ].map((kpi, idx) => (
                  <Card key={idx} className={`bg-gradient-to-br ${kpi.color} border-0 shadow-md`} data-testid={`wallet-kpi-${idx}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wide leading-tight truncate">{kpi.sublabel}</p>
                          <p className="text-[11px] font-medium text-white/90 leading-tight mt-0.5">{kpi.label}</p>
                        </div>
                        <kpi.icon className="h-4 w-4 text-white/50 shrink-0 ml-1" />
                      </div>
                      <p className="text-xl font-bold text-white tabular-nums" data-testid={`wallet-kpi-value-${idx}`}>{kpi.value}</p>
                      {(kpi as any).subHighlight ? (
                        <p className="text-[11px] font-semibold text-white mt-1 leading-tight truncate bg-white/20 rounded px-1.5 py-0.5 inline-block">{kpi.sub}</p>
                      ) : (
                        <p className="text-[10px] text-white/60 mt-1 leading-tight truncate">{kpi.sub}</p>
                      )}
                      {kpi.badge && <span className={`inline-block mt-1 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full ${kpi.badgeColor}`}>{kpi.badge}</span>}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selReseller && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="bg-gradient-to-r from-teal-600 to-teal-500 text-white gap-1"
                  data-testid="btn-add-recharge"
                  onClick={() => { setRechargeReseller(selReseller); setRechargeVendorRows([{ id: "1", vendorId: "", amount: "" }]); setRechargeVendorId(""); setRechargePaidAmount(""); setRechargeReference(""); setRechargePaymentMethod("cash_in_hand"); setRechargePaymentStatus("paid"); setRechargeRemarks(""); setRechargeBankAccountId(""); setRechargeSenderName(""); setRechargeDialogOpen(true); }}>
                  <ArrowUpCircle className="h-4 w-4" /> Add Recharge
                </Button>
                <Button size="sm" className="bg-gradient-to-r from-red-600 to-red-500 text-white gap-1"
                  data-testid="btn-manual-deduction"
                  onClick={() => { setDeductReseller(selReseller); setDeductReversalTxn(null); setDeductDialogOpen(true); }}>
                  <ArrowDownCircle className="h-4 w-4" /> Manual Deduction
                </Button>

                <Button size="sm" variant="outline" className="gap-1" data-testid="btn-adjustment"
                  onClick={() => { setAdjustReseller(selReseller); setAdjustAmount(""); setAdjustType("credit"); setAdjustReason(""); setAdjustReference(""); setAdjustDialogOpen(true); }}>
                  <RefreshCw className="h-4 w-4" /> Adjustment Entry
                </Button>
              </div>
              )}
            </>
          )}

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2"><FileText className="h-5 w-5" /> Transaction History</CardTitle>
                {selReseller && txns.length > 0 && (
                  <Badge variant="secondary" className="no-default-active-elevate">{filteredTxns.length} of {txns.length} transactions</Badge>
                )}
              </div>
            </CardHeader>
            {selReseller && txns.length > 0 && (
              <div className="px-6 pb-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by reference or description..." value={txnSearch} onChange={(e) => setTxnSearch(e.target.value)} className="pl-9" data-testid="input-txn-search" />
                </div>
                <Select value={txnTypeFilter} onValueChange={setTxnTypeFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-txn-type-filter">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <CardContent className="p-0">
              {!selectedWalletResellerId ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Wallet className="h-14 w-14 mb-3 opacity-20" />
                  <p className="font-medium text-base">Select a reseller to view wallet</p>
                  <p className="text-sm mt-1">Choose from the dropdown above to manage wallet and transactions</p>
                </div>
              ) : isLoadingTransactions ? (
                <div className="p-5 space-y-3">{[1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>
              ) : filteredTxns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-3 opacity-20" />
                  <p className="font-medium">No transactions found</p>
                  <p className="text-sm mt-1">{txns.length > 0 ? "Try adjusting filters" : "This reseller has no wallet transactions yet"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-900 dark:to-slate-800 text-white">
                        <th className="px-3 py-2.5 text-left font-medium text-xs">Date</th>
                        {isAllResellers && <th className="px-3 py-2.5 text-left font-medium text-xs">Reseller</th>}
                        <th className="px-3 py-2.5 text-left font-medium text-xs">Txn ID</th>
                        <th className="px-3 py-2.5 text-left font-medium text-xs">Type</th>
                        <th className="px-3 py-2.5 text-left font-medium text-xs">Status</th>
                        <th className="px-3 py-2.5 text-left font-medium text-xs hidden md:table-cell">Category</th>
                        <th className="px-3 py-2.5 text-right font-medium text-xs hidden md:table-cell">Paid Amt</th>
                        <th className="px-3 py-2.5 text-left font-medium text-xs hidden lg:table-cell">Sender</th>
                        <th className="px-3 py-2.5 text-left font-medium text-xs hidden md:table-cell">Reference</th>
                        <th className="px-3 py-2.5 text-left font-medium text-xs hidden lg:table-cell">Description</th>
                        <th className="px-3 py-2.5 text-right font-medium text-xs">Debit</th>
                        <th className="px-3 py-2.5 text-right font-medium text-xs">Credit</th>
                        <th className="px-3 py-2.5 text-right font-medium text-xs">Balance</th>
                        <th className="px-3 py-2.5 text-left font-medium text-xs hidden lg:table-cell">By</th>
                        <th className="px-3 py-2.5 text-center font-medium text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTxns.map((txn, idx) => {
                        const isCredit = txn.type === "credit";
                        return (
                          <tr key={txn.id} data-testid={`row-transaction-${txn.id}`}
                            className={`border-b border-slate-100 dark:border-slate-800 ${idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/60"}`}>
                            <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                              {txn.createdAt ? new Date(txn.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                            </td>
                            {isAllResellers && (
                              <td className="px-3 py-2.5">
                                <span className="text-xs font-medium">{allResellers.find(r => r.id === txn.resellerId)?.name || `ID: ${txn.resellerId}`}</span>
                              </td>
                            )}
                            <td className="px-3 py-2.5">
                              <span className="text-xs font-mono text-muted-foreground" data-testid={`txn-id-${txn.id}`}>#{String(txn.id).padStart(6, "0")}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <Badge variant="secondary"
                                className={`no-default-active-elevate text-[10px] capitalize gap-0.5 ${isCredit
                                  ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950"
                                  : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950"}`}
                                data-testid={`txn-type-${txn.id}`}>
                                {isCredit ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                                {txn.type}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5">
                              {isCredit ? (
                                <Badge variant="secondary"
                                  className={`no-default-active-elevate text-[10px] capitalize ${
                                    (txn as any).paymentStatus === "unpaid"
                                      ? "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950"
                                      : (txn as any).paymentStatus === "partial"
                                      ? "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950"
                                      : (txn as any).paymentStatus === "reconciled"
                                      ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950"
                                      : (txn as any).paymentStatus === "credit_balance"
                                      ? "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950"
                                      : "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950"
                                  }`}
                                  data-testid={`txn-status-${txn.id}`}>
                                  {(txn as any).paymentStatus === "unpaid" ? "Unpaid" : (txn as any).paymentStatus === "partial" ? "Partial" : (txn as any).paymentStatus === "reconciled" ? "Reconciled" : (txn as any).paymentStatus === "credit_balance" ? "Credit" : "Paid"}
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 hidden md:table-cell">
                              <span className="text-xs capitalize">{(txn.category || "general").replace(/_/g, " ")}</span>
                            </td>
                            <td className="px-3 py-2.5 text-right hidden md:table-cell">
                              {isCredit && (txn as any).paidAmount && parseFloat((txn as any).paidAmount) > 0
                                ? <span className="text-xs font-medium text-green-700 dark:text-green-400">{formatPKR((txn as any).paidAmount)}</span>
                                : <span className="text-xs text-muted-foreground">—</span>}
                            </td>
                            <td className="px-3 py-2.5 hidden lg:table-cell">
                              <span className="text-xs text-muted-foreground">{(txn as any).senderName || "—"}</span>
                            </td>
                            <td className="px-3 py-2.5 hidden md:table-cell">
                              <span className="text-xs text-muted-foreground">{txn.reference || "—"}</span>
                            </td>
                            <td className="px-3 py-2.5 hidden lg:table-cell">
                              <span className="text-xs text-muted-foreground truncate max-w-[150px] block">{txn.description || "—"}</span>
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums">
                              {!isCredit ? <span className="text-sm font-semibold text-red-600 dark:text-red-400">{formatPKR(txn.amount)}</span> : <span className="text-sm text-muted-foreground">—</span>}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums">
                              {isCredit ? <span className="text-sm font-semibold text-green-700 dark:text-green-300">{formatPKR(txn.amount)}</span> : <span className="text-sm text-muted-foreground">—</span>}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums">
                              <span className={`text-sm font-semibold ${parseFloat(String(txn.balanceAfter || "0")) < 0 ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-100"}`}>
                                {formatPKR(txn.balanceAfter)}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 hidden lg:table-cell">
                              <span className="text-xs text-muted-foreground">{txn.createdBy || "System"}</span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`btn-actions-${txn.id}`}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem data-testid={`btn-view-txn-${txn.id}`} onClick={() => setViewWalletTxn(txn)}>
                                    <Eye className="h-4 w-4 mr-2 text-blue-500" />View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem data-testid={`btn-edit-txn-${txn.id}`} onClick={() => {
                                    setEditWalletTxn(txn);
                                    setEditWalletRef(txn.reference || "");
                                    setEditWalletPayStatus((txn as any).paymentStatus || "paid");
                                    setEditWalletPaidAmount((txn as any).paidAmount || "");
                                    setEditWalletMethod((txn as any).paymentMethod || "cash_in_hand");
                                    setEditWalletBankAccId((txn as any).bankAccountId ? String((txn as any).bankAccountId) : "");
                                    setEditWalletSenderName((txn as any).senderName || "");
                                    setEditWalletNotes(txn.description || "");
                                  }}>
                                    <Edit className="h-4 w-4 mr-2 text-amber-500" />Edit Transaction
                                  </DropdownMenuItem>
                                  {txn.type === "credit" && txn.category === "recharge" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem data-testid={`btn-recharge-txn-${txn.id}`} onClick={() => {
                                        const resellerForTxn = allResellers.find(r => r.id === txn.resellerId);
                                        if (resellerForTxn) {
                                          setRechargeReseller(resellerForTxn);
                                          setRechargeVendorRows([{ id: "1", vendorId: "", amount: "" }]);
                                          setRechargeVendorId("");
                                          setRechargePaidAmount(""); setRechargeReference(""); setRechargePaymentMethod("cash_in_hand");
                                          setRechargePaymentStatus("paid"); setRechargeRemarks(""); setRechargeBankAccountId(""); setRechargeSenderName("");
                                          setRechargeDialogOpen(true);
                                        }
                                      }}>
                                        <Wallet className="h-4 w-4 mr-2 text-green-500" />Recharge Wallet
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem data-testid={`btn-delete-txn-${txn.id}`} className="text-red-600 focus:text-red-700 dark:text-red-400"
                                    onClick={() => setDeleteWalletTxnId(txn.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" />Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        );
      })()}

      {tab === "commission" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full" />)
            ) : (resellers || []).length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium">No resellers found</p>
              </div>
            ) : (
              (resellers || []).map((reseller) => {
                const rate = parseFloat(reseller.commissionRate || "10");
                const customers = reseller.totalCustomers || 0;
                const estimatedCommission = customers * rate * 10;
                return (
                  <Card key={reseller.id} data-testid={`card-commission-${reseller.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <CardTitle className="text-sm font-medium">{reseller.name}</CardTitle>
                        <Badge
                          variant="secondary"
                          className={`no-default-active-elevate text-[10px] capitalize ${statusColors[reseller.status] || ""}`}
                        >
                          {reseller.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          Commission Rate
                        </span>
                        <span className="text-sm font-medium">{rate}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Customers
                        </span>
                        <span className="text-sm font-medium">{customers}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Est. Commission
                        </span>
                        <span className="text-sm font-bold" data-testid={`text-est-commission-${reseller.id}`}>
                          {formatPKR(estimatedCommission)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Commission Overview</CardTitle>
              <CardDescription>Summary of reseller commission calculations</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (resellers || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No resellers found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reseller</TableHead>
                        <TableHead>Area</TableHead>
                        <TableHead>Commission Rate</TableHead>
                        <TableHead>Total Customers</TableHead>
                        <TableHead>Wallet Balance</TableHead>
                        <TableHead>Est. Commission</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(resellers || []).map((reseller) => {
                        const rate = parseFloat(reseller.commissionRate || "10");
                        const customers = reseller.totalCustomers || 0;
                        const estimatedCommission = customers * rate * 10;
                        return (
                          <TableRow
                            key={reseller.id}
                            data-testid={`row-commission-${reseller.id}`}
                          >
                            <TableCell className="font-medium">{reseller.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {reseller.area || "N/A"}
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1">
                                <Percent className="h-3 w-3 text-muted-foreground" />
                                {rate}%
                              </span>
                            </TableCell>
                            <TableCell>{customers}</TableCell>
                            <TableCell>{formatPKR(reseller.walletBalance)}</TableCell>
                            <TableCell className="font-medium">
                              {formatPKR(estimatedCommission)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`no-default-active-elevate text-[10px] capitalize ${statusColors[reseller.status] || ""}`}
                              >
                                {reseller.status}
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
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Reseller</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Handshake className="h-4 w-4" /> Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField control={editForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name *</FormLabel><FormControl><Input placeholder="Reseller name" data-testid="input-edit-reseller-name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="resellerType" render={({ field }) => (
                    <FormItem><FormLabel>Reseller Type & Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "authorized_dealer"}>
                        <FormControl><SelectTrigger data-testid="select-edit-reseller-type"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                        <SelectContent>{(resellerTypesList || []).filter(t => t.status === "active").map(t => (<SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "active"}>
                        <FormControl><SelectTrigger data-testid="select-edit-reseller-status"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <FormField control={editForm.control} name="contactName" render={({ field }) => (
                    <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input placeholder="Contact person" data-testid="input-edit-reseller-contact-name" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="cnic" render={({ field }) => (
                    <FormItem><FormLabel>CNIC</FormLabel><FormControl><Input placeholder="XXXXX-XXXXXXX-X" data-testid="input-edit-reseller-cnic" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="ntn" render={({ field }) => (
                    <FormItem><FormLabel>NTN</FormLabel><FormControl><Input placeholder="NTN number" data-testid="input-edit-reseller-ntn" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Phone className="h-4 w-4" /> Contact & Location</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField control={editForm.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Primary Phone *</FormLabel><FormControl><Input placeholder="03XX-XXXXXXX" data-testid="input-edit-reseller-phone" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="secondaryPhone" render={({ field }) => (
                    <FormItem><FormLabel>Secondary Phone</FormLabel><FormControl><Input placeholder="03XX-XXXXXXX" data-testid="input-edit-reseller-secondary-phone" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="email@example.com" data-testid="input-edit-reseller-email" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="mt-3">
                  <FormField control={editForm.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="Full address" data-testid="input-edit-reseller-address" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <FormField control={editForm.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="City" data-testid="input-edit-reseller-city" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="area" render={({ field }) => (
                    <FormItem><FormLabel>Area</FormLabel><FormControl><Input placeholder="Service area" data-testid="input-edit-reseller-area" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="territory" render={({ field }) => (
                    <FormItem><FormLabel>Territory / Coverage Zone</FormLabel><FormControl><Input placeholder="Coverage zone" data-testid="input-edit-reseller-territory" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <FormField control={editForm.control} name="vendorId" render={({ field }) => (
                    <FormItem><FormLabel>Assigned Vendor</FormLabel>
                      <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value ? String(field.value) : ""}>
                        <FormControl><SelectTrigger data-testid="select-edit-reseller-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger></FormControl>
                        <SelectContent>{(vendors || []).map((v) => (<SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="supportLevel" render={({ field }) => (
                    <FormItem><FormLabel>Support Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "standard"}>
                        <FormControl><SelectTrigger data-testid="select-edit-reseller-support"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="basic">Basic</SelectItem><SelectItem value="standard">Standard</SelectItem><SelectItem value="premium">Premium</SelectItem><SelectItem value="dedicated">Dedicated</SelectItem></SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Network className="h-4 w-4" /> Network</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField control={editForm.control} name="joinDate" render={({ field }) => (
                    <FormItem><FormLabel>Join Date</FormLabel><FormControl><Input type="date" data-testid="input-edit-reseller-join-date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="uplinkType" render={({ field }) => (
                    <FormItem><FormLabel>Uplink Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl><SelectTrigger data-testid="select-edit-reseller-uplink-type"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="exchange">Exchange</SelectItem><SelectItem value="tower">Tower</SelectItem><SelectItem value="pop">POP</SelectItem></SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="uplink" render={({ field }) => (
                    <FormItem><FormLabel>Uplink</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl><SelectTrigger data-testid="select-edit-reseller-uplink"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="fiber">Fiber</SelectItem><SelectItem value="wireless">Wireless</SelectItem><SelectItem value="ethernet">Ethernet</SelectItem></SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="exchangeTowerPopName" render={({ field }) => (
                    <FormItem><FormLabel>Exchange/Tower/POP Name</FormLabel><FormControl><Input placeholder="Enter name" data-testid="input-edit-reseller-exchange-name" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="portId" render={({ field }) => (
                    <FormItem><FormLabel>Port ID</FormLabel><FormControl><Input placeholder="Port ID" data-testid="input-edit-reseller-port-id" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="vlanId" render={({ field }) => (
                    <FormItem><FormLabel>Vlan ID</FormLabel><FormControl><Input placeholder="VLAN ID" data-testid="input-edit-reseller-vlan-id" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="media" render={({ field }) => (
                    <FormItem><FormLabel>Media</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl><SelectTrigger data-testid="select-edit-reseller-media"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="dish">Dish</SelectItem><SelectItem value="sfp">SFP</SelectItem></SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Globe className="h-4 w-4" /> Services</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField control={editForm.control} name="vendorPanelAllowed" render={({ field }) => (
                    <FormItem><FormLabel>Vendor Panel Allowed</FormLabel>
                      <div className="flex items-center gap-3 pt-1">
                        <button type="button" data-testid="toggle-edit-reseller-vendor-panel" onClick={() => field.onChange(!field.value)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${field.value ? "bg-blue-600" : "bg-gray-300"}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${field.value ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                        <span className={`text-sm font-medium ${field.value ? "text-blue-600" : "text-gray-500"}`}>{field.value ? "Yes" : "No"}</span>
                      </div><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="vlanIdAllowed" render={({ field }) => (
                    <FormItem><FormLabel>Vlan ID Allowed</FormLabel>
                      <div className="flex items-center gap-3 pt-1">
                        <button type="button" data-testid="toggle-edit-reseller-vlan-allowed" onClick={() => field.onChange(!field.value)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${field.value ? "bg-blue-600" : "bg-gray-300"}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${field.value ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                        <span className={`text-sm font-medium ${field.value ? "text-blue-600" : "text-gray-500"}`}>{field.value ? "Yes" : "No"}</span>
                      </div><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="vlanIdNote" render={({ field }) => (
                    <FormItem><FormLabel>Vlan ID Note</FormLabel><FormControl><Input placeholder="VLAN ID note" data-testid="input-edit-reseller-vlan-note" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                {(() => {
                  const panelsJson = editForm.watch("assignedVendorPanels");
                  let panels: Array<{ vendorName: string; panelUrl: string; panelUsername: string }> = [];
                  try { if (panelsJson) panels = JSON.parse(panelsJson); } catch {}
                  if (panels.length === 0) return null;
                  return (
                    <div className="border rounded-lg overflow-hidden mt-2">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-slate-100"><th className="px-3 py-2 text-left font-medium">Vendor</th><th className="px-3 py-2 text-left font-medium">Panel URL</th><th className="px-3 py-2 text-left font-medium">Username</th></tr></thead>
                        <tbody>{panels.map((p, i) => (<tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}><td className="px-3 py-2">{p.vendorName}</td><td className="px-3 py-2 text-blue-600 truncate max-w-[200px]">{p.panelUrl}</td><td className="px-3 py-2">{p.panelUsername}</td></tr>))}</tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Commission & Financial</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField control={editForm.control} name="commissionRate" render={({ field }) => (
                    <FormItem><FormLabel>Commission Rate (%)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="10.00" data-testid="input-edit-reseller-commission-rate" {...field} value={field.value || "10"} onChange={(e) => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="commissionPaymentMethod" render={({ field }) => (
                    <FormItem><FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "wallet"}>
                        <FormControl><SelectTrigger data-testid="select-edit-reseller-commission-method"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="wallet">Wallet</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="cash">Cash</SelectItem></SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="commissionPaymentFrequency" render={({ field }) => (
                    <FormItem><FormLabel>Payment Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "monthly"}>
                        <FormControl><SelectTrigger data-testid="select-edit-reseller-commission-freq"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="biweekly">Bi-Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem></SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <FormField control={editForm.control} name="walletBalance" render={({ field }) => (
                    <FormItem><FormLabel>Wallet Balance</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-edit-reseller-wallet-balance" {...field} value={field.value || "0"} onChange={(e) => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="creditLimit" render={({ field }) => (
                    <FormItem><FormLabel>Credit Limit</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-edit-reseller-credit-limit" {...field} value={field.value || "0"} onChange={(e) => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="securityDeposit" render={({ field }) => (
                    <FormItem><FormLabel>Security Deposit</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-edit-reseller-security-deposit" {...field} value={field.value || "0"} onChange={(e) => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <FormField control={editForm.control} name="totalCustomers" render={({ field }) => (
                    <FormItem><FormLabel>Total Customers</FormLabel><FormControl><Input type="number" placeholder="0" data-testid="input-edit-reseller-total-customers" {...field} value={field.value ?? 0} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="maxCustomerLimit" render={({ field }) => (
                    <FormItem><FormLabel>Max Customer Limit (0 = unlimited)</FormLabel><FormControl><Input type="number" placeholder="0" data-testid="input-edit-reseller-max-customers" {...field} value={field.value ?? 0} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><ScrollText className="h-4 w-4" /> Agreement & Contract</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField control={editForm.control} name="agreementType" render={({ field }) => (
                    <FormItem><FormLabel>Agreement Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "standard"}>
                        <FormControl><SelectTrigger data-testid="select-edit-reseller-agreement-type"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="standard">Standard</SelectItem><SelectItem value="premium">Premium</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="agreementStartDate" render={({ field }) => (
                    <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" data-testid="input-edit-reseller-agreement-start" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="agreementEndDate" render={({ field }) => (
                    <FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" data-testid="input-edit-reseller-agreement-end" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="mt-3">
                  <FormField control={editForm.control} name="autoRenewal" render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0 pt-1">
                      <FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="switch-edit-reseller-auto-renewal" /></FormControl>
                      <FormLabel className="cursor-pointer">Auto Renewal</FormLabel><FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Landmark className="h-4 w-4" /> Bank Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField control={editForm.control} name="bankName" render={({ field }) => (
                    <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g. HBL, MCB, UBL" data-testid="input-edit-reseller-bank-name" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="bankAccountTitle" render={({ field }) => (
                    <FormItem><FormLabel>Account Title</FormLabel><FormControl><Input placeholder="Account holder name" data-testid="input-edit-reseller-bank-title" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <FormField control={editForm.control} name="bankAccountNumber" render={({ field }) => (
                    <FormItem><FormLabel>Account / IBAN Number</FormLabel><FormControl><Input placeholder="Account number or IBAN" data-testid="input-edit-reseller-bank-account" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={editForm.control} name="bankBranchCode" render={({ field }) => (
                    <FormItem><FormLabel>Branch Code</FormLabel><FormControl><Input placeholder="Branch code" data-testid="input-edit-reseller-bank-branch" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><FileText className="h-4 w-4" /> Notes</h4>
                <FormField control={editForm.control} name="notes" render={({ field }) => (
                  <FormItem><FormControl><Textarea placeholder="Any additional notes or remarks..." rows={3} data-testid="input-edit-reseller-notes" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="secondary" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit-reseller">
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={rechargeDialogOpen} onOpenChange={setRechargeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-green-600" />
              Recharge Wallet {rechargeReseller ? `— ${rechargeReseller.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Balance Preview */}
            {rechargeReseller && (() => {
              const total = rechargeVendorRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
              const currentBal = parseFloat(String(rechargeReseller.walletBalance || "0"));
              const currentCreditLim = parseFloat(String(rechargeReseller.creditLimit || "0"));
              const currentUnpaid = (walletTransactions || []).filter(t => t.type === "credit" && ((t as any).paymentStatus === "unpaid" || (t as any).paymentStatus === "partial")).reduce((s, t) => {
                const amt = parseFloat(String(t.amount || "0"));
                const paid = parseFloat(String((t as any).paidAmount || "0"));
                return s + (amt - paid);
              }, 0);
              const creditAvailable = currentCreditLim - currentUnpaid;
              const paidAmt = rechargePaymentStatus === "paid"
                ? (rechargePaidAmount ? (parseFloat(rechargePaidAmount) || 0) : total)
                : 0;
              const excess = paidAmt - total;
              const unpaidAfterRecharge = rechargePaymentStatus === "unpaid" ? currentUnpaid + total : Math.max(0, currentUnpaid - Math.max(0, excess));
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Current Balance</p>
                      <p className="text-lg font-bold" data-testid="text-recharge-current-balance">{formatPKR(currentBal)}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">After Recharge</p>
                      <p className="text-lg font-bold text-green-600" data-testid="text-recharge-after-balance">{formatPKR(currentBal + total)}</p>
                    </div>
                    <div className={`rounded-lg p-3 border ${currentUnpaid > 0 ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800" : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"}`}>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Unpaid Balance</p>
                      <p className={`text-lg font-bold ${currentUnpaid > 0 ? "text-rose-600" : "text-slate-700 dark:text-slate-300"}`} data-testid="text-recharge-unpaid">{formatPKR(currentUnpaid)}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Credit Available</p>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-lg font-bold text-blue-600 tabular-nums" data-testid="text-recharge-credit-available">{formatPKR(currentBal)}</p>
                        <button
                          type="button"
                          data-testid="button-use-credit-available"
                          onClick={() => setRechargePaidAmount(currentBal.toString())}
                          className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 leading-none"
                        >Use</button>
                      </div>
                    </div>
                  </div>

                  {/* Payment adjustment preview — overpayment scenario */}
                  {rechargePaymentStatus === "paid" && total > 0 && paidAmt > 0 && (
                    <div className={`rounded-lg border p-3 space-y-1.5 text-xs ${excess > 0 ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"}`}>
                      <p className="font-semibold text-slate-700 dark:text-slate-200 text-[11px] uppercase tracking-wide">Payment Adjustment Preview</p>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recharge Amount</span>
                        <span className="font-medium">{formatPKR(total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Received</span>
                        <span className="font-medium text-green-700 dark:text-green-400">{formatPKR(paidAmt)}</span>
                      </div>
                      {excess > 0 && (
                        <>
                          <div className="border-t border-amber-200 dark:border-amber-800 pt-1 flex justify-between">
                            <span className="text-amber-700 dark:text-amber-400 font-medium">Excess Payment</span>
                            <span className="font-bold text-amber-700 dark:text-amber-400">{formatPKR(excess)}</span>
                          </div>
                          <p className="text-amber-700 dark:text-amber-400">
                            {currentUnpaid > 0
                              ? `Excess will auto-clear ${formatPKR(Math.min(excess, currentUnpaid))} of unpaid balance`
                              : "No unpaid balance — excess will be added as advance to wallet"}
                          </p>
                          <div className="flex justify-between border-t border-amber-200 dark:border-amber-800 pt-1">
                            <span className="text-muted-foreground">Unpaid After</span>
                            <span className={`font-bold ${unpaidAfterRecharge > 0 ? "text-rose-600" : "text-green-600"}`}>{formatPKR(unpaidAfterRecharge)}</span>
                          </div>
                        </>
                      )}
                      {excess === 0 && <div className="flex justify-between border-t border-green-200 dark:border-green-800 pt-1"><span className="text-green-700 dark:text-green-400 font-medium">Exact payment — fully settled</span></div>}
                      {excess < 0 && (
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-1 flex justify-between">
                          <span className="text-muted-foreground">Remaining Unpaid</span>
                          <span className="font-bold text-rose-600">{formatPKR(Math.abs(excess))}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Vendor Breakdown (multi-row) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Vendor Breakdown</label>
                <Button size="sm" variant="outline" type="button"
                  onClick={() => setRechargeVendorRows(prev => [...prev, { id: Date.now().toString(), vendorId: "", amount: "" }])}
                  data-testid="button-add-vendor-row">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Vendor
                </Button>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="grid grid-cols-[1fr_120px_36px] gap-0 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-slate-200 dark:border-slate-700">
                  <span>Vendor <span className="text-red-500">*</span></span><span className="text-center">Amount</span><span />
                </div>
                {rechargeVendorRows.map((row, idx) => (
                  <div key={row.id} className={`grid grid-cols-[1fr_120px_36px] gap-0 items-center px-2 py-1.5 ${idx > 0 ? "border-t border-slate-100 dark:border-slate-800" : ""}`}>
                    <Select value={row.vendorId || ""}
                      onValueChange={(val) => {
                        setRechargeVendorRows(prev => prev.map(r => r.id === row.id ? { ...r, vendorId: val } : r));
                      }}>
                      <SelectTrigger className="h-8 text-sm border-0 shadow-none focus:ring-0" data-testid={`select-vendor-row-${idx}`}>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {(vendors || []).map(v => (
                          <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" step="0.01" min="0.01" placeholder="0.00"
                      className="h-8 text-sm text-right pr-2"
                      value={row.amount}
                      onChange={(e) => setRechargeVendorRows(prev => prev.map(r => r.id === row.id ? { ...r, amount: e.target.value } : r))}
                      data-testid={`input-vendor-amount-${idx}`} />
                    <div className="flex justify-center">
                      {rechargeVendorRows.length > 1 ? (
                        <button type="button" className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          onClick={() => setRechargeVendorRows(prev => prev.filter(r => r.id !== row.id))}
                          data-testid={`button-remove-vendor-row-${idx}`}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ) : <span />}
                    </div>
                  </div>
                ))}
                {/* Total row */}
                {rechargeVendorRows.length > 1 && (() => {
                  const total = rechargeVendorRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
                  return (
                    <div className="grid grid-cols-[1fr_120px_36px] items-center px-3 py-2 bg-green-50 dark:bg-green-950/20 border-t border-green-200 dark:border-green-800">
                      <span className="text-sm font-semibold text-green-700 dark:text-green-400">Total Recharge</span>
                      <span className="text-sm font-bold text-green-700 dark:text-green-400 text-right pr-2">{formatPKR(total)}</span>
                      <span />
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Payment Status — shown first */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Status <span className="text-red-500">*</span></label>
              <Select value={rechargePaymentStatus} onValueChange={(val) => {
                setRechargePaymentStatus(val);
                if (val === "unpaid") setRechargePaidAmount("");
                if (val === "credit_balance") setRechargePaidAmount("");
              }}>
                <SelectTrigger data-testid="select-recharge-payment-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="credit_balance">Credit Balance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fields shown only when Paid */}
            {rechargePaymentStatus === "paid" && (() => {
              const total = rechargeVendorRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
              const paid = parseFloat(rechargePaidAmount) || 0;
              const remaining = total > 0 && rechargePaidAmount ? Math.max(0, total - paid) : 0;
              const isFullyPaid = rechargePaidAmount && total > 0 && paid >= total;
              const isPartiallyPaid = rechargePaidAmount && total > 0 && paid > 0 && paid < total;
              const accountTypeMap: Record<string, string> = { cash_in_hand: "cash", bank_transfer: "bank", mobile_wallet: "wallet" };
              const filtered = (companyBankAccounts || []).filter(a => a.accountType === accountTypeMap[rechargePaymentMethod] && a.status === "active");
              const selectedAcc = filtered.find(a => String(a.id) === rechargeBankAccountId);
              return (
                <>
                  {/* Paid Amount */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Paid Amount <span className="text-red-500">*</span></label>
                    <Input type="number" step="0.01" min="0" placeholder="Amount paid by reseller"
                      value={rechargePaidAmount}
                      onChange={(e) => setRechargePaidAmount(e.target.value)}
                      data-testid="input-recharge-paid-amount" />
                    {isFullyPaid && (
                      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                        <p className="text-xs text-green-700 dark:text-green-400 font-medium">Fully paid — {formatPKR(paid)} received</p>
                      </div>
                    )}
                    {isPartiallyPaid && (
                      <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Partial payment — unpaid balance:</p>
                        </div>
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{formatPKR(remaining)}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Type <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "cash_in_hand", label: "Cash in Hand", icon: Banknote, color: "green", accountType: "cash" },
                        { value: "bank_transfer", label: "Bank Transfer", icon: Landmark, color: "blue", accountType: "bank" },
                        { value: "mobile_wallet", label: "Mobile Wallet", icon: Wallet, color: "purple", accountType: "wallet" },
                      ].map(({ value, label, icon: Icon, color, accountType }) => {
                        const active = rechargePaymentMethod === value;
                        const accounts = (companyBankAccounts || []).filter(a => a.accountType === accountType && a.status === "active");
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => { setRechargePaymentMethod(value); setRechargeBankAccountId(""); }}
                            data-testid={`button-payment-type-${value}`}
                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-center ${
                              active
                                ? color === "green" ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                                : color === "blue" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
                                : "border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400"
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-xs font-medium leading-tight">{label}</span>
                            {accounts.length > 0 && <span className="text-[10px] text-muted-foreground">{accounts.length} acct{accounts.length !== 1 ? "s" : ""}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Send From — sender's name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Send From</label>
                    <Input
                      placeholder="Enter the name of person who sent the payment"
                      value={rechargeSenderName}
                      onChange={(e) => setRechargeSenderName(e.target.value)}
                      data-testid="input-recharge-sender-name"
                    />
                  </div>

                  {/* Payment Send To — company account */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Payment Send To
                      {filtered.length > 0 && <span className="text-red-500 ml-0.5">*</span>}
                      {filtered.length === 0 && <span className="text-xs text-muted-foreground ml-2">(No accounts set up for this type — <a href="/company-bank-accounts" className="underline text-blue-600">add one</a>)</span>}
                    </label>
                    <Select value={rechargeBankAccountId} onValueChange={setRechargeBankAccountId}>
                      <SelectTrigger data-testid="select-recharge-bank-account">
                        <SelectValue placeholder={filtered.length === 0 ? "No accounts available" : "Select account"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None —</SelectItem>
                        {filtered.map(a => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.name}{a.bankName ? ` — ${a.bankName}` : ""}{a.accountNumber ? ` (${a.accountNumber})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedAcc && (
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-2 text-xs text-muted-foreground flex items-center justify-between">
                        <span>{selectedAcc.name}{selectedAcc.bankName ? ` · ${selectedAcc.bankName}` : ""}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{formatPKR(selectedAcc.currentBalance)}</span>
                      </div>
                    )}
                  </div>

                  {/* TID / Reference ID */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">TID / Reference ID</label>
                    <Input placeholder="Transaction ID or reference number" value={rechargeReference} onChange={(e) => setRechargeReference(e.target.value)} data-testid="input-recharge-reference" />
                  </div>
                </>
              );
            })()}

            {/* Note */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Note</label>
              <Input placeholder="Optional note about this recharge" value={rechargeRemarks} onChange={(e) => setRechargeRemarks(e.target.value)} data-testid="input-recharge-remarks" />
            </div>

            {rechargePaymentStatus === "unpaid" && (
              <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 dark:text-rose-400">This recharge will be recorded as <strong>unpaid</strong>. It will appear in the Unpaid Balance stat until marked as paid.</p>
              </div>
            )}

            {/* Credit Balance section */}
            {rechargePaymentStatus === "credit_balance" && rechargeReseller && (() => {
              const availBal = parseFloat(String(rechargeReseller.walletBalance || "0"));
              const paidAmt = parseFloat(rechargePaidAmount) || 0;
              const pendingCredit = Math.max(0, availBal - paidAmt);
              const isExceeded = paidAmt > availBal;
              return (
                <div className="space-y-3">
                  {/* Paid Amount input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Paid Amount <span className="text-red-500">*</span></label>
                    <Input
                      type="number" step="0.01" min="0"
                      placeholder="Amount deducted from credit balance"
                      value={rechargePaidAmount}
                      onChange={(e) => setRechargePaidAmount(e.target.value)}
                      data-testid="input-credit-balance-paid-amount"
                    />
                  </div>

                  {/* Credit calculation breakdown */}
                  <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-3 space-y-2">
                    <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Credit Balance Breakdown</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Current Credit Available</span>
                      <span className="font-bold text-blue-600">{formatPKR(availBal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Paid Amount</span>
                      <span className={`font-bold ${paidAmt > 0 ? "text-slate-700 dark:text-slate-200" : "text-muted-foreground"}`}>
                        {paidAmt > 0 ? `− ${formatPKR(paidAmt)}` : "—"}
                      </span>
                    </div>
                    <div className="border-t border-blue-200 dark:border-blue-700 pt-2 flex justify-between items-center">
                      <span className={`text-sm font-semibold ${isExceeded ? "text-red-600" : "text-blue-700 dark:text-blue-300"}`}>
                        {isExceeded ? "Exceeds Available Credit" : "Credit Pending"}
                      </span>
                      <span className={`text-base font-bold ${isExceeded ? "text-red-600" : "text-blue-600"}`}>
                        {isExceeded ? `− ${formatPKR(paidAmt - availBal)}` : formatPKR(pendingCredit)}
                      </span>
                    </div>
                  </div>

                  {isExceeded && (
                    <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 dark:text-red-400">Paid amount exceeds available credit balance of <strong>{formatPKR(availBal)}</strong>.</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="secondary" onClick={() => setRechargeDialogOpen(false)} disabled={rechargeSubmitting} data-testid="button-cancel-recharge">Cancel</Button>
            <Button onClick={handleRecharge}
              disabled={rechargeSubmitting || (() => {
                const amountRows = rechargeVendorRows.filter(r => r.amount && parseFloat(r.amount) > 0);
                if (amountRows.length === 0) return true;
                if (!amountRows.every(r => r.vendorId)) return true;
                if (rechargePaymentStatus === "paid") {
                  if (!rechargePaidAmount || parseFloat(rechargePaidAmount) <= 0) return true;
                  const accountTypeMap: Record<string, string> = { cash_in_hand: "cash", bank_transfer: "bank", mobile_wallet: "wallet" };
                  const filtered = (companyBankAccounts || []).filter((a: any) => a.accountType === accountTypeMap[rechargePaymentMethod] && a.status === "active");
                  if (filtered.length > 0 && (!rechargeBankAccountId || rechargeBankAccountId === "none")) return true;
                }
                if (rechargePaymentStatus === "credit_balance") {
                  if (!rechargePaidAmount || parseFloat(rechargePaidAmount) <= 0) return true;
                  const availBal = parseFloat(String(rechargeReseller?.walletBalance || "0"));
                  if (parseFloat(rechargePaidAmount) > availBal) return true;
                }
                return false;
              })()}
              className="bg-gradient-to-r from-green-600 to-green-500 text-white" data-testid="button-submit-recharge">
              {rechargeSubmitting ? "Processing..." : `Confirm Recharge${rechargeVendorRows.filter(r => r.amount && parseFloat(r.amount) > 0).length > 1 ? ` (${rechargeVendorRows.filter(r => r.amount && parseFloat(r.amount) > 0).length} entries)` : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deductDialogOpen} onOpenChange={setDeductDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-600" />
              Reverse Recharge {deductReseller ? `— ${deductReseller.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

            {/* Balance Preview */}
            {deductReseller && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                  <p className="text-lg font-bold" data-testid="text-deduct-current-balance">{formatPKR(deductReseller.walletBalance)}</p>
                </div>
                {deductReversalTxn && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">After Reversal</p>
                    <p className={`text-lg font-bold ${(parseFloat(String(deductReseller.walletBalance || "0")) - parseFloat(deductReversalTxn.amount)) < 0 ? "text-red-600" : "text-slate-800 dark:text-slate-100"}`} data-testid="text-deduct-after-balance">
                      {formatPKR(parseFloat(String(deductReseller.walletBalance || "0")) - parseFloat(deductReversalTxn.amount))}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pick a recharge to reverse */}
            {(() => {
              const rechargeTxns = (walletTransactions || [])
                .filter(t => t.type === "credit" && t.category === "recharge" && (t as any).paymentStatus !== "reconciled")
                .sort((a, b) => b.id - a.id);
              return (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">Select the recharge that was added by mistake. The exact amount will be deducted and the transaction will be marked as reversed.</p>
                  </div>
                  <label className="text-sm font-medium">Select Recharge to Reverse <span className="text-red-500">*</span></label>
                  {rechargeTxns.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
                      <ArrowUpCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No recharge transactions found for this reseller
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[240px] overflow-y-auto border rounded-lg p-1">
                      {rechargeTxns.map(txn => {
                        const selected = deductReversalTxn?.id === txn.id;
                        return (
                          <button key={txn.id} type="button"
                            data-testid={`btn-reversal-txn-${txn.id}`}
                            onClick={() => setDeductReversalTxn(selected ? null : txn)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all ${selected ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"}`}>
                            <div className="flex items-center gap-3">
                              <div className={`h-2 w-2 rounded-full shrink-0 ${selected ? "bg-amber-500" : "bg-slate-300"}`} />
                              <div>
                                <p className="text-xs font-mono text-muted-foreground">#{String(txn.id).padStart(6, "0")}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {txn.createdAt ? new Date(txn.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                  {txn.reference ? ` · ${txn.reference}` : ""}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-bold ${selected ? "text-amber-700 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"}`}>{formatPKR(txn.amount)}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">{((txn as any).paymentStatus || "paid")}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {deductReversalTxn && (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                      <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                      <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                        Will deduct <strong>{formatPKR(deductReversalTxn.amount)}</strong> — reversing recharge #{String(deductReversalTxn.id).padStart(6, "0")}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setDeductDialogOpen(false)} data-testid="button-cancel-deduct">Cancel</Button>
            <Button onClick={() => {
              if (!deductReseller || !deductReversalTxn) return;
              deductMutation.mutate({
                resellerId: deductReseller.id,
                amount: parseFloat(deductReversalTxn.amount),
                reference: deductReversalTxn.reference || `REV-${deductReversalTxn.id}`,
                category: "recharge_reversal",
              });
            }}
              disabled={!deductReversalTxn || deductMutation.isPending}
              className="bg-gradient-to-r from-amber-600 to-amber-500 text-white"
              data-testid="button-submit-deduct">
              {deductMutation.isPending ? "Processing..." : "Confirm Reversal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-slate-600" />
              Adjustment Entry {adjustReseller ? `— ${adjustReseller.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {adjustReseller && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                  <p className="text-lg font-bold" data-testid="text-adjust-current-balance">{formatPKR(adjustReseller.walletBalance)}</p>
                </div>
                {adjustAmount && parseFloat(adjustAmount) > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">After Adjustment</p>
                    <p className={`text-lg font-bold ${adjustType === "credit" ? "text-green-600" : "text-red-600"}`} data-testid="text-adjust-after-balance">
                      {formatPKR(adjustType === "credit"
                        ? parseFloat(String(adjustReseller.walletBalance || "0")) + parseFloat(adjustAmount)
                        : parseFloat(String(adjustReseller.walletBalance || "0")) - parseFloat(adjustAmount)
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Adjustment Type <span className="text-red-500">*</span></label>
                <Select value={adjustType} onValueChange={(v) => setAdjustType(v as "credit" | "debit")}>
                  <SelectTrigger data-testid="select-adjust-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credit (Add Balance)</SelectItem>
                    <SelectItem value="debit">Debit (Reduce Balance)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount <span className="text-red-500">*</span></label>
                <Input type="number" step="0.01" min="1" placeholder="Enter amount"
                  value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} data-testid="input-adjust-amount" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason <span className="text-red-500">*</span></label>
              <Input placeholder="Reason for this adjustment" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} data-testid="input-adjust-reason" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reference</label>
              <Input placeholder="Optional reference number" value={adjustReference} onChange={(e) => setAdjustReference(e.target.value)} data-testid="input-adjust-reference" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setAdjustDialogOpen(false)} data-testid="button-cancel-adjust">Cancel</Button>
            <Button onClick={() => {
              if (!adjustReseller || !adjustAmount || !adjustReason) return;
              adjustMutation.mutate({
                resellerId: adjustReseller.id,
                amount: parseFloat(adjustAmount),
                reference: adjustReference || adjustReason,
                category: "adjustment",
                ...(adjustType === "credit" ? { paymentMethod: "adjustment", remarks: adjustReason } : {}),
              });
            }} disabled={!adjustAmount || !adjustReason || adjustMutation.isPending}
              className="bg-gradient-to-r from-slate-700 to-slate-600 text-white" data-testid="button-submit-adjust">
              {adjustMutation.isPending ? "Processing..." : "Submit Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingType ? "Edit Type & Role" : "Add New Type & Role"}</DialogTitle>
          </DialogHeader>
          <Form {...typeForm}>
            <form onSubmit={typeForm.handleSubmit(onTypeSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={typeForm.control} name="label" render={({ field }) => (
                  <FormItem><FormLabel>Label</FormLabel><FormControl><Input placeholder="e.g., Authorized Dealer" data-testid="input-type-label" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={typeForm.control} name="key" render={({ field }) => (
                  <FormItem><FormLabel>Key (unique slug)</FormLabel><FormControl><Input placeholder="e.g., authorized_dealer" data-testid="input-type-key" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={typeForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={2} data-testid="input-type-desc" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-3 gap-4">
                <FormField control={typeForm.control} name="icon" render={({ field }) => (
                  <FormItem><FormLabel>Icon</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "shield"}>
                      <FormControl><SelectTrigger data-testid="select-type-icon"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{iconOptions.map(i => {
                        const IC = iconMap[i] || Shield;
                        return <SelectItem key={i} value={i}><span className="flex items-center gap-2"><IC className="h-4 w-4" />{i}</span></SelectItem>;
                      })}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={typeForm.control} name="color" render={({ field }) => (
                  <FormItem><FormLabel>Color</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "blue"}>
                      <FormControl><SelectTrigger data-testid="select-type-color"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{colorOptions.map(c => (
                        <SelectItem key={c} value={c}><span className="flex items-center gap-2"><span className={`inline-block h-3 w-3 rounded-full ${colorMap[c]?.split(" ")[0] || "bg-blue-100"}`} />{c}</span></SelectItem>
                      ))}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={typeForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "active"}>
                      <FormControl><SelectTrigger data-testid="select-type-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={typeForm.control} name="commissionModel" render={({ field }) => (
                  <FormItem><FormLabel>Commission Model</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "percentage"}>
                      <FormControl><SelectTrigger data-testid="select-type-commission"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{commissionModelOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={typeForm.control} name="defaultCommissionRate" render={({ field }) => (
                  <FormItem><FormLabel>Default Commission Rate (%)</FormLabel><FormControl><Input type="number" step="0.01" data-testid="input-type-rate" {...field} value={field.value || "10"} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={typeForm.control} name="sortOrder" render={({ field }) => (
                  <FormItem><FormLabel>Sort Order</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={typeForm.control} name="minCustomers" render={({ field }) => (
                  <FormItem><FormLabel>Min Customers</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={typeForm.control} name="maxCustomers" render={({ field }) => (
                  <FormItem><FormLabel>Max Customers (0 = unlimited)</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 pt-2">Permissions & Options</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FormField control={typeForm.control} name="isDefault" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Default Type</FormLabel></FormItem>
                )} />
                <FormField control={typeForm.control} name="territoryExclusive" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Territory Exclusive</FormLabel></FormItem>
                )} />
                <FormField control={typeForm.control} name="allowSubResellers" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Allow Sub-Resellers</FormLabel></FormItem>
                )} />
                <FormField control={typeForm.control} name="allowCustomBranding" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Custom Branding</FormLabel></FormItem>
                )} />
                <FormField control={typeForm.control} name="allowApiAccess" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">API Access</FormLabel></FormItem>
                )} />
                <FormField control={typeForm.control} name="walletEnabled" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Switch checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Wallet Enabled</FormLabel></FormItem>
                )} />
              </div>
              <FormField control={typeForm.control} name="features" render={({ field }) => (
                <FormItem><FormLabel>Features (comma-separated)</FormLabel><FormControl><Textarea rows={2} placeholder="e.g., Territory exclusivity, Brand support, Priority commission" data-testid="input-type-features" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setTypeDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createTypeMutation.isPending || updateTypeMutation.isPending} data-testid="button-type-submit" className="bg-gradient-to-r from-[#002B5B] to-[#005EFF]">
                  {(createTypeMutation.isPending || updateTypeMutation.isPending) ? "Saving..." : editingType ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Wallet Transaction Dialog */}
      <Dialog open={!!viewWalletTxn} onOpenChange={(o) => { if (!o) setViewWalletTxn(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Transaction Details — #{viewWalletTxn ? String(viewWalletTxn.id).padStart(6, "0") : ""}
            </DialogTitle>
          </DialogHeader>
          {viewWalletTxn && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Date", value: viewWalletTxn.createdAt ? new Date(viewWalletTxn.createdAt).toLocaleString("en-PK") : "—" },
                  { label: "Type", value: <Badge variant="secondary" className={`capitalize text-xs ${viewWalletTxn.type === "credit" ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>{viewWalletTxn.type}</Badge> },
                  { label: "Category", value: (viewWalletTxn.category || "general").replace(/_/g, " ") },
                  { label: "Amount", value: formatPKR(viewWalletTxn.amount) },
                  { label: "Balance After", value: formatPKR(viewWalletTxn.balanceAfter) },
                  { label: "Payment Status", value: (viewWalletTxn as any).paymentStatus || "—" },
                  { label: "Paid Amount", value: (viewWalletTxn as any).paidAmount ? formatPKR((viewWalletTxn as any).paidAmount) : "—" },
                  { label: "Payment Method", value: ((viewWalletTxn as any).paymentMethod || "—").replace(/_/g, " ") },
                  { label: "Sender Name", value: (viewWalletTxn as any).senderName || "—" },
                  { label: "Reference", value: viewWalletTxn.reference || "—" },
                  { label: "Created By", value: viewWalletTxn.createdBy || "System" },
                  { label: "Bank Account", value: (viewWalletTxn as any).bankAccountId ? `ID: ${(viewWalletTxn as any).bankAccountId}` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-sm font-medium">{value as any}</p>
                  </div>
                ))}
              </div>
              {viewWalletTxn.description && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-2.5">
                  <p className="text-xs text-muted-foreground mb-0.5">Description / Notes</p>
                  <p className="text-sm">{viewWalletTxn.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewWalletTxn(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Wallet Transaction Dialog */}
      <Dialog open={!!editWalletTxn} onOpenChange={(o) => { if (!o) setEditWalletTxn(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-amber-500" />
              Edit Transaction — #{editWalletTxn ? String(editWalletTxn.id).padStart(6, "0") : ""}
            </DialogTitle>
          </DialogHeader>
          {editWalletTxn && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Payment Status</label>
                  <Select value={editWalletPayStatus} onValueChange={setEditWalletPayStatus}>
                    <SelectTrigger data-testid="edit-txn-pay-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="reconciled">Reconciled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Paid Amount</label>
                  <Input type="number" min="0" placeholder="0.00" data-testid="edit-txn-paid-amount"
                    value={editWalletPaidAmount} onChange={e => setEditWalletPaidAmount(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select value={editWalletMethod} onValueChange={setEditWalletMethod}>
                    <SelectTrigger data-testid="edit-txn-method"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash_in_hand">Cash in Hand</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="easypaisa">Easypaisa</SelectItem>
                      <SelectItem value="jazzcash">JazzCash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Bank Account</label>
                  <Select value={editWalletBankAccId || "none"} onValueChange={v => setEditWalletBankAccId(v === "none" ? "" : v)}>
                    <SelectTrigger data-testid="edit-txn-bank-acc"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(companyBankAccounts || []).map(acc => (
                        <SelectItem key={acc.id} value={String(acc.id)}>{acc.bankAccountTitle || acc.bankName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Sender Name</label>
                <Input placeholder="Enter sender name" data-testid="edit-txn-sender"
                  value={editWalletSenderName} onChange={e => setEditWalletSenderName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Reference</label>
                <Input placeholder="e.g. TXN-001" data-testid="edit-txn-reference"
                  value={editWalletRef} onChange={e => setEditWalletRef(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Notes / Description</label>
                <Textarea rows={2} placeholder="Optional notes" data-testid="edit-txn-notes"
                  value={editWalletNotes} onChange={e => setEditWalletNotes(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditWalletTxn(null)}>Cancel</Button>
            <Button disabled={updateWalletTxnMutation.isPending}
              data-testid="btn-save-edit-txn"
              onClick={() => {
                if (!editWalletTxn) return;
                updateWalletTxnMutation.mutate({
                  id: editWalletTxn.id,
                  data: {
                    reference: editWalletRef || null,
                    paymentStatus: editWalletPayStatus,
                    paidAmount: editWalletPaidAmount ? editWalletPaidAmount : null,
                    paymentMethod: editWalletMethod,
                    bankAccountId: editWalletBankAccId ? parseInt(editWalletBankAccId) : null,
                    senderName: editWalletSenderName || null,
                    description: editWalletNotes || null,
                  },
                });
              }}
              className="bg-gradient-to-r from-[#002B5B] to-[#005EFF]">
              {updateWalletTxnMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Wallet Transaction Confirm Dialog */}
      <Dialog open={deleteWalletTxnId !== null} onOpenChange={(o) => { if (!o) setDeleteWalletTxnId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="h-5 w-5" />Delete Transaction
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">This action is permanent</p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                  Deleting this transaction will remove it from history. The wallet balance will not be automatically adjusted.
                </p>
              </div>
            </div>
            {deleteWalletTxnId && (
              <p className="text-sm text-muted-foreground mt-3">
                Transaction <span className="font-mono font-semibold">#{String(deleteWalletTxnId).padStart(6, "0")}</span> will be permanently deleted.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteWalletTxnId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteWalletTxnMutation.isPending}
              data-testid="btn-confirm-delete-txn"
              onClick={() => { if (deleteWalletTxnId !== null) deleteWalletTxnMutation.mutate(deleteWalletTxnId); }}>
              {deleteWalletTxnMutation.isPending ? "Deleting..." : "Delete Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
