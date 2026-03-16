import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, FolderKanban, CheckCircle, Clock, AlertCircle,
  XCircle, Calendar, Users, TrendingUp, DollarSign, Target, BarChart3, Briefcase, Eye,
  ChevronDown, ChevronUp, Download, Filter, MapPin, Building2, Layers, PieChart as PieChartIcon,
  AlertTriangle, Flag, Gauge, ArrowRight, CalendarDays, Banknote, UserCheck,
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
  insertProjectSchema, type Project, type InsertProject,
  type Task, type Employee, type Account,
} from "@shared/schema";
import { z } from "zod";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const projectFormSchema = insertProjectSchema.extend({
  name: z.string().min(2, "Project name is required"),
  department: z.string().min(1, "Department is required"),
});

const projectTypeLabels: Record<string, string> = {
  fiber_deployment: "Fiber Deployment",
  corporate_installation: "Corporate Installation",
  network_expansion: "Network Expansion",
  maintenance: "Maintenance",
  software_development: "Software Development",
  internal_operations: "Internal Operations",
};

const departmentLabels: Record<string, string> = {
  operations: "Operations",
  technical: "Technical",
  finance: "Finance",
  hr: "Human Resources",
  sales: "Sales",
  support: "Customer Support",
  engineering: "Engineering",
  management: "Management",
};

