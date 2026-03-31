import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft, Building2, Mail, Phone, Wifi, Edit, Save, ChevronRight,
  Shield, Network, Activity, DollarSign, AlertCircle, RefreshCw,
  Calendar, Download, MessageCircle, CalendarRange, User, Hash,
  CreditCard, Globe, CheckCircle2, FileText, Plus, Clock, TrendingUp,
  TrendingDown, BarChart3, MessageSquare, ShoppingBag, Users, Bell, Send,
  ArrowUpDown, Settings, Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCirCustomerSchema, type CirCustomer, type InsertCirCustomer } from "@shared/schema";
import { CirCustomerFormFields, CIR_FORM_SECTIONS } from "@/components/cir-customer-form-fields";

/* ─── Shared components (match customer-profile.tsx exactly) ─── */
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-0 flex-1">
        <div className="text-white text-xs font-semibold px-5 py-2.5 rounded-md flex-1 bg-[#1c67d4]">
          {title}
        </div>
      </div>
      {action && <div className="ml-3">{action}</div>}
    </div>
  );
}

function InfoRow({ label, value, capitalize }: { label: string; value: React.ReactNode; capitalize?: boolean }) {
  return (
    <div className="flex items-center py-2.5 px-4 text-xs">
      <span className="font-semibold text-muted-foreground w-[45%] shrink-0">{label}</span>
      <span className="text-muted-foreground mx-2">:</span>
      <span className={`font-medium text-foreground ${capitalize ? "capitalize" : ""}`}>{value ?? "-"}</span>
    </div>
  );
}

function ProfileSidebarItem({ icon: Icon, label, value, testId }: { icon: any; label: string; value: string; testId?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/10">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 opacity-60" />
        <span className="opacity-80">{label}:</span>
      </div>
      <span className="font-medium text-right max-w-[55%] truncate" data-testid={testId}>{value || "—"}</span>
    </div>
  );
}

function BoolValue({ v }: { v: boolean | null | undefined }) {
  return v
    ? <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium"><CheckCircle2 className="h-3 w-3" />Yes</span>
    : <span className="text-muted-foreground">No</span>;
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="bg-card border rounded-lg p-12 text-center text-muted-foreground">
      <Icon className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

const formatDate = (d?: string | null) => {
  if (!d) return "-";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }
};

