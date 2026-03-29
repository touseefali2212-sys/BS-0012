import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  User, Wifi, FileText, MapPin, CreditCard, Globe, Tag,
  ChevronLeft, Upload, Check, Eye, EyeOff, RefreshCw,
  Camera, Phone, Mail, Shield, Building2, X,
  CheckCircle2, Trash2, Plus, ScrollText, Network,
  Wallet, Store, Image, AlertCircle, LocateFixed,
  CalendarClock, Settings, DollarSign, Briefcase, Sparkles, Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Vendor } from "@shared/schema";

type Package = { id: number; name: string; speed?: string; dataLimit?: string; vendorId?: number; price?: string; billingCycle?: string };
type ResellerType = { id: number; key: string; label: string; defaultCommissionRate?: string };

const tabItems = [
  { id: "basic",     label: "Basic Info",         icon: User },
  { id: "network",   label: "Network & Service",  icon: Wifi },
  { id: "packages",  label: "Packages",           icon: Tag },
  { id: "panels",    label: "Vendor Panels",      icon: Globe },
  { id: "billing",   label: "Billing & Finance",  icon: CreditCard },
  { id: "agreement", label: "Agreement",          icon: ScrollText },
  { id: "documents", label: "Documents",          icon: Image },
];

function SectionHeader({ icon: Icon, title, description }: { icon: any; title: string; description?: string }) {
  return (
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
      </div>
    </CardHeader>
  );
}

function FieldGroup({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div className={`grid gap-4 ${cols === 1 ? "" : cols === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
      {children}
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
    </div>
  );
}

function FileUploadPreview({ label, required, value, onChange, testId }: {
  label: string; required?: boolean; value: string; onChange: (url: string) => void; testId: string;
}) {
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
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden ${
          value ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-border hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/10"
        }`}
        onClick={() => inputRef.current?.click()}
        data-testid={testId}
      >
        <input ref={inputRef} type="file" className="hidden" accept="image/*,.pdf" onChange={handleUpload} disabled={uploading} />
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
            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); onChange(""); }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">{uploading ? "Uploading..." : "Click to upload"}</p>
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
    } catch { onChange(""); }
    finally { setUploading(false); }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative h-28 w-28 rounded-full border-4 border-blue-200 dark:border-blue-800 overflow-hidden cursor-pointer group bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center"
        onClick={() => inputRef.current?.click()}
        data-testid="upload-reseller-profile-photo"
      >
        {value ? (
          <img src={value} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <Store className="h-12 w-12 text-blue-300" />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="h-6 w-6 text-white" />
        </div>
        <input ref={inputRef} type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
      </div>
      <p className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Click to upload logo / photo"}</p>
    </div>
  );
}

