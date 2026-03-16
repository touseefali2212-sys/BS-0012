import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Settings,
  Building2,
  Save,
  Shield,
  Users,
  FileText,
  Bell,
  Wallet,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useTab } from "@/hooks/use-tab";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertSettingSchema,
  insertCompanySettingsSchema,
  type Setting,
  type InsertSetting,
  type CompanySettings,
  type InsertCompanySettings,
  type ActivityLog,
  type Role,
} from "@shared/schema";
import { z } from "zod";

const settingFormSchema = insertSettingSchema.extend({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
  category: z.string().min(1, "Category is required"),
});

const companyFormSchema = insertCompanySettingsSchema.extend({
  companyName: z.string().min(1, "Company name is required"),
});

export default function SettingsPage() {
  const [tab, changeTab] = useTab("general");

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-settings-title">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage system configuration and preferences</p>
      </div>

      {tab === "general" && (<div className="mt-5" data-testid="tab-content-general">
          <SettingsCategoryTab category="general" />
        </div>)}

      {tab === "company" && (<div className="mt-5" data-testid="tab-content-company">
          <CompanyTab />
        </div>)}

      {tab === "billing" && (<div className="mt-5" data-testid="tab-content-billing">
          <SettingsCategoryTab category="billing" />
        </div>)}

      {tab === "hrm-rights" && (<div className="mt-5" data-testid="tab-content-hrm-rights">
          <HrmRightsTab />
        </div>)}

      {tab === "customer-rights" && (<div className="mt-5" data-testid="tab-content-customer-rights">
          <CustomerRightsTab />
        </div>)}

      {tab === "invoice-template" && (<div className="mt-5" data-testid="tab-content-invoice-template">
          <InvoiceTemplateTab />
        </div>)}

      {tab === "notification" && (<div className="mt-5" data-testid="tab-content-notification">
          <NotificationTab />
        </div>)}

      {tab === "payment" && (<div className="mt-5" data-testid="tab-content-payment">
          <PaymentGatewayTab />
        </div>)}

      {tab === "activity-log" && (<div className="mt-5" data-testid="tab-content-activity-log">
          <ActivityLogTab />
        </div>)}
    </div>
  );
}

