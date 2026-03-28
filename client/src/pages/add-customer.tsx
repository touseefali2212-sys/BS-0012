import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  User, Wifi, FileText, MapPin, Server, Bell,
  ChevronLeft, Upload, Check, Eye, EyeOff, RefreshCw,
  AlertCircle, Camera, Calculator, Phone, Mail, Shield,
  Building2, Zap, Package, UserCheck, Image, X,
  CheckCircle2, XCircle, Loader2, SkipForward, FileSpreadsheet,
  ClipboardList, Send, Users, Radio, Sparkles, ArrowRight, LocateFixed, Plus, Tv,
  Network, Activity, DollarSign, Globe, Settings, Gauge,
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Package as PackageType, Vendor, Area, Branch, Employee, Setting } from "@shared/schema";

type AutoStep = { step: string; status: "pending" | "running" | "success" | "error" | "skipped"; message: string; data?: any };

const AUTOMATION_STEPS: Array<{ key: string; label: string; icon: any; description: string }> = [
  { key: "invoice",               label: "Auto Invoice Generation",     icon: FileSpreadsheet, description: "Generating first invoice for this customer" },
  { key: "radius",                label: "Radius / PPPoE Provisioning", icon: Radio,           description: "Queueing network account provisioning" },
  { key: "task",                  label: "Installation Task",           icon: ClipboardList,   description: "Creating technician installation task" },
  { key: "notification_customer", label: "Customer Notification",       icon: Send,            description: "Sending welcome message to customer" },
  { key: "notification_employee", label: "Employee Notification",       icon: Users,           description: "Notifying assigned employee" },
];

const CORP_ADD_STEPS: Array<{ key: string; label: string; icon: any; description: string }> = [
  { key: "invoice", label: "Auto Invoice Generation", icon: FileSpreadsheet, description: "Generating first invoice for this Corporate customer" },
  { key: "notification_customer", label: "Account Manager Notification", icon: Send, description: "Notifying account manager of new corporate client" },
];

const CIR_ADD_STEPS: Array<{ key: string; label: string; icon: any; description: string }> = [
  { key: "invoice", label: "Auto Invoice Generation", icon: FileSpreadsheet, description: "Generating first invoice for this CIR customer" },
  { key: "notification_customer", label: "Account Manager Notification", icon: Send, description: "Notifying account manager of new CIR client" },
];

const corpTabItems = [
  { id: "company",  label: "Company Info",         icon: Building2 },
  { id: "billing",  label: "Billing & Terms",       icon: DollarSign },
  { id: "sla",      label: "Contract & SLA",        icon: Shield },
  { id: "services", label: "Value-Added Services",  icon: Zap },
];

const cirTabItems = [
  { id: "company",    label: "Company Info",    icon: Building2 },
  { id: "network",    label: "Network Details", icon: Network },
  { id: "billing",    label: "SLA & Billing",   icon: DollarSign },
  { id: "monitoring", label: "Monitoring",      icon: Activity },
];

const industryOptions = ["Technology", "Finance", "Healthcare", "Manufacturing", "Education", "Retail", "Government", "Telecom", "Real Estate", "Other"];

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
      <p className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Click to upload photo"}</p>
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

