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
  FileText, Plus, Search, Filter, Pencil, Trash2, Copy, Eye, Send,
  ChevronDown, ChevronUp, X, Mail, MessageSquare, Bell, Smartphone,
  Zap, Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp,
  Activity, BarChart3, Download, ToggleLeft, ToggleRight, Hash,
  Shield, Layers, Info, Code, ArrowRight, History, ExternalLink
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, Legend
} from "recharts";

interface NotificationTemplate {
  id: number;
  name: string;
  type: string;
  channel: string;
  subject: string | null;
  body: string;
  variables: string | null;
  isActive: boolean;
  module: string | null;
  priority: string | null;
  description: string | null;
  usageCount: number | null;
  lastUsedAt: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface NotificationDispatch {
  id: number;
  templateId: number | null;
  channel: string;
  recipient: string;
  subject: string | null;
  body: string;
  status: string;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

const typeConfig: Record<string, { label: string; color: string; icon: any }> = {
  general: { label: "General", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", icon: FileText },
  billing: { label: "Billing", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: Hash },
  alert: { label: "Alert", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: AlertTriangle },
  marketing: { label: "Marketing", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: TrendingUp },
  system: { label: "System", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Shield },
  reminder: { label: "Reminder", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  onboarding: { label: "Onboarding", color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400", icon: ArrowRight },
  escalation: { label: "Escalation", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: Zap },
};

const channelConfig: Record<string, { label: string; color: string; icon: any }> = {
  email: { label: "Email", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: Mail },
  sms: { label: "SMS", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", icon: MessageSquare },
  push: { label: "Push", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", icon: Smartphone },
  in_app: { label: "In-App", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: Bell },
  whatsapp: { label: "WhatsApp", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: Send },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-600" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  critical: { label: "Critical", color: "bg-red-100 text-red-700" },
};

const moduleOptions = [
  "Inventory", "Sales", "CRM", "Assets", "Service Outages",
  "HR", "Finance", "Billing", "Tickets", "Network", "User Management", "System",
];

const dynamicVars = [
  { var: "{{Customer_Name}}", desc: "Full name of the customer" },
  { var: "{{Invoice_Number}}", desc: "Invoice reference number" },
  { var: "{{Amount}}", desc: "Monetary amount (PKR)" },
  { var: "{{Due_Date}}", desc: "Payment due date" },
  { var: "{{Product_Name}}", desc: "Product or service name" },
  { var: "{{Ticket_ID}}", desc: "Support ticket ID" },
  { var: "{{Asset_Tag}}", desc: "Asset tag identifier" },
  { var: "{{Company_Name}}", desc: "Company name (NetSphere)" },
  { var: "{{User_Name}}", desc: "Staff user name" },
  { var: "{{Date}}", desc: "Current date" },
];

const CHART_COLORS = ["#1D4ED8", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#6366F1"];

export default function AlertTemplatesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"templates" | "dispatches" | "variables">("templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterChannel, setFilterChannel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterModule, setFilterModule] = useState("all");

  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);

  const { data: allTemplates = [], isLoading, isError } = useQuery<NotificationTemplate[]>({ queryKey: ["/api/notification-templates"] });
  const { data: dispatches = [], isLoading: dispatchesLoading, isError: dispatchesError } = useQuery<NotificationDispatch[]>({ queryKey: ["/api/notification-dispatches"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/notification-templates", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/notification-templates"] }); toast({ title: "Template created" }); setShowEditor(false); setEditingTemplate(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/notification-templates/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/notification-templates"] }); toast({ title: "Template updated" }); setShowEditor(false); setEditingTemplate(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/notification-templates/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/notification-templates"] }); toast({ title: "Template deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: number) => {
      const original = allTemplates.find(t => t.id === id);
      if (!original) throw new Error("Template not found");
      return apiRequest("POST", "/api/notification-templates", {
        name: `${original.name} (Copy)`,
        type: original.type,
        channel: original.channel,
        subject: original.subject,
        body: original.body,
        variables: original.variables,
        isActive: false,
        module: original.module,
        priority: original.priority,
        description: original.description,
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/notification-templates"] }); toast({ title: "Template duplicated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => apiRequest("PATCH", `/api/notification-templates/${id}`, { isActive: !isActive }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/notification-templates"] }); toast({ title: "Status toggled" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const totalTemplates = allTemplates.length;
  const activeTemplates = allTemplates.filter(t => t.isActive).length;
  const inactiveTemplates = allTemplates.filter(t => !t.isActive).length;
  const emailTemplates = allTemplates.filter(t => t.channel === "email").length;
  const smsTemplates = allTemplates.filter(t => t.channel === "sms").length;
  const totalDispatches = dispatches.length;
  const sentDispatches = dispatches.filter(d => d.status === "sent").length;
  const failedDispatches = dispatches.filter(d => d.status === "failed").length;

  const typeChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    allTemplates.forEach(t => { counts[t.type] = (counts[t.type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: typeConfig[name]?.label || name, value }));
  }, [allTemplates]);

  const channelChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    allTemplates.forEach(t => { counts[t.channel] = (counts[t.channel] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: channelConfig[name]?.label || name, value }));
  }, [allTemplates]);

  const dispatchStatusData = useMemo(() => {
    const sent = dispatches.filter(d => d.status === "sent").length;
    const failed = dispatches.filter(d => d.status === "failed").length;
    const pending = dispatches.filter(d => d.status === "pending").length;
    return [
      { name: "Sent", value: sent },
      { name: "Failed", value: failed },
      { name: "Pending", value: pending },
    ].filter(d => d.value > 0);
  }, [dispatches]);

  const dispatchTrendData = useMemo(() => {
    const last7Days: Record<string, { sent: number; failed: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      last7Days[key] = { sent: 0, failed: 0 };
    }
    dispatches.forEach(d => {
      const date = (d.sentAt || d.createdAt || "").split("T")[0];
      if (last7Days[date]) {
        if (d.status === "sent") last7Days[date].sent++;
        else if (d.status === "failed") last7Days[date].failed++;
      }
    });
    return Object.entries(last7Days).map(([date, v]) => ({
      date: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }),
      ...v,
    }));
  }, [dispatches]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(t => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.body.toLowerCase().includes(q) && !(t.subject || "").toLowerCase().includes(q) && !(t.description || "").toLowerCase().includes(q)) return false;
      }
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterChannel !== "all" && t.channel !== filterChannel) return false;
      if (filterStatus !== "all") {
        if (filterStatus === "active" && !t.isActive) return false;
        if (filterStatus === "inactive" && t.isActive) return false;
      }
      if (filterModule !== "all" && t.module !== filterModule) return false;
      return true;
    });
  }, [allTemplates, searchQuery, filterType, filterChannel, filterStatus, filterModule]);

