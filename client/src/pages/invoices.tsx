import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Eye,
  Printer,
  Download,
  ArrowLeft,
  XCircle,
  Package,
  FileSpreadsheet,
  Mail,
  MessageSquare,
  Users,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Send,
  Receipt,
  DollarSign,
  CreditCard,
  TrendingUp,
  Wallet,
  Calendar,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTab } from "@/hooks/use-tab";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Invoice, type Customer, type Package as PkgType, type InvoiceItem, type CompanySettings } from "@shared/schema";

type InvoiceWithCustomer = Invoice & {
  customerName?: string;
  customerCode?: string;
  customerPhone?: string;
  customerArea?: string;
  customerZone?: string;
  customerType?: string;
  connectionType?: string;
  packageName?: string;
  packageSpeed?: string;
  customerServer?: string;
  customerUsernameIp?: string;
  customerExpireDate?: string;
  customerMonthlyBill?: string;
  customerBillingStatus?: string;
  customerStatus?: string;
};

interface LineItem {
  id?: number;
  itemType: string;
  description: string;
  quantity: number;
  unitPrice: string;
  discount: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  packageId?: number | null;
}

const emptyLineItem = (): LineItem => ({
  itemType: "service",
  description: "",
  quantity: 1,
  unitPrice: "0",
  discount: "0",
  taxRate: "0",
  taxAmount: "0",
  total: "0",
});

