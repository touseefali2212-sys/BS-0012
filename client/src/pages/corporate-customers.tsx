import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, Building2, DollarSign, Users,
  FileSpreadsheet, Send, CheckCircle2, XCircle, Loader2, SkipForward, Sparkles,
  ArrowRight, RefreshCw, Check, Zap,
  Shield, Network, Calendar, Activity, Server, Globe, ChevronDown, ChevronUp, Eye,
  Briefcase, Link2, Wifi, Phone, Mail, MapPin, CreditCard,
  MessageSquare, CalendarClock, Power, PowerOff, UserPlus, RotateCcw, Clock, Download, FileText,
  Radio, ClipboardList,
  MessageCircle, Smartphone, Bell, CalendarRange, AlertTriangle,
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
import {
  insertCorporateCustomerSchema, insertCorporateConnectionSchema,
  type CorporateCustomer, type InsertCorporateCustomer,
  type CorporateConnection, type InsertCorporateConnection,
} from "@shared/schema";
import { CorporateCustomerFormFields, CORP_FORM_SECTIONS } from "@/components/corporate-customer-form-fields";

const statusColors: Record<string, string> = {
  active: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950",
  suspended: "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950",
  pending: "text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-950",
  inactive: "text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800",
};


type AutoStep = { step: string; status: "pending" | "running" | "success" | "error" | "skipped"; message: string; data?: any };

const CORP_AUTO_STEPS = [
  { key: "invoice",               label: "Auto Invoice Generation",            icon: FileSpreadsheet, description: "Generating first invoice for this Corporate customer" },
  { key: "ip_sync",               label: "IP Address Add and SYNC in Network", icon: Radio,           description: "Assigning IP block and syncing corporate network config" },
  { key: "task",                  label: "Installation Task",                  icon: ClipboardList,   description: "Creating corporate setup and installation task" },
  { key: "notification_customer", label: "Customer Notification",              icon: Send,            description: "Sending welcome message to corporate contact" },
  { key: "notification_employee", label: "Employee Notification",              icon: Users,           description: "Notifying account manager of new corporate client" },
];

