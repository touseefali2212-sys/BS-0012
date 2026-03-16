import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, Wifi, Building2, DollarSign,
  AlertTriangle, Shield, Calendar, Activity, Server, Globe, ChevronDown, ChevronUp,
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

export default function CirCustomersPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CirCustomer | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formSection, setFormSection] = useState(0);

  const { data: cirCustomers, isLoading } = useQuery<CirCustomer[]>({ queryKey: ["/api/cir-customers"] });
  const { data: vendors } = useQuery<any[]>({ queryKey: ["/api/vendors"] });

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

  const createMutation = useMutation({
    mutationFn: async (data: InsertCirCustomer) => { const r = await apiRequest("POST", "/api/cir-customers", data); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cir-customers"] }); setDialogOpen(false); form.reset(); toast({ title: "CIR customer created" }); },
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

  const openEdit = (c: CirCustomer) => {
    setEditing(c); setFormSection(0);
    form.reset({ ...c, vendorId: c.vendorId ?? undefined });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertCirCustomer) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
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
              <DialogFooter className="flex justify-between">
                <div className="flex gap-2">
                  {formSection > 0 && <Button type="button" variant="outline" onClick={() => setFormSection(s => s - 1)}>Previous</Button>}
                  {formSection < 5 && <Button type="button" variant="outline" onClick={() => setFormSection(s => s + 1)}>Next</Button>}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-cir-submit" className="bg-gradient-to-r from-[#002B5B] to-[#005EFF]">
                    {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editing ? "Update" : "Create"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
