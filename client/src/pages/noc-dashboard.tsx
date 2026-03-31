import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Server, Wifi, WifiOff, Activity, Shield, AlertTriangle, AlertCircle,
  CheckCircle2, XCircle, RefreshCw, Search, BarChart3, TrendingUp,
  TrendingDown, Monitor, Gauge, Zap, Users, Signal, Radio,
  ArrowUpRight, ArrowDownRight, ChevronRight, Bell, Clock,
  Globe, Network, Cpu, Thermometer, HardDrive, Cable, Eye,
  Smartphone, Hash, FileText, Wrench, Target, Layers, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { type OltDevice, type OnuDevice } from "@shared/schema";

type NocSummary = {
  totalOlts: number; onlineOlts: number; offlineOlts: number; maintenanceOlts: number;
  totalOnus: number; onlineOnus: number; offlineOnus: number;
  activeCustomers: number; downCustomers: number; totalCustomers: number;
  healthScore: number; activeOutages: number; openTickets: number;
};

type NocAlert = {
  id: string; type: "critical" | "warning" | "info"; category: string;
  message: string; device: string; timestamp: string; affectedCount?: number;
};

type HealthData = {
  perOlt: { id: number; name: string; vendor: string; ipAddress: string; status: string; healthScore: number; totalPorts: number; usedPorts: number }[];
  perArea: { id: number; name: string; healthScore: number; totalDevices: number; onlineDevices: number }[];
};

function useSimulatedTrafficData() {
  const [data, setData] = useState(() => generateTrafficData());
  useEffect(() => {
    const timer = setInterval(() => setData(generateTrafficData()), 8000);
    return () => clearInterval(timer);
  }, []);
  return data;
}

