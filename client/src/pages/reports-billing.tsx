import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Search,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface BillingStats {
  total: number;
  paid: number;
  unpaid: number;
  totalBilled: number;
  totalCollected: number;
  outstanding: number;
  byMonth: { month: string; revenue: number; collected: number }[];
  byPlan: { name: string; value: number }[];
  aging: { current: number; days30: number; days60: number; days90: number; over90: number };
}

const PIE_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const AGING_COLORS = {
  current: "bg-green-500 dark:bg-green-400",
  days30: "bg-amber-500 dark:bg-amber-400",
  days60: "bg-orange-500 dark:bg-orange-400",
  days90: "bg-red-500 dark:bg-red-400",
  over90: "bg-red-700 dark:bg-red-500",
};

const AGING_LABELS: Record<string, string> = {
  current: "Current (0 days)",
  days30: "1-30 Days",
  days60: "31-60 Days",
  days90: "61-90 Days",
  over90: "90+ Days",
};

export default function ReportsBillingPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: billingStats, isLoading } = useQuery<BillingStats>({
    queryKey: ["/api/reports/billing-stats"],
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  const formatCurrencyFull = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);

  const kpiCards = useMemo(() => {
    if (!billingStats) return [];
    return [
      {
        title: "Total Invoices",
        value: String(billingStats.total),
        icon: FileText,
        color: "text-blue-600 dark:text-blue-400",
      },
      {
        title: "Paid Invoices",
        value: String(billingStats.paid),
        icon: CheckCircle,
        color: "text-green-600 dark:text-green-400",
      },
      {
        title: "Unpaid Invoices",
        value: String(billingStats.unpaid),
        icon: AlertCircle,
        color: "text-amber-600 dark:text-amber-400",
      },
      {
        title: "Outstanding Amount",
        value: formatCurrency(billingStats.outstanding),
        icon: DollarSign,
        color: "text-red-600 dark:text-red-400",
      },
      {
        title: "Total Billed",
        value: formatCurrency(billingStats.totalBilled),
        icon: TrendingUp,
        color: "text-purple-600 dark:text-purple-400",
      },
      {
        title: "Total Collected",
        value: formatCurrency(billingStats.totalCollected),
        icon: CheckCircle,
        color: "text-teal-600 dark:text-teal-400",
      },
    ];
  }, [billingStats]);

  const agingData = useMemo(() => {
    if (!billingStats) return [];
    const { aging } = billingStats;
    return [
      { label: AGING_LABELS.current, key: "current", amount: aging.current, color: AGING_COLORS.current },
      { label: AGING_LABELS.days30, key: "days30", amount: aging.days30, color: AGING_COLORS.days30 },
      { label: AGING_LABELS.days60, key: "days60", amount: aging.days60, color: AGING_COLORS.days60 },
      { label: AGING_LABELS.days90, key: "days90", amount: aging.days90, color: AGING_COLORS.days90 },
      { label: AGING_LABELS.over90, key: "over90", amount: aging.over90, color: AGING_COLORS.over90 },
    ];
  }, [billingStats]);

  const agingTotal = agingData.reduce((s, d) => s + d.amount, 0);

  const paymentStatusPieData = useMemo(() => {
    if (!billingStats) return [];
    return [
      { name: "Paid", value: billingStats.paid },
      { name: "Unpaid", value: billingStats.unpaid },
    ].filter((d) => d.value > 0);
  }, [billingStats]);

  const filteredByPlan = useMemo(() => {
    if (!billingStats) return [];
    let data = billingStats.byPlan;
    if (searchQuery) {
      data = data.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return data.sort((a, b) => b.value - a.value);
  }, [billingStats, searchQuery]);

  const handleExportCSV = () => {
    if (!billingStats) return;
    const lines: string[] = [];
    lines.push("Billing & Invoice Report");
    lines.push("");
    lines.push("Summary");
    lines.push(`Total Invoices,${billingStats.total}`);
    lines.push(`Paid,${billingStats.paid}`);
    lines.push(`Unpaid,${billingStats.unpaid}`);
    lines.push(`Total Billed,${billingStats.totalBilled.toFixed(2)}`);
    lines.push(`Total Collected,${billingStats.totalCollected.toFixed(2)}`);
    lines.push(`Outstanding,${billingStats.outstanding.toFixed(2)}`);
    lines.push("");
    lines.push("Monthly Revenue");
    lines.push("Month,Revenue,Collected");
    billingStats.byMonth.forEach((m) => {
      lines.push(`${m.month},${m.revenue.toFixed(2)},${m.collected.toFixed(2)}`);
    });
    lines.push("");
    lines.push("Revenue by Plan");
    lines.push("Plan,Revenue");
    billingStats.byPlan.forEach((p) => {
      lines.push(`"${p.name}",${p.value.toFixed(2)}`);
    });
    lines.push("");
    lines.push("Aging Report");
    lines.push("Bucket,Amount");
    agingData.forEach((a) => {
      lines.push(`"${a.label}",${a.amount.toFixed(2)}`);
    });

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "billing-invoice-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-billing-report-title">
            Billing & Invoice Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Comprehensive billing analytics and invoice insights
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          : kpiCards.map((card) => (
              <Card
                key={card.title}
                data-testid={`card-kpi-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div
                    className="text-2xl font-bold"
                    data-testid={`text-kpi-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {card.value}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList data-testid="tabs-billing-reports">
          <TabsTrigger value="overview" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="revenue" data-testid="tab-revenue">
            Revenue Trend
          </TabsTrigger>
          <TabsTrigger value="plan-revenue" data-testid="tab-plan-revenue">
            Plan Revenue
          </TabsTrigger>
          <TabsTrigger value="aging" data-testid="tab-aging">
            Aging Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-revenue-chart">
              <CardHeader className="pb-3">
                <span className="text-base font-semibold">Revenue vs Collections (12 Months)</span>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={billingStats?.byMonth || []}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: number) => formatCurrencyFull(value)}
                        contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="collected"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="Collected"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-status-pie">
              <CardHeader className="pb-3">
                <span className="text-base font-semibold">Payment Status Distribution</span>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : paymentStatusPieData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">No invoice data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={paymentStatusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentStatusPieData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-aging-summary">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Aging Summary</span>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : agingTotal === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No outstanding invoices
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex h-6 w-full rounded-md overflow-hidden" data-testid="bar-aging-distribution">
                    {agingData.map((bucket) => {
                      const pct = agingTotal > 0 ? (bucket.amount / agingTotal) * 100 : 0;
                      if (pct === 0) return null;
                      return (
                        <div
                          key={bucket.key}
                          className={`${bucket.color} flex items-center justify-center text-[10px] font-medium text-white`}
                          style={{ width: `${pct}%` }}
                          title={`${bucket.label}: ${formatCurrencyFull(bucket.amount)} (${pct.toFixed(1)}%)`}
                          data-testid={`bar-aging-${bucket.key}`}
                        >
                          {pct >= 10 ? `${pct.toFixed(0)}%` : ""}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {agingData.map((bucket) => (
                      <div key={bucket.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className={`h-2.5 w-2.5 rounded-sm ${bucket.color}`} />
                        <span>{bucket.label}:</span>
                        <span className="font-medium">{formatCurrency(bucket.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card data-testid="card-revenue-trend-full">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Monthly Revenue & Collections (12 Months)</span>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={billingStats?.byMonth || []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: number) => formatCurrencyFull(value)}
                      contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="collected"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Collected"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6" data-testid="card-monthly-table">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Monthly Breakdown</span>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Collected</TableHead>
                        <TableHead className="text-right">Outstanding</TableHead>
                        <TableHead className="text-right">Collection Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(billingStats?.byMonth || []).map((m, i) => {
                        const outstanding = m.revenue - m.collected;
                        const rate = m.revenue > 0 ? (m.collected / m.revenue) * 100 : 0;
                        return (
                          <TableRow key={i} data-testid={`row-monthly-${i}`}>
                            <TableCell className="font-medium">{m.month}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrencyFull(m.revenue)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrencyFull(m.collected)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrencyFull(outstanding)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="secondary"
                                className={`no-default-active-elevate text-[10px] ${
                                  rate >= 90
                                    ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950"
                                    : rate >= 70
                                    ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950"
                                    : "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950"
                                }`}
                                data-testid={`badge-rate-${i}`}
                              >
                                {rate.toFixed(1)}%
                              </Badge>
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
        </TabsContent>

        <TabsContent value="plan-revenue">
          <Card data-testid="card-plan-revenue">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <span className="text-base font-semibold">Revenue by Plan</span>
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search plans..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-plans"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : filteredByPlan.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No plan revenue data</p>
              ) : (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={Math.max(200, filteredByPlan.length * 40)}>
                    <BarChart data={filteredByPlan} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number) => formatCurrencyFull(value)}
                        contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plan Name</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Share</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredByPlan.map((plan) => {
                          const totalPlanRevenue = billingStats?.byPlan.reduce((s, p) => s + p.value, 0) || 1;
                          const share = (plan.value / totalPlanRevenue) * 100;
                          return (
                            <TableRow key={plan.name} data-testid={`row-plan-${plan.name}`}>
                              <TableCell className="font-medium">{plan.name}</TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrencyFull(plan.value)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary" className="no-default-active-elevate text-[10px]">
                                  {share.toFixed(1)}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging">
          <Card data-testid="card-aging-report">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Invoice Aging Report</span>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : agingTotal === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No outstanding invoices to display
                </p>
              ) : (
                <div className="space-y-6">
                  <div className="flex h-8 w-full rounded-md overflow-hidden" data-testid="bar-aging-full">
                    {agingData.map((bucket) => {
                      const pct = (bucket.amount / agingTotal) * 100;
                      if (pct === 0) return null;
                      return (
                        <div
                          key={bucket.key}
                          className={`${bucket.color} flex items-center justify-center text-[10px] font-medium text-white`}
                          style={{ width: `${pct}%` }}
                          title={`${bucket.label}: ${formatCurrencyFull(bucket.amount)}`}
                          data-testid={`bar-aging-full-${bucket.key}`}
                        >
                          {pct >= 8 ? `${pct.toFixed(0)}%` : ""}
                        </div>
                      );
                    })}
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Aging Bucket</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">% of Total</TableHead>
                          <TableHead>Distribution</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agingData.map((bucket) => {
                          const pct = agingTotal > 0 ? (bucket.amount / agingTotal) * 100 : 0;
                          return (
                            <TableRow key={bucket.key} data-testid={`row-aging-${bucket.key}`}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`h-3 w-3 rounded-sm ${bucket.color}`} />
                                  <span className="font-medium">{bucket.label}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrencyFull(bucket.amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                {pct.toFixed(1)}%
                              </TableCell>
                              <TableCell>
                                <div className="w-full max-w-[200px] h-4 rounded-sm bg-muted overflow-hidden">
                                  <div
                                    className={`h-full rounded-sm ${bucket.color} transition-all`}
                                    style={{ width: `${Math.max(pct, 1)}%` }}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow data-testid="row-aging-total">
                          <TableCell className="font-bold">Total</TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {formatCurrencyFull(agingTotal)}
                          </TableCell>
                          <TableCell className="text-right font-bold">100%</TableCell>
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}