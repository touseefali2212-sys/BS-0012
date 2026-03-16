import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, CreditCard, DollarSign,
  Clock, CheckCircle, XCircle, AlertCircle, Wallet, Settings, Filter, X,
  Eye, Shield, Zap, TrendingUp, Globe, Key, Link2, BarChart3, Activity,
  ArrowUpRight, RefreshCw, Ban, Lock, Layers, Building2, FileText,
  Copy, AlertTriangle, Banknote, Users, Receipt, ChevronRight,
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
  insertPaymentSchema,
  type Payment, type InsertPayment,
  insertPaymentGatewaySchema,
  type PaymentGateway, type InsertPaymentGateway,
  type Customer, type Account,
} from "@shared/schema";
import { z } from "zod";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area,
} from "recharts";

const paymentFormSchema = insertPaymentSchema.extend({
  paymentId: z.string().min(1, "Payment ID is required"),
  customerId: z.coerce.number().min(1, "Customer is required"),
  amount: z.string().min(1, "Amount is required"),
  method: z.string().min(1, "Method is required"),
  status: z.string().min(1, "Status is required"),
  paidAt: z.string().min(1, "Date is required"),
});

const gatewayFormSchema = insertPaymentGatewaySchema.extend({
  name: z.string().min(1, "Gateway name is required"),
  provider: z.string().min(1, "Provider is required"),
});

