import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, Wifi, Edit, Save,
  ChevronRight, Shield, Network, Activity, DollarSign, AlertCircle, RefreshCw,
  CheckCircle, XCircle, FileText, Globe, User, Hash, CreditCard, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCirCustomerSchema, type CirCustomer, type InsertCirCustomer } from "@shared/schema";

const statusColors: Record<string, string> = {
  active: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950",
  suspended: "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950",
  pending: "text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-950",
  expired: "text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col px-4 py-2.5 border-b last:border-b-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || <span className="text-muted-foreground/60">—</span>}</span>
    </div>
  );
}

function SectionHeader({ title, onEdit, editing }: { title: string; onEdit?: () => void; editing?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      {onEdit && (
        <Button variant="outline" size="sm" onClick={onEdit} className="h-7 text-xs gap-1.5">
          {editing ? <><XCircle className="h-3.5 w-3.5" />Cancel</> : <><Edit className="h-3.5 w-3.5" />Edit Section</>}
        </Button>
      )}
    </div>
  );
}

function BoolBadge({ value, trueLabel = "Yes", falseLabel = "No" }: { value: boolean | null | undefined; trueLabel?: string; falseLabel?: string }) {
  return value ? (
    <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">{trueLabel}</Badge>
  ) : (
    <span className="text-sm text-muted-foreground">{falseLabel}</span>
  );
}

