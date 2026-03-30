import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Redirect, useLocation } from "wouter";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Wifi,
  WifiOff,
  Phone,
  Mail,
  MapPin,
  Eye,
  EyeOff,
  RefreshCw,
  CalendarClock,
  Home,
  Building2,
  Building,
  Store,
  MessageSquarePlus,
  ListFilter,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  UserPlus,
  FileSpreadsheet,
  FileDown,
  Settings2,
  Shield,
  UserCheck,
  Star,
  MessageCircle,
  CalendarRange,
  XCircle,
  Hash,
  Landmark,
  Palette,
  Clock,
  AlertTriangle,
  ToggleLeft,
  CheckCircle2,
  X,
  BadgeCheck,
  CreditCard,
  Send,
  Bell,
  Smartphone,
  Globe,
  Power,
  PowerOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useTab } from "@/hooks/use-tab";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCustomerSchema, insertCustomerTypeSchema, type Customer, type InsertCustomer, type Package, type CustomerQuery, type CustomerType as CustomerTypeRecord } from "@shared/schema";
import { z } from "zod";
import { Upload, Check, ChevronRight, ChevronLeft, User, Network, Server, ClipboardList } from "lucide-react";

const serviceTypeLabels: Record<string, string> = {
  internet: "Internet",
  iptv: "IPTV",
  cable_tv: "Cable TV",
  bundle: "Bundle",
};

const customerFormSchema = insertCustomerSchema.extend({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number is required"),
});

const customerTypes = [
  {
    key: "home",
    label: "Home",
    icon: Home,
    description: "Residential customers with standard home internet and TV services.",
  },
  {
    key: "business",
    label: "Business",
    icon: Building2,
    description: "Small to medium businesses requiring reliable connectivity and support.",
  },
  {
    key: "enterprise",
    label: "Enterprise",
    icon: Building,
    description: "Large-scale enterprise clients with dedicated bandwidth and SLA agreements.",
  },
  {
    key: "reseller",
    label: "Reseller",
    icon: Store,
    description: "Partner resellers who distribute services under their own branding.",
  },
];


