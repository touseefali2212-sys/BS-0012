import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  Clock,
  Calendar,
  AlertCircle,
  XCircle,
  Download,
  Timer,
  UserX,
  Eye,
  Coffee,
  Filter,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
  Smartphone,
  Monitor,
  X,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertAttendanceSchema, type Attendance, type InsertAttendance, type Employee, type AttendanceBreak } from "@shared/schema";
import { z } from "zod";

const attendanceFormSchema = insertAttendanceSchema.extend({
  employeeId: z.coerce.number().min(1, "Employee is required"),
  date: z.string().min(1, "Date is required"),
  status: z.string().min(1, "Status is required"),
});

type AttendanceWithEmployee = Attendance & {
  employeeName?: string;
  employeeCode?: string;
  employeeShift?: string;
};

function getDayName(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long" });
  } catch {
    return "";
  }
}

function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "";
  if (timeStr.includes(":")) {
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
      const h = parseInt(parts[0]);
      const m = parts[1];
      const s = parts.length >= 3 ? parts[2] : "00";
      return `${String(h).padStart(2, "0")}:${m}:${s}`;
    }
  }
  return timeStr;
}

export default function AttendancePage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
  const [breaksDialogOpen, setBreaksDialogOpen] = useState(false);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<number | null>(null);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [addBreakOpen, setAddBreakOpen] = useState(false);
  const [breakStart, setBreakStart] = useState("");
  const [breakEnd, setBreakEnd] = useState("");
  const [breakType, setBreakType] = useState("break");
  const [breakNotes, setBreakNotes] = useState("");

  const { data: attendanceRecords, isLoading } = useQuery<AttendanceWithEmployee[]>({
    queryKey: ["/api/attendance"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: breaks } = useQuery<AttendanceBreak[]>({
    queryKey: [`/api/attendance-breaks/${selectedAttendanceId}`],
    enabled: !!selectedAttendanceId,
  });

  const form = useForm<InsertAttendance>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      employeeId: 0,
      date: "",
      checkIn: "",
      checkOut: "",
      status: "present",
      hoursWorked: "",
      overtime: "0",
      notes: "",
      location: "",
      checkinLocation: "",
      checkoutLocation: "",
      checkinDevice: "device",
      checkoutDevice: "",
      shift: "",
      breakMinutes: 0,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertAttendance) => {
      const res = await apiRequest("POST", "/api/attendance", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Attendance record created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAttendance> }) => {
      const res = await apiRequest("PATCH", `/api/attendance/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      setDialogOpen(false);
      setEditingRecord(null);
      form.reset();
      toast({ title: "Attendance record updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/attendance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({ title: "Attendance record deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createBreakMutation = useMutation({
    mutationFn: async (data: { attendanceId: number; breakStart: string; breakEnd?: string; breakType: string; notes?: string }) => {
      const duration = data.breakEnd ? calculateDurationMinutes(data.breakStart, data.breakEnd) : undefined;
      const res = await apiRequest("POST", "/api/attendance-breaks", { ...data, duration });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-breaks", selectedAttendanceId] });
      setAddBreakOpen(false);
      setBreakStart("");
      setBreakEnd("");
      setBreakType("break");
      setBreakNotes("");
      toast({ title: "Break added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteBreakMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/attendance-breaks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-breaks", selectedAttendanceId] });
      toast({ title: "Break deleted" });
    },
  });

  function calculateDurationMinutes(start: string, end: string): number {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  }

  const openCreate = () => {
    setEditingRecord(null);
    form.reset({
      employeeId: 0,
      date: new Date().toISOString().split("T")[0],
      checkIn: "",
      checkOut: "",
      status: "present",
      hoursWorked: "",
      overtime: "0",
      notes: "",
      location: "",
      checkinLocation: "",
      checkoutLocation: "",
      checkinDevice: "device",
      checkoutDevice: "",
      shift: "",
      breakMinutes: 0,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
    });
    setDialogOpen(true);
  };

  const openEdit = (record: Attendance) => {
    setEditingRecord(record);
    form.reset({
      employeeId: record.employeeId,
      date: record.date,
      checkIn: record.checkIn || "",
      checkOut: record.checkOut || "",
      status: record.status,
      hoursWorked: record.hoursWorked || "",
      overtime: record.overtime || "0",
      notes: record.notes || "",
      location: record.location || "",
      checkinLocation: record.checkinLocation || "",
      checkoutLocation: record.checkoutLocation || "",
      checkinDevice: record.checkinDevice || "device",
      checkoutDevice: record.checkoutDevice || "",
      shift: record.shift || "",
      breakMinutes: record.breakMinutes || 0,
      lateMinutes: record.lateMinutes || 0,
      earlyLeaveMinutes: record.earlyLeaveMinutes || 0,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertAttendance) => {
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleExport = () => {
    window.open("/api/export/attendance", "_blank");
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setEmployeeFilter("all");
    setFromDate("");
    setToDate("");
    setSearch("");
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    return (attendanceRecords || []).filter((r) => {
      const empName = (r.employeeName || "").toLowerCase();
      const empCode = (r.employeeCode || "").toLowerCase();
      const matchSearch =
        empName.includes(search.toLowerCase()) ||
        empCode.includes(search.toLowerCase()) ||
        r.date.toLowerCase().includes(search.toLowerCase()) ||
        (r.notes || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchEmployee = employeeFilter === "all" || r.employeeId.toString() === employeeFilter;
      const matchFromDate = !fromDate || r.date >= fromDate;
      const matchToDate = !toDate || r.date <= toDate;
      return matchSearch && matchStatus && matchEmployee && matchFromDate && matchToDate;
    });
  }, [attendanceRecords, search, statusFilter, employeeFilter, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
  const paginatedRecords = filtered.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const allRecords = attendanceRecords || [];
  const today = new Date().toISOString().split("T")[0];
  const todayRecords = allRecords.filter((r) => r.date === today);
  const presentToday = todayRecords.filter((r) => r.status === "present" || r.status === "late").length;
  const absentToday = todayRecords.filter((r) => r.status === "absent").length;
  const lateToday = todayRecords.filter((r) => r.status === "late").length;
  const onLeaveToday = todayRecords.filter((r) => r.status === "leave" || r.status === "half_day").length;

  const statusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      present: { label: "Present", className: "bg-emerald-500 text-white border-emerald-500" },
      absent: { label: "Absent", className: "bg-red-500 text-white border-red-500" },
      late: { label: "Late", className: "bg-amber-500 text-white border-amber-500" },
      half_day: { label: "Half Day", className: "bg-orange-500 text-white border-orange-500" },
      leave: { label: "Leave", className: "bg-blue-500 text-white border-blue-500" },
    };
    const config = configs[status] || configs.present;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const deviceBadge = (device: string | null | undefined) => {
    if (!device) return <span className="text-muted-foreground">--</span>;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-muted/50 text-[11px] font-medium text-foreground">
        {device === "mobile" ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
        {device.charAt(0).toUpperCase() + device.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-attendance-title">
            HR & Payroll - Attendance
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Monitor and manage employee attendance, check-ins, and breaks
          </p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-attendance" size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Attendance
        </Button>
      </div>

      <Card className="enterprise-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Filter Status</label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 text-[13px]" data-testid="select-attendance-status-filter">
                  <SelectValue placeholder="Filter all list" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="half_day">Half Day</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
                className="h-9 text-[13px]"
                data-testid="input-from-date"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
                className="h-9 text-[13px]"
                data-testid="input-to-date"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[200px] flex-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Employee</label>
              <Select value={employeeFilter} onValueChange={(v) => { setEmployeeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 text-[13px]" data-testid="select-employee-filter">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {(employees || []).map((e) => (
                    <SelectItem key={e.id} value={e.id.toString()}>
                      {e.fullName} ({e.empCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-end">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleClearFilters}
                data-testid="button-clear-filters"
                className="h-9"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="enterprise-card" data-testid="card-present-today">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Present Today</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400" data-testid="text-present-today">{presentToday}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card" data-testid="card-absent-today">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Absent Today</p>
                <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400" data-testid="text-absent-today">{absentToday}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card" data-testid="card-late-today">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Late Today</p>
                <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400" data-testid="text-late-today">{lateToday}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card" data-testid="card-leave-today">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">On Leave</p>
                <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400" data-testid="text-leave-today">{onLeaveToday}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="enterprise-card">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 pb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-sm font-semibold">Attendance for today</h2>
              <Button variant="destructive" size="sm" onClick={handleExport} data-testid="button-export-pdf" className="h-7 text-[11px] px-3">
                <Download className="h-3 w-3 mr-1.5" />
                Download PDF
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 pb-3 gap-3">
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-muted-foreground">Show</span>
              <Select value={entriesPerPage.toString()} onValueChange={(v) => { setEntriesPerPage(parseInt(v)); setCurrentPage(1); }}>
                <SelectTrigger className="h-7 w-[65px] text-[12px]" data-testid="select-entries-per-page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">entries</span>
            </div>
            <div className="relative w-full max-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-8 h-8 text-[12px]"
                data-testid="input-search-attendance"
              />
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
              <UserCheck className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium text-sm">No attendance records found</p>
              <p className="text-xs mt-1">Adjust filters or add a new attendance record</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-[50px] text-[11px] font-semibold uppercase text-center">S.No</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[200px]">Employee</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[100px]">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[120px]">Check-in</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[120px]">Checkin-location</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[100px]">Check-out</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[120px]">Checkout-location</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[70px] text-center">Hours</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[80px] text-center">Type</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase min-w-[220px] text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.map((record, idx) => {
                    const serialNo = (currentPage - 1) * entriesPerPage + idx + 1;
                    const dayName = getDayName(record.date);
                    const empShift = record.shift || record.employeeShift || "";

                    return (
                      <TableRow
                        key={record.id}
                        data-testid={`row-attendance-${record.id}`}
                        className="group"
                      >
                        <TableCell className="text-center text-[13px] font-medium text-muted-foreground">
                          {serialNo}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-[13px] font-semibold text-foreground" data-testid={`text-employee-name-${record.id}`}>
                              {record.employeeName || `Employee #${record.employeeId}`}
                              {record.employeeCode && (
                                <span className="text-muted-foreground font-normal ml-1">(#{record.employeeCode})</span>
                              )}
                            </div>
                            {empShift && (
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {empShift}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-date-${record.id}`}>
                          <div className="text-[13px] font-medium">{record.date}</div>
                          {dayName && <div className="text-[11px] text-muted-foreground">{dayName}</div>}
                        </TableCell>
                        <TableCell data-testid={`text-checkin-${record.id}`}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-medium">{formatTime(record.checkIn) || "--"}</span>
                            {record.checkIn && deviceBadge(record.checkinDevice)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.checkinLocation ? (
                            <span className="text-[12px] text-foreground">{record.checkinLocation}</span>
                          ) : (
                            <span className="text-[12px] text-red-400 dark:text-red-500 font-medium">--</span>
                          )}
                        </TableCell>
                        <TableCell data-testid={`text-checkout-${record.id}`}>
                          {record.checkOut ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-medium">{formatTime(record.checkOut)}</span>
                              {record.checkoutDevice && deviceBadge(record.checkoutDevice)}
                            </div>
                          ) : (
                            <span className="text-[12px] text-red-400 dark:text-red-500 font-medium">--</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.checkoutLocation ? (
                            <span className="text-[12px] text-foreground">{record.checkoutLocation}</span>
                          ) : (
                            <span className="text-[12px] text-red-400 dark:text-red-500 font-medium">--</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center" data-testid={`text-hours-${record.id}`}>
                          {record.hoursWorked ? (
                            <span className="text-[13px] font-medium">{record.hoursWorked}h</span>
                          ) : (
                            <span className="text-[12px] text-red-400 dark:text-red-500 font-medium">--</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center" data-testid={`badge-status-${record.id}`}>
                          {statusBadge(record.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] px-2 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 no-default-hover-elevate no-default-active-elevate hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              onClick={() => {
                                setSelectedAttendanceId(record.id);
                                setBreaksDialogOpen(true);
                              }}
                              data-testid={`button-view-breaks-${record.id}`}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Breaks
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] px-2 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 no-default-hover-elevate no-default-active-elevate hover:bg-blue-50 dark:hover:bg-blue-950/30"
                              onClick={() => openEdit(record)}
                              data-testid={`button-edit-attendance-${record.id}`}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 border-red-200 dark:border-red-800 no-default-hover-elevate no-default-active-elevate hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => deleteMutation.mutate(record.id)}
                              data-testid={`button-delete-attendance-${record.id}`}
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
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  data-testid="button-page-first"
                >
                  <ChevronsLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  data-testid="button-page-prev"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      className="h-7 w-7 text-[11px]"
                      onClick={() => setCurrentPage(page)}
                      data-testid={`button-page-${page}`}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  data-testid="button-page-next"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  data-testid="button-page-last"
                >
                  <ChevronsRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingRecord ? "Edit Attendance Record" : "Add Attendance Record"}</DialogTitle>
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
                        <SelectTrigger data-testid="select-attendance-employee">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(employees || []).map((e) => (
                          <SelectItem key={e.id} value={e.id.toString()}>
                            {e.fullName} ({e.empCode})
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
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" data-testid="input-attendance-date" {...field} />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} value={field.value || "present"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-attendance-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                          <SelectItem value="half_day">Half Day</SelectItem>
                          <SelectItem value="leave">Leave</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="shift"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shift</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-attendance-shift">
                            <SelectValue placeholder="Select shift" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="morning">Morning - Full Time 9:45 - 05:45</SelectItem>
                          <SelectItem value="morning_10h">Morning 10 hours shift</SelectItem>
                          <SelectItem value="morning_9_7">Morning 9 - 7</SelectItem>
                          <SelectItem value="evening">Evening - Full Time 2:00 - 10:00</SelectItem>
                          <SelectItem value="night">Night Shift 10:00 - 6:00</SelectItem>
                          <SelectItem value="flexible">Flexible Hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="checkinDevice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check-in Device</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "device"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-attendance-checkin-device">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="device">Device</SelectItem>
                          <SelectItem value="mobile">Mobile</SelectItem>
                          <SelectItem value="web">Web</SelectItem>
                          <SelectItem value="biometric">Biometric</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="checkIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check In Time</FormLabel>
                      <FormControl>
                        <Input type="time" step="1" data-testid="input-attendance-checkin" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="checkOut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check Out Time</FormLabel>
                      <FormControl>
                        <Input type="time" step="1" data-testid="input-attendance-checkout" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="checkinLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check-in Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Office, Remote, Site..." data-testid="input-checkin-location" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="checkoutLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check-out Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Office, Remote, Site..." data-testid="input-checkout-location" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="hoursWorked"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours Worked</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" placeholder="8.0" data-testid="input-attendance-hours" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="overtime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overtime (hrs)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" placeholder="0" data-testid="input-attendance-overtime" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="breakMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Break (min)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" data-testid="input-break-minutes" {...field} value={field.value || 0} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lateMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Late (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" data-testid="input-late-minutes" {...field} value={field.value || 0} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="earlyLeaveMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Early Leave (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" data-testid="input-early-leave-minutes" {...field} value={field.value || 0} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes..."
                        data-testid="input-attendance-notes"
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

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-attendance">
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingRecord ? "Update Record" : "Add Record"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={breaksDialogOpen} onOpenChange={(open) => { setBreaksDialogOpen(open); if (!open) setSelectedAttendanceId(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-primary" />
              Break Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(breaks || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Coffee className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">No breaks recorded</p>
                <p className="text-xs mt-1">Add a break to track rest periods</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(breaks || []).map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
                        <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <div className="text-[13px] font-medium">
                          {b.breakStart} - {b.breakEnd || "Ongoing"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {b.breakType && <span className="capitalize">{b.breakType}</span>}
                          {b.duration && <span className="ml-2">{b.duration} min</span>}
                          {b.notes && <span className="ml-2">{b.notes}</span>}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500"
                      onClick={() => deleteBreakMutation.mutate(b.id)}
                      data-testid={`button-delete-break-${b.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            {addBreakOpen ? (
              <div className="space-y-3 p-3 rounded-lg bg-muted/20 border border-border">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Break Start</label>
                    <Input type="time" value={breakStart} onChange={(e) => setBreakStart(e.target.value)} className="h-8 text-[13px]" data-testid="input-break-start" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Break End</label>
                    <Input type="time" value={breakEnd} onChange={(e) => setBreakEnd(e.target.value)} className="h-8 text-[13px]" data-testid="input-break-end" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Break Type</label>
                    <Select value={breakType} onValueChange={setBreakType}>
                      <SelectTrigger className="h-8 text-[13px]" data-testid="select-break-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="break">Break</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="prayer">Prayer</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Notes</label>
                    <Input value={breakNotes} onChange={(e) => setBreakNotes(e.target.value)} placeholder="Optional" className="h-8 text-[13px]" data-testid="input-break-notes" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setAddBreakOpen(false)}>Cancel</Button>
                  <Button
                    size="sm"
                    disabled={!breakStart || createBreakMutation.isPending}
                    onClick={() => {
                      if (selectedAttendanceId && breakStart) {
                        createBreakMutation.mutate({
                          attendanceId: selectedAttendanceId,
                          breakStart,
                          breakEnd: breakEnd || undefined,
                          breakType,
                          notes: breakNotes || undefined,
                        });
                      }
                    }}
                    data-testid="button-save-break"
                  >
                    {createBreakMutation.isPending ? "Saving..." : "Save Break"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddBreakOpen(true)}
                className="w-full"
                data-testid="button-add-break"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Break
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
