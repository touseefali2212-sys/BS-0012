import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, UserCheck, UserX, UserPlus, TrendingDown, Download, Search, Filter,
  ArrowLeft,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, Legend,
} from "recharts";
import { Link } from "wouter";

interface CustomerStats {
  total: number;
  active: number;
  suspended: number;
  disconnected: number;
  thisMonth: number;
  churnRate: string;
  byArea: { name: string; value: number }[];
  byPlan: { name: string; value: number }[];
  byType: { name: string; value: number }[];
  growth: { month: string; count: number }[];
  overdue: number;
}

const PIE_COLORS = [
  "#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#06B6D4", "#EC4899", "#14B8A6", "#F97316", "#6366F1",
  "#84CC16", "#D946EF",
];

export default function ReportsCustomersPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");

  const { data: stats, isLoading } = useQuery<CustomerStats>({
    queryKey: ["/api/reports/customer-stats"],
  });

  const kpiCards = useMemo(() => {
    if (!stats) return [];
    return [
      { title: "Active Customers", value: stats.active, icon: UserCheck, color: "text-green-600 dark:text-green-400" },
      { title: "Suspended", value: stats.suspended, icon: UserX, color: "text-amber-600 dark:text-amber-400" },
      { title: "New This Month", value: stats.thisMonth, icon: UserPlus, color: "text-blue-600 dark:text-blue-400" },
      { title: "Churn Rate", value: `${stats.churnRate}%`, icon: TrendingDown, color: "text-red-600 dark:text-red-400" },
    ];
  }, [stats]);

  const filteredByArea = useMemo(() => {
    if (!stats) return [];
    return areaFilter === "all"
      ? stats.byArea
      : stats.byArea.filter(a => a.name === areaFilter);
  }, [stats, areaFilter]);

  const uniqueAreas = useMemo(() => {
    if (!stats) return [];
    return stats.byArea.map(a => a.name);
  }, [stats]);

  function exportCSV() {
    if (!stats) return;
    let csv = "Metric,Value\n";
    csv += `Total Customers,${stats.total}\n`;
    csv += `Active,${stats.active}\n`;
    csv += `Suspended,${stats.suspended}\n`;
    csv += `Disconnected,${stats.disconnected}\n`;
    csv += `New This Month,${stats.thisMonth}\n`;
    csv += `Churn Rate,${stats.churnRate}%\n`;
    csv += `Overdue,${stats.overdue}\n\n`;
    csv += "Area,Count\n";
    stats.byArea.forEach(a => { csv += `${a.name},${a.value}\n`; });
    csv += "\nPlan,Count\n";
    stats.byPlan.forEach(p => { csv += `${p.name},${p.value}\n`; });
    csv += "\nMonth,New Customers\n";
    stats.growth.forEach(g => { csv += `${g.month},${g.count}\n`; });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customer_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    window.print();
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto" data-testid="page-reports-customers">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="ghost" size="icon" data-testid="button-back-reports">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Customer Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Customer analytics, growth trends and distribution</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={exportCSV} data-testid="button-export-csv">
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" onClick={exportPDF} data-testid="button-export-pdf">
            <Download className="w-4 h-4 mr-1" /> PDF
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
              <div className="text-2xl font-bold" data-testid={`text-kpi-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 w-56"
            data-testid="input-search-customers"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="disconnected">Disconnected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-40" data-testid="select-area-filter">
            <SelectValue placeholder="Area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {uniqueAreas.map(a => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-customer-reports">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="growth" data-testid="tab-growth">Growth Trend</TabsTrigger>
          <TabsTrigger value="area" data-testid="tab-area">Area Distribution</TabsTrigger>
          <TabsTrigger value="plan" data-testid="tab-plan">Plan Distribution</TabsTrigger>
          <TabsTrigger value="churn" data-testid="tab-churn">Churn</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-growth-chart">
              <CardHeader className="pb-3">
                <span className="text-base font-semibold">Customer Growth (12 Months)</span>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={stats?.growth || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} name="New Customers" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card data-testid="card-area-pie">
              <CardHeader className="pb-3">
                <span className="text-base font-semibold">Area Distribution</span>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={stats?.byArea || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {(stats?.byArea || []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-status-summary">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Status Summary</span>
            </CardHeader>
            <CardContent>
              <div className="flex h-8 rounded-sm overflow-hidden mb-4">
                {stats && stats.total > 0 && (
                  <>
                    {stats.active > 0 && (
                      <div
                        className="bg-green-500 dark:bg-green-400 transition-all"
                        style={{ width: `${(stats.active / stats.total) * 100}%` }}
                        data-testid="segment-active"
                      />
                    )}
                    {stats.suspended > 0 && (
                      <div
                        className="bg-amber-500 dark:bg-amber-400 transition-all"
                        style={{ width: `${(stats.suspended / stats.total) * 100}%` }}
                        data-testid="segment-suspended"
                      />
                    )}
                    {stats.disconnected > 0 && (
                      <div
                        className="bg-red-500 dark:bg-red-400 transition-all"
                        style={{ width: `${(stats.disconnected / stats.total) * 100}%` }}
                        data-testid="segment-disconnected"
                      />
                    )}
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-400" />
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="text-sm font-semibold" data-testid="text-active-count">{stats?.active || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-amber-500 dark:bg-amber-400" />
                  <span className="text-sm text-muted-foreground">Suspended</span>
                  <span className="text-sm font-semibold" data-testid="text-suspended-count">{stats?.suspended || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-red-500 dark:bg-red-400" />
                  <span className="text-sm text-muted-foreground">Disconnected</span>
                  <span className="text-sm font-semibold" data-testid="text-disconnected-count">{stats?.disconnected || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="mt-4">
          <Card data-testid="card-growth-detail">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Customer Growth Trend (Last 12 Months)</span>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stats?.growth || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} name="New Customers" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="mt-4" data-testid="card-growth-table">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Monthly Breakdown</span>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">New Customers</TableHead>
                    <TableHead className="text-right">Cumulative</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats?.growth || []).reduce<{ month: string; count: number; cumulative: number }[]>((acc, g) => {
                    const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
                    acc.push({ ...g, cumulative: prev + g.count });
                    return acc;
                  }, []).map((row, i) => (
                    <TableRow key={i} data-testid={`row-growth-${i}`}>
                      <TableCell className="font-medium">{row.month}</TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                      <TableCell className="text-right">{row.cumulative}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="area" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-area-pie-detail">
              <CardHeader className="pb-3">
                <span className="text-base font-semibold">Customers by Area</span>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={filteredByArea}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {filteredByArea.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card data-testid="card-area-bar">
              <CardHeader className="pb-3">
                <span className="text-base font-semibold">Area-wise Count</span>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredByArea} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} className="text-muted-foreground" />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} name="Customers" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4" data-testid="card-area-table">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Area Details</span>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area</TableHead>
                    <TableHead className="text-right">Customers</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredByArea.map((area, i) => (
                    <TableRow key={i} data-testid={`row-area-${i}`}>
                      <TableCell className="font-medium">{area.name}</TableCell>
                      <TableCell className="text-right">{area.value}</TableCell>
                      <TableCell className="text-right">
                        {stats && stats.total > 0 ? ((area.value / stats.total) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-plan-bar">
              <CardHeader className="pb-3">
                <span className="text-base font-semibold">Customers by Plan</span>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.byPlan || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Customers" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card data-testid="card-plan-pie">
              <CardHeader className="pb-3">
                <span className="text-base font-semibold">Plan Distribution</span>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.byPlan || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {(stats?.byPlan || []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4" data-testid="card-plan-table">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Plan Details</span>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Subscribers</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats?.byPlan || []).sort((a, b) => b.value - a.value).map((plan, i) => (
                    <TableRow key={i} data-testid={`row-plan-${i}`}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell className="text-right">{plan.value}</TableCell>
                      <TableCell className="text-right">
                        {stats && stats.total > 0 ? ((plan.value / stats.total) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="churn" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card data-testid="card-churn-rate">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <span className="text-sm font-medium text-muted-foreground">Churn Rate</span>
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-churn-rate">{stats?.churnRate || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">Suspended + Disconnected / Total</p>
              </CardContent>
            </Card>
            <Card data-testid="card-suspended-count">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <span className="text-sm font-medium text-muted-foreground">Suspended</span>
                <UserX className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-suspended-total">{stats?.suspended || 0}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-disconnected-count">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <span className="text-sm font-medium text-muted-foreground">Disconnected</span>
                <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-disconnected-total">{stats?.disconnected || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-churn-pie">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Customer Type Distribution</span>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats?.byType || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {(stats?.byType || []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-testid="card-churn-breakdown">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Status Breakdown</span>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { status: "Active", count: stats?.active || 0, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
                    { status: "Suspended", count: stats?.suspended || 0, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
                    { status: "Disconnected", count: stats?.disconnected || 0, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
                  ].map((row, i) => (
                    <TableRow key={i} data-testid={`row-status-${row.status.toLowerCase()}`}>
                      <TableCell>
                        <Badge variant="outline" className={row.color}>{row.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{row.count}</TableCell>
                      <TableCell className="text-right">
                        {stats && stats.total > 0 ? ((row.count / stats.total) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
