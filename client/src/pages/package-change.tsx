import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowUpCircle, ArrowDownCircle, Search, Plus, Check, X, Clock, Loader2,
  Eye, ChevronDown, ChevronUp, Zap, Calendar, DollarSign, AlertTriangle,
  Send, Shield, Settings, FileText, Filter, RefreshCw, Package,
  Building2, Wifi, Users, MoreHorizontal, History, CheckCircle2, XCircle,
  ArrowRight, Network, Server, Radio, Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PackageChangeRequest, Package as PkgType } from "@shared/schema";

const statusColors: Record<string, string> = {
  draft: "text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800",
  pending: "text-yellow-700 bg-yellow-50 dark:text-yellow-300 dark:bg-yellow-950",
  approved: "text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-950",
  implementing: "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950",
  completed: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950",
  rejected: "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950",
  failed: "text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-950",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  pending: "Pending Approval",
  approved: "Approved",
  implementing: "Implementing",
  completed: "Completed",
  rejected: "Rejected",
  failed: "Failed",
};

export default function PackageChangePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("new_request");
  const [search, setSearch] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PackageChangeRequest | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [implementNotes, setImplementNotes] = useState("");
  const [implementDialogOpen, setImplementDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<any>({});

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerType, setCustomerType] = useState("Normal");
  const [changeType, setChangeType] = useState("upgrade");
  const [newPackageId, setNewPackageId] = useState("");
  const [newBandwidth, setNewBandwidth] = useState("");
  const [effectiveDateType, setEffectiveDateType] = useState("immediate");
  const [customDate, setCustomDate] = useState("");
  const [reason, setReason] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const { data: allRequests, isLoading } = useQuery<PackageChangeRequest[]>({ queryKey: ["/api/package-change-requests"] });
  const { data: packages } = useQuery<PkgType[]>({ queryKey: ["/api/packages"] });
  const { data: customers } = useQuery<any[]>({ queryKey: ["/api/customers"] });
  const { data: cirCustomers } = useQuery<any[]>({ queryKey: ["/api/cir-customers"] });
  const { data: corporateCustomers } = useQuery<any[]>({ queryKey: ["/api/corporate-customers"] });

  const urlParams = new URLSearchParams(window.location.search);
  const preCustomerType = urlParams.get("customerType");
  const preCustomerId = urlParams.get("customerId");
  const preCustomerName = urlParams.get("customerName");

  useEffect(() => {
    if (preCustomerType && preCustomerId) {
      setCustomerType(preCustomerType);
      const numId = parseInt(preCustomerId);
      let found: any = null;
      if (preCustomerType === "Normal" && customers?.length) {
        const c = customers.find((x: any) => x.id === numId);
        if (c) found = { id: c.id, name: c.fullName || c.name || `Customer #${c.id}`, type: "Normal", packageId: c.packageId, monthlyBill: c.packageBill, status: c.status };
      } else if (preCustomerType === "CIR" && cirCustomers?.length) {
        const c = cirCustomers.find((x: any) => x.id === numId);
        if (c) found = { id: c.id, name: c.companyName || `CIR #${c.id}`, type: "CIR", bandwidth: c.bandwidthMbps || c.committedBandwidth, monthlyBill: c.monthlyBilling || c.monthlyCharges, status: c.status };
      } else if (preCustomerType === "Corporate" && corporateCustomers?.length) {
        const c = corporateCustomers.find((x: any) => x.id === numId);
        if (c) found = { id: c.id, name: c.companyName || `Corporate #${c.id}`, type: "Corporate", monthlyBill: c.monthlyCharges || c.monthlyBilling, status: c.status };
      }
      if (found) {
        setSelectedCustomer(found);
      } else if (preCustomerName) {
        setSelectedCustomer({ id: numId, name: preCustomerName, type: preCustomerType });
      }
    }
  }, [preCustomerType, preCustomerId, preCustomerName, customers, cirCustomers, corporateCustomers]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/package-change-requests", data),
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/package-change-requests"] });
      if (variables.customerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/customers", String(variables.customerId), "service-requests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/customers", String(variables.customerId), "package-change-history"] });
      }
      if (variables.cirCustomerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/cir-customers", String(variables.cirCustomerId), "service-requests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/cir-customers", String(variables.cirCustomerId), "bandwidth-history"] });
      }
      if (variables.corporateCustomerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/corporate-customers", String(variables.corporateCustomerId), "service-requests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/corporate-customers", String(variables.corporateCustomerId), "bandwidth-history"] });
      }
      toast({ title: "Request Submitted", description: "Package change request has been created successfully." });
      resetForm();
      setActiveTab("pending");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/package-change-requests/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/package-change-requests"] });
      toast({ title: "Updated", description: "Request status updated successfully." });
      setDetailsOpen(false);
      setRejectDialogOpen(false);
      setImplementDialogOpen(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setChangeType("upgrade");
    setNewPackageId("");
    setNewBandwidth("");
    setEffectiveDateType("immediate");
    setCustomDate("");
    setReason("");
    setIsUrgent(false);
  };

  const allCustomersList = useMemo(() => {
    const list: any[] = [];
    (customers || []).forEach(c => list.push({ id: c.id, name: c.fullName || c.name || `Customer #${c.id}`, type: "Normal", packageId: c.packageId, monthlyBill: c.packageBill, status: c.status }));
    (cirCustomers || []).forEach(c => list.push({ id: c.id, name: c.companyName || `CIR #${c.id}`, type: "CIR", bandwidth: c.bandwidthMbps || c.committedBandwidth, monthlyBill: c.monthlyBilling || c.monthlyCharges, status: c.status }));
    (corporateCustomers || []).forEach(c => list.push({ id: c.id, name: c.companyName || `Corporate #${c.id}`, type: "Corporate", monthlyBill: c.monthlyCharges || c.monthlyBilling, status: c.status }));
    return list;
  }, [customers, cirCustomers, corporateCustomers]);

  const filteredCustomerSearch = useMemo(() => {
    if (!customerSearch || customerSearch.length < 2) return [];
    const q = customerSearch.toLowerCase();
    return allCustomersList
      .filter(c => c.type === customerType)
      .filter(c => c.name.toLowerCase().includes(q) || String(c.id).includes(q))
      .slice(0, 10);
  }, [customerSearch, customerType, allCustomersList]);

  const currentPkg = selectedCustomer?.packageId ? packages?.find(p => p.id === selectedCustomer.packageId) : null;
  const newPkg = newPackageId ? packages?.find(p => p.id === parseInt(newPackageId)) : null;

  const newPrice = newPkg ? parseFloat(newPkg.price) : (newBandwidth ? parseFloat(newBandwidth) * 100 : 0);
  const currentPrice = currentPkg ? parseFloat(currentPkg.price) : parseFloat(selectedCustomer?.monthlyBill || "0");
  const priceDiff = newPrice - currentPrice;
  const taxRate = 0.16;
  const taxImpact = Math.abs(priceDiff) * taxRate;

  const handleSubmitRequest = (isDraft: boolean) => {
    if (!selectedCustomer) {
      toast({ title: "Select Customer", description: "Please search and select a customer.", variant: "destructive" });
      return;
    }
    if (!newPackageId && !newBandwidth) {
      toast({ title: "Select Package", description: "Please select a new package or enter bandwidth.", variant: "destructive" });
      return;
    }

    const data: any = {
      customerType,
      customerName: selectedCustomer.name,
      changeType,
      currentPackageName: currentPkg?.name || "Custom Plan",
      currentBandwidth: currentPkg?.speed || selectedCustomer?.bandwidth || "",
      currentMonthlyBill: String(currentPrice),
      newPackageId: newPackageId ? parseInt(newPackageId) : null,
      newPackageName: newPkg?.name || `Custom ${newBandwidth} Mbps`,
      newBandwidth: newPkg?.speed || newBandwidth || "",
      newMonthlyBill: String(newPrice),
      proratedCharges: String(Math.abs(priceDiff * 0.5).toFixed(2)),
      adjustmentAmount: String(priceDiff.toFixed(2)),
      taxImpact: String(taxImpact.toFixed(2)),
      finalBillDifference: String((priceDiff + taxImpact).toFixed(2)),
      effectiveDateType,
      effectiveDate: effectiveDateType === "custom" ? customDate : effectiveDateType === "immediate" ? new Date().toISOString().split("T")[0] : "",
      reason,
      isUrgent,
      status: isDraft ? "draft" : "pending",
    };

    if (customerType === "Normal") data.customerId = selectedCustomer.id;
    else if (customerType === "CIR") data.cirCustomerId = selectedCustomer.id;
    else if (customerType === "Corporate") data.corporateCustomerId = selectedCustomer.id;

    if (newPackageId) data.newPackageId = parseInt(newPackageId);
    if (selectedCustomer.packageId) data.currentPackageId = selectedCustomer.packageId;

    createMutation.mutate(data);
  };

  const handleApprove = (req: PackageChangeRequest) => {
    updateMutation.mutate({ id: req.id, data: { status: "approved", approvedBy: "admin", approvedAt: new Date().toISOString() } });
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    updateMutation.mutate({ id: selectedRequest.id, data: { status: "rejected", rejectedBy: "admin", rejectedAt: new Date().toISOString(), rejectionReason: rejectReason } });
    setRejectReason("");
  };

  const handleImplement = () => {
    if (!selectedRequest) return;
    updateMutation.mutate({
      id: selectedRequest.id,
      data: {
        status: "completed",
        implementedBy: "admin",
        implementedAt: new Date().toISOString(),
        implementationNotes: implementNotes,
        networkSyncStatus: "synced",
        billingUpdated: true,
        notificationSent: true,
      },
    });
    setImplementNotes("");
  };

  const handleMoveToImplementation = (req: PackageChangeRequest) => {
    updateMutation.mutate({ id: req.id, data: { status: "implementing" } });
  };

  const openEditDialog = (req: PackageChangeRequest) => {
    setSelectedRequest(req);
    setEditData({
      customerName: req.customerName || "",
      customerType: req.customerType || "Normal",
      changeType: req.changeType || "upgrade",
      currentPackageName: req.currentPackageName || "",
      currentBandwidth: req.currentBandwidth || "",
      currentMonthlyBill: req.currentMonthlyBill || "",
      newPackageName: req.newPackageName || "",
      newBandwidth: req.newBandwidth || "",
      newMonthlyBill: req.newMonthlyBill || "",
      proratedCharges: req.proratedCharges || "",
      adjustmentAmount: req.adjustmentAmount || "",
      taxImpact: req.taxImpact || "",
      finalBillDifference: req.finalBillDifference || "",
      effectiveDateType: req.effectiveDateType || "immediate",
      effectiveDate: req.effectiveDate || "",
      reason: req.reason || "",
      isUrgent: req.isUrgent || false,
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!selectedRequest) return;
    updateMutation.mutate({ id: selectedRequest.id, data: editData }, {
      onSuccess: () => {
        setEditDialogOpen(false);
        toast({ title: "Updated", description: "Request has been updated successfully." });
      },
    });
  };

  const requests = allRequests || [];
  const pendingRequests = requests.filter(r => r.status === "pending");
  const approvedRequests = requests.filter(r => r.status === "approved");
  const implementingRequests = requests.filter(r => r.status === "implementing");
  const completedRequests = requests.filter(r => r.status === "completed");
  const rejectedRequests = requests.filter(r => r.status === "rejected");
  const draftRequests = requests.filter(r => r.status === "draft");

  const tabs = [
    { key: "new_request", label: "New Request", icon: Plus, count: 0, color: "text-blue-600" },
    { key: "pending", label: "Pending Approval", icon: Clock, count: pendingRequests.length, color: "text-yellow-600" },
    { key: "approved", label: "Approved", icon: Check, count: approvedRequests.length, color: "text-green-600" },
    { key: "implementing", label: "Implementation Queue", icon: Settings, count: implementingRequests.length, color: "text-blue-600" },
    { key: "completed", label: "Completed", icon: CheckCircle2, count: completedRequests.length, color: "text-emerald-600" },
    { key: "rejected", label: "Rejected", icon: XCircle, count: rejectedRequests.length, color: "text-red-600" },
    { key: "history", label: "Request History", icon: History, count: requests.length, color: "text-purple-600" },
  ];

  const renderRequestTable = (data: PackageChangeRequest[], showActions: string) => {
    const filtered = data.filter(r => {
      if (!search) return true;
      const q = search.toLowerCase();
      return r.customerName.toLowerCase().includes(q) || r.requestNumber.toLowerCase().includes(q) || (r.currentPackageName || "").toLowerCase().includes(q) || (r.newPackageName || "").toLowerCase().includes(q);
    });

    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">Request ID</TableHead>
              <TableHead className="text-xs font-semibold">Customer</TableHead>
              <TableHead className="text-xs font-semibold">Type</TableHead>
              <TableHead className="text-xs font-semibold">Change</TableHead>
              <TableHead className="text-xs font-semibold">Old Package</TableHead>
              <TableHead className="text-xs font-semibold">New Package</TableHead>
              <TableHead className="text-xs font-semibold">Bill Diff</TableHead>
              <TableHead className="text-xs font-semibold">Date</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No requests found</TableCell></TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => { setSelectedRequest(r); setDetailsOpen(true); }}>
                <TableCell className="font-mono text-xs text-blue-600" data-testid={`text-request-id-${r.id}`}>{r.requestNumber}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {r.customerType === "CIR" ? <Wifi className="h-3.5 w-3.5 text-purple-500" /> : r.customerType === "Corporate" ? <Building2 className="h-3.5 w-3.5 text-blue-500" /> : <Users className="h-3.5 w-3.5 text-green-500" />}
                    <span className="text-sm font-medium">{r.customerName}</span>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{r.customerType}</Badge></TableCell>
                <TableCell>
                  <Badge className={`text-[10px] ${r.changeType === "upgrade" ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"}`}>
                    {r.changeType === "upgrade" ? <ArrowUpCircle className="h-3 w-3 mr-1" /> : <ArrowDownCircle className="h-3 w-3 mr-1" />}
                    {r.changeType}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{r.currentPackageName || "—"}</TableCell>
                <TableCell className="text-sm font-medium">{r.newPackageName || "—"}</TableCell>
                <TableCell>
                  <span className={`text-sm font-semibold ${parseFloat(r.finalBillDifference || "0") > 0 ? "text-green-600" : "text-red-600"}`}>
                    {parseFloat(r.finalBillDifference || "0") > 0 ? "+" : ""}{r.finalBillDifference || "0"}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</TableCell>
                <TableCell><Badge className={`text-[10px] ${statusColors[r.status] || ""}`}>{statusLabels[r.status] || r.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setSelectedRequest(r); setDetailsOpen(true); }} data-testid={`button-view-${r.id}`}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700" onClick={() => openEditDialog(r)} data-testid={`button-edit-${r.id}`}><Edit className="h-3.5 w-3.5" /></Button>
                    {showActions === "pending" && (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600 hover:text-green-700" onClick={() => handleApprove(r)} data-testid={`button-approve-${r.id}`}><Check className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600 hover:text-red-700" onClick={() => { setSelectedRequest(r); setRejectDialogOpen(true); }} data-testid={`button-reject-${r.id}`}><X className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                    {showActions === "approved" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleMoveToImplementation(r)} data-testid={`button-implement-${r.id}`}><Settings className="h-3 w-3" />Implement</Button>
                    )}
                    {showActions === "implementing" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600" onClick={() => { setSelectedRequest(r); setImplementDialogOpen(true); }} data-testid={`button-complete-${r.id}`}><CheckCircle2 className="h-3 w-3" />Complete</Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (isLoading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );

  return (
    <div className="p-6 space-y-4" data-testid="package-change-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Package className="h-6 w-6 text-[#0057FF]" />
            Package Change & Bandwidth Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage upgrade/downgrade requests for all customer types</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/package-change-requests"] })} data-testid="button-refresh">
            <RefreshCw className="h-3.5 w-3.5" />Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "New Request", value: draftRequests.length, icon: Plus, gradient: "from-blue-500 to-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
          { label: "Pending Approval", value: pendingRequests.length, icon: Clock, gradient: "from-yellow-500 to-amber-500", bg: "bg-yellow-50 dark:bg-yellow-950/40" },
          { label: "Approved", value: approvedRequests.length, icon: Check, gradient: "from-green-500 to-emerald-500", bg: "bg-green-50 dark:bg-green-950/40" },
          { label: "Implementation", value: implementingRequests.length, icon: Settings, gradient: "from-indigo-500 to-blue-500", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
          { label: "Completed", value: completedRequests.length, icon: CheckCircle2, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          { label: "Rejected", value: rejectedRequests.length, icon: XCircle, gradient: "from-red-500 to-rose-500", bg: "bg-red-50 dark:bg-red-950/40" },
          { label: "Total", value: requests.length, icon: Package, gradient: "from-purple-500 to-violet-500", bg: "bg-purple-50 dark:bg-purple-950/40" },
        ].map((stat, i) => (
          <div key={i} className={`relative rounded-xl border border-border/60 ${stat.bg} p-3 overflow-hidden`} data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="flex items-center justify-between mb-1">
              <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-sm`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
            <div className="text-[10px] font-medium text-muted-foreground leading-tight">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-center transition-all ${activeTab === tab.key ? "bg-[#0057FF]/10 border-[#0057FF]/30 shadow-sm" : "bg-card hover:bg-muted/50 border-border/60"}`}
            data-testid={`tab-${tab.key}`}
          >
            <tab.icon className={`h-4 w-4 ${activeTab === tab.key ? "text-[#0057FF]" : tab.color}`} />
            <span className={`text-[10px] font-medium leading-tight ${activeTab === tab.key ? "text-[#0057FF]" : "text-muted-foreground"}`}>{tab.label}</span>
            {tab.count > 0 && <Badge className="text-[9px] h-4 px-1.5 bg-[#0057FF]/10 text-[#0057FF]">{tab.count}</Badge>}
          </button>
        ))}
      </div>

      {activeTab === "new_request" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4 bg-gradient-to-r from-[#1a56db] to-[#2563EB] text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center"><Plus className="h-5 w-5 text-white" /></div>
              <div><CardTitle className="text-base text-white">New Package Change Request</CardTitle><CardDescription className="text-blue-100">Create an upgrade or downgrade request</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Customer Type <span className="text-red-500">*</span></label>
                <Select value={customerType} onValueChange={v => { setCustomerType(v); setSelectedCustomer(null); setCustomerSearch(""); }}>
                  <SelectTrigger data-testid="select-customer-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Corporate">Corporate</SelectItem>
                    <SelectItem value="CIR">CIR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium">Customer Name / ID <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder={`Search ${customerType} customer by name or ID...`}
                    value={selectedCustomer ? selectedCustomer.name : customerSearch}
                    onChange={e => { setCustomerSearch(e.target.value); if (selectedCustomer) setSelectedCustomer(null); }}
                    data-testid="input-customer-search"
                  />
                  {filteredCustomerSearch.length > 0 && !selectedCustomer && (
                    <div className="absolute z-50 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredCustomerSearch.map(c => (
                        <button key={`${c.type}-${c.id}`} className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex items-center justify-between" onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); }}>
                          <span className="font-medium">{c.name}</span>
                          <Badge variant="outline" className="text-[10px]">ID: {c.id}</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedCustomer && (
              <>
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold">Current Plan Details</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Customer</p><p className="text-sm font-medium">{selectedCustomer.name}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Current Package</p><p className="text-sm font-medium">{currentPkg?.name || "Custom Plan"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Current Bandwidth</p><p className="text-sm font-medium">{currentPkg?.speed || selectedCustomer?.bandwidth || "—"}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Monthly Bill</p><p className="text-sm font-semibold text-green-600">Rs. {currentPrice.toLocaleString()}</p></div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-4"><ArrowUpCircle className="h-4 w-4 text-blue-600" /><span className="text-sm font-semibold">Change Details</span></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Change Type <span className="text-red-500">*</span></label>
                      <Select value={changeType} onValueChange={setChangeType}>
                        <SelectTrigger data-testid="select-change-type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upgrade">Upgrade</SelectItem>
                          <SelectItem value="downgrade">Downgrade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {customerType === "Normal" ? (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">New Package <span className="text-red-500">*</span></label>
                        <Select value={newPackageId} onValueChange={setNewPackageId}>
                          <SelectTrigger data-testid="select-new-package"><SelectValue placeholder="Select package" /></SelectTrigger>
                          <SelectContent>
                            {(packages || []).filter(p => p.isActive).map(p => (
                              <SelectItem key={p.id} value={String(p.id)}>{p.name} — Rs. {p.price} ({p.speed || "—"})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">New Bandwidth (Mbps) <span className="text-red-500">*</span></label>
                        <Input type="number" placeholder="e.g. 50" value={newBandwidth} onChange={e => setNewBandwidth(e.target.value)} data-testid="input-new-bandwidth" />
                      </div>
                    )}
                    {customerType === "Corporate" && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Or Select Package</label>
                        <Select value={newPackageId} onValueChange={v => { setNewPackageId(v); setNewBandwidth(""); }}>
                          <SelectTrigger data-testid="select-new-package-corp"><SelectValue placeholder="Select package (optional)" /></SelectTrigger>
                          <SelectContent>
                            {(packages || []).filter(p => p.isActive).map(p => (
                              <SelectItem key={p.id} value={String(p.id)}>{p.name} — Rs. {p.price}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Effective Date</label>
                    <Select value={effectiveDateType} onValueChange={setEffectiveDateType}>
                      <SelectTrigger data-testid="select-effective-date"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="next_billing">Next Billing Cycle</SelectItem>
                        <SelectItem value="custom">Custom Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {effectiveDateType === "custom" && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Custom Date</label>
                      <Input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} data-testid="input-custom-date" />
                    </div>
                  )}
                  <div className="space-y-1.5 flex items-end gap-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={isUrgent} onCheckedChange={setIsUrgent} data-testid="switch-urgent" />
                      <label className="text-sm font-medium flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />Urgent Request
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Reason for Change</label>
                  <Textarea rows={2} placeholder="Why is this change needed?" value={reason} onChange={e => setReason(e.target.value)} data-testid="input-reason" />
                </div>

                {(newPackageId || newBandwidth) && (
                  <div className="p-4 rounded-lg border-2 border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                    <div className="flex items-center gap-2 mb-3"><DollarSign className="h-4 w-4 text-blue-600" /><span className="text-sm font-semibold">Billing Preview</span></div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div><p className="text-[10px] text-muted-foreground uppercase">New Price</p><p className="text-sm font-bold">Rs. {newPrice.toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase">Prorated Charges</p><p className="text-sm font-medium">Rs. {Math.abs(priceDiff * 0.5).toFixed(0)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase">Adjustment</p><p className={`text-sm font-semibold ${priceDiff >= 0 ? "text-green-600" : "text-red-600"}`}>{priceDiff >= 0 ? "+" : ""}Rs. {priceDiff.toFixed(0)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase">Tax Impact</p><p className="text-sm font-medium">Rs. {taxImpact.toFixed(0)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase">Final Difference</p><p className={`text-sm font-bold ${priceDiff >= 0 ? "text-green-600" : "text-red-600"}`}>{priceDiff >= 0 ? "+" : ""}Rs. {(priceDiff + taxImpact).toFixed(0)}</p></div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => handleSubmitRequest(true)} disabled={createMutation.isPending} data-testid="button-save-draft">
                    <FileText className="h-4 w-4 mr-1.5" />Save Draft
                  </Button>
                  <Button className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] hover:from-[#001f42] hover:to-[#0044cc]" onClick={() => handleSubmitRequest(false)} disabled={createMutation.isPending} data-testid="button-submit-request">
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
                    Submit Request
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab !== "new_request" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 h-9" placeholder="Search requests..." value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-requests" />
            </div>
          </div>

          {activeTab === "pending" && renderRequestTable(pendingRequests, "pending")}
          {activeTab === "approved" && renderRequestTable(approvedRequests, "approved")}
          {activeTab === "implementing" && renderRequestTable(implementingRequests, "implementing")}
          {activeTab === "completed" && renderRequestTable(completedRequests, "none")}
          {activeTab === "rejected" && renderRequestTable(rejectedRequests, "none")}
          {activeTab === "history" && renderRequestTable(requests, "none")}
        </div>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#0057FF]" />
              Request Details — {selectedRequest?.requestNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={`${statusColors[selectedRequest.status] || ""}`}>{statusLabels[selectedRequest.status] || selectedRequest.status}</Badge>
                {selectedRequest.isUrgent && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"><Zap className="h-3 w-3 mr-1" />Urgent</Badge>}
                <Badge className={`${selectedRequest.changeType === "upgrade" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                  {selectedRequest.changeType === "upgrade" ? <ArrowUpCircle className="h-3 w-3 mr-1" /> : <ArrowDownCircle className="h-3 w-3 mr-1" />}
                  {selectedRequest.changeType}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border">
                <div><p className="text-[10px] text-muted-foreground uppercase">Customer</p><p className="text-sm font-medium">{selectedRequest.customerName}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase">Customer Type</p><p className="text-sm">{selectedRequest.customerType}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase">Current Package</p><p className="text-sm">{selectedRequest.currentPackageName || "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase">New Package</p><p className="text-sm font-semibold text-blue-600">{selectedRequest.newPackageName || "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase">Current Bill</p><p className="text-sm">Rs. {selectedRequest.currentMonthlyBill || "0"}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase">New Bill</p><p className="text-sm font-semibold">Rs. {selectedRequest.newMonthlyBill || "0"}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase">Adjustment</p><p className={`text-sm font-semibold ${parseFloat(selectedRequest.adjustmentAmount || "0") >= 0 ? "text-green-600" : "text-red-600"}`}>Rs. {selectedRequest.adjustmentAmount || "0"}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase">Effective Date</p><p className="text-sm">{selectedRequest.effectiveDate || selectedRequest.effectiveDateType || "Immediate"}</p></div>
              </div>

              {selectedRequest.reason && (
                <div className="p-3 rounded-lg bg-muted/20 border"><p className="text-[10px] text-muted-foreground uppercase mb-1">Reason</p><p className="text-sm">{selectedRequest.reason}</p></div>
              )}

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Audit Trail</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center"><Plus className="h-3 w-3 text-blue-600" /></div>
                    <span>Requested by <span className="font-medium">{selectedRequest.requestedBy || "—"}</span></span>
                    <span className="text-muted-foreground ml-auto text-xs">{selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : ""}</span>
                  </div>
                  {selectedRequest.approvedBy && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center"><Check className="h-3 w-3 text-green-600" /></div>
                      <span>Approved by <span className="font-medium">{selectedRequest.approvedBy}</span></span>
                      <span className="text-muted-foreground ml-auto text-xs">{selectedRequest.approvedAt ? new Date(selectedRequest.approvedAt).toLocaleString() : ""}</span>
                    </div>
                  )}
                  {selectedRequest.rejectedBy && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center"><X className="h-3 w-3 text-red-600" /></div>
                      <span>Rejected by <span className="font-medium">{selectedRequest.rejectedBy}</span></span>
                      <span className="text-muted-foreground ml-auto text-xs">{selectedRequest.rejectedAt ? new Date(selectedRequest.rejectedAt).toLocaleString() : ""}</span>
                    </div>
                  )}
                  {selectedRequest.implementedBy && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center"><Settings className="h-3 w-3 text-emerald-600" /></div>
                      <span>Implemented by <span className="font-medium">{selectedRequest.implementedBy}</span></span>
                      <span className="text-muted-foreground ml-auto text-xs">{selectedRequest.implementedAt ? new Date(selectedRequest.implementedAt).toLocaleString() : ""}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedRequest.status === "completed" && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-2"><Network className="h-4 w-4 text-emerald-600" /><span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Network Sync</span></div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-600" />Billing Updated</div>
                    <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-600" />Network Synced</div>
                    <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-600" />Notification Sent</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><XCircle className="h-5 w-5 text-red-500" />Reject Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Rejecting request <span className="font-semibold">{selectedRequest?.requestNumber}</span> for <span className="font-semibold">{selectedRequest?.customerName}</span></p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Rejection Reason <span className="text-red-500">*</span></label>
              <Textarea rows={3} placeholder="Provide reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} data-testid="input-reject-reason" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || updateMutation.isPending} data-testid="button-confirm-reject">
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <X className="h-4 w-4 mr-1.5" />}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={implementDialogOpen} onOpenChange={setImplementDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-emerald-500" />Complete Implementation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Completing implementation for <span className="font-semibold">{selectedRequest?.customerName}</span></p>
            <div className="p-3 rounded-lg bg-muted/30 border text-sm space-y-1">
              <p><span className="text-muted-foreground">Change:</span> {selectedRequest?.currentPackageName} → {selectedRequest?.newPackageName}</p>
              <p><span className="text-muted-foreground">Type:</span> {selectedRequest?.changeType}</p>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-medium">System will automatically:</p>
              <div className="space-y-1 pl-2">
                <div className="flex items-center gap-2"><Server className="h-3 w-3 text-blue-500" />Update MikroTik / Radius / BRAS profile</div>
                <div className="flex items-center gap-2"><DollarSign className="h-3 w-3 text-green-500" />Update billing plan & generate adjustment invoice</div>
                <div className="flex items-center gap-2"><Send className="h-3 w-3 text-purple-500" />Send notification to customer & staff</div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Implementation Notes</label>
              <Textarea rows={2} placeholder="Any additional notes..." value={implementNotes} onChange={e => setImplementNotes(e.target.value)} data-testid="input-implement-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImplementDialogOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleImplement} disabled={updateMutation.isPending} data-testid="button-confirm-implement">
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
              Complete & Sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-[#0057FF]" />
              Edit Request — {selectedRequest?.requestNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Customer Name</label>
                <Input value={editData.customerName || ""} onChange={e => setEditData({ ...editData, customerName: e.target.value })} data-testid="edit-customer-name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Change Type</label>
                <Select value={editData.changeType || "upgrade"} onValueChange={v => setEditData({ ...editData, changeType: v })}>
                  <SelectTrigger data-testid="edit-change-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upgrade">Upgrade</SelectItem>
                    <SelectItem value="downgrade">Downgrade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Current Plan</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Current Package</label>
                  <Input className="h-8 text-xs" value={editData.currentPackageName || ""} onChange={e => setEditData({ ...editData, currentPackageName: e.target.value })} data-testid="edit-current-package" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Current Bandwidth</label>
                  <Input className="h-8 text-xs" value={editData.currentBandwidth || ""} onChange={e => setEditData({ ...editData, currentBandwidth: e.target.value })} data-testid="edit-current-bw" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Current Monthly Bill</label>
                  <Input className="h-8 text-xs" value={editData.currentMonthlyBill || ""} onChange={e => setEditData({ ...editData, currentMonthlyBill: e.target.value })} data-testid="edit-current-bill" />
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-4 space-y-3 bg-blue-50/50 dark:bg-blue-950/20">
              <p className="text-xs font-semibold text-muted-foreground uppercase">New Plan</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">New Package</label>
                  <Input className="h-8 text-xs" value={editData.newPackageName || ""} onChange={e => setEditData({ ...editData, newPackageName: e.target.value })} data-testid="edit-new-package" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">New Bandwidth</label>
                  <Input className="h-8 text-xs" value={editData.newBandwidth || ""} onChange={e => setEditData({ ...editData, newBandwidth: e.target.value })} data-testid="edit-new-bw" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">New Monthly Bill</label>
                  <Input className="h-8 text-xs" value={editData.newMonthlyBill || ""} onChange={e => setEditData({ ...editData, newMonthlyBill: e.target.value })} data-testid="edit-new-bill" />
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Financial Details</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Prorated Charges</label>
                  <Input className="h-8 text-xs" value={editData.proratedCharges || ""} onChange={e => setEditData({ ...editData, proratedCharges: e.target.value })} data-testid="edit-prorated" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Adjustment</label>
                  <Input className="h-8 text-xs" value={editData.adjustmentAmount || ""} onChange={e => setEditData({ ...editData, adjustmentAmount: e.target.value })} data-testid="edit-adjustment" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Tax Impact</label>
                  <Input className="h-8 text-xs" value={editData.taxImpact || ""} onChange={e => setEditData({ ...editData, taxImpact: e.target.value })} data-testid="edit-tax" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Final Difference</label>
                  <Input className="h-8 text-xs" value={editData.finalBillDifference || ""} onChange={e => setEditData({ ...editData, finalBillDifference: e.target.value })} data-testid="edit-final-diff" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Effective Date Type</label>
                <Select value={editData.effectiveDateType || "immediate"} onValueChange={v => setEditData({ ...editData, effectiveDateType: v })}>
                  <SelectTrigger data-testid="edit-effective-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="next_billing">Next Billing Cycle</SelectItem>
                    <SelectItem value="custom">Custom Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editData.effectiveDateType === "custom" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Effective Date</label>
                  <Input type="date" value={editData.effectiveDate || ""} onChange={e => setEditData({ ...editData, effectiveDate: e.target.value })} data-testid="edit-effective-date" />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Reason</label>
              <Textarea rows={2} value={editData.reason || ""} onChange={e => setEditData({ ...editData, reason: e.target.value })} data-testid="edit-reason" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editData.isUrgent || false} onCheckedChange={v => setEditData({ ...editData, isUrgent: v })} data-testid="edit-urgent" />
              <label className="text-sm font-medium">Mark as Urgent</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#0057FF] hover:bg-[#0044cc]" onClick={handleEditSave} disabled={updateMutation.isPending} data-testid="button-save-edit">
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
