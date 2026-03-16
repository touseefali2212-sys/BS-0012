import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PushMessage, SmsProvider, EmailProvider, WhatsappProvider, Customer } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare, Mail, Send, Search, Download, MoreVertical, Eye,
  Trash2, AlertTriangle, TrendingUp,
  CheckCircle2, Phone, Smartphone,
  Signal, Users, Calendar, Upload, Globe,
  ChevronRight, BarChart3, Loader2, Play, Ban, RotateCcw, FileText,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import {
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const CHART_COLORS = ["#059669", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  queued: "bg-amber-100 text-amber-700 border-amber-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  sending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  sent: "bg-green-100 text-green-700 border-green-200",
  partially_sent: "bg-orange-100 text-orange-700 border-orange-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

const channelLabels: Record<string, string> = {
  sim_sms: "SIM SMS",
  email_sms: "Email SMS",
  whatsapp: "WhatsApp",
};

const channelIcons: Record<string, any> = {
  sim_sms: Smartphone,
  email_sms: Mail,
  whatsapp: SiWhatsapp,
};

const recipientTypeLabels: Record<string, string> = {
  individual: "Individual Customer",
  group: "Customer Group",
  city: "By City / Branch",
  plan: "By Plan Type",
  payment_status: "By Payment Status",
  staff: "Staff Users",
  manual: "Manual Number Entry",
  bulk_csv: "Bulk Upload (CSV)",
};

const personalizationVars = [
  { key: "{Customer Name}", desc: "Full name" },
  { key: "{Invoice Number}", desc: "Latest invoice" },
  { key: "{Due Date}", desc: "Payment due" },
  { key: "{Outstanding Amount}", desc: "Balance" },
  { key: "{Package Name}", desc: "Current plan" },
  { key: "{Account ID}", desc: "Customer ID" },
];

export default function PushSmsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("sim_sms");
  const [showComposer, setShowComposer] = useState(false);
  const [composerChannel, setComposerChannel] = useState("sim_sms");
  const [viewingMessage, setViewingMessage] = useState<PushMessage | null>(null);
  const [logSearch, setLogSearch] = useState("");
  const [logChannelFilter, setLogChannelFilter] = useState("all");
  const [logStatusFilter, setLogStatusFilter] = useState("all");

  const [msgForm, setMsgForm] = useState({
    recipientType: "individual",
    recipientValue: "",
    recipientNames: "",
    recipientCount: 1,
    subject: "",
    body: "",
    templateId: "",
    variables: "",
    mediaUrl: "",
    ctaButton: "",
    paymentLink: false,
    scheduledAt: "",
    expiryAt: "",
    recurring: false,
    recurringPattern: "",
    batchSize: 50,
    sendingSpeed: 10,
    fallbackChannel: "",
    campaignName: "",
  });

  const { data: pushMessages = [], isLoading: msgsLoading } = useQuery<PushMessage[]>({
    queryKey: ["/api/push-messages"],
  });

  const { data: smsProviders = [] } = useQuery<SmsProvider[]>({
    queryKey: ["/api/sms-providers"],
  });

  const { data: emailProviders = [] } = useQuery<EmailProvider[]>({
    queryKey: ["/api/email-providers"],
  });

  const { data: whatsappProviders = [] } = useQuery<WhatsappProvider[]>({
    queryKey: ["/api/whatsapp-providers"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", "/api/push-messages", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/push-messages"] }); toast({ title: "Message created" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const sendMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest("POST", `/api/push-messages/${id}/send`); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/push-messages"] }); toast({ title: "Message sending initiated" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const retryMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest("POST", `/api/push-messages/${id}/retry`); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/push-messages"] }); toast({ title: "Retry initiated" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => { const res = await apiRequest("POST", `/api/push-messages/${id}/cancel`); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/push-messages"] }); toast({ title: "Message cancelled" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/push-messages/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/push-messages"] }); toast({ title: "Message deleted" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function openComposer(channel: string) {
    setComposerChannel(channel);
    setMsgForm({
      recipientType: "individual", recipientValue: "", recipientNames: "", recipientCount: 1,
      subject: "", body: "", templateId: "", variables: "", mediaUrl: "", ctaButton: "",
      paymentLink: false, scheduledAt: "", expiryAt: "", recurring: false, recurringPattern: "",
      batchSize: 50, sendingSpeed: 10, fallbackChannel: "", campaignName: "",
    });
    setShowComposer(true);
  }

  function handleSendNow() {
    createMutation.mutate({
      ...msgForm, channel: composerChannel, status: "queued",
    }, {
      onSuccess: (data: PushMessage) => {
        setShowComposer(false);
        sendMutation.mutate(data.id);
      },
    });
  }

  function handleSchedule() {
    createMutation.mutate({
      ...msgForm, channel: composerChannel, status: "scheduled",
    }, {
      onSuccess: () => { setShowComposer(false); },
    });
  }

  function handleSaveDraft() {
    createMutation.mutate({
      ...msgForm, channel: composerChannel, status: "draft",
    }, {
      onSuccess: () => { setShowComposer(false); },
    });
  }

  function insertVariable(v: string) {
    setMsgForm(f => ({ ...f, body: f.body + v }));
  }

  const charCount = msgForm.body.length;
  const smsSegments = Math.ceil(charCount / 160) || 1;

  const activeSmsDevices = smsProviders.filter(p => p.status === "connected").length;
  const activeEmailGateways = emailProviders.filter(p => p.status === "connected").length;
  const activeWhatsapp = whatsappProviders.filter(p => p.status === "connected").length;
  const totalSent = pushMessages.filter(m => m.status === "sent" || m.status === "partially_sent").length;
  const totalDelivered = pushMessages.reduce((s, m) => s + (m.totalDelivered || 0), 0);
  const totalFailed = pushMessages.reduce((s, m) => s + (m.totalFailed || 0), 0);
  const totalPending = pushMessages.filter(m => m.status === "sending" || m.status === "queued" || m.status === "scheduled").length;

  const channelDistribution = [
    { name: "SIM SMS", value: pushMessages.filter(m => m.channel === "sim_sms").length, color: "#3B82F6" },
    { name: "Email SMS", value: pushMessages.filter(m => m.channel === "email_sms").length, color: "#06B6D4" },
    { name: "WhatsApp", value: pushMessages.filter(m => m.channel === "whatsapp").length, color: "#25D366" },
  ].filter(c => c.value > 0);

  const statusDistribution = [
    { name: "Sent", value: pushMessages.filter(m => m.status === "sent").length, color: "#059669" },
    { name: "Sending", value: pushMessages.filter(m => m.status === "sending").length, color: "#F59E0B" },
    { name: "Scheduled", value: pushMessages.filter(m => m.status === "scheduled").length, color: "#3B82F6" },
    { name: "Failed", value: pushMessages.filter(m => m.status === "failed").length, color: "#EF4444" },
    { name: "Draft", value: pushMessages.filter(m => m.status === "draft").length, color: "#6B7280" },
  ].filter(c => c.value > 0);

  const filteredMessages = pushMessages.filter(m => {
    if (logSearch && !m.messageId.toLowerCase().includes(logSearch.toLowerCase()) && !(m.campaignName || "").toLowerCase().includes(logSearch.toLowerCase()) && !(m.recipientNames || "").toLowerCase().includes(logSearch.toLowerCase())) return false;
    if (logChannelFilter !== "all" && m.channel !== logChannelFilter) return false;
    if (logStatusFilter !== "all" && m.status !== logStatusFilter) return false;
    return true;
  });

  function exportLogs() {
    const headers = ["ID", "Channel", "Recipient", "Count", "Status", "Sent", "Delivered", "Failed", "Sent At", "Campaign"];
    const rows = filteredMessages.map(m => [m.messageId, channelLabels[m.channel] || m.channel, m.recipientNames || m.recipientValue || "", m.recipientCount, m.status, m.totalSent, m.totalDelivered, m.totalFailed, m.sentAt || "", m.campaignName || ""]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `push-messages-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export complete" });
  }

  const kpiCards = [
    { label: "SIM Devices", value: activeSmsDevices, icon: Smartphone, color: "from-blue-700 to-blue-500", sub: `${smsProviders.length} total` },
    { label: "Email Gateways", value: activeEmailGateways, icon: Mail, color: "from-cyan-600 to-cyan-400", sub: `${emailProviders.length} total` },
    { label: "WhatsApp Channels", value: activeWhatsapp, icon: MessageSquare, color: "from-green-600 to-green-400", sub: `${whatsappProviders.length} total` },
    { label: "Messages Sent", value: totalSent, icon: Send, color: "from-indigo-600 to-indigo-400", sub: `${totalDelivered} delivered` },
    { label: "Delivery Rate", value: totalSent > 0 ? `${((totalDelivered / Math.max(pushMessages.reduce((s, m) => s + (m.totalSent || 0), 0), 1)) * 100).toFixed(1)}%` : "0%", icon: TrendingUp, color: "from-emerald-600 to-emerald-400", sub: "success rate" },
    { label: "Failed", value: totalFailed, icon: AlertTriangle, color: "from-red-600 to-red-400", sub: `${totalPending} pending` },
  ];

  if (msgsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1E3A8A] to-[#059669] bg-clip-text text-transparent" data-testid="text-page-title">
            Push SMS Console
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Send real-time messages via SIM SMS, Email Gateway, or WhatsApp</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openComposer("sim_sms")} data-testid="button-compose-sim">
            <Smartphone className="w-4 h-4 mr-2" /> SIM SMS
          </Button>
          <Button variant="outline" onClick={() => openComposer("email_sms")} data-testid="button-compose-email">
            <Mail className="w-4 h-4 mr-2" /> Email SMS
          </Button>
          <Button onClick={() => openComposer("whatsapp")} className="bg-gradient-to-r from-[#1E3A8A] to-[#059669] text-white" data-testid="button-compose-whatsapp">
            <SiWhatsapp className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi, i) => (
          <Card key={i} className="border-0 shadow-sm" data-testid={`card-kpi-${i}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                  <kpi.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-2xl font-bold">{kpi.value}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="sim_sms" data-testid="tab-sim" className="gap-2"><Smartphone className="w-4 h-4" /> SIM SMS</TabsTrigger>
          <TabsTrigger value="email_sms" data-testid="tab-email-sms" className="gap-2"><Mail className="w-4 h-4" /> Email SMS</TabsTrigger>
          <TabsTrigger value="whatsapp" data-testid="tab-whatsapp" className="gap-2"><SiWhatsapp className="w-4 h-4" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="bulk" data-testid="tab-bulk" className="gap-2"><Upload className="w-4 h-4" /> Bulk Upload</TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs" className="gap-2"><BarChart3 className="w-4 h-4" /> Logs & Reports</TabsTrigger>
        </TabsList>

        {/* SIM SMS Tab */}
        <TabsContent value="sim_sms" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Signal className="w-5 h-5 text-blue-600" /> SIM Device Status</CardTitle>
              </CardHeader>
              <CardContent>
                {smsProviders.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No SIM Devices Configured</p>
                    <p className="text-sm mt-1">Go to SMS & Email API to add SIM/SMS providers</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {smsProviders.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors" data-testid={`row-sim-device-${p.id}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${p.status === "connected" ? "bg-green-500" : p.status === "testing" ? "bg-yellow-500 animate-pulse" : "bg-red-500"}`} />
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.providerId} · {p.senderId || "No Sender ID"} · {p.routeType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Rate: {p.rateLimit}/min</span>
                          <span>Sent: {p.messagesSent || 0}</span>
                          <Badge variant="outline" className={p.status === "connected" ? "text-green-600 border-green-200" : "text-red-600 border-red-200"}>
                            {p.status}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => openComposer("sim_sms")} data-testid={`button-send-via-${p.id}`}>
                            <Send className="w-3 h-3 mr-1" /> Send
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Send</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="+92 300 1234567" data-testid="input-quick-phone" />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea placeholder="Type your message..." rows={3} data-testid="input-quick-msg" />
                </div>
                <Button className="w-full bg-gradient-to-r from-blue-700 to-blue-500 text-white" onClick={() => openComposer("sim_sms")} data-testid="button-quick-send">
                  <Send className="w-4 h-4 mr-2" /> Open Composer
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent SIM SMS Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {pushMessages.filter(m => m.channel === "sim_sms").length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No SIM SMS messages yet</p>
              ) : (
                <div className="space-y-2">
                  {pushMessages.filter(m => m.channel === "sim_sms").slice(0, 10).map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border text-sm" data-testid={`row-sim-msg-${m.id}`}>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[m.status]}>{m.status}</Badge>
                        <span className="font-mono text-xs text-muted-foreground">{m.messageId}</span>
                        <span className="truncate max-w-[200px]">{m.recipientNames || m.recipientValue || "—"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{m.recipientCount} recipient(s)</span>
                        <span className="text-green-600">{m.totalDelivered || 0} delivered</span>
                        {(m.totalFailed || 0) > 0 && <span className="text-red-500">{m.totalFailed} failed</span>}
                        <Button size="sm" variant="ghost" onClick={() => setViewingMessage(m)} data-testid={`button-view-msg-${m.id}`}>
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email SMS Tab */}
        <TabsContent value="email_sms" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Globe className="w-5 h-5 text-cyan-600" /> Email-to-SMS Gateways</CardTitle>
              </CardHeader>
              <CardContent>
                {emailProviders.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No Email Gateways Configured</p>
                    <p className="text-sm mt-1">Go to SMS & Email API to add email providers</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {emailProviders.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors" data-testid={`row-email-gw-${p.id}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${p.status === "connected" ? "bg-green-500" : "bg-red-500"}`} />
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.providerId} · {p.providerType.toUpperCase()} · {p.fromEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Throttle: {p.throttleRate}/min</span>
                          <span>Sent: {p.emailsSent || 0}</span>
                          <Badge variant="outline" className={p.status === "connected" ? "text-green-600 border-green-200" : "text-red-600 border-red-200"}>
                            {p.status}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => openComposer("email_sms")} data-testid={`button-send-email-${p.id}`}>
                            <Send className="w-3 h-3 mr-1" /> Send
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Gateway Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200">
                  <p className="font-medium text-cyan-800">How Email-to-SMS Works</p>
                  <p className="text-xs text-cyan-600 mt-1">Messages are sent as emails to telecom gateway domains (e.g., number@carrier.com). The carrier then delivers as SMS.</p>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between"><span>Active Gateways:</span><span className="font-medium">{activeEmailGateways}</span></div>
                  <div className="flex justify-between"><span>Total Sent:</span><span className="font-medium">{emailProviders.reduce((s, p) => s + (p.emailsSent || 0), 0)}</span></div>
                  <div className="flex justify-between"><span>Intl. Format:</span><span className="font-medium text-green-600">Supported</span></div>
                </div>
                <Button className="w-full" variant="outline" onClick={() => openComposer("email_sms")} data-testid="button-compose-email-sms">
                  <Mail className="w-4 h-4 mr-2" /> Compose Email SMS
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Email SMS Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {pushMessages.filter(m => m.channel === "email_sms").length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No Email SMS messages yet</p>
              ) : (
                <div className="space-y-2">
                  {pushMessages.filter(m => m.channel === "email_sms").slice(0, 10).map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border text-sm" data-testid={`row-email-msg-${m.id}`}>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[m.status]}>{m.status}</Badge>
                        <span className="font-mono text-xs text-muted-foreground">{m.messageId}</span>
                        <span className="truncate max-w-[200px]">{m.recipientNames || m.recipientValue || "—"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{m.recipientCount} recipient(s)</span>
                        <span className="text-green-600">{m.totalDelivered || 0} delivered</span>
                        <Button size="sm" variant="ghost" onClick={() => setViewingMessage(m)}><Eye className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><SiWhatsapp className="w-5 h-5 text-green-500" /> WhatsApp Business Channels</CardTitle>
              </CardHeader>
              <CardContent>
                {whatsappProviders.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <SiWhatsapp className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No WhatsApp Channels Configured</p>
                    <p className="text-sm mt-1">Go to SMS & Email API to add WhatsApp providers</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {whatsappProviders.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors" data-testid={`row-wa-channel-${p.id}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${p.status === "connected" ? "bg-green-500" : "bg-red-500"}`} />
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.providerId} · {p.displayPhoneNumber || "No number"} · {p.providerType.replace("_", " ")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {p.qualityRating && p.qualityRating !== "unknown" && (
                            <Badge variant="outline" className={p.qualityRating === "GREEN" ? "text-green-600" : p.qualityRating === "YELLOW" ? "text-yellow-600" : "text-red-600"}>
                              {p.qualityRating}
                            </Badge>
                          )}
                          <span>Limit: {p.messagingLimit}/day</span>
                          <span>Sent: {p.messagesSent || 0}</span>
                          <Badge variant="outline" className={p.status === "connected" ? "text-green-600 border-green-200" : "text-red-600 border-red-200"}>
                            {p.status}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => openComposer("whatsapp")} className="border-green-200 text-green-700 hover:bg-green-50" data-testid={`button-send-wa-${p.id}`}>
                            <SiWhatsapp className="w-3 h-3 mr-1" /> Send
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">WhatsApp Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="font-medium text-green-800">Template Messaging</p>
                  <p className="text-xs text-green-600 mt-1">Only approved templates can be sent via WhatsApp Business API. Select from pre-approved templates when composing.</p>
                </div>
                <div className="space-y-2">
                  {["Template Selection", "Media Attachments", "CTA Buttons", "Auto Personalization", "Read Receipts"].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white" onClick={() => openComposer("whatsapp")} data-testid="button-compose-wa">
                  <SiWhatsapp className="w-4 h-4 mr-2" /> Compose WhatsApp
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent WhatsApp Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {pushMessages.filter(m => m.channel === "whatsapp").length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No WhatsApp messages yet</p>
              ) : (
                <div className="space-y-2">
                  {pushMessages.filter(m => m.channel === "whatsapp").slice(0, 10).map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border text-sm" data-testid={`row-wa-msg-${m.id}`}>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColors[m.status]}>{m.status}</Badge>
                        <span className="font-mono text-xs text-muted-foreground">{m.messageId}</span>
                        <span className="truncate max-w-[200px]">{m.recipientNames || m.recipientValue || "—"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{m.recipientCount} recipient(s)</span>
                        <span className="text-green-600">{m.totalDelivered || 0} delivered</span>
                        <Button size="sm" variant="ghost" onClick={() => setViewingMessage(m)}><Eye className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Upload Tab */}
        <TabsContent value="bulk" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Upload className="w-5 h-5 text-indigo-600" /> Upload Recipients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/20 transition-colors cursor-pointer" data-testid="area-csv-upload">
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium">Drop CSV file here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">Supported format: CSV with columns (Name, Phone, Email)</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm font-medium text-amber-800">CSV Format Example</p>
                  <pre className="text-xs text-amber-700 mt-1 font-mono">Name,Phone,Email{"\n"}John Doe,+923001234567,john@example.com{"\n"}Jane Smith,+923009876543,jane@example.com</pre>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Channel</Label>
                    <Select defaultValue="sim_sms">
                      <SelectTrigger data-testid="select-bulk-channel"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim_sms">SIM SMS</SelectItem>
                        <SelectItem value="email_sms">Email SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Batch Size</Label>
                    <Input type="number" defaultValue={50} data-testid="input-bulk-batch" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-600" /> Compose Bulk Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Campaign Name</Label>
                  <Input placeholder="e.g., March Billing Reminder" data-testid="input-bulk-campaign" />
                </div>
                <div className="space-y-2">
                  <Label>Message Body</Label>
                  <Textarea placeholder="Type your message..." rows={4} data-testid="input-bulk-body" />
                  <div className="flex flex-wrap gap-1">
                    {personalizationVars.map(v => (
                      <Badge key={v.key} variant="outline" className="cursor-pointer hover:bg-muted text-xs" data-testid={`button-var-${v.key}`}>
                        {v.key}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sending Speed</Label>
                    <Select defaultValue="10">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 msg/sec (Slow)</SelectItem>
                        <SelectItem value="10">10 msg/sec (Normal)</SelectItem>
                        <SelectItem value="25">25 msg/sec (Fast)</SelectItem>
                        <SelectItem value="50">50 msg/sec (Burst)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fallback Channel</Label>
                    <Select defaultValue="">
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Fallback</SelectItem>
                        <SelectItem value="sim_sms">SIM SMS</SelectItem>
                        <SelectItem value="email_sms">Email SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#059669] text-white" data-testid="button-bulk-send">
                  <Send className="w-4 h-4 mr-2" /> Start Bulk Send
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logs & Reports Tab */}
        <TabsContent value="logs" className="space-y-4 mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Search by ID, recipient, or campaign..." className="pl-9" data-testid="input-log-search" />
                </div>
                <Select value={logChannelFilter} onValueChange={setLogChannelFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-log-channel">
                    <SelectValue placeholder="Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="sim_sms">SIM SMS</SelectItem>
                    <SelectItem value="email_sms">Email SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={logStatusFilter} onValueChange={setLogStatusFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-log-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="sending">Sending</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportLogs} data-testid="button-export-logs">
                  <Download className="w-4 h-4 mr-2" /> Export
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Delivery Log ({filteredMessages.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredMessages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No messages found</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {filteredMessages.map(m => {
                      const ChannelIcon = channelIcons[m.channel] || MessageSquare;
                      return (
                        <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/20 transition-colors text-sm" data-testid={`row-log-${m.id}`}>
                          <div className="flex items-center gap-3">
                            <ChannelIcon className="w-4 h-4 text-muted-foreground" />
                            <Badge className={statusColors[m.status]} variant="outline">{m.status}</Badge>
                            <span className="font-mono text-xs text-muted-foreground">{m.messageId}</span>
                            <span className="truncate max-w-[150px]">{m.recipientNames || m.recipientValue || "—"}</span>
                            {m.campaignName && <Badge variant="secondary" className="text-xs">{m.campaignName}</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{m.recipientCount}</span>
                            <span className="text-green-600">{m.totalDelivered || 0}D</span>
                            {(m.totalFailed || 0) > 0 && <span className="text-red-500">{m.totalFailed}F</span>}
                            <span>{m.sentAt ? new Date(m.sentAt).toLocaleString() : "—"}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-log-actions-${m.id}`}>
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setViewingMessage(m)} data-testid={`button-view-log-${m.id}`}>
                                  <Eye className="w-4 h-4 mr-2" /> View Details
                                </DropdownMenuItem>
                                {m.status === "failed" && (
                                  <DropdownMenuItem onClick={() => retryMutation.mutate(m.id)} data-testid={`button-retry-${m.id}`}>
                                    <RotateCcw className="w-4 h-4 mr-2" /> Retry Failed
                                  </DropdownMenuItem>
                                )}
                                {(m.status === "sending" || m.status === "queued" || m.status === "scheduled") && (
                                  <DropdownMenuItem onClick={() => cancelMutation.mutate(m.id)} data-testid={`button-cancel-${m.id}`}>
                                    <Ban className="w-4 h-4 mr-2" /> Cancel
                                  </DropdownMenuItem>
                                )}
                                {m.status === "draft" && (
                                  <DropdownMenuItem onClick={() => sendMutation.mutate(m.id)} data-testid={`button-send-draft-${m.id}`}>
                                    <Play className="w-4 h-4 mr-2" /> Send Now
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => deleteMutation.mutate(m.id)} className="text-red-600" data-testid={`button-delete-${m.id}`}>
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              {channelDistribution.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">By Channel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={channelDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                          {channelDistribution.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
              {statusDistribution.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">By Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                          {statusDistribution.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Message Composer Dialog */}
      <Dialog open={showComposer} onOpenChange={(open) => { if (!open) setShowComposer(false); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {composerChannel === "sim_sms" && <><Smartphone className="w-5 h-5 text-blue-600" /> Compose SIM SMS</>}
              {composerChannel === "email_sms" && <><Mail className="w-5 h-5 text-cyan-600" /> Compose Email SMS</>}
              {composerChannel === "whatsapp" && <><SiWhatsapp className="w-5 h-5 text-green-500" /> Compose WhatsApp Message</>}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="recipients">
            <TabsList className="w-full">
              <TabsTrigger value="recipients" className="flex-1">Recipients</TabsTrigger>
              <TabsTrigger value="message" className="flex-1">Message</TabsTrigger>
              <TabsTrigger value="delivery" className="flex-1">Delivery</TabsTrigger>
            </TabsList>

            {/* Recipients Tab */}
            <TabsContent value="recipients" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Recipient Type</Label>
                <Select value={msgForm.recipientType} onValueChange={v => setMsgForm({ ...msgForm, recipientType: v })}>
                  <SelectTrigger data-testid="select-recipient-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual Customer</SelectItem>
                    <SelectItem value="group">Customer Group</SelectItem>
                    <SelectItem value="city">By City / Branch</SelectItem>
                    <SelectItem value="plan">By Plan Type</SelectItem>
                    <SelectItem value="payment_status">By Payment Status</SelectItem>
                    <SelectItem value="staff">Staff Users</SelectItem>
                    <SelectItem value="manual">Manual Number Entry</SelectItem>
                    <SelectItem value="bulk_csv">Bulk Upload (CSV)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {msgForm.recipientType === "individual" && (
                <div className="space-y-2">
                  <Label>Select Customer</Label>
                  <Select onValueChange={v => {
                    const c = customers.find(c => String(c.id) === v);
                    if (c) setMsgForm({ ...msgForm, recipientValue: c.phone || c.phoneNumber || "", recipientNames: c.fullName, recipientCount: 1 });
                  }}>
                    <SelectTrigger data-testid="select-customer"><SelectValue placeholder="Choose a customer" /></SelectTrigger>
                    <SelectContent>
                      {customers.slice(0, 50).map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.fullName} — {c.phone || c.phoneNumber || "No phone"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {msgForm.recipientType === "manual" && (
                <div className="space-y-2">
                  <Label>Phone Number(s)</Label>
                  <Textarea value={msgForm.recipientValue} onChange={e => {
                    const nums = e.target.value.split(/[,\n]/).filter(Boolean);
                    setMsgForm({ ...msgForm, recipientValue: e.target.value, recipientCount: nums.length || 1 });
                  }} placeholder="Enter numbers separated by commas or new lines" rows={3} data-testid="input-manual-numbers" />
                  <p className="text-xs text-muted-foreground">{msgForm.recipientCount} number(s) entered</p>
                </div>
              )}

              {msgForm.recipientType === "city" && (
                <div className="space-y-2">
                  <Label>City / Branch</Label>
                  <Input value={msgForm.recipientValue} onChange={e => setMsgForm({ ...msgForm, recipientValue: e.target.value, recipientNames: `City: ${e.target.value}` })} placeholder="Enter city or branch name" data-testid="input-city" />
                </div>
              )}

              {msgForm.recipientType === "plan" && (
                <div className="space-y-2">
                  <Label>Plan / Package Type</Label>
                  <Select onValueChange={v => setMsgForm({ ...msgForm, recipientValue: v, recipientNames: `Plan: ${v}` })}>
                    <SelectTrigger data-testid="select-plan"><SelectValue placeholder="Select plan type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="dedicated">Dedicated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {msgForm.recipientType === "payment_status" && (
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select onValueChange={v => setMsgForm({ ...msgForm, recipientValue: v, recipientNames: `Status: ${v}` })}>
                    <SelectTrigger data-testid="select-payment-status"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid / Overdue</SelectItem>
                      <SelectItem value="partial">Partially Paid</SelectItem>
                      <SelectItem value="paid">Fully Paid</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(msgForm.recipientType === "group" || msgForm.recipientType === "staff") && (
                <div className="space-y-2">
                  <Label>{msgForm.recipientType === "group" ? "Customer Group" : "Staff Group"}</Label>
                  <Select onValueChange={v => setMsgForm({ ...msgForm, recipientValue: v, recipientNames: v })}>
                    <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {msgForm.recipientType === "group" ? "Customers" : "Staff"}</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">Advanced Filters</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <input type="checkbox" id="excl-suspended" className="rounded" />
                    <label htmlFor="excl-suspended">Exclude suspended</label>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <input type="checkbox" id="excl-unpaid" className="rounded" />
                    <label htmlFor="excl-unpaid">Exclude unpaid</label>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <input type="checkbox" id="active-only" className="rounded" />
                    <label htmlFor="active-only">Active only</label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Users className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-800">Estimated Recipients: <span className="font-bold">{msgForm.recipientCount}</span></p>
              </div>
            </TabsContent>

            {/* Message Tab */}
            <TabsContent value="message" className="space-y-4 mt-4">
              {composerChannel === "whatsapp" && (
                <div className="space-y-2">
                  <Label>Template (WhatsApp Approved)</Label>
                  <Select onValueChange={v => setMsgForm({ ...msgForm, templateId: v })}>
                    <SelectTrigger data-testid="select-wa-template"><SelectValue placeholder="Select template" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="billing_reminder">Billing Reminder</SelectItem>
                      <SelectItem value="payment_confirmation">Payment Confirmation</SelectItem>
                      <SelectItem value="service_update">Service Update</SelectItem>
                      <SelectItem value="outage_notification">Outage Notification</SelectItem>
                      <SelectItem value="welcome_message">Welcome Message</SelectItem>
                      <SelectItem value="custom">Custom Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(composerChannel === "email_sms" || composerChannel === "whatsapp") && (
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={msgForm.subject} onChange={e => setMsgForm({ ...msgForm, subject: e.target.value })} placeholder="Message subject" data-testid="input-msg-subject" />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Message Body *</Label>
                  <span className="text-xs text-muted-foreground">
                    {charCount} chars
                    {composerChannel === "sim_sms" && ` · ${smsSegments} segment(s)`}
                  </span>
                </div>
                <Textarea
                  value={msgForm.body}
                  onChange={e => setMsgForm({ ...msgForm, body: e.target.value })}
                  placeholder="Type your message here..."
                  rows={5}
                  data-testid="input-msg-body"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Personalization Variables</Label>
                <div className="flex flex-wrap gap-1">
                  {personalizationVars.map(v => (
                    <Badge key={v.key} variant="outline" className="cursor-pointer hover:bg-primary/10 text-xs" onClick={() => insertVariable(v.key)} data-testid={`button-insert-var-${v.key}`}>
                      {v.key}
                    </Badge>
                  ))}
                </div>
              </div>

              {composerChannel === "whatsapp" && (
                <>
                  <div className="space-y-2">
                    <Label>Media Attachment URL</Label>
                    <Input value={msgForm.mediaUrl} onChange={e => setMsgForm({ ...msgForm, mediaUrl: e.target.value })} placeholder="https://example.com/image.jpg" data-testid="input-media-url" />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Button Text</Label>
                    <Input value={msgForm.ctaButton} onChange={e => setMsgForm({ ...msgForm, ctaButton: e.target.value })} placeholder="e.g., Pay Now" data-testid="input-cta" />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Include Payment Link</p>
                  <p className="text-xs text-muted-foreground">Auto-append payment URL for the customer</p>
                </div>
                <Switch checked={msgForm.paymentLink} onCheckedChange={v => setMsgForm({ ...msgForm, paymentLink: v })} data-testid="switch-payment-link" />
              </div>
            </TabsContent>

            {/* Delivery Tab */}
            <TabsContent value="delivery" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Campaign Name (optional)</Label>
                <Input value={msgForm.campaignName} onChange={e => setMsgForm({ ...msgForm, campaignName: e.target.value })} placeholder="e.g., March Billing Reminder" data-testid="input-campaign-name" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Schedule Date & Time</Label>
                  <Input type="datetime-local" value={msgForm.scheduledAt} onChange={e => setMsgForm({ ...msgForm, scheduledAt: e.target.value })} data-testid="input-schedule-at" />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Time</Label>
                  <Input type="datetime-local" value={msgForm.expiryAt} onChange={e => setMsgForm({ ...msgForm, expiryAt: e.target.value })} data-testid="input-expiry-at" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Recurring Broadcast</p>
                  <p className="text-xs text-muted-foreground">Repeat on a schedule</p>
                </div>
                <Switch checked={msgForm.recurring} onCheckedChange={v => setMsgForm({ ...msgForm, recurring: v })} data-testid="switch-recurring" />
              </div>

              {msgForm.recurring && (
                <div className="space-y-2">
                  <Label>Recurring Pattern</Label>
                  <Select value={msgForm.recurringPattern} onValueChange={v => setMsgForm({ ...msgForm, recurringPattern: v })}>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sending Speed (msg/sec)</Label>
                  <Select value={String(msgForm.sendingSpeed)} onValueChange={v => setMsgForm({ ...msgForm, sendingSpeed: parseInt(v) })}>
                    <SelectTrigger data-testid="select-speed"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5/sec (Slow)</SelectItem>
                      <SelectItem value="10">10/sec (Normal)</SelectItem>
                      <SelectItem value="25">25/sec (Fast)</SelectItem>
                      <SelectItem value="50">50/sec (Burst)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Batch Size</Label>
                  <Input type="number" value={msgForm.batchSize} onChange={e => setMsgForm({ ...msgForm, batchSize: parseInt(e.target.value) || 50 })} data-testid="input-batch-size" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fallback Channel</Label>
                <Select value={msgForm.fallbackChannel} onValueChange={v => setMsgForm({ ...msgForm, fallbackChannel: v })}>
                  <SelectTrigger data-testid="select-fallback"><SelectValue placeholder="No fallback" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Fallback</SelectItem>
                    {composerChannel !== "sim_sms" && <SelectItem value="sim_sms">SIM SMS</SelectItem>}
                    {composerChannel !== "email_sms" && <SelectItem value="email_sms">Email SMS</SelectItem>}
                    {composerChannel !== "whatsapp" && <SelectItem value="whatsapp">WhatsApp</SelectItem>}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">If primary channel fails, retry via fallback</p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-sm font-medium text-emerald-800">Delivery Flow</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-emerald-700">
                  <Badge variant="outline" className="border-emerald-300">{channelLabels[composerChannel]}</Badge>
                  <ChevronRight className="w-3 h-3" />
                  <span>Validate Recipients</span>
                  <ChevronRight className="w-3 h-3" />
                  <span>Personalize</span>
                  <ChevronRight className="w-3 h-3" />
                  <span>Send</span>
                  {msgForm.fallbackChannel && msgForm.fallbackChannel !== "none" && (
                    <>
                      <ChevronRight className="w-3 h-3" />
                      <Badge variant="outline" className="border-emerald-300">Fallback: {channelLabels[msgForm.fallbackChannel] || msgForm.fallbackChannel}</Badge>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowComposer(false)}>Cancel</Button>
            <Button variant="outline" onClick={handleSaveDraft} disabled={!msgForm.body || createMutation.isPending} data-testid="button-save-draft">
              Save Draft
            </Button>
            {msgForm.scheduledAt && (
              <Button variant="outline" onClick={handleSchedule} disabled={!msgForm.body || createMutation.isPending} className="border-blue-200 text-blue-700" data-testid="button-schedule">
                <Calendar className="w-4 h-4 mr-2" /> Schedule
              </Button>
            )}
            <Button
              onClick={handleSendNow}
              disabled={!msgForm.body || !msgForm.recipientValue || createMutation.isPending || sendMutation.isPending}
              className={composerChannel === "whatsapp" ? "bg-gradient-to-r from-green-500 to-teal-600 text-white" : "bg-gradient-to-r from-[#1E3A8A] to-[#059669] text-white"}
              data-testid="button-send-now"
            >
              {(createMutation.isPending || sendMutation.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Message Details Dialog */}
      <Dialog open={!!viewingMessage} onOpenChange={(open) => { if (!open) setViewingMessage(null); }}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          {viewingMessage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => { const Icon = channelIcons[viewingMessage.channel] || MessageSquare; return <Icon className="w-5 h-5" />; })()}
                  Message Details
                  <Badge className={statusColors[viewingMessage.status]}>{viewingMessage.status}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Message ID:</span> <span className="font-mono ml-1">{viewingMessage.messageId}</span></div>
                  <div><span className="text-muted-foreground">Channel:</span> <span className="ml-1">{channelLabels[viewingMessage.channel]}</span></div>
                  <div><span className="text-muted-foreground">Recipient:</span> <span className="ml-1">{viewingMessage.recipientNames || viewingMessage.recipientValue || "—"}</span></div>
                  <div><span className="text-muted-foreground">Count:</span> <span className="ml-1">{viewingMessage.recipientCount}</span></div>
                  <div><span className="text-muted-foreground">Sent At:</span> <span className="ml-1">{viewingMessage.sentAt ? new Date(viewingMessage.sentAt).toLocaleString() : "—"}</span></div>
                  <div><span className="text-muted-foreground">Completed:</span> <span className="ml-1">{viewingMessage.completedAt ? new Date(viewingMessage.completedAt).toLocaleString() : "—"}</span></div>
                  {viewingMessage.campaignName && <div className="col-span-2"><span className="text-muted-foreground">Campaign:</span> <span className="ml-1">{viewingMessage.campaignName}</span></div>}
                  {viewingMessage.fallbackChannel && <div><span className="text-muted-foreground">Fallback:</span> <span className="ml-1">{channelLabels[viewingMessage.fallbackChannel] || viewingMessage.fallbackChannel}</span></div>}
                </div>

                {viewingMessage.body && (
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-xs text-muted-foreground mb-1">Message Body</p>
                    <p className="text-sm whitespace-pre-wrap">{viewingMessage.body}</p>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-3 pt-3 border-t">
                  <div className="text-center p-3 rounded-lg bg-blue-50">
                    <p className="text-xl font-bold text-blue-600">{viewingMessage.totalSent || 0}</p>
                    <p className="text-xs text-muted-foreground">Sent</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-50">
                    <p className="text-xl font-bold text-green-600">{viewingMessage.totalDelivered || 0}</p>
                    <p className="text-xs text-muted-foreground">Delivered</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50">
                    <p className="text-xl font-bold text-red-500">{viewingMessage.totalFailed || 0}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-amber-50">
                    <p className="text-xl font-bold text-amber-600">{viewingMessage.totalPending || 0}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {viewingMessage.status === "failed" && (
                    <Button size="sm" variant="outline" onClick={() => { retryMutation.mutate(viewingMessage.id); setViewingMessage(null); }} data-testid="button-retry-detail">
                      <RotateCcw className="w-4 h-4 mr-2" /> Retry Failed
                    </Button>
                  )}
                  {(viewingMessage.status === "sending" || viewingMessage.status === "scheduled") && (
                    <Button size="sm" variant="outline" onClick={() => { cancelMutation.mutate(viewingMessage.id); setViewingMessage(null); }} data-testid="button-cancel-detail">
                      <Ban className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
