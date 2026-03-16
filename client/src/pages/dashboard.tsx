import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  LifeBuoy,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Plus,
  ArrowUpRight,
  Wallet,
  UserCheck,
  Wrench,
  Users,
  Receipt,
  RefreshCw,
  BarChart3,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useTab } from "@/hooks/use-tab";
import type { Invoice, Ticket } from "@shared/schema";
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
} from "recharts";

interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: string;
  pendingInvoices: number;
  openTickets: number;
  totalPackages: number;
  overdueAmount: string;
  collectedAmount: string;
}

interface RevenueData {
  month: string;
  billed: number;
  collected: number;
  dues: number;
}

interface TicketBreakdown {
  open: number;
  inProgress: number;
  resolved: number;
  total: number;
  openPercent: number;
  inProgressPercent: number;
  resolvedPercent: number;
}

interface TechPerformance {
  name: string;
  jobsCompleted: number;
  totalJobs: number;
}

const STAT_CARDS = [
  {
    key: "revenue",
    title: "Total Revenue",
    getValue: (s: DashboardStats) => `Rs. ${Number(s.totalRevenue).toLocaleString()}`,
    subtitle: (s: DashboardStats) => `Rs. ${Number(s.collectedAmount).toLocaleString()} collected`,
    gradient: "from-blue-600 via-blue-500 to-cyan-400",
    darkGradient: "dark:from-blue-700 dark:via-blue-600 dark:to-cyan-500",
    icon: DollarSign,
    trend: "up" as const,
  },
  {
    key: "due",
    title: "Due Amount",
    getValue: (s: DashboardStats) => `Rs. ${Number(s.overdueAmount).toLocaleString()}`,
    subtitle: (s: DashboardStats) => `${s.pendingInvoices} pending invoices`,
    gradient: "from-orange-500 via-orange-400 to-amber-300",
    darkGradient: "dark:from-orange-600 dark:via-orange-500 dark:to-amber-400",
    icon: AlertCircle,
    trend: "down" as const,
  },
  {
    key: "customers",
    title: "Active Customers",
    getValue: (s: DashboardStats) => s.activeCustomers.toString(),
    subtitle: (s: DashboardStats) => `${s.totalCustomers} total registered`,
    gradient: "from-violet-600 via-purple-500 to-fuchsia-400",
    darkGradient: "dark:from-violet-700 dark:via-purple-600 dark:to-fuchsia-500",
    icon: UserCheck,
    trend: "up" as const,
  },
  {
    key: "tickets",
    title: "Open Tickets",
    getValue: (s: DashboardStats) => s.openTickets.toString(),
    subtitle: (s: DashboardStats) => `${s.totalPackages} packages active`,
    gradient: "from-rose-500 via-pink-500 to-fuchsia-400",
    darkGradient: "dark:from-rose-600 dark:via-pink-600 dark:to-fuchsia-500",
    icon: LifeBuoy,
  },
];

