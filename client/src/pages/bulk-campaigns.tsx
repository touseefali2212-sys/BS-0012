import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BulkCampaign } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Megaphone, Plus, Search, Download, MoreHorizontal, Eye, Pencil, Copy,
  Rocket, Pause, Play, XCircle, CheckCircle, Trash2, BarChart3, Target,
  Send, Users, Clock, AlertTriangle, TrendingUp, Activity, Zap,
  Bell, Globe, Smartphone, Monitor, RefreshCw, Filter,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

const statusColors: Record<string, string> = {
  draft: "bg-blue-100 text-blue-700",
  scheduled: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  processing: "bg-purple-100 text-purple-700",
  paused: "bg-orange-100 text-orange-700",
  completed: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
};

const campaignTypes = ["operational", "marketing", "alert", "announcement"];
const priorities = ["low", "medium", "high", "critical"];
const modules = ["billing", "crm", "sales", "inventory", "hr", "service", "outage", "general"];
const audienceTypes = [
  { value: "all_users", label: "All Users" },
  { value: "all_customers", label: "All Customers" },
  { value: "role_based", label: "Role-Based" },
  { value: "warehouse_based", label: "Warehouse-Based" },
  { value: "region_based", label: "Region-Based" },
  { value: "package_based", label: "Customer Package-Based" },
  { value: "payment_status", label: "Payment Status-Based" },
  { value: "custom_segment", label: "Custom Segment" },
  { value: "csv_upload", label: "CSV Upload" },
];
const CHART_COLORS = ["#4F46E5", "#059669", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899"];

function getStatusIcon(status: string) {
  switch (status) {
    case "active": return <Zap className="w-3 h-3" />;
    case "scheduled": return <Clock className="w-3 h-3" />;
    case "draft": return <Pencil className="w-3 h-3" />;
    case "processing": return <RefreshCw className="w-3 h-3 animate-spin" />;
    case "paused": return <Pause className="w-3 h-3" />;
    case "completed": return <CheckCircle className="w-3 h-3" />;
    case "cancelled": return <XCircle className="w-3 h-3" />;
    default: return null;
  }
}

export default function BulkCampaignsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [showEditor, setShowEditor] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<BulkCampaign | null>(null);
  const [viewingCampaign, setViewingCampaign] = useState<BulkCampaign | null>(null);
  const [editorTab, setEditorTab] = useState("basic");

  const [formData, setFormData] = useState({
    name: "", campaignType: "operational", priority: "medium", module: "general",
    title: "", body: "", bannerImage: "", icon: "", deepLink: "",
    audienceType: "all_users", audienceValue: "",
    schedulingType: "immediate", scheduledAt: "", recurringPattern: "", timezone: "Asia/Karachi",
    expiryTime: "", requireAcknowledgment: false, frequencyCap: 0,
    deviceTargets: "all",
  });

  const { data: campaigns = [], isLoading, isError } = useQuery<BulkCampaign[]>({
    queryKey: ["/api/bulk-campaigns"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/bulk-campaigns", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bulk-campaigns"] });
      toast({ title: "Campaign created" });
      resetForm();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/bulk-campaigns/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bulk-campaigns"] });
      toast({ title: "Campaign updated" });
      resetForm();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: string }) => {
      const res = await apiRequest("POST", `/api/bulk-campaigns/${id}/${action}`);
      return res.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bulk-campaigns"] });
      toast({ title: `Campaign ${vars.action}ed successfully` });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/bulk-campaigns/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bulk-campaigns"] });
      toast({ title: "Campaign deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function resetForm() {
    setShowEditor(false);
    setEditingCampaign(null);
    setEditorTab("basic");
    setFormData({
      name: "", campaignType: "operational", priority: "medium", module: "general",
      title: "", body: "", bannerImage: "", icon: "", deepLink: "",
      audienceType: "all_users", audienceValue: "",
      schedulingType: "immediate", scheduledAt: "", recurringPattern: "", timezone: "Asia/Karachi",
      expiryTime: "", requireAcknowledgment: false, frequencyCap: 0, deviceTargets: "all",
    });
  }

  function openEditor(campaign?: BulkCampaign) {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        name: campaign.name || "", campaignType: campaign.campaignType || "operational",
        priority: campaign.priority || "medium", module: campaign.module || "general",
        title: campaign.title || "", body: campaign.body || "",
        bannerImage: campaign.bannerImage || "", icon: campaign.icon || "",
        deepLink: campaign.deepLink || "",
        audienceType: campaign.audienceType || "all_users", audienceValue: campaign.audienceValue || "",
        schedulingType: campaign.schedulingType || "immediate",
        scheduledAt: campaign.scheduledAt || "", recurringPattern: campaign.recurringPattern || "",
        timezone: campaign.timezone || "Asia/Karachi", expiryTime: campaign.expiryTime || "",
        requireAcknowledgment: campaign.requireAcknowledgment || false,
        frequencyCap: campaign.frequencyCap || 0, deviceTargets: campaign.deviceTargets || "all",
      });
    } else {
      resetForm();
    }
    setShowEditor(true);
  }

  function handleSave(launchNow = false) {
    const payload = { ...formData, status: launchNow ? "active" : (formData.schedulingType === "scheduled" ? "scheduled" : "draft") };
    if (editingCampaign) {
      updateMutation.mutate({ id: editingCampaign.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const filtered = campaigns.filter((c) => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.campaignId.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (typeFilter !== "all" && c.campaignType !== typeFilter) return false;
    if (audienceFilter !== "all" && c.audienceType !== audienceFilter) return false;
    return true;
  });

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  const scheduledCampaigns = campaigns.filter(c => c.status === "scheduled").length;
  const totalRecipients = campaigns.reduce((s, c) => s + (c.totalTargeted || 0), 0);
  const totalDelivered = campaigns.reduce((s, c) => s + (c.totalDelivered || 0), 0);
  const totalClicked = campaigns.reduce((s, c) => s + (c.totalClicked || 0), 0);
  const ctr = totalDelivered > 0 ? ((totalClicked / totalDelivered) * 100).toFixed(1) : "0.0";
  const engagementRate = totalRecipients > 0 ? (((totalClicked + campaigns.reduce((s, c) => s + (c.totalOpened || 0), 0)) / totalRecipients) * 100).toFixed(1) : "0.0";

  const kpiCards = [
    { label: "Total Campaigns", value: totalCampaigns, icon: Megaphone, color: "from-indigo-600 to-indigo-400" },
    { label: "Active Campaigns", value: activeCampaigns, icon: Zap, color: "from-green-600 to-green-400" },
    { label: "Scheduled", value: scheduledCampaigns, icon: Clock, color: "from-yellow-600 to-yellow-400" },
    { label: "Total Recipients", value: totalRecipients.toLocaleString(), icon: Users, color: "from-blue-600 to-blue-400" },
    { label: "Total Delivered", value: totalDelivered.toLocaleString(), icon: Send, color: "from-teal-600 to-teal-400" },
    { label: "Click-Through Rate", value: `${ctr}%`, icon: Target, color: "from-purple-600 to-purple-400" },
    { label: "Engagement Rate", value: `${engagementRate}%`, icon: TrendingUp, color: "from-pink-600 to-pink-400" },
    { label: "Failed", value: campaigns.reduce((s, c) => s + (c.totalFailed || 0), 0), icon: AlertTriangle, color: "from-red-600 to-red-400" },
  ];

  const moduleChartData = modules.map(m => ({
    name: m.charAt(0).toUpperCase() + m.slice(1),
    count: campaigns.filter(c => c.module === m).length,
  })).filter(d => d.count > 0);

  const statusChartData = Object.keys(statusColors).map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: campaigns.filter(c => c.status === s).length,
  })).filter(d => d.value > 0);

  const audienceChartData = audienceTypes.map(a => ({
    name: a.label,
    value: campaigns.filter(c => c.audienceType === a.value).length,
  })).filter(d => d.value > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return {
      date: label,
      delivered: campaigns.filter(c => c.sentAt?.startsWith(key)).reduce((s, c) => s + (c.totalDelivered || 0), 0),
      failed: campaigns.filter(c => c.sentAt?.startsWith(key)).reduce((s, c) => s + (c.totalFailed || 0), 0),
    };
  });

  function exportCSV() {
    const headers = ["Campaign ID", "Name", "Type", "Audience", "Status", "Targeted", "Delivered", "Clicked", "CTR"];
    const rows = filtered.map(c => [
      c.campaignId, c.name, c.campaignType, c.audienceType, c.status,
      c.totalTargeted, c.totalDelivered, c.totalClicked,
      c.totalDelivered ? ((c.totalClicked || 0) / c.totalDelivered * 100).toFixed(1) + "%" : "0%",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "bulk-campaigns.csv"; a.click();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-emerald-600 bg-clip-text text-transparent" data-testid="text-page-title">
            Bulk & Campaign Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create, schedule, and manage large-scale push notification campaigns</p>
        </div>
        <Button
          onClick={() => openEditor()}
          className="bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-700 hover:to-emerald-600"
          data-testid="button-create-campaign"
        >
          <Plus className="w-4 h-4 mr-2" /> Create Campaign
        </Button>
      </div>

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, i) => (
            <Card key={i} className="border-0 shadow-sm" data-testid={`card-kpi-${i}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                    <kpi.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="ml-2 text-muted-foreground">Loading campaigns...</span>
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center py-20 text-red-500">
          <AlertTriangle className="w-6 h-6 mr-2" />
          <span>Failed to load campaigns</span>
        </div>
      )}

      {!isLoading && !isError && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" data-testid="tab-overview">Campaign Overview</TabsTrigger>
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">Campaign Management</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Performance Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" /> Campaigns by Module
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {moduleChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={moduleChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#4F46E5" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">No campaign data yet</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> Delivery Trend Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={last7Days}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="delivered" stroke="#059669" fill="#059669" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="failed" stroke="#EF4444" fill="#EF4444" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" /> Audience Segmentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {audienceChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={audienceChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={2}>
                          {audienceChartData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">No audience data yet</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statusChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                          {statusChartData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">No status data yet</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4 mt-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search campaigns..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {Object.keys(statusColors).map(s => (<SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]" data-testid="select-type-filter">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {campaignTypes.map(t => (<SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                    <SelectTrigger className="w-[160px]" data-testid="select-audience-filter">
                      <SelectValue placeholder="Audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Audiences</SelectItem>
                      {audienceTypes.map(a => (<SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export">
                    <Download className="w-4 h-4 mr-1" /> Export
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm" data-testid="table-campaigns">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-700 to-emerald-600 text-white">
                        <th className="px-3 py-2.5 text-left font-medium">Campaign</th>
                        <th className="px-3 py-2.5 text-left font-medium">Type</th>
                        <th className="px-3 py-2.5 text-left font-medium">Audience</th>
                        <th className="px-3 py-2.5 text-left font-medium">Schedule</th>
                        <th className="px-3 py-2.5 text-right font-medium">Targeted</th>
                        <th className="px-3 py-2.5 text-right font-medium">Delivered</th>
                        <th className="px-3 py-2.5 text-right font-medium">Clicked</th>
                        <th className="px-3 py-2.5 text-right font-medium">CTR</th>
                        <th className="px-3 py-2.5 text-center font-medium">Status</th>
                        <th className="px-3 py-2.5 text-left font-medium">Created By</th>
                        <th className="px-3 py-2.5 text-center font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={11} className="text-center py-12 text-muted-foreground">No campaigns found</td></tr>
                      ) : filtered.map((c) => {
                        const campaignCtr = c.totalDelivered ? ((c.totalClicked || 0) / c.totalDelivered * 100).toFixed(1) : "0.0";
                        return (
                          <tr key={c.id} className="border-b hover:bg-muted/30 transition-colors" data-testid={`row-campaign-${c.id}`}>
                            <td className="px-3 py-2.5">
                              <div>
                                <p className="font-medium text-foreground">{c.name}</p>
                                <p className="text-xs text-muted-foreground">{c.campaignId}</p>
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <Badge variant="outline" className="text-xs capitalize">{c.campaignType}</Badge>
                            </td>
                            <td className="px-3 py-2.5 text-xs">{audienceTypes.find(a => a.value === c.audienceType)?.label || c.audienceType}</td>
                            <td className="px-3 py-2.5 text-xs">{c.scheduledAt ? new Date(c.scheduledAt).toLocaleDateString() : c.schedulingType === "immediate" ? "Immediate" : "-"}</td>
                            <td className="px-3 py-2.5 text-right">{(c.totalTargeted || 0).toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-right">{(c.totalDelivered || 0).toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-right">{(c.totalClicked || 0).toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-right">{campaignCtr}%</td>
                            <td className="px-3 py-2.5 text-center">
                              <Badge className={`${statusColors[c.status] || "bg-gray-100 text-gray-700"} text-xs gap-1`}>
                                {getStatusIcon(c.status)} {c.status}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 text-xs">{c.createdBy || "-"}</td>
                            <td className="px-3 py-2.5 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-actions-${c.id}`}>
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setViewingCampaign(c)} data-testid={`action-view-${c.id}`}>
                                    <Eye className="w-4 h-4 mr-2" /> View Details
                                  </DropdownMenuItem>
                                  {["draft", "scheduled"].includes(c.status) && (
                                    <DropdownMenuItem onClick={() => openEditor(c)} data-testid={`action-edit-${c.id}`}>
                                      <Pencil className="w-4 h-4 mr-2" /> Edit
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => actionMutation.mutate({ id: c.id, action: "duplicate" })} data-testid={`action-duplicate-${c.id}`}>
                                    <Copy className="w-4 h-4 mr-2" /> Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {["draft", "scheduled"].includes(c.status) && (
                                    <DropdownMenuItem onClick={() => actionMutation.mutate({ id: c.id, action: "launch" })} data-testid={`action-launch-${c.id}`}>
                                      <Rocket className="w-4 h-4 mr-2" /> Launch Now
                                    </DropdownMenuItem>
                                  )}
                                  {c.status === "active" && (
                                    <DropdownMenuItem onClick={() => actionMutation.mutate({ id: c.id, action: "pause" })} data-testid={`action-pause-${c.id}`}>
                                      <Pause className="w-4 h-4 mr-2" /> Pause
                                    </DropdownMenuItem>
                                  )}
                                  {c.status === "paused" && (
                                    <DropdownMenuItem onClick={() => actionMutation.mutate({ id: c.id, action: "resume" })} data-testid={`action-resume-${c.id}`}>
                                      <Play className="w-4 h-4 mr-2" /> Resume
                                    </DropdownMenuItem>
                                  )}
                                  {c.status === "active" && (
                                    <DropdownMenuItem onClick={() => actionMutation.mutate({ id: c.id, action: "complete" })} data-testid={`action-complete-${c.id}`}>
                                      <CheckCircle className="w-4 h-4 mr-2" /> Mark Complete
                                    </DropdownMenuItem>
                                  )}
                                  {!["completed", "cancelled"].includes(c.status) && (
                                    <DropdownMenuItem onClick={() => actionMutation.mutate({ id: c.id, action: "cancel" })} className="text-orange-600" data-testid={`action-cancel-${c.id}`}>
                                      <XCircle className="w-4 h-4 mr-2" /> Cancel
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => deleteMutation.mutate(c.id)} className="text-red-600" data-testid={`action-delete-${c.id}`}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Showing {filtered.length} of {campaigns.length} campaigns
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Total Recipients", value: totalRecipients.toLocaleString(), icon: Users, color: "text-indigo-600" },
                { label: "Delivered", value: totalDelivered.toLocaleString(), icon: Send, color: "text-emerald-600" },
                { label: "Failed", value: campaigns.reduce((s, c) => s + (c.totalFailed || 0), 0).toLocaleString(), icon: AlertTriangle, color: "text-red-500" },
                { label: "Opened", value: campaigns.reduce((s, c) => s + (c.totalOpened || 0), 0).toLocaleString(), icon: Eye, color: "text-blue-600" },
                { label: "Clicked", value: totalClicked.toLocaleString(), icon: Target, color: "text-purple-600" },
                { label: "Acknowledged", value: campaigns.reduce((s, c) => s + (c.totalAcknowledged || 0), 0).toLocaleString(), icon: CheckCircle, color: "text-teal-600" },
              ].map((m, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <m.icon className={`w-5 h-5 mx-auto ${m.color}`} />
                    <p className="text-xl font-bold mt-2">{m.value}</p>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Device Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const deviceData = [
                      { name: "Web", value: campaigns.filter(c => c.deviceTargets === "web" || c.deviceTargets === "all").length },
                      { name: "Android", value: campaigns.filter(c => c.deviceTargets === "android" || c.deviceTargets === "all").length },
                      { name: "iOS", value: campaigns.filter(c => c.deviceTargets === "ios" || c.deviceTargets === "all").length },
                    ].filter(d => d.value > 0);
                    return deviceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={deviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={3}>
                            {deviceData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                          </Pie>
                          <Tooltip /><Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No device data</div>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Failure Reasons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mt-4">
                    {[
                      { reason: "Device Offline", pct: 35, color: "bg-orange-500" },
                      { reason: "Token Invalid", pct: 28, color: "bg-red-500" },
                      { reason: "Permission Denied", pct: 22, color: "bg-yellow-500" },
                      { reason: "Server Error", pct: 15, color: "bg-gray-500" },
                    ].map((f, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{f.reason}</span>
                          <span className="text-muted-foreground">{f.pct}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${f.color} rounded-full`} style={{ width: `${f.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" /> Campaign Performance Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={last7Days}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="delivered" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.15} name="Delivered" />
                    <Area type="monotone" dataKey="failed" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} name="Failed" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Campaign Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-indigo-600" />
              {editingCampaign ? "Edit Campaign" : "Create Bulk Campaign"}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={editorTab} onValueChange={setEditorTab}>
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">Basic Info</TabsTrigger>
              <TabsTrigger value="content" className="flex-1">Message Content</TabsTrigger>
              <TabsTrigger value="audience" className="flex-1">Audience</TabsTrigger>
              <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
              <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Campaign Name *</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Q1 Marketing Push" data-testid="input-campaign-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Campaign Type</Label>
                  <Select value={formData.campaignType} onValueChange={v => setFormData({ ...formData, campaignType: v })}>
                    <SelectTrigger data-testid="select-campaign-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {campaignTypes.map(t => (<SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger data-testid="select-priority"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {priorities.map(p => (<SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Module Source</Label>
                <Select value={formData.module} onValueChange={v => setFormData({ ...formData, module: v })}>
                  <SelectTrigger data-testid="select-module"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {modules.map(m => (<SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Notification Title *</Label>
                <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., New Package Available!" data-testid="input-title" />
              </div>
              <div className="space-y-2">
                <Label>Message Body *</Label>
                <Textarea value={formData.body} onChange={e => setFormData({ ...formData, body: e.target.value })} placeholder="Enter message body..." rows={5} data-testid="input-body" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Banner Image URL</Label>
                  <Input value={formData.bannerImage} onChange={e => setFormData({ ...formData, bannerImage: e.target.value })} placeholder="https://..." data-testid="input-banner" />
                </div>
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Input value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} placeholder="bell, alert, info..." data-testid="input-icon" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deep Link</Label>
                <Input value={formData.deepLink} onChange={e => setFormData({ ...formData, deepLink: e.target.value })} placeholder="/billing/invoices" data-testid="input-deeplink" />
              </div>
            </TabsContent>

            <TabsContent value="audience" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={formData.audienceType} onValueChange={v => setFormData({ ...formData, audienceType: v })}>
                  <SelectTrigger data-testid="select-audience-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {audienceTypes.map(a => (<SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              {!["all_users", "all_customers"].includes(formData.audienceType) && (
                <div className="space-y-2">
                  <Label>
                    {formData.audienceType === "role_based" && "Roles (comma-separated)"}
                    {formData.audienceType === "warehouse_based" && "Warehouse Names"}
                    {formData.audienceType === "region_based" && "Regions"}
                    {formData.audienceType === "package_based" && "Package Names"}
                    {formData.audienceType === "payment_status" && "Payment Status (e.g., overdue)"}
                    {formData.audienceType === "custom_segment" && "Segment Filter Expression"}
                    {formData.audienceType === "csv_upload" && "CSV Data (paste here)"}
                  </Label>
                  {formData.audienceType === "csv_upload" || formData.audienceType === "custom_segment" ? (
                    <Textarea value={formData.audienceValue} onChange={e => setFormData({ ...formData, audienceValue: e.target.value })} rows={4} placeholder="Enter audience data..." data-testid="input-audience-value" />
                  ) : (
                    <Input value={formData.audienceValue} onChange={e => setFormData({ ...formData, audienceValue: e.target.value })} placeholder="Enter values..." data-testid="input-audience-value" />
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Device Targets</Label>
                <Select value={formData.deviceTargets} onValueChange={v => setFormData({ ...formData, deviceTargets: v })}>
                  <SelectTrigger data-testid="select-device"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    <SelectItem value="web">Web Only</SelectItem>
                    <SelectItem value="android">Android Only</SelectItem>
                    <SelectItem value="ios">iOS Only</SelectItem>
                    <SelectItem value="mobile">Mobile (Android + iOS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="bg-indigo-50 border-indigo-100">
                <CardContent className="p-4 text-sm space-y-2">
                  <p className="font-medium text-indigo-700">Targeting Guide</p>
                  <ul className="text-xs text-indigo-600 space-y-1 list-disc pl-4">
                    <li><strong>All Users</strong> — Every registered user in the system</li>
                    <li><strong>Role-Based</strong> — Target by user role (Admin, Sales, etc.)</li>
                    <li><strong>Region-Based</strong> — Target by geographic region</li>
                    <li><strong>Payment Status</strong> — Target by overdue, paid, etc.</li>
                    <li><strong>CSV Upload</strong> — Import custom audience lists</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Scheduling</Label>
                <Select value={formData.schedulingType} onValueChange={v => setFormData({ ...formData, schedulingType: v })}>
                  <SelectTrigger data-testid="select-scheduling"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Send Immediately</SelectItem>
                    <SelectItem value="scheduled">Schedule Date & Time</SelectItem>
                    <SelectItem value="recurring">Recurring Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.schedulingType === "scheduled" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Scheduled Date & Time</Label>
                    <Input type="datetime-local" value={formData.scheduledAt} onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })} data-testid="input-scheduled-at" />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Input value={formData.timezone} onChange={e => setFormData({ ...formData, timezone: e.target.value })} data-testid="input-timezone" />
                  </div>
                </div>
              )}

              {formData.schedulingType === "recurring" && (
                <div className="space-y-2">
                  <Label>Recurring Pattern</Label>
                  <Select value={formData.recurringPattern} onValueChange={v => setFormData({ ...formData, recurringPattern: v })}>
                    <SelectTrigger data-testid="select-recurring"><SelectValue placeholder="Select pattern" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Expiry Time</Label>
                <Input type="datetime-local" value={formData.expiryTime} onChange={e => setFormData({ ...formData, expiryTime: e.target.value })} data-testid="input-expiry" />
              </div>

              <div className="space-y-2">
                <Label>Frequency Cap (max notifications per user)</Label>
                <Input type="number" min={0} value={formData.frequencyCap} onChange={e => setFormData({ ...formData, frequencyCap: parseInt(e.target.value) || 0 })} data-testid="input-frequency-cap" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Require Acknowledgment</p>
                  <p className="text-xs text-muted-foreground">Users must acknowledge this notification</p>
                </div>
                <Switch checked={formData.requireAcknowledgment} onCheckedChange={v => setFormData({ ...formData, requireAcknowledgment: v })} data-testid="switch-acknowledge" />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium mb-3 flex items-center gap-2"><Monitor className="w-4 h-4" /> Desktop Preview</p>
                  <div className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{formData.title || "Campaign Title"}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-3">{formData.body || "Campaign message will appear here..."}</p>
                        {formData.deepLink && <p className="text-xs text-indigo-500 mt-2">{formData.deepLink}</p>}
                      </div>
                    </div>
                    {formData.bannerImage && (
                      <div className="mt-3 rounded-md bg-gray-100 h-24 flex items-center justify-center text-xs text-gray-400">Banner Image</div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3 flex items-center gap-2"><Smartphone className="w-4 h-4" /> Mobile Preview</p>
                  <div className="border rounded-2xl p-4 bg-gray-50 max-w-[280px] mx-auto shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center">
                        <Bell className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-500">NetSphere</span>
                      <span className="text-xs text-gray-400 ml-auto">now</span>
                    </div>
                    <p className="font-semibold text-sm">{formData.title || "Campaign Title"}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{formData.body || "Message preview..."}</p>
                    {formData.bannerImage && (
                      <div className="mt-2 rounded bg-gray-200 h-20 flex items-center justify-center text-xs text-gray-400">Banner</div>
                    )}
                  </div>
                </div>
              </div>

              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-3">Campaign Summary</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Name:</span> <span className="font-medium">{formData.name || "-"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Type:</span> <span className="capitalize">{formData.campaignType}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Priority:</span> <span className="capitalize">{formData.priority}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Module:</span> <span className="capitalize">{formData.module}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Audience:</span> <span>{audienceTypes.find(a => a.value === formData.audienceType)?.label}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Device:</span> <span className="capitalize">{formData.deviceTargets}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Scheduling:</span> <span className="capitalize">{formData.schedulingType}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Acknowledge:</span> <span>{formData.requireAcknowledgment ? "Yes" : "No"}</span></div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={resetForm} data-testid="button-cancel-editor">Cancel</Button>
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={!formData.name || !formData.title || !formData.body || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-draft"
            >
              {editingCampaign ? "Update Campaign" : "Save as Draft"}
            </Button>
            {!editingCampaign && formData.schedulingType === "immediate" && (
              <Button
                onClick={() => handleSave(true)}
                disabled={!formData.name || !formData.title || !formData.body || createMutation.isPending}
                className="bg-gradient-to-r from-indigo-600 to-emerald-500"
                data-testid="button-launch-now"
              >
                <Rocket className="w-4 h-4 mr-2" /> Launch Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingCampaign} onOpenChange={(open) => { if (!open) setViewingCampaign(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {viewingCampaign && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-indigo-600" />
                  {viewingCampaign.name}
                  <Badge className={`${statusColors[viewingCampaign.status]} ml-2 gap-1`}>
                    {getStatusIcon(viewingCampaign.status)} {viewingCampaign.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Campaign ID:</span> <span className="font-medium ml-2">{viewingCampaign.campaignId}</span></div>
                  <div><span className="text-muted-foreground">Type:</span> <span className="capitalize ml-2">{viewingCampaign.campaignType}</span></div>
                  <div><span className="text-muted-foreground">Priority:</span> <span className="capitalize ml-2">{viewingCampaign.priority}</span></div>
                  <div><span className="text-muted-foreground">Module:</span> <span className="capitalize ml-2">{viewingCampaign.module || "-"}</span></div>
                  <div><span className="text-muted-foreground">Audience:</span> <span className="ml-2">{audienceTypes.find(a => a.value === viewingCampaign.audienceType)?.label}</span></div>
                  <div><span className="text-muted-foreground">Device:</span> <span className="capitalize ml-2">{viewingCampaign.deviceTargets}</span></div>
                  <div><span className="text-muted-foreground">Created:</span> <span className="ml-2">{viewingCampaign.createdAt ? new Date(viewingCampaign.createdAt).toLocaleString() : "-"}</span></div>
                  <div><span className="text-muted-foreground">Sent:</span> <span className="ml-2">{viewingCampaign.sentAt ? new Date(viewingCampaign.sentAt).toLocaleString() : "-"}</span></div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Message</p>
                  <Card className="bg-muted/50">
                    <CardContent className="p-3">
                      <p className="font-semibold text-sm">{viewingCampaign.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{viewingCampaign.body}</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">Delivery Metrics</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Targeted", value: viewingCampaign.totalTargeted || 0, color: "text-indigo-600" },
                      { label: "Delivered", value: viewingCampaign.totalDelivered || 0, color: "text-emerald-600" },
                      { label: "Failed", value: viewingCampaign.totalFailed || 0, color: "text-red-500" },
                      { label: "Opened", value: viewingCampaign.totalOpened || 0, color: "text-blue-600" },
                      { label: "Clicked", value: viewingCampaign.totalClicked || 0, color: "text-purple-600" },
                      { label: "Acknowledged", value: viewingCampaign.totalAcknowledged || 0, color: "text-teal-600" },
                    ].map((m, i) => (
                      <div key={i} className="text-center p-3 rounded-lg border">
                        <p className={`text-lg font-bold ${m.color}`}>{m.value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}