import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  DollarSign,
  Users,
  Package,
  Server,
  UserCheck,
  TrendingUp,
  TrendingDown,
  FileText,
  CreditCard,
  Wifi,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  Calendar,
  Bell,
  Activity,
  Briefcase,
  Shield,
  Box,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Legend,
} from "recharts";

interface DashboardData {
  totalRevenue: number;
  collected: number;
  outstanding: number;
  activeCustomers: number;
  totalCustomers: number;
  suspendedCustomers: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  totalPayments: number;
  paymentTotal: number;
  totalEmployees: number;
  activeEmployees: number;
  totalAssets: number;
  assignedAssets: number;
  totalOlts: number;
  totalOnus: number;
  totalSplitters: number;
  onuOnline: number;
  onuOffline: number;
  totalP2p: number;
  totalFiber: number;
  totalVendors: number;
  activeVendors: number;
  openTickets: number;
  monthlyRevenue: { month: string; billed: number; collected: number }[];
}

interface CustomerStats {
  total: number;
  active: number;
  suspended: number;
  disconnected: number;
  thisMonth: number;
  churnRate: string;
  growth: { month: string; count: number }[];
  byArea: { name: string; value: number }[];
  byPlan: { name: string; value: number }[];
}

interface PaymentStats {
  totalCollected: number;
  totalPayments: number;
  byMethod: { name: string; value: number }[];
  refunds: number;
  failed: number;
}

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

const KPI_CARDS = [
  {
    key: "revenue",
    title: "Total Revenue",
    getValue: (d: DashboardData) => `Rs. ${d.totalRevenue.toLocaleString()}`,
    subtitle: (d: DashboardData) => `Rs. ${d.collected.toLocaleString()} collected`,
    gradient: "from-blue-600 via-blue-500 to-cyan-400",
    darkGradient: "dark:from-blue-700 dark:via-blue-600 dark:to-cyan-500",
    icon: DollarSign,
    trend: "up" as const,
  },
  {
    key: "customers",
    title: "Active Customers",
    getValue: (d: DashboardData) => d.activeCustomers.toString(),
    subtitle: (d: DashboardData) => `${d.totalCustomers} total registered`,
    gradient: "from-violet-600 via-purple-500 to-fuchsia-400",
    darkGradient: "dark:from-violet-700 dark:via-purple-600 dark:to-fuchsia-500",
    icon: Users,
    trend: "up" as const,
  },
  {
    key: "outstanding",
    title: "Outstanding",
    getValue: (d: DashboardData) => `Rs. ${d.outstanding.toLocaleString()}`,
    subtitle: (d: DashboardData) => `${d.unpaidInvoices} unpaid invoices`,
    gradient: "from-orange-500 via-orange-400 to-amber-300",
    darkGradient: "dark:from-orange-600 dark:via-orange-500 dark:to-amber-400",
    icon: TrendingDown,
    trend: "down" as const,
  },
  {
    key: "network",
    title: "Network Devices",
    getValue: (d: DashboardData) => (d.totalOlts + d.totalOnus + d.totalSplitters).toString(),
    subtitle: (d: DashboardData) => `${d.onuOnline} ONUs online`,
    gradient: "from-emerald-600 via-emerald-500 to-teal-400",
    darkGradient: "dark:from-emerald-700 dark:via-emerald-600 dark:to-teal-500",
    icon: Server,
    trend: "up" as const,
  },
  {
    key: "staff",
    title: "HR Staff",
    getValue: (d: DashboardData) => d.totalEmployees.toString(),
    subtitle: (d: DashboardData) => `${d.activeEmployees} active employees`,
    gradient: "from-rose-500 via-pink-500 to-fuchsia-400",
    darkGradient: "dark:from-rose-600 dark:via-pink-600 dark:to-fuchsia-500",
    icon: UserCheck,
  },
  {
    key: "assets",
    title: "Total Assets",
    getValue: (d: DashboardData) => d.totalAssets.toString(),
    subtitle: (d: DashboardData) => `${d.assignedAssets} assigned`,
    gradient: "from-indigo-600 via-indigo-500 to-blue-400",
    darkGradient: "dark:from-indigo-700 dark:via-indigo-600 dark:to-blue-500",
    icon: Box,
  },
];

