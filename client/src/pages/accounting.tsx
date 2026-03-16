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
  BookOpen,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Layers,
  Shield,
  Wallet,
  ChevronRight,
  Filter,
  X,
  Eye,
  Link2,
  Lock,
  Building2,
  Hash,
  Banknote,
  Users,
  FileText,
  CreditCard,
  Calendar,
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle,
  Paperclip,
  Clock,
  AlertTriangle,
  Ban,
  Landmark,
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertAccountSchema,
  insertAccountTypeSchema,
  insertTransactionSchema,
  insertBudgetSchema,
  insertBudgetAllocationSchema,
  type Account,
  type InsertAccount,
  type AccountType,
  type InsertAccountType,
  type Transaction,
  type InsertTransaction,
  type Budget,
  type InsertBudget,
  type BudgetAllocation,
  type InsertBudgetAllocation,
  type Customer,
  type Vendor,
} from "@shared/schema";
import { z } from "zod";

const accountTypeFormSchema = insertAccountTypeSchema.extend({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  category: z.string().min(1, "Category is required"),
  normalBalance: z.string().min(1, "Normal balance is required"),
});

const newAccountFormSchema = insertAccountSchema.extend({
  code: z.string().min(1, "Account code is required"),
  name: z.string().min(1, "Account name is required"),
  type: z.string().min(1, "Account type category is required"),
});

const incomeFormSchema = insertTransactionSchema.extend({
  txnId: z.string().min(1, "Reference number is required"),
  amount: z.string().min(1, "Amount is required"),
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Income type is required"),
  debitAccountId: z.number().nullable().optional(),
  creditAccountId: z.number().nullable().optional(),
});

const expenseFormSchema = insertTransactionSchema.extend({
  txnId: z.string().min(1, "Reference number is required"),
  amount: z.string().min(1, "Amount is required"),
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Expense category is required"),
  debitAccountId: z.number().nullable().optional(),
  creditAccountId: z.number().nullable().optional(),
});