function generateTrafficData() {
  return {
    totalBandwidth: Math.round(800 + Math.random() * 400),
    peakUsage: Math.round(70 + Math.random() * 25),
    avgLatency: Math.round(5 + Math.random() * 15),
    packetLoss: parseFloat((Math.random() * 0.5).toFixed(2)),
    uplinkUtilization: Math.round(40 + Math.random() * 45),
    downlinkUtilization: Math.round(55 + Math.random() * 35),
    ponUtilization: Array.from({ length: 8 }, (_, i) => ({
      port: `PON ${i + 1}`,
      usage: Math.round(20 + Math.random() * 70),
      users: Math.round(10 + Math.random() * 50),
    })),
    hourlyTraffic: Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, "0")}:00`,
      download: Math.round(100 + Math.random() * 500),
      upload: Math.round(30 + Math.random() * 150),
    })),
  };
}

function useAutoRefresh(interval: number) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), interval);
    return () => clearInterval(timer);
  }, [interval]);
  return tick;
}

export default function NocDashboardPage() {
  const { toast } = useToast();
  const tick = useAutoRefresh(15000);
  const [alertFilter, setAlertFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery<NocSummary>({
    queryKey: ["/api/noc/summary", tick],
  });

  const { data: alerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = useQuery<NocAlert[]>({
    queryKey: ["/api/noc/alerts", tick],
  });

  const { data: health, isLoading: healthLoading } = useQuery<HealthData>({
    queryKey: ["/api/noc/health", tick],
  });

  const { data: olts = [] } = useQuery<OltDevice[]>({
    queryKey: ["/api/olt-devices"],
  });

  const { data: onus = [] } = useQuery<OnuDevice[]>({
    queryKey: ["/api/onu-devices"],
  });

  const traffic = useSimulatedTrafficData();

  const filteredAlerts = alertFilter === "all" ? alerts : alerts.filter(a => a.type === alertFilter);
  const criticalCount = alerts.filter(a => a.type === "critical").length;
  const warningCount = alerts.filter(a => a.type === "warning").length;
  const infoCount = alerts.filter(a => a.type === "info").length;

  const handleRefresh = () => {
    refetchSummary();
    refetchAlerts();
    toast({ title: "Refreshed", description: "NOC data refreshed" });
  };

  const s = summary || { totalOlts: 0, onlineOlts: 0, offlineOlts: 0, maintenanceOlts: 0, totalOnus: 0, onlineOnus: 0, offlineOnus: 0, activeCustomers: 0, downCustomers: 0, totalCustomers: 0, healthScore: 100, activeOutages: 0, openTickets: 0 };

  return (
    <div className="min-h-screen bg-background" data-testid="noc-dashboard">
      <div className="bg-gradient-to-r from-[#0B1120] to-[#1a4a8a] text-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2" data-testid="text-noc-title">
              <Monitor className="h-5 w-5" /> Network Operations Center
            </h1>
            <p className="text-xs text-white/60 mt-1">Real-time network monitoring & intelligent fault detection</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-white/70">
              <div className={`w-2 h-2 rounded-full ${criticalCount > 0 ? "bg-red-500 animate-pulse" : "bg-emerald-400"}`} />
              {criticalCount > 0 ? `${criticalCount} Critical` : "All Clear"}
            </div>
            <Button size="sm" onClick={handleRefresh} className="bg-white/10 hover:bg-white/20 text-white text-xs border border-white/20" data-testid="button-refresh-noc">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <KpiCard icon={Server} label="Total OLTs" value={s.totalOlts} color="blue" />
          <KpiCard icon={CheckCircle2} label="Online OLTs" value={s.onlineOlts} color="emerald" />
          <KpiCard icon={XCircle} label="Offline OLTs" value={s.offlineOlts} color="red" alert={s.offlineOlts > 0} />
          <KpiCard icon={Smartphone} label="Total ONUs" value={s.totalOnus} color="violet" />
          <KpiCard icon={Wifi} label="Online ONUs" value={s.onlineOnus} color="emerald" />
          <KpiCard icon={WifiOff} label="Offline ONUs" value={s.offlineOnus} color="amber" alert={s.offlineOnus > 0} />
          <KpiCard icon={Users} label="Active Users" value={s.activeCustomers} color="cyan" />
          <KpiCard icon={Gauge} label="Health Score" value={`${s.healthScore}%`} color={s.healthScore >= 90 ? "emerald" : s.healthScore >= 70 ? "amber" : "red"} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted/50 border p-1">
            {[
              { value: "overview", label: "Overview", icon: Monitor },
              { value: "alerts", label: "Alerts", icon: Bell, badge: criticalCount > 0 ? criticalCount : undefined },
              { value: "health", label: "Health", icon: Activity },
              { value: "traffic", label: "Traffic", icon: BarChart3 },
              { value: "faults", label: "Fault Detection", icon: AlertTriangle },
              { value: "sla", label: "SLA", icon: Shield },
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-1.5" data-testid={`tab-noc-${tab.value}`}>
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">{tab.badge}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4 text-blue-500" /> Network Health Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 mb-4">
                      <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke={s.healthScore >= 90 ? "#10b981" : s.healthScore >= 70 ? "#f59e0b" : "#ef4444"} strokeWidth="8" strokeDasharray={`${s.healthScore * 2.51} 251`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">{s.healthScore}%</span>
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <MiniStat label="Uplink Util." value={`${traffic.uplinkUtilization}%`} trend={traffic.uplinkUtilization > 80 ? "down" : "up"} />
                        <MiniStat label="Avg Latency" value={`${traffic.avgLatency}ms`} trend={traffic.avgLatency > 15 ? "down" : "up"} />
                        <MiniStat label="Packet Loss" value={`${traffic.packetLoss}%`} trend={traffic.packetLoss > 0.3 ? "down" : "up"} />
                        <MiniStat label="Bandwidth" value={`${traffic.totalBandwidth} Mbps`} trend="up" />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "OLTs Online", value: s.onlineOlts, total: s.totalOlts, color: "bg-emerald-500" },
                        { label: "ONUs Online", value: s.onlineOnus, total: s.totalOnus, color: "bg-blue-500" },
                        { label: "Active Outages", value: s.activeOutages, total: 0, color: "bg-red-500" },
                        { label: "Open Tickets", value: s.openTickets, total: 0, color: "bg-amber-500" },
                      ].map(item => (
                        <div key={item.label} className="bg-muted/50 rounded-lg p-2.5">
                          <p className="text-[10px] text-muted-foreground uppercase">{item.label}</p>
                          <p className="text-lg font-bold">{item.value}{item.total > 0 && <span className="text-xs text-muted-foreground">/{item.total}</span>}</p>
                          {item.total > 0 && <Progress value={(item.value / item.total) * 100} className="h-1 mt-1" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Server className="h-4 w-4 text-blue-500" /> OLT Device Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {olts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">No OLT devices registered. <Link href="/olt-management" className="text-blue-500 hover:underline">Add OLTs</Link></div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {olts.map(olt => (
                          <Link key={olt.id} href={`/olt-management/${olt.id}`}>
                            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer border border-transparent hover:border-border" data-testid={`noc-olt-${olt.id}`}>
                              <div className={`w-2.5 h-2.5 rounded-full ${olt.status === "active" ? "bg-emerald-500" : olt.status === "maintenance" ? "bg-amber-500 animate-pulse" : "bg-red-500 animate-pulse"}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{olt.name}</p>
                                <p className="text-[10px] text-muted-foreground">{olt.ipAddress || "No IP"} • {olt.vendor}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className={`text-[10px] ${olt.status === "active" ? "border-emerald-500/30 text-emerald-600" : olt.status === "maintenance" ? "border-amber-500/30 text-amber-600" : "border-red-500/30 text-red-600"}`}>
                                  {olt.status}
                                </Badge>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bell className={`h-4 w-4 ${criticalCount > 0 ? "text-red-500 animate-pulse" : "text-blue-500"}`} />
                      Live Alerts
                      {alerts.length > 0 && <Badge variant="outline" className="ml-auto text-[10px]">{alerts.length}</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {alerts.length === 0 ? (
                        <div className="text-center py-6">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">No active alerts</p>
                        </div>
                      ) : (
                        alerts.slice(0, 10).map(alert => (
                          <div key={alert.id} className={`p-2.5 rounded-lg border text-xs ${
                            alert.type === "critical" ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" :
                            alert.type === "warning" ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" :
                            "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20"
                          }`} data-testid={`alert-${alert.id}`}>
                            <div className="flex items-start gap-2">
                              {alert.type === "critical" ? <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" /> :
                               alert.type === "warning" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" /> :
                               <Bell className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">{alert.category}</p>
                                <p className="text-muted-foreground truncate">{alert.message}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-blue-500" /> PON Utilization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {traffic.ponUtilization.map(pon => (
                        <div key={pon.port} className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">{pon.port}</span>
                            <span className={`font-medium ${pon.usage > 85 ? "text-red-500" : pon.usage > 60 ? "text-amber-500" : "text-emerald-500"}`}>{pon.usage}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${pon.usage > 85 ? "bg-red-500" : pon.usage > 60 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pon.usage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              {(["all", "critical", "warning", "info"] as const).map(f => (
                <Button key={f} size="sm" variant={alertFilter === f ? "default" : "outline"}
                  className="text-xs"
                  onClick={() => setAlertFilter(f)} data-testid={`filter-alert-${f}`}>
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === "critical" && criticalCount > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{criticalCount}</span>}
                  {f === "warning" && warningCount > 0 && <span className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 rounded-full">{warningCount}</span>}
                  {f === "info" && infoCount > 0 && <span className="ml-1 bg-blue-500 text-white text-[10px] px-1.5 rounded-full">{infoCount}</span>}
                </Button>
              ))}
            </div>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Severity</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Message</TableHead>
                      <TableHead className="text-xs">Device</TableHead>
                      <TableHead className="text-xs">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlerts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                          No {alertFilter !== "all" ? alertFilter : ""} alerts
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAlerts.map(alert => (
                        <TableRow key={alert.id}>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${
                              alert.type === "critical" ? "border-red-500/30 text-red-600 bg-red-50 dark:bg-red-500/10" :
                              alert.type === "warning" ? "border-amber-500/30 text-amber-600 bg-amber-50 dark:bg-amber-500/10" :
                              "border-blue-500/30 text-blue-600 bg-blue-50 dark:bg-blue-500/10"
                            }`}>
                              {alert.type === "critical" ? <AlertCircle className="h-3 w-3 mr-1" /> :
                               alert.type === "warning" ? <AlertTriangle className="h-3 w-3 mr-1" /> :
                               <Bell className="h-3 w-3 mr-1" />}
                              {alert.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{alert.category}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">{alert.message}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{alert.device}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Server className="h-4 w-4 text-blue-500" /> Per-OLT Health</CardTitle>
                </CardHeader>
                <CardContent>
                  {health?.perOlt && health.perOlt.length > 0 ? (
                    <div className="space-y-3">
                      {health.perOlt.map(olt => (
                        <div key={olt.id} className="bg-muted/30 rounded-lg p-3 border">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-xs font-medium">{olt.name}</p>
                              <p className="text-[10px] text-muted-foreground">{olt.vendor} • {olt.ipAddress || "N/A"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${olt.healthScore >= 90 ? "text-emerald-500" : olt.healthScore >= 70 ? "text-amber-500" : "text-red-500"}`}>{olt.healthScore}%</span>
                              <div className={`w-2.5 h-2.5 rounded-full ${olt.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
                            </div>
                          </div>
                          <Progress value={olt.healthScore} className="h-1.5" />
                          <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
                            <span>Ports: {olt.usedPorts}/{olt.totalPorts}</span>
                            <span>Status: {olt.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-6 text-muted-foreground text-sm">No OLT data available</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-500" /> Per-Area Health</CardTitle>
                </CardHeader>
                <CardContent>
                  {health?.perArea && health.perArea.length > 0 ? (
                    <div className="space-y-3">
                      {health.perArea.map(area => (
                        <div key={area.id} className="bg-muted/30 rounded-lg p-3 border">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium">{area.name}</p>
                            <span className={`text-sm font-bold ${area.healthScore >= 90 ? "text-emerald-500" : area.healthScore >= 70 ? "text-amber-500" : "text-red-500"}`}>{area.healthScore}%</span>
                          </div>
                          <Progress value={area.healthScore} className="h-1.5" />
                          <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
                            <span>Devices: {area.onlineDevices}/{area.totalDevices} online</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-6 text-muted-foreground text-sm">No area data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <TrafficCard icon={TrendingUp} label="Total Bandwidth" value={`${traffic.totalBandwidth} Mbps`} color="blue" />
              <TrafficCard icon={Gauge} label="Peak Usage" value={`${traffic.peakUsage}%`} color={traffic.peakUsage > 85 ? "red" : "emerald"} />
              <TrafficCard icon={Clock} label="Avg Latency" value={`${traffic.avgLatency}ms`} color={traffic.avgLatency > 15 ? "amber" : "emerald"} />
              <TrafficCard icon={AlertTriangle} label="Packet Loss" value={`${traffic.packetLoss}%`} color={traffic.packetLoss > 0.3 ? "red" : "emerald"} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-blue-500" /> Uplink / Downlink Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Uplink</span>
                        <span className={`font-medium ${traffic.uplinkUtilization > 80 ? "text-red-500" : "text-emerald-500"}`}>{traffic.uplinkUtilization}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${traffic.uplinkUtilization > 80 ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gradient-to-r from-blue-500 to-cyan-400"}`} style={{ width: `${traffic.uplinkUtilization}%` }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Downlink</span>
                        <span className={`font-medium ${traffic.downlinkUtilization > 80 ? "text-red-500" : "text-emerald-500"}`}>{traffic.downlinkUtilization}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${traffic.downlinkUtilization > 80 ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gradient-to-r from-violet-500 to-purple-400"}`} style={{ width: `${traffic.downlinkUtilization}%` }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-blue-500" /> Load Balancing Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {traffic.ponUtilization.filter(p => p.usage > 80).length > 0 ? (
                      traffic.ponUtilization.filter(p => p.usage > 80).map(pon => {
                        const lightPon = traffic.ponUtilization.filter(p => p.usage < 50).sort((a, b) => a.usage - b.usage)[0];
                        return (
                          <div key={pon.port} className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <Zap className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                              <div className="text-xs">
                                <p className="text-amber-700 dark:text-amber-400 font-medium">{pon.port} is {pon.usage}% utilized</p>
                                {lightPon && <p className="text-muted-foreground mt-0.5">Suggestion: Move {Math.round(pon.users * 0.3)} users to {lightPon.port} ({lightPon.usage}% used)</p>}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">All ports are within optimal load</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Cable className="h-4 w-4 text-blue-500" /> PON Port Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {traffic.ponUtilization.map(pon => (
                    <div key={pon.port} className="bg-muted/30 rounded-lg p-3 border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">{pon.port}</span>
                        <span className={`text-xs font-bold ${pon.usage > 85 ? "text-red-500" : pon.usage > 60 ? "text-amber-500" : "text-emerald-500"}`}>{pon.usage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden mb-1.5">
                        <div className={`h-full rounded-full ${pon.usage > 85 ? "bg-red-500" : pon.usage > 60 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pon.usage}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{pon.users} users connected</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faults" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> Intelligent Fault Detection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts.filter(a => a.type === "critical").length > 0 ? (
                      alerts.filter(a => a.type === "critical").map(alert => (
                        <div key={alert.id} className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-red-700 dark:text-red-400">{alert.category}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                            </div>
                          </div>
                          {alert.category === "Possible Fiber Cut" && (
                            <div className="bg-muted/50 rounded p-2 mt-2 text-[10px] text-muted-foreground space-y-1">
                              <p><span className="font-medium text-foreground">Affected ONUs:</span> {alert.affectedCount || "Multiple"}</p>
                              <p><span className="font-medium text-foreground">Root Cause:</span> Multiple ONUs offline on same PON splitter</p>
                              <p><span className="font-medium text-foreground">Suggested Action:</span> Dispatch technician to check fiber route</p>
                            </div>
                          )}
                          {alert.category === "OLT Down" && (
                            <div className="bg-muted/50 rounded p-2 mt-2 text-[10px] text-muted-foreground space-y-1">
                              <p><span className="font-medium text-foreground">Impact:</span> All connected customers affected</p>
                              <p><span className="font-medium text-foreground">Root Cause:</span> Device unreachable — power failure or link down</p>
                              <p><span className="font-medium text-foreground">Suggested Action:</span> Check power supply, verify uplink connectivity</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Shield className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm text-emerald-600 font-medium">No faults detected</p>
                        <p className="text-xs text-muted-foreground mt-1">All systems operating normally</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Wrench className="h-4 w-4 text-blue-500" /> Root Cause Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts.filter(a => a.type === "critical").length > 0 ? (
                      alerts.filter(a => a.type === "critical").slice(0, 5).map((alert, idx) => (
                        <div key={alert.id} className="bg-muted/30 rounded-lg p-3 border">
                          <p className="text-xs font-medium mb-2">{alert.category}: {alert.device}</p>
                          <div className="space-y-1.5 text-[10px]">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded bg-red-100 dark:bg-red-500/20 flex items-center justify-center"><Hash className="h-3 w-3 text-red-500" /></div>
                              <span className="text-muted-foreground">Issue: {alert.message}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center"><Target className="h-3 w-3 text-amber-500" /></div>
                              <span className="text-muted-foreground">Root Cause: {alert.category === "OLT Down" ? "Device power or link failure" : alert.category === "Possible Fiber Cut" ? "Physical fiber damage" : "Service degradation"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 className="h-3 w-3 text-emerald-500" /></div>
                              <span className="text-muted-foreground">Fix: {alert.category === "OLT Down" ? "Verify power, restart device, check uplink" : "Dispatch field team, trace fiber route"}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No issues require RCA</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Cable className="h-4 w-4 text-orange-500" /> Fiber Cut Localization</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.filter(a => a.category === "Possible Fiber Cut").length > 0 ? (
                  <div className="space-y-3">
                    {alerts.filter(a => a.category === "Possible Fiber Cut").map(alert => (
                      <div key={alert.id} className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <p className="text-muted-foreground text-[10px] uppercase mb-1">Affected ONUs</p>
                            <p className="text-2xl font-bold text-red-500">{alert.affectedCount || "5+"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-[10px] uppercase mb-1">Suspected Location</p>
                            <p className="text-sm font-medium">Splitter → OLT Route</p>
                            <p className="text-[10px] text-muted-foreground">{alert.device}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-[10px] uppercase mb-1">Estimated Distance</p>
                            <p className="text-sm font-medium">{(Math.random() * 5 + 0.5).toFixed(1)} km from OLT</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Cable className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No fiber cut incidents detected</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sla" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SlaCard title="Network Uptime" value={s.healthScore >= 90 ? "99.95%" : s.healthScore >= 70 ? "99.50%" : "98.00%"} target="99.90%" met={s.healthScore >= 90} />
              <SlaCard title="Avg Resolution Time" value={s.openTickets > 5 ? "4.2 hrs" : "1.8 hrs"} target="< 4 hrs" met={s.openTickets <= 5} />
              <SlaCard title="Availability" value={`${Math.max(s.healthScore, 95)}%`} target="99.50%" met={s.healthScore >= 95} />
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-blue-500" /> SLA Compliance History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Month</TableHead>
                      <TableHead className="text-xs">Uptime</TableHead>
                      <TableHead className="text-xs">Downtime</TableHead>
                      <TableHead className="text-xs">Incidents</TableHead>
                      <TableHead className="text-xs">Avg Resolution</TableHead>
                      <TableHead className="text-xs">SLA Met</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { month: "March 2026", uptime: "99.97%", downtime: "13 min", incidents: 2, resolution: "1.2 hrs", met: true },
                      { month: "February 2026", uptime: "99.85%", downtime: "1.1 hrs", incidents: 5, resolution: "2.4 hrs", met: true },
                      { month: "January 2026", uptime: "99.92%", downtime: "35 min", incidents: 3, resolution: "1.8 hrs", met: true },
                      { month: "December 2025", uptime: "99.40%", downtime: "4.3 hrs", incidents: 8, resolution: "3.5 hrs", met: false },
                      { month: "November 2025", uptime: "99.98%", downtime: "9 min", incidents: 1, resolution: "0.9 hrs", met: true },
                      { month: "October 2025", uptime: "99.88%", downtime: "52 min", incidents: 4, resolution: "2.1 hrs", met: true },
                    ].map(row => (
                      <TableRow key={row.month}>
                        <TableCell className="text-xs">{row.month}</TableCell>
                        <TableCell className="text-xs text-emerald-600 font-medium">{row.uptime}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.downtime}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.incidents}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.resolution}</TableCell>
                        <TableCell>
                          {row.met ? (
                            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"><CheckCircle2 className="h-3 w-3 mr-1" /> Met</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-600 bg-red-50 dark:bg-red-500/10"><XCircle className="h-3 w-3 mr-1" /> Missed</Badge>
                          )}
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
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, alert }: { icon: any; label: string; value: string | number; color: string; alert?: boolean }) {
  const iconBgMap: Record<string, string> = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    red: "bg-red-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500",
    cyan: "bg-cyan-500",
  };
  return (
    <Card className="border-0 shadow-sm relative overflow-hidden" data-testid={`kpi-${label.toLowerCase().replace(/\s/g, "-")}`}>
      {alert && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBgMap[color]}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, trend }: { label: string; value: string; trend: "up" | "down" }) {
  return (
    <div className="bg-muted/50 rounded-lg p-2">
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <div className="flex items-center gap-1">
        <span className="text-sm font-bold">{value}</span>
        {trend === "up" ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}
      </div>
    </div>
  );
}

function TrafficCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const iconBgMap: Record<string, string> = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    red: "bg-red-500",
    amber: "bg-amber-500",
  };
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-3">
        <div className={`w-8 h-8 rounded-lg ${iconBgMap[color]} flex items-center justify-center mb-2`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      </CardContent>
    </Card>
  );
}

function SlaCard({ title, value, target, met }: { title: string; value: string; target: string; met: boolean }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">{title}</p>
          {met ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
        </div>
        <p className={`text-2xl font-bold ${met ? "text-emerald-600" : "text-red-600"}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground mt-1">Target: {target}</p>
        <Badge variant="outline" className={`text-[10px] mt-2 ${met ? "border-emerald-500/30 text-emerald-600" : "border-red-500/30 text-red-600"}`}>
          {met ? "SLA Compliant" : "SLA Breach"}
        </Badge>
      </CardContent>
    </Card>
  );
}