export default function AddCustomerPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gpsLocating, setGpsLocating] = useState(false);

  // Pre-fill from client request query
  const fromQueryId = new URLSearchParams(window.location.search).get("fromQuery");
  const typeParam = new URLSearchParams(window.location.search).get("type");
  const { data: fromQueryData } = useQuery<any>({
    queryKey: ["/api/customer-queries", fromQueryId],
    enabled: !!fromQueryId,
  });

  // Automation modal state
  const [autoModalOpen, setAutoModalOpen] = useState(false);
  const [autoSteps, setAutoSteps] = useState<AutoStep[]>([]);
  const [autoComplete, setAutoComplete] = useState(false);
  const [autoCustomerName, setAutoCustomerName] = useState("");
  const [savedCustomerId, setSavedCustomerId] = useState<number | null>(null);

  // Customer type category — pre-set from ?type= URL param when converting from a client request
  const [customerCategory, setCustomerCategory] = useState<"normal" | "corporate" | "cir">(
    typeParam === "corporate" ? "corporate" : typeParam === "cir" ? "cir" : "normal"
  );
  const [corpActiveTab, setCorpActiveTab] = useState("company");
  const [cirActiveTab, setCirActiveTab] = useState("company");

  // Corp billing helpers (local — affect corpForm.monthlyBilling at save)
  const [corpMonthlyBase, setCorpMonthlyBase] = useState("0");
  const [corpBillingDiscount, setCorpBillingDiscount] = useState("0");
  const [corpOtcEnabled, setCorpOtcEnabled] = useState(false);
  const [corpOtcAmount, setCorpOtcAmount] = useState("");
  const [corpLateFeeEnabled, setCorpLateFeeEnabled] = useState(false);
  const [corpSelectedTaxIds, setCorpSelectedTaxIds] = useState<number[]>([]);
  const [corpTaxDropdownOpen, setCorpTaxDropdownOpen] = useState(false);

  // Corporate form state
  const [corpForm, setCorpForm] = useState({
    companyName: "", contactFullName: "", registrationNumber: "", ntn: "", industryType: "",
    headOfficeAddress: "", billingAddress: "", accountManager: "", email: "", mobileNo: "", phone: "",
    branch: "", city: "",
    mapLatitude: "", mapLongitude: "",
    billingMode: "fixed", perMbpsRate: "0", bandwidthMbps: "0",
    taxEnabled: false, whTaxPercent: "0", aitTaxPercent: "0", extraFeeTaxPercent: "0",
    centralizedBilling: true, perBranchBilling: false, customInvoiceFormat: "",
    paymentTerms: "net_30", creditLimit: "0", securityDeposit: "0",
    contractDuration: "", contractStartDate: "", contractExpiryDate: "",
    contractFile: "", cnicFrontFile: "", cnicBackFile: "",
    customSla: "", dedicatedAccountManager: "", customPricingAgreement: "",
    managedRouter: false, firewall: false, loadBalancer: false, dedicatedSupport: false,
    backupLink: false, monitoringSla: false,
    totalBandwidth: "", monthlyBilling: "0", status: "active", notes: "",
  });

  // CIR form state
  const [cirForm, setCirForm] = useState({
    companyName: "", contactPerson: "", cnic: "", ntn: "", email: "", phone: "",
    mobileNo2: "", address: "", city: "", branch: "",
    mapLatitude: "", mapLongitude: "",
    customerType: "", serviceType: "", vendorId: "", linkType: "", uplinkPort: "", media: "",
    vendorPort: "",
    committedBandwidth: "", burstBandwidth: "", uploadSpeed: "", downloadSpeed: "",
    contentionRatio: "", vlanId: "", onuDevice: "", staticIp: "", subnetMask: "",
    gateway: "", dns: "", dns2: "", publicIpBlock: "",
    contractStartDate: "", contractEndDate: "", slaLevel: "", slaPenaltyClause: "",
    autoRenewal: false, monthlyCharges: "0", installationCharges: "0",
    securityDeposit: "0", billingCycle: "monthly", invoiceType: "tax", lateFeePolicy: "",
    radiusProfile: "", bandwidthProfileName: "", monitoringEnabled: false,
    snmpMonitoring: false, trafficAlerts: false, status: "active", notes: "",
  });

  const updateCorp = (field: string, value: string | boolean) =>
    setCorpForm(prev => ({ ...prev, [field]: value }));

  const updateCir = (field: string, value: string | boolean) =>
    setCirForm(prev => ({ ...prev, [field]: value }));

  // Additional packages (IPTV, Cable TV, OTT, etc.)
  const [addlPkgs, setAddlPkgs] = useState<{packageId: string; bill: string}[]>([]);
  const addlPkgsTotal = addlPkgs.reduce((s, p) => s + (parseFloat(p.bill) || 0), 0);

  // Additional devices (extra devices with their charges)
  const [addlDevices, setAddlDevices] = useState<{deviceType: string; deviceDetail: string; deviceCharges: string; installmentEnabled: boolean}[]>([]);
  const addlDevicesTotal = addlDevices.reduce((s, d) => s + (parseFloat(d.deviceCharges) || 0), 0);

  // Per-item installment toggles (main device + installation)
  const [mainDeviceInstallmentEnabled, setMainDeviceInstallmentEnabled] = useState(false);
  const [installationInstallmentEnabled, setInstallationInstallmentEnabled] = useState(false);

  // Corp billing computed values
  const corpPerMbpsCalculated = (parseFloat(corpForm.bandwidthMbps) || 0) * (parseFloat(corpForm.perMbpsRate) || 0);
  const corpEffectiveBase = corpForm.billingMode === "per_mbps" ? corpPerMbpsCalculated : (parseFloat(corpMonthlyBase) || 0);
  const corpSubtotalBeforeTax = Math.max(0, corpEffectiveBase - (parseFloat(corpBillingDiscount) || 0));

  const [form, setForm] = useState({
    fullName: "", fatherName: "", cnic: "", phone: "", email: "",
    gender: "", occupation: "", dateOfBirth: "", customerType: "Normal",
    profilePicture: "", notes: "",

    connectedBy: "", usernameIp: "", password: "", vendorId: "", packageId: "",
    packageBill: "", discountOnPackage: "", finalPackageBill: "",
    deviceType: "", deviceDetail: "", deviceCharges: "0",
    installationCharges: "0", discountOnInstallation: "0", finalInstallationCharges: "0",
    staticIpEnabled: false, staticIpMrc: "0",
    installmentEnabled: false, installmentType: "", installmentTotalAmount: "", installmentMonths: "6",
    installmentMonthlyAmount: "0", installmentPaidMonths: "0", installmentNote: "",
    grandTotal: "0",
    joiningDate: "", expireDate: "", billingStatus: "Active",

    cnicFront: "", cnicBack: "", registrationFormNo: "", registrationFormPicture: "", addressProof: "",

    branch: "", cnicAddress: "", presentAddress: "", area: "", city: "",
    mapLatitude: "", mapLongitude: "", zone: "", subzone: "",

    protocolType: "", connectionType: "", device: "", deviceModel: "", deviceMacSerial: "", macAddress: "",
    deviceOwnedBy: "Company", cableRequirement: "", fiberCode: "", numberOfCore: "", coreColor: "",

    smsMobile: true, smsWhatsapp: false, emailNotif: false, inAppNotif: true,
    sendSmsToEmployee: false, sendGreetingSms: true,
  });

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

      // When installment type changes, auto-fill total amount from the matching charge
      if (field === "installmentType") {
        if (value === "Installation") {
          const amt = parseFloat(prev.finalInstallationCharges) || 0;
          updated.installmentTotalAmount = amt > 0 ? amt.toFixed(2) : "";
        } else if (value === "Device") {
          updated.installmentTotalAmount = "";
        }
        const total  = parseFloat(updated.installmentTotalAmount) || 0;
        const months = parseInt(updated.installmentMonths, 10) || 1;
        updated.installmentMonthlyAmount = total > 0 && months > 0 ? (total / months).toFixed(2) : "0";
      }

      // Auto-calculate installment monthly amount when total or months change
      if (field === "installmentTotalAmount" || field === "installmentMonths") {
        const total  = parseFloat(field === "installmentTotalAmount" ? String(value) : prev.installmentTotalAmount) || 0;
        const months = parseInt(field === "installmentMonths"        ? String(value) : prev.installmentMonths, 10)  || 1;
        updated.installmentMonthlyAmount = months > 0 ? (total / months).toFixed(2) : "0";
      }

      // Auto-recalculate grand total whenever any billing component changes
      if (["packageBill","discountOnPackage","deviceCharges",
           "installationCharges","discountOnInstallation",
           "staticIpMrc","staticIpEnabled",
           "installmentEnabled","installmentType","installmentTotalAmount","installmentMonths"].includes(field)) {
        const fp  = parseFloat(updated.finalPackageBill)         || 0;
        const dc  = parseFloat(updated.deviceCharges)            || 0;
        const fi  = parseFloat(updated.finalInstallationCharges) || 0;
        const sip = (updated.staticIpEnabled  ? parseFloat(updated.staticIpMrc)              : 0) || 0;
        const ins = (updated.installmentEnabled ? parseFloat(updated.installmentMonthlyAmount) : 0) || 0;
        const apl = addlPkgs.reduce((s, p) => s + (parseFloat(p.bill) || 0), 0);
        const adv = addlDevices.reduce((s, d) => s + (parseFloat(d.deviceCharges) || 0), 0);
        updated.grandTotal = (fp + dc + fi + sip + ins + apl + adv).toFixed(2);
      }

      return updated;
    });
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  const { data: vendors } = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });
  const { data: packages } = useQuery<PackageType[]>({ queryKey: ["/api/packages"] });
  const { data: areas } = useQuery<Area[]>({ queryKey: ["/api/areas"] });
  const { data: branches } = useQuery<Branch[]>({ queryKey: ["/api/branches"] });
  const { data: employees } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: allSettings } = useQuery<Setting[]>({ queryKey: ["/api/settings"] });
  const billingTaxSettings = (allSettings || []).filter(s => s.category === "billing");

  const parseTaxMeta = (desc: string | null | undefined) => {
    try { return JSON.parse(desc || "{}"); }
    catch { return { type: "unknown", name: desc || "", applyTo: "all" }; }
  };

  const corpSelectedTaxes = billingTaxSettings.filter(s => corpSelectedTaxIds.includes(s.id));
  const corpTaxLineItems = corpSelectedTaxes.map(s => {
    const meta = parseTaxMeta(s.description);
    const val = parseFloat(s.value) || 0;
    const isPercent = meta.type !== "extra_fee";
    const amount = isPercent ? (corpSubtotalBeforeTax * val) / 100 : val;
    return { id: s.id, name: meta.name || s.key, type: meta.type, rate: val, isPercent, amount };
  });
  const corpTotalTax = corpTaxLineItems.reduce((sum, t) => sum + t.amount, 0);
  const corpFinalMonthly = corpSubtotalBeforeTax + corpTotalTax;
  const corpFirstPayment = corpFinalMonthly + (parseFloat(corpForm.securityDeposit) || 0) + (corpOtcEnabled ? (parseFloat(corpOtcAmount) || 0) : 0);

  const filteredPackages = packages?.filter(p =>
    !form.vendorId || String(p.vendorId) === form.vendorId
  );

  const selectedPackage = packages?.find(p => String(p.id) === form.packageId);

  const selectedBranch = branches?.find(b => String(b.id) === form.branch);

  const filteredAreas = areas?.filter(a =>
    !selectedBranch || a.branch === selectedBranch.name
  );

  const handleBranchChange = (branchId: string) => {
    const branch = branches?.find(b => String(b.id) === branchId);
    setForm(prev => ({
      ...prev,
      branch: branchId,
      area: "",
      city: branch?.city || prev.city,
    }));
  };

  const handleAreaChange = (areaName: string) => {
    setForm(prev => ({ ...prev, area: areaName }));
  };

  useEffect(() => {
    if (!form.branch || !branches?.length) return;
    const branch = branches.find(b => String(b.id) === form.branch);
    if (!branch?.city) return;
    setForm(prev => ({ ...prev, city: branch.city! }));
  }, [form.branch, branches]);

  useEffect(() => {
    if (!form.area || !areas?.length) return;
    const area = areas.find(a => a.name === form.area);
    if (!area) return;
    setForm(prev => ({
      ...prev,
      ...(area.city ? { city: area.city } : {}),
      ...(area.zone ? { zone: area.zone } : {}),
    }));
  }, [form.area, areas]);

  // Recalculate grand total whenever additional packages or devices change
  useEffect(() => {
    setForm(prev => {
      const fp  = parseFloat(prev.finalPackageBill)         || 0;
      const dc  = parseFloat(prev.deviceCharges)            || 0;
      const fi  = parseFloat(prev.finalInstallationCharges) || 0;
      const sip = (prev.staticIpEnabled  ? parseFloat(prev.staticIpMrc)             : 0) || 0;
      const ins = (prev.installmentEnabled ? parseFloat(prev.installmentMonthlyAmount) : 0) || 0;
      const apl = addlPkgs.reduce((s, p) => s + (parseFloat(p.bill) || 0), 0);
      const adv = addlDevices.reduce((s, d) => s + (parseFloat(d.deviceCharges) || 0), 0);
      return { ...prev, grandTotal: (fp + dc + fi + sip + ins + apl + adv).toFixed(2) };
    });
  }, [addlPkgs, addlDevices]);

  // Pre-fill form when fromQuery data is loaded
  useEffect(() => {
    if (!fromQueryData) return;
    const q = fromQueryData;
    const matchedBranch = branches?.find(b => b.name === q.branch);
    setForm(prev => ({
      ...prev,
      fullName: q.name || prev.fullName,
      fatherName: q.fatherName || prev.fatherName,
      gender: q.gender || prev.gender,
      occupation: q.occupation || prev.occupation,
      dateOfBirth: q.dateOfBirth || prev.dateOfBirth,
      cnic: q.nidNumber || prev.cnic,
      phone: q.phone || prev.phone,
      email: q.email || prev.email,
      customerType: q.customerType === "CIR" ? "CIR" : q.customerType === "Corporate" ? "Corporate" : q.customerType === "Reseller" ? "Reseller" : q.customerType || prev.customerType,
      presentAddress: q.address || prev.presentAddress,
      cnicAddress: q.address || prev.cnicAddress,
      area: q.area || prev.area,
      city: q.city || prev.city,
      zone: q.zone || prev.zone,
      subzone: q.subzone || prev.subzone,
      branch: matchedBranch ? String(matchedBranch.id) : prev.branch,
      connectionType: q.connectionType || prev.connectionType,
      macAddress: q.macAddress || prev.macAddress,
      deviceModel: q.routerModel || prev.deviceModel,
      profilePicture: q.profilePicture || prev.profilePicture,
      cnicFront: q.nidPicture || prev.cnicFront,
      registrationFormNo: q.registrationFormNo || prev.registrationFormNo,
      registrationFormPicture: q.registrationFormPicture || prev.registrationFormPicture,
      packageId: q.packageId ? String(q.packageId) : prev.packageId,
      packageBill: q.monthlyCharges ? String(q.monthlyCharges) : prev.packageBill,
      finalPackageBill: q.monthlyCharges ? String(q.monthlyCharges) : prev.finalPackageBill,
      installationCharges: q.installationFee ? String(q.installationFee) : prev.installationCharges,
      finalInstallationCharges: q.installationFee ? String(q.installationFee) : prev.finalInstallationCharges,
      staticIpEnabled: q.staticIp ?? prev.staticIpEnabled,
      notes: q.remarks || prev.notes,
    }));
  }, [fromQueryData, branches]);

  // Auto-detect customer category from query data
  useEffect(() => {
    if (!fromQueryData) return;
    const type = fromQueryData.customerType;
    if (type === "Corporate") {
      setCustomerCategory("corporate");
      setCorpForm(prev => ({
        ...prev,
        companyName: fromQueryData.name || "",
        contactFullName: fromQueryData.name || "",
        email: fromQueryData.email || "",
        mobileNo: fromQueryData.phone || "",
        phone: "",
        headOfficeAddress: fromQueryData.address || "",
        billingAddress: fromQueryData.address || "",
        monthlyBilling: fromQueryData.monthlyCharges || "0",
      }));
      setCorpMonthlyBase(fromQueryData.monthlyCharges || "0");
    } else if (type === "CIR") {
      setCustomerCategory("cir");
      setCirForm(prev => ({
        ...prev,
        companyName: fromQueryData.name || "",
        contactPerson: fromQueryData.name || "",
        email: fromQueryData.email || "",
        phone: fromQueryData.phone || "",
        address: fromQueryData.address || "",
        city: fromQueryData.city || "",
        monthlyCharges: fromQueryData.monthlyCharges || "0",
        committedBandwidth: fromQueryData.bandwidthRequired ? `${fromQueryData.bandwidthRequired} Mbps` : "",
      }));
    }
  }, [fromQueryData]);

  // Auto-compute installment total from per-item toggles
  useEffect(() => {
    const anyEnabled = mainDeviceInstallmentEnabled || installationInstallmentEnabled || addlDevices.some(d => d.installmentEnabled);
    if (!anyEnabled) return;
    let total = 0;
    if (mainDeviceInstallmentEnabled) total += parseFloat(form.deviceCharges) || 0;
    addlDevices.forEach(d => { if (d.installmentEnabled) total += parseFloat(d.deviceCharges) || 0; });
    if (installationInstallmentEnabled) total += parseFloat(form.finalInstallationCharges) || 0;
    // Determine auto installment type label
    const hasDevice = mainDeviceInstallmentEnabled || addlDevices.some(d => d.installmentEnabled);
    const hasInstall = installationInstallmentEnabled;
    const autoType = hasDevice && hasInstall ? "Device" : hasDevice ? "Device" : "Installation";
    setForm(prev => {
      const months = parseInt(prev.installmentMonths, 10) || 1;
      const monthly = total > 0 && months > 0 ? (total / months).toFixed(2) : "0";
      return {
        ...prev,
        installmentEnabled: true,
        installmentType: autoType,
        installmentTotalAmount: total > 0 ? total.toFixed(2) : "",
        installmentMonthlyAmount: monthly,
      };
    });
  }, [mainDeviceInstallmentEnabled, installationInstallmentEnabled, addlDevices, form.deviceCharges, form.finalInstallationCharges, form.installmentMonths]);

  const handlePackageChange = (pkgId: string) => {
    const pkg = packages?.find(p => String(p.id) === pkgId);
    if (pkg) {
      const base    = parseFloat(pkg.price   ?? "0") || 0;
      const wht     = parseFloat(pkg.whTax   ?? "0") || 0;
      const ait     = parseFloat(pkg.aitTax  ?? "0") || 0;
      const whtAmt  = (base * wht) / 100;
      const aitAmt  = (base * ait) / 100;
      const total   = base + whtAmt + aitAmt;
      const bill    = total.toFixed(2);
      const disc    = form.discountOnPackage || "0";
      const final   = String(Math.max(0, parseFloat(bill) - parseFloat(disc)));
      const expire = form.joiningDate ? addMonths(form.joiningDate, cycleToMonths(pkg.billingCycle)) : "";
      const instFinal = parseFloat(form.finalInstallationCharges) || 0;
      setForm(prev => {
        const dc  = parseFloat(prev.deviceCharges)            || 0;
        const sip = (prev.staticIpEnabled     ? parseFloat(prev.staticIpMrc)             : 0) || 0;
        const ins = (prev.installmentEnabled  ? parseFloat(prev.installmentMonthlyAmount) : 0) || 0;
        const apl = addlPkgs.reduce((s, p) => s + (parseFloat(p.bill) || 0), 0);
        const adv = addlDevices.reduce((s, d) => s + (parseFloat(d.deviceCharges) || 0), 0);
        return {
          ...prev,
          packageId: pkgId,
          packageBill: bill,
          finalPackageBill: final,
          grandTotal: (parseFloat(final) + dc + instFinal + sip + ins + apl + adv).toFixed(2),
          expireDate: expire,
        };
      });
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

  const handleCorpGetGps = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", description: "Your browser does not support GPS.", variant: "destructive" });
      return;
    }
    setGpsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateCorp("mapLatitude",  String(pos.coords.latitude));
        updateCorp("mapLongitude", String(pos.coords.longitude));
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

  const handleCirGetGps = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", description: "Your browser does not support GPS.", variant: "destructive" });
      return;
    }
    setGpsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateCir("mapLatitude",  String(pos.coords.latitude));
        updateCir("mapLongitude", String(pos.coords.longitude));
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
    if (form.macAddress && !validateMac(form.macAddress)) newErrors.macAddress = "Format: AA:BB:CC:DD:EE:FF";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstErrorTab = Object.keys(newErrors)[0];
      const tabMap: Record<string, string> = {
        fullName: "basic", fatherName: "basic", cnic: "basic", phone: "basic", email: "basic",
        connectedBy: "connection", usernameIp: "connection", packageId: "connection",
        deviceMacSerial: "infrastructure",
        macAddress: "infrastructure",
      };
      if (tabMap[firstErrorTab]) setActiveTab(tabMap[firstErrorTab]);
    }
    return Object.keys(newErrors).length === 0;
  };

  // Compute which required fields are still missing across ALL tabs — disables save buttons
  const missingByTab: Record<string, string[]> = {
    "Basic Info":     [],
    "Connection":     [],
    "Documents":      [],
    "Area":           [],
    "Infrastructure": [],
  };
  // Basic Info required fields
  if (!form.fullName    || form.fullName.trim().length < 2)  missingByTab["Basic Info"].push("Customer Name");
  if (!form.cnic        || form.cnic.trim().length < 1)      missingByTab["Basic Info"].push("CNIC / NID");
  if (!form.phone       || form.phone.trim().length < 10)    missingByTab["Basic Info"].push("Mobile Number");
  if (!form.email       || form.email.trim().length < 1)     missingByTab["Basic Info"].push("Email Address");
  // Connection required fields
  if (!form.connectedBy  || form.connectedBy.trim().length < 1)  missingByTab["Connection"].push("Installed By");
  if (!form.usernameIp   || form.usernameIp.trim().length < 1)   missingByTab["Connection"].push("Username / PPPoE");
  if (!form.vendorId     || form.vendorId.trim().length < 1)     missingByTab["Connection"].push("Vendor");
  if (!form.packageId    || form.packageId.trim().length < 1)    missingByTab["Connection"].push("Package");
  if (!form.joiningDate  || form.joiningDate.trim().length < 1)  missingByTab["Connection"].push("Joining Date");
  // Documents required fields
  if (!form.cnicFront || form.cnicFront.trim().length < 1)  missingByTab["Documents"].push("CNIC Front");
  if (!form.cnicBack  || form.cnicBack.trim().length < 1)   missingByTab["Documents"].push("CNIC Back");
  // Area required fields
  if (!form.branch         || form.branch.trim().length < 1)         missingByTab["Area"].push("Branch");
  if (!form.area           || form.area.trim().length < 1)           missingByTab["Area"].push("Area");
  if (!form.city           || form.city.trim().length < 1)           missingByTab["Area"].push("City");
  if (!form.presentAddress || form.presentAddress.trim().length < 1) missingByTab["Area"].push("Current Address");
  // Infrastructure required fields
  if (!form.protocolType   || form.protocolType.trim().length < 1)   missingByTab["Infrastructure"].push("Protocol Type");
  if (!form.connectionType || form.connectionType.trim().length < 1) missingByTab["Infrastructure"].push("Connection Type");
  if (!form.device         || form.device.trim().length < 1)         missingByTab["Infrastructure"].push("Device Type");
  if (!form.deviceOwnedBy  || form.deviceOwnedBy.trim().length < 1)  missingByTab["Infrastructure"].push("Device Owned By");

  const allMissing = Object.entries(missingByTab).flatMap(([tab, fields]) =>
    fields.map(f => `${f} (${tab})`)
  );
  const isFormReady = allMissing.length === 0;

  // Summary hint shown in footer
  const pendingTabCount = Object.values(missingByTab).filter(f => f.length > 0).length;
  const totalMissingCount = allMissing.length;

  const saveMutation = useMutation({
    mutationFn: async (options: { activate?: boolean } = {}) => {
      const payload = {
        customerId: `C-${Date.now().toString(36).toUpperCase()}`,
        fullName: form.fullName,
        fatherName: form.fatherName,
        cnic: form.cnic,
        phone: form.phone,
        email: form.email,
        gender: form.gender,
        occupation: form.occupation,
        dateOfBirth: form.dateOfBirth,
        customerType: form.customerType.toLowerCase(),
        profilePicture: form.profilePicture,
        notes: form.notes,
        connectedBy: form.connectedBy,
        usernameIp: form.usernameIp,
        password: form.password,
        vendorId: form.vendorId ? parseInt(form.vendorId) : null,
        packageId: form.packageId ? parseInt(form.packageId) : null,
        monthlyBill: form.finalPackageBill || form.packageBill || null,
        joiningDate: form.joiningDate,
        expireDate: form.expireDate,
        connectionDate: form.joiningDate,
        billingStatus: options.activate ? "Active" : form.billingStatus,
        status: options.activate ? "active" : "inactive",
        nidPicture: form.cnicFront,
        registrationFormNo: form.registrationFormNo,
        registrationFormPicture: form.registrationFormPicture,
        address: form.cnicAddress,
        presentAddress: form.presentAddress,
        permanentAddress: form.cnicAddress,
        area: form.area,
        city: form.city,
        mapLatitude: form.mapLatitude,
        mapLongitude: form.mapLongitude,
        zone: form.zone,
        subzone: form.subzone,
        protocolType: form.protocolType,
        connectionType: form.connectionType,
        device: form.device,
        deviceMacSerial: form.deviceMacSerial,
        macAddress: form.macAddress,
        cableRequirement: form.cableRequirement,
        fiberCode: form.fiberCode,
        numberOfCore: form.numberOfCore,
        coreColor: form.coreColor,
        sendSmsToEmployee: form.sendSmsToEmployee,
        sendGreetingSms: form.sendGreetingSms,
        isRecurring: true,
        branch: form.branch,
        cnicBackPicture: form.cnicBack,
        deviceModel: form.deviceModel,
        deviceOwnedBy: form.deviceOwnedBy,
        additionalPackages: JSON.stringify(addlPkgs),
        additionalDevices: JSON.stringify(addlDevices),
        deviceType:    form.deviceType  || "",
        deviceDetail:  form.deviceDetail || "",
        deviceCharges: form.deviceCharges || "0",
        installationCharges: form.installationCharges || "0",
        discountOnInstallation: form.discountOnInstallation || "0",
        finalInstallationCharges: form.finalInstallationCharges || "0",
        packageBill: form.packageBill || "0",
        discountOnPackage: form.discountOnPackage || "0",
        grandTotal: form.grandTotal || "0",
        staticIpEnabled: form.staticIpEnabled,
        staticIpMrc: form.staticIpMrc || "0",
        installmentEnabled:       form.installmentEnabled,
        installmentType:          form.installmentType || "",
        installmentTotalAmount:   form.installmentTotalAmount  || "0",
        installmentMonths:        parseInt(form.installmentMonths, 10) || 0,
        installmentMonthlyAmount: form.installmentMonthlyAmount || "0",
        installmentPaidMonths:    parseInt(form.installmentPaidMonths, 10) || 0,
        installmentNote:          form.installmentNote || "",
      };
      const res = await apiRequest("POST", "/api/customers", payload);
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setSavedCustomerId(data.id);
      setAutoCustomerName(data.fullName || form.fullName);
      const initialSteps: AutoStep[] = AUTOMATION_STEPS.map(s => ({ step: s.key, status: "pending", message: s.description }));
      setAutoSteps(initialSteps);
      setAutoComplete(false);
      setAutoModalOpen(true);
      runAutomation(data.id, initialSteps);
      // If created from a client request query, mark it as Converted
      if (fromQueryId) {
        apiRequest("POST", `/api/customer-queries/${fromQueryId}/convert`, { customerId: data.id }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["/api/customer-queries"] });
        queryClient.invalidateQueries({ queryKey: ["/api/customer-queries", fromQueryId] });
      }
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to save customer", variant: "destructive" });
    },
  });

  const runAutomation = async (customerId: number, initialSteps: AutoStep[]) => {
    const animate = (steps: AutoStep[]) => setAutoSteps([...steps]);
    const steps = [...initialSteps];

    // Mark first step as running
    steps[0] = { ...steps[0], status: "running" };
    animate(steps);

    try {
      const res = await apiRequest("POST", `/api/customers/${customerId}/automate`);
      const result = await res.json();
      const serverSteps: Array<{ step: string; status: string; message: string; data?: any }> = result.steps || [];

      for (let i = 0; i < AUTOMATION_STEPS.length; i++) {
        const key = AUTOMATION_STEPS[i].key;
        const found = serverSteps.find(s => s.step === key);
        if (i > 0) {
          steps[i] = { ...steps[i], status: "running" };
          animate(steps);
          await new Promise(r => setTimeout(r, 500));
        }
        steps[i] = {
          step: key,
          status: (found?.status === "success" ? "success" : found?.status === "skipped" ? "skipped" : found?.status === "error" ? "error" : "success") as AutoStep["status"],
          message: found?.message || steps[i].message,
          data: found?.data,
        };
        animate(steps);
        await new Promise(r => setTimeout(r, 400));
      }
    } catch (_) {
      for (let i = 0; i < steps.length; i++) {
        if (steps[i].status === "pending" || steps[i].status === "running") {
          steps[i] = { ...steps[i], status: "error", message: "Automation step failed" };
        }
      }
      animate(steps);
    }

    setAutoComplete(true);
  };

  const handleSave = (options?: { activate?: boolean; addAnother?: boolean }) => {
    if (!validate()) return;
    saveMutation.mutate(options ?? {});
  };

  // Corporate automation runner
  const runCorpAddAutomation = async (customerId: number, initialSteps: AutoStep[]) => {
    const animate = (steps: AutoStep[]) => setAutoSteps([...steps]);
    const steps = [...initialSteps];
    steps[0] = { ...steps[0], status: "running" };
    animate(steps);
    try {
      const res = await apiRequest("POST", `/api/corporate-customers/${customerId}/automate`);
      const result = await res.json();
      const serverSteps: Array<{ step: string; status: string; message: string; data?: any }> = result.steps || [];
      for (let i = 0; i < CORP_ADD_STEPS.length; i++) {
        const key = CORP_ADD_STEPS[i].key;
        const found = serverSteps.find(s => s.step === key);
        if (i > 0) { steps[i] = { ...steps[i], status: "running" }; animate(steps); await new Promise(r => setTimeout(r, 500)); }
        steps[i] = { step: key, status: (found?.status as any) || "success", message: found?.message || steps[i].message, data: found?.data };
        animate(steps);
        await new Promise(r => setTimeout(r, 400));
      }
    } catch { steps.forEach((s, i) => { if (s.status === "pending" || s.status === "running") steps[i] = { ...s, status: "error", message: "Step failed" }; }); animate(steps); }
    setAutoComplete(true);
  };

  // CIR automation runner
  const runCirAddAutomation = async (customerId: number, initialSteps: AutoStep[]) => {
    const animate = (steps: AutoStep[]) => setAutoSteps([...steps]);
    const steps = [...initialSteps];
    steps[0] = { ...steps[0], status: "running" };
    animate(steps);
    try {
      const res = await apiRequest("POST", `/api/cir-customers/${customerId}/automate`);
      const result = await res.json();
      const serverSteps: Array<{ step: string; status: string; message: string; data?: any }> = result.steps || [];
      for (let i = 0; i < CIR_ADD_STEPS.length; i++) {
        const key = CIR_ADD_STEPS[i].key;
        const found = serverSteps.find(s => s.step === key);
        if (i > 0) { steps[i] = { ...steps[i], status: "running" }; animate(steps); await new Promise(r => setTimeout(r, 500)); }
        steps[i] = { step: key, status: (found?.status as any) || "success", message: found?.message || steps[i].message, data: found?.data };
        animate(steps);
        await new Promise(r => setTimeout(r, 400));
      }
    } catch { steps.forEach((s, i) => { if (s.status === "pending" || s.status === "running") steps[i] = { ...s, status: "error", message: "Step failed" }; }); animate(steps); }
    setAutoComplete(true);
  };

  // Corporate save mutation
  const saveCorpMutation = useMutation({
    mutationFn: async (opts: { activate?: boolean } = {}) => {
      const payload = {
        ...corpForm,
        vendorId: undefined,
        status: opts.activate ? "active" : corpForm.status,
        creditLimit: corpForm.creditLimit || "0",
        securityDeposit: corpForm.securityDeposit || "0",
        monthlyBilling: String(corpFinalMonthly) || "0",
        appliedTaxIds: corpSelectedTaxIds.length > 0 ? JSON.stringify(corpSelectedTaxIds) : null,
      };
      const res = await apiRequest("POST", "/api/corporate-customers", payload);
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/corporate-customers"] });
      setAutoCustomerName(data.companyName || corpForm.companyName);
      const steps = CORP_ADD_STEPS.map(s => ({ step: s.key, status: "pending" as const, message: s.description }));
      setAutoSteps(steps);
      setAutoComplete(false);
      setSavedCustomerId(data.id);
      setAutoModalOpen(true);
      runCorpAddAutomation(data.id, steps);
      if (fromQueryId) {
        apiRequest("POST", `/api/customer-queries/${fromQueryId}/convert`, { customerId: data.id }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["/api/customer-queries"] });
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // CIR save mutation
  const saveCirMutation = useMutation({
    mutationFn: async (opts: { activate?: boolean } = {}) => {
      const payload = {
        ...cirForm,
        vendorId: cirForm.vendorId ? parseInt(cirForm.vendorId) : null,
        status: opts.activate ? "active" : cirForm.status,
        monthlyCharges: cirForm.monthlyCharges || "0",
        installationCharges: cirForm.installationCharges || "0",
        securityDeposit: cirForm.securityDeposit || "0",
      };
      const res = await apiRequest("POST", "/api/cir-customers", payload);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cir-customers"] });
      setAutoCustomerName(data.companyName || cirForm.companyName);
      const steps = CIR_ADD_STEPS.map(s => ({ step: s.key, status: "pending" as const, message: s.description }));
      setAutoSteps(steps);
      setAutoComplete(false);
      setSavedCustomerId(data.id);
      setAutoModalOpen(true);
      runCirAddAutomation(data.id, steps);
      if (fromQueryId) {
        apiRequest("POST", `/api/customer-queries/${fromQueryId}/convert`, { customerId: data.id }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["/api/customer-queries"] });
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const corpRequiredComplete =
    (corpForm.companyName?.trim().length ?? 0) >= 2 &&
    (corpForm.contactFullName?.trim().length ?? 0) >= 2 &&
    (corpForm.mobileNo?.trim().length ?? 0) >= 5 &&
    !!corpForm.email && corpForm.email.includes("@") &&
    !!corpForm.industryType &&
    (corpForm.billingAddress?.trim().length ?? 0) >= 3 &&
    (corpForm.headOfficeAddress?.trim().length ?? 0) >= 3 &&
    !!corpForm.branch &&
    (corpForm.city?.trim().length ?? 0) >= 2 &&
    !!corpForm.cnicFrontFile &&
    !!corpForm.cnicBackFile &&
    !!corpForm.paymentTerms &&
    !!corpForm.billingMode &&
    parseFloat(corpForm.bandwidthMbps) > 0 &&
    (corpForm.billingMode === "fixed"
      ? parseFloat(corpMonthlyBase) > 0
      : parseFloat(corpForm.perMbpsRate) > 0) &&
    (corpOtcEnabled ? parseFloat(corpOtcAmount) > 0 : true);

  const handleCorpSave = (opts: { activate?: boolean } = {}) => {
    if (!corpForm.companyName || corpForm.companyName.trim().length < 2) {
      toast({ title: "Company Name required", description: "Please enter the company name", variant: "destructive" }); return;
    }
    if (!corpForm.contactFullName || corpForm.contactFullName.trim().length < 2) {
      toast({ title: "Full Name required", description: "Please enter the contact person's full name", variant: "destructive" }); return;
    }
    if (!corpForm.mobileNo || corpForm.mobileNo.trim().length < 5) {
      toast({ title: "Mobile No. required", description: "Please enter a valid mobile number", variant: "destructive" }); return;
    }
    if (!corpForm.email || !corpForm.email.includes("@")) {
      toast({ title: "Email required", description: "Please enter a valid email address", variant: "destructive" }); return;
    }
    if (!corpForm.industryType) {
      toast({ title: "Industry Type required", description: "Please select an industry type", variant: "destructive" }); return;
    }
    if (!corpForm.billingAddress || corpForm.billingAddress.trim().length < 3) {
      toast({ title: "Billing Address required", description: "Please enter the billing address", variant: "destructive" }); return;
    }
    if (!corpForm.headOfficeAddress || corpForm.headOfficeAddress.trim().length < 3) {
      toast({ title: "Head Office Address required", description: "Please enter the head office address", variant: "destructive" }); return;
    }
    if (!corpForm.branch) {
      toast({ title: "Branch required", description: "Please select a branch", variant: "destructive" }); return;
    }
    if (!corpForm.city || corpForm.city.trim().length < 2) {
      toast({ title: "City required", description: "Please enter the city", variant: "destructive" }); return;
    }
    if (!corpForm.cnicFrontFile) {
      toast({ title: "CNIC Front required", description: "Please upload the CNIC front image", variant: "destructive" }); return;
    }
    if (!corpForm.cnicBackFile) {
      toast({ title: "CNIC Back required", description: "Please upload the CNIC back image", variant: "destructive" }); return;
    }
    if (!corpForm.paymentTerms) {
      toast({ title: "Payment Terms required", description: "Please select payment terms", variant: "destructive" }); return;
    }
    if (!corpForm.billingMode) {
      toast({ title: "Billing Mode required", description: "Please select a billing mode", variant: "destructive" }); return;
    }
    if (!(parseFloat(corpForm.bandwidthMbps) > 0)) {
      toast({ title: "Bandwidth required", description: "Please enter the bandwidth in Mbps", variant: "destructive" }); return;
    }
    if (corpForm.billingMode === "fixed" && !(parseFloat(corpMonthlyBase) > 0)) {
      toast({ title: "Monthly Billing required", description: "Please enter the monthly billing amount", variant: "destructive" }); return;
    }
    if (corpForm.billingMode === "per_mbps" && !(parseFloat(corpForm.perMbpsRate) > 0)) {
      toast({ title: "Rate per Mbps required", description: "Please enter the rate per Mbps", variant: "destructive" }); return;
    }
    if (corpOtcEnabled && !(parseFloat(corpOtcAmount) > 0)) {
      toast({ title: "OTC Amount required", description: "Please enter the one-time charge amount", variant: "destructive" }); return;
    }
    saveCorpMutation.mutate(opts);
  };

  const cirRequiredComplete =
    (cirForm.companyName?.trim().length ?? 0) >= 2 &&
    (cirForm.contactPerson?.trim().length ?? 0) >= 2 &&
    (cirForm.cnic?.trim().length ?? 0) >= 5 &&
    (cirForm.phone?.trim().length ?? 0) >= 5 &&
    !!cirForm.email && cirForm.email.includes("@") &&
    !!cirForm.branch &&
    (cirForm.city?.trim().length ?? 0) >= 2 &&
    (cirForm.address?.trim().length ?? 0) >= 3 &&
    !!cirForm.customerType &&
    !!cirForm.serviceType &&
    !!cirForm.vendorId &&
    !!cirForm.linkType &&
    (cirForm.uplinkPort?.trim().length ?? 0) >= 1 &&
    !!cirForm.media &&
    (cirForm.committedBandwidth?.trim().length ?? 0) >= 1 &&
    (cirForm.staticIp?.trim().length ?? 0) >= 5 &&
    (cirForm.subnetMask?.trim().length ?? 0) >= 5 &&
    (cirForm.gateway?.trim().length ?? 0) >= 5 &&
    (cirForm.dns?.trim().length ?? 0) >= 3 &&
    (cirForm.dns2?.trim().length ?? 0) >= 3;

  const handleCirSave = (opts: { activate?: boolean } = {}) => {
    if (!cirForm.companyName || cirForm.companyName.trim().length < 2) {
      toast({ title: "Company Name required", description: "Please enter the company name", variant: "destructive" }); return;
    }
    if (!cirForm.contactPerson || cirForm.contactPerson.trim().length < 2) {
      toast({ title: "Full Name required", description: "Please enter the contact person's full name", variant: "destructive" }); return;
    }
    if (!cirForm.cnic || cirForm.cnic.trim().length < 5) {
      toast({ title: "CNIC No required", description: "Please enter a valid CNIC number", variant: "destructive" }); return;
    }
    if (!cirForm.phone || cirForm.phone.trim().length < 5) {
      toast({ title: "Mobile No required", description: "Please enter a valid mobile number", variant: "destructive" }); return;
    }
    if (!cirForm.email || !cirForm.email.includes("@")) {
      toast({ title: "Email required", description: "Please enter a valid email address", variant: "destructive" }); return;
    }
    if (!cirForm.branch) {
      toast({ title: "Branch required", description: "Please select a branch", variant: "destructive" }); return;
    }
    if (!cirForm.city || cirForm.city.trim().length < 2) {
      toast({ title: "City required", description: "Please enter the city", variant: "destructive" }); return;
    }
    if (!cirForm.address || cirForm.address.trim().length < 3) {
      toast({ title: "Address required", description: "Please enter the address", variant: "destructive" }); return;
    }
    saveCirMutation.mutate(opts);
  };

  const tabIndex = tabItems.findIndex(t => t.id === activeTab);
  const isLastTab = tabIndex === tabItems.length - 1;
  const isFirstTab = tabIndex === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-blue-950/10 dark:to-indigo-950/10">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(customerCategory === "corporate" ? "/corporate-customers" : customerCategory === "cir" ? "/cir-customers" : "/customers")}
            className="gap-2 text-muted-foreground hover:text-foreground"
            data-testid="button-back-customers"
          >
            <ChevronLeft className="h-4 w-4" />
            {customerCategory === "corporate" ? "Back to Corporate Customers" : customerCategory === "cir" ? "Back to CIR Customers" : "Back to Customers"}
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shadow-md ${
              customerCategory === "corporate" ? "bg-gradient-to-br from-[#002B5B] to-[#005EFF]" :
              customerCategory === "cir" ? "bg-gradient-to-br from-purple-600 to-indigo-600" :
              "bg-gradient-to-br from-blue-600 to-indigo-600"
            }`}>
              {customerCategory === "corporate" ? <Building2 className="h-5 w-5 text-white" /> :
               customerCategory === "cir" ? <Globe className="h-5 w-5 text-white" /> :
               <UserCheck className="h-5 w-5 text-white" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {customerCategory === "corporate" ? "Add Corporate Customer" : customerCategory === "cir" ? "Add CIR Customer" : "Add New Customer"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {customerCategory === "corporate" ? "Enterprise multi-branch client onboarding" : customerCategory === "cir" ? "Committed Information Rate dedicated link" : "Complete customer onboarding form"}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Type Selector — hidden when converting from a client request */}
        {!fromQueryId && !typeParam && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              { id: "normal",    label: "Customer",          sub: "Standard internet subscriber",        icon: User,      grad: "from-blue-600 to-indigo-600" },
              { id: "corporate", label: "Corporate Customer", sub: "Enterprise multi-branch client",      icon: Building2, grad: "from-[#002B5B] to-[#005EFF]" },
              { id: "cir",       label: "CIR Customer",       sub: "Committed Information Rate link",     icon: Globe,     grad: "from-purple-600 to-indigo-600" },
            ] as const).map(({ id, label, sub, icon: Icon, grad }) => (
              <button
                key={id}
                type="button"
                onClick={() => setCustomerCategory(id)}
                data-testid={`type-select-${id}`}
                className={`group relative flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  customerCategory === id
                    ? "border-transparent shadow-lg ring-2 ring-offset-1 ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30"
                    : "border-border/60 bg-white dark:bg-slate-900 hover:border-blue-300 hover:shadow-md"
                }`}
              >
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold leading-tight ${customerCategory === id ? "text-blue-700 dark:text-blue-300" : "text-foreground"}`}>{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{sub}</p>
                </div>
                {customerCategory === id && (
                  <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {fromQueryId && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>
              Converting client request <strong>#{fromQueryId}</strong>
              {fromQueryData && <> — <strong>{fromQueryData.name}</strong></>}
              {customerCategory !== "normal" && (
                <> &bull; <span className="font-semibold">{customerCategory === "corporate" ? "Corporate" : "CIR"}</span> customer type</>
              )}
              . Review the details below and save to complete the conversion.
            </span>
          </div>
        )}

        {customerCategory === "normal" && (
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
                    <label className="text-sm font-medium">CNIC / NID Number <span className="text-red-500">*</span></label>
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
                    <label className="text-sm font-medium">Email Address <span className="text-red-500">*</span></label>
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
                    <label className="text-sm font-medium">Customer Type <span className="text-red-500">*</span></label>
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
                    <label className="text-sm font-medium">Connection Installed By <span className="text-red-500">*</span></label>
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
                    <label className="text-sm font-medium">Username (PPPoE/Hotspot) <span className="text-red-500">*</span></label>
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
                          placeholder="Set password"
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
                      <label className="text-sm font-medium">Select Vendor <span className="text-red-500">*</span></label>
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
                      <label className="text-sm font-medium">Select Package <span className="text-red-500">*</span></label>
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
                    const basePrice   = parseFloat(selectedPackage.price ?? "0") || 0;
                    const whtPct      = parseFloat(selectedPackage.whTax  ?? "0") || 0;
                    const aitPct      = parseFloat(selectedPackage.aitTax ?? "0") || 0;
                    const whtAmount   = (basePrice * whtPct)  / 100;
                    const aitAmount   = (basePrice * aitPct)  / 100;
                    const totalTax    = whtAmount + aitAmount;
                    const totalPrice  = basePrice + totalTax;
                    const hasTax      = whtPct > 0 || aitPct > 0;
                    return (
                      <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Package Details: {selectedPackage.name}</span>
                          <Badge variant="outline" className="text-xs ml-auto">{selectedPackage.billingCycle}</Badge>
                        </div>
                        {/* Basic info row */}
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

                        {/* Tax breakdown — only shown when package has tax values */}
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

                  {/* Additional Packages Section */}
                  <div className="mt-4 rounded-xl border border-dashed border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded bg-violet-600 flex items-center justify-center">
                          <Tv className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-violet-700 dark:text-violet-400">Additional Packages</span>
                        <span className="text-xs text-muted-foreground ml-1">Cable TV / IPTV / OTT bundle</span>
                      </div>
                      <button
                        type="button"
                        data-testid="btn-add-another-package"
                        onClick={() => setAddlPkgs(prev => [...prev, { packageId: "", bill: "" }])}
                        className="flex items-center gap-1.5 rounded-lg border border-violet-400 bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Another Package
                      </button>
                    </div>
                    {addlPkgs.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">No additional packages added. Click the button to add Cable TV, IPTV or OTT services.</p>
                    ) : (
                      <div className="space-y-2">
                        {addlPkgs.map((ap, idx) => {
                          return (
                            <div key={idx} className="flex items-center gap-2 bg-white dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-700 p-2">
                              <div className="flex-1 min-w-0">
                                <select
                                  data-testid={`select-addl-package-${idx}`}
                                  value={ap.packageId}
                                  onChange={e => {
                                    const pkgId = e.target.value;
                                    const pkg = packages?.find(p => String(p.id) === pkgId);
                                    const base = parseFloat(pkg?.price ?? "0") || 0;
                                    const wht  = parseFloat(pkg?.whTax ?? "0") || 0;
                                    const ait  = parseFloat(pkg?.aitTax ?? "0") || 0;
                                    const bill = (base + (base*wht/100) + (base*ait/100)).toFixed(2);
                                    setAddlPkgs(prev => prev.map((x, i) => i === idx ? { packageId: pkgId, bill: pkgId ? bill : "" } : x));
                                  }}
                                  className="w-full h-8 rounded-md border border-violet-300 dark:border-violet-600 bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                >
                                  <option value="">-- Select Package --</option>
                                  {packages?.filter(p => p.serviceType && p.serviceType !== "internet").map(p => (
                                    <option key={p.id} value={String(p.id)}>{p.name} ({p.serviceType?.toUpperCase()})</option>
                                  ))}
                                </select>
                              </div>
                              <div className="w-32 shrink-0">
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-violet-600 font-semibold pointer-events-none">PKR</span>
                                  <Input
                                    type="number"
                                    data-testid={`input-addl-bill-${idx}`}
                                    placeholder="0.00"
                                    value={ap.bill}
                                    onChange={e => setAddlPkgs(prev => prev.map((x, i) => i === idx ? { ...x, bill: e.target.value } : x))}
                                    className="pl-10 h-8 text-sm border-violet-300 dark:border-violet-600 focus-visible:ring-violet-400"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                data-testid={`btn-remove-addl-package-${idx}`}
                                onClick={() => setAddlPkgs(prev => prev.filter((_, i) => i !== idx))}
                                className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                        {addlPkgsTotal > 0 && (
                          <div className="flex justify-end pt-1">
                            <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">Subtotal: PKR {addlPkgsTotal.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Device Section */}
                  <div className="mt-4 rounded-xl border border-dashed border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-5 w-5 rounded bg-sky-600 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">D</span>
                      </div>
                      <span className="text-sm font-semibold text-sky-700 dark:text-sky-400">Device</span>
                      <span className="text-xs text-muted-foreground ml-1">Device type, details & one-time charge</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-sky-700 dark:text-sky-400">Device Type</label>
                        <select
                          value={form.deviceType}
                          onChange={e => update("deviceType", e.target.value)}
                          data-testid="select-device-type-billing"
                          className="w-full h-9 rounded-md border border-sky-300 dark:border-sky-700 bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                        >
                          <option value="">-- Select Device --</option>
                          <option value="ONT">ONT</option>
                          <option value="Router">Router</option>
                          <option value="Wireless Router">Wireless Router</option>
                          <option value="Switch">Switch</option>
                          <option value="Media Converter">Media Converter</option>
                          <option value="OLT">OLT</option>
                          <option value="GPON">GPON</option>
                          <option value="Set Top Box">Set Top Box</option>
                          <option value="Android Box">Android Box</option>
                          <option value="Other">Other</option>
                        </select>
                        <p className="text-[11px] text-muted-foreground">Type of device provided to customer</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-sky-700 dark:text-sky-400">Device Details</label>
                        <Input
                          type="text"
                          placeholder="e.g. Huawei HG8245H5, S/N: 12345"
                          value={form.deviceDetail}
                          onChange={e => update("deviceDetail", e.target.value)}
                          data-testid="input-device-detail-billing"
                          className="border-sky-300 dark:border-sky-700 focus-visible:ring-sky-400"
                        />
                        <p className="text-[11px] text-muted-foreground">Model, serial number, or any relevant detail</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-sky-700 dark:text-sky-400">Device Charges (PKR)</label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={form.deviceCharges}
                            onChange={e => update("deviceCharges", e.target.value)}
                            data-testid="input-device-charges"
                            className="pr-9 border-sky-300 dark:border-sky-700 focus-visible:ring-sky-400"
                          />
                          <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-500" />
                        </div>
                        <p className="text-[11px] text-muted-foreground">One-time device cost included in first payment</p>
                      </div>
                    </div>

                    {/* Main device installment toggle */}
                    {parseFloat(form.deviceCharges) > 0 && (
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          type="button"
                          data-testid="btn-main-device-installment"
                          onClick={() => {
                            const next = !mainDeviceInstallmentEnabled;
                            setMainDeviceInstallmentEnabled(next);
                            if (!next && !installationInstallmentEnabled && !addlDevices.some(d => d.installmentEnabled)) {
                              update("installmentEnabled", false);
                            }
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                            mainDeviceInstallmentEnabled
                              ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                              : "bg-white dark:bg-background border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:border-amber-500"
                          }`}
                        >
                          {mainDeviceInstallmentEnabled ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          Installment Allow
                          {mainDeviceInstallmentEnabled && (
                            <span className="ml-1 text-[10px] bg-white/25 rounded px-1">PKR {parseFloat(form.deviceCharges).toFixed(2)}</span>
                          )}
                        </button>
                        {mainDeviceInstallmentEnabled && (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400">Device charge added to installment plan</span>
                        )}
                      </div>
                    )}

                    {/* Additional Devices */}
                    {addlDevices.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-sky-600 dark:text-sky-400">Additional Devices</p>
                        {addlDevices.map((ad, idx) => (
                          <div key={idx} className="bg-white dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-700 p-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <select
                                  data-testid={`select-addl-device-type-${idx}`}
                                  value={ad.deviceType}
                                  onChange={e => setAddlDevices(prev => prev.map((x, i) => i === idx ? { ...x, deviceType: e.target.value } : x))}
                                  className="w-full h-8 rounded-md border border-sky-300 dark:border-sky-600 bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                                >
                                  <option value="">-- Device Type --</option>
                                  <option value="ONT">ONT</option>
                                  <option value="Router">Router</option>
                                  <option value="Wireless Router">Wireless Router</option>
                                  <option value="Switch">Switch</option>
                                  <option value="Media Converter">Media Converter</option>
                                  <option value="OLT">OLT</option>
                                  <option value="GPON">GPON</option>
                                  <option value="Set Top Box">Set Top Box</option>
                                  <option value="Android Box">Android Box</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              <div className="flex-1 min-w-0">
                                <Input
                                  type="text"
                                  data-testid={`input-addl-device-detail-${idx}`}
                                  placeholder="Model / S/N"
                                  value={ad.deviceDetail}
                                  onChange={e => setAddlDevices(prev => prev.map((x, i) => i === idx ? { ...x, deviceDetail: e.target.value } : x))}
                                  className="h-8 text-sm border-sky-300 dark:border-sky-600 focus-visible:ring-sky-400"
                                />
                              </div>
                              <div className="w-28 shrink-0">
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-sky-600 font-semibold pointer-events-none">PKR</span>
                                  <Input
                                    type="number"
                                    data-testid={`input-addl-device-charges-${idx}`}
                                    placeholder="0.00"
                                    value={ad.deviceCharges}
                                    onChange={e => setAddlDevices(prev => prev.map((x, i) => i === idx ? { ...x, deviceCharges: e.target.value } : x))}
                                    className="pl-10 h-8 text-sm border-sky-300 dark:border-sky-600 focus-visible:ring-sky-400"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                data-testid={`btn-remove-addl-device-${idx}`}
                                onClick={() => setAddlDevices(prev => prev.filter((_, i) => i !== idx))}
                                className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            {/* Per-device installment toggle */}
                            {parseFloat(ad.deviceCharges) > 0 && (
                              <div className="flex items-center gap-2 pl-1">
                                <button
                                  type="button"
                                  data-testid={`btn-addl-device-installment-${idx}`}
                                  onClick={() => setAddlDevices(prev => prev.map((x, i) => i === idx ? { ...x, installmentEnabled: !x.installmentEnabled } : x))}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-all ${
                                    ad.installmentEnabled
                                      ? "bg-amber-500 border-amber-500 text-white"
                                      : "bg-amber-50 dark:bg-transparent border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:border-amber-500"
                                  }`}
                                >
                                  {ad.installmentEnabled ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                  Installment Allow
                                  {ad.installmentEnabled && <span className="text-[10px] bg-white/25 rounded px-1">PKR {parseFloat(ad.deviceCharges).toFixed(2)}</span>}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        {addlDevicesTotal > 0 && (
                          <div className="flex justify-end">
                            <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">Devices subtotal: PKR {addlDevicesTotal.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        data-testid="btn-add-device"
                        onClick={() => setAddlDevices(prev => [...prev, { deviceType: "", deviceDetail: "", deviceCharges: "", installmentEnabled: false }])}
                        className="flex items-center gap-1.5 rounded-lg border border-sky-400 bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Device
                      </button>
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

                  {/* Installation charges installment toggle */}
                  {parseFloat(form.finalInstallationCharges) > 0 && (
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        type="button"
                        data-testid="btn-installation-installment"
                        onClick={() => {
                          const next = !installationInstallmentEnabled;
                          setInstallationInstallmentEnabled(next);
                          if (!next && !mainDeviceInstallmentEnabled && !addlDevices.some(d => d.installmentEnabled)) {
                            update("installmentEnabled", false);
                          }
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                          installationInstallmentEnabled
                            ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                            : "bg-white dark:bg-background border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:border-amber-500"
                        }`}
                      >
                        {installationInstallmentEnabled ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        Installment Allow
                        {installationInstallmentEnabled && (
                          <span className="ml-1 text-[10px] bg-white/25 rounded px-1">PKR {parseFloat(form.finalInstallationCharges).toFixed(2)}</span>
                        )}
                      </button>
                      {installationInstallmentEnabled && (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400">Installation charge added to installment plan</span>
                      )}
                    </div>
                  )}

                  {/* Add-on Services */}
                  <div className="mt-4 rounded-xl border border-dashed border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">Add-on Services</span>
                      <span className="text-xs text-muted-foreground ml-1">Optional recurring charges</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {/* Static IP toggle button */}
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

                    {/* Static IP MRC field */}
                    {form.staticIpEnabled && (
                      <div className="mt-3 flex items-end gap-3">
                        <div className="space-y-1.5 flex-1 max-w-xs">
                          <label className="text-sm font-medium text-purple-700 dark:text-purple-400">
                            Static IP — MRC (PKR) <span className="text-red-500">*</span>
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
                            onClick={() => {
                              update("installmentEnabled", false);
                              setMainDeviceInstallmentEnabled(false);
                              setInstallationInstallmentEnabled(false);
                              setAddlDevices(prev => prev.map(d => ({ ...d, installmentEnabled: false })));
                            }}
                            className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1"
                            data-testid="btn-remove-installment"
                          >
                            <X className="h-3.5 w-3.5" /> Remove
                          </button>
                        </div>

                        {/* Auto-source breakdown */}
                        {(mainDeviceInstallmentEnabled || installationInstallmentEnabled || addlDevices.some(d => d.installmentEnabled)) ? (
                          <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 p-3 space-y-1.5">
                            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Auto-computed from selected items</p>
                            {mainDeviceInstallmentEnabled && parseFloat(form.deviceCharges) > 0 && (
                              <div className="flex justify-between text-xs text-amber-800 dark:text-amber-300">
                                <span>Main Device ({form.deviceType || "Device"})</span>
                                <span className="font-semibold">PKR {parseFloat(form.deviceCharges).toFixed(2)}</span>
                              </div>
                            )}
                            {addlDevices.filter(d => d.installmentEnabled && parseFloat(d.deviceCharges) > 0).map((d, i) => (
                              <div key={i} className="flex justify-between text-xs text-amber-800 dark:text-amber-300">
                                <span>Additional Device {i + 1} ({d.deviceType || "Device"})</span>
                                <span className="font-semibold">PKR {parseFloat(d.deviceCharges).toFixed(2)}</span>
                              </div>
                            ))}
                            {installationInstallmentEnabled && parseFloat(form.finalInstallationCharges) > 0 && (
                              <div className="flex justify-between text-xs text-amber-800 dark:text-amber-300">
                                <span>Installation Charges</span>
                                <span className="font-semibold">PKR {parseFloat(form.finalInstallationCharges).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs font-bold text-amber-900 dark:text-amber-200 pt-1 border-t border-amber-300 dark:border-amber-600">
                              <span>Total</span>
                              <span>PKR {form.installmentTotalAmount || "0.00"}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-1">
                            <div className="space-y-1.5">
                              <label className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                Installment For <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={form.installmentType}
                                onChange={e => update("installmentType", e.target.value)}
                                data-testid="select-installment-type"
                                className="w-full h-9 rounded-md border border-amber-300 dark:border-amber-700 bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                              >
                                <option value="">-- Select Type --</option>
                                <option value="Device">Device</option>
                                <option value="Installation">Installation</option>
                              </select>
                              <p className="text-[11px] text-muted-foreground">
                                {form.installmentType === "Installation"
                                  ? "Total will auto-fill from Final Installation Charges"
                                  : "Or use Installment Allow buttons above to auto-fill"}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-amber-700 dark:text-amber-400">
                              Total Amount (PKR) <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              placeholder="e.g. 12000"
                              value={form.installmentTotalAmount}
                              readOnly={mainDeviceInstallmentEnabled || installationInstallmentEnabled || addlDevices.some(d => d.installmentEnabled) || form.installmentType === "Installation"}
                              onChange={e => update("installmentTotalAmount", e.target.value)}
                              data-testid="input-installment-total"
                              className={`border-amber-300 dark:border-amber-700 focus-visible:ring-amber-400 ${(mainDeviceInstallmentEnabled || installationInstallmentEnabled || addlDevices.some(d => d.installmentEnabled) || form.installmentType === "Installation") ? "bg-amber-100 dark:bg-amber-900/30 cursor-not-allowed" : ""}`}
                            />
                            <p className="text-[11px] text-muted-foreground">
                              {(mainDeviceInstallmentEnabled || installationInstallmentEnabled || addlDevices.some(d => d.installmentEnabled))
                                ? "Auto-filled from Installment Allow selections above"
                                : form.installmentType === "Installation" ? "Auto-filled from Final Installation Charges" : "Device / installation cost to recover"}
                            </p>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-amber-700 dark:text-amber-400">Installments Already Paid</label>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={form.installmentPaidMonths}
                              onChange={e => update("installmentPaidMonths", e.target.value)}
                              data-testid="input-installment-paid"
                              className="border-amber-300 dark:border-amber-700 focus-visible:ring-amber-400"
                            />
                            <p className="text-[11px] text-muted-foreground">
                              Remaining: {Math.max(0, (parseInt(form.installmentMonths, 10) || 0) - (parseInt(form.installmentPaidMonths, 10) || 0))} of {form.installmentMonths || 0} installments
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-amber-700 dark:text-amber-400">Note</label>
                            <textarea
                              placeholder="e.g. Customer took Huawei HG8245 router — PKR 12,000 over 6 months"
                              value={form.installmentNote}
                              onChange={e => update("installmentNote", e.target.value)}
                              data-testid="textarea-installment-note"
                              rows={3}
                              className="w-full rounded-md border border-amber-300 dark:border-amber-700 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                            />
                            <p className="text-[11px] text-muted-foreground">Optional: device name, model, agreement details, etc.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Grand Total = Final Package Bill + Final Installation Charges + Static IP MRC (editable) */}
                  <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shadow-md">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <Calculator className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Grand Total (First Payment)</p>
                        <p className="text-[11px] text-blue-200 space-x-1">
                          <span>PKR {(parseFloat(form.finalPackageBill) || 0).toFixed(2)} package</span>
                          {parseFloat(form.deviceCharges) > 0 && (
                            <>
                              <span>+</span>
                              <span>PKR {(parseFloat(form.deviceCharges) || 0).toFixed(2)} device</span>
                            </>
                          )}
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
                          {addlPkgsTotal > 0 && (
                            <>
                              <span>+</span>
                              <span>PKR {addlPkgsTotal.toFixed(2)} add-ons</span>
                            </>
                          )}
                          {addlDevicesTotal > 0 && (
                            <>
                              <span>+</span>
                              <span>PKR {addlDevicesTotal.toFixed(2)} extra devices</span>
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
                    <label className="text-sm font-medium">Joining Date <span className="text-red-500">*</span></label>
                    <Input
                      type="date"
                      value={form.joiningDate}
                      onChange={e => handleJoiningDateChange(e.target.value)}
                      data-testid="input-joining-date"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Expire Date (Auto-calculated)</label>
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
                    required
                    value={form.cnicFront}
                    onChange={v => update("cnicFront", v)}
                    testId="upload-cnic-front"
                  />
                  <FileUploadPreview
                    label="CNIC Back"
                    required
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
                    <label className="text-sm font-medium">Branch <span className="text-red-500">*</span></label>
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
                    <label className="text-sm font-medium">Area <span className="text-red-500">*</span></label>
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
                    <label className="text-sm font-medium">City <span className="text-red-500">*</span></label>
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
                    <label className="text-sm font-medium">Current Address <span className="text-red-500">*</span></label>
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
                    <label className="text-sm font-medium">Protocol Type <span className="text-red-500">*</span></label>
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
                    <label className="text-sm font-medium">Connection Type <span className="text-red-500">*</span></label>
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
                    <label className="text-sm font-medium">Device Type <span className="text-red-500">*</span></label>
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
                    <label className="text-sm font-medium">Device Serial No</label>
                    <Input
                      placeholder="e.g. SN123456789"
                      value={form.deviceMacSerial}
                      onChange={e => update("deviceMacSerial", e.target.value)}
                      data-testid="input-device-serial"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Device MAC Address</label>
                    <div className="relative">
                      <Input
                        placeholder="AA:BB:CC:DD:EE:FF"
                        value={form.macAddress}
                        onChange={e => update("macAddress", e.target.value)}
                        data-testid="input-mac-address"
                        className={errors.macAddress ? "border-red-500" : ""}
                        maxLength={17}
                      />
                      {form.macAddress && (
                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${validateMac(form.macAddress) ? "text-green-500" : "text-amber-500"}`}>
                          {validateMac(form.macAddress) ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        </div>
                      )}
                    </div>
                    {errors.macAddress && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.macAddress}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Device Owned By <span className="text-red-500">*</span></label>
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
                  {
                    id: "smsMobile", icon: Phone, label: "Mobile SMS Notification",
                    desc: "Send billing and service alerts via SMS",
                    field: "smsMobile" as const, color: "blue"
                  },
                  {
                    id: "smsWhatsapp", icon: Phone, label: "WhatsApp Notification",
                    desc: "Send messages through WhatsApp channel",
                    field: "smsWhatsapp" as const, color: "green"
                  },
                  {
                    id: "emailNotif", icon: Mail, label: "Email Notification",
                    desc: "Send invoices and alerts via email",
                    field: "emailNotif" as const, color: "indigo"
                  },
                  {
                    id: "inAppNotif", icon: Bell, label: "In-App Notification",
                    desc: "Push notifications in customer portal",
                    field: "inAppNotif" as const, color: "purple"
                  },
                  {
                    id: "sendSmsToEmployee", icon: UserCheck, label: "Send SMS to Employee",
                    desc: "Notify assigned technician when customer is added",
                    field: "sendSmsToEmployee" as const, color: "amber"
                  },
                  {
                    id: "sendGreetingSms", icon: Mail, label: "Send Greeting SMS",
                    desc: "Auto-send welcome message on signup",
                    field: "sendGreetingSms" as const, color: "rose"
                  },
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
        )}

        {/* ─── Corporate Customer Form ─── */}
        {customerCategory === "corporate" && (
          <div className="space-y-4">
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md rounded-2xl border border-border/60 shadow-sm p-1.5">
              <div className="flex gap-1 flex-wrap">
                {corpTabItems.map((tab, i) => {
                  const Icon = tab.icon;
                  const isActive = corpActiveTab === tab.id;
                  return (
                    <button key={tab.id} type="button" onClick={() => setCorpActiveTab(tab.id)} data-testid={`corp-tab-${tab.id}`}
                      className={`flex-1 min-w-fit flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-gradient-to-br from-[#002B5B] to-[#005EFF] text-white shadow-md" : "text-muted-foreground hover:bg-muted/60"}`}>
                      <Icon className="h-4 w-4" /><span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Company Info */}
            {corpActiveTab === "company" && (
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Company Information</CardTitle>
                      <CardDescription>Enterprise identity and primary contact details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Company Name <span className="text-red-500">*</span></label>
                      <Input
                        placeholder="e.g. Habib Industries Ltd"
                        value={corpForm.companyName}
                        onChange={e => updateCorp("companyName", e.target.value)}
                        data-testid="input-corp-company-name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Full Name <span className="text-red-500">*</span></label>
                      <Input
                        placeholder="Authorized contact person"
                        value={corpForm.contactFullName}
                        onChange={e => updateCorp("contactFullName", e.target.value)}
                        data-testid="input-corp-contact-fullname"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">NTN No.</label>
                      <Input
                        placeholder="XXXXXXX-X"
                        value={corpForm.ntn}
                        onChange={e => updateCorp("ntn", e.target.value)}
                        data-testid="input-corp-ntn"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Mobile No. <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="03XX-XXXXXXX"
                          value={corpForm.mobileNo}
                          onChange={e => updateCorp("mobileNo", e.target.value)}
                          data-testid="input-corp-mobile"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Phone No.</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="021-XXXXXXXX"
                          value={corpForm.phone}
                          onChange={e => updateCorp("phone", e.target.value)}
                          data-testid="input-corp-phone"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="accounts@company.com"
                          value={corpForm.email}
                          onChange={e => updateCorp("email", e.target.value)}
                          data-testid="input-corp-email"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-medium">Industry Type <span className="text-red-500">*</span></label>
                      <Select value={corpForm.industryType} onValueChange={v => updateCorp("industryType", v)}>
                        <SelectTrigger data-testid="select-corp-industry"><SelectValue placeholder="Select industry type" /></SelectTrigger>
                        <SelectContent>
                          {industryOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-sm">Address & Location</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium">Billing Address <span className="text-red-500">*</span></label>
                        <Textarea rows={2} placeholder="Full billing address" value={corpForm.billingAddress} onChange={e => updateCorp("billingAddress", e.target.value)} data-testid="input-corp-billing-address" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium">Head Office Address <span className="text-red-500">*</span></label>
                        <Textarea rows={2} placeholder="Full head office address" value={corpForm.headOfficeAddress} onChange={e => updateCorp("headOfficeAddress", e.target.value)} data-testid="input-corp-head-address" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Branch <span className="text-red-500">*</span></label>
                        <Select value={corpForm.branch} onValueChange={v => {
                          updateCorp("branch", v);
                          const selectedBr = branches?.find(b => b.name === v);
                          if (selectedBr?.city) updateCorp("city", selectedBr.city);
                        }}>
                          <SelectTrigger data-testid="select-corp-branch"><SelectValue placeholder="Select branch" /></SelectTrigger>
                          <SelectContent>
                            {branches?.map(b => (
                              <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">City <span className="text-red-500">*</span></label>
                        <Input
                          placeholder="e.g. Karachi"
                          value={corpForm.city}
                          onChange={e => updateCorp("city", e.target.value)}
                          data-testid="input-corp-city"
                        />
                      </div>
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
                        onClick={handleCorpGetGps}
                        disabled={gpsLocating}
                        data-testid="button-corp-get-gps"
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
                          value={corpForm.mapLatitude}
                          onChange={e => updateCorp("mapLatitude", e.target.value)}
                          data-testid="input-corp-latitude"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Map Longitude</label>
                        <Input
                          placeholder="e.g. 73.0931"
                          value={corpForm.mapLongitude}
                          onChange={e => updateCorp("mapLongitude", e.target.value)}
                          data-testid="input-corp-longitude"
                        />
                      </div>
                    </div>
                    {corpForm.mapLatitude && corpForm.mapLongitude && (
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2 text-xs border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
                          onClick={() => window.open(`https://www.google.com/maps?q=${corpForm.mapLatitude},${corpForm.mapLongitude}`, "_blank")}
                          data-testid="button-corp-view-map"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          View on Map
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Enter GPS coordinates manually or click "Get GPS Location" to auto-detect
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Billing & Terms */}
            {corpActiveTab === "billing" && (
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Billing & Payment Terms</CardTitle>
                      <CardDescription>Financial settings, charges and invoice configuration for this corporate account</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* ── Account & Status ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Account Manager</label>
                      <Select value={corpForm.accountManager} onValueChange={v => updateCorp("accountManager", v)}>
                        <SelectTrigger data-testid="select-corp-account-manager-billing"><SelectValue placeholder="Select account manager" /></SelectTrigger>
                        <SelectContent>
                          {employees?.map(emp => (
                            <SelectItem key={emp.id} value={emp.fullName}>{emp.fullName} — {emp.designation}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground">Primary contact managing this account</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Account Status</label>
                      <Select value={corpForm.status} onValueChange={v => updateCorp("status", v)}>
                        <SelectTrigger data-testid="select-corp-status"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground">Current billing and service status</p>
                    </div>
                  </div>

                  <Separator />

                  {/* ── Monthly Billing & Terms ── */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-sm">Monthly Billing & Payment Terms</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Payment Terms<span className="text-red-500 ml-0.5">*</span></label>
                        <Select value={corpForm.paymentTerms} onValueChange={v => updateCorp("paymentTerms", v)}>
                          <SelectTrigger data-testid="select-corp-payment-terms"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="net_15">Net 15 — Due in 15 days</SelectItem>
                            <SelectItem value="net_30">Net 30 — Due in 30 days</SelectItem>
                            <SelectItem value="net_45">Net 45 — Due in 45 days</SelectItem>
                            <SelectItem value="net_60">Net 60 — Due in 60 days</SelectItem>
                            <SelectItem value="advance">Advance — Pay before service</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">Invoice due-date policy for this account</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="text-sm font-medium mb-2 block">Billing Mode<span className="text-red-500 ml-0.5">*</span></label>
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          { id: "fixed", label: "Fixed MRC", desc: "Fixed monthly recurring charge" },
                          { id: "per_mbps", label: "Per Mbps Rate", desc: "Bandwidth × rate per Mbps" },
                        ] as const).map(({ id, label, desc }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => updateCorp("billingMode", id)}
                            data-testid={`btn-corp-billing-mode-${id}`}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                              corpForm.billingMode === id
                                ? "border-green-500 bg-green-50 dark:bg-green-950/20 shadow-md ring-1 ring-green-400"
                                : "border-border/60 bg-white dark:bg-slate-900 hover:border-green-300"
                            }`}
                          >
                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                              corpForm.billingMode === id ? "border-green-600 bg-green-600" : "border-gray-400"
                            }`}>
                              {corpForm.billingMode === id && <Check className="h-2.5 w-2.5 text-white" />}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${corpForm.billingMode === id ? "text-green-700 dark:text-green-400" : "text-foreground"}`}>{label}</p>
                              <p className="text-xs text-muted-foreground">{desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {corpForm.billingMode === "fixed" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Bandwidth (Mbps)<span className="text-red-500 ml-0.5">*</span></label>
                            <Input
                              type="number"
                              placeholder="e.g. 100"
                              value={corpForm.bandwidthMbps}
                              onChange={e => updateCorp("bandwidthMbps", e.target.value)}
                              data-testid="input-corp-bandwidth-mbps"
                            />
                            <p className="text-[11px] text-muted-foreground">Total allocated bandwidth in Mbps</p>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium">Monthly Billing (Rs.)<span className="text-red-500 ml-0.5">*</span></label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={corpMonthlyBase}
                              onChange={e => setCorpMonthlyBase(e.target.value)}
                              data-testid="input-corp-monthly-billing"
                            />
                            <p className="text-[11px] text-muted-foreground">Fixed monthly recurring charge amount</p>
                          </div>
                        </div>
                      )}

                      {corpForm.billingMode === "per_mbps" && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-sm font-medium">Bandwidth (Mbps)<span className="text-red-500 ml-0.5">*</span></label>
                              <Input
                                type="number"
                                placeholder="e.g. 100"
                                value={corpForm.bandwidthMbps}
                                onChange={e => updateCorp("bandwidthMbps", e.target.value)}
                                data-testid="input-corp-bandwidth-mbps"
                              />
                              <p className="text-[11px] text-muted-foreground">Total allocated bandwidth in Mbps</p>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-sm font-medium">Rate per Mbps (Rs.)<span className="text-red-500 ml-0.5">*</span></label>
                              <Input
                                type="number"
                                placeholder="e.g. 250"
                                value={corpForm.perMbpsRate}
                                onChange={e => updateCorp("perMbpsRate", e.target.value)}
                                data-testid="input-corp-per-mbps-rate"
                              />
                              <p className="text-[11px] text-muted-foreground">Monthly charge per Mbps</p>
                            </div>
                          </div>
                          {corpPerMbpsCalculated > 0 && (
                            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
                              <p className="text-xs text-muted-foreground mb-1">Calculated MRC</p>
                              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                                {corpForm.bandwidthMbps || "0"} Mbps × Rs. {corpForm.perMbpsRate || "0"} = Rs. {corpPerMbpsCalculated.toFixed(2)}
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Discount / Adjustment (Rs.)</label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={corpBillingDiscount}
                            onChange={e => setCorpBillingDiscount(e.target.value)}
                            data-testid="input-corp-billing-discount"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Final Monthly Billing</label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={corpFinalMonthly.toFixed(2)}
                              readOnly
                              data-testid="input-corp-final-monthly"
                              className="bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 font-semibold pr-9"
                            />
                            <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tax & Fees Section */}
                    <div className="mt-4 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded bg-amber-600 flex items-center justify-center">
                            <Calculator className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Tax & Fees</span>
                          <span className="text-xs text-muted-foreground ml-1">Select taxes from Package Module</span>
                        </div>
                        <div className="relative">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 text-xs border-amber-400 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950"
                            onClick={() => setCorpTaxDropdownOpen(v => !v)}
                            data-testid="button-corp-add-tax"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Tax
                          </Button>
                          {corpTaxDropdownOpen && (
                            <div className="absolute right-0 top-full mt-1 z-20 w-72 max-h-60 overflow-y-auto rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-900 shadow-lg p-2 space-y-1">
                              {billingTaxSettings.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4">No taxes configured. Add taxes in Package Module → Tax & Extra Fee.</p>
                              ) : (
                                billingTaxSettings.map(s => {
                                  const meta = parseTaxMeta(s.description);
                                  const isSelected = corpSelectedTaxIds.includes(s.id);
                                  const isPercent = meta.type !== "extra_fee";
                                  return (
                                    <button
                                      key={s.id}
                                      type="button"
                                      data-testid={`btn-corp-tax-option-${s.id}`}
                                      onClick={() => {
                                        if (isSelected) {
                                          setCorpSelectedTaxIds(prev => prev.filter(id => id !== s.id));
                                        } else {
                                          setCorpSelectedTaxIds(prev => [...prev, s.id]);
                                        }
                                      }}
                                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left text-sm transition-all ${
                                        isSelected
                                          ? "bg-amber-100 dark:bg-amber-900/30 border border-amber-400 dark:border-amber-600"
                                          : "hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent"
                                      }`}
                                    >
                                      <div className={`h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                        isSelected ? "border-amber-600 bg-amber-600" : "border-gray-400"
                                      }`}>
                                        {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground truncate">{meta.name || s.key}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {isPercent ? `${s.value}%` : `Rs. ${Number(s.value).toLocaleString()}`}
                                          {meta.type && <span className="ml-1 text-amber-600">({meta.type.replace(/_/g, " ")})</span>}
                                        </p>
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                              <div className="pt-1 border-t border-gray-100 dark:border-slate-700">
                                <Button
                                  type="button"
                                  size="sm"
                                  className="w-full h-7 text-xs"
                                  onClick={() => setCorpTaxDropdownOpen(false)}
                                  data-testid="button-corp-tax-done"
                                >
                                  Done
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {corpSelectedTaxIds.length > 0 && (
                        <div className="space-y-2">
                          {corpTaxLineItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{item.type.replace(/_/g, " ")}</Badge>
                                <span className="text-sm font-medium">{item.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({item.isPercent ? `${item.rate}%` : `Rs. ${item.rate.toLocaleString()}`})
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                                  Rs. {item.amount.toFixed(2)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setCorpSelectedTaxIds(prev => prev.filter(id => id !== item.id))}
                                  className="text-muted-foreground hover:text-red-500 transition-colors"
                                  data-testid={`btn-corp-remove-tax-${item.id}`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}

                          <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-700 flex justify-between items-center">
                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Total Tax & Fees</p>
                            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Rs. {corpTotalTax.toFixed(2)}</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Final Monthly (incl. Tax)</p>
                            <p className="text-sm font-bold text-green-700 dark:text-green-400">Rs. {corpFinalMonthly.toFixed(2)}</p>
                          </div>
                        </div>
                      )}

                      {corpSelectedTaxIds.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          No taxes applied. Click "Add Tax" to select from configured taxes.
                        </p>
                      )}
                    </div>

                    {/* Financial Limits */}
                    <div className="mt-4 rounded-xl border border-dashed border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/20 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-5 w-5 rounded bg-sky-600 flex items-center justify-center">
                          <Shield className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-sky-700 dark:text-sky-400">Financial Limits & Deposits</span>
                        <span className="text-xs text-muted-foreground ml-1">Credit exposure and security terms</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-sky-700 dark:text-sky-400">Credit Limit (Rs.)</label>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={corpForm.creditLimit}
                              onChange={e => updateCorp("creditLimit", e.target.value)}
                              data-testid="input-corp-credit-limit"
                              className="border-sky-300 dark:border-sky-700 focus-visible:ring-sky-400"
                            />
                            <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-500" />
                          </div>
                          <p className="text-[11px] text-muted-foreground">Maximum outstanding invoice balance allowed</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-sky-700 dark:text-sky-400">Security Deposit (Rs.)</label>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={corpForm.securityDeposit}
                              onChange={e => updateCorp("securityDeposit", e.target.value)}
                              data-testid="input-corp-security-deposit"
                              className="border-sky-300 dark:border-sky-700 focus-visible:ring-sky-400"
                            />
                            <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-500" />
                          </div>
                          <p className="text-[11px] text-muted-foreground">One-time refundable security amount</p>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Settings */}
                    <div className="mt-4 rounded-xl border border-dashed border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/20 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-5 w-5 rounded bg-violet-600 flex items-center justify-center">
                          <FileText className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-violet-700 dark:text-violet-400">Invoice Settings</span>
                        <span className="text-xs text-muted-foreground ml-1">Billing format and distribution rules</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700">
                          <div>
                            <p className="text-sm font-medium">Centralized Billing</p>
                            <p className="text-xs text-muted-foreground">Single consolidated invoice for all branches</p>
                          </div>
                          <Switch checked={corpForm.centralizedBilling} onCheckedChange={v => updateCorp("centralizedBilling", v)} data-testid="switch-corp-centralized-billing" />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700">
                          <div>
                            <p className="text-sm font-medium">Per-Branch Billing</p>
                            <p className="text-xs text-muted-foreground">Separate invoice generated for each branch</p>
                          </div>
                          <Switch checked={corpForm.perBranchBilling} onCheckedChange={v => updateCorp("perBranchBilling", v)} data-testid="switch-corp-per-branch-billing" />
                        </div>
                        <div className="space-y-1.5 pt-1">
                          <label className="text-sm font-medium text-violet-700 dark:text-violet-400">Custom Invoice Format</label>
                          <Input
                            placeholder="e.g. PDF with company letterhead, Excel breakdown"
                            value={corpForm.customInvoiceFormat}
                            onChange={e => updateCorp("customInvoiceFormat", e.target.value)}
                            data-testid="input-corp-invoice-format"
                            className="border-violet-300 dark:border-violet-700 focus-visible:ring-violet-400"
                          />
                          <p className="text-[11px] text-muted-foreground">Specify preferred invoice format or delivery method</p>
                        </div>
                      </div>
                    </div>

                    {/* Add-on Charges */}
                    <div className="mt-4 rounded-xl border border-dashed border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/20 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">Add-on Charges</span>
                        <span className="text-xs text-muted-foreground ml-1">Optional one-time or recurring charges</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          data-testid="btn-corp-addon-otc"
                          onClick={() => setCorpOtcEnabled(v => !v)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                            corpOtcEnabled
                              ? "bg-purple-600 border-purple-600 text-white shadow-md"
                              : "bg-white dark:bg-background border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 hover:border-purple-500"
                          }`}
                        >
                          {corpOtcEnabled ? <Check className="h-4 w-4" /> : <span className="font-bold text-base leading-none">+</span>}
                          OTC / One-Time Charge
                          {corpOtcEnabled && <Badge className="ml-1 bg-white/20 text-white text-[10px] px-1.5 py-0">Active</Badge>}
                        </button>

                        <button
                          type="button"
                          data-testid="btn-corp-addon-late-fee"
                          onClick={() => setCorpLateFeeEnabled(v => !v)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                            corpLateFeeEnabled
                              ? "bg-amber-600 border-amber-600 text-white shadow-md"
                              : "bg-white dark:bg-background border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:border-amber-500"
                          }`}
                        >
                          {corpLateFeeEnabled ? <Check className="h-4 w-4" /> : <span className="font-bold text-base leading-none">+</span>}
                          Late Fee Policy
                          {corpLateFeeEnabled && <Badge className="ml-1 bg-white/20 text-white text-[10px] px-1.5 py-0">Active</Badge>}
                        </button>
                      </div>

                      {/* OTC panel */}
                      {corpOtcEnabled && (
                        <div className="mt-3 flex items-end gap-3">
                          <div className="space-y-1.5 flex-1 max-w-xs">
                            <label className="text-sm font-medium text-purple-700 dark:text-purple-400">
                              One-Time Charge (Rs.) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={corpOtcAmount}
                                onChange={e => setCorpOtcAmount(e.target.value)}
                                data-testid="input-corp-otc-amount"
                                className="pr-9 border-purple-300 dark:border-purple-700 focus-visible:ring-purple-400"
                              />
                              <Calculator className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
                            </div>
                            <p className="text-[11px] text-muted-foreground">Setup fee or one-time activation charge</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCorpOtcEnabled(false)}
                            className="mb-6 text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1"
                            data-testid="btn-corp-remove-otc"
                          >
                            <X className="h-3.5 w-3.5" /> Remove
                          </button>
                        </div>
                      )}

                      {/* Late Fee panel */}
                      {corpLateFeeEnabled && (
                        <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Late Fee Policy</p>
                            <button
                              type="button"
                              onClick={() => setCorpLateFeeEnabled(false)}
                              className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1"
                              data-testid="btn-corp-remove-late-fee"
                            >
                              <X className="h-3.5 w-3.5" /> Remove
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-amber-700 dark:text-amber-400">Policy Description</label>
                            <textarea
                              placeholder="e.g. 2% per week after 7-day grace period"
                              value={corpForm.notes}
                              onChange={e => updateCorp("notes", e.target.value)}
                              data-testid="textarea-corp-late-fee-policy"
                              rows={2}
                              className="w-full rounded-md border border-amber-300 dark:border-amber-700 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                            />
                            <p className="text-[11px] text-muted-foreground">Describe late payment penalties and grace period</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Grand Total — First Invoice */}
                    <div className="mt-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 p-4 shadow-md">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                          <Calculator className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">First Invoice Total</p>
                          <p className="text-[11px] text-green-200 space-x-1">
                            <span>Rs. {corpFinalMonthly.toFixed(2)} monthly</span>
                            {parseFloat(corpForm.securityDeposit) > 0 && (
                              <><span>+</span><span>Rs. {parseFloat(corpForm.securityDeposit).toFixed(2)} security deposit</span></>
                            )}
                            {corpOtcEnabled && parseFloat(corpOtcAmount) > 0 && (
                              <><span>+</span><span>Rs. {parseFloat(corpOtcAmount).toFixed(2)} OTC</span></>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-green-700 pointer-events-none">Rs.</span>
                        <Input
                          type="number"
                          value={corpFirstPayment.toFixed(2)}
                          readOnly
                          data-testid="input-corp-first-payment"
                          className="pl-12 text-lg font-bold text-green-700 dark:text-green-700 bg-white border-0 h-12 shadow-inner"
                        />
                      </div>
                      <p className="text-[11px] text-green-200 mt-1.5 text-right">Auto-calculated from monthly + deposit + OTC charges</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contract & SLA */}
            {corpActiveTab === "sla" && (
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><Shield className="h-5 w-5 text-purple-600" /></div><div><CardTitle className="text-base">Contract & SLA</CardTitle><CardDescription>Service level agreement, contract details and document uploads</CardDescription></div></div></CardHeader>
                <CardContent className="space-y-6">

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Contract Duration</label>
                      <Select value={corpForm.contractDuration} onValueChange={v => updateCorp("contractDuration", v)}>
                        <SelectTrigger data-testid="select-corp-contract-duration"><SelectValue placeholder="Select duration" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6_months">6 Months</SelectItem>
                          <SelectItem value="12_months">12 Months (1 Year)</SelectItem>
                          <SelectItem value="18_months">18 Months</SelectItem>
                          <SelectItem value="24_months">24 Months (2 Years)</SelectItem>
                          <SelectItem value="36_months">36 Months (3 Years)</SelectItem>
                          <SelectItem value="48_months">48 Months (4 Years)</SelectItem>
                          <SelectItem value="60_months">60 Months (5 Years)</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Contract Start Date</label>
                      <Input type="date" value={corpForm.contractStartDate} onChange={e => {
                        updateCorp("contractStartDate", e.target.value);
                        if (e.target.value && corpForm.contractDuration && corpForm.contractDuration !== "custom") {
                          const months = parseInt(corpForm.contractDuration);
                          if (!isNaN(months)) {
                            const start = new Date(e.target.value);
                            start.setMonth(start.getMonth() + months);
                            updateCorp("contractExpiryDate", start.toISOString().split("T")[0]);
                          }
                        }
                      }} data-testid="input-corp-contract-start" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Contract Expiry Date</label>
                      <Input type="date" value={corpForm.contractExpiryDate} onChange={e => updateCorp("contractExpiryDate", e.target.value)} data-testid="input-corp-contract-expiry" />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Upload className="h-4 w-4 text-purple-600" />
                      Document Uploads
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {([
                        { key: "cnicFrontFile", label: "CNIC Front", required: true, accept: "image/*,.pdf", testId: "upload-corp-cnic-front" },
                        { key: "cnicBackFile", label: "CNIC Back", required: true, accept: "image/*,.pdf", testId: "upload-corp-cnic-back" },
                        { key: "contractFile", label: "Contract Form", required: false, accept: "image/*,.pdf,.doc,.docx", testId: "upload-corp-contract" },
                      ] as const).map(({ key, label, required, accept, testId }) => (
                        <div key={key} className="space-y-1.5">
                          <label className="text-sm font-medium">
                            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                          </label>
                          <div className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                            (corpForm as any)[key]
                              ? "border-green-400 bg-green-50 dark:bg-green-950/20"
                              : "border-border/60 bg-muted/10 hover:border-purple-400 hover:bg-purple-50/30 dark:hover:bg-purple-950/10"
                          }`}>
                            {(corpForm as any)[key] ? (
                              <div className="flex flex-col items-center gap-2">
                                {(corpForm as any)[key].match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                  <img src={(corpForm as any)[key]} alt={label} className="h-16 w-auto rounded-lg object-cover border" />
                                ) : (
                                  <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-green-600" />
                                  </div>
                                )}
                                <p className="text-xs text-green-700 dark:text-green-400 font-medium">Uploaded</p>
                                <button
                                  type="button"
                                  onClick={() => updateCorp(key, "")}
                                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                                  data-testid={`btn-remove-${testId}`}
                                >
                                  <X className="h-3 w-3" /> Remove
                                </button>
                              </div>
                            ) : (
                              <label className="cursor-pointer flex flex-col items-center gap-2">
                                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                  <Upload className="h-5 w-5 text-purple-600" />
                                </div>
                                <p className="text-xs text-muted-foreground">Click to upload</p>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept={accept}
                                  data-testid={testId}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                      const formData = new FormData();
                                      formData.append("file", file);
                                      const res = await fetch("/api/upload/document", { method: "POST", body: formData, credentials: "include" });
                                      if (!res.ok) throw new Error("Upload failed");
                                      const data = await res.json();
                                      updateCorp(key, data.url);
                                    } catch {
                                      updateCorp(key, "");
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-sm font-medium">Dedicated Account Manager</label><Input placeholder="Manager name" value={corpForm.dedicatedAccountManager} onChange={e => updateCorp("dedicatedAccountManager", e.target.value)} data-testid="input-corp-dedicated-manager" /></div>
                  </div>
                  <div className="space-y-1.5"><label className="text-sm font-medium">Custom SLA</label><Textarea rows={2} placeholder="e.g. 99.9% uptime, 4hr response" value={corpForm.customSla} onChange={e => updateCorp("customSla", e.target.value)} data-testid="input-corp-custom-sla" /></div>
                  <div className="space-y-1.5"><label className="text-sm font-medium">Custom Pricing Agreement</label><Textarea rows={2} placeholder="Special pricing notes or agreement details" value={corpForm.customPricingAgreement} onChange={e => updateCorp("customPricingAgreement", e.target.value)} data-testid="input-corp-pricing-agreement" /></div>
                  <div className="space-y-1.5"><label className="text-sm font-medium">Notes</label><Textarea rows={3} placeholder="Additional notes..." value={corpForm.notes} onChange={e => updateCorp("notes", e.target.value)} data-testid="input-corp-notes" /></div>
                </CardContent>
              </Card>
            )}

            {/* Value-Added Services */}
            {corpActiveTab === "services" && (
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><Zap className="h-5 w-5 text-amber-600" /></div><div><CardTitle className="text-base">Value-Added Services</CardTitle><CardDescription>Enterprise add-on services for this account</CardDescription></div></div></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: "managedRouter",   label: "Managed Router",    desc: "ISP-managed router with remote support" },
                    { key: "firewall",         label: "Firewall",          desc: "Hardware firewall protection" },
                    { key: "loadBalancer",     label: "Load Balancer",     desc: "Traffic distribution across links" },
                    { key: "dedicatedSupport", label: "Dedicated Support",  desc: "24/7 dedicated support line" },
                    { key: "backupLink",       label: "Backup Link",        desc: "Secondary redundant connection" },
                    { key: "monitoringSla",    label: "SLA Monitoring",     desc: "Active monitoring with SLA guarantees" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                      <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                      <Switch checked={corpForm[key as keyof typeof corpForm] as boolean} onCheckedChange={v => updateCorp(key, v)} data-testid={`switch-corp-${key}`} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ─── CIR Customer Form ─── */}
        {customerCategory === "cir" && (
          <div className="space-y-4">
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md rounded-2xl border border-border/60 shadow-sm p-1.5">
              <div className="flex gap-1 flex-wrap">
                {cirTabItems.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = cirActiveTab === tab.id;
                  return (
                    <button key={tab.id} type="button" onClick={() => setCirActiveTab(tab.id)} data-testid={`cir-tab-${tab.id}`}
                      className={`flex-1 min-w-fit flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md" : "text-muted-foreground hover:bg-muted/60"}`}>
                      <Icon className="h-4 w-4" /><span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Company Info */}
            {cirActiveTab === "company" && (
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><Building2 className="h-5 w-5 text-purple-600" /></div><div><CardTitle className="text-base">Company Information</CardTitle><CardDescription>CIR client identity and contact details</CardDescription></div></div></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Company Name<span className="text-red-500 ml-0.5">*</span></label>
                      <Input placeholder="Company name" value={cirForm.companyName} onChange={e => updateCir("companyName", e.target.value)} data-testid="input-cir-company-name" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">NTN No</label>
                      <Input placeholder="XXXXXXX-X" value={cirForm.ntn} onChange={e => updateCir("ntn", e.target.value)} data-testid="input-cir-ntn" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Full Name<span className="text-red-500 ml-0.5">*</span></label>
                      <Input placeholder="Primary contact full name" value={cirForm.contactPerson} onChange={e => updateCir("contactPerson", e.target.value)} data-testid="input-cir-contact-person" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">CNIC No<span className="text-red-500 ml-0.5">*</span></label>
                      <Input placeholder="XXXXX-XXXXXXX-X" value={cirForm.cnic} onChange={e => updateCir("cnic", e.target.value)} data-testid="input-cir-cnic" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Mobile No<span className="text-red-500 ml-0.5">*</span></label>
                      <Input placeholder="03XX-XXXXXXX" value={cirForm.phone} onChange={e => updateCir("phone", e.target.value)} data-testid="input-cir-phone" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Mobile No 2</label>
                      <Input placeholder="03XX-XXXXXXX" value={cirForm.mobileNo2} onChange={e => updateCir("mobileNo2", e.target.value)} data-testid="input-cir-mobile-no-2" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Email<span className="text-red-500 ml-0.5">*</span></label>
                      <Input type="email" placeholder="contact@company.com" value={cirForm.email} onChange={e => updateCir("email", e.target.value)} data-testid="input-cir-email" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Branch<span className="text-red-500 ml-0.5">*</span></label>
                      <Select value={cirForm.branch} onValueChange={v => {
                        updateCir("branch", v);
                        const selectedB = branches?.find(b => (b.name || String(b.id)) === v);
                        if (selectedB?.city) updateCir("city", selectedB.city);
                      }}>
                        <SelectTrigger data-testid="select-cir-branch"><SelectValue placeholder="Select branch" /></SelectTrigger>
                        <SelectContent>{(branches || []).map(b => <SelectItem key={b.id} value={b.name || String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">City<span className="text-red-500 ml-0.5">*</span></label>
                      <Input placeholder="City" value={cirForm.city} onChange={e => updateCir("city", e.target.value)} data-testid="input-cir-city" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Address<span className="text-red-500 ml-0.5">*</span></label>
                    <Textarea rows={2} placeholder="Full address" value={cirForm.address} onChange={e => updateCir("address", e.target.value)} data-testid="input-cir-address" />
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
                        onClick={handleCirGetGps}
                        disabled={gpsLocating}
                        data-testid="btn-cir-get-gps"
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
                          value={cirForm.mapLatitude}
                          onChange={e => updateCir("mapLatitude", e.target.value)}
                          data-testid="input-cir-latitude"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Map Longitude</label>
                        <Input
                          placeholder="e.g. 73.0931"
                          value={cirForm.mapLongitude}
                          onChange={e => updateCir("mapLongitude", e.target.value)}
                          data-testid="input-cir-longitude"
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
            )}

            {/* Network Details */}
            {cirActiveTab === "network" && (
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Network className="h-5 w-5 text-blue-600" /></div><div><CardTitle className="text-base">Network Details</CardTitle><CardDescription>CIR connection and IP configuration</CardDescription></div></div></CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-blue-600" />
                      Connection Configuration
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Customer Type<span className="text-red-500 ml-0.5">*</span></label>
                        <Select value={cirForm.customerType} onValueChange={v => updateCir("customerType", v)}>
                          <SelectTrigger data-testid="select-cir-customer-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Corporate">Corporate</SelectItem>
                            <SelectItem value="Enterprise">Enterprise</SelectItem>
                            <SelectItem value="SME">SME</SelectItem>
                            <SelectItem value="Government">Government</SelectItem>
                            <SelectItem value="ISP">ISP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Service Type<span className="text-red-500 ml-0.5">*</span></label>
                        <Select value={cirForm.serviceType} onValueChange={v => updateCir("serviceType", v)}>
                          <SelectTrigger data-testid="select-cir-service-type"><SelectValue placeholder="Select service" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Internet">Internet</SelectItem>
                            <SelectItem value="MPLS">MPLS</SelectItem>
                            <SelectItem value="P2P">P2P</SelectItem>
                            <SelectItem value="IPLC">IPLC</SelectItem>
                            <SelectItem value="Dark Fiber">Dark Fiber</SelectItem>
                            <SelectItem value="Colocation">Colocation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Vendor<span className="text-red-500 ml-0.5">*</span></label>
                        <Select value={cirForm.vendorId} onValueChange={v => updateCir("vendorId", v)}>
                          <SelectTrigger data-testid="select-cir-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                          <SelectContent>{(vendors || []).map(v => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Link Type<span className="text-red-500 ml-0.5">*</span></label>
                        <Select value={cirForm.linkType} onValueChange={v => updateCir("linkType", v)}>
                          <SelectTrigger data-testid="select-cir-link-type"><SelectValue placeholder="Select link type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Primary">Primary</SelectItem>
                            <SelectItem value="Secondary">Secondary</SelectItem>
                            <SelectItem value="Backup">Backup</SelectItem>
                            <SelectItem value="Redundant">Redundant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Uplink Port<span className="text-red-500 ml-0.5">*</span></label>
                        <Input placeholder="e.g. GE0/0/1" value={cirForm.uplinkPort} onChange={e => updateCir("uplinkPort", e.target.value)} data-testid="input-cir-uplink-port" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Media<span className="text-red-500 ml-0.5">*</span></label>
                        <Select value={cirForm.media} onValueChange={v => updateCir("media", v)}>
                          <SelectTrigger data-testid="select-cir-media"><SelectValue placeholder="Select media" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fiber">Fiber</SelectItem>
                            <SelectItem value="Copper">Copper</SelectItem>
                            <SelectItem value="Wireless">Wireless</SelectItem>
                            <SelectItem value="Microwave">Microwave</SelectItem>
                            <SelectItem value="Satellite">Satellite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-blue-600" />
                      Bandwidth & Speed
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Bandwidth (Mbps)<span className="text-red-500 ml-0.5">*</span></label>
                        <Input placeholder="e.g. 100" value={cirForm.committedBandwidth} onChange={e => updateCir("committedBandwidth", e.target.value)} data-testid="input-cir-committed-bw" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Upload Speed</label>
                        <Input placeholder="e.g. 100 Mbps" value={cirForm.uploadSpeed} onChange={e => updateCir("uploadSpeed", e.target.value)} data-testid="input-cir-upload-speed" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Download Speed</label>
                        <Input placeholder="e.g. 100 Mbps" value={cirForm.downloadSpeed} onChange={e => updateCir("downloadSpeed", e.target.value)} data-testid="input-cir-download-speed" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Vlan ID</label>
                        <Input placeholder="e.g. 100" value={cirForm.vlanId} onChange={e => updateCir("vlanId", e.target.value)} data-testid="input-cir-vlan-id" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      IP Configuration
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Static IP Address<span className="text-red-500 ml-0.5">*</span></label>
                        <Input placeholder="e.g. 192.168.1.1" value={cirForm.staticIp} onChange={e => updateCir("staticIp", e.target.value)} data-testid="input-cir-static-ip" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Subnet Mask<span className="text-red-500 ml-0.5">*</span></label>
                        <Input placeholder="e.g. 255.255.255.0" value={cirForm.subnetMask} onChange={e => updateCir("subnetMask", e.target.value)} data-testid="input-cir-subnet-mask" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Gateway<span className="text-red-500 ml-0.5">*</span></label>
                        <Input placeholder="e.g. 192.168.1.254" value={cirForm.gateway} onChange={e => updateCir("gateway", e.target.value)} data-testid="input-cir-gateway" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">DNS1<span className="text-red-500 ml-0.5">*</span></label>
                        <Input placeholder="e.g. 8.8.8.8" value={cirForm.dns} onChange={e => updateCir("dns", e.target.value)} data-testid="input-cir-dns" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">DNS2<span className="text-red-500 ml-0.5">*</span></label>
                        <Input placeholder="e.g. 8.8.4.4" value={cirForm.dns2} onChange={e => updateCir("dns2", e.target.value)} data-testid="input-cir-dns2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SLA & Billing */}
            {cirActiveTab === "billing" && (
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><DollarSign className="h-5 w-5 text-green-600" /></div><div><CardTitle className="text-base">SLA & Billing</CardTitle><CardDescription>Service level agreement and financial terms</CardDescription></div></div></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-sm font-medium">Contract Start Date</label><Input type="date" value={cirForm.contractStartDate} onChange={e => updateCir("contractStartDate", e.target.value)} data-testid="input-cir-contract-start" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Contract End Date</label><Input type="date" value={cirForm.contractEndDate} onChange={e => updateCir("contractEndDate", e.target.value)} data-testid="input-cir-contract-end" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">SLA Level</label><Input placeholder="e.g. 99.99% uptime" value={cirForm.slaLevel} onChange={e => updateCir("slaLevel", e.target.value)} data-testid="input-cir-sla-level" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Late Fee Policy</label><Input placeholder="e.g. 2% per month" value={cirForm.lateFeePolicy} onChange={e => updateCir("lateFeePolicy", e.target.value)} data-testid="input-cir-late-fee" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Monthly Charges (Rs.)</label><Input type="number" placeholder="0.00" value={cirForm.monthlyCharges} onChange={e => updateCir("monthlyCharges", e.target.value)} data-testid="input-cir-monthly-charges" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Installation Charges (Rs.)</label><Input type="number" placeholder="0.00" value={cirForm.installationCharges} onChange={e => updateCir("installationCharges", e.target.value)} data-testid="input-cir-installation-charges" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Security Deposit (Rs.)</label><Input type="number" placeholder="0.00" value={cirForm.securityDeposit} onChange={e => updateCir("securityDeposit", e.target.value)} data-testid="input-cir-security-deposit" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Billing Cycle</label>
                      <Select value={cirForm.billingCycle} onValueChange={v => updateCir("billingCycle", v)}><SelectTrigger data-testid="select-cir-billing-cycle"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="semi-annual">Semi-Annual</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Invoice Type</label>
                      <Select value={cirForm.invoiceType} onValueChange={v => updateCir("invoiceType", v)}><SelectTrigger data-testid="select-cir-invoice-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tax">Tax Invoice</SelectItem><SelectItem value="non-tax">Non-Tax</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Status</label>
                      <Select value={cirForm.status} onValueChange={v => updateCir("status", v)}><SelectTrigger data-testid="select-cir-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select>
                    </div>
                  </div>
                  <div className="space-y-1.5"><label className="text-sm font-medium">SLA Penalty Clause</label><Textarea rows={2} placeholder="Describe the SLA penalty clause" value={cirForm.slaPenaltyClause} onChange={e => updateCir("slaPenaltyClause", e.target.value)} data-testid="input-cir-sla-penalty" /></div>
                  <div className="flex items-center gap-3"><Switch checked={cirForm.autoRenewal} onCheckedChange={v => updateCir("autoRenewal", v)} data-testid="switch-cir-auto-renewal" /><div><p className="text-sm font-medium">Auto Renewal</p><p className="text-xs text-muted-foreground">Automatically renew contract at expiry</p></div></div>
                </CardContent>
              </Card>
            )}

            {/* Monitoring */}
            {cirActiveTab === "monitoring" && (
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"><Activity className="h-5 w-5 text-orange-600" /></div><div><CardTitle className="text-base">Monitoring & Network Profiles</CardTitle><CardDescription>Network monitoring and provisioning settings</CardDescription></div></div></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-sm font-medium">Radius Profile</label><Input placeholder="Radius profile name" value={cirForm.radiusProfile} onChange={e => updateCir("radiusProfile", e.target.value)} data-testid="input-cir-radius-profile" /></div>
                    <div className="space-y-1.5"><label className="text-sm font-medium">Bandwidth Profile Name</label><Input placeholder="Bandwidth profile" value={cirForm.bandwidthProfileName} onChange={e => updateCir("bandwidthProfileName", e.target.value)} data-testid="input-cir-bw-profile" /></div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: "monitoringEnabled", label: "Monitoring Enabled",  desc: "Enable active monitoring for this CIR link" },
                      { key: "snmpMonitoring",    label: "SNMP Monitoring",      desc: "Monitor via SNMP protocol" },
                      { key: "trafficAlerts",     label: "Traffic Alerts",       desc: "Send alerts on bandwidth threshold breach" },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                        <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                        <Switch checked={cirForm[key as keyof typeof cirForm] as boolean} onCheckedChange={v => updateCir(key, v)} data-testid={`switch-cir-${key}`} />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5"><label className="text-sm font-medium">Notes</label><Textarea rows={3} placeholder="Additional notes..." value={cirForm.notes} onChange={e => updateCir("notes", e.target.value)} data-testid="input-cir-notes" /></div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="sticky bottom-4 z-20">
          <div className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-md rounded-2xl border border-border/60 shadow-xl p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">

              {/* Normal customer: tab nav on the left */}
              {customerCategory === "normal" && (
                <div className="flex items-center gap-3">
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
              )}

              {/* Corporate/CIR: tab nav (company / billing / ...) */}
              {customerCategory === "corporate" && (
                <div className="flex items-center gap-3">
                  {corpTabItems.findIndex(t => t.id === corpActiveTab) > 0 && (
                    <Button variant="outline" onClick={() => { const i = corpTabItems.findIndex(t => t.id === corpActiveTab); setCorpActiveTab(corpTabItems[i-1].id); }} className="gap-2" data-testid="button-corp-prev-tab">
                      <ChevronLeft className="h-4 w-4" />Previous
                    </Button>
                  )}
                  {corpTabItems.findIndex(t => t.id === corpActiveTab) < corpTabItems.length - 1 && (
                    <Button variant="outline" onClick={() => { const i = corpTabItems.findIndex(t => t.id === corpActiveTab); setCorpActiveTab(corpTabItems[i+1].id); }} className="gap-2" data-testid="button-corp-next-tab">
                      Next<ChevronLeft className="h-4 w-4 rotate-180" />
                    </Button>
                  )}
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    Step {corpTabItems.findIndex(t => t.id === corpActiveTab) + 1} of {corpTabItems.length} — {corpTabItems.find(t => t.id === corpActiveTab)?.label}
                  </div>
                </div>
              )}
              {customerCategory === "cir" && (
                <div className="flex items-center gap-3">
                  {cirTabItems.findIndex(t => t.id === cirActiveTab) > 0 && (
                    <Button variant="outline" onClick={() => { const i = cirTabItems.findIndex(t => t.id === cirActiveTab); setCirActiveTab(cirTabItems[i-1].id); }} className="gap-2" data-testid="button-cir-prev-tab">
                      <ChevronLeft className="h-4 w-4" />Previous
                    </Button>
                  )}
                  {cirTabItems.findIndex(t => t.id === cirActiveTab) < cirTabItems.length - 1 && (
                    <Button variant="outline" onClick={() => { const i = cirTabItems.findIndex(t => t.id === cirActiveTab); setCirActiveTab(cirTabItems[i+1].id); }} className="gap-2" data-testid="button-cir-next-tab">
                      Next<ChevronLeft className="h-4 w-4 rotate-180" />
                    </Button>
                  )}
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    Step {cirTabItems.findIndex(t => t.id === cirActiveTab) + 1} of {cirTabItems.length} — {cirTabItems.find(t => t.id === cirActiveTab)?.label}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {customerCategory === "normal" && (
                  <>
                    {!isFormReady && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-2.5 py-1.5" data-testid="hint-required-fields">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{totalMissingCount} required field{totalMissingCount > 1 ? "s" : ""} missing</span>
                      </div>
                    )}
                    <Button variant="outline" onClick={() => handleSave({ addAnother: true })} disabled={!isFormReady || saveMutation.isPending} data-testid="button-save-add-another" className="text-sm disabled:opacity-50">Save & Add Another</Button>
                    <Button variant="outline" onClick={() => handleSave({ activate: true })} disabled={!isFormReady || saveMutation.isPending} data-testid="button-save-activate" className="text-sm border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 disabled:opacity-50">
                      <Zap className="h-3.5 w-3.5 mr-1.5" />Save & Activate
                    </Button>
                    <Button onClick={() => handleSave()} disabled={!isFormReady || saveMutation.isPending} data-testid="button-save-customer" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md gap-2 disabled:opacity-50">
                      {saveMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Save Customer
                    </Button>
                  </>
                )}
                {customerCategory === "corporate" && (
                  <>
                    <Button variant="outline" onClick={() => handleCorpSave({ activate: true })} disabled={!corpRequiredComplete || saveCorpMutation.isPending} data-testid="button-corp-save-activate" className="text-sm border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 disabled:opacity-50">
                      <Zap className="h-3.5 w-3.5 mr-1.5" />Save & Activate
                    </Button>
                    <Button onClick={() => handleCorpSave()} disabled={!corpRequiredComplete || saveCorpMutation.isPending} data-testid="button-corp-save" className="bg-gradient-to-br from-[#002B5B] to-[#005EFF] hover:opacity-90 text-white shadow-md gap-2 disabled:opacity-50">
                      {saveCorpMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Save Corporate Customer
                    </Button>
                  </>
                )}
                {customerCategory === "cir" && (
                  <>
                    <Button variant="outline" onClick={() => handleCirSave({ activate: true })} disabled={!cirRequiredComplete || saveCirMutation.isPending} data-testid="button-cir-save-activate" className="text-sm border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 disabled:opacity-50">
                      <Zap className="h-3.5 w-3.5 mr-1.5" />Save & Activate
                    </Button>
                    <Button onClick={() => handleCirSave()} disabled={!cirRequiredComplete || saveCirMutation.isPending} data-testid="button-cir-save" className="bg-gradient-to-br from-purple-600 to-indigo-600 hover:opacity-90 text-white shadow-md gap-2 disabled:opacity-50">
                      {saveCirMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Save CIR Customer
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Automation Progress Modal */}
      <Dialog open={autoModalOpen} onOpenChange={(open) => { if (!open && autoComplete) setAutoModalOpen(false); }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden" data-testid="modal-automation">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Smart Automation Running</h2>
                <p className="text-sm text-blue-100">Setting up {autoCustomerName || "new customer"}…</p>
              </div>
              {autoComplete && (
                <div className="ml-auto">
                  <CheckCircle2 className="h-8 w-8 text-green-300" />
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-5 space-y-3">
            {(customerCategory === "corporate" ? CORP_ADD_STEPS : customerCategory === "cir" ? CIR_ADD_STEPS : AUTOMATION_STEPS).map((stepDef) => {
              const step = autoSteps.find(s => s.step === stepDef.key);
              const status = step?.status ?? "pending";
              const Icon = stepDef.icon;
              return (
                <div key={stepDef.key}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 ${
                    status === "success" ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" :
                    status === "error"   ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" :
                    status === "skipped" ? "bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700" :
                    status === "running" ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" :
                    "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 opacity-50"
                  }`}
                  data-testid={`auto-step-${stepDef.key}`}
                >
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    status === "success" ? "bg-green-100 dark:bg-green-900" :
                    status === "error"   ? "bg-red-100 dark:bg-red-900" :
                    status === "skipped" ? "bg-gray-100 dark:bg-gray-800" :
                    status === "running" ? "bg-blue-100 dark:bg-blue-900 animate-pulse" :
                    "bg-gray-100 dark:bg-gray-800"
                  }`}>
                    {status === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {status === "error"   && <XCircle className="h-4 w-4 text-red-600" />}
                    {status === "skipped" && <SkipForward className="h-4 w-4 text-gray-400" />}
                    {status === "running" && <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />}
                    {status === "pending" && <Icon className="h-4 w-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${
                        status === "success" ? "text-green-700 dark:text-green-300" :
                        status === "error"   ? "text-red-700 dark:text-red-300" :
                        status === "skipped" ? "text-gray-500 dark:text-gray-400" :
                        status === "running" ? "text-blue-700 dark:text-blue-300" :
                        "text-gray-500 dark:text-gray-400"
                      }`}>{stepDef.label}</span>
                      {status === "success" && <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0">Done</Badge>}
                      {status === "error"   && <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-0">Failed</Badge>}
                      {status === "skipped" && <Badge className="text-[10px] bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-0">Skipped</Badge>}
                      {status === "running" && <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-0 animate-pulse">Running…</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step?.message || stepDef.description}</p>
                    {step?.data && status === "success" && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {step.data.invoiceNumber && <span className="text-[10px] bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded px-2 py-0.5 text-green-700 dark:text-green-300 font-mono">{step.data.invoiceNumber}</span>}
                        {step.data.taskCode     && <span className="text-[10px] bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded px-2 py-0.5 text-blue-700 dark:text-blue-300 font-mono">{step.data.taskCode}</span>}
                        {step.data.username     && <span className="text-[10px] bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded px-2 py-0.5 text-indigo-700 dark:text-indigo-300 font-mono">{step.data.username}</span>}
                        {step.data.assignedTo   && <span className="text-[10px] bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded px-2 py-0.5 text-purple-700 dark:text-purple-300">{step.data.assignedTo}</span>}
                        {step.data.channel      && <span className="text-[10px] bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded px-2 py-0.5 text-orange-700 dark:text-orange-300">{step.data.channel}</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Success Footer */}
          {autoComplete && (
            <div className="px-6 pb-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-4 border border-green-200 dark:border-green-800 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-bold text-green-700 dark:text-green-300">Automation Complete!</span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {autoSteps.filter(s => s.status === "success").length} of {autoSteps.length} workflows executed successfully.{" "}
                  {autoSteps.filter(s => s.status === "skipped").length > 0 && `${autoSteps.filter(s => s.status === "skipped").length} skipped.`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setAutoModalOpen(false);
                    setLocation(customerCategory === "corporate" ? "/corporate-customers" : customerCategory === "cir" ? "/cir-customers" : "/customers");
                  }}
                  data-testid="button-auto-go-customers"
                >
                  {customerCategory === "corporate" ? "View Corporate Customers" : customerCategory === "cir" ? "View CIR Customers" : "View All Customers"}
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-1.5"
                  onClick={() => {
                    setAutoModalOpen(false);
                    setLocation(customerCategory === "corporate" ? "/corporate-customers" : customerCategory === "cir" ? "/cir-customers" : "/customers");
                  }}
                  data-testid="button-auto-view-customer"
                >
                  <ArrowRight className="h-4 w-4" />
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
