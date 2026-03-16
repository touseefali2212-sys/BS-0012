import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, ArrowUpDown, CheckCircle,
  Clock, XCircle, RotateCcw, CreditCard, TrendingUp, TrendingDown,
  RefreshCw, ArrowLeftRight, Users, Store, Wallet, ShieldCheck, FileText,
  Send, DollarSign, Printer, Eye, Filter, X, Layers, Hash, Copy,
  AlertTriangle, Settings, Zap, Lock, Globe, Building2, Receipt,
  BookOpen, BarChart3, Activity, Ban, Download, ChevronLeft, ChevronRight,
  CalendarDays, Banknote, ArrowDownCircle, ArrowUpCircle, Scale,
  Gauge, Repeat, PieChart as PieChartIcon, Info, Landmark, Package,
  Handshake, MapPin, Target, UserCheck, Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useTab } from "@/hooks/use-tab";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertTransactionSchema, type Transaction, type InsertTransaction,
  type Customer, type Account, type Vendor, type Invoice, type Employee,
  insertTransactionTypeSchema, type TransactionType, type InsertTransactionType,
  type CirCustomer, type CorporateCustomer, type Reseller, type Area,
} from "@shared/schema";
import { z } from "zod";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area as RechartsArea, XAxis, YAxis, CartesianGrid } from "recharts";

const transactionFormSchema = insertTransactionSchema.extend({
  txnId: z.string().min(1, "Transaction ID is required"),
  type: z.string().min(1, "Type is required"),
  amount: z.string().min(1, "Amount is required"),
  date: z.string().min(1, "Date is required"),
});

const ttFormSchema = insertTransactionTypeSchema.extend({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  category: z.string().min(1, "Category is required"),
});

const ttCategoryConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  income: { label: "Income", color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800", dotColor: "#22c55e" },
  expense: { label: "Expense", color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800", dotColor: "#ef4444" },
  transfer: { label: "Transfer", color: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800", dotColor: "#3b82f6" },
  adjustment: { label: "Adjustment", color: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800", dotColor: "#a855f7" },
  refund: { label: "Refund", color: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800", dotColor: "#f59e0b" },
  system: { label: "System", color: "bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300 border-slate-200 dark:border-slate-800", dotColor: "#64748b" },
};

const normalBalanceDefaults: Record<string, string> = {
  income: "debit", expense: "debit", transfer: "debit", adjustment: "debit", refund: "debit", system: "credit",
};

const typeColors: Record<string, string> = {
  income: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800",
  payment: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800",
  expense: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800",
  transfer: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  adjustment: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  refund: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  credit: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800",
  debit: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800",
  system: "bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300 border-slate-200 dark:border-slate-800",
};

const statusColors: Record<string, { label: string; color: string; icon: any }> = {
  completed: { label: "Posted", color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800", icon: CheckCircle },
  pending: { label: "Pending Approval", color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800", icon: Clock },
  failed: { label: "Failed", color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800", icon: XCircle },
  reversed: { label: "Reversed", color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800", icon: RotateCcw },
  voided: { label: "Voided", color: "bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400 border-slate-200 dark:border-slate-800", icon: Ban },
  draft: { label: "Draft", color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border-blue-200 dark:border-blue-800", icon: FileText },
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Cash", bank_transfer: "Bank Transfer", cheque: "Cheque", online: "Online", jazzcash: "JazzCash", easypaisa: "EasyPaisa",
};

const moduleSourceMap: Record<string, string> = {
  income: "Income Entry", expense: "Expense Entry", payment: "Customer Payment",
  credit: "Credit Note", debit: "Debit Note", refund: "Refund",
  transfer: "Bank Transfer", adjustment: "Journal Entry", system: "System",
};

const PAGE_SIZE = 25;

export default function TransactionsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useTab("list");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [drawerTxn, setDrawerTxn] = useState<Transaction | null>(null);

  const [ttSearch, setTtSearch] = useState("");
  const [ttCategoryFilter, setTtCategoryFilter] = useState("all");
  const [ttStatusFilter, setTtStatusFilter] = useState("all");
  const [ttDialogOpen, setTtDialogOpen] = useState(false);
  const [editingTt, setEditingTt] = useState<TransactionType | null>(null);
  const [deleteTtId, setDeleteTtId] = useState<number | null>(null);
  const [detailTt, setDetailTt] = useState<TransactionType | null>(null);

  const [colSearch, setColSearch] = useState("");
  const [colStatusFilter, setColStatusFilter] = useState("all");
  const [colMethodFilter, setColMethodFilter] = useState("all");
  const [colOfficerFilter, setColOfficerFilter] = useState("all");
  const [colDateFrom, setColDateFrom] = useState("");
  const [colDateTo, setColDateTo] = useState("");
  const [colPage, setColPage] = useState(1);
  const [colFormOpen, setColFormOpen] = useState(false);
  const [colDetailTxn, setColDetailTxn] = useState<Transaction | null>(null);
  const [colAgingFilter, setColAgingFilter] = useState<string | null>(null);

  const [cirSearch, setCirSearch] = useState("");
  const [cirStatusFilter, setCirStatusFilter] = useState("all");
  const [cirMethodFilter, setCirMethodFilter] = useState("all");
  const [cirCustomerFilter, setCirCustomerFilter] = useState("all");
  const [cirDateFrom, setCirDateFrom] = useState("");
  const [cirDateTo, setCirDateTo] = useState("");
  const [cirPage, setCirPage] = useState(1);
  const [cirFormOpen, setCirFormOpen] = useState(false);
  const [cirDetailTxn, setCirDetailTxn] = useState<Transaction | null>(null);
  const [cirDetailCustomer, setCirDetailCustomer] = useState<CirCustomer | null>(null);

  const [corpSearch, setCorpSearch] = useState("");
  const [corpStatusFilter, setCorpStatusFilter] = useState("all");
  const [corpMethodFilter, setCorpMethodFilter] = useState("all");
  const [corpCompanyFilter, setCorpCompanyFilter] = useState("all");
  const [corpBranchFilter, setCorpBranchFilter] = useState("all");
  const [corpOfficerFilter, setCorpOfficerFilter] = useState("all");
  const [corpDateFrom, setCorpDateFrom] = useState("");
  const [corpDateTo, setCorpDateTo] = useState("");
  const [corpPage, setCorpPage] = useState(1);
  const [corpFormOpen, setCorpFormOpen] = useState(false);
  const [corpDetailTxn, setCorpDetailTxn] = useState<Transaction | null>(null);
  const [corpDetailCustomer, setCorpDetailCustomer] = useState<CorporateCustomer | null>(null);
  const [corpAgingFilter, setCorpAgingFilter] = useState<string | null>(null);

  const [resSearch, setResSearch] = useState("");
  const [resStatusFilter, setResStatusFilter] = useState("all");
  const [resMethodFilter, setResMethodFilter] = useState("all");
  const [resResellerFilter, setResResellerFilter] = useState("all");
  const [resTypeFilter, setResTypeFilter] = useState("all");
  const [resOfficerFilter, setResOfficerFilter] = useState("all");
  const [resDateFrom, setResDateFrom] = useState("");
  const [resDateTo, setResDateTo] = useState("");
  const [resPage, setResPage] = useState(1);
  const [resFormOpen, setResFormOpen] = useState(false);
  const [resDetailTxn, setResDetailTxn] = useState<Transaction | null>(null);
  const [resDetailReseller, setResDetailReseller] = useState<Reseller | null>(null);

  const [refSearch, setRefSearch] = useState("");
  const [refTypeFilter, setRefTypeFilter] = useState("all");
  const [refStatusFilter, setRefStatusFilter] = useState("all");
  const [refEntityFilter, setRefEntityFilter] = useState("all");
  const [refDateFrom, setRefDateFrom] = useState("");
  const [refDateTo, setRefDateTo] = useState("");
  const [refPage, setRefPage] = useState(1);
  const [refFormOpen, setRefFormOpen] = useState(false);
  const [refDetailTxn, setRefDetailTxn] = useState<Transaction | null>(null);
  const [refEntityType, setRefEntityType] = useState("customer");
  const [refTxnType, setRefTxnType] = useState<"refund" | "credit">("refund");

  const [xfrSearch, setXfrSearch] = useState("");
  const [xfrStatusFilter, setXfrStatusFilter] = useState("all");
  const [xfrTypeFilter, setXfrTypeFilter] = useState("all");
  const [xfrAccountFilter, setXfrAccountFilter] = useState("all");
  const [xfrBranchFilter, setXfrBranchFilter] = useState("all");
  const [xfrDateFrom, setXfrDateFrom] = useState("");
  const [xfrDateTo, setXfrDateTo] = useState("");
  const [xfrPage, setXfrPage] = useState(1);
  const [xfrFormOpen, setXfrFormOpen] = useState(false);
  const [xfrDetailTxn, setXfrDetailTxn] = useState<Transaction | null>(null);

  const [walSearch, setWalSearch] = useState("");
  const [walTypeFilter, setWalTypeFilter] = useState("all");
  const [walStatusFilter, setWalStatusFilter] = useState("all");
  const [walEntityFilter, setWalEntityFilter] = useState("all");
  const [walDateFrom, setWalDateFrom] = useState("");
  const [walDateTo, setWalDateTo] = useState("");
  const [walPage, setWalPage] = useState(1);
  const [walFormOpen, setWalFormOpen] = useState(false);
  const [walDetailTxn, setWalDetailTxn] = useState<Transaction | null>(null);
  const [walEntityType, setWalEntityType] = useState<"customer" | "vendor" | "reseller">("customer");

  const [rocSearch, setRocSearch] = useState("");
  const [rocAreaFilter, setRocAreaFilter] = useState("all");
  const [rocOfficerFilter, setRocOfficerFilter] = useState("all");
  const [rocMethodFilter, setRocMethodFilter] = useState("all");
  const [rocStatusFilter, setRocStatusFilter] = useState("all");
  const [rocDateFrom, setRocDateFrom] = useState("");
  const [rocDateTo, setRocDateTo] = useState("");
  const [rocPage, setRocPage] = useState(1);
  const [rocViewMode, setRocViewMode] = useState<"summary" | "detail">("summary");
  const [rocExpandedArea, setRocExpandedArea] = useState<string | null>(null);
  const [rocDetailTxn, setRocDetailTxn] = useState<Transaction | null>(null);
  const [rocRecoverFormOpen, setRocRecoverFormOpen] = useState(false);
  const [rocApproveDialogTxn, setRocApproveDialogTxn] = useState<Transaction | null>(null);
  const [rocApproveAction, setRocApproveAction] = useState<"approve" | "reject">("approve");

  const { data: transactions = [], isLoading } = useQuery<(Transaction & { customerName?: string; accountName?: string; vendorName?: string; debitAccountName?: string; creditAccountName?: string })[]>({ queryKey: ["/api/transactions"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: accountsList = [] } = useQuery<Account[]>({ queryKey: ["/api/accounts"] });
  const { data: vendors = [] } = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });
  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: transactionTypes = [], isLoading: ttLoading } = useQuery<TransactionType[]>({ queryKey: ["/api/transaction-types"] });
  const { data: areas = [] } = useQuery<Area[]>({ queryKey: ["/api/areas"] });
  const { data: cirCustomers = [], isLoading: cirLoading } = useQuery<CirCustomer[]>({ queryKey: ["/api/cir-customers"] });
  const { data: corpCustomers = [], isLoading: corpLoading } = useQuery<CorporateCustomer[]>({ queryKey: ["/api/corporate-customers"] });
  const { data: resellers = [], isLoading: resLoading } = useQuery<Reseller[]>({ queryKey: ["/api/resellers"] });

  const form = useForm<InsertTransaction>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      txnId: "", type: "payment", amount: "0", accountId: null, customerId: null,
      invoiceId: null, paymentMethod: "cash", reference: "", description: "",
      date: new Date().toISOString().split("T")[0], status: "completed",
      debitAccountId: null, creditAccountId: null, vendorId: null,
      category: "", tax: "0", discount: "0", branch: "", costCenter: "",
      chequeNumber: "", transactionRef: "",
      autoAdjustReceivable: false, allowPartialPayment: false,
      sendNotification: false, lockAfterSave: false, isRecurring: false, requireApproval: false,
    },
  });

  const ttForm = useForm<InsertTransactionType>({
    resolver: zodResolver(ttFormSchema),
    defaultValues: {
      name: "", code: "", description: "", category: "income", normalBalance: "debit",
      defaultDebitAccountId: undefined, defaultCreditAccountId: undefined,
      allowManualOverride: true, autoJournalEntry: true,
      linkCustomer: false, linkCirCorporate: false, linkVendor: false, linkPayroll: false,
      linkResellerWallet: false, linkExpenseEntry: false, linkIncomeEntry: false,
      linkPaymentGateway: false, linkCreditNotes: false, linkBankReconciliation: false,
      autoPostLedger: true, requireApproval: false, allowEditAfterPosting: false,
      lockAfterPeriodClose: true, recurringAllowed: false, taxApplicable: false,
      isSystemDefault: false, isActive: true, sortOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const netAmount = Number(data.amount || 0) + Number(data.tax || 0) - Number(data.discount || 0);
      const res = await apiRequest("POST", "/api/transactions", { ...data, netAmount: String(netAmount) });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/transactions"] }); queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] }); setDialogOpen(false); form.reset(); toast({ title: "Transaction created successfully" }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertTransaction> }) => {
      const payload = { ...data };
      if (data.amount !== undefined) {
        const netAmount = Number(data.amount || 0) + Number(data.tax || 0) - Number(data.discount || 0);
        payload.netAmount = String(netAmount) as any;
      }
      const res = await apiRequest("PATCH", `/api/transactions/${id}`, payload);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/transactions"] }); queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] }); setDialogOpen(false); setEditingTransaction(null); form.reset(); toast({ title: "Transaction updated successfully" }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/transactions/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/transactions"] }); queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] }); toast({ title: "Transaction deleted successfully" }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const reverseMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest("PATCH", `/api/transactions/${id}`, { status: "reversed" }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/transactions"] }); toast({ title: "Transaction reversed" }); setDrawerTxn(null); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const createTtMutation = useMutation({
    mutationFn: async (data: InsertTransactionType) => { const res = await apiRequest("POST", "/api/transaction-types", { ...data, createdAt: new Date().toISOString() }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/transaction-types"] }); setTtDialogOpen(false); setEditingTt(null); ttForm.reset(); toast({ title: "Transaction type created successfully" }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const updateTtMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertTransactionType> }) => { const res = await apiRequest("PATCH", `/api/transaction-types/${id}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/transaction-types"] }); setTtDialogOpen(false); setEditingTt(null); ttForm.reset(); toast({ title: "Transaction type updated" }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const deleteTtMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/transaction-types/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/transaction-types"] }); setDeleteTtId(null); toast({ title: "Transaction type deleted" }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); setDeleteTtId(null); },
  });

  const today = new Date().toISOString().split("T")[0];
  const thisWeekStart = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split("T")[0]; })();
  const thisMonthStart = new Date().toISOString().slice(0, 7) + "-01";
  const thisMonth = new Date().toISOString().slice(0, 7);

  const filtered = useMemo(() => {
    return transactions.filter((txn) => {
      if (search) { const q = search.toLowerCase(); if (!(txn.txnId.toLowerCase().includes(q) || (txn.description || "").toLowerCase().includes(q) || (txn.reference || "").toLowerCase().includes(q) || (txn as any).customerName?.toLowerCase().includes(q) || (txn as any).vendorName?.toLowerCase().includes(q))) return false; }
      if (typeFilter !== "all" && txn.type !== typeFilter) return false;
      if (statusFilter !== "all" && txn.status !== statusFilter) return false;
      if (categoryFilter !== "all" && txn.category !== categoryFilter) return false;
      if (accountFilter !== "all") { const aid = parseInt(accountFilter); if (txn.accountId !== aid && txn.debitAccountId !== aid && txn.creditAccountId !== aid) return false; }
      if (customerFilter !== "all" && txn.customerId !== parseInt(customerFilter)) return false;
      if (vendorFilter !== "all" && txn.vendorId !== parseInt(vendorFilter)) return false;
      if (methodFilter !== "all" && txn.paymentMethod !== methodFilter) return false;
      if (branchFilter && !(txn.branch || "").toLowerCase().includes(branchFilter.toLowerCase())) return false;
      if (dateFrom && txn.date < dateFrom) return false;
      if (dateTo && txn.date > dateTo) return false;
      if (amountMin && Number(txn.amount) < Number(amountMin)) return false;
      if (amountMax && Number(txn.amount) > Number(amountMax)) return false;
      return true;
    });
  }, [transactions, search, typeFilter, statusFilter, categoryFilter, accountFilter, customerFilter, vendorFilter, methodFilter, branchFilter, dateFrom, dateTo, amountMin, amountMax]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasFilters = search || typeFilter !== "all" || statusFilter !== "all" || categoryFilter !== "all" || accountFilter !== "all" || customerFilter !== "all" || vendorFilter !== "all" || methodFilter !== "all" || branchFilter || dateFrom || dateTo || amountMin || amountMax;

  const clearAllFilters = () => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); setCategoryFilter("all"); setAccountFilter("all"); setCustomerFilter("all"); setVendorFilter("all"); setMethodFilter("all"); setBranchFilter(""); setDateFrom(""); setDateTo(""); setAmountMin(""); setAmountMax(""); setPage(1); };

  const applyQuickFilter = (from: string, to: string) => { setDateFrom(from); setDateTo(to); setPage(1); };

  const kpis = useMemo(() => {
    const todayTxns = transactions.filter(t => t.date === today && t.status !== "voided" && t.status !== "reversed");
    const totalDebit = transactions.filter(t => (t.type === "expense" || t.type === "debit") && t.status !== "voided" && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    const totalCredit = transactions.filter(t => (t.type === "income" || t.type === "payment" || t.type === "credit") && t.status !== "voided" && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    const totalIncome = transactions.filter(t => (t.type === "income" || t.type === "payment") && t.status !== "voided" && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    const totalExpense = transactions.filter(t => t.type === "expense" && t.status !== "voided" && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    const largestThisMonth = transactions.filter(t => t.date?.startsWith(today.slice(0, 7)) && t.status !== "voided").reduce((m, t) => Math.max(m, Number(t.netAmount || t.amount || 0)), 0);
    return {
      todayCount: todayTxns.length,
      todayAmount: todayTxns.reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0),
      totalDebit, totalCredit, totalIncome, totalExpense,
      netCashFlow: totalIncome - totalExpense,
      pendingCount: transactions.filter(t => t.status === "pending").length,
      largestThisMonth,
      avgDaily: transactions.length > 0 ? Math.round(transactions.length / 30) : 0,
    };
  }, [transactions, today]);

  const trendData = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split("T")[0];
      const dayTxns = transactions.filter(t => t.date === ds && t.status !== "voided" && t.status !== "reversed");
      const inc = dayTxns.filter(t => t.type === "income" || t.type === "payment").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
      const exp = dayTxns.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
      return { day: d.toLocaleDateString("en", { weekday: "short" }), income: inc, expense: exp, count: dayTxns.length };
    });
    return last7;
  }, [transactions]);

  const typeDistribution = useMemo(() => {
    const types = ["income", "expense", "payment", "transfer", "refund", "adjustment"];
    return types.map(t => ({
      name: t.charAt(0).toUpperCase() + t.slice(1),
      value: transactions.filter(tx => tx.type === t && tx.status !== "voided").length,
      color: { income: "#22c55e", expense: "#ef4444", payment: "#3b82f6", transfer: "#6366f1", refund: "#f59e0b", adjustment: "#a855f7" }[t] || "#64748b",
    })).filter(d => d.value > 0);
  }, [transactions]);

  const openCreate = () => {
    setEditingTransaction(null);
    const ref = `TXN-${Date.now().toString(36).toUpperCase()}`;
    form.reset({ txnId: ref, type: "payment", amount: "0", accountId: null, customerId: null, invoiceId: null, paymentMethod: "cash", reference: "", description: "", date: today, status: "completed", debitAccountId: null, creditAccountId: null, vendorId: null, category: "", tax: "0", discount: "0", branch: "", costCenter: "", chequeNumber: "", transactionRef: "", autoAdjustReceivable: false, allowPartialPayment: false, sendNotification: false, lockAfterSave: false, isRecurring: false, requireApproval: false });
    setDialogOpen(true);
  };

  const openEdit = (txn: Transaction) => {
    setEditingTransaction(txn);
    form.reset({
      txnId: txn.txnId, type: txn.type, amount: txn.amount, accountId: txn.accountId, customerId: txn.customerId,
      invoiceId: txn.invoiceId, paymentMethod: txn.paymentMethod || "cash", reference: txn.reference || "",
      description: txn.description || "", date: txn.date, status: txn.status,
      debitAccountId: txn.debitAccountId, creditAccountId: txn.creditAccountId, vendorId: txn.vendorId,
      category: txn.category || "", tax: txn.tax || "0", discount: txn.discount || "0",
      branch: txn.branch || "", costCenter: txn.costCenter || "",
      chequeNumber: txn.chequeNumber || "", transactionRef: txn.transactionRef || "",
      autoAdjustReceivable: txn.autoAdjustReceivable, allowPartialPayment: txn.allowPartialPayment,
      sendNotification: txn.sendNotification, lockAfterSave: txn.lockAfterSave,
      isRecurring: txn.isRecurring, requireApproval: txn.requireApproval,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertTransaction) => {
    if (editingTransaction) updateMutation.mutate({ id: editingTransaction.id, data });
    else createMutation.mutate(data);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === paged.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paged.map(t => t.id)));
  };

  const exportCsv = (list: typeof transactions) => {
    const headers = ["Txn ID", "Date", "Type", "Category", "Amount", "Net Amount", "Debit Account", "Credit Account", "Customer", "Vendor", "Payment Method", "Status", "Branch", "Reference", "Description"];
    const rows = list.map(t => [t.txnId, t.date, t.type, t.category || "", t.amount, t.netAmount || t.amount, (t as any).debitAccountName || "", (t as any).creditAccountName || "", (t as any).customerName || "", (t as any).vendorName || "", t.paymentMethod || "", t.status, t.branch || "", t.reference || "", (t.description || "").replace(/,/g, " ")]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `transactions_${today}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const printVoucher = (txn: Transaction) => {
    const customer = customers.find(c => c.id === txn.customerId);
    const vendor = vendors.find(v => v.id === txn.vendorId);
    const debitAcc = accountsList.find(a => a.id === txn.debitAccountId);
    const creditAcc = accountsList.find(a => a.id === txn.creditAccountId);
    const win = window.open("", "_blank", "width=700,height=800");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Transaction Voucher - ${txn.txnId}</title><style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px;color:#333}h2{color:#002B5B;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{padding:6px 8px;border:1px solid #ddd;text-align:left}th{background:#f5f5f5;font-size:11px;text-transform:uppercase;color:#666}.header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #002B5B;padding-bottom:10px;margin-bottom:16px}.amount{font-size:20px;font-weight:bold;color:#002B5B}.footer{margin-top:20px;padding-top:10px;border-top:1px solid #ddd;font-size:10px;color:#999;text-align:center}@media print{body{margin:10mm}}</style></head><body><div class="header"><div><h2>NetSphere Enterprise</h2><span style="font-size:11px;color:#666">Transaction Voucher</span></div><div style="text-align:right"><span style="font-family:monospace;font-size:14px;font-weight:bold">${txn.txnId}</span><br><span style="font-size:11px">${txn.date}</span></div></div><table><tr><th>Field</th><th>Detail</th></tr><tr><td>Type</td><td style="text-transform:capitalize;font-weight:bold">${txn.type}</td></tr><tr><td>Category</td><td style="text-transform:capitalize">${txn.category || "—"}</td></tr><tr><td>Amount</td><td class="amount">Rs. ${Number(txn.amount).toLocaleString()}</td></tr>${txn.tax && Number(txn.tax) > 0 ? `<tr><td>Tax</td><td>Rs. ${Number(txn.tax).toLocaleString()}</td></tr>` : ""}${txn.discount && Number(txn.discount) > 0 ? `<tr><td>Discount</td><td>Rs. ${Number(txn.discount).toLocaleString()}</td></tr>` : ""}<tr><td>Net Amount</td><td style="font-weight:bold;font-size:14px">Rs. ${Number(txn.netAmount || txn.amount).toLocaleString()}</td></tr><tr><td>Status</td><td style="text-transform:capitalize">${txn.status}</td></tr></table><h3 style="color:#002B5B;margin:16px 0 8px">Journal Entry</h3><table><tr><th>Account</th><th>Debit (Rs.)</th><th>Credit (Rs.)</th></tr><tr><td>${debitAcc ? debitAcc.code + " — " + debitAcc.name : "Debit Account"}</td><td style="font-weight:bold">Rs. ${Number(txn.netAmount || txn.amount).toLocaleString()}</td><td>—</td></tr><tr><td>${creditAcc ? creditAcc.code + " — " + creditAcc.name : "Credit Account"}</td><td>—</td><td style="font-weight:bold">Rs. ${Number(txn.netAmount || txn.amount).toLocaleString()}</td></tr></table><table><tr><th>Field</th><th>Detail</th></tr>${customer ? `<tr><td>Customer</td><td>${customer.fullName}</td></tr>` : ""}${vendor ? `<tr><td>Vendor</td><td>${vendor.name}</td></tr>` : ""}<tr><td>Payment Method</td><td style="text-transform:capitalize">${paymentMethodLabels[txn.paymentMethod || ""] || txn.paymentMethod || "—"}</td></tr>${txn.reference ? `<tr><td>Reference</td><td>${txn.reference}</td></tr>` : ""}${txn.chequeNumber ? `<tr><td>Cheque #</td><td>${txn.chequeNumber}</td></tr>` : ""}${txn.branch ? `<tr><td>Branch</td><td>${txn.branch}</td></tr>` : ""}${txn.description ? `<tr><td>Description</td><td>${txn.description}</td></tr>` : ""}</table><div class="footer">NetSphere Enterprise ERP — Printed on ${new Date().toLocaleString()}</div></body></html>`);
    win.document.close(); win.focus(); setTimeout(() => win.print(), 300);
  };

  const getAccountName = (id: number | null) => { if (!id) return "—"; const a = accountsList.find(x => x.id === id); return a ? `${a.code} — ${a.name}` : `#${id}`; };
  const getCustomerName = (id: number | null) => { if (!id) return null; const c = customers.find(x => x.id === id); return c?.fullName || null; };
  const getVendorName = (id: number | null) => { if (!id) return null; const v = vendors.find(x => x.id === id); return v?.name || null; };

  const openTtCreate = () => {
    setEditingTt(null);
    const nextCode = `TT-${(transactionTypes.length + 1).toString().padStart(3, "0")}`;
    ttForm.reset({ name: "", code: nextCode, description: "", category: "income", normalBalance: "debit", defaultDebitAccountId: undefined, defaultCreditAccountId: undefined, allowManualOverride: true, autoJournalEntry: true, linkCustomer: false, linkCirCorporate: false, linkVendor: false, linkPayroll: false, linkResellerWallet: false, linkExpenseEntry: false, linkIncomeEntry: false, linkPaymentGateway: false, linkCreditNotes: false, linkBankReconciliation: false, autoPostLedger: true, requireApproval: false, allowEditAfterPosting: false, lockAfterPeriodClose: true, recurringAllowed: false, taxApplicable: false, isSystemDefault: false, isActive: true, sortOrder: transactionTypes.length + 1 });
    setTtDialogOpen(true);
  };

  const openTtEdit = (tt: TransactionType) => {
    setEditingTt(tt);
    ttForm.reset({ name: tt.name, code: tt.code, description: tt.description || "", category: tt.category, normalBalance: tt.normalBalance, defaultDebitAccountId: tt.defaultDebitAccountId || undefined, defaultCreditAccountId: tt.defaultCreditAccountId || undefined, allowManualOverride: tt.allowManualOverride, autoJournalEntry: tt.autoJournalEntry, linkCustomer: tt.linkCustomer, linkCirCorporate: tt.linkCirCorporate, linkVendor: tt.linkVendor, linkPayroll: tt.linkPayroll, linkResellerWallet: tt.linkResellerWallet, linkExpenseEntry: tt.linkExpenseEntry, linkIncomeEntry: tt.linkIncomeEntry, linkPaymentGateway: tt.linkPaymentGateway, linkCreditNotes: tt.linkCreditNotes, linkBankReconciliation: tt.linkBankReconciliation, autoPostLedger: tt.autoPostLedger, requireApproval: tt.requireApproval, allowEditAfterPosting: tt.allowEditAfterPosting, lockAfterPeriodClose: tt.lockAfterPeriodClose, recurringAllowed: tt.recurringAllowed, taxApplicable: tt.taxApplicable, isSystemDefault: tt.isSystemDefault, isActive: tt.isActive, sortOrder: tt.sortOrder });
    setTtDialogOpen(true);
  };

  const cloneTt = (tt: TransactionType) => {
    setEditingTt(null);
    const nextCode = `TT-${(transactionTypes.length + 1).toString().padStart(3, "0")}`;
    ttForm.reset({ name: `${tt.name} (Copy)`, code: nextCode, description: tt.description || "", category: tt.category, normalBalance: tt.normalBalance, defaultDebitAccountId: tt.defaultDebitAccountId || undefined, defaultCreditAccountId: tt.defaultCreditAccountId || undefined, allowManualOverride: tt.allowManualOverride, autoJournalEntry: tt.autoJournalEntry, linkCustomer: tt.linkCustomer, linkCirCorporate: tt.linkCirCorporate, linkVendor: tt.linkVendor, linkPayroll: tt.linkPayroll, linkResellerWallet: tt.linkResellerWallet, linkExpenseEntry: tt.linkExpenseEntry, linkIncomeEntry: tt.linkIncomeEntry, linkPaymentGateway: tt.linkPaymentGateway, linkCreditNotes: tt.linkCreditNotes, linkBankReconciliation: tt.linkBankReconciliation, autoPostLedger: tt.autoPostLedger, requireApproval: tt.requireApproval, allowEditAfterPosting: tt.allowEditAfterPosting, lockAfterPeriodClose: tt.lockAfterPeriodClose, recurringAllowed: tt.recurringAllowed, taxApplicable: tt.taxApplicable, isSystemDefault: false, isActive: true, sortOrder: transactionTypes.length + 1 });
    setTtDialogOpen(true);
  };

  const onTtSubmit = (data: InsertTransactionType) => {
    if (editingTt) updateTtMutation.mutate({ id: editingTt.id, data });
    else createTtMutation.mutate(data);
  };

  const filteredTt = useMemo(() => {
    let items = [...transactionTypes];
    if (ttSearch) { const q = ttSearch.toLowerCase(); items = items.filter(t => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)); }
    if (ttCategoryFilter !== "all") items = items.filter(t => t.category === ttCategoryFilter);
    if (ttStatusFilter !== "all") items = items.filter(t => ttStatusFilter === "active" ? t.isActive : !t.isActive);
    return items;
  }, [transactionTypes, ttSearch, ttCategoryFilter, ttStatusFilter]);

  const hasTtFilters = ttSearch || ttCategoryFilter !== "all" || ttStatusFilter !== "all";

  const ttKpis = useMemo(() => ({ total: transactionTypes.length, income: transactionTypes.filter(t => t.category === "income").length, expense: transactionTypes.filter(t => t.category === "expense").length, transfer: transactionTypes.filter(t => t.category === "transfer").length, adjustment: transactionTypes.filter(t => t.category === "adjustment").length, system: transactionTypes.filter(t => t.category === "system" || t.category === "refund").length }), [transactionTypes]);

  const ttPieData = useMemo(() => Object.entries(ttCategoryConfig).map(([key, cfg]) => ({ name: cfg.label, value: transactionTypes.filter(t => t.category === key).length, color: cfg.dotColor })).filter(d => d.value > 0), [transactionTypes]);

  const getLinkedModules = (tt: TransactionType) => {
    const m: string[] = [];
    if (tt.linkCustomer) m.push("Customer"); if (tt.linkCirCorporate) m.push("CIR/Corporate"); if (tt.linkVendor) m.push("Vendor"); if (tt.linkPayroll) m.push("Payroll"); if (tt.linkResellerWallet) m.push("Reseller"); if (tt.linkExpenseEntry) m.push("Expense"); if (tt.linkIncomeEntry) m.push("Income"); if (tt.linkPaymentGateway) m.push("Gateway"); if (tt.linkCreditNotes) m.push("Credit Notes"); if (tt.linkBankReconciliation) m.push("Bank Recon");
    return m;
  };

  const colForm = useForm<InsertTransaction>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: { txnId: "", type: "payment", amount: "0", accountId: null, customerId: null, invoiceId: null, paymentMethod: "cash", reference: "", description: "", date: today, status: "completed", debitAccountId: null, creditAccountId: null, vendorId: null, category: "customer_payment", tax: "0", discount: "0", branch: "", costCenter: "", chequeNumber: "", transactionRef: "", autoAdjustReceivable: true, allowPartialPayment: false, sendNotification: true, lockAfterSave: false, isRecurring: false, requireApproval: false },
  });

  const rocForm = useForm<InsertTransaction>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: { txnId: "", type: "payment", amount: "0", accountId: null, customerId: null, invoiceId: null, paymentMethod: "cash", reference: "", description: "", date: today, status: "pending", debitAccountId: null, creditAccountId: null, vendorId: null, category: "recovery_collection", tax: "0", discount: "0", branch: "", costCenter: "", chequeNumber: "", transactionRef: "", autoAdjustReceivable: true, allowPartialPayment: false, sendNotification: true, lockAfterSave: false, isRecurring: false, requireApproval: true },
  });

  const openRocForm = () => {
    const ref = `REC-${Date.now().toString(36).toUpperCase()}`;
    rocForm.reset({ txnId: ref, type: "payment", amount: "0", accountId: null, customerId: null, invoiceId: null, paymentMethod: "cash", reference: "", description: "", date: today, status: "pending", debitAccountId: null, creditAccountId: null, vendorId: null, category: "recovery_collection", tax: "0", discount: "0", branch: "", costCenter: "", chequeNumber: "", transactionRef: "", autoAdjustReceivable: true, allowPartialPayment: false, sendNotification: true, lockAfterSave: false, isRecurring: false, requireApproval: true });
    setRocRecoverFormOpen(true);
  };

  const onRocSubmit = (data: InsertTransaction) => {
    const netAmount = Number(data.amount || 0) + Number(data.tax || 0) - Number(data.discount || 0);
    const desc = `Recovery from ${data.createdBy || "officer"} | Received by: ${data.costCenter || "—"} | Transfer to: ${accountsList.find(a => a.id === data.debitAccountId)?.name || "—"}`;
    createMutation.mutate({ ...data, type: "payment", category: "recovery_collection", netAmount: String(netAmount), description: data.description ? `${desc} | ${data.description}` : desc, status: data.requireApproval ? "pending" : "completed" } as any);
    setRocRecoverFormOpen(false);
    rocForm.reset();
  };

  const rocSelectedCustomer = rocForm.watch("customerId");
  const rocSelectedInvoice = rocForm.watch("invoiceId");
  const rocCustUnpaidInvoices = useMemo(() => rocSelectedCustomer ? invoices.filter(inv => (inv.status === "pending" || inv.status === "overdue" || inv.status === "partial") && inv.customerId === rocSelectedCustomer) : [], [rocSelectedCustomer, invoices]);
  const rocSelectedInvData = useMemo(() => rocSelectedInvoice ? invoices.find(inv => inv.id === rocSelectedInvoice) : null, [rocSelectedInvoice, invoices]);

  const handleRocApprove = (txn: Transaction, action: "approve" | "reject") => {
    const newStatus = action === "approve" ? "completed" : "reversed";
    updateMutation.mutate({ id: txn.id, data: { status: newStatus } });
    setRocApproveDialogTxn(null);
    toast({ title: action === "approve" ? "Recovery Approved" : "Recovery Rejected", description: `Transaction ${txn.txnId} has been ${action === "approve" ? "approved and posted" : "rejected"}` });
  };

  const collectionTxns = useMemo(() => {
    return transactions.filter(t => (t.type === "payment" || t.type === "income" || t.type === "credit") && t.customerId);
  }, [transactions]);

  const customerOutstanding = useMemo(() => {
    const map: Record<number, { name: string; outstanding: number; lastPayment: string | null; paidAmount: number; invoiceCount: number; overdueAmount: number; oldestDue: string | null }> = {};
    customers.forEach(c => { map[c.id] = { name: c.fullName, outstanding: 0, lastPayment: null, paidAmount: 0, invoiceCount: 0, overdueAmount: 0, oldestDue: null }; });
    invoices.forEach(inv => {
      if (!map[inv.customerId]) return;
      const total = Number(inv.totalAmount || inv.amount || 0);
      if (inv.status === "pending" || inv.status === "overdue" || inv.status === "partial") {
        map[inv.customerId].outstanding += total;
        map[inv.customerId].invoiceCount++;
        if (inv.dueDate < today) { map[inv.customerId].overdueAmount += total; }
        if (!map[inv.customerId].oldestDue || inv.dueDate < map[inv.customerId].oldestDue!) map[inv.customerId].oldestDue = inv.dueDate;
      }
    });
    collectionTxns.forEach(t => {
      if (t.customerId && map[t.customerId]) {
        map[t.customerId].paidAmount += Number(t.netAmount || t.amount || 0);
        if (!map[t.customerId].lastPayment || t.date > map[t.customerId].lastPayment!) map[t.customerId].lastPayment = t.date;
      }
    });
    return map;
  }, [customers, invoices, collectionTxns, today]);

  const rocCustOutstanding = useMemo(() => rocSelectedCustomer && customerOutstanding[rocSelectedCustomer] ? customerOutstanding[rocSelectedCustomer].outstanding : 0, [rocSelectedCustomer, customerOutstanding]);

  const agingBuckets = useMemo(() => {
    const buckets = { "0-30": { amount: 0, count: 0 }, "31-60": { amount: 0, count: 0 }, "61-90": { amount: 0, count: 0 }, "90+": { amount: 0, count: 0 } };
    const todayDate = new Date(today);
    invoices.filter(inv => inv.status === "pending" || inv.status === "overdue" || inv.status === "partial").forEach(inv => {
      const dueDate = new Date(inv.dueDate);
      const days = Math.max(0, Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      const amt = Number(inv.totalAmount || inv.amount || 0);
      if (days <= 30) { buckets["0-30"].amount += amt; buckets["0-30"].count++; }
      else if (days <= 60) { buckets["31-60"].amount += amt; buckets["31-60"].count++; }
      else if (days <= 90) { buckets["61-90"].amount += amt; buckets["61-90"].count++; }
      else { buckets["90+"].amount += amt; buckets["90+"].count++; }
    });
    return buckets;
  }, [invoices, today]);

  const colKpis = useMemo(() => {
    const totalOutstanding = Object.values(customerOutstanding).reduce((s, c) => s + c.outstanding, 0);
    const todayCollections = collectionTxns.filter(t => t.date === today);
    const collectedToday = todayCollections.reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    const monthCollections = collectionTxns.filter(t => t.date >= thisMonthStart);
    const collectedMonth = monthCollections.reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    const overdueAmount = Object.values(customerOutstanding).reduce((s, c) => s + c.overdueAmount, 0);
    const totalBilled = invoices.reduce((s, inv) => s + Number(inv.totalAmount || inv.amount || 0), 0);
    const totalCollected = collectionTxns.reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    const efficiency = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;
    return { totalOutstanding, collectedToday, collectedMonth, overdueAmount, efficiency, pendingInvoices: invoices.filter(i => i.status === "pending" || i.status === "overdue").length };
  }, [customerOutstanding, collectionTxns, invoices, today, thisMonthStart]);

  const colMonthlyTrend = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
      const m = d.toISOString().slice(0, 7);
      const collected = collectionTxns.filter(t => t.date?.startsWith(m)).reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
      const billed = invoices.filter(inv => inv.issueDate?.startsWith(m)).reduce((s, inv) => s + Number(inv.totalAmount || inv.amount || 0), 0);
      return { month: d.toLocaleDateString("en", { month: "short" }), collected, billed };
    });
  }, [collectionTxns, invoices]);

  const rocAreaData = useMemo(() => {
    const custZoneMap: Record<number, string> = {};
    customers.forEach(c => { if (c.zone) custZoneMap[c.id] = c.zone; });

    const areaMap: Record<string, { area: string; totalCollected: number; todayCollected: number; txnCount: number; customerCount: Set<number>; officers: Set<string>; methods: Record<string, number>; transactions: typeof collectionTxns }> = {};

    collectionTxns.forEach(t => {
      const zone = t.customerId ? custZoneMap[t.customerId] || "Unassigned" : "Unassigned";
      if (!areaMap[zone]) areaMap[zone] = { area: zone, totalCollected: 0, todayCollected: 0, txnCount: 0, customerCount: new Set(), officers: new Set(), methods: {}, transactions: [] };
      const amt = Number(t.netAmount || t.amount || 0);
      areaMap[zone].totalCollected += amt;
      if (t.date === today) areaMap[zone].todayCollected += amt;
      areaMap[zone].txnCount++;
      if (t.customerId) areaMap[zone].customerCount.add(t.customerId);
      if (t.createdBy) areaMap[zone].officers.add(t.createdBy);
      const method = t.paymentMethod || "cash";
      areaMap[zone].methods[method] = (areaMap[zone].methods[method] || 0) + amt;
      areaMap[zone].transactions.push(t);
    });

    return Object.values(areaMap).map(a => ({
      ...a,
      customerCount: a.customerCount.size,
      officers: Array.from(a.officers),
      avgCollection: a.txnCount > 0 ? Math.round(a.totalCollected / a.txnCount) : 0,
    })).sort((a, b) => b.totalCollected - a.totalCollected);
  }, [collectionTxns, customers, today]);

  const rocFilteredData = useMemo(() => {
    let items = [...rocAreaData];
    if (rocAreaFilter !== "all") items = items.filter(a => a.area === rocAreaFilter);
    if (rocOfficerFilter !== "all") items = items.map(a => {
      const filteredTxns = a.transactions.filter(t => t.createdBy === rocOfficerFilter);
      const custSet = new Set<number>();
      const methods: Record<string, number> = {};
      filteredTxns.forEach(t => {
        if (t.customerId) custSet.add(t.customerId);
        const method = t.paymentMethod || "cash";
        methods[method] = (methods[method] || 0) + Number(t.netAmount || t.amount || 0);
      });
      return {
        ...a,
        transactions: filteredTxns,
        totalCollected: filteredTxns.reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0),
        todayCollected: filteredTxns.filter(t => t.date === today).reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0),
        txnCount: filteredTxns.length,
        customerCount: custSet.size,
        officers: [rocOfficerFilter],
        methods,
        avgCollection: filteredTxns.length > 0 ? Math.round(filteredTxns.reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0) / filteredTxns.length) : 0,
      };
    }).filter(a => a.txnCount > 0);
    if (rocSearch) { const q = rocSearch.toLowerCase(); items = items.filter(a => a.area.toLowerCase().includes(q)); }
    return items;
  }, [rocAreaData, rocAreaFilter, rocOfficerFilter, rocSearch, today]);

  const rocRecoveryTxns = useMemo(() => {
    return transactions.filter(t => t.category === "recovery_collection");
  }, [transactions]);

  const rocKpis = useMemo(() => {
    const source = rocFilteredData;
    const totalCollected = source.reduce((s, a) => s + a.totalCollected, 0);
    const todayCollected = source.reduce((s, a) => s + a.todayCollected, 0);
    const totalAreas = source.filter(a => a.area !== "Unassigned").length;
    const allOfficers = new Set<string>();
    source.forEach(a => a.officers.forEach(o => allOfficers.add(o)));
    const topArea = [...source].sort((a, b) => b.totalCollected - a.totalCollected)[0] || null;
    const avgPerArea = totalAreas > 0 ? Math.round(totalCollected / totalAreas) : 0;
    const pendingApproval = rocRecoveryTxns.filter(t => t.status === "pending").length;
    const approvedCount = rocRecoveryTxns.filter(t => t.status === "completed").length;
    const pendingAmount = rocRecoveryTxns.filter(t => t.status === "pending").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    return { totalCollected, todayCollected, totalAreas, totalOfficers: allOfficers.size, topAreaName: topArea?.area || "—", topAreaAmount: topArea?.totalCollected || 0, avgPerArea, pendingApproval, approvedCount, pendingAmount };
  }, [rocFilteredData, rocRecoveryTxns]);

  const rocDetailTransactions = useMemo(() => {
    if (!rocExpandedArea) return [];
    const areaData = rocAreaData.find(a => a.area === rocExpandedArea);
    if (!areaData) return [];
    let txns = [...areaData.transactions];
    if (rocOfficerFilter !== "all") txns = txns.filter(t => t.createdBy === rocOfficerFilter);
    if (rocMethodFilter !== "all") txns = txns.filter(t => t.paymentMethod === rocMethodFilter);
    if (rocStatusFilter !== "all") txns = txns.filter(t => t.status === rocStatusFilter);
    if (rocDateFrom) txns = txns.filter(t => t.date >= rocDateFrom);
    if (rocDateTo) txns = txns.filter(t => t.date <= rocDateTo);
    if (rocSearch) { const q = rocSearch.toLowerCase(); txns = txns.filter(t => t.txnId.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || (t as any).customerName?.toLowerCase().includes(q)); }
    return txns;
  }, [rocExpandedArea, rocAreaData, rocOfficerFilter, rocMethodFilter, rocStatusFilter, rocDateFrom, rocDateTo, rocSearch]);

  const rocDetailPages = Math.max(1, Math.ceil(rocDetailTransactions.length / PAGE_SIZE));
  const rocDetailPaged = rocDetailTransactions.slice((rocPage - 1) * PAGE_SIZE, rocPage * PAGE_SIZE);

  const exportRocCsv = () => {
    const rows = rocFilteredData.map(a => `"${a.area}","${a.officers.join(', ')}",${a.txnCount},${a.customerCount},"Rs. ${a.totalCollected.toLocaleString()}","Rs. ${a.todayCollected.toLocaleString()}","Rs. ${a.avgCollection.toLocaleString()}"`);
    const csv = "Area,Officers,Transactions,Customers,Total Collected,Today Collected,Avg Collection\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `recovery-officer-collection-${today}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Recovery Officer Collection data exported successfully" });
  };

  const filteredCollections = useMemo(() => {
    let items = [...collectionTxns];
    if (colSearch) { const q = colSearch.toLowerCase(); items = items.filter(t => t.txnId.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || (t as any).customerName?.toLowerCase().includes(q)); }
    if (colStatusFilter !== "all") items = items.filter(t => t.status === colStatusFilter);
    if (colMethodFilter !== "all") items = items.filter(t => t.paymentMethod === colMethodFilter);
    if (colOfficerFilter !== "all") items = items.filter(t => t.createdBy === colOfficerFilter);
    if (colDateFrom) items = items.filter(t => t.date >= colDateFrom);
    if (colDateTo) items = items.filter(t => t.date <= colDateTo);
    if (colAgingFilter) {
      const todayDate = new Date(today);
      const customerIdsInBucket = new Set<number>();
      invoices.filter(inv => inv.status === "pending" || inv.status === "overdue" || inv.status === "partial").forEach(inv => {
        const days = Math.max(0, Math.floor((todayDate.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
        const inBucket = (colAgingFilter === "0-30" && days <= 30) || (colAgingFilter === "31-60" && days > 30 && days <= 60) || (colAgingFilter === "61-90" && days > 60 && days <= 90) || (colAgingFilter === "90+" && days > 90);
        if (inBucket) customerIdsInBucket.add(inv.customerId);
      });
      items = items.filter(t => t.customerId && customerIdsInBucket.has(t.customerId));
    }
    return items;
  }, [collectionTxns, colSearch, colStatusFilter, colMethodFilter, colOfficerFilter, colDateFrom, colDateTo, colAgingFilter, invoices, today]);

  const colTotalPages = Math.max(1, Math.ceil(filteredCollections.length / PAGE_SIZE));
  const colPaged = filteredCollections.slice((colPage - 1) * PAGE_SIZE, colPage * PAGE_SIZE);
  const hasColFilters = colSearch || colStatusFilter !== "all" || colMethodFilter !== "all" || colOfficerFilter !== "all" || colDateFrom || colDateTo;

  const unpaidInvoices = useMemo(() => invoices.filter(inv => inv.status === "pending" || inv.status === "overdue" || inv.status === "partial"), [invoices]);

  const colSelectedCustomer = colForm.watch("customerId");
  const colSelectedInvoice = colForm.watch("invoiceId");
  const custUnpaidInvoices = useMemo(() => colSelectedCustomer ? unpaidInvoices.filter(inv => inv.customerId === colSelectedCustomer) : [], [colSelectedCustomer, unpaidInvoices]);
  const selectedInvData = useMemo(() => colSelectedInvoice ? invoices.find(inv => inv.id === colSelectedInvoice) : null, [colSelectedInvoice, invoices]);
  const custOutstandingTotal = useMemo(() => colSelectedCustomer && customerOutstanding[colSelectedCustomer] ? customerOutstanding[colSelectedCustomer].outstanding : 0, [colSelectedCustomer, customerOutstanding]);

  const openColForm = () => {
    const ref = `COL-${Date.now().toString(36).toUpperCase()}`;
    colForm.reset({ txnId: ref, type: "payment", amount: "0", accountId: null, customerId: null, invoiceId: null, paymentMethod: "cash", reference: "", description: "", date: today, status: "completed", debitAccountId: null, creditAccountId: null, vendorId: null, category: "customer_payment", tax: "0", discount: "0", branch: "", costCenter: "", chequeNumber: "", transactionRef: "", autoAdjustReceivable: true, allowPartialPayment: false, sendNotification: true, lockAfterSave: false, isRecurring: false, requireApproval: false });
    setColFormOpen(true);
  };

  const onColSubmit = (data: InsertTransaction) => {
    const netAmount = Number(data.amount || 0) + Number(data.tax || 0) - Number(data.discount || 0);
    createMutation.mutate({ ...data, type: "payment", category: "customer_payment", netAmount: String(netAmount) } as any);
    setColFormOpen(false);
    colForm.reset();
  };

  const exportCollectionsCsv = () => {
    const headers = ["Collection ID", "Date", "Customer", "Invoice", "Payment Method", "Amount", "Status", "Reference"];
    const rows = filteredCollections.map(t => [t.txnId, t.date, (t as any).customerName || getCustomerName(t.customerId) || "", t.invoiceId ? invoices.find(i => i.id === t.invoiceId)?.invoiceNumber || "" : "", t.paymentMethod || "", t.netAmount || t.amount, t.status, t.reference || ""]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `collections_${today}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const cirForm = useForm<InsertTransaction>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: { txnId: "", type: "payment", amount: "0", accountId: null, customerId: null, invoiceId: null, paymentMethod: "bank_transfer", reference: "", description: "", date: today, status: "completed", debitAccountId: null, creditAccountId: null, vendorId: null, category: "cir_revenue", tax: "0", discount: "0", branch: "", costCenter: "", chequeNumber: "", transactionRef: "", autoAdjustReceivable: true, allowPartialPayment: false, sendNotification: true, lockAfterSave: false, isRecurring: false, requireApproval: false },
  });

  const cirCustomerMap = useMemo(() => {
    const m = new Map<number, CirCustomer>();
    cirCustomers.forEach(c => m.set(c.id, c));
    return m;
  }, [cirCustomers]);

  const cirCollectionTxns = useMemo(() => {
    return transactions.filter(t => (t.type === "payment" || t.type === "income" || t.type === "credit") && t.category === "cir_revenue");
  }, [transactions]);

  const cirKpis = useMemo(() => {
    const activeCir = cirCustomers.filter(c => c.status === "active").length;
    const totalMonthly = cirCustomers.filter(c => c.status === "active").reduce((s, c) => s + Number(c.monthlyCharges || 0), 0);
    const collectedToday = cirCollectionTxns.filter(t => t.date === today && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    const collectedMonth = cirCollectionTxns.filter(t => t.date >= thisMonthStart && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    const totalCollected = cirCollectionTxns.filter(t => t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    const totalOutstanding = Math.max(0, totalMonthly - collectedMonth);
    const efficiency = totalMonthly > 0 ? Math.round((collectedMonth / totalMonthly) * 100) : 0;
    const overdueAmount = cirCustomers.filter(c => c.status === "suspended").reduce((s, c) => s + Number(c.monthlyCharges || 0), 0);
    return { activeCir, totalOutstanding, collectedToday, collectedMonth, overdueAmount, efficiency };
  }, [cirCustomers, cirCollectionTxns, today, thisMonthStart]);

  const cirMonthlyTrend = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
      const m = d.toISOString().slice(0, 7);
      const collected = cirCollectionTxns.filter(t => t.date?.startsWith(m) && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
      const billed = cirCustomers.filter(c => c.status === "active").reduce((s, c) => s + Number(c.monthlyCharges || 0), 0);
      return { month: d.toLocaleDateString("en", { month: "short" }), collected, billed };
    });
  }, [cirCollectionTxns, cirCustomers]);

  const topOverdueCir = useMemo(() => {
    return cirCustomers.filter(c => c.status === "suspended" || (c.status === "active" && c.contractEndDate && c.contractEndDate < today)).sort((a, b) => Number(b.monthlyCharges || 0) - Number(a.monthlyCharges || 0)).slice(0, 5);
  }, [cirCustomers, today]);

  const filteredCirCollections = useMemo(() => {
    let items = [...cirCollectionTxns];
    if (cirSearch) { const q = cirSearch.toLowerCase(); items = items.filter(t => t.txnId.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || (t as any).customerName?.toLowerCase().includes(q)); }
    if (cirStatusFilter !== "all") items = items.filter(t => t.status === cirStatusFilter);
    if (cirMethodFilter !== "all") items = items.filter(t => t.paymentMethod === cirMethodFilter);
    if (cirCustomerFilter !== "all") items = items.filter(t => String(t.customerId) === cirCustomerFilter);
    if (cirDateFrom) items = items.filter(t => t.date >= cirDateFrom);
    if (cirDateTo) items = items.filter(t => t.date <= cirDateTo);
    return items;
  }, [cirCollectionTxns, cirSearch, cirStatusFilter, cirMethodFilter, cirCustomerFilter, cirDateFrom, cirDateTo]);

  const cirTotalPages = Math.max(1, Math.ceil(filteredCirCollections.length / PAGE_SIZE));
  const cirPaged = filteredCirCollections.slice((cirPage - 1) * PAGE_SIZE, cirPage * PAGE_SIZE);
  const hasCirFilters = cirSearch || cirStatusFilter !== "all" || cirMethodFilter !== "all" || cirCustomerFilter !== "all" || cirDateFrom || cirDateTo;

  const cirSelectedCustomer = cirForm.watch("customerId");
  const cirSelectedCust = useMemo(() => cirSelectedCustomer ? cirCustomerMap.get(cirSelectedCustomer) : null, [cirSelectedCustomer, cirCustomerMap]);

  const openCirForm = () => {
    const ref = `CIR-${Date.now().toString(36).toUpperCase()}`;
    cirForm.reset({ txnId: ref, type: "payment", amount: "0", accountId: null, customerId: null, invoiceId: null, paymentMethod: "bank_transfer", reference: "", description: "", date: today, status: "completed", debitAccountId: null, creditAccountId: null, vendorId: null, category: "cir_revenue", tax: "0", discount: "0", branch: "", costCenter: "", chequeNumber: "", transactionRef: "", autoAdjustReceivable: true, allowPartialPayment: false, sendNotification: true, lockAfterSave: false, isRecurring: false, requireApproval: false });
    setCirFormOpen(true);
  };

  const onCirSubmit = (data: InsertTransaction) => {
    const netAmount = Number(data.amount || 0) + Number(data.tax || 0) - Number(data.discount || 0);
    createMutation.mutate({ ...data, type: "payment", category: "cir_revenue", netAmount: String(netAmount) } as any);
    setCirFormOpen(false);
    cirForm.reset();
  };

  const exportCirCsv = () => {
    const headers = ["Collection ID", "Date", "CIR Customer", "Contract", "Payment Method", "Amount", "Status", "Reference"];
    const rows = filteredCirCollections.map(t => {
      const cir = t.customerId ? cirCustomerMap.get(t.customerId) : null;
      return [t.txnId, t.date, cir?.companyName || (t as any).customerName || "", cir ? `CIR-${String(cir.id).padStart(4, "0")}` : "", t.paymentMethod || "", t.netAmount || t.amount, t.status, t.reference || ""];
    });
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `cir_collections_${today}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const slaColors: Record<string, string> = { Platinum: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800", Gold: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800", Silver: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600" };
  const cirStatusColors: Record<string, { color: string; label: string }> = { active: { color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300", label: "Active" }, suspended: { color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400", label: "Suspended" }, inactive: { color: "bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400", label: "Inactive" } };

  const corpForm = useForm<InsertTransaction>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: { txnId: "", type: "payment", amount: "0", accountId: null, customerId: null, invoiceId: null, paymentMethod: "bank_transfer", reference: "", description: "", date: today, status: "completed", debitAccountId: null, creditAccountId: null, vendorId: null, category: "corporate_revenue", tax: "0", discount: "0", branch: "", costCenter: "", chequeNumber: "", transactionRef: "", autoAdjustReceivable: true, allowPartialPayment: false, sendNotification: true, lockAfterSave: false, isRecurring: false, requireApproval: false },
  });

  const corpCustomerMap = useMemo(() => {
    const m = new Map<number, CorporateCustomer>();
    corpCustomers.forEach(c => m.set(c.id, c));
    return m;
  }, [corpCustomers]);

  const corpCollectionTxns = useMemo(() => {
    return transactions.filter(t => (t.type === "payment" || t.type === "income" || t.type === "credit") && t.category === "corporate_revenue");
  }, [transactions]);

  const corpKpis = useMemo(() => {
    const activeCorps = corpCustomers.filter(c => c.status === "active").length;
    const totalMonthly = corpCustomers.filter(c => c.status === "active").reduce((s, c) => s + Number(c.monthlyBilling || 0), 0);
    const collectedToday = corpCollectionTxns.filter(t => t.date === today && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    const collectedMonth = corpCollectionTxns.filter(t => t.date >= thisMonthStart && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    const totalOutstanding = Math.max(0, totalMonthly - collectedMonth);
    const overdueAmount = corpCustomers.filter(c => c.status === "suspended").reduce((s, c) => s + Number(c.monthlyBilling || 0), 0);
    const efficiency = totalMonthly > 0 ? Math.round((collectedMonth / totalMonthly) * 100) : 0;
    const totalCreditLimit = corpCustomers.filter(c => c.status === "active").reduce((s, c) => s + Number(c.creditLimit || 0), 0);
    const creditUtilization = totalCreditLimit > 0 ? Math.round((totalOutstanding / totalCreditLimit) * 100) : 0;
    return { activeCorps, totalOutstanding, collectedToday, collectedMonth, overdueAmount, efficiency, totalCreditLimit, creditUtilization };
  }, [corpCustomers, corpCollectionTxns, today, thisMonthStart]);

  const corpMonthlyTrend = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
      const m = d.toISOString().slice(0, 7);
      const collected = corpCollectionTxns.filter(t => t.date?.startsWith(m) && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
      const billed = corpCustomers.filter(c => c.status === "active").reduce((s, c) => s + Number(c.monthlyBilling || 0), 0);
      return { month: d.toLocaleDateString("en", { month: "short" }), collected, billed };
    });
  }, [corpCollectionTxns, corpCustomers]);

  const topOverdueCorp = useMemo(() => {
    return corpCustomers.filter(c => c.status === "suspended" || c.status === "inactive").sort((a, b) => Number(b.monthlyBilling || 0) - Number(a.monthlyBilling || 0)).slice(0, 10);
  }, [corpCustomers]);

  const filteredCorpCollections = useMemo(() => {
    let items = [...corpCollectionTxns];
    if (corpSearch) { const q = corpSearch.toLowerCase(); items = items.filter(t => t.txnId.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || (t as any).customerName?.toLowerCase().includes(q)); }
    if (corpStatusFilter !== "all") items = items.filter(t => t.status === corpStatusFilter);
    if (corpMethodFilter !== "all") items = items.filter(t => t.paymentMethod === corpMethodFilter);
    if (corpCompanyFilter !== "all") items = items.filter(t => String(t.customerId) === corpCompanyFilter);
    if (corpOfficerFilter !== "all") items = items.filter(t => t.createdBy === corpOfficerFilter);
    if (corpBranchFilter !== "all") items = items.filter(t => (t.branch || "").toLowerCase() === corpBranchFilter.toLowerCase());
    if (corpDateFrom) items = items.filter(t => t.date >= corpDateFrom);
    if (corpDateTo) items = items.filter(t => t.date <= corpDateTo);
    return items;
  }, [corpCollectionTxns, corpSearch, corpStatusFilter, corpMethodFilter, corpCompanyFilter, corpOfficerFilter, corpBranchFilter, corpDateFrom, corpDateTo]);

  const corpTotalPages = Math.max(1, Math.ceil(filteredCorpCollections.length / PAGE_SIZE));
  const corpPaged = filteredCorpCollections.slice((corpPage - 1) * PAGE_SIZE, corpPage * PAGE_SIZE);
  const hasCorpFilters = corpSearch || corpStatusFilter !== "all" || corpMethodFilter !== "all" || corpCompanyFilter !== "all" || corpOfficerFilter !== "all" || corpBranchFilter !== "all" || corpDateFrom || corpDateTo;

  const corpSelectedCustomerId = corpForm.watch("customerId");
  const corpSelectedCust = useMemo(() => corpSelectedCustomerId ? corpCustomerMap.get(corpSelectedCustomerId) : null, [corpSelectedCustomerId, corpCustomerMap]);

  const openCorpForm = () => {
    const ref = `CORP-${Date.now().toString(36).toUpperCase()}`;
    corpForm.reset({ txnId: ref, type: "payment", amount: "0", accountId: null, customerId: null, invoiceId: null, paymentMethod: "bank_transfer", reference: "", description: "", date: today, status: "completed", debitAccountId: null, creditAccountId: null, vendorId: null, category: "corporate_revenue", tax: "0", discount: "0", branch: "", costCenter: "", chequeNumber: "", transactionRef: "", autoAdjustReceivable: true, allowPartialPayment: false, sendNotification: true, lockAfterSave: false, isRecurring: false, requireApproval: false });
    setCorpFormOpen(true);
  };

  const onCorpSubmit = (data: InsertTransaction) => {
    const netAmount = Number(data.amount || 0) + Number(data.tax || 0) - Number(data.discount || 0);
    createMutation.mutate({ ...data, type: "payment", category: "corporate_revenue", netAmount: String(netAmount) } as any);
    setCorpFormOpen(false);
    corpForm.reset();
  };

  const exportCorpCsv = () => {
    const headers = ["Collection ID", "Date", "Company", "Payment Method", "Amount", "Status", "Branch", "Account Manager", "Reference"];
    const rows = filteredCorpCollections.map(t => {
      const corp = t.customerId ? corpCustomerMap.get(t.customerId) : null;
      return [t.txnId, t.date, corp?.companyName || (t as any).customerName || "", t.paymentMethod || "", t.netAmount || t.amount, t.status, t.branch || "", corp?.accountManager || "", t.reference || ""];
    });
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `corporate_collections_${today}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const corpStatusColorMap: Record<string, { color: string; label: string }> = { active: { color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300", label: "Active" }, suspended: { color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400", label: "Suspended" }, inactive: { color: "bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400", label: "Inactive" } };
  const paymentTermLabels: Record<string, string> = { net_15: "Net 15", net_30: "Net 30", net_45: "Net 45", net_60: "Net 60", immediate: "Immediate", prepaid: "Prepaid" };

  const resForm = useForm<InsertTransaction>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: { txnId: "", type: "payment", amount: "0", accountId: null, customerId: null, invoiceId: null, paymentMethod: "bank_transfer", reference: "", description: "", date: today, status: "completed", debitAccountId: null, creditAccountId: null, vendorId: null, category: "reseller_payment", tax: "0", discount: "0", branch: "", costCenter: "", chequeNumber: "", transactionRef: "", autoAdjustReceivable: true, allowPartialPayment: false, sendNotification: true, lockAfterSave: false, isRecurring: false, requireApproval: false },
  });

  const resellerMap = useMemo(() => {
    const m = new Map<number, Reseller>();
    resellers.forEach(r => m.set(r.id, r));
    return m;
  }, [resellers]);

  const resCollectionTxns = useMemo(() => {
    return transactions.filter(t => (t.type === "payment" || t.type === "income" || t.type === "credit") && t.category === "reseller_payment");
  }, [transactions]);

  const resKpis = useMemo(() => {
    const activeResellers = resellers.filter(r => r.status === "active").length;
    const totalWalletBalance = resellers.reduce((s, r) => s + Number(r.walletBalance || 0), 0);
    const totalCredit = resellers.reduce((s, r) => s + Number(r.creditLimit || 0), 0);
    const resOnCredit = resellers.filter(r => Number(r.creditLimit || 0) > 0 && Number(r.walletBalance || 0) < 0).length;
    const collectedToday = resCollectionTxns.filter(t => t.date === today && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    const collectedMonth = resCollectionTxns.filter(t => t.date >= thisMonthStart && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    const totalOutstanding = resellers.filter(r => Number(r.walletBalance || 0) < 0).reduce((s, r) => s + Math.abs(Number(r.walletBalance || 0)), 0);
    const overdueResellers = resellers.filter(r => Number(r.walletBalance || 0) < 0).length;
    const totalExpectedMonthly = resellers.filter(r => r.status === "active").length * 50000;
    const efficiency = totalExpectedMonthly > 0 ? Math.round((collectedMonth / totalExpectedMonthly) * 100) : 0;
    return { activeResellers, totalWalletBalance, totalCredit, resOnCredit, collectedToday, collectedMonth, totalOutstanding, overdueResellers, efficiency };
  }, [resellers, resCollectionTxns, today, thisMonthStart]);

  const resMonthlyTrend = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
      const m = d.toISOString().slice(0, 7);
      const collected = resCollectionTxns.filter(t => t.date?.startsWith(m) && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
      const target = resellers.filter(r => r.status === "active").length * 50000;
      return { month: d.toLocaleDateString("en", { month: "short" }), collected, target };
    });
  }, [resCollectionTxns, resellers]);

  const topOverdueResellers = useMemo(() => {
    return resellers.filter(r => Number(r.walletBalance || 0) < 0 || r.status === "suspended").sort((a, b) => Number(a.walletBalance || 0) - Number(b.walletBalance || 0)).slice(0, 10);
  }, [resellers]);

  const filteredResCollections = useMemo(() => {
    let items = [...resCollectionTxns];
    if (resSearch) { const q = resSearch.toLowerCase(); items = items.filter(t => t.txnId.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || (t as any).customerName?.toLowerCase().includes(q)); }
    if (resStatusFilter !== "all") items = items.filter(t => t.status === resStatusFilter);
    if (resMethodFilter !== "all") items = items.filter(t => t.paymentMethod === resMethodFilter);
    if (resResellerFilter !== "all") items = items.filter(t => String(t.vendorId) === resResellerFilter);
    if (resTypeFilter !== "all") items = items.filter(t => (t.costCenter || "") === resTypeFilter);
    if (resOfficerFilter !== "all") items = items.filter(t => t.createdBy === resOfficerFilter);
    if (resDateFrom) items = items.filter(t => t.date >= resDateFrom);
    if (resDateTo) items = items.filter(t => t.date <= resDateTo);
    return items;
  }, [resCollectionTxns, resSearch, resStatusFilter, resMethodFilter, resResellerFilter, resTypeFilter, resOfficerFilter, resDateFrom, resDateTo]);

  const resTotalPages = Math.max(1, Math.ceil(filteredResCollections.length / PAGE_SIZE));
  const resPaged = filteredResCollections.slice((resPage - 1) * PAGE_SIZE, resPage * PAGE_SIZE);
  const hasResFilters = resSearch || resStatusFilter !== "all" || resMethodFilter !== "all" || resResellerFilter !== "all" || resTypeFilter !== "all" || resOfficerFilter !== "all" || resDateFrom || resDateTo;

  const resSelectedResellerId = resForm.watch("vendorId");
  const resSelectedReseller = useMemo(() => resSelectedResellerId ? resellerMap.get(resSelectedResellerId) : null, [resSelectedResellerId, resellerMap]);

  const openResForm = () => {
    const ref = `RES-${Date.now().toString(36).toUpperCase()}`;
    resForm.reset({ txnId: ref, type: "payment", amount: "0", accountId: null, customerId: null, invoiceId: null, paymentMethod: "bank_transfer", reference: "", description: "", date: today, status: "completed", debitAccountId: null, creditAccountId: null, vendorId: null, category: "reseller_payment", tax: "0", discount: "0", branch: "", costCenter: "wallet_topup", chequeNumber: "", transactionRef: "", autoAdjustReceivable: true, allowPartialPayment: false, sendNotification: true, lockAfterSave: false, isRecurring: false, requireApproval: false });
    setResFormOpen(true);
  };

  const onResSubmit = (data: InsertTransaction) => {
    const netAmount = Number(data.amount || 0) + Number(data.tax || 0) - Number(data.discount || 0);
    createMutation.mutate({ ...data, type: "payment", category: "reseller_payment", netAmount: String(netAmount) } as any);
    setResFormOpen(false);
    resForm.reset();
  };

  const exportResCsv = () => {
    const headers = ["Collection ID", "Date", "Reseller", "Collection Type", "Payment Method", "Amount", "Status", "Reference"];
    const rows = filteredResCollections.map(t => {
      const res = t.vendorId ? resellerMap.get(t.vendorId) : null;
      return [t.txnId, t.date, res?.name || "", t.costCenter || "wallet_topup", t.paymentMethod || "", t.netAmount || t.amount, t.status, t.reference || ""];
    });
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `reseller_collections_${today}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const resStatusColorMap: Record<string, { color: string; label: string }> = { active: { color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300", label: "Active" }, low_balance: { color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300", label: "Low Balance" }, suspended: { color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400", label: "Suspended" }, inactive: { color: "bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400", label: "Inactive" } };
  const collectionTypeLabels: Record<string, string> = { wallet_topup: "Wallet Top-up", credit_settlement: "Credit Settlement", commission_adjustment: "Commission Adjust", security_deposit: "Security Deposit", penalty_recovery: "Penalty Recovery" };

  const getResellerStatus = (r: Reseller): string => {
    if (r.status === "suspended") return "suspended";
    if (r.status === "inactive") return "inactive";
    if (Number(r.walletBalance || 0) < 0) return "low_balance";
    if (Number(r.walletBalance || 0) < 1000) return "low_balance";
    return "active";
  };

  const refForm = useForm<InsertTransaction>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: { txnId: "", type: "refund", amount: "0", accountId: null, customerId: null, invoiceId: null, paymentMethod: "bank_transfer", reference: "", description: "", date: today, status: "pending", debitAccountId: null, creditAccountId: null, vendorId: null, category: "overpayment_refund", tax: "0", discount: "0", branch: "", costCenter: "customer", chequeNumber: "", transactionRef: "", autoAdjustReceivable: true, allowPartialPayment: false, sendNotification: true, lockAfterSave: false, isRecurring: false, requireApproval: true },
  });

  const refundTxns = useMemo(() => {
    return transactions.filter(t => t.type === "refund" || t.category === "refund" || (t.type === "credit" && (t.category || "").includes("refund")));
  }, [transactions]);

  const refundKpis = useMemo(() => {
    const monthTxns = refundTxns.filter(t => t.date >= thisMonthStart && t.status !== "reversed");
    const totalRefundsMonth = monthTxns.filter(t => t.type === "refund").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    const totalCreditsMonth = monthTxns.filter(t => t.type === "credit").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    const pending = refundTxns.filter(t => t.status === "pending").length;
    const approved = refundTxns.filter(t => t.status === "completed").length;
    const rejected = refundTxns.filter(t => t.status === "failed" || t.status === "voided").length;
    const netAdjustment = totalRefundsMonth + totalCreditsMonth;
    const allRevenue = transactions.filter(t => (t.type === "income" || t.type === "payment") && t.date >= thisMonthStart && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
    const refundRatio = allRevenue > 0 ? ((totalRefundsMonth / allRevenue) * 100).toFixed(1) : "0.0";
    return { totalRefundsMonth, totalCreditsMonth, pending, approved, rejected, netAdjustment, refundRatio };
  }, [refundTxns, transactions, thisMonthStart]);

  const refundMonthlyTrend = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
      const m = d.toISOString().slice(0, 7);
      const refunds = refundTxns.filter(t => t.date?.startsWith(m) && t.type === "refund" && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
      const credits = refundTxns.filter(t => t.date?.startsWith(m) && t.type === "credit" && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
      return { month: d.toLocaleDateString("en", { month: "short" }), refunds, credits };
    });
  }, [refundTxns]);

  const topRefundEntities = useMemo(() => {
    const entityMap = new Map<string, { name: string; total: number; count: number }>();
    refundTxns.filter(t => t.status !== "reversed").forEach(t => {
      const name = (t as any).customerName || (t as any).vendorName || "Unknown";
      const key = `${t.customerId || t.vendorId || "u"}-${name}`;
      const entry = entityMap.get(key) || { name, total: 0, count: 0 };
      entry.total += Number(t.netAmount || t.amount || 0);
      entry.count += 1;
      entityMap.set(key, entry);
    });
    return Array.from(entityMap.values()).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [refundTxns]);

  const filteredRefunds = useMemo(() => {
    let items = [...refundTxns];
    if (refSearch) { const q = refSearch.toLowerCase(); items = items.filter(t => t.txnId.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || ((t as any).customerName || "").toLowerCase().includes(q) || ((t as any).vendorName || "").toLowerCase().includes(q)); }
    if (refTypeFilter !== "all") items = items.filter(t => t.type === refTypeFilter);
    if (refStatusFilter !== "all") items = items.filter(t => t.status === refStatusFilter);
    if (refEntityFilter !== "all") items = items.filter(t => (t.costCenter || "") === refEntityFilter);
    if (refDateFrom) items = items.filter(t => t.date >= refDateFrom);
    if (refDateTo) items = items.filter(t => t.date <= refDateTo);
    return items;
  }, [refundTxns, refSearch, refTypeFilter, refStatusFilter, refEntityFilter, refDateFrom, refDateTo]);

  const refTotalPages = Math.max(1, Math.ceil(filteredRefunds.length / PAGE_SIZE));
  const refPaged = filteredRefunds.slice((refPage - 1) * PAGE_SIZE, refPage * PAGE_SIZE);
  const hasRefFilters = refSearch || refTypeFilter !== "all" || refStatusFilter !== "all" || refEntityFilter !== "all" || refDateFrom || refDateTo;

  const refundCategoryLabels: Record<string, string> = { overpayment_refund: "Overpayment Refund", cancellation_refund: "Service Cancellation", sla_compensation: "SLA Compensation", billing_error: "Billing Error Correction", downgrade_credit: "Plan Downgrade Credit", manual_adjustment: "Manual Adjustment", security_deposit_refund: "Security Deposit Refund" };
  const refundMethodLabels: Record<string, string> = { bank_transfer: "Refund to Bank", wallet: "Refund to Wallet", credit_note: "Credit Note", future_invoice: "Apply to Future Invoice" };

  const openRefForm = () => {
    const ref = `REF-${Date.now().toString(36).toUpperCase()}`;
    refForm.reset({ txnId: ref, type: "refund", amount: "0", accountId: null, customerId: null, invoiceId: null, paymentMethod: "bank_transfer", reference: "", description: "", date: today, status: "pending", debitAccountId: null, creditAccountId: null, vendorId: null, category: "overpayment_refund", tax: "0", discount: "0", branch: "", costCenter: "customer", chequeNumber: "", transactionRef: "", autoAdjustReceivable: true, allowPartialPayment: false, sendNotification: true, lockAfterSave: false, isRecurring: false, requireApproval: true });
    setRefEntityType("customer");
    setRefTxnType("refund");
    setRefFormOpen(true);
  };

  const onRefSubmit = (data: InsertTransaction) => {
    const netAmount = Number(data.amount || 0) - Number(data.tax || 0) - Number(data.discount || 0);
    createMutation.mutate({ ...data, type: refTxnType, netAmount: String(Math.abs(netAmount)) } as any);
    setRefFormOpen(false);
    refForm.reset();
  };

  const exportRefCsv = () => {
    const headers = ["Refund ID", "Date", "Type", "Entity", "Invoice", "Category", "Amount", "Reason", "Status", "Approved By"];
    const rows = filteredRefunds.map(t => {
      return [t.txnId, t.date, t.type, (t as any).customerName || (t as any).vendorName || "—", t.invoiceId || "—", refundCategoryLabels[t.category || ""] || t.category || "—", t.netAmount || t.amount, t.description || "", t.status, t.createdBy || "—"];
    });
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `refund_credit_${today}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const refStatusMap: Record<string, { color: string; label: string; icon: any }> = {
    completed: { color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800", label: "Approved", icon: CheckCircle },
    pending: { color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800", label: "Pending Approval", icon: Clock },
    failed: { color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800", label: "Rejected", icon: XCircle },
    reversed: { color: "bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400 border-slate-200 dark:border-slate-800", label: "Reversed", icon: RotateCcw },
    voided: { color: "bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400 border-slate-200 dark:border-slate-800", label: "Voided", icon: Ban },
  };

  const xfrForm = useForm<InsertTransaction>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: { txnId: "", type: "transfer", amount: "0", accountId: null, customerId: null, invoiceId: null, paymentMethod: "bank_transfer", reference: "", description: "", date: today, status: "completed", debitAccountId: null, creditAccountId: null, vendorId: null, category: "bank_to_bank", tax: "0", discount: "0", branch: "", costCenter: "", chequeNumber: "", transactionRef: "", autoAdjustReceivable: false, allowPartialPayment: false, sendNotification: false, lockAfterSave: false, isRecurring: false, requireApproval: false },
  });

  const transferTxns = transactions.filter(t => t.type === "transfer");
  const filteredTransfers = transferTxns.filter(t => {
    const matchSearch = xfrSearch === "" || t.txnId?.toLowerCase().includes(xfrSearch.toLowerCase()) || t.description?.toLowerCase().includes(xfrSearch.toLowerCase());
    const matchStatus = xfrStatusFilter === "all" || t.status === xfrStatusFilter;
    const matchType = xfrTypeFilter === "all" || t.category === xfrTypeFilter;
    const matchAccount = xfrAccountFilter === "all" || t.debitAccountId?.toString() === xfrAccountFilter || t.creditAccountId?.toString() === xfrAccountFilter;
    const matchBranch = xfrBranchFilter === "all" || t.branch === xfrBranchFilter;
    const matchDateFrom = !xfrDateFrom || t.date >= xfrDateFrom;
    const matchDateTo = !xfrDateTo || t.date <= xfrDateTo;
    return matchSearch && matchStatus && matchType && matchAccount && matchBranch && matchDateFrom && matchDateTo;
  });
  const xfrPagedData = filteredTransfers.slice((xfrPage - 1) * PAGE_SIZE, xfrPage * PAGE_SIZE);
  const xfrTotalPages = Math.ceil(filteredTransfers.length / PAGE_SIZE) || 1;

  const xfrKpis = {
    todayTotal: transferTxns.filter(t => t.date === today && t.status !== "voided" && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0),
    monthTotal: transferTxns.filter(t => t.date?.startsWith(thisMonth) && t.status !== "voided" && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0),
    cashBalance: accountsList.filter(a => a.type === "asset" && (a.name.toLowerCase().includes("cash") || a.code.toLowerCase().includes("cash"))).reduce((s, a) => s + Number(a.balance || 0), 0),
    bankBalance: accountsList.filter(a => a.type === "asset" && (a.name.toLowerCase().includes("bank") || a.code.toLowerCase().includes("bank"))).reduce((s, a) => s + Number(a.balance || 0), 0),
    interBranch: transferTxns.filter(t => t.category === "inter_branch" && t.status !== "voided").length,
    pending: transferTxns.filter(t => t.status === "pending").length,
  };

  const xfrBranches = [...new Set(transferTxns.map(t => t.branch).filter(Boolean))];
  const xfrTransferTypeLabels: Record<string, string> = { cash_to_bank: "Cash → Bank", bank_to_cash: "Bank → Cash", bank_to_bank: "Bank → Bank", wallet_to_bank: "Wallet → Bank", inter_branch: "Inter-Branch", internal_ledger: "Internal Ledger" };

  const xfrMonthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    transferTxns.filter(t => t.status !== "voided" && t.status !== "reversed").forEach(t => {
      const m = t.date?.slice(0, 7) || "";
      if (m) map[m] = (map[m] || 0) + Number(t.netAmount || t.amount || 0);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, amount]) => ({ month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }), amount }));
  }, [transferTxns]);

  const xfrTopAccounts = useMemo(() => {
    const map: Record<number, { name: string; count: number; total: number }> = {};
    transferTxns.filter(t => t.status !== "voided" && t.status !== "reversed").forEach(t => {
      [t.debitAccountId, t.creditAccountId].forEach(id => {
        if (id) {
          const acc = accountsList.find(a => a.id === id);
          if (acc) {
            if (!map[id]) map[id] = { name: `${acc.code} — ${acc.name}`, count: 0, total: 0 };
            map[id].count++;
            map[id].total += Number(t.netAmount || t.amount || 0);
          }
        }
      });
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [transferTxns, accountsList]);

  const hasXfrFilters = xfrSearch !== "" || xfrStatusFilter !== "all" || xfrTypeFilter !== "all" || xfrAccountFilter !== "all" || xfrBranchFilter !== "all" || xfrDateFrom !== "" || xfrDateTo !== "";

  const walletTxns = transactions.filter(t => t.type === "adjustment" && (t.category === "wallet_topup" || t.category === "wallet_deduction" || t.category === "prepaid_credit" || t.category === "prepaid_usage" || t.category === "wallet_refund" || t.category === "wallet_transfer" || t.costCenter === "wallet"));
  const walletOperationLabels: Record<string, string> = { wallet_topup: "Wallet Top-Up", wallet_deduction: "Wallet Deduction", prepaid_credit: "Prepaid Credit", prepaid_usage: "Prepaid Usage", wallet_refund: "Wallet Refund", wallet_transfer: "Wallet Transfer" };
  const walletStatusMap: Record<string, { color: string; label: string; icon: any }> = {
    completed: { color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800", label: "Completed", icon: CheckCircle },
    pending: { color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800", label: "Pending", icon: Clock },
    failed: { color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800", label: "Failed", icon: XCircle },
    reversed: { color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border-blue-200 dark:border-blue-800", label: "Reversed", icon: RotateCcw },
    voided: { color: "bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400 border-slate-200 dark:border-slate-800", label: "Cancelled", icon: Ban },
  };
  const filteredWalletTxns = walletTxns.filter(t => {
    const cust = t.customerId ? customers.find(c => c.id === t.customerId) : null;
    const vendor = t.vendorId ? vendors.find(v => v.id === t.vendorId) : null;
    const entityName = cust?.fullName || vendor?.name || "";
    const matchSearch = !walSearch || t.txnId?.toLowerCase().includes(walSearch.toLowerCase()) || entityName.toLowerCase().includes(walSearch.toLowerCase()) || t.description?.toLowerCase().includes(walSearch.toLowerCase());
    const matchType = walTypeFilter === "all" || t.category === walTypeFilter;
    const matchStatus = walStatusFilter === "all" || t.status === walStatusFilter;
    const matchEntity = walEntityFilter === "all" || (walEntityFilter === "customer" && t.customerId) || (walEntityFilter === "vendor" && t.vendorId) || (walEntityFilter === "reseller" && t.costCenter === "reseller");
    const matchDateFrom = !walDateFrom || (t.date && t.date >= walDateFrom);
    const matchDateTo = !walDateTo || (t.date && t.date <= walDateTo);
    return matchSearch && matchType && matchStatus && matchEntity && matchDateFrom && matchDateTo;
  });
  const walPagedData = filteredWalletTxns.slice((walPage - 1) * PAGE_SIZE, walPage * PAGE_SIZE);
  const walTotalPages = Math.ceil(filteredWalletTxns.length / PAGE_SIZE) || 1;
  const hasWalFilters = walSearch !== "" || walTypeFilter !== "all" || walStatusFilter !== "all" || walEntityFilter !== "all" || walDateFrom !== "" || walDateTo !== "";

  const totalCustomerWallet = customers.reduce((s, c) => s + Number((c as any).walletBalance || 0), 0);
  const totalResellerWallet = resellers.reduce((s, r) => s + Number(r.walletBalance || 0), 0);
  const walKpis = {
    totalWalletBalance: totalCustomerWallet + totalResellerWallet,
    customerWallet: totalCustomerWallet,
    resellerWallet: totalResellerWallet,
    todayTopups: walletTxns.filter(t => t.date === today && (t.category === "wallet_topup" || t.category === "prepaid_credit") && t.status !== "voided" && t.status !== "reversed").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0),
    monthVolume: walletTxns.filter(t => t.date?.startsWith(thisMonth) && t.status !== "voided" && t.status !== "reversed").reduce((s, t) => s + Math.abs(Number(t.netAmount || t.amount || 0)), 0),
    pendingTxns: walletTxns.filter(t => t.status === "pending").length,
  };

  const walMonthlyData = useMemo(() => {
    const map: Record<string, { topup: number; usage: number }> = {};
    walletTxns.filter(t => t.status !== "voided" && t.status !== "reversed").forEach(t => {
      const m = t.date?.slice(0, 7) || "";
      if (m) {
        if (!map[m]) map[m] = { topup: 0, usage: 0 };
        const amt = Math.abs(Number(t.netAmount || t.amount || 0));
        if (t.category === "wallet_topup" || t.category === "prepaid_credit") map[m].topup += amt;
        else map[m].usage += amt;
      }
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, d]) => ({ month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }), topup: d.topup, usage: d.usage }));
  }, [walletTxns]);

  const walTopCustomers = useMemo(() => {
    const map: Record<number, { name: string; balance: number; txnCount: number }> = {};
    walletTxns.filter(t => t.customerId && t.status !== "voided" && t.status !== "reversed").forEach(t => {
      const id = t.customerId!;
      const cust = customers.find(c => c.id === id);
      if (!map[id]) map[id] = { name: cust?.fullName || "Unknown", balance: Number((cust as any)?.walletBalance || 0), txnCount: 0 };
      map[id].txnCount++;
    });
    customers.filter(c => Number((c as any).walletBalance || 0) > 0).forEach(c => {
      if (!map[c.id]) map[c.id] = { name: c.fullName, balance: Number((c as any).walletBalance || 0), txnCount: 0 };
    });
    return Object.values(map).sort((a, b) => b.balance - a.balance).slice(0, 8);
  }, [walletTxns, customers]);

  const walForm = useForm<InsertTransaction>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      txnId: "", type: "adjustment", amount: "0", accountId: null, customerId: null, invoiceId: null,
      paymentMethod: "cash", reference: "", description: "", date: today, status: "completed",
      debitAccountId: null, creditAccountId: null, vendorId: null, category: "wallet_topup",
      tax: "0", discount: "0", branch: "", costCenter: "wallet", chequeNumber: "", transactionRef: "",
      autoAdjustReceivable: false, allowPartialPayment: false, sendNotification: false,
      lockAfterSave: false, isRecurring: false, requireApproval: false,
    },
  });

  const openWalForm = () => {
    const ref = `WAL-${Date.now().toString(36).toUpperCase()}`;
    walForm.reset({ txnId: ref, type: "adjustment", amount: "0", accountId: null, customerId: null, invoiceId: null, paymentMethod: "cash", reference: "", description: "", date: today, status: "completed", debitAccountId: null, creditAccountId: null, vendorId: null, category: "wallet_topup", tax: "0", discount: "0", branch: "", costCenter: "wallet", chequeNumber: "", transactionRef: "", autoAdjustReceivable: false, allowPartialPayment: false, sendNotification: false, lockAfterSave: false, isRecurring: false, requireApproval: false });
    setWalEntityType("customer");
    setWalFormOpen(true);
  };

  const onWalSubmit = (data: InsertTransaction) => {
    const netAmount = Number(data.amount || 0) - Number(data.tax || 0);
    createMutation.mutate({ ...data, type: "adjustment", costCenter: "wallet", netAmount: String(Math.abs(netAmount)) } as any);
    setWalFormOpen(false);
    walForm.reset();
  };

  const exportWalCsv = () => {
    const headers = ["Txn ID", "Date", "Entity", "Operation", "Amount", "Method", "Status", "Reference"];
    const rows = filteredWalletTxns.map(t => {
      const cust = t.customerId ? customers.find(c => c.id === t.customerId) : null;
      const vendor = t.vendorId ? vendors.find(v => v.id === t.vendorId) : null;
      return [t.txnId, t.date, cust?.fullName || vendor?.name || "—", walletOperationLabels[t.category || ""] || t.category || "—", t.netAmount || t.amount, t.paymentMethod || "—", t.status, t.reference || "—"];
    });
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `wallet_transactions_${today}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const openXfrForm = () => {
    const ref = `XFR-${Date.now().toString(36).toUpperCase()}`;
    xfrForm.reset({ txnId: ref, type: "transfer", amount: "0", accountId: null, customerId: null, invoiceId: null, paymentMethod: "bank_transfer", reference: "", description: "", date: today, status: "completed", debitAccountId: null, creditAccountId: null, vendorId: null, category: "bank_to_bank", tax: "0", discount: "0", branch: "", costCenter: "", chequeNumber: "", transactionRef: "", autoAdjustReceivable: false, allowPartialPayment: false, sendNotification: false, lockAfterSave: false, isRecurring: false, requireApproval: false });
    setXfrFormOpen(true);
  };

  const onXfrSubmit = (data: InsertTransaction) => {
    if (data.debitAccountId && data.creditAccountId && data.debitAccountId === data.creditAccountId) {
      toast({ title: "Error", description: "Source and destination accounts cannot be the same", variant: "destructive" });
      return;
    }
    const netAmount = Number(data.amount || 0) - Number(data.tax || 0);
    createMutation.mutate({ ...data, type: "transfer", netAmount: String(Math.abs(netAmount)) } as any);
    setXfrFormOpen(false);
    xfrForm.reset();
  };

  const exportXfrCsv = () => {
    const headers = ["Transfer ID", "Date", "From Account", "To Account", "Branch", "Transfer Type", "Amount", "Fee", "Status", "Created By"];
    const rows = filteredTransfers.map(t => {
      const fromAcc = accountsList.find(a => a.id === t.creditAccountId);
      const toAcc = accountsList.find(a => a.id === t.debitAccountId);
      return [t.txnId, t.date, fromAcc ? `${fromAcc.code} — ${fromAcc.name}` : "—", toAcc ? `${toAcc.code} — ${toAcc.name}` : "—", t.branch || "—", xfrTransferTypeLabels[t.category || ""] || t.category || "—", t.netAmount || t.amount, t.tax || "0", t.status, t.createdBy || "—"];
    });
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `transfers_${today}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const xfrStatusMap: Record<string, { color: string; label: string; icon: any }> = {
    completed: { color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800", label: "Completed", icon: CheckCircle },
    pending: { color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800", label: "Pending Approval", icon: Clock },
    failed: { color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800", label: "Failed", icon: XCircle },
    reversed: { color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border-blue-200 dark:border-blue-800", label: "Reversed", icon: RotateCcw },
    voided: { color: "bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400 border-slate-200 dark:border-slate-800", label: "Cancelled", icon: Ban },
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-transactions-title">Financial Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Central financial registry — track, audit, and manage all transactions</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "types" && <Button onClick={openTtCreate} data-testid="button-add-tt"><Plus className="h-4 w-4 mr-1" />Add Transaction Type</Button>}
          {activeTab === "list" && (
            <>
              <Button variant="outline" size="sm" onClick={() => exportCsv(selectedIds.size > 0 ? filtered.filter(t => selectedIds.has(t.id)) : filtered)} data-testid="button-export-csv"><Download className="h-4 w-4 mr-1" />Export CSV</Button>
              <Button onClick={openCreate} data-testid="button-add-transaction"><Plus className="h-4 w-4 mr-1" />New Transaction</Button>
            </>
          )}
          {activeTab === "customer-collections" && (
            <>
              <Button variant="outline" size="sm" onClick={exportCollectionsCsv} data-testid="button-export-collections"><Download className="h-4 w-4 mr-1" />Export</Button>
              <Button onClick={openColForm} data-testid="button-record-collection"><Plus className="h-4 w-4 mr-1" />Record Collection</Button>
            </>
          )}
          {activeTab === "cir-collections" && (
            <>
              <Button variant="outline" size="sm" onClick={exportCirCsv} data-testid="button-export-cir"><Download className="h-4 w-4 mr-1" />Export</Button>
              <Button onClick={openCirForm} data-testid="button-record-cir-collection"><Plus className="h-4 w-4 mr-1" />Record CIR Collection</Button>
            </>
          )}
          {activeTab === "corporate-collections" && (
            <>
              <Button variant="outline" size="sm" onClick={exportCorpCsv} data-testid="button-export-corp"><Download className="h-4 w-4 mr-1" />Export</Button>
              <Button onClick={openCorpForm} data-testid="button-record-corp-collection"><Plus className="h-4 w-4 mr-1" />Record Corporate Collection</Button>
            </>
          )}
          {activeTab === "reseller-collections" && (
            <>
              <Button variant="outline" size="sm" onClick={exportResCsv} data-testid="button-export-res"><Download className="h-4 w-4 mr-1" />Export</Button>
              <Button onClick={openResForm} data-testid="button-record-res-collection"><Plus className="h-4 w-4 mr-1" />Record Reseller Collection</Button>
            </>
          )}
          {activeTab === "refund" && (
            <>
              <Button variant="outline" size="sm" onClick={exportRefCsv} data-testid="button-export-refund"><Download className="h-4 w-4 mr-1" />Export</Button>
              <Button onClick={openRefForm} data-testid="button-create-refund"><Plus className="h-4 w-4 mr-1" />Create Refund / Credit</Button>
            </>
          )}
          {activeTab === "transfer" && (
            <>
              <Button variant="outline" size="sm" onClick={exportXfrCsv} data-testid="button-export-transfer"><Download className="h-4 w-4 mr-1" />Export</Button>
              <Button onClick={openXfrForm} data-testid="button-create-transfer"><Plus className="h-4 w-4 mr-1" />New Transfer</Button>
            </>
          )}
          {activeTab === "wallet" && (
            <>
              <Button variant="outline" size="sm" onClick={exportWalCsv} data-testid="button-export-wallet"><Download className="h-4 w-4 mr-1" />Export</Button>
              <Button onClick={openWalForm} data-testid="button-new-wallet-txn"><Plus className="h-4 w-4 mr-1" />New Wallet Transaction</Button>
            </>
          )}
          {activeTab === "recovery-officer" && (
            <>
              <Button variant="outline" size="sm" onClick={exportRocCsv} data-testid="button-export-roc"><Download className="h-4 w-4 mr-1" />Export</Button>
              <div className="flex border rounded-md overflow-hidden">
                <button onClick={() => setRocViewMode("summary")} className={`px-3 py-1.5 text-xs font-medium ${rocViewMode === "summary" ? "bg-[#002B5B] text-white" : "bg-background hover:bg-muted"}`} data-testid="button-roc-summary">Summary</button>
                <button onClick={() => setRocViewMode("detail")} className={`px-3 py-1.5 text-xs font-medium ${rocViewMode === "detail" ? "bg-[#002B5B] text-white" : "bg-background hover:bg-muted"}`} data-testid="button-roc-detail">Detail View</button>
              </div>
              <Button onClick={openRocForm} data-testid="button-recover-payment"><Plus className="h-4 w-4 mr-1" />Recover Payment</Button>
            </>
          )}
        </div>
      </div>

      {/* ===== TRANSACTIONS LIST TAB ===== */}
      {activeTab === "list" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "Today's Transactions", value: kpis.todayCount, sub: `Rs. ${kpis.todayAmount.toLocaleString()}`, icon: CalendarDays, gradient: "from-[#002B5B] to-[#0066FF]" },
              { label: "Total Debit", value: `Rs. ${kpis.totalDebit.toLocaleString()}`, sub: "All debit entries", icon: ArrowUpCircle, gradient: "from-red-600 to-red-500" },
              { label: "Total Credit", value: `Rs. ${kpis.totalCredit.toLocaleString()}`, sub: "All credit entries", icon: ArrowDownCircle, gradient: "from-green-600 to-green-500" },
              { label: "Total Income", value: `Rs. ${kpis.totalIncome.toLocaleString()}`, sub: `${transactions.filter(t => t.type === "income" || t.type === "payment").length} entries`, icon: TrendingUp, gradient: "from-emerald-600 to-emerald-500" },
              { label: "Total Expense", value: `Rs. ${kpis.totalExpense.toLocaleString()}`, sub: `${transactions.filter(t => t.type === "expense").length} entries`, icon: TrendingDown, gradient: "from-orange-600 to-orange-500" },
              { label: "Net Cash Flow", value: `Rs. ${kpis.netCashFlow.toLocaleString()}`, sub: kpis.netCashFlow >= 0 ? "Positive balance" : "Negative balance", icon: Scale, gradient: kpis.netCashFlow >= 0 ? "from-teal-600 to-teal-500" : "from-red-700 to-red-600" },
            ].map((kpi) => (
              <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-md p-4 text-white shadow-sm`} data-testid={`card-kpi-${kpi.label.toLowerCase().replace(/[\s']+/g, "-")}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-white/50" />
                </div>
                <div className="text-lg font-bold leading-tight">{isLoading ? "—" : kpi.value}</div>
                <p className="text-[10px] text-white/60 mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Activity className="h-4 w-4 text-muted-foreground" />7-Day Transaction Trend</CardTitle></CardHeader>
              <CardContent className="px-2 pb-3">
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={50} />
                    <Tooltip formatter={(v: number) => `Rs. ${v.toLocaleString()}`} />
                    <RechartsArea type="monotone" dataKey="income" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} name="Income" />
                    <RechartsArea type="monotone" dataKey="expense" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="Expense" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><PieChartIcon className="h-4 w-4 text-muted-foreground" />Type Distribution</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3">
                {typeDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={110}>
                    <PieChart><Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={3}>{typeDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip /></PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[110px] text-sm text-muted-foreground">No data</div>}
                <div className="flex flex-wrap gap-2 mt-1">
                  {typeDistribution.map(d => <div key={d.name} className="flex items-center gap-1 text-[10px]"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} /><span className="text-muted-foreground">{d.name} ({d.value})</span></div>)}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t">
                  <div><p className="text-[10px] text-muted-foreground">Largest (Month)</p><p className="text-sm font-bold">Rs. {kpis.largestThisMonth.toLocaleString()}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Pending Approval</p><p className="text-sm font-bold text-amber-600">{kpis.pendingCount}</p></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm">
            <CardContent className="pt-3 pb-3 px-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by ID, reference, description, name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" data-testid="input-search-transactions" />
                </div>
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[130px]" data-testid="select-transaction-type-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[130px]" data-testid="select-transaction-status-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Posted</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reversed">Reversed</SelectItem>
                    <SelectItem value="voided">Voided</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant={showFilters ? "secondary" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)} data-testid="button-toggle-filters"><Filter className="h-3.5 w-3.5 mr-1" />Filters</Button>
                <div className="flex gap-1 border-l pl-2 ml-1">
                  <Button variant="ghost" size="sm" className="text-[11px] px-2" onClick={() => applyQuickFilter(today, today)}>Today</Button>
                  <Button variant="ghost" size="sm" className="text-[11px] px-2" onClick={() => applyQuickFilter(thisWeekStart, today)}>Week</Button>
                  <Button variant="ghost" size="sm" className="text-[11px] px-2" onClick={() => applyQuickFilter(thisMonthStart, today)}>Month</Button>
                </div>
                {hasFilters && <Button variant="ghost" size="sm" onClick={clearAllFilters} data-testid="button-clear-filters"><X className="h-3.5 w-3.5 mr-1" />Reset</Button>}
              </div>
              {showFilters && (
                <div className="mt-3 pt-3 border-t grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="space-y-1"><label className="text-[10px] font-medium text-muted-foreground uppercase">Date From</label><Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} data-testid="input-date-from" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-medium text-muted-foreground uppercase">Date To</label><Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} data-testid="input-date-to" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-medium text-muted-foreground uppercase">Category</label>
                    <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                      <SelectTrigger data-testid="select-category-filter"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="customer_payment">Customer Payment</SelectItem><SelectItem value="vendor_payment">Vendor Payment</SelectItem><SelectItem value="salary">Salary</SelectItem><SelectItem value="commission">Commission</SelectItem><SelectItem value="installation_fee">Installation Fee</SelectItem><SelectItem value="bandwidth">Bandwidth</SelectItem><SelectItem value="utility">Utility</SelectItem><SelectItem value="operational">Operational</SelectItem><SelectItem value="other_income">Other Income</SelectItem><SelectItem value="other_expense">Other Expense</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-medium text-muted-foreground uppercase">Account</label>
                    <Select value={accountFilter} onValueChange={(v) => { setAccountFilter(v); setPage(1); }}>
                      <SelectTrigger data-testid="select-account-filter"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Accounts</SelectItem>{accountsList.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-medium text-muted-foreground uppercase">Customer</label>
                    <Select value={customerFilter} onValueChange={(v) => { setCustomerFilter(v); setPage(1); }}>
                      <SelectTrigger data-testid="select-customer-filter"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Customers</SelectItem>{customers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.fullName}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-medium text-muted-foreground uppercase">Vendor</label>
                    <Select value={vendorFilter} onValueChange={(v) => { setVendorFilter(v); setPage(1); }}>
                      <SelectTrigger data-testid="select-vendor-filter"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Vendors</SelectItem>{vendors.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-medium text-muted-foreground uppercase">Payment Method</label>
                    <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setPage(1); }}>
                      <SelectTrigger data-testid="select-method-filter"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Methods</SelectItem><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="online">Online</SelectItem><SelectItem value="jazzcash">JazzCash</SelectItem><SelectItem value="easypaisa">EasyPaisa</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-medium text-muted-foreground uppercase">Branch</label><Input placeholder="Branch name..." value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }} data-testid="input-branch-filter" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-medium text-muted-foreground uppercase">Min Amount</label><Input type="number" placeholder="0" value={amountMin} onChange={(e) => { setAmountMin(e.target.value); setPage(1); }} data-testid="input-amount-min" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-medium text-muted-foreground uppercase">Max Amount</label><Input type="number" placeholder="999999" value={amountMax} onChange={(e) => { setAmountMax(e.target.value); setPage(1); }} data-testid="input-amount-max" /></div>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md px-4 py-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selectedIds.size} selected</span>
              <Button variant="outline" size="sm" onClick={() => exportCsv(filtered.filter(t => selectedIds.has(t.id)))} data-testid="button-bulk-export"><Download className="h-3.5 w-3.5 mr-1" />Export Selected</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}><X className="h-3.5 w-3.5 mr-1" />Clear Selection</Button>
            </div>
          )}

          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Receipt className="h-14 w-14 mb-3 opacity-20" />
                  <p className="font-medium text-lg">No transactions found</p>
                  <p className="text-sm mt-1">{hasFilters ? "Try adjusting your filters or date range" : "Create your first transaction to get started"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 border-0">
                        <TableHead className="text-white py-3 w-10"><Checkbox checked={paged.length > 0 && selectedIds.size === paged.length} onCheckedChange={toggleSelectAll} className="border-white/40" /></TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Txn ID</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Date</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Type</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden xl:table-cell">Module Source</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden lg:table-cell">Customer / Vendor</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden xl:table-cell">Debit Account</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden xl:table-cell">Credit Account</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 text-right">Amount</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden lg:table-cell">Method</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Status</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.map((txn, idx) => {
                        const sc = statusColors[txn.status] || statusColors.completed;
                        const StatusIcon = sc.icon;
                        const custName = (txn as any).customerName || getCustomerName(txn.customerId);
                        const vendName = (txn as any).vendorName || getVendorName(txn.vendorId);
                        const partyName = custName || vendName || "—";
                        const debitName = (txn as any).debitAccountName || (txn.debitAccountId ? getAccountName(txn.debitAccountId) : "—");
                        const creditName = (txn as any).creditAccountName || (txn.creditAccountId ? getAccountName(txn.creditAccountId) : "—");
                        const isDebitType = txn.type === "expense" || txn.type === "debit";
                        return (
                          <TableRow key={txn.id} className={`${idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/40"} ${selectedIds.has(txn.id) ? "bg-blue-50/60 dark:bg-blue-950/20" : ""}`} data-testid={`row-transaction-${txn.id}`}>
                            <TableCell><Checkbox checked={selectedIds.has(txn.id)} onCheckedChange={() => toggleSelect(txn.id)} /></TableCell>
                            <TableCell>
                              <button className="font-mono text-xs font-medium text-blue-600 dark:text-blue-400 underline-offset-2 underline decoration-dotted" onClick={() => setDrawerTxn(txn)} data-testid={`text-txn-id-${txn.id}`}>{txn.txnId}</button>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap" data-testid={`text-txn-date-${txn.id}`}>{txn.date}</TableCell>
                            <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] capitalize font-medium ${typeColors[txn.type] || ""}`} data-testid={`badge-txn-type-${txn.id}`}>{txn.type}</Badge></TableCell>
                            <TableCell className="hidden xl:table-cell"><Badge variant="secondary" className="no-default-active-elevate text-[9px] font-medium">{moduleSourceMap[txn.type] || txn.type}</Badge></TableCell>
                            <TableCell className="text-sm hidden lg:table-cell" data-testid={`text-txn-party-${txn.id}`}>{partyName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden xl:table-cell max-w-[140px] truncate">{debitName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden xl:table-cell max-w-[140px] truncate">{creditName}</TableCell>
                            <TableCell className="text-right whitespace-nowrap" data-testid={`text-txn-amount-${txn.id}`}>
                              <span className={`font-semibold ${isDebitType ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-300"}`}>
                                {isDebitType ? "−" : "+"}Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell"><span className="text-xs text-muted-foreground">{paymentMethodLabels[txn.paymentMethod || ""] || txn.paymentMethod || "—"}</span></TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${sc.color}`} data-testid={`badge-txn-status-${txn.id}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />{sc.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-txn-actions-${txn.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setDrawerTxn(txn)} data-testid={`button-view-txn-${txn.id}`}><Eye className="h-4 w-4 mr-2" />View Detail</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => printVoucher(txn)} data-testid={`button-print-txn-${txn.id}`}><Printer className="h-4 w-4 mr-2" />Print Voucher</DropdownMenuItem>
                                  {txn.status !== "reversed" && txn.status !== "voided" && (
                                    <DropdownMenuItem onClick={() => openEdit(txn)} data-testid={`button-edit-txn-${txn.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {txn.status === "completed" && (
                                    <DropdownMenuItem className="text-amber-600" onClick={() => reverseMutation.mutate(txn.id)} data-testid={`button-reverse-txn-${txn.id}`}><RotateCcw className="h-4 w-4 mr-2" />Reverse</DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(txn.id)} data-testid={`button-delete-txn-${txn.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} transactions</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="button-prev-page"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium px-3">Page {page} of {totalPages}</span>
              <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} data-testid="button-next-page"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== TRANSACTION TYPE TAB (preserved from previous build) ===== */}
      {activeTab === "types" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: "Total Types", value: ttKpis.total, icon: Layers, gradient: "from-[#002B5B] to-[#007BFF]" },
              { label: "Income Types", value: ttKpis.income, icon: TrendingUp, gradient: "from-emerald-600 to-emerald-500" },
              { label: "Expense Types", value: ttKpis.expense, icon: TrendingDown, gradient: "from-red-600 to-red-500" },
              { label: "Transfer Types", value: ttKpis.transfer, icon: ArrowLeftRight, gradient: "from-blue-600 to-blue-500" },
              { label: "Adjustments", value: ttKpis.adjustment, icon: Settings, gradient: "from-purple-600 to-purple-500" },
              { label: "System / Auto", value: ttKpis.system, icon: Zap, gradient: "from-slate-600 to-slate-500" },
            ].map((kpi) => (
              <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-md p-4 text-white shadow-sm`} data-testid={`card-kpi-tt-${kpi.label.toLowerCase().replace(/[\s\/]+/g, "-")}`}>
                <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span><kpi.icon className="h-4 w-4 text-white/60" /></div>
                <div className="text-xl font-bold">{ttLoading ? "—" : kpi.value}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card className="border shadow-sm lg:col-span-1">
              <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-muted-foreground" />Distribution</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4">
                {ttPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}><PieChart><Pie data={ttPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>{ttPieData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">No data</div>}
                <div className="flex flex-wrap gap-2 mt-2">{ttPieData.map(d => <div key={d.name} className="flex items-center gap-1.5 text-xs"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} /><span className="text-muted-foreground">{d.name} ({d.value})</span></div>)}</div>
              </CardContent>
            </Card>
            <div className="lg:col-span-3 space-y-4">
              <Card className="border-0 shadow-sm"><CardContent className="pt-4 pb-3 px-5"><div className="flex flex-wrap items-center gap-3"><div className="relative flex-1 min-w-[200px] max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name or code..." value={ttSearch} onChange={(e) => setTtSearch(e.target.value)} className="pl-9" data-testid="input-search-tt" /></div><Select value={ttCategoryFilter} onValueChange={setTtCategoryFilter}><SelectTrigger className="w-[150px]" data-testid="select-tt-category-filter"><Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{Object.entries(ttCategoryConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select><Select value={ttStatusFilter} onValueChange={setTtStatusFilter}><SelectTrigger className="w-[120px]" data-testid="select-tt-status-filter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select>{hasTtFilters && <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setTtSearch(""); setTtCategoryFilter("all"); setTtStatusFilter("all"); }} data-testid="button-clear-tt-filters"><X className="h-3.5 w-3.5 mr-1" />Clear</Button>}</div></CardContent></Card>
              <Card className="border-0 shadow-md overflow-hidden"><CardContent className="p-0">
                {ttLoading ? <div className="p-5 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div> : filteredTt.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><Layers className="h-14 w-14 mb-3 opacity-20" /><p className="font-medium text-lg">No transaction types found</p><p className="text-sm mt-1">{hasTtFilters ? "Try adjusting your filters" : "Add your first transaction type"}</p></div>
                ) : (
                  <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 border-0"><TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Type Name</TableHead><TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Code</TableHead><TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Category</TableHead><TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden lg:table-cell">Debit Account</TableHead><TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden lg:table-cell">Credit Account</TableHead><TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden xl:table-cell">Linked Modules</TableHead><TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Status</TableHead><TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 w-10"></TableHead></TableRow></TableHeader>
                    <TableBody>{filteredTt.map((tt, idx) => {
                      const cc = ttCategoryConfig[tt.category] || ttCategoryConfig.income;
                      const linked = getLinkedModules(tt);
                      const debitAcc = tt.defaultDebitAccountId ? accountsList.find(a => a.id === tt.defaultDebitAccountId) : null;
                      const creditAcc = tt.defaultCreditAccountId ? accountsList.find(a => a.id === tt.defaultCreditAccountId) : null;
                      return (
                        <TableRow key={tt.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/40"} data-testid={`row-tt-${tt.id}`}>
                          <TableCell><div><span className="font-medium text-sm" data-testid={`text-tt-name-${tt.id}`}>{tt.name}</span>{tt.isSystemDefault && <Lock className="inline h-3 w-3 ml-1.5 text-muted-foreground" />}{tt.description && <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[220px]">{tt.description}</p>}</div></TableCell>
                          <TableCell className="font-mono text-xs" data-testid={`text-tt-code-${tt.id}`}>{tt.code}</TableCell>
                          <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${cc.color}`}>{cc.label}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{debitAcc ? `${debitAcc.code} — ${debitAcc.name}` : "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{creditAcc ? `${creditAcc.code} — ${creditAcc.name}` : "—"}</TableCell>
                          <TableCell className="hidden xl:table-cell"><div className="flex flex-wrap gap-1">{linked.slice(0, 3).map(m => <Badge key={m} variant="outline" className="no-default-active-elevate text-[9px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800">{m}</Badge>)}{linked.length > 3 && <Badge variant="outline" className="no-default-active-elevate text-[9px]">+{linked.length - 3}</Badge>}{linked.length === 0 && <span className="text-xs text-muted-foreground">—</span>}</div></TableCell>
                          <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${tt.isActive ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800" : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800"}`}>{tt.isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}{tt.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                          <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-tt-actions-${tt.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setDetailTt(tt)} data-testid={`button-view-tt-${tt.id}`}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem><DropdownMenuItem onClick={() => openTtEdit(tt)} data-testid={`button-edit-tt-${tt.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem><DropdownMenuItem onClick={() => cloneTt(tt)} data-testid={`button-clone-tt-${tt.id}`}><Copy className="h-4 w-4 mr-2" />Clone</DropdownMenuItem><DropdownMenuSeparator />{tt.isActive ? <DropdownMenuItem onClick={() => updateTtMutation.mutate({ id: tt.id, data: { isActive: false } })}><XCircle className="h-4 w-4 mr-2" />Disable</DropdownMenuItem> : <DropdownMenuItem onClick={() => updateTtMutation.mutate({ id: tt.id, data: { isActive: true } })}><CheckCircle className="h-4 w-4 mr-2" />Enable</DropdownMenuItem>}<DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onClick={() => setDeleteTtId(tt.id)} data-testid={`button-delete-tt-${tt.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                        </TableRow>
                      );
                    })}</TableBody></Table></div>
                )}
              </CardContent></Card>
              <div className="text-xs text-muted-foreground text-right">Showing {filteredTt.length} of {transactionTypes.length} transaction types</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CUSTOMER COLLECTIONS TAB ===== */}
      {activeTab === "customer-collections" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "Total Outstanding", value: `Rs. ${colKpis.totalOutstanding.toLocaleString()}`, sub: `${colKpis.pendingInvoices} invoices`, icon: Receipt, gradient: "from-[#002B5B] to-[#0066FF]" },
              { label: "Collected Today", value: `Rs. ${colKpis.collectedToday.toLocaleString()}`, sub: `${collectionTxns.filter(t => t.date === today).length} payments`, icon: Banknote, gradient: "from-emerald-600 to-emerald-500" },
              { label: "Collected This Month", value: `Rs. ${colKpis.collectedMonth.toLocaleString()}`, sub: "Current period", icon: TrendingUp, gradient: "from-green-600 to-green-500" },
              { label: "Overdue Amount", value: `Rs. ${colKpis.overdueAmount.toLocaleString()}`, sub: "Past due date", icon: AlertTriangle, gradient: "from-red-600 to-red-500" },
              { label: "Collection Efficiency", value: `${colKpis.efficiency}%`, sub: "Collected / Billed", icon: Gauge, gradient: colKpis.efficiency >= 70 ? "from-teal-600 to-teal-500" : "from-amber-600 to-amber-500" },
              { label: "Pending Invoices", value: colKpis.pendingInvoices, sub: "Awaiting payment", icon: Clock, gradient: "from-orange-600 to-orange-500" },
            ].map((kpi) => (
              <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-md p-4 text-white shadow-sm`} data-testid={`card-col-kpi-${kpi.label.toLowerCase().replace(/[\s%]+/g, "-")}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-white/50" />
                </div>
                <div className="text-lg font-bold leading-tight">{isLoading ? "—" : kpi.value}</div>
                <p className="text-[10px] text-white/60 mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Activity className="h-4 w-4 text-muted-foreground" />Monthly Collection Trend</CardTitle></CardHeader>
              <CardContent className="px-2 pb-3">
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={colMonthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={55} />
                    <Tooltip formatter={(v: number) => `Rs. ${v.toLocaleString()}`} />
                    <RechartsArea type="monotone" dataKey="collected" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} name="Collected" />
                    <RechartsArea type="monotone" dataKey="billed" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} name="Billed" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><BarChart3 className="h-4 w-4 text-muted-foreground" />Aging Buckets (AR)</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3 space-y-2.5">
                {(["0-30", "31-60", "61-90", "90+"] as const).map(bucket => {
                  const data = agingBuckets[bucket];
                  const totalAging = Object.values(agingBuckets).reduce((s, b) => s + b.amount, 0);
                  const pct = totalAging > 0 ? Math.round((data.amount / totalAging) * 100) : 0;
                  const colorMap = { "0-30": "bg-green-500", "31-60": "bg-yellow-500", "61-90": "bg-orange-500", "90+": "bg-red-500" };
                  return (
                    <button key={bucket} onClick={() => setColAgingFilter(colAgingFilter === bucket ? null : bucket)} className={`w-full text-left p-2.5 rounded-md border transition-colors ${colAgingFilter === bucket ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700" : "hover:bg-slate-50 dark:hover:bg-slate-900"}`} data-testid={`button-aging-${bucket}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{bucket} Days</span>
                        <span className="text-xs text-muted-foreground">{data.count} invoices</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className={`h-full ${colorMap[bucket]} rounded-full`} style={{ width: `${pct}%` }} /></div>
                        <span className="text-xs font-semibold min-w-[80px] text-right">Rs. {data.amount.toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{pct}% of total</p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm">
            <CardContent className="pt-3 pb-3 px-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by collection ID, customer name..." value={colSearch} onChange={(e) => { setColSearch(e.target.value); setColPage(1); }} className="pl-9" data-testid="input-search-collections" />
                </div>
                <Select value={colStatusFilter} onValueChange={(v) => { setColStatusFilter(v); setColPage(1); }}>
                  <SelectTrigger className="w-[130px]" data-testid="select-col-status"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="completed">Posted</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="reversed">Reversed</SelectItem></SelectContent>
                </Select>
                <Select value={colMethodFilter} onValueChange={(v) => { setColMethodFilter(v); setColPage(1); }}>
                  <SelectTrigger className="w-[130px]" data-testid="select-col-method"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Methods</SelectItem><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="online">Online</SelectItem><SelectItem value="jazzcash">JazzCash</SelectItem><SelectItem value="easypaisa">EasyPaisa</SelectItem></SelectContent>
                </Select>
                <Select value={colOfficerFilter} onValueChange={(v) => { setColOfficerFilter(v); setColPage(1); }}>
                  <SelectTrigger className="w-[150px]" data-testid="select-col-officer"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Officers</SelectItem>{employees.filter(e => e.status === "active").map(e => <SelectItem key={e.id} value={e.fullName}>{e.fullName}</SelectItem>)}<SelectItem value="admin">Admin</SelectItem></SelectContent>
                </Select>
                <div className="space-y-0 flex items-center gap-1.5 border-l pl-2 ml-1">
                  <Input type="date" value={colDateFrom} onChange={(e) => { setColDateFrom(e.target.value); setColPage(1); }} className="w-[130px] text-xs" data-testid="input-col-date-from" />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input type="date" value={colDateTo} onChange={(e) => { setColDateTo(e.target.value); setColPage(1); }} className="w-[130px] text-xs" data-testid="input-col-date-to" />
                </div>
                {(hasColFilters || colAgingFilter) && <Button variant="ghost" size="sm" onClick={() => { setColSearch(""); setColStatusFilter("all"); setColMethodFilter("all"); setColOfficerFilter("all"); setColDateFrom(""); setColDateTo(""); setColAgingFilter(null); setColPage(1); }} data-testid="button-clear-col-filters"><X className="h-3.5 w-3.5 mr-1" />Reset</Button>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filteredCollections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Users className="h-14 w-14 mb-3 opacity-20" />
                  <p className="font-medium text-lg">No collections found</p>
                  <p className="text-sm mt-1">{hasColFilters ? "Try adjusting your filters" : "Record your first customer collection"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 border-0">
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Collection ID</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Date</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Customer</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden lg:table-cell">Invoice No</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden xl:table-cell">Recovery Officer</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Payment Method</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 text-right">Amount</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden lg:table-cell text-right">Outstanding After</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Status</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {colPaged.map((txn, idx) => {
                        const sc = statusColors[txn.status] || statusColors.completed;
                        const StatusIcon = sc.icon;
                        const custName = (txn as any).customerName || getCustomerName(txn.customerId);
                        const inv = txn.invoiceId ? invoices.find(i => i.id === txn.invoiceId) : null;
                        const custData = txn.customerId ? customerOutstanding[txn.customerId] : null;
                        return (
                          <TableRow key={txn.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/40"} data-testid={`row-collection-${txn.id}`}>
                            <TableCell>
                              <button className="font-mono text-xs font-medium text-blue-600 dark:text-blue-400 underline-offset-2 underline decoration-dotted" onClick={() => setColDetailTxn(txn)} data-testid={`text-col-id-${txn.id}`}>{txn.txnId}</button>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{txn.date}</TableCell>
                            <TableCell>
                              <div><span className="text-sm font-medium" data-testid={`text-col-customer-${txn.id}`}>{custName || "—"}</span>{txn.customerId && <p className="text-[10px] text-muted-foreground">{customers.find(c => c.id === txn.customerId)?.customerType === "corporate" ? "Corporate" : "Home"}</p>}</div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell"><span className="font-mono text-xs text-muted-foreground">{inv ? inv.invoiceNumber : "—"}</span></TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden xl:table-cell">{txn.createdBy || "—"}</TableCell>
                            <TableCell><Badge variant="outline" className="no-default-active-elevate text-[10px] capitalize font-medium">{paymentMethodLabels[txn.paymentMethod || ""] || txn.paymentMethod || "—"}</Badge></TableCell>
                            <TableCell className="text-right" data-testid={`text-col-amount-${txn.id}`}>
                              <span className="font-semibold text-green-700 dark:text-green-300">+Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</span>
                            </TableCell>
                            <TableCell className="text-right hidden lg:table-cell">
                              <span className={`text-sm font-medium ${custData && custData.outstanding > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-300"}`}>Rs. {custData ? custData.outstanding.toLocaleString() : "—"}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${sc.color}`} data-testid={`badge-col-status-${txn.id}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />{sc.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-col-actions-${txn.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setColDetailTxn(txn)} data-testid={`button-view-col-${txn.id}`}><Eye className="h-4 w-4 mr-2" />View Detail</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => printVoucher(txn)} data-testid={`button-print-col-${txn.id}`}><Printer className="h-4 w-4 mr-2" />Print Receipt</DropdownMenuItem>
                                  {txn.status === "completed" && (
                                    <><DropdownMenuSeparator /><DropdownMenuItem className="text-amber-600" onClick={() => reverseMutation.mutate(txn.id)}><RotateCcw className="h-4 w-4 mr-2" />Reverse Collection</DropdownMenuItem></>
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
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Showing {Math.min((colPage - 1) * PAGE_SIZE + 1, filteredCollections.length)}–{Math.min(colPage * PAGE_SIZE, filteredCollections.length)} of {filteredCollections.length} collections</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" disabled={colPage <= 1} onClick={() => setColPage(p => p - 1)} data-testid="button-col-prev-page"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium px-3">Page {colPage} of {colTotalPages}</span>
              <Button variant="outline" size="icon" disabled={colPage >= colTotalPages} onClick={() => setColPage(p => p + 1)} data-testid="button-col-next-page"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Users className="h-4 w-4 text-muted-foreground" />Customer Outstanding Summary</CardTitle><CardDescription className="text-xs">Customers with pending balances</CardDescription></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 dark:bg-slate-800">
                      <TableHead className="text-xs font-semibold">Customer</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Outstanding</TableHead>
                      <TableHead className="text-xs font-semibold text-right hidden md:table-cell">Overdue</TableHead>
                      <TableHead className="text-xs font-semibold hidden lg:table-cell">Oldest Due</TableHead>
                      <TableHead className="text-xs font-semibold text-right hidden md:table-cell">Invoices</TableHead>
                      <TableHead className="text-xs font-semibold hidden lg:table-cell">Last Payment</TableHead>
                      <TableHead className="text-xs font-semibold text-right hidden lg:table-cell">Total Paid</TableHead>
                      <TableHead className="text-xs font-semibold">Risk</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(customerOutstanding).filter(([, c]) => c.outstanding > 0).sort((a, b) => b[1].outstanding - a[1].outstanding).slice(0, 20).map(([id, c]) => {
                      const daysSinceOldest = c.oldestDue ? Math.max(0, Math.floor((new Date(today).getTime() - new Date(c.oldestDue).getTime()) / (1000 * 60 * 60 * 24))) : 0;
                      const risk = daysSinceOldest > 90 ? "high" : daysSinceOldest > 30 ? "medium" : "low";
                      return (
                        <TableRow key={id} data-testid={`row-outstanding-${id}`}>
                          <TableCell className="font-medium text-sm">{c.name}</TableCell>
                          <TableCell className="text-right font-semibold text-red-600 dark:text-red-400">Rs. {c.outstanding.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-sm text-amber-600 hidden md:table-cell">Rs. {c.overdueAmount.toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{c.oldestDue || "—"}</TableCell>
                          <TableCell className="text-right text-sm hidden md:table-cell">{c.invoiceCount}</TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{c.lastPayment || "Never"}</TableCell>
                          <TableCell className="text-right text-sm text-green-600 hidden lg:table-cell">Rs. {c.paidAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`no-default-active-elevate text-[9px] font-semibold ${risk === "high" ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800" : risk === "medium" ? "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-800" : "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400 border-green-200 dark:border-green-800"}`}>
                              {risk === "high" ? <AlertTriangle className="h-3 w-3 mr-1" /> : risk === "medium" ? <Clock className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                              {risk.toUpperCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {Object.entries(customerOutstanding).filter(([, c]) => c.outstanding > 0).length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No outstanding balances</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== CIR COLLECTIONS TAB ===== */}
      {activeTab === "cir-collections" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "CIR Outstanding", value: `Rs. ${cirKpis.totalOutstanding.toLocaleString()}`, sub: "Dedicated bandwidth", icon: Receipt, gradient: "from-[#0B1F3A] to-[#1D4ED8]" },
              { label: "Collected Today", value: `Rs. ${cirKpis.collectedToday.toLocaleString()}`, sub: "Today's CIR payments", icon: Banknote, gradient: "from-emerald-600 to-emerald-500" },
              { label: "Collected This Month", value: `Rs. ${cirKpis.collectedMonth.toLocaleString()}`, sub: "Current period", icon: TrendingUp, gradient: "from-green-600 to-green-500" },
              { label: "Overdue Amount", value: `Rs. ${cirKpis.overdueAmount.toLocaleString()}`, sub: "Suspended clients", icon: AlertTriangle, gradient: "from-red-600 to-red-500" },
              { label: "Active CIR Customers", value: cirKpis.activeCir, sub: "Premium clients", icon: Users, gradient: "from-indigo-600 to-indigo-500" },
              { label: "Collection Efficiency", value: `${cirKpis.efficiency}%`, sub: "Collected / Billed", icon: Gauge, gradient: cirKpis.efficiency >= 70 ? "from-teal-600 to-teal-500" : "from-amber-600 to-amber-500" },
            ].map((kpi) => (
              <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-md p-4 text-white shadow-sm`} data-testid={`card-cir-kpi-${kpi.label.toLowerCase().replace(/[\s%]+/g, "-")}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-white/50" />
                </div>
                <div className="text-lg font-bold leading-tight">{cirLoading ? "—" : kpi.value}</div>
                <p className="text-[10px] text-white/60 mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Activity className="h-4 w-4 text-muted-foreground" />CIR Monthly Collection Trend</CardTitle></CardHeader>
              <CardContent className="px-2 pb-3">
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={cirMonthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={55} />
                    <Tooltip formatter={(v: number) => `Rs. ${v.toLocaleString()}`} />
                    <RechartsArea type="monotone" dataKey="collected" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} name="Collected" />
                    <RechartsArea type="monotone" dataKey="billed" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} name="Monthly Recurring" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-red-500" />Top Overdue CIR Customers</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {topOverdueCir.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No overdue CIR customers</p>
                ) : topOverdueCir.map(cir => (
                  <button key={cir.id} onClick={() => setCirDetailCustomer(cir)} className="w-full text-left p-2.5 rounded-md border transition-colors hover:bg-slate-50 dark:hover:bg-slate-900" data-testid={`button-overdue-cir-${cir.id}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium">{cir.companyName}</span>
                        <p className="text-[10px] text-muted-foreground">{cir.committedBandwidth} — {cir.slaLevel}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400">Rs. {Number(cir.monthlyCharges || 0).toLocaleString()}</span>
                        <p className="text-[10px] text-muted-foreground">{cir.status === "suspended" ? "Suspended" : "Contract ending"}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm">
            <CardContent className="pt-3 pb-3 px-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by ID, customer..." value={cirSearch} onChange={(e) => { setCirSearch(e.target.value); setCirPage(1); }} className="pl-9" data-testid="input-search-cir-collections" />
                </div>
                <Select value={cirCustomerFilter} onValueChange={(v) => { setCirCustomerFilter(v); setCirPage(1); }}>
                  <SelectTrigger className="w-[170px]" data-testid="select-cir-customer-filter"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All CIR Clients</SelectItem>{cirCustomers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={cirStatusFilter} onValueChange={(v) => { setCirStatusFilter(v); setCirPage(1); }}>
                  <SelectTrigger className="w-[130px]" data-testid="select-cir-status"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="completed">Posted</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="reversed">Reversed</SelectItem></SelectContent>
                </Select>
                <Select value={cirMethodFilter} onValueChange={(v) => { setCirMethodFilter(v); setCirPage(1); }}>
                  <SelectTrigger className="w-[140px]" data-testid="select-cir-method"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Methods</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="online">Online Gateway</SelectItem><SelectItem value="cash">Cash</SelectItem></SelectContent>
                </Select>
                <div className="space-y-0 flex items-center gap-1.5 border-l pl-2 ml-1">
                  <Input type="date" value={cirDateFrom} onChange={(e) => { setCirDateFrom(e.target.value); setCirPage(1); }} className="w-[130px] text-xs" data-testid="input-cir-date-from" />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input type="date" value={cirDateTo} onChange={(e) => { setCirDateTo(e.target.value); setCirPage(1); }} className="w-[130px] text-xs" data-testid="input-cir-date-to" />
                </div>
                {hasCirFilters && <Button variant="ghost" size="sm" onClick={() => { setCirSearch(""); setCirStatusFilter("all"); setCirMethodFilter("all"); setCirCustomerFilter("all"); setCirDateFrom(""); setCirDateTo(""); setCirPage(1); }} data-testid="button-clear-cir-filters"><X className="h-3.5 w-3.5 mr-1" />Reset</Button>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-0">
              {isLoading || cirLoading ? (
                <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filteredCirCollections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Globe className="h-14 w-14 mb-3 opacity-20" />
                  <p className="font-medium text-lg">No CIR collections found</p>
                  <p className="text-sm mt-1">{hasCirFilters ? "Try adjusting your filters" : "Record your first CIR customer collection"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-[#0B1F3A] to-[#1D4ED8] border-0">
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Collection ID</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Date</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">CIR Customer</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden lg:table-cell">Contract ID</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden xl:table-cell">Bandwidth</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Payment Method</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 text-right">Amount</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden lg:table-cell text-right">Monthly Charges</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Status</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cirPaged.map((txn, idx) => {
                        const sc = statusColors[txn.status] || statusColors.completed;
                        const StatusIcon = sc.icon;
                        const cir = txn.customerId ? cirCustomerMap.get(txn.customerId) : null;
                        const custName = cir?.companyName || (txn as any).customerName || getCustomerName(txn.customerId);
                        return (
                          <TableRow key={txn.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/40"} data-testid={`row-cir-collection-${txn.id}`}>
                            <TableCell>
                              <button className="font-mono text-xs font-medium text-blue-600 dark:text-blue-400 underline-offset-2 underline decoration-dotted" onClick={() => setCirDetailTxn(txn)} data-testid={`text-cir-id-${txn.id}`}>{txn.txnId}</button>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{txn.date}</TableCell>
                            <TableCell>
                              <div>
                                <span className="text-sm font-medium" data-testid={`text-cir-customer-${txn.id}`}>{custName || "—"}</span>
                                {cir && <p className="text-[10px] text-muted-foreground">{cir.contactPerson}</p>}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell"><span className="font-mono text-xs text-muted-foreground">{cir ? `CIR-${String(cir.id).padStart(4, "0")}` : "—"}</span></TableCell>
                            <TableCell className="hidden xl:table-cell"><span className="text-xs text-muted-foreground">{cir?.committedBandwidth || "—"}</span></TableCell>
                            <TableCell><Badge variant="outline" className="no-default-active-elevate text-[10px] capitalize font-medium">{paymentMethodLabels[txn.paymentMethod || ""] || txn.paymentMethod || "—"}</Badge></TableCell>
                            <TableCell className="text-right" data-testid={`text-cir-amount-${txn.id}`}>
                              <span className="font-semibold text-green-700 dark:text-green-300">+Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</span>
                            </TableCell>
                            <TableCell className="text-right hidden lg:table-cell">
                              <span className="text-sm font-medium text-muted-foreground">Rs. {cir ? Number(cir.monthlyCharges || 0).toLocaleString() : "—"}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${sc.color}`} data-testid={`badge-cir-status-${txn.id}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />{sc.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-cir-actions-${txn.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setCirDetailTxn(txn)} data-testid={`button-view-cir-${txn.id}`}><Eye className="h-4 w-4 mr-2" />View Detail</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => printVoucher(txn)} data-testid={`button-print-cir-${txn.id}`}><Printer className="h-4 w-4 mr-2" />Print Receipt</DropdownMenuItem>
                                  {txn.status === "completed" && (
                                    <><DropdownMenuSeparator /><DropdownMenuItem className="text-amber-600" onClick={() => reverseMutation.mutate(txn.id)}><RotateCcw className="h-4 w-4 mr-2" />Reverse Entry</DropdownMenuItem></>
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
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Showing {Math.min((cirPage - 1) * PAGE_SIZE + 1, filteredCirCollections.length)}–{Math.min(cirPage * PAGE_SIZE, filteredCirCollections.length)} of {filteredCirCollections.length} CIR collections</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" disabled={cirPage <= 1} onClick={() => setCirPage(p => p - 1)} data-testid="button-cir-prev-page"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium px-3">Page {cirPage} of {cirTotalPages}</span>
              <Button variant="outline" size="icon" disabled={cirPage >= cirTotalPages} onClick={() => setCirPage(p => p + 1)} data-testid="button-cir-next-page"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Globe className="h-4 w-4 text-muted-foreground" />CIR Customer Portfolio</CardTitle><CardDescription className="text-xs">Dedicated bandwidth clients with contract & SLA details</CardDescription></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 dark:bg-slate-800">
                      <TableHead className="text-xs font-semibold">Company</TableHead>
                      <TableHead className="text-xs font-semibold">Contract ID</TableHead>
                      <TableHead className="text-xs font-semibold">Bandwidth</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Monthly (Rs.)</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">SLA Level</TableHead>
                      <TableHead className="text-xs font-semibold hidden lg:table-cell">Contract End</TableHead>
                      <TableHead className="text-xs font-semibold hidden lg:table-cell text-right">Security Dep.</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cirCustomers.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No CIR customers</TableCell></TableRow>
                    ) : cirCustomers.map(cir => {
                      const cs = cirStatusColors[cir.status] || cirStatusColors.active;
                      const slaClass = slaColors[cir.slaLevel || ""] || slaColors.Silver;
                      return (
                        <TableRow key={cir.id} data-testid={`row-cir-customer-${cir.id}`}>
                          <TableCell>
                            <button className="text-left" onClick={() => setCirDetailCustomer(cir)}>
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 underline-offset-2 underline decoration-dotted" data-testid={`text-cir-company-${cir.id}`}>{cir.companyName}</span>
                              <p className="text-[10px] text-muted-foreground">{cir.contactPerson} — {cir.phone}</p>
                            </button>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">CIR-{String(cir.id).padStart(4, "0")}</TableCell>
                          <TableCell className="text-xs font-medium">{cir.committedBandwidth || "—"}</TableCell>
                          <TableCell className="text-right font-semibold">Rs. {Number(cir.monthlyCharges || 0).toLocaleString()}</TableCell>
                          <TableCell className="hidden md:table-cell"><Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${slaClass}`}>{cir.slaLevel || "—"}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{cir.contractEndDate || "—"}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground hidden lg:table-cell">Rs. {Number(cir.securityDeposit || 0).toLocaleString()}</TableCell>
                          <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${cs.color}`}>{cs.label}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== CORPORATE COLLECTIONS TAB ===== */}
      {activeTab === "corporate-collections" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "Corporate Outstanding", value: `Rs. ${corpKpis.totalOutstanding.toLocaleString()}`, sub: "B2B receivables", icon: Building2, gradient: "from-[#0A1F44] to-[#1E40AF]" },
              { label: "Collected Today", value: `Rs. ${corpKpis.collectedToday.toLocaleString()}`, sub: "Today's corporate payments", icon: Banknote, gradient: "from-emerald-600 to-emerald-500" },
              { label: "Collected This Month", value: `Rs. ${corpKpis.collectedMonth.toLocaleString()}`, sub: "Current billing period", icon: TrendingUp, gradient: "from-green-600 to-green-500" },
              { label: "Overdue Amount", value: `Rs. ${corpKpis.overdueAmount.toLocaleString()}`, sub: "Suspended accounts", icon: AlertTriangle, gradient: "from-red-600 to-red-500" },
              { label: "Active Corporates", value: corpKpis.activeCorps, sub: "Enterprise clients", icon: Landmark, gradient: "from-indigo-600 to-indigo-500" },
              { label: "Collection Efficiency", value: `${corpKpis.efficiency}%`, sub: `Credit util: ${corpKpis.creditUtilization}%`, icon: Gauge, gradient: corpKpis.efficiency >= 70 ? "from-teal-600 to-teal-500" : "from-amber-600 to-amber-500" },
            ].map((kpi) => (
              <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-md p-4 text-white shadow-sm`} data-testid={`card-corp-kpi-${kpi.label.toLowerCase().replace(/[\s%]+/g, "-")}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-white/50" />
                </div>
                <div className="text-lg font-bold leading-tight">{corpLoading ? "—" : kpi.value}</div>
                <p className="text-[10px] text-white/60 mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Activity className="h-4 w-4 text-muted-foreground" />Corporate Monthly Collection Trend</CardTitle></CardHeader>
              <CardContent className="px-2 pb-3">
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={corpMonthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={55} />
                    <Tooltip formatter={(v: number) => `Rs. ${v.toLocaleString()}`} />
                    <RechartsArea type="monotone" dataKey="collected" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} name="Collected" />
                    <RechartsArea type="monotone" dataKey="billed" stroke="#1E40AF" fill="#1E40AF" fillOpacity={0.1} name="Monthly Billing" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-red-500" />Top Overdue Corporate Clients</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {topOverdueCorp.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No overdue corporate clients</p>
                ) : topOverdueCorp.map(corp => (
                  <button key={corp.id} onClick={() => setCorpDetailCustomer(corp)} className="w-full text-left p-2.5 rounded-md border transition-colors hover:bg-slate-50 dark:hover:bg-slate-900" data-testid={`button-overdue-corp-${corp.id}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium">{corp.companyName}</span>
                        <p className="text-[10px] text-muted-foreground">{corp.industryType} — {corp.totalConnections} connections</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400">Rs. {Number(corp.monthlyBilling || 0).toLocaleString()}</span>
                        <p className="text-[10px] text-muted-foreground capitalize">{corp.status}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm">
            <CardContent className="pt-3 pb-3 px-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by ID, company..." value={corpSearch} onChange={(e) => { setCorpSearch(e.target.value); setCorpPage(1); }} className="pl-9" data-testid="input-search-corp-collections" />
                </div>
                <Select value={corpCompanyFilter} onValueChange={(v) => { setCorpCompanyFilter(v); setCorpPage(1); }}>
                  <SelectTrigger className="w-[170px]" data-testid="select-corp-company-filter"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Companies</SelectItem>{corpCustomers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={corpStatusFilter} onValueChange={(v) => { setCorpStatusFilter(v); setCorpPage(1); }}>
                  <SelectTrigger className="w-[130px]" data-testid="select-corp-status"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="completed">Posted</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="reversed">Reversed</SelectItem></SelectContent>
                </Select>
                <Select value={corpMethodFilter} onValueChange={(v) => { setCorpMethodFilter(v); setCorpPage(1); }}>
                  <SelectTrigger className="w-[140px]" data-testid="select-corp-method"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Methods</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="online">Online Gateway</SelectItem><SelectItem value="cash">Cash</SelectItem></SelectContent>
                </Select>
                <Select value={corpOfficerFilter} onValueChange={(v) => { setCorpOfficerFilter(v); setCorpPage(1); }}>
                  <SelectTrigger className="w-[150px]" data-testid="select-corp-officer"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Officers</SelectItem>{employees.filter(e => e.status === "active").map(e => <SelectItem key={e.id} value={e.fullName}>{e.fullName}</SelectItem>)}<SelectItem value="admin">Admin</SelectItem></SelectContent>
                </Select>
                <div className="space-y-0 flex items-center gap-1.5 border-l pl-2 ml-1">
                  <Input type="date" value={corpDateFrom} onChange={(e) => { setCorpDateFrom(e.target.value); setCorpPage(1); }} className="w-[130px] text-xs" data-testid="input-corp-date-from" />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input type="date" value={corpDateTo} onChange={(e) => { setCorpDateTo(e.target.value); setCorpPage(1); }} className="w-[130px] text-xs" data-testid="input-corp-date-to" />
                </div>
                {hasCorpFilters && <Button variant="ghost" size="sm" onClick={() => { setCorpSearch(""); setCorpStatusFilter("all"); setCorpMethodFilter("all"); setCorpCompanyFilter("all"); setCorpOfficerFilter("all"); setCorpBranchFilter("all"); setCorpDateFrom(""); setCorpDateTo(""); setCorpPage(1); }} data-testid="button-clear-corp-filters"><X className="h-3.5 w-3.5 mr-1" />Reset</Button>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-0">
              {isLoading || corpLoading ? (
                <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filteredCorpCollections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Building2 className="h-14 w-14 mb-3 opacity-20" />
                  <p className="font-medium text-lg">No corporate collections found</p>
                  <p className="text-sm mt-1">{hasCorpFilters ? "Try adjusting your filters" : "Record your first corporate collection"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-[#0A1F44] to-[#1E40AF] border-0">
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Collection ID</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Date</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Company</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden lg:table-cell">Industry</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Payment Method</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 text-right">Amount</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden lg:table-cell text-right">Monthly Billing</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden xl:table-cell text-right">Credit Limit</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Status</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden xl:table-cell">Account Mgr</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {corpPaged.map((txn, idx) => {
                        const sc = statusColors[txn.status] || statusColors.completed;
                        const StatusIcon = sc.icon;
                        const corp = txn.customerId ? corpCustomerMap.get(txn.customerId) : null;
                        const custName = corp?.companyName || (txn as any).customerName || getCustomerName(txn.customerId);
                        return (
                          <TableRow key={txn.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/40"} data-testid={`row-corp-collection-${txn.id}`}>
                            <TableCell>
                              <button className="font-mono text-xs font-medium text-blue-600 dark:text-blue-400 underline-offset-2 underline decoration-dotted" onClick={() => setCorpDetailTxn(txn)} data-testid={`text-corp-id-${txn.id}`}>{txn.txnId}</button>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{txn.date}</TableCell>
                            <TableCell>
                              <div>
                                <span className="text-sm font-medium" data-testid={`text-corp-company-${txn.id}`}>{custName || "—"}</span>
                                {corp && <p className="text-[10px] text-muted-foreground">{corp.registrationNumber}</p>}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell"><span className="text-xs text-muted-foreground">{corp?.industryType || "—"}</span></TableCell>
                            <TableCell><Badge variant="outline" className="no-default-active-elevate text-[10px] capitalize font-medium">{paymentMethodLabels[txn.paymentMethod || ""] || txn.paymentMethod || "—"}</Badge></TableCell>
                            <TableCell className="text-right" data-testid={`text-corp-amount-${txn.id}`}>
                              <span className="font-semibold text-green-700 dark:text-green-300">+Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</span>
                            </TableCell>
                            <TableCell className="text-right hidden lg:table-cell">
                              <span className="text-sm font-medium text-muted-foreground">Rs. {corp ? Number(corp.monthlyBilling || 0).toLocaleString() : "—"}</span>
                            </TableCell>
                            <TableCell className="text-right hidden xl:table-cell">
                              <span className="text-xs text-muted-foreground">Rs. {corp ? Number(corp.creditLimit || 0).toLocaleString() : "—"}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${sc.color}`} data-testid={`badge-corp-status-${txn.id}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />{sc.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell"><span className="text-xs text-muted-foreground">{corp?.accountManager || "—"}</span></TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-corp-actions-${txn.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setCorpDetailTxn(txn)} data-testid={`button-view-corp-${txn.id}`}><Eye className="h-4 w-4 mr-2" />View Detail</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => printVoucher(txn)} data-testid={`button-print-corp-${txn.id}`}><Printer className="h-4 w-4 mr-2" />Print Receipt</DropdownMenuItem>
                                  {txn.status === "completed" && (
                                    <><DropdownMenuSeparator /><DropdownMenuItem className="text-amber-600" onClick={() => reverseMutation.mutate(txn.id)}><RotateCcw className="h-4 w-4 mr-2" />Reverse Entry</DropdownMenuItem></>
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
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Showing {Math.min((corpPage - 1) * PAGE_SIZE + 1, filteredCorpCollections.length)}–{Math.min(corpPage * PAGE_SIZE, filteredCorpCollections.length)} of {filteredCorpCollections.length} corporate collections</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" disabled={corpPage <= 1} onClick={() => setCorpPage(p => p - 1)} data-testid="button-corp-prev-page"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium px-3">Page {corpPage} of {corpTotalPages}</span>
              <Button variant="outline" size="icon" disabled={corpPage >= corpTotalPages} onClick={() => setCorpPage(p => p + 1)} data-testid="button-corp-next-page"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Landmark className="h-4 w-4 text-muted-foreground" />Corporate Customer Portfolio</CardTitle><CardDescription className="text-xs">Enterprise clients with contract, credit & SLA details</CardDescription></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 dark:bg-slate-800">
                      <TableHead className="text-xs font-semibold">Company</TableHead>
                      <TableHead className="text-xs font-semibold">Industry</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Monthly (Rs.)</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Credit Limit</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">Payment Terms</TableHead>
                      <TableHead className="text-xs font-semibold hidden lg:table-cell">Account Manager</TableHead>
                      <TableHead className="text-xs font-semibold hidden lg:table-cell text-right">Connections</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {corpCustomers.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No corporate customers</TableCell></TableRow>
                    ) : corpCustomers.map(corp => {
                      const cs = corpStatusColorMap[corp.status] || corpStatusColorMap.active;
                      return (
                        <TableRow key={corp.id} data-testid={`row-corp-customer-${corp.id}`}>
                          <TableCell>
                            <button className="text-left" onClick={() => setCorpDetailCustomer(corp)}>
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 underline-offset-2 underline decoration-dotted" data-testid={`text-corp-company-name-${corp.id}`}>{corp.companyName}</span>
                              <p className="text-[10px] text-muted-foreground">{corp.registrationNumber} — NTN: {corp.ntn || "—"}</p>
                            </button>
                          </TableCell>
                          <TableCell className="text-xs">{corp.industryType || "—"}</TableCell>
                          <TableCell className="text-right font-semibold">Rs. {Number(corp.monthlyBilling || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs">Rs. {Number(corp.creditLimit || 0).toLocaleString()}</TableCell>
                          <TableCell className="hidden md:table-cell"><Badge variant="outline" className="no-default-active-elevate text-[10px] font-medium">{paymentTermLabels[corp.paymentTerms || ""] || corp.paymentTerms || "—"}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{corp.accountManager || "—"}</TableCell>
                          <TableCell className="text-right text-xs font-medium hidden lg:table-cell">{corp.totalConnections || 0}</TableCell>
                          <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${cs.color}`}>{cs.label}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== RESELLER COLLECTIONS TAB ===== */}
      {activeTab === "reseller-collections" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "Reseller Outstanding", value: `Rs. ${resKpis.totalOutstanding.toLocaleString()}`, sub: "Negative wallet balances", icon: AlertTriangle, gradient: "from-[#3B0764] to-[#1D4ED8]" },
              { label: "Total Wallet Balance", value: `Rs. ${resKpis.totalWalletBalance.toLocaleString()}`, sub: "All reseller wallets", icon: Wallet, gradient: resKpis.totalWalletBalance >= 0 ? "from-emerald-600 to-emerald-500" : "from-red-600 to-red-500" },
              { label: "Collected Today", value: `Rs. ${resKpis.collectedToday.toLocaleString()}`, sub: "Today's reseller payments", icon: Banknote, gradient: "from-green-600 to-green-500" },
              { label: "Collected This Month", value: `Rs. ${resKpis.collectedMonth.toLocaleString()}`, sub: "Current billing period", icon: TrendingUp, gradient: "from-teal-600 to-teal-500" },
              { label: "Resellers on Credit", value: resKpis.resOnCredit, sub: `${resKpis.overdueResellers} overdue`, icon: CreditCard, gradient: "from-amber-600 to-amber-500" },
              { label: "Active Resellers", value: resKpis.activeResellers, sub: `Efficiency: ${resKpis.efficiency}%`, icon: Handshake, gradient: "from-indigo-600 to-indigo-500" },
            ].map((kpi) => (
              <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-md p-4 text-white shadow-sm`} data-testid={`card-res-kpi-${kpi.label.toLowerCase().replace(/[\s%]+/g, "-")}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-white/50" />
                </div>
                <div className="text-lg font-bold leading-tight">{resLoading ? "—" : kpi.value}</div>
                <p className="text-[10px] text-white/60 mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Activity className="h-4 w-4 text-muted-foreground" />Reseller Monthly Collection Trend</CardTitle></CardHeader>
              <CardContent className="px-2 pb-3">
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={resMonthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={55} />
                    <Tooltip formatter={(v: number) => `Rs. ${v.toLocaleString()}`} />
                    <RechartsArea type="monotone" dataKey="collected" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} name="Collected" />
                    <RechartsArea type="monotone" dataKey="target" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.1} name="Target" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-red-500" />Top Overdue / Low Balance Resellers</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {topOverdueResellers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No overdue resellers</p>
                ) : topOverdueResellers.map(res => {
                  const ws = getResellerStatus(res);
                  const wsc = resStatusColorMap[ws] || resStatusColorMap.active;
                  return (
                    <button key={res.id} onClick={() => setResDetailReseller(res)} className="w-full text-left p-2.5 rounded-md border transition-colors hover:bg-slate-50 dark:hover:bg-slate-900" data-testid={`button-overdue-res-${res.id}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-medium">{res.name}</span>
                          <p className="text-[10px] text-muted-foreground">{res.area || res.city || "—"} — {res.totalCustomers || 0} customers</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-semibold ${Number(res.walletBalance || 0) < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>Rs. {Number(res.walletBalance || 0).toLocaleString()}</span>
                          <p className="text-[10px] text-muted-foreground capitalize">{wsc.label}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm">
            <CardContent className="pt-3 pb-3 px-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by ID, reseller..." value={resSearch} onChange={(e) => { setResSearch(e.target.value); setResPage(1); }} className="pl-9" data-testid="input-search-res-collections" />
                </div>
                <Select value={resResellerFilter} onValueChange={(v) => { setResResellerFilter(v); setResPage(1); }}>
                  <SelectTrigger className="w-[170px]" data-testid="select-res-reseller-filter"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Resellers</SelectItem>{resellers.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={resStatusFilter} onValueChange={(v) => { setResStatusFilter(v); setResPage(1); }}>
                  <SelectTrigger className="w-[130px]" data-testid="select-res-status"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="completed">Posted</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="reversed">Reversed</SelectItem></SelectContent>
                </Select>
                <Select value={resMethodFilter} onValueChange={(v) => { setResMethodFilter(v); setResPage(1); }}>
                  <SelectTrigger className="w-[140px]" data-testid="select-res-method"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Methods</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="online">Online Gateway</SelectItem><SelectItem value="cash">Cash</SelectItem></SelectContent>
                </Select>
                <Select value={resTypeFilter} onValueChange={(v) => { setResTypeFilter(v); setResPage(1); }}>
                  <SelectTrigger className="w-[160px]" data-testid="select-res-type-filter"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="wallet_topup">Wallet Top-up</SelectItem><SelectItem value="credit_settlement">Credit Settlement</SelectItem><SelectItem value="commission_adjustment">Commission Adjust</SelectItem><SelectItem value="security_deposit">Security Deposit</SelectItem><SelectItem value="penalty_recovery">Penalty Recovery</SelectItem></SelectContent>
                </Select>
                <div className="space-y-0 flex items-center gap-1.5 border-l pl-2 ml-1">
                  <Input type="date" value={resDateFrom} onChange={(e) => { setResDateFrom(e.target.value); setResPage(1); }} className="w-[130px] text-xs" data-testid="input-res-date-from" />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input type="date" value={resDateTo} onChange={(e) => { setResDateTo(e.target.value); setResPage(1); }} className="w-[130px] text-xs" data-testid="input-res-date-to" />
                </div>
                {hasResFilters && <Button variant="ghost" size="sm" onClick={() => { setResSearch(""); setResStatusFilter("all"); setResMethodFilter("all"); setResResellerFilter("all"); setResTypeFilter("all"); setResOfficerFilter("all"); setResDateFrom(""); setResDateTo(""); setResPage(1); }} data-testid="button-clear-res-filters"><X className="h-3.5 w-3.5 mr-1" />Reset</Button>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-0">
              {isLoading || resLoading ? (
                <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filteredResCollections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Handshake className="h-14 w-14 mb-3 opacity-20" />
                  <p className="font-medium text-lg">No reseller collections found</p>
                  <p className="text-sm mt-1">{hasResFilters ? "Try adjusting your filters" : "Record your first reseller collection"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-[#3B0764] to-[#1D4ED8] border-0">
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Collection ID</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Date</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Reseller</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Collection Type</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Payment Method</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 text-right">Amount</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden lg:table-cell text-right">Wallet Balance</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden xl:table-cell text-right">Credit Limit</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Status</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden xl:table-cell">Officer</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resPaged.map((txn, idx) => {
                        const sc = statusColors[txn.status] || statusColors.completed;
                        const StatusIcon = sc.icon;
                        const res = txn.vendorId ? resellerMap.get(txn.vendorId) : null;
                        const resName = res?.name || (txn as any).vendorName || "—";
                        const colType = collectionTypeLabels[txn.costCenter || ""] || txn.costCenter || "Wallet Top-up";
                        return (
                          <TableRow key={txn.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/40"} data-testid={`row-res-collection-${txn.id}`}>
                            <TableCell>
                              <button className="font-mono text-xs font-medium text-blue-600 dark:text-blue-400 underline-offset-2 underline decoration-dotted" onClick={() => setResDetailTxn(txn)} data-testid={`text-res-id-${txn.id}`}>{txn.txnId}</button>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{txn.date}</TableCell>
                            <TableCell>
                              <div>
                                <span className="text-sm font-medium" data-testid={`text-res-name-${txn.id}`}>{resName}</span>
                                {res && <p className="text-[10px] text-muted-foreground">{res.area || res.city || "—"} — {res.totalCustomers || 0} customers</p>}
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="no-default-active-elevate text-[10px] capitalize font-medium bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800">{colType}</Badge></TableCell>
                            <TableCell><Badge variant="outline" className="no-default-active-elevate text-[10px] capitalize font-medium">{paymentMethodLabels[txn.paymentMethod || ""] || txn.paymentMethod || "—"}</Badge></TableCell>
                            <TableCell className="text-right" data-testid={`text-res-amount-${txn.id}`}>
                              <span className="font-semibold text-green-700 dark:text-green-300">+Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</span>
                            </TableCell>
                            <TableCell className="text-right hidden lg:table-cell">
                              <span className={`text-sm font-medium ${res && Number(res.walletBalance || 0) < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>Rs. {res ? Number(res.walletBalance || 0).toLocaleString() : "—"}</span>
                            </TableCell>
                            <TableCell className="text-right hidden xl:table-cell">
                              <span className="text-xs text-muted-foreground">Rs. {res ? Number(res.creditLimit || 0).toLocaleString() : "—"}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${sc.color}`} data-testid={`badge-res-status-${txn.id}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />{sc.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell"><span className="text-xs text-muted-foreground">{txn.createdBy || "—"}</span></TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-res-actions-${txn.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setResDetailTxn(txn)} data-testid={`button-view-res-${txn.id}`}><Eye className="h-4 w-4 mr-2" />View Detail</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => printVoucher(txn)} data-testid={`button-print-res-${txn.id}`}><Printer className="h-4 w-4 mr-2" />Print Receipt</DropdownMenuItem>
                                  {txn.status === "completed" && (
                                    <><DropdownMenuSeparator /><DropdownMenuItem className="text-amber-600" onClick={() => reverseMutation.mutate(txn.id)}><RotateCcw className="h-4 w-4 mr-2" />Reverse Entry</DropdownMenuItem></>
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
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Showing {Math.min((resPage - 1) * PAGE_SIZE + 1, filteredResCollections.length)}–{Math.min(resPage * PAGE_SIZE, filteredResCollections.length)} of {filteredResCollections.length} reseller collections</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" disabled={resPage <= 1} onClick={() => setResPage(p => p - 1)} data-testid="button-res-prev-page"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium px-3">Page {resPage} of {resTotalPages}</span>
              <Button variant="outline" size="icon" disabled={resPage >= resTotalPages} onClick={() => setResPage(p => p + 1)} data-testid="button-res-next-page"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Handshake className="h-4 w-4 text-muted-foreground" />Reseller Wallet & Credit Portfolio</CardTitle><CardDescription className="text-xs">All resellers with wallet balance, credit exposure & performance</CardDescription></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 dark:bg-slate-800">
                      <TableHead className="text-xs font-semibold">Reseller</TableHead>
                      <TableHead className="text-xs font-semibold">Type</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Wallet Balance</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Credit Limit</TableHead>
                      <TableHead className="text-xs font-semibold text-right hidden md:table-cell">Commission %</TableHead>
                      <TableHead className="text-xs font-semibold hidden lg:table-cell">Territory</TableHead>
                      <TableHead className="text-xs font-semibold hidden lg:table-cell text-right">Customers</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resellers.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No resellers found</TableCell></TableRow>
                    ) : resellers.map(res => {
                      const ws = getResellerStatus(res);
                      const wsc = resStatusColorMap[ws] || resStatusColorMap.active;
                      const walletBal = Number(res.walletBalance || 0);
                      return (
                        <TableRow key={res.id} data-testid={`row-res-portfolio-${res.id}`}>
                          <TableCell>
                            <button className="text-left" onClick={() => setResDetailReseller(res)}>
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 underline-offset-2 underline decoration-dotted" data-testid={`text-res-portfolio-name-${res.id}`}>{res.name}</span>
                              <p className="text-[10px] text-muted-foreground">{res.contactName || "—"} — {res.phone}</p>
                            </button>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="no-default-active-elevate text-[10px] font-medium capitalize">{(res.resellerType || "").replace(/_/g, " ")}</Badge></TableCell>
                          <TableCell className="text-right">
                            <span className={`font-semibold ${walletBal < 0 ? "text-red-600 dark:text-red-400" : walletBal < 1000 ? "text-yellow-600 dark:text-yellow-400" : "text-green-700 dark:text-green-300"}`}>Rs. {walletBal.toLocaleString()}</span>
                          </TableCell>
                          <TableCell className="text-right text-xs">Rs. {Number(res.creditLimit || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs font-medium hidden md:table-cell">{res.commissionRate || "0"}%</TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{res.territory || res.area || "—"}</TableCell>
                          <TableCell className="text-right text-xs font-medium hidden lg:table-cell">{res.totalCustomers || 0}</TableCell>
                          <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${wsc.color}`}>{wsc.label}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== REFUND & CREDIT TAB ===== */}
      {activeTab === "refund" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
            {[
              { label: "Total Refunds", value: `Rs. ${refundKpis.totalRefundsMonth.toLocaleString()}`, sub: "This month", icon: RotateCcw, gradient: "from-[#7F1D1D] to-[#1D4ED8]" },
              { label: "Credits Issued", value: `Rs. ${refundKpis.totalCreditsMonth.toLocaleString()}`, sub: "This month", icon: CreditCard, gradient: "from-blue-600 to-blue-500" },
              { label: "Pending Requests", value: refundKpis.pending, sub: "Awaiting approval", icon: Clock, gradient: "from-yellow-600 to-yellow-500" },
              { label: "Approved", value: refundKpis.approved, sub: "All time", icon: CheckCircle, gradient: "from-green-600 to-green-500" },
              { label: "Rejected", value: refundKpis.rejected, sub: "All time", icon: XCircle, gradient: "from-red-600 to-red-500" },
              { label: "Net Adjustment", value: `Rs. ${refundKpis.netAdjustment.toLocaleString()}`, sub: "Revenue impact", icon: TrendingDown, gradient: "from-amber-600 to-amber-500" },
              { label: "Refund Ratio", value: `${refundKpis.refundRatio}%`, sub: "Of total revenue", icon: Scale, gradient: "from-slate-600 to-slate-500" },
            ].map((kpi) => (
              <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-md p-4 text-white shadow-sm`} data-testid={`card-ref-kpi-${kpi.label.toLowerCase().replace(/[\s%]+/g, "-")}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-white/50" />
                </div>
                <div className="text-lg font-bold leading-tight">{isLoading ? "—" : kpi.value}</div>
                <p className="text-[10px] text-white/60 mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Activity className="h-4 w-4 text-muted-foreground" />Monthly Refund & Credit Trend</CardTitle></CardHeader>
              <CardContent className="px-2 pb-3">
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={refundMonthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={55} />
                    <Tooltip formatter={(v: number) => `Rs. ${v.toLocaleString()}`} />
                    <RechartsArea type="monotone" dataKey="refunds" stroke="#dc2626" fill="#dc2626" fillOpacity={0.15} name="Refunds" />
                    <RechartsArea type="monotone" dataKey="credits" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Credits" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-amber-500" />Top Entities by Refund Amount</CardTitle></CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {topRefundEntities.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No refund data available</p>
                ) : topRefundEntities.map((entity, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-md border" data-testid={`row-top-refund-entity-${idx}`}>
                    <div>
                      <span className="text-xs font-medium">{entity.name}</span>
                      <p className="text-[10px] text-muted-foreground">{entity.count} refund{entity.count !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">Rs. {entity.total.toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm">
            <CardContent className="pt-3 pb-3 px-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by ID, entity, reason..." value={refSearch} onChange={(e) => { setRefSearch(e.target.value); setRefPage(1); }} className="pl-9" data-testid="input-search-refunds" />
                </div>
                <Select value={refTypeFilter} onValueChange={(v) => { setRefTypeFilter(v); setRefPage(1); }}>
                  <SelectTrigger className="w-[140px]" data-testid="select-ref-type"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="refund">Refund</SelectItem><SelectItem value="credit">Credit</SelectItem></SelectContent>
                </Select>
                <Select value={refStatusFilter} onValueChange={(v) => { setRefStatusFilter(v); setRefPage(1); }}>
                  <SelectTrigger className="w-[150px]" data-testid="select-ref-status"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="pending">Pending Approval</SelectItem><SelectItem value="completed">Approved</SelectItem><SelectItem value="failed">Rejected</SelectItem><SelectItem value="reversed">Reversed</SelectItem></SelectContent>
                </Select>
                <Select value={refEntityFilter} onValueChange={(v) => { setRefEntityFilter(v); setRefPage(1); }}>
                  <SelectTrigger className="w-[140px]" data-testid="select-ref-entity"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Entities</SelectItem><SelectItem value="customer">Customer</SelectItem><SelectItem value="cir_customer">CIR Customer</SelectItem><SelectItem value="corporate">Corporate</SelectItem><SelectItem value="reseller">Reseller</SelectItem></SelectContent>
                </Select>
                <div className="space-y-0 flex items-center gap-1.5 border-l pl-2 ml-1">
                  <Input type="date" value={refDateFrom} onChange={(e) => { setRefDateFrom(e.target.value); setRefPage(1); }} className="w-[130px] text-xs" data-testid="input-ref-date-from" />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input type="date" value={refDateTo} onChange={(e) => { setRefDateTo(e.target.value); setRefPage(1); }} className="w-[130px] text-xs" data-testid="input-ref-date-to" />
                </div>
                {hasRefFilters && <Button variant="ghost" size="sm" onClick={() => { setRefSearch(""); setRefTypeFilter("all"); setRefStatusFilter("all"); setRefEntityFilter("all"); setRefDateFrom(""); setRefDateTo(""); setRefPage(1); }} data-testid="button-clear-ref-filters"><X className="h-3.5 w-3.5 mr-1" />Reset</Button>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filteredRefunds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <RotateCcw className="h-14 w-14 mb-3 opacity-20" />
                  <p className="font-medium text-lg">No refunds or credits found</p>
                  <p className="text-sm mt-1">{hasRefFilters ? "Try adjusting your filters" : "Create your first refund or credit adjustment"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-[#7F1D1D] to-[#1D4ED8] border-0">
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Refund ID</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Date</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Type</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Entity</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden lg:table-cell">Invoice</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Category</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 text-right">Amount</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden xl:table-cell">Reason</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3">Status</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 hidden xl:table-cell">Approved By</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3 w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {refPaged.map((txn, idx) => {
                        const rs = refStatusMap[txn.status] || refStatusMap.pending;
                        const RSIcon = rs.icon;
                        const entityName = (txn as any).customerName || (txn as any).vendorName || "—";
                        const inv = txn.invoiceId ? invoices.find(i => i.id === txn.invoiceId) : null;
                        const catLabel = refundCategoryLabels[txn.category || ""] || txn.category || "—";
                        return (
                          <TableRow key={txn.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/40"} data-testid={`row-refund-${txn.id}`}>
                            <TableCell>
                              <button className="font-mono text-xs font-medium text-blue-600 dark:text-blue-400 underline-offset-2 underline decoration-dotted" onClick={() => setRefDetailTxn(txn)} data-testid={`text-ref-id-${txn.id}`}>{txn.txnId}</button>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{txn.date}</TableCell>
                            <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] capitalize font-medium ${txn.type === "refund" ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800" : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"}`}>{txn.type === "refund" ? "Refund" : "Credit"}</Badge></TableCell>
                            <TableCell>
                              <div>
                                <span className="text-sm font-medium" data-testid={`text-ref-entity-${txn.id}`}>{entityName}</span>
                                <p className="text-[10px] text-muted-foreground capitalize">{txn.costCenter || "customer"}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span className="text-xs text-muted-foreground">{inv ? `INV-${inv.invoiceNumber}` : "—"}</span>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="no-default-active-elevate text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800">{catLabel}</Badge></TableCell>
                            <TableCell className="text-right" data-testid={`text-ref-amount-${txn.id}`}>
                              <span className="font-semibold text-red-700 dark:text-red-300">-Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</span>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                              <span className="text-xs text-muted-foreground max-w-[150px] truncate block">{txn.description || "—"}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${rs.color}`} data-testid={`badge-ref-status-${txn.id}`}>
                                <RSIcon className="h-3 w-3 mr-1" />{rs.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell"><span className="text-xs text-muted-foreground">{txn.status === "completed" ? (txn.transactionRef || txn.createdBy || "Admin") : txn.status === "failed" ? (txn.transactionRef || "—") : "—"}</span></TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-ref-actions-${txn.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setRefDetailTxn(txn)} data-testid={`button-view-ref-${txn.id}`}><Eye className="h-4 w-4 mr-2" />View Detail</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => printVoucher(txn)} data-testid={`button-print-ref-${txn.id}`}><Printer className="h-4 w-4 mr-2" />Print Voucher</DropdownMenuItem>
                                  {txn.status === "pending" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-green-600" onClick={() => { updateMutation.mutate({ id: txn.id, data: { status: "completed", transactionRef: `Approved by Admin on ${today}` } }); }} data-testid={`button-approve-ref-${txn.id}`}><CheckCircle className="h-4 w-4 mr-2" />Approve</DropdownMenuItem>
                                      <DropdownMenuItem className="text-red-600" onClick={() => { updateMutation.mutate({ id: txn.id, data: { status: "failed", transactionRef: `Rejected by Admin on ${today}` } }); }} data-testid={`button-reject-ref-${txn.id}`}><XCircle className="h-4 w-4 mr-2" />Reject</DropdownMenuItem>
                                    </>
                                  )}
                                  {txn.status === "completed" && (
                                    <><DropdownMenuSeparator /><DropdownMenuItem className="text-amber-600" onClick={() => reverseMutation.mutate(txn.id)}><RotateCcw className="h-4 w-4 mr-2" />Reverse Entry</DropdownMenuItem></>
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
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Showing {Math.min((refPage - 1) * PAGE_SIZE + 1, filteredRefunds.length)}–{Math.min(refPage * PAGE_SIZE, filteredRefunds.length)} of {filteredRefunds.length} entries</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" disabled={refPage <= 1} onClick={() => setRefPage(p => p - 1)} data-testid="button-ref-prev-page"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium px-3">Page {refPage} of {refTotalPages}</span>
              <Button variant="outline" size="icon" disabled={refPage >= refTotalPages} onClick={() => setRefPage(p => p + 1)} data-testid="button-ref-next-page"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-muted-foreground" />Risk & Audit Monitoring</CardTitle><CardDescription className="text-xs">Fraud prevention and revenue protection indicators</CardDescription></CardHeader>
              <CardContent className="px-4 pb-3 space-y-3">
                {[
                  { label: "Refund Ratio", value: `${refundKpis.refundRatio}%`, threshold: Number(refundKpis.refundRatio) > 5, desc: "Percentage of revenue returned as refunds" },
                  { label: "Pending Queue", value: refundKpis.pending, threshold: refundKpis.pending > 10, desc: "Refund requests awaiting approval" },
                  { label: "Net Revenue Impact", value: `Rs. ${refundKpis.netAdjustment.toLocaleString()}`, threshold: refundKpis.netAdjustment > 100000, desc: "Total revenue adjustment this month" },
                  { label: "Rejection Rate", value: refundKpis.approved + refundKpis.rejected > 0 ? `${Math.round((refundKpis.rejected / (refundKpis.approved + refundKpis.rejected)) * 100)}%` : "0%", threshold: false, desc: "Percentage of refund requests rejected" },
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-md border ${item.threshold ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20" : ""}`} data-testid={`card-ref-risk-${idx}`}>
                    <div>
                      <div className="flex items-center gap-1.5">
                        {item.threshold && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <span className={`text-sm font-bold ${item.threshold ? "text-red-600 dark:text-red-400" : ""}`}>{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Lock className="h-4 w-4 text-muted-foreground" />Approval Workflow Status</CardTitle><CardDescription className="text-xs">Current approval queue and processing status</CardDescription></CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                {refundTxns.filter(t => t.status === "pending").length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-medium">No pending approvals</p>
                    <p className="text-xs mt-1">All refund requests have been processed</p>
                  </div>
                ) : refundTxns.filter(t => t.status === "pending").slice(0, 5).map((txn) => {
                  const entityName = (txn as any).customerName || (txn as any).vendorName || "Unknown";
                  return (
                    <div key={txn.id} className="flex items-center justify-between p-2.5 rounded-md border bg-yellow-50/30 dark:bg-yellow-950/10 border-yellow-200 dark:border-yellow-800" data-testid={`card-ref-pending-${txn.id}`}>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-yellow-600" />
                          <span className="text-xs font-medium">{txn.txnId}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{entityName} — {txn.date}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400">Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</span>
                        <div className="flex gap-1 mt-1">
                          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] text-green-600 border-green-300" onClick={() => updateMutation.mutate({ id: txn.id, data: { status: "completed", transactionRef: `Approved by Admin on ${today}` } })} data-testid={`button-quick-approve-${txn.id}`}><CheckCircle className="h-3 w-3 mr-0.5" />Approve</Button>
                          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] text-red-600 border-red-300" onClick={() => updateMutation.mutate({ id: txn.id, data: { status: "failed", transactionRef: `Rejected by Admin on ${today}` } })} data-testid={`button-quick-reject-${txn.id}`}><XCircle className="h-3 w-3 mr-0.5" />Reject</Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ===== TRANSFER ACCOUNT TAB ===== */}
      {activeTab === "transfer" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "Transfers Today", value: `Rs. ${xfrKpis.todayTotal.toLocaleString()}`, icon: Send, gradient: "from-[#0F766E] to-[#1D4ED8]" },
              { label: "Transfers This Month", value: `Rs. ${xfrKpis.monthTotal.toLocaleString()}`, icon: CalendarDays, gradient: "from-[#0E7490] to-[#2563EB]" },
              { label: "Cash Balance", value: `Rs. ${xfrKpis.cashBalance.toLocaleString()}`, icon: Banknote, gradient: "from-emerald-600 to-emerald-700" },
              { label: "Bank Balance", value: `Rs. ${xfrKpis.bankBalance.toLocaleString()}`, icon: Landmark, gradient: "from-blue-600 to-blue-700" },
              { label: "Inter-Branch Transfers", value: xfrKpis.interBranch, icon: Building2, gradient: "from-violet-600 to-violet-700" },
              { label: "Pending Transfers", value: xfrKpis.pending, icon: Clock, gradient: "from-amber-600 to-amber-700" },
            ].map(kpi => (
              <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-md p-4 text-white shadow-sm`} data-testid={`card-xfr-kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-white/60" />
                </div>
                <div className="text-xl font-bold">{isLoading ? "—" : kpi.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><BarChart3 className="h-4 w-4 text-teal-600" />Monthly Transfer Trend</CardTitle></CardHeader>
              <CardContent>
                {xfrMonthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={xfrMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => [`Rs. ${v.toLocaleString()}`, "Amount"]} />
                      <RechartsArea type="monotone" dataKey="amount" stroke="#0F766E" fill="#0F766E" fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">No transfer data available</div>
                )}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Activity className="h-4 w-4 text-blue-600" />Top 5 Most Used Accounts</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {xfrTopAccounts.length > 0 ? xfrTopAccounts.map((acc, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-900" data-testid={`card-xfr-top-acc-${i}`}>
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-gradient-to-br from-[#0F766E] to-[#1D4ED8] text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                      <div><p className="text-xs font-medium truncate max-w-[140px]">{acc.name}</p><p className="text-[10px] text-muted-foreground">{acc.count} transfers</p></div>
                    </div>
                    <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">Rs. {acc.total.toLocaleString()}</span>
                  </div>
                )) : <div className="text-sm text-muted-foreground text-center py-6">No transfer data</div>}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 w-full">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search transfers..." value={xfrSearch} onChange={(e) => { setXfrSearch(e.target.value); setXfrPage(1); }} className="pl-9" data-testid="input-search-transfers" />
              </div>
              <Select value={xfrTypeFilter} onValueChange={(v) => { setXfrTypeFilter(v); setXfrPage(1); }}>
                <SelectTrigger className="w-[150px]" data-testid="select-xfr-type"><Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(xfrTransferTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={xfrStatusFilter} onValueChange={(v) => { setXfrStatusFilter(v); setXfrPage(1); }}>
                <SelectTrigger className="w-[140px]" data-testid="select-xfr-status"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="reversed">Reversed</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent>
              </Select>
              <Select value={xfrAccountFilter} onValueChange={(v) => { setXfrAccountFilter(v); setXfrPage(1); }}>
                <SelectTrigger className="w-[160px]" data-testid="select-xfr-account"><SelectValue placeholder="All Accounts" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Accounts</SelectItem>{accountsList.filter(a => a.type === "asset").map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent>
              </Select>
              {xfrBranches.length > 0 && (
                <Select value={xfrBranchFilter} onValueChange={(v) => { setXfrBranchFilter(v); setXfrPage(1); }}>
                  <SelectTrigger className="w-[130px]" data-testid="select-xfr-branch"><SelectValue placeholder="All Branches" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Branches</SelectItem>{xfrBranches.map(b => <SelectItem key={b} value={b!}>{b}</SelectItem>)}</SelectContent>
                </Select>
              )}
              <Input type="date" value={xfrDateFrom} onChange={(e) => { setXfrDateFrom(e.target.value); setXfrPage(1); }} className="w-[130px]" data-testid="input-xfr-date-from" />
              <Input type="date" value={xfrDateTo} onChange={(e) => { setXfrDateTo(e.target.value); setXfrPage(1); }} className="w-[130px]" data-testid="input-xfr-date-to" />
              {hasXfrFilters && <Button variant="ghost" size="sm" onClick={() => { setXfrSearch(""); setXfrStatusFilter("all"); setXfrTypeFilter("all"); setXfrAccountFilter("all"); setXfrBranchFilter("all"); setXfrDateFrom(""); setXfrDateTo(""); setXfrPage(1); }} data-testid="button-clear-xfr-filters"><X className="h-3.5 w-3.5 mr-1" />Clear</Button>}
            </div>
          </div>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filteredTransfers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Send className="h-14 w-14 mb-3 opacity-20" /><p className="font-medium text-lg">No transfers found</p>
                  <p className="text-sm mt-1">{hasXfrFilters ? "Try adjusting your filters" : "Create your first account transfer"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-[#0F766E] to-[#1D4ED8] border-0">
                        {["Transfer ID", "Date", "From Account", "To Account", "Branch", "Transfer Type", "Amount", "Fee", "Status", "Created By", ""].map(h => (
                          <TableHead key={h} className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {xfrPagedData.map((txn, idx) => {
                        const fromAcc = accountsList.find(a => a.id === txn.creditAccountId);
                        const toAcc = accountsList.find(a => a.id === txn.debitAccountId);
                        const xs = xfrStatusMap[txn.status] || xfrStatusMap.completed;
                        const XSIcon = xs.icon;
                        return (
                          <TableRow key={txn.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/40"} data-testid={`row-xfr-${txn.id}`}>
                            <TableCell className="font-mono text-xs font-semibold text-teal-700 dark:text-teal-300" data-testid={`text-xfr-id-${txn.id}`}>{txn.txnId}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{txn.date ? new Date(txn.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <ArrowUpCircle className="h-3.5 w-3.5 text-red-500" />
                                <span className="text-xs font-medium truncate max-w-[120px]">{fromAcc ? `${fromAcc.code} — ${fromAcc.name}` : "—"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <ArrowDownCircle className="h-3.5 w-3.5 text-green-500" />
                                <span className="text-xs font-medium truncate max-w-[120px]">{toAcc ? `${toAcc.code} — ${toAcc.name}` : "—"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{txn.branch || "—"}</TableCell>
                            <TableCell><Badge variant="outline" className="no-default-active-elevate text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800">{xfrTransferTypeLabels[txn.category || ""] || txn.category || "—"}</Badge></TableCell>
                            <TableCell className="font-semibold text-sm" data-testid={`text-xfr-amount-${txn.id}`}>Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{Number(txn.tax || 0) > 0 ? `Rs. ${Number(txn.tax).toLocaleString()}` : "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${xs.color}`} data-testid={`badge-xfr-status-${txn.id}`}>
                                <XSIcon className="h-3 w-3 mr-1" />{xs.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{txn.createdBy || "Admin"}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-xfr-actions-${txn.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setXfrDetailTxn(txn)} data-testid={`button-view-xfr-${txn.id}`}><Eye className="h-4 w-4 mr-2" />View Detail</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => printVoucher(txn)} data-testid={`button-print-xfr-${txn.id}`}><Printer className="h-4 w-4 mr-2" />Print Voucher</DropdownMenuItem>
                                  {txn.status === "pending" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-green-600" onClick={() => updateMutation.mutate({ id: txn.id, data: { status: "completed", transactionRef: `Approved by Admin on ${today}` } })} data-testid={`button-approve-xfr-${txn.id}`}><CheckCircle className="h-4 w-4 mr-2" />Approve</DropdownMenuItem>
                                      <DropdownMenuItem className="text-red-600" onClick={() => updateMutation.mutate({ id: txn.id, data: { status: "failed", transactionRef: `Rejected by Admin on ${today}` } })} data-testid={`button-reject-xfr-${txn.id}`}><XCircle className="h-4 w-4 mr-2" />Reject</DropdownMenuItem>
                                    </>
                                  )}
                                  {txn.status === "completed" && (
                                    <><DropdownMenuSeparator /><DropdownMenuItem className="text-amber-600" onClick={() => reverseMutation.mutate(txn.id)} data-testid={`button-reverse-xfr-${txn.id}`}><RotateCcw className="h-4 w-4 mr-2" />Reverse Transfer</DropdownMenuItem></>
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
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Showing {filteredTransfers.length > 0 ? ((xfrPage - 1) * PAGE_SIZE + 1) : 0}–{Math.min(xfrPage * PAGE_SIZE, filteredTransfers.length)} of {filteredTransfers.length}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={xfrPage <= 1} onClick={() => setXfrPage(p => p - 1)} data-testid="button-xfr-prev"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-xs px-3 py-1.5 border rounded-md bg-white dark:bg-slate-950">{xfrPage} / {xfrTotalPages}</span>
              <Button variant="outline" size="sm" disabled={xfrPage >= xfrTotalPages} onClick={() => setXfrPage(p => p + 1)} data-testid="button-xfr-next"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-teal-600" />Approval & Audit Log</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-[280px] overflow-y-auto">
                {transferTxns.filter(t => t.transactionRef).length > 0 ? transferTxns.filter(t => t.transactionRef).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 10).map(txn => {
                  const xs = xfrStatusMap[txn.status] || xfrStatusMap.completed;
                  const XSIcon = xs.icon;
                  return (
                    <div key={txn.id} className="flex items-start gap-3 p-2.5 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800" data-testid={`card-xfr-audit-${txn.id}`}>
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center mt-0.5 ${txn.status === "completed" ? "bg-green-100 dark:bg-green-900" : txn.status === "reversed" ? "bg-blue-100 dark:bg-blue-900" : "bg-red-100 dark:bg-red-900"}`}>
                        <XSIcon className={`h-3.5 w-3.5 ${txn.status === "completed" ? "text-green-600" : txn.status === "reversed" ? "text-blue-600" : "text-red-600"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold font-mono text-teal-700 dark:text-teal-300">{txn.txnId}</span>
                          <span className="text-[10px] text-muted-foreground">{txn.createdAt ? new Date(txn.createdAt).toLocaleString() : "—"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{txn.transactionRef}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Amount: Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                }) : <div className="text-sm text-muted-foreground text-center py-8">No audit entries yet</div>}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Gauge className="h-4 w-4 text-blue-600" />Branch & Liquidity Monitoring</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-md bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-medium tracking-wider">Cash Position</p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300" data-testid="text-xfr-cash-pos">Rs. {xfrKpis.cashBalance.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800">
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-medium tracking-wider">Bank Liquidity</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300" data-testid="text-xfr-bank-liq">Rs. {xfrKpis.bankBalance.toLocaleString()}</p>
                  </div>
                </div>
                <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider mb-2">Transfer Volume by Branch</p>
                  {xfrBranches.length > 0 ? xfrBranches.map(branch => {
                    const branchTxns = transferTxns.filter(t => t.branch === branch && t.status !== "voided" && t.status !== "reversed");
                    const total = branchTxns.reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
                    return (
                      <div key={branch} className="flex items-center justify-between py-1.5 border-b border-dashed last:border-0" data-testid={`row-xfr-branch-${branch}`}>
                        <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs font-medium">{branch}</span></div>
                        <div className="text-right"><span className="text-xs font-semibold">Rs. {total.toLocaleString()}</span><span className="text-[10px] text-muted-foreground ml-2">({branchTxns.length} txns)</span></div>
                      </div>
                    );
                  }) : <p className="text-xs text-muted-foreground text-center py-3">No branch data available</p>}
                </div>
                {xfrKpis.pending > 0 && (
                  <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">{xfrKpis.pending} transfer(s) pending approval</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ===== WALLET & PREPAID TAB ===== */}
      {activeTab === "wallet" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "Total Wallet Balance", value: `Rs. ${walKpis.totalWalletBalance.toLocaleString()}`, icon: Wallet, gradient: "from-[#4338CA] to-[#06B6D4]" },
              { label: "Customer Wallets", value: `Rs. ${walKpis.customerWallet.toLocaleString()}`, icon: Users, gradient: "from-indigo-600 to-indigo-500" },
              { label: "Reseller Wallets", value: `Rs. ${walKpis.resellerWallet.toLocaleString()}`, icon: Handshake, gradient: "from-purple-600 to-purple-500" },
              { label: "Today's Top-Ups", value: `Rs. ${walKpis.todayTopups.toLocaleString()}`, icon: TrendingUp, gradient: "from-emerald-600 to-emerald-500" },
              { label: "Monthly Volume", value: `Rs. ${walKpis.monthVolume.toLocaleString()}`, icon: Activity, gradient: "from-cyan-600 to-cyan-500" },
              { label: "Pending Transactions", value: walKpis.pendingTxns, icon: Clock, gradient: "from-amber-600 to-amber-500" },
            ].map(kpi => (
              <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-md p-4 text-white shadow-sm`} data-testid={`card-wal-kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-white/60" />
                </div>
                <div className="text-xl font-bold">{isLoading ? "—" : kpi.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><BarChart3 className="h-4 w-4 text-indigo-600" />Monthly Wallet Activity</CardTitle></CardHeader>
              <CardContent>
                {walMonthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={walMonthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number, name: string) => [`Rs. ${v.toLocaleString()}`, name === "topup" ? "Top-Ups" : "Usage"]} />
                      <RechartsArea type="monotone" dataKey="topup" stroke="#4338CA" fill="#4338CA" fillOpacity={0.15} strokeWidth={2} name="topup" />
                      <RechartsArea type="monotone" dataKey="usage" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.1} strokeWidth={2} name="usage" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">No wallet activity data available</div>
                )}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Users className="h-4 w-4 text-indigo-600" />Top Wallet Holders</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-[220px] overflow-y-auto">
                {walTopCustomers.length > 0 ? walTopCustomers.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-900" data-testid={`card-wal-top-${i}`}>
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-gradient-to-br from-[#4338CA] to-[#06B6D4] text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                      <div><p className="text-xs font-medium truncate max-w-[120px]">{c.name}</p><p className="text-[10px] text-muted-foreground">{c.txnCount} transactions</p></div>
                    </div>
                    <span className={`text-xs font-semibold ${c.balance >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}>Rs. {c.balance.toLocaleString()}</span>
                  </div>
                )) : <div className="text-sm text-muted-foreground text-center py-6">No wallet holders found</div>}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 w-full">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search wallet transactions..." value={walSearch} onChange={(e) => { setWalSearch(e.target.value); setWalPage(1); }} className="pl-9" data-testid="input-search-wallet" />
              </div>
              <Select value={walTypeFilter} onValueChange={(v) => { setWalTypeFilter(v); setWalPage(1); }}>
                <SelectTrigger className="w-[160px]" data-testid="select-wal-type"><Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operations</SelectItem>
                  {Object.entries(walletOperationLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={walStatusFilter} onValueChange={(v) => { setWalStatusFilter(v); setWalPage(1); }}>
                <SelectTrigger className="w-[130px]" data-testid="select-wal-status"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="reversed">Reversed</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent>
              </Select>
              <Select value={walEntityFilter} onValueChange={(v) => { setWalEntityFilter(v); setWalPage(1); }}>
                <SelectTrigger className="w-[140px]" data-testid="select-wal-entity"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Entities</SelectItem><SelectItem value="customer">Customers</SelectItem><SelectItem value="vendor">Vendors</SelectItem><SelectItem value="reseller">Resellers</SelectItem></SelectContent>
              </Select>
              <Input type="date" value={walDateFrom} onChange={(e) => { setWalDateFrom(e.target.value); setWalPage(1); }} className="w-[130px]" data-testid="input-wal-date-from" />
              <Input type="date" value={walDateTo} onChange={(e) => { setWalDateTo(e.target.value); setWalPage(1); }} className="w-[130px]" data-testid="input-wal-date-to" />
              {hasWalFilters && <Button variant="ghost" size="sm" onClick={() => { setWalSearch(""); setWalTypeFilter("all"); setWalStatusFilter("all"); setWalEntityFilter("all"); setWalDateFrom(""); setWalDateTo(""); setWalPage(1); }} data-testid="button-clear-wal-filters"><X className="h-3.5 w-3.5 mr-1" />Clear</Button>}
            </div>
          </div>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filteredWalletTxns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Wallet className="h-14 w-14 mb-3 opacity-20" /><p className="font-medium text-lg">No wallet transactions found</p>
                  <p className="text-sm mt-1">{hasWalFilters ? "Try adjusting your filters" : "Record your first wallet transaction"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-[#4338CA] to-[#06B6D4] border-0">
                        {["Txn ID", "Date", "Entity", "Entity Type", "Operation", "Amount", "Method", "Balance After", "Status", "Reference", ""].map(h => (
                          <TableHead key={h} className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {walPagedData.map((txn, idx) => {
                        const cust = txn.customerId ? customers.find(c => c.id === txn.customerId) : null;
                        const vendor = txn.vendorId ? vendors.find(v => v.id === txn.vendorId) : null;
                        const entityName = cust?.fullName || vendor?.name || "—";
                        const entityType = cust ? "Customer" : vendor ? "Vendor" : txn.costCenter === "reseller" ? "Reseller" : "—";
                        const ws = walletStatusMap[txn.status] || walletStatusMap.completed;
                        const WSIcon = ws.icon;
                        const isCredit = txn.category === "wallet_topup" || txn.category === "prepaid_credit" || txn.category === "wallet_refund";
                        return (
                          <TableRow key={txn.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/40"} data-testid={`row-wal-${txn.id}`}>
                            <TableCell className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-300" data-testid={`text-wal-id-${txn.id}`}>{txn.txnId}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{txn.date ? new Date(txn.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {cust ? <Users className="h-3.5 w-3.5 text-indigo-500" /> : vendor ? <Store className="h-3.5 w-3.5 text-purple-500" /> : <Handshake className="h-3.5 w-3.5 text-violet-500" />}
                                <span className="text-xs font-medium truncate max-w-[140px]">{entityName}</span>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="no-default-active-elevate text-[10px] font-medium">{entityType}</Badge></TableCell>
                            <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${isCredit ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800"}`}>{walletOperationLabels[txn.category || ""] || txn.category || "—"}</Badge></TableCell>
                            <TableCell className={`font-semibold text-sm ${isCredit ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`} data-testid={`text-wal-amount-${txn.id}`}>{isCredit ? "+" : "−"} Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{paymentMethodLabels[txn.paymentMethod || ""] || txn.paymentMethod || "—"}</TableCell>
                            <TableCell className="text-xs font-medium">Rs. {Number(txn.discount || 0).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${ws.color}`} data-testid={`badge-wal-status-${txn.id}`}>
                                <WSIcon className="h-3 w-3 mr-1" />{ws.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground truncate max-w-[100px]">{txn.reference || "—"}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-wal-actions-${txn.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setWalDetailTxn(txn)} data-testid={`button-view-wal-${txn.id}`}><Eye className="h-4 w-4 mr-2" />View Detail</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => printVoucher(txn)} data-testid={`button-print-wal-${txn.id}`}><Printer className="h-4 w-4 mr-2" />Print Voucher</DropdownMenuItem>
                                  {txn.status === "pending" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-green-600" onClick={() => updateMutation.mutate({ id: txn.id, data: { status: "completed", transactionRef: `Approved by Admin on ${today}` } })} data-testid={`button-approve-wal-${txn.id}`}><CheckCircle className="h-4 w-4 mr-2" />Approve</DropdownMenuItem>
                                      <DropdownMenuItem className="text-red-600" onClick={() => updateMutation.mutate({ id: txn.id, data: { status: "failed", transactionRef: `Rejected by Admin on ${today}` } })} data-testid={`button-reject-wal-${txn.id}`}><XCircle className="h-4 w-4 mr-2" />Reject</DropdownMenuItem>
                                    </>
                                  )}
                                  {txn.status === "completed" && (
                                    <><DropdownMenuSeparator /><DropdownMenuItem className="text-amber-600" onClick={() => reverseMutation.mutate(txn.id)} data-testid={`button-reverse-wal-${txn.id}`}><RotateCcw className="h-4 w-4 mr-2" />Reverse</DropdownMenuItem></>
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
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Showing {filteredWalletTxns.length > 0 ? ((walPage - 1) * PAGE_SIZE + 1) : 0}–{Math.min(walPage * PAGE_SIZE, filteredWalletTxns.length)} of {filteredWalletTxns.length}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={walPage <= 1} onClick={() => setWalPage(p => p - 1)} data-testid="button-wal-prev"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-xs px-3 py-1.5 border rounded-md bg-white dark:bg-slate-950">{walPage} / {walTotalPages}</span>
              <Button variant="outline" size="sm" disabled={walPage >= walTotalPages} onClick={() => setWalPage(p => p + 1)} data-testid="button-wal-next"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-indigo-600" />Recent Wallet Activity Log</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-[280px] overflow-y-auto">
                {walletTxns.filter(t => t.status !== "voided").length > 0 ? walletTxns.filter(t => t.status !== "voided").sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 10).map(txn => {
                  const cust = txn.customerId ? customers.find(c => c.id === txn.customerId) : null;
                  const vendor = txn.vendorId ? vendors.find(v => v.id === txn.vendorId) : null;
                  const isCredit = txn.category === "wallet_topup" || txn.category === "prepaid_credit" || txn.category === "wallet_refund";
                  return (
                    <div key={txn.id} className="flex items-start gap-3 p-2.5 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800" data-testid={`card-wal-log-${txn.id}`}>
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center mt-0.5 ${isCredit ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
                        {isCredit ? <TrendingUp className="h-3.5 w-3.5 text-green-600" /> : <TrendingDown className="h-3.5 w-3.5 text-red-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold font-mono text-indigo-700 dark:text-indigo-300">{txn.txnId}</span>
                          <span className="text-[10px] text-muted-foreground">{txn.createdAt ? new Date(txn.createdAt).toLocaleString() : "—"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{walletOperationLabels[txn.category || ""] || txn.category} — {cust?.fullName || vendor?.name || "Unknown"}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{isCredit ? "+" : "−"} Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                }) : <div className="text-sm text-muted-foreground text-center py-8">No wallet activity yet</div>}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Gauge className="h-4 w-4 text-cyan-600" />Wallet Balance Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-md bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/40 dark:to-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-medium tracking-wider">Customer Wallets</p>
                    <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300" data-testid="text-wal-cust-total">Rs. {walKpis.customerWallet.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{customers.filter(c => Number((c as any).walletBalance || 0) > 0).length} active wallets</p>
                  </div>
                  <div className="p-3 rounded-md bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/30 border border-purple-200 dark:border-purple-800">
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-medium tracking-wider">Reseller Wallets</p>
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-300" data-testid="text-wal-res-total">Rs. {walKpis.resellerWallet.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{resellers.filter(r => Number(r.walletBalance || 0) > 0).length} active wallets</p>
                  </div>
                </div>
                <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider mb-2">Wallet Operations Breakdown</p>
                  {Object.entries(walletOperationLabels).map(([key, label]) => {
                    const count = walletTxns.filter(t => t.category === key && t.status !== "voided" && t.status !== "reversed").length;
                    const total = walletTxns.filter(t => t.category === key && t.status !== "voided" && t.status !== "reversed").reduce((s, t) => s + Math.abs(Number(t.netAmount || t.amount || 0)), 0);
                    return (
                      <div key={key} className="flex items-center justify-between py-1.5 border-b border-dashed last:border-0" data-testid={`row-wal-op-${key}`}>
                        <div className="flex items-center gap-2"><Wallet className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs font-medium">{label}</span></div>
                        <div className="text-right"><span className="text-xs font-semibold">Rs. {total.toLocaleString()}</span><span className="text-[10px] text-muted-foreground ml-2">({count})</span></div>
                      </div>
                    );
                  })}
                </div>
                {walKpis.pendingTxns > 0 && (
                  <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">{walKpis.pendingTxns} wallet transaction(s) pending approval</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ===== RECOVERY OFFICER AREA COLLECTION TAB ===== */}
      {activeTab === "recovery-officer" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            {[
              { label: "Total Collected", value: `Rs. ${rocKpis.totalCollected.toLocaleString()}`, sub: "All areas combined", icon: Banknote, gradient: "from-[#002B5B] to-[#0066FF]" },
              { label: "Today's Collection", value: `Rs. ${rocKpis.todayCollected.toLocaleString()}`, sub: "Collected today", icon: CalendarDays, gradient: "from-emerald-600 to-emerald-500" },
              { label: "Active Areas", value: rocKpis.totalAreas, sub: "With collections", icon: MapPin, gradient: "from-violet-600 to-violet-500" },
              { label: "Recovery Officers", value: rocKpis.totalOfficers, sub: "Active collectors", icon: UserCheck, gradient: "from-blue-600 to-blue-500" },
              { label: "Pending Approval", value: rocKpis.pendingApproval, sub: `Rs. ${rocKpis.pendingAmount.toLocaleString()}`, icon: Clock, gradient: rocKpis.pendingApproval > 0 ? "from-orange-600 to-orange-500" : "from-slate-600 to-slate-500" },
              { label: "Approved", value: rocKpis.approvedCount, sub: "Posted recoveries", icon: CheckCircle, gradient: "from-green-600 to-green-500" },
              { label: "Top Area", value: rocKpis.topAreaName, sub: `Rs. ${rocKpis.topAreaAmount.toLocaleString()}`, icon: Target, gradient: "from-amber-600 to-amber-500" },
              { label: "Avg / Area", value: `Rs. ${rocKpis.avgPerArea.toLocaleString()}`, sub: "Average collection", icon: TrendingUp, gradient: "from-teal-600 to-teal-500" },
            ].map((kpi) => (
              <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-md p-4 text-white shadow-sm`} data-testid={`card-roc-kpi-${kpi.label.toLowerCase().replace(/[\s/%]+/g, "-")}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-white/50" />
                </div>
                <div className="text-lg font-bold leading-tight">{isLoading ? "—" : kpi.value}</div>
                <p className="text-[10px] text-white/60 mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>

          <Card className="border shadow-sm">
            <CardContent className="pt-3 pb-3 px-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by area name..." value={rocSearch} onChange={(e) => { setRocSearch(e.target.value); setRocPage(1); }} className="pl-9" data-testid="input-search-roc" />
                </div>
                <Select value={rocAreaFilter} onValueChange={(v) => { setRocAreaFilter(v); setRocPage(1); }}>
                  <SelectTrigger className="w-[160px]" data-testid="select-roc-area"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Areas</SelectItem>{rocAreaData.map(a => <SelectItem key={a.area} value={a.area}>{a.area}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={rocOfficerFilter} onValueChange={(v) => { setRocOfficerFilter(v); setRocPage(1); }}>
                  <SelectTrigger className="w-[160px]" data-testid="select-roc-officer"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Officers</SelectItem>{employees.filter(e => e.status === "active").map(e => <SelectItem key={e.id} value={e.fullName}>{e.fullName}</SelectItem>)}<SelectItem value="admin">Admin</SelectItem></SelectContent>
                </Select>
                {rocViewMode === "detail" && rocExpandedArea && (
                  <>
                    <Select value={rocMethodFilter} onValueChange={(v) => { setRocMethodFilter(v); setRocPage(1); }}>
                      <SelectTrigger className="w-[130px]" data-testid="select-roc-method"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Methods</SelectItem><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="online">Online</SelectItem><SelectItem value="jazzcash">JazzCash</SelectItem><SelectItem value="easypaisa">EasyPaisa</SelectItem></SelectContent>
                    </Select>
                    <Select value={rocStatusFilter} onValueChange={(v) => { setRocStatusFilter(v); setRocPage(1); }}>
                      <SelectTrigger className="w-[130px]" data-testid="select-roc-status"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="completed">Posted</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="reversed">Reversed</SelectItem></SelectContent>
                    </Select>
                    <div className="flex items-center gap-1.5 border-l pl-2 ml-1">
                      <Input type="date" value={rocDateFrom} onChange={(e) => { setRocDateFrom(e.target.value); setRocPage(1); }} className="w-[130px] text-xs" data-testid="input-roc-date-from" />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input type="date" value={rocDateTo} onChange={(e) => { setRocDateTo(e.target.value); setRocPage(1); }} className="w-[130px] text-xs" data-testid="input-roc-date-to" />
                    </div>
                  </>
                )}
                {(rocSearch || rocAreaFilter !== "all" || rocOfficerFilter !== "all" || rocMethodFilter !== "all" || rocStatusFilter !== "all" || rocDateFrom || rocDateTo) && (
                  <Button variant="ghost" size="sm" onClick={() => { setRocSearch(""); setRocAreaFilter("all"); setRocOfficerFilter("all"); setRocMethodFilter("all"); setRocStatusFilter("all"); setRocDateFrom(""); setRocDateTo(""); setRocPage(1); setRocExpandedArea(null); }} data-testid="button-clear-roc-filters"><X className="h-3.5 w-3.5 mr-1" />Reset</Button>
                )}
              </div>
            </CardContent>
          </Card>

          {rocRecoveryTxns.length > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-blue-600" />
                  Recovery Transactions
                  {rocKpis.pendingApproval > 0 && <Badge variant="destructive" className="text-[10px] ml-1">{rocKpis.pendingApproval} Pending</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 hover:bg-amber-50">
                      <TableHead className="text-xs font-semibold">Recovery ID</TableHead>
                      <TableHead className="text-xs font-semibold">Date</TableHead>
                      <TableHead className="text-xs font-semibold">Customer</TableHead>
                      <TableHead className="text-xs font-semibold">Area</TableHead>
                      <TableHead className="text-xs font-semibold">Recovery Officer</TableHead>
                      <TableHead className="text-xs font-semibold">Received By</TableHead>
                      <TableHead className="text-xs font-semibold">Transfer Account</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rocRecoveryTxns.map((txn) => {
                      const cust = txn.customerId ? customers.find(c => c.id === txn.customerId) : null;
                      const st = statusColors[txn.status] || statusColors.completed;
                      const descParts = (txn.description || "").split(" | ");
                      const receivedBy = descParts.find(p => p.startsWith("Received by:"))?.replace("Received by: ", "") || "—";
                      const transferAcct = txn.debitAccountId ? accountsList.find(a => a.id === txn.debitAccountId) : null;
                      return (
                        <TableRow key={txn.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900 ${txn.status === "pending" ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}`} data-testid={`row-roc-recovery-${txn.id}`}>
                          <TableCell className="text-xs font-mono font-semibold text-blue-600">{txn.txnId}</TableCell>
                          <TableCell className="text-xs">{txn.date}</TableCell>
                          <TableCell className="text-xs font-medium">{cust?.fullName || (txn as any).customerName || "—"}</TableCell>
                          <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]"><MapPin className="h-3 w-3 mr-0.5" />{cust?.zone || "—"}</Badge></TableCell>
                          <TableCell className="text-xs"><Badge variant="secondary" className="text-[10px]"><UserCheck className="h-3 w-3 mr-0.5" />{txn.createdBy || "—"}</Badge></TableCell>
                          <TableCell className="text-xs font-medium">{receivedBy}</TableCell>
                          <TableCell className="text-xs">{transferAcct ? <Badge variant="outline" className="text-[10px]"><Landmark className="h-3 w-3 mr-0.5" />{transferAcct.name}</Badge> : "—"}</TableCell>
                          <TableCell className="text-xs font-semibold text-right text-green-600">Rs. {Number(txn.netAmount || txn.amount || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-xs"><Badge variant="outline" className={`text-[10px] ${st.color}`}><st.icon className="h-3 w-3 mr-0.5" />{st.label}</Badge></TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRocDetailTxn(txn)} data-testid={`button-roc-rec-view-${txn.id}`}><Eye className="h-3.5 w-3.5" /></Button>
                              {txn.status === "pending" && (
                                <>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => { setRocApproveDialogTxn(txn); setRocApproveAction("approve"); }} data-testid={`button-roc-approve-${txn.id}`}><CheckCircle className="h-3.5 w-3.5" /></Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { setRocApproveDialogTxn(txn); setRocApproveAction("reject"); }} data-testid={`button-roc-reject-${txn.id}`}><XCircle className="h-3.5 w-3.5" /></Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {rocViewMode === "summary" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {isLoading ? (
                [1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48 w-full rounded-lg" />)
              ) : rocFilteredData.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <MapPin className="h-14 w-14 mb-3 opacity-20" />
                  <p className="text-sm font-medium">No area collection data found</p>
                  <p className="text-xs mt-1">Adjust filters or record collections with area-assigned customers</p>
                </div>
              ) : rocFilteredData.map((area) => {
                const topMethod = Object.entries(area.methods).sort(([,a],[,b]) => b - a)[0];
                const totalAll = rocKpis.totalCollected || 1;
                const pct = Math.round((area.totalCollected / totalAll) * 100);
                return (
                  <Card key={area.area} className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setRocViewMode("detail"); setRocExpandedArea(area.area); setRocPage(1); }} data-testid={`card-roc-area-${area.area.toLowerCase().replace(/\s+/g, "-")}`}>
                    <CardHeader className="pb-2 pt-3 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          {area.area}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px]">{pct}% share</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-green-600">Rs. {area.totalCollected.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900 rounded">
                          <CalendarDays className="h-3.5 w-3.5 text-emerald-500" />
                          <div><p className="text-muted-foreground">Today</p><p className="font-semibold">Rs. {area.todayCollected.toLocaleString()}</p></div>
                        </div>
                        <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900 rounded">
                          <Receipt className="h-3.5 w-3.5 text-blue-500" />
                          <div><p className="text-muted-foreground">Transactions</p><p className="font-semibold">{area.txnCount}</p></div>
                        </div>
                        <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900 rounded">
                          <Users className="h-3.5 w-3.5 text-violet-500" />
                          <div><p className="text-muted-foreground">Customers</p><p className="font-semibold">{area.customerCount}</p></div>
                        </div>
                        <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-900 rounded">
                          <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                          <div><p className="text-muted-foreground">Avg</p><p className="font-semibold">Rs. {area.avgCollection.toLocaleString()}</p></div>
                        </div>
                      </div>
                      <div className="pt-2 border-t space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <UserCheck className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Officers:</span>
                          <span className="font-medium">{area.officers.join(", ") || "—"}</span>
                        </div>
                        {topMethod && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <CreditCard className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Top Method:</span>
                            <span className="font-medium">{paymentMethodLabels[topMethod[0]] || topMethod[0]} (Rs. {topMethod[1].toLocaleString()})</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {rocViewMode === "detail" && (
            <div className="space-y-4">
              {rocExpandedArea ? (
                <>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setRocExpandedArea(null); setRocViewMode("summary"); setRocMethodFilter("all"); setRocStatusFilter("all"); setRocDateFrom(""); setRocDateTo(""); }} data-testid="button-roc-back">
                      <ChevronLeft className="h-4 w-4 mr-1" />Back to Summary
                    </Button>
                    <Badge variant="secondary" className="flex items-center gap-1"><MapPin className="h-3 w-3" />{rocExpandedArea}</Badge>
                    <span className="text-sm text-muted-foreground">{rocDetailTransactions.length} transactions</span>
                  </div>

                  <Card className="border-0 shadow-md overflow-hidden">
                    <CardContent className="p-0">
                      {rocDetailTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                          <Receipt className="h-14 w-14 mb-3 opacity-20" />
                          <p className="text-sm font-medium">No transactions found for this area</p>
                          <p className="text-xs mt-1">Try adjusting the filters</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-[#002B5B] hover:bg-[#002B5B]">
                              <TableHead className="text-white text-xs font-semibold">Txn ID</TableHead>
                              <TableHead className="text-white text-xs font-semibold">Date</TableHead>
                              <TableHead className="text-white text-xs font-semibold">Customer</TableHead>
                              <TableHead className="text-white text-xs font-semibold">Officer</TableHead>
                              <TableHead className="text-white text-xs font-semibold">Method</TableHead>
                              <TableHead className="text-white text-xs font-semibold text-right">Amount</TableHead>
                              <TableHead className="text-white text-xs font-semibold">Status</TableHead>
                              <TableHead className="text-white text-xs font-semibold text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rocDetailPaged.map((txn) => {
                              const cust = txn.customerId ? customers.find(c => c.id === txn.customerId) : null;
                              const st = statusColors[txn.status] || statusColors.completed;
                              return (
                                <TableRow key={txn.id} className="hover:bg-slate-50 dark:hover:bg-slate-900" data-testid={`row-roc-txn-${txn.id}`}>
                                  <TableCell className="text-xs font-mono font-semibold text-blue-600">{txn.txnId}</TableCell>
                                  <TableCell className="text-xs">{txn.date}</TableCell>
                                  <TableCell className="text-xs">{cust?.fullName || (txn as any).customerName || "—"}</TableCell>
                                  <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]"><UserCheck className="h-3 w-3 mr-1" />{txn.createdBy || "—"}</Badge></TableCell>
                                  <TableCell className="text-xs"><Badge variant="secondary" className="text-[10px]">{paymentMethodLabels[txn.paymentMethod || "cash"] || txn.paymentMethod}</Badge></TableCell>
                                  <TableCell className="text-xs font-semibold text-right text-green-600">Rs. {Number(txn.netAmount || txn.amount || 0).toLocaleString()}</TableCell>
                                  <TableCell className="text-xs"><Badge variant="outline" className={`text-[10px] ${st.color}`}><st.icon className="h-3 w-3 mr-0.5" />{st.label}</Badge></TableCell>
                                  <TableCell className="text-center">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-roc-actions-${txn.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuItem onClick={() => setRocDetailTxn(txn)} data-testid={`menu-roc-view-${txn.id}`}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => window.print()} data-testid={`menu-roc-print-${txn.id}`}><Printer className="h-4 w-4 mr-2" />Print Receipt</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(txn.txnId); toast({ title: "Copied", description: "Transaction ID copied" }); }} data-testid={`menu-roc-copy-${txn.id}`}><Copy className="h-4 w-4 mr-2" />Copy Txn ID</DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>

                  {rocDetailPages > 1 && (
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs text-muted-foreground">Page {rocPage} of {rocDetailPages} ({rocDetailTransactions.length} transactions)</span>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => setRocPage(p => Math.max(1, p - 1))} disabled={rocPage <= 1} data-testid="button-roc-prev"><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" onClick={() => setRocPage(p => Math.min(rocDetailPages, p + 1))} disabled={rocPage >= rocDetailPages} data-testid="button-roc-next"><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Card className="border-0 shadow-md overflow-hidden">
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
                    ) : rocFilteredData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <MapPin className="h-14 w-14 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No area collection data found</p>
                        <p className="text-xs mt-1">Select an area to view detailed transactions</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-[#002B5B] hover:bg-[#002B5B]">
                            <TableHead className="text-white text-xs font-semibold">Area / Zone</TableHead>
                            <TableHead className="text-white text-xs font-semibold">Officers</TableHead>
                            <TableHead className="text-white text-xs font-semibold text-center">Transactions</TableHead>
                            <TableHead className="text-white text-xs font-semibold text-center">Customers</TableHead>
                            <TableHead className="text-white text-xs font-semibold text-right">Total Collected</TableHead>
                            <TableHead className="text-white text-xs font-semibold text-right">Today</TableHead>
                            <TableHead className="text-white text-xs font-semibold text-right">Avg / Txn</TableHead>
                            <TableHead className="text-white text-xs font-semibold text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rocFilteredData.map((area) => (
                            <TableRow key={area.area} className="hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer" onClick={() => { setRocExpandedArea(area.area); setRocPage(1); }} data-testid={`row-roc-area-${area.area.toLowerCase().replace(/\s+/g, "-")}`}>
                              <TableCell className="text-xs font-semibold"><div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-blue-600" />{area.area}</div></TableCell>
                              <TableCell className="text-xs">{area.officers.map(o => <Badge key={o} variant="outline" className="text-[10px] mr-1"><UserCheck className="h-3 w-3 mr-0.5" />{o}</Badge>)}</TableCell>
                              <TableCell className="text-xs text-center font-medium">{area.txnCount}</TableCell>
                              <TableCell className="text-xs text-center font-medium">{area.customerCount}</TableCell>
                              <TableCell className="text-xs text-right font-semibold text-green-600">Rs. {area.totalCollected.toLocaleString()}</TableCell>
                              <TableCell className="text-xs text-right font-medium text-emerald-600">Rs. {area.todayCollected.toLocaleString()}</TableCell>
                              <TableCell className="text-xs text-right text-muted-foreground">Rs. {area.avgCollection.toLocaleString()}</TableCell>
                              <TableCell className="text-center">
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setRocExpandedArea(area.area); setRocPage(1); }} data-testid={`button-roc-expand-${area.area.toLowerCase().replace(/\s+/g, "-")}`}><Eye className="h-3.5 w-3.5 mr-1" />View</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== ROC DETAIL DIALOG ===== */}
      <Dialog open={!!rocDetailTxn} onOpenChange={(open) => { if (!open) setRocDetailTxn(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {rocDetailTxn && (() => {
            const txn = rocDetailTxn;
            const cust = txn.customerId ? customers.find(c => c.id === txn.customerId) : null;
            const st = statusColors[txn.status] || statusColors.completed;
            const descParts = (txn.description || "").split(" | ");
            const receivedBy = descParts.find(p => p.startsWith("Received by:"))?.replace("Received by: ", "") || "—";
            const transferAcct = txn.debitAccountId ? accountsList.find(a => a.id === txn.debitAccountId) : null;
            const isRecovery = txn.category === "recovery_collection";
            return (
              <>
                <DialogHeader><DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-blue-600" />{isRecovery ? "Recovery Detail" : "Collection Detail"} — {txn.txnId}</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md"><p className="text-[10px] text-muted-foreground uppercase">Transaction ID</p><p className="text-sm font-mono font-semibold">{txn.txnId}</p></div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md"><p className="text-[10px] text-muted-foreground uppercase">Date</p><p className="text-sm font-semibold">{txn.date}</p></div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md"><p className="text-[10px] text-muted-foreground uppercase">Customer</p><p className="text-sm font-semibold">{cust?.fullName || (txn as any).customerName || "—"}</p></div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md"><p className="text-[10px] text-muted-foreground uppercase">Area / Zone</p><p className="text-sm font-semibold">{cust?.zone || "—"}</p></div>
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md"><p className="text-[10px] text-muted-foreground uppercase">Amount</p><p className="text-lg font-bold text-green-600">Rs. {Number(txn.netAmount || txn.amount || 0).toLocaleString()}</p></div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md"><p className="text-[10px] text-muted-foreground uppercase">Status</p><Badge variant="outline" className={`mt-1 ${st.color}`}><st.icon className="h-3 w-3 mr-0.5" />{st.label}</Badge></div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md"><p className="text-[10px] text-muted-foreground uppercase">Payment Method</p><p className="text-sm font-semibold">{paymentMethodLabels[txn.paymentMethod || "cash"] || txn.paymentMethod}</p></div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md"><p className="text-[10px] text-muted-foreground uppercase">Recovery Officer</p><p className="text-sm font-semibold">{txn.createdBy || "—"}</p></div>
                  </div>
                  {isRecovery && (
                    <div className="space-y-1 pt-2 border-t">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Landmark className="h-3.5 w-3.5" />Recovery & Transfer Details</h4>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800"><p className="text-[10px] text-muted-foreground uppercase">Received By</p><p className="text-sm font-semibold">{receivedBy}</p></div>
                        <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-md border border-violet-200 dark:border-violet-800"><p className="text-[10px] text-muted-foreground uppercase">Transfer Account</p><p className="text-sm font-semibold">{transferAcct ? `${transferAcct.code} — ${transferAcct.name}` : "—"}</p></div>
                      </div>
                      {txn.creditAccountId && (() => {
                        const creditAcct = accountsList.find(a => a.id === txn.creditAccountId);
                        return creditAcct ? (
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md"><p className="text-[10px] text-muted-foreground uppercase">Credit Account (AR)</p><p className="text-sm font-semibold">{creditAcct.code} — {creditAcct.name}</p></div>
                        ) : null;
                      })()}
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800">
                        <p className="text-[10px] text-muted-foreground uppercase">Approval Required</p>
                        <p className="text-sm font-semibold">{txn.requireApproval ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  )}
                  {(txn.reference || txn.chequeNumber || txn.transactionRef) && (
                    <div className="space-y-2 pt-2 border-t">
                      {txn.reference && <DRow label="Reference" value={txn.reference} />}
                      {txn.chequeNumber && <DRow label="Cheque #" value={txn.chequeNumber} />}
                      {txn.transactionRef && <DRow label="Transaction Ref" value={txn.transactionRef} />}
                    </div>
                  )}
                  {txn.description && (
                    <div className="pt-2 border-t"><p className="text-xs text-muted-foreground mb-1">Notes</p><p className="text-sm">{txn.description}</p></div>
                  )}
                  {isRecovery && txn.status === "pending" && (
                    <div className="pt-2 border-t flex gap-2">
                      <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => { setRocDetailTxn(null); setRocApproveDialogTxn(txn); setRocApproveAction("approve"); }} data-testid="button-roc-detail-approve"><CheckCircle className="h-4 w-4 mr-1" />Approve Recovery</Button>
                      <Button variant="destructive" className="flex-1" onClick={() => { setRocDetailTxn(null); setRocApproveDialogTxn(txn); setRocApproveAction("reject"); }} data-testid="button-roc-detail-reject"><XCircle className="h-4 w-4 mr-1" />Reject</Button>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== ROC RECOVER PAYMENT FORM ===== */}
      <Dialog open={rocRecoverFormOpen} onOpenChange={setRocRecoverFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-r from-emerald-600 to-green-500 flex items-center justify-center"><Banknote className="h-4 w-4 text-white" /></div>
              Recover Payment from Recovery Officer
            </DialogTitle>
          </DialogHeader>
          <Form {...rocForm}>
            <form onSubmit={rocForm.handleSubmit(onRocSubmit)} className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5" />Section A — Recovery Officer & Customer</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={rocForm.control} name="createdBy" render={({ field }) => <FormItem><FormLabel>Recovery Officer *</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger data-testid="select-roc-officer-form"><SelectValue placeholder="Select officer who collected" /></SelectTrigger></FormControl><SelectContent>{employees.filter(e => e.status === "active").map(e => <SelectItem key={e.id} value={e.fullName}>{e.fullName} — {e.designation}</SelectItem>)}<SelectItem value="admin">Admin</SelectItem></SelectContent></Select></FormItem>} />
                    <FormField control={rocForm.control} name="customerId" render={({ field }) => <FormItem><FormLabel>Customer *</FormLabel><Select onValueChange={(v) => { field.onChange(v === "none" ? null : parseInt(v)); rocForm.setValue("invoiceId", null); }} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-roc-customer-form"><SelectValue placeholder="Select customer" /></SelectTrigger></FormControl><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.fullName} ({c.zone || "No Zone"})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                  </div>
                  {rocSelectedCustomer && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Outstanding</p>
                        <p className="text-lg font-bold text-red-600" data-testid="text-roc-outstanding">Rs. {rocCustOutstanding.toLocaleString()}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Area / Zone</p>
                        <p className="text-sm font-semibold">{customers.find(c => c.id === rocSelectedCustomer)?.zone || "Unassigned"}</p>
                      </div>
                      {rocSelectedInvData && (
                        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-md p-3">
                          <p className="text-[10px] text-muted-foreground uppercase">Invoice Balance</p>
                          <p className="text-sm font-bold text-indigo-600">Rs. {Number(rocSelectedInvData.totalAmount).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <FormField control={rocForm.control} name="invoiceId" render={({ field }) => <FormItem><FormLabel>Against Invoice (Optional)</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-roc-invoice-form"><SelectValue placeholder="Auto-suggest unpaid" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">— None (general payment) —</SelectItem>{rocCustUnpaidInvoices.map(inv => <SelectItem key={inv.id} value={inv.id.toString()}>{inv.invoiceNumber} — Rs. {Number(inv.totalAmount).toLocaleString()} ({inv.status})</SelectItem>)}</SelectContent></Select></FormItem>} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Banknote className="h-3.5 w-3.5" />Section B — Cash Recovery Details</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={rocForm.control} name="date" render={({ field }) => <FormItem><FormLabel>Collection Date *</FormLabel><FormControl><Input type="date" data-testid="input-roc-date" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={rocForm.control} name="paymentMethod" render={({ field }) => <FormItem><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} value={field.value || "cash"}><FormControl><SelectTrigger data-testid="select-roc-method-form"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="online">Online</SelectItem><SelectItem value="jazzcash">JazzCash</SelectItem><SelectItem value="easypaisa">EasyPaisa</SelectItem></SelectContent></Select></FormItem>} />
                    <FormField control={rocForm.control} name="amount" render={({ field }) => <FormItem><FormLabel>Amount Recovered (Rs.) *</FormLabel><FormControl><Input type="number" step="0.01" data-testid="input-roc-amount" {...field} /></FormControl><FormMessage /></FormItem>} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={rocForm.control} name="reference" render={({ field }) => <FormItem><FormLabel>Receipt / Reference No.</FormLabel><FormControl><Input placeholder="Receipt # or Ref #" data-testid="input-roc-reference" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <FormField control={rocForm.control} name="chequeNumber" render={({ field }) => <FormItem><FormLabel>Cheque Number</FormLabel><FormControl><Input placeholder="If cheque payment" data-testid="input-roc-cheque" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-md border border-green-200 dark:border-green-800">
                    <p className="text-xs text-muted-foreground">Net Recovery Amount</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-300" data-testid="text-roc-net">Rs. {Number(rocForm.watch("amount") || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Section C — Received By & Transfer Account</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={rocForm.control} name="costCenter" render={({ field }) => <FormItem><FormLabel>Received By (Who took cash from officer) *</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger data-testid="select-roc-received-by"><SelectValue placeholder="Who received the payment" /></SelectTrigger></FormControl><SelectContent>{employees.filter(e => e.status === "active").map(e => <SelectItem key={e.id} value={e.fullName}>{e.fullName} — {e.designation}</SelectItem>)}<SelectItem value="admin">Admin</SelectItem></SelectContent></Select></FormItem>} />
                    <FormField control={rocForm.control} name="branch" render={({ field }) => <FormItem><FormLabel>Branch / Office</FormLabel><FormControl><Input placeholder="Head Office" data-testid="input-roc-branch" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={rocForm.control} name="debitAccountId" render={({ field }) => <FormItem><FormLabel>Transfer To Account (Debit) *</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-roc-debit-acct"><SelectValue placeholder="Select account to transfer recovered amount" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">— Select Account —</SelectItem>{accountsList.filter(a => a.type === "asset" && a.status === "active").map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select><p className="text-[10px] text-muted-foreground mt-1">Recovered amount will be posted to this account</p></FormItem>} />
                    <FormField control={rocForm.control} name="creditAccountId" render={({ field }) => <FormItem><FormLabel>Credit Account (Accounts Receivable)</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-roc-credit-acct"><SelectValue placeholder="Auto-select AR" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Auto-select</SelectItem>{accountsList.filter(a => a.type === "asset" || a.type === "liability").map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                  </div>
                  {rocForm.watch("debitAccountId") && rocForm.watch("debitAccountId") !== null && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">Journal Entry Preview</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span className="font-medium">DR: {accountsList.find(a => a.id === rocForm.watch("debitAccountId"))?.name || "—"}</span><span className="font-semibold text-green-600">Rs. {Number(rocForm.watch("amount") || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="font-medium pl-4">CR: Accounts Receivable</span><span className="font-semibold text-red-600">Rs. {Number(rocForm.watch("amount") || 0).toLocaleString()}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Settings className="h-3.5 w-3.5" />Section D — Approval & Controls</h4>
                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <FormField control={rocForm.control} name="requireApproval" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Require approval before posting</FormLabel></FormItem>} />
                    <FormField control={rocForm.control} name="autoAdjustReceivable" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Auto adjust customer receivable</FormLabel></FormItem>} />
                    <FormField control={rocForm.control} name="sendNotification" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Send SMS/Email receipt</FormLabel></FormItem>} />
                    <FormField control={rocForm.control} name="lockAfterSave" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Lock after save</FormLabel></FormItem>} />
                    <FormField control={rocForm.control} name="allowPartialPayment" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Allow partial payment</FormLabel></FormItem>} />
                  </div>
                  {rocForm.watch("requireApproval") && (
                    <div className="mt-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />This recovery will be saved as "Pending Approval" and will not post to the transfer account until approved.</p>
                    </div>
                  )}
                </div>
              </div>

              <FormField control={rocForm.control} name="description" render={({ field }) => <FormItem><FormLabel>Additional Notes</FormLabel><FormControl><Textarea rows={2} placeholder="Recovery notes, special instructions..." data-testid="textarea-roc-notes" {...field} value={field.value || ""} /></FormControl></FormItem>} />

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setRocRecoverFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-recovery">
                  {createMutation.isPending ? "Recording..." : rocForm.watch("requireApproval") ? "Submit for Approval" : "Record & Post Recovery"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== ROC APPROVAL CONFIRMATION DIALOG ===== */}
      <Dialog open={!!rocApproveDialogTxn} onOpenChange={(open) => { if (!open) setRocApproveDialogTxn(null); }}>
        <DialogContent className="max-w-md">
          {rocApproveDialogTxn && (() => {
            const txn = rocApproveDialogTxn;
            const cust = txn.customerId ? customers.find(c => c.id === txn.customerId) : null;
            const transferAcct = txn.debitAccountId ? accountsList.find(a => a.id === txn.debitAccountId) : null;
            const descParts = (txn.description || "").split(" | ");
            const receivedBy = descParts.find(p => p.startsWith("Received by:"))?.replace("Received by: ", "") || "—";
            const isApprove = rocApproveAction === "approve";
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {isApprove ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                    {isApprove ? "Approve Recovery" : "Reject Recovery"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div className={`p-4 rounded-md border ${isApprove ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"}`}>
                    <p className="text-sm font-medium mb-2">{isApprove ? "This will post the recovery transaction:" : "This will reject and reverse the recovery:"}</p>
                    <div className="space-y-1.5 text-xs">
                      <DRow label="Recovery ID" value={txn.txnId} />
                      <DRow label="Amount" value={`Rs. ${Number(txn.netAmount || txn.amount || 0).toLocaleString()}`} />
                      <DRow label="Customer" value={cust?.fullName || "—"} />
                      <DRow label="Recovery Officer" value={txn.createdBy || "—"} />
                      <DRow label="Received By" value={receivedBy} />
                      {transferAcct && <DRow label="Transfer Account" value={`${transferAcct.code} — ${transferAcct.name}`} />}
                    </div>
                  </div>
                  {isApprove && transferAcct && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-200 dark:border-blue-800 text-xs">
                      <p className="font-medium mb-1">On approval, the following will happen:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                        <li>Rs. {Number(txn.netAmount || txn.amount || 0).toLocaleString()} will be posted to <strong>{transferAcct.name}</strong></li>
                        <li>Customer receivable will be adjusted</li>
                        <li>Transaction status changed to "Posted"</li>
                      </ul>
                    </div>
                  )}
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="secondary" onClick={() => setRocApproveDialogTxn(null)}>Cancel</Button>
                  <Button className={isApprove ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} onClick={() => handleRocApprove(txn, rocApproveAction)} disabled={updateMutation.isPending} data-testid="button-confirm-roc-action">
                    {updateMutation.isPending ? "Processing..." : isApprove ? "Approve & Post" : "Reject Recovery"}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== APPROVAL WORKFLOW TAB ===== */}
      {activeTab === "approval" && <ApprovalWorkflowTab />}

      {/* ===== WALLET DETAIL DRAWER ===== */}
      <Dialog open={!!walDetailTxn} onOpenChange={(open) => { if (!open) setWalDetailTxn(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {walDetailTxn && (() => {
            const txn = walDetailTxn;
            const cust = txn.customerId ? customers.find(c => c.id === txn.customerId) : null;
            const vendor = txn.vendorId ? vendors.find(v => v.id === txn.vendorId) : null;
            const entityName = cust?.fullName || vendor?.name || "Unknown";
            const entityType = cust ? "Customer" : vendor ? "Vendor" : "Reseller";
            const ws = walletStatusMap[txn.status] || walletStatusMap.completed;
            const WSIcon = ws.icon;
            const isCredit = txn.category === "wallet_topup" || txn.category === "prepaid_credit" || txn.category === "wallet_refund";
            const debitAcc = txn.debitAccountId ? accountsList.find(a => a.id === txn.debitAccountId) : null;
            const creditAcc = txn.creditAccountId ? accountsList.find(a => a.id === txn.creditAccountId) : null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#4338CA] to-[#06B6D4] flex items-center justify-center"><Wallet className="h-4 w-4 text-white" /></div>
                    Wallet Transaction — {txn.txnId}
                    <Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ml-auto ${ws.color}`}><WSIcon className="h-3 w-3 mr-1" />{ws.label}</Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Transaction Details</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Transaction ID</span><span className="font-mono font-medium">{txn.txnId}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Date</span><span>{txn.date ? new Date(txn.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Operation</span><span className="font-medium">{walletOperationLabels[txn.category || ""] || txn.category || "—"}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Payment Method</span><span>{paymentMethodLabels[txn.paymentMethod || ""] || txn.paymentMethod || "—"}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Reference</span><span>{txn.reference || "—"}</span></div>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Entity & Amount</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Entity</span><span className="font-medium">{entityName}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Entity Type</span><span>{entityType}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Amount</span><span className={`font-semibold ${isCredit ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}>{isCredit ? "+" : "−"} Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Fee</span><span>{Number(txn.tax || 0) > 0 ? `Rs. ${Number(txn.tax).toLocaleString()}` : "—"}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Branch</span><span>{txn.branch || "—"}</span></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Journal Entry Preview</h4>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-3 space-y-1.5 font-mono text-xs">
                    {isCredit ? (
                      <>
                        <div className="flex justify-between"><span className="text-blue-700 dark:text-blue-300">Dr. {debitAcc ? `${debitAcc.code} — ${debitAcc.name}` : "Cash / Bank"}</span><span className="font-semibold">Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</span></div>
                        <div className="flex justify-between pl-6"><span className="text-amber-700 dark:text-amber-300">Cr. {creditAcc ? `${creditAcc.code} — ${creditAcc.name}` : "Customer Wallet Liability"}</span><span className="font-semibold">Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</span></div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between"><span className="text-blue-700 dark:text-blue-300">Dr. {debitAcc ? `${debitAcc.code} — ${debitAcc.name}` : "Wallet Liability / Revenue"}</span><span className="font-semibold">Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</span></div>
                        <div className="flex justify-between pl-6"><span className="text-amber-700 dark:text-amber-300">Cr. {creditAcc ? `${creditAcc.code} — ${creditAcc.name}` : "Customer Wallet"}</span><span className="font-semibold">Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</span></div>
                      </>
                    )}
                  </div>
                </div>
                {txn.transactionRef && <div className="space-y-1"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approval Info</h4><p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{txn.transactionRef}</p></div>}
                {txn.description && <div className="space-y-1"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description / Notes</h4><p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{txn.description}</p></div>}
                {txn.createdAt && <div className="text-[10px] text-muted-foreground border-t pt-2">Recorded: {new Date(txn.createdAt).toLocaleString()}{txn.createdBy ? ` by ${txn.createdBy}` : ""}</div>}
                <DialogFooter className="flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setWalDetailTxn(null)} data-testid="button-close-wal-detail">Close</Button>
                  <Button variant="outline" size="sm" onClick={() => printVoucher(txn)} data-testid="button-print-wal-detail"><Printer className="h-3.5 w-3.5 mr-1" />Print Voucher</Button>
                  {txn.status === "pending" && (
                    <>
                      <Button size="sm" className="bg-green-600 text-white" onClick={() => { updateMutation.mutate({ id: txn.id, data: { status: "completed", transactionRef: `Approved by Admin on ${today}` } }); setWalDetailTxn(null); }} data-testid="button-approve-wal-detail"><CheckCircle className="h-3.5 w-3.5 mr-1" />Approve</Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-300" onClick={() => { updateMutation.mutate({ id: txn.id, data: { status: "failed", transactionRef: `Rejected by Admin on ${today}` } }); setWalDetailTxn(null); }} data-testid="button-reject-wal-detail"><XCircle className="h-3.5 w-3.5 mr-1" />Reject</Button>
                    </>
                  )}
                  {txn.status === "completed" && <Button variant="outline" size="sm" className="text-amber-600 border-amber-300" onClick={() => { reverseMutation.mutate(txn.id); setWalDetailTxn(null); }} data-testid="button-reverse-wal-detail"><RotateCcw className="h-3.5 w-3.5 mr-1" />Reverse</Button>}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== CREATE WALLET TRANSACTION FORM ===== */}
      <Dialog open={walFormOpen} onOpenChange={setWalFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#4338CA] to-[#06B6D4] flex items-center justify-center"><Wallet className="h-4 w-4 text-white" /></div>
              New Wallet Transaction
            </DialogTitle>
          </DialogHeader>
          <Form {...walForm}>
            <form onSubmit={walForm.handleSubmit(onWalSubmit)} className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Section A — Entity & Operation</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Entity Type</label>
                      <Select value={walEntityType} onValueChange={(v: "customer" | "vendor" | "reseller") => { setWalEntityType(v); walForm.setValue("customerId", null); walForm.setValue("vendorId", null); }}>
                        <SelectTrigger data-testid="select-wal-entity-type"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="customer">Customer</SelectItem><SelectItem value="vendor">Vendor</SelectItem><SelectItem value="reseller">Reseller</SelectItem></SelectContent>
                      </Select>
                    </div>
                    {walEntityType === "customer" && (
                      <FormField control={walForm.control} name="customerId" render={({ field }) => <FormItem><FormLabel>Customer</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-wal-customer"><SelectValue placeholder="Select customer" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">— Select —</SelectItem>{customers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.fullName} (Wallet: Rs. {Number((c as any).walletBalance || 0).toLocaleString()})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    )}
                    {walEntityType === "vendor" && (
                      <FormField control={walForm.control} name="vendorId" render={({ field }) => <FormItem><FormLabel>Vendor</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-wal-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">— Select —</SelectItem>{vendors.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name} (Wallet: Rs. {Number(v.walletBalance || 0).toLocaleString()})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    )}
                    {walEntityType === "reseller" && (
                      <FormField control={walForm.control} name="vendorId" render={({ field }) => <FormItem><FormLabel>Reseller</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-wal-reseller"><SelectValue placeholder="Select reseller" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">— Select —</SelectItem>{resellers.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.name} (Wallet: Rs. {Number(r.walletBalance || 0).toLocaleString()})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    )}
                    <FormField control={walForm.control} name="category" render={({ field }) => <FormItem><FormLabel>Operation Type</FormLabel><Select onValueChange={field.onChange} value={field.value || "wallet_topup"}><FormControl><SelectTrigger data-testid="select-wal-operation"><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(walletOperationLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                  </div>
                  <FormField control={walForm.control} name="branch" render={({ field }) => <FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="e.g. Head Office" data-testid="input-wal-branch" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />Section B — Amount & Payment</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={walForm.control} name="amount" render={({ field }) => <FormItem><FormLabel>Amount (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" data-testid="input-wal-amount" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={walForm.control} name="tax" render={({ field }) => <FormItem><FormLabel>Processing Fee (Optional)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-wal-fee" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={walForm.control} name="date" render={({ field }) => <FormItem><FormLabel>Transaction Date</FormLabel><FormControl><Input type="date" data-testid="input-wal-date" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={walForm.control} name="paymentMethod" render={({ field }) => <FormItem><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} value={field.value || "cash"}><FormControl><SelectTrigger data-testid="select-wal-method"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="online">Online</SelectItem><SelectItem value="jazzcash">JazzCash</SelectItem><SelectItem value="easypaisa">EasyPaisa</SelectItem></SelectContent></Select></FormItem>} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={walForm.control} name="reference" render={({ field }) => <FormItem><FormLabel>Reference Number</FormLabel><FormControl><Input placeholder="Receipt / transaction ref" data-testid="input-wal-reference" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <FormField control={walForm.control} name="txnId" render={({ field }) => <FormItem><FormLabel>Transaction ID</FormLabel><FormControl><Input data-testid="input-wal-txn-id" {...field} /></FormControl><FormMessage /></FormItem>} />
                  </div>
                  <FormField control={walForm.control} name="description" render={({ field }) => <FormItem><FormLabel>Description / Notes</FormLabel><FormControl><Textarea rows={2} placeholder="Wallet transaction notes..." data-testid="input-wal-description" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-md border border-indigo-200 dark:border-indigo-800">
                    <p className="text-xs text-muted-foreground">Net Amount</p>
                    <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300" data-testid="text-wal-net-amount">Rs. {(Number(walForm.watch("amount") || 0) - Number(walForm.watch("tax") || 0)).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Section C — Accounting & Approval</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={walForm.control} name="debitAccountId" render={({ field }) => <FormItem><FormLabel>Debit Account</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-wal-debit"><SelectValue placeholder="Select debit account" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">— Auto —</SelectItem>{accountsList.filter(a => a.isActive).map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                    <FormField control={walForm.control} name="creditAccountId" render={({ field }) => <FormItem><FormLabel>Credit Account</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-wal-credit"><SelectValue placeholder="Select credit account" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">— Auto —</SelectItem>{accountsList.filter(a => a.isActive).map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={walForm.control} name="status" render={({ field }) => <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value || "completed"}><FormControl><SelectTrigger data-testid="select-wal-form-status"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="completed">Post Immediately</SelectItem><SelectItem value="pending">Requires Approval</SelectItem></SelectContent></Select></FormItem>} />
                    {walForm.watch("paymentMethod") === "cheque" && (
                      <FormField control={walForm.control} name="chequeNumber" render={({ field }) => <FormItem><FormLabel>Cheque Number</FormLabel><FormControl><Input placeholder="Cheque #" data-testid="input-wal-cheque" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setWalFormOpen(false)} data-testid="button-cancel-wal">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-wal">{createMutation.isPending ? "Processing..." : "Submit Transaction"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== TRANSFER DETAIL DRAWER ===== */}
      <Dialog open={!!xfrDetailTxn} onOpenChange={(open) => { if (!open) setXfrDetailTxn(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {xfrDetailTxn && (() => {
            const txn = xfrDetailTxn;
            const fromAcc = accountsList.find(a => a.id === txn.creditAccountId);
            const toAcc = accountsList.find(a => a.id === txn.debitAccountId);
            const xs = xfrStatusMap[txn.status] || xfrStatusMap.completed;
            const XSIcon = xs.icon;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#0F766E] to-[#1D4ED8] flex items-center justify-center"><Send className="h-4 w-4 text-white" /></div>
                    Transfer — {txn.txnId}
                    <Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ml-auto ${xs.color}`}><XSIcon className="h-3 w-3 mr-1" />{xs.label}</Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Transfer Details</h4>
                    <DRow label="Transfer ID" value={txn.txnId} />
                    <DRow label="Date" value={txn.date ? new Date(txn.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"} />
                    <DRow label="Transfer Type" value={xfrTransferTypeLabels[txn.category || ""] || txn.category || "—"} />
                    <DRow label="Branch" value={txn.branch || "—"} />
                    <DRow label="Reference" value={txn.reference || "—"} />
                  </div>
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Account Flow</h4>
                    <DRow label="Source (Credit)" value={fromAcc ? `${fromAcc.code} — ${fromAcc.name}` : "—"} />
                    <DRow label="Destination (Debit)" value={toAcc ? `${toAcc.code} — ${toAcc.name}` : "—"} />
                    <DRow label="Transfer Amount" value={`Rs. ${Number(txn.netAmount || txn.amount).toLocaleString()}`} />
                    <DRow label="Transfer Fee" value={Number(txn.tax || 0) > 0 ? `Rs. ${Number(txn.tax).toLocaleString()}` : "—"} />
                    <DRow label="Payment Method" value={paymentMethodLabels[txn.paymentMethod || ""] || txn.paymentMethod || "—"} />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Journal Entry Preview</h4>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-3 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between"><span className="text-blue-700 dark:text-blue-300">Dr. {toAcc ? `${toAcc.code} — ${toAcc.name}` : "Destination Account"}</span><span className="font-semibold">Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</span></div>
                    <div className="flex justify-between pl-6"><span className="text-amber-700 dark:text-amber-300">Cr. {fromAcc ? `${fromAcc.code} — ${fromAcc.name}` : "Source Account"}</span><span className="font-semibold">Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</span></div>
                    {Number(txn.tax || 0) > 0 && (
                      <>
                        <div className="border-t pt-1.5 flex justify-between"><span className="text-blue-700 dark:text-blue-300">Dr. Transfer Fee Expense</span><span className="font-semibold">Rs. {Number(txn.tax).toLocaleString()}</span></div>
                        <div className="flex justify-between pl-6"><span className="text-amber-700 dark:text-amber-300">Cr. {fromAcc ? fromAcc.name : "Source"}</span><span className="font-semibold">Rs. {Number(txn.tax).toLocaleString()}</span></div>
                      </>
                    )}
                  </div>
                </div>
                {txn.transactionRef && <div className="space-y-1"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approval Info</h4><p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{txn.transactionRef}</p></div>}
                {txn.description && <div className="space-y-1"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description / Remarks</h4><p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{txn.description}</p></div>}
                {txn.createdAt && <div className="text-[10px] text-muted-foreground border-t pt-2">Recorded: {new Date(txn.createdAt).toLocaleString()}{txn.createdBy ? ` by ${txn.createdBy}` : ""}</div>}
                <DialogFooter className="flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setXfrDetailTxn(null)} data-testid="button-close-xfr-detail">Close</Button>
                  <Button variant="outline" size="sm" onClick={() => printVoucher(txn)} data-testid="button-print-xfr-detail"><Printer className="h-3.5 w-3.5 mr-1" />Print Voucher</Button>
                  {txn.status === "pending" && (
                    <>
                      <Button size="sm" className="bg-green-600 text-white" onClick={() => { updateMutation.mutate({ id: txn.id, data: { status: "completed", transactionRef: `Approved by Admin on ${today}` } }); setXfrDetailTxn(null); }} data-testid="button-approve-xfr-detail"><CheckCircle className="h-3.5 w-3.5 mr-1" />Approve</Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-300" onClick={() => { updateMutation.mutate({ id: txn.id, data: { status: "failed", transactionRef: `Rejected by Admin on ${today}` } }); setXfrDetailTxn(null); }} data-testid="button-reject-xfr-detail"><XCircle className="h-3.5 w-3.5 mr-1" />Reject</Button>
                    </>
                  )}
                  {txn.status === "completed" && <Button variant="outline" size="sm" className="text-amber-600 border-amber-300" onClick={() => { reverseMutation.mutate(txn.id); setXfrDetailTxn(null); }} data-testid="button-reverse-xfr-detail"><RotateCcw className="h-3.5 w-3.5 mr-1" />Reverse</Button>}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== CREATE TRANSFER FORM ===== */}
      <Dialog open={xfrFormOpen} onOpenChange={setXfrFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#0F766E] to-[#1D4ED8] flex items-center justify-center"><Send className="h-4 w-4 text-white" /></div>
              New Account Transfer
            </DialogTitle>
          </DialogHeader>
          <Form {...xfrForm}>
            <form onSubmit={xfrForm.handleSubmit(onXfrSubmit)} className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><ArrowLeftRight className="h-3.5 w-3.5" />Section A — Transfer Details</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={xfrForm.control} name="date" render={({ field }) => <FormItem><FormLabel>Transfer Date</FormLabel><FormControl><Input type="date" data-testid="input-xfr-date" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={xfrForm.control} name="category" render={({ field }) => <FormItem><FormLabel>Transfer Type</FormLabel><Select onValueChange={field.onChange} value={field.value || "bank_to_bank"}><FormControl><SelectTrigger data-testid="select-xfr-transfer-type"><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(xfrTransferTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={xfrForm.control} name="creditAccountId" render={({ field }) => <FormItem><FormLabel>From Account (Source)</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-xfr-from-account"><SelectValue placeholder="Select source account" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">— Select Account —</SelectItem>{accountsList.filter(a => a.type === "asset" && a.isActive).map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name} (Rs. {Number(a.balance || 0).toLocaleString()})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    <FormField control={xfrForm.control} name="debitAccountId" render={({ field }) => <FormItem><FormLabel>To Account (Destination)</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-xfr-to-account"><SelectValue placeholder="Select destination account" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">— Select Account —</SelectItem>{accountsList.filter(a => a.type === "asset" && a.isActive).map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name} (Rs. {Number(a.balance || 0).toLocaleString()})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                  </div>
                  <FormField control={xfrForm.control} name="branch" render={({ field }) => <FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="e.g. Head Office" data-testid="input-xfr-branch" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />Section B — Amount Details</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={xfrForm.control} name="amount" render={({ field }) => <FormItem><FormLabel>Transfer Amount (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" data-testid="input-xfr-amount" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={xfrForm.control} name="tax" render={({ field }) => <FormItem><FormLabel>Transfer Fee (Optional)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-xfr-fee" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={xfrForm.control} name="reference" render={({ field }) => <FormItem><FormLabel>Reference Number</FormLabel><FormControl><Input placeholder="Bank ref / slip number" data-testid="input-xfr-reference" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <FormField control={xfrForm.control} name="txnId" render={({ field }) => <FormItem><FormLabel>Transfer ID</FormLabel><FormControl><Input data-testid="input-xfr-id" {...field} /></FormControl><FormMessage /></FormItem>} />
                  </div>
                  <FormField control={xfrForm.control} name="description" render={({ field }) => <FormItem><FormLabel>Description / Remarks</FormLabel><FormControl><Textarea rows={2} placeholder="Transfer details..." data-testid="input-xfr-description" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  <div className="bg-teal-50 dark:bg-teal-950/30 p-3 rounded-md border border-teal-200 dark:border-teal-800">
                    <p className="text-xs text-muted-foreground">Net Transfer Amount</p>
                    <p className="text-xl font-bold text-teal-700 dark:text-teal-300" data-testid="text-xfr-net-amount">Rs. {(Number(xfrForm.watch("amount") || 0) - Number(xfrForm.watch("tax") || 0)).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Section C — Approval Workflow</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={xfrForm.control} name="status" render={({ field }) => <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value || "completed"}><FormControl><SelectTrigger data-testid="select-xfr-form-status"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="completed">Post Immediately</SelectItem><SelectItem value="pending">Requires Approval</SelectItem></SelectContent></Select></FormItem>} />
                    <FormField control={xfrForm.control} name="paymentMethod" render={({ field }) => <FormItem><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} value={field.value || "bank_transfer"}><FormControl><SelectTrigger data-testid="select-xfr-pay-method"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cash">Cash</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="online">Online</SelectItem></SelectContent></Select></FormItem>} />
                  </div>
                  {xfrForm.watch("paymentMethod") === "cheque" && (
                    <FormField control={xfrForm.control} name="chequeNumber" render={({ field }) => <FormItem><FormLabel>Cheque Number</FormLabel><FormControl><Input placeholder="Cheque #" data-testid="input-xfr-cheque" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setXfrFormOpen(false)} data-testid="button-cancel-xfr">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-xfr">{createMutation.isPending ? "Processing..." : "Execute Transfer"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== REFUND DETAIL DRAWER ===== */}
      <Dialog open={!!refDetailTxn} onOpenChange={(open) => { if (!open) setRefDetailTxn(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {refDetailTxn && (() => {
            const txn = refDetailTxn;
            const rs = refStatusMap[txn.status] || refStatusMap.pending;
            const RSIcon = rs.icon;
            const entityName = (txn as any).customerName || (txn as any).vendorName || "Unknown";
            const debitAcc = accountsList.find(a => a.id === txn.debitAccountId);
            const creditAcc = accountsList.find(a => a.id === txn.creditAccountId);
            const netAmt = Number(txn.netAmount || txn.amount || 0);
            const inv = txn.invoiceId ? invoices.find(i => i.id === txn.invoiceId) : null;
            const catLabel = refundCategoryLabels[txn.category || ""] || txn.category || "—";
            const methodLabel = refundMethodLabels[txn.paymentMethod || ""] || paymentMethodLabels[txn.paymentMethod || ""] || txn.paymentMethod || "—";
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-gradient-to-r from-[#7F1D1D] to-[#1D4ED8] flex items-center justify-center">
                      <RotateCcw className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="font-mono text-base">{txn.txnId}</span>
                      <p className="text-xs text-muted-foreground">{txn.type === "refund" ? "Refund" : "Credit Adjustment"} — {entityName}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div><p className="text-[10px] text-muted-foreground uppercase">Refund / Credit Amount</p><p className="text-xl font-bold text-red-700 dark:text-red-300">Rs. {netAmt.toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase">Category</p><p className="text-lg font-bold">{catLabel}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase">Status</p><Badge variant="outline" className={`no-default-active-elevate text-xs font-medium ${rs.color}`}><RSIcon className="h-3.5 w-3.5 mr-1" />{rs.label}</Badge></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Entity Details</h4>
                      <DRow label="Entity" value={entityName} />
                      <DRow label="Entity Type" value={<span className="capitalize">{txn.costCenter || "customer"}</span>} />
                      <DRow label="Invoice" value={inv ? `INV-${inv.invoiceNumber}` : "—"} />
                      <DRow label="Branch" value={txn.branch || "—"} />
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Payment Details</h4>
                      <DRow label="Date" value={txn.date} />
                      <DRow label="Refund Method" value={methodLabel} />
                      <DRow label="Reference" value={txn.reference || "—"} />
                      <DRow label="Cheque #" value={txn.chequeNumber || "—"} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />Journal Entry</h4>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader><TableRow className="bg-slate-100 dark:bg-slate-800"><TableHead className="text-xs font-semibold">Account</TableHead><TableHead className="text-xs font-semibold text-right">Debit (Rs.)</TableHead><TableHead className="text-xs font-semibold text-right">Credit (Rs.)</TableHead></TableRow></TableHeader>
                        <TableBody>
                          <TableRow><TableCell className="text-sm">{debitAcc ? `${debitAcc.code} — ${debitAcc.name}` : "Sales Return / Refund Expense"}</TableCell><TableCell className="text-right font-semibold text-blue-700 dark:text-blue-300">Rs. {netAmt.toLocaleString()}</TableCell><TableCell className="text-right text-muted-foreground">—</TableCell></TableRow>
                          <TableRow><TableCell className="text-sm">{creditAcc ? `${creditAcc.code} — ${creditAcc.name}` : txn.paymentMethod === "wallet" ? "Customer Wallet Liability" : txn.paymentMethod === "credit_note" ? "Accounts Receivable" : "Bank / Cash"}</TableCell><TableCell className="text-right text-muted-foreground">—</TableCell><TableCell className="text-right font-semibold text-amber-700 dark:text-amber-300">Rs. {netAmt.toLocaleString()}</TableCell></TableRow>
                          <TableRow className="bg-slate-50 dark:bg-slate-900 font-semibold"><TableCell className="text-xs uppercase">Total</TableCell><TableCell className="text-right text-sm">Rs. {netAmt.toLocaleString()}</TableCell><TableCell className="text-right text-sm">Rs. {netAmt.toLocaleString()}</TableCell></TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs"><CheckCircle className="h-3.5 w-3.5 text-green-600" /><span className="text-green-700 dark:text-green-300 font-medium">Debit & Credit balanced</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Financial Breakdown</h4>
                      <DRow label="Amount" value={`Rs. ${Number(txn.amount).toLocaleString()}`} />
                      <DRow label="Tax Adjustment" value={`Rs. ${Number(txn.tax || 0).toLocaleString()}`} />
                      <DRow label="Discount" value={`Rs. ${Number(txn.discount || 0).toLocaleString()}`} />
                      <DRow label="Net Amount" value={`Rs. ${netAmt.toLocaleString()}`} />
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Approval Workflow</h4>
                      <DRow label="Requested By" value={txn.createdBy || "—"} />
                      <DRow label="Status" value={<Badge variant="outline" className={`no-default-active-elevate text-[10px] ${rs.color}`}><RSIcon className="h-3 w-3 mr-1" />{rs.label}</Badge>} />
                      <DRow label="Approval Info" value={txn.transactionRef || "—"} />
                      <DRow label="Requires Approval" value={txn.requireApproval ? "Yes" : "No"} />
                      <DRow label="Auto-Adjust AR" value={txn.autoAdjustReceivable ? "Yes" : "No"} />
                    </div>
                  </div>
                  {txn.description && <div><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Reason / Notes</h4><p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{txn.description}</p></div>}
                  {txn.createdAt && <div className="text-[10px] text-muted-foreground border-t pt-2">Recorded: {new Date(txn.createdAt).toLocaleString()}{txn.createdBy ? ` by ${txn.createdBy}` : ""}</div>}
                </div>
                <DialogFooter className="flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setRefDetailTxn(null)}>Close</Button>
                  <Button variant="outline" size="sm" onClick={() => printVoucher(txn)}><Printer className="h-3.5 w-3.5 mr-1" />Print Voucher</Button>
                  {txn.status === "pending" && (
                    <>
                      <Button size="sm" className="bg-green-600 text-white" onClick={() => { updateMutation.mutate({ id: txn.id, data: { status: "completed", transactionRef: `Approved by Admin on ${today}` } }); setRefDetailTxn(null); }}><CheckCircle className="h-3.5 w-3.5 mr-1" />Approve</Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-300" onClick={() => { updateMutation.mutate({ id: txn.id, data: { status: "failed", transactionRef: `Rejected by Admin on ${today}` } }); setRefDetailTxn(null); }}><XCircle className="h-3.5 w-3.5 mr-1" />Reject</Button>
                    </>
                  )}
                  {txn.status === "completed" && <Button variant="outline" size="sm" className="text-amber-600 border-amber-300" onClick={() => { reverseMutation.mutate(txn.id); setRefDetailTxn(null); }}><RotateCcw className="h-3.5 w-3.5 mr-1" />Reverse</Button>}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== CREATE REFUND / CREDIT FORM ===== */}
      <Dialog open={refFormOpen} onOpenChange={setRefFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#7F1D1D] to-[#1D4ED8] flex items-center justify-center"><RotateCcw className="h-4 w-4 text-white" /></div>
              Create Refund / Credit
            </DialogTitle>
          </DialogHeader>
          <Form {...refForm}>
            <form onSubmit={refForm.handleSubmit(onRefSubmit)} className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Section A — Entity Selection</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Entity Type</label>
                      <Select value={refEntityType} onValueChange={(v) => { setRefEntityType(v); refForm.setValue("costCenter", v); refForm.setValue("customerId", null); refForm.setValue("vendorId", null); }}>
                        <SelectTrigger data-testid="select-ref-entity-type"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="customer">Customer</SelectItem><SelectItem value="cir_customer">CIR Customer</SelectItem><SelectItem value="corporate">Corporate Customer</SelectItem><SelectItem value="reseller">Reseller</SelectItem></SelectContent>
                      </Select>
                    </div>
                    {refEntityType === "customer" && (
                      <FormField control={refForm.control} name="customerId" render={({ field }) => <FormItem><FormLabel>Customer</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-ref-customer"><SelectValue placeholder="Select customer" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Select...</SelectItem>{customers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    )}
                    {refEntityType === "cir_customer" && (
                      <FormField control={refForm.control} name="customerId" render={({ field }) => <FormItem><FormLabel>CIR Customer</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-ref-cir"><SelectValue placeholder="Select CIR customer" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Select...</SelectItem>{cirCustomers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    )}
                    {refEntityType === "corporate" && (
                      <FormField control={refForm.control} name="customerId" render={({ field }) => <FormItem><FormLabel>Corporate Customer</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-ref-corporate"><SelectValue placeholder="Select corporate" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Select...</SelectItem>{corpCustomers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    )}
                    {refEntityType === "reseller" && (
                      <FormField control={refForm.control} name="vendorId" render={({ field }) => <FormItem><FormLabel>Reseller</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-ref-reseller"><SelectValue placeholder="Select reseller" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Select...</SelectItem>{resellers.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={refForm.control} name="invoiceId" render={({ field }) => <FormItem><FormLabel>Invoice (Optional)</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-ref-invoice"><SelectValue placeholder="Select invoice" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">No Invoice</SelectItem>{invoices.map(i => <SelectItem key={i.id} value={i.id.toString()}>INV-{i.invoiceNumber} — Rs. {Number(i.amount).toLocaleString()}</SelectItem>)}</SelectContent></Select></FormItem>} />
                    <FormField control={refForm.control} name="branch" render={({ field }) => <FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="Head Office" data-testid="input-ref-branch" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" />Section B — Refund / Credit Type</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Transaction Type</label>
                      <Select value={refTxnType} onValueChange={(v) => setRefTxnType(v as "refund" | "credit")}>
                        <SelectTrigger data-testid="select-ref-txn-type"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="refund">Refund (Cash Out)</SelectItem><SelectItem value="credit">Credit Adjustment</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <FormField control={refForm.control} name="category" render={({ field }) => <FormItem><FormLabel>{refTxnType === "refund" ? "Refund" : "Credit"} Category</FormLabel><Select onValueChange={field.onChange} value={field.value || "overpayment_refund"}><FormControl><SelectTrigger data-testid="select-ref-category"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="overpayment_refund">Overpayment Refund</SelectItem><SelectItem value="cancellation_refund">Service Cancellation Refund</SelectItem><SelectItem value="sla_compensation">SLA Compensation Credit</SelectItem><SelectItem value="billing_error">Billing Error Correction</SelectItem><SelectItem value="downgrade_credit">Plan Downgrade Credit</SelectItem><SelectItem value="manual_adjustment">Manual Adjustment</SelectItem><SelectItem value="security_deposit_refund">Security Deposit Refund</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                    <FormField control={refForm.control} name="paymentMethod" render={({ field }) => <FormItem><FormLabel>{refTxnType === "refund" ? "Refund" : "Credit"} Method</FormLabel><Select onValueChange={field.onChange} value={field.value || "bank_transfer"}><FormControl><SelectTrigger data-testid="select-ref-method"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="bank_transfer">Refund to Bank</SelectItem><SelectItem value="wallet">Refund to Wallet</SelectItem><SelectItem value="credit_note">Convert to Credit Note</SelectItem><SelectItem value="future_invoice">Apply to Future Invoice</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" />Section C — Amount Details</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={refForm.control} name="amount" render={({ field }) => <FormItem><FormLabel>Refund / Credit Amount (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" data-testid="input-ref-amount" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={refForm.control} name="tax" render={({ field }) => <FormItem><FormLabel>Tax Adjustment (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-ref-tax" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-md border border-red-200 dark:border-red-800 flex flex-col justify-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Net Refund</p>
                      <p className="text-lg font-bold text-red-700 dark:text-red-300" data-testid="text-ref-net">Rs. {Math.abs(Number(refForm.watch("amount") || 0) - Number(refForm.watch("tax") || 0) - Number(refForm.watch("discount") || 0)).toLocaleString()}</p>
                    </div>
                  </div>
                  <FormField control={refForm.control} name="description" render={({ field }) => <FormItem><FormLabel>Reason (Mandatory)</FormLabel><FormControl><Textarea rows={2} placeholder="Detailed reason for refund / credit adjustment..." data-testid="input-ref-reason" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>} />
                  <FormField control={refForm.control} name="reference" render={({ field }) => <FormItem><FormLabel>Reference / Attachment</FormLabel><FormControl><Input placeholder="Attach reference document number" data-testid="input-ref-reference" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />Section D — Accounting & Approval</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={refForm.control} name="debitAccountId" render={({ field }) => <FormItem><FormLabel>Debit: Sales Return / Refund</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-ref-debit"><SelectValue placeholder="Select debit account" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Auto-select</SelectItem>{accountsList.filter(a => a.type === "expense" || a.type === "asset").map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                    <FormField control={refForm.control} name="creditAccountId" render={({ field }) => <FormItem><FormLabel>Credit: Bank / Wallet / AR</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-ref-credit"><SelectValue placeholder="Select credit account" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Auto-select</SelectItem>{accountsList.filter(a => a.type === "asset" || a.type === "liability").map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={refForm.control} name="createdBy" render={({ field }) => <FormItem><FormLabel>Requested By</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger data-testid="select-ref-requested-by"><SelectValue placeholder="Select officer" /></SelectTrigger></FormControl><SelectContent>{employees.filter(e => e.status === "active").map(e => <SelectItem key={e.id} value={e.fullName}>{e.fullName} — {e.designation}</SelectItem>)}<SelectItem value="admin">Admin</SelectItem></SelectContent></Select></FormItem>} />
                    <FormField control={refForm.control} name="date" render={({ field }) => <FormItem><FormLabel>Refund Date</FormLabel><FormControl><Input type="date" data-testid="input-ref-date" {...field} /></FormControl><FormMessage /></FormItem>} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <FormField control={refForm.control} name="requireApproval" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Require approval</FormLabel></FormItem>} />
                    <FormField control={refForm.control} name="autoAdjustReceivable" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Auto-adjust AR</FormLabel></FormItem>} />
                    <FormField control={refForm.control} name="sendNotification" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Send notification</FormLabel></FormItem>} />
                    <FormField control={refForm.control} name="lockAfterSave" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Lock after save</FormLabel></FormItem>} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setRefFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-refund">
                  {createMutation.isPending ? "Processing..." : "Submit Refund / Credit"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== RESELLER COLLECTION DETAIL DRAWER ===== */}
      <Dialog open={!!resDetailTxn} onOpenChange={(open) => { if (!open) setResDetailTxn(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {resDetailTxn && (() => {
            const txn = resDetailTxn;
            const sc = statusColors[txn.status] || statusColors.completed;
            const StatusIcon = sc.icon;
            const res = txn.vendorId ? resellerMap.get(txn.vendorId) : null;
            const debitAcc = accountsList.find(a => a.id === txn.debitAccountId);
            const creditAcc = accountsList.find(a => a.id === txn.creditAccountId);
            const netAmt = Number(txn.netAmount || txn.amount || 0);
            const colType = collectionTypeLabels[txn.costCenter || ""] || "Wallet Top-up";
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-gradient-to-r from-[#3B0764] to-[#1D4ED8] flex items-center justify-center">
                      <Handshake className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="font-mono text-base">{txn.txnId}</span>
                      <p className="text-xs text-muted-foreground">Reseller Collection — {res?.name || "Unknown"}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-md p-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div><p className="text-[10px] text-muted-foreground uppercase">Amount Received</p><p className="text-xl font-bold text-green-700 dark:text-green-300">Rs. {netAmt.toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase">Wallet Balance</p><p className={`text-xl font-bold ${res && Number(res.walletBalance || 0) < 0 ? "text-red-600 dark:text-red-400" : "text-indigo-700 dark:text-indigo-300"}`}>Rs. {res ? Number(res.walletBalance || 0).toLocaleString() : "—"}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase">Collection Type</p><p className="text-xl font-bold">{colType}</p></div>
                    </div>
                  </div>
                  {res && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Reseller Details</h4>
                        <DRow label="Reseller" value={res.name} />
                        <DRow label="Type" value={(res.resellerType || "").replace(/_/g, " ")} />
                        <DRow label="Contact" value={res.contactName || "—"} />
                        <DRow label="Territory" value={res.territory || res.area || "—"} />
                        <DRow label="Customers" value={res.totalCustomers || 0} />
                        <DRow label="Commission" value={`${res.commissionRate || "0"}%`} />
                      </div>
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Contact Info</h4>
                        <DRow label="Phone" value={res.phone || "—"} />
                        <DRow label="Email" value={res.email || "—"} />
                        <DRow label="City" value={res.city || "—"} />
                        <DRow label="Address" value={res.address || "—"} />
                        <DRow label="Credit Limit" value={`Rs. ${Number(res.creditLimit || 0).toLocaleString()}`} />
                        <DRow label="Security Deposit" value={`Rs. ${Number(res.securityDeposit || 0).toLocaleString()}`} />
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />Journal Entry</h4>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader><TableRow className="bg-slate-100 dark:bg-slate-800"><TableHead className="text-xs font-semibold">Account</TableHead><TableHead className="text-xs font-semibold text-right">Debit (Rs.)</TableHead><TableHead className="text-xs font-semibold text-right">Credit (Rs.)</TableHead></TableRow></TableHeader>
                        <TableBody>
                          <TableRow><TableCell className="text-sm">{debitAcc ? `${debitAcc.code} — ${debitAcc.name}` : "Cash / Bank Account"}</TableCell><TableCell className="text-right font-semibold text-blue-700 dark:text-blue-300">Rs. {netAmt.toLocaleString()}</TableCell><TableCell className="text-right text-muted-foreground">—</TableCell></TableRow>
                          <TableRow><TableCell className="text-sm">{creditAcc ? `${creditAcc.code} — ${creditAcc.name}` : "Reseller Wallet Liability"}</TableCell><TableCell className="text-right text-muted-foreground">—</TableCell><TableCell className="text-right font-semibold text-amber-700 dark:text-amber-300">Rs. {netAmt.toLocaleString()}</TableCell></TableRow>
                          <TableRow className="bg-slate-50 dark:bg-slate-900 font-semibold"><TableCell className="text-xs uppercase">Total</TableCell><TableCell className="text-right text-sm">Rs. {netAmt.toLocaleString()}</TableCell><TableCell className="text-right text-sm">Rs. {netAmt.toLocaleString()}</TableCell></TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs"><CheckCircle className="h-3.5 w-3.5 text-green-600" /><span className="text-green-700 dark:text-green-300 font-medium">Debit & Credit balanced</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Payment Details</h4>
                      <DRow label="Date" value={txn.date} />
                      <DRow label="Status" value={<Badge variant="outline" className={`no-default-active-elevate text-[10px] ${sc.color}`}><StatusIcon className="h-3 w-3 mr-1" />{sc.label}</Badge>} />
                      <DRow label="Payment Method" value={paymentMethodLabels[txn.paymentMethod || ""] || txn.paymentMethod || "—"} />
                      <DRow label="Reference" value={txn.reference || "—"} />
                      <DRow label="Cheque #" value={txn.chequeNumber || "—"} />
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Financial Info</h4>
                      <DRow label="Amount" value={`Rs. ${Number(txn.amount).toLocaleString()}`} />
                      <DRow label="Commission Adj." value={`Rs. ${Number(txn.tax || 0).toLocaleString()}`} />
                      <DRow label="Discount" value={`Rs. ${Number(txn.discount || 0).toLocaleString()}`} />
                      <DRow label="Net Amount" value={`Rs. ${netAmt.toLocaleString()}`} />
                      <DRow label="Branch" value={txn.branch || "—"} />
                    </div>
                  </div>
                  {txn.description && <div><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</h4><p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{txn.description}</p></div>}
                  {txn.createdAt && <div className="text-[10px] text-muted-foreground border-t pt-2">Recorded: {new Date(txn.createdAt).toLocaleString()}{txn.createdBy ? ` by ${txn.createdBy}` : ""}</div>}
                </div>
                <DialogFooter className="flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setResDetailTxn(null)}>Close</Button>
                  <Button variant="outline" size="sm" onClick={() => printVoucher(txn)}><Printer className="h-3.5 w-3.5 mr-1" />Print Receipt</Button>
                  {txn.status === "completed" && <Button variant="outline" size="sm" className="text-amber-600 border-amber-300" onClick={() => { reverseMutation.mutate(txn.id); setResDetailTxn(null); }}><RotateCcw className="h-3.5 w-3.5 mr-1" />Reverse</Button>}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== RESELLER DETAIL DRAWER ===== */}
      <Dialog open={!!resDetailReseller} onOpenChange={(open) => { if (!open) setResDetailReseller(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {resDetailReseller && (() => {
            const res = resDetailReseller;
            const ws = getResellerStatus(res);
            const wsc = resStatusColorMap[ws] || resStatusColorMap.active;
            const resPayments = resCollectionTxns.filter(t => t.vendorId === res.id && t.status !== "reversed");
            const totalPaid = resPayments.reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
            const lastPayment = resPayments.length > 0 ? resPayments.sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0] : null;
            const walletBal = Number(res.walletBalance || 0);
            const creditUsed = walletBal < 0 ? Math.abs(walletBal) : 0;
            const creditAvail = Math.max(0, Number(res.creditLimit || 0) - creditUsed);
            const creditUtil = Number(res.creditLimit || 0) > 0 ? Math.round((creditUsed / Number(res.creditLimit || 0)) * 100) : 0;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-gradient-to-r from-[#3B0764] to-[#1D4ED8] flex items-center justify-center">
                      <Handshake className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-base font-bold">{res.name}</span>
                      <p className="text-xs text-muted-foreground">Reseller — {(res.resellerType || "").replace(/_/g, " ")}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="bg-gradient-to-r from-[#3B0764] to-[#1D4ED8] rounded-md p-4 text-white">
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div><p className="text-[10px] text-white/60 uppercase">Wallet Balance</p><p className={`text-lg font-bold ${walletBal < 0 ? "text-red-300" : ""}`}>Rs. {walletBal.toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-white/60 uppercase">Credit Limit</p><p className="text-lg font-bold">Rs. {Number(res.creditLimit || 0).toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-white/60 uppercase">Total Paid</p><p className="text-lg font-bold">Rs. {totalPaid.toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-white/60 uppercase">Status</p><p className="text-lg font-bold capitalize">{wsc.label}</p></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Reseller Profile</h4>
                      <DRow label="Name" value={res.name} />
                      <DRow label="Type" value={<Badge variant="outline" className="no-default-active-elevate text-[10px] font-medium capitalize">{(res.resellerType || "").replace(/_/g, " ")}</Badge>} />
                      <DRow label="Contact" value={res.contactName || "—"} />
                      <DRow label="Phone" value={res.phone || "—"} />
                      <DRow label="Email" value={res.email || "—"} />
                      <DRow label="Status" value={<Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${wsc.color}`}>{wsc.label}</Badge>} />
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Financial</h4>
                      <DRow label="Wallet Balance" value={<span className={walletBal < 0 ? "text-red-600 font-bold" : ""}>{`Rs. ${walletBal.toLocaleString()}`}</span>} />
                      <DRow label="Credit Limit" value={`Rs. ${Number(res.creditLimit || 0).toLocaleString()}`} />
                      <DRow label="Credit Used" value={`Rs. ${creditUsed.toLocaleString()}`} />
                      <DRow label="Credit Available" value={`Rs. ${creditAvail.toLocaleString()}`} />
                      <DRow label="Credit Utilization" value={`${creditUtil}%`} />
                      <DRow label="Security Deposit" value={`Rs. ${Number(res.securityDeposit || 0).toLocaleString()}`} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Territory & Coverage</h4>
                      <DRow label="Territory" value={res.territory || "—"} />
                      <DRow label="Area" value={res.area || "—"} />
                      <DRow label="City" value={res.city || "—"} />
                      <DRow label="Address" value={res.address || "—"} />
                      <DRow label="Customers" value={res.totalCustomers || 0} />
                      <DRow label="Commission Rate" value={`${res.commissionRate || "0"}%`} />
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Technical</h4>
                      <DRow label="Uplink Type" value={res.uplinkType || "—"} />
                      <DRow label="Uplink" value={res.uplink || "—"} />
                      <DRow label="VLAN ID" value={res.vlanId || "—"} />
                      <DRow label="Bandwidth Plan" value={res.bandwidthPlan || "—"} />
                      <DRow label="Connection Type" value={res.connectionType || "—"} />
                      <DRow label="IP Assignment" value={res.ipAssignment || "—"} />
                    </div>
                  </div>
                  {lastPayment && (
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-3">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">Last Payment</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{lastPayment.txnId} — {lastPayment.date}</span>
                        <span className="text-sm font-bold text-green-700 dark:text-green-300">Rs. {Number(lastPayment.netAmount || lastPayment.amount).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {res.notes && <div><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</h4><p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{res.notes}</p></div>}
                </div>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setResDetailReseller(null)}>Close</Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== RECORD RESELLER COLLECTION FORM ===== */}
      <Dialog open={resFormOpen} onOpenChange={setResFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#3B0764] to-[#1D4ED8] flex items-center justify-center"><Handshake className="h-4 w-4 text-white" /></div>
              Record Reseller Collection
            </DialogTitle>
          </DialogHeader>
          <Form {...resForm}>
            <form onSubmit={resForm.handleSubmit(onResSubmit)} className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Handshake className="h-3.5 w-3.5" />Section A — Reseller Details</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={resForm.control} name="vendorId" render={({ field }) => <FormItem><FormLabel>Reseller</FormLabel><Select onValueChange={(v) => { field.onChange(v === "none" ? null : parseInt(v)); }} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-res-form-reseller"><SelectValue placeholder="Select reseller" /></SelectTrigger></FormControl><SelectContent>{resellers.filter(r => r.status === "active").map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.name} ({r.area || r.city || "—"})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    <FormField control={resForm.control} name="branch" render={({ field }) => <FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="Head Office" data-testid="input-res-branch" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  </div>
                  {resSelectedReseller && (
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-md p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Wallet Balance</p>
                        <p className={`text-lg font-bold ${Number(resSelectedReseller.walletBalance || 0) < 0 ? "text-red-600 dark:text-red-400" : "text-purple-600 dark:text-purple-400"}`} data-testid="text-res-wallet">Rs. {Number(resSelectedReseller.walletBalance || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Credit Limit</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">Rs. {Number(resSelectedReseller.creditLimit || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 border rounded-md p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Customers</p>
                        <p className="text-lg font-bold">{resSelectedReseller.totalCustomers || 0}</p>
                        <p className="text-[10px] text-muted-foreground">{resSelectedReseller.commissionRate || "0"}% comm.</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Security Deposit</p>
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">Rs. {Number(resSelectedReseller.securityDeposit || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={resForm.control} name="createdBy" render={({ field }) => <FormItem><FormLabel>Account Manager</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger data-testid="select-res-acct-mgr"><SelectValue placeholder="Select officer" /></SelectTrigger></FormControl><SelectContent>{employees.filter(e => e.status === "active").map(e => <SelectItem key={e.id} value={e.fullName}>{e.fullName} — {e.designation}</SelectItem>)}<SelectItem value="admin">Admin</SelectItem></SelectContent></Select></FormItem>} />
                    <FormField control={resForm.control} name="costCenter" render={({ field }) => <FormItem><FormLabel>Collection Type</FormLabel><Select onValueChange={field.onChange} value={field.value || "wallet_topup"}><FormControl><SelectTrigger data-testid="select-res-col-type"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="wallet_topup">Wallet Top-up</SelectItem><SelectItem value="credit_settlement">Credit Settlement</SelectItem><SelectItem value="commission_adjustment">Commission Adjustment</SelectItem><SelectItem value="security_deposit">Security Deposit Payment</SelectItem><SelectItem value="penalty_recovery">Penalty Recovery</SelectItem></SelectContent></Select></FormItem>} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" />Section B — Payment Details</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={resForm.control} name="date" render={({ field }) => <FormItem><FormLabel>Collection Date</FormLabel><FormControl><Input type="date" data-testid="input-res-date" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={resForm.control} name="paymentMethod" render={({ field }) => <FormItem><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} value={field.value || "bank_transfer"}><FormControl><SelectTrigger data-testid="select-res-pay-method"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="online">Online Gateway</SelectItem><SelectItem value="cash">Cash</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={resForm.control} name="amount" render={({ field }) => <FormItem><FormLabel>Amount Received (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" data-testid="input-res-amount" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={resForm.control} name="reference" render={({ field }) => <FormItem><FormLabel>Transaction Reference</FormLabel><FormControl><Input placeholder="Bank ref / Receipt #" data-testid="input-res-reference" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <FormField control={resForm.control} name="chequeNumber" render={({ field }) => <FormItem><FormLabel>Cheque / Bank Name</FormLabel><FormControl><Input placeholder="If cheque / bank" data-testid="input-res-cheque" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={resForm.control} name="tax" render={({ field }) => <FormItem><FormLabel>Commission Adj. (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-res-commission" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <FormField control={resForm.control} name="discount" render={({ field }) => <FormItem><FormLabel>Discount (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-res-discount" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-md border border-green-200 dark:border-green-800 flex flex-col justify-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Net Collection</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300" data-testid="text-res-net">Rs. {(Number(resForm.watch("amount") || 0) + Number(resForm.watch("tax") || 0) - Number(resForm.watch("discount") || 0)).toLocaleString()}</p>
                    </div>
                  </div>
                  <FormField control={resForm.control} name="description" render={({ field }) => <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={2} placeholder="Reseller collection notes..." data-testid="input-res-notes" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />Section C — Accounting Posting</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={resForm.control} name="debitAccountId" render={({ field }) => <FormItem><FormLabel>Debit: Cash / Bank</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-res-debit"><SelectValue placeholder="Select debit account" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Auto-select</SelectItem>{accountsList.filter(a => a.type === "asset").map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                    <FormField control={resForm.control} name="creditAccountId" render={({ field }) => <FormItem><FormLabel>Credit: Reseller Wallet / AR</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-res-credit"><SelectValue placeholder="Select credit account" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Auto-select</SelectItem>{accountsList.filter(a => a.type === "asset" || a.type === "liability").map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Settings className="h-3.5 w-3.5" />Section D — Collection Controls</h4>
                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <FormField control={resForm.control} name="autoAdjustReceivable" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Add to wallet balance</FormLabel></FormItem>} />
                    <FormField control={resForm.control} name="allowPartialPayment" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Adjust against credit</FormLabel></FormItem>} />
                    <FormField control={resForm.control} name="sendNotification" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Send receipt notification</FormLabel></FormItem>} />
                    <FormField control={resForm.control} name="lockAfterSave" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Lock after save</FormLabel></FormItem>} />
                    <FormField control={resForm.control} name="requireApproval" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Require approval</FormLabel></FormItem>} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setResFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-res-collection">
                  {createMutation.isPending ? "Recording..." : "Record Reseller Collection"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== CORPORATE COLLECTION DETAIL DRAWER ===== */}
      <Dialog open={!!corpDetailTxn} onOpenChange={(open) => { if (!open) setCorpDetailTxn(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {corpDetailTxn && (() => {
            const txn = corpDetailTxn;
            const sc = statusColors[txn.status] || statusColors.completed;
            const StatusIcon = sc.icon;
            const corp = txn.customerId ? corpCustomerMap.get(txn.customerId) : null;
            const debitAcc = accountsList.find(a => a.id === txn.debitAccountId);
            const creditAcc = accountsList.find(a => a.id === txn.creditAccountId);
            const netAmt = Number(txn.netAmount || txn.amount || 0);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-gradient-to-r from-[#0A1F44] to-[#1E40AF] flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="font-mono text-base">{txn.txnId}</span>
                      <p className="text-xs text-muted-foreground">Corporate Collection — {corp?.companyName || "Unknown"}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-md p-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div><p className="text-[10px] text-muted-foreground uppercase">Amount Received</p><p className="text-xl font-bold text-green-700 dark:text-green-300">Rs. {netAmt.toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase">Monthly Billing</p><p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">Rs. {corp ? Number(corp.monthlyBilling || 0).toLocaleString() : "—"}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase">Credit Limit</p><p className="text-xl font-bold">Rs. {corp ? Number(corp.creditLimit || 0).toLocaleString() : "—"}</p></div>
                    </div>
                  </div>
                  {corp && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Corporate Details</h4>
                        <DRow label="Company" value={corp.companyName} />
                        <DRow label="Registration" value={corp.registrationNumber || "—"} />
                        <DRow label="NTN" value={corp.ntn || "—"} />
                        <DRow label="Industry" value={corp.industryType || "—"} />
                        <DRow label="Payment Terms" value={paymentTermLabels[corp.paymentTerms || ""] || corp.paymentTerms || "—"} />
                        <DRow label="Contract" value={corp.contractDuration || "—"} />
                      </div>
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Contact Info</h4>
                        <DRow label="Account Manager" value={corp.accountManager || "—"} />
                        <DRow label="Email" value={corp.email || "—"} />
                        <DRow label="Phone" value={corp.phone || "—"} />
                        <DRow label="Head Office" value={corp.headOfficeAddress || "—"} />
                        <DRow label="Billing Address" value={corp.billingAddress || "—"} />
                        <DRow label="Custom SLA" value={corp.customSla || "—"} />
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />Journal Entry</h4>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader><TableRow className="bg-slate-100 dark:bg-slate-800"><TableHead className="text-xs font-semibold">Account</TableHead><TableHead className="text-xs font-semibold text-right">Debit (Rs.)</TableHead><TableHead className="text-xs font-semibold text-right">Credit (Rs.)</TableHead></TableRow></TableHeader>
                        <TableBody>
                          <TableRow><TableCell className="text-sm">{debitAcc ? `${debitAcc.code} — ${debitAcc.name}` : "Bank / Cash Account"}</TableCell><TableCell className="text-right font-semibold text-blue-700 dark:text-blue-300">Rs. {netAmt.toLocaleString()}</TableCell><TableCell className="text-right text-muted-foreground">—</TableCell></TableRow>
                          <TableRow><TableCell className="text-sm">{creditAcc ? `${creditAcc.code} — ${creditAcc.name}` : "Accounts Receivable – Corporate"}</TableCell><TableCell className="text-right text-muted-foreground">—</TableCell><TableCell className="text-right font-semibold text-amber-700 dark:text-amber-300">Rs. {netAmt.toLocaleString()}</TableCell></TableRow>
                          <TableRow className="bg-slate-50 dark:bg-slate-900 font-semibold"><TableCell className="text-xs uppercase">Total</TableCell><TableCell className="text-right text-sm">Rs. {netAmt.toLocaleString()}</TableCell><TableCell className="text-right text-sm">Rs. {netAmt.toLocaleString()}</TableCell></TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs"><CheckCircle className="h-3.5 w-3.5 text-green-600" /><span className="text-green-700 dark:text-green-300 font-medium">Debit & Credit balanced</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Payment Details</h4>
                      <DRow label="Date" value={txn.date} />
                      <DRow label="Status" value={<Badge variant="outline" className={`no-default-active-elevate text-[10px] ${sc.color}`}><StatusIcon className="h-3 w-3 mr-1" />{sc.label}</Badge>} />
                      <DRow label="Payment Method" value={paymentMethodLabels[txn.paymentMethod || ""] || txn.paymentMethod || "—"} />
                      <DRow label="Reference" value={txn.reference || "—"} />
                      <DRow label="Cheque #" value={txn.chequeNumber || "—"} />
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Financial Info</h4>
                      <DRow label="Amount" value={`Rs. ${Number(txn.amount).toLocaleString()}`} />
                      <DRow label="Late Fee" value={`Rs. ${Number(txn.tax || 0).toLocaleString()}`} />
                      <DRow label="Discount" value={`Rs. ${Number(txn.discount || 0).toLocaleString()}`} />
                      <DRow label="Net Amount" value={`Rs. ${netAmt.toLocaleString()}`} />
                      <DRow label="Branch" value={txn.branch || "—"} />
                    </div>
                  </div>
                  {txn.description && <div><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</h4><p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{txn.description}</p></div>}
                  {txn.createdAt && <div className="text-[10px] text-muted-foreground border-t pt-2">Recorded: {new Date(txn.createdAt).toLocaleString()}{txn.createdBy ? ` by ${txn.createdBy}` : ""}</div>}
                </div>
                <DialogFooter className="flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCorpDetailTxn(null)}>Close</Button>
                  <Button variant="outline" size="sm" onClick={() => printVoucher(txn)}><Printer className="h-3.5 w-3.5 mr-1" />Print Receipt</Button>
                  {txn.status === "completed" && <Button variant="outline" size="sm" className="text-amber-600 border-amber-300" onClick={() => { reverseMutation.mutate(txn.id); setCorpDetailTxn(null); }}><RotateCcw className="h-3.5 w-3.5 mr-1" />Reverse</Button>}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== CORPORATE CUSTOMER DETAIL DRAWER ===== */}
      <Dialog open={!!corpDetailCustomer} onOpenChange={(open) => { if (!open) setCorpDetailCustomer(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {corpDetailCustomer && (() => {
            const corp = corpDetailCustomer;
            const cs = corpStatusColorMap[corp.status] || corpStatusColorMap.active;
            const corpPayments = corpCollectionTxns.filter(t => t.customerId === corp.id && t.status !== "reversed");
            const totalPaid = corpPayments.reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
            const lastPayment = corpPayments.length > 0 ? corpPayments.sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0] : null;
            const creditUsed = Number(corp.monthlyBilling || 0);
            const creditAvailable = Math.max(0, Number(corp.creditLimit || 0) - creditUsed);
            const utilPct = Number(corp.creditLimit || 0) > 0 ? Math.round((creditUsed / Number(corp.creditLimit || 0)) * 100) : 0;
            const services: string[] = [];
            if (corp.managedRouter) services.push("Managed Router");
            if (corp.firewall) services.push("Firewall");
            if (corp.loadBalancer) services.push("Load Balancer");
            if (corp.dedicatedSupport) services.push("Dedicated Support");
            if (corp.backupLink) services.push("Backup Link");
            if (corp.monitoringSla) services.push("SLA Monitoring");
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-gradient-to-r from-[#0A1F44] to-[#1E40AF] flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-base font-bold">{corp.companyName}</span>
                      <p className="text-xs text-muted-foreground">Corporate Client — {corp.industryType || "Enterprise"}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="bg-gradient-to-r from-[#0A1F44] to-[#1E40AF] rounded-md p-4 text-white">
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div><p className="text-[10px] text-white/60 uppercase">Monthly Billing</p><p className="text-lg font-bold">Rs. {Number(corp.monthlyBilling || 0).toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-white/60 uppercase">Credit Limit</p><p className="text-lg font-bold">Rs. {Number(corp.creditLimit || 0).toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-white/60 uppercase">Total Paid</p><p className="text-lg font-bold">Rs. {totalPaid.toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-white/60 uppercase">Credit Avail.</p><p className="text-lg font-bold">Rs. {creditAvailable.toLocaleString()}</p></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Company Profile</h4>
                      <DRow label="Registration" value={corp.registrationNumber || "—"} />
                      <DRow label="NTN" value={corp.ntn || "—"} />
                      <DRow label="Industry" value={corp.industryType || "—"} />
                      <DRow label="Status" value={<Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${cs.color}`}>{cs.label}</Badge>} />
                      <DRow label="Contract Duration" value={corp.contractDuration || "—"} />
                      <DRow label="Custom SLA" value={corp.customSla || "—"} />
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Financial</h4>
                      <DRow label="Payment Terms" value={paymentTermLabels[corp.paymentTerms || ""] || corp.paymentTerms || "—"} />
                      <DRow label="Monthly Billing" value={`Rs. ${Number(corp.monthlyBilling || 0).toLocaleString()}`} />
                      <DRow label="Credit Limit" value={`Rs. ${Number(corp.creditLimit || 0).toLocaleString()}`} />
                      <DRow label="Credit Utilization" value={`${utilPct}%`} />
                      <DRow label="Security Deposit" value={`Rs. ${Number(corp.securityDeposit || 0).toLocaleString()}`} />
                      <DRow label="Billing Type" value={corp.centralizedBilling ? "Centralized" : corp.perBranchBilling ? "Per Branch" : "Standard"} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Contact</h4>
                      <DRow label="Account Manager" value={corp.accountManager || "—"} />
                      <DRow label="Dedicated AM" value={corp.dedicatedAccountManager || "—"} />
                      <DRow label="Email" value={corp.email || "—"} />
                      <DRow label="Phone" value={corp.phone || "—"} />
                      <DRow label="Head Office" value={corp.headOfficeAddress || "—"} />
                      <DRow label="Billing Address" value={corp.billingAddress || "—"} />
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Technical</h4>
                      <DRow label="Total Connections" value={corp.totalConnections || 0} />
                      <DRow label="Total Bandwidth" value={corp.totalBandwidth || "—"} />
                      <DRow label="Services" value={services.length > 0 ? services.join(", ") : "None"} />
                      <DRow label="Custom Invoice" value={corp.customInvoiceFormat || "Standard"} />
                      <DRow label="Custom Pricing" value={corp.customPricingAgreement || "—"} />
                    </div>
                  </div>
                  {lastPayment && (
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-3">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">Last Payment</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{lastPayment.txnId} — {lastPayment.date}</span>
                        <span className="text-sm font-bold text-green-700 dark:text-green-300">Rs. {Number(lastPayment.netAmount || lastPayment.amount).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {corp.notes && <div><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</h4><p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{corp.notes}</p></div>}
                </div>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setCorpDetailCustomer(null)}>Close</Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== RECORD CORPORATE COLLECTION FORM ===== */}
      <Dialog open={corpFormOpen} onOpenChange={setCorpFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#0A1F44] to-[#1E40AF] flex items-center justify-center"><Building2 className="h-4 w-4 text-white" /></div>
              Record Corporate Collection
            </DialogTitle>
          </DialogHeader>
          <Form {...corpForm}>
            <form onSubmit={corpForm.handleSubmit(onCorpSubmit)} className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Landmark className="h-3.5 w-3.5" />Section A — Corporate Client Details</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={corpForm.control} name="customerId" render={({ field }) => <FormItem><FormLabel>Corporate Client</FormLabel><Select onValueChange={(v) => { field.onChange(v === "none" ? null : parseInt(v)); }} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-corp-form-customer"><SelectValue placeholder="Select company" /></SelectTrigger></FormControl><SelectContent>{corpCustomers.filter(c => c.status === "active").map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName} ({c.industryType})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    <FormField control={corpForm.control} name="branch" render={({ field }) => <FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="Head Office" data-testid="input-corp-branch" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  </div>
                  {corpSelectedCust && (
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-md p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Monthly Billing</p>
                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400" data-testid="text-corp-monthly">Rs. {Number(corpSelectedCust.monthlyBilling || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Credit Limit</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">Rs. {Number(corpSelectedCust.creditLimit || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 border rounded-md p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Connections</p>
                        <p className="text-lg font-bold">{corpSelectedCust.totalConnections || 0}</p>
                        <p className="text-[10px] text-muted-foreground">{corpSelectedCust.totalBandwidth || "—"}</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Payment Terms</p>
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{paymentTermLabels[corpSelectedCust.paymentTerms || ""] || corpSelectedCust.paymentTerms || "—"}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={corpForm.control} name="createdBy" render={({ field }) => <FormItem><FormLabel>Account Manager</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger data-testid="select-corp-acct-mgr"><SelectValue placeholder="Select officer" /></SelectTrigger></FormControl><SelectContent>{employees.filter(e => e.status === "active").map(e => <SelectItem key={e.id} value={e.fullName}>{e.fullName} — {e.designation}</SelectItem>)}<SelectItem value="admin">Admin</SelectItem></SelectContent></Select></FormItem>} />
                    <FormField control={corpForm.control} name="costCenter" render={({ field }) => <FormItem><FormLabel>Recovery Officer</FormLabel><FormControl><Input placeholder="Recovery officer name" data-testid="input-corp-recovery" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" />Section B — Payment Details</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={corpForm.control} name="date" render={({ field }) => <FormItem><FormLabel>Collection Date</FormLabel><FormControl><Input type="date" data-testid="input-corp-date" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={corpForm.control} name="paymentMethod" render={({ field }) => <FormItem><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} value={field.value || "bank_transfer"}><FormControl><SelectTrigger data-testid="select-corp-pay-method"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="online">Online Gateway</SelectItem><SelectItem value="cash">Cash</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={corpForm.control} name="amount" render={({ field }) => <FormItem><FormLabel>Amount Received (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" data-testid="input-corp-amount" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={corpForm.control} name="reference" render={({ field }) => <FormItem><FormLabel>Transaction Reference</FormLabel><FormControl><Input placeholder="Bank ref / RTGS #" data-testid="input-corp-reference" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <FormField control={corpForm.control} name="chequeNumber" render={({ field }) => <FormItem><FormLabel>Cheque / Bank Name</FormLabel><FormControl><Input placeholder="If cheque / bank" data-testid="input-corp-cheque" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={corpForm.control} name="tax" render={({ field }) => <FormItem><FormLabel>Late Fee (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-corp-late-fee" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <FormField control={corpForm.control} name="discount" render={({ field }) => <FormItem><FormLabel>Discount / Write-off (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-corp-discount" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-md border border-green-200 dark:border-green-800 flex flex-col justify-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Net Collection</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300" data-testid="text-corp-net">Rs. {(Number(corpForm.watch("amount") || 0) + Number(corpForm.watch("tax") || 0) - Number(corpForm.watch("discount") || 0)).toLocaleString()}</p>
                    </div>
                  </div>
                  <FormField control={corpForm.control} name="description" render={({ field }) => <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={2} placeholder="Corporate collection notes..." data-testid="input-corp-notes" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />Section C — Accounting Posting</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={corpForm.control} name="debitAccountId" render={({ field }) => <FormItem><FormLabel>Debit: Bank / Cash</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-corp-debit"><SelectValue placeholder="Select debit account" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Auto-select</SelectItem>{accountsList.filter(a => a.type === "asset").map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                    <FormField control={corpForm.control} name="creditAccountId" render={({ field }) => <FormItem><FormLabel>Credit: AR – Corporate</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-corp-credit"><SelectValue placeholder="Select credit account" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Auto-select</SelectItem>{accountsList.filter(a => a.type === "asset" || a.type === "liability").map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Settings className="h-3.5 w-3.5" />Section D — Collection Controls</h4>
                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <FormField control={corpForm.control} name="autoAdjustReceivable" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Apply to selected invoice</FormLabel></FormItem>} />
                    <FormField control={corpForm.control} name="allowPartialPayment" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Auto-adjust oldest invoices</FormLabel></FormItem>} />
                    <FormField control={corpForm.control} name="sendNotification" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Send receipt notification</FormLabel></FormItem>} />
                    <FormField control={corpForm.control} name="lockAfterSave" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Lock after save</FormLabel></FormItem>} />
                    <FormField control={corpForm.control} name="requireApproval" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Require approval</FormLabel></FormItem>} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setCorpFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-corp-collection">
                  {createMutation.isPending ? "Recording..." : "Record Corporate Collection"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== CIR COLLECTION DETAIL DRAWER ===== */}
      <Dialog open={!!cirDetailTxn} onOpenChange={(open) => { if (!open) setCirDetailTxn(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {cirDetailTxn && (() => {
            const txn = cirDetailTxn;
            const sc = statusColors[txn.status] || statusColors.completed;
            const StatusIcon = sc.icon;
            const cir = txn.customerId ? cirCustomerMap.get(txn.customerId) : null;
            const debitAcc = accountsList.find(a => a.id === txn.debitAccountId);
            const creditAcc = accountsList.find(a => a.id === txn.creditAccountId);
            const netAmt = Number(txn.netAmount || txn.amount || 0);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-gradient-to-r from-[#0B1F3A] to-[#1D4ED8] flex items-center justify-center">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="font-mono text-base">{txn.txnId}</span>
                      <p className="text-xs text-muted-foreground">CIR Collection — {cir?.companyName || "Unknown"}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-md p-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div><p className="text-[10px] text-muted-foreground uppercase">Amount Received</p><p className="text-xl font-bold text-green-700 dark:text-green-300">Rs. {netAmt.toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase">Monthly Charges</p><p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">Rs. {cir ? Number(cir.monthlyCharges || 0).toLocaleString() : "—"}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase">Contract</p><p className="text-xl font-bold">CIR-{cir ? String(cir.id).padStart(4, "0") : "—"}</p></div>
                    </div>
                  </div>
                  {cir && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Contract Details</h4>
                        <DRow label="Bandwidth" value={cir.committedBandwidth || "—"} />
                        <DRow label="Burst" value={cir.burstBandwidth || "—"} />
                        <DRow label="SLA Level" value={cir.slaLevel || "—"} />
                        <DRow label="Contract Start" value={cir.contractStartDate || "—"} />
                        <DRow label="Contract End" value={cir.contractEndDate || "—"} />
                        <DRow label="Grace Period" value={cir.lateFeePolicy || "—"} />
                      </div>
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Client Info</h4>
                        <DRow label="Company" value={cir.companyName} />
                        <DRow label="Contact" value={cir.contactPerson || "—"} />
                        <DRow label="Phone" value={cir.phone || "—"} />
                        <DRow label="Email" value={cir.email || "—"} />
                        <DRow label="Static IP" value={cir.staticIp || "—"} />
                        <DRow label="VLAN" value={cir.vlanId || "—"} />
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />Journal Entry</h4>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader><TableRow className="bg-slate-100 dark:bg-slate-800"><TableHead className="text-xs font-semibold">Account</TableHead><TableHead className="text-xs font-semibold text-right">Debit (Rs.)</TableHead><TableHead className="text-xs font-semibold text-right">Credit (Rs.)</TableHead></TableRow></TableHeader>
                        <TableBody>
                          <TableRow><TableCell className="text-sm">{debitAcc ? `${debitAcc.code} — ${debitAcc.name}` : "Bank / Cash Account"}</TableCell><TableCell className="text-right font-semibold text-blue-700 dark:text-blue-300">Rs. {netAmt.toLocaleString()}</TableCell><TableCell className="text-right text-muted-foreground">—</TableCell></TableRow>
                          <TableRow><TableCell className="text-sm">{creditAcc ? `${creditAcc.code} — ${creditAcc.name}` : "Accounts Receivable – CIR"}</TableCell><TableCell className="text-right text-muted-foreground">—</TableCell><TableCell className="text-right font-semibold text-amber-700 dark:text-amber-300">Rs. {netAmt.toLocaleString()}</TableCell></TableRow>
                          <TableRow className="bg-slate-50 dark:bg-slate-900 font-semibold"><TableCell className="text-xs uppercase">Total</TableCell><TableCell className="text-right text-sm">Rs. {netAmt.toLocaleString()}</TableCell><TableCell className="text-right text-sm">Rs. {netAmt.toLocaleString()}</TableCell></TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs"><CheckCircle className="h-3.5 w-3.5 text-green-600" /><span className="text-green-700 dark:text-green-300 font-medium">Debit & Credit balanced</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Payment Details</h4>
                      <DRow label="Date" value={txn.date} />
                      <DRow label="Status" value={<Badge variant="outline" className={`no-default-active-elevate text-[10px] ${sc.color}`}><StatusIcon className="h-3 w-3 mr-1" />{sc.label}</Badge>} />
                      <DRow label="Payment Method" value={paymentMethodLabels[txn.paymentMethod || ""] || txn.paymentMethod || "—"} />
                      <DRow label="Reference" value={txn.reference || "—"} />
                      <DRow label="Cheque #" value={txn.chequeNumber || "—"} />
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Financial Info</h4>
                      <DRow label="Amount" value={`Rs. ${Number(txn.amount).toLocaleString()}`} />
                      <DRow label="Tax" value={`Rs. ${Number(txn.tax || 0).toLocaleString()}`} />
                      <DRow label="Discount" value={`Rs. ${Number(txn.discount || 0).toLocaleString()}`} />
                      <DRow label="Net Amount" value={`Rs. ${netAmt.toLocaleString()}`} />
                      <DRow label="Branch" value={txn.branch || "—"} />
                    </div>
                  </div>
                  {txn.description && <div><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</h4><p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{txn.description}</p></div>}
                  {txn.createdAt && <div className="text-[10px] text-muted-foreground border-t pt-2">Recorded: {new Date(txn.createdAt).toLocaleString()}{txn.createdBy ? ` by ${txn.createdBy}` : ""}</div>}
                </div>
                <DialogFooter className="flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCirDetailTxn(null)}>Close</Button>
                  <Button variant="outline" size="sm" onClick={() => printVoucher(txn)}><Printer className="h-3.5 w-3.5 mr-1" />Print Receipt</Button>
                  {txn.status === "completed" && <Button variant="outline" size="sm" className="text-amber-600 border-amber-300" onClick={() => { reverseMutation.mutate(txn.id); setCirDetailTxn(null); }}><RotateCcw className="h-3.5 w-3.5 mr-1" />Reverse</Button>}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== CIR CUSTOMER DETAIL DRAWER ===== */}
      <Dialog open={!!cirDetailCustomer} onOpenChange={(open) => { if (!open) setCirDetailCustomer(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {cirDetailCustomer && (() => {
            const cir = cirDetailCustomer;
            const cs = cirStatusColors[cir.status] || cirStatusColors.active;
            const slaClass = slaColors[cir.slaLevel || ""] || slaColors.Silver;
            const cirPayments = cirCollectionTxns.filter(t => t.customerId === cir.id && t.status !== "reversed");
            const totalPaid = cirPayments.reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0);
            const lastPayment = cirPayments.length > 0 ? cirPayments.sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0] : null;
            const daysUntilExpiry = cir.contractEndDate ? Math.ceil((new Date(cir.contractEndDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)) : null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-gradient-to-r from-[#0B1F3A] to-[#1D4ED8] flex items-center justify-center">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-base font-bold">{cir.companyName}</span>
                      <p className="text-xs text-muted-foreground">CIR Customer — {cir.contactPerson}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1D4ED8] rounded-md p-4 text-white">
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div><p className="text-[10px] text-white/60 uppercase">Monthly</p><p className="text-lg font-bold">Rs. {Number(cir.monthlyCharges || 0).toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-white/60 uppercase">Bandwidth</p><p className="text-lg font-bold">{cir.committedBandwidth || "—"}</p></div>
                      <div><p className="text-[10px] text-white/60 uppercase">Total Paid</p><p className="text-lg font-bold">Rs. {totalPaid.toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-white/60 uppercase">Status</p><p className="text-lg font-bold capitalize">{cir.status}</p></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Contract</h4>
                      <DRow label="Contract ID" value={`CIR-${String(cir.id).padStart(4, "0")}`} />
                      <DRow label="SLA Level" value={<Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ${slaClass}`}>{cir.slaLevel || "—"}</Badge>} />
                      <DRow label="Start Date" value={cir.contractStartDate || "—"} />
                      <DRow label="End Date" value={cir.contractEndDate || "—"} />
                      <DRow label="Days Until Expiry" value={daysUntilExpiry !== null ? (daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : "Expired") : "—"} />
                      <DRow label="Auto Renewal" value={cir.autoRenewal ? "Yes" : "No"} />
                      <DRow label="Late Fee Policy" value={cir.lateFeePolicy || "—"} />
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Technical</h4>
                      <DRow label="Committed BW" value={cir.committedBandwidth || "—"} />
                      <DRow label="Burst BW" value={cir.burstBandwidth || "—"} />
                      <DRow label="Contention" value={cir.contentionRatio || "—"} />
                      <DRow label="Static IP" value={cir.staticIp || "—"} />
                      <DRow label="VLAN" value={cir.vlanId || "—"} />
                      <DRow label="Monitoring" value={cir.monitoringEnabled ? "Enabled" : "Disabled"} />
                      <DRow label="SNMP" value={cir.snmpMonitoring ? "Enabled" : "Disabled"} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Financial</h4>
                      <DRow label="Monthly Charges" value={`Rs. ${Number(cir.monthlyCharges || 0).toLocaleString()}`} />
                      <DRow label="Installation" value={`Rs. ${Number(cir.installationCharges || 0).toLocaleString()}`} />
                      <DRow label="Security Deposit" value={`Rs. ${Number(cir.securityDeposit || 0).toLocaleString()}`} />
                      <DRow label="Billing Cycle" value={cir.billingCycle || "Monthly"} />
                      <DRow label="Invoice Type" value={cir.invoiceType || "Tax"} />
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Contact</h4>
                      <DRow label="Email" value={cir.email || "—"} />
                      <DRow label="Phone" value={cir.phone || "—"} />
                      <DRow label="Address" value={cir.address || "—"} />
                      <DRow label="City" value={cir.city || "—"} />
                      <DRow label="Branch" value={cir.branch || "—"} />
                      <DRow label="NTN" value={cir.ntn || "—"} />
                    </div>
                  </div>
                  {lastPayment && (
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-3">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">Last Payment</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{lastPayment.txnId} — {lastPayment.date}</span>
                        <span className="text-sm font-bold text-green-700 dark:text-green-300">Rs. {Number(lastPayment.netAmount || lastPayment.amount).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {cir.notes && <div><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</h4><p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{cir.notes}</p></div>}
                </div>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setCirDetailCustomer(null)}>Close</Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== RECORD CIR COLLECTION FORM ===== */}
      <Dialog open={cirFormOpen} onOpenChange={setCirFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#0B1F3A] to-[#1D4ED8] flex items-center justify-center"><Globe className="h-4 w-4 text-white" /></div>
              Record CIR Customer Collection
            </DialogTitle>
          </DialogHeader>
          <Form {...cirForm}>
            <form onSubmit={cirForm.handleSubmit(onCirSubmit)} className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Section A — CIR Customer & Contract</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={cirForm.control} name="customerId" render={({ field }) => <FormItem><FormLabel>CIR Customer</FormLabel><Select onValueChange={(v) => { field.onChange(v === "none" ? null : parseInt(v)); }} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-cir-form-customer"><SelectValue placeholder="Select CIR customer" /></SelectTrigger></FormControl><SelectContent>{cirCustomers.filter(c => c.status === "active").map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName} ({c.committedBandwidth})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    <FormField control={cirForm.control} name="branch" render={({ field }) => <FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="Head Office" data-testid="input-cir-branch" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  </div>
                  {cirSelectedCust && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-md p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Monthly Charges</p>
                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400" data-testid="text-cir-monthly">Rs. {Number(cirSelectedCust.monthlyCharges || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Bandwidth</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{cirSelectedCust.committedBandwidth}</p>
                        <p className="text-[10px] text-muted-foreground">SLA: {cirSelectedCust.slaLevel}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 border rounded-md p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Contract</p>
                        <p className="text-lg font-bold">CIR-{String(cirSelectedCust.id).padStart(4, "0")}</p>
                        <p className="text-[10px] text-muted-foreground">Ends: {cirSelectedCust.contractEndDate || "—"}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={cirForm.control} name="createdBy" render={({ field }) => <FormItem><FormLabel>Account Manager</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger data-testid="select-cir-officer"><SelectValue placeholder="Select officer" /></SelectTrigger></FormControl><SelectContent>{employees.filter(e => e.status === "active").map(e => <SelectItem key={e.id} value={e.fullName}>{e.fullName} — {e.designation}</SelectItem>)}<SelectItem value="admin">Admin</SelectItem></SelectContent></Select></FormItem>} />
                    <FormField control={cirForm.control} name="costCenter" render={({ field }) => <FormItem><FormLabel>Recovery Officer</FormLabel><FormControl><Input placeholder="Recovery officer name" data-testid="input-cir-recovery" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" />Section B — Payment Details</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={cirForm.control} name="date" render={({ field }) => <FormItem><FormLabel>Collection Date</FormLabel><FormControl><Input type="date" data-testid="input-cir-date" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={cirForm.control} name="paymentMethod" render={({ field }) => <FormItem><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} value={field.value || "bank_transfer"}><FormControl><SelectTrigger data-testid="select-cir-pay-method"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="online">Online Gateway</SelectItem><SelectItem value="cash">Cash</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={cirForm.control} name="amount" render={({ field }) => <FormItem><FormLabel>Amount Received (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" data-testid="input-cir-amount" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={cirForm.control} name="reference" render={({ field }) => <FormItem><FormLabel>Transaction Reference</FormLabel><FormControl><Input placeholder="Bank ref / RTGS #" data-testid="input-cir-reference" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <FormField control={cirForm.control} name="chequeNumber" render={({ field }) => <FormItem><FormLabel>Cheque / Bank Name</FormLabel><FormControl><Input placeholder="If cheque / bank" data-testid="input-cir-cheque" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={cirForm.control} name="tax" render={({ field }) => <FormItem><FormLabel>Late Fee (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-cir-late-fee" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <FormField control={cirForm.control} name="discount" render={({ field }) => <FormItem><FormLabel>SLA Compensation (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-cir-sla-comp" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-md border border-green-200 dark:border-green-800 flex flex-col justify-center">
                      <p className="text-[10px] text-muted-foreground uppercase">Net Collection</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300" data-testid="text-cir-net">Rs. {(Number(cirForm.watch("amount") || 0) + Number(cirForm.watch("tax") || 0) - Number(cirForm.watch("discount") || 0)).toLocaleString()}</p>
                    </div>
                  </div>
                  <FormField control={cirForm.control} name="description" render={({ field }) => <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={2} placeholder="CIR collection notes..." data-testid="input-cir-notes" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />Section C — Accounting Posting</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={cirForm.control} name="debitAccountId" render={({ field }) => <FormItem><FormLabel>Debit: Bank / Cash</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-cir-debit"><SelectValue placeholder="Select debit account" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Auto-select</SelectItem>{accountsList.filter(a => a.type === "asset").map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                    <FormField control={cirForm.control} name="creditAccountId" render={({ field }) => <FormItem><FormLabel>Credit: AR – CIR</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-cir-credit"><SelectValue placeholder="Select credit account" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Auto-select</SelectItem>{accountsList.filter(a => a.type === "asset" || a.type === "liability").map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Settings className="h-3.5 w-3.5" />Section D — Collection Controls</h4>
                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <FormField control={cirForm.control} name="autoAdjustReceivable" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Apply to specific invoice</FormLabel></FormItem>} />
                    <FormField control={cirForm.control} name="allowPartialPayment" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Auto-adjust oldest invoice</FormLabel></FormItem>} />
                    <FormField control={cirForm.control} name="sendNotification" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Send receipt notification</FormLabel></FormItem>} />
                    <FormField control={cirForm.control} name="lockAfterSave" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Lock after save</FormLabel></FormItem>} />
                    <FormField control={cirForm.control} name="requireApproval" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Require approval</FormLabel></FormItem>} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setCirFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-cir-collection">
                  {createMutation.isPending ? "Recording..." : "Record CIR Collection"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== COLLECTION DETAIL DRAWER ===== */}
      <Dialog open={!!colDetailTxn} onOpenChange={(open) => { if (!open) setColDetailTxn(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {colDetailTxn && (() => {
            const txn = colDetailTxn;
            const sc = statusColors[txn.status] || statusColors.completed;
            const StatusIcon = sc.icon;
            const customer = customers.find(c => c.id === txn.customerId);
            const inv = txn.invoiceId ? invoices.find(i => i.id === txn.invoiceId) : null;
            const debitAcc = accountsList.find(a => a.id === txn.debitAccountId);
            const creditAcc = accountsList.find(a => a.id === txn.creditAccountId);
            const netAmt = Number(txn.netAmount || txn.amount || 0);
            const custData = txn.customerId ? customerOutstanding[txn.customerId] : null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                      <Banknote className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="font-mono text-base">{txn.txnId}</span>
                      <p className="text-xs text-muted-foreground">Customer Collection — {customer?.fullName || "Unknown"}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div><p className="text-[10px] text-muted-foreground uppercase">Amount Received</p><p className="text-xl font-bold text-green-700 dark:text-green-300">Rs. {netAmt.toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase">Customer Outstanding</p><p className="text-xl font-bold text-red-600 dark:text-red-400">Rs. {custData ? custData.outstanding.toLocaleString() : "—"}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase">Invoice</p><p className="text-xl font-bold">{inv ? inv.invoiceNumber : "—"}</p></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />Journal Entry</h4>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader><TableRow className="bg-slate-100 dark:bg-slate-800"><TableHead className="text-xs font-semibold">Account</TableHead><TableHead className="text-xs font-semibold text-right">Debit (Rs.)</TableHead><TableHead className="text-xs font-semibold text-right">Credit (Rs.)</TableHead></TableRow></TableHeader>
                        <TableBody>
                          <TableRow><TableCell className="text-sm">{debitAcc ? `${debitAcc.code} — ${debitAcc.name}` : "Cash / Bank Account"}</TableCell><TableCell className="text-right font-semibold text-blue-700 dark:text-blue-300">Rs. {netAmt.toLocaleString()}</TableCell><TableCell className="text-right text-muted-foreground">—</TableCell></TableRow>
                          <TableRow><TableCell className="text-sm">{creditAcc ? `${creditAcc.code} — ${creditAcc.name}` : "Accounts Receivable"}</TableCell><TableCell className="text-right text-muted-foreground">—</TableCell><TableCell className="text-right font-semibold text-amber-700 dark:text-amber-300">Rs. {netAmt.toLocaleString()}</TableCell></TableRow>
                          <TableRow className="bg-slate-50 dark:bg-slate-900 font-semibold"><TableCell className="text-xs uppercase">Total</TableCell><TableCell className="text-right text-sm">Rs. {netAmt.toLocaleString()}</TableCell><TableCell className="text-right text-sm">Rs. {netAmt.toLocaleString()}</TableCell></TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs"><CheckCircle className="h-3.5 w-3.5 text-green-600" /><span className="text-green-700 dark:text-green-300 font-medium">Debit & Credit balanced</span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Collection Details</h4>
                      <DRow label="Date" value={txn.date} />
                      <DRow label="Status" value={<Badge variant="outline" className={`no-default-active-elevate text-[10px] ${sc.color}`}><StatusIcon className="h-3 w-3 mr-1" />{sc.label}</Badge>} />
                      <DRow label="Payment Method" value={paymentMethodLabels[txn.paymentMethod || ""] || txn.paymentMethod || "—"} />
                      <DRow label="Reference" value={txn.reference || "—"} />
                      <DRow label="Cheque #" value={txn.chequeNumber || "—"} />
                      <DRow label="Branch" value={txn.branch || "—"} />
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Customer Info</h4>
                      <DRow label="Customer" value={customer?.fullName || "—"} />
                      <DRow label="Type" value={customer?.customerType === "corporate" ? "Corporate" : "Home"} />
                      <DRow label="Phone" value={customer?.phone || "—"} />
                      <DRow label="Area" value={customer?.area || "—"} />
                      <DRow label="Invoice" value={inv ? inv.invoiceNumber : "—"} />
                      <DRow label="Invoice Amount" value={inv ? `Rs. ${Number(inv.totalAmount).toLocaleString()}` : "—"} />
                    </div>
                  </div>

                  {txn.description && <div><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</h4><p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{txn.description}</p></div>}

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Collection Flags</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { label: "Auto Adjust AR", val: txn.autoAdjustReceivable },
                        { label: "Partial Pay", val: txn.allowPartialPayment },
                        { label: "Notification", val: txn.sendNotification },
                        { label: "Locked", val: txn.lockAfterSave },
                        { label: "Recurring", val: txn.isRecurring },
                        { label: "Approval", val: txn.requireApproval },
                      ].map(f => (
                        <div key={f.label} className="p-2 rounded-md border text-center">
                          <p className="text-[9px] text-muted-foreground">{f.label}</p>
                          <p className={`text-xs font-semibold ${f.val ? "text-green-600" : "text-muted-foreground"}`}>{f.val ? "Yes" : "No"}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {txn.createdAt && <div className="text-[10px] text-muted-foreground border-t pt-2">Recorded: {new Date(txn.createdAt).toLocaleString()}{txn.createdBy ? ` by ${txn.createdBy}` : ""}</div>}
                </div>
                <DialogFooter className="flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setColDetailTxn(null)}>Close</Button>
                  <Button variant="outline" size="sm" onClick={() => printVoucher(txn)}><Printer className="h-3.5 w-3.5 mr-1" />Print Receipt</Button>
                  {txn.status === "completed" && <Button variant="outline" size="sm" className="text-amber-600 border-amber-300" onClick={() => { reverseMutation.mutate(txn.id); setColDetailTxn(null); }}><RotateCcw className="h-3.5 w-3.5 mr-1" />Reverse</Button>}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== RECORD COLLECTION FORM ===== */}
      <Dialog open={colFormOpen} onOpenChange={setColFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#002B5B] to-[#0066FF] flex items-center justify-center"><Banknote className="h-4 w-4 text-white" /></div>
              Record Customer Collection
            </DialogTitle>
          </DialogHeader>
          <Form {...colForm}>
            <form onSubmit={colForm.handleSubmit(onColSubmit)} className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Section A — Customer Details</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={colForm.control} name="customerId" render={({ field }) => <FormItem><FormLabel>Customer</FormLabel><Select onValueChange={(v) => { field.onChange(v === "none" ? null : parseInt(v)); colForm.setValue("invoiceId", null); }} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-col-customer"><SelectValue placeholder="Select customer" /></SelectTrigger></FormControl><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.fullName} ({c.customerType})</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    <FormField control={colForm.control} name="invoiceId" render={({ field }) => <FormItem><FormLabel>Invoice (Optional)</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-col-invoice"><SelectValue placeholder="Auto-suggest unpaid" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">— None (general payment) —</SelectItem>{custUnpaidInvoices.map(inv => <SelectItem key={inv.id} value={inv.id.toString()}>{inv.invoiceNumber} — Rs. {Number(inv.totalAmount).toLocaleString()} ({inv.status})</SelectItem>)}</SelectContent></Select></FormItem>} />
                  </div>
                  {colSelectedCustomer && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Total Outstanding</p>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400" data-testid="text-col-outstanding">Rs. {custOutstandingTotal.toLocaleString()}</p>
                      </div>
                      {selectedInvData && (
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                          <p className="text-[10px] text-muted-foreground uppercase">Invoice Balance</p>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">Rs. {Number(selectedInvData.totalAmount).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Due: {selectedInvData.dueDate}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={colForm.control} name="branch" render={({ field }) => <FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="Main Office" data-testid="input-col-branch" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <FormField control={colForm.control} name="createdBy" render={({ field }) => <FormItem><FormLabel>Recovery Officer</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger data-testid="select-col-officer"><SelectValue placeholder="Select officer" /></SelectTrigger></FormControl><SelectContent>{employees.filter(e => e.status === "active").map(e => <SelectItem key={e.id} value={e.fullName}>{e.fullName} — {e.designation}</SelectItem>)}<SelectItem value="admin">Admin</SelectItem></SelectContent></Select></FormItem>} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" />Section B — Payment Information</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={colForm.control} name="date" render={({ field }) => <FormItem><FormLabel>Collection Date</FormLabel><FormControl><Input type="date" data-testid="input-col-date" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={colForm.control} name="paymentMethod" render={({ field }) => <FormItem><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} value={field.value || "cash"}><FormControl><SelectTrigger data-testid="select-col-pay-method"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="online">Online Gateway</SelectItem><SelectItem value="jazzcash">JazzCash</SelectItem><SelectItem value="easypaisa">EasyPaisa</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={colForm.control} name="amount" render={({ field }) => <FormItem><FormLabel>Amount Received (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" data-testid="input-col-amount" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={colForm.control} name="reference" render={({ field }) => <FormItem><FormLabel>Transaction Reference</FormLabel><FormControl><Input placeholder="Ref # / Receipt #" data-testid="input-col-reference" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <FormField control={colForm.control} name="chequeNumber" render={({ field }) => <FormItem><FormLabel>Cheque Number</FormLabel><FormControl><Input placeholder="If cheque" data-testid="input-col-cheque" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-md border border-green-200 dark:border-green-800">
                    <p className="text-xs text-muted-foreground">Net Collection Amount</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-300" data-testid="text-col-net">Rs. {Number(colForm.watch("amount") || 0).toLocaleString()}</p>
                  </div>
                  <FormField control={colForm.control} name="description" render={({ field }) => <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={2} placeholder="Collection notes..." data-testid="input-col-notes" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />Section C — Financial Posting</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={colForm.control} name="debitAccountId" render={({ field }) => <FormItem><FormLabel>Debit: Cash / Bank Account</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-col-debit"><SelectValue placeholder="Select debit account" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Auto-select</SelectItem>{accountsList.filter(a => a.type === "asset").map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                    <FormField control={colForm.control} name="creditAccountId" render={({ field }) => <FormItem><FormLabel>Credit: Accounts Receivable</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-col-credit"><SelectValue placeholder="Select credit account" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Auto-select</SelectItem>{accountsList.filter(a => a.type === "asset" || a.type === "liability").map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Settings className="h-3.5 w-3.5" />Section D — Collection Controls</h4>
                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <FormField control={colForm.control} name="autoAdjustReceivable" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Auto adjust against oldest invoice</FormLabel></FormItem>} />
                    <FormField control={colForm.control} name="allowPartialPayment" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Allow partial payment</FormLabel></FormItem>} />
                    <FormField control={colForm.control} name="sendNotification" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Auto send SMS/Email receipt</FormLabel></FormItem>} />
                    <FormField control={colForm.control} name="lockAfterSave" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Lock after save</FormLabel></FormItem>} />
                    <FormField control={colForm.control} name="requireApproval" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Require approval</FormLabel></FormItem>} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setColFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-collection">
                  {createMutation.isPending ? "Recording..." : "Record Collection"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== DRILL-DOWN DETAIL DRAWER ===== */}
      <Dialog open={!!drawerTxn} onOpenChange={(open) => { if (!open) setDrawerTxn(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {drawerTxn && (() => {
            const txn = drawerTxn;
            const sc = statusColors[txn.status] || statusColors.completed;
            const StatusIcon = sc.icon;
            const customer = customers.find(c => c.id === txn.customerId);
            const vendor = vendors.find(v => v.id === txn.vendorId);
            const debitAcc = accountsList.find(a => a.id === txn.debitAccountId);
            const creditAcc = accountsList.find(a => a.id === txn.creditAccountId);
            const account = accountsList.find(a => a.id === txn.accountId);
            const netAmt = Number(txn.netAmount || txn.amount || 0);
            const isDebitType = txn.type === "expense" || txn.type === "debit";
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-md bg-gradient-to-r ${isDebitType ? "from-red-500 to-red-600" : "from-green-500 to-emerald-600"} flex items-center justify-center`}>
                      {isDebitType ? <ArrowUpCircle className="h-5 w-5 text-white" /> : <ArrowDownCircle className="h-5 w-5 text-white" />}
                    </div>
                    <div>
                      <span className="font-mono text-base">{txn.txnId}</span>
                      <p className="text-xs text-muted-foreground capitalize">{moduleSourceMap[txn.type] || txn.type} — {txn.category || "General"}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                  <div className={`rounded-md p-4 ${isDebitType ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800" : "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"}`}>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div><p className="text-[10px] text-muted-foreground uppercase">Amount</p><p className="text-lg font-bold">Rs. {Number(txn.amount).toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase">Tax</p><p className="text-lg font-bold">Rs. {Number(txn.tax || 0).toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase">Discount</p><p className="text-lg font-bold">Rs. {Number(txn.discount || 0).toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase">Net Amount</p><p className={`text-lg font-bold ${isDebitType ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-300"}`}>Rs. {netAmt.toLocaleString()}</p></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />Journal Entry Preview</h4>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader><TableRow className="bg-slate-100 dark:bg-slate-800"><TableHead className="text-xs font-semibold">Account</TableHead><TableHead className="text-xs font-semibold text-right">Debit (Rs.)</TableHead><TableHead className="text-xs font-semibold text-right">Credit (Rs.)</TableHead></TableRow></TableHeader>
                        <TableBody>
                          <TableRow><TableCell className="text-sm">{debitAcc ? `${debitAcc.code} — ${debitAcc.name}` : account ? `${account.code} — ${account.name}` : "Debit Account"}</TableCell><TableCell className="text-right font-semibold text-blue-700 dark:text-blue-300">Rs. {netAmt.toLocaleString()}</TableCell><TableCell className="text-right text-muted-foreground">—</TableCell></TableRow>
                          <TableRow><TableCell className="text-sm">{creditAcc ? `${creditAcc.code} — ${creditAcc.name}` : "Credit Account"}</TableCell><TableCell className="text-right text-muted-foreground">—</TableCell><TableCell className="text-right font-semibold text-amber-700 dark:text-amber-300">Rs. {netAmt.toLocaleString()}</TableCell></TableRow>
                          <TableRow className="bg-slate-50 dark:bg-slate-900 font-semibold"><TableCell className="text-xs uppercase">Total</TableCell><TableCell className="text-right text-sm">Rs. {netAmt.toLocaleString()}</TableCell><TableCell className="text-right text-sm">Rs. {netAmt.toLocaleString()}</TableCell></TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs"><CheckCircle className="h-3.5 w-3.5 text-green-600" /><span className="text-green-700 dark:text-green-300 font-medium">Debit & Credit balanced</span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Transaction Details</h4>
                      <DRow label="Date" value={txn.date} />
                      <DRow label="Status" value={<Badge variant="outline" className={`no-default-active-elevate text-[10px] ${sc.color}`}><StatusIcon className="h-3 w-3 mr-1" />{sc.label}</Badge>} />
                      <DRow label="Type" value={<span className="capitalize font-medium">{txn.type}</span>} />
                      <DRow label="Category" value={<span className="capitalize">{txn.category || "—"}</span>} />
                      <DRow label="Module Source" value={<Badge variant="secondary" className="no-default-active-elevate text-[9px]">{moduleSourceMap[txn.type] || txn.type}</Badge>} />
                      <DRow label="Payment Method" value={paymentMethodLabels[txn.paymentMethod || ""] || txn.paymentMethod || "—"} />
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Linked References</h4>
                      <DRow label="Customer" value={customer ? customer.fullName : "—"} />
                      <DRow label="Vendor" value={vendor ? vendor.name : "—"} />
                      <DRow label="Reference" value={txn.reference || "—"} />
                      <DRow label="Cheque #" value={txn.chequeNumber || "—"} />
                      <DRow label="Branch" value={txn.branch || "—"} />
                      <DRow label="Cost Center" value={txn.costCenter || "—"} />
                    </div>
                  </div>

                  {txn.description && (
                    <div><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description</h4><p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{txn.description}</p></div>
                  )}

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Controls & Flags</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { label: "Recurring", val: txn.isRecurring },
                        { label: "Locked", val: txn.lockAfterSave },
                        { label: "Approval", val: txn.requireApproval },
                        { label: "Auto Adjust", val: txn.autoAdjustReceivable },
                        { label: "Partial Pay", val: txn.allowPartialPayment },
                        { label: "Notification", val: txn.sendNotification },
                      ].map(f => (
                        <div key={f.label} className="p-2 rounded-md border text-center">
                          <p className="text-[9px] text-muted-foreground">{f.label}</p>
                          <p className={`text-xs font-semibold ${f.val ? "text-green-600" : "text-muted-foreground"}`}>{f.val ? "Yes" : "No"}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {txn.createdAt && (
                    <div className="text-[10px] text-muted-foreground border-t pt-2">Created: {new Date(txn.createdAt).toLocaleString()}{txn.createdBy ? ` by ${txn.createdBy}` : ""}</div>
                  )}
                </div>
                <DialogFooter className="flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDrawerTxn(null)}>Close</Button>
                  <Button variant="outline" size="sm" onClick={() => printVoucher(txn)} data-testid="button-print-voucher"><Printer className="h-3.5 w-3.5 mr-1" />Print Voucher</Button>
                  {txn.status !== "reversed" && txn.status !== "voided" && (
                    <Button variant="outline" size="sm" onClick={() => { setDrawerTxn(null); openEdit(txn); }}><Edit className="h-3.5 w-3.5 mr-1" />Edit</Button>
                  )}
                  {txn.status === "completed" && (
                    <Button variant="outline" size="sm" className="text-amber-600 border-amber-300" onClick={() => reverseMutation.mutate(txn.id)} data-testid="button-reverse-drawer"><RotateCcw className="h-3.5 w-3.5 mr-1" />Reverse</Button>
                  )}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== TT DETAIL DIALOG ===== */}
      <Dialog open={!!detailTt} onOpenChange={(open) => { if (!open) setDetailTt(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Layers className="h-5 w-5 text-muted-foreground" />Transaction Type — {detailTt?.name}</DialogTitle></DialogHeader>
          {detailTt && (() => {
            const cc = ttCategoryConfig[detailTt.category] || ttCategoryConfig.income;
            const debitAcc = detailTt.defaultDebitAccountId ? accountsList.find(a => a.id === detailTt.defaultDebitAccountId) : null;
            const creditAcc = detailTt.defaultCreditAccountId ? accountsList.find(a => a.id === detailTt.defaultCreditAccountId) : null;
            const linked = getLinkedModules(detailTt);
            return (
              <div className="space-y-5">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-md p-4 text-white">
                  <div className="flex items-center justify-between"><div><p className="text-xs text-white/60 uppercase tracking-wider">Transaction Type</p><p className="text-lg font-bold mt-0.5">{detailTt.name}</p></div><div className="flex items-center gap-2"><Badge variant="outline" className={`text-xs ${cc.color}`}>{cc.label}</Badge>{detailTt.isSystemDefault && <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700 border-slate-300"><Lock className="h-3 w-3 mr-1" />System</Badge>}</div></div>
                  <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-white/20"><div><p className="text-[10px] text-white/50 uppercase">Code</p><p className="text-sm font-semibold font-mono">{detailTt.code}</p></div><div><p className="text-[10px] text-white/50 uppercase">Normal Balance</p><p className="text-sm font-semibold capitalize">{detailTt.normalBalance}</p></div><div><p className="text-[10px] text-white/50 uppercase">Auto Journal</p><p className="text-sm font-semibold">{detailTt.autoJournalEntry ? "Yes" : "No"}</p></div><div><p className="text-[10px] text-white/50 uppercase">Status</p><p className="text-sm font-semibold">{detailTt.isActive ? "Active" : "Inactive"}</p></div></div>
                </div>
                {detailTt.description && <p className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{detailTt.description}</p>}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Accounting</h4><DRow label="Debit Account" value={debitAcc ? `${debitAcc.code} — ${debitAcc.name}` : "—"} /><DRow label="Credit Account" value={creditAcc ? `${creditAcc.code} — ${creditAcc.name}` : "—"} /><DRow label="Manual Override" value={detailTt.allowManualOverride ? "Allowed" : "No"} /><DRow label="Tax Applicable" value={detailTt.taxApplicable ? "Yes" : "No"} /></div>
                  <div className="space-y-3"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Automation</h4><DRow label="Auto Post Ledger" value={detailTt.autoPostLedger ? "Yes" : "No"} /><DRow label="Require Approval" value={detailTt.requireApproval ? "Yes" : "No"} /><DRow label="Edit After Posting" value={detailTt.allowEditAfterPosting ? "Allowed" : "Locked"} /><DRow label="Recurring" value={detailTt.recurringAllowed ? "Allowed" : "No"} /></div>
                </div>
                <div className="space-y-3"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-1.5">Module Mapping</h4>{linked.length > 0 ? <div className="flex flex-wrap gap-1.5">{linked.map(m => <Badge key={m} variant="outline" className="no-default-active-elevate text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800">{m}</Badge>)}</div> : <p className="text-sm text-muted-foreground">No modules linked</p>}</div>
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t"><Button variant="outline" size="sm" onClick={() => { setDetailTt(null); openTtEdit(detailTt); }}><Edit className="h-3.5 w-3.5 mr-1" />Edit</Button><Button variant="outline" size="sm" onClick={() => { setDetailTt(null); cloneTt(detailTt); }}><Copy className="h-3.5 w-3.5 mr-1" />Clone</Button><div className="flex-1" /><Button variant="ghost" size="sm" onClick={() => setDetailTt(null)}>Close</Button></div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== DELETE TT CONFIRM ===== */}
      <Dialog open={deleteTtId !== null} onOpenChange={(open) => { if (!open) setDeleteTtId(null); }}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />Delete Transaction Type</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">This will permanently remove this transaction type.</p><DialogFooter><Button variant="secondary" onClick={() => setDeleteTtId(null)}>Cancel</Button><Button variant="destructive" onClick={() => { if (deleteTtId) deleteTtMutation.mutate(deleteTtId); }} disabled={deleteTtMutation.isPending} data-testid="button-confirm-delete-tt">{deleteTtMutation.isPending ? "Deleting..." : "Delete"}</Button></DialogFooter></DialogContent>
      </Dialog>

      {/* ===== TT FORM DIALOG ===== */}
      <Dialog open={ttDialogOpen} onOpenChange={setTtDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingTt ? "Edit Transaction Type" : "Add Transaction Type"}</DialogTitle></DialogHeader>
          <Form {...ttForm}>
            <form onSubmit={ttForm.handleSubmit(onTtSubmit)} className="space-y-5">
              <div className="space-y-1"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" />Section A — Basic Information</h4><div className="border-t pt-3 space-y-3"><div className="grid grid-cols-2 gap-3"><FormField control={ttForm.control} name="name" render={({ field }) => <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g. Customer Monthly Payment" data-testid="input-tt-name" {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={ttForm.control} name="code" render={({ field }) => <FormItem><FormLabel>Code</FormLabel><FormControl><Input placeholder="TT-101" data-testid="input-tt-code" {...field} /></FormControl><FormMessage /></FormItem>} /></div><FormField control={ttForm.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={2} placeholder="Describe this transaction type..." data-testid="input-tt-desc" {...field} value={field.value || ""} /></FormControl></FormItem>} /><FormField control={ttForm.control} name="category" render={({ field }) => <FormItem><FormLabel>Category</FormLabel><Select onValueChange={(v) => { field.onChange(v); if (!editingTt) ttForm.setValue("normalBalance", normalBalanceDefaults[v] || "debit"); }} value={field.value}><FormControl><SelectTrigger data-testid="select-tt-category"><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(ttCategoryConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} /></div></div>
              <div className="space-y-1"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" />Section B — Accounting</h4><div className="border-t pt-3 space-y-3"><div className="grid grid-cols-2 gap-3"><FormField control={ttForm.control} name="defaultDebitAccountId" render={({ field }) => <FormItem><FormLabel>Default Debit Account</FormLabel><Select onValueChange={(v) => field.onChange(v === "__none__" ? undefined : parseInt(v))} value={field.value ? field.value.toString() : "__none__"}><FormControl><SelectTrigger data-testid="select-tt-debit"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="__none__">— Select —</SelectItem>{accountsList.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} /><FormField control={ttForm.control} name="defaultCreditAccountId" render={({ field }) => <FormItem><FormLabel>Default Credit Account</FormLabel><Select onValueChange={(v) => field.onChange(v === "__none__" ? undefined : parseInt(v))} value={field.value ? field.value.toString() : "__none__"}><FormControl><SelectTrigger data-testid="select-tt-credit"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="__none__">— Select —</SelectItem>{accountsList.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} /></div><div className="grid grid-cols-3 gap-3"><FormField control={ttForm.control} name="normalBalance" render={({ field }) => <FormItem><FormLabel>Normal Balance</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger data-testid="select-tt-balance"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="debit">Debit</SelectItem><SelectItem value="credit">Credit</SelectItem></SelectContent></Select></FormItem>} /><FormField control={ttForm.control} name="allowManualOverride" render={({ field }) => <FormItem className="flex items-center gap-2 pt-6"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Manual Override</FormLabel></FormItem>} /><FormField control={ttForm.control} name="autoJournalEntry" render={({ field }) => <FormItem className="flex items-center gap-2 pt-6"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Auto Journal</FormLabel></FormItem>} /></div></div></div>
              <div className="space-y-1"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Section C — Module Mapping</h4><div className="border-t pt-3"><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">{([{ name: "linkCustomer" as const, label: "Customer" }, { name: "linkCirCorporate" as const, label: "CIR & Corporate" }, { name: "linkVendor" as const, label: "Vendor" }, { name: "linkPayroll" as const, label: "Payroll" }, { name: "linkResellerWallet" as const, label: "Reseller Wallet" }, { name: "linkExpenseEntry" as const, label: "Expense Entry" }, { name: "linkIncomeEntry" as const, label: "Income Entry" }, { name: "linkPaymentGateway" as const, label: "Payment Gateway" }, { name: "linkCreditNotes" as const, label: "Credit Notes" }, { name: "linkBankReconciliation" as const, label: "Bank Recon" }]).map(mod => <FormField key={mod.name} control={ttForm.control} name={mod.name} render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">{mod.label}</FormLabel></FormItem>} />)}</div></div></div>
              <div className="space-y-1"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" />Section D — Automation</h4><div className="border-t pt-3"><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{([{ name: "autoPostLedger" as const, label: "Auto Post Ledger" }, { name: "requireApproval" as const, label: "Require Approval" }, { name: "allowEditAfterPosting" as const, label: "Edit After Posting" }, { name: "lockAfterPeriodClose" as const, label: "Lock After Period" }, { name: "recurringAllowed" as const, label: "Recurring" }, { name: "taxApplicable" as const, label: "Tax Applicable" }]).map(rule => <FormField key={rule.name} control={ttForm.control} name={rule.name} render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">{rule.label}</FormLabel></FormItem>} />)}</div></div></div>
              <div className="space-y-1"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Settings className="h-3.5 w-3.5" />Section E — Status</h4><div className="border-t pt-3"><div className="grid grid-cols-2 gap-3"><FormField control={ttForm.control} name="isActive" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">Active</FormLabel></FormItem>} /><FormField control={ttForm.control} name="isSystemDefault" render={({ field }) => <FormItem className="flex items-center gap-2"><FormControl><Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0 text-sm">System Default</FormLabel></FormItem>} /></div></div></div>
              <DialogFooter><Button type="button" variant="secondary" onClick={() => setTtDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={createTtMutation.isPending || updateTtMutation.isPending} data-testid="button-save-tt">{createTtMutation.isPending || updateTtMutation.isPending ? "Saving..." : editingTt ? "Update Type" : "Create Type"}</Button></DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== TRANSACTION FORM DIALOG ===== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#002B5B] to-[#0066FF] flex items-center justify-center"><DollarSign className="h-4 w-4 text-white" /></div>
              {editingTransaction ? "Edit Transaction" : "New Transaction"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Section A — Basic Information</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="txnId" render={({ field }) => <FormItem><FormLabel>Transaction ID</FormLabel><FormControl><Input data-testid="input-txn-id" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="date" render={({ field }) => <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" data-testid="input-txn-date" {...field} /></FormControl><FormMessage /></FormItem>} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="type" render={({ field }) => <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value || "payment"}><FormControl><SelectTrigger data-testid="select-txn-type"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem><SelectItem value="payment">Payment</SelectItem><SelectItem value="transfer">Transfer</SelectItem><SelectItem value="refund">Refund</SelectItem><SelectItem value="adjustment">Adjustment</SelectItem><SelectItem value="credit">Credit</SelectItem><SelectItem value="debit">Debit</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="category" render={({ field }) => <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger data-testid="select-txn-category"><SelectValue placeholder="Select category" /></SelectTrigger></FormControl><SelectContent><SelectItem value="customer_payment">Customer Payment</SelectItem><SelectItem value="vendor_payment">Vendor Payment</SelectItem><SelectItem value="salary">Salary</SelectItem><SelectItem value="commission">Commission</SelectItem><SelectItem value="installation_fee">Installation Fee</SelectItem><SelectItem value="bandwidth">Bandwidth</SelectItem><SelectItem value="utility">Utility</SelectItem><SelectItem value="operational">Operational</SelectItem><SelectItem value="other_income">Other Income</SelectItem><SelectItem value="other_expense">Other Expense</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={2} placeholder="Transaction details..." data-testid="input-txn-description" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />Section B — Financial Details</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="debitAccountId" render={({ field }) => <FormItem><FormLabel>Debit Account</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-txn-debit"><SelectValue placeholder="Select debit account" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">None</SelectItem>{accountsList.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                    <FormField control={form.control} name="creditAccountId" render={({ field }) => <FormItem><FormLabel>Credit Account</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-txn-credit"><SelectValue placeholder="Select credit account" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">None</SelectItem>{accountsList.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="amount" render={({ field }) => <FormItem><FormLabel>Amount (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" data-testid="input-txn-amount" {...field} /></FormControl><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="tax" render={({ field }) => <FormItem><FormLabel>Tax</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-txn-tax" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <FormField control={form.control} name="discount" render={({ field }) => <FormItem><FormLabel>Discount</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-txn-discount" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-muted-foreground">Net Amount</p>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300" data-testid="text-net-amount">Rs. {(Number(form.watch("amount") || 0) + Number(form.watch("tax") || 0) - Number(form.watch("discount") || 0)).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" />Section C — Payment & Parties</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="paymentMethod" render={({ field }) => <FormItem><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} value={field.value || "cash"}><FormControl><SelectTrigger data-testid="select-txn-payment-method"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem><SelectItem value="online">Online</SelectItem><SelectItem value="jazzcash">JazzCash</SelectItem><SelectItem value="easypaisa">EasyPaisa</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="status" render={({ field }) => <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value || "completed"}><FormControl><SelectTrigger data-testid="select-txn-status"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="completed">Posted</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="draft">Draft</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="customerId" render={({ field }) => <FormItem><FormLabel>Customer</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-txn-customer"><SelectValue placeholder="Select customer" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">None</SelectItem>{customers.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.fullName}</SelectItem>)}</SelectContent></Select></FormItem>} />
                    <FormField control={form.control} name="vendorId" render={({ field }) => <FormItem><FormLabel>Vendor</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-txn-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">None</SelectItem>{vendors.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="reference" render={({ field }) => <FormItem><FormLabel>Reference</FormLabel><FormControl><Input placeholder="Reference number..." data-testid="input-txn-reference" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                    <FormField control={form.control} name="branch" render={({ field }) => <FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="Main Office" data-testid="input-txn-branch" {...field} value={field.value || ""} /></FormControl></FormItem>} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-transaction">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingTransaction ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const aprStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800", icon: Clock },
  approved: { label: "Approved", color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800", icon: XCircle },
  under_review: { label: "Under Review", color: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800", icon: Eye },
  escalated: { label: "Escalated", color: "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border-slate-700 dark:border-slate-300", icon: AlertTriangle },
};

const aprRiskColors: Record<string, string> = {
  normal: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800",
  medium: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  high: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  critical: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800",
};

const aprTxnTypeLabels: Record<string, string> = {
  refund: "Refund & Credit", transfer: "Transfer Account", wallet_adjustment: "Wallet Adjustment",
  write_off: "Write-Off", collection: "Collection", credit_note: "Credit Note",
  corporate_collection: "Corporate Collection", cir_collection: "CIR Collection",
};

const aprLevelLabels: Record<number, string> = {
  1: "Accounts Officer", 2: "Finance Manager", 3: "Admin / Director",
};

function ApprovalWorkflowTab() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<"queue" | "config" | "history" | "risk">("queue");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [detailRequest, setDetailRequest] = useState<any>(null);
  const [actionDialog, setActionDialog] = useState<{ request: any; action: string } | null>(null);
  const [actionComment, setActionComment] = useState("");
  const [ruleDialog, setRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [page, setPage] = useState(1);
  const PAGE = 15;

  const { data: requests = [], isLoading: loadingReqs } = useQuery<any[]>({ queryKey: ["/api/approval-requests"] });
  const { data: rules = [], isLoading: loadingRules } = useQuery<any[]>({ queryKey: ["/api/approval-rules"] });
  const { data: history = [] } = useQuery<any[]>({ queryKey: ["/api/approval-history"] });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/approval-requests/${id}`, data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/approval-requests"] }); queryClient.invalidateQueries({ queryKey: ["/api/approval-history"] }); },
  });

  const createHistoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/approval-history", data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/approval-history"] }); },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/approval-rules", data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/approval-rules"] }); toast({ title: "Rule saved" }); setRuleDialog(false); setEditingRule(null); },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/approval-rules/${id}`, data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/approval-rules"] }); toast({ title: "Rule updated" }); setRuleDialog(false); setEditingRule(null); },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/approval-rules/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/approval-rules"] }); toast({ title: "Rule deleted" }); },
  });

  const handleAction = (action: string) => {
    if (!actionDialog) return;
    const { request } = actionDialog;
    const today = new Date().toISOString().split("T")[0];
    const newStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : action === "escalate" ? "escalated" : action === "revision" ? "pending" : request.status;
    updateMutation.mutate({ id: request.id, data: {
      status: newStatus,
      ...(action === "approve" ? { approvedBy: "admin", approvalDate: today } : {}),
      ...(action === "reject" ? { rejectedBy: "admin", approvalDate: today, approvalComments: actionComment } : {}),
      ...(action === "escalate" ? { currentLevel: Math.min((request.currentLevel || 1) + 1, 3) } : {}),
      ...(action === "revision" ? { currentLevel: 1 } : {}),
    }});
    createHistoryMutation.mutate({
      requestId: request.requestId,
      action: action === "approve" ? "approved" : action === "reject" ? "rejected" : action === "escalate" ? "escalated" : "sent_back",
      actionBy: "admin",
      actionDate: today,
      comments: actionComment || `Request ${action}d`,
      ipAddress: "192.168.1.1",
      previousStatus: request.status,
      newStatus,
      level: request.currentLevel,
    });
    toast({ title: `Request ${action === "approve" ? "Approved" : action === "reject" ? "Rejected" : action === "escalate" ? "Escalated" : "Sent Back"}` });
    setActionDialog(null);
    setActionComment("");
  };

  const pending = requests.filter(r => r.status === "pending" || r.status === "under_review");
  const approvedToday = requests.filter(r => r.status === "approved" && r.approvalDate === new Date().toISOString().split("T")[0]);
  const rejectedToday = requests.filter(r => r.status === "rejected" && r.approvalDate === new Date().toISOString().split("T")[0]);
  const highValue = pending.filter(r => parseFloat(r.amount) >= 100000);
  const escalated = requests.filter(r => r.status === "escalated");
  const avgTime = (() => {
    const resolved = requests.filter(r => r.approvalDate && r.requestDate);
    if (!resolved.length) return 0;
    const totalHours = resolved.reduce((sum, r) => {
      const diff = new Date(r.approvalDate!).getTime() - new Date(r.requestDate).getTime();
      return sum + diff / 3600000;
    }, 0);
    return Math.round(totalHours / resolved.length);
  })();

  const filtered = useMemo(() => {
    let result = activeSection === "queue" ? requests.filter(r => r.status === "pending" || r.status === "under_review" || r.status === "escalated") : requests;
    if (statusFilter !== "all") result = result.filter(r => r.status === statusFilter);
    if (typeFilter !== "all") result = result.filter(r => r.transactionType === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => r.requestId.toLowerCase().includes(q) || r.entityName.toLowerCase().includes(q) || r.requestedBy.toLowerCase().includes(q));
    }
    return result;
  }, [requests, activeSection, statusFilter, typeFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE);
  const paged = filtered.slice((page - 1) * PAGE, page * PAGE);

  const monthlyData = useMemo(() => {
    const months: Record<string, { approved: number; rejected: number; pending: number }> = {};
    requests.forEach(r => {
      const m = r.requestDate?.slice(0, 7);
      if (!m) return;
      if (!months[m]) months[m] = { approved: 0, rejected: 0, pending: 0 };
      if (r.status === "approved") months[m].approved++;
      else if (r.status === "rejected") months[m].rejected++;
      else months[m].pending++;
    });
    return Object.entries(months).sort().slice(-6).map(([month, data]) => ({ month: month.slice(5), ...data }));
  }, [requests]);

  const typeDistData = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach(r => { counts[r.transactionType] = (counts[r.transactionType] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ name: aprTxnTypeLabels[type] || type, value: count }));
  }, [requests]);

  const PIE_COLORS = ["#1D4ED8", "#059669", "#DC2626", "#F59E0B", "#8B5CF6", "#06B6D4"];

  const ruleForm = useForm({
    defaultValues: { name: "", transactionType: "refund", minAmount: "0", maxAmount: "", approvalLevel: 1, approverRole: "Accounts Officer", branch: "", riskCategory: "normal", autoEscalateHours: 24, description: "" },
  });

  const openRuleCreate = () => {
    ruleForm.reset({ name: "", transactionType: "refund", minAmount: "0", maxAmount: "", approvalLevel: 1, approverRole: "Accounts Officer", branch: "", riskCategory: "normal", autoEscalateHours: 24, description: "" });
    setEditingRule(null);
    setRuleDialog(true);
  };

  const openRuleEdit = (rule: any) => {
    ruleForm.reset({ name: rule.name, transactionType: rule.transactionType, minAmount: rule.minAmount || "0", maxAmount: rule.maxAmount || "", approvalLevel: rule.approvalLevel, approverRole: rule.approverRole, branch: rule.branch || "", riskCategory: rule.riskCategory || "normal", autoEscalateHours: rule.autoEscalateHours || 24, description: rule.description || "" });
    setEditingRule(rule);
    setRuleDialog(true);
  };

  const onRuleSubmit = (data: any) => {
    const payload = { ...data, approvalLevel: parseInt(data.approvalLevel), autoEscalateHours: parseInt(data.autoEscalateHours), maxAmount: data.maxAmount || null };
    if (editingRule) updateRuleMutation.mutate({ id: editingRule.id, data: payload });
    else createRuleMutation.mutate(payload);
  };

  const approvalRate = requests.length ? Math.round((requests.filter(r => r.status === "approved").length / requests.length) * 100) : 0;
  const rejectionRate = requests.length ? Math.round((requests.filter(r => r.status === "rejected").length / requests.length) * 100) : 0;
  const highRiskPct = requests.length ? Math.round((requests.filter(r => r.riskCategory === "high" || r.riskCategory === "critical").length / requests.length) * 100) : 0;
  const escalationRatio = requests.length ? Math.round((escalated.length / requests.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: "Total Pending", value: pending.length, sub: `${highValue.length} high-value`, icon: Clock, gradient: "from-[#1F2937] to-[#1D4ED8]" },
          { label: "Approved Today", value: approvedToday.length, sub: "Completed", icon: CheckCircle, gradient: "from-green-600 to-green-500" },
          { label: "Rejected Today", value: rejectedToday.length, sub: "Declined", icon: XCircle, gradient: "from-red-600 to-red-500" },
          { label: "High-Value Pending", value: highValue.length, sub: `Rs. ${highValue.reduce((s, r) => s + parseFloat(r.amount), 0).toLocaleString()}`, icon: AlertTriangle, gradient: "from-orange-600 to-orange-500" },
          { label: "Escalated", value: escalated.length, sub: "Needs attention", icon: ShieldCheck, gradient: "from-slate-700 to-slate-600" },
          { label: "Avg Approval Time", value: `${avgTime}h`, sub: "Hours to resolve", icon: Activity, gradient: "from-indigo-600 to-indigo-500" },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-[14px] p-4 text-white shadow-sm`} data-testid={`card-apr-kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className="h-4 w-4 text-white/60" />
            </div>
            <div className="text-xl font-bold">{loadingReqs ? "—" : kpi.value}</div>
            <p className="text-[10px] text-white/70 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><BarChart3 className="h-4 w-4 text-blue-600" />Monthly Approval Trend</CardTitle></CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <RechartsArea type="monotone" dataKey="approved" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Approved" />
                  <RechartsArea type="monotone" dataKey="rejected" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Rejected" />
                  <RechartsArea type="monotone" dataKey="pending" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Pending" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">No trend data available</div>}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><PieChartIcon className="h-4 w-4 text-blue-600" />By Transaction Type</CardTitle></CardHeader>
          <CardContent>
            {typeDistData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={typeDistData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {typeDistData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">No data</div>}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-1.5 border-b">
        {[
          { key: "queue" as const, label: "Pending Queue", icon: Clock },
          { key: "config" as const, label: "Configuration", icon: Settings },
          { key: "history" as const, label: "History Log", icon: BookOpen },
          { key: "risk" as const, label: "Risk & Governance", icon: ShieldCheck },
        ].map(sec => (
          <button key={sec.key} onClick={() => { setActiveSection(sec.key); setPage(1); }} data-testid={`tab-approval-${sec.key}`}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${activeSection === sec.key ? "border-blue-600 text-blue-700 dark:text-blue-400" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <sec.icon className="h-3.5 w-3.5" />{sec.label}
          </button>
        ))}
      </div>

      {(activeSection === "queue" || activeSection === "history") && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search requests..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-8 h-8 text-xs" data-testid="input-approval-search" /></div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}><SelectTrigger className="w-[140px] h-8 text-xs" data-testid="select-approval-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="under_review">Under Review</SelectItem><SelectItem value="escalated">Escalated</SelectItem></SelectContent></Select>
          <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}><SelectTrigger className="w-[160px] h-8 text-xs" data-testid="select-approval-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="refund">Refund</SelectItem><SelectItem value="transfer">Transfer</SelectItem><SelectItem value="wallet_adjustment">Wallet Adjustment</SelectItem><SelectItem value="write_off">Write-Off</SelectItem><SelectItem value="collection">Collection</SelectItem><SelectItem value="credit_note">Credit Note</SelectItem></SelectContent></Select>
          {(search || statusFilter !== "all" || typeFilter !== "all") && <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); setPage(1); }} data-testid="button-clear-approval-filters"><X className="h-3 w-3 mr-1" />Clear</Button>}
        </div>
      )}

      {activeSection === "queue" && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-[#1F2937] to-[#1D4ED8] border-0">
                    {["Request ID", "Type", "Entity", "Amount", "Branch", "Requested By", "Level", "Date", "Risk", "Status", ""].map(h => (
                      <TableHead key={h} className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingReqs ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={11}><Skeleton className="h-8 w-full" /></TableCell></TableRow>) :
                  paged.length === 0 ? <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-10">No pending approval requests</TableCell></TableRow> :
                  paged.map((r, i) => {
                    const st = aprStatusConfig[r.status] || aprStatusConfig.pending;
                    const StIcon = st.icon;
                    return (
                      <TableRow key={r.id} className={`${i % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-[#F4F6F9] dark:bg-slate-900"} hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors`} data-testid={`row-approval-${r.id}`}>
                        <TableCell className="font-mono text-xs font-medium text-blue-700 dark:text-blue-400">{r.requestId}</TableCell>
                        <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] ${typeColors[r.transactionType] || "bg-slate-50 text-slate-700"}`}>{aprTxnTypeLabels[r.transactionType] || r.transactionType}</Badge></TableCell>
                        <TableCell><div className="text-xs font-medium">{r.entityName}</div><div className="text-[10px] text-muted-foreground">{r.entityType}</div></TableCell>
                        <TableCell className="font-mono text-xs font-semibold">Rs. {parseFloat(r.amount).toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{r.branch || "—"}</TableCell>
                        <TableCell className="text-xs">{r.requestedBy}</TableCell>
                        <TableCell><Badge variant="outline" className="no-default-active-elevate text-[10px]">L{r.currentLevel} — {aprLevelLabels[r.currentLevel] || `Level ${r.currentLevel}`}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.requestDate}</TableCell>
                        <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] ${aprRiskColors[r.riskCategory] || aprRiskColors.normal}`}>{r.riskCategory}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] ${st.color}`}><StIcon className="h-3 w-3 mr-1" />{st.label}</Badge></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0" data-testid={`button-approval-action-${r.id}`}><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailRequest(r)} data-testid={`action-view-${r.id}`}><Eye className="h-3.5 w-3.5 mr-2" />View Details</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {(r.status === "pending" || r.status === "under_review") && <>
                                <DropdownMenuItem onClick={() => { setActionDialog({ request: r, action: "approve" }); setActionComment(""); }} data-testid={`action-approve-${r.id}`}><CheckCircle className="h-3.5 w-3.5 mr-2 text-green-600" />Approve</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setActionDialog({ request: r, action: "reject" }); setActionComment(""); }} data-testid={`action-reject-${r.id}`}><XCircle className="h-3.5 w-3.5 mr-2 text-red-600" />Reject</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setActionDialog({ request: r, action: "revision" }); setActionComment(""); }} data-testid={`action-revision-${r.id}`}><RotateCcw className="h-3.5 w-3.5 mr-2 text-amber-600" />Send Back</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setActionDialog({ request: r, action: "escalate" }); setActionComment(""); }} data-testid={`action-escalate-${r.id}`}><AlertTriangle className="h-3.5 w-3.5 mr-2 text-slate-600" />Escalate</DropdownMenuItem>
                              </>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-xs text-muted-foreground">Showing {(page - 1) * PAGE + 1}–{Math.min(page * PAGE, filtered.length)} of {filtered.length}</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)} data-testid="button-approval-prev"><ChevronLeft className="h-3 w-3" /></Button>
                  <span className="text-xs px-2">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} data-testid="button-approval-next"><ChevronRight className="h-3 w-3" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeSection === "config" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Approval Threshold Rules</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Configure auto-routing rules based on amount, type, and risk</p>
            </div>
            <Button size="sm" onClick={openRuleCreate} data-testid="button-add-rule"><Plus className="h-4 w-4 mr-1" />Add Rule</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
            {[
              { level: 1, role: "Accounts Officer", desc: "Basic verification and initial approval", color: "from-blue-500 to-blue-600" },
              { level: 2, role: "Finance Manager", desc: "High-value and financial risk review", color: "from-indigo-500 to-indigo-600" },
              { level: 3, role: "Admin / Director", desc: "Critical transactions and final authority", color: "from-purple-500 to-purple-600" },
            ].map(lvl => (
              <div key={lvl.level} className={`bg-gradient-to-br ${lvl.color} rounded-[14px] p-4 text-white shadow-sm`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{lvl.level}</div>
                  <span className="text-sm font-semibold">{lvl.role}</span>
                </div>
                <p className="text-[10px] text-white/80">{lvl.desc}</p>
                <p className="text-xs mt-2 font-medium">{rules.filter(r => r.approvalLevel === lvl.level).length} rules assigned</p>
              </div>
            ))}
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-[#1F2937] to-[#1D4ED8] border-0">
                      {["Rule Name", "Transaction Type", "Min Amount", "Max Amount", "Level", "Approver Role", "Risk", "Auto-Escalate", "Status", ""].map(h => (
                        <TableHead key={h} className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingRules ? Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={10}><Skeleton className="h-8 w-full" /></TableCell></TableRow>) :
                    rules.length === 0 ? <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-10">No rules configured</TableCell></TableRow> :
                    rules.map((rule, i) => (
                      <TableRow key={rule.id} className={`${i % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-[#F4F6F9] dark:bg-slate-900"} hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors`} data-testid={`row-rule-${rule.id}`}>
                        <TableCell className="text-xs font-medium">{rule.name}</TableCell>
                        <TableCell><Badge variant="outline" className="no-default-active-elevate text-[10px]">{aprTxnTypeLabels[rule.transactionType] || rule.transactionType}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">Rs. {parseFloat(rule.minAmount).toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs">{rule.maxAmount ? `Rs. ${parseFloat(rule.maxAmount).toLocaleString()}` : "No limit"}</TableCell>
                        <TableCell><Badge variant="outline" className="no-default-active-elevate text-[10px]">L{rule.approvalLevel}</Badge></TableCell>
                        <TableCell className="text-xs">{rule.approverRole}</TableCell>
                        <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] ${aprRiskColors[rule.riskCategory] || aprRiskColors.normal}`}>{rule.riskCategory}</Badge></TableCell>
                        <TableCell className="text-xs">{rule.autoEscalateHours}h</TableCell>
                        <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] ${rule.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>{rule.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openRuleEdit(rule)} data-testid={`button-edit-rule-${rule.id}`}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteRuleMutation.mutate(rule.id)} data-testid={`button-delete-rule-${rule.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === "history" && (() => {
        const historyWithContext = history.map(h => {
          const req = requests.find(r => r.requestId === h.requestId);
          return { ...h, entityName: req?.entityName || "—", transactionType: req?.transactionType || "—", amount: req?.amount || "0", requestedBy: req?.requestedBy || "—" };
        });
        const filteredHistory = historyWithContext.filter(h => {
          if (search) {
            const q = search.toLowerCase();
            if (!h.requestId.toLowerCase().includes(q) && !h.entityName.toLowerCase().includes(q) && !h.actionBy.toLowerCase().includes(q)) return false;
          }
          return true;
        });
        const histPages = Math.ceil(filteredHistory.length / PAGE);
        const histPaged = filteredHistory.slice((page - 1) * PAGE, page * PAGE);
        return (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-[#1F2937] to-[#1D4ED8] border-0">
                      {["Request ID", "Action", "Action By", "Entity", "Amount", "Previous Status", "New Status", "Date", "Comments", "IP Address", "Level"].map(h => (
                        <TableHead key={h} className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {histPaged.length === 0 ? <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-10">No history records</TableCell></TableRow> :
                    histPaged.map((h, i) => {
                      const actionColor = h.action === "approved" ? "bg-green-50 text-green-700 border-green-200" : h.action === "rejected" ? "bg-red-50 text-red-600 border-red-200" : h.action === "escalated" ? "bg-slate-100 text-slate-700 border-slate-300" : "bg-blue-50 text-blue-700 border-blue-200";
                      return (
                        <TableRow key={h.id} className={`${i % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-[#F4F6F9] dark:bg-slate-900"} hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors`} data-testid={`row-history-${h.id}`}>
                          <TableCell className="font-mono text-xs font-medium text-blue-700 dark:text-blue-400">{h.requestId}</TableCell>
                          <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] capitalize ${actionColor}`}>{h.action}</Badge></TableCell>
                          <TableCell className="text-xs font-medium">{h.actionBy}</TableCell>
                          <TableCell className="text-xs">{h.entityName}</TableCell>
                          <TableCell className="font-mono text-xs font-semibold">Rs. {parseFloat(h.amount).toLocaleString()}</TableCell>
                          <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] ${aprStatusConfig[h.previousStatus || ""]?.color || ""}`}>{h.previousStatus || "—"}</Badge></TableCell>
                          <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] ${aprStatusConfig[h.newStatus || ""]?.color || ""}`}>{h.newStatus || "—"}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{h.actionDate}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{h.comments || "—"}</TableCell>
                          <TableCell className="font-mono text-[10px] text-muted-foreground">{h.ipAddress || "—"}</TableCell>
                          <TableCell className="text-xs">{h.level ? `L${h.level}` : "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {histPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-xs text-muted-foreground">Showing {(page - 1) * PAGE + 1}–{Math.min(page * PAGE, filteredHistory.length)} of {filteredHistory.length}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-3 w-3" /></Button>
                    <span className="text-xs px-2">{page} / {histPages}</span>
                    <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === histPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-3 w-3" /></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {activeSection === "risk" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Approval Rate", value: `${approvalRate}%`, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
              { label: "Rejection Rate", value: `${rejectionRate}%`, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" },
              { label: "High-Risk %", value: `${highRiskPct}%`, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950" },
              { label: "Escalation Ratio", value: `${escalationRatio}%`, icon: ShieldCheck, color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-950" },
            ].map(g => (
              <Card key={g.label} className="border-0 shadow-sm" data-testid={`card-governance-${g.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${g.bg} flex items-center justify-center`}><g.icon className={`h-5 w-5 ${g.color}`} /></div>
                  <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">{g.label}</p><p className="text-lg font-bold">{g.value}</p></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-red-500" />Risk Alerts</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {requests.filter(r => r.riskCategory === "critical" && (r.status === "pending" || r.status === "escalated")).length > 0 ? (
                  requests.filter(r => r.riskCategory === "critical" && (r.status === "pending" || r.status === "escalated")).map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800" data-testid={`alert-risk-${r.id}`}>
                      <div>
                        <p className="text-xs font-medium text-red-800 dark:text-red-300">{r.requestId} — {r.entityName}</p>
                        <p className="text-[10px] text-red-600 dark:text-red-400">Rs. {parseFloat(r.amount).toLocaleString()} • {aprTxnTypeLabels[r.transactionType]}</p>
                      </div>
                      <Badge variant="outline" className="no-default-active-elevate text-[10px] bg-red-100 text-red-700 border-red-300">Critical</Badge>
                    </div>
                  ))
                ) : <p className="text-xs text-muted-foreground text-center py-6">No critical risk alerts</p>}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Activity className="h-4 w-4 text-blue-500" />Recent Activity</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {history.slice(0, 8).map(h => (
                  <div key={h.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors" data-testid={`activity-${h.id}`}>
                    <div className={`h-2 w-2 rounded-full ${h.action === "approved" ? "bg-green-500" : h.action === "rejected" ? "bg-red-500" : h.action === "escalated" ? "bg-slate-700" : "bg-blue-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{h.requestId} — {h.action} by {h.actionBy}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{h.comments}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{h.actionDate}</span>
                  </div>
                ))}
                {history.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No activity recorded</p>}
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Gauge className="h-4 w-4 text-indigo-500" />Escalation & Delay Monitoring</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {escalated.length > 0 ? escalated.map(r => (
                  <div key={r.id} className="p-3 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" data-testid={`escalation-${r.id}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">{r.requestId}</span>
                      <Badge variant="outline" className="no-default-active-elevate text-[10px] bg-amber-100 text-amber-700 border-amber-300">Escalated</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{r.entityName} • Rs. {parseFloat(r.amount).toLocaleString()}</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Since {r.requestDate} • Level {r.currentLevel}</p>
                  </div>
                )) : <p className="text-xs text-muted-foreground text-center py-6 col-span-3">No escalated requests</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={!!detailRequest} onOpenChange={(open) => { if (!open) setDetailRequest(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailRequest && (() => {
            const r = detailRequest;
            const st = aprStatusConfig[r.status] || aprStatusConfig.pending;
            const StIcon = st.icon;
            const relHistory = history.filter(h => h.requestId === r.requestId);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#1F2937] to-[#1D4ED8] flex items-center justify-center"><ShieldCheck className="h-4 w-4 text-white" /></div>
                    Approval Request — {r.requestId}
                    <Badge variant="outline" className={`no-default-active-elevate text-[10px] font-medium ml-auto ${st.color}`}><StIcon className="h-3 w-3 mr-1" />{st.label}</Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-[#1F2937] to-[#1D4ED8] rounded-lg p-3 text-white text-center">
                    <p className="text-[10px] text-white/70">Amount</p>
                    <p className="text-lg font-bold">Rs. {parseFloat(r.amount).toLocaleString()}</p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-3 text-white text-center">
                    <p className="text-[10px] text-white/70">Approval Level</p>
                    <p className="text-lg font-bold">Level {r.currentLevel}</p>
                    <p className="text-[10px] text-white/80">{aprLevelLabels[r.currentLevel]}</p>
                  </div>
                  <div className={`rounded-lg p-3 text-center ${r.riskCategory === "critical" ? "bg-gradient-to-br from-red-500 to-red-600 text-white" : r.riskCategory === "high" ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white" : "bg-gradient-to-br from-green-500 to-green-600 text-white"}`}>
                    <p className="text-[10px] text-white/70">Risk</p>
                    <p className="text-lg font-bold capitalize">{r.riskCategory}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Request Details</h4>
                    <div className="border rounded-lg p-3 space-y-1.5">
                      <DRow label="Transaction Type" value={aprTxnTypeLabels[r.transactionType] || r.transactionType} />
                      <DRow label="Entity" value={`${r.entityName} (${r.entityType})`} />
                      <DRow label="Category" value={r.category || "—"} />
                      <DRow label="Branch" value={r.branch || "—"} />
                      <DRow label="Requested By" value={r.requestedBy} />
                      <DRow label="Request Date" value={r.requestDate} />
                      <DRow label="Description" value={r.description || "—"} />
                    </div>
                  </div>
                  {(r.approvedBy || r.rejectedBy) && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Decision</h4>
                      <div className="border rounded-lg p-3 space-y-1.5">
                        {r.approvedBy && <DRow label="Approved By" value={r.approvedBy} />}
                        {r.rejectedBy && <DRow label="Rejected By" value={r.rejectedBy} />}
                        {r.approvalDate && <DRow label="Decision Date" value={r.approvalDate} />}
                        {r.approvalComments && <DRow label="Comments" value={r.approvalComments} />}
                      </div>
                    </div>
                  )}
                  {relHistory.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Audit Trail</h4>
                      <div className="border rounded-lg p-3 space-y-2">
                        {relHistory.map(h => (
                          <div key={h.id} className="flex items-start gap-2">
                            <div className={`h-2 w-2 rounded-full mt-1.5 ${h.action === "approved" ? "bg-green-500" : h.action === "rejected" ? "bg-red-500" : "bg-blue-500"}`} />
                            <div>
                              <p className="text-xs font-medium">{h.action} by {h.actionBy} <span className="text-muted-foreground">on {h.actionDate}</span></p>
                              {h.comments && <p className="text-[10px] text-muted-foreground">{h.comments}</p>}
                              {h.ipAddress && <p className="text-[10px] text-muted-foreground">IP: {h.ipAddress}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  {(r.status === "pending" || r.status === "under_review") && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200" onClick={() => { setDetailRequest(null); setActionDialog({ request: r, action: "reject" }); setActionComment(""); }} data-testid="button-detail-reject"><XCircle className="h-3.5 w-3.5 mr-1" />Reject</Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { setDetailRequest(null); setActionDialog({ request: r, action: "approve" }); setActionComment(""); }} data-testid="button-detail-approve"><CheckCircle className="h-3.5 w-3.5 mr-1" />Approve</Button>
                    </div>
                  )}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={!!actionDialog} onOpenChange={(open) => { if (!open) { setActionDialog(null); setActionComment(""); } }}>
        <DialogContent className="max-w-md">
          {actionDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {actionDialog.action === "approve" && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {actionDialog.action === "reject" && <XCircle className="h-5 w-5 text-red-600" />}
                  {actionDialog.action === "escalate" && <AlertTriangle className="h-5 w-5 text-slate-600" />}
                  {actionDialog.action === "revision" && <RotateCcw className="h-5 w-5 text-amber-600" />}
                  {actionDialog.action === "approve" ? "Approve Request" : actionDialog.action === "reject" ? "Reject Request" : actionDialog.action === "escalate" ? "Escalate Request" : "Send Back for Revision"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <DRow label="Request ID" value={actionDialog.request.requestId} />
                  <DRow label="Entity" value={actionDialog.request.entityName} />
                  <DRow label="Amount" value={`Rs. ${parseFloat(actionDialog.request.amount).toLocaleString()}`} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Comments {actionDialog.action === "reject" && <span className="text-red-500">*</span>}</label>
                  <Textarea placeholder={`Add your ${actionDialog.action} comments...`} value={actionComment} onChange={e => setActionComment(e.target.value)} className="mt-1" data-testid="textarea-action-comment" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setActionDialog(null); setActionComment(""); }}>Cancel</Button>
                <Button onClick={() => handleAction(actionDialog.action)} disabled={actionDialog.action === "reject" && !actionComment.trim()} className={actionDialog.action === "approve" ? "bg-green-600 hover:bg-green-700" : actionDialog.action === "reject" ? "bg-red-600 hover:bg-red-700" : ""} data-testid="button-confirm-action">
                  {actionDialog.action === "approve" ? "Confirm Approve" : actionDialog.action === "reject" ? "Confirm Reject" : actionDialog.action === "escalate" ? "Confirm Escalate" : "Confirm Send Back"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={ruleDialog} onOpenChange={(open) => { if (!open) { setRuleDialog(false); setEditingRule(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingRule ? "Edit Approval Rule" : "Add Approval Rule"}</DialogTitle></DialogHeader>
          <form onSubmit={ruleForm.handleSubmit(onRuleSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium">Rule Name</label><Input {...ruleForm.register("name")} placeholder="e.g., Refund > 50,000" className="mt-1" data-testid="input-rule-name" /></div>
              <div><label className="text-xs font-medium">Transaction Type</label>
                <select {...ruleForm.register("transactionType")} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm" data-testid="select-rule-type">
                  <option value="refund">Refund</option><option value="transfer">Transfer</option><option value="wallet_adjustment">Wallet Adjustment</option><option value="write_off">Write-Off</option><option value="collection">Collection</option><option value="credit_note">Credit Note</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium">Min Amount (Rs.)</label><Input type="number" {...ruleForm.register("minAmount")} className="mt-1" data-testid="input-rule-min" /></div>
              <div><label className="text-xs font-medium">Max Amount (Rs.)</label><Input type="number" {...ruleForm.register("maxAmount")} placeholder="No limit" className="mt-1" data-testid="input-rule-max" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium">Approval Level</label>
                <select {...ruleForm.register("approvalLevel")} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm" data-testid="select-rule-level">
                  <option value={1}>Level 1 — Accounts Officer</option><option value={2}>Level 2 — Finance Manager</option><option value={3}>Level 3 — Admin / Director</option>
                </select>
              </div>
              <div><label className="text-xs font-medium">Approver Role</label><Input {...ruleForm.register("approverRole")} className="mt-1" data-testid="input-rule-approver" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium">Risk Category</label>
                <select {...ruleForm.register("riskCategory")} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm" data-testid="select-rule-risk">
                  <option value="normal">Normal</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                </select>
              </div>
              <div><label className="text-xs font-medium">Auto-Escalate (hours)</label><Input type="number" {...ruleForm.register("autoEscalateHours")} className="mt-1" data-testid="input-rule-escalate" /></div>
            </div>
            <div><label className="text-xs font-medium">Description</label><Textarea {...ruleForm.register("description")} placeholder="Rule description..." className="mt-1" data-testid="textarea-rule-desc" /></div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => { setRuleDialog(false); setEditingRule(null); }}>Cancel</Button>
              <Button type="submit" disabled={createRuleMutation.isPending || updateRuleMutation.isPending} data-testid="button-save-rule">{editingRule ? "Update Rule" : "Create Rule"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DRow({ label, value }: { label: string; value: any }) {
  return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{typeof value === "string" ? value : value}</span></div>;
}