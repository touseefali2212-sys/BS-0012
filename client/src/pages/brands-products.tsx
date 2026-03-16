import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, CheckCircle, Eye, X,
  Package, Layers, Activity, RefreshCw, Ban, BarChart3, TrendingUp,
  AlertCircle, ChevronRight, FileText, Shield, Download, DollarSign,
  Building2, AlertTriangle, XCircle, Clock, Star, Award, Hash,
  ShoppingBag, Tag, Barcode, Box, Warehouse, Truck, Copy,
  Globe, CircleDot, Boxes, ScanLine, Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Brand, Product, ProductType, Supplier } from "@shared/schema";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const productStatusConfig: Record<string, { color: string; icon: any; label: string }> = {
  in_stock: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle, label: "In Stock" },
  low_stock: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertTriangle, label: "Low Stock" },
  available_for_sale: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: ShoppingBag, label: "Available" },
  rental: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: Box, label: "Rental" },
  out_of_stock: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle, label: "Out of Stock" },
  discontinued: { color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", icon: Ban, label: "Discontinued" },
};

const brandStatusConfig: Record<string, { color: string; label: string }> = {
  active: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Active" },
  inactive: { color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", label: "Inactive" },
};

const CHART_COLORS = ["#059669", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316", "#64748b"];

const tabs = [
  { id: "overview", label: "Product Catalog Overview", icon: BarChart3 },
  { id: "brands", label: "Brand Management", icon: Award },
  { id: "products", label: "Products Master", icon: Package },
  { id: "profile", label: "Product Profile", icon: Eye },
];

const brandFormSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  countryOfOrigin: z.string().optional(),
  officialDistributor: z.string().optional(),
  warrantyPolicy: z.string().optional(),
  notes: z.string().optional(),
  isPreferred: z.boolean().default(false),
  highReliability: z.boolean().default(false),
  warrantySupport: z.boolean().default(false),
});

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  productTypeId: z.number().optional().nullable(),
  brandId: z.number().optional().nullable(),
  model: z.string().optional(),
  skuCode: z.string().min(1, "SKU code is required"),
  barcode: z.string().optional(),
  unitOfMeasure: z.string().default("piece"),
  purchaseCost: z.string().optional(),
  salePrice: z.string().optional(),
  taxCategory: z.string().optional(),
  warrantyPeriod: z.number().optional().nullable(),
  depreciationApplicable: z.boolean().default(false),
  trackSerialNumber: z.boolean().default(false),
  trackMacAddress: z.boolean().default(false),
  allowRental: z.boolean().default(false),
  allowDiscount: z.boolean().default(true),
  minimumStockLevel: z.number().default(0),
  reorderLevel: z.number().default(10),
  description: z.string().optional(),
  visibleInPos: z.boolean().default(true),
  visibleInAssets: z.boolean().default(false),
  currentStock: z.number().default(0),
  reservedStock: z.number().default(0),
  category: z.string().optional(),
  supplierId: z.number().optional().nullable(),
  status: z.string().default("in_stock"),
});

type BrandFormValues = z.infer<typeof brandFormSchema>;
type ProductFormValues = z.infer<typeof productFormSchema>;

