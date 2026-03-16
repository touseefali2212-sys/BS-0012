import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield,
  Activity,
  Eye,
  Search,
  Clock,
  User,
  AlertTriangle,
  Users,
  ChevronDown,
  ChevronUp,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useToast } from "@/hooks/use-toast";
import type { AuditLog } from "@shared/schema";

const actionColors: Record<string, string> = {
  created: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950",
  updated: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950",
  deleted: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950",
  login: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950",
  logout: "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900",
  exported: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950",
  imported: "text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950",
  approved: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950",
  rejected: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950",
  viewed: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900",
};

const moduleColors: Record<string, string> = {
  customers: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950",
  invoices: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950",
  tickets: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950",
  settings: "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900",
  packages: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950",
  vendors: "text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950",
  resellers: "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950",
  tasks: "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950",
  auth: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950",
  expenses: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950",
  assets: "text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950",
  inventory: "text-lime-700 dark:text-lime-300 bg-lime-50 dark:bg-lime-950",
  hr: "text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950",
  reports: "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950",
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return dateStr;
  }
}

function isToday(dateStr: string): boolean {
  try {
    const date = new Date(dateStr);
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  } catch {
    return false;
  }
}

function formatJsonValues(jsonStr: string | null | undefined): Record<string, unknown> | null {
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export default function AuditLogPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const { data: auditLogs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const allLogs = auditLogs || [];

  const modules = [...new Set(allLogs.map((l) => l.module))].sort();
  const actions = [...new Set(allLogs.map((l) => l.action))].sort();
  const users = [...new Set(allLogs.map((l) => l.userName).filter(Boolean))].sort();

  const filtered = allLogs.filter((log) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      !search ||
      (log.userName || "").toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.module.toLowerCase().includes(searchLower) ||
      (log.entityType || "").toLowerCase().includes(searchLower) ||
      log.description.toLowerCase().includes(searchLower) ||
      (log.ipAddress || "").toLowerCase().includes(searchLower);
    const matchModule = moduleFilter === "all" || log.module === moduleFilter;
    const matchAction = actionFilter === "all" || log.action === actionFilter;
    const matchUser = userFilter === "all" || log.userName === userFilter;
    return matchSearch && matchModule && matchAction && matchUser;
  });

  const totalEntries = allLogs.length;
  const todayActivity = allLogs.filter((l) => isToday(l.createdAt)).length;
  const criticalActions = allLogs.filter(
    (l) => l.action === "deleted" || l.action === "rejected"
  ).length;
  const activeUsers = new Set(allLogs.map((l) => l.userName).filter(Boolean)).size;

  const toggleExpand = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-audit-log-title">
            Audit Log
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Comprehensive activity and change tracking
          </p>
        </div>
        <Badge variant="secondary" className="no-default-active-elevate" data-testid="badge-read-only">
          <Eye className="h-3 w-3 mr-1" />
          Read-Only
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-entries">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <span className="text-sm font-medium text-muted-foreground">Total Entries</span>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold" data-testid="text-total-entries">
                {totalEntries.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
        <Card data-testid="card-today-activity">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <span className="text-sm font-medium text-muted-foreground">Today's Activity</span>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold" data-testid="text-today-activity">
                {todayActivity.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
        <Card data-testid="card-critical-actions">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <span className="text-sm font-medium text-muted-foreground">Critical Actions</span>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold" data-testid="text-critical-actions">
                {criticalActions.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
        <Card data-testid="card-users-active">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <span className="text-sm font-medium text-muted-foreground">Users Active</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold" data-testid="text-users-active">
                {activeUsers}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
            <div className="relative flex-1 w-full lg:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search audit logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-audit"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-module-filter">
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {modules.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-action-filter">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actions.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-user-filter">
                  <SelectValue placeholder="User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u!} value={u!}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No audit logs found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead className="hidden md:table-cell">Entity</TableHead>
                    <TableHead className="hidden lg:table-cell">Description</TableHead>
                    <TableHead className="hidden xl:table-cell">IP Address</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => {
                    const hasDetails = log.oldValues || log.newValues;
                    const isExpanded = expandedRow === log.id;
                    const oldVals = formatJsonValues(log.oldValues);
                    const newVals = formatJsonValues(log.newValues);

                    return (
                      <>
                        <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                              <div className="text-sm">
                                <span data-testid={`text-timestamp-${log.id}`}>
                                  {formatDate(log.createdAt)}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-xs font-medium shrink-0">
                                {(log.userName || "S").charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium" data-testid={`text-user-${log.id}`}>
                                {log.userName || "System"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`no-default-active-elevate text-[10px] capitalize ${actionColors[log.action] || "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900"}`}
                              data-testid={`badge-action-${log.id}`}
                            >
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`no-default-active-elevate text-[10px] capitalize ${moduleColors[log.module] || "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900"}`}
                              data-testid={`badge-module-${log.id}`}
                            >
                              {log.module}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground" data-testid={`text-entity-${log.id}`}>
                            {log.entityType
                              ? `${log.entityType}${log.entityId ? ` #${log.entityId}` : ""}`
                              : "\u2014"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span
                              className="text-sm text-muted-foreground max-w-[250px] truncate block"
                              data-testid={`text-description-${log.id}`}
                            >
                              {log.description}
                            </span>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {log.ipAddress ? (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Globe className="h-3 w-3 shrink-0" />
                                <span data-testid={`text-ip-${log.id}`}>{log.ipAddress}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">{"\u2014"}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {hasDetails && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleExpand(log.id)}
                                data-testid={`button-details-${log.id}`}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        {isExpanded && hasDetails && (
                          <TableRow key={`${log.id}-details`}>
                            <TableCell colSpan={8} className="bg-muted/30 p-4">
                              <div
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                data-testid={`details-panel-${log.id}`}
                              >
                                {oldVals && (
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                                      Previous Values
                                    </p>
                                    <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                                      {Object.entries(oldVals).map(([key, val]) => (
                                        <div key={key} className="flex gap-2">
                                          <span className="text-muted-foreground min-w-[100px] shrink-0">
                                            {key}:
                                          </span>
                                          <span className="text-red-600 dark:text-red-400 break-all">
                                            {String(val ?? "")}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {newVals && (
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                                      New Values
                                    </p>
                                    <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                                      {Object.entries(newVals).map(([key, val]) => (
                                        <div key={key} className="flex gap-2">
                                          <span className="text-muted-foreground min-w-[100px] shrink-0">
                                            {key}:
                                          </span>
                                          <span className="text-green-600 dark:text-green-400 break-all">
                                            {String(val ?? "")}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {!isLoading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
              <span data-testid="text-showing-count">
                Showing {filtered.length} of {totalEntries} entries
              </span>
              <span data-testid="text-filtered-info">
                {moduleFilter !== "all" || actionFilter !== "all" || userFilter !== "all" || search
                  ? "Filtered results"
                  : "All records"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
