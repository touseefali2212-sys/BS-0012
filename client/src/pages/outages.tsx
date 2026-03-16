import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, AlertTriangle, Zap, WifiOff,
  Clock, CheckCircle, Shield, Download, Users, Calendar, X,
  Server, Activity, Eye, Building2,
  Timer, ArrowUpCircle, MapPin, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTab } from "@/hooks/use-tab";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertOutageSchema, type Outage, type InsertOutage, type OutageTimeline } from "@shared/schema";
import { z } from "zod";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Area as RechartsArea, AreaChart,
} from "recharts";

const CHART_COLORS = ["#DC2626", "#EA580C", "#F59E0B", "#3B82F6", "#22C55E", "#8B5CF6", "#EC4899", "#06B6D4"];

const OUTAGE_TYPES = [
  { value: "fiber_cut", label: "Fiber Cut" },
  { value: "router_down", label: "Router Down" },
  { value: "power_failure", label: "Power Failure" },
  { value: "vlan_failure", label: "VLAN Failure" },
  { value: "bras_issue", label: "BRAS Issue" },
  { value: "olt_down", label: "OLT Down" },
  { value: "ddos_attack", label: "DDoS Attack" },
  { value: "scheduled_maintenance", label: "Scheduled Maintenance" },
];

const SEVERITY_LEVELS = [
  { value: "critical", label: "Critical", color: "bg-red-600", textColor: "text-red-700 dark:text-red-300", bgColor: "bg-red-100 dark:bg-red-900/40" },
  { value: "high", label: "High", color: "bg-orange-500", textColor: "text-orange-700 dark:text-orange-300", bgColor: "bg-orange-100 dark:bg-orange-900/40" },
  { value: "medium", label: "Medium", color: "bg-yellow-500", textColor: "text-yellow-700 dark:text-yellow-300", bgColor: "bg-yellow-100 dark:bg-yellow-900/40" },
  { value: "low", label: "Low", color: "bg-blue-500", textColor: "text-blue-700 dark:text-blue-300", bgColor: "bg-blue-100 dark:bg-blue-900/40" },
];

const STATUS_CONFIG: Record<string, { icon: any; label: string; dotColor: string; textColor: string; bgColor: string }> = {
  ongoing: { icon: Zap, label: "Major Outage", dotColor: "bg-red-500", textColor: "text-red-700 dark:text-red-300", bgColor: "bg-red-50 dark:bg-red-950" },
  partial: { icon: AlertTriangle, label: "Partial Outage", dotColor: "bg-orange-500", textColor: "text-orange-700 dark:text-orange-300", bgColor: "bg-orange-50 dark:bg-orange-950" },
  degraded: { icon: Activity, label: "Degraded", dotColor: "bg-yellow-500", textColor: "text-yellow-700 dark:text-yellow-300", bgColor: "bg-yellow-50 dark:bg-yellow-950" },
  investigating: { icon: Search, label: "Investigating", dotColor: "bg-blue-500", textColor: "text-blue-700 dark:text-blue-300", bgColor: "bg-blue-50 dark:bg-blue-950" },
  resolved: { icon: CheckCircle, label: "Resolved", dotColor: "bg-green-500", textColor: "text-green-700 dark:text-green-300", bgColor: "bg-green-50 dark:bg-green-950" },
  scheduled: { icon: Calendar, label: "Scheduled", dotColor: "bg-slate-500", textColor: "text-slate-700 dark:text-slate-300", bgColor: "bg-slate-50 dark:bg-slate-950" },
};