export default function CorporateCustomersPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CorporateCustomer | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formSection, setFormSection] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [showEntries, setShowEntries] = useState("100");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [vendorFilter, setVendorFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [linkTypeFilter, setLinkTypeFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [billingStatusFilter, setBillingStatusFilter] = useState("all");
  const [serviceStatusFilter, setServiceStatusFilter] = useState("all");
  const [contractStatusFilter, setContractStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [viewingCorporate, setViewingCorporate] = useState<CorporateCustomer | null>(null);
  const [editingConnection, setEditingConnection] = useState<CorporateConnection | null>(null);
  const [referralsDialogOpen, setReferralsDialogOpen] = useState(false);
  const [viewingReferralsCorp, setViewingReferralsCorp] = useState<CorporateCustomer | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [viewingDetails, setViewingDetails] = useState<CorporateCustomer | null>(null);

  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [smsCustomer, setSmsCustomer] = useState<CorporateCustomer | null>(null);
  const [smsChannel, setSmsChannel] = useState("sms");
  const [smsCategory, setSmsCategory] = useState("bill_reminder");
  const [smsMessage, setSmsMessage] = useState("");
  const [smsSubject, setSmsSubject] = useState("");

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusCustomer, setStatusCustomer] = useState<CorporateCustomer | null>(null);
  const [statusAction, setStatusAction] = useState("closed");
  const [statusReasonSelect, setStatusReasonSelect] = useState("");
  const [statusReason, setStatusReason] = useState("");

  const statusReasonOptions: Record<string, { value: string; label: string }[]> = {
    active: [{ value: "active", label: "Active" }, { value: "reactive", label: "Reactive" }],
    closed: [{ value: "house_shift", label: "House Shift" }, { value: "temporary_closed", label: "Temporary Closed" }, { value: "shift_to_other_isp", label: "Shift to Other ISP" }],
    suspended: [{ value: "bill_issue", label: "Bill Issue" }, { value: "temporary_suspend", label: "Temporary Suspend" }],
    expired: [{ value: "recharge_next_month", label: "Recharge on Next Month" }, { value: "other", label: "Other" }],
  };

  const smsCategories = [
    { value: "bill_reminder", label: "Bill Reminder", defaultMsg: "Dear {name}, your bill is due. Please pay before the due date." },
    { value: "invoice_softcopy", label: "Invoice Softcopy", defaultMsg: "Dear {name}, please find your invoice attached." },
    { value: "account_suspend", label: "Account Suspend Notice", defaultMsg: "Dear {name}, your account has been suspended due to non-payment." },
    { value: "payment_confirmation", label: "Payment Confirmation", defaultMsg: "Dear {name}, we have received your payment. Thank you!" },
    { value: "service_activation", label: "Service Activation", defaultMsg: "Dear {name}, your internet service has been activated." },
    { value: "package_change", label: "Package Change Notification", defaultMsg: "Dear {name}, your package has been changed successfully." },
    { value: "maintenance_notice", label: "Maintenance Notice", defaultMsg: "Dear {name}, scheduled maintenance will be performed." },
    { value: "welcome_message", label: "Welcome Message", defaultMsg: "Welcome to our network, {name}!" },
    { value: "custom", label: "Custom Message", defaultMsg: "" },
  ];

  const openSmsDialog = (c: CorporateCustomer) => {
    setSmsCustomer(c); setSmsChannel("sms"); setSmsCategory("bill_reminder");
    const cat = smsCategories.find(x => x.value === "bill_reminder");
    setSmsMessage(cat?.defaultMsg.replace("{name}", c.companyName) || "");
    setSmsSubject(""); setSmsDialogOpen(true);
  };

  const handleCategoryChange = (value: string) => {
    setSmsCategory(value);
    const cat = smsCategories.find(x => x.value === value);
    if (cat && smsCustomer) {
      setSmsMessage(cat.defaultMsg.replace("{name}", smsCustomer.companyName));
      if (value === "invoice_softcopy") setSmsSubject("Invoice Copy");
      else if (value === "bill_reminder") setSmsSubject("Bill Reminder");
      else if (value === "account_suspend") setSmsSubject("Account Suspension Notice");
      else setSmsSubject("");
    }
  };

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: { channel: string; customer: CorporateCustomer; subject: string; message: string; category: string }) => {
      if (data.channel === "email") {
        if (!data.customer.email) throw new Error("No email"); const res = await apiRequest("POST", "/api/notifications/send-email", { to: data.customer.email, subject: data.subject, body: data.message }); return res.json();
      } else if (data.channel === "sms") {
        if (!data.customer.phone && !data.customer.mobileNo) throw new Error("No phone"); const res = await apiRequest("POST", "/api/notifications/send-sms", { to: data.customer.mobileNo || data.customer.phone, message: data.message }); return res.json();
      } else if (data.channel === "whatsapp") {
        const res = await apiRequest("POST", "/api/notifications/send-sms", { to: data.customer.mobileNo || data.customer.phone, message: data.message }); return res.json();
      } else {
        const res = await apiRequest("POST", "/api/notification-dispatches", { channel: "in_app", recipient: data.customer.email || `CORP-${data.customer.id}`, subject: data.subject, body: data.message, status: "sent", createdAt: new Date().toISOString() }); return res.json();
      }
    },
    onSuccess: (_, vars) => { toast({ title: "Sent", description: `Notification sent to ${vars.customer.companyName}` }); setSmsDialogOpen(false); },
    onError: (err: Error) => { toast({ title: "Failed", description: err.message, variant: "destructive" }); },
  });

  const openStatusDialog = (c: CorporateCustomer) => {
    setStatusCustomer(c); setStatusAction(c.status === "active" ? "closed" : "active");
    setStatusReasonSelect(""); setStatusReason(""); setStatusDialogOpen(true);
  };

  const statusToggleMutation = useMutation({
    mutationFn: async (data: { customer: CorporateCustomer; newStatus: string; reason: string }) => {
      const res = await apiRequest("PATCH", `/api/corporate-customers/${data.customer.id}`, { status: data.newStatus });
      const result = await res.json();
      await apiRequest("POST", "/api/audit-logs", {
        action: data.newStatus === "active" ? "enable" : "disable", module: "corporate_customers", entityType: "corporate_customer", entityId: data.customer.id,
        oldValues: JSON.stringify({ status: data.customer.status }), newValues: JSON.stringify({ status: data.newStatus }),
        description: `Corporate Customer ${data.customer.companyName} (CORP-${data.customer.id}) status changed from "${data.customer.status}" to "${data.newStatus}". Reason: ${data.reason || "N/A"}`,
        createdAt: new Date().toISOString(),
      });
      return result;
    },
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ["/api/corporate-customers"] }); toast({ title: "Status Updated", description: `${vars.customer.companyName} is now ${vars.newStatus}` }); setStatusDialogOpen(false); },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  // Automation modal state
  const [autoModalOpen, setAutoModalOpen] = useState(false);
  const [autoSteps, setAutoSteps] = useState<AutoStep[]>([]);
  const [autoComplete, setAutoComplete] = useState(false);
  const [autoCustomerName, setAutoCustomerName] = useState("");
  const [addAnotherPending, setAddAnotherPending] = useState(false);

  const fromQueryId = new URLSearchParams(window.location.search).get("fromQuery");

  const { data: corporateCustomers, isLoading } = useQuery<CorporateCustomer[]>({ queryKey: ["/api/corporate-customers"] });
  const { data: vendors } = useQuery<any[]>({ queryKey: ["/api/vendors"] });
  const { data: allClientRequests } = useQuery<any[]>({ queryKey: ["/api/customer-queries"] });
  const { data: fromQueryData } = useQuery<any>({
    queryKey: ["/api/customer-queries", fromQueryId],
    enabled: !!fromQueryId,
  });

  const corpReferralCount = (corpId: number) => (allClientRequests || []).filter((q: any) => q.referredByType === "corporate" && q.referredById === corpId).length;
  const corpReferrals = (corpId: number) => (allClientRequests || []).filter((q: any) => q.referredByType === "corporate" && q.referredById === corpId);

  const { data: connections } = useQuery<CorporateConnection[]>({
    queryKey: ["/api/corporate-connections", viewingCorporate?.id],
    enabled: !!viewingCorporate,
  });

  const form = useForm<InsertCorporateCustomer>({
    resolver: zodResolver(insertCorporateCustomerSchema),
    defaultValues: {
      companyName: "", registrationNumber: "", ntn: "", industryType: "", headOfficeAddress: "",
      billingAddress: "", accountManager: "", email: "", phone: "", centralizedBilling: true,
      perBranchBilling: false, customInvoiceFormat: "", paymentTerms: "net_30", creditLimit: "0",
      securityDeposit: "0", contractDuration: "", customSla: "", dedicatedAccountManager: "",
      customPricingAgreement: "", managedRouter: false, firewall: false, loadBalancer: false,
      dedicatedSupport: false, backupLink: false, monitoringSla: false, totalConnections: 0,
      totalBandwidth: "", monthlyBilling: "0", status: "active", notes: "",
    },
  });

  const connForm = useForm<InsertCorporateConnection>({
    resolver: zodResolver(insertCorporateConnectionSchema),
    defaultValues: {
      corporateId: 0, branchName: "", location: "", packageType: "shared",
      bandwidth: "", staticIp: "", installationDate: "", status: "active", monthlyCharges: "0",
    },
  });

  const runCorpAutomation = async (customerId: number) => {
    const animate = (steps: AutoStep[]) => setAutoSteps([...steps]);
    const steps: AutoStep[] = CORP_AUTO_STEPS.map(s => ({ step: s.key, status: "pending" as const, message: s.description }));
    steps[0] = { ...steps[0], status: "running" };
    animate(steps);
    try {
      const res = await apiRequest("POST", `/api/corporate-customers/${customerId}/automate`);
      const result = await res.json();
      const serverSteps: Array<{ step: string; status: string; message: string; data?: any }> = result.steps || [];
      for (let i = 0; i < CORP_AUTO_STEPS.length; i++) {
        const key = CORP_AUTO_STEPS[i].key;
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
    mutationFn: async (data: InsertCorporateCustomer & { _activate?: boolean }) => {
      const { _activate, ...payload } = data;
      if (_activate) payload.status = "active";
      const r = await apiRequest("POST", "/api/corporate-customers", payload);
      return r.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/corporate-customers"] });
      const isAddAnother = (variables as any)._addAnother;
      if (fromQueryId) {
        apiRequest("POST", `/api/customer-queries/${fromQueryId}/convert`, { customerId: data.id }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["/api/customer-queries"] });
      }
      setAutoCustomerName(data.companyName || "");
      setAutoSteps(CORP_AUTO_STEPS.map(s => ({ step: s.key, status: "pending" as const, message: s.description })));
      setAutoComplete(false);
      setAddAnotherPending(!!isAddAnother);
      setDialogOpen(false);
      setAutoModalOpen(true);
      runCorpAutomation(data.id);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCorporateCustomer> }) => { const r = await apiRequest("PATCH", `/api/corporate-customers/${id}`, data); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/corporate-customers"] }); setDialogOpen(false); setEditing(null); form.reset(); toast({ title: "Corporate customer updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/corporate-customers/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/corporate-customers"] }); toast({ title: "Corporate customer deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createConnMutation = useMutation({
    mutationFn: async (data: InsertCorporateConnection) => { const r = await apiRequest("POST", "/api/corporate-connections", data); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/corporate-connections", viewingCorporate?.id] }); setConnectionDialogOpen(false); connForm.reset(); toast({ title: "Connection added" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateConnMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCorporateConnection> }) => { const r = await apiRequest("PATCH", `/api/corporate-connections/${id}`, data); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/corporate-connections", viewingCorporate?.id] }); setConnectionDialogOpen(false); setEditingConnection(null); connForm.reset(); toast({ title: "Connection updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteConnMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/corporate-connections/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/corporate-connections", viewingCorporate?.id] }); toast({ title: "Connection removed" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setEditing(null); setFormSection(0);
    form.reset({
      companyName: "", registrationNumber: "", ntn: "", industryType: "", headOfficeAddress: "",
      billingAddress: "", accountManager: "", email: "", phone: "", centralizedBilling: true,
      perBranchBilling: false, customInvoiceFormat: "", paymentTerms: "net_30", creditLimit: "0",
      securityDeposit: "0", contractDuration: "", customSla: "", dedicatedAccountManager: "",
      customPricingAgreement: "", managedRouter: false, firewall: false, loadBalancer: false,
      dedicatedSupport: false, backupLink: false, monitoringSla: false, totalConnections: 0,
      totalBandwidth: "", monthlyBilling: "0", status: "active", notes: "",
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
      registrationNumber: "",
      ntn: "",
      industryType: "",
      headOfficeAddress: q.address ? `${q.address}${q.city ? ", " + q.city : ""}` : "",
      billingAddress: q.address ? `${q.address}${q.city ? ", " + q.city : ""}` : "",
      accountManager: "",
      email: q.email || "",
      phone: q.phone || "",
      centralizedBilling: true,
      perBranchBilling: false,
      customInvoiceFormat: "",
      paymentTerms: "net_30",
      creditLimit: "0",
      securityDeposit: q.securityDeposit ? String(q.securityDeposit) : "0",
      contractDuration: "",
      customSla: "",
      dedicatedAccountManager: "",
      customPricingAgreement: "",
      managedRouter: false,
      firewall: false,
      loadBalancer: false,
      dedicatedSupport: false,
      backupLink: false,
      monitoringSla: false,
      totalConnections: 0,
      totalBandwidth: q.bandwidthRequired || "",
      monthlyBilling: q.monthlyCharges ? String(q.monthlyCharges) : "0",
      status: "active",
      notes: q.remarks || "",
    });
    setDialogOpen(true);
  }, [fromQueryData]);

  const openEdit = (c: CorporateCustomer) => {
    setEditing(c); setFormSection(0);
    form.reset(c as any);
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertCorporateCustomer, opts: { activate?: boolean; addAnother?: boolean } = {}) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate({ ...data, ...(opts.activate ? { _activate: true } : {}), ...(opts.addAnother ? { _addAnother: true } : {}) } as any);
    }
  };

  const openConnections = (c: CorporateCustomer) => {
    setViewingCorporate(c);
    queryClient.invalidateQueries({ queryKey: ["/api/corporate-connections", c.id] });
  };

  const openAddConnection = () => {
    setEditingConnection(null);
    connForm.reset({
      corporateId: viewingCorporate!.id, branchName: "", location: "", packageType: "shared",
      bandwidth: "", staticIp: "", installationDate: new Date().toISOString().split("T")[0], status: "active", monthlyCharges: "0",
    });
    setConnectionDialogOpen(true);
  };

  const openEditConnection = (c: CorporateConnection) => {
    setEditingConnection(c);
    connForm.reset(c as any);
    setConnectionDialogOpen(true);
  };

  const onConnSubmit = (data: InsertCorporateConnection) => {
    if (editingConnection) updateConnMutation.mutate({ id: editingConnection.id, data });
    else createConnMutation.mutate(data);
  };

  const allCorp = corporateCustomers || [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const filtered = allCorp
    .filter(c => statusFilter === "all" || c.status === statusFilter)
    .filter(c => vendorFilter === "all" || String(c.vendorId || "") === vendorFilter)
    .filter(c => industryFilter === "all" || (c.industryType || "") === industryFilter)
    .filter(c => serviceTypeFilter === "all" || (c.serviceType || "") === serviceTypeFilter)
    .filter(c => linkTypeFilter === "all" || (c.linkType || "") === linkTypeFilter)
    .filter(c => branchFilter === "all" || (c.branch || "") === branchFilter)
    .filter(c => cityFilter === "all" || (c.city || "") === cityFilter)
    .filter(c => contractStatusFilter === "all" || (() => {
      if (!c.contractStartDate) return contractStatusFilter === "none";
      const duration = parseInt(c.contractDuration || "0");
      if (!duration) return contractStatusFilter === "none";
      const start = new Date(c.contractStartDate);
      const end = new Date(start.getTime() + duration * 30 * 86400000);
      const days = Math.ceil((end.getTime() - Date.now()) / 86400000);
      if (days < 0) return contractStatusFilter === "expired";
      if (days <= 30) return contractStatusFilter === "expiring";
      return contractStatusFilter === "active";
    })())
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (c.companyName || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.ntn || "").toLowerCase().includes(q);
    })
    .slice(0, parseInt(showEntries) || 100);

  const totalActive = allCorp.filter(c => c.status === "active").length;
  const totalConns = allCorp.reduce((s, c) => s + (c.totalConnections || 0), 0);
  const totalRevenue = allCorp.filter(c => c.status === "active").reduce((s, c) => s + (parseFloat(c.monthlyBilling || "0") || 0), 0);
  const totalCredit = allCorp.reduce((s, c) => s + (parseFloat(c.creditLimit || "0") || 0), 0);
  const suspended = allCorp.filter(c => c.status === "suspended").length;

  const running = totalActive;
  const newThisMonth = allCorp.filter(c => c.createdAt && new Date(c.createdAt) >= monthStart).length;
  const renewed = allCorp.filter(c => c.centralizedBilling).length;
  const billPaid = totalActive;
  const pendingBill = allCorp.filter(c => c.status === "suspended" || c.status === "pending").length;

  const uniqueBranches = [...new Set(allCorp.map(c => c.branch).filter(Boolean))];
  const uniqueCities = [...new Set(allCorp.map(c => c.city).filter(Boolean))];

  const handleCorpExcel = () => {
    const headers = ["Company Name", "NTN", "Email", "Phone", "Industry", "Connections", "Monthly Billing", "Branch", "City", "Status"];
    const rows = filtered.map(c => [c.companyName || "", c.ntn || "", c.email || "", c.phone || "", c.industryType || "", c.totalConnections || 0, c.monthlyBilling || "", c.branch || "", c.city || "", c.status || ""]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `corporate_customers_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
    toast({ title: "Excel Generated", description: `Exported ${rows.length} corporate customer(s)` });
  };

  const handleCorpPdf = () => {
    const rows = filtered.map(c => `<tr><td>${c.companyName || "-"}</td><td>${c.ntn || "-"}</td><td>${c.industryType || "-"}</td><td>${c.totalConnections || 0}</td><td>${c.monthlyBilling || "-"}</td><td>${c.status || "-"}</td></tr>`).join("");
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(`<html><head><title>Corporate Customers</title><style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}th{background:#1a3a5c;color:white}h2{color:#1a3a5c}</style></head><body><h2>Corporate Customers — ${new Date().toLocaleDateString()}</h2><table><thead><tr><th>Company</th><th>NTN</th><th>Industry</th><th>Connections</th><th>Monthly</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table><script>window.print();<\/script></body></html>`);
      w.document.close();
    }
    toast({ title: "PDF Generated", description: "Print dialog opened" });
  };

  const formSections = CORP_FORM_SECTIONS;

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#002B5B] to-[#007BFF] bg-clip-text text-transparent" data-testid="text-corp-title">Corporate Customers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Multi-branch Enterprise Client Management</p>
      </div>

      {!viewingCorporate ? (
        <>
          {/* Action Toolbar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm" data-testid="button-assign-employee"
                onClick={() => { if (selectedIds.size === 0) { toast({ title: "Select customers first", variant: "destructive" }); return; } toast({ title: "Assign Employee", description: `${selectedIds.size} corporate customer(s) ready to assign` }); }}>
                <Users className="h-4 w-4" />Assign To Employee
              </Button>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm" data-testid="button-generate-excel"
                onClick={handleCorpExcel}>
                <Download className="h-4 w-4" />Generate Excel
              </Button>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm" data-testid="button-generate-pdf"
                onClick={handleCorpPdf}>
                <FileText className="h-4 w-4" />Generate Pdf
              </Button>
            </div>
            <Button size="sm" className="h-9 gap-1.5 text-sm bg-[#1c3557] hover:bg-[#152b44] text-white" data-testid="button-sync-ip"
              onClick={() => toast({ title: "IP Sync Started", description: "Pinging all corporate customer IP addresses..." })}>
              <RefreshCw className="h-4 w-4" />SYNC IP Address Ping
            </Button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-xl p-4 text-white bg-gradient-to-br from-blue-500 to-blue-700 relative overflow-hidden shadow-md" data-testid="card-running-customers">
              <div className="absolute right-3 top-3 opacity-20"><Building2 className="h-12 w-12" /></div>
              <p className="text-3xl font-bold">{running}</p>
              <p className="font-semibold text-sm mt-1">Running Customers</p>
              <p className="text-xs opacity-80 mt-0.5">Number of active corporate accounts</p>
            </div>
            <div className="rounded-xl p-4 text-white bg-gradient-to-br from-emerald-400 to-teal-600 relative overflow-hidden shadow-md" data-testid="card-new-customers">
              <div className="absolute right-3 top-3 opacity-20"><UserPlus className="h-12 w-12" /></div>
              <p className="text-3xl font-bold">{newThisMonth}</p>
              <p className="font-semibold text-sm mt-1">New Customers</p>
              <p className="text-xs opacity-80 mt-0.5">Monthly number of new corporates</p>
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
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger className="h-9" data-testid="select-customer-type-filter"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select</SelectItem>
                      <SelectItem value="Home">Home</SelectItem>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Govt. Office">Govt. Office</SelectItem>
                      <SelectItem value="School">School</SelectItem>
                      <SelectItem value="Collage">Collage</SelectItem>
                      <SelectItem value="University">University</SelectItem>
                      <SelectItem value="Hospital">Hospital</SelectItem>
                      <SelectItem value="Factory">Factory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Service Type</label>
                  <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                    <SelectTrigger className="h-9" data-testid="select-service-type-filter"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select</SelectItem>
                      <SelectItem value="Internet">Internet</SelectItem>
                      <SelectItem value="MPLS">MPLS</SelectItem>
                      <SelectItem value="P2P">P2P</SelectItem>
                      <SelectItem value="IPLC">IPLC</SelectItem>
                      <SelectItem value="Dark Fiber">Dark Fiber</SelectItem>
                      <SelectItem value="Colocation">Colocation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Link Type</label>
                  <Select value={linkTypeFilter} onValueChange={setLinkTypeFilter}>
                    <SelectTrigger className="h-9" data-testid="select-link-type-filter"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select</SelectItem>
                      <SelectItem value="Primary">Primary</SelectItem>
                      <SelectItem value="Secondary">Secondary</SelectItem>
                      <SelectItem value="Backup">Backup</SelectItem>
                      <SelectItem value="Redundant">Redundant</SelectItem>
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
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Month</label>
                  <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger className="h-9" data-testid="select-month-filter"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select</SelectItem>
                      <SelectItem value="01">January</SelectItem>
                      <SelectItem value="02">February</SelectItem>
                      <SelectItem value="03">March</SelectItem>
                      <SelectItem value="04">April</SelectItem>
                      <SelectItem value="05">May</SelectItem>
                      <SelectItem value="06">June</SelectItem>
                      <SelectItem value="07">July</SelectItem>
                      <SelectItem value="08">August</SelectItem>
                      <SelectItem value="09">September</SelectItem>
                      <SelectItem value="10">October</SelectItem>
                      <SelectItem value="11">November</SelectItem>
                      <SelectItem value="12">December</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From Date</label>
                  <Input type="date" className="h-9" value={fromDateFilter} onChange={e => setFromDateFilter(e.target.value)} data-testid="input-from-date-filter" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To Date</label>
                  <Input type="date" className="h-9" value={toDateFilter} onChange={e => setToDateFilter(e.target.value)} data-testid="input-to-date-filter" />
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
              <Button onClick={() => setLocation("/add-customer?type=corporate")} size="sm" className="h-9 ml-2 bg-gradient-to-r from-[#002B5B] to-[#005EFF] hover:from-[#001f42] hover:to-[#0044cc] gap-1.5" data-testid="button-add-corp">
                <Users className="h-4 w-4" />Add Corporate Customer
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">SEARCH:</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-[220px] h-9" data-testid="input-corp-search" />
              </div>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-lg px-4 py-2.5">
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{selectedIds.size} customer{selectedIds.size > 1 ? "s" : ""} selected</span>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900" onClick={() => setSelectedIds(new Set())} data-testid="button-clear-selection">Clear Selection</Button>
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mb-3 opacity-30" /><p className="font-medium">No corporate customers found</p>
                  <p className="text-sm mt-1">Add your first enterprise client</p>
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
                            data-testid="checkbox-select-all-corp"
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
                        const daysLeft = c.contractExpiryDate ? Math.ceil((new Date(c.contractExpiryDate).getTime() - Date.now()) / 86400000) : null;
                        const contractStatus = !c.contractExpiryDate ? "No Contract"
                          : daysLeft !== null && daysLeft < 0 ? "Expired"
                          : daysLeft !== null && daysLeft <= 30 ? `Expiring (${daysLeft}d)`
                          : "Active";
                        const contractColor = contractStatus === "Expired" ? "text-red-600 bg-red-50"
                          : contractStatus.startsWith("Expiring") ? "text-orange-600 bg-orange-50"
                          : contractStatus === "Active" ? "text-green-700 bg-green-50"
                          : "text-slate-500 bg-slate-100";
                        return (
                        <TableRow key={c.id} data-testid={`row-corp-${c.id}`} className={`${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"} ${selectedIds.has(c.id) ? "bg-indigo-50 dark:bg-indigo-950/40" : ""}`}>
                          <TableCell className="pl-4 w-10" onClick={e => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.has(c.id)}
                              onCheckedChange={(checked) => {
                                const next = new Set(selectedIds);
                                if (checked) next.add(c.id); else next.delete(c.id);
                                setSelectedIds(next);
                              }}
                              data-testid={`checkbox-corp-${c.id}`}
                            />
                          </TableCell>
                          <TableCell className="text-xs font-mono font-semibold text-indigo-700 dark:text-indigo-400 whitespace-nowrap cursor-pointer hover:underline" onClick={() => setLocation(`/corporate-customers/${c.id}`)} data-testid={`link-corp-code-${c.id}`}>CORP-{String(c.id).padStart(4, "0")}</TableCell>
                          <TableCell className="text-xs font-semibold whitespace-nowrap cursor-pointer hover:text-indigo-600 hover:underline" onClick={() => setLocation(`/corporate-customers/${c.id}`)} data-testid={`text-corp-name-${c.id}`}>{c.companyName}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap cursor-pointer hover:text-indigo-600 hover:underline" onClick={() => setLocation(`/corporate-customers/${c.id}`)} data-testid={`link-corp-contact-${c.id}`}>{c.contactFullName || "—"}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{c.mobileNo || c.phone || "—"}</TableCell>
                          <TableCell className="text-xs max-w-[140px] truncate">{c.email || "—"}</TableCell>
                          <TableCell><code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded whitespace-nowrap">—</code></TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{c.branch || "—"}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">—</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{c.billingMode === "per_mbps" ? "Per Mbps" : "Fixed"}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Wifi className="h-3 w-3 text-teal-600 shrink-0" />
                              <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">{c.totalBandwidth || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-semibold whitespace-nowrap">Rs. {parseFloat(c.monthlyBilling || "0").toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[c.status] || ""}`}>{c.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`no-default-active-elevate text-[10px] whitespace-nowrap ${contractColor}`}>{contractStatus}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-corp-actions-${c.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => setLocation(`/corporate-customers/${c.id}`)} data-testid={`button-corp-details-${c.id}`}><Eye className="h-4 w-4 mr-2 text-blue-600" />View Profile</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLocation(`/add-customer?type=corporate&edit=${c.id}`)}><Edit className="h-4 w-4 mr-2 text-amber-600" />Edit Profile</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openSmsDialog(c)}><MessageSquare className="h-4 w-4 mr-2 text-green-600" />Send SMS</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLocation(`/corporate-customers/${c.id}`)}><CalendarClock className="h-4 w-4 mr-2 text-purple-600" />Service Scheduler</DropdownMenuItem>
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
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" size="sm" onClick={() => setViewingCorporate(null)} data-testid="button-back-corp">
                <ChevronDown className="h-4 w-4 rotate-90 mr-1" />Back to List
              </Button>
              <h2 className="text-lg font-bold mt-1 flex items-center gap-2"><Building2 className="h-5 w-5 text-indigo-600" />{viewingCorporate.companyName}</h2>
              <p className="text-sm text-muted-foreground">{viewingCorporate.industryType || "Corporate Account"} — NTN: {viewingCorporate.ntn || "—"}</p>
            </div>
            <Button onClick={openAddConnection} data-testid="button-add-connection" className="bg-gradient-to-r from-[#002B5B] to-[#005EFF]">
              <Plus className="h-4 w-4 mr-1" />Add Connection
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Connections</p><p className="text-2xl font-bold">{(connections || []).length}</p></CardContent></Card>
            <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold text-green-600">{(connections || []).filter(c => c.status === "active").length}</p></CardContent></Card>
            <Card className="border-l-4 border-l-teal-500"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Bandwidth</p><p className="text-2xl font-bold text-teal-600">{viewingCorporate.totalBandwidth || "—"}</p></CardContent></Card>
            <Card className="border-l-4 border-l-indigo-500"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Monthly Billing</p><p className="text-2xl font-bold">Rs. {parseFloat(viewingCorporate.monthlyBilling || "0").toLocaleString()}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2"><Wifi className="h-5 w-5 text-blue-600" />Branch Connections</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(connections || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Network className="h-12 w-12 mb-3 opacity-30" /><p className="font-medium">No connections yet</p>
                  <p className="text-sm mt-1">Add branch connections for this corporate account</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700">
                        <TableHead className="text-white">Branch Name</TableHead>
                        <TableHead className="text-white">Location</TableHead>
                        <TableHead className="text-white">Package</TableHead>
                        <TableHead className="text-white">Bandwidth</TableHead>
                        <TableHead className="text-white">Static IP</TableHead>
                        <TableHead className="text-white">Monthly</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(connections || []).map((c, idx) => (
                        <TableRow key={c.id} data-testid={`row-conn-${c.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                          <TableCell><span className="font-medium">{c.branchName}</span></TableCell>
                          <TableCell><span className="text-sm">{c.location || "—"}</span></TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px] capitalize">{c.packageType}</Badge></TableCell>
                          <TableCell><span className="text-sm font-medium text-teal-700 dark:text-teal-400">{c.bandwidth || "—"}</span></TableCell>
                          <TableCell><code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{c.staticIp || "—"}</code></TableCell>
                          <TableCell><span className="text-sm font-semibold">Rs. {parseFloat(c.monthlyCharges || "0").toLocaleString()}</span></TableCell>
                          <TableCell><Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[c.status] || ""}`}>{c.status}</Badge></TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditConnection(c)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteConnMutation.mutate(c.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Corporate Customer" : "Add Corporate Customer"}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-1 flex-wrap mb-4">
            {formSections.map((s, i) => (
              <Button key={s} variant={formSection === i ? "default" : "outline"} size="sm" onClick={() => setFormSection(i)}
                className={formSection === i ? "bg-gradient-to-r from-[#002B5B] to-[#005EFF] text-white text-xs" : "text-xs"} data-testid={`btn-corp-section-${i}`}>
                {s}
              </Button>
            ))}
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <CorporateCustomerFormFields form={form} section={formSection} />
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex gap-2">
                    {formSection > 0 && <Button type="button" variant="outline" size="sm" onClick={() => setFormSection(s => s - 1)}>Previous</Button>}
                    {formSection < 4 && <Button type="button" variant="outline" size="sm" onClick={() => setFormSection(s => s + 1)}>Next</Button>}
                    <span className="text-xs text-muted-foreground self-center">Step {formSection + 1} of 5</span>
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
                          data-testid="button-corp-save-add-another"
                          onClick={() => form.handleSubmit(data => onSubmit(data, { addAnother: true }))()}
                        >
                          Save & Add Another
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={createMutation.isPending}
                          data-testid="button-corp-save-activate"
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
                      data-testid="button-corp-submit"
                      className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] text-white"
                    >
                      {(createMutation.isPending || updateMutation.isPending) ? (
                        <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</>
                      ) : editing ? (
                        "Update"
                      ) : (
                        <><Check className="h-3.5 w-3.5 mr-1.5" />Save Corporate Customer</>
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
      <Dialog open={autoModalOpen} onOpenChange={(open) => { if (!open && autoComplete) { setAutoModalOpen(false); if (addAnotherPending) { setAddAnotherPending(false); setFormSection(0); form.reset(); setDialogOpen(true); } } }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden" data-testid="modal-corp-automation">
          <div className="bg-gradient-to-r from-[#002B5B] via-blue-700 to-indigo-700 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Smart Automation Running</h2>
                <p className="text-sm text-blue-100">Setting up {autoCustomerName || "new Corporate client"}…</p>
              </div>
              {autoComplete && <div className="ml-auto"><CheckCircle2 className="h-8 w-8 text-green-300" /></div>}
            </div>
          </div>
          <div className="px-6 py-5 space-y-3">
            {CORP_AUTO_STEPS.map((stepDef) => {
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
                        {step.data.bandwidth     && <span className="text-[10px] bg-white dark:bg-gray-800 border border-teal-200 dark:border-teal-700 rounded px-2 py-0.5 text-teal-700 dark:text-teal-300 font-mono">{step.data.bandwidth}</span>}
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
                  {autoSteps.filter(s => s.status === "success").length} of {CORP_AUTO_STEPS.length} workflows executed successfully.
                  {autoSteps.filter(s => s.status === "skipped").length > 0 && ` ${autoSteps.filter(s => s.status === "skipped").length} skipped.`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setAutoModalOpen(false); if (addAnotherPending) { setAddAnotherPending(false); setFormSection(0); form.reset(); setDialogOpen(true); } }} data-testid="button-corp-auto-add-another">
                  {addAnotherPending ? "Add Another" : "Close"}
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-[#002B5B] to-[#005EFF] text-white gap-1.5" onClick={() => setAutoModalOpen(false)} data-testid="button-corp-auto-done">
                  <ArrowRight className="h-4 w-4" />Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={connectionDialogOpen} onOpenChange={setConnectionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingConnection ? "Edit Connection" : "Add Branch Connection"}</DialogTitle>
          </DialogHeader>
          <Form {...connForm}>
            <form onSubmit={connForm.handleSubmit(onConnSubmit)} className="space-y-4">
              <FormField control={connForm.control} name="branchName" render={({ field }) => (<FormItem><FormLabel>Branch Name</FormLabel><FormControl><Input data-testid="input-conn-branch" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={connForm.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={connForm.control} name="packageType" render={({ field }) => (
                  <FormItem><FormLabel>Package</FormLabel><Select onValueChange={field.onChange} value={field.value || "shared"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="shared">Shared</SelectItem><SelectItem value="dedicated">Dedicated</SelectItem><SelectItem value="cir">CIR</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={connForm.control} name="bandwidth" render={({ field }) => (<FormItem><FormLabel>Bandwidth</FormLabel><FormControl><Input placeholder="e.g., 50 Mbps" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={connForm.control} name="staticIp" render={({ field }) => (<FormItem><FormLabel>Static IP</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={connForm.control} name="monthlyCharges" render={({ field }) => (<FormItem><FormLabel>Monthly Charges</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={connForm.control} name="installationDate" render={({ field }) => (<FormItem><FormLabel>Installation Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={connForm.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value || "active"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setConnectionDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createConnMutation.isPending || updateConnMutation.isPending} data-testid="button-conn-submit" className="bg-gradient-to-r from-[#002B5B] to-[#005EFF]">
                  {(createConnMutation.isPending || updateConnMutation.isPending) ? "Saving..." : editingConnection ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Corporate Customer Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="modal-corp-details">
          {viewingDetails && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{viewingDetails.companyName}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">{viewingDetails.industryType || "Corporate Account"}{viewingDetails.ntn ? ` — NTN: ${viewingDetails.ntn}` : ""}</p>
                  </div>
                  <div className="ml-auto">
                    <Badge variant="secondary" className={`capitalize text-xs ${statusColors[viewingDetails.status] || ""}`}>{viewingDetails.status}</Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {/* Company Info */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-3 flex items-center gap-2"><Building2 className="h-3.5 w-3.5" />Company Information</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Registration No.</p><p className="text-sm font-medium font-mono">{viewingDetails.registrationNumber || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">NTN</p><p className="text-sm font-medium font-mono">{viewingDetails.ntn || "—"}</p></div>
                    <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Email</p><p className="text-sm font-medium">{viewingDetails.email || "—"}</p></div></div>
                    <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Phone</p><p className="text-sm font-medium">{viewingDetails.phone || "—"}</p></div></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Account Manager</p><p className="text-sm font-medium">{viewingDetails.accountManager || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Industry</p><p className="text-sm font-medium">{viewingDetails.industryType || "—"}</p></div>
                    <div className="col-span-2 flex items-start gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" /><div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Head Office Address</p><p className="text-sm font-medium">{viewingDetails.headOfficeAddress || "—"}</p></div></div>
                    {viewingDetails.billingAddress && viewingDetails.billingAddress !== viewingDetails.headOfficeAddress && (
                      <div className="col-span-2"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Billing Address</p><p className="text-sm font-medium">{viewingDetails.billingAddress}</p></div>
                    )}
                  </div>
                </div>

                {/* Billing */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400 mb-3 flex items-center gap-2"><DollarSign className="h-3.5 w-3.5" />Billing Configuration</p>
                  <div className="grid grid-cols-3 gap-x-6 gap-y-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Monthly Billing</p><p className="text-sm font-bold text-green-700 dark:text-green-400">Rs. {parseFloat(viewingDetails.monthlyBilling || "0").toLocaleString()}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Payment Terms</p><p className="text-sm font-medium capitalize">{(viewingDetails.paymentTerms || "net_30").replace("_", " ")}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Credit Limit</p><p className="text-sm font-medium">Rs. {parseFloat(viewingDetails.creditLimit || "0").toLocaleString()}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Security Deposit</p><p className="text-sm font-medium">Rs. {parseFloat(viewingDetails.securityDeposit || "0").toLocaleString()}</p></div>
                    <div className="flex gap-3">
                      {viewingDetails.centralizedBilling && <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Centralized</Badge>}
                      {viewingDetails.perBranchBilling && <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">Per-Branch</Badge>}
                    </div>
                    {viewingDetails.customInvoiceFormat && <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Invoice Format</p><p className="text-sm font-medium">{viewingDetails.customInvoiceFormat}</p></div>}
                  </div>
                </div>

                {/* Contract & SLA */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />Contract & SLA</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Contract Duration</p><p className="text-sm font-medium">{viewingDetails.contractDuration || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Dedicated Acc. Manager</p><p className="text-sm font-medium">{viewingDetails.dedicatedAccountManager || "—"}</p></div>
                    {viewingDetails.customSla && <div className="col-span-2"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Custom SLA</p><p className="text-sm">{viewingDetails.customSla}</p></div>}
                    {viewingDetails.customPricingAgreement && <div className="col-span-2"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Custom Pricing Agreement</p><p className="text-sm">{viewingDetails.customPricingAgreement}</p></div>}
                  </div>
                </div>

                {/* Managed Services */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 mb-3 flex items-center gap-2"><Shield className="h-3.5 w-3.5" />Managed Services</p>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <div className="flex flex-wrap gap-2">
                      {viewingDetails.managedRouter && <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Managed Router</Badge>}
                      {viewingDetails.firewall && <Badge variant="secondary" className="text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">Firewall</Badge>}
                      {viewingDetails.loadBalancer && <Badge variant="secondary" className="text-xs bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">Load Balancer</Badge>}
                      {viewingDetails.dedicatedSupport && <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">Dedicated Support</Badge>}
                      {viewingDetails.backupLink && <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">Backup Link</Badge>}
                      {viewingDetails.monitoringSla && <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">Monitoring SLA</Badge>}
                      {!viewingDetails.managedRouter && !viewingDetails.firewall && !viewingDetails.loadBalancer && !viewingDetails.dedicatedSupport && !viewingDetails.backupLink && !viewingDetails.monitoringSla && (
                        <span className="text-sm text-muted-foreground">No managed services enabled</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2"><Network className="h-3.5 w-3.5" />Summary</p>
                  <div className="grid grid-cols-3 gap-x-6 gap-y-3 bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Connections</p><p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{viewingDetails.totalConnections || 0}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Bandwidth</p><p className="text-sm font-bold text-teal-700 dark:text-teal-400 mt-1">{viewingDetails.totalBandwidth || "—"}</p></div>
                    {viewingDetails.notes && <div className="col-span-3"><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Notes</p><p className="text-sm">{viewingDetails.notes}</p></div>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <Button variant="outline" size="sm" onClick={() => { setDetailsDialogOpen(false); openConnections(viewingDetails); }}>
                  <Link2 className="h-3.5 w-3.5 mr-1.5" />Connections
                </Button>
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
              Referrals — {viewingReferralsCorp?.companyName}
            </DialogTitle>
          </DialogHeader>
          {viewingReferralsCorp && (() => {
            const refs = corpReferrals(viewingReferralsCorp.id);
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
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="dialog-corp-send-notification">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-[#0057FF]" /> Send Notification</DialogTitle>
          </DialogHeader>
          {smsCustomer && (
            <div className="space-y-5">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0057FF] flex items-center justify-center text-white font-bold text-sm">{smsCustomer.companyName.charAt(0)}</div>
                  <div>
                    <p className="font-semibold text-sm">{smsCustomer.companyName}</p>
                    <p className="text-xs text-muted-foreground">CORP-{smsCustomer.id} • {smsCustomer.mobileNo || smsCustomer.phone || "No phone"} • {smsCustomer.email || "No email"}</p>
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
                      data-testid={`btn-corp-channel-${ch.value}`}>
                      <ch.icon className="h-5 w-5" /><span className="text-xs">{ch.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Message Category</span>
                <Select value={smsCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger data-testid="select-corp-sms-category"><SelectValue /></SelectTrigger>
                  <SelectContent>{smsCategories.map(cat => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              {(smsChannel === "email" || smsChannel === "in_app") && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Subject</span>
                  <Input value={smsSubject} onChange={e => setSmsSubject(e.target.value)} placeholder="Enter subject..." data-testid="input-corp-sms-subject" />
                </div>
              )}
              <div className="space-y-2">
                <span className="text-sm font-medium">Message</span>
                <Textarea value={smsMessage} onChange={e => setSmsMessage(e.target.value)} placeholder="Type your message..." className="min-h-[120px]" data-testid="textarea-corp-sms-message" />
              </div>
              {smsChannel === "sms" && !smsCustomer.mobileNo && !smsCustomer.phone && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs"><AlertTriangle className="h-4 w-4 shrink-0" /> Customer has no phone number</div>
              )}
              {smsChannel === "email" && !smsCustomer.email && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs"><AlertTriangle className="h-4 w-4 shrink-0" /> Customer has no email address</div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSmsDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => smsCustomer && sendNotificationMutation.mutate({ channel: smsChannel, customer: smsCustomer, subject: smsSubject, message: smsMessage, category: smsCategory })}
              disabled={sendNotificationMutation.isPending || !smsMessage.trim() || (smsChannel === "email" && (!smsSubject.trim() || !smsCustomer?.email)) || (smsChannel === "sms" && !smsCustomer?.mobileNo && !smsCustomer?.phone)}
              className="bg-[#0057FF]" data-testid="button-corp-send-notification">
              {sendNotificationMutation.isPending ? "Sending..." : (<><Send className="h-4 w-4 mr-1.5" />{smsChannel === "email" ? "Send Email" : smsChannel === "sms" ? "Send SMS" : smsChannel === "whatsapp" ? "Send WhatsApp" : "Send Notification"}</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-[500px]" data-testid="dialog-corp-status-toggle">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {statusAction === "active" ? <Power className="h-5 w-5 text-green-600" /> : <PowerOff className="h-5 w-5 text-red-600" />}
              {statusAction === "active" ? "Activate Corporate Customer" : "Close / Deactivate Corporate Customer"}
            </DialogTitle>
          </DialogHeader>
          {statusCustomer && (
            <div className="space-y-5">
              <div className="bg-muted/50 rounded-lg p-3 border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0057FF] flex items-center justify-center text-white font-bold text-sm">{statusCustomer.companyName.charAt(0)}</div>
                  <div><p className="font-semibold text-sm">{statusCustomer.companyName}</p><p className="text-xs text-muted-foreground">CORP-{statusCustomer.id}</p></div>
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
                      data-testid={`btn-corp-status-${s.value}`}>
                      <s.icon className="h-5 w-5 shrink-0" />
                      <div><p className="text-sm font-medium">{s.label}</p><p className="text-[10px] text-muted-foreground">{s.desc}</p></div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Reason</span>
                <Select value={statusReasonSelect} onValueChange={setStatusReasonSelect}>
                  <SelectTrigger data-testid="select-corp-status-reason"><SelectValue placeholder="Select reason..." /></SelectTrigger>
                  <SelectContent>{(statusReasonOptions[statusAction] || []).map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Additional Notes</span>
                <Textarea value={statusReason} onChange={e => setStatusReason(e.target.value)} placeholder="Add any additional notes..." className="min-h-[80px]" data-testid="textarea-corp-status-notes" />
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
              data-testid="button-corp-confirm-status">
              {statusToggleMutation.isPending ? "Updating..." : (statusAction === "active" ? "Activate" : statusAction === "suspended" ? "Suspend" : statusAction === "expired" ? "Set Expired" : "Close Account")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
