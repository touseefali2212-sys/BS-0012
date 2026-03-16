import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, CheckCircle, Clock,
  AlertTriangle, XCircle, Eye, X, Package, Layers, Star,
  Activity, RefreshCw, Ban, Filter, BarChart3, TrendingUp,
  AlertCircle, ChevronRight, FileText, Zap, Shield, Download,
  DollarSign, Building2, Phone, Mail, MapPin, CreditCard,
  ThumbsUp, ThumbsDown, Award, UserCheck, Truck, ShoppingBag,
  StarOff, CircleDot, Globe, Percent, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Supplier } from "@shared/schema";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const supplierFormSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().optional(),
  officeAddress: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default("Pakistan"),
  taxRegistrationNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountTitle: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankBranchCode: z.string().optional(),
  paymentTerms: z.string().default("cash"),
  creditLimit: z.string().optional(),
  preferredCurrency: z.string().default("PKR"),
  productCategoriesSupplied: z.string().optional(),
  defaultDeliveryDays: z.number().optional().nullable(),
  supplierRating: z.number().min(1).max(5).default(3),
  notes: z.string().optional(),
  isPreferredVendor: z.boolean().default(false),
  enableCreditPurchases: z.boolean().default(false),
  requirePoApproval: z.boolean().default(true),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  active: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle, label: "Active" },
  pending_verification: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock, label: "Pending Verification" },
  preferred: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Award, label: "Preferred Vendor" },
  credit_hold: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: CreditCard, label: "Credit Hold" },
  blacklisted: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: Ban, label: "Blacklisted" },
  inactive: { color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", icon: XCircle, label: "Inactive" },
};

const paymentTermLabels: Record<string, string> = {
  cash: "Cash", "15_days": "15 Days", "30_days": "30 Days", "60_days": "60 Days", "90_days": "90 Days",
};

