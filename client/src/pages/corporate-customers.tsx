import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, Building2, DollarSign, Users,
  Shield, Network, Calendar, Activity, Server, Globe, ChevronDown, Eye,
  Briefcase, Link2, Wifi,
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

export default function CorporateCustomersPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CorporateCustomer | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formSection, setFormSection] = useState(0);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [viewingCorporate, setViewingCorporate] = useState<CorporateCustomer | null>(null);
  const [editingConnection, setEditingConnection] = useState<CorporateConnection | null>(null);
  const [referralsDialogOpen, setReferralsDialogOpen] = useState(false);
  const [viewingReferralsCorp, setViewingReferralsCorp] = useState<CorporateCustomer | null>(null);

  const fromQueryId = new URLSearchParams(window.location.search).get("fromQuery");

  const { data: corporateCustomers, isLoading } = useQuery<CorporateCustomer[]>({ queryKey: ["/api/corporate-customers"] });
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

  const createMutation = useMutation({
    mutationFn: async (data: InsertCorporateCustomer) => { const r = await apiRequest("POST", "/api/corporate-customers", data); return r.json(); },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/corporate-customers"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Corporate customer created" });
      if (fromQueryId) {
        apiRequest("POST", `/api/customer-queries/${fromQueryId}/convert`, { customerId: data.id }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["/api/customer-queries"] });
      }
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

  const onSubmit = (data: InsertCorporateCustomer) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
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

  const filtered = (corporateCustomers || [])
    .filter(c => statusFilter === "all" || c.status === statusFilter)
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (c.companyName || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.ntn || "").toLowerCase().includes(q);
    });

  const totalActive = (corporateCustomers || []).filter(c => c.status === "active").length;
  const totalConns = (corporateCustomers || []).reduce((s, c) => s + (c.totalConnections || 0), 0);
  const totalRevenue = (corporateCustomers || []).filter(c => c.status === "active").reduce((s, c) => s + (parseFloat(c.monthlyBilling || "0") || 0), 0);
  const totalCredit = (corporateCustomers || []).reduce((s, c) => s + (parseFloat(c.creditLimit || "0") || 0), 0);
  const suspended = (corporateCustomers || []).filter(c => c.status === "suspended").length;

  const formSections = ["Company Info", "Billing", "Contract & SLA", "Services", "Summary"];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#002B5B] to-[#007BFF] bg-clip-text text-transparent" data-testid="text-corp-title">Corporate Customers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Multi-branch Enterprise Client Management</p>
      </div>

      {!viewingCorporate ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-l-4 border-l-indigo-500">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Corporates</p>
                <p className="text-2xl font-bold" data-testid="text-corp-total">{(corporateCustomers || []).length}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-teal-500">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Active Accounts</p>
                <p className="text-2xl font-bold text-teal-600" data-testid="text-corp-active">{totalActive}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-corp-revenue">Rs. {totalRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Connections</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="text-corp-conns">{totalConns}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold text-red-600" data-testid="text-corp-suspended">{suspended}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search company, email, NTN..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-[250px] h-9" data-testid="input-corp-search" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9" data-testid="select-corp-status-filter"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openCreate} data-testid="button-add-corp" className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] hover:from-[#001f42] hover:to-[#0044cc]">
              <Plus className="h-4 w-4 mr-1" />Add Corporate Customer
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-indigo-600" />Corporate Customer Management</CardTitle>
            </CardHeader>
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
                        <TableHead className="text-white">Company</TableHead>
                        <TableHead className="text-white">Industry</TableHead>
                        <TableHead className="text-white">Account Manager</TableHead>
                        <TableHead className="text-white">Connections</TableHead>
                        <TableHead className="text-white">Monthly Billing</TableHead>
                        <TableHead className="text-white">Payment Terms</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((c, idx) => (
                        <TableRow key={c.id} data-testid={`row-corp-${c.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                          <TableCell>
                            <div>
                              <span className="font-semibold" data-testid={`text-corp-name-${c.id}`}>{c.companyName}</span>
                              {c.ntn && <p className="text-[10px] text-muted-foreground">NTN: {c.ntn}</p>}
                              {corpReferralCount(c.id) > 0 && (
                                <button
                                  onClick={() => { setViewingReferralsCorp(c); setReferralsDialogOpen(true); }}
                                  className="mt-0.5 flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                                  data-testid={`button-corp-referrals-${c.id}`}
                                >
                                  <Users className="h-3 w-3" />
                                  {corpReferralCount(c.id)} referral{corpReferralCount(c.id) !== 1 ? "s" : ""}
                                </button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell><span className="text-sm">{c.industryType || "—"}</span></TableCell>
                          <TableCell><span className="text-sm">{c.accountManager || "—"}</span></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Network className="h-3.5 w-3.5 text-blue-600" />
                              <span className="font-medium">{c.totalConnections || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell><span className="text-sm font-semibold">Rs. {parseFloat(c.monthlyBilling || "0").toLocaleString()}</span></TableCell>
                          <TableCell><span className="text-sm capitalize">{(c.paymentTerms || "net_30").replace("_", " ")}</span></TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[c.status] || ""}`}>{c.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-corp-actions-${c.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openConnections(c)}><Link2 className="h-4 w-4 mr-2" />Connections</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEdit(c)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
              {formSection === 0 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Section A — Company Information</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name</FormLabel><FormControl><Input data-testid="input-corp-company" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="registrationNumber" render={({ field }) => (<FormItem><FormLabel>Registration Number</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="ntn" render={({ field }) => (<FormItem><FormLabel>NTN</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="industryType" render={({ field }) => (
                      <FormItem><FormLabel>Industry Type</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger data-testid="select-corp-industry"><SelectValue placeholder="Select industry" /></SelectTrigger></FormControl><SelectContent>{industryOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="headOfficeAddress" render={({ field }) => (<FormItem><FormLabel>Head Office Address</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="accountManager" render={({ field }) => (<FormItem><FormLabel>Account Manager</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              )}
              {formSection === 1 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Section B — Billing Configuration</p>
                  <FormField control={form.control} name="billingAddress" render={({ field }) => (<FormItem><FormLabel>Billing Address</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="centralizedBilling" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel>Centralized Billing</FormLabel></FormItem>)} />
                    <FormField control={form.control} name="perBranchBilling" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Per-Branch Billing</FormLabel></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                      <FormItem><FormLabel>Payment Terms</FormLabel><Select onValueChange={field.onChange} value={field.value || "net_30"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="net_15">Net 15</SelectItem><SelectItem value="net_30">Net 30</SelectItem><SelectItem value="net_45">Net 45</SelectItem><SelectItem value="net_60">Net 60</SelectItem><SelectItem value="prepaid">Prepaid</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="customInvoiceFormat" render={({ field }) => (<FormItem><FormLabel>Custom Invoice Format</FormLabel><FormControl><Input placeholder="e.g., Detailed Line Items" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="monthlyBilling" render={({ field }) => (<FormItem><FormLabel>Monthly Billing</FormLabel><FormControl><Input type="number" data-testid="input-corp-billing" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="creditLimit" render={({ field }) => (<FormItem><FormLabel>Credit Limit</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="securityDeposit" render={({ field }) => (<FormItem><FormLabel>Security Deposit</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                </div>
              )}
              {formSection === 2 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Section C — Contract & SLA</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="contractDuration" render={({ field }) => (<FormItem><FormLabel>Contract Duration</FormLabel><FormControl><Input placeholder="e.g., 12 months" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="dedicatedAccountManager" render={({ field }) => (<FormItem><FormLabel>Dedicated Account Manager</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="customSla" render={({ field }) => (<FormItem><FormLabel>Custom SLA</FormLabel><FormControl><Textarea rows={2} placeholder="SLA terms and uptime guarantee" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="customPricingAgreement" render={({ field }) => (<FormItem><FormLabel>Custom Pricing Agreement</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              )}
              {formSection === 3 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Section D — Managed Services</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="managedRouter" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Managed Router</FormLabel></FormItem>)} />
                    <FormField control={form.control} name="firewall" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Firewall</FormLabel></FormItem>)} />
                    <FormField control={form.control} name="loadBalancer" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Load Balancer</FormLabel></FormItem>)} />
                    <FormField control={form.control} name="dedicatedSupport" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Dedicated Support</FormLabel></FormItem>)} />
                    <FormField control={form.control} name="backupLink" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Backup Link</FormLabel></FormItem>)} />
                    <FormField control={form.control} name="monitoringSla" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Monitoring SLA</FormLabel></FormItem>)} />
                  </div>
                </div>
              )}
              {formSection === 4 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Section E — Summary & Status</p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="totalConnections" render={({ field }) => (<FormItem><FormLabel>Total Connections</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="totalBandwidth" render={({ field }) => (<FormItem><FormLabel>Total Bandwidth</FormLabel><FormControl><Input placeholder="e.g., 200 Mbps" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value || "active"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              )}
              <DialogFooter className="flex justify-between">
                <div className="flex gap-2">
                  {formSection > 0 && <Button type="button" variant="outline" onClick={() => setFormSection(s => s - 1)}>Previous</Button>}
                  {formSection < 4 && <Button type="button" variant="outline" onClick={() => setFormSection(s => s + 1)}>Next</Button>}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-corp-submit" className="bg-gradient-to-r from-[#002B5B] to-[#005EFF]">
                    {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editing ? "Update" : "Create"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
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
    </div>
  );
}
