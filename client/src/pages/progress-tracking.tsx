import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Target, TrendingUp, CheckCircle, Clock, AlertTriangle, BarChart3,
  Users, FolderKanban, CalendarDays, Flag, Gauge, Timer, Award,
  ArrowRight, ChevronDown, ChevronUp, Search, Download, Filter,
  XCircle, Briefcase, Activity, Layers, AlertCircle, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useTab } from "@/hooks/use-tab";
import { useToast } from "@/hooks/use-toast";
import type { Task, Employee, Project } from "@shared/schema";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

const PIE_COLORS = ["#4F46E5", "#1D4ED8", "#059669", "#D97706", "#DC2626", "#9333EA", "#0891B2", "#F59E0B"];

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: "High", color: "text-red-600 bg-red-50 dark:bg-red-950 border-red-200" },
  medium: { label: "Medium", color: "text-amber-600 bg-amber-50 dark:bg-amber-950 border-amber-200" },
  low: { label: "Low", color: "text-green-600 bg-green-50 dark:bg-green-950 border-green-200" },
};

const statusLabels: Record<string, string> = {
  pending: "Assigned", in_progress: "In Progress", pending_approval: "Pending Approval",
  on_hold: "On Hold", completed: "Completed", cancelled: "Cancelled",
};

const departmentLabels: Record<string, string> = {
  operations: "Operations", technical: "Technical", finance: "Finance",
  hr: "Human Resources", sales: "Sales", support: "Customer Support",
  engineering: "Engineering", management: "Management", noc: "NOC",
};

const today = new Date().toISOString().split("T")[0];

