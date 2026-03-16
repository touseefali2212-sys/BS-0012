import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield, Search, Download, Clock, Edit, UserCheck, AlertTriangle,
  Trash2, Flag, TrendingUp, BarChart3, Users, Eye, ChevronDown,
  ChevronUp, XCircle, CalendarDays, ArrowRight, CheckCircle,
  FolderKanban, Activity, Layers, Target, FileText, AlertCircle,
  RefreshCw, History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useTab } from "@/hooks/use-tab";
import { useToast } from "@/hooks/use-toast";
import type { TaskActivityLog, Task, Project } from "@shared/schema";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const PIE_COLORS = ["#1E3A8A", "#334155", "#059669", "#D97706", "#DC2626", "#7C3AED", "#0891B2", "#F59E0B"];

const actionTypeConfig: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
  task_created: { label: "Created", color: "text-green-700 bg-green-50 dark:bg-green-950 border-green-200", icon: CheckCircle, bgColor: "bg-green-500" },
  task_edited: { label: "Updated", color: "text-blue-700 bg-blue-50 dark:bg-blue-950 border-blue-200", icon: Edit, bgColor: "bg-blue-500" },
  status_changed: { label: "Status Changed", color: "text-amber-700 bg-amber-50 dark:bg-amber-950 border-amber-200", icon: RefreshCw, bgColor: "bg-amber-500" },
  priority_changed: { label: "Priority Changed", color: "text-orange-700 bg-orange-50 dark:bg-orange-950 border-orange-200", icon: Flag, bgColor: "bg-orange-500" },
  reassigned: { label: "Reassigned", color: "text-purple-700 bg-purple-50 dark:bg-purple-950 border-purple-200", icon: UserCheck, bgColor: "bg-purple-500" },
  due_date_modified: { label: "Due Date Modified", color: "text-indigo-700 bg-indigo-50 dark:bg-indigo-950 border-indigo-200", icon: CalendarDays, bgColor: "bg-indigo-500" },
  progress_updated: { label: "Progress Updated", color: "text-cyan-700 bg-cyan-50 dark:bg-cyan-950 border-cyan-200", icon: TrendingUp, bgColor: "bg-cyan-500" },
  task_deleted: { label: "Deleted", color: "text-red-700 bg-red-50 dark:bg-red-950 border-red-200", icon: Trash2, bgColor: "bg-red-500" },
};

const severityConfig: Record<string, { label: string; color: string }> = {
  normal: { label: "Normal", color: "text-slate-600 bg-slate-50 dark:bg-slate-900" },
  critical: { label: "Critical", color: "text-red-700 bg-red-50 dark:bg-red-950 border-red-200" },
};

const today = new Date().toISOString().split("T")[0];

