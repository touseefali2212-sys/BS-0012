import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, CreditCard, FileText,
  DollarSign, CheckCircle, Clock, XCircle, Download, Filter, X,
  TrendingUp, TrendingDown, Wallet, AlertTriangle, BarChart3,
  Eye, Printer, BookOpen, ArrowUpRight, ArrowDownRight, Calendar,
  Building2, Users, Shield, Ban, ChevronRight, Layers, Receipt,
  RotateCcw, Activity, Target, Percent,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertCreditNoteSchema,
  type CreditNote, type InsertCreditNote,
  type Customer, type Invoice, type Account,
} from "@shared/schema";
import { z } from "zod";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

const creditNoteFormSchema = insertCreditNoteSchema.extend({
  creditNoteNumber: z.string().min(1, "Credit note number is required"),
  customerId: z.coerce.number().min(1, "Customer is required"),
  amount: z.coerce.string().min(1, "Amount is required"),
  reason: z.string().min(2, "Reason is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  reasonCategory: z.string().min(1, "Reason category is required"),
});

const reasonCategoryLabels: Record<string, string> = {
  overbilling: "Overbilling",
  service_cancellation: "Service Cancellation",
  refund: "Refund",
  discount_adjustment: "Discount Adjustment",
  billing_error: "Billing Error",
  goodwill: "Goodwill Adjustment",
  other: "Other",
};

const reasonCategoryColors: Record<string, string> = {
  overbilling: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800",
  service_cancellation: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  refund: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  discount_adjustment: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  billing_error: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  goodwill: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800",
  other: "bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400 border-gray-200 dark:border-gray-800",
};

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  draft: { icon: FileText, color: "bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300 border-slate-200 dark:border-slate-800", label: "Draft" },
  pending: { icon: Clock, color: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800", label: "Pending" },
  approved: { icon: CheckCircle, color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800", label: "Approved" },
  rejected: { icon: XCircle, color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800", label: "Rejected" },
  applied: { icon: CheckCircle, color: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800", label: "Applied" },
  cancelled: { icon: Ban, color: "bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400 border-gray-200 dark:border-gray-800", label: "Cancelled" },
};

const applicationModeLabels: Record<string, string> = {
  apply_invoice: "Apply to Invoice",
  credit_balance: "Keep as Credit Balance",
  refund: "Refund Immediately",
};

const formatCurrency = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CreditNotesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CreditNote | null>(null);
  const [detailNote, setDetailNote] = useState<CreditNote | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<string>("issueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const { data: creditNotes = [], isLoading } = useQuery<(CreditNote & { customerName?: string })[]>({ queryKey: ["/api/credit-notes"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: accounts = [] } = useQuery<Account[]>({ queryKey: ["/api/accounts"] });

  const form = useForm<InsertCreditNote>({
    resolver: zodResolver(creditNoteFormSchema),
    defaultValues: {
      creditNoteNumber: "", customerId: 0, invoiceId: undefined, amount: "", appliedAmount: "0", remainingBalance: "0",
      reason: "", reasonCategory: "other", status: "draft", issueDate: "", appliedDate: "", notes: "",
      createdBy: "", branch: "", debitAccountId: undefined, creditAccountId: undefined,
      applicationMode: "credit_balance", allowPartialApplication: true, approvalNotes: "", approvedBy: "", approvalDate: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCreditNote) => {
      const payload = { ...data, remainingBalance: data.amount, createdAt: new Date().toISOString() };
      const res = await apiRequest("POST", "/api/credit-notes", payload);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/credit-notes"] }); setDialogOpen(false); form.reset(); toast({ title: "Credit note created successfully" }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCreditNote> }) => {
      const res = await apiRequest("PATCH", `/api/credit-notes/${id}`, data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/credit-notes"] }); setDialogOpen(false); setEditingNote(null); form.reset(); toast({ title: "Credit note updated successfully" }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/credit-notes/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/credit-notes"] }); setDeleteConfirmId(null); toast({ title: "Credit note deleted" }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/credit-notes/${id}`, { status: "approved", approvedBy: "admin", approvalDate: new Date().toISOString() });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/credit-notes"] }); setDetailNote(null); toast({ title: "Credit note approved" }); },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/credit-notes/${id}`, { status: "rejected" });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/credit-notes"] }); setDetailNote(null); toast({ title: "Credit note rejected" }); },
  });

  const applyMutation = useMutation({
    mutationFn: async (id: number) => {
      const note = creditNotes.find(cn => cn.id === id);
      const res = await apiRequest("PATCH", `/api/credit-notes/${id}`, {
        status: "applied", appliedDate: new Date().toISOString().slice(0, 10),
        appliedAmount: note?.amount || "0", remainingBalance: "0",
      });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/credit-notes"] }); setDetailNote(null); toast({ title: "Credit note applied successfully" }); },
  });

  const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
  const invoiceMap = useMemo(() => new Map(invoices.map(i => [i.id, i])), [invoices]);

  const today = new Date().toISOString().slice(0, 10);
  const hasFilters = search || statusFilter !== "all" || reasonFilter !== "all" || customerFilter !== "all";
  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setReasonFilter("all"); setCustomerFilter("all"); setCurrentPage(1); };

  const filtered = useMemo(() => {
    let items = [...creditNotes];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(cn =>
        cn.creditNoteNumber.toLowerCase().includes(q) ||
        cn.reason.toLowerCase().includes(q) ||
        (cn.customerName || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") items = items.filter(cn => cn.status === statusFilter);
    if (reasonFilter !== "all") items = items.filter(cn => cn.reasonCategory === reasonFilter);
    if (customerFilter !== "all") items = items.filter(cn => cn.customerId === parseInt(customerFilter));
    items.sort((a, b) => {
      let va: any, vb: any;
      if (sortField === "amount") { va = parseFloat(a.amount); vb = parseFloat(b.amount); }
      else if (sortField === "issueDate") { va = a.issueDate || ""; vb = b.issueDate || ""; }
      else { va = a.creditNoteNumber; vb = b.creditNoteNumber; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return items;
  }, [creditNotes, search, statusFilter, reasonFilter, customerFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const kpis = useMemo(() => {
    const all = creditNotes;
    const total = all.length;
    const pending = all.filter(cn => cn.status === "pending" || cn.status === "draft").length;
    const approved = all.filter(cn => cn.status === "approved").length;
    const totalAmount = all.reduce((s, cn) => s + parseFloat(cn.amount), 0);
    const appliedAmount = all.reduce((s, cn) => s + parseFloat(cn.appliedAmount || "0"), 0);
    const unapplied = totalAmount - appliedAmount;
    return { total, pending, approved, totalAmount, appliedAmount, unapplied };
  }, [creditNotes]);

  const chartData = useMemo(() => {
    const now = new Date();
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months[d.toISOString().slice(0, 7)] = 0;
    }
    filtered.forEach(cn => {
      if (cn.issueDate) {
        const m = cn.issueDate.slice(0, 7);
        if (m in months) months[m] += parseFloat(cn.amount);
      }
    });
    return Object.entries(months).map(([month, amount]) => {
      const d = new Date(month + "-01");
      return { name: d.toLocaleDateString("en-US", { month: "short" }), amount };
    });
  }, [filtered]);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const openCreate = () => {
    setEditingNote(null);
    const nextNum = `CN-${String(creditNotes.length + 1).padStart(3, "0")}`;
    form.reset({
      creditNoteNumber: nextNum, customerId: 0, invoiceId: undefined, amount: "", appliedAmount: "0", remainingBalance: "0",
      reason: "", reasonCategory: "other", status: "draft", issueDate: today, appliedDate: "", notes: "",
      createdBy: "", branch: "", debitAccountId: undefined, creditAccountId: undefined,
      applicationMode: "credit_balance", allowPartialApplication: true, approvalNotes: "", approvedBy: "", approvalDate: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (cn: CreditNote) => {
    setEditingNote(cn);
    form.reset({
      creditNoteNumber: cn.creditNoteNumber, customerId: cn.customerId, invoiceId: cn.invoiceId || undefined,
      amount: cn.amount, appliedAmount: cn.appliedAmount || "0", remainingBalance: cn.remainingBalance || "0",
      reason: cn.reason, reasonCategory: cn.reasonCategory || "other", status: cn.status,
      issueDate: cn.issueDate, appliedDate: cn.appliedDate || "", notes: cn.notes || "",
      createdBy: cn.createdBy || "", branch: cn.branch || "",
      debitAccountId: cn.debitAccountId || undefined, creditAccountId: cn.creditAccountId || undefined,
      applicationMode: cn.applicationMode || "credit_balance", allowPartialApplication: cn.allowPartialApplication ?? true,
      approvalNotes: cn.approvalNotes || "", approvedBy: cn.approvedBy || "", approvalDate: cn.approvalDate || "",
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertCreditNote) => {
    if (editingNote) updateMutation.mutate({ id: editingNote.id, data });
    else createMutation.mutate(data);
  };

  const getCustomerName = (id: number) => customerMap.get(id)?.fullName || `Customer #${id}`;
  const getInvoiceNumber = (id: number | null | undefined) => {
    if (!id) return "—";
    return invoiceMap.get(id)?.invoiceNumber || `INV-${id}`;
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-credit-notes-title">Credit Notes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage customer credit notes, adjustments, and refunds</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => window.open("/api/export/credit-notes", "_blank")} data-testid="button-export-credit-notes">
            <Download className="h-4 w-4 mr-1" />Export
          </Button>
          <Button onClick={openCreate} data-testid="button-add-credit-note">
            <Plus className="h-4 w-4 mr-1" />Create Credit Note
          </Button>
        </div>
      </div>

      {/* ===== SECTION 1: Overview Dashboard ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Total Credit Notes", value: kpis.total, icon: FileText, gradient: "from-[#002B5B] to-[#007BFF]" },
          { label: "Pending", value: kpis.pending, icon: Clock, gradient: "from-amber-600 to-amber-500" },
          { label: "Approved", value: kpis.approved, icon: CheckCircle, gradient: "from-emerald-600 to-emerald-500" },
          { label: "Total Credit Amount", value: formatCurrency(kpis.totalAmount), icon: DollarSign, gradient: "from-blue-600 to-blue-500" },
          { label: "Applied Amount", value: formatCurrency(kpis.appliedAmount), icon: Target, gradient: "from-teal-600 to-teal-500" },
          { label: "Unapplied Balance", value: formatCurrency(kpis.unapplied), icon: Wallet, gradient: kpis.unapplied > 0 ? "from-red-600 to-red-500" : "from-slate-700 to-slate-600" },
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

      {/* Monthly Trend Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-muted-foreground" />Monthly Credit Notes Issued</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ===== SECTION 2: Filters ===== */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4 pb-3 px-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by CN#, reason, customer..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9" data-testid="input-search-credit-notes" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px]" data-testid="select-cn-status-filter"><Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reasonFilter} onValueChange={(v) => { setReasonFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px]" data-testid="select-cn-reason-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                {Object.entries(reasonCategoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            {customers.length > 0 && (
              <Select value={customerFilter} onValueChange={(v) => { setCustomerFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[160px]" data-testid="select-cn-customer-filter"><Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {hasFilters && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={clearFilters} data-testid="button-clear-cn-filters">
                <X className="h-3.5 w-3.5 mr-1" />Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===== SECTION 3: Credit Notes List Table ===== */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CreditCard className="h-14 w-14 mb-3 opacity-20" />
              <p className="font-medium text-lg">No credit notes found</p>
              <p className="text-sm mt-1">{hasFilters ? "Try adjusting your filters" : "Create your first credit note to get started"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 border-0">
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Credit Note #</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 cursor-pointer" onClick={() => toggleSort("issueDate")} data-testid="th-sort-date">
                      Date {sortField === "issueDate" && (sortDir === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Customer</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden lg:table-cell">Invoice</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden xl:table-cell">Reason</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 cursor-pointer text-right" onClick={() => toggleSort("amount")} data-testid="th-sort-amount">
                      Total {sortField === "amount" && (sortDir === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden lg:table-cell text-right">Applied</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden xl:table-cell text-right">Balance</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Status</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden md:table-cell">Created By</TableHead>
                    <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((cn, idx) => {
                    const sc = statusConfig[cn.status] || statusConfig.draft;
                    const StatusIcon = sc.icon;
                    const rcColor = reasonCategoryColors[cn.reasonCategory || "other"] || reasonCategoryColors.other;
                    return (
                      <TableRow key={cn.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/40"} data-testid={`row-credit-note-${cn.id}`}>
                        <TableCell>
                          <span className="font-mono text-xs font-medium" data-testid={`text-cn-number-${cn.id}`}>{cn.creditNoteNumber}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground" data-testid={`text-cn-date-${cn.id}`}>
                          {cn.issueDate ? new Date(cn.issueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </TableCell>
                        <TableCell className="text-sm" data-testid={`text-cn-customer-${cn.id}`}>
                          {cn.customerName || getCustomerName(cn.customerId)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden lg:table-cell" data-testid={`text-cn-invoice-${cn.id}`}>
                          {getInvoiceNumber(cn.invoiceId)}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${rcColor}`} data-testid={`badge-cn-reason-${cn.id}`}>
                            {reasonCategoryLabels[cn.reasonCategory || "other"] || cn.reasonCategory}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-sm" data-testid={`text-cn-amount-${cn.id}`}>{formatCurrency(parseFloat(cn.amount))}</span>
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">{formatCurrency(parseFloat(cn.appliedAmount || "0"))}</span>
                        </TableCell>
                        <TableCell className="text-right hidden xl:table-cell">
                          <span className={`text-xs font-medium ${parseFloat(cn.remainingBalance || "0") > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                            {formatCurrency(parseFloat(cn.remainingBalance || "0"))}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`no-default-active-elevate text-[10px] capitalize font-medium ${sc.color}`} data-testid={`badge-cn-status-${cn.id}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />{sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{cn.createdBy || "—"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-cn-actions-${cn.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailNote(cn)} data-testid={`button-view-cn-${cn.id}`}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                              {(cn.status === "draft" || cn.status === "pending") && (
                                <DropdownMenuItem onClick={() => openEdit(cn)} data-testid={`button-edit-cn-${cn.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                              )}
                              {cn.status === "draft" && (
                                <DropdownMenuItem onClick={() => updateMutation.mutate({ id: cn.id, data: { status: "pending" } })} data-testid={`button-submit-cn-${cn.id}`}>
                                  <ArrowUpRight className="h-4 w-4 mr-2" />Submit for Approval
                                </DropdownMenuItem>
                              )}
                              {cn.status === "pending" && (
                                <>
                                  <DropdownMenuItem onClick={() => approveMutation.mutate(cn.id)} data-testid={`button-approve-cn-${cn.id}`}><CheckCircle className="h-4 w-4 mr-2" />Approve</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => rejectMutation.mutate(cn.id)} data-testid={`button-reject-cn-${cn.id}`}><XCircle className="h-4 w-4 mr-2" />Reject</DropdownMenuItem>
                                </>
                              )}
                              {cn.status === "approved" && (
                                <DropdownMenuItem onClick={() => applyMutation.mutate(cn.id)} data-testid={`button-apply-cn-${cn.id}`}><Target className="h-4 w-4 mr-2" />Apply to Invoice</DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirmId(cn.id)} data-testid={`button-delete-cn-${cn.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
          <span>Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} credit notes</span>
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
        <div className="text-xs text-muted-foreground text-right">Showing {filtered.length} of {creditNotes.length} credit notes</div>
      )}

      {/* ===== SECTION 4: Credit Note Detail View ===== */}
      <Dialog open={!!detailNote} onOpenChange={(open) => { if (!open) setDetailNote(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              Credit Note — {detailNote?.creditNoteNumber}
            </DialogTitle>
          </DialogHeader>
          {detailNote && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-md p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wider">Credit Amount</p>
                    <p className="text-2xl font-bold mt-0.5">{formatCurrency(parseFloat(detailNote.amount))}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${statusConfig[detailNote.status]?.color || ""}`}>
                    {statusConfig[detailNote.status]?.label || detailNote.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-white/20">
                  <div><p className="text-[10px] text-white/50 uppercase">Applied</p><p className="text-sm font-semibold">{formatCurrency(parseFloat(detailNote.appliedAmount || "0"))}</p></div>
                  <div><p className="text-[10px] text-white/50 uppercase">Remaining</p><p className="text-sm font-semibold">{formatCurrency(parseFloat(detailNote.remainingBalance || "0"))}</p></div>
                  <div><p className="text-[10px] text-white/50 uppercase">Mode</p><p className="text-sm font-semibold capitalize">{applicationModeLabels[detailNote.applicationMode || "credit_balance"] || detailNote.applicationMode}</p></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Credit Note Details</h4>
                  <div className="space-y-2">
                    <DetailRow label="CN Number" value={detailNote.creditNoteNumber} />
                    <DetailRow label="Issue Date" value={detailNote.issueDate ? new Date(detailNote.issueDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—"} />
                    <DetailRow label="Reason Category" value={reasonCategoryLabels[detailNote.reasonCategory || "other"] || detailNote.reasonCategory || "—"} />
                    <DetailRow label="Related Invoice" value={getInvoiceNumber(detailNote.invoiceId)} />
                    <DetailRow label="Branch" value={detailNote.branch || "—"} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Customer & Approval</h4>
                  <div className="space-y-2">
                    <DetailRow label="Customer" value={detailNote.customerName || getCustomerName(detailNote.customerId)} />
                    <DetailRow label="Created By" value={detailNote.createdBy || "System"} />
                    <DetailRow label="Approved By" value={detailNote.approvedBy || "—"} />
                    <DetailRow label="Approval Date" value={detailNote.approvalDate ? new Date(detailNote.approvalDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"} />
                    <DetailRow label="Applied Date" value={detailNote.appliedDate ? new Date(detailNote.appliedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Reason</h4>
                <p className="text-sm text-muted-foreground">{detailNote.reason}</p>
              </div>

              {detailNote.notes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Notes</h4>
                  <p className="text-sm text-muted-foreground">{detailNote.notes}</p>
                </div>
              )}

              {detailNote.approvalNotes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Approval Notes</h4>
                  <p className="text-sm text-muted-foreground">{detailNote.approvalNotes}</p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Audit Trail</h4>
                <div className="text-xs space-y-1.5 text-muted-foreground">
                  <div className="flex items-center gap-2"><Clock className="h-3 w-3" /><span>Created on {detailNote.issueDate || "—"} by {detailNote.createdBy || "System"}</span></div>
                  {detailNote.approvedBy && <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3" /><span>Approved by {detailNote.approvedBy} on {detailNote.approvalDate ? new Date(detailNote.approvalDate).toLocaleDateString() : "—"}</span></div>}
                  {detailNote.appliedDate && <div className="flex items-center gap-2"><Target className="h-3 w-3" /><span>Applied on {new Date(detailNote.appliedDate).toLocaleDateString()}</span></div>}
                  <div className="flex items-center gap-2"><FileText className="h-3 w-3" /><span>Status: {statusConfig[detailNote.status]?.label || detailNote.status}</span></div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                {(detailNote.status === "draft" || detailNote.status === "pending") && (
                  <Button variant="outline" size="sm" onClick={() => { setDetailNote(null); openEdit(detailNote); }} data-testid="button-detail-edit"><Edit className="h-3.5 w-3.5 mr-1" />Edit</Button>
                )}
                {detailNote.status === "pending" && (
                  <>
                    <Button variant="default" size="sm" onClick={() => approveMutation.mutate(detailNote.id)} data-testid="button-detail-approve"><CheckCircle className="h-3.5 w-3.5 mr-1" />Approve</Button>
                    <Button variant="destructive" size="sm" onClick={() => rejectMutation.mutate(detailNote.id)} data-testid="button-detail-reject"><XCircle className="h-3.5 w-3.5 mr-1" />Reject</Button>
                  </>
                )}
                {detailNote.status === "approved" && (
                  <Button variant="default" size="sm" onClick={() => applyMutation.mutate(detailNote.id)} data-testid="button-detail-apply"><Target className="h-3.5 w-3.5 mr-1" />Apply to Invoice</Button>
                )}
                <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-detail-print"><Printer className="h-3.5 w-3.5 mr-1" />Print</Button>
                <div className="flex-1" />
                <Button variant="ghost" size="sm" onClick={() => setDetailNote(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation ===== */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />Delete Credit Note</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to permanently delete this credit note? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (deleteConfirmId) deleteMutation.mutate(deleteConfirmId); }} disabled={deleteMutation.isPending} data-testid="button-confirm-delete">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Create/Edit Credit Note Dialog ===== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNote ? "Edit Credit Note" : "Create Credit Note"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Section A — Basic Information</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="creditNoteNumber" render={({ field }) => (
                      <FormItem><FormLabel>Credit Note #</FormLabel><FormControl><Input placeholder="CN-001" data-testid="input-cn-number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="issueDate" render={({ field }) => (
                      <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" data-testid="input-cn-date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="branch" render={({ field }) => (
                      <FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="Branch" data-testid="input-cn-branch" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="customerId" render={({ field }) => (
                      <FormItem><FormLabel>Customer</FormLabel>
                        <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value ? field.value.toString() : ""}>
                          <FormControl><SelectTrigger data-testid="select-cn-customer"><SelectValue placeholder="Select customer" /></SelectTrigger></FormControl>
                          <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.fullName} ({c.customerId})</SelectItem>)}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="invoiceId" render={({ field }) => (
                      <FormItem><FormLabel>Related Invoice <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === "__none__" ? undefined : parseInt(v))} value={field.value ? field.value.toString() : "__none__"}>
                          <FormControl><SelectTrigger data-testid="select-cn-invoice"><SelectValue placeholder="Select invoice" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">— No Invoice —</SelectItem>
                            {invoices.filter(i => !form.getValues("customerId") || i.customerId === form.getValues("customerId")).map(i => (
                              <SelectItem key={i.id} value={i.id.toString()}>{i.invoiceNumber} — {formatCurrency(parseFloat(i.totalAmount || i.amount))}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="reasonCategory" render={({ field }) => (
                      <FormItem><FormLabel>Reason Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "other"}>
                          <FormControl><SelectTrigger data-testid="select-cn-reason-category"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.entries(reasonCategoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="amount" render={({ field }) => (
                      <FormItem><FormLabel>Credit Amount</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-cn-amount" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="reason" render={({ field }) => (
                    <FormItem><FormLabel>Detailed Reason</FormLabel><FormControl><Textarea placeholder="Explain the reason for this credit note..." rows={2} data-testid="input-cn-reason" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Section B — Financial Posting</h4>
                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="debitAccountId" render={({ field }) => (
                      <FormItem><FormLabel>Debit Account <span className="text-muted-foreground text-xs">(Revenue Reversal)</span></FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === "__none__" ? undefined : parseInt(v))} value={field.value ? field.value.toString() : "__none__"}>
                          <FormControl><SelectTrigger data-testid="select-cn-debit-account"><SelectValue placeholder="Select account" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">— Select —</SelectItem>
                            {accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="creditAccountId" render={({ field }) => (
                      <FormItem><FormLabel>Credit Account <span className="text-muted-foreground text-xs">(A/R or Cash)</span></FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === "__none__" ? undefined : parseInt(v))} value={field.value ? field.value.toString() : "__none__"}>
                          <FormControl><SelectTrigger data-testid="select-cn-credit-account"><SelectValue placeholder="Select account" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">— Select —</SelectItem>
                            {accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Section C — Application Settings</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="applicationMode" render={({ field }) => (
                      <FormItem><FormLabel>Application Mode</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "credit_balance"}>
                          <FormControl><SelectTrigger data-testid="select-cn-application-mode"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="apply_invoice">Apply to Specific Invoice</SelectItem>
                            <SelectItem value="credit_balance">Keep as Customer Credit Balance</SelectItem>
                            <SelectItem value="refund">Refund Immediately</SelectItem>
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem><FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "draft"}>
                          <FormControl><SelectTrigger data-testid="select-cn-status"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="pending">Pending Approval</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="applied">Applied</SelectItem>
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="allowPartialApplication" render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} data-testid="checkbox-cn-partial" />
                      </FormControl>
                      <FormLabel className="!mt-0 text-sm">Allow partial application</FormLabel>
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Section D — Notes & Approval</h4>
                <div className="border-t pt-3 space-y-3">
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>Internal Notes</FormLabel><FormControl><Textarea placeholder="Additional notes..." rows={2} data-testid="input-cn-notes" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="approvalNotes" render={({ field }) => (
                    <FormItem><FormLabel>Approval Notes</FormLabel><FormControl><Textarea placeholder="Notes for approval..." rows={2} data-testid="input-cn-approval-notes" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-credit-note">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingNote ? "Update" : "Create"}
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