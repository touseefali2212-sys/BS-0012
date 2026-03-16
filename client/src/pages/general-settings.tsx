import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GeneralSetting } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Settings, Building2, Globe, Server, DollarSign, Workflow, Palette,
  Save, RefreshCw, AlertTriangle, CheckCircle, Clock, Shield,
  Upload, Mail, Phone, MapPin, FileText, Lock, Monitor, Eye,
  Ruler, Hash, Calendar, Languages, CreditCard, Package, Bell,
  LayoutDashboard, Timer, KeyRound, HardDrive, Users, Warehouse,
  BarChart3, Type,
} from "lucide-react";

type SettingsMap = Record<string, string>;

const CATEGORIES = [
  { id: "company", label: "Company Profile", icon: Building2, description: "Organization identity & contact details" },
  { id: "localization", label: "Localization", icon: Globe, description: "Regional, timezone & formatting settings" },
  { id: "system", label: "System Defaults", icon: Server, description: "Global system behavior & security" },
  { id: "financial", label: "Financial Defaults", icon: DollarSign, description: "Tax, invoice & accounting defaults" },
  { id: "operational", label: "Operational", icon: Workflow, description: "Workflow & module preferences" },
  { id: "branding", label: "Branding & UI", icon: Palette, description: "Theme, layout & visual identity" },
];

function getStatusBadge(settings: SettingsMap, requiredKeys: string[]) {
  const filled = requiredKeys.filter(k => settings[k] && settings[k].trim() !== "");
  if (filled.length === 0 && requiredKeys.length > 0) return <Badge className="bg-red-100 text-red-700 text-[10px]">Missing</Badge>;
  if (filled.length < requiredKeys.length) return <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">Partial</Badge>;
  return <Badge className="bg-green-100 text-green-700 text-[10px]">Configured</Badge>;
}