const CHART_COLORS = ["#059669", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316", "#64748b"];

const tabs = [
  { id: "overview", label: "Overview Dashboard", icon: BarChart3 },
  { id: "suppliers", label: "Suppliers List", icon: Building2 },
  { id: "financial", label: "Financial Summary", icon: DollarSign },
  { id: "performance", label: "Performance", icon: TrendingUp },
];

function StarRating({ rating, small = false }: { rating: number; small?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${small ? "h-3.5 w-3.5" : "h-4 w-4"} ${i <= rating ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
      ))}
    </div>
  );
}

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useTab("overview");
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPayment, setFilterPayment] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isEditing, setIsEditing] = useState(false);

  const { data: suppliersList = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      companyName: "", contactPerson: "", phone: "", email: "",
      officeAddress: "", city: "", country: "Pakistan",
      taxRegistrationNumber: "", bankName: "", bankAccountTitle: "",
      bankAccountNumber: "", bankBranchCode: "", paymentTerms: "cash",
      creditLimit: "", preferredCurrency: "PKR",
      productCategoriesSupplied: "", defaultDeliveryDays: null,
      supplierRating: 3, notes: "",
      isPreferredVendor: false, enableCreditPurchases: false, requirePoApproval: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SupplierFormValues) => {
      return apiRequest("POST", "/api/suppliers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({ title: "Supplier created", description: "The supplier has been added successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create supplier", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SupplierFormValues & { status: string }> }) => {
      return apiRequest("PATCH", `/api/suppliers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setCreateDialogOpen(false);
      setViewDialogOpen(false);
      setIsEditing(false);
      toast({ title: "Supplier updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update supplier", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setDeleteDialogOpen(false);
      setSelectedSupplier(null);
      toast({ title: "Supplier deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete", variant: "destructive" });
    },
  });

  const stats = useMemo(() => {
    const total = suppliersList.length;
    const active = suppliersList.filter(s => s.status === "active").length;
    const preferred = suppliersList.filter(s => s.isPreferredVendor).length;
    const onCredit = suppliersList.filter(s => s.enableCreditPurchases).length;
    const totalOutstanding = suppliersList.reduce((sum, s) => sum + parseFloat(s.outstandingPayable || "0"), 0);
    const totalPurchaseVol = suppliersList.reduce((sum, s) => sum + parseFloat(s.totalPurchases || "0"), 0);
    const blacklisted = suppliersList.filter(s => s.status === "blacklisted").length;
    const avgRating = suppliersList.length > 0 ? (suppliersList.reduce((sum, s) => sum + (s.supplierRating || 0), 0) / suppliersList.length).toFixed(1) : "0";
    return { total, active, preferred, onCredit, totalOutstanding, totalPurchaseVol, blacklisted, avgRating };
  }, [suppliersList]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    suppliersList.forEach(s => {
      if (s.productCategoriesSupplied) {
        s.productCategoriesSupplied.split(",").forEach(c => cats.add(c.trim()));
      }
    });
    return [...cats];
  }, [suppliersList]);

  const filteredSuppliers = useMemo(() => {
    return suppliersList.filter(s => {
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (filterPayment !== "all" && s.paymentTerms !== filterPayment) return false;
      if (filterRating !== "all" && (s.supplierRating || 0) < parseInt(filterRating)) return false;
      if (filterCategory !== "all" && !(s.productCategoriesSupplied || "").toLowerCase().includes(filterCategory.toLowerCase())) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          s.companyName?.toLowerCase().includes(q) ||
          s.contactPerson?.toLowerCase().includes(q) ||
          s.supplierId?.toLowerCase().includes(q) ||
          s.phone?.includes(q) ||
          s.city?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [suppliersList, filterStatus, filterPayment, filterRating, filterCategory, searchQuery]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    form.reset({
      companyName: "", contactPerson: "", phone: "", email: "",
      officeAddress: "", city: "", country: "Pakistan",
      taxRegistrationNumber: "", bankName: "", bankAccountTitle: "",
      bankAccountNumber: "", bankBranchCode: "", paymentTerms: "cash",
      creditLimit: "", preferredCurrency: "PKR",
      productCategoriesSupplied: "", defaultDeliveryDays: null,
      supplierRating: 3, notes: "",
      isPreferredVendor: false, enableCreditPurchases: false, requirePoApproval: true,
    });
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setIsEditing(true);
    setSelectedSupplier(sup);
    form.reset({
      companyName: sup.companyName, contactPerson: sup.contactPerson,
      phone: sup.phone, email: sup.email || "",
      officeAddress: sup.officeAddress || "", city: sup.city || "",
      country: sup.country || "Pakistan",
      taxRegistrationNumber: sup.taxRegistrationNumber || "",
      bankName: sup.bankName || "", bankAccountTitle: sup.bankAccountTitle || "",
      bankAccountNumber: sup.bankAccountNumber || "",
      bankBranchCode: sup.bankBranchCode || "",
      paymentTerms: sup.paymentTerms, creditLimit: sup.creditLimit || "",
      preferredCurrency: sup.preferredCurrency || "PKR",
      productCategoriesSupplied: sup.productCategoriesSupplied || "",
      defaultDeliveryDays: sup.defaultDeliveryDays,
      supplierRating: sup.supplierRating || 3, notes: sup.notes || "",
      isPreferredVendor: sup.isPreferredVendor,
      enableCreditPurchases: sup.enableCreditPurchases,
      requirePoApproval: sup.requirePoApproval,
    });
    setCreateDialogOpen(true);
  };

  const handleSubmit = (values: SupplierFormValues) => {
    if (isEditing && selectedSupplier) {
      updateMutation.mutate({ id: selectedSupplier.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const exportCSV = () => {
    const headers = ["ID", "Company", "Contact", "Phone", "Categories", "Payment Terms", "Credit Limit", "Outstanding", "Status", "Rating"];
    const rows = filteredSuppliers.map(s => [
      s.supplierId, s.companyName, s.contactPerson, s.phone,
      s.productCategoriesSupplied || "", s.paymentTerms,
      s.creditLimit || "0", s.outstandingPayable || "0", s.status, s.supplierRating || 0,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "suppliers.csv"; link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const statusPieData = Object.entries(statusConfig).map(([key, cfg]) => ({
    name: cfg.label,
    value: suppliersList.filter(s => s.status === key || (key === "preferred" && s.isPreferredVendor && s.status === "active")).length,
    color: CHART_COLORS[Object.keys(statusConfig).indexOf(key) % CHART_COLORS.length],
  })).filter(d => d.value > 0);

  const topSuppliersByValue = suppliersList
    .filter(s => parseFloat(s.totalPurchases || "0") > 0)
    .sort((a, b) => parseFloat(b.totalPurchases || "0") - parseFloat(a.totalPurchases || "0"))
    .slice(0, 8)
    .map(s => ({ name: s.companyName.length > 18 ? s.companyName.substring(0, 18) + "..." : s.companyName, value: parseFloat(s.totalPurchases || "0") }));

  const paymentTermsData = Object.entries(paymentTermLabels).map(([key, label]) => ({
    name: label, value: suppliersList.filter(s => s.paymentTerms === key).length,
  })).filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Suppliers</h1>
          <p className="text-muted-foreground mt-1">Centralized vendor management, procurement tracking, and performance monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button onClick={handleOpenCreate} data-testid="button-create-supplier">
            <Plus className="h-4 w-4 mr-2" /> Add Supplier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Suppliers", value: stats.total, icon: Building2, gradient: "from-gray-800 to-emerald-600" },
          { title: "Active Suppliers", value: stats.active, icon: CheckCircle, gradient: "from-emerald-600 to-emerald-400", sub: `${stats.blacklisted} blacklisted` },
          { title: "Preferred Vendors", value: stats.preferred, icon: Award, gradient: "from-blue-600 to-blue-400", sub: "Top-rated partners" },
          { title: "On Credit", value: stats.onCredit, icon: CreditCard, gradient: "from-purple-600 to-purple-400", sub: "Credit enabled" },
          { title: "Outstanding Payables", value: `Rs. ${(stats.totalOutstanding / 1000).toFixed(0)}k`, icon: DollarSign, gradient: "from-rose-600 to-rose-400", sub: "Total owed" },
          { title: "Monthly Purchase Vol.", value: `Rs. ${(stats.totalPurchaseVol / 1000).toFixed(0)}k`, icon: ShoppingBag, gradient: "from-amber-600 to-amber-400", sub: "All-time total" },
          { title: "Avg. Rating", value: `${stats.avgRating} / 5`, icon: Star, gradient: "from-teal-600 to-teal-400", sub: "Internal rating" },
          { title: "Inactive / Hold", value: suppliersList.filter(s => s.status === "inactive" || s.status === "credit_hold").length, icon: AlertTriangle, gradient: "from-gray-600 to-gray-400", sub: "Need attention" },
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
              {card.sub && <p className="text-xs text-white/60 mt-2">{card.sub}</p>}
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
              <CardHeader><CardTitle className="text-lg">Suppliers by Status</CardTitle></CardHeader>
              <CardContent>
                {statusPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {statusPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No supplier data yet</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Top Suppliers by Purchase Value</CardTitle></CardHeader>
              <CardContent>
                {topSuppliersByValue.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topSuppliersByValue} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={v => `Rs.${(v / 1000).toFixed(0)}k`} />
                      <YAxis dataKey="name" type="category" width={130} />
                      <Tooltip formatter={(v: number) => `Rs. ${v.toLocaleString()}`} />
                      <Bar dataKey="value" fill="#059669" name="Total Purchases" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No purchase data yet</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Payment Terms Distribution</CardTitle></CardHeader>
            <CardContent>
              {paymentTermsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={paymentTermsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1F2937" name="Suppliers" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground"><p>No data</p></div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Recent Suppliers</CardTitle></CardHeader>
            <CardContent>
              {suppliersList.length > 0 ? (
                <div className="space-y-3">
                  {suppliersList.slice(0, 5).map(sup => {
                    const sc = statusConfig[sup.status] || statusConfig.active;
                    const StatusIcon = sc.icon;
                    return (
                      <div key={sup.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedSupplier(sup); setViewDialogOpen(true); }} data-testid={`row-recent-${sup.id}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${sc.color}`}><StatusIcon className="h-4 w-4" /></div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{sup.companyName}</p>
                              {sup.isPreferredVendor && <Badge variant="outline" className="text-blue-600 border-blue-300"><Award className="h-3 w-3 mr-1" />Preferred</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{sup.contactPerson} | {sup.city || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StarRating rating={sup.supplierRating || 0} />
                          <Badge className={sc.color}>{sc.label}</Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No suppliers added yet</p>
                  <p className="text-sm mt-1">Add your first supplier to start managing procurement</p>
                  <Button className="mt-4" onClick={handleOpenCreate} data-testid="button-create-first">
                    <Plus className="h-4 w-4 mr-2" /> Add Supplier
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "suppliers" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, contact, ID, phone, city..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]" data-testid="select-filter-status"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPayment} onValueChange={setFilterPayment}>
              <SelectTrigger className="w-[150px]" data-testid="select-filter-payment"><SelectValue placeholder="Payment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {Object.entries(paymentTermLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-[130px]" data-testid="select-filter-rating"><SelectValue placeholder="Rating" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
              </SelectContent>
            </Select>
            {uniqueCategories.length > 0 && (
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[160px]" data-testid="select-filter-category"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-800 to-emerald-700 text-white">
                    <th className="px-4 py-3 text-left font-medium">Supplier ID</th>
                    <th className="px-4 py-3 text-left font-medium">Company Name</th>
                    <th className="px-4 py-3 text-left font-medium">Contact Person</th>
                    <th className="px-4 py-3 text-left font-medium">Phone</th>
                    <th className="px-4 py-3 text-left font-medium">Categories</th>
                    <th className="px-4 py-3 text-left font-medium">Payment Terms</th>
                    <th className="px-4 py-3 text-left font-medium">Credit Limit</th>
                    <th className="px-4 py-3 text-left font-medium">Outstanding</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Rating</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSuppliers.length > 0 ? filteredSuppliers.map(sup => {
                    const sc = statusConfig[sup.status] || statusConfig.active;
                    return (
                      <tr key={sup.id} className="hover:bg-muted/50 transition-colors" data-testid={`row-supplier-${sup.id}`}>
                        <td className="px-4 py-3 font-medium">{sup.supplierId}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span>{sup.companyName}</span>
                            {sup.isPreferredVendor && <Award className="h-4 w-4 text-blue-500" />}
                          </div>
                        </td>
                        <td className="px-4 py-3">{sup.contactPerson}</td>
                        <td className="px-4 py-3">{sup.phone}</td>
                        <td className="px-4 py-3 max-w-[150px] truncate">{sup.productCategoriesSupplied || "—"}</td>
                        <td className="px-4 py-3">{paymentTermLabels[sup.paymentTerms] || sup.paymentTerms}</td>
                        <td className="px-4 py-3">{sup.creditLimit ? `Rs. ${parseFloat(sup.creditLimit).toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-3">
                          {parseFloat(sup.outstandingPayable || "0") > 0 ? (
                            <span className="text-rose-600 font-medium">Rs. {parseFloat(sup.outstandingPayable || "0").toLocaleString()}</span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3"><Badge className={sc.color}>{sc.label}</Badge></td>
                        <td className="px-4 py-3"><StarRating rating={sup.supplierRating || 0} /></td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${sup.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedSupplier(sup); setViewDialogOpen(true); }} data-testid={`action-view-${sup.id}`}>
                                <Eye className="h-4 w-4 mr-2" /> View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEdit(sup)} data-testid={`action-edit-${sup.id}`}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {sup.status !== "inactive" && (
                                <DropdownMenuItem onClick={() => updateMutation.mutate({ id: sup.id, data: { status: "inactive" } })} data-testid={`action-suspend-${sup.id}`}>
                                  <Ban className="h-4 w-4 mr-2" /> Suspend
                                </DropdownMenuItem>
                              )}
                              {sup.status === "inactive" && (
                                <DropdownMenuItem onClick={() => updateMutation.mutate({ id: sup.id, data: { status: "active" } })} data-testid={`action-activate-${sup.id}`}>
                                  <CheckCircle className="h-4 w-4 mr-2" /> Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => updateMutation.mutate({ id: sup.id, data: { isPreferredVendor: !sup.isPreferredVendor } })} data-testid={`action-preferred-${sup.id}`}>
                                <Award className="h-4 w-4 mr-2" /> {sup.isPreferredVendor ? "Remove Preferred" : "Mark Preferred"}
                              </DropdownMenuItem>
                              {sup.status !== "blacklisted" && (
                                <DropdownMenuItem onClick={() => updateMutation.mutate({ id: sup.id, data: { status: "blacklisted" } })} className="text-red-600" data-testid={`action-blacklist-${sup.id}`}>
                                  <Ban className="h-4 w-4 mr-2" /> Blacklist
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setSelectedSupplier(sup); setDeleteDialogOpen(true); }} className="text-red-600" data-testid={`action-delete-${sup.id}`}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No suppliers found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or add a new supplier</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "financial" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">Rs. {stats.totalPurchaseVol.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Purchases</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">Rs. {suppliersList.reduce((s, sup) => s + parseFloat(sup.totalPayments || "0"), 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Payments Made</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-rose-200 dark:border-rose-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/30">
                    <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">Rs. {stats.totalOutstanding.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Outstanding Payables</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Supplier Financial Details</CardTitle></CardHeader>
            <CardContent>
              {suppliersList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-800 to-emerald-700 text-white">
                        <th className="px-4 py-3 text-left font-medium">Supplier</th>
                        <th className="px-4 py-3 text-left font-medium">Total Purchases</th>
                        <th className="px-4 py-3 text-left font-medium">Total Payments</th>
                        <th className="px-4 py-3 text-left font-medium">Outstanding</th>
                        <th className="px-4 py-3 text-left font-medium">Credit Limit</th>
                        <th className="px-4 py-3 text-left font-medium">Credit Used %</th>
                        <th className="px-4 py-3 text-left font-medium">Last Payment</th>
                        <th className="px-4 py-3 text-left font-medium">Payment Terms</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {suppliersList.map(sup => {
                        const outstanding = parseFloat(sup.outstandingPayable || "0");
                        const creditLimit = parseFloat(sup.creditLimit || "0");
                        const creditUsed = creditLimit > 0 ? Math.round((outstanding / creditLimit) * 100) : 0;
                        return (
                          <tr key={sup.id} className="hover:bg-muted/50" data-testid={`row-financial-${sup.id}`}>
                            <td className="px-4 py-3 font-medium">{sup.companyName}</td>
                            <td className="px-4 py-3">Rs. {parseFloat(sup.totalPurchases || "0").toLocaleString()}</td>
                            <td className="px-4 py-3">Rs. {parseFloat(sup.totalPayments || "0").toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className={outstanding > 0 ? "text-rose-600 font-medium" : ""}>
                                Rs. {outstanding.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-3">{creditLimit > 0 ? `Rs. ${creditLimit.toLocaleString()}` : "—"}</td>
                            <td className="px-4 py-3">
                              {creditLimit > 0 ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-muted rounded-full h-2">
                                    <div className={`h-2 rounded-full ${creditUsed > 80 ? "bg-red-500" : creditUsed > 50 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(creditUsed, 100)}%` }} />
                                  </div>
                                  <span className="text-xs">{creditUsed}%</span>
                                </div>
                              ) : "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{sup.lastPaymentDate ? new Date(sup.lastPaymentDate).toLocaleDateString() : "—"}</td>
                            <td className="px-4 py-3">{paymentTermLabels[sup.paymentTerms] || sup.paymentTerms}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No financial data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "performance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Truck className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-2xl font-bold">{suppliersList.length > 0 ? (suppliersList.reduce((s, sup) => s + parseFloat(sup.onTimeDeliveryRate || "0"), 0) / suppliersList.length).toFixed(0) : 0}%</p>
                <p className="text-sm text-muted-foreground">Avg On-Time Delivery</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Package className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">{suppliersList.length > 0 ? (suppliersList.reduce((s, sup) => s + parseFloat(sup.orderFulfillmentRate || "0"), 0) / suppliersList.length).toFixed(0) : 0}%</p>
                <p className="text-sm text-muted-foreground">Order Fulfillment Rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                <p className="text-2xl font-bold">{suppliersList.length > 0 ? (suppliersList.reduce((s, sup) => s + parseFloat(sup.qualityIssueRate || "0"), 0) / suppliersList.length).toFixed(1) : 0}%</p>
                <p className="text-sm text-muted-foreground">Avg Quality Issue Rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <RefreshCw className="h-8 w-8 mx-auto text-rose-500 mb-2" />
                <p className="text-2xl font-bold">{suppliersList.length > 0 ? (suppliersList.reduce((s, sup) => s + parseFloat(sup.returnRate || "0"), 0) / suppliersList.length).toFixed(1) : 0}%</p>
                <p className="text-sm text-muted-foreground">Avg Return Rate</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Supplier Performance Scorecard</CardTitle></CardHeader>
            <CardContent>
              {suppliersList.length > 0 ? (
                <div className="space-y-4">
                  {suppliersList.map(sup => {
                    const onTime = parseFloat(sup.onTimeDeliveryRate || "0");
                    const fulfillment = parseFloat(sup.orderFulfillmentRate || "0");
                    const quality = parseFloat(sup.qualityIssueRate || "0");
                    const returns = parseFloat(sup.returnRate || "0");
                    const flags: string[] = [];
                    if (parseFloat(sup.outstandingPayable || "0") > parseFloat(sup.creditLimit || "0") && parseFloat(sup.creditLimit || "0") > 0) flags.push("Exceeded Credit Limit");
                    if (onTime < 70) flags.push("Late Deliveries");
                    if (quality > 10) flags.push("High Defect Rate");
                    return (
                      <div key={sup.id} className="p-4 rounded-lg border" data-testid={`card-performance-${sup.id}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{sup.companyName}</span>
                            <StarRating rating={sup.supplierRating || 0} />
                            {sup.isPreferredVendor && <Badge variant="outline" className="text-blue-600 border-blue-300"><Award className="h-3 w-3 mr-1" />Preferred</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            {flags.map((f, i) => <Badge key={i} variant="destructive" className="text-xs">{f}</Badge>)}
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">On-Time Delivery</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div className={`h-2 rounded-full ${onTime >= 90 ? "bg-emerald-500" : onTime >= 70 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${onTime}%` }} />
                              </div>
                              <span className="font-medium">{onTime}%</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Fulfillment Rate</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div className={`h-2 rounded-full ${fulfillment >= 90 ? "bg-emerald-500" : fulfillment >= 70 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${fulfillment}%` }} />
                              </div>
                              <span className="font-medium">{fulfillment}%</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Quality Issues</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div className={`h-2 rounded-full ${quality <= 2 ? "bg-emerald-500" : quality <= 5 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(quality * 10, 100)}%` }} />
                              </div>
                              <span className="font-medium">{quality}%</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Return Rate</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div className={`h-2 rounded-full ${returns <= 2 ? "bg-emerald-500" : returns <= 5 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(returns * 10, 100)}%` }} />
                              </div>
                              <span className="font-medium">{returns}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="companyName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl><Input placeholder="e.g. FiberTech Solutions" {...field} data-testid="input-company-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contactPerson" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl><Input placeholder="Full name" {...field} data-testid="input-contact-person" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input placeholder="e.g. 042-35761234" {...field} data-testid="input-phone" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="email@company.com" {...field} data-testid="input-email" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl><Input placeholder="e.g. Lahore" {...field} data-testid="input-city" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="officeAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel>Office Address</FormLabel>
                  <FormControl><Input placeholder="Full address" {...field} data-testid="input-address" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="taxRegistrationNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Registration (NTN)</FormLabel>
                    <FormControl><Input placeholder="e.g. 1234567-8" {...field} data-testid="input-ntn" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="productCategoriesSupplied" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Categories Supplied</FormLabel>
                    <FormControl><Input placeholder="e.g. Network Equipment, Fiber Materials" {...field} data-testid="input-categories" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <FormField control={form.control} name="bankName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl><Input placeholder="e.g. HBL" {...field} data-testid="input-bank-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="bankAccountTitle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Title</FormLabel>
                    <FormControl><Input placeholder="Account title" {...field} data-testid="input-bank-title" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="bankAccountNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl><Input placeholder="Account #" {...field} data-testid="input-bank-account" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="bankBranchCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Code</FormLabel>
                    <FormControl><Input placeholder="Code" {...field} data-testid="input-branch-code" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-payment-terms"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(paymentTermLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="creditLimit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit (Rs.)</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-credit-limit" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="preferredCurrency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-currency"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="PKR">PKR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="defaultDeliveryDays" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Delivery Time (Days)</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g. 7" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)} data-testid="input-delivery-days" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="supplierRating" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Rating (1–5)</FormLabel>
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map(i => (
                        <button key={i} type="button" onClick={() => field.onChange(i)} data-testid={`button-rating-${i}`}>
                          <Star className={`h-6 w-6 cursor-pointer ${i <= field.value ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea placeholder="Additional notes about this supplier..." {...field} data-testid="input-notes" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="isPreferredVendor" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-preferred" /></FormControl>
                    <FormLabel className="cursor-pointer">Mark as Preferred</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="enableCreditPurchases" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-credit" /></FormControl>
                    <FormLabel className="cursor-pointer">Enable Credit Purchases</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="requirePoApproval" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-po-approval" /></FormControl>
                    <FormLabel className="cursor-pointer">Require PO Approval</FormLabel>
                  </FormItem>
                )} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-supplier">
                  {(createMutation.isPending || updateMutation.isPending) && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? "Update Supplier" : "Add Supplier"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Supplier Profile — {selectedSupplier?.supplierId}</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (() => {
            const sup = selectedSupplier;
            const sc = statusConfig[sup.status] || statusConfig.active;
            const outstanding = parseFloat(sup.outstandingPayable || "0");
            const creditLimit = parseFloat(sup.creditLimit || "0");
            const creditUsed = creditLimit > 0 ? Math.round((outstanding / creditLimit) * 100) : 0;
            return (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <Badge className={sc.color}>{sc.label}</Badge>
                  {sup.isPreferredVendor && <Badge variant="outline" className="text-blue-600 border-blue-300"><Award className="h-3 w-3 mr-1" />Preferred Vendor</Badge>}
                  <StarRating rating={sup.supplierRating || 0} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div><span className="text-muted-foreground">Company Name</span><p className="font-medium">{sup.companyName}</p></div>
                    <div><span className="text-muted-foreground">Contact Person</span><p className="font-medium">{sup.contactPerson}</p></div>
                    <div className="flex items-center gap-2"><Phone className="h-3 w-3 text-muted-foreground" /><span>{sup.phone}</span></div>
                    {sup.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3 text-muted-foreground" /><span>{sup.email}</span></div>}
                    {sup.officeAddress && <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-muted-foreground" /><span>{sup.officeAddress}, {sup.city}</span></div>}
                  </div>
                  <div className="space-y-3">
                    <div><span className="text-muted-foreground">Payment Terms</span><p className="font-medium">{paymentTermLabels[sup.paymentTerms] || sup.paymentTerms}</p></div>
                    <div><span className="text-muted-foreground">Tax Number</span><p className="font-medium">{sup.taxRegistrationNumber || "—"}</p></div>
                    <div><span className="text-muted-foreground">Categories Supplied</span><p className="font-medium">{sup.productCategoriesSupplied || "—"}</p></div>
                    <div><span className="text-muted-foreground">Delivery Time</span><p className="font-medium">{sup.defaultDeliveryDays ? `${sup.defaultDeliveryDays} days` : "—"}</p></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Purchases</p>
                    <p className="text-lg font-bold">Rs. {parseFloat(sup.totalPurchases || "0").toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Payments</p>
                    <p className="text-lg font-bold">Rs. {parseFloat(sup.totalPayments || "0").toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Outstanding</p>
                    <p className={`text-lg font-bold ${outstanding > 0 ? "text-rose-600" : ""}`}>Rs. {outstanding.toLocaleString()}</p>
                  </div>
                </div>

                {creditLimit > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Credit Utilization</span>
                      <span>{creditUsed}% of Rs. {creditLimit.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div className={`h-3 rounded-full ${creditUsed > 80 ? "bg-red-500" : creditUsed > 50 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(creditUsed, 100)}%` }} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div className="text-center p-3 rounded-lg border">
                    <p className="font-bold">{parseFloat(sup.onTimeDeliveryRate || "0")}%</p>
                    <p className="text-xs text-muted-foreground">On-Time</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border">
                    <p className="font-bold">{parseFloat(sup.orderFulfillmentRate || "0")}%</p>
                    <p className="text-xs text-muted-foreground">Fulfillment</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border">
                    <p className="font-bold">{parseFloat(sup.qualityIssueRate || "0")}%</p>
                    <p className="text-xs text-muted-foreground">Quality Issues</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border">
                    <p className="font-bold">{parseFloat(sup.returnRate || "0")}%</p>
                    <p className="text-xs text-muted-foreground">Returns</p>
                  </div>
                </div>

                {sup.notes && (
                  <div>
                    <span className="text-sm text-muted-foreground">Notes</span>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{sup.notes}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {sup.enableCreditPurchases && <Badge variant="outline"><CreditCard className="h-3 w-3 mr-1" /> Credit Enabled</Badge>}
                  {sup.requirePoApproval && <Badge variant="outline"><Shield className="h-3 w-3 mr-1" /> PO Required</Badge>}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => { setViewDialogOpen(false); handleOpenEdit(sup); }} data-testid="button-edit-from-view">
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSupplier?.companyName}"? Suppliers with outstanding payables or linked transactions cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedSupplier && deleteMutation.mutate(selectedSupplier.id)} className="bg-red-600 hover:bg-red-700" data-testid="button-confirm-delete">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}