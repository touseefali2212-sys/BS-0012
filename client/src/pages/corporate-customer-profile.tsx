import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, Wifi, Edit, Save,
  ChevronRight, Shield, Network, Activity, DollarSign, AlertCircle, RefreshCw,
  Plus, Trash2, MoreHorizontal, Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertCorporateCustomerSchema, insertCorporateConnectionSchema,
  type CorporateCustomer, type InsertCorporateCustomer,
  type CorporateConnection, type InsertCorporateConnection,
} from "@shared/schema";

const statusColors: Record<string, string> = {
  active: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950",
  suspended: "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950",
  pending: "text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-950",
  inactive: "text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800",
};

const industryOptions = ["Technology", "Finance", "Healthcare", "Manufacturing", "Education", "Retail", "Government", "Telecom", "Real Estate", "Other"];

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
          {editing ? <><AlertCircle className="h-3.5 w-3.5" />Cancel</> : <><Edit className="h-3.5 w-3.5" />Edit Section</>}
        </Button>
      )}
    </div>
  );
}

export default function CorporateCustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("company");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<CorporateConnection | null>(null);

  const { data: customer, isLoading } = useQuery<CorporateCustomer>({
    queryKey: ["/api/corporate-customers", id],
    queryFn: async () => {
      const res = await fetch(`/api/corporate-customers/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: connections } = useQuery<CorporateConnection[]>({
    queryKey: ["/api/corporate-connections", id],
    enabled: !!id,
  });

  const form = useForm<InsertCorporateCustomer>({
    resolver: zodResolver(insertCorporateCustomerSchema),
    defaultValues: {},
  });

  const connForm = useForm<InsertCorporateConnection>({
    resolver: zodResolver(insertCorporateConnectionSchema),
    defaultValues: {
      corporateId: parseInt(id || "0"), branchName: "", location: "", packageType: "shared",
      bandwidth: "", staticIp: "", installationDate: "", status: "active", monthlyCharges: "0",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertCorporateCustomer>) => {
      const res = await apiRequest("PATCH", `/api/corporate-customers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corporate-customers", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/corporate-customers"] });
      setEditingSection(null);
      toast({ title: "Customer updated successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createConnMutation = useMutation({
    mutationFn: async (data: InsertCorporateConnection) => {
      const res = await apiRequest("POST", "/api/corporate-connections", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corporate-connections", id] });
      setConnectionDialogOpen(false);
      connForm.reset({ corporateId: parseInt(id || "0"), packageType: "shared", status: "active", monthlyCharges: "0" });
      toast({ title: "Connection added" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateConnMutation = useMutation({
    mutationFn: async ({ connId, data }: { connId: number; data: Partial<InsertCorporateConnection> }) => {
      const res = await apiRequest("PATCH", `/api/corporate-connections/${connId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corporate-connections", id] });
      setConnectionDialogOpen(false);
      setEditingConnection(null);
      toast({ title: "Connection updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteConnMutation = useMutation({
    mutationFn: async (connId: number) => {
      await apiRequest("DELETE", `/api/corporate-connections/${connId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corporate-connections", id] });
      toast({ title: "Connection removed" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEdit = (section: string) => {
    if (!customer) return;
    form.reset(customer as any);
    setEditingSection(section);
  };

  const cancelEdit = () => setEditingSection(null);
  const saveSection = () => { form.handleSubmit((data) => updateMutation.mutate(data))(); };

  const openAddConnection = () => {
    setEditingConnection(null);
    connForm.reset({
      corporateId: parseInt(id || "0"), branchName: "", location: "", packageType: "shared",
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
    if (editingConnection) updateConnMutation.mutate({ connId: editingConnection.id, data });
    else createConnMutation.mutate(data);
  };

  const tabs = [
    { key: "company", label: "Company Info" },
    { key: "billing", label: "Billing" },
    { key: "contract", label: "Contract & SLA" },
    { key: "services", label: "Managed Services" },
    { key: "connections", label: "Connections" },
    { key: "summary", label: "Summary" },
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
        <Link href="/corporate-customers">
          <Button variant="ghost"><ArrowLeft className="h-4 w-4 mr-1" />Back to Corporate Customers</Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">Corporate Customer not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#0057FF]" />
          <h1 className="text-lg font-bold">Corporate Profile</h1>
          <span className="text-xs text-muted-foreground">Enterprise Client</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/corporate-customers" className="text-[#0057FF]">Corporate Customers</Link>
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
            <h2 className="text-base font-bold text-center leading-tight" data-testid="text-corp-profile-name">{customer.companyName}</h2>
            <p className="text-xs opacity-70 mt-0.5">{customer.industryType || "Corporate Account"}</p>
            <Badge variant="secondary" className={`mt-2 capitalize text-[10px] ${statusColors[customer.status] || ""}`} data-testid="badge-corp-status">
              {customer.status}
            </Badge>
          </div>

          <div className="px-4 space-y-2.5 text-xs border-t border-white/10 pt-4">
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <div className="flex items-center gap-2"><DollarSign className="h-3.5 w-3.5 opacity-60" /><span className="opacity-80">Monthly Billing</span></div>
              <span className="font-semibold text-green-300">Rs. {parseFloat(customer.monthlyBilling || "0").toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <div className="flex items-center gap-2"><Network className="h-3.5 w-3.5 opacity-60" /><span className="opacity-80">Connections</span></div>
              <span className="font-semibold text-blue-300">{customer.totalConnections || 0}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <div className="flex items-center gap-2"><Wifi className="h-3.5 w-3.5 opacity-60" /><span className="opacity-80">Total Bandwidth</span></div>
              <span className="font-semibold text-teal-300">{customer.totalBandwidth || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 opacity-60" /><span className="opacity-80">Account Manager</span></div>
              <span className="text-xs truncate max-w-[100px]">{customer.accountManager || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 opacity-60" /><span className="opacity-80">Payment Terms</span></div>
              <span className="text-xs capitalize">{(customer.paymentTerms || "net_30").replace("_", " ")}</span>
            </div>
            {customer.ntn && (
              <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 opacity-60" /><span className="opacity-80">NTN</span></div>
                <span className="font-mono text-xs">{customer.ntn}</span>
              </div>
            )}
          </div>

          <div className="px-4 pt-4 pb-4 mt-auto space-y-2">
            <Button size="sm" variant="secondary" className="w-full text-[11px] h-8 gap-1.5" onClick={() => { openEdit("company"); setActiveTab("company"); }} data-testid="button-corp-edit-profile">
              <Edit className="h-3.5 w-3.5" />Update Information
            </Button>
            <Link href="/corporate-customers">
              <Button size="sm" variant="outline" className="w-full text-[11px] h-8 gap-1.5 text-white border-white/30" data-testid="button-corp-back-list">
                <ArrowLeft className="h-3.5 w-3.5" />Back to Corp. List
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-muted/30 overflow-hidden">
          <div className="border-b bg-card">
            <div className="flex flex-wrap px-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setEditingSection(null); }}
                  className={`px-4 py-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key ? "border-[#0057FF] text-[#0057FF]" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`tab-corp-${tab.key}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 overflow-y-auto max-h-[calc(100vh-170px)] space-y-5">

            {/* COMPANY INFO */}
            {activeTab === "company" && (
              <div className="space-y-4" data-testid="tab-content-corp-company">
                <SectionHeader title="Company Information" onEdit={() => editingSection === "company" ? cancelEdit() : openEdit("company")} editing={editingSection === "company"} />
                {editingSection === "company" ? (
                  <Form {...form}>
                    <div className="space-y-4 bg-card border rounded-lg p-4">
                      <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Section A — Company Information</p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="registrationNumber" render={({ field }) => (<FormItem><FormLabel>Registration Number</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="ntn" render={({ field }) => (<FormItem><FormLabel>NTN</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="industryType" render={({ field }) => (
                          <FormItem><FormLabel>Industry Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger></FormControl>
                              <SelectContent>{industryOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                            </Select><FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="mobileNo" render={({ field }) => (<FormItem><FormLabel>Mobile No.</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="accountManager" render={({ field }) => (<FormItem><FormLabel>Account Manager</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="branch" render={({ field }) => (<FormItem><FormLabel>Branch</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <FormField control={form.control} name="headOfficeAddress" render={({ field }) => (<FormItem><FormLabel>Head Office Address</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "active"}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
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
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-y">
                      <InfoRow label="Company Name" value={customer.companyName} />
                      <InfoRow label="Registration No." value={<span className="font-mono">{customer.registrationNumber}</span>} />
                      <InfoRow label="NTN" value={<span className="font-mono">{customer.ntn}</span>} />
                      <InfoRow label="Industry Type" value={customer.industryType} />
                      <InfoRow label="Email" value={customer.email} />
                      <InfoRow label="Phone" value={customer.phone} />
                      <InfoRow label="Mobile No." value={customer.mobileNo} />
                      <InfoRow label="Account Manager" value={customer.accountManager} />
                      <InfoRow label="Branch" value={customer.branch} />
                      <InfoRow label="City" value={customer.city} />
                      <InfoRow label="Head Office Address" value={customer.headOfficeAddress} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BILLING */}
            {activeTab === "billing" && (
              <div className="space-y-4" data-testid="tab-content-corp-billing">
                <SectionHeader title="Billing Configuration" onEdit={() => editingSection === "billing" ? cancelEdit() : openEdit("billing")} editing={editingSection === "billing"} />
                {editingSection === "billing" ? (
                  <Form {...form}>
                    <div className="space-y-4 bg-card border rounded-lg p-4">
                      <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Section B — Billing Configuration</p>
                      <FormField control={form.control} name="billingAddress" render={({ field }) => (<FormItem><FormLabel>Billing Address</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="centralizedBilling" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel>Centralized Billing</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="perBranchBilling" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Per-Branch Billing</FormLabel></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                          <FormItem><FormLabel>Payment Terms</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "net_30"}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent><SelectItem value="net_15">Net 15</SelectItem><SelectItem value="net_30">Net 30</SelectItem><SelectItem value="net_45">Net 45</SelectItem><SelectItem value="net_60">Net 60</SelectItem><SelectItem value="prepaid">Prepaid</SelectItem></SelectContent>
                            </Select><FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="customInvoiceFormat" render={({ field }) => (<FormItem><FormLabel>Custom Invoice Format</FormLabel><FormControl><Input placeholder="e.g., Detailed Line Items" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField control={form.control} name="monthlyBilling" render={({ field }) => (<FormItem><FormLabel>Monthly Billing</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="creditLimit" render={({ field }) => (<FormItem><FormLabel>Credit Limit</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="securityDeposit" render={({ field }) => (<FormItem><FormLabel>Security Deposit</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
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
                      <InfoRow label="Monthly Billing" value={<span className="font-bold text-green-700 dark:text-green-400">Rs. {parseFloat(customer.monthlyBilling || "0").toLocaleString()}</span>} />
                      <InfoRow label="Credit Limit" value={`Rs. ${parseFloat(customer.creditLimit || "0").toLocaleString()}`} />
                      <InfoRow label="Security Deposit" value={`Rs. ${parseFloat(customer.securityDeposit || "0").toLocaleString()}`} />
                      <InfoRow label="Payment Terms" value={<span className="capitalize">{(customer.paymentTerms || "net_30").replace("_", " ")}</span>} />
                      <InfoRow label="Billing Address" value={customer.billingAddress} />
                      <InfoRow label="Custom Invoice Format" value={customer.customInvoiceFormat} />
                      <InfoRow label="Centralized Billing" value={customer.centralizedBilling ? <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Enabled</Badge> : "Disabled"} />
                      <InfoRow label="Per-Branch Billing" value={customer.perBranchBilling ? <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">Enabled</Badge> : "Disabled"} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CONTRACT & SLA */}
            {activeTab === "contract" && (
              <div className="space-y-4" data-testid="tab-content-corp-contract">
                <SectionHeader title="Contract & SLA" onEdit={() => editingSection === "contract" ? cancelEdit() : openEdit("contract")} editing={editingSection === "contract"} />
                {editingSection === "contract" ? (
                  <Form {...form}>
                    <div className="space-y-4 bg-card border rounded-lg p-4">
                      <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Section C — Contract & SLA</p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="contractDuration" render={({ field }) => (<FormItem><FormLabel>Contract Duration</FormLabel><FormControl><Input placeholder="e.g., 12 months" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="dedicatedAccountManager" render={({ field }) => (<FormItem><FormLabel>Dedicated Account Manager</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="contractStartDate" render={({ field }) => (<FormItem><FormLabel>Contract Start</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="contractExpiryDate" render={({ field }) => (<FormItem><FormLabel>Contract Expiry</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <FormField control={form.control} name="customSla" render={({ field }) => (<FormItem><FormLabel>Custom SLA Terms</FormLabel><FormControl><Textarea rows={3} placeholder="SLA terms and uptime guarantee" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="customPricingAgreement" render={({ field }) => (<FormItem><FormLabel>Custom Pricing Agreement</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
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
                        <InfoRow label="Contract Duration" value={customer.contractDuration} />
                        <InfoRow label="Dedicated Account Manager" value={customer.dedicatedAccountManager} />
                        <InfoRow label="Contract Start" value={customer.contractStartDate} />
                        <InfoRow label="Contract Expiry" value={customer.contractExpiryDate} />
                      </div>
                    </div>
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

            {/* MANAGED SERVICES */}
            {activeTab === "services" && (
              <div className="space-y-4" data-testid="tab-content-corp-services">
                <SectionHeader title="Managed Services" onEdit={() => editingSection === "services" ? cancelEdit() : openEdit("services")} editing={editingSection === "services"} />
                {editingSection === "services" ? (
                  <Form {...form}>
                    <div className="space-y-4 bg-card border rounded-lg p-4">
                      <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Section D — Managed Services</p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="managedRouter" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Managed Router</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="firewall" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Firewall</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="loadBalancer" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Load Balancer</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="dedicatedSupport" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Dedicated Support</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="backupLink" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Backup Link</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="monitoringSla" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Monitoring SLA</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="monitoringEnabled" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Monitoring Enabled</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="snmpMonitoring" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>SNMP Monitoring</FormLabel></FormItem>)} />
                        <FormField control={form.control} name="trafficAlerts" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Traffic Alerts</FormLabel></FormItem>)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <FormField control={form.control} name="radiusProfile" render={({ field }) => (<FormItem><FormLabel>Radius Profile</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="bandwidthProfileName" render={({ field }) => (<FormItem><FormLabel>Bandwidth Profile</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
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
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-indigo-600" />Active Managed Services</CardTitle></CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {customer.managedRouter && <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Managed Router</Badge>}
                          {customer.firewall && <Badge variant="secondary" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">Firewall</Badge>}
                          {customer.loadBalancer && <Badge variant="secondary" className="bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">Load Balancer</Badge>}
                          {customer.dedicatedSupport && <Badge variant="secondary" className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">Dedicated Support</Badge>}
                          {customer.backupLink && <Badge variant="secondary" className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">Backup Link</Badge>}
                          {customer.monitoringSla && <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">Monitoring SLA</Badge>}
                          {customer.monitoringEnabled && <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">Monitoring</Badge>}
                          {customer.snmpMonitoring && <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">SNMP</Badge>}
                          {customer.trafficAlerts && <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">Traffic Alerts</Badge>}
                          {!customer.managedRouter && !customer.firewall && !customer.loadBalancer && !customer.dedicatedSupport && !customer.backupLink && !customer.monitoringSla && !customer.monitoringEnabled && !customer.snmpMonitoring && !customer.trafficAlerts && (
                            <span className="text-sm text-muted-foreground">No managed services enabled</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    <div className="bg-card border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-2 divide-x divide-y">
                        <InfoRow label="Radius Profile" value={<span className="font-mono">{customer.radiusProfile}</span>} />
                        <InfoRow label="Bandwidth Profile" value={<span className="font-mono">{customer.bandwidthProfileName}</span>} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CONNECTIONS */}
            {activeTab === "connections" && (
              <div className="space-y-4" data-testid="tab-content-corp-connections">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">Branch Connections</h3>
                  <Button size="sm" onClick={openAddConnection} className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] text-white h-8 text-xs gap-1.5" data-testid="button-add-conn">
                    <Plus className="h-3.5 w-3.5" />Add Connection
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-2">
                  <Card className="border-l-4 border-l-blue-500"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{(connections || []).length}</p></CardContent></Card>
                  <Card className="border-l-4 border-l-green-500"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold text-green-600">{(connections || []).filter(c => c.status === "active").length}</p></CardContent></Card>
                  <Card className="border-l-4 border-l-indigo-500"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Monthly Rev.</p><p className="text-sm font-bold text-indigo-600">Rs. {(connections || []).reduce((s, c) => s + parseFloat(c.monthlyCharges || "0"), 0).toLocaleString()}</p></CardContent></Card>
                </div>
                {(connections || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-card border rounded-lg">
                    <Network className="h-10 w-10 mb-2 opacity-30" /><p className="font-medium text-sm">No connections yet</p>
                    <p className="text-xs mt-1">Add branch connections for this account</p>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700">
                            <TableHead className="text-white text-xs">Branch Name</TableHead>
                            <TableHead className="text-white text-xs">Location</TableHead>
                            <TableHead className="text-white text-xs">Package</TableHead>
                            <TableHead className="text-white text-xs">Bandwidth</TableHead>
                            <TableHead className="text-white text-xs">Static IP</TableHead>
                            <TableHead className="text-white text-xs">Monthly</TableHead>
                            <TableHead className="text-white text-xs">Status</TableHead>
                            <TableHead className="text-white w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(connections || []).map((c, idx) => (
                            <TableRow key={c.id} data-testid={`row-conn-profile-${c.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                              <TableCell className="text-xs font-medium">{c.branchName}</TableCell>
                              <TableCell className="text-xs">{c.location || "—"}</TableCell>
                              <TableCell><Badge variant="outline" className="text-[10px] capitalize">{c.packageType}</Badge></TableCell>
                              <TableCell className="text-xs font-medium text-teal-700 dark:text-teal-400">{c.bandwidth || "—"}</TableCell>
                              <TableCell><code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{c.staticIp || "—"}</code></TableCell>
                              <TableCell className="text-xs font-semibold">Rs. {parseFloat(c.monthlyCharges || "0").toLocaleString()}</TableCell>
                              <TableCell><Badge variant="secondary" className={`text-[10px] capitalize ${statusColors[c.status] || ""}`}>{c.status}</Badge></TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
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
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* SUMMARY */}
            {activeTab === "summary" && (
              <div className="space-y-4" data-testid="tab-content-corp-summary">
                <SectionHeader title="Summary & Status" onEdit={() => editingSection === "summary" ? cancelEdit() : openEdit("summary")} editing={editingSection === "summary"} />
                {editingSection === "summary" ? (
                  <Form {...form}>
                    <div className="space-y-4 bg-card border rounded-lg p-4">
                      <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Section E — Summary & Status</p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="totalConnections" render={({ field }) => (<FormItem><FormLabel>Total Connections</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="totalBandwidth" render={({ field }) => (<FormItem><FormLabel>Total Bandwidth</FormLabel><FormControl><Input placeholder="e.g., 200 Mbps" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "active"}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={4} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
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
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Connections</p><p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{customer.totalConnections || 0}</p></CardContent></Card>
                      <Card className="border-l-4 border-l-teal-500"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Bandwidth</p><p className="text-lg font-bold text-teal-700 dark:text-teal-400">{customer.totalBandwidth || "—"}</p></CardContent></Card>
                      <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Monthly Billing</p><p className="text-sm font-bold text-green-700 dark:text-green-400">Rs. {parseFloat(customer.monthlyBilling || "0").toLocaleString()}</p></CardContent></Card>
                    </div>
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

      {/* Connection Add/Edit Dialog */}
      <Dialog open={connectionDialogOpen} onOpenChange={setConnectionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingConnection ? "Edit Connection" : "Add Branch Connection"}</DialogTitle>
          </DialogHeader>
          <Form {...connForm}>
            <form onSubmit={connForm.handleSubmit(onConnSubmit)} className="space-y-4">
              <FormField control={connForm.control} name="branchName" render={({ field }) => (<FormItem><FormLabel>Branch Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={connForm.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={connForm.control} name="packageType" render={({ field }) => (
                  <FormItem><FormLabel>Package</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "shared"}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="shared">Shared</SelectItem><SelectItem value="dedicated">Dedicated</SelectItem><SelectItem value="cir">CIR</SelectItem></SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={connForm.control} name="bandwidth" render={({ field }) => (<FormItem><FormLabel>Bandwidth</FormLabel><FormControl><Input placeholder="e.g., 50 Mbps" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={connForm.control} name="staticIp" render={({ field }) => (<FormItem><FormLabel>Static IP</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={connForm.control} name="installationDate" render={({ field }) => (<FormItem><FormLabel>Install Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={connForm.control} name="monthlyCharges" render={({ field }) => (<FormItem><FormLabel>Monthly Charges</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={connForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "active"}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setConnectionDialogOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={createConnMutation.isPending || updateConnMutation.isPending} className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] text-white">
                  {(createConnMutation.isPending || updateConnMutation.isPending) ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</> : editingConnection ? "Update Connection" : "Add Connection"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