function calcLineItem(item: LineItem): LineItem {
  const qty = item.quantity || 1;
  const price = parseFloat(item.unitPrice || "0");
  const discount = parseFloat(item.discount || "0");
  const taxRate = parseFloat(item.taxRate || "0");
  const subtotal = qty * price - discount;
  const taxAmt = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmt;
  return { ...item, taxAmount: taxAmt.toFixed(2), total: total.toFixed(2) };
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  paid: { icon: CheckCircle, color: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950", label: "Paid" },
  pending: { icon: Clock, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950", label: "Pending" },
  overdue: { icon: AlertTriangle, color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950", label: "Overdue" },
  cancelled: { icon: Trash2, color: "text-gray-500 bg-gray-50 dark:bg-gray-900", label: "Cancelled" },
};

export default function InvoicesPage() {
  const { toast } = useToast();
  const [tab, changeTab] = useTab("list");
  const [viewingInvoiceId, setViewingInvoiceId] = useState<number | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);

  const { data: invoices, isLoading } = useQuery<InvoiceWithCustomer[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: packages } = useQuery<PkgType[]>({
    queryKey: ["/api/packages"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Invoice deleted successfully" });
    },
  });

  const markPaid = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/invoices/${id}`, {
        status: "paid",
        paidDate: new Date().toISOString().split("T")[0],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Invoice marked as paid" });
    },
  });

  if (viewingInvoiceId) {
    return (
      <InvoiceViewPage
        invoiceId={viewingInvoiceId}
        onBack={() => setViewingInvoiceId(null)}
        onEdit={(id) => { setViewingInvoiceId(null); setEditingInvoiceId(id); }}
      />
    );
  }

  if (tab === "add" || editingInvoiceId) {
    return (
      <InvoiceFormPage
        invoiceId={editingInvoiceId}
        customers={customers || []}
        packages={packages || []}
        onCancel={() => { changeTab("list"); setEditingInvoiceId(null); }}
        onSuccess={(id) => { setEditingInvoiceId(null); setViewingInvoiceId(id); }}
      />
    );
  }

  return (
    <InvoiceListPage
      invoices={invoices || []}
      isLoading={isLoading}
      tab={tab}
      changeTab={changeTab}
      onView={(id) => setViewingInvoiceId(id)}
      onEdit={(id) => setEditingInvoiceId(id)}
      onDelete={(id) => deleteMutation.mutate(id)}
      onMarkPaid={(id) => markPaid.mutate(id)}
    />
  );
}

function InvoiceListPage({
  invoices,
  isLoading,
  tab,
  changeTab,
  onView,
  onEdit,
  onDelete,
  onMarkPaid,
}: {
  invoices: InvoiceWithCustomer[];
  isLoading: boolean;
  tab: string;
  changeTab: (t: string) => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onMarkPaid: (id: number) => void;
}) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientTab, setClientTab] = useState("all");
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.customerCode || "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.customerPhone || "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.customerUsernameIp || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    let matchClientTab = true;
    const cType = (inv.customerType || "home").toLowerCase();
    if (clientTab === "customers") {
      matchClientTab = cType === "home";
    } else if (clientTab === "cir") {
      matchClientTab = cType === "cir";
    } else if (clientTab === "corporate") {
      matchClientTab = cType === "corporate";
    } else if (clientTab === "reseller") {
      matchClientTab = cType === "reseller";
    }
    return matchSearch && matchStatus && matchClientTab;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    let aVal: any, bVal: any;
    switch (sortField) {
      case "code": aVal = a.customerCode || ""; bVal = b.customerCode || ""; break;
      case "name": aVal = a.customerName || ""; bVal = b.customerName || ""; break;
      case "zone": aVal = a.customerZone || ""; bVal = b.customerZone || ""; break;
      case "amount": aVal = Number(a.totalAmount); bVal = Number(b.totalAmount); break;
      case "expiry": aVal = a.customerExpireDate || ""; bVal = b.customerExpireDate || ""; break;
      case "dueDate": aVal = a.dueDate || ""; bVal = b.dueDate || ""; break;
      default: return 0;
    }
    if (typeof aVal === "number") return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    return sortDir === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / entriesPerPage));
  const paginated = sorted.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const tabFilteredInvoices = invoices.filter((inv) => {
    const cType = (inv.customerType || "home").toLowerCase();
    if (clientTab === "customers") return cType === "home";
    if (clientTab === "cir") return cType === "cir";
    if (clientTab === "corporate") return cType === "corporate";
    if (clientTab === "reseller") return cType === "reseller";
    return true;
  });
  const allInvoices = tabFilteredInvoices;
  const paidInvoices = allInvoices.filter((inv) => inv.status === "paid");
  const unpaidInvoices = allInvoices.filter((inv) => inv.status !== "paid" && inv.status !== "cancelled");
  const overdueInvoices = allInvoices.filter((inv) => inv.status === "overdue");
  const totalCollected = paidInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const totalDue = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const totalGenerated = allInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const totalAdvance = paidInvoices.reduce((sum, inv) => {
    const paid = Number(inv.totalAmount);
    const monthly = Number(inv.customerMonthlyBill || inv.amount || 0);
    return sum + Math.max(0, paid - monthly);
  }, 0);
  const monthlyBillTotal = allInvoices.reduce((sum, inv) => sum + Number(inv.customerMonthlyBill || inv.totalAmount || 0), 0);
  const tabLabel = clientTab === "customers" ? "Customer" : clientTab === "cir" ? "CIR" : clientTab === "corporate" ? "Corporate" : clientTab === "reseller" ? "Reseller" : "All";

  const selectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(inv => inv.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const exportCSV = () => {
    const headers = ["C.Code", "ID/IP", "Customer Name", "Mobile", "Zone", "Type", "Conn. Type", "Package", "Speed", "Expire Date", "M.Bill", "Received", "VAT", "Balance Due", "Advance", "Payment Date", "Server", "B.Status"];
    const rows = filtered.map(inv => {
      const received = inv.status === "paid" ? Number(inv.totalAmount) : 0;
      const balanceDue = inv.status !== "paid" ? Number(inv.totalAmount) : 0;
      const advance = inv.status === "paid" ? Math.max(0, Number(inv.totalAmount) - Number(inv.customerMonthlyBill || inv.amount || 0)) : 0;
      return [
        inv.customerCode || "",
        inv.customerUsernameIp || "",
        inv.customerName || "",
        inv.customerPhone || "",
        inv.customerZone || "",
        inv.customerType || "",
        inv.connectionType || "",
        inv.packageName || "",
        inv.packageSpeed || "",
        inv.customerExpireDate || "",
        Number(inv.customerMonthlyBill || inv.totalAmount || 0).toFixed(2),
        received.toFixed(2),
        Number(inv.tax || 0).toFixed(2),
        balanceDue.toFixed(2),
        advance.toFixed(2),
        inv.paidDate || "",
        inv.customerServer || "",
        inv.status,
      ];
    });
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `billing-list-${clientTab}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported successfully" });
  };

  if (tab === "types") {
    const regularCount = invoices.filter((inv) => !inv.isRecurring && inv.status !== "overdue").length;
    const recurringCount = invoices.filter((inv) => inv.isRecurring).length;
    const serviceCount = invoices.filter((inv) => inv.serviceType && inv.serviceType !== "internet").length;
    const overdueCount = invoices.filter((inv) => inv.status === "overdue").length;
    const creditNoteCount = invoices.filter((inv) => inv.status === "cancelled").length;

    const invoiceTypes = [
      { name: "Regular", description: "Standard one-time invoices", count: regularCount, icon: FileText, color: "text-blue-600 dark:text-blue-400" },
      { name: "Recurring", description: "Auto-generated recurring invoices", count: recurringCount, icon: RefreshCw, color: "text-purple-600 dark:text-purple-400" },
      { name: "Service", description: "Service-specific invoices", count: serviceCount, icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
      { name: "Overdue", description: "Past due date invoices", count: overdueCount, icon: AlertTriangle, color: "text-red-600 dark:text-red-400" },
      { name: "Credit Note", description: "Cancelled or credited invoices", count: creditNoteCount, icon: Trash2, color: "text-gray-600 dark:text-gray-400" },
    ];

    return (
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-invoices-title">Invoices</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage billing and invoices</p>
          </div>
          <Button onClick={() => changeTab("add")} data-testid="button-add-invoice">
            <Plus className="h-4 w-4 mr-1" />
            Create Invoice
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoiceTypes.map((type) => {
            const TypeIcon = type.icon;
            return (
              <Card key={type.name} data-testid={`card-invoice-type-${type.name.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{type.name}</CardTitle>
                    <CardDescription className="text-xs">{type.description}</CardDescription>
                  </div>
                  <TypeIcon className={`h-5 w-5 ${type.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid={`text-type-count-${type.name.toLowerCase().replace(/\s+/g, "-")}`}>
                    {type.count}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">invoices</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (tab === "allocation") {
    const totalPending = invoices.filter(i => i.status === "pending").reduce((s, i) => s + Number(i.totalAmount), 0);
    const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + Number(i.totalAmount), 0);

    return (
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Collection Allocation</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Invoice allocation across payment collections</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card data-testid="card-allocation-collected">
            <CardHeader className="pb-2">
              <CardDescription>Total Collected</CardDescription>
              <CardTitle className="text-xl text-green-600 dark:text-green-400" data-testid="text-total-collected">
                Rs. {invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.totalAmount), 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{invoices.filter(i => i.status === "paid").length} paid invoices</p>
            </CardContent>
          </Card>
          <Card data-testid="card-allocation-pending">
            <CardHeader className="pb-2">
              <CardDescription>Pending Collection</CardDescription>
              <CardTitle className="text-xl text-amber-600 dark:text-amber-400" data-testid="text-total-pending">
                Rs. {totalPending.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{invoices.filter(i => i.status === "pending").length} pending invoices</p>
            </CardContent>
          </Card>
          <Card data-testid="card-allocation-overdue">
            <CardHeader className="pb-2">
              <CardDescription>Overdue Amount</CardDescription>
              <CardTitle className="text-xl text-red-600 dark:text-red-400" data-testid="text-total-overdue">
                Rs. {totalOverdue.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{invoices.filter(i => i.status === "overdue").length} overdue invoices</p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Collection Allocation Summary</CardTitle>
            <CardDescription>Invoice allocation across payment collections and accounts</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-5 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium">No allocation data</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Collection Account</TableHead>
                      <TableHead>Allocated Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => {
                      const config = statusConfig[inv.status] || statusConfig.pending;
                      const StatusIcon = config.icon;
                      const collectionAccount = inv.status === "paid" ? "Main Collection" : inv.status === "overdue" ? "Recovery Pool" : "Pending Pool";
                      const allocatedDate = inv.status === "paid" ? inv.paidDate || "-" : "-";
                      return (
                        <TableRow key={inv.id} data-testid={`row-allocation-${inv.id}`}>
                          <TableCell className="font-mono text-xs">{inv.invoiceNumber}</TableCell>
                          <TableCell className="font-medium">{inv.customerName || `#${inv.customerId}`}</TableCell>
                          <TableCell className="font-semibold">Rs. {Number(inv.totalAmount).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${config.color}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{collectionAccount}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{allocatedDate}</TableCell>
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
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-billing-list-title">
            Billing List
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {tabLabel} Billing List — {allInvoices.length} invoices
          </p>
        </div>
        <Button onClick={() => changeTab("add")} data-testid="button-add-invoice">
          <Plus className="h-4 w-4 mr-1" />
          Create Invoice
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" data-testid="toolbar-bulk-actions">
        <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600" onClick={exportCSV} data-testid="button-generate-excel">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Generate Excel
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-red-600 text-white hover:bg-red-700 border-red-600" onClick={exportCSV} data-testid="button-generate-pdf">
          <FileText className="h-3.5 w-3.5" />
          Generate PDF
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" data-testid="button-sync-clients">
          <RefreshCw className="h-3.5 w-3.5" />
          Sync Clients & Servers
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" data-testid="button-bulk-status-change">
          <ArrowUpDown className="h-3.5 w-3.5" />
          Bulk Status Change
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" data-testid="button-bulk-zone-change">
          <ArrowUpDown className="h-3.5 w-3.5" />
          Bulk Zone Change
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" data-testid="button-enable-selected">
          <UserCheck className="h-3.5 w-3.5" />
          Enable Selected
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-blue-600 text-white hover:bg-blue-700 border-blue-600" data-testid="button-download-invoice">
          <Download className="h-3.5 w-3.5" />
          Download Invoice
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-pink-600 text-white hover:bg-pink-700 border-pink-600" data-testid="button-sms-selected">
          <MessageSquare className="h-3.5 w-3.5" />
          SMS Selected
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600" data-testid="button-email-selected">
          <Mail className="h-3.5 w-3.5" />
          Email Selected
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" data-testid="button-assign-employee">
          <Users className="h-3.5 w-3.5" />
          Assign To Employee
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" data-testid="button-bulk-billing-extend">
          <Calendar className="h-3.5 w-3.5" />
          Bulk Billing Date Extend
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" data-testid="button-bulk-profile-change">
          <ArrowUpDown className="h-3.5 w-3.5" />
          Bulk Profile Change
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" data-testid="button-disable-selected">
          <XCircle className="h-3.5 w-3.5" />
          Disable Selected
        </Button>
      </div>

      <Tabs value={clientTab} onValueChange={(v) => { setClientTab(v); setCurrentPage(1); setSelectedIds(new Set()); }} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="all" data-testid="tab-all">
            All ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">
            Customers ({invoices.filter(i => (i.customerType || "home").toLowerCase() === "home").length})
          </TabsTrigger>
          <TabsTrigger value="cir" data-testid="tab-cir">
            CIR ({invoices.filter(i => (i.customerType || "").toLowerCase() === "cir").length})
          </TabsTrigger>
          <TabsTrigger value="corporate" data-testid="tab-corporate">
            Corporate ({invoices.filter(i => (i.customerType || "").toLowerCase() === "corporate").length})
          </TabsTrigger>
          <TabsTrigger value="reseller" data-testid="tab-reseller">
            Reseller ({invoices.filter(i => (i.customerType || "").toLowerCase() === "reseller").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3" data-testid="summary-cards">
        <Card className="bg-emerald-600 text-white border-0" data-testid="card-paid-clients">
          <CardContent className="p-3">
            <div className="text-xs font-medium opacity-90">Paid {tabLabel}</div>
            <div className="text-xl font-bold mt-0.5">{paidInvoices.length}</div>
            <div className="text-[10px] opacity-75 mt-1">{tabLabel} paid invoices</div>
          </CardContent>
        </Card>
        <Card className="bg-sky-600 text-white border-0" data-testid="card-unpaid-clients">
          <CardContent className="p-3">
            <div className="text-xs font-medium opacity-90">Unpaid {tabLabel}</div>
            <div className="text-xl font-bold mt-0.5">{unpaidInvoices.length}</div>
            <div className="text-[10px] opacity-75 mt-1">{tabLabel} unpaid invoices</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500 text-white border-0" data-testid="card-received-bill">
          <CardContent className="p-3">
            <div className="text-xs font-medium opacity-90">Received</div>
            <div className="text-xl font-bold mt-0.5">{totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="text-[10px] opacity-75 mt-1">{tabLabel} received amount</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-700 text-white border-0" data-testid="card-due-amount">
          <CardContent className="p-3">
            <div className="text-xs font-medium opacity-90">Due Amount</div>
            <div className="text-xl font-bold mt-0.5">{totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="text-[10px] opacity-75 mt-1">{tabLabel} due amount</div>
          </CardContent>
        </Card>
        <Card className="bg-teal-600 text-white border-0" data-testid="card-generated-bill">
          <CardContent className="p-3">
            <div className="text-xs font-medium opacity-90">Generated</div>
            <div className="text-xl font-bold mt-0.5">{allInvoices.length}</div>
            <div className="text-[10px] opacity-75 mt-1">{tabLabel} generated bills</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500 text-white border-0" data-testid="card-advance-amount">
          <CardContent className="p-3">
            <div className="text-xs font-medium opacity-90">Advance</div>
            <div className="text-xl font-bold mt-0.5">{totalAdvance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="text-[10px] opacity-75 mt-1">{tabLabel} advance amount</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-600 text-white border-0" data-testid="card-monthly-bill">
          <CardContent className="p-3">
            <div className="text-xs font-medium opacity-90">Monthly Bill</div>
            <div className="text-xl font-bold mt-0.5">{monthlyBillTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="text-[10px] opacity-75 mt-1">{tabLabel} monthly total</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Show</span>
              <Select value={String(entriesPerPage)} onValueChange={(v) => { setEntriesPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[80px] h-8" data-testid="select-entries-per-page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground whitespace-nowrap">entries</span>

              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[130px] h-8 ml-2" data-testid="select-invoice-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, phone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-9 h-8 text-xs"
                data-testid="input-search-invoices"
              />
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-blue-50 dark:bg-blue-950/50 rounded text-xs">
              <span className="font-medium">{selectedIds.size} selected</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSelectedIds(new Set())}>
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3 p-5">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No billing records found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800 dark:bg-slate-900 hover:bg-slate-800 dark:hover:bg-slate-900">
                    <TableHead className="text-white text-[10px] uppercase tracking-wider w-8">
                      <Checkbox
                        checked={selectedIds.size === paginated.length && paginated.length > 0}
                        onCheckedChange={selectAll}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider cursor-pointer whitespace-nowrap" onClick={() => handleSort("code")}>
                      C.Code {sortField === "code" && (sortDir === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">ID/IP</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider cursor-pointer whitespace-nowrap" onClick={() => handleSort("name")}>
                      Cus. Name {sortField === "name" && (sortDir === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">Mobile</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider cursor-pointer whitespace-nowrap" onClick={() => handleSort("zone")}>
                      Zone {sortField === "zone" && (sortDir === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">Cus. Type</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">Conn. Type</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">Package</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">Speed</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider cursor-pointer whitespace-nowrap" onClick={() => handleSort("expiry")}>
                      Ex.Date {sortField === "expiry" && (sortDir === "asc" ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider text-right whitespace-nowrap">M.Bill</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider text-right whitespace-nowrap">Received</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider text-right whitespace-nowrap">VAT</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider text-right whitespace-nowrap">BalanceDue</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider text-right whitespace-nowrap">Advance</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">PaymentDate</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">Server</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">M.Status</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">B.Status</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((inv, idx) => {
                    const config = statusConfig[inv.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    const received = inv.status === "paid" ? Number(inv.totalAmount) : 0;
                    const balanceDue = inv.status !== "paid" ? Number(inv.totalAmount) : 0;
                    const advance = inv.status === "paid" ? Math.max(0, Number(inv.totalAmount) - Number(inv.customerMonthlyBill || inv.amount || 0)) : 0;
                    const isActive = inv.customerBillingStatus === "Active" || inv.customerStatus === "active";

                    return (
                      <TableRow
                        key={inv.id}
                        className={`text-xs ${idx % 2 === 0 ? "" : "bg-muted/30"} ${selectedIds.has(inv.id) ? "bg-blue-50 dark:bg-blue-950/30" : ""}`}
                        data-testid={`row-invoice-${inv.id}`}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(inv.id)}
                            onCheckedChange={() => toggleSelect(inv.id)}
                            data-testid={`checkbox-invoice-${inv.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-[11px] font-medium whitespace-nowrap">{inv.customerCode || "-"}</TableCell>
                        <TableCell className="text-[11px] whitespace-nowrap">{inv.customerUsernameIp || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <button
                            onClick={() => onView(inv.id)}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-[11px] text-left"
                            data-testid={`link-customer-${inv.id}`}
                          >
                            {inv.customerName || `Customer #${inv.customerId}`}
                          </button>
                        </TableCell>
                        <TableCell className="text-[11px] whitespace-nowrap">{inv.customerPhone || "-"}</TableCell>
                        <TableCell className="text-[11px] whitespace-nowrap">{inv.customerZone || "-"}</TableCell>
                        <TableCell className="text-[11px] capitalize whitespace-nowrap">{inv.customerType || "Home"}</TableCell>
                        <TableCell className="text-[11px] capitalize whitespace-nowrap">{inv.connectionType || "-"}</TableCell>
                        <TableCell className="text-[11px] whitespace-nowrap">{inv.packageName || "-"}</TableCell>
                        <TableCell className="text-[11px] whitespace-nowrap">{inv.packageSpeed || "-"}</TableCell>
                        <TableCell className="text-[11px] whitespace-nowrap">
                          {inv.customerExpireDate ? (
                            <span className={new Date(inv.customerExpireDate) < new Date() ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                              {inv.customerExpireDate}
                            </span>
                          ) : inv.dueDate}
                        </TableCell>
                        <TableCell className="text-right text-[11px] font-medium whitespace-nowrap">
                          {Number(inv.customerMonthlyBill || inv.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-[11px] whitespace-nowrap">
                          {received.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-[11px] whitespace-nowrap">
                          {Number(inv.tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-[11px] font-medium whitespace-nowrap">
                          {balanceDue > 0 ? (
                            <span className="text-red-600 dark:text-red-400">{balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          ) : (
                            "0.00"
                          )}
                        </TableCell>
                        <TableCell className="text-right text-[11px] whitespace-nowrap">
                          {advance > 0 ? advance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
                        </TableCell>
                        <TableCell className="text-[11px] whitespace-nowrap">{inv.paidDate || "-"}</TableCell>
                        <TableCell className="text-[11px] whitespace-nowrap">
                          {inv.customerServer ? (
                            <Badge variant="secondary" className="text-[9px] font-medium no-default-active-elevate">{inv.customerServer}</Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${isActive ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
                            data-testid={`toggle-status-${inv.id}`}
                          >
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${isActive ? "left-4" : "left-0.5"}`} />
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant="secondary"
                            className={`no-default-active-elevate text-[9px] capitalize ${config.color}`}
                            data-testid={`badge-status-${inv.id}`}
                          >
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()} className="whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-actions-${inv.id}`}>
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => onView(inv.id)} data-testid={`button-view-invoice-${inv.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEdit(inv.id)} data-testid={`button-edit-invoice-${inv.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem data-testid={`button-print-invoice-${inv.id}`}>
                                <Printer className="h-4 w-4 mr-2" />
                                Print Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem data-testid={`button-download-pdf-${inv.id}`}>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/invoices?view=${inv.id}`);
                                toast({ title: "Invoice link copied to clipboard" });
                              }} data-testid={`button-copy-link-${inv.id}`}>
                                <Receipt className="h-4 w-4 mr-2" />
                                Copy Invoice Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem data-testid={`button-send-sms-${inv.id}`}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Send SMS
                              </DropdownMenuItem>
                              <DropdownMenuItem data-testid={`button-send-email-${inv.id}`}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem data-testid={`button-send-whatsapp-${inv.id}`}>
                                <Send className="h-4 w-4 mr-2" />
                                Send WhatsApp
                              </DropdownMenuItem>
                              {inv.status !== "paid" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => onMarkPaid(inv.id)} data-testid={`button-mark-paid-${inv.id}`}>
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                    Mark as Paid
                                  </DropdownMenuItem>
                                </>
                              )}
                              {inv.status === "pending" && (
                                <DropdownMenuItem onClick={() => {
                                  apiRequest("PATCH", `/api/invoices/${inv.id}`, { status: "overdue" }).then(() => {
                                    queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
                                    toast({ title: "Invoice marked as overdue" });
                                  });
                                }} data-testid={`button-mark-overdue-${inv.id}`}>
                                  <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                                  Mark as Overdue
                                </DropdownMenuItem>
                              )}
                              {inv.status !== "cancelled" && (
                                <DropdownMenuItem onClick={() => {
                                  apiRequest("PATCH", `/api/invoices/${inv.id}`, { status: "cancelled" }).then(() => {
                                    queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
                                    toast({ title: "Invoice cancelled" });
                                  });
                                }} data-testid={`button-cancel-invoice-${inv.id}`}>
                                  <XCircle className="h-4 w-4 mr-2 text-gray-500" />
                                  Cancel Invoice
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(inv.id)} data-testid={`button-delete-invoice-${inv.id}`}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
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

          {filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3 pt-3 border-t">
              <div className="text-xs text-muted-foreground">
                Showing {((currentPage - 1) * entriesPerPage) + 1} to {Math.min(currentPage * entriesPerPage, sorted.length)} of {sorted.length} entries
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} data-testid="button-prev-page">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="h-7 w-7 p-0 text-xs"
                      onClick={() => setCurrentPage(pageNum)}
                      data-testid={`button-page-${pageNum}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} data-testid="button-next-page">
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InvoiceFormPage({
  invoiceId,
  customers,
  packages,
  onCancel,
  onSuccess,
}: {
  invoiceId: number | null;
  customers: Customer[];
  packages: PkgType[];
  onCancel: () => void;
  onSuccess: (id: number) => void;
}) {
  const { toast } = useToast();
  const isEdit = !!invoiceId;

  const { data: existingData, isLoading: loadingExisting } = useQuery<{
    invoice: Invoice;
    items: InvoiceItem[];
    customer: Customer;
    company: CompanySettings | null;
  }>({
    queryKey: ["/api/invoices", invoiceId, "full"],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${invoiceId}/full`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load invoice");
      return res.json();
    },
    enabled: isEdit,
  });

  const [customerId, setCustomerId] = useState<number>(0);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("pending");
  const [description, setDescription] = useState("");
  const [serviceType, setServiceType] = useState("internet");
  const [isRecurring, setIsRecurring] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLineItem()]);
  const [initialized, setInitialized] = useState(false);

  if (isEdit && existingData && !initialized) {
    setCustomerId(existingData.invoice.customerId);
    setCustomerSearch(existingData.customer?.fullName || "");
    setIssueDate(existingData.invoice.issueDate);
    setDueDate(existingData.invoice.dueDate);
    setStatus(existingData.invoice.status);
    setDescription(existingData.invoice.description || "");
    setServiceType(existingData.invoice.serviceType || "internet");
    setIsRecurring(existingData.invoice.isRecurring);
    if (existingData.items.length > 0) {
      setLineItems(existingData.items.map(item => ({
        id: item.id,
        itemType: item.itemType,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || "0",
        taxRate: item.taxRate || "0",
        taxAmount: item.taxAmount || "0",
        total: item.total,
        packageId: item.packageId,
      })));
    }
    setInitialized(true);
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.customerId.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  const selectCustomer = (c: Customer) => {
    setCustomerId(c.id);
    setCustomerSearch(c.fullName);
    setShowCustomerDropdown(false);
    if (c.packageId) {
      const pkg = packages.find((p) => p.id === c.packageId);
      if (pkg && lineItems.length === 1 && !lineItems[0].description) {
        setLineItems([
          calcLineItem({
            ...emptyLineItem(),
            itemType: "service",
            description: `${pkg.name} - ${pkg.serviceType} (${pkg.billingCycle})`,
            unitPrice: pkg.price,
            packageId: pkg.id,
          }),
        ]);
      }
    }
  };

  const addLineItem = () => setLineItems([...lineItems, emptyLineItem()]);
  const removeLineItem = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));
  const updateLineItem = (idx: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    (updated[idx] as any)[field] = value;
    updated[idx] = calcLineItem(updated[idx]);
    setLineItems(updated);
  };

  const addPackageAsItem = (pkg: PkgType) => {
    const newItem = calcLineItem({
      ...emptyLineItem(),
      itemType: "service",
      description: `${pkg.name} - ${pkg.serviceType} (${pkg.billingCycle})`,
      unitPrice: pkg.price,
      packageId: pkg.id,
    });
    setLineItems([...lineItems, newItem]);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + parseFloat(item.unitPrice || "0") * item.quantity, 0);
  const totalDiscount = lineItems.reduce((sum, item) => sum + parseFloat(item.discount || "0"), 0);
  const totalTax = lineItems.reduce((sum, item) => sum + parseFloat(item.taxAmount || "0"), 0);
  const grandTotal = lineItems.reduce((sum, item) => sum + parseFloat(item.total || "0"), 0);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) {
        const res = await apiRequest("PUT", `/api/invoices-with-items/${invoiceId}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/invoices-with-items", data);
        return res.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: isEdit ? "Invoice updated!" : "Invoice created!" });
      onSuccess(data.id || invoiceId!);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!customerId) {
      toast({ title: "Select a customer", variant: "destructive" });
      return;
    }
    if (!dueDate) {
      toast({ title: "Due date is required", variant: "destructive" });
      return;
    }
    const validItems = lineItems.filter((item) => item.description.trim() && parseFloat(item.total) > 0);
    if (validItems.length === 0) {
      toast({ title: "Add at least one line item", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      invoice: {
        customerId,
        invoiceNumber: isEdit ? undefined : `INV-${Date.now()}`,
        amount: subtotal.toFixed(2),
        tax: totalTax.toFixed(2),
        totalAmount: grandTotal.toFixed(2),
        status,
        dueDate,
        issueDate,
        description,
        serviceType,
        isRecurring,
      },
      items: validItems.map((item, idx) => ({
        ...item,
        sortOrder: idx,
      })),
    });
  };

  if (isEdit && loadingExisting) {
    return (
      <div className="p-6 max-w-[900px] mx-auto">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{isEdit ? "Edit Invoice" : "Create New Invoice"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Fill in the details below</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="Search customer by name, ID, or phone..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                    if (!e.target.value) setCustomerId(0);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  data-testid="input-search-customer"
                />
                {showCustomerDropdown && customerSearch && filteredCustomers.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredCustomers.slice(0, 10).map((c) => (
                      <button
                        key={c.id}
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between"
                        onClick={() => selectCustomer(c)}
                        data-testid={`select-customer-${c.id}`}
                      >
                        <span className="font-medium">{c.fullName}</span>
                        <span className="text-muted-foreground text-xs">{c.customerId} | {c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Line Items</CardTitle>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-add-package">
                      <Package className="h-4 w-4 mr-1" /> Add Package
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {packages.filter((p) => p.isActive).map((pkg) => (
                      <DropdownMenuItem key={pkg.id} onClick={() => addPackageAsItem(pkg)}>
                        {pkg.name} - Rs. {Number(pkg.price).toLocaleString()}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={addLineItem} data-testid="button-add-line-item">
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs w-16">Qty</TableHead>
                      <TableHead className="text-xs w-24">Unit Price</TableHead>
                      <TableHead className="text-xs w-20">Discount</TableHead>
                      <TableHead className="text-xs w-16">Tax %</TableHead>
                      <TableHead className="text-xs w-20">Tax Amt</TableHead>
                      <TableHead className="text-xs w-24 text-right">Total</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Select value={item.itemType} onValueChange={(v) => updateLineItem(idx, "itemType", v)}>
                            <SelectTrigger className="text-xs h-8 w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="service">Service</SelectItem>
                              <SelectItem value="product">Product</SelectItem>
                              <SelectItem value="fee">Fee</SelectItem>
                              <SelectItem value="installation">Installation</SelectItem>
                              <SelectItem value="equipment">Equipment</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input className="text-xs h-8" value={item.description} onChange={(e) => updateLineItem(idx, "description", e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <Input className="text-xs h-8 w-16" type="number" min="1" value={item.quantity} onChange={(e) => updateLineItem(idx, "quantity", parseInt(e.target.value) || 1)} />
                        </TableCell>
                        <TableCell>
                          <Input className="text-xs h-8 w-24" type="number" value={item.unitPrice} onChange={(e) => updateLineItem(idx, "unitPrice", e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <Input className="text-xs h-8 w-20" type="number" value={item.discount} onChange={(e) => updateLineItem(idx, "discount", e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <Input className="text-xs h-8 w-16" type="number" value={item.taxRate} onChange={(e) => updateLineItem(idx, "taxRate", e.target.value)} />
                        </TableCell>
                        <TableCell className="text-xs text-right">{item.taxAmount}</TableCell>
                        <TableCell className="text-xs text-right font-semibold">Rs. {Number(item.total).toLocaleString()}</TableCell>
                        <TableCell>
                          {lineItems.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeLineItem(idx)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium">Issue Date</label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} data-testid="input-issue-date" />
              </div>
              <div>
                <label className="text-xs font-medium">Due Date</label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} data-testid="input-due-date" />
              </div>
              <div>
                <label className="text-xs font-medium">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Service Type</label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger data-testid="select-service-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internet">Internet</SelectItem>
                    <SelectItem value="iptv">IPTV</SelectItem>
                    <SelectItem value="cable_tv">Cable TV</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isRecurring}
                  onCheckedChange={(v) => setIsRecurring(!!v)}
                  data-testid="checkbox-recurring"
                />
                <label className="text-xs">Recurring Invoice</label>
              </div>
              <div>
                <label className="text-xs font-medium">Notes</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional notes..."
                  className="text-xs"
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>Rs. {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="text-red-500">- Rs. {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tax:</span>
                <span>Rs. {totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Grand Total:</span>
                <span className="text-blue-600 dark:text-blue-400" data-testid="text-grand-total">Rs. {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              data-testid="button-submit-invoice"
            >
              {createMutation.isPending ? "Saving..." : isEdit ? "Update Invoice" : "Create Invoice"}
            </Button>
            <Button variant="outline" className="w-full" onClick={onCancel} data-testid="button-cancel-invoice">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoiceViewPage({
  invoiceId,
  onBack,
  onEdit,
}: {
  invoiceId: number;
  onBack: () => void;
  onEdit: (id: number) => void;
}) {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<{
    invoice: Invoice;
    items: InvoiceItem[];
    customer: Customer;
    company: CompanySettings | null;
  }>({
    queryKey: ["/api/invoices", invoiceId, "full"],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${invoiceId}/full`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load invoice");
      return res.json();
    },
  });

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${data?.invoice.invoiceNumber || ""}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 20px; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #0057FF; padding-bottom: 20px; }
            .company-info h1 { font-size: 24px; color: #0057FF; margin-bottom: 4px; }
            .company-info p { font-size: 11px; color: #666; line-height: 1.5; }
            .invoice-meta { text-align: right; }
            .invoice-meta h2 { font-size: 28px; color: #0057FF; margin-bottom: 8px; }
            .invoice-meta .detail { font-size: 11px; color: #666; line-height: 1.8; }
            .invoice-meta .detail strong { color: #333; }
            .billing { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
            .billing-section h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
            .billing-section p { font-size: 12px; line-height: 1.6; }
            .billing-section .name { font-size: 14px; font-weight: 600; color: #1a1a1a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            thead th { background: #0057FF; color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            thead th:last-child, thead th:nth-child(3), thead th:nth-child(4), thead th:nth-child(5) { text-align: right; }
            tbody td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
            tbody td:last-child, tbody td:nth-child(3), tbody td:nth-child(4), tbody td:nth-child(5) { text-align: right; }
            tbody tr:nth-child(even) { background: #f8f9fa; }
            .item-type { display: inline-block; font-size: 9px; padding: 2px 6px; border-radius: 3px; background: #e8f0fe; color: #0057FF; text-transform: uppercase; font-weight: 600; }
            .totals { margin-left: auto; width: 300px; }
            .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; }
            .totals .row.grand { border-top: 2px solid #0057FF; margin-top: 8px; padding-top: 12px; font-size: 16px; font-weight: 700; color: #0057FF; }
            .footer { margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 15px; font-size: 10px; color: #999; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
            .status-paid { background: #d4edda; color: #155724; }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-overdue { background: #f8d7da; color: #721c24; }
            .status-cancelled { background: #e2e3e5; color: #383d41; }
            .notes { margin-top: 20px; padding: 12px; background: #f8f9fa; border-radius: 6px; font-size: 11px; }
            .notes strong { display: block; margin-bottom: 4px; font-size: 10px; text-transform: uppercase; color: #999; }
            @media print { body { padding: 0; } .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  if (isLoading || !data) {
    return (
      <div className="p-6 max-w-[900px] mx-auto">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[700px] w-full" />
      </div>
    );
  }

  const { invoice, items, customer, company } = data;
  const config = statusConfig[invoice.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const subtotal = items.length > 0
    ? items.reduce((sum, item) => sum + (parseFloat(item.unitPrice) * item.quantity), 0)
    : parseFloat(invoice.amount);
  const totalDiscount = items.reduce((sum, item) => sum + parseFloat(item.discount || "0"), 0);
  const totalTax = items.length > 0
    ? items.reduce((sum, item) => sum + parseFloat(item.taxAmount || "0"), 0)
    : parseFloat(invoice.tax || "0");
  const grandTotal = parseFloat(invoice.totalAmount);

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-from-view">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold" data-testid="text-view-invoice-title">Invoice {invoice.invoiceNumber}</h1>
            <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize mt-1 ${config.color}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {invoice.status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} data-testid="button-print-invoice">
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(invoice.id)} data-testid="button-edit-from-view">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-8" ref={printRef}>
          <div className="invoice-container">
            <div className="flex justify-between items-start mb-8 pb-5 border-b-[3px] border-[#0057FF]">
              <div>
                <h1 className="text-2xl font-bold text-[#0057FF]" data-testid="text-company-name">{company?.companyName || "NetSphere ISP"}</h1>
                {company?.registrationNo && <p className="text-[11px] text-muted-foreground">Reg: {company.registrationNo}</p>}
                {company?.ntn && <p className="text-[11px] text-muted-foreground">NTN: {company.ntn}</p>}
                {company?.address && <p className="text-[11px] text-muted-foreground">{company.address}</p>}
                {company?.phone && <p className="text-[11px] text-muted-foreground">Phone: {company.phone}</p>}
                {company?.email && <p className="text-[11px] text-muted-foreground">Email: {company.email}</p>}
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-[#0057FF]">INVOICE</h2>
                <div className="text-[11px] text-muted-foreground mt-2 space-y-0.5">
                  <p><strong className="text-foreground">Invoice #:</strong> {invoice.invoiceNumber}</p>
                  <p><strong className="text-foreground">Issue Date:</strong> {invoice.issueDate}</p>
                  <p><strong className="text-foreground">Due Date:</strong> {invoice.dueDate}</p>
                  {invoice.paidDate && <p><strong className="text-foreground">Paid Date:</strong> {invoice.paidDate}</p>}
                  <div className="mt-2">
                    <span className={`inline-block px-3 py-1 rounded text-[11px] font-semibold uppercase ${
                      invoice.status === "paid" ? "bg-green-100 text-green-800" :
                      invoice.status === "pending" ? "bg-amber-100 text-amber-800" :
                      invoice.status === "overdue" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`} data-testid="text-invoice-status-badge">
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Bill To</h3>
                <p className="text-sm font-semibold" data-testid="text-bill-to-name">{customer?.fullName || "N/A"}</p>
                <p className="text-xs text-muted-foreground">{customer?.customerId}</p>
                <p className="text-xs text-muted-foreground">{customer?.address || customer?.presentAddress || ""}</p>
                <p className="text-xs text-muted-foreground">{customer?.phone || ""}</p>
                <p className="text-xs text-muted-foreground">{customer?.email || ""}</p>
              </div>
              <div>
                <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Payment Details</h3>
                <p className="text-xs text-muted-foreground">Currency: {company?.currency || "PKR"}</p>
                <p className="text-xs text-muted-foreground">Service: {invoice.serviceType?.toUpperCase() || "INTERNET"}</p>
                {invoice.isRecurring && <p className="text-xs text-muted-foreground">Type: Recurring</p>}
              </div>
            </div>

            <div className="overflow-x-auto mb-6">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0057FF]">
                    <TableHead className="text-white text-[11px] uppercase tracking-wider font-semibold">#</TableHead>
                    <TableHead className="text-white text-[11px] uppercase tracking-wider font-semibold">Description</TableHead>
                    <TableHead className="text-white text-[11px] uppercase tracking-wider font-semibold text-right">Qty</TableHead>
                    <TableHead className="text-white text-[11px] uppercase tracking-wider font-semibold text-right">Unit Price</TableHead>
                    <TableHead className="text-white text-[11px] uppercase tracking-wider font-semibold text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length > 0 ? items.map((item, idx) => (
                    <TableRow key={item.id} className={idx % 2 === 0 ? "" : "bg-muted/20"} data-testid={`row-view-item-${idx}`}>
                      <TableCell className="text-xs">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="text-xs font-medium">{item.description}</div>
                        <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 uppercase font-semibold mt-0.5">
                          {item.itemType}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-right">{item.quantity}</TableCell>
                      <TableCell className="text-xs text-right">Rs. {Number(item.unitPrice).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right font-semibold">Rs. {Number(item.total).toLocaleString()}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell className="text-xs">1</TableCell>
                      <TableCell className="text-xs font-medium">{invoice.description || "Internet Service"}</TableCell>
                      <TableCell className="text-xs text-right">1</TableCell>
                      <TableCell className="text-xs text-right">Rs. {Number(invoice.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right font-semibold">Rs. {Number(invoice.amount).toLocaleString()}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end mb-8">
              <div className="w-[300px] space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>Rs. {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="text-red-500">- Rs. {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tax:</span>
                  <span>Rs. {totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span>Grand Total:</span>
                  <span className="text-[#0057FF]" data-testid="text-view-grand-total">Rs. {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {invoice.description && (
              <div className="bg-muted/30 rounded-lg p-3 mb-6">
                <strong className="text-[10px] uppercase text-muted-foreground block mb-1">Notes</strong>
                <p className="text-xs text-muted-foreground">{invoice.description}</p>
              </div>
            )}

            <div className="text-center border-t pt-4 text-[10px] text-muted-foreground">
              <p>Thank you for your business! | {company?.companyName || "NetSphere ISP"}</p>
              {company?.website && <p>{company.website}</p>}
              <p className="mt-1">This is a computer-generated invoice and does not require a signature.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
