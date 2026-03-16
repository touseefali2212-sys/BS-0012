import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  Users,
  Moon,
  Timer,
  RefreshCw,
  UserPlus,
  CalendarDays,
  Sun,
  Sunset,
  CloudMoon,
  CheckCircle,
  XCircle,
  Copy,
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";

const shiftTypeColors: Record<string, string> = {
  fixed: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  rotational: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  flexible: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
  split: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
};

const shiftTypeLabels: Record<string, string> = {
  fixed: "Fixed",
  rotational: "Rotational",
  flexible: "Flexible",
  split: "Split Shift",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  inactive: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  expired: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const deptColors: Record<string, string> = {
  engineering: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  support: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
  sales: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  finance: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  admin: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  management: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  hr: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
  it: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
  operations: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  noc: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
};

const defaultShiftColors = [
  { value: "#22c55e", label: "Green (Morning)" },
  { value: "#3b82f6", label: "Blue (Evening)" },
  { value: "#8b5cf6", label: "Purple (Night)" },
  { value: "#f97316", label: "Orange (Rotational)" },
  { value: "#ef4444", label: "Red (Overtime)" },
  { value: "#6b7280", label: "Gray (Off Day)" },
  { value: "#06b6d4", label: "Cyan (NOC)" },
  { value: "#ec4899", label: "Pink (Split)" },
];

function formatTime12(t: string) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

function calcHours(start: string, end: string): string {
  if (!start || !end) return "0";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return (mins / 60).toFixed(1);
}

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(baseDate: Date): Date[] {
  const d = new Date(baseDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return dt;
  });
}

