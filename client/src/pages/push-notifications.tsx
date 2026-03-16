import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Bell, Plus, Search, Filter, Pencil, Trash2, Copy, Eye, Send,
  ChevronDown, ChevronUp, X, Smartphone, Zap, Clock, CheckCircle, XCircle,
  AlertTriangle, TrendingUp, Activity, BarChart3, Download, Play, Ban,
  MonitorSmartphone, Globe, Shield, Layers, Users, Target, Link2,
  Timer, Volume2, VolumeX, MousePointer, RotateCcw, RefreshCw
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, Legend
} from "recharts";

interface PushNotification {
  id: number;
  pushId: string;
  title: string;
  body: string;
  module: string | null;
  priority: string;
  icon: string | null;
  imageBanner: string | null;
  audienceType: string;
  audienceValue: string | null;
  triggerType: string;
  scheduledAt: string | null;
  recurringPattern: string | null;
  deepLink: string | null;
  expiryTime: string | null;
  silentPush: boolean | null;
  requireAcknowledgment: boolean | null;
  status: string;
  deviceTargets: string | null;
  deliveryCount: number | null;
  clickCount: number | null;
  failedCount: number | null;
  acknowledgedCount: number | null;
  sentAt: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  sent: { label: "Sent", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  scheduled: { label: "Scheduled", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  draft: { label: "Draft", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Pencil },
  processing: { label: "Processing", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: RefreshCw },
  failed: { label: "Failed", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-400", icon: Ban },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-600" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  critical: { label: "Critical", color: "bg-red-100 text-red-700" },
};

const audienceConfig: Record<string, string> = {
  all: "All Users",
  role: "Specific Role",
  user: "Specific Users",
  customers: "Customers",
  warehouse: "Warehouse-based",
  region: "Region-based",
};

const triggerConfig: Record<string, { label: string; icon: any }> = {
  manual: { label: "Manual Send", icon: Play },
  event: { label: "Event-Based", icon: Zap },
  scheduled: { label: "Scheduled", icon: Clock },
  recurring: { label: "Recurring", icon: RotateCcw },
};

const moduleOptions = [
  "Inventory", "Sales", "CRM", "Assets", "Service Outages",
  "HR", "Finance", "Billing", "Tickets", "Network", "User Management", "System", "Security",
];

const CHART_COLORS = ["#2563EB", "#7C3AED", "#10B981", "#EF4444", "#F59E0B", "#06B6D4", "#F97316", "#6366F1"];

export default function PushNotificationsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "analytics">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterModule, setFilterModule] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAudience, setFilterAudience] = useState("all");

  const [showEditor, setShowEditor] = useState(false);
  const [editingPush, setEditingPush] = useState<PushNotification | null>(null);
  const [previewPush, setPreviewPush] = useState<PushNotification | null>(null);

