import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2, Plus, Search, Edit, Trash2, Wallet, Shield, ArrowUpCircle, ArrowDownCircle,
  ArrowLeftRight, Landmark, CreditCard, Smartphone, CheckCircle2, XCircle, MoreHorizontal,
  TrendingUp, TrendingDown, DollarSign, RefreshCw, Eye, FileText, AlertTriangle, Banknote,
  Hash, Calendar, Filter, X, ChevronRight, Receipt, Lock,
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
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCompanyBankAccountSchema, type CompanyBankAccount, type CompanyAccountLedgerEntry, type InsertCompanyBankAccount } from "@shared/schema";
import { z } from "zod";

const accountFormSchema = insertCompanyBankAccountSchema.extend({
  name: z.string().min(1, "Account name is required"),
  accountType: z.string().min(1, "Account type is required"),
  openingBalance: z.string().optional(),
});

const ACCOUNT_TYPES = [
  { value: "bank", label: "Bank Account", icon: Landmark, color: "from-blue-600 to-blue-500", badge: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  { value: "cash", label: "Cash in Hand", icon: Banknote, color: "from-emerald-600 to-emerald-500", badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  { value: "wallet", label: "Mobile Wallet", icon: Smartphone, color: "from-purple-600 to-purple-500", badge: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  { value: "gateway", label: "Payment Gateway", icon: CreditCard, color: "from-orange-600 to-orange-500", badge: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
];

const MODULE_LABELS: Record<string, string> = {
  customer_collection: "Customer Collection",
  reseller_recharge: "Reseller Recharge",
  inventory: "Inventory Sale",
  expense: "Expense",
  vendor_payment: "Vendor Payment",
  transfer: "Internal Transfer",
  manual: "Manual Entry",
};

function formatPKR(v: string | number | null | undefined) {
  const n = parseFloat(String(v || "0"));
  return `Rs ${Math.abs(n).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getAccountTypeInfo(type: string) {
  return ACCOUNT_TYPES.find(t => t.value === type) || ACCOUNT_TYPES[0];
}

type Tab = "accounts" | "add" | "ledger" | "summary" | "transfer";

export default function CompanyBankAccountsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("accounts");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editAccount, setEditAccount] = useState<CompanyBankAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CompanyBankAccount | null>(null);
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<string>("all");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("all");
  const [ledgerModuleFilter, setLedgerModuleFilter] = useState("all");
  const [ledgerSearch, setLedgerSearch] = useState("");

  // Transfer state
  const [transferFromId, setTransferFromId] = useState("");
  const [transferToId, setTransferToId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferRemarks, setTransferRemarks] = useState("");

  // Manual txn state
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualType, setManualType] = useState<"credit" | "debit">("credit");
  const [manualAccountId, setManualAccountId] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualRemarks, setManualRemarks] = useState("");

  // Ledger entry action state
  const [viewEntry, setViewEntry] = useState<CompanyAccountLedgerEntry | null>(null);
  const [editEntry, setEditEntry] = useState<CompanyAccountLedgerEntry | null>(null);
  const [deleteLedgerEntry, setDeleteLedgerEntry] = useState<CompanyAccountLedgerEntry | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const { data: currentUser } = useQuery<any>({ queryKey: ["/api/auth/me"] });
  const isAdmin = ["admin", "super_admin", "superadmin", "super admin"].includes((currentUser?.role || "").toLowerCase());

  const { data: accounts = [], isLoading } = useQuery<CompanyBankAccount[]>({
    queryKey: ["/api/company-bank-accounts"],
  });

  const { data: ledger = [], isLoading: isLoadingLedger } = useQuery<CompanyAccountLedgerEntry[]>({
    queryKey: ["/api/company-account-ledger"],
  });

  const form = useForm<InsertCompanyBankAccount>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: "", accountType: "bank", bankName: "", accountNumber: "", iban: "",
      openingBalance: "0", currentBalance: "0", currency: "PKR", branch: "", description: "", status: "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCompanyBankAccount) => {
      const res = await apiRequest("POST", "/api/company-bank-accounts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-bank-accounts"] });
      form.reset();
      setEditAccount(null);
      setActiveTab("accounts");
      toast({ title: "Account saved successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCompanyBankAccount> }) => {
      const res = await apiRequest("PATCH", `/api/company-bank-accounts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-bank-accounts"] });
      form.reset();
      setEditAccount(null);
      setActiveTab("accounts");
      toast({ title: "Account updated successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/company-bank-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company-account-ledger"] });
      setDeleteTarget(null);
      toast({ title: "Account deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/company-bank-accounts/${id}`, { status });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/company-bank-accounts"] }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const transferMutation = useMutation({
    mutationFn: async (data: { fromAccountId: number; toAccountId: number; amount: number; remarks?: string }) => {
      const res = await apiRequest("POST", "/api/company-account-ledger/transfer", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company-account-ledger"] });
      setTransferFromId(""); setTransferToId(""); setTransferAmount(""); setTransferRemarks("");
      toast({ title: "Transfer completed successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const manualMutation = useMutation({
    mutationFn: async (data: { accountId: number; amount: number; description?: string; remarks?: string; referenceModule?: string }) => {
      const endpoint = manualType === "credit" ? "/api/company-account-ledger/credit" : "/api/company-account-ledger/debit";
      const res = await apiRequest("POST", endpoint, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company-account-ledger"] });
      setManualDialogOpen(false);
      setManualAccountId(""); setManualAmount(""); setManualDescription(""); setManualRemarks("");
      toast({ title: `Manual ${manualType} entry added` });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const editLedgerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { description?: string; remarks?: string; amount?: number } }) => {
      const res = await apiRequest("PATCH", `/api/company-account-ledger/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company-account-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-wallet-transactions"] });
      setEditEntry(null);
      setEditDesc(""); setEditRemarks(""); setEditAmount("");
      toast({ title: "Ledger entry updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteLedgerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/company-account-ledger/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company-account-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-wallet-transactions"] });
      setDeleteLedgerEntry(null);
      toast({ title: "Ledger entry deleted and bank balance reversed." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const onSubmit = (data: InsertCompanyBankAccount) => {
    if (editAccount) {
      updateMutation.mutate({ id: editAccount.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (account: CompanyBankAccount) => {
    setEditAccount(account);
    form.reset({
      name: account.name, accountType: account.accountType, bankName: account.bankName || "",
      accountNumber: account.accountNumber || "", iban: account.iban || "",
      openingBalance: account.openingBalance || "0", currentBalance: account.currentBalance || "0",
      currency: account.currency || "PKR", branch: account.branch || "",
      description: account.description || "", status: account.status || "active",
    });
    setActiveTab("add");
  };

  const filteredAccounts = accounts.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || (a.bankName || "").toLowerCase().includes(search.toLowerCase()) || (a.accountNumber || "").includes(search);
    const matchType = typeFilter === "all" || a.accountType === typeFilter;
    return matchSearch && matchType;
  });

  const filteredLedger = ledger.filter(t => {
    const matchAccount = selectedLedgerAccountId === "all" || t.accountId === parseInt(selectedLedgerAccountId);
    const matchType = ledgerTypeFilter === "all" || t.type === ledgerTypeFilter;
    const matchModule = ledgerModuleFilter === "all" || t.referenceModule === ledgerModuleFilter;
    const matchSearch = !ledgerSearch || (t.description || "").toLowerCase().includes(ledgerSearch.toLowerCase()) || (t.referenceId || "").toLowerCase().includes(ledgerSearch.toLowerCase()) || (t.remarks || "").toLowerCase().includes(ledgerSearch.toLowerCase());
    return matchAccount && matchType && matchModule && matchSearch;
  });

  // Balance summary computations
  const totalBankBalance = accounts.filter(a => a.accountType === "bank" && a.status === "active").reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);
  const totalCashBalance = accounts.filter(a => a.accountType === "cash" && a.status === "active").reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);
  const totalWalletBalance = accounts.filter(a => a.accountType === "wallet" && a.status === "active").reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);
  const totalGatewayBalance = accounts.filter(a => a.accountType === "gateway" && a.status === "active").reduce((s, a) => s + parseFloat(a.currentBalance || "0"), 0);
  const totalBalance = totalBankBalance + totalCashBalance + totalWalletBalance + totalGatewayBalance;

  const today = new Date();
  const thisMonth = today.getMonth(); const thisYear = today.getFullYear();
  const monthLedger = ledger.filter(t => { const d = new Date(t.createdAt || ""); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; });
  const monthlyCredits = monthLedger.filter(t => t.type === "credit").reduce((s, t) => s + parseFloat(t.amount || "0"), 0);
  const monthlyDebits = monthLedger.filter(t => t.type === "debit").reduce((s, t) => s + parseFloat(t.amount || "0"), 0);
  const netCashFlow = monthlyCredits - monthlyDebits;

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "accounts", label: "Account List", icon: Landmark },
    { id: "add", label: editAccount ? "Edit Account" : "Add Account", icon: Plus },
    { id: "ledger", label: "Account Ledger", icon: FileText },
    { id: "summary", label: "Balance Summary", icon: TrendingUp },
    { id: "transfer", label: "Transfer", icon: ArrowLeftRight },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" /> Company Bank & Cash Accounts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Centralized financial account management — track all inflows and outflows</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { setManualType("credit"); setManualDialogOpen(true); }} data-testid="button-manual-credit">
            <ArrowUpCircle className="h-4 w-4 mr-1 text-green-600" /> Credit
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setManualType("debit"); setManualDialogOpen(true); }} data-testid="button-manual-debit">
            <ArrowDownCircle className="h-4 w-4 mr-1 text-red-600" /> Debit
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-blue-700 to-blue-600 text-white" onClick={() => { setEditAccount(null); form.reset({ name:"", accountType:"bank", bankName:"", accountNumber:"", iban:"", openingBalance:"0", currentBalance:"0", currency:"PKR", branch:"", description:"", status:"active" }); setActiveTab("add"); }} data-testid="button-add-account">
            <Plus className="h-4 w-4 mr-1" /> Add Account
          </Button>
        </div>
      </div>

      {/* KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Bank Accounts", value: formatPKR(totalBankBalance), icon: Landmark, color: "from-blue-600 to-blue-500", count: accounts.filter(a => a.accountType === "bank").length },
          { label: "Cash in Hand", value: formatPKR(totalCashBalance), icon: Banknote, color: "from-emerald-600 to-emerald-500", count: accounts.filter(a => a.accountType === "cash").length },
          { label: "Mobile Wallets", value: formatPKR(totalWalletBalance), icon: Smartphone, color: "from-purple-600 to-purple-500", count: accounts.filter(a => a.accountType === "wallet").length },
          { label: "Net Cash Flow", value: formatPKR(Math.abs(netCashFlow)), icon: netCashFlow >= 0 ? TrendingUp : TrendingDown, color: netCashFlow >= 0 ? "from-teal-600 to-teal-500" : "from-rose-600 to-rose-500", count: null as any },
        ].map((kpi, i) => (
          <Card key={i} className={`bg-gradient-to-br ${kpi.color} border-0 shadow-md`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-xl font-bold text-white mt-1">{kpi.value}</p>
                  {kpi.count !== null && <p className="text-[11px] text-white/70 mt-0.5">{kpi.count} accounts</p>}
                  {kpi.count === null && <p className="text-[11px] text-white/70 mt-0.5">This month</p>}
                </div>
                <kpi.icon className="h-5 w-5 text-white/50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-muted-foreground hover:text-slate-700 dark:hover:text-slate-300"}`}
            data-testid={`tab-${tab.id}`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* === ACCOUNT LIST TAB === */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search accounts..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-accounts" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-type-filter"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ACCOUNT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : filteredAccounts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Landmark className="h-14 w-14 mb-3 opacity-20" />
                <p className="font-medium text-base">No accounts found</p>
                <p className="text-sm mt-1">{accounts.length > 0 ? "Try adjusting filters" : "Add your first financial account to get started"}</p>
                <Button className="mt-4 bg-gradient-to-r from-blue-700 to-blue-600 text-white" size="sm" onClick={() => setActiveTab("add")} data-testid="button-add-first">
                  <Plus className="h-4 w-4 mr-1" /> Add Account
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAccounts.map(account => {
                const typeInfo = getAccountTypeInfo(account.accountType);
                const Icon = typeInfo.icon;
                const balance = parseFloat(account.currentBalance || "0");
                const acctLedger = ledger.filter(l => l.accountId === account.id);
                const totalCredits = acctLedger.filter(l => l.type === "credit").reduce((s, l) => s + parseFloat(l.amount || "0"), 0);
                const totalDebits = acctLedger.filter(l => l.type === "debit").reduce((s, l) => s + parseFloat(l.amount || "0"), 0);
                return (
                  <Card key={account.id} className={`border shadow-sm hover:shadow-md transition-shadow ${account.status !== "active" ? "opacity-70" : ""}`} data-testid={`card-account-${account.id}`}>
                    <CardContent className="p-0">
                      <div className={`bg-gradient-to-r ${typeInfo.color} rounded-t-lg p-4 flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-white text-base leading-tight">{account.name}</p>
                            <p className="text-white/70 text-xs">{typeInfo.label}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10" data-testid={`menu-account-${account.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(account)} data-testid={`edit-account-${account.id}`}><Edit className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedLedgerAccountId(String(account.id)); setActiveTab("ledger"); }} data-testid={`view-ledger-${account.id}`}><Eye className="h-4 w-4 mr-2" /> View Ledger</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setManualType("credit"); setManualAccountId(String(account.id)); setManualDialogOpen(true); }} data-testid={`credit-account-${account.id}`}><ArrowUpCircle className="h-4 w-4 mr-2 text-green-600" /> Add Credit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setManualType("debit"); setManualAccountId(String(account.id)); setManualDialogOpen(true); }} data-testid={`debit-account-${account.id}`}><ArrowDownCircle className="h-4 w-4 mr-2 text-red-600" /> Add Debit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => statusMutation.mutate({ id: account.id, status: account.status === "active" ? "inactive" : "active" })} data-testid={`toggle-status-${account.id}`}>
                              {account.status === "active" ? <><XCircle className="h-4 w-4 mr-2 text-orange-600" /> Deactivate</> : <><CheckCircle2 className="h-4 w-4 mr-2 text-green-600" /> Activate</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTarget(account)} data-testid={`delete-account-${account.id}`}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Current Balance</p>
                            <p className={`text-2xl font-bold ${balance < 0 ? "text-red-600" : "text-slate-800 dark:text-slate-100"}`}>{formatPKR(balance)}</p>
                          </div>
                          <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${account.status === "active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800"}`}>
                            {account.status === "active" ? <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> : <XCircle className="h-2.5 w-2.5 mr-1" />}
                            {account.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-2">
                            <p className="text-[10px] text-muted-foreground">Bank / Provider</p>
                            <p className="text-xs font-medium truncate">{account.bankName || "—"}</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-2">
                            <p className="text-[10px] text-muted-foreground">Account No.</p>
                            <p className="text-xs font-medium font-mono truncate">{account.accountNumber || "—"}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 text-[11px]">
                          <div className="flex-1 bg-green-50 dark:bg-green-950/30 rounded-md p-2 text-center">
                            <p className="text-green-700 dark:text-green-400 font-bold">{formatPKR(totalCredits)}</p>
                            <p className="text-muted-foreground">Total Credits</p>
                          </div>
                          <div className="flex-1 bg-red-50 dark:bg-red-950/30 rounded-md p-2 text-center">
                            <p className="text-red-700 dark:text-red-400 font-bold">{formatPKR(totalDebits)}</p>
                            <p className="text-muted-foreground">Total Debits</p>
                          </div>
                        </div>
                        {account.iban && (
                          <p className="text-[10px] text-muted-foreground font-mono truncate">IBAN: {account.iban}</p>
                        )}
                        {account.branch && (
                          <p className="text-[10px] text-muted-foreground">Branch: {account.branch}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Total Balance Bar */}
          {accounts.length > 0 && (
            <Card className="border border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-900 dark:to-slate-800">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-wide font-medium">Total Available Balance (All Active Accounts)</p>
                    <p className="text-3xl font-bold text-white mt-1">{formatPKR(totalBalance)}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-white/60 text-[10px] uppercase">Active</p>
                      <p className="text-white font-bold">{accounts.filter(a => a.status === "active").length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/60 text-[10px] uppercase">Inactive</p>
                      <p className="text-white font-bold">{accounts.filter(a => a.status !== "active").length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/60 text-[10px] uppercase">Total</p>
                      <p className="text-white font-bold">{accounts.length}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* === ADD / EDIT ACCOUNT TAB === */}
      {activeTab === "add" && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              {editAccount ? <Edit className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
              {editAccount ? `Edit Account — ${editAccount.name}` : "Add New Financial Account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Account Type Picker */}
                <FormField control={form.control} name="accountType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type <span className="text-red-500">*</span></FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ACCOUNT_TYPES.map(t => {
                        const Icon = t.icon;
                        const isSelected = field.value === t.value;
                        return (
                          <button key={t.value} type="button" onClick={() => field.onChange(t.value)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${isSelected ? `border-blue-500 bg-blue-50 dark:bg-blue-950/30` : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}
                            data-testid={`type-option-${t.value}`}>
                            <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xs font-medium text-center">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl><Input placeholder="e.g., Main HBL Account" data-testid="input-account-name" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="bankName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank / Provider Name</FormLabel>
                      <FormControl><Input placeholder="e.g., HBL, JazzCash, Stripe" data-testid="input-bank-name" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="accountNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl><Input placeholder="Account number" data-testid="input-account-number" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="iban" render={({ field }) => (
                    <FormItem>
                      <FormLabel>IBAN</FormLabel>
                      <FormControl><Input placeholder="PK00XXXX0000000000000000" data-testid="input-iban" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="openingBalance" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opening Balance</FormLabel>
                      <FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-opening-balance" {...field} value={field.value || "0"} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select value={field.value || "PKR"} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-currency"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PKR">PKR — Pakistani Rupee</SelectItem>
                          <SelectItem value="USD">USD — US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR — Euro</SelectItem>
                          <SelectItem value="GBP">GBP — British Pound</SelectItem>
                          <SelectItem value="AED">AED — UAE Dirham</SelectItem>
                          <SelectItem value="SAR">SAR — Saudi Riyal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="branch" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch (Optional)</FormLabel>
                      <FormControl><Input placeholder="Branch name or code" data-testid="input-branch" {...field} value={field.value || ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value || "active"} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="Optional notes about this account" data-testid="input-description" {...field} value={field.value || ""} rows={2} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-6" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-account">
                    {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editAccount ? "Update Account" : "Create Account"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setEditAccount(null); form.reset(); setActiveTab("accounts"); }} data-testid="button-cancel-account">Cancel</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* === ACCOUNT LEDGER TAB === */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <Select value={selectedLedgerAccountId} onValueChange={setSelectedLedgerAccountId}>
              <SelectTrigger className="w-full sm:w-[240px]" data-testid="select-ledger-account"><SelectValue placeholder="All Accounts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={ledgerTypeFilter} onValueChange={setLedgerTypeFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-ledger-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ledgerModuleFilter} onValueChange={setLedgerModuleFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-ledger-module"><SelectValue placeholder="All Modules" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {Object.entries(MODULE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search ledger..." className="pl-9" value={ledgerSearch} onChange={e => setLedgerSearch(e.target.value)} data-testid="input-ledger-search" />
            </div>
            {(ledgerTypeFilter !== "all" || ledgerModuleFilter !== "all" || ledgerSearch || selectedLedgerAccountId !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setLedgerTypeFilter("all"); setLedgerModuleFilter("all"); setLedgerSearch(""); setSelectedLedgerAccountId("all"); }}>
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="no-default-active-elevate text-xs">{filteredLedger.length} of {ledger.length} entries</Badge>
            {selectedLedgerAccountId !== "all" && (() => {
              const acc = accounts.find(a => a.id === parseInt(selectedLedgerAccountId));
              if (!acc) return null;
              const typeInfo = getAccountTypeInfo(acc.accountType);
              return (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Balance:</span>
                  <span className="font-bold text-blue-600">{formatPKR(acc.currentBalance)}</span>
                  <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${typeInfo.badge}`}>{typeInfo.label}</Badge>
                </div>
              );
            })()}
          </div>

          <Card className="border shadow-sm overflow-hidden">
            {isLoadingLedger ? (
              <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : filteredLedger.length === 0 ? (
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileText className="h-14 w-14 mb-3 opacity-20" />
                <p className="font-medium text-base">No transactions found</p>
                <p className="text-sm mt-1">{ledger.length > 0 ? "Try adjusting filters" : "No ledger entries yet. Start by adding a transaction."}</p>
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-900 dark:to-slate-800 text-white">
                      <th className="px-3 py-2.5 text-left font-medium text-xs">Date</th>
                      {selectedLedgerAccountId === "all" && <th className="px-3 py-2.5 text-left font-medium text-xs">Account</th>}
                      <th className="px-3 py-2.5 text-left font-medium text-xs">Txn #</th>
                      <th className="px-3 py-2.5 text-left font-medium text-xs">Type</th>
                      <th className="px-3 py-2.5 text-left font-medium text-xs hidden md:table-cell">Module</th>
                      <th className="px-3 py-2.5 text-left font-medium text-xs hidden md:table-cell">Ref ID</th>
                      <th className="px-3 py-2.5 text-left font-medium text-xs hidden lg:table-cell">Description</th>
                      <th className="px-3 py-2.5 text-right font-medium text-xs">Debit</th>
                      <th className="px-3 py-2.5 text-right font-medium text-xs">Credit</th>
                      <th className="px-3 py-2.5 text-right font-medium text-xs">Balance</th>
                      <th className="px-3 py-2.5 text-center font-medium text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedger.map((entry, idx) => {
                      const isCredit = entry.type === "credit";
                      const account = accounts.find(a => a.id === entry.accountId);
                      return (
                        <tr key={entry.id} data-testid={`row-ledger-${entry.id}`}
                          className={`border-b border-slate-100 dark:border-slate-800 ${idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/60"}`}>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                            {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                          </td>
                          {selectedLedgerAccountId === "all" && (
                            <td className="px-3 py-2.5">
                              <span className="text-xs font-medium">{account?.name || `#${entry.accountId}`}</span>
                            </td>
                          )}
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-mono text-muted-foreground">#{String(entry.id).padStart(6, "0")}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize gap-0.5 ${isCredit ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950"}`}>
                              {isCredit ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                              {entry.type}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 hidden md:table-cell">
                            <span className="text-xs text-muted-foreground">{MODULE_LABELS[entry.referenceModule || ""] || (entry.referenceModule || "—")}</span>
                          </td>
                          <td className="px-3 py-2.5 hidden md:table-cell">
                            <span className="text-xs font-mono text-muted-foreground">{entry.referenceId || "—"}</span>
                          </td>
                          <td className="px-3 py-2.5 hidden lg:table-cell max-w-[150px]">
                            <span className="text-xs text-muted-foreground truncate block">{entry.description || entry.remarks || "—"}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={`text-xs font-semibold ${!isCredit ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                              {!isCredit ? formatPKR(entry.amount) : "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={`text-xs font-semibold ${isCredit ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                              {isCredit ? formatPKR(entry.amount) : "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className={`text-xs font-bold ${parseFloat(entry.balanceAfter || "0") < 0 ? "text-red-600" : "text-slate-700 dark:text-slate-200"}`}>
                              {formatPKR(entry.balanceAfter)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`menu-ledger-${entry.id}`}>
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem onClick={() => setViewEntry(entry)} data-testid={`view-ledger-entry-${entry.id}`}>
                                  <Eye className="h-4 w-4 mr-2 text-blue-600" /> View Transaction
                                </DropdownMenuItem>
                                {isAdmin ? (
                                  <>
                                    <DropdownMenuItem onClick={() => { setEditEntry(entry); setEditDesc(entry.description || ""); setEditRemarks(entry.remarks || ""); setEditAmount(entry.amount || ""); }} data-testid={`edit-ledger-entry-${entry.id}`}>
                                      <Edit className="h-4 w-4 mr-2 text-amber-600" /> Edit Transaction
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600" onClick={() => setDeleteLedgerEntry(entry)} data-testid={`delete-ledger-entry-${entry.id}`}>
                                      <Trash2 className="h-4 w-4 mr-2" /> Delete Transaction
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                                    <Lock className="h-3.5 w-3.5 mr-2" /> Admin only — Edit/Delete
                                  </DropdownMenuItem>
                                )}
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
          </Card>

          {/* Ledger Summary Row */}
          {filteredLedger.length > 0 && (
            <div className="flex gap-4 justify-end text-sm text-muted-foreground">
              <span>Total Credits: <strong className="text-green-600">{formatPKR(filteredLedger.filter(t => t.type === "credit").reduce((s, t) => s + parseFloat(t.amount || "0"), 0))}</strong></span>
              <span>Total Debits: <strong className="text-red-600">{formatPKR(filteredLedger.filter(t => t.type === "debit").reduce((s, t) => s + parseFloat(t.amount || "0"), 0))}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* === BALANCE SUMMARY TAB === */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          {/* Overall Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Bank Balance", value: formatPKR(totalBankBalance), icon: Landmark, color: "from-blue-600 to-blue-500", sub: `${accounts.filter(a=>a.accountType==="bank").length} accounts` },
              { label: "Cash in Hand", value: formatPKR(totalCashBalance), icon: Banknote, color: "from-emerald-600 to-emerald-500", sub: `${accounts.filter(a=>a.accountType==="cash").length} accounts` },
              { label: "Wallet Balance", value: formatPKR(totalWalletBalance), icon: Smartphone, color: "from-purple-600 to-purple-500", sub: `${accounts.filter(a=>a.accountType==="wallet").length} accounts` },
              { label: "Gateway Balance", value: formatPKR(totalGatewayBalance), icon: CreditCard, color: "from-orange-600 to-orange-500", sub: `${accounts.filter(a=>a.accountType==="gateway").length} accounts` },
            ].map((kpi, i) => (
              <Card key={i} className={`bg-gradient-to-br ${kpi.color} border-0 shadow-md`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wide">{kpi.label}</p>
                      <p className="text-xl font-bold text-white mt-1">{kpi.value}</p>
                      <p className="text-[11px] text-white/60 mt-0.5">{kpi.sub}</p>
                    </div>
                    <kpi.icon className="h-5 w-5 text-white/50" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Monthly Performance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border shadow-sm bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpCircle className="h-5 w-5 text-green-600" />
                  <p className="font-semibold text-green-800 dark:text-green-300 text-sm">Monthly Credits</p>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{formatPKR(monthlyCredits)}</p>
                <p className="text-xs text-muted-foreground mt-1">{monthLedger.filter(t=>t.type==="credit").length} credit transactions this month</p>
              </CardContent>
            </Card>
            <Card className="border shadow-sm bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownCircle className="h-5 w-5 text-red-600" />
                  <p className="font-semibold text-red-800 dark:text-red-300 text-sm">Monthly Debits</p>
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{formatPKR(monthlyDebits)}</p>
                <p className="text-xs text-muted-foreground mt-1">{monthLedger.filter(t=>t.type==="debit").length} debit transactions this month</p>
              </CardContent>
            </Card>
            <Card className={`border shadow-sm ${netCashFlow >= 0 ? "bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/30 dark:to-teal-900/20 border-teal-200 dark:border-teal-800" : "bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20 border-rose-200 dark:border-rose-800"}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {netCashFlow >= 0 ? <TrendingUp className="h-5 w-5 text-teal-600" /> : <TrendingDown className="h-5 w-5 text-rose-600" />}
                  <p className={`font-semibold text-sm ${netCashFlow >= 0 ? "text-teal-800 dark:text-teal-300" : "text-rose-800 dark:text-rose-300"}`}>Net Cash Flow</p>
                </div>
                <p className={`text-2xl font-bold ${netCashFlow >= 0 ? "text-teal-700 dark:text-teal-400" : "text-rose-700 dark:text-rose-400"}`}>{netCashFlow >= 0 ? "+" : "-"}{formatPKR(Math.abs(netCashFlow))}</p>
                <p className="text-xs text-muted-foreground mt-1">Credits minus debits this month</p>
              </CardContent>
            </Card>
          </div>

          {/* Per-Account Summary Table */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Account-wise Balance Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {accounts.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-muted-foreground">
                  <Landmark className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">No accounts configured yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Opening Balance</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Credits</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Debits</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current Balance</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((account, idx) => {
                        const typeInfo = getAccountTypeInfo(account.accountType);
                        const Icon = typeInfo.icon;
                        const acctLedger = ledger.filter(l => l.accountId === account.id);
                        const totalCredits = acctLedger.filter(l => l.type === "credit").reduce((s, l) => s + parseFloat(l.amount || "0"), 0);
                        const totalDebits = acctLedger.filter(l => l.type === "debit").reduce((s, l) => s + parseFloat(l.amount || "0"), 0);
                        const balance = parseFloat(account.currentBalance || "0");
                        return (
                          <tr key={account.id} className={`border-b border-slate-100 dark:border-slate-800 ${idx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/60 dark:bg-slate-900/60"}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${typeInfo.color} flex items-center justify-center shrink-0`}>
                                  <Icon className="h-3.5 w-3.5 text-white" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{account.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{account.bankName || "—"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${typeInfo.badge}`}>{typeInfo.label}</Badge>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-mono">{formatPKR(account.openingBalance)}</td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">{formatPKR(totalCredits)}</td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-red-600 dark:text-red-400">{formatPKR(totalDebits)}</td>
                            <td className={`px-4 py-3 text-right text-sm font-bold ${balance < 0 ? "text-red-600" : "text-slate-800 dark:text-slate-100"}`}>{formatPKR(balance)}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${account.status === "active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800"}`}>
                                {account.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 dark:bg-slate-800 font-semibold">
                        <td className="px-4 py-3 text-sm" colSpan={2}>Total ({accounts.filter(a=>a.status==="active").length} active accounts)</td>
                        <td className="px-4 py-3 text-right text-sm">{formatPKR(accounts.reduce((s,a)=>s+parseFloat(a.openingBalance||"0"),0))}</td>
                        <td className="px-4 py-3 text-right text-sm text-green-600">{formatPKR(ledger.filter(l=>l.type==="credit").reduce((s,l)=>s+parseFloat(l.amount||"0"),0))}</td>
                        <td className="px-4 py-3 text-right text-sm text-red-600">{formatPKR(ledger.filter(l=>l.type==="debit").reduce((s,l)=>s+parseFloat(l.amount||"0"),0))}</td>
                        <td className="px-4 py-3 text-right text-sm text-blue-600">{formatPKR(totalBalance)}</td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* === TRANSFER TAB === */}
      {activeTab === "transfer" && (
        <div className="max-w-xl mx-auto">
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-blue-600" /> Transfer Between Accounts
              </CardTitle>
              <p className="text-sm text-muted-foreground">Move funds between company financial accounts. Creates paired debit/credit entries.</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Account <span className="text-red-500">*</span></label>
                <Select value={transferFromId} onValueChange={setTransferFromId}>
                  <SelectTrigger data-testid="select-transfer-from"><SelectValue placeholder="Select source account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.filter(a => a.status === "active").map(a => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name} — {formatPKR(a.currentBalance)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {transferFromId && (() => {
                  const acc = accounts.find(a => a.id === parseInt(transferFromId));
                  if (!acc) return null;
                  return <p className="text-xs text-muted-foreground">Available: <strong>{formatPKR(acc.currentBalance)}</strong></p>;
                })()}
              </div>

              <div className="flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                  <ArrowDownCircle className="h-4 w-4 text-blue-600" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Account <span className="text-red-500">*</span></label>
                <Select value={transferToId} onValueChange={setTransferToId}>
                  <SelectTrigger data-testid="select-transfer-to"><SelectValue placeholder="Select destination account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.filter(a => a.status === "active" && String(a.id) !== transferFromId).map(a => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name} — {formatPKR(a.currentBalance)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount <span className="text-red-500">*</span></label>
                <Input type="number" step="0.01" min="1" placeholder="Enter transfer amount"
                  value={transferAmount} onChange={e => setTransferAmount(e.target.value)} data-testid="input-transfer-amount" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Remarks</label>
                <Textarea placeholder="Reason for transfer (optional)" value={transferRemarks} onChange={e => setTransferRemarks(e.target.value)} rows={2} data-testid="input-transfer-remarks" />
              </div>

              {transferFromId && transferToId && transferAmount && (
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-300">Transfer Summary</p>
                  <p className="text-blue-700 dark:text-blue-400 mt-1">
                    <strong>{formatPKR(transferAmount)}</strong> will be moved from <strong>{accounts.find(a=>a.id===parseInt(transferFromId))?.name}</strong> to <strong>{accounts.find(a=>a.id===parseInt(transferToId))?.name}</strong>
                  </p>
                </div>
              )}

              <Button className="w-full bg-gradient-to-r from-blue-700 to-blue-600 text-white"
                disabled={!transferFromId || !transferToId || !transferAmount || transferMutation.isPending}
                onClick={() => transferMutation.mutate({ fromAccountId: parseInt(transferFromId), toAccountId: parseInt(transferToId), amount: parseFloat(transferAmount), remarks: transferRemarks })}
                data-testid="button-confirm-transfer">
                {transferMutation.isPending ? "Processing..." : "Confirm Transfer"}
              </Button>

              {accounts.filter(a=>a.status==="active").length < 2 && (
                <div className="flex items-start gap-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-700 dark:text-orange-400">You need at least 2 active accounts to perform a transfer.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manual Credit/Debit Dialog */}
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {manualType === "credit"
                ? <><ArrowUpCircle className="h-5 w-5 text-green-600" /> Manual Credit Entry</>
                : <><ArrowDownCircle className="h-5 w-5 text-red-600" /> Manual Debit Entry</>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant={manualType === "credit" ? "default" : "outline"} size="sm" className={manualType === "credit" ? "bg-green-600 text-white" : ""} onClick={() => setManualType("credit")} data-testid="btn-type-credit">
                <ArrowUpCircle className="h-4 w-4 mr-1" /> Credit
              </Button>
              <Button variant={manualType === "debit" ? "default" : "outline"} size="sm" className={manualType === "debit" ? "bg-red-600 text-white" : ""} onClick={() => setManualType("debit")} data-testid="btn-type-debit">
                <ArrowDownCircle className="h-4 w-4 mr-1" /> Debit
              </Button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Account <span className="text-red-500">*</span></label>
              <Select value={manualAccountId} onValueChange={setManualAccountId}>
                <SelectTrigger data-testid="select-manual-account"><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.status === "active").map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name} — {formatPKR(a.currentBalance)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount <span className="text-red-500">*</span></label>
              <Input type="number" step="0.01" min="1" placeholder="Enter amount"
                value={manualAmount} onChange={e => setManualAmount(e.target.value)} data-testid="input-manual-amount" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="What is this transaction for?" value={manualDescription} onChange={e => setManualDescription(e.target.value)} data-testid="input-manual-description" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Remarks</label>
              <Textarea placeholder="Additional notes (optional)" value={manualRemarks} onChange={e => setManualRemarks(e.target.value)} rows={2} data-testid="input-manual-remarks" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setManualDialogOpen(false)} data-testid="button-cancel-manual">Cancel</Button>
            <Button
              className={manualType === "credit" ? "bg-green-600 text-white" : "bg-red-600 text-white"}
              disabled={!manualAccountId || !manualAmount || manualMutation.isPending}
              onClick={() => manualMutation.mutate({ accountId: parseInt(manualAccountId), amount: parseFloat(manualAmount), description: manualDescription, remarks: manualRemarks, referenceModule: "manual" })}
              data-testid="button-confirm-manual">
              {manualMutation.isPending ? "Processing..." : `Confirm ${manualType === "credit" ? "Credit" : "Debit"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will permanently remove the account and all its ledger entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 text-white" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} data-testid="confirm-delete">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Ledger Entry Dialog */}
      <Dialog open={!!viewEntry} onOpenChange={(o) => { if (!o) setViewEntry(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" /> View Transaction
              <span className="text-sm font-mono text-muted-foreground ml-1">#{viewEntry && String(viewEntry.id).padStart(6, "0")}</span>
            </DialogTitle>
          </DialogHeader>
          {viewEntry && (() => {
            const acc = accounts.find(a => a.id === viewEntry.accountId);
            const isCredit = viewEntry.type === "credit";
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Account</p>
                    <p className="text-sm font-medium">{acc?.name || `#${viewEntry.accountId}`}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Date</p>
                    <p className="text-sm">{viewEntry.createdAt ? new Date(viewEntry.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Type</p>
                    <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${isCredit ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>
                      {isCredit ? <ArrowUpCircle className="h-3 w-3 mr-1" /> : <ArrowDownCircle className="h-3 w-3 mr-1" />}
                      {viewEntry.type}
                    </Badge>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Amount</p>
                    <p className={`text-sm font-bold ${isCredit ? "text-green-600" : "text-red-600"}`}>{isCredit ? "+" : "−"} {formatPKR(viewEntry.amount)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Balance After</p>
                    <p className={`text-sm font-bold ${parseFloat(viewEntry.balanceAfter || "0") < 0 ? "text-red-600" : "text-slate-700 dark:text-slate-200"}`}>{formatPKR(viewEntry.balanceAfter)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Module</p>
                    <p className="text-sm">{MODULE_LABELS[viewEntry.referenceModule || ""] || viewEntry.referenceModule || "—"}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Reference ID</p>
                    <p className="text-sm font-mono">{viewEntry.referenceId || "—"}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Created By</p>
                    <p className="text-sm capitalize">{viewEntry.createdBy || "System"}</p>
                  </div>
                </div>
                {(viewEntry.description || viewEntry.remarks) && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-2">
                    {viewEntry.description && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Description</p>
                        <p className="text-sm">{viewEntry.description}</p>
                      </div>
                    )}
                    {viewEntry.remarks && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">Remarks</p>
                        <p className="text-sm text-muted-foreground">{viewEntry.remarks}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setViewEntry(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Ledger Entry Dialog */}
      <Dialog open={!!editEntry} onOpenChange={(o) => { if (!o) { setEditEntry(null); setEditDesc(""); setEditRemarks(""); setEditAmount(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-amber-600" /> Edit Transaction
              <span className="text-sm font-mono text-muted-foreground ml-1">#{editEntry && String(editEntry.id).padStart(6, "0")}</span>
            </DialogTitle>
          </DialogHeader>
          {editEntry && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
                <p className="font-medium mb-1">Linked Module: {MODULE_LABELS[editEntry.referenceModule || ""] || editEntry.referenceModule || "Manual"}</p>
                <p>Changes to description and remarks will also sync to the originating module transaction.</p>
              </div>
              {editEntry.referenceModule === "manual" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (PKR)</label>
                  <Input type="number" step="0.01" min="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)} data-testid="input-edit-ledger-amount" />
                  <p className="text-xs text-muted-foreground">Current: {formatPKR(editEntry.amount)}</p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input placeholder="Transaction description" value={editDesc} onChange={e => setEditDesc(e.target.value)} data-testid="input-edit-ledger-desc" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Remarks</label>
                <Textarea placeholder="Additional notes (optional)" value={editRemarks} onChange={e => setEditRemarks(e.target.value)} rows={2} data-testid="input-edit-ledger-remarks" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => { setEditEntry(null); setEditDesc(""); setEditRemarks(""); setEditAmount(""); }} data-testid="button-cancel-edit-ledger">Cancel</Button>
            <Button
              className="bg-amber-600 text-white"
              disabled={editLedgerMutation.isPending}
              onClick={() => {
                if (!editEntry) return;
                const data: { description?: string; remarks?: string; amount?: number } = {
                  description: editDesc,
                  remarks: editRemarks,
                };
                if (editEntry.referenceModule === "manual" && editAmount && parseFloat(editAmount) > 0) {
                  data.amount = parseFloat(editAmount);
                }
                editLedgerMutation.mutate({ id: editEntry.id, data });
              }}
              data-testid="button-confirm-edit-ledger">
              {editLedgerMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Ledger Entry Confirmation */}
      <AlertDialog open={!!deleteLedgerEntry} onOpenChange={(o) => { if (!o) setDeleteLedgerEntry(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" /> Delete Ledger Transaction
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>You are about to permanently delete ledger entry <strong>#{deleteLedgerEntry && String(deleteLedgerEntry.id).padStart(6, "0")}</strong>.</p>
                {deleteLedgerEntry && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-sm space-y-1">
                    <p><span className="text-muted-foreground">Amount:</span> <strong className={deleteLedgerEntry.type === "credit" ? "text-green-600" : "text-red-600"}>{formatPKR(deleteLedgerEntry.amount)}</strong></p>
                    <p><span className="text-muted-foreground">Module:</span> {MODULE_LABELS[deleteLedgerEntry.referenceModule || ""] || deleteLedgerEntry.referenceModule || "—"}</p>
                    {deleteLedgerEntry.description && <p><span className="text-muted-foreground">Description:</span> {deleteLedgerEntry.description}</p>}
                  </div>
                )}
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-xs text-red-700 dark:text-red-400 space-y-1">
                  <p className="font-semibold">This action will:</p>
                  <p>• Reverse the bank account balance effect of this entry</p>
                  {deleteLedgerEntry?.referenceModule === "reseller_recharge" && <p>• Reset the linked reseller wallet transaction payment status to Unpaid</p>}
                  <p>• This cannot be undone</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-ledger">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white"
              onClick={() => deleteLedgerEntry && deleteLedgerMutation.mutate(deleteLedgerEntry.id)}
              data-testid="confirm-delete-ledger">
              {deleteLedgerMutation.isPending ? "Deleting..." : "Yes, Delete Transaction"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
