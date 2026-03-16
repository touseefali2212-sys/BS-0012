import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, CheckCircle, Clock,
  AlertTriangle, XCircle, Eye, X, Package, Layers, Hash,
  Activity, RefreshCw, Ban, Filter, BarChart3, TrendingUp,
  AlertCircle, ChevronRight, FileText, Zap, Shield, Download,
  Copy, Archive, Tag, Monitor, Wifi, Cable, Wrench, Box,
  CircleDot, DollarSign, ShoppingCart, Settings2, FolderTree,
  ChevronDown, ChevronUp, Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTab } from "@/hooks/use-tab";
import type { ProductType, ProductTypeCategory } from "@shared/schema";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const productFormSchema = z.object({
  productTypeId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  subCategory: z.string().optional(),
  productNature: z.string().min(1, "Product nature is required"),
  brand: z.string().optional(),
  model: z.string().optional(),
  skuCode: z.string().min(1, "SKU code is required"),
  defaultUnit: z.string().default("piece"),
  defaultPurchaseCost: z.string().optional(),
  defaultSalePrice: z.string().optional(),
  taxCategory: z.string().optional(),
  depreciationApplicable: z.boolean().default(false),
  warrantyPeriod: z.number().optional().nullable(),
  trackSerialNumber: z.boolean().default(false),
  trackMacAddress: z.boolean().default(false),
  requireIpAllocation: z.boolean().default(false),
  reorderLevel: z.number().default(10),
  minimumStockLevel: z.number().default(5),
  description: z.string().optional(),
  visibleInPos: z.boolean().default(false),
  allowDiscount: z.boolean().default(true),
  allowBulkImport: z.boolean().default(true),
  status: z.string().default("active"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  parentId: z.number().optional().nullable(),
  color: z.string().default("#3b82f6"),
  description: z.string().optional(),
  depreciationMethod: z.string().optional(),
  depreciationRate: z.string().optional(),
  customAttributes: z.string().optional(),
  status: z.string().default("active"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

const natureConfig: Record<string, { color: string; icon: any; label: string }> = {
  asset: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Monitor, label: "Asset" },
  consumable: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Box, label: "Consumable" },
  saleable: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: ShoppingCart, label: "Saleable" },
  rental: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: RefreshCw, label: "Rental" },
  service_linked: { color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400", icon: Zap, label: "Service-Linked" },
};

const categoryColors: Record<string, string> = {
  "Network Equipment": "#3b82f6",
  "Customer Devices": "#10b981",
  "Fiber Materials": "#f59e0b",
  "Tools": "#8b5cf6",
  "Spare Parts": "#f97316",
  "High-Value Assets": "#ef4444",
  "Accessories": "#06b6d4",
  "Office Equipment": "#64748b",
};

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316", "#64748b"];

const tabs = [
  { id: "overview", label: "Overview Dashboard", icon: BarChart3 },
  { id: "types", label: "Product Types", icon: Layers },
  { id: "categories", label: "Categories & Attributes", icon: FolderTree },
];

export default function ProductTypesPage() {
  const [activeTab, setActiveTab] = useTab("overview");
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ProductType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductTypeCategory | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterNature, setFilterNature] = useState<string>("all");
  const [filterDepreciation, setFilterDepreciation] = useState<string>("all");
  const [filterSerial, setFilterSerial] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isEditing, setIsEditing] = useState(false);
  const [isCategoryEditing, setIsCategoryEditing] = useState(false);

  const { data: productTypesList = [], isLoading } = useQuery<ProductType[]>({
    queryKey: ["/api/product-types"],
  });

  const { data: categories = [] } = useQuery<ProductTypeCategory[]>({
    queryKey: ["/api/product-type-categories"],
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "", category: "", subCategory: "", productNature: "",
      brand: "", model: "", skuCode: "", defaultUnit: "piece",
      defaultPurchaseCost: "", defaultSalePrice: "", taxCategory: "",
      depreciationApplicable: false, warrantyPeriod: null,
      trackSerialNumber: false, trackMacAddress: false, requireIpAllocation: false,
      reorderLevel: 10, minimumStockLevel: 5, description: "",
      visibleInPos: false, allowDiscount: true, allowBulkImport: true, status: "active",
    },
  });

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "", parentId: null, color: "#3b82f6", description: "",
      depreciationMethod: "", depreciationRate: "", customAttributes: "", status: "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const productTypeId = `PT-${String(productTypesList.length + 1).padStart(4, "0")}`;
      return apiRequest("POST", "/api/product-types", { ...data, productTypeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({ title: "Product type created", description: "The product type has been created successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create product type", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProductFormValues> }) => {
      return apiRequest("PATCH", `/api/product-types/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      setCreateDialogOpen(false);
      setIsEditing(false);
      toast({ title: "Product type updated", description: "The product type has been updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update product type", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/product-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-types"] });
      setDeleteDialogOpen(false);
      setSelectedType(null);
      toast({ title: "Product type deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete", variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      return apiRequest("POST", "/api/product-type-categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-type-categories"] });
      setCategoryDialogOpen(false);
      categoryForm.reset();
      toast({ title: "Category created" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create category", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CategoryFormValues> }) => {
      return apiRequest("PATCH", `/api/product-type-categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-type-categories"] });
      setCategoryDialogOpen(false);
      setIsCategoryEditing(false);
      toast({ title: "Category updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update category", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/product-type-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-type-categories"] });
      setDeleteCategoryDialogOpen(false);
      setSelectedCategory(null);
      toast({ title: "Category deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete category", variant: "destructive" });
    },
  });

  const stats = useMemo(() => {
    const total = productTypesList.length;
    const assetTypes = productTypesList.filter(p => p.productNature === "asset").length;
    const consumableTypes = productTypesList.filter(p => p.productNature === "consumable").length;
    const saleableTypes = productTypesList.filter(p => p.productNature === "saleable").length;
    const rentalTypes = productTypesList.filter(p => p.productNature === "rental").length;
    const active = productTypesList.filter(p => p.status === "active").length;
    const inactive = productTypesList.filter(p => p.status !== "active").length;
    const depreciation = productTypesList.filter(p => p.depreciationApplicable).length;
    return { total, assetTypes, consumableTypes, saleableTypes, rentalTypes, active, inactive, depreciation };
  }, [productTypesList]);

  const filteredTypes = useMemo(() => {
    return productTypesList.filter(p => {
      if (filterCategory !== "all" && p.category !== filterCategory) return false;
      if (filterNature !== "all" && p.productNature !== filterNature) return false;
      if (filterDepreciation !== "all") {
        if (filterDepreciation === "yes" && !p.depreciationApplicable) return false;
        if (filterDepreciation === "no" && p.depreciationApplicable) return false;
      }
      if (filterSerial !== "all") {
        if (filterSerial === "yes" && !p.trackSerialNumber) return false;
        if (filterSerial === "no" && p.trackSerialNumber) return false;
      }
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.skuCode?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.model?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [productTypesList, filterCategory, filterNature, filterDepreciation, filterSerial, filterStatus, searchQuery]);

  const uniqueCategories = useMemo(() => [...new Set(productTypesList.map(p => p.category))], [productTypesList]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    form.reset({
      name: "", category: "", subCategory: "", productNature: "",
      brand: "", model: "", skuCode: "", defaultUnit: "piece",
      defaultPurchaseCost: "", defaultSalePrice: "", taxCategory: "",
      depreciationApplicable: false, warrantyPeriod: null,
      trackSerialNumber: false, trackMacAddress: false, requireIpAllocation: false,
      reorderLevel: 10, minimumStockLevel: 5, description: "",
      visibleInPos: false, allowDiscount: true, allowBulkImport: true, status: "active",
    });
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (pt: ProductType) => {
    setIsEditing(true);
    setSelectedType(pt);
    form.reset({
      name: pt.name, category: pt.category, subCategory: pt.subCategory || "",
      productNature: pt.productNature, brand: pt.brand || "", model: pt.model || "",
      skuCode: pt.skuCode, defaultUnit: pt.defaultUnit,
      defaultPurchaseCost: pt.defaultPurchaseCost || "",
      defaultSalePrice: pt.defaultSalePrice || "", taxCategory: pt.taxCategory || "",
      depreciationApplicable: pt.depreciationApplicable,
      warrantyPeriod: pt.warrantyPeriod, trackSerialNumber: pt.trackSerialNumber,
      trackMacAddress: pt.trackMacAddress, requireIpAllocation: pt.requireIpAllocation,
      reorderLevel: pt.reorderLevel || 10, minimumStockLevel: pt.minimumStockLevel || 5,
      description: pt.description || "",
      visibleInPos: pt.visibleInPos, allowDiscount: pt.allowDiscount,
      allowBulkImport: pt.allowBulkImport, status: pt.status,
    });
    setCreateDialogOpen(true);
  };

  const handleDuplicate = (pt: ProductType) => {
    setIsEditing(false);
    form.reset({
      name: `${pt.name} (Copy)`, category: pt.category, subCategory: pt.subCategory || "",
      productNature: pt.productNature, brand: pt.brand || "", model: pt.model || "",
      skuCode: `${pt.skuCode}-COPY`, defaultUnit: pt.defaultUnit,
      defaultPurchaseCost: pt.defaultPurchaseCost || "",
      defaultSalePrice: pt.defaultSalePrice || "", taxCategory: pt.taxCategory || "",
      depreciationApplicable: pt.depreciationApplicable,
      warrantyPeriod: pt.warrantyPeriod, trackSerialNumber: pt.trackSerialNumber,
      trackMacAddress: pt.trackMacAddress, requireIpAllocation: pt.requireIpAllocation,
      reorderLevel: pt.reorderLevel || 10, minimumStockLevel: pt.minimumStockLevel || 5,
      description: pt.description || "",
      visibleInPos: pt.visibleInPos, allowDiscount: pt.allowDiscount,
      allowBulkImport: pt.allowBulkImport, status: "active",
    });
    setCreateDialogOpen(true);
  };

  const handleSubmit = (values: ProductFormValues) => {
    if (isEditing && selectedType) {
      updateMutation.mutate({ id: selectedType.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDeactivate = (pt: ProductType) => {
    updateMutation.mutate({ id: pt.id, data: { status: pt.status === "active" ? "inactive" : "active" } });
  };

  const handleOpenCategoryCreate = () => {
    setIsCategoryEditing(false);
    categoryForm.reset({ name: "", parentId: null, color: "#3b82f6", description: "", depreciationMethod: "", depreciationRate: "", customAttributes: "", status: "active" });
    setCategoryDialogOpen(true);
  };

  const handleOpenCategoryEdit = (cat: ProductTypeCategory) => {
    setIsCategoryEditing(true);
    setSelectedCategory(cat);
    categoryForm.reset({
      name: cat.name, parentId: cat.parentId, color: cat.color || "#3b82f6",
      description: cat.description || "", depreciationMethod: cat.depreciationMethod || "",
      depreciationRate: cat.depreciationRate || "", customAttributes: cat.customAttributes || "",
      status: cat.status,
    });
    setCategoryDialogOpen(true);
  };

  const handleCategorySubmit = (values: CategoryFormValues) => {
    if (isCategoryEditing && selectedCategory) {
      updateCategoryMutation.mutate({ id: selectedCategory.id, data: values });
    } else {
      createCategoryMutation.mutate(values);
    }
  };

  const exportCSV = () => {
    const headers = ["ID", "Name", "Category", "Nature", "SKU", "Default Cost", "Sale Price", "Serial Tracking", "Depreciation", "Warranty", "Status"];
    const rows = filteredTypes.map(p => [
      p.productTypeId, p.name, p.category, p.productNature, p.skuCode,
      p.defaultPurchaseCost || "", p.defaultSalePrice || "",
      p.trackSerialNumber ? "Yes" : "No", p.depreciationApplicable ? "Yes" : "No",
      p.warrantyPeriod ? `${p.warrantyPeriod} months` : "N/A", p.status,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "product_types.csv"; link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const categoryPieData = uniqueCategories.map(c => ({
    name: c, value: productTypesList.filter(p => p.category === c).length,
    color: categoryColors[c] || CHART_COLORS[uniqueCategories.indexOf(c) % CHART_COLORS.length],
  })).filter(d => d.value > 0);

  const natureBarData = Object.entries(natureConfig).map(([key, cfg]) => ({
    name: cfg.label, value: productTypesList.filter(p => p.productNature === key).length,
  })).filter(d => d.value > 0);

  const highValueTypes = productTypesList
    .filter(p => p.defaultPurchaseCost && parseFloat(p.defaultPurchaseCost) > 0)
    .sort((a, b) => parseFloat(b.defaultPurchaseCost || "0") - parseFloat(a.defaultPurchaseCost || "0"))
    .slice(0, 8)
    .map(p => ({ name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name, value: parseFloat(p.defaultPurchaseCost || "0") }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Product Types</h1>
          <p className="text-muted-foreground mt-1">Master classification system for all inventory products, devices, and materials</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button onClick={handleOpenCreate} data-testid="button-create-product-type">
            <Plus className="h-4 w-4 mr-2" /> New Product Type
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Product Types", value: stats.total, icon: Package, gradient: "from-slate-700 to-emerald-600" },
          { title: "Asset Types", value: stats.assetTypes, icon: Monitor, gradient: "from-blue-600 to-blue-400" },
          { title: "Consumable Products", value: stats.consumableTypes, icon: Box, gradient: "from-amber-600 to-amber-400" },
          { title: "Saleable Products", value: stats.saleableTypes, icon: ShoppingCart, gradient: "from-emerald-600 to-emerald-400" },
          { title: "Rental Products", value: stats.rentalTypes, icon: RefreshCw, gradient: "from-purple-600 to-purple-400" },
          { title: "Active Types", value: stats.active, icon: CheckCircle, gradient: "from-teal-600 to-teal-400" },
          { title: "Inactive Types", value: stats.inactive, icon: XCircle, gradient: "from-gray-600 to-gray-400" },
          { title: "Depreciation Tracked", value: stats.depreciation, icon: TrendingUp, gradient: "from-rose-600 to-rose-400" },
        ].map((card, i) => (
          <Card key={i} className="overflow-hidden border-0 shadow-lg" data-testid={`card-kpi-${i}`}>
            <div className={`bg-gradient-to-r ${card.gradient} p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80">{card.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                </div>
                <card.icon className="h-8 w-8 text-white/60" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-1 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`tab-${tab.id}`}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Product Types by Category</CardTitle></CardHeader>
              <CardContent>
                {categoryPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {categoryPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No product type data yet</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Product Nature Distribution</CardTitle></CardHeader>
              <CardContent>
                {natureBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={natureBarData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#059669" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">High-Value Product Types</CardTitle></CardHeader>
            <CardContent>
              {highValueTypes.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={highValueTypes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={v => `Rs.${(v / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip formatter={(v: number) => `Rs. ${v.toLocaleString()}`} />
                    <Bar dataKey="value" fill="#334155" name="Default Cost" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                  <p>No pricing data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Recent Product Types</CardTitle></CardHeader>
            <CardContent>
              {productTypesList.length > 0 ? (
                <div className="space-y-3">
                  {productTypesList.slice(0, 5).map(pt => {
                    const nc = natureConfig[pt.productNature] || natureConfig.asset;
                    const NatureIcon = nc.icon;
                    return (
                      <div key={pt.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedType(pt); setViewDialogOpen(true); }} data-testid={`row-recent-${pt.id}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${nc.color}`}><NatureIcon className="h-4 w-4" /></div>
                          <div>
                            <p className="font-medium">{pt.name}</p>
                            <p className="text-sm text-muted-foreground">{pt.category} | SKU: {pt.skuCode}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={nc.color}>{nc.label}</Badge>
                          <Badge variant={pt.status === "active" ? "default" : "secondary"}>{pt.status}</Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No product types created yet</p>
                  <p className="text-sm mt-1">Create your first product type to define your inventory catalog</p>
                  <Button className="mt-4" onClick={handleOpenCreate} data-testid="button-create-first">
                    <Plus className="h-4 w-4 mr-2" /> New Product Type
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "types" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, SKU, brand, model..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search" />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[160px]" data-testid="select-filter-category"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                {categories.map(c => !uniqueCategories.includes(c.name) && <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterNature} onValueChange={setFilterNature}>
              <SelectTrigger className="w-[140px]" data-testid="select-filter-nature"><SelectValue placeholder="Nature" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Natures</SelectItem>
                {Object.entries(natureConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterDepreciation} onValueChange={setFilterDepreciation}>
              <SelectTrigger className="w-[150px]" data-testid="select-filter-depreciation"><SelectValue placeholder="Depreciation" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Depreciation: Yes</SelectItem>
                <SelectItem value="no">Depreciation: No</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSerial} onValueChange={setFilterSerial}>
              <SelectTrigger className="w-[150px]" data-testid="select-filter-serial"><SelectValue placeholder="Serial Track" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Serial: Yes</SelectItem>
                <SelectItem value="no">Serial: No</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px]" data-testid="select-filter-status"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                    <th className="px-4 py-3 text-left font-medium">Product Type ID</th>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Category</th>
                    <th className="px-4 py-3 text-left font-medium">Nature</th>
                    <th className="px-4 py-3 text-left font-medium">SKU</th>
                    <th className="px-4 py-3 text-left font-medium">Default Cost</th>
                    <th className="px-4 py-3 text-left font-medium">Sale Price</th>
                    <th className="px-4 py-3 text-left font-medium">Serial</th>
                    <th className="px-4 py-3 text-left font-medium">Depreciation</th>
                    <th className="px-4 py-3 text-left font-medium">Warranty</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTypes.length > 0 ? filteredTypes.map(pt => {
                    const nc = natureConfig[pt.productNature] || natureConfig.asset;
                    return (
                      <tr key={pt.id} className="hover:bg-muted/50 transition-colors" data-testid={`row-product-type-${pt.id}`}>
                        <td className="px-4 py-3 font-medium">{pt.productTypeId}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{pt.name}</p>
                            {pt.brand && <p className="text-xs text-muted-foreground">{pt.brand} {pt.model || ""}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3">{pt.category}</td>
                        <td className="px-4 py-3"><Badge className={nc.color}>{nc.label}</Badge></td>
                        <td className="px-4 py-3 font-mono text-xs">{pt.skuCode}</td>
                        <td className="px-4 py-3">{pt.defaultPurchaseCost ? `Rs. ${parseFloat(pt.defaultPurchaseCost).toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-3">{pt.defaultSalePrice ? `Rs. ${parseFloat(pt.defaultSalePrice).toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-3">
                          {pt.trackSerialNumber ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-gray-300" />}
                        </td>
                        <td className="px-4 py-3">
                          {pt.depreciationApplicable ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-gray-300" />}
                        </td>
                        <td className="px-4 py-3">{pt.warrantyPeriod ? `${pt.warrantyPeriod}m` : "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant={pt.status === "active" ? "default" : "secondary"}>{pt.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${pt.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedType(pt); setViewDialogOpen(true); }}>
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEdit(pt)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(pt)}>
                                <Copy className="h-4 w-4 mr-2" /> Duplicate Type
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeactivate(pt)}>
                                {pt.status === "active" ? <><Ban className="h-4 w-4 mr-2" /> Deactivate</> : <><CheckCircle className="h-4 w-4 mr-2" /> Activate</>}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateMutation.mutate({ id: pt.id, data: { status: "archived" } })}>
                                <Archive className="h-4 w-4 mr-2" /> Archive
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setSelectedType(pt); setDeleteDialogOpen(true); }} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No product types found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or create a new product type</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Category & Attribute Management</h2>
            <Button onClick={handleOpenCategoryCreate} data-testid="button-create-category">
              <Plus className="h-4 w-4 mr-2" /> New Category
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Category Hierarchy</CardTitle></CardHeader>
              <CardContent>
                {categories.length > 0 ? (
                  <div className="space-y-2">
                    {categories.filter(c => !c.parentId).map(parent => {
                      const children = categories.filter(c => c.parentId === parent.id);
                      const typeCount = productTypesList.filter(p => p.category === parent.name).length;
                      return (
                        <div key={parent.id} className="border rounded-lg" data-testid={`card-category-${parent.id}`}>
                          <div className="flex items-center justify-between p-3 hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: parent.color || "#3b82f6" }} />
                              <div>
                                <p className="font-medium">{parent.name}</p>
                                <p className="text-xs text-muted-foreground">{typeCount} product types{parent.depreciationMethod ? ` | ${parent.depreciationMethod}` : ""}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{parent.status}</Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleOpenCategoryEdit(parent)}>
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedCategory(parent); setDeleteCategoryDialogOpen(true); }} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          {children.length > 0 && (
                            <div className="border-t pl-8 py-1">
                              {children.map(child => (
                                <div key={child.id} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-border rounded" />
                                    <span className="text-sm">{child.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenCategoryEdit(child)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => { setSelectedCategory(child); setDeleteCategoryDialogOpen(true); }}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {categories.filter(c => c.parentId && !categories.some(p => p.id === c.parentId)).length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Uncategorized Sub-Categories</p>
                        {categories.filter(c => c.parentId && !categories.some(p => p.id === c.parentId)).map(cat => (
                          <div key={cat.id} className="flex items-center justify-between p-2 border rounded mb-1">
                            <span className="text-sm">{cat.name}</span>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenCategoryEdit(cat)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No categories defined</p>
                    <p className="text-sm mt-1">Create categories to organize your product types</p>
                    <Button className="mt-4" onClick={handleOpenCategoryCreate} data-testid="button-create-first-category">
                      <Plus className="h-4 w-4 mr-2" /> New Category
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Default Category Templates</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Network Equipment", sub: ["OLT", "ONU", "Router", "Switch"], icon: Monitor, color: "#3b82f6" },
                    { name: "Customer Devices", sub: ["CPE", "Modem", "WiFi Router"], icon: Wifi, color: "#10b981" },
                    { name: "Fiber Materials", sub: ["Cable", "Splitter", "Patch Cord"], icon: Cable, color: "#f59e0b" },
                    { name: "Tools & Equipment", sub: ["OTDR", "Power Meter", "Splicer"], icon: Wrench, color: "#8b5cf6" },
                    { name: "Spare Parts", sub: ["Connectors", "Adapters", "Modules"], icon: Settings2, color: "#f97316" },
                    { name: "Accessories", sub: ["Mounting", "Enclosures", "Labels"], icon: Tag, color: "#06b6d4" },
                  ].map((tmpl, i) => {
                    const exists = categories.some(c => c.name === tmpl.name);
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${tmpl.color}20`, color: tmpl.color }}>
                            <tmpl.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{tmpl.name}</p>
                            <p className="text-xs text-muted-foreground">{tmpl.sub.join(", ")}</p>
                          </div>
                        </div>
                        {exists ? (
                          <Badge variant="outline" className="text-emerald-600"><CheckCircle className="h-3 w-3 mr-1" /> Created</Badge>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => {
                            createCategoryMutation.mutate({ name: tmpl.name, color: tmpl.color, description: `${tmpl.name} category`, status: "active" });
                          }} data-testid={`button-create-template-${i}`}>
                            <Plus className="h-3 w-3 mr-1" /> Create
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Product Type" : "Create New Product Type"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Type Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Huawei ONU HG8546M" {...field} data-testid="input-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="skuCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU Code</FormLabel>
                    <FormControl><Input placeholder="e.g. ONU-HG8546M" {...field} data-testid="input-sku" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-category"><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        {["Network Equipment", "Customer Devices", "Fiber Materials", "Tools", "Spare Parts", "Accessories", "Office Equipment"].filter(c => !categories.some(cat => cat.name === c)).map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="subCategory" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub-Category</FormLabel>
                    <FormControl><Input placeholder="e.g. GPON ONU" {...field} data-testid="input-subcategory" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="productNature" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Nature</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-nature"><SelectValue placeholder="Select nature" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(natureConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="brand" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g. Huawei" {...field} data-testid="input-brand" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="model" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl><Input placeholder="e.g. HG8546M" {...field} data-testid="input-model" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="defaultUnit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Unit</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-unit"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {["piece", "meter", "box", "roll", "pair", "set", "kg", "liter"].map(u => <SelectItem key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="defaultPurchaseCost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Purchase Cost</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-purchase-cost" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="defaultSalePrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Sale Price</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-sale-price" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="taxCategory" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Category</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-tax"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Standard (17%)</SelectItem>
                        <SelectItem value="reduced">Reduced (5%)</SelectItem>
                        <SelectItem value="zero">Zero-Rated</SelectItem>
                        <SelectItem value="exempt">Exempt</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="warrantyPeriod" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty Period (Months)</FormLabel>
                    <FormControl><Input type="number" placeholder="12" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)} data-testid="input-warranty" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="reorderLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Level</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-reorder" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="minimumStockLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stock Level</FormLabel>
                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-min-stock" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Product type description..." {...field} data-testid="input-description" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-3 gap-x-6 gap-y-3">
                <FormField control={form.control} name="depreciationApplicable" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-depreciation" /></FormControl>
                    <FormLabel className="cursor-pointer">Depreciation Applicable</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="trackSerialNumber" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-serial" /></FormControl>
                    <FormLabel className="cursor-pointer">Track Serial Number</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="trackMacAddress" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-mac" /></FormControl>
                    <FormLabel className="cursor-pointer">Track MAC Address</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="requireIpAllocation" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-ip" /></FormControl>
                    <FormLabel className="cursor-pointer">Require IP Allocation</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="visibleInPos" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-pos" /></FormControl>
                    <FormLabel className="cursor-pointer">Visible in POS</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="allowDiscount" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-discount" /></FormControl>
                    <FormLabel className="cursor-pointer">Allow Discount</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="allowBulkImport" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-bulk" /></FormControl>
                    <FormLabel className="cursor-pointer">Allow Bulk Import</FormLabel>
                  </FormItem>
                )} />
              </div>

              {isEditing && (
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-product-type">
                  {(createMutation.isPending || updateMutation.isPending) && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? "Update Product Type" : "Create Product Type"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Type Details — {selectedType?.productTypeId}</DialogTitle>
          </DialogHeader>
          {selectedType && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className={natureConfig[selectedType.productNature]?.color || ""}>{natureConfig[selectedType.productNature]?.label || selectedType.productNature}</Badge>
                <Badge variant={selectedType.status === "active" ? "default" : "secondary"}>{selectedType.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div><span className="text-muted-foreground">Name</span><p className="font-medium">{selectedType.name}</p></div>
                  <div><span className="text-muted-foreground">Category</span><p className="font-medium">{selectedType.category}{selectedType.subCategory ? ` > ${selectedType.subCategory}` : ""}</p></div>
                  <div><span className="text-muted-foreground">Brand / Model</span><p className="font-medium">{selectedType.brand || "—"} {selectedType.model || ""}</p></div>
                  <div><span className="text-muted-foreground">SKU Code</span><p className="font-medium font-mono">{selectedType.skuCode}</p></div>
                  <div><span className="text-muted-foreground">Default Unit</span><p className="font-medium capitalize">{selectedType.defaultUnit}</p></div>
                </div>
                <div className="space-y-3">
                  <div><span className="text-muted-foreground">Purchase Cost</span><p className="font-medium">{selectedType.defaultPurchaseCost ? `Rs. ${parseFloat(selectedType.defaultPurchaseCost).toLocaleString()}` : "—"}</p></div>
                  <div><span className="text-muted-foreground">Sale Price</span><p className="font-medium">{selectedType.defaultSalePrice ? `Rs. ${parseFloat(selectedType.defaultSalePrice).toLocaleString()}` : "—"}</p></div>
                  <div><span className="text-muted-foreground">Tax Category</span><p className="font-medium capitalize">{selectedType.taxCategory || "—"}</p></div>
                  <div><span className="text-muted-foreground">Warranty Period</span><p className="font-medium">{selectedType.warrantyPeriod ? `${selectedType.warrantyPeriod} months` : "—"}</p></div>
                  <div><span className="text-muted-foreground">Stock Levels</span><p className="font-medium">Reorder: {selectedType.reorderLevel || 0} | Min: {selectedType.minimumStockLevel || 0}</p></div>
                </div>
              </div>

              {selectedType.description && (
                <div>
                  <span className="text-sm text-muted-foreground">Description</span>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{selectedType.description}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 text-sm">
                {selectedType.trackSerialNumber && <Badge variant="outline"><Hash className="h-3 w-3 mr-1" /> Serial Tracking</Badge>}
                {selectedType.trackMacAddress && <Badge variant="outline"><Wifi className="h-3 w-3 mr-1" /> MAC Tracking</Badge>}
                {selectedType.requireIpAllocation && <Badge variant="outline"><Monitor className="h-3 w-3 mr-1" /> IP Required</Badge>}
                {selectedType.depreciationApplicable && <Badge variant="outline"><TrendingUp className="h-3 w-3 mr-1" /> Depreciation</Badge>}
                {selectedType.visibleInPos && <Badge variant="outline"><ShoppingCart className="h-3 w-3 mr-1" /> POS Visible</Badge>}
                {selectedType.allowDiscount && <Badge variant="outline"><Tag className="h-3 w-3 mr-1" /> Discount</Badge>}
                {selectedType.allowBulkImport && <Badge variant="outline"><Boxes className="h-3 w-3 mr-1" /> Bulk Import</Badge>}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setViewDialogOpen(false); handleOpenEdit(selectedType); }} data-testid="button-edit-from-view">
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="outline" onClick={() => { setViewDialogOpen(false); handleDuplicate(selectedType); }} data-testid="button-duplicate-from-view">
                  <Copy className="h-4 w-4 mr-2" /> Duplicate
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isCategoryEditing ? "Edit Category" : "Create Category"}</DialogTitle>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
              <FormField control={categoryForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl><Input placeholder="e.g. Network Equipment" {...field} data-testid="input-category-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={categoryForm.control} name="parentId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Category (Optional)</FormLabel>
                    <Select value={field.value?.toString() || "none"} onValueChange={v => field.onChange(v === "none" ? null : parseInt(v))}>
                      <FormControl><SelectTrigger data-testid="select-parent"><SelectValue placeholder="None (Top level)" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">None (Top Level)</SelectItem>
                        {categories.filter(c => !c.parentId).map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={categoryForm.control} name="color" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl><Input type="color" {...field} className="h-10 w-full" data-testid="input-category-color" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={categoryForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Category description..." {...field} data-testid="input-category-description" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={categoryForm.control} name="depreciationMethod" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depreciation Method</FormLabel>
                    <Select value={field.value || "none"} onValueChange={v => field.onChange(v === "none" ? "" : v)}>
                      <FormControl><SelectTrigger data-testid="select-depreciation-method"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="straight_line">Straight Line</SelectItem>
                        <SelectItem value="reducing_balance">Reducing Balance</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={categoryForm.control} name="depreciationRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depreciation Rate (%)</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="e.g. 20.00" {...field} data-testid="input-depreciation-rate" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={categoryForm.control} name="customAttributes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Attributes (comma-separated)</FormLabel>
                  <FormControl><Input placeholder="e.g. GPON Type, Supported Speed, WiFi Band" {...field} data-testid="input-custom-attributes" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending} data-testid="button-submit-category">
                  {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  {isCategoryEditing ? "Update Category" : "Create Category"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedType?.name}" ({selectedType?.skuCode})? This cannot be undone. If linked to inventory, consider deactivating instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedType && deleteMutation.mutate(selectedType.id)} className="bg-red-600 hover:bg-red-700" data-testid="button-confirm-delete">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete category "{selectedCategory?.name}"? Categories with linked product types cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedCategory && deleteCategoryMutation.mutate(selectedCategory.id)} className="bg-red-600 hover:bg-red-700" data-testid="button-confirm-delete-category">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}