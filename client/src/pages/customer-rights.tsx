import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CustomerGroup, CustomerRight } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Shield, Users, UserCheck, UserX, Plus, Copy, Pencil, Archive,
  ChevronDown, ChevronRight, Save, Smartphone, Monitor, Globe,
  AlertTriangle, CheckCircle2, XCircle, Eye, CreditCard, Bell,
  Receipt, Wallet, FileText, Download, Clock, Lock, Unlock,
  Package, Wrench, Headphones, MapPin, Phone, Settings,
  BarChart3, BellRing, Mail, MessageSquare, Loader2, Info,
  ShieldCheck, ShieldAlert, ShieldX, Ban, KeyRound, Zap
} from "lucide-react";

const BILLING_FEATURES = [
  { key: "view_current_bill", label: "View Current Bill", icon: Receipt, desc: "Access to current billing period charges" },
  { key: "view_billing_history", label: "View Billing History", icon: Clock, desc: "Access to historical bills and invoices" },
  { key: "download_invoice_pdf", label: "Download Invoice PDF", icon: Download, desc: "Download invoices in PDF format" },
  { key: "view_payment_history", label: "View Payment History", icon: Wallet, desc: "View past payment transactions" },
  { key: "view_outstanding_balance", label: "View Outstanding Balance", icon: CreditCard, desc: "See current outstanding amount" },
  { key: "view_tax_breakdown", label: "View Tax Breakdown", icon: FileText, desc: "Detailed tax calculations on bills" },
  { key: "view_usage_details", label: "View Usage Details", icon: BarChart3, desc: "Bandwidth and service usage data" },
];

const PAYMENT_FEATURES = [
  { key: "make_online_payment", label: "Make Online Payment", icon: CreditCard, desc: "Process payments through online portal" },
  { key: "partial_payment", label: "Partial Payment Allowed", icon: Wallet, desc: "Allow partial payments on invoices" },
  { key: "enable_auto_pay", label: "Enable Auto-Pay", icon: Zap, desc: "Set up automatic recurring payments" },
  { key: "save_payment_method", label: "Save Payment Method", icon: Lock, desc: "Store payment card/bank details" },
  { key: "view_refund_status", label: "View Refund Status", icon: Receipt, desc: "Track refund request progress" },
  { key: "view_credit_notes", label: "View Credit Notes", icon: FileText, desc: "Access issued credit notes" },
];

const NOTIFICATION_FEATURES = [
  { key: "view_push_notifications", label: "View Push Notifications", icon: BellRing, desc: "Receive and view push alerts" },
  { key: "view_sms_history", label: "View SMS History", icon: MessageSquare, desc: "View sent SMS messages" },
  { key: "view_email_history", label: "View Email History", icon: Mail, desc: "View sent email notifications" },
  { key: "toggle_marketing", label: "Enable/Disable Marketing Notifications", icon: Bell, desc: "Opt in/out of marketing campaigns" },
  { key: "service_alerts", label: "Receive Service Alerts", icon: AlertTriangle, desc: "Get alerts about service disruptions" },
  { key: "billing_reminders", label: "Receive Billing Reminders", icon: Clock, desc: "Payment due date reminders" },
];

const PREFERENCE_FEATURES = [
  { key: "opt_marketing", label: "Opt-in/Opt-out Marketing", icon: Bell, desc: "Marketing communication preferences" },
  { key: "language_selection", label: "Language Selection", icon: Globe, desc: "Choose preferred language" },
  { key: "notification_channel", label: "Notification Channel Selection", icon: Settings, desc: "Choose SMS, Email or Push" },
];

const SERVICE_FEATURES = [
  { key: "view_active_package", label: "View Active Package", icon: Package, desc: "See current subscription details" },
  { key: "view_bandwidth_usage", label: "View Service Usage (Bandwidth)", icon: BarChart3, desc: "Monitor bandwidth consumption" },
  { key: "request_upgrade", label: "Request Package Upgrade", icon: Zap, desc: "Submit upgrade requests" },
  { key: "submit_ticket", label: "Submit Support Ticket", icon: Headphones, desc: "Create new support tickets" },
  { key: "track_ticket", label: "Track Ticket Status", icon: Eye, desc: "View ticket progress and history" },
  { key: "view_outages", label: "View Service Outages", icon: Wrench, desc: "See current and planned outages" },
  { key: "download_contract", label: "Download Contract", icon: Download, desc: "Download service agreements" },
  { key: "view_assets", label: "View Assigned Assets (Router/ONT)", icon: Package, desc: "See assigned equipment serial numbers" },
];

const SELFSERVICE_FEATURES = [
  { key: "change_password", label: "Change Password", icon: KeyRound, desc: "Update account password" },
  { key: "update_profile", label: "Update Profile Information", icon: UserCheck, desc: "Edit personal details" },
  { key: "update_contact", label: "Update Contact Number", icon: Phone, desc: "Change phone number on file" },
  { key: "request_relocation", label: "Request Relocation", icon: MapPin, desc: "Submit service relocation request" },
  { key: "request_suspension", label: "Request Temporary Suspension", icon: Ban, desc: "Pause service temporarily" },
  { key: "schedule_technician", label: "Schedule Technician Visit", icon: Wrench, desc: "Book technician appointment" },
  { key: "raise_complaint", label: "Raise Complaint", icon: AlertTriangle, desc: "File a formal complaint" },
];

const DEFAULT_GROUPS = [
  { name: "All Customers", description: "Default group for all registered customers", groupType: "default", isSystem: true },
  { name: "Package-Based", description: "Customers segmented by subscription package", groupType: "package", isSystem: true },
  { name: "Corporate", description: "Corporate and business account customers", groupType: "corporate", isSystem: true },
  { name: "Residential", description: "Home and residential service customers", groupType: "residential", isSystem: true },
  { name: "Region-Based", description: "Customers segmented by geographical area", groupType: "region", isSystem: true },
  { name: "VIP", description: "Premium and priority customers", groupType: "vip", isSystem: true },
  { name: "Suspended", description: "Accounts with suspended services", groupType: "suspended", isSystem: true },
];

const ALL_CATEGORIES: { key: string; label: string; icon: any; features: typeof BILLING_FEATURES }[] = [
  { key: "billing", label: "Billing Permissions", icon: Receipt, features: BILLING_FEATURES },
  { key: "payment", label: "Payment Permissions", icon: CreditCard, features: PAYMENT_FEATURES },
  { key: "notification", label: "Notification Permissions", icon: Bell, features: NOTIFICATION_FEATURES },
  { key: "preferences", label: "Customer Preferences", icon: Settings, features: PREFERENCE_FEATURES },
  { key: "service", label: "Service & Account", icon: Package, features: SERVICE_FEATURES },
  { key: "selfservice", label: "Self-Service Options", icon: Wrench, features: SELFSERVICE_FEATURES },
];

type RightsMap = Record<string, { enabled: boolean; webAccess: boolean; appAccess: boolean; conditions?: string | null }>;

export default function CustomerRightsPage() {
  const { toast } = useToast();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("billing");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["billing", "payment"]));
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDesc, setEditGroupDesc] = useState("");
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [localRights, setLocalRights] = useState<RightsMap>({});

  const { data: groups = [], isLoading: groupsLoading } = useQuery<CustomerGroup[]>({
    queryKey: ["/api/customer-groups"],
  });

  const { data: rights = [], isLoading: rightsLoading } = useQuery<CustomerRight[]>({
    queryKey: ["/api/customer-rights", selectedGroupId],
    enabled: !!selectedGroupId,
  });

  const selectedGroup = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId]);

  const rightsMap = useMemo(() => {
    const map: RightsMap = {};
    rights.forEach(r => {
      const k = `${r.category}:${r.featureKey}`;
      map[k] = { enabled: r.enabled ?? false, webAccess: r.webAccess ?? true, appAccess: r.appAccess ?? false, conditions: r.conditions };
    });
    Object.keys(localRights).forEach(k => {
      map[k] = { ...(map[k] || { enabled: false, webAccess: true, appAccess: false }), ...localRights[k] };
    });
    return map;
  }, [rights, localRights]);

  const initDefaultGroupsMutation = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const g of DEFAULT_GROUPS) {
        const res = await apiRequest("POST", "/api/customer-groups", g);
        results.push(await res.json());
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-groups"] });
      toast({ title: "Default groups created", description: "7 customer groups initialized" });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await apiRequest("POST", "/api/customer-groups", data);
      return res.json();
    },
    onSuccess: (group: CustomerGroup) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-groups"] });
      setSelectedGroupId(group.id);
      setShowCreateDialog(false);
      setNewGroupName("");
      setNewGroupDesc("");
      toast({ title: "Group created", description: `${group.name} has been created` });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/customer-groups/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-groups"] });
      setShowEditDialog(false);
      toast({ title: "Group updated" });
    },
  });

  const duplicateGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/customer-groups/${id}/duplicate`, {});
      return res.json();
    },
    onSuccess: (group: CustomerGroup) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-groups"] });
      setSelectedGroupId(group.id);
      toast({ title: "Group duplicated", description: `${group.name} created` });
    },
  });

  const archiveGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/customer-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-groups"] });
      setSelectedGroupId(null);
      toast({ title: "Group archived" });
    },
  });

  const saveRightsMutation = useMutation({
    mutationFn: async (data: { groupId: number; rights: any[] }) => {
      const res = await apiRequest("PUT", `/api/customer-rights/${data.groupId}`, { rights: data.rights });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-rights", selectedGroupId] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-groups"] });
      setLocalRights({});
      setUnsavedChanges(false);
      toast({ title: "Rights saved", description: "Customer permissions updated successfully" });
    },
  });

  const toggleSection = useCallback((key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const getRight = useCallback((category: string, featureKey: string) => {
    const k = `${category}:${featureKey}`;
    return rightsMap[k] || { enabled: false, webAccess: true, appAccess: false };
  }, [rightsMap]);

  const updateRight = useCallback((category: string, featureKey: string, field: string, value: any) => {
    const k = `${category}:${featureKey}`;
    setLocalRights(prev => ({
      ...prev,
      [k]: { ...(prev[k] || getRight(category, featureKey)), [field]: value },
    }));
    setUnsavedChanges(true);
  }, [getRight]);

  const enableAllInCategory = useCallback((category: string, features: typeof BILLING_FEATURES) => {
    setLocalRights(prev => {
      const next = { ...prev };
      features.forEach(f => {
        const k = `${category}:${f.key}`;
        next[k] = { ...(next[k] || getRight(category, f.key)), enabled: true, webAccess: true, appAccess: true };
      });
      return next;
    });
    setUnsavedChanges(true);
  }, [getRight]);

  const disableAllInCategory = useCallback((category: string, features: typeof BILLING_FEATURES) => {
    setLocalRights(prev => {
      const next = { ...prev };
      features.forEach(f => {
        const k = `${category}:${f.key}`;
        next[k] = { ...(next[k] || getRight(category, f.key)), enabled: false };
      });
      return next;
    });
    setUnsavedChanges(true);
  }, [getRight]);

  const handleSaveRights = () => {
    if (!selectedGroupId) return;
    const allRights: any[] = [];
    Object.keys(rightsMap).forEach(k => {
      const [category, featureKey] = k.split(":");
      const r = rightsMap[k];
      allRights.push({ category, featureKey, enabled: r.enabled, webAccess: r.webAccess, appAccess: r.appAccess, conditions: r.conditions || null });
    });
    Object.keys(localRights).forEach(k => {
      if (!rightsMap[k]) {
        const [category, featureKey] = k.split(":");
        const r = localRights[k];
        allRights.push({ category, featureKey, enabled: r.enabled, webAccess: r.webAccess, appAccess: r.appAccess, conditions: r.conditions || null });
      }
    });
    saveRightsMutation.mutate({ groupId: selectedGroupId, rights: allRights });
  };

  const summary = useMemo(() => {
    let totalEnabled = 0;
    let financialActive = 0;
    let restricted = 0;
    let appCount = 0;
    let webCount = 0;
    let paymentDisabled = false;
    let criticalNotifsDisabled = false;

    const allFeatureKeys = new Set<string>();
    ALL_CATEGORIES.forEach(cat => {
      cat.features.forEach(f => {
        allFeatureKeys.add(`${cat.key}:${f.key}`);
        const r = rightsMap[`${cat.key}:${f.key}`];
        if (r?.enabled) {
          totalEnabled++;
          if (cat.key === "billing" || cat.key === "payment") financialActive++;
          if (r.appAccess) appCount++;
          if (r.webAccess) webCount++;
        } else {
          restricted++;
        }
      });
    });

    const paymentR = getRight("payment", "make_online_payment");
    if (!paymentR.enabled) paymentDisabled = true;
    const serviceAlertR = getRight("notification", "service_alerts");
    const billingReminderR = getRight("notification", "billing_reminders");
    if (!serviceAlertR.enabled && !billingReminderR.enabled) criticalNotifsDisabled = true;

    return { totalEnabled, financialActive, restricted, appCount, webCount, paymentDisabled, criticalNotifsDisabled };
  }, [rightsMap, getRight]);

  if (groupsLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  const renderFeatureRow = (cat: string, f: typeof BILLING_FEATURES[0], idx: number) => {
    const r = getRight(cat, f.key);
    const FIcon = f.icon;
    return (
      <div
        key={f.key}
        className={`grid grid-cols-[1fr,80px,80px,80px] items-center px-4 py-3 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"} hover:bg-blue-50/30 transition-colors`}
        data-testid={`row-feature-${cat}-${f.key}`}
      >
        <div className="flex items-center gap-3">
          <FIcon className="h-4 w-4 text-teal-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">{f.label}</p>
            <p className="text-[11px] text-muted-foreground">{f.desc}</p>
          </div>
        </div>
        <div className="flex justify-center">
          <Switch
            checked={r.enabled}
            onCheckedChange={(v) => updateRight(cat, f.key, "enabled", v)}
            className="scale-90"
            data-testid={`switch-enable-${cat}-${f.key}`}
          />
        </div>
        <div className="flex justify-center">
          <Switch
            checked={r.webAccess && r.enabled}
            onCheckedChange={(v) => updateRight(cat, f.key, "webAccess", v)}
            disabled={!r.enabled}
            className="scale-75"
            data-testid={`switch-web-${cat}-${f.key}`}
          />
        </div>
        <div className="flex justify-center">
          <Switch
            checked={r.appAccess && r.enabled}
            onCheckedChange={(v) => updateRight(cat, f.key, "appAccess", v)}
            disabled={!r.enabled}
            className="scale-75"
            data-testid={`switch-app-${cat}-${f.key}`}
          />
        </div>
      </div>
    );
  };

  const renderCategorySection = (cat: typeof ALL_CATEGORIES[0]) => {
    const isExpanded = expandedSections.has(cat.key);
    const CatIcon = cat.icon;
    const enabledCount = cat.features.filter(f => getRight(cat.key, f.key).enabled).length;
    const totalCount = cat.features.length;
    const pct = totalCount > 0 ? Math.round((enabledCount / totalCount) * 100) : 0;
    let statusColor = "bg-red-500/10 text-red-500 border-red-500/20";
    let statusLabel = "Disabled";
    if (pct === 100) { statusColor = "bg-green-500/10 text-green-500 border-green-500/20"; statusLabel = "Full Access"; }
    else if (pct > 0) { statusColor = "bg-amber-500/10 text-amber-500 border-amber-500/20"; statusLabel = "Limited"; }

    return (
      <Card key={cat.key} className="border-slate-200/60 overflow-hidden" data-testid={`card-category-${cat.key}`}>
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
          onClick={() => toggleSection(cat.key)}
        >
          <div className="flex items-center gap-3">
            {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
            <CatIcon className="h-5 w-5 text-teal-500" />
            <span className="font-semibold text-sm">{cat.label}</span>
            <Badge variant="outline" className={`text-[10px] ${statusColor}`}>{statusLabel}</Badge>
            <Badge variant="outline" className="text-[10px] text-slate-400">{enabledCount}/{totalCount}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-green-500 hover:text-green-600"
                    onClick={(e) => { e.stopPropagation(); enableAllInCategory(cat.key, cat.features); }}
                    data-testid={`button-enable-all-${cat.key}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Enable All</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500 hover:text-red-600"
                    onClick={(e) => { e.stopPropagation(); disableAllInCategory(cat.key, cat.features); }}
                    data-testid={`button-disable-all-${cat.key}`}>
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Disable All</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {isExpanded && (
          <div className="border-t border-slate-100">
            <div className="grid grid-cols-[1fr,80px,80px,80px] items-center px-4 py-2 bg-slate-50/80 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Feature</span>
              <span className="text-center">Enabled</span>
              <span className="text-center flex items-center justify-center gap-1"><Monitor className="h-3 w-3" />Web</span>
              <span className="text-center flex items-center justify-center gap-1"><Smartphone className="h-3 w-3" />App</span>
            </div>
            {cat.features.map((f, i) => renderFeatureRow(cat.key, f, i))}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6" data-testid="customer-rights-page">
      <div className="rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#0D9488] p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Shield className="h-7 w-7" />
              Customer Rights
            </h1>
            <p className="text-white/70 mt-1">App & Web Permissions — Customer Portal Access Control</p>
          </div>
          <div className="flex items-center gap-2">
            {unsavedChanges && (
              <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/30 animate-pulse" data-testid="badge-unsaved">
                <AlertTriangle className="h-3 w-3 mr-1" /> Unsaved Changes
              </Badge>
            )}
            {groups.length === 0 && (
              <Button variant="secondary" onClick={() => initDefaultGroupsMutation.mutate()} disabled={initDefaultGroupsMutation.isPending} data-testid="button-init-groups">
                {initDefaultGroupsMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Initialize Default Groups
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowCreateDialog(true)} data-testid="button-create-group">
              <Plus className="h-4 w-4 mr-2" /> New Group
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {[
          { label: "Customer Groups", value: groups.length, icon: Users, color: "text-blue-500" },
          { label: "System Groups", value: groups.filter(g => g.isSystem).length, icon: Lock, color: "text-slate-500" },
          { label: "Custom Groups", value: groups.filter(g => !g.isSystem).length, icon: Unlock, color: "text-teal-500" },
          { label: "Features Enabled", value: summary.totalEnabled, icon: CheckCircle2, color: "text-green-500" },
          { label: "Restricted", value: summary.restricted, icon: Ban, color: "text-red-500" },
          { label: "Active Restrictions", value: selectedGroup?.activeRestrictions || 0, icon: ShieldAlert, color: "text-amber-500" },
        ].map((kpi, i) => (
          <Card key={i} className="border-slate-200/60" data-testid={`card-kpi-${i}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <kpi.icon className={`h-8 w-8 ${kpi.color} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <Card className="border-slate-200/60" data-testid="card-group-selector">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-500" /> Customer Groups
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {groups.map(group => {
                  const typeColors: Record<string, string> = {
                    default: "bg-blue-50 text-blue-600",
                    corporate: "bg-purple-50 text-purple-600",
                    residential: "bg-green-50 text-green-600",
                    vip: "bg-amber-50 text-amber-600",
                    suspended: "bg-red-50 text-red-600",
                    package: "bg-indigo-50 text-indigo-600",
                    region: "bg-cyan-50 text-cyan-600",
                    custom: "bg-slate-50 text-slate-600",
                  };
                  return (
                    <button
                      key={group.id}
                      onClick={() => { setSelectedGroupId(group.id); setLocalRights({}); setUnsavedChanges(false); }}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selectedGroupId === group.id ? "bg-teal-50 border-l-2 border-teal-500" : ""}`}
                      data-testid={`button-group-${group.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {group.isSystem ? <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" /> : <Unlock className="h-3.5 w-3.5 text-teal-400 shrink-0" />}
                          <span className="font-medium text-sm truncate">{group.name}</span>
                        </div>
                        <Badge className={`text-[9px] shrink-0 ml-1 border-0 ${typeColors[group.groupType || "custom"] || typeColors.custom}`}>
                          {group.groupType}
                        </Badge>
                      </div>
                      {group.description && (
                        <p className="text-[11px] text-muted-foreground mt-1 truncate pl-5.5">{group.description}</p>
                      )}
                    </button>
                  );
                })}
                {groups.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    No groups configured. Initialize default groups or create a new one.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedGroup && (
            <Card className="mt-3 border-slate-200/60" data-testid="card-group-actions">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Group Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-xs"
                    onClick={() => { setEditGroupName(selectedGroup.name); setEditGroupDesc(selectedGroup.description || ""); setShowEditDialog(true); }}
                    data-testid="button-edit-group">
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs"
                    onClick={() => duplicateGroupMutation.mutate(selectedGroup.id)}
                    disabled={duplicateGroupMutation.isPending}
                    data-testid="button-duplicate-group">
                    <Copy className="h-3 w-3 mr-1" /> Duplicate
                  </Button>
                  {!selectedGroup.isSystem && (
                    <Button variant="outline" size="sm" className="text-xs text-red-500 hover:text-red-600 col-span-2"
                      onClick={() => archiveGroupMutation.mutate(selectedGroup.id)}
                      disabled={archiveGroupMutation.isPending}
                      data-testid="button-archive-group">
                      <Archive className="h-3 w-3 mr-1" /> Archive Group
                    </Button>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Web Access</span>
                    <Badge variant="outline" className={`text-[10px] ${selectedGroup.webAccessEnabled ? "text-green-500" : "text-red-500"}`}>
                      {selectedGroup.webAccessEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">App Access</span>
                    <Badge variant="outline" className={`text-[10px] ${selectedGroup.appAccessEnabled ? "text-green-500" : "text-red-500"}`}>
                      {selectedGroup.appAccessEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Group ID</span>
                    <span className="font-mono text-[10px]">{selectedGroup.groupId}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Restrictions</span>
                    <span className="font-mono text-[10px]">{selectedGroup.activeRestrictions}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="col-span-9">
          {!selectedGroupId ? (
            <Card className="border-slate-200/60">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Shield className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-500">Select a Customer Group</h3>
                <p className="text-sm text-muted-foreground mt-1">Choose a group from the left panel to configure customer access rights</p>
              </CardContent>
            </Card>
          ) : rightsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-teal-500" />
                    {selectedGroup?.name} — Access Rights
                  </h2>
                  <p className="text-xs text-muted-foreground">{selectedGroup?.description}</p>
                </div>
                <Button
                  onClick={handleSaveRights}
                  disabled={!unsavedChanges || saveRightsMutation.isPending}
                  className="bg-gradient-to-r from-[#1D4ED8] to-[#0D9488] hover:from-[#1e40af] hover:to-[#0f766e]"
                  data-testid="button-save-rights"
                >
                  {saveRightsMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save All Rights
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="billing" data-testid="tab-billing">
                    <Receipt className="h-4 w-4 mr-1.5" /> Billing & Payment
                  </TabsTrigger>
                  <TabsTrigger value="notifications" data-testid="tab-notifications">
                    <Bell className="h-4 w-4 mr-1.5" /> Notifications
                  </TabsTrigger>
                  <TabsTrigger value="services" data-testid="tab-services">
                    <Package className="h-4 w-4 mr-1.5" /> Services & Self-Service
                  </TabsTrigger>
                  <TabsTrigger value="summary" data-testid="tab-summary">
                    <BarChart3 className="h-4 w-4 mr-1.5" /> Summary
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="billing" className="mt-4 space-y-3">
                  {[ALL_CATEGORIES[0], ALL_CATEGORIES[1]].map(cat => renderCategorySection(cat))}

                  <Card className="border-amber-200/60 bg-amber-50/30" data-testid="card-conditional-billing">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="h-4 w-4" /> Conditional Billing Rules
                      </CardTitle>
                      <CardDescription className="text-xs">Smart rules applied based on account status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[
                          { label: "Hide billing if account suspended", desc: "Suspended accounts cannot view billing details", field: "hide_billing_suspended" },
                          { label: "Restrict payment if under investigation", desc: "Block payments during fraud investigation", field: "restrict_payment_investigation" },
                          { label: "Show overdue warning banner", desc: "Display prominent overdue notice to customer", field: "show_overdue_banner" },
                          { label: "Limit payment methods", desc: "Restrict to approved payment methods only", field: "limit_payment_methods" },
                          { label: "Corporate bulk invoice download", desc: "Enable bulk PDF download for corporate accounts", field: "corporate_bulk_download" },
                          { label: "Hide postpaid section for prepaid", desc: "Hide postpaid billing for prepaid customers", field: "hide_postpaid_prepaid" },
                        ].map(rule => (
                          <div key={rule.field} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/60 border border-amber-100">
                            <div>
                              <p className="text-sm font-medium">{rule.label}</p>
                              <p className="text-[11px] text-muted-foreground">{rule.desc}</p>
                            </div>
                            <Switch className="scale-90" data-testid={`switch-conditional-${rule.field}`} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notifications" className="mt-4 space-y-3">
                  {[ALL_CATEGORIES[2], ALL_CATEGORIES[3]].map(cat => renderCategorySection(cat))}

                  <Card className="border-blue-200/60 bg-blue-50/30" data-testid="card-advanced-notification">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                        <Info className="h-4 w-4" /> Advanced Notification Controls
                      </CardTitle>
                      <CardDescription className="text-xs">Additional notification management settings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[
                          { label: "Critical alerts cannot be disabled", desc: "Service alerts and security notifications are always delivered", field: "mandatory_critical" },
                          { label: "Allow promotional campaigns", desc: "Enable promotional message delivery to customers", field: "allow_promotions" },
                          { label: "Silence non-critical alerts", desc: "Suppress low-priority notifications", field: "silence_noncritical" },
                          { label: "Compliance notification policy", desc: "Ensure regulatory communication compliance", field: "compliance_policy" },
                        ].map(rule => (
                          <div key={rule.field} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/60 border border-blue-100">
                            <div>
                              <p className="text-sm font-medium">{rule.label}</p>
                              <p className="text-[11px] text-muted-foreground">{rule.desc}</p>
                            </div>
                            <Switch className="scale-90" data-testid={`switch-notif-${rule.field}`} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="services" className="mt-4 space-y-3">
                  {[ALL_CATEGORIES[4], ALL_CATEGORIES[5]].map(cat => renderCategorySection(cat))}

                  <Card className="border-purple-200/60 bg-purple-50/30" data-testid="card-restriction-controls">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
                        <Lock className="h-4 w-4" /> Restriction Controls
                      </CardTitle>
                      <CardDescription className="text-xs">Service restriction rules based on account conditions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[
                          { label: "Disable support for unpaid accounts", desc: "Block ticket creation for overdue accounts", field: "disable_support_unpaid" },
                          { label: "Disable upgrade for locked contracts", desc: "Prevent upgrades during contract lock period", field: "disable_upgrade_locked" },
                          { label: "Restrict asset visibility", desc: "Hide equipment details from non-authorized users", field: "restrict_asset_visibility" },
                          { label: "Restrict relocation for overdue > 30 days", desc: "Block relocation requests for long-overdue accounts", field: "restrict_relocation_overdue" },
                          { label: "OTP required for profile changes", desc: "Require OTP verification for account updates", field: "otp_profile_changes" },
                          { label: "Session timeout control", desc: "Auto-logout after inactivity period", field: "session_timeout" },
                        ].map(rule => (
                          <div key={rule.field} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/60 border border-purple-100">
                            <div>
                              <p className="text-sm font-medium">{rule.label}</p>
                              <p className="text-[11px] text-muted-foreground">{rule.desc}</p>
                            </div>
                            <Switch className="scale-90" data-testid={`switch-restrict-${rule.field}`} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200/60 bg-slate-50/30" data-testid="card-security-controls">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-teal-500" /> Security & Compliance
                      </CardTitle>
                      <CardDescription className="text-xs">Data protection and compliance settings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[
                          { label: "Mask sensitive financial data", desc: "Partially hide account numbers and financial details", field: "mask_financial" },
                          { label: "Payment confirmation validation", desc: "Require double-confirmation for payments", field: "payment_validation" },
                          { label: "Access logs for customer actions", desc: "Track and log all customer portal activity", field: "access_logs" },
                        ].map(rule => (
                          <div key={rule.field} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/60 border border-slate-200">
                            <div>
                              <p className="text-sm font-medium">{rule.label}</p>
                              <p className="text-[11px] text-muted-foreground">{rule.desc}</p>
                            </div>
                            <Switch className="scale-90" data-testid={`switch-security-${rule.field}`} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="summary" className="mt-4 space-y-4">
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { label: "Total Enabled", value: summary.totalEnabled, icon: CheckCircle2, color: "text-green-500" },
                      { label: "Financial Active", value: summary.financialActive, icon: CreditCard, color: "text-blue-500" },
                      { label: "Restricted", value: summary.restricted, icon: Ban, color: "text-red-500" },
                      { label: "Web Features", value: summary.webCount, icon: Monitor, color: "text-indigo-500" },
                      { label: "App Features", value: summary.appCount, icon: Smartphone, color: "text-teal-500" },
                    ].map((s, i) => {
                      const SIcon = s.icon;
                      return (
                        <Card key={i} className="border-slate-200/60" data-testid={`card-summary-${i}`}>
                          <CardContent className="p-4 text-center">
                            <SIcon className={`h-8 w-8 ${s.color} mx-auto mb-2`} />
                            <p className="text-2xl font-bold">{s.value}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {summary.paymentDisabled && (
                    <Card className="border-amber-200 bg-amber-50/50" data-testid="card-warning-payment">
                      <CardContent className="p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm text-amber-700">Payment Access Disabled</p>
                          <p className="text-xs text-amber-600 mt-1">Online payment is disabled for this customer group. Customers will not be able to pay through the portal.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {summary.criticalNotifsDisabled && (
                    <Card className="border-red-200 bg-red-50/50" data-testid="card-warning-notifications">
                      <CardContent className="p-4 flex items-start gap-3">
                        <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm text-red-700">Critical Notifications Disabled</p>
                          <p className="text-xs text-red-600 mt-1">Both service alerts and billing reminders are disabled. Customers may miss important service updates.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {summary.financialActive === 0 && (
                    <Card className="border-red-200 bg-red-50/50" data-testid="card-warning-financial">
                      <CardContent className="p-4 flex items-start gap-3">
                        <CreditCard className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm text-red-700">Financial Visibility Fully Disabled</p>
                          <p className="text-xs text-red-600 mt-1">No billing or payment features are enabled. Customers will have no financial visibility in the portal.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-slate-200/60" data-testid="card-feature-overview">
                    <CardHeader>
                      <CardTitle className="text-sm">Feature Access Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {ALL_CATEGORIES.map(cat => {
                          const CatIcon = cat.icon;
                          const enabledCount = cat.features.filter(f => getRight(cat.key, f.key).enabled).length;
                          const webCount = cat.features.filter(f => { const r = getRight(cat.key, f.key); return r.enabled && r.webAccess; }).length;
                          const appCount = cat.features.filter(f => { const r = getRight(cat.key, f.key); return r.enabled && r.appAccess; }).length;
                          let statusBadge = "bg-red-500/10 text-red-500";
                          if (enabledCount === cat.features.length) statusBadge = "bg-green-500/10 text-green-500";
                          else if (enabledCount > 0) statusBadge = "bg-amber-500/10 text-amber-500";
                          return (
                            <div key={cat.key} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/30">
                              <div className="flex items-center gap-2">
                                <CatIcon className="h-4 w-4 text-teal-500" />
                                <span className="text-sm font-medium">{cat.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px] text-blue-500"><Monitor className="h-2.5 w-2.5 mr-0.5" />{webCount}</Badge>
                                <Badge variant="outline" className="text-[9px] text-teal-500"><Smartphone className="h-2.5 w-2.5 mr-0.5" />{appCount}</Badge>
                                <Badge className={`text-[10px] border-0 ${statusBadge}`}>{enabledCount}/{cat.features.length}</Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200/60" data-testid="card-integration-info">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" /> Integration & Policy Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {[
                          { icon: Receipt, text: "Billing module checks these rights before displaying financial data to customers", color: "text-blue-500" },
                          { icon: Bell, text: "Notification module respects channel preferences and opt-out settings per group", color: "text-amber-500" },
                          { icon: Package, text: "Service module enforces upgrade/downgrade restrictions based on contract status", color: "text-green-500" },
                          { icon: Smartphone, text: "Mobile app and web portal render features based on platform-specific toggles", color: "text-teal-500" },
                          { icon: ShieldCheck, text: "Security controls (OTP, session timeout, masking) apply across all platforms", color: "text-purple-500" },
                          { icon: AlertTriangle, text: "Conditional rules override individual feature toggles when triggered by account status", color: "text-red-500" },
                        ].map((note, i) => {
                          const NIcon = note.icon;
                          return (
                            <div key={i} className="flex items-start gap-2 p-2 rounded bg-slate-50/50">
                              <NIcon className={`h-4 w-4 ${note.color} shrink-0 mt-0.5`} />
                              <span className="text-muted-foreground">{note.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Customer Group</DialogTitle>
            <DialogDescription>Add a new customer segment with specific access rights</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Group Name</Label>
              <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="e.g., Prepaid Customers" data-testid="input-new-group-name" />
            </div>
            <div>
              <Label className="text-sm">Description</Label>
              <Textarea value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} placeholder="Describe the customer group..." rows={3} data-testid="input-new-group-desc" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createGroupMutation.mutate({ name: newGroupName, description: newGroupDesc })}
              disabled={!newGroupName.trim() || createGroupMutation.isPending}
              data-testid="button-confirm-create"
            >
              {createGroupMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer Group</DialogTitle>
            <DialogDescription>Update group name and description</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Group Name</Label>
              <Input value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} data-testid="input-edit-group-name" />
            </div>
            <div>
              <Label className="text-sm">Description</Label>
              <Textarea value={editGroupDesc} onChange={(e) => setEditGroupDesc(e.target.value)} rows={3} data-testid="input-edit-group-desc" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button
              onClick={() => selectedGroupId && updateGroupMutation.mutate({ id: selectedGroupId, data: { name: editGroupName, description: editGroupDesc } })}
              disabled={!editGroupName.trim() || updateGroupMutation.isPending}
              data-testid="button-confirm-edit"
            >
              {updateGroupMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