const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  planning: { label: "Planning", color: "text-blue-700 dark:text-blue-300", icon: Layers, bg: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800" },
  active: { label: "Active", color: "text-green-700 dark:text-green-300", icon: CheckCircle, bg: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" },
  on_hold: { label: "On Hold", color: "text-amber-700 dark:text-amber-300", icon: Clock, bg: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800" },
  delayed: { label: "Delayed", color: "text-red-700 dark:text-red-300", icon: AlertTriangle, bg: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800" },
  completed: { label: "Completed", color: "text-slate-700 dark:text-slate-300", icon: CheckCircle, bg: "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" },
  cancelled: { label: "Cancelled", color: "text-gray-500", icon: XCircle, bg: "bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800" },
};

const priorityConfig: Record<string, { label: string; color: string; icon: any }> = {
  high: { label: "High", color: "text-red-600 bg-red-50 dark:bg-red-950 border-red-200", icon: Flag },
  medium: { label: "Medium", color: "text-amber-600 bg-amber-50 dark:bg-amber-950 border-amber-200", icon: Flag },
  low: { label: "Low", color: "text-green-600 bg-green-50 dark:bg-green-950 border-green-200", icon: Flag },
};

const PIE_COLORS = ["#4338CA", "#1D4ED8", "#059669", "#D97706", "#DC2626", "#6B7280"];

const today = new Date().toISOString().split("T")[0];

export default function ProjectsPage() {
  const { toast } = useToast();
  const [tab, changeTab] = useTab("dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [sortField, setSortField] = useState<"name" | "startDate" | "progress" | "approvedBudget">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { data: projects, isLoading } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const { data: tasks } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: employees } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: accounts } = useQuery<Account[]>({ queryKey: ["/api/accounts"] });

  const allProjects = projects || [];
  const allTasks = tasks || [];
  const allEmployees = (employees || []).filter(e => e.status === "active");
  const allAccounts = (accounts || []).filter(a => a.status === "active");

  const form = useForm<InsertProject>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      projectCode: "", name: "", department: "operations", branch: "", projectType: "internal_operations",
      description: "", status: "planning", priority: "medium", startDate: today, endDate: "",
      estimatedDuration: "", estimatedBudget: "0", approvedBudget: "0", usedBudget: "0",
      budgetSource: "", budgetCategory: "", linkedExpenseAccountId: null,
      projectManager: "", teamMembers: "", externalVendor: "",
      progress: 0, totalTasks: 0, completedTasks: 0,
      milestones: "", tags: "", notes: "", createdBy: "admin",
    },
  });

  const nextCode = useMemo(() => {
    const maxNum = allProjects.reduce((max, p) => {
      const m = p.projectCode.match(/PRJ-(\d+)/);
      return m ? Math.max(max, parseInt(m[1])) : max;
    }, 0);
    return `PRJ-${String(maxNum + 1).padStart(4, "0")}`;
  }, [allProjects]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      const res = await apiRequest("POST", "/api/projects", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setDialogOpen(false); form.reset();
      toast({ title: "Project created successfully" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertProject> }) => {
      const res = await apiRequest("PATCH", `/api/projects/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setDialogOpen(false); setEditingProject(null); form.reset();
      toast({ title: "Project updated successfully" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/projects/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project deleted" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const openCreate = () => {
    setEditingProject(null);
    form.reset({
      projectCode: nextCode, name: "", department: "operations", branch: "", projectType: "internal_operations",
      description: "", status: "planning", priority: "medium", startDate: today, endDate: "",
      estimatedDuration: "", estimatedBudget: "0", approvedBudget: "0", usedBudget: "0",
      budgetSource: "", budgetCategory: "", linkedExpenseAccountId: null,
      projectManager: "", teamMembers: "", externalVendor: "",
      progress: 0, totalTasks: 0, completedTasks: 0,
      milestones: "", tags: "", notes: "", createdBy: "admin",
    });
    setDialogOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditingProject(p);
    form.reset({
      projectCode: p.projectCode, name: p.name, department: p.department, branch: p.branch || "",
      projectType: p.projectType, description: p.description || "", status: p.status, priority: p.priority,
      startDate: p.startDate || "", endDate: p.endDate || "", estimatedDuration: p.estimatedDuration || "",
      estimatedBudget: p.estimatedBudget || "0", approvedBudget: p.approvedBudget || "0", usedBudget: p.usedBudget || "0",
      budgetSource: p.budgetSource || "", budgetCategory: p.budgetCategory || "",
      linkedExpenseAccountId: p.linkedExpenseAccountId ?? null,
      projectManager: p.projectManager || "", teamMembers: p.teamMembers || "", externalVendor: p.externalVendor || "",
      progress: p.progress ?? 0, totalTasks: p.totalTasks ?? 0, completedTasks: p.completedTasks ?? 0,
      milestones: p.milestones || "", tags: p.tags || "", notes: p.notes || "", createdBy: p.createdBy || "admin",
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertProject) => {
    if (editingProject) updateMutation.mutate({ id: editingProject.id, data });
    else createMutation.mutate(data);
  };

  const getProjectTasks = (projectId: number) => allTasks.filter(t => t.projectId === projectId);

  const kpis = useMemo(() => {
    const active = allProjects.filter(p => p.status === "active").length;
    const completed = allProjects.filter(p => p.status === "completed").length;
    const delayed = allProjects.filter(p => p.status === "delayed").length;
    const nearDeadline = allProjects.filter(p => {
      if (!p.endDate || p.status === "completed" || p.status === "cancelled") return false;
      const diff = (new Date(p.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }).length;
    const totalBudget = allProjects.reduce((s, p) => s + Number(p.approvedBudget || 0), 0);
    const usedBudget = allProjects.reduce((s, p) => s + Number(p.usedBudget || 0), 0);
    const budgetUtil = totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0;
    return { total: allProjects.length, active, completed, delayed, nearDeadline, totalBudget, usedBudget, budgetUtil };
  }, [allProjects]);

  const deptDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    allProjects.forEach(p => { map[p.department] = (map[p.department] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: departmentLabels[name] || name, value }));
  }, [allProjects]);

  const monthlyCompletion = useMemo(() => {
    const months: Record<string, { month: string; completed: number; created: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      months[key] = { month: d.toLocaleString("default", { month: "short" }), completed: 0, created: 0 };
    }
    allProjects.forEach(p => {
      if (p.createdAt) { const k = p.createdAt.slice(0, 7); if (months[k]) months[k].created++; }
    });
    return Object.values(months);
  }, [allProjects]);

  const filtered = useMemo(() => {
    return allProjects
      .filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.projectCode.toLowerCase().includes(search.toLowerCase()) ||
          (p.projectManager || "").toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || p.status === statusFilter;
        const matchDept = deptFilter === "all" || p.department === deptFilter;
        const matchType = typeFilter === "all" || p.projectType === typeFilter;
        return matchSearch && matchStatus && matchDept && matchType;
      })
      .sort((a, b) => {
        let va: string | number = "", vb: string | number = "";
        if (sortField === "name") { va = a.name; vb = b.name; }
        else if (sortField === "startDate") { va = a.startDate || ""; vb = b.startDate || ""; }
        else if (sortField === "progress") { va = a.progress ?? 0; vb = b.progress ?? 0; }
        else if (sortField === "approvedBudget") { va = Number(a.approvedBudget || 0); vb = Number(b.approvedBudget || 0); }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  }, [allProjects, search, statusFilter, deptFilter, typeFilter, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };
  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field
      ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3 ml-1 inline" /> : <ChevronDown className="h-3 w-3 ml-1 inline" />)
      : <ChevronUp className="h-3 w-3 ml-1 inline opacity-20" />;

  const getDaysRemaining = (endDate: string | null | undefined) => {
    if (!endDate) return null;
    const diff = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const exportCSV = () => {
    const headers = ["Project Code", "Name", "Department", "Type", "Status", "Priority", "Start Date", "End Date", "Progress %", "Approved Budget", "Used Budget", "Project Manager"];
    const rows = filtered.map(p => [
      p.projectCode, p.name, departmentLabels[p.department] || p.department,
      projectTypeLabels[p.projectType] || p.projectType, statusConfig[p.status]?.label || p.status,
      p.priority, p.startDate || "", p.endDate || "", p.progress ?? 0,
      p.approvedBudget || "0", p.usedBudget || "0", p.projectManager || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `projects_export_${today}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported successfully" });
  };

  const DRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value || "—"}</span></div>
  );

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center"><FolderKanban className="h-5 w-5 text-white" /></div>
            Project Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create, manage, and monitor projects across departments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-csv"><Download className="h-4 w-4 mr-1" />Export</Button>
          <Button onClick={openCreate} data-testid="button-create-project"><Plus className="h-4 w-4 mr-1" />New Project</Button>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {[
          { id: "dashboard", label: "Dashboard", icon: BarChart3 },
          { id: "list", label: "Project List", icon: FolderKanban },
          { id: "timeline", label: "Timeline & Progress", icon: TrendingUp },
          { id: "budget", label: "Budget & Resources", icon: DollarSign },
        ].map(t => (
          <button key={t.id} onClick={() => changeTab(t.id)} data-testid={`tab-${t.id}`}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="space-y-5" data-testid="tab-content-dashboard">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "Active Projects", value: kpis.active, icon: Briefcase, gradient: "from-indigo-600 to-blue-600" },
              { label: "Completed", value: kpis.completed, icon: CheckCircle, gradient: "from-green-600 to-emerald-500" },
              { label: "Delayed", value: kpis.delayed, icon: AlertTriangle, gradient: kpis.delayed > 0 ? "from-red-600 to-red-500" : "from-slate-600 to-slate-500" },
              { label: "Near Deadline", value: kpis.nearDeadline, icon: Clock, gradient: kpis.nearDeadline > 0 ? "from-amber-600 to-orange-500" : "from-slate-600 to-slate-500" },
              { label: "Total Budget", value: `Rs. ${kpis.totalBudget.toLocaleString()}`, icon: Banknote, gradient: "from-violet-600 to-purple-500" },
              { label: "Budget Used", value: `${kpis.budgetUtil}%`, icon: Gauge, gradient: kpis.budgetUtil > 90 ? "from-red-600 to-red-500" : "from-teal-600 to-teal-500" },
            ].map(kpi => (
              <div key={kpi.label} className={`bg-gradient-to-br ${kpi.gradient} rounded-lg p-4 text-white shadow-sm`} data-testid={`card-kpi-${kpi.label.toLowerCase().replace(/[\s/%]+/g, "-")}`}>
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
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-indigo-600" />Monthly Project Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyCompletion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="created" name="Created" fill="#4338CA" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><PieChartIcon className="h-4 w-4 text-indigo-600" />Projects by Department</CardTitle></CardHeader>
              <CardContent>
                {deptDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={deptDistribution} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {deptDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No projects yet</div>
                )}
              </CardContent>
            </Card>
          </div>

          {allProjects.filter(p => p.status === "active" || p.status === "delayed").length > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-indigo-600" />Active & Delayed Projects Overview</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {allProjects.filter(p => p.status === "active" || p.status === "delayed").slice(0, 6).map(p => {
                    const st = statusConfig[p.status] || statusConfig.planning;
                    const days = getDaysRemaining(p.endDate);
                    const budget = Number(p.approvedBudget || 0);
                    const used = Number(p.usedBudget || 0);
                    const budgetPct = budget > 0 ? Math.round((used / budget) * 100) : 0;
                    return (
                      <div key={p.id} className={`border rounded-lg p-4 ${st.bg} cursor-pointer hover:shadow-md transition-shadow`} onClick={() => setDetailProject(p)} data-testid={`card-active-project-${p.id}`}>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-[10px] font-mono">{p.projectCode}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${st.color}`}><st.icon className="h-3 w-3 mr-0.5" />{st.label}</Badge>
                        </div>
                        <p className="font-semibold text-sm mb-1">{p.name}</p>
                        <p className="text-xs text-muted-foreground mb-3">{p.projectManager || "No PM assigned"}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs"><span>Progress</span><span className="font-semibold">{p.progress ?? 0}%</span></div>
                          <Progress value={p.progress ?? 0} className="h-1.5" />
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[10px] text-muted-foreground">{days !== null ? (days > 0 ? `${days} days left` : days === 0 ? "Due today" : `${Math.abs(days)} days overdue`) : "No deadline"}</span>
                          {budget > 0 && <span className={`text-[10px] font-semibold ${budgetPct > 90 ? "text-red-600" : "text-muted-foreground"}`}>Budget: {budgetPct}%</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === "list" && (
        <div className="space-y-4" data-testid="tab-content-list">
          <Card className="border shadow-sm">
            <CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" data-testid="input-search-projects" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-9" data-testid="select-status-filter"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="w-[140px] h-9" data-testid="select-dept-filter"><SelectValue placeholder="Department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {Object.entries(departmentLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px] h-9" data-testid="select-type-filter"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(projectTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                {(search || statusFilter !== "all" || deptFilter !== "all" || typeFilter !== "all") && (
                  <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); setDeptFilter("all"); setTypeFilter("all"); }} data-testid="button-clear-filters"><XCircle className="h-3.5 w-3.5 mr-1" />Reset</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FolderKanban className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No projects found</p>
                  <p className="text-sm mt-1">Create your first project to get started</p>
                  <Button className="mt-4" onClick={openCreate} data-testid="button-create-first-project"><Plus className="h-4 w-4 mr-1" />New Project</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30">
                        <TableHead className="text-xs font-semibold">Code</TableHead>
                        <TableHead className="text-xs font-semibold cursor-pointer select-none" onClick={() => toggleSort("name")}>Project Name <SortIcon field="name" /></TableHead>
                        <TableHead className="text-xs font-semibold">Department</TableHead>
                        <TableHead className="text-xs font-semibold">Type</TableHead>
                        <TableHead className="text-xs font-semibold cursor-pointer select-none" onClick={() => toggleSort("startDate")}>Timeline <SortIcon field="startDate" /></TableHead>
                        <TableHead className="text-xs font-semibold cursor-pointer select-none" onClick={() => toggleSort("approvedBudget")}>Budget <SortIcon field="approvedBudget" /></TableHead>
                        <TableHead className="text-xs font-semibold cursor-pointer select-none" onClick={() => toggleSort("progress")}>Progress <SortIcon field="progress" /></TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold">Manager</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(p => {
                        const st = statusConfig[p.status] || statusConfig.planning;
                        const pri = priorityConfig[p.priority] || priorityConfig.medium;
                        const days = getDaysRemaining(p.endDate);
                        const budget = Number(p.approvedBudget || 0);
                        const used = Number(p.usedBudget || 0);
                        const budgetPct = budget > 0 ? Math.round((used / budget) * 100) : 0;
                        return (
                          <TableRow key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900" data-testid={`row-project-${p.id}`}>
                            <TableCell className="text-xs font-mono font-semibold text-indigo-600">{p.projectCode}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-semibold">{p.name}</p>
                                {p.description && <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{p.description}</p>}
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="secondary" className="text-[10px]">{departmentLabels[p.department] || p.department}</Badge></TableCell>
                            <TableCell><span className="text-xs">{projectTypeLabels[p.projectType] || p.projectType}</span></TableCell>
                            <TableCell>
                              <div className="text-xs space-y-0.5">
                                <div className="flex items-center gap-1"><CalendarDays className="h-3 w-3 text-muted-foreground" />{p.startDate || "—"}</div>
                                {p.endDate && <div className="flex items-center gap-1"><ArrowRight className="h-3 w-3 text-muted-foreground" />{p.endDate}</div>}
                                {days !== null && (
                                  <span className={`text-[10px] ${days < 0 ? "text-red-600 font-semibold" : days <= 7 ? "text-amber-600" : "text-muted-foreground"}`}>
                                    {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs space-y-0.5 min-w-[100px]">
                                <span className="font-semibold">Rs. {budget.toLocaleString()}</span>
                                {budget > 0 && (
                                  <>
                                    <Progress value={budgetPct} className="h-1" />
                                    <span className={`text-[10px] ${budgetPct > 90 ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>Used: {budgetPct}%</span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="min-w-[80px]">
                                <div className="flex justify-between text-xs mb-0.5"><span>{p.progress ?? 0}%</span></div>
                                <Progress value={p.progress ?? 0} className="h-1.5" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] border ${st.color}`}><st.icon className="h-3 w-3 mr-0.5" />{st.label}</Badge>
                            </TableCell>
                            <TableCell>
                              {p.projectManager ? (
                                <div className="flex items-center gap-1"><UserCheck className="h-3 w-3 text-muted-foreground" /><span className="text-xs">{p.projectManager}</span></div>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-project-actions-${p.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setDetailProject(p)} data-testid={`button-view-project-${p.id}`}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEdit(p)} data-testid={`button-edit-project-${p.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {p.status !== "completed" && <DropdownMenuItem className="text-green-600" onClick={() => updateMutation.mutate({ id: p.id, data: { status: "completed", progress: 100 } })}><CheckCircle className="h-4 w-4 mr-2" />Mark Completed</DropdownMenuItem>}
                                  {p.status === "active" && <DropdownMenuItem className="text-amber-600" onClick={() => updateMutation.mutate({ id: p.id, data: { status: "on_hold" } })}><Clock className="h-4 w-4 mr-2" />Put On Hold</DropdownMenuItem>}
                                  {(p.status === "on_hold" || p.status === "planning") && <DropdownMenuItem className="text-blue-600" onClick={() => updateMutation.mutate({ id: p.id, data: { status: "active" } })}><Briefcase className="h-4 w-4 mr-2" />Set Active</DropdownMenuItem>}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(p.id)} data-testid={`button-delete-project-${p.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
        </div>
      )}

      {tab === "timeline" && (
        <div className="space-y-4" data-testid="tab-content-timeline">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-indigo-600" />Project Timeline & Progress</CardTitle><CardDescription className="text-xs">Visual progress tracker for all projects</CardDescription></CardHeader>
            <CardContent>
              {allProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><FolderKanban className="h-10 w-10 mb-2 opacity-30" /><p>No projects to display</p></div>
              ) : (
                <div className="space-y-3">
                  {allProjects.filter(p => p.status !== "cancelled").sort((a, b) => (a.startDate || "").localeCompare(b.startDate || "")).map(p => {
                    const st = statusConfig[p.status] || statusConfig.planning;
                    const pri = priorityConfig[p.priority] || priorityConfig.medium;
                    const days = getDaysRemaining(p.endDate);
                    const pTasks = getProjectTasks(p.id);
                    const completedTasks = pTasks.filter(t => t.status === "completed").length;
                    const taskProgress = pTasks.length > 0 ? Math.round((completedTasks / pTasks.length) * 100) : (p.progress ?? 0);
                    const budget = Number(p.approvedBudget || 0);
                    const used = Number(p.usedBudget || 0);
                    return (
                      <div key={p.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow" data-testid={`timeline-project-${p.id}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px] font-mono">{p.projectCode}</Badge>
                              <Badge variant="outline" className={`text-[10px] ${st.color}`}><st.icon className="h-3 w-3 mr-0.5" />{st.label}</Badge>
                              <Badge variant="outline" className={`text-[10px] ${pri.color}`}><pri.icon className="h-3 w-3 mr-0.5" />{pri.label}</Badge>
                            </div>
                            <p className="font-semibold text-sm">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.projectManager ? `PM: ${p.projectManager}` : "No PM assigned"} | {departmentLabels[p.department] || p.department}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">{p.startDate || "—"} → {p.endDate || "—"}</p>
                            {days !== null && (
                              <p className={`text-xs font-semibold mt-0.5 ${days < 0 ? "text-red-600" : days <= 7 ? "text-amber-600" : "text-green-600"}`}>
                                {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? "Due today" : `${days} days remaining`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Progress</p>
                            <div className="flex items-center gap-2">
                              <Progress value={taskProgress} className="h-2 flex-1" />
                              <span className="text-xs font-semibold">{taskProgress}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Tasks</p>
                            <p className="text-sm font-semibold">{completedTasks}/{pTasks.length || (p.totalTasks ?? 0)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Budget</p>
                            <p className="text-sm font-semibold">Rs. {used.toLocaleString()} / {budget.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Milestones</p>
                            <p className="text-sm">{p.milestones ? p.milestones.split(",").length : 0} defined</p>
                          </div>
                        </div>
                        {p.milestones && (
                          <div className="mt-3 pt-2 border-t">
                            <p className="text-[10px] text-muted-foreground uppercase mb-1.5">Milestones</p>
                            <div className="flex flex-wrap gap-1.5">
                              {p.milestones.split(",").map((m, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px]">{m.trim()}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "budget" && (
        <div className="space-y-4" data-testid="tab-content-budget">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg p-4 text-white shadow-sm">
              <p className="text-[10px] text-white/80 uppercase">Total Approved Budget</p>
              <p className="text-xl font-bold">Rs. {kpis.totalBudget.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-emerald-500 rounded-lg p-4 text-white shadow-sm">
              <p className="text-[10px] text-white/80 uppercase">Total Used</p>
              <p className="text-xl font-bold">Rs. {kpis.usedBudget.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-violet-600 to-purple-500 rounded-lg p-4 text-white shadow-sm">
              <p className="text-[10px] text-white/80 uppercase">Remaining</p>
              <p className="text-xl font-bold">Rs. {(kpis.totalBudget - kpis.usedBudget).toLocaleString()}</p>
            </div>
            <div className={`bg-gradient-to-br ${kpis.budgetUtil > 90 ? "from-red-600 to-red-500" : "from-teal-600 to-teal-500"} rounded-lg p-4 text-white shadow-sm`}>
              <p className="text-[10px] text-white/80 uppercase">Utilization</p>
              <p className="text-xl font-bold">{kpis.budgetUtil}%</p>
              <Progress value={kpis.budgetUtil} className="h-1.5 mt-2 bg-white/20" />
            </div>
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-indigo-600" />Project Budget Breakdown</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30">
                    <TableHead className="text-xs font-semibold">Project</TableHead>
                    <TableHead className="text-xs font-semibold">Department</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Estimated</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Approved</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Used</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Variance</TableHead>
                    <TableHead className="text-xs font-semibold">Utilization</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allProjects.filter(p => Number(p.approvedBudget || 0) > 0).map(p => {
                    const est = Number(p.estimatedBudget || 0);
                    const approved = Number(p.approvedBudget || 0);
                    const used = Number(p.usedBudget || 0);
                    const variance = approved - used;
                    const pct = approved > 0 ? Math.round((used / approved) * 100) : 0;
                    const st = statusConfig[p.status] || statusConfig.planning;
                    return (
                      <TableRow key={p.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900 ${pct > 100 ? "bg-red-50/50 dark:bg-red-950/10" : ""}`} data-testid={`row-budget-${p.id}`}>
                        <TableCell>
                          <div><p className="text-sm font-semibold">{p.name}</p><p className="text-[10px] text-muted-foreground font-mono">{p.projectCode}</p></div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{departmentLabels[p.department] || p.department}</Badge></TableCell>
                        <TableCell className="text-right text-xs">Rs. {est.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-xs font-semibold">Rs. {approved.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-xs font-semibold">Rs. {used.toLocaleString()}</TableCell>
                        <TableCell className={`text-right text-xs font-semibold ${variance < 0 ? "text-red-600" : "text-green-600"}`}>Rs. {variance.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="min-w-[80px]">
                            <Progress value={Math.min(pct, 100)} className="h-1.5 mb-0.5" />
                            <span className={`text-[10px] ${pct > 100 ? "text-red-600 font-bold" : pct > 90 ? "text-amber-600 font-semibold" : "text-muted-foreground"}`}>{pct}%</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                  {allProjects.filter(p => Number(p.approvedBudget || 0) > 0).length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No projects with budget allocation</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center"><FolderKanban className="h-4 w-4 text-white" /></div>
              {editingProject ? "Edit Project" : "Create New Project"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" />Section A — Basic Information</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="projectCode" render={({ field }) => <FormItem><FormLabel>Project Code</FormLabel><FormControl><Input {...field} readOnly className="font-mono bg-slate-50 dark:bg-slate-900" data-testid="input-project-code" /></FormControl></FormItem>} />
                    <FormField control={form.control} name="name" render={({ field }) => <FormItem className="col-span-2"><FormLabel>Project Name *</FormLabel><FormControl><Input {...field} placeholder="e.g., DHA Phase 6 Fiber Rollout" data-testid="input-project-name" /></FormControl><FormMessage /></FormItem>} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="department" render={({ field }) => <FormItem><FormLabel>Department *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger data-testid="select-department"><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(departmentLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                    <FormField control={form.control} name="branch" render={({ field }) => <FormItem><FormLabel>Branch</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g., Head Office" data-testid="input-branch" /></FormControl></FormItem>} />
                    <FormField control={form.control} name="projectType" render={({ field }) => <FormItem><FormLabel>Project Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger data-testid="select-project-type"><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(projectTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></FormItem>} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} placeholder="Project scope and objectives..." data-testid="textarea-description" /></FormControl></FormItem>} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Section B — Timeline</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    <FormField control={form.control} name="startDate" render={({ field }) => <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} data-testid="input-start-date" /></FormControl></FormItem>} />
                    <FormField control={form.control} name="endDate" render={({ field }) => <FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} data-testid="input-end-date" /></FormControl></FormItem>} />
                    <FormField control={form.control} name="estimatedDuration" render={({ field }) => <FormItem><FormLabel>Estimated Duration</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g., 3 months" data-testid="input-duration" /></FormControl></FormItem>} />
                    <FormField control={form.control} name="status" render={({ field }) => <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></FormItem>} />
                  </div>
                  <FormField control={form.control} name="milestones" render={({ field }) => <FormItem><FormLabel>Milestones (comma-separated)</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g., Site Survey, Cable Laying, Testing, Go-Live" data-testid="input-milestones" /></FormControl></FormItem>} />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />Section C — Budget</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="estimatedBudget" render={({ field }) => <FormItem><FormLabel>Estimated Budget (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value || "0"} data-testid="input-est-budget" /></FormControl></FormItem>} />
                    <FormField control={form.control} name="approvedBudget" render={({ field }) => <FormItem><FormLabel>Approved Budget (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value || "0"} data-testid="input-approved-budget" /></FormControl></FormItem>} />
                    <FormField control={form.control} name="usedBudget" render={({ field }) => <FormItem><FormLabel>Used Budget (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value || "0"} data-testid="input-used-budget" /></FormControl></FormItem>} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="budgetSource" render={({ field }) => <FormItem><FormLabel>Budget Source</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g., Operating Fund" data-testid="input-budget-source" /></FormControl></FormItem>} />
                    <FormField control={form.control} name="budgetCategory" render={({ field }) => <FormItem><FormLabel>Budget Category</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g., CAPEX" data-testid="input-budget-category" /></FormControl></FormItem>} />
                    <FormField control={form.control} name="linkedExpenseAccountId" render={({ field }) => <FormItem><FormLabel>Linked Expense Account</FormLabel><Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value?.toString() || "none"}><FormControl><SelectTrigger data-testid="select-expense-account"><SelectValue placeholder="Select account" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">— None —</SelectItem>{allAccounts.filter(a => a.type === "expense").map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.code} — {a.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Section D — Team & Responsibility</h4>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="projectManager" render={({ field }) => <FormItem><FormLabel>Project Manager</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger data-testid="select-project-manager"><SelectValue placeholder="Select PM" /></SelectTrigger></FormControl><SelectContent>{allEmployees.map(e => <SelectItem key={e.id} value={e.fullName}>{e.fullName} — {e.designation}</SelectItem>)}<SelectItem value="admin">Admin</SelectItem></SelectContent></Select></FormItem>} />
                    <FormField control={form.control} name="priority" render={({ field }) => <FormItem><FormLabel>Priority</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger data-testid="select-priority"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select></FormItem>} />
                    <FormField control={form.control} name="externalVendor" render={({ field }) => <FormItem><FormLabel>External Vendor</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="If outsourced" data-testid="input-vendor" /></FormControl></FormItem>} />
                  </div>
                  <FormField control={form.control} name="teamMembers" render={({ field }) => <FormItem><FormLabel>Team Members (comma-separated)</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g., Ali Hassan, Sara Khan, Ahmed Raza" data-testid="input-team-members" /></FormControl></FormItem>} />
                  <FormField control={form.control} name="tags" render={({ field }) => <FormItem><FormLabel>Tags (comma-separated)</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g., fiber, critical, phase-2" data-testid="input-tags" /></FormControl></FormItem>} />
                  <FormField control={form.control} name="notes" render={({ field }) => <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} placeholder="Additional notes..." data-testid="textarea-notes" /></FormControl></FormItem>} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-project">
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingProject ? "Update Project" : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailProject} onOpenChange={(open) => { if (!open) setDetailProject(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailProject && (() => {
            const p = detailProject;
            const st = statusConfig[p.status] || statusConfig.planning;
            const pri = priorityConfig[p.priority] || priorityConfig.medium;
            const days = getDaysRemaining(p.endDate);
            const pTasks = getProjectTasks(p.id);
            const completedTasks = pTasks.filter(t => t.status === "completed").length;
            const budget = Number(p.approvedBudget || 0);
            const used = Number(p.usedBudget || 0);
            const budgetPct = budget > 0 ? Math.round((used / budget) * 100) : 0;
            const team = p.teamMembers ? p.teamMembers.split(",").map(m => m.trim()).filter(Boolean) : [];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-md bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center"><FolderKanban className="h-4 w-4 text-white" /></div>
                    {p.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-mono text-xs">{p.projectCode}</Badge>
                    <Badge variant="outline" className={`text-xs ${st.color}`}><st.icon className="h-3 w-3 mr-0.5" />{st.label}</Badge>
                    <Badge variant="outline" className={`text-xs ${pri.color}`}><pri.icon className="h-3 w-3 mr-0.5" />{pri.label}</Badge>
                    <Badge variant="secondary" className="text-xs">{departmentLabels[p.department] || p.department}</Badge>
                    <Badge variant="secondary" className="text-xs">{projectTypeLabels[p.projectType] || p.projectType}</Badge>
                  </div>

                  {p.description && <p className="text-sm text-muted-foreground border-l-2 border-indigo-300 pl-3">{p.description}</p>}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md"><DRow label="Start Date" value={p.startDate} /><DRow label="End Date" value={p.endDate} /><DRow label="Duration" value={p.estimatedDuration} /></div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md"><DRow label="Project Manager" value={p.projectManager} /><DRow label="External Vendor" value={p.externalVendor} /><DRow label="Branch" value={p.branch} /></div>
                  </div>

                  {days !== null && (
                    <div className={`p-3 rounded-md border ${days < 0 ? "bg-red-50 dark:bg-red-950/30 border-red-200" : days <= 7 ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200" : "bg-green-50 dark:bg-green-950/30 border-green-200"}`}>
                      <p className={`text-sm font-semibold ${days < 0 ? "text-red-600" : days <= 7 ? "text-amber-600" : "text-green-600"}`}>
                        {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? "Due today" : `${days} days remaining`}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Progress & Tasks</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-md border border-indigo-200 dark:border-indigo-800">
                        <p className="text-[10px] text-muted-foreground uppercase">Overall Progress</p>
                        <p className="text-xl font-bold text-indigo-600">{p.progress ?? 0}%</p>
                        <Progress value={p.progress ?? 0} className="h-1.5 mt-1" />
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                        <p className="text-[10px] text-muted-foreground uppercase">Tasks</p>
                        <p className="text-xl font-bold text-blue-600">{completedTasks}/{pTasks.length || (p.totalTasks ?? 0)}</p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">
                        <p className="text-[10px] text-muted-foreground uppercase">Task Completion</p>
                        <p className="text-xl font-bold text-green-600">{pTasks.length > 0 ? Math.round((completedTasks / pTasks.length) * 100) : 0}%</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Budget</h4>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md"><p className="text-[10px] text-muted-foreground uppercase">Estimated</p><p className="text-sm font-bold">Rs. {Number(p.estimatedBudget || 0).toLocaleString()}</p></div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md"><p className="text-[10px] text-muted-foreground uppercase">Approved</p><p className="text-sm font-bold">Rs. {budget.toLocaleString()}</p></div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md"><p className="text-[10px] text-muted-foreground uppercase">Used</p><p className="text-sm font-bold">Rs. {used.toLocaleString()}</p></div>
                      <div className={`p-3 rounded-md border ${budgetPct > 100 ? "bg-red-50 dark:bg-red-950/30 border-red-200" : "bg-slate-50 dark:bg-slate-900"}`}>
                        <p className="text-[10px] text-muted-foreground uppercase">Utilization</p>
                        <p className={`text-sm font-bold ${budgetPct > 100 ? "text-red-600" : budgetPct > 90 ? "text-amber-600" : ""}`}>{budgetPct}%</p>
                        <Progress value={Math.min(budgetPct, 100)} className="h-1 mt-1" />
                      </div>
                    </div>
                  </div>

                  {team.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Team Members</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {team.map((m, i) => <Badge key={i} variant="secondary" className="text-xs"><UserCheck className="h-3 w-3 mr-0.5" />{m}</Badge>)}
                      </div>
                    </div>
                  )}

                  {p.milestones && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Milestones</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {p.milestones.split(",").map((m, i) => <Badge key={i} variant="outline" className="text-xs"><Target className="h-3 w-3 mr-0.5" />{m.trim()}</Badge>)}
                      </div>
                    </div>
                  )}

                  {p.notes && <div className="pt-2 border-t"><p className="text-xs text-muted-foreground mb-1">Notes</p><p className="text-sm">{p.notes}</p></div>}

                  <div className="pt-2 border-t flex gap-2">
                    <Button className="flex-1" onClick={() => { setDetailProject(null); openEdit(p); }} data-testid="button-detail-edit"><Edit className="h-4 w-4 mr-1" />Edit Project</Button>
                    {p.status !== "completed" && (
                      <Button variant="outline" className="text-green-600 border-green-300" onClick={() => { updateMutation.mutate({ id: p.id, data: { status: "completed", progress: 100 } }); setDetailProject(null); }} data-testid="button-detail-complete"><CheckCircle className="h-4 w-4 mr-1" />Mark Completed</Button>
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