  const { data: allPushes = [], isLoading, isError } = useQuery<PushNotification[]>({ queryKey: ["/api/push-notifications"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const sendNow = data.status === "sent";
      const payload = { ...data, status: sendNow ? "draft" : data.status };
      const res = await apiRequest("POST", "/api/push-notifications", payload);
      if (sendNow) {
        const created = await res.json();
        await apiRequest("POST", `/api/push-notifications/${created.id}/send`);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/push-notifications"] }); toast({ title: "Push notification created" }); setShowEditor(false); setEditingPush(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/push-notifications/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/push-notifications"] }); toast({ title: "Push notification updated" }); setShowEditor(false); setEditingPush(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/push-notifications/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/push-notifications"] }); toast({ title: "Push notification deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const sendMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/push-notifications/${id}/send`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/push-notifications"] }); toast({ title: "Push notification sent" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/push-notifications/${id}/cancel`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/push-notifications"] }); toast({ title: "Push notification cancelled" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/push-notifications/${id}/duplicate`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/push-notifications"] }); toast({ title: "Push notification duplicated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const totalPushes = allPushes.length;
  const sentToday = allPushes.filter(p => p.sentAt && new Date(p.sentAt).toDateString() === new Date().toDateString()).length;
  const scheduledCount = allPushes.filter(p => p.status === "scheduled").length;
  const failedCount = allPushes.filter(p => p.status === "failed").length;
  const totalDelivered = allPushes.reduce((sum, p) => sum + (p.deliveryCount || 0), 0);
  const totalClicks = allPushes.reduce((sum, p) => sum + (p.clickCount || 0), 0);
  const totalFailed = allPushes.reduce((sum, p) => sum + (p.failedCount || 0), 0);
  const successRate = totalDelivered + totalFailed > 0 ? ((totalDelivered / (totalDelivered + totalFailed)) * 100).toFixed(1) : "0.0";
  const ctr = totalDelivered > 0 ? ((totalClicks / totalDelivered) * 100).toFixed(1) : "0.0";

  const moduleChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    allPushes.forEach(p => { const m = p.module || "Unassigned"; counts[m] = (counts[m] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [allPushes]);

  const deviceChartData = useMemo(() => {
    const counts: Record<string, number> = { Web: 0, Android: 0, iOS: 0, All: 0 };
    allPushes.forEach(p => {
      const dt = p.deviceTargets || "all";
      if (dt === "all") counts["All"]++;
      else if (dt === "web") counts["Web"]++;
      else if (dt === "android") counts["Android"]++;
      else if (dt === "ios") counts["iOS"]++;
      else counts["All"]++;
    });
    return Object.entries(counts).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [allPushes]);

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    allPushes.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: statusConfig[name]?.label || name, value,
    }));
  }, [allPushes]);

  const trendData = useMemo(() => {
    const last7: Record<string, { sent: number; failed: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      last7[d.toISOString().split("T")[0]] = { sent: 0, failed: 0 };
    }
    allPushes.forEach(p => {
      const date = (p.sentAt || p.createdAt || "").split("T")[0];
      if (last7[date]) {
        if (p.status === "sent") last7[date].sent++;
        else if (p.status === "failed") last7[date].failed++;
      }
    });
    return Object.entries(last7).map(([date, v]) => ({
      date: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }), ...v,
    }));
  }, [allPushes]);

  const filteredPushes = useMemo(() => {
    return allPushes.filter(p => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.body.toLowerCase().includes(q) && !p.pushId.toLowerCase().includes(q)) return false;
      }
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (filterModule !== "all" && p.module !== filterModule) return false;
      if (filterPriority !== "all" && p.priority !== filterPriority) return false;
      if (filterAudience !== "all" && p.audienceType !== filterAudience) return false;
      return true;
    });
  }, [allPushes, searchQuery, filterStatus, filterModule, filterPriority, filterAudience]);

  const clearFilters = () => { setSearchQuery(""); setFilterStatus("all"); setFilterModule("all"); setFilterPriority("all"); setFilterAudience("all"); };
  const hasFilters = searchQuery || filterStatus !== "all" || filterModule !== "all" || filterPriority !== "all" || filterAudience !== "all";

  const handleExport = () => {
    const headers = ["Push ID", "Title", "Module", "Priority", "Audience", "Trigger", "Status", "Device", "Delivered", "Clicks", "Failed", "Sent At"];
    const rows = filteredPushes.map(p => [
      p.pushId, p.title, p.module || "", p.priority, audienceConfig[p.audienceType] || p.audienceType,
      triggerConfig[p.triggerType]?.label || p.triggerType, p.status, p.deviceTargets || "all",
      String(p.deliveryCount || 0), String(p.clickCount || 0), String(p.failedCount || 0), p.sentAt || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `push_notifications_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "overview" as const, label: "Push Overview", icon: Bell, count: totalPushes },
    { id: "history" as const, label: "Push History", icon: Activity, count: allPushes.filter(p => p.status === "sent").length },
    { id: "analytics" as const, label: "Delivery Analytics", icon: BarChart3, count: null },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Push Notifications</h1>
          <p className="text-muted-foreground mt-1">Create, schedule, and monitor real-time push alerts across web & mobile</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} data-testid="button-export"><Download className="h-4 w-4 mr-2" /> Export</Button>
          <Button onClick={() => { setEditingPush(null); setShowEditor(true); }} className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white" data-testid="button-create-push">
            <Plus className="h-4 w-4 mr-2" /> Create Push
          </Button>
        </div>
      </div>

      {isLoading && <div className="text-center py-8 text-muted-foreground">Loading push notification data...</div>}
      {isError && <div className="text-center py-8 text-red-500">Failed to load push notification data. Please try refreshing.</div>}

      {!isLoading && !isError && (
      <div className="grid grid-cols-8 gap-3">
        {[
          { label: "Total Push", value: totalPushes, icon: Bell, gradient: "from-[#2563EB] to-[#3B82F6]" },
          { label: "Sent Today", value: sentToday, icon: Send, gradient: "from-green-500 to-green-700" },
          { label: "Scheduled", value: scheduledCount, icon: Clock, gradient: "from-yellow-500 to-yellow-700" },
          { label: "Failed", value: failedCount, icon: XCircle, gradient: "from-red-500 to-red-700" },
          { label: "Success Rate", value: `${successRate}%`, icon: CheckCircle, gradient: "from-emerald-500 to-emerald-700" },
          { label: "CTR", value: `${ctr}%`, icon: MousePointer, gradient: "from-[#7C3AED] to-[#9333EA]" },
          { label: "Delivered", value: totalDelivered, icon: Target, gradient: "from-teal-500 to-teal-700" },
          { label: "Click Count", value: totalClicks, icon: TrendingUp, gradient: "from-blue-600 to-indigo-700" },
        ].map((kpi, idx) => (
          <Card key={idx} className={`bg-gradient-to-br ${kpi.gradient} text-white border-0 shadow-lg`} data-testid={`card-kpi-${idx}`}>
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between mb-1.5"><kpi.icon className="h-4 w-4 opacity-80" /></div>
              <div className="text-lg font-bold" data-testid={`text-kpi-value-${idx}`}>{kpi.value}</div>
              <div className="text-[10px] opacity-80 mt-0.5">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {!isLoading && !isError && (
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#2563EB]" /> By Module</CardTitle></CardHeader>
          <CardContent>
            {moduleChartData.length === 0 ? <div className="h-[160px] flex items-center justify-center text-xs text-muted-foreground">No data yet</div> : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={moduleChartData.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={70} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-600" /> Delivery Trend (7 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="sent" fill="#2563EB" stroke="#2563EB" fillOpacity={0.3} name="Sent" />
                <Area type="monotone" dataKey="failed" fill="#EF4444" stroke="#EF4444" fillOpacity={0.3} name="Failed" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><MonitorSmartphone className="h-4 w-4 text-[#7C3AED]" /> Device Distribution</CardTitle></CardHeader>
          <CardContent>
            {deviceChartData.length === 0 ? <div className="h-[160px] flex items-center justify-center text-xs text-muted-foreground">No data yet</div> : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={deviceChartData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {deviceChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Activity className="h-4 w-4 text-red-500" /> Status Distribution</CardTitle></CardHeader>
          <CardContent>
            {statusChartData.length === 0 ? <div className="h-[160px] flex items-center justify-center text-xs text-muted-foreground">No data yet</div> : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {statusChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      )}

      <div className="flex gap-1 border-b">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid={`tab-${tab.id}`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
            {tab.count !== null && <span className="text-xs opacity-60">({tab.count})</span>}
          </button>
        ))}
      </div>

      {activeTab !== "analytics" && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by title, body, or push ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search" />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} data-testid="button-toggle-filters">
            <Filter className="h-4 w-4 mr-1" /> {showFilters ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>
          {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500" data-testid="button-clear-filters"><X className="h-3 w-3 mr-1" /> Clear</Button>}
        </div>
      )}

      {showFilters && activeTab !== "analytics" && (
        <Card><CardContent className="p-3">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs" data-testid="filter-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Module</Label>
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger className="h-8 text-xs" data-testid="filter-module"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {moduleOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Priority</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="h-8 text-xs" data-testid="filter-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Audience</Label>
              <Select value={filterAudience} onValueChange={setFilterAudience}>
                <SelectTrigger className="h-8 text-xs" data-testid="filter-audience"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audiences</SelectItem>
                  {Object.entries(audienceConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent></Card>
      )}

      {(activeTab === "overview" || activeTab === "history") && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white">
                <th className="p-2.5 text-left font-medium rounded-tl-lg">Push ID</th>
                <th className="p-2.5 text-left font-medium">Title</th>
                <th className="p-2.5 text-center font-medium">Module</th>
                <th className="p-2.5 text-center font-medium">Audience</th>
                <th className="p-2.5 text-center font-medium">Priority</th>
                <th className="p-2.5 text-center font-medium">Trigger</th>
                <th className="p-2.5 text-center font-medium">Device</th>
                <th className="p-2.5 text-center font-medium">Delivered</th>
                <th className="p-2.5 text-center font-medium">Clicks</th>
                <th className="p-2.5 text-center font-medium">Status</th>
                <th className="p-2.5 text-center font-medium">Sent</th>
                <th className="p-2.5 text-center font-medium rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={12} className="p-8 text-center text-muted-foreground">Loading push notifications...</td></tr>
              ) : isError ? (
                <tr><td colSpan={12} className="p-8 text-center text-red-500">Failed to load push notifications. Please try refreshing.</td></tr>
              ) : filteredPushes.length === 0 ? (
                <tr><td colSpan={12} className="p-8 text-center text-muted-foreground">{hasFilters ? "No push notifications match filters" : "No push notifications created yet."}</td></tr>
              ) : (activeTab === "history" ? filteredPushes.filter(p => p.status === "sent") : filteredPushes).map(push => {
                const sc = statusConfig[push.status] || statusConfig.draft;
                const pc = priorityConfig[push.priority] || priorityConfig.medium;
                const tc = triggerConfig[push.triggerType] || triggerConfig.manual;
                return (
                  <tr key={push.id} className="border-b hover:bg-muted/50 transition-colors" data-testid={`row-push-${push.id}`}>
                    <td className="p-2.5 font-mono text-xs text-[#2563EB]">{push.pushId}</td>
                    <td className="p-2.5">
                      <div className="font-medium text-sm truncate max-w-[200px]">{push.title}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">{push.body}</div>
                    </td>
                    <td className="p-2.5 text-center text-xs">{push.module || "—"}</td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1"><Users className="h-3 w-3" /><span className="text-[10px]">{audienceConfig[push.audienceType] || push.audienceType}</span></div>
                    </td>
                    <td className="p-2.5 text-center"><Badge className={`${pc.color} text-[10px]`}>{pc.label}</Badge></td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1"><tc.icon className="h-3 w-3" /><span className="text-[10px]">{tc.label}</span></div>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {push.deviceTargets === "all" ? <Globe className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                        <span className="text-[10px] capitalize">{push.deviceTargets || "all"}</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-center font-mono text-xs text-green-600">{push.deliveryCount || 0}</td>
                    <td className="p-2.5 text-center font-mono text-xs text-blue-600">{push.clickCount || 0}</td>
                    <td className="p-2.5 text-center"><Badge className={`${sc.color} text-[10px]`}>{sc.label}</Badge></td>
                    <td className="p-2.5 text-center text-xs text-muted-foreground">{push.sentAt ? new Date(push.sentAt).toLocaleDateString() : "—"}</td>
                    <td className="p-2.5">
                      <div className="flex items-center justify-center gap-0.5">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setPreviewPush(push)} title="View Details" data-testid={`button-preview-${push.id}`}><Eye className="h-3 w-3" /></Button>
                        {(push.status === "draft" || push.status === "scheduled") && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingPush(push); setShowEditor(true); }} title="Edit" data-testid={`button-edit-${push.id}`}><Pencil className="h-3 w-3" /></Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => duplicateMutation.mutate(push.id)} title="Duplicate" data-testid={`button-duplicate-${push.id}`}><Copy className="h-3 w-3" /></Button>
                        {push.status === "draft" && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-green-600" onClick={() => sendMutation.mutate(push.id)} title="Send Now" data-testid={`button-send-${push.id}`}><Play className="h-3 w-3" /></Button>
                        )}
                        {push.status === "scheduled" && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-yellow-600" onClick={() => cancelMutation.mutate(push.id)} title="Cancel" data-testid={`button-cancel-${push.id}`}><Ban className="h-3 w-3" /></Button>
                        )}
                        {push.status === "sent" && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-600" onClick={() => {
                            duplicateMutation.mutate(push.id);
                          }} title="Resend (as copy)" data-testid={`button-resend-${push.id}`}><RefreshCw className="h-3 w-3" /></Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => { if (confirm("Delete this push notification?")) deleteMutation.mutate(push.id); }} title="Delete" data-testid={`button-delete-${push.id}`}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredPushes.length > 0 && (
            <div className="p-2 border-t text-xs text-muted-foreground flex justify-between">
              <span>Showing {activeTab === "history" ? filteredPushes.filter(p => p.status === "sent").length : filteredPushes.length} of {allPushes.length} push notifications</span>
              <span>Sent: {allPushes.filter(p => p.status === "sent").length} | Draft: {allPushes.filter(p => p.status === "draft").length} | Scheduled: {scheduledCount}</span>
            </div>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-6 gap-3">
            {[
              { label: "Total Targeted", value: totalDelivered + totalFailed, icon: Target, color: "text-[#2563EB]" },
              { label: "Successfully Delivered", value: totalDelivered, icon: CheckCircle, color: "text-green-600" },
              { label: "Failed Devices", value: totalFailed, icon: XCircle, color: "text-red-600" },
              { label: "Opened", value: totalClicks, icon: Eye, color: "text-blue-600" },
              { label: "Acknowledged", value: allPushes.reduce((s, p) => s + (p.acknowledgedCount || 0), 0), icon: Shield, color: "text-purple-600" },
              { label: "CTR", value: `${ctr}%`, icon: MousePointer, color: "text-[#7C3AED]" },
            ].map((m, i) => (
              <Card key={i}>
                <CardContent className="p-3 text-center">
                  <m.icon className={`h-5 w-5 mx-auto mb-1 ${m.color}`} />
                  <div className="text-xl font-bold">{m.value}</div>
                  <div className="text-[10px] text-muted-foreground">{m.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MonitorSmartphone className="h-4 w-4 text-[#7C3AED]" /> Device Type Distribution</CardTitle></CardHeader>
              <CardContent>
                {deviceChartData.length === 0 ? <div className="h-[200px] flex items-center justify-center text-muted-foreground text-xs">No device data</div> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={deviceChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine>
                        {deviceChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> Failure Reasons</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 mt-2">
                  {[
                    { reason: "Device Offline", pct: 35, color: "bg-gray-400" },
                    { reason: "Token Expired", pct: 28, color: "bg-red-400" },
                    { reason: "Permission Denied", pct: 22, color: "bg-yellow-400" },
                    { reason: "Server Error", pct: 15, color: "bg-orange-400" },
                  ].map((f, i) => (
                    <div key={i} className="space-y-1" data-testid={`row-failure-${i}`}>
                      <div className="flex justify-between text-xs">
                        <span>{f.reason}</span>
                        <span className="font-medium">{f.pct}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className={`h-2 rounded-full ${f.color}`} style={{ width: `${f.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[#2563EB]" /> Delivery Performance Over Time</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="sent" fill="#2563EB" stroke="#2563EB" fillOpacity={0.3} name="Delivered" />
                  <Area type="monotone" dataKey="failed" fill="#EF4444" stroke="#EF4444" fillOpacity={0.3} name="Failed" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {showEditor && <PushEditor push={editingPush}
        onSave={(data: any) => editingPush ? updateMutation.mutate({ id: editingPush.id, data }) : createMutation.mutate(data)}
        onClose={() => { setShowEditor(false); setEditingPush(null); }}
        isPending={createMutation.isPending || updateMutation.isPending} />}

      {previewPush && <PushPreviewDialog push={previewPush} onClose={() => setPreviewPush(null)} />}
    </div>
  );
}

function PushEditor({ push, onSave, onClose, isPending }: {
  push: PushNotification | null; onSave: (data: any) => void; onClose: () => void; isPending: boolean;
}) {
  const [title, setTitle] = useState(push?.title || "");
  const [body, setBody] = useState(push?.body || "");
  const [module, setModule] = useState(push?.module || "");
  const [priority, setPriority] = useState(push?.priority || "medium");
  const [audienceType, setAudienceType] = useState(push?.audienceType || "all");
  const [audienceValue, setAudienceValue] = useState(push?.audienceValue || "");
  const [triggerType, setTriggerType] = useState(push?.triggerType || "manual");
  const [scheduledAt, setScheduledAt] = useState(push?.scheduledAt || "");
  const [deepLink, setDeepLink] = useState(push?.deepLink || "");
  const [expiryTime, setExpiryTime] = useState(push?.expiryTime || "");
  const [silentPush, setSilentPush] = useState(push?.silentPush || false);
  const [requireAck, setRequireAck] = useState(push?.requireAcknowledgment || false);
  const [deviceTargets, setDeviceTargets] = useState(push?.deviceTargets || "all");
  const [status, setStatus] = useState(push?.status || "draft");

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{push ? "Edit Push Notification" : "Create Push Notification"}</DialogTitle></DialogHeader>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div><Label>Notification Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Low Stock Alert — Warehouse A" data-testid="input-push-title" /></div>
            <div><Label>Message Body *</Label><Textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="Enter the push notification message..." data-testid="input-push-body" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Module Source</Label>
                <Select value={module} onValueChange={setModule}>
                  <SelectTrigger data-testid="select-push-module"><SelectValue placeholder="Select module" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {moduleOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority Level *</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger data-testid="select-push-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Device Target</Label>
                <Select value={deviceTargets} onValueChange={setDeviceTargets}>
                  <SelectTrigger data-testid="select-push-device"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    <SelectItem value="web">Web Only</SelectItem>
                    <SelectItem value="android">Android Only</SelectItem>
                    <SelectItem value="ios">iOS Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audience" className="space-y-4 mt-4">
            <div>
              <Label>Audience Type *</Label>
              <Select value={audienceType} onValueChange={setAudienceType}>
                <SelectTrigger data-testid="select-push-audience"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(audienceConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {audienceType !== "all" && (
              <div>
                <Label>
                  {audienceType === "role" ? "Role Name" : audienceType === "user" ? "User IDs (comma-separated)" : audienceType === "customers" ? "Customer Segment" : audienceType === "warehouse" ? "Warehouse Name" : "Region Name"}
                </Label>
                <Input value={audienceValue} onChange={e => setAudienceValue(e.target.value)} placeholder={audienceType === "role" ? "e.g. Admin, Sales Manager" : audienceType === "user" ? "e.g. 1, 5, 12" : "Enter value..."} data-testid="input-push-audience-value" />
              </div>
            )}
            <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-200">
              <CardContent className="p-3 text-xs text-muted-foreground space-y-1">
                <div className="font-medium text-foreground mb-2">Audience Targeting Guide</div>
                <div><strong>All Users</strong> — Sends to every registered user across all branches</div>
                <div><strong>Specific Role</strong> — Target by role name (Admin, Sales, Inventory Manager)</div>
                <div><strong>Specific Users</strong> — Enter comma-separated user IDs</div>
                <div><strong>Customers</strong> — Target customer segments (active, overdue, etc.)</div>
                <div><strong>Warehouse-based</strong> — Users assigned to specific warehouses</div>
                <div><strong>Region-based</strong> — Customers in specific geographic regions</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Trigger Type</Label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger data-testid="select-push-trigger"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(triggerConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger data-testid="select-push-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="sent">Send Immediately</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(triggerType === "scheduled" || triggerType === "recurring") && (
              <div><Label>Scheduled Date/Time</Label><Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} data-testid="input-push-scheduled" /></div>
            )}

            <div><Label>Deep Link (optional)</Label><Input value={deepLink} onChange={e => setDeepLink(e.target.value)} placeholder="e.g. /inventory or /tickets/42" data-testid="input-push-deeplink" /><p className="text-[10px] text-muted-foreground mt-1">Redirect user to a specific page when they click the notification</p></div>

            <div><Label>Expiry Time (optional)</Label><Input type="datetime-local" value={expiryTime} onChange={e => setExpiryTime(e.target.value)} data-testid="input-push-expiry" /><p className="text-[10px] text-muted-foreground mt-1">Notification expires after this time and won't be delivered</p></div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Switch checked={silentPush} onCheckedChange={setSilentPush} data-testid="switch-push-silent" />
                <div>
                  <Label className="text-sm flex items-center gap-1">{silentPush ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />} Silent Push</Label>
                  <p className="text-[10px] text-muted-foreground">Background refresh without user notification</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Switch checked={requireAck} onCheckedChange={setRequireAck} data-testid="switch-push-ack" />
                <div>
                  <Label className="text-sm flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Require Acknowledgment</Label>
                  <p className="text-[10px] text-muted-foreground">User must confirm receipt of critical alerts</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-2">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-center flex items-center justify-center gap-1"><Globe className="h-3.5 w-3.5" /> Desktop Browser</CardTitle></CardHeader>
                <CardContent className="p-3">
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-3 shadow-inner">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-lg flex items-center justify-center"><Bell className="h-4 w-4 text-white" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{title || "Notification Title"}</div>
                        <div className="text-[10px] text-muted-foreground truncate mt-0.5">{body || "Notification message body..."}</div>
                        <div className="text-[9px] text-muted-foreground mt-1">NetSphere — just now</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-center flex items-center justify-center gap-1"><Smartphone className="h-3.5 w-3.5" /> Mobile Device</CardTitle></CardHeader>
                <CardContent className="p-3">
                  <div className="bg-gray-900 rounded-2xl p-3 text-white max-w-[180px] mx-auto">
                    <div className="text-[9px] text-gray-400 text-center mb-2">Notification Bar</div>
                    <div className="bg-gray-800 rounded-lg p-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-4 h-4 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-sm flex items-center justify-center"><Bell className="h-2.5 w-2.5 text-white" /></div>
                        <span className="text-[9px] font-medium">NetSphere</span>
                        <span className="text-[8px] text-gray-400 ml-auto">now</span>
                      </div>
                      <div className="text-[10px] font-bold truncate">{title || "Title"}</div>
                      <div className="text-[9px] text-gray-300 truncate">{body || "Message..."}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-2"><CardTitle className="text-xs text-center flex items-center justify-center gap-1"><Layers className="h-3.5 w-3.5" /> Admin Dashboard</CardTitle></CardHeader>
                <CardContent className="p-3">
                  <div className="bg-white dark:bg-gray-900 border rounded-lg p-2.5 shadow-sm">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-2 h-2 rounded-full ${priority === "critical" ? "bg-red-500 animate-pulse" : priority === "high" ? "bg-orange-500" : "bg-blue-500"}`} />
                      <span className="text-[10px] font-bold truncate">{title || "Alert Title"}</span>
                      <Badge className={`${priorityConfig[priority]?.color || ""} text-[8px] ml-auto`}>{priorityConfig[priority]?.label || priority}</Badge>
                    </div>
                    <p className="text-[9px] text-muted-foreground truncate">{body || "Message body..."}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[8px] text-muted-foreground">
                      <span>{module || "System"}</span>
                      {deepLink && <><span>→</span><span className="text-blue-500">{deepLink}</span></>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-purple-50/30 dark:bg-purple-950/10 border-purple-200">
              <CardContent className="p-3">
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div><span className="text-muted-foreground">Priority:</span> <Badge className={`${priorityConfig[priority]?.color || ""} text-[9px]`}>{priorityConfig[priority]?.label || priority}</Badge></div>
                  <div><span className="text-muted-foreground">Audience:</span> <span className="font-medium">{audienceConfig[audienceType]}</span></div>
                  <div><span className="text-muted-foreground">Trigger:</span> <span className="font-medium">{triggerConfig[triggerType]?.label}</span></div>
                  <div><span className="text-muted-foreground">Device:</span> <span className="font-medium capitalize">{deviceTargets}</span></div>
                </div>
                <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
                  {silentPush && <span className="flex items-center gap-1"><VolumeX className="h-3 w-3" /> Silent</span>}
                  {requireAck && <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Requires Acknowledgment</span>}
                  {deepLink && <span className="flex items-center gap-1"><Link2 className="h-3 w-3" /> Deep Link: {deepLink}</span>}
                  {expiryTime && <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> Expires: {new Date(expiryTime).toLocaleString()}</span>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({
            title, body,
            module: module && module !== "none" ? module : null,
            priority, audienceType,
            audienceValue: audienceValue || null,
            triggerType,
            scheduledAt: scheduledAt || null,
            deepLink: deepLink || null,
            expiryTime: expiryTime || null,
            silentPush, requireAcknowledgment: requireAck,
            status, deviceTargets,
          })} disabled={!title || !body || isPending}
            className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white" data-testid="button-save-push">
            {isPending ? "Saving..." : push ? "Update" : status === "sent" ? "Send Now" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PushPreviewDialog({ push, onClose }: { push: PushNotification; onClose: () => void }) {
  const sc = statusConfig[push.status] || statusConfig.draft;
  const pc = priorityConfig[push.priority] || priorityConfig.medium;
  const tc = triggerConfig[push.triggerType] || triggerConfig.manual;
  const totalTargeted = (push.deliveryCount || 0) + (push.failedCount || 0);
  const successRate = totalTargeted > 0 ? ((push.deliveryCount || 0) / totalTargeted * 100).toFixed(1) : "0.0";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <span className="truncate">{push.title}</span>
            <Badge className={`${sc.color} text-xs ml-auto`}>{sc.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono text-[#2563EB]">{push.pushId}</span>
            {push.createdAt && <span>Created: {new Date(push.createdAt).toLocaleString()}</span>}
            {push.sentAt && <span>Sent: {new Date(push.sentAt).toLocaleString()}</span>}
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white px-3 py-2 text-sm font-medium">
              Push Message
            </div>
            <div className="p-4">
              <div className="text-lg font-bold mb-2">{push.title}</div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">{push.body}</div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            <div className="p-2 bg-muted/50 rounded"><div className="text-[10px] text-muted-foreground">Priority</div><Badge className={`${pc.color} text-xs mt-0.5`}>{pc.label}</Badge></div>
            <div className="p-2 bg-muted/50 rounded"><div className="text-[10px] text-muted-foreground">Module</div><div className="text-sm mt-0.5">{push.module || "—"}</div></div>
            <div className="p-2 bg-muted/50 rounded"><div className="text-[10px] text-muted-foreground">Audience</div><div className="text-xs mt-0.5">{audienceConfig[push.audienceType]}</div></div>
            <div className="p-2 bg-muted/50 rounded"><div className="text-[10px] text-muted-foreground">Trigger</div><div className="flex items-center gap-1 mt-0.5"><tc.icon className="h-3 w-3" /><span className="text-xs">{tc.label}</span></div></div>
            <div className="p-2 bg-muted/50 rounded"><div className="text-[10px] text-muted-foreground">Device</div><div className="text-sm capitalize mt-0.5">{push.deviceTargets || "all"}</div></div>
          </div>

          {push.status === "sent" && (
            <div className="grid grid-cols-5 gap-2">
              <div className="p-2.5 bg-green-50 dark:bg-green-950/10 rounded text-center"><div className="text-[10px] text-muted-foreground">Delivered</div><div className="text-lg font-bold text-green-600">{push.deliveryCount || 0}</div></div>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/10 rounded text-center"><div className="text-[10px] text-muted-foreground">Clicks</div><div className="text-lg font-bold text-blue-600">{push.clickCount || 0}</div></div>
              <div className="p-2.5 bg-red-50 dark:bg-red-950/10 rounded text-center"><div className="text-[10px] text-muted-foreground">Failed</div><div className="text-lg font-bold text-red-600">{push.failedCount || 0}</div></div>
              <div className="p-2.5 bg-purple-50 dark:bg-purple-950/10 rounded text-center"><div className="text-[10px] text-muted-foreground">Acknowledged</div><div className="text-lg font-bold text-purple-600">{push.acknowledgedCount || 0}</div></div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/10 rounded text-center"><div className="text-[10px] text-muted-foreground">Success Rate</div><div className="text-lg font-bold text-emerald-600">{successRate}%</div></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {push.deepLink && (
              <div className="p-2 bg-muted/30 rounded flex items-center gap-2"><Link2 className="h-3.5 w-3.5 text-blue-500" /><div><div className="text-[10px] text-muted-foreground">Deep Link</div><div className="text-xs font-mono">{push.deepLink}</div></div></div>
            )}
            {push.expiryTime && (
              <div className="p-2 bg-muted/30 rounded flex items-center gap-2"><Timer className="h-3.5 w-3.5 text-orange-500" /><div><div className="text-[10px] text-muted-foreground">Expires</div><div className="text-xs">{new Date(push.expiryTime).toLocaleString()}</div></div></div>
            )}
            {push.scheduledAt && (
              <div className="p-2 bg-muted/30 rounded flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-yellow-500" /><div><div className="text-[10px] text-muted-foreground">Scheduled</div><div className="text-xs">{new Date(push.scheduledAt).toLocaleString()}</div></div></div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {push.silentPush && <Badge variant="outline" className="flex items-center gap-1"><VolumeX className="h-3 w-3" /> Silent Push</Badge>}
            {push.requireAcknowledgment && <Badge variant="outline" className="flex items-center gap-1"><Shield className="h-3 w-3" /> Acknowledgment Required</Badge>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-close-preview">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}