const REPORT_CATEGORIES = [
  {
    title: "Customer Reports",
    description: "Growth trends, area distribution, churn analysis",
    icon: Users,
    href: "/reports/customers",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
  },
  {
    title: "Billing & Invoices",
    description: "Revenue breakdown, aging report, plan-wise billing",
    icon: FileText,
    href: "/reports/billing",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
  },
  {
    title: "Payment Reports",
    description: "Collection trends, method breakdown, refunds",
    icon: CreditCard,
    href: "/reports/payments",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/50",
  },
  {
    title: "Network & IPAM",
    description: "OLT utilization, ONU status, IP pool usage",
    icon: Wifi,
    href: "/reports/network",
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/50",
  },
  {
    title: "Inventory Reports",
    description: "Stock summary, low stock alerts, brand breakdown",
    icon: Package,
    href: "/reports/inventory",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
  },
  {
    title: "Asset Reports",
    description: "Allocation summary, movement history, depreciation",
    icon: Box,
    href: "/reports/assets",
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
  },
  {
    title: "HRM Reports",
    description: "Attendance, salary summary, role distribution",
    icon: Briefcase,
    href: "/reports/hrm",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/50",
  },
  {
    title: "Notification Reports",
    description: "SMS/Email delivery stats, campaign performance",
    icon: Bell,
    href: "/reports/notifications",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/50",
  },
  {
    title: "Activity Log Reports",
    description: "User activity, critical actions, failed logins",
    icon: Activity,
    href: "/reports/activity",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/50",
  },
  {
    title: "Vendor Reports",
    description: "Active vendors, bandwidth, wallet transactions",
    icon: Shield,
    href: "/reports/vendors",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
  },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("monthly");

  const { data: dashboard, isLoading: dashLoading } = useQuery<DashboardData>({
    queryKey: ["/api/reports/dashboard"],
  });

  const { data: customerStats, isLoading: custLoading } = useQuery<CustomerStats>({
    queryKey: ["/api/reports/customer-stats"],
  });

  const { data: paymentStats, isLoading: payLoading } = useQuery<PaymentStats>({
    queryKey: ["/api/reports/payment-stats"],
  });

  const isLoading = dashLoading || custLoading || payLoading;

  const revenueData = (dashboard?.monthlyRevenue || []).map((m) => ({
    ...m,
    dues: m.billed - m.collected,
  }));

  const customerGrowth = customerStats?.growth || [];

  const paymentMethodData = paymentStats?.byMethod || [];

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1400px] mx-auto" data-testid="page-reports-dashboard">
      <div className="rounded-md bg-gradient-to-r from-[#0B1120] to-[#1E3A5F] p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-reports-title">
              Reports Dashboard
            </h1>
            <p className="text-sm text-white/70 mt-0.5">
              Comprehensive analytics and insights across all modules
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger
                className="w-[140px] bg-white/10 border-white/20 text-white"
                data-testid="select-date-range"
              >
                <Calendar className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-md" />
            ))
          : dashboard &&
            KPI_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.key}
                  className={`rounded-md bg-gradient-to-br ${card.gradient} ${card.darkGradient} p-5 text-white relative`}
                  style={{ boxShadow: "0 4px 20px -4px rgba(0,0,0,0.2)" }}
                  data-testid={`kpi-card-${card.key}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-white/75">
                        {card.title}
                      </p>
                      <p className="text-2xl font-bold mt-1 tracking-tight leading-none">
                        {card.getValue(dashboard)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                        {card.trend === "up" && (
                          <span className="flex items-center gap-0.5 text-[10px] font-semibold bg-white/20 rounded-full px-1.5 py-0.5">
                            <TrendingUp className="h-2.5 w-2.5" />
                          </span>
                        )}
                        {card.trend === "down" && (
                          <span className="flex items-center gap-0.5 text-[10px] font-semibold bg-white/20 rounded-full px-1.5 py-0.5">
                            <TrendingDown className="h-2.5 w-2.5" />
                          </span>
                        )}
                        <p className="text-[11px] text-white/65 truncate">
                          {card.subtitle(dashboard)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center w-11 h-11 rounded-md bg-white/15 shrink-0">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle className="text-sm font-semibold">Revenue Trend</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monthly billing vs collections
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <span className="text-[10px] text-muted-foreground">Billed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span className="text-[10px] text-muted-foreground">Collected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-500" />
                <span className="text-[10px] text-muted-foreground">Dues</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <div className="h-[260px]" data-testid="chart-revenue-trend">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={revenueData}
                    margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="rpBilledGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                      </linearGradient>
                      <linearGradient id="rpCollectedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      strokeOpacity={0.5}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [
                        `Rs. ${value.toLocaleString()}`,
                        undefined,
                      ]}
                    />
                    <Bar
                      dataKey="billed"
                      fill="url(#rpBilledGrad)"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                    <Bar
                      dataKey="collected"
                      fill="url(#rpCollectedGrad)"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                    <Line
                      type="monotone"
                      dataKey="dues"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{
                        r: 4,
                        fill: "#f59e0b",
                        strokeWidth: 2,
                        stroke: "white",
                      }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Payment Methods</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Collection by payment channel
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : paymentMethodData.length === 0 ? (
              <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">
                No payment data available
              </div>
            ) : (
              <div data-testid="chart-payment-methods">
                <div className="relative w-full h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {paymentMethodData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [
                          `Rs. ${value.toLocaleString()}`,
                          undefined,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-lg font-bold">
                        {paymentStats?.totalPayments || 0}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Payments
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                  {paymentMethodData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{
                          backgroundColor:
                            CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                      <span className="text-[11px] text-muted-foreground capitalize">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <div>
            <CardTitle className="text-sm font-semibold">Customer Growth</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              New customer registrations over 12 months
            </p>
          </div>
          {customerStats && (
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" className="no-default-active-elevate text-[10px]">
                {customerStats.active} Active
              </Badge>
              <Badge variant="secondary" className="no-default-active-elevate text-[10px]">
                Churn: {customerStats.churnRate}%
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <div className="h-[220px]" data-testid="chart-customer-growth">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={customerGrowth}
                  margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="rpCustGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.5}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [
                      `${value} customers`,
                      undefined,
                    ]}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#rpCustGrad)"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold" data-testid="text-report-categories-title">
              Report Categories
            </h2>
            <p className="text-sm text-muted-foreground">
              Explore detailed reports by module
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {REPORT_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.href} href={cat.href}>
                <Card
                  className="hover-elevate cursor-pointer group"
                  data-testid={`card-report-${cat.title.toLowerCase().replace(/[\s&]+/g, "-")}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-md ${cat.bgColor} shrink-0`}
                      >
                        <Icon className={`h-5 w-5 ${cat.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="text-sm font-semibold truncate">
                            {cat.title}
                          </h3>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {cat.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card data-testid="card-quick-stat-invoices">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-purple-50 dark:bg-purple-950/50 shrink-0">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Invoices</p>
                <p className="text-xl font-bold" data-testid="text-total-invoices">
                  {dashboard.totalInvoices}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {dashboard.paidInvoices} paid
                </p>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-quick-stat-payments">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-green-50 dark:bg-green-950/50 shrink-0">
                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payments</p>
                <p className="text-xl font-bold" data-testid="text-total-payments">
                  {dashboard.totalPayments}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Rs. {dashboard.paymentTotal.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-quick-stat-vendors">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-emerald-50 dark:bg-emerald-950/50 shrink-0">
                <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendors</p>
                <p className="text-xl font-bold" data-testid="text-total-vendors">
                  {dashboard.totalVendors}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {dashboard.activeVendors} active
                </p>
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-quick-stat-tickets">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-rose-50 dark:bg-rose-950/50 shrink-0">
                <BarChart3 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Open Tickets</p>
                <p className="text-xl font-bold" data-testid="text-open-tickets">
                  {dashboard.openTickets}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Pending resolution
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
