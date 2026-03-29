import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User, Wifi, FileText, MapPin, CreditCard, Globe, Tag,
  ChevronLeft, Upload, Check, Eye, EyeOff, RefreshCw,
  Camera, Phone, Mail, Shield, Building2, Package, X,
  CheckCircle2, Trash2, Plus, ScrollText, Landmark, Network,
  Wallet, Percent, Store, Briefcase, Image, AlertCircle,
  KeyRound, CalendarClock, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertResellerSchema } from "@shared/schema";
import type { InsertReseller, Vendor } from "@shared/schema";
import { z } from "zod";

type Package = { id: number; name: string; speed?: string; dataLimit?: string; vendorId?: number; price?: string };

const resellerFormSchema = insertResellerSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number is required"),
});

const tabItems = [
  { id: "basic",      label: "Basic Info",          icon: User },
  { id: "contact",    label: "Contact & Location",  icon: Phone },
  { id: "network",    label: "Network & Service",   icon: Wifi },
  { id: "packages",   label: "Packages",            icon: Tag },
  { id: "panels",     label: "Vendor Panels",       icon: Globe },
  { id: "billing",    label: "Billing & Finance",   icon: CreditCard },
  { id: "agreement",  label: "Agreement",           icon: ScrollText },
  { id: "documents",  label: "Documents",           icon: Image },
];

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1c67d4] to-[#1a5bbf] text-white rounded-t-lg">
      <Icon className="h-4 w-4" />
      <span className="text-sm font-semibold tracking-wide uppercase">{title}</span>
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
    <div className="space-y-2">
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
        data-testid="upload-reseller-profile-photo"
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
      <p className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Click to upload photo"}</p>
    </div>
  );
}

const resellerDefaults: InsertReseller = {
  name: "", resellerType: "authorized_dealer", gender: "", occupation: "", dateOfBirth: "",
  fatherName: "", contactName: "", phone: "", secondaryPhone: "", email: "", cnic: "", ntn: "",
  registrationFormNo: "", address: "", city: "", area: "", territory: "",
  profilePicture: "", cnicPicture: "", registrationFormPicture: "",
  vendorId: undefined, packageId: undefined, assignedPackages: "",
  commissionRate: "10", commissionPaymentMethod: "wallet",
  commissionPaymentFrequency: "monthly", walletBalance: "0", creditLimit: "0",
  securityDeposit: "0", totalCustomers: 0, agreementStartDate: "", agreementEndDate: "",
  agreementType: "standard", autoRenewal: false,
  joinDate: "", uplinkType: "", uplink: "", exchangeTowerPopName: "", portId: "", vlanId: "",
  media: "", vendorPanelAllowed: false, panelUrl: "", panelUsername: "", panelPassword: "",
  assignedVendorPanels: "", vlanIdAllowed: false, vlanIdNote: "",
  connectionType: "", bandwidthPlan: "", ipAssignment: "dynamic", nasId: "", serviceZone: "",
  bankName: "", bankAccountTitle: "", bankAccountNumber: "", bankBranchCode: "",
  billingCycle: "monthly", paymentMethod: "cash", openingBalance: "0",
  supportLevel: "standard", maxCustomerLimit: 0, notes: "", status: "active",
};

