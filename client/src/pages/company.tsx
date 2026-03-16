import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Save,
  Plus,
  Pencil,
  Trash2,
  GitBranch,
  Mail,
  Phone,
  Smartphone,
  Globe,
  MapPin,
  FileText,
  Hash,
  ImageIcon,
  Clock,
  Languages,
  CreditCard,
  Shield,
  ToggleLeft,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertCompanySettingsSchema,
  type CompanySettings,
  type InsertCompanySettings,
  insertBranchSchema,
  type Branch,
  type InsertBranch,
} from "@shared/schema";
import { z } from "zod";
import { useTab } from "@/hooks/use-tab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const companyFormSchema = insertCompanySettingsSchema.extend({
  companyName: z.string().min(1, "Company name is required"),
});

const branchFormSchema = insertBranchSchema.extend({
  name: z.string().min(1, "Branch name is required"),
  code: z.string().min(1, "Branch code is required"),
});

const defaultValues: InsertCompanySettings = {
  companyName: "",
  registrationNo: "",
  ntn: "",
  address: "",
  address2: "",
  city: "",
  phone: "",
  phone2: "",
  mobile1: "",
  mobile2: "",
  email: "",
  website: "",
  logo: "",
  currency: "PKR",
  currencySymbol: "Rs",
  taxRate: "17",
  country: "Pakistan",
  countryCode: "PK",
  dialCode: "+92",
  language: "en",
  timezone: "Asia/Karachi",
  clientCodeType: "automatic",
  clientCodePrefix: "CUST-",
  showOnLogin: true,
};

const branchDefaultValues: InsertBranch = {
  name: "",
  code: "",
  address: "",
  city: "",
  phone: "",
  email: "",
  managerId: null,
  status: "active",
};

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Building2;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600/10 dark:bg-blue-500/15">
        <Icon className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <h3 className="text-[15px] font-semibold text-foreground" data-testid={`section-title-${title.toLowerCase().replace(/\s+/g, "-")}`}>
          {title}
        </h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