function FileUploadField({ label, value, onChange, testId }: { label: string; value: string; onChange: (url: string) => void; testId: string }) {
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/document", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onChange(data.url);
    } catch { onChange(""); }
    finally { setUploading(false); }
  };
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors flex-1" data-testid={testId}>
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : value ? "Change file" : "Choose file"}</span>
          <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUpload} disabled={uploading} />
        </label>
        {value && (
          <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" />
            <span>Uploaded</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomerQueryWizard({ setTab }: { setTab: (v: string) => void }) {
  const { toast } = useToast();
  const { data: pkgs } = useQuery<Package[]>({ queryKey: ["/api/packages"] });
  const { data: areasData } = useQuery<any[]>({ queryKey: ["/api/areas"] });
  const { data: branchesData } = useQuery<any[]>({ queryKey: ["/api/branches"] });
  const { data: allCustomers } = useQuery<any[]>({ queryKey: ["/api/customers"] });
  const { data: cirCustomers } = useQuery<any[]>({ queryKey: ["/api/cir-customers"] });
  const { data: corporateCustomers } = useQuery<any[]>({ queryKey: ["/api/corporate-customers"] });
  const { data: vendorsData } = useQuery<any[]>({ queryKey: ["/api/vendors"] });

  const [form, setForm] = useState({
    fullName: "", fatherName: "", gender: "", remarks: "",
    referredBy: "", referredByDetail: "", referredById: 0, referredByType: "",
    phone: "", branch: "", area: "", city: "",
    customerType: "", serviceType: "", packageId: 0, bandwidthRequired: "", panelUsersCapacity: "", bandwidthVendorId: 0, panelVendorId: 0, staticIp: false, popId: "", requestDate: new Date().toISOString().split("T")[0],
  });

  const update = (field: string, value: string | number | boolean) => setForm(prev => ({ ...prev, [field]: value }));

  const onReferredByChange = (v: string) => {
    const typeMap: Record<string, string> = { Customer: "customer", CIR: "cir", Corporate: "corporate", Other: "other" };
    setForm(prev => ({ ...prev, referredBy: v, referredByDetail: "", referredById: 0, referredByType: typeMap[v] || "" }));
  };

  const onReferredByDetailSelect = (idName: string, type: string) => {
    const [idStr, ...nameParts] = idName.split("|");
    const name = nameParts.join("|");
    setForm(prev => ({ ...prev, referredByDetail: name, referredById: Number(idStr), referredByType: type }));
  };

  const areaOptions = areasData || [];
  const branchOptions = branchesData || [];

  const onAreaChange = (areaName: string) => {
    const found = areaOptions.find((a: any) => a.name === areaName);
    update("area", areaName);
    if (found?.city) update("city", found.city);
    if (found?.branch) update("branch", found.branch);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.fullName.trim()) throw new Error("Full Name is required");
      if (!form.phone.trim()) throw new Error("Mobile No is required");
      if (!form.area.trim()) throw new Error("Area is required");
      const payload = {
        queryId: `CR-${Date.now().toString(36).toUpperCase()}`,
        name: form.fullName,
        fatherName: form.fatherName || null,
        gender: form.gender || null,
        remarks: form.remarks || null,
        referredBy: form.referredBy || null,
        referredByDetail: form.referredByDetail || null,
        referredById: form.referredById || null,
        referredByType: form.referredByType || null,
        phone: form.phone,
        branch: form.branch || null,
        area: form.area,
        city: form.city || null,
        customerType: form.customerType || null,
        serviceType: form.serviceType || null,
        packageId: ["CIR", "Corporate", "Reseller"].includes(form.customerType) ? null : (form.packageId || null),
        bandwidthRequired: ["CIR", "Corporate"].includes(form.customerType) ? (form.bandwidthRequired || null) : null,
        panelUsersCapacity: form.customerType === "Reseller" ? (form.panelUsersCapacity || null) : null,
        bandwidthVendorId: ["CIR", "Corporate"].includes(form.customerType) ? (form.bandwidthVendorId || null) : null,
        panelVendorId: form.customerType === "Reseller" ? (form.panelVendorId || null) : null,
        staticIp: form.staticIp,
        popId: form.popId || null,
        requestDate: form.requestDate || null,
        status: "Pending",
        createdBy: "admin",
        createdAt: new Date().toISOString(),
      };
      const res = await apiRequest("POST", "/api/customer-queries", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Request Submitted", description: "New client request has been created successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-queries"] });
      setTab("query-list");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to submit request", variant: "destructive" });
    },
  });

  const fieldClass = "space-y-1.5";
  const labelClass = "text-sm font-medium text-foreground";
  const sectionHeaderClass = "bg-[#1c67d4] text-white px-4 py-2.5 rounded-t-lg flex items-center gap-2 text-sm font-semibold";

  return (
    <div className="mt-5 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setTab("query-list")} data-testid="button-back-to-list">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-lg font-bold">New Client Request</h2>
          <p className="text-sm text-muted-foreground">Fill in the client details to submit a new connection request</p>
        </div>
      </div>

      {/* Section 1: Personal Info */}
      <div className="rounded-lg border overflow-hidden shadow-sm">
        <div className={sectionHeaderClass}>
          <User className="h-4 w-4" />
          1 – Personal Info
        </div>
        <div className="p-4 bg-card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={fieldClass}>
              <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
              <Input placeholder="Enter full name" value={form.fullName} onChange={e => update("fullName", e.target.value)} data-testid="input-cr-fullname" />
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>Father Name</label>
              <Input placeholder="Enter father's name" value={form.fatherName} onChange={e => update("fatherName", e.target.value)} data-testid="input-cr-father" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={fieldClass}>
              <label className={labelClass}>Gender</label>
              <Select value={form.gender} onValueChange={v => update("gender", v)}>
                <SelectTrigger data-testid="select-cr-gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>Remarks / Special Note</label>
              <Input placeholder="Any special notes or remarks..." value={form.remarks} onChange={e => update("remarks", e.target.value)} data-testid="input-cr-remarks" />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Contact Info */}
      <div className="rounded-lg border overflow-hidden shadow-sm">
        <div className={sectionHeaderClass}>
          <Phone className="h-4 w-4" />
          2 – Contact Info
        </div>
        <div className="p-4 bg-card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={fieldClass}>
              <div className="flex items-center justify-between">
                <label className={labelClass}>Referred By</label>
                {form.referredBy && (
                  <button
                    type="button"
                    onClick={() => onReferredByChange("")}
                    data-testid="button-clear-referred-by"
                    className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                  >
                    <X className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>
              <Select value={form.referredBy} onValueChange={onReferredByChange}>
                <SelectTrigger data-testid="select-cr-referred-by"><SelectValue placeholder="Select referral source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Customer">Customer</SelectItem>
                  <SelectItem value="CIR">CIR</SelectItem>
                  <SelectItem value="Corporate">Corporate</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>Mobile No <span className="text-red-500">*</span></label>
              <Input placeholder="03XX-XXXXXXX" value={form.phone} onChange={e => update("phone", e.target.value)} data-testid="input-cr-phone" />
            </div>
          </div>

          {/* Conditional second select based on Referred By choice */}
          {form.referredBy && form.referredBy !== "" && (
            <div className={fieldClass}>
              {form.referredBy === "Customer" && (
                <>
                  <label className={labelClass}>Select Customer</label>
                  <Select
                    value={form.referredById ? `${form.referredById}|${form.referredByDetail}` : ""}
                    onValueChange={v => onReferredByDetailSelect(v, "customer")}
                  >
                    <SelectTrigger data-testid="select-cr-referred-customer"><SelectValue placeholder="Search and select customer..." /></SelectTrigger>
                    <SelectContent>
                      {(allCustomers || []).map((c: any) => (
                        <SelectItem key={c.id} value={`${c.id}|${c.fullName}`}>
                          <span className="font-medium">{c.fullName}</span>
                          {c.customerId && <span className="text-muted-foreground text-xs ml-2">({c.customerId})</span>}
                          {c.phone && <span className="text-muted-foreground text-xs ml-2">· {c.phone}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              {form.referredBy === "CIR" && (
                <>
                  <label className={labelClass}>Select CIR Client</label>
                  <Select
                    value={form.referredById ? `${form.referredById}|${form.referredByDetail}` : ""}
                    onValueChange={v => onReferredByDetailSelect(v, "cir")}
                  >
                    <SelectTrigger data-testid="select-cr-referred-cir"><SelectValue placeholder="Search and select CIR client..." /></SelectTrigger>
                    <SelectContent>
                      {(cirCustomers || []).map((c: any) => (
                        <SelectItem key={c.id} value={`${c.id}|${c.companyName}`}>
                          <span className="font-medium">{c.companyName}</span>
                          {c.contactPerson && <span className="text-muted-foreground text-xs ml-2">· {c.contactPerson}</span>}
                          {c.phone && <span className="text-muted-foreground text-xs ml-2">· {c.phone}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              {form.referredBy === "Corporate" && (
                <>
                  <label className={labelClass}>Select Corporate Client</label>
                  <Select
                    value={form.referredById ? `${form.referredById}|${form.referredByDetail}` : ""}
                    onValueChange={v => onReferredByDetailSelect(v, "corporate")}
                  >
                    <SelectTrigger data-testid="select-cr-referred-corporate"><SelectValue placeholder="Search and select corporate client..." /></SelectTrigger>
                    <SelectContent>
                      {(corporateCustomers || []).map((c: any) => (
                        <SelectItem key={c.id} value={`${c.id}|${c.companyName}`}>
                          <span className="font-medium">{c.companyName}</span>
                          {c.contactPerson && <span className="text-muted-foreground text-xs ml-2">· {c.contactPerson}</span>}
                          {c.phone && <span className="text-muted-foreground text-xs ml-2">· {c.phone}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              {form.referredBy === "Other" && (
                <>
                  <label className={labelClass}>Referral Detail</label>
                  <Input
                    placeholder="Enter referral name or source..."
                    value={form.referredByDetail}
                    onChange={e => update("referredByDetail", e.target.value)}
                    data-testid="input-cr-referred-other"
                  />
                </>
              )}
              {form.referredByDetail && (
                <div className="mt-1.5 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>
                    Referred by <span className="font-semibold">{form.referredBy}</span>: <span className="font-semibold">{form.referredByDetail}</span>
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={fieldClass}>
              <label className={labelClass}>Branch</label>
              <Select value={form.branch} onValueChange={v => update("branch", v)}>
                <SelectTrigger data-testid="select-cr-branch"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branchOptions.length > 0
                    ? branchOptions.map((b: any) => <SelectItem key={b.id} value={b.name || b.id}>{b.name}</SelectItem>)
                    : <SelectItem value="Main Branch">Main Branch</SelectItem>
                  }
                </SelectContent>
              </Select>
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>Area <span className="text-red-500">*</span></label>
              <Select value={form.area} onValueChange={onAreaChange}>
                <SelectTrigger data-testid="select-cr-area"><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>
                  {areaOptions.map((a: any) => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>City</label>
              <Input placeholder="City name" value={form.city} onChange={e => update("city", e.target.value)} data-testid="input-cr-city" />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Network & Service */}
      <div className="rounded-lg border overflow-hidden shadow-sm">
        <div className={sectionHeaderClass}>
          <Network className="h-4 w-4" />
          3 – Network & Service
        </div>
        <div className="p-4 bg-card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={fieldClass}>
              <label className={labelClass}>Customer Type</label>
              <Select
                value={form.customerType}
                onValueChange={v => setForm(prev => ({
                  ...prev,
                  customerType: v,
                  packageId: 0,
                  bandwidthRequired: "",
                  panelUsersCapacity: "",
                  bandwidthVendorId: 0,
                  panelVendorId: 0,
                  serviceType: prev.serviceType === "ISP" && !["CIR", "Reseller"].includes(v) ? "" : prev.serviceType,
                }))}
              >
                <SelectTrigger data-testid="select-cr-customer-type"><SelectValue placeholder="Select customer type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CIR">CIR</SelectItem>
                  <SelectItem value="Corporate">Corporate</SelectItem>
                  <SelectItem value="Customer">Customer</SelectItem>
                  <SelectItem value="Reseller">Reseller</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>Service Type</label>
              <Select key={`service-type-${form.customerType}`} value={form.serviceType} onValueChange={v => update("serviceType", v)}>
                <SelectTrigger data-testid="select-cr-service-type"><SelectValue placeholder="Select service type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Hospital">Hospital</SelectItem>
                  <SelectItem value="Hostel">Hostel</SelectItem>
                  <SelectItem value="Reseller">Reseller</SelectItem>
                  <SelectItem value="School">School</SelectItem>
                  <SelectItem value="Hotel">Hotel</SelectItem>
                  {["CIR", "Reseller"].includes(form.customerType) && (
                    <SelectItem value="ISP">ISP</SelectItem>
                  )}
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* CIR: Bandwidth Required + Bandwidth Vendor */}
          {form.customerType === "CIR" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={fieldClass}>
                <label className={labelClass}>Bandwidth Required</label>
                <Input
                  placeholder="e.g. 100 Mbps, 1 Gbps"
                  value={form.bandwidthRequired}
                  onChange={e => update("bandwidthRequired", e.target.value)}
                  data-testid="input-cr-bandwidth-required"
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>Bandwidth Vendor</label>
                <Select
                  value={form.bandwidthVendorId ? String(form.bandwidthVendorId) : ""}
                  onValueChange={v => update("bandwidthVendorId", Number(v))}
                >
                  <SelectTrigger data-testid="select-cr-bandwidth-vendor">
                    <SelectValue placeholder="Select bandwidth vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {(vendorsData || []).map((v: any) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.name}{v.serviceType ? ` – ${v.serviceType}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Reseller: Panel Users Capacity + Panel Vendor */}
          {form.customerType === "Reseller" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={fieldClass}>
                <label className={labelClass}>Panel Users Capacity</label>
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={form.panelUsersCapacity}
                  onChange={e => update("panelUsersCapacity", e.target.value)}
                  data-testid="input-cr-panel-users-capacity"
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>Panel Vendor</label>
                <Select
                  value={form.panelVendorId ? String(form.panelVendorId) : ""}
                  onValueChange={v => update("panelVendorId", Number(v))}
                >
                  <SelectTrigger data-testid="select-cr-panel-vendor">
                    <SelectValue placeholder="Select panel vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {(vendorsData || []).map((v: any) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.name}{v.serviceType ? ` – ${v.serviceType}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Corporate: Bandwidth Required + Bandwidth Vendor */}
          {form.customerType === "Corporate" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={fieldClass}>
                <label className={labelClass}>Bandwidth Required</label>
                <Input
                  placeholder="e.g. 100 Mbps, 1 Gbps"
                  value={form.bandwidthRequired}
                  onChange={e => update("bandwidthRequired", e.target.value)}
                  data-testid="input-cr-corporate-bandwidth-required"
                />
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>Bandwidth Vendor</label>
                <Select
                  value={form.bandwidthVendorId ? String(form.bandwidthVendorId) : ""}
                  onValueChange={v => update("bandwidthVendorId", Number(v))}
                >
                  <SelectTrigger data-testid="select-cr-corporate-bandwidth-vendor">
                    <SelectValue placeholder="Select bandwidth vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {(vendorsData || []).map((v: any) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.name}{v.serviceType ? ` – ${v.serviceType}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Customer/default: Package + POP ID */}
          {!["CIR", "Corporate", "Reseller"].includes(form.customerType) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={fieldClass}>
                <label className={labelClass}>Package</label>
                <Select value={form.packageId ? String(form.packageId) : ""} onValueChange={v => update("packageId", Number(v))}>
                  <SelectTrigger data-testid="select-cr-package"><SelectValue placeholder="Select package" /></SelectTrigger>
                  <SelectContent>
                    {pkgs?.filter(p => p.isActive).map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}{p.speed ? ` – ${p.speed}` : ""}{p.price ? ` (${p.price} PKR)` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={fieldClass}>
                <label className={labelClass}>POP ID</label>
                <Input placeholder="Enter POP ID" value={form.popId} onChange={e => update("popId", e.target.value)} data-testid="input-cr-pop-id" />
              </div>
            </div>
          )}

          {/* POP ID — always shown for CIR, Corporate, Reseller */}
          {["CIR", "Corporate", "Reseller"].includes(form.customerType) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={fieldClass}>
                <label className={labelClass}>POP ID</label>
                <Input placeholder="Enter POP ID" value={form.popId} onChange={e => update("popId", e.target.value)} data-testid="input-cr-pop-id-alt" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={fieldClass}>
              <label className={labelClass}>Request Date</label>
              <Input type="date" value={form.requestDate} onChange={e => update("requestDate", e.target.value)} data-testid="input-cr-request-date" />
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>Static IP</label>
              <div className="flex items-center gap-3 h-10 px-3 rounded-md border bg-background">
                <Switch
                  checked={form.staticIp}
                  onCheckedChange={v => update("staticIp", v)}
                  data-testid="switch-cr-static-ip"
                />
                <span className="text-sm text-muted-foreground">{form.staticIp ? "Required" : "Not Required"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={() => setTab("query-list")} data-testid="button-cr-cancel">
          <XCircle className="h-4 w-4 mr-1" /> Cancel
        </Button>
        <Button
          className="bg-[#1c67d4] hover:bg-[#1558b8] text-white px-8"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          data-testid="button-cr-submit"
        >
          {createMutation.isPending ? "Submitting..." : "Submit Request"}
        </Button>
      </div>
    </div>
  );
}

function CustomerQueryList({ setTab }: { setTab: (v: string) => void }) {
  const { data: queries, isLoading } = useQuery<CustomerQuery[]>({ queryKey: ["/api/customer-queries"] });
  const { data: pkgs } = useQuery<Package[]>({ queryKey: ["/api/packages"] });
  const { data: vendorsList } = useQuery<any[]>({ queryKey: ["/api/vendors"] });
  const { data: employeesList } = useQuery<any[]>({ queryKey: ["/api/employees"] });
  const { data: systemUsers } = useQuery<any[]>({ queryKey: ["/api/users"] });
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { canCreate, canDelete } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [setupByFilter, setSetupByFilter] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("");
  const [entriesCount, setEntriesCount] = useState(10);
  const [editOpen, setEditOpen] = useState(false);
  const [editingQuery, setEditingQuery] = useState<CustomerQuery | null>(null);

  // Workflow dialog state
  const [wfQuery, setWfQuery] = useState<CustomerQuery | null>(null);
  const [wfApproveOpen, setWfApproveOpen] = useState(false);
  const [wfApproveNotes, setWfApproveNotes] = useState("");
  const [wfRejectOpen, setWfRejectOpen] = useState(false);
  const [wfRejectReason, setWfRejectReason] = useState("");
  const [wfRejectedByUser, setWfRejectedByUser] = useState("");
  const [wfAssignOpen, setWfAssignOpen] = useState(false);
  const [wfAssignEmployeeId, setWfAssignEmployeeId] = useState("");
  const [wfAssignNotes, setWfAssignNotes] = useState("");
  const [wfReqOpen, setWfReqOpen] = useState(false);
  const [wfReqForm, setWfReqForm] = useState({ packageId: "", serviceType: "", connectionType: "", bandwidthRequired: "", monthlyCharges: "", otcCharge: "", installationFee: "", securityDeposit: "", popId: "", staticIp: false, remarks: "" });
  const [wfApprovedByUser, setWfApprovedByUser] = useState("");
  const [wfFinalOpen, setWfFinalOpen] = useState(false);
  const [wfFinalNotes, setWfFinalNotes] = useState("");
  const [wfFinalApprovedByUser, setWfFinalApprovedByUser] = useState("");
  const [wfSendBackOpen, setWfSendBackOpen] = useState(false);
  const [wfSendBackNotes, setWfSendBackNotes] = useState("");

  const wfInvalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/customer-queries"] });

  const openWfDialog = (q: CustomerQuery, dialog: "pending" | "approved" | "assigned" | "underReview" | "finalApproved" | "converted") => {
    setWfQuery(q);
    if (dialog === "pending") { setWfSendBackNotes(""); setWfSendBackOpen(true); }
    else if (dialog === "approved") { setWfApproveNotes(""); setWfApproveOpen(true); }
    else if (dialog === "assigned") { setWfAssignEmployeeId(""); setWfAssignNotes(""); setWfAssignOpen(true); }
    else if (dialog === "underReview") {
      setWfReqForm({ packageId: String(q.packageId || ""), serviceType: q.serviceType || "", connectionType: q.connectionType || "", bandwidthRequired: (q as any).bandwidthRequired || "", monthlyCharges: String((q as any).monthlyCharges || ""), otcCharge: String((q as any).otcCharge || ""), installationFee: String((q as any).installationFee || ""), securityDeposit: String((q as any).securityDeposit || ""), popId: (q as any).popId || "", staticIp: (q as any).staticIp || false, remarks: q.remarks || "" });
      setWfReqOpen(true);
    }
    else if (dialog === "finalApproved") { setWfFinalNotes(""); setWfFinalOpen(true); }
    else if (dialog === "converted") {
      const ct = (q as any).customerType;
      if (ct === "CIR") setLocation(`/add-customer?type=cir&fromQuery=${q.id}`);
      else if (ct === "Corporate") setLocation(`/add-customer?type=corporate&fromQuery=${q.id}`);
      else if (ct === "Reseller") setLocation(`/resellers/add?fromQuery=${q.id}`);
      else setLocation(`/add-customer?fromQuery=${q.id}`);
      return;
    }
  };

  const wfApproveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/customer-queries/${wfQuery?.id}/approve`, { notes: wfApproveNotes, approvedBy: wfApprovedByUser || undefined }),
    onSuccess: () => { toast({ title: "Approved" }); wfInvalidate(); setWfApproveOpen(false); setWfApproveNotes(""); setWfApprovedByUser(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed", variant: "destructive" }),
  });
  const wfRejectMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/customer-queries/${wfQuery?.id}/reject`, { reason: wfRejectReason, rejectedBy: wfRejectedByUser || undefined }),
    onSuccess: () => { toast({ title: "Rejected" }); wfInvalidate(); setWfRejectOpen(false); setWfRejectReason(""); setWfRejectedByUser(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed", variant: "destructive" }),
  });
  const wfAssignMutation = useMutation({
    mutationFn: () => {
      const emp = (employeesList || []).find((e: any) => String(e.id) === wfAssignEmployeeId);
      return apiRequest("POST", `/api/customer-queries/${wfQuery?.id}/assign`, { employeeId: emp?.id || null, employeeName: emp?.fullName || wfAssignEmployeeId, notes: wfAssignNotes });
    },
    onSuccess: () => { toast({ title: "Assigned" }); wfInvalidate(); setWfAssignOpen(false); },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed", variant: "destructive" }),
  });
  const wfReqMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/customer-queries/${wfQuery?.id}/submit-requirements`, { packageId: wfReqForm.packageId ? Number(wfReqForm.packageId) : null, serviceType: wfReqForm.serviceType || null, connectionType: wfReqForm.connectionType || null, bandwidthRequired: wfReqForm.bandwidthRequired || null, monthlyCharges: wfReqForm.monthlyCharges || null, otcCharge: wfReqForm.otcCharge || null, installationFee: wfReqForm.installationFee || null, securityDeposit: wfReqForm.securityDeposit || null, popId: wfReqForm.popId || null, staticIp: wfReqForm.staticIp, remarks: wfReqForm.remarks || null, notes: wfReqForm.remarks }),
    onSuccess: () => { toast({ title: "Requirements Submitted" }); wfInvalidate(); setWfReqOpen(false); },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed", variant: "destructive" }),
  });
  const wfFinalMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/customer-queries/${wfQuery?.id}/final-approve`, { notes: wfFinalNotes, approvedBy: wfFinalApprovedByUser || undefined }),
    onSuccess: () => { toast({ title: "Final Approved" }); wfInvalidate(); setWfFinalOpen(false); setWfFinalNotes(""); setWfFinalApprovedByUser(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed", variant: "destructive" }),
  });
  const wfSendBackMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/customer-queries/${wfQuery?.id}/send-back`, { notes: wfSendBackNotes }),
    onSuccess: () => { toast({ title: "Reset to Pending" }); wfInvalidate(); setWfSendBackOpen(false); setWfSendBackNotes(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed", variant: "destructive" }),
  });
  const [editForm, setEditForm] = useState({
    name: "", phone: "", email: "", address: "", area: "", city: "",
    serviceType: "", connectionType: "", remarks: "", popId: "", staticIp: false,
    bandwidthRequired: "", panelUsersCapacity: "", bandwidthVendorId: 0, panelVendorId: 0, packageId: 0,
  });

  const openEditDialog = (q: CustomerQuery) => {
    setEditingQuery(q);
    setEditForm({
      name: q.name || "",
      phone: q.phone || "",
      email: q.email || "",
      address: q.address || "",
      area: q.area || "",
      city: q.city || "",
      serviceType: q.serviceType || "",
      connectionType: q.connectionType || "",
      remarks: q.remarks || "",
      popId: q.popId || "",
      staticIp: q.staticIp || false,
      bandwidthRequired: q.bandwidthRequired || "",
      panelUsersCapacity: q.panelUsersCapacity || "",
      bandwidthVendorId: q.bandwidthVendorId || 0,
      panelVendorId: q.panelVendorId || 0,
      packageId: q.packageId || 0,
    });
    setEditOpen(true);
  };

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editingQuery) return;
      const ct = editingQuery.customerType;
      const payload: Record<string, any> = {
        name: editForm.name || null,
        phone: editForm.phone || null,
        email: editForm.email || null,
        address: editForm.address || null,
        area: editForm.area || null,
        city: editForm.city || null,
        serviceType: editForm.serviceType || null,
        connectionType: editForm.connectionType || null,
        remarks: editForm.remarks || null,
        popId: editForm.popId || null,
        staticIp: editForm.staticIp,
      };
      if (ct === "CIR" || ct === "Corporate") payload.bandwidthRequired = editForm.bandwidthRequired || null;
      if (ct === "CIR") payload.bandwidthVendorId = editForm.bandwidthVendorId || null;
      if (ct === "Reseller") payload.panelUsersCapacity = editForm.panelUsersCapacity || null;
      if (ct === "Reseller") payload.panelVendorId = editForm.panelVendorId || null;
      if (!["CIR", "Corporate", "Reseller"].includes(ct || "")) payload.packageId = editForm.packageId || null;
      await apiRequest("PATCH", `/api/customer-queries/${editingQuery.id}`, payload);
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Client request updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-queries"] });
      setEditOpen(false);
    },
    onError: () => toast({ title: "Error", description: "Failed to update client request.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/customer-queries/${id}`); },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Client request deleted." });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-queries"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/customer-queries/${id}`, { status });
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Status updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-queries"] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, setupBy }: { id: number; setupBy: string }) => {
      await apiRequest("PATCH", `/api/customer-queries/${id}`, { setupBy, setupTime: new Date().toISOString() });
    },
    onSuccess: () => {
      toast({ title: "Assigned", description: "Setup assigned." });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-queries"] });
    },
  });

  const getPackageName = (pkgId: number | null) => {
    if (!pkgId || !pkgs) return "-";
    const p = pkgs.find(p => p.id === pkgId);
    return p ? p.name : "-";
  };

  const getVendorName = (vendorId: number | null | undefined) => {
    if (!vendorId || !vendorsList) return "-";
    const v = vendorsList.find((v: any) => v.id === vendorId);
    return v ? v.name : "-";
  };

  const getPackageCell = (q: CustomerQuery) => {
    const ct = q.customerType;
    if (ct === "CIR" || ct === "Corporate") return q.bandwidthRequired || "-";
    if (ct === "Reseller") return q.panelUsersCapacity || "-";
    return getPackageName(q.packageId);
  };

  const getPackageLabel = (q: CustomerQuery) => {
    const ct = q.customerType;
    if (ct === "CIR" || ct === "Corporate") return "bw";
    if (ct === "Reseller") return "cap";
    return "pkg";
  };

  const getVendorCell = (q: CustomerQuery) => {
    const ct = q.customerType;
    if (ct === "CIR") return getVendorName(q.bandwidthVendorId);
    if (ct === "Reseller") return getVendorName(q.panelVendorId);
    return "-";
  };

  const filtered = (queries || []).filter(q => {
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      if (!q.name.toLowerCase().includes(s) && !q.phone.includes(s) && !q.queryId.toLowerCase().includes(s) && !(q.address || "").toLowerCase().includes(s)) return false;
    }
    if (statusFilter && statusFilter !== "all" && q.status !== statusFilter) return false;
    if (createdByFilter && createdByFilter !== "all" && q.createdBy !== createdByFilter) return false;
    if (setupByFilter && setupByFilter !== "all" && q.setupBy !== setupByFilter) return false;
    if (fromDate && q.createdAt < fromDate) return false;
    if (toDate && q.createdAt > toDate + "T23:59:59") return false;
    return true;
  });

  const displayed = filtered.slice(0, entriesCount);

  const uniqueCreatedBy = Array.from(new Set((queries || []).map(q => q.createdBy).filter(Boolean))) as string[];
  const uniqueSetupBy = Array.from(new Set((queries || []).map(q => q.setupBy).filter(Boolean))) as string[];

  const statusBadge = (status: string) => {
    const s = status.toLowerCase();
    const map: Record<string, string> = {
      pending: "bg-orange-500 hover:bg-orange-600 text-white",
      completed: "bg-green-600 hover:bg-green-700 text-white",
      approved: "bg-green-600 hover:bg-green-700 text-white",
      rejected: "bg-red-500 hover:bg-red-600 text-white",
      converted: "bg-blue-600 hover:bg-blue-700 text-white",
    };
    return <Badge className={`text-xs ${map[s] || "bg-gray-500 text-white"}`} data-testid={`badge-status-${s}`}>{status}</Badge>;
  };

  const connectivityBadge = (val: string | null) => {
    const v = (val || "Pending").toLowerCase();
    if (v === "completed" || v === "paid" || v === "connected") return <Badge className="bg-green-600 text-white text-xs">{val}</Badge>;
    return <Badge className="bg-orange-500 text-white text-xs">{val || "Pending"}</Badge>;
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) + " " + new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch { return d; }
  };

  const getDuration = (createdAt: string | null) => {
    if (!createdAt) return "-";
    const diff = Date.now() - new Date(createdAt).getTime();
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${d}d:${h}h:${m}m:${s}s`;
  };

  if (isLoading) return <div className="mt-5 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="mt-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Client Request</h2>
          <span className="text-sm text-muted-foreground">New Client Request</span>
        </div>
        {canCreate("customers") && (
          <Button onClick={() => setTab("query-new")} className="bg-blue-600 hover:bg-blue-700" data-testid="button-new-request">
            <Plus className="h-4 w-4 mr-1" />
            Client Request
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">From Date</label>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} data-testid="input-filter-from-date" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">To Date</label>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} data-testid="input-filter-to-date" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">Setup Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-filter-status"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">Setup By / Assign To</label>
              <Select value={setupByFilter} onValueChange={setSetupByFilter}>
                <SelectTrigger data-testid="select-filter-setup-by"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueSetupBy.map(s => <SelectItem key={s} value={s!}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">Created By</label>
              <Select value={createdByFilter} onValueChange={setCreatedByFilter}>
                <SelectTrigger data-testid="select-filter-created-by"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueCreatedBy.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm">
              <span>Show</span>
              <Select value={String(entriesCount)} onValueChange={v => setEntriesCount(Number(v))}>
                <SelectTrigger className="w-[70px] h-8" data-testid="select-entries-count"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Search:</span>
              <Input
                placeholder=""
                className="w-[180px] h-8"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                data-testid="input-search-requests"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium" data-testid="text-request-list-empty">No client requests yet</p>
              <p className="text-sm mt-1">Client requests will appear here once submitted.</p>
              <Button variant="outline" className="mt-4" onClick={() => setTab("query-new")} data-testid="button-create-first-request">
                <Plus className="h-4 w-4 mr-1" /> Create First Request
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1a3a5c] dark:bg-[#1a3a5c]">
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">SN</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">Cus.Name</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">Mobile</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">Address</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">Zone</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">Subzone</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">Cus.Type</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">Conn.Type</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">Package/BW/Cap</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">Vendor</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">M.Bill</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">B.Date</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">OTC(Conn.Charge)</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">Phy.Connectivity</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">Created By</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">Created On</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">Setup By</TableHead>
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">SetUp Time</TableHead>
                    <TableHead className="text-white font-semibold text-xs w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((q, idx) => (
                    <TableRow key={q.id} className="text-xs" data-testid={`row-request-${q.id}`}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        <Link href={`/client-requests/${q.id}`} className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                          {q.name}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{q.phone}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{q.address || "-"}</TableCell>
                      <TableCell>{q.zone || "-"}</TableCell>
                      <TableCell>{q.subzone || "-"}</TableCell>
                      <TableCell>{q.customerType || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{q.connectionType || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{getPackageCell(q)}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            {getPackageLabel(q) === "bw" ? "Bandwidth" : getPackageLabel(q) === "cap" ? "Capacity" : "Package"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{getVendorCell(q)}</TableCell>
                      <TableCell>{q.monthlyCharges || "-"}</TableCell>
                      <TableCell>{q.billingDate || "-"}</TableCell>
                      <TableCell>{q.otcCharge || "-"}</TableCell>
                      <TableCell>{connectivityBadge(q.phyConnectivity)}</TableCell>
                      <TableCell>{q.createdBy || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(q.createdAt)}</TableCell>
                      <TableCell>{statusBadge(q.status)}</TableCell>
                      <TableCell>
                        {q.setupBy ? (
                          <Badge className="bg-green-600 text-white text-xs">{q.setupBy}</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs px-2"
                            onClick={() => assignMutation.mutate({ id: q.id, setupBy: "admin" })}
                            data-testid={`button-assign-${q.id}`}
                          >
                            Assign
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <span className="text-xs">Duration</span><br />
                        <span className="font-mono text-[10px]">{getDuration(q.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6" data-testid={`button-request-actions-${q.id}`}>
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild data-testid={`action-view-profile-${q.id}`}>
                              <Link href={`/client-requests/${q.id}`} className="flex items-center cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" /> View Client Request Profile
                              </Link>
                            </DropdownMenuItem>
                            {canCreate("customers") && (
                              <DropdownMenuItem onClick={() => openEditDialog(q)} data-testid={`action-edit-request-${q.id}`}>
                                <Edit className="h-4 w-4 mr-2" /> Edit Client Request
                              </DropdownMenuItem>
                            )}
                            {canCreate("customers") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-2 py-1">Set Status</DropdownMenuLabel>
                                {([
                                  { status: "Approved", color: "text-green-600", icon: <CheckCircle2 className="h-3.5 w-3.5 mr-2" />, dialog: "approved" as const },
                                  { status: "Assigned", color: "text-blue-600", icon: <UserCheck className="h-3.5 w-3.5 mr-2" />, dialog: "assigned" as const },
                                  { status: "Under Review", color: "text-purple-600", icon: <ClipboardList className="h-3.5 w-3.5 mr-2" />, dialog: "underReview" as const },
                                  { status: "Final Approved", color: "text-emerald-600", icon: <BadgeCheck className="h-3.5 w-3.5 mr-2" />, dialog: "finalApproved" as const },
                                  { status: "Converted", color: "text-slate-600", icon: <Users className="h-3.5 w-3.5 mr-2" />, dialog: "converted" as const },
                                ]).map(({ status, color, icon, dialog }) => (
                                  <DropdownMenuItem
                                    key={status}
                                    onClick={() => openWfDialog(q, dialog)}
                                    className={`${color} ${q.status === status ? "font-bold bg-muted" : ""}`}
                                    data-testid={`action-status-${status.toLowerCase().replace(/\s+/g, "-")}-${q.id}`}
                                  >
                                    {icon} {status}
                                    {q.status === status && <span className="ml-auto text-xs">✓</span>}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500" onClick={() => { setWfQuery(q); setWfRejectReason(""); setWfRejectOpen(true); }} data-testid={`action-reject-${q.id}`}>
                                  <WifiOff className="h-3.5 w-3.5 mr-2" /> Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {canDelete("customers") && (
                              <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate(q.id)} data-testid={`action-delete-${q.id}`}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
              <span>Showing {Math.min(displayed.length, entriesCount)} of {filtered.length} entries</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Client Request Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4" /> Edit Client Request
            </DialogTitle>
          </DialogHeader>
          {editingQuery && (
            <div className="space-y-5 py-2">
              {/* Section: Personal / Contact */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Contact Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Full Name <span className="text-red-500">*</span></label>
                    <Input value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Full name" data-testid="input-edit-name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Phone <span className="text-red-500">*</span></label>
                    <Input value={editForm.phone} onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="Phone number" data-testid="input-edit-phone" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email</label>
                    <Input value={editForm.email} onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))} placeholder="Email address" type="email" data-testid="input-edit-email" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Area</label>
                    <Input value={editForm.area} onChange={e => setEditForm(prev => ({ ...prev, area: e.target.value }))} placeholder="Area" data-testid="input-edit-area" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">City</label>
                    <Input value={editForm.city} onChange={e => setEditForm(prev => ({ ...prev, city: e.target.value }))} placeholder="City" data-testid="input-edit-city" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-sm font-medium">Address</label>
                    <Input value={editForm.address} onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))} placeholder="Full address" data-testid="input-edit-address" />
                  </div>
                </div>
              </div>

              {/* Section: Service Details */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Service Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Customer Type</label>
                    <Input value={editingQuery.customerType || "—"} disabled className="bg-muted text-muted-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Service Type</label>
                    <Select value={editForm.serviceType} onValueChange={v => setEditForm(prev => ({ ...prev, serviceType: v }))}>
                      <SelectTrigger data-testid="select-edit-service-type"><SelectValue placeholder="Select service type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fiber">Fiber</SelectItem>
                        <SelectItem value="Wireless">Wireless</SelectItem>
                        <SelectItem value="DSL">DSL</SelectItem>
                        <SelectItem value="Cable">Cable</SelectItem>
                        <SelectItem value="VSAT">VSAT</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Connection Type</label>
                    <Select value={editForm.connectionType} onValueChange={v => setEditForm(prev => ({ ...prev, connectionType: v }))}>
                      <SelectTrigger data-testid="select-edit-connection-type"><SelectValue placeholder="Select connection type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Migration">Migration</SelectItem>
                        <SelectItem value="Upgrade">Upgrade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">POP Location</label>
                    <Input value={editForm.popId} onChange={e => setEditForm(prev => ({ ...prev, popId: e.target.value }))} placeholder="POP ID / location" data-testid="input-edit-pop" />
                  </div>
                  <div className="col-span-2 flex items-center gap-2 pt-1">
                    <input type="checkbox" id="edit-static-ip" checked={editForm.staticIp} onChange={e => setEditForm(prev => ({ ...prev, staticIp: e.target.checked }))} className="h-4 w-4 cursor-pointer" data-testid="checkbox-edit-static-ip" />
                    <label htmlFor="edit-static-ip" className="text-sm font-medium cursor-pointer">Static IP Required</label>
                  </div>
                </div>
              </div>

              {/* Section: Package / Bandwidth / Vendor (context-aware) */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {editingQuery.customerType === "Reseller" ? "Panel Capacity & Vendor" : "Package / Bandwidth"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(editingQuery.customerType === "CIR" || editingQuery.customerType === "Corporate") && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Bandwidth Required</label>
                      <Input value={editForm.bandwidthRequired} onChange={e => setEditForm(prev => ({ ...prev, bandwidthRequired: e.target.value }))} placeholder="e.g. 100 Mbps, 1 Gbps" data-testid="input-edit-bandwidth" />
                    </div>
                  )}
                  {editingQuery.customerType === "CIR" && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Bandwidth Vendor</label>
                      <Select value={editForm.bandwidthVendorId ? String(editForm.bandwidthVendorId) : ""} onValueChange={v => setEditForm(prev => ({ ...prev, bandwidthVendorId: Number(v) }))}>
                        <SelectTrigger data-testid="select-edit-bw-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                        <SelectContent>
                          {(vendorsList || []).map((v: any) => (
                            <SelectItem key={v.id} value={String(v.id)}>{v.name}{v.serviceType ? ` – ${v.serviceType}` : ""}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {editingQuery.customerType === "Reseller" && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Panel Users Capacity</label>
                      <Input type="number" value={editForm.panelUsersCapacity} onChange={e => setEditForm(prev => ({ ...prev, panelUsersCapacity: e.target.value }))} placeholder="e.g. 500" data-testid="input-edit-capacity" />
                    </div>
                  )}
                  {editingQuery.customerType === "Reseller" && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Panel Vendor</label>
                      <Select value={editForm.panelVendorId ? String(editForm.panelVendorId) : ""} onValueChange={v => setEditForm(prev => ({ ...prev, panelVendorId: Number(v) }))}>
                        <SelectTrigger data-testid="select-edit-panel-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                        <SelectContent>
                          {(vendorsList || []).map((v: any) => (
                            <SelectItem key={v.id} value={String(v.id)}>{v.name}{v.serviceType ? ` – ${v.serviceType}` : ""}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {!["CIR", "Corporate", "Reseller"].includes(editingQuery.customerType || "") && (
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-sm font-medium">Package</label>
                      <Select value={editForm.packageId ? String(editForm.packageId) : ""} onValueChange={v => setEditForm(prev => ({ ...prev, packageId: Number(v) }))}>
                        <SelectTrigger data-testid="select-edit-package"><SelectValue placeholder="Select package" /></SelectTrigger>
                        <SelectContent>
                          {(pkgs || []).filter(p => p.isActive).map(p => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Section: Remarks */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Remarks / Notes</label>
                <textarea
                  value={editForm.remarks}
                  onChange={e => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Any additional notes..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  data-testid="textarea-edit-remarks"
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending || !editForm.name || !editForm.phone} className="bg-[#1c67d4] hover:bg-[#1558b8] text-white" data-testid="button-edit-request-save">
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow: Reset to Pending */}
      <Dialog open={wfSendBackOpen} onOpenChange={setWfSendBackOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-orange-500" /> Reset to Pending</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Reset <strong>{wfQuery?.name}</strong>'s request back to <span className="font-semibold text-orange-600">Pending</span> status. Your name will be recorded as the accepting officer.</p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Reason / Notes <span className="text-red-500">*</span></label>
              <textarea value={wfSendBackNotes} onChange={e => setWfSendBackNotes(e.target.value)} rows={3} placeholder="State why this is being reset to pending..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" data-testid="textarea-wf-sendback-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWfSendBackOpen(false)}>Cancel</Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => wfSendBackMutation.mutate()} disabled={wfSendBackMutation.isPending || !wfSendBackNotes.trim()} data-testid="button-wf-sendback-confirm">
              {wfSendBackMutation.isPending ? "Processing..." : "Reset to Pending"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow: Approve */}
      <Dialog open={wfApproveOpen} onOpenChange={setWfApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Approve / Reject Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Review <strong>{wfQuery?.name}</strong>'s request before confirming approval or rejection.</p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Approved By <span className="text-red-500">*</span></label>
              <Select key={wfApproveOpen ? "open" : "closed"} value={wfApprovedByUser} onValueChange={setWfApprovedByUser}>
                <SelectTrigger data-testid="select-wf-approve-user" className="w-full">
                  <SelectValue placeholder="Select approver..." />
                </SelectTrigger>
                <SelectContent>
                  {(systemUsers ?? []).filter((u: any) => u.isActive !== false && u.accountStatus !== "inactive").map((u: any) => (
                    <SelectItem key={u.id} value={u.username}>
                      <div className="flex flex-col">
                        <span className="font-medium">{u.fullName}</span>
                        <span className="text-xs text-muted-foreground capitalize">{u.role}{u.department ? ` · ${u.department}` : ""}{u.branch ? ` · ${u.branch}` : ""}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Approval Notes (optional)</label>
              <textarea value={wfApproveNotes} onChange={e => setWfApproveNotes(e.target.value)} rows={2} placeholder="Any notes for the approval..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" data-testid="textarea-wf-approve-notes" />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setWfApproveOpen(false)} className="sm:mr-auto">Cancel</Button>
            <Button variant="destructive" onClick={() => { setWfApproveOpen(false); setWfRejectReason(""); setWfRejectOpen(true); }} data-testid="button-wf-reject-instead">
              <XCircle className="h-4 w-4 mr-1" /> Reject Instead
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => wfApproveMutation.mutate()} disabled={wfApproveMutation.isPending} data-testid="button-wf-approve-confirm">
              {wfApproveMutation.isPending ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow: Reject */}
      <Dialog open={wfRejectOpen} onOpenChange={setWfRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" /> Reject Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Reject <strong>{wfQuery?.name}</strong>'s request. Please select the authorised person and provide a reason.</p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Rejected By <span className="text-red-500">*</span></label>
              <Select key={wfRejectOpen ? "open" : "closed"} value={wfRejectedByUser} onValueChange={setWfRejectedByUser}>
                <SelectTrigger data-testid="select-wf-rejected-by-user" className="w-full">
                  <SelectValue placeholder="Select authorised person..." />
                </SelectTrigger>
                <SelectContent>
                  {(systemUsers ?? []).filter((u: any) => u.isActive !== false && u.accountStatus !== "inactive").map((u: any) => (
                    <SelectItem key={u.id} value={u.username}>
                      <div className="flex flex-col">
                        <span className="font-medium">{u.fullName}</span>
                        <span className="text-xs text-muted-foreground capitalize">{u.role}{u.department ? ` · ${u.department}` : ""}{u.branch ? ` · ${u.branch}` : ""}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Reason for Rejection <span className="text-red-500">*</span></label>
              <textarea value={wfRejectReason} onChange={e => setWfRejectReason(e.target.value)} rows={3} placeholder="Explain why this request is being rejected..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" data-testid="textarea-wf-reject-reason" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWfRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => wfRejectMutation.mutate()} disabled={wfRejectMutation.isPending || !wfRejectReason.trim()} data-testid="button-wf-reject-confirm">
              {wfRejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow: Assign Employee */}
      <Dialog open={wfAssignOpen} onOpenChange={setWfAssignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-blue-600" /> Assign Employee</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Select an employee to visit <strong>{wfQuery?.name}</strong>'s site and collect requirements.</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Employee <span className="text-red-500">*</span></label>
              <Select value={wfAssignEmployeeId} onValueChange={setWfAssignEmployeeId}>
                <SelectTrigger data-testid="select-wf-assign-employee"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {(employeesList || []).filter((e: any) => e.status === "active").map((e: any) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.fullName} — {e.designation}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Assignment Notes (optional)</label>
              <textarea value={wfAssignNotes} onChange={e => setWfAssignNotes(e.target.value)} rows={2} placeholder="Instructions for the employee..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" data-testid="textarea-wf-assign-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWfAssignOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => wfAssignMutation.mutate()} disabled={wfAssignMutation.isPending || !wfAssignEmployeeId} data-testid="button-wf-assign-confirm">
              {wfAssignMutation.isPending ? "Assigning..." : "Assign Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow: Under Review (Site Requirements) */}
      <Dialog open={wfReqOpen} onOpenChange={setWfReqOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-purple-600" /> Submit Site Requirements</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Fill in requirements for <strong>{wfQuery?.name}</strong> collected during the site visit. This will submit for admin final review.</p>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              {!["CIR", "Corporate", "Reseller"].includes(wfQuery?.customerType || "") && (
                <div className="col-span-2 space-y-1.5">
                  <label className="text-sm font-medium">Package</label>
                  <Select value={wfReqForm.packageId} onValueChange={v => setWfReqForm(prev => ({ ...prev, packageId: v }))}>
                    <SelectTrigger data-testid="select-wf-req-package"><SelectValue placeholder="Select package" /></SelectTrigger>
                    <SelectContent>
                      {(pkgs || []).filter(p => p.isActive).map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name} — {p.speed}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(wfQuery?.customerType === "CIR" || wfQuery?.customerType === "Corporate") && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Bandwidth Required</label>
                  <Input value={wfReqForm.bandwidthRequired} onChange={e => setWfReqForm(prev => ({ ...prev, bandwidthRequired: e.target.value }))} placeholder="e.g. 100 Mbps" data-testid="input-wf-req-bandwidth" />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Connectivity Type</label>
                <Select value={wfReqForm.serviceType} onValueChange={v => setWfReqForm(prev => ({ ...prev, serviceType: v }))}>
                  <SelectTrigger data-testid="select-wf-req-service"><SelectValue placeholder="Select connectivity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fiber">Fiber / FTTH</SelectItem>
                    <SelectItem value="Wireless">Wireless / Radio</SelectItem>
                    <SelectItem value="DSL">DSL</SelectItem>
                    <SelectItem value="Cable">Cable</SelectItem>
                    <SelectItem value="VSAT">VSAT / Satellite</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Connection Type</label>
                <Select value={wfReqForm.connectionType} onValueChange={v => setWfReqForm(prev => ({ ...prev, connectionType: v }))}>
                  <SelectTrigger data-testid="select-wf-req-connection"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New Connection</SelectItem>
                    <SelectItem value="Migration">Migration</SelectItem>
                    <SelectItem value="Upgrade">Upgrade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Monthly Charges (PKR)</label>
                <Input type="number" value={wfReqForm.monthlyCharges} onChange={e => setWfReqForm(prev => ({ ...prev, monthlyCharges: e.target.value }))} placeholder="0.00" data-testid="input-wf-req-monthly" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">OTC Charges (PKR)</label>
                <Input type="number" value={wfReqForm.otcCharge} onChange={e => setWfReqForm(prev => ({ ...prev, otcCharge: e.target.value }))} placeholder="0.00" data-testid="input-wf-req-otc" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Installation Fee (PKR)</label>
                <Input type="number" value={wfReqForm.installationFee} onChange={e => setWfReqForm(prev => ({ ...prev, installationFee: e.target.value }))} placeholder="0.00" data-testid="input-wf-req-install" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Security Deposit (PKR)</label>
                <Input type="number" value={wfReqForm.securityDeposit} onChange={e => setWfReqForm(prev => ({ ...prev, securityDeposit: e.target.value }))} placeholder="0.00" data-testid="input-wf-req-deposit" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">POP / Exchange Location</label>
                <Input value={wfReqForm.popId} onChange={e => setWfReqForm(prev => ({ ...prev, popId: e.target.value }))} placeholder="POP ID or location" data-testid="input-wf-req-pop" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="wf-req-static-ip" checked={wfReqForm.staticIp} onChange={e => setWfReqForm(prev => ({ ...prev, staticIp: e.target.checked }))} className="h-4 w-4 cursor-pointer" data-testid="checkbox-wf-req-static-ip" />
                <label htmlFor="wf-req-static-ip" className="text-sm font-medium cursor-pointer">Static IP Required</label>
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Site Visit Notes / Installation Equipment</label>
                <textarea value={wfReqForm.remarks} onChange={e => setWfReqForm(prev => ({ ...prev, remarks: e.target.value }))} rows={3} placeholder="Fiber deployment needed, router model, cable requirements, equipment list..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" data-testid="textarea-wf-req-notes" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWfReqOpen(false)}>Cancel</Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => wfReqMutation.mutate()} disabled={wfReqMutation.isPending} data-testid="button-wf-req-confirm">
              {wfReqMutation.isPending ? "Submitting..." : "Submit for Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow: Final Approve */}
      <Dialog open={wfFinalOpen} onOpenChange={setWfFinalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-600" /> Final Approval / Rejection</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Give your final decision on <strong>{wfQuery?.name}</strong>'s submitted requirements.</p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Approved By <span className="text-red-500">*</span></label>
              <Select key={wfFinalOpen ? "open" : "closed"} value={wfFinalApprovedByUser} onValueChange={setWfFinalApprovedByUser}>
                <SelectTrigger data-testid="select-wf-final-approve-user" className="w-full">
                  <SelectValue placeholder="Select approver..." />
                </SelectTrigger>
                <SelectContent>
                  {(systemUsers ?? []).filter((u: any) => u.isActive !== false && u.accountStatus !== "inactive").map((u: any) => (
                    <SelectItem key={u.id} value={u.username}>
                      <div className="flex flex-col">
                        <span className="font-medium">{u.fullName}</span>
                        <span className="text-xs text-muted-foreground capitalize">{u.role}{u.department ? ` · ${u.department}` : ""}{u.branch ? ` · ${u.branch}` : ""}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Final Notes (optional)</label>
              <textarea value={wfFinalNotes} onChange={e => setWfFinalNotes(e.target.value)} rows={2} placeholder="Any final notes..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" data-testid="textarea-wf-final-notes" />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setWfFinalOpen(false)} className="sm:mr-auto">Cancel</Button>
            <Button variant="destructive" onClick={() => { setWfFinalOpen(false); setWfRejectReason(""); setWfRejectOpen(true); }} data-testid="button-wf-final-reject-instead">
              <XCircle className="h-4 w-4 mr-1" /> Reject Instead
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => wfFinalMutation.mutate()} disabled={wfFinalMutation.isPending} data-testid="button-wf-final-confirm">
              {wfFinalMutation.isPending ? "Approving..." : "Final Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="bg-[#1a3a5c] text-white px-4 py-3 rounded-t-lg flex items-center gap-2">
      {icon}
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-xs text-white/70">{subtitle}</p>
      </div>
    </div>
  );
}

function ProfilePictureUpload({ value, onChange, testId }: { value: string; onChange: (url: string) => void; testId: string }) {
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/document", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onChange(data.url);
    } catch { onChange(""); }
    finally { setUploading(false); }
  };
  return (
    <label className="relative w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-pointer overflow-hidden group" data-testid={testId}>
      {value ? (
        <img src={value} alt="Profile" className="w-full h-full object-cover" />
      ) : (
        <User className="h-12 w-12 text-gray-400" />
      )}
      <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5">
        <Edit className="h-3 w-3 text-white" />
      </div>
      <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
    </label>
  );
}

function DocUploadField({ value, onChange, testId }: { value: string; onChange: (url: string) => void; testId: string }) {
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/document", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onChange(data.url);
    } catch { onChange(""); }
    finally { setUploading(false); }
  };
  return (
    <label className="relative w-full h-20 rounded-lg bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer overflow-hidden" data-testid={testId}>
      {value ? (
        <img src={value} alt="Document" className="h-full object-contain" />
      ) : (
        <div className="flex flex-col items-center text-gray-400">
          <FileText className="h-8 w-8" />
        </div>
      )}
      <div className="absolute bottom-1 right-1 bg-blue-600 rounded-full p-1">
        <Edit className="h-3 w-3 text-white" />
      </div>
      <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUpload} disabled={uploading} />
    </label>
  );
}

const WIZARD_STEPS = [
  { id: 1, label: "Basic Info", shortLabel: "Basic" },
  { id: 2, label: "Connection Info", shortLabel: "Connection" },
  { id: 3, label: "Documents", shortLabel: "Docs" },
  { id: 4, label: "Area Info", shortLabel: "Area" },
  { id: 5, label: "Infrastructure", shortLabel: "Infra" },
  { id: 6, label: "Notifications", shortLabel: "Notify" },
];

function WizardStepBar({ currentStep, onStepClick }: { currentStep: number; onStepClick: (s: number) => void }) {
  return (
    <div className="flex w-full mb-6 overflow-x-auto">
      {WIZARD_STEPS.map((step, idx) => {
        const isActive = currentStep === step.id;
        const isDone = currentStep > step.id;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => isDone && onStepClick(step.id)}
            className={`flex-1 relative flex items-center justify-center gap-2 py-3 px-3 text-xs font-semibold transition-all select-none
              ${isActive ? "bg-[#1a3a5c] text-white" : isDone ? "bg-[#1a3a5c]/80 text-white cursor-pointer hover:bg-[#1a3a5c]" : "bg-gray-100 dark:bg-gray-800 text-muted-foreground cursor-default"}
              ${idx === 0 ? "rounded-l-lg" : ""} ${idx === WIZARD_STEPS.length - 1 ? "rounded-r-lg" : ""}
            `}
            data-testid={`wizard-step-${step.id}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0
              ${isActive ? "bg-white text-[#1a3a5c]" : isDone ? "bg-green-400 text-white" : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"}`}>
              {isDone ? <Check className="h-3 w-3" /> : step.id}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
            <span className="sm:hidden">{step.shortLabel}</span>
            {idx < WIZARD_STEPS.length - 1 && (
              <span className="absolute -right-px top-0 bottom-0 w-3 flex items-center justify-center z-10 pointer-events-none">
                <svg viewBox="0 0 12 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-3">
                  <path d="M0 0 L12 20 L0 40" fill={isActive || isDone ? "#1a3a5c" : "#e5e7eb"} className="dark:fill-gray-800" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function AddCustomerForm({ setTab, packages, vendors, employees, areas }: {
  setTab: (v: string) => void;
  packages: Package[] | undefined;
  vendors: any[] | undefined;
  employees: any[] | undefined;
  areas: any[] | undefined;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [sameAddress, setSameAddress] = useState(false);
  const [formData, setFormData] = useState({
    profilePicture: "", fullName: "", occupation: "", remarks: "",
    nidNumber: "", nidPicture: "", registrationFormNo: "", registrationFormPicture: "",
    gender: "", dateOfBirth: "", fatherName: "", motherName: "",
    mapLatitude: "", mapLongitude: "", phone: "", phoneNumber: "", email: "",
    district: "", upazilaThana: "", roadNumber: "", houseNumber: "",
    presentAddress: "", permanentAddress: "",
    facebookUrl: "", linkedinUrl: "", twitterUrl: "",
    server: "", protocolType: "", zone: "", subzone: "", box: "",
    connectionType: "", cableRequirement: "", fiberCode: "", numberOfCore: "",
    coreColor: "", device: "", deviceMacSerial: "", vendorId: 0, purchaseDate: "",
    customerId: "", packageId: 0, profile: "", customerType: "home",
    billingStatus: "Inactive", usernameIp: "", password: "", joiningDate: "",
    monthlyBill: "", billingStartMonth: new Date().toLocaleDateString("en-US", { month: "2-digit", year: "numeric" }),
    expireDate: "", referenceBy: "", isVipClient: false, connectedBy: "", assignTo: "",
    affiliator: "", sendSmsToEmployee: false, sendGreetingSms: false,
    cnicFront: "", cnicBack: "", addressProof: "",
    notifyEmail: false, notifyMobile: false, notifyWhatsApp: false, notifyInApp: true,
    activateWithExpiry: false,
  });

  const update = (field: string, value: string | number | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === "presentAddress" && sameAddress) {
        updated.permanentAddress = value as string;
      }
      return updated;
    });
  };

  const handleSameAddress = (checked: boolean) => {
    setSameAddress(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, permanentAddress: prev.presentAddress }));
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        ...formData,
        customerId: formData.customerId || `CUST-${Date.now().toString(36).toUpperCase()}`,
        packageId: formData.packageId || null,
        vendorId: formData.vendorId || null,
        monthlyBill: formData.monthlyBill || null,
        status: formData.billingStatus === "Active" ? "active" : "inactive",
        isRecurring: true,
        recurringDay: 1,
        address: formData.presentAddress,
        area: formData.zone,
      };
      const res = await apiRequest("POST", "/api/customers", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Customer Created", description: "New customer has been created successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setTab("list");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to create customer", variant: "destructive" });
    },
  });

  const selectedPackage = (packages || []).find(p => p.id === formData.packageId);

  const canNext = () => {
    if (step === 1) return formData.fullName.trim().length >= 2 && formData.phone.trim().length >= 10;
    return true;
  };

  return (
    <div className="mt-4 space-y-0">
      <WizardStepBar currentStep={step} onStepClick={setStep} />

      {/* Step progress text */}
      <p className="text-xs text-muted-foreground mb-4">Step {step} of {WIZARD_STEPS.length} — {WIZARD_STEPS[step - 1].label}</p>

      <div>
        <SectionHeader
          icon={<User className="h-4 w-4" />}
          title={WIZARD_STEPS[step - 1].label}
          subtitle="Fill in all required (*) fields before continuing"
        />
        <div className="border border-t-0 rounded-b-lg p-5 bg-card min-h-[340px]">

          {/* ─── STEP 1: Basic Info ─── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr] gap-5">
                <div className="space-y-1 flex flex-col items-start">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Profile Picture</label>
                  <ProfilePictureUpload value={formData.profilePicture} onChange={v => update("profilePicture", v)} testId="upload-add-profile" />
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer Name <span className="text-red-500">*</span></label>
                    <Input placeholder="Full legal name" value={formData.fullName} onChange={e => update("fullName", e.target.value)} data-testid="input-add-name" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Occupation</label>
                    <Input placeholder="e.g. Engineer, Businessman" value={formData.occupation} onChange={e => update("occupation", e.target.value)} data-testid="input-add-occupation" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Remarks / Special Note</label>
                  <Textarea className="h-[88px] resize-none" placeholder="Any special note..." value={formData.remarks} onChange={e => update("remarks", e.target.value)} data-testid="input-add-remarks" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mobile Number <span className="text-red-500">*</span></label>
                  <Input placeholder="+92 300 0000000" value={formData.phone} onChange={e => update("phone", e.target.value)} data-testid="input-add-mobile" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email Address</label>
                  <Input type="email" placeholder="customer@email.com" value={formData.email} onChange={e => update("email", e.target.value)} data-testid="input-add-email" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CNIC / NID Number</label>
                  <Input placeholder="e.g. 35202-1234567-1" value={formData.nidNumber} onChange={e => update("nidNumber", e.target.value)} data-testid="input-add-nid" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer Type <span className="text-red-500">*</span></label>
                  <Select value={formData.customerType} onValueChange={v => update("customerType", v)}>
                    <SelectTrigger data-testid="select-add-client-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="reseller">Reseller</SelectItem>
                      <SelectItem value="hostel">Hostel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Father Name</label>
                  <Input placeholder="Father's full name" value={formData.fatherName} onChange={e => update("fatherName", e.target.value)} data-testid="input-add-father" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mother Name</label>
                  <Input placeholder="Mother's full name" value={formData.motherName} onChange={e => update("motherName", e.target.value)} data-testid="input-add-mother" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gender</label>
                  <Select value={formData.gender} onValueChange={v => update("gender", v)}>
                    <SelectTrigger data-testid="select-add-gender"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date of Birth</label>
                  <Input type="date" value={formData.dateOfBirth} onChange={e => update("dateOfBirth", e.target.value)} data-testid="input-add-dob" />
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Connection Info ─── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select Vendor</label>
                  <Select value={formData.vendorId ? String(formData.vendorId) : ""} onValueChange={v => update("vendorId", Number(v))}>
                    <SelectTrigger data-testid="select-add-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                    <SelectContent>
                      {(vendors || []).map(v => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select Package <span className="text-red-500">*</span></label>
                  <Select value={formData.packageId ? String(formData.packageId) : ""} onValueChange={v => {
                    const pid = Number(v);
                    update("packageId", pid);
                    const pkg = (packages || []).find(p => p.id === pid);
                    if (pkg) update("monthlyBill", String(pkg.price));
                  }}>
                    <SelectTrigger data-testid="select-add-package"><SelectValue placeholder="Select service package" /></SelectTrigger>
                    <SelectContent>
                      {(packages || []).filter(p => p.isActive).map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name} — Rs.{p.price}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monthly Internet Bill <span className="text-red-500">*</span></label>
                  <Input type="number" placeholder="Auto-filled from package or enter manually" value={formData.monthlyBill} onChange={e => update("monthlyBill", e.target.value)} data-testid="input-add-monthly-bill" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Username / IP <span className="text-red-500">*</span></label>
                  <Input placeholder="PPPoE username or IP address" value={formData.usernameIp} onChange={e => update("usernameIp", e.target.value)} data-testid="input-add-username-ip" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Password <span className="text-red-500">*</span></label>
                  <Input type="password" placeholder="Connection password" value={formData.password} onChange={e => update("password", e.target.value)} data-testid="input-add-password" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Profile</label>
                  <Select value={formData.profile} onValueChange={v => update("profile", v)}>
                    <SelectTrigger data-testid="select-add-profile-type"><SelectValue placeholder="Select profile" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Default">Default</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Basic">Basic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Client Code</label>
                  <Input placeholder="Auto-generated if blank" value={formData.customerId} onChange={e => update("customerId", e.target.value)} data-testid="input-add-client-code" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Billing Status <span className="text-red-500">*</span></label>
                  <Select value={formData.billingStatus} onValueChange={v => update("billingStatus", v)}>
                    <SelectTrigger data-testid="select-add-billing-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Joining Date</label>
                  <Input type="date" value={formData.joiningDate} onChange={e => update("joiningDate", e.target.value)} data-testid="input-add-joining-date" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expire Date</label>
                  <Select value={formData.expireDate} onValueChange={v => update("expireDate", v)}>
                    <SelectTrigger data-testid="select-add-expire"><SelectValue placeholder="Select duration" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1_month">1 Month</SelectItem>
                      <SelectItem value="3_months">3 Months</SelectItem>
                      <SelectItem value="6_months">6 Months</SelectItem>
                      <SelectItem value="1_year">1 Year</SelectItem>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Billing Start Month</label>
                  <Input value={formData.billingStartMonth} onChange={e => update("billingStartMonth", e.target.value)} className="bg-[#1a3a5c]/10 font-medium" data-testid="input-add-billing-start" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone Number (Alternate)</label>
                  <Input placeholder="Alternate contact number" value={formData.phoneNumber} onChange={e => update("phoneNumber", e.target.value)} data-testid="input-add-phone" />
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Documents ─── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CNIC / NID Front</label>
                  <DocUploadField value={formData.cnicFront} onChange={v => update("cnicFront", v)} testId="upload-add-cnic-front" />
                  <p className="text-xs text-muted-foreground text-center">Upload front side</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CNIC / NID Back</label>
                  <DocUploadField value={formData.cnicBack} onChange={v => update("cnicBack", v)} testId="upload-add-cnic-back" />
                  <p className="text-xs text-muted-foreground text-center">Upload back side</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">NID / Birth Certificate Pic</label>
                  <DocUploadField value={formData.nidPicture} onChange={v => update("nidPicture", v)} testId="upload-add-nid-pic" />
                  <p className="text-xs text-muted-foreground text-center">Certificate scan</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address Proof</label>
                  <DocUploadField value={formData.addressProof} onChange={v => update("addressProof", v)} testId="upload-add-address-proof" />
                  <p className="text-xs text-muted-foreground text-center">Utility bill / letter</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registration Form No</label>
                  <Input placeholder="e.g. REG-20240001" value={formData.registrationFormNo} onChange={e => update("registrationFormNo", e.target.value)} data-testid="input-add-regform-no" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registration Form Picture</label>
                  <DocUploadField value={formData.registrationFormPicture} onChange={v => update("registrationFormPicture", v)} testId="upload-add-regform-pic" />
                </div>
                <div className="flex items-end pb-1">
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300 w-full">
                    <p className="font-semibold mb-1">Accepted formats:</p>
                    <p>JPG, PNG, PDF — max 5 MB each</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Area Info ─── */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Zone / Area <span className="text-red-500">*</span></label>
                  <Select value={formData.zone} onValueChange={v => update("zone", v)}>
                    <SelectTrigger data-testid="select-add-zone"><SelectValue placeholder="Select area" /></SelectTrigger>
                    <SelectContent>
                      {(areas || []).map((a: any) => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
                      {(!areas || areas.length === 0) && <SelectItem value="Zone-1">Zone-1</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sub Zone</label>
                  <Select value={formData.subzone} onValueChange={v => update("subzone", v)}>
                    <SelectTrigger data-testid="select-add-subzone"><SelectValue placeholder="Select sub-zone" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Subzone-1">Subzone-1</SelectItem>
                      <SelectItem value="Subzone-2">Subzone-2</SelectItem>
                      <SelectItem value="Subzone-3">Subzone-3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Box</label>
                  <Select value={formData.box} onValueChange={v => update("box", v)}>
                    <SelectTrigger data-testid="select-add-box"><SelectValue placeholder="Select box" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Box-1">Box-1</SelectItem>
                      <SelectItem value="Box-2">Box-2</SelectItem>
                      <SelectItem value="Box-3">Box-3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">District</label>
                  <Select value={formData.district} onValueChange={v => update("district", v)}>
                    <SelectTrigger data-testid="select-add-district"><SelectValue placeholder="Select district" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dhaka">Dhaka</SelectItem>
                      <SelectItem value="Chittagong">Chittagong</SelectItem>
                      <SelectItem value="Rajshahi">Rajshahi</SelectItem>
                      <SelectItem value="Khulna">Khulna</SelectItem>
                      <SelectItem value="Sylhet">Sylhet</SelectItem>
                      <SelectItem value="Barisal">Barisal</SelectItem>
                      <SelectItem value="Rangpur">Rangpur</SelectItem>
                      <SelectItem value="Mymensingh">Mymensingh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Upazila / Thana</label>
                  <Input placeholder="e.g. Rupganj" value={formData.upazilaThana} onChange={e => update("upazilaThana", e.target.value)} data-testid="input-add-upazila" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Road Number</label>
                  <Input placeholder="e.g. Road 12" value={formData.roadNumber} onChange={e => update("roadNumber", e.target.value)} data-testid="input-add-road" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">House Number</label>
                  <Input placeholder="e.g. House 5A" value={formData.houseNumber} onChange={e => update("houseNumber", e.target.value)} data-testid="input-add-house" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Map Latitude</label>
                  <Input placeholder="e.g. 23.8103" value={formData.mapLatitude} onChange={e => update("mapLatitude", e.target.value)} data-testid="input-add-lat" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Present Address</label>
                  <Textarea className="resize-none h-20" placeholder="Full installation address" value={formData.presentAddress} onChange={e => update("presentAddress", e.target.value)} data-testid="input-add-present-address" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permanent Address</label>
                  <Textarea className="resize-none h-20" placeholder="Permanent address" value={formData.permanentAddress} onChange={e => update("permanentAddress", e.target.value)} data-testid="input-add-permanent-address" disabled={sameAddress} />
                  <label className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 cursor-pointer">
                    <input type="checkbox" checked={sameAddress} onChange={e => handleSameAddress(e.target.checked)} data-testid="checkbox-same-address" />
                    Same as Present Address
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Map Longitude</label>
                  <Input placeholder="e.g. 90.4125" value={formData.mapLongitude} onChange={e => update("mapLongitude", e.target.value)} data-testid="input-add-lng" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Facebook URL</label>
                  <Input placeholder="https://facebook.com/..." value={formData.facebookUrl} onChange={e => update("facebookUrl", e.target.value)} data-testid="input-add-facebook" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">LinkedIn URL</label>
                  <Input placeholder="https://linkedin.com/in/..." value={formData.linkedinUrl} onChange={e => update("linkedinUrl", e.target.value)} data-testid="input-add-linkedin" />
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 5: Infrastructure ─── */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Server</label>
                  <Select value={formData.server} onValueChange={v => update("server", v)}>
                    <SelectTrigger data-testid="select-add-server"><SelectValue placeholder="Select server" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Server-1">Server-1</SelectItem>
                      <SelectItem value="Server-2">Server-2</SelectItem>
                      <SelectItem value="Server-3">Server-3</SelectItem>
                      <SelectItem value="MikroTik">MikroTik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Protocol Type</label>
                  <Select value={formData.protocolType} onValueChange={v => update("protocolType", v)}>
                    <SelectTrigger data-testid="select-add-protocol"><SelectValue placeholder="Select protocol" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PPPoE">PPPoE</SelectItem>
                      <SelectItem value="Static">Static</SelectItem>
                      <SelectItem value="DHCP">DHCP</SelectItem>
                      <SelectItem value="Hotspot">Hotspot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Connection Type <span className="text-red-500">*</span></label>
                  <Select value={formData.connectionType} onValueChange={v => update("connectionType", v)}>
                    <SelectTrigger data-testid="select-add-conn-type"><SelectValue placeholder="Select connection" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fiber">Fiber / FTTH</SelectItem>
                      <SelectItem value="Wireless">Wireless</SelectItem>
                      <SelectItem value="DSL">DSL / VDSL</SelectItem>
                      <SelectItem value="Cable">Cable</SelectItem>
                      <SelectItem value="Ethernet">Ethernet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cable Req. (Metres)</label>
                  <Input placeholder="e.g. 100" value={formData.cableRequirement} onChange={e => update("cableRequirement", e.target.value)} data-testid="input-add-cable" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fiber Code</label>
                  <Input placeholder="e.g. FC-121" value={formData.fiberCode} onChange={e => update("fiberCode", e.target.value)} data-testid="input-add-fiber" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Number of Cores</label>
                  <Input placeholder="e.g. 2" value={formData.numberOfCore} onChange={e => update("numberOfCore", e.target.value)} data-testid="input-add-core" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Core Color</label>
                  <Input placeholder="e.g. Red, Blue" value={formData.coreColor} onChange={e => update("coreColor", e.target.value)} data-testid="input-add-core-color" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Device</label>
                  <Select value={formData.device} onValueChange={v => update("device", v)}>
                    <SelectTrigger data-testid="select-add-device"><SelectValue placeholder="Select device" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONU">ONU</SelectItem>
                      <SelectItem value="ONT">ONT</SelectItem>
                      <SelectItem value="Router">Router</SelectItem>
                      <SelectItem value="Switch">Switch</SelectItem>
                      <SelectItem value="Media Converter">Media Converter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Device MAC / Serial</label>
                  <Input placeholder="e.g. AA:BB:CC:DD:EE:FF" value={formData.deviceMacSerial} onChange={e => update("deviceMacSerial", e.target.value)} data-testid="input-add-device-mac" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Purchase Date</label>
                  <Input type="date" value={formData.purchaseDate} onChange={e => update("purchaseDate", e.target.value)} data-testid="input-add-purchase-date" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Twitter / X URL</label>
                  <Input placeholder="https://twitter.com/..." value={formData.twitterUrl} onChange={e => update("twitterUrl", e.target.value)} data-testid="input-add-twitter" />
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 6: Notifications & Finalize ─── */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Notification Channels</h3>
                  {[
                    { key: "notifyEmail", label: "Email Notifications", desc: "Send updates via email" },
                    { key: "notifyMobile", label: "Mobile SMS Notifications", desc: "Send alerts via SMS" },
                    { key: "notifyWhatsApp", label: "WhatsApp Notifications", desc: "Send via WhatsApp" },
                    { key: "notifyInApp", label: "In-App Notifications", desc: "Show in platform notifications" },
                    { key: "sendSmsToEmployee", label: "Send SMS to Employee", desc: "Notify assigned employee" },
                    { key: "sendGreetingSms", label: "Send Greeting SMS", desc: "Send welcome/greeting message" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Switch
                        checked={formData[key as keyof typeof formData] as boolean}
                        onCheckedChange={v => update(key, v)}
                        data-testid={`switch-${key}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">Assignment & References</h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reference By</label>
                      <Input placeholder="Referred by whom?" value={formData.referenceBy} onChange={e => update("referenceBy", e.target.value)} data-testid="input-add-reference" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Connected By</label>
                      <Select value={formData.connectedBy} onValueChange={v => update("connectedBy", v)}>
                        <SelectTrigger data-testid="select-add-connected-by"><SelectValue placeholder="Select employee" /></SelectTrigger>
                        <SelectContent>
                          {(employees || []).map((emp: any) => <SelectItem key={emp.id} value={emp.fullName}>{emp.fullName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assign To</label>
                      <Select value={formData.assignTo} onValueChange={v => update("assignTo", v)}>
                        <SelectTrigger data-testid="select-add-assign-to"><SelectValue placeholder="Select employee" /></SelectTrigger>
                        <SelectContent>
                          {(employees || []).map((emp: any) => <SelectItem key={emp.id} value={emp.fullName}>{emp.fullName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Affiliator</label>
                      <Select value={formData.affiliator} onValueChange={v => update("affiliator", v)}>
                        <SelectTrigger data-testid="select-add-affiliator"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="None">None</SelectItem>
                          <SelectItem value="Affiliate-1">Affiliate-1</SelectItem>
                          <SelectItem value="Affiliate-2">Affiliate-2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950">
                      <input type="checkbox" id="vip-check" checked={formData.isVipClient} onChange={e => update("isVipClient", e.target.checked)} data-testid="checkbox-add-vip" className="h-4 w-4" />
                      <label htmlFor="vip-check" className="text-sm font-semibold text-amber-600 dark:text-amber-400 cursor-pointer">Mark as VIP Client</label>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
                      <Switch checked={formData.activateWithExpiry} onCheckedChange={v => update("activateWithExpiry", v)} data-testid="switch-activate-expiry" />
                      <label className="text-sm font-medium text-green-700 dark:text-green-300">Activate Account with Expiry</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6 pb-6">
        <Button
          variant="outline"
          onClick={() => step > 1 ? setStep(step - 1) : setTab("list")}
          className="flex items-center gap-2"
          data-testid="button-prev-cancel"
        >
          {step === 1 ? "Cancel" : <><ChevronLeft className="h-4 w-4" /> Previous</>}
        </Button>
        <div className="flex items-center gap-3">
          {step < 6 ? (
            <Button
              onClick={() => { if (canNext()) setStep(step + 1); }}
              disabled={!canNext()}
              className="bg-[#1a3a5c] text-white flex items-center gap-2"
              data-testid="button-next-step"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => { createMutation.mutate(); }}
                disabled={createMutation.isPending || !formData.fullName || !formData.phone}
                data-testid="button-save-add-new"
              >
                {createMutation.isPending ? "Saving..." : "Save & Add New"}
              </Button>
              <Button
                onClick={() => { createMutation.mutate(); }}
                disabled={createMutation.isPending || !formData.fullName || !formData.phone}
                className="bg-[#1a3a5c] text-white"
                data-testid="button-save-exit"
              >
                {createMutation.isPending ? "Saving..." : "Save & Exit"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerListView({
  customers,
  packages,
  vendors,
  employees,
  areas,
  isLoading,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  openEdit,
  deleteMutation,
  updateMutation,
  generateRecurringMutation,
  setTab,
}: {
  customers: Customer[] | undefined;
  packages: Package[] | undefined;
  vendors: any[] | undefined;
  employees: any[] | undefined;
  areas: any[] | undefined;
  isLoading: boolean;
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  openEdit: (c: Customer) => void;
  deleteMutation: any;
  updateMutation: any;
  generateRecurringMutation: any;
  setTab: (v: string) => void;
}) {
  const { toast } = useToast();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [showFilters, setShowFilters] = useState(true);
  const [entriesCount, setEntriesCount] = useState(100);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const togglePasswordVisibility = (id: number) => setVisiblePasswords(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const [filterVendor, setFilterVendor] = useState("all");
  const [filterProtocol, setFilterProtocol] = useState("all");
  const [filterProfile, setFilterProfile] = useState("all");
  const [filterZone, setFilterZone] = useState("all");
  const [filterSubzone, setFilterSubzone] = useState("all");
  const [filterBox, setFilterBox] = useState("all");
  const [filterPackage, setFilterPackage] = useState("all");
  const [filterClientType, setFilterClientType] = useState("all");
  const [filterConnType, setFilterConnType] = useState("all");
  const [filterBillingStatus, setFilterBillingStatus] = useState("all");
  const [filterAssignTo, setFilterAssignTo] = useState("all");
  const [filterCustomStatus, setFilterCustomStatus] = useState("");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");

  const allCustomers = customers || [];

  const runningClients = allCustomers.filter(c => c.status === "active").length;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const newClients = allCustomers.filter(c => c.joiningDate && c.joiningDate >= monthStart.slice(0, 10)).length;
  const renewedClients = allCustomers.filter(c => c.billingStatus === "Active" && c.lastBilledDate).length;
  const otherClients = allCustomers.filter(c => c.status !== "active" && c.status !== "closed" && c.status !== "terminated").length;
  const closedClients = allCustomers.filter(c => c.status === "closed" || c.status === "terminated").length;

  const filtered = allCustomers.filter((c) => {
    if (search) {
      const s = search.toLowerCase();
      const matchSearch = c.fullName.toLowerCase().includes(s) ||
        c.customerId.toLowerCase().includes(s) ||
        c.phone.includes(s) ||
        (c.usernameIp || "").toLowerCase().includes(s) ||
        (c.deviceMacSerial || "").toLowerCase().includes(s);
      if (!matchSearch) return false;
    }
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (filterVendor !== "all" && String(c.vendorId) !== filterVendor) return false;
    if (filterProtocol !== "all" && c.protocolType !== filterProtocol) return false;
    if (filterProfile !== "all" && c.profile !== filterProfile) return false;
    if (filterZone !== "all" && c.zone !== filterZone) return false;
    if (filterSubzone !== "all" && c.subzone !== filterSubzone) return false;
    if (filterBox !== "all" && c.box !== filterBox) return false;
    if (filterPackage !== "all" && String(c.packageId) !== filterPackage) return false;
    if (filterClientType !== "all" && c.customerType !== filterClientType) return false;
    if (filterConnType !== "all" && c.connectionType !== filterConnType) return false;
    if (filterBillingStatus !== "all" && c.billingStatus !== filterBillingStatus) return false;
    if (filterAssignTo !== "all" && c.assignTo !== filterAssignTo) return false;
    if (filterFromDate && c.joiningDate && c.joiningDate < filterFromDate) return false;
    if (filterToDate && c.joiningDate && c.joiningDate > filterToDate) return false;
    return true;
  });

  const displayed = filtered.slice(0, entriesCount);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    if (selectedIds.length === displayed.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayed.map(c => c.id));
    }
  };

  const getPackageInfo = (pkgId: number | null | undefined) => {
    if (!pkgId || !packages) return null;
    return packages.find((p) => p.id === pkgId);
  };

  const getVendorName = (vendorId: number | null | undefined) => {
    if (!vendorId || !vendors) return "-";
    const v = vendors.find(x => x.id === vendorId);
    return v ? v.name : "-";
  };

  const uniqueZones = Array.from(new Set(allCustomers.map(c => c.zone).filter(Boolean)));
  const uniqueSubzones = Array.from(new Set(allCustomers.map(c => c.subzone).filter(Boolean)));
  const uniqueProtocols = Array.from(new Set(allCustomers.map(c => c.protocolType).filter(Boolean)));
  const uniqueProfiles = Array.from(new Set(allCustomers.map(c => c.profile).filter(Boolean)));
  const uniqueConnTypes = Array.from(new Set(allCustomers.map(c => c.connectionType).filter(Boolean)));
  const uniqueBoxes = Array.from(new Set(allCustomers.map(c => c.box).filter(Boolean)));
  const uniqueAssignees = Array.from(new Set(allCustomers.map(c => c.assignTo).filter(Boolean)));

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: number; newStatus: string }) => {
      const res = await apiRequest("PATCH", `/api/customers/${id}`, { status: newStatus });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Status updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [smsCustomer, setSmsCustomer] = useState<Customer | null>(null);
  const [smsChannel, setSmsChannel] = useState("sms");
  const [smsCategory, setSmsCategory] = useState("bill_reminder");
  const [smsMessage, setSmsMessage] = useState("");
  const [smsSubject, setSmsSubject] = useState("");

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusCustomer, setStatusCustomer] = useState<Customer | null>(null);
  const [statusAction, setStatusAction] = useState("closed");
  const [statusReasonSelect, setStatusReasonSelect] = useState("");
  const [statusReason, setStatusReason] = useState("");

  const statusReasonOptions: Record<string, { value: string; label: string }[]> = {
    active: [
      { value: "active", label: "Active" },
      { value: "reactive", label: "Reactive" },
    ],
    closed: [
      { value: "house_shift", label: "House Shift" },
      { value: "temporary_closed", label: "Temporary Closed" },
      { value: "shift_to_other_isp", label: "Shift to Other ISP" },
    ],
    suspended: [
      { value: "bill_issue", label: "Bill Issue" },
      { value: "temporary_suspend", label: "Temporary Suspend" },
    ],
    expired: [
      { value: "recharge_next_month", label: "Recharge on Next Month" },
      { value: "other", label: "Other" },
    ],
  };

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

  const openSmsDialog = (customer: Customer) => {
    setSmsCustomer(customer);
    setSmsChannel("sms");
    setSmsCategory("bill_reminder");
    const cat = smsCategories.find(c => c.value === "bill_reminder");
    setSmsMessage(cat?.defaultMsg.replace("{name}", customer.fullName) || "");
    setSmsSubject("");
    setSmsDialogOpen(true);
  };

  const handleCategoryChange = (value: string) => {
    setSmsCategory(value);
    const cat = smsCategories.find(c => c.value === value);
    if (cat && smsCustomer) {
      setSmsMessage(cat.defaultMsg.replace("{name}", smsCustomer.fullName));
      if (value === "invoice_softcopy") setSmsSubject("Invoice Copy");
      else if (value === "bill_reminder") setSmsSubject("Bill Reminder");
      else if (value === "account_suspend") setSmsSubject("Account Suspension Notice");
      else if (value === "payment_confirmation") setSmsSubject("Payment Confirmation");
      else setSmsSubject("");
    }
  };

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: { channel: string; customer: Customer; subject: string; message: string; category: string }) => {
      if (data.channel === "email") {
        if (!data.customer.email) throw new Error("Customer has no email address");
        const res = await apiRequest("POST", "/api/notifications/send-email", {
          to: data.customer.email, subject: data.subject, body: data.message,
        });
        return res.json();
      } else if (data.channel === "sms") {
        if (!data.customer.phone) throw new Error("Customer has no phone number");
        const res = await apiRequest("POST", "/api/notifications/send-sms", {
          to: data.customer.phone, message: data.message,
        });
        return res.json();
      } else if (data.channel === "whatsapp") {
        if (!data.customer.phone && !data.customer.phoneNumber) throw new Error("Customer has no phone/mobile number");
        const res = await apiRequest("POST", "/api/notifications/send-sms", {
          to: data.customer.phoneNumber || data.customer.phone, message: data.message,
        });
        return res.json();
      } else if (data.channel === "in_app") {
        const res = await apiRequest("POST", "/api/notification-dispatches", {
          channel: "in_app", recipient: data.customer.email || data.customer.customerId,
          subject: data.subject, body: data.message, status: "sent",
          createdAt: new Date().toISOString(),
        });
        return res.json();
      }
    },
    onSuccess: (_, vars) => {
      toast({ title: "Sent Successfully", description: `${vars.channel === "email" ? "Email" : vars.channel === "sms" ? "SMS" : vars.channel === "whatsapp" ? "WhatsApp" : "In-App Notification"} sent to ${vars.customer.fullName}` });
      setSmsDialogOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Failed to Send", description: err.message, variant: "destructive" });
    },
  });

  const openStatusDialog = (customer: Customer) => {
    setStatusCustomer(customer);
    const action = customer.status === "active" ? "closed" : "active";
    setStatusAction(action);
    setStatusReasonSelect("");
    setStatusReason("");
    setStatusDialogOpen(true);
  };

  const statusToggleMutation = useMutation({
    mutationFn: async (data: { customer: Customer; newStatus: string; reason: string }) => {
      const res = await apiRequest("PATCH", `/api/customers/${data.customer.id}`, { status: data.newStatus });
      const result = await res.json();
      await apiRequest("POST", "/api/audit-logs", {
        action: data.newStatus === "active" ? "enable" : "disable",
        module: "customers",
        entityType: "customer",
        entityId: data.customer.id,
        oldValues: JSON.stringify({ status: data.customer.status }),
        newValues: JSON.stringify({ status: data.newStatus }),
        description: `Customer ${data.customer.fullName} (${data.customer.customerId}) status changed from "${data.customer.status}" to "${data.newStatus}". Reason: ${data.reason || "N/A"}`,
        createdAt: new Date().toISOString(),
      });
      return result;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Status Updated", description: `${vars.customer.fullName} is now ${vars.newStatus}` });
      setStatusDialogOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="mt-5 space-y-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-2 bg-card border rounded-lg p-3" data-testid="customer-list-toolbar">
        <Button size="sm" variant="outline" className="text-xs gap-1.5" data-testid="button-assign-employee"
          onClick={() => { if (selectedIds.length === 0) { toast({ title: "Select customers first", description: "Please select customers to assign", variant: "destructive" }); } }}>
          <UserPlus className="h-3.5 w-3.5" /> Assign To Employee
        </Button>
        <Button size="sm" variant="outline" className="text-xs gap-1.5" data-testid="button-generate-excel">
          <FileSpreadsheet className="h-3.5 w-3.5" /> Generate Excel
        </Button>
        <Button size="sm" variant="outline" className="text-xs gap-1.5" data-testid="button-generate-pdf">
          <FileDown className="h-3.5 w-3.5" /> Generate Pdf
        </Button>
        <Button size="sm" variant="outline" className="text-xs gap-1.5" data-testid="button-bulk-profile">
          <Settings2 className="h-3.5 w-3.5" /> Bulk Profile Change
        </Button>
        <Button size="sm" variant="outline" className="text-xs gap-1.5" data-testid="button-bulk-package">
          <Settings2 className="h-3.5 w-3.5" /> Bulk Package Change
        </Button>
        <Button size="sm" variant="outline" className="text-xs gap-1.5" data-testid="button-bulk-status">
          <Settings2 className="h-3.5 w-3.5" /> Bulk Status Change
        </Button>
        <Button size="sm" className="text-xs gap-1.5 bg-[#1a3a5c] ml-auto" data-testid="button-sync-clients"
          onClick={() => generateRecurringMutation.mutate()} disabled={generateRecurringMutation.isPending}>
          <RefreshCw className="h-3.5 w-3.5" /> Sync Clients & Servers
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" data-testid="customer-stats-cards">
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-blue-500 to-blue-700 relative overflow-hidden shadow-md" data-testid="card-running-customers">
          <div className="absolute right-3 top-3 opacity-20"><Wifi className="h-12 w-12" /></div>
          <p className="text-3xl font-bold" data-testid="stat-running-clients">{runningClients}</p>
          <p className="font-semibold text-sm mt-1">Running Customers</p>
          <p className="text-xs opacity-80 mt-0.5">Number of clients without LeftOut status</p>
        </div>
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-emerald-400 to-teal-600 relative overflow-hidden shadow-md" data-testid="card-new-customers">
          <div className="absolute right-3 top-3 opacity-20"><UserPlus className="h-12 w-12" /></div>
          <p className="text-3xl font-bold" data-testid="stat-new-clients">{newClients}</p>
          <p className="font-semibold text-sm mt-1">New Customers</p>
          <p className="text-xs opacity-80 mt-0.5">Monthly number of clients those are new</p>
        </div>
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-orange-400 to-orange-600 relative overflow-hidden shadow-md" data-testid="card-renewed-customers">
          <div className="absolute right-3 top-3 opacity-20"><RefreshCw className="h-12 w-12" /></div>
          <p className="text-3xl font-bold" data-testid="stat-renewed-clients">{renewedClients}</p>
          <p className="font-semibold text-sm mt-1">Renewed Customers</p>
          <p className="text-xs opacity-80 mt-0.5">Monthly number of newly renewed clients</p>
        </div>
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-slate-500 to-slate-700 relative overflow-hidden shadow-md" data-testid="card-bill-paid">
          <div className="absolute right-3 top-3 opacity-20"><CreditCard className="h-12 w-12" /></div>
          <p className="text-3xl font-bold" data-testid="stat-other-clients">{otherClients}</p>
          <p className="font-semibold text-sm mt-1">Bill Paid</p>
          <p className="text-xs opacity-80 mt-0.5">Customers with cleared invoices</p>
        </div>
        <div className="rounded-xl p-4 text-white bg-gradient-to-br from-red-500 to-red-700 relative overflow-hidden shadow-md" data-testid="card-pending-bill">
          <div className="absolute right-3 top-3 opacity-20"><Clock className="h-12 w-12" /></div>
          <p className="text-3xl font-bold" data-testid="stat-closed-clients">{closedClients}</p>
          <p className="font-semibold text-sm mt-1">Pending Bill</p>
          <p className="text-xs opacity-80 mt-0.5">Customers with outstanding dues</p>
        </div>
      </div>

      {showFilters && (
        <Card data-testid="customer-filters-panel">
          <CardContent className="pt-4 pb-2 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Connection Service Vendor</label>
                <Select value={filterVendor} onValueChange={setFilterVendor}>
                  <SelectTrigger className="h-8 text-xs" data-testid="filter-vendor"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select</SelectItem>
                    {(vendors || []).map(v => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Protocol Type</label>
                <Select value={filterProtocol} onValueChange={setFilterProtocol}>
                  <SelectTrigger className="h-8 text-xs" data-testid="filter-protocol"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select</SelectItem>
                    {uniqueProtocols.map(p => <SelectItem key={p!} value={p!}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Profile</label>
                <Select value={filterProfile} onValueChange={setFilterProfile}>
                  <SelectTrigger className="h-8 text-xs" data-testid="filter-profile"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select</SelectItem>
                    {uniqueProfiles.map(p => <SelectItem key={p!} value={p!}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Zone</label>
                <Select value={filterZone} onValueChange={setFilterZone}>
                  <SelectTrigger className="h-8 text-xs" data-testid="filter-zone"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select</SelectItem>
                    {uniqueZones.map(z => <SelectItem key={z!} value={z!}>{z}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Sub Zone</label>
                <Select value={filterSubzone} onValueChange={setFilterSubzone}>
                  <SelectTrigger className="h-8 text-xs" data-testid="filter-subzone"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select</SelectItem>
                    {uniqueSubzones.map(s => <SelectItem key={s!} value={s!}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Box</label>
                <Select value={filterBox} onValueChange={setFilterBox}>
                  <SelectTrigger className="h-8 text-xs" data-testid="filter-box"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select</SelectItem>
                    {uniqueBoxes.map(b => <SelectItem key={b!} value={b!}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Package</label>
                <Select value={filterPackage} onValueChange={setFilterPackage}>
                  <SelectTrigger className="h-8 text-xs" data-testid="filter-package"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select</SelectItem>
                    {(packages || []).map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Client Type</label>
                <Select value={filterClientType} onValueChange={setFilterClientType}>
                  <SelectTrigger className="h-8 text-xs" data-testid="filter-client-type"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="reseller">Reseller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Connection Type</label>
                <Select value={filterConnType} onValueChange={setFilterConnType}>
                  <SelectTrigger className="h-8 text-xs" data-testid="filter-conn-type"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select</SelectItem>
                    {uniqueConnTypes.map(ct => <SelectItem key={ct!} value={ct!}>{ct}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Billing Status</label>
                <Select value={filterBillingStatus} onValueChange={setFilterBillingStatus}>
                  <SelectTrigger className="h-8 text-xs" data-testid="filter-billing-status"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">M.Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs" data-testid="filter-m-status"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div></div>
              <div></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Assign.Cus.For</label>
                <Select value={filterAssignTo} onValueChange={setFilterAssignTo}>
                  <SelectTrigger className="h-8 text-xs" data-testid="filter-assign-to"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select</SelectItem>
                    {uniqueAssignees.map(a => <SelectItem key={a!} value={a!}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Custom Status</label>
                <Input className="h-8 text-xs" placeholder="select custom status" value={filterCustomStatus} onChange={e => setFilterCustomStatus(e.target.value)} data-testid="filter-custom-status" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">From Date</label>
                <Input type="date" className="h-8 text-xs" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} data-testid="filter-from-date" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">To Date</label>
                <Input type="date" className="h-8 text-xs" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} data-testid="filter-to-date" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1 bg-[#1a3a5c] text-white"
          onClick={() => setShowFilters(!showFilters)}
          data-testid="button-toggle-filters"
        >
          {showFilters ? "Hide" : "Show"} {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs text-muted-foreground">SHOW</span>
            <Select value={String(entriesCount)} onValueChange={v => setEntriesCount(Number(v))}>
              <SelectTrigger className="w-[70px] h-8 text-xs" data-testid="select-list-entries"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">ENTRIES</span>
          </div>
          <Link href="/customers/add">
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs shadow-md"
              data-testid="button-add-new-customer-full"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add New Customer
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">SEARCH:</span>
          <Input
            placeholder=""
            className="w-[180px] h-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-customers"
          />
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2.5">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selectedIds.length} customer{selectedIds.length > 1 ? "s" : ""} selected</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900" onClick={() => setSelectedIds([])} data-testid="button-clear-selection">Clear Selection</Button>
        </div>
      )}

      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#1a3a5c] dark:bg-[#1a3a5c]">
              <TableHead className="w-10 pl-4">
                <Checkbox
                  checked={selectedIds.length === displayed.length && displayed.length > 0}
                  onCheckedChange={toggleSelectAll}
                  data-testid="checkbox-select-all"
                  className="border-slate-400 data-[state=checked]:bg-white data-[state=checked]:text-slate-900 data-[state=checked]:border-white"
                />
              </TableHead>
              <TableHead className="text-white font-semibold text-[11px] whitespace-nowrap">Customer Code</TableHead>
              <TableHead className="text-white font-semibold text-[11px] whitespace-nowrap">ID/IP ↕</TableHead>
              <TableHead className="text-white font-semibold text-[11px] whitespace-nowrap">Password</TableHead>
              <TableHead className="text-white font-semibold text-[11px] whitespace-nowrap">Customer Name</TableHead>
              <TableHead className="text-white font-semibold text-[11px] whitespace-nowrap">Mobile</TableHead>
              <TableHead className="text-white font-semibold text-[11px] whitespace-nowrap">Zone ↕</TableHead>
              <TableHead className="text-white font-semibold text-[11px] whitespace-nowrap">Connection Type</TableHead>
              <TableHead className="text-white font-semibold text-[11px] whitespace-nowrap">Customer Type</TableHead>
              <TableHead className="text-white font-semibold text-[11px] whitespace-nowrap">Package/Speed</TableHead>
              <TableHead className="text-white font-semibold text-[11px] whitespace-nowrap">M.Bill</TableHead>
              <TableHead className="text-white font-semibold text-[11px] whitespace-nowrap">MAC Addr</TableHead>
              <TableHead className="text-white font-semibold text-[11px] whitespace-nowrap">Connection Service Vendor</TableHead>
              <TableHead className="text-white font-semibold text-[11px] whitespace-nowrap">B.Status</TableHead>
              <TableHead className="text-white font-semibold text-[11px] whitespace-nowrap">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center">
                    <Users className="h-12 w-12 mb-3 opacity-30" />
                    <p className="font-medium">No customers found</p>
                    <p className="text-sm mt-1">Add your first customer to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayed.map((customer) => {
              const pkg = getPackageInfo(customer.packageId);
              const maskedPassword = customer.password ? "••••" + (customer.password.length > 2 ? customer.password.slice(-1) : "") : "•••••";
              const vendorName = getVendorName(customer.vendorId);
              return (
                <TableRow key={customer.id} className={`text-xs ${selectedIds.includes(customer.id) ? "bg-blue-50 dark:bg-blue-950/40" : ""}`} data-testid={`row-customer-${customer.id}`}>
                  <TableCell className="pl-4 w-10" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(customer.id)}
                      onCheckedChange={() => toggleSelect(customer.id)}
                      data-testid={`checkbox-customer-${customer.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs font-medium" data-testid={`text-customer-code-${customer.id}`}>
                    <Link href={`/customers/${customer.id}`} className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                      {customer.customerId}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs" data-testid={`text-customer-ip-${customer.id}`}>
                    <Link href={`/customers/${customer.id}`} className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                      {customer.usernameIp || "-"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs" data-testid={`text-customer-password-${customer.id}`}>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-muted-foreground">
                        {visiblePasswords.has(customer.id) ? (customer.password || "-") : maskedPassword}
                      </span>
                      {customer.password && (
                        <button
                          onClick={() => togglePasswordVisibility(customer.id)}
                          className="text-muted-foreground hover:text-foreground"
                          data-testid={`button-toggle-password-${customer.id}`}
                        >
                          {visiblePasswords.has(customer.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell data-testid={`text-customer-name-${customer.id}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                        {customer.profilePicture ? (
                          <img src={customer.profilePicture} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-xs truncate">{customer.fullName}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {customer.isVipClient && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                          <Shield className="h-3 w-3 text-blue-500" />
                          {customer.email && <Mail className="h-3 w-3 text-green-500" />}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{customer.phone}</TableCell>
                  <TableCell className="text-xs">{customer.zone || "-"}</TableCell>
                  <TableCell className="text-xs capitalize">{customer.connectionType || "-"}</TableCell>
                  <TableCell className="text-xs capitalize">{customer.customerType}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {pkg ? `${pkg.name}/${pkg.speed || ""}` : "-"}
                  </TableCell>
                  <TableCell className="text-xs font-medium">{customer.monthlyBill || "-"}</TableCell>
                  <TableCell className="text-xs font-mono">{(customer as any).macAddress || "-"}</TableCell>
                  <TableCell className="text-xs">
                    {vendorName !== "-" ? (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{vendorName}</span>
                    ) : (
                      <span className="text-red-500 text-[10px]">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${customer.billingStatus === "Active" ? "bg-green-600 text-white" : "bg-gray-400 text-white"}`}>
                      {customer.billingStatus || "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-actions-${customer.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/customers/${customer.id}`} data-testid={`action-view-profile-${customer.id}`}>
                            <Eye className="h-4 w-4 mr-2" /> View Profile
                          </Link>
                        </DropdownMenuItem>
                        {canEdit("customers") && (
                          <DropdownMenuItem onClick={() => openEdit(customer)} data-testid={`action-edit-profile-${customer.id}`}>
                            <Edit className="h-4 w-4 mr-2" /> Edit Profile
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem data-testid={`action-send-sms-${customer.id}`}
                          onClick={() => openSmsDialog(customer)}>
                          <MessageCircle className="h-4 w-4 mr-2" /> Send SMS
                        </DropdownMenuItem>
                        <DropdownMenuItem data-testid={`action-service-scheduler-${customer.id}`}
                          onClick={() => toast({ title: "Service Scheduler", description: `Scheduler for ${customer.fullName}` })}>
                          <CalendarRange className="h-4 w-4 mr-2" /> Service Scheduler
                        </DropdownMenuItem>
                        {canEdit("customers") && (
                          <DropdownMenuItem data-testid={`action-status-toggle-${customer.id}`}
                            onClick={() => openStatusDialog(customer)}>
                            {customer.status === "active" ? <PowerOff className="h-4 w-4 mr-2" /> : <Power className="h-4 w-4 mr-2" />}
                            {customer.status === "active" ? "Close / Deactivate" : "Activate"}
                          </DropdownMenuItem>
                        )}
                        {canDelete("customers") && (
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(customer.id)} data-testid={`action-delete-${customer.id}`}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {Math.min(displayed.length, entriesCount)} of {filtered.length} entries</span>
        </div>
      )}

      <Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="dialog-send-notification">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-[#0057FF]" /> Send Notification
            </DialogTitle>
          </DialogHeader>
          {smsCustomer && (
            <div className="space-y-5">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0057FF] flex items-center justify-center text-white font-bold text-sm">
                    {smsCustomer.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{smsCustomer.fullName}</p>
                    <p className="text-xs text-muted-foreground">{smsCustomer.customerId} • {smsCustomer.phone || "No phone"} • {smsCustomer.email || "No email"}</p>
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
                      onClick={() => setSmsChannel(ch.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                        smsChannel === ch.value
                          ? `${ch.color} ring-2 ring-offset-1 ring-current font-semibold`
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                      data-testid={`btn-channel-${ch.value}`}
                    >
                      <ch.icon className="h-5 w-5" />
                      <span className="text-xs">{ch.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Message Category</span>
                <Select value={smsCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger data-testid="select-sms-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {smsCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(smsChannel === "email" || smsChannel === "in_app") && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Subject</span>
                  <Input
                    value={smsSubject}
                    onChange={e => setSmsSubject(e.target.value)}
                    placeholder="Enter subject..."
                    data-testid="input-sms-subject"
                  />
                </div>
              )}

              <div className="space-y-2">
                <span className="text-sm font-medium">Message</span>
                <Textarea
                  value={smsMessage}
                  onChange={e => setSmsMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="min-h-[120px]"
                  data-testid="textarea-sms-message"
                />
              </div>

              {smsChannel === "sms" && !smsCustomer.phone && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> Customer has no phone number
                </div>
              )}
              {smsChannel === "email" && !smsCustomer.email && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> Customer has no email address
                </div>
              )}
              {smsChannel === "whatsapp" && !smsCustomer.phone && !smsCustomer.phoneNumber && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> Customer has no phone or mobile number
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSmsDialogOpen(false)} data-testid="button-cancel-sms">Cancel</Button>
            <Button
              onClick={() => smsCustomer && sendNotificationMutation.mutate({
                channel: smsChannel, customer: smsCustomer, subject: smsSubject, message: smsMessage, category: smsCategory,
              })}
              disabled={
                sendNotificationMutation.isPending || !smsMessage.trim() ||
                (smsChannel === "email" && (!smsSubject.trim() || !smsCustomer?.email)) ||
                (smsChannel === "sms" && !smsCustomer?.phone) ||
                (smsChannel === "whatsapp" && !smsCustomer?.phone && !smsCustomer?.phoneNumber) ||
                (smsChannel === "in_app" && !smsSubject.trim())
              }
              className="bg-[#0057FF]"
              data-testid="button-send-notification"
            >
              {sendNotificationMutation.isPending ? "Sending..." : (
                <>
                  <Send className="h-4 w-4 mr-1.5" />
                  {smsChannel === "email" ? "Send Email" : smsChannel === "sms" ? "Send SMS" : smsChannel === "whatsapp" ? "Send WhatsApp" : "Send Notification"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-[500px]" data-testid="dialog-status-toggle">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {statusAction === "active" ? <Power className="h-5 w-5 text-green-600" /> : <PowerOff className="h-5 w-5 text-red-600" />}
              {statusAction === "active" ? "Activate Customer" : "Close / Deactivate Customer"}
            </DialogTitle>
          </DialogHeader>
          {statusCustomer && (
            <div className="space-y-5">
              <div className="bg-muted/50 rounded-lg p-3 border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0057FF] flex items-center justify-center text-white font-bold text-sm">
                    {statusCustomer.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{statusCustomer.fullName}</p>
                    <p className="text-xs text-muted-foreground">{statusCustomer.customerId}</p>
                  </div>
                  <Badge className={`ml-auto text-[10px] capitalize ${
                    statusCustomer.status === "active" ? "bg-green-600 text-white" : "bg-gray-400 text-white"
                  }`}>{statusCustomer.status}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Change Status To</span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "active", label: "Active", desc: "Enable customer services", icon: Power, color: "text-green-600 bg-green-50 border-green-300" },
                    { value: "closed", label: "Closed", desc: "Disable customer services", icon: PowerOff, color: "text-red-600 bg-red-50 border-red-300" },
                    { value: "suspended", label: "Suspended", desc: "Temporarily suspend services", icon: AlertTriangle, color: "text-amber-600 bg-amber-50 border-amber-300" },
                    { value: "expired", label: "Expired", desc: "Mark as expired", icon: Clock, color: "text-gray-600 bg-gray-50 border-gray-300" },
                  ].map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => { setStatusAction(s.value); setStatusReasonSelect(""); }}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all ${
                        statusAction === s.value
                          ? `${s.color} ring-2 ring-offset-1 ring-current font-semibold`
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                      data-testid={`btn-status-${s.value}`}
                    >
                      <s.icon className="h-5 w-5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{s.label}</p>
                        <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Reason</span>
                <Select value={statusReasonSelect} onValueChange={setStatusReasonSelect}>
                  <SelectTrigger data-testid="select-status-reason">
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(statusReasonOptions[statusAction] || []).map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Additional Notes</span>
                <Textarea
                  value={statusReason}
                  onChange={e => setStatusReason(e.target.value)}
                  placeholder="Add any additional notes about this status change..."
                  className="min-h-[80px]"
                  data-testid="textarea-status-notes"
                />
              </div>

              {statusAction === statusCustomer.status && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> Customer is already {statusCustomer.status}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)} data-testid="button-cancel-status">Cancel</Button>
            <Button
              onClick={() => {
                if (!statusCustomer) return;
                const reasonLabel = (statusReasonOptions[statusAction] || []).find(o => o.value === statusReasonSelect)?.label || statusReasonSelect;
                const fullReason = statusReason.trim() ? `${reasonLabel} - ${statusReason.trim()}` : reasonLabel;
                statusToggleMutation.mutate({ customer: statusCustomer, newStatus: statusAction, reason: fullReason });
              }}
              disabled={statusToggleMutation.isPending || statusAction === statusCustomer?.status || !statusReasonSelect}
              className={statusAction === "active" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              data-testid="button-confirm-status"
            >
              {statusToggleMutation.isPending ? "Updating..." : (
                statusAction === "active" ? "Activate" : statusAction === "suspended" ? "Suspend" : statusAction === "expired" ? "Set Expired" : "Close Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CustomersPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [tab, setTab] = useTab("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: packages } = useQuery<Package[]>({
    queryKey: ["/api/packages"],
  });

  const { data: vendorsData } = useQuery<any[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: employeesData } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  const { data: areasData } = useQuery<any[]>({
    queryKey: ["/api/areas"],
  });

  const { data: customerTypesData, isLoading: customerTypesLoading } = useQuery<CustomerTypeRecord[]>({
    queryKey: ["/api/customer-types"],
  });

  const [ctDialogOpen, setCtDialogOpen] = useState(false);
  const [editingCt, setEditingCt] = useState<CustomerTypeRecord | null>(null);

  const ctForm = useForm<z.infer<typeof insertCustomerTypeSchema>>({
    resolver: zodResolver(insertCustomerTypeSchema),
    defaultValues: {
      key: "", label: "", description: "", icon: "users", color: "blue", isDefault: false, status: "active",
      billingCycle: "monthly", lateFeePercentage: "0", gracePeriodDays: 7, requiresCnic: false, requiresNtn: false, autoSuspendDays: 30, sortOrder: 0,
    },
  });

  const createCtMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCustomerTypeSchema>) => {
      const res = await apiRequest("POST", "/api/customer-types", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-types"] });
      setCtDialogOpen(false);
      ctForm.reset();
      toast({ title: "Customer type created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateCtMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<z.infer<typeof insertCustomerTypeSchema>> }) => {
      const res = await apiRequest("PATCH", `/api/customer-types/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-types"] });
      setCtDialogOpen(false);
      setEditingCt(null);
      ctForm.reset();
      toast({ title: "Customer type updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCtMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/customer-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-types"] });
      toast({ title: "Customer type deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openCtCreate = () => {
    setEditingCt(null);
    ctForm.reset({ key: "", label: "", description: "", icon: "users", color: "blue", isDefault: false, status: "active", billingCycle: "monthly", lateFeePercentage: "0", gracePeriodDays: 7, requiresCnic: false, requiresNtn: false, autoSuspendDays: 30, sortOrder: 0 });
    setCtDialogOpen(true);
  };

  const openCtEdit = (ct: CustomerTypeRecord) => {
    setEditingCt(ct);
    ctForm.reset({
      key: ct.key, label: ct.label, description: ct.description || "", icon: ct.icon || "users", color: ct.color || "blue",
      isDefault: ct.isDefault ?? false, status: ct.status, billingCycle: ct.billingCycle || "monthly",
      lateFeePercentage: ct.lateFeePercentage || "0", gracePeriodDays: ct.gracePeriodDays ?? 7,
      requiresCnic: ct.requiresCnic ?? false, requiresNtn: ct.requiresNtn ?? false,
      autoSuspendDays: ct.autoSuspendDays ?? 30, sortOrder: ct.sortOrder ?? 0,
    });
    setCtDialogOpen(true);
  };

  const onCtSubmit = (data: z.infer<typeof insertCustomerTypeSchema>) => {
    if (editingCt) {
      updateCtMutation.mutate({ id: editingCt.id, data });
    } else {
      createCtMutation.mutate(data);
    }
  };

  const form = useForm<InsertCustomer>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      customerId: "",
      fullName: "",
      email: "",
      phone: "",
      address: "",
      area: "",
      customerType: "home",
      status: "active",
      notes: "",
      connectionDate: new Date().toISOString().split("T")[0],
      isRecurring: true,
      recurringDay: 1,
      nextBillingDate: "",
      lastBilledDate: "",
    },
  });

  const generateRecurringMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/billing/generate-recurring");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Recurring Invoices Generated",
        description: `${data.generated} invoice(s) created successfully`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCustomer) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Customer created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });


  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCustomer> }) => {
      const res = await apiRequest("PATCH", `/api/customers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDialogOpen(false);
      setEditingCustomer(null);
      form.reset();
      toast({ title: "Customer updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Customer deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingCustomer(null);
    form.reset({
      customerId: "",
      fullName: "",
      email: "",
      phone: "",
      address: "",
      area: "",
      customerType: "home",
      status: "active",
      notes: "",
      connectionDate: new Date().toISOString().split("T")[0],
      isRecurring: true,
      recurringDay: 1,
      nextBillingDate: "",
      lastBilledDate: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setLocation(`/customers/${customer.id}/edit`);
  };

  const onSubmit = (data: InsertCustomer) => {
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = (customers || []).filter((c) => {
    const matchSearch =
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.customerId.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColors: Record<string, string> = {
    active: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950",
    inactive: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950",
    suspended: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950",
  };

  const getPackageName = (pkgId: number | null | undefined) => {
    if (!pkgId || !packages) return null;
    return packages.find((p) => p.id === pkgId);
  };

  const getCustomerCountByType = (type: string) => {
    if (!customers) return 0;
    const typeMap: Record<string, string[]> = {
      home: ["home"],
      business: ["corporate"],
      enterprise: ["corporate"],
      reseller: ["reseller"],
    };
    const matchTypes = typeMap[type] || [type];
    return customers.filter((c) => matchTypes.includes(c.customerType)).length;
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-customers-title">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your customer base</p>
        </div>
      </div>

        {tab === "types" && (<div className="space-y-4 mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Types</p>
                    <p className="text-2xl font-bold" data-testid="text-total-ct">{(customerTypesData || []).length}</p>
                  </div>
                  <Hash className="h-8 w-8 text-blue-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Types</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-active-ct">{(customerTypesData || []).filter(t => t.status === "active").length}</p>
                  </div>
                  <ToggleLeft className="h-8 w-8 text-green-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                    <p className="text-2xl font-bold text-purple-600" data-testid="text-total-ct-customers">{(customers || []).length}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Default Type</p>
                    <p className="text-2xl font-bold text-amber-600" data-testid="text-default-ct">{(customerTypesData || []).find(t => t.isDefault)?.label || "—"}</p>
                  </div>
                  <Star className="h-8 w-8 text-amber-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {canCreate("customers") && (
            <div className="flex items-center justify-end">
              <Button onClick={openCtCreate} data-testid="button-add-customer-type" className="bg-gradient-to-r from-[#002B5B] to-[#007BFF] hover:from-[#001f42] hover:to-[#0066dd]">
                <Plus className="h-4 w-4 mr-1" />
                Add New Customer Type
              </Button>
            </div>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-blue-600" />
                Customer Type Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {customerTypesLoading ? (
                <div className="p-5 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !customerTypesData || customerTypesData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Hash className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No customer types configured</p>
                  <p className="text-sm mt-1">Add customer types to categorize your clients</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700">
                        <TableHead className="text-white">Type</TableHead>
                        <TableHead className="text-white">Key</TableHead>
                        <TableHead className="text-white">Description</TableHead>
                        <TableHead className="text-white">Billing</TableHead>
                        <TableHead className="text-white">Late Fee</TableHead>
                        <TableHead className="text-white">Grace Period</TableHead>
                        <TableHead className="text-white">Auto Suspend</TableHead>
                        <TableHead className="text-white">Requirements</TableHead>
                        <TableHead className="text-white">Customers</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(customerTypesData || []).map((ct, idx) => {
                        const count = getCustomerCountByType(ct.key);
                        const colorMap: Record<string, string> = {
                          blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
                          violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
                          amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
                          green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
                          indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
                          slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                          red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
                          orange: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
                          teal: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
                          purple: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
                        };
                        return (
                          <TableRow key={ct.id} data-testid={`row-customer-type-${ct.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={`no-default-active-elevate text-[10px] border-0 ${colorMap[ct.color || "blue"] || colorMap.blue}`}>
                                  {ct.label}
                                </Badge>
                                {ct.isDefault && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                              </div>
                            </TableCell>
                            <TableCell><code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded" data-testid={`text-ct-key-${ct.id}`}>{ct.key}</code></TableCell>
                            <TableCell><span className="text-xs text-muted-foreground max-w-[200px] truncate block">{ct.description || "—"}</span></TableCell>
                            <TableCell><Badge variant="outline" className="no-default-active-elevate text-[10px] capitalize">{ct.billingCycle}</Badge></TableCell>
                            <TableCell><span className="text-sm font-medium">{ct.lateFeePercentage || "0"}%</span></TableCell>
                            <TableCell><span className="text-sm">{ct.gracePeriodDays} days</span></TableCell>
                            <TableCell><span className="text-sm">{ct.autoSuspendDays} days</span></TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {ct.requiresCnic && <Badge variant="secondary" className="no-default-active-elevate text-[9px]">CNIC</Badge>}
                                {ct.requiresNtn && <Badge variant="secondary" className="no-default-active-elevate text-[9px]">NTN</Badge>}
                                {!ct.requiresCnic && !ct.requiresNtn && <span className="text-xs text-muted-foreground">None</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-semibold text-blue-600" data-testid={`text-ct-count-${ct.id}`}>{count}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${ct.status === "active" ? "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950" : "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950"}`}>{ct.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" data-testid={`button-ct-actions-${ct.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {canEdit("customers") && (
                                    <DropdownMenuItem onClick={() => openCtEdit(ct)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                  )}
                                  {canDelete("customers") && (
                                    <DropdownMenuItem className="text-destructive" onClick={() => deleteCtMutation.mutate(ct.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                                  )}
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

          <Dialog open={ctDialogOpen} onOpenChange={setCtDialogOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCt ? "Edit Customer Type" : "Add New Customer Type"}</DialogTitle>
              </DialogHeader>
              <Form {...ctForm}>
                <form onSubmit={ctForm.handleSubmit(onCtSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={ctForm.control} name="label" render={({ field }) => (
                      <FormItem><FormLabel>Label</FormLabel><FormControl><Input data-testid="input-ct-label" placeholder="e.g. Home" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={ctForm.control} name="key" render={({ field }) => (
                      <FormItem><FormLabel>Key</FormLabel><FormControl><Input data-testid="input-ct-key" placeholder="e.g. home" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={ctForm.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea data-testid="input-ct-description" rows={2} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={ctForm.control} name="color" render={({ field }) => (
                      <FormItem><FormLabel>Color</FormLabel><Select onValueChange={field.onChange} value={field.value || "blue"}><FormControl><SelectTrigger data-testid="select-ct-color"><SelectValue /></SelectTrigger></FormControl><SelectContent>
                        <SelectItem value="blue">Blue</SelectItem><SelectItem value="green">Green</SelectItem><SelectItem value="violet">Violet</SelectItem>
                        <SelectItem value="amber">Amber</SelectItem><SelectItem value="indigo">Indigo</SelectItem><SelectItem value="red">Red</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem><SelectItem value="teal">Teal</SelectItem><SelectItem value="purple">Purple</SelectItem><SelectItem value="slate">Slate</SelectItem>
                      </SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={ctForm.control} name="icon" render={({ field }) => (
                      <FormItem><FormLabel>Icon</FormLabel><Select onValueChange={field.onChange} value={field.value || "users"}><FormControl><SelectTrigger data-testid="select-ct-icon"><SelectValue /></SelectTrigger></FormControl><SelectContent>
                        <SelectItem value="home">Home</SelectItem><SelectItem value="building2">Business</SelectItem><SelectItem value="building">Enterprise</SelectItem>
                        <SelectItem value="store">Store</SelectItem><SelectItem value="landmark">Government</SelectItem><SelectItem value="users">Users</SelectItem><SelectItem value="shield">Shield</SelectItem>
                      </SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={ctForm.control} name="status" render={({ field }) => (
                      <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value || "active"}><FormControl><SelectTrigger data-testid="select-ct-status"><SelectValue /></SelectTrigger></FormControl><SelectContent>
                        <SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent></Select><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={ctForm.control} name="billingCycle" render={({ field }) => (
                      <FormItem><FormLabel>Billing Cycle</FormLabel><Select onValueChange={field.onChange} value={field.value || "monthly"}><FormControl><SelectTrigger data-testid="select-ct-billing"><SelectValue /></SelectTrigger></FormControl><SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="biannual">Bi-Annual</SelectItem><SelectItem value="annual">Annual</SelectItem>
                      </SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={ctForm.control} name="lateFeePercentage" render={({ field }) => (
                      <FormItem><FormLabel>Late Fee %</FormLabel><FormControl><Input data-testid="input-ct-late-fee" type="number" step="0.01" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={ctForm.control} name="gracePeriodDays" render={({ field }) => (
                      <FormItem><FormLabel>Grace Period (days)</FormLabel><FormControl><Input data-testid="input-ct-grace" type="number" {...field} value={field.value ?? 7} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={ctForm.control} name="autoSuspendDays" render={({ field }) => (
                      <FormItem><FormLabel>Auto Suspend (days)</FormLabel><FormControl><Input data-testid="input-ct-suspend" type="number" {...field} value={field.value ?? 30} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={ctForm.control} name="sortOrder" render={({ field }) => (
                      <FormItem><FormLabel>Sort Order</FormLabel><FormControl><Input data-testid="input-ct-sort" type="number" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={ctForm.control} name="requiresCnic" render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch data-testid="switch-ct-cnic" checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Requires CNIC</FormLabel></FormItem>
                    )} />
                    <FormField control={ctForm.control} name="requiresNtn" render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch data-testid="switch-ct-ntn" checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Requires NTN</FormLabel></FormItem>
                    )} />
                    <FormField control={ctForm.control} name="isDefault" render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch data-testid="switch-ct-default" checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Default Type</FormLabel></FormItem>
                    )} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCtDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createCtMutation.isPending || updateCtMutation.isPending} data-testid="button-ct-submit" className="bg-gradient-to-r from-[#002B5B] to-[#007BFF]">
                      {(createCtMutation.isPending || updateCtMutation.isPending) ? "Saving..." : editingCt ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>)}

        {tab === "add" && <Redirect to="/customers/add" />}

        {tab === "list" && (<CustomerListView
          customers={customers}
          packages={packages}
          vendors={vendorsData}
          employees={employeesData}
          areas={areasData}
          isLoading={isLoading}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          openEdit={openEdit}
          deleteMutation={deleteMutation}
          updateMutation={updateMutation}
          generateRecurringMutation={generateRecurringMutation}
          setTab={setTab}
        />)}

        {tab === "query-new" && <CustomerQueryWizard setTab={setTab} />}

        {tab === "query-list" && <CustomerQueryList setTab={setTab} />}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="customerId" render={({ field }) => (
                    <FormItem><FormLabel>Customer ID</FormLabel><FormControl><Input data-testid="input-customer-id" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="customerType" render={({ field }) => (
                    <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value || "home"}><FormControl><SelectTrigger data-testid="select-customer-type"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="home">Home</SelectItem><SelectItem value="corporate">Corporate</SelectItem><SelectItem value="reseller">Reseller</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input data-testid="input-full-name" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input data-testid="input-phone" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input data-testid="input-email" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea data-testid="input-address" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="packageId" render={({ field }) => (
                    <FormItem><FormLabel>Package</FormLabel><Select onValueChange={(v) => field.onChange(v ? parseInt(v) : null)} value={field.value?.toString() || ""}><FormControl><SelectTrigger data-testid="select-package"><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{(packages || []).filter(p => p.isActive).map(p => (<SelectItem key={p.id} value={p.id.toString()}>{p.name} - Rs.{p.price}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value || "active"}><FormControl><SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea data-testid="input-notes" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-customer">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingCustomer ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
