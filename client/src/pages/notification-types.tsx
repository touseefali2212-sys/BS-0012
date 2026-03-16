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
  Bell, Plus, Search, Filter, Pencil, Trash2, Copy, ToggleLeft, ToggleRight,
  Eye, ChevronDown, ChevronUp, X, AlertTriangle, Mail, MessageSquare,
  Smartphone, Send, Zap, Clock, Shield, BarChart3, TrendingUp,
  Activity, Users, Layers, Settings, CheckCircle, XCircle, Info,
  Hash, FileText, RefreshCw, ArrowUpRight, Download
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, Legend
} from "recharts";
import type { NotificationType } from "@shared/schema";

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: "Active", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", dot: "bg-green-500" },
  draft: { label: "Draft", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", dot: "bg-yellow-500" },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", dot: "bg-blue-500" },
  conditional: { label: "Conditional", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", dot: "bg-purple-500" },
  disabled: { label: "Disabled", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400", dot: "bg-gray-500" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  high: { label: "High", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  critical: { label: "Critical", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

const moduleOptions = [
  "Inventory", "Sales", "CRM", "Assets", "Service Outages",
  "HR", "Finance", "Billing", "Tickets", "Network", "User Management", "System",
];

const eventTriggerOptions = [
  "On Create", "On Update", "On Delete", "On Status Change", "On Approval",
  "On Threshold Breach", "On Date-Based Event", "On Payment", "On Login",
  "On Assignment", "On Expiry", "On SLA Breach",
];

const channelOptions = [
  { id: "email", label: "Email", icon: Mail },
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "in_app", label: "In-App", icon: Bell },
  { id: "whatsapp", label: "WhatsApp", icon: Send },
  { id: "push", label: "Push", icon: Smartphone },
];

const audienceOptions = [
  { value: "all", label: "All Users" },
  { value: "roles", label: "Specific Roles" },
  { value: "users", label: "Specific Users" },
  { value: "customers", label: "Customer Segment" },
  { value: "suppliers", label: "Suppliers" },
];

const roleOptions = ["super_admin", "admin", "manager", "staff", "technician", "accountant", "viewer"];

const dynamicVarExamples = "{{Customer_Name}}, {{Invoice_Number}}, {{Amount}}, {{Due_Date}}, {{Product_Name}}, {{Ticket_ID}}, {{Asset_Tag}}";

const CHART_COLORS = ["#1D4ED8", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#6366F1", "#EC4899", "#14B8A6", "#84CC16", "#A855F7"];

export default function NotificationTypesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterModule, setFilterModule] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterChannel, setFilterChannel] = useState("all");
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [editingType, setEditingType] = useState<NotificationType | null>(null);
  const [previewType, setPreviewType] = useState<NotificationType | null>(null);

  const { data: allTypes = [], isLoading, isError } = useQuery<NotificationType[]>({ queryKey: ["/api/notification-types"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/notification-types", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/notification-types"] }); toast({ title: "Notification type created" }); setShowConfigPanel(false); setEditingType(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/notification-types/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/notification-types"] }); toast({ title: "Notification type updated" }); setShowConfigPanel(false); setEditingType(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/notification-types/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/notification-types"] }); toast({ title: "Notification type deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/notification-types/${id}/duplicate`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/notification-types"] }); toast({ title: "Notification type duplicated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/notification-types/${id}/toggle`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/notification-types"] }); toast({ title: "Status toggled" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const totalTypes = allTypes.length;
  const activeCount = allTypes.filter(t => t.status === "active").length;
  const disabledCount = allTypes.filter(t => t.status === "disabled").length;
  const eventBasedCount = allTypes.filter(t => t.triggerType === "event").length;
  const scheduledCount = allTypes.filter(t => t.triggerType === "scheduled" || t.status === "scheduled").length;
  const failedLast7Days = allTypes.reduce((sum, t) => sum + (t.failedCount || 0), 0);

  const moduleChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    allTypes.forEach(t => { counts[t.moduleSource] = (counts[t.moduleSource] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allTypes]);

  const channelChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    allTypes.forEach(t => {
      (t.deliveryChannels || []).forEach(ch => { counts[ch] = (counts[ch] || 0) + 1; });
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: channelOptions.find(c => c.id === name)?.label || name, value
    }));
  }, [allTypes]);

  const successRateData = useMemo(() => {
    const total = allTypes.reduce((s, t) => s + (t.triggerCount || 0), 0);
    const success = allTypes.reduce((s, t) => s + (t.successCount || 0), 0);
    const failed = allTypes.reduce((s, t) => s + (t.failedCount || 0), 0);
    return [
      { name: "Success", value: success || 0 },
      { name: "Failed", value: failed || 0 },
      { name: "Pending", value: Math.max(0, total - success - failed) },
    ];
  }, [allTypes]);

  const priorityChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    allTypes.forEach(t => { counts[t.priorityLevel] = (counts[t.priorityLevel] || 0) + 1; });
    return Object.entries(priorityConfig).map(([key, cfg]) => ({
      name: cfg.label, value: counts[key] || 0
    }));
  }, [allTypes]);

  const filteredTypes = useMemo(() => {
    return allTypes.filter(t => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.moduleSource.toLowerCase().includes(q) && !t.eventTrigger.toLowerCase().includes(q)) return false;
      }
      if (filterModule !== "all" && t.moduleSource !== filterModule) return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterPriority !== "all" && t.priorityLevel !== filterPriority) return false;
      if (filterChannel !== "all" && !(t.deliveryChannels || []).includes(filterChannel)) return false;
      return true;
    });
  }, [allTypes, searchQuery, filterModule, filterStatus, filterPriority, filterChannel]);

  const clearFilters = () => { setSearchQuery(""); setFilterModule("all"); setFilterStatus("all"); setFilterPriority("all"); setFilterChannel("all"); };
  const hasFilters = searchQuery || filterModule !== "all" || filterStatus !== "all" || filterPriority !== "all" || filterChannel !== "all";

  const handleExport = () => {
    const headers = ["Name", "Module", "Event Trigger", "Channels", "Priority", "Audience", "Status", "Triggers", "Success", "Failed"];
    const rows = filteredTypes.map(t => [
      t.name, t.moduleSource, t.eventTrigger, (t.deliveryChannels || []).join("; "),
      t.priorityLevel, t.audienceType, t.status,
      String(t.triggerCount || 0), String(t.successCount || 0), String(t.failedCount || 0),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `notification_types_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Notification Type Management</h1>
          <p className="text-muted-foreground mt-1">Define, configure, and control all system-generated notifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} data-testid="button-export"><Download className="h-4 w-4 mr-2" /> Export</Button>
          <Button onClick={() => { setEditingType(null); setShowConfigPanel(true); }} className="bg-gradient-to-r from-[#1D4ED8] to-[#F59E0B] text-white" data-testid="button-add-type">
            <Plus className="h-4 w-4 mr-2" /> New Notification Type
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {[
          { label: "Total Types", value: totalTypes, icon: Layers, gradient: "from-[#1D4ED8] to-[#2563EB]" },
          { label: "Active", value: activeCount, icon: CheckCircle, gradient: "from-green-500 to-green-700" },
          { label: "Disabled", value: disabledCount, icon: XCircle, gradient: "from-red-500 to-red-700" },
          { label: "Event-Based", value: eventBasedCount, icon: Zap, gradient: "from-[#F59E0B] to-[#D97706]" },
          { label: "Scheduled", value: scheduledCount, icon: Clock, gradient: "from-blue-500 to-blue-700" },
          { label: "Failed (Total)", value: failedLast7Days, icon: AlertTriangle, gradient: "from-orange-500 to-orange-700" },
        ].map((kpi, idx) => (
          <Card key={idx} className={`bg-gradient-to-br ${kpi.gradient} text-white border-0 shadow-lg`} data-testid={`card-kpi-${idx}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2"><kpi.icon className="h-5 w-5 opacity-80" /></div>
              <div className="text-2xl font-bold" data-testid={`text-kpi-value-${idx}`}>{kpi.value}</div>
              <div className="text-xs opacity-80 mt-1">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#1D4ED8]" /> Notifications by Module</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={moduleChartData} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={55} />
                <Tooltip />
                <Bar dataKey="value" fill="#1D4ED8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-600" /> Delivery Success Rate</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={successRateData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {successRateData.map((_, i) => <Cell key={i} fill={["#10B981", "#EF4444", "#94A3B8"][i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Activity className="h-4 w-4 text-[#F59E0B]" /> Channel Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={channelChartData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {channelChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Shield className="h-4 w-4 text-purple-600" /> Priority Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityChartData.map((_, i) => <Cell key={i} fill={["#94A3B8", "#3B82F6", "#F97316", "#EF4444"][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search notification name, module, trigger..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} data-testid="button-toggle-filters">
          <Filter className="h-4 w-4 mr-1" /> {showFilters ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
        </Button>
        {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500" data-testid="button-clear-filters"><X className="h-3 w-3 mr-1" /> Clear</Button>}
      </div>

      {showFilters && (
        <Card><CardContent className="p-3">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Module Source</Label>
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger className="h-8 text-xs" data-testid="filter-module"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {moduleOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
              <Label className="text-xs">Channel</Label>
              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger className="h-8 text-xs" data-testid="filter-channel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {channelOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent></Card>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#1D4ED8] to-[#F59E0B] text-white">
              <th className="p-2.5 text-left font-medium rounded-tl-lg">Notification Name</th>
              <th className="p-2.5 text-left font-medium">Module Source</th>
              <th className="p-2.5 text-left font-medium">Event Trigger</th>
              <th className="p-2.5 text-center font-medium">Channels</th>
              <th className="p-2.5 text-center font-medium">Priority</th>
              <th className="p-2.5 text-center font-medium">Audience</th>
              <th className="p-2.5 text-center font-medium">Status</th>
              <th className="p-2.5 text-center font-medium">Triggers</th>
              <th className="p-2.5 text-center font-medium">Last Modified</th>
              <th className="p-2.5 text-center font-medium rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Loading notification types...</td></tr>
            ) : isError ? (
              <tr><td colSpan={10} className="p-8 text-center text-red-500">Failed to load notification types. Please try refreshing.</td></tr>
            ) : filteredTypes.length === 0 ? (
              <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">{hasFilters ? "No notification types match filters" : "No notification types defined yet. Create one to get started."}</td></tr>
            ) : filteredTypes.map(nt => {
              const sc = statusConfig[nt.status] || statusConfig.active;
              const pc = priorityConfig[nt.priorityLevel] || priorityConfig.medium;
              const channels = nt.deliveryChannels || [];
              return (
                <tr key={nt.id} className={`border-b hover:bg-muted/50 transition-colors ${nt.status === "disabled" ? "opacity-60" : ""}`} data-testid={`row-notif-type-${nt.id}`}>
                  <td className="p-2.5">
                    <div className="font-medium text-sm">{nt.name}</div>
                    {nt.triggerCondition && <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[200px]">{nt.triggerCondition}</div>}
                  </td>
                  <td className="p-2.5 text-xs">{nt.moduleSource}</td>
                  <td className="p-2.5 text-xs">{nt.eventTrigger}</td>
                  <td className="p-2.5">
                    <div className="flex items-center justify-center gap-1">
                      {channels.includes("email") && <Mail className="h-3.5 w-3.5 text-blue-600" title="Email" />}
                      {channels.includes("sms") && <MessageSquare className="h-3.5 w-3.5 text-green-600" title="SMS" />}
                      {channels.includes("in_app") && <Bell className="h-3.5 w-3.5 text-amber-600" title="In-App" />}
                      {channels.includes("whatsapp") && <Send className="h-3.5 w-3.5 text-emerald-600" title="WhatsApp" />}
                      {channels.includes("push") && <Smartphone className="h-3.5 w-3.5 text-purple-600" title="Push" />}
                    </div>
                  </td>
                  <td className="p-2.5 text-center"><Badge className={`${pc.color} text-[10px]`}>{pc.label}</Badge></td>
                  <td className="p-2.5 text-center text-xs capitalize">{nt.audienceType}</td>
                  <td className="p-2.5 text-center"><Badge className={`${sc.color} text-[10px]`}>{sc.label}</Badge></td>
                  <td className="p-2.5 text-center">
                    <div className="text-xs font-mono">{nt.triggerCount || 0}</div>
                    <div className="text-[9px] text-muted-foreground">
                      <span className="text-green-600">{nt.successCount || 0}✓</span> <span className="text-red-500">{nt.failedCount || 0}✗</span>
                    </div>
                  </td>
                  <td className="p-2.5 text-center text-xs text-muted-foreground">{nt.lastModified ? new Date(nt.lastModified).toLocaleDateString() : "—"}</td>
                  <td className="p-2.5">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setPreviewType(nt)} title="Preview" data-testid={`button-preview-${nt.id}`}><Eye className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingType(nt); setShowConfigPanel(true); }} title="Edit" data-testid={`button-edit-${nt.id}`}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => duplicateMutation.mutate(nt.id)} title="Duplicate" data-testid={`button-duplicate-${nt.id}`}><Copy className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleMutation.mutate(nt.id)} title={nt.status === "active" ? "Disable" : "Enable"} data-testid={`button-toggle-${nt.id}`}>
                        {nt.status === "active" ? <ToggleRight className="h-3.5 w-3.5 text-green-600" /> : <ToggleLeft className="h-3.5 w-3.5 text-gray-400" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => { if (confirm("Delete this notification type?")) deleteMutation.mutate(nt.id); }} title="Delete" data-testid={`button-delete-${nt.id}`}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredTypes.length > 0 && (
          <div className="p-2 border-t text-xs text-muted-foreground flex justify-between">
            <span>Showing {filteredTypes.length} of {allTypes.length} notification types</span>
            <span>Active: {filteredTypes.filter(t => t.status === "active").length} | Disabled: {filteredTypes.filter(t => t.status === "disabled").length} | Draft: {filteredTypes.filter(t => t.status === "draft").length}</span>
          </div>
        )}
      </div>

      {showConfigPanel && (
        <ConfigPanel
          notifType={editingType}
          onSave={(data: any) => editingType ? updateMutation.mutate({ id: editingType.id, data }) : createMutation.mutate(data)}
          onClose={() => { setShowConfigPanel(false); setEditingType(null); }}
          isPending={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {previewType && (
        <PreviewDialog notifType={previewType} onClose={() => setPreviewType(null)} />
      )}
    </div>
  );
}

function ConfigPanel({ notifType, onSave, onClose, isPending }: {
  notifType: NotificationType | null;
  onSave: (data: any) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(notifType?.name || "");
  const [moduleSource, setModuleSource] = useState(notifType?.moduleSource || "");
  const [eventTrigger, setEventTrigger] = useState(notifType?.eventTrigger || "");
  const [triggerCondition, setTriggerCondition] = useState(notifType?.triggerCondition || "");
  const [priorityLevel, setPriorityLevel] = useState(notifType?.priorityLevel || "medium");
  const [status, setStatus] = useState(notifType?.status || "draft");
  const [deliveryChannels, setDeliveryChannels] = useState<string[]>(notifType?.deliveryChannels || ["in_app"]);
  const [audienceType, setAudienceType] = useState(notifType?.audienceType || "all");
  const [audienceRoles, setAudienceRoles] = useState<string[]>(notifType?.audienceRoles || []);
  const [emailSubject, setEmailSubject] = useState(notifType?.emailSubject || "");
  const [emailTemplate, setEmailTemplate] = useState(notifType?.emailTemplate || "");
  const [smsTemplate, setSmsTemplate] = useState(notifType?.smsTemplate || "");
  const [inAppMessage, setInAppMessage] = useState(notifType?.inAppMessage || "");
  const [whatsappTemplate, setWhatsappTemplate] = useState(notifType?.whatsappTemplate || "");
  const [pushTitle, setPushTitle] = useState(notifType?.pushTitle || "");
  const [pushBody, setPushBody] = useState(notifType?.pushBody || "");
  const [triggerType, setTriggerType] = useState(notifType?.triggerType || "event");
  const [triggerEvent, setTriggerEvent] = useState(notifType?.triggerEvent || "");
  const [delayMinutes, setDelayMinutes] = useState(String(notifType?.delayMinutes || 0));
  const [escalationEnabled, setEscalationEnabled] = useState(notifType?.escalationEnabled || false);
  const [escalationTimeoutMinutes, setEscalationTimeoutMinutes] = useState(String(notifType?.escalationTimeoutMinutes || 60));
  const [repeatEnabled, setRepeatEnabled] = useState(notifType?.repeatEnabled || false);
  const [repeatIntervalMinutes, setRepeatIntervalMinutes] = useState(String(notifType?.repeatIntervalMinutes || 30));
  const [repeatMaxCount, setRepeatMaxCount] = useState(String(notifType?.repeatMaxCount || 3));

  const toggleChannel = (ch: string) => {
    setDeliveryChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const toggleRole = (role: string) => {
    setAudienceRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleSave = () => {
    onSave({
      name, moduleSource, eventTrigger, triggerCondition: triggerCondition || null,
      deliveryChannels, priorityLevel, status, audienceType,
      audienceRoles: audienceType === "roles" ? audienceRoles : null,
      emailSubject: emailSubject || null, emailTemplate: emailTemplate || null,
      smsTemplate: smsTemplate || null, inAppMessage: inAppMessage || null,
      whatsappTemplate: whatsappTemplate || null, pushTitle: pushTitle || null, pushBody: pushBody || null,
      triggerType, triggerEvent: triggerEvent || null,
      delayMinutes: parseInt(delayMinutes) || 0,
      escalationEnabled, escalationTimeoutMinutes: parseInt(escalationTimeoutMinutes) || 60,
      repeatEnabled, repeatIntervalMinutes: parseInt(repeatIntervalMinutes) || 30,
      repeatMaxCount: parseInt(repeatMaxCount) || 3,
      dynamicVariables: dynamicVarExamples,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{notifType ? "Edit Notification Type" : "Create Notification Type"}</DialogTitle></DialogHeader>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="triggers">Triggers & Logic</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Notification Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Low Stock Alert" data-testid="input-notif-name" /></div>
              <div>
                <Label>Module Source *</Label>
                <Select value={moduleSource} onValueChange={setModuleSource}>
                  <SelectTrigger data-testid="select-module"><SelectValue placeholder="Select module" /></SelectTrigger>
                  <SelectContent>{moduleOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Trigger *</Label>
                <Select value={eventTrigger} onValueChange={setEventTrigger}>
                  <SelectTrigger data-testid="select-event"><SelectValue placeholder="Select event" /></SelectTrigger>
                  <SelectContent>{eventTriggerOptions.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Priority</Label>
                  <Select value={priorityLevel} onValueChange={setPriorityLevel}>
                    <SelectTrigger data-testid="select-priority"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div><Label>Trigger Condition (optional)</Label><Input value={triggerCondition} onChange={e => setTriggerCondition(e.target.value)} placeholder='e.g. IF stock < reorder_level AND status = Active' data-testid="input-condition" /></div>
            <div>
              <Label>Delivery Channels</Label>
              <div className="flex gap-2 mt-2">
                {channelOptions.map(ch => (
                  <Button key={ch.id} type="button" variant={deliveryChannels.includes(ch.id) ? "default" : "outline"} size="sm"
                    className={deliveryChannels.includes(ch.id) ? "bg-[#1D4ED8] text-white" : ""} onClick={() => toggleChannel(ch.id)} data-testid={`toggle-channel-${ch.id}`}>
                    <ch.icon className="h-3.5 w-3.5 mr-1.5" /> {ch.label}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audience" className="space-y-4 mt-4">
            <div>
              <Label>Audience Type</Label>
              <Select value={audienceType} onValueChange={setAudienceType}>
                <SelectTrigger data-testid="select-audience"><SelectValue /></SelectTrigger>
                <SelectContent>{audienceOptions.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {audienceType === "roles" && (
              <div>
                <Label>Select Roles</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {roleOptions.map(role => (
                    <Button key={role} type="button" variant={audienceRoles.includes(role) ? "default" : "outline"} size="sm"
                      className={audienceRoles.includes(role) ? "bg-[#1D4ED8] text-white" : ""} onClick={() => toggleRole(role)} data-testid={`toggle-role-${role}`}>
                      {role.replace("_", " ")}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <Card className="bg-muted/50"><CardContent className="p-3 text-xs text-muted-foreground">
              <Info className="h-4 w-4 inline mr-1 text-blue-500" />
              Audience determines who receives this notification. "All Users" sends to every active user. Role-based targeting only sends to users with matching roles.
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4 mt-4">
            <Card className="bg-amber-50/50 dark:bg-amber-950/10 border-amber-200"><CardContent className="p-3 text-xs">
              <Zap className="h-3.5 w-3.5 inline mr-1 text-amber-600" />
              <span className="font-medium">Dynamic Variables:</span> {dynamicVarExamples}
            </CardContent></Card>

            {deliveryChannels.includes("email") && (
              <div className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4 text-blue-600" /> Email Template</div>
                <div><Label className="text-xs">Subject</Label><Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="e.g. [Alert] Low Stock — {{Product_Name}}" data-testid="input-email-subject" /></div>
                <div><Label className="text-xs">Body</Label><Textarea value={emailTemplate} onChange={e => setEmailTemplate(e.target.value)} rows={3} placeholder="Dear Team,&#10;&#10;Stock for {{Product_Name}} has fallen below the reorder level..." data-testid="input-email-body" /></div>
              </div>
            )}

            {deliveryChannels.includes("sms") && (
              <div className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium"><MessageSquare className="h-4 w-4 text-green-600" /> SMS Template</div>
                <Textarea value={smsTemplate} onChange={e => setSmsTemplate(e.target.value)} rows={2} placeholder="[NetSphere] Alert: {{Product_Name}} stock low. Current: {{Amount}}. Reorder now." data-testid="input-sms" />
              </div>
            )}

            {deliveryChannels.includes("in_app") && (
              <div className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium"><Bell className="h-4 w-4 text-amber-600" /> In-App Message</div>
                <Textarea value={inAppMessage} onChange={e => setInAppMessage(e.target.value)} rows={2} placeholder="Low stock alert for {{Product_Name}}. Current quantity: {{Amount}}" data-testid="input-inapp" />
              </div>
            )}

            {deliveryChannels.includes("whatsapp") && (
              <div className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium"><Send className="h-4 w-4 text-emerald-600" /> WhatsApp Template</div>
                <Textarea value={whatsappTemplate} onChange={e => setWhatsappTemplate(e.target.value)} rows={2} placeholder="Hello {{Customer_Name}}, your invoice {{Invoice_Number}} is due on {{Due_Date}}." data-testid="input-whatsapp" />
              </div>
            )}

            {deliveryChannels.includes("push") && (
              <div className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium"><Smartphone className="h-4 w-4 text-purple-600" /> Push Notification</div>
                <div><Label className="text-xs">Title</Label><Input value={pushTitle} onChange={e => setPushTitle(e.target.value)} placeholder="Stock Alert" data-testid="input-push-title" /></div>
                <div><Label className="text-xs">Body</Label><Textarea value={pushBody} onChange={e => setPushBody(e.target.value)} rows={2} placeholder="{{Product_Name}} is running low on stock." data-testid="input-push-body" /></div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="triggers" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Trigger Type</Label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger data-testid="select-trigger-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Event-Based</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Trigger Event</Label><Input value={triggerEvent} onChange={e => setTriggerEvent(e.target.value)} placeholder="e.g. stock.below_reorder" data-testid="input-trigger-event" /></div>
            </div>
            <div><Label>Delay (minutes after trigger)</Label><Input type="number" min="0" value={delayMinutes} onChange={e => setDelayMinutes(e.target.value)} data-testid="input-delay" /></div>

            <div className="space-y-3 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><ArrowUpRight className="h-4 w-4 text-red-500" /> <span className="text-sm font-medium">Escalation</span></div>
                <Switch checked={escalationEnabled} onCheckedChange={setEscalationEnabled} data-testid="switch-escalation" />
              </div>
              {escalationEnabled && (
                <div>
                  <Label className="text-xs">Escalation Timeout (minutes)</Label>
                  <Input type="number" min="1" value={escalationTimeoutMinutes} onChange={e => setEscalationTimeoutMinutes(e.target.value)} data-testid="input-escalation-timeout" />
                  <p className="text-[10px] text-muted-foreground mt-1">Level 1 → Assigned Staff → Level 2 → Manager → Level 3 → Admin</p>
                </div>
              )}
            </div>

            <div className="space-y-3 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-blue-500" /> <span className="text-sm font-medium">Repeat Reminders</span></div>
                <Switch checked={repeatEnabled} onCheckedChange={setRepeatEnabled} data-testid="switch-repeat" />
              </div>
              {repeatEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Interval (minutes)</Label><Input type="number" min="1" value={repeatIntervalMinutes} onChange={e => setRepeatIntervalMinutes(e.target.value)} data-testid="input-repeat-interval" /></div>
                  <div><Label className="text-xs">Max Repeats</Label><Input type="number" min="1" value={repeatMaxCount} onChange={e => setRepeatMaxCount(e.target.value)} data-testid="input-repeat-max" /></div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name || !moduleSource || !eventTrigger || isPending}
            className="bg-gradient-to-r from-[#1D4ED8] to-[#F59E0B] text-white" data-testid="button-save-type">
            {isPending ? "Saving..." : notifType ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewDialog({ notifType, onClose }: { notifType: NotificationType; onClose: () => void }) {
  const sc = statusConfig[notifType.status] || statusConfig.active;
  const pc = priorityConfig[notifType.priorityLevel] || priorityConfig.medium;
  const channels = notifType.deliveryChannels || [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> {notifType.name}</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="p-2 bg-muted/50 rounded"><div className="text-[10px] text-muted-foreground">Module</div><div className="text-sm font-medium">{notifType.moduleSource}</div></div>
            <div className="p-2 bg-muted/50 rounded"><div className="text-[10px] text-muted-foreground">Event</div><div className="text-sm font-medium">{notifType.eventTrigger}</div></div>
            <div className="p-2 bg-muted/50 rounded"><div className="text-[10px] text-muted-foreground">Priority</div><Badge className={`${pc.color} text-xs mt-0.5`}>{pc.label}</Badge></div>
            <div className="p-2 bg-muted/50 rounded"><div className="text-[10px] text-muted-foreground">Status</div><Badge className={`${sc.color} text-xs mt-0.5`}>{sc.label}</Badge></div>
          </div>

          {notifType.triggerCondition && (
            <div className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200">
              <div className="text-[10px] text-muted-foreground mb-1">Trigger Condition</div>
              <code className="text-xs">{notifType.triggerCondition}</code>
            </div>
          )}

          <div>
            <div className="text-xs font-medium mb-2">Delivery Channels</div>
            <div className="flex gap-2">
              {channels.map(ch => {
                const cfg = channelOptions.find(c => c.id === ch);
                return cfg ? (
                  <Badge key={ch} variant="outline" className="flex items-center gap-1 text-xs"><cfg.icon className="h-3 w-3" /> {cfg.label}</Badge>
                ) : null;
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium mb-2">Audience</div>
            <div className="text-sm capitalize">{notifType.audienceType}{notifType.audienceRoles && notifType.audienceRoles.length > 0 ? `: ${notifType.audienceRoles.join(", ")}` : ""}</div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-2 bg-muted/50 rounded text-center"><div className="text-[10px] text-muted-foreground">Total Triggers</div><div className="text-lg font-bold">{notifType.triggerCount || 0}</div></div>
            <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded text-center"><div className="text-[10px] text-muted-foreground">Successful</div><div className="text-lg font-bold text-green-600">{notifType.successCount || 0}</div></div>
            <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded text-center"><div className="text-[10px] text-muted-foreground">Failed</div><div className="text-lg font-bold text-red-600">{notifType.failedCount || 0}</div></div>
          </div>

          {channels.includes("email") && notifType.emailTemplate && (
            <div className="p-3 border rounded-lg space-y-1">
              <div className="flex items-center gap-1 text-xs font-medium"><Mail className="h-3.5 w-3.5 text-blue-600" /> Email Preview</div>
              {notifType.emailSubject && <div className="text-xs"><span className="text-muted-foreground">Subject:</span> {notifType.emailSubject}</div>}
              <div className="text-xs bg-muted/30 p-2 rounded whitespace-pre-wrap">{notifType.emailTemplate}</div>
            </div>
          )}

          {channels.includes("sms") && notifType.smsTemplate && (
            <div className="p-3 border rounded-lg space-y-1">
              <div className="flex items-center gap-1 text-xs font-medium"><MessageSquare className="h-3.5 w-3.5 text-green-600" /> SMS Preview</div>
              <div className="text-xs bg-muted/30 p-2 rounded">{notifType.smsTemplate}</div>
            </div>
          )}

          {channels.includes("in_app") && notifType.inAppMessage && (
            <div className="p-3 border rounded-lg space-y-1">
              <div className="flex items-center gap-1 text-xs font-medium"><Bell className="h-3.5 w-3.5 text-amber-600" /> In-App Preview</div>
              <div className="text-xs bg-muted/30 p-2 rounded">{notifType.inAppMessage}</div>
            </div>
          )}

          {channels.includes("whatsapp") && notifType.whatsappTemplate && (
            <div className="p-3 border rounded-lg space-y-1">
              <div className="flex items-center gap-1 text-xs font-medium"><Send className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp Preview</div>
              <div className="text-xs bg-muted/30 p-2 rounded">{notifType.whatsappTemplate}</div>
            </div>
          )}

          {channels.includes("push") && notifType.pushTitle && (
            <div className="p-3 border rounded-lg space-y-1">
              <div className="flex items-center gap-1 text-xs font-medium"><Smartphone className="h-3.5 w-3.5 text-purple-600" /> Push Preview</div>
              <div className="text-xs"><span className="font-medium">{notifType.pushTitle}</span></div>
              {notifType.pushBody && <div className="text-xs text-muted-foreground">{notifType.pushBody}</div>}
            </div>
          )}

          {notifType.escalationEnabled && (
            <div className="p-3 border rounded-lg border-red-200 bg-red-50/30 dark:bg-red-950/10">
              <div className="flex items-center gap-1 text-xs font-medium text-red-600 mb-1"><ArrowUpRight className="h-3.5 w-3.5" /> Escalation Enabled</div>
              <div className="text-xs text-muted-foreground">Timeout: {notifType.escalationTimeoutMinutes} min → Level 1 (Staff) → Level 2 (Manager) → Level 3 (Admin)</div>
            </div>
          )}

          {notifType.repeatEnabled && (
            <div className="p-3 border rounded-lg border-blue-200 bg-blue-50/30 dark:bg-blue-950/10">
              <div className="flex items-center gap-1 text-xs font-medium text-blue-600 mb-1"><RefreshCw className="h-3.5 w-3.5" /> Repeat Reminders</div>
              <div className="text-xs text-muted-foreground">Every {notifType.repeatIntervalMinutes} min, up to {notifType.repeatMaxCount} times</div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-close-preview">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}