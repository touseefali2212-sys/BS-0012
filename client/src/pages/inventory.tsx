import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Truck,
  Tag,
} from "lucide-react";
import { useTab } from "@/hooks/use-tab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertInventoryItemSchema, type InventoryItem, type InsertInventoryItem, type Vendor } from "@shared/schema";
import { z } from "zod";

const inventoryFormSchema = insertInventoryItemSchema.extend({
  sku: z.string().min(1, "SKU is required"),
  itemName: z.string().min(2, "Item name is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.coerce.number().int().min(0, "Quantity must be 0 or more"),
});

export default function InventoryPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const { data: items, isLoading } = useQuery<(InventoryItem & { vendorName?: string })[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const form = useForm<InsertInventoryItem>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      sku: "",
      itemName: "",
      category: "fiber_cable",
      quantity: 0,
      unitCost: "",
      reorderLevel: 10,
      vendorId: undefined,
      location: "",
      description: "",
      status: "in_stock",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertInventoryItem) => {
      const res = await apiRequest("POST", "/api/inventory", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Item created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertInventoryItem> }) => {
      const res = await apiRequest("PATCH", `/api/inventory/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDialogOpen(false);
      setEditingItem(null);
      form.reset();
      toast({ title: "Item updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Item deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingItem(null);
    form.reset({
      sku: "",
      itemName: "",
      category: "fiber_cable",
      quantity: 0,
      unitCost: "",
      reorderLevel: 10,
      vendorId: undefined,
      location: "",
      description: "",
      status: "in_stock",
    });
    setDialogOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    form.reset({
      sku: item.sku,
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      unitCost: item.unitCost || "",
      reorderLevel: item.reorderLevel ?? 10,
      vendorId: item.vendorId ?? undefined,
      location: item.location || "",
      description: item.description || "",
      status: item.status,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertInventoryItem) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = (items || []).filter((item) => {
    const matchSearch =
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.itemName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    const matchCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const [activeTab, setActiveTab] = useTab("list");

  const statusConfig: Record<string, { icon: any; color: string }> = {
    in_stock: { icon: CheckCircle, color: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" },
    low_stock: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950" },
    out_of_stock: { icon: XCircle, color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950" },
  };

  const categoryLabels: Record<string, string> = {
    fiber_cable: "Fiber Cable",
    connectors: "Connectors",
    ONT: "ONT",
    router: "Router",
    switch: "Switch",
    tools: "Tools",
    consumables: "Consumables",
    other: "Other",
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (items || []).forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  const categoryTotalQty = useMemo(() => {
    const totals: Record<string, number> = {};
    (items || []).forEach((item) => {
      totals[item.category] = (totals[item.category] || 0) + item.quantity;
    });
    return totals;
  }, [items]);

  const supplierData = useMemo(() => {
    const map = new Map<number, { vendor: Vendor; itemCount: number; totalValue: number }>();
    (items || []).forEach((item) => {
      if (item.vendorId) {
        const existing = map.get(item.vendorId);
        const cost = parseFloat(item.unitCost || "0") * item.quantity;
        if (existing) {
          existing.itemCount += 1;
          existing.totalValue += cost;
        } else {
          const vendor = (vendors || []).find((v) => v.id === item.vendorId);
          if (vendor) {
            map.set(item.vendorId, { vendor, itemCount: 1, totalValue: cost });
          }
        }
      }
    });
    return Array.from(map.values());
  }, [items, vendors]);

  const brandData = useMemo(() => {
    const map = new Map<string, { items: typeof filtered }>();
    (items || []).forEach((item) => {
      const cat = categoryLabels[item.category] || item.category;
      const existing = map.get(cat);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(cat, { items: [item] });
      }
    });
    return Array.from(map.entries());
  }, [items]);

  const stockSummary = useMemo(() => {
    const allItems = items || [];
    const totalItems = allItems.length;
    const totalQty = allItems.reduce((sum, i) => sum + i.quantity, 0);
    const inStock = allItems.filter((i) => i.status === "in_stock").length;
    const lowStock = allItems.filter((i) => i.status === "low_stock" || i.quantity <= (i.reorderLevel ?? 10)).length;
    const outOfStock = allItems.filter((i) => i.status === "out_of_stock").length;
    const totalValue = allItems.reduce((sum, i) => sum + parseFloat(i.unitCost || "0") * i.quantity, 0);
    return { totalItems, totalQty, inStock, lowStock, outOfStock, totalValue };
  }, [items]);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-inventory-title">Inventory Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track stock levels and supplies</p>
        </div>
        {activeTab === "list" && (
          <Button onClick={openCreate} data-testid="button-add-inventory">
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        )}
      </div>

      {activeTab === "types" && (<div className="mt-5" data-testid="content-types">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <Card key={key} data-testid={`card-type-${key}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <span className="text-sm font-medium">{label}</span>
                  <Badge variant="secondary" className="no-default-active-elevate">{categoryCounts[key] || 0} items</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid={`text-type-qty-${key}`}>{categoryTotalQty[key] || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total quantity in stock</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>)}

      {activeTab === "suppliers" && (<div className="mt-5" data-testid="content-suppliers">
          {supplierData.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Truck className="h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium">No suppliers linked</p>
                <p className="text-sm mt-1">Assign vendors to inventory items to see supplier data</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supplierData.map(({ vendor, itemCount, totalValue }) => (
                <Card key={vendor.id} data-testid={`card-supplier-${vendor.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{vendor.name}</span>
                      <Badge variant="secondary" className="no-default-active-elevate">{vendor.serviceType || "supplier"}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items Supplied</span>
                      <span className="font-medium" data-testid={`text-supplier-items-${vendor.id}`}>{itemCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Value</span>
                      <span className="font-medium">Rs. {totalValue.toFixed(2)}</span>
                    </div>
                    {vendor.email && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Email</span>
                        <span className="text-sm truncate max-w-[180px]">{vendor.email}</span>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="text-sm">{vendor.phone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>)}

      {activeTab === "brands" && (<div className="mt-5" data-testid="content-brands">
          <div className="space-y-4">
            {brandData.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Tag className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No products found</p>
                  <p className="text-sm mt-1">Add inventory items to see the product catalog</p>
                </CardContent>
              </Card>
            ) : (
              brandData.map(([category, { items: catItems }]) => (
                <Card key={category} data-testid={`card-brand-${category}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{category}</span>
                      <Badge variant="secondary" className="no-default-active-elevate">{catItems.length} products</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Unit Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {catItems.map((item) => (
                          <TableRow key={item.id} data-testid={`row-brand-item-${item.id}`}>
                            <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                            <TableCell className="font-medium">{item.itemName}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.unitCost ? `Rs. ${item.unitCost}` : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>)}

      {activeTab === "purchase-order" && (<div className="mt-5" data-testid="content-purchase-order">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card data-testid="card-po-pending">
                <CardHeader className="pb-2">
                  <span className="text-sm font-medium text-muted-foreground">Pending Orders</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stockSummary.lowStock}</div>
                  <p className="text-xs text-muted-foreground mt-1">Items below reorder level</p>
                </CardContent>
              </Card>
              <Card data-testid="card-po-suppliers">
                <CardHeader className="pb-2">
                  <span className="text-sm font-medium text-muted-foreground">Active Suppliers</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{supplierData.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Linked to inventory</p>
                </CardContent>
              </Card>
              <Card data-testid="card-po-value">
                <CardHeader className="pb-2">
                  <span className="text-sm font-medium text-muted-foreground">Est. Reorder Value</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Rs. {(items || [])
                      .filter((i) => i.quantity <= (i.reorderLevel ?? 10))
                      .reduce((sum, i) => sum + parseFloat(i.unitCost || "0") * ((i.reorderLevel ?? 10) - i.quantity + 10), 0)
                      .toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">To replenish low stock items</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="pb-2">
                <span className="font-medium">Items Needing Reorder</span>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Current Qty</TableHead>
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>Suggested Order</TableHead>
                      <TableHead>Vendor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(items || [])
                      .filter((i) => i.quantity <= (i.reorderLevel ?? 10))
                      .map((item) => (
                        <TableRow key={item.id} data-testid={`row-po-${item.id}`}>
                          <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="no-default-active-elevate text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950">
                              {item.quantity}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.reorderLevel ?? 10}</TableCell>
                          <TableCell className="font-medium">{(item.reorderLevel ?? 10) - item.quantity + 10}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {(vendors || []).find((v) => v.id === item.vendorId)?.name || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    {(items || []).filter((i) => i.quantity <= (i.reorderLevel ?? 10)).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          All items are above reorder levels
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>)}

      {activeTab === "stock" && (<div className="mt-5" data-testid="content-stock">
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card data-testid="card-stock-total">
                <CardHeader className="pb-1"><span className="text-xs font-medium text-muted-foreground">Total Items</span></CardHeader>
                <CardContent><div className="text-xl font-bold">{stockSummary.totalItems}</div></CardContent>
              </Card>
              <Card data-testid="card-stock-qty">
                <CardHeader className="pb-1"><span className="text-xs font-medium text-muted-foreground">Total Quantity</span></CardHeader>
                <CardContent><div className="text-xl font-bold">{stockSummary.totalQty}</div></CardContent>
              </Card>
              <Card data-testid="card-stock-in">
                <CardHeader className="pb-1"><span className="text-xs font-medium text-muted-foreground">In Stock</span></CardHeader>
                <CardContent><div className="text-xl font-bold text-green-600 dark:text-green-400">{stockSummary.inStock}</div></CardContent>
              </Card>
              <Card data-testid="card-stock-low">
                <CardHeader className="pb-1"><span className="text-xs font-medium text-muted-foreground">Low Stock</span></CardHeader>
                <CardContent><div className="text-xl font-bold text-amber-600 dark:text-amber-400">{stockSummary.lowStock}</div></CardContent>
              </Card>
              <Card data-testid="card-stock-out">
                <CardHeader className="pb-1"><span className="text-xs font-medium text-muted-foreground">Out of Stock</span></CardHeader>
                <CardContent><div className="text-xl font-bold text-red-600 dark:text-red-400">{stockSummary.outOfStock}</div></CardContent>
              </Card>
              <Card data-testid="card-stock-value">
                <CardHeader className="pb-1"><span className="text-xs font-medium text-muted-foreground">Total Value</span></CardHeader>
                <CardContent><div className="text-xl font-bold">Rs. {stockSummary.totalValue.toFixed(0)}</div></CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="pb-2"><span className="font-medium">Stock by Category</span></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(categoryLabels).map(([key, label]) => {
                    const qty = categoryTotalQty[key] || 0;
                    const maxQty = Math.max(...Object.values(categoryTotalQty), 1);
                    return (
                      <div key={key} className="flex items-center gap-3" data-testid={`stock-bar-${key}`}>
                        <span className="text-sm w-28 shrink-0">{label}</span>
                        <div className="flex-1 bg-muted rounded-sm h-6 overflow-hidden">
                          <div
                            className="h-full bg-primary/70 rounded-sm transition-all"
                            style={{ width: `${(qty / maxQty) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-14 text-right">{qty}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>)}

      {activeTab === "purchase" && (<div className="mt-5" data-testid="content-purchase">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card data-testid="card-purchase-total">
                <CardHeader className="pb-2"><span className="text-sm font-medium text-muted-foreground">Total Inventory Value</span></CardHeader>
                <CardContent><div className="text-2xl font-bold">Rs. {stockSummary.totalValue.toFixed(2)}</div></CardContent>
              </Card>
              <Card data-testid="card-purchase-items">
                <CardHeader className="pb-2"><span className="text-sm font-medium text-muted-foreground">Total Items Purchased</span></CardHeader>
                <CardContent><div className="text-2xl font-bold">{stockSummary.totalQty}</div></CardContent>
              </Card>
              <Card data-testid="card-purchase-avg">
                <CardHeader className="pb-2"><span className="text-sm font-medium text-muted-foreground">Avg. Unit Cost</span></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Rs. {stockSummary.totalItems > 0
                      ? ((items || []).reduce((sum, i) => sum + parseFloat(i.unitCost || "0"), 0) / stockSummary.totalItems).toFixed(2)
                      : "0.00"}
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="pb-2"><span className="font-medium">Purchase History</span></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Vendor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(items || []).map((item) => (
                      <TableRow key={item.id} data-testid={`row-purchase-${item.id}`}>
                        <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell><Badge variant="secondary" className="no-default-active-elevate text-[10px]">{categoryLabels[item.category] || item.category}</Badge></TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unitCost ? `Rs. ${item.unitCost}` : "—"}</TableCell>
                        <TableCell className="font-medium">Rs. {(parseFloat(item.unitCost || "0") * item.quantity).toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">{(vendors || []).find((v) => v.id === item.vendorId)?.name || "—"}</TableCell>
                      </TableRow>
                    ))}
                    {(items || []).length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No purchase records</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>)}

      {activeTab === "sales" && (<div className="mt-5" data-testid="content-sales">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card data-testid="card-sales-items">
                <CardHeader className="pb-2"><span className="text-sm font-medium text-muted-foreground">Items Available for Sale</span></CardHeader>
                <CardContent><div className="text-2xl font-bold">{stockSummary.inStock}</div></CardContent>
              </Card>
              <Card data-testid="card-sales-value">
                <CardHeader className="pb-2"><span className="text-sm font-medium text-muted-foreground">Available Stock Value</span></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Rs. {(items || [])
                      .filter((i) => i.status === "in_stock")
                      .reduce((sum, i) => sum + parseFloat(i.unitCost || "0") * i.quantity, 0)
                      .toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-sales-outofstock">
                <CardHeader className="pb-2"><span className="text-sm font-medium text-muted-foreground">Out of Stock Items</span></CardHeader>
                <CardContent><div className="text-2xl font-bold text-red-600 dark:text-red-400">{stockSummary.outOfStock}</div></CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="pb-2"><span className="font-medium">Sales-Ready Inventory</span></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Available Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(items || [])
                      .filter((i) => i.status === "in_stock")
                      .map((item) => (
                        <TableRow key={item.id} data-testid={`row-sales-${item.id}`}>
                          <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell><Badge variant="secondary" className="no-default-active-elevate text-[10px]">{categoryLabels[item.category] || item.category}</Badge></TableCell>
                          <TableCell className="font-medium">{item.quantity}</TableCell>
                          <TableCell>{item.unitCost ? `Rs. ${item.unitCost}` : "—"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950">
                              <CheckCircle className="h-3 w-3 mr-1" />Available
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    {(items || []).filter((i) => i.status === "in_stock").length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No items available for sale</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>)}

      {activeTab === "list" && (<div className="mt-5" data-testid="content-list">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search inventory..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-inventory"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-inventory-category-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="fiber_cable">Fiber Cable</SelectItem>
                    <SelectItem value="connectors">Connectors</SelectItem>
                    <SelectItem value="ONT">ONT</SelectItem>
                    <SelectItem value="router">Router</SelectItem>
                    <SelectItem value="switch">Switch</SelectItem>
                    <SelectItem value="tools">Tools</SelectItem>
                    <SelectItem value="consumables">Consumables</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-inventory-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No inventory items found</p>
                  <p className="text-sm mt-1">Add your first inventory item</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="hidden md:table-cell">Unit Cost</TableHead>
                        <TableHead className="hidden lg:table-cell">Vendor</TableHead>
                        <TableHead className="hidden lg:table-cell">Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item) => {
                        const config = statusConfig[item.status] || statusConfig.in_stock;
                        const StatusIcon = config.icon;
                        const isLowStock = item.quantity <= (item.reorderLevel ?? 10);
                        return (
                          <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                            <TableCell className="font-mono text-xs" data-testid={`text-inventory-sku-${item.id}`}>
                              {item.sku}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium max-w-[200px] truncate">{item.itemName}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="no-default-active-elevate text-[10px] capitalize">
                                {categoryLabels[item.category] || item.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium" data-testid={`text-inventory-qty-${item.id}`}>{item.quantity}</span>
                                {isLowStock && (
                                  <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950" data-testid={`badge-low-stock-${item.id}`}>
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Low
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                              {item.unitCost ? `Rs. ${item.unitCost}` : "—"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                              {item.vendorName || (item.vendorId ? `#${item.vendorId}` : "—")}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                              {item.location || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${config.color}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {item.status.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" data-testid={`button-inventory-actions-${item.id}`}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEdit(item)} data-testid={`button-edit-inventory-${item.id}`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => deleteMutation.mutate(item.id)}
                                    data-testid={`button-delete-inventory-${item.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
        </div>)}

      {activeTab === "batch" && (<div className="mt-5" data-testid="content-batch">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card data-testid="card-batch-total">
                <CardHeader className="pb-2"><span className="text-sm font-medium text-muted-foreground">Total SKUs</span></CardHeader>
                <CardContent><div className="text-2xl font-bold">{stockSummary.totalItems}</div></CardContent>
              </Card>
              <Card data-testid="card-batch-unique">
                <CardHeader className="pb-2"><span className="text-sm font-medium text-muted-foreground">Unique Categories</span></CardHeader>
                <CardContent><div className="text-2xl font-bold">{Object.keys(categoryCounts).length}</div></CardContent>
              </Card>
              <Card data-testid="card-batch-tracked">
                <CardHeader className="pb-2"><span className="text-sm font-medium text-muted-foreground">Tracked Items</span></CardHeader>
                <CardContent><div className="text-2xl font-bold">{stockSummary.totalQty}</div></CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="pb-2"><span className="font-medium">Batch & Serial Tracking</span></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial / SKU</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Batch Qty</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(items || []).map((item) => {
                      const config = statusConfig[item.status] || statusConfig.in_stock;
                      const StatusIcon = config.icon;
                      return (
                        <TableRow key={item.id} data-testid={`row-batch-${item.id}`}>
                          <TableCell className="font-mono text-xs font-medium">{item.sku}</TableCell>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell><Badge variant="secondary" className="no-default-active-elevate text-[10px]">{categoryLabels[item.category] || item.category}</Badge></TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-muted-foreground">{item.location || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${config.color}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />{item.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(items || []).length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No batch records found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>)}

      {activeTab === "warranty" && (<div className="mt-5" data-testid="content-warranty">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card data-testid="card-warranty-active">
                <CardHeader className="pb-2"><span className="text-sm font-medium text-muted-foreground">Active Items</span></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stockSummary.inStock}</div>
                  <p className="text-xs text-muted-foreground mt-1">Items within warranty period</p>
                </CardContent>
              </Card>
              <Card data-testid="card-warranty-expiring">
                <CardHeader className="pb-2"><span className="text-sm font-medium text-muted-foreground">Expiring Soon</span></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stockSummary.lowStock}</div>
                  <p className="text-xs text-muted-foreground mt-1">Items with low stock or nearing expiry</p>
                </CardContent>
              </Card>
              <Card data-testid="card-warranty-expired">
                <CardHeader className="pb-2"><span className="text-sm font-medium text-muted-foreground">Expired / Out of Stock</span></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stockSummary.outOfStock}</div>
                  <p className="text-xs text-muted-foreground mt-1">Items out of stock or warranty expired</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="pb-2"><span className="font-medium">Warranty & Expiry Tracking</span></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Warranty Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(items || []).map((item) => {
                      let warrantyStatus = "Active";
                      let warrantyColor = "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950";
                      let WarrantyIcon = CheckCircle;
                      if (item.status === "out_of_stock") {
                        warrantyStatus = "Expired";
                        warrantyColor = "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950";
                        WarrantyIcon = XCircle;
                      } else if (item.quantity <= (item.reorderLevel ?? 10)) {
                        warrantyStatus = "Expiring Soon";
                        warrantyColor = "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950";
                        WarrantyIcon = AlertTriangle;
                      }
                      return (
                        <TableRow key={item.id} data-testid={`row-warranty-${item.id}`}>
                          <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell><Badge variant="secondary" className="no-default-active-elevate text-[10px]">{categoryLabels[item.category] || item.category}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{(vendors || []).find((v) => v.id === item.vendorId)?.name || "—"}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${warrantyColor}`}>
                              <WarrantyIcon className="h-3 w-3 mr-1" />{warrantyStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(items || []).length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No warranty records found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>)}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Item"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU-001" data-testid="input-inventory-sku" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="itemName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Item name" data-testid="input-inventory-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "fiber_cable"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-inventory-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fiber_cable">Fiber Cable</SelectItem>
                          <SelectItem value="connectors">Connectors</SelectItem>
                          <SelectItem value="ONT">ONT</SelectItem>
                          <SelectItem value="router">Router</SelectItem>
                          <SelectItem value="switch">Switch</SelectItem>
                          <SelectItem value="tools">Tools</SelectItem>
                          <SelectItem value="consumables">Consumables</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "in_stock"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-inventory-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="in_stock">In Stock</SelectItem>
                          <SelectItem value="low_stock">Low Stock</SelectItem>
                          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" data-testid="input-inventory-quantity" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost (Rs.)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" data-testid="input-inventory-cost" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reorderLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Level</FormLabel>
                      <FormControl>
                        <Input type="number" data-testid="input-inventory-reorder" {...field} value={field.value ?? 10} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "none" ? undefined : parseInt(v))}
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-inventory-vendor">
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No vendor</SelectItem>
                        {(vendors || []).map((v) => (
                          <SelectItem key={v.id} value={v.id.toString()}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Storage location" data-testid="input-inventory-location" {...field} value={field.value || ""} />
                    </FormControl>
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
                      <Textarea placeholder="Item description..." data-testid="input-inventory-description" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-inventory">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingItem ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
