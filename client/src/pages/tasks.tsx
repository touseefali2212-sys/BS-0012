import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, ClipboardList, CheckCircle, Clock,
  AlertCircle, XCircle, Calendar, Users, FolderKanban, History, BarChart3,
  Target, TrendingUp, Flag, AlertTriangle, Eye, Briefcase, Download, Filter,
  ChevronDown, ChevronUp, GripVertical, CalendarDays, ArrowRight, UserCheck,
  Gauge, Layers, Pause, Play, Timer, ListTodo, PieChart as PieChartIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useTab } from "@/hooks/use-tab";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertTaskSchema, type Task, type InsertTask, type Customer,
  type Employee, type Project,
} from "@shared/schema";
import { z } from "zod";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const taskFormSchema = insertTaskSchema.extend({
  title: z.string().min(2, "Title is required"),
  type: z.string().min(1, "Type is required"),
});

const statusConfig: Record<string, { label: string; color: string; icon: any; kanbanColor: string }> = {
  pending: { label: "Assigned", color: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 border-blue-200", icon: Clock, kanbanColor: "border-t-blue-500" },
  in_progress: { label: "In Progress", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border-amber-200", icon: AlertCircle, kanbanColor: "border-t-amber-500" },
  pending_approval: { label: "Pending Approval", color: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 border-purple-200", icon: Clock, kanbanColor: "border-t-purple-500" },
  on_hold: { label: "On Hold", color: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border-slate-200", icon: Pause, kanbanColor: "border-t-slate-500" },
  completed: { label: "Completed", color: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950 border-green-200", icon: CheckCircle, kanbanColor: "border-t-green-500" },
  overdue: { label: "Overdue", color: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950 border-red-200", icon: AlertTriangle, kanbanColor: "border-t-red-500" },
  cancelled: { label: "Cancelled", color: "text-gray-500 bg-gray-50 dark:bg-gray-900 border-gray-200", icon: XCircle, kanbanColor: "border-t-gray-400" },
};

const priorityConfig: Record<string, { label: string; color: string; icon: any }> = {
  high: { label: "High", color: "text-red-600 bg-red-50 dark:bg-red-950 border-red-200", icon: Flag },
  medium: { label: "Medium", color: "text-amber-600 bg-amber-50 dark:bg-amber-950 border-amber-200", icon: Flag },
  low: { label: "Low", color: "text-green-600 bg-green-50 dark:bg-green-950 border-green-200", icon: Flag },
};

const typeLabels: Record<string, string> = {
  installation: "Installation",
  maintenance: "Maintenance",
  complaint: "Complaint Handling",
  network_upgrade: "Network Upgrade",
  internal: "Internal Work",
  development: "Development",
  general: "General",
  repair: "Repair",
  upgrade: "Upgrade",
};

const departmentLabels: Record<string, string> = {
  operations: "Operations", technical: "Technical", finance: "Finance",
  hr: "Human Resources", sales: "Sales", support: "Customer Support",
  engineering: "Engineering", management: "Management", noc: "NOC",
};

const KANBAN_COLS = ["pending", "in_progress", "pending_approval", "on_hold", "completed", "overdue"] as const;
const PIE_COLORS = ["#1D4ED8", "#D97706", "#6B7280", "#059669", "#DC2626", "#9333EA"];
const today = new Date().toISOString().split("T")[0];

export default function TasksPage() {
  const { toast } = useToast();
  const [tab, changeTab] = useTab("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [sortField, setSortField] = useState<"title" | "dueDate" | "priority" | "progress">("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [dragTask, setDragTask] = useState<number | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");

  const { data: tasks, isLoading } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: customers } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: employees } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: projects } = useQuery<Project[]>({ queryKey: ["/api/projects"] });

  const allTasks = tasks || [];
  const allEmployees = (employees || []).filter(e => e.status === "active");
  const allProjects = projects || [];
  const allCustomers = customers || [];

  const form = useForm<InsertTask>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      taskCode: "", title: "", type: "general", description: "", priority: "medium",
      status: "pending", assignedTo: "", supervisor: "", department: "", branch: "",
      customerId: undefined, projectId: undefined, startDate: today, dueDate: "",
      reminderDate: "", completedDate: "", estimatedHours: "", progress: 0,
      checklist: "", internalNotes: "", customerNotes: "", notes: "",
    },
  });

  const nextCode = useMemo(() => {
    const maxNum = allTasks.reduce((max, t) => {
      const m = (t.taskCode || "").match(/TSK-(\d+)/);
      return m ? Math.max(max, parseInt(m[1])) : max;
    }, 0);
    return `TSK-${String(maxNum + 1).padStart(5, "0")}`;
  }, [allTasks]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertTask) => {
      const res = await apiRequest("POST", "/api/tasks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setDialogOpen(false); form.reset();
      toast({ title: "Task created successfully" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertTask> }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setDialogOpen(false); setEditingTask(null); form.reset();
      toast({ title: "Task updated successfully" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/tasks/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Task deleted" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const openCreate = () => {
    setEditingTask(null);
    form.reset({
      taskCode: nextCode, title: "", type: "general", description: "", priority: "medium",
      status: "pending", assignedTo: "", supervisor: "", department: "", branch: "",
      customerId: undefined, projectId: undefined, startDate: today, dueDate: "",
      reminderDate: "", completedDate: "", estimatedHours: "", progress: 0,
      checklist: "", internalNotes: "", customerNotes: "", notes: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    form.reset({
      taskCode: task.taskCode || "", title: task.title, type: task.type,
      description: task.description || "", priority: task.priority, status: task.status,
      assignedTo: task.assignedTo || "", supervisor: task.supervisor || "",
      department: task.department || "", branch: task.branch || "",
      customerId: task.customerId ?? undefined, projectId: task.projectId ?? undefined,
      startDate: task.startDate || "", dueDate: task.dueDate || "",
      reminderDate: task.reminderDate || "", completedDate: task.completedDate || "",
      estimatedHours: task.estimatedHours || "", progress: task.progress ?? 0,
      checklist: task.checklist || "", internalNotes: task.internalNotes || "",
      customerNotes: task.customerNotes || "", notes: task.notes || "",
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertTask) => {
    if (editingTask) updateMutation.mutate({ id: editingTask.id, data });
    else createMutation.mutate(data);
  };

  const getEffectiveStatus = (task: Task) => {
    if (task.status === "completed" || task.status === "cancelled") return task.status;
    if (task.dueDate && new Date(task.dueDate) < new Date()) return "overdue";
    return task.status;
  };

  const kpis = useMemo(() => {
    const total = allTasks.length;
    const inProgress = allTasks.filter(t => t.status === "in_progress").length;
    const completed = allTasks.filter(t => t.status === "completed").length;
    const overdue = allTasks.filter(t => getEffectiveStatus(t) === "overdue").length;
    const highPriority = allTasks.filter(t => t.priority === "high" && t.status !== "completed" && t.status !== "cancelled").length;
    const dueToday = allTasks.filter(t => t.dueDate === today && t.status !== "completed" && t.status !== "cancelled").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, inProgress, completed, overdue, highPriority, dueToday, completionRate };
  }, [allTasks]);

  const deptDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    allTasks.forEach(t => { const d = t.department || "unassigned"; map[d] = (map[d] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: departmentLabels[name] || name, value }));
  }, [allTasks]);

  const projectDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    allTasks.forEach(t => {
      const name = t.projectId ? (getProjectName(t.projectId) || `Project #${t.projectId}`) : "No Project";
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allTasks, allProjects]);

  const branchDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    allTasks.forEach(t => { const b = t.branch || "Unassigned"; map[b] = (map[b] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allTasks]);

  const workloadDistribution = useMemo(() => {
    const map: Record<string, { name: string; assigned: number; inProgress: number; completed: number; overdue: number }> = {};
    allTasks.forEach(t => {
      const name = t.assignedTo || "Unassigned";
      if (!map[name]) map[name] = { name, assigned: 0, inProgress: 0, completed: 0, overdue: 0 };
      if (t.status === "pending") map[name].assigned++;
      else if (t.status === "in_progress") map[name].inProgress++;
      else if (t.status === "completed") map[name].completed++;
      if (getEffectiveStatus(t) === "overdue") map[name].overdue++;
    });
    return Object.values(map).sort((a, b) => (b.assigned + b.inProgress + b.completed) - (a.assigned + a.inProgress + a.completed)).slice(0, 10);
  }, [allTasks]);

  const weeklyTrend = useMemo(() => {
    const weeks: { week: string; completed: number; created: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const end = new Date(); end.setDate(end.getDate() - (i * 7));
      const start = new Date(end); start.setDate(start.getDate() - 7);
      const label = `W${4 - i}`;
      const created = allTasks.filter(t => {
        if (!t.createdAt) return false;
        const d = new Date(t.createdAt);
        return d >= start && d <= end;
      }).length;
      const completed = allTasks.filter(t => {
        if (!t.completedDate) return false;
        const d = new Date(t.completedDate);
        return d >= start && d <= end;
      }).length;
      weeks.push({ week: label, completed, created });
    }
    return weeks;
  }, [allTasks]);

  const teamPerformance = useMemo(() => {
    const map: Record<string, { name: string; total: number; completed: number; inProgress: number; overdue: number }> = {};
    allTasks.forEach(t => {
      const name = t.assignedTo || "Unassigned";
      if (!map[name]) map[name] = { name, total: 0, completed: 0, inProgress: 0, overdue: 0 };
      map[name].total++;
      if (t.status === "completed") map[name].completed++;
      else if (t.status === "in_progress") map[name].inProgress++;
      if (getEffectiveStatus(t) === "overdue") map[name].overdue++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [allTasks]);

  const uniqueAssignees = useMemo(() => {
    const s = new Set(allTasks.map(t => t.assignedTo).filter(Boolean));
    return Array.from(s) as string[];
  }, [allTasks]);

  const filtered = useMemo(() => {
    return allTasks
      .filter(t => {
        const q = search.toLowerCase();
        const matchSearch = t.title.toLowerCase().includes(q) || (t.taskCode || "").toLowerCase().includes(q) || (t.assignedTo || "").toLowerCase().includes(q);
        const matchStatus = statusFilter === "all" || t.status === statusFilter;
        const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
        const matchType = typeFilter === "all" || t.type === typeFilter;
        const matchDept = deptFilter === "all" || t.department === deptFilter;
        const matchProject = projectFilter === "all" || String(t.projectId) === projectFilter;
        const matchAssignee = assigneeFilter === "all" || t.assignedTo === assigneeFilter;
        return matchSearch && matchStatus && matchPriority && matchType && matchDept && matchProject && matchAssignee;
      })
      .sort((a, b) => {
        let va: string | number = "", vb: string | number = "";
        if (sortField === "title") { va = a.title; vb = b.title; }
        else if (sortField === "dueDate") { va = a.dueDate || ""; vb = b.dueDate || ""; }
        else if (sortField === "priority") { const o: Record<string, number> = { high: 0, medium: 1, low: 2 }; va = o[a.priority] ?? 1; vb = o[b.priority] ?? 1; }
        else if (sortField === "progress") { va = a.progress ?? 0; vb = b.progress ?? 0; }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  }, [allTasks, search, statusFilter, priorityFilter, typeFilter, deptFilter, projectFilter, assigneeFilter, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };
  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field
      ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3 ml-1 inline" /> : <ChevronDown className="h-3 w-3 ml-1 inline" />)
      : <ChevronUp className="h-3 w-3 ml-1 inline opacity-20" />;

  const getDaysRemaining = (dueDate: string | null | undefined) => {
    if (!dueDate) return null;
    return Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const getProjectName = (projectId: number | null | undefined) => {
    if (!projectId) return null;
    return allProjects.find(p => p.id === projectId)?.name;
  };

  const getCustomerName = (customerId: number | null | undefined) => {
    if (!customerId) return null;
    const c = allCustomers.find(c => c.id === customerId);
    return c ? c.fullName : `#${customerId}`;
  };

  const exportCSV = () => {
    const headers = ["Task Code", "Title", "Type", "Department", "Project", "Assigned To", "Priority", "Status", "Start Date", "Due Date", "Progress %"];
    const rows = filtered.map(t => [
      t.taskCode || "", t.title, typeLabels[t.type] || t.type, departmentLabels[t.department || ""] || t.department || "",
      getProjectName(t.projectId) || "", t.assignedTo || "", t.priority, t.status,
      t.startDate || "", t.dueDate || "", t.progress ?? 0,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `tasks_export_${today}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported successfully" });
  };

  const handleDragStart = (taskId: number) => setDragTask(taskId);
  const handleDrop = (newStatus: string) => {
    if (dragTask !== null) {
      const extra: Partial<InsertTask> = {};
      if (newStatus === "completed") { extra.completedDate = today; extra.progress = 100; }
      updateMutation.mutate({ id: dragTask, data: { status: newStatus, ...extra } });
      setDragTask(null);
    }
  };

  const clearFilters = () => {
    setSearch(""); setStatusFilter("all"); setPriorityFilter("all");
    setTypeFilter("all"); setDeptFilter("all"); setProjectFilter("all"); setAssigneeFilter("all");
  };
  const hasFilters = search || statusFilter !== "all" || priorityFilter !== "all" || typeFilter !== "all" || deptFilter !== "all" || projectFilter !== "all" || assigneeFilter !== "all";

  const toggleTaskSelect = (id: number) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAllFiltered = () => {
    if (selectedTasks.size === filtered.length && filtered.every(t => selectedTasks.has(t.id))) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filtered.map(t => t.id)));
    }
  };
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: number[]; status: string }) => {
      const extra: Partial<InsertTask> = {};
      if (status === "completed") { extra.completedDate = today; extra.progress = 100; }
      await Promise.all(ids.map(id => apiRequest("PATCH", `/api/tasks/${id}`, { status, ...extra })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setSelectedTasks(new Set()); setBulkStatus("");
      toast({ title: `${selectedTasks.size} tasks updated` });
    },
    onError: (error: Error) => { toast({ title: "Bulk update error", description: error.message, variant: "destructive" }); },
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-tasks-title">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center"><ListTodo className="h-5 w-5 text-white" /></div>
            Task Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create, assign, track, and monitor tasks across departments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-csv"><Download className="h-4 w-4 mr-1" />Export</Button>
          <Button onClick={openCreate} data-testid="button-add-task"><Plus className="h-4 w-4 mr-1" />Create Task</Button>
        </div>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        {[
          { id: "dashboard", label: "Dashboard", icon: BarChart3 },
          { id: "list", label: "Task List", icon: ClipboardList },
          { id: "kanban", label: "Kanban Board", icon: Layers },
          { id: "timeline", label: "Timeline & Performance", icon: TrendingUp },
          { id: "team", label: "Team Management", icon: Users },
        ].map(t => (
          <button key={t.id} onClick={() => changeTab(t.id)} data-testid={`tab-${t.id}`}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {/* ========== DASHBOARD TAB ========== */}
      {tab === "dashboard" && (
        <div className="space-y-5" data-testid="tab-content-dashboard">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "Total Tasks", value: kpis.total, icon: ClipboardList, gradient: "from-cyan-500 to-blue-700" },
              { label: "In Progress", value: kpis.inProgress, icon: AlertCircle, gradient: "from-amber-500 to-orange-600" },
              { label: "Completed", value: kpis.completed, icon: CheckCircle, gradient: "from-green-500 to-emerald-600" },
              { label: "Overdue", value: kpis.overdue, icon: AlertTriangle, gradient: kpis.overdue > 0 ? "from-red-500 to-red-700" : "from-slate-500 to-slate-600" },
              { label: "High Priority", value: kpis.highPriority, icon: Flag, gradient: kpis.highPriority > 0 ? "from-rose-500 to-pink-600" : "from-slate-500 to-slate-600" },
              { label: "Due Today", value: kpis.dueToday, icon: CalendarDays, gradient: kpis.dueToday > 0 ? "from-violet-500 to-purple-600" : "from-slate-500 to-slate-600" },
            ].map(kpi => (
              <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-lg p-4 text-white shadow-sm`} data-testid={`card-kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-white/60" />
                </div>
                <p className="text-xl font-bold">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-blue-600" />Weekly Task Completion</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="created" name="Created" fill="#0891B2" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><PieChartIcon className="h-4 w-4 text-blue-600" />Tasks by Department</CardTitle></CardHeader>
              <CardContent>
                {deptDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={deptDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {deptDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data</div>}
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><FolderKanban className="h-4 w-4 text-blue-600" />Tasks by Project</CardTitle></CardHeader>
              <CardContent>
                {projectDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={projectDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {projectDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data</div>}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4 text-blue-600" />Tasks by Branch</CardTitle></CardHeader>
              <CardContent>
                {branchDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={branchDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                      <Tooltip />
                      <Bar dataKey="value" name="Tasks" fill="#6366F1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data</div>}
              </CardContent>
            </Card>
            <Card className="border shadow-sm lg:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-blue-600" />Team Workload Distribution</CardTitle></CardHeader>
              <CardContent>
                {workloadDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={workloadDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="assigned" name="Assigned" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="completed" name="Completed" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data</div>}
              </CardContent>
            </Card>
          </div>

          {kpis.overdue > 0 && (
            <Card className="border border-red-200 dark:border-red-800 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-600"><AlertTriangle className="h-4 w-4" />Overdue Tasks ({kpis.overdue})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allTasks.filter(t => getEffectiveStatus(t) === "overdue").slice(0, 5).map(t => {
                    const days = getDaysRemaining(t.dueDate);
                    return (
                      <div key={t.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-100 dark:border-red-900 cursor-pointer hover:shadow-sm" onClick={() => setDetailTask(t)} data-testid={`overdue-task-${t.id}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2"><Badge variant="outline" className="text-[10px] font-mono">{t.taskCode}</Badge><span className="text-sm font-medium">{t.title}</span></div>
                          <p className="text-xs text-muted-foreground mt-0.5">{t.assignedTo || "Unassigned"} | {getProjectName(t.projectId) || "No project"}</p>
                        </div>
                        <span className="text-xs font-semibold text-red-600">{days !== null ? `${Math.abs(days)}d overdue` : ""}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========== TASK LIST TAB ========== */}
      {tab === "list" && (
        <div className="space-y-4" data-testid="tab-content-list">
          <Card className="border shadow-sm">
            <CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by title, code, assignee..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" data-testid="input-search-tasks" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] h-9" data-testid="select-task-status-filter"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {allProjects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Depts</SelectItem>
                    {Object.entries(departmentLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Assigned To" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {uniqueAssignees.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
                {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters"><XCircle className="h-3.5 w-3.5 mr-1" />Reset</Button>}
              </div>
            </CardContent>
          </Card>

          {selectedTasks.size > 0 && (
            <Card className="border border-blue-200 dark:border-blue-800 shadow-sm bg-blue-50/50 dark:bg-blue-950/30">
              <CardContent className="p-3 flex items-center gap-3">
                <span className="text-sm font-medium">{selectedTasks.size} task{selectedTasks.size > 1 ? "s" : ""} selected</span>
                <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger className="w-[160px] h-8" data-testid="select-bulk-status"><SelectValue placeholder="Change status to..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" disabled={!bulkStatus || bulkUpdateMutation.isPending} onClick={() => bulkUpdateMutation.mutate({ ids: Array.from(selectedTasks), status: bulkStatus })} data-testid="button-bulk-update">
                  {bulkUpdateMutation.isPending ? "Updating..." : "Apply"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setSelectedTasks(new Set()); setBulkStatus(""); }} data-testid="button-clear-selection"><XCircle className="h-3.5 w-3.5 mr-1" />Clear</Button>
              </CardContent>
            </Card>
          )}

          <Card className="border shadow-sm">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No tasks found</p>
                  <p className="text-sm mt-1">Create a new task to get started</p>
                  <Button className="mt-4" onClick={openCreate} data-testid="button-create-first-task"><Plus className="h-4 w-4 mr-1" />Create Task</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30">
                        <TableHead className="w-8"><input type="checkbox" checked={filtered.length > 0 && filtered.every(t => selectedTasks.has(t.id))} onChange={toggleAllFiltered} className="rounded border-gray-300" data-testid="checkbox-select-all" /></TableHead>
                        <TableHead className="text-xs font-semibold">Code</TableHead>
                        <TableHead className="text-xs font-semibold cursor-pointer select-none" onClick={() => toggleSort("title")}>Task Title <SortIcon field="title" /></TableHead>
                        <TableHead className="text-xs font-semibold">Project</TableHead>
                        <TableHead className="text-xs font-semibold">Assigned To</TableHead>
                        <TableHead className="text-xs font-semibold">Department</TableHead>
                        <TableHead className="text-xs font-semibold cursor-pointer select-none" onClick={() => toggleSort("priority")}>Priority <SortIcon field="priority" /></TableHead>
                        <TableHead className="text-xs font-semibold cursor-pointer select-none" onClick={() => toggleSort("dueDate")}>Timeline <SortIcon field="dueDate" /></TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold cursor-pointer select-none" onClick={() => toggleSort("progress")}>Progress <SortIcon field="progress" /></TableHead>
                        <TableHead className="text-xs font-semibold">Days Left</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(task => {
                        const eff = getEffectiveStatus(task);
                        const st = statusConfig[eff] || statusConfig.pending;
                        const pri = priorityConfig[task.priority] || priorityConfig.medium;
                        const days = getDaysRemaining(task.dueDate);
                        return (
                          <TableRow key={task.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900 ${eff === "overdue" ? "bg-red-50/30 dark:bg-red-950/10" : ""} ${selectedTasks.has(task.id) ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`} data-testid={`row-task-${task.id}`}>
                            <TableCell className="w-8"><input type="checkbox" checked={selectedTasks.has(task.id)} onChange={() => toggleTaskSelect(task.id)} className="rounded border-gray-300" data-testid={`checkbox-task-${task.id}`} /></TableCell>
                            <TableCell className="text-xs font-mono font-semibold text-blue-600">{task.taskCode || "—"}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-semibold">{task.title}</p>
                                <p className="text-xs text-muted-foreground">{typeLabels[task.type] || task.type}</p>
                              </div>
                            </TableCell>
                            <TableCell><span className="text-xs">{getProjectName(task.projectId) || "—"}</span></TableCell>
                            <TableCell>
                              {task.assignedTo ? (
                                <div className="flex items-center gap-1"><UserCheck className="h-3 w-3 text-muted-foreground" /><span className="text-xs">{task.assignedTo}</span></div>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell>{task.department ? <Badge variant="secondary" className="text-[10px]">{departmentLabels[task.department] || task.department}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                            <TableCell><Badge variant="outline" className={`text-[10px] ${pri.color}`}><pri.icon className="h-3 w-3 mr-0.5" />{pri.label}</Badge></TableCell>
                            <TableCell>
                              <div className="text-xs space-y-0.5">
                                {task.startDate && <div className="flex items-center gap-1"><CalendarDays className="h-3 w-3 text-muted-foreground" />{task.startDate}</div>}
                                {task.dueDate && <div className="flex items-center gap-1"><ArrowRight className="h-3 w-3 text-muted-foreground" />{task.dueDate}</div>}
                                {days !== null && (
                                  <span className={`text-[10px] ${days < 0 ? "text-red-600 font-semibold" : days <= 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                                    {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="secondary" className={`text-[10px] ${st.color}`}><st.icon className="h-3 w-3 mr-0.5" />{st.label}</Badge></TableCell>
                            <TableCell>
                              <div className="min-w-[60px]">
                                <div className="flex justify-between text-xs mb-0.5"><span>{task.progress ?? 0}%</span></div>
                                <Progress value={task.progress ?? 0} className="h-1.5" />
                              </div>
                            </TableCell>
                            <TableCell>
                              {days !== null ? (
                                <span className={`text-xs font-semibold ${days < 0 ? "text-red-600" : days === 0 ? "text-amber-600" : days <= 3 ? "text-amber-500" : "text-green-600"}`}>
                                  {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d`}
                                </span>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-task-actions-${task.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setDetailTask(task)} data-testid={`button-view-task-${task.id}`}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEdit(task)} data-testid={`button-edit-task-${task.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {task.status !== "in_progress" && task.status !== "completed" && (
                                    <DropdownMenuItem className="text-amber-600" onClick={() => updateMutation.mutate({ id: task.id, data: { status: "in_progress" } })}><Play className="h-4 w-4 mr-2" />Start</DropdownMenuItem>
                                  )}
                                  {task.status !== "completed" && (
                                    <DropdownMenuItem className="text-green-600" onClick={() => updateMutation.mutate({ id: task.id, data: { status: "completed", completedDate: today, progress: 100 } })}><CheckCircle className="h-4 w-4 mr-2" />Complete</DropdownMenuItem>
                                  )}
                                  {task.status === "in_progress" && (
                                    <DropdownMenuItem className="text-slate-600" onClick={() => updateMutation.mutate({ id: task.id, data: { status: "on_hold" } })}><Pause className="h-4 w-4 mr-2" />Hold</DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(task.id)} data-testid={`button-delete-task-${task.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
              {filtered.length > 0 && <div className="px-4 py-2 text-xs text-muted-foreground border-t">Showing {filtered.length} of {allTasks.length} tasks</div>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========== KANBAN BOARD TAB ========== */}
      {tab === "kanban" && (
        <div className="space-y-4" data-testid="tab-content-kanban">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
            {KANBAN_COLS.map(colStatus => {
              const colConfig = statusConfig[colStatus];
              const colTasks = colStatus === "overdue"
                ? allTasks.filter(t => getEffectiveStatus(t) === "overdue")
                : allTasks.filter(t => t.status === colStatus && (colStatus === "completed" || getEffectiveStatus(t) !== "overdue"));
              return (
                <div key={colStatus} className={`rounded-lg border-t-4 ${colConfig.kanbanColor} bg-slate-50/50 dark:bg-slate-950/30 border shadow-sm`}
                  onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(colStatus)} data-testid={`kanban-col-${colStatus}`}>
                  <div className="flex items-center justify-between px-3 py-2.5 border-b bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-2">
                      <colConfig.icon className={`h-4 w-4 ${colConfig.color.split(" ")[0]}`} />
                      <span className="text-sm font-semibold">{colConfig.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-5 min-w-[20px] flex items-center justify-center">{colTasks.length}</Badge>
                  </div>
                  <div className="p-2 space-y-2 min-h-[200px] max-h-[70vh] overflow-y-auto">
                    {colTasks.length === 0 && (
                      <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">Drop tasks here</div>
                    )}
                    {colTasks.map(task => {
                      const pri = priorityConfig[task.priority] || priorityConfig.medium;
                      const days = getDaysRemaining(task.dueDate);
                      const isOverdue = days !== null && days < 0 && task.status !== "completed";
                      return (
                        <div key={task.id} draggable onDragStart={() => handleDragStart(task.id)}
                          className={`bg-white dark:bg-slate-900 rounded-lg border p-3 cursor-grab hover:shadow-md transition-shadow ${isOverdue ? "border-red-300 dark:border-red-800" : ""}`}
                          onClick={() => setDetailTask(task)} data-testid={`kanban-card-${task.id}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <Badge variant="outline" className="text-[9px] font-mono">{task.taskCode}</Badge>
                            <Badge variant="outline" className={`text-[9px] ${pri.color}`}>{pri.label}</Badge>
                          </div>
                          <p className="text-sm font-medium mb-1 line-clamp-2">{task.title}</p>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                            <span>{task.assignedTo || "Unassigned"}</span>
                            {task.department && <Badge variant="secondary" className="text-[9px] h-4">{departmentLabels[task.department] || task.department}</Badge>}
                          </div>
                          {(task.progress ?? 0) > 0 && (
                            <div className="space-y-0.5 mb-1.5">
                              <Progress value={task.progress ?? 0} className="h-1" />
                              <span className="text-[9px] text-muted-foreground">{task.progress}%</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[10px]">
                            {task.dueDate && <span className={`${isOverdue ? "text-red-600 font-semibold" : days !== null && days <= 2 ? "text-amber-600" : "text-muted-foreground"}`}>{isOverdue ? `${Math.abs(days!)}d overdue` : days === 0 ? "Due today" : days !== null ? `${days}d left` : task.dueDate}</span>}
                            {getProjectName(task.projectId) && <span className="text-blue-600 truncate max-w-[80px]">{getProjectName(task.projectId)}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========== TIMELINE & PERFORMANCE TAB ========== */}
      {tab === "timeline" && (
        <div className="space-y-5" data-testid="tab-content-timeline">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Completion Rate", value: `${kpis.completionRate}%`, icon: Target, gradient: "from-cyan-500 to-blue-700" },
              { label: "Overdue Ratio", value: `${kpis.total > 0 ? Math.round((kpis.overdue / kpis.total) * 100) : 0}%`, icon: AlertTriangle, gradient: kpis.overdue > 0 ? "from-red-500 to-red-700" : "from-slate-500 to-slate-600" },
              { label: "High Priority Done", value: (() => { const hp = allTasks.filter(t => t.priority === "high"); const hpc = hp.filter(t => t.status === "completed").length; return hp.length > 0 ? `${Math.round((hpc / hp.length) * 100)}%` : "0%"; })(), icon: Flag, gradient: "from-rose-500 to-pink-600" },
              { label: "Avg Progress", value: `${allTasks.length > 0 ? Math.round(allTasks.reduce((s, t) => s + (t.progress ?? 0), 0) / allTasks.length) : 0}%`, icon: Gauge, gradient: "from-violet-500 to-purple-600" },
              { label: "Active Team", value: teamPerformance.filter(t => t.name !== "Unassigned").length, icon: Users, gradient: "from-teal-500 to-emerald-600" },
            ].map(kpi => (
              <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-lg p-4 text-white shadow-sm`} data-testid={`perf-kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-white/60" />
                </div>
                <p className="text-xl font-bold">{kpi.value}</p>
              </div>
            ))}
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-blue-600" />Task Timeline (Project-Linked)</CardTitle><CardDescription className="text-xs">Progress, deadline, and resource overview per task</CardDescription></CardHeader>
            <CardContent>
              {allTasks.filter(t => t.status !== "cancelled").length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><ClipboardList className="h-10 w-10 mb-2 opacity-30" /><p>No tasks to display</p></div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {allTasks.filter(t => t.status !== "cancelled").sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")).map(task => {
                    const eff = getEffectiveStatus(task);
                    const st = statusConfig[eff] || statusConfig.pending;
                    const pri = priorityConfig[task.priority] || priorityConfig.medium;
                    const days = getDaysRemaining(task.dueDate);
                    return (
                      <div key={task.id} className={`border rounded-lg p-3 hover:shadow-sm transition-shadow ${eff === "overdue" ? "border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10" : ""}`} data-testid={`timeline-task-${task.id}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="outline" className="text-[10px] font-mono">{task.taskCode}</Badge>
                              <Badge variant="secondary" className={`text-[10px] ${st.color}`}><st.icon className="h-3 w-3 mr-0.5" />{st.label}</Badge>
                              <Badge variant="outline" className={`text-[10px] ${pri.color}`}>{pri.label}</Badge>
                              {getProjectName(task.projectId) && <Badge variant="secondary" className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"><FolderKanban className="h-3 w-3 mr-0.5" />{getProjectName(task.projectId)}</Badge>}
                            </div>
                            <p className="text-sm font-semibold">{task.title}</p>
                            <p className="text-xs text-muted-foreground">{task.assignedTo || "Unassigned"}{task.department ? ` | ${departmentLabels[task.department] || task.department}` : ""}</p>
                          </div>
                          <div className="text-right ml-3">
                            <p className="text-xs text-muted-foreground">{task.startDate || "—"} → {task.dueDate || "—"}</p>
                            {days !== null && (
                              <p className={`text-xs font-semibold mt-0.5 ${days < 0 ? "text-red-600" : days <= 2 ? "text-amber-600" : "text-green-600"}`}>
                                {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Progress</p>
                            <div className="flex items-center gap-2"><Progress value={task.progress ?? 0} className="h-1.5 flex-1" /><span className="text-xs font-semibold">{task.progress ?? 0}%</span></div>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Est. Hours</p>
                            <p className="text-sm font-semibold">{task.estimatedHours || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Supervisor</p>
                            <p className="text-sm">{task.supervisor || "—"}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-blue-600" />Team Performance Ranking</CardTitle><CardDescription className="text-xs">Members ranked by productivity score (completion rate × volume)</CardDescription></CardHeader>
            <CardContent>
              {teamPerformance.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">No data</div>
              ) : (
                <div className="space-y-2">
                  {teamPerformance
                    .filter(tp => tp.name !== "Unassigned")
                    .map(tp => ({ ...tp, score: tp.total > 0 ? Math.round(((tp.completed / tp.total) * 100) * Math.log2(tp.total + 1)) : 0 }))
                    .sort((a, b) => b.score - a.score)
                    .map((tp, idx) => {
                      const rate = tp.total > 0 ? Math.round((tp.completed / tp.total) * 100) : 0;
                      return (
                        <div key={tp.name} className="flex items-center gap-3 p-2.5 border rounded-lg hover:shadow-sm" data-testid={`ranking-${tp.name}`}>
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" : idx === 1 ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : idx === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                            #{idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{tp.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{tp.completed}/{tp.total} done</span>
                              <span>|</span>
                              <span>{rate}% rate</span>
                              {tp.overdue > 0 && <><span>|</span><span className="text-red-600">{tp.overdue} overdue</span></>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">{tp.score}</p>
                            <p className="text-[9px] text-muted-foreground uppercase">Score</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========== TEAM MANAGEMENT TAB ========== */}
      {tab === "team" && (
        <div className="space-y-4" data-testid="tab-content-team">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-blue-600" />Team Workload & Performance</CardTitle></CardHeader>
            <CardContent>
              {teamPerformance.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Users className="h-12 w-12 mb-3 opacity-30" /><p className="font-medium">No team data</p><p className="text-sm mt-1">Assign tasks to team members</p></div>
              ) : (
                <div className="space-y-3">
                  {teamPerformance.map(tp => {
                    const rate = tp.total > 0 ? Math.round((tp.completed / tp.total) * 100) : 0;
                    const overdueRate = tp.total > 0 ? Math.round((tp.overdue / tp.total) * 100) : 0;
                    const memberTasks = allTasks.filter(t => (t.assignedTo || "Unassigned") === tp.name);
                    return (
                      <div key={tp.name} className="border rounded-lg p-4 hover:shadow-sm transition-shadow" data-testid={`card-team-member-${tp.name}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">{tp.name.charAt(0).toUpperCase()}</div>
                            <div>
                              <p className="font-semibold text-sm">{tp.name}</p>
                              <p className="text-xs text-muted-foreground">{tp.total} tasks assigned</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] text-green-700 bg-green-50 dark:bg-green-950"><CheckCircle className="h-3 w-3 mr-0.5" />{tp.completed}</Badge>
                            <Badge variant="secondary" className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950"><AlertCircle className="h-3 w-3 mr-0.5" />{tp.inProgress}</Badge>
                            {tp.overdue > 0 && <Badge variant="secondary" className="text-[10px] text-red-600 bg-red-50 dark:bg-red-950"><AlertTriangle className="h-3 w-3 mr-0.5" />{tp.overdue} overdue</Badge>}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-md">
                            <p className="text-[10px] text-muted-foreground uppercase">Completion Rate</p>
                            <p className="text-lg font-bold text-green-600">{rate}%</p>
                            <Progress value={rate} className="h-1 mt-1" />
                          </div>
                          <div className={`p-2 rounded-md ${overdueRate > 0 ? "bg-red-50 dark:bg-red-950/30" : "bg-slate-50 dark:bg-slate-900"}`}>
                            <p className="text-[10px] text-muted-foreground uppercase">Overdue Rate</p>
                            <p className={`text-lg font-bold ${overdueRate > 0 ? "text-red-600" : ""}`}>{overdueRate}%</p>
                          </div>
                          <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                            <p className="text-[10px] text-muted-foreground uppercase">Active Tasks</p>
                            <p className="text-lg font-bold text-blue-600">{tp.inProgress + (tp.total - tp.completed - tp.inProgress - tp.overdue)}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Current Tasks</p>
                          {memberTasks.filter(t => t.status !== "completed" && t.status !== "cancelled").slice(0, 4).map(t => {
                            const tst = statusConfig[getEffectiveStatus(t)] || statusConfig.pending;
                            return (
                              <div key={t.id} className="flex items-center justify-between py-1 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 rounded px-1" onClick={() => setDetailTask(t)}>
                                <div className="flex items-center gap-1.5 flex-1 min-w-0"><span className="font-mono text-[10px] text-blue-600">{t.taskCode}</span><span className="truncate">{t.title}</span></div>
                                <Badge variant="secondary" className={`text-[9px] ${tst.color} ml-2`}>{tst.label}</Badge>
                              </div>
                            );
                          })}
                          {memberTasks.filter(t => t.status !== "completed" && t.status !== "cancelled").length > 4 && (
                            <p className="text-[10px] text-muted-foreground">+{memberTasks.filter(t => t.status !== "completed" && t.status !== "cancelled").length - 4} more</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========== CREATE/EDIT TASK DIALOG ========== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center"><ListTodo className="h-4 w-4 text-white" /></div>
              {editingTask ? "Edit Task" : "Create New Task"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" />Section A — Task Details</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="taskCode" render={({ field }) => <FormItem><FormLabel>Task Code</FormLabel><FormControl><Input {...field} value={field.value || ""} readOnly className="font-mono bg-slate-50 dark:bg-slate-900" data-testid="input-task-code" /></FormControl></FormItem>} />
                    <FormField control={form.control} name="title" render={({ field }) => <FormItem className="col-span-2"><FormLabel>Task Title *</FormLabel><FormControl><Input {...field} placeholder="e.g., Install fiber connection for C-1234" data-testid="input-task-title" /></FormControl><FormMessage /></FormItem>} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="projectId" render={({ field }) => <FormItem><FormLabel>Project</FormLabel><Select onValueChange={v => field.onChange(v === "none" ? undefined : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-task-project"><SelectValue placeholder="Link to project" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">— No Project —</SelectItem>{allProjects.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.projectCode} — {p.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                    <FormField control={form.control} name="department" render={({ field }) => <FormItem><FormLabel>Department</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger data-testid="select-task-department"><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent><SelectItem value="">— None —</SelectItem>{Object.entries(departmentLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></FormItem>} />
                    <FormField control={form.control} name="branch" render={({ field }) => <FormItem><FormLabel>Branch</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g., Head Office" data-testid="input-task-branch" /></FormControl></FormItem>} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="type" render={({ field }) => <FormItem><FormLabel>Task Type *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger data-testid="select-task-type"><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="customerId" render={({ field }) => <FormItem><FormLabel>Customer (if linked)</FormLabel><Select onValueChange={v => field.onChange(v === "none" ? undefined : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-task-customer"><SelectValue placeholder="Select customer" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">— None —</SelectItem>{allCustomers.slice(0, 100).map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.customerId} — {c.fullName}</SelectItem>)}</SelectContent></Select></FormItem>} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} placeholder="Detailed task description..." data-testid="textarea-task-description" /></FormControl></FormItem>} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Section B — Assignment</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="assignedTo" render={({ field }) => <FormItem><FormLabel>Assigned To</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger data-testid="select-task-assignee"><SelectValue placeholder="Select user" /></SelectTrigger></FormControl><SelectContent><SelectItem value="">— Unassigned —</SelectItem>{allEmployees.map(e => <SelectItem key={e.id} value={e.fullName}>{e.fullName} — {e.designation}</SelectItem>)}<SelectItem value="admin">Admin</SelectItem></SelectContent></Select></FormItem>} />
                    <FormField control={form.control} name="supervisor" render={({ field }) => <FormItem><FormLabel>Supervisor</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger data-testid="select-task-supervisor"><SelectValue placeholder="Select supervisor" /></SelectTrigger></FormControl><SelectContent><SelectItem value="">— None —</SelectItem>{allEmployees.map(e => <SelectItem key={e.id} value={e.fullName}>{e.fullName}</SelectItem>)}<SelectItem value="admin">Admin</SelectItem></SelectContent></Select></FormItem>} />
                    <FormField control={form.control} name="priority" render={({ field }) => <FormItem><FormLabel>Priority</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger data-testid="select-task-priority"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select></FormItem>} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="estimatedHours" render={({ field }) => <FormItem><FormLabel>Estimated Hours</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g., 4" data-testid="input-estimated-hours" /></FormControl></FormItem>} />
                    <FormField control={form.control} name="progress" render={({ field }) => <FormItem><FormLabel>Progress (%)</FormLabel><FormControl><Input type="number" min={0} max={100} {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-task-progress" /></FormControl></FormItem>} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Section C — Timeline</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    <FormField control={form.control} name="startDate" render={({ field }) => <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} data-testid="input-task-start-date" /></FormControl></FormItem>} />
                    <FormField control={form.control} name="dueDate" render={({ field }) => <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} data-testid="input-task-due-date" /></FormControl></FormItem>} />
                    <FormField control={form.control} name="reminderDate" render={({ field }) => <FormItem><FormLabel>Reminder Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} data-testid="input-task-reminder-date" /></FormControl></FormItem>} />
                    <FormField control={form.control} name="status" render={({ field }) => <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger data-testid="select-task-status"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="pending">Assigned</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="pending_approval">Pending Approval</SelectItem><SelectItem value="on_hold">On Hold</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select></FormItem>} />
                  </div>
                  {form.watch("startDate") && form.watch("dueDate") && (
                    <div className="flex items-center gap-4 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800 text-xs">
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Days Remaining: {getDaysRemaining(form.watch("dueDate"))}</span>
                      {getDaysRemaining(form.watch("dueDate"))! < 0 && <Badge variant="destructive" className="text-[10px]">OVERDUE</Badge>}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5" />Section D — Notes & Checklist</h4>
                <div className="border-t pt-3 space-y-3">
                  <FormField control={form.control} name="checklist" render={({ field }) => <FormItem><FormLabel>Task Checklist (one per line)</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value || ""} placeholder={"Check cable routing\nTest signal strength\nUpdate customer record"} data-testid="textarea-task-checklist" /></FormControl></FormItem>} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField control={form.control} name="internalNotes" render={({ field }) => <FormItem><FormLabel>Internal Notes</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} placeholder="Internal team notes..." data-testid="textarea-internal-notes" /></FormControl></FormItem>} />
                    <FormField control={form.control} name="customerNotes" render={({ field }) => <FormItem><FormLabel>Customer Notes</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} placeholder="Customer-facing notes..." data-testid="textarea-customer-notes" /></FormControl></FormItem>} />
                  </div>
                  <FormField control={form.control} name="notes" render={({ field }) => <FormItem><FormLabel>General Notes</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} placeholder="Additional notes..." data-testid="textarea-task-notes" /></FormControl></FormItem>} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-task">
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingTask ? "Update Task" : "Create Task"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ========== TASK DETAIL DIALOG ========== */}
      <Dialog open={!!detailTask} onOpenChange={open => { if (!open) setDetailTask(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailTask && (() => {
            const task = detailTask;
            const eff = getEffectiveStatus(task);
            const st = statusConfig[eff] || statusConfig.pending;
            const pri = priorityConfig[task.priority] || priorityConfig.medium;
            const days = getDaysRemaining(task.dueDate);
            const checklistItems = task.checklist ? task.checklist.split("\n").filter(Boolean) : [];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-md bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center"><ListTodo className="h-4 w-4 text-white" /></div>
                    {task.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-mono text-xs">{task.taskCode}</Badge>
                    <Badge variant="secondary" className={`text-xs ${st.color}`}><st.icon className="h-3 w-3 mr-0.5" />{st.label}</Badge>
                    <Badge variant="outline" className={`text-xs ${pri.color}`}><pri.icon className="h-3 w-3 mr-0.5" />{pri.label}</Badge>
                    {task.type && <Badge variant="secondary" className="text-xs">{typeLabels[task.type] || task.type}</Badge>}
                    {task.department && <Badge variant="secondary" className="text-xs">{departmentLabels[task.department] || task.department}</Badge>}
                  </div>

                  {task.description && <p className="text-sm text-muted-foreground border-l-2 border-blue-300 pl-3">{task.description}</p>}

                  {days !== null && (
                    <div className={`p-3 rounded-md border ${days < 0 ? "bg-red-50 dark:bg-red-950/30 border-red-200" : days <= 2 ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200" : "bg-green-50 dark:bg-green-950/30 border-green-200"}`}>
                      <p className={`text-sm font-semibold ${days < 0 ? "text-red-600" : days <= 2 ? "text-amber-600" : "text-green-600"}`}>
                        {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? "Due today" : `${days} days remaining`}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md space-y-1.5">
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Assigned To</span><span className="font-medium">{task.assignedTo || "—"}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Supervisor</span><span className="font-medium">{task.supervisor || "—"}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Branch</span><span className="font-medium">{task.branch || "—"}</span></div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md space-y-1.5">
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Start Date</span><span className="font-medium">{task.startDate || "—"}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Due Date</span><span className="font-medium">{task.dueDate || "—"}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Est. Hours</span><span className="font-medium">{task.estimatedHours || "—"}</span></div>
                    </div>
                  </div>

                  {getProjectName(task.projectId) && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-muted-foreground uppercase mb-0.5">Linked Project</p>
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300"><FolderKanban className="h-3.5 w-3.5 inline mr-1" />{getProjectName(task.projectId)}</p>
                    </div>
                  )}

                  {getCustomerName(task.customerId) && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                      <p className="text-xs text-muted-foreground uppercase mb-0.5">Linked Customer</p>
                      <p className="text-sm font-semibold">{getCustomerName(task.customerId)}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Progress</h4>
                    <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-md border border-cyan-200 dark:border-cyan-800">
                      <div className="flex justify-between text-sm mb-1"><span>Overall Progress</span><span className="font-bold text-cyan-700 dark:text-cyan-300">{task.progress ?? 0}%</span></div>
                      <Progress value={task.progress ?? 0} className="h-2" />
                    </div>
                  </div>

                  {checklistItems.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Checklist</h4>
                      <div className="space-y-1">
                        {checklistItems.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm p-1.5 bg-slate-50 dark:bg-slate-900 rounded">
                            <div className="h-4 w-4 rounded border border-slate-300 flex-shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(task.internalNotes || task.customerNotes || task.notes) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</h4>
                      {task.internalNotes && <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800"><p className="text-[10px] text-muted-foreground uppercase mb-0.5">Internal</p><p className="text-sm">{task.internalNotes}</p></div>}
                      {task.customerNotes && <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800"><p className="text-[10px] text-muted-foreground uppercase mb-0.5">Customer</p><p className="text-sm">{task.customerNotes}</p></div>}
                      {task.notes && <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-md"><p className="text-[10px] text-muted-foreground uppercase mb-0.5">General</p><p className="text-sm">{task.notes}</p></div>}
                    </div>
                  )}

                  <div className="pt-2 border-t flex gap-2">
                    <Button className="flex-1" onClick={() => { setDetailTask(null); openEdit(task); }} data-testid="button-detail-edit"><Edit className="h-4 w-4 mr-1" />Edit Task</Button>
                    {task.status !== "completed" && (
                      <Button variant="outline" className="text-green-600 border-green-300" onClick={() => { updateMutation.mutate({ id: task.id, data: { status: "completed", completedDate: today, progress: 100 } }); setDetailTask(null); }} data-testid="button-detail-complete"><CheckCircle className="h-4 w-4 mr-1" />Complete</Button>
                    )}
                    {task.status !== "in_progress" && task.status !== "completed" && (
                      <Button variant="outline" className="text-amber-600 border-amber-300" onClick={() => { updateMutation.mutate({ id: task.id, data: { status: "in_progress" } }); setDetailTask(null); }}><Play className="h-4 w-4 mr-1" />Start</Button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
