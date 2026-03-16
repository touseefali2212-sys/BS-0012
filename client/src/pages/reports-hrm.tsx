import { useQuery } from "@tanstack/react-query";
import {
  Users,
  DollarSign,
  Clock,
  CalendarCheck,
  CalendarX,
  Briefcase,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface HrmStats {
  totalEmployees: number;
  active: number;
  totalSalary: number;
  avgSalary: number;
  byDepartment: { name: string; value: number }[];
  byDesignation: { name: string; value: number }[];
  pendingLeaves: number;
  approvedLeaves: number;
  totalLeaves: number;
  presentToday: number;
  totalAttendance: number;
}

export default function ReportsHrmPage() {
  const { data, isLoading } = useQuery<HrmStats>({
    queryKey: ["/api/reports/hrm-stats"],
  });

  const stats = data || {
    totalEmployees: 0,
    active: 0,
    totalSalary: 0,
    avgSalary: 0,
    byDepartment: [],
    byDesignation: [],
    pendingLeaves: 0,
    approvedLeaves: 0,
    totalLeaves: 0,
    presentToday: 0,
    totalAttendance: 0,
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  const kpiCards = [
    { title: "Total Employees", value: String(stats.totalEmployees), icon: Users, color: "text-blue-600 dark:text-blue-400" },
    { title: "Active Staff", value: String(stats.active), icon: Briefcase, color: "text-green-600 dark:text-green-400" },
    { title: "Total Salary", value: formatCurrency(stats.totalSalary), icon: DollarSign, color: "text-purple-600 dark:text-purple-400" },
    { title: "Average Salary", value: formatCurrency(stats.avgSalary), icon: DollarSign, color: "text-teal-600 dark:text-teal-400" },
    { title: "Present Today", value: String(stats.presentToday), icon: CalendarCheck, color: "text-emerald-600 dark:text-emerald-400" },
    { title: "Pending Leaves", value: String(stats.pendingLeaves), icon: Clock, color: "text-amber-600 dark:text-amber-400" },
  ];

  const maxDeptValue = Math.max(...stats.byDepartment.map((d) => d.value), 1);
  const maxDesigValue = Math.max(...stats.byDesignation.map((d) => d.value), 1);

  const handleExportCsv = () => {
    const rows = [["Category", "Name", "Value"]];
    stats.byDepartment.forEach((d) => rows.push(["Department", d.name, String(d.value)]));
    stats.byDesignation.forEach((d) => rows.push(["Designation", d.name, String(d.value)]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hrm-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-hrm-reports-title">HRM Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Staff attendance, salary, roles and leave analytics</p>
        </div>
        <Button variant="outline" onClick={handleExportCsv} data-testid="button-export-hrm-csv">
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

      <Tabs defaultValue="departments" data-testid="tabs-hrm-reports">
        <TabsList>
          <TabsTrigger value="departments" data-testid="tab-departments">Departments</TabsTrigger>
          <TabsTrigger value="designations" data-testid="tab-designations">Designations</TabsTrigger>
          <TabsTrigger value="leaves" data-testid="tab-leaves">Leave Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-4 mt-4">
          <Card data-testid="card-department-distribution">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Department Distribution</span>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : stats.byDepartment.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No department data available</p>
              ) : (
                <div className="space-y-3" data-testid="chart-department-distribution">
                  {stats.byDepartment.map((d) => {
                    const widthPct = (d.value / maxDeptValue) * 100;
                    return (
                      <div key={d.name} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-28 shrink-0 truncate text-right" title={d.name}>{d.name}</span>
                        <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-sm bg-blue-500 dark:bg-blue-400 transition-all"
                            style={{ width: `${Math.max(widthPct, 2)}%` }}
                            data-testid={`bar-dept-${d.name}`}
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
        </TabsContent>

        <TabsContent value="designations" className="space-y-4 mt-4">
          <Card data-testid="card-designation-distribution">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Role / Designation Distribution</span>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : stats.byDesignation.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No designation data available</p>
              ) : (
                <div className="space-y-3" data-testid="chart-designation-distribution">
                  {stats.byDesignation.map((d) => {
                    const widthPct = (d.value / maxDesigValue) * 100;
                    return (
                      <div key={d.name} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-28 shrink-0 truncate text-right" title={d.name}>{d.name}</span>
                        <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-sm bg-purple-500 dark:bg-purple-400 transition-all"
                            style={{ width: `${Math.max(widthPct, 2)}%` }}
                            data-testid={`bar-desig-${d.name}`}
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
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4 mt-4">
          <Card data-testid="card-leave-summary">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Leave Summary</span>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="flex items-center gap-2">
                        <CalendarCheck className="h-4 w-4 text-green-500" />
                        Approved Leaves
                      </TableCell>
                      <TableCell className="text-right" data-testid="text-approved-leaves">{stats.approvedLeaves}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        Pending Leaves
                      </TableCell>
                      <TableCell className="text-right" data-testid="text-pending-leaves">{stats.pendingLeaves}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="flex items-center gap-2">
                        <CalendarX className="h-4 w-4 text-muted-foreground" />
                        Total Leave Requests
                      </TableCell>
                      <TableCell className="text-right" data-testid="text-total-leaves">{stats.totalLeaves}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        Total Attendance Records
                      </TableCell>
                      <TableCell className="text-right" data-testid="text-total-attendance">{stats.totalAttendance}</TableCell>
                    </TableRow>
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
