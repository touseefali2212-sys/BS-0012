import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, Wifi, Building2, DollarSign,
  AlertTriangle, Shield, Calendar, Activity, Server, Globe, ChevronDown, ChevronUp, Users,
  FileSpreadsheet, Send, CheckCircle2, XCircle, Loader2, SkipForward, Sparkles,
  ArrowRight, RefreshCw, Check, Zap,
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
  { key: "invoice", label: "Auto Invoice Generation", icon: FileSpreadsheet, description: "Generating first invoice for this CIR customer" },
  { key: "notification_customer", label: "Account Manager Notification", icon: Send, description: "Notifying account manager of new CIR client" },
];

export default function CirCustomersPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CirCustomer | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formSection, setFormSection] = useState(0);

  const [referralsDialogOpen, setReferralsDialogOpen] = useState(false);
  const [viewingReferralsCir, setViewingReferralsCir] = useState<CirCustomer | null>(null);

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
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (c.companyName || "").toLowerCase().includes(q) || (c.contactPerson || "").toLowerCase().includes(q) || (c.staticIp || "").toLowerCase().includes(q);
    });

  const totalActive = (cirCustomers || []).filter(c => c.status === "active").length;
  const totalBandwidth = (cirCustomers || []).filter(c => c.status === "active").reduce((sum, c) => sum + (parseFloat(c.committedBandwidth || "0") || 0), 0);
  const totalRevenue = (cirCustomers || []).filter(c => c.status === "active").reduce((sum, c) => sum + (parseFloat(c.monthlyCharges || "0") || 0), 0);
  const suspended = (cirCustomers || []).filter(c => c.status === "suspended").length;
  const expiring = (cirCustomers || []).filter(c => {
    if (!c.contractEndDate) return false;
    const days = Math.ceil((new Date(c.contractEndDate).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 30;
  }).length;

  const sections = ["Company Info", "Bandwidth", "IP Config", "Contract & SLA", "Billing", "Monitoring"];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#002B5B] to-[#005EFF] bg-clip-text text-transparent" data-testid="text-cir-title">CIR Customers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Committed Information Rate — Dedicated Bandwidth Clients</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total CIR Customers</p>
            <p className="text-2xl font-bold" data-testid="text-cir-total">{(cirCustomers || []).length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active Bandwidth</p>
            <p className="text-2xl font-bold text-teal-600" data-testid="text-cir-bandwidth">{totalBandwidth >= 1000 ? `${(totalBandwidth / 1000).toFixed(1)} Gbps` : `${totalBandwidth} Mbps`}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            <p className="text-2xl font-bold text-green-600" data-testid="text-cir-revenue">Rs. {totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Suspended</p>
            <p className="text-2xl font-bold text-red-600" data-testid="text-cir-suspended">{suspended}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Expiring Contracts</p>
            <p className="text-2xl font-bold text-orange-600" data-testid="text-cir-expiring">{expiring}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search company, contact, IP..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-[250px] h-9" data-testid="input-cir-search" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9" data-testid="select-cir-status-filter"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate} data-testid="button-add-cir" className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] hover:from-[#001f42] hover:to-[#0044cc]">
          <Plus className="h-4 w-4 mr-1" />Add CIR Customer
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2"><Wifi className="h-5 w-5 text-blue-600" />CIR Customer Management</CardTitle>
        </CardHeader>
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
                    <TableHead className="text-white">Company</TableHead>
                    <TableHead className="text-white">Bandwidth</TableHead>
                    <TableHead className="text-white">Vendor</TableHead>
                    <TableHead className="text-white">Static IP</TableHead>
                    <TableHead className="text-white">Monthly Charges</TableHead>
                    <TableHead className="text-white">Contract Expiry</TableHead>
                    <TableHead className="text-white">SLA</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c, idx) => {
                    const vendor = (vendors || []).find(v => v.id === c.vendorId);
                    const daysLeft = c.contractEndDate ? Math.ceil((new Date(c.contractEndDate).getTime() - Date.now()) / 86400000) : null;
                    return (
                      <TableRow key={c.id} data-testid={`row-cir-${c.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                        <TableCell>
                          <div>
                            <span className="font-semibold" data-testid={`text-cir-name-${c.id}`}>{c.companyName}</span>
                            {c.contactPerson && <p className="text-xs text-muted-foreground">{c.contactPerson}</p>}
                            {cirReferralCount(c.id) > 0 && (
                              <button
                                onClick={() => { setViewingReferralsCir(c); setReferralsDialogOpen(true); }}
                                className="mt-0.5 flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                                data-testid={`button-cir-referrals-${c.id}`}
                              >
                                <Users className="h-3 w-3" />
                                {cirReferralCount(c.id)} referral{cirReferralCount(c.id) !== 1 ? "s" : ""}
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Wifi className="h-3.5 w-3.5 text-teal-600" />
                            <span className="font-medium text-teal-700 dark:text-teal-400">{c.committedBandwidth || "—"}</span>
                          </div>
                          {c.burstBandwidth && <p className="text-[10px] text-muted-foreground">Burst: {c.burstBandwidth}</p>}
                        </TableCell>
                        <TableCell><span className="text-sm">{vendor?.name || "—"}</span></TableCell>
                        <TableCell><code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{c.staticIp || "—"}</code></TableCell>
                        <TableCell><span className="text-sm font-semibold text-right block">Rs. {parseFloat(c.monthlyCharges || "0").toLocaleString()}</span></TableCell>
                        <TableCell>
                          {c.contractEndDate ? (
                            <div>
                              <span className="text-xs">{c.contractEndDate}</span>
                              {daysLeft !== null && daysLeft <= 30 && daysLeft >= 0 && (
                                <Badge variant="secondary" className="no-default-active-elevate ml-1 text-[9px] text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-950">{daysLeft}d left</Badge>
                              )}
                            </div>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell><span className="text-sm font-medium">{c.slaLevel ? `${c.slaLevel}%` : "—"}</span></TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[c.status] || ""}`}>{c.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-cir-actions-${c.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(c)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
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
                    {step?.data?.invoiceNumber && status === "success" && (
                      <span className="mt-1 inline-block text-[10px] bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded px-2 py-0.5 text-green-700 dark:text-green-300 font-mono">{step.data.invoiceNumber}</span>
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
    </div>
  );
}