export default function AddResellerPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic");
  const [showPassword, setShowPassword] = useState(false);

  const [addedPackages, setAddedPackages] = useState<Array<{
    packageId: number; packageName: string; speed: string; dataLimit: string;
    vendorId: string; vendorPrice: string; resellerPrice: string; profit: string;
  }>>([]);
  const [pkgForm, setPkgForm] = useState({ packageId: "", vendorId: "", vendorPrice: "0", resellerPrice: "0" });

  const [addedVendorPanels, setAddedVendorPanels] = useState<Array<{
    vendorId: number; vendorName: string; panelUrl: string; panelUsername: string; panelPassword: string;
  }>>([]);
  const [vpForm, setVpForm] = useState({ vendorId: "", panelUrl: "", panelUsername: "", panelPassword: "" });
  const [showVpPassword, setShowVpPassword] = useState(false);

  const fromQueryId = new URLSearchParams(window.location.search).get("fromQuery");
  const { data: fromQueryData } = useQuery<any>({
    queryKey: ["/api/customer-queries", fromQueryId],
    enabled: !!fromQueryId,
  });

  const { data: vendors } = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });
  const { data: packagesList } = useQuery<Package[]>({ queryKey: ["/api/packages"] });
  const { data: resellerTypesList } = useQuery<any[]>({ queryKey: ["/api/reseller-types"] });

  const form = useForm<InsertReseller>({
    resolver: zodResolver(resellerFormSchema),
    defaultValues: { ...resellerDefaults },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertReseller) => {
      const res = await apiRequest("POST", "/api/resellers", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Reseller created successfully" });
      if (fromQueryId) {
        apiRequest("POST", `/api/customer-queries/${fromQueryId}/convert`, { customerId: data.id }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["/api/customer-queries"] });
      }
      setLocation("/resellers");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Pre-fill from client request
  useEffect(() => {
    if (!fromQueryData) return;
    const q = fromQueryData;
    form.reset({
      ...resellerDefaults,
      name: q.name || "",
      phone: q.phone || "",
      email: q.email || "",
      address: q.address || "",
      city: q.city || "",
      area: q.area || "",
      fatherName: q.fatherName || "",
      gender: q.gender || "",
      cnic: q.nidNumber || "",
      notes: q.remarks || "",
    });
  }, [fromQueryData]);

  const selectedPkg = (packagesList || []).find(p => String(p.id) === pkgForm.packageId);
  const pkgProfit = (parseFloat(pkgForm.resellerPrice || "0") - parseFloat(pkgForm.vendorPrice || "0")).toFixed(2);

  const handleAddPackage = () => {
    if (!selectedPkg) return;
    if (addedPackages.some(p => p.packageId === selectedPkg.id)) return;
    const vendorName = (vendors || []).find(v => String(v.id) === pkgForm.vendorId)?.name || pkgForm.vendorId;
    setAddedPackages(prev => [...prev, {
      packageId: selectedPkg.id, packageName: selectedPkg.name,
      speed: selectedPkg.speed || "N/A", dataLimit: selectedPkg.dataLimit || "Unlimited",
      vendorId: vendorName, vendorPrice: pkgForm.vendorPrice || "0",
      resellerPrice: pkgForm.resellerPrice || "0", profit: pkgProfit,
    }]);
    const ids = [...addedPackages.map(p => p.packageId), selectedPkg.id].join(",");
    form.setValue("assignedPackages", ids);
    form.setValue("packageId", selectedPkg.id);
    setPkgForm({ packageId: "", vendorId: "", vendorPrice: "0", resellerPrice: "0" });
  };

  const handleRemovePackage = (pkgId: number) => {
    const updated = addedPackages.filter(p => p.packageId !== pkgId);
    setAddedPackages(updated);
    form.setValue("assignedPackages", updated.map(p => p.packageId).join(","));
  };

  const onSubmit = (data: InsertReseller) => {
    createMutation.mutate(data);
  };

  const w = form.watch;
  const vendorPanelAllowedVal = w("vendorPanelAllowed");
  const vlanIdAllowedVal = w("vlanIdAllowed");
  const autoRenewalVal = w("autoRenewal");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header bar */}
      <div className="sticky top-0 z-40 bg-[#1a2332] border-b border-[#243447] shadow-lg">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-white hover:text-white hover:bg-white/10"
              onClick={() => setLocation("/resellers")}
              data-testid="button-back-to-resellers"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Separator orientation="vertical" className="h-6 bg-white/20" />
            <div>
              <h1 className="text-lg font-bold text-white">Add New Reseller</h1>
              <p className="text-xs text-blue-200/70">Fill in reseller details across all sections</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => { form.reset(); setAddedPackages([]); setAddedVendorPanels([]); }}
              data-testid="button-reset-reseller-form"
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Reset
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow"
              onClick={() => form.handleSubmit(onSubmit)()}
              disabled={createMutation.isPending}
              data-testid="button-save-reseller"
            >
              {createMutation.isPending ? "Saving..." : "Save Reseller"}
            </Button>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 overflow-hidden">
          {/* Left sidebar */}
          <aside className="w-64 shrink-0 bg-gradient-to-b from-[#1a2332] to-[#243447] border-r border-[#2d3f55] flex flex-col">
            <div className="p-4 flex-1 overflow-y-auto">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-300/60 mb-3 px-2">Sections</p>
              <nav className="space-y-1">
                {tabItems.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      data-testid={`tab-${tab.id}`}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                          : "text-blue-100/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-blue-300/60"}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <div className="p-6 max-w-5xl space-y-6">

              {/* ── BASIC INFO ── */}
              {activeTab === "basic" && (
                <div className="space-y-5">
                  {/* Profile photo */}
                  <Card>
                    <SectionHeader icon={User} title="Profile Photo" />
                    <CardContent className="pt-6 flex items-center gap-6">
                      <ProfilePhotoUpload
                        value={w("profilePicture") || ""}
                        onChange={(url) => form.setValue("profilePicture", url)}
                      />
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">Reseller Profile Photo</p>
                        <p>Upload a clear headshot or company logo.</p>
                        <p>Supported: JPG, PNG — Max 5MB</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Personal details */}
                  <Card>
                    <SectionHeader icon={User} title="Personal Details" />
                    <CardContent className="pt-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                            <FormControl><Input placeholder="Enter full name" data-testid="input-reseller-name" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="contactName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person Name</FormLabel>
                            <FormControl><Input placeholder="Primary contact person" data-testid="input-reseller-contact-name" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="gender" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl><SelectTrigger data-testid="select-reseller-gender"><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl><Input type="date" data-testid="input-reseller-dob" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="occupation" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Occupation</FormLabel>
                            <FormControl><Input placeholder="e.g. Entrepreneur" data-testid="input-reseller-occupation" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="fatherName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Father Name</FormLabel>
                            <FormControl><Input placeholder="Father's full name" data-testid="input-reseller-father-name" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="cnic" render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNIC / National ID</FormLabel>
                            <FormControl><Input placeholder="XXXXX-XXXXXXX-X" data-testid="input-reseller-cnic" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="ntn" render={({ field }) => (
                          <FormItem>
                            <FormLabel>NTN (National Tax Number)</FormLabel>
                            <FormControl><Input placeholder="NTN number" data-testid="input-reseller-ntn" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="registrationFormNo" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registration Form No</FormLabel>
                            <FormControl><Input placeholder="Form number" data-testid="input-reseller-reg-form-no" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Business Settings */}
                  <Card>
                    <SectionHeader icon={Briefcase} title="Business Settings" />
                    <CardContent className="pt-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="resellerType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reseller Type <span className="text-red-500">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "authorized_dealer"}>
                              <FormControl><SelectTrigger data-testid="select-reseller-type"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="authorized_dealer">Authorized Dealer</SelectItem>
                                <SelectItem value="franchisee">Franchisee</SelectItem>
                                <SelectItem value="agent">Agent</SelectItem>
                                <SelectItem value="sub_reseller">Sub Reseller</SelectItem>
                                <SelectItem value="wholesaler">Wholesaler</SelectItem>
                                {(resellerTypesList || []).map(t => (
                                  <SelectItem key={t.id} value={t.key}>{t.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="status" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "active"}>
                              <FormControl><SelectTrigger data-testid="select-reseller-status"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                                <SelectItem value="blocked">Blocked</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="joinDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Join Date</FormLabel>
                            <FormControl><Input type="date" data-testid="input-reseller-join-date" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="supportLevel" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Support Level</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "standard"}>
                              <FormControl><SelectTrigger data-testid="select-reseller-support-level"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="dedicated">Dedicated</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="maxCustomerLimit" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Customer Limit</FormLabel>
                            <FormControl><Input type="number" min="0" placeholder="0 = unlimited" data-testid="input-reseller-max-customers" {...field} value={field.value ?? 0} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Remarks / Notes</FormLabel>
                          <FormControl><Textarea placeholder="Any special notes or remarks..." rows={3} data-testid="input-reseller-notes" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── CONTACT & LOCATION ── */}
              {activeTab === "contact" && (
                <div className="space-y-5">
                  <Card>
                    <SectionHeader icon={Phone} title="Contact Information" />
                    <CardContent className="pt-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Phone <span className="text-red-500">*</span></FormLabel>
                            <FormControl><Input placeholder="03XX-XXXXXXX" data-testid="input-reseller-phone" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="secondaryPhone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secondary Phone</FormLabel>
                            <FormControl><Input placeholder="Secondary number" data-testid="input-reseller-secondary-phone" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl><Input type="email" placeholder="reseller@email.com" data-testid="input-reseller-email" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>

                  <Card>
                    <SectionHeader icon={MapPin} title="Location Details" />
                    <CardContent className="pt-5 space-y-4">
                      <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Address</FormLabel>
                          <FormControl><Textarea placeholder="Complete address..." rows={2} data-testid="input-reseller-address" {...field} value={field.value || ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="city" render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl><Input placeholder="City" data-testid="input-reseller-city" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="area" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Area</FormLabel>
                            <FormControl><Input placeholder="Area / locality" data-testid="input-reseller-area" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="territory" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Territory</FormLabel>
                            <FormControl><Input placeholder="Coverage territory" data-testid="input-reseller-territory" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── NETWORK & SERVICE ── */}
              {activeTab === "network" && (
                <div className="space-y-5">
                  <Card>
                    <SectionHeader icon={Network} title="Network Infrastructure" />
                    <CardContent className="pt-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="uplinkType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Uplink Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl><SelectTrigger data-testid="select-reseller-uplink-type"><SelectValue placeholder="Select uplink type" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="exchange">Exchange</SelectItem>
                                <SelectItem value="tower">Tower</SelectItem>
                                <SelectItem value="pop">POP</SelectItem>
                                <SelectItem value="datacenter">Data Center</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="uplink" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Uplink Media</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl><SelectTrigger data-testid="select-reseller-uplink"><SelectValue placeholder="Select media" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="fiber">Fiber</SelectItem>
                                <SelectItem value="wireless">Wireless</SelectItem>
                                <SelectItem value="ethernet">Ethernet</SelectItem>
                                <SelectItem value="coaxial">Coaxial</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="exchangeTowerPopName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exchange / Tower / POP Name</FormLabel>
                            <FormControl><Input placeholder="e.g. DHA-Tower-01" data-testid="input-reseller-exchange-name" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="portId" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Port ID</FormLabel>
                            <FormControl><Input placeholder="Port identifier" data-testid="input-reseller-port-id" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="vlanId" render={({ field }) => (
                          <FormItem>
                            <FormLabel>VLAN ID</FormLabel>
                            <FormControl><Input placeholder="VLAN identifier" data-testid="input-reseller-vlan-id" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="media" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Media Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl><SelectTrigger data-testid="select-reseller-media"><SelectValue placeholder="Select media" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="dish">Dish</SelectItem>
                                <SelectItem value="sfp">SFP</SelectItem>
                                <SelectItem value="cat6">CAT6 / Ethernet</SelectItem>
                                <SelectItem value="fiber_optic">Fiber Optic</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <SectionHeader icon={Settings} title="Service Configuration" />
                    <CardContent className="pt-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="connectionType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Connection Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl><SelectTrigger data-testid="select-reseller-connection-type"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="FTTH">FTTH</SelectItem>
                                <SelectItem value="FTTB">FTTB</SelectItem>
                                <SelectItem value="Wireless">Wireless</SelectItem>
                                <SelectItem value="Ethernet">Ethernet</SelectItem>
                                <SelectItem value="PPPoE">PPPoE</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="bandwidthPlan" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bandwidth Plan</FormLabel>
                            <FormControl><Input placeholder="e.g. 100Mbps" data-testid="input-reseller-bandwidth-plan" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="ipAssignment" render={({ field }) => (
                          <FormItem>
                            <FormLabel>IP Assignment</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "dynamic"}>
                              <FormControl><SelectTrigger data-testid="select-reseller-ip-assignment"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="dynamic">Dynamic</SelectItem>
                                <SelectItem value="static">Static</SelectItem>
                                <SelectItem value="block">IP Block</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="nasId" render={({ field }) => (
                          <FormItem>
                            <FormLabel>NAS ID</FormLabel>
                            <FormControl><Input placeholder="NAS identifier" data-testid="input-reseller-nas-id" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="serviceZone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Zone</FormLabel>
                            <FormControl><Input placeholder="Service zone or region" data-testid="input-reseller-service-zone" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <FormField control={form.control} name="vlanIdAllowed" render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border p-3">
                            <FormControl>
                              <Switch checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="switch-reseller-vlan-allowed" />
                            </FormControl>
                            <div>
                              <FormLabel className="cursor-pointer font-medium">VLAN ID Allowed</FormLabel>
                              <p className="text-xs text-muted-foreground">Allow reseller to manage VLAN IDs</p>
                            </div>
                          </FormItem>
                        )} />
                        {vlanIdAllowedVal && (
                          <FormField control={form.control} name="vlanIdNote" render={({ field }) => (
                            <FormItem>
                              <FormLabel>VLAN ID Note</FormLabel>
                              <FormControl><Input placeholder="VLAN note or range" data-testid="input-reseller-vlan-note" {...field} value={field.value || ""} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── PACKAGES ── */}
              {activeTab === "packages" && (
                <div className="space-y-5">
                  <Card>
                    <SectionHeader icon={Tag} title="Assign Packages" />
                    <CardContent className="pt-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Package Name <span className="text-red-500">*</span></label>
                          <Select value={pkgForm.packageId} onValueChange={(val) => {
                            const pkg = (packagesList || []).find(p => String(p.id) === val);
                            setPkgForm(prev => ({ ...prev, packageId: val, vendorId: String(pkg?.vendorId || "") }));
                          }}>
                            <SelectTrigger data-testid="select-pkg-name"><SelectValue placeholder="Select Package" /></SelectTrigger>
                            <SelectContent>
                              {(packagesList || []).map((p) => (
                                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Vendor</label>
                          <Select value={pkgForm.vendorId} onValueChange={(val) => setPkgForm(prev => ({ ...prev, vendorId: val }))}>
                            <SelectTrigger data-testid="select-pkg-vendor"><SelectValue placeholder="Select Vendor" /></SelectTrigger>
                            <SelectContent>
                              {(vendors || []).map((v) => (
                                <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Vendor Price (PKR)</label>
                          <Input type="number" step="0.01" placeholder="0.00" data-testid="input-pkg-vendor-price" value={pkgForm.vendorPrice} onChange={(e) => setPkgForm(prev => ({ ...prev, vendorPrice: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Reseller Price (PKR)</label>
                          <Input type="number" step="0.01" placeholder="0.00" data-testid="input-pkg-reseller-price" value={pkgForm.resellerPrice} onChange={(e) => setPkgForm(prev => ({ ...prev, resellerPrice: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Profit</label>
                          <div className={`flex items-center h-10 px-3 rounded-md border text-sm font-mono font-medium ${parseFloat(pkgProfit) >= 0 ? "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" : "text-red-600 bg-red-50 border-red-200"}`}>
                            PKR {pkgProfit}
                          </div>
                        </div>
                      </div>
                      {selectedPkg && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm">
                          <Package className="h-4 w-4 text-blue-600 shrink-0" />
                          <span className="font-medium text-blue-800 dark:text-blue-300">{selectedPkg.name}</span>
                          <Badge variant="outline" className="text-xs">{selectedPkg.speed || "N/A"}</Badge>
                          <Badge variant="outline" className="text-xs">{selectedPkg.dataLimit || "Unlimited"}</Badge>
                        </div>
                      )}
                      <Button type="button" onClick={handleAddPackage} disabled={!selectedPkg} data-testid="button-add-package" className="bg-blue-600 hover:bg-blue-700">
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Add Package
                      </Button>

                      {addedPackages.length > 0 && (
                        <div className="border rounded-xl overflow-hidden mt-2">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-[#1a3a5c] hover:bg-[#1a3a5c]">
                                <TableHead className="text-white font-semibold">Package</TableHead>
                                <TableHead className="text-white font-semibold">Speed</TableHead>
                                <TableHead className="text-white font-semibold">Data</TableHead>
                                <TableHead className="text-white font-semibold">Vendor Price</TableHead>
                                <TableHead className="text-white font-semibold">Reseller Price</TableHead>
                                <TableHead className="text-white font-semibold">Profit</TableHead>
                                <TableHead className="text-white font-semibold w-16">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {addedPackages.map((p) => (
                                <TableRow key={p.packageId}>
                                  <TableCell className="font-medium">{p.packageName}</TableCell>
                                  <TableCell>{p.speed}</TableCell>
                                  <TableCell>{p.dataLimit}</TableCell>
                                  <TableCell>PKR {p.vendorPrice}</TableCell>
                                  <TableCell>PKR {p.resellerPrice}</TableCell>
                                  <TableCell className={parseFloat(p.profit) >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>PKR {p.profit}</TableCell>
                                  <TableCell>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => handleRemovePackage(p.packageId)} data-testid={`button-remove-pkg-${p.packageId}`}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <SectionHeader icon={Percent} title="Commission Settings" />
                    <CardContent className="pt-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="commissionRate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commission Rate (%)</FormLabel>
                            <FormControl><Input type="number" step="0.01" min="0" max="100" placeholder="10.00" data-testid="input-reseller-commission-rate" {...field} value={field.value || "10"} onChange={(e) => field.onChange(e.target.value)} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="commissionPaymentMethod" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commission Payment Method</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "wallet"}>
                              <FormControl><SelectTrigger data-testid="select-reseller-commission-method"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="wallet">Wallet</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="cheque">Cheque</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="commissionPaymentFrequency" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Frequency</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "monthly"}>
                              <FormControl><SelectTrigger data-testid="select-reseller-commission-freq"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="annually">Annually</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── VENDOR PANELS ── */}
              {activeTab === "panels" && (
                <div className="space-y-5">
                  <Card>
                    <SectionHeader icon={Globe} title="Vendor Panel Access" />
                    <CardContent className="pt-5 space-y-5">
                      <FormField control={form.control} name="vendorPanelAllowed" render={({ field }) => (
                        <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border p-4 bg-muted/30">
                          <FormControl>
                            <Switch checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="switch-reseller-vendor-panel" />
                          </FormControl>
                          <div>
                            <FormLabel className="cursor-pointer font-medium">Vendor Panel Allowed</FormLabel>
                            <p className="text-xs text-muted-foreground">Allow this reseller to access vendor management panels</p>
                          </div>
                        </FormItem>
                      )} />

                      <div className="border rounded-xl p-5 bg-card space-y-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                          <Plus className="h-4 w-4 text-blue-600" /> Add Vendor Panel
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-1.5 block">Vendor Name <span className="text-red-500">*</span></label>
                            <Select value={vpForm.vendorId} onValueChange={(val) => setVpForm(prev => ({ ...prev, vendorId: val }))}>
                              <SelectTrigger data-testid="select-vp-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                              <SelectContent>
                                {(vendors || []).map((v) => (
                                  <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1.5 block">Panel URL <span className="text-red-500">*</span></label>
                            <Input placeholder="https://panel.example.com" data-testid="input-vp-panel-url" value={vpForm.panelUrl} onChange={(e) => setVpForm(prev => ({ ...prev, panelUrl: e.target.value }))} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-1.5 block">Panel Username <span className="text-red-500">*</span></label>
                            <Input placeholder="Panel login username" data-testid="input-vp-username" value={vpForm.panelUsername} onChange={(e) => setVpForm(prev => ({ ...prev, panelUsername: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1.5 block">Panel Password <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <Input
                                type={showVpPassword ? "text" : "password"}
                                placeholder="Panel login password"
                                data-testid="input-vp-password"
                                value={vpForm.panelPassword}
                                onChange={(e) => setVpForm(prev => ({ ...prev, panelPassword: e.target.value }))}
                              />
                              <button type="button" onClick={() => setShowVpPassword(!showVpPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" data-testid="toggle-vp-password">
                                {showVpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button type="button" variant="outline" size="sm" onClick={() => { setVpForm({ vendorId: "", panelUrl: "", panelUsername: "", panelPassword: "" }); setShowVpPassword(false); }} data-testid="button-cancel-vp">
                            Cancel
                          </Button>
                          <Button type="button" size="sm" className="bg-gradient-to-r from-[#002B5B] to-[#007BFF] text-white" data-testid="button-add-vp"
                            onClick={() => {
                              if (!vpForm.vendorId || !vpForm.panelUrl || !vpForm.panelUsername || !vpForm.panelPassword) return;
                              const vendor = (vendors || []).find(v => v.id === parseInt(vpForm.vendorId));
                              const updated = [...addedVendorPanels, {
                                vendorId: parseInt(vpForm.vendorId),
                                vendorName: vendor?.name || "Unknown",
                                panelUrl: vpForm.panelUrl,
                                panelUsername: vpForm.panelUsername,
                                panelPassword: vpForm.panelPassword,
                              }];
                              setAddedVendorPanels(updated);
                              form.setValue("assignedVendorPanels", JSON.stringify(updated));
                              setVpForm({ vendorId: "", panelUrl: "", panelUsername: "", panelPassword: "" });
                              setShowVpPassword(false);
                            }}>
                            <Plus className="h-4 w-4 mr-1" /> Add Panel
                          </Button>
                        </div>
                      </div>

                      {addedVendorPanels.length > 0 && (
                        <div className="border rounded-xl overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-[#1a3a5c] hover:bg-[#1a3a5c]">
                                <TableHead className="text-white font-semibold">Vendor</TableHead>
                                <TableHead className="text-white font-semibold">Panel URL</TableHead>
                                <TableHead className="text-white font-semibold">Username</TableHead>
                                <TableHead className="text-white font-semibold">Password</TableHead>
                                <TableHead className="text-white font-semibold w-16">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {addedVendorPanels.map((vp, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-medium">{vp.vendorName}</TableCell>
                                  <TableCell className="text-blue-600 underline max-w-[200px] truncate" title={vp.panelUrl}>{vp.panelUrl}</TableCell>
                                  <TableCell>{vp.panelUsername}</TableCell>
                                  <TableCell className="font-mono text-xs">••••••••</TableCell>
                                  <TableCell>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-700" data-testid={`button-delete-vp-${idx}`}
                                      onClick={() => {
                                        const updated = addedVendorPanels.filter((_, i) => i !== idx);
                                        setAddedVendorPanels(updated);
                                        form.setValue("assignedVendorPanels", updated.length > 0 ? JSON.stringify(updated) : "");
                                      }}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
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

              {/* ── BILLING & FINANCE ── */}
              {activeTab === "billing" && (
                <div className="space-y-5">
                  <Card>
                    <SectionHeader icon={Wallet} title="Wallet & Credit" />
                    <CardContent className="pt-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="walletBalance" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Initial Wallet Balance (PKR)</FormLabel>
                            <FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-reseller-wallet-balance" {...field} value={field.value || "0"} onChange={(e) => field.onChange(e.target.value)} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="creditLimit" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credit Limit (PKR)</FormLabel>
                            <FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-reseller-credit-limit" {...field} value={field.value || "0"} onChange={(e) => field.onChange(e.target.value)} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="securityDeposit" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Security Deposit (PKR)</FormLabel>
                            <FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-reseller-security-deposit" {...field} value={field.value || "0"} onChange={(e) => field.onChange(e.target.value)} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="openingBalance" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Opening Balance (PKR)</FormLabel>
                          <FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-reseller-opening-balance" {...field} value={field.value || "0"} onChange={(e) => field.onChange(e.target.value)} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>

                  <Card>
                    <SectionHeader icon={CreditCard} title="Billing Settings" />
                    <CardContent className="pt-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="billingCycle" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Billing Cycle</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "monthly"}>
                              <FormControl><SelectTrigger data-testid="select-reseller-billing-cycle"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="annually">Annually</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "cash"}>
                              <FormControl><SelectTrigger data-testid="select-reseller-payment-method"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="cheque">Cheque</SelectItem>
                                <SelectItem value="online">Online Payment</SelectItem>
                                <SelectItem value="wallet">Wallet</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <SectionHeader icon={Landmark} title="Bank Details" />
                    <CardContent className="pt-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="bankName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl><Input placeholder="e.g. HBL, MCB, UBL" data-testid="input-reseller-bank-name" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="bankAccountTitle" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Title</FormLabel>
                            <FormControl><Input placeholder="Account holder name" data-testid="input-reseller-bank-title" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="bankAccountNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account / IBAN Number</FormLabel>
                            <FormControl><Input placeholder="Account number or IBAN" data-testid="input-reseller-bank-account" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="bankBranchCode" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch Code</FormLabel>
                            <FormControl><Input placeholder="Branch code" data-testid="input-reseller-bank-branch" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── AGREEMENT ── */}
              {activeTab === "agreement" && (
                <div className="space-y-5">
                  <Card>
                    <SectionHeader icon={ScrollText} title="Agreement & Contract" />
                    <CardContent className="pt-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="agreementType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agreement Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "standard"}>
                              <FormControl><SelectTrigger data-testid="select-reseller-agreement-type"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                                <SelectItem value="exclusive">Exclusive Territory</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="agreementStartDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agreement Start Date</FormLabel>
                            <FormControl><Input type="date" data-testid="input-reseller-agreement-start" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="agreementEndDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agreement End Date</FormLabel>
                            <FormControl><Input type="date" data-testid="input-reseller-agreement-end" {...field} value={field.value || ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="autoRenewal" render={({ field }) => (
                        <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border p-4 bg-muted/30">
                          <FormControl>
                            <Switch checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="switch-reseller-auto-renewal" />
                          </FormControl>
                          <div>
                            <FormLabel className="cursor-pointer font-medium">Auto Renewal</FormLabel>
                            <p className="text-xs text-muted-foreground">Automatically renew agreement when it expires</p>
                          </div>
                        </FormItem>
                      )} />

                      {/* Summary box */}
                      <div className="rounded-xl border bg-blue-50/40 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800 p-4 space-y-2">
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                          <CalendarClock className="h-4 w-4" /> Agreement Summary
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <span className="ml-2 font-medium capitalize">{w("agreementType") || "standard"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Auto Renewal:</span>
                            <span className={`ml-2 font-medium ${autoRenewalVal ? "text-green-600" : "text-red-500"}`}>{autoRenewalVal ? "Yes" : "No"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Start:</span>
                            <span className="ml-2 font-medium">{w("agreementStartDate") || "—"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">End:</span>
                            <span className="ml-2 font-medium">{w("agreementEndDate") || "—"}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ── DOCUMENTS ── */}
              {activeTab === "documents" && (
                <div className="space-y-5">
                  <Card>
                    <SectionHeader icon={Image} title="Identity & Registration Documents" />
                    <CardContent className="pt-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FileUploadPreview
                          label="Profile Picture"
                          value={w("profilePicture") || ""}
                          onChange={(url) => form.setValue("profilePicture", url)}
                          testId="upload-reseller-profile-picture"
                        />
                        <FileUploadPreview
                          label="CNIC / National ID"
                          value={w("cnicPicture") || ""}
                          onChange={(url) => form.setValue("cnicPicture", url)}
                          testId="upload-reseller-cnic-picture"
                        />
                        <FileUploadPreview
                          label="Registration Form"
                          value={w("registrationFormPicture") || ""}
                          onChange={(url) => form.setValue("registrationFormPicture", url)}
                          testId="upload-reseller-reg-form"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <SectionHeader icon={AlertCircle} title="Upload Guidelines" />
                    <CardContent className="pt-5">
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          Accepted formats: JPG, PNG, PDF
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          Maximum file size: 5MB per document
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          CNIC must be clear and legible on both sides
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          Registration form must be signed and stamped
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Bottom save button */}
              <div className="flex items-center justify-between pt-2 pb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/resellers")}
                  data-testid="button-cancel-reseller"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8"
                  data-testid="button-submit-reseller"
                >
                  {createMutation.isPending ? "Saving..." : "Save Reseller"}
                </Button>
              </div>
            </div>
          </main>
        </form>
      </Form>
    </div>
  );
}