export default function GeneralSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("company");
  const [settings, setSettings] = useState<SettingsMap>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: dbSettings = [], isLoading, isError } = useQuery<GeneralSetting[]>({
    queryKey: ["/api/general-settings"],
  });

  useEffect(() => {
    if (dbSettings.length > 0) {
      const map: SettingsMap = {};
      dbSettings.forEach(s => { map[s.settingKey] = s.settingValue || ""; });
      setSettings(map);
      setHasChanges(false);
    }
  }, [dbSettings]);

  const saveMutation = useMutation({
    mutationFn: async (settingsToSave: { settingKey: string; settingValue: string; category: string }[]) => {
      const res = await apiRequest("PUT", "/api/general-settings", {
        settings: settingsToSave.map(s => ({
          settingKey: s.settingKey,
          settingValue: s.settingValue,
          category: s.category,
        })),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/general-settings"] });
      toast({ title: "Settings saved successfully" });
      setHasChanges(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateSetting = useCallback((key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  function saveCategory(category: string, keys: string[]) {
    const toSave = keys.map(k => ({ settingKey: k, settingValue: settings[k] || "", category }));
    saveMutation.mutate(toSave);
  }

  function renderField(key: string, label: string, opts?: { type?: string; placeholder?: string; icon?: any; options?: { value: string; label: string }[]; description?: string }) {
    const Icon = opts?.icon;
    if (opts?.type === "switch") {
      return (
        <div className="flex items-center justify-between p-3 rounded-lg border" key={key}>
          <div className="flex items-center gap-3">
            {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
            <div>
              <p className="text-sm font-medium">{label}</p>
              {opts?.description && <p className="text-xs text-muted-foreground">{opts.description}</p>}
            </div>
          </div>
          <Switch
            checked={settings[key] === "true"}
            onCheckedChange={v => updateSetting(key, v ? "true" : "false")}
            data-testid={`switch-${key}`}
          />
        </div>
      );
    }

    if (opts?.type === "select" && opts.options) {
      return (
        <div className="space-y-1.5" key={key}>
          <Label className="flex items-center gap-1.5 text-sm">
            {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />} {label}
          </Label>
          {opts?.description && <p className="text-xs text-muted-foreground">{opts.description}</p>}
          <Select value={settings[key] || opts.options[0]?.value || ""} onValueChange={v => updateSetting(key, v)}>
            <SelectTrigger data-testid={`select-${key}`}><SelectValue /></SelectTrigger>
            <SelectContent>
              {opts.options.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (opts?.type === "textarea") {
      return (
        <div className="space-y-1.5" key={key}>
          <Label className="flex items-center gap-1.5 text-sm">
            {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />} {label}
          </Label>
          {opts?.description && <p className="text-xs text-muted-foreground">{opts.description}</p>}
          <Textarea value={settings[key] || ""} onChange={e => updateSetting(key, e.target.value)} placeholder={opts?.placeholder} rows={3} data-testid={`input-${key}`} />
        </div>
      );
    }

    return (
      <div className="space-y-1.5" key={key}>
        <Label className="flex items-center gap-1.5 text-sm">
          {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />} {label}
        </Label>
        {opts?.description && <p className="text-xs text-muted-foreground">{opts.description}</p>}
        <Input
          type={opts?.type || "text"}
          value={settings[key] || ""}
          onChange={e => updateSetting(key, e.target.value)}
          placeholder={opts?.placeholder}
          data-testid={`input-${key}`}
        />
      </div>
    );
  }

  const companyKeys = ["company_name", "legal_name", "registration_number", "tax_id", "industry_type", "website", "official_email", "contact_number", "head_office_address", "logo_url", "favicon_url"];
  const localizationKeys = ["default_country", "default_currency", "currency_symbol", "date_format", "time_format", "system_timezone", "language", "number_format"];
  const systemKeys = ["default_dashboard", "default_landing_module", "auto_logout_duration", "session_timeout", "password_min_length", "password_require_special", "two_factor_auth", "file_upload_limit", "default_pagination", "maintenance_mode", "maintenance_message"];
  const financialKeys = ["default_tax_rate", "tax_calculation_method", "default_payment_terms", "invoice_prefix", "invoice_number_format", "currency_precision", "default_discount_type", "rounding_rules"];
  const operationalKeys = ["require_po_approval", "require_asset_transfer_approval", "enable_serial_tracking", "enable_batch_tracking", "auto_generate_sku", "enable_reorder_alerts", "allow_negative_stock", "default_warehouse", "multi_level_approval", "auto_assignment", "default_notification_triggers"];
  const brandingKeys = ["primary_theme_color", "secondary_accent_color", "default_mode", "sidebar_layout", "compact_view", "custom_footer_text", "login_background_url", "portal_branding"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#334155] to-[#2563EB] bg-clip-text text-transparent" data-testid="text-page-title">
            General Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure global system parameters and company preferences</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge className="bg-amber-100 text-amber-700 gap-1">
              <AlertTriangle className="w-3 h-3" /> Unsaved Changes
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={() => {
              const map: SettingsMap = {};
              dbSettings.forEach(s => { map[s.settingKey] = s.settingValue || ""; });
              setSettings(map);
              setHasChanges(false);
            }}
            disabled={!hasChanges}
            data-testid="button-reset"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Reset
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-muted-foreground">Loading settings...</span>
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center py-20 text-red-500">
          <AlertTriangle className="w-6 h-6 mr-2" />
          <span>Failed to load settings</span>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <div className="space-y-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 ${activeTab === cat.id ? "bg-gradient-to-r from-slate-700 to-blue-600 text-white" : "hover:bg-muted/50 text-foreground"}`}
                data-testid={`nav-${cat.id}`}
              >
                <cat.icon className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{cat.label}</p>
                </div>
                {activeTab !== cat.id && (
                  <span className="flex-shrink-0">
                    {cat.id === "company" && getStatusBadge(settings, ["company_name", "official_email"])}
                    {cat.id === "localization" && getStatusBadge(settings, ["default_country", "default_currency"])}
                    {cat.id === "system" && getStatusBadge(settings, ["session_timeout"])}
                    {cat.id === "financial" && getStatusBadge(settings, ["default_tax_rate", "invoice_prefix"])}
                    {cat.id === "operational" && <Badge className="bg-blue-100 text-blue-700 text-[10px]">Default</Badge>}
                    {cat.id === "branding" && <Badge className="bg-blue-100 text-blue-700 text-[10px]">Default</Badge>}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {/* Company Profile */}
            {activeTab === "company" && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-blue-600 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Company Profile</CardTitle>
                        <CardDescription>Organization identity used across invoices, reports, and portals</CardDescription>
                      </div>
                    </div>
                    <Button onClick={() => saveCategory("company", companyKeys)} disabled={saveMutation.isPending} className="bg-gradient-to-r from-slate-700 to-blue-600" data-testid="button-save-company">
                      <Save className="w-4 h-4 mr-2" /> Save
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField("company_name", "Company Name", { placeholder: "NetSphere Technologies", icon: Building2 })}
                    {renderField("legal_name", "Legal Name", { placeholder: "NetSphere Technologies Pvt. Ltd.", icon: FileText })}
                    {renderField("registration_number", "Registration Number", { placeholder: "REG-12345", icon: Hash })}
                    {renderField("tax_id", "Tax ID / NTN", { placeholder: "1234567-8", icon: FileText })}
                    {renderField("industry_type", "Industry Type", {
                      type: "select", icon: Package,
                      options: [
                        { value: "isp", label: "Internet Service Provider" },
                        { value: "telecom", label: "Telecommunications" },
                        { value: "it_services", label: "IT Services" },
                        { value: "software", label: "Software" },
                        { value: "consulting", label: "Consulting" },
                        { value: "other", label: "Other" },
                      ],
                    })}
                    {renderField("website", "Website", { placeholder: "https://www.netsphere.com", icon: Globe })}
                    {renderField("official_email", "Official Email", { type: "email", placeholder: "info@netsphere.com", icon: Mail })}
                    {renderField("contact_number", "Contact Number", { placeholder: "+92-300-1234567", icon: Phone })}
                  </div>
                  {renderField("head_office_address", "Head Office Address", { type: "textarea", placeholder: "123 Business Avenue, Islamabad, Pakistan", icon: MapPin })}
                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">Branding Assets</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField("logo_url", "Company Logo URL", { placeholder: "https://cdn.example.com/logo.png", icon: Upload })}
                    {renderField("favicon_url", "Favicon URL", { placeholder: "https://cdn.example.com/favicon.ico", icon: Upload })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Localization */}
            {activeTab === "localization" && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-blue-600 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Localization & Regional Settings</CardTitle>
                        <CardDescription>Controls date formats, currency, timezone, and language system-wide</CardDescription>
                      </div>
                    </div>
                    <Button onClick={() => saveCategory("localization", localizationKeys)} disabled={saveMutation.isPending} className="bg-gradient-to-r from-slate-700 to-blue-600" data-testid="button-save-localization">
                      <Save className="w-4 h-4 mr-2" /> Save
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField("default_country", "Default Country", {
                      type: "select", icon: Globe,
                      options: [
                        { value: "PK", label: "Pakistan" },
                        { value: "US", label: "United States" },
                        { value: "GB", label: "United Kingdom" },
                        { value: "AE", label: "UAE" },
                        { value: "SA", label: "Saudi Arabia" },
                        { value: "IN", label: "India" },
                        { value: "CA", label: "Canada" },
                        { value: "AU", label: "Australia" },
                      ],
                    })}
                    {renderField("default_currency", "Default Currency", {
                      type: "select", icon: DollarSign,
                      options: [
                        { value: "PKR", label: "PKR - Pakistani Rupee" },
                        { value: "USD", label: "USD - US Dollar" },
                        { value: "GBP", label: "GBP - British Pound" },
                        { value: "EUR", label: "EUR - Euro" },
                        { value: "AED", label: "AED - UAE Dirham" },
                        { value: "SAR", label: "SAR - Saudi Riyal" },
                        { value: "INR", label: "INR - Indian Rupee" },
                      ],
                    })}
                    {renderField("currency_symbol", "Currency Symbol", { placeholder: "Rs.", icon: DollarSign })}
                    {renderField("date_format", "Date Format", {
                      type: "select", icon: Calendar,
                      options: [
                        { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                        { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                        { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                        { value: "DD-MMM-YYYY", label: "DD-MMM-YYYY" },
                      ],
                    })}
                    {renderField("time_format", "Time Format", {
                      type: "select", icon: Clock,
                      options: [
                        { value: "12h", label: "12 Hour (AM/PM)" },
                        { value: "24h", label: "24 Hour" },
                      ],
                    })}
                    {renderField("system_timezone", "System Timezone", {
                      type: "select", icon: Globe,
                      options: [
                        { value: "Asia/Karachi", label: "Asia/Karachi (PKT +05:00)" },
                        { value: "Asia/Dubai", label: "Asia/Dubai (GST +04:00)" },
                        { value: "Asia/Riyadh", label: "Asia/Riyadh (AST +03:00)" },
                        { value: "Europe/London", label: "Europe/London (GMT)" },
                        { value: "America/New_York", label: "America/New_York (EST)" },
                        { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
                        { value: "Asia/Kolkata", label: "Asia/Kolkata (IST +05:30)" },
                      ],
                    })}
                    {renderField("language", "Language", {
                      type: "select", icon: Languages,
                      options: [
                        { value: "en", label: "English" },
                        { value: "ur", label: "Urdu" },
                        { value: "ar", label: "Arabic" },
                        { value: "zh", label: "Chinese" },
                        { value: "es", label: "Spanish" },
                      ],
                    })}
                    {renderField("number_format", "Number Format", {
                      type: "select", icon: Hash,
                      options: [
                        { value: "comma_decimal", label: "1,000.00 (Comma + Decimal)" },
                        { value: "dot_comma", label: "1.000,00 (Dot + Comma)" },
                        { value: "space_comma", label: "1 000,00 (Space + Comma)" },
                      ],
                    })}
                  </div>

                  <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="p-4 text-sm">
                      <p className="font-medium text-blue-700 mb-2">Impact Notice</p>
                      <p className="text-xs text-blue-600">Changes to localization settings affect all modules including Billing, Reporting, Scheduling, Logs, and Notification timestamps. Existing records retain their original format.</p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            )}

            {/* System Defaults */}
            {activeTab === "system" && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-blue-600 flex items-center justify-center">
                        <Server className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">System Defaults</CardTitle>
                        <CardDescription>Global system behavior, security, and session configuration</CardDescription>
                      </div>
                    </div>
                    <Button onClick={() => saveCategory("system", systemKeys)} disabled={saveMutation.isPending} className="bg-gradient-to-r from-slate-700 to-blue-600" data-testid="button-save-system">
                      <Save className="w-4 h-4 mr-2" /> Save
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-sm font-medium text-muted-foreground">Navigation</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField("default_dashboard", "Default Dashboard Page", {
                      type: "select", icon: LayoutDashboard,
                      options: [
                        { value: "/", label: "Main Dashboard" },
                        { value: "/customers", label: "Customers" },
                        { value: "/billing", label: "Billing" },
                        { value: "/sales", label: "Sales" },
                        { value: "/hr", label: "HR" },
                      ],
                    })}
                    {renderField("default_landing_module", "Default Landing Module", {
                      type: "select", icon: Monitor,
                      options: [
                        { value: "dashboard", label: "Dashboard" },
                        { value: "customers", label: "Customers" },
                        { value: "billing", label: "Billing" },
                        { value: "sales", label: "Sales" },
                        { value: "inventory", label: "Inventory" },
                      ],
                    })}
                  </div>

                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">Session & Security</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField("auto_logout_duration", "Auto Logout Duration (minutes)", { type: "number", placeholder: "30", icon: Timer })}
                    {renderField("session_timeout", "Session Timeout (minutes)", { type: "number", placeholder: "60", icon: Clock })}
                    {renderField("password_min_length", "Min Password Length", { type: "number", placeholder: "8", icon: Lock })}
                  </div>
                  {renderField("password_require_special", "Require Special Characters in Password", { type: "switch", icon: KeyRound, description: "Enforce special characters (!@#$%) in all passwords" })}
                  {renderField("two_factor_auth", "Two-Factor Authentication", { type: "switch", icon: Shield, description: "Enable 2FA for all user accounts" })}

                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">System Limits</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField("file_upload_limit", "File Upload Size Limit (MB)", { type: "number", placeholder: "10", icon: HardDrive })}
                    {renderField("default_pagination", "Default Pagination Limit", { type: "number", placeholder: "25", icon: Ruler })}
                  </div>

                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">Maintenance Mode</p>
                  {renderField("maintenance_mode", "Enable Maintenance Mode", { type: "switch", icon: AlertTriangle, description: "Restrict all non-admin access and display maintenance message" })}
                  {settings["maintenance_mode"] === "true" && renderField("maintenance_message", "Maintenance Message", { type: "textarea", placeholder: "System is under maintenance. Please check back later.", icon: FileText })}

                  {settings["maintenance_mode"] === "true" && (
                    <Card className="bg-amber-50 border-amber-200">
                      <CardContent className="p-4 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <p className="text-amber-700">Maintenance mode is enabled. Non-admin users will be unable to access the system.</p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Financial Defaults */}
            {activeTab === "financial" && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-blue-600 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Financial Defaults</CardTitle>
                        <CardDescription>Global tax, invoice, and accounting configuration</CardDescription>
                      </div>
                    </div>
                    <Button onClick={() => saveCategory("financial", financialKeys)} disabled={saveMutation.isPending} className="bg-gradient-to-r from-slate-700 to-blue-600" data-testid="button-save-financial">
                      <Save className="w-4 h-4 mr-2" /> Save
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-sm font-medium text-muted-foreground">Tax Settings</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField("default_tax_rate", "Default Tax Rate (%)", { type: "number", placeholder: "17", icon: DollarSign })}
                    {renderField("tax_calculation_method", "Tax Calculation Method", {
                      type: "select", icon: Ruler,
                      options: [
                        { value: "exclusive", label: "Exclusive (Added on top)" },
                        { value: "inclusive", label: "Inclusive (Included in price)" },
                      ],
                    })}
                  </div>

                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">Invoice Settings</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField("default_payment_terms", "Default Payment Terms", {
                      type: "select", icon: Calendar,
                      options: [
                        { value: "net_7", label: "Net 7 Days" },
                        { value: "net_15", label: "Net 15 Days" },
                        { value: "net_30", label: "Net 30 Days" },
                        { value: "net_60", label: "Net 60 Days" },
                        { value: "due_on_receipt", label: "Due on Receipt" },
                      ],
                    })}
                    {renderField("invoice_prefix", "Invoice Prefix", { placeholder: "INV-", icon: FileText })}
                    {renderField("invoice_number_format", "Invoice Number Format", {
                      type: "select", icon: Hash,
                      options: [
                        { value: "sequential", label: "Sequential (INV-000001)" },
                        { value: "year_sequential", label: "Year + Sequential (INV-2026-0001)" },
                        { value: "year_month", label: "Year/Month (INV-2026/03/0001)" },
                      ],
                    })}
                  </div>

                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">Precision & Rounding</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField("currency_precision", "Currency Precision (Decimal Places)", {
                      type: "select", icon: Hash,
                      options: [
                        { value: "0", label: "0 — No decimals" },
                        { value: "2", label: "2 — Standard (1,000.00)" },
                        { value: "3", label: "3 — Extended (1,000.000)" },
                      ],
                    })}
                    {renderField("default_discount_type", "Default Discount Type", {
                      type: "select", icon: CreditCard,
                      options: [
                        { value: "percentage", label: "Percentage (%)" },
                        { value: "fixed", label: "Fixed Amount" },
                      ],
                    })}
                    {renderField("rounding_rules", "Rounding Rules", {
                      type: "select", icon: Ruler,
                      options: [
                        { value: "round_half_up", label: "Round Half Up (Standard)" },
                        { value: "round_down", label: "Round Down (Floor)" },
                        { value: "round_up", label: "Round Up (Ceiling)" },
                        { value: "no_rounding", label: "No Rounding" },
                      ],
                    })}
                  </div>

                  <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="p-4 text-sm">
                      <p className="font-medium text-blue-700 mb-2">Impact Notice</p>
                      <p className="text-xs text-blue-600">Financial defaults affect the Sales Module, Purchase Orders, Accounting Entries, and all financial reports. Changes apply to new transactions only.</p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            )}

            {/* Operational Preferences */}
            {activeTab === "operational" && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-blue-600 flex items-center justify-center">
                        <Workflow className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Operational Preferences</CardTitle>
                        <CardDescription>Workflow behaviors and module-level defaults</CardDescription>
                      </div>
                    </div>
                    <Button onClick={() => saveCategory("operational", operationalKeys)} disabled={saveMutation.isPending} className="bg-gradient-to-r from-slate-700 to-blue-600" data-testid="button-save-operational">
                      <Save className="w-4 h-4 mr-2" /> Save
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-sm font-medium text-muted-foreground">Approval Workflows</p>
                  {renderField("require_po_approval", "Require Approval for Purchase Orders", { type: "switch", icon: CheckCircle, description: "Purchase orders must be approved before processing" })}
                  {renderField("require_asset_transfer_approval", "Require Approval for Asset Transfers", { type: "switch", icon: CheckCircle, description: "Asset transfers need manager approval" })}
                  {renderField("multi_level_approval", "Multi-Level Approval", { type: "switch", icon: Users, description: "Enable multi-tier approval chains for critical workflows" })}
                  {renderField("auto_assignment", "Auto Assignment Rules", { type: "switch", icon: Workflow, description: "Automatically assign tasks and tickets based on rules" })}

                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">Inventory & Tracking</p>
                  {renderField("enable_serial_tracking", "Enable Serial Tracking by Default", { type: "switch", icon: Hash, description: "Enforce serial number entry for all inventory items" })}
                  {renderField("enable_batch_tracking", "Enable Batch Tracking", { type: "switch", icon: Package, description: "Track items by batch for expiry and recall management" })}
                  {renderField("auto_generate_sku", "Auto-Generate SKU", { type: "switch", icon: BarChart3, description: "Automatically generate SKU codes for new items" })}
                  {renderField("enable_reorder_alerts", "Enable Reorder Alerts", { type: "switch", icon: Bell, description: "Alert when stock falls below reorder level" })}
                  {renderField("allow_negative_stock", "Allow Negative Stock", { type: "switch", icon: AlertTriangle, description: "Allow stock quantities to go below zero" })}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField("default_warehouse", "Default Warehouse", { placeholder: "Main Warehouse", icon: Warehouse })}
                  </div>

                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">Notifications</p>
                  {renderField("default_notification_triggers", "Default Notification Triggers", {
                    type: "select", icon: Bell,
                    options: [
                      { value: "all", label: "All Events" },
                      { value: "critical", label: "Critical Only" },
                      { value: "minimal", label: "Minimal (Errors + Alerts)" },
                      { value: "none", label: "None" },
                    ],
                  })}
                </CardContent>
              </Card>
            )}

            {/* Branding */}
            {activeTab === "branding" && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-blue-600 flex items-center justify-center">
                        <Palette className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Branding & Interface Settings</CardTitle>
                        <CardDescription>Customize the ERP appearance to match company identity</CardDescription>
                      </div>
                    </div>
                    <Button onClick={() => saveCategory("branding", brandingKeys)} disabled={saveMutation.isPending} className="bg-gradient-to-r from-slate-700 to-blue-600" data-testid="button-save-branding">
                      <Save className="w-4 h-4 mr-2" /> Save
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-sm font-medium text-muted-foreground">Colors</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-sm"><Palette className="w-3.5 h-3.5 text-muted-foreground" /> Primary Theme Color</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={settings["primary_theme_color"] || "#2563EB"} onChange={e => updateSetting("primary_theme_color", e.target.value)} className="w-12 h-10 p-1 cursor-pointer" data-testid="input-primary_theme_color" />
                        <Input value={settings["primary_theme_color"] || "#2563EB"} onChange={e => updateSetting("primary_theme_color", e.target.value)} className="flex-1 font-mono text-sm" data-testid="input-primary_theme_color_text" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-sm"><Palette className="w-3.5 h-3.5 text-muted-foreground" /> Secondary Accent Color</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={settings["secondary_accent_color"] || "#06B6D4"} onChange={e => updateSetting("secondary_accent_color", e.target.value)} className="w-12 h-10 p-1 cursor-pointer" data-testid="input-secondary_accent_color" />
                        <Input value={settings["secondary_accent_color"] || "#06B6D4"} onChange={e => updateSetting("secondary_accent_color", e.target.value)} className="flex-1 font-mono text-sm" data-testid="input-secondary_accent_color_text" />
                      </div>
                    </div>
                  </div>

                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">Layout & Display</p>
                  {renderField("default_mode", "Default Mode", {
                    type: "select", icon: Monitor,
                    options: [
                      { value: "light", label: "Light Mode" },
                      { value: "dark", label: "Dark Mode" },
                      { value: "system", label: "System Preference" },
                    ],
                  })}
                  {renderField("sidebar_layout", "Sidebar Layout", {
                    type: "select", icon: LayoutDashboard,
                    options: [
                      { value: "expanded", label: "Expanded (Full)" },
                      { value: "collapsed", label: "Collapsed (Icons)" },
                      { value: "auto", label: "Auto (Responsive)" },
                    ],
                  })}
                  {renderField("compact_view", "Compact View", { type: "switch", icon: Eye, description: "Use condensed spacing and smaller fonts across the interface" })}

                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">Custom Text & Branding</p>
                  {renderField("custom_footer_text", "Custom Footer Text", { placeholder: "© 2026 NetSphere Technologies. All rights reserved.", icon: Type })}
                  {renderField("login_background_url", "Login Page Background URL", { placeholder: "https://cdn.example.com/login-bg.jpg", icon: Upload })}
                  {renderField("portal_branding", "Customer Portal Branding", {
                    type: "select", icon: Globe,
                    options: [
                      { value: "full", label: "Full Branding (Logo + Colors)" },
                      { value: "minimal", label: "Minimal (Logo Only)" },
                      { value: "none", label: "No Branding" },
                    ],
                  })}

                  {(settings["primary_theme_color"] || settings["secondary_accent_color"]) && (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-sm font-medium mb-3">Theme Preview</p>
                        <div className="flex items-center gap-3">
                          <div className="h-12 flex-1 rounded-lg" style={{ background: `linear-gradient(to right, ${settings["primary_theme_color"] || "#2563EB"}, ${settings["secondary_accent_color"] || "#06B6D4"})` }} />
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded" style={{ background: settings["primary_theme_color"] || "#2563EB" }} />
                              <span>{settings["primary_theme_color"] || "#2563EB"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded" style={{ background: settings["secondary_accent_color"] || "#06B6D4" }} />
                              <span>{settings["secondary_accent_color"] || "#06B6D4"}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}