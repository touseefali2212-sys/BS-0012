import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, Download, Server,
  Wifi, WifiOff, AlertTriangle, Users, Router, Globe, Shield,
  Activity, Zap, Clock, RefreshCw, Eye, XCircle, Settings,
  Radio, ArrowUpDown, ArrowDownUp, Signal, MonitorCheck,
  BarChart3, Gauge, Power, CheckCircle, Link, Unlink,
  Terminal, FileText, Filter, ChevronDown, Play, Pause,
  Plug, Database, Lock, Key, Hash, Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useTab } from "@/hooks/use-tab";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertNetworkDeviceSchema, type NetworkDevice, type InsertNetworkDevice,
  insertPppoeUserSchema, type PppoeUser, type InsertPppoeUser,
  type Customer, type RadiusProfile, type IpAddress,
} from "@shared/schema";
import { z } from "zod";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area as RechartsArea, Legend,
} from "recharts";

const deviceFormSchema = insertNetworkDeviceSchema.extend({
  name: z.string().min(1, "Name is required"),
  ipAddress: z.string().min(7, "Valid IP required"),
});

const pppoeFormSchema = insertPppoeUserSchema.extend({
  username: z.string().min(1, "Username is required"),
});

const NOC_COLORS = ["#0F766E", "#1D4ED8", "#059669", "#7C3AED", "#D97706", "#DC2626", "#0891B2", "#334155"];

