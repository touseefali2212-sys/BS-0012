import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Package,
  Zap,
  Search,
  Tv,
  Radio,
  Layers,
  Wifi,
  Receipt,
  Users,
  Settings,
  Percent,
  Building2,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
  Users2,
  TrendingUp,
  ShoppingBag,
  UserCheck,
  ChevronsUpDown,
  Download,
  FileText,
  Copy,
  Power,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { usePermissions } from "@/hooks/use-permissions";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertPackageSchema,
  type Package as PkgType,
  type InsertPackage,
  type Setting,
  type Vendor,
  type Customer,
  type Reseller,
  type VendorPackage,
} from "@shared/schema";
import { z } from "zod";

const packageFormSchema = insertPackageSchema.extend({
  name: z.string().min(2, "Package name is required"),
  price: z.string().min(1, "Price is required"),
  vendorId: z.number().nullable().optional(),
  whTax: z.string().nullable().optional(),
  aitTax: z.string().nullable().optional(),
});

const serviceTypeLabels: Record<string, string> = {
  internet: "Internet",
  iptv: "IPTV",
  cable_tv: "Cable TV",
  bundle: "Bundle",
};

const serviceTypeColors: Record<string, string> = {
  internet: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950",
  iptv: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950",
  cable_tv: "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950",
  bundle: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950",
};

function getServiceIcon(type: string) {
  switch (type) {
    case "iptv": return <Tv className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
    case "cable_tv": return <Radio className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
    case "bundle": return <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    default: return <Wifi className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
  }
}

const taxFeeFormSchema = z.object({
  key: z.string().min(1, "Name/key is required"),
  value: z.string().min(1, "Value is required"),
  category: z.string().default("billing"),
  description: z.string().optional(),
});

type TaxFeeForm = z.infer<typeof taxFeeFormSchema>;

const applyToOptions = [
  { value: "all", label: "All Services" },
  { value: "internet", label: "Internet" },
  { value: "iptv", label: "IPTV" },
  { value: "cable_tv", label: "Cable TV" },
  { value: "bundle", label: "Bundle" },
];

