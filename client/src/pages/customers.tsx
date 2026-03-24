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

const wizardSteps = [
  { label: "Personal Info", icon: User },
  { label: "Contact Info", icon: Phone },
  { label: "Network & Product", icon: Network },
  { label: "Service Info", icon: ClipboardList },
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
  const [step, setStep] = useState(0);
  const { toast } = useToast();
  const { data: pkgs } = useQuery<Package[]>({ queryKey: ["/api/packages"] });
  const [formData, setFormData] = useState({
    name: "", gender: "", occupation: "", dateOfBirth: "", fatherName: "", motherName: "",
    nidNumber: "", registrationFormNo: "", remarks: "", profilePicture: "", nidPicture: "", registrationFormPicture: "",
    phone: "", email: "", address: "", area: "", city: "", district: "", emergencyContact: "", emergencyPhone: "",
    connectionType: "", packageId: 0, ipAddress: "", macAddress: "", routerModel: "", ontSerialNumber: "", popLocation: "", vlanId: "",
    serviceType: "", billingCycle: "", installationDate: "", activationDate: "",
    monthlyCharges: "", securityDeposit: "", installationFee: "", specialDiscount: "",
    zone: "", subzone: "", customerType: "", billingDate: 0, otcCharge: "",
  });

  const update = (field: string, value: string | number) => setFormData(prev => ({ ...prev, [field]: value }));

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        queryId: `CR-${Date.now().toString(36).toUpperCase()}`,
        packageId: formData.packageId || null,
        monthlyCharges: formData.monthlyCharges || null,
        securityDeposit: formData.securityDeposit || null,
        installationFee: formData.installationFee || null,
        specialDiscount: formData.specialDiscount || null,
        otcCharge: formData.otcCharge || null,
        billingDate: formData.billingDate || null,
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

  const canProceed = () => {
    if (step === 0) return formData.name.trim().length >= 2;
    if (step === 1) return formData.phone.trim().length >= 10;
    return true;
  };

  return (
    <div className="mt-5 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        {wizardSteps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isComplete = i < step;
          return (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer w-full ${
                  isActive ? "bg-blue-600 text-white shadow-md" : isComplete ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"
                }`}
                onClick={() => { if (isComplete) setStep(i); }}
                data-testid={`wizard-step-${i}`}
              >
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                  isActive ? "bg-white/20" : isComplete ? "bg-green-200 dark:bg-green-800" : "bg-background"
                }`}>
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
                </div>
                <Icon className="h-4 w-4 hidden sm:block" />
                <span className="hidden md:inline">{s.label}</span>
              </div>
              {i < wizardSteps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => { const Icon = wizardSteps[step].icon; return <Icon className="h-5 w-5" />; })()}
            {wizardSteps[step].label}
          </CardTitle>
          <CardDescription>
            {step === 0 && "Enter the customer's personal details and upload required documents."}
            {step === 1 && "Provide customer contact and address information."}
            {step === 2 && "Configure network and product details for the connection."}
            {step === 3 && "Set service configuration, billing, and charges."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name <span className="text-red-500">*</span></label>
                  <Input placeholder="Full name" value={formData.name} onChange={e => update("name", e.target.value)} data-testid="input-query-name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gender</label>
                  <Select value={formData.gender} onValueChange={v => update("gender", v)}>
                    <SelectTrigger data-testid="select-query-gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Occupation</label>
                  <Input placeholder="e.g. Engineer, Teacher" value={formData.occupation} onChange={e => update("occupation", e.target.value)} data-testid="input-query-occupation" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date of Birth</label>
                  <Input type="date" value={formData.dateOfBirth} onChange={e => update("dateOfBirth", e.target.value)} data-testid="input-query-dob" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Father Name</label>
                  <Input placeholder="Father's full name" value={formData.fatherName} onChange={e => update("fatherName", e.target.value)} data-testid="input-query-father" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mother Name</label>
                  <Input placeholder="Mother's full name" value={formData.motherName} onChange={e => update("motherName", e.target.value)} data-testid="input-query-mother" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">NID / Birth Certificate No</label>
                  <Input placeholder="National ID or birth certificate number" value={formData.nidNumber} onChange={e => update("nidNumber", e.target.value)} data-testid="input-query-nid" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Registration Form No</label>
                  <Input placeholder="Registration form number" value={formData.registrationFormNo} onChange={e => update("registrationFormNo", e.target.value)} data-testid="input-query-regform" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Remarks / Special Note</label>
                <Textarea placeholder="Any special notes or remarks..." value={formData.remarks} onChange={e => update("remarks", e.target.value)} data-testid="input-query-remarks" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <FileUploadField label="Profile Picture" value={formData.profilePicture} onChange={v => update("profilePicture", v)} testId="upload-profile-picture" />
                <FileUploadField label="NID / Birth Certificate Picture" value={formData.nidPicture} onChange={v => update("nidPicture", v)} testId="upload-nid-picture" />
                <FileUploadField label="Registration Form Picture" value={formData.registrationFormPicture} onChange={v => update("registrationFormPicture", v)} testId="upload-reg-form-picture" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone <span className="text-red-500">*</span></label>
                  <Input placeholder="03XX-XXXXXXX" value={formData.phone} onChange={e => update("phone", e.target.value)} data-testid="input-query-phone" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" placeholder="customer@example.com" value={formData.email} onChange={e => update("email", e.target.value)} data-testid="input-query-email" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Textarea placeholder="Full street address" value={formData.address} onChange={e => update("address", e.target.value)} data-testid="input-query-address" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Area</label>
                  <Input placeholder="Service area" value={formData.area} onChange={e => update("area", e.target.value)} data-testid="input-query-area" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Zone</label>
                  <Input placeholder="Zone" value={formData.zone} onChange={e => update("zone", e.target.value)} data-testid="input-query-zone" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subzone</label>
                  <Input placeholder="Subzone" value={formData.subzone} onChange={e => update("subzone", e.target.value)} data-testid="input-query-subzone" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input placeholder="City name" value={formData.city} onChange={e => update("city", e.target.value)} data-testid="input-query-city" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">District</label>
                  <Input placeholder="District" value={formData.district} onChange={e => update("district", e.target.value)} data-testid="input-query-district" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Type</label>
                  <Select value={formData.customerType} onValueChange={v => update("customerType", v)}>
                    <SelectTrigger data-testid="select-query-customer-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Home">Home</SelectItem>
                      <SelectItem value="Corporate">Corporate</SelectItem>
                      <SelectItem value="Hostel">Hostel</SelectItem>
                      <SelectItem value="Reseller">Reseller</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Emergency Contact Name</label>
                  <Input placeholder="Emergency contact person" value={formData.emergencyContact} onChange={e => update("emergencyContact", e.target.value)} data-testid="input-query-emergency-name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Emergency Phone</label>
                  <Input placeholder="03XX-XXXXXXX" value={formData.emergencyPhone} onChange={e => update("emergencyPhone", e.target.value)} data-testid="input-query-emergency-phone" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Connection Type</label>
                  <Select value={formData.connectionType} onValueChange={v => update("connectionType", v)}>
                    <SelectTrigger data-testid="select-query-connection-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fiber">Fiber (FTTH)</SelectItem>
                      <SelectItem value="wireless">Wireless</SelectItem>
                      <SelectItem value="dsl">DSL</SelectItem>
                      <SelectItem value="cable">Cable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Package</label>
                  <Select value={formData.packageId ? String(formData.packageId) : ""} onValueChange={v => update("packageId", Number(v))}>
                    <SelectTrigger data-testid="select-query-package"><SelectValue placeholder="Select package" /></SelectTrigger>
                    <SelectContent>
                      {pkgs?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name} - {p.speed} ({p.price} PKR)</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">IP Address</label>
                  <Input placeholder="e.g. 192.168.1.100" value={formData.ipAddress} onChange={e => update("ipAddress", e.target.value)} data-testid="input-query-ip" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">MAC Address</label>
                  <Input placeholder="e.g. AA:BB:CC:DD:EE:FF" value={formData.macAddress} onChange={e => update("macAddress", e.target.value)} data-testid="input-query-mac" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Router Model</label>
                  <Input placeholder="e.g. Huawei HG8245H" value={formData.routerModel} onChange={e => update("routerModel", e.target.value)} data-testid="input-query-router" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">ONT Serial Number</label>
                  <Input placeholder="ONT S/N" value={formData.ontSerialNumber} onChange={e => update("ontSerialNumber", e.target.value)} data-testid="input-query-ont" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">POP Location</label>
                  <Input placeholder="Point of Presence location" value={formData.popLocation} onChange={e => update("popLocation", e.target.value)} data-testid="input-query-pop" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">VLAN ID</label>
                  <Input placeholder="e.g. 100" value={formData.vlanId} onChange={e => update("vlanId", e.target.value)} data-testid="input-query-vlan" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Service Type</label>
                  <Select value={formData.serviceType} onValueChange={v => update("serviceType", v)}>
                    <SelectTrigger data-testid="select-query-service-type"><SelectValue placeholder="Select service" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internet">Internet</SelectItem>
                      <SelectItem value="iptv">IPTV</SelectItem>
                      <SelectItem value="cable_tv">Cable TV</SelectItem>
                      <SelectItem value="bundle">Bundle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Billing Cycle</label>
                  <Select value={formData.billingCycle} onValueChange={v => update("billingCycle", v)}>
                    <SelectTrigger data-testid="select-query-billing-cycle"><SelectValue placeholder="Select cycle" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Installation Date</label>
                  <Input type="date" value={formData.installationDate} onChange={e => update("installationDate", e.target.value)} data-testid="input-query-install-date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Activation Date</label>
                  <Input type="date" value={formData.activationDate} onChange={e => update("activationDate", e.target.value)} data-testid="input-query-activation-date" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monthly Charges (PKR)</label>
                  <Input type="number" placeholder="0.00" value={formData.monthlyCharges} onChange={e => update("monthlyCharges", e.target.value)} data-testid="input-query-monthly" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Security Deposit (PKR)</label>
                  <Input type="number" placeholder="0.00" value={formData.securityDeposit} onChange={e => update("securityDeposit", e.target.value)} data-testid="input-query-deposit" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Installation Fee (PKR)</label>
                  <Input type="number" placeholder="0.00" value={formData.installationFee} onChange={e => update("installationFee", e.target.value)} data-testid="input-query-install-fee" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Special Discount (PKR)</label>
                  <Input type="number" placeholder="0.00" value={formData.specialDiscount} onChange={e => update("specialDiscount", e.target.value)} data-testid="input-query-discount" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">OTC / Connection Charge (PKR)</label>
                  <Input type="number" placeholder="0.00" value={formData.otcCharge} onChange={e => update("otcCharge", e.target.value)} data-testid="input-query-otc" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Billing Date (Day of Month)</label>
                  <Input type="number" min="1" max="31" placeholder="e.g. 10" value={formData.billingDate || ""} onChange={e => update("billingDate", Number(e.target.value))} data-testid="input-query-billing-date" />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={() => step > 0 ? setStep(step - 1) : setTab("query-list")}
              data-testid="button-wizard-back"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {step === 0 ? "Cancel" : "Previous"}
            </Button>
            <div className="flex gap-2">
              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  data-testid="button-wizard-next"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-wizard-submit"
                >
                  {createMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CustomerQueryList({ setTab }: { setTab: (v: string) => void }) {
  const { data: queries, isLoading } = useQuery<CustomerQuery[]>({ queryKey: ["/api/customer-queries"] });
  const { data: pkgs } = useQuery<Package[]>({ queryKey: ["/api/packages"] });
  const { toast } = useToast();
  const { canCreate, canDelete } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [setupByFilter, setSetupByFilter] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("");
  const [entriesCount, setEntriesCount] = useState(10);

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
                    <TableHead className="text-white font-semibold text-xs whitespace-nowrap">Package</TableHead>
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
                      <TableCell className="font-medium whitespace-nowrap">{q.name}</TableCell>
                      <TableCell className="whitespace-nowrap">{q.phone}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{q.address || "-"}</TableCell>
                      <TableCell>{q.zone || "-"}</TableCell>
                      <TableCell>{q.subzone || "-"}</TableCell>
                      <TableCell>{q.customerType || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{q.connectionType || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">{getPackageName(q.packageId)}</TableCell>
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
                            {canCreate("customers") && (
                              <DropdownMenuItem onClick={() => statusMutation.mutate({ id: q.id, status: "Completed" })} data-testid={`action-complete-${q.id}`}>
                                <Check className="h-4 w-4 mr-2" /> Complete
                              </DropdownMenuItem>
                            )}
                            {canCreate("customers") && (
                              <DropdownMenuItem onClick={() => statusMutation.mutate({ id: q.id, status: "Rejected" })} data-testid={`action-reject-${q.id}`}>
                                <WifiOff className="h-4 w-4 mr-2" /> Reject
                              </DropdownMenuItem>
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
        <div className="rounded-xl p-4 text-white" style={{ background: "linear-gradient(135deg, #0057FF 0%, #00A3FF 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2"><Wifi className="h-5 w-5" /></div>
            <div>
              <div className="text-lg font-bold" data-testid="stat-running-clients">{runningClients}</div>
              <div className="text-xs font-semibold opacity-90">Running Clients</div>
              <div className="text-[10px] opacity-70">Number of clients without LeftOut status</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "linear-gradient(135deg, #00B894 0%, #00CEC9 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2"><UserPlus className="h-5 w-5" /></div>
            <div>
              <div className="text-lg font-bold" data-testid="stat-new-clients">{newClients}</div>
              <div className="text-xs font-semibold opacity-90">New Clients</div>
              <div className="text-[10px] opacity-70">Monthly number of clients those are new</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "linear-gradient(135deg, #E17055 0%, #FDCB6E 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2"><RefreshCw className="h-5 w-5" /></div>
            <div>
              <div className="text-lg font-bold" data-testid="stat-renewed-clients">{renewedClients}</div>
              <div className="text-xs font-semibold opacity-90">Renewed Clients</div>
              <div className="text-[10px] opacity-70">Monthly number of newly renewed clients</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "linear-gradient(135deg, #636E72 0%, #B2BEC3 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2"><Users className="h-5 w-5" /></div>
            <div>
              <div className="text-lg font-bold" data-testid="stat-other-clients">{otherClients}</div>
              <div className="text-xs font-semibold opacity-90">Other Clients</div>
              <div className="text-[10px] opacity-70">Number of clients those are free/personal</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "linear-gradient(135deg, #D63031 0%, #E17055 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2"><XCircle className="h-5 w-5" /></div>
            <div>
              <div className="text-lg font-bold" data-testid="stat-closed-clients">{closedClients}</div>
              <div className="text-xs font-semibold opacity-90">Closed Clients</div>
              <div className="text-[10px] opacity-70">Number of clients those are closed & terminate</div>
            </div>
          </div>
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

      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#1a3a5c] dark:bg-[#1a3a5c]">
              <TableHead className="text-white w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.length === displayed.length && displayed.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                  data-testid="checkbox-select-all"
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
                <TableRow key={customer.id} className="text-xs" data-testid={`row-customer-${customer.id}`}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(customer.id)}
                      onChange={() => toggleSelect(customer.id)}
                      className="rounded"
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
                          onClick={() => toast({ title: "Send SMS", description: `SMS dialog for ${customer.fullName}` })}>
                          <MessageCircle className="h-4 w-4 mr-2" /> Send SMS
                        </DropdownMenuItem>
                        <DropdownMenuItem data-testid={`action-service-scheduler-${customer.id}`}
                          onClick={() => toast({ title: "Service Scheduler", description: `Scheduler for ${customer.fullName}` })}>
                          <CalendarRange className="h-4 w-4 mr-2" /> Service Scheduler
                        </DropdownMenuItem>
                        {canEdit("customers") && (
                          <DropdownMenuItem data-testid={`action-closed-${customer.id}`}
                            onClick={() => toggleStatusMutation.mutate({ id: customer.id, newStatus: "closed" })}>
                            <XCircle className="h-4 w-4 mr-2" /> Closed
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
          {selectedIds.length > 0 && (
            <span className="text-blue-600 font-medium">{selectedIds.length} selected</span>
          )}
        </div>
      )}
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
