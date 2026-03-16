import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  Clock,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  TreePalm,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertLeaveSchema,
  insertHolidaySchema,
  type Leave,
  type InsertLeave,
  type Holiday,
  type InsertHoliday,
  type Employee,
} from "@shared/schema";
import { z } from "zod";

const leaveFormSchema = insertLeaveSchema.extend({
  employeeId: z.coerce.number().min(1, "Employee is required"),
  leaveType: z.string().min(1, "Leave type is required"),
  dateFrom: z.string().min(1, "Start date is required"),
  dateTo: z.string().min(1, "End date is required"),
  numberOfDays: z.coerce.number().min(1, "Number of days is required"),
});

const holidayFormSchema = insertHolidaySchema.extend({
  name: z.string().min(1, "Holiday name is required"),
  date: z.string().min(1, "Date is required"),
});

type LeaveWithEmployee = Leave & {
  employeeName?: string;
  employeeCode?: string;
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "--";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return dateStr;
  }
}

function calculateDays(from: string, to: string): number {
  if (!from || !to) return 1;
  const d1 = new Date(from + "T00:00:00");
  const d2 = new Date(to + "T00:00:00");
  const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

export default function LeavesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("leaves");

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-leaves-title">
            HR & Payroll - Holiday & Leave
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Manage employee leaves, holidays, and time-off requests
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-leave-holiday">
          <TabsTrigger value="leaves" data-testid="tab-leaves" className="gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Leave Management
          </TabsTrigger>
          <TabsTrigger value="holidays" data-testid="tab-holidays" className="gap-1.5">
            <TreePalm className="h-3.5 w-3.5" />
            Public Holidays
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaves" className="mt-4 space-y-4">
          <LeaveManagement />
        </TabsContent>

        <TabsContent value="holidays" className="mt-4 space-y-4">
          <HolidayManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LeaveManagement() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Leave | null>(null);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: leaveRecords, isLoading } = useQuery<LeaveWithEmployee[]>({
    queryKey: ["/api/leaves"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const form = useForm<InsertLeave>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      employeeId: 0,
      leaveType: "",
      dateFrom: "",
      dateTo: "",
      numberOfDays: 1,
      remarks: "",
      reason: "",
      status: "requested",
      approvedBy: "",
    },
  });

  const watchDateFrom = form.watch("dateFrom");
  const watchDateTo = form.watch("dateTo");

  const createMutation = useMutation({
    mutationFn: async (data: InsertLeave) => {
      const res = await apiRequest("POST", "/api/leaves", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaves"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Leave request created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertLeave> }) => {
      const res = await apiRequest("PATCH", `/api/leaves/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaves"] });
      setDialogOpen(false);
      setEditingRecord(null);
      form.reset();
      toast({ title: "Leave record updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/leaves/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaves"] });
      toast({ title: "Leave record deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingRecord(null);
    form.reset({
      employeeId: 0,
      leaveType: "",
      dateFrom: new Date().toISOString().split("T")[0],
      dateTo: new Date().toISOString().split("T")[0],
      numberOfDays: 1,
      remarks: "",
      reason: "",
      status: "requested",
      approvedBy: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (record: Leave) => {
    setEditingRecord(record);
    form.reset({
      employeeId: record.employeeId,
      leaveType: record.leaveType,
      dateFrom: record.dateFrom,
      dateTo: record.dateTo,
      numberOfDays: record.numberOfDays,
      remarks: record.remarks || "",
      reason: record.reason || "",
      status: record.status,
      approvedBy: record.approvedBy || "",
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertLeave) => {
    const days = calculateDays(data.dateFrom, data.dateTo);
    const payload = { ...data, numberOfDays: days };
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setEmployeeFilter("all");
    setFromDate("");
    setToDate("");
    setSearch("");
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    return (leaveRecords || []).filter((r) => {
      const empName = (r.employeeName || "").toLowerCase();
      const empCode = (r.employeeCode || "").toLowerCase();
      const matchSearch =
        empName.includes(search.toLowerCase()) ||
        empCode.includes(search.toLowerCase()) ||
        (r.remarks || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.reason || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchType = typeFilter === "all" || r.leaveType === typeFilter;
      const matchEmployee = employeeFilter === "all" || r.employeeId.toString() === employeeFilter;
      const matchFromDate = !fromDate || r.dateFrom >= fromDate;
      const matchToDate = !toDate || r.dateTo <= toDate;
      return matchSearch && matchStatus && matchType && matchEmployee && matchFromDate && matchToDate;
    });
  }, [leaveRecords, search, statusFilter, typeFilter, employeeFilter, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
  const paginatedRecords = filtered.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const allRecords = leaveRecords || [];
  const totalLeaves = allRecords.length;
  const approvedCount = allRecords.filter((r) => r.status === "approved").length;
  const pendingCount = allRecords.filter((r) => r.status === "requested" || r.status === "pending").length;
  const rejectedCount = allRecords.filter((r) => r.status === "rejected").length;

  const leaveTypeBadge = (type: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      paid_leave: { label: "Paid Leave", className: "bg-emerald-500 text-white border-emerald-500" },
      paid_sick_leave: { label: "Paid Sick Leave", className: "bg-sky-500 text-white border-sky-500" },
      unpaid_leave: { label: "Unpaid Leave", className: "bg-amber-500 text-white border-amber-500" },
      sick_leave: { label: "Sick Leave", className: "bg-sky-500 text-white border-sky-500" },
      casual_leave: { label: "Casual Leave", className: "bg-violet-500 text-white border-violet-500" },
      annual_leave: { label: "Annual Leave", className: "bg-blue-500 text-white border-blue-500" },
      maternity_leave: { label: "Maternity Leave", className: "bg-pink-500 text-white border-pink-500" },
      paternity_leave: { label: "Paternity Leave", className: "bg-indigo-500 text-white border-indigo-500" },
      half_day: { label: "Half Day", className: "bg-orange-500 text-white border-orange-500" },
      compensatory: { label: "Compensatory", className: "bg-teal-500 text-white border-teal-500" },
    };
    const config = configs[type] || { label: type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), className: "bg-gray-500 text-white border-gray-500" };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${config.className}`} data-testid={`badge-leave-type-${type}`}>
        {config.label}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      requested: { label: "Requested", className: "bg-amber-500 text-white border-amber-500" },
      pending: { label: "Pending", className: "bg-amber-500 text-white border-amber-500" },
      approved: { label: "Approved", className: "bg-emerald-500 text-white border-emerald-500" },
      rejected: { label: "Rejected", className: "bg-red-500 text-white border-red-500" },
      updated: { label: "Updated", className: "bg-blue-500 text-white border-blue-500" },
      cancelled: { label: "Cancelled", className: "bg-gray-500 text-white border-gray-500" },
    };
    const config = configs[status] || configs.requested;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <>
      <Card className="enterprise-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                className="h-9 text-[13px]"
                data-testid="input-leave-from-date"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                className="h-9 text-[13px]"
                data-testid="input-leave-to-date"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Filter By Leave Status</label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 text-[13px]" data-testid="select-leave-status-filter">
                  <SelectValue placeholder="-- Filter By Status --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 min-w-[200px] flex-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Filter By Employee</label>
              <Select value={employeeFilter} onValueChange={(v) => { setEmployeeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 text-[13px]" data-testid="select-leave-employee-filter">
                  <SelectValue placeholder="-- Select an Employee --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {(employees || []).map((e) => (
                    <SelectItem key={e.id} value={e.id.toString()}>
                      {e.fullName} (#{e.empCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-end">
              <Button
                size="sm"
                variant="default"
                onClick={() => setCurrentPage(1)}
                data-testid="button-filter-list"
                className="h-9"
              >
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                Filter List
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleClearFilters}
                data-testid="button-clear-leave-filters"
                className="h-9"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>
            </div>
            <div className="ml-auto">
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 text-[13px] min-w-[150px]" data-testid="select-leave-type-filter">
                  <SelectValue placeholder="Filter all list" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Filter all list</SelectItem>
                  <SelectItem value="paid_leave">Paid Leave</SelectItem>
                  <SelectItem value="paid_sick_leave">Paid Sick Leave</SelectItem>
                  <SelectItem value="unpaid_leave">Unpaid Leave</SelectItem>
                  <SelectItem value="sick_leave">Sick Leave</SelectItem>
                  <SelectItem value="casual_leave">Casual Leave</SelectItem>
                  <SelectItem value="annual_leave">Annual Leave</SelectItem>
                  <SelectItem value="maternity_leave">Maternity Leave</SelectItem>
                  <SelectItem value="half_day">Half Day</SelectItem>
                  <SelectItem value="compensatory">Compensatory</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="enterprise-card" data-testid="card-total-leaves">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Leaves</p>
                <p className="text-2xl font-bold mt-1 text-foreground" data-testid="text-total-leaves">{totalLeaves}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card" data-testid="card-approved-leaves">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Approved</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400" data-testid="text-approved-leaves">{approvedCount}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card" data-testid="card-pending-leaves">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pending/Requested</p>
                <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400" data-testid="text-pending-leaves">{pendingCount}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card" data-testid="card-rejected-leaves">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Rejected</p>
                <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400" data-testid="text-rejected-leaves">{rejectedCount}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="enterprise-card">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 pb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="text-muted-foreground">Page {currentPage} of {totalPages}</span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 7) {
                    page = i + 1;
                  } else if (currentPage <= 4) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    page = totalPages - 6 + i;
                  } else {
                    page = currentPage - 3 + i;
                  }
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      className="h-7 w-7 text-[11px]"
                      onClick={() => setCurrentPage(page)}
                      data-testid={`button-leave-page-${page}`}
                    >
                      {page}
                    </Button>
                  );
                })}
                {totalPages > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] px-2"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      data-testid="button-leave-page-next"
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] px-2"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      data-testid="button-leave-page-last"
                    >
                      Last
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full max-w-[220px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="pl-8 h-8 text-[12px]"
                  data-testid="input-search-leaves"
                />
              </div>
              <Button onClick={openCreate} data-testid="button-add-leave" size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Leave
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium text-sm">No leave records found</p>
              <p className="text-xs mt-1">Adjust filters or add a new leave request</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-[50px] text-[11px] font-semibold uppercase text-center">S.No</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[220px]">Employee</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[100px] text-center">No.of Leaves</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[100px]">Date From</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[100px]">Date To</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[120px] text-center">Type</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[180px]">Remarks</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[140px]">Reason</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[90px] text-center">Status</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[100px] text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.map((record, idx) => {
                    const serialNo = (currentPage - 1) * entriesPerPage + idx + 1;
                    return (
                      <TableRow
                        key={record.id}
                        data-testid={`row-leave-${record.id}`}
                        className="group"
                      >
                        <TableCell className="text-center text-[13px] font-medium text-muted-foreground">
                          {serialNo}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-[13px] font-semibold text-foreground" data-testid={`text-leave-employee-${record.id}`}>
                              {record.employeeName || `Employee #${record.employeeId}`}
                              {record.employeeCode && (
                                <span className="text-muted-foreground font-normal ml-1">#{record.employeeCode}</span>
                              )}
                            </div>
                            {record.createdAt && (
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                Created:{formatDateTime(record.createdAt)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center" data-testid={`text-leave-days-${record.id}`}>
                          <span className="text-[13px] font-medium">{record.numberOfDays} day(s)</span>
                        </TableCell>
                        <TableCell data-testid={`text-leave-from-${record.id}`}>
                          <span className="text-[13px] font-medium">{formatDate(record.dateFrom)}</span>
                        </TableCell>
                        <TableCell data-testid={`text-leave-to-${record.id}`}>
                          <span className="text-[13px] font-medium">{formatDate(record.dateTo)}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {leaveTypeBadge(record.leaveType)}
                        </TableCell>
                        <TableCell>
                          <span className="text-[12px] text-foreground line-clamp-2">
                            {record.remarks || <span className="text-muted-foreground">--</span>}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-[12px] text-foreground">
                            {record.reason || <span className="text-muted-foreground">Not mentioned</span>}
                          </span>
                        </TableCell>
                        <TableCell className="text-center" data-testid={`badge-leave-status-${record.id}`}>
                          {statusBadge(record.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 no-default-hover-elevate no-default-active-elevate hover:bg-blue-50 dark:hover:bg-blue-950/30"
                              onClick={() => openEdit(record)}
                              data-testid={`button-edit-leave-${record.id}`}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 text-red-500 border-red-200 dark:border-red-800 no-default-hover-elevate no-default-active-elevate hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => deleteMutation.mutate(record.id)}
                              data-testid={`button-delete-leave-${record.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <div className="text-[12px] text-muted-foreground">
                Showing {(currentPage - 1) * entriesPerPage + 1} to{" "}
                {Math.min(currentPage * entriesPerPage, filtered.length)} of {filtered.length} entries
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingRecord ? "Edit Leave Request" : "Add Leave Request"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(parseInt(v))}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-leave-employee">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(employees || []).map((e) => (
                          <SelectItem key={e.id} value={e.id.toString()}>
                            {e.fullName} (#{e.empCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="leaveType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-leave-type">
                            <SelectValue placeholder="Select leave type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="paid_leave">Paid Leave</SelectItem>
                          <SelectItem value="paid_sick_leave">Paid Sick Leave</SelectItem>
                          <SelectItem value="unpaid_leave">Unpaid Leave</SelectItem>
                          <SelectItem value="sick_leave">Sick Leave</SelectItem>
                          <SelectItem value="casual_leave">Casual Leave</SelectItem>
                          <SelectItem value="annual_leave">Annual Leave</SelectItem>
                          <SelectItem value="maternity_leave">Maternity Leave</SelectItem>
                          <SelectItem value="paternity_leave">Paternity Leave</SelectItem>
                          <SelectItem value="half_day">Half Day</SelectItem>
                          <SelectItem value="compensatory">Compensatory</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "requested"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-leave-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="requested">Requested</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="updated">Updated</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="dateFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date From</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          data-testid="input-leave-date-from"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            const to = form.getValues("dateTo");
                            if (to && e.target.value) {
                              form.setValue("numberOfDays", calculateDays(e.target.value, to));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date To</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          data-testid="input-leave-date-to"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            const from = form.getValues("dateFrom");
                            if (from && e.target.value) {
                              form.setValue("numberOfDays", calculateDays(from, e.target.value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numberOfDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. of Days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          data-testid="input-leave-days"
                          {...field}
                          value={field.value || 1}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Leave remarks..."
                        data-testid="input-leave-remarks"
                        className="resize-none"
                        rows={2}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Reason for leave..."
                        data-testid="input-leave-reason"
                        className="resize-none"
                        rows={2}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="approvedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approved By</FormLabel>
                    <FormControl>
                      <Input placeholder="Approver name" data-testid="input-leave-approved-by" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-leave">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-leave">
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingRecord ? "Update Leave" : "Add Leave"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function HolidayManagement() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [search, setSearch] = useState("");

  const { data: holidaysData, isLoading } = useQuery<Holiday[]>({
    queryKey: ["/api/holidays"],
  });

  const form = useForm<InsertHoliday>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: {
      name: "",
      date: "",
      description: "",
      type: "public",
      isRecurring: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertHoliday) => {
      const res = await apiRequest("POST", "/api/holidays", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Holiday created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertHoliday> }) => {
      const res = await apiRequest("PATCH", `/api/holidays/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      setDialogOpen(false);
      setEditingHoliday(null);
      form.reset();
      toast({ title: "Holiday updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/holidays/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      toast({ title: "Holiday deleted" });
    },
  });

  const openCreate = () => {
    setEditingHoliday(null);
    form.reset({
      name: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      type: "public",
      isRecurring: 0,
    });
    setDialogOpen(true);
  };

  const openEdit = (h: Holiday) => {
    setEditingHoliday(h);
    form.reset({
      name: h.name,
      date: h.date,
      description: h.description || "",
      type: h.type,
      isRecurring: h.isRecurring || 0,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertHoliday) => {
    if (editingHoliday) {
      updateMutation.mutate({ id: editingHoliday.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = useMemo(() => {
    return (holidaysData || []).filter((h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      (h.description || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [holidaysData, search]);

  const getDayName = (dateStr: string) => {
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" });
    } catch {
      return "";
    }
  };

  const typeBadge = (type: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      public: { label: "Public", className: "bg-emerald-500 text-white" },
      restricted: { label: "Restricted", className: "bg-amber-500 text-white" },
      optional: { label: "Optional", className: "bg-blue-500 text-white" },
      company: { label: "Company", className: "bg-violet-500 text-white" },
    };
    const config = configs[type] || configs.public;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-[300px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search holidays..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-[13px]"
            data-testid="input-search-holidays"
          />
        </div>
        <Button onClick={openCreate} data-testid="button-add-holiday" size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Holiday
        </Button>
      </div>

      <Card className="enterprise-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <TreePalm className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium text-sm">No holidays found</p>
              <p className="text-xs mt-1">Add public holidays for attendance tracking</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-[50px] text-[11px] font-semibold uppercase text-center">S.No</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[200px]">Holiday Name</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[120px]">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[100px]">Day</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[80px] text-center">Type</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[200px]">Description</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[80px] text-center">Recurring</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[100px] text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((holiday, idx) => (
                    <TableRow key={holiday.id} data-testid={`row-holiday-${holiday.id}`} className="group">
                      <TableCell className="text-center text-[13px] font-medium text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <span className="text-[13px] font-semibold" data-testid={`text-holiday-name-${holiday.id}`}>{holiday.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[13px] font-medium">{formatDate(holiday.date)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[12px] text-muted-foreground">{getDayName(holiday.date)}</span>
                      </TableCell>
                      <TableCell className="text-center">{typeBadge(holiday.type)}</TableCell>
                      <TableCell>
                        <span className="text-[12px] text-foreground">{holiday.description || <span className="text-muted-foreground">--</span>}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {holiday.isRecurring ? (
                          <Badge variant="secondary" className="no-default-active-elevate text-[10px] bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400">Yes</Badge>
                        ) : (
                          <Badge variant="secondary" className="no-default-active-elevate text-[10px]">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 no-default-hover-elevate no-default-active-elevate hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            onClick={() => openEdit(holiday)}
                            data-testid={`button-edit-holiday-${holiday.id}`}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 text-red-500 border-red-200 dark:border-red-800 no-default-hover-elevate no-default-active-elevate hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => deleteMutation.mutate(holiday.id)}
                            data-testid={`button-delete-holiday-${holiday.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingHoliday ? "Edit Holiday" : "Add Holiday"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Holiday Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Eid ul Fitr" data-testid="input-holiday-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" data-testid="input-holiday-date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "public"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-holiday-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public Holiday</SelectItem>
                          <SelectItem value="restricted">Restricted Holiday</SelectItem>
                          <SelectItem value="optional">Optional Holiday</SelectItem>
                          <SelectItem value="company">Company Holiday</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Holiday description..."
                        className="resize-none"
                        rows={2}
                        data-testid="input-holiday-description"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recurring Every Year</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={(field.value || 0).toString()}>
                      <FormControl>
                        <SelectTrigger data-testid="select-holiday-recurring">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">No</SelectItem>
                        <SelectItem value="1">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-holiday">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-holiday">
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingHoliday ? "Update Holiday" : "Add Holiday"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