export default function BrandsProductsPage() {
  const [activeTab, setActiveTab] = useTab("overview");
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [viewProductOpen, setViewProductOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBrandDialogOpen, setDeleteBrandDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterStockLevel, setFilterStockLevel] = useState<string>("all");
  const [filterSerial, setFilterSerial] = useState<string>("all");
  const [filterRental, setFilterRental] = useState<string>("all");

  const { data: brandsList = [], isLoading: brandsLoading } = useQuery<Brand[]>({ queryKey: ["/api/brands"] });
  const { data: productsList = [], isLoading: productsLoading } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: productTypes = [] } = useQuery<ProductType[]>({ queryKey: ["/api/product-types"] });
  const { data: suppliersList = [] } = useQuery<Supplier[]>({ queryKey: ["/api/suppliers"] });

  const isLoading = brandsLoading || productsLoading;

  const brandForm = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: { name: "", countryOfOrigin: "", officialDistributor: "", warrantyPolicy: "", notes: "", isPreferred: false, highReliability: false, warrantySupport: false },
  });

  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "", productTypeId: null, brandId: null, model: "", skuCode: "", barcode: "",
      unitOfMeasure: "piece", purchaseCost: "", salePrice: "", taxCategory: "",
      warrantyPeriod: null, depreciationApplicable: false, trackSerialNumber: false,
      trackMacAddress: false, allowRental: false, allowDiscount: true,
      minimumStockLevel: 0, reorderLevel: 10, description: "",
      visibleInPos: true, visibleInAssets: false, currentStock: 0, reservedStock: 0,
      category: "", supplierId: null, status: "in_stock",
    },
  });

  const createBrandMutation = useMutation({
    mutationFn: async (data: BrandFormValues) => apiRequest("POST", "/api/brands", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/brands"] }); setBrandDialogOpen(false); brandForm.reset(); toast({ title: "Brand created" }); },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const updateBrandMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BrandFormValues & { status: string }> }) => apiRequest("PATCH", `/api/brands/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/brands"] }); setBrandDialogOpen(false); toast({ title: "Brand updated" }); },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const deleteBrandMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/brands/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/brands"] }); setDeleteBrandDialogOpen(false); setSelectedBrand(null); toast({ title: "Brand deleted" }); },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => apiRequest("POST", "/api/products", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); setProductDialogOpen(false); productForm.reset(); toast({ title: "Product created" }); },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProductFormValues> }) => apiRequest("PATCH", `/api/products/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); setProductDialogOpen(false); setViewProductOpen(false); toast({ title: "Product updated" }); },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); setDeleteDialogOpen(false); setSelectedProduct(null); toast({ title: "Product deleted" }); },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const stats = useMemo(() => {
    const total = productsList.length;
    const active = productsList.filter(p => p.status !== "discontinued").length;
    const assetType = productsList.filter(p => p.visibleInAssets).length;
    const saleable = productsList.filter(p => p.visibleInPos).length;
    const rental = productsList.filter(p => p.allowRental).length;
    const lowStock = productsList.filter(p => p.currentStock > 0 && p.currentStock <= (p.reorderLevel || 10)).length;
    const outOfStock = productsList.filter(p => p.currentStock === 0 && p.status !== "discontinued").length;
    const totalValue = productsList.reduce((s, p) => s + (p.currentStock * parseFloat(p.purchaseCost || "0")), 0);
    return { total, active, assetType, saleable, rental, lowStock, outOfStock, totalValue };
  }, [productsList]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    productsList.forEach(p => { if (p.category) cats.add(p.category); });
    return [...cats];
  }, [productsList]);

  const getBrandName = (brandId: number | null) => {
    if (!brandId) return "—";
    return brandsList.find(b => b.id === brandId)?.name || "—";
  };

  const getProductTypeName = (ptId: number | null) => {
    if (!ptId) return "—";
    return productTypes.find(pt => pt.id === ptId)?.name || "—";
  };

  const filteredProducts = useMemo(() => {
    return productsList.filter(p => {
      if (filterBrand !== "all" && p.brandId !== parseInt(filterBrand)) return false;
      if (filterCategory !== "all" && p.category !== filterCategory) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (filterStockLevel === "low" && !(p.currentStock > 0 && p.currentStock <= (p.reorderLevel || 10))) return false;
      if (filterStockLevel === "out" && p.currentStock !== 0) return false;
      if (filterSerial !== "all" && (filterSerial === "yes" ? !p.trackSerialNumber : p.trackSerialNumber)) return false;
      if (filterRental !== "all" && (filterRental === "yes" ? !p.allowRental : p.allowRental)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.name?.toLowerCase().includes(q) || p.skuCode?.toLowerCase().includes(q) || p.productId?.toLowerCase().includes(q) || p.model?.toLowerCase().includes(q) || getBrandName(p.brandId).toLowerCase().includes(q);
      }
      return true;
    });
  }, [productsList, filterBrand, filterCategory, filterStatus, filterStockLevel, filterSerial, filterRental, searchQuery, brandsList]);

  const handleOpenCreateBrand = () => {
    setIsEditingBrand(false);
    brandForm.reset({ name: "", countryOfOrigin: "", officialDistributor: "", warrantyPolicy: "", notes: "", isPreferred: false, highReliability: false, warrantySupport: false });
    setBrandDialogOpen(true);
  };

  const handleOpenEditBrand = (brand: Brand) => {
    setIsEditingBrand(true);
    setSelectedBrand(brand);
    brandForm.reset({ name: brand.name, countryOfOrigin: brand.countryOfOrigin || "", officialDistributor: brand.officialDistributor || "", warrantyPolicy: brand.warrantyPolicy || "", notes: brand.notes || "", isPreferred: brand.isPreferred, highReliability: brand.highReliability, warrantySupport: brand.warrantySupport });
    setBrandDialogOpen(true);
  };

  const handleBrandSubmit = (values: BrandFormValues) => {
    if (isEditingBrand && selectedBrand) { updateBrandMutation.mutate({ id: selectedBrand.id, data: values }); }
    else { createBrandMutation.mutate(values); }
  };

  const handleOpenCreateProduct = () => {
    setIsEditingProduct(false);
    productForm.reset({
      name: "", productTypeId: null, brandId: null, model: "", skuCode: "", barcode: "",
      unitOfMeasure: "piece", purchaseCost: "", salePrice: "", taxCategory: "",
      warrantyPeriod: null, depreciationApplicable: false, trackSerialNumber: false,
      trackMacAddress: false, allowRental: false, allowDiscount: true,
      minimumStockLevel: 0, reorderLevel: 10, description: "",
      visibleInPos: true, visibleInAssets: false, currentStock: 0, reservedStock: 0,
      category: "", supplierId: null, status: "in_stock",
    });
    setProductDialogOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setIsEditingProduct(true);
    setSelectedProduct(product);
    productForm.reset({
      name: product.name, productTypeId: product.productTypeId, brandId: product.brandId,
      model: product.model || "", skuCode: product.skuCode, barcode: product.barcode || "",
      unitOfMeasure: product.unitOfMeasure || "piece", purchaseCost: product.purchaseCost || "",
      salePrice: product.salePrice || "", taxCategory: product.taxCategory || "",
      warrantyPeriod: product.warrantyPeriod, depreciationApplicable: product.depreciationApplicable,
      trackSerialNumber: product.trackSerialNumber, trackMacAddress: product.trackMacAddress,
      allowRental: product.allowRental, allowDiscount: product.allowDiscount,
      minimumStockLevel: product.minimumStockLevel || 0, reorderLevel: product.reorderLevel || 10,
      description: product.description || "", visibleInPos: product.visibleInPos,
      visibleInAssets: product.visibleInAssets, currentStock: product.currentStock,
      reservedStock: product.reservedStock, category: product.category || "",
      supplierId: product.supplierId, status: product.status,
    });
    setProductDialogOpen(true);
  };

  const handleProductSubmit = (values: ProductFormValues) => {
    if (isEditingProduct && selectedProduct) { updateProductMutation.mutate({ id: selectedProduct.id, data: values }); }
    else { createProductMutation.mutate(values); }
  };

  const handleDuplicate = (product: Product) => {
    setIsEditingProduct(false);
    productForm.reset({
      name: product.name + " (Copy)", productTypeId: product.productTypeId, brandId: product.brandId,
      model: product.model || "", skuCode: product.skuCode + "-" + Date.now().toString(36).toUpperCase(), barcode: "",
      unitOfMeasure: product.unitOfMeasure || "piece", purchaseCost: product.purchaseCost || "",
      salePrice: product.salePrice || "", taxCategory: product.taxCategory || "",
      warrantyPeriod: product.warrantyPeriod, depreciationApplicable: product.depreciationApplicable,
      trackSerialNumber: product.trackSerialNumber, trackMacAddress: product.trackMacAddress,
      allowRental: product.allowRental, allowDiscount: product.allowDiscount,
      minimumStockLevel: product.minimumStockLevel || 0, reorderLevel: product.reorderLevel || 10,
      description: product.description || "", visibleInPos: product.visibleInPos,
      visibleInAssets: product.visibleInAssets, currentStock: 0, reservedStock: 0,
      category: product.category || "", supplierId: product.supplierId, status: "in_stock",
    });
    setProductDialogOpen(true);
  };

  const exportCSV = () => {
    const headers = ["Product ID", "Name", "Brand", "Model", "Category", "SKU", "Purchase Cost", "Sale Price", "Stock", "Reserved", "Available", "Warranty", "Status"];
    const rows = filteredProducts.map(p => [
      p.productId, p.name, getBrandName(p.brandId), p.model || "", p.category || "", p.skuCode,
      p.purchaseCost || "0", p.salePrice || "0", p.currentStock, p.reservedStock,
      p.currentStock - p.reservedStock, p.warrantyPeriod || "", p.status,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "products.csv"; link.click();
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

  const productsByBrand = brandsList.map(b => ({
    name: b.name.length > 15 ? b.name.substring(0, 15) + "..." : b.name,
    value: productsList.filter(p => p.brandId === b.id).length,
  })).filter(d => d.value > 0);

  const productsByCategory = uniqueCategories.map(c => ({
    name: c, value: productsList.filter(p => p.category === c).length,
  }));

  const stockRiskData = [
    { name: "Healthy", value: productsList.filter(p => p.currentStock > (p.reorderLevel || 10)).length, color: "#059669" },
    { name: "Low Stock", value: stats.lowStock, color: "#f59e0b" },
    { name: "Out of Stock", value: stats.outOfStock, color: "#ef4444" },
    { name: "Discontinued", value: productsList.filter(p => p.status === "discontinued").length, color: "#6b7280" },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Brands & Products</h1>
          <p className="text-muted-foreground mt-1">Product catalog management, brand registry, pricing, and stock visibility</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button variant="outline" onClick={handleOpenCreateBrand} data-testid="button-create-brand">
            <Award className="h-4 w-4 mr-2" /> Add Brand
          </Button>
          <Button onClick={handleOpenCreateProduct} data-testid="button-create-product">
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Products", value: stats.total, icon: Package, gradient: "from-gray-800 to-emerald-600" },
          { title: "Active Products", value: stats.active, icon: CheckCircle, gradient: "from-emerald-600 to-emerald-400", sub: `${brandsList.length} brands` },
          { title: "Asset-Type Products", value: stats.assetType, icon: Monitor, gradient: "from-blue-600 to-blue-400", sub: "Serial tracked" },
          { title: "Saleable Products", value: stats.saleable, icon: ShoppingBag, gradient: "from-purple-600 to-purple-400", sub: "POS visible" },
          { title: "Rental Products", value: stats.rental, icon: Box, gradient: "from-teal-600 to-teal-400", sub: "Available for rent" },
          { title: "Low Stock Items", value: stats.lowStock, icon: AlertTriangle, gradient: "from-amber-600 to-amber-400", sub: "Below reorder level" },
          { title: "Out of Stock", value: stats.outOfStock, icon: XCircle, gradient: "from-rose-600 to-rose-400", sub: "Needs restocking" },
          { title: "Inventory Value", value: `Rs. ${(stats.totalValue / 1000).toFixed(0)}k`, icon: DollarSign, gradient: "from-gray-600 to-gray-400", sub: "At purchase cost" },
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
              {card.sub && <p className="text-xs text-white/60 mt-2">{card.sub}</p>}
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
              activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
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
              <CardHeader><CardTitle className="text-lg">Products by Brand</CardTitle></CardHeader>
              <CardContent>
                {productsByBrand.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={productsByBrand} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {productsByBrand.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center"><Award className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No brand data yet</p></div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Stock Risk Overview</CardTitle></CardHeader>
              <CardContent>
                {stockRiskData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={stockRiskData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {stockRiskData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center"><BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No stock data</p></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-lg">Products by Category</CardTitle></CardHeader>
            <CardContent>
              {productsByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={productsByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#059669" name="Products" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground"><p>No categories yet</p></div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">Recent Products</CardTitle></CardHeader>
            <CardContent>
              {productsList.length > 0 ? (
                <div className="space-y-3">
                  {productsList.slice(0, 5).map(p => {
                    const sc = productStatusConfig[p.status] || productStatusConfig.in_stock;
                    const StatusIcon = sc.icon;
                    return (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedProduct(p); setActiveTab("profile"); }} data-testid={`row-recent-${p.id}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${sc.color}`}><StatusIcon className="h-4 w-4" /></div>
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-sm text-muted-foreground">{getBrandName(p.brandId)} | SKU: <span className="font-mono">{p.skuCode}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">Stock: {p.currentStock}</span>
                          <Badge className={sc.color}>{sc.label}</Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No products added yet</p>
                  <Button className="mt-4" onClick={handleOpenCreateProduct} data-testid="button-create-first-product"><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "brands" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search brands..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search-brands" />
            </div>
            <Button onClick={handleOpenCreateBrand} data-testid="button-add-brand-tab">
              <Plus className="h-4 w-4 mr-2" /> Add Brand
            </Button>
          </div>

          {brandsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brandsList
                .filter(b => !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase()) || (b.countryOfOrigin || "").toLowerCase().includes(searchQuery.toLowerCase()))
                .map(brand => {
                  const brandProducts = productsList.filter(p => p.brandId === brand.id);
                  const totalPurchaseValue = brandProducts.reduce((s, p) => s + (p.currentStock * parseFloat(p.purchaseCost || "0")), 0);
                  const totalSaleValue = brandProducts.reduce((s, p) => s + (p.currentStock * parseFloat(p.salePrice || "0")), 0);
                  const avgWarranty = brandProducts.length > 0 ? (brandProducts.reduce((s, p) => s + (p.warrantyPeriod || 0), 0) / brandProducts.length).toFixed(0) : "0";
                  const bs = brandStatusConfig[brand.status] || brandStatusConfig.active;
                  return (
                    <Card key={brand.id} className="hover:shadow-lg transition-shadow" data-testid={`card-brand-${brand.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{brand.name}</CardTitle>
                            {brand.isPreferred && <Badge variant="outline" className="text-blue-600 border-blue-300"><Star className="h-3 w-3 mr-1" />Preferred</Badge>}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-brand-actions-${brand.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEditBrand(brand)} data-testid={`action-edit-brand-${brand.id}`}><Edit className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateBrandMutation.mutate({ id: brand.id, data: { status: brand.status === "active" ? "inactive" : "active" } })} data-testid={`action-toggle-brand-${brand.id}`}>
                                {brand.status === "active" ? <><Ban className="h-4 w-4 mr-2" /> Deactivate</> : <><CheckCircle className="h-4 w-4 mr-2" /> Activate</>}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setSelectedBrand(brand); setDeleteBrandDialogOpen(true); }} className="text-red-600" data-testid={`action-delete-brand-${brand.id}`}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {brand.countryOfOrigin && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{brand.countryOfOrigin}</span>}
                          <Badge className={bs.color}>{bs.label}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="p-2 rounded-lg bg-muted/50 text-center">
                            <p className="text-lg font-bold">{brandProducts.length}</p>
                            <p className="text-xs text-muted-foreground">Products</p>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/50 text-center">
                            <p className="text-lg font-bold">Rs. {(totalPurchaseValue / 1000).toFixed(0)}k</p>
                            <p className="text-xs text-muted-foreground">Purchase Value</p>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/50 text-center">
                            <p className="text-lg font-bold">Rs. {(totalSaleValue / 1000).toFixed(0)}k</p>
                            <p className="text-xs text-muted-foreground">Sale Value</p>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/50 text-center">
                            <p className="text-lg font-bold">{avgWarranty} mo</p>
                            <p className="text-xs text-muted-foreground">Avg Warranty</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {brand.highReliability && <Badge variant="outline" className="text-xs"><Shield className="h-3 w-3 mr-1" />High Reliability</Badge>}
                          {brand.warrantySupport && <Badge variant="outline" className="text-xs"><FileText className="h-3 w-3 mr-1" />Warranty Support</Badge>}
                        </div>
                        {brand.officialDistributor && <p className="text-xs text-muted-foreground mt-2">Distributor: {brand.officialDistributor}</p>}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No brands registered yet</p>
                <Button className="mt-4" onClick={handleOpenCreateBrand} data-testid="button-create-first-brand"><Plus className="h-4 w-4 mr-2" /> Add Brand</Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, SKU, model, brand..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search-products" />
            </div>
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger className="w-[150px]" data-testid="select-filter-brand"><SelectValue placeholder="Brand" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brandsList.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px]" data-testid="select-filter-category"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]" data-testid="select-filter-status"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(productStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStockLevel} onValueChange={setFilterStockLevel}>
              <SelectTrigger className="w-[140px]" data-testid="select-filter-stock"><SelectValue placeholder="Stock" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSerial} onValueChange={setFilterSerial}>
              <SelectTrigger className="w-[140px]" data-testid="select-filter-serial"><SelectValue placeholder="Serial" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Serial Tracked</SelectItem>
                <SelectItem value="no">No Serial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 to-emerald-700 text-white">
                    <th className="px-4 py-3 text-left font-medium">Product ID</th>
                    <th className="px-4 py-3 text-left font-medium">Product Name</th>
                    <th className="px-4 py-3 text-left font-medium">Brand</th>
                    <th className="px-4 py-3 text-left font-medium">Model</th>
                    <th className="px-4 py-3 text-left font-medium">Category</th>
                    <th className="px-4 py-3 text-left font-medium">SKU</th>
                    <th className="px-4 py-3 text-left font-medium">Purchase Cost</th>
                    <th className="px-4 py-3 text-left font-medium">Sale Price</th>
                    <th className="px-4 py-3 text-left font-medium">Stock</th>
                    <th className="px-4 py-3 text-left font-medium">Reserved</th>
                    <th className="px-4 py-3 text-left font-medium">Available</th>
                    <th className="px-4 py-3 text-left font-medium">Warranty</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.length > 0 ? filteredProducts.map(p => {
                    const sc = productStatusConfig[p.status] || productStatusConfig.in_stock;
                    const available = p.currentStock - p.reservedStock;
                    return (
                      <tr key={p.id} className="hover:bg-muted/50 transition-colors" data-testid={`row-product-${p.id}`}>
                        <td className="px-4 py-3 font-mono text-xs">{p.productId}</td>
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3">{getBrandName(p.brandId)}</td>
                        <td className="px-4 py-3">{p.model || "—"}</td>
                        <td className="px-4 py-3">{p.category || "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs">{p.skuCode}</td>
                        <td className="px-4 py-3">Rs. {parseFloat(p.purchaseCost || "0").toLocaleString()}</td>
                        <td className="px-4 py-3">Rs. {parseFloat(p.salePrice || "0").toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={p.currentStock <= (p.reorderLevel || 10) && p.currentStock > 0 ? "text-amber-600 font-medium" : p.currentStock === 0 ? "text-red-600 font-medium" : ""}>{p.currentStock}</span>
                        </td>
                        <td className="px-4 py-3">{p.reservedStock}</td>
                        <td className="px-4 py-3 font-medium">{available}</td>
                        <td className="px-4 py-3">{p.warrantyPeriod ? `${p.warrantyPeriod} mo` : "—"}</td>
                        <td className="px-4 py-3"><Badge className={sc.color}>{sc.label}</Badge></td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-product-actions-${p.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedProduct(p); setActiveTab("profile"); }} data-testid={`action-view-${p.id}`}><Eye className="h-4 w-4 mr-2" /> View Profile</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEditProduct(p)} data-testid={`action-edit-${p.id}`}><Edit className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(p)} data-testid={`action-duplicate-${p.id}`}><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {p.status !== "discontinued" && (
                                <DropdownMenuItem onClick={() => updateProductMutation.mutate({ id: p.id, data: { status: "discontinued" } })} data-testid={`action-discontinue-${p.id}`}><Ban className="h-4 w-4 mr-2" /> Discontinue</DropdownMenuItem>
                              )}
                              {p.status === "discontinued" && (
                                <DropdownMenuItem onClick={() => updateProductMutation.mutate({ id: p.id, data: { status: "in_stock" } })} data-testid={`action-reactivate-${p.id}`}><CheckCircle className="h-4 w-4 mr-2" /> Reactivate</DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setSelectedProduct(p); setDeleteDialogOpen(true); }} className="text-red-600" data-testid={`action-delete-${p.id}`}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={14} className="px-4 py-12 text-center text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No products found</p>
                        <p className="text-sm mt-1">Try adjusting your filters or add a new product</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="space-y-6">
          {selectedProduct ? (() => {
            const p = selectedProduct;
            const sc = productStatusConfig[p.status] || productStatusConfig.in_stock;
            const available = p.currentStock - p.reservedStock;
            const purchaseCost = parseFloat(p.purchaseCost || "0");
            const salePrice = parseFloat(p.salePrice || "0");
            const margin = salePrice > 0 ? ((salePrice - purchaseCost) / salePrice * 100).toFixed(1) : "0";
            const totalPurchaseVal = p.currentStock * purchaseCost;
            const totalSaleVal = p.currentStock * salePrice;
            return (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => setSelectedProduct(null)} data-testid="button-back-products">
                      <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Back
                    </Button>
                    <h2 className="text-xl font-bold">{p.name}</h2>
                    <Badge className={sc.color}>{sc.label}</Badge>
                  </div>
                  <Button variant="outline" onClick={() => handleOpenEditProduct(p)} data-testid="button-edit-profile"><Edit className="h-4 w-4 mr-2" /> Edit</Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader><CardTitle className="text-lg">Stock Data</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <p className="text-2xl font-bold">{p.currentStock}</p>
                          <p className="text-sm text-muted-foreground">Total Stock</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <p className="text-2xl font-bold">{p.reservedStock}</p>
                          <p className="text-sm text-muted-foreground">Reserved</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <p className={`text-2xl font-bold ${available <= 0 ? "text-red-600" : ""}`}>{available}</p>
                          <p className="text-sm text-muted-foreground">Available</p>
                        </div>
                      </div>
                      {p.currentStock <= (p.reorderLevel || 10) && p.status !== "discontinued" && (
                        <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <span className="text-sm text-amber-700 dark:text-amber-400">Stock below reorder level ({p.reorderLevel}). Consider restocking.</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg">Product Info</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div><span className="text-muted-foreground">Product ID</span><p className="font-mono font-medium">{p.productId}</p></div>
                      <div><span className="text-muted-foreground">SKU Code</span><p className="font-mono font-medium">{p.skuCode}</p></div>
                      <div><span className="text-muted-foreground">Brand</span><p className="font-medium">{getBrandName(p.brandId)}</p></div>
                      <div><span className="text-muted-foreground">Model</span><p className="font-medium">{p.model || "—"}</p></div>
                      <div><span className="text-muted-foreground">Category</span><p className="font-medium">{p.category || "—"}</p></div>
                      {p.barcode && <div><span className="text-muted-foreground">Barcode</span><p className="font-mono">{p.barcode}</p></div>}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Financial Data</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 rounded-lg border">
                          <p className="text-muted-foreground">Purchase Cost</p>
                          <p className="text-lg font-bold">Rs. {purchaseCost.toLocaleString()}</p>
                        </div>
                        <div className="p-3 rounded-lg border">
                          <p className="text-muted-foreground">Sale Price</p>
                          <p className="text-lg font-bold">Rs. {salePrice.toLocaleString()}</p>
                        </div>
                        <div className="p-3 rounded-lg border">
                          <p className="text-muted-foreground">Total Purchase Value</p>
                          <p className="text-lg font-bold">Rs. {totalPurchaseVal.toLocaleString()}</p>
                        </div>
                        <div className="p-3 rounded-lg border">
                          <p className="text-muted-foreground">Total Sale Revenue</p>
                          <p className="text-lg font-bold">Rs. {totalSaleVal.toLocaleString()}</p>
                        </div>
                        <div className="p-3 rounded-lg border col-span-2">
                          <p className="text-muted-foreground">Gross Margin</p>
                          <p className={`text-lg font-bold ${parseFloat(margin) > 0 ? "text-emerald-600" : "text-red-600"}`}>{margin}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg">Operational Data</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <span className="text-muted-foreground">Unit of Measure</span>
                          <span className="font-medium">{p.unitOfMeasure}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <span className="text-muted-foreground">Warranty Period</span>
                          <span className="font-medium">{p.warrantyPeriod ? `${p.warrantyPeriod} months` : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <span className="text-muted-foreground">Reorder Level</span>
                          <span className="font-medium">{p.reorderLevel}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                          <span className="text-muted-foreground">Min Stock Level</span>
                          <span className="font-medium">{p.minimumStockLevel}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {p.trackSerialNumber && <Badge variant="outline"><ScanLine className="h-3 w-3 mr-1" />Serial Tracked</Badge>}
                          {p.trackMacAddress && <Badge variant="outline"><Hash className="h-3 w-3 mr-1" />MAC Tracked</Badge>}
                          {p.depreciationApplicable && <Badge variant="outline"><TrendingUp className="h-3 w-3 mr-1" />Depreciation</Badge>}
                          {p.allowRental && <Badge variant="outline"><Box className="h-3 w-3 mr-1" />Rental</Badge>}
                          {p.allowDiscount && <Badge variant="outline"><Tag className="h-3 w-3 mr-1" />Discount</Badge>}
                          {p.visibleInPos && <Badge variant="outline"><ShoppingBag className="h-3 w-3 mr-1" />POS</Badge>}
                          {p.visibleInAssets && <Badge variant="outline"><Monitor className="h-3 w-3 mr-1" />Assets</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {p.description && (
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Description</CardTitle></CardHeader>
                    <CardContent><p className="text-sm">{p.description}</p></CardContent>
                  </Card>
                )}
              </>
            );
          })() : (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Select a product to view its profile</p>
                <p className="text-sm mt-1">Click "View Profile" from the Products Master tab or pick from recent products</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditingBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
          </DialogHeader>
          <Form {...brandForm}>
            <form onSubmit={brandForm.handleSubmit(handleBrandSubmit)} className="space-y-4">
              <FormField control={brandForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Brand Name</FormLabel><FormControl><Input placeholder="e.g. TP-Link" {...field} data-testid="input-brand-name" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={brandForm.control} name="countryOfOrigin" render={({ field }) => (
                  <FormItem><FormLabel>Country of Origin</FormLabel><FormControl><Input placeholder="e.g. China" {...field} data-testid="input-brand-country" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={brandForm.control} name="officialDistributor" render={({ field }) => (
                  <FormItem><FormLabel>Official Distributor</FormLabel><FormControl><Input placeholder="Distributor name" {...field} data-testid="input-brand-distributor" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={brandForm.control} name="warrantyPolicy" render={({ field }) => (
                <FormItem><FormLabel>Warranty Policy</FormLabel><FormControl><Textarea placeholder="Warranty terms..." {...field} data-testid="input-brand-warranty" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={brandForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Additional notes..." {...field} data-testid="input-brand-notes" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-3 gap-4">
                <FormField control={brandForm.control} name="isPreferred" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-brand-preferred" /></FormControl><FormLabel className="cursor-pointer">Preferred</FormLabel></FormItem>
                )} />
                <FormField control={brandForm.control} name="highReliability" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-brand-reliability" /></FormControl><FormLabel className="cursor-pointer">High Reliability</FormLabel></FormItem>
                )} />
                <FormField control={brandForm.control} name="warrantySupport" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-brand-warranty-support" /></FormControl><FormLabel className="cursor-pointer">Warranty Support</FormLabel></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setBrandDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createBrandMutation.isPending || updateBrandMutation.isPending} data-testid="button-submit-brand">
                  {(createBrandMutation.isPending || updateBrandMutation.isPending) && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditingBrand ? "Update Brand" : "Add Brand"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit(handleProductSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={productForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g. ONU ZTE F670L" {...field} data-testid="input-product-name" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={productForm.control} name="skuCode" render={({ field }) => (
                  <FormItem><FormLabel>SKU Code</FormLabel><FormControl><Input placeholder="e.g. ONU-ZTE-670L" className="font-mono" {...field} data-testid="input-product-sku" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={productForm.control} name="brandId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <Select value={field.value ? String(field.value) : "none"} onValueChange={v => field.onChange(v === "none" ? null : parseInt(v))}>
                      <FormControl><SelectTrigger data-testid="select-product-brand"><SelectValue placeholder="Select brand" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Brand</SelectItem>
                        {brandsList.filter(b => b.status === "active").map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={productForm.control} name="model" render={({ field }) => (
                  <FormItem><FormLabel>Model Number</FormLabel><FormControl><Input placeholder="e.g. F670L" {...field} data-testid="input-product-model" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={productForm.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value || "none"} onValueChange={v => field.onChange(v === "none" ? "" : v)}>
                      <FormControl><SelectTrigger data-testid="select-product-category"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Category</SelectItem>
                        <SelectItem value="Network Equipment">Network Equipment</SelectItem>
                        <SelectItem value="Customer Devices">Customer Devices</SelectItem>
                        <SelectItem value="Fiber Materials">Fiber Materials</SelectItem>
                        <SelectItem value="Tools">Tools</SelectItem>
                        <SelectItem value="Spare Parts">Spare Parts</SelectItem>
                        <SelectItem value="Accessories">Accessories</SelectItem>
                        <SelectItem value="Office Equipment">Office Equipment</SelectItem>
                        <SelectItem value="IT Hardware">IT Hardware</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={productForm.control} name="barcode" render={({ field }) => (
                  <FormItem><FormLabel>Barcode (Optional)</FormLabel><FormControl><Input placeholder="Barcode" className="font-mono" {...field} data-testid="input-product-barcode" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={productForm.control} name="unitOfMeasure" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit of Measure</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-product-unit"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="piece">Piece</SelectItem>
                        <SelectItem value="meter">Meter</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="roll">Roll</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="set">Set</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={productForm.control} name="supplierId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select value={field.value ? String(field.value) : "none"} onValueChange={v => field.onChange(v === "none" ? null : parseInt(v))}>
                      <FormControl><SelectTrigger data-testid="select-product-supplier"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Supplier</SelectItem>
                        {suppliersList.filter(s => s.status === "active").map(s => <SelectItem key={s.id} value={String(s.id)}>{s.companyName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <FormField control={productForm.control} name="purchaseCost" render={({ field }) => (
                  <FormItem><FormLabel>Purchase Cost (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-product-cost" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={productForm.control} name="salePrice" render={({ field }) => (
                  <FormItem><FormLabel>Sale Price (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-product-price" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={productForm.control} name="taxCategory" render={({ field }) => (
                  <FormItem><FormLabel>Tax Category</FormLabel><FormControl><Input placeholder="e.g. GST-17%" {...field} data-testid="input-product-tax" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={productForm.control} name="warrantyPeriod" render={({ field }) => (
                  <FormItem><FormLabel>Warranty (Months)</FormLabel><FormControl><Input type="number" placeholder="e.g. 12" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)} data-testid="input-product-warranty" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <FormField control={productForm.control} name="currentStock" render={({ field }) => (
                  <FormItem><FormLabel>Current Stock</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-product-stock" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={productForm.control} name="reservedStock" render={({ field }) => (
                  <FormItem><FormLabel>Reserved Stock</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-product-reserved" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={productForm.control} name="minimumStockLevel" render={({ field }) => (
                  <FormItem><FormLabel>Min Stock Level</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-product-min-stock" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={productForm.control} name="reorderLevel" render={({ field }) => (
                  <FormItem><FormLabel>Reorder Level</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-product-reorder" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={productForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Product description..." {...field} data-testid="input-product-description" /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-4 gap-4">
                <FormField control={productForm.control} name="trackSerialNumber" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-track-serial" /></FormControl><FormLabel className="cursor-pointer">Track Serial</FormLabel></FormItem>
                )} />
                <FormField control={productForm.control} name="trackMacAddress" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-track-mac" /></FormControl><FormLabel className="cursor-pointer">Track MAC</FormLabel></FormItem>
                )} />
                <FormField control={productForm.control} name="depreciationApplicable" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-depreciation" /></FormControl><FormLabel className="cursor-pointer">Depreciation</FormLabel></FormItem>
                )} />
                <FormField control={productForm.control} name="allowRental" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-rental" /></FormControl><FormLabel className="cursor-pointer">Allow Rental</FormLabel></FormItem>
                )} />
              </div>
              {productForm.watch("visibleInAssets") && !productForm.watch("trackSerialNumber") && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-700 dark:text-amber-400">Asset-visible products require serial tracking to be enabled.</span>
                </div>
              )}

              <div className="grid grid-cols-4 gap-4">
                <FormField control={productForm.control} name="allowDiscount" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-discount" /></FormControl><FormLabel className="cursor-pointer">Allow Discount</FormLabel></FormItem>
                )} />
                <FormField control={productForm.control} name="visibleInPos" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-pos" /></FormControl><FormLabel className="cursor-pointer">Visible in POS</FormLabel></FormItem>
                )} />
                <FormField control={productForm.control} name="visibleInAssets" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-assets" /></FormControl><FormLabel className="cursor-pointer">Visible in Assets</FormLabel></FormItem>
                )} />
              </div>

              {isEditingProduct && (
                <FormField control={productForm.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-product-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(productStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createProductMutation.isPending || updateProductMutation.isPending} data-testid="button-submit-product">
                  {(createProductMutation.isPending || updateProductMutation.isPending) && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditingProduct ? "Update Product" : "Add Product"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedProduct?.name}"? Products with existing stock cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedProduct && deleteProductMutation.mutate(selectedProduct.id)} className="bg-red-600 hover:bg-red-700" data-testid="button-confirm-delete-product">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteBrandDialogOpen} onOpenChange={setDeleteBrandDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBrand?.name}"? Brands with linked products cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedBrand && deleteBrandMutation.mutate(selectedBrand.id)} className="bg-red-600 hover:bg-red-700" data-testid="button-confirm-delete-brand">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}