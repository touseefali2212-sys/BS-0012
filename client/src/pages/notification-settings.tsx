import { useState } from "react";
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
  Bell, Settings, Zap, Clock, Users, BarChart3, Plus, Save, Trash2,
  Wifi, Mail, MessageSquare, Smartphone, Send, Globe, AlertTriangle,
  CheckCircle2, XCircle, Loader2, RefreshCw, Search, Download, Eye,
  Shield, ChevronRight, RotateCcw, Filter, Hash
} from "lucide-react";
import type { NotificationChannel, NotificationTrigger, GeneralSetting } from "@shared/schema";

const CHANNEL_TYPES = [
  { value: "in_app", label: "In-App Notification", icon: Bell, color: "bg-indigo-500" },
  { value: "web", label: "Web Notification", icon: Globe, color: "bg-blue-500" },
  { value: "sms", label: "SMS", icon: MessageSquare, color: "bg-green-500" },
  { value: "email", label: "Email", icon: Mail, color: "bg-amber-500" },
  { value: "whatsapp", label: "WhatsApp", icon: Smartphone, color: "bg-emerald-500" },
  { value: "push", label: "Push Notification", icon: Send, color: "bg-purple-500" },
];

const TRIGGER_CATEGORIES = [
  { value: "billing", label: "Billing" },
  { value: "payment", label: "Payment" },
  { value: "service", label: "Service" },
  { value: "inventory", label: "Inventory" },
  { value: "hr", label: "HR" },
  { value: "support", label: "Support" },
  { value: "system", label: "System" },
];

const DEFAULT_TRIGGERS = [
  { eventName: "Invoice Generated", eventCategory: "billing" },
  { eventName: "Payment Received", eventCategory: "payment" },
  { eventName: "Payment Due Reminder", eventCategory: "payment" },
  { eventName: "Service Suspension", eventCategory: "service" },
  { eventName: "Service Activation", eventCategory: "service" },
  { eventName: "Asset Assigned", eventCategory: "inventory" },
  { eventName: "Stock Low Alert", eventCategory: "inventory" },
  { eventName: "Purchase Order Approved", eventCategory: "inventory" },
  { eventName: "Customer Complaint Logged", eventCategory: "support" },
  { eventName: "Ticket Updated", eventCategory: "support" },
];