function GradientStatCard({
  config,
  stats,
}: {
  config: (typeof STAT_CARDS)[number];
  stats: DashboardStats;
}) {
  const Icon = config.icon;
  return (
    <div
      className={`glass-stat rounded-2xl bg-gradient-to-br ${config.gradient} ${config.darkGradient} p-5 text-white relative`}
      style={{ boxShadow: "0 4px 20px -4px rgba(0,0,0,0.2)" }}
      data-testid={`stat-card-${config.key}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/75">{config.title}</p>
          <p className="text-2xl font-bold mt-1 tracking-tight leading-none">{config.getValue(stats)}</p>
          <div className="flex items-center gap-1.5 mt-2.5">
            {config.trend === "up" && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold bg-white/20 rounded-full px-1.5 py-0.5">
                <TrendingUp className="h-2.5 w-2.5" />
                +12%
              </span>
            )}
            {config.trend === "down" && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold bg-white/20 rounded-full px-1.5 py-0.5">
                <TrendingDown className="h-2.5 w-2.5" />
                -5%
              </span>
            )}
            <p className="text-[11px] text-white/65">{config.subtitle(stats)}</p>
          </div>
        </div>
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/15">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function RevenueChart({ data }: { data: RevenueData[] }) {
  return (
    <Card className="enterprise-card glass-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-semibold">Revenue Overview</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Monthly billing & collections</p>
        </div>
        <div className="flex items-center gap-3">
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
        <div className="h-[260px]" data-testid="chart-revenue">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="billedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "10px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, undefined]}
              />
              <Bar dataKey="billed" fill="url(#billedGrad)" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="collected" fill="url(#collectedGrad)" radius={[4, 4, 0, 0]} barSize={20} />
              <Line type="monotone" dataKey="dues" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "white" }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function TicketStatusCards({ data }: { data: TicketBreakdown }) {
  return (
    <Card className="enterprise-card glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center">
            <LifeBuoy className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle className="text-sm font-semibold">Complaint Tickets</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 p-3 text-center" data-testid="ticket-open-count">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Open</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{data.open}</p>
          </div>
          <div className="rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/30 p-3 text-center" data-testid="ticket-progress-count">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">In Progress</p>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">{data.inProgress}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 p-3 text-center" data-testid="ticket-resolved-count">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Resolved</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{data.resolved}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TicketDonutChart({ data }: { data: TicketBreakdown }) {
  const pieData = [
    { name: "Open", value: data.open, color: "#3b82f6" },
    { name: "In Progress", value: data.inProgress, color: "#f97316" },
    { name: "Resolved", value: data.resolved, color: "#10b981" },
  ];

  return (
    <Card className="enterprise-card glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Ticket Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="relative w-[120px] h-[120px] flex-shrink-0" data-testid="chart-ticket-donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{data.total}</span>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            {pieData.map((item) => {
              const pct = data.total > 0 ? Math.round((item.value / data.total) * 100) : 0;
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-xs font-medium">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TechnicianPerformance({ data }: { data: TechPerformance[] }) {
  const colors = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6"];

  return (
    <Card className="enterprise-card glass-card">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
            <Wrench className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-sm font-semibold">Technician Performance</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {data.map((tech, index) => (
            <div key={tech.name} className="flex items-center gap-3 px-5 py-3" data-testid={`tech-${index}`}>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: colors[index % colors.length] }}
              >
                {tech.name.split(" ").pop()?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{tech.name}</p>
                <p className="text-[11px] text-muted-foreground">{tech.totalJobs} total assigned</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">Completed:</span>
                <span className="text-sm font-bold">{tech.jobsCompleted}</span>
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: colors[index % colors.length] }}
                />
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <p className="text-sm">No technician data</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentInvoices({ invoices }: { invoices: (Invoice & { customerName?: string })[] }) {
  const statusConfig: Record<string, string> = {
    paid: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30",
    pending: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30",
    overdue: "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-800/30",
  };

  return (
    <Card className="enterprise-card glass-card">
      <CardHeader className="flex flex-row items-center justify-between gap-1 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
            <Wallet className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-sm font-semibold">Recent Invoices</CardTitle>
        </div>
        <Link href="/invoices">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" data-testid="link-view-all-invoices">
            View All
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <FileText className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No invoices yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {invoices.slice(0, 5).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-2 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{inv.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{inv.customerName || `Customer #${inv.customerId}`}</p>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-sm font-bold tabular-nums">Rs. {Number(inv.totalAmount).toLocaleString()}</span>
                  <Badge
                    variant="secondary"
                    className={`no-default-active-elevate text-[10px] font-semibold capitalize ${statusConfig[inv.status] || ""}`}
                  >
                    {inv.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentTickets({ tickets }: { tickets: (Ticket & { customerName?: string })[] }) {
  const priorityConfig: Record<string, string> = {
    critical: "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-800/30",
    high: "bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200/50 dark:border-orange-800/30",
    medium: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30",
    low: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30",
  };

  return (
    <Card className="enterprise-card glass-card">
      <CardHeader className="flex flex-row items-center justify-between gap-1 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center">
            <LifeBuoy className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle className="text-sm font-semibold">Open Tickets</CardTitle>
        </div>
        <Link href="/tickets">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" data-testid="link-view-all-tickets">
            View All
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <LifeBuoy className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No open tickets</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {tickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between gap-2 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    <span className="font-mono">{ticket.ticketNumber}</span> - {ticket.customerName || `Customer #${ticket.customerId}`}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={`no-default-active-elevate text-[10px] font-semibold capitalize ${priorityConfig[ticket.priority] || ""}`}
                >
                  {ticket.priority}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


const QUICK_ACTIONS = [
  {
    label: "Add Customer",
    href: "/customers",
    icon: UserPlus,
    description: "Register a new customer account",
    gradient: "from-blue-600 to-cyan-500",
    darkGradient: "dark:from-blue-700 dark:to-cyan-600",
  },
  {
    label: "Create Invoice",
    href: "/invoices",
    icon: Receipt,
    description: "Generate a new invoice for billing",
    gradient: "from-emerald-600 to-green-500",
    darkGradient: "dark:from-emerald-700 dark:to-green-600",
  },
  {
    label: "New Ticket",
    href: "/tickets",
    icon: LifeBuoy,
    description: "Open a new support ticket",
    gradient: "from-purple-600 to-fuchsia-500",
    darkGradient: "dark:from-purple-700 dark:to-fuchsia-600",
  },
  {
    label: "Generate Recurring Invoices",
    href: "/invoices",
    icon: RefreshCw,
    description: "Auto-generate invoices for recurring plans",
    gradient: "from-orange-600 to-amber-500",
    darkGradient: "dark:from-orange-700 dark:to-amber-600",
  },
  {
    label: "View Reports",
    href: "/reports",
    icon: BarChart3,
    description: "Access detailed analytics and reports",
    gradient: "from-rose-600 to-pink-500",
    darkGradient: "dark:from-rose-700 dark:to-pink-600",
  },
  {
    label: "Manage Packages",
    href: "/packages",
    icon: Wallet,
    description: "Configure internet plans and packages",
    gradient: "from-violet-600 to-indigo-500",
    darkGradient: "dark:from-violet-700 dark:to-indigo-600",
  },
];

function CustomersTab({ stats, statsLoading }: { stats?: DashboardStats; statsLoading: boolean }) {
  if (statsLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[120px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const inactiveCustomers = stats.totalCustomers - stats.activeCustomers;
  const activePercent = stats.totalCustomers > 0 ? Math.round((stats.activeCustomers / stats.totalCustomers) * 100) : 0;
  const inactivePercent = 100 - activePercent;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="enterprise-card glass-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Customers</p>
                <p className="text-2xl font-bold" data-testid="text-total-customers">{stats.totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card glass-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active Customers</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300" data-testid="text-active-customers">{stats.activeCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card glass-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Inactive Customers</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300" data-testid="text-inactive-customers">{inactiveCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card glass-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active Packages</p>
                <p className="text-2xl font-bold" data-testid="text-active-packages">{stats.totalPackages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="enterprise-card glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Active vs Inactive Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium">Active</span>
                  </div>
                  <span className="text-sm font-bold">{stats.activeCustomers} ({activePercent}%)</span>
                </div>
                <div className="w-full h-2.5 bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${activePercent}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-sm font-medium">Inactive</span>
                  </div>
                  <span className="text-sm font-bold">{inactiveCustomers} ({inactivePercent}%)</span>
                </div>
                <div className="w-full h-2.5 bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all duration-500"
                    style={{ width: `${inactivePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enterprise-card glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Customer Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Total Revenue from Customers</span>
                <span className="text-sm font-bold">Rs. {Number(stats.totalRevenue).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Pending Invoices</span>
                <span className="text-sm font-bold">{stats.pendingInvoices}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Outstanding Due</span>
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">Rs. {Number(stats.overdueAmount).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Open Support Tickets</span>
                <span className="text-sm font-bold">{stats.openTickets}</span>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/customers">
                <Button size="sm" className="w-full text-xs" data-testid="button-view-all-customers">
                  View All Customers
                  <ArrowUpRight className="h-3 w-3 ml-1.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RevenueTab({
  stats,
  statsLoading,
  revenueData,
  revenueLoading,
}: {
  stats?: DashboardStats;
  statsLoading: boolean;
  revenueData?: RevenueData[];
  revenueLoading: boolean;
}) {
  return (
    <div className="space-y-5">
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[100px] rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="enterprise-card glass-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Billed</p>
                  <p className="text-xl font-bold" data-testid="text-total-billed">Rs. {Number(stats.totalRevenue).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="enterprise-card glass-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Collected</p>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300" data-testid="text-collected-amount">Rs. {Number(stats.collectedAmount).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="enterprise-card glass-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Overdue Amount</p>
                  <p className="text-xl font-bold text-orange-700 dark:text-orange-300" data-testid="text-overdue-amount">Rs. {Number(stats.overdueAmount).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="enterprise-card glass-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Pending Invoices</p>
                  <p className="text-xl font-bold" data-testid="text-pending-invoices">{stats.pendingInvoices}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {revenueLoading ? (
        <Card className="enterprise-card glass-card">
          <CardContent className="p-5">
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </CardContent>
        </Card>
      ) : revenueData ? (
        <Card className="enterprise-card glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-semibold">Revenue Overview</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly billing, collections & dues</p>
            </div>
            <div className="flex items-center gap-3">
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
            <div className="h-[400px]" data-testid="chart-revenue-enlarged">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="billedGradLg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="collectedGradLg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "10px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, undefined]}
                  />
                  <Bar dataKey="billed" fill="url(#billedGradLg)" radius={[4, 4, 0, 0]} barSize={28} />
                  <Bar dataKey="collected" fill="url(#collectedGradLg)" radius={[4, 4, 0, 0]} barSize={28} />
                  <Line type="monotone" dataKey="dues" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "white" }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="enterprise-card glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Collection Rate</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const totalRev = Number(stats.totalRevenue);
                const collected = Number(stats.collectedAmount);
                const rate = totalRev > 0 ? Math.round((collected / totalRev) * 100) : 0;
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold" data-testid="text-collection-rate">{rate}%</span>
                      <Badge variant="secondary" className="no-default-active-elevate text-xs">
                        {rate >= 80 ? "Healthy" : rate >= 50 ? "Average" : "Needs Attention"}
                      </Badge>
                    </div>
                    <div className="w-full h-3 bg-muted/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Rs. {collected.toLocaleString()} collected out of Rs. {totalRev.toLocaleString()} billed
                    </p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
          <Card className="enterprise-card glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Revenue Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                  <span className="text-sm font-bold">Rs. {Number(stats.totalRevenue).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Collected</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Rs. {Number(stats.collectedAmount).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Overdue</span>
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">Rs. {Number(stats.overdueAmount).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Pending Invoices</span>
                  <span className="text-sm font-bold">{stats.pendingInvoices}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function QuickActionsTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href}>
              <Card className="enterprise-card glass-card hover-elevate cursor-pointer transition-all duration-200 h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} ${action.darkGradient} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" data-testid={`text-action-${action.label.toLowerCase().replace(/\s+/g, "-")}`}>{action.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [tab, changeTab] = useTab("overview");

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery<(Invoice & { customerName?: string })[]>({
    queryKey: ["/api/dashboard/recent-invoices"],
  });

  const { data: recentTickets, isLoading: ticketsLoading } = useQuery<(Ticket & { customerName?: string })[]>({
    queryKey: ["/api/dashboard/recent-tickets"],
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery<RevenueData[]>({
    queryKey: ["/api/dashboard/revenue-overview"],
  });

  const { data: ticketBreakdown, isLoading: ticketBDLoading } = useQuery<TicketBreakdown>({
    queryKey: ["/api/dashboard/ticket-breakdown"],
  });

  const { data: techPerformance, isLoading: techLoading } = useQuery<TechPerformance[]>({
    queryKey: ["/api/dashboard/technician-performance"],
  });

  const SkeletonCard = ({ h = "h-48" }: { h?: string }) => (
    <Card className="enterprise-card glass-card">
      <CardContent className="p-5">
        <Skeleton className={`${h} w-full rounded-lg`} />
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto page-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Overview of your ISP operations</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/customers">
            <Button size="sm" className="btn-gradient rounded-lg h-9 text-xs" data-testid="button-add-customer">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Customer
            </Button>
          </Link>
          <Link href="/invoices">
            <Button size="sm" variant="secondary" className="rounded-lg h-9 text-xs font-medium" data-testid="button-generate-invoice">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Generate Invoice
            </Button>
          </Link>
        </div>
      </div>

      {tab === "overview" && (
        <div className="mt-5">
          {statsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[110px] rounded-2xl" />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STAT_CARDS.map((card) => (
                <GradientStatCard key={card.key} config={card} stats={stats} />
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mt-5">
            <div className="lg:col-span-3">
              {revenueLoading ? <SkeletonCard h="h-[300px]" /> : revenueData ? <RevenueChart data={revenueData} /> : null}
            </div>
            <div className="lg:col-span-2 space-y-5">
              {ticketBDLoading ? <SkeletonCard h="h-[120px]" /> : ticketBreakdown ? <TicketStatusCards data={ticketBreakdown} /> : null}
              {ticketBDLoading ? <SkeletonCard h="h-[140px]" /> : ticketBreakdown ? <TicketDonutChart data={ticketBreakdown} /> : null}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mt-5">
            <div className="lg:col-span-3">
              {invoicesLoading ? <SkeletonCard h="h-[240px]" /> : <RecentInvoices invoices={recentInvoices || []} />}
            </div>
            <div className="lg:col-span-2">
              {techLoading ? <SkeletonCard h="h-[240px]" /> : <TechnicianPerformance data={techPerformance || []} />}
            </div>
          </div>

          <div className="grid grid-cols-1 mt-5">
            {ticketsLoading ? <SkeletonCard h="h-[240px]" /> : <RecentTickets tickets={recentTickets || []} />}
          </div>
        </div>
      )}

      {tab === "customers" && (
        <div className="mt-5">
          <CustomersTab stats={stats} statsLoading={statsLoading} />
        </div>
      )}

      {tab === "revenue" && (
        <div className="mt-5">
          <RevenueTab stats={stats} statsLoading={statsLoading} revenueData={revenueData} revenueLoading={revenueLoading} />
        </div>
      )}

      {tab === "quick-actions" && (
        <div className="mt-5">
          <QuickActionsTab />
        </div>
      )}
    </div>
  );
}
