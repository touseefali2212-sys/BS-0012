import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SmsProvider, EmailProvider, WhatsappProvider, MessageLog } from "@shared/schema";
import { SiWhatsapp } from "react-icons/si";
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare, Mail, Plus, Search, Download, MoreHorizontal, MoreVertical, Eye, Pencil,
  Trash2, TestTube, Power, Shield, Wifi, WifiOff, Clock, AlertTriangle,
  TrendingUp, Activity, Server, Globe, RefreshCw, Zap, CheckCircle, CheckCircle2,
  XCircle, Send, DollarSign, BarChart3, Key, Lock,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts";

const statusColors: Record<string, string> = {
  connected: "bg-green-100 text-green-700",
  testing: "bg-yellow-100 text-yellow-700",
  configured: "bg-blue-100 text-blue-700",
  rate_limited: "bg-purple-100 text-purple-700",
  disconnected: "bg-red-100 text-red-700",
  disabled: "bg-gray-100 text-gray-700",
};

const logStatusColors: Record<string, string> = {
  delivered: "bg-green-100 text-green-700",
  sent: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  bounced: "bg-orange-100 text-orange-700",
};

const CHART_COLORS = ["#1E3A8A", "#06B6D4", "#F59E0B", "#EF4444", "#8B5CF6", "#059669", "#EC4899"];

function maskKey(key: string | null | undefined): string {
  if (!key) return "—";
  if (key.length <= 8) return "••••••••";
  return key.substring(0, 4) + "••••••••" + key.substring(key.length - 4);
}

function getStatusIcon(status: string) {
  switch (status) {
    case "connected": return <Wifi className="w-3 h-3" />;
    case "testing": return <TestTube className="w-3 h-3" />;
    case "configured": return <Shield className="w-3 h-3" />;
    case "rate_limited": return <AlertTriangle className="w-3 h-3" />;
    case "disconnected": return <WifiOff className="w-3 h-3" />;
    case "disabled": return <XCircle className="w-3 h-3" />;
    default: return null;
  }
}