function generateId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function NotificationSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [channelDialog, setChannelDialog] = useState(false);
  const [triggerDialog, setTriggerDialog] = useState(false);
  const [editingChannel, setEditingChannel] = useState<NotificationChannel | null>(null);
  const [editingTrigger, setEditingTrigger] = useState<NotificationTrigger | null>(null);
  const [logSearch, setLogSearch] = useState("");
  const [logFilter, setLogFilter] = useState("all");

  const { data: channels = [], isLoading: channelsLoading } = useQuery<NotificationChannel[]>({
    queryKey: ["/api/notification-channels"],
  });

  const { data: triggers = [], isLoading: triggersLoading } = useQuery<NotificationTrigger[]>({
    queryKey: ["/api/notification-triggers"],
  });

  const { data: notifSettings = [], isLoading: settingsLoading } = useQuery<GeneralSetting[]>({
    queryKey: ["/api/notification-settings"],
  });

  const { data: logs = [] } = useQuery<any[]>({
    queryKey: ["/api/notification-logs"],
  });

  const { data: logStats = { total: 0, delivered: 0, failed: 0, pending: 0 } } = useQuery<any>({
    queryKey: ["/api/notification-logs/stats"],
  });

  function getSettingValue(key: string, defaultValue: string = ""): string {
    const setting = notifSettings.find(s => s.settingKey === key);
    return setting?.settingValue || defaultValue;
  }

  function getSettingBool(key: string, defaultValue: boolean = false): boolean {
    const setting = notifSettings.find(s => s.settingKey === key);
    if (!setting) return defaultValue;
    return setting.settingValue === "true";
  }

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: { settingKey: string; settingValue: string; category: string; label?: string }[]) => {
      await apiRequest("PUT", "/api/notification-settings", { settings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-settings"] });
      toast({ title: "Settings Saved", description: "Notification settings updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  const saveChannelMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const { id, ...rest } = data;
        await apiRequest("PATCH", `/api/notification-channels/${id}`, rest);
      } else {
        await apiRequest("POST", "/api/notification-channels", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-channels"] });
      setChannelDialog(false);
      setEditingChannel(null);
      toast({ title: "Channel Saved", description: "Notification channel configured successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save channel.", variant: "destructive" });
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notification-channels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-channels"] });
      toast({ title: "Deleted", description: "Channel removed." });
    },
  });

  const saveTriggerMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const { id, ...rest } = data;
        await apiRequest("PATCH", `/api/notification-triggers/${id}`, rest);
      } else {
        await apiRequest("POST", "/api/notification-triggers", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-triggers"] });
      setTriggerDialog(false);
      setEditingTrigger(null);
      toast({ title: "Trigger Saved", description: "Event trigger configured successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save trigger.", variant: "destructive" });
    },
  });

  const deleteTriggerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notification-triggers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-triggers"] });
      toast({ title: "Deleted", description: "Trigger removed." });
    },
  });

  const resendLogMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/notification-logs/${id}/resend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notification-logs/stats"] });
      toast({ title: "Resent", description: "Notification queued for resend." });
    },
  });

  const [generalForm, setGeneralForm] = useState<Record<string, string>>({});

  function initGeneralForm() {
    const form: Record<string, string> = {};
    form["notif_system_enabled"] = getSettingValue("notif_system_enabled", "true");
    form["notif_default_priority"] = getSettingValue("notif_default_priority", "normal");
    form["notif_timezone"] = getSettingValue("notif_timezone", "UTC");
    form["notif_quiet_hours_enabled"] = getSettingValue("notif_quiet_hours_enabled", "false");
    form["notif_quiet_hours_start"] = getSettingValue("notif_quiet_hours_start", "22:00");
    form["notif_quiet_hours_end"] = getSettingValue("notif_quiet_hours_end", "07:00");
    form["notif_default_language"] = getSettingValue("notif_default_language", "English");
    form["notif_multi_language"] = getSettingValue("notif_multi_language", "false");
    form["notif_grouping_enabled"] = getSettingValue("notif_grouping_enabled", "true");
    form["notif_history_retention"] = getSettingValue("notif_history_retention", "true");
    form["notif_expiry_days"] = getSettingValue("notif_expiry_days", "30");
    return form;
  }

  function handleSaveGeneral() {
    const form = generalForm;
    const settings = Object.entries(form).map(([key, value]) => ({
      settingKey: key,
      settingValue: value,
      category: "notification_general",
      label: key.replace("notif_", "").replace(/_/g, " "),
    }));
    saveSettingsMutation.mutate(settings);
  }

  const [deliveryForm, setDeliveryForm] = useState<Record<string, string>>({});

  function initDeliveryForm() {
    const form: Record<string, string> = {};
    form["notif_max_retry"] = getSettingValue("notif_max_retry", "3");
    form["notif_retry_interval"] = getSettingValue("notif_retry_interval", "15");
    form["notif_retry_interval_unit"] = getSettingValue("notif_retry_interval_unit", "minutes");
    form["notif_fallback_channel"] = getSettingValue("notif_fallback_channel", "email");
    form["notif_escalation_enabled"] = getSettingValue("notif_escalation_enabled", "true");
    form["notif_auto_disable_failures"] = getSettingValue("notif_auto_disable_failures", "5");
    form["notif_delivery_reporting"] = getSettingValue("notif_delivery_reporting", "true");
    form["notif_bounce_tracking"] = getSettingValue("notif_bounce_tracking", "true");
    form["notif_spam_threshold"] = getSettingValue("notif_spam_threshold", "5");
    return form;
  }

  function handleSaveDelivery() {
    const form = deliveryForm;
    const settings = Object.entries(form).map(([key, value]) => ({
      settingKey: key,
      settingValue: value,
      category: "notification_delivery",
      label: key.replace("notif_", "").replace(/_/g, " "),
    }));
    saveSettingsMutation.mutate(settings);
  }

  const [prefForm, setPrefForm] = useState<Record<string, string>>({});

  function initPrefForm() {
    const form: Record<string, string> = {};
    form["notif_customer_self_control"] = getSettingValue("notif_customer_self_control", "true");
    form["notif_opt_in_out"] = getSettingValue("notif_opt_in_out", "true");
    form["notif_channel_preference"] = getSettingValue("notif_channel_preference", "true");
    form["notif_language_selection"] = getSettingValue("notif_language_selection", "true");
    form["notif_billing_only_mode"] = getSettingValue("notif_billing_only_mode", "false");
    form["notif_gdpr_compliance"] = getSettingValue("notif_gdpr_compliance", "true");
    form["notif_privacy_protection"] = getSettingValue("notif_privacy_protection", "true");
    return form;
  }

  function handleSavePreferences() {
    const form = prefForm;
    const settings = Object.entries(form).map(([key, value]) => ({
      settingKey: key,
      settingValue: value,
      category: "notification_preferences",
      label: key.replace("notif_", "").replace(/_/g, " "),
    }));
    saveSettingsMutation.mutate(settings);
  }

  const [channelForm, setChannelForm] = useState({
    name: "",
    channelType: "email",
    enabled: false,
    apiStatus: "disconnected",
    deliveryTimeout: 30,
    retryAttempts: 3,
    fallbackChannel: "",
    templateMapping: "",
    priority: 0,
    config: "",
  });

  const [triggerForm, setTriggerForm] = useState({
    eventName: "",
    eventCategory: "billing",
    enabled: true,
    channels: "[]",
    priority: "normal",
    messageTemplate: "",
    delay: "instant",
    delayMinutes: 0,
    roleBasedTrigger: false,
    targetRoles: "[]",
    customerGroupTrigger: false,
    targetCustomerGroups: "[]",
    branchSpecific: false,
    targetBranches: "[]",
  });

  function openChannelDialog(channel?: NotificationChannel) {
    if (channel) {
      setEditingChannel(channel);
      setChannelForm({
        name: channel.name,
        channelType: channel.channelType,
        enabled: channel.enabled,
        apiStatus: channel.apiStatus || "disconnected",
        deliveryTimeout: channel.deliveryTimeout || 30,
        retryAttempts: channel.retryAttempts || 3,
        fallbackChannel: channel.fallbackChannel || "",
        templateMapping: channel.templateMapping || "",
        priority: channel.priority || 0,
        config: channel.config || "",
      });
    } else {
      setEditingChannel(null);
      setChannelForm({
        name: "",
        channelType: "email",
        enabled: false,
        apiStatus: "disconnected",
        deliveryTimeout: 30,
        retryAttempts: 3,
        fallbackChannel: "",
        templateMapping: "",
        priority: 0,
        config: "",
      });
    }
    setChannelDialog(true);
  }

  function openTriggerDialog(trigger?: NotificationTrigger) {
    if (trigger) {
      setEditingTrigger(trigger);
      setTriggerForm({
        eventName: trigger.eventName,
        eventCategory: trigger.eventCategory,
        enabled: trigger.enabled,
        channels: trigger.channels || "[]",
        priority: trigger.priority || "normal",
        messageTemplate: trigger.messageTemplate || "",
        delay: trigger.delay || "instant",
        delayMinutes: trigger.delayMinutes || 0,
        roleBasedTrigger: trigger.roleBasedTrigger || false,
        targetRoles: trigger.targetRoles || "[]",
        customerGroupTrigger: trigger.customerGroupTrigger || false,
        targetCustomerGroups: trigger.targetCustomerGroups || "[]",
        branchSpecific: trigger.branchSpecific || false,
        targetBranches: trigger.targetBranches || "[]",
      });
    } else {
      setEditingTrigger(null);
      setTriggerForm({
        eventName: "",
        eventCategory: "billing",
        enabled: true,
        channels: "[]",
        priority: "normal",
        messageTemplate: "",
        delay: "instant",
        delayMinutes: 0,
        roleBasedTrigger: false,
        targetRoles: "[]",
        customerGroupTrigger: false,
        targetCustomerGroups: "[]",
        branchSpecific: false,
        targetBranches: "[]",
      });
    }
    setTriggerDialog(true);
  }

  function handleSaveChannel() {
    const data: any = { ...channelForm };
    if (editingChannel) data.id = editingChannel.id;
    saveChannelMutation.mutate(data);
  }

  function handleSaveTrigger() {
    const data: any = { ...triggerForm };
    if (editingTrigger) data.id = editingTrigger.id;
    saveTriggerMutation.mutate(data);
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      connected: { label: "Active", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
      disconnected: { label: "Disabled", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
      limited: { label: "Limited", cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
      pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
    };
    const s = map[status] || map.disconnected;
    return <Badge className={s.cls} data-testid={`badge-status-${status}`}>{s.label}</Badge>;
  };

  const logStatusBadge = (status: string) => {
    const map: Record<string, { icon: any; cls: string }> = {
      delivered: { icon: CheckCircle2, cls: "text-green-600" },
      failed: { icon: XCircle, cls: "text-red-600" },
      pending: { icon: Loader2, cls: "text-yellow-600" },
      sent: { icon: Send, cls: "text-blue-600" },
    };
    const s = map[status] || map.pending;
    const Icon = s.icon;
    return <span className={`flex items-center gap-1 ${s.cls}`}><Icon className="h-3.5 w-3.5" />{status}</span>;
  };

  const filteredLogs = logs.filter((l: any) => {
    if (logFilter !== "all" && l.status !== logFilter) return false;
    if (logSearch && !l.recipient?.toLowerCase().includes(logSearch.toLowerCase()) && !l.subject?.toLowerCase().includes(logSearch.toLowerCase())) return false;
    return true;
  });

  const isLoading = channelsLoading || triggersLoading || settingsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="notification-settings-page">
      <div className="bg-gradient-to-r from-[#4F46E5] to-[#2563EB] rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3" data-testid="page-title">
              <Bell className="h-7 w-7" />
              Notification Settings
            </h1>
            <p className="mt-1 text-indigo-100 text-sm">
              Configure, automate, and control all system-generated notifications
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold" data-testid="stat-channels">{channels.length}</div>
              <div className="text-xs text-indigo-200">Channels</div>
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold" data-testid="stat-triggers">{triggers.length}</div>
              <div className="text-xs text-indigo-200">Triggers</div>
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold" data-testid="stat-active">{channels.filter(c => c.enabled).length}</div>
              <div className="text-xs text-indigo-200">Active</div>
            </div>
            <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
              <div className="text-2xl font-bold" data-testid="stat-total-sent">{logStats.total}</div>
              <div className="text-xs text-indigo-200">Total Sent</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v);
        if (v === "general" && Object.keys(generalForm).length === 0) setGeneralForm(initGeneralForm());
        if (v === "delivery" && Object.keys(deliveryForm).length === 0) setDeliveryForm(initDeliveryForm());
        if (v === "preferences" && Object.keys(prefForm).length === 0) setPrefForm(initPrefForm());
      }}>
        <TabsList className="grid grid-cols-6 w-full" data-testid="tabs-list">
          <TabsTrigger value="general" className="flex items-center gap-1.5" data-testid="tab-general">
            <Settings className="h-3.5 w-3.5" /> General
          </TabsTrigger>
          <TabsTrigger value="channels" className="flex items-center gap-1.5" data-testid="tab-channels">
            <Wifi className="h-3.5 w-3.5" /> Channels
          </TabsTrigger>
          <TabsTrigger value="triggers" className="flex items-center gap-1.5" data-testid="tab-triggers">
            <Zap className="h-3.5 w-3.5" /> Triggers
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-1.5" data-testid="tab-delivery">
            <Clock className="h-3.5 w-3.5" /> Delivery
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-1.5" data-testid="tab-preferences">
            <Users className="h-3.5 w-3.5" /> Preferences
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-1.5" data-testid="tab-logs">
            <BarChart3 className="h-3.5 w-3.5" /> Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralSettingsTab
            form={Object.keys(generalForm).length > 0 ? generalForm : initGeneralForm()}
            setForm={setGeneralForm}
            onSave={handleSaveGeneral}
            saving={saveSettingsMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="channels" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" data-testid="channels-title">Channel Configuration</h2>
              <Button onClick={() => openChannelDialog()} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-add-channel">
                <Plus className="h-4 w-4 mr-1" /> Add Channel
              </Button>
            </div>

            {channels.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Wifi className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No channels configured yet</p>
                  <Button onClick={() => openChannelDialog()} variant="outline" className="mt-3" data-testid="button-add-first-channel">
                    <Plus className="h-4 w-4 mr-1" /> Configure First Channel
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {channels.map((ch) => {
                  const chType = CHANNEL_TYPES.find(t => t.value === ch.channelType);
                  const Icon = chType?.icon || Bell;
                  return (
                    <Card key={ch.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`card-channel-${ch.id}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg text-white ${chType?.color || "bg-gray-500"}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold" data-testid={`text-channel-name-${ch.id}`}>{ch.name}</h3>
                              <p className="text-xs text-muted-foreground">{chType?.label || ch.channelType}</p>
                            </div>
                          </div>
                          {statusBadge(ch.enabled ? (ch.apiStatus || "connected") : "disconnected")}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Timeout</span>
                            <span className="font-medium text-foreground">{ch.deliveryTimeout}s</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Retries</span>
                            <span className="font-medium text-foreground">{ch.retryAttempts}</span>
                          </div>
                          {ch.fallbackChannel && (
                            <div className="flex justify-between text-muted-foreground">
                              <span>Fallback</span>
                              <span className="font-medium text-foreground">{CHANNEL_TYPES.find(t => t.value === ch.fallbackChannel)?.label || ch.fallbackChannel}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-4 pt-3 border-t">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => openChannelDialog(ch)} data-testid={`button-edit-channel-${ch.id}`}>
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => deleteChannelMutation.mutate(ch.id)} data-testid={`button-delete-channel-${ch.id}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="triggers" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" data-testid="triggers-title">Event-Based Triggers</h2>
              <Button onClick={() => openTriggerDialog()} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-add-trigger">
                <Plus className="h-4 w-4 mr-1" /> Add Trigger
              </Button>
            </div>

            {triggers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Zap className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No triggers configured yet</p>
                  <Button onClick={() => openTriggerDialog()} variant="outline" className="mt-3" data-testid="button-add-first-trigger">
                    <Plus className="h-4 w-4 mr-1" /> Add First Trigger
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {TRIGGER_CATEGORIES.map((cat) => {
                  const catTriggers = triggers.filter(t => t.eventCategory === cat.value);
                  if (catTriggers.length === 0) return null;
                  return (
                    <Card key={cat.value} data-testid={`card-trigger-category-${cat.value}`}>
                      <CardHeader className="py-3 px-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/30 border-b">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Hash className="h-3.5 w-3.5 text-indigo-500" />
                          {cat.label}
                          <Badge variant="secondary" className="ml-auto">{catTriggers.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y">
                          {catTriggers.map((trigger) => {
                            const triggerChannels = (() => { try { return JSON.parse(trigger.channels || "[]"); } catch { return []; } })();
                            return (
                              <div key={trigger.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors" data-testid={`row-trigger-${trigger.id}`}>
                                <div className="flex items-center gap-3">
                                  <Switch
                                    checked={trigger.enabled}
                                    onCheckedChange={(checked) => {
                                      saveTriggerMutation.mutate({ id: trigger.id, enabled: checked });
                                    }}
                                    data-testid={`switch-trigger-${trigger.id}`}
                                  />
                                  <div>
                                    <div className="font-medium text-sm" data-testid={`text-trigger-name-${trigger.id}`}>{trigger.eventName}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs py-0">{trigger.priority}</Badge>
                                      <span>{trigger.delay === "instant" ? "Instant" : `${trigger.delayMinutes}min delay`}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex gap-1">
                                    {triggerChannels.map((ch: string) => {
                                      const chType = CHANNEL_TYPES.find(t => t.value === ch);
                                      if (!chType) return null;
                                      const ChIcon = chType.icon;
                                      return (
                                        <span key={ch} className={`p-1 rounded text-white ${chType.color}`} title={chType.label}>
                                          <ChIcon className="h-3 w-3" />
                                        </span>
                                      );
                                    })}
                                  </div>
                                  <Button size="sm" variant="ghost" onClick={() => openTriggerDialog(trigger)} data-testid={`button-edit-trigger-${trigger.id}`}>
                                    Edit
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => deleteTriggerMutation.mutate(trigger.id)} data-testid={`button-delete-trigger-${trigger.id}`}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="mt-6">
          <DeliveryRulesTab
            form={Object.keys(deliveryForm).length > 0 ? deliveryForm : initDeliveryForm()}
            setForm={setDeliveryForm}
            onSave={handleSaveDelivery}
            saving={saveSettingsMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <CustomerPreferencesTab
            form={Object.keys(prefForm).length > 0 ? prefForm : initPrefForm()}
            setForm={setPrefForm}
            onSave={handleSavePreferences}
            saving={saveSettingsMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4 text-center">
                  <Send className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400" data-testid="log-stat-total">{logStats.total}</div>
                  <div className="text-xs text-blue-600">Total Sent</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 border-green-200 dark:border-green-800">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400" data-testid="log-stat-delivered">{logStats.delivered}</div>
                  <div className="text-xs text-green-600">Delivered</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 border-red-200 dark:border-red-800">
                <CardContent className="p-4 text-center">
                  <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-red-700 dark:text-red-400" data-testid="log-stat-failed">{logStats.failed}</div>
                  <div className="text-xs text-red-600">Failed</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/10 border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-4 text-center">
                  <Loader2 className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400" data-testid="log-stat-pending">{logStats.pending}</div>
                  <div className="text-xs text-yellow-600">Pending</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Notification Logs</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search by recipient or subject..."
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        className="pl-9 w-64"
                        data-testid="input-log-search"
                      />
                    </div>
                    <Select value={logFilter} onValueChange={setLogFilter}>
                      <SelectTrigger className="w-32" data-testid="select-log-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" data-testid="button-export-logs">
                      <Download className="h-4 w-4 mr-1" /> Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <BarChart3 className="h-10 w-10 mb-2" />
                    <p>No notification logs found</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#334155] to-[#4F46E5] text-white">
                          <th className="px-3 py-2 text-left font-medium">ID</th>
                          <th className="px-3 py-2 text-left font-medium">Channel</th>
                          <th className="px-3 py-2 text-left font-medium">Recipient</th>
                          <th className="px-3 py-2 text-left font-medium">Subject</th>
                          <th className="px-3 py-2 text-left font-medium">Status</th>
                          <th className="px-3 py-2 text-left font-medium">Retries</th>
                          <th className="px-3 py-2 text-left font-medium">Time</th>
                          <th className="px-3 py-2 text-left font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-muted/50" data-testid={`row-log-${log.id}`}>
                            <td className="px-3 py-2 font-mono text-xs">{log.logId}</td>
                            <td className="px-3 py-2">
                              <Badge variant="outline">{CHANNEL_TYPES.find(t => t.value === log.channelType)?.label || log.channelType}</Badge>
                            </td>
                            <td className="px-3 py-2">{log.recipient || "-"}</td>
                            <td className="px-3 py-2 max-w-[200px] truncate">{log.subject || "-"}</td>
                            <td className="px-3 py-2">{logStatusBadge(log.status)}</td>
                            <td className="px-3 py-2">{log.retryCount || 0}</td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">{log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}</td>
                            <td className="px-3 py-2">
                              <div className="flex gap-1">
                                {log.status === "failed" && (
                                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => resendLogMutation.mutate(log.id)} data-testid={`button-resend-${log.id}`}>
                                    <RotateCcw className="h-3 w-3 mr-1" /> Resend
                                  </Button>
                                )}
                                {log.apiResponse && (
                                  <Button size="sm" variant="ghost" className="h-7 text-xs" data-testid={`button-view-response-${log.id}`}>
                                    <Eye className="h-3 w-3 mr-1" /> Response
                                  </Button>
                                )}
                              </div>
                            </td>
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

      <Dialog open={channelDialog} onOpenChange={setChannelDialog}>
        <DialogContent className="max-w-lg" data-testid="dialog-channel">
          <DialogHeader>
            <DialogTitle>{editingChannel ? "Edit Channel" : "Add Channel"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Channel Name</Label>
                <Input
                  value={channelForm.name}
                  onChange={(e) => setChannelForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Primary Email"
                  data-testid="input-channel-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Channel Type</Label>
                <Select value={channelForm.channelType} onValueChange={(v) => setChannelForm(p => ({ ...p, channelType: v }))}>
                  <SelectTrigger data-testid="select-channel-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNEL_TYPES.map(ct => (
                      <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Enabled</Label>
                <p className="text-xs text-muted-foreground">Activate this channel for notifications</p>
              </div>
              <Switch
                checked={channelForm.enabled}
                onCheckedChange={(v) => setChannelForm(p => ({ ...p, enabled: v }))}
                data-testid="switch-channel-enabled"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>API Status</Label>
                <Select value={channelForm.apiStatus} onValueChange={(v) => setChannelForm(p => ({ ...p, apiStatus: v }))}>
                  <SelectTrigger data-testid="select-api-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="connected">Connected</SelectItem>
                    <SelectItem value="disconnected">Disconnected</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={channelForm.priority}
                  onChange={(e) => setChannelForm(p => ({ ...p, priority: parseInt(e.target.value) || 0 }))}
                  data-testid="input-channel-priority"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Delivery Timeout (seconds)</Label>
                <Input
                  type="number"
                  value={channelForm.deliveryTimeout}
                  onChange={(e) => setChannelForm(p => ({ ...p, deliveryTimeout: parseInt(e.target.value) || 30 }))}
                  data-testid="input-delivery-timeout"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Retry Attempts</Label>
                <Input
                  type="number"
                  value={channelForm.retryAttempts}
                  onChange={(e) => setChannelForm(p => ({ ...p, retryAttempts: parseInt(e.target.value) || 3 }))}
                  data-testid="input-retry-attempts"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Fallback Channel</Label>
              <Select value={channelForm.fallbackChannel || "none"} onValueChange={(v) => setChannelForm(p => ({ ...p, fallbackChannel: v === "none" ? "" : v }))}>
                <SelectTrigger data-testid="select-fallback-channel">
                  <SelectValue placeholder="Select fallback..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Fallback</SelectItem>
                  {CHANNEL_TYPES.filter(ct => ct.value !== channelForm.channelType).map(ct => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">If delivery fails, automatically try this channel</p>
            </div>
            <div className="space-y-1.5">
              <Label>Template Mapping</Label>
              <Input
                value={channelForm.templateMapping}
                onChange={(e) => setChannelForm(p => ({ ...p, templateMapping: e.target.value }))}
                placeholder="Template ID or name"
                data-testid="input-template-mapping"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChannelDialog(false)} data-testid="button-cancel-channel">Cancel</Button>
            <Button onClick={handleSaveChannel} disabled={saveChannelMutation.isPending || !channelForm.name} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-save-channel">
              {saveChannelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              {editingChannel ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={triggerDialog} onOpenChange={setTriggerDialog}>
        <DialogContent className="max-w-xl" data-testid="dialog-trigger">
          <DialogHeader>
            <DialogTitle>{editingTrigger ? "Edit Trigger" : "Add Trigger"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Event Name</Label>
                <Input
                  value={triggerForm.eventName}
                  onChange={(e) => setTriggerForm(p => ({ ...p, eventName: e.target.value }))}
                  placeholder="e.g., Invoice Generated"
                  data-testid="input-trigger-event"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={triggerForm.eventCategory} onValueChange={(v) => setTriggerForm(p => ({ ...p, eventCategory: v }))}>
                  <SelectTrigger data-testid="select-trigger-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_CATEGORIES.map(tc => (
                      <SelectItem key={tc.value} value={tc.value}>{tc.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Enabled</Label>
                <p className="text-xs text-muted-foreground">Activate this trigger</p>
              </div>
              <Switch
                checked={triggerForm.enabled}
                onCheckedChange={(v) => setTriggerForm(p => ({ ...p, enabled: v }))}
                data-testid="switch-trigger-enabled"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Channels</Label>
              <div className="flex flex-wrap gap-2">
                {CHANNEL_TYPES.map(ct => {
                  const selected = (() => { try { return JSON.parse(triggerForm.channels); } catch { return []; } })();
                  const isSelected = selected.includes(ct.value);
                  return (
                    <Badge
                      key={ct.value}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer ${isSelected ? ct.color + " text-white border-transparent" : ""}`}
                      onClick={() => {
                        const newChannels = isSelected ? selected.filter((c: string) => c !== ct.value) : [...selected, ct.value];
                        setTriggerForm(p => ({ ...p, channels: JSON.stringify(newChannels) }));
                      }}
                      data-testid={`badge-channel-${ct.value}`}
                    >
                      {ct.label}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={triggerForm.priority} onValueChange={(v) => setTriggerForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger data-testid="select-trigger-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Delivery</Label>
                <Select value={triggerForm.delay} onValueChange={(v) => setTriggerForm(p => ({ ...p, delay: v }))}>
                  <SelectTrigger data-testid="select-trigger-delay">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instant</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {triggerForm.delay === "scheduled" && (
              <div className="space-y-1.5">
                <Label>Delay (minutes)</Label>
                <Input
                  type="number"
                  value={triggerForm.delayMinutes}
                  onChange={(e) => setTriggerForm(p => ({ ...p, delayMinutes: parseInt(e.target.value) || 0 }))}
                  data-testid="input-delay-minutes"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Message Template</Label>
              <Textarea
                value={triggerForm.messageTemplate}
                onChange={(e) => setTriggerForm(p => ({ ...p, messageTemplate: e.target.value }))}
                placeholder="Enter notification message template..."
                rows={3}
                data-testid="textarea-message-template"
              />
            </div>

            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">Advanced Targeting</h4>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-sm">Role-Based Trigger</Label>
                  <p className="text-xs text-muted-foreground">Restrict to specific roles</p>
                </div>
                <Switch
                  checked={triggerForm.roleBasedTrigger}
                  onCheckedChange={(v) => setTriggerForm(p => ({ ...p, roleBasedTrigger: v }))}
                  data-testid="switch-role-trigger"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-sm">Customer Group Trigger</Label>
                  <p className="text-xs text-muted-foreground">Restrict to specific customer groups</p>
                </div>
                <Switch
                  checked={triggerForm.customerGroupTrigger}
                  onCheckedChange={(v) => setTriggerForm(p => ({ ...p, customerGroupTrigger: v }))}
                  data-testid="switch-customer-group-trigger"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-sm">Branch-Specific</Label>
                  <p className="text-xs text-muted-foreground">Restrict to specific branches</p>
                </div>
                <Switch
                  checked={triggerForm.branchSpecific}
                  onCheckedChange={(v) => setTriggerForm(p => ({ ...p, branchSpecific: v }))}
                  data-testid="switch-branch-specific"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTriggerDialog(false)} data-testid="button-cancel-trigger">Cancel</Button>
            <Button onClick={handleSaveTrigger} disabled={saveTriggerMutation.isPending || !triggerForm.eventName} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-save-trigger">
              {saveTriggerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              {editingTrigger ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GeneralSettingsTab({ form, setForm, onSave, saving }: {
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const updateField = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" data-testid="general-title">General Notification Settings</h2>
        <Button onClick={onSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-save-general">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-500" /> Global Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>System-Wide Notifications</Label>
                <p className="text-xs text-muted-foreground">Enable or disable all notifications globally</p>
              </div>
              <Switch
                checked={form["notif_system_enabled"] === "true"}
                onCheckedChange={(v) => updateField("notif_system_enabled", String(v))}
                data-testid="switch-system-enabled"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Default Priority</Label>
              <Select value={form["notif_default_priority"] || "normal"} onValueChange={(v) => updateField("notif_default_priority", v)}>
                <SelectTrigger data-testid="select-default-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Time Zone</Label>
              <Select value={form["notif_timezone"] || "UTC"} onValueChange={(v) => updateField("notif_timezone", v)}>
                <SelectTrigger data-testid="select-timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Asia/Karachi">Asia/Karachi (PKT)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-500" /> Quiet Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Enable Quiet Hours</Label>
                <p className="text-xs text-muted-foreground">Suppress non-critical notifications during off-hours</p>
              </div>
              <Switch
                checked={form["notif_quiet_hours_enabled"] === "true"}
                onCheckedChange={(v) => updateField("notif_quiet_hours_enabled", String(v))}
                data-testid="switch-quiet-hours"
              />
            </div>

            {form["notif_quiet_hours_enabled"] === "true" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={form["notif_quiet_hours_start"] || "22:00"}
                    onChange={(e) => updateField("notif_quiet_hours_start", e.target.value)}
                    data-testid="input-quiet-start"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={form["notif_quiet_hours_end"] || "07:00"}
                    onChange={(e) => updateField("notif_quiet_hours_end", e.target.value)}
                    data-testid="input-quiet-end"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-500" /> Language
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Default Language</Label>
              <Select value={form["notif_default_language"] || "English"} onValueChange={(v) => updateField("notif_default_language", v)}>
                <SelectTrigger data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Urdu">Urdu</SelectItem>
                  <SelectItem value="Arabic">Arabic</SelectItem>
                  <SelectItem value="Hindi">Hindi</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Multi-Language Support</Label>
                <p className="text-xs text-muted-foreground">Send notifications in customer's preferred language</p>
              </div>
              <Switch
                checked={form["notif_multi_language"] === "true"}
                onCheckedChange={(v) => updateField("notif_multi_language", String(v))}
                data-testid="switch-multi-language"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4 text-indigo-500" /> Advanced
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Notification Grouping</Label>
                <p className="text-xs text-muted-foreground">Group similar notifications together</p>
              </div>
              <Switch
                checked={form["notif_grouping_enabled"] === "true"}
                onCheckedChange={(v) => updateField("notif_grouping_enabled", String(v))}
                data-testid="switch-grouping"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>History Retention</Label>
                <p className="text-xs text-muted-foreground">Keep notification history for auditing</p>
              </div>
              <Switch
                checked={form["notif_history_retention"] === "true"}
                onCheckedChange={(v) => updateField("notif_history_retention", String(v))}
                data-testid="switch-history"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Expiry Duration (days)</Label>
              <Input
                type="number"
                value={form["notif_expiry_days"] || "30"}
                onChange={(e) => updateField("notif_expiry_days", e.target.value)}
                data-testid="input-expiry-days"
              />
              <p className="text-xs text-muted-foreground">Auto-delete notifications older than this</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DeliveryRulesTab({ form, setForm, onSave, saving }: {
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const updateField = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" data-testid="delivery-title">Delivery & Retry Rules</h2>
        <Button onClick={onSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-save-delivery">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save Rules
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-indigo-500" /> Retry Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Max Retry Attempts</Label>
              <Input
                type="number"
                value={form["notif_max_retry"] || "3"}
                onChange={(e) => updateField("notif_max_retry", e.target.value)}
                data-testid="input-max-retry"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Retry Interval</Label>
                <Input
                  type="number"
                  value={form["notif_retry_interval"] || "15"}
                  onChange={(e) => updateField("notif_retry_interval", e.target.value)}
                  data-testid="input-retry-interval"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select value={form["notif_retry_interval_unit"] || "minutes"} onValueChange={(v) => updateField("notif_retry_interval_unit", v)}>
                  <SelectTrigger data-testid="select-retry-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Fallback Channel</Label>
              <Select value={form["notif_fallback_channel"] || "email"} onValueChange={(v) => updateField("notif_fallback_channel", v)}>
                <SelectTrigger data-testid="select-delivery-fallback">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_TYPES.map(ct => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-indigo-500" /> Failure Handling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Escalation After Failure</Label>
                <p className="text-xs text-muted-foreground">Notify admin when retries are exhausted</p>
              </div>
              <Switch
                checked={form["notif_escalation_enabled"] === "true"}
                onCheckedChange={(v) => updateField("notif_escalation_enabled", String(v))}
                data-testid="switch-escalation"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Auto-Disable After Failures</Label>
              <Input
                type="number"
                value={form["notif_auto_disable_failures"] || "5"}
                onChange={(e) => updateField("notif_auto_disable_failures", e.target.value)}
                data-testid="input-auto-disable"
              />
              <p className="text-xs text-muted-foreground">Disable channel after this many consecutive failures</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-500" /> Tracking & Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label>Delivery Reporting</Label>
                  <p className="text-xs text-muted-foreground">Track delivery confirmations</p>
                </div>
                <Switch
                  checked={form["notif_delivery_reporting"] === "true"}
                  onCheckedChange={(v) => updateField("notif_delivery_reporting", String(v))}
                  data-testid="switch-delivery-reporting"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label>Bounce Tracking</Label>
                  <p className="text-xs text-muted-foreground">Track bounced emails/SMS</p>
                </div>
                <Switch
                  checked={form["notif_bounce_tracking"] === "true"}
                  onCheckedChange={(v) => updateField("notif_bounce_tracking", String(v))}
                  data-testid="switch-bounce-tracking"
                />
              </div>
              <div className="space-y-1.5 p-3">
                <Label>Spam Detection Threshold</Label>
                <Input
                  type="number"
                  value={form["notif_spam_threshold"] || "5"}
                  onChange={(e) => updateField("notif_spam_threshold", e.target.value)}
                  data-testid="input-spam-threshold"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-400">Automation Logic</h4>
                <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                  When an event occurs: System checks trigger configuration → Applies customer preference → Applies priority rules → Sends via selected channel → If failed, executes fallback → Logs final status.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CustomerPreferencesTab({ form, setForm, onSave, saving }: {
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const updateField = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" data-testid="preferences-title">Customer Communication Preferences</h2>
        <Button onClick={onSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-save-preferences">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save Preferences
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" /> Customer Self-Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Customer Self-Control Panel</Label>
                <p className="text-xs text-muted-foreground">Let customers manage their notification preferences</p>
              </div>
              <Switch
                checked={form["notif_customer_self_control"] === "true"}
                onCheckedChange={(v) => updateField("notif_customer_self_control", String(v))}
                data-testid="switch-self-control"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Allow Opt-in / Opt-out</Label>
                <p className="text-xs text-muted-foreground">Customers can subscribe/unsubscribe from notifications</p>
              </div>
              <Switch
                checked={form["notif_opt_in_out"] === "true"}
                onCheckedChange={(v) => updateField("notif_opt_in_out", String(v))}
                data-testid="switch-opt-in-out"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Channel Preference Selection</Label>
                <p className="text-xs text-muted-foreground">Customers choose preferred channels per notification type</p>
              </div>
              <Switch
                checked={form["notif_channel_preference"] === "true"}
                onCheckedChange={(v) => updateField("notif_channel_preference", String(v))}
                data-testid="switch-channel-preference"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Language Selection</Label>
                <p className="text-xs text-muted-foreground">Customers choose their notification language</p>
              </div>
              <Switch
                checked={form["notif_language_selection"] === "true"}
                onCheckedChange={(v) => updateField("notif_language_selection", String(v))}
                data-testid="switch-language-selection"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Billing-Only Mode</Label>
                <p className="text-xs text-muted-foreground">Only send billing-related notifications</p>
              </div>
              <Switch
                checked={form["notif_billing_only_mode"] === "true"}
                onCheckedChange={(v) => updateField("notif_billing_only_mode", String(v))}
                data-testid="switch-billing-only"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-500" /> Compliance & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>GDPR-Style Compliance</Label>
                <p className="text-xs text-muted-foreground">Enforce consent-based communication</p>
              </div>
              <Switch
                checked={form["notif_gdpr_compliance"] === "true"}
                onCheckedChange={(v) => updateField("notif_gdpr_compliance", String(v))}
                data-testid="switch-gdpr"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label>Privacy Protection</Label>
                <p className="text-xs text-muted-foreground">Mask sensitive data in notifications</p>
              </div>
              <Switch
                checked={form["notif_privacy_protection"] === "true"}
                onCheckedChange={(v) => updateField("notif_privacy_protection", String(v))}
                data-testid="switch-privacy"
              />
            </div>

            <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 border-indigo-200 dark:border-indigo-800">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-400 mb-2">Customer Example</h4>
                <div className="text-sm text-indigo-700 dark:text-indigo-500 space-y-1">
                  <p>• SMS for billing notifications</p>
                  <p>• Email for promotions and updates</p>
                  <p>• No push notifications</p>
                  <p>• Preferred language: English</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">Benefits</h4>
                <div className="text-sm text-green-700 dark:text-green-500 space-y-1">
                  <p>✓ GDPR-style compliance</p>
                  <p>✓ Privacy protection</p>
                  <p>✓ Better user experience</p>
                  <p>✓ Reduced spam complaints</p>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}