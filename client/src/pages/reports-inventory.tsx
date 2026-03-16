import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Archive,
  Download,
  Search,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InventoryItem } from "@shared/schema";

interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStock: number;
  inStock: number;
  outOfStock: number;
  byCategory: { name: string; count: number; value: number }[];
  byBrand: { name: string; value: number }[];
}

export default function ReportsInventoryPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: stats, isLoading: statsLoading } = useQuery<InventoryStats>({
    queryKey: ["/api/reports/inventory-stats"],
  });

  const { data: items, isLoading: itemsLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const isLoading = statsLoading || itemsLoading;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  const categories = stats?.byCategory?.map((c) => c.name) || [];

  const filteredItems = (items || []).filter((item) => {
    const matchesSearch =
      !search ||
      (item.itemName || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.sku || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || (item.category || "") === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = (items || []).filter(
    (i) => (i.quantity || 0) <= (i.reorderLevel || 5) && (i.quantity || 0) > 0
  );

  const outOfStockItems = (items || []).filter((i) => (i.quantity || 0) === 0);

  const maxCategoryCount = Math.max(
    ...(stats?.byCategory?.map((c) => c.count) || [1]),
    1
  );
  const maxBrandCount = Math.max(
    ...(stats?.byBrand?.map((b) => b.value) || [1]),
    1
  );

  const handleExportCSV = () => {
    const rows = filteredItems.map((item) => ({
      Name: item.itemName,
      SKU: item.sku || "",
      Category: item.category || "",
      Quantity: item.quantity || 0,
      "Unit Cost": item.unitCost || 0,
      "Reorder Level": item.reorderLevel || 5,
    }));
    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => `"${(r as any)[h]}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpiCards = [
    {
      title: "Total Items",
      value: stats?.totalItems ?? 0,
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Total Stock Value",
      value: formatCurrency(stats?.totalValue ?? 0),
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Low Stock",
      value: stats?.lowStock ?? 0,
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "In Stock",
      value: stats?.inStock ?? 0,
      icon: Archive,
      color: "text-teal-600 dark:text-teal-400",
    },
    {
      title: "Out of Stock",
      value: stats?.outOfStock ?? 0,
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            data-testid="text-inventory-report-title"
          >
            Inventory Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Stock summary, product breakdown, and low stock alerts
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportCSV}
          data-testid="button-export-csv"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((card) => (
          <Card
            key={card.title}
            data-testid={`card-kpi-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {card.title}
              </span>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div
                  className="text-2xl font-bold"
                  data-testid={`text-kpi-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {card.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" data-testid="tabs-inventory-reports">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="low-stock" data-testid="tab-low-stock">
            Low Stock Alerts
          </TabsTrigger>
          <TabsTrigger value="all-items" data-testid="tab-all-items">
            All Items
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-category-breakdown">
              <CardHeader className="pb-3">
                <span className="text-base font-semibold">
                  Stock by Category
                </span>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : !stats?.byCategory?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No category data available
                  </p>
                ) : (
                  <div
                    className="space-y-3"
                    data-testid="chart-category-breakdown"
                  >
                    {stats.byCategory.map((cat) => {
                      const widthPct = (cat.count / maxCategoryCount) * 100;
                      return (
                        <div
                          key={cat.name}
                          className="flex items-center gap-3"
                        >
                          <span
                            className="text-xs text-muted-foreground w-28 shrink-0 truncate text-right"
                            title={cat.name}
                          >
                            {cat.name}
                          </span>
                          <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-sm bg-blue-500 dark:bg-blue-400 transition-all"
                              style={{
                                width: `${Math.max(widthPct, 2)}%`,
                              }}
                              data-testid={`bar-category-${cat.name}`}
                            />
                          </div>
                          <span className="text-xs font-medium w-12 shrink-0">
                            {cat.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-brand-breakdown">
              <CardHeader className="pb-3">
                <span className="text-base font-semibold">Stock by Brand</span>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : !stats?.byBrand?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No brand data available
                  </p>
                ) : (
                  <div
                    className="space-y-3"
                    data-testid="chart-brand-breakdown"
                  >
                    {stats.byBrand.map((brand) => {
                      const widthPct = (brand.value / maxBrandCount) * 100;
                      return (
                        <div
                          key={brand.name}
                          className="flex items-center gap-3"
                        >
                          <span
                            className="text-xs text-muted-foreground w-28 shrink-0 truncate text-right"
                            title={brand.name}
                          >
                            {brand.name}
                          </span>
                          <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-sm bg-purple-500 dark:bg-purple-400 transition-all"
                              style={{
                                width: `${Math.max(widthPct, 2)}%`,
                              }}
                              data-testid={`bar-brand-${brand.name}`}
                            />
                          </div>
                          <span className="text-xs font-medium w-12 shrink-0">
                            {brand.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-category-value">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">
                Category Value Breakdown
              </span>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : !stats?.byCategory?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No data available
                </p>
              ) : (
                <div className="space-y-3" data-testid="chart-category-value">
                  {stats.byCategory
                    .sort((a, b) => b.value - a.value)
                    .map((cat) => {
                      const maxVal = Math.max(
                        ...stats.byCategory.map((c) => c.value),
                        1
                      );
                      const widthPct = (cat.value / maxVal) * 100;
                      return (
                        <div
                          key={cat.name}
                          className="flex items-center gap-3"
                        >
                          <span
                            className="text-xs text-muted-foreground w-28 shrink-0 truncate text-right"
                            title={cat.name}
                          >
                            {cat.name}
                          </span>
                          <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-sm bg-green-500 dark:bg-green-400 transition-all"
                              style={{
                                width: `${Math.max(widthPct, 2)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium w-20 shrink-0">
                            {formatCurrency(cat.value)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4 mt-4">
          <Card data-testid="card-low-stock-alerts">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Low Stock Items</span>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : lowStockItems.length === 0 && outOfStockItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No low stock alerts
                </p>
              ) : (
                <Table data-testid="table-low-stock">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">
                        Reorder Level
                      </TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outOfStockItems.map((item) => (
                      <TableRow
                        key={item.id}
                        data-testid={`row-low-stock-${item.id}`}
                      >
                        <TableCell className="font-medium">
                          {item.itemName}
                        </TableCell>
                        <TableCell>{item.sku || "-"}</TableCell>
                        <TableCell>{item.category || "-"}</TableCell>
                        <TableCell className="text-right">
                          {item.quantity || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.reorderLevel || 5}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-xs">
                            Out of Stock
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {lowStockItems.map((item) => (
                      <TableRow
                        key={item.id}
                        data-testid={`row-low-stock-${item.id}`}
                      >
                        <TableCell className="font-medium">
                          {item.itemName}
                        </TableCell>
                        <TableCell>{item.sku || "-"}</TableCell>
                        <TableCell>{item.category || "-"}</TableCell>
                        <TableCell className="text-right">
                          {item.quantity || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.reorderLevel || 5}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-xs text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600"
                          >
                            Low Stock
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-items" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-items"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger
                className="w-[180px]"
                data-testid="select-category-filter"
              >
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card data-testid="card-all-items">
            <CardContent className="pt-4">
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : filteredItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No items found
                </p>
              ) : (
                <Table data-testid="table-all-items">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">
                        Unit Cost
                      </TableHead>
                      <TableHead className="text-right">
                        Total Value
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow
                        key={item.id}
                        data-testid={`row-item-${item.id}`}
                      >
                        <TableCell className="font-medium">
                          {item.itemName}
                        </TableCell>
                        <TableCell>{item.sku || "-"}</TableCell>
                        <TableCell>{item.category || "-"}</TableCell>
                        <TableCell className="text-right">
                          {item.quantity || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            parseFloat(String(item.unitCost || 0))
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            parseFloat(String(item.unitCost || 0)) *
                              (item.quantity || 0)
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
