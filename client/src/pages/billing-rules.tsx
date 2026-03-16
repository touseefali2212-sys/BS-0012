import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, FileText, Shield,
  AlertTriangle, CheckCircle, XCircle, Bell, Play, Copy, Download,
  Filter, X, Settings2, Clock, Calendar, DollarSign, Layers, Zap,
  TrendingUp, Percent, Building2, Users, BarChart3, Eye, Ban,
  Receipt, CreditCard, Activity, Target, RotateCcw, Mail,
  ArrowUpRight, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertBillingRuleSchema,
  type BillingRule, type InsertBillingRule,
  type Account, type Customer, type Package,
} from "@shared/schema";
import { z } from "zod";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Line,
} from "recharts";

const ruleFormSchema = insertBillingRuleSchema.extend({
  name: z.string().min(1, "Rule name is required"),
  type: z.string().min(1, "Rule type is required"),
  customerType: z.string().min(1, "Customer type is required"),
});

const ruleTypeConfig: Record<string, { label: string; color: string; icon: any }> = {
  recurring: { label: "Recurring Billing", color: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800", icon: RotateCcw },
  one_time: { label: "One-Time Billing", color: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800", icon: Receipt },
  proration: { label: "Proration Rule", color: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800", icon: Percent },
  late_fee: { label: "Late Fee Rule", color: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800", icon: AlertTriangle },
  discount: { label: "Discount Rule", color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800", icon: DollarSign },
  tax: { label: "Tax Rule", color: "bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300 border-slate-200 dark:border-slate-800", icon: FileText },
  suspension: { label: "Suspension Rule", color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800", icon: Ban },
  disconnection: { label: "Disconnection Rule", color: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800", icon: XCircle },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800" },
  draft: { label: "Draft", color: "bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-800" },
  scheduled: { label: "Scheduled", color: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
  disabled: { label: "Disabled", color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800" },
};

const customerTypeLabels: Record<string, string> = {
  all: "All Customers", cir: "CIR", corporate: "Corporate", reseller: "Reseller", home: "Home",
};

const frequencyLabels: Record<string, string> = {
  monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly", custom: "Custom",
};

const formatCurrency = (v: number) => `Rs. ${v.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

export default function BillingRulesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerTypeFilterVal, setCustomerTypeFilterVal] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BillingRule | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [detailRule, setDetailRule] = useState<BillingRule | null>(null);
  const [simOpen, setSimOpen] = useState(false);
  const [simCustomerId, setSimCustomerId] = useState("");
  const [simPackageId, setSimPackageId] = useState("");
  const [simResult, setSimResult] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const { data: rules = [], isLoading } = useQuery<BillingRule[]>({ queryKey: ["/api/billing-rules"] });
  const { data: accounts = [] } = useQuery<Account[]>({ queryKey: ["/api/accounts"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: packages = [] } = useQuery<Package[]>({ queryKey: ["/api/packages"] });
  const { data: invoices = [] } = useQuery<any[]>({ queryKey: ["/api/invoices"] });

  const form = useForm<InsertBillingRule>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      name: "", type: "recurring", customerType: "all", branch: "", status: "draft",
      billingFrequency: "monthly", invoiceDay: 1, dueDateOffset: 7, graceDays: 7,
      autoGenerateInvoice: true, pricingMode: "plan_based", baseAmount: undefined,
      taxPercent: "0", discountPercent: "0", penaltyType: "percentage", penaltyAmount: undefined,
      penaltyPercent: undefined, maxPenalty: undefined, prorationMethod: "daily",
      debitAccountId: undefined, creditAccountId: undefined, taxAccountId: undefined,
      lateFeeAccountId: undefined, autoSuspendDays: 30, autoDisconnectDays: 60,
      autoEmailInvoice: true, autoApplyCreditNotes: false, autoSuspendOnNonPayment: false,
      autoApplyLateFee: true, autoRecurring: true, allowManualOverride: true,
      notifyOnApply: true, isActive: true, description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertBillingRule) => {
      const payload = { ...data, createdAt: new Date().toISOString() };
      const res = await apiRequest("POST", "/api/billing-rules", payload);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/billing-rules"] }); setDialogOpen(false); form.reset(); toast({ title: "Billing rule created successfully" }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertBillingRule> }) => {
      const res = await apiRequest("PATCH", `/api/billing-rules/${id}`, data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/billing-rules"] }); setDialogOpen(false); setEditingRule(null); form.reset(); toast({ title: "Billing rule updated successfully" }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/billing-rules/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/billing-rules"] }); setDeleteConfirmId(null); toast({ title: "Billing rule deleted" }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const hasFilters = search || typeFilter !== "all" || statusFilter !== "all" || customerTypeFilterVal !== "all";
  const clearFilters = () => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); setCustomerTypeFilterVal("all"); setCurrentPage(1); };

  const filtered = useMemo(() => {
    let items = [...rules];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(r => r.name.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q));
    }
    if (typeFilter !== "all") items = items.filter(r => r.type === typeFilter);
    if (statusFilter !== "all") items = items.filter(r => r.status === statusFilter);
    if (customerTypeFilterVal !== "all") items = items.filter(r => r.customerType === customerTypeFilterVal);
    return items;
  }, [rules, search, typeFilter, statusFilter, customerTypeFilterVal]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const kpis = useMemo(() => {
    const active = rules.filter(r => r.status === "active" || (r.isActive && r.status !== "disabled")).length;
    const scheduled = rules.filter(r => r.status === "scheduled").length;
    const lateFee = rules.filter(r => r.type === "late_fee" && r.isActive).length;
    const taxRules = rules.filter(r => r.type === "tax" && r.isActive).length;
    const thisMonth = new Date().toISOString().slice(0, 7);
    const invoicesThisMonth = invoices.filter((i: any) => i.issueDate?.startsWith(thisMonth)).length;
    return { total: rules.length, active, scheduled, lateFee, taxRules, invoicesThisMonth };
  }, [rules, invoices]);

  const chartData = useMemo(() => {
    const now = new Date();
    const months: { name: string; generated: number; collected: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString("en-US", { month: "short" });
      const gen = invoices.filter((inv: any) => inv.issueDate?.startsWith(key)).length;
      const col = invoices.filter((inv: any) => inv.issueDate?.startsWith(key) && inv.status === "paid").length;
      months.push({ name: label, generated: gen, collected: col });
    }
    return months;
  }, [invoices]);

  const openCreate = () => {
    setEditingRule(null);
    form.reset({
      name: "", type: "recurring", customerType: "all", branch: "", status: "draft",
      billingFrequency: "monthly", invoiceDay: 1, dueDateOffset: 7, graceDays: 7,
      autoGenerateInvoice: true, pricingMode: "plan_based", baseAmount: undefined,
      taxPercent: "0", discountPercent: "0", penaltyType: "percentage", penaltyAmount: undefined,
      penaltyPercent: undefined, maxPenalty: undefined, prorationMethod: "daily",
      debitAccountId: undefined, creditAccountId: undefined, taxAccountId: undefined,
      lateFeeAccountId: undefined, autoSuspendDays: 30, autoDisconnectDays: 60,
      autoEmailInvoice: true, autoApplyCreditNotes: false, autoSuspendOnNonPayment: false,
      autoApplyLateFee: true, autoRecurring: true, allowManualOverride: true,
      notifyOnApply: true, isActive: true, description: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (r: BillingRule) => {
    setEditingRule(r);
    form.reset({
      name: r.name, type: r.type, customerType: r.customerType || "all", branch: r.branch || "",
      status: r.status || "active", billingFrequency: r.billingFrequency || "monthly",
      invoiceDay: r.invoiceDay ?? 1, dueDateOffset: r.dueDateOffset ?? 7, graceDays: r.graceDays ?? 7,
      autoGenerateInvoice: r.autoGenerateInvoice ?? true, pricingMode: r.pricingMode || "plan_based",
      baseAmount: r.baseAmount || undefined, taxPercent: r.taxPercent || "0", discountPercent: r.discountPercent || "0",
      penaltyType: r.penaltyType || "percentage", penaltyAmount: r.penaltyAmount || undefined,
      penaltyPercent: r.penaltyPercent || undefined, maxPenalty: r.maxPenalty || undefined,
      prorationMethod: r.prorationMethod || "daily",
      debitAccountId: r.debitAccountId || undefined, creditAccountId: r.creditAccountId || undefined,
      taxAccountId: r.taxAccountId || undefined, lateFeeAccountId: r.lateFeeAccountId || undefined,
      autoSuspendDays: r.autoSuspendDays ?? 30, autoDisconnectDays: r.autoDisconnectDays ?? 60,
      autoEmailInvoice: r.autoEmailInvoice ?? true, autoApplyCreditNotes: r.autoApplyCreditNotes ?? false,
      autoSuspendOnNonPayment: r.autoSuspendOnNonPayment ?? false, autoApplyLateFee: r.autoApplyLateFee ?? true,
      autoRecurring: r.autoRecurring ?? true, allowManualOverride: r.allowManualOverride ?? true,
      notifyOnApply: r.notifyOnApply ?? true, isActive: r.isActive, description: r.description || "",
    });
    setDialogOpen(true);
  };

  const cloneRule = (r: BillingRule) => {
    openEdit({ ...r, id: 0 as any, name: `${r.name} (Copy)` });
    setEditingRule(null);
  };

  const onSubmit = (data: InsertBillingRule) => {
    if (editingRule) updateMutation.mutate({ id: editingRule.id, data });
    else createMutation.mutate(data);
  };

  const runSimulation = () => {
    const cust = customers.find(c => c.id === parseInt(simCustomerId));
    const pkg = packages.find(p => p.id === parseInt(simPackageId));
    if (!cust || !pkg) { toast({ title: "Select a customer and package", variant: "destructive" }); return; }
    const base = parseFloat(pkg.price || "0");
    const activeRules = rules.filter(r => r.isActive && r.status === "active");
    let taxRate = 0, discountRate = 0, lateFeeRate = 0;
    activeRules.forEach(r => {
      if (r.type === "tax") taxRate += parseFloat(r.taxPercent || "0");
      if (r.type === "discount") discountRate += parseFloat(r.discountPercent || "0");
      if (r.type === "late_fee") lateFeeRate += parseFloat(r.penaltyPercent || "0");
    });
    if (taxRate === 0) taxRate = 17;
    const tax = base * (taxRate / 100);
    const discount = base * (discountRate / 100);
    const lateFee = base * (lateFeeRate / 100);
    const total = base + tax - discount;
    setSimResult({
      customer: cust.fullName, package: pkg.name, baseAmount: base,
      tax, taxRate, discount, discountRate, lateFee, lateFeeRate,
      total, totalWithLateFee: total + lateFee,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-billing-rules-title">Billing Rules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure automated billing logic, pricing, and collection policies</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setSimOpen(true)} data-testid="button-simulate-billing">
            <Play className="h-4 w-4 mr-1" />Simulate
          </Button>
          <Button onClick={openCreate} data-testid="button-add-billing-rule">
            <Plus className="h-4 w-4 mr-1" />Create Rule
          </Button>
        </div>
      </div>

      {/* ===== KPI Dashboard ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Total Rules", value: kpis.total, icon: Settings2, gradient: "from-[#002B5B] to-[#007BFF]" },
          { label: "Active Rules", value: kpis.active, icon: CheckCircle, gradient: "from-emerald-600 to-emerald-500" },
          { label: "Scheduled", value: kpis.scheduled, icon: Clock, gradient: "from-amber-600 to-amber-500" },
          { label: "Invoices This Month", value: kpis.invoicesThisMonth, icon: Receipt, gradient: "from-blue-600 to-blue-500" },
          { label: "Late Fee Rules", value: kpis.lateFee, icon: AlertTriangle, gradient: "from-orange-600 to-orange-500" },
          { label: "Tax Rules", value: kpis.taxRules, icon: FileText, gradient: "from-slate-700 to-slate-600" },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-md p-4 text-white shadow-sm`} data-testid={`card-kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className="h-4 w-4 text-white/60" />
            </div>
            <div className="text-xl font-bold">{isLoading ? "—" : kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Monthly Performance Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-muted-foreground" />Invoices Generated vs Collected</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="generated" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Generated" />
              <Bar dataKey="collected" fill="#10B981" radius={[4, 4, 0, 0]} name="Collected" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ===== Filters ===== */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4 pb-3 px-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search rules..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9" data-testid="input-search-billing-rules" />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px]" data-testid="select-br-type-filter"><Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(ruleTypeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={customerTypeFilterVal} onValueChange={(v) => { setCustomerTypeFilterVal(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]" data-testid="select-br-customer-filter"><Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="cir">CIR</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="reseller">Reseller</SelectItem>
                <SelectItem value="home">Home</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px]" data-testid="select-br-status-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={clearFilters} data-testid="button-clear-br-filters">
                <X className="h-3.5 w-3.5 mr-1" />Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===== Rules List Table ===== */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Settings2 className="h-14 w-14 mb-3 opacity-20" />
              <p className="font-medium text-lg">No billing rules found</p>
              <p className="text-sm mt-1">{hasFilters ? "Try adjusting your filters" : "Create your first billing rule to automate invoicing"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 border-0">
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Rule Name</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Type</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Customer Type</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden lg:table-cell">Frequency</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden xl:table-cell">Invoice Day</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Status</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden lg:table-cell">Branch</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden xl:table-cell">Last Run</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden xl:table-cell">Next Run</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((r, idx) => {
                    const tc = ruleTypeConfig[r.type] || ruleTypeConfig.recurring;
                    const sc = statusConfig[r.status || "active"] || statusConfig.active;
                    const TypeIcon = tc.icon;
                    return (
                      <TableRow key={r.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/40"} data-testid={`row-billing-rule-${r.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-7 w-7 rounded-md flex items-center justify-center ${r.isActive ? "bg-blue-100 dark:bg-blue-950" : "bg-gray-100 dark:bg-gray-900"}`}>
                              <TypeIcon className={`h-3.5 w-3.5 ${r.isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`} />
                            </div>
                            <div>
                              <span className="font-medium text-sm" data-testid={`text-br-name-${r.id}`}>{r.name}</span>
                              {r.description && <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{r.description}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${tc.color}`} data-testid={`badge-br-type-${r.id}`}>{tc.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs capitalize" data-testid={`text-br-customer-${r.id}`}>{customerTypeLabels[r.customerType || "all"] || r.customerType}</TableCell>
                        <TableCell className="text-xs capitalize hidden lg:table-cell" data-testid={`text-br-frequency-${r.id}`}>{frequencyLabels[r.billingFrequency || "monthly"] || r.billingFrequency}</TableCell>
                        <TableCell className="text-xs hidden xl:table-cell">{r.invoiceDay ? `Day ${r.invoiceDay}` : "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${sc.color}`} data-testid={`badge-br-status-${r.id}`}>
                            {r.isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}{sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{r.branch || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden xl:table-cell">{r.lastExecutionDate ? new Date(r.lastExecutionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden xl:table-cell">{r.nextExecutionDate ? new Date(r.nextExecutionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-br-actions-${r.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailRule(r)} data-testid={`button-view-br-${r.id}`}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(r)} data-testid={`button-edit-br-${r.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => cloneRule(r)} data-testid={`button-clone-br-${r.id}`}><Copy className="h-4 w-4 mr-2" />Clone</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {r.isActive ? (
                                <DropdownMenuItem onClick={() => updateMutation.mutate({ id: r.id, data: { isActive: false, status: "disabled" } })} data-testid={`button-disable-br-${r.id}`}><XCircle className="h-4 w-4 mr-2" />Disable</DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => updateMutation.mutate({ id: r.id, data: { isActive: true, status: "active" } })} data-testid={`button-enable-br-${r.id}`}><CheckCircle className="h-4 w-4 mr-2" />Enable</DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirmId(r.id)} data-testid={`button-delete-br-${r.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} rules</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="text-xs" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} data-testid="button-page-prev">Previous</Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = currentPage <= 3 ? i + 1 : currentPage + i - 2;
              if (page < 1 || page > totalPages) return null;
              return <Button key={page} variant={page === currentPage ? "default" : "outline"} size="icon" className="text-xs w-8 h-8" onClick={() => setCurrentPage(page)} data-testid={`button-page-${page}`}>{page}</Button>;
            })}
            <Button variant="outline" size="sm" className="text-xs" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} data-testid="button-page-next">Next</Button>
          </div>
        </div>
      )}

      {!isLoading && filtered.length > 0 && totalPages <= 1 && (
        <div className="text-xs text-muted-foreground text-right">Showing {filtered.length} of {rules.length} billing rules</div>
      )}

      {/* ===== Rule Detail View ===== */}
      <Dialog open={!!detailRule} onOpenChange={(open) => { if (!open) setDetailRule(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-muted-foreground" />Billing Rule — {detailRule?.name}
            </DialogTitle>
          </DialogHeader>
          {detailRule && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-md p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wider">Rule Type</p>
                    <p className="text-lg font-bold mt-0.5">{ruleTypeConfig[detailRule.type]?.label || detailRule.type}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${statusConfig[detailRule.status || "active"]?.color || ""}`}>
                    {statusConfig[detailRule.status || "active"]?.label || detailRule.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-white/20">
                  <div><p className="text-[10px] text-white/50 uppercase">Customer</p><p className="text-sm font-semibold capitalize">{customerTypeLabels[detailRule.customerType || "all"]}</p></div>
                  <div><p className="text-[10px] text-white/50 uppercase">Frequency</p><p className="text-sm font-semibold capitalize">{frequencyLabels[detailRule.billingFrequency || "monthly"]}</p></div>
                  <div><p className="text-[10px] text-white/50 uppercase">Invoice Day</p><p className="text-sm font-semibold">Day {detailRule.invoiceDay || 1}</p></div>
                  <div><p className="text-[10px] text-white/50 uppercase">Grace Days</p><p className="text-sm font-semibold">{detailRule.graceDays || 7}</p></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Pricing & Penalties</h4>
                  <DetailRow label="Pricing Mode" value={detailRule.pricingMode || "—"} />
                  <DetailRow label="Base Amount" value={detailRule.baseAmount ? formatCurrency(parseFloat(detailRule.baseAmount)) : "Plan-based"} />
                  <DetailRow label="Tax %" value={`${detailRule.taxPercent || 0}%`} />
                  <DetailRow label="Discount %" value={`${detailRule.discountPercent || 0}%`} />
                  <DetailRow label="Penalty Type" value={detailRule.penaltyType || "—"} />
                  <DetailRow label="Late Fee" value={detailRule.penaltyType === "percentage" ? `${detailRule.penaltyPercent || 0}%` : formatCurrency(parseFloat(detailRule.penaltyAmount || "0"))} />
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Automation</h4>
                  <DetailRow label="Auto Generate Invoice" value={detailRule.autoGenerateInvoice ? "Yes" : "No"} />
                  <DetailRow label="Auto Email" value={detailRule.autoEmailInvoice ? "Yes" : "No"} />
                  <DetailRow label="Auto Late Fee" value={detailRule.autoApplyLateFee ? "Yes" : "No"} />
                  <DetailRow label="Auto Suspend" value={detailRule.autoSuspendOnNonPayment ? `After ${detailRule.autoSuspendDays} days` : "No"} />
                  <DetailRow label="Auto Credit Notes" value={detailRule.autoApplyCreditNotes ? "Yes" : "No"} />
                  <DetailRow label="Manual Override" value={detailRule.allowManualOverride ? "Allowed" : "Not Allowed"} />
                </div>
              </div>

              {detailRule.description && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Description</h4>
                  <p className="text-sm text-muted-foreground">{detailRule.description}</p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Execution History</h4>
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Last Executed" value={detailRule.lastExecutionDate ? new Date(detailRule.lastExecutionDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Never"} />
                  <DetailRow label="Next Scheduled" value={detailRule.nextExecutionDate ? new Date(detailRule.nextExecutionDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Not scheduled"} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => { setDetailRule(null); openEdit(detailRule); }} data-testid="button-detail-edit"><Edit className="h-3.5 w-3.5 mr-1" />Edit</Button>
                <Button variant="outline" size="sm" onClick={() => { setDetailRule(null); cloneRule(detailRule); }} data-testid="button-detail-clone"><Copy className="h-3.5 w-3.5 mr-1" />Clone</Button>
                {detailRule.isActive ? (
                  <Button variant="destructive" size="sm" onClick={() => { updateMutation.mutate({ id: detailRule.id, data: { isActive: false, status: "disabled" } }); setDetailRule(null); }}><XCircle className="h-3.5 w-3.5 mr-1" />Disable</Button>
                ) : (
                  <Button variant="default" size="sm" onClick={() => { updateMutation.mutate({ id: detailRule.id, data: { isActive: true, status: "active" } }); setDetailRule(null); }}><CheckCircle className="h-3.5 w-3.5 mr-1" />Enable</Button>
                )}
                <div className="flex-1" />
                <Button variant="ghost" size="sm" onClick={() => setDetailRule(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation ===== */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />Delete Billing Rule</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to permanently delete this billing rule? Active automations will stop immediately.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (deleteConfirmId) deleteMutation.mutate(deleteConfirmId); }} disabled={deleteMutation.isPending} data-testid="button-confirm-delete-br">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Simulation Dialog ===== */}
      <Dialog open={simOpen} onOpenChange={setSimOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Play className="h-5 w-5 text-blue-600" />Rule Testing & Simulation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select a customer and package to simulate billing. The system will calculate the invoice based on active billing rules.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase">Customer</label>
                <Select value={simCustomerId} onValueChange={setSimCustomerId}>
                  <SelectTrigger data-testid="select-sim-customer"><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.fullName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase">Package</label>
                <Select value={simPackageId} onValueChange={setSimPackageId}>
                  <SelectTrigger data-testid="select-sim-package"><SelectValue placeholder="Select package" /></SelectTrigger>
                  <SelectContent>{packages.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} — Rs. {p.price}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={runSimulation} data-testid="button-run-simulation"><Play className="h-4 w-4 mr-1" />Run Simulation</Button>

            {simResult && (
              <div className="space-y-3 pt-2 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Simulation Result</h4>
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-md p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div><p className="text-xs text-white/60">Customer</p><p className="text-sm font-semibold">{simResult.customer}</p></div>
                    <div className="text-right"><p className="text-xs text-white/60">Package</p><p className="text-sm font-semibold">{simResult.package}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20">
                    <div className="space-y-1.5">
                      <SimRow label="Base Amount" value={formatCurrency(simResult.baseAmount)} />
                      <SimRow label={`Tax (${simResult.taxRate}%)`} value={`+ ${formatCurrency(simResult.tax)}`} />
                      <SimRow label={`Discount (${simResult.discountRate}%)`} value={`- ${formatCurrency(simResult.discount)}`} />
                    </div>
                    <div className="space-y-1.5">
                      <SimRow label="Invoice Total" value={formatCurrency(simResult.total)} bold />
                      <SimRow label={`Late Fee (${simResult.lateFeeRate}%)`} value={`+ ${formatCurrency(simResult.lateFee)}`} />
                      <SimRow label="With Late Fee" value={formatCurrency(simResult.totalWithLateFee)} bold />
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Journal Entry Preview</p>
                  <div className="text-xs space-y-0.5 text-muted-foreground">
                    <p>Dr. Accounts Receivable .... {formatCurrency(simResult.total)}</p>
                    <p className="pl-4">Cr. Service Revenue .... {formatCurrency(simResult.baseAmount - simResult.discount)}</p>
                    <p className="pl-4">Cr. Tax Payable .... {formatCurrency(simResult.tax)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Create/Edit Billing Rule Dialog ===== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Billing Rule" : "Create Billing Rule"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Section A — Rule Information</h4>
                <div className="border-t pt-3 space-y-3">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Rule Name</FormLabel><FormControl><Input placeholder="e.g. Corporate Monthly Billing – 1st of Month" data-testid="input-br-name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem><FormLabel>Rule Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "recurring"}>
                          <FormControl><SelectTrigger data-testid="select-br-type"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.entries(ruleTypeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="customerType" render={({ field }) => (
                      <FormItem><FormLabel>Customer Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "all"}>
                          <FormControl><SelectTrigger data-testid="select-br-customer-type"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="all">All Customers</SelectItem>
                            <SelectItem value="cir">CIR</SelectItem>
                            <SelectItem value="corporate">Corporate</SelectItem>
                            <SelectItem value="reseller">Reseller</SelectItem>
                            <SelectItem value="home">Home</SelectItem>
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem><FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "draft"}>
                          <FormControl><SelectTrigger data-testid="select-br-status"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="branch" render={({ field }) => (
                    <FormItem><FormLabel>Branch <span className="text-muted-foreground text-xs">(optional)</span></FormLabel><FormControl><Input placeholder="All branches" data-testid="input-br-branch" {...field} value={field.value || ""} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the billing rule..." rows={2} data-testid="input-br-description" {...field} value={field.value || ""} /></FormControl></FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Section B — Billing Cycle</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <FormField control={form.control} name="billingFrequency" render={({ field }) => (
                      <FormItem><FormLabel>Frequency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "monthly"}>
                          <FormControl><SelectTrigger data-testid="select-br-frequency"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="invoiceDay" render={({ field }) => (
                      <FormItem><FormLabel>Invoice Day</FormLabel><FormControl><Input type="number" min={1} max={28} data-testid="input-br-invoice-day" {...field} value={field.value ?? 1} onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="dueDateOffset" render={({ field }) => (
                      <FormItem><FormLabel>Due Date Offset (days)</FormLabel><FormControl><Input type="number" min={0} data-testid="input-br-due-offset" {...field} value={field.value ?? 7} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="graceDays" render={({ field }) => (
                      <FormItem><FormLabel>Grace Period (days)</FormLabel><FormControl><Input type="number" min={0} data-testid="input-br-grace-days" {...field} value={field.value ?? 7} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="autoGenerateInvoice" render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} data-testid="checkbox-br-auto-generate" /></FormControl>
                      <FormLabel className="!mt-0 text-sm">Auto-generate invoices on schedule</FormLabel>
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />Section C — Pricing & Calculation</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <FormField control={form.control} name="pricingMode" render={({ field }) => (
                      <FormItem><FormLabel>Pricing Mode</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "plan_based"}>
                          <FormControl><SelectTrigger data-testid="select-br-pricing-mode"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                            <SelectItem value="plan_based">Plan-Based</SelectItem>
                            <SelectItem value="usage_based">Usage-Based</SelectItem>
                            <SelectItem value="custom">Custom Formula</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="baseAmount" render={({ field }) => (
                      <FormItem><FormLabel>Base Amount</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Plan price" data-testid="input-br-base-amount" {...field} value={field.value || ""} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="taxPercent" render={({ field }) => (
                      <FormItem><FormLabel>Tax %</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-br-tax-percent" {...field} value={field.value || ""} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="discountPercent" render={({ field }) => (
                      <FormItem><FormLabel>Discount %</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-br-discount-percent" {...field} value={field.value || ""} /></FormControl></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <FormField control={form.control} name="penaltyType" render={({ field }) => (
                      <FormItem><FormLabel>Penalty Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "percentage"}>
                          <FormControl><SelectTrigger data-testid="select-br-penalty-type"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    {form.watch("penaltyType") === "percentage" ? (
                      <FormField control={form.control} name="penaltyPercent" render={({ field }) => (
                        <FormItem><FormLabel>Late Fee %</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-br-penalty-percent" {...field} value={field.value || ""} /></FormControl></FormItem>
                      )} />
                    ) : (
                      <FormField control={form.control} name="penaltyAmount" render={({ field }) => (
                        <FormItem><FormLabel>Late Fee Amount</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-br-penalty-amount" {...field} value={field.value || ""} /></FormControl></FormItem>
                      )} />
                    )}
                    <FormField control={form.control} name="maxPenalty" render={({ field }) => (
                      <FormItem><FormLabel>Max Penalty</FormLabel><FormControl><Input type="number" step="0.01" placeholder="No limit" data-testid="input-br-max-penalty" {...field} value={field.value || ""} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="prorationMethod" render={({ field }) => (
                      <FormItem><FormLabel>Proration Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "daily"}>
                          <FormControl><SelectTrigger data-testid="select-br-proration"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily-based</SelectItem>
                            <SelectItem value="monthly_fixed">Fixed Monthly</SelectItem>
                            <SelectItem value="30_day">30-Day Standard</SelectItem>
                            <SelectItem value="actual_days">Actual Month Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" />Section D — Account Mapping</h4>
                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="debitAccountId" render={({ field }) => (
                      <FormItem><FormLabel>Debit Account <span className="text-muted-foreground text-xs">(A/R)</span></FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === "__none__" ? undefined : parseInt(v))} value={field.value ? field.value.toString() : "__none__"}>
                          <FormControl><SelectTrigger data-testid="select-br-debit-account"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="__none__">— Select —</SelectItem>{accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="creditAccountId" render={({ field }) => (
                      <FormItem><FormLabel>Credit Account <span className="text-muted-foreground text-xs">(Revenue)</span></FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === "__none__" ? undefined : parseInt(v))} value={field.value ? field.value.toString() : "__none__"}>
                          <FormControl><SelectTrigger data-testid="select-br-credit-account"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="__none__">— Select —</SelectItem>{accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="taxAccountId" render={({ field }) => (
                      <FormItem><FormLabel>Tax Payable Account</FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === "__none__" ? undefined : parseInt(v))} value={field.value ? field.value.toString() : "__none__"}>
                          <FormControl><SelectTrigger data-testid="select-br-tax-account"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="__none__">— Select —</SelectItem>{accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="lateFeeAccountId" render={({ field }) => (
                      <FormItem><FormLabel>Late Fee Revenue Account</FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === "__none__" ? undefined : parseInt(v))} value={field.value ? field.value.toString() : "__none__"}>
                          <FormControl><SelectTrigger data-testid="select-br-late-fee-account"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="__none__">— Select —</SelectItem>{accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" />Section E — Automation Settings</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <FormField control={form.control} name="autoEmailInvoice" render={({ field }) => (
                      <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} data-testid="checkbox-br-auto-email" /></FormControl><FormLabel className="!mt-0 text-sm">Auto email invoice</FormLabel></FormItem>
                    )} />
                    <FormField control={form.control} name="autoApplyCreditNotes" render={({ field }) => (
                      <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="checkbox-br-auto-credit" /></FormControl><FormLabel className="!mt-0 text-sm">Auto apply credit notes</FormLabel></FormItem>
                    )} />
                    <FormField control={form.control} name="autoSuspendOnNonPayment" render={({ field }) => (
                      <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="checkbox-br-auto-suspend" /></FormControl><FormLabel className="!mt-0 text-sm">Auto suspend on non-payment</FormLabel></FormItem>
                    )} />
                    <FormField control={form.control} name="autoApplyLateFee" render={({ field }) => (
                      <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} data-testid="checkbox-br-auto-late-fee" /></FormControl><FormLabel className="!mt-0 text-sm">Auto apply late fee</FormLabel></FormItem>
                    )} />
                    <FormField control={form.control} name="autoRecurring" render={({ field }) => (
                      <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} data-testid="checkbox-br-auto-recurring" /></FormControl><FormLabel className="!mt-0 text-sm">Auto recurring generation</FormLabel></FormItem>
                    )} />
                    <FormField control={form.control} name="allowManualOverride" render={({ field }) => (
                      <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} data-testid="checkbox-br-manual-override" /></FormControl><FormLabel className="!mt-0 text-sm">Allow manual override</FormLabel></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="autoSuspendDays" render={({ field }) => (
                      <FormItem><FormLabel>Auto Suspend After (days)</FormLabel><FormControl><Input type="number" min={0} data-testid="input-br-suspend-days" {...field} value={field.value ?? 30} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="autoDisconnectDays" render={({ field }) => (
                      <FormItem><FormLabel>Auto Disconnect After (days)</FormLabel><FormControl><Input type="number" min={0} data-testid="input-br-disconnect-days" {...field} value={field.value ?? 60} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl></FormItem>
                    )} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-billing-rule">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingRule ? "Update Rule" : "Create Rule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}

function SimRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-white/60">{label}</span>
      <span className={bold ? "font-bold text-white" : "text-white/80"}>{value}</span>
    </div>
  );
}