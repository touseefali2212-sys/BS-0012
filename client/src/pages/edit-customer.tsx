import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import {
  User, Wifi, FileText, MapPin, Server, Bell,
  ChevronLeft, Upload, Check, Eye, EyeOff, RefreshCw,
  AlertCircle, Camera, Calculator, Phone, Mail, Shield,
  Building2, Zap, Package, UserCheck, Image, X,
  Loader2, FileSpreadsheet, LocateFixed
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Package as PackageType, Vendor, Area, Branch, Employee, Customer } from "@shared/schema";

function generatePassword(length = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function formatCnic(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function validateCnic(cnic: string) {
  return /^\d{5}-\d{7}-\d{1}$/.test(cnic);
}

function validateMac(mac: string) {
  return /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(mac);
}

function addMonths(dateStr: string, months: number) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function cycleToMonths(cycle: string) {
  const map: Record<string, number> = { monthly: 1, quarterly: 3, "semi-annual": 6, annual: 12 };
  return map[cycle] ?? 1;
}

function capitalizeFirst(str: string) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

interface FileUploadPreviewProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (url: string) => void;
  testId: string;
  accept?: string;
}

function FileUploadPreview({ label, required, value, onChange, testId, accept = "image/*,.pdf" }: FileUploadPreviewProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    } catch {
      onChange("");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden ${
          value
            ? "border-green-500 bg-green-50 dark:bg-green-950/20"
            : "border-border hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/10"
        }`}
        onClick={() => inputRef.current?.click()}
        data-testid={testId}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleUpload}
          disabled={uploading}
        />
        {value ? (
          <div className="flex items-center gap-3 p-3">
            {value.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={value} alt="Preview" className="h-12 w-16 object-cover rounded-lg border" />
            ) : (
              <div className="h-12 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Uploaded
              </p>
              <p className="text-xs text-muted-foreground truncate">{value.split("/").pop()}</p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{uploading ? "Uploading..." : "Click to upload"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG or PDF</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfilePhotoUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    } catch {
      onChange("");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative h-28 w-28 rounded-full border-4 border-blue-200 dark:border-blue-800 overflow-hidden cursor-pointer group bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center"
        onClick={() => inputRef.current?.click()}
        data-testid="upload-profile-photo"
      >
        {value ? (
          <img src={value} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <User className="h-12 w-12 text-blue-300" />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="h-6 w-6 text-white" />
        </div>
        <input ref={inputRef} type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
      </div>
      <p className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Click to change photo"}</p>
    </div>
  );
}

const tabItems = [
  { id: "basic", label: "Basic Info", icon: User },
  { id: "connection", label: "Connection", icon: Wifi },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "area", label: "Area", icon: MapPin },
  { id: "infrastructure", label: "Infrastructure", icon: Server },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const defaultForm = {
  fullName: "", fatherName: "", cnic: "", phone: "", email: "",
  gender: "", occupation: "", dateOfBirth: "", customerType: "Normal",
  profilePicture: "", notes: "",

  connectedBy: "", usernameIp: "", password: "", vendorId: "", packageId: "",
  packageBill: "", discountOnPackage: "", finalPackageBill: "",
  installationCharges: "0", discountOnInstallation: "0", finalInstallationCharges: "0",
  staticIpEnabled: false, staticIpMrc: "0",
  installmentEnabled: false, installmentTotalAmount: "", installmentMonths: "6",
  installmentMonthlyAmount: "0", installmentPaidMonths: "0",
  grandTotal: "0",
  joiningDate: "", expireDate: "", billingStatus: "Active",

  cnicFront: "", cnicBack: "", registrationFormNo: "", registrationFormPicture: "", addressProof: "",

  branch: "", cnicAddress: "", presentAddress: "", area: "", city: "",
  mapLatitude: "", mapLongitude: "", zone: "", subzone: "",

  protocolType: "", connectionType: "", device: "", deviceModel: "", deviceMacSerial: "",
  deviceOwnedBy: "Company", cableRequirement: "", fiberCode: "", numberOfCore: "", coreColor: "",

  smsMobile: true, smsWhatsapp: false, emailNotif: false, inAppNotif: true,
  sendSmsToEmployee: false, sendGreetingSms: true,
};

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  const customerId = parseInt(params.id ?? "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gpsLocating, setGpsLocating] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);

  const [form, setForm] = useState({ ...defaultForm });

  const { data: customer, isLoading: customerLoading } = useQuery<Customer>({
    queryKey: ["/api/customers", customerId],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${customerId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load customer");
      return res.json();
    },
    enabled: !!customerId,
  });

  const { data: vendors } = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });
  const { data: packages } = useQuery<PackageType[]>({ queryKey: ["/api/packages"] });
  const { data: areas } = useQuery<Area[]>({ queryKey: ["/api/areas"] });
  const { data: branches } = useQuery<Branch[]>({ queryKey: ["/api/branches"] });
  const { data: employees } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });

  useEffect(() => {
    if (!customer || formLoaded) return;
    const ct = customer.customerType ?? "Normal";
    const capitalizedCt = ct.charAt(0).toUpperCase() + ct.slice(1);

    setForm({
      fullName:         customer.fullName ?? "",
      fatherName:       (customer as any).fatherName ?? "",
      cnic:             customer.cnic ?? "",
      phone:            customer.phone ?? "",
      email:            customer.email ?? "",
      gender:           (customer as any).gender ?? "",
      occupation:       (customer as any).occupation ?? "",
      dateOfBirth:      (customer as any).dateOfBirth ?? "",
      customerType:     capitalizedCt,
      profilePicture:   customer.profilePicture ?? "",
      notes:            customer.notes ?? "",

      connectedBy:      customer.connectedBy ?? "",
      usernameIp:       customer.usernameIp ?? "",
      password:         customer.password ?? "",
      vendorId:         customer.vendorId ? String(customer.vendorId) : "",
      packageId:        customer.packageId ? String(customer.packageId) : "",
      packageBill:      (customer as any).packageBill ?? "",
      discountOnPackage:(customer as any).discountOnPackage ?? "0",
      finalPackageBill: customer.monthlyBill ?? "",
      installationCharges:       (customer as any).installationCharges ?? "0",
      discountOnInstallation:    (customer as any).discountOnInstallation ?? "0",
      finalInstallationCharges:  (customer as any).finalInstallationCharges ?? "0",
      staticIpEnabled:  (customer as any).staticIpEnabled ?? false,
      staticIpMrc:      (customer as any).staticIpMrc ?? "0",
      installmentEnabled:       (customer as any).installmentEnabled ?? false,
      installmentTotalAmount:   (customer as any).installmentTotalAmount ?? "",
      installmentMonths:        String((customer as any).installmentMonths ?? "6"),
      installmentMonthlyAmount: (customer as any).installmentMonthlyAmount ?? "0",
      installmentPaidMonths:    String((customer as any).installmentPaidMonths ?? "0"),
      grandTotal:       (customer as any).grandTotal ?? "0",
      joiningDate:      customer.joiningDate ?? "",
      expireDate:       customer.expireDate ?? "",
      billingStatus:    capitalizeFirst(customer.billingStatus ?? "Active"),

      cnicFront:               customer.nidPicture ?? "",
      cnicBack:                (customer as any).cnicBackPicture ?? "",
      registrationFormNo:      customer.registrationFormNo ?? "",
      registrationFormPicture: customer.registrationFormPicture ?? "",
      addressProof:            "",

      branch:          (customer as any).branch ?? "",
      cnicAddress:     customer.address ?? "",
      presentAddress:  customer.presentAddress ?? "",
      area:            customer.area ?? "",
      city:            (customer as any).city ?? "",
      mapLatitude:     customer.mapLatitude ?? "",
      mapLongitude:    customer.mapLongitude ?? "",
      zone:            customer.zone ?? "",
      subzone:         customer.subzone ?? "",

      protocolType:    customer.protocolType ?? "",
      connectionType:  customer.connectionType ?? "",
      device:          customer.device ?? "",
      deviceModel:     (customer as any).deviceModel ?? "",
      deviceMacSerial: customer.deviceMacSerial ?? "",
      deviceOwnedBy:   (customer as any).deviceOwnedBy ?? "Company",
      cableRequirement:(customer as any).cableRequirement ?? "",
      fiberCode:       customer.fiberCode ?? "",
      numberOfCore:    customer.numberOfCore ?? "",
      coreColor:       customer.coreColor ?? "",

      smsMobile:         true,
      smsWhatsapp:       false,
      emailNotif:        false,
      inAppNotif:        true,
      sendSmsToEmployee: false,
      sendGreetingSms:   false,
    });
    setFormLoaded(true);
  }, [customer, formLoaded]);

  const update = (field: string, value: string | boolean | number) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };

      if (field === "packageBill" || field === "discountOnPackage") {
        const bill = parseFloat(field === "packageBill" ? String(value) : prev.packageBill) || 0;
        const disc = parseFloat(field === "discountOnPackage" ? String(value) : prev.discountOnPackage) || 0;
        updated.finalPackageBill = String(Math.max(0, bill - disc));
      }

      if (field === "installationCharges" || field === "discountOnInstallation") {
        const inst = parseFloat(field === "installationCharges" ? String(value) : prev.installationCharges) || 0;
        const disc = parseFloat(field === "discountOnInstallation" ? String(value) : prev.discountOnInstallation) || 0;
        updated.finalInstallationCharges = String(Math.max(0, inst - disc));
      }

      // Auto-calculate installment monthly amount when total or months change
      if (field === "installmentTotalAmount" || field === "installmentMonths") {
        const total  = parseFloat(field === "installmentTotalAmount" ? String(value) : prev.installmentTotalAmount) || 0;
        const months = parseInt(field === "installmentMonths"        ? String(value) : prev.installmentMonths, 10)  || 1;
        updated.installmentMonthlyAmount = months > 0 ? (total / months).toFixed(2) : "0";
      }

      if (["packageBill","discountOnPackage","installationCharges","discountOnInstallation",
           "staticIpMrc","staticIpEnabled",
           "installmentEnabled","installmentTotalAmount","installmentMonths"].includes(field)) {
        const fp  = parseFloat(updated.finalPackageBill)         || 0;
        const fi  = parseFloat(updated.finalInstallationCharges) || 0;
        const sip = (updated.staticIpEnabled     ? parseFloat(updated.staticIpMrc)             : 0) || 0;
        const ins = (updated.installmentEnabled  ? parseFloat(updated.installmentMonthlyAmount) : 0) || 0;
        updated.grandTotal = (fp + fi + sip + ins).toFixed(2);
      }

      return updated;
    });
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  const filteredPackages = packages?.filter(p =>
    !form.vendorId || String(p.vendorId) === form.vendorId
  );

  const selectedPackage = packages?.find(p => String(p.id) === form.packageId);

  const selectedBranch = branches?.find(b => String(b.id) === form.branch);

  const filteredAreas = areas?.filter(a =>
    !selectedBranch || a.branch === selectedBranch.name
  );

  const manualBranchRef = useRef<string | null>(null);
  const manualAreaRef   = useRef<string | null>(null);

  const handleBranchChange = (branchId: string) => {
    manualBranchRef.current = branchId;
    setForm(prev => ({ ...prev, branch: branchId, area: "" }));
  };

  const handleAreaChange = (areaName: string) => {
    manualAreaRef.current = areaName;
    setForm(prev => ({ ...prev, area: areaName }));
  };

  useEffect(() => {
    if (form.branch !== manualBranchRef.current) return;
    if (!form.branch || !branches?.length) return;
    const branch = branches.find(b => String(b.id) === form.branch);
    if (!branch?.city) return;
    setForm(prev => ({ ...prev, city: branch.city! }));
  }, [form.branch, branches]);

  useEffect(() => {
    if (form.area !== manualAreaRef.current) return;
    if (!form.area || !areas?.length) return;
    const area = areas.find(a => a.name === form.area);
    if (!area) return;
    setForm(prev => ({
      ...prev,
      ...(area.city ? { city: area.city } : {}),
      ...(area.zone ? { zone: area.zone } : {}),
    }));
  }, [form.area, areas]);

  const handlePackageChange = (pkgId: string) => {
    const pkg = packages?.find(p => String(p.id) === pkgId);
    if (pkg) {
      const base   = parseFloat(pkg.price  ?? "0") || 0;
      const wht    = parseFloat(pkg.whTax  ?? "0") || 0;
      const ait    = parseFloat(pkg.aitTax ?? "0") || 0;
      const whtAmt = (base * wht) / 100;
      const aitAmt = (base * ait) / 100;
      const total  = base + whtAmt + aitAmt;
      const bill   = total.toFixed(2);
      const disc   = form.discountOnPackage || "0";
      const final  = String(Math.max(0, parseFloat(bill) - parseFloat(disc)));
      const expire = form.joiningDate ? addMonths(form.joiningDate, cycleToMonths(pkg.billingCycle)) : "";
      const instFinal = parseFloat(form.finalInstallationCharges) || 0;
      setForm(prev => ({
        ...prev,
        packageId: pkgId,
        packageBill: bill,
        finalPackageBill: final,
        grandTotal: (parseFloat(final) + instFinal).toFixed(2),
        expireDate: expire,
      }));
    } else {
      update("packageId", pkgId);
    }
  };

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", description: "Your browser does not support GPS.", variant: "destructive" });
      return;
    }
    setGpsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update("mapLatitude",  String(pos.coords.latitude));
        update("mapLongitude", String(pos.coords.longitude));
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

  const handleJoiningDateChange = (date: string) => {
    setForm(prev => {
      const expire = selectedPackage
        ? addMonths(date, cycleToMonths(selectedPackage.billingCycle))
        : prev.expireDate;
      return { ...prev, joiningDate: date, expireDate: expire };
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName || form.fullName.length < 2) newErrors.fullName = "Name must be at least 2 characters";
    if (!form.phone || form.phone.length < 10) newErrors.phone = "Valid phone number required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Invalid email address";
    if (form.cnic && !validateCnic(form.cnic)) newErrors.cnic = "Format: XXXXX-XXXXXXX-X";
    if (form.deviceMacSerial && form.deviceMacSerial.includes(":") && !validateMac(form.deviceMacSerial)) newErrors.deviceMacSerial = "Format: AA:BB:CC:DD:EE:FF";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstErrorTab = Object.keys(newErrors)[0];
      const tabMap: Record<string, string> = {
        fullName: "basic", fatherName: "basic", cnic: "basic", phone: "basic", email: "basic",
        connectedBy: "connection", usernameIp: "connection", packageId: "connection",
        deviceMacSerial: "infrastructure",
      };
      if (tabMap[firstErrorTab]) setActiveTab(tabMap[firstErrorTab]);
    }
    return Object.keys(newErrors).length === 0;
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        fullName:       form.fullName,
        fatherName:     form.fatherName,
        cnic:           form.cnic,
        phone:          form.phone,
        email:          form.email,
        gender:         form.gender,
        occupation:     form.occupation,
        dateOfBirth:    form.dateOfBirth,
        customerType:   form.customerType.toLowerCase(),
        profilePicture: form.profilePicture,
        notes:          form.notes,

        connectedBy:    form.connectedBy,
        usernameIp:     form.usernameIp,
        password:       form.password || undefined,
        vendorId:       form.vendorId ? parseInt(form.vendorId) : null,
        packageId:      form.packageId ? parseInt(form.packageId) : null,
        monthlyBill:    form.finalPackageBill || form.packageBill || null,
        joiningDate:    form.joiningDate,
        expireDate:     form.expireDate,
        connectionDate: form.joiningDate,
        billingStatus:  form.billingStatus,
        status:         form.billingStatus.toLowerCase() === "active" ? "active" : form.billingStatus.toLowerCase() === "suspended" ? "suspended" : "inactive",

        nidPicture:              form.cnicFront,
        cnicBackPicture:         form.cnicBack,
        registrationFormNo:      form.registrationFormNo,
        registrationFormPicture: form.registrationFormPicture,
        address:                 form.cnicAddress,
        presentAddress:          form.presentAddress,
        permanentAddress:        form.cnicAddress,

        branch:       form.branch,
        area:         form.area,
        city:         form.city,
        mapLatitude:  form.mapLatitude,
        mapLongitude: form.mapLongitude,
        zone:         form.zone,
        subzone:      form.subzone,

        protocolType:    form.protocolType,
        connectionType:  form.connectionType,
        device:          form.device,
        deviceModel:     form.deviceModel,
        deviceMacSerial: form.deviceMacSerial,
        deviceOwnedBy:   form.deviceOwnedBy,
        cableRequirement:form.cableRequirement,
        fiberCode:       form.fiberCode,
        numberOfCore:    form.numberOfCore,
        coreColor:       form.coreColor,

        installationCharges:      form.installationCharges || "0",
        discountOnInstallation:   form.discountOnInstallation || "0",
        finalInstallationCharges: form.finalInstallationCharges || "0",
        packageBill:              form.packageBill || "0",
        discountOnPackage:        form.discountOnPackage || "0",
        grandTotal:               form.grandTotal || "0",
        staticIpEnabled:          form.staticIpEnabled,
        staticIpMrc:              form.staticIpMrc || "0",
        installmentEnabled:       form.installmentEnabled,
        installmentTotalAmount:   form.installmentTotalAmount  || "0",
        installmentMonths:        parseInt(form.installmentMonths, 10) || 0,
        installmentMonthlyAmount: form.installmentMonthlyAmount || "0",
        installmentPaidMonths:    parseInt(form.installmentPaidMonths, 10) || 0,

        sendSmsToEmployee: form.sendSmsToEmployee,
        sendGreetingSms:   form.sendGreetingSms,
        isRecurring: true,
      };
      const res = await apiRequest("PATCH", `/api/customers/${customerId}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId] });
      toast({ title: "Customer updated", description: `${form.fullName} has been updated successfully.` });
      setLocation(`/customers/${customerId}`);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to update customer", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!validate()) return;
    updateMutation.mutate();
  };

  const tabIndex = tabItems.findIndex(t => t.id === activeTab);
  const isLastTab = tabIndex === tabItems.length - 1;
  const isFirstTab = tabIndex === 0;

  if (customerLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-muted-foreground">Customer not found</p>
        <Button onClick={() => setLocation("/customers")}>Back to Customers</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-blue-950/10 dark:to-indigo-950/10">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/customers/${customerId}`)}
            className="gap-2 text-muted-foreground hover:text-foreground"
            data-testid="button-back-profile"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Profile
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Edit Customer</h1>
              <p className="text-xs text-muted-foreground">{customer.fullName} · {customer.customerId}</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md rounded-2xl border border-border/60 shadow-sm p-1.5">
            <TabsList className="w-full bg-transparent gap-1 h-auto flex-wrap">
              {tabItems.map((tab, i) => {
                const Icon = tab.icon;
                const isComplete = i < tabIndex;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={`flex-1 min-w-fit gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md ${
                      isComplete ? "text-green-600 dark:text-green-400" : ""
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    {isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* ─── BASIC INFO ─── */}
          <TabsContent value="basic" className="mt-4 space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Basic Information</CardTitle>
                    <CardDescription>Customer identity and personal details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <ProfilePhotoUpload value={form.profilePicture} onChange={v => update("profilePicture", v)} />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Customer Name <span className="text-red-500">*</span></label>
                      <Input
                        placeholder="Full name"
                        value={form.fullName}
                        onChange={e => update("fullName", e.target.value)}
                        data-testid="input-full-name"
                        className={errors.fullName ? "border-red-500" : ""}
                      />
                      {errors.fullName && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.fullName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Father Name</label>
                      <Input
                        placeholder="Father's full name"
                        value={form.fatherName}
                        onChange={e => update("fatherName", e.target.value)}
                        data-testid="input-father-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Gender</label>
                      <Select value={form.gender} onValueChange={v => update("gender", v)}>
                        <SelectTrigger data-testid="select-gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Date of Birth</label>
                      <Input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={e => update("dateOfBirth", e.target.value)}
                        data-testid="input-dob"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">CNIC / NID Number</label>
                    <div className="relative">
                      <Input
                        placeholder="XXXXX-XXXXXXX-X"
                        value={form.cnic}
                        onChange={e => update("cnic", formatCnic(e.target.value))}
                        data-testid="input-cnic"
                        className={errors.cnic ? "border-red-500" : ""}
                        maxLength={15}
                      />
                      {form.cnic && (
                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${validateCnic(form.cnic) ? "text-green-500" : "text-amber-500"}`}>
                          {validateCnic(form.cnic) ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        </div>
                      )}
                    </div>
                    {errors.cnic && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.cnic}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Mobile Number <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="03XX-XXXXXXX"
                        value={form.phone}
                        onChange={e => update("phone", e.target.value)}
                        data-testid="input-phone"
                        className={`pl-9 ${errors.phone ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.phone}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="customer@example.com"
                        value={form.email}
                        onChange={e => update("email", e.target.value)}
                        data-testid="input-email"
                        className={`pl-9 ${errors.email ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Customer Type</label>
                    <Select value={form.customerType} onValueChange={v => update("customerType", v)}>
                      <SelectTrigger data-testid="select-customer-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="CIR">CIR</SelectItem>
                        <SelectItem value="Corporate">Corporate</SelectItem>
                        <SelectItem value="Home">Home</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Reseller">Reseller</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Occupation</label>
                    <Input
                      placeholder="e.g. Engineer, Teacher"
                      value={form.occupation}
                      onChange={e => update("occupation", e.target.value)}
                      data-testid="input-occupation"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Remarks / Notes</label>
                  <Textarea
                    placeholder="Any special notes..."
                    value={form.notes}
                    onChange={e => update("notes", e.target.value)}
                    data-testid="input-notes"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── CONNECTION ─── */}
          <TabsContent value="connection" className="mt-4 space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Wifi className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Connection Information</CardTitle>
                    <CardDescription>Service configuration and billing setup</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Connection Installed By</label>
                    <Select value={form.connectedBy} onValueChange={v => update("connectedBy", v)}>
                      <SelectTrigger data-testid="select-installer"><SelectValue placeholder="Select employee" /></SelectTrigger>
                      <SelectContent>
                        {employees?.map(emp => (
                          <SelectItem key={emp.id} value={String(emp.id)}>
                            {emp.fullName} — {emp.designation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Username (PPPoE/Hotspot)</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. usr_johndoe"
                        value={form.usernameIp}
                        onChange={e => update("usernameIp", e.target.value)}
                        data-testid="input-username"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => update("usernameIp", `usr_${form.fullName.toLowerCase().replace(/\s+/g, "").slice(0, 8) || "customer"}${Math.floor(Math.random() * 999)}`)}
                        data-testid="button-suggest-username"
                        className="shrink-0 text-xs"
                      >
                        Suggest
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Password</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Leave blank to keep unchanged"
                          value={form.password}
                          onChange={e => update("password", e.target.value)}
                          data-testid="input-password"
                          className="pr-9"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(s => !s)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => update("password", generatePassword())}
                        data-testid="button-generate-password"
                        className="shrink-0 text-xs gap-1"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Auto
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Billing Status</label>
                    <Select value={form.billingStatus} onValueChange={v => update("billingStatus", v)}>
                      <SelectTrigger data-testid="select-billing-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-sm">Package & Billing</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Select Vendor</label>
                      <Select value={form.vendorId} onValueChange={v => { update("vendorId", v); update("packageId", ""); update("packageBill", ""); update("finalPackageBill", ""); }}>
                        <SelectTrigger data-testid="select-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                        <SelectContent>
                          {vendors?.map(v => (
                            <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Select Package</label>
                      <Select value={form.packageId} onValueChange={handlePackageChange}>
                        <SelectTrigger data-testid="select-package"><SelectValue placeholder={form.vendorId ? "Select package" : "Select vendor first"} /></SelectTrigger>
                        <SelectContent>
                          {filteredPackages?.map(p => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name} — {p.speed} — PKR {p.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedPackage && (() => {
                    const basePrice  = parseFloat(selectedPackage.price  ?? "0") || 0;
                    const whtPct     = parseFloat(selectedPackage.whTax  ?? "0") || 0;
                    const aitPct     = parseFloat(selectedPackage.aitTax ?? "0") || 0;
                    const whtAmount  = (basePrice * whtPct)  / 100;
                    const aitAmount  = (basePrice * aitPct)  / 100;
                    const totalTax   = whtAmount + aitAmount;
                    const totalPrice = basePrice + totalTax;
                    const hasTax     = whtPct > 0 || aitPct > 0;
                    return (
                      <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Package Details: {selectedPackage.name}</span>
                          <Badge variant="outline" className="text-xs ml-auto">{selectedPackage.billingCycle}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Speed</p>
                            <p className="font-medium">{selectedPackage.speed || "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Service</p>
                            <p className="font-medium capitalize">{selectedPackage.serviceType}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Data Limit</p>
                            <p className="font-medium">{selectedPackage.dataLimit || "Unlimited"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Base Price</p>
                            <p className="font-semibold text-blue-700 dark:text-blue-400">PKR {basePrice.toLocaleString()}</p>
                          </div>
                        </div>
                        {hasTax && (
                          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tax Breakdown</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">WHT ({whtPct}%)</p>
                                <p className="font-medium text-amber-700 dark:text-amber-400">
                                  {whtPct > 0 ? `PKR ${whtAmount.toFixed(2)}` : "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">AIT ({aitPct}%)</p>
                                <p className="font-medium text-amber-700 dark:text-amber-400">
                                  {aitPct > 0 ? `PKR ${aitAmount.toFixed(2)}` : "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Total Tax</p>
                                <p className="font-medium text-red-600 dark:text-red-400">PKR {totalTax.toFixed(2)}</p>
                              </div>
                              <div className="bg-green-100 dark:bg-green-900/30 rounded-lg px-3 py-1.5">
                                <p className="text-muted-foreground text-xs">Total (incl. Tax)</p>
                                <p className="font-bold text-green-700 dark:text-green-400">PKR {totalPrice.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Package Bill (PKR)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={form.packageBill}
                        onChange={e => update("packageBill", e.target.value)}
                        data-testid="input-package-bill"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Discount on Package</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={form.discountOnPackage}
                        onChange={e => update("discountOnPackage", e.target.value)}
                        data-testid="input-package-discount"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Final Package Bill</label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={form.finalPackageBill}
                          readOnly
                          data-testid="input-final-package-bill"
                          className="bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 font-semibold pr-9"
                        />
                        <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Installation Charges</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={form.installationCharges}
                        onChange={e => update("installationCharges", e.target.value)}
                        data-testid="input-installation-charges"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Discount on Installation</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={form.discountOnInstallation}
                        onChange={e => update("discountOnInstallation", e.target.value)}
                        data-testid="input-installation-discount"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Final Installation Charges</label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={form.finalInstallationCharges}
                          readOnly
                          data-testid="input-final-installation"
                          className="bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 font-semibold pr-9"
                        />
                        <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  </div>

                  {/* Add-on Services */}
                  <div className="mt-4 rounded-xl border border-dashed border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">Add-on Services</span>
                      <span className="text-xs text-muted-foreground ml-1">Optional recurring charges</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        data-testid="btn-addon-static-ip"
                        onClick={() => update("staticIpEnabled", !form.staticIpEnabled)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          form.staticIpEnabled
                            ? "bg-purple-600 border-purple-600 text-white shadow-md"
                            : "bg-white dark:bg-background border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 hover:border-purple-500"
                        }`}
                      >
                        {form.staticIpEnabled ? <Check className="h-4 w-4" /> : <span className="font-bold text-base leading-none">+</span>}
                        Static IP
                        {form.staticIpEnabled && <Badge className="ml-1 bg-white/20 text-white text-[10px] px-1.5 py-0">Active</Badge>}
                      </button>

                      {/* Installment Plan toggle button */}
                      <button
                        type="button"
                        data-testid="btn-addon-installment"
                        onClick={() => update("installmentEnabled", !form.installmentEnabled)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          form.installmentEnabled
                            ? "bg-amber-600 border-amber-600 text-white shadow-md"
                            : "bg-white dark:bg-background border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:border-amber-500"
                        }`}
                      >
                        {form.installmentEnabled ? <Check className="h-4 w-4" /> : <span className="font-bold text-base leading-none">+</span>}
                        Installment Plan
                        {form.installmentEnabled && <Badge className="ml-1 bg-white/20 text-white text-[10px] px-1.5 py-0">Active</Badge>}
                      </button>
                    </div>

                    {form.staticIpEnabled && (
                      <div className="mt-3 flex items-end gap-3">
                        <div className="space-y-1.5 flex-1 max-w-xs">
                          <label className="text-sm font-medium text-purple-700 dark:text-purple-400">
                            Static IP — MRC (PKR)
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={form.staticIpMrc}
                              onChange={e => update("staticIpMrc", e.target.value)}
                              data-testid="input-static-ip-mrc"
                              className="pr-9 border-purple-300 dark:border-purple-700 focus-visible:ring-purple-400"
                            />
                            <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
                          </div>
                          <p className="text-[11px] text-muted-foreground">Monthly Recurring Charge for Static IP service</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => update("staticIpEnabled", false)}
                          className="mb-6 text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1"
                          data-testid="btn-remove-static-ip"
                        >
                          <X className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    )}

                    {/* Installment Plan fields */}
                    {form.installmentEnabled && (
                      <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Installment Plan Details</p>
                          <button
                            type="button"
                            onClick={() => update("installmentEnabled", false)}
                            className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1"
                            data-testid="btn-remove-installment"
                          >
                            <X className="h-3.5 w-3.5" /> Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-amber-700 dark:text-amber-400">
                              Total Amount (PKR) <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              placeholder="e.g. 12000"
                              value={form.installmentTotalAmount}
                              onChange={e => update("installmentTotalAmount", e.target.value)}
                              data-testid="input-installment-total"
                              className="border-amber-300 dark:border-amber-700 focus-visible:ring-amber-400"
                            />
                            <p className="text-[11px] text-muted-foreground">Device / installation cost to recover</p>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-amber-700 dark:text-amber-400">
                              No. of Installments <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="e.g. 6"
                              value={form.installmentMonths}
                              onChange={e => update("installmentMonths", e.target.value)}
                              data-testid="input-installment-months"
                              className="border-amber-300 dark:border-amber-700 focus-visible:ring-amber-400"
                            />
                            <p className="text-[11px] text-muted-foreground">Number of monthly installments</p>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-amber-700 dark:text-amber-400">Monthly Installment (PKR)</label>
                            <div className="relative">
                              <Input
                                type="number"
                                readOnly
                                value={form.installmentMonthlyAmount}
                                data-testid="input-installment-monthly"
                                className="bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 font-semibold cursor-not-allowed"
                              />
                              <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                            </div>
                            <p className="text-[11px] text-muted-foreground">Auto-calculated · added to monthly bill</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-amber-700 dark:text-amber-400">Installments Already Paid</label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={form.installmentPaidMonths}
                            onChange={e => update("installmentPaidMonths", e.target.value)}
                            data-testid="input-installment-paid"
                            className="max-w-xs border-amber-300 dark:border-amber-700 focus-visible:ring-amber-400"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Remaining: {Math.max(0, (parseInt(form.installmentMonths, 10) || 0) - (parseInt(form.installmentPaidMonths, 10) || 0))} of {form.installmentMonths || 0} installments
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shadow-md">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <Calculator className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Grand Total</p>
                        <p className="text-[11px] text-blue-200 space-x-1">
                          <span>PKR {(parseFloat(form.finalPackageBill) || 0).toFixed(2)} package</span>
                          <span>+</span>
                          <span>PKR {(parseFloat(form.finalInstallationCharges) || 0).toFixed(2)} installation</span>
                          {form.staticIpEnabled && parseFloat(form.staticIpMrc) > 0 && (
                            <>
                              <span>+</span>
                              <span>PKR {(parseFloat(form.staticIpMrc) || 0).toFixed(2)} static IP</span>
                            </>
                          )}
                          {form.installmentEnabled && parseFloat(form.installmentMonthlyAmount) > 0 && (
                            <>
                              <span>+</span>
                              <span>PKR {(parseFloat(form.installmentMonthlyAmount) || 0).toFixed(2)} installment</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-700 pointer-events-none">PKR</span>
                      <Input
                        type="number"
                        value={form.grandTotal}
                        onChange={e => update("grandTotal", e.target.value)}
                        data-testid="input-grand-total"
                        className="pl-12 text-lg font-bold text-blue-700 dark:text-blue-700 bg-white border-0 h-12 shadow-inner"
                      />
                    </div>
                    <p className="text-[11px] text-blue-200 mt-1.5 text-right">You can adjust the grand total manually if needed</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Joining Date</label>
                    <Input
                      type="date"
                      value={form.joiningDate}
                      onChange={e => handleJoiningDateChange(e.target.value)}
                      data-testid="input-joining-date"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Expire Date</label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={form.expireDate}
                        onChange={e => update("expireDate", e.target.value)}
                        data-testid="input-expire-date"
                        className="bg-muted/40"
                      />
                      {selectedPackage && (
                        <Badge variant="outline" className="absolute right-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none">
                          Auto
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── DOCUMENTS ─── */}
          <TabsContent value="documents" className="mt-4 space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Documents Upload</CardTitle>
                    <CardDescription>KYC verification and customer documents</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FileUploadPreview
                    label="CNIC Front"
                    value={form.cnicFront}
                    onChange={v => update("cnicFront", v)}
                    testId="upload-cnic-front"
                  />
                  <FileUploadPreview
                    label="CNIC Back"
                    value={form.cnicBack}
                    onChange={v => update("cnicBack", v)}
                    testId="upload-cnic-back"
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Registration Form No</label>
                    <Input
                      placeholder="Form number"
                      value={form.registrationFormNo}
                      onChange={e => update("registrationFormNo", e.target.value)}
                      data-testid="input-reg-form-no"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FileUploadPreview
                    label="Registration Form Image"
                    value={form.registrationFormPicture}
                    onChange={v => update("registrationFormPicture", v)}
                    testId="upload-reg-form"
                  />
                  <FileUploadPreview
                    label="Address Proof (Utility Bill / Other)"
                    value={form.addressProof}
                    onChange={v => update("addressProof", v)}
                    testId="upload-address-proof"
                  />
                </div>

                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Secure Document Storage</p>
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-0.5">All uploaded documents are encrypted and stored securely. Supported formats: JPG, PNG, PDF (max 5MB each).</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── AREA ─── */}
          <TabsContent value="area" className="mt-4 space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Area Information</CardTitle>
                    <CardDescription>Customer location and geographic details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Branch</label>
                    <Select value={form.branch} onValueChange={handleBranchChange}>
                      <SelectTrigger data-testid="select-branch"><SelectValue placeholder="Select branch" /></SelectTrigger>
                      <SelectContent>
                        {branches?.map(b => (
                          <SelectItem key={b.id} value={String(b.id)}>{b.name} — {b.city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Area</label>
                    <Select value={form.area} onValueChange={handleAreaChange} disabled={!form.branch}>
                      <SelectTrigger data-testid="select-area"><SelectValue placeholder={form.branch ? "Select area" : "Select branch first"} /></SelectTrigger>
                      <SelectContent>
                        {filteredAreas?.map(a => (
                          <SelectItem key={a.id} value={a.name}>{a.name} — {a.city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">City</label>
                    <Input
                      placeholder="City name"
                      value={form.city}
                      onChange={e => update("city", e.target.value)}
                      data-testid="input-city"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Zone</label>
                    <Input
                      placeholder="Zone"
                      value={form.zone}
                      onChange={e => update("zone", e.target.value)}
                      data-testid="input-zone"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Subzone</label>
                    <Input
                      placeholder="Subzone"
                      value={form.subzone}
                      onChange={e => update("subzone", e.target.value)}
                      data-testid="input-subzone"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">CNIC Address</label>
                    <Textarea
                      placeholder="Address as per CNIC"
                      value={form.cnicAddress}
                      onChange={e => update("cnicAddress", e.target.value)}
                      data-testid="input-cnic-address"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Current Address</label>
                    <Textarea
                      placeholder="Current residential address"
                      value={form.presentAddress}
                      onChange={e => update("presentAddress", e.target.value)}
                      data-testid="input-present-address"
                      rows={2}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-sm">GPS Coordinates</span>
                    <Badge variant="outline" className="text-xs">Optional</Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="ml-auto h-7 gap-1.5 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
                      onClick={handleGetGps}
                      disabled={gpsLocating}
                      data-testid="button-get-gps"
                    >
                      <LocateFixed className={`h-3.5 w-3.5 ${gpsLocating ? "animate-pulse" : ""}`} />
                      {gpsLocating ? "Detecting…" : "Get GPS Location"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Map Latitude</label>
                      <Input
                        placeholder="e.g. 33.7294"
                        value={form.mapLatitude}
                        onChange={e => update("mapLatitude", e.target.value)}
                        data-testid="input-latitude"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Map Longitude</label>
                      <Input
                        placeholder="e.g. 73.0931"
                        value={form.mapLongitude}
                        onChange={e => update("mapLongitude", e.target.value)}
                        data-testid="input-longitude"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    Enter GPS coordinates manually or click "Get GPS Location" to auto-detect
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── INFRASTRUCTURE ─── */}
          <TabsContent value="infrastructure" className="mt-4 space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Server className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Infrastructure Details</CardTitle>
                    <CardDescription>Technical deployment and device information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Protocol Type</label>
                    <Select value={form.protocolType} onValueChange={v => update("protocolType", v)}>
                      <SelectTrigger data-testid="select-protocol"><SelectValue placeholder="Select protocol" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PPPoE">PPPoE</SelectItem>
                        <SelectItem value="Hotspot">Hotspot</SelectItem>
                        <SelectItem value="Static">Static IP</SelectItem>
                        <SelectItem value="DHCP">DHCP</SelectItem>
                        <SelectItem value="IPoE">IPoE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Connection Type</label>
                    <Select value={form.connectionType} onValueChange={v => update("connectionType", v)}>
                      <SelectTrigger data-testid="select-connection-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FTTH">FTTH (Fiber)</SelectItem>
                        <SelectItem value="Wireless">Wireless</SelectItem>
                        <SelectItem value="P2P">P2P</SelectItem>
                        <SelectItem value="DSL">DSL</SelectItem>
                        <SelectItem value="Cable">Cable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Device Type</label>
                    <Select value={form.device} onValueChange={v => update("device", v)}>
                      <SelectTrigger data-testid="select-device-type"><SelectValue placeholder="Select device" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ONT">ONT</SelectItem>
                        <SelectItem value="ONU">ONU</SelectItem>
                        <SelectItem value="Router">Router</SelectItem>
                        <SelectItem value="Modem">Modem</SelectItem>
                        <SelectItem value="AP">Access Point</SelectItem>
                        <SelectItem value="CPE">CPE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Device Model</label>
                    <Input
                      placeholder="e.g. Huawei HG8245H"
                      value={form.deviceModel}
                      onChange={e => update("deviceModel", e.target.value)}
                      data-testid="input-device-model"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Device Serial / MAC</label>
                    <div className="relative">
                      <Input
                        placeholder="Serial or AA:BB:CC:DD:EE:FF"
                        value={form.deviceMacSerial}
                        onChange={e => update("deviceMacSerial", e.target.value)}
                        data-testid="input-device-serial"
                        className={errors.deviceMacSerial ? "border-red-500" : ""}
                        maxLength={50}
                      />
                      {form.deviceMacSerial && form.deviceMacSerial.includes(":") && (
                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${validateMac(form.deviceMacSerial) ? "text-green-500" : "text-amber-500"}`}>
                          {validateMac(form.deviceMacSerial) ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        </div>
                      )}
                    </div>
                    {errors.deviceMacSerial && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.deviceMacSerial}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Device Owned By</label>
                    <Select value={form.deviceOwnedBy} onValueChange={v => update("deviceOwnedBy", v)}>
                      <SelectTrigger data-testid="select-device-owner"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Company">Company</SelectItem>
                        <SelectItem value="Customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Cable Required (Meters)</label>
                    <Input
                      type="number"
                      placeholder="e.g. 50"
                      value={form.cableRequirement}
                      onChange={e => update("cableRequirement", e.target.value)}
                      data-testid="input-cable"
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-sm">Fiber Mapping</span>
                    <Badge variant="outline" className="text-xs">FTTH Only</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Fiber Code</label>
                      <Input
                        placeholder="e.g. F-001"
                        value={form.fiberCode}
                        onChange={e => update("fiberCode", e.target.value)}
                        data-testid="input-fiber-code"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Fiber Core Number</label>
                      <Input
                        placeholder="e.g. 12"
                        value={form.numberOfCore}
                        onChange={e => update("numberOfCore", e.target.value)}
                        data-testid="input-core-number"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Fiber Core Color</label>
                      <Select value={form.coreColor} onValueChange={v => update("coreColor", v)}>
                        <SelectTrigger data-testid="select-core-color"><SelectValue placeholder="Select color" /></SelectTrigger>
                        <SelectContent>
                          {["Blue", "Orange", "Green", "Brown", "Slate", "White", "Red", "Black", "Yellow", "Violet", "Rose", "Aqua"].map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── NOTIFICATIONS ─── */}
          <TabsContent value="notifications" className="mt-4 space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Notification Settings</CardTitle>
                    <CardDescription>Customer communication preferences</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: "smsMobile",         icon: Phone,     label: "Mobile SMS Notification",  desc: "Send billing and service alerts via SMS",           field: "smsMobile"         as const, color: "blue"   },
                  { id: "smsWhatsapp",       icon: Phone,     label: "WhatsApp Notification",     desc: "Send messages through WhatsApp channel",            field: "smsWhatsapp"       as const, color: "green"  },
                  { id: "emailNotif",        icon: Mail,      label: "Email Notification",        desc: "Send invoices and alerts via email",                field: "emailNotif"        as const, color: "indigo" },
                  { id: "inAppNotif",        icon: Bell,      label: "In-App Notification",       desc: "Push notifications in customer portal",             field: "inAppNotif"        as const, color: "purple" },
                  { id: "sendSmsToEmployee", icon: UserCheck, label: "Send SMS to Employee",      desc: "Notify assigned technician for updates",            field: "sendSmsToEmployee" as const, color: "amber"  },
                  { id: "sendGreetingSms",   icon: Mail,      label: "Send Greeting SMS",         desc: "Auto-send welcome / update message to customer",   field: "sendGreetingSms"   as const, color: "rose"   },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        form[item.field]
                          ? "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/10"
                          : "border-border bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                          form[item.field] ? "bg-blue-100 dark:bg-blue-900/30" : "bg-muted"
                        }`}>
                          <Icon className={`h-4 w-4 ${form[item.field] ? "text-blue-600" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={form[item.field]}
                        onCheckedChange={v => update(item.field, v)}
                        data-testid={`switch-${item.id}`}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ─── STICKY FOOTER ─── */}
        <div className="sticky bottom-4 z-20">
          <div className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-md rounded-2xl border border-border/60 shadow-xl p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {!isFirstTab && (
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab(tabItems[tabIndex - 1].id)}
                    className="gap-2"
                    data-testid="button-prev-tab"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                )}
                {!isLastTab && (
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab(tabItems[tabIndex + 1].id)}
                    className="gap-2"
                    data-testid="button-next-tab"
                  >
                    Next
                    <ChevronLeft className="h-4 w-4 rotate-180" />
                  </Button>
                )}
                <div className="text-xs text-muted-foreground hidden sm:block">
                  Step {tabIndex + 1} of {tabItems.length} — {tabItems[tabIndex].label}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button
                  variant="outline"
                  onClick={() => setLocation(`/customers/${customerId}`)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  data-testid="button-update-customer"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md gap-2"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Update Customer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
