import { useQuery } from "@tanstack/react-query";
import {
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Megaphone,
  Download,
  Mail,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface NotificationStats {
  totalSent: number;
  delivered: number;
  failed: number;
  pending: number;
  campaigns: number;
  byChannel: { name: string; sent: number; delivered: number; failed: number }[];
}

export default function ReportsNotificationsPage() {
  const { data, isLoading } = useQuery<NotificationStats>({
    queryKey: ["/api/reports/notification-stats"],
  });

  const stats = data || {
    totalSent: 0,
    delivered: 0,
    failed: 0,
    pending: 0,
    campaigns: 0,
    byChannel: [],
  };

  const kpiCards = [
    { title: "Total Sent", value: String(stats.totalSent), icon: Send, color: "text-blue-600 dark:text-blue-400" },
    { title: "Delivered", value: String(stats.delivered), icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
    { title: "Failed", value: String(stats.failed), icon: XCircle, color: "text-red-600 dark:text-red-400" },
    { title: "Pending", value: String(stats.pending), icon: Clock, color: "text-amber-600 dark:text-amber-400" },
    { title: "Campaigns", value: String(stats.campaigns), icon: Megaphone, color: "text-purple-600 dark:text-purple-400" },
  ];

  const deliveryRate = stats.totalSent > 0 ? ((stats.delivered / stats.totalSent) * 100).toFixed(1) : "0.0";
  const failureRate = stats.totalSent > 0 ? ((stats.failed / stats.totalSent) * 100).toFixed(1) : "0.0";

  const channelIcon = (name: string) => {
    if (name === "email") return <Mail className="h-4 w-4 text-blue-500" />;
    if (name === "whatsapp") return <MessageSquare className="h-4 w-4 text-green-500" />;
    return <Send className="h-4 w-4 text-teal-500" />;
  };

  const handleExportCsv = () => {
    const rows = [["Channel", "Sent", "Delivered", "Failed"]];
    stats.byChannel.forEach((ch) => rows.push([ch.name, String(ch.sent), String(ch.delivered), String(ch.failed)]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notifications-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-notification-reports-title">Notification Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">SMS, Email &amp; WhatsApp delivery analytics</p>
        </div>
        <Button variant="outline" onClick={handleExportCsv} data-testid="button-export-notifications-csv">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
        <Card data-testid="card-delivery-overview">
          <CardHeader className="pb-3">
            <span className="text-base font-semibold">Delivery Overview</span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-24 shrink-0">Delivery Rate</span>
                  <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-sm bg-green-500 dark:bg-green-400 transition-all"
                      style={{ width: `${deliveryRate}%` }}
                      data-testid="bar-delivery-rate"
                    />
                  </div>
                  <span className="text-sm font-medium w-14 shrink-0">{deliveryRate}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-24 shrink-0">Failure Rate</span>
                  <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-sm bg-red-500 dark:bg-red-400 transition-all"
                      style={{ width: `${failureRate}%` }}
                      data-testid="bar-failure-rate"
                    />
                  </div>
                  <span className="text-sm font-medium w-14 shrink-0">{failureRate}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-channel-breakdown">
          <CardHeader className="pb-3">
            <span className="text-base font-semibold">Channel Breakdown</span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : stats.byChannel.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No channel data available</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Sent</TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.byChannel.map((ch) => (
                    <TableRow key={ch.name} data-testid={`row-channel-${ch.name}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {channelIcon(ch.name)}
                          <span className="capitalize">{ch.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{ch.sent}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="no-default-active-elevate">{ch.delivered}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {ch.failed > 0 ? (
                          <Badge variant="destructive" className="no-default-active-elevate">{ch.failed}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