function LogoUploadField({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value || "");
  const { toast } = useToast();

  useEffect(() => {
    setPreview(value || "");
  }, [value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Maximum file size is 5MB", variant: "destructive" });
      return;
    }

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/svg+xml", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload PNG, JPG, GIF, SVG, or WebP", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }

      const data = await res.json();
      onChange(data.url);
      setPreview(data.url);
      toast({ title: "Logo uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange("");
    setPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <FormItem>
      <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Logo
      </FormLabel>
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div
            className="relative w-20 h-20 rounded-xl border-2 border-dashed border-border/60 bg-muted/30 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-blue-400/60 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            data-testid="logo-preview-area"
          >
            {preview ? (
              <img
                src={preview}
                alt="Company logo"
                className="w-full h-full object-contain p-1.5"
                data-testid="img-logo-preview"
              />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                <span className="text-[9px] text-muted-foreground/50 font-medium">No Logo</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleFileSelect}
              data-testid="input-logo-file"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-8 text-xs gap-1.5"
              data-testid="button-upload-logo"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              {uploading ? "Uploading..." : preview ? "Change Logo" : "Choose File"}
            </Button>
            {preview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 gap-1"
                data-testid="button-remove-logo"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </Button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/60">
          PNG, JPG, GIF, SVG or WebP. Max 5MB.
        </p>
      </div>
    </FormItem>
  );
}

function FieldGroup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 ${className}`}>
      {children}
    </div>
  );
}

export default function CompanyPage() {
  const { toast } = useToast();
  const [tab, changeTab] = useTab("profile");

  const { data: company, isLoading } = useQuery<CompanySettings | null>({
    queryKey: ["/api/company"],
  });

  const form = useForm<InsertCompanySettings>({
    resolver: zodResolver(companyFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (company) {
      form.reset({
        companyName: company.companyName,
        registrationNo: company.registrationNo || "",
        ntn: company.ntn || "",
        address: company.address || "",
        address2: company.address2 || "",
        city: company.city || "",
        phone: company.phone || "",
        phone2: company.phone2 || "",
        mobile1: company.mobile1 || "",
        mobile2: company.mobile2 || "",
        email: company.email || "",
        website: company.website || "",
        logo: company.logo || "",
        currency: company.currency || "PKR",
        currencySymbol: company.currencySymbol || "Rs",
        taxRate: company.taxRate || "17",
        country: company.country || "Pakistan",
        countryCode: company.countryCode || "PK",
        dialCode: company.dialCode || "+92",
        language: company.language || "en",
        timezone: company.timezone || "Asia/Karachi",
        clientCodeType: company.clientCodeType || "automatic",
        clientCodePrefix: company.clientCodePrefix || "CUST-",
        showOnLogin: company.showOnLogin ?? true,
      });
    }
  }, [company, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: InsertCompanySettings) => {
      const res = await apiRequest("POST", "/api/company", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      toast({ title: "Company information updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCompanySettings) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-md">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-company-title">
              Company Setup
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <span>System</span>
              <ChevronRight className="h-3 w-3" />
              <span>Company Setup</span>
            </div>
          </div>
        </div>
      </div>

      {tab === "profile" && (
        <div className="mt-5" data-testid="tab-content-profile">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[300px] w-full rounded-xl" />
              <Skeleton className="h-[200px] w-full rounded-xl" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border border-border/60 shadow-sm">
                  <CardHeader className="pb-4 border-b border-border/40 bg-muted/30">
                    <SectionHeader
                      icon={Building2}
                      title="Basic Company Settings"
                      description="Primary company information and contact details"
                    />
                  </CardHeader>
                  <CardContent className="pt-6">
                    <FieldGroup>
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Company Name <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                                <Input
                                  placeholder="e.g. NetSphere Technologies"
                                  className="pl-10 h-10"
                                  data-testid="input-company-name"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                                <Input
                                  placeholder="info@company.com"
                                  className="pl-10 h-10"
                                  data-testid="input-email"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Address 1
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                                <Input
                                  placeholder="Street address, building number"
                                  className="pl-10 h-10"
                                  data-testid="input-address"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </FieldGroup>

                    <FieldGroup className="mt-5">
                      <FormField
                        control={form.control}
                        name="address2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Address 2
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                                <Input
                                  placeholder="Area, neighborhood"
                                  className="pl-10 h-10"
                                  data-testid="input-address2"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mobile1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Mobile 1
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                                <Input
                                  placeholder="+92 3XX XXXXXXX"
                                  className="pl-10 h-10"
                                  data-testid="input-mobile1"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mobile2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Mobile 2
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                                <Input
                                  placeholder="+92 3XX XXXXXXX"
                                  className="pl-10 h-10"
                                  data-testid="input-mobile2"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </FieldGroup>

                    <FieldGroup className="mt-5">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Phone 1
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                                <Input
                                  placeholder="Ex: +92 (042) 000-00-00"
                                  className="pl-10 h-10"
                                  data-testid="input-phone"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Phone 2
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                                <Input
                                  placeholder="Ex: +92 (042) 000-00-00"
                                  className="pl-10 h-10"
                                  data-testid="input-phone2"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="logo"
                        render={({ field }) => (
                          <LogoUploadField
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </FieldGroup>

                    <div className="mt-6 pt-5 border-t border-border/40">
                      <FieldGroup>
                        <FormField
                          control={form.control}
                          name="registrationNo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Registration No.
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                                  <Input
                                    placeholder="Company registration number"
                                    className="pl-10 h-10"
                                    data-testid="input-registration-no"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="ntn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                NTN (National Tax Number)
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                                  <Input
                                    placeholder="Tax identification number"
                                    className="pl-10 h-10"
                                    data-testid="input-ntn"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Website
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                                  <Input
                                    placeholder="https://www.company.com"
                                    className="pl-10 h-10"
                                    data-testid="input-website"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </FieldGroup>
                    </div>

                    <div className="mt-6 pt-5 border-t border-border/40">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <FormField
                          control={form.control}
                          name="clientCodeType"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Client Code: Automatic or Customizable?
                              </FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value || "automatic"}
                                  className="flex gap-6"
                                  data-testid="radio-client-code-type"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="customizable" id="customizable" />
                                    <Label htmlFor="customizable" className="text-sm font-medium cursor-pointer">
                                      Customizable
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="automatic" id="automatic" />
                                    <Label htmlFor="automatic" className="text-sm font-medium cursor-pointer">
                                      Automatic
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {form.watch("clientCodeType") === "customizable" && (
                          <FormField
                            control={form.control}
                            name="clientCodePrefix"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Client Code Prefix
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g. CUST-"
                                    className="h-10 w-48"
                                    data-testid="input-client-code-prefix"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      <div className="mt-5">
                        <FormField
                          control={form.control}
                          name="showOnLogin"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0">
                              <FormControl>
                                <Switch
                                  checked={field.value ?? true}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-show-on-login"
                                />
                              </FormControl>
                              <div>
                                <FormLabel className="text-sm font-medium cursor-pointer">
                                  Show Company Info on Login Page
                                </FormLabel>
                                <FormDescription className="text-xs text-muted-foreground">
                                  Display company logo and name on the user login screen
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/60 shadow-sm">
                  <CardHeader className="pb-4 border-b border-border/40 bg-muted/30">
                    <SectionHeader
                      icon={Globe}
                      title="Company Localization"
                      description="Regional settings, currency, and timezone configuration"
                    />
                  </CardHeader>
                  <CardContent className="pt-6">
                    <FieldGroup>
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Country
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || "Pakistan"}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10" data-testid="select-country">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Pakistan">Pakistan</SelectItem>
                                <SelectItem value="Afghanistan">Afghanistan</SelectItem>
                                <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                                <SelectItem value="India">India</SelectItem>
                                <SelectItem value="Iran">Iran</SelectItem>
                                <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                                <SelectItem value="UAE">United Arab Emirates</SelectItem>
                                <SelectItem value="United States">United States</SelectItem>
                                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="countryCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Country Code
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="PK"
                                className="h-10"
                                data-testid="input-country-code"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="currencySymbol"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Currency Symbol
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Rs"
                                className="h-10"
                                data-testid="input-currency-symbol"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </FieldGroup>

                    <FieldGroup className="mt-5">
                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Language
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || "en"}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10" data-testid="select-language">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="ur">Urdu</SelectItem>
                                <SelectItem value="ar">Arabic</SelectItem>
                                <SelectItem value="fa">Farsi</SelectItem>
                                <SelectItem value="bn">Bengali</SelectItem>
                                <SelectItem value="hi">Hindi</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dialCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Dial Code
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+92"
                                className="h-10"
                                data-testid="input-dial-code"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Timezone
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || "Asia/Karachi"}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10" data-testid="select-timezone">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Asia/Karachi">Asia/Karachi (PKT +05:00)</SelectItem>
                                <SelectItem value="Asia/Kabul">Asia/Kabul (+04:30)</SelectItem>
                                <SelectItem value="Asia/Dhaka">Asia/Dhaka (BST +06:00)</SelectItem>
                                <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</SelectItem>
                                <SelectItem value="Asia/Dubai">Asia/Dubai (GST +04:00)</SelectItem>
                                <SelectItem value="Asia/Riyadh">Asia/Riyadh (AST +03:00)</SelectItem>
                                <SelectItem value="Europe/London">Europe/London (GMT +00:00)</SelectItem>
                                <SelectItem value="America/New_York">America/New York (EST -05:00)</SelectItem>
                                <SelectItem value="America/Los_Angeles">America/Los Angeles (PST -08:00)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </FieldGroup>

                    <FieldGroup className="mt-5">
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Currency
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || "PKR"}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10" data-testid="select-currency">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="PKR">PKR - Pakistani Rupee</SelectItem>
                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                                <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                <SelectItem value="BDT">BDT - Bangladeshi Taka</SelectItem>
                                <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="taxRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Default Tax Rate (%)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. 17"
                                className="h-10"
                                data-testid="input-tax-rate"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              City
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Lahore"
                                className="h-10"
                                data-testid="input-city"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </FieldGroup>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={saveMutation.isPending}
                    className="min-w-[220px] h-11 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
                    data-testid="button-save-company"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Update Company Information
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      )}

      {tab === "branches" && (
        <div className="mt-5" data-testid="tab-content-branches">
          <BranchesTab />
        </div>
      )}
    </div>
  );
}

function BranchesTab() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  const branchForm = useForm<InsertBranch>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: branchDefaultValues,
  });

  const watchedBranchName = branchForm.watch("name");
  const watchedBranchCity = branchForm.watch("city");

  useEffect(() => {
    if (!editingBranch) {
      const namePart = (watchedBranchName || "").replace(/\s+/g, "").toUpperCase().slice(0, 3);
      const cityPart = (watchedBranchCity || "").replace(/\s+/g, "").toUpperCase().slice(0, 3);
      const generated = [namePart, cityPart].filter(Boolean).join("-");
      branchForm.setValue("code", generated, { shouldValidate: false });
    }
  }, [watchedBranchName, watchedBranchCity, editingBranch]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertBranch) => {
      const res = await apiRequest("POST", "/api/branches", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({ title: "Branch created successfully" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertBranch }) => {
      const res = await apiRequest("PATCH", `/api/branches/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({ title: "Branch updated successfully" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/branches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({ title: "Branch deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openAddDialog = () => {
    setEditingBranch(null);
    branchForm.reset(branchDefaultValues);
    setDialogOpen(true);
  };

  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch);
    branchForm.reset({
      name: branch.name,
      code: branch.code,
      address: branch.address || "",
      city: branch.city || "",
      phone: branch.phone || "",
      email: branch.email || "",
      managerId: branch.managerId,
      status: branch.status,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingBranch(null);
    branchForm.reset(branchDefaultValues);
  };

  const onBranchSubmit = (data: InsertBranch) => {
    if (editingBranch) {
      updateMutation.mutate({ id: editingBranch.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full rounded-xl" />;
  }

  return (
    <>
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/40 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600/10 dark:bg-blue-500/15">
              <GitBranch className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-[15px]" data-testid="text-branches-title">
                Branches & Departments
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage your company branches and departments
              </p>
            </div>
          </div>
          <Button
            onClick={openAddDialog}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm"
            data-testid="button-add-branch"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Branch
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {branches.length === 0 ? (
            <div className="text-center py-16" data-testid="text-no-branches">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted mx-auto mb-3">
                <GitBranch className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No branches found
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Add your first branch to get started
              </p>
            </div>
          ) : (
            <Table data-testid="table-branches">
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">Code</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">City</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">Phone</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">Email</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id} data-testid={`row-branch-${branch.id}`}>
                    <TableCell className="font-medium" data-testid={`text-branch-name-${branch.id}`}>
                      {branch.name}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded" data-testid={`text-branch-code-${branch.id}`}>
                        {branch.code}
                      </code>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{branch.city || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{branch.phone || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{branch.email || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={branch.status === "active" ? "default" : "secondary"}
                        className={
                          branch.status === "active"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : ""
                        }
                        data-testid={`badge-branch-status-${branch.id}`}
                      >
                        {branch.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(branch)}
                          data-testid={`button-edit-branch-${branch.id}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => deleteMutation.mutate(branch.id)}
                          data-testid={`button-delete-branch-${branch.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]" data-testid="dialog-branch">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              {editingBranch ? "Edit Branch" : "Add New Branch"}
            </DialogTitle>
          </DialogHeader>
          <Form {...branchForm}>
            <form
              onSubmit={branchForm.handleSubmit(onBranchSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={branchForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Main Branch"
                          data-testid="input-branch-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. MAI-LAH"
                          data-testid="input-branch-code"
                          {...field}
                        />
                      </FormControl>
                      {!editingBranch && (
                        <FormDescription className="text-xs">
                          Auto-generated from name &amp; city. You can edit it manually.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={branchForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Branch address"
                        data-testid="input-branch-address"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={branchForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Lahore"
                          data-testid="input-branch-city"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="042-XXXXXXX"
                          data-testid="input-branch-phone"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={branchForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="branch@company.com"
                          data-testid="input-branch-email"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={branchForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-branch-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  data-testid="button-submit-branch"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingBranch
                    ? "Update Branch"
                    : "Create Branch"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