export default function CirCustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("company");
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const { data: customer, isLoading } = useQuery<CirCustomer>({
    queryKey: ["/api/cir-customers", id],
    queryFn: async () => {
      const res = await fetch(`/api/cir-customers/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: vendors } = useQuery<any[]>({ queryKey: ["/api/vendors"] });

  const form = useForm<InsertCirCustomer>({
    resolver: zodResolver(insertCirCustomerSchema),
    defaultValues: {},
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertCirCustomer>) => {
      const res = await apiRequest("PATCH", `/api/cir-customers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cir-customers", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/cir-customers"] });
      setEditingSection(null);
      toast({ title: "Customer updated successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEdit = (section: string) => {
    if (!customer) return;
    form.reset({ ...customer, vendorId: customer.vendorId ?? undefined } as any);
    setEditingSection(section);
  };

  const cancelEdit = () => setEditingSection(null);

  const saveSection = () => {
    form.handleSubmit((data) => updateMutation.mutate(data))();
  };

  const vendor = vendors?.find(v => v.id === customer?.vendorId);
  const daysLeft = customer?.contractEndDate
    ? Math.ceil((new Date(customer.contractEndDate).getTime() - Date.now()) / 86400000)
    : null;

  const tabs = [
    { key: "company", label: "Company Info" },
    { key: "bandwidth", label: "Bandwidth" },
    { key: "ip", label: "IP Config" },
    { key: "contract", label: "Contract & SLA" },
    { key: "billing", label: "Billing" },
    { key: "monitoring", label: "Monitoring" },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-6">
          <Skeleton className="h-[600px] w-[260px] shrink-0" />
          <Skeleton className="h-[600px] flex-1" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 space-y-4">
        <Link href="/cir-customers">
          <Button variant="ghost"><ArrowLeft className="h-4 w-4 mr-1" />Back to CIR Customers</Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">CIR Customer not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Top breadcrumb bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-[#0057FF]" />
          <h1 className="text-lg font-bold">CIR Profile</h1>
          <span className="text-xs text-muted-foreground">Dedicated Bandwidth Client</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/cir-customers" className="text-[#0057FF]">CIR Customers</Link>
          <ChevronRight className="h-3 w-3" />
          <span>{customer.companyName}</span>
        </div>
      </div>

      <div className="flex gap-0 min-h-[calc(100vh-120px)]">
        {/* Left Sidebar */}
        <div className="w-[260px] shrink-0 border-r bg-gradient-to-b from-[#1a2332] to-[#243447] text-white flex flex-col">
          <div className="flex flex-col items-center pt-6 pb-4 px-4">
            <div className="w-24 h-24 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center mb-3">
              <Building2 className="h-12 w-12 text-white/50" />
            </div>
            <h2 className="text-base font-bold text-center leading-tight" data-testid="text-cir-profile-name">{customer.companyName}</h2>
            <p className="text-xs opacity-70 mt-0.5">{customer.contactPerson || "CIR Client"}</p>
            <Badge variant="secondary" className={`mt-2 capitalize text-[10px] ${statusColors[customer.status] || ""}`} data-testid="badge-cir-status">
              {customer.status}
            </Badge>
          </div>

          <div className="px-4 space-y-2.5 text-xs border-t border-white/10 pt-4">
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <div className="flex items-center gap-2"><Wifi className="h-3.5 w-3.5 opacity-60" /><span className="opacity-80">Committed BW</span></div>
              <span className="font-semibold text-teal-300">{customer.committedBandwidth || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <div className="flex items-center gap-2"><DollarSign className="h-3.5 w-3.5 opacity-60" /><span className="opacity-80">Monthly</span></div>
              <span className="font-semibold text-green-300">Rs. {parseFloat(customer.monthlyCharges || "0").toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 opacity-60" /><span className="opacity-80">SLA</span></div>
              <span className="font-semibold">{customer.slaLevel ? `${customer.slaLevel}%` : "—"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 opacity-60" /><span className="opacity-80">Contract End</span></div>
              <span className={`font-semibold text-xs ${daysLeft !== null && daysLeft <= 30 && daysLeft >= 0 ? "text-orange-300" : ""}`}>
                {customer.contractEndDate || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <div className="flex items-center gap-2"><Network className="h-3.5 w-3.5 opacity-60" /><span className="opacity-80">Static IP</span></div>
              <span className="font-mono text-xs text-blue-300">{customer.staticIp || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 opacity-60" /><span className="opacity-80">Vendor</span></div>
              <span className="text-xs">{vendor?.name || "—"}</span>
            </div>
          </div>

          <div className="px-4 pt-4 pb-4 mt-auto space-y-2">
            <Button size="sm" variant="secondary" className="w-full text-[11px] h-8 gap-1.5" onClick={() => { openEdit("company"); setActiveTab("company"); }} data-testid="button-cir-edit-profile">
              <Edit className="h-3.5 w-3.5" />Update Information
            </Button>
            <Link href="/cir-customers">
              <Button size="sm" variant="outline" className="w-full text-[11px] h-8 gap-1.5 text-white border-white/30" data-testid="button-cir-back-list">
                <ArrowLeft className="h-3.5 w-3.5" />Back to CIR List
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-muted/30 overflow-hidden">
          {/* Tab Bar */}
          <div className="border-b bg-card">
            <div className="flex flex-wrap px-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setEditingSection(null); }}
                  className={`px-4 py-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key ? "border-[#0057FF] text-[#0057FF]" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`tab-cir-${tab.key}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 overflow-y-auto max-h-[calc(100vh-170px)] space-y-5">

            {/* COMPANY INFO TAB */}
            {activeTab === "company" && (
              <div className="space-y-4" data-testid="tab-content-company">
                <SectionHeader title="Company Information" onEdit={() => editingSection === "company" ? cancelEdit() : openEdit("company")} editing={editingSection === "company"} />
                {editingSection === "company" ? (
                  <Form {...form}>
                    <div className="space-y-4 bg-card border rounded-lg p-4">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Section A — Company Information</p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="cnic" render={({ field }) => (<FormItem><FormLabel>CNIC</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="ntn" render={({ field }) => (<FormItem><FormLabel>NTN</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="mobileNo2" render={({ field }) => (<FormItem><FormLabel>Mobile No. 2</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="branch" render={({ field }) => (<FormItem><FormLabel>Branch</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>Cancel</Button>
                        <Button type="button" size="sm" disabled={updateMutation.isPending} onClick={saveSection} className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] text-white">
                          {updateMutation.isPending ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</> : <><Save className="h-3.5 w-3.5 mr-1.5" />Save Changes</>}
                        </Button>
                      </div>
                    </div>
                  </Form>
                ) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-y">
                      <InfoRow label="Company Name" value={customer.companyName} />
                      <InfoRow label="Contact Person" value={customer.contactPerson} />
                      <InfoRow label="CNIC" value={<span className="font-mono">{customer.cnic}</span>} />
                      <InfoRow label="NTN" value={<span className="font-mono">{customer.ntn}</span>} />
                      <InfoRow label="Email" value={customer.email} />
                      <InfoRow label="Phone" value={customer.phone} />
                      <InfoRow label="Mobile No. 2" value={customer.mobileNo2} />
                      <InfoRow label="Branch" value={customer.branch} />
                      <InfoRow label="City" value={customer.city} />
                      <InfoRow label="Address" value={customer.address} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BANDWIDTH TAB */}
            {activeTab === "bandwidth" && (
              <div className="space-y-4" data-testid="tab-content-bandwidth">
                <SectionHeader title="Bandwidth Configuration" onEdit={() => editingSection === "bandwidth" ? cancelEdit() : openEdit("bandwidth")} editing={editingSection === "bandwidth"} />
                {editingSection === "bandwidth" ? (
                  <Form {...form}>
                    <div className="space-y-4 bg-card border rounded-lg p-4">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Section B — Bandwidth Configuration</p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="vendorId" render={({ field }) => (
                          <FormItem><FormLabel>Vendor</FormLabel>
                            <Select onValueChange={v => field.onChange(v ? parseInt(v) : null)} value={field.value?.toString() || ""}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger></FormControl>
                              <SelectContent>{(vendors || []).map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}</SelectContent>
                            </Select><FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="vendorPort" render={({ field }) => (<FormItem><FormLabel>Vendor Port</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="serviceType" render={({ field }) => (<FormItem><FormLabel>Service Type</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="linkType" render={({ field }) => (<FormItem><FormLabel>Link Type</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="uplinkPort" render={({ field }) => (<FormItem><FormLabel>Uplink Port</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="media" render={({ field }) => (<FormItem><FormLabel>Media</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="committedBandwidth" render={({ field }) => (<FormItem><FormLabel>Committed Bandwidth</FormLabel><FormControl><Input placeholder="e.g., 20 Mbps" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
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
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>Cancel</Button>
                        <Button type="button" size="sm" disabled={updateMutation.isPending} onClick={saveSection} className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] text-white">
                          {updateMutation.isPending ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</> : <><Save className="h-3.5 w-3.5 mr-1.5" />Save Changes</>}
                        </Button>
                      </div>
                    </div>
                  </Form>
                ) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-y">
                      <InfoRow label="Vendor" value={vendor?.name} />
                      <InfoRow label="Vendor Port" value={customer.vendorPort} />
                      <InfoRow label="Service Type" value={customer.serviceType} />
                      <InfoRow label="Link Type" value={customer.linkType} />
                      <InfoRow label="Uplink Port" value={customer.uplinkPort} />
                      <InfoRow label="Media" value={customer.media} />
                      <InfoRow label="Committed Bandwidth" value={<span className="font-bold text-teal-700 dark:text-teal-400">{customer.committedBandwidth}</span>} />
                      <InfoRow label="Burst Bandwidth" value={customer.burstBandwidth} />
                      <InfoRow label="Upload Speed" value={customer.uploadSpeed} />
                      <InfoRow label="Download Speed" value={customer.downloadSpeed} />
                      <InfoRow label="Contention Ratio" value={customer.contentionRatio} />
                      <InfoRow label="VLAN ID" value={<span className="font-mono">{customer.vlanId}</span>} />
                      <InfoRow label="ONU / Device" value={customer.onuDevice} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* IP CONFIG TAB */}
            {activeTab === "ip" && (
              <div className="space-y-4" data-testid="tab-content-ip">
                <SectionHeader title="IP Configuration" onEdit={() => editingSection === "ip" ? cancelEdit() : openEdit("ip")} editing={editingSection === "ip"} />
                {editingSection === "ip" ? (
                  <Form {...form}>
                    <div className="space-y-4 bg-card border rounded-lg p-4">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Section C — IP Configuration</p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="staticIp" render={({ field }) => (<FormItem><FormLabel>Static IP</FormLabel><FormControl><Input placeholder="203.0.113.10" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="subnetMask" render={({ field }) => (<FormItem><FormLabel>Subnet Mask</FormLabel><FormControl><Input placeholder="255.255.255.0" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="gateway" render={({ field }) => (<FormItem><FormLabel>Gateway</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="dns" render={({ field }) => (<FormItem><FormLabel>Primary DNS</FormLabel><FormControl><Input placeholder="8.8.8.8" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="dns2" render={({ field }) => (<FormItem><FormLabel>Secondary DNS</FormLabel><FormControl><Input placeholder="8.8.4.4" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="publicIpBlock" render={({ field }) => (<FormItem><FormLabel>Public IP Block</FormLabel><FormControl><Input placeholder="/29 block" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>Cancel</Button>
                        <Button type="button" size="sm" disabled={updateMutation.isPending} onClick={saveSection} className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] text-white">
                          {updateMutation.isPending ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</> : <><Save className="h-3.5 w-3.5 mr-1.5" />Save Changes</>}
                        </Button>
                      </div>
                    </div>
                  </Form>
                ) : (
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
                )}
              </div>
            )}

            {/* CONTRACT & SLA TAB */}
            {activeTab === "contract" && (
              <div className="space-y-4" data-testid="tab-content-contract">
                <SectionHeader title="Contract & SLA" onEdit={() => editingSection === "contract" ? cancelEdit() : openEdit("contract")} editing={editingSection === "contract"} />
                {editingSection === "contract" ? (
                  <Form {...form}>
                    <div className="space-y-4 bg-card border rounded-lg p-4">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Section D — Contract & SLA</p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="contractStartDate" render={({ field }) => (<FormItem><FormLabel>Contract Start</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="contractEndDate" render={({ field }) => (<FormItem><FormLabel>Contract End</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="contractDuration" render={({ field }) => (<FormItem><FormLabel>Contract Duration</FormLabel><FormControl><Input placeholder="e.g., 12 months" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="slaLevel" render={({ field }) => (<FormItem><FormLabel>SLA Level (%)</FormLabel><FormControl><Input placeholder="99.5" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="accountManager" render={({ field }) => (<FormItem><FormLabel>Account Manager</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="dedicatedAccountManager" render={({ field }) => (<FormItem><FormLabel>Dedicated Account Manager</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <FormField control={form.control} name="autoRenewal" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Auto Renewal</FormLabel></FormItem>)} />
                      <FormField control={form.control} name="slaPenaltyClause" render={({ field }) => (<FormItem><FormLabel>SLA Penalty Clause</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="customSla" render={({ field }) => (<FormItem><FormLabel>Custom SLA Terms</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="customPricingAgreement" render={({ field }) => (<FormItem><FormLabel>Custom Pricing Agreement</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>Cancel</Button>
                        <Button type="button" size="sm" disabled={updateMutation.isPending} onClick={saveSection} className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] text-white">
                          {updateMutation.isPending ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</> : <><Save className="h-3.5 w-3.5 mr-1.5" />Save Changes</>}
                        </Button>
                      </div>
                    </div>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-card border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-2 divide-x divide-y">
                        <InfoRow label="Contract Start" value={customer.contractStartDate} />
                        <InfoRow label="Contract End" value={
                          <span className={daysLeft !== null && daysLeft <= 30 && daysLeft >= 0 ? "text-orange-600 font-semibold" : ""}>
                            {customer.contractEndDate || "—"}{daysLeft !== null && daysLeft <= 30 && daysLeft >= 0 ? ` (${daysLeft}d left)` : ""}
                          </span>
                        } />
                        <InfoRow label="Contract Duration" value={customer.contractDuration} />
                        <InfoRow label="SLA Level" value={customer.slaLevel ? <span className="font-bold text-orange-700 dark:text-orange-400">{customer.slaLevel}%</span> : null} />
                        <InfoRow label="Account Manager" value={customer.accountManager} />
                        <InfoRow label="Dedicated Account Manager" value={customer.dedicatedAccountManager} />
                        <InfoRow label="Auto Renewal" value={<BoolBadge value={customer.autoRenewal} trueLabel="Enabled" falseLabel="Disabled" />} />
                      </div>
                    </div>
                    {customer.slaPenaltyClause && (
                      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">SLA Penalty Clause</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{customer.slaPenaltyClause}</p></CardContent></Card>
                    )}
                    {customer.customSla && (
                      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Custom SLA Terms</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{customer.customSla}</p></CardContent></Card>
                    )}
                    {customer.customPricingAgreement && (
                      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Custom Pricing Agreement</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{customer.customPricingAgreement}</p></CardContent></Card>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* BILLING TAB */}
            {activeTab === "billing" && (
              <div className="space-y-4" data-testid="tab-content-billing">
                <SectionHeader title="Billing Configuration" onEdit={() => editingSection === "billing" ? cancelEdit() : openEdit("billing")} editing={editingSection === "billing"} />
                {editingSection === "billing" ? (
                  <Form {...form}>
                    <div className="space-y-4 bg-card border rounded-lg p-4">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Section E — Billing Configuration</p>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField control={form.control} name="monthlyCharges" render={({ field }) => (<FormItem><FormLabel>Monthly Charges</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="installationCharges" render={({ field }) => (<FormItem><FormLabel>Installation Charges</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="securityDeposit" render={({ field }) => (<FormItem><FormLabel>Security Deposit</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="billingCycle" render={({ field }) => (
                          <FormItem><FormLabel>Billing Cycle</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "monthly"}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent>
                            </Select><FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="invoiceType" render={({ field }) => (
                          <FormItem><FormLabel>Invoice Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "tax"}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent><SelectItem value="tax">Tax Invoice</SelectItem><SelectItem value="non_tax">Non-Tax</SelectItem></SelectContent>
                            </Select><FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="paymentTerms" render={({ field }) => (<FormItem><FormLabel>Payment Terms</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="creditLimit" render={({ field }) => (<FormItem><FormLabel>Credit Limit</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="centralizedBilling" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Centralized Billing</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="perBranchBilling" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Per-Branch Billing</FormLabel></FormItem>)} />
                      </div>
                      <FormField control={form.control} name="lateFeePolicy" render={({ field }) => (<FormItem><FormLabel>Late Fee Policy</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "active"}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="expired">Expired</SelectItem></SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>Cancel</Button>
                        <Button type="button" size="sm" disabled={updateMutation.isPending} onClick={saveSection} className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] text-white">
                          {updateMutation.isPending ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</> : <><Save className="h-3.5 w-3.5 mr-1.5" />Save Changes</>}
                        </Button>
                      </div>
                    </div>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-card border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-2 divide-x divide-y">
                        <InfoRow label="Monthly Charges" value={<span className="font-bold text-green-700 dark:text-green-400">Rs. {parseFloat(customer.monthlyCharges || "0").toLocaleString()}</span>} />
                        <InfoRow label="Installation Charges" value={`Rs. ${parseFloat(customer.installationCharges || "0").toLocaleString()}`} />
                        <InfoRow label="Security Deposit" value={`Rs. ${parseFloat(customer.securityDeposit || "0").toLocaleString()}`} />
                        <InfoRow label="Credit Limit" value={`Rs. ${parseFloat(customer.creditLimit || "0").toLocaleString()}`} />
                        <InfoRow label="Billing Cycle" value={<span className="capitalize">{customer.billingCycle}</span>} />
                        <InfoRow label="Invoice Type" value={customer.invoiceType === "tax" ? "Tax Invoice" : "Non-Tax"} />
                        <InfoRow label="Payment Terms" value={customer.paymentTerms} />
                        <InfoRow label="Late Fee Policy" value={customer.lateFeePolicy} />
                        <InfoRow label="Centralized Billing" value={<BoolBadge value={customer.centralizedBilling} />} />
                        <InfoRow label="Per-Branch Billing" value={<BoolBadge value={customer.perBranchBilling} />} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MONITORING TAB */}
            {activeTab === "monitoring" && (
              <div className="space-y-4" data-testid="tab-content-monitoring">
                <SectionHeader title="Monitoring & Radius" onEdit={() => editingSection === "monitoring" ? cancelEdit() : openEdit("monitoring")} editing={editingSection === "monitoring"} />
                {editingSection === "monitoring" ? (
                  <Form {...form}>
                    <div className="space-y-4 bg-card border rounded-lg p-4">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Section F — Monitoring & Radius</p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="radiusProfile" render={({ field }) => (<FormItem><FormLabel>Radius Profile</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="bandwidthProfileName" render={({ field }) => (<FormItem><FormLabel>Bandwidth Profile</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField control={form.control} name="monitoringEnabled" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Monitoring</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="snmpMonitoring" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>SNMP</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="trafficAlerts" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Traffic Alerts</FormLabel></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField control={form.control} name="managedRouter" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Managed Router</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="firewall" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Firewall</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="loadBalancer" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Load Balancer</FormLabel></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField control={form.control} name="dedicatedSupport" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Dedicated Support</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="backupLink" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Backup Link</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="monitoringSla" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Monitoring SLA</FormLabel></FormItem>)} />
                      </div>
                      <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>Cancel</Button>
                        <Button type="button" size="sm" disabled={updateMutation.isPending} onClick={saveSection} className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] text-white">
                          {updateMutation.isPending ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</> : <><Save className="h-3.5 w-3.5 mr-1.5" />Save Changes</>}
                        </Button>
                      </div>
                    </div>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-card border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-2 divide-x divide-y">
                        <InfoRow label="Radius Profile" value={<span className="font-mono">{customer.radiusProfile}</span>} />
                        <InfoRow label="Bandwidth Profile" value={<span className="font-mono">{customer.bandwidthProfileName}</span>} />
                      </div>
                    </div>
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-blue-600" />Monitoring Features</CardTitle></CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {customer.monitoringEnabled && <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Monitoring Enabled</Badge>}
                          {customer.snmpMonitoring && <Badge variant="secondary" className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">SNMP Monitoring</Badge>}
                          {customer.trafficAlerts && <Badge variant="secondary" className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">Traffic Alerts</Badge>}
                          {customer.managedRouter && <Badge variant="secondary" className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">Managed Router</Badge>}
                          {customer.firewall && <Badge variant="secondary" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">Firewall</Badge>}
                          {customer.loadBalancer && <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">Load Balancer</Badge>}
                          {customer.dedicatedSupport && <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">Dedicated Support</Badge>}
                          {customer.backupLink && <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">Backup Link</Badge>}
                          {customer.monitoringSla && <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Monitoring SLA</Badge>}
                          {!customer.monitoringEnabled && !customer.snmpMonitoring && !customer.trafficAlerts && !customer.managedRouter && !customer.firewall && !customer.loadBalancer && !customer.dedicatedSupport && !customer.backupLink && !customer.monitoringSla && (
                            <span className="text-sm text-muted-foreground">No features enabled</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    {customer.notes && (
                      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Notes</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{customer.notes}</p></CardContent></Card>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
