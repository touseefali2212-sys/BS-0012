import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  CreditCard,
  Banknote,
  RotateCcw,
  Download,
  Filter,
  X,
  TrendingUp,
  AlertTriangle,
  Search,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "wouter";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

interface PaymentStats {
  totalCollected: number;
  totalPayments: number;
  byMethod: { name: string; value: number }[];
  refunds: number;
  failed: number;
  daily: { date: string; amount: number; count: number }[];
}

const METHOD_COLORS: Record<string, string> = {
  cash: "#22c55e",
  online: "#3b82f6",
  bank_transfer: "#8b5cf6",
  mobile_money: "#f59e0b",
  cheque: "#06b6d4",
  card: "#ec4899",
  wallet: "#14b8a6",
  other: "#64748b",
};

const PIE_COLORS = ["#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899", "#14b8a6", "#64748b"];

function formatMethodName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ReportsPaymentsPage() {
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30days");
  const [search, setSearch] = useState("");

  const { data: stats, isLoading } = useQuery<PaymentStats>({
    queryKey: ["/api/reports/payment-stats"],
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  const cashTotal = useMemo(() => {
    if (!stats) return 0;
    const cash = stats.byMethod.find((m) => m.name === "cash");
    return cash?.value || 0;
  }, [stats]);

  const onlineTotal = useMemo(() => {
    if (!stats) return 0;
    return stats.byMethod
      .filter((m) => m.name !== "cash")
      .reduce((s, m) => s + m.value, 0);
  }, [stats]);

  const filteredDaily = useMemo(() => {
    if (!stats) return [];
    const days = stats.daily;
    if (dateRange === "7days") return days.slice(-7);
    if (dateRange === "14days") return days.slice(-14);
    return days;
  }, [stats, dateRange]);

  const kpiCards = [
    {
      title: "Total Collected",
      value: stats ? formatCurrency(stats.totalCollected) : "$0",
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      sub: stats ? `${stats.totalPayments} payments` : "",
    },
    {
      title: "Cash Payments",
      value: formatCurrency(cashTotal),
      icon: Banknote,
      color: "text-emerald-600 dark:text-emerald-400",
      sub: stats
        ? `${stats.byMethod.find((m) => m.name === "cash") ? "1" : "0"} method`
        : "",
    },
    {
      title: "Online Payments",
      value: formatCurrency(onlineTotal),
      icon: CreditCard,
      color: "text-blue-600 dark:text-blue-400",
      sub: stats
        ? `${stats.byMethod.filter((m) => m.name !== "cash").length} methods`
        : "",
    },
    {
      title: "Refunds",
      value: stats ? formatCurrency(stats.refunds) : "$0",
      icon: RotateCcw,
      color: "text-amber-600 dark:text-amber-400",
      sub: stats ? `${stats.failed} failed` : "",
    },
  ];

  const handleExportCSV = () => {
    if (!stats) return;
    const rows = [["Date", "Amount", "Count"]];
    stats.daily.forEach((d) => {
      rows.push([d.date, String(d.amount), String(d.count)]);
    });
    rows.push([]);
    rows.push(["Method", "Amount"]);
    stats.byMethod.forEach((m) => {
      rows.push([formatMethodName(m.name), String(m.value)]);
    });
    rows.push([]);
    rows.push(["Total Collected", String(stats.totalCollected)]);
    rows.push(["Refunds", String(stats.refunds)]);
    rows.push(["Failed", String(stats.failed)]);

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const totalDailyAmount = filteredDaily.reduce((s, d) => s + d.amount, 0);
  const avgDailyAmount = filteredDaily.length > 0 ? totalDailyAmount / filteredDaily.length : 0;
  const maxDailyAmount = Math.max(...filteredDaily.map((d) => d.amount), 0);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="ghost" size="icon" data-testid="button-back-reports">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-payment-reports-title">
              Payment Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Payment collection analytics and trends
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportCSV} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-1.5" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} data-testid="button-export-pdf">
            <Download className="h-4 w-4 mr-1.5" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.title} data-testid={`card-kpi-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div
                    className="text-2xl font-bold"
                    data-testid={`text-kpi-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {card.value}
                  </div>
                  {card.sub && (
                    <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[160px]" data-testid="select-date-range">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="14days">Last 14 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-method-filter">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {(stats?.byMethod || []).map((m) => (
              <SelectItem key={m.name} value={m.name}>
                {formatMethodName(m.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(methodFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMethodFilter("all")}
            data-testid="button-clear-filters"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <Card data-testid="card-daily-collection-trend">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-base font-semibold">Daily Collection Trend</span>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Avg: {formatCurrency(avgDailyAmount)}/day</span>
              <span>Peak: {formatCurrency(maxDailyAmount)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : filteredDaily.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              No payment data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={filteredDaily}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  interval={Math.max(0, Math.floor(filteredDaily.length / 8))}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Amount"]}
                  contentStyle={{
                    borderRadius: "6px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-payment-method-distribution">
          <CardHeader className="pb-3">
            <span className="text-base font-semibold">Payment Method Distribution</span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : !stats || stats.byMethod.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                No method data available
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={stats.byMethod}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {stats.byMethod.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={METHOD_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        formatMethodName(name),
                      ]}
                      contentStyle={{
                        borderRadius: "6px",
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--card))",
                        color: "hsl(var(--card-foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                  {stats.byMethod.map((m, i) => (
                    <div key={m.name} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{
                          backgroundColor:
                            METHOD_COLORS[m.name] || PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {formatMethodName(m.name)}
                      </span>
                      <span className="text-xs font-medium">{formatCurrency(m.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-method-comparison">
          <CardHeader className="pb-3">
            <span className="text-base font-semibold">Method Comparison</span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : !stats || stats.byMethod.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                No method data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.byMethod} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    width={90}
                    tickFormatter={(v) => formatMethodName(v)}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      "Amount",
                    ]}
                    contentStyle={{
                      borderRadius: "6px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {stats.byMethod.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={METHOD_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-daily-payments-table">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-base font-semibold">Daily Payment Details</span>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by date..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
                data-testid="input-search-payments"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">Avg per Txn</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDaily
                    .filter((d) =>
                      search
                        ? d.date.toLowerCase().includes(search.toLowerCase())
                        : true
                    )
                    .map((d, i) => {
                      const avg = d.count > 0 ? d.amount / d.count : 0;
                      return (
                        <TableRow key={i} data-testid={`row-payment-${i}`}>
                          <TableCell className="font-medium">{d.date}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(d.amount)}
                          </TableCell>
                          <TableCell className="text-right">{d.count}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(avg)}
                          </TableCell>
                          <TableCell>
                            {d.amount > 0 ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800"
                              >
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Collected
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                              >
                                No Activity
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {filteredDaily.filter((d) =>
                    search
                      ? d.date.toLowerCase().includes(search.toLowerCase())
                      : true
                  ).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No payment records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-payment-summary">
        <CardHeader className="pb-3">
          <span className="text-base font-semibold">Payment Summary</span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Payments</p>
                <p className="text-lg font-semibold" data-testid="text-total-payments">
                  {stats.totalPayments}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Collected</p>
                <p className="text-lg font-semibold" data-testid="text-total-collected">
                  {formatCurrency(stats.totalCollected)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Refunded</p>
                <p className="text-lg font-semibold text-amber-600 dark:text-amber-400" data-testid="text-refunded">
                  {formatCurrency(stats.refunds)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Failed Transactions</p>
                <p className="text-lg font-semibold text-red-600 dark:text-red-400" data-testid="text-failed">
                  {stats.failed}
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
