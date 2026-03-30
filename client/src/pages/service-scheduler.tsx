import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  CalendarRange, Search, Plus, Check, X, Clock, Loader2,
  Eye, Zap, Calendar, AlertTriangle, Send, Shield, Settings,
  FileText, Filter, RefreshCw, Package, Building2, Wifi, Users,
  History, CheckCircle2, XCircle, ArrowRight, Wrench, Router,
  Cable, Radio, MapPin, Power, PowerOff, HardDrive, MoreHorizontal,
  AlertCircle, TrendingUp, TrendingDown,
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
import type { ServiceSchedulerRequest, Package as PkgType } from "@shared/schema";

const statusColors: Record<string, string> = {
  pending: "text-yellow-700 bg-yellow-50 dark:text-yellow-300 dark:bg-yellow-950",
  approved: "text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-950",
  in_progress: "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950",
  completed: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950",
  rejected: "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950",
  cancelled: "text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const serviceTypeOptions = [
  { value: "package_upgrade", label: "Package Upgrade", icon: TrendingUp, color: "text-green-600" },
  { value: "package_downgrade", label: "Package Downgrade", icon: TrendingDown, color: "text-orange-600" },
  { value: "installation", label: "New Installation", icon: HardDrive, color: "text-blue-600" },
  { value: "maintenance", label: "Maintenance", icon: Wrench, color: "text-amber-600" },
  { value: "equipment_new", label: "New Equipment", icon: Router, color: "text-indigo-600" },
  { value: "equipment_replace", label: "Replace Equipment", icon: RefreshCw, color: "text-purple-600" },
  { value: "relocation", label: "Relocation", icon: MapPin, color: "text-teal-600" },
  { value: "troubleshooting", label: "Troubleshooting", icon: AlertCircle, color: "text-red-500" },
  { value: "disconnection", label: "Disconnection", icon: PowerOff, color: "text-red-600" },
  { value: "reconnection", label: "Reconnection", icon: Power, color: "text-green-700" },
  { value: "other", label: "Other Request", icon: MoreHorizontal, color: "text-gray-600" },
];

const priorityColors: Record<string, string> = {
  low: "text-green-600 border-green-300 bg-green-50",
  normal: "text-blue-600 border-blue-300 bg-blue-50",
  medium: "text-amber-600 border-amber-300 bg-amber-50",
  high: "text-orange-600 border-orange-300 bg-orange-50",
  urgent: "text-red-600 border-red-300 bg-red-50",
};

const equipmentTypes = [
  { value: "router", label: "Router" },
  { value: "onu", label: "ONU/ONT" },
  { value: "switch", label: "Network Switch" },
  { value: "cable", label: "Cable/Fiber" },
  { value: "antenna", label: "Antenna" },
  { value: "ups", label: "UPS/Power Backup" },
  { value: "media_converter", label: "Media Converter" },
  { value: "other", label: "Other" },
];

