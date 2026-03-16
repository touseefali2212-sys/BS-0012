import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity, Search, Shield, Clock, Users, AlertTriangle, Download,
  Loader2, Eye, ChevronDown, ChevronUp, Globe, Monitor, Smartphone,
  Lock, XCircle, CheckCircle2, Edit, Trash2, FileText, LogIn, LogOut,
  BarChart3, Server, Database, Filter, Archive, CalendarDays, RefreshCw,
  User, Zap, CreditCard, Settings, Bell, Package, Briefcase, Hash
} from "lucide-react";
import type { AuditLog, ActivityLog, LoginActivityLog, TaskActivityLog } from "@shared/schema";

const ACTION_COLORS: Record<string, { cls: string; icon: any }> = {
  created: { cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  updated: { cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Edit },
  deleted: { cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: Trash2 },
  viewed: { cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Eye },
  approved: { cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
  rejected: { cls: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400", icon: XCircle },
  login: { cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: LogIn },
  logout: { cls: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400", icon: LogOut },
  exported: { cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Download },
  imported: { cls: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400", icon: Archive },
};

const MODULE_COLORS: Record<string, string> = {
  billing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  customers: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  payments: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  inventory: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  assets: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  hrm: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  settings: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
  notifications: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  auth: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  network: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

const STATUS_ICONS: Record<string, { cls: string; icon: any }> = {
  success: { cls: "text-green-600", icon: CheckCircle2 },
  failed: { cls: "text-red-600", icon: XCircle },
  warning: { cls: "text-amber-600", icon: AlertTriangle },
};

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ActivityLogPage() {
  const [activeTab, setActiveTab] = useState("user");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const [searchText, setSearchText] = useState("");
  const [filterModule, setFilterModule] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterUser, setFilterUser] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const { data: activityLogs = [], isLoading: activityLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
  });

  const { data: loginLogs = [], isLoading: loginLoading } = useQuery<LoginActivityLog[]>({
    queryKey: ["/api/login-activity-logs"],
  });

  const { data: taskLogs = [] } = useQuery<TaskActivityLog[]>({
    queryKey: ["/api/task-activity-logs"],
  });

  const isLoading = auditLoading || activityLoading || loginLoading;

  const today = getToday();

  const kpis = useMemo(() => {
    const todayAudit = auditLogs.filter(l => l.createdAt?.startsWith(today));
    const todayLogin = loginLogs.filter(l => l.loginAt?.startsWith(today));
    const totalToday = todayAudit.length + todayLogin.length;
    const failedLogins = loginLogs.filter(l => l.status === "failed" && l.loginAt?.startsWith(today)).length;
    const criticalChanges = auditLogs.filter(l =>
      (l.action === "deleted" || l.action === "rejected") && l.createdAt?.startsWith(today)
    ).length;
    const deletedRecords = auditLogs.filter(l => l.action === "deleted" && l.createdAt?.startsWith(today)).length;
    const paymentMods = auditLogs.filter(l =>
      (l.module === "payments" || l.module === "billing") && l.action === "updated" && l.createdAt?.startsWith(today)
    ).length;
    const configChanges = auditLogs.filter(l =>
      l.module === "settings" && l.createdAt?.startsWith(today)
    ).length;
    return { totalToday, failedLogins, criticalChanges, deletedRecords, paymentMods, configChanges };
  }, [auditLogs, loginLogs, today]);

  const moduleStats = useMemo(() => {
    const counts: Record<string, number> = {};
    auditLogs.forEach(l => { counts[l.module] = (counts[l.module] || 0) + 1; });
    activityLogs.forEach(l => { counts[l.module] = (counts[l.module] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [auditLogs, activityLogs]);

  const userStats = useMemo(() => {
    const counts: Record<string, number> = {};
    auditLogs.forEach(l => {
      const name = l.userName || `User #${l.userId}`;
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [auditLogs]);

  const uniqueModules = useMemo(() => {
    const mods = new Set<string>();
    auditLogs.forEach(l => mods.add(l.module));
    activityLogs.forEach(l => mods.add(l.module));
    return Array.from(mods).sort();
  }, [auditLogs, activityLogs]);

  const uniqueUsers = useMemo(() => {
    const us = new Set<string>();
    auditLogs.forEach(l => { if (l.userName) us.add(l.userName); });
    return Array.from(us).sort();
  }, [auditLogs]);

  const uniqueActions = useMemo(() => {
    const acts = new Set<string>();
    auditLogs.forEach(l => acts.add(l.action));
    activityLogs.forEach(l => acts.add(l.action));
    return Array.from(acts).sort();
  }, [auditLogs, activityLogs]);

  function matchesFilters(log: { action?: string; module?: string; userName?: string; description?: string; createdAt?: string; ipAddress?: string; entityType?: string; entityId?: number | null }): boolean {
    if (filterModule !== "all" && log.module !== filterModule) return false;
    if (filterAction !== "all" && log.action !== filterAction) return false;
    if (filterUser !== "all" && log.userName !== filterUser) return false;
    if (filterDateFrom && log.createdAt && log.createdAt < filterDateFrom) return false;
    if (filterDateTo && log.createdAt && log.createdAt > filterDateTo + "T23:59:59") return false;
    if (searchText) {
      const s = searchText.toLowerCase();
      const fields = [log.userName, log.description, log.module, log.action, log.ipAddress, log.entityType, log.entityId?.toString()].filter(Boolean);
      if (!fields.some(f => f!.toLowerCase().includes(s))) return false;
    }
    return true;
  }

  const filteredAuditLogs = useMemo(() => auditLogs.filter(matchesFilters), [auditLogs, searchText, filterModule, filterAction, filterUser, filterDateFrom, filterDateTo]);
  const filteredActivityLogs = useMemo(() => activityLogs.filter(l => matchesFilters({ ...l, userName: undefined })), [activityLogs, searchText, filterModule, filterAction, filterUser, filterDateFrom, filterDateTo]);

  const filteredLoginLogs = useMemo(() => {
    return loginLogs.filter(l => {
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      if (filterUser !== "all" && l.username !== filterUser && l.employeeName !== filterUser) return false;
      if (filterDateFrom && l.loginAt < filterDateFrom) return false;
      if (filterDateTo && l.loginAt > filterDateTo + "T23:59:59") return false;
      if (searchText) {
        const s = searchText.toLowerCase();
        const fields = [l.username, l.employeeName, l.ipAddress, l.role, l.branch, l.deviceType, l.failReason];
        if (!fields.some(f => f?.toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [loginLogs, searchText, filterStatus, filterUser, filterDateFrom, filterDateTo]);

  const securityEvents = useMemo(() => {
    const events: { type: string; description: string; timestamp: string; severity: string; source: string; user: string; ip: string }[] = [];

    loginLogs.filter(l => l.status === "failed").forEach(l => {
      events.push({
        type: "Failed Login",
        description: `${l.username} — ${l.failReason || "Invalid credentials"}`,
        timestamp: l.loginAt,
        severity: "high",
        source: "auth",
        user: l.username,
        ip: l.ipAddress || "",
      });
    });

    auditLogs.filter(l => l.action === "deleted").forEach(l => {
      events.push({
        type: "Record Deletion",
        description: l.description,
        timestamp: l.createdAt,
        severity: "high",
        source: l.module,
        user: l.userName || "",
        ip: l.ipAddress || "",
      });
    });

    auditLogs.filter(l => l.module === "settings" && l.action === "updated").forEach(l => {
      events.push({
        type: "Configuration Change",
        description: l.description,
        timestamp: l.createdAt,
        severity: "medium",
        source: l.module,
        user: l.userName || "",
        ip: l.ipAddress || "",
      });
    });

    auditLogs.filter(l => (l.module === "payments" || l.module === "billing") && l.action === "updated").forEach(l => {
      events.push({
        type: "Payment Modification",
        description: l.description,
        timestamp: l.createdAt,
        severity: "high",
        source: l.module,
        user: l.userName || "",
        ip: l.ipAddress || "",
      });
    });

    auditLogs.filter(l => l.action === "exported").forEach(l => {
      events.push({
        type: "Data Export",
        description: l.description,
        timestamp: l.createdAt,
        severity: "medium",
        source: l.module,
        user: l.userName || "",
        ip: l.ipAddress || "",
      });
    });

    return events.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
  }, [auditLogs, loginLogs]);

  function toggleRow(id: number) {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function renderChangeDiff(oldVals: string | null, newVals: string | null) {
    try {
      const oldObj = oldVals ? JSON.parse(oldVals) : {};
      const newObj = newVals ? JSON.parse(newVals) : {};
      const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
      const changedKeys = Array.from(allKeys).filter(k => JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k]));
      if (changedKeys.length === 0) return <p className="text-sm text-muted-foreground italic">No changes detected</p>;
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h5 className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1"><XCircle className="h-3 w-3" /> Previous Values</h5>
            <div className="space-y-1">
              {changedKeys.map(k => (
                <div key={k} className="flex items-center gap-2 text-xs bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded">
                  <span className="font-medium text-red-700 dark:text-red-400 min-w-[120px]">{k}:</span>
                  <span className="text-red-600 dark:text-red-300">{JSON.stringify(oldObj[k] ?? "—")}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> New Values</h5>
            <div className="space-y-1">
              {changedKeys.map(k => (
                <div key={k} className="flex items-center gap-2 text-xs bg-green-50 dark:bg-green-900/10 px-2 py-1 rounded">
                  <span className="font-medium text-green-700 dark:text-green-400 min-w-[120px]">{k}:</span>
                  <span className="text-green-600 dark:text-green-300">{JSON.stringify(newObj[k] ?? "—")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    } catch {
      return <p className="text-sm text-muted-foreground italic">Unable to parse change data</p>;
    }
  }

  function formatTimestamp(ts: string | null) {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return ts;
    }
  }

  function handleExport(format: string) {
    const rows = filteredAuditLogs.map(l => ({
      Timestamp: l.createdAt,
      User: l.userName,
      Action: l.action,
      Module: l.module,
      Entity: `${l.entityType || ""} #${l.entityId || ""}`,
      Description: l.description,
      IP: l.ipAddress,
    }));
    if (format === "csv") {
      const headers = Object.keys(rows[0] || {}).join(",");
      const csv = [headers, ...rows.map(r => Object.values(r).map(v => `"${v || ""}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `activity-log-${today}.csv`; a.click();
      URL.revokeObjectURL(url);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="activity-log-page">
      <div className="bg-gradient-to-r from-[#1F2937] to-[#1E40AF] rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3" data-testid="page-title">
              <Activity className="h-7 w-7" />
              Activity Log & Audit Trail
            </h1>
            <p className="mt-1 text-blue-200 text-sm">
              Complete operational transparency — every action is traceable and accountable
            </p>
          </div>
          <Badge variant="outline" className="text-white border-white/30 bg-white/10 text-xs">
            <Shield className="h-3 w-3 mr-1" /> Read-Only Monitoring
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {[
          { label: "Activities Today", val: kpis.totalToday, icon: Activity, gradient: "from-blue-500 to-blue-600" },
          { label: "Failed Logins", val: kpis.failedLogins, icon: Lock, gradient: "from-red-500 to-red-600" },
          { label: "Critical Changes", val: kpis.criticalChanges, icon: AlertTriangle, gradient: "from-amber-500 to-amber-600" },
          { label: "Deleted Records", val: kpis.deletedRecords, icon: Trash2, gradient: "from-rose-500 to-rose-600" },
          { label: "Payment Mods", val: kpis.paymentMods, icon: CreditCard, gradient: "from-green-500 to-green-600" },
          { label: "Config Changes", val: kpis.configChanges, icon: Settings, gradient: "from-purple-500 to-purple-600" },
        ].map((s, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className={`bg-gradient-to-r ${s.gradient} p-3 text-white flex items-center justify-between`}>
                <div>
                  <div className="text-2xl font-bold" data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, "-")}`}>{s.val}</div>
                  <div className="text-xs text-white/80">{s.label}</div>
                </div>
                <s.icon className="h-8 w-8 opacity-30" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" /> Activity by Module
            </CardTitle>
          </CardHeader>
          <CardContent>
            {moduleStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No module data</p>
            ) : (
              <div className="space-y-2">
                {moduleStats.map(([mod, count]) => {
                  const maxCount = moduleStats[0]?.[1] || 1;
                  return (
                    <div key={mod} className="flex items-center gap-3" data-testid={`stat-module-${mod}`}>
                      <span className="text-xs font-medium w-24 truncate capitalize">{mod}</span>
                      <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#1F2937] to-[#1E40AF] h-full rounded-full transition-all"
                          style={{ width: `${(count as number / (maxCount as number)) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold w-10 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" /> Activity by User
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No user data</p>
            ) : (
              <div className="space-y-2">
                {userStats.map(([usr, count]) => {
                  const maxCount = userStats[0]?.[1] || 1;
                  return (
                    <div key={usr} className="flex items-center gap-3" data-testid={`stat-user-${usr}`}>
                      <span className="text-xs font-medium w-24 truncate">{usr}</span>
                      <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#1E40AF] to-[#1F2937] h-full rounded-full transition-all"
                          style={{ width: `${(count as number / (maxCount as number)) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold w-10 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by user, description, IP, entity ID..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="pl-9" data-testid="input-search" />
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-36" data-testid="input-date-from" />
              <span className="text-xs text-muted-foreground">to</span>
              <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-36" data-testid="input-date-to" />
            </div>
            <Select value={filterModule} onValueChange={setFilterModule}>
              <SelectTrigger className="w-32" data-testid="select-module">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {uniqueModules.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-28" data-testid="select-action">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="w-32" data-testid="select-user">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map(u => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => { setSearchText(""); setFilterModule("all"); setFilterAction("all"); setFilterUser("all"); setFilterStatus("all"); setFilterDateFrom(""); setFilterDateTo(""); }} data-testid="button-clear-filters">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full" data-testid="tabs-list">
          <TabsTrigger value="user" className="flex items-center gap-1 text-xs" data-testid="tab-user">
            <Users className="h-3.5 w-3.5" /> User Activities
          </TabsTrigger>
          <TabsTrigger value="module" className="flex items-center gap-1 text-xs" data-testid="tab-module">
            <Package className="h-3.5 w-3.5" /> Module Activities
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1 text-xs" data-testid="tab-security">
            <Shield className="h-3.5 w-3.5" /> Security Events
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-1 text-xs" data-testid="tab-system">
            <Server className="h-3.5 w-3.5" /> System Logs
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-1 text-xs" data-testid="tab-export">
            <Download className="h-3.5 w-3.5" /> Export & Archive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  User Activity Log
                  <Badge variant="secondary">{filteredAuditLogs.length} entries</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAuditLogs.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-muted-foreground">
                  <Activity className="h-10 w-10 mb-2" />
                  <p>No user activity logs found</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#1F2937] to-[#1E40AF] text-white">
                        <th className="px-3 py-2 text-left font-medium w-8"></th>
                        <th className="px-3 py-2 text-left font-medium">Timestamp</th>
                        <th className="px-3 py-2 text-left font-medium">User</th>
                        <th className="px-3 py-2 text-left font-medium">Action</th>
                        <th className="px-3 py-2 text-left font-medium">Module</th>
                        <th className="px-3 py-2 text-left font-medium">Entity</th>
                        <th className="px-3 py-2 text-left font-medium">Description</th>
                        <th className="px-3 py-2 text-left font-medium">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredAuditLogs.slice(0, 100).map((log) => {
                        const ac = ACTION_COLORS[log.action] || ACTION_COLORS.viewed;
                        const mc = MODULE_COLORS[log.module] || "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
                        const hasChanges = log.oldValues || log.newValues;
                        const isExpanded = expandedRows.has(log.id);
                        return (
                          <>
                            <tr key={log.id} className={`hover:bg-muted/50 cursor-pointer ${isExpanded ? "bg-muted/30" : ""}`} onClick={() => hasChanges && toggleRow(log.id)} data-testid={`row-audit-${log.id}`}>
                              <td className="px-3 py-2">
                                {hasChanges && (
                                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0" data-testid={`button-expand-${log.id}`}>
                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                  </Button>
                                )}
                              </td>
                              <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {formatTimestamp(log.createdAt)}
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#1F2937] to-[#1E40AF] flex items-center justify-center text-[10px] text-white font-bold">
                                    {(log.userName || "?")[0].toUpperCase()}
                                  </div>
                                  <span className="text-xs font-medium">{log.userName || `User #${log.userId}`}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <Badge className={`${ac.cls} text-xs`}>
                                  <ac.icon className="h-3 w-3 mr-1" />{log.action}
                                </Badge>
                              </td>
                              <td className="px-3 py-2">
                                <Badge variant="outline" className={`${mc} text-xs`}>{log.module}</Badge>
                              </td>
                              <td className="px-3 py-2 text-xs">
                                {log.entityType && (
                                  <span className="flex items-center gap-1">
                                    <Hash className="h-3 w-3 text-muted-foreground" />
                                    {log.entityType} {log.entityId ? `#${log.entityId}` : ""}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-xs max-w-[250px] truncate" title={log.description}>{log.description}</td>
                              <td className="px-3 py-2 text-xs text-muted-foreground">
                                {log.ipAddress && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{log.ipAddress}</span>}
                              </td>
                            </tr>
                            {isExpanded && hasChanges && (
                              <tr key={`${log.id}-diff`}>
                                <td colSpan={8} className="px-6 py-4 bg-muted/20">
                                  <div className="text-xs font-semibold mb-2 text-muted-foreground">Change Details</div>
                                  {renderChangeDiff(log.oldValues, log.newValues)}
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredAuditLogs.length > 100 && (
                    <div className="bg-muted/50 px-4 py-2 text-center text-xs text-muted-foreground">
                      Showing 100 of {filteredAuditLogs.length} entries
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="module" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                Module Activity Log
                <Badge variant="secondary">{filteredActivityLogs.length} entries</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredActivityLogs.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-muted-foreground">
                  <Package className="h-10 w-10 mb-2" />
                  <p>No module activity logs found</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#1F2937] to-[#1E40AF] text-white">
                        <th className="px-3 py-2 text-left font-medium">Timestamp</th>
                        <th className="px-3 py-2 text-left font-medium">Action</th>
                        <th className="px-3 py-2 text-left font-medium">Module</th>
                        <th className="px-3 py-2 text-left font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredActivityLogs.slice(0, 100).map((log) => {
                        const ac = ACTION_COLORS[log.action] || ACTION_COLORS.viewed;
                        const mc = MODULE_COLORS[log.module] || "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
                        return (
                          <tr key={log.id} className="hover:bg-muted/50" data-testid={`row-activity-${log.id}`}>
                            <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                              <Clock className="h-3 w-3 inline mr-1" />{formatTimestamp(log.createdAt)}
                            </td>
                            <td className="px-3 py-2">
                              <Badge className={`${ac.cls} text-xs`}>
                                <ac.icon className="h-3 w-3 mr-1" />{log.action}
                              </Badge>
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" className={`${mc} text-xs`}>{log.module}</Badge>
                            </td>
                            <td className="px-3 py-2 text-xs">{log.description}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredActivityLogs.length > 100 && (
                    <div className="bg-muted/50 px-4 py-2 text-center text-xs text-muted-foreground">
                      Showing 100 of {filteredActivityLogs.length} entries
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600" />
                Task Activity Logs
                <Badge variant="secondary">{taskLogs.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {taskLogs.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <Briefcase className="h-8 w-8 mb-2" />
                  <p className="text-sm">No task activity logs</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#1F2937] to-[#1E40AF] text-white">
                        <th className="px-3 py-2 text-left font-medium">Timestamp</th>
                        <th className="px-3 py-2 text-left font-medium">Task</th>
                        <th className="px-3 py-2 text-left font-medium">Project</th>
                        <th className="px-3 py-2 text-left font-medium">Action</th>
                        <th className="px-3 py-2 text-left font-medium">Field</th>
                        <th className="px-3 py-2 text-left font-medium">Performed By</th>
                        <th className="px-3 py-2 text-left font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {taskLogs.slice(0, 50).map((log) => (
                        <tr key={log.id} className="hover:bg-muted/50" data-testid={`row-task-${log.id}`}>
                          <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                            <Clock className="h-3 w-3 inline mr-1" />{formatTimestamp(log.createdAt)}
                          </td>
                          <td className="px-3 py-2 text-xs font-medium">{log.taskCode || log.taskTitle}</td>
                          <td className="px-3 py-2 text-xs">{log.projectName}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-xs">{log.actionType}</Badge>
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {log.fieldChanged && (
                              <span>
                                {log.fieldChanged}: <span className="text-red-500 line-through">{log.oldValue}</span> → <span className="text-green-500">{log.newValue}</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs">{log.performedBy}</td>
                          <td className="px-3 py-2 text-xs max-w-[200px] truncate">{log.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Failed Logins (All)", val: loginLogs.filter(l => l.status === "failed").length, icon: Lock, bgCls: "bg-red-100 dark:bg-red-900/20", iconCls: "text-red-600" },
                { label: "Record Deletions", val: auditLogs.filter(l => l.action === "deleted").length, icon: Trash2, bgCls: "bg-rose-100 dark:bg-rose-900/20", iconCls: "text-rose-600" },
                { label: "Config Changes", val: auditLogs.filter(l => l.module === "settings").length, icon: Settings, bgCls: "bg-amber-100 dark:bg-amber-900/20", iconCls: "text-amber-600" },
                { label: "Payment Mods", val: auditLogs.filter(l => (l.module === "payments" || l.module === "billing") && l.action === "updated").length, icon: CreditCard, bgCls: "bg-purple-100 dark:bg-purple-900/20", iconCls: "text-purple-600" },
              ].map((s, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${s.bgCls}`}>
                      <s.icon className={`h-5 w-5 ${s.iconCls}`} />
                    </div>
                    <div>
                      <div className="text-xl font-bold" data-testid={`sec-stat-${i}`}>{s.val}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-600" />
                  Security & Critical Events
                  <Badge variant="destructive">{securityEvents.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {securityEvents.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-muted-foreground">
                    <Shield className="h-10 w-10 mb-2" />
                    <p>No security events detected</p>
                    <p className="text-xs mt-1">All operations appear normal</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#1F2937] to-[#1E40AF] text-white">
                          <th className="px-3 py-2 text-left font-medium">Severity</th>
                          <th className="px-3 py-2 text-left font-medium">Event Type</th>
                          <th className="px-3 py-2 text-left font-medium">Description</th>
                          <th className="px-3 py-2 text-left font-medium">User</th>
                          <th className="px-3 py-2 text-left font-medium">Source</th>
                          <th className="px-3 py-2 text-left font-medium">IP Address</th>
                          <th className="px-3 py-2 text-left font-medium">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {securityEvents.slice(0, 100).map((ev, i) => (
                          <tr key={i} className="hover:bg-muted/50" data-testid={`row-security-${i}`}>
                            <td className="px-3 py-2">
                              <Badge className={ev.severity === "high"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"}>
                                {ev.severity === "high" ? <AlertTriangle className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                                {ev.severity}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 font-medium text-xs">{ev.type}</td>
                            <td className="px-3 py-2 text-xs max-w-[250px] truncate" title={ev.description}>{ev.description}</td>
                            <td className="px-3 py-2 text-xs">{ev.user || "—"}</td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" className="text-xs">{ev.source}</Badge>
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">
                              {ev.ip && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{ev.ip}</span>}
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{formatTimestamp(ev.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-900/10 dark:to-amber-900/10 border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-400">Security Monitoring Active</h4>
                    <p className="text-sm text-red-700 dark:text-red-500 mt-1">
                      The system automatically monitors: Multiple failed logins, Role permission changes, Payment reversals, Gateway configuration changes, Data export attempts, and Record deletions. Admin is notified on critical activity.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <LogIn className="h-4 w-4 text-blue-600" />
                    Login & Session Logs
                    <Badge variant="secondary">{filteredLoginLogs.length}</Badge>
                  </CardTitle>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-28" data-testid="select-login-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredLoginLogs.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-muted-foreground">
                    <LogIn className="h-10 w-10 mb-2" />
                    <p>No login logs found</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#1F2937] to-[#1E40AF] text-white">
                          <th className="px-3 py-2 text-left font-medium">Login Time</th>
                          <th className="px-3 py-2 text-left font-medium">Username</th>
                          <th className="px-3 py-2 text-left font-medium">Employee</th>
                          <th className="px-3 py-2 text-left font-medium">Role</th>
                          <th className="px-3 py-2 text-left font-medium">Mode</th>
                          <th className="px-3 py-2 text-left font-medium">Branch</th>
                          <th className="px-3 py-2 text-left font-medium">Device</th>
                          <th className="px-3 py-2 text-left font-medium">IP Address</th>
                          <th className="px-3 py-2 text-left font-medium">Status</th>
                          <th className="px-3 py-2 text-left font-medium">Logout</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredLoginLogs.slice(0, 100).map((log) => (
                          <tr key={log.id} className="hover:bg-muted/50" data-testid={`row-login-${log.id}`}>
                            <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                              <Clock className="h-3 w-3 inline mr-1" />{formatTimestamp(log.loginAt)}
                            </td>
                            <td className="px-3 py-2 font-medium text-xs">{log.username}</td>
                            <td className="px-3 py-2 text-xs">{log.employeeName || "—"}</td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" className="text-xs">{log.role || "—"}</Badge>
                            </td>
                            <td className="px-3 py-2 text-xs">{log.loginMode || "—"}</td>
                            <td className="px-3 py-2 text-xs">{log.branch || "—"}</td>
                            <td className="px-3 py-2 text-xs">
                              {log.deviceType === "mobile" ? <Smartphone className="h-3 w-3 inline mr-1" /> : <Monitor className="h-3 w-3 inline mr-1" />}
                              {log.deviceType || "—"}
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">
                              {log.ipAddress && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{log.ipAddress}</span>}
                            </td>
                            <td className="px-3 py-2">
                              <Badge className={log.status === "success"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}>
                                {log.status === "success" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                {log.status}
                              </Badge>
                              {log.failReason && <div className="text-[10px] text-red-500 mt-0.5">{log.failReason}</div>}
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">{log.logoutAt ? formatTimestamp(log.logoutAt) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredLoginLogs.length > 100 && (
                      <div className="bg-muted/50 px-4 py-2 text-center text-xs text-muted-foreground">
                        Showing 100 of {filteredLoginLogs.length} entries
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="export" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Download className="h-4 w-4 text-blue-600" /> Export Activity Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleExport("csv")} data-testid="button-export-csv">
                    <CardContent className="p-6 text-center">
                      <FileText className="h-10 w-10 text-green-600 mx-auto mb-3" />
                      <h4 className="font-medium">Export as CSV</h4>
                      <p className="text-xs text-muted-foreground mt-1">Comma-separated values for spreadsheet analysis</p>
                      <Badge variant="outline" className="mt-3">{filteredAuditLogs.length} records</Badge>
                    </CardContent>
                  </Card>
                  <Card className="opacity-60" data-testid="card-export-excel">
                    <CardContent className="p-6 text-center">
                      <FileText className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                      <h4 className="font-medium">Export as Excel</h4>
                      <p className="text-xs text-muted-foreground mt-1">Formatted spreadsheet with multiple sheets</p>
                      <Badge variant="outline" className="mt-3">Coming Soon</Badge>
                    </CardContent>
                  </Card>
                  <Card className="opacity-60" data-testid="card-export-pdf">
                    <CardContent className="p-6 text-center">
                      <FileText className="h-10 w-10 text-red-600 mx-auto mb-3" />
                      <h4 className="font-medium">Export as PDF</h4>
                      <p className="text-xs text-muted-foreground mt-1">Printable audit report with signatures</p>
                      <Badge variant="outline" className="mt-3">Coming Soon</Badge>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Archive className="h-4 w-4 text-blue-600" /> Data Retention & Archival
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-600" /> Log Statistics
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Audit Logs</span>
                        <span className="font-medium" data-testid="stat-audit-count">{auditLogs.length} records</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Activity Logs</span>
                        <span className="font-medium" data-testid="stat-activity-count">{activityLogs.length} records</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Login Logs</span>
                        <span className="font-medium" data-testid="stat-login-count">{loginLogs.length} records</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Task Logs</span>
                        <span className="font-medium" data-testid="stat-task-count">{taskLogs.length} records</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground font-medium">Total</span>
                        <span className="font-bold" data-testid="stat-total-count">{auditLogs.length + activityLogs.length + loginLogs.length + taskLogs.length} records</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" /> Retention Settings
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Retention Period</Label>
                        <Select defaultValue="365">
                          <SelectTrigger data-testid="select-retention">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 Days</SelectItem>
                            <SelectItem value="90">90 Days</SelectItem>
                            <SelectItem value="180">180 Days</SelectItem>
                            <SelectItem value="365">365 Days</SelectItem>
                            <SelectItem value="unlimited">Unlimited</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Auto-Archive Schedule</Label>
                        <Select defaultValue="monthly">
                          <SelectTrigger data-testid="select-archive-schedule">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-400">Compliance & Legal</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-500 mt-1">
                      Activity logs are immutable and cannot be modified after creation. Only Admin can delete archived logs. All logs include user identity, timestamp, IP address, and action details for complete traceability and regulatory compliance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}