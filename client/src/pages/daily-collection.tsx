import { useState } from "react";
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
  FileSpreadsheet,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  DollarSign,
  Receipt,
  AlertTriangle,
  CreditCard,
  Wallet,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Customer, type DailyCollection } from "@shared/schema";

type DailyCollectionWithCustomer = DailyCollection & {
  customerName?: string;
  customerCode?: string;
  customerPhone?: string;
  customerUsername?: string;
  monthlyBill?: string;
};

export default function DailyCollectionPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("collected");
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [receivedByFilter, setReceivedByFilter] = useState("all");
  const [reportType, setReportType] = useState("all");
  const [connectionTypeFilter, setConnectionTypeFilter] = useState("all");
  const [transStatusFilter, setTransStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);

  const [receiveForm, setReceiveForm] = useState({
    customerId: 0,
    customerSearch: "",
    amount: "",
    received: "",
    vat: "0",
    discount: "0",
    paymentMethod: "cash",
    receivedBy: "",
    notes: "",
    connectionType: "",
    area: "",
  });

  const { data: collections, isLoading } = useQuery<DailyCollectionWithCustomer[]>({
    queryKey: ["/api/daily-collections"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/daily-collections", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-collections"] });
      toast({ title: "Bill received successfully" });
      setShowReceiveDialog(false);
      resetReceiveForm();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id =>
        apiRequest("PATCH", `/api/daily-collections/${id}`, { status: "approved", approvedBy: "Admin" })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-collections"] });
      toast({ title: "Transactions approved" });
      setSelectedIds(new Set());
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id =>
        apiRequest("DELETE", `/api/daily-collections/${id}`)
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-collections"] });
      toast({ title: "Transactions deleted" });
      setSelectedIds(new Set());
    },
  });

  const resetReceiveForm = () => {
    setReceiveForm({
      customerId: 0,
      customerSearch: "",
      amount: "",
      received: "",
      vat: "0",
      discount: "0",
      paymentMethod: "cash",
      receivedBy: "",
      notes: "",
      connectionType: "",
      area: "",
    });
  };

  const allCollections = collections || [];

  const filtered = allCollections.filter((c) => {
    const matchSearch =
      (c.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.customerCode || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.customerPhone || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.customerUsername || "").toLowerCase().includes(search.toLowerCase());
    const matchArea = areaFilter === "all" || c.area === areaFilter;
    const matchDateFrom = !fromDate || c.date >= fromDate;
    const matchDateTo = !toDate || c.date <= toDate;
    const matchReceivedBy = receivedByFilter === "all" || c.receivedBy === receivedByFilter;
    const matchConnType = connectionTypeFilter === "all" || c.connectionType === connectionTypeFilter;
    const matchTransStatus = transStatusFilter === "all" || c.status === transStatusFilter;
    const matchPaymentMethod = paymentMethodFilter === "all" || c.paymentMethod === paymentMethodFilter;
    let matchReportType = true;
    if (reportType === "daily") {
      matchReportType = c.date === fromDate;
    } else if (reportType === "weekly") {
      const from = new Date(fromDate);
      const to = new Date(fromDate);
      to.setDate(to.getDate() + 7);
      matchReportType = c.date >= fromDate && c.date <= to.toISOString().split("T")[0];
    } else if (reportType === "monthly") {
      const month = fromDate.substring(0, 7);
      matchReportType = c.date.startsWith(month);
    }
    let matchTab = true;
    if (activeTab === "collected") {
      matchTab = c.transactionType !== "webhook" && c.transactionType !== "paybill";
    } else if (activeTab === "webhook") {
      matchTab = c.transactionType === "webhook";
    } else if (activeTab === "paybill") {
      matchTab = c.transactionType === "paybill";
    }
    return matchSearch && matchArea && matchDateFrom && matchDateTo && matchReceivedBy && matchConnType && matchTransStatus && matchPaymentMethod && matchReportType && matchTab;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    let aVal: any, bVal: any;
    switch (sortField) {
      case "date": aVal = a.date; bVal = b.date; break;
      case "code": aVal = a.customerCode || ""; bVal = b.customerCode || ""; break;
      case "name": aVal = a.customerName || ""; bVal = b.customerName || ""; break;
      case "amount": aVal = Number(a.amount); bVal = Number(b.amount); break;
      case "received": aVal = Number(a.received); bVal = Number(b.received); break;
      case "balance": aVal = Number(a.balanceDue); bVal = Number(b.balanceDue); break;
      default: return 0;
    }
    if (typeof aVal === "number") return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    return sortDir === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / entriesPerPage));
  const paginated = sorted.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const totalBill = allCollections.reduce((s, c) => s + Number(c.amount || 0), 0);
  const totalReceived = allCollections.reduce((s, c) => s + Number(c.received || 0), 0);
  const totalDue = allCollections.reduce((s, c) => s + Number(c.balanceDue || 0), 0);
  const paidCount = allCollections.filter(c => c.status === "approved" || Number(c.received) > 0).length;
  const unpaidCount = allCollections.filter(c => Number(c.balanceDue) > 0).length;

  const totalMBill = filtered.reduce((s, c) => s + Number(c.monthlyBill || c.amount || 0), 0);
  const totalFilteredReceived = filtered.reduce((s, c) => s + Number(c.received || 0), 0);
  const totalFilteredVAT = filtered.reduce((s, c) => s + Number(c.vat || 0), 0);
  const totalFilteredDiscount = filtered.reduce((s, c) => s + Number(c.discount || 0), 0);
  const totalFilteredBalance = filtered.reduce((s, c) => s + Number(c.balanceDue || 0), 0);

  const areas = Array.from(new Set(allCollections.map(c => c.area).filter(Boolean)));
  const receivers = Array.from(new Set(allCollections.map(c => c.receivedBy).filter(Boolean)));

  const selectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(c => c.id)));
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
    const headers = ["Date", "C.Code", "UserName", "Cus.Name", "MobileNo.", "Note/Remarks", "M.Bill", "Received", "VAT", "Discount", "BalanceDue", "PaymentMethod", "ReceivedBy", "ApprovedBy", "CreatedBy", "Status"];
    const rows = filtered.map(c => [
      c.date,
      c.customerCode || "",
      c.customerUsername || "",
      c.customerName || "",
      c.customerPhone || "",
      c.notes || "",
      Number(c.monthlyBill || c.amount || 0).toFixed(2),
      Number(c.received || 0).toFixed(2),
      Number(c.vat || 0).toFixed(2),
      Number(c.discount || 0).toFixed(2),
      Number(c.balanceDue || 0).toFixed(2),
      c.paymentMethod || "",
      c.receivedBy || "",
      c.approvedBy || "",
      c.createdBy || "",
      c.status,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-collection-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported successfully" });
  };

  const exportPDF = () => {
    const headers = ["Date", "C.Code", "UserName", "Cus.Name", "Mobile", "M.Bill", "Received", "VAT", "Discount", "Balance", "Method", "ReceivedBy", "Status"];
    const rows = filtered.map(c => [
      c.date,
      c.customerCode || "",
      c.customerUsername || "",
      c.customerName || "",
      c.customerPhone || "",
      Number(c.monthlyBill || c.amount || 0).toFixed(2),
      Number(c.received || 0).toFixed(2),
      Number(c.vat || 0).toFixed(2),
      Number(c.discount || 0).toFixed(2),
      Number(c.balanceDue || 0).toFixed(2),
      c.paymentMethod || "",
      c.receivedBy || "",
      c.status,
    ]);
    const printWin = window.open("", "_blank");
    if (!printWin) { toast({ title: "Allow popups to generate PDF", variant: "destructive" }); return; }
    printWin.document.write(`<!DOCTYPE html><html><head><title>Daily Bill Collection Report</title>
      <style>body{font-family:Arial,sans-serif;margin:20px}h1{font-size:18px;margin-bottom:4px}
      .meta{font-size:12px;color:#666;margin-bottom:12px}
      table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #ccc;padding:4px 6px;text-align:left}
      th{background:#334155;color:#fff;font-size:10px;text-transform:uppercase}
      tr:nth-child(even){background:#f9fafb}.text-right{text-align:right}
      .totals{font-weight:bold;background:#e2e8f0!important}
      @media print{body{margin:0}}</style></head><body>
      <h1>Daily Bill Collection Report</h1>
      <div class="meta">Period: ${fromDate} to ${toDate} | Generated: ${new Date().toLocaleString()}</div>
      <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map((v, i) => `<td${i >= 5 && i <= 9 ? ' class="text-right"' : ''}>${v}</td>`).join("")}</tr>`).join("")}
      <tr class="totals"><td colspan="5">TOTAL</td>
      <td class="text-right">${totalMBill.toFixed(2)}</td>
      <td class="text-right">${totalFilteredReceived.toFixed(2)}</td>
      <td class="text-right">${totalFilteredVAT.toFixed(2)}</td>
      <td class="text-right">${totalFilteredDiscount.toFixed(2)}</td>
      <td class="text-right">${totalFilteredBalance.toFixed(2)}</td>
      <td colspan="3"></td></tr></tbody></table></body></html>`);
    printWin.document.close();
    setTimeout(() => { printWin.print(); }, 300);
    toast({ title: "PDF print dialog opened" });
  };

  const handleReceiveBill = () => {
    if (!receiveForm.customerId) {
      toast({ title: "Select a customer", variant: "destructive" });
      return;
    }
    if (!receiveForm.received || Number(receiveForm.received) <= 0) {
      toast({ title: "Enter received amount", variant: "destructive" });
      return;
    }
    const amount = Number(receiveForm.amount || receiveForm.received);
    const received = Number(receiveForm.received);
    const discount = Number(receiveForm.discount || 0);
    const vat = Number(receiveForm.vat || 0);
    const balanceDue = Math.max(0, amount - received - discount + vat);

    createMutation.mutate({
      date: new Date().toISOString().split("T")[0],
      customerId: receiveForm.customerId,
      amount: amount.toFixed(2),
      received: received.toFixed(2),
      vat: vat.toFixed(2),
      discount: discount.toFixed(2),
      balanceDue: balanceDue.toFixed(2),
      paymentMethod: receiveForm.paymentMethod,
      receivedBy: receiveForm.receivedBy || "Admin",
      createdBy: "Admin",
      notes: receiveForm.notes,
      status: "pending",
      connectionType: receiveForm.connectionType,
      area: receiveForm.area,
      transactionType: "collection",
    });
  };

  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const filteredCustomers = (customers || []).filter(
    (c) =>
      c.fullName.toLowerCase().includes(receiveForm.customerSearch.toLowerCase()) ||
      c.customerId.toLowerCase().includes(receiveForm.customerSearch.toLowerCase()) ||
      c.phone.includes(receiveForm.customerSearch)
  );

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-daily-collection-title">
            <Receipt className="h-6 w-6" />
            Daily Bill Collection
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">All Daily Collected Bills</p>
        </div>
        <div className="text-xs text-muted-foreground">
          Billing &gt; Daily Bill Collection
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentPage(1); }} className="w-full">
        <TabsList>
          <TabsTrigger value="collected" className="gap-1.5" data-testid="tab-collected-bills">
            <CheckCircle className="h-3.5 w-3.5" />
            Collected Bills
          </TabsTrigger>
          <TabsTrigger value="webhook" className="gap-1.5" data-testid="tab-webhook-payments">
            <CreditCard className="h-3.5 w-3.5" />
            Webhook Payments
          </TabsTrigger>
          <TabsTrigger value="paybill" className="gap-1.5" data-testid="tab-paybill-payments">
            <Wallet className="h-3.5 w-3.5" />
            Paybill Payments
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="summary-cards">
        <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white border-0" data-testid="card-total-bill">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Total Bill</div>
              <div className="text-2xl font-bold">{totalBill.toLocaleString()}</div>
              <div className="text-[11px] opacity-80 mt-0.5">
                <Badge className="bg-blue-500/50 text-white border-0 text-[10px]">
                  Monthly Total Clients
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-teal-500 to-teal-700 text-white border-0" data-testid="card-received-bill">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Received Bill</div>
              <div className="text-2xl font-bold">{totalReceived.toLocaleString()}</div>
              <div className="text-[11px] opacity-80 mt-0.5">
                <Badge className="bg-teal-400/50 text-white border-0 text-[10px]">
                  Monthly PAID Clients ( Number of paid clients)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-600 to-purple-800 text-white border-0" data-testid="card-due">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Due</div>
              <div className="text-2xl font-bold">{totalDue.toLocaleString()}</div>
              <div className="text-[11px] opacity-80 mt-0.5">
                <Badge className="bg-purple-400/50 text-white border-0 text-[10px]">
                  Monthly Unpaid Clients (Number of Unpaid clients)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2" data-testid="toolbar-actions">
        <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-slate-700 text-white hover:bg-slate-800 border-slate-700" onClick={exportCSV} data-testid="button-generate-csv">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Generate CSV
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-slate-700 text-white hover:bg-slate-800 border-slate-700" onClick={exportPDF} data-testid="button-generate-pdf">
          <FileText className="h-3.5 w-3.5" />
          Generate PDF
        </Button>
        <Button size="sm" className="text-xs gap-1.5 bg-teal-600 hover:bg-teal-700" onClick={() => setShowReceiveDialog(true)} data-testid="button-receive-bill">
          <Plus className="h-3.5 w-3.5" />
          Receive Bill
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
          onClick={() => { if (selectedIds.size > 0) approveMutation.mutate(Array.from(selectedIds)); else toast({ title: "Select transactions first", variant: "destructive" }); }}
          data-testid="button-approve-selected"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Approve Selected Transaction
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-red-600 text-white hover:bg-red-700 border-red-600"
          onClick={() => { if (selectedIds.size > 0) deleteMutation.mutate(Array.from(selectedIds)); else toast({ title: "Select transactions first", variant: "destructive" }); }}
          data-testid="button-delete-selected"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Selected Transaction
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Area</Label>
              <Select value={areaFilter} onValueChange={(v) => { setAreaFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 mt-1" data-testid="select-area-filter">
                  <SelectValue placeholder="All User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All User</SelectItem>
                  {areas.map(a => <SelectItem key={a} value={a!}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground">From Date</Label>
              <Input type="date" className="h-9 mt-1" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }} data-testid="input-from-date" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground">To Date</Label>
              <Input type="date" className="h-9 mt-1" value={toDate} onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }} data-testid="input-to-date" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Received By</Label>
              <Select value={receivedByFilter} onValueChange={(v) => { setReceivedByFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 mt-1" data-testid="select-received-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {receivers.map(r => <SelectItem key={r} value={r!}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Report Type</Label>
              <Select value={reportType} onValueChange={(v) => { setReportType(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 mt-1" data-testid="select-report-type">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Connection Type</Label>
              <Select value={connectionTypeFilter} onValueChange={(v) => { setConnectionTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 mt-1" data-testid="select-connection-type">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pppoe">PPPoE</SelectItem>
                  <SelectItem value="static">Static</SelectItem>
                  <SelectItem value="dynamic">Dynamic</SelectItem>
                  <SelectItem value="hotspot">Hotspot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Trans. Status</Label>
              <Select value={transStatusFilter} onValueChange={(v) => { setTransStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 mt-1" data-testid="select-trans-status">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Payment Method</Label>
              <Select value={paymentMethodFilter} onValueChange={(v) => { setPaymentMethodFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 mt-1" data-testid="select-payment-method">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="jazzcash">JazzCash</SelectItem>
                  <SelectItem value="easypaisa">Easypaisa</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase whitespace-nowrap">Show</span>
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
              <span className="text-xs text-muted-foreground uppercase whitespace-nowrap">Entries</span>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <span className="text-xs font-semibold uppercase text-muted-foreground mr-2">Search:</span>
              <Input
                placeholder=""
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="h-8 text-xs inline-block w-48"
                data-testid="input-search-collections"
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
            <div className="overflow-x-auto -mx-3">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-700 dark:bg-slate-800 hover:bg-slate-700 dark:hover:bg-slate-800">
                    <TableHead className="text-white text-[10px] uppercase tracking-wider cursor-pointer whitespace-nowrap" onClick={() => handleSort("date")}>
                      Date {sortField === "date" ? (sortDir === "asc" ? "↑↓" : "↓↑") : "↑↓"}
                    </TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">C.Code</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">UserName</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">Cus.Name</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">MobileNo.</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">Note/Remarks</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider text-right whitespace-nowrap">M.Bill</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider text-right whitespace-nowrap">Received</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider text-right whitespace-nowrap">VAT</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider text-right whitespace-nowrap">Discount</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider text-right whitespace-nowrap">BalanceDue</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">PaymentMethod</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap cursor-pointer" onClick={() => handleSort("received")}>
                      ReceivedBy {sortField === "received" ? (sortDir === "asc" ? "↑↓" : "↓↑") : "↑↓"}
                    </TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">ApprovedBy ↑↓</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">CreatedBy ↑↓</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">Action</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider w-8">
                      <Checkbox checked={false} onCheckedChange={selectAll} data-testid="checkbox-select-all" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={17} className="text-center py-8 text-muted-foreground text-sm">
                      No data available in table
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="border-t">
                <Table>
                  <TableBody>
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell className="text-xs" colSpan={6}>TOTAL</TableCell>
                      <TableCell className="text-xs text-right">0</TableCell>
                      <TableCell className="text-xs text-right">0</TableCell>
                      <TableCell className="text-xs text-right">0</TableCell>
                      <TableCell className="text-xs text-right">0</TableCell>
                      <TableCell className="text-xs text-right">0</TableCell>
                      <TableCell colSpan={6}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-700 dark:bg-slate-800 hover:bg-slate-700 dark:hover:bg-slate-800">
                    <TableHead className="text-white text-[10px] uppercase tracking-wider cursor-pointer whitespace-nowrap" onClick={() => handleSort("date")}>
                      Date {sortField === "date" ? (sortDir === "asc" ? "↑↓" : "↓↑") : "↑↓"}
                    </TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider cursor-pointer whitespace-nowrap" onClick={() => handleSort("code")}>
                      C.Code
                    </TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">UserName</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider cursor-pointer whitespace-nowrap" onClick={() => handleSort("name")}>
                      Cus.Name
                    </TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">MobileNo.</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">Note/Remarks</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort("amount")}>
                      M.Bill
                    </TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort("received")}>
                      Received
                    </TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider text-right whitespace-nowrap">VAT</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider text-right whitespace-nowrap">Discount</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort("balance")}>
                      BalanceDue
                    </TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">PaymentMethod</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">ReceivedBy ↑↓</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">ApprovedBy ↑↓</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">CreatedBy ↑↓</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider whitespace-nowrap">Action</TableHead>
                    <TableHead className="text-white text-[10px] uppercase tracking-wider w-8">
                      <Checkbox
                        checked={selectedIds.size === paginated.length && paginated.length > 0}
                        onCheckedChange={selectAll}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((c, idx) => (
                    <TableRow
                      key={c.id}
                      className={`text-xs ${idx % 2 === 0 ? "" : "bg-muted/30"} ${selectedIds.has(c.id) ? "bg-blue-50 dark:bg-blue-950/30" : ""}`}
                      data-testid={`row-collection-${c.id}`}
                    >
                      <TableCell className="text-[11px] whitespace-nowrap">{c.date}</TableCell>
                      <TableCell className="font-mono text-[11px] whitespace-nowrap">{c.customerCode || "-"}</TableCell>
                      <TableCell className="text-[11px] whitespace-nowrap">{c.customerUsername || "-"}</TableCell>
                      <TableCell className="text-[11px] font-medium whitespace-nowrap">{c.customerName || "-"}</TableCell>
                      <TableCell className="text-[11px] whitespace-nowrap">{c.customerPhone || "-"}</TableCell>
                      <TableCell className="text-[11px] whitespace-nowrap max-w-[120px] truncate">{c.notes || "-"}</TableCell>
                      <TableCell className="text-[11px] text-right font-medium whitespace-nowrap">{Number(c.monthlyBill || c.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-[11px] text-right whitespace-nowrap">{Number(c.received || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-[11px] text-right whitespace-nowrap">{Number(c.vat || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-[11px] text-right whitespace-nowrap">{Number(c.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-[11px] text-right font-medium whitespace-nowrap">
                        {Number(c.balanceDue) > 0 ? (
                          <span className="text-red-600 dark:text-red-400">{Number(c.balanceDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        ) : "0.00"}
                      </TableCell>
                      <TableCell className="text-[11px] capitalize whitespace-nowrap">{c.paymentMethod || "-"}</TableCell>
                      <TableCell className="text-[11px] whitespace-nowrap">{c.receivedBy || "-"}</TableCell>
                      <TableCell className="text-[11px] whitespace-nowrap">
                        {c.approvedBy ? (
                          <Badge variant="secondary" className="text-[9px] bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 no-default-active-elevate">{c.approvedBy}</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 no-default-active-elevate">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-[11px] whitespace-nowrap">{c.createdBy || "-"}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-actions-${c.id}`}>
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => approveMutation.mutate([c.id])} data-testid={`button-approve-${c.id}`}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem data-testid={`button-edit-${c.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate([c.id])} data-testid={`button-delete-${c.id}`}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(c.id)}
                          onCheckedChange={() => toggleSelect(c.id)}
                          data-testid={`checkbox-collection-${c.id}`}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="border-t">
                <Table>
                  <TableBody>
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell className="text-xs" colSpan={6}>TOTAL</TableCell>
                      <TableCell className="text-xs text-right">{totalMBill.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-xs text-right">{totalFilteredReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-xs text-right">{totalFilteredVAT.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-xs text-right">{totalFilteredDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-xs text-right">{totalFilteredBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell colSpan={6}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3 pt-3 border-t">
            <div className="text-xs text-muted-foreground">
              Showing {sorted.length === 0 ? 0 : ((currentPage - 1) * entriesPerPage) + 1} to {Math.min(currentPage * entriesPerPage, sorted.length)} of {sorted.length} entries
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 px-3 text-xs" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} data-testid="button-prev-page">
                Previous
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
              <Button variant="outline" size="sm" className="h-7 px-3 text-xs" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} data-testid="button-next-page">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Receive Bill
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium">Customer</Label>
              <div className="relative">
                <Input
                  placeholder="Search customer..."
                  value={receiveForm.customerSearch}
                  onChange={(e) => {
                    setReceiveForm({ ...receiveForm, customerSearch: e.target.value, customerId: 0 });
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  data-testid="input-receive-customer"
                />
                {showCustomerDropdown && receiveForm.customerSearch && filteredCustomers.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredCustomers.slice(0, 8).map((c) => (
                      <button
                        key={c.id}
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex justify-between"
                        onClick={() => {
                          setReceiveForm({
                            ...receiveForm,
                            customerId: c.id,
                            customerSearch: c.fullName,
                            amount: c.monthlyBill || "",
                            area: c.area || "",
                            connectionType: c.connectionType || "",
                          });
                          setShowCustomerDropdown(false);
                        }}
                        data-testid={`select-receive-customer-${c.id}`}
                      >
                        <span className="font-medium">{c.fullName}</span>
                        <span className="text-muted-foreground text-xs">{c.customerId}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Monthly Bill</Label>
                <Input type="number" value={receiveForm.amount} onChange={(e) => setReceiveForm({ ...receiveForm, amount: e.target.value })} data-testid="input-receive-amount" />
              </div>
              <div>
                <Label className="text-xs font-medium">Received Amount</Label>
                <Input type="number" value={receiveForm.received} onChange={(e) => setReceiveForm({ ...receiveForm, received: e.target.value })} data-testid="input-receive-received" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">VAT</Label>
                <Input type="number" value={receiveForm.vat} onChange={(e) => setReceiveForm({ ...receiveForm, vat: e.target.value })} data-testid="input-receive-vat" />
              </div>
              <div>
                <Label className="text-xs font-medium">Discount</Label>
                <Input type="number" value={receiveForm.discount} onChange={(e) => setReceiveForm({ ...receiveForm, discount: e.target.value })} data-testid="input-receive-discount" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Payment Method</Label>
                <Select value={receiveForm.paymentMethod} onValueChange={(v) => setReceiveForm({ ...receiveForm, paymentMethod: v })}>
                  <SelectTrigger data-testid="select-receive-payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="jazzcash">JazzCash</SelectItem>
                    <SelectItem value="easypaisa">Easypaisa</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Received By</Label>
                <Input value={receiveForm.receivedBy} onChange={(e) => setReceiveForm({ ...receiveForm, receivedBy: e.target.value })} placeholder="Name" data-testid="input-receive-by" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Notes / Remarks</Label>
              <Textarea value={receiveForm.notes} onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })} rows={2} placeholder="Optional notes..." data-testid="textarea-receive-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiveDialog(false)} data-testid="button-cancel-receive">Cancel</Button>
            <Button onClick={handleReceiveBill} disabled={createMutation.isPending} data-testid="button-submit-receive">
              {createMutation.isPending ? "Saving..." : "Receive Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