/* ─── Edit Dialog ─── */
function CirEditDialog({ open, onClose, customer, id, vendors }: { open: boolean; onClose: () => void; customer: CirCustomer; id: string; vendors: any[] }) {
  const { toast } = useToast();
  const [section, setSection] = useState(0);
  const form = useForm<InsertCirCustomer>({ resolver: zodResolver(insertCirCustomerSchema), defaultValues: customer as any });
  const updateMutation = useMutation({
    mutationFn: async (data: InsertCirCustomer) => { const res = await apiRequest("PATCH", `/api/cir-customers/${id}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cir-customers", id] }); queryClient.invalidateQueries({ queryKey: ["/api/cir-customers"] }); onClose(); toast({ title: "CIR Customer updated successfully" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const sections = CIR_FORM_SECTIONS;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit CIR Customer</DialogTitle></DialogHeader>
        <div className="flex gap-1 flex-wrap mb-4">
          {sections.map((s, i) => (
            <Button key={s} variant={section === i ? "default" : "outline"} size="sm" onClick={() => setSection(i)}
              className={section === i ? "bg-gradient-to-r from-[#002B5B] to-[#005EFF] text-white text-xs" : "text-xs"} data-testid={`btn-section-${i}`}>
              {s}
            </Button>
          ))}
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
            <CirCustomerFormFields form={form} section={section} vendors={vendors || []} />
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-2">
                  {section > 0 && <Button type="button" variant="outline" size="sm" onClick={() => setSection(s => s - 1)}>Previous</Button>}
                  {section < 5 && <Button type="button" variant="outline" size="sm" onClick={() => setSection(s => s + 1)}>Next</Button>}
                  <span className="text-xs text-muted-foreground self-center">Step {section + 1} of 6</span>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={updateMutation.isPending} className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] text-white" data-testid="button-cir-edit-submit">
                    {updateMutation.isPending ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</> : "Update"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Profile Page ─── */
export default function CirCustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  const [editOpen, setEditOpen] = useState(false);
  const [schedulerDialogOpen, setSchedulerDialogOpen] = useState(false);
  const [schedulerType, setSchedulerType] = useState("installation");
  const [schedulerDate, setSchedulerDate] = useState("");
  const [schedulerTime, setSchedulerTime] = useState("10:00");
  const [schedulerAssignee, setSchedulerAssignee] = useState("");
  const [schedulerPriority, setSchedulerPriority] = useState("normal");
  const [schedulerNotes, setSchedulerNotes] = useState("");
  const [pcrDetailOpen, setPcrDetailOpen] = useState(false);
  const [selectedPcr, setSelectedPcr] = useState<any>(null);
  const [smsProfileDialogOpen, setSmsProfileDialogOpen] = useState(false);
  const [smsProfileChannel, setSmsProfileChannel] = useState("email");
  const [smsProfileSubject, setSmsProfileSubject] = useState("");
  const [smsProfileMessage, setSmsProfileMessage] = useState("");
  const [smsProfileCategory, setSmsProfileCategory] = useState("bill_reminder");

  const smsCategories = [
    { value: "bill_reminder", label: "Bill Reminder", defaultMsg: "Dear {name}, your bill of {amount} is due. Please pay before the due date to avoid service interruption." },
    { value: "invoice_softcopy", label: "Invoice Softcopy (WhatsApp/Email)", defaultMsg: "Dear {name}, please find your invoice #{invoice} attached. Amount: {amount}." },
    { value: "account_suspend", label: "Account Suspend Notice", defaultMsg: "Dear {name}, your account has been suspended due to non-payment. Please clear your dues to restore service." },
    { value: "payment_confirmation", label: "Payment Confirmation", defaultMsg: "Dear {name}, we have received your payment of {amount}. Thank you!" },
    { value: "service_activation", label: "Service Activation", defaultMsg: "Dear {name}, your internet service has been activated. Enjoy your connection!" },
    { value: "package_change", label: "Package Change Notification", defaultMsg: "Dear {name}, your package has been changed successfully. New package details will be reflected in your next bill." },
    { value: "maintenance_notice", label: "Maintenance Notice", defaultMsg: "Dear {name}, scheduled maintenance will be performed in your area. We apologize for any inconvenience." },
    { value: "welcome_message", label: "Welcome Message", defaultMsg: "Welcome to our network, {name}! We are glad to have you as a customer." },
    { value: "custom", label: "Custom Message", defaultMsg: "" },
  ];

  const { data: customer, isLoading } = useQuery<CirCustomer>({
    queryKey: ["/api/cir-customers", id],
    queryFn: async () => { const res = await fetch(`/api/cir-customers/${id}`, { credentials: "include" }); if (!res.ok) throw new Error("Failed to fetch"); return res.json(); },
    enabled: !!id,
  });
  const { data: vendors } = useQuery<any[]>({ queryKey: ["/api/vendors"] });
  const { data: invoices, isLoading: invoicesLoading } = useQuery<any[]>({
    queryKey: ["/api/cir-customers", id, "invoices"],
    queryFn: async () => { const res = await fetch(`/api/cir-customers/${id}/invoices`, { credentials: "include" }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    enabled: !!id,
  });
  const { data: tickets, isLoading: ticketsLoading } = useQuery<any[]>({
    queryKey: ["/api/cir-customers", id, "tickets"],
    queryFn: async () => { const res = await fetch(`/api/cir-customers/${id}/tickets`, { credentials: "include" }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    enabled: !!id,
  });

  const { data: packageChangeReqs, isLoading: pcrLoading } = useQuery<any[]>({
    queryKey: ["/api/cir-customers", id, "package-change-requests"],
    queryFn: async () => { const res = await fetch(`/api/cir-customers/${id}/package-change-requests`, { credentials: "include" }); if (!res.ok) return []; return res.json(); },
    enabled: !!id,
  });

  const { data: serviceRequests } = useQuery<any[]>({
    queryKey: ["/api/cir-customers", id, "service-requests"],
    queryFn: async () => { try { const res = await fetch(`/api/cir-customers/${id}/service-requests`, { credentials: "include" }); if (!res.ok) return []; return res.json(); } catch { return []; } },
    enabled: !!id,
  });

  const statusUpdateMutation = useMutation({
    mutationFn: async (status: string) => { const res = await apiRequest("PATCH", `/api/cir-customers/${id}`, { status }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cir-customers", id] }); queryClient.invalidateQueries({ queryKey: ["/api/cir-customers"] }); toast({ title: "Status updated" }); },
  });

  const scheduleServiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/cir-customers/${id}/service-requests`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cir-customers", id, "service-requests"] });
      toast({ title: "Service Scheduled", description: "Service request has been created" });
      setSchedulerDialogOpen(false);
      setSchedulerType("installation"); setSchedulerDate(""); setSchedulerTime("10:00");
      setSchedulerAssignee(""); setSchedulerPriority("normal"); setSchedulerNotes("");
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const sendProfileNotificationMutation = useMutation({
    mutationFn: async (data: { channel: string; subject: string; message: string; category: string }) => {
      if (data.channel === "email") {
        if (!customer?.email) throw new Error("Customer has no email address");
        const res = await apiRequest("POST", "/api/notifications/send-email", { to: customer.email, subject: data.subject, body: data.message });
        return res.json();
      } else if (data.channel === "sms") {
        const phone = customer?.phone || customer?.mobileNo2;
        if (!phone) throw new Error("Customer has no phone number");
        const res = await apiRequest("POST", "/api/notifications/send-sms", { to: phone, message: data.message });
        return res.json();
      } else if (data.channel === "whatsapp") {
        const phone = customer?.phone || customer?.mobileNo2;
        if (!phone) throw new Error("Customer has no phone/mobile number");
        const res = await apiRequest("POST", "/api/notifications/send-sms", { to: phone, message: data.message });
        return res.json();
      } else if (data.channel === "in_app") {
        const res = await apiRequest("POST", "/api/notification-dispatches", {
          channel: "in_app", recipient: customer?.email || `CIR-${customer?.id}`,
          subject: data.subject, body: data.message, status: "sent",
          createdAt: new Date().toISOString(),
        });
        return res.json();
      }
    },
    onSuccess: (_, vars) => {
      toast({ title: "Sent Successfully", description: `${vars.channel === "email" ? "Email" : vars.channel === "sms" ? "SMS" : vars.channel === "whatsapp" ? "WhatsApp" : "In-App Notification"} sent to ${customer?.companyName || customer?.customerId}` });
      setSmsProfileDialogOpen(false);
      setSmsProfileSubject(""); setSmsProfileMessage(""); setSmsProfileChannel("email"); setSmsProfileCategory("bill_reminder");
    },
    onError: (err: Error) => { toast({ title: "Failed to Send", description: err.message, variant: "destructive" }); },
  });

  const handleProfileCategoryChange = (value: string) => {
    setSmsProfileCategory(value);
    const cat = smsCategories.find(c => c.value === value);
    if (cat && customer) {
      setSmsProfileMessage(cat.defaultMsg.replace("{name}", customer.companyName || customer.customerId || ""));
      if (value === "invoice_softcopy") setSmsProfileSubject("Invoice Copy");
      else if (value === "bill_reminder") setSmsProfileSubject("Bill Reminder");
      else if (value === "account_suspend") setSmsProfileSubject("Account Suspension Notice");
      else if (value === "payment_confirmation") setSmsProfileSubject("Payment Confirmation");
      else setSmsProfileSubject("");
    }
  };

  const openProfileSmsDialog = () => {
    setSmsProfileChannel("sms");
    setSmsProfileCategory("bill_reminder");
    const cat = smsCategories.find(c => c.value === "bill_reminder");
    setSmsProfileMessage(cat?.defaultMsg.replace("{name}", customer?.companyName || customer?.customerId || "") || "");
    setSmsProfileSubject("");
    setSmsProfileDialogOpen(true);
  };

  const vendor = vendors?.find(v => v.id === customer?.vendorId);

  /* Tab definitions — two rows matching reference image */
  const tabsRow1 = [
    { key: "personal", label: "Personal Information" },
    { key: "service", label: "Service Information" },
    { key: "network", label: "Network & Infrastructure" },
    { key: "contract", label: "Contract & SLA" },
    { key: "vas", label: "Value Added Services" },
    { key: "monitoring", label: "Monitoring" },
    { key: "invoices", label: "Generated & Updated Bill/Invoices" },
  ];
  const tabsRow2 = [
    { key: "bwhistory", label: "Bandwidth Upgrade & Downgrade History" },
    { key: "received", label: "Received Bill History" },
    { key: "complain", label: "Complain History" },
    { key: "sms", label: "SMS Message History" },
    { key: "sales", label: "Product & Service Sales Invoices" },
    { key: "referrals", label: "Referrals" },
    { key: "service_scheduler", label: "Service Scheduler" },
  ];

  if (isLoading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-0"><Skeleton className="h-[600px] w-[280px] shrink-0" /><Skeleton className="h-[600px] flex-1" /></div>
    </div>
  );
  if (!customer) return (
    <div className="p-6 space-y-4">
      <Link href="/cir-customers"><Button variant="ghost"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
      <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><AlertCircle className="h-12 w-12 mb-3 opacity-30" /><p>CIR Customer not found</p></CardContent></Card>
    </div>
  );

  return (
    <div className="space-y-0">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-[#0057FF]" />
          <h1 className="text-lg font-bold">Profile</h1>
          <span className="text-xs text-muted-foreground">CIR Client Profile</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/cir-customers" className="text-[#0057FF]">CIR Customers</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/cir-customers" className="text-[#0057FF]">Client list</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Profile</span>
        </div>
      </div>

      <div className="flex gap-0 min-h-[calc(100vh-120px)]">
        {/* ── Sidebar ── */}
        <div className="w-[280px] shrink-0 border-r bg-gradient-to-b from-[#1a2332] to-[#243447] text-white">
          <div className="flex flex-col items-center pt-6 pb-4 px-4">
            <div className="w-28 h-28 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center mb-3">
              <Building2 className="h-14 w-14 text-white/50" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
              <Mail className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
              <Phone className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
            </div>
            <h2 className="text-lg font-bold text-center">{customer.companyName}</h2>
            <p className="text-xs opacity-70 capitalize">{customer.customerType || "CIR"}</p>
          </div>
          <div className="px-4 space-y-0 text-xs border-t border-white/10 pt-4">
            <ProfileSidebarItem icon={Hash} label="Client Code" value={`CIR-${customer.id}`} />
            <ProfileSidebarItem icon={User} label="Contact Person" value={customer.contactPerson || customer.companyName} />
            <ProfileSidebarItem icon={Wifi} label="Committed BW" value={customer.committedBandwidth || "Not set"} />
            <ProfileSidebarItem icon={CreditCard} label="Monthly Charges" value={`Rs. ${parseFloat(customer.monthlyCharges || "0").toLocaleString()}`} />
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 opacity-60" /><span className="opacity-80">Active Status</span></div>
              <Switch checked={customer.status === "active"} onCheckedChange={(c) => statusUpdateMutation.mutate(c ? "active" : "suspended")} className="scale-75" />
            </div>
            <ProfileSidebarItem icon={Calendar} label="Contract End" value={customer.contractEndDate || "Not set"} />
            <ProfileSidebarItem icon={Network} label="Static IP" value={customer.staticIp || "Not assigned"} />
            <ProfileSidebarItem icon={Globe} label="Vendor" value={vendor?.name || "Not set"} />
          </div>
          <div className="px-4 pt-4 pb-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" onClick={() => setLocation(`/add-customer?type=cir&edit=${id}`)}><Edit className="h-3 w-3" /> Update Information</Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" onClick={() => setActiveTab("service_scheduler")}><CalendarRange className="h-3 w-3" /> Status Scheduler</Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" onClick={openProfileSmsDialog}><MessageCircle className="h-3 w-3" /> Send Email/Message</Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" onClick={() => setActiveTab("bwhistory")}><Activity className="h-3 w-3" /> Bandwidth Schedule</Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1 col-span-2" data-testid="button-package-change" onClick={() => setLocation(`/package-change?customerType=CIR&customerId=${id}&customerName=${encodeURIComponent(customer.companyName)}`)}><ArrowUpDown className="h-3 w-3" /> Package Change Request</Button>
            </div>
            <Button size="sm" className="w-full text-xs h-9 gap-1.5 bg-[#0057FF]"><Download className="h-3.5 w-3.5" /> Download Information</Button>
            <Link href="/cir-customers"><Button size="sm" variant="outline" className="w-full text-xs h-9 gap-1.5 text-white border-white/30"><ArrowLeft className="h-3.5 w-3.5" /> Go To CIR List</Button></Link>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 bg-muted/30 overflow-hidden">
          {/* Tab Bar — two rows */}
          <div className="border-b bg-card">
            <div className="flex flex-wrap px-1 border-b border-border/50">
              {tabsRow1.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? "border-[#0057FF] text-[#0057FF]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  data-testid={`tab-cir-${tab.key}`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap px-1">
              {tabsRow2.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? "border-[#0057FF] text-[#0057FF]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  data-testid={`tab-cir-${tab.key}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 overflow-y-auto max-h-[calc(100vh-200px)] space-y-4">

            {/* SERVICE INFORMATION */}
            {activeTab === "service" && (
              <div className="space-y-4">
                <SectionHeader title="Internet Service Information" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Company Name" value={customer.companyName} />
                    <InfoRow label="Vendor" value={vendor?.name} />
                    <InfoRow label="Service Type" value={customer.serviceType} />
                    <InfoRow label="Link Type" value={customer.linkType} />
                    <InfoRow label="Committed Bandwidth" value={<span className="font-bold text-teal-700 dark:text-teal-400">{customer.committedBandwidth}</span>} />
                    <InfoRow label="Burst Bandwidth" value={customer.burstBandwidth} />
                    <InfoRow label="Upload Speed" value={customer.uploadSpeed} />
                    <InfoRow label="Download Speed" value={customer.downloadSpeed} />
                    <InfoRow label="Contention Ratio" value={customer.contentionRatio} />
                    <InfoRow label="VLAN ID" value={customer.vlanId} />
                    <InfoRow label="Client Type" value={customer.customerType} capitalize />
                    <InfoRow label="Billing Status" value={
                      <Badge variant="secondary" className={`capitalize text-[10px] ${customer.status === "active" ? "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950" : "text-red-700 bg-red-50"}`}>{customer.status}</Badge>
                    } />
                    <InfoRow label="Assigned To" value={customer.accountManager} />
                    <InfoRow label="SLA Level" value={customer.slaLevel ? `${customer.slaLevel}%` : "-"} />
                  </div>
                </div>

                <SectionHeader title="Package Billing" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Monthly Charges" value={<span className="font-bold text-green-700 dark:text-green-400">Rs. {parseFloat(customer.monthlyCharges || "0").toLocaleString()}</span>} />
                    <InfoRow label="Installation Charges" value={`Rs. ${parseFloat(customer.installationCharges || "0").toLocaleString()}`} />
                    <InfoRow label="Security Deposit" value={`Rs. ${parseFloat(customer.securityDeposit || "0").toLocaleString()}`} />
                    <InfoRow label="Billing Cycle" value={customer.billingCycle} capitalize />
                    <InfoRow label="Payment Terms" value={customer.paymentTerms} />
                    <InfoRow label="Invoice Type" value={customer.invoiceType === "tax" ? "Tax Invoice" : customer.invoiceType || "-"} />
                  </div>
                </div>
              </div>
            )}

            {/* NETWORK & INFRASTRUCTURE */}
            {activeTab === "network" && (
              <div className="space-y-4">
                <SectionHeader title="IP Configuration" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Static IP" value={<span className="font-mono text-blue-700 dark:text-blue-400">{customer.staticIp}</span>} />
                    <InfoRow label="Subnet Mask" value={<span className="font-mono">{customer.subnetMask}</span>} />
                    <InfoRow label="Gateway" value={<span className="font-mono">{customer.gateway}</span>} />
                    <InfoRow label="Primary DNS" value={<span className="font-mono">{customer.dns}</span>} />
                    <InfoRow label="Secondary DNS" value={<span className="font-mono">{customer.dns2}</span>} />
                    <InfoRow label="Public IP Block" value={<span className="font-mono">{customer.publicIpBlock}</span>} />
                  </div>
                </div>

                <SectionHeader title="Connection Details" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Vendor" value={vendor?.name} />
                    <InfoRow label="Vendor Port" value={customer.vendorPort} />
                    <InfoRow label="Uplink Port" value={customer.uplinkPort} />
                    <InfoRow label="Media" value={customer.media} />
                    <InfoRow label="ONU / Device" value={customer.onuDevice} />
                    <InfoRow label="Radius Profile" value={<span className="font-mono">{customer.radiusProfile}</span>} />
                    <InfoRow label="Bandwidth Profile" value={<span className="font-mono">{customer.bandwidthProfileName}</span>} />
                  </div>
                </div>
              </div>
            )}

            {/* PERSONAL INFORMATION */}
            {activeTab === "personal" && (
              <div className="space-y-4">
                <SectionHeader title="Company Information" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Company Name" value={customer.companyName} />
                    <InfoRow label="Contact Person" value={customer.contactPerson} />
                    <InfoRow label="CNIC" value={customer.cnic} />
                    <InfoRow label="NTN" value={customer.ntn} />
                    <InfoRow label="Email" value={customer.email} />
                    <InfoRow label="Phone" value={customer.phone} />
                    <InfoRow label="Mobile No. 2" value={customer.mobileNo2} />
                    <InfoRow label="City" value={customer.city} />
                    <InfoRow label="Branch" value={customer.branch} />
                    <InfoRow label="Address" value={customer.address} />
                  </div>
                </div>

                <SectionHeader title="Account Manager" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Account Manager" value={customer.accountManager} />
                    <InfoRow label="Dedicated Account Manager" value={customer.dedicatedAccountManager} />
                    <InfoRow label="Status" value={<Badge variant="secondary" className={`capitalize text-[10px] ${customer.status === "active" ? "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950" : "text-red-700 bg-red-50"}`}>{customer.status}</Badge>} />
                    <InfoRow label="Creation Date" value={formatDate(customer.createdAt)} />
                  </div>
                </div>
              </div>
            )}

            {/* CONTRACT & SLA */}
            {activeTab === "contract" && (
              <div className="space-y-4">
                <SectionHeader title="Contract Details" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Contract Start Date" value={customer.contractStartDate} />
                    <InfoRow label="Contract End Date" value={customer.contractEndDate} />
                    <InfoRow label="Contract Duration" value={customer.contractDuration} />
                    <InfoRow label="SLA Level" value={customer.slaLevel ? `${customer.slaLevel}%` : "-"} />
                    <InfoRow label="Account Manager" value={customer.accountManager} />
                    <InfoRow label="Dedicated Account Manager" value={customer.dedicatedAccountManager} />
                    <InfoRow label="Auto Renewal" value={<BoolValue v={customer.autoRenewal} />} />
                  </div>
                </div>
                <SectionHeader title="SLA & Legal Terms" />
                <div className="bg-card border rounded-lg overflow-hidden divide-y">
                  <InfoRow label="SLA Penalty Clause" value={customer.slaPenaltyClause || "-"} />
                  <InfoRow label="Custom SLA Terms" value={customer.customSla || "-"} />
                  <InfoRow label="Custom Pricing Agreement" value={customer.customPricingAgreement || "-"} />
                </div>
              </div>
            )}

            {/* VALUE ADDED SERVICES */}
            {activeTab === "vas" && (
              <div className="space-y-4">
                <SectionHeader title="Managed Services" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Managed Router" value={<BoolValue v={customer.managedRouter} />} />
                    <InfoRow label="Firewall" value={<BoolValue v={customer.firewall} />} />
                    <InfoRow label="Load Balancer" value={<BoolValue v={customer.loadBalancer} />} />
                    <InfoRow label="Dedicated Support" value={<BoolValue v={customer.dedicatedSupport} />} />
                    <InfoRow label="Backup Link" value={<BoolValue v={customer.backupLink} />} />
                    <InfoRow label="Monitoring SLA" value={<BoolValue v={customer.monitoringSla} />} />
                  </div>
                </div>
                <SectionHeader title="Billing Add-ons" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Centralized Billing" value={<BoolValue v={customer.centralizedBilling} />} />
                    <InfoRow label="Per-Branch Billing" value={<BoolValue v={customer.perBranchBilling} />} />
                    <InfoRow label="Custom Invoice Format" value={customer.customInvoiceFormat} />
                    <InfoRow label="Late Fee Policy" value={customer.lateFeePolicy} />
                    <InfoRow label="Billing Discount" value={customer.billingDiscount || "-"} />
                    <InfoRow label="OTC Amount" value={customer.otcAmount || "-"} />
                  </div>
                </div>
              </div>
            )}

            {/* MONITORING */}
            {activeTab === "monitoring" && (
              <div className="space-y-4">
                <SectionHeader title="Radius & Bandwidth Profiles" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Radius Profile" value={<span className="font-mono">{customer.radiusProfile}</span>} />
                    <InfoRow label="Bandwidth Profile Name" value={<span className="font-mono">{customer.bandwidthProfileName}</span>} />
                  </div>
                </div>
                <SectionHeader title="Monitoring Settings" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Monitoring Enabled" value={<BoolValue v={customer.monitoringEnabled} />} />
                    <InfoRow label="SNMP Monitoring" value={<BoolValue v={customer.snmpMonitoring} />} />
                    <InfoRow label="Traffic Alerts" value={<BoolValue v={customer.trafficAlerts} />} />
                  </div>
                </div>
                {customer.notes && (<><SectionHeader title="Notes" /><div className="bg-card border rounded-lg px-4 py-3 text-sm">{customer.notes}</div></>)}
              </div>
            )}

            {/* GENERATED & UPDATED BILL/INVOICES */}
            {activeTab === "invoices" && (
              <div className="space-y-4">
                <SectionHeader title="Generated & Updated Bill/Invoices" />
                {invoicesLoading ? (<div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>)
                : !invoices?.length ? (<EmptyState icon={FileText} message="No invoices found for this CIR customer" />)
                : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-[#1a3a5c]">
                        <TableHead className="text-white text-xs">Invoice #</TableHead>
                        <TableHead className="text-white text-xs">Amount</TableHead>
                        <TableHead className="text-white text-xs">Tax</TableHead>
                        <TableHead className="text-white text-xs">Total</TableHead>
                        <TableHead className="text-white text-xs">Status</TableHead>
                        <TableHead className="text-white text-xs">Issue Date</TableHead>
                        <TableHead className="text-white text-xs">Due Date</TableHead>
                        <TableHead className="text-white text-xs">Paid Date</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {invoices.map((inv: any) => (
                          <TableRow key={inv.id}>
                            <TableCell className="text-xs font-mono">{inv.invoiceNumber}</TableCell>
                            <TableCell className="text-xs">{Number(inv.amount).toFixed(2)}</TableCell>
                            <TableCell className="text-xs">{Number(inv.tax || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-xs font-semibold">{Number(inv.totalAmount).toFixed(2)}</TableCell>
                            <TableCell><Badge variant="secondary" className={`text-[10px] capitalize ${inv.status === "paid" ? "text-green-700 bg-green-50" : inv.status === "overdue" ? "text-red-600 bg-red-50" : "text-amber-600 bg-amber-50"}`}>{inv.status}</Badge></TableCell>
                            <TableCell className="text-xs">{formatDate(inv.issueDate)}</TableCell>
                            <TableCell className="text-xs">{formatDate(inv.dueDate)}</TableCell>
                            <TableCell className="text-xs">{inv.paidDate ? formatDate(inv.paidDate) : "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* BANDWIDTH UPGRADE & DOWNGRADE HISTORY */}
            {activeTab === "bwhistory" && (
              <div className="space-y-6">
                <SectionHeader title="Package Change Requests" action={
                  <Button size="sm" className="text-xs h-8 gap-1 bg-[#1c67d4] text-white" data-testid="button-submit-change-request" onClick={() => setLocation(`/package-change?customerType=CIR&customerId=${id}&customerName=${encodeURIComponent(customer.companyName)}`)}><Plus className="h-3 w-3" />Submit Request</Button>
                } />
                {pcrLoading ? (<div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>)
                : !packageChangeReqs?.length ? (<EmptyState icon={FileText} message="No package change requests found" />)
                : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-[#1a3a5c]">
                        <TableHead className="text-white text-xs">Request #</TableHead>
                        <TableHead className="text-white text-xs">Date</TableHead>
                        <TableHead className="text-white text-xs">Type</TableHead>
                        <TableHead className="text-white text-xs">Previous BW</TableHead>
                        <TableHead className="text-white text-xs">New BW</TableHead>
                        <TableHead className="text-white text-xs">New Price</TableHead>
                        <TableHead className="text-white text-xs">Prorated Charges</TableHead>
                        <TableHead className="text-white text-xs">Adjustment</TableHead>
                        <TableHead className="text-white text-xs">Tax Impact</TableHead>
                        <TableHead className="text-white text-xs">Final Difference</TableHead>
                        <TableHead className="text-white text-xs">Status</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {packageChangeReqs.map((r: any) => (
                          <TableRow key={r.id} data-testid={`row-pcr-${r.id}`} className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30" onClick={() => { setSelectedPcr(r); setPcrDetailOpen(true); }}>
                            <TableCell className="text-xs font-medium text-[#0057FF]">{r.requestNumber}</TableCell>
                            <TableCell className="text-xs">{formatDate(r.createdAt)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${r.changeType === "upgrade" ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>
                                {r.changeType === "upgrade" ? <TrendingUp className="h-3 w-3 inline mr-1" /> : <TrendingDown className="h-3 w-3 inline mr-1" />}{r.changeType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{r.currentBandwidth || "-"}</TableCell>
                            <TableCell className="text-xs font-bold text-teal-700 dark:text-teal-400">{r.newBandwidth || "-"}</TableCell>
                            <TableCell className="text-xs font-medium">Rs. {parseFloat(r.newMonthlyBill || "0").toLocaleString()}</TableCell>
                            <TableCell className="text-xs">Rs. {parseFloat(r.proratedCharges || "0").toLocaleString()}</TableCell>
                            <TableCell className="text-xs">Rs. {parseFloat(r.adjustmentAmount || "0").toLocaleString()}</TableCell>
                            <TableCell className="text-xs">Rs. {parseFloat(r.taxImpact || "0").toLocaleString()}</TableCell>
                            <TableCell className={`text-xs font-bold ${parseFloat(r.finalBillDifference || "0") > 0 ? "text-red-600" : "text-green-600"}`}>Rs. {parseFloat(r.finalBillDifference || "0").toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${r.status === "approved" || r.status === "implemented" || r.status === "completed" ? "text-green-700 bg-green-50" : r.status === "rejected" ? "text-red-600 bg-red-50" : r.status === "pending" ? "text-amber-700 bg-amber-50" : "text-blue-700 bg-blue-50"}`}>
                                {r.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

              </div>
            )}

            {/* RECEIVED BILL HISTORY */}
            {activeTab === "received" && (
              <div className="space-y-4">
                <SectionHeader title="Received Bill History" />
                {!invoices?.filter((i: any) => i.status === "paid").length ? (<EmptyState icon={CreditCard} message="No received bill history found" />)
                : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-[#1a3a5c]">
                        <TableHead className="text-white text-xs">Invoice #</TableHead>
                        <TableHead className="text-white text-xs">Amount Paid</TableHead>
                        <TableHead className="text-white text-xs">Payment Date</TableHead>
                        <TableHead className="text-white text-xs">Status</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {invoices?.filter((i: any) => i.status === "paid").map((inv: any) => (
                          <TableRow key={inv.id}>
                            <TableCell className="text-xs font-mono">{inv.invoiceNumber}</TableCell>
                            <TableCell className="text-xs font-semibold">Rs. {Number(inv.totalAmount).toLocaleString()}</TableCell>
                            <TableCell className="text-xs">{formatDate(inv.paidDate)}</TableCell>
                            <TableCell><Badge variant="secondary" className="text-[10px] text-green-700 bg-green-50">Paid</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* COMPLAIN HISTORY */}
            {activeTab === "complain" && (
              <div className="space-y-4">
                <SectionHeader title="Complain History" />
                {ticketsLoading ? (<div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>)
                : !tickets?.length ? (<EmptyState icon={AlertCircle} message="No complaints found for this CIR customer" />)
                : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-[#1a3a5c]">
                        <TableHead className="text-white text-xs">Ticket #</TableHead>
                        <TableHead className="text-white text-xs">Subject</TableHead>
                        <TableHead className="text-white text-xs">Priority</TableHead>
                        <TableHead className="text-white text-xs">Status</TableHead>
                        <TableHead className="text-white text-xs">Category</TableHead>
                        <TableHead className="text-white text-xs">Created</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {tickets.map((t: any) => (
                          <TableRow key={t.id}>
                            <TableCell className="text-xs font-mono">{t.ticketNumber}</TableCell>
                            <TableCell className="text-xs">{t.subject}</TableCell>
                            <TableCell><Badge variant="secondary" className={`text-[10px] capitalize ${t.priority === "critical" ? "text-red-600 bg-red-50" : t.priority === "high" ? "text-orange-600 bg-orange-50" : t.priority === "medium" ? "text-amber-600 bg-amber-50" : "text-blue-600 bg-blue-50"}`}>{t.priority}</Badge></TableCell>
                            <TableCell><Badge variant="secondary" className={`text-[10px] capitalize ${t.status === "resolved" || t.status === "closed" ? "text-green-700 bg-green-50" : t.status === "in_progress" ? "text-amber-600 bg-amber-50" : "text-blue-600 bg-blue-50"}`}>{t.status.replace("_", " ")}</Badge></TableCell>
                            <TableCell className="text-xs capitalize">{t.category}</TableCell>
                            <TableCell className="text-xs">{formatDate(t.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* SMS MESSAGE HISTORY */}
            {activeTab === "sms" && (
              <div className="space-y-4">
                <SectionHeader title="SMS Message History" />
                <EmptyState icon={MessageSquare} message="No SMS message history available" />
              </div>
            )}

            {/* PRODUCT & SERVICE SALES INVOICES */}
            {activeTab === "sales" && (
              <div className="space-y-4">
                <SectionHeader title="Product & Service Sales Invoices" />
                <EmptyState icon={ShoppingBag} message="No product & service sales invoices found" />
              </div>
            )}

            {/* REFERRALS */}
            {activeTab === "referrals" && (
              <div className="space-y-4">
                <SectionHeader title="Referrals" />
                <EmptyState icon={Users} message="No referral records found for this CIR customer" />
              </div>
            )}

            {/* SERVICE SCHEDULER */}
            {activeTab === "service_scheduler" && (
              <div className="space-y-4">
                <SectionHeader title="Service Scheduler" action={
                  <Button size="sm" className="h-8 text-xs gap-1.5 bg-[#0057FF]" onClick={() => setSchedulerDialogOpen(true)} data-testid="button-cir-add-schedule">
                    <Plus className="h-3.5 w-3.5" /> Schedule Service
                  </Button>
                } />
                {(() => {
                  if (!serviceRequests || serviceRequests.length === 0)
                    return <EmptyState icon={CalendarRange} message="No scheduled service requests found" />;
                  return (
                    <div className="bg-card border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Request #</TableHead>
                            <TableHead className="text-xs">Service Type</TableHead>
                            <TableHead className="text-xs">Scheduled Date</TableHead>
                            <TableHead className="text-xs">Assigned To</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                            <TableHead className="text-xs">Priority</TableHead>
                            <TableHead className="text-xs">Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {serviceRequests.map((r: any) => (
                            <TableRow key={r.id}>
                              <TableCell className="text-xs font-medium">SR-{r.id}</TableCell>
                              <TableCell className="text-xs capitalize">{r.serviceType || r.requestType || "—"}</TableCell>
                              <TableCell className="text-xs">{formatDate(r.scheduledDate || r.requestDate)}</TableCell>
                              <TableCell className="text-xs">{r.assignedTo || "—"}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={`text-[10px] capitalize ${
                                  r.status === "completed" ? "text-green-700 bg-green-50" :
                                  r.status === "in_progress" ? "text-blue-700 bg-blue-50" :
                                  r.status === "cancelled" ? "text-red-700 bg-red-50" :
                                  "text-amber-600 bg-amber-50"
                                }`}>{r.status || "pending"}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-[10px] capitalize ${
                                  r.priority === "high" || r.priority === "urgent" ? "text-red-600 border-red-300" :
                                  r.priority === "medium" ? "text-amber-600 border-amber-300" :
                                  "text-green-600 border-green-300"
                                }`}>{r.priority || "normal"}</Badge>
                              </TableCell>
                              <TableCell className="text-xs max-w-[200px] truncate">{r.description || r.notes || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })()}
              </div>
            )}

          </div>
        </div>
      </div>

      {customer && (
        <CirEditDialog open={editOpen} onClose={() => setEditOpen(false)} customer={customer} id={id || ""} vendors={vendors || []} />
      )}

      <Dialog open={pcrDetailOpen} onOpenChange={setPcrDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#0057FF]" />
              Package Change Request — {selectedPcr?.requestNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedPcr && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Change Type</p>
                  <Badge variant="secondary" className={`text-xs capitalize mt-1 ${selectedPcr.changeType === "upgrade" ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>
                    {selectedPcr.changeType === "upgrade" ? <TrendingUp className="h-3 w-3 inline mr-1" /> : <TrendingDown className="h-3 w-3 inline mr-1" />}{selectedPcr.changeType}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Current Status</p>
                  <Badge variant="secondary" className={`text-xs capitalize mt-1 ${
                    selectedPcr.status === "completed" || selectedPcr.status === "approved" || selectedPcr.status === "implemented" ? "text-green-700 bg-green-50" :
                    selectedPcr.status === "implementing" ? "text-amber-600 bg-amber-50" :
                    selectedPcr.status === "rejected" ? "text-red-600 bg-red-50" :
                    selectedPcr.status === "pending" ? "text-yellow-700 bg-yellow-50" : "text-gray-600 bg-gray-100"
                  }`}>{selectedPcr.status}</Badge>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-[#1a3a5c] text-white text-xs font-semibold px-4 py-2">Package & Billing Details</div>
                <div className="divide-y text-xs">
                  <div className="grid grid-cols-2"><div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">Previous Package</span></div><div className="px-4 py-2.5 font-medium">{selectedPcr.currentPackageName || "—"}</div></div>
                  <div className="grid grid-cols-2"><div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">New Package</span></div><div className="px-4 py-2.5 font-bold text-teal-700 dark:text-teal-400">{selectedPcr.newPackageName || "—"}</div></div>
                  <div className="grid grid-cols-2"><div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">Previous Bandwidth</span></div><div className="px-4 py-2.5">{selectedPcr.currentBandwidth || "—"}</div></div>
                  <div className="grid grid-cols-2"><div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">New Bandwidth</span></div><div className="px-4 py-2.5 font-bold text-teal-700 dark:text-teal-400">{selectedPcr.newBandwidth || "—"}</div></div>
                  <div className="grid grid-cols-2"><div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">Previous Monthly Bill</span></div><div className="px-4 py-2.5">Rs. {parseFloat(selectedPcr.currentMonthlyBill || "0").toLocaleString()}</div></div>
                  <div className="grid grid-cols-2"><div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">New Price</span></div><div className="px-4 py-2.5 font-bold">Rs. {parseFloat(selectedPcr.newMonthlyBill || "0").toLocaleString()}</div></div>
                  <div className="grid grid-cols-2"><div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">Prorated Charges</span></div><div className="px-4 py-2.5">Rs. {parseFloat(selectedPcr.proratedCharges || "0").toLocaleString()}</div></div>
                  <div className="grid grid-cols-2"><div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">Adjustment</span></div><div className="px-4 py-2.5">Rs. {parseFloat(selectedPcr.adjustmentAmount || "0").toLocaleString()}</div></div>
                  <div className="grid grid-cols-2"><div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">Tax Impact</span></div><div className="px-4 py-2.5">Rs. {parseFloat(selectedPcr.taxImpact || "0").toLocaleString()}</div></div>
                  <div className="grid grid-cols-2"><div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">Final Difference</span></div><div className={`px-4 py-2.5 font-bold ${parseFloat(selectedPcr.finalBillDifference || "0") > 0 ? "text-red-600" : "text-green-600"}`}>Rs. {parseFloat(selectedPcr.finalBillDifference || "0").toLocaleString()}</div></div>
                  {selectedPcr.reason && <div className="grid grid-cols-2"><div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">Reason</span></div><div className="px-4 py-2.5">{selectedPcr.reason}</div></div>}
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-[#1a3a5c] text-white text-xs font-semibold px-4 py-2">Request Tracking Timeline</div>
                <div className="p-4 space-y-0">
                  <div className="relative pl-8 pb-6 border-l-2 border-blue-200 dark:border-blue-800 ml-3">
                    <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center"><Plus className="h-3 w-3 text-white" /></div>
                    <div className="pt-0.5">
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-400">New Request Submitted</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{selectedPcr.createdAt ? new Date(selectedPcr.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
                      <p className="text-xs mt-1">Requested by: <span className="font-medium">{selectedPcr.requestedBy || "—"}</span></p>
                      {selectedPcr.isUrgent && <Badge variant="secondary" className="text-[10px] mt-1 text-red-600 bg-red-50">Urgent</Badge>}
                    </div>
                  </div>
                  {(selectedPcr.status === "approved" || selectedPcr.status === "implementing" || selectedPcr.status === "implemented" || selectedPcr.status === "completed") && (
                    <div className="relative pl-8 pb-6 border-l-2 border-green-200 dark:border-green-800 ml-3">
                      <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"><Shield className="h-3 w-3 text-white" /></div>
                      <div className="pt-0.5">
                        <p className="text-xs font-bold text-green-700 dark:text-green-400">Approved</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{selectedPcr.approvedAt ? new Date(selectedPcr.approvedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
                        <p className="text-xs mt-1">Approved by: <span className="font-medium">{selectedPcr.approvedBy || "—"}</span></p>
                      </div>
                    </div>
                  )}
                  {selectedPcr.status === "rejected" && (
                    <div className="relative pl-8 pb-6 border-l-2 border-red-200 dark:border-red-800 ml-3">
                      <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"><AlertCircle className="h-3 w-3 text-white" /></div>
                      <div className="pt-0.5">
                        <p className="text-xs font-bold text-red-700 dark:text-red-400">Rejected</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{selectedPcr.rejectedAt ? new Date(selectedPcr.rejectedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
                        <p className="text-xs mt-1">Rejected by: <span className="font-medium">{selectedPcr.rejectedBy || "—"}</span></p>
                        {selectedPcr.rejectionReason && <p className="text-xs mt-1 text-red-600">Reason: {selectedPcr.rejectionReason}</p>}
                      </div>
                    </div>
                  )}
                  {(selectedPcr.status === "implementing" || selectedPcr.status === "implemented" || selectedPcr.status === "completed") && (
                    <div className="relative pl-8 pb-6 border-l-2 border-amber-200 dark:border-amber-800 ml-3">
                      <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center"><Settings className="h-3 w-3 text-white" /></div>
                      <div className="pt-0.5">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Implementation</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{selectedPcr.implementedAt ? new Date(selectedPcr.implementedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "In progress..."}</p>
                        <p className="text-xs mt-1">Implemented by: <span className="font-medium">{selectedPcr.implementedBy || "—"}</span></p>
                        {selectedPcr.implementationNotes && <p className="text-xs mt-1">Notes: {selectedPcr.implementationNotes}</p>}
                        {selectedPcr.networkSyncStatus && <p className="text-xs mt-1">Network Sync: <Badge variant="secondary" className="text-[10px] capitalize">{selectedPcr.networkSyncStatus}</Badge></p>}
                        {selectedPcr.billingUpdated !== undefined && <p className="text-xs mt-1">Billing Updated: <span className="font-medium">{selectedPcr.billingUpdated ? "Yes" : "No"}</span></p>}
                      </div>
                    </div>
                  )}
                  {(selectedPcr.status === "implemented" || selectedPcr.status === "completed") && (
                    <div className="relative pl-8 pb-2 ml-3">
                      <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center"><Shield className="h-3 w-3 text-white" /></div>
                      <div className="pt-0.5">
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Completed</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{selectedPcr.updatedAt ? new Date(selectedPcr.updatedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
                        <p className="text-xs mt-1">Package change is now active and billing has been updated.</p>
                      </div>
                    </div>
                  )}
                  {selectedPcr.status === "pending" && (
                    <div className="relative pl-8 pb-2 ml-3">
                      <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"><Clock className="h-3 w-3 text-white" /></div>
                      <div className="pt-0.5">
                        <p className="text-xs font-medium text-muted-foreground">Awaiting Approval...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {selectedPcr.effectiveDate && (
                <div className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Effective Date:</span>
                  <span>{new Date(selectedPcr.effectiveDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  {selectedPcr.effectiveDateType && <Badge variant="secondary" className="text-[10px] capitalize">{selectedPcr.effectiveDateType}</Badge>}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPcrDetailOpen(false)} data-testid="button-close-pcr-detail">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={schedulerDialogOpen} onOpenChange={setSchedulerDialogOpen}>
        <DialogContent className="max-w-[550px]" data-testid="dialog-cir-schedule-service">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CalendarRange className="h-5 w-5 text-[#0057FF]" /> Schedule Service Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Service Type</span>
              <Select value={schedulerType} onValueChange={setSchedulerType}>
                <SelectTrigger data-testid="select-cir-scheduler-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="installation">New Installation</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="upgrade">Bandwidth Upgrade</SelectItem>
                  <SelectItem value="downgrade">Bandwidth Downgrade</SelectItem>
                  <SelectItem value="relocation">Relocation</SelectItem>
                  <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                  <SelectItem value="disconnection">Disconnection</SelectItem>
                  <SelectItem value="reconnection">Reconnection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">Scheduled Date</span>
                <Input type="date" value={schedulerDate} onChange={e => setSchedulerDate(e.target.value)} data-testid="input-cir-scheduler-date" />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Scheduled Time</span>
                <Input type="time" value={schedulerTime} onChange={e => setSchedulerTime(e.target.value)} data-testid="input-cir-scheduler-time" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">Assign To</span>
                <Input value={schedulerAssignee} onChange={e => setSchedulerAssignee(e.target.value)} placeholder="Technician name..." data-testid="input-cir-scheduler-assignee" />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Priority</span>
                <Select value={schedulerPriority} onValueChange={setSchedulerPriority}>
                  <SelectTrigger data-testid="select-cir-scheduler-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Notes</span>
              <Textarea value={schedulerNotes} onChange={e => setSchedulerNotes(e.target.value)} placeholder="Add service request notes..." className="min-h-[80px]" data-testid="textarea-cir-scheduler-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSchedulerDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#0057FF]" disabled={scheduleServiceMutation.isPending || !schedulerDate}
              onClick={() => scheduleServiceMutation.mutate({ serviceType: schedulerType, scheduledDate: `${schedulerDate}T${schedulerTime}`, assignedTo: schedulerAssignee, priority: schedulerPriority, notes: schedulerNotes, status: "pending" })}
              data-testid="button-cir-confirm-schedule">
              {scheduleServiceMutation.isPending ? "Scheduling..." : "Schedule Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={smsProfileDialogOpen} onOpenChange={setSmsProfileDialogOpen}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="dialog-cir-profile-send-message">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-[#0057FF]" /> Send Notification</DialogTitle>
          </DialogHeader>
          {customer && (
            <div className="space-y-5">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0057FF] flex items-center justify-center text-white font-bold text-sm">
                    {(customer.companyName || customer.customerId || "C").charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{customer.companyName || customer.customerId}</p>
                    <p className="text-xs text-muted-foreground">{customer.customerId} • {customer.phone || "No phone"} • {customer.email || "No email"}</p>
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
                    <button
                      key={ch.value}
                      type="button"
                      onClick={() => setSmsProfileChannel(ch.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                        smsProfileChannel === ch.value
                          ? `${ch.color} ring-2 ring-offset-1 ring-current font-semibold`
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                      data-testid={`btn-cir-profile-channel-${ch.value}`}
                    >
                      <ch.icon className="h-5 w-5" />
                      <span className="text-xs">{ch.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Message Category</span>
                <Select value={smsProfileCategory} onValueChange={handleProfileCategoryChange}>
                  <SelectTrigger data-testid="select-cir-profile-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {smsCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(smsProfileChannel === "email" || smsProfileChannel === "in_app") && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Subject</span>
                  <Input value={smsProfileSubject} onChange={e => setSmsProfileSubject(e.target.value)} placeholder="Enter subject..." data-testid="input-cir-profile-subject" />
                </div>
              )}

              <div className="space-y-2">
                <span className="text-sm font-medium">Message</span>
                <Textarea value={smsProfileMessage} onChange={e => setSmsProfileMessage(e.target.value)} placeholder="Type your message..." className="min-h-[120px]" data-testid="textarea-cir-profile-message" />
              </div>

              {smsProfileChannel === "sms" && !customer.phone && !customer.mobileNo2 && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" /> Customer has no phone number
                </div>
              )}
              {smsProfileChannel === "email" && !customer.email && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" /> Customer has no email address
                </div>
              )}
              {smsProfileChannel === "whatsapp" && !customer.phone && !customer.mobileNo2 && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" /> Customer has no phone or mobile number
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSmsProfileDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#0057FF]"
              disabled={
                sendProfileNotificationMutation.isPending || !smsProfileMessage.trim() ||
                (smsProfileChannel === "email" && (!smsProfileSubject.trim() || !customer?.email)) ||
                (smsProfileChannel === "sms" && !customer?.phone && !customer?.mobileNo2) ||
                (smsProfileChannel === "whatsapp" && !customer?.phone && !customer?.mobileNo2) ||
                (smsProfileChannel === "in_app" && !smsProfileSubject.trim())
              }
              onClick={() => sendProfileNotificationMutation.mutate({ channel: smsProfileChannel, subject: smsProfileSubject, message: smsProfileMessage, category: smsProfileCategory })}
              data-testid="button-cir-profile-send">
              {sendProfileNotificationMutation.isPending ? "Sending..." : (
                <>
                  <Send className="h-4 w-4 mr-1.5" />
                  {smsProfileChannel === "email" ? "Send Email" : smsProfileChannel === "sms" ? "Send SMS" : smsProfileChannel === "whatsapp" ? "Send WhatsApp" : "Send Notification"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