function SettingsCategoryTab({ category }: { category: string }) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);

  const { data: settings, isLoading } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  const form = useForm<InsertSetting>({
    resolver: zodResolver(settingFormSchema),
    defaultValues: {
      key: "",
      value: "",
      category,
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSetting) => {
      const res = await apiRequest("POST", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setDialogOpen(false);
      form.reset({ key: "", value: "", category, description: "" });
      toast({ title: "Setting saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertSetting> }) => {
      const res = await apiRequest("PATCH", `/api/settings/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setDialogOpen(false);
      setEditingSetting(null);
      form.reset({ key: "", value: "", category, description: "" });
      toast({ title: "Setting updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/settings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Setting deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingSetting(null);
    form.reset({ key: "", value: "", category, description: "" });
    setDialogOpen(true);
  };

  const openEdit = (setting: Setting) => {
    setEditingSetting(setting);
    form.reset({
      key: setting.key,
      value: setting.value,
      category: setting.category,
      description: setting.description || "",
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertSetting) => {
    if (editingSetting) {
      updateMutation.mutate({ id: editingSetting.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = (settings || []).filter((s) => {
    if (s.category !== category) return false;
    if (!search) return true;
    return (
      s.key.toLowerCase().includes(search.toLowerCase()) ||
      s.value.toLowerCase().includes(search.toLowerCase())
    );
  });

  const defaultSettings: Record<string, { key: string; description: string }[]> = {
    general: [
      { key: "timezone", description: "System timezone" },
      { key: "date_format", description: "Date display format" },
      { key: "language", description: "Default language" },
    ],
    billing: [
      { key: "billing_cycle", description: "Billing cycle (monthly/quarterly)" },
      { key: "payment_terms", description: "Payment terms in days" },
      { key: "late_fee", description: "Late fee percentage" },
      { key: "invoice_numbering", description: "Invoice numbering format" },
    ],
  };

  const categoryLabel = category === "general" ? "General" : category === "billing" ? "Billing" : category;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>{categoryLabel} Settings</CardTitle>
          <Button onClick={openCreate} data-testid={`button-add-${category}-setting`}>
            <Plus className="h-4 w-4 mr-1" />
            Add Setting
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search settings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid={`input-search-${category}-settings`}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Settings className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No {categoryLabel.toLowerCase()} settings found</p>
              <p className="text-sm mt-1">Add a new setting to get started</p>
              {defaultSettings[category] && (
                <div className="mt-4 text-sm text-left">
                  <p className="text-muted-foreground mb-2">Suggested defaults:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {defaultSettings[category].map((d) => (
                      <li key={d.key}>{d.key} - {d.description}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <Table data-testid={`table-${category}-settings`}>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((setting) => (
                  <TableRow key={setting.id} data-testid={`row-setting-${setting.id}`}>
                    <TableCell>
                      <span className="font-mono text-sm" data-testid={`text-setting-key-${setting.id}`}>{setting.key}</span>
                    </TableCell>
                    <TableCell>
                      <span className="max-w-[200px] truncate block text-sm text-muted-foreground" data-testid={`text-setting-value-${setting.id}`}>
                        {setting.value}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground" data-testid={`text-setting-desc-${setting.id}`}>
                      {setting.description || "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-setting-actions-${setting.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(setting)} data-testid={`button-edit-setting-${setting.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(setting.id)}
                            data-testid={`button-delete-setting-${setting.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSetting ? "Edit Setting" : "Add Setting"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key</FormLabel>
                    <FormControl>
                      <Input placeholder="app.setting_name" data-testid="input-setting-key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input placeholder="Setting value" data-testid="input-setting-value" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || category}>
                      <FormControl>
                        <SelectTrigger data-testid="select-form-setting-category">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="hrm-rights">HRM Rights</SelectItem>
                        <SelectItem value="customer-rights">Customer Rights</SelectItem>
                        <SelectItem value="invoice-template">Invoice Template</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description" data-testid="input-setting-description" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)} data-testid="button-cancel-setting">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-setting">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingSetting ? "Update" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CompanyTab() {
  const { toast } = useToast();

  const { data: company, isLoading } = useQuery<CompanySettings | null>({
    queryKey: ["/api/company"],
  });

  const form = useForm<InsertCompanySettings>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      companyName: "",
      registrationNo: "",
      ntn: "",
      address: "",
      city: "",
      phone: "",
      email: "",
      website: "",
      logo: "",
      currency: "PKR",
      taxRate: "17",
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        companyName: company.companyName,
        registrationNo: company.registrationNo || "",
        ntn: company.ntn || "",
        address: company.address || "",
        city: company.city || "",
        phone: company.phone || "",
        email: company.email || "",
        website: company.website || "",
        logo: company.logo || "",
        currency: company.currency || "PKR",
        taxRate: company.taxRate || "17",
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
      toast({ title: "Company settings saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. NetSphere Technologies" data-testid="input-settings-company-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registrationNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration No.</FormLabel>
                    <FormControl>
                      <Input placeholder="Company registration number" data-testid="input-settings-registration-no" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ntn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NTN (National Tax Number)</FormLabel>
                    <FormControl>
                      <Input placeholder="Tax identification number" data-testid="input-settings-ntn" {...field} value={field.value || ""} />
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
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Lahore" data-testid="input-settings-city" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Full company address" data-testid="input-settings-address" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="042-XXXXXXX" data-testid="input-settings-phone" {...field} value={field.value || ""} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="info@company.com" data-testid="input-settings-email" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.company.com" data-testid="input-settings-website" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "PKR"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-settings-currency">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PKR">PKR - Pakistani Rupee</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
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
                    <FormLabel>Tax Rate (%)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 17" data-testid="input-settings-tax-rate" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-company-settings">
                <Save className="h-4 w-4 mr-1" />
                {saveMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function HrmRightsTab() {
  const { toast } = useToast();
  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const { data: settings } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  const hrmPermissions = [
    "View Employees",
    "Edit Employees",
    "View Salary",
    "Manage Leave",
    "View Attendance",
    "Manage Payroll",
  ];

  const getPermissionKey = (roleName: string, perm: string) =>
    `hrm_${roleName.toLowerCase().replace(/\s+/g, "_")}_${perm.toLowerCase().replace(/\s+/g, "_")}`;

  const isPermissionEnabled = (roleName: string, perm: string) => {
    const key = getPermissionKey(roleName, perm);
    const setting = (settings || []).find((s) => s.key === key && s.category === "hrm-rights");
    return setting?.value === "true";
  };

  const toggleMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description: string }) => {
      const existing = (settings || []).find((s) => s.key === key && s.category === "hrm-rights");
      if (existing) {
        const res = await apiRequest("PATCH", `/api/settings/${existing.id}`, { value });
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/settings", {
          key,
          value,
          category: "hrm-rights",
          description,
        });
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Permission updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (rolesLoading) return <Skeleton className="h-[400px] w-full" />;

  const rolesList = roles && roles.length > 0 ? roles : [
    { id: 0, name: "Admin", description: "Administrator", permissions: null, isSystem: true, status: "active" },
    { id: 0, name: "Manager", description: "Manager", permissions: null, isSystem: false, status: "active" },
    { id: 0, name: "Staff", description: "Staff", permissions: null, isSystem: false, status: "active" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          HRM Permission Setup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table data-testid="table-hrm-rights">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Role</TableHead>
                {hrmPermissions.map((perm) => (
                  <TableHead key={perm} className="text-center min-w-[120px]">{perm}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rolesList.map((role, idx) => (
                <TableRow key={role.id || idx} data-testid={`row-hrm-role-${role.name}`}>
                  <TableCell>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium" data-testid={`text-hrm-role-${role.name}`}>{role.name}</span>
                      {role.isSystem && <Badge variant="secondary" className="text-[10px]">System</Badge>}
                    </div>
                  </TableCell>
                  {hrmPermissions.map((perm) => (
                    <TableCell key={perm} className="text-center">
                      <Checkbox
                        checked={isPermissionEnabled(role.name, perm)}
                        onCheckedChange={(checked) => {
                          toggleMutation.mutate({
                            key: getPermissionKey(role.name, perm),
                            value: checked ? "true" : "false",
                            description: `${perm} permission for ${role.name}`,
                          });
                        }}
                        data-testid={`checkbox-hrm-${role.name}-${perm.toLowerCase().replace(/\s+/g, "-")}`}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerRightsTab() {
  const { toast } = useToast();
  const { data: settings } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  const customerPermissions = [
    { key: "customer_view_invoices", label: "View Invoices", description: "Allow customers to view their invoices" },
    { key: "customer_pay_online", label: "Pay Online", description: "Allow customers to pay invoices online" },
    { key: "customer_open_tickets", label: "Open Tickets", description: "Allow customers to create support tickets" },
    { key: "customer_view_connection", label: "View Connection Details", description: "Allow customers to view their connection info" },
    { key: "customer_download_invoices", label: "Download Invoices", description: "Allow customers to download invoice PDFs" },
    { key: "customer_view_usage", label: "View Usage", description: "Allow customers to view their usage statistics" },
  ];

  const isEnabled = (key: string) => {
    const setting = (settings || []).find((s) => s.key === key && s.category === "customer-rights");
    return setting?.value === "true";
  };

  const toggleMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description: string }) => {
      const existing = (settings || []).find((s) => s.key === key && s.category === "customer-rights");
      if (existing) {
        const res = await apiRequest("PATCH", `/api/settings/${existing.id}`, { value });
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/settings", {
          key,
          value,
          category: "customer-rights",
          description,
        });
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Permission updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customer Portal Rights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {customerPermissions.map((perm) => (
            <div
              key={perm.key}
              className="flex items-center justify-between p-4 border rounded-md"
              data-testid={`row-customer-right-${perm.key}`}
            >
              <div>
                <p className="font-medium" data-testid={`text-customer-right-label-${perm.key}`}>{perm.label}</p>
                <p className="text-sm text-muted-foreground">{perm.description}</p>
              </div>
              <Switch
                checked={isEnabled(perm.key)}
                onCheckedChange={(checked) => {
                  toggleMutation.mutate({
                    key: perm.key,
                    value: checked ? "true" : "false",
                    description: perm.description,
                  });
                }}
                data-testid={`switch-customer-right-${perm.key}`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InvoiceTemplateTab() {
  const { toast } = useToast();
  const { data: settings } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  const templateFields = [
    { key: "invoice_template", label: "Template Style", type: "select", options: ["Standard", "Modern", "Minimal", "Professional"] },
    { key: "invoice_show_logo", label: "Show Company Logo", type: "toggle" },
    { key: "invoice_header_text", label: "Header Text", type: "text" },
    { key: "invoice_footer_text", label: "Footer Text", type: "text" },
    { key: "invoice_terms", label: "Terms & Conditions", type: "textarea" },
    { key: "invoice_notes", label: "Default Notes", type: "textarea" },
  ];

  const getSettingValue = (key: string) => {
    const setting = (settings || []).find((s) => s.key === key && s.category === "invoice-template");
    return setting?.value || "";
  };

  const getSettingId = (key: string) => {
    const setting = (settings || []).find((s) => s.key === key && s.category === "invoice-template");
    return setting?.id;
  };

  const saveMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description: string }) => {
      const existingId = getSettingId(key);
      if (existingId) {
        const res = await apiRequest("PATCH", `/api/settings/${existingId}`, { value });
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/settings", {
          key,
          value,
          category: "invoice-template",
          description,
        });
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Invoice template setting saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      const vals: Record<string, string> = {};
      templateFields.forEach((f) => {
        vals[f.key] = getSettingValue(f.key);
      });
      setLocalValues(vals);
    }
  }, [settings]);

  const handleSave = (key: string, label: string) => {
    saveMutation.mutate({
      key,
      value: localValues[key] || "",
      description: label,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Invoice Template Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {templateFields.map((field) => (
            <div key={field.key} className="space-y-2" data-testid={`field-invoice-${field.key}`}>
              <label className="text-sm font-medium">{field.label}</label>
              {field.type === "select" && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={localValues[field.key] || field.options?.[0] || ""}
                    onValueChange={(val) => setLocalValues({ ...localValues, [field.key]: val })}
                  >
                    <SelectTrigger className="max-w-xs" data-testid={`select-invoice-${field.key}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="secondary" onClick={() => handleSave(field.key, field.label)} data-testid={`button-save-invoice-${field.key}`}>
                    Save
                  </Button>
                </div>
              )}
              {field.type === "toggle" && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Switch
                    checked={localValues[field.key] === "true"}
                    onCheckedChange={(checked) => {
                      const newVal = checked ? "true" : "false";
                      setLocalValues({ ...localValues, [field.key]: newVal });
                      saveMutation.mutate({ key: field.key, value: newVal, description: field.label });
                    }}
                    data-testid={`switch-invoice-${field.key}`}
                  />
                </div>
              )}
              {field.type === "text" && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Input
                    className="max-w-md"
                    value={localValues[field.key] || ""}
                    onChange={(e) => setLocalValues({ ...localValues, [field.key]: e.target.value })}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    data-testid={`input-invoice-${field.key}`}
                  />
                  <Button variant="secondary" onClick={() => handleSave(field.key, field.label)} data-testid={`button-save-invoice-${field.key}`}>
                    Save
                  </Button>
                </div>
              )}
              {field.type === "textarea" && (
                <div className="space-y-2">
                  <Textarea
                    className="max-w-lg"
                    value={localValues[field.key] || ""}
                    onChange={(e) => setLocalValues({ ...localValues, [field.key]: e.target.value })}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    data-testid={`textarea-invoice-${field.key}`}
                  />
                  <Button variant="secondary" onClick={() => handleSave(field.key, field.label)} data-testid={`button-save-invoice-${field.key}`}>
                    Save
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationTab() {
  const { toast } = useToast();
  const { data: settings } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  const channels = ["Email", "SMS", "Push"];
  const events = [
    { key: "new_invoice", label: "New Invoice Generated" },
    { key: "payment_received", label: "Payment Received" },
    { key: "ticket_update", label: "Ticket Update" },
    { key: "connection_issue", label: "Connection Issue" },
    { key: "billing_reminder", label: "Billing Reminder" },
    { key: "overdue_payment", label: "Overdue Payment" },
  ];

  const getNotifKey = (channel: string, event: string) =>
    `notif_${channel.toLowerCase()}_${event}`;

  const isEnabled = (channel: string, event: string) => {
    const key = getNotifKey(channel, event);
    const setting = (settings || []).find((s) => s.key === key && s.category === "notification");
    return setting?.value === "true";
  };

  const toggleMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description: string }) => {
      const existing = (settings || []).find((s) => s.key === key && s.category === "notification");
      if (existing) {
        const res = await apiRequest("PATCH", `/api/settings/${existing.id}`, { value });
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/settings", {
          key,
          value,
          category: "notification",
          description,
        });
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Notification setting updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table data-testid="table-notification-settings">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Event</TableHead>
                {channels.map((ch) => (
                  <TableHead key={ch} className="text-center min-w-[100px]">{ch}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.key} data-testid={`row-notif-${event.key}`}>
                  <TableCell>
                    <span className="font-medium" data-testid={`text-notif-event-${event.key}`}>{event.label}</span>
                  </TableCell>
                  {channels.map((ch) => (
                    <TableCell key={ch} className="text-center">
                      <Switch
                        checked={isEnabled(ch, event.key)}
                        onCheckedChange={(checked) => {
                          toggleMutation.mutate({
                            key: getNotifKey(ch, event.key),
                            value: checked ? "true" : "false",
                            description: `${event.label} via ${ch}`,
                          });
                        }}
                        data-testid={`switch-notif-${ch.toLowerCase()}-${event.key}`}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentGatewayTab() {
  const { toast } = useToast();
  const { data: settings } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  const gateways = [
    {
      id: "jazzcash",
      name: "JazzCash",
      fields: [
        { key: "jazzcash_merchant_id", label: "Merchant ID" },
        { key: "jazzcash_password", label: "Password" },
        { key: "jazzcash_integrity_salt", label: "Integrity Salt" },
      ],
    },
    {
      id: "easypaisa",
      name: "Easypaisa",
      fields: [
        { key: "easypaisa_store_id", label: "Store ID" },
        { key: "easypaisa_token", label: "API Token" },
      ],
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      fields: [
        { key: "bank_name", label: "Bank Name" },
        { key: "bank_account_title", label: "Account Title" },
        { key: "bank_account_number", label: "Account Number" },
        { key: "bank_iban", label: "IBAN" },
        { key: "bank_branch_code", label: "Branch Code" },
      ],
    },
  ];

  const getVal = (key: string) => {
    const setting = (settings || []).find((s) => s.key === key && s.category === "payment");
    return setting?.value || "";
  };

  const isGatewayEnabled = (id: string) => {
    const setting = (settings || []).find((s) => s.key === `${id}_enabled` && s.category === "payment");
    return setting?.value === "true";
  };

  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      const vals: Record<string, string> = {};
      gateways.forEach((gw) => {
        gw.fields.forEach((f) => {
          vals[f.key] = getVal(f.key);
        });
        vals[`${gw.id}_enabled`] = isGatewayEnabled(gw.id) ? "true" : "false";
      });
      setLocalValues(vals);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description: string }) => {
      const existing = (settings || []).find((s) => s.key === key && s.category === "payment");
      if (existing) {
        const res = await apiRequest("PATCH", `/api/settings/${existing.id}`, { value });
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/settings", {
          key,
          value,
          category: "payment",
          description,
        });
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Payment gateway setting saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSaveGateway = (gateway: typeof gateways[0]) => {
    const promises = gateway.fields.map((f) =>
      saveMutation.mutateAsync({
        key: f.key,
        value: localValues[f.key] || "",
        description: `${gateway.name} - ${f.label}`,
      })
    );
    Promise.all(promises).then(() => {
      toast({ title: `${gateway.name} settings saved` });
    });
  };

  return (
    <div className="space-y-6">
      {gateways.map((gateway) => (
        <Card key={gateway.id} data-testid={`card-gateway-${gateway.id}`}>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {gateway.name}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">
                {localValues[`${gateway.id}_enabled`] === "true" ? "Enabled" : "Disabled"}
              </span>
              <Switch
                checked={localValues[`${gateway.id}_enabled`] === "true"}
                onCheckedChange={(checked) => {
                  const newVal = checked ? "true" : "false";
                  setLocalValues({ ...localValues, [`${gateway.id}_enabled`]: newVal });
                  saveMutation.mutate({
                    key: `${gateway.id}_enabled`,
                    value: newVal,
                    description: `${gateway.name} enabled/disabled`,
                  });
                }}
                data-testid={`switch-gateway-${gateway.id}`}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gateway.fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-sm font-medium">{field.label}</label>
                  <Input
                    value={localValues[field.key] || ""}
                    onChange={(e) => setLocalValues({ ...localValues, [field.key]: e.target.value })}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    data-testid={`input-gateway-${field.key}`}
                  />
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => handleSaveGateway(gateway)}
                  disabled={saveMutation.isPending}
                  data-testid={`button-save-gateway-${gateway.id}`}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save {gateway.name}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ActivityLogTab() {
  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
  });

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(!logs || logs.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No activity logs found</p>
            <p className="text-sm mt-1">Activity will appear here as actions are performed</p>
          </div>
        ) : (
          <Table data-testid="table-activity-logs">
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} data-testid={`row-activity-log-${log.id}`}>
                  <TableCell>
                    <Badge variant="secondary" data-testid={`badge-activity-action-${log.id}`}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell data-testid={`text-activity-module-${log.id}`}>
                    <span className="font-medium">{log.module}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground" data-testid={`text-activity-desc-${log.id}`}>
                    {log.description}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground" data-testid={`text-activity-time-${log.id}`}>
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