function getElapsedMinutes(startTime: string): number {
  const start = new Date(startTime).getTime();
  if (isNaN(start)) return 0;
  return Math.floor((Date.now() - start) / 60000);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

const outageFormSchema = insertOutageSchema.extend({
  outageId: z.string().min(1, "Outage ID is required"),
  title: z.string().min(2, "Title is required"),
  severity: z.string().min(1, "Severity is required"),
  startTime: z.string().min(1, "Start time is required"),
});

export default function OutagesPage() {
  const { toast } = useToast();
  const [tab, setTab] = useTab("dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [popFilter, setPopFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOutage, setEditingOutage] = useState<Outage | null>(null);
  const [selectedOutage, setSelectedOutage] = useState<Outage | null>(null);
  const [timelineNote, setTimelineNote] = useState("");

  const { data: outages, isLoading } = useQuery<Outage[]>({ queryKey: ["/api/outages"] });
  const { data: timelines } = useQuery<OutageTimeline[]>({ queryKey: ["/api/outage-timeline"] });

  const selectedTimelines = useQuery<OutageTimeline[]>({
    queryKey: ["/api/outage-timeline", selectedOutage?.id],
    queryFn: async () => {
      const res = await fetch(`/api/outage-timeline/${selectedOutage!.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch timeline");
      return res.json();
    },
    enabled: !!selectedOutage,
  });

  const form = useForm<InsertOutage>({
    resolver: zodResolver(outageFormSchema),
    defaultValues: {
      outageId: "", title: "", description: "", affectedArea: "", affectedCustomers: 0,
      severity: "medium", type: "unplanned", status: "ongoing", startTime: "",
      estimatedRestore: "", endTime: "", rootCause: "", resolution: "",
      notifiedCustomers: false, createdBy: "", outageType: "router_down",
      affectedPop: "", affectedDevice: "", affectedVlan: "",
      assignedEngineer: "", assignedTeam: "", slaLimitMinutes: 240,
      notifyManagement: false, createLinkedTask: false,
      corporateAffected: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertOutage) => {
      const res = await apiRequest("POST", "/api/outages", data);
      return res.json();
    },
    onSuccess: (created: Outage) => {
      queryClient.invalidateQueries({ queryKey: ["/api/outages"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Outage reported successfully" });
      addTimelineEntry(created.id, "Outage declared", "ongoing", "System", `Incident ${created.outageId} created with severity: ${created.severity}`);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertOutage> }) => {
      const res = await apiRequest("PATCH", `/api/outages/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outages"] });
      setDialogOpen(false);
      setEditingOutage(null);
      form.reset();
      toast({ title: "Outage updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/outages/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outages"] });
      toast({ title: "Outage deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (o: Outage) => {
      const elapsed = getElapsedMinutes(o.startTime);
      const res = await apiRequest("PATCH", `/api/outages/${o.id}`, {
        status: "resolved",
        endTime: new Date().toISOString(),
        resolutionTimeMinutes: elapsed,
        slaBreach: elapsed > (o.slaLimitMinutes || 240),
      });
      return res.json();
    },
    onSuccess: (updated: Outage) => {
      queryClient.invalidateQueries({ queryKey: ["/api/outages"] });
      toast({ title: "Outage resolved" });
      addTimelineEntry(updated.id, "Issue resolved", "resolved", "Admin", `Resolution time: ${formatDuration(updated.resolutionTimeMinutes || 0)}`);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const escalateMutation = useMutation({
    mutationFn: async (o: Outage) => {
      const res = await apiRequest("PATCH", `/api/outages/${o.id}`, {
        escalated: true,
        escalatedTo: "Management",
        escalatedAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: (updated: Outage) => {
      queryClient.invalidateQueries({ queryKey: ["/api/outages"] });
      toast({ title: "Outage escalated to management" });
      addTimelineEntry(updated.id, "Escalated to management", "warning", "System", "SLA breach threshold reached");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addTimelineEntry = async (outageId: number, action: string, status: string, user: string, notes: string) => {
    try {
      await apiRequest("POST", "/api/outage-timeline", {
        outageId, action, status, user, notes,
        timestamp: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/outage-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/outage-timeline", outageId] });
    } catch { /* silent */ }
  };

  const addTimelineMutation = useMutation({
    mutationFn: async ({ outageId, note }: { outageId: number; note: string }) => {
      await apiRequest("POST", "/api/outage-timeline", {
        outageId, action: "Status update", status: "info", user: "Admin", notes: note,
        timestamp: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outage-timeline"] });
      if (selectedOutage) queryClient.invalidateQueries({ queryKey: ["/api/outage-timeline", selectedOutage.id] });
      setTimelineNote("");
      toast({ title: "Timeline entry added" });
    },
  });

  const openCreate = () => {
    setEditingOutage(null);
    const nextId = `OUT-${String((outages?.length || 0) + 1).padStart(4, "0")}`;
    form.reset({
      outageId: nextId, title: "", description: "", affectedArea: "", affectedCustomers: 0,
      severity: "medium", type: "unplanned", status: "ongoing",
      startTime: new Date().toISOString().slice(0, 16), estimatedRestore: "", endTime: "",
      rootCause: "", resolution: "", notifiedCustomers: false, createdBy: "",
      outageType: "router_down", affectedPop: "", affectedDevice: "", affectedVlan: "",
      assignedEngineer: "", assignedTeam: "", slaLimitMinutes: 240,
      notifyManagement: false, createLinkedTask: false, corporateAffected: 0,
    });
    setDialogOpen(true);
  };

  const openEdit = (outage: Outage) => {
    setEditingOutage(outage);
    form.reset({
      outageId: outage.outageId, title: outage.title,
      description: outage.description || "", affectedArea: outage.affectedArea || "",
      affectedCustomers: outage.affectedCustomers ?? 0, severity: outage.severity,
      type: outage.type, status: outage.status, startTime: outage.startTime,
      estimatedRestore: outage.estimatedRestore || "", endTime: outage.endTime || "",
      rootCause: outage.rootCause || "", resolution: outage.resolution || "",
      notifiedCustomers: outage.notifiedCustomers ?? false, createdBy: outage.createdBy || "",
      outageType: outage.outageType || "router_down",
      affectedPop: outage.affectedPop || "", affectedDevice: outage.affectedDevice || "",
      affectedVlan: outage.affectedVlan || "", assignedEngineer: outage.assignedEngineer || "",
      assignedTeam: outage.assignedTeam || "", slaLimitMinutes: outage.slaLimitMinutes ?? 240,
      notifyManagement: outage.notifyManagement ?? false,
      createLinkedTask: outage.createLinkedTask ?? false,
      corporateAffected: outage.corporateAffected ?? 0,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertOutage) => {
    if (editingOutage) {
      updateMutation.mutate({ id: editingOutage.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const allOutages = outages || [];
  const allTimelines = timelines || [];

  const activeOutages = allOutages.filter(o => o.status !== "resolved" && o.status !== "scheduled").length;
  const majorIncidents = allOutages.filter(o => (o.severity === "critical" || o.severity === "high") && o.status !== "resolved").length;
  const totalAffected = allOutages.filter(o => o.status !== "resolved").reduce((s, o) => s + (o.affectedCustomers ?? 0), 0);
  const popsAffected = new Set(allOutages.filter(o => o.status !== "resolved" && o.affectedPop).map(o => o.affectedPop)).size;
  const resolvedOutages = allOutages.filter(o => o.status === "resolved" && o.resolutionTimeMinutes);
  const avgResolution = resolvedOutages.length > 0 ? Math.round(resolvedOutages.reduce((s, o) => s + (o.resolutionTimeMinutes || 0), 0) / resolvedOutages.length) : 0;
  const slaBreachCount = allOutages.filter(o => o.slaBreach).length;

  const uniquePops = [...new Set(allOutages.map(o => o.affectedPop).filter(Boolean))] as string[];

  const filtered = useMemo(() => {
    return allOutages.filter(o => {
      const q = search.toLowerCase();
      const matchSearch = !q || o.title.toLowerCase().includes(q) || o.outageId.toLowerCase().includes(q) || (o.affectedArea || "").toLowerCase().includes(q) || (o.affectedDevice || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const matchSeverity = severityFilter === "all" || o.severity === severityFilter;
      const matchPop = popFilter === "all" || o.affectedPop === popFilter;
      return matchSearch && matchStatus && matchSeverity && matchPop;
    });
  }, [allOutages, search, statusFilter, severityFilter, popFilter]);

  const regionData = useMemo(() => {
    const map: Record<string, number> = {};
    allOutages.forEach(o => {
      const area = o.affectedArea || "Unknown";
      map[area] = (map[area] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name: name.length > 12 ? name.slice(0, 12) + "..." : name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [allOutages]);

  const rootCauseData = useMemo(() => {
    const map: Record<string, number> = {};
    allOutages.forEach(o => {
      const t = OUTAGE_TYPES.find(ot => ot.value === o.outageType)?.label || o.outageType || "Unknown";
      map[t] = (map[t] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allOutages]);

  const monthlyTrend = useMemo(() => {
    const map: Record<string, number> = {};
    allOutages.forEach(o => {
      if (o.startTime) {
        const d = new Date(o.startTime);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          map[key] = (map[key] || 0) + 1;
        }
      }
    });
    return Object.entries(map).sort().slice(-12).map(([month, count]) => ({ month, count }));
  }, [allOutages]);

  const resolutionAnalysis = useMemo(() => {
    return SEVERITY_LEVELS.map(s => {
      const items = allOutages.filter(o => o.severity === s.value && o.resolutionTimeMinutes);
      const avg = items.length > 0 ? Math.round(items.reduce((sum, o) => sum + (o.resolutionTimeMinutes || 0), 0) / items.length) : 0;
      return { name: s.label, avgMinutes: avg, count: items.length };
    });
  }, [allOutages]);

  const getSeverityStyle = (severity: string) => {
    const s = SEVERITY_LEVELS.find(l => l.value === severity);
    return s ? `${s.textColor} ${s.bgColor}` : "";
  };

  const getStatusConfig = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.ongoing;

  const getOutageTypeLabel = (t: string | null) => OUTAGE_TYPES.find(ot => ot.value === t)?.label || t || "Unknown";

  const tabs = [
    { id: "dashboard", label: "Overview", icon: Activity },
    { id: "active", label: "Active Outages", icon: Zap },
    { id: "create", label: "Report Incident", icon: Plus },
    { id: "impact", label: "Impact Analysis", icon: Users },
    { id: "sla", label: "SLA Tracking", icon: Timer },
    { id: "timeline", label: "Incident Timeline", icon: Clock },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-lg" data-testid="icon-outages">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-outages-title">Outage Management</h1>
            <p className="text-sm text-muted-foreground">Emergency operations center &mdash; {activeOutages} active incidents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open("/api/export/outages", "_blank")} data-testid="button-export-outages">
            <Download className="h-3.5 w-3.5 mr-1" />Export
          </Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={openCreate} data-testid="button-add-outage">
            <Plus className="h-3.5 w-3.5 mr-1" />Report Outage
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100 dark:bg-slate-900 flex-wrap h-auto p-1">
          {tabs.map(t => (
            <TabsTrigger key={t.id} value={t.id} className="text-xs gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-orange-500 data-[state=active]:text-white" data-testid={`tab-${t.id}`}>
              <t.icon className="h-3.5 w-3.5" />{t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "dashboard" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "Active Outages", value: activeOutages, icon: Zap, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
              { label: "Major Incidents", value: majorIncidents, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
              { label: "Customers Affected", value: totalAffected, icon: Users, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
              { label: "POPs Affected", value: popsAffected, icon: Server, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
              { label: "Avg Resolution", value: formatDuration(avgResolution), icon: Clock, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
              { label: "SLA Breaches", value: slaBreachCount, icon: Shield, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30" },
            ].map((kpi, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-8 w-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                      <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold font-mono" data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>{kpi.value}</div>
                  <div className="text-[10px] text-muted-foreground">{kpi.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Outages by Region</CardTitle></CardHeader>
              <CardContent>
                {regionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={regionData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#DC2626" radius={[0, 4, 4, 0]} name="Outages" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="text-center py-10 text-sm text-muted-foreground">No outage data</div>}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Incident Trend</CardTitle></CardHeader>
              <CardContent>
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={monthlyTrend}>
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <RechartsArea type="monotone" dataKey="count" stroke="#EA580C" fill="#EA580C" fillOpacity={0.15} name="Incidents" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <div className="text-center py-10 text-sm text-muted-foreground">No trend data</div>}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Root Cause Distribution</CardTitle></CardHeader>
              <CardContent>
                {rootCauseData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={rootCauseData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                        {rootCauseData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="text-center py-10 text-sm text-muted-foreground">No data</div>}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Resolution Time by Severity</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={resolutionAnalysis}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => formatDuration(v)} />
                    <Bar dataKey="avgMinutes" name="Avg Minutes" radius={[4, 4, 0, 0]}>
                      {resolutionAnalysis.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "active" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search outages..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" data-testid="input-search-outages" />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[130px] h-9" data-testid="select-severity-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                {SEVERITY_LEVELS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={popFilter} onValueChange={setPopFilter}>
              <SelectTrigger className="w-[130px] h-9" data-testid="select-pop-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All POPs</SelectItem>
                {uniquePops.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9" data-testid="select-outage-status-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <WifiOff className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No outages found</p>
                  <p className="text-sm mt-1">Report a new outage to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                        <TableHead className="text-[10px] font-semibold">ID</TableHead>
                        <TableHead className="text-[10px] font-semibold">Title</TableHead>
                        <TableHead className="text-[10px] font-semibold">Type</TableHead>
                        <TableHead className="text-[10px] font-semibold">Severity</TableHead>
                        <TableHead className="text-[10px] font-semibold hidden md:table-cell">POP</TableHead>
                        <TableHead className="text-[10px] font-semibold hidden md:table-cell">Device</TableHead>
                        <TableHead className="text-[10px] font-semibold">Affected</TableHead>
                        <TableHead className="text-[10px] font-semibold hidden lg:table-cell">Start</TableHead>
                        <TableHead className="text-[10px] font-semibold">Status</TableHead>
                        <TableHead className="text-[10px] font-semibold hidden lg:table-cell">Engineer</TableHead>
                        <TableHead className="text-[10px] font-semibold hidden xl:table-cell">ETA</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(outage => {
                        const sc = getStatusConfig(outage.status);
                        const StatusIcon = sc.icon;
                        const elapsed = outage.status !== "resolved" ? getElapsedMinutes(outage.startTime) : 0;
                        const slaLimit = outage.slaLimitMinutes || 240;
                        const nearBreach = elapsed > slaLimit * 0.8 && elapsed <= slaLimit;
                        const breached = elapsed > slaLimit || outage.slaBreach;
                        return (
                          <TableRow key={outage.id} className={`${breached ? "bg-red-50/50 dark:bg-red-950/20" : nearBreach ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`} data-testid={`row-outage-${outage.id}`}>
                            <TableCell className="font-mono text-xs" data-testid={`text-outage-id-${outage.id}`}>{outage.outageId}</TableCell>
                            <TableCell>
                              <button onClick={() => setSelectedOutage(outage)} className="text-left" data-testid={`button-view-outage-${outage.id}`}>
                                <div className="font-medium text-xs max-w-[180px] truncate text-blue-600 dark:text-blue-400 hover:underline">{outage.title}</div>
                              </button>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="text-[9px]">{getOutageTypeLabel(outage.outageType)}</Badge></TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[9px] capitalize ${getSeverityStyle(outage.severity)}`} data-testid={`badge-severity-${outage.id}`}>{outage.severity}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{outage.affectedPop || "—"}</TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">{outage.affectedDevice || "—"}</TableCell>
                            <TableCell className="text-xs font-medium">{outage.affectedCustomers ?? 0}</TableCell>
                            <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">{outage.startTime ? new Date(outage.startTime).toLocaleString() : "—"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[9px] capitalize ${sc.textColor} ${sc.bgColor}`} data-testid={`badge-status-${outage.id}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />{outage.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{outage.assignedEngineer || "—"}</TableCell>
                            <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">{outage.estimatedRestore ? new Date(outage.estimatedRestore).toLocaleString() : "—"}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-outage-actions-${outage.id}`}><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedOutage(outage)} data-testid={`button-view-detail-${outage.id}`}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEdit(outage)} data-testid={`button-edit-outage-${outage.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                  {outage.status !== "resolved" && (
                                    <>
                                      <DropdownMenuItem onClick={() => resolveMutation.mutate(outage)} data-testid={`button-resolve-outage-${outage.id}`}><CheckCircle className="h-4 w-4 mr-2" />Resolve</DropdownMenuItem>
                                      {!outage.escalated && (
                                        <DropdownMenuItem onClick={() => escalateMutation.mutate(outage)} data-testid={`button-escalate-outage-${outage.id}`}><ArrowUpCircle className="h-4 w-4 mr-2" />Escalate</DropdownMenuItem>
                                      )}
                                    </>
                                  )}
                                  <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(outage.id)} data-testid={`button-delete-outage-${outage.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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

      {tab === "create" && (
        <Card className="border-0 shadow-sm max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-600" />Report New Incident</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="outageId" render={({ field }) => (
                    <FormItem><FormLabel>Incident ID</FormLabel><FormControl><Input placeholder="OUT-0001" {...field} data-testid="input-outage-id" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Incident Title</FormLabel><FormControl><Input placeholder="Brief title" {...field} data-testid="input-outage-title" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Detailed incident description..." {...field} value={field.value || ""} data-testid="input-outage-description" /></FormControl><FormMessage /></FormItem>
                )} />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="outageType" render={({ field }) => (
                    <FormItem><FormLabel>Outage Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "router_down"}>
                        <FormControl><SelectTrigger data-testid="select-outage-type"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{OUTAGE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="severity" render={({ field }) => (
                    <FormItem><FormLabel>Severity</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger data-testid="select-outage-severity"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{SEVERITY_LEVELS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger data-testid="select-outage-status"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="affectedPop" render={({ field }) => (
                    <FormItem><FormLabel>Affected POP</FormLabel><FormControl><Input placeholder="POP name" {...field} value={field.value || ""} data-testid="input-outage-pop" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="affectedDevice" render={({ field }) => (
                    <FormItem><FormLabel>Affected Router / OLT</FormLabel><FormControl><Input placeholder="Device name" {...field} value={field.value || ""} data-testid="input-outage-device" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="affectedVlan" render={({ field }) => (
                    <FormItem><FormLabel>VLAN / IP Pool</FormLabel><FormControl><Input placeholder="VLAN ID" {...field} value={field.value || ""} data-testid="input-outage-vlan" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="affectedArea" render={({ field }) => (
                    <FormItem><FormLabel>Affected Area</FormLabel><FormControl><Input placeholder="Zone / Region" {...field} value={field.value || ""} data-testid="input-outage-affected-area" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="affectedCustomers" render={({ field }) => (
                    <FormItem><FormLabel>Est. Customers Impacted</FormLabel><FormControl>
                      <Input type="number" placeholder="0" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-outage-affected-customers" />
                    </FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="corporateAffected" render={({ field }) => (
                    <FormItem><FormLabel>Corporate Clients</FormLabel><FormControl>
                      <Input type="number" placeholder="0" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-outage-corporate" />
                    </FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="assignedEngineer" render={({ field }) => (
                    <FormItem><FormLabel>Assign Technician</FormLabel><FormControl><Input placeholder="Engineer name" {...field} value={field.value || ""} data-testid="input-outage-engineer" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="assignedTeam" render={({ field }) => (
                    <FormItem><FormLabel>Assign Team</FormLabel><FormControl><Input placeholder="NOC / Field" {...field} value={field.value || ""} data-testid="input-outage-team" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="startTime" render={({ field }) => (
                    <FormItem><FormLabel>Start Time</FormLabel><FormControl><Input type="datetime-local" {...field} data-testid="input-outage-start-time" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="estimatedRestore" render={({ field }) => (
                    <FormItem><FormLabel>Est. Resolution</FormLabel><FormControl><Input type="datetime-local" {...field} value={field.value || ""} data-testid="input-outage-estimated-restore" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="slaLimitMinutes" render={({ field }) => (
                    <FormItem><FormLabel>SLA Limit (minutes)</FormLabel><FormControl>
                      <Input type="number" {...field} value={field.value ?? 240} onChange={e => field.onChange(parseInt(e.target.value) || 240)} data-testid="input-outage-sla" />
                    </FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <div className="flex flex-wrap gap-6 py-2">
                  <FormField control={form.control} name="notifiedCustomers" render={({ field }) => (
                    <FormItem className="flex items-center gap-2"><FormControl>
                      <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="checkbox-notify-customers" />
                    </FormControl><FormLabel className="!mt-0 text-xs">Notify customers</FormLabel></FormItem>
                  )} />
                  <FormField control={form.control} name="notifyManagement" render={({ field }) => (
                    <FormItem className="flex items-center gap-2"><FormControl>
                      <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="checkbox-notify-management" />
                    </FormControl><FormLabel className="!mt-0 text-xs">Notify management</FormLabel></FormItem>
                  )} />
                  <FormField control={form.control} name="createLinkedTask" render={({ field }) => (
                    <FormItem className="flex items-center gap-2"><FormControl>
                      <Checkbox checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="checkbox-create-task" />
                    </FormControl><FormLabel className="!mt-0 text-xs">Create linked task</FormLabel></FormItem>
                  )} />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={createMutation.isPending} data-testid="button-submit-outage">
                    {createMutation.isPending ? "Reporting..." : "Report Incident"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {tab === "impact" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Affected", value: totalAffected, icon: Users, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
              { label: "Corporate Affected", value: allOutages.filter(o => o.status !== "resolved").reduce((s, o) => s + (o.corporateAffected ?? 0), 0), icon: Building2, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
              { label: "Areas Impacted", value: new Set(allOutages.filter(o => o.status !== "resolved" && o.affectedArea).map(o => o.affectedArea)).size, icon: MapPin, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
              { label: "Revenue Impact", value: `$${allOutages.filter(o => o.status !== "resolved").reduce((s, o) => s + parseFloat(String(o.revenueImpact || "0")), 0).toFixed(0)}/hr`, icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30" },
            ].map((kpi, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className={`h-8 w-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                  <div className="text-xl font-bold font-mono" data-testid={`impact-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>{kpi.value}</div>
                  <div className="text-[10px] text-muted-foreground">{kpi.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Impact by Outage Type</CardTitle></CardHeader>
              <CardContent>
                {(() => {
                  const data = OUTAGE_TYPES.map(t => ({
                    name: t.label.length > 10 ? t.label.slice(0, 10) + "..." : t.label,
                    affected: allOutages.filter(o => o.outageType === t.value && o.status !== "resolved").reduce((s, o) => s + (o.affectedCustomers ?? 0), 0),
                  })).filter(d => d.affected > 0);
                  return data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data}>
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="affected" fill="#EA580C" radius={[4, 4, 0, 0]} name="Customers" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="text-center py-10 text-sm text-muted-foreground">No active outages</div>;
                })()}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Active Incidents Detail</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[280px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                        <TableHead className="text-[10px]">Incident</TableHead>
                        <TableHead className="text-[10px]">Area</TableHead>
                        <TableHead className="text-[10px]">Customers</TableHead>
                        <TableHead className="text-[10px]">Corporate</TableHead>
                        <TableHead className="text-[10px]">Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allOutages.filter(o => o.status !== "resolved").map(o => (
                        <TableRow key={o.id} data-testid={`impact-row-${o.id}`}>
                          <TableCell className="text-xs font-medium">{o.title}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{o.affectedArea || "—"}</TableCell>
                          <TableCell className="text-xs font-mono font-bold text-red-600">{o.affectedCustomers ?? 0}</TableCell>
                          <TableCell className="text-xs font-mono">{o.corporateAffected ?? 0}</TableCell>
                          <TableCell className="text-xs font-mono">{formatDuration(getElapsedMinutes(o.startTime))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "sla" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Within SLA", value: allOutages.filter(o => o.status !== "resolved" && !o.slaBreach && getElapsedMinutes(o.startTime) <= (o.slaLimitMinutes || 240)).length, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30", icon: CheckCircle },
              { label: "Near SLA Breach", value: allOutages.filter(o => o.status !== "resolved" && !o.slaBreach && getElapsedMinutes(o.startTime) > (o.slaLimitMinutes || 240) * 0.8 && getElapsedMinutes(o.startTime) <= (o.slaLimitMinutes || 240)).length, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", icon: Clock },
              { label: "SLA Breached", value: allOutages.filter(o => o.slaBreach || (o.status !== "resolved" && getElapsedMinutes(o.startTime) > (o.slaLimitMinutes || 240))).length, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", icon: Shield },
              { label: "Escalated", value: allOutages.filter(o => o.escalated).length, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30", icon: ArrowUpCircle },
            ].map((kpi, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className={`h-8 w-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                  <div className="text-2xl font-bold font-mono" data-testid={`sla-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>{kpi.value}</div>
                  <div className="text-[10px] text-muted-foreground">{kpi.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">SLA Monitoring</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                      <TableHead className="text-[10px] font-semibold">ID</TableHead>
                      <TableHead className="text-[10px] font-semibold">Incident</TableHead>
                      <TableHead className="text-[10px] font-semibold">Severity</TableHead>
                      <TableHead className="text-[10px] font-semibold">Start Time</TableHead>
                      <TableHead className="text-[10px] font-semibold">Elapsed</TableHead>
                      <TableHead className="text-[10px] font-semibold">SLA Limit</TableHead>
                      <TableHead className="text-[10px] font-semibold">Response</TableHead>
                      <TableHead className="text-[10px] font-semibold">Resolution</TableHead>
                      <TableHead className="text-[10px] font-semibold">SLA Status</TableHead>
                      <TableHead className="text-[10px] font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allOutages.map(o => {
                      const elapsed = o.status === "resolved" ? (o.resolutionTimeMinutes || 0) : getElapsedMinutes(o.startTime);
                      const slaLimit = o.slaLimitMinutes || 240;
                      const breached = elapsed > slaLimit || o.slaBreach;
                      const nearBreach = !breached && elapsed > slaLimit * 0.8;
                      const pct = Math.min(100, Math.round((elapsed / slaLimit) * 100));
                      return (
                        <TableRow key={o.id} className={breached ? "bg-red-50/50 dark:bg-red-950/10" : nearBreach ? "bg-amber-50/50 dark:bg-amber-950/10" : ""} data-testid={`sla-row-${o.id}`}>
                          <TableCell className="font-mono text-xs">{o.outageId}</TableCell>
                          <TableCell className="text-xs font-medium max-w-[150px] truncate">{o.title}</TableCell>
                          <TableCell><Badge variant="secondary" className={`text-[9px] capitalize ${getSeverityStyle(o.severity)}`}>{o.severity}</Badge></TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{o.startTime ? new Date(o.startTime).toLocaleString() : "—"}</TableCell>
                          <TableCell className="text-xs font-mono font-bold">{formatDuration(elapsed)}</TableCell>
                          <TableCell className="text-xs font-mono">{formatDuration(slaLimit)}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{o.responseTime || "—"}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{o.resolutionTimeMinutes ? formatDuration(o.resolutionTimeMinutes) : "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${breached ? "bg-red-500" : nearBreach ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className={`text-[9px] font-mono font-bold ${breached ? "text-red-600" : nearBreach ? "text-amber-600" : "text-green-600"}`}>
                                {breached ? "BREACHED" : nearBreach ? "WARNING" : o.status === "resolved" ? "MET" : `${pct}%`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {o.status !== "resolved" && !o.escalated && (
                              <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => escalateMutation.mutate(o)} data-testid={`button-sla-escalate-${o.id}`}>
                                <ArrowUpCircle className="h-3 w-3 mr-1" />Escalate
                              </Button>
                            )}
                            {o.escalated && <Badge variant="secondary" className="text-[9px] text-purple-600 bg-purple-50 dark:bg-purple-950">Escalated</Badge>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "timeline" && (
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Incident Timeline & Logs</CardTitle></CardHeader>
            <CardContent>
              {allTimelines.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-sm">No timeline entries yet</p>
                  <p className="text-xs mt-1">Timeline entries are created automatically when outages are reported, updated, or resolved</p>
                </div>
              ) : (
                <div className="relative pl-8 space-y-0">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800" />
                  {allTimelines.slice(0, 50).map((t, i) => {
                    const statusColors: Record<string, string> = {
                      ongoing: "bg-red-500", resolved: "bg-green-500", warning: "bg-amber-500",
                      info: "bg-blue-500", investigating: "bg-purple-500",
                    };
                    const outage = allOutages.find(o => o.id === t.outageId);
                    return (
                      <div key={t.id} className="relative pb-6" data-testid={`timeline-entry-${t.id}`}>
                        <div className={`absolute -left-5 top-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950 ${statusColors[t.status || "info"] || "bg-blue-500"}`} />
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">{t.action}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{t.timestamp ? new Date(t.timestamp).toLocaleString() : ""}</span>
                          </div>
                          {t.notes && <p className="text-xs text-muted-foreground">{t.notes}</p>}
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                            {t.user && <span>By: {t.user}</span>}
                            {outage && <span>Incident: {outage.outageId}</span>}
                          </div>
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

      {selectedOutage && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40" onClick={() => setSelectedOutage(null)} data-testid="outage-detail-overlay">
          <Card className="w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} data-testid="card-outage-detail">
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className={`text-[9px] capitalize ${getSeverityStyle(selectedOutage.severity)}`}>{selectedOutage.severity}</Badge>
                  <Badge variant="secondary" className={`text-[9px] capitalize ${getStatusConfig(selectedOutage.status).textColor} ${getStatusConfig(selectedOutage.status).bgColor}`}>{selectedOutage.status}</Badge>
                  {selectedOutage.escalated && <Badge variant="secondary" className="text-[9px] text-purple-600 bg-purple-50 dark:bg-purple-950">Escalated</Badge>}
                </div>
                <h3 className="font-semibold text-base" data-testid="text-detail-title">{selectedOutage.title}</h3>
                <p className="text-xs text-muted-foreground font-mono">{selectedOutage.outageId}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedOutage(null)} data-testid="button-close-detail"><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedOutage.description && <p className="text-sm text-muted-foreground">{selectedOutage.description}</p>}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-[10px] text-muted-foreground">Outage Type</p><p className="font-medium text-xs">{getOutageTypeLabel(selectedOutage.outageType)}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Affected Area</p><p className="font-medium text-xs">{selectedOutage.affectedArea || "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Affected POP</p><p className="font-medium text-xs">{selectedOutage.affectedPop || "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Affected Device</p><p className="font-medium text-xs font-mono">{selectedOutage.affectedDevice || "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Customers Impacted</p><p className="font-medium text-xs font-mono text-red-600">{selectedOutage.affectedCustomers ?? 0}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Corporate Clients</p><p className="font-medium text-xs font-mono">{selectedOutage.corporateAffected ?? 0}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Assigned Engineer</p><p className="font-medium text-xs">{selectedOutage.assignedEngineer || "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Team</p><p className="font-medium text-xs">{selectedOutage.assignedTeam || "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Start Time</p><p className="font-medium text-xs font-mono">{selectedOutage.startTime ? new Date(selectedOutage.startTime).toLocaleString() : "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Est. Restore</p><p className="font-medium text-xs font-mono">{selectedOutage.estimatedRestore ? new Date(selectedOutage.estimatedRestore).toLocaleString() : "—"}</p></div>
                {selectedOutage.rootCause && <div className="col-span-2"><p className="text-[10px] text-muted-foreground">Root Cause</p><p className="font-medium text-xs">{selectedOutage.rootCause}</p></div>}
                {selectedOutage.resolution && <div className="col-span-2"><p className="text-[10px] text-muted-foreground">Resolution</p><p className="font-medium text-xs">{selectedOutage.resolution}</p></div>}
              </div>

              {selectedOutage.status !== "resolved" && (
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">SLA Timer</span>
                    <SlaCountdown outage={selectedOutage} />
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    {(() => {
                      const elapsed = getElapsedMinutes(selectedOutage.startTime);
                      const sla = selectedOutage.slaLimitMinutes || 240;
                      const pct = Math.min(100, Math.round((elapsed / sla) * 100));
                      const breached = elapsed > sla;
                      return <div className={`h-full rounded-full transition-all ${breached ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />;
                    })()}
                  </div>
                </div>
              )}

              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">Timeline</span>
                </div>
                {(selectedTimelines.data || []).length > 0 ? (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {(selectedTimelines.data || []).map(t => (
                      <div key={t.id} className="flex items-start gap-2 text-xs" data-testid={`detail-timeline-${t.id}`}>
                        <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${t.status === "resolved" ? "bg-green-500" : t.status === "ongoing" ? "bg-red-500" : t.status === "warning" ? "bg-amber-500" : "bg-blue-500"}`} />
                        <div>
                          <span className="font-medium">{t.action}</span>
                          {t.notes && <span className="text-muted-foreground ml-1">— {t.notes}</span>}
                          <div className="text-[10px] text-muted-foreground">{t.user} {t.timestamp ? `at ${new Date(t.timestamp).toLocaleString()}` : ""}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">No timeline entries yet</p>}

                <div className="flex gap-2 mt-3">
                  <Input placeholder="Add timeline note..." value={timelineNote} onChange={e => setTimelineNote(e.target.value)} className="h-8 text-xs" data-testid="input-timeline-note" />
                  <Button size="sm" className="h-8 text-xs" disabled={!timelineNote.trim()} onClick={() => addTimelineMutation.mutate({ outageId: selectedOutage.id, note: timelineNote })} data-testid="button-add-timeline">Add</Button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => { openEdit(selectedOutage); setSelectedOutage(null); }} data-testid="button-detail-edit"><Edit className="h-3.5 w-3.5 mr-1" />Edit</Button>
                {selectedOutage.status !== "resolved" && (
                  <>
                    <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => { resolveMutation.mutate(selectedOutage); setSelectedOutage(null); }} data-testid="button-detail-resolve"><CheckCircle className="h-3.5 w-3.5 mr-1" />Resolve</Button>
                    {!selectedOutage.escalated && (
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs text-purple-600" onClick={() => { escalateMutation.mutate(selectedOutage); setSelectedOutage(null); }} data-testid="button-detail-escalate"><ArrowUpCircle className="h-3.5 w-3.5 mr-1" />Escalate</Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-outage-dialog-title">{editingOutage ? "Edit Outage" : "Report Outage"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="outageId" render={({ field }) => (
                  <FormItem><FormLabel>Incident ID</FormLabel><FormControl><Input {...field} data-testid="input-dialog-outage-id" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} data-testid="input-dialog-outage-title" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} value={field.value || ""} data-testid="input-dialog-description" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField control={form.control} name="outageType" render={({ field }) => (
                  <FormItem><FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "router_down"}>
                      <FormControl><SelectTrigger data-testid="select-dialog-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{OUTAGE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="severity" render={({ field }) => (
                  <FormItem><FormLabel>Severity</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-dialog-severity"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{SEVERITY_LEVELS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-dialog-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField control={form.control} name="affectedPop" render={({ field }) => (
                  <FormItem><FormLabel>Affected POP</FormLabel><FormControl><Input {...field} value={field.value || ""} data-testid="input-dialog-pop" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="affectedDevice" render={({ field }) => (
                  <FormItem><FormLabel>Affected Device</FormLabel><FormControl><Input {...field} value={field.value || ""} data-testid="input-dialog-device" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="affectedArea" render={({ field }) => (
                  <FormItem><FormLabel>Affected Area</FormLabel><FormControl><Input {...field} value={field.value || ""} data-testid="input-dialog-area" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField control={form.control} name="affectedCustomers" render={({ field }) => (
                  <FormItem><FormLabel>Customers</FormLabel><FormControl>
                    <Input type="number" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-dialog-customers" />
                  </FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="assignedEngineer" render={({ field }) => (
                  <FormItem><FormLabel>Engineer</FormLabel><FormControl><Input {...field} value={field.value || ""} data-testid="input-dialog-engineer" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="slaLimitMinutes" render={({ field }) => (
                  <FormItem><FormLabel>SLA (min)</FormLabel><FormControl>
                    <Input type="number" {...field} value={field.value ?? 240} onChange={e => field.onChange(parseInt(e.target.value) || 240)} data-testid="input-dialog-sla" />
                  </FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField control={form.control} name="startTime" render={({ field }) => (
                  <FormItem><FormLabel>Start</FormLabel><FormControl><Input type="datetime-local" {...field} data-testid="input-dialog-start" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="estimatedRestore" render={({ field }) => (
                  <FormItem><FormLabel>Est. Restore</FormLabel><FormControl><Input type="datetime-local" {...field} value={field.value || ""} data-testid="input-dialog-restore" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="endTime" render={({ field }) => (
                  <FormItem><FormLabel>End Time</FormLabel><FormControl><Input type="datetime-local" {...field} value={field.value || ""} data-testid="input-dialog-end" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="rootCause" render={({ field }) => (
                <FormItem><FormLabel>Root Cause</FormLabel><FormControl><Textarea {...field} value={field.value || ""} data-testid="input-dialog-root-cause" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="resolution" render={({ field }) => (
                <FormItem><FormLabel>Resolution</FormLabel><FormControl><Textarea {...field} value={field.value || ""} data-testid="input-dialog-resolution" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-outage">Cancel</Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-outage">
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingOutage ? "Update" : "Report"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SlaCountdown({ outage }: { outage: Outage }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = Math.floor((now - new Date(outage.startTime).getTime()) / 60000);
  const slaLimit = outage.slaLimitMinutes || 240;
  const remaining = slaLimit - elapsed;
  const breached = remaining <= 0;

  return (
    <span className={`text-xs font-mono font-bold ${breached ? "text-red-600" : remaining < 60 ? "text-amber-600" : "text-green-600"}`} data-testid="sla-countdown">
      {breached ? `BREACHED by ${formatDuration(Math.abs(remaining))}` : `${formatDuration(remaining)} remaining`}
    </span>
  );
}
