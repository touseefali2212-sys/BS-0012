import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Wifi,
  WifiOff,
  Edit,
  Plus,
  Trash2,
  FileText,
  Hash,
  CreditCard,
  AlertCircle,
  Network,
  StickyNote,
  Save,
  Download,
  MessageCircle,
  CalendarRange,
  ChevronRight,
  Shield,
  Globe,
  Eye,
  EyeOff,
  Clock,
  Settings,
  Package,
  RefreshCw,
  Bell,
  Calculator,
  Building2,
  Smartphone,
  LocateFixed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  type Customer,
  type Invoice,
  type Ticket,
  type CustomerConnection,
  type InsertCustomerConnection,
  insertCustomerConnectionSchema,
  type Package as PackageType,
  type Vendor,
} from "@shared/schema";

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("service");
  const [notes, setNotes] = useState("");
  const [notesEditing, setNotesEditing] = useState(false);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<CustomerConnection | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [gpsLat, setGpsLat] = useState("");
  const [gpsLng, setGpsLng] = useState("");
  const [gpsLocating, setGpsLocating] = useState(false);

  const { data: customer, isLoading: customerLoading } = useQuery<Customer>({
    queryKey: ["/api/customers", id],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch customer");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: packages } = useQuery<PackageType[]>({
    queryKey: ["/api/packages"],
  });

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/customers", id, "invoices"],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}/invoices`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: tickets, isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/customers", id, "tickets"],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}/tickets`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: connections, isLoading: connectionsLoading } = useQuery<CustomerConnection[]>({
    queryKey: ["/api/customers", id, "connections"],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}/connections`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!id,
  });

  const statusUpdateMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PATCH", `/api/customers/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const notesMutation = useMutation({
    mutationFn: async (notesValue: string) => {
      const res = await apiRequest("PATCH", `/api/customers/${id}`, { notes: notesValue });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", id] });
      setNotesEditing(false);
      toast({ title: "Notes saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const gpsMutation = useMutation({
    mutationFn: async ({ lat, lng }: { lat: string; lng: string }) => {
      const res = await apiRequest("PATCH", `/api/customers/${id}`, {
        mapLatitude: lat,
        mapLongitude: lng,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", id] });
      toast({ title: "GPS coordinates saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error saving GPS", description: error.message, variant: "destructive" });
    },
  });

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", description: "Your browser does not support GPS.", variant: "destructive" });
      return;
    }
    setGpsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLat(String(pos.coords.latitude));
        setGpsLng(String(pos.coords.longitude));
        setGpsLocating(false);
        toast({ title: "Location detected", description: `Lat: ${pos.coords.latitude.toFixed(6)}, Lng: ${pos.coords.longitude.toFixed(6)}` });
      },
      (err) => {
        setGpsLocating(false);
        toast({ title: "GPS error", description: err.message, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Sync GPS fields when customer data loads
  const customerGpsLat = (customer as any)?.mapLatitude || "";
  const customerGpsLng = (customer as any)?.mapLongitude || "";

  const connectionForm = useForm<InsertCustomerConnection>({
    resolver: zodResolver(insertCustomerConnectionSchema),
    defaultValues: {
      customerId: parseInt(id || "0"),
      username: "",
      ipAddress: "",
      macAddress: "",
      onuSerial: "",
      routerModel: "",
      routerSerial: "",
      connectionType: "fiber",
      port: "",
      vlan: "",
      installDate: "",
      status: "active",
    },
  });

  const createConnectionMutation = useMutation({
    mutationFn: async (data: InsertCustomerConnection) => {
      const res = await apiRequest("POST", "/api/customer-connections", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", id, "connections"] });
      setConnectionDialogOpen(false);
      setEditingConnection(null);
      connectionForm.reset({ customerId: parseInt(id || "0"), connectionType: "fiber", status: "active" });
      toast({ title: "Connection added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateConnectionMutation = useMutation({
    mutationFn: async ({ connId, data }: { connId: number; data: Partial<InsertCustomerConnection> }) => {
      const res = await apiRequest("PATCH", `/api/customer-connections/${connId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", id, "connections"] });
      setConnectionDialogOpen(false);
      setEditingConnection(null);
      connectionForm.reset({ customerId: parseInt(id || "0"), connectionType: "fiber", status: "active" });
      toast({ title: "Connection updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: async (connId: number) => {
      await apiRequest("DELETE", `/api/customer-connections/${connId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", id, "connections"] });
      toast({ title: "Connection deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openAddConnection = () => {
    setEditingConnection(null);
    connectionForm.reset({
      customerId: parseInt(id || "0"),
      username: "",
      ipAddress: "",
      macAddress: "",
      onuSerial: "",
      routerModel: "",
      routerSerial: "",
      connectionType: "fiber",
      port: "",
      vlan: "",
      installDate: "",
      status: "active",
    });
    setConnectionDialogOpen(true);
  };

  const openEditConnection = (conn: CustomerConnection) => {
    setEditingConnection(conn);
    connectionForm.reset({
      customerId: conn.customerId,
      username: conn.username || "",
      ipAddress: conn.ipAddress || "",
      macAddress: conn.macAddress || "",
      onuSerial: conn.onuSerial || "",
      routerModel: conn.routerModel || "",
      routerSerial: conn.routerSerial || "",
      connectionType: conn.connectionType || "fiber",
      port: conn.port || "",
      vlan: conn.vlan || "",
      installDate: conn.installDate || "",
      status: conn.status,
    });
    setConnectionDialogOpen(true);
  };

  const onConnectionSubmit = (data: InsertCustomerConnection) => {
    if (editingConnection) {
      updateConnectionMutation.mutate({ connId: editingConnection.id, data });
    } else {
      createConnectionMutation.mutate({ ...data, customerId: parseInt(id || "0") });
    }
  };

  const customerPackage = packages?.find((p) => p.id === customer?.packageId);
  const customerVendor = vendors?.find((v) => v.id === customer?.vendorId);

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return d;
    }
  };

  const tabs = [
    { key: "service", label: "Service Information" },
    { key: "network", label: "Network & Infrastructure" },
    { key: "personal", label: "Personal Information" },
    { key: "documents", label: "Documents" },
    { key: "invoices", label: "Generated & Updated Bill/Invoices" },
    { key: "received", label: "Received Bill History" },
    { key: "complain", label: "Complain History" },
    { key: "remarks", label: "Remarks History" },
    { key: "messages", label: "Message History" },
    { key: "changelog", label: "Customer Change Log" },
    { key: "enablelog", label: "Customer Enable/Disable Log" },
    { key: "sales", label: "Product & Service Sales Invoices" },
  ];

  if (customerLoading) {
    return (
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-6">
          <Skeleton className="h-[500px] w-[280px] shrink-0" />
          <Skeleton className="h-[500px] flex-1" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        <Link href="/customers">
          <Button variant="ghost" data-testid="button-back-customers">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Customers
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">Customer not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-[#0057FF]" />
          <h1 className="text-lg font-bold" data-testid="text-page-title">Profile</h1>
          <span className="text-xs text-muted-foreground">Client Profile</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="breadcrumb">
          <Link href="/customers" className="text-[#0057FF]">Client</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/customers?tab=list" className="text-[#0057FF]">Client list</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Profile</span>
        </div>
      </div>

      <div className="flex gap-0 min-h-[calc(100vh-120px)]">
        <div className="w-[280px] shrink-0 border-r bg-gradient-to-b from-[#1a2332] to-[#243447] text-white">
          <div className="flex flex-col items-center pt-6 pb-4 px-4">
            <div className="w-28 h-28 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center mb-3" data-testid="customer-avatar">
              {customer.profilePicture ? (
                <img src={customer.profilePicture} alt={customer.fullName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="h-14 w-14 text-white/50" />
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
              <Mail className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
              <Phone className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
            </div>
            <h2 className="text-lg font-bold text-center" data-testid="text-customer-name">{customer.fullName}</h2>
            <p className="text-xs opacity-70 capitalize" data-testid="text-customer-type">{customer.customerType}</p>
          </div>

          <div className="px-4 space-y-2.5 text-xs border-t border-white/10 pt-4">
            <ProfileSidebarItem icon={Hash} label="Client Code" value={customer.customerId} testId="sidebar-client-code" />
            <ProfileSidebarItem icon={User} label="Client ID/IP" value={customer.usernameIp || customer.fullName} testId="sidebar-client-id" />
            <ProfileSidebarItem icon={CreditCard} label="Billing Status" value={customer.billingStatus || "Inactive"} testId="sidebar-billing-status" />
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 opacity-60" />
                <span className="opacity-80">Mikrotik Status</span>
              </div>
              <Switch
                checked={customer.status === "active"}
                onCheckedChange={(checked) => statusUpdateMutation.mutate(checked ? "active" : "inactive")}
                className="scale-75"
                data-testid="switch-mikrotik-status"
              />
            </div>
            <ProfileSidebarItem icon={Calendar} label="Creation Date" value={formatDate(customer.joiningDate || customer.connectionDate)} testId="sidebar-creation-date" />
          </div>

          <div className="px-4 pt-4 pb-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" data-testid="button-update-info" onClick={() => setLocation(`/customers/${id}/edit`)}>
                <Edit className="h-3 w-3" /> Update Information
              </Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" data-testid="button-status-scheduler">
                <CalendarRange className="h-3 w-3" /> Status Scheduler
              </Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" data-testid="button-send-email">
                <MessageCircle className="h-3 w-3" /> Send Email/Message
              </Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" data-testid="button-package-scheduler">
                <Package className="h-3 w-3" /> Package Scheduler
              </Button>
            </div>
            <Button size="sm" className="w-full text-xs h-9 gap-1.5 bg-[#0057FF]" data-testid="button-download-info">
              <Download className="h-3.5 w-3.5" /> Download Information
            </Button>
            <Link href="/customers?tab=list">
              <Button size="sm" variant="outline" className="w-full text-xs h-9 gap-1.5 text-white border-white/30" data-testid="button-go-client-list">
                <ArrowLeft className="h-3.5 w-3.5" /> Go To Client List
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex-1 bg-muted/30 overflow-hidden">
          <div className="border-b bg-card">
            <div className="flex flex-wrap px-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-[#0057FF] text-[#0057FF]"
                      : "border-transparent text-muted-foreground"
                  }`}
                  data-testid={`tab-${tab.key}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 overflow-y-auto max-h-[calc(100vh-170px)]">
            {activeTab === "service" && (
              <div className="space-y-5" data-testid="tab-content-service">
                <SectionHeader title="Internet Service Information" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Package" value={customerPackage ? customerPackage.name : "-"} />
                    <InfoRow label="Vendor" value={customerVendor?.name || "-"} />
                    <InfoRow label="Joining Date" value={formatDate(customer.joiningDate)} />
                    <InfoRow label="Expire Date" value={customer.expireDate || "-"} />
                    <InfoRow label="Billing Start Month" value={formatDate(customer.billingStartMonth)} />
                    <InfoRow label="Billing Status" value={customer.billingStatus || "Inactive"} />
                    <InfoRow label="Username / PPPoE / IP" value={customer.usernameIp || "-"} />
                    <InfoRow label="Password" value={
                      <span className="flex items-center gap-1.5">
                        {showPassword ? (customer.password || "Not set") : (customer.password ? "••••••••" : "Not set")}
                        {customer.password && (
                          <button onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground" data-testid="button-toggle-password">
                            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </span>
                    } />
                    <InfoRow label="Client Type" value={customer.customerType} capitalize />
                    <InfoRow label="Profile" value={customer.profile || "-"} />
                    <InfoRow label="Connection Setup By" value={customer.connectedBy || "-"} />
                    <InfoRow label="Assigned To" value={customer.assignTo || "-"} />
                    <InfoRow label="Reference By" value={customer.referenceBy || "-"} />
                    <InfoRow label="Last Log In" value="-" />
                  </div>
                </div>

                <SectionHeader title="Package Billing" />
                {(() => {
                  // Compute tax-inclusive amounts from package rates
                  const base    = parseFloat(String(customerPackage?.price  ?? "0")) || 0;
                  const whtPct  = parseFloat(String(customerPackage?.whTax  ?? "0")) || 0;
                  const aitPct  = parseFloat(String(customerPackage?.aitTax ?? "0")) || 0;
                  const whtAmt  = parseFloat(((base * whtPct) / 100).toFixed(2));
                  const aitAmt  = parseFloat(((base * aitPct) / 100).toFixed(2));
                  const taxInclusiveTotal = base + whtAmt + aitAmt;

                  const savedPkgBill = parseFloat(String(customer.packageBill ?? "0")) || 0;
                  const pkgBill = savedPkgBill > 0 ? savedPkgBill : taxInclusiveTotal;
                  const discount     = parseFloat(String(customer.discountOnPackage ?? "0")) || 0;
                  const finalPkgBill = Math.max(0, pkgBill - discount);

                  const inst  = parseFloat(String(customer.finalInstallationCharges ?? "0")) || 0;

                  const deviceCharges   = parseFloat(String((customer as any).deviceCharges  ?? "0")) || 0;
                  const staticIpEnabled = (customer as any).staticIpEnabled;
                  const staticIpMrc     = parseFloat(String((customer as any).staticIpMrc    ?? "0")) || 0;
                  const instEnabled     = (customer as any).installmentEnabled;
                  const instMonthly     = parseFloat(String((customer as any).installmentMonthlyAmount ?? "0")) || 0;

                  let addlPkgs: { packageId: number; bill: string }[] = [];
                  try { addlPkgs = JSON.parse((customer as any).additionalPackages || "[]"); } catch {}
                  const addlPkgsTotal = addlPkgs.reduce((s, p) => s + (parseFloat(p.bill) || 0), 0);

                  let addlDevices: { deviceType: string; deviceDetail: string; deviceCharges: string }[] = [];
                  try { addlDevices = JSON.parse((customer as any).additionalDevices || "[]"); } catch {}
                  const addlDevicesTotal = addlDevices.reduce((s, d) => s + (parseFloat(d.deviceCharges) || 0), 0);

                  const grand = parseFloat(String(customer.grandTotal ?? "0")) || (finalPkgBill + inst + deviceCharges + (staticIpEnabled ? staticIpMrc : 0) + (instEnabled ? instMonthly : 0) + addlPkgsTotal + addlDevicesTotal);

                  // Build breakdown text
                  const breakdownParts: string[] = [];
                  if (finalPkgBill > 0) breakdownParts.push(`PKR ${finalPkgBill.toFixed(0)} pkg`);
                  if (deviceCharges > 0) breakdownParts.push(`PKR ${deviceCharges.toFixed(0)} device`);
                  if (addlDevicesTotal > 0) breakdownParts.push(`PKR ${addlDevicesTotal.toFixed(0)} addl. devices`);
                  if (inst > 0) breakdownParts.push(`PKR ${inst.toFixed(0)} install`);
                  if (staticIpEnabled && staticIpMrc > 0) breakdownParts.push(`PKR ${staticIpMrc.toFixed(0)} static IP`);
                  if (instEnabled && instMonthly > 0) breakdownParts.push(`PKR ${instMonthly.toFixed(0)} installment`);
                  if (addlPkgsTotal > 0) breakdownParts.push(`PKR ${addlPkgsTotal.toFixed(0)} addl. pkgs`);

                  return (
                    <>
                      <div className="bg-card border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-2 divide-x divide-y">
                          <InfoRow label="Package Base Price" value={base > 0 ? `PKR ${base.toFixed(2)}` : "-"} />
                          <InfoRow label="WHT Tax" value={whtPct > 0 ? `${whtPct}% (PKR ${whtAmt.toFixed(2)})` : "-"} />
                          <InfoRow label="AIT Tax" value={aitPct > 0 ? `${aitPct}% (PKR ${aitAmt.toFixed(2)})` : "-"} />
                          <InfoRow label="Package Bill (incl. Tax)" value={pkgBill > 0 ? `PKR ${pkgBill.toFixed(2)}` : "-"} />
                          <InfoRow label="Discount on Package" value={`PKR ${discount.toFixed(2)}`} />
                          <InfoRow label="Final Package Bill" value={
                            <span className="font-semibold text-green-700 dark:text-green-400">PKR {finalPkgBill.toFixed(2)}</span>
                          } />
                        </div>
                      </div>

                      {/* Primary Device Billing */}
                      {deviceCharges > 0 && (
                        <>
                          <SectionHeader title="Device Billing" />
                          <div className="bg-card border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-2 divide-x divide-y">
                              <InfoRow label="Device Type" value={(customer as any).deviceType || "-"} />
                              <InfoRow label="Device Detail" value={(customer as any).deviceDetail || "-"} />
                              <InfoRow label="Device Charges" value={`PKR ${deviceCharges.toFixed(2)}`} />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Additional Devices Billing */}
                      {addlDevices.length > 0 && (
                        <>
                          <SectionHeader title="Additional Devices Billing" />
                          <div className="bg-card border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-2 divide-x divide-y">
                              {addlDevices.map((d, i) => (
                                <>
                                  <InfoRow key={`adt-${i}`} label={`Device ${i + 1}`} value={`${d.deviceType}${d.deviceDetail ? ` — ${d.deviceDetail}` : ""}`} />
                                  <InfoRow key={`adc-${i}`} label={`Device ${i + 1} Charges`} value={Number(d.deviceCharges) > 0 ? `PKR ${Number(d.deviceCharges).toFixed(2)}` : "-"} />
                                </>
                              ))}
                              <InfoRow label="Additional Devices Total" value={<span className="font-semibold">PKR {addlDevicesTotal.toFixed(2)}</span>} />
                            </div>
                          </div>
                        </>
                      )}

                      <SectionHeader title="Installation Charges" />
                      <div className="bg-card border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-2 divide-x divide-y">
                          <InfoRow label="Installation Charges" value={customer.installationCharges ? `PKR ${Number(customer.installationCharges).toFixed(2)}` : "PKR 0.00"} />
                          <InfoRow label="Discount on Installation" value={customer.discountOnInstallation ? `PKR ${Number(customer.discountOnInstallation).toFixed(2)}` : "PKR 0.00"} />
                          <InfoRow label="Final Installation Charges" value={`PKR ${inst.toFixed(2)}`} />
                          <InfoRow label="Charge Created On" value={formatDate(customer.connectionDate)} />
                          <InfoRow label="Received By" value={customer.connectedBy || "-"} />
                          <InfoRow label="Payment Date" value={formatDate(customer.connectionDate)} />
                        </div>
                      </div>

                      {/* Static IP Add-on */}
                      {staticIpEnabled && (
                        <>
                          <SectionHeader title="Static IP Add-on" />
                          <div className="bg-card border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-2 divide-x divide-y">
                              <InfoRow label="Static IP" value={<span className="text-green-600 font-medium">Enabled</span>} />
                              <InfoRow label="Monthly Recurring Charge" value={`PKR ${staticIpMrc.toFixed(2)}`} />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Installment Plan */}
                      {instEnabled && (
                        <>
                          <SectionHeader title="Installment Plan" />
                          <div className="bg-card border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-2 divide-x divide-y">
                              <InfoRow label="Installment Type" value={(customer as any).installmentType || "-"} />
                              <InfoRow label="Total Amount" value={`PKR ${parseFloat(String((customer as any).installmentTotalAmount ?? "0")).toFixed(2)}`} />
                              <InfoRow label="Total Months" value={String((customer as any).installmentMonths || "-")} />
                              <InfoRow label="Monthly Amount" value={`PKR ${instMonthly.toFixed(2)}`} />
                              <InfoRow label="Months Paid" value={String((customer as any).installmentPaidMonths ?? "0")} />
                              <InfoRow label="Remaining Months" value={String(Math.max(0, ((customer as any).installmentMonths || 0) - ((customer as any).installmentPaidMonths || 0)))} />
                              {(customer as any).installmentNote && (
                                <InfoRow label="Note" value={(customer as any).installmentNote} />
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Additional Packages */}
                      {addlPkgs.length > 0 && (
                        <>
                          <SectionHeader title="Additional Packages" />
                          <div className="bg-card border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-2 divide-x divide-y">
                              {addlPkgs.map((ap, i) => {
                                const pkg = packages?.find(p => p.id === ap.packageId);
                                return (
                                  <>
                                    <InfoRow key={`apn-${i}`} label={`Package ${i + 1}`} value={pkg?.name || `Package #${ap.packageId}`} />
                                    <InfoRow key={`apb-${i}`} label={`Package ${i + 1} Bill`} value={parseFloat(ap.bill) > 0 ? `PKR ${parseFloat(ap.bill).toFixed(2)}` : "-"} />
                                  </>
                                );
                              })}
                              <InfoRow label="Additional Packages Total" value={<span className="font-semibold">PKR {addlPkgsTotal.toFixed(2)}</span>} />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Grand Total Banner */}
                      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between shadow-md" data-testid="grand-total-banner">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center">
                            <Calculator className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">Grand Total (First Payment)</p>
                            <p className="text-[11px] text-blue-200">{breakdownParts.length > 0 ? breakdownParts.join(" + ") : "No billing components"}</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-white" data-testid="text-grand-total">PKR {grand.toFixed(2)}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {activeTab === "network" && (
              <div className="space-y-5" data-testid="tab-content-network">
                <SectionHeader title="Connection & Protocol" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Protocol Type" value={customer.protocolType || "-"} />
                    <InfoRow label="Connection Type" value={customer.connectionType || "-"} capitalize />
                    <InfoRow label="Server" value={customer.server || "-"} />
                    <InfoRow label="Zone" value={customer.zone || "-"} />
                    <InfoRow label="Sub Zone" value={customer.subzone || "-"} />
                    <InfoRow label="Box" value={customer.box || "-"} />
                    <InfoRow label="Cable Requirement (m)" value={customer.cableRequirement || "-"} />
                    <InfoRow label="Fiber Code" value={customer.fiberCode || "-"} />
                    <InfoRow label="Number of Core" value={customer.numberOfCore || "-"} />
                    <InfoRow label="Core Color" value={customer.coreColor || "-"} />
                  </div>
                </div>

                <SectionHeader title="Device Information" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Device Type" value={(customer as any).deviceType || customer.device || "-"} />
                    <InfoRow label="Device Model" value={(customer as any).deviceModel || "-"} />
                    <InfoRow label="Device Detail" value={(customer as any).deviceDetail || "-"} />
                    <InfoRow label="Device Charges" value={(customer as any).deviceCharges && Number((customer as any).deviceCharges) > 0 ? `PKR ${Number((customer as any).deviceCharges).toFixed(2)}` : "-"} />
                    <InfoRow label="Device Serial No" value={customer.deviceMacSerial || "-"} />
                    <InfoRow label="Device MAC Address" value={(customer as any).macAddress || "-"} />
                    <InfoRow label="Device Owned By" value={(customer as any).deviceOwnedBy || "-"} />
                    <InfoRow label="Vendor" value={customerVendor?.name || "-"} />
                    <InfoRow label="Purchase Date" value={formatDate(customer.purchaseDate)} />
                  </div>
                </div>

                {(() => {
                  const raw = (customer as any).additionalDevices;
                  let addlDevices: { deviceType: string; deviceDetail: string; deviceCharges: string }[] = [];
                  try { addlDevices = JSON.parse(raw || "[]"); } catch {}
                  if (!addlDevices.length) return null;
                  return (
                    <>
                      <SectionHeader title="Additional Devices" />
                      <div className="bg-card border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-2 divide-x divide-y">
                          {addlDevices.map((d, i) => (
                            <>
                              <InfoRow key={`type-${i}`} label={`Device ${i + 1} — Type`} value={d.deviceType || "-"} />
                              <InfoRow key={`detail-${i}`} label={`Device ${i + 1} — Detail`} value={d.deviceDetail || "-"} />
                              <InfoRow key={`charge-${i}`} label={`Device ${i + 1} — Charges`} value={Number(d.deviceCharges) > 0 ? `PKR ${Number(d.deviceCharges).toFixed(2)}` : "-"} />
                            </>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}

                {connections && connections.length > 0 && (
                  <>
                    <SectionHeader title="Connection Details" action={
                      <Button size="sm" variant="outline" onClick={openAddConnection} className="text-xs" data-testid="button-add-connection">
                        <Plus className="h-3 w-3 mr-1" /> Add Connection
                      </Button>
                    } />
                    {connections.map((conn) => (
                      <div key={conn.id} className="bg-card border rounded-lg overflow-hidden" data-testid={`card-connection-${conn.id}`}>
                        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={`text-[10px] capitalize ${conn.status === "active" ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>
                              {conn.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground capitalize">{conn.connectionType}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditConnection(conn)} data-testid={`button-edit-connection-${conn.id}`}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteConnectionMutation.mutate(conn.id)} data-testid={`button-delete-connection-${conn.id}`}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-y">
                          <InfoRow label="Username/PPPoE" value={conn.username || "-"} />
                          <InfoRow label="IP Address" value={conn.ipAddress || "-"} />
                          <InfoRow label="MAC Address" value={conn.macAddress || "-"} />
                          <InfoRow label="ONU Serial" value={conn.onuSerial || "-"} />
                          <InfoRow label="Router Model" value={conn.routerModel || "-"} />
                          <InfoRow label="Router Serial" value={conn.routerSerial || "-"} />
                          <InfoRow label="Port" value={conn.port || "-"} />
                          <InfoRow label="VLAN" value={conn.vlan || "-"} />
                          <InfoRow label="Install Date" value={formatDate(conn.installDate)} />
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {(!connections || connections.length === 0) && (
                  <>
                    <SectionHeader title="Connection Details" action={
                      <Button size="sm" variant="outline" onClick={openAddConnection} className="text-xs" data-testid="button-add-connection">
                        <Plus className="h-3 w-3 mr-1" /> Add Connection
                      </Button>
                    } />
                    <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
                      <Network className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">No connections found</p>
                      <p className="text-xs mt-1">Add a connection to get started</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "personal" && (
              <div className="space-y-5" data-testid="tab-content-personal">
                <SectionHeader title="Personal Information" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Full Name" value={customer.fullName} />
                    <InfoRow label="Email" value={customer.email || "-"} />
                    <InfoRow label="Phone" value={customer.phone} />
                    <InfoRow label="CNIC / NID Number" value={customer.cnic || customer.nidNumber || "-"} />
                    <InfoRow label="Gender" value={customer.gender || "-"} capitalize />
                    <InfoRow label="Date of Birth" value={formatDate(customer.dateOfBirth)} />
                    <InfoRow label="Father's Name" value={customer.fatherName || "-"} />
                    <InfoRow label="Mother's Name" value={customer.motherName || "-"} />
                    <InfoRow label="Occupation" value={customer.occupation || "-"} capitalize />
                    <InfoRow label="Registration Form No" value={customer.registrationFormNo || "-"} />
                  </div>
                </div>

                <SectionHeader title="Address Information" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Branch" value={(customer as any).branch || "-"} />
                    <InfoRow label="Area" value={customer.area || "-"} />
                    <InfoRow label="City" value={(customer as any).city || "-"} />
                    <InfoRow label="CNIC Address" value={customer.address || "-"} />
                    <InfoRow label="Current Address" value={customer.presentAddress || "-"} />
                    <InfoRow label="Permanent Address" value={customer.permanentAddress || "-"} />
                    <InfoRow label="District" value={customer.district || "-"} />
                    <InfoRow label="Upazila / Thana" value={customer.upazilaThana || "-"} />
                    <InfoRow label="Road Number" value={customer.roadNumber || "-"} />
                    <InfoRow label="House Number" value={customer.houseNumber || "-"} />
                  </div>
                </div>

                <SectionHeader title="GPS Coordinates" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  {/* Editable GPS inputs */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Map Latitude</label>
                        <Input
                          data-testid="input-gps-lat"
                          placeholder={customerGpsLat || "e.g. 31.5204"}
                          value={gpsLat || customerGpsLat}
                          onChange={e => setGpsLat(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Map Longitude</label>
                        <Input
                          data-testid="input-gps-lng"
                          placeholder={customerGpsLng || "e.g. 74.3587"}
                          value={gpsLng || customerGpsLng}
                          onChange={e => setGpsLng(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Action buttons row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        data-testid="button-get-gps"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
                        onClick={handleGetGps}
                        disabled={gpsLocating}
                      >
                        <LocateFixed className={`h-3.5 w-3.5 ${gpsLocating ? "animate-pulse" : ""}`} />
                        {gpsLocating ? "Detecting…" : "Get GPS Location"}
                      </Button>

                      <Button
                        data-testid="button-save-gps"
                        size="sm"
                        className="h-8 gap-1.5 text-xs bg-[#1c67d4] hover:bg-[#1558b8]"
                        onClick={() => {
                          const lat = gpsLat || customerGpsLat;
                          const lng = gpsLng || customerGpsLng;
                          if (!lat || !lng) {
                            toast({ title: "Enter coordinates", description: "Please fill in both latitude and longitude.", variant: "destructive" });
                            return;
                          }
                          gpsMutation.mutate({ lat, lng });
                        }}
                        disabled={gpsMutation.isPending}
                      >
                        <Save className="h-3.5 w-3.5" />
                        {gpsMutation.isPending ? "Saving…" : "Save Coordinates"}
                      </Button>

                      {(gpsLat || customerGpsLat) && (gpsLng || customerGpsLng) && (
                        <a
                          href={`https://maps.google.com/?q=${gpsLat || customerGpsLat},${gpsLng || customerGpsLng}`}
                          target="_blank"
                          rel="noreferrer"
                          data-testid="link-open-maps"
                        >
                          <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs text-green-700 hover:text-green-800 hover:bg-green-50 dark:text-green-400">
                            <MapPin className="h-3.5 w-3.5" /> Open in Google Maps
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Current saved coordinates display */}
                  {(customerGpsLat || customerGpsLng) && (
                    <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Saved:</span>
                      <span className="text-[11px] font-mono text-foreground">{customerGpsLat}, {customerGpsLng}</span>
                    </div>
                  )}
                </div>

                <SectionHeader title="Social Links" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Facebook" value={customer.facebookUrl || "-"} />
                    <InfoRow label="LinkedIn" value={customer.linkedinUrl || "-"} />
                    <InfoRow label="Twitter" value={customer.twitterUrl || "-"} />
                    <InfoRow label="Facebook Profile" value={customer.facebookId || "-"} />
                    <InfoRow label="WhatsApp" value={customer.whatsapp || "-"} />
                  </div>
                </div>

                <SectionHeader title="Notifications & Settings" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="VIP Client" value={customer.isVipClient ? "Yes" : "No"} />
                    <InfoRow label="Affiliator" value={customer.affiliator || "-"} />
                    <InfoRow
                      label="Send SMS to Employee"
                      value={
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${customer.sendSmsToEmployee ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-muted text-muted-foreground"}`}>
                          <Bell className="h-3 w-3" /> {customer.sendSmsToEmployee ? "Enabled" : "Disabled"}
                        </span>
                      }
                    />
                    <InfoRow
                      label="Send Greeting SMS"
                      value={
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${customer.sendGreetingSms ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-muted text-muted-foreground"}`}>
                          <Bell className="h-3 w-3" /> {customer.sendGreetingSms ? "Enabled" : "Disabled"}
                        </span>
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-5" data-testid="tab-content-documents">
                <SectionHeader title="Customer Documents" />
                {(() => {
                  const cnicFront = customer.nidPicture;
                  const cnicBack  = (customer as any).cnicBackPicture;
                  const regForm   = customer.registrationFormPicture;
                  const docs = [
                    { label: "CNIC Front", url: cnicFront },
                    { label: "CNIC Back",  url: cnicBack  },
                    { label: "Registration Form", url: regForm },
                  ].filter(d => d.url);

                  if (docs.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                        <FileText className="h-12 w-12 opacity-30" />
                        <p className="text-sm">No documents uploaded for this customer.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {docs.map(doc => (
                        <div key={doc.label} className="border rounded-xl overflow-hidden shadow-sm" data-testid={`card-doc-${doc.label.replace(/\s+/g, "-").toLowerCase()}`}>
                          <div className="bg-muted/40 px-4 py-2.5 flex items-center justify-between border-b">
                            <span className="text-sm font-semibold">{doc.label}</span>
                            <a href={doc.url!} target="_blank" rel="noreferrer">
                              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                                <Download className="h-3.5 w-3.5" /> View
                              </Button>
                            </a>
                          </div>
                          <div className="bg-card flex items-center justify-center p-3 min-h-[200px]">
                            <img
                              src={doc.url!}
                              alt={doc.label}
                              className="max-h-52 object-contain rounded"
                              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <SectionHeader title="Document References" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="CNIC / NID Number" value={customer.nidNumber || "-"} />
                    <InfoRow label="Registration Form No" value={customer.registrationFormNo || "-"} />
                    <InfoRow label="CNIC Front" value={customer.nidPicture ? "Uploaded" : "Not uploaded"} />
                    <InfoRow label="CNIC Back" value={(customer as any).cnicBackPicture ? "Uploaded" : "Not uploaded"} />
                    <InfoRow label="Registration Form" value={customer.registrationFormPicture ? "Uploaded" : "Not uploaded"} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "invoices" && (
              <div className="space-y-5" data-testid="tab-content-invoices">
                <SectionHeader title="Generated & Updated Bill/Invoices" />
                {invoicesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : !invoices?.length ? (
                  <EmptyState icon={FileText} message="No invoices found" />
                ) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#1a3a5c] border-[#1a3a5c]">
                          <TableHead className="text-white text-xs font-semibold">Invoice #</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Amount</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Tax</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Total</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Status</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Issue Date</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Due Date</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Paid Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((inv) => (
                          <TableRow key={inv.id} data-testid={`row-invoice-${inv.id}`}>
                            <TableCell className="text-xs font-mono">{inv.invoiceNumber}</TableCell>
                            <TableCell className="text-xs">{Number(inv.amount).toFixed(2)}</TableCell>
                            <TableCell className="text-xs">{Number(inv.tax || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-xs font-semibold">{Number(inv.totalAmount).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${
                                inv.status === "paid" ? "text-green-700 bg-green-50" :
                                inv.status === "overdue" ? "text-red-600 bg-red-50" :
                                "text-amber-600 bg-amber-50"
                              }`}>{inv.status}</Badge>
                            </TableCell>
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

            {activeTab === "received" && (
              <div className="space-y-5" data-testid="tab-content-received">
                <SectionHeader title="Received Bill History" />
                {!invoices?.filter(i => i.status === "paid").length ? (
                  <EmptyState icon={CreditCard} message="No received bill history" />
                ) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#1a3a5c] border-[#1a3a5c]">
                          <TableHead className="text-white text-xs font-semibold">Invoice #</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Amount Paid</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Payment Date</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices?.filter(i => i.status === "paid").map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell className="text-xs font-mono">{inv.invoiceNumber}</TableCell>
                            <TableCell className="text-xs">{Number(inv.totalAmount).toFixed(2)}</TableCell>
                            <TableCell className="text-xs">{formatDate(inv.paidDate)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px] text-green-700 bg-green-50">Paid</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "complain" && (
              <div className="space-y-5" data-testid="tab-content-complain">
                <SectionHeader title="Complain History" />
                {ticketsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : !tickets?.length ? (
                  <EmptyState icon={AlertCircle} message="No complaints found" />
                ) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#1a3a5c] border-[#1a3a5c]">
                          <TableHead className="text-white text-xs font-semibold">Ticket #</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Subject</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Priority</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Status</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Category</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tickets.map((ticket) => (
                          <TableRow key={ticket.id} data-testid={`row-ticket-${ticket.id}`}>
                            <TableCell className="text-xs font-mono">{ticket.ticketNumber}</TableCell>
                            <TableCell className="text-xs">{ticket.subject}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${
                                ticket.priority === "critical" ? "text-red-600 bg-red-50" :
                                ticket.priority === "high" ? "text-orange-600 bg-orange-50" :
                                ticket.priority === "medium" ? "text-amber-600 bg-amber-50" :
                                "text-blue-600 bg-blue-50"
                              }`}>{ticket.priority}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${
                                ticket.status === "resolved" || ticket.status === "closed" ? "text-green-700 bg-green-50" :
                                ticket.status === "in_progress" ? "text-amber-600 bg-amber-50" :
                                "text-blue-600 bg-blue-50"
                              }`}>{ticket.status.replace("_", " ")}</Badge>
                            </TableCell>
                            <TableCell className="text-xs capitalize">{ticket.category}</TableCell>
                            <TableCell className="text-xs">{formatDate(ticket.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "remarks" && (
              <div className="space-y-5" data-testid="tab-content-remarks">
                <SectionHeader title="Remarks History" action={
                  notesEditing ? (
                    <Button size="sm" onClick={() => notesMutation.mutate(notes)} disabled={notesMutation.isPending} className="text-xs" data-testid="button-save-notes">
                      <Save className="h-3 w-3 mr-1" /> {notesMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setNotes(customer.notes || ""); setNotesEditing(true); }} className="text-xs" data-testid="button-edit-notes">
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                  )
                } />
                <div className="bg-card border rounded-lg p-4">
                  {notesEditing ? (
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add remarks about this customer..."
                      className="min-h-[200px]"
                      data-testid="textarea-notes"
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap" data-testid="text-notes">
                      {customer.notes || "No remarks added yet."}
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "messages" && (
              <div className="space-y-5" data-testid="tab-content-messages">
                <SectionHeader title="Message History" />
                <EmptyState icon={MessageCircle} message="No message history available" />
              </div>
            )}

            {activeTab === "changelog" && (
              <div className="space-y-5" data-testid="tab-content-changelog">
                <SectionHeader title="Customer Change Log" />
                <EmptyState icon={Clock} message="No change log entries" />
              </div>
            )}

            {activeTab === "enablelog" && (
              <div className="space-y-5" data-testid="tab-content-enablelog">
                <SectionHeader title="Customer Enable/Disable Log" />
                <EmptyState icon={RefreshCw} message="No enable/disable log entries" />
              </div>
            )}

            {activeTab === "sales" && (
              <div className="space-y-5" data-testid="tab-content-sales">
                <SectionHeader title="Product & Service Sales Invoices" />
                <EmptyState icon={FileText} message="No product & service sales invoices" />
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={connectionDialogOpen} onOpenChange={setConnectionDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingConnection ? "Edit Connection" : "Add Connection"}</DialogTitle>
          </DialogHeader>
          <Form {...connectionForm}>
            <form onSubmit={connectionForm.handleSubmit(onConnectionSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={connectionForm.control} name="username" render={({ field }) => (
                  <FormItem><FormLabel>Username/PPPoE</FormLabel><FormControl><Input placeholder="PPPoE username" data-testid="input-conn-username" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="ipAddress" render={({ field }) => (
                  <FormItem><FormLabel>IP Address</FormLabel><FormControl><Input placeholder="192.168.1.1" data-testid="input-conn-ip" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="macAddress" render={({ field }) => (
                  <FormItem><FormLabel>MAC Address</FormLabel><FormControl><Input placeholder="AA:BB:CC:DD:EE:FF" data-testid="input-conn-mac" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="onuSerial" render={({ field }) => (
                  <FormItem><FormLabel>ONU Serial</FormLabel><FormControl><Input placeholder="ONU serial number" data-testid="input-conn-onu" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="routerModel" render={({ field }) => (
                  <FormItem><FormLabel>Router Model</FormLabel><FormControl><Input placeholder="Router model" data-testid="input-conn-router-model" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="routerSerial" render={({ field }) => (
                  <FormItem><FormLabel>Router Serial</FormLabel><FormControl><Input placeholder="Router serial" data-testid="input-conn-router-serial" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="connectionType" render={({ field }) => (
                  <FormItem><FormLabel>Connection Type</FormLabel><FormControl>
                    <Select onValueChange={field.onChange} value={field.value || "fiber"}>
                      <SelectTrigger data-testid="select-conn-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fiber">Fiber</SelectItem>
                        <SelectItem value="wireless">Wireless</SelectItem>
                        <SelectItem value="cable">Cable</SelectItem>
                        <SelectItem value="dsl">DSL</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="port" render={({ field }) => (
                  <FormItem><FormLabel>Port</FormLabel><FormControl><Input placeholder="Port" data-testid="input-conn-port" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="vlan" render={({ field }) => (
                  <FormItem><FormLabel>VLAN</FormLabel><FormControl><Input placeholder="VLAN ID" data-testid="input-conn-vlan" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="installDate" render={({ field }) => (
                  <FormItem><FormLabel>Install Date</FormLabel><FormControl><Input type="date" data-testid="input-conn-install-date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel><FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger data-testid="select-conn-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setConnectionDialogOpen(false)} data-testid="button-cancel-connection">Cancel</Button>
                <Button type="submit" disabled={createConnectionMutation.isPending || updateConnectionMutation.isPending} data-testid="button-submit-connection">
                  {createConnectionMutation.isPending || updateConnectionMutation.isPending ? "Saving..." : editingConnection ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-0 flex-1">
        <div className="text-white text-xs font-semibold px-5 py-2.5 rounded-md flex-1 bg-[#1c67d4]" data-testid={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
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
      <span className={`font-medium text-foreground ${capitalize ? "capitalize" : ""}`} data-testid={`info-${label.toLowerCase().replace(/[\s\/]+/g, '-')}`}>
        {value}
      </span>
    </div>
  );
}

function ProfileSidebarItem({ icon: Icon, label, value, testId }: { icon: typeof User; label: string; value: string; testId: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/10">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 opacity-60" />
        <span className="opacity-80">{label}:</span>
      </div>
      <span className="font-medium text-right max-w-[50%] truncate" data-testid={testId}>{value}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: typeof User; message: string }) {
  return (
    <div className="bg-card border rounded-lg p-12 text-center text-muted-foreground">
      <Icon className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