export default function ProgressTrackingPage() {
  const { toast } = useToast();
  const [tab, changeTab] = useTab("overview");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortField, setSortField] = useState<"title" | "progress" | "dueDate">("progress");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: employees } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({ queryKey: ["/api/projects"] });

  const allTasks = tasks || [];
  const allProjects = projects || [];
  const allEmployees = (employees || []).filter(e => e.status === "active");

  const getDaysRemaining = (dueDate: string | null | undefined) => {
    if (!dueDate) return null;
    return Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (task: Task) =>
    task.status !== "completed" && task.status !== "cancelled" && task.dueDate && new Date(task.dueDate) < new Date();

  const getProjectName = (projectId: number | null | undefined) => {
    if (!projectId) return null;
    return allProjects.find(p => p.id === projectId)?.name;
  };

  const kpis = useMemo(() => {
    const activeProjects = allProjects.filter(p => p.status !== "completed" && p.status !== "cancelled").length;
    const activeTasks = allTasks.filter(t => t.status !== "completed" && t.status !== "cancelled").length;
    const completed = allTasks.filter(t => t.status === "completed").length;
    const total = allTasks.length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const overdueTasks = allTasks.filter(t => isOverdue(t)).length;
    const onTimeCompleted = allTasks.filter(t => t.status === "completed" && t.dueDate && new Date(t.completedDate || "") <= new Date(t.dueDate)).length;
    const onTimeRate = completed > 0 ? Math.round((onTimeCompleted / completed) * 100) : 0;
    const avgDuration = (() => {
      const withDates = allTasks.filter(t => t.status === "completed" && t.startDate && t.completedDate);
      if (withDates.length === 0) return "—";
      const totalDays = withDates.reduce((sum, t) => {
        return sum + Math.ceil((new Date(t.completedDate!).getTime() - new Date(t.startDate!).getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      return `${Math.round(totalDays / withDates.length)}d`;
    })();
    return { activeProjects, activeTasks, completionPct, overdueTasks, onTimeRate, avgDuration };
  }, [allTasks, allProjects]);

  const weeklyTrend = useMemo(() => {
    const weeks: { week: string; progress: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const end = new Date(); end.setDate(end.getDate() - (i * 7));
      const start = new Date(end); start.setDate(start.getDate() - 7);
      const label = `W${6 - i}`;
      const completedInWeek = allTasks.filter(t => {
        if (!t.completedDate) return false;
        const d = new Date(t.completedDate);
        return d >= start && d <= end;
      }).length;
      weeks.push({ week: label, progress: completedInWeek });
    }
    return weeks;
  }, [allTasks]);

  const projectCompletion = useMemo(() => {
    const data: { name: string; value: number }[] = [];
    const ranges = [
      { label: "0–25%", min: 0, max: 25 },
      { label: "26–50%", min: 26, max: 50 },
      { label: "51–75%", min: 51, max: 75 },
      { label: "76–99%", min: 76, max: 99 },
      { label: "100%", min: 100, max: 100 },
    ];
    ranges.forEach(r => {
      const count = allProjects.filter(p => {
        const pTasks = allTasks.filter(t => t.projectId === p.id);
        if (pTasks.length === 0) return r.min === 0;
        const pct = Math.round((pTasks.filter(t => t.status === "completed").length / pTasks.length) * 100);
        return pct >= r.min && pct <= r.max;
      }).length;
      if (count > 0) data.push({ name: r.label, value: count });
    });
    return data;
  }, [allProjects, allTasks]);

  const deptPerformance = useMemo(() => {
    const map: Record<string, { name: string; total: number; completed: number; overdue: number }> = {};
    allTasks.forEach(t => {
      const dept = t.department || "unassigned";
      if (!map[dept]) map[dept] = { name: departmentLabels[dept] || dept, total: 0, completed: 0, overdue: 0 };
      map[dept].total++;
      if (t.status === "completed") map[dept].completed++;
      if (isOverdue(t)) map[dept].overdue++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [allTasks]);

  const priorityCompletion = useMemo(() => {
    return ["high", "medium", "low"].map(p => {
      const pTasks = allTasks.filter(t => t.priority === p);
      const completed = pTasks.filter(t => t.status === "completed").length;
      const rate = pTasks.length > 0 ? Math.round((completed / pTasks.length) * 100) : 0;
      return { name: priorityConfig[p]?.label || p, total: pTasks.length, completed, rate };
    });
  }, [allTasks]);

  const projectProgress = useMemo(() => {
    return allProjects.map(p => {
      const pTasks = allTasks.filter(t => t.projectId === p.id);
      const totalTasks = pTasks.length;
      const completedTasks = pTasks.filter(t => t.status === "completed").length;
      const pendingTasks = pTasks.filter(t => t.status !== "completed" && t.status !== "cancelled").length;
      const overdueTasks = pTasks.filter(t => isOverdue(t)).length;
      const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const avgProgress = totalTasks > 0 ? Math.round(pTasks.reduce((s, t) => s + (t.progress ?? 0), 0) / totalTasks) : 0;
      const isDelayed = overdueTasks > 0;
      const delayDays = (() => {
        if (!isDelayed) return 0;
        const maxOverdue = pTasks.filter(t => isOverdue(t)).reduce((max, t) => {
          const d = getDaysRemaining(t.dueDate);
          return d !== null && Math.abs(d) > max ? Math.abs(d) : max;
        }, 0);
        return maxOverdue;
      })();
      return { ...p, totalTasks, completedTasks, pendingTasks, overdueTasks, completionPct, avgProgress, isDelayed, delayDays };
    }).sort((a, b) => b.totalTasks - a.totalTasks);
  }, [allProjects, allTasks]);

  const uniqueAssignees = useMemo(() => {
    const s = new Set(allTasks.map(t => t.assignedTo).filter(Boolean));
    return Array.from(s) as string[];
  }, [allTasks]);

  const filteredTasks = useMemo(() => {
    return allTasks
      .filter(t => t.status !== "cancelled")
      .filter(t => {
        const q = search.toLowerCase();
        const matchSearch = t.title.toLowerCase().includes(q) || (t.taskCode || "").toLowerCase().includes(q);
        const matchDept = deptFilter === "all" || t.department === deptFilter;
        const matchAssignee = assigneeFilter === "all" || t.assignedTo === assigneeFilter;
        const matchOverdue = !overdueOnly || isOverdue(t);
        return matchSearch && matchDept && matchAssignee && matchOverdue;
      })
      .sort((a, b) => {
        let va: string | number = "", vb: string | number = "";
        if (sortField === "title") { va = a.title; vb = b.title; }
        else if (sortField === "progress") { va = a.progress ?? 0; vb = b.progress ?? 0; }
        else if (sortField === "dueDate") { va = a.dueDate || "9999"; vb = b.dueDate || "9999"; }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  }, [allTasks, search, deptFilter, assigneeFilter, overdueOnly, sortField, sortDir]);

  const employeePerformance = useMemo(() => {
    const map: Record<string, {
      name: string; assigned: number; completed: number; overdue: number;
      onTime: number; totalDuration: number; durationCount: number;
    }> = {};
    allTasks.forEach(t => {
      const name = t.assignedTo || "Unassigned";
      if (!map[name]) map[name] = { name, assigned: 0, completed: 0, overdue: 0, onTime: 0, totalDuration: 0, durationCount: 0 };
      map[name].assigned++;
      if (t.status === "completed") {
        map[name].completed++;
        if (t.dueDate && t.completedDate && new Date(t.completedDate) <= new Date(t.dueDate)) map[name].onTime++;
        if (t.startDate && t.completedDate) {
          const dur = Math.ceil((new Date(t.completedDate).getTime() - new Date(t.startDate).getTime()) / (1000 * 60 * 60 * 24));
          map[name].totalDuration += dur;
          map[name].durationCount++;
        }
      }
      if (isOverdue(t)) map[name].overdue++;
    });
    return Object.values(map)
      .filter(e => e.name !== "Unassigned")
      .map(e => ({
        ...e,
        onTimeRate: e.completed > 0 ? Math.round((e.onTime / e.completed) * 100) : 0,
        avgDuration: e.durationCount > 0 ? Math.round(e.totalDuration / e.durationCount) : 0,
        efficiency: e.assigned > 0 ? Math.round(((e.completed / e.assigned) * 70) + ((e.completed > 0 ? (e.onTime / e.completed) : 0) * 30)) : 0,
      }))
      .sort((a, b) => b.efficiency - a.efficiency);
  }, [allTasks]);

  const monthlyProductivity = useMemo(() => {
    const months: { month: string; completed: number; onTime: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString("default", { month: "short" });
      const year = d.getFullYear();
      const month = d.getMonth();
      const completed = allTasks.filter(t => {
        if (!t.completedDate) return false;
        const cd = new Date(t.completedDate);
        return cd.getFullYear() === year && cd.getMonth() === month;
      }).length;
      const onTime = allTasks.filter(t => {
        if (!t.completedDate || !t.dueDate) return false;
        const cd = new Date(t.completedDate);
        return cd.getFullYear() === year && cd.getMonth() === month && cd <= new Date(t.dueDate);
      }).length;
      months.push({ month: label, completed, onTime });
    }
    return months;
  }, [allTasks]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };
  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field
      ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3 ml-1 inline" /> : <ChevronDown className="h-3 w-3 ml-1 inline" />)
      : <ChevronUp className="h-3 w-3 ml-1 inline opacity-20" />;

  const exportCSV = () => {
    const headers = ["Task Code", "Title", "Project", "Assigned To", "Priority", "Est. Hours", "Progress %", "Due Date", "Status", "Delay Days"];
    const rows = filteredTasks.map(t => {
      const days = getDaysRemaining(t.dueDate);
      const delay = days !== null && days < 0 ? Math.abs(days) : 0;
      return [
        t.taskCode || "", t.title, getProjectName(t.projectId) || "", t.assignedTo || "",
        t.priority, t.estimatedHours || "", t.progress ?? 0, t.dueDate || "",
        statusLabels[t.status] || t.status, delay,
      ];
    });
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `progress_tracking_${today}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported successfully" });
  };

  const isLoading = tasksLoading || projectsLoading;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-progress-title">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center"><Activity className="h-5 w-5 text-white" /></div>
            Progress Tracking
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor task and project progress, track performance, and detect delays</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-progress"><Download className="h-4 w-4 mr-1" />Export</Button>
        </div>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        {[
          { id: "overview", label: "Progress Overview", icon: BarChart3 },
          { id: "projects", label: "Project Progress", icon: FolderKanban },
          { id: "tasks", label: "Task Monitoring", icon: Layers },
          { id: "employees", label: "Employee Performance", icon: Users },
          { id: "timeline", label: "Timeline View", icon: CalendarDays },
        ].map(t => (
          <button key={t.id} onClick={() => changeTab(t.id)} data-testid={`tab-${t.id}`}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
      )}

      {/* ========== PROGRESS OVERVIEW TAB ========== */}
      {!isLoading && tab === "overview" && (
        <div className="space-y-5" data-testid="tab-content-overview">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "Active Projects", value: kpis.activeProjects, icon: FolderKanban, gradient: "from-indigo-500 to-blue-700" },
              { label: "Active Tasks", value: kpis.activeTasks, icon: Layers, gradient: "from-blue-500 to-cyan-600" },
              { label: "Overall Completion", value: `${kpis.completionPct}%`, icon: Target, gradient: "from-green-500 to-emerald-600" },
              { label: "Overdue Tasks", value: kpis.overdueTasks, icon: AlertTriangle, gradient: kpis.overdueTasks > 0 ? "from-red-500 to-red-700" : "from-slate-500 to-slate-600" },
              { label: "On-Time Rate", value: `${kpis.onTimeRate}%`, icon: CheckCircle, gradient: "from-teal-500 to-green-600" },
              { label: "Avg Duration", value: kpis.avgDuration, icon: Timer, gradient: "from-violet-500 to-purple-600" },
            ].map(kpi => (
              <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-lg p-4 text-white shadow-sm`} data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-white/60" />
                </div>
                <p className="text-xl font-bold">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-indigo-600" />Weekly Progress Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="progress" name="Tasks Completed" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Gauge className="h-4 w-4 text-indigo-600" />Project Completion Distribution</CardTitle></CardHeader>
              <CardContent>
                {projectCompletion.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={projectCompletion} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {projectCompletion.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data</div>}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4 text-indigo-600" />Department Performance Comparison</CardTitle></CardHeader>
              <CardContent>
                {deptPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={deptPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="completed" name="Completed" fill="#059669" radius={[0, 0, 0, 0]} stackId="a" />
                      <Bar dataKey="overdue" name="Overdue" fill="#DC2626" radius={[0, 0, 0, 0]} stackId="a" />
                      <Bar dataKey="total" name="Total" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No data</div>}
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Flag className="h-4 w-4 text-indigo-600" />Priority-Based Completion</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4 pt-2">
                  {priorityCompletion.map(p => (
                    <div key={p.name} className="space-y-1.5" data-testid={`priority-${p.name.toLowerCase()}`}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{p.name} Priority</span>
                        <span className="text-muted-foreground">{p.completed}/{p.total} ({p.rate}%)</span>
                      </div>
                      <Progress value={p.rate} className="h-2.5" />
                    </div>
                  ))}
                  {allTasks.length === 0 && <div className="text-center text-muted-foreground text-sm py-8">No data</div>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========== PROJECT PROGRESS TAB ========== */}
      {!isLoading && tab === "projects" && (
        <div className="space-y-4" data-testid="tab-content-projects">
          {projectProgress.length === 0 ? (
            <Card className="border shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FolderKanban className="h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium">No projects found</p>
                <p className="text-sm mt-1">Create projects in the Projects module first</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {projectProgress.map(proj => (
                <Card key={proj.id} className={`border shadow-sm ${proj.isDelayed ? "border-red-200 dark:border-red-800" : ""}`} data-testid={`project-progress-${proj.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px] font-mono">{proj.projectCode}</Badge>
                          <h3 className="text-sm font-bold">{proj.name}</h3>
                          {proj.isDelayed && <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="h-3 w-3 mr-0.5" />Delayed {proj.delayDays}d</Badge>}
                          {proj.completionPct === 100 && <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"><CheckCircle className="h-3 w-3 mr-0.5" />Complete</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {proj.department ? (departmentLabels[proj.department] || proj.department) : "—"}
                          {proj.projectManager ? ` | PM: ${proj.projectManager}` : ""}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`text-2xl font-bold ${proj.completionPct === 100 ? "text-green-600" : proj.isDelayed ? "text-red-600" : "text-indigo-600"}`}>{proj.completionPct}%</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Complete</p>
                      </div>
                    </div>
                    <Progress value={proj.completionPct} className={`h-3 mb-3 ${proj.isDelayed ? "[&>div]:bg-red-500" : proj.completionPct === 100 ? "[&>div]:bg-green-500" : "[&>div]:bg-indigo-500"}`} />
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-md">
                        <p className="text-[10px] text-muted-foreground uppercase">Total Tasks</p>
                        <p className="text-lg font-bold">{proj.totalTasks}</p>
                      </div>
                      <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-md">
                        <p className="text-[10px] text-muted-foreground uppercase">Completed</p>
                        <p className="text-lg font-bold text-green-600">{proj.completedTasks}</p>
                      </div>
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                        <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
                        <p className="text-lg font-bold text-blue-600">{proj.pendingTasks}</p>
                      </div>
                      <div className={`p-2 rounded-md ${proj.overdueTasks > 0 ? "bg-red-50 dark:bg-red-950/30" : "bg-slate-50 dark:bg-slate-900"}`}>
                        <p className="text-[10px] text-muted-foreground uppercase">Overdue</p>
                        <p className={`text-lg font-bold ${proj.overdueTasks > 0 ? "text-red-600" : ""}`}>{proj.overdueTasks}</p>
                      </div>
                      <div className="p-2 bg-violet-50 dark:bg-violet-950/30 rounded-md">
                        <p className="text-[10px] text-muted-foreground uppercase">Avg Progress</p>
                        <p className="text-lg font-bold text-violet-600">{proj.avgProgress}%</p>
                      </div>
                    </div>
                    {proj.startDate && (
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />Start: {proj.startDate}</span>
                        {proj.endDate && <span className="flex items-center gap-1"><ArrowRight className="h-3 w-3" />End: {proj.endDate}</span>}
                        {proj.estimatedCompletion && <span className="flex items-center gap-1"><Target className="h-3 w-3" />Est. Completion: {proj.estimatedCompletion}</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== TASK MONITORING TAB ========== */}
      {!isLoading && tab === "tasks" && (
        <div className="space-y-4" data-testid="tab-content-tasks">
          <Card className="border shadow-sm">
            <CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" data-testid="input-search-progress" />
                </div>
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Department" /></SelectTrigger>
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
                <Button variant={overdueOnly ? "destructive" : "outline"} size="sm" onClick={() => setOverdueOnly(!overdueOnly)} data-testid="button-overdue-filter">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />{overdueOnly ? "Showing Overdue" : "Overdue Only"}
                </Button>
                {(search || deptFilter !== "all" || assigneeFilter !== "all" || overdueOnly) && (
                  <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setDeptFilter("all"); setAssigneeFilter("all"); setOverdueOnly(false); }}><XCircle className="h-3.5 w-3.5 mr-1" />Reset</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-0">
              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Layers className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No tasks match the filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30">
                        <TableHead className="text-xs font-semibold">Code</TableHead>
                        <TableHead className="text-xs font-semibold cursor-pointer select-none" onClick={() => toggleSort("title")}>Task Title <SortIcon field="title" /></TableHead>
                        <TableHead className="text-xs font-semibold">Project</TableHead>
                        <TableHead className="text-xs font-semibold">Assigned To</TableHead>
                        <TableHead className="text-xs font-semibold">Priority</TableHead>
                        <TableHead className="text-xs font-semibold">Est. Hours</TableHead>
                        <TableHead className="text-xs font-semibold cursor-pointer select-none" onClick={() => toggleSort("progress")}>Progress <SortIcon field="progress" /></TableHead>
                        <TableHead className="text-xs font-semibold cursor-pointer select-none" onClick={() => toggleSort("dueDate")}>Due Date <SortIcon field="dueDate" /></TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold">Delay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map(task => {
                        const days = getDaysRemaining(task.dueDate);
                        const delay = days !== null && days < 0 ? Math.abs(days) : 0;
                        const ov = isOverdue(task);
                        const pri = priorityConfig[task.priority] || priorityConfig.medium;
                        return (
                          <TableRow key={task.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900 ${ov ? "bg-red-50/30 dark:bg-red-950/10" : ""}`} data-testid={`row-progress-${task.id}`}>
                            <TableCell className="text-xs font-mono font-semibold text-indigo-600">{task.taskCode || "—"}</TableCell>
                            <TableCell>
                              <p className="text-sm font-semibold">{task.title}</p>
                              <p className="text-xs text-muted-foreground">{task.department ? (departmentLabels[task.department] || task.department) : ""}</p>
                            </TableCell>
                            <TableCell><span className="text-xs">{getProjectName(task.projectId) || "—"}</span></TableCell>
                            <TableCell>
                              {task.assignedTo ? (
                                <div className="flex items-center gap-1"><UserCheck className="h-3 w-3 text-muted-foreground" /><span className="text-xs">{task.assignedTo}</span></div>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell><Badge variant="outline" className={`text-[10px] ${pri.color}`}>{pri.label}</Badge></TableCell>
                            <TableCell className="text-xs">{task.estimatedHours || "—"}</TableCell>
                            <TableCell>
                              <div className="min-w-[70px] space-y-0.5">
                                <div className="flex justify-between text-xs"><span className="font-semibold">{task.progress ?? 0}%</span></div>
                                <Progress value={task.progress ?? 0} className={`h-1.5 ${ov ? "[&>div]:bg-red-500" : ""}`} />
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{task.dueDate || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] ${ov ? "text-red-700 bg-red-50 dark:bg-red-950 border-red-200" : task.status === "completed" ? "text-green-700 bg-green-50 dark:bg-green-950" : "text-blue-700 bg-blue-50 dark:bg-blue-950"}`}>
                                {ov ? "Overdue" : statusLabels[task.status] || task.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {delay > 0 ? (
                                <span className="text-xs font-bold text-red-600">{delay}d</span>
                              ) : days !== null && days >= 0 ? (
                                <span className={`text-xs ${days <= 3 ? "text-amber-600 font-semibold" : "text-green-600"}`}>{days === 0 ? "Today" : `${days}d left`}</span>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              {filteredTasks.length > 0 && <div className="px-4 py-2 text-xs text-muted-foreground border-t">Showing {filteredTasks.length} of {allTasks.length} tasks</div>}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========== EMPLOYEE PERFORMANCE TAB ========== */}
      {!isLoading && tab === "employees" && (
        <div className="space-y-5" data-testid="tab-content-employees">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Award className="h-4 w-4 text-indigo-600" />Employee Ranking</CardTitle><CardDescription className="text-xs">Ranked by efficiency score (completion × on-time rate)</CardDescription></CardHeader>
              <CardContent>
                {employeePerformance.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">No data</div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {employeePerformance.map((emp, idx) => (
                      <div key={emp.name} className="flex items-center gap-3 p-2.5 border rounded-lg hover:shadow-sm" data-testid={`emp-rank-${idx}`}>
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${idx === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" : idx === 1 ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : idx === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                          #{idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{emp.name}</p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span>{emp.completed}/{emp.assigned} done</span>
                            <span>{emp.onTimeRate}% on-time</span>
                            {emp.overdue > 0 && <span className="text-red-600">{emp.overdue} overdue</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-indigo-600">{emp.efficiency}</p>
                          <p className="text-[9px] text-muted-foreground uppercase">Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-indigo-600" />Monthly Productivity Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyProductivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="completed" name="Completed" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="onTime" name="On-Time" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4 text-indigo-600" />Department Leaderboard</CardTitle></CardHeader>
            <CardContent>
              {deptPerformance.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">No data</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {deptPerformance.map((dept, idx) => {
                    const rate = dept.total > 0 ? Math.round((dept.completed / dept.total) * 100) : 0;
                    return (
                      <div key={dept.name} className="border rounded-lg p-3 hover:shadow-sm" data-testid={`dept-board-${idx}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                              #{idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{dept.name}</p>
                              <p className="text-[10px] text-muted-foreground">{dept.total} tasks</p>
                            </div>
                          </div>
                          <p className={`text-lg font-bold ${rate >= 75 ? "text-green-600" : rate >= 50 ? "text-amber-600" : "text-red-600"}`}>{rate}%</p>
                        </div>
                        <Progress value={rate} className="h-2" />
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1.5">
                          <span className="text-green-600">{dept.completed} done</span>
                          {dept.overdue > 0 && <span className="text-red-600">{dept.overdue} overdue</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-indigo-600" />Detailed Employee Metrics</CardTitle></CardHeader>
            <CardContent className="p-0">
              {employeePerformance.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">No employee data</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30">
                        <TableHead className="text-xs font-semibold">#</TableHead>
                        <TableHead className="text-xs font-semibold">Employee</TableHead>
                        <TableHead className="text-xs font-semibold">Assigned</TableHead>
                        <TableHead className="text-xs font-semibold">Completed</TableHead>
                        <TableHead className="text-xs font-semibold">On-Time Rate</TableHead>
                        <TableHead className="text-xs font-semibold">Overdue</TableHead>
                        <TableHead className="text-xs font-semibold">Avg Duration</TableHead>
                        <TableHead className="text-xs font-semibold">Efficiency</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeePerformance.map((emp, idx) => (
                        <TableRow key={emp.name} data-testid={`row-emp-${idx}`}>
                          <TableCell className="text-xs font-bold">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">{emp.name.charAt(0)}</div>
                              <span className="text-sm font-medium">{emp.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{emp.assigned}</TableCell>
                          <TableCell className="text-xs text-green-600 font-semibold">{emp.completed}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Progress value={emp.onTimeRate} className="h-1.5 w-16" />
                              <span className="text-xs font-semibold">{emp.onTimeRate}%</span>
                            </div>
                          </TableCell>
                          <TableCell className={`text-xs ${emp.overdue > 0 ? "text-red-600 font-semibold" : ""}`}>{emp.overdue}</TableCell>
                          <TableCell className="text-xs">{emp.avgDuration > 0 ? `${emp.avgDuration}d` : "—"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-[10px] ${emp.efficiency >= 70 ? "text-green-700 bg-green-50 dark:bg-green-950" : emp.efficiency >= 40 ? "text-amber-700 bg-amber-50 dark:bg-amber-950" : "text-red-700 bg-red-50 dark:bg-red-950"}`}>
                              {emp.efficiency} pts
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========== TIMELINE VIEW TAB ========== */}
      {!isLoading && tab === "timeline" && (
        <div className="space-y-5" data-testid="tab-content-timeline">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><CalendarDays className="h-4 w-4 text-indigo-600" />Project Timeline Overview</CardTitle><CardDescription className="text-xs">Visual timeline of projects with task progress and deadlines</CardDescription></CardHeader>
            <CardContent>
              {projectProgress.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground"><FolderKanban className="h-10 w-10 mb-2 opacity-30" /></div>
              ) : (
                <div className="space-y-4">
                  {projectProgress.filter(p => p.totalTasks > 0).map(proj => {
                    const projTasks = allTasks.filter(t => t.projectId === proj.id && t.status !== "cancelled")
                      .sort((a, b) => (a.startDate || "9999").localeCompare(b.startDate || "9999"));
                    return (
                      <div key={proj.id} className="border rounded-lg overflow-hidden" data-testid={`timeline-project-${proj.id}`}>
                        <div className={`px-4 py-2.5 flex items-center justify-between ${proj.isDelayed ? "bg-red-50 dark:bg-red-950/30" : "bg-indigo-50 dark:bg-indigo-950/30"}`}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-mono">{proj.projectCode}</Badge>
                            <span className="text-sm font-bold">{proj.name}</span>
                            {proj.isDelayed && <Badge variant="destructive" className="text-[10px]">Delayed</Badge>}
                          </div>
                          <div className="flex items-center gap-3">
                            <Progress value={proj.completionPct} className="h-2 w-24" />
                            <span className="text-sm font-bold">{proj.completionPct}%</span>
                          </div>
                        </div>
                        <div className="divide-y">
                          {projTasks.slice(0, 10).map(task => {
                            const days = getDaysRemaining(task.dueDate);
                            const ov = isOverdue(task);
                            return (
                              <div key={task.id} className={`px-4 py-2 flex items-center gap-3 text-xs ${ov ? "bg-red-50/50 dark:bg-red-950/10" : ""}`}>
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.status === "completed" ? "#059669" : ov ? "#DC2626" : task.status === "in_progress" ? "#D97706" : "#3B82F6" }} />
                                <Badge variant="outline" className="text-[9px] font-mono shrink-0">{task.taskCode}</Badge>
                                <span className="font-medium flex-1 truncate">{task.title}</span>
                                <span className="text-muted-foreground shrink-0">{task.assignedTo || "—"}</span>
                                <div className="flex items-center gap-1.5 shrink-0 w-20">
                                  <Progress value={task.progress ?? 0} className="h-1 flex-1" />
                                  <span className="text-[10px] w-7 text-right">{task.progress ?? 0}%</span>
                                </div>
                                <span className="text-muted-foreground shrink-0 w-20 text-right">{task.startDate || "—"} → {task.dueDate || "—"}</span>
                                {days !== null && (
                                  <span className={`shrink-0 w-16 text-right font-semibold ${ov ? "text-red-600" : days <= 3 ? "text-amber-600" : "text-green-600"}`}>
                                    {ov ? `${Math.abs(days)}d late` : days === 0 ? "Today" : `${days}d left`}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          {projTasks.length > 10 && (
                            <div className="px-4 py-1.5 text-[10px] text-muted-foreground">+{projTasks.length - 10} more tasks</div>
                          )}
                          {projTasks.length === 0 && (
                            <div className="px-4 py-3 text-xs text-muted-foreground text-center">No tasks in this project</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-indigo-600" />Milestone Progress</CardTitle><CardDescription className="text-xs">Project milestones and deadline tracking</CardDescription></CardHeader>
            <CardContent>
              {projectProgress.filter(p => p.milestones).length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">No milestones defined in any project</div>
              ) : (
                <div className="space-y-3">
                  {projectProgress.filter(p => p.milestones).map(proj => {
                    const milestoneList = (proj.milestones || "").split(",").map(m => m.trim()).filter(Boolean);
                    return (
                      <div key={proj.id} className="border rounded-lg p-3" data-testid={`milestone-${proj.id}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-[10px] font-mono">{proj.projectCode}</Badge>
                          <span className="text-sm font-semibold">{proj.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {milestoneList.map((m, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              <Target className="h-3 w-3 mr-0.5" />{m}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-600" />Delay Analysis</CardTitle><CardDescription className="text-xs">Tasks and projects with delayed progress</CardDescription></CardHeader>
            <CardContent>
              {(() => {
                const overdueTasks = allTasks.filter(t => isOverdue(t)).sort((a, b) => {
                  const da = getDaysRemaining(a.dueDate) || 0;
                  const db = getDaysRemaining(b.dueDate) || 0;
                  return da - db;
                });
                if (overdueTasks.length === 0) return <div className="flex items-center justify-center py-8 text-green-600 text-sm font-medium"><CheckCircle className="h-5 w-5 mr-2" />No delays detected — all tasks are on track!</div>;
                return (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {overdueTasks.slice(0, 15).map(task => {
                      const days = getDaysRemaining(task.dueDate);
                      return (
                        <div key={task.id} className="flex items-center justify-between p-2.5 bg-red-50/50 dark:bg-red-950/20 rounded-md border border-red-100 dark:border-red-900" data-testid={`delay-task-${task.id}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] font-mono shrink-0">{task.taskCode}</Badge>
                              <span className="text-sm font-medium truncate">{task.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {task.assignedTo || "Unassigned"} | {getProjectName(task.projectId) || "No project"} | Due: {task.dueDate}
                            </p>
                          </div>
                          <div className="text-right ml-3 shrink-0">
                            <p className="text-lg font-bold text-red-600">{days !== null ? Math.abs(days) : 0}d</p>
                            <p className="text-[9px] text-red-500 uppercase">Overdue</p>
                          </div>
                        </div>
                      );
                    })}
                    {overdueTasks.length > 15 && <p className="text-xs text-muted-foreground text-center py-1">+{overdueTasks.length - 15} more overdue tasks</p>}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}