export default function TaskAuditPage() {
  const { toast } = useToast();
  const [tab, changeTab] = useTab("overview");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [historyTaskId, setHistoryTaskId] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const { data: logs, isLoading } = useQuery<TaskActivityLog[]>({ queryKey: ["/api/task-activity-logs"] });
  const { data: tasks } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: projects } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const { data: taskHistory } = useQuery<TaskActivityLog[]>({
    queryKey: ["/api/task-activity-logs/task", historyTaskId],
    enabled: historyTaskId !== null,
  });

  const allLogs = logs || [];
  const allTasks = tasks || [];
  const allProjects = projects || [];

  const kpis = useMemo(() => {
    const total = allLogs.length;
    const todayStr = today;
    const todayLogs = allLogs.filter(l => l.createdAt.startsWith(todayStr)).length;
    const statusChanges = allLogs.filter(l => l.actionType === "status_changed").length;
    const reassignments = allLogs.filter(l => l.actionType === "reassigned").length;
    const dueDateChanges = allLogs.filter(l => l.actionType === "due_date_modified").length;
    const deletions = allLogs.filter(l => l.actionType === "task_deleted").length;
    return { total, todayLogs, statusChanges, reassignments, dueDateChanges, deletions };
  }, [allLogs]);

  const activityTrend = useMemo(() => {
    const days: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("default", { weekday: "short" });
      const count = allLogs.filter(l => l.createdAt.startsWith(dateStr)).length;
      days.push({ day: label, count });
    }
    return days;
  }, [allLogs]);

  const mostModifiedProjects = useMemo(() => {
    const map: Record<string, number> = {};
    allLogs.forEach(l => {
      if (l.projectId) {
        const name = l.projectName || allProjects.find(p => p.id === l.projectId)?.name || `Project #${l.projectId}`;
        map[name] = (map[name] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [allLogs, allProjects]);

  const mostActiveUsers = useMemo(() => {
    const map: Record<string, number> = {};
    allLogs.forEach(l => { map[l.performedBy] = (map[l.performedBy] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [allLogs]);

  const actionDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    allLogs.forEach(l => { map[l.actionType] = (map[l.actionType] || 0) + 1; });
    return Object.entries(map).map(([key, value]) => ({
      name: actionTypeConfig[key]?.label || key, value,
    }));
  }, [allLogs]);

  const uniqueUsers = useMemo(() => {
    const s = new Set(allLogs.map(l => l.performedBy));
    return Array.from(s);
  }, [allLogs]);

  const filtered = useMemo(() => {
    return allLogs
      .filter(l => {
        const q = search.toLowerCase();
        const matchSearch = (l.taskTitle || "").toLowerCase().includes(q) ||
          (l.taskCode || "").toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.performedBy.toLowerCase().includes(q);
        const matchAction = actionFilter === "all" || l.actionType === actionFilter;
        const matchUser = userFilter === "all" || l.performedBy === userFilter;
        const matchProject = projectFilter === "all" || String(l.projectId) === projectFilter;
        const matchSeverity = severityFilter === "all" || l.severity === severityFilter;
        return matchSearch && matchAction && matchUser && matchProject && matchSeverity;
      })
      .sort((a, b) => sortDir === "desc" ? b.id - a.id : a.id - b.id);
  }, [allLogs, search, actionFilter, userFilter, projectFilter, severityFilter, sortDir]);

  const suspiciousActivities = useMemo(() => {
    const alerts: { type: string; severity: string; description: string; user: string; count: number; taskTitle: string }[] = [];
    const userStatusChanges: Record<string, { count: number; tasks: string[] }> = {};
    allLogs.filter(l => l.actionType === "status_changed").forEach(l => {
      const key = l.performedBy;
      if (!userStatusChanges[key]) userStatusChanges[key] = { count: 0, tasks: [] };
      userStatusChanges[key].count++;
      if (!userStatusChanges[key].tasks.includes(l.taskTitle || "")) userStatusChanges[key].tasks.push(l.taskTitle || "");
    });
    Object.entries(userStatusChanges).forEach(([user, data]) => {
      if (data.count >= 5) alerts.push({ type: "Multiple Status Changes", severity: "high", description: `${data.count} status changes across ${data.tasks.length} tasks`, user, count: data.count, taskTitle: data.tasks[0] || "" });
    });
    const userDueExtensions: Record<string, number> = {};
    allLogs.filter(l => l.actionType === "due_date_modified").forEach(l => {
      userDueExtensions[l.performedBy] = (userDueExtensions[l.performedBy] || 0) + 1;
    });
    Object.entries(userDueExtensions).forEach(([user, count]) => {
      if (count >= 3) alerts.push({ type: "Frequent Due Date Extensions", severity: "medium", description: `${count} due date modifications`, user, count, taskTitle: "" });
    });
    const userReassignments: Record<string, number> = {};
    allLogs.filter(l => l.actionType === "reassigned").forEach(l => {
      userReassignments[l.performedBy] = (userReassignments[l.performedBy] || 0) + 1;
    });
    Object.entries(userReassignments).forEach(([user, count]) => {
      if (count >= 4) alerts.push({ type: "Repeated Reassignments", severity: "medium", description: `${count} task reassignments`, user, count, taskTitle: "" });
    });
    allLogs.filter(l => l.actionType === "task_deleted").forEach(l => {
      alerts.push({ type: "Task Deletion", severity: "high", description: `Task "${l.taskTitle}" was deleted`, user: l.performedBy, count: 1, taskTitle: l.taskTitle || "" });
    });
    return alerts;
  }, [allLogs]);

  const clearFilters = () => {
    setSearch(""); setActionFilter("all"); setUserFilter("all");
    setProjectFilter("all"); setSeverityFilter("all");
  };
  const hasFilters = search || actionFilter !== "all" || userFilter !== "all" || projectFilter !== "all" || severityFilter !== "all";

  const exportCSV = () => {
    const headers = ["Log ID", "Task Code", "Task Title", "Project", "Action", "Field", "Old Value", "New Value", "Performed By", "Role", "IP", "Date/Time", "Severity"];
    const rows = filtered.map(l => [
      l.id, l.taskCode || "", l.taskTitle || "", l.projectName || "",
      actionTypeConfig[l.actionType]?.label || l.actionType, l.fieldChanged || "",
      l.oldValue || "", l.newValue || "", l.performedBy, l.performedByRole || "",
      l.ipAddress || "", l.createdAt, l.severity || "normal",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `task_audit_${today}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Audit logs exported" });
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("default", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return dateStr; }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-audit-title">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-slate-700 to-blue-900 flex items-center justify-center"><Shield className="h-5 w-5 text-white" /></div>
            Task Audit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track every activity, change, and action performed on tasks across the system</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-audit"><Download className="h-4 w-4 mr-1" />Export Logs</Button>
        </div>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        {[
          { id: "overview", label: "Audit Summary", icon: BarChart3 },
          { id: "logs", label: "Activity Log", icon: FileText },
          { id: "alerts", label: "Alerts & Monitoring", icon: AlertTriangle },
        ].map(t => (
          <button key={t.id} onClick={() => changeTab(t.id)} data-testid={`tab-${t.id}`}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? "border-blue-800 text-blue-800 dark:text-blue-400 dark:border-blue-400" : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
      )}

      {/* ========== AUDIT SUMMARY TAB ========== */}
      {!isLoading && tab === "overview" && (
        <div className="space-y-5" data-testid="tab-content-overview">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "Total Activities", value: kpis.total, icon: Activity, gradient: "from-slate-700 to-blue-900" },
              { label: "Modified Today", value: kpis.todayLogs, icon: Clock, gradient: "from-blue-600 to-blue-800" },
              { label: "Status Changes", value: kpis.statusChanges, icon: RefreshCw, gradient: "from-amber-500 to-amber-700" },
              { label: "Reassignments", value: kpis.reassignments, icon: UserCheck, gradient: "from-purple-500 to-purple-700" },
              { label: "Due Date Changes", value: kpis.dueDateChanges, icon: CalendarDays, gradient: "from-indigo-500 to-indigo-700" },
              { label: "Deletions", value: kpis.deletions, icon: Trash2, gradient: kpis.deletions > 0 ? "from-red-500 to-red-700" : "from-slate-500 to-slate-600" },
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
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-blue-800" />Daily Activity Trend (7 Days)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={activityTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Activities" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Layers className="h-4 w-4 text-blue-800" />Action Type Distribution</CardTitle></CardHeader>
              <CardContent>
                {actionDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={actionDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {actionDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No audit data yet</div>}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><FolderKanban className="h-4 w-4 text-blue-800" />Most Modified Projects</CardTitle></CardHeader>
              <CardContent>
                {mostModifiedProjects.length > 0 ? (
                  <div className="space-y-2.5">
                    {mostModifiedProjects.map((p, i) => (
                      <div key={p.name} className="flex items-center gap-3" data-testid={`modified-project-${i}`}>
                        <span className="text-xs font-bold w-5 text-muted-foreground">#{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="font-medium truncate">{p.name}</span>
                            <span className="text-muted-foreground">{p.value} changes</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-800 rounded-full" style={{ width: `${Math.min(100, (p.value / (mostModifiedProjects[0]?.value || 1)) * 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="flex items-center justify-center h-[150px] text-muted-foreground text-sm">No project activities yet</div>}
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-blue-800" />Most Active Users</CardTitle></CardHeader>
              <CardContent>
                {mostActiveUsers.length > 0 ? (
                  <div className="space-y-2.5">
                    {mostActiveUsers.map((u, i) => (
                      <div key={u.name} className="flex items-center gap-3" data-testid={`active-user-${i}`}>
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="font-medium">{u.name}</span>
                            <span className="text-muted-foreground">{u.value} actions</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-700 dark:bg-slate-500 rounded-full" style={{ width: `${Math.min(100, (u.value / (mostActiveUsers[0]?.value || 1)) * 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="flex items-center justify-center h-[150px] text-muted-foreground text-sm">No user activities yet</div>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========== ACTIVITY LOG TAB ========== */}
      {!isLoading && tab === "logs" && (
        <div className="space-y-4" data-testid="tab-content-logs">
          <Card className="border shadow-sm">
            <CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by task, user, description..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" data-testid="input-search-audit" />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Action Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {Object.entries(actionTypeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="User" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {uniqueUsers.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {allProjects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Severity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}><XCircle className="h-3.5 w-3.5 mr-1" />Reset</Button>}
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Shield className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No audit logs found</p>
                  <p className="text-sm mt-1">Task activities will appear here as they happen</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-100 to-blue-50 dark:from-slate-900 dark:to-blue-950/30">
                        <TableHead className="text-xs font-semibold w-14">Log #</TableHead>
                        <TableHead className="text-xs font-semibold">Task</TableHead>
                        <TableHead className="text-xs font-semibold">Project</TableHead>
                        <TableHead className="text-xs font-semibold">Action</TableHead>
                        <TableHead className="text-xs font-semibold">Old Value</TableHead>
                        <TableHead className="text-xs font-semibold">New Value</TableHead>
                        <TableHead className="text-xs font-semibold">Performed By</TableHead>
                        <TableHead className="text-xs font-semibold cursor-pointer select-none" onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}>
                          Date/Time {sortDir === "desc" ? <ChevronDown className="h-3 w-3 ml-1 inline" /> : <ChevronUp className="h-3 w-3 ml-1 inline" />}
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.slice(0, 100).map(log => {
                        const act = actionTypeConfig[log.actionType] || actionTypeConfig.task_edited;
                        const sev = severityConfig[log.severity || "normal"];
                        return (
                          <TableRow key={log.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900 ${log.severity === "critical" ? "bg-red-50/20 dark:bg-red-950/10" : ""}`} data-testid={`row-log-${log.id}`}>
                            <TableCell className="text-xs font-mono text-muted-foreground">{log.id}</TableCell>
                            <TableCell>
                              <div>
                                <div className="flex items-center gap-1">
                                  {log.taskCode && <Badge variant="outline" className="text-[9px] font-mono">{log.taskCode}</Badge>}
                                  <span className="text-xs font-medium truncate max-w-[140px]">{log.taskTitle || "—"}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><span className="text-xs text-muted-foreground">{log.projectName || (log.projectId ? `#${log.projectId}` : "—")}</span></TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] ${act.color}`}>
                                <act.icon className="h-3 w-3 mr-0.5" />{act.label}
                              </Badge>
                              {log.fieldChanged && <p className="text-[10px] text-muted-foreground mt-0.5">{log.fieldChanged}</p>}
                            </TableCell>
                            <TableCell className="text-xs max-w-[100px]">
                              {log.oldValue ? <span className="truncate block text-red-600/80 line-through">{log.oldValue.length > 40 ? log.oldValue.slice(0, 40) + "…" : log.oldValue}</span> : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-xs max-w-[100px]">
                              {log.newValue ? <span className="truncate block text-green-600 font-medium">{log.newValue.length > 40 ? log.newValue.slice(0, 40) + "…" : log.newValue}</span> : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-slate-700 to-blue-900 flex items-center justify-center text-white text-[9px] font-bold shrink-0">{log.performedBy.charAt(0)}</div>
                                <div>
                                  <p className="text-xs font-medium">{log.performedBy}</p>
                                  <p className="text-[10px] text-muted-foreground">{log.performedByRole || "—"}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <p>{formatDateTime(log.createdAt)}</p>
                                {log.severity === "critical" && <Badge variant="destructive" className="text-[9px] mt-0.5">Critical</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {log.taskId && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setHistoryTaskId(log.taskId!)} data-testid={`button-history-${log.id}`}>
                                  <History className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              {filtered.length > 0 && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-t flex items-center justify-between">
                  <span>Showing {Math.min(filtered.length, 100)} of {filtered.length} entries</span>
                  <span>{allLogs.length} total audit records</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========== ALERTS & MONITORING TAB ========== */}
      {!isLoading && tab === "alerts" && (
        <div className="space-y-5" data-testid="tab-content-alerts">
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" />Suspicious Activity Monitor</CardTitle>
              <CardDescription className="text-xs">Automated detection of unusual patterns in task operations</CardDescription>
            </CardHeader>
            <CardContent>
              {suspiciousActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mb-3 text-green-500 opacity-60" />
                  <p className="font-medium text-green-600">No suspicious activity detected</p>
                  <p className="text-sm mt-1">All operations are within normal parameters</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {suspiciousActivities.map((alert, i) => (
                    <div key={i} className={`border rounded-lg p-3 ${alert.severity === "high" ? "border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10" : alert.severity === "medium" ? "border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10" : "border-slate-200"}`} data-testid={`alert-${i}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${alert.severity === "high" ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400" : alert.severity === "medium" ? "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400" : "bg-slate-100 text-slate-600"}`}>
                            <AlertCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold">{alert.type}</span>
                              <Badge variant={alert.severity === "high" ? "destructive" : "secondary"} className="text-[10px]">
                                {alert.severity === "high" ? "High Risk" : alert.severity === "medium" ? "Medium Risk" : "Low Risk"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{alert.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">User: <span className="font-medium text-foreground">{alert.user}</span></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Trash2 className="h-4 w-4 text-red-600" />Deletion Log</CardTitle><CardDescription className="text-xs">All task deletions are permanently recorded</CardDescription></CardHeader>
              <CardContent>
                {(() => {
                  const deletions = allLogs.filter(l => l.actionType === "task_deleted");
                  if (deletions.length === 0) return <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">No deletions recorded</div>;
                  return (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {deletions.map(l => (
                        <div key={l.id} className="flex items-center justify-between p-2.5 bg-red-50/50 dark:bg-red-950/20 rounded-md border border-red-100 dark:border-red-900" data-testid={`deletion-${l.id}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Trash2 className="h-3 w-3 text-red-600 shrink-0" />
                              <span className="text-xs font-medium truncate">{l.taskTitle}</span>
                              {l.taskCode && <Badge variant="outline" className="text-[9px] font-mono shrink-0">{l.taskCode}</Badge>}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">By {l.performedBy} | {formatDateTime(l.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-blue-800" />Critical Changes</CardTitle><CardDescription className="text-xs">Reassignments, due date modifications, and other high-impact changes</CardDescription></CardHeader>
              <CardContent>
                {(() => {
                  const critical = allLogs.filter(l => l.severity === "critical");
                  if (critical.length === 0) return <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">No critical changes recorded</div>;
                  return (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {critical.slice(0, 15).map(l => {
                        const act = actionTypeConfig[l.actionType] || actionTypeConfig.task_edited;
                        return (
                          <div key={l.id} className="flex items-center gap-2 p-2 border rounded-md" data-testid={`critical-${l.id}`}>
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${act.bgColor}`}>
                              <act.icon className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{l.description}</p>
                              <p className="text-[10px] text-muted-foreground">{l.performedBy} | {formatDateTime(l.createdAt)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========== TASK HISTORY DIALOG ========== */}
      <Dialog open={historyTaskId !== null} onOpenChange={open => { if (!open) setHistoryTaskId(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-slate-700 to-blue-900 flex items-center justify-center"><History className="h-4 w-4 text-white" /></div>
              Task Activity History
            </DialogTitle>
          </DialogHeader>
          {taskHistory && taskHistory.length > 0 ? (
            <div className="space-y-0 relative">
              <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-slate-200 dark:bg-slate-700" />
              {taskHistory.map((log, i) => {
                const act = actionTypeConfig[log.actionType] || actionTypeConfig.task_edited;
                return (
                  <div key={log.id} className="flex gap-3 relative pl-2" data-testid={`history-entry-${log.id}`}>
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 z-10 ${act.bgColor}`}>
                      <act.icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className={`flex-1 pb-4 ${i < taskHistory.length - 1 ? "" : ""}`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="secondary" className={`text-[10px] ${act.color}`}>{act.label}</Badge>
                        {log.severity === "critical" && <Badge variant="destructive" className="text-[9px]">Critical</Badge>}
                      </div>
                      <p className="text-sm">{log.description}</p>
                      {log.oldValue && log.newValue && (
                        <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-md text-xs border">
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 line-through">{log.oldValue}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-green-600 font-medium">{log.newValue}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>{formatDateTime(log.createdAt)}</span>
                        <span>By {log.performedBy}</span>
                        {log.performedByRole && <span>({log.performedByRole})</span>}
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Shield className="h-10 w-10 mb-2 opacity-30" />
              <p>No history available for this task</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}