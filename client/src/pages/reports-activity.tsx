import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Shield,
  AlertTriangle,
  Lock,
  Users,
  Layers,
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

interface ActivityStats {
  totalActivities: number;
  totalAudits: number;
  criticalActions: number;
  failedLogins: number;
  byUser: { name: string; value: number }[];
  byModule: { name: string; value: number }[];
  byAction: { name: string; value: number }[];
}

export default function ReportsActivityPage() {
  const { data, isLoading } = useQuery<ActivityStats>({
    queryKey: ["/api/reports/activity-stats"],
  });

  const stats = data || {
    totalActivities: 0,
    totalAudits: 0,
    criticalActions: 0,
    failedLogins: 0,
    byUser: [],
    byModule: [],
    byAction: [],
  };

  const kpiCards = [
    { title: "Total Activities", value: String(stats.totalActivities), icon: Activity, color: "text-blue-600 dark:text-blue-400" },
    { title: "Audit Entries", value: String(stats.totalAudits), icon: Shield, color: "text-purple-600 dark:text-purple-400" },
    { title: "Critical Actions", value: String(stats.criticalActions), icon: AlertTriangle, color: "text-red-600 dark:text-red-400" },
    { title: "Failed Logins", value: String(stats.failedLogins), icon: Lock, color: "text-amber-600 dark:text-amber-400" },
  ];

  const maxModuleValue = Math.max(...stats.byModule.map((d) => d.value), 1);
  const maxActionValue = Math.max(...stats.byAction.map((d) => d.value), 1);

  const handleExportCsv = () => {
    const rows = [["Category", "Name", "Count"]];
    stats.byUser.forEach((d) => rows.push(["User", d.name, String(d.value)]));
    stats.byModule.forEach((d) => rows.push(["Module", d.name, String(d.value)]));
    stats.byAction.forEach((d) => rows.push(["Action", d.name, String(d.value)]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "activity-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-activity-reports-title">Activity Log Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">User activity, audit trails and security insights</p>
        </div>
        <Button variant="outline" onClick={handleExportCsv} data-testid="button-export-activity-csv">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
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

      <Tabs defaultValue="modules" data-testid="tabs-activity-reports">
        <TabsList>
          <TabsTrigger value="modules" data-testid="tab-modules">By Module</TabsTrigger>
          <TabsTrigger value="actions" data-testid="tab-actions">By Action</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">Top Users</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4 mt-4">
          <Card data-testid="card-module-breakdown">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Activity by Module</span>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : stats.byModule.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No module data available</p>
              ) : (
                <div className="space-y-3" data-testid="chart-module-breakdown">
                  {stats.byModule
                    .sort((a, b) => b.value - a.value)
                    .map((d) => {
                      const widthPct = (d.value / maxModuleValue) * 100;
                      return (
                        <div key={d.name} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-28 shrink-0 truncate text-right" title={d.name}>{d.name}</span>
                          <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-sm bg-blue-500 dark:bg-blue-400 transition-all"
                              style={{ width: `${Math.max(widthPct, 2)}%` }}
                              data-testid={`bar-module-${d.name}`}
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

        <TabsContent value="actions" className="space-y-4 mt-4">
          <Card data-testid="card-action-breakdown">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Activity by Action Type</span>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : stats.byAction.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No action data available</p>
              ) : (
                <div className="space-y-3" data-testid="chart-action-breakdown">
                  {stats.byAction
                    .sort((a, b) => b.value - a.value)
                    .map((d) => {
                      const widthPct = (d.value / maxActionValue) * 100;
                      return (
                        <div key={d.name} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-28 shrink-0 truncate text-right" title={d.name}>{d.name}</span>
                          <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-sm bg-teal-500 dark:bg-teal-400 transition-all"
                              style={{ width: `${Math.max(widthPct, 2)}%` }}
                              data-testid={`bar-action-${d.name}`}
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

        <TabsContent value="users" className="space-y-4 mt-4">
          <Card data-testid="card-top-users">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">Most Active Users</span>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : stats.byUser.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No user data available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.byUser
                      .sort((a, b) => b.value - a.value)
                      .map((d) => (
                        <TableRow key={d.name} data-testid={`row-user-${d.name}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {d.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{d.value}</TableCell>
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
