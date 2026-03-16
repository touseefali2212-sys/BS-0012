import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  BarChart3,
  PieChart,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Invoice, Customer, Package } from "@shared/schema";

export default function RevenueAnalyticsPage() {
  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: packages } = useQuery<Package[]>({
    queryKey: ["/api/packages"],
  });

  const isLoading = invoicesLoading || customersLoading;

  const analytics = useMemo(() => {
    const allInvoices = invoices || [];
    const allCustomers = customers || [];
    const allPackages = packages || [];

    const totalRevenue = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);
    const totalCollections = allInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);
    const outstanding = totalRevenue - totalCollections;
    const activeCustomers = allCustomers.filter((c) => c.status === "active").length;
    const arpu = activeCustomers > 0 ? totalRevenue / activeCustomers : 0;
    const suspendedOrDisconnected = allCustomers.filter(
      (c) => c.status === "suspended" || c.status === "disconnected"
    ).length;
    const churnRate = allCustomers.length > 0 ? (suspendedOrDisconnected / allCustomers.length) * 100 : 0;

    const now = new Date();
    const monthlyData: { month: string; revenue: number; collected: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const monthInvoices = allInvoices.filter((inv) => (inv.issueDate || "").startsWith(monthKey));
      const revenue = monthInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);
      const collected = monthInvoices
        .filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);
      monthlyData.push({ month: monthLabel, revenue, collected });
    }

    const packageMap = new Map(allPackages.map((p) => [p.id, p.name]));
    const revenueByPackage: Record<string, number> = {};
    allCustomers.forEach((c) => {
      if (c.packageId) {
        const pkgName = packageMap.get(c.packageId) || `Package #${c.packageId}`;
        const bill = parseFloat(c.monthlyBill || "0");
        revenueByPackage[pkgName] = (revenueByPackage[pkgName] || 0) + bill;
      }
    });

    const revenueByArea: Record<string, number> = {};
    allCustomers.forEach((c) => {
      const area = c.area || "Unknown";
      const bill = parseFloat(c.monthlyBill || "0");
      revenueByArea[area] = (revenueByArea[area] || 0) + bill;
    });

    const statusBreakdown = {
      active: allCustomers.filter((c) => c.status === "active").length,
      suspended: allCustomers.filter((c) => c.status === "suspended").length,
      disconnected: allCustomers.filter((c) => c.status === "disconnected").length,
    };

    return {
      totalRevenue,
      totalCollections,
      outstanding,
      arpu,
      activeCustomers,
      churnRate,
      monthlyData,
      revenueByPackage,
      revenueByArea,
      statusBreakdown,
    };
  }, [invoices, customers, packages]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  const summaryCards = [
    { title: "Total Revenue", value: formatCurrency(analytics.totalRevenue), icon: DollarSign, color: "text-blue-600 dark:text-blue-400" },
    { title: "Total Collections", value: formatCurrency(analytics.totalCollections), icon: TrendingUp, color: "text-green-600 dark:text-green-400" },
    { title: "Outstanding", value: formatCurrency(analytics.outstanding), icon: AlertCircle, color: "text-red-600 dark:text-red-400" },
    { title: "ARPU", value: formatCurrency(analytics.arpu), icon: BarChart3, color: "text-purple-600 dark:text-purple-400" },
    { title: "Active Customers", value: String(analytics.activeCustomers), icon: Users, color: "text-teal-600 dark:text-teal-400" },
    { title: "Churn Rate", value: `${analytics.churnRate.toFixed(1)}%`, icon: PieChart, color: "text-amber-600 dark:text-amber-400" },
  ];

  const maxMonthlyRevenue = Math.max(...analytics.monthlyData.map((d) => d.revenue), 1);

  const packageEntries = Object.entries(analytics.revenueByPackage).sort((a, b) => b[1] - a[1]);
  const maxPackageRevenue = Math.max(...packageEntries.map(([, v]) => v), 1);

  const areaEntries = Object.entries(analytics.revenueByArea).sort((a, b) => b[1] - a[1]);
  const maxAreaRevenue = Math.max(...areaEntries.map(([, v]) => v), 1);

  const totalStatusCount = analytics.statusBreakdown.active + analytics.statusBreakdown.suspended + analytics.statusBreakdown.disconnected;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-revenue-analytics-title">Revenue Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Financial overview and revenue insights</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} data-testid={`card-summary-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid={`text-summary-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
                  {card.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card data-testid="card-monthly-revenue-trend">
        <CardHeader className="pb-3">
          <span className="text-base font-semibold">Monthly Revenue Trend</span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="flex items-end gap-2 h-48" data-testid="chart-monthly-revenue">
              {analytics.monthlyData.map((d, i) => {
                const heightPct = maxMonthlyRevenue > 0 ? (d.revenue / maxMonthlyRevenue) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                    <span className="text-[10px] text-muted-foreground mb-1 truncate">
                      {formatCurrency(d.revenue)}
                    </span>
                    <div
                      className="w-full rounded-t-sm bg-blue-500 dark:bg-blue-400 transition-all"
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                      data-testid={`bar-revenue-${i}`}
                    />
                    <span className="text-[10px] text-muted-foreground mt-1 truncate">{d.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-collection-rate">
        <CardHeader className="pb-3">
          <span className="text-base font-semibold">Collection Rate by Month</span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="space-y-3" data-testid="chart-collection-rate">
              {analytics.monthlyData.map((d, i) => {
                const rate = d.revenue > 0 ? (d.collected / d.revenue) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 shrink-0 text-right">{d.month}</span>
                    <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-sm bg-green-500 dark:bg-green-400 transition-all"
                        style={{ width: `${Math.min(rate, 100)}%` }}
                        data-testid={`bar-collection-${i}`}
                      />
                    </div>
                    <span className="text-xs font-medium w-12 shrink-0">{rate.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-revenue-by-package">
          <CardHeader className="pb-3">
            <span className="text-base font-semibold">Revenue by Package</span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : packageEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No package data available</p>
            ) : (
              <div className="space-y-3" data-testid="chart-revenue-by-package">
                {packageEntries.map(([name, value]) => {
                  const widthPct = (value / maxPackageRevenue) * 100;
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-28 shrink-0 truncate text-right" title={name}>{name}</span>
                      <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-sm bg-purple-500 dark:bg-purple-400 transition-all"
                          style={{ width: `${Math.max(widthPct, 2)}%` }}
                          data-testid={`bar-package-${name}`}
                        />
                      </div>
                      <span className="text-xs font-medium w-16 shrink-0">{formatCurrency(value)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-revenue-by-area">
          <CardHeader className="pb-3">
            <span className="text-base font-semibold">Revenue by Area</span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : areaEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No area data available</p>
            ) : (
              <div className="space-y-3" data-testid="chart-revenue-by-area">
                {areaEntries.map(([name, value]) => {
                  const widthPct = (value / maxAreaRevenue) * 100;
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-28 shrink-0 truncate text-right" title={name}>{name}</span>
                      <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-sm bg-teal-500 dark:bg-teal-400 transition-all"
                          style={{ width: `${Math.max(widthPct, 2)}%` }}
                          data-testid={`bar-area-${name}`}
                        />
                      </div>
                      <span className="text-xs font-medium w-16 shrink-0">{formatCurrency(value)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-customer-status-breakdown">
        <CardHeader className="pb-3">
          <span className="text-base font-semibold">Customer Status Breakdown</span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div data-testid="chart-customer-status">
              <div className="flex h-8 rounded-sm overflow-hidden mb-4">
                {totalStatusCount > 0 ? (
                  <>
                    {analytics.statusBreakdown.active > 0 && (
                      <div
                        className="bg-green-500 dark:bg-green-400 transition-all"
                        style={{ width: `${(analytics.statusBreakdown.active / totalStatusCount) * 100}%` }}
                        data-testid="segment-active"
                      />
                    )}
                    {analytics.statusBreakdown.suspended > 0 && (
                      <div
                        className="bg-amber-500 dark:bg-amber-400 transition-all"
                        style={{ width: `${(analytics.statusBreakdown.suspended / totalStatusCount) * 100}%` }}
                        data-testid="segment-suspended"
                      />
                    )}
                    {analytics.statusBreakdown.disconnected > 0 && (
                      <div
                        className="bg-red-500 dark:bg-red-400 transition-all"
                        style={{ width: `${(analytics.statusBreakdown.disconnected / totalStatusCount) * 100}%` }}
                        data-testid="segment-disconnected"
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full bg-muted" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-400" />
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="text-sm font-semibold" data-testid="text-status-active">{analytics.statusBreakdown.active}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-amber-500 dark:bg-amber-400" />
                  <span className="text-sm text-muted-foreground">Suspended</span>
                  <span className="text-sm font-semibold" data-testid="text-status-suspended">{analytics.statusBreakdown.suspended}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-red-500 dark:bg-red-400" />
                  <span className="text-sm text-muted-foreground">Disconnected</span>
                  <span className="text-sm font-semibold" data-testid="text-status-disconnected">{analytics.statusBreakdown.disconnected}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
