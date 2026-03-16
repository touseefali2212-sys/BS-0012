import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CreditCard, Shield, Zap, Globe, Settings, BarChart3, Plus, Save, Trash2,
  Loader2, Key, Lock, Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Search, Download, Wallet, Building2, Link2, Webhook,
  DollarSign, Receipt, Clock, ArrowUpRight, Send, Filter, Banknote,
  ChevronRight, Copy, Hash, Activity
} from "lucide-react";
import type { PaymentGateway, GatewayWebhook, GatewaySettlement, GeneralSetting, Payment } from "@shared/schema";

const GATEWAY_TYPES = [
  { value: "bank_integration", label: "Bank Payment Gateway", icon: Building2, color: "bg-blue-500" },
  { value: "card_payment", label: "Credit/Debit Card", icon: CreditCard, color: "bg-purple-500" },
  { value: "wallet", label: "Mobile Wallet", icon: Wallet, color: "bg-amber-500" },
  { value: "online_gateway", label: "Direct Bank Transfer", icon: Globe, color: "bg-teal-500" },
  { value: "manual_link", label: "Local PSP Integration", icon: Link2, color: "bg-slate-500" },
];

const WEBHOOK_EVENTS = [
  { value: "payment_success", label: "Payment Success" },
  { value: "payment_failed", label: "Payment Failed" },
  { value: "refund_processed", label: "Refund Processed" },
  { value: "chargeback", label: "Chargeback" },
  { value: "settlement_completed", label: "Settlement Completed" },
];

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  testing: { label: "Sandbox", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  disabled: { label: "Disconnected", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  pending: { label: "Pending", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  limited: { label: "Limited", cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
};

export default function PaymentGatewaySettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("config");
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [webhookDialog, setWebhookDialog] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<GatewayWebhook | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [logSearch, setLogSearch] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState("all");
  const [logGatewayFilter, setLogGatewayFilter] = useState("all");

  const { data: gateways = [], isLoading: gatewaysLoading } = useQuery<PaymentGateway[]>({
    queryKey: ["/api/payment-gateways"],
  });

  const { data: webhooks = [] } = useQuery<GatewayWebhook[]>({
    queryKey: ["/api/gateway-webhooks"],
  });

  const { data: settlements = [] } = useQuery<GatewaySettlement[]>({
    queryKey: ["/api/gateway-settlements"],
  });

  const { data: payments = [] } = useQuery<(Payment & { customerName?: string })[]>({
    queryKey: ["/api/payments"],
  });

  const { data: pgSettings = [] } = useQuery<GeneralSetting[]>({
    queryKey: ["/api/payment-gateway-settings"],
  });

  function getSettingValue(key: string, defaultValue: string = ""): string {
    const setting = pgSettings.find(s => s.settingKey === key);
    return setting?.settingValue || defaultValue;
  }

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: { settingKey: string; settingValue: string; category: string }[]) => {
      await apiRequest("PUT", "/api/payment-gateway-settings", { settings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-gateway-settings"] });
      toast({ title: "Settings Saved", description: "Payment gateway settings updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  const updateGatewayMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PATCH", `/api/payment-gateways/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-gateways"] });
      toast({ title: "Gateway Updated", description: "Configuration saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update gateway.", variant: "destructive" });
    },
  });

  const saveWebhookMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const { id, ...rest } = data;
        await apiRequest("PATCH", `/api/gateway-webhooks/${id}`, rest);
      } else {
        await apiRequest("POST", "/api/gateway-webhooks", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gateway-webhooks"] });
      setWebhookDialog(false);
      setEditingWebhook(null);
      toast({ title: "Webhook Saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save webhook.", variant: "destructive" });
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/gateway-webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gateway-webhooks"] });
      toast({ title: "Webhook Deleted" });
    },
  });

  const [webhookForm, setWebhookForm] = useState({
    gatewayId: 0,
    eventType: "payment_success",
    webhookUrl: "",
    enabled: true,
    retryOnFailure: true,
    maxRetries: 3,
    notifyAdminOnFailure: true,
  });

  function openWebhookDialog(webhook?: GatewayWebhook) {
    if (webhook) {
      setEditingWebhook(webhook);
      setWebhookForm({
        gatewayId: webhook.gatewayId,
        eventType: webhook.eventType,
        webhookUrl: webhook.webhookUrl,
        enabled: webhook.enabled,
        retryOnFailure: webhook.retryOnFailure ?? true,
        maxRetries: webhook.maxRetries ?? 3,
        notifyAdminOnFailure: webhook.notifyAdminOnFailure ?? true,
      });
    } else {
      setEditingWebhook(null);
      setWebhookForm({
        gatewayId: selectedGateway?.id || (gateways[0]?.id || 0),
        eventType: "payment_success",
        webhookUrl: "",
        enabled: true,
        retryOnFailure: true,
        maxRetries: 3,
        notifyAdminOnFailure: true,
      });
    }
    setWebhookDialog(true);
  }

  function handleSaveWebhook() {
    const data: any = { ...webhookForm };
    if (editingWebhook) data.id = editingWebhook.id;
    saveWebhookMutation.mutate(data);
  }

  const gwWebhooks = useMemo(() => {
    if (!selectedGateway) return webhooks;
    return webhooks.filter(w => w.gatewayId === selectedGateway.id);
  }, [webhooks, selectedGateway]);

  const gwSettlements = useMemo(() => {
    if (!selectedGateway) return settlements;
    return settlements.filter(s => s.gatewayId === selectedGateway.id);
  }, [settlements, selectedGateway]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (logStatusFilter !== "all" && p.status !== logStatusFilter) return false;
      if (logGatewayFilter !== "all" && p.gateway !== logGatewayFilter) return false;
      if (logSearch) {
        const s = logSearch.toLowerCase();
        if (!p.paymentId?.toLowerCase().includes(s) && !(p as any).customerName?.toLowerCase().includes(s) && !p.transactionRef?.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [payments, logSearch, logStatusFilter, logGatewayFilter]);

  const kpis = useMemo(() => {
    const active = gateways.filter(g => g.status === "active" && g.isActive).length;
    const sandbox = gateways.filter(g => g.mode === "test").length;
    const totalTxn = gateways.reduce((s, g) => s + (g.totalTransactions || 0), 0);
    const totalVol = gateways.reduce((s, g) => s + parseFloat(g.monthlyCollection || "0"), 0);
    return { active, sandbox, totalTxn, totalVol };
  }, [gateways]);

  const txnStatusBadge = (status: string) => {
    const map: Record<string, { icon: any; cls: string }> = {
      completed: { icon: CheckCircle2, cls: "text-green-600" },
      failed: { icon: XCircle, cls: "text-red-600" },
      pending: { icon: Clock, cls: "text-yellow-600" },
      refunded: { icon: RefreshCw, cls: "text-blue-600" },
    };
    const s = map[status] || map.pending;
    const Icon = s.icon;
    return <span className={`flex items-center gap-1 text-xs ${s.cls}`}><Icon className="h-3 w-3" />{status}</span>;
  };

  if (gatewaysLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="payment-gateway-settings-page">
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#0D9488] rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3" data-testid="page-title">
              <CreditCard className="h-7 w-7" />
              Payment Gateway Settings
            </h1>
            <p className="mt-1 text-blue-100 text-sm">
              Configure, secure, and monitor all online payment integrations
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold" data-testid="stat-active">{kpis.active}</div>
              <div className="text-xs text-blue-200">Active</div>
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold" data-testid="stat-sandbox">{kpis.sandbox}</div>
              <div className="text-xs text-blue-200">Sandbox</div>
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold" data-testid="stat-transactions">{kpis.totalTxn}</div>
              <div className="text-xs text-blue-200">Transactions</div>
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold" data-testid="stat-volume">Rs. {(kpis.totalVol / 1000).toFixed(0)}K</div>
              <div className="text-xs text-blue-200">Volume</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-72 flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground">GATEWAYS</h3>
          </div>
          {gateways.length === 0 ? (
            <Card>
              <CardContent className="py-8 flex flex-col items-center text-muted-foreground">
                <CreditCard className="h-8 w-8 mb-2" />
                <p className="text-sm">No gateways configured</p>
                <p className="text-xs mt-1">Use Payment Gateway page to add gateways</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card
                className={`cursor-pointer transition-all hover:shadow-md ${!selectedGateway ? "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20" : ""}`}
                onClick={() => setSelectedGateway(null)}
                data-testid="card-all-gateways"
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-[#1E3A8A] to-[#0D9488] text-white">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">All Gateways</div>
                      <div className="text-xs text-muted-foreground">{gateways.length} configured</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {gateways.map(gw => {
                const gwType = GATEWAY_TYPES.find(t => t.value === gw.providerType);
                const Icon = gwType?.icon || CreditCard;
                const st = STATUS_CONFIG[gw.status] || STATUS_CONFIG.disabled;
                return (
                  <Card
                    key={gw.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedGateway?.id === gw.id ? "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20" : ""}`}
                    onClick={() => setSelectedGateway(gw)}
                    data-testid={`card-gateway-${gw.id}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg text-white ${gwType?.color || "bg-gray-500"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-sm" data-testid={`text-gw-name-${gw.id}`}>{gw.name}</div>
                            <div className="text-xs text-muted-foreground">{gw.provider}</div>
                          </div>
                        </div>
                        <Badge className={st.cls} data-testid={`badge-gw-status-${gw.id}`}>{st.label}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-6 w-full" data-testid="tabs-list">
              <TabsTrigger value="config" className="flex items-center gap-1 text-xs" data-testid="tab-config">
                <Settings className="h-3.5 w-3.5" /> Config
              </TabsTrigger>
              <TabsTrigger value="credentials" className="flex items-center gap-1 text-xs" data-testid="tab-credentials">
                <Key className="h-3.5 w-3.5" /> API & Security
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-1 text-xs" data-testid="tab-rules">
                <Zap className="h-3.5 w-3.5" /> Rules
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="flex items-center gap-1 text-xs" data-testid="tab-webhooks">
                <Webhook className="h-3.5 w-3.5" /> Webhooks
              </TabsTrigger>
              <TabsTrigger value="settlement" className="flex items-center gap-1 text-xs" data-testid="tab-settlement">
                <DollarSign className="h-3.5 w-3.5" /> Settlement
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-1 text-xs" data-testid="tab-logs">
                <BarChart3 className="h-3.5 w-3.5" /> Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="mt-4">
              <GatewayConfigTab
                gateways={selectedGateway ? [selectedGateway] : gateways}
                onUpdate={(id, data) => updateGatewayMutation.mutate({ id, data })}
                saving={updateGatewayMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="credentials" className="mt-4">
              <ApiCredentialsTab
                gateways={selectedGateway ? [selectedGateway] : gateways}
                showKeys={showKeys}
                toggleKey={(k) => setShowKeys(p => ({ ...p, [k]: !p[k] }))}
                onUpdate={(id, data) => updateGatewayMutation.mutate({ id, data })}
                saving={updateGatewayMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="rules" className="mt-4">
              <ProcessingRulesTab
                gateways={selectedGateway ? [selectedGateway] : gateways}
                onUpdate={(id, data) => updateGatewayMutation.mutate({ id, data })}
                saving={updateGatewayMutation.isPending}
                pgSettings={pgSettings}
                onSaveSettings={(s) => saveSettingsMutation.mutate(s)}
                settingsSaving={saveSettingsMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="webhooks" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold" data-testid="webhooks-title">Webhook & Callback Management</h2>
                  <Button onClick={() => openWebhookDialog()} className="bg-blue-700 hover:bg-blue-800" data-testid="button-add-webhook" disabled={gateways.length === 0}>
                    <Plus className="h-4 w-4 mr-1" /> Add Webhook
                  </Button>
                </div>

                {gwWebhooks.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Webhook className="h-10 w-10 mb-2" />
                      <p>No webhooks configured</p>
                      <Button onClick={() => openWebhookDialog()} variant="outline" className="mt-3" data-testid="button-add-first-webhook" disabled={gateways.length === 0}>
                        <Plus className="h-4 w-4 mr-1" /> Add First Webhook
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {WEBHOOK_EVENTS.map(ev => {
                      const evWebhooks = gwWebhooks.filter(w => w.eventType === ev.value);
                      if (evWebhooks.length === 0) return null;
                      return (
                        <Card key={ev.value} data-testid={`card-webhook-event-${ev.value}`}>
                          <CardHeader className="py-3 px-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/30 border-b">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              <Webhook className="h-3.5 w-3.5 text-teal-500" />
                              {ev.label}
                              <Badge variant="secondary" className="ml-auto">{evWebhooks.length}</Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="divide-y">
                              {evWebhooks.map(wh => (
                                <div key={wh.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50" data-testid={`row-webhook-${wh.id}`}>
                                  <div className="flex items-center gap-3">
                                    <Switch
                                      checked={wh.enabled}
                                      onCheckedChange={(checked) => saveWebhookMutation.mutate({ id: wh.id, enabled: checked })}
                                      data-testid={`switch-webhook-${wh.id}`}
                                    />
                                    <div>
                                      <div className="font-mono text-xs text-muted-foreground">{wh.webhookUrl}</div>
                                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                                        <span>Gateway: {gateways.find(g => g.id === wh.gatewayId)?.name || "N/A"}</span>
                                        {wh.retryOnFailure && <Badge variant="outline" className="text-[10px] py-0">Retry: {wh.maxRetries}x</Badge>}
                                        {wh.totalDelivered != null && <span className="text-green-600">{wh.totalDelivered} delivered</span>}
                                        {wh.totalFailed != null && wh.totalFailed > 0 && <span className="text-red-600">{wh.totalFailed} failed</span>}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => openWebhookDialog(wh)} data-testid={`button-edit-webhook-${wh.id}`}>Edit</Button>
                                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteWebhookMutation.mutate(wh.id)} data-testid={`button-delete-webhook-${wh.id}`}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                <Card className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/10 dark:to-blue-900/10 border-teal-200 dark:border-teal-800">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-teal-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-teal-800 dark:text-teal-400">Real-Time Reconciliation</h4>
                        <p className="text-sm text-teal-700 dark:text-teal-500 mt-1">
                          Webhooks enable instant invoice reconciliation. When payment is confirmed, invoice is auto-marked as paid and receipt is sent via configured notification channels.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settlement" className="mt-4">
              <SettlementTab
                gateways={selectedGateway ? [selectedGateway] : gateways}
                settlements={gwSettlements}
                onUpdate={(id, data) => updateGatewayMutation.mutate({ id, data })}
                saving={updateGatewayMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="logs" className="mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Total", val: payments.length, icon: Send, color: "blue" },
                    { label: "Completed", val: payments.filter(p => p.status === "completed").length, icon: CheckCircle2, color: "green" },
                    { label: "Failed", val: payments.filter(p => p.status === "failed").length, icon: XCircle, color: "red" },
                    { label: "Pending", val: payments.filter(p => p.status === "pending").length, icon: Clock, color: "yellow" },
                  ].map((s, i) => (
                    <Card key={i} className={`bg-gradient-to-br from-${s.color}-50 to-${s.color}-100 dark:from-${s.color}-900/20 dark:to-${s.color}-800/10 border-${s.color}-200 dark:border-${s.color}-800`}>
                      <CardContent className="p-4 text-center">
                        <s.icon className={`h-6 w-6 text-${s.color}-600 mx-auto mb-1`} />
                        <div className={`text-2xl font-bold text-${s.color}-700 dark:text-${s.color}-400`} data-testid={`log-stat-${s.label.toLowerCase()}`}>{s.val}</div>
                        <div className={`text-xs text-${s.color}-600`}>{s.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">Transaction Logs</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input placeholder="Search..." value={logSearch} onChange={(e) => setLogSearch(e.target.value)} className="pl-9 w-48" data-testid="input-log-search" />
                        </div>
                        <Select value={logStatusFilter} onValueChange={setLogStatusFilter}>
                          <SelectTrigger className="w-28" data-testid="select-log-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={logGatewayFilter} onValueChange={setLogGatewayFilter}>
                          <SelectTrigger className="w-32" data-testid="select-log-gateway">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Gateways</SelectItem>
                            {gateways.map(g => (
                              <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" data-testid="button-export-logs">
                          <Download className="h-4 w-4 mr-1" /> Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredPayments.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-muted-foreground">
                        <BarChart3 className="h-10 w-10 mb-2" />
                        <p>No transactions found</p>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gradient-to-r from-[#1E3A8A] to-[#0D9488] text-white">
                              <th className="px-3 py-2 text-left font-medium">Transaction ID</th>
                              <th className="px-3 py-2 text-left font-medium">Customer</th>
                              <th className="px-3 py-2 text-left font-medium">Method</th>
                              <th className="px-3 py-2 text-left font-medium">Gateway</th>
                              <th className="px-3 py-2 text-right font-medium">Amount</th>
                              <th className="px-3 py-2 text-left font-medium">Status</th>
                              <th className="px-3 py-2 text-left font-medium">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {filteredPayments.slice(0, 50).map((p) => (
                              <tr key={p.id} className="hover:bg-muted/50" data-testid={`row-txn-${p.id}`}>
                                <td className="px-3 py-2 font-mono text-xs">{p.paymentId}</td>
                                <td className="px-3 py-2">{(p as any).customerName || `Customer #${p.customerId}`}</td>
                                <td className="px-3 py-2"><Badge variant="outline">{p.method}</Badge></td>
                                <td className="px-3 py-2 text-xs">{p.gateway || "-"}</td>
                                <td className="px-3 py-2 text-right font-medium">Rs. {parseFloat(p.amount).toLocaleString()}</td>
                                <td className="px-3 py-2">{txnStatusBadge(p.status)}</td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">{p.paidAt}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={webhookDialog} onOpenChange={setWebhookDialog}>
        <DialogContent className="max-w-lg" data-testid="dialog-webhook">
          <DialogHeader>
            <DialogTitle>{editingWebhook ? "Edit Webhook" : "Add Webhook"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Gateway</Label>
                <Select value={String(webhookForm.gatewayId)} onValueChange={(v) => setWebhookForm(p => ({ ...p, gatewayId: parseInt(v) }))}>
                  <SelectTrigger data-testid="select-webhook-gateway">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {gateways.map(g => (
                      <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Event Type</Label>
                <Select value={webhookForm.eventType} onValueChange={(v) => setWebhookForm(p => ({ ...p, eventType: v }))}>
                  <SelectTrigger data-testid="select-webhook-event">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEBHOOK_EVENTS.map(ev => (
                      <SelectItem key={ev.value} value={ev.value}>{ev.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Webhook URL</Label>
              <Input
                value={webhookForm.webhookUrl}
                onChange={(e) => setWebhookForm(p => ({ ...p, webhookUrl: e.target.value }))}
                placeholder="https://your-domain.com/webhook/payment"
                data-testid="input-webhook-url"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Enabled</Label>
                <p className="text-xs text-muted-foreground">Activate this webhook</p>
              </div>
              <Switch checked={webhookForm.enabled} onCheckedChange={(v) => setWebhookForm(p => ({ ...p, enabled: v }))} data-testid="switch-webhook-enabled" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Retry on Failure</Label>
                <p className="text-xs text-muted-foreground">Automatically retry failed webhook deliveries</p>
              </div>
              <Switch checked={webhookForm.retryOnFailure} onCheckedChange={(v) => setWebhookForm(p => ({ ...p, retryOnFailure: v }))} data-testid="switch-webhook-retry" />
            </div>
            {webhookForm.retryOnFailure && (
              <div className="space-y-1.5">
                <Label>Max Retries</Label>
                <Input type="number" value={webhookForm.maxRetries} onChange={(e) => setWebhookForm(p => ({ ...p, maxRetries: parseInt(e.target.value) || 3 }))} data-testid="input-webhook-retries" />
              </div>
            )}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Notify Admin on Failure</Label>
                <p className="text-xs text-muted-foreground">Send alert when webhook delivery fails</p>
              </div>
              <Switch checked={webhookForm.notifyAdminOnFailure} onCheckedChange={(v) => setWebhookForm(p => ({ ...p, notifyAdminOnFailure: v }))} data-testid="switch-webhook-notify" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWebhookDialog(false)} data-testid="button-cancel-webhook">Cancel</Button>
            <Button onClick={handleSaveWebhook} disabled={saveWebhookMutation.isPending || !webhookForm.webhookUrl} className="bg-blue-700 hover:bg-blue-800" data-testid="button-save-webhook">
              {saveWebhookMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              {editingWebhook ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GatewayConfigTab({ gateways, onUpdate, saving }: {
  gateways: PaymentGateway[];
  onUpdate: (id: number, data: any) => void;
  saving: boolean;
}) {
  if (gateways.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center text-muted-foreground">
        <Settings className="h-10 w-10 mx-auto mb-2" />
        <p>No gateways to configure</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" data-testid="config-title">Gateway Configuration</h2>
      {gateways.map(gw => {
        const gwType = GATEWAY_TYPES.find(t => t.value === gw.providerType);
        const Icon = gwType?.icon || CreditCard;
        return (
          <Card key={gw.id} data-testid={`config-card-${gw.id}`}>
            <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/30 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className={`p-1.5 rounded text-white ${gwType?.color || "bg-gray-500"}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  {gw.name}
                  <Badge className={STATUS_CONFIG[gw.status]?.cls || ""}>{STATUS_CONFIG[gw.status]?.label || gw.status}</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Active</span>
                  <Switch
                    checked={gw.isActive}
                    onCheckedChange={(v) => onUpdate(gw.id, { isActive: v })}
                    data-testid={`switch-active-${gw.id}`}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Provider</Label>
                  <div className="font-medium text-sm">{gw.provider}</div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <div className="font-medium text-sm">{gwType?.label || gw.providerType}</div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Environment</Label>
                  <Select value={gw.mode} onValueChange={(v) => onUpdate(gw.id, { mode: v })}>
                    <SelectTrigger className="h-8" data-testid={`select-env-${gw.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">Sandbox</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={gw.status} onValueChange={(v) => onUpdate(gw.id, { status: v })}>
                    <SelectTrigger className="h-8" data-testid={`select-status-${gw.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="testing">Sandbox Mode</SelectItem>
                      <SelectItem value="disabled">Disconnected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Gateway Charge %</Label>
                  <div className="font-medium text-sm">{gw.gatewayChargePercent || "0"}%</div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Total Transactions</Label>
                  <div className="font-medium text-sm">{gw.totalTransactions || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ApiCredentialsTab({ gateways, showKeys, toggleKey, onUpdate, saving }: {
  gateways: PaymentGateway[];
  showKeys: Record<string, boolean>;
  toggleKey: (k: string) => void;
  onUpdate: (id: number, data: any) => void;
  saving: boolean;
}) {
  if (gateways.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center text-muted-foreground">
        <Key className="h-10 w-10 mx-auto mb-2" />
        <p>Select a gateway to manage credentials</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" data-testid="credentials-title">API & Security Settings</h2>
      {gateways.map(gw => (
        <Card key={gw.id} data-testid={`credentials-card-${gw.id}`}>
          <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/30 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-blue-600" />
              {gw.name} — Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "API Key", field: "apiKey", value: gw.apiKey },
                { label: "Secret Key", field: "apiSecret", value: gw.apiSecret },
                { label: "Merchant ID", field: "merchantId", value: gw.merchantId },
                { label: "Public Key", field: "publicKey", value: gw.publicKey },
              ].map(cred => (
                <div key={cred.field} className="space-y-1.5">
                  <Label className="text-xs">{cred.label}</Label>
                  <div className="flex gap-1">
                    <Input
                      type={showKeys[`${gw.id}-${cred.field}`] ? "text" : "password"}
                      value={cred.value || ""}
                      readOnly
                      className="font-mono text-xs"
                      data-testid={`input-${cred.field}-${gw.id}`}
                    />
                    <Button size="sm" variant="ghost" onClick={() => toggleKey(`${gw.id}-${cred.field}`)} data-testid={`button-toggle-${cred.field}-${gw.id}`}>
                      {showKeys[`${gw.id}-${cred.field}`] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Callback URL</Label>
                <div className="flex gap-1">
                  <Input value={gw.callbackUrl || ""} readOnly className="font-mono text-xs" data-testid={`input-callback-${gw.id}`} />
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(gw.callbackUrl || ""); }} data-testid={`button-copy-callback-${gw.id}`}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Webhook URL</Label>
                <div className="flex gap-1">
                  <Input value={gw.webhookUrl || ""} readOnly className="font-mono text-xs" data-testid={`input-webhook-url-${gw.id}`} />
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(gw.webhookUrl || ""); }} data-testid={`button-copy-webhook-${gw.id}`}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" /> Security Features
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "IP Validation", field: "ipValidation", value: gw.ipValidation },
                  { label: "Duplicate Prevention", field: "duplicatePrevention", value: gw.duplicatePrevention },
                  { label: "Webhook Verification", field: "webhookVerification", value: gw.webhookVerification },
                  { label: "Encrypt Credentials", field: "encryptCredentials", value: gw.encryptCredentials },
                ].map(sec => (
                  <div key={sec.field} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                    <Label className="text-xs">{sec.label}</Label>
                    <Switch
                      checked={sec.value}
                      onCheckedChange={(v) => onUpdate(gw.id, { [sec.field]: v })}
                      data-testid={`switch-${sec.field}-${gw.id}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/10 dark:to-teal-900/10 border-blue-200 dark:border-blue-800">
              <CardContent className="p-3 flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-400">PCI-Compliant Configuration</span>
                  <span className="text-xs text-blue-700 dark:text-blue-500 ml-2">SSL verification enabled • Token validation active</span>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProcessingRulesTab({ gateways, onUpdate, saving, pgSettings, onSaveSettings, settingsSaving }: {
  gateways: PaymentGateway[];
  onUpdate: (id: number, data: any) => void;
  saving: boolean;
  pgSettings: GeneralSetting[];
  onSaveSettings: (s: any[]) => void;
  settingsSaving: boolean;
}) {
  const getSettingValue = (key: string, def: string = "") => {
    const s = pgSettings.find(s => s.settingKey === key);
    return s?.settingValue || def;
  };

  const [rulesForm, setRulesForm] = useState<Record<string, string>>({
    pg_min_payment: getSettingValue("pg_min_payment", "100"),
    pg_max_payment: getSettingValue("pg_max_payment", "500000"),
    pg_currency_conversion: getSettingValue("pg_currency_conversion", "1.0"),
    pg_transaction_timeout: getSettingValue("pg_transaction_timeout", "300"),
    pg_auto_cancel_unpaid: getSettingValue("pg_auto_cancel_unpaid", "true"),
    pg_refund_support: getSettingValue("pg_refund_support", "true"),
    pg_retry_failed: getSettingValue("pg_retry_failed", "true"),
    pg_overpayment_handling: getSettingValue("pg_overpayment_handling", "credit"),
  });

  function handleSaveRules() {
    const settings = Object.entries(rulesForm).map(([key, value]) => ({
      settingKey: key,
      settingValue: value,
      category: "payment_gateway_rules",
    }));
    onSaveSettings(settings);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" data-testid="rules-title">Payment Processing Rules</h2>
        <Button onClick={handleSaveRules} disabled={settingsSaving} className="bg-blue-700 hover:bg-blue-800" data-testid="button-save-rules">
          {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save Rules
        </Button>
      </div>

      {gateways.map(gw => (
        <Card key={gw.id} data-testid={`rules-card-${gw.id}`}>
          <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/30 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-teal-500" />
              {gw.name} — Automation Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Auto-Generate Receipt", field: "autoSendReceipt", value: gw.autoSendReceipt },
                { label: "Auto-Mark Invoice Paid", field: "autoMarkPaid", value: gw.autoMarkPaid },
                { label: "Partial Payment", field: "partialPayment", value: gw.partialPayment },
                { label: "Late Fee Automation", field: "autoApplyLateFee", value: gw.autoApplyLateFee },
                { label: "Auto-Adjust Credit", field: "autoAdjustCredit", value: gw.autoAdjustCredit },
                { label: "Auto-Generate Income", field: "autoGenerateIncome", value: gw.autoGenerateIncome },
              ].map(rule => (
                <div key={rule.field} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs">{rule.label}</Label>
                  <Switch
                    checked={rule.value}
                    onCheckedChange={(v) => onUpdate(gw.id, { [rule.field]: v })}
                    data-testid={`switch-rule-${rule.field}-${gw.id}`}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Max Transaction Limit</Label>
                <div className="text-sm font-medium">Rs. {parseFloat(gw.maxTransactionLimit || "0").toLocaleString()}</div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Daily Transaction Cap</Label>
                <div className="text-sm font-medium">Rs. {parseFloat(gw.dailyTransactionCap || "0").toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Settings className="h-3.5 w-3.5 text-teal-500" /> Global Processing Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Minimum Payment (Rs.)</Label>
              <Input type="number" value={rulesForm.pg_min_payment} onChange={(e) => setRulesForm(p => ({ ...p, pg_min_payment: e.target.value }))} data-testid="input-min-payment" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Maximum Payment (Rs.)</Label>
              <Input type="number" value={rulesForm.pg_max_payment} onChange={(e) => setRulesForm(p => ({ ...p, pg_max_payment: e.target.value }))} data-testid="input-max-payment" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Currency Conversion Rate</Label>
              <Input value={rulesForm.pg_currency_conversion} onChange={(e) => setRulesForm(p => ({ ...p, pg_currency_conversion: e.target.value }))} data-testid="input-conversion" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Transaction Timeout (sec)</Label>
              <Input type="number" value={rulesForm.pg_transaction_timeout} onChange={(e) => setRulesForm(p => ({ ...p, pg_transaction_timeout: e.target.value }))} data-testid="input-timeout" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label className="text-xs">Auto-Cancel Unpaid</Label>
              <Switch checked={rulesForm.pg_auto_cancel_unpaid === "true"} onCheckedChange={(v) => setRulesForm(p => ({ ...p, pg_auto_cancel_unpaid: String(v) }))} data-testid="switch-auto-cancel" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label className="text-xs">Refund Support</Label>
              <Switch checked={rulesForm.pg_refund_support === "true"} onCheckedChange={(v) => setRulesForm(p => ({ ...p, pg_refund_support: String(v) }))} data-testid="switch-refund" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label className="text-xs">Retry Failed Txn</Label>
              <Switch checked={rulesForm.pg_retry_failed === "true"} onCheckedChange={(v) => setRulesForm(p => ({ ...p, pg_retry_failed: String(v) }))} data-testid="switch-retry-failed" />
            </div>
            <div className="space-y-1.5 p-3">
              <Label className="text-xs">Overpayment Handling</Label>
              <Select value={rulesForm.pg_overpayment_handling} onValueChange={(v) => setRulesForm(p => ({ ...p, pg_overpayment_handling: v }))}>
                <SelectTrigger className="h-8" data-testid="select-overpayment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Apply as Credit</SelectItem>
                  <SelectItem value="refund">Auto-Refund</SelectItem>
                  <SelectItem value="manual">Manual Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/10 dark:to-teal-900/10 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-teal-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-400">Automation Flow</h4>
              <p className="text-sm text-blue-700 dark:text-blue-500 mt-1">
                Customer clicks "Pay Now" → System selects assigned gateway → Redirects to payment page → Gateway processes transaction → Webhook confirms payment → Invoice auto-marked as paid → Receipt sent → Transaction logged. If failed: Retry → Fallback gateway → Notify customer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettlementTab({ gateways, settlements, onUpdate, saving }: {
  gateways: PaymentGateway[];
  settlements: GatewaySettlement[];
  onUpdate: (id: number, data: any) => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold" data-testid="settlement-title">Settlement & Fee Configuration</h2>

      {gateways.map(gw => (
        <Card key={gw.id} data-testid={`settlement-card-${gw.id}`}>
          <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/30 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-teal-500" />
              {gw.name} — Settlement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-lg text-center">
                <div className="text-xs text-blue-600 mb-1">Transaction Fee</div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-400">{gw.gatewayChargePercent || "0"}%</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 rounded-lg text-center">
                <div className="text-xs text-green-600 mb-1">Monthly Volume</div>
                <div className="text-lg font-bold text-green-700 dark:text-green-400">Rs. {parseFloat(gw.monthlyCollection || "0").toLocaleString()}</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 rounded-lg text-center">
                <div className="text-xs text-amber-600 mb-1">Gateway Fees</div>
                <div className="text-lg font-bold text-amber-700 dark:text-amber-400">Rs. {(parseFloat(gw.monthlyCollection || "0") * parseFloat(gw.gatewayChargePercent || "0") / 100).toLocaleString()}</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/10 rounded-lg text-center">
                <div className="text-xs text-teal-600 mb-1">Net Received</div>
                <div className="text-lg font-bold text-teal-700 dark:text-teal-400">
                  Rs. {(parseFloat(gw.monthlyCollection || "0") * (1 - parseFloat(gw.gatewayChargePercent || "0") / 100)).toLocaleString()}
                </div>
              </div>
            </div>

            {settlements.filter(s => s.gatewayId === gw.id).length > 0 && (
              <div className="border rounded-lg overflow-hidden mt-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium text-xs">Settlement ID</th>
                      <th className="px-3 py-2 text-left font-medium text-xs">Period</th>
                      <th className="px-3 py-2 text-right font-medium text-xs">Gross</th>
                      <th className="px-3 py-2 text-right font-medium text-xs">Fees</th>
                      <th className="px-3 py-2 text-right font-medium text-xs">Net</th>
                      <th className="px-3 py-2 text-left font-medium text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {settlements.filter(s => s.gatewayId === gw.id).map(st => (
                      <tr key={st.id} className="hover:bg-muted/30" data-testid={`row-settlement-${st.id}`}>
                        <td className="px-3 py-2 font-mono text-xs">{st.settlementId}</td>
                        <td className="px-3 py-2 text-xs">{st.periodStart} - {st.periodEnd}</td>
                        <td className="px-3 py-2 text-right">Rs. {parseFloat(st.grossAmount || "0").toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-red-600">-Rs. {parseFloat(st.gatewayFee || "0").toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-medium">Rs. {parseFloat(st.netAmount || "0").toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className={st.status === "settled" ? "text-green-600" : "text-yellow-600"}>{st.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Receipt className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-400">Financial Transparency</h4>
              <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                Settlement reports include: Net received amount, Gateway fee deductions, Tax on transactions, and Settlement cycle totals. All data integrates with the Accounting Module for seamless reconciliation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}