function TaxExtraFeeTab() {
  const { toast } = useToast();
  const [feeType, setFeeType] = useState("tax_rate");
  const [applyTo, setApplyTo] = useState("all");
  const [editingFee, setEditingFee] = useState<Setting | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: allSettings, isLoading } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  const parseDescription = (desc: string | null | undefined) => {
    try { return JSON.parse(desc || "{}"); }
    catch { return { type: "unknown", name: desc || "", applyTo: "all" }; }
  };

  const taxFeeTypes = ["tax_rate", "service_tax", "wh_tax", "ait_tax", "extra_fee"];
  const billingSettings = (allSettings || []).filter((s) => {
    if (s.category !== "billing") return false;
    if (s.key.startsWith("reseller_pkg_")) return false;
    const meta = parseDescription(s.description);
    return taxFeeTypes.includes(meta.type);
  });

  const form = useForm<TaxFeeForm>({
    resolver: zodResolver(taxFeeFormSchema),
    defaultValues: { key: "", value: "", category: "billing", description: "" },
  });

  const editForm = useForm<TaxFeeForm>({
    resolver: zodResolver(taxFeeFormSchema),
    defaultValues: { key: "", value: "", category: "billing", description: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TaxFeeForm) => {
      const payload = {
        key: `${feeType}_${applyTo}_${Date.now()}`,
        value: data.value,
        category: "billing",
        description: JSON.stringify({ type: feeType, name: data.key, applyTo }),
      };
      const res = await apiRequest("POST", "/api/settings", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      form.reset();
      toast({ title: "Tax/fee saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { value: string; description: string } }) => {
      const res = await apiRequest("PATCH", `/api/settings/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setEditDialogOpen(false);
      setEditingFee(null);
      toast({ title: "Tax/fee updated successfully" });
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
      toast({ title: "Tax/fee removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const [editFeeType, setEditFeeType] = useState("tax_rate");
  const [editApplyTo, setEditApplyTo] = useState("all");

  const openEditFee = (setting: Setting) => {
    const meta = parseDescription(setting.description);
    setEditingFee(setting);
    setEditFeeType(meta.type || "tax_rate");
    setEditApplyTo(meta.applyTo || "all");
    editForm.reset({ key: meta.name || setting.key, value: setting.value, category: "billing", description: "" });
    setEditDialogOpen(true);
  };

  const onEditSubmit = (data: TaxFeeForm) => {
    if (!editingFee) return;
    updateMutation.mutate({
      id: editingFee.id,
      data: {
        value: data.value,
        description: JSON.stringify({ type: editFeeType, name: data.key, applyTo: editApplyTo }),
      },
    });
  };

  const feeTypeLabels: Record<string, string> = {
    tax_rate: "Tax Rate",
    service_tax: "Service Tax",
    wh_tax: "WH Tax",
    ait_tax: "AIT Tax",
    extra_fee: "Extra Fee",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            Add Tax or Extra Fee
          </h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fee Type</label>
                  <Select value={feeType} onValueChange={setFeeType}>
                    <SelectTrigger data-testid="select-fee-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tax_rate">Tax Rate (%)</SelectItem>
                      <SelectItem value="service_tax">Service Tax (%)</SelectItem>
                      <SelectItem value="wh_tax">WH Tax (%)</SelectItem>
                      <SelectItem value="ait_tax">AIT Tax (%)</SelectItem>
                      <SelectItem value="extra_fee">Extra Fee (Fixed Amount)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <FormField control={form.control} name="key" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{feeType === "extra_fee" ? "Fee Name" : "Tax Name"}</FormLabel>
                    <FormControl>
                      <Input placeholder={feeType === "extra_fee" ? "e.g. Installation Fee" : "e.g. VAT"} data-testid="input-tax-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="value" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{feeType === "extra_fee" ? "Amount (Rs.)" : "Rate (%)"}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={feeType === "extra_fee" ? "500" : "10"} data-testid="input-tax-value" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Apply To</label>
                  <Select value={applyTo} onValueChange={setApplyTo}>
                    <SelectTrigger data-testid="select-apply-to"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {applyToOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-add-tax-fee">
                    <Plus className="h-4 w-4 mr-1" />
                    {createMutation.isPending ? "Saving..." : "Add"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Configured Taxes & Fees</h3>
          {isLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : billingSettings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Percent className="h-10 w-10 mb-2 opacity-30" />
              <p className="font-medium">No taxes or fees configured</p>
              <p className="text-sm mt-1">Add your first tax rate or extra fee above</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Applies To</TableHead>
                  <TableHead className="w-[90px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingSettings.map((setting) => {
                  const meta = parseDescription(setting.description);
                  return (
                    <TableRow key={setting.id} data-testid={`row-tax-fee-${setting.id}`}>
                      <TableCell>
                        <Badge variant="secondary" className="no-default-active-elevate text-xs">
                          {feeTypeLabels[meta.type] || meta.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium" data-testid={`text-fee-name-${setting.id}`}>{meta.name || setting.key}</TableCell>
                      <TableCell data-testid={`text-fee-value-${setting.id}`}>
                        {meta.type === "extra_fee" ? `Rs. ${Number(setting.value).toLocaleString()}` : `${setting.value}%`}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="no-default-active-elevate text-xs">
                          {applyToOptions.find((o) => o.value === meta.applyTo)?.label || meta.applyTo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditFee(setting)} data-testid={`button-edit-fee-${setting.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(setting.id)} data-testid={`button-delete-fee-${setting.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Tax / Fee
            </DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fee Type</label>
                <Select value={editFeeType} onValueChange={setEditFeeType}>
                  <SelectTrigger data-testid="select-edit-fee-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tax_rate">Tax Rate (%)</SelectItem>
                    <SelectItem value="service_tax">Service Tax (%)</SelectItem>
                    <SelectItem value="wh_tax">WH Tax (%)</SelectItem>
                    <SelectItem value="ait_tax">AIT Tax (%)</SelectItem>
                    <SelectItem value="extra_fee">Extra Fee (Fixed Amount)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <FormField control={editForm.control} name="key" render={({ field }) => (
                <FormItem>
                  <FormLabel>{editFeeType === "extra_fee" ? "Fee Name" : "Tax Name"}</FormLabel>
                  <FormControl>
                    <Input placeholder={editFeeType === "extra_fee" ? "e.g. Installation Fee" : "e.g. VAT"} data-testid="input-edit-tax-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={editForm.control} name="value" render={({ field }) => (
                <FormItem>
                  <FormLabel>{editFeeType === "extra_fee" ? "Amount (Rs.)" : "Rate (%)"}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder={editFeeType === "extra_fee" ? "500" : "10"} data-testid="input-edit-tax-value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="space-y-2">
                <label className="text-sm font-medium">Apply To</label>
                <Select value={editApplyTo} onValueChange={setEditApplyTo}>
                  <SelectTrigger data-testid="select-edit-apply-to"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {applyToOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-edit-fee">
                  {updateMutation.isPending ? "Saving..." : "Update"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type ResellerEntry = { id: number; commission: number };

function ResellerPackagesTab({ packages, isLoading, customers }: { packages: PkgType[]; isLoading: boolean; customers: Customer[] }) {
  const { toast } = useToast();
  const [commissionInputs, setCommissionInputs] = useState<Record<string, string>>({});

  const { data: allSettings } = useQuery<Setting[]>({ queryKey: ["/api/settings"] });
  const { data: allResellers } = useQuery<Reseller[]>({ queryKey: ["/api/resellers"] });
  const activeResellers = (allResellers || []).filter(r => r.status === "active");

  const resellerSettings = (allSettings || []).filter((s) => s.category === "billing" && s.key.startsWith("reseller_pkg_"));
  const getResellerSetting = (pkgId: number) => resellerSettings.find((s) => s.key === `reseller_pkg_${pkgId}`);

  const parseMeta = (desc: string | null | undefined) => {
    try { return JSON.parse(desc || "{}"); } catch { return {}; }
  };

  const getResellerEntries = (pkgId: number): ResellerEntry[] => {
    const setting = getResellerSetting(pkgId);
    if (!setting) return [];
    const meta = parseMeta(setting.description);
    if (Array.isArray(meta.resellers)) return meta.resellers;
    if (Array.isArray(meta.allowedResellers)) return meta.allowedResellers.map((id: number) => ({ id, commission: 0 }));
    return [];
  };

  const saveResellerEntries = useMutation({
    mutationFn: async ({ pkgId, resellers }: { pkgId: number; resellers: ResellerEntry[] }) => {
      const setting = getResellerSetting(pkgId);
      const res = await apiRequest("POST", "/api/settings", {
        key: `reseller_pkg_${pkgId}`,
        value: resellers.length > 0 ? "1" : "0",
        category: "billing",
        description: JSON.stringify({ type: "reseller_config", packageId: pkgId, resellers }),
      });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/settings"] }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ pkgId, enabled }: { pkgId: number; enabled: boolean }) => {
      if (enabled) {
        const res = await apiRequest("POST", "/api/settings", {
          key: `reseller_pkg_${pkgId}`, value: "0", category: "billing",
          description: JSON.stringify({ type: "reseller_config", packageId: pkgId, resellers: [] }),
        });
        return res.json();
      } else {
        const setting = getResellerSetting(pkgId);
        if (setting) await apiRequest("DELETE", `/api/settings/${setting.id}`);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/settings"] }); toast({ title: "Reseller setting updated" }); },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Reseller Package Configuration
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Enable packages for reseller distribution and assign individual commission rates per reseller.</p>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="h-10 w-10 mb-2 opacity-30" />
              <p className="font-medium">No packages available</p>
              <p className="text-sm mt-1">Create packages first in the Packages List tab</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="vendor-table-enterprise">
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Active Customers</TableHead>
                    <TableHead>Monthly Income</TableHead>
                    <TableHead>Reseller Commissions & Subtotals</TableHead>
                    <TableHead>Enabled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packages.map((pkg) => {
                    const setting = getResellerSetting(pkg.id);
                    const isEnabled = !!setting;
                    const basePrice = Number(pkg.price);
                    const entries = getResellerEntries(pkg.id);
                    const activeCusts = customers.filter(c => c.packageId === pkg.id && c.status === "active");
                    const totalIncome = activeCusts.reduce((s, c) => s + Number(c.monthlyBill || pkg.price || 0), 0);
                    return (
                      <TableRow key={pkg.id} data-testid={`row-reseller-pkg-${pkg.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                              {getServiceIcon(pkg.serviceType || "internet")}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-sm" data-testid={`text-reseller-pkg-name-${pkg.id}`}>{pkg.name}</p>
                                {pkg.id < 0 && <Badge variant="outline" className="text-[9px] border-amber-400 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0">Vendor</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground">{pkg.speed || pkg.channels || ""}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`no-default-active-elevate text-xs ${serviceTypeColors[pkg.serviceType || "internet"]}`}>
                            {serviceTypeLabels[pkg.serviceType || "internet"]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-sm" data-testid={`text-reseller-price-${pkg.id}`}>Rs. {basePrice.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Users2 className="h-3.5 w-3.5 text-blue-500" />
                            <span className="font-semibold text-sm" data-testid={`text-reseller-customers-${pkg.id}`}>{activeCusts.length}</span>
                            <span className="text-xs text-muted-foreground">active</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                            <span className="font-semibold text-sm text-green-700 dark:text-green-400" data-testid={`text-reseller-income-${pkg.id}`}>
                              Rs. {totalIncome.toLocaleString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2 min-w-[320px]">
                            {!isEnabled ? (
                              <span className="text-xs text-muted-foreground italic">Not enabled for resellers</span>
                            ) : entries.length === 0 ? (
                              <span className="text-xs text-muted-foreground">No resellers assigned yet</span>
                            ) : (
                              <div className="rounded-md border border-border overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                      <th className="text-left px-2 py-1 font-medium text-muted-foreground">Reseller</th>
                                      <th className="text-right px-2 py-1 font-medium text-muted-foreground">Commission</th>
                                      <th className="text-right px-2 py-1 font-medium text-muted-foreground">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {entries.map((entry, idx) => {
                                      const reseller = activeResellers.find(r => r.id === entry.id);
                                      if (!reseller) return null;
                                      const subtotal = basePrice + entry.commission;
                                      return (
                                        <tr key={entry.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"} data-testid={`row-reseller-entry-${pkg.id}-${entry.id}`}>
                                          <td className="px-2 py-1.5">
                                            <div className="flex items-center gap-1.5">
                                              <UserCheck className="h-3 w-3 text-green-600 flex-shrink-0" />
                                              <div>
                                                <p className="font-medium leading-tight">{reseller.name}</p>
                                                <p className="text-muted-foreground text-[10px]">{reseller.area}</p>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-2 py-1.5 text-right">
                                            <span className="text-amber-700 dark:text-amber-400 font-medium">
                                              + Rs. {entry.commission.toLocaleString()}
                                            </span>
                                          </td>
                                          <td className="px-2 py-1.5 text-right">
                                            <span className="font-bold text-green-700 dark:text-green-400" data-testid={`text-subtotal-${pkg.id}-${entry.id}`}>
                                              Rs. {subtotal.toLocaleString()}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                            {isEnabled && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-7 text-xs px-3 gap-1.5 w-fit" data-testid={`button-manage-resellers-${pkg.id}`}>
                                    <ChevronsUpDown className="h-3 w-3" />Manage Resellers
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0" align="start">
                                  <div className="px-4 py-3 border-b border-border bg-muted/30">
                                    <p className="text-sm font-semibold">{pkg.name}</p>
                                    <p className="text-xs text-muted-foreground">Base price: Rs. {basePrice.toLocaleString()} — set commission per reseller</p>
                                  </div>
                                  <div className="p-3 space-y-3 max-h-72 overflow-y-auto">
                                    {activeResellers.length === 0 ? (
                                      <p className="text-xs text-muted-foreground text-center py-4">No active resellers found</p>
                                    ) : activeResellers.map(r => {
                                      const entry = entries.find(e => e.id === r.id);
                                      const isChecked = !!entry;
                                      const inputKey = `${pkg.id}-${r.id}`;
                                      const inputVal = commissionInputs[inputKey] ?? (entry ? String(entry.commission) : "0");
                                      const commissionNum = Number(inputVal) || 0;
                                      const subtotal = basePrice + commissionNum;
                                      return (
                                        <div key={r.id} className="rounded-md border border-border p-2.5 space-y-2" data-testid={`panel-reseller-${pkg.id}-${r.id}`}>
                                          <div className="flex items-start gap-2">
                                            <Checkbox
                                              id={`reseller-${pkg.id}-${r.id}`}
                                              checked={isChecked}
                                              onCheckedChange={(val) => {
                                                let newEntries: ResellerEntry[];
                                                if (val) {
                                                  const commission = Number(commissionInputs[inputKey] || 0);
                                                  newEntries = [...entries, { id: r.id, commission }];
                                                } else {
                                                  newEntries = entries.filter(e => e.id !== r.id);
                                                  setCommissionInputs(prev => { const next = { ...prev }; delete next[inputKey]; return next; });
                                                }
                                                saveResellerEntries.mutate({ pkgId: pkg.id, resellers: newEntries });
                                              }}
                                              data-testid={`checkbox-reseller-${pkg.id}-${r.id}`}
                                              className="mt-0.5"
                                            />
                                            <label htmlFor={`reseller-${pkg.id}-${r.id}`} className="text-xs cursor-pointer flex-1">
                                              <span className="font-semibold block">{r.name}</span>
                                              <span className="text-muted-foreground">{r.area} · {r.resellerType.replace(/_/g, " ")}</span>
                                            </label>
                                          </div>
                                          {isChecked && (
                                            <div className="pl-6 space-y-1.5">
                                              <div className="flex items-center gap-2">
                                                <label className="text-[10px] text-muted-foreground w-20 flex-shrink-0">Commission (Rs.)</label>
                                                <Input
                                                  type="number"
                                                  className="h-6 text-xs px-2 w-28"
                                                  value={inputVal}
                                                  data-testid={`input-commission-${pkg.id}-${r.id}`}
                                                  onChange={(e) => setCommissionInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
                                                  onBlur={(e) => {
                                                    const commission = Number(e.target.value) || 0;
                                                    const newEntries = entries.map(en => en.id === r.id ? { ...en, commission } : en);
                                                    saveResellerEntries.mutate({ pkgId: pkg.id, resellers: newEntries });
                                                  }}
                                                />
                                              </div>
                                              <div className="flex items-center justify-between text-[10px]">
                                                <span className="text-muted-foreground">Rs. {basePrice.toLocaleString()} + Rs. {commissionNum.toLocaleString()}</span>
                                                <span className="font-bold text-green-700 dark:text-green-400">= Rs. {subtotal.toLocaleString()}</span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch checked={isEnabled} onCheckedChange={(checked) => toggleMutation.mutate({ pkgId: pkg.id, enabled: checked })} data-testid={`switch-reseller-${pkg.id}`} />
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
    </div>
  );
}

function PriceBreakdownPreview({ form }: { form: ReturnType<typeof useForm> }) {
  const watchedPrice = useWatch({ control: form.control, name: "price" });
  const watchedWh = useWatch({ control: form.control, name: "whTax" });
  const watchedAit = useWatch({ control: form.control, name: "aitTax" });

  const base = Number(watchedPrice) || 0;
  const whAmt = watchedWh ? (base * Number(watchedWh)) / 100 : 0;
  const aitAmt = watchedAit ? (base * Number(watchedAit)) / 100 : 0;
  const total = base + whAmt + aitAmt;
  const hasTax = whAmt > 0 || aitAmt > 0;

  if (base === 0) return null;

  return (
    <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price Breakdown</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Package Price</span>
        <span className="font-semibold">Rs. {base.toLocaleString()}</span>
      </div>
      {whAmt > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
            <Percent className="h-3 w-3" /> WH Tax ({watchedWh}%)
          </span>
          <span className="text-amber-700 dark:text-amber-400 font-medium">+ Rs. {whAmt.toLocaleString()}</span>
        </div>
      )}
      {aitAmt > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400">
            <Percent className="h-3 w-3" /> AIT Tax ({watchedAit}%)
          </span>
          <span className="text-rose-700 dark:text-rose-400 font-medium">+ Rs. {aitAmt.toLocaleString()}</span>
        </div>
      )}
      {hasTax && (
        <div className="border-t border-primary/20 pt-2 flex items-center justify-between">
          <span className="text-sm font-semibold">Actual Price</span>
          <span className="text-base font-bold text-green-700 dark:text-green-400">Rs. {total.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

export default function PackagesPage() {
  const { toast } = useToast();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [tab, changeTab] = useTab("list");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PkgType | null>(null);
  const [sortField, setSortField] = useState<"name" | "price" | "serviceType">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { data: packages, isLoading } = useQuery<PkgType[]>({ queryKey: ["/api/packages"] });
  const { data: vendors } = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });
  const { data: customers } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: vendorPackagesData } = useQuery<VendorPackage[]>({ queryKey: ["/api/vendor-packages"] });
  const allVendors = vendors || [];
  const allCustomers = customers || [];
  const allVendorPackages = vendorPackagesData || [];

  const vendorPkgsAsPkgs: PkgType[] = allVendorPackages
    .filter(vp => !(packages || []).some(p => p.name === vp.packageName && p.vendorId === vp.vendorId))
    .map(vp => ({
      id: -(vp.id),
      name: vp.packageName,
      serviceType: "internet",
      speed: vp.speed || null,
      price: vp.ispSellingPrice,
      billingCycle: "monthly",
      dataLimit: vp.dataLimit || null,
      channels: null,
      features: null,
      description: `Vendor Package — Cost: Rs. ${Number(vp.vendorPrice).toLocaleString()} | Reseller: Rs. ${Number(vp.resellerPrice || 0).toLocaleString()}`,
      isActive: vp.isActive,
      vendorId: vp.vendorId,
      whTax: null,
      aitTax: null,
    }));

  const mergedPackages = [...(packages || []), ...vendorPkgsAsPkgs];

  const form = useForm<InsertPackage>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      name: "", serviceType: "internet", speed: "", price: "0",
      billingCycle: "monthly", dataLimit: "", channels: "", features: "",
      description: "", isActive: true, vendorId: null,
    },
  });

  const watchedServiceType = useWatch({ control: form.control, name: "serviceType" });
  const showInternetFields = watchedServiceType === "internet" || watchedServiceType === "bundle";
  const showTvFields = watchedServiceType === "iptv" || watchedServiceType === "cable_tv" || watchedServiceType === "bundle";

  const createMutation = useMutation({
    mutationFn: async (data: InsertPackage) => {
      const res = await apiRequest("POST", "/api/packages", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      setDialogOpen(false); form.reset();
      toast({ title: "Package created successfully" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertPackage> }) => {
      const res = await apiRequest("PATCH", `/api/packages/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      setDialogOpen(false); setEditingPkg(null); form.reset();
      toast({ title: "Package updated successfully" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/packages/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      toast({ title: "Package deleted successfully" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const openCreate = () => {
    setEditingPkg(null);
    form.reset({ name: "", serviceType: "internet", speed: "", price: "0", billingCycle: "monthly", dataLimit: "", channels: "", features: "", description: "", isActive: true, vendorId: null, whTax: "", aitTax: "" });
    setDialogOpen(true);
  };

  const openEdit = (pkg: PkgType) => {
    setEditingPkg(pkg);
    form.reset({
      name: pkg.name, serviceType: pkg.serviceType || "internet", speed: pkg.speed || "",
      price: pkg.price, billingCycle: pkg.billingCycle, dataLimit: pkg.dataLimit || "",
      channels: pkg.channels || "", features: pkg.features || "", description: pkg.description || "",
      isActive: pkg.isActive, vendorId: pkg.vendorId ?? null,
      whTax: pkg.whTax ?? "", aitTax: pkg.aitTax ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertPackage) => {
    const cleaned = {
      ...data,
      whTax: (data as any).whTax === "" ? null : (data as any).whTax || null,
      aitTax: (data as any).aitTax === "" ? null : (data as any).aitTax || null,
    };
    if (editingPkg) updateMutation.mutate({ id: editingPkg.id, data: cleaned });
    else createMutation.mutate(cleaned);
  };

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/packages/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      toast({ title: "Package status updated" });
    },
    onError: (error: Error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const duplicatePackage = (pkg: PkgType) => {
    setEditingPkg(null);
    form.reset({
      name: pkg.name + " (Copy)", serviceType: pkg.serviceType || "internet", speed: pkg.speed || "",
      price: pkg.price, billingCycle: pkg.billingCycle, dataLimit: pkg.dataLimit || "",
      channels: pkg.channels || "", features: pkg.features || "", description: pkg.description || "",
      isActive: true, vendorId: pkg.vendorId ?? null,
      whTax: pkg.whTax ?? "", aitTax: pkg.aitTax ?? "",
    });
    setDialogOpen(true);
  };

  const escHtml = (str: string | number | null | undefined): string => {
    return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  };

  const csvSafe = (val: string) => {
    const s = String(val);
    if (/^[=+\-@\t\r]/.test(s)) return "'" + s;
    return s;
  };

  const exportPackagesCSV = () => {
    if (filtered.length === 0) return;
    const headers = ["Package Name", "Service Type", "Vendor", "Price", "WH Tax %", "AIT Tax %", "Speed", "Channels", "Data Limit", "Billing Cycle", "Status", "Active Customers", "Monthly Income"];
    const rows = filtered.map(p => {
      const vendor = allVendors.find(v => v.id === p.vendorId);
      const activeCusts = allCustomers.filter(c => c.packageId === p.id && c.status === "active");
      const totalIncome = activeCusts.reduce((s, c) => s + Number(c.monthlyBill || p.price || 0), 0);
      return [
        p.name, serviceTypeLabels[p.serviceType || "internet"], vendor?.name || "",
        p.price, p.whTax || "", p.aitTax || "", p.speed || "", p.channels || "",
        p.dataLimit || "", p.billingCycle, p.isActive ? "Active" : "Inactive",
        String(activeCusts.length), String(totalIncome)
      ];
    });
    const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(c => `"${csvSafe(String(c)).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `packages_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePackagesPDF = () => {
    if (filtered.length === 0) return;
    const totalIncome = filtered.reduce((sum, p) => {
      const custs = allCustomers.filter(c => c.packageId === p.id && c.status === "active");
      return sum + custs.reduce((s, c) => s + Number(c.monthlyBill || p.price || 0), 0);
    }, 0);
    const rows = filtered.map(p => {
      const vendor = allVendors.find(v => v.id === p.vendorId);
      const activeCusts = allCustomers.filter(c => c.packageId === p.id && c.status === "active");
      const income = activeCusts.reduce((s, c) => s + Number(c.monthlyBill || p.price || 0), 0);
      const base = Number(p.price);
      const whAmt = p.whTax ? (base * Number(p.whTax)) / 100 : 0;
      const aitAmt = p.aitTax ? (base * Number(p.aitTax)) / 100 : 0;
      const actual = base + whAmt + aitAmt;
      return `<tr>
        <td>${escHtml(p.name)}</td>
        <td><span class="badge ${p.serviceType === "internet" ? "badge-blue" : p.serviceType === "iptv" ? "badge-purple" : p.serviceType === "cable_tv" ? "badge-orange" : "badge-green"}">${escHtml(serviceTypeLabels[p.serviceType || "internet"])}</span></td>
        <td>${escHtml(vendor?.name || "—")}</td>
        <td>Rs. ${base.toLocaleString()}${whAmt > 0 || aitAmt > 0 ? `<br/><span class="actual">Actual: Rs. ${actual.toLocaleString()}</span>` : ""}</td>
        <td>${escHtml(p.speed || p.channels || "—")}</td>
        <td>${escHtml(p.billingCycle)}</td>
        <td>${activeCusts.length}</td>
        <td>Rs. ${income.toLocaleString()}</td>
        <td><span class="badge ${p.isActive ? "badge-green" : "badge-red"}">${p.isActive ? "Active" : "Inactive"}</span></td>
      </tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html><head><title>Packages Report</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 20px; }
      h1 { font-size: 16px; margin-bottom: 2px; }
      .meta { font-size: 11px; color: #555; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #1e293b; color: #fff; padding: 7px 6px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
      td { padding: 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
      tr:nth-child(even) td { background: #f8fafc; }
      .badge { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
      .badge-blue { background: #dbeafe; color: #1d4ed8; }
      .badge-purple { background: #f3e8ff; color: #7c3aed; }
      .badge-orange { background: #fff7ed; color: #c2410c; }
      .badge-green { background: #dcfce7; color: #15803d; }
      .badge-red { background: #fef2f2; color: #dc2626; }
      .actual { font-size: 9px; color: #15803d; font-weight: 600; }
      .footer { margin-top: 16px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
      @media print { body { padding: 10mm; } }
    </style></head><body>
    <h1>Service Packages Report</h1>
    <p class="meta">
      <strong>Total:</strong> ${filtered.length} packages &nbsp;&nbsp;
      <strong>Active:</strong> ${filtered.filter(p => p.isActive).length} &nbsp;&nbsp;
      <strong>Total Monthly Income:</strong> Rs. ${totalIncome.toLocaleString()} &nbsp;&nbsp;
      <strong>Generated:</strong> ${new Date().toLocaleString()}
    </p>
    <table>
      <thead><tr>
        <th>Package</th><th>Type</th><th>Vendor</th><th>Price</th><th>Speed/Channels</th>
        <th>Billing</th><th>Customers</th><th>Monthly Income</th><th>Status</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="footer">NetSphere Enterprise — Service Packages Report</p>
    </body></html>`;
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field
      ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3 ml-1 inline" /> : <ChevronDown className="h-3 w-3 ml-1 inline" />)
      : <ChevronUp className="h-3 w-3 ml-1 inline opacity-20" />;

  const typeCounts = mergedPackages.reduce((acc, p) => {
    const t = p.serviceType || "internet";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filtered = mergedPackages
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.speed || "").toLowerCase().includes(search.toLowerCase()) ||
        (allVendors.find(v => v.id === p.vendorId)?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || p.serviceType === filterType;
      return matchSearch && matchType;
    })
    .sort((a, b) => {
      let va: string | number = "", vb: string | number = "";
      if (sortField === "name") { va = a.name; vb = b.name; }
      else if (sortField === "price") { va = Number(a.price); vb = Number(b.price); }
      else if (sortField === "serviceType") { va = a.serviceType || ""; vb = b.serviceType || ""; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const isVendorPkg = (pkg: PkgType) => pkg.id < 0;

  const stats = {
    total: mergedPackages.length,
    active: mergedPackages.filter(p => p.isActive).length,
    internet: typeCounts["internet"] || 0,
    iptv: typeCounts["iptv"] || 0,
    vendorPkgs: vendorPkgsAsPkgs.length,
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-packages-title">Packages</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage Internet, IPTV & Cable TV service packages</p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "list" && (
            <>
              <Button size="sm" variant="outline" onClick={exportPackagesCSV} data-testid="button-export-packages-csv">
                <Download className="h-3.5 w-3.5 mr-1" />
                Export CSV
              </Button>
              <Button size="sm" variant="outline" onClick={generatePackagesPDF} data-testid="button-generate-packages-pdf">
                <FileText className="h-3.5 w-3.5 mr-1" />
                Generate PDF
              </Button>
            </>
          )}
          {tab === "list" && canCreate("packages") && (
            <Button onClick={openCreate} data-testid="button-add-package">
              <Plus className="h-4 w-4 mr-1" />
              Add Package
            </Button>
          )}
        </div>
      </div>

      {tab === "list" && (
        <div className="space-y-5" data-testid="tab-content-list">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="vendor-stat-card stat-blue p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Packages</p>
                </div>
              </div>
            </div>
            <div className="vendor-stat-card stat-green p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-950">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </div>
            <div className="vendor-stat-card stat-cyan p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-950">
                  <Wifi className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.internet}</p>
                  <p className="text-xs text-muted-foreground">Internet</p>
                </div>
              </div>
            </div>
            <div className="vendor-stat-card stat-purple p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950">
                  <Tv className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.iptv}</p>
                  <p className="text-xs text-muted-foreground">IPTV</p>
                </div>
              </div>
            </div>
            <div className="vendor-stat-card stat-amber p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950">
                  <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.vendorPkgs}</p>
                  <p className="text-xs text-muted-foreground">From Vendors</p>
                </div>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-base">All Packages</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 flex-wrap w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, speed or vendor..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 w-full sm:w-64"
                      data-testid="input-search-packages"
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <Button variant={filterType === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterType("all")} data-testid="filter-all">
                      All ({stats.total})
                    </Button>
                    {Object.entries(serviceTypeLabels).map(([key, label]) => (
                      <Button key={key} variant={filterType === key ? "default" : "outline"} size="sm" onClick={() => setFilterType(key)} data-testid={`filter-${key}`}>
                        {label} ({typeCounts[key] || 0})
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Package className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No packages found</p>
                  <p className="text-sm mt-1">Try adjusting your search or filter, or create a new package</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                  {filtered.map((pkg) => {
                    const vendor = allVendors.find(v => v.id === pkg.vendorId);
                    const activeCusts = allCustomers.filter(c => c.packageId === pkg.id && c.status === "active");
                    const totalIncome = activeCusts.reduce((s, c) => s + Number(c.monthlyBill || pkg.price || 0), 0);
                    const base = Number(pkg.price);
                    const whAmt = pkg.whTax ? (base * Number(pkg.whTax)) / 100 : 0;
                    const aitAmt = pkg.aitTax ? (base * Number(pkg.aitTax)) / 100 : 0;
                    const total = base + whAmt + aitAmt;
                    const hasTax = whAmt > 0 || aitAmt > 0;
                    return (
                      <div key={pkg.id} data-testid={`card-package-${pkg.id}`} className="bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                        <div className="p-4 pb-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="shrink-0 h-7 w-7 flex items-center justify-center">
                                {getServiceIcon(pkg.serviceType || "internet")}
                              </div>
                              <p className="font-bold text-sm leading-tight truncate" data-testid={`text-pkg-name-${pkg.id}`}>{pkg.name}</p>
                            </div>
                            {isVendorPkg(pkg) ? (
                              <Badge variant="outline" className="text-[9px] text-muted-foreground shrink-0">Vendor</Badge>
                            ) : (
                              <Switch
                                checked={!!pkg.isActive}
                                onCheckedChange={v => canEdit("packages") && toggleStatusMutation.mutate({ id: pkg.id, isActive: v })}
                                data-testid={`switch-pkg-${pkg.id}`}
                                className="shrink-0"
                              />
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1 mb-3">
                            <Badge variant="secondary" className={`text-[10px] ${serviceTypeColors[pkg.serviceType || "internet"]}`} data-testid={`badge-service-type-${pkg.id}`}>
                              {serviceTypeLabels[pkg.serviceType || "internet"]}
                            </Badge>
                            {pkg.speed && (
                              <Badge variant="outline" className="text-[10px]" data-testid={`badge-speed-${pkg.id}`}>{pkg.speed}</Badge>
                            )}
                            {pkg.billingCycle && (
                              <Badge variant="secondary" className="text-[10px] capitalize">{pkg.billingCycle}</Badge>
                            )}
                            {vendor && (
                              <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30">
                                {vendor.name}
                              </Badge>
                            )}
                          </div>

                          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-center mb-3">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">Package Price</p>
                            <p className="text-xl font-bold text-primary" data-testid={`text-pkg-price-${pkg.id}`}>
                              PKR {base.toLocaleString()}
                            </p>
                            {pkg.billingCycle && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">per {pkg.billingCycle}</p>
                            )}
                            {hasTax && (
                              <div className="mt-1.5 pt-1.5 border-t border-primary/10 space-y-0.5">
                                {whAmt > 0 && (
                                  <p className="text-[10px] text-amber-700 dark:text-amber-400">WH {pkg.whTax}% = +Rs. {whAmt.toLocaleString()}</p>
                                )}
                                {aitAmt > 0 && (
                                  <p className="text-[10px] text-rose-700 dark:text-rose-400">AIT {pkg.aitTax}% = +Rs. {aitAmt.toLocaleString()}</p>
                                )}
                                <p className="text-[10px] font-bold text-green-700 dark:text-green-400">Total: Rs. {total.toLocaleString()}</p>
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mb-2">
                            <span className="flex items-center gap-1">
                              <Users2 className="h-3 w-3 text-blue-500" />
                              <span className="font-semibold text-foreground" data-testid={`text-pkg-customers-${pkg.id}`}>{activeCusts.length}</span> active
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-green-500" />
                              <span className="font-semibold text-green-700 dark:text-green-400" data-testid={`text-pkg-income-${pkg.id}`}>Rs. {totalIncome.toLocaleString()}</span>
                            </span>
                          </div>

                          {(pkg.channels || pkg.dataLimit || pkg.features) && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {pkg.channels || pkg.dataLimit || pkg.features}
                            </p>
                          )}
                          {pkg.description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{pkg.description}</p>
                          )}
                        </div>

                        <div className="mt-auto border-t">
                          {isVendorPkg(pkg) ? (
                            <div className="p-3 text-center">
                              <span className="text-[10px] text-muted-foreground">Managed in Vendors</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 divide-x">
                              {canEdit("packages") && (
                                <button
                                  onClick={() => openEdit(pkg)}
                                  className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                  data-testid={`button-edit-pkg-${pkg.id}`}
                                >
                                  <Edit className="h-3.5 w-3.5" /> Edit
                                </button>
                              )}
                              {canCreate("packages") && (
                                <button
                                  onClick={() => duplicatePackage(pkg)}
                                  className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                  data-testid={`button-duplicate-pkg-${pkg.id}`}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {canDelete("packages") && (
                                <button
                                  onClick={() => deleteMutation.mutate(pkg.id)}
                                  className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                  data-testid={`button-delete-pkg-${pkg.id}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "tax" && (
        <div className="mt-5" data-testid="tab-content-tax">
          <TaxExtraFeeTab />
        </div>
      )}

      {tab === "reseller" && (
        <div className="mt-5" data-testid="tab-content-reseller">
          <ResellerPackagesTab packages={mergedPackages} isLoading={isLoading} customers={allCustomers} />
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPkg ? "Edit Package" : "Add New Package"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="serviceType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "internet"}>
                    <FormControl>
                      <SelectTrigger data-testid="select-service-type"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="internet">Internet</SelectItem>
                      <SelectItem value="iptv">IPTV</SelectItem>
                      <SelectItem value="cable_tv">Cable TV</SelectItem>
                      <SelectItem value="bundle">Bundle (Internet + TV)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Package Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Basic Home 10 Mbps" data-testid="input-pkg-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="vendorId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor (Optional)</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))}
                    value={field.value != null ? String(field.value) : "none"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-pkg-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">— No Vendor —</SelectItem>
                      {allVendors.map((v) => (
                        <SelectItem key={v.id} value={String(v.id)}>
                          {v.name} ({v.vendorType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (Rs.)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1000" data-testid="input-pkg-price" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="billingCycle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Cycle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "monthly"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-billing-cycle"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="biannual">Bi-Annual</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="whTax" render={({ field }) => (
                  <FormItem>
                    <FormLabel>WH Tax (%)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 10" data-testid="input-wh-tax" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="aitTax" render={({ field }) => (
                  <FormItem>
                    <FormLabel>AIT Tax (%)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 2" data-testid="input-ait-tax" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <PriceBreakdownPreview form={form} />

              {showInternetFields && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="speed" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Speed</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 10 Mbps" data-testid="input-pkg-speed" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="dataLimit" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Limit</FormLabel>
                      <FormControl>
                        <Input placeholder="Unlimited" data-testid="input-data-limit" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              {showTvFields && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="channels" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channels</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 150+ HD Channels" data-testid="input-channels" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="features" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Features</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. HD, DVR, Sports" data-testid="input-features" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Package details..." data-testid="input-pkg-description" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <FormLabel className="mb-0">Active</FormLabel>
                  <FormControl>
                    <Switch checked={field.value ?? true} onCheckedChange={field.onChange} data-testid="switch-active" />
                  </FormControl>
                </FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-package">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingPkg ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
