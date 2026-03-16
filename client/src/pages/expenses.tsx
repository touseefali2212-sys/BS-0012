import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, DollarSign, Receipt,
  CheckCircle, Clock, XCircle, Download, Filter, X, TrendingUp,
  TrendingDown, Wallet, AlertTriangle, BarChart3, PieChart as PieChartIcon,
  ArrowUpRight, ArrowDownRight, Calendar, Building2, Users, CreditCard,
  Eye, Printer, BookOpen, Target, Activity, Percent, ChevronRight,
  RotateCcw, Layers, FileText, Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertExpenseSchema,
  type Expense, type InsertExpense,
  type Transaction, type Budget, type BudgetAllocation, type Vendor, type Account,
} from "@shared/schema";
import { z } from "zod";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LineChart, Line, ComposedChart, Area,
} from "recharts";

const expenseFormSchema = insertExpenseSchema.extend({
  expenseId: z.string().min(1, "Expense ID is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.string(),
  description: z.string().min(2, "Description is required"),
  date: z.string().min(1, "Date is required"),
});

const categoryLabels: Record<string, string> = {
  utilities: "Utility Bills", internet: "Bandwidth Expense", equipment: "Router & Equipment",
  salary: "Salary Expense", rent: "Office Rent", maintenance: "Fiber Maintenance",
  marketing: "Marketing Expense", other: "Other Expense", bandwidth: "Bandwidth Expense",
  commission: "Commission Expense", installation: "Installation Cost", operational: "Operational",
};

const categoryColors: Record<string, { badge: string; hex: string }> = {
  utilities: { badge: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800", hex: "#3B82F6" },
  internet: { badge: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800", hex: "#06B6D4" },
  bandwidth: { badge: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800", hex: "#06B6D4" },
  equipment: { badge: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800", hex: "#F59E0B" },
  salary: { badge: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800", hex: "#22C55E" },
  rent: { badge: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800", hex: "#A855F7" },
  maintenance: { badge: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800", hex: "#F97316" },
  marketing: { badge: "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300 border-pink-200 dark:border-pink-800", hex: "#EC4899" },
  commission: { badge: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800", hex: "#6366F1" },
  installation: { badge: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800", hex: "#14B8A6" },
  operational: { badge: "bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300 border-slate-200 dark:border-slate-800", hex: "#64748B" },
  other: { badge: "bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400 border-gray-200 dark:border-gray-800", hex: "#9CA3AF" },
};

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800", label: "Pending" },
  approved: { icon: CheckCircle, color: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800", label: "Approved" },
  rejected: { icon: XCircle, color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800", label: "Rejected" },
  paid: { icon: DollarSign, color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800", label: "Paid" },
};

const PIE_COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#A855F7", "#F97316", "#06B6D4", "#EC4899", "#6366F1", "#14B8A6", "#64748B"];

const formatCurrency = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function ExpensesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({ queryKey: ["/api/expenses"] });
  const { data: transactions = [] } = useQuery<(Transaction & { vendorName?: string; debitAccountName?: string; creditAccountName?: string })[]>({ queryKey: ["/api/transactions"] });
  const { data: budgets = [] } = useQuery<Budget[]>({ queryKey: ["/api/budgets"] });
  const { data: budgetAllocations = [] } = useQuery<(BudgetAllocation & { accountName?: string })[]>({ queryKey: ["/api/budget-allocations"] });
  const { data: vendors = [] } = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });
  const { data: accounts = [] } = useQuery<Account[]>({ queryKey: ["/api/accounts"] });
  const { data: areas = [] } = useQuery<{ id: number; name: string; branch: string | null }[]>({ queryKey: ["/api/areas"] });

  const form = useForm<InsertExpense>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: { expenseId: "", category: "utilities", amount: "", description: "", paymentMethod: "cash", reference: "", status: "pending", date: "", notes: "", area: "", branch: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertExpense) => { const res = await apiRequest("POST", "/api/expenses", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/expenses"] }); setDialogOpen(false); form.reset(); toast({ title: "Expense created successfully" }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertExpense> }) => { const res = await apiRequest("PATCH", `/api/expenses/${id}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/expenses"] }); setDialogOpen(false); setEditingExpense(null); form.reset(); toast({ title: "Expense updated successfully" }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/expenses/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/expenses"] }); setDeleteConfirmId(null); toast({ title: "Expense deleted" }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const currentMonth = now.toISOString().slice(0, 7);
  const currentYear = now.getFullYear().toString();
  const currentQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().slice(0, 10);

  const getDateFilter = (date: string | null) => {
    if (!date) return false;
    if (dateRange === "all") return true;
    if (dateRange === "today") return date === today;
    if (dateRange === "month") return date.startsWith(currentMonth);
    if (dateRange === "quarter") return date >= currentQuarterStart;
    if (dateRange === "year") return date.startsWith(currentYear);
    return true;
  };

  const hasFilters = search || statusFilter !== "all" || categoryFilter !== "all" || branchFilter !== "all" || dateRange !== "all" || paymentMethodFilter !== "all" || vendorFilter !== "all";
  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); setBranchFilter("all"); setDateRange("all"); setPaymentMethodFilter("all"); setVendorFilter("all"); setCurrentPage(1); };

  const expenseTransactions = useMemo(() =>
    transactions.filter(t => t.type === "expense" && t.status !== "voided"),
    [transactions]
  );

  const allBranches = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach(e => { if (e.branch) set.add(e.branch); });
    expenseTransactions.forEach(t => { if (t.branch) set.add(t.branch); });
    return Array.from(set).sort();
  }, [expenses, expenseTransactions]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach(e => { if (e.category) set.add(e.category); });
    return Array.from(set).sort();
  }, [expenses]);

  const filtered = useMemo(() => {
    let items = [...expenses];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(e => e.expenseId.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || (e.reference || "").toLowerCase().includes(q));
    }
    if (statusFilter !== "all") items = items.filter(e => e.status === statusFilter);
    if (categoryFilter !== "all") items = items.filter(e => e.category === categoryFilter);
    if (branchFilter !== "all") items = items.filter(e => e.branch === branchFilter);
    if (dateRange !== "all") items = items.filter(e => getDateFilter(e.date));
    if (paymentMethodFilter !== "all") items = items.filter(e => e.paymentMethod === paymentMethodFilter);
    if (vendorFilter !== "all") items = items.filter(e => e.vendorId === parseInt(vendorFilter));
    items.sort((a, b) => {
      let va: any, vb: any;
      if (sortField === "amount") { va = parseFloat(a.amount); vb = parseFloat(b.amount); }
      else if (sortField === "date") { va = a.date || ""; vb = b.date || ""; }
      else if (sortField === "category") { va = a.category; vb = b.category; }
      else { va = a.expenseId; vb = b.expenseId; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return items;
  }, [expenses, search, statusFilter, categoryFilter, branchFilter, dateRange, paymentMethodFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const kpis = useMemo(() => {
    const all = expenses;
    const todayTotal = all.filter(e => e.date === today).reduce((s, e) => s + parseFloat(e.amount), 0);
    const monthTotal = all.filter(e => e.date && e.date.startsWith(currentMonth)).reduce((s, e) => s + parseFloat(e.amount), 0);
    const yearTotal = all.filter(e => e.date && e.date.startsWith(currentYear)).reduce((s, e) => s + parseFloat(e.amount), 0);
    const activeBudgets = budgets.filter(b => b.status === "active");
    const budgetAllocated = activeBudgets.reduce((s, b) => s + parseFloat(b.totalAmount || "0"), 0);
    const budgetUsed = activeBudgets.reduce((s, b) => s + parseFloat(b.usedAmount || "0"), 0);
    const budgetUsedPct = budgetAllocated > 0 ? (budgetUsed / budgetAllocated) * 100 : 0;
    const remaining = budgetAllocated - budgetUsed;
    let budgetStatus: "under" | "near" | "over" = "under";
    if (budgetUsedPct >= 100) budgetStatus = "over";
    else if (budgetUsedPct >= 80) budgetStatus = "near";
    return { todayTotal, monthTotal, yearTotal, budgetAllocated, budgetUsed, budgetUsedPct, remaining, budgetStatus };
  }, [expenses, budgets, today, currentMonth, currentYear]);

  const chartData = useMemo(() => {
    const source = filtered;
    const byCat: Record<string, number> = {};
    source.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + parseFloat(e.amount); });
    const pieData = Object.entries(byCat).map(([name, value]) => ({ name: categoryLabels[name] || name, value, color: categoryColors[name]?.hex || "#9CA3AF" }));

    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      months[key] = 0;
    }
    source.forEach(e => { if (e.date) { const m = e.date.slice(0, 7); if (m in months) months[m] += parseFloat(e.amount); } });
    const barData = Object.entries(months).map(([month, amount]) => {
      const d = new Date(month + "-01");
      return { name: d.toLocaleDateString("en-US", { month: "short" }), amount };
    });

    const byBranch: Record<string, Record<string, number>> = {};
    source.forEach(e => {
      const br = e.branch || "Unassigned";
      if (!byBranch[br]) byBranch[br] = {};
      byBranch[br][e.category] = (byBranch[br][e.category] || 0) + parseFloat(e.amount);
    });
    const branchCats = new Set<string>();
    Object.values(byBranch).forEach(cats => Object.keys(cats).forEach(c => branchCats.add(c)));
    const stackedData = Object.entries(byBranch).map(([branch, cats]) => ({ name: branch, ...cats }));

    const budgetVsActual = Object.entries(months).map(([month, actual]) => {
      const d = new Date(month + "-01");
      const monthlyBudget = kpis.budgetAllocated > 0 ? kpis.budgetAllocated / 12 : 0;
      return { name: d.toLocaleDateString("en-US", { month: "short" }), actual, budget: Math.round(monthlyBudget) };
    });

    return { pieData, barData, stackedData, branchCats: Array.from(branchCats), budgetVsActual };
  }, [filtered, kpis]);

  const vendorMap = useMemo(() => new Map(vendors.map(v => [v.id, v])), [vendors]);

  const openCreate = () => {
    setEditingExpense(null);
    const nextId = `EXP-${String(expenses.length + 1).padStart(3, "0")}`;
    form.reset({ expenseId: nextId, category: "utilities", amount: "", description: "", paymentMethod: "cash", reference: "", status: "pending", date: today, notes: "", area: "", branch: "" });
    setDialogOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    form.reset({ expenseId: expense.expenseId, category: expense.category, amount: expense.amount, description: expense.description, paymentMethod: expense.paymentMethod || "cash", reference: expense.reference || "", status: expense.status, date: expense.date, notes: expense.notes || "", area: expense.area || "", branch: expense.branch || "" });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertExpense) => {
    if (editingExpense) updateMutation.mutate({ id: editingExpense.id, data });
    else createMutation.mutate(data);
  };

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const budgetStatusBadge = kpis.budgetStatus === "over"
    ? { text: "Over Budget", cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800" }
    : kpis.budgetStatus === "near"
    ? { text: "Near Limit", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800" }
    : { text: "Under Budget", cls: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-300 dark:border-green-800" };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-expenses-title">Expense Tracking</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor, analyze, and control all business expenditures</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => window.open("/api/export/expenses", "_blank")} data-testid="button-export-expenses">
            <Download className="h-4 w-4 mr-1" />Export
          </Button>
          <Button onClick={openCreate} data-testid="button-add-expense">
            <Plus className="h-4 w-4 mr-1" />Add Expense
          </Button>
        </div>
      </div>

      {/* ===== SECTION 1: Expense Summary Dashboard ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Today's Expense", value: formatCurrency(kpis.todayTotal), icon: Calendar, gradient: "from-[#002B5B] to-[#007BFF]" },
          { label: "This Month", value: formatCurrency(kpis.monthTotal), icon: TrendingUp, gradient: "from-blue-600 to-blue-500" },
          { label: "Year-to-Date", value: formatCurrency(kpis.yearTotal), icon: BarChart3, gradient: "from-indigo-600 to-indigo-500" },
          { label: "Budget Allocated", value: formatCurrency(kpis.budgetAllocated), icon: Target, gradient: "from-emerald-600 to-emerald-500" },
          { label: "Budget Used %", value: `${kpis.budgetUsedPct.toFixed(1)}%`, icon: Percent, gradient: kpis.budgetStatus === "over" ? "from-red-600 to-red-500" : kpis.budgetStatus === "near" ? "from-amber-600 to-amber-500" : "from-teal-600 to-teal-500" },
          { label: "Remaining Budget", value: formatCurrency(kpis.remaining), icon: Wallet, gradient: kpis.remaining < 0 ? "from-red-600 to-red-500" : "from-slate-700 to-slate-600" },
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

      {kpis.budgetAllocated > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-3 px-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Budget Utilization</span>
                <Badge variant="outline" className={`no-default-active-elevate text-[10px] ${budgetStatusBadge.cls}`} data-testid="badge-budget-status">{budgetStatusBadge.text}</Badge>
              </div>
              <span className="text-sm font-semibold">{kpis.budgetUsedPct.toFixed(1)}% used</span>
            </div>
            <Progress value={Math.min(kpis.budgetUsedPct, 100)} className="h-2.5" />
            <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground">
              <span>Used: {formatCurrency(kpis.budgetUsed)}</span>
              <span>Allocated: {formatCurrency(kpis.budgetAllocated)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== SECTION 2: Advanced Filters ===== */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4 pb-3 px-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 mr-1">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick</span>
              </div>
              {[
                { label: "Today", value: "today" },
                { label: "This Month", value: "month" },
                { label: "This Quarter", value: "quarter" },
                { label: "This Year", value: "year" },
              ].map((qf) => (
                <Button key={qf.value} variant={dateRange === qf.value ? "default" : "outline"} size="sm" className="text-xs" onClick={() => { setDateRange(dateRange === qf.value ? "all" : qf.value); setCurrentPage(1); }} data-testid={`button-quick-filter-${qf.value}`}>
                  {qf.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by ID, description, reference..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9 h-9" data-testid="input-search-expenses" />
              </div>
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[150px] h-9" data-testid="select-expense-category-filter"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map(c => <SelectItem key={c} value={c}>{categoryLabels[c] || c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[130px] h-9" data-testid="select-expense-status-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              {allBranches.length > 0 && (
                <Select value={branchFilter} onValueChange={(v) => { setBranchFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px] h-9" data-testid="select-expense-branch-filter"><Building2 className="h-3.5 w-3.5 mr-1 text-muted-foreground" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {allBranches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Select value={paymentMethodFilter} onValueChange={(v) => { setPaymentMethodFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[150px] h-9" data-testid="select-expense-payment-filter"><CreditCard className="h-3.5 w-3.5 mr-1 text-muted-foreground" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
              {vendors.length > 0 && (
                <Select value={vendorFilter} onValueChange={(v) => { setVendorFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[150px] h-9" data-testid="select-expense-vendor-filter"><Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    {vendors.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {hasFilters && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={clearFilters} data-testid="button-clear-expense-filters">
                  <X className="h-3.5 w-3.5 mr-1" />Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== SECTION 3: Expense Analytics Charts ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><PieChartIcon className="h-4 w-4 text-muted-foreground" />Expense by Category</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {chartData.pieData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data available</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={chartData.pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                      {chartData.pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {chartData.pieData.slice(0, 6).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
                        <span className="text-muted-foreground truncate max-w-[100px]">{item.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-muted-foreground" />Monthly Expense Trend</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {chartData.barData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData.barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Layers className="h-4 w-4 text-muted-foreground" />Branch-wise Expense</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {chartData.stackedData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData.stackedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  {chartData.branchCats.slice(0, 6).map((cat, idx) => (
                    <Bar key={cat} dataKey={cat} stackId="a" fill={PIE_COLORS[idx % PIE_COLORS.length]} name={categoryLabels[cat] || cat} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-muted-foreground" />Budget vs Actual</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {chartData.budgetVsActual.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chartData.budgetVsActual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Area type="monotone" dataKey="budget" fill="#e0f2fe" stroke="#0ea5e9" strokeDasharray="5 5" name="Budget" />
                  <Bar dataKey="actual" fill="#f97316" radius={[3, 3, 0, 0]} name="Actual" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== SECTION 4: Expense Tracking Table ===== */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Receipt className="h-14 w-14 mb-3 opacity-20" />
              <p className="font-medium text-lg">No expenses found</p>
              <p className="text-sm mt-1">{hasFilters ? "Try adjusting your filters" : "Create your first expense to get started"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 border-0">
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 cursor-pointer" onClick={() => toggleSort("date")} data-testid="th-sort-date">
                      Date {sortField === "date" && (sortDir === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Voucher No</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 cursor-pointer" onClick={() => toggleSort("category")} data-testid="th-sort-category">
                      Category {sortField === "category" && (sortDir === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden lg:table-cell">Vendor / Employee</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden xl:table-cell">Branch</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden xl:table-cell">Payment</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 cursor-pointer text-right" onClick={() => toggleSort("amount")} data-testid="th-sort-amount">
                      Amount {sortField === "amount" && (sortDir === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Status</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((expense, idx) => {
                    const sc = statusConfig[expense.status] || statusConfig.pending;
                    const StatusIcon = sc.icon;
                    const catColor = categoryColors[expense.category] || categoryColors.other;
                    return (
                      <TableRow key={expense.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/40"} data-testid={`row-expense-${expense.id}`}>
                        <TableCell className="text-xs text-muted-foreground" data-testid={`text-expense-date-${expense.id}`}>
                          {expense.date ? new Date(expense.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs font-medium" data-testid={`text-expense-id-${expense.id}`}>{expense.expenseId}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`no-default-active-elevate text-[10px] capitalize font-medium ${catColor.badge}`} data-testid={`badge-expense-category-${expense.id}`}>
                            {categoryLabels[expense.category] || expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden lg:table-cell" data-testid={`text-expense-vendor-${expense.id}`}>
                          {expense.vendorId ? (vendorMap.get(expense.vendorId)?.name || `Vendor #${expense.vendorId}`) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden xl:table-cell">{expense.branch || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground capitalize hidden xl:table-cell">{(expense.paymentMethod || "cash").replace("_", " ")}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-sm" data-testid={`text-expense-amount-${expense.id}`}>
                            {parseFloat(expense.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`no-default-active-elevate text-[10px] capitalize font-medium ${sc.color}`} data-testid={`badge-expense-status-${expense.id}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />{sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-expense-actions-${expense.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailExpense(expense)} data-testid={`button-view-expense-${expense.id}`}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(expense)} data-testid={`button-edit-expense-${expense.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirmId(expense.id)} data-testid={`button-delete-expense-${expense.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
          <span>Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} expenses</span>
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
        <div className="text-xs text-muted-foreground text-right">Showing {filtered.length} of {expenses.length} expenses</div>
      )}

      {/* ===== SECTION 5: Expense Detail Drill-Down ===== */}
      <Dialog open={!!detailExpense} onOpenChange={(open) => { if (!open) setDetailExpense(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Expense Detail — {detailExpense?.expenseId}
            </DialogTitle>
          </DialogHeader>
          {detailExpense && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-md p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wider">Voucher Amount</p>
                    <p className="text-2xl font-bold mt-0.5">{parseFloat(detailExpense.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${statusConfig[detailExpense.status]?.color || ""}`}>
                    {detailExpense.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Voucher Details</h4>
                  <div className="space-y-2">
                    <DetailRow label="Voucher No" value={detailExpense.expenseId} />
                    <DetailRow label="Category" value={categoryLabels[detailExpense.category] || detailExpense.category} />
                    <DetailRow label="Date" value={detailExpense.date ? new Date(detailExpense.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—"} />
                    <DetailRow label="Payment Method" value={(detailExpense.paymentMethod || "cash").replace("_", " ")} />
                    <DetailRow label="Reference" value={detailExpense.reference || "—"} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Organization</h4>
                  <div className="space-y-2">
                    <DetailRow label="Branch" value={detailExpense.branch || "—"} />
                    <DetailRow label="Area" value={detailExpense.area || "—"} />
                    <DetailRow label="Vendor" value={detailExpense.vendorId ? (vendorMap.get(detailExpense.vendorId)?.name || `#${detailExpense.vendorId}`) : "—"} />
                    <DetailRow label="Created By" value={detailExpense.createdBy || "System"} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Description</h4>
                <p className="text-sm text-muted-foreground">{detailExpense.description}</p>
              </div>

              {detailExpense.notes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Notes</h4>
                  <p className="text-sm text-muted-foreground">{detailExpense.notes}</p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Audit Trail</h4>
                <div className="text-xs space-y-1.5 text-muted-foreground">
                  <div className="flex items-center gap-2"><Clock className="h-3 w-3" /><span>Created on {detailExpense.date || "—"} by {detailExpense.createdBy || "System"}</span></div>
                  <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3" /><span>Status: {detailExpense.status}</span></div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => { setDetailExpense(null); openEdit(detailExpense); }} data-testid="button-detail-edit"><Edit className="h-3.5 w-3.5 mr-1" />Edit</Button>
                <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-detail-print"><Printer className="h-3.5 w-3.5 mr-1" />Print</Button>
                <div className="flex-1" />
                <Button variant="ghost" size="sm" onClick={() => setDetailExpense(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation ===== */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />Delete Expense</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to permanently delete this expense? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (deleteConfirmId) deleteMutation.mutate(deleteConfirmId); }} disabled={deleteMutation.isPending} data-testid="button-confirm-delete">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Add/Edit Expense Dialog ===== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="expenseId" render={({ field }) => (
                  <FormItem><FormLabel>Expense ID</FormLabel><FormControl><Input placeholder="EXP-001" data-testid="input-expense-id" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "utilities"}>
                      <FormControl><SelectTrigger data-testid="select-expense-category"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="utilities">Utility Bills</SelectItem>
                        <SelectItem value="internet">Bandwidth Expense</SelectItem>
                        <SelectItem value="equipment">Router & Equipment</SelectItem>
                        <SelectItem value="salary">Salary Expense</SelectItem>
                        <SelectItem value="rent">Office Rent</SelectItem>
                        <SelectItem value="maintenance">Fiber Maintenance</SelectItem>
                        <SelectItem value="marketing">Marketing Expense</SelectItem>
                        <SelectItem value="commission">Commission Expense</SelectItem>
                        <SelectItem value="installation">Installation Cost</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-expense-amount" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" data-testid="input-expense-date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="Expense description" data-testid="input-expense-description" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                  <FormItem><FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "cash"}>
                      <FormControl><SelectTrigger data-testid="select-expense-payment-method"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "pending"}>
                      <FormControl><SelectTrigger data-testid="select-expense-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="reference" render={({ field }) => (
                <FormItem><FormLabel>Reference</FormLabel><FormControl><Input placeholder="Reference number" data-testid="input-expense-reference" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="area" render={({ field }) => (
                  <FormItem><FormLabel>Area <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                    <Select onValueChange={(v) => { field.onChange(v === "__none__" ? "" : v); const selected = areas.find(a => a.name === v); if (selected?.branch) form.setValue("branch", selected.branch); }} value={field.value || "__none__"}>
                      <FormControl><SelectTrigger data-testid="select-expense-area"><SelectValue placeholder="Select area" /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="__none__">— No Area —</SelectItem>{areas.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="branch" render={({ field }) => (
                  <FormItem><FormLabel>Branch <span className="text-muted-foreground text-xs">(optional)</span></FormLabel><FormControl><Input placeholder="Branch name" data-testid="input-expense-branch" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Additional notes..." data-testid="input-expense-notes" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-expense">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingExpense ? "Update" : "Create"}
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