export default function ServiceSchedulerPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("new_request");
  const [search, setSearch] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerType, setCustomerType] = useState("Normal");
  const [serviceType, setServiceType] = useState("installation");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("normal");
  const [description, setDescription] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [equipmentType, setEquipmentType] = useState("");
  const [effectiveMonth, setEffectiveMonth] = useState("current_month");

  const { data: allRequests, isLoading } = useQuery<any[]>({
    queryKey: ["/api/service-scheduler-requests"],
  });
  const { data: packages } = useQuery<PkgType[]>({ queryKey: ["/api/packages"] });
  const { data: customers } = useQuery<any[]>({ queryKey: ["/api/customers"] });
  const { data: cirCustomers } = useQuery<any[]>({ queryKey: ["/api/cir-customers"] });
  const { data: corporateCustomers } = useQuery<any[]>({ queryKey: ["/api/corporate-customers"] });

  const urlParams = new URLSearchParams(window.location.search);
  const preCustomerType = urlParams.get("customerType");
  const preCustomerId = urlParams.get("customerId");
  const preCustomerName = urlParams.get("customerName");

  useState(() => {
    if (preCustomerType && preCustomerId && preCustomerName) {
      setCustomerType(preCustomerType);
      setSelectedCustomer({
        id: parseInt(preCustomerId),
        name: preCustomerName,
        type: preCustomerType,
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/service-scheduler-requests", data),
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-scheduler-requests"] });
      if (variables.customerId && variables.customerType === "Normal") {
        queryClient.invalidateQueries({ queryKey: ["/api/customers", String(variables.customerId), "service-requests"] });
      }
      if (variables.customerId && variables.customerType === "CIR") {
        queryClient.invalidateQueries({ queryKey: ["/api/cir-customers", String(variables.resolvedCustomerId || variables.customerId), "service-requests"] });
      }
      if (variables.customerId && variables.customerType === "Corporate") {
        queryClient.invalidateQueries({ queryKey: ["/api/corporate-customers", String(variables.resolvedCustomerId || variables.customerId), "service-requests"] });
      }
      toast({ title: "Service Request Created", description: "Service scheduler request has been submitted successfully." });
      resetForm();
      setActiveTab("pending");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/service-scheduler-requests/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-scheduler-requests"] });
      toast({ title: "Updated", description: "Service request has been updated." });
      setDetailsOpen(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/service-scheduler-requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-scheduler-requests"] });
      toast({ title: "Deleted", description: "Service request has been deleted." });
    },
  });

  const resetForm = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setServiceType("installation");
    setScheduledDate("");
    setScheduledTime("10:00");
    setAssignedTo("");
    setPriority("normal");
    setDescription("");
    setIsUrgent(false);
    setSelectedPackageId("");
    setEquipmentType("");
    setEffectiveMonth("current_month");
  };

  const customerSearchResults = useMemo(() => {
    if (!customerSearch || customerSearch.length < 2) return [];
    const q = customerSearch.toLowerCase();
    const results: any[] = [];
    if (customerType === "Normal") {
      (customers || []).forEach(c => {
        if ((c.fullName || c.name || "").toLowerCase().includes(q) || (c.customerId || "").toLowerCase().includes(q)) {
          results.push({ id: c.id, name: c.fullName || c.name, customerId: c.customerId, type: "Normal", packageId: c.packageId });
        }
      });
    } else if (customerType === "CIR") {
      (cirCustomers || []).forEach(c => {
        if ((c.companyName || "").toLowerCase().includes(q) || (c.contactPerson || "").toLowerCase().includes(q)) {
          results.push({ id: c.id, name: c.companyName, type: "CIR", bandwidth: c.committedBandwidth });
        }
      });
    } else {
      (corporateCustomers || []).forEach(c => {
        if ((c.companyName || "").toLowerCase().includes(q) || (c.contactFullName || "").toLowerCase().includes(q)) {
          results.push({ id: c.id, name: c.companyName, type: "Corporate", bandwidth: c.totalBandwidth });
        }
      });
    }
    return results.slice(0, 8);
  }, [customerSearch, customerType, customers, cirCustomers, corporateCustomers]);

  const handleSubmitRequest = () => {
    if (!selectedCustomer) {
      toast({ title: "Select Customer", description: "Please search and select a customer.", variant: "destructive" });
      return;
    }
    if (!serviceType) {
      toast({ title: "Select Service Type", description: "Please select a service type.", variant: "destructive" });
      return;
    }
    if (!scheduledDate) {
      toast({ title: "Select Date", description: "Please select a scheduled date.", variant: "destructive" });
      return;
    }

    const svcLabel = serviceTypeOptions.find(o => o.value === serviceType)?.label || serviceType;
    const data: any = {
      customerId: selectedCustomer.id,
      customerType,
      customerName: selectedCustomer.name,
      requestType: serviceType,
      scheduledDate: `${scheduledDate}T${scheduledTime}`,
      assignedTo: assignedTo || null,
      priority,
      description: description || `[${svcLabel}] Scheduled service request`,
      status: "pending",
      isUrgent,
      effectiveMonth: effectiveMonth || null,
    };

    if ((serviceType === "package_upgrade" || serviceType === "package_downgrade") && selectedPackageId) {
      data.requestedPackageId = parseInt(selectedPackageId);
      if (selectedCustomer.packageId) data.currentPackageId = selectedCustomer.packageId;
    }
    if ((serviceType === "equipment_new" || serviceType === "equipment_replace") && equipmentType) {
      data.equipmentType = equipmentType;
      data.equipmentAction = serviceType === "equipment_replace" ? "replace" : "new";
    }

    createMutation.mutate(data);
  };

  const requests = allRequests || [];
  const pendingRequests = requests.filter(r => r.status === "pending");
  const approvedRequests = requests.filter(r => r.status === "approved");
  const inProgressRequests = requests.filter(r => r.status === "in_progress");
  const completedRequests = requests.filter(r => r.status === "completed");
  const rejectedRequests = requests.filter(r => r.status === "rejected");

  const tabs = [
    { key: "new_request", label: "New Request", icon: Plus, count: 0, color: "text-blue-600" },
    { key: "pending", label: "Pending", icon: Clock, count: pendingRequests.length, color: "text-yellow-600" },
    { key: "approved", label: "Approved", icon: Check, count: approvedRequests.length, color: "text-green-600" },
    { key: "in_progress", label: "In Progress", icon: Settings, count: inProgressRequests.length, color: "text-blue-600" },
    { key: "completed", label: "Completed", icon: CheckCircle2, count: completedRequests.length, color: "text-emerald-600" },
    { key: "rejected", label: "Rejected", icon: XCircle, count: rejectedRequests.length, color: "text-red-600" },
    { key: "history", label: "All History", icon: History, count: requests.length, color: "text-purple-600" },
  ];

  const getServiceTypeLabel = (val: string) => serviceTypeOptions.find(o => o.value === val)?.label || val;

  const renderRequestTable = (data: any[], showActions: string) => {
    const filtered = data.filter(r => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (r.customerName || "").toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q) || (r.requestType || "").toLowerCase().includes(q) || (r.assignedTo || "").toLowerCase().includes(q);
    });

    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#1a3a5c]">
              <TableHead className="text-white text-xs font-semibold">ID</TableHead>
              <TableHead className="text-white text-xs font-semibold">Customer</TableHead>
              <TableHead className="text-white text-xs font-semibold">Type</TableHead>
              <TableHead className="text-white text-xs font-semibold">Service Type</TableHead>
              <TableHead className="text-white text-xs font-semibold">Scheduled Date</TableHead>
              <TableHead className="text-white text-xs font-semibold">Assigned To</TableHead>
              <TableHead className="text-white text-xs font-semibold">Priority</TableHead>
              <TableHead className="text-white text-xs font-semibold">Status</TableHead>
              <TableHead className="text-white text-xs font-semibold">Created</TableHead>
              <TableHead className="text-white text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No requests found</TableCell></TableRow>
            ) : filtered.map((r, idx) => (
              <TableRow key={r.id} className={`hover:bg-muted/30 cursor-pointer ${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}`} onClick={() => { setSelectedRequest(r); setDetailsOpen(true); }}>
                <TableCell className="font-mono text-xs text-blue-600" data-testid={`text-sr-id-${r.id}`}>SR-{r.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {r.customerType === "CIR" ? <Wifi className="h-3.5 w-3.5 text-purple-500" /> : r.customerType === "Corporate" ? <Building2 className="h-3.5 w-3.5 text-blue-500" /> : <Users className="h-3.5 w-3.5 text-green-500" />}
                    <span className="text-sm font-medium">{r.customerName || "—"}</span>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{r.customerType || "Normal"}</Badge></TableCell>
                <TableCell className="text-xs font-medium capitalize">{getServiceTypeLabel(r.requestType)}</TableCell>
                <TableCell className="text-xs">{r.scheduledDate || r.effectiveMonth ? new Date(r.scheduledDate || r.effectiveMonth).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</TableCell>
                <TableCell className="text-xs">{r.assignedTo || r.requestedBy || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] capitalize ${priorityColors[r.priority] || priorityColors.normal}`}>{r.priority}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`text-[10px] capitalize ${statusColors[r.status] || statusColors.pending}`}>{statusLabels[r.status] || r.status}</Badge>
                </TableCell>
                <TableCell className="text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setSelectedRequest(r); setDetailsOpen(true); }} data-testid={`button-view-sr-${r.id}`}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {showActions === "pending" && (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600" onClick={() => updateMutation.mutate({ id: r.id, data: { status: "approved" } })} data-testid={`button-approve-sr-${r.id}`}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={() => updateMutation.mutate({ id: r.id, data: { status: "rejected" } })} data-testid={`button-reject-sr-${r.id}`}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    {showActions === "approved" && (
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-blue-600 text-[10px]" onClick={() => updateMutation.mutate({ id: r.id, data: { status: "in_progress" } })} data-testid={`button-start-sr-${r.id}`}>
                        <ArrowRight className="h-3 w-3 mr-1" /> Start
                      </Button>
                    )}
                    {showActions === "in_progress" && (
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-emerald-600 text-[10px]" onClick={() => updateMutation.mutate({ id: r.id, data: { status: "completed", processedAt: new Date().toISOString() } })} data-testid={`button-complete-sr-${r.id}`}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                      </Button>
                    )}
                    {(showActions === "pending" || showActions === "history") && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteMutation.mutate(r.id)} data-testid={`button-delete-sr-${r.id}`}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
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

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/10">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="heading-service-scheduler">
              <CalendarRange className="h-6 w-6 text-[#0057FF]" />
              Service Scheduler Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage service requests, installations, maintenance, and equipment operations across all customer types</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/service-scheduler-requests"] })} data-testid="button-refresh-sr">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white">
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 opacity-80" />
              <p className="text-2xl font-bold">{pendingRequests.length}</p>
              <p className="text-[10px] uppercase opacity-80">Pending</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-4 text-center">
              <Check className="h-5 w-5 mx-auto mb-1 opacity-80" />
              <p className="text-2xl font-bold">{approvedRequests.length}</p>
              <p className="text-[10px] uppercase opacity-80">Approved</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <CardContent className="p-4 text-center">
              <Settings className="h-5 w-5 mx-auto mb-1 opacity-80" />
              <p className="text-2xl font-bold">{inProgressRequests.length}</p>
              <p className="text-[10px] uppercase opacity-80">In Progress</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-5 w-5 mx-auto mb-1 opacity-80" />
              <p className="text-2xl font-bold">{completedRequests.length}</p>
              <p className="text-[10px] uppercase opacity-80">Completed</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white">
            <CardContent className="p-4 text-center">
              <XCircle className="h-5 w-5 mx-auto mb-1 opacity-80" />
              <p className="text-2xl font-bold">{rejectedRequests.length}</p>
              <p className="text-[10px] uppercase opacity-80">Rejected</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white">
            <CardContent className="p-4 text-center">
              <History className="h-5 w-5 mx-auto mb-1 opacity-80" />
              <p className="text-2xl font-bold">{requests.length}</p>
              <p className="text-[10px] uppercase opacity-80">Total</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b pb-0.5">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-t-lg transition-all whitespace-nowrap ${
                activeTab === t.key
                  ? "bg-white dark:bg-slate-900 border border-b-white dark:border-b-slate-900 text-foreground shadow-sm -mb-[1px]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              data-testid={`tab-${t.key}`}
            >
              <t.icon className={`h-3.5 w-3.5 ${activeTab === t.key ? t.color : ""}`} />
              {t.label}
              {t.count > 0 && <Badge variant="secondary" className={`text-[9px] h-4 px-1 ${activeTab === t.key ? t.color : ""}`}>{t.count}</Badge>}
            </button>
          ))}
        </div>

        {activeTab !== "new_request" && (
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search requests..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-sr" />
            </div>
          </div>
        )}

        {activeTab === "new_request" && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-4 bg-gradient-to-r from-[#002B5B] to-[#005EFF] text-white rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2"><Plus className="h-5 w-5" /> New Service Request</CardTitle>
              <CardDescription className="text-blue-100">Create a service request for any customer type</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4"><Users className="h-4 w-4 text-blue-600" /><span className="text-sm font-semibold">Customer Selection</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium">Customer Type <span className="text-red-500">*</span></span>
                    <Select value={customerType} onValueChange={v => { setCustomerType(v); setSelectedCustomer(null); setCustomerSearch(""); }}>
                      <SelectTrigger data-testid="select-customer-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Normal">Normal Customer</SelectItem>
                        <SelectItem value="CIR">CIR Customer</SelectItem>
                        <SelectItem value="Corporate">Corporate Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <span className="text-sm font-medium">Search Customer <span className="text-red-500">*</span></span>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={`Search ${customerType.toLowerCase()} customer by name...`}
                        className="pl-9"
                        value={selectedCustomer ? selectedCustomer.name : customerSearch}
                        onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomer(null); }}
                        data-testid="input-search-customer"
                      />
                      {customerSearchResults.length > 0 && !selectedCustomer && (
                        <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {customerSearchResults.map(c => (
                            <button
                              key={c.id}
                              onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); }}
                              className="w-full p-3 text-left hover:bg-muted/50 flex items-center justify-between text-sm border-b last:border-0"
                              data-testid={`customer-result-${c.id}`}
                            >
                              <div className="flex items-center gap-2">
                                {customerType === "CIR" ? <Wifi className="h-3.5 w-3.5 text-purple-500" /> : customerType === "Corporate" ? <Building2 className="h-3.5 w-3.5 text-blue-500" /> : <Users className="h-3.5 w-3.5 text-green-500" />}
                                <span className="font-medium">{c.name}</span>
                              </div>
                              {c.customerId && <span className="text-xs text-muted-foreground">{c.customerId}</span>}
                              {c.bandwidth && <span className="text-xs text-muted-foreground">{c.bandwidth}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {selectedCustomer && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">{selectedCustomer.name}</span>
                      <Badge variant="outline" className="text-[10px]">{customerType}</Badge>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }} data-testid="button-clear-customer">Clear</Button>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 mb-4"><CalendarRange className="h-4 w-4 text-blue-600" /><span className="text-sm font-semibold">Service Details</span></div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium mb-2 block">Service Type <span className="text-red-500">*</span></span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {serviceTypeOptions.map(opt => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setServiceType(opt.value)}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              serviceType === opt.value
                                ? "border-[#0057FF] bg-blue-50 dark:bg-blue-950 ring-1 ring-[#0057FF]"
                                : "border-border hover:border-muted-foreground/40"
                            }`}
                            data-testid={`btn-svc-${opt.value}`}
                          >
                            <Icon className={`h-4 w-4 mb-1 ${serviceType === opt.value ? opt.color : "text-muted-foreground"}`} />
                            <div className="text-xs font-medium">{opt.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {(serviceType === "package_upgrade" || serviceType === "package_downgrade") && customerType === "Normal" && (
                    <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                      <span className="text-sm font-semibold">{serviceType === "package_upgrade" ? "Upgrade To" : "Downgrade To"}</span>
                      <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                        <SelectTrigger data-testid="select-sr-package"><SelectValue placeholder="Select a package" /></SelectTrigger>
                        <SelectContent>
                          {packages?.filter(p => p.isActive !== false).map(p => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.name} — {p.speed || "N/A"} (Rs. {p.price || "N/A"})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(serviceType === "equipment_new" || serviceType === "equipment_replace") && (
                    <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
                      <span className="text-sm font-semibold">Equipment Type</span>
                      <Select value={equipmentType} onValueChange={setEquipmentType}>
                        <SelectTrigger data-testid="select-equipment"><SelectValue placeholder="Select equipment type" /></SelectTrigger>
                        <SelectContent>
                          {equipmentTypes.map(e => (
                            <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {serviceType === "equipment_replace" && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                            Equipment replacement request — old equipment will need to be returned or marked as faulty.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-sm font-medium">Scheduled Date <span className="text-red-500">*</span></span>
                      <Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} data-testid="input-scheduled-date" />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-sm font-medium">Scheduled Time</span>
                      <Input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} data-testid="input-scheduled-time" />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-sm font-medium">Assign To</span>
                      <Input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="Technician or staff name..." data-testid="input-assigned-to" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-sm font-medium">Priority</span>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger data-testid="select-priority"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-sm font-medium">Effective Period</span>
                      <Select value={effectiveMonth} onValueChange={setEffectiveMonth}>
                        <SelectTrigger data-testid="select-effective-period"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="current_month">Current Month</SelectItem>
                          <SelectItem value="next_month">Next Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-3 pb-1">
                      <div className="flex items-center gap-2">
                        <Switch checked={isUrgent} onCheckedChange={setIsUrgent} data-testid="switch-urgent" />
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Zap className={`h-3.5 w-3.5 ${isUrgent ? "text-red-500" : "text-muted-foreground"}`} />
                          Urgent Request
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-sm font-medium">Description / Notes</span>
                    <Textarea
                      placeholder="Add any additional details about this service request..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="min-h-[100px]"
                      data-testid="textarea-description"
                    />
                  </div>
                </div>
              </div>

              <Separator />
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={resetForm} data-testid="button-reset-form">Reset</Button>
                <Button className="bg-gradient-to-r from-[#002B5B] to-[#005EFF] hover:from-[#001f42] hover:to-[#0044cc]" onClick={handleSubmitRequest} disabled={createMutation.isPending} data-testid="button-submit-sr">
                  {createMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : <><Send className="h-4 w-4 mr-2" /> Submit Service Request</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "pending" && renderRequestTable(pendingRequests, "pending")}
        {activeTab === "approved" && renderRequestTable(approvedRequests, "approved")}
        {activeTab === "in_progress" && renderRequestTable(inProgressRequests, "in_progress")}
        {activeTab === "completed" && renderRequestTable(completedRequests, "completed")}
        {activeTab === "rejected" && renderRequestTable(rejectedRequests, "rejected")}
        {activeTab === "history" && renderRequestTable(requests, "history")}

        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-[#0057FF]" />
                Service Request Details — SR-{selectedRequest?.id}
              </DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-[10px] text-muted-foreground uppercase">Customer</p><p className="text-sm font-medium">{selectedRequest.customerName || "—"}</p></div>
                  <div><p className="text-[10px] text-muted-foreground uppercase">Type</p><Badge variant="outline" className="text-[10px]">{selectedRequest.customerType || "Normal"}</Badge></div>
                  <div><p className="text-[10px] text-muted-foreground uppercase">Service Type</p><p className="text-sm font-medium capitalize">{getServiceTypeLabel(selectedRequest.requestType)}</p></div>
                  <div><p className="text-[10px] text-muted-foreground uppercase">Priority</p><Badge variant="outline" className={`text-[10px] capitalize ${priorityColors[selectedRequest.priority] || priorityColors.normal}`}>{selectedRequest.priority}</Badge></div>
                  <div><p className="text-[10px] text-muted-foreground uppercase">Status</p><Badge variant="secondary" className={`text-[10px] capitalize ${statusColors[selectedRequest.status] || statusColors.pending}`}>{statusLabels[selectedRequest.status] || selectedRequest.status}</Badge></div>
                  <div><p className="text-[10px] text-muted-foreground uppercase">Assigned To</p><p className="text-sm">{selectedRequest.assignedTo || selectedRequest.requestedBy || "—"}</p></div>
                  <div><p className="text-[10px] text-muted-foreground uppercase">Scheduled Date</p><p className="text-sm">{selectedRequest.scheduledDate || selectedRequest.effectiveMonth || "—"}</p></div>
                  <div><p className="text-[10px] text-muted-foreground uppercase">Created</p><p className="text-sm">{selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p></div>
                </div>
                {selectedRequest.description && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Description</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg border">{selectedRequest.description}</p>
                  </div>
                )}
                {selectedRequest.processedAt && (
                  <div><p className="text-[10px] text-muted-foreground uppercase">Processed At</p><p className="text-sm">{new Date(selectedRequest.processedAt).toLocaleString()}</p></div>
                )}
              </div>
            )}
            <DialogFooter>
              {selectedRequest?.status === "pending" && (
                <>
                  <Button variant="outline" className="text-red-600" onClick={() => { updateMutation.mutate({ id: selectedRequest.id, data: { status: "rejected" } }); }} data-testid="button-detail-reject">Reject</Button>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => { updateMutation.mutate({ id: selectedRequest.id, data: { status: "approved" } }); }} data-testid="button-detail-approve">Approve</Button>
                </>
              )}
              {selectedRequest?.status === "approved" && (
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { updateMutation.mutate({ id: selectedRequest.id, data: { status: "in_progress" } }); }} data-testid="button-detail-start">Start Work</Button>
              )}
              {selectedRequest?.status === "in_progress" && (
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { updateMutation.mutate({ id: selectedRequest.id, data: { status: "completed", processedAt: new Date().toISOString() } }); }} data-testid="button-detail-complete">Mark Complete</Button>
              )}
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