export default function AddResellerPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic");
  const [showPassword, setShowPassword] = useState(false);
  const [showVpPassword, setShowVpPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gpsLocating, setGpsLocating] = useState(false);

  const fromQueryId = new URLSearchParams(window.location.search).get("fromQuery");
  const { data: fromQueryData } = useQuery<any>({
    queryKey: ["/api/customer-queries", fromQueryId],
    enabled: !!fromQueryId,
  });

  const { data: vendors } = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });
  const { data: packagesList } = useQuery<Package[]>({ queryKey: ["/api/packages"] });
  const { data: resellerTypesList } = useQuery<ResellerType[]>({ queryKey: ["/api/reseller-types"] });

  const [form, setForm] = useState({
    // Basic Info
    name: "", companyName: "", contactName: "", resellerType: "authorized_dealer",
    gender: "", occupation: "", dateOfBirth: "", fatherName: "",
    cnic: "", ntn: "", registrationFormNo: "",
    status: "active", joinDate: new Date().toISOString().split("T")[0],
    supportLevel: "standard", maxCustomerLimit: "0",
    notes: "", profilePicture: "", branch: "",
    // Contact & Location
    phone: "", secondaryPhone: "", email: "",
    address: "", city: "", area: "", territory: "",
    mapLatitude: "", mapLongitude: "",
    // Network & Service
    uplinkType: "", uplink: "", exchangeTowerPopName: "",
    portId: "", vlanId: "", media: "", connectionType: "",
    bandwidthPlan: "", ipAssignment: "dynamic", nasId: "", serviceZone: "",
    vlanIdAllowed: false, vlanIdNote: "",
    // Vendor Panels
    vendorPanelAllowed: false,
    // Billing & Finance
    walletBalance: "0", creditLimit: "0", securityDeposit: "0",
    openingBalance: "0", billingCycle: "monthly", paymentMethod: "cash",
    bankName: "", bankAccountTitle: "", bankAccountNumber: "", bankBranchCode: "",
    // Commission
    commissionRate: "10", commissionPaymentMethod: "wallet",
    commissionPaymentFrequency: "monthly",
    // Agreement
    agreementType: "standard", agreementStartDate: "", agreementEndDate: "", autoRenewal: false,
    // Documents
    cnicPicture: "", registrationFormPicture: "",
  });

  const update = (field: string, value: string | boolean | number) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const [addedPackages, setAddedPackages] = useState<Array<{
    packageId: number; packageName: string; speed: string;
    vendorId: string; vendorPrice: string; resellerPrice: string; profit: string;
  }>>([]);
  const [pkgForm, setPkgForm] = useState({ packageId: "", vendorId: "", vendorPrice: "0", resellerPrice: "0" });
  const pkgProfit = (parseFloat(pkgForm.resellerPrice || "0") - parseFloat(pkgForm.vendorPrice || "0")).toFixed(2);

  const [addedVendorPanels, setAddedVendorPanels] = useState<Array<{
    vendorId: string; vendorName: string; panelUrl: string; panelUsername: string; panelPassword: string;
  }>>([]);
  const [vpForm, setVpForm] = useState({ vendorId: "", panelUrl: "", panelUsername: "", panelPassword: "" });

  // Pre-fill from client request
  useEffect(() => {
    if (!fromQueryData) return;
    const q = fromQueryData;
    setForm(prev => ({
      ...prev,
      name: q.name || prev.name,
      phone: q.phone || prev.phone,
      email: q.email || prev.email,
      address: q.address || prev.address,
      city: q.city || prev.city,
      area: q.area || prev.area,
      fatherName: q.fatherName || prev.fatherName,
      gender: q.gender || prev.gender,
      cnic: q.nidNumber || prev.cnic,
      notes: q.remarks || prev.notes,
    }));
  }, [fromQueryData]);

  // Auto-fill commission rate from reseller type
  useEffect(() => {
    if (!resellerTypesList || !form.resellerType) return;
    const rt = resellerTypesList.find(r => r.key === form.resellerType);
    if (rt?.defaultCommissionRate) update("commissionRate", rt.defaultCommissionRate);
  }, [form.resellerType, resellerTypesList]);

  const GPS = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    setGpsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update("mapLatitude", String(pos.coords.latitude));
        update("mapLongitude", String(pos.coords.longitude));
        setGpsLocating(false);
        toast({ title: "Location detected", description: `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}` });
      },
      (err) => { setGpsLocating(false); toast({ title: "GPS error", description: err.message, variant: "destructive" }); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name || form.name.trim().length < 2) errs.name = "Reseller name must be at least 2 characters";
    if (!form.phone || form.phone.trim().length < 10) errs.phone = "Valid mobile number required";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Valid email address required";
    if (!form.cnic || form.cnic.trim().length < 5) errs.cnic = "CNIC / NID is required";
    if (!form.branch || form.branch.trim().length < 1) errs.branch = "Branch is required";
    if (!form.area || form.area.trim().length < 1) errs.area = "Area is required";
    if (!form.city || form.city.trim().length < 1) errs.city = "City is required";
    if (!form.address || form.address.trim().length < 5) errs.address = "Full address is required";
    setErrors(errs);
    if (Object.keys(errs).length > 0) setActiveTab("basic");
    return Object.keys(errs).length === 0;
  };

  // Missing fields tracker per tab for sidebar indicators
  const missingByTab: Record<string, string[]> = { "Basic Info": [] };
  if (!form.name || form.name.trim().length < 2) missingByTab["Basic Info"].push("Reseller Name");
  if (!form.phone || form.phone.trim().length < 10) missingByTab["Basic Info"].push("Mobile No");
  if (!form.email) missingByTab["Basic Info"].push("Email");
  if (!form.cnic) missingByTab["Basic Info"].push("CNIC/NID");
  if (!form.branch) missingByTab["Basic Info"].push("Branch");
  if (!form.city) missingByTab["Basic Info"].push("City");
  if (!form.area) missingByTab["Basic Info"].push("Area");
  if (!form.address) missingByTab["Basic Info"].push("Address");

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name, companyName: form.companyName || null,
        contactName: form.contactName, resellerType: form.resellerType,
        gender: form.gender || null, occupation: form.occupation || null,
        dateOfBirth: form.dateOfBirth || null, fatherName: form.fatherName || null,
        cnic: form.cnic || null, ntn: form.ntn || null,
        registrationFormNo: form.registrationFormNo || null,
        status: form.status, joinDate: form.joinDate || null,
        supportLevel: form.supportLevel,
        maxCustomerLimit: parseInt(form.maxCustomerLimit) || 0,
        notes: form.notes || null, profilePicture: form.profilePicture || null,
        branch: form.branch || null,
        phone: form.phone, secondaryPhone: form.secondaryPhone || null,
        email: form.email || null, address: form.address || null,
        city: form.city || null, area: form.area || null, territory: form.territory || null,
        uplinkType: form.uplinkType || null, uplink: form.uplink || null,
        exchangeTowerPopName: form.exchangeTowerPopName || null,
        portId: form.portId || null, vlanId: form.vlanId || null,
        media: form.media || null, connectionType: form.connectionType || null,
        bandwidthPlan: form.bandwidthPlan || null,
        ipAssignment: form.ipAssignment, nasId: form.nasId || null,
        serviceZone: form.serviceZone || null,
        vlanIdAllowed: form.vlanIdAllowed, vlanIdNote: form.vlanIdNote || null,
        vendorPanelAllowed: form.vendorPanelAllowed,
        assignedVendorPanels: addedVendorPanels.length > 0 ? JSON.stringify(addedVendorPanels) : null,
        walletBalance: form.walletBalance, creditLimit: form.creditLimit,
        securityDeposit: form.securityDeposit, openingBalance: form.openingBalance,
        billingCycle: form.billingCycle, paymentMethod: form.paymentMethod,
        bankName: form.bankName || null, bankAccountTitle: form.bankAccountTitle || null,
        bankAccountNumber: form.bankAccountNumber || null, bankBranchCode: form.bankBranchCode || null,
        commissionRate: form.commissionRate,
        commissionPaymentMethod: form.commissionPaymentMethod,
        commissionPaymentFrequency: form.commissionPaymentFrequency,
        agreementType: form.agreementType,
        agreementStartDate: form.agreementStartDate || null,
        agreementEndDate: form.agreementEndDate || null,
        autoRenewal: form.autoRenewal,
        assignedPackages: addedPackages.length > 0
          ? addedPackages.map(p => p.packageId).join(",")
          : null,
        cnicPicture: form.cnicPicture || null,
        registrationFormPicture: form.registrationFormPicture || null,
      };
      const res = await apiRequest("POST", "/api/resellers", payload);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Reseller created successfully", description: `${form.name} has been added.` });
      if (fromQueryId) {
        apiRequest("POST", `/api/customer-queries/${fromQueryId}/convert`, { customerId: data.id }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["/api/customer-queries"] });
      }
      setLocation("/resellers");
    },
    onError: (error: Error) => {
      toast({ title: "Error creating reseller", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!validate()) return;
    createMutation.mutate();
  };

  const handleAddPackage = () => {
    if (!pkgForm.packageId) return;
    const pkg = (packagesList || []).find(p => String(p.id) === pkgForm.packageId);
    if (!pkg) return;
    if (addedPackages.some(p => p.packageId === pkg.id)) {
      toast({ title: "Package already added", variant: "destructive" }); return;
    }
    const vendor = (vendors || []).find(v => String(v.id) === pkgForm.vendorId);
    setAddedPackages(prev => [...prev, {
      packageId: pkg.id, packageName: pkg.name,
      speed: pkg.speed || "", vendorId: pkgForm.vendorId,
      vendorPrice: pkgForm.vendorPrice, resellerPrice: pkgForm.resellerPrice,
      profit: pkgProfit,
    }]);
    setPkgForm({ packageId: "", vendorId: "", vendorPrice: "0", resellerPrice: "0" });
  };

  const handleAddVendorPanel = () => {
    if (!vpForm.vendorId || !vpForm.panelUrl) return;
    const vendor = (vendors || []).find(v => String(v.id) === vpForm.vendorId);
    setAddedVendorPanels(prev => [...prev, {
      vendorId: vpForm.vendorId,
      vendorName: vendor?.name || "",
      panelUrl: vpForm.panelUrl,
      panelUsername: vpForm.panelUsername,
      panelPassword: vpForm.panelPassword,
    }]);
    setVpForm({ vendorId: "", panelUrl: "", panelUsername: "", panelPassword: "" });
  };

  const totalMissingRequired = Object.values(missingByTab).flat().length;

  const tabIndex = tabItems.findIndex(t => t.id === activeTab);
  const isLastTab = tabIndex === tabItems.length - 1;
  const isFirstTab = tabIndex === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-blue-950/10 dark:to-indigo-950/10">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Page header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/resellers")}
            className="gap-2 text-muted-foreground hover:text-foreground"
            data-testid="button-back-to-resellers"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Resellers
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <Handshake className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Add New Reseller</h1>
              <p className="text-xs text-muted-foreground">Complete all sections for full reseller profile</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {totalMissingRequired > 0 && (
              <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs gap-1">
                <AlertCircle className="h-3 w-3" />
                {totalMissingRequired} required field{totalMissingRequired !== 1 ? "s" : ""} missing
              </Badge>
            )}
            <Button
              type="button" variant="ghost" size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setForm(prev => ({ ...prev, name: "", contactName: "", phone: "", email: "" }));
                setAddedPackages([]);
                setAddedVendorPanels([]);
                setErrors({});
              }}
              data-testid="button-reset-reseller"
            >
              <RefreshCw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </div>

        {/* From query conversion banner */}
        {fromQueryId && fromQueryData && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>Converting client request <strong>#{fromQueryId}</strong> — <strong>{fromQueryData.name}</strong>. Review the details below and save to complete the conversion.</span>
          </div>
        )}

        {/* Horizontal step buttons */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md rounded-2xl border border-border/60 shadow-sm p-1.5">
          <div className="w-full flex gap-1 flex-wrap">
            {tabItems.map((tab, i) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isComplete = i < tabIndex;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`tab-${tab.id}`}
                  className={`flex-1 min-w-fit flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md"
                      : isComplete
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

            {/* ── BASIC INFO ── */}
            {activeTab === "basic" && (
              <div className="space-y-5">
                {/* Personal Info */}
                <Card>
                  <SectionHeader icon={User} title="Personal Info" description="Reseller profile photo, identity and contact details" />
                  <CardContent className="space-y-5">

                    {/* Profile Photo */}
                    <div className="flex justify-center">
                      <ProfilePhotoUpload
                        value={form.profilePicture}
                        onChange={(url) => update("profilePicture", url)}
                      />
                    </div>

                    <Separator />

                    {/* Row 1: Company Name | Reseller Name */}
                    <FieldGroup>
                      <Field label="Company Name">
                        <Input
                          value={form.companyName}
                          onChange={e => update("companyName", e.target.value)}
                          placeholder="e.g. SpeedNet Solutions Pvt. Ltd."
                          data-testid="input-company-name"
                        />
                      </Field>
                      <Field label="Reseller Name" required error={errors.name}>
                        <Input
                          value={form.name}
                          onChange={e => update("name", e.target.value)}
                          placeholder="Full name of the reseller"
                          data-testid="input-reseller-name"
                          className={errors.name ? "border-red-500" : ""}
                        />
                      </Field>
                    </FieldGroup>

                    {/* Row 2: Father Name | Mobile No */}
                    <FieldGroup>
                      <Field label="Father Name">
                        <Input
                          value={form.fatherName}
                          onChange={e => update("fatherName", e.target.value)}
                          placeholder="Father's full name"
                          data-testid="input-father-name"
                        />
                      </Field>
                      <Field label="Mobile No" required error={errors.phone}>
                        <Input
                          value={form.phone}
                          onChange={e => update("phone", e.target.value)}
                          placeholder="03XX-XXXXXXX"
                          data-testid="input-phone"
                          className={errors.phone ? "border-red-500" : ""}
                        />
                      </Field>
                    </FieldGroup>

                    {/* Row 3: Phone No | Email */}
                    <FieldGroup>
                      <Field label="Phone No">
                        <Input
                          value={form.secondaryPhone}
                          onChange={e => update("secondaryPhone", e.target.value)}
                          placeholder="Alternate / landline number"
                          data-testid="input-secondary-phone"
                        />
                      </Field>
                      <Field label="Email" required error={errors.email}>
                        <Input
                          type="email"
                          value={form.email}
                          onChange={e => update("email", e.target.value)}
                          placeholder="reseller@company.pk"
                          data-testid="input-email"
                          className={errors.email ? "border-red-500" : ""}
                        />
                      </Field>
                    </FieldGroup>

                    {/* Row 4: CNIC/NID | Branch */}
                    <FieldGroup>
                      <Field label="CNIC / NID" required error={errors.cnic}>
                        <Input
                          value={form.cnic}
                          onChange={e => update("cnic", e.target.value)}
                          placeholder="XXXXX-XXXXXXX-X"
                          data-testid="input-cnic"
                          className={errors.cnic ? "border-red-500" : ""}
                        />
                      </Field>
                      <Field label="Branch" required error={errors.branch}>
                        <Input
                          value={form.branch}
                          onChange={e => update("branch", e.target.value)}
                          placeholder="e.g. Main Branch, Lahore"
                          data-testid="input-branch"
                          className={errors.branch ? "border-red-500" : ""}
                        />
                      </Field>
                    </FieldGroup>

                    {/* Row 5: Area | City */}
                    <FieldGroup>
                      <Field label="Area" required error={errors.area}>
                        <Input
                          value={form.area}
                          onChange={e => update("area", e.target.value)}
                          placeholder="e.g. Gulberg, DHA"
                          data-testid="input-area"
                          className={errors.area ? "border-red-500" : ""}
                        />
                      </Field>
                      <Field label="City" required error={errors.city}>
                        <Input
                          value={form.city}
                          onChange={e => update("city", e.target.value)}
                          placeholder="e.g. Lahore, Karachi"
                          data-testid="input-city"
                          className={errors.city ? "border-red-500" : ""}
                        />
                      </Field>
                    </FieldGroup>

                    {/* Address */}
                    <Field label="Address" required error={errors.address}>
                      <Textarea
                        value={form.address}
                        onChange={e => update("address", e.target.value)}
                        placeholder="Street, block, building, landmark..."
                        className={`min-h-[80px] ${errors.address ? "border-red-500" : ""}`}
                        data-testid="input-address"
                      />
                    </Field>

                    {/* GPS Coordinates */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">GPS Coordinates</p>
                        <Button
                          type="button" variant="outline" size="sm"
                          onClick={GPS} disabled={gpsLocating}
                          data-testid="button-get-gps"
                          className="gap-1.5"
                        >
                          <LocateFixed className="h-3.5 w-3.5" />
                          {gpsLocating ? "Detecting..." : "Detect My Location"}
                        </Button>
                      </div>
                      <FieldGroup>
                        <Field label="Latitude">
                          <Input value={form.mapLatitude} onChange={e => update("mapLatitude", e.target.value)} placeholder="e.g. 31.5204" data-testid="input-latitude" />
                        </Field>
                        <Field label="Longitude">
                          <Input value={form.mapLongitude} onChange={e => update("mapLongitude", e.target.value)} placeholder="e.g. 74.3587" data-testid="input-longitude" />
                        </Field>
                      </FieldGroup>
                    </div>

                    <Separator />

                    {/* Note / Remarks */}
                    <Field label="NOTE / Remarks">
                      <Textarea
                        value={form.notes}
                        onChange={e => update("notes", e.target.value)}
                        placeholder="Internal notes or remarks about this reseller..."
                        className="min-h-[80px]"
                        data-testid="input-notes"
                      />
                    </Field>

                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── NETWORK & SERVICE ── */}
            {activeTab === "network" && (
              <div className="space-y-5">
                <Card>
                  <SectionHeader icon={Network} title="Uplink & Connectivity" description="Network uplink type and connection details" />
                  <CardContent className="space-y-4">
                    <FieldGroup>
                      <Field label="Uplink Type">
                        <Select value={form.uplinkType || ""} onValueChange={v => update("uplinkType", v)}>
                          <SelectTrigger data-testid="select-uplink-type"><SelectValue placeholder="Select uplink type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fiber">Fiber</SelectItem>
                            <SelectItem value="wireless">Wireless</SelectItem>
                            <SelectItem value="coaxial">Coaxial</SelectItem>
                            <SelectItem value="ethernet">Ethernet</SelectItem>
                            <SelectItem value="dsl">DSL</SelectItem>
                            <SelectItem value="leased_line">Leased Line</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Uplink / Media Name">
                        <Input value={form.uplink} onChange={e => update("uplink", e.target.value)} placeholder="e.g. FiberLink-Main" data-testid="input-uplink" />
                      </Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field label="Exchange / Tower / POP Name">
                        <Input value={form.exchangeTowerPopName} onChange={e => update("exchangeTowerPopName", e.target.value)} placeholder="Exchange or POP name" data-testid="input-exchange" />
                      </Field>
                      <Field label="Port ID">
                        <Input value={form.portId} onChange={e => update("portId", e.target.value)} placeholder="Port identifier" data-testid="input-port-id" />
                      </Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field label="Media Type">
                        <Select value={form.media || ""} onValueChange={v => update("media", v)}>
                          <SelectTrigger data-testid="select-media"><SelectValue placeholder="Select media" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single_mode">Single Mode Fiber</SelectItem>
                            <SelectItem value="multi_mode">Multi Mode Fiber</SelectItem>
                            <SelectItem value="cat6">CAT6 Ethernet</SelectItem>
                            <SelectItem value="coaxial">Coaxial Cable</SelectItem>
                            <SelectItem value="wireless_5ghz">Wireless 5GHz</SelectItem>
                            <SelectItem value="wireless_2ghz">Wireless 2.4GHz</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Connection Type">
                        <Select value={form.connectionType || ""} onValueChange={v => update("connectionType", v)}>
                          <SelectTrigger data-testid="select-connection-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FTTH">FTTH</SelectItem>
                            <SelectItem value="FTTB">FTTB</SelectItem>
                            <SelectItem value="wireless">Wireless</SelectItem>
                            <SelectItem value="leased_line">Leased Line</SelectItem>
                            <SelectItem value="vsat">VSAT</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── PACKAGES ── */}
            {activeTab === "packages" && (
              <div className="space-y-5">
                <Card>
                  <SectionHeader icon={Tag} title="Assign Packages" description="Internet packages and reseller pricing tiers" />
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Select Package">
                        <Select value={pkgForm.packageId} onValueChange={v => {
                          const pkg = (packagesList || []).find(p => String(p.id) === v);
                          setPkgForm(prev => ({
                            ...prev, packageId: v,
                            resellerPrice: pkg?.price || "0",
                          }));
                        }}>
                          <SelectTrigger data-testid="select-package"><SelectValue placeholder="Choose package" /></SelectTrigger>
                          <SelectContent>
                            {(packagesList || []).map(p => (
                              <SelectItem key={p.id} value={String(p.id)}>
                                {p.name} {p.speed ? `— ${p.speed}` : ""} {p.price ? `(Rs. ${p.price})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Vendor">
                        <Select value={pkgForm.vendorId} onValueChange={v => setPkgForm(prev => ({ ...prev, vendorId: v }))}>
                          <SelectTrigger data-testid="select-package-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                          <SelectContent>
                            {(vendors || []).map(v => (
                              <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <Field label="Vendor Price (Rs.)">
                        <Input
                          type="number" min="0" step="0.01"
                          value={pkgForm.vendorPrice}
                          onChange={e => setPkgForm(prev => ({ ...prev, vendorPrice: e.target.value }))}
                          data-testid="input-vendor-price"
                        />
                      </Field>
                      <Field label="Reseller Price (Rs.)">
                        <Input
                          type="number" min="0" step="0.01"
                          value={pkgForm.resellerPrice}
                          onChange={e => setPkgForm(prev => ({ ...prev, resellerPrice: e.target.value }))}
                          data-testid="input-reseller-price"
                        />
                      </Field>
                      <Field label="Profit (Rs.)">
                        <div className={`flex items-center h-10 px-3 rounded-md border bg-muted text-sm font-mono ${parseFloat(pkgProfit) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          Rs. {pkgProfit}
                        </div>
                      </Field>
                    </div>
                    <Button type="button" onClick={handleAddPackage} disabled={!pkgForm.packageId} data-testid="button-add-package">
                      <Plus className="h-4 w-4 mr-1" /> Add Package
                    </Button>

                    {addedPackages.length > 0 && (
                      <div className="border rounded-lg overflow-hidden mt-2">
                        <div className="px-3 py-2 bg-[#1a3a5c] text-white text-xs font-semibold uppercase tracking-wide grid grid-cols-5 gap-2">
                          <span className="col-span-2">Package</span>
                          <span>Vendor Price</span>
                          <span>Reseller Price</span>
                          <span>Action</span>
                        </div>
                        {addedPackages.map((p, i) => (
                          <div key={i} className="px-3 py-2.5 border-t text-sm grid grid-cols-5 gap-2 items-center">
                            <div className="col-span-2">
                              <p className="font-medium">{p.packageName}</p>
                              {p.speed && <p className="text-xs text-muted-foreground">{p.speed}</p>}
                            </div>
                            <span>Rs. {p.vendorPrice}</span>
                            <span>Rs. {p.resellerPrice}</span>
                            <Button
                              type="button" variant="ghost" size="sm"
                              onClick={() => setAddedPackages(prev => prev.filter((_, j) => j !== i))}
                              data-testid={`button-remove-package-${i}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── VENDOR PANELS ── */}
            {activeTab === "panels" && (
              <div className="space-y-5">
                <Card>
                  <SectionHeader icon={Globe} title="Vendor Panel Access" description="External vendor portals and panel credentials" />
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">Allow Vendor Panel Access</p>
                        <p className="text-xs text-muted-foreground">Grant this reseller access to vendor management panels</p>
                      </div>
                      <Switch
                        checked={form.vendorPanelAllowed}
                        onCheckedChange={v => update("vendorPanelAllowed", v)}
                        data-testid="switch-vendor-panel-allowed"
                      />
                    </div>

                    {form.vendorPanelAllowed && (
                      <>
                        <Separator />
                        <p className="text-sm font-medium">Add Vendor Panel</p>
                        <FieldGroup>
                          <Field label="Vendor">
                            <Select value={vpForm.vendorId} onValueChange={v => setVpForm(prev => ({ ...prev, vendorId: v }))}>
                              <SelectTrigger data-testid="select-vp-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                              <SelectContent>
                                {(vendors || []).map(v => (
                                  <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field label="Panel URL">
                            <Input
                              value={vpForm.panelUrl}
                              onChange={e => setVpForm(prev => ({ ...prev, panelUrl: e.target.value }))}
                              placeholder="https://panel.vendor.com"
                              data-testid="input-panel-url"
                            />
                          </Field>
                        </FieldGroup>
                        <FieldGroup>
                          <Field label="Panel Username">
                            <Input
                              value={vpForm.panelUsername}
                              onChange={e => setVpForm(prev => ({ ...prev, panelUsername: e.target.value }))}
                              placeholder="Login username"
                              data-testid="input-panel-username"
                            />
                          </Field>
                          <Field label="Panel Password">
                            <div className="relative">
                              <Input
                                type={showVpPassword ? "text" : "password"}
                                value={vpForm.panelPassword}
                                onChange={e => setVpForm(prev => ({ ...prev, panelPassword: e.target.value }))}
                                placeholder="Login password"
                                data-testid="input-panel-password"
                                className="pr-10"
                              />
                              <button type="button" onClick={() => setShowVpPassword(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showVpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </Field>
                        </FieldGroup>
                        <Button type="button" onClick={handleAddVendorPanel} disabled={!vpForm.vendorId || !vpForm.panelUrl} data-testid="button-add-vendor-panel">
                          <Plus className="h-4 w-4 mr-1" /> Add Panel
                        </Button>

                        {addedVendorPanels.length > 0 && (
                          <div className="border rounded-lg overflow-hidden">
                            <div className="px-3 py-2 bg-[#1a3a5c] text-white text-xs font-semibold uppercase tracking-wide grid grid-cols-4 gap-2">
                              <span>Vendor</span>
                              <span className="col-span-2">Panel URL</span>
                              <span>Action</span>
                            </div>
                            {addedVendorPanels.map((vp, i) => (
                              <div key={i} className="px-3 py-2.5 border-t text-sm grid grid-cols-4 gap-2 items-center">
                                <span className="font-medium">{vp.vendorName}</span>
                                <span className="col-span-2 text-blue-600 dark:text-blue-400 truncate">{vp.panelUrl}</span>
                                <Button
                                  type="button" variant="ghost" size="sm"
                                  onClick={() => setAddedVendorPanels(prev => prev.filter((_, j) => j !== i))}
                                  data-testid={`button-remove-panel-${i}`}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── BILLING & FINANCE ── */}
            {activeTab === "billing" && (
              <div className="space-y-5">
                <Card>
                  <SectionHeader icon={Wallet} title="Wallet & Credit" description="Balance, credit limit and security deposit" />
                  <CardContent className="space-y-4">
                    <FieldGroup cols={3}>
                      <Field label="Initial Wallet Balance (Rs.)">
                        <Input type="number" min="0" step="0.01" value={form.walletBalance} onChange={e => update("walletBalance", e.target.value)} data-testid="input-wallet-balance" />
                      </Field>
                      <Field label="Credit Limit (Rs.)">
                        <Input type="number" min="0" step="0.01" value={form.creditLimit} onChange={e => update("creditLimit", e.target.value)} data-testid="input-credit-limit" />
                      </Field>
                      <Field label="Security Deposit (Rs.)">
                        <Input type="number" min="0" step="0.01" value={form.securityDeposit} onChange={e => update("securityDeposit", e.target.value)} data-testid="input-security-deposit" />
                      </Field>
                    </FieldGroup>
                    <Field label="Opening Balance (Rs.)">
                      <Input type="number" step="0.01" value={form.openingBalance} onChange={e => update("openingBalance", e.target.value)} data-testid="input-opening-balance" />
                    </Field>
                  </CardContent>
                </Card>

                <Card>
                  <SectionHeader icon={CreditCard} title="Billing Settings" description="Billing cycle and payment preferences" />
                  <CardContent className="space-y-4">
                    <FieldGroup>
                      <Field label="Billing Cycle">
                        <Select value={form.billingCycle} onValueChange={v => update("billingCycle", v)}>
                          <SelectTrigger data-testid="select-billing-cycle"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Payment Method">
                        <Select value={form.paymentMethod} onValueChange={v => update("paymentMethod", v)}>
                          <SelectTrigger data-testid="select-payment-method"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="online">Online Payment</SelectItem>
                            <SelectItem value="wallet">Wallet</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>
                  </CardContent>
                </Card>

                <Card>
                  <SectionHeader icon={Building2} title="Bank Account Details" description="Banking information for commission payments" />
                  <CardContent className="space-y-4">
                    <FieldGroup>
                      <Field label="Bank Name">
                        <Input value={form.bankName} onChange={e => update("bankName", e.target.value)} placeholder="e.g. HBL, UBL, MCB" data-testid="input-bank-name" />
                      </Field>
                      <Field label="Account Title">
                        <Input value={form.bankAccountTitle} onChange={e => update("bankAccountTitle", e.target.value)} placeholder="Account holder name" data-testid="input-bank-title" />
                      </Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field label="Account Number">
                        <Input value={form.bankAccountNumber} onChange={e => update("bankAccountNumber", e.target.value)} placeholder="Bank account number" data-testid="input-bank-account" />
                      </Field>
                      <Field label="Branch Code / IBAN">
                        <Input value={form.bankBranchCode} onChange={e => update("bankBranchCode", e.target.value)} placeholder="Branch code or IBAN" data-testid="input-branch-code" />
                      </Field>
                    </FieldGroup>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── AGREEMENT ── */}
            {activeTab === "agreement" && (
              <div className="space-y-5">
                <Card>
                  <SectionHeader icon={ScrollText} title="Agreement Details" description="Contract type, dates and renewal settings" />
                  <CardContent className="space-y-4">
                    <Field label="Agreement Type">
                      <Select value={form.agreementType} onValueChange={v => update("agreementType", v)}>
                        <SelectTrigger data-testid="select-agreement-type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard Agreement</SelectItem>
                          <SelectItem value="exclusive">Exclusive Territory Agreement</SelectItem>
                          <SelectItem value="franchise">Franchise Agreement</SelectItem>
                          <SelectItem value="white_label">White Label Agreement</SelectItem>
                          <SelectItem value="custom">Custom Agreement</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <FieldGroup>
                      <Field label="Agreement Start Date">
                        <Input type="date" value={form.agreementStartDate} onChange={e => update("agreementStartDate", e.target.value)} data-testid="input-agreement-start" />
                      </Field>
                      <Field label="Agreement End Date">
                        <Input type="date" value={form.agreementEndDate} onChange={e => update("agreementEndDate", e.target.value)} data-testid="input-agreement-end" />
                      </Field>
                    </FieldGroup>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">Auto-Renewal</p>
                        <p className="text-xs text-muted-foreground">Automatically renew agreement when it expires</p>
                      </div>
                      <Switch
                        checked={form.autoRenewal}
                        onCheckedChange={v => update("autoRenewal", v)}
                        data-testid="switch-auto-renewal"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Agreement Summary Card */}
                {(form.agreementType || form.agreementStartDate) && (
                  <Card>
                    <SectionHeader icon={CalendarClock} title="Agreement Summary" description="Visual overview of the configured agreement" />
                    <CardContent className="">
                      <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <ScrollText className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold text-blue-800 dark:text-blue-200">
                            {form.agreementType === "standard" ? "Standard Agreement" :
                             form.agreementType === "exclusive" ? "Exclusive Territory Agreement" :
                             form.agreementType === "franchise" ? "Franchise Agreement" :
                             form.agreementType === "white_label" ? "White Label Agreement" : "Custom Agreement"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {form.agreementStartDate && (
                            <div>
                              <p className="text-xs text-muted-foreground">Start Date</p>
                              <p className="font-medium">{new Date(form.agreementStartDate).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}</p>
                            </div>
                          )}
                          {form.agreementEndDate && (
                            <div>
                              <p className="text-xs text-muted-foreground">End Date</p>
                              <p className="font-medium">{new Date(form.agreementEndDate).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          {form.autoRenewal ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Auto-Renewal Enabled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Manual Renewal</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ── DOCUMENTS ── */}
            {activeTab === "documents" && (
              <div className="space-y-5">
                <Card>
                  <SectionHeader icon={Image} title="Document Uploads" description="Upload CNIC, registration and supporting documents" />
                  <CardContent className="space-y-4">
                    <FieldGroup>
                      <FileUploadPreview
                        label="CNIC / NID Front"
                        value={form.cnicPicture}
                        onChange={url => update("cnicPicture", url)}
                        testId="upload-cnic-front"
                      />
                      <FileUploadPreview
                        label="Registration Form"
                        value={form.registrationFormPicture}
                        onChange={url => update("registrationFormPicture", url)}
                        testId="upload-reg-form"
                      />
                    </FieldGroup>
                  </CardContent>
                </Card>

                <Card>
                  <SectionHeader icon={Shield} title="Document Requirements" description="Required documents checklist for reseller onboarding" />
                  <CardContent className="">
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {[
                        "CNIC must be valid and not expired",
                        "NTN certificate required for white-label and franchise resellers",
                        "Registration form must be signed and stamped by company authority",
                        "All documents should be clear scans or high-quality photos",
                        "PDF format accepted for contracts and agreements",
                      ].map((req, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

      {/* Sticky bottom action bar */}
      <div className="sticky bottom-4 z-20">
        <div className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-md rounded-2xl border border-border/60 shadow-xl p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                type="button" variant="outline"
                onClick={() => setLocation("/resellers")}
                data-testid="button-cancel-reseller"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Cancel
              </Button>
              {!isFirstTab && (
                <Button variant="outline" onClick={() => setActiveTab(tabItems[tabIndex - 1].id)} className="gap-2" data-testid="button-prev-tab">
                  <ChevronLeft className="h-4 w-4" />Previous
                </Button>
              )}
              {!isLastTab && (
                <Button variant="outline" onClick={() => setActiveTab(tabItems[tabIndex + 1].id)} className="gap-2" data-testid="button-next-tab">
                  Next<ChevronLeft className="h-4 w-4 rotate-180" />
                </Button>
              )}
              <div className="text-xs text-muted-foreground hidden sm:block">
                Step {tabIndex + 1} of {tabItems.length} — {tabItems[tabIndex].label}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                disabled={createMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 shadow-md"
                onClick={handleSave}
                data-testid="button-submit-reseller"
              >
                {createMutation.isPending ? "Saving..." : "Save Reseller"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