export default function SmsEmailApiPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showSmsEditor, setShowSmsEditor] = useState(false);
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const [showWhatsappEditor, setShowWhatsappEditor] = useState(false);
  const [editingSms, setEditingSms] = useState<SmsProvider | null>(null);
  const [editingEmail, setEditingEmail] = useState<EmailProvider | null>(null);
  const [editingWhatsapp, setEditingWhatsapp] = useState<WhatsappProvider | null>(null);
  const [viewingProvider, setViewingProvider] = useState<(SmsProvider | EmailProvider | WhatsappProvider) & { _type: string } | null>(null);
  const [logSearch, setLogSearch] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState("all");
  const [logTypeFilter, setLogTypeFilter] = useState("all");

  const [smsForm, setSmsForm] = useState({
    name: "", apiBaseUrl: "", apiKey: "", secretKey: "", senderId: "",
    routeType: "transactional", countryCode: "+92", encoding: "gsm",
    rateLimit: 100, fallbackProvider: "", retryAttempts: 3, timeoutDuration: 30,
    callbackUrl: "", ipWhitelist: "", testMode: false,
  });

  const [emailForm, setEmailForm] = useState({
    name: "", providerType: "smtp", smtpHost: "", smtpPort: 587,
    encryption: "tls", username: "", password: "", fromEmail: "", fromName: "",
    apiEndpoint: "", apiKey: "", domain: "", webhookUrl: "",
    bounceHandling: true, throttleRate: 50, bulkRate: 200,
    fallbackProvider: "", retryAttempts: 3, timeoutDuration: 30, testMode: false,
  });

  const [waForm, setWaForm] = useState({
    name: "", providerType: "cloud_api", businessAccountId: "", phoneNumberId: "",
    displayPhoneNumber: "", apiBaseUrl: "https://graph.facebook.com/v18.0",
    accessToken: "", appSecret: "", webhookVerifyToken: "", webhookUrl: "",
    businessName: "", templateNamespace: "", defaultLanguage: "en",
    rateLimit: 80, messagingLimit: "1k", fallbackProvider: "",
    retryAttempts: 3, timeoutDuration: 30, testMode: false,
  });

  const { data: smsProviders = [], isLoading: smsLoading, isError: smsError } = useQuery<SmsProvider[]>({
    queryKey: ["/api/sms-providers"],
  });

  const { data: emailProviders = [], isLoading: emailLoading, isError: emailError } = useQuery<EmailProvider[]>({
    queryKey: ["/api/email-providers"],
  });

  const { data: messageLogs = [], isLoading: logsLoading } = useQuery<MessageLog[]>({
    queryKey: ["/api/message-logs"],
  });

  const createSmsMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", "/api/sms-providers", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sms-providers"] }); toast({ title: "SMS provider created" }); setShowSmsEditor(false); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateSmsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { const res = await apiRequest("PATCH", `/api/sms-providers/${id}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sms-providers"] }); toast({ title: "SMS provider updated" }); setShowSmsEditor(false); setEditingSms(null); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteSmsMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/sms-providers/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sms-providers"] }); toast({ title: "SMS provider deleted" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const smsActionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: string }) => { const res = await apiRequest("POST", `/api/sms-providers/${id}/${action}`); return res.json(); },
    onSuccess: (_d, vars) => { queryClient.invalidateQueries({ queryKey: ["/api/sms-providers"] }); toast({ title: `SMS provider ${vars.action} successful` }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const createEmailMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", "/api/email-providers", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/email-providers"] }); toast({ title: "Email provider created" }); setShowEmailEditor(false); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateEmailMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { const res = await apiRequest("PATCH", `/api/email-providers/${id}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/email-providers"] }); toast({ title: "Email provider updated" }); setShowEmailEditor(false); setEditingEmail(null); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteEmailMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/email-providers/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/email-providers"] }); toast({ title: "Email provider deleted" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const emailActionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: string }) => { const res = await apiRequest("POST", `/api/email-providers/${id}/${action}`); return res.json(); },
    onSuccess: (_d, vars) => { queryClient.invalidateQueries({ queryKey: ["/api/email-providers"] }); toast({ title: `Email provider ${vars.action} successful` }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const { data: whatsappProviders = [], isLoading: waLoading, isError: waError } = useQuery<WhatsappProvider[]>({
    queryKey: ["/api/whatsapp-providers"],
  });

  const isLoading = smsLoading || emailLoading || waLoading;
  const isError = smsError || emailError || waError;

  const createWaMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", "/api/whatsapp-providers", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-providers"] }); toast({ title: "WhatsApp provider created" }); setShowWhatsappEditor(false); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateWaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { const res = await apiRequest("PATCH", `/api/whatsapp-providers/${id}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-providers"] }); toast({ title: "WhatsApp provider updated" }); setShowWhatsappEditor(false); setEditingWhatsapp(null); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteWaMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/whatsapp-providers/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-providers"] }); toast({ title: "WhatsApp provider deleted" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const waActionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: string }) => { const res = await apiRequest("POST", `/api/whatsapp-providers/${id}/${action}`); return res.json(); },
    onSuccess: (_d, vars) => { queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-providers"] }); toast({ title: `WhatsApp provider ${vars.action} successful` }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function openWhatsappEditor(provider?: WhatsappProvider) {
    if (provider) {
      setEditingWhatsapp(provider);
      setWaForm({
        name: provider.name, providerType: provider.providerType,
        businessAccountId: provider.businessAccountId || "", phoneNumberId: provider.phoneNumberId || "",
        displayPhoneNumber: provider.displayPhoneNumber || "",
        apiBaseUrl: provider.apiBaseUrl || "https://graph.facebook.com/v18.0",
        accessToken: provider.accessToken || "", appSecret: provider.appSecret || "",
        webhookVerifyToken: provider.webhookVerifyToken || "", webhookUrl: provider.webhookUrl || "",
        businessName: provider.businessName || "", templateNamespace: provider.templateNamespace || "",
        defaultLanguage: provider.defaultLanguage || "en", rateLimit: provider.rateLimit || 80,
        messagingLimit: provider.messagingLimit || "1k", fallbackProvider: provider.fallbackProvider || "",
        retryAttempts: provider.retryAttempts || 3, timeoutDuration: provider.timeoutDuration || 30,
        testMode: provider.testMode || false,
      });
    } else {
      setEditingWhatsapp(null);
      setWaForm({
        name: "", providerType: "cloud_api", businessAccountId: "", phoneNumberId: "",
        displayPhoneNumber: "", apiBaseUrl: "https://graph.facebook.com/v18.0",
        accessToken: "", appSecret: "", webhookVerifyToken: "", webhookUrl: "",
        businessName: "", templateNamespace: "", defaultLanguage: "en",
        rateLimit: 80, messagingLimit: "1k", fallbackProvider: "",
        retryAttempts: 3, timeoutDuration: 30, testMode: false,
      });
    }
    setShowWhatsappEditor(true);
  }

  function handleSaveWhatsapp() {
    if (editingWhatsapp) {
      updateWaMutation.mutate({ id: editingWhatsapp.id, data: waForm });
    } else {
      createWaMutation.mutate({ ...waForm, status: "configured" });
    }
  }

  function openSmsEditor(provider?: SmsProvider) {
    if (provider) {
      setEditingSms(provider);
      setSmsForm({
        name: provider.name, apiBaseUrl: provider.apiBaseUrl, apiKey: provider.apiKey,
        secretKey: provider.secretKey || "", senderId: provider.senderId || "",
        routeType: provider.routeType, countryCode: provider.countryCode || "+92",
        encoding: provider.encoding || "gsm", rateLimit: provider.rateLimit || 100,
        fallbackProvider: provider.fallbackProvider || "", retryAttempts: provider.retryAttempts || 3,
        timeoutDuration: provider.timeoutDuration || 30, callbackUrl: provider.callbackUrl || "",
        ipWhitelist: provider.ipWhitelist || "", testMode: provider.testMode || false,
      });
    } else {
      setEditingSms(null);
      setSmsForm({
        name: "", apiBaseUrl: "", apiKey: "", secretKey: "", senderId: "",
        routeType: "transactional", countryCode: "+92", encoding: "gsm",
        rateLimit: 100, fallbackProvider: "", retryAttempts: 3, timeoutDuration: 30,
        callbackUrl: "", ipWhitelist: "", testMode: false,
      });
    }
    setShowSmsEditor(true);
  }

  function openEmailEditor(provider?: EmailProvider) {
    if (provider) {
      setEditingEmail(provider);
      setEmailForm({
        name: provider.name, providerType: provider.providerType,
        smtpHost: provider.smtpHost || "", smtpPort: provider.smtpPort || 587,
        encryption: provider.encryption || "tls", username: provider.username || "",
        password: provider.password || "", fromEmail: provider.fromEmail,
        fromName: provider.fromName || "", apiEndpoint: provider.apiEndpoint || "",
        apiKey: provider.apiKey || "", domain: provider.domain || "",
        webhookUrl: provider.webhookUrl || "", bounceHandling: provider.bounceHandling ?? true,
        throttleRate: provider.throttleRate || 50, bulkRate: provider.bulkRate || 200,
        fallbackProvider: provider.fallbackProvider || "", retryAttempts: provider.retryAttempts || 3,
        timeoutDuration: provider.timeoutDuration || 30, testMode: provider.testMode || false,
      });
    } else {
      setEditingEmail(null);
      setEmailForm({
        name: "", providerType: "smtp", smtpHost: "", smtpPort: 587,
        encryption: "tls", username: "", password: "", fromEmail: "", fromName: "",
        apiEndpoint: "", apiKey: "", domain: "", webhookUrl: "",
        bounceHandling: true, throttleRate: 50, bulkRate: 200,
        fallbackProvider: "", retryAttempts: 3, timeoutDuration: 30, testMode: false,
      });
    }
    setShowEmailEditor(true);
  }

  function handleSaveSms() {
    if (editingSms) {
      updateSmsMutation.mutate({ id: editingSms.id, data: smsForm });
    } else {
      createSmsMutation.mutate({ ...smsForm, status: "configured" });
    }
  }

  function handleSaveEmail() {
    if (editingEmail) {
      updateEmailMutation.mutate({ id: editingEmail.id, data: emailForm });
    } else {
      createEmailMutation.mutate({ ...emailForm, status: "configured" });
    }
  }

  const activeSms = smsProviders.filter(p => p.status === "connected").length;
  const activeEmail = emailProviders.filter(p => p.status === "connected").length;
  const activeWa = whatsappProviders.filter(p => p.status === "connected").length;
  const todayStr = new Date().toISOString().split("T")[0];
  const sentToday = messageLogs.filter(l => l.sentAt?.startsWith(todayStr)).length;
  const totalSent = messageLogs.length;
  const totalDelivered = messageLogs.filter(l => l.status === "delivered").length;
  const totalFailed = messageLogs.filter(l => l.status === "failed").length;
  const successRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : "0.0";
  const allProviders = [...smsProviders, ...emailProviders, ...whatsappProviders];
  const healthyCount = allProviders.filter(p => p.status === "connected").length;
  const apiHealth = allProviders.length > 0 ? `${healthyCount}/${allProviders.length}` : "0/0";
  const totalSmsCost = smsProviders.reduce((s, p) => s + parseFloat(p.totalCost || "0"), 0);
  const totalEmailCost = emailProviders.reduce((s, p) => s + parseFloat(p.totalCost || "0"), 0);
  const totalWaCost = whatsappProviders.reduce((s, p) => s + parseFloat(p.totalCost || "0"), 0);
  const monthlyCost = (totalSmsCost + totalEmailCost + totalWaCost).toFixed(2);

  const kpiCards = [
    { label: "Active SMS Providers", value: activeSms, icon: MessageSquare, color: "from-blue-800 to-blue-500" },
    { label: "Active Email Providers", value: activeEmail, icon: Mail, color: "from-cyan-600 to-cyan-400" },
    { label: "WhatsApp Providers", value: activeWa, icon: MessageSquare, color: "from-green-600 to-green-400" },
    { label: "Messages Sent Today", value: sentToday, icon: Send, color: "from-indigo-600 to-indigo-400" },
    { label: "Delivery Success Rate", value: `${successRate}%`, icon: TrendingUp, color: "from-emerald-600 to-emerald-400" },
    { label: "Failed Messages", value: totalFailed, icon: AlertTriangle, color: "from-red-600 to-red-400" },
    { label: "API Health Status", value: apiHealth, icon: Activity, color: "from-purple-600 to-purple-400" },
    { label: "Est. Monthly Cost", value: `$${monthlyCost}`, icon: DollarSign, color: "from-amber-600 to-amber-400" },
  ];

  const filteredLogs = messageLogs.filter(l => {
    if (logSearch && !l.recipient.toLowerCase().includes(logSearch.toLowerCase()) && !l.messageId.toLowerCase().includes(logSearch.toLowerCase())) return false;
    if (logStatusFilter !== "all" && l.status !== logStatusFilter) return false;
    if (logTypeFilter !== "all" && l.type !== logTypeFilter) return false;
    return true;
  });

  const successFailData = [
    { name: "Delivered", value: totalDelivered },
    { name: "Failed", value: totalFailed },
    { name: "Pending", value: messageLogs.filter(l => l.status === "pending").length },
    { name: "Bounced", value: messageLogs.filter(l => l.status === "bounced").length },
  ].filter(d => d.value > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return {
      date: label,
      sms: messageLogs.filter(l => l.type === "sms" && l.sentAt?.startsWith(key)).length,
      email: messageLogs.filter(l => l.type === "email" && l.sentAt?.startsWith(key)).length,
    };
  });

  const costByProvider = [
    ...smsProviders.map(p => ({ name: p.name, cost: parseFloat(p.totalCost || "0") })),
    ...emailProviders.map(p => ({ name: p.name, cost: parseFloat(p.totalCost || "0") })),
  ].filter(d => d.cost > 0);

  const errorBreakdown = [
    { reason: "Invalid Number", pct: 32 },
    { reason: "Blocked Recipient", pct: 24 },
    { reason: "Auth Error", pct: 18 },
    { reason: "Rate Limit", pct: 15 },
    { reason: "Network Timeout", pct: 11 },
  ];

  function exportLogs() {
    const headers = ["Message ID", "Type", "Provider", "Recipient", "Status", "Sent", "Delivered", "Failure Reason", "Cost"];
    const rows = filteredLogs.map(l => [l.messageId, l.type, l.provider, l.recipient, l.status, l.sentAt || "", l.deliveredAt || "", l.failureReason || "", l.cost || ""]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "message-logs.csv"; a.click();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1E3A8A] to-[#06B6D4] bg-clip-text text-transparent" data-testid="text-page-title">
            SMS, Email & WhatsApp API
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure, monitor, and manage messaging gateways</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openSmsEditor()} data-testid="button-add-sms">
            <MessageSquare className="w-4 h-4 mr-2" /> Add SMS
          </Button>
          <Button variant="outline" onClick={() => openEmailEditor()} data-testid="button-add-email">
            <Mail className="w-4 h-4 mr-2" /> Add Email
          </Button>
          <Button onClick={() => openWhatsappEditor()} className="bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-green-600 hover:to-teal-700 text-white" data-testid="button-add-whatsapp">
            <SiWhatsapp className="w-4 h-4 mr-2" /> Add WhatsApp
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-800" />
          <span className="ml-2 text-muted-foreground">Loading providers...</span>
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center py-20 text-red-500">
          <AlertTriangle className="w-6 h-6 mr-2" />
          <span>Failed to load provider data</span>
        </div>
      )}

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

          <Card className="border-0 shadow-sm" data-testid="card-system-health">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2">System Health</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span>API Response</span>
                  <Badge className="bg-green-100 text-green-700 text-[10px]">Normal</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Auth Status</span>
                  <Badge className="bg-green-100 text-green-700 text-[10px]">Valid</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Rate Limits</span>
                  <Badge className="bg-green-100 text-green-700 text-[10px]">OK</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Last Sync</span>
                  <span className="text-muted-foreground">Just now</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && !isError && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" data-testid="tab-overview">Gateway Overview</TabsTrigger>
            <TabsTrigger value="sms" data-testid="tab-sms">SMS Providers</TabsTrigger>
            <TabsTrigger value="email" data-testid="tab-email">Email Providers</TabsTrigger>
            <TabsTrigger value="whatsapp" data-testid="tab-whatsapp" className="gap-2"><SiWhatsapp className="w-4 h-4" /> WhatsApp</TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">Delivery Logs & Usage</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-800" /> Success vs Failure Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {successFailData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={successFailData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={2}>
                          {successFailData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                        </Pie>
                        <Tooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">No delivery data yet</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-600" /> Daily Usage Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={last7Days}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="sms" stroke="#1E3A8A" fill="#1E3A8A" fillOpacity={0.2} name="SMS" />
                      <Area type="monotone" dataKey="email" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.2} name="Email" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-600" /> Cost by Provider
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {costByProvider.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={costByProvider}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="cost" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">No cost data yet</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Error Type Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mt-4">
                    {errorBreakdown.map((e, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{e.reason}</span>
                          <span className="text-muted-foreground">{e.pct}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#06B6D4] rounded-full" style={{ width: `${e.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SMS Providers Tab */}
          <TabsContent value="sms" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-800" /> SMS Gateway Providers</h2>
              <Button size="sm" onClick={() => openSmsEditor()} data-testid="button-add-sms-tab">
                <Plus className="w-4 h-4 mr-1" /> Add Provider
              </Button>
            </div>

            {smsProviders.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No SMS providers configured</p>
                  <Button className="mt-4" onClick={() => openSmsEditor()}>Add Your First SMS Provider</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {smsProviders.map((p) => (
                  <Card key={p.id} className="border-0 shadow-sm" data-testid={`card-sms-${p.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-800 to-blue-500 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.providerId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${statusColors[p.status] || "bg-gray-100 text-gray-700"} gap-1 text-xs`}>
                            {getStatusIcon(p.status)} {p.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-sms-actions-${p.id}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewingProvider({ ...p, _type: "sms" })}>
                                <Eye className="w-4 h-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openSmsEditor(p)}>
                                <Pencil className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => smsActionMutation.mutate({ id: p.id, action: "test" })}>
                                <TestTube className="w-4 h-4 mr-2" /> Send Test
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => smsActionMutation.mutate({ id: p.id, action: "toggle" })}>
                                <Power className="w-4 h-4 mr-2" /> {p.status === "disabled" ? "Enable" : "Disable"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => deleteSmsMutation.mutate(p.id)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">API URL</p>
                          <p className="text-xs truncate font-mono">{p.apiBaseUrl}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">API Key</p>
                          <p className="text-xs font-mono flex items-center gap-1"><Lock className="w-3 h-3" /> {maskKey(p.apiKey)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sender ID</p>
                          <p className="text-xs">{p.senderId || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Route</p>
                          <p className="text-xs capitalize">{p.routeType}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-800">{(p.messagesSent || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Sent</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">{(p.messagesDelivered || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Delivered</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-500">{(p.messagesFailed || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Failed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Email Providers Tab */}
          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Mail className="w-5 h-5 text-cyan-600" /> Email Service Providers</h2>
              <Button size="sm" onClick={() => openEmailEditor()} data-testid="button-add-email-tab">
                <Plus className="w-4 h-4 mr-1" /> Add Provider
              </Button>
            </div>

            {emailProviders.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="p-12 text-center">
                  <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No email providers configured</p>
                  <Button className="mt-4" onClick={() => openEmailEditor()}>Add Your First Email Provider</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {emailProviders.map((p) => (
                  <Card key={p.id} className="border-0 shadow-sm" data-testid={`card-email-${p.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 to-cyan-400 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.providerId} · {p.providerType.toUpperCase()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${statusColors[p.status] || "bg-gray-100 text-gray-700"} gap-1 text-xs`}>
                            {getStatusIcon(p.status)} {p.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-email-actions-${p.id}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewingProvider({ ...p, _type: "email" })}>
                                <Eye className="w-4 h-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEmailEditor(p)}>
                                <Pencil className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => emailActionMutation.mutate({ id: p.id, action: "test" })}>
                                <TestTube className="w-4 h-4 mr-2" /> Send Test
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => emailActionMutation.mutate({ id: p.id, action: "toggle" })}>
                                <Power className="w-4 h-4 mr-2" /> {p.status === "disabled" ? "Enable" : "Disable"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => deleteEmailMutation.mutate(p.id)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">{p.providerType === "smtp" ? "SMTP Host" : "API Endpoint"}</p>
                          <p className="text-xs truncate font-mono">{p.providerType === "smtp" ? `${p.smtpHost}:${p.smtpPort}` : p.apiEndpoint || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">From</p>
                          <p className="text-xs truncate">{p.fromName ? `${p.fromName} <${p.fromEmail}>` : p.fromEmail}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Encryption</p>
                          <p className="text-xs uppercase">{p.encryption}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">DKIM / SPF</p>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-[10px] px-1">{p.dkimStatus}</Badge>
                            <Badge variant="outline" className="text-[10px] px-1">{p.spfStatus}</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 pt-3 border-t">
                        <div className="text-center">
                          <p className="text-lg font-bold text-cyan-600">{(p.emailsSent || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Sent</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">{(p.emailsDelivered || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Delivered</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-500">{(p.emailsFailed || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Failed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-orange-500">{(p.emailsBounced || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Bounced</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-4 mt-4">
            {whatsappProviders.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <SiWhatsapp className="w-16 h-16 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No WhatsApp Providers Configured</h3>
                  <p className="text-muted-foreground mb-4 text-center max-w-md">Connect your WhatsApp Business API to send messages, notifications, and manage conversations.</p>
                  <Button onClick={() => openWhatsappEditor()} className="bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white" data-testid="button-add-whatsapp-empty">
                    <Plus className="w-4 h-4 mr-2" /> Add WhatsApp Provider
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {whatsappProviders.map((provider) => (
                  <Card key={provider.id} className="border-0 shadow-sm hover:shadow-md transition-shadow" data-testid={`card-whatsapp-provider-${provider.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                            <SiWhatsapp className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-medium">{provider.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{provider.providerId} · {provider.providerType.replace("_", " ")}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-whatsapp-actions-${provider.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingProvider({ ...provider, _type: "whatsapp" })} data-testid={`button-view-whatsapp-${provider.id}`}>
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openWhatsappEditor(provider)} data-testid={`button-edit-whatsapp-${provider.id}`}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => waActionMutation.mutate({ id: provider.id, action: "test" })} data-testid={`button-test-whatsapp-${provider.id}`}>
                              <RefreshCw className="w-4 h-4 mr-2" /> Test Connection
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => waActionMutation.mutate({ id: provider.id, action: "toggle" })} data-testid={`button-toggle-whatsapp-${provider.id}`}>
                              <Power className="w-4 h-4 mr-2" /> {provider.status === "disabled" ? "Enable" : "Disable"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteWaMutation.mutate(provider.id)} className="text-red-600" data-testid={`button-delete-whatsapp-${provider.id}`}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={provider.status === "connected" ? "default" : provider.status === "disabled" ? "secondary" : "outline"} className={provider.status === "connected" ? "bg-green-500/10 text-green-600 border-green-200" : ""} data-testid={`badge-whatsapp-status-${provider.id}`}>
                          {provider.status === "connected" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {provider.status === "testing" && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                          {provider.status}
                        </Badge>
                        {provider.businessVerified && <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</Badge>}
                      </div>
                      {provider.displayPhoneNumber && <p className="text-xs text-muted-foreground">Phone: {provider.displayPhoneNumber}</p>}
                      {provider.qualityRating && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Quality:</span>
                          <Badge variant="outline" className={provider.qualityRating === "GREEN" ? "text-green-600" : provider.qualityRating === "YELLOW" ? "text-yellow-600" : "text-red-600"}>
                            {provider.qualityRating}
                          </Badge>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                        <div className="text-center">
                          <p className="text-sm font-semibold">{provider.messagesSent || 0}</p>
                          <p className="text-[10px] text-muted-foreground">Sent</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-green-600">{provider.messagesDelivered || 0}</p>
                          <p className="text-[10px] text-muted-foreground">Delivered</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-blue-600">{provider.messagesRead || 0}</p>
                          <p className="text-[10px] text-muted-foreground">Read</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Delivery Logs Tab */}
          <TabsContent value="logs" className="space-y-4 mt-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search logs..." value={logSearch} onChange={e => setLogSearch(e.target.value)} className="pl-10" data-testid="input-log-search" />
                  </div>
                  <Select value={logTypeFilter} onValueChange={setLogTypeFilter}>
                    <SelectTrigger className="w-[120px]" data-testid="select-log-type">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={logStatusFilter} onValueChange={setLogStatusFilter}>
                    <SelectTrigger className="w-[140px]" data-testid="select-log-status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="bounced">Bounced</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={exportLogs} data-testid="button-export-logs">
                    <Download className="w-4 h-4 mr-1" /> Export
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm" data-testid="table-logs">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#1E3A8A] to-[#06B6D4] text-white">
                        <th className="px-3 py-2.5 text-left font-medium">Message ID</th>
                        <th className="px-3 py-2.5 text-left font-medium">Type</th>
                        <th className="px-3 py-2.5 text-left font-medium">Provider</th>
                        <th className="px-3 py-2.5 text-left font-medium">Recipient</th>
                        <th className="px-3 py-2.5 text-left font-medium">Module</th>
                        <th className="px-3 py-2.5 text-center font-medium">Status</th>
                        <th className="px-3 py-2.5 text-left font-medium">Sent</th>
                        <th className="px-3 py-2.5 text-left font-medium">Delivered</th>
                        <th className="px-3 py-2.5 text-left font-medium">Failure</th>
                        <th className="px-3 py-2.5 text-right font-medium">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.length === 0 ? (
                        <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">No message logs found</td></tr>
                      ) : filteredLogs.slice(0, 100).map((l) => (
                        <tr key={l.id} className="border-b hover:bg-muted/30 transition-colors" data-testid={`row-log-${l.id}`}>
                          <td className="px-3 py-2 font-mono text-xs">{l.messageId}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-xs">
                              {l.type === "sms" ? <MessageSquare className="w-3 h-3 mr-1" /> : <Mail className="w-3 h-3 mr-1" />}
                              {l.type.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-xs">{l.provider}</td>
                          <td className="px-3 py-2 text-xs truncate max-w-[150px]">{l.recipient}</td>
                          <td className="px-3 py-2 text-xs capitalize">{l.module || "—"}</td>
                          <td className="px-3 py-2 text-center">
                            <Badge className={`${logStatusColors[l.status] || "bg-gray-100 text-gray-700"} text-xs`}>{l.status}</Badge>
                          </td>
                          <td className="px-3 py-2 text-xs">{l.sentAt ? new Date(l.sentAt).toLocaleString() : "—"}</td>
                          <td className="px-3 py-2 text-xs">{l.deliveredAt ? new Date(l.deliveredAt).toLocaleString() : "—"}</td>
                          <td className="px-3 py-2 text-xs text-red-500">{l.failureReason || "—"}</td>
                          <td className="px-3 py-2 text-xs text-right">{l.cost ? `$${l.cost}` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Showing {Math.min(filteredLogs.length, 100)} of {filteredLogs.length} logs
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Delivery Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {successFailData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={successFailData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={3}>
                          {successFailData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                        </Pie>
                        <Tooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No log data</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Usage Trend (7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={last7Days}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="sms" stroke="#1E3A8A" fill="#1E3A8A" fillOpacity={0.15} name="SMS" />
                      <Area type="monotone" dataKey="email" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.15} name="Email" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* SMS Provider Editor */}
      <Dialog open={showSmsEditor} onOpenChange={(open) => { if (!open) { setShowSmsEditor(false); setEditingSms(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-800" />
              {editingSms ? "Edit SMS Provider" : "Add SMS Provider"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="connection">
            <TabsList className="w-full">
              <TabsTrigger value="connection" className="flex-1">Connection</TabsTrigger>
              <TabsTrigger value="routing" className="flex-1">Routing</TabsTrigger>
              <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Provider Name *</Label>
                <Input value={smsForm.name} onChange={e => setSmsForm({ ...smsForm, name: e.target.value })} placeholder="e.g., Zong SMS Gateway" data-testid="input-sms-name" />
              </div>
              <div className="space-y-2">
                <Label>API Base URL *</Label>
                <Input value={smsForm.apiBaseUrl} onChange={e => setSmsForm({ ...smsForm, apiBaseUrl: e.target.value })} placeholder="https://api.provider.com/sms" className="font-mono text-sm" data-testid="input-sms-url" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Key className="w-3 h-3" /> API Key *</Label>
                  <Input type="password" value={smsForm.apiKey} onChange={e => setSmsForm({ ...smsForm, apiKey: e.target.value })} placeholder="Enter API key" data-testid="input-sms-apikey" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secret Key</Label>
                  <Input type="password" value={smsForm.secretKey} onChange={e => setSmsForm({ ...smsForm, secretKey: e.target.value })} placeholder="Enter secret key" data-testid="input-sms-secret" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sender ID</Label>
                  <Input value={smsForm.senderId} onChange={e => setSmsForm({ ...smsForm, senderId: e.target.value })} placeholder="NETSPHERE" data-testid="input-sms-sender" />
                </div>
                <div className="space-y-2">
                  <Label>Country Code</Label>
                  <Input value={smsForm.countryCode} onChange={e => setSmsForm({ ...smsForm, countryCode: e.target.value })} data-testid="input-sms-country" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="routing" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Route Type</Label>
                  <Select value={smsForm.routeType} onValueChange={v => setSmsForm({ ...smsForm, routeType: v })}>
                    <SelectTrigger data-testid="select-sms-route"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="otp">OTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Encoding</Label>
                  <Select value={smsForm.encoding} onValueChange={v => setSmsForm({ ...smsForm, encoding: v })}>
                    <SelectTrigger data-testid="select-sms-encoding"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gsm">GSM (7-bit)</SelectItem>
                      <SelectItem value="unicode">Unicode (16-bit)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rate Limit (messages/min)</Label>
                <Input type="number" value={smsForm.rateLimit} onChange={e => setSmsForm({ ...smsForm, rateLimit: parseInt(e.target.value) || 100 })} data-testid="input-sms-rate" />
              </div>
              <div className="space-y-2">
                <Label>Fallback Provider</Label>
                <Input value={smsForm.fallbackProvider} onChange={e => setSmsForm({ ...smsForm, fallbackProvider: e.target.value })} placeholder="Backup provider name" data-testid="input-sms-fallback" />
              </div>
              <div className="space-y-2">
                <Label>Callback URL (Delivery Reports)</Label>
                <Input value={smsForm.callbackUrl} onChange={e => setSmsForm({ ...smsForm, callbackUrl: e.target.value })} placeholder="https://yourdomain.com/webhook/sms" className="font-mono text-sm" data-testid="input-sms-callback" />
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Retry Attempts</Label>
                  <Input type="number" value={smsForm.retryAttempts} onChange={e => setSmsForm({ ...smsForm, retryAttempts: parseInt(e.target.value) || 3 })} data-testid="input-sms-retry" />
                </div>
                <div className="space-y-2">
                  <Label>Timeout (seconds)</Label>
                  <Input type="number" value={smsForm.timeoutDuration} onChange={e => setSmsForm({ ...smsForm, timeoutDuration: parseInt(e.target.value) || 30 })} data-testid="input-sms-timeout" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>IP Whitelist (comma-separated)</Label>
                <Input value={smsForm.ipWhitelist} onChange={e => setSmsForm({ ...smsForm, ipWhitelist: e.target.value })} placeholder="192.168.1.1, 10.0.0.1" data-testid="input-sms-ip" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Test Mode</p>
                  <p className="text-xs text-muted-foreground">Messages won't be sent to actual recipients</p>
                </div>
                <Switch checked={smsForm.testMode} onCheckedChange={v => setSmsForm({ ...smsForm, testMode: v })} data-testid="switch-sms-test" />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => { setShowSmsEditor(false); setEditingSms(null); }}>Cancel</Button>
            <Button
              onClick={handleSaveSms}
              disabled={!smsForm.name || !smsForm.apiBaseUrl || !smsForm.apiKey || createSmsMutation.isPending || updateSmsMutation.isPending}
              className="bg-gradient-to-r from-blue-800 to-blue-500"
              data-testid="button-save-sms"
            >
              {editingSms ? "Update Provider" : "Add Provider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Provider Editor */}
      <Dialog open={showEmailEditor} onOpenChange={(open) => { if (!open) { setShowEmailEditor(false); setEditingEmail(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-cyan-600" />
              {editingEmail ? "Edit Email Provider" : "Add Email Provider"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="connection">
            <TabsList className="w-full">
              <TabsTrigger value="connection" className="flex-1">Connection</TabsTrigger>
              <TabsTrigger value="sender" className="flex-1">Sender</TabsTrigger>
              <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider Name *</Label>
                  <Input value={emailForm.name} onChange={e => setEmailForm({ ...emailForm, name: e.target.value })} placeholder="e.g., SendGrid" data-testid="input-email-name" />
                </div>
                <div className="space-y-2">
                  <Label>Provider Type</Label>
                  <Select value={emailForm.providerType} onValueChange={v => setEmailForm({ ...emailForm, providerType: v })}>
                    <SelectTrigger data-testid="select-email-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smtp">SMTP</SelectItem>
                      <SelectItem value="api">REST API</SelectItem>
                      <SelectItem value="cloud">Cloud Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {emailForm.providerType === "smtp" ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>SMTP Host *</Label>
                      <Input value={emailForm.smtpHost} onChange={e => setEmailForm({ ...emailForm, smtpHost: e.target.value })} placeholder="smtp.gmail.com" className="font-mono text-sm" data-testid="input-email-host" />
                    </div>
                    <div className="space-y-2">
                      <Label>Port</Label>
                      <Input type="number" value={emailForm.smtpPort} onChange={e => setEmailForm({ ...emailForm, smtpPort: parseInt(e.target.value) || 587 })} data-testid="input-email-port" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Encryption</Label>
                      <Select value={emailForm.encryption} onValueChange={v => setEmailForm({ ...emailForm, encryption: v })}>
                        <SelectTrigger data-testid="select-email-encryption"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tls">TLS</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input value={emailForm.username} onChange={e => setEmailForm({ ...emailForm, username: e.target.value })} data-testid="input-email-user" />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" value={emailForm.password} onChange={e => setEmailForm({ ...emailForm, password: e.target.value })} data-testid="input-email-pass" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>API Endpoint *</Label>
                    <Input value={emailForm.apiEndpoint} onChange={e => setEmailForm({ ...emailForm, apiEndpoint: e.target.value })} placeholder="https://api.sendgrid.com/v3/mail/send" className="font-mono text-sm" data-testid="input-email-endpoint" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Key className="w-3 h-3" /> API Key *</Label>
                      <Input type="password" value={emailForm.apiKey} onChange={e => setEmailForm({ ...emailForm, apiKey: e.target.value })} data-testid="input-email-apikey" />
                    </div>
                    <div className="space-y-2">
                      <Label>Domain</Label>
                      <Input value={emailForm.domain} onChange={e => setEmailForm({ ...emailForm, domain: e.target.value })} placeholder="mail.yourdomain.com" data-testid="input-email-domain" />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input value={emailForm.webhookUrl} onChange={e => setEmailForm({ ...emailForm, webhookUrl: e.target.value })} placeholder="https://yourdomain.com/webhook/email" className="font-mono text-sm" data-testid="input-email-webhook" />
              </div>
            </TabsContent>

            <TabsContent value="sender" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Email *</Label>
                  <Input value={emailForm.fromEmail} onChange={e => setEmailForm({ ...emailForm, fromEmail: e.target.value })} placeholder="noreply@yourdomain.com" data-testid="input-email-from" />
                </div>
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input value={emailForm.fromName} onChange={e => setEmailForm({ ...emailForm, fromName: e.target.value })} placeholder="NetSphere" data-testid="input-email-from-name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fallback Provider</Label>
                <Input value={emailForm.fallbackProvider} onChange={e => setEmailForm({ ...emailForm, fallbackProvider: e.target.value })} placeholder="Backup provider name" data-testid="input-email-fallback" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Throttle Rate (emails/min)</Label>
                  <Input type="number" value={emailForm.throttleRate} onChange={e => setEmailForm({ ...emailForm, throttleRate: parseInt(e.target.value) || 50 })} data-testid="input-email-throttle" />
                </div>
                <div className="space-y-2">
                  <Label>Bulk Rate (emails/min)</Label>
                  <Input type="number" value={emailForm.bulkRate} onChange={e => setEmailForm({ ...emailForm, bulkRate: parseInt(e.target.value) || 200 })} data-testid="input-email-bulk" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Retry Attempts</Label>
                  <Input type="number" value={emailForm.retryAttempts} onChange={e => setEmailForm({ ...emailForm, retryAttempts: parseInt(e.target.value) || 3 })} data-testid="input-email-retry" />
                </div>
                <div className="space-y-2">
                  <Label>Timeout (seconds)</Label>
                  <Input type="number" value={emailForm.timeoutDuration} onChange={e => setEmailForm({ ...emailForm, timeoutDuration: parseInt(e.target.value) || 30 })} data-testid="input-email-timeout" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Bounce Handling</p>
                  <p className="text-xs text-muted-foreground">Automatically process bounced emails</p>
                </div>
                <Switch checked={emailForm.bounceHandling} onCheckedChange={v => setEmailForm({ ...emailForm, bounceHandling: v })} data-testid="switch-email-bounce" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Test Mode</p>
                  <p className="text-xs text-muted-foreground">Emails won't be sent to actual recipients</p>
                </div>
                <Switch checked={emailForm.testMode} onCheckedChange={v => setEmailForm({ ...emailForm, testMode: v })} data-testid="switch-email-test" />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => { setShowEmailEditor(false); setEditingEmail(null); }}>Cancel</Button>
            <Button
              onClick={handleSaveEmail}
              disabled={!emailForm.name || !emailForm.fromEmail || (emailForm.providerType === "smtp" ? !emailForm.smtpHost : !emailForm.apiEndpoint) || createEmailMutation.isPending || updateEmailMutation.isPending}
              className="bg-gradient-to-r from-cyan-600 to-cyan-400 text-white"
              data-testid="button-save-email"
            >
              {editingEmail ? "Update Provider" : "Add Provider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Editor Dialog */}
      <Dialog open={showWhatsappEditor} onOpenChange={(open) => { if (!open) { setShowWhatsappEditor(false); setEditingWhatsapp(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SiWhatsapp className="w-5 h-5 text-green-500" />
              {editingWhatsapp ? "Edit WhatsApp Provider" : "Add WhatsApp Provider"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="connection">
            <TabsList className="w-full">
              <TabsTrigger value="connection" className="flex-1">Connection</TabsTrigger>
              <TabsTrigger value="business" className="flex-1">Business</TabsTrigger>
              <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider Name *</Label>
                  <Input value={waForm.name} onChange={e => setWaForm({ ...waForm, name: e.target.value })} placeholder="e.g., WhatsApp Cloud API" data-testid="input-wa-name" />
                </div>
                <div className="space-y-2">
                  <Label>Provider Type</Label>
                  <Select value={waForm.providerType} onValueChange={v => setWaForm({ ...waForm, providerType: v })}>
                    <SelectTrigger data-testid="select-wa-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cloud_api">Meta Cloud API</SelectItem>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="360dialog">360dialog</SelectItem>
                      <SelectItem value="wati">WATI</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Account ID *</Label>
                  <Input value={waForm.businessAccountId} onChange={e => setWaForm({ ...waForm, businessAccountId: e.target.value })} placeholder="Meta Business Account ID" className="font-mono text-sm" data-testid="input-wa-baid" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number ID *</Label>
                  <Input value={waForm.phoneNumberId} onChange={e => setWaForm({ ...waForm, phoneNumberId: e.target.value })} placeholder="WhatsApp Phone Number ID" className="font-mono text-sm" data-testid="input-wa-pnid" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Display Phone Number</Label>
                  <Input value={waForm.displayPhoneNumber} onChange={e => setWaForm({ ...waForm, displayPhoneNumber: e.target.value })} placeholder="+1 234 567 8900" data-testid="input-wa-phone" />
                </div>
                <div className="space-y-2">
                  <Label>API Base URL</Label>
                  <Input value={waForm.apiBaseUrl} onChange={e => setWaForm({ ...waForm, apiBaseUrl: e.target.value })} placeholder="https://graph.facebook.com/v18.0" className="font-mono text-sm" data-testid="input-wa-apiurl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Key className="w-3 h-3" /> Access Token *</Label>
                <Input type="password" value={waForm.accessToken} onChange={e => setWaForm({ ...waForm, accessToken: e.target.value })} placeholder="Permanent access token" data-testid="input-wa-token" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Shield className="w-3 h-3" /> App Secret</Label>
                  <Input type="password" value={waForm.appSecret} onChange={e => setWaForm({ ...waForm, appSecret: e.target.value })} placeholder="Facebook App Secret" data-testid="input-wa-secret" />
                </div>
                <div className="space-y-2">
                  <Label>Webhook Verify Token</Label>
                  <Input value={waForm.webhookVerifyToken} onChange={e => setWaForm({ ...waForm, webhookVerifyToken: e.target.value })} placeholder="Custom verification token" className="font-mono text-sm" data-testid="input-wa-verify" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input value={waForm.webhookUrl} onChange={e => setWaForm({ ...waForm, webhookUrl: e.target.value })} placeholder="https://yourdomain.com/webhook/whatsapp" className="font-mono text-sm" data-testid="input-wa-webhook" />
              </div>
            </TabsContent>

            <TabsContent value="business" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input value={waForm.businessName} onChange={e => setWaForm({ ...waForm, businessName: e.target.value })} placeholder="Your Business Name" data-testid="input-wa-bizname" />
                </div>
                <div className="space-y-2">
                  <Label>Template Namespace</Label>
                  <Input value={waForm.templateNamespace} onChange={e => setWaForm({ ...waForm, templateNamespace: e.target.value })} placeholder="Template namespace ID" className="font-mono text-sm" data-testid="input-wa-namespace" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Select value={waForm.defaultLanguage} onValueChange={v => setWaForm({ ...waForm, defaultLanguage: v })}>
                    <SelectTrigger data-testid="select-wa-lang"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="id">Indonesian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Messaging Limit</Label>
                  <Select value={waForm.messagingLimit} onValueChange={v => setWaForm({ ...waForm, messagingLimit: v })}>
                    <SelectTrigger data-testid="select-wa-limit"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="250">Tier 1 (250/day)</SelectItem>
                      <SelectItem value="1k">Tier 2 (1K/day)</SelectItem>
                      <SelectItem value="10k">Tier 3 (10K/day)</SelectItem>
                      <SelectItem value="100k">Tier 4 (100K/day)</SelectItem>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fallback Provider</Label>
                <Input value={waForm.fallbackProvider} onChange={e => setWaForm({ ...waForm, fallbackProvider: e.target.value })} placeholder="Backup provider name" data-testid="input-wa-fallback" />
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Rate Limit (msg/sec)</Label>
                  <Input type="number" value={waForm.rateLimit} onChange={e => setWaForm({ ...waForm, rateLimit: parseInt(e.target.value) || 80 })} data-testid="input-wa-rate" />
                </div>
                <div className="space-y-2">
                  <Label>Retry Attempts</Label>
                  <Input type="number" value={waForm.retryAttempts} onChange={e => setWaForm({ ...waForm, retryAttempts: parseInt(e.target.value) || 3 })} data-testid="input-wa-retry" />
                </div>
                <div className="space-y-2">
                  <Label>Timeout (seconds)</Label>
                  <Input type="number" value={waForm.timeoutDuration} onChange={e => setWaForm({ ...waForm, timeoutDuration: parseInt(e.target.value) || 30 })} data-testid="input-wa-timeout" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Test Mode</p>
                  <p className="text-xs text-muted-foreground">Messages won't be sent to actual recipients</p>
                </div>
                <Switch checked={waForm.testMode} onCheckedChange={v => setWaForm({ ...waForm, testMode: v })} data-testid="switch-wa-test" />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => { setShowWhatsappEditor(false); setEditingWhatsapp(null); }}>Cancel</Button>
            <Button
              onClick={handleSaveWhatsapp}
              disabled={!waForm.name || !waForm.businessAccountId || !waForm.phoneNumberId || !waForm.accessToken || createWaMutation.isPending || updateWaMutation.isPending}
              className="bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white"
              data-testid="button-save-whatsapp"
            >
              {editingWhatsapp ? "Update Provider" : "Add Provider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Provider Details */}
      <Dialog open={!!viewingProvider} onOpenChange={(open) => { if (!open) setViewingProvider(null); }}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          {viewingProvider && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {viewingProvider._type === "sms" ? <MessageSquare className="w-5 h-5 text-blue-800" /> : viewingProvider._type === "whatsapp" ? <SiWhatsapp className="w-5 h-5 text-green-500" /> : <Mail className="w-5 h-5 text-cyan-600" />}
                  {viewingProvider.name}
                  <Badge className={`${statusColors[viewingProvider.status]} ml-2 gap-1`}>
                    {getStatusIcon(viewingProvider.status)} {viewingProvider.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Provider ID:</span> <span className="font-medium ml-1">{"providerId" in viewingProvider ? (viewingProvider as any).providerId : ""}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <span className="capitalize ml-1">{viewingProvider.status}</span></div>
                  <div><span className="text-muted-foreground">Priority:</span> <span className="ml-1">{viewingProvider.priority}</span></div>
                  <div><span className="text-muted-foreground">Created:</span> <span className="ml-1">{viewingProvider.createdAt ? new Date(viewingProvider.createdAt).toLocaleString() : "—"}</span></div>
                  <div><span className="text-muted-foreground">Last Sync:</span> <span className="ml-1">{viewingProvider.lastSyncAt ? new Date(viewingProvider.lastSyncAt).toLocaleString() : "Never"}</span></div>
                  <div><span className="text-muted-foreground">Test Mode:</span> <span className="ml-1">{viewingProvider.testMode ? "Enabled" : "Disabled"}</span></div>
                </div>

                {viewingProvider._type === "sms" && (() => {
                  const sms = viewingProvider as SmsProvider & { _type: string };
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">API URL:</span> <span className="font-mono text-xs ml-1 break-all">{sms.apiBaseUrl}</span></div>
                        <div><span className="text-muted-foreground">Sender ID:</span> <span className="ml-1">{sms.senderId || "—"}</span></div>
                        <div><span className="text-muted-foreground">Route:</span> <span className="capitalize ml-1">{sms.routeType}</span></div>
                        <div><span className="text-muted-foreground">Encoding:</span> <span className="uppercase ml-1">{sms.encoding}</span></div>
                        <div><span className="text-muted-foreground">Rate Limit:</span> <span className="ml-1">{sms.rateLimit}/min</span></div>
                        <div><span className="text-muted-foreground">Retry:</span> <span className="ml-1">{sms.retryAttempts} attempts</span></div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                        <div className="text-center p-3 rounded-lg bg-blue-50">
                          <p className="text-xl font-bold text-blue-800">{(sms.messagesSent || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Sent</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-green-50">
                          <p className="text-xl font-bold text-green-600">{(sms.messagesDelivered || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Delivered</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-red-50">
                          <p className="text-xl font-bold text-red-500">{(sms.messagesFailed || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Failed</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {viewingProvider._type === "email" && (() => {
                  const eml = viewingProvider as EmailProvider & { _type: string };
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Type:</span> <span className="uppercase ml-1">{eml.providerType}</span></div>
                        <div><span className="text-muted-foreground">From:</span> <span className="ml-1">{eml.fromName ? `${eml.fromName} <${eml.fromEmail}>` : eml.fromEmail}</span></div>
                        {eml.providerType === "smtp" && (
                          <>
                            <div><span className="text-muted-foreground">SMTP:</span> <span className="font-mono text-xs ml-1">{eml.smtpHost}:{eml.smtpPort}</span></div>
                            <div><span className="text-muted-foreground">Encryption:</span> <span className="uppercase ml-1">{eml.encryption}</span></div>
                          </>
                        )}
                        <div><span className="text-muted-foreground">DKIM:</span> <Badge variant="outline" className="text-xs ml-1">{eml.dkimStatus}</Badge></div>
                        <div><span className="text-muted-foreground">SPF:</span> <Badge variant="outline" className="text-xs ml-1">{eml.spfStatus}</Badge></div>
                        <div><span className="text-muted-foreground">Throttle:</span> <span className="ml-1">{eml.throttleRate}/min</span></div>
                        <div><span className="text-muted-foreground">Bounce:</span> <span className="ml-1">{eml.bounceHandling ? "Enabled" : "Disabled"}</span></div>
                      </div>
                      <div className="grid grid-cols-4 gap-3 pt-3 border-t">
                        <div className="text-center p-3 rounded-lg bg-cyan-50">
                          <p className="text-xl font-bold text-cyan-600">{(eml.emailsSent || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Sent</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-green-50">
                          <p className="text-xl font-bold text-green-600">{(eml.emailsDelivered || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Delivered</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-red-50">
                          <p className="text-xl font-bold text-red-500">{(eml.emailsFailed || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Failed</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-orange-50">
                          <p className="text-xl font-bold text-orange-500">{(eml.emailsBounced || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Bounced</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {viewingProvider._type === "whatsapp" && (() => {
                  const wa = viewingProvider as WhatsappProvider & { _type: string };
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Type:</span> <span className="ml-1">{wa.providerType.replace("_", " ")}</span></div>
                        <div><span className="text-muted-foreground">Phone:</span> <span className="ml-1">{wa.displayPhoneNumber || "—"}</span></div>
                        <div><span className="text-muted-foreground">Business:</span> <span className="ml-1">{wa.businessName || "—"}</span></div>
                        <div><span className="text-muted-foreground">Verified:</span> <span className="ml-1">{wa.businessVerified ? "Yes" : "No"}</span></div>
                        <div><span className="text-muted-foreground">Quality:</span> <Badge variant="outline" className={`text-xs ml-1 ${wa.qualityRating === "GREEN" ? "text-green-600" : wa.qualityRating === "YELLOW" ? "text-yellow-600" : "text-red-600"}`}>{wa.qualityRating || "—"}</Badge></div>
                        <div><span className="text-muted-foreground">Msg Limit:</span> <span className="ml-1">{wa.messagingLimit || "—"}/day</span></div>
                        <div><span className="text-muted-foreground">Language:</span> <span className="ml-1">{wa.defaultLanguage || "en"}</span></div>
                        <div><span className="text-muted-foreground">Rate:</span> <span className="ml-1">{wa.rateLimit}/sec</span></div>
                      </div>
                      <div className="grid grid-cols-4 gap-3 pt-3 border-t">
                        <div className="text-center p-3 rounded-lg bg-green-50">
                          <p className="text-xl font-bold text-green-600">{(wa.messagesSent || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Sent</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-emerald-50">
                          <p className="text-xl font-bold text-emerald-600">{(wa.messagesDelivered || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Delivered</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-blue-50">
                          <p className="text-xl font-bold text-blue-600">{(wa.messagesRead || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Read</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-red-50">
                          <p className="text-xl font-bold text-red-500">{(wa.messagesFailed || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Failed</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}