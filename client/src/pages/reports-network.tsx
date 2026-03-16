import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Server,
  Radio,
  Smartphone,
  Wifi,
  Globe,
  Cable,
  Download,
  ArrowLeft,
  Signal,
  Activity,
} from "lucide-react";
import { Link } from "wouter";

interface NetworkStats {
  totalOlts: number;
  totalSplitters: number;
  totalOnus: number;
  totalP2p: number;
  totalFiber: number;
  totalPon: number;
  usedPon: number;
  ponUtilization: string;
  onuOnline: number;
  onuOffline: number;
  onuLowSignal: number;
  totalIps: number;
  assignedIps: number;
  freeIps: number;
  totalSubnets: number;
  fiberTotalKm: string;
  oltUtilization: { name: string; oltId: string; total: number; used: number; pct: string }[];
  splitterUtil: { name: string; splitterId: string; ratio: string; used: number }[];
  p2pStatus: { name: string; value: number }[];
}

function getSplitTotal(ratio: string): number {
  const parts = ratio.split(":");
  return parseInt(parts[1] || "8");
}

export default function ReportsNetworkPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");

  const { data: stats, isLoading } = useQuery<NetworkStats>({
    queryKey: ["/api/reports/network-stats"],
  });

  const kpiCards = useMemo(() => {
    if (!stats) return [];
    return [
      { title: "OLT Devices", value: stats.totalOlts, icon: Server, color: "text-emerald-600 dark:text-emerald-400" },
      { title: "PON Utilization", value: `${stats.ponUtilization}%`, icon: Activity, color: "text-blue-600 dark:text-blue-400" },
      { title: "ONUs Online", value: stats.onuOnline, icon: Smartphone, color: "text-green-600 dark:text-green-400" },
      { title: "ONUs Offline", value: stats.onuOffline, icon: Smartphone, color: "text-red-600 dark:text-red-400" },
      { title: "IP Usage", value: `${stats.assignedIps}/${stats.totalIps}`, icon: Globe, color: "text-indigo-600 dark:text-indigo-400" },
      { title: "P2P Links", value: stats.totalP2p, icon: Wifi, color: "text-amber-600 dark:text-amber-400" },
      { title: "Fiber Routes", value: stats.totalFiber, icon: Cable, color: "text-purple-600 dark:text-purple-400" },
      { title: "Fiber Length", value: `${stats.fiberTotalKm} km`, icon: Signal, color: "text-teal-600 dark:text-teal-400" },
    ];
  }, [stats]);

  const filteredOlts = useMemo(() => {
    if (!stats) return [];
    let items = stats.oltUtilization;
    if (statusFilter === "high") items = items.filter(o => parseFloat(o.pct) >= 80);
    else if (statusFilter === "medium") items = items.filter(o => parseFloat(o.pct) >= 50 && parseFloat(o.pct) < 80);
    else if (statusFilter === "low") items = items.filter(o => parseFloat(o.pct) < 50);
    return items;
  }, [stats, statusFilter]);

  const filteredSplitters = useMemo(() => {
    if (!stats) return [];
    return stats.splitterUtil;
  }, [stats]);

  const filteredP2p = useMemo(() => {
    if (!stats) return [];
    if (deviceFilter === "all") return stats.p2pStatus;
    return stats.p2pStatus.filter(p => p.name === deviceFilter);
  }, [stats, deviceFilter]);

  const maxOltPct = useMemo(() => {
    if (!stats?.oltUtilization.length) return 1;
    return Math.max(...stats.oltUtilization.map(o => parseFloat(o.pct)), 1);
  }, [stats]);

  function exportCSV(type: string) {
    if (!stats) return;
    let csvContent = "";
    let filename = "";

    if (type === "olt") {
      csvContent = "Name,OLT ID,Total PON Ports,Used PON Ports,Utilization %\n";
      stats.oltUtilization.forEach(o => {
        csvContent += `${o.name},${o.oltId},${o.total},${o.used},${o.pct}%\n`;
      });
      filename = "olt_utilization_report.csv";
    } else if (type === "splitter") {
      csvContent = "Name,Splitter ID,Split Ratio,Used Ports,Total Ports,Utilization %\n";
      stats.splitterUtil.forEach(s => {
        const total = getSplitTotal(s.ratio);
        const pct = total > 0 ? ((s.used / total) * 100).toFixed(1) : "0";
        csvContent += `${s.name},${s.splitterId},${s.ratio},${s.used},${total},${pct}%\n`;
      });
      filename = "splitter_usage_report.csv";
    } else if (type === "p2p") {
      csvContent = "Status,Count\n";
      stats.p2pStatus.forEach(p => {
        csvContent += `${p.name},${p.value}\n`;
      });
      filename = "p2p_link_status_report.csv";
    } else if (type === "summary") {
      csvContent = "Metric,Value\n";
      csvContent += `Total OLTs,${stats.totalOlts}\n`;
      csvContent += `PON Utilization,${stats.ponUtilization}%\n`;
      csvContent += `Total ONUs,${stats.totalOnus}\n`;
      csvContent += `ONUs Online,${stats.onuOnline}\n`;
      csvContent += `ONUs Offline,${stats.onuOffline}\n`;
      csvContent += `ONUs Low Signal,${stats.onuLowSignal}\n`;
      csvContent += `Total IPs,${stats.totalIps}\n`;
      csvContent += `Assigned IPs,${stats.assignedIps}\n`;
      csvContent += `Free IPs,${stats.freeIps}\n`;
      csvContent += `P2P Links,${stats.totalP2p}\n`;
      csvContent += `Fiber Routes,${stats.totalFiber}\n`;
      csvContent += `Fiber Total (km),${stats.fiberTotalKm}\n`;
      csvContent += `Total Subnets,${stats.totalSubnets}\n`;
      csvContent += `Total Splitters,${stats.totalSplitters}\n`;
      filename = "network_summary_report.csv";
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const onuStatusData = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Online", value: stats.onuOnline, color: "bg-green-500 dark:bg-green-400" },
      { label: "Offline", value: stats.onuOffline, color: "bg-red-500 dark:bg-red-400" },
      { label: "Low Signal", value: stats.onuLowSignal, color: "bg-yellow-500 dark:bg-yellow-400" },
    ];
  }, [stats]);

  const totalOnu = (stats?.onuOnline || 0) + (stats?.onuOffline || 0) + (stats?.onuLowSignal || 0);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto" data-testid="page-reports-network">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="ghost" size="icon" data-testid="button-back-reports">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-network-reports-title">
              Network & IPAM Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Infrastructure utilization, device status, and IP management analytics
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => exportCSV("summary")} data-testid="button-export-summary">
          <Download className="w-4 h-4 mr-1" /> Export Summary
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-7 w-12" />
                </CardContent>
              </Card>
            ))
          : kpiCards.map((card) => (
              <Card key={card.title} data-testid={`card-kpi-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs text-muted-foreground truncate">{card.title}</span>
                    <card.icon className={`h-3.5 w-3.5 shrink-0 ${card.color}`} />
                  </div>
                  <div className="text-xl font-bold" data-testid={`text-kpi-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    {card.value}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <Tabs defaultValue="overview" data-testid="tabs-network-reports">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="olt" data-testid="tab-olt">OLT Utilization</TabsTrigger>
          <TabsTrigger value="splitter" data-testid="tab-splitter">Splitter Usage</TabsTrigger>
          <TabsTrigger value="p2p" data-testid="tab-p2p">P2P Links</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-port-utilization-chart">
              <CardHeader className="pb-3">
                <span className="text-base font-semibold">OLT Port Utilization</span>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : stats?.oltUtilization.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No OLT data available</p>
                ) : (
                  <div className="space-y-3" data-testid="chart-olt-utilization">
                    {stats?.oltUtilization.map((olt) => {
                      const pct = parseFloat(olt.pct);
                      const barColor = pct >= 80 ? "bg-red-500 dark:bg-red-400" : pct >= 50 ? "bg-amber-500 dark:bg-amber-400" : "bg-green-500 dark:bg-green-400";
                      return (
                        <div key={olt.oltId} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-24 shrink-0 truncate text-right" title={olt.name}>
                            {olt.name}
                          </span>
                          <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-sm transition-all ${barColor}`}
                              style={{ width: `${Math.max(pct, 2)}%` }}
                              data-testid={`bar-olt-${olt.oltId}`}
                            />
                          </div>
                          <span className="text-xs font-medium w-14 shrink-0">
                            {olt.used}/{olt.total}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-onu-status-chart">
              <CardHeader className="pb-3">
                <span className="text-base font-semibold">ONU Status Distribution</span>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : totalOnu === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No ONU data available</p>
                ) : (
                  <div data-testid="chart-onu-status">
                    <div className="flex h-8 rounded-sm overflow-hidden mb-4">
                      {onuStatusData.map((seg) =>
                        seg.value > 0 ? (
                          <div
                            key={seg.label}
                            className={`${seg.color} transition-all`}
                            style={{ width: `${(seg.value / totalOnu) * 100}%` }}
                            data-testid={`segment-onu-${seg.label.toLowerCase().replace(/\s+/g, "-")}`}
                          />
                        ) : null
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                      {onuStatusData.map((seg) => (
                        <div key={seg.label} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-sm ${seg.color}`} />
                          <span className="text-sm text-muted-foreground">{seg.label}</span>
                          <span className="text-sm font-semibold" data-testid={`text-onu-${seg.label.toLowerCase().replace(/\s+/g, "-")}`}>
                            {seg.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                      <span className="text-sm text-muted-foreground">Total ONUs: </span>
                      <span className="text-sm font-semibold" data-testid="text-total-onus">{totalOnu}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-network-status-chart">
              <CardHeader className="pb-3">
                <span className="text-base font-semibold">P2P Link Status Distribution</span>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : stats?.p2pStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No P2P link data available</p>
                ) : (
                  <div className="space-y-3" data-testid="chart-p2p-status">
                    {stats?.p2pStatus.map((item) => {
                      const total = stats.p2pStatus.reduce((s, p) => s + p.value, 0);
                      const pct = total > 0 ? (item.value / total) * 100 : 0;
                      const color =
                        item.name === "active" ? "bg-green-500 dark:bg-green-400" :
                        item.name === "down" ? "bg-red-500 dark:bg-red-400" :
                        item.name === "maintenance" ? "bg-orange-500 dark:bg-orange-400" :
                        "bg-blue-500 dark:bg-blue-400";
                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-24 shrink-0 truncate text-right capitalize">
                            {item.name}
                          </span>
                          <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-sm transition-all ${color}`}
                              style={{ width: `${Math.max(pct, 2)}%` }}
                              data-testid={`bar-p2p-${item.name}`}
                            />
                          </div>
                          <span className="text-xs font-medium w-12 shrink-0">
                            {item.value} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-ip-usage-chart">
              <CardHeader className="pb-3">
                <span className="text-base font-semibold">IP Address Usage</span>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (stats?.totalIps || 0) === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No IP data available</p>
                ) : (
                  <div data-testid="chart-ip-usage">
                    <div className="flex h-8 rounded-sm overflow-hidden mb-4">
                      {(stats?.assignedIps || 0) > 0 && (
                        <div
                          className="bg-blue-500 dark:bg-blue-400 transition-all"
                          style={{ width: `${((stats?.assignedIps || 0) / (stats?.totalIps || 1)) * 100}%` }}
                          data-testid="segment-ip-assigned"
                        />
                      )}
                      {(stats?.freeIps || 0) > 0 && (
                        <div
                          className="bg-muted transition-all"
                          style={{ width: `${((stats?.freeIps || 0) / (stats?.totalIps || 1)) * 100}%` }}
                          data-testid="segment-ip-free"
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-blue-500 dark:bg-blue-400" />
                        <span className="text-sm text-muted-foreground">Assigned</span>
                        <span className="text-sm font-semibold" data-testid="text-ip-assigned">{stats?.assignedIps}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-muted border" />
                        <span className="text-sm text-muted-foreground">Free</span>
                        <span className="text-sm font-semibold" data-testid="text-ip-free">{stats?.freeIps}</span>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      Subnets: <span className="font-semibold" data-testid="text-subnets">{stats?.totalSubnets}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="olt" className="space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-olt-status-filter">
                  <SelectValue placeholder="Filter by usage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Utilization</SelectItem>
                  <SelectItem value="high">High (80%+)</SelectItem>
                  <SelectItem value="medium">Medium (50-80%)</SelectItem>
                  <SelectItem value="low">Low (&lt;50%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => exportCSV("olt")} data-testid="button-export-olt">
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          </div>

          <Card data-testid="card-olt-table">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6">
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : filteredOlts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No OLT devices match the filter</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>OLT Name</TableHead>
                      <TableHead>OLT ID</TableHead>
                      <TableHead>Total PON Ports</TableHead>
                      <TableHead>Used PON Ports</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOlts.map((olt) => {
                      const pct = parseFloat(olt.pct);
                      return (
                        <TableRow key={olt.oltId} data-testid={`row-olt-${olt.oltId}`}>
                          <TableCell className="font-medium" data-testid={`text-olt-name-${olt.oltId}`}>{olt.name}</TableCell>
                          <TableCell data-testid={`text-olt-id-${olt.oltId}`}>{olt.oltId}</TableCell>
                          <TableCell>{olt.total}</TableCell>
                          <TableCell>{olt.used}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 rounded-sm bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-sm ${pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-amber-500" : "bg-green-500"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">{olt.pct}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={pct >= 80 ? "border-red-200 text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-400 dark:border-red-800" : pct >= 50 ? "border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800" : "border-green-200 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-400 dark:border-green-800"}
                              data-testid={`badge-olt-status-${olt.oltId}`}
                            >
                              {pct >= 80 ? "High" : pct >= 50 ? "Medium" : "Low"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="splitter" className="space-y-4 mt-4">
          <div className="flex items-center justify-end">
            <Button variant="outline" onClick={() => exportCSV("splitter")} data-testid="button-export-splitter">
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          </div>

          <Card data-testid="card-splitter-table">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6">
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : filteredSplitters.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No splitter data available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Splitter Name</TableHead>
                      <TableHead>Splitter ID</TableHead>
                      <TableHead>Split Ratio</TableHead>
                      <TableHead>Used Ports</TableHead>
                      <TableHead>Total Ports</TableHead>
                      <TableHead>Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSplitters.map((spl) => {
                      const total = getSplitTotal(spl.ratio);
                      const pct = total > 0 ? (spl.used / total) * 100 : 0;
                      return (
                        <TableRow key={spl.splitterId} data-testid={`row-splitter-${spl.splitterId}`}>
                          <TableCell className="font-medium" data-testid={`text-splitter-name-${spl.splitterId}`}>{spl.name}</TableCell>
                          <TableCell data-testid={`text-splitter-id-${spl.splitterId}`}>{spl.splitterId}</TableCell>
                          <TableCell>{spl.ratio}</TableCell>
                          <TableCell>{spl.used}</TableCell>
                          <TableCell>{total}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 rounded-sm bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-sm ${pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-amber-500" : "bg-green-500"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">{pct.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="p2p" className="space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Select value={deviceFilter} onValueChange={setDeviceFilter}>
              <SelectTrigger className="w-40" data-testid="select-p2p-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="down">Down</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => exportCSV("p2p")} data-testid="button-export-p2p">
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          </div>

          <Card data-testid="card-p2p-table">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6">
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : filteredP2p.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No P2P link data available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Visual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredP2p.map((item) => {
                      const total = stats?.p2pStatus.reduce((s, p) => s + p.value, 0) || 1;
                      const pct = (item.value / total) * 100;
                      const color =
                        item.name === "active" ? "bg-green-500" :
                        item.name === "down" ? "bg-red-500" :
                        item.name === "maintenance" ? "bg-orange-500" :
                        "bg-blue-500";
                      return (
                        <TableRow key={item.name} data-testid={`row-p2p-${item.name}`}>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="capitalize"
                              data-testid={`badge-p2p-${item.name}`}
                            >
                              {item.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium" data-testid={`text-p2p-count-${item.name}`}>{item.value}</TableCell>
                          <TableCell>{pct.toFixed(1)}%</TableCell>
                          <TableCell>
                            <div className="w-32 h-2 rounded-sm bg-muted overflow-hidden">
                              <div className={`h-full rounded-sm ${color}`} style={{ width: `${pct}%` }} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