  const filteredDispatches = useMemo(() => {
    if (!searchQuery) return dispatches;
    const q = searchQuery.toLowerCase();
    return dispatches.filter(d => d.recipient.toLowerCase().includes(q) || (d.subject || "").toLowerCase().includes(q) || d.channel.toLowerCase().includes(q));
  }, [dispatches, searchQuery]);

  const clearFilters = () => { setSearchQuery(""); setFilterType("all"); setFilterChannel("all"); setFilterStatus("all"); setFilterModule("all"); };
  const hasFilters = searchQuery || filterType !== "all" || filterChannel !== "all" || filterStatus !== "all" || filterModule !== "all";

  const handleExport = () => {
    const headers = ["Name", "Type", "Channel", "Module", "Priority", "Subject", "Active", "Usage Count", "Last Used"];
    const rows = filteredTemplates.map(t => [
      t.name, t.type, t.channel, t.module || "", t.priority || "", t.subject || "",
      t.isActive ? "Yes" : "No", String(t.usageCount || 0), t.lastUsedAt || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `templates_export_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "templates" as const, label: "Template Library", icon: FileText, count: totalTemplates },
    { id: "dispatches" as const, label: "Dispatch History", icon: History, count: totalDispatches },
    { id: "variables" as const, label: "Variable Reference", icon: Code, count: dynamicVars.length },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Alert & Templates</h1>
          <p className="text-muted-foreground mt-1">Design, manage, and track notification templates across all channels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} data-testid="button-export"><Download className="h-4 w-4 mr-2" /> Export</Button>
          <Button onClick={() => { setEditingTemplate(null); setShowEditor(true); }} className="bg-gradient-to-r from-[#1D4ED8] to-[#F59E0B] text-white" data-testid="button-add-template">
            <Plus className="h-4 w-4 mr-2" /> New Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-3">
        {[
          { label: "Total Templates", value: totalTemplates, icon: Layers, gradient: "from-[#1D4ED8] to-[#2563EB]" },
          { label: "Active", value: activeTemplates, icon: CheckCircle, gradient: "from-green-500 to-green-700" },
          { label: "Inactive", value: inactiveTemplates, icon: XCircle, gradient: "from-gray-500 to-gray-700" },
          { label: "Email", value: emailTemplates, icon: Mail, gradient: "from-blue-500 to-blue-700" },
          { label: "SMS", value: smsTemplates, icon: MessageSquare, gradient: "from-emerald-500 to-emerald-700" },
          { label: "Dispatched", value: totalDispatches, icon: Send, gradient: "from-[#F59E0B] to-[#D97706]" },
          { label: "Delivered", value: sentDispatches, icon: CheckCircle, gradient: "from-teal-500 to-teal-700" },
          { label: "Failed", value: failedDispatches, icon: AlertTriangle, gradient: "from-red-500 to-red-700" },
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

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#1D4ED8]" /> Templates by Type</CardTitle></CardHeader>
          <CardContent>
            {typeChartData.length === 0 ? <div className="h-[160px] flex items-center justify-center text-xs text-muted-foreground">No data yet</div> : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={typeChartData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {typeChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Activity className="h-4 w-4 text-[#F59E0B]" /> Channel Distribution</CardTitle></CardHeader>
          <CardContent>
            {channelChartData.length === 0 ? <div className="h-[160px] flex items-center justify-center text-xs text-muted-foreground">No data yet</div> : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={channelChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-600" /> Delivery Status</CardTitle></CardHeader>
          <CardContent>
            {dispatchStatusData.length === 0 ? <div className="h-[160px] flex items-center justify-center text-xs text-muted-foreground">No dispatches yet</div> : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={dispatchStatusData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {dispatchStatusData.map((_, i) => <Cell key={i} fill={["#10B981", "#EF4444", "#F59E0B"][i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><History className="h-4 w-4 text-purple-600" /> Dispatch Trend (7 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={dispatchTrendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="sent" fill="#10B981" stroke="#10B981" fillOpacity={0.3} name="Sent" />
                <Area type="monotone" dataKey="failed" fill="#EF4444" stroke="#EF4444" fillOpacity={0.3} name="Failed" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-[#1D4ED8] text-[#1D4ED8]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid={`tab-${tab.id}`}>
            <tab.icon className="h-4 w-4" /> {tab.label} <span className="text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {activeTab !== "variables" && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={activeTab === "templates" ? "Search template name, subject, body content..." : "Search recipient, subject, channel..."} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search" />
          </div>
          {activeTab === "templates" && (
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} data-testid="button-toggle-filters">
              <Filter className="h-4 w-4 mr-1" /> {showFilters ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </Button>
          )}
          {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500" data-testid="button-clear-filters"><X className="h-3 w-3 mr-1" /> Clear</Button>}
        </div>
      )}

      {showFilters && activeTab === "templates" && (
        <Card><CardContent className="p-3">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-8 text-xs" data-testid="filter-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(typeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Channel</Label>
              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger className="h-8 text-xs" data-testid="filter-channel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {Object.entries(channelConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs" data-testid="filter-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
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
          </div>
        </CardContent></Card>
      )}

      {activeTab === "templates" && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#1D4ED8] to-[#F59E0B] text-white">
                <th className="p-2.5 text-left font-medium rounded-tl-lg">Template Name</th>
                <th className="p-2.5 text-center font-medium">Type</th>
                <th className="p-2.5 text-center font-medium">Channel</th>
                <th className="p-2.5 text-left font-medium">Module</th>
                <th className="p-2.5 text-center font-medium">Priority</th>
                <th className="p-2.5 text-left font-medium">Subject</th>
                <th className="p-2.5 text-left font-medium">Variables</th>
                <th className="p-2.5 text-center font-medium">Usage</th>
                <th className="p-2.5 text-center font-medium">Status</th>
                <th className="p-2.5 text-center font-medium">Last Used</th>
                <th className="p-2.5 text-center font-medium rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">Loading templates...</td></tr>
              ) : isError ? (
                <tr><td colSpan={11} className="p-8 text-center text-red-500">Failed to load templates. Please try refreshing.</td></tr>
              ) : filteredTemplates.length === 0 ? (
                <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">{hasFilters ? "No templates match filters" : "No templates created yet. Create one to get started."}</td></tr>
              ) : filteredTemplates.map(tmpl => {
                const tc = typeConfig[tmpl.type] || typeConfig.general;
                const cc = channelConfig[tmpl.channel] || channelConfig.email;
                const pc = priorityConfig[tmpl.priority || "medium"] || priorityConfig.medium;
                return (
                  <tr key={tmpl.id} className={`border-b hover:bg-muted/50 transition-colors ${!tmpl.isActive ? "opacity-60" : ""}`} data-testid={`row-template-${tmpl.id}`}>
                    <td className="p-2.5">
                      <div className="font-medium text-sm">{tmpl.name}</div>
                      {tmpl.description && <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[200px]">{tmpl.description}</div>}
                    </td>
                    <td className="p-2.5 text-center"><Badge className={`${tc.color} text-[10px]`}>{tc.label}</Badge></td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <cc.icon className="h-3.5 w-3.5" />
                        <span className="text-xs">{cc.label}</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-xs">{tmpl.module || "—"}</td>
                    <td className="p-2.5 text-center"><Badge className={`${pc.color} text-[10px]`}>{pc.label}</Badge></td>
                    <td className="p-2.5 text-xs truncate max-w-[150px]">{tmpl.subject || "—"}</td>
                    <td className="p-2.5 text-xs">
                      {tmpl.variables ? (
                        <div className="flex flex-wrap gap-0.5">{tmpl.variables.split(",").slice(0, 3).map((v, i) => (
                          <span key={i} className="inline-block px-1 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 text-[9px] rounded font-mono">{`{{${v.trim()}}}`}</span>
                        ))}{tmpl.variables.split(",").length > 3 && <span className="text-[9px] text-muted-foreground">+{tmpl.variables.split(",").length - 3}</span>}</div>
                      ) : "—"}
                    </td>
                    <td className="p-2.5 text-center font-mono text-xs">{tmpl.usageCount || 0}</td>
                    <td className="p-2.5 text-center">
                      <Badge className={tmpl.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px]" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px]"}>
                        {tmpl.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-2.5 text-center text-xs text-muted-foreground">{tmpl.lastUsedAt ? new Date(tmpl.lastUsedAt).toLocaleDateString() : "Never"}</td>
                    <td className="p-2.5">
                      <div className="flex items-center justify-center gap-0.5">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setPreviewTemplate(tmpl)} title="Preview" data-testid={`button-preview-${tmpl.id}`}><Eye className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingTemplate(tmpl); setShowEditor(true); }} title="Edit" data-testid={`button-edit-${tmpl.id}`}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => duplicateMutation.mutate(tmpl.id)} title="Duplicate" data-testid={`button-duplicate-${tmpl.id}`}><Copy className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleMutation.mutate({ id: tmpl.id, isActive: tmpl.isActive })} title={tmpl.isActive ? "Deactivate" : "Activate"} data-testid={`button-toggle-${tmpl.id}`}>
                          {tmpl.isActive ? <ToggleRight className="h-3.5 w-3.5 text-green-600" /> : <ToggleLeft className="h-3.5 w-3.5 text-gray-400" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => { if (confirm("Delete this template?")) deleteMutation.mutate(tmpl.id); }} title="Delete" data-testid={`button-delete-${tmpl.id}`}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredTemplates.length > 0 && (
            <div className="p-2 border-t text-xs text-muted-foreground flex justify-between">
              <span>Showing {filteredTemplates.length} of {allTemplates.length} templates</span>
              <span>Active: {filteredTemplates.filter(t => t.isActive).length} | Email: {filteredTemplates.filter(t => t.channel === "email").length} | SMS: {filteredTemplates.filter(t => t.channel === "sms").length}</span>
            </div>
          )}
        </div>
      )}

      {activeTab === "dispatches" && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#1D4ED8] to-[#F59E0B] text-white">
                <th className="p-2.5 text-left font-medium rounded-tl-lg">Date & Time</th>
                <th className="p-2.5 text-left font-medium">Channel</th>
                <th className="p-2.5 text-left font-medium">Recipient</th>
                <th className="p-2.5 text-left font-medium">Subject</th>
                <th className="p-2.5 text-left font-medium">Template</th>
                <th className="p-2.5 text-center font-medium">Status</th>
                <th className="p-2.5 text-left font-medium">Error</th>
                <th className="p-2.5 text-center font-medium rounded-tr-lg">Sent At</th>
              </tr>
            </thead>
            <tbody>
              {dispatchesLoading ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading dispatch history...</td></tr>
              ) : dispatchesError ? (
                <tr><td colSpan={8} className="p-8 text-center text-red-500">Failed to load dispatch history. Please try refreshing.</td></tr>
              ) : filteredDispatches.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No dispatch records found</td></tr>
              ) : filteredDispatches.map(d => {
                const cc = channelConfig[d.channel] || channelConfig.email;
                const linkedTemplate = allTemplates.find(t => t.id === d.templateId);
                return (
                  <tr key={d.id} className="border-b hover:bg-muted/50" data-testid={`row-dispatch-${d.id}`}>
                    <td className="p-2.5 text-xs">{new Date(d.createdAt).toLocaleString()}</td>
                    <td className="p-2.5"><div className="flex items-center gap-1"><cc.icon className="h-3.5 w-3.5" /><span className="text-xs">{cc.label}</span></div></td>
                    <td className="p-2.5 text-xs font-mono">{d.recipient}</td>
                    <td className="p-2.5 text-xs truncate max-w-[150px]">{d.subject || "—"}</td>
                    <td className="p-2.5 text-xs">{linkedTemplate?.name || (d.templateId ? `#${d.templateId}` : "Manual")}</td>
                    <td className="p-2.5 text-center">
                      <Badge className={d.status === "sent" ? "bg-green-100 text-green-800 text-[10px]" : d.status === "failed" ? "bg-red-100 text-red-800 text-[10px]" : "bg-yellow-100 text-yellow-800 text-[10px]"}>
                        {d.status === "sent" ? "Delivered" : d.status === "failed" ? "Failed" : "Pending"}
                      </Badge>
                    </td>
                    <td className="p-2.5 text-xs text-red-500 truncate max-w-[150px]">{d.errorMessage || "—"}</td>
                    <td className="p-2.5 text-center text-xs text-muted-foreground">{d.sentAt ? new Date(d.sentAt).toLocaleString() : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredDispatches.length > 0 && (
            <div className="p-2 border-t text-xs text-muted-foreground">
              Total: {filteredDispatches.length} dispatches | Delivered: {filteredDispatches.filter(d => d.status === "sent").length} | Failed: {filteredDispatches.filter(d => d.status === "failed").length}
            </div>
          )}
        </div>
      )}

      {activeTab === "variables" && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Code className="h-4 w-4 text-[#1D4ED8]" /> Dynamic Variables</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">Use these placeholders in your templates. They will be automatically replaced with actual values when notifications are sent.</p>
              <div className="space-y-2">
                {dynamicVars.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-muted/50" data-testid={`row-var-${i}`}>
                    <code className="text-xs font-mono bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">{v.var}</code>
                    <span className="text-xs text-muted-foreground">{v.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4 text-[#F59E0B]" /> Usage Guide</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <div>
                  <div className="font-medium text-foreground mb-1">Email Templates</div>
                  <p>Include variables in both subject and body. Use HTML for rich formatting. Email templates support full variable substitution.</p>
                </div>
                <div>
                  <div className="font-medium text-foreground mb-1">SMS Templates</div>
                  <p>Keep messages under 160 characters for single segment delivery. Variables count toward character limit after substitution.</p>
                </div>
                <div>
                  <div className="font-medium text-foreground mb-1">In-App Notifications</div>
                  <p>Displayed in the notification bell dropdown. Keep messages concise — 1-2 sentences recommended.</p>
                </div>
                <div>
                  <div className="font-medium text-foreground mb-1">Push Notifications</div>
                  <p>Title should be under 50 characters. Body should be under 100 characters for best display across devices.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-purple-600" /> Template Best Practices</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" /><span>Always test templates before activating them in production</span></div>
                <div className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" /><span>Use priority levels to control notification urgency</span></div>
                <div className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" /><span>Group templates by module for easier management</span></div>
                <div className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" /><span>Include fallback text for variables that might be empty</span></div>
                <div className="flex items-start gap-2"><AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" /><span>Avoid sending critical alerts through SMS alone — use multi-channel</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {showEditor && <TemplateEditor template={editingTemplate}
        onSave={(data: any) => editingTemplate ? updateMutation.mutate({ id: editingTemplate.id, data }) : createMutation.mutate(data)}
        onClose={() => { setShowEditor(false); setEditingTemplate(null); }}
        isPending={createMutation.isPending || updateMutation.isPending} />}

      {previewTemplate && <TemplatePreview template={previewTemplate} onClose={() => setPreviewTemplate(null)} />}
    </div>
  );
}

function TemplateEditor({ template, onSave, onClose, isPending }: {
  template: NotificationTemplate | null; onSave: (data: any) => void; onClose: () => void; isPending: boolean;
}) {
  const [name, setName] = useState(template?.name || "");
  const [type, setType] = useState(template?.type || "general");
  const [channel, setChannel] = useState(template?.channel || "email");
  const [subject, setSubject] = useState(template?.subject || "");
  const [body, setBody] = useState(template?.body || "");
  const [variables, setVariables] = useState(template?.variables || "");
  const [isActive, setIsActive] = useState(template?.isActive ?? true);
  const [module, setModule] = useState(template?.module || "");
  const [priority, setPriority] = useState(template?.priority || "medium");
  const [description, setDescription] = useState(template?.description || "");
  const [showPreview, setShowPreview] = useState(false);

  const previewBody = useMemo(() => {
    let text = body;
    const sampleValues: Record<string, string> = {
      "Customer_Name": "Ahmed Khan", "Invoice_Number": "INV-2025-001", "Amount": "PKR 5,000",
      "Due_Date": "2025-03-15", "Product_Name": "Standard Home Package", "Ticket_ID": "TKT-042",
      "Asset_Tag": "AST-NET-001", "Company_Name": "NetSphere", "User_Name": "Admin", "Date": new Date().toLocaleDateString(),
    };
    Object.entries(sampleValues).forEach(([key, val]) => {
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val);
    });
    return text;
  }, [body]);

  const insertVariable = (varName: string) => {
    setBody(prev => prev + varName);
    const current = variables.split(",").map(v => v.trim()).filter(Boolean);
    const cleanVar = varName.replace(/\{\{|\}\}/g, "");
    if (!current.includes(cleanVar)) {
      setVariables(current.length > 0 ? `${variables}, ${cleanVar}` : cleanVar);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{template ? "Edit Template" : "Create Template"}</DialogTitle></DialogHeader>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="details">Details & Settings</TabsTrigger>
            <TabsTrigger value="content">Content Editor</TabsTrigger>
            <TabsTrigger value="preview">Live Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Template Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Payment Overdue Reminder" data-testid="input-tmpl-name" /></div>
              <div><Label>Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of when this template is used" data-testid="input-tmpl-desc" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Type *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger data-testid="select-tmpl-type"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Channel *</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger data-testid="select-tmpl-channel"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(channelConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger data-testid="select-tmpl-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Module</Label>
                <Select value={module} onValueChange={setModule}>
                  <SelectTrigger data-testid="select-tmpl-module"><SelectValue placeholder="Select module" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {moduleOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-tmpl-active" />
                <Label className="text-sm">{isActive ? "Active" : "Inactive"}</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4 mt-4">
            <Card className="bg-amber-50/50 dark:bg-amber-950/10 border-amber-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-1 text-xs font-medium mb-2"><Zap className="h-3.5 w-3.5 text-amber-600" /> Quick Insert Variables</div>
                <div className="flex flex-wrap gap-1">
                  {dynamicVars.map((v, i) => (
                    <button key={i} onClick={() => insertVariable(v.var)} className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-amber-200 rounded text-[10px] font-mono text-amber-700 hover:bg-amber-100 transition-colors" data-testid={`button-insert-var-${i}`}>
                      {v.var}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {(channel === "email") && (
              <div><Label>Email Subject</Label><Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. [NetSphere] Payment Reminder — {{Invoice_Number}}" data-testid="input-tmpl-subject" /></div>
            )}

            <div>
              <Label>Message Body *</Label>
              <Textarea value={body} onChange={e => setBody(e.target.value)} rows={channel === "sms" ? 4 : 8}
                placeholder={channel === "email" ? "Dear {{Customer_Name}},\n\nThis is a reminder that your invoice {{Invoice_Number}} for {{Amount}} is due on {{Due_Date}}.\n\nPlease make your payment at your earliest convenience.\n\nBest regards,\n{{Company_Name}}" : channel === "sms" ? "[NetSphere] Dear {{Customer_Name}}, your invoice {{Invoice_Number}} for {{Amount}} is due on {{Due_Date}}. Pay now to avoid service interruption." : "Your invoice {{Invoice_Number}} for {{Amount}} is due on {{Due_Date}}. Please make payment soon."}
                className="font-mono text-xs" data-testid="input-tmpl-body" />
              {channel === "sms" && <p className="text-[10px] text-muted-foreground mt-1">{body.length}/160 characters (single segment)</p>}
            </div>

            <div><Label>Variables Used (comma-separated)</Label><Input value={variables} onChange={e => setVariables(e.target.value)} placeholder="Customer_Name, Invoice_Number, Amount" className="font-mono text-xs" data-testid="input-tmpl-vars" /></div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="space-y-4">
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {channelConfig[channel] && (() => { const C = channelConfig[channel]; return <><C.icon className="h-4 w-4" /> <span className="text-sm font-medium">{C.label} Preview</span></>; })()}
                    <Badge className={`${typeConfig[type]?.color || ""} text-[10px] ml-auto`}>{typeConfig[type]?.label || type}</Badge>
                  </div>
                  {channel === "email" && subject && (
                    <div className="mb-2 p-2 bg-white dark:bg-gray-900 rounded border">
                      <div className="text-[10px] text-muted-foreground">Subject</div>
                      <div className="text-sm font-medium">{subject.replace(/\{\{(\w+)\}\}/g, (_, key) => {
                        const samples: Record<string, string> = { Customer_Name: "Ahmed Khan", Invoice_Number: "INV-2025-001", Amount: "PKR 5,000", Due_Date: "2025-03-15", Product_Name: "Standard Home" };
                        return samples[key] || `{{${key}}}`;
                      })}</div>
                    </div>
                  )}
                  <div className={`p-3 rounded border ${channel === "sms" ? "bg-green-50 dark:bg-green-950/10" : "bg-white dark:bg-gray-900"}`}>
                    {channel === "sms" && <div className="text-[10px] text-muted-foreground mb-1">SMS Message</div>}
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{previewBody || <span className="text-muted-foreground italic">Enter body content to see preview...</span>}</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50/30 dark:bg-blue-950/10 border-blue-200">
                <CardContent className="p-3 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 inline mr-1 text-blue-500" />
                  This is a sample preview. Dynamic variables are replaced with sample data. Actual values will differ when the notification is sent.
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({
            name, type, channel, subject: subject || null, body,
            variables: variables || null, isActive,
            module: module && module !== "none" ? module : null,
            priority, description: description || null,
          })} disabled={!name || !body || isPending}
            className="bg-gradient-to-r from-[#1D4ED8] to-[#F59E0B] text-white" data-testid="button-save-template">
            {isPending ? "Saving..." : template ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplatePreview({ template, onClose }: { template: NotificationTemplate; onClose: () => void }) {
  const tc = typeConfig[template.type] || typeConfig.general;
  const cc = channelConfig[template.channel] || channelConfig.email;
  const pc = priorityConfig[template.priority || "medium"] || priorityConfig.medium;

  const sampleBody = useMemo(() => {
    let text = template.body;
    const samples: Record<string, string> = {
      "Customer_Name": "Ahmed Khan", "Invoice_Number": "INV-2025-001", "Amount": "PKR 5,000",
      "Due_Date": "2025-03-15", "Product_Name": "Standard Home Package", "Ticket_ID": "TKT-042",
      "Asset_Tag": "AST-NET-001", "Company_Name": "NetSphere", "User_Name": "Admin", "Date": new Date().toLocaleDateString(),
    };
    Object.entries(samples).forEach(([key, val]) => { text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val); });
    return text;
  }, [template.body]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> {template.name}</DialogTitle></DialogHeader>

        <div className="space-y-4">
          {template.description && <p className="text-sm text-muted-foreground">{template.description}</p>}

          <div className="grid grid-cols-5 gap-2">
            <div className="p-2 bg-muted/50 rounded"><div className="text-[10px] text-muted-foreground">Type</div><Badge className={`${tc.color} text-xs mt-0.5`}>{tc.label}</Badge></div>
            <div className="p-2 bg-muted/50 rounded"><div className="text-[10px] text-muted-foreground">Channel</div><div className="flex items-center gap-1 mt-0.5"><cc.icon className="h-3.5 w-3.5" /><span className="text-xs">{cc.label}</span></div></div>
            <div className="p-2 bg-muted/50 rounded"><div className="text-[10px] text-muted-foreground">Priority</div><Badge className={`${pc.color} text-xs mt-0.5`}>{pc.label}</Badge></div>
            <div className="p-2 bg-muted/50 rounded"><div className="text-[10px] text-muted-foreground">Module</div><div className="text-sm mt-0.5">{template.module || "—"}</div></div>
            <div className="p-2 bg-muted/50 rounded"><div className="text-[10px] text-muted-foreground">Status</div>
              <Badge className={`text-xs mt-0.5 ${template.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{template.isActive ? "Active" : "Inactive"}</Badge>
            </div>
          </div>

          {template.variables && (
            <div>
              <div className="text-xs font-medium mb-2">Dynamic Variables</div>
              <div className="flex flex-wrap gap-1">
                {template.variables.split(",").map((v, i) => (
                  <code key={i} className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 text-[10px] rounded font-mono">{`{{${v.trim()}}}`}</code>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="p-2 bg-muted/50 rounded text-center"><div className="text-[10px] text-muted-foreground">Usage Count</div><div className="text-lg font-bold">{template.usageCount || 0}</div></div>
            <div className="p-2 bg-muted/50 rounded text-center"><div className="text-[10px] text-muted-foreground">Last Used</div><div className="text-sm">{template.lastUsedAt ? new Date(template.lastUsedAt).toLocaleDateString() : "Never"}</div></div>
            <div className="p-2 bg-muted/50 rounded text-center"><div className="text-[10px] text-muted-foreground">Created</div><div className="text-sm">{template.createdAt ? new Date(template.createdAt).toLocaleDateString() : "—"}</div></div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#1D4ED8] to-[#F59E0B] text-white px-3 py-2 flex items-center gap-2">
              <cc.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{cc.label} Message Preview</span>
              <span className="text-[10px] opacity-70 ml-auto">Sample data shown</span>
            </div>
            <div className="p-4 bg-white dark:bg-gray-950">
              {template.channel === "email" && template.subject && (
                <div className="mb-3 pb-3 border-b">
                  <div className="text-[10px] text-muted-foreground">Subject</div>
                  <div className="text-sm font-medium">{template.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => {
                    const s: Record<string, string> = { Customer_Name: "Ahmed Khan", Invoice_Number: "INV-2025-001", Amount: "PKR 5,000", Due_Date: "2025-03-15" };
                    return s[key] || `{{${key}}}`;
                  })}</div>
                </div>
              )}
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{sampleBody}</div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-900 px-3 py-2 text-xs font-medium flex items-center gap-2"><Code className="h-3.5 w-3.5" /> Raw Template</div>
            <div className="p-3 bg-gray-50 dark:bg-gray-950">
              {template.subject && <div className="text-xs mb-2"><span className="text-muted-foreground">Subject: </span><code className="font-mono">{template.subject}</code></div>}
              <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">{template.body}</pre>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-close-preview">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}