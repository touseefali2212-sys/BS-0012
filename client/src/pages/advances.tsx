import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Banknote,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarDays,
  Users,
  Briefcase,
  CreditCard,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
  BadgeCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertAdvanceLoanSchema, type AdvanceLoan, type InsertAdvanceLoan, type Employee, type LoanInstallment } from "@shared/schema";
import { z } from "zod";

const formSchema = insertAdvanceLoanSchema.extend({
  employeeId: z.coerce.number().min(1, "Select an employee"),
  amount: z.string().min(1, "Amount is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  type: z.string().min(1, "Select type"),
  repaymentType: z.string().min(1, "Select repayment type"),
});

type LoanWithEmployee = AdvanceLoan & {
  employeeName?: string;
  empCode?: string;
  department?: string;
  designation?: string;
  salary?: string;
};

export default function AdvancesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<LoanWithEmployee | null>(null);
  const [detailLoan, setDetailLoan] = useState<LoanWithEmployee | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: loans, isLoading } = useQuery<LoanWithEmployee[]>({
    queryKey: ["/api/advance-loans"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: installments } = useQuery<LoanInstallment[]>({
    queryKey: ["/api/advance-loans", detailLoan?.id, "installments"],
    enabled: !!detailLoan,
    queryFn: async () => {
      const res = await fetch(`/api/advance-loans/${detailLoan!.id}/installments`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch installments");
      return res.json();
    },
  });

  const form = useForm<InsertAdvanceLoan>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: 0,
      type: "advance",
      amount: "",
      paidAmount: "0",
      reason: "",
      issueDate: new Date().toISOString().split("T")[0],
      repaymentType: "one_time",
      installments: 1,
      installmentAmount: "",
      installmentStartMonth: new Date().toISOString().slice(0, 7),
      interestRate: "0",
      requestedBy: "",
      approvedBy: "",
      approvalStatus: "pending",
      status: "pending",
      notes: "",
    },
  });

  const repaymentType = form.watch("repaymentType");
  const loanAmount = form.watch("amount");
  const numInstallments = form.watch("installments");

  const calculatedEMI = useMemo(() => {
    const amt = Number(loanAmount) || 0;
    const n = Number(numInstallments) || 1;
    if (amt > 0 && n > 0) return (amt / n).toFixed(2);
    return "0.00";
  }, [loanAmount, numInstallments]);

  const createMutation = useMutation({
    mutationFn: (data: InsertAdvanceLoan) => apiRequest("POST", "/api/advance-loans", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advance-loans"] });
      toast({ title: "Success", description: "Advance/Loan created successfully" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertAdvanceLoan> }) =>
      apiRequest("PATCH", `/api/advance-loans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advance-loans"] });
      toast({ title: "Success", description: "Updated successfully" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/advance-loans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advance-loans"] });
      toast({ title: "Deleted", description: "Record removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const markPaidMutation = useMutation({
    mutationFn: (installmentId: number) =>
      apiRequest("PATCH", `/api/loan-installments/${installmentId}`, {
        status: "paid",
        paidDate: new Date().toISOString().split("T")[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advance-loans"] });
      if (detailLoan) {
        queryClient.invalidateQueries({ queryKey: ["/api/advance-loans", detailLoan.id, "installments"] });
      }
      toast({ title: "Paid", description: "Installment marked as paid" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function closeDialog() {
    setDialogOpen(false);
    setEditingLoan(null);
    form.reset({
      employeeId: 0, type: "advance", amount: "", paidAmount: "0", reason: "",
      issueDate: new Date().toISOString().split("T")[0], repaymentType: "one_time",
      installments: 1, installmentAmount: "", installmentStartMonth: new Date().toISOString().slice(0, 7),
      interestRate: "0", requestedBy: "", approvedBy: "", approvalStatus: "pending", status: "pending", notes: "",
    });
  }

  function openEdit(loan: LoanWithEmployee) {
    setEditingLoan(loan);
    form.reset({
      employeeId: loan.employeeId,
      type: loan.type,
      amount: loan.amount,
      paidAmount: loan.paidAmount,
      reason: loan.reason || "",
      issueDate: loan.issueDate,
      repaymentType: loan.repaymentType,
      installments: loan.installments || 1,
      installmentAmount: loan.installmentAmount || "",
      installmentStartMonth: loan.installmentStartMonth || "",
      interestRate: loan.interestRate || "0",
      requestedBy: loan.requestedBy || "",
      approvedBy: loan.approvedBy || "",
      approvalStatus: loan.approvalStatus,
      status: loan.status,
      notes: loan.notes || "",
    });
    setDialogOpen(true);
  }

  function onSubmit(data: InsertAdvanceLoan) {
    if (repaymentType === "installment") {
      data.installmentAmount = calculatedEMI;
    }
    const cleaned = {
      ...data,
      paidAmount: data.paidAmount || "0",
      installmentAmount: data.installmentAmount || null,
      interestRate: data.interestRate || "0",
      installments: data.installments || 1,
    };
    if (editingLoan) {
      updateMutation.mutate({ id: editingLoan.id, data: cleaned });
    } else {
      createMutation.mutate(cleaned);
    }
  }

  const filtered = useMemo(() => {
    return (loans || []).filter((l) => {
      const matchSearch =
        (l.employeeName || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.empCode || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.reason || "").toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || l.type === typeFilter;
      const matchStatus = statusFilter === "all" || l.status === statusFilter;
      const matchDept = deptFilter === "all" || l.department === deptFilter;
      return matchSearch && matchType && matchStatus && matchDept;
    });
  }, [loans, search, typeFilter, statusFilter, deptFilter]);

  const allLoans = loans || [];
  const totalActive = allLoans.filter(l => l.status === "active").length;
  const totalAdvThisMonth = allLoans.filter(l => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return l.type === "advance" && l.issueDate.startsWith(currentMonth);
  }).length;
  const totalOutstanding = allLoans
    .filter(l => l.status === "active" || l.status === "pending")
    .reduce((s, l) => s + Number(l.amount) - Number(l.paidAmount), 0);
  const totalOverdue = allLoans.filter(l => l.status === "overdue").length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: "bg-blue-500 text-white",
      completed: "bg-emerald-500 text-white",
      pending: "bg-amber-500 text-white",
      overdue: "bg-red-500 text-white",
      rejected: "bg-gray-500 text-white",
    };
    return map[status] || "bg-gray-500 text-white";
  };

  const approvalBadge = (status: string) => {
    const map: Record<string, string> = {
      approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
      rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    };
    return map[status] || "bg-gray-100 text-gray-700";
  };

  const selectedEmployee = employees?.find(e => e.id === form.watch("employeeId"));

  return (
    <div className="p-4 max-w-[1400px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2" data-testid="text-page-title">
            <Banknote className="h-5 w-5 text-primary" />
            Advance & Loan Management
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">HR & Payroll &rsaquo; Manage employee advances and loans</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5 text-[11px]" onClick={() => window.print()} data-testid="button-print">
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-[11px]" data-testid="button-export">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" className="gap-1.5 text-[11px]" onClick={() => setDialogOpen(true)} data-testid="button-issue-new">
            <Plus className="h-3.5 w-3.5" /> Issue Advance / Loan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="enterprise-card" data-testid="card-active-loans">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Active Loans</p>
                <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400" data-testid="text-active-loans">{totalActive}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card" data-testid="card-advances-month">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Advances This Month</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400" data-testid="text-advances-month">{totalAdvThisMonth}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card" data-testid="card-outstanding">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Outstanding Balance</p>
                <p className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400" data-testid="text-outstanding">Rs. {totalOutstanding.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
                <CircleDollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card" data-testid="card-overdue">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Overdue</p>
                <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400" data-testid="text-overdue">{totalOverdue}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-main">
          <TabsTrigger value="list" data-testid="tab-list">Advance & Loan List</TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Card className="enterprise-card">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1 min-w-[120px]">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Type</label>
                  <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setCurrentPage(1); }}>
                    <SelectTrigger className="h-9 text-[13px]" data-testid="select-type-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="advance">Advance</SelectItem>
                      <SelectItem value="loan">Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1 min-w-[120px]">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                  <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
                    <SelectTrigger className="h-9 text-[13px]" data-testid="select-status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1 min-w-[140px]">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Department</label>
                  <Select value={deptFilter} onValueChange={v => { setDeptFilter(v); setCurrentPage(1); }}>
                    <SelectTrigger className="h-9 text-[13px]" data-testid="select-dept-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {["engineering","support","sales","finance","admin","management","hr","it","operations"].map(d => (
                        <SelectItem key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase()+d.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground font-medium">Show</span>
                    <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1); }}>
                      <SelectTrigger className="h-8 w-[65px] text-[12px]" data-testid="select-page-size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-[11px] text-muted-foreground font-medium">entries</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search employee, code..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                      className="pl-8 h-8 text-[12px] w-[200px]"
                      data-testid="input-search"
                    />
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="p-5 space-y-3">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Banknote className="h-12 w-12 mb-3 opacity-20" />
                  <p className="font-medium text-sm">No records found</p>
                  <p className="text-xs mt-1">Issue a new advance or loan to get started</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-800 dark:to-slate-700 hover:from-slate-800 hover:to-slate-700">
                          <TableHead className="text-white font-semibold text-[11px] uppercase py-3 w-[50px] text-center">#</TableHead>
                          <TableHead className="text-white font-semibold text-[11px] uppercase py-3 min-w-[180px]">Employee</TableHead>
                          <TableHead className="text-white font-semibold text-[11px] uppercase py-3 min-w-[80px]">Type</TableHead>
                          <TableHead className="text-white font-semibold text-[11px] uppercase py-3 text-right min-w-[100px]">Amount</TableHead>
                          <TableHead className="text-white font-semibold text-[11px] uppercase py-3 text-right min-w-[100px]">Paid</TableHead>
                          <TableHead className="text-white font-semibold text-[11px] uppercase py-3 text-right min-w-[100px]">Balance</TableHead>
                          <TableHead className="text-white font-semibold text-[11px] uppercase py-3 min-w-[90px]">EMI</TableHead>
                          <TableHead className="text-white font-semibold text-[11px] uppercase py-3 min-w-[100px]">Issue Date</TableHead>
                          <TableHead className="text-white font-semibold text-[11px] uppercase py-3 min-w-[80px]">Approval</TableHead>
                          <TableHead className="text-white font-semibold text-[11px] uppercase py-3 text-center min-w-[80px]">Status</TableHead>
                          <TableHead className="text-white font-semibold text-[11px] uppercase py-3 text-center min-w-[120px]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paged.map((loan, idx) => {
                          const serialNo = (currentPage - 1) * pageSize + idx + 1;
                          const balance = Number(loan.amount) - Number(loan.paidAmount);
                          const repaymentPct = Number(loan.amount) > 0 ? (Number(loan.paidAmount) / Number(loan.amount)) * 100 : 0;
                          return (
                            <TableRow
                              key={loan.id}
                              className={`border-b border-border transition-colors ${idx % 2 === 0 ? "bg-background" : "bg-muted/20"} hover:bg-primary/5`}
                              data-testid={`row-loan-${loan.id}`}
                            >
                              <TableCell className="text-center text-[13px] font-medium text-muted-foreground py-2.5">{serialNo}</TableCell>
                              <TableCell className="py-2.5">
                                <div>
                                  <p className="text-[13px] font-semibold leading-tight" data-testid={`text-emp-name-${loan.id}`}>{loan.employeeName || "Unknown"}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{loan.empCode} &middot; {loan.department}</p>
                                </div>
                              </TableCell>
                              <TableCell className="py-2.5">
                                <Badge variant="secondary" className={`no-default-active-elevate text-[10px] font-semibold border-0 ${loan.type === "loan" ? "bg-violet-500 text-white" : "bg-blue-500 text-white"}`} data-testid={`badge-type-${loan.id}`}>
                                  {loan.type === "loan" ? "Loan" : "Advance"}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2.5 text-[13px] text-right font-semibold tabular-nums">Rs. {Number(loan.amount).toLocaleString()}</TableCell>
                              <TableCell className="py-2.5 text-[13px] text-right tabular-nums text-emerald-600 dark:text-emerald-400">Rs. {Number(loan.paidAmount).toLocaleString()}</TableCell>
                              <TableCell className="py-2.5 text-right">
                                <p className="text-[13px] font-semibold tabular-nums text-amber-600 dark:text-amber-400">Rs. {balance.toLocaleString()}</p>
                                <div className="mt-1">
                                  <Progress value={repaymentPct} className="h-1.5" />
                                </div>
                              </TableCell>
                              <TableCell className="py-2.5 text-[13px] tabular-nums">
                                {loan.repaymentType === "installment" && loan.installmentAmount
                                  ? `Rs. ${Number(loan.installmentAmount).toLocaleString()}`
                                  : <span className="text-muted-foreground text-[11px]">One-time</span>}
                              </TableCell>
                              <TableCell className="py-2.5 text-[13px]">{loan.issueDate}</TableCell>
                              <TableCell className="py-2.5">
                                <Badge variant="secondary" className={`no-default-active-elevate text-[10px] font-medium border-0 capitalize ${approvalBadge(loan.approvalStatus)}`} data-testid={`badge-approval-${loan.id}`}>
                                  {loan.approvalStatus}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2.5 text-center">
                                <Badge variant="secondary" className={`no-default-active-elevate text-[11px] font-semibold border-0 capitalize ${statusBadge(loan.status)}`} data-testid={`badge-status-${loan.id}`}>
                                  {loan.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2.5">
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="outline" size="sm" className="px-2 text-blue-600 dark:text-blue-400" onClick={() => setDetailLoan(loan)} data-testid={`button-view-${loan.id}`} title="View Details">
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="outline" size="sm" className="px-2 text-emerald-600 dark:text-emerald-400" onClick={() => openEdit(loan)} data-testid={`button-edit-${loan.id}`} title="Edit">
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="outline" size="sm" className="px-2 text-red-500" onClick={() => { if (confirm("Delete this record?")) deleteMutation.mutate(loan.id); }} data-testid={`button-delete-${loan.id}`} title="Delete">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <div className="text-[12px] text-muted-foreground">
                      Showing {Math.min((currentPage - 1) * pageSize + 1, filtered.length)} to {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} records
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]" disabled={currentPage === 1} onClick={() => setCurrentPage(1)} data-testid="button-first-page">First</Button>
                      <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} data-testid="button-prev-page">
                        <ChevronLeft className="h-3 w-3 mr-0.5" /> Prev
                      </Button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page: number;
                        if (totalPages <= 5) page = i + 1;
                        else if (currentPage <= 3) page = i + 1;
                        else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                        else page = currentPage - 2 + i;
                        return (
                          <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" className="px-2 min-w-[28px] text-[11px]" onClick={() => setCurrentPage(page)} data-testid={`button-page-${page}`}>
                            {page}
                          </Button>
                        );
                      })}
                      <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} data-testid="button-next-page">
                        Next <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)} data-testid="button-last-page">Last</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="enterprise-card">
              <CardContent className="pt-5 pb-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Summary by Type
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                        <ArrowUpRight className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Advances</p>
                        <p className="text-[10px] text-muted-foreground">{allLoans.filter(l => l.type === "advance").length} records</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold tabular-nums" data-testid="text-report-advances-total">
                      Rs. {allLoans.filter(l => l.type === "advance").reduce((s, l) => s + Number(l.amount), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-violet-500 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Loans</p>
                        <p className="text-[10px] text-muted-foreground">{allLoans.filter(l => l.type === "loan").length} records</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold tabular-nums" data-testid="text-report-loans-total">
                      Rs. {allLoans.filter(l => l.type === "loan").reduce((s, l) => s + Number(l.amount), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="enterprise-card">
              <CardContent className="pt-5 pb-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Status Overview
                </h3>
                <div className="space-y-2">
                  {["active", "pending", "completed", "overdue"].map(status => {
                    const count = allLoans.filter(l => l.status === status).length;
                    const total = allLoans.length || 1;
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <Badge variant="secondary" className={`no-default-active-elevate text-[10px] font-semibold border-0 capitalize w-[80px] justify-center ${statusBadge(status)}`}>{status}</Badge>
                        <div className="flex-1">
                          <Progress value={(count / total) * 100} className="h-2" />
                        </div>
                        <span className="text-xs font-semibold tabular-nums w-[30px] text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            <Card className="enterprise-card">
              <CardContent className="pt-5 pb-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Department-wise
                </h3>
                <div className="space-y-2">
                  {["engineering","support","sales","finance","admin","management","hr","it","operations"].map(dept => {
                    const deptLoans = allLoans.filter(l => l.department === dept);
                    if (deptLoans.length === 0) return null;
                    const totalAmt = deptLoans.reduce((s, l) => s + Number(l.amount), 0);
                    return (
                      <div key={dept} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                        <span className="text-xs font-medium capitalize">{dept}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-foreground">{deptLoans.length} loans</span>
                          <span className="text-xs font-semibold tabular-nums">Rs. {totalAmt.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                  {allLoans.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No data available</p>}
                </div>
              </CardContent>
            </Card>
            <Card className="enterprise-card">
              <CardContent className="pt-5 pb-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" /> Financial Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-xs text-muted-foreground">Total Issued</span>
                    <span className="text-sm font-bold tabular-nums" data-testid="text-report-total-issued">Rs. {allLoans.reduce((s, l) => s + Number(l.amount), 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-xs text-muted-foreground">Total Recovered</span>
                    <span className="text-sm font-bold tabular-nums text-emerald-600">Rs. {allLoans.reduce((s, l) => s + Number(l.paidAmount), 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-muted-foreground">Outstanding Balance</span>
                    <span className="text-sm font-bold tabular-nums text-amber-600">Rs. {totalOutstanding.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" data-testid="dialog-issue-loan">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4 text-primary" />
              {editingLoan ? "Edit Advance / Loan" : "Issue Advance / Loan"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Employee Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="employeeId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Employee *</FormLabel>
                      <Select value={String(field.value || "")} onValueChange={v => field.onChange(Number(v))}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-[13px]" data-testid="select-employee">
                            <SelectValue placeholder="Select Employee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(employees || []).filter(e => e.status === "active").map(e => (
                            <SelectItem key={e.id} value={String(e.id)}>{e.fullName} ({e.empCode})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {selectedEmployee && (
                    <div className="flex flex-col justify-end text-xs space-y-1 p-2 bg-background rounded border border-border">
                      <p><span className="text-muted-foreground">Department:</span> <span className="font-medium capitalize">{selectedEmployee.department}</span></p>
                      <p><span className="text-muted-foreground">Designation:</span> <span className="font-medium">{selectedEmployee.designation}</span></p>
                      <p><span className="text-muted-foreground">Salary:</span> <span className="font-medium">Rs. {selectedEmployee.salary ? Number(selectedEmployee.salary).toLocaleString() : "--"}</span></p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Loan / Advance Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Type *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-[13px]" data-testid="select-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="advance">Salary Advance</SelectItem>
                          <SelectItem value="loan">Employee Loan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Amount (Rs.) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" className="h-9 text-[13px]" placeholder="50000" data-testid="input-amount" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="issueDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Issue Date *</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-9 text-[13px]" data-testid="input-issue-date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField control={form.control} name="reason" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Reason / Notes</FormLabel>
                      <FormControl>
                        <Textarea className="text-[13px] resize-none" rows={2} placeholder="Reason for advance/loan..." data-testid="input-reason" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="repaymentType" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Repayment Type *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-[13px]" data-testid="select-repayment-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="one_time">One-Time Deduction</SelectItem>
                          <SelectItem value="installment">Installment Based</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                {repaymentType === "installment" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                    <FormField control={form.control} name="installments" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">No. of Installments</FormLabel>
                        <FormControl>
                          <Input type="number" min={2} max={60} className="h-9 text-[13px]" data-testid="input-installments" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="installmentStartMonth" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Start Month</FormLabel>
                        <FormControl>
                          <Input type="month" className="h-9 text-[13px]" data-testid="input-start-month" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="flex flex-col justify-end">
                      <p className="text-[10px] text-muted-foreground mb-1">Calculated EMI</p>
                      <div className="h-9 rounded-md border border-border bg-background flex items-center px-3">
                        <span className="text-[13px] font-semibold text-primary tabular-nums" data-testid="text-calculated-emi">Rs. {Number(calculatedEMI).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Approval</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="requestedBy" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Requested By</FormLabel>
                      <FormControl>
                        <Input className="h-9 text-[13px]" placeholder="Name" data-testid="input-requested-by" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="approvedBy" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Approved By</FormLabel>
                      <FormControl>
                        <Input className="h-9 text-[13px]" placeholder="Admin / HR Manager" data-testid="input-approved-by" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="approvalStatus" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Approval Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-[13px]" data-testid="select-approval-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Loan Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-9 text-[13px]" data-testid="select-loan-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Additional Notes</FormLabel>
                      <FormControl>
                        <Input className="h-9 text-[13px]" placeholder="Optional notes..." data-testid="input-notes" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog} data-testid="button-cancel">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingLoan ? "Update" : "Submit"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailLoan} onOpenChange={open => { if (!open) setDetailLoan(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" data-testid="dialog-loan-detail">
          {detailLoan && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  Loan Detail — {detailLoan.employeeName}
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Amount</p>
                  <p className="text-lg font-bold mt-1 tabular-nums" data-testid="text-detail-total">Rs. {Number(detailLoan.amount).toLocaleString()}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 border border-emerald-200 dark:border-emerald-900 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Paid</p>
                  <p className="text-lg font-bold mt-1 tabular-nums text-emerald-600 dark:text-emerald-400" data-testid="text-detail-paid">Rs. {Number(detailLoan.paidAmount).toLocaleString()}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 border border-amber-200 dark:border-amber-900 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Remaining</p>
                  <p className="text-lg font-bold mt-1 tabular-nums text-amber-600 dark:text-amber-400" data-testid="text-detail-remaining">Rs. {(Number(detailLoan.amount) - Number(detailLoan.paidAmount)).toLocaleString()}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 border border-border text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Installments</p>
                  <p className="text-lg font-bold mt-1">{detailLoan.installments || 1}</p>
                </div>
              </div>

              <div className="mt-1">
                <Progress
                  value={Number(detailLoan.amount) > 0 ? (Number(detailLoan.paidAmount) / Number(detailLoan.amount)) * 100 : 0}
                  className="h-2"
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">
                  {Number(detailLoan.amount) > 0 ? ((Number(detailLoan.paidAmount) / Number(detailLoan.amount)) * 100).toFixed(1) : 0}% repaid
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2 text-xs border border-border rounded-lg p-4 bg-muted/20">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Employee</span>
                  <span className="font-medium">{detailLoan.employeeName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Emp Code</span>
                  <span className="font-mono font-medium">{detailLoan.empCode}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium capitalize">{detailLoan.department}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="secondary" className={`no-default-active-elevate text-[10px] font-semibold border-0 ${detailLoan.type === "loan" ? "bg-violet-500 text-white" : "bg-blue-500 text-white"}`}>
                    {detailLoan.type === "loan" ? "Loan" : "Advance"}
                  </Badge>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Issue Date</span>
                  <span className="font-medium">{detailLoan.issueDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Repayment</span>
                  <span className="font-medium capitalize">{detailLoan.repaymentType?.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Approval</span>
                  <Badge variant="secondary" className={`no-default-active-elevate text-[10px] font-medium border-0 capitalize ${approvalBadge(detailLoan.approvalStatus)}`}>{detailLoan.approvalStatus}</Badge>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="secondary" className={`no-default-active-elevate text-[10px] font-semibold border-0 capitalize ${statusBadge(detailLoan.status)}`}>{detailLoan.status}</Badge>
                </div>
                {detailLoan.reason && (
                  <div className="col-span-2 flex justify-between py-1">
                    <span className="text-muted-foreground">Reason</span>
                    <span className="font-medium text-right max-w-[60%]">{detailLoan.reason}</span>
                  </div>
                )}
              </div>

              {detailLoan.repaymentType === "installment" && installments && installments.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Installment Schedule</h4>
                  <div className="overflow-x-auto border border-border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-800 hover:to-slate-700">
                          <TableHead className="text-white font-semibold text-[11px] uppercase py-2 w-[60px] text-center">#</TableHead>
                          <TableHead className="text-white font-semibold text-[11px] uppercase py-2">Due Date</TableHead>
                          <TableHead className="text-white font-semibold text-[11px] uppercase py-2 text-right">Amount</TableHead>
                          <TableHead className="text-white font-semibold text-[11px] uppercase py-2">Paid Date</TableHead>
                          <TableHead className="text-white font-semibold text-[11px] uppercase py-2 text-center">Status</TableHead>
                          <TableHead className="text-white font-semibold text-[11px] uppercase py-2 text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {installments.map((inst) => (
                          <TableRow key={inst.id} className="border-b border-border hover:bg-muted/30" data-testid={`row-installment-${inst.id}`}>
                            <TableCell className="text-center text-xs font-medium py-2">{inst.installmentNo}</TableCell>
                            <TableCell className="text-xs py-2">{inst.dueDate}</TableCell>
                            <TableCell className="text-xs py-2 text-right font-semibold tabular-nums">Rs. {Number(inst.amount).toLocaleString()}</TableCell>
                            <TableCell className="text-xs py-2">{inst.paidDate || <span className="text-muted-foreground">--</span>}</TableCell>
                            <TableCell className="text-center py-2">
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] font-semibold border-0 capitalize ${inst.status === "paid" ? "bg-emerald-500 text-white" : inst.status === "overdue" ? "bg-red-500 text-white" : "bg-amber-500 text-white"}`}>
                                {inst.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center py-2">
                              {inst.status !== "paid" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-[10px] px-2 text-emerald-600"
                                  onClick={() => markPaidMutation.mutate(inst.id)}
                                  disabled={markPaidMutation.isPending}
                                  data-testid={`button-mark-paid-${inst.id}`}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" /> Mark Paid
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