export default function ShiftSchedulingPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("shifts");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDept, setFilterDept] = useState("all");

  const [shiftDialog, setShiftDialog] = useState(false);
  const [editShiftDialog, setEditShiftDialog] = useState(false);
  const [viewShiftDialog, setViewShiftDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [editAssignDialog, setEditAssignDialog] = useState(false);
  const [bulkAssignDialog, setBulkAssignDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [schedulePage, setSchedulePage] = useState(0);
  const schedulePageSize = 15;

  const [shiftName, setShiftName] = useState("");
  const [shiftCode, setShiftCode] = useState("");
  const [shiftBranch, setShiftBranch] = useState("");
  const [shiftDept, setShiftDept] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [breakMins, setBreakMins] = useState("60");
  const [paidBreak, setPaidBreak] = useState(false);
  const [overtimeAllowed, setOvertimeAllowed] = useState(false);
  const [overtimeAfter, setOvertimeAfter] = useState("8");
  const [overtimeMultiplier, setOvertimeMultiplier] = useState("1.5");
  const [lateGrace, setLateGrace] = useState("10");
  const [earlyExitGrace, setEarlyExitGrace] = useState("5");
  const [shiftType, setShiftType] = useState("fixed");
  const [nightAllowance, setNightAllowance] = useState("0");
  const [shiftAllowance, setShiftAllowance] = useState("0");
  const [shiftColor, setShiftColor] = useState("#3b82f6");
  const [shiftStatus, setShiftStatus] = useState("active");

  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [assignShiftId, setAssignShiftId] = useState("");
  const [assignFrom, setAssignFrom] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  const [bulkDept, setBulkDept] = useState("");
  const [bulkShiftId, setBulkShiftId] = useState("");
  const [bulkFrom, setBulkFrom] = useState("");
  const [bulkTo, setBulkTo] = useState("");

  const [calendarDate, setCalendarDate] = useState(new Date());

  const { data: shiftsData = [], isLoading: shiftsLoading } = useQuery<any[]>({
    queryKey: ["/api/shifts"],
  });

  const { data: assignments = [], isLoading: assignLoading } = useQuery<any[]>({
    queryKey: ["/api/shift-assignments"],
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  const createShiftMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/shifts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({ title: "Created", description: "Shift type created successfully" });
      setShiftDialog(false);
      resetShiftForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => await apiRequest("PATCH", `/api/shifts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({ title: "Updated", description: "Shift updated successfully" });
      setEditShiftDialog(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: number) => await apiRequest("DELETE", `/api/shifts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({ title: "Deleted", description: "Shift deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/shift-assignments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shift-assignments"] });
      toast({ title: "Assigned", description: "Shift assigned successfully" });
      setAssignDialog(false);
      setBulkAssignDialog(false);
      resetAssignForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => await apiRequest("PATCH", `/api/shift-assignments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shift-assignments"] });
      toast({ title: "Updated", description: "Assignment updated" });
      setEditAssignDialog(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: number) => await apiRequest("DELETE", `/api/shift-assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shift-assignments"] });
      toast({ title: "Removed", description: "Assignment removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function resetShiftForm() {
    setShiftName(""); setShiftCode(""); setShiftBranch(""); setShiftDept(""); setStartTime("09:00"); setEndTime("17:00");
    setBreakMins("60"); setPaidBreak(false); setOvertimeAllowed(false); setOvertimeAfter("8"); setOvertimeMultiplier("1.5");
    setLateGrace("10"); setEarlyExitGrace("5"); setShiftType("fixed"); setNightAllowance("0"); setShiftAllowance("0");
    setShiftColor("#3b82f6"); setShiftStatus("active");
  }

  function resetAssignForm() {
    setAssignEmployeeId(""); setAssignShiftId(""); setAssignFrom(""); setAssignTo(""); setAssignNotes("");
    setBulkDept(""); setBulkShiftId(""); setBulkFrom(""); setBulkTo("");
  }

  function buildShiftData() {
    return {
      name: shiftName, code: shiftCode, branch: shiftBranch || null, department: shiftDept || null,
      startTime, endTime, totalHours: calcHours(startTime, endTime), breakMinutes: parseInt(breakMins) || 0,
      paidBreak, overtimeAllowed, overtimeAfterHours: overtimeAfter, overtimeMultiplier,
      lateGraceMinutes: parseInt(lateGrace) || 10, earlyExitGraceMinutes: parseInt(earlyExitGrace) || 5,
      shiftType, nightShiftAllowance: nightAllowance, shiftAllowance, color: shiftColor, status: shiftStatus,
    };
  }

  function handleCreateShift() {
    if (!shiftName.trim() || !shiftCode.trim()) {
      toast({ title: "Error", description: "Shift name and code are required", variant: "destructive" }); return;
    }
    createShiftMutation.mutate(buildShiftData());
  }

  function handleUpdateShift() {
    if (!selectedShift) return;
    updateShiftMutation.mutate({ id: selectedShift.id, data: buildShiftData() });
  }

  function openEditShift(s: any) {
    setSelectedShift(s); setShiftName(s.name); setShiftCode(s.code); setShiftBranch(s.branch || ""); setShiftDept(s.department || "");
    setStartTime(s.startTime); setEndTime(s.endTime); setBreakMins(String(s.breakMinutes || 0)); setPaidBreak(s.paidBreak || false);
    setOvertimeAllowed(s.overtimeAllowed || false); setOvertimeAfter(s.overtimeAfterHours || "8"); setOvertimeMultiplier(s.overtimeMultiplier || "1.5");
    setLateGrace(String(s.lateGraceMinutes || 10)); setEarlyExitGrace(String(s.earlyExitGraceMinutes || 5));
    setShiftType(s.shiftType || "fixed"); setNightAllowance(s.nightShiftAllowance || "0"); setShiftAllowance(s.shiftAllowance || "0");
    setShiftColor(s.color || "#3b82f6"); setShiftStatus(s.status);
    setEditShiftDialog(true);
  }

  function handleAssignShift() {
    if (!assignEmployeeId || !assignShiftId || !assignFrom) {
      toast({ title: "Error", description: "Employee, shift and effective date are required", variant: "destructive" }); return;
    }
    createAssignmentMutation.mutate({
      employeeId: parseInt(assignEmployeeId), shiftId: parseInt(assignShiftId),
      effectiveFrom: assignFrom, effectiveTo: assignTo || null,
      assignmentType: "individual", assignedBy: "admin", notes: assignNotes || null,
      status: "active",
    });
  }

  function openEditAssignment(a: any) {
    setSelectedAssignment(a);
    setAssignEmployeeId(String(a.employeeId));
    setAssignShiftId(String(a.shiftId));
    setAssignFrom(a.effectiveFrom || "");
    setAssignTo(a.effectiveTo || "");
    setAssignNotes(a.notes || "");
    setEditAssignDialog(true);
  }

  function handleUpdateAssignment() {
    if (!selectedAssignment) return;
    if (!assignShiftId || !assignFrom) {
      toast({ title: "Error", description: "Shift and effective date are required", variant: "destructive" }); return;
    }
    updateAssignmentMutation.mutate({
      id: selectedAssignment.id,
      data: {
        shiftId: parseInt(assignShiftId),
        effectiveFrom: assignFrom,
        effectiveTo: assignTo || null,
        notes: assignNotes || null,
      },
    });
  }

  function handleBulkAssign() {
    if (!bulkDept || !bulkShiftId || !bulkFrom) {
      toast({ title: "Error", description: "Department, shift and effective date are required", variant: "destructive" }); return;
    }
    const deptEmployees = employees.filter((e: any) => e.department?.toLowerCase() === bulkDept.toLowerCase() && e.status === "active");
    if (deptEmployees.length === 0) {
      toast({ title: "No Employees", description: `No active employees in ${bulkDept} department`, variant: "destructive" }); return;
    }
    let completed = 0;
    deptEmployees.forEach((emp: any) => {
      createAssignmentMutation.mutate({
        employeeId: emp.id, shiftId: parseInt(bulkShiftId),
        effectiveFrom: bulkFrom, effectiveTo: bulkTo || null,
        assignmentType: "bulk", assignedBy: "admin",
        notes: `Bulk assigned to ${bulkDept} department`, status: "active",
      }, {
        onSuccess: () => {
          completed++;
          if (completed === deptEmployees.length) {
            toast({ title: "Bulk Assigned", description: `Shift assigned to ${deptEmployees.length} employees in ${bulkDept}` });
            setBulkAssignDialog(false); resetAssignForm();
          }
        },
      });
    });
  }

  const todayStr = new Date().toISOString().split("T")[0];

  const totalShifts = shiftsData.length;
  const activeShifts = shiftsData.filter((s: any) => s.status === "active").length;
  const assignedToday = assignments.filter((a: any) => {
    if (a.status !== "active") return false;
    const from = a.effectiveFrom || "";
    const to = a.effectiveTo || "9999-12-31";
    return todayStr >= from && todayStr <= to;
  }).length;
  const nightShifts = assignments.filter((a: any) => {
    if (a.status !== "active") return false;
    const from = a.effectiveFrom || "";
    const to = a.effectiveTo || "9999-12-31";
    if (todayStr < from || todayStr > to) return false;
    const shift = shiftsData.find((s: any) => s.id === a.shiftId);
    if (!shift) return false;
    const h = parseInt(shift.startTime?.split(":")[0] || "0");
    return h >= 20 || h < 6;
  }).length;
  const overtimeScheduled = shiftsData.filter((s: any) => s.overtimeAllowed && s.status === "active").length;
  const rotationalCount = shiftsData.filter((s: any) => s.shiftType === "rotational").length;

  const filteredShifts = useMemo(() => {
    let result = shiftsData;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s: any) => s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q));
    }
    if (filterType !== "all") result = result.filter((s: any) => s.shiftType === filterType);
    if (filterStatus !== "all") result = result.filter((s: any) => s.status === filterStatus);
    return result;
  }, [shiftsData, searchQuery, filterType, filterStatus]);

  const filteredAssignments = useMemo(() => {
    let result = assignments;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a: any) => a.employeeName?.toLowerCase().includes(q) || a.empCode?.toLowerCase().includes(q) || a.shiftName?.toLowerCase().includes(q));
    }
    if (filterDept !== "all") result = result.filter((a: any) => a.department?.toLowerCase() === filterDept);
    if (filterStatus !== "all") result = result.filter((a: any) => a.status === filterStatus);
    return result;
  }, [assignments, searchQuery, filterDept, filterStatus]);

  const weekDates = useMemo(() => getWeekDates(calendarDate), [calendarDate]);

  const scheduleGrid = useMemo(() => {
    const allActiveEmps = employees.filter((e: any) => e.status === "active");
    const startIdx = schedulePage * schedulePageSize;
    const activeEmps = allActiveEmps.slice(startIdx, startIdx + schedulePageSize);
    return activeEmps.map((emp: any) => {
      const empAssignments = assignments.filter((a: any) => a.employeeId === emp.id && a.status === "active");
      const cells = weekDates.map(date => {
        const dateStr = date.toISOString().split("T")[0];
        const assign = empAssignments.find((a: any) => {
          const from = a.effectiveFrom;
          const to = a.effectiveTo || "9999-12-31";
          return dateStr >= from && dateStr <= to;
        });
        if (assign) {
          const shift = shiftsData.find((s: any) => s.id === assign.shiftId);
          const weekendDays = (assign.weekendDays || "friday,saturday").split(",").map((d: string) => d.trim().toLowerCase());
          const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];
          if (weekendDays.includes(dayName)) {
            return { type: "off", label: "OFF", color: "#6b7280" };
          }
          return {
            type: "shift",
            label: shift?.code || assign.shiftCode || "?",
            name: shift?.name || assign.shiftName || "",
            time: shift ? `${formatTime12(shift.startTime)} - ${formatTime12(shift.endTime)}` : "",
            color: shift?.color || assign.shiftColor || "#3b82f6",
          };
        }
        return { type: "unassigned", label: "—", color: "#d1d5db" };
      });
      return { emp, cells };
    });
  }, [employees, assignments, shiftsData, weekDates, schedulePage]);

  const shiftDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    assignments.filter((a: any) => a.status === "active").forEach((a: any) => {
      const name = a.shiftName || "Unknown";
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [assignments]);

  const deptCoverage = useMemo(() => {
    const deptTotals: Record<string, number> = {};
    const deptAssigned: Record<string, number> = {};
    employees.filter((e: any) => e.status === "active").forEach((e: any) => {
      const d = e.department || "other";
      deptTotals[d] = (deptTotals[d] || 0) + 1;
    });
    assignments.filter((a: any) => a.status === "active").forEach((a: any) => {
      const d = a.department || "other";
      deptAssigned[d] = (deptAssigned[d] || 0) + 1;
    });
    return Object.entries(deptTotals).map(([dept, total]) => ({
      dept,
      total,
      assigned: deptAssigned[dept] || 0,
      pct: total > 0 ? Math.round(((deptAssigned[dept] || 0) / total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);
  }, [employees, assignments]);

  if (shiftsLoading || assignLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const shiftFormFields = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Basic Information</p>
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Shift Name</label>
          <Input value={shiftName} onChange={e => setShiftName(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. Morning, Night, NOC 24/7" data-testid="input-shift-name" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Shift Code</label>
          <Input value={shiftCode} onChange={e => setShiftCode(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. MOR-01, NGT-01" data-testid="input-shift-code" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Branch</label>
          <Input value={shiftBranch} onChange={e => setShiftBranch(e.target.value)} className="h-9 text-[13px]" placeholder="Main Office" data-testid="input-shift-branch" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Department</label>
          <Select value={shiftDept} onValueChange={setShiftDept}>
            <SelectTrigger className="h-9 text-[13px]" data-testid="select-shift-dept"><SelectValue placeholder="Optional..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all_departments">All Departments</SelectItem>
              {["engineering", "support", "sales", "finance", "admin", "management", "hr", "it", "operations", "noc"].map(d => (
                <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Timing Configuration</p>
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Start Time</label>
          <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-9 text-[13px]" data-testid="input-start-time" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">End Time</label>
          <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-9 text-[13px]" data-testid="input-end-time" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Total Working Hours</label>
          <Input value={calcHours(startTime, endTime)} readOnly className="h-9 text-[13px] bg-muted/50 font-bold" data-testid="input-total-hours" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Break Time (Minutes)</label>
          <Input type="number" value={breakMins} onChange={e => setBreakMins(e.target.value)} className="h-9 text-[13px]" data-testid="input-break-mins" />
        </div>
        <div className="col-span-2 flex items-center justify-between bg-muted/30 rounded-xl p-3">
          <label className="text-[12px] font-medium text-muted-foreground">Paid Break</label>
          <Switch checked={paidBreak} onCheckedChange={setPaidBreak} data-testid="switch-paid-break" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Overtime Settings</p>
        </div>
        <div className="col-span-2 flex items-center justify-between bg-muted/30 rounded-xl p-3">
          <label className="text-[12px] font-medium text-muted-foreground">Overtime Allowed</label>
          <Switch checked={overtimeAllowed} onCheckedChange={setOvertimeAllowed} data-testid="switch-overtime" />
        </div>
        {overtimeAllowed && (
          <>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Overtime After (Hours)</label>
              <Input type="number" value={overtimeAfter} onChange={e => setOvertimeAfter(e.target.value)} className="h-9 text-[13px]" data-testid="input-overtime-after" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Overtime Rate Multiplier</label>
              <Select value={overtimeMultiplier} onValueChange={setOvertimeMultiplier}>
                <SelectTrigger className="h-9 text-[13px]" data-testid="select-overtime-multiplier"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.5">1.5x</SelectItem>
                  <SelectItem value="2.0">2.0x</SelectItem>
                  <SelectItem value="2.5">2.5x</SelectItem>
                  <SelectItem value="3.0">3.0x</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Grace Period</p>
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Late Grace (Minutes)</label>
          <Input type="number" value={lateGrace} onChange={e => setLateGrace(e.target.value)} className="h-9 text-[13px]" data-testid="input-late-grace" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Early Exit Grace (Minutes)</label>
          <Input type="number" value={earlyExitGrace} onChange={e => setEarlyExitGrace(e.target.value)} className="h-9 text-[13px]" data-testid="input-early-exit-grace" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Shift Configuration</p>
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Shift Type</label>
          <Select value={shiftType} onValueChange={setShiftType}>
            <SelectTrigger className="h-9 text-[13px]" data-testid="select-shift-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed</SelectItem>
              <SelectItem value="rotational">Rotational</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
              <SelectItem value="split">Split Shift</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Status</label>
          <Select value={shiftStatus} onValueChange={setShiftStatus}>
            <SelectTrigger className="h-9 text-[13px]" data-testid="select-shift-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Night Shift Allowance (PKR)</label>
          <Input type="number" value={nightAllowance} onChange={e => setNightAllowance(e.target.value)} className="h-9 text-[13px]" data-testid="input-night-allowance" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Shift Allowance (PKR)</label>
          <Input type="number" value={shiftAllowance} onChange={e => setShiftAllowance(e.target.value)} className="h-9 text-[13px]" data-testid="input-shift-allowance" />
        </div>
        <div className="col-span-2">
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Shift Color</label>
          <div className="flex flex-wrap gap-2">
            {defaultShiftColors.map(c => (
              <button
                key={c.value}
                className={`h-8 w-8 rounded-lg border-2 transition-all ${shiftColor === c.value ? "border-foreground scale-110 shadow-lg" : "border-transparent"}`}
                style={{ backgroundColor: c.value }}
                onClick={() => setShiftColor(c.value)}
                title={c.label}
                type="button"
                data-testid={`color-${c.value}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground" data-testid="text-page-title">Shift & Scheduling</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Manage shifts, assign schedules, configure overtime & attendance rules</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-[11px]" data-testid="button-export">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Shifts", value: totalShifts, icon: Clock, color: "blue" },
          { label: "Assigned Today", value: assignedToday, icon: Users, color: "teal" },
          { label: "Night Shift", value: nightShifts, icon: Moon, color: "purple" },
          { label: "Overtime Enabled", value: overtimeScheduled, icon: Timer, color: "red" },
          { label: "Rotational Shifts", value: rotationalCount, icon: RefreshCw, color: "orange" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="enterprise-card" data-testid={`card-${card.label.toLowerCase().replace(/\s/g, "-")}`}>
              <CardContent className="py-3.5 px-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                    <p className={`text-2xl font-bold mt-1 text-${card.color}-600 dark:text-${card.color}-400`}>{card.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-xl bg-${card.color}-100 dark:bg-${card.color}-950/50 flex items-center justify-center`}>
                    <card.icon className={`h-5 w-5 text-${card.color}-600 dark:text-${card.color}-400`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="shifts" className="text-[12px] gap-1.5" data-testid="tab-shifts">
            <Clock className="h-3.5 w-3.5" /> Shift Types
          </TabsTrigger>
          <TabsTrigger value="assignments" className="text-[12px] gap-1.5" data-testid="tab-assignments">
            <UserPlus className="h-3.5 w-3.5" /> Assignments
          </TabsTrigger>
          <TabsTrigger value="schedule" className="text-[12px] gap-1.5" data-testid="tab-schedule">
            <CalendarDays className="h-3.5 w-3.5" /> Schedule Calendar
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-[12px] gap-1.5" data-testid="tab-analytics">
            <Zap className="h-3.5 w-3.5" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* Shift Types Tab */}
        <TabsContent value="shifts" className="mt-4 space-y-3">
          <Card className="enterprise-card">
            <CardContent className="py-3 px-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  className="gap-1.5 text-[11px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
                  onClick={() => { resetShiftForm(); setShiftDialog(true); }}
                  data-testid="button-add-shift"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Shift
                </Button>
                <div className="flex-1" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-9 text-[13px] w-[130px]" data-testid="select-filter-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="rotational">Rotational</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                    <SelectItem value="split">Split</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 text-[13px] w-[120px]" data-testid="select-filter-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-9 text-[13px] pl-8 w-[180px]" placeholder="Search shifts..." data-testid="input-search-shifts" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="enterprise-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                    <th className="text-left py-2.5 px-3 font-semibold">#</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Shift Name</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Code</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Start</th>
                    <th className="text-center py-2.5 px-3 font-semibold">End</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Hours</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Type</th>
                    <th className="text-center py-2.5 px-3 font-semibold">OT</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Grace</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Status</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShifts.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Clock className="h-8 w-8 text-muted-foreground/40" />
                          <p className="text-[13px] font-medium">No shifts configured</p>
                          <p className="text-[11px]">Click "Add Shift" to create one</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredShifts.map((s: any, idx: number) => (
                      <tr key={s.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "bg-background" : "bg-muted/10"}`} data-testid={`row-shift-${s.id}`}>
                        <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color || "#3b82f6" }} />
                            <span className="font-medium text-foreground">{s.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <Badge variant="secondary" className="text-[10px] font-mono font-bold border-0">{s.code}</Badge>
                        </td>
                        <td className="py-2 px-3 text-center font-medium text-foreground">{formatTime12(s.startTime)}</td>
                        <td className="py-2 px-3 text-center font-medium text-foreground">{formatTime12(s.endTime)}</td>
                        <td className="py-2 px-3 text-center">
                          <Badge variant="secondary" className="text-[10px] font-bold border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">{s.totalHours}h</Badge>
                        </td>
                        <td className="py-2 px-3">
                          <Badge variant="secondary" className={`text-[10px] font-medium border-0 ${shiftTypeColors[s.shiftType] || shiftTypeColors.fixed}`}>
                            {shiftTypeLabels[s.shiftType] || s.shiftType}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {s.overtimeAllowed ? (
                            <Badge variant="secondary" className="text-[10px] font-bold border-0 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">{s.overtimeMultiplier}x</Badge>
                          ) : <XCircle className="h-4 w-4 text-muted-foreground/40 mx-auto" />}
                        </td>
                        <td className="py-2 px-3 text-center text-[11px] text-muted-foreground">{s.lateGraceMinutes}m</td>
                        <td className="py-2 px-3 text-center">
                          <Badge variant="secondary" className={`text-[10px] font-semibold border-0 capitalize ${statusColors[s.status]}`}>{s.status}</Badge>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="outline" size="sm" className="px-2 text-blue-600" onClick={() => { setSelectedShift(s); setViewShiftDialog(true); }} data-testid={`button-view-shift-${s.id}`}><Eye className="h-3 w-3" /></Button>
                            <Button variant="outline" size="sm" className="px-2 text-amber-600" onClick={() => openEditShift(s)} data-testid={`button-edit-shift-${s.id}`}><Edit className="h-3 w-3" /></Button>
                            <Button variant="outline" size="sm" className="px-2 text-red-600" onClick={() => { if (confirm("Delete this shift?")) deleteShiftMutation.mutate(s.id); }} data-testid={`button-delete-shift-${s.id}`}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="mt-4 space-y-3">
          <Card className="enterprise-card">
            <CardContent className="py-3 px-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  className="gap-1.5 text-[11px] bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white border-0"
                  onClick={() => { resetAssignForm(); setAssignDialog(true); }}
                  data-testid="button-assign-individual"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Individual Assign
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-[11px]"
                  onClick={() => { resetAssignForm(); setBulkAssignDialog(true); }}
                  data-testid="button-assign-bulk"
                >
                  <Users className="h-3.5 w-3.5" /> Bulk Assign
                </Button>
                <div className="flex-1" />
                <Select value={filterDept} onValueChange={setFilterDept}>
                  <SelectTrigger className="h-9 text-[13px] w-[130px]" data-testid="select-filter-dept"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Depts</SelectItem>
                    {["engineering", "support", "sales", "finance", "admin", "management", "hr", "it", "operations", "noc"].map(d => (
                      <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 text-[13px] w-[120px]" data-testid="select-filter-status-assign"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-9 text-[13px] pl-8 w-[180px]" placeholder="Search assignments..." data-testid="input-search-assignments" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="enterprise-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                    <th className="text-left py-2.5 px-3 font-semibold">#</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Employee</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Department</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Shift</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Timing</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Effective From</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Effective To</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Type</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Status</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <UserPlus className="h-8 w-8 text-muted-foreground/40" />
                          <p className="text-[13px] font-medium">No shift assignments</p>
                          <p className="text-[11px]">Assign shifts to employees using the buttons above</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAssignments.map((a: any, idx: number) => (
                      <tr key={a.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "bg-background" : "bg-muted/10"}`} data-testid={`row-assignment-${a.id}`}>
                        <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div>
                            <p className="font-medium text-foreground">{a.employeeName || "—"}</p>
                            <p className="text-[10px] text-muted-foreground">{a.empCode || ""}</p>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          {a.department ? (
                            <Badge variant="secondary" className={`text-[10px] font-medium border-0 ${deptColors[a.department] || deptColors.admin}`}>{a.department}</Badge>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: a.shiftColor || "#3b82f6" }} />
                            <span className="font-medium text-foreground">{a.shiftName || "—"}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center text-[11px] text-muted-foreground">
                          {a.shiftStartTime && a.shiftEndTime ? `${formatTime12(a.shiftStartTime)} - ${formatTime12(a.shiftEndTime)}` : "—"}
                        </td>
                        <td className="py-2 px-3 text-foreground text-[11px]">{a.effectiveFrom}</td>
                        <td className="py-2 px-3 text-muted-foreground text-[11px]">{a.effectiveTo || "Ongoing"}</td>
                        <td className="py-2 px-3">
                          <Badge variant="secondary" className="text-[10px] font-medium border-0 capitalize">{a.assignmentType}</Badge>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Badge variant="secondary" className={`text-[10px] font-semibold border-0 capitalize ${statusColors[a.status]}`}>{a.status}</Badge>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="outline" size="sm" className="px-2 text-amber-600" onClick={() => openEditAssignment(a)} data-testid={`button-edit-assignment-${a.id}`}><Edit className="h-3 w-3" /></Button>
                            <Button variant="outline" size="sm" className="px-2 text-red-600" onClick={() => { if (confirm("Remove this assignment?")) deleteAssignmentMutation.mutate(a.id); }} data-testid={`button-delete-assignment-${a.id}`}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Schedule Calendar Tab */}
        <TabsContent value="schedule" className="mt-4 space-y-3">
          <Card className="enterprise-card">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="px-2" onClick={() => { const d = new Date(calendarDate); d.setDate(d.getDate() - 7); setCalendarDate(d); }} data-testid="button-prev-week">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <p className="text-[13px] font-bold text-foreground min-w-[200px] text-center">
                    {weekDates[0]?.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {weekDates[6]?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <Button variant="outline" size="sm" className="px-2" onClick={() => { const d = new Date(calendarDate); d.setDate(d.getDate() + 7); setCalendarDate(d); }} data-testid="button-next-week">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="text-[11px] gap-1.5" onClick={() => setCalendarDate(new Date())} data-testid="button-today">
                  <Calendar className="h-3.5 w-3.5" /> Today
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="enterprise-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                    <th className="text-left py-2.5 px-3 font-semibold min-w-[160px]">Employee</th>
                    {weekDates.map((d, i) => {
                      const isToday = d.toDateString() === new Date().toDateString();
                      return (
                        <th key={i} className={`text-center py-2.5 px-2 font-semibold min-w-[90px] ${isToday ? "bg-blue-700/50" : ""}`}>
                          <div className="text-[10px] opacity-70">{weekdays[i]}</div>
                          <div className="text-[12px]">{d.getDate()}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {scheduleGrid.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
                          <p className="text-[13px] font-medium">No schedule data</p>
                          <p className="text-[11px]">Add employees and assign shifts to see the schedule</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    scheduleGrid.map((row, rowIdx) => (
                      <tr key={row.emp.id} className={`border-b border-border/50 ${rowIdx % 2 === 0 ? "bg-background" : "bg-muted/10"}`} data-testid={`schedule-row-${row.emp.id}`}>
                        <td className="py-1.5 px-3">
                          <div>
                            <p className="text-[11px] font-medium text-foreground truncate max-w-[140px]">{row.emp.fullName}</p>
                            <p className="text-[9px] text-muted-foreground">{row.emp.empCode} • {row.emp.department}</p>
                          </div>
                        </td>
                        {row.cells.map((cell: any, cellIdx: number) => {
                          const isToday = weekDates[cellIdx]?.toDateString() === new Date().toDateString();
                          return (
                            <td key={cellIdx} className={`py-1.5 px-1 text-center ${isToday ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}>
                              {cell.type === "shift" ? (
                                <div
                                  className="rounded-lg py-1.5 px-1 text-white text-[10px] font-bold cursor-default group relative"
                                  style={{ backgroundColor: cell.color }}
                                  title={`${cell.name}\n${cell.time}`}
                                >
                                  {cell.label}
                                  <div className="hidden group-hover:block absolute z-10 left-1/2 -translate-x-1/2 top-full mt-1 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl min-w-[120px]">
                                    <p className="font-bold">{cell.name}</p>
                                    <p className="opacity-80">{cell.time}</p>
                                  </div>
                                </div>
                              ) : cell.type === "off" ? (
                                <div className="rounded-lg py-1.5 px-1 text-[10px] font-bold bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                  OFF
                                </div>
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {(() => {
            const allActive = employees.filter((e: any) => e.status === "active");
            const totalPages = Math.ceil(allActive.length / schedulePageSize);
            if (totalPages <= 1) return null;
            return (
              <Card className="enterprise-card">
                <CardContent className="py-2 px-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">
                      Showing {schedulePage * schedulePageSize + 1}–{Math.min((schedulePage + 1) * schedulePageSize, allActive.length)} of {allActive.length} employees
                    </p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="px-2" disabled={schedulePage === 0} onClick={() => setSchedulePage(p => p - 1)} data-testid="button-schedule-prev">
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-[11px] font-medium text-foreground px-2">Page {schedulePage + 1}/{totalPages}</span>
                      <Button variant="outline" size="sm" className="px-2" disabled={schedulePage >= totalPages - 1} onClick={() => setSchedulePage(p => p + 1)} data-testid="button-schedule-next">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          <div className="flex flex-wrap gap-3">
            {shiftsData.filter((s: any) => s.status === "active").map((s: any) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color || "#3b82f6" }} />
                <span className="text-[11px] text-muted-foreground">{s.name} ({s.code})</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-gray-400" />
              <span className="text-[11px] text-muted-foreground">Off Day</span>
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="enterprise-card">
              <CardContent className="py-4 px-4">
                <p className="text-[13px] font-bold text-foreground mb-3">Shift Distribution</p>
                <div className="space-y-2.5">
                  {shiftDistribution.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-4">No assignments yet</p>
                  ) : (
                    shiftDistribution.map(([name, count]) => {
                      const shift = shiftsData.find((s: any) => s.name === name);
                      const max = shiftDistribution[0]?.[1] || 1;
                      const pct = (count as number / (max as number)) * 100;
                      return (
                        <div key={name} className="flex items-center gap-3">
                          <div className="flex items-center gap-2 w-[120px]">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: shift?.color || "#3b82f6" }} />
                            <span className="text-[11px] font-medium text-foreground truncate">{name}</span>
                          </div>
                          <div className="flex-1 h-5 bg-muted/50 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: shift?.color || "#3b82f6" }} />
                          </div>
                          <span className="text-[11px] font-bold tabular-nums text-foreground w-[30px] text-right">{count}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="enterprise-card">
              <CardContent className="py-4 px-4">
                <p className="text-[13px] font-bold text-foreground mb-3">Department Shift Coverage</p>
                <div className="space-y-2.5">
                  {deptCoverage.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-4">No data</p>
                  ) : (
                    deptCoverage.map(({ dept, total, assigned, pct }) => (
                      <div key={dept} className="flex items-center gap-3">
                        <Badge variant="secondary" className={`text-[10px] font-medium border-0 w-[90px] justify-center ${deptColors[dept] || deptColors.admin}`}>{dept}</Badge>
                        <div className="flex-1 h-5 bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold tabular-nums text-foreground w-[70px] text-right">{assigned}/{total} ({pct}%)</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="enterprise-card">
              <CardContent className="py-4 px-4">
                <p className="text-[13px] font-bold text-foreground mb-3">Shift Summary</p>
                <div className="grid grid-cols-2 gap-3">
                  {shiftsData.filter((s: any) => s.status === "active").map((s: any) => {
                    const assignCount = assignments.filter((a: any) => a.shiftId === s.id && a.status === "active").length;
                    return (
                      <div key={s.id} className="bg-muted/30 rounded-xl p-3 flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-[12px] font-bold" style={{ backgroundColor: s.color || "#3b82f6" }}>
                          {s.code?.substring(0, 3)}
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-foreground">{s.name}</p>
                          <p className="text-[10px] text-muted-foreground">{formatTime12(s.startTime)} – {formatTime12(s.endTime)}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{assignCount} employees assigned</p>
                        </div>
                      </div>
                    );
                  })}
                  {shiftsData.filter((s: any) => s.status === "active").length === 0 && (
                    <div className="col-span-2 text-center py-4 text-[11px] text-muted-foreground">No active shifts</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="enterprise-card">
              <CardContent className="py-4 px-4">
                <p className="text-[13px] font-bold text-foreground mb-3">Overtime & Allowances Overview</p>
                <div className="space-y-3">
                  {shiftsData.filter((s: any) => s.status === "active").map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color || "#3b82f6" }} />
                        <span className="text-[11px] font-medium text-foreground">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {s.overtimeAllowed ? (
                          <Badge variant="secondary" className="text-[9px] font-bold border-0 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">OT {s.overtimeMultiplier}x</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] font-bold border-0">No OT</Badge>
                        )}
                        {parseFloat(s.nightShiftAllowance || "0") > 0 && (
                          <Badge variant="secondary" className="text-[9px] font-bold border-0 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">Night: PKR {s.nightShiftAllowance}</Badge>
                        )}
                        {parseFloat(s.shiftAllowance || "0") > 0 && (
                          <Badge variant="secondary" className="text-[9px] font-bold border-0 bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">Allow: PKR {s.shiftAllowance}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {shiftsData.filter((s: any) => s.status === "active").length === 0 && (
                    <p className="text-[11px] text-muted-foreground text-center py-4">No active shifts</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Shift Dialog */}
      <Dialog open={shiftDialog} onOpenChange={setShiftDialog}>
        <DialogContent className="max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2"><Plus className="h-5 w-5 text-blue-600" /> Add Shift</DialogTitle>
            <DialogDescription className="text-[12px]">Configure a new shift type with timing, overtime and grace rules</DialogDescription>
          </DialogHeader>
          {shiftFormFields}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShiftDialog(false)} data-testid="button-cancel-shift">Cancel</Button>
            <Button size="sm" onClick={handleCreateShift} disabled={createShiftMutation.isPending} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0" data-testid="button-submit-shift">
              {createShiftMutation.isPending ? "Saving..." : "Save Shift"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog open={editShiftDialog} onOpenChange={setEditShiftDialog}>
        <DialogContent className="max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2"><Edit className="h-5 w-5 text-amber-600" /> Edit Shift</DialogTitle>
            <DialogDescription className="text-[12px]">Update shift configuration</DialogDescription>
          </DialogHeader>
          {shiftFormFields}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setEditShiftDialog(false)} data-testid="button-cancel-edit-shift">Cancel</Button>
            <Button size="sm" onClick={handleUpdateShift} disabled={updateShiftMutation.isPending} data-testid="button-update-shift">
              {updateShiftMutation.isPending ? "Saving..." : "Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Shift Dialog */}
      <Dialog open={viewShiftDialog} onOpenChange={setViewShiftDialog}>
        <DialogContent className="max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2"><Eye className="h-5 w-5 text-blue-600" /> Shift Details</DialogTitle>
            <DialogDescription className="text-[12px]">{selectedShift?.name} ({selectedShift?.code})</DialogDescription>
          </DialogHeader>
          {selectedShift && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white text-[14px] font-bold" style={{ backgroundColor: selectedShift.color || "#3b82f6" }}>
                  {selectedShift.code?.substring(0, 3)}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-foreground">{selectedShift.name}</p>
                  <p className="text-[11px] text-muted-foreground">{formatTime12(selectedShift.startTime)} – {formatTime12(selectedShift.endTime)} ({selectedShift.totalHours}h)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-xl p-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Shift Type</p>
                  <Badge variant="secondary" className={`text-[10px] font-medium border-0 mt-1 ${shiftTypeColors[selectedShift.shiftType] || shiftTypeColors.fixed}`}>
                    {shiftTypeLabels[selectedShift.shiftType] || selectedShift.shiftType}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
                  <Badge variant="secondary" className={`text-[10px] font-semibold border-0 capitalize mt-1 ${statusColors[selectedShift.status]}`}>{selectedShift.status}</Badge>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Break Time</p>
                  <p className="text-[12px] font-medium text-foreground">{selectedShift.breakMinutes} mins {selectedShift.paidBreak ? "(Paid)" : "(Unpaid)"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Branch</p>
                  <p className="text-[12px] font-medium text-foreground">{selectedShift.branch || "All"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  {selectedShift.overtimeAllowed ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-400" />}
                  <div>
                    <span className="text-[11px] font-medium text-foreground">Overtime</span>
                    {selectedShift.overtimeAllowed && (
                      <p className="text-[10px] text-muted-foreground">After {selectedShift.overtimeAfterHours}h at {selectedShift.overtimeMultiplier}x</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Grace Period</p>
                  <p className="text-[11px] text-foreground">Late: {selectedShift.lateGraceMinutes}m | Early: {selectedShift.earlyExitGraceMinutes}m</p>
                </div>
              </div>
              {(parseFloat(selectedShift.nightShiftAllowance || "0") > 0 || parseFloat(selectedShift.shiftAllowance || "0") > 0) && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Allowances</p>
                  <div className="flex gap-2">
                    {parseFloat(selectedShift.nightShiftAllowance || "0") > 0 && (
                      <Badge variant="secondary" className="text-[10px] font-bold border-0 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">Night: PKR {selectedShift.nightShiftAllowance}</Badge>
                    )}
                    {parseFloat(selectedShift.shiftAllowance || "0") > 0 && (
                      <Badge variant="secondary" className="text-[10px] font-bold border-0 bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">Shift: PKR {selectedShift.shiftAllowance}</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Individual Assignment Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2"><UserPlus className="h-5 w-5 text-teal-600" /> Assign Shift</DialogTitle>
            <DialogDescription className="text-[12px]">Assign a shift to an individual employee</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Employee</label>
              <Select value={assignEmployeeId} onValueChange={setAssignEmployeeId}>
                <SelectTrigger className="h-9 text-[13px]" data-testid="select-assign-employee"><SelectValue placeholder="Select employee..." /></SelectTrigger>
                <SelectContent>
                  {employees.filter((e: any) => e.status === "active").map((e: any) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.fullName} ({e.empCode})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Shift</label>
              <Select value={assignShiftId} onValueChange={setAssignShiftId}>
                <SelectTrigger className="h-9 text-[13px]" data-testid="select-assign-shift"><SelectValue placeholder="Select shift..." /></SelectTrigger>
                <SelectContent>
                  {shiftsData.filter((s: any) => s.status === "active").map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color || "#3b82f6" }} />
                        {s.name} ({formatTime12(s.startTime)} - {formatTime12(s.endTime)})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Effective From</label>
              <Input type="date" value={assignFrom} onChange={e => setAssignFrom(e.target.value)} className="h-9 text-[13px]" data-testid="input-assign-from" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Effective To (Optional)</label>
              <Input type="date" value={assignTo} onChange={e => setAssignTo(e.target.value)} className="h-9 text-[13px]" data-testid="input-assign-to" />
            </div>
            <div className="col-span-2">
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Notes</label>
              <Textarea value={assignNotes} onChange={e => setAssignNotes(e.target.value)} className="text-[13px] min-h-[50px]" placeholder="Optional notes..." data-testid="input-assign-notes" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setAssignDialog(false)} data-testid="button-cancel-assign">Cancel</Button>
            <Button size="sm" onClick={handleAssignShift} disabled={createAssignmentMutation.isPending} className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-0" data-testid="button-submit-assign">
              {createAssignmentMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Assignment Dialog */}
      <Dialog open={bulkAssignDialog} onOpenChange={setBulkAssignDialog}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2"><Users className="h-5 w-5 text-indigo-600" /> Bulk Assign Shift</DialogTitle>
            <DialogDescription className="text-[12px]">Assign shift to all employees in a department</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Department</label>
              <Select value={bulkDept} onValueChange={setBulkDept}>
                <SelectTrigger className="h-9 text-[13px]" data-testid="select-bulk-dept"><SelectValue placeholder="Select department..." /></SelectTrigger>
                <SelectContent>
                  {["engineering", "support", "sales", "finance", "admin", "management", "hr", "it", "operations", "noc"].map(d => (
                    <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Shift</label>
              <Select value={bulkShiftId} onValueChange={setBulkShiftId}>
                <SelectTrigger className="h-9 text-[13px]" data-testid="select-bulk-shift"><SelectValue placeholder="Select shift..." /></SelectTrigger>
                <SelectContent>
                  {shiftsData.filter((s: any) => s.status === "active").map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color || "#3b82f6" }} />
                        {s.name} ({formatTime12(s.startTime)} - {formatTime12(s.endTime)})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Effective From</label>
              <Input type="date" value={bulkFrom} onChange={e => setBulkFrom(e.target.value)} className="h-9 text-[13px]" data-testid="input-bulk-from" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Effective To (Optional)</label>
              <Input type="date" value={bulkTo} onChange={e => setBulkTo(e.target.value)} className="h-9 text-[13px]" data-testid="input-bulk-to" />
            </div>
            {bulkDept && (
              <div className="col-span-2 bg-muted/30 rounded-xl p-3">
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-bold text-foreground">{employees.filter((e: any) => e.department?.toLowerCase() === bulkDept.toLowerCase() && e.status === "active").length}</span> active employees in {bulkDept} department will be assigned
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setBulkAssignDialog(false)} data-testid="button-cancel-bulk">Cancel</Button>
            <Button size="sm" onClick={handleBulkAssign} disabled={createAssignmentMutation.isPending} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0" data-testid="button-submit-bulk">
              {createAssignmentMutation.isPending ? "Assigning..." : "Bulk Assign"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={editAssignDialog} onOpenChange={setEditAssignDialog}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2"><Edit className="h-5 w-5 text-amber-600" /> Edit Assignment</DialogTitle>
            <DialogDescription className="text-[12px]">Update shift assignment for {selectedAssignment?.employeeName}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 bg-muted/30 rounded-xl p-3">
              <p className="text-[12px] font-bold text-foreground">{selectedAssignment?.employeeName}</p>
              <p className="text-[10px] text-muted-foreground">{selectedAssignment?.empCode} • {selectedAssignment?.department}</p>
            </div>
            <div className="col-span-2">
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Shift</label>
              <Select value={assignShiftId} onValueChange={setAssignShiftId}>
                <SelectTrigger className="h-9 text-[13px]" data-testid="select-edit-assign-shift"><SelectValue placeholder="Select shift..." /></SelectTrigger>
                <SelectContent>
                  {shiftsData.filter((s: any) => s.status === "active").map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color || "#3b82f6" }} />
                        {s.name} ({formatTime12(s.startTime)} - {formatTime12(s.endTime)})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Effective From</label>
              <Input type="date" value={assignFrom} onChange={e => setAssignFrom(e.target.value)} className="h-9 text-[13px]" data-testid="input-edit-assign-from" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Effective To (Optional)</label>
              <Input type="date" value={assignTo} onChange={e => setAssignTo(e.target.value)} className="h-9 text-[13px]" data-testid="input-edit-assign-to" />
            </div>
            <div className="col-span-2">
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Notes</label>
              <Textarea value={assignNotes} onChange={e => setAssignNotes(e.target.value)} className="text-[13px] min-h-[50px]" placeholder="Optional notes..." data-testid="input-edit-assign-notes" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setEditAssignDialog(false)} data-testid="button-cancel-edit-assign">Cancel</Button>
            <Button size="sm" onClick={handleUpdateAssignment} disabled={updateAssignmentMutation.isPending} data-testid="button-update-assign">
              {updateAssignmentMutation.isPending ? "Saving..." : "Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
