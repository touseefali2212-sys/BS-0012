import { useState, useEffect, useCallback, Fragment } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, Server, Radio, Smartphone, Wifi, WifiOff,
  Activity, Cpu, Thermometer, Clock, Zap, Globe,
  Network, Shield, Settings, AlertTriangle, AlertCircle,
  CheckCircle2, XCircle, RefreshCw, Plus, Edit, Trash2,
  Download, Search, Filter, BarChart3, TrendingUp,
  TrendingDown, Eye, Power, RotateCcw, Link2, Unlink,
  HardDrive, Signal, Monitor, ChevronRight, ChevronDown,
  FileText, Bell, MoreHorizontal, Hash, Cable, ArrowUpDown,
  Gauge, MemoryStick, Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type OltDevice, type OnuDevice, type GponSplitter } from "@shared/schema";

function useSimulatedMetrics(oltId: number | undefined) {
  const [metrics, setMetrics] = useState({
    cpuUsage: 0, memoryUsage: 0, temperature: 0, uptime: "",
    voltage: 0, fanSpeed: 0, powerConsumption: 0,
  });
  useEffect(() => {
    if (!oltId) return;
    const seed = oltId * 7;
    const update = () => {
      const now = Date.now();
      const jitter = Math.sin(now / 5000 + seed) * 10;
      setMetrics({
        cpuUsage: Math.max(5, Math.min(95, 35 + jitter + Math.random() * 8)),
        memoryUsage: Math.max(20, Math.min(90, 55 + jitter * 0.5 + Math.random() * 5)),
        temperature: Math.max(30, Math.min(70, 42 + jitter * 0.3 + Math.random() * 3)),
        uptime: `${Math.floor(45 + seed % 300)}d ${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`,
        voltage: +(220 + Math.random() * 5 - 2.5).toFixed(1),
        fanSpeed: Math.floor(2800 + Math.random() * 400),
        powerConsumption: +(85 + Math.random() * 30).toFixed(1),
      });
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [oltId]);
  return metrics;
}

function useSimulatedTraffic(oltId: number | undefined) {
  const [traffic, setTraffic] = useState<{ time: string; inbound: number; outbound: number }[]>([]);
  useEffect(() => {
    if (!oltId) return;
    const generateHistory = () => {
      const now = new Date();
      const pts: typeof traffic = [];
      for (let i = 23; i >= 0; i--) {
        const t = new Date(now.getTime() - i * 3600000);
        const hour = t.getHours();
        const peak = hour >= 18 && hour <= 23 ? 1.8 : hour >= 8 && hour <= 17 ? 1.2 : 0.6;
        pts.push({
          time: `${hour}:00`,
          inbound: +(peak * (800 + Math.random() * 400)).toFixed(1),
          outbound: +(peak * (200 + Math.random() * 150)).toFixed(1),
        });
      }
      return pts;
    };
    setTraffic(generateHistory());
    const interval = setInterval(() => setTraffic(generateHistory()), 30000);
    return () => clearInterval(interval);
  }, [oltId]);
  return traffic;
}

function useSimulatedAlarms(oltId: number | undefined) {
  const [alarms] = useState(() => {
    if (!oltId) return [];
    const types = [
      { type: "ONU Offline", severity: "warning" as const, message: "ONU device went offline" },
      { type: "High Temperature", severity: "critical" as const, message: "OLT temperature exceeded threshold (65°C)" },
      { type: "Port Down", severity: "critical" as const, message: "PON Port 3 link down detected" },
      { type: "Low Signal", severity: "warning" as const, message: "Optical power below threshold on ONU-0012" },
      { type: "Power Fluctuation", severity: "info" as const, message: "Input voltage fluctuation detected" },
      { type: "ONU Offline", severity: "warning" as const, message: "Multiple ONUs offline on PON Port 5" },
      { type: "Config Change", severity: "info" as const, message: "SNMP configuration updated by admin" },
      { type: "Fiber Cut", severity: "critical" as const, message: "Suspected fiber cut on PON Port 7" },
    ];
    return types.map((a, i) => ({
      id: i + 1,
      ...a,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
      acknowledged: Math.random() > 0.6,
    }));
  });
  return alarms;
}

function useSimulatedLogs(oltId: number | undefined) {
  const [logs] = useState(() => {
    if (!oltId) return [];
    const actions = [
      { action: "ONU Activated", user: "admin", detail: "ONU-0015 activated with service profile FTTH-100M" },
      { action: "Port Reset", user: "net_engineer", detail: "PON Port 4 reset due to high error rate" },
      { action: "Config Updated", user: "admin", detail: "SNMP polling interval changed to 30s" },
      { action: "ONU Rebooted", user: "technician1", detail: "ONU-0008 rebooted for firmware update" },
      { action: "Profile Assigned", user: "admin", detail: "Service profile changed for ONU-0003" },
      { action: "ONU Deactivated", user: "net_engineer", detail: "ONU-0022 deactivated - customer disconnect" },
      { action: "Firmware Update", user: "admin", detail: "OLT firmware updated to v5.8.2" },
      { action: "Alarm Acknowledged", user: "noc_operator", detail: "High temperature alarm acknowledged" },
      { action: "SNMP Query", user: "system", detail: "SNMP bulk walk completed successfully" },
      { action: "Backup Created", user: "admin", detail: "Configuration backup saved" },
    ];
    return actions.map((l, i) => ({
      id: i + 1,
      ...l,
      timestamp: new Date(Date.now() - i * 3600000 * 2 - Math.random() * 3600000).toISOString(),
    }));
  });
  return logs;
}

export default function OltManagementPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [onuDetailDialogOpen, setOnuDetailDialogOpen] = useState(false);
  const [selectedOnu, setSelectedOnu] = useState<any>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [expandedPonPort, setExpandedPonPort] = useState<number | null>(null);

  const { data: olt, isLoading: oltLoading } = useQuery<OltDevice>({
    queryKey: ["/api/olt-devices", id],
  });

  const { data: allOnus } = useQuery<OnuDevice[]>({
    queryKey: ["/api/onu-devices"],
  });

  const { data: allSplitters } = useQuery<GponSplitter[]>({
    queryKey: ["/api/gpon-splitters"],
  });

  const { data: allOlts } = useQuery<OltDevice[]>({
    queryKey: ["/api/olt-devices"],
  });

  const oltSplitters = (allSplitters || []).filter(s => s.oltId === (olt?.id ?? -1));
  const oltOnuIds = new Set(oltSplitters.map(s => s.id));
  const oltOnus = (allOnus || []).filter(o => o.splitterId && oltOnuIds.has(o.splitterId));
  const onlineOnus = oltOnus.filter(o => o.status === "online");
  const offlineOnus = oltOnus.filter(o => o.status !== "online");

  const metrics = useSimulatedMetrics(olt?.id);
  const traffic = useSimulatedTraffic(olt?.id);
  const alarms = useSimulatedAlarms(olt?.id);
  const logs = useSimulatedLogs(olt?.id);

  const ponPorts = Array.from({ length: olt?.totalPonPorts || 16 }, (_, i) => {
    const portSplitters = oltSplitters.filter(s => s.ponPort === i + 1);
    const portOnus = oltOnus.filter(o => portSplitters.some(s => s.id === o.splitterId));
    const activeOnus = portOnus.filter(o => o.status === "online");
    const utilization = portSplitters.length > 0 ? Math.min(100, Math.floor((portOnus.length / (portSplitters.reduce((s, sp) => s + parseInt(sp.splitRatio?.split(":")[1] || "8"), 0) || 8)) * 100)) : 0;
    return {
      id: i + 1,
      status: portSplitters.length > 0 ? "active" : "idle",
      totalOnus: portOnus.length,
      activeOnus: activeOnus.length,
      signalStrength: portOnus.length > 0 ? -18 - Math.random() * 8 : 0,
      utilization,
      splitters: portSplitters,
      onus: portOnus,
    };
  });

  const uplinks = [
    { name: "GE0/0/0", type: "GE", status: "up", speed: "1 Gbps", trafficIn: +(Math.random() * 500 + 200).toFixed(1), trafficOut: +(Math.random() * 200 + 50).toFixed(1), errors: Math.floor(Math.random() * 5) },
    { name: "GE0/0/1", type: "GE", status: "up", speed: "1 Gbps", trafficIn: +(Math.random() * 400 + 100).toFixed(1), trafficOut: +(Math.random() * 150 + 30).toFixed(1), errors: 0 },
    { name: "10GE0/0/0", type: "10GE", status: "up", speed: "10 Gbps", trafficIn: +(Math.random() * 3000 + 1000).toFixed(1), trafficOut: +(Math.random() * 1500 + 500).toFixed(1), errors: 0 },
    { name: "10GE0/0/1", type: "10GE", status: "down", speed: "-", trafficIn: 0, trafficOut: 0, errors: 0 },
  ];

  const rebootOnuMutation = useMutation({
    mutationFn: async (onuId: number) => {
      await apiRequest("PATCH", `/api/onu-devices/${onuId}`, { status: "online" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onu-devices"] });
      toast({ title: "ONU reboot command sent" });
    },
  });

  const toggleOnuMutation = useMutation({
    mutationFn: async ({ onuId, status }: { onuId: number; status: string }) => {
      await apiRequest("PATCH", `/api/onu-devices/${onuId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onu-devices"] });
      toast({ title: "ONU status updated" });
    },
  });

  const updateOltMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/olt-devices/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/olt-devices", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/olt-devices"] });
      setConfigDialogOpen(false);
      toast({ title: "OLT configuration updated" });
    },
  });

  const filteredOnus = oltOnus.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.onuId?.toLowerCase().includes(q) ||
      o.serialNumber?.toLowerCase().includes(q) ||
      o.macAddress?.toLowerCase().includes(q) ||
      o.ipAddress?.toLowerCase().includes(q)
    );
  });

  if (oltLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!olt) {
    return (
      <div className="p-6 text-center">
        <Server className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <h2 className="text-xl font-bold">OLT Not Found</h2>
        <p className="text-muted-foreground mt-2">The requested OLT device does not exist.</p>
        <Button className="mt-4" onClick={() => setLocation("/olt-management")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to OLT List
        </Button>
      </div>
    );
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      active: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950",
      online: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950",
      up: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950",
      offline: "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950",
      down: "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950",
      idle: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800",
      warning: "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950",
    };
    return <Badge variant="secondary" className={`text-[10px] capitalize ${colors[status] || colors.idle}`}>{status}</Badge>;
  };

  const MetricCard = ({ icon: Icon, label, value, unit, color, percent }: { icon: typeof Cpu; label: string; value: string | number; unit?: string; color: string; percent?: number }) => (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
            <p className="text-lg font-bold">{typeof value === "number" ? value.toFixed(1) : value}{unit && <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>}</p>
          </div>
        </div>
        {percent !== undefined && (
          <Progress value={percent} className="mt-2 h-1.5" />
        )}
      </CardContent>
    </Card>
  );

  const tabItems = [
    { key: "overview", label: "OLT Overview", icon: Monitor },
    { key: "snmp", label: "SNMP Monitoring", icon: Activity },
    { key: "pon", label: "PON Ports", icon: Cable },
    { key: "onu", label: "ONU / ONT Devices", icon: Smartphone },
    { key: "uplinks", label: "Uplinks & Interfaces", icon: Network },
    { key: "traffic", label: "Traffic & Bandwidth", icon: BarChart3 },
    { key: "alarms", label: "Alarms & Events", icon: Bell },
    { key: "config", label: "Configuration", icon: Settings },
    { key: "logs", label: "Logs & History", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[#0B1120] to-[#1a4a8a] text-white px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/olt-management">
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5" />
              <h1 className="text-lg font-bold" data-testid="text-olt-name">{olt.name}</h1>
              <StatusBadge status={olt.status} />
            </div>
            <p className="text-xs text-white/60 mt-0.5 ml-8">
              {olt.vendor} {olt.model} — {olt.ipAddress} — {olt.oltId}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-white border-white/20 bg-white/5 hover:bg-white/10 text-xs" onClick={() => setConfigDialogOpen(true)} data-testid="button-configure-olt">
              <Settings className="h-3 w-3 mr-1" /> Configure
            </Button>
            <Button size="sm" variant="outline" className="text-white border-white/20 bg-white/5 hover:bg-white/10 text-xs" data-testid="button-refresh-olt" onClick={() => { queryClient.invalidateQueries({ queryKey: ["/api/olt-devices", id] }); queryClient.invalidateQueries({ queryKey: ["/api/onu-devices"] }); toast({ title: "Data refreshed" }); }}>
              <RefreshCw className="h-3 w-3 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabItems.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? "bg-white text-[#0B1120]" : "text-white/70 hover:text-white hover:bg-white/10"}`}
              data-testid={`tab-${tab.key}`}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">

        {activeTab === "overview" && (
          <div className="space-y-6" data-testid="tab-content-overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard icon={Server} label="OLT Status" value={olt.status === "active" ? "Online" : "Offline"} color={olt.status === "active" ? "bg-emerald-500" : "bg-red-500"} />
              <MetricCard icon={Cable} label="PON Ports" value={`${olt.usedPonPorts || 0} / ${olt.totalPonPorts || 16}`} color="bg-blue-500" percent={((olt.usedPonPorts || 0) / (olt.totalPonPorts || 16)) * 100} />
              <MetricCard icon={Smartphone} label="Total ONUs" value={String(oltOnus.length)} color="bg-violet-500" />
              <MetricCard icon={Wifi} label="Online ONUs" value={String(onlineOnus.length)} color="bg-teal-500" percent={oltOnus.length > 0 ? (onlineOnus.length / oltOnus.length) * 100 : 0} />
              <MetricCard icon={WifiOff} label="Offline ONUs" value={String(offlineOnus.length)} color="bg-red-500" />
              <MetricCard icon={Cpu} label="CPU Usage" value={metrics.cpuUsage} unit="%" color="bg-amber-500" percent={metrics.cpuUsage} />
              <MetricCard icon={HardDrive} label="Memory Usage" value={metrics.memoryUsage} unit="%" color="bg-pink-500" percent={metrics.memoryUsage} />
              <MetricCard icon={Thermometer} label="Temperature" value={metrics.temperature} unit="°C" color={metrics.temperature > 55 ? "bg-red-500" : "bg-cyan-500"} percent={(metrics.temperature / 80) * 100} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2"><Server className="h-4 w-4 text-blue-600" /> Device Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 divide-y">
                  {[
                    ["OLT ID", olt.oltId],
                    ["Name", olt.name],
                    ["Vendor", olt.vendor || "-"],
                    ["Model", olt.model || "-"],
                    ["IP Address", olt.ipAddress || "-"],
                    ["Total PON Ports", String(olt.totalPonPorts || 16)],
                    ["Used PON Ports", String(olt.usedPonPorts || 0)],
                    ["Available Ports", String((olt.totalPonPorts || 16) - (olt.usedPonPorts || 0))],
                    ["Latitude", olt.lat],
                    ["Longitude", olt.lng],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between py-2 text-xs">
                      <span className="text-muted-foreground font-medium">{label}</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-600" /> System Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "CPU Usage", value: metrics.cpuUsage, unit: "%", color: metrics.cpuUsage > 80 ? "bg-red-500" : metrics.cpuUsage > 60 ? "bg-amber-500" : "bg-emerald-500" },
                    { label: "Memory Usage", value: metrics.memoryUsage, unit: "%", color: metrics.memoryUsage > 80 ? "bg-red-500" : metrics.memoryUsage > 60 ? "bg-amber-500" : "bg-emerald-500" },
                    { label: "Temperature", value: metrics.temperature, unit: "°C", color: metrics.temperature > 55 ? "bg-red-500" : metrics.temperature > 45 ? "bg-amber-500" : "bg-emerald-500" },
                  ].map(m => (
                    <div key={m.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{m.label}</span>
                        <span className="font-bold">{m.value.toFixed(1)}{m.unit}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${m.color}`} style={{ width: `${Math.min(100, m.label === "Temperature" ? (m.value / 80) * 100 : m.value)}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 space-y-2 divide-y">
                    <div className="flex justify-between text-xs pt-2"><span className="text-muted-foreground">Uptime</span><span className="font-medium">{metrics.uptime}</span></div>
                    <div className="flex justify-between text-xs pt-2"><span className="text-muted-foreground">Input Voltage</span><span className="font-medium">{metrics.voltage} V</span></div>
                    <div className="flex justify-between text-xs pt-2"><span className="text-muted-foreground">Fan Speed</span><span className="font-medium">{metrics.fanSpeed} RPM</span></div>
                    <div className="flex justify-between text-xs pt-2"><span className="text-muted-foreground">Power Consumption</span><span className="font-medium">{metrics.powerConsumption} W</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /> Recent Alarms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alarms.filter(a => !a.acknowledged).slice(0, 3).map(alarm => (
                    <div key={alarm.id} className={`flex items-center gap-3 p-2.5 rounded-lg text-xs ${alarm.severity === "critical" ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300" : alarm.severity === "warning" ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300" : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"}`}>
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 font-medium">{alarm.type}: {alarm.message}</span>
                      <span className="text-[10px] opacity-60">{new Date(alarm.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                  {alarms.filter(a => !a.acknowledged).length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-4">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No active alarms
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "snmp" && (
          <div className="space-y-6" data-testid="tab-content-snmp">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Settings className="h-4 w-4" /> SNMP Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    ["SNMP Version", "v2c"],
                    ["Community String", "••••••••"],
                    ["Port", "161"],
                    ["Polling Interval", "30s"],
                    ["Timeout", "5s"],
                    ["Retries", "3"],
                    ["Status", "Active"],
                    ["Last Poll", new Date().toLocaleTimeString()],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
                      <p className="text-sm font-semibold mt-1">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground flex items-center gap-2 px-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live monitoring — auto-refresh every 5 seconds
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard icon={Cpu} label="CPU Usage" value={metrics.cpuUsage} unit="%" color={metrics.cpuUsage > 80 ? "bg-red-500" : "bg-blue-500"} percent={metrics.cpuUsage} />
              <MetricCard icon={HardDrive} label="Memory Usage" value={metrics.memoryUsage} unit="%" color={metrics.memoryUsage > 80 ? "bg-red-500" : "bg-violet-500"} percent={metrics.memoryUsage} />
              <MetricCard icon={Thermometer} label="Temperature" value={metrics.temperature} unit="°C" color={metrics.temperature > 55 ? "bg-red-500" : "bg-cyan-500"} percent={(metrics.temperature / 80) * 100} />
              <MetricCard icon={Clock} label="Uptime" value={metrics.uptime} color="bg-emerald-500" />
              <MetricCard icon={Zap} label="Voltage" value={metrics.voltage} unit="V" color="bg-amber-500" />
              <MetricCard icon={Activity} label="Fan Speed" value={String(metrics.fanSpeed)} unit="RPM" color="bg-indigo-500" />
              <MetricCard icon={Gauge} label="Power" value={metrics.powerConsumption} unit="W" color="bg-pink-500" />
              <MetricCard icon={Server} label="OLT Status" value={olt.status === "active" ? "Online" : "Offline"} color={olt.status === "active" ? "bg-emerald-500" : "bg-red-500"} />
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Performance Trend (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40 flex items-end gap-1">
                  {traffic.map((t, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${t.time} — In: ${t.inbound} Mbps / Out: ${t.outbound} Mbps`}>
                      <div className="w-full bg-blue-500/80 rounded-t" style={{ height: `${Math.max(4, (t.inbound / 2000) * 120)}px` }} />
                      <div className="w-full bg-emerald-500/60 rounded-t" style={{ height: `${Math.max(2, (t.outbound / 500) * 40)}px` }} />
                      {i % 4 === 0 && <span className="text-[8px] text-muted-foreground mt-1">{t.time}</span>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-3 justify-center">
                  <div className="flex items-center gap-1.5 text-[10px]"><div className="h-2 w-4 bg-blue-500/80 rounded" />Inbound</div>
                  <div className="flex items-center gap-1.5 text-[10px]"><div className="h-2 w-4 bg-emerald-500/60 rounded" />Outbound</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "pon" && (
          <div className="space-y-4" data-testid="tab-content-pon">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">PON Ports ({olt.totalPonPorts || 16})</h3>
              <div className="flex gap-2 text-[10px]">
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Active</div>
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-gray-400" /> Idle</div>
              </div>
            </div>
            <div className="bg-card border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-[#0B1120] to-[#2563EB]">
                    <TableHead className="text-white text-xs w-8" />
                    <TableHead className="text-white text-xs">PON Port</TableHead>
                    <TableHead className="text-white text-xs">Status</TableHead>
                    <TableHead className="text-white text-xs">Total ONUs</TableHead>
                    <TableHead className="text-white text-xs">Active ONUs</TableHead>
                    <TableHead className="text-white text-xs">Signal (dBm)</TableHead>
                    <TableHead className="text-white text-xs">Utilization</TableHead>
                    <TableHead className="text-white text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ponPorts.map(port => (
                    <Fragment key={port.id}>
                      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedPonPort(expandedPonPort === port.id ? null : port.id)} data-testid={`row-pon-${port.id}`}>
                        <TableCell className="text-xs">
                          {port.totalOnus > 0 ? (expandedPonPort === port.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />) : null}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">PON {port.id}</TableCell>
                        <TableCell><StatusBadge status={port.status} /></TableCell>
                        <TableCell className="text-xs">{port.totalOnus}</TableCell>
                        <TableCell className="text-xs font-medium text-emerald-600">{port.activeOnus}</TableCell>
                        <TableCell className="text-xs font-mono">{port.signalStrength ? port.signalStrength.toFixed(1) : "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={port.utilization} className="h-1.5 w-16" />
                            <span className="text-[10px] text-muted-foreground">{port.utilization}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" title="Reset Port">
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedPonPort === port.id && port.onus.length > 0 && (
                        <TableRow key={`expanded-${port.id}`}>
                          <TableCell colSpan={8} className="bg-muted/30 px-8 py-3">
                            <div className="space-y-1.5">
                              <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-2">Connected ONUs on PON {port.id}</p>
                              {port.onus.map(onu => (
                                <div key={onu.id} className="flex items-center justify-between bg-card rounded px-3 py-1.5 text-xs border">
                                  <div className="flex items-center gap-3">
                                    <StatusBadge status={onu.status} />
                                    <span className="font-medium">{onu.onuId}</span>
                                    <span className="text-muted-foreground">{onu.serialNumber || "No serial"}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-muted-foreground font-mono">{onu.ipAddress || "-"}</span>
                                    <span className="text-muted-foreground">{onu.opticalPower ? `${onu.opticalPower} dBm` : "-"}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {activeTab === "onu" && (
          <div className="space-y-4" data-testid="tab-content-onu">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-3">
                <Badge variant="outline" className="text-xs gap-1"><Smartphone className="h-3 w-3" /> Total: {oltOnus.length}</Badge>
                <Badge variant="outline" className="text-xs gap-1 text-emerald-600"><Wifi className="h-3 w-3" /> Online: {onlineOnus.length}</Badge>
                <Badge variant="outline" className="text-xs gap-1 text-red-600"><WifiOff className="h-3 w-3" /> Offline: {offlineOnus.length}</Badge>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, serial, MAC..."
                    className="pl-8 h-8 text-xs w-64"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    data-testid="input-search-onu"
                  />
                </div>
                <Button size="sm" variant="outline" className="text-xs h-8 gap-1" data-testid="button-export-onu">
                  <Download className="h-3 w-3" /> Export
                </Button>
              </div>
            </div>

            <div className="bg-card border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-[#0B1120] to-[#2563EB]">
                    <TableHead className="text-white text-xs">ONU ID</TableHead>
                    <TableHead className="text-white text-xs">Serial Number</TableHead>
                    <TableHead className="text-white text-xs">MAC Address</TableHead>
                    <TableHead className="text-white text-xs">Status</TableHead>
                    <TableHead className="text-white text-xs">Optical Power</TableHead>
                    <TableHead className="text-white text-xs">IP Address</TableHead>
                    <TableHead className="text-white text-xs">Service Plan</TableHead>
                    <TableHead className="text-white text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOnus.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                        {searchQuery ? "No ONUs match your search" : "No ONU devices connected to this OLT"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOnus.map(onu => (
                      <TableRow key={onu.id} data-testid={`row-onu-${onu.id}`}>
                        <TableCell className="text-xs font-semibold">{onu.onuId}</TableCell>
                        <TableCell className="text-xs font-mono">{onu.serialNumber || "-"}</TableCell>
                        <TableCell className="text-xs font-mono">{onu.macAddress || "-"}</TableCell>
                        <TableCell><StatusBadge status={onu.status} /></TableCell>
                        <TableCell className={`text-xs font-mono ${onu.opticalPower && parseFloat(onu.opticalPower) < -25 ? "text-red-600" : ""}`}>{onu.opticalPower ? `${onu.opticalPower} dBm` : "-"}</TableCell>
                        <TableCell className="text-xs font-mono">{onu.ipAddress || "-"}</TableCell>
                        <TableCell className="text-xs">{onu.servicePlan || "-"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-onu-actions-${onu.id}`}>
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => { setSelectedOnu(onu); setOnuDetailDialogOpen(true); }}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => rebootOnuMutation.mutate(onu.id)}>
                                <RotateCcw className="h-3.5 w-3.5 mr-2" /> Reboot ONU
                              </DropdownMenuItem>
                              {onu.status === "online" ? (
                                <DropdownMenuItem onClick={() => toggleOnuMutation.mutate({ onuId: onu.id, status: "offline" })}>
                                  <Power className="h-3.5 w-3.5 mr-2" /> Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => toggleOnuMutation.mutate({ onuId: onu.id, status: "online" })}>
                                  <Power className="h-3.5 w-3.5 mr-2" /> Activate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {activeTab === "uplinks" && (
          <div className="space-y-4" data-testid="tab-content-uplinks">
            <h3 className="text-sm font-semibold">Uplink Interfaces</h3>
            <div className="bg-card border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-[#0B1120] to-[#2563EB]">
                    <TableHead className="text-white text-xs">Interface</TableHead>
                    <TableHead className="text-white text-xs">Type</TableHead>
                    <TableHead className="text-white text-xs">Status</TableHead>
                    <TableHead className="text-white text-xs">Speed</TableHead>
                    <TableHead className="text-white text-xs">Traffic In (Mbps)</TableHead>
                    <TableHead className="text-white text-xs">Traffic Out (Mbps)</TableHead>
                    <TableHead className="text-white text-xs">Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uplinks.map(uplink => (
                    <TableRow key={uplink.name} data-testid={`row-uplink-${uplink.name}`}>
                      <TableCell className="text-xs font-semibold font-mono">{uplink.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{uplink.type}</Badge></TableCell>
                      <TableCell><StatusBadge status={uplink.status} /></TableCell>
                      <TableCell className="text-xs">{uplink.speed}</TableCell>
                      <TableCell className="text-xs font-mono text-blue-600">{uplink.trafficIn > 0 ? uplink.trafficIn : "-"}</TableCell>
                      <TableCell className="text-xs font-mono text-emerald-600">{uplink.trafficOut > 0 ? uplink.trafficOut : "-"}</TableCell>
                      <TableCell className={`text-xs ${uplink.errors > 0 ? "text-red-600 font-bold" : "text-muted-foreground"}`}>{uplink.errors}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {uplinks.filter(u => u.status === "up").map(uplink => (
                <Card key={uplink.name}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-2"><Network className="h-3.5 w-3.5 text-blue-500" />{uplink.name}</span>
                      <StatusBadge status={uplink.status} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground">Inbound</p>
                        <p className="text-lg font-bold text-blue-600">{uplink.trafficIn}</p>
                        <p className="text-[10px] text-muted-foreground">Mbps</p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground">Outbound</p>
                        <p className="text-lg font-bold text-emerald-600">{uplink.trafficOut}</p>
                        <p className="text-[10px] text-muted-foreground">Mbps</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "traffic" && (
          <div className="space-y-6" data-testid="tab-content-traffic">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard icon={TrendingUp} label="Peak Inbound" value={String(Math.max(...traffic.map(t => t.inbound)).toFixed(0))} unit="Mbps" color="bg-blue-500" />
              <MetricCard icon={TrendingDown} label="Peak Outbound" value={String(Math.max(...traffic.map(t => t.outbound)).toFixed(0))} unit="Mbps" color="bg-emerald-500" />
              <MetricCard icon={BarChart3} label="Avg Inbound" value={String((traffic.reduce((s, t) => s + t.inbound, 0) / (traffic.length || 1)).toFixed(0))} unit="Mbps" color="bg-violet-500" />
              <MetricCard icon={Activity} label="Avg Outbound" value={String((traffic.reduce((s, t) => s + t.outbound, 0) / (traffic.length || 1)).toFixed(0))} unit="Mbps" color="bg-amber-500" />
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">24-Hour Traffic Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-end gap-1">
                  {traffic.map((t, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${t.time} — In: ${t.inbound} Mbps / Out: ${t.outbound} Mbps`}>
                      <div className="w-full bg-blue-500/80 rounded-t transition-all" style={{ height: `${Math.max(4, (t.inbound / Math.max(...traffic.map(x => x.inbound))) * 160)}px` }} />
                      <div className="w-full bg-emerald-500/60 rounded-t transition-all" style={{ height: `${Math.max(2, (t.outbound / Math.max(...traffic.map(x => x.outbound))) * 60)}px` }} />
                      {i % 3 === 0 && <span className="text-[8px] text-muted-foreground mt-1">{t.time}</span>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-3 justify-center">
                  <div className="flex items-center gap-1.5 text-[10px]"><div className="h-2 w-4 bg-blue-500/80 rounded" /> Inbound (Mbps)</div>
                  <div className="flex items-center gap-1.5 text-[10px]"><div className="h-2 w-4 bg-emerald-500/60 rounded" /> Outbound (Mbps)</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Per-PON Port Bandwidth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ponPorts.filter(p => p.totalOnus > 0).map(port => (
                    <div key={port.id} className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-medium">PON {port.id}</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">{(50 + Math.random() * 200).toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground">Mbps</p>
                      <Progress value={port.utilization} className="h-1 mt-2" />
                    </div>
                  ))}
                  {ponPorts.filter(p => p.totalOnus > 0).length === 0 && (
                    <div className="col-span-4 text-center text-xs text-muted-foreground py-6">No active PON ports</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "alarms" && (
          <div className="space-y-4" data-testid="tab-content-alarms">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <Badge variant="outline" className="text-xs gap-1 text-red-600"><AlertCircle className="h-3 w-3" /> Critical: {alarms.filter(a => a.severity === "critical").length}</Badge>
                <Badge variant="outline" className="text-xs gap-1 text-amber-600"><AlertTriangle className="h-3 w-3" /> Warning: {alarms.filter(a => a.severity === "warning").length}</Badge>
                <Badge variant="outline" className="text-xs gap-1 text-blue-600"><Bell className="h-3 w-3" /> Info: {alarms.filter(a => a.severity === "info").length}</Badge>
              </div>
            </div>

            <div className="bg-card border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-[#0B1120] to-[#2563EB]">
                    <TableHead className="text-white text-xs">Severity</TableHead>
                    <TableHead className="text-white text-xs">Type</TableHead>
                    <TableHead className="text-white text-xs">Message</TableHead>
                    <TableHead className="text-white text-xs">Timestamp</TableHead>
                    <TableHead className="text-white text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...alarms].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(alarm => (
                    <TableRow key={alarm.id} data-testid={`row-alarm-${alarm.id}`}>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] ${alarm.severity === "critical" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : alarm.severity === "warning" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"}`}>
                          {alarm.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{alarm.type}</TableCell>
                      <TableCell className="text-xs">{alarm.message}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(alarm.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        {alarm.acknowledged ? (
                          <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Acknowledged</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">Active</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {activeTab === "config" && (
          <div className="space-y-6" data-testid="tab-content-config">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2"><Server className="h-4 w-4" /> OLT Configuration</CardTitle>
                </CardHeader>
                <CardContent className="divide-y">
                  {[
                    ["Device Name", olt.name],
                    ["OLT ID", olt.oltId],
                    ["IP Address", olt.ipAddress || "-"],
                    ["Vendor", olt.vendor || "-"],
                    ["Model", olt.model || "-"],
                    ["Total PON Ports", String(olt.totalPonPorts || 16)],
                    ["Status", olt.status],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-2 text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                  <div className="pt-3">
                    <Button size="sm" className="w-full text-xs" onClick={() => setConfigDialogOpen(true)} data-testid="button-edit-config">
                      <Edit className="h-3 w-3 mr-1" /> Edit Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4" /> SNMP Credentials</CardTitle>
                </CardHeader>
                <CardContent className="divide-y">
                  {[
                    ["SNMP Version", "v2c"],
                    ["Community String", "••••••••"],
                    ["Port", "161"],
                    ["Timeout", "5 seconds"],
                    ["Retries", "3"],
                    ["Polling Interval", "30 seconds"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-2 text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2"><Globe className="h-4 w-4" /> Vendor Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["Huawei", "ZTE", "FiberHome", "Nokia", "VSOL", "HSGQ"].map(vendor => (
                      <div key={vendor} className={`rounded-lg border p-3 text-center transition-all ${olt.vendor === vendor ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-muted hover:border-muted-foreground/20"}`}>
                        <p className="text-sm font-semibold">{vendor}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{olt.vendor === vendor ? "Active Profile" : "Available"}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-4" data-testid="tab-content-logs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Activity Logs</h3>
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1" data-testid="button-export-logs">
                <Download className="h-3 w-3" /> Export Logs
              </Button>
            </div>
            <div className="bg-card border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-[#0B1120] to-[#2563EB]">
                    <TableHead className="text-white text-xs">Timestamp</TableHead>
                    <TableHead className="text-white text-xs">Action</TableHead>
                    <TableHead className="text-white text-xs">User</TableHead>
                    <TableHead className="text-white text-xs">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                      <TableCell className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="text-xs font-medium">{log.action}</TableCell>
                      <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{log.user}</Badge></TableCell>
                      <TableCell className="text-xs">{log.detail}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={onuDetailDialogOpen} onOpenChange={setOnuDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> ONU Details — {selectedOnu?.onuId}</DialogTitle>
          </DialogHeader>
          {selectedOnu && (
            <div className="divide-y">
              {[
                ["ONU ID", selectedOnu.onuId],
                ["Serial Number", selectedOnu.serialNumber || "-"],
                ["MAC Address", selectedOnu.macAddress || "-"],
                ["IP Address", selectedOnu.ipAddress || "-"],
                ["Status", selectedOnu.status],
                ["Optical Power", selectedOnu.opticalPower ? `${selectedOnu.opticalPower} dBm` : "-"],
                ["Service Plan", selectedOnu.servicePlan || "-"],
                ["Splitter Port", selectedOnu.splitterPort ? String(selectedOnu.splitterPort) : "-"],
                ["Activation Date", selectedOnu.activationDate || "-"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2.5 text-xs">
                  <span className="text-muted-foreground font-medium">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { if (selectedOnu) rebootOnuMutation.mutate(selectedOnu.id); setOnuDetailDialogOpen(false); }} data-testid="button-reboot-onu-dialog">
              <RotateCcw className="h-3 w-3 mr-1" /> Reboot
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOnuDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Settings className="h-4 w-4" /> Configure OLT</DialogTitle>
          </DialogHeader>
          <ConfigForm olt={olt} onSave={(data) => updateOltMutation.mutate(data)} isPending={updateOltMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfigForm({ olt, onSave, isPending }: { olt: OltDevice; onSave: (data: any) => void; isPending: boolean }) {
  const [name, setName] = useState(olt.name);
  const [ipAddress, setIpAddress] = useState(olt.ipAddress || "");
  const [vendor, setVendor] = useState(olt.vendor || "Huawei");
  const [model, setModel] = useState(olt.model || "");
  const [totalPonPorts, setTotalPonPorts] = useState(String(olt.totalPonPorts || 16));
  const [status, setStatus] = useState(olt.status);
  const [notes, setNotes] = useState(olt.notes || "");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} className="h-9 text-sm" data-testid="input-config-name" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">IP Address</label>
          <Input value={ipAddress} onChange={e => setIpAddress(e.target.value)} className="h-9 text-sm" data-testid="input-config-ip" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Vendor</label>
          <Select value={vendor} onValueChange={setVendor}>
            <SelectTrigger className="h-9 text-sm" data-testid="select-config-vendor"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Huawei", "ZTE", "FiberHome", "Nokia", "VSOL", "HSGQ", "Other"].map(v => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Model</label>
          <Input value={model} onChange={e => setModel(e.target.value)} className="h-9 text-sm" data-testid="input-config-model" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Total PON Ports</label>
          <Input type="number" value={totalPonPorts} onChange={e => setTotalPonPorts(e.target.value)} className="h-9 text-sm" data-testid="input-config-ports" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 text-sm" data-testid="select-config-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Notes</label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="text-sm min-h-[80px]" data-testid="textarea-config-notes" />
      </div>
      <DialogFooter>
        <Button onClick={() => onSave({ name, ipAddress, vendor, model, totalPonPorts: parseInt(totalPonPorts), status, notes })} disabled={isPending || !name.trim()} data-testid="button-save-config">
          {isPending ? "Saving..." : "Save Configuration"}
        </Button>
      </DialogFooter>
    </div>
  );
}
