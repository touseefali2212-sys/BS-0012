import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Users,
  Wallet,
  CreditCard,
  Package,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface VendorStats {
  total: number;
  active: number;
  inactive: number;
  totalWallet: number;
  totalPayable: number;
  totalPackages: number;
  totalTransactions: number;
  upgrades: number;
  downgrades: number;
  byType: { name: string; value: number }[];
}

export default function ReportsVendorsPage() {
  const { data, isLoading } = useQuery<VendorStats>({
    queryKey: ["/api/reports/vendor-stats"],
  });

  const stats = data || {
    total: 0,
    active: 0,
    inactive: 0,
    totalWallet: 0,
    totalPayable: 0,
    totalPackages: 0,
    totalTransactions: 0,
    upgrades: 0,
    downgrades: 0,
    byType: [],
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  const kpiCards = [
    { title: "Total Vendors", value: String(stats.total), icon: Building2, color: "text-blue-600 dark:text-blue-400" },
    { title: "Active Vendors", value: String(stats.active), icon: Users, color: "text-green-600 dark:text-green-400" },
    { title: "Wallet Balance", value: formatCurrency(stats.totalWallet), icon: Wallet, color: "text-purple-600 dark:text-purple-400" },
    { title: "Total Payable", value: formatCurrency(stats.totalPayable), icon: CreditCard, color: "text-red-600 dark:text-red-400" },
    { title: "Packages", value: String(stats.totalPackages), icon: Package, color: "text-teal-600 dark:text-teal-400" },
    { title: "Transactions", value: String(stats.totalTransactions), icon: ArrowUpDown, color: "text-amber-600 dark:text-amber-400" },
  ];

  const maxTypeValue = Math.max(...stats.byType.map((d) => d.value), 1);

  const handleExportCsv = () => {
    const rows = [["Metric", "Value"]];
    rows.push(["Total Vendors", String(stats.total)]);
    rows.push(["Active", String(stats.active)]);
    rows.push(["Inactive", String(stats.inactive)]);
    rows.push(["Wallet Balance", String(stats.totalWallet)]);
    rows.push(["Payable", String(stats.totalPayable)]);
    rows.push(["Packages", String(stats.totalPackages)]);
    rows.push(["Transactions", String(stats.totalTransactions)]);
    rows.push(["Upgrades", String(stats.upgrades)]);
    rows.push(["Downgrades", String(stats.downgrades)]);
    stats.byType.forEach((d) => rows.push([`Type: ${d.name}`, String(d.value)]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendor-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-vendor-reports-title">Vendor Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Vendor performance, bandwidth and payment analytics</p>
        </div>
        <Button variant="outline" onClick={handleExportCsv} data-testid="button-export-vendor-csv">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.title} data-testid={`card-kpi-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid={`text-kpi-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
                  {card.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-vendor-type-distribution">
          <CardHeader className="pb-3">
            <span className="text-base font-semibold">Vendor Type Distribution</span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : stats.byType.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No vendor type data available</p>
            ) : (
              <div className="space-y-3" data-testid="chart-vendor-type">
                {stats.byType.map((d) => {
                  const widthPct = (d.value / maxTypeValue) * 100;
                  return (
                    <div key={d.name} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-28 shrink-0 truncate text-right capitalize" title={d.name}>{d.name}</span>
                      <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-sm bg-blue-500 dark:bg-blue-400 transition-all"
                          style={{ width: `${Math.max(widthPct, 2)}%` }}
                          data-testid={`bar-type-${d.name}`}
                        />
                      </div>
                      <span className="text-xs font-medium w-10 shrink-0">{d.value}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-bandwidth-changes">
          <CardHeader className="pb-3">
            <span className="text-base font-semibold">Bandwidth Changes</span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow data-testid="row-upgrades">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Upgrades
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium" data-testid="text-upgrades">{stats.upgrades}</TableCell>
                  </TableRow>
                  <TableRow data-testid="row-downgrades">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        Downgrades
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium" data-testid="text-downgrades">{stats.downgrades}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-vendor-summary">
        <CardHeader className="pb-3">
          <span className="text-base font-semibold">Vendor Status Summary</span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div data-testid="chart-vendor-status">
              <div className="flex h-8 rounded-sm overflow-hidden mb-4">
                {stats.total > 0 ? (
                  <>
                    {stats.active > 0 && (
                      <div
                        className="bg-green-500 dark:bg-green-400 transition-all"
                        style={{ width: `${(stats.active / stats.total) * 100}%` }}
                        data-testid="segment-vendor-active"
                      />
                    )}
                    {stats.inactive > 0 && (
                      <div
                        className="bg-red-500 dark:bg-red-400 transition-all"
                        style={{ width: `${(stats.inactive / stats.total) * 100}%` }}
                        data-testid="segment-vendor-inactive"
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
                  <span className="text-sm font-semibold" data-testid="text-vendor-active">{stats.active}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-red-500 dark:bg-red-400" />
                  <span className="text-sm text-muted-foreground">Inactive</span>
                  <span className="text-sm font-semibold" data-testid="text-vendor-inactive">{stats.inactive}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