const budgetFormSchema = insertBudgetSchema.extend({
  name: z.string().min(1, "Budget name is required"),
  year: z.number().min(2020, "Valid year required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  totalAmount: z.string().min(1, "Total amount is required"),
});

const allocationFormSchema = insertBudgetAllocationSchema.extend({
  allocatedAmount: z.string().min(1, "Amount is required"),
});

const categoryConfig: Record<string, { label: string; gradient: string; icon: any; badgeClass: string }> = {
  asset: { label: "Asset", gradient: "from-emerald-500 to-emerald-600", icon: Wallet, badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  liability: { label: "Liability", gradient: "from-red-500 to-red-600", icon: Shield, badgeClass: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800" },
  equity: { label: "Equity", gradient: "from-purple-500 to-purple-600", icon: Layers, badgeClass: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
  revenue: { label: "Revenue", gradient: "from-teal-500 to-teal-600", icon: TrendingUp, badgeClass: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800" },
  expense: { label: "Expense", gradient: "from-orange-500 to-orange-600", icon: TrendingDown, badgeClass: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
};

const typeConfig: Record<string, string> = {
  asset: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950",
  liability: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950",
  income: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950",
  expense: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950",
  equity: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950",
  revenue: "text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950",
};

function BooleanToggle({ label, value, onChange, testId }: { label: string; value: boolean; onChange: (v: boolean) => void; testId: string }) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md border cursor-pointer transition-colors ${
        value ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
      }`}
      onClick={() => onChange(!value)}
      data-testid={testId}
    >
      <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
        value ? "bg-blue-600 border-blue-600" : "border-slate-300 dark:border-slate-600"
      }`}>
        {value && <CheckCircle className="h-3 w-3 text-white" />}
      </div>
      <span className="text-sm font-medium select-none">{label}</span>
    </div>
  );
}

export default function AccountingPage() {
  const { toast } = useToast();
  const [tab, changeTab] = useTab("types");

  const [atSearch, setAtSearch] = useState("");
  const [atCategoryFilter, setAtCategoryFilter] = useState("all");
  const [atStatusFilter, setAtStatusFilter] = useState("all");
  const [atDialogOpen, setAtDialogOpen] = useState(false);
  const [editingAccountType, setEditingAccountType] = useState<AccountType | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [accSearch, setAccSearch] = useState("");
  const [accTypeFilter, setAccTypeFilter] = useState("all");
  const [accStatusFilter, setAccStatusFilter] = useState("all");
  const [accDialogOpen, setAccDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteAccConfirmId, setDeleteAccConfirmId] = useState<number | null>(null);
  const [detailAccount, setDetailAccount] = useState<Account | null>(null);

  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingIncomeTxn, setEditingIncomeTxn] = useState<Transaction | null>(null);
  const [editingExpenseTxn, setEditingExpenseTxn] = useState<Transaction | null>(null);
  const [incomeSearch, setIncomeSearch] = useState("");
  const [incomeDateFilter, setIncomeDateFilter] = useState("");
  const [incomeMethodFilter, setIncomeMethodFilter] = useState("all");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseDateFilter, setExpenseDateFilter] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all");
  const [voidConfirmId, setVoidConfirmId] = useState<number | null>(null);
  const [deleteTxnConfirmId, setDeleteTxnConfirmId] = useState<number | null>(null);
  const [detailTxn, setDetailTxn] = useState<Transaction | null>(null);

  const { data: accountTypes = [], isLoading: atLoading } = useQuery<AccountType[]>({
    queryKey: ["/api/account-types"],
  });

  const { data: accounts = [], isLoading: accLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: transactions = [], isLoading: txnLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: customersList = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: vendorsList = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const atForm = useForm<InsertAccountType>({
    resolver: zodResolver(accountTypeFormSchema),
    defaultValues: {
      name: "", code: "", category: "asset", normalBalance: "debit", parentId: null,
      description: "", includeTrialBalance: true, includeProfitLoss: false, includeBalanceSheet: false,
      allowSubAccounts: true, allowDirectPosting: true, isSystemDefault: false, isActive: true, sortOrder: 0,
    },
  });

  const accForm = useForm<InsertAccount>({
    resolver: zodResolver(newAccountFormSchema),
    defaultValues: {
      code: "", name: "", type: "asset", accountTypeId: null, parentId: null, description: "",
      normalBalance: "debit", openingBalance: "0", openingBalanceDate: "", balance: "0",
      currency: "PKR", linkCustomer: false, linkVendor: false, linkPayroll: false,
      linkResellerWallet: false, linkCommission: false, linkExpense: false, linkBankReconciliation: false,
      allowDirectPosting: true, systemGeneratedOnly: false, lockAfterTransactions: false, taxApplicable: false,
      branch: "", reportingGroup: "", categoryTag: "", isActive: true, isSystemDefault: false,
    },
  });

  const incomeForm = useForm<InsertTransaction>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      txnId: "", type: "income", category: "customer_payment", amount: "0", tax: "0", discount: "0",
      debitAccountId: null, creditAccountId: null, accountId: null, customerId: null, vendorId: null,
      invoiceId: null, paymentMethod: "cash", reference: "", chequeNumber: "", transactionRef: "",
      description: "", date: new Date().toISOString().split("T")[0], status: "completed",
      branch: "", costCenter: "", autoAdjustReceivable: false, allowPartialPayment: false,
      sendNotification: false, lockAfterSave: false, isRecurring: false, requireApproval: false,
    },
  });

  const expenseForm = useForm<InsertTransaction>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      txnId: "", type: "expense", category: "vendor_payment", amount: "0", tax: "0", discount: "0",
      debitAccountId: null, creditAccountId: null, accountId: null, customerId: null, vendorId: null,
      invoiceId: null, paymentMethod: "cash", reference: "", chequeNumber: "", transactionRef: "",
      description: "", date: new Date().toISOString().split("T")[0], status: "completed",
      branch: "", costCenter: "", autoAdjustReceivable: false, allowPartialPayment: false,
      sendNotification: false, lockAfterSave: false, isRecurring: false, requireApproval: false,
    },
  });

  const watchAtCategory = atForm.watch("category");
  useEffect(() => {
    if (!editingAccountType) {
      const nb = (watchAtCategory === "asset" || watchAtCategory === "expense") ? "debit" : "credit";
      atForm.setValue("normalBalance", nb);
      atForm.setValue("includeProfitLoss", watchAtCategory === "revenue" || watchAtCategory === "expense");
      atForm.setValue("includeBalanceSheet", watchAtCategory === "asset" || watchAtCategory === "liability" || watchAtCategory === "equity");
    }
  }, [watchAtCategory, editingAccountType]);

  const watchAccType = accForm.watch("type");
  const watchAccTypeId = accForm.watch("accountTypeId");
  useEffect(() => {
    if (!editingAccount) {
      const nb = (watchAccType === "asset" || watchAccType === "expense") ? "debit" : "credit";
      accForm.setValue("normalBalance", nb);
    }
  }, [watchAccType, editingAccount]);

  useEffect(() => {
    if (watchAccTypeId && accountTypes.length > 0) {
      const at = accountTypes.find((a) => a.id === watchAccTypeId);
      if (at && !editingAccount) {
        accForm.setValue("type", at.category);
        accForm.setValue("normalBalance", at.normalBalance);
      }
    }
  }, [watchAccTypeId, accountTypes, editingAccount]);

  const atCreateMutation = useMutation({
    mutationFn: async (data: InsertAccountType) => { const res = await apiRequest("POST", "/api/account-types", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/account-types"] }); setAtDialogOpen(false); atForm.reset(); setEditingAccountType(null); toast({ title: "Account type created successfully" }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const atUpdateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAccountType> }) => { const res = await apiRequest("PATCH", `/api/account-types/${id}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/account-types"] }); setAtDialogOpen(false); setEditingAccountType(null); atForm.reset(); toast({ title: "Account type updated successfully" }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const atDeleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/account-types/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/account-types"] }); setDeleteConfirmId(null); toast({ title: "Account type deleted successfully" }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); setDeleteConfirmId(null); },
  });

  const accCreateMutation = useMutation({
    mutationFn: async (data: InsertAccount) => { const res = await apiRequest("POST", "/api/accounts", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/accounts"] }); toast({ title: "Account created successfully" }); if (tab === "add") { accForm.reset(); } else { setAccDialogOpen(false); setEditingAccount(null); accForm.reset(); } },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const accUpdateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAccount> }) => { const res = await apiRequest("PATCH", `/api/accounts/${id}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/accounts"] }); setAccDialogOpen(false); setEditingAccount(null); accForm.reset(); toast({ title: "Account updated successfully" }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const accDeleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/accounts/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/accounts"] }); setDeleteAccConfirmId(null); toast({ title: "Account deleted successfully" }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); setDeleteAccConfirmId(null); },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const netAmount = Number(data.amount || 0) + Number(data.tax || 0) - Number(data.discount || 0);
      const payload = { ...data, netAmount: String(netAmount) };
      const res = await apiRequest("POST", "/api/transactions", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setIncomeDialogOpen(false); setExpenseDialogOpen(false);
      setEditingIncomeTxn(null); setEditingExpenseTxn(null);
      incomeForm.reset(); expenseForm.reset();
      toast({ title: "Transaction recorded successfully" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertTransaction> }) => {
      const netAmount = Number(data.amount || 0) + Number(data.tax || 0) - Number(data.discount || 0);
      const payload = { ...data, netAmount: String(netAmount) };
      const res = await apiRequest("PATCH", `/api/transactions/${id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setIncomeDialogOpen(false); setExpenseDialogOpen(false);
      setEditingIncomeTxn(null); setEditingExpenseTxn(null);
      incomeForm.reset(); expenseForm.reset();
      toast({ title: "Transaction updated successfully" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const voidTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/transactions/${id}`, { status: "voided" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setVoidConfirmId(null);
      toast({ title: "Transaction voided successfully" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); setVoidConfirmId(null); },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/transactions/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setDeleteTxnConfirmId(null);
      toast({ title: "Transaction deleted successfully" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); setDeleteTxnConfirmId(null); },
  });

  const openAtCreate = () => {
    setEditingAccountType(null);
    const nextCode = `AT-${String((accountTypes.length + 1) * 10).padStart(3, "0")}`;
    atForm.reset({ name: "", code: nextCode, category: "asset", normalBalance: "debit", parentId: null, description: "", includeTrialBalance: true, includeProfitLoss: false, includeBalanceSheet: true, allowSubAccounts: true, allowDirectPosting: true, isSystemDefault: false, isActive: true, sortOrder: accountTypes.length + 1 });
    setAtDialogOpen(true);
  };

  const openAtEdit = (at: AccountType) => {
    setEditingAccountType(at);
    atForm.reset({ name: at.name, code: at.code, category: at.category, normalBalance: at.normalBalance, parentId: at.parentId, description: at.description || "", includeTrialBalance: at.includeTrialBalance, includeProfitLoss: at.includeProfitLoss, includeBalanceSheet: at.includeBalanceSheet, allowSubAccounts: at.allowSubAccounts, allowDirectPosting: at.allowDirectPosting, isSystemDefault: at.isSystemDefault, isActive: at.isActive, sortOrder: at.sortOrder });
    setAtDialogOpen(true);
  };

  const onAtSubmit = (data: InsertAccountType) => {
    if (editingAccountType) { atUpdateMutation.mutate({ id: editingAccountType.id, data }); }
    else { atCreateMutation.mutate(data); }
  };

  const openAccEdit = (acc: Account) => {
    setEditingAccount(acc);
    accForm.reset({
      code: acc.code, name: acc.name, type: acc.type, accountTypeId: acc.accountTypeId, parentId: acc.parentId,
      description: acc.description || "", normalBalance: acc.normalBalance, openingBalance: acc.openingBalance || "0",
      openingBalanceDate: acc.openingBalanceDate || "", balance: acc.balance || "0", currency: acc.currency,
      linkCustomer: acc.linkCustomer, linkVendor: acc.linkVendor, linkPayroll: acc.linkPayroll,
      linkResellerWallet: acc.linkResellerWallet, linkCommission: acc.linkCommission, linkExpense: acc.linkExpense,
      linkBankReconciliation: acc.linkBankReconciliation, allowDirectPosting: acc.allowDirectPosting,
      systemGeneratedOnly: acc.systemGeneratedOnly, lockAfterTransactions: acc.lockAfterTransactions,
      taxApplicable: acc.taxApplicable, branch: acc.branch || "", reportingGroup: acc.reportingGroup || "",
      categoryTag: acc.categoryTag || "", isActive: acc.isActive, isSystemDefault: acc.isSystemDefault,
      bankName: acc.bankName || "", bankAccountTitle: acc.bankAccountTitle || "", bankAccountNumber: acc.bankAccountNumber || "",
      bankBranchCode: acc.bankBranchCode || "", bankIban: acc.bankIban || "", bankSwiftCode: acc.bankSwiftCode || "", bankAddress: acc.bankAddress || "",
    });
    setAccDialogOpen(true);
  };

  const onAccSubmit = (data: InsertAccount) => {
    if (editingAccount) { accUpdateMutation.mutate({ id: editingAccount.id, data }); }
    else { accCreateMutation.mutate(data); }
  };

  const resetAddForm = () => {
    const nextCode = `ACC-${String(accounts.length + 1).padStart(4, "0")}`;
    accForm.reset({
      code: nextCode, name: "", type: "asset", accountTypeId: null, parentId: null, description: "",
      normalBalance: "debit", openingBalance: "0", openingBalanceDate: new Date().toISOString().split("T")[0],
      balance: "0", currency: "PKR", linkCustomer: false, linkVendor: false, linkPayroll: false,
      linkResellerWallet: false, linkCommission: false, linkExpense: false, linkBankReconciliation: false,
      allowDirectPosting: true, systemGeneratedOnly: false, lockAfterTransactions: false, taxApplicable: false,
      branch: "", reportingGroup: "", categoryTag: "", isActive: true, isSystemDefault: false,
      bankName: "", bankAccountTitle: "", bankAccountNumber: "", bankBranchCode: "", bankIban: "", bankSwiftCode: "", bankAddress: "",
    });
  };

  useEffect(() => {
    if (tab === "add") { resetAddForm(); }
  }, [tab, accounts.length]);

  const filteredAccountTypes = accountTypes.filter((at) => {
    const matchSearch = atSearch === "" || at.name.toLowerCase().includes(atSearch.toLowerCase()) || at.code.toLowerCase().includes(atSearch.toLowerCase());
    const matchCategory = atCategoryFilter === "all" || at.category === atCategoryFilter;
    const matchStatus = atStatusFilter === "all" || (atStatusFilter === "active" && at.isActive) || (atStatusFilter === "inactive" && !at.isActive);
    return matchSearch && matchCategory && matchStatus;
  });

  const filteredAccounts = accounts.filter((acc) => {
    const matchSearch = accSearch === "" || acc.name.toLowerCase().includes(accSearch.toLowerCase()) || acc.code.toLowerCase().includes(accSearch.toLowerCase());
    const matchType = accTypeFilter === "all" || acc.type === accTypeFilter;
    const matchStatus = accStatusFilter === "all" || (accStatusFilter === "active" && acc.isActive) || (accStatusFilter === "inactive" && !acc.isActive);
    return matchSearch && matchType && matchStatus;
  });

  const hasAtFilters = atSearch !== "" || atCategoryFilter !== "all" || atStatusFilter !== "all";
  const hasAccFilters = accSearch !== "" || accTypeFilter !== "all" || accStatusFilter !== "all";

  const parentTypeMap = new Map<number, AccountType>();
  accountTypes.forEach((at) => parentTypeMap.set(at.id, at));

  const parentAccMap = new Map<number, Account>();
  accounts.forEach((acc) => parentAccMap.set(acc.id, acc));

  const atKpis = {
    total: accountTypes.length,
    asset: accountTypes.filter((a) => a.category === "asset").length,
    liability: accountTypes.filter((a) => a.category === "liability").length,
    revenue: accountTypes.filter((a) => a.category === "revenue").length,
    expense: accountTypes.filter((a) => a.category === "expense").length,
  };

  const accKpis = {
    total: accounts.length,
    active: accounts.filter((a) => a.isActive).length,
    totalAssets: accounts.filter((a) => a.type === "asset").reduce((s, a) => s + Number(a.balance || 0), 0),
    totalLiabilities: accounts.filter((a) => a.type === "liability").reduce((s, a) => s + Number(a.balance || 0), 0),
    revenueCount: accounts.filter((a) => a.type === "revenue").length,
    expenseCount: accounts.filter((a) => a.type === "expense").length,
  };

  const allIncomeTransactions = transactions.filter((t: any) => t.type === "income" || t.type === "payment");
  const allExpenseTransactions = transactions.filter((t: any) => t.type === "expense");

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = new Date().toISOString().slice(0, 7);

  const incomeKpis = {
    todayTotal: allIncomeTransactions.filter((t) => t.date === today && t.status !== "voided").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0),
    monthTotal: allIncomeTransactions.filter((t) => t.date?.startsWith(thisMonth) && t.status !== "voided").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0),
    totalOutstanding: allIncomeTransactions.filter((t) => t.status === "pending").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0),
    cashCount: allIncomeTransactions.filter((t) => t.paymentMethod === "cash" && t.status !== "voided").length,
    bankCount: allIncomeTransactions.filter((t) => (t.paymentMethod === "bank_transfer" || t.paymentMethod === "cheque") && t.status !== "voided").length,
    onlineCount: allIncomeTransactions.filter((t) => (t.paymentMethod === "online" || t.paymentMethod === "jazzcash") && t.status !== "voided").length,
  };

  const expenseKpis = {
    todayTotal: allExpenseTransactions.filter((t) => t.date === today && t.status !== "voided").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0),
    monthTotal: allExpenseTransactions.filter((t) => t.date?.startsWith(thisMonth) && t.status !== "voided").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0),
    vendorPayable: allExpenseTransactions.filter((t) => t.status === "pending").reduce((s, t) => s + Number(t.netAmount || t.amount || 0), 0),
    categoryBreakdown: {
      vendor: allExpenseTransactions.filter((t) => t.category === "vendor_payment" && t.status !== "voided").length,
      salary: allExpenseTransactions.filter((t) => t.category === "salary" && t.status !== "voided").length,
      operational: allExpenseTransactions.filter((t) => (t.category === "utility" || t.category === "maintenance" || t.category === "other_expense" || t.category === "operational") && t.status !== "voided").length,
    },
  };

  const filteredIncome = allIncomeTransactions.filter((t: any) => {
    const matchSearch = incomeSearch === "" || t.txnId?.toLowerCase().includes(incomeSearch.toLowerCase()) || t.description?.toLowerCase().includes(incomeSearch.toLowerCase()) || (t as any).customerName?.toLowerCase().includes(incomeSearch.toLowerCase());
    const matchDate = incomeDateFilter === "" || t.date === incomeDateFilter;
    const matchMethod = incomeMethodFilter === "all" || t.paymentMethod === incomeMethodFilter;
    return matchSearch && matchDate && matchMethod;
  });

  const filteredExpense = allExpenseTransactions.filter((t: any) => {
    const matchSearch = expenseSearch === "" || t.txnId?.toLowerCase().includes(expenseSearch.toLowerCase()) || t.description?.toLowerCase().includes(expenseSearch.toLowerCase()) || (t as any).vendorName?.toLowerCase().includes(expenseSearch.toLowerCase());
    const matchDate = expenseDateFilter === "" || t.date === expenseDateFilter;
    const matchCategory = expenseCategoryFilter === "all" || t.category === expenseCategoryFilter;
    return matchSearch && matchDate && matchCategory;
  });

  const debitAccounts = accounts.filter((a) => a.type === "asset");
  const creditRevenueAccounts = accounts.filter((a) => a.type === "revenue" || a.type === "income");
  const expenseAccounts = accounts.filter((a) => a.type === "expense");
  const paymentSourceAccounts = accounts.filter((a) => a.type === "asset");

  const genIncomeRef = () => `INC-${Date.now().toString(36).toUpperCase()}`;
  const genExpenseRef = () => `EXP-${Date.now().toString(36).toUpperCase()}`;

  const openIncomeCreate = () => {
    setEditingIncomeTxn(null);
    incomeForm.reset({
      txnId: genIncomeRef(), type: "income", category: "customer_payment", amount: "0", tax: "0", discount: "0",
      debitAccountId: null, creditAccountId: null, accountId: null, customerId: null, vendorId: null,
      invoiceId: null, paymentMethod: "cash", reference: "", chequeNumber: "", transactionRef: "",
      description: "", date: new Date().toISOString().split("T")[0], status: "completed",
      branch: "", costCenter: "", autoAdjustReceivable: false, allowPartialPayment: false,
      sendNotification: false, lockAfterSave: false, isRecurring: false, requireApproval: false,
    });
    setIncomeDialogOpen(true);
  };

  const openIncomeEdit = (txn: Transaction) => {
    setEditingIncomeTxn(txn);
    incomeForm.reset({
      txnId: txn.txnId, type: txn.type, category: txn.category || "customer_payment",
      amount: txn.amount, tax: txn.tax || "0", discount: txn.discount || "0",
      debitAccountId: txn.debitAccountId, creditAccountId: txn.creditAccountId,
      accountId: txn.accountId, customerId: txn.customerId, vendorId: txn.vendorId,
      invoiceId: txn.invoiceId, paymentMethod: txn.paymentMethod || "cash",
      reference: txn.reference || "", chequeNumber: txn.chequeNumber || "", transactionRef: txn.transactionRef || "",
      description: txn.description || "", date: txn.date, status: txn.status,
      branch: txn.branch || "", costCenter: txn.costCenter || "",
      autoAdjustReceivable: txn.autoAdjustReceivable, allowPartialPayment: txn.allowPartialPayment,
      sendNotification: txn.sendNotification, lockAfterSave: txn.lockAfterSave,
      isRecurring: txn.isRecurring, requireApproval: txn.requireApproval,
    });
    setIncomeDialogOpen(true);
  };

  const openExpenseCreate = () => {
    setEditingExpenseTxn(null);
    expenseForm.reset({
      txnId: genExpenseRef(), type: "expense", category: "vendor_payment", amount: "0", tax: "0", discount: "0",
      debitAccountId: null, creditAccountId: null, accountId: null, customerId: null, vendorId: null,
      invoiceId: null, paymentMethod: "cash", reference: "", chequeNumber: "", transactionRef: "",
      description: "", date: new Date().toISOString().split("T")[0], status: "completed",
      branch: "", costCenter: "", autoAdjustReceivable: false, allowPartialPayment: false,
      sendNotification: false, lockAfterSave: false, isRecurring: false, requireApproval: false,
    });
    setExpenseDialogOpen(true);
  };

  const openExpenseEdit = (txn: Transaction) => {
    setEditingExpenseTxn(txn);
    expenseForm.reset({
      txnId: txn.txnId, type: txn.type, category: txn.category || "vendor_payment",
      amount: txn.amount, tax: txn.tax || "0", discount: txn.discount || "0",
      debitAccountId: txn.debitAccountId, creditAccountId: txn.creditAccountId,
      accountId: txn.accountId, customerId: txn.customerId, vendorId: txn.vendorId,
      invoiceId: txn.invoiceId, paymentMethod: txn.paymentMethod || "cash",
      reference: txn.reference || "", chequeNumber: txn.chequeNumber || "", transactionRef: txn.transactionRef || "",
      description: txn.description || "", date: txn.date, status: txn.status,
      branch: txn.branch || "", costCenter: txn.costCenter || "",
      autoAdjustReceivable: txn.autoAdjustReceivable, allowPartialPayment: txn.allowPartialPayment,
      sendNotification: txn.sendNotification, lockAfterSave: txn.lockAfterSave,
      isRecurring: txn.isRecurring, requireApproval: txn.requireApproval,
    });
    setExpenseDialogOpen(true);
  };

  const onIncomeSubmit = (data: InsertTransaction) => {
    if (editingIncomeTxn) { updateTransactionMutation.mutate({ id: editingIncomeTxn.id, data }); }
    else { createTransactionMutation.mutate(data); }
  };

  const onExpenseSubmit = (data: InsertTransaction) => {
    if (editingExpenseTxn) { updateTransactionMutation.mutate({ id: editingExpenseTxn.id, data }); }
    else { createTransactionMutation.mutate(data); }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, string> = {
      completed: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
      pending: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
      voided: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
    };
    return configs[status] || configs.completed;
  };

  const paymentMethodLabel = (m: string | null) => {
    const labels: Record<string, string> = { cash: "Cash", bank_transfer: "Bank Transfer", cheque: "Cheque", online: "Online", jazzcash: "JazzCash/Wallet" };
    return labels[m || ""] || m || "—";
  };

  const incomeCategoryLabel = (c: string | null) => {
    const labels: Record<string, string> = { customer_payment: "Customer Payment", installation_fee: "Installation Fee", other_income: "Other Income", manual_revenue: "Manual Revenue", cir_revenue: "CIR Revenue", corporate_revenue: "Corporate Revenue" };
    return labels[c || ""] || c || "—";
  };

  const expenseCategoryLabel = (c: string | null) => {
    const labels: Record<string, string> = { vendor_payment: "Vendor Payment", salary: "Salary", commission: "Commission", utility: "Utility", maintenance: "Maintenance", other_expense: "Other Expense", bandwidth: "Bandwidth", operational: "Operational" };
    return labels[c || ""] || c || "—";
  };

  const getLinkedModules = (acc: Account) => {
    const links: string[] = [];
    if (acc.linkCustomer) links.push("Customer");
    if (acc.linkVendor) links.push("Vendor");
    if (acc.linkPayroll) links.push("Payroll");
    if (acc.linkResellerWallet) links.push("Reseller");
    if (acc.linkCommission) links.push("Commission");
    if (acc.linkExpense) links.push("Expense");
    if (acc.linkBankReconciliation) links.push("Bank");
    return links;
  };

  const getAccountTypeName = (typeId: number | null) => {
    if (!typeId) return "—";
    const at = parentTypeMap.get(typeId);
    return at ? at.name : "—";
  };

  const renderAccountForm = (isDialog: boolean) => {
    return (
      <Form {...accForm}>
        <form onSubmit={accForm.handleSubmit(onAccSubmit)} className="space-y-6">
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Basic Account Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={accForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Account Name</FormLabel><FormControl><Input placeholder="e.g. HBL Bank Main" data-testid="input-acc-name" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={accForm.control} name="code" render={({ field }) => (
                <FormItem><FormLabel>Account Code</FormLabel><FormControl><Input placeholder="ACC-0001" data-testid="input-acc-code" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={accForm.control} name="accountTypeId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}>
                    <FormControl><SelectTrigger data-testid="select-acc-type-id"><SelectValue placeholder="Select Account Type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {accountTypes.filter((a) => a.isActive).map((a) => (
                        <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={accForm.control} name="parentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Account</FormLabel>
                  <Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}>
                    <FormControl><SelectTrigger data-testid="select-acc-parent"><SelectValue placeholder="None (Top Level)" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">None (Top Level)</SelectItem>
                      {accounts.filter((a) => !editingAccount || a.id !== editingAccount.id).map((a) => (
                        <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={accForm.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Account description..." rows={2} data-testid="input-acc-description" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Financial Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField control={accForm.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "asset"}>
                    <FormControl><SelectTrigger data-testid="select-acc-category"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="asset">Asset</SelectItem>
                      <SelectItem value="liability">Liability</SelectItem>
                      <SelectItem value="equity">Equity</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={accForm.control} name="normalBalance" render={({ field }) => (
                <FormItem>
                  <FormLabel>Normal Balance</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "debit"}>
                    <FormControl><SelectTrigger data-testid="select-acc-normal-balance"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="debit">Debit</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={accForm.control} name="currency" render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "PKR"}>
                    <FormControl><SelectTrigger data-testid="select-acc-currency"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="PKR">PKR — Pakistani Rupee</SelectItem>
                      <SelectItem value="USD">USD — US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR — Euro</SelectItem>
                      <SelectItem value="GBP">GBP — British Pound</SelectItem>
                      <SelectItem value="AED">AED — UAE Dirham</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField control={accForm.control} name="openingBalance" render={({ field }) => (
                <FormItem><FormLabel>Opening Balance</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-acc-opening-balance" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={accForm.control} name="openingBalanceDate" render={({ field }) => (
                <FormItem><FormLabel>Opening Balance Date</FormLabel><FormControl><Input type="date" data-testid="input-acc-ob-date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={accForm.control} name="isActive" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={(v) => field.onChange(v === "true")} value={field.value ? "true" : "false"}>
                    <FormControl><SelectTrigger data-testid="select-acc-status"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" /> System Integration Mapping
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <FormField control={accForm.control} name="linkCustomer" render={({ field }) => (
                <FormItem><BooleanToggle label="Customer Module" value={!!field.value} onChange={field.onChange} testId="toggle-link-customer" /></FormItem>
              )} />
              <FormField control={accForm.control} name="linkVendor" render={({ field }) => (
                <FormItem><BooleanToggle label="Vendor Module" value={!!field.value} onChange={field.onChange} testId="toggle-link-vendor" /></FormItem>
              )} />
              <FormField control={accForm.control} name="linkPayroll" render={({ field }) => (
                <FormItem><BooleanToggle label="Payroll" value={!!field.value} onChange={field.onChange} testId="toggle-link-payroll" /></FormItem>
              )} />
              <FormField control={accForm.control} name="linkResellerWallet" render={({ field }) => (
                <FormItem><BooleanToggle label="Reseller Wallet" value={!!field.value} onChange={field.onChange} testId="toggle-link-reseller" /></FormItem>
              )} />
              <FormField control={accForm.control} name="linkCommission" render={({ field }) => (
                <FormItem><BooleanToggle label="Commission" value={!!field.value} onChange={field.onChange} testId="toggle-link-commission" /></FormItem>
              )} />
              <FormField control={accForm.control} name="linkExpense" render={({ field }) => (
                <FormItem><BooleanToggle label="Expense Module" value={!!field.value} onChange={field.onChange} testId="toggle-link-expense" /></FormItem>
              )} />
              <FormField control={accForm.control} name="linkBankReconciliation" render={({ field }) => (
                <FormItem><BooleanToggle label="Bank Reconciliation" value={!!field.value} onChange={field.onChange} testId="toggle-link-bank" /></FormItem>
              )} />
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Posting Control
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FormField control={accForm.control} name="allowDirectPosting" render={({ field }) => (
                <FormItem><BooleanToggle label="Direct Posting" value={!!field.value} onChange={field.onChange} testId="toggle-direct-posting" /></FormItem>
              )} />
              <FormField control={accForm.control} name="systemGeneratedOnly" render={({ field }) => (
                <FormItem><BooleanToggle label="System Only" value={!!field.value} onChange={field.onChange} testId="toggle-system-only" /></FormItem>
              )} />
              <FormField control={accForm.control} name="lockAfterTransactions" render={({ field }) => (
                <FormItem><BooleanToggle label="Lock After Txn" value={!!field.value} onChange={field.onChange} testId="toggle-lock-txn" /></FormItem>
              )} />
              <FormField control={accForm.control} name="taxApplicable" render={({ field }) => (
                <FormItem><BooleanToggle label="Tax Applicable" value={!!field.value} onChange={field.onChange} testId="toggle-tax" /></FormItem>
              )} />
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Advanced Options
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField control={accForm.control} name="branch" render={({ field }) => (
                <FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="e.g. Head Office" data-testid="input-acc-branch" {...field} value={field.value || ""} /></FormControl></FormItem>
              )} />
              <FormField control={accForm.control} name="reportingGroup" render={({ field }) => (
                <FormItem><FormLabel>Reporting Group</FormLabel><FormControl><Input placeholder="e.g. Operating" data-testid="input-acc-reporting-group" {...field} value={field.value || ""} /></FormControl></FormItem>
              )} />
              <FormField control={accForm.control} name="categoryTag" render={({ field }) => (
                <FormItem><FormLabel>Category Tag</FormLabel><FormControl><Input placeholder="e.g. Core Banking" data-testid="input-acc-category-tag" {...field} value={field.value || ""} /></FormControl></FormItem>
              )} />
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5" /> Bank Account Detail
            </h3>
            <p className="text-xs text-muted-foreground">Fill in bank details if this account is linked to a bank or financial institution</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={accForm.control} name="bankName" render={({ field }) => (
                <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input placeholder="e.g. HBL, MCB, UBL, Meezan Bank" data-testid="input-acc-bank-name" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={accForm.control} name="bankAccountTitle" render={({ field }) => (
                <FormItem><FormLabel>Account Title</FormLabel><FormControl><Input placeholder="e.g. NetSphere Pvt Ltd" data-testid="input-acc-bank-title" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={accForm.control} name="bankAccountNumber" render={({ field }) => (
                <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input placeholder="e.g. 0012345678901" data-testid="input-acc-bank-number" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={accForm.control} name="bankBranchCode" render={({ field }) => (
                <FormItem><FormLabel>Branch Code</FormLabel><FormControl><Input placeholder="e.g. 0154" data-testid="input-acc-bank-branch-code" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={accForm.control} name="bankIban" render={({ field }) => (
                <FormItem><FormLabel>IBAN</FormLabel><FormControl><Input placeholder="e.g. PK36HABB0000111222333444" data-testid="input-acc-bank-iban" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={accForm.control} name="bankSwiftCode" render={({ field }) => (
                <FormItem><FormLabel>SWIFT / BIC Code</FormLabel><FormControl><Input placeholder="e.g. HABORPKAXXX" data-testid="input-acc-bank-swift" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={accForm.control} name="bankAddress" render={({ field }) => (
              <FormItem><FormLabel>Bank Branch Address</FormLabel><FormControl><Input placeholder="e.g. Main Branch, Mall Road, Lahore" data-testid="input-acc-bank-address" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          {isDialog ? (
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => { setAccDialogOpen(false); setEditingAccount(null); }}>Cancel</Button>
              <Button type="submit" disabled={accCreateMutation.isPending || accUpdateMutation.isPending} data-testid="button-save-account">
                {accCreateMutation.isPending || accUpdateMutation.isPending ? "Saving..." : editingAccount ? "Update Account" : "Create Account"}
              </Button>
            </DialogFooter>
          ) : (
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={resetAddForm} data-testid="button-reset-form">Reset</Button>
              <Button type="submit" disabled={accCreateMutation.isPending} data-testid="button-create-account">
                {accCreateMutation.isPending ? "Creating..." : "Create Account"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-accounting-title">Accounting</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage chart of accounts, income, expenses, and budgets</p>
        </div>
      </div>

      {/* ===== ACCOUNT TYPES TAB ===== */}
      {tab === "types" && (
        <div className="mt-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Total Account Types", value: atKpis.total, icon: Layers, gradient: "from-[#002B5B] to-[#007BFF]" },
              { label: "Asset Categories", value: atKpis.asset, icon: Wallet, gradient: "from-emerald-500 to-emerald-600" },
              { label: "Liability Categories", value: atKpis.liability, icon: Shield, gradient: "from-red-500 to-red-600" },
              { label: "Revenue Categories", value: atKpis.revenue, icon: TrendingUp, gradient: "from-teal-500 to-teal-600" },
              { label: "Expense Categories", value: atKpis.expense, icon: TrendingDown, gradient: "from-orange-500 to-orange-600" },
            ].map((kpi) => (
              <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-md p-4 text-white shadow-sm`} data-testid={`card-kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="h-5 w-5 text-white/60" />
                </div>
                <div className="text-2xl font-bold">{atLoading ? "—" : kpi.value}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full">
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or code..." value={atSearch} onChange={(e) => setAtSearch(e.target.value)} className="pl-9" data-testid="input-search-account-types" />
              </div>
              <Select value={atCategoryFilter} onValueChange={setAtCategoryFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-at-category-filter"><Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="asset">Asset</SelectItem><SelectItem value="liability">Liability</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem><SelectItem value="revenue">Revenue</SelectItem><SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Select value={atStatusFilter} onValueChange={setAtStatusFilter}>
                <SelectTrigger className="w-[130px]" data-testid="select-at-status-filter"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
              {hasAtFilters && <Button variant="ghost" size="sm" onClick={() => { setAtSearch(""); setAtCategoryFilter("all"); setAtStatusFilter("all"); }} data-testid="button-clear-at-filters"><X className="h-3.5 w-3.5 mr-1" />Clear</Button>}
            </div>
            <Button onClick={openAtCreate} data-testid="button-add-account-type"><Plus className="h-4 w-4 mr-1" />Add Account Type</Button>
          </div>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-0">
              {atLoading ? (
                <div className="p-5 space-y-3">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filteredAccountTypes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <BookOpen className="h-14 w-14 mb-3 opacity-20" /><p className="font-medium text-lg">No account types found</p>
                  <p className="text-sm mt-1">{hasAtFilters ? "Try adjusting your filters" : "Create your first account type to get started"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 border-0">
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Account Type</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Code</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Category</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Parent</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Normal Balance</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden lg:table-cell">Description</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Status</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden md:table-cell">Created</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAccountTypes.map((at, idx) => {
                        const cat = categoryConfig[at.category];
                        const isChild = at.parentId !== null;
                        return (
                          <TableRow key={at.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/40"} data-testid={`row-account-type-${at.id}`}>
                            <TableCell className="font-medium" data-testid={`text-at-name-${at.id}`}>
                              <div className="flex items-center gap-1.5">
                                {isChild && <span className="text-muted-foreground pl-3"><ChevronRight className="h-3.5 w-3.5 inline -mt-0.5" /></span>}
                                <span className={isChild ? "text-sm" : "font-semibold"}>{at.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground" data-testid={`text-at-code-${at.id}`}>{at.code}</TableCell>
                            <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] capitalize font-medium ${cat?.badgeClass || ""}`} data-testid={`badge-at-category-${at.id}`}>{cat?.label || at.category}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground" data-testid={`text-at-parent-${at.id}`}>{at.parentId ? (parentTypeMap.get(at.parentId)?.name || "—") : "—"}</TableCell>
                            <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] capitalize font-medium ${at.normalBalance === "debit" ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800" : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800"}`} data-testid={`badge-at-balance-${at.id}`}>{at.normalBalance}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate hidden lg:table-cell" data-testid={`text-at-desc-${at.id}`}>{at.description || "—"}</TableCell>
                            <TableCell><Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${at.isActive ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" : "text-gray-500 bg-gray-100 dark:bg-gray-900"}`} data-testid={`badge-at-status-${at.id}`}>{at.isActive ? <><CheckCircle className="h-3 w-3 mr-1" />Active</> : <><XCircle className="h-3 w-3 mr-1" />Inactive</>}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden md:table-cell" data-testid={`text-at-created-${at.id}`}>{at.createdAt ? new Date(at.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</TableCell>
                            <TableCell>
                              <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-at-actions-${at.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openAtEdit(at)} data-testid={`button-edit-at-${at.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirmId(at.id)} data-testid={`button-delete-at-${at.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
          <div className="text-xs text-muted-foreground text-right">Showing {filteredAccountTypes.length} of {accountTypes.length} account types</div>
        </div>
      )}

      {/* ===== ADD NEW ACCOUNT TAB ===== */}
      {tab === "add" && (
        <div className="mt-5">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-gradient-to-r from-[#002B5B] to-[#007BFF] text-white rounded-t-md">
              <CardTitle className="text-lg flex items-center gap-2" data-testid="text-add-account-title">
                <Plus className="h-5 w-5" /> Add New Account
              </CardTitle>
              <CardDescription className="text-white/70">Create a new ledger account in your chart of accounts</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {renderAccountForm(false)}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===== ACCOUNT LIST TAB ===== */}
      {tab === "accounts" && (
        <div className="mt-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { label: "Total Accounts", value: accKpis.total, icon: BookOpen, gradient: "from-[#002B5B] to-[#007BFF]", fmt: false },
              { label: "Active Accounts", value: accKpis.active, icon: CheckCircle, gradient: "from-emerald-500 to-emerald-600", fmt: false },
              { label: "Total Assets", value: accKpis.totalAssets, icon: Wallet, gradient: "from-green-500 to-green-600", fmt: true },
              { label: "Total Liabilities", value: accKpis.totalLiabilities, icon: Shield, gradient: "from-red-500 to-red-600", fmt: true },
              { label: "Revenue Accounts", value: accKpis.revenueCount, icon: TrendingUp, gradient: "from-teal-500 to-teal-600", fmt: false },
              { label: "Expense Accounts", value: accKpis.expenseCount, icon: TrendingDown, gradient: "from-orange-500 to-orange-600", fmt: false },
            ].map((kpi) => (
              <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-md p-4 text-white shadow-sm`} data-testid={`card-acc-kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-white/60" />
                </div>
                <div className="text-xl font-bold">{accLoading ? "—" : kpi.fmt ? `Rs. ${Number(kpi.value).toLocaleString()}` : kpi.value}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full">
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or code..." value={accSearch} onChange={(e) => setAccSearch(e.target.value)} className="pl-9" data-testid="input-search-accounts" />
              </div>
              <Select value={accTypeFilter} onValueChange={setAccTypeFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-acc-type-filter"><Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="asset">Asset</SelectItem><SelectItem value="liability">Liability</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem><SelectItem value="revenue">Revenue</SelectItem><SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Select value={accStatusFilter} onValueChange={setAccStatusFilter}>
                <SelectTrigger className="w-[130px]" data-testid="select-acc-status-filter"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
              {hasAccFilters && <Button variant="ghost" size="sm" onClick={() => { setAccSearch(""); setAccTypeFilter("all"); setAccStatusFilter("all"); }} data-testid="button-clear-acc-filters"><X className="h-3.5 w-3.5 mr-1" />Clear</Button>}
            </div>
            <Button onClick={() => { setEditingAccount(null); resetAddForm(); setAccDialogOpen(true); }} data-testid="button-add-account-list">
              <Plus className="h-4 w-4 mr-1" />Add Account
            </Button>
          </div>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-0">
              {accLoading ? (
                <div className="p-5 space-y-3">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filteredAccounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <BookOpen className="h-14 w-14 mb-3 opacity-20" /><p className="font-medium text-lg">No accounts found</p>
                  <p className="text-sm mt-1">{hasAccFilters ? "Try adjusting your filters" : "Create your first account"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 border-0">
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Code</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Account Name</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Account Type</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Parent</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Current Balance</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Currency</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5">Status</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden lg:table-cell">Linked</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 hidden md:table-cell">Created</TableHead>
                        <TableHead className="text-white font-semibold text-xs uppercase tracking-wider py-3.5 w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAccounts.map((acc, idx) => {
                        const cat = categoryConfig[acc.type];
                        const linkedMods = getLinkedModules(acc);
                        const isChild = acc.parentId !== null;
                        return (
                          <TableRow key={acc.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/40"} data-testid={`row-account-${acc.id}`}>
                            <TableCell className="font-mono text-xs text-muted-foreground" data-testid={`text-acc-code-${acc.id}`}>{acc.code}</TableCell>
                            <TableCell className="font-medium" data-testid={`text-acc-name-${acc.id}`}>
                              <div className="flex items-center gap-1.5">
                                {isChild && <span className="text-muted-foreground pl-2"><ChevronRight className="h-3.5 w-3.5 inline -mt-0.5" /></span>}
                                <span className={isChild ? "text-sm" : "font-semibold"}>{acc.name}</span>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className={`no-default-active-elevate text-[10px] capitalize font-medium ${cat?.badgeClass || typeConfig[acc.type] || ""}`} data-testid={`badge-acc-type-${acc.id}`}>{cat?.label || acc.type}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground" data-testid={`text-acc-parent-${acc.id}`}>{acc.parentId ? (parentAccMap.get(acc.parentId)?.name || "—") : "—"}</TableCell>
                            <TableCell className="font-semibold" data-testid={`text-acc-balance-${acc.id}`}>
                              <span className={Number(acc.balance || 0) >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}>
                                Rs. {Number(acc.balance || 0).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground" data-testid={`text-acc-currency-${acc.id}`}>{acc.currency}</TableCell>
                            <TableCell>
                              {acc.isSystemDefault ? (
                                <Badge variant="secondary" className="no-default-active-elevate text-[10px] bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300" data-testid={`badge-acc-status-${acc.id}`}><Lock className="h-3 w-3 mr-1" />System</Badge>
                              ) : acc.isActive ? (
                                <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" data-testid={`badge-acc-status-${acc.id}`}><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-900" data-testid={`badge-acc-status-${acc.id}`}><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell" data-testid={`text-acc-linked-${acc.id}`}>
                              {linkedMods.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {linkedMods.slice(0, 2).map((m) => <Badge key={m} variant="outline" className="no-default-active-elevate text-[9px] border-blue-200 text-blue-600 dark:border-blue-800 dark:text-blue-400">{m}</Badge>)}
                                  {linkedMods.length > 2 && <Badge variant="outline" className="no-default-active-elevate text-[9px]">+{linkedMods.length - 2}</Badge>}
                                </div>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden md:table-cell" data-testid={`text-acc-created-${acc.id}`}>{acc.createdAt ? new Date(acc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</TableCell>
                            <TableCell>
                              <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-acc-actions-${acc.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setDetailAccount(acc)} data-testid={`button-view-acc-${acc.id}`}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openAccEdit(acc)} data-testid={`button-edit-acc-${acc.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleteAccConfirmId(acc.id)} data-testid={`button-delete-acc-${acc.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
          <div className="text-xs text-muted-foreground text-right">Showing {filteredAccounts.length} of {accounts.length} accounts</div>
        </div>
      )}

      {/* ===== INCOME TAB ===== */}
      {tab === "income" && (
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Today's Income", value: `Rs. ${incomeKpis.todayTotal.toLocaleString()}`, icon: DollarSign, gradient: "from-green-500 to-emerald-600" },
              { title: "This Month", value: `Rs. ${incomeKpis.monthTotal.toLocaleString()}`, icon: Calendar, gradient: "from-green-600 to-green-700" },
              { title: "Outstanding Receivable", value: `Rs. ${incomeKpis.totalOutstanding.toLocaleString()}`, icon: Clock, gradient: "from-amber-500 to-amber-600" },
              { title: "Payment Breakdown", value: `Cash: ${incomeKpis.cashCount} | Bank: ${incomeKpis.bankCount} | Online: ${incomeKpis.onlineCount}`, icon: CreditCard, gradient: "from-blue-500 to-blue-600" },
            ].map((kpi) => (
              <Card key={kpi.title} className="rounded-md shadow-sm overflow-hidden border-0">
                <div className={`bg-gradient-to-r ${kpi.gradient} p-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-white/80">{kpi.title}</p>
                      <p className="text-lg font-bold text-white mt-1" data-testid={`text-income-kpi-${kpi.title.replace(/\s+/g, "-").toLowerCase()}`}>{kpi.value}</p>
                    </div>
                    <kpi.icon className="h-8 w-8 text-white/30" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold flex items-center gap-2" data-testid="text-income-title">
              <ArrowDownCircle className="h-5 w-5 text-green-600" />Income Entries
            </h2>
            <Button onClick={openIncomeCreate} data-testid="button-add-income"><Plus className="h-4 w-4 mr-1" />Record Income</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by Ref#, description, customer..." className="pl-9" value={incomeSearch} onChange={(e) => setIncomeSearch(e.target.value)} data-testid="input-income-search" />
            </div>
            <Input type="date" className="w-[160px]" value={incomeDateFilter} onChange={(e) => setIncomeDateFilter(e.target.value)} data-testid="input-income-date-filter" />
            <Select value={incomeMethodFilter} onValueChange={setIncomeMethodFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-income-method-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="jazzcash">JazzCash/Wallet</SelectItem>
              </SelectContent>
            </Select>
            {(incomeSearch || incomeDateFilter || incomeMethodFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setIncomeSearch(""); setIncomeDateFilter(""); setIncomeMethodFilter("all"); }} data-testid="button-clear-income-filters"><X className="h-4 w-4 mr-1" />Clear</Button>
            )}
          </div>

          <Card className="rounded-md shadow-sm">
            <CardContent className="p-0">
              {txnLoading ? <div className="p-5 space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div> : filteredIncome.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><TrendingUp className="h-12 w-12 mb-3 opacity-30" /><p className="font-medium">No income entries found</p><p className="text-sm mt-1">Record your first income entry</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700">
                        <TableHead className="text-white font-semibold text-xs">Ref #</TableHead>
                        <TableHead className="text-white font-semibold text-xs">Date</TableHead>
                        <TableHead className="text-white font-semibold text-xs">Type</TableHead>
                        <TableHead className="text-white font-semibold text-xs">Customer</TableHead>
                        <TableHead className="text-white font-semibold text-xs">Debit Account</TableHead>
                        <TableHead className="text-white font-semibold text-xs">Credit Account</TableHead>
                        <TableHead className="text-white font-semibold text-xs text-right">Amount</TableHead>
                        <TableHead className="text-white font-semibold text-xs">Method</TableHead>
                        <TableHead className="text-white font-semibold text-xs">Status</TableHead>
                        <TableHead className="text-white font-semibold text-xs text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIncome.map((txn: any, idx: number) => (
                        <TableRow key={txn.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/50 dark:bg-slate-900/50"} data-testid={`row-income-${txn.id}`}>
                          <TableCell className="font-mono text-xs font-medium" data-testid={`text-income-id-${txn.id}`}>{txn.txnId}</TableCell>
                          <TableCell className="text-sm" data-testid={`text-income-date-${txn.id}`}>{txn.date ? new Date(txn.date).toLocaleDateString() : "—"}</TableCell>
                          <TableCell><Badge variant="outline" className="no-default-active-elevate text-[10px] capitalize bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800" data-testid={`badge-income-category-${txn.id}`}>{incomeCategoryLabel(txn.category)}</Badge></TableCell>
                          <TableCell className="text-sm" data-testid={`text-income-customer-${txn.id}`}>{txn.customerName || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{txn.debitAccountName || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{txn.creditAccountName || "—"}</TableCell>
                          <TableCell className="text-right font-semibold text-green-700 dark:text-green-300" data-testid={`text-income-amount-${txn.id}`}>Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</TableCell>
                          <TableCell data-testid={`text-income-method-${txn.id}`}><Badge variant="secondary" className="no-default-active-elevate text-[10px]">{paymentMethodLabel(txn.paymentMethod)}</Badge></TableCell>
                          <TableCell><Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${getStatusBadge(txn.status)}`} data-testid={`badge-income-status-${txn.id}`}>{txn.status}</Badge></TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-income-actions-${txn.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDetailTxn(txn)} data-testid={`button-view-income-${txn.id}`}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                                {txn.status !== "voided" && <DropdownMenuItem onClick={() => openIncomeEdit(txn)} data-testid={`button-edit-income-${txn.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>}
                                <DropdownMenuSeparator />
                                {txn.status !== "voided" && <DropdownMenuItem onClick={() => setVoidConfirmId(txn.id)} className="text-orange-600" data-testid={`button-void-income-${txn.id}`}><Ban className="h-4 w-4 mr-2" />Void</DropdownMenuItem>}
                                <DropdownMenuItem onClick={() => setDeleteTxnConfirmId(txn.id)} className="text-red-600" data-testid={`button-delete-income-${txn.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="text-xs text-muted-foreground text-right">Showing {filteredIncome.length} of {allIncomeTransactions.length} income entries</div>
        </div>
      )}

      {/* ===== EXPENSE TAB ===== */}
      {tab === "expense" && (
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Today's Expense", value: `Rs. ${expenseKpis.todayTotal.toLocaleString()}`, icon: DollarSign, gradient: "from-red-500 to-red-600" },
              { title: "This Month", value: `Rs. ${expenseKpis.monthTotal.toLocaleString()}`, icon: Calendar, gradient: "from-red-600 to-red-700" },
              { title: "Vendor Payable", value: `Rs. ${expenseKpis.vendorPayable.toLocaleString()}`, icon: Clock, gradient: "from-orange-500 to-orange-600" },
              { title: "Category Breakdown", value: `Vendor: ${expenseKpis.categoryBreakdown.vendor} | Salary: ${expenseKpis.categoryBreakdown.salary} | Ops: ${expenseKpis.categoryBreakdown.operational}`, icon: Layers, gradient: "from-slate-600 to-slate-700" },
            ].map((kpi) => (
              <Card key={kpi.title} className="rounded-md shadow-sm overflow-hidden border-0">
                <div className={`bg-gradient-to-r ${kpi.gradient} p-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-white/80">{kpi.title}</p>
                      <p className="text-lg font-bold text-white mt-1" data-testid={`text-expense-kpi-${kpi.title.replace(/\s+/g, "-").toLowerCase()}`}>{kpi.value}</p>
                    </div>
                    <kpi.icon className="h-8 w-8 text-white/30" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold flex items-center gap-2" data-testid="text-expense-title">
              <ArrowUpCircle className="h-5 w-5 text-red-600" />Expense Entries
            </h2>
            <Button onClick={openExpenseCreate} data-testid="button-add-expense"><Plus className="h-4 w-4 mr-1" />Record Expense</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by Ref#, description, vendor..." className="pl-9" value={expenseSearch} onChange={(e) => setExpenseSearch(e.target.value)} data-testid="input-expense-search" />
            </div>
            <Input type="date" className="w-[160px]" value={expenseDateFilter} onChange={(e) => setExpenseDateFilter(e.target.value)} data-testid="input-expense-date-filter" />
            <Select value={expenseCategoryFilter} onValueChange={setExpenseCategoryFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-expense-category-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="vendor_payment">Vendor Payment</SelectItem>
                <SelectItem value="salary">Salary</SelectItem>
                <SelectItem value="commission">Commission</SelectItem>
                <SelectItem value="utility">Utility</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="bandwidth">Bandwidth</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="other_expense">Other</SelectItem>
              </SelectContent>
            </Select>
            {(expenseSearch || expenseDateFilter || expenseCategoryFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setExpenseSearch(""); setExpenseDateFilter(""); setExpenseCategoryFilter("all"); }} data-testid="button-clear-expense-filters"><X className="h-4 w-4 mr-1" />Clear</Button>
            )}
          </div>

          <Card className="rounded-md shadow-sm">
            <CardContent className="p-0">
              {txnLoading ? <div className="p-5 space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div> : filteredExpense.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><TrendingDown className="h-12 w-12 mb-3 opacity-30" /><p className="font-medium">No expense entries found</p><p className="text-sm mt-1">Record your first expense entry</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700">
                        <TableHead className="text-white font-semibold text-xs">Ref #</TableHead>
                        <TableHead className="text-white font-semibold text-xs">Date</TableHead>
                        <TableHead className="text-white font-semibold text-xs">Category</TableHead>
                        <TableHead className="text-white font-semibold text-xs">Vendor/Employee</TableHead>
                        <TableHead className="text-white font-semibold text-xs">Debit Account</TableHead>
                        <TableHead className="text-white font-semibold text-xs">Credit Account</TableHead>
                        <TableHead className="text-white font-semibold text-xs text-right">Amount</TableHead>
                        <TableHead className="text-white font-semibold text-xs">Method</TableHead>
                        <TableHead className="text-white font-semibold text-xs">Status</TableHead>
                        <TableHead className="text-white font-semibold text-xs text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpense.map((txn: any, idx: number) => (
                        <TableRow key={txn.id} className={idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/50 dark:bg-slate-900/50"} data-testid={`row-expense-${txn.id}`}>
                          <TableCell className="font-mono text-xs font-medium" data-testid={`text-expense-id-${txn.id}`}>{txn.txnId}</TableCell>
                          <TableCell className="text-sm" data-testid={`text-expense-date-${txn.id}`}>{txn.date ? new Date(txn.date).toLocaleDateString() : "—"}</TableCell>
                          <TableCell><Badge variant="outline" className="no-default-active-elevate text-[10px] capitalize bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800" data-testid={`badge-expense-category-${txn.id}`}>{expenseCategoryLabel(txn.category)}</Badge></TableCell>
                          <TableCell className="text-sm" data-testid={`text-expense-vendor-${txn.id}`}>{txn.vendorName || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{txn.debitAccountName || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{txn.creditAccountName || "—"}</TableCell>
                          <TableCell className="text-right font-semibold text-red-600 dark:text-red-400" data-testid={`text-expense-amount-${txn.id}`}>Rs. {Number(txn.netAmount || txn.amount).toLocaleString()}</TableCell>
                          <TableCell data-testid={`text-expense-method-${txn.id}`}><Badge variant="secondary" className="no-default-active-elevate text-[10px]">{paymentMethodLabel(txn.paymentMethod)}</Badge></TableCell>
                          <TableCell><Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${getStatusBadge(txn.status)}`} data-testid={`badge-expense-status-${txn.id}`}>{txn.status}</Badge></TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-expense-actions-${txn.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDetailTxn(txn)} data-testid={`button-view-expense-${txn.id}`}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                                {txn.status !== "voided" && <DropdownMenuItem onClick={() => openExpenseEdit(txn)} data-testid={`button-edit-expense-${txn.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>}
                                <DropdownMenuSeparator />
                                {txn.status !== "voided" && <DropdownMenuItem onClick={() => setVoidConfirmId(txn.id)} className="text-orange-600" data-testid={`button-void-expense-${txn.id}`}><Ban className="h-4 w-4 mr-2" />Void</DropdownMenuItem>}
                                <DropdownMenuItem onClick={() => setDeleteTxnConfirmId(txn.id)} className="text-red-600" data-testid={`button-delete-expense-${txn.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="text-xs text-muted-foreground text-right">Showing {filteredExpense.length} of {allExpenseTransactions.length} expense entries</div>
        </div>
      )}

      {/* ===== BUDGET TAB ===== */}
      {tab === "budget" && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div><h2 className="text-lg font-semibold" data-testid="text-budget-title">Budget Allocation</h2><p className="text-sm text-muted-foreground mt-0.5">View allocated budgets and spending per account</p></div>
          </div>
          {accLoading ? <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div> : accounts.length === 0 ? (
            <Card><CardContent className="py-12"><div className="flex flex-col items-center justify-center text-muted-foreground"><PiggyBank className="h-12 w-12 mb-3 opacity-30" /><p className="font-medium">No accounts found</p><p className="text-sm mt-1">Create accounts first to allocate budgets</p></div></CardContent></Card>
          ) : (
            <Card><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Account Name</TableHead><TableHead>Type</TableHead><TableHead>Allocated Budget (Rs.)</TableHead><TableHead>Spent (Rs.)</TableHead><TableHead>Remaining (Rs.)</TableHead><TableHead>Usage</TableHead></TableRow></TableHeader>
              <TableBody>{accounts.map((acc) => {
                const allocated = Number(acc.balance || 0);
                const spent = transactions.filter((t) => t.accountId === acc.id && t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
                const remaining = allocated - spent;
                const usagePercent = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;
                return (
                  <TableRow key={acc.id} data-testid={`row-budget-${acc.id}`}>
                    <TableCell className="font-mono text-xs" data-testid={`text-budget-code-${acc.id}`}>{acc.code}</TableCell>
                    <TableCell className="font-medium" data-testid={`text-budget-name-${acc.id}`}>{acc.name}</TableCell>
                    <TableCell><Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${typeConfig[acc.type] || ""}`} data-testid={`badge-budget-type-${acc.id}`}>{acc.type}</Badge></TableCell>
                    <TableCell className="font-semibold" data-testid={`text-budget-allocated-${acc.id}`}>Rs. {allocated.toLocaleString()}</TableCell>
                    <TableCell className="text-red-600 dark:text-red-400" data-testid={`text-budget-spent-${acc.id}`}>Rs. {spent.toLocaleString()}</TableCell>
                    <TableCell className={remaining >= 0 ? "text-green-700 dark:text-green-300" : "text-red-600 dark:text-red-400"} data-testid={`text-budget-remaining-${acc.id}`}>Rs. {remaining.toLocaleString()}</TableCell>
                    <TableCell data-testid={`text-budget-usage-${acc.id}`}><div className="flex items-center gap-2"><div className="w-16 h-2 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${usagePercent > 90 ? "bg-red-500" : usagePercent > 60 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${usagePercent}%` }} /></div><span className="text-xs text-muted-foreground">{usagePercent}%</span></div></TableCell>
                  </TableRow>
                );
              })}</TableBody></Table></div></CardContent></Card>
          )}
        </div>
      )}

      {/* ===== ACCOUNT TYPE MODAL ===== */}
      <Dialog open={atDialogOpen} onOpenChange={(open) => { setAtDialogOpen(open); if (!open) setEditingAccountType(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              {editingAccountType ? "Edit Account Type" : "Add Account Type"}
            </DialogTitle>
          </DialogHeader>
          <Form {...atForm}>
            <form onSubmit={atForm.handleSubmit(onAtSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Section A — Identity</h3>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={atForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g. Current Assets" data-testid="input-at-name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={atForm.control} name="code" render={({ field }) => (<FormItem><FormLabel>Code</FormLabel><FormControl><Input placeholder="AT-110" data-testid="input-at-code" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={atForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Brief description of this account type..." rows={2} data-testid="input-at-description" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />Section B — Classification</h3>
                <div className="border-t pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={atForm.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} value={field.value || "asset"}><FormControl><SelectTrigger data-testid="select-at-category"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="asset">Asset</SelectItem><SelectItem value="liability">Liability</SelectItem><SelectItem value="equity">Equity</SelectItem><SelectItem value="revenue">Revenue</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={atForm.control} name="normalBalance" render={({ field }) => (<FormItem><FormLabel>Normal Balance</FormLabel><Select onValueChange={field.onChange} value={field.value || "debit"}><FormControl><SelectTrigger data-testid="select-at-normal-balance"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="debit">Debit</SelectItem><SelectItem value="credit">Credit</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" />Section C — Hierarchy & Reporting</h3>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={atForm.control} name="parentId" render={({ field }) => (
                      <FormItem><FormLabel>Parent Account Type</FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}>
                          <FormControl><SelectTrigger data-testid="select-at-parent"><SelectValue placeholder="None (Top Level)" /></SelectTrigger></FormControl>
                          <SelectContent><SelectItem value="none">None (Top Level)</SelectItem>{accountTypes.filter((a) => a.category === atForm.getValues("category") && (!editingAccountType || a.id !== editingAccountType.id)).map((a) => (<SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>))}</SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={atForm.control} name="sortOrder" render={({ field }) => (<FormItem><FormLabel>Sort Order</FormLabel><FormControl><Input type="number" data-testid="input-at-sort-order" {...field} value={field.value ?? 0} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <FormField control={atForm.control} name="includeTrialBalance" render={({ field }) => (<FormItem><BooleanToggle label="Include in Trial Balance" value={!!field.value} onChange={field.onChange} testId="toggle-at-trial-balance" /></FormItem>)} />
                    <FormField control={atForm.control} name="includeProfitLoss" render={({ field }) => (<FormItem><BooleanToggle label="Include in P&L" value={!!field.value} onChange={field.onChange} testId="toggle-at-profit-loss" /></FormItem>)} />
                    <FormField control={atForm.control} name="includeBalanceSheet" render={({ field }) => (<FormItem><BooleanToggle label="Include in Balance Sheet" value={!!field.value} onChange={field.onChange} testId="toggle-at-balance-sheet" /></FormItem>)} />
                    <FormField control={atForm.control} name="allowSubAccounts" render={({ field }) => (<FormItem><BooleanToggle label="Allow Sub-Accounts" value={!!field.value} onChange={field.onChange} testId="toggle-at-sub-accounts" /></FormItem>)} />
                    <FormField control={atForm.control} name="allowDirectPosting" render={({ field }) => (<FormItem><BooleanToggle label="Allow Direct Posting" value={!!field.value} onChange={field.onChange} testId="toggle-at-direct-posting" /></FormItem>)} />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />Section D — Status</h3>
                <div className="border-t pt-3">
                  <FormField control={atForm.control} name="isActive" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={(v) => field.onChange(v === "true")} value={field.value ? "true" : "false"}><FormControl><SelectTrigger data-testid="select-at-status"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="true">Active</SelectItem><SelectItem value="false">Inactive</SelectItem></SelectContent></Select></FormItem>)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => { setAtDialogOpen(false); setEditingAccountType(null); }} data-testid="button-cancel-account-type">Cancel</Button>
                <Button type="submit" disabled={atCreateMutation.isPending || atUpdateMutation.isPending} data-testid="button-save-account-type">{atCreateMutation.isPending || atUpdateMutation.isPending ? "Saving..." : editingAccountType ? "Update Account Type" : "Create Account Type"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== ACCOUNT EDIT MODAL ===== */}
      <Dialog open={accDialogOpen} onOpenChange={(open) => { setAccDialogOpen(open); if (!open) setEditingAccount(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingAccount ? "Edit Account" : "Add New Account"}</DialogTitle></DialogHeader>
          {renderAccountForm(true)}
        </DialogContent>
      </Dialog>

      {/* ===== ACCOUNT DETAIL DRAWER ===== */}
      <Dialog open={detailAccount !== null} onOpenChange={(open) => { if (!open) setDetailAccount(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {detailAccount && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{detailAccount.code}</span>
                  <span>—</span>
                  <span>{detailAccount.name}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Category</p>
                    <Badge variant="outline" className={`no-default-active-elevate text-xs capitalize font-medium ${categoryConfig[detailAccount.type]?.badgeClass || ""}`}>{categoryConfig[detailAccount.type]?.label || detailAccount.type}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Normal Balance</p>
                    <Badge variant="outline" className={`no-default-active-elevate text-xs capitalize font-medium ${detailAccount.normalBalance === "debit" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800" : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"}`}>{detailAccount.normalBalance}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900">
                    <p className="text-xs text-muted-foreground">Opening Balance</p>
                    <p className="text-lg font-bold">Rs. {Number(detailAccount.openingBalance || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900">
                    <p className="text-xs text-muted-foreground">Current Balance</p>
                    <p className={`text-lg font-bold ${Number(detailAccount.balance || 0) >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}>Rs. {Number(detailAccount.balance || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900">
                    <p className="text-xs text-muted-foreground">Total Debit</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">Rs. {transactions.filter((t) => t.accountId === detailAccount.id && (t.type === "payment" || t.type === "income")).reduce((s, t) => s + Number(t.amount), 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900">
                    <p className="text-xs text-muted-foreground">Total Credit</p>
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-300">Rs. {transactions.filter((t) => t.accountId === detailAccount.id && t.type === "expense").reduce((s, t) => s + Number(t.amount), 0).toLocaleString()}</p>
                  </div>
                </div>
                {detailAccount.description && (
                  <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Description</p><p className="text-sm">{detailAccount.description}</p></div>
                )}
                {getLinkedModules(detailAccount).length > 0 && (
                  <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Linked Modules</p><div className="flex flex-wrap gap-1.5">{getLinkedModules(detailAccount).map((m) => <Badge key={m} variant="outline" className="no-default-active-elevate text-xs border-blue-200 text-blue-600 dark:border-blue-800 dark:text-blue-400">{m}</Badge>)}</div></div>
                )}
                {(detailAccount.bankName || detailAccount.bankAccountTitle || detailAccount.bankAccountNumber || detailAccount.bankBranchCode || detailAccount.bankIban || detailAccount.bankSwiftCode || detailAccount.bankAddress) && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Landmark className="h-3 w-3" />Bank Account Detail</p>
                    <div className="grid grid-cols-2 gap-2">
                      {detailAccount.bankName && <div className="p-2 rounded-md border"><p className="text-[10px] text-muted-foreground">Bank Name</p><p className="text-xs font-medium">{detailAccount.bankName}</p></div>}
                      {detailAccount.bankAccountTitle && <div className="p-2 rounded-md border"><p className="text-[10px] text-muted-foreground">Account Title</p><p className="text-xs font-medium">{detailAccount.bankAccountTitle}</p></div>}
                      {detailAccount.bankAccountNumber && <div className="p-2 rounded-md border"><p className="text-[10px] text-muted-foreground">Account Number</p><p className="text-xs font-mono font-medium">{detailAccount.bankAccountNumber}</p></div>}
                      {detailAccount.bankBranchCode && <div className="p-2 rounded-md border"><p className="text-[10px] text-muted-foreground">Branch Code</p><p className="text-xs font-mono font-medium">{detailAccount.bankBranchCode}</p></div>}
                      {detailAccount.bankIban && <div className="p-2 rounded-md border col-span-2"><p className="text-[10px] text-muted-foreground">IBAN</p><p className="text-xs font-mono font-medium">{detailAccount.bankIban}</p></div>}
                      {detailAccount.bankSwiftCode && <div className="p-2 rounded-md border"><p className="text-[10px] text-muted-foreground">SWIFT / BIC</p><p className="text-xs font-mono font-medium">{detailAccount.bankSwiftCode}</p></div>}
                      {detailAccount.bankAddress && <div className="p-2 rounded-md border col-span-2"><p className="text-[10px] text-muted-foreground">Bank Branch Address</p><p className="text-xs font-medium">{detailAccount.bankAddress}</p></div>}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-md border"><p className="text-[10px] text-muted-foreground">Direct Post</p><p className="text-xs font-medium">{detailAccount.allowDirectPosting ? "Yes" : "No"}</p></div>
                  <div className="p-2 rounded-md border"><p className="text-[10px] text-muted-foreground">System Only</p><p className="text-xs font-medium">{detailAccount.systemGeneratedOnly ? "Yes" : "No"}</p></div>
                  <div className="p-2 rounded-md border"><p className="text-[10px] text-muted-foreground">Lock Txn</p><p className="text-xs font-medium">{detailAccount.lockAfterTransactions ? "Yes" : "No"}</p></div>
                  <div className="p-2 rounded-md border"><p className="text-[10px] text-muted-foreground">Tax</p><p className="text-xs font-medium">{detailAccount.taxApplicable ? "Yes" : "No"}</p></div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDetailAccount(null)}>Close</Button>
                <Button onClick={() => { openAccEdit(detailAccount); setDetailAccount(null); }} data-testid="button-edit-from-detail"><Edit className="h-4 w-4 mr-1" />Edit</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== DELETE CONFIRMATIONS ===== */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Delete Account Type</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this account type? This action cannot be undone.</p>
          <DialogFooter><Button type="button" variant="secondary" onClick={() => setDeleteConfirmId(null)} data-testid="button-cancel-delete-at">Cancel</Button><Button variant="destructive" onClick={() => deleteConfirmId && atDeleteMutation.mutate(deleteConfirmId)} disabled={atDeleteMutation.isPending} data-testid="button-confirm-delete-at">{atDeleteMutation.isPending ? "Deleting..." : "Delete"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteAccConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteAccConfirmId(null); }}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Delete Account</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this account? This action cannot be undone.</p>
          <DialogFooter><Button type="button" variant="secondary" onClick={() => setDeleteAccConfirmId(null)} data-testid="button-cancel-delete-acc">Cancel</Button><Button variant="destructive" onClick={() => deleteAccConfirmId && accDeleteMutation.mutate(deleteAccConfirmId)} disabled={accDeleteMutation.isPending} data-testid="button-confirm-delete-acc">{accDeleteMutation.isPending ? "Deleting..." : "Delete"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== INCOME MODAL ===== */}
      <Dialog open={incomeDialogOpen} onOpenChange={(open) => { setIncomeDialogOpen(open); if (!open) setEditingIncomeTxn(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center"><ArrowDownCircle className="h-4 w-4 text-white" /></div>
              {editingIncomeTxn ? "Edit Income Entry" : "Record Income Entry"}
            </DialogTitle>
          </DialogHeader>
          <Form {...incomeForm}>
            <form onSubmit={incomeForm.handleSubmit(onIncomeSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Section A — Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={incomeForm.control} name="date" render={({ field }) => (<FormItem><FormLabel>Income Date</FormLabel><FormControl><Input type="date" data-testid="input-income-date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={incomeForm.control} name="txnId" render={({ field }) => (<FormItem><FormLabel>Reference Number</FormLabel><FormControl><Input data-testid="input-income-txn-id" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={incomeForm.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Income Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "customer_payment"}>
                        <FormControl><SelectTrigger data-testid="select-income-category"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="customer_payment">Customer Payment</SelectItem>
                          <SelectItem value="installation_fee">Installation Fee</SelectItem>
                          <SelectItem value="other_income">Other Income</SelectItem>
                          <SelectItem value="manual_revenue">Manual Revenue Entry</SelectItem>
                          <SelectItem value="cir_revenue">CIR Revenue</SelectItem>
                          <SelectItem value="corporate_revenue">Corporate Revenue</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={incomeForm.control} name="customerId" render={({ field }) => (
                    <FormItem><FormLabel>Customer (if linked)</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}>
                        <FormControl><SelectTrigger data-testid="select-income-customer"><SelectValue placeholder="Select customer" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="none">None</SelectItem>{customersList.map((c) => (<SelectItem key={c.id} value={c.id.toString()}>{c.fullName}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={incomeForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Income description..." rows={2} data-testid="input-income-description" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />Section B — Financial Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={incomeForm.control} name="debitAccountId" render={({ field }) => (
                    <FormItem><FormLabel>Debit Account (Money Received)</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}>
                        <FormControl><SelectTrigger data-testid="select-income-debit-account"><SelectValue placeholder="Cash / Bank" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="none">None</SelectItem>{debitAccounts.map((a) => (<SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={incomeForm.control} name="creditAccountId" render={({ field }) => (
                    <FormItem><FormLabel>Credit Account (Revenue)</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}>
                        <FormControl><SelectTrigger data-testid="select-income-credit-account"><SelectValue placeholder="Revenue Account" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="none">None</SelectItem>{creditRevenueAccounts.map((a) => (<SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField control={incomeForm.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" data-testid="input-income-amount" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={incomeForm.control} name="tax" render={({ field }) => (<FormItem><FormLabel>Tax (Optional)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-income-tax" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={incomeForm.control} name="discount" render={({ field }) => (<FormItem><FormLabel>Discount (Optional)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-income-discount" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-md border border-green-200 dark:border-green-800">
                  <p className="text-xs text-muted-foreground">Net Amount</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300" data-testid="text-income-net-amount">Rs. {(Number(incomeForm.watch("amount") || 0) + Number(incomeForm.watch("tax") || 0) - Number(incomeForm.watch("discount") || 0)).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" />Section C — Payment Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={incomeForm.control} name="paymentMethod" render={({ field }) => (
                    <FormItem><FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "cash"}>
                        <FormControl><SelectTrigger data-testid="select-income-payment-method"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="jazzcash">JazzCash / Wallet</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={incomeForm.control} name="transactionRef" render={({ field }) => (<FormItem><FormLabel>Transaction ID / Ref</FormLabel><FormControl><Input placeholder="Bank ref, receipt number..." data-testid="input-income-txn-ref" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                {incomeForm.watch("paymentMethod") === "cheque" && (
                  <FormField control={incomeForm.control} name="chequeNumber" render={({ field }) => (<FormItem><FormLabel>Cheque Number</FormLabel><FormControl><Input placeholder="Enter cheque number" data-testid="input-income-cheque" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                )}
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />Section D — Advanced Options</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <FormField control={incomeForm.control} name="autoAdjustReceivable" render={({ field }) => (<BooleanToggle label="Auto adjust receivable" value={!!field.value} onChange={field.onChange} testId="toggle-income-auto-adjust" />)} />
                  <FormField control={incomeForm.control} name="allowPartialPayment" render={({ field }) => (<BooleanToggle label="Allow partial payment" value={!!field.value} onChange={field.onChange} testId="toggle-income-partial" />)} />
                  <FormField control={incomeForm.control} name="sendNotification" render={({ field }) => (<BooleanToggle label="Send receipt notification" value={!!field.value} onChange={field.onChange} testId="toggle-income-notify" />)} />
                  <FormField control={incomeForm.control} name="lockAfterSave" render={({ field }) => (<BooleanToggle label="Lock after save" value={!!field.value} onChange={field.onChange} testId="toggle-income-lock" />)} />
                  <FormField control={incomeForm.control} name="isRecurring" render={({ field }) => (<BooleanToggle label="Recurring entry" value={!!field.value} onChange={field.onChange} testId="toggle-income-recurring" />)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <FormField control={incomeForm.control} name="branch" render={({ field }) => (<FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="Main Office" data-testid="input-income-branch" {...field} value={field.value || ""} /></FormControl></FormItem>)} />
                  <FormField control={incomeForm.control} name="costCenter" render={({ field }) => (<FormItem><FormLabel>Cost Center</FormLabel><FormControl><Input placeholder="Revenue Center" data-testid="input-income-cost-center" {...field} value={field.value || ""} /></FormControl></FormItem>)} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => { setIncomeDialogOpen(false); setEditingIncomeTxn(null); }}>Cancel</Button>
                <Button type="submit" disabled={createTransactionMutation.isPending || updateTransactionMutation.isPending} data-testid="button-save-income">
                  {(createTransactionMutation.isPending || updateTransactionMutation.isPending) ? "Saving..." : editingIncomeTxn ? "Update Income" : "Record Income"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== EXPENSE MODAL ===== */}
      <Dialog open={expenseDialogOpen} onOpenChange={(open) => { setExpenseDialogOpen(open); if (!open) setEditingExpenseTxn(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center"><ArrowUpCircle className="h-4 w-4 text-white" /></div>
              {editingExpenseTxn ? "Edit Expense Entry" : "Record Expense Entry"}
            </DialogTitle>
          </DialogHeader>
          <Form {...expenseForm}>
            <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Section A — Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={expenseForm.control} name="date" render={({ field }) => (<FormItem><FormLabel>Expense Date</FormLabel><FormControl><Input type="date" data-testid="input-expense-date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={expenseForm.control} name="txnId" render={({ field }) => (<FormItem><FormLabel>Reference Number</FormLabel><FormControl><Input data-testid="input-expense-txn-id" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={expenseForm.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Expense Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "vendor_payment"}>
                        <FormControl><SelectTrigger data-testid="select-expense-category"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="vendor_payment">Vendor Payment</SelectItem>
                          <SelectItem value="salary">Salary</SelectItem>
                          <SelectItem value="commission">Commission</SelectItem>
                          <SelectItem value="utility">Utility</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="bandwidth">Bandwidth</SelectItem>
                          <SelectItem value="operational">Operational</SelectItem>
                          <SelectItem value="other_expense">Other Expense</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={expenseForm.control} name="vendorId" render={({ field }) => (
                    <FormItem><FormLabel>Vendor / Employee</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}>
                        <FormControl><SelectTrigger data-testid="select-expense-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="none">None</SelectItem>{vendorsList.map((v) => (<SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={expenseForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Expense description..." rows={2} data-testid="input-expense-description" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />Section B — Financial Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={expenseForm.control} name="debitAccountId" render={({ field }) => (
                    <FormItem><FormLabel>Debit Account (Expense Account)</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}>
                        <FormControl><SelectTrigger data-testid="select-expense-debit-account"><SelectValue placeholder="Expense Account" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="none">None</SelectItem>{expenseAccounts.map((a) => (<SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={expenseForm.control} name="creditAccountId" render={({ field }) => (
                    <FormItem><FormLabel>Credit Account (Payment Source)</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}>
                        <FormControl><SelectTrigger data-testid="select-expense-credit-account"><SelectValue placeholder="Cash / Bank" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="none">None</SelectItem>{paymentSourceAccounts.map((a) => (<SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField control={expenseForm.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Amount (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" data-testid="input-expense-amount" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={expenseForm.control} name="tax" render={({ field }) => (<FormItem><FormLabel>Tax</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-expense-tax" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={expenseForm.control} name="discount" render={({ field }) => (<FormItem><FormLabel>Discount</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0" data-testid="input-expense-discount" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-md border border-red-200 dark:border-red-800">
                  <p className="text-xs text-muted-foreground">Net Amount</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400" data-testid="text-expense-net-amount">Rs. {(Number(expenseForm.watch("amount") || 0) + Number(expenseForm.watch("tax") || 0) - Number(expenseForm.watch("discount") || 0)).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" />Section C — Payment Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={expenseForm.control} name="paymentMethod" render={({ field }) => (
                    <FormItem><FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "cash"}>
                        <FormControl><SelectTrigger data-testid="select-expense-payment-method"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="jazzcash">JazzCash / Wallet</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={expenseForm.control} name="transactionRef" render={({ field }) => (<FormItem><FormLabel>Transaction ID / Ref</FormLabel><FormControl><Input placeholder="Bank ref, voucher number..." data-testid="input-expense-txn-ref" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                {expenseForm.watch("paymentMethod") === "cheque" && (
                  <FormField control={expenseForm.control} name="chequeNumber" render={({ field }) => (<FormItem><FormLabel>Cheque Number</FormLabel><FormControl><Input placeholder="Enter cheque number" data-testid="input-expense-cheque" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                )}
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />Section D — Advanced Controls</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <FormField control={expenseForm.control} name="autoAdjustReceivable" render={({ field }) => (<BooleanToggle label="Auto adjust vendor payable" value={!!field.value} onChange={field.onChange} testId="toggle-expense-auto-adjust" />)} />
                  <FormField control={expenseForm.control} name="isRecurring" render={({ field }) => (<BooleanToggle label="Mark as recurring" value={!!field.value} onChange={field.onChange} testId="toggle-expense-recurring" />)} />
                  <FormField control={expenseForm.control} name="lockAfterSave" render={({ field }) => (<BooleanToggle label="Lock after posting" value={!!field.value} onChange={field.onChange} testId="toggle-expense-lock" />)} />
                  <FormField control={expenseForm.control} name="requireApproval" render={({ field }) => (<BooleanToggle label="Require approval" value={!!field.value} onChange={field.onChange} testId="toggle-expense-approval" />)} />
                  <FormField control={expenseForm.control} name="sendNotification" render={({ field }) => (<BooleanToggle label="Send notification" value={!!field.value} onChange={field.onChange} testId="toggle-expense-notify" />)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <FormField control={expenseForm.control} name="branch" render={({ field }) => (<FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="Main Office" data-testid="input-expense-branch" {...field} value={field.value || ""} /></FormControl></FormItem>)} />
                  <FormField control={expenseForm.control} name="costCenter" render={({ field }) => (<FormItem><FormLabel>Cost Center</FormLabel><FormControl><Input placeholder="Operations" data-testid="input-expense-cost-center" {...field} value={field.value || ""} /></FormControl></FormItem>)} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => { setExpenseDialogOpen(false); setEditingExpenseTxn(null); }}>Cancel</Button>
                <Button type="submit" disabled={createTransactionMutation.isPending || updateTransactionMutation.isPending} data-testid="button-save-expense">
                  {(createTransactionMutation.isPending || updateTransactionMutation.isPending) ? "Saving..." : editingExpenseTxn ? "Update Expense" : "Record Expense"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ===== TRANSACTION DETAIL VIEW ===== */}
      <Dialog open={detailTxn !== null} onOpenChange={(open) => { if (!open) setDetailTxn(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {detailTxn && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-md flex items-center justify-center ${detailTxn.type === "expense" ? "bg-gradient-to-r from-red-500 to-red-600" : "bg-gradient-to-r from-green-500 to-emerald-600"}`}>
                    {detailTxn.type === "expense" ? <ArrowUpCircle className="h-4 w-4 text-white" /> : <ArrowDownCircle className="h-4 w-4 text-white" />}
                  </div>
                  <div>
                    <span className="font-mono text-sm text-muted-foreground">{detailTxn.txnId}</span>
                    <p className="text-xs text-muted-foreground capitalize">{detailTxn.type === "expense" ? expenseCategoryLabel(detailTxn.category) : incomeCategoryLabel(detailTxn.category)}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Date</p>
                    <p className="text-sm font-medium">{detailTxn.date ? new Date(detailTxn.date).toLocaleDateString() : "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                    <Badge variant="secondary" className={`no-default-active-elevate text-xs capitalize ${getStatusBadge(detailTxn.status)}`}>{detailTxn.status}</Badge>
                  </div>
                </div>
                <div className={`p-4 rounded-md ${detailTxn.type === "expense" ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800" : "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"}`}>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-xs text-muted-foreground">Amount</p><p className="text-lg font-bold">Rs. {Number(detailTxn.amount || 0).toLocaleString()}</p></div>
                    <div><p className="text-xs text-muted-foreground">Tax</p><p className="text-lg font-bold">Rs. {Number(detailTxn.tax || 0).toLocaleString()}</p></div>
                    <div><p className="text-xs text-muted-foreground">Net Amount</p><p className={`text-lg font-bold ${detailTxn.type === "expense" ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-300"}`}>Rs. {Number(detailTxn.netAmount || detailTxn.amount || 0).toLocaleString()}</p></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase">Debit Account</p><p className="text-sm">{(detailTxn as any).debitAccountName || "—"}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase">Credit Account</p><p className="text-sm">{(detailTxn as any).creditAccountName || "—"}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase">Payment Method</p><p className="text-sm">{paymentMethodLabel(detailTxn.paymentMethod)}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase">{detailTxn.type === "expense" ? "Vendor" : "Customer"}</p><p className="text-sm">{(detailTxn as any).vendorName || (detailTxn as any).customerName || "—"}</p></div>
                </div>
                {detailTxn.description && <div><p className="text-xs text-muted-foreground uppercase mb-1">Description</p><p className="text-sm">{detailTxn.description}</p></div>}
                {(detailTxn.transactionRef || detailTxn.chequeNumber) && (
                  <div className="grid grid-cols-2 gap-4">
                    {detailTxn.transactionRef && <div><p className="text-xs text-muted-foreground uppercase">Transaction Ref</p><p className="text-sm font-mono">{detailTxn.transactionRef}</p></div>}
                    {detailTxn.chequeNumber && <div><p className="text-xs text-muted-foreground uppercase">Cheque #</p><p className="text-sm font-mono">{detailTxn.chequeNumber}</p></div>}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-md border"><p className="text-[10px] text-muted-foreground">Recurring</p><p className="text-xs font-medium">{detailTxn.isRecurring ? "Yes" : "No"}</p></div>
                  <div className="p-2 rounded-md border"><p className="text-[10px] text-muted-foreground">Locked</p><p className="text-xs font-medium">{detailTxn.lockAfterSave ? "Yes" : "No"}</p></div>
                  <div className="p-2 rounded-md border"><p className="text-[10px] text-muted-foreground">Branch</p><p className="text-xs font-medium">{detailTxn.branch || "—"}</p></div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDetailTxn(null)}>Close</Button>
                {detailTxn.status !== "voided" && (
                  <Button onClick={() => { if (detailTxn.type === "expense") { openExpenseEdit(detailTxn); } else { openIncomeEdit(detailTxn); } setDetailTxn(null); }} data-testid="button-edit-from-txn-detail"><Edit className="h-4 w-4 mr-1" />Edit</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== VOID CONFIRMATION ===== */}
      <Dialog open={voidConfirmId !== null} onOpenChange={(open) => { if (!open) setVoidConfirmId(null); }}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-500" />Void Transaction</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to void this transaction? The entry will be marked as voided and excluded from financial reports.</p>
          <DialogFooter><Button type="button" variant="secondary" onClick={() => setVoidConfirmId(null)}>Cancel</Button><Button variant="destructive" onClick={() => voidConfirmId && voidTransactionMutation.mutate(voidConfirmId)} disabled={voidTransactionMutation.isPending} data-testid="button-confirm-void">{voidTransactionMutation.isPending ? "Voiding..." : "Void Transaction"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE TRANSACTION CONFIRMATION ===== */}
      <Dialog open={deleteTxnConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteTxnConfirmId(null); }}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Delete Transaction</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to permanently delete this transaction? This action cannot be undone.</p>
          <DialogFooter><Button type="button" variant="secondary" onClick={() => setDeleteTxnConfirmId(null)}>Cancel</Button><Button variant="destructive" onClick={() => deleteTxnConfirmId && deleteTransactionMutation.mutate(deleteTxnConfirmId)} disabled={deleteTransactionMutation.isPending} data-testid="button-confirm-delete-txn">{deleteTransactionMutation.isPending ? "Deleting..." : "Delete"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}