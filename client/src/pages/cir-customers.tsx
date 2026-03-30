import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, Wifi, Building2, DollarSign,
  AlertTriangle, Shield, Calendar, Activity, Server, Globe, ChevronDown, ChevronUp, Users,
  FileSpreadsheet, Send, CheckCircle2, XCircle, Loader2, SkipForward, Sparkles,
  ArrowRight, RefreshCw, Check, Zap, Eye, Phone, Mail, MapPin, Network, Lock,
  MessageSquare, CalendarClock, Power, PowerOff, UserCheck, UserPlus, RotateCcw, CreditCard,
  Clock, Download, FileText, Rss, Filter, Radio, ClipboardList,
  MessageCircle, Smartphone, Bell, CalendarRange,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCirCustomerSchema, type CirCustomer, type InsertCirCustomer } from "@shared/schema";
import { z } from "zod";

const statusColors: Record<string, string> = {
  active: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950",
  suspended: "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950",
  pending: "text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-950",
  expired: "text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800",
};

type AutoStep = { step: string; status: "pending" | "running" | "success" | "error" | "skipped"; message: string; data?: any };

const CIR_AUTO_STEPS = [
  { key: "invoice",               label: "Auto Invoice Generation",            icon: FileSpreadsheet, description: "Generating first invoice for this CIR customer" },
  { key: "ip_sync",               label: "IP Address Add and SYNC in Network", icon: Radio,           description: "Assigning dedicated IP block and syncing CIR network" },
  { key: "task",                  label: "Installation Task",                  icon: ClipboardList,   description: "Creating CIR circuit installation task" },
  { key: "notification_customer", label: "Customer Notification",              icon: Send,            description: "Sending welcome message to CIR client contact" },
  { key: "notification_employee", label: "Employee Notification",              icon: Users,           description: "Notifying account manager / field team" },
];

export default function CirCustomersPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CirCustomer | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formSection, setFormSection] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [showEntries, setShowEntries] = useState("100");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [vendorFilter, setVendorFilter] = useState("all");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [linkTypeFilter, setLinkTypeFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [joinDateFilter, setJoinDateFilter] = useState("all");
  const [billingStatusFilter, setBillingStatusFilter] = useState("all");
  const [serviceStatusFilter, setServiceStatusFilter] = useState("all");
  const [contractStatusFilter, setContractStatusFilter] = useState("all");

  const [referralsDialogOpen, setReferralsDialogOpen] = useState(false);
  const [viewingReferralsCir, setViewingReferralsCir] = useState<CirCustomer | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [viewingDetails, setViewingDetails] = useState<CirCustomer | null>(null);

  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [smsCustomer, setSmsCustomer] = useState<CirCustomer | null>(null);
  const [smsChannel, setSmsChannel] = useState("sms");
  const [smsCategory, setSmsCategory] = useState("bill_reminder");
  const [smsMessage, setSmsMessage] = useState("");
  const [smsSubject, setSmsSubject] = useState("");

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusCustomer, setStatusCustomer] = useState<CirCustomer | null>(null);
  const [statusAction, setStatusAction] = useState("closed");
  const [statusReasonSelect, setStatusReasonSelect] = useState("");
  const [statusReason, setStatusReason] = useState("");

  const statusReasonOptions: Record<string, { value: string; label: string }[]> = {
    active: [
      { value: "active", label: "Active" },
      { value: "reactive", label: "Reactive" },
    ],
    closed: [
      { value: "house_shift", label: "House Shift" },
      { value: "temporary_closed", label: "Temporary Closed" },
      { value: "shift_to_other_isp", label: "Shift to Other ISP" },
    ],
    suspended: [
      { value: "bill_issue", label: "Bill Issue" },
      { value: "temporary_suspend", label: "Temporary Suspend" },
    ],
    expired: [
      { value: "recharge_next_month", label: "Recharge on Next Month" },
      { value: "other", label: "Other" },
    ],
  };

  const smsCategories = [
    { value: "bill_reminder", label: "Bill Reminder", defaultMsg: "Dear {name}, your bill is due. Please pay before the due date to avoid service interruption." },
    { value: "invoice_softcopy", label: "Invoice Softcopy (WhatsApp/Email)", defaultMsg: "Dear {name}, please find your invoice attached." },
    { value: "account_suspend", label: "Account Suspend Notice", defaultMsg: "Dear {name}, your account has been suspended due to non-payment." },
    { value: "payment_confirmation", label: "Payment Confirmation", defaultMsg: "Dear {name}, we have received your payment. Thank you!" },
    { value: "service_activation", label: "Service Activation", defaultMsg: "Dear {name}, your internet service has been activated." },
    { value: "package_change", label: "Package Change Notification", defaultMsg: "Dear {name}, your package has been changed successfully." },
    { value: "maintenance_notice", label: "Maintenance Notice", defaultMsg: "Dear {name}, scheduled maintenance will be performed in your area." },
    { value: "welcome_message", label: "Welcome Message", defaultMsg: "Welcome to our network, {name}!" },
    { value: "custom", label: "Custom Message", defaultMsg: "" },
  ];

  const openSmsDialog = (c: CirCustomer) => {
    setSmsCustomer(c);
    setSmsChannel("sms");
    setSmsCategory("bill_reminder");
    const cat = smsCategories.find(x => x.value === "bill_reminder");
    setSmsMessage(cat?.defaultMsg.replace("{name}", c.companyName) || "");
    setSmsSubject("");
    setSmsDialogOpen(true);
  };

  const handleCategoryChange = (value: string) => {
    setSmsCategory(value);
    const cat = smsCategories.find(x => x.value === value);
    if (cat && smsCustomer) {
      setSmsMessage(cat.defaultMsg.replace("{name}", smsCustomer.companyName));
      if (value === "invoice_softcopy") setSmsSubject("Invoice Copy");
      else if (value === "bill_reminder") setSmsSubject("Bill Reminder");
      else if (value === "account_suspend") setSmsSubject("Account Suspension Notice");
      else if (value === "payment_confirmation") setSmsSubject("Payment Confirmation");
      else setSmsSubject("");
    }
  };

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: { channel: string; customer: CirCustomer; subject: string; message: string; category: string }) => {
      if (data.channel === "email") {
        if (!data.customer.email) throw new Error("Customer has no email address");
        const res = await apiRequest("POST", "/api/notifications/send-email", { to: data.customer.email, subject: data.subject, body: data.message });
        return res.json();
      } else if (data.channel === "sms") {
        if (!data.customer.phone) throw new Error("Customer has no phone number");
        const res = await apiRequest("POST", "/api/notifications/send-sms", { to: data.customer.phone, message: data.message });
        return res.json();
      } else if (data.channel === "whatsapp") {
        const res = await apiRequest("POST", "/api/notifications/send-sms", { to: data.customer.phone, message: data.message });
        return res.json();
      } else if (data.channel === "in_app") {
        const res = await apiRequest("POST", "/api/notification-dispatches", { channel: "in_app", recipient: data.customer.email || `CIR-${data.customer.id}`, subject: data.subject, body: data.message, status: "sent", createdAt: new Date().toISOString() });
        return res.json();
      }
    },
    onSuccess: (_, vars) => {
      toast({ title: "Sent Successfully", description: `${vars.channel === "email" ? "Email" : vars.channel === "sms" ? "SMS" : vars.channel === "whatsapp" ? "WhatsApp" : "Notification"} sent to ${vars.customer.companyName}` });
      setSmsDialogOpen(false);
    },
    onError: (err: Error) => { toast({ title: "Failed to Send", description: err.message, variant: "destructive" }); },
  });

  const openStatusDialog = (c: CirCustomer) => {
    setStatusCustomer(c);
    setStatusAction(c.status === "active" ? "closed" : "active");
    setStatusReasonSelect("");
    setStatusReason("");
    setStatusDialogOpen(true);
  };

  const statusToggleMutation = useMutation({
    mutationFn: async (data: { customer: CirCustomer; newStatus: string; reason: string }) => {
      const res = await apiRequest("PATCH", `/api/cir-customers/${data.customer.id}`, { status: data.newStatus });
      const result = await res.json();
      await apiRequest("POST", "/api/audit-logs", {
        action: data.newStatus === "active" ? "enable" : "disable",
        module: "cir_customers",
        entityType: "cir_customer",
        entityId: data.customer.id,
        oldValues: JSON.stringify({ status: data.customer.status }),
        newValues: JSON.stringify({ status: data.newStatus }),
        description: `CIR Customer ${data.customer.companyName} (CIR-${data.customer.id}) status changed from "${data.customer.status}" to "${data.newStatus}". Reason: ${data.reason || "N/A"}`,
        createdAt: new Date().toISOString(),
      });
      return result;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cir-customers"] });
      toast({ title: "Status Updated", description: `${vars.customer.companyName} is now ${vars.newStatus}` });
      setStatusDialogOpen(false);
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  // Automation modal state
  const [autoModalOpen, setAutoModalOpen] = useState(false);
  const [autoSteps, setAutoSteps] = useState<AutoStep[]>([]);
  const [autoComplete, setAutoComplete] = useState(false);
  const [autoCustomerName, setAutoCustomerName] = useState("");
  const [addAnotherPending, setAddAnotherPending] = useState(false);

  const fromQueryId = new URLSearchParams(window.location.search).get("fromQuery");

  const { data: cirCustomers, isLoading } = useQuery<CirCustomer[]>({ queryKey: ["/api/cir-customers"] });
  const { data: vendors } = useQuery<any[]>({ queryKey: ["/api/vendors"] });
  const { data: allClientRequests } = useQuery<any[]>({ queryKey: ["/api/customer-queries"] });
  const { data: fromQueryData } = useQuery<any>({
    queryKey: ["/api/customer-queries", fromQueryId],
    enabled: !!fromQueryId,
  });

  const cirReferralCount = (cirId: number) => (allClientRequests || []).filter((q: any) => q.referredByType === "cir" && q.referredById === cirId).length;
  const cirReferrals = (cirId: number) => (allClientRequests || []).filter((q: any) => q.referredByType === "cir" && q.referredById === cirId);

  const form = useForm<InsertCirCustomer>({
    resolver: zodResolver(insertCirCustomerSchema),
    defaultValues: {
      companyName: "", contactPerson: "", cnic: "", ntn: "", email: "", phone: "", address: "", city: "", branch: "",
      vendorPort: "", committedBandwidth: "", burstBandwidth: "", uploadSpeed: "", downloadSpeed: "",
      contentionRatio: "", vlanId: "", onuDevice: "", staticIp: "", subnetMask: "", gateway: "", dns: "",
      publicIpBlock: "", contractStartDate: "", contractEndDate: "", slaLevel: "99.5", slaPenaltyClause: "",
      autoRenewal: false, monthlyCharges: "0", installationCharges: "0", securityDeposit: "0",
      billingCycle: "monthly", invoiceType: "tax", lateFeePolicy: "", radiusProfile: "", bandwidthProfileName: "",
      monitoringEnabled: false, snmpMonitoring: false, trafficAlerts: false, status: "active", notes: "",
    },
  });

  const runCirAutomation = async (customerId: number) => {
    const animate = (steps: AutoStep[]) => setAutoSteps([...steps]);
    const steps: AutoStep[] = CIR_AUTO_STEPS.map(s => ({ step: s.key, status: "pending" as const, message: s.description }));
    steps[0] = { ...steps[0], status: "running" };
    animate(steps);
    try {
      const res = await apiRequest("POST", `/api/cir-customers/${customerId}/automate`);
      const result = await res.json();
      const serverSteps: Array<{ step: string; status: string; message: string; data?: any }> = result.steps || [];
      for (let i = 0; i < CIR_AUTO_STEPS.length; i++) {
        const key = CIR_AUTO_STEPS[i].key;
        const found = serverSteps.find(s => s.step === key);
        if (i > 0) { steps[i] = { ...steps[i], status: "running" }; animate(steps); await new Promise(r => setTimeout(r, 500)); }
        steps[i] = { step: key, status: (found?.status as any) || "success", message: found?.message || steps[i].message, data: found?.data };
        animate(steps);
        await new Promise(r => setTimeout(r, 400));
      }
    } catch {
      for (let i = 0; i < steps.length; i++) {
        if (steps[i].status === "pending" || steps[i].status === "running") steps[i] = { ...steps[i], status: "error", message: "Step failed" };
      }
      animate(steps);
    }
    setAutoComplete(true);
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertCirCustomer & { _activate?: boolean }) => {
      const { _activate, ...payload } = data;
      if (_activate) payload.status = "active";
      const r = await apiRequest("POST", "/api/cir-customers", payload);
      return r.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cir-customers"] });
      const isAddAnother = (variables as any)._addAnother;
      if (fromQueryId) {
        apiRequest("POST", `/api/customer-queries/${fromQueryId}/convert`, { customerId: data.id }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["/api/customer-queries"] });
      }
      // Show automation modal
      setAutoCustomerName(data.companyName || "");
      setAutoSteps(CIR_AUTO_STEPS.map(s => ({ step: s.key, status: "pending" as const, message: s.description })));
      setAutoComplete(false);
      setAddAnotherPending(!!isAddAnother);
      setDialogOpen(false);
      setAutoModalOpen(true);
      runCirAutomation(data.id);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCirCustomer> }) => { const r = await apiRequest("PATCH", `/api/cir-customers/${id}`, data); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cir-customers"] }); setDialogOpen(false); setEditing(null); form.reset(); toast({ title: "CIR customer updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/cir-customers/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cir-customers"] }); toast({ title: "CIR customer deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setEditing(null); setFormSection(0);
    form.reset({
      companyName: "", contactPerson: "", cnic: "", ntn: "", email: "", phone: "", address: "", city: "", branch: "",
      vendorPort: "", committedBandwidth: "", burstBandwidth: "", uploadSpeed: "", downloadSpeed: "",
      contentionRatio: "", vlanId: "", onuDevice: "", staticIp: "", subnetMask: "", gateway: "", dns: "",
      publicIpBlock: "", contractStartDate: new Date().toISOString().split("T")[0], contractEndDate: "", slaLevel: "99.5",
      slaPenaltyClause: "", autoRenewal: false, monthlyCharges: "0", installationCharges: "0", securityDeposit: "0",
      billingCycle: "monthly", invoiceType: "tax", lateFeePolicy: "", radiusProfile: "", bandwidthProfileName: "",
      monitoringEnabled: false, snmpMonitoring: false, trafficAlerts: false, status: "active", notes: "",
    });
    setDialogOpen(true);
  };

  // Auto-open and pre-fill when navigated from Convert flow
  useEffect(() => {
    if (!fromQueryData) return;
    const q = fromQueryData;
    setEditing(null);
    setFormSection(0);
    form.reset({
      companyName: q.name || "",
      contactPerson: q.name || "",
      cnic: q.nidNumber || "",
      ntn: "",
      email: q.email || "",
      phone: q.phone || "",
      address: q.address || "",
      city: q.city || "",
      branch: q.branch || "",
      vendorPort: "",
      committedBandwidth: q.bandwidthRequired || "",
      burstBandwidth: "",
      uploadSpeed: "",
      downloadSpeed: "",
      contentionRatio: "",
      vlanId: "",
      onuDevice: "",
      staticIp: q.ipAddress || "",
      subnetMask: "",
      gateway: "",
      dns: "",
      publicIpBlock: "",
      contractStartDate: new Date().toISOString().split("T")[0],
      contractEndDate: "",
      slaLevel: "99.5",
      slaPenaltyClause: "",
      autoRenewal: false,
      monthlyCharges: q.monthlyCharges ? String(q.monthlyCharges) : "0",
      installationCharges: q.installationFee ? String(q.installationFee) : "0",
      securityDeposit: q.securityDeposit ? String(q.securityDeposit) : "0",
      billingCycle: "monthly",
      invoiceType: "tax",
      lateFeePolicy: "",
      radiusProfile: "",
      bandwidthProfileName: "",
      monitoringEnabled: false,
      snmpMonitoring: false,
      trafficAlerts: false,
      status: "active",
      notes: q.remarks || "",
      ...(q.bandwidthVendorId ? { vendorId: q.bandwidthVendorId } : {}),
    });
    setDialogOpen(true);
  }, [fromQueryData]);

  const openEdit = (c: CirCustomer) => {
    setEditing(c); setFormSection(0);
    form.reset({ ...c, vendorId: c.vendorId ?? undefined });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertCirCustomer, opts: { activate?: boolean; addAnother?: boolean } = {}) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate({ ...data, ...(opts.activate ? { _activate: true } : {}), ...(opts.addAnother ? { _addAnother: true } : {}) } as any);
    }
  };

  const filtered = (cirCustomers || [])
    .filter(c => statusFilter === "all" || c.status === statusFilter)
    .filter(c => vendorFilter === "all" || String(c.vendorId) === vendorFilter)
    .filter(c => linkTypeFilter === "all" || (c.linkType || "") === linkTypeFilter)
    .filter(c => serviceTypeFilter === "all" || (c.serviceType || "") === serviceTypeFilter)
    .filter(c => branchFilter === "all" || (c.branch || "") === branchFilter)
    .filter(c => cityFilter === "all" || (c.city || "") === cityFilter)
    .filter(c => contractStatusFilter === "all" || (() => {
      if (!c.contractEndDate) return contractStatusFilter === "none";
      const days = Math.ceil((new Date(c.contractEndDate).getTime() - Date.now()) / 86400000);
      if (days < 0) return contractStatusFilter === "expired";
      if (days <= 30) return contractStatusFilter === "expiring";
      return contractStatusFilter === "active";
    })())
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (c.companyName || "").toLowerCase().includes(q) || (c.contactPerson || "").toLowerCase().includes(q) || (c.staticIp || "").toLowerCase().includes(q);
    })
    .slice(0, parseInt(showEntries) || 100);

  const allCir = cirCustomers || [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const totalActive = allCir.filter(c => c.status === "active").length;
  const totalBandwidth = allCir.filter(c => c.status === "active").reduce((sum, c) => sum + (parseFloat(c.committedBandwidth || "0") || 0), 0);
  const totalRevenue = allCir.filter(c => c.status === "active").reduce((sum, c) => sum + (parseFloat(c.monthlyCharges || "0") || 0), 0);
  const suspended = allCir.filter(c => c.status === "suspended").length;
  const expiring = allCir.filter(c => {
    if (!c.contractEndDate) return false;
    const days = Math.ceil((new Date(c.contractEndDate).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 30;
  }).length;

  const running = totalActive;
  const newThisMonth = allCir.filter(c => c.createdAt && new Date(c.createdAt) >= monthStart).length;
  const renewed = allCir.filter(c => c.autoRenewal === true).length;
  const billPaid = allCir.filter(c => c.status === "active").length;
  const pendingBill = allCir.filter(c => c.status === "suspended" || c.status === "pending").length;

  const uniqueBranches = [...new Set(allCir.map(c => c.branch).filter(Boolean))];
  const uniqueCities = [...new Set(allCir.map(c => c.city).filter(Boolean))];
  const uniqueLinkTypes = [...new Set(allCir.map(c => c.linkType).filter(Boolean))];
  const uniqueServiceTypes = [...new Set(allCir.map(c => c.serviceType).filter(Boolean))];

  const sections = ["Company Info", "Bandwidth", "IP Config", "Contract & SLA", "Billing", "Monitoring"];

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#002B5B] to-[#005EFF] bg-clip-text text-transparent" data-testid="text-cir-title">CIR Customers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Committed Information Rate — Dedicated Bandwidth Clients</p>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm" data-testid="button-assign-employee">
            <Users className="h-4 w-4" />Assign To Employee
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm" data-testid="button-generate-excel">
            <Download className="h-4 w-4" />Generate Excel
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm" data-testid="button-generate-pdf">
            <FileText className="h-4 w-4" />Generate Pdf
          </Button>
        </div>
        <Button size="sm" className="h-9 gap-1.5 text-sm bg-[#1c3557] hover:bg-[#152b44] text-white" data-testid="button-sync-ip">
          <RefreshCw className="h-4 w-4" />SYNC IP Address Ping
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-blue-500 to-blue-700 relative overflow-hidden shadow-md" data-testid="card-running-customers">
          <div className="absolute right-3 top-3 opacity-20"><Wifi className="h-12 w-12" /></div>
          <p className="text-3xl font-bold">{running}</p>
          <p className="font-semibold text-sm mt-1">Running Customers</p>
          <p className="text-xs opacity-80 mt-0.5">Number of active CIR customers</p>
        </div>
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-emerald-400 to-teal-600 relative overflow-hidden shadow-md" data-testid="card-new-customers">
          <div className="absolute right-3 top-3 opacity-20"><UserPlus className="h-12 w-12" /></div>
          <p className="text-3xl font-bold">{newThisMonth}</p>
          <p className="font-semibold text-sm mt-1">New Customers</p>
          <p className="text-xs opacity-80 mt-0.5">Monthly number of new CIR clients</p>
        </div>
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-orange-400 to-orange-600 relative overflow-hidden shadow-md" data-testid="card-renewed-customers">
          <div className="absolute right-3 top-3 opacity-20"><RotateCcw className="h-12 w-12" /></div>
          <p className="text-3xl font-bold">{renewed}</p>
          <p className="font-semibold text-sm mt-1">Renewed Customers</p>
          <p className="text-xs opacity-80 mt-0.5">Monthly number of newly renewed</p>
        </div>
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-slate-500 to-slate-700 relative overflow-hidden shadow-md" data-testid="card-bill-paid">
          <div className="absolute right-3 top-3 opacity-20"><CreditCard className="h-12 w-12" /></div>
          <p className="text-3xl font-bold">{billPaid}</p>
          <p className="font-semibold text-sm mt-1">Bill Paid</p>
          <p className="text-xs opacity-80 mt-0.5">Customers with cleared invoices</p>
        </div>
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-red-500 to-red-700 relative overflow-hidden shadow-md" data-testid="card-pending-bill">
          <div className="absolute right-3 top-3 opacity-20"><Clock className="h-12 w-12" /></div>
          <p className="text-3xl font-bold">{pendingBill}</p>
          <p className="font-semibold text-sm mt-1">Pending Bill</p>
          <p className="text-xs opacity-80 mt-0.5">Customers with outstanding dues</p>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="border rounded-lg bg-card shadow-sm">
        {showFilters && (<div className="p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vendor</label>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="h-9" data-testid="select-vendor-filter"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select</SelectItem>
                  {(vendors || []).map(v => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer Type</label>
              <Select value={customerTypeFilter} onValueChange={setCustomerTypeFilter}>
                <SelectTrigger className="h-9" data-testid="select-customer-type-filter"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="isp">ISP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Service Type</label>
              <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                <SelectTrigger className="h-9" data-testid="select-service-type-filter"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select</SelectItem>
                  <SelectItem value="fiber">Fiber</SelectItem>
                  <SelectItem value="wireless">Wireless</SelectItem>
                  <SelectItem value="dsl">DSL</SelectItem>
                  <SelectItem value="leased_line">Leased Line</SelectItem>
                  {uniqueServiceTypes.filter(t => !["fiber","wireless","dsl","leased_line"].includes(t!)).map(t => <SelectItem key={t} value={t!}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Link Type</label>
              <Select value={linkTypeFilter} onValueChange={setLinkTypeFilter}>
                <SelectTrigger className="h-9" data-testid="select-link-type-filter"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select</SelectItem>
                  <SelectItem value="dedicated">Dedicated</SelectItem>
                  <SelectItem value="shared">Shared</SelectItem>
                  <SelectItem value="p2p">Point to Point</SelectItem>
                  <SelectItem value="mpls">MPLS</SelectItem>
                  {uniqueLinkTypes.filter(t => !["dedicated","shared","p2p","mpls"].includes(t!)).map(t => <SelectItem key={t} value={t!}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Branch</label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="h-9" data-testid="select-branch-filter"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select</SelectItem>
                  {uniqueBranches.map(b => <SelectItem key={b} value={b!}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">City</label>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="h-9" data-testid="select-city-filter"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select</SelectItem>
                  {uniqueCities.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assign To Manager</label>
              <Select value={managerFilter} onValueChange={setManagerFilter}>
                <SelectTrigger className="h-9" data-testid="select-manager-filter"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select</SelectItem>
                  <SelectItem value="bilal">Bilal Hussain</SelectItem>
                  <SelectItem value="sara">Sara Ahmed</SelectItem>
                  <SelectItem value="kamran">Kamran Malik</SelectItem>
                  <SelectItem value="naveed">Naveed Aslam</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Join Date Status</label>
              <Select value={joinDateFilter} onValueChange={setJoinDateFilter}>
                <SelectTrigger className="h-9" data-testid="select-join-date-filter"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Billing Status</label>
              <Select value={billingStatusFilter} onValueChange={setBillingStatusFilter}>
                <SelectTrigger className="h-9" data-testid="select-billing-status-filter"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Service Status</label>
              <Select value={serviceStatusFilter} onValueChange={setServiceStatusFilter}>
                <SelectTrigger className="h-9" data-testid="select-service-status-filter"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contract Status</label>
              <Select value={contractStatusFilter} onValueChange={setContractStatusFilter}>
                <SelectTrigger className="h-9" data-testid="select-contract-status-filter"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="none">No Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>)}
        <div className="flex justify-center border-t py-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={() => setShowFilters(!showFilters)} data-testid="button-toggle-filters">
            {showFilters ? <><ChevronUp className="h-3.5 w-3.5" />Hide</> : <><ChevronDown className="h-3.5 w-3.5" />Show Filters</>}
          </Button>
        </div>
      </div>

      {/* Table Controls Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">SHOW</span>
          <Select value={showEntries} onValueChange={setShowEntries}>
            <SelectTrigger className="w-20 h-9" data-testid="select-show-entries"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="250">250</SelectItem>
              <SelectItem value="500">500</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">ENTRIES</span>
          <Button onClick={() => setLocation("/add-customer")} size="sm" className="h-9 ml-2 bg-gradient-to-r from-[#002B5B] to-[#005EFF] hover:from-[#001f42] hover:to-[#0044cc] gap-1.5" data-testid="button-add-cir">
            <Users className="h-4 w-4" />Add New Customer
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">SEARCH:</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-[220px] h-9" data-testid="input-cir-search" />
          </div>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2.5">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selectedIds.size} customer{selectedIds.size > 1 ? "s" : ""} selected</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900" onClick={() => setSelectedIds(new Set())} data-testid="button-clear-selection">Clear Selection</Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Wifi className="h-12 w-12 mb-3 opacity-30" /><p className="font-medium">No CIR customers found</p>
              <p className="text-sm mt-1">Add your first dedicated bandwidth client</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700">
                    <TableHead className="w-10 pl-4">
                      <Checkbox
                        checked={filtered.length > 0 && filtered.every(c => selectedIds.has(c.id))}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedIds(new Set(filtered.map(c => c.id)));
                          else setSelectedIds(new Set());
                        }}
                        data-testid="checkbox-select-all-cir"
                        className="border-slate-400 data-[state=checked]:bg-white data-[state=checked]:text-slate-900 data-[state=checked]:border-white"
                      />
                    </TableHead>
                    <TableHead className="text-white text-xs whitespace-nowrap">Customer Code</TableHead>
                    <TableHead className="text-white text-xs whitespace-nowrap">Company Name</TableHead>
                    <TableHead className="text-white text-xs whitespace-nowrap">Customer Name</TableHead>
                    <TableHead className="text-white text-xs whitespace-nowrap">Mobile No</TableHead>
                    <TableHead className="text-white text-xs whitespace-nowrap">Email</TableHead>
                    <TableHead className="text-white text-xs whitespace-nowrap">IP Address</TableHead>
                    <TableHead className="text-white text-xs whitespace-nowrap">Branch</TableHead>
                    <TableHead className="text-white text-xs whitespace-nowrap">Vendor</TableHead>
                    <TableHead className="text-white text-xs whitespace-nowrap">Connection Type</TableHead>
                    <TableHead className="text-white text-xs whitespace-nowrap">Current Bandwidth</TableHead>
                    <TableHead className="text-white text-xs whitespace-nowrap">M Bill</TableHead>
                    <TableHead className="text-white text-xs whitespace-nowrap">B Status</TableHead>
                    <TableHead className="text-white text-xs whitespace-nowrap">Contract Status</TableHead>
                    <TableHead className="text-white text-xs w-10">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c, idx) => {
                    const vendor = (vendors || []).find(v => v.id === c.vendorId);
                    const daysLeft = c.contractEndDate ? Math.ceil((new Date(c.contractEndDate).getTime() - Date.now()) / 86400000) : null;
                    const contractStatus = !c.contractEndDate ? "No Contract"
                      : daysLeft !== null && daysLeft < 0 ? "Expired"
                      : daysLeft !== null && daysLeft <= 30 ? `Expiring (${daysLeft}d)`
                      : "Active";
                    const contractColor = contractStatus === "Expired" ? "text-red-600 bg-red-50"
                      : contractStatus.startsWith("Expiring") ? "text-orange-600 bg-orange-50"
                      : contractStatus === "Active" ? "text-green-700 bg-green-50"
                      : "text-slate-500 bg-slate-100";
                    return (
                      <TableRow key={c.id} data-testid={`row-cir-${c.id}`} className={`${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"} ${selectedIds.has(c.id) ? "bg-blue-50 dark:bg-blue-950/40" : ""}`}>
                        <TableCell className="pl-4 w-10" onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(c.id)}
                            onCheckedChange={(checked) => {
                              const next = new Set(selectedIds);
                              if (checked) next.add(c.id); else next.delete(c.id);
                              setSelectedIds(next);
                            }}
                            data-testid={`checkbox-cir-${c.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-xs font-mono font-semibold text-blue-700 dark:text-blue-400 whitespace-nowrap cursor-pointer hover:underline" onClick={() => setLocation(`/cir-customers/${c.id}`)} data-testid={`link-cir-code-${c.id}`}>CIR-{String(c.id).padStart(4, "0")}</TableCell>
                        <TableCell className="text-xs font-semibold whitespace-nowrap cursor-pointer hover:text-blue-600 hover:underline" onClick={() => setLocation(`/cir-customers/${c.id}`)} data-testid={`text-cir-name-${c.id}`}>{c.companyName}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap cursor-pointer hover:text-blue-600 hover:underline" onClick={() => setLocation(`/cir-customers/${c.id}`)} data-testid={`link-cir-contact-${c.id}`}>{c.contactPerson || "—"}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{c.phone || c.mobileNo2 || "—"}</TableCell>
                        <TableCell className="text-xs max-w-[140px] truncate">{c.email || "—"}</TableCell>
                        <TableCell><code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded whitespace-nowrap">{c.staticIp || "—"}</code></TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{c.branch || "—"}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{vendor?.name || "—"}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{c.linkType || c.serviceType || "CIR"}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Wifi className="h-3 w-3 text-teal-600 shrink-0" />
                            <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">{c.committedBandwidth || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold whitespace-nowrap">Rs. {parseFloat(c.monthlyCharges || "0").toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[c.status] || ""}`}>{c.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`no-default-active-elevate text-[10px] whitespace-nowrap ${contractColor}`}>{contractStatus}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-cir-actions-${c.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => setLocation(`/cir-customers/${c.id}`)} data-testid={`button-cir-details-${c.id}`}><Eye className="h-4 w-4 mr-2 text-blue-600" />View Profile</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(c)}><Edit className="h-4 w-4 mr-2 text-amber-600" />Edit Profile</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openSmsDialog(c)}><MessageSquare className="h-4 w-4 mr-2 text-green-600" />Send SMS</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setLocation(`/cir-customers/${c.id}`)}><CalendarClock className="h-4 w-4 mr-2 text-purple-600" />Service Scheduler</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openStatusDialog(c)}>
                                {c.status === "active" ? <PowerOff className="h-4 w-4 mr-2" /> : <Power className="h-4 w-4 mr-2" />}
                                {c.status === "active" ? "Close / Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit CIR Customer" : "Add CIR Customer"}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-1 flex-wrap mb-4">
            {sections.map((s, i) => (
              <Button key={s} variant={formSection === i ? "default" : "outline"} size="sm" onClick={() => setFormSection(i)}
                className={formSection === i ? "bg-gradient-to-r from-[#002B5B] to-[#005EFF] text-white text-xs" : "text-xs"} data-testid={`btn-section-${i}`}>
                {s}
              </Button>
            ))}
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {formSection === 0 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Section A — Company Information</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name</FormLabel><FormControl><Input data-testid="input-cir-company" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input data-testid="input-cir-contact" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="cnic" render={({ field }) => (<FormItem><FormLabel>CNIC</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="ntn" render={({ field }) => (<FormItem><FormLabel>NTN</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="branch" render={({ field }) => (<FormItem><FormLabel>Branch</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                </div>
              )}
              {formSection === 1 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Section B — Bandwidth Configuration</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="vendorId" render={({ field }) => (
                      <FormItem><FormLabel>Vendor</FormLabel><Select onValueChange={v => field.onChange(v ? parseInt(v) : null)} value={field.value?.toString() || ""}><FormControl><SelectTrigger data-testid="select-cir-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger></FormControl><SelectContent>{(vendors || []).map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="vendorPort" render={({ field }) => (<FormItem><FormLabel>Vendor Port</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="committedBandwidth" render={({ field }) => (<FormItem><FormLabel>Committed Bandwidth</FormLabel><FormControl><Input placeholder="e.g., 20 Mbps" data-testid="input-cir-bandwidth" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="burstBandwidth" render={({ field }) => (<FormItem><FormLabel>Burst Bandwidth</FormLabel><FormControl><Input placeholder="e.g., 50 Mbps" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="uploadSpeed" render={({ field }) => (<FormItem><FormLabel>Upload Speed</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="downloadSpeed" render={({ field }) => (<FormItem><FormLabel>Download Speed</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="contentionRatio" render={({ field }) => (<FormItem><FormLabel>Contention Ratio</FormLabel><FormControl><Input placeholder="1:1" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="vlanId" render={({ field }) => (<FormItem><FormLabel>VLAN ID</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="onuDevice" render={({ field }) => (<FormItem><FormLabel>ONU / Device</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                </div>
              )}
              {formSection === 2 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Section C — IP Configuration</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="staticIp" render={({ field }) => (<FormItem><FormLabel>Static IP</FormLabel><FormControl><Input placeholder="e.g., 203.0.113.10" data-testid="input-cir-ip" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="subnetMask" render={({ field }) => (<FormItem><FormLabel>Subnet Mask</FormLabel><FormControl><Input placeholder="255.255.255.0" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="gateway" render={({ field }) => (<FormItem><FormLabel>Gateway</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="dns" render={({ field }) => (<FormItem><FormLabel>DNS</FormLabel><FormControl><Input placeholder="8.8.8.8, 8.8.4.4" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="publicIpBlock" render={({ field }) => (<FormItem><FormLabel>Public IP Block</FormLabel><FormControl><Input placeholder="e.g., /29 block" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              )}
              {formSection === 3 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Section D — Contract & SLA</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="contractStartDate" render={({ field }) => (<FormItem><FormLabel>Contract Start</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="contractEndDate" render={({ field }) => (<FormItem><FormLabel>Contract End</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="slaLevel" render={({ field }) => (<FormItem><FormLabel>SLA Level (% Uptime)</FormLabel><FormControl><Input placeholder="99.5" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="autoRenewal" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-6"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Auto Renewal</FormLabel></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="slaPenaltyClause" render={({ field }) => (<FormItem><FormLabel>SLA Penalty Clause</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              )}
              {formSection === 4 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Section E — Billing Configuration</p>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="monthlyCharges" render={({ field }) => (<FormItem><FormLabel>Monthly Charges</FormLabel><FormControl><Input type="number" data-testid="input-cir-monthly" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="installationCharges" render={({ field }) => (<FormItem><FormLabel>Installation</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="securityDeposit" render={({ field }) => (<FormItem><FormLabel>Security Deposit</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="billingCycle" render={({ field }) => (
                      <FormItem><FormLabel>Billing Cycle</FormLabel><Select onValueChange={field.onChange} value={field.value || "monthly"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="invoiceType" render={({ field }) => (
                      <FormItem><FormLabel>Invoice Type</FormLabel><Select onValueChange={field.onChange} value={field.value || "tax"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="tax">Tax Invoice</SelectItem><SelectItem value="non_tax">Non-Tax</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="lateFeePolicy" render={({ field }) => (<FormItem><FormLabel>Late Fee Policy</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value || "active"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="expired">Expired</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </div>
              )}
              {formSection === 5 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Section F — Monitoring & Radius</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="radiusProfile" render={({ field }) => (<FormItem><FormLabel>Radius Profile</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="bandwidthProfileName" render={({ field }) => (<FormItem><FormLabel>Bandwidth Profile</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="monitoringEnabled" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Monitoring</FormLabel></FormItem>)} />
                    <FormField control={form.control} name="snmpMonitoring" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">SNMP</FormLabel></FormItem>)} />
                    <FormField control={form.control} name="trafficAlerts" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Traffic Alerts</FormLabel></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex gap-2">
                    {formSection > 0 && <Button type="button" variant="outline" size="sm" onClick={() => setFormSection(s => s - 1)}>Previous</Button>}
                    {formSection < 5 && <Button type="button" variant="outline" size="sm" onClick={() => setFormSection(s => s + 1)}>Next</Button>}
                    <span className="text-xs text-muted-foreground self-center">Step {formSection + 1} of 6</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    {!editing && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={createMutation.isPending}
                          data-testid="button-cir-save-add-another"
                          onClick={() => form.handleSubmit(data => onSubmit(data, { addAnother: true }))()}
                        >
                          Save & Add Another
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={createMutation.isPending}
                          data-testid="button-cir-save-activate"
                          className="border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20"
                          onClick={() => form.handleSubmit(data => onSubmit(data, { activate: true }))()}
                        >
                          <Zap className="h-3.5 w-3.5 mr-1.5" />Save & Activate
                        </Button>
                      </>
                    )}
                    <Button
                      type="submit"
                      size="sm"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-cir-submit"
                      className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] text-white"
                    >
                      {(createMutation.isPending || updateMutation.isPending) ? (
                        <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</>
                      ) : editing ? (
                        "Update"
                      ) : (
                        <><Check className="h-3.5 w-3.5 mr-1.5" />Save CIR Customer</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Automation Progress Modal */}
      <Dialog open={autoModalOpen} onOpenChange={(open) => { if (!open && autoComplete) { setAutoModalOpen(false); if (addAnotherPending) { setAddAnotherPending(false); openCreate(); } } }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden" data-testid="modal-cir-automation">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Smart Automation Running</h2>
                <p className="text-sm text-blue-100">Setting up {autoCustomerName || "new CIR client"}…</p>
              </div>
              {autoComplete && <div className="ml-auto"><CheckCircle2 className="h-8 w-8 text-green-300" /></div>}
            </div>
          </div>
          <div className="px-6 py-5 space-y-3">
            {CIR_AUTO_STEPS.map((stepDef) => {
              const step = autoSteps.find(s => s.step === stepDef.key);
              const status = step?.status ?? "pending";
              const Icon = stepDef.icon;
              return (
                <div key={stepDef.key} className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 ${
                  status === "success" ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" :
                  status === "error"   ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" :
                  status === "skipped" ? "bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700" :
                  status === "running" ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" :
                  "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 opacity-50"
                }`}>
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    status === "success" ? "bg-green-100 dark:bg-green-900" :
                    status === "error"   ? "bg-red-100 dark:bg-red-900" :
                    status === "skipped" ? "bg-gray-100 dark:bg-gray-800" :
                    status === "running" ? "bg-blue-100 dark:bg-blue-900 animate-pulse" :
                    "bg-gray-100 dark:bg-gray-800"
                  }`}>
                    {status === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {status === "error"   && <XCircle className="h-4 w-4 text-red-600" />}
                    {status === "skipped" && <SkipForward className="h-4 w-4 text-gray-400" />}
                    {status === "running" && <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />}
                    {status === "pending" && <Icon className="h-4 w-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${
                        status === "success" ? "text-green-700 dark:text-green-300" :
                        status === "error"   ? "text-red-700 dark:text-red-300" :
                        status === "skipped" ? "text-gray-500 dark:text-gray-400" :
                        status === "running" ? "text-blue-700 dark:text-blue-300" :
                        "text-gray-500 dark:text-gray-400"
                      }`}>{stepDef.label}</span>
                      {status === "success" && <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0">Done</Badge>}
                      {status === "error"   && <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-0">Failed</Badge>}
                      {status === "skipped" && <Badge className="text-[10px] bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-0">Skipped</Badge>}
                      {status === "running" && <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-0 animate-pulse">Running…</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step?.message || stepDef.description}</p>
                    {step?.data && status === "success" && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {step.data.invoiceNumber && <span className="text-[10px] bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded px-2 py-0.5 text-green-700 dark:text-green-300 font-mono">{step.data.invoiceNumber}</span>}
                        {step.data.taskCode      && <span className="text-[10px] bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded px-2 py-0.5 text-blue-700 dark:text-blue-300 font-mono">{step.data.taskCode}</span>}
                        {step.data.ip            && <span className="text-[10px] bg-white dark:bg-gray-800 border border-cyan-200 dark:border-cyan-700 rounded px-2 py-0.5 text-cyan-700 dark:text-cyan-300 font-mono">{step.data.ip}</span>}
                        {step.data.vlan          && <span className="text-[10px] bg-white dark:bg-gray-800 border border-teal-200 dark:border-teal-700 rounded px-2 py-0.5 text-teal-700 dark:text-teal-300 font-mono">VLAN: {step.data.vlan}</span>}
                        {step.data.assignedTo    && <span className="text-[10px] bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded px-2 py-0.5 text-purple-700 dark:text-purple-300">{step.data.assignedTo}</span>}
                        {step.data.channel       && <span className="text-[10px] bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded px-2 py-0.5 text-orange-700 dark:text-orange-300">{step.data.channel}</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {autoComplete && (
            <div className="px-6 pb-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-4 border border-green-200 dark:border-green-800 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-bold text-green-700 dark:text-green-300">Setup Complete!</span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {autoSteps.filter(s => s.status === "success").length} of {CIR_AUTO_STEPS.length} workflows executed successfully.
                  {autoSteps.filter(s => s.status === "skipped").length > 0 && ` ${autoSteps.filter(s => s.status === "skipped").length} skipped.`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setAutoModalOpen(false); if (addAnotherPending) { setAddAnotherPending(false); openCreate(); } }} data-testid="button-cir-auto-add-another">
                  {addAnotherPending ? "Add Another" : "Close"}
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-1.5" onClick={() => setAutoModalOpen(false)} data-testid="button-cir-auto-done">
                  <ArrowRight className="h-4 w-4" />Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CIR Customer Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="modal-cir-details">
          {viewingDetails && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0">
                    <Wifi className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{viewingDetails.companyName}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">CIR Customer — {viewingDetails.city || "—"}</p>
                  </div>
                  <div className="ml-auto">
                    <Badge variant="secondary" className={`capitalize text-xs ${statusColors[viewingDetails.status] || ""}`}>{viewingDetails.status}</Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {/* Company Info */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2"><Building2 className="h-3.5 w-3.5" />Company Information</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Contact Person</p><p className="text-sm font-medium">{viewingDetails.contactPerson || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">CNIC</p><p className="text-sm font-medium font-mono">{viewingDetails.cnic || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">NTN</p><p className="text-sm font-medium font-mono">{viewingDetails.ntn || "—"}</p></div>
                    <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Email</p><p className="text-sm font-medium">{viewingDetails.email || "—"}</p></div></div>
                    <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Phone</p><p className="text-sm font-medium">{viewingDetails.phone || "—"}</p></div></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Branch</p><p className="text-sm font-medium">{viewingDetails.branch || "—"}</p></div>
                    <div className="col-span-2 flex items-start gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" /><div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Address</p><p className="text-sm font-medium">{viewingDetails.address ? `${viewingDetails.address}${viewingDetails.city ? ", " + viewingDetails.city : ""}` : "—"}</p></div></div>
                  </div>
                </div>

                {/* Bandwidth */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-3 flex items-center gap-2"><Wifi className="h-3.5 w-3.5" />Bandwidth Configuration</p>
                  <div className="grid grid-cols-3 gap-x-6 gap-y-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Committed BW</p><p className="text-sm font-bold text-teal-700 dark:text-teal-400">{viewingDetails.committedBandwidth || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Burst BW</p><p className="text-sm font-medium">{viewingDetails.burstBandwidth || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Contention Ratio</p><p className="text-sm font-medium">{viewingDetails.contentionRatio || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Upload Speed</p><p className="text-sm font-medium">{viewingDetails.uploadSpeed || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Download Speed</p><p className="text-sm font-medium">{viewingDetails.downloadSpeed || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">VLAN ID</p><p className="text-sm font-medium font-mono">{viewingDetails.vlanId || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Vendor Port</p><p className="text-sm font-medium">{viewingDetails.vendorPort || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">ONU / Device</p><p className="text-sm font-medium">{viewingDetails.onuDevice || "—"}</p></div>
                  </div>
                </div>

                {/* IP Config */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-3 flex items-center gap-2"><Network className="h-3.5 w-3.5" />IP Configuration</p>
                  <div className="grid grid-cols-3 gap-x-6 gap-y-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Static IP</p><p className="text-sm font-medium font-mono">{viewingDetails.staticIp || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Subnet Mask</p><p className="text-sm font-medium font-mono">{viewingDetails.subnetMask || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Gateway</p><p className="text-sm font-medium font-mono">{viewingDetails.gateway || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">DNS</p><p className="text-sm font-medium font-mono">{viewingDetails.dns || "—"}</p></div>
                    <div className="col-span-2"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Public IP Block</p><p className="text-sm font-medium font-mono">{viewingDetails.publicIpBlock || "—"}</p></div>
                  </div>
                </div>

                {/* Contract & SLA */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />Contract & SLA</p>
                  <div className="grid grid-cols-3 gap-x-6 gap-y-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Start Date</p><p className="text-sm font-medium">{viewingDetails.contractStartDate || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">End Date</p><p className="text-sm font-medium">{viewingDetails.contractEndDate || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">SLA Level</p><p className="text-sm font-bold text-orange-700 dark:text-orange-400">{viewingDetails.slaLevel ? `${viewingDetails.slaLevel}%` : "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Auto Renewal</p><p className="text-sm font-medium">{viewingDetails.autoRenewal ? "Yes" : "No"}</p></div>
                    {viewingDetails.slaPenaltyClause && <div className="col-span-2"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">SLA Penalty Clause</p><p className="text-sm">{viewingDetails.slaPenaltyClause}</p></div>}
                  </div>
                </div>

                {/* Billing */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400 mb-3 flex items-center gap-2"><DollarSign className="h-3.5 w-3.5" />Billing</p>
                  <div className="grid grid-cols-3 gap-x-6 gap-y-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Monthly Charges</p><p className="text-sm font-bold text-green-700 dark:text-green-400">Rs. {parseFloat(viewingDetails.monthlyCharges || "0").toLocaleString()}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Installation</p><p className="text-sm font-medium">Rs. {parseFloat(viewingDetails.installationCharges || "0").toLocaleString()}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Security Deposit</p><p className="text-sm font-medium">Rs. {parseFloat(viewingDetails.securityDeposit || "0").toLocaleString()}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Billing Cycle</p><p className="text-sm font-medium capitalize">{viewingDetails.billingCycle || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Invoice Type</p><p className="text-sm font-medium capitalize">{viewingDetails.invoiceType === "tax" ? "Tax Invoice" : viewingDetails.invoiceType === "non_tax" ? "Non-Tax" : "—"}</p></div>
                    {viewingDetails.lateFeePolicy && <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Late Fee Policy</p><p className="text-sm">{viewingDetails.lateFeePolicy}</p></div>}
                  </div>
                </div>

                {/* Monitoring */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-3 flex items-center gap-2"><Activity className="h-3.5 w-3.5" />Monitoring & Radius</p>
                  <div className="grid grid-cols-3 gap-x-6 gap-y-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Radius Profile</p><p className="text-sm font-medium font-mono">{viewingDetails.radiusProfile || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">BW Profile</p><p className="text-sm font-medium font-mono">{viewingDetails.bandwidthProfileName || "—"}</p></div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Features</p>
                      <div className="flex flex-wrap gap-1">
                        {viewingDetails.monitoringEnabled && <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Monitoring</Badge>}
                        {viewingDetails.snmpMonitoring && <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">SNMP</Badge>}
                        {viewingDetails.trafficAlerts && <Badge variant="secondary" className="text-[10px] bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">Traffic Alerts</Badge>}
                        {!viewingDetails.monitoringEnabled && !viewingDetails.snmpMonitoring && !viewingDetails.trafficAlerts && <span className="text-sm text-muted-foreground">None enabled</span>}
                      </div>
                    </div>
                    {viewingDetails.notes && <div className="col-span-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Notes</p><p className="text-sm">{viewingDetails.notes}</p></div>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <Button variant="outline" size="sm" onClick={() => setDetailsDialogOpen(false)}>Close</Button>
                <Button size="sm" onClick={() => { setDetailsDialogOpen(false); openEdit(viewingDetails); }} className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] text-white">
                  <Edit className="h-3.5 w-3.5 mr-1.5" />Edit Customer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={referralsDialogOpen} onOpenChange={setReferralsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Referrals — {viewingReferralsCir?.companyName}
            </DialogTitle>
          </DialogHeader>
          {viewingReferralsCir && (() => {
            const refs = cirReferrals(viewingReferralsCir.id);
            return refs.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">No referred client requests found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800">
                    <TableHead className="text-white text-xs">Request ID</TableHead>
                    <TableHead className="text-white text-xs">Name</TableHead>
                    <TableHead className="text-white text-xs">Phone</TableHead>
                    <TableHead className="text-white text-xs">Area</TableHead>
                    <TableHead className="text-white text-xs">Service Type</TableHead>
                    <TableHead className="text-white text-xs">Status</TableHead>
                    <TableHead className="text-white text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refs.map((r: any, idx: number) => (
                    <TableRow key={r.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <TableCell className="text-xs font-mono">
                        <a href={`/client-requests/${r.id}`} className="text-blue-600 hover:underline">{r.queryId || `#${r.id}`}</a>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{r.name}</TableCell>
                      <TableCell className="text-xs">{r.phone || "—"}</TableCell>
                      <TableCell className="text-xs">{r.area || "—"}</TableCell>
                      <TableCell className="text-xs capitalize">{r.serviceType || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] capitalize ${
                          r.status === "approved" ? "text-blue-700 bg-blue-50" :
                          r.status === "completed" ? "text-green-700 bg-green-50" :
                          r.status === "converted" ? "text-purple-700 bg-purple-50" :
                          r.status === "rejected" ? "text-red-600 bg-red-50" :
                          "text-amber-600 bg-amber-50"
                        }`}>{r.status || "pending"}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{r.requestDate || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="dialog-cir-send-notification">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-[#0057FF]" /> Send Notification
            </DialogTitle>
          </DialogHeader>
          {smsCustomer && (
            <div className="space-y-5">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0057FF] flex items-center justify-center text-white font-bold text-sm">
                    {smsCustomer.companyName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{smsCustomer.companyName}</p>
                    <p className="text-xs text-muted-foreground">CIR-{smsCustomer.id} • {smsCustomer.phone || "No phone"} • {smsCustomer.email || "No email"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Notification Type</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: "in_app", label: "In-App", icon: Bell, color: "text-purple-600 bg-purple-50 border-purple-200" },
                    { value: "sms", label: "SMS", icon: Smartphone, color: "text-green-600 bg-green-50 border-green-200" },
                    { value: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                    { value: "email", label: "Email", icon: Mail, color: "text-blue-600 bg-blue-50 border-blue-200" },
                  ].map(ch => (
                    <button key={ch.value} type="button" onClick={() => setSmsChannel(ch.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${smsChannel === ch.value ? `${ch.color} ring-2 ring-offset-1 ring-current font-semibold` : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                      data-testid={`btn-cir-channel-${ch.value}`}>
                      <ch.icon className="h-5 w-5" /><span className="text-xs">{ch.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Message Category</span>
                <Select value={smsCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger data-testid="select-cir-sms-category"><SelectValue /></SelectTrigger>
                  <SelectContent>{smsCategories.map(cat => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>

              {(smsChannel === "email" || smsChannel === "in_app") && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Subject</span>
                  <Input value={smsSubject} onChange={e => setSmsSubject(e.target.value)} placeholder="Enter subject..." data-testid="input-cir-sms-subject" />
                </div>
              )}

              <div className="space-y-2">
                <span className="text-sm font-medium">Message</span>
                <Textarea value={smsMessage} onChange={e => setSmsMessage(e.target.value)} placeholder="Type your message..." className="min-h-[120px]" data-testid="textarea-cir-sms-message" />
              </div>

              {smsChannel === "sms" && !smsCustomer.phone && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs"><AlertTriangle className="h-4 w-4 shrink-0" /> Customer has no phone number</div>
              )}
              {smsChannel === "email" && !smsCustomer.email && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs"><AlertTriangle className="h-4 w-4 shrink-0" /> Customer has no email address</div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSmsDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => smsCustomer && sendNotificationMutation.mutate({ channel: smsChannel, customer: smsCustomer, subject: smsSubject, message: smsMessage, category: smsCategory })}
              disabled={sendNotificationMutation.isPending || !smsMessage.trim() || (smsChannel === "email" && (!smsSubject.trim() || !smsCustomer?.email)) || (smsChannel === "sms" && !smsCustomer?.phone) || (smsChannel === "in_app" && !smsSubject.trim())}
              className="bg-[#0057FF]" data-testid="button-cir-send-notification">
              {sendNotificationMutation.isPending ? "Sending..." : (<><Send className="h-4 w-4 mr-1.5" />{smsChannel === "email" ? "Send Email" : smsChannel === "sms" ? "Send SMS" : smsChannel === "whatsapp" ? "Send WhatsApp" : "Send Notification"}</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-[500px]" data-testid="dialog-cir-status-toggle">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {statusAction === "active" ? <Power className="h-5 w-5 text-green-600" /> : <PowerOff className="h-5 w-5 text-red-600" />}
              {statusAction === "active" ? "Activate CIR Customer" : "Close / Deactivate CIR Customer"}
            </DialogTitle>
          </DialogHeader>
          {statusCustomer && (
            <div className="space-y-5">
              <div className="bg-muted/50 rounded-lg p-3 border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0057FF] flex items-center justify-center text-white font-bold text-sm">{statusCustomer.companyName.charAt(0)}</div>
                  <div>
                    <p className="font-semibold text-sm">{statusCustomer.companyName}</p>
                    <p className="text-xs text-muted-foreground">CIR-{statusCustomer.id}</p>
                  </div>
                  <Badge className={`ml-auto text-[10px] capitalize ${statusCustomer.status === "active" ? "bg-green-600 text-white" : "bg-gray-400 text-white"}`}>{statusCustomer.status}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Change Status To</span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "active", label: "Active", desc: "Enable services", icon: Power, color: "text-green-600 bg-green-50 border-green-300" },
                    { value: "closed", label: "Closed", desc: "Disable services", icon: PowerOff, color: "text-red-600 bg-red-50 border-red-300" },
                    { value: "suspended", label: "Suspended", desc: "Temporarily suspend", icon: AlertTriangle, color: "text-amber-600 bg-amber-50 border-amber-300" },
                    { value: "expired", label: "Expired", desc: "Mark as expired", icon: Clock, color: "text-gray-600 bg-gray-50 border-gray-300" },
                  ].map(s => (
                    <button key={s.value} type="button" onClick={() => { setStatusAction(s.value); setStatusReasonSelect(""); }}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all ${statusAction === s.value ? `${s.color} ring-2 ring-offset-1 ring-current font-semibold` : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                      data-testid={`btn-cir-status-${s.value}`}>
                      <s.icon className="h-5 w-5 shrink-0" />
                      <div><p className="text-sm font-medium">{s.label}</p><p className="text-[10px] text-muted-foreground">{s.desc}</p></div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Reason</span>
                <Select value={statusReasonSelect} onValueChange={setStatusReasonSelect}>
                  <SelectTrigger data-testid="select-cir-status-reason"><SelectValue placeholder="Select reason..." /></SelectTrigger>
                  <SelectContent>{(statusReasonOptions[statusAction] || []).map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Additional Notes</span>
                <Textarea value={statusReason} onChange={e => setStatusReason(e.target.value)} placeholder="Add any additional notes..." className="min-h-[80px]" data-testid="textarea-cir-status-notes" />
              </div>

              {statusAction === statusCustomer.status && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs"><AlertTriangle className="h-4 w-4 shrink-0" /> Customer is already {statusCustomer.status}</div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!statusCustomer) return;
                const reasonLabel = (statusReasonOptions[statusAction] || []).find(o => o.value === statusReasonSelect)?.label || statusReasonSelect;
                const fullReason = statusReason.trim() ? `${reasonLabel} - ${statusReason.trim()}` : reasonLabel;
                statusToggleMutation.mutate({ customer: statusCustomer, newStatus: statusAction, reason: fullReason });
              }}
              disabled={statusToggleMutation.isPending || statusAction === statusCustomer?.status || !statusReasonSelect}
              className={statusAction === "active" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              data-testid="button-cir-confirm-status">
              {statusToggleMutation.isPending ? "Updating..." : (statusAction === "active" ? "Activate" : statusAction === "suspended" ? "Suspend" : statusAction === "expired" ? "Set Expired" : "Close Account")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