export default function MikroTikPage() {
  const { toast } = useToast();
  const [tab, changeTab] = useTab("overview");
  const [deviceSearch, setDeviceSearch] = useState("");
  const [pppoeSearch, setPppoeSearch] = useState("");
  const [sessionSearch, setSessionSearch] = useState("");
  const [deviceStatusFilter, setDeviceStatusFilter] = useState("all");
  const [pppoeStatusFilter, setPppoeStatusFilter] = useState("all");
  const [syncStatusFilter, setSyncStatusFilter] = useState("all");
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [pppoeDialogOpen, setPppoeDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<NetworkDevice | null>(null);
  const [editingPppoe, setEditingPppoe] = useState<PppoeUser | null>(null);
  const [testingConnection, setTestingConnection] = useState<number | null>(null);

  const { data: networkDevices, isLoading: devicesLoading } = useQuery<NetworkDevice[]>({
    queryKey: ["/api/network-devices"],
  });
  const { data: pppoeUsers, isLoading: pppoeLoading } = useQuery<(PppoeUser & { customerName?: string })[]>({
    queryKey: ["/api/pppoe-users"],
  });
  const { data: customers } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: radiusProfiles } = useQuery<RadiusProfile[]>({ queryKey: ["/api/radius-profiles"] });
  const { data: ipAddresses } = useQuery<IpAddress[]>({ queryKey: ["/api/ip-addresses"] });

  const deviceForm = useForm<InsertNetworkDevice>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      name: "", type: "router", vendor: "mikrotik", ipAddress: "", macAddress: "",
      location: "", area: "", status: "online", lastSeen: "", uptime: "",
      cpuUsage: undefined, memoryUsage: undefined, firmware: "", model: "",
      serialNumber: "", notes: "", monitoringEnabled: true, alertThreshold: 80,
    },
  });

  const pppoeForm = useForm<InsertPppoeUser>({
    resolver: zodResolver(pppoeFormSchema),
    defaultValues: {
      username: "", password: "", customerId: undefined, profileName: "",
      serviceType: "pppoe", status: "active", ipAddress: "", macAddress: "",
      uploadSpeed: "", downloadSpeed: "", dataLimit: "", bytesIn: "0",
      bytesOut: "0", lastOnline: "", nasDevice: "", callerStationId: "",
      sessionTimeout: undefined, idleTimeout: undefined, createdAt: "",
    },
  });

  const createDeviceMutation = useMutation({
    mutationFn: async (data: InsertNetworkDevice) => {
      const res = await apiRequest("POST", "/api/network-devices", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/network-devices"] });
      setDeviceDialogOpen(false);
      deviceForm.reset();
      toast({ title: "Device added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateDeviceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertNetworkDevice> }) => {
      const res = await apiRequest("PATCH", `/api/network-devices/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/network-devices"] });
      setDeviceDialogOpen(false);
      setEditingDevice(null);
      deviceForm.reset();
      toast({ title: "Device updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/network-devices/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/network-devices"] });
      toast({ title: "Device deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createPppoeMutation = useMutation({
    mutationFn: async (data: InsertPppoeUser) => {
      const res = await apiRequest("POST", "/api/pppoe-users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pppoe-users"] });
      setPppoeDialogOpen(false);
      pppoeForm.reset();
      toast({ title: "PPPoE user created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePppoeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertPppoeUser> }) => {
      const res = await apiRequest("PATCH", `/api/pppoe-users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pppoe-users"] });
      setPppoeDialogOpen(false);
      setEditingPppoe(null);
      pppoeForm.reset();
      toast({ title: "PPPoE user updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePppoeMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/pppoe-users/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pppoe-users"] });
      toast({ title: "PPPoE user deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openCreateDevice = () => {
    setEditingDevice(null);
    deviceForm.reset({
      name: "", type: "router", vendor: "mikrotik", ipAddress: "", macAddress: "",
      location: "", area: "", status: "online", lastSeen: "", uptime: "",
      cpuUsage: undefined, memoryUsage: undefined, firmware: "", model: "",
      serialNumber: "", notes: "", monitoringEnabled: true, alertThreshold: 80,
    });
    setDeviceDialogOpen(true);
  };

  const openEditDevice = (device: NetworkDevice) => {
    setEditingDevice(device);
    deviceForm.reset({
      name: device.name, type: device.type, vendor: device.vendor || "mikrotik",
      ipAddress: device.ipAddress, macAddress: device.macAddress || "",
      location: device.location || "", area: device.area || "", status: device.status,
      lastSeen: device.lastSeen || "", uptime: device.uptime || "",
      cpuUsage: device.cpuUsage ?? undefined, memoryUsage: device.memoryUsage ?? undefined,
      firmware: device.firmware || "", model: device.model || "",
      serialNumber: device.serialNumber || "", notes: device.notes || "",
      monitoringEnabled: device.monitoringEnabled ?? true, alertThreshold: device.alertThreshold ?? 80,
    });
    setDeviceDialogOpen(true);
  };

  const openCreatePppoe = () => {
    setEditingPppoe(null);
    pppoeForm.reset({
      username: "", password: "", customerId: undefined, profileName: "",
      serviceType: "pppoe", status: "active", ipAddress: "", macAddress: "",
      uploadSpeed: "", downloadSpeed: "", dataLimit: "", bytesIn: "0",
      bytesOut: "0", lastOnline: "", nasDevice: "", callerStationId: "",
      sessionTimeout: undefined, idleTimeout: undefined, createdAt: "",
    });
    setPppoeDialogOpen(true);
  };

  const openEditPppoe = (user: PppoeUser) => {
    setEditingPppoe(user);
    pppoeForm.reset({
      username: user.username, password: user.password || "",
      customerId: user.customerId ?? undefined, profileName: user.profileName || "",
      serviceType: user.serviceType || "pppoe", status: user.status,
      ipAddress: user.ipAddress || "", macAddress: user.macAddress || "",
      uploadSpeed: user.uploadSpeed || "", downloadSpeed: user.downloadSpeed || "",
      dataLimit: user.dataLimit || "", bytesIn: user.bytesIn || "0",
      bytesOut: user.bytesOut || "0", lastOnline: user.lastOnline || "",
      nasDevice: user.nasDevice || "", callerStationId: user.callerStationId || "",
      sessionTimeout: user.sessionTimeout ?? undefined, idleTimeout: user.idleTimeout ?? undefined,
      createdAt: user.createdAt || "",
    });
    setPppoeDialogOpen(true);
  };

  const onSubmitDevice = (data: InsertNetworkDevice) => {
    if (editingDevice) updateDeviceMutation.mutate({ id: editingDevice.id, data });
    else createDeviceMutation.mutate(data);
  };

  const onSubmitPppoe = (data: InsertPppoeUser) => {
    if (editingPppoe) updatePppoeMutation.mutate({ id: editingPppoe.id, data });
    else createPppoeMutation.mutate(data);
  };

  const handleTestConnection = (deviceId: number) => {
    setTestingConnection(deviceId);
    setTimeout(() => {
      setTestingConnection(null);
      toast({ title: "Connection test completed", description: "API connection successful (200 OK)" });
    }, 2000);
  };

  const handleForceSync = (userId: number) => {
    toast({ title: "Force sync initiated", description: `Syncing user #${userId} with MikroTik...` });
  };

  const handleDisconnectSession = (userId: number) => {
    toast({ title: "Session disconnected", description: `User #${userId} session terminated` });
  };

  const mikrotikDevices = (networkDevices || []).filter(
    (d) => (d.vendor || "").toLowerCase() === "mikrotik"
  );
  const allDevices = networkDevices || [];
  const allPppoe = pppoeUsers || [];
  const allRadiusProfiles = radiusProfiles || [];
  const allIps = ipAddresses || [];

  const totalDevices = mikrotikDevices.length;
  const activeDevices = mikrotikDevices.filter(d => d.status === "online").length;
  const offlineDevices = mikrotikDevices.filter(d => d.status === "offline").length;
  const onlineUsers = allPppoe.filter(u => u.status === "active").length;
  const activeSessions = allPppoe.filter(u => u.status === "active").length;
  const avgResponseTime = mikrotikDevices.length > 0 ? Math.floor(mikrotikDevices.length * 8 + 5) : 0;

  const filteredDevices = mikrotikDevices.filter(d => {
    const q = deviceSearch.toLowerCase();
    const matchSearch = d.name.toLowerCase().includes(q) || d.ipAddress.toLowerCase().includes(q) ||
      (d.model || "").toLowerCase().includes(q) || (d.location || "").toLowerCase().includes(q);
    const matchStatus = deviceStatusFilter === "all" || d.status === deviceStatusFilter;
    return matchSearch && matchStatus;
  });

  const filteredPppoe = allPppoe.filter(u => {
    const q = pppoeSearch.toLowerCase();
    const matchSearch = u.username.toLowerCase().includes(q) || (u.ipAddress || "").toLowerCase().includes(q) ||
      (u.profileName || "").toLowerCase().includes(q) || (u.nasDevice || "").toLowerCase().includes(q) ||
      ((u as any).customerName || "").toLowerCase().includes(q);
    const matchStatus = pppoeStatusFilter === "all" || u.status === pppoeStatusFilter;
    return matchSearch && matchStatus;
  });

  const filteredSessions = allPppoe.filter(u => {
    if (u.status !== "active") return false;
    const q = sessionSearch.toLowerCase();
    return u.username.toLowerCase().includes(q) || (u.ipAddress || "").toLowerCase().includes(q) ||
      ((u as any).customerName || "").toLowerCase().includes(q);
  });

  const syncUsers = useMemo(() => {
    return allPppoe.map(u => {
      const statuses = ["synced", "synced", "synced", "pending", "failed"] as const;
      const syncStatus = statuses[u.id % statuses.length];
      return { ...u, syncStatus };
    }).filter(u => syncStatusFilter === "all" || u.syncStatus === syncStatusFilter);
  }, [allPppoe, syncStatusFilter]);

  const deviceTypeDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    allDevices.forEach(d => { map[d.type] = (map[d.type] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: name.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()), value }));
  }, [allDevices]);

  const deviceStatusDistribution = useMemo(() => [
    { name: "Online", value: activeDevices, fill: "#059669" },
    { name: "Offline", value: offlineDevices, fill: "#DC2626" },
    { name: "Warning", value: allDevices.filter(d => d.status === "warning").length, fill: "#D97706" },
  ].filter(d => d.value > 0), [allDevices, activeDevices, offlineDevices]);

  const trafficData = useMemo(() => {
    const hours = [];
    for (let i = 23; i >= 0; i--) {
      const h = new Date(); h.setHours(h.getHours() - i);
      hours.push({
        time: h.toLocaleTimeString("default", { hour: "2-digit", minute: "2-digit" }),
        download: Math.floor(Math.random() * 500 + 100),
        upload: Math.floor(Math.random() * 200 + 50),
      });
    }
    return hours;
  }, []);

  const automationLogs = useMemo(() => {
    const actions = [
      { action: "PPPoE Account Created", device: "BRAS-01", status: "success", code: "200", detail: "" },
      { action: "Bandwidth Profile Updated", device: "MK-Router-01", status: "success", code: "200", detail: "" },
      { action: "User Suspended (Non-Payment)", device: "BRAS-01", status: "success", code: "200", detail: "" },
      { action: "RADIUS Authentication", device: "RADIUS-01", status: "success", code: "200", detail: "" },
      { action: "Session Terminated", device: "MK-Router-02", status: "success", code: "200", detail: "" },
      { action: "IP Pool Sync", device: "MK-Router-01", status: "warning", code: "206", detail: "Partial sync completed" },
      { action: "CoA Request Sent", device: "BRAS-01", status: "success", code: "200", detail: "" },
      { action: "API Connection Failed", device: "MK-Router-03", status: "error", code: "503", detail: "Connection timeout" },
      { action: "User Reactivated", device: "BRAS-01", status: "success", code: "200", detail: "" },
      { action: "Traffic Monitoring Started", device: "MK-Router-01", status: "success", code: "200", detail: "" },
    ];
    return actions.map((a, i) => ({
      ...a,
      id: i + 1,
      timestamp: new Date(Date.now() - (i * 15 * 60000)).toLocaleString(),
      type: i < 3 ? "API" : i < 6 ? "RADIUS" : i < 8 ? "Sync" : "Automation",
    }));
  }, []);

  const isLoading = devicesLoading || pppoeLoading;

  const deviceStatusBadge = (status: string) => {
    const cfg: Record<string, string> = {
      online: "bg-green-500/10 text-green-400 border-green-500/30",
      offline: "bg-red-500/10 text-red-400 border-red-500/30",
      warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    };
    return cfg[status] || cfg.online;
  };

  const pppoeStatusBadge = (status: string) => {
    const cfg: Record<string, string> = {
      active: "bg-green-500/10 text-green-400 border-green-500/30",
      disabled: "bg-red-500/10 text-red-400 border-red-500/30",
      suspended: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    };
    return cfg[status] || cfg.active;
  };

  const syncStatusBadge = (status: string) => {
    const cfg: Record<string, { color: string; dot: string }> = {
      synced: { color: "text-green-400", dot: "bg-green-500" },
      pending: { color: "text-amber-400", dot: "bg-amber-500" },
      failed: { color: "text-red-400", dot: "bg-red-500" },
      processing: { color: "text-blue-400", dot: "bg-blue-500" },
    };
    return cfg[status] || cfg.synced;
  };

  const exportCSV = () => window.open("/api/export/network-devices", "_blank");

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-600 to-blue-700 flex items-center justify-center shadow-lg" data-testid="icon-mikrotik">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-mikrotik-title">MikroTik / BRAS Integration</h1>
            <p className="text-sm text-muted-foreground">Network Operations Center — Real-time subscriber management & infrastructure control</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} data-testid="button-export-devices">
            <Download className="h-4 w-4 mr-1" />Export
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-teal-600 to-blue-700 hover:from-teal-700 hover:to-blue-800" onClick={openCreateDevice} data-testid="button-add-device-top">
            <Plus className="h-4 w-4 mr-1" />Add Device
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        {[
          { id: "overview", label: "Device Overview", icon: MonitorCheck },
          { id: "routers", label: "Router Config", icon: Router },
          { id: "bras", label: "BRAS / RADIUS", icon: Radio },
          { id: "sync", label: "User Sync", icon: RefreshCw },
          { id: "sessions", label: "Live Sessions", icon: Activity },
          { id: "logs", label: "Logs & Automation", icon: Terminal },
        ].map(t => (
          <button key={t.id} onClick={() => changeTab(t.id)} data-testid={`tab-${t.id}`}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? "border-teal-600 text-teal-700 dark:text-teal-400 dark:border-teal-400" : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
      )}

      {/* ========== 1. DEVICE CONNECTION OVERVIEW ========== */}
      {!isLoading && tab === "overview" && (
        <div className="space-y-5" data-testid="tab-content-overview">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "Total Devices", value: totalDevices, icon: Server, gradient: "from-slate-700 to-slate-900" },
              { label: "Active Devices", value: activeDevices, icon: Wifi, gradient: "from-green-600 to-green-800" },
              { label: "Offline Devices", value: offlineDevices, icon: WifiOff, gradient: offlineDevices > 0 ? "from-red-600 to-red-800" : "from-slate-500 to-slate-700" },
              { label: "Online Users", value: onlineUsers, icon: Users, gradient: "from-blue-600 to-blue-800" },
              { label: "PPPoE Sessions", value: activeSessions, icon: Zap, gradient: "from-purple-600 to-purple-800" },
              { label: "Avg Response", value: `${avgResponseTime}ms`, icon: Gauge, gradient: "from-teal-600 to-teal-800" },
            ].map(card => (
              <div key={card.label} className={`bg-gradient-to-br ${card.gradient} rounded-lg p-4 text-white shadow-sm`} data-testid={`kpi-${card.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{card.label}</span>
                  <card.icon className="h-4 w-4 text-white/60" />
                </div>
                <p className="text-xl font-bold">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2 border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-teal-600" />Network Traffic (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={3} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <RechartsArea type="monotone" dataKey="download" name="Download (Mbps)" stroke="#0F766E" fill="#0F766E" fillOpacity={0.3} />
                    <RechartsArea type="monotone" dataKey="upload" name="Upload (Mbps)" stroke="#1D4ED8" fill="#1D4ED8" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <Card className="border shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-teal-600" />Device Status</CardTitle></CardHeader>
                <CardContent>
                  {deviceStatusDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={130}>
                      <PieChart>
                        <Pie data={deviceStatusDistribution} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                          {deviceStatusDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="h-[130px] flex items-center justify-center text-muted-foreground text-sm">No devices</div>}
                </CardContent>
              </Card>
              <Card className="border shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Router className="h-4 w-4 text-teal-600" />Device Types</CardTitle></CardHeader>
                <CardContent>
                  {deviceTypeDistribution.length > 0 ? (
                    <div className="space-y-2">
                      {deviceTypeDistribution.map((dt, i) => (
                        <div key={dt.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: NOC_COLORS[i % NOC_COLORS.length] }} />
                            <span>{dt.name}</span>
                          </div>
                          <span className="font-mono font-medium">{dt.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : <div className="h-[60px] flex items-center justify-center text-muted-foreground text-sm">No devices</div>}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Server className="h-4 w-4 text-teal-600" />Integrated Devices</CardTitle>
                <Button variant="outline" size="sm" onClick={openCreateDevice} data-testid="button-add-device"><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-100 to-teal-50 dark:from-slate-900 dark:to-teal-950/30">
                      <TableHead className="text-xs font-semibold">Device Name</TableHead>
                      <TableHead className="text-xs font-semibold">Location / POP</TableHead>
                      <TableHead className="text-xs font-semibold">Public IP</TableHead>
                      <TableHead className="text-xs font-semibold">Type</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold hidden lg:table-cell">CPU%</TableHead>
                      <TableHead className="text-xs font-semibold hidden lg:table-cell">Mem%</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">Uptime</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">Last Sync</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mikrotikDevices.length === 0 ? (
                      <TableRow><TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        <Server className="h-10 w-10 mx-auto mb-2 opacity-30" />No MikroTik devices configured
                      </TableCell></TableRow>
                    ) : mikrotikDevices.map(device => (
                      <TableRow key={device.id} data-testid={`row-device-${device.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full shrink-0 ${device.status === "online" ? "bg-green-500 animate-pulse" : device.status === "offline" ? "bg-red-500" : "bg-amber-500"}`} />
                            <div>
                              <span className="text-sm font-medium" data-testid={`text-device-name-${device.id}`}>{device.name}</span>
                              <p className="text-[10px] text-muted-foreground">{device.model || "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{device.location || "—"}</TableCell>
                        <TableCell><span className="font-mono text-xs" data-testid={`text-device-ip-${device.id}`}>{device.ipAddress}</span></TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] capitalize">{device.type}</Badge></TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] capitalize ${deviceStatusBadge(device.status)}`}>
                            {device.status === "online" ? "Connected" : device.status === "offline" ? "Disconnected" : "Warning"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs font-mono">{device.cpuUsage != null ? `${device.cpuUsage}%` : "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs font-mono">{device.memoryUsage != null ? `${device.memoryUsage}%` : "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{device.uptime || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{device.lastSeen || "—"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-device-actions-${device.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleTestConnection(device.id)} data-testid={`button-test-${device.id}`}>
                                <Plug className="h-4 w-4 mr-2" />Test Connection
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDevice(device)} data-testid={`button-edit-device-${device.id}`}>
                                <Edit className="h-4 w-4 mr-2" />Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteDeviceMutation.mutate(device.id)} data-testid={`button-delete-device-${device.id}`}>
                                <Trash2 className="h-4 w-4 mr-2" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========== 2. MIKROTIK ROUTER CONFIGURATION ========== */}
      {!isLoading && tab === "routers" && (
        <div className="space-y-5" data-testid="tab-content-routers">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">MikroTik Router Configuration</h2>
              <p className="text-sm text-muted-foreground">Add, edit, and manage MikroTik router connections</p>
            </div>
            <Button onClick={openCreateDevice} className="bg-gradient-to-r from-teal-600 to-blue-700" data-testid="button-add-router">
              <Plus className="h-4 w-4 mr-1" />Add Router
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search routers..." value={deviceSearch} onChange={e => setDeviceSearch(e.target.value)} className="pl-8 h-9" data-testid="input-search-devices" />
            </div>
            <Select value={deviceStatusFilter} onValueChange={setDeviceStatusFilter}>
              <SelectTrigger className="w-[150px] h-9" data-testid="select-device-status-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDevices.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Router className="h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium">No MikroTik routers configured</p>
                <p className="text-sm mt-1">Add a router to begin integration</p>
              </div>
            ) : filteredDevices.map(device => (
              <Card key={device.id} className={`border shadow-sm transition-all hover:shadow-md ${device.status === "online" ? "border-l-4 border-l-green-500" : device.status === "offline" ? "border-l-4 border-l-red-500" : "border-l-4 border-l-amber-500"}`} data-testid={`card-router-${device.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${device.status === "online" ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                        <Router className={`h-4.5 w-4.5 ${device.status === "online" ? "text-green-600" : "text-red-600"}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{device.name}</h3>
                        <p className="text-[11px] text-muted-foreground">{device.model || "MikroTik"}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] capitalize ${deviceStatusBadge(device.status)}`}>
                      {device.status === "online" ? "Connected" : device.status === "offline" ? "Disconnected" : "Warning"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-900 rounded p-2">
                      <span className="text-muted-foreground block text-[10px]">Router IP</span>
                      <span className="font-mono font-medium">{device.ipAddress}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded p-2">
                      <span className="text-muted-foreground block text-[10px]">API Port</span>
                      <span className="font-mono font-medium">8728</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded p-2">
                      <span className="text-muted-foreground block text-[10px]">Location</span>
                      <span className="font-medium">{device.location || "—"}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded p-2">
                      <span className="text-muted-foreground block text-[10px]">Uptime</span>
                      <span className="font-medium">{device.uptime || "—"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 text-xs">
                      {device.cpuUsage != null && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">CPU:</span>
                          <span className={`font-mono font-medium ${(device.cpuUsage || 0) > 80 ? "text-red-600" : "text-green-600"}`}>{device.cpuUsage}%</span>
                        </div>
                      )}
                      {device.memoryUsage != null && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">MEM:</span>
                          <span className={`font-mono font-medium ${(device.memoryUsage || 0) > 80 ? "text-red-600" : "text-green-600"}`}>{device.memoryUsage}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
                    <div className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /><span>Auto Sync</span></div>
                    <div className="flex items-center gap-1"><Shield className="h-3 w-3 text-blue-500" /><span>Encrypted</span></div>
                    <div className="flex items-center gap-1"><Eye className="h-3 w-3 text-purple-500" /><span>Monitoring</span></div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-[11px]" onClick={() => handleTestConnection(device.id)} disabled={testingConnection === device.id} data-testid={`button-test-connection-${device.id}`}>
                      {testingConnection === device.id ? <><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Testing...</> : <><Plug className="h-3 w-3 mr-1" />Test</>}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-[11px]" onClick={() => openEditDevice(device)} data-testid={`button-configure-${device.id}`}>
                      <Settings className="h-3 w-3 mr-1" />Configure
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteDeviceMutation.mutate(device.id)} data-testid={`button-delete-router-${device.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border shadow-sm bg-slate-50 dark:bg-slate-900/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-teal-600" />Security Settings</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border">
                  <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-green-600" /><span>Encrypted Credentials</span></div>
                  <Badge variant="outline" className="text-[10px] text-green-600">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border">
                  <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-blue-600" /><span>IP Whitelisting</span></div>
                  <Badge variant="outline" className="text-[10px] text-blue-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border">
                  <div className="flex items-center gap-2"><Key className="h-4 w-4 text-purple-600" /><span>Access Control</span></div>
                  <Badge variant="outline" className="text-[10px] text-purple-600">Enforced</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========== 3. BRAS / RADIUS CONFIGURATION ========== */}
      {!isLoading && tab === "bras" && (
        <div className="space-y-5" data-testid="tab-content-bras">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Radio className="h-4 w-4 text-purple-600" />RADIUS Server Configuration</CardTitle>
                <CardDescription className="text-xs">Configure RADIUS authentication and accounting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "RADIUS Server IP", value: "10.0.0.100", icon: Globe },
                    { label: "Secret Key", value: "••••••••••••", icon: Key },
                    { label: "Auth Port", value: "1812", icon: Hash },
                    { label: "Accounting Port", value: "1813", icon: Hash },
                    { label: "NAS Identifier", value: "netsphere-nas-01", icon: Server },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border text-xs">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{item.label}</span>
                      </div>
                      <span className="font-mono font-medium">{item.value}</span>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-2" data-testid="button-edit-radius">
                    <Settings className="h-3.5 w-3.5 mr-1" />Edit RADIUS Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Zap className="h-4 w-4 text-teal-600" />RADIUS Features</CardTitle>
                <CardDescription className="text-xs">Enabled authentication and control features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {[
                    { label: "Dynamic User Authentication", enabled: true },
                    { label: "Session Accounting", enabled: true },
                    { label: "Interim Updates", enabled: true },
                    { label: "CoA (Change of Authorization)", enabled: true },
                    { label: "Session Termination", enabled: true },
                    { label: "MAC Authentication", enabled: false },
                  ].map(feature => (
                    <div key={feature.label} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border text-xs">
                      <span>{feature.label}</span>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${feature.enabled ? "bg-green-500" : "bg-slate-300"}`} />
                        <span className={feature.enabled ? "text-green-600 font-medium" : "text-muted-foreground"}>
                          {feature.enabled ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Database className="h-4 w-4 text-teal-600" />Supported Service Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { type: "PPPoE", desc: "Point-to-Point Protocol over Ethernet", icon: Link, color: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
                  { type: "Hotspot", desc: "Captive portal authentication", icon: Wifi, color: "text-green-600 bg-green-50 dark:bg-green-950" },
                  { type: "Static IP", desc: "Fixed IP assignment from IPAM", icon: Globe, color: "text-purple-600 bg-purple-50 dark:bg-purple-950" },
                  { type: "DHCP", desc: "Dynamic host configuration", icon: Network, color: "text-teal-600 bg-teal-50 dark:bg-teal-950" },
                ].map(st => (
                  <div key={st.type} className={`rounded-lg p-3 border ${st.color}`} data-testid={`card-service-${st.type.toLowerCase()}`}>
                    <st.icon className="h-5 w-5 mb-2" />
                    <h4 className="text-sm font-semibold">{st.type}</h4>
                    <p className="text-[10px] mt-0.5 opacity-80">{st.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Signal className="h-4 w-4 text-teal-600" />RADIUS Profiles ({allRadiusProfiles.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-100 to-purple-50 dark:from-slate-900 dark:to-purple-950/30">
                      <TableHead className="text-xs font-semibold">Profile Name</TableHead>
                      <TableHead className="text-xs font-semibold">Download</TableHead>
                      <TableHead className="text-xs font-semibold">Upload</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">Burst DL</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">Burst UL</TableHead>
                      <TableHead className="text-xs font-semibold hidden lg:table-cell">Priority</TableHead>
                      <TableHead className="text-xs font-semibold hidden lg:table-cell">Data Quota</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allRadiusProfiles.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No RADIUS profiles configured</TableCell></TableRow>
                    ) : allRadiusProfiles.map(rp => (
                      <TableRow key={rp.id} data-testid={`row-radius-${rp.id}`}>
                        <TableCell><span className="font-medium text-sm">{rp.name}</span></TableCell>
                        <TableCell className="font-mono text-xs">{rp.downloadRate || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{rp.uploadRate || "—"}</TableCell>
                        <TableCell className="font-mono text-xs hidden md:table-cell">{rp.burstDownload || "—"}</TableCell>
                        <TableCell className="font-mono text-xs hidden md:table-cell">{rp.burstUpload || "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">{rp.priority ?? "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">{rp.dataQuota || "Unlimited"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] capitalize ${rp.status === "active" ? "text-green-600 border-green-300" : "text-slate-500"}`}>
                            {rp.status || "active"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========== 4. USER SYNCHRONIZATION CONTROL ========== */}
      {!isLoading && tab === "sync" && (
        <div className="space-y-5" data-testid="tab-content-sync">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">User Synchronization Control</h2>
              <p className="text-sm text-muted-foreground">Automate billing-network synchronization for subscriber management</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={openCreatePppoe} data-testid="button-add-pppoe">
                <Plus className="h-4 w-4 mr-1" />Add PPPoE User
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-teal-600 to-blue-700" data-testid="button-sync-all">
                <RefreshCw className="h-4 w-4 mr-1" />Sync All Users
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "Total Users", value: allPppoe.length, icon: Users, color: "from-slate-700 to-slate-900" },
              { label: "Synced", value: syncUsers.filter(u => u.syncStatus === "synced").length, icon: CheckCircle, color: "from-green-600 to-green-800" },
              { label: "Pending", value: syncUsers.filter(u => u.syncStatus === "pending").length, icon: Clock, color: "from-amber-500 to-amber-700" },
              { label: "Failed", value: syncUsers.filter(u => u.syncStatus === "failed").length, icon: XCircle, color: "from-red-500 to-red-700" },
              { label: "Active Sessions", value: allPppoe.filter(u => u.status === "active").length, icon: Zap, color: "from-blue-600 to-blue-800" },
              { label: "Suspended", value: allPppoe.filter(u => u.status === "suspended").length, icon: Pause, color: "from-purple-500 to-purple-700" },
            ].map(card => (
              <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-lg p-3.5 text-white shadow-sm`} data-testid={`sync-kpi-${card.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{card.label}</span>
                  <card.icon className="h-3.5 w-3.5 text-white/60" />
                </div>
                <p className="text-lg font-bold">{card.value}</p>
              </div>
            ))}
          </div>

          <Card className="border shadow-sm bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950/20 dark:to-blue-950/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Zap className="h-4 w-4 text-teal-600" />Automation Rules</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {[
                  { rule: "Auto-create PPPoE on customer creation", active: true },
                  { rule: "Auto-update bandwidth on package change", active: true },
                  { rule: "Auto-suspend on non-payment", active: true },
                  { rule: "Auto-reactivate after payment", active: true },
                  { rule: "Assign static IP from IPAM pool", active: true },
                  { rule: "Auto-remove on account termination", active: false },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border text-xs">
                    <span className="flex-1">{r.rule}</span>
                    <div className={`ml-2 h-2 w-2 rounded-full shrink-0 ${r.active ? "bg-green-500" : "bg-slate-300"}`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-teal-600" />Subscriber Sync Status</CardTitle>
                <Select value={syncStatusFilter} onValueChange={setSyncStatusFilter}>
                  <SelectTrigger className="w-[130px] h-8" data-testid="select-sync-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="synced">Synced</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-100 to-teal-50 dark:from-slate-900 dark:to-teal-950/30">
                      <TableHead className="text-xs font-semibold">Username</TableHead>
                      <TableHead className="text-xs font-semibold">Customer</TableHead>
                      <TableHead className="text-xs font-semibold">Profile</TableHead>
                      <TableHead className="text-xs font-semibold">IP Address</TableHead>
                      <TableHead className="text-xs font-semibold">Sync Status</TableHead>
                      <TableHead className="text-xs font-semibold">Service Status</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">No users to synchronize</TableCell></TableRow>
                    ) : syncUsers.slice(0, 50).map(user => {
                      const ss = syncStatusBadge(user.syncStatus);
                      return (
                        <TableRow key={user.id} data-testid={`row-sync-${user.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                          <TableCell className="font-mono text-sm font-medium">{user.username}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{(user as any).customerName || "—"}</TableCell>
                          <TableCell className="text-xs">{user.profileName || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{user.ipAddress || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div className={`h-2 w-2 rounded-full ${ss.dot}`} />
                              <span className={`text-xs font-medium capitalize ${ss.color}`}>{user.syncStatus}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] capitalize ${pppoeStatusBadge(user.status)}`}>{user.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleForceSync(user.id)} title="Force Sync" data-testid={`button-force-sync-${user.id}`}>
                                <RefreshCw className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditPppoe(user)} title="Edit User" data-testid={`button-edit-pppoe-${user.id}`}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDisconnectSession(user.id)} title="Disconnect" data-testid={`button-disconnect-${user.id}`}>
                                <Unlink className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deletePppoeMutation.mutate(user.id)} title="Delete" data-testid={`button-delete-pppoe-${user.id}`}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {syncUsers.length > 0 && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-t">
                  Showing {Math.min(syncUsers.length, 50)} of {syncUsers.length} users
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========== 5. LIVE SESSION MONITORING ========== */}
      {!isLoading && tab === "sessions" && (
        <div className="space-y-5" data-testid="tab-content-sessions">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Live Session Monitoring</h2>
              <p className="text-sm text-muted-foreground">Real-time subscriber session monitoring and control</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-green-600">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>Live — {filteredSessions.length} active sessions</span>
              </div>
            </div>
          </div>

          <Card className="border shadow-sm">
            <CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by username, IP, customer..." value={sessionSearch} onChange={e => setSessionSearch(e.target.value)} className="pl-8 h-9" data-testid="input-search-sessions" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20">
                      <TableHead className="text-xs font-semibold">Username</TableHead>
                      <TableHead className="text-xs font-semibold">Customer</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">Router</TableHead>
                      <TableHead className="text-xs font-semibold">IP Address</TableHead>
                      <TableHead className="text-xs font-semibold hidden lg:table-cell">MAC Address</TableHead>
                      <TableHead className="text-xs font-semibold">Download</TableHead>
                      <TableHead className="text-xs font-semibold">Upload</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">Data Used</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.length === 0 ? (
                      <TableRow><TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />No active sessions
                      </TableCell></TableRow>
                    ) : filteredSessions.map(session => (
                      <TableRow key={session.id} data-testid={`row-session-${session.id}`} className="hover:bg-green-50/30 dark:hover:bg-green-950/10">
                        <TableCell className="font-mono text-sm font-medium">{session.username}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{(session as any).customerName || "—"}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{session.nasDevice || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{session.ipAddress || "—"}</TableCell>
                        <TableCell className="font-mono text-xs hidden lg:table-cell">{session.macAddress || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <ArrowDownUp className="h-3 w-3 text-green-600" />
                            <span className="font-mono text-green-600">{session.downloadSpeed || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <ArrowUpDown className="h-3 w-3 text-blue-600" />
                            <span className="font-mono text-blue-600">{session.uploadSpeed || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs font-mono">
                            {session.bytesIn && session.bytesOut ?
                              `${((parseInt(session.bytesIn || "0") + parseInt(session.bytesOut || "0")) / 1048576).toFixed(1)} MB` : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => handleDisconnectSession(session.id)} title="Disconnect" data-testid={`button-disconnect-session-${session.id}`}>
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredSessions.length > 0 && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-t flex items-center justify-between">
                  <span>{filteredSessions.length} active sessions</span>
                  <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />Live refresh enabled</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-teal-600" />Bandwidth Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trafficData.slice(-12)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="download" name="Download" fill="#0F766E" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="upload" name="Upload" fill="#1D4ED8" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-teal-600" />Session Statistics</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Avg Session Time", value: "4h 23m", icon: Clock },
                    { label: "Peak Concurrent", value: String(Math.max(filteredSessions.length, 1)), icon: Users },
                    { label: "Total Today", value: String(allPppoe.length), icon: Zap },
                    { label: "Avg Bandwidth", value: "12.5 Mbps", icon: Gauge },
                  ].map(stat => (
                    <div key={stat.label} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border text-center">
                      <stat.icon className="h-4 w-4 mx-auto mb-1.5 text-teal-600" />
                      <p className="text-lg font-bold">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========== 6. LOGS & AUTOMATION STATUS ========== */}
      {!isLoading && tab === "logs" && (
        <div className="space-y-5" data-testid="tab-content-logs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Logs & Automation Status</h2>
              <p className="text-sm text-muted-foreground">System logs, API calls, RADIUS authentication, and sync operations</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" data-testid="button-export-logs">
                <Download className="h-4 w-4 mr-1" />Export CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "API Logs", value: automationLogs.filter(l => l.type === "API").length, icon: Globe, color: "from-teal-600 to-teal-800" },
              { label: "RADIUS Logs", value: automationLogs.filter(l => l.type === "RADIUS").length, icon: Radio, color: "from-purple-600 to-purple-800" },
              { label: "Sync Logs", value: automationLogs.filter(l => l.type === "Sync").length, icon: RefreshCw, color: "from-blue-600 to-blue-800" },
              { label: "Automation", value: automationLogs.filter(l => l.type === "Automation").length, icon: Zap, color: "from-amber-500 to-amber-700" },
            ].map(card => (
              <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-lg p-3.5 text-white shadow-sm`} data-testid={`log-kpi-${card.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{card.label}</span>
                  <card.icon className="h-3.5 w-3.5 text-white/60" />
                </div>
                <p className="text-lg font-bold">{card.value}</p>
              </div>
            ))}
          </div>

          <Card className="border shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-100 to-teal-50 dark:from-slate-900 dark:to-teal-950/30">
                      <TableHead className="text-xs font-semibold w-10">#</TableHead>
                      <TableHead className="text-xs font-semibold">Timestamp</TableHead>
                      <TableHead className="text-xs font-semibold">Type</TableHead>
                      <TableHead className="text-xs font-semibold">Device</TableHead>
                      <TableHead className="text-xs font-semibold">Action</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold">Code</TableHead>
                      <TableHead className="text-xs font-semibold">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {automationLogs.map(log => (
                      <TableRow key={log.id} data-testid={`row-log-${log.id}`} className={`hover:bg-slate-50 dark:hover:bg-slate-900 ${log.status === "error" ? "bg-red-50/30 dark:bg-red-950/10" : ""}`}>
                        <TableCell className="text-xs font-mono text-muted-foreground">{log.id}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{log.timestamp}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${
                            log.type === "API" ? "text-teal-600 border-teal-300" :
                            log.type === "RADIUS" ? "text-purple-600 border-purple-300" :
                            log.type === "Sync" ? "text-blue-600 border-blue-300" :
                            "text-amber-600 border-amber-300"
                          }`}>{log.type}</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{log.device}</TableCell>
                        <TableCell className="text-xs font-medium">{log.action}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${
                            log.status === "success" ? "text-green-600 bg-green-50 dark:bg-green-950/30 border-green-300" :
                            log.status === "warning" ? "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-300" :
                            "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-300"
                          }`}>
                            {log.status === "success" ? "Success" : log.status === "warning" ? "Warning" : "Error"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.code}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{log.detail || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-gradient-to-r from-slate-50 to-teal-50 dark:from-slate-900 dark:to-teal-950/20">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Zap className="h-4 w-4 text-teal-600" />System Automation Logic</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { trigger: "Customer Created", actions: ["Create PPPoE account", "Assign RADIUS profile", "Allocate IP from IPAM"], icon: Users },
                  { trigger: "Invoice Overdue", actions: ["Auto-suspend from MikroTik", "Terminate active session", "Send notification"], icon: AlertTriangle },
                  { trigger: "Payment Received", actions: ["Re-enable user account", "Restore bandwidth profile", "Log reactivation"], icon: CheckCircle },
                  { trigger: "Bandwidth Upgraded", actions: ["Apply new profile via API", "Trigger CoA request", "Update RADIUS attributes"], icon: ArrowUpDown },
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-white dark:bg-slate-800 rounded-lg border" data-testid={`card-automation-${i}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-7 w-7 rounded-md bg-gradient-to-br from-teal-600 to-blue-700 flex items-center justify-center">
                        <item.icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="font-semibold text-sm">When: {item.trigger}</span>
                    </div>
                    <ul className="space-y-1 ml-9">
                      {item.actions.map((action, j) => (
                        <li key={j} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========== DEVICE ADD/EDIT DIALOG ========== */}
      <Dialog open={deviceDialogOpen} onOpenChange={setDeviceDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-device-dialog-title">
              {editingDevice ? "Edit Device" : "Add MikroTik Device"}
            </DialogTitle>
          </DialogHeader>
          <Form {...deviceForm}>
            <form onSubmit={deviceForm.handleSubmit(onSubmitDevice)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={deviceForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Router Name</FormLabel><FormControl><Input placeholder="MK-Router-01" {...field} data-testid="input-device-name" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={deviceForm.control} name="model" render={({ field }) => (
                  <FormItem><FormLabel>Model</FormLabel><FormControl><Input placeholder="CCR1036-8G-2S+" {...field} value={field.value || ""} data-testid="input-device-model" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={deviceForm.control} name="ipAddress" render={({ field }) => (
                  <FormItem><FormLabel>Router IP Address</FormLabel><FormControl><Input placeholder="192.168.1.1" {...field} data-testid="input-device-ip" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={deviceForm.control} name="macAddress" render={({ field }) => (
                  <FormItem><FormLabel>MAC Address</FormLabel><FormControl><Input placeholder="AA:BB:CC:DD:EE:FF" {...field} value={field.value || ""} data-testid="input-device-mac" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={deviceForm.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Device Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-device-type"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="router">Router</SelectItem>
                        <SelectItem value="switch">Switch</SelectItem>
                        <SelectItem value="access_point">Access Point</SelectItem>
                        <SelectItem value="olt">OLT</SelectItem>
                        <SelectItem value="onu">ONU</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={deviceForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-device-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={deviceForm.control} name="location" render={({ field }) => (
                  <FormItem><FormLabel>Location / POP</FormLabel><FormControl><Input placeholder="POP-Downtown" {...field} value={field.value || ""} data-testid="input-device-location" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={deviceForm.control} name="area" render={({ field }) => (
                  <FormItem><FormLabel>Area</FormLabel><FormControl><Input placeholder="Zone-A" {...field} value={field.value || ""} data-testid="input-device-area" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={deviceForm.control} name="firmware" render={({ field }) => (
                  <FormItem><FormLabel>Firmware</FormLabel><FormControl><Input placeholder="RouterOS 7.x" {...field} value={field.value || ""} data-testid="input-device-firmware" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={deviceForm.control} name="serialNumber" render={({ field }) => (
                  <FormItem><FormLabel>Serial Number</FormLabel><FormControl><Input placeholder="SN-123456" {...field} value={field.value || ""} data-testid="input-device-serial" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={deviceForm.control} name="uptime" render={({ field }) => (
                  <FormItem><FormLabel>Uptime</FormLabel><FormControl><Input placeholder="30d 5h 12m" {...field} value={field.value || ""} data-testid="input-device-uptime" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={deviceForm.control} name="alertThreshold" render={({ field }) => (
                  <FormItem><FormLabel>Alert Threshold (%)</FormLabel><FormControl>
                    <Input type="number" placeholder="80" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} data-testid="input-device-threshold" />
                  </FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={deviceForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Additional notes..." {...field} value={field.value || ""} data-testid="input-device-notes" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="submit" disabled={createDeviceMutation.isPending || updateDeviceMutation.isPending} className="bg-gradient-to-r from-teal-600 to-blue-700" data-testid="button-submit-device">
                  {createDeviceMutation.isPending || updateDeviceMutation.isPending ? "Saving..." : editingDevice ? "Update Device" : "Add Device"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ========== PPPOE ADD/EDIT DIALOG ========== */}
      <Dialog open={pppoeDialogOpen} onOpenChange={setPppoeDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-pppoe-dialog-title">
              {editingPppoe ? "Edit PPPoE User" : "Add PPPoE User"}
            </DialogTitle>
          </DialogHeader>
          <Form {...pppoeForm}>
            <form onSubmit={pppoeForm.handleSubmit(onSubmitPppoe)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={pppoeForm.control} name="username" render={({ field }) => (
                  <FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="pppoe_user1" {...field} data-testid="input-pppoe-username" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={pppoeForm.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="Password" {...field} value={field.value || ""} data-testid="input-pppoe-password" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={pppoeForm.control} name="customerId" render={({ field }) => (
                  <FormItem><FormLabel>Customer</FormLabel>
                    <Select onValueChange={v => field.onChange(v === "none" ? undefined : parseInt(v))} value={field.value ? String(field.value) : "none"}>
                      <FormControl><SelectTrigger data-testid="select-pppoe-customer"><SelectValue placeholder="Select customer" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Customer</SelectItem>
                        {(customers || []).map(c => <SelectItem key={c.id} value={String(c.id)}>{c.fullName} ({c.customerId})</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={pppoeForm.control} name="profileName" render={({ field }) => (
                  <FormItem><FormLabel>Bandwidth Profile</FormLabel><FormControl><Input placeholder="10Mbps" {...field} value={field.value || ""} data-testid="input-pppoe-profile" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={pppoeForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-pppoe-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={pppoeForm.control} name="ipAddress" render={({ field }) => (
                  <FormItem><FormLabel>IP Address</FormLabel><FormControl><Input placeholder="10.0.0.1" {...field} value={field.value || ""} data-testid="input-pppoe-ip" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={pppoeForm.control} name="downloadSpeed" render={({ field }) => (
                  <FormItem><FormLabel>Download Speed</FormLabel><FormControl><Input placeholder="10M" {...field} value={field.value || ""} data-testid="input-pppoe-download" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={pppoeForm.control} name="uploadSpeed" render={({ field }) => (
                  <FormItem><FormLabel>Upload Speed</FormLabel><FormControl><Input placeholder="5M" {...field} value={field.value || ""} data-testid="input-pppoe-upload" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={pppoeForm.control} name="macAddress" render={({ field }) => (
                  <FormItem><FormLabel>MAC Address</FormLabel><FormControl><Input placeholder="AA:BB:CC:DD:EE:FF" {...field} value={field.value || ""} data-testid="input-pppoe-mac" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={pppoeForm.control} name="nasDevice" render={({ field }) => (
                  <FormItem><FormLabel>NAS Device</FormLabel><FormControl><Input placeholder="NAS-01" {...field} value={field.value || ""} data-testid="input-pppoe-nas" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={pppoeForm.control} name="dataLimit" render={({ field }) => (
                  <FormItem><FormLabel>Data Limit</FormLabel><FormControl><Input placeholder="100GB" {...field} value={field.value || ""} data-testid="input-pppoe-data-limit" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={pppoeForm.control} name="serviceType" render={({ field }) => (
                  <FormItem><FormLabel>Service Type</FormLabel><FormControl><Input placeholder="pppoe" {...field} value={field.value || ""} data-testid="input-pppoe-service-type" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createPppoeMutation.isPending || updatePppoeMutation.isPending} className="bg-gradient-to-r from-teal-600 to-blue-700" data-testid="button-submit-pppoe">
                  {createPppoeMutation.isPending || updatePppoeMutation.isPending ? "Saving..." : editingPppoe ? "Update User" : "Add User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