const providerTypeConfig: Record<string, { label: string; color: string; icon: any }> = {
  bank_integration: { label: "Bank Integration", color: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800", icon: Building2 },
  card_payment: { label: "Card Payment", color: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800", icon: CreditCard },
  wallet: { label: "Wallet", color: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800", icon: Wallet },
  online_gateway: { label: "Online Gateway", color: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800", icon: Globe },
  manual_link: { label: "Manual Link", color: "bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300 border-slate-200 dark:border-slate-800", icon: Link2 },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800" },
  testing: { label: "Testing", color: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
  disabled: { label: "Disabled", color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800" },
};

const txnStatusConfig: Record<string, { label: string; color: string }> = {
  completed: { label: "Successful", color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800" },
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
  failed: { label: "Failed", color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800" },
  refunded: { label: "Refunded", color: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
};

const formatCurrency = (v: number) => `Rs. ${v.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

type ActiveSection = "dashboard" | "gateways" | "transactions" | "settlements";

export default function PaymentGatewayPage() {
  const { toast } = useToast();
  const [section, setSection] = useState<ActiveSection>("dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [txnSearch, setTxnSearch] = useState("");
  const [txnStatusFilter, setTxnStatusFilter] = useState("all");
  const [txnGatewayFilter, setTxnGatewayFilter] = useState("all");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [gatewayDialogOpen, setGatewayDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);
  const [deleteGatewayId, setDeleteGatewayId] = useState<number | null>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<number | null>(null);
  const [detailGateway, setDetailGateway] = useState<PaymentGateway | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<(Payment & { customerName?: string })[]>({ queryKey: ["/api/payments"] });
  const { data: gateways = [], isLoading: gatewaysLoading } = useQuery<PaymentGateway[]>({ queryKey: ["/api/payment-gateways"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: accounts = [] } = useQuery<Account[]>({ queryKey: ["/api/accounts"] });

  const paymentForm = useForm<InsertPayment>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentId: "", customerId: 0, invoiceId: undefined, amount: "", method: "cash",
      gateway: "", transactionRef: "", status: "completed",
      paidAt: new Date().toISOString().split("T")[0], receivedBy: "", notes: "",
    },
  });

  const gatewayForm = useForm<InsertPaymentGateway>({
    resolver: zodResolver(gatewayFormSchema),
    defaultValues: {
      name: "", provider: "jazzcash", providerType: "online_gateway", merchantId: "",
      apiKey: "", apiSecret: "", publicKey: "", webhookUrl: "", callbackUrl: "",
      mode: "test", status: "testing", isActive: false, supportedMethods: "",
      debitAccountId: undefined, creditAccountId: undefined, chargesAccountId: undefined,
      taxChargesAccountId: undefined, autoMarkPaid: true, partialPayment: false,
      autoSendReceipt: true, autoGenerateIncome: true, autoApplyLateFee: false,
      autoAdjustCredit: false, maxTransactionLimit: undefined, dailyTransactionCap: undefined,
      ipValidation: false, duplicatePrevention: true, webhookVerification: true,
      encryptCredentials: true, gatewayChargePercent: "0", notes: "",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: InsertPayment) => { const res = await apiRequest("POST", "/api/payments", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/payments"] }); setPaymentDialogOpen(false); setEditingPayment(null); paymentForm.reset(); toast({ title: "Payment recorded successfully" }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertPayment> }) => { const res = await apiRequest("PATCH", `/api/payments/${id}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/payments"] }); setPaymentDialogOpen(false); setEditingPayment(null); paymentForm.reset(); toast({ title: "Payment updated" }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/payments/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/payments"] }); setDeletePaymentId(null); toast({ title: "Payment deleted" }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); setDeletePaymentId(null); },
  });

  const createGatewayMutation = useMutation({
    mutationFn: async (data: InsertPaymentGateway) => {
      const payload = { ...data, createdAt: new Date().toISOString() };
      const res = await apiRequest("POST", "/api/payment-gateways", payload); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/payment-gateways"] }); setGatewayDialogOpen(false); setEditingGateway(null); gatewayForm.reset(); toast({ title: "Gateway configured successfully" }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const updateGatewayMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertPaymentGateway> }) => { const res = await apiRequest("PATCH", `/api/payment-gateways/${id}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/payment-gateways"] }); setGatewayDialogOpen(false); setEditingGateway(null); gatewayForm.reset(); toast({ title: "Gateway updated" }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const deleteGatewayMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/payment-gateways/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/payment-gateways"] }); setDeleteGatewayId(null); toast({ title: "Gateway deleted" }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); setDeleteGatewayId(null); },
  });

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = new Date().toISOString().slice(0, 7);

  const kpis = useMemo(() => {
    const activeGateways = gateways.filter(g => g.isActive && (g.status === "active" || g.status === "testing")).length;
    const todayPayments = payments.filter(p => p.paidAt?.startsWith(today) && p.status === "completed");
    const todayCollection = todayPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const monthPayments = payments.filter(p => p.paidAt?.startsWith(thisMonth) && p.status === "completed");
    const monthCollection = monthPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const pendingSettlements = payments.filter(p => p.status === "pending").length;
    const failedTxns = payments.filter(p => p.status === "failed").length;
    const successRate = payments.length > 0 ? ((payments.filter(p => p.status === "completed").length / payments.length) * 100).toFixed(1) : "0";
    return { activeGateways, todayCollection, monthCollection, pendingSettlements, failedTxns, successRate, totalPayments: payments.length };
  }, [gateways, payments, today, thisMonth]);

  const chartData = useMemo(() => {
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayPayments = payments.filter(p => p.paidAt?.startsWith(key) && p.status === "completed");
      last7.push({ name: label, amount: dayPayments.reduce((s, p) => s + Number(p.amount || 0), 0), count: dayPayments.length });
    }
    return last7;
  }, [payments]);

  const filteredGateways = useMemo(() => {
    let items = [...gateways];
    if (search) { const q = search.toLowerCase(); items = items.filter(g => g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q)); }
    if (statusFilter !== "all") items = items.filter(g => g.status === statusFilter);
    if (typeFilter !== "all") items = items.filter(g => g.providerType === typeFilter);
    return items;
  }, [gateways, search, statusFilter, typeFilter]);

  const filteredPayments = useMemo(() => {
    let items = [...payments];
    if (txnSearch) { const q = txnSearch.toLowerCase(); items = items.filter(p => p.paymentId.toLowerCase().includes(q) || (p as any).customerName?.toLowerCase().includes(q) || p.transactionRef?.toLowerCase().includes(q)); }
    if (txnStatusFilter !== "all") items = items.filter(p => p.status === txnStatusFilter);
    if (txnGatewayFilter !== "all") items = items.filter(p => p.gateway === txnGatewayFilter);
    return items;
  }, [payments, txnSearch, txnStatusFilter, txnGatewayFilter]);

  const totalTxnPages = Math.ceil(filteredPayments.length / PAGE_SIZE);
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasGwFilters = search || statusFilter !== "all" || typeFilter !== "all";
  const hasTxnFilters = txnSearch || txnStatusFilter !== "all" || txnGatewayFilter !== "all";

  const openGatewayCreate = () => {
    setEditingGateway(null);
    gatewayForm.reset({
      name: "", provider: "jazzcash", providerType: "online_gateway", merchantId: "",
      apiKey: "", apiSecret: "", publicKey: "", webhookUrl: "", callbackUrl: "",
      mode: "test", status: "testing", isActive: false, supportedMethods: "",
      debitAccountId: undefined, creditAccountId: undefined, chargesAccountId: undefined,
      taxChargesAccountId: undefined, autoMarkPaid: true, partialPayment: false,
      autoSendReceipt: true, autoGenerateIncome: true, autoApplyLateFee: false,
      autoAdjustCredit: false, maxTransactionLimit: undefined, dailyTransactionCap: undefined,
      ipValidation: false, duplicatePrevention: true, webhookVerification: true,
      encryptCredentials: true, gatewayChargePercent: "0", notes: "",
    });
    setGatewayDialogOpen(true);
  };

  const openGatewayEdit = (g: PaymentGateway) => {
    setEditingGateway(g);
    gatewayForm.reset({
      name: g.name, provider: g.provider, providerType: g.providerType || "online_gateway",
      merchantId: g.merchantId || "", apiKey: g.apiKey || "", apiSecret: g.apiSecret || "",
      publicKey: g.publicKey || "", webhookUrl: g.webhookUrl || "", callbackUrl: g.callbackUrl || "",
      mode: g.mode, status: g.status || "testing", isActive: g.isActive,
      supportedMethods: g.supportedMethods || "",
      debitAccountId: g.debitAccountId || undefined, creditAccountId: g.creditAccountId || undefined,
      chargesAccountId: g.chargesAccountId || undefined, taxChargesAccountId: g.taxChargesAccountId || undefined,
      autoMarkPaid: g.autoMarkPaid ?? true, partialPayment: g.partialPayment ?? false,
      autoSendReceipt: g.autoSendReceipt ?? true, autoGenerateIncome: g.autoGenerateIncome ?? true,
      autoApplyLateFee: g.autoApplyLateFee ?? false, autoAdjustCredit: g.autoAdjustCredit ?? false,
      maxTransactionLimit: g.maxTransactionLimit || undefined, dailyTransactionCap: g.dailyTransactionCap || undefined,
      ipValidation: g.ipValidation ?? false, duplicatePrevention: g.duplicatePrevention ?? true,
      webhookVerification: g.webhookVerification ?? true, encryptCredentials: g.encryptCredentials ?? true,
      gatewayChargePercent: g.gatewayChargePercent || "0", notes: g.notes || "",
    });
    setGatewayDialogOpen(true);
  };

  const onGatewaySubmit = (data: InsertPaymentGateway) => {
    if (editingGateway) updateGatewayMutation.mutate({ id: editingGateway.id, data });
    else createGatewayMutation.mutate(data);
  };

  const openPaymentCreate = () => {
    setEditingPayment(null);
    paymentForm.reset({
      paymentId: `PAY-${Date.now().toString(36).toUpperCase()}`, customerId: 0, invoiceId: undefined,
      amount: "", method: "online", gateway: "", transactionRef: "", status: "completed",
      paidAt: new Date().toISOString().split("T")[0], receivedBy: "", notes: "",
    });
    setPaymentDialogOpen(true);
  };

  const openPaymentEdit = (p: Payment) => {
    setEditingPayment(p);
    paymentForm.reset({
      paymentId: p.paymentId, customerId: p.customerId, invoiceId: p.invoiceId,
      amount: p.amount, method: p.method, gateway: p.gateway || "",
      transactionRef: p.transactionRef || "", status: p.status,
      paidAt: p.paidAt, receivedBy: p.receivedBy || "", notes: p.notes || "",
    });
    setPaymentDialogOpen(true);
  };

  const onPaymentSubmit = (data: InsertPayment) => {
    if (editingPayment) updatePaymentMutation.mutate({ id: editingPayment.id, data });
    else createPaymentMutation.mutate(data);
  };

  const handleTestConnection = (g: PaymentGateway) => {
    toast({ title: `Testing ${g.name}...`, description: `Connecting to ${g.provider} in ${g.mode} mode` });
    setTimeout(() => {
      toast({ title: "Connection Successful", description: `${g.name} responded correctly in ${g.mode} mode` });
    }, 1500);
  };

  const sectionTabs: { id: ActiveSection; label: string; icon: any }[] = [
    { id: "dashboard", label: "Overview", icon: BarChart3 },
    { id: "gateways", label: "Gateways", icon: Settings },
    { id: "transactions", label: "Transactions", icon: Activity },
    { id: "settlements", label: "Settlements", icon: Banknote },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-pg-title">Payment Gateway</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage payment integrations, monitor transactions, and track settlements</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {section === "transactions" && (
            <Button variant="outline" onClick={openPaymentCreate} data-testid="button-add-payment"><Plus className="h-4 w-4 mr-1" />Record Payment</Button>
          )}
          {(section === "gateways" || section === "dashboard") && (
            <Button onClick={openGatewayCreate} data-testid="button-add-gateway"><Plus className="h-4 w-4 mr-1" />Add Gateway</Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 border-b pb-0">
        {sectionTabs.map((t) => (
          <button key={t.id} onClick={() => { setSection(t.id); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              section === t.id ? "border-blue-600 text-blue-700 dark:text-blue-300" : "border-transparent text-muted-foreground"
            }`} data-testid={`tab-${t.id}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {/* ===== KPI Dashboard ===== */}
      {section === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: "Active Gateways", value: kpis.activeGateways, icon: Globe, gradient: "from-[#002B5B] to-[#007BFF]" },
              { label: "Online Today", value: formatCurrency(kpis.todayCollection), icon: Zap, gradient: "from-emerald-600 to-emerald-500" },
              { label: "This Month", value: formatCurrency(kpis.monthCollection), icon: TrendingUp, gradient: "from-blue-600 to-blue-500" },
              { label: "Pending", value: kpis.pendingSettlements, icon: Clock, gradient: "from-amber-600 to-amber-500" },
              { label: "Failed Txns", value: kpis.failedTxns, icon: AlertCircle, gradient: "from-red-600 to-red-500" },
              { label: "Success Rate", value: `${kpis.successRate}%`, icon: CheckCircle, gradient: "from-teal-600 to-teal-500" },
            ].map((kpi) => (
              <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-md p-4 text-white shadow-sm`} data-testid={`card-kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-white/60" />
                </div>
                <div className="text-xl font-bold">{paymentsLoading || gatewaysLoading ? "—" : kpi.value}</div>
              </div>
            ))}
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-muted-foreground" />Daily Online Payment Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="amount" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} name="Collection" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {gateways.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Gateway Cards</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gateways.slice(0, 6).map((g) => {
                  const tc = providerTypeConfig[g.providerType || "online_gateway"] || providerTypeConfig.online_gateway;
                  const sc = statusConfig[g.status || "testing"] || statusConfig.testing;
                  const TypeIcon = tc.icon;
                  return (
                    <Card key={g.id} className="border shadow-sm" data-testid={`card-gateway-${g.id}`}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-9 w-9 rounded-md flex items-center justify-center ${g.isActive ? "bg-blue-100 dark:bg-blue-950" : "bg-gray-100 dark:bg-gray-900"}`}>
                              <TypeIcon className={`h-4 w-4 ${g.isActive ? "text-blue-600" : "text-gray-400"}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{g.name}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">{g.provider}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${sc.color}`}>{sc.label}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1 border-t">
                          <div><p className="text-[10px] text-muted-foreground">Mode</p><p className="text-xs font-medium capitalize">{g.mode}</p></div>
                          <div><p className="text-[10px] text-muted-foreground">Charge</p><p className="text-xs font-medium">{g.gatewayChargePercent || "0"}%</p></div>
                          <div><p className="text-[10px] text-muted-foreground">Txns</p><p className="text-xs font-medium">{g.totalTransactions}</p></div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => setDetailGateway(g)} data-testid={`button-view-gw-${g.id}`}><Eye className="h-3 w-3 mr-1" />View</Button>
                          <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => handleTestConnection(g)} data-testid={`button-test-gw-${g.id}`}><RefreshCw className="h-3 w-3 mr-1" />Test</Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Gateways Section ===== */}
      {section === "gateways" && (
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3 px-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search gateways..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-gateways" />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-gw-type-filter"><Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(providerTypeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]" data-testid="select-gw-status-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                {hasGwFilters && <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); }} data-testid="button-clear-gw-filters"><X className="h-3.5 w-3.5 mr-1" />Clear</Button>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-0">
              {gatewaysLoading ? (
                <div className="p-5 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filteredGateways.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Globe className="h-14 w-14 mb-3 opacity-20" />
                  <p className="font-medium text-lg">No payment gateways configured</p>
                  <p className="text-sm mt-1">{hasGwFilters ? "Try adjusting your filters" : "Add your first payment gateway integration"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 border-0">
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Gateway</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Type</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Mode</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden lg:table-cell">Linked Account</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Status</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden xl:table-cell">Last Txn</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden lg:table-cell">Monthly</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGateways.map((g, idx) => {
                        const tc = providerTypeConfig[g.providerType || "online_gateway"] || providerTypeConfig.online_gateway;
                        const sc = statusConfig[g.status || "testing"] || statusConfig.testing;
                        const TypeIcon = tc.icon;
                        const linkedAcc = g.debitAccountId ? accounts.find(a => a.id === g.debitAccountId) : null;
                        return (
                          <TableRow key={g.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/40"} data-testid={`row-gateway-${g.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className={`h-8 w-8 rounded-md flex items-center justify-center ${g.isActive ? "bg-blue-100 dark:bg-blue-950" : "bg-gray-100 dark:bg-gray-900"}`}>
                                  <TypeIcon className={`h-4 w-4 ${g.isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`} />
                                </div>
                                <div>
                                  <span className="font-medium text-sm" data-testid={`text-gw-name-${g.id}`}>{g.name}</span>
                                  <p className="text-[10px] text-muted-foreground capitalize">{g.provider}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${tc.color}`}>{tc.label}</Badge></TableCell>
                            <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${g.mode === "live" ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800" : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800"}`}>{g.mode === "live" ? "Production" : "Sandbox"}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{linkedAcc ? `${linkedAcc.code} — ${linkedAcc.name}` : "—"}</TableCell>
                            <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${sc.color}`}>{g.isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}{sc.label}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden xl:table-cell">{g.lastTransactionDate ? new Date(g.lastTransactionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</TableCell>
                            <TableCell className="text-xs font-medium hidden lg:table-cell">{formatCurrency(Number(g.monthlyCollection || 0))}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-gw-actions-${g.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setDetailGateway(g)} data-testid={`button-view-detail-gw-${g.id}`}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openGatewayEdit(g)} data-testid={`button-edit-gw-${g.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleTestConnection(g)} data-testid={`button-test-conn-${g.id}`}><RefreshCw className="h-4 w-4 mr-2" />Test Connection</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {g.isActive ? (
                                    <DropdownMenuItem onClick={() => updateGatewayMutation.mutate({ id: g.id, data: { isActive: false, status: "disabled" } })}><XCircle className="h-4 w-4 mr-2" />Disable</DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => updateGatewayMutation.mutate({ id: g.id, data: { isActive: true, status: "active" } })}><CheckCircle className="h-4 w-4 mr-2" />Enable</DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteGatewayId(g.id)} data-testid={`button-delete-gw-${g.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
          <div className="text-xs text-muted-foreground text-right">Showing {filteredGateways.length} of {gateways.length} gateways</div>
        </div>
      )}

      {/* ===== Transactions Section ===== */}
      {section === "transactions" && (
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-3 px-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by ID, customer, ref..." value={txnSearch} onChange={(e) => { setTxnSearch(e.target.value); setCurrentPage(1); }} className="pl-9" data-testid="input-search-txns" />
                </div>
                <Select value={txnStatusFilter} onValueChange={(v) => { setTxnStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px]" data-testid="select-txn-status-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Successful</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={txnGatewayFilter} onValueChange={(v) => { setTxnGatewayFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[150px]" data-testid="select-txn-gateway-filter"><Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Gateways</SelectItem>
                    {gateways.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {hasTxnFilters && <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setTxnSearch(""); setTxnStatusFilter("all"); setTxnGatewayFilter("all"); setCurrentPage(1); }} data-testid="button-clear-txn-filters"><X className="h-3.5 w-3.5 mr-1" />Clear</Button>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-0">
              {paymentsLoading ? (
                <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filteredPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Activity className="h-14 w-14 mb-3 opacity-20" />
                  <p className="font-medium text-lg">No transactions found</p>
                  <p className="text-sm mt-1">{hasTxnFilters ? "Try adjusting your filters" : "Transactions will appear when payments are processed"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 border-0">
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Payment ID</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Date</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Customer</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden lg:table-cell">Gateway</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Method</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 text-right">Amount</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden xl:table-cell">Ref</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Status</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPayments.map((p, idx) => {
                        const sc = txnStatusConfig[p.status] || txnStatusConfig.completed;
                        const cust = customers.find(c => c.id === p.customerId);
                        return (
                          <TableRow key={p.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/40"} data-testid={`row-txn-${p.id}`}>
                            <TableCell className="font-mono text-xs font-medium" data-testid={`text-txn-id-${p.id}`}>{p.paymentId}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</TableCell>
                            <TableCell className="text-sm" data-testid={`text-txn-customer-${p.id}`}>{(p as any).customerName || cust?.fullName || "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{p.gateway || "—"}</TableCell>
                            <TableCell className="text-xs capitalize">{p.method.replace(/_/g, " ")}</TableCell>
                            <TableCell className="text-sm font-medium text-right" data-testid={`text-txn-amount-${p.id}`}>{formatCurrency(Number(p.amount))}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono hidden xl:table-cell">{p.transactionRef || "—"}</TableCell>
                            <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${sc.color}`}>{sc.label}</Badge></TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-txn-actions-${p.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openPaymentEdit(p)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => setDeletePaymentId(p.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
          {totalTxnPages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredPayments.length)} of {filteredPayments.length}</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="text-xs" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" className="text-xs" disabled={currentPage === totalTxnPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
          {totalTxnPages <= 1 && filteredPayments.length > 0 && (
            <div className="text-xs text-muted-foreground text-right">Showing {filteredPayments.length} of {payments.length} transactions</div>
          )}
        </div>
      )}

      {/* ===== Settlements Section ===== */}
      {section === "settlements" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Settled This Month", value: formatCurrency(payments.filter(p => p.paidAt?.startsWith(thisMonth) && p.status === "completed").reduce((s, p) => s + Number(p.amount || 0), 0)), icon: CheckCircle, color: "text-green-700 dark:text-green-300" },
              { label: "Pending Settlement", value: formatCurrency(payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount || 0), 0)), icon: Clock, color: "text-amber-700 dark:text-amber-300" },
              { label: "Gateway Charges (Est.)", value: formatCurrency(payments.filter(p => p.status === "completed" && p.paidAt?.startsWith(thisMonth)).reduce((s, p) => { const gw = gateways.find(g => g.name === p.gateway); const rate = Number(gw?.gatewayChargePercent || 0); return s + (Number(p.amount || 0) * rate / 100); }, 0)), icon: Banknote, color: "text-blue-700 dark:text-blue-300" },
            ].map((item) => (
              <Card key={item.label} className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      <p className={`text-xl font-bold mt-1 ${item.color}`}>{item.value}</p>
                    </div>
                    <item.icon className={`h-8 w-8 opacity-20 ${item.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 border-0">
                      <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Gateway</TableHead>
                      <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Total Collected</TableHead>
                      <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Charges Deducted</TableHead>
                      <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Net Settlement</TableHead>
                      <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Txn Count</TableHead>
                      <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gateways.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No gateways configured for settlement tracking</TableCell></TableRow>
                    ) : gateways.map((g, idx) => {
                      const gwPayments = payments.filter(p => p.gateway === g.name && p.status === "completed" && p.paidAt?.startsWith(thisMonth));
                      const total = gwPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
                      const chargeRate = Number(g.gatewayChargePercent || 0);
                      const charges = total * chargeRate / 100;
                      const net = total - charges;
                      return (
                        <TableRow key={g.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/40"} data-testid={`row-settlement-${g.id}`}>
                          <TableCell className="font-medium text-sm">{g.name}</TableCell>
                          <TableCell className="text-sm font-medium">{formatCurrency(total)}</TableCell>
                          <TableCell className="text-sm text-red-600 dark:text-red-400">{formatCurrency(charges)}</TableCell>
                          <TableCell className="text-sm font-bold text-green-700 dark:text-green-300">{formatCurrency(net)}</TableCell>
                          <TableCell className="text-sm">{gwPayments.length}</TableCell>
                          <TableCell><Badge variant="outline" className="no-default-active-elevate text-[10px] font-medium bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800">Settled</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-md bg-blue-100 dark:bg-blue-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Journal Entry Preview</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">When a customer pays online, the system auto-posts:</p>
                  <div className="text-xs space-y-1 text-muted-foreground bg-slate-50 dark:bg-slate-900 p-3 rounded-md font-mono">
                    <p>Dr. Bank Account .............. Net Amount</p>
                    <p>Dr. Gateway Charges Expense ... Charges</p>
                    <p className="pl-4">Cr. Accounts Receivable ...... Invoice Total</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== Gateway Detail Dialog ===== */}
      <Dialog open={!!detailGateway} onOpenChange={(open) => { if (!open) setDetailGateway(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-muted-foreground" />Gateway — {detailGateway?.name}</DialogTitle>
          </DialogHeader>
          {detailGateway && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-md p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wider">Provider</p>
                    <p className="text-lg font-bold capitalize mt-0.5">{detailGateway.provider}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${statusConfig[detailGateway.status || "testing"]?.color || ""}`}>
                    {statusConfig[detailGateway.status || "testing"]?.label || detailGateway.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-white/20">
                  <div><p className="text-[10px] text-white/50 uppercase">Type</p><p className="text-sm font-semibold">{providerTypeConfig[detailGateway.providerType || "online_gateway"]?.label}</p></div>
                  <div><p className="text-[10px] text-white/50 uppercase">Mode</p><p className="text-sm font-semibold capitalize">{detailGateway.mode === "live" ? "Production" : "Sandbox"}</p></div>
                  <div><p className="text-[10px] text-white/50 uppercase">Charge %</p><p className="text-sm font-semibold">{detailGateway.gatewayChargePercent || "0"}%</p></div>
                  <div><p className="text-[10px] text-white/50 uppercase">Total Txns</p><p className="text-sm font-semibold">{detailGateway.totalTransactions}</p></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">API Configuration</h4>
                  <DetailRow label="Merchant ID" value={detailGateway.merchantId || "—"} />
                  <DetailRow label="API Key" value={detailGateway.apiKey ? "••••••••" + detailGateway.apiKey.slice(-4) : "—"} />
                  <DetailRow label="Webhook URL" value={detailGateway.webhookUrl || "—"} />
                  <DetailRow label="Callback URL" value={detailGateway.callbackUrl || "—"} />
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Automation</h4>
                  <DetailRow label="Auto Mark Paid" value={detailGateway.autoMarkPaid ? "Yes" : "No"} />
                  <DetailRow label="Auto Send Receipt" value={detailGateway.autoSendReceipt ? "Yes" : "No"} />
                  <DetailRow label="Auto Income Entry" value={detailGateway.autoGenerateIncome ? "Yes" : "No"} />
                  <DetailRow label="Partial Payment" value={detailGateway.partialPayment ? "Allowed" : "Not Allowed"} />
                  <DetailRow label="Auto Late Fee" value={detailGateway.autoApplyLateFee ? "Yes" : "No"} />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Security</h4>
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="Max Transaction" value={detailGateway.maxTransactionLimit ? formatCurrency(Number(detailGateway.maxTransactionLimit)) : "Unlimited"} />
                  <DetailRow label="Daily Cap" value={detailGateway.dailyTransactionCap ? formatCurrency(Number(detailGateway.dailyTransactionCap)) : "Unlimited"} />
                  <DetailRow label="IP Validation" value={detailGateway.ipValidation ? "Enabled" : "Disabled"} />
                  <DetailRow label="Duplicate Prevention" value={detailGateway.duplicatePrevention ? "Enabled" : "Disabled"} />
                  <DetailRow label="Webhook Verification" value={detailGateway.webhookVerification ? "Enabled" : "Disabled"} />
                  <DetailRow label="Encrypt Credentials" value={detailGateway.encryptCredentials ? "Yes" : "No"} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => { setDetailGateway(null); openGatewayEdit(detailGateway); }}><Edit className="h-3.5 w-3.5 mr-1" />Edit</Button>
                <Button variant="outline" size="sm" onClick={() => handleTestConnection(detailGateway)}><RefreshCw className="h-3.5 w-3.5 mr-1" />Test</Button>
                <div className="flex-1" />
                <Button variant="ghost" size="sm" onClick={() => setDetailGateway(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Delete Gateway Confirm ===== */}
      <Dialog open={deleteGatewayId !== null} onOpenChange={(open) => { if (!open) setDeleteGatewayId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />Delete Gateway</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently remove the gateway configuration. Active payment integrations will stop working.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteGatewayId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (deleteGatewayId) deleteGatewayMutation.mutate(deleteGatewayId); }} disabled={deleteGatewayMutation.isPending} data-testid="button-confirm-delete-gw">{deleteGatewayMutation.isPending ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Payment Confirm ===== */}
      <Dialog open={deletePaymentId !== null} onOpenChange={(open) => { if (!open) setDeletePaymentId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />Delete Payment</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete this payment record.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeletePaymentId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (deletePaymentId) deletePaymentMutation.mutate(deletePaymentId); }} disabled={deletePaymentMutation.isPending} data-testid="button-confirm-delete-payment">{deletePaymentMutation.isPending ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Payment Form Dialog ===== */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPayment ? "Edit Payment" : "Record Payment"}</DialogTitle></DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={paymentForm.control} name="paymentId" render={({ field }) => (
                  <FormItem><FormLabel>Payment ID</FormLabel><FormControl><Input data-testid="input-payment-id" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={paymentForm.control} name="paidAt" render={({ field }) => (
                  <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" data-testid="input-payment-date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={paymentForm.control} name="customerId" render={({ field }) => (
                <FormItem><FormLabel>Customer</FormLabel>
                  <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value ? field.value.toString() : ""}>
                    <FormControl><SelectTrigger data-testid="select-payment-customer"><SelectValue placeholder="Select customer" /></SelectTrigger></FormControl>
                    <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.fullName}</SelectItem>)}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={paymentForm.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-payment-amount" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={paymentForm.control} name="method" render={({ field }) => (
                  <FormItem><FormLabel>Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-payment-method"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="jazzcash">JazzCash/Wallet</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={paymentForm.control} name="gateway" render={({ field }) => (
                  <FormItem><FormLabel>Gateway</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "__none__"}>
                      <FormControl><SelectTrigger data-testid="select-payment-gateway"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="__none__">None</SelectItem>{gateways.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={paymentForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-payment-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="completed">Successful</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={paymentForm.control} name="transactionRef" render={({ field }) => (
                <FormItem><FormLabel>Transaction Reference</FormLabel><FormControl><Input placeholder="Gateway reference ID" data-testid="input-payment-ref" {...field} value={field.value || ""} /></FormControl></FormItem>
              )} />
              <FormField control={paymentForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={2} placeholder="Optional notes" data-testid="input-payment-notes" {...field} value={field.value || ""} /></FormControl></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createPaymentMutation.isPending || updatePaymentMutation.isPending} data-testid="button-save-payment">
                  {createPaymentMutation.isPending || updatePaymentMutation.isPending ? "Saving..." : editingPayment ? "Update" : "Record Payment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== Gateway Configuration Dialog ===== */}
      <Dialog open={gatewayDialogOpen} onOpenChange={setGatewayDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingGateway ? "Edit Gateway Configuration" : "Add Payment Gateway"}</DialogTitle></DialogHeader>
          <Form {...gatewayForm}>
            <form onSubmit={gatewayForm.handleSubmit(onGatewaySubmit)} className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Section A — Basic Information</h4>
                <div className="border-t pt-3 space-y-3">
                  <FormField control={gatewayForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Gateway Name</FormLabel><FormControl><Input placeholder="e.g. JazzCash Production" data-testid="input-gw-name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <FormField control={gatewayForm.control} name="provider" render={({ field }) => (
                      <FormItem><FormLabel>Provider</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger data-testid="select-gw-provider"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="jazzcash">JazzCash</SelectItem>
                            <SelectItem value="easypaisa">Easypaisa</SelectItem>
                            <SelectItem value="stripe">Stripe</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="hbl">HBL Connect</SelectItem>
                            <SelectItem value="meezan">Meezan Bank</SelectItem>
                            <SelectItem value="ubl">UBL Omni</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="providerType" render={({ field }) => (
                      <FormItem><FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "online_gateway"}>
                          <FormControl><SelectTrigger data-testid="select-gw-type"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.entries(providerTypeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="mode" render={({ field }) => (
                      <FormItem><FormLabel>Environment</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger data-testid="select-gw-mode"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="test">Sandbox</SelectItem>
                            <SelectItem value="live">Production</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="status" render={({ field }) => (
                      <FormItem><FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "testing"}>
                          <FormControl><SelectTrigger data-testid="select-gw-status"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="testing">Testing</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={gatewayForm.control} name="supportedMethods" render={({ field }) => (
                    <FormItem><FormLabel>Supported Methods <span className="text-muted-foreground text-xs">(comma-separated)</span></FormLabel><FormControl><Input placeholder="e.g. card, wallet, bank_transfer" data-testid="input-gw-methods" {...field} value={field.value || ""} /></FormControl></FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Key className="h-3.5 w-3.5" />Section B — API Credentials</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={gatewayForm.control} name="merchantId" render={({ field }) => (
                      <FormItem><FormLabel>Merchant ID</FormLabel><FormControl><Input placeholder="Merchant ID" data-testid="input-gw-merchant" {...field} value={field.value || ""} /></FormControl></FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="apiKey" render={({ field }) => (
                      <FormItem><FormLabel>API Key</FormLabel><FormControl><Input type="password" placeholder="••••••••" data-testid="input-gw-api-key" {...field} value={field.value || ""} /></FormControl></FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="apiSecret" render={({ field }) => (
                      <FormItem><FormLabel>Secret Key</FormLabel><FormControl><Input type="password" placeholder="••••••••" data-testid="input-gw-api-secret" {...field} value={field.value || ""} /></FormControl></FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="publicKey" render={({ field }) => (
                      <FormItem><FormLabel>Public Key</FormLabel><FormControl><Input placeholder="Public key" data-testid="input-gw-public-key" {...field} value={field.value || ""} /></FormControl></FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="webhookUrl" render={({ field }) => (
                      <FormItem><FormLabel>Webhook URL</FormLabel><FormControl><Input placeholder="https://..." data-testid="input-gw-webhook" {...field} value={field.value || ""} /></FormControl></FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="callbackUrl" render={({ field }) => (
                      <FormItem><FormLabel>Callback URL</FormLabel><FormControl><Input placeholder="https://..." data-testid="input-gw-callback" {...field} value={field.value || ""} /></FormControl></FormItem>
                    )} />
                  </div>
                  <FormField control={gatewayForm.control} name="encryptCredentials" render={({ field }) => (
                    <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} data-testid="checkbox-gw-encrypt" /></FormControl><FormLabel className="!mt-0 text-sm">Encrypt stored credentials</FormLabel></FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" />Section C — Financial Mapping</h4>
                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={gatewayForm.control} name="debitAccountId" render={({ field }) => (
                      <FormItem><FormLabel>Debit Account <span className="text-muted-foreground text-xs">(Bank/Wallet)</span></FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === "__none__" ? undefined : parseInt(v))} value={field.value ? field.value.toString() : "__none__"}>
                          <FormControl><SelectTrigger data-testid="select-gw-debit"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="__none__">— Select —</SelectItem>{accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="creditAccountId" render={({ field }) => (
                      <FormItem><FormLabel>Credit Account <span className="text-muted-foreground text-xs">(A/R)</span></FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === "__none__" ? undefined : parseInt(v))} value={field.value ? field.value.toString() : "__none__"}>
                          <FormControl><SelectTrigger data-testid="select-gw-credit"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="__none__">— Select —</SelectItem>{accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="chargesAccountId" render={({ field }) => (
                      <FormItem><FormLabel>Gateway Charges Expense</FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === "__none__" ? undefined : parseInt(v))} value={field.value ? field.value.toString() : "__none__"}>
                          <FormControl><SelectTrigger data-testid="select-gw-charges"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="__none__">— Select —</SelectItem>{accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="taxChargesAccountId" render={({ field }) => (
                      <FormItem><FormLabel>Tax on Charges Account</FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === "__none__" ? undefined : parseInt(v))} value={field.value ? field.value.toString() : "__none__"}>
                          <FormControl><SelectTrigger data-testid="select-gw-tax-charges"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="__none__">— Select —</SelectItem>{accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                  <div className="mt-3">
                    <FormField control={gatewayForm.control} name="gatewayChargePercent" render={({ field }) => (
                      <FormItem><FormLabel>Gateway Charge %</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g. 2.5" data-testid="input-gw-charge-percent" className="max-w-[200px]" {...field} value={field.value || ""} /></FormControl></FormItem>
                    )} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" />Section D — Payment Behavior</h4>
                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <FormField control={gatewayForm.control} name="autoMarkPaid" render={({ field }) => (
                      <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} data-testid="checkbox-gw-auto-paid" /></FormControl><FormLabel className="!mt-0 text-sm">Auto mark invoice paid</FormLabel></FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="partialPayment" render={({ field }) => (
                      <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="checkbox-gw-partial" /></FormControl><FormLabel className="!mt-0 text-sm">Partial payment allowed</FormLabel></FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="autoSendReceipt" render={({ field }) => (
                      <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} data-testid="checkbox-gw-receipt" /></FormControl><FormLabel className="!mt-0 text-sm">Auto send receipt</FormLabel></FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="autoGenerateIncome" render={({ field }) => (
                      <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} data-testid="checkbox-gw-income" /></FormControl><FormLabel className="!mt-0 text-sm">Auto generate income entry</FormLabel></FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="autoApplyLateFee" render={({ field }) => (
                      <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="checkbox-gw-late-fee" /></FormControl><FormLabel className="!mt-0 text-sm">Apply late fee auto</FormLabel></FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="autoAdjustCredit" render={({ field }) => (
                      <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="checkbox-gw-credit" /></FormControl><FormLabel className="!mt-0 text-sm">Auto adjust credit balance</FormLabel></FormItem>
                    )} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />Section E — Security & Fraud Controls</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={gatewayForm.control} name="maxTransactionLimit" render={({ field }) => (
                      <FormItem><FormLabel>Max Transaction Limit</FormLabel><FormControl><Input type="number" step="0.01" placeholder="No limit" data-testid="input-gw-max-txn" {...field} value={field.value || ""} /></FormControl></FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="dailyTransactionCap" render={({ field }) => (
                      <FormItem><FormLabel>Daily Transaction Cap</FormLabel><FormControl><Input type="number" step="0.01" placeholder="No limit" data-testid="input-gw-daily-cap" {...field} value={field.value || ""} /></FormControl></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={gatewayForm.control} name="ipValidation" render={({ field }) => (
                      <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="checkbox-gw-ip" /></FormControl><FormLabel className="!mt-0 text-sm">IP Validation</FormLabel></FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="duplicatePrevention" render={({ field }) => (
                      <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} data-testid="checkbox-gw-dup" /></FormControl><FormLabel className="!mt-0 text-sm">Duplicate Prevention</FormLabel></FormItem>
                    )} />
                    <FormField control={gatewayForm.control} name="webhookVerification" render={({ field }) => (
                      <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} data-testid="checkbox-gw-webhook-verify" /></FormControl><FormLabel className="!mt-0 text-sm">Webhook Verification</FormLabel></FormItem>
                    )} />
                  </div>
                </div>
              </div>

              <FormField control={gatewayForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={2} placeholder="Internal notes..." data-testid="input-gw-notes" {...field} value={field.value || ""} /></FormControl></FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setGatewayDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createGatewayMutation.isPending || updateGatewayMutation.isPending} data-testid="button-save-gateway">
                  {createGatewayMutation.isPending || updateGatewayMutation.isPending ? "Saving..." : editingGateway ? "Update Gateway" : "Add Gateway"}
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
      <span className="font-medium">{value}</span>
    </div>
  );
}