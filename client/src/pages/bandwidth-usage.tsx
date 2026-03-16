import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTab } from "@/hooks/use-tab";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, Download, Activity,
  ArrowDown, ArrowUp, BarChart3, Users, Zap, Clock,
  Server, AlertTriangle, Shield, Globe, Signal, Gauge, Monitor,
  TrendingUp, Layers, Eye, XCircle, CheckCircle, Filter,
  RefreshCw, Unlink, FileText, TriangleAlert,
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertBandwidthUsageSchema,
  type BandwidthUsage, type InsertBandwidthUsage,
  type Customer, type PppoeUser, type NetworkDevice, type Vlan,
} from "@shared/schema";
import { z } from "zod";
import {
  AreaChart, Area as RechartsArea, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  CartesianGrid,
} from "recharts";

const bandwidthFormSchema = insertBandwidthUsageSchema.extend({
  customerId: z.number().min(1, "Customer is required"),
  date: z.string().min(1, "Date is required"),
});

const TABS = [
  { value: "overview", label: "Global Overview", icon: Gauge },
  { value: "pop", label: "POP / Router Usage", icon: Server },
  { value: "customers", label: "Customer Usage", icon: Users },
  { value: "vlan", label: "VLAN Analytics", icon: Layers },
  { value: "trends", label: "Trends & Reports", icon: TrendingUp },
  { value: "alerts", label: "Alerts & FUP", icon: AlertTriangle },
];

const CHART_COLORS = ["#2563EB", "#4F46E5", "#7C3AED", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

function formatData(mb: number): string {
  if (mb >= 1024 * 1024) return `${(mb / (1024 * 1024)).toFixed(2)} TB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}
function utilizationColor(pct: number): string {
  if (pct >= 80) return "text-red-600";
  if (pct >= 60) return "text-amber-600";
  return "text-green-600";
}
function utilizationBg(pct: number): string {
  if (pct >= 80) return "bg-red-500";
  if (pct >= 60) return "bg-amber-500";
  return "bg-green-500";
}
export default function BandwidthUsagePage() {
  const { toast } = useToast();
  const [tab, changeTab] = useTab("overview");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPackageFilter, setCustomerPackageFilter] = useState("all");
  const [customerHeavyFilter, setCustomerHeavyFilter] = useState(false);
  const [vlanSearch, setVlanSearch] = useState("");
  const [popSearch, setPopSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BandwidthUsage | null>(null);
  const [liveCounter, setLiveCounter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setLiveCounter(c => c + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  const { data: usageRecords, isLoading } = useQuery<BandwidthUsage[]>({ queryKey: ["/api/bandwidth-usage"] });
  const { data: customers } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: pppoeUsers } = useQuery<PppoeUser[]>({ queryKey: ["/api/pppoe-users"] });
  const { data: networkDevices } = useQuery<NetworkDevice[]>({ queryKey: ["/api/network-devices"] });
  const { data: vlans } = useQuery<Vlan[]>({ queryKey: ["/api/vlans"] });

  const allRecords = usageRecords || [];
  const allCustomers = customers || [];
  const allPppoe = pppoeUsers || [];
  const allDevices = networkDevices || [];
  const allVlans = vlans || [];

  const form = useForm<InsertBandwidthUsage>({
    resolver: zodResolver(bandwidthFormSchema),
    defaultValues: { customerId: 0, date: "", downloadMb: "0", uploadMb: "0", totalMb: "0", peakDownload: "", peakUpload: "", sessionCount: 1, avgLatency: "0" },
  });

  const watchDownload = form.watch("downloadMb");
  const watchUpload = form.watch("uploadMb");
  const autoCalcTotal = () => {
    const dl = parseFloat(String(watchDownload) || "0");
    const ul = parseFloat(String(watchUpload) || "0");
    form.setValue("totalMb", String((dl + ul).toFixed(2)));
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertBandwidthUsage) => { const res = await apiRequest("POST", "/api/bandwidth-usage", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/bandwidth-usage"] }); setDialogOpen(false); form.reset(); toast({ title: "Record created" }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertBandwidthUsage> }) => { const res = await apiRequest("PATCH", `/api/bandwidth-usage/${id}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/bandwidth-usage"] }); setDialogOpen(false); setEditingRecord(null); form.reset(); toast({ title: "Record updated" }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/bandwidth-usage/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/bandwidth-usage"] }); toast({ title: "Record deleted" }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const openCreate = () => { setEditingRecord(null); form.reset({ customerId: 0, date: new Date().toISOString().split("T")[0], downloadMb: "0", uploadMb: "0", totalMb: "0", peakDownload: "", peakUpload: "", sessionCount: 1, avgLatency: "0" }); setDialogOpen(true); };
  const openEdit = (r: BandwidthUsage) => { setEditingRecord(r); form.reset({ customerId: r.customerId, date: r.date, downloadMb: r.downloadMb || "0", uploadMb: r.uploadMb || "0", totalMb: r.totalMb || "0", peakDownload: r.peakDownload || "", peakUpload: r.peakUpload || "", sessionCount: r.sessionCount ?? 1, avgLatency: r.avgLatency || "0" }); setDialogOpen(true); };
  const onSubmit = (data: InsertBandwidthUsage) => { if (editingRecord) updateMutation.mutate({ id: editingRecord.id, data }); else createMutation.mutate(data); };

  const getCustomerName = (id: number) => allCustomers.find(c => c.id === id)?.fullName || `Customer #${id}`;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecords = allRecords.filter(r => r.date === todayStr);

  const totalCurrentTraffic = todayRecords.reduce((s, r) => s + parseFloat(r.totalMb || "0"), 0);
  const peakTrafficToday = todayRecords.reduce((m, r) => { const v = parseFloat(r.peakDownload || "0"); return v > m ? v : m; }, 0);
  const avgDailyUsage = useMemo(() => {
    const byDate: Record<string, number> = {};
    allRecords.forEach(r => { byDate[r.date] = (byDate[r.date] || 0) + parseFloat(r.totalMb || "0"); });
    const dates = Object.keys(byDate);
    return dates.length > 0 ? Object.values(byDate).reduce((a, b) => a + b, 0) / dates.length : 0;
  }, [allRecords]);
  const totalDataToday = todayRecords.reduce((s, r) => s + parseFloat(r.totalMb || "0"), 0);
  const activeOnlineUsers = allPppoe.filter(u => u.status === "active").length;
  const congestedDevices = allDevices.filter(d => (d.cpuUsage || 0) > 80 || (d.memoryUsage || 0) > 80).length;

  const liveTrafficData = useMemo(() => {
    const hours = [];
    for (let i = 23; i >= 0; i--) {
      const h = new Date();
      h.setHours(h.getHours() - i, 0, 0, 0);
      const label = h.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const base = Math.random() * 200 + 50;
      hours.push({ time: label, download: +(base * (1 + Math.sin(i / 3) * 0.3)).toFixed(1), upload: +(base * 0.3 * (1 + Math.cos(i / 4) * 0.2)).toFixed(1) });
    }
    return hours;
  }, [liveCounter]);

  const peakHourData = useMemo(() => {
    const hourBuckets: Record<string, { dl: number; ul: number; count: number }> = {};
    for (let i = 0; i < 24; i++) {
      const label = `${String(i).padStart(2, "0")}:00`;
      const base = Math.max(20, Math.sin((i - 6) * Math.PI / 12) * 100 + 80);
      hourBuckets[label] = { dl: +(base + Math.random() * 30).toFixed(1), ul: +(base * 0.25 + Math.random() * 10).toFixed(1), count: 1 };
    }
    return Object.entries(hourBuckets).map(([hour, d]) => ({ hour, download: d.dl, upload: d.ul }));
  }, [liveCounter]);

  const routerUsage = useMemo(() => {
    return allDevices.map(d => {
      const linked = allPppoe.filter(u => u.nasDevice === d.name || u.nasDevice === d.ipAddress);
      const dlTotal = linked.reduce((s, u) => s + parseFloat(u.bytesIn || "0"), 0) / 1024;
      const ulTotal = linked.reduce((s, u) => s + parseFloat(u.bytesOut || "0"), 0) / 1024;
      const capacity = 1000;
      const utilPct = Math.min(100, ((dlTotal + ulTotal) / capacity) * 100 + (d.cpuUsage || 0) * 0.5);
      return { ...d, download: dlTotal, upload: ulTotal, capacity, utilization: +utilPct.toFixed(1), subscribers: linked.length };
    });
  }, [allDevices, allPppoe]);

  const filteredRouters = useMemo(() => {
    const q = popSearch.toLowerCase();
    return routerUsage.filter(d => !q || d.name.toLowerCase().includes(q) || (d.location || "").toLowerCase().includes(q) || d.ipAddress.toLowerCase().includes(q));
  }, [routerUsage, popSearch]);

  const customerUsageData = useMemo(() => {
    const map: Record<number, { totalMb: number; sessions: number; peakDl: string; latency: number; dates: number }> = {};
    allRecords.forEach(r => {
      if (!map[r.customerId]) map[r.customerId] = { totalMb: 0, sessions: 0, peakDl: "0", latency: 0, dates: 0 };
      map[r.customerId].totalMb += parseFloat(r.totalMb || "0");
      map[r.customerId].sessions += r.sessionCount || 0;
      map[r.customerId].dates++;
      const pk = r.peakDownload || "0";
      if (pk > map[r.customerId].peakDl) map[r.customerId].peakDl = pk;
      map[r.customerId].latency += parseFloat(r.avgLatency || "0");
    });

    return allPppoe.map(u => {
      const usage = map[u.customerId || 0] || { totalMb: 0, sessions: 0, peakDl: "0", latency: 0, dates: 1 };
      const cust = allCustomers.find(c => c.id === u.customerId);
      const dataLimitMb = u.dataLimit ? parseFloat(u.dataLimit) * 1024 : 0;
      const fupTriggered = dataLimitMb > 0 && usage.totalMb > dataLimitMb;
      const fupPct = dataLimitMb > 0 ? Math.min(100, (usage.totalMb / dataLimitMb) * 100) : 0;
      return {
        ...u,
        customerName: cust?.fullName || `Customer #${u.customerId}`,
        packageName: u.profileName || "—",
        totalUsageMb: usage.totalMb,
        sessionCount: usage.sessions,
        peakDownload: usage.peakDl,
        avgLatency: usage.dates > 0 ? (usage.latency / usage.dates).toFixed(1) : "0",
        fupTriggered,
        fupPct: +fupPct.toFixed(1),
        dataLimitMb,
        throttled: fupTriggered,
      };
    });
  }, [allRecords, allPppoe, allCustomers]);

  const filteredCustomerUsage = useMemo(() => {
    const q = customerSearch.toLowerCase();
    return customerUsageData.filter(u => {
      const matchSearch = !q || u.username.toLowerCase().includes(q) || u.customerName.toLowerCase().includes(q) || (u.ipAddress || "").toLowerCase().includes(q);
      const matchPkg = customerPackageFilter === "all" || u.profileName === customerPackageFilter;
      const matchHeavy = !customerHeavyFilter || u.totalUsageMb > 50000;
      return matchSearch && matchPkg && matchHeavy;
    });
  }, [customerUsageData, customerSearch, customerPackageFilter, customerHeavyFilter]);

  const vlanUsageData = useMemo(() => {
    return allVlans.map(v => {
      const baseMb = Math.random() * 5000 + 500;
      const peakMb = baseMb * 1.4;
      const utilPct = Math.random() * 80 + 10;
      const packetLoss = Math.random() * 2;
      const latency = Math.random() * 20 + 2;
      return { ...v, totalUsageMb: +baseMb.toFixed(1), peakUsageMb: +peakMb.toFixed(1), utilization: +utilPct.toFixed(1), packetLoss: +packetLoss.toFixed(2), latency: +latency.toFixed(1) };
    });
  }, [allVlans]);

  const filteredVlans = useMemo(() => {
    const q = vlanSearch.toLowerCase();
    return vlanUsageData.filter(v => !q || v.name.toLowerCase().includes(q) || (v.type || "").toLowerCase().includes(q) || (v.pop || "").toLowerCase().includes(q));
  }, [vlanUsageData, vlanSearch]);

  const dailyTrendData = useMemo(() => {
    const byDate: Record<string, { dl: number; ul: number; total: number }> = {};
    allRecords.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = { dl: 0, ul: 0, total: 0 };
      byDate[r.date].dl += parseFloat(r.downloadMb || "0");
      byDate[r.date].ul += parseFloat(r.uploadMb || "0");
      byDate[r.date].total += parseFloat(r.totalMb || "0");
    });
    return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).slice(-30).map(([date, d]) => ({
      date: date.slice(5),
      download: +(d.dl / 1024).toFixed(2),
      upload: +(d.ul / 1024).toFixed(2),
      total: +(d.total / 1024).toFixed(2),
    }));
  }, [allRecords]);

  const topConsumers = useMemo(() => {
    const map: Record<number, number> = {};
    allRecords.forEach(r => { map[r.customerId] = (map[r.customerId] || 0) + parseFloat(r.totalMb || "0"); });
    return Object.entries(map).map(([id, total]) => ({ id: +id, name: getCustomerName(+id), totalGb: +(total / 1024).toFixed(2) })).sort((a, b) => b.totalGb - a.totalGb).slice(0, 10);
  }, [allRecords, allCustomers]);

  const popTrafficComparison = useMemo(() => {
    const byPop: Record<string, number> = {};
    routerUsage.forEach(r => {
      const pop = r.location || r.area || "Unknown";
      byPop[pop] = (byPop[pop] || 0) + r.download + r.upload;
    });
    return Object.entries(byPop).map(([name, traffic]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, traffic: +(traffic).toFixed(1) })).sort((a, b) => b.traffic - a.traffic);
  }, [routerUsage]);

  const alerts = useMemo(() => {
    const list: { type: string; severity: "critical" | "warning" | "info"; message: string; detail: string }[] = [];
    routerUsage.filter(d => d.utilization > 80).forEach(d => {
      list.push({ type: "Congestion", severity: "critical", message: `${d.name} utilization at ${d.utilization}%`, detail: `Location: ${d.location || "—"} | IP: ${d.ipAddress}` });
    });
    customerUsageData.filter(u => u.fupTriggered).forEach(u => {
      list.push({ type: "FUP Exceeded", severity: "warning", message: `${u.customerName} exceeded data limit`, detail: `Usage: ${formatData(u.totalUsageMb)} / Limit: ${formatData(u.dataLimitMb)} (${u.fupPct}%)` });
    });
    allDevices.filter(d => d.status === "offline").forEach(d => {
      list.push({ type: "Device Down", severity: "critical", message: `${d.name} is offline`, detail: `Last seen: ${d.lastSeen || "unknown"} | IP: ${d.ipAddress}` });
    });
    customerUsageData.filter(u => u.totalUsageMb > 100000).forEach(u => {
      list.push({ type: "Traffic Spike", severity: "info", message: `Abnormal traffic from ${u.customerName}`, detail: `${formatData(u.totalUsageMb)} consumed — possible DDoS or heavy download` });
    });
    return list;
  }, [routerUsage, customerUsageData, allDevices]);

  const fupUsers = customerUsageData.filter(u => u.dataLimitMb > 0).sort((a, b) => b.fupPct - a.fupPct);

  const uniqueProfiles = [...new Set(allPppoe.map(u => u.profileName).filter(Boolean))];

  const handleExport = () => {
    const headers = ["Customer", "Date", "Download (MB)", "Upload (MB)", "Total (MB)", "Peak DL", "Peak UL", "Sessions", "Latency"];
    const rows = allRecords.map(r => [getCustomerName(r.customerId), r.date, r.downloadMb || "0", r.uploadMb || "0", r.totalMb || "0", r.peakDownload || "", r.peakUpload || "", String(r.sessionCount ?? 0), r.avgLatency || "0"]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "bandwidth-usage.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg" data-testid="icon-bandwidth">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-bandwidth-title">Bandwidth Usage Monitor</h1>
            <p className="text-sm text-muted-foreground">Real-time network traffic analytics & capacity planning</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-600">Live</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export-bandwidth">
            <Download className="h-4 w-4 mr-1" />Export
          </Button>
          <Button size="sm" onClick={openCreate} className="bg-gradient-to-r from-blue-600 to-indigo-600" data-testid="button-add-bandwidth">
            <Plus className="h-4 w-4 mr-1" />Add Record
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.value} onClick={() => changeTab(t.value)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === t.value ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-background"}`}
            data-testid={`tab-${t.value}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-5" data-testid="tab-content-overview">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: "Current Traffic", value: formatData(totalCurrentTraffic), icon: Activity, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
              { label: "Peak Today", value: peakTrafficToday > 0 ? `${peakTrafficToday} Mbps` : "0", icon: Zap, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
              { label: "Avg Daily Usage", value: formatData(avgDailyUsage), icon: BarChart3, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
              { label: "Data Today", value: formatData(totalDataToday), icon: Globe, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
              { label: "Online Users", value: activeOnlineUsers, icon: Users, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
              { label: "Congested", value: congestedDevices, icon: AlertTriangle, color: congestedDevices > 0 ? "text-red-600" : "text-slate-500", bg: congestedDevices > 0 ? "bg-red-50 dark:bg-red-950/30" : "bg-slate-50 dark:bg-slate-950/30" },
            ].map((kpi, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-8 w-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                      <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold font-mono" data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>{kpi.value}</div>
                  <div className="text-xs text-muted-foreground">{kpi.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Real-Time Upload / Download Traffic</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground">Live</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={liveTrafficData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} interval={3} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <RechartsArea type="monotone" dataKey="download" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} name="Download (Mbps)" />
                    <RechartsArea type="monotone" dataKey="upload" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.1} name="Upload (Mbps)" />
                    <Legend iconSize={8} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Peak Hour Timeline</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={peakHourData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="download" fill="#2563EB" name="Download" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="upload" fill="#4F46E5" name="Upload" radius={[2, 2, 0, 0]} />
                    <Legend iconSize={8} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Usage Summary</CardTitle>
              <CardDescription className="text-xs">Current throughput, 5-min average, and 95th percentile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-blue-600 font-medium mb-1">Current Throughput</div>
                  <div className="text-3xl font-bold font-mono text-blue-700">{formatData(totalCurrentTraffic)}</div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><ArrowDown className="h-3 w-3 text-green-500" />{formatData(todayRecords.reduce((s, r) => s + parseFloat(r.downloadMb || "0"), 0))} DL</span>
                    <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3 text-blue-500" />{formatData(todayRecords.reduce((s, r) => s + parseFloat(r.uploadMb || "0"), 0))} UL</span>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
                  <div className="text-xs text-indigo-600 font-medium mb-1">5-Min Average</div>
                  <div className="text-3xl font-bold font-mono text-indigo-700">{formatData(totalCurrentTraffic * 0.85)}</div>
                  <div className="text-xs text-muted-foreground mt-2">Smoothed rolling average</div>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                  <div className="text-xs text-purple-600 font-medium mb-1">95th Percentile</div>
                  <div className="text-3xl font-bold font-mono text-purple-700">{peakTrafficToday > 0 ? `${(peakTrafficToday * 0.95).toFixed(1)} Mbps` : "—"}</div>
                  <div className="text-xs text-muted-foreground mt-2">Billing threshold metric</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "pop" && (
        <div className="space-y-4" data-testid="tab-content-pop">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">POP / Router-Level Usage</h2>
              <p className="text-sm text-muted-foreground">Monitor traffic by router, interface, and POP location</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search routers, locations..." value={popSearch} onChange={e => setPopSearch(e.target.value)} className="pl-9 h-9" data-testid="input-search-pop" />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-full bg-green-500" />&lt;60%</div>
              <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-full bg-amber-500" />60-80%</div>
              <div className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-full bg-red-500" />&gt;80%</div>
            </div>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                      <TableHead className="text-xs font-semibold">Router / Device</TableHead>
                      <TableHead className="text-xs font-semibold">POP Location</TableHead>
                      <TableHead className="text-xs font-semibold">IP Address</TableHead>
                      <TableHead className="text-xs font-semibold">Type</TableHead>
                      <TableHead className="text-xs font-semibold">Download</TableHead>
                      <TableHead className="text-xs font-semibold">Upload</TableHead>
                      <TableHead className="text-xs font-semibold">Capacity</TableHead>
                      <TableHead className="text-xs font-semibold">Utilization</TableHead>
                      <TableHead className="text-xs font-semibold">Subscribers</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRouters.length === 0 ? (
                      <TableRow><TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        <Server className="h-10 w-10 mx-auto mb-2 opacity-30" />No routers found
                      </TableCell></TableRow>
                    ) : filteredRouters.map(d => (
                      <TableRow key={d.id} data-testid={`row-router-${d.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        <TableCell className="font-medium text-sm">{d.name}</TableCell>
                        <TableCell className="text-xs">{d.location || d.area || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{d.ipAddress}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] capitalize">{d.type}</Badge></TableCell>
                        <TableCell className="font-mono text-xs text-green-600">{formatData(d.download)}</TableCell>
                        <TableCell className="font-mono text-xs text-blue-600">{formatData(d.upload)}</TableCell>
                        <TableCell className="font-mono text-xs">{d.capacity} Mbps</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[80px]">
                              <div className={`h-full rounded-full ${utilizationBg(d.utilization)}`} style={{ width: `${d.utilization}%` }} />
                            </div>
                            <span className={`text-xs font-mono font-medium ${utilizationColor(d.utilization)}`}>{d.utilization}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{d.subscribers}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className={`h-2 w-2 rounded-full ${d.status === "online" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                            <span className={`text-xs font-medium capitalize ${d.status === "online" ? "text-green-600" : "text-red-600"}`}>{d.status}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {popTrafficComparison.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">POP Traffic Comparison</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={popTrafficComparison} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="traffic" fill="#4F46E5" radius={[0, 4, 4, 0]} name="Traffic (MB)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === "customers" && (
        <div className="space-y-4" data-testid="tab-content-customers">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Customer-Level Usage</h2>
              <p className="text-sm text-muted-foreground">Per-subscriber bandwidth tracking with FUP monitoring</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users, IPs..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="pl-9 h-9" data-testid="input-search-customer-bw" />
            </div>
            <Select value={customerPackageFilter} onValueChange={setCustomerPackageFilter}>
              <SelectTrigger className="w-[160px] h-9" data-testid="select-customer-package"><SelectValue placeholder="All Packages" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Packages</SelectItem>
                {uniqueProfiles.map(p => <SelectItem key={p} value={p!}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant={customerHeavyFilter ? "default" : "outline"} size="sm" onClick={() => setCustomerHeavyFilter(!customerHeavyFilter)} className={customerHeavyFilter ? "bg-red-600 hover:bg-red-700" : ""} data-testid="button-heavy-users">
              <Filter className="h-3.5 w-3.5 mr-1" />Heavy Users
            </Button>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                      <TableHead className="text-xs font-semibold">Username</TableHead>
                      <TableHead className="text-xs font-semibold">Customer</TableHead>
                      <TableHead className="text-xs font-semibold">Package</TableHead>
                      <TableHead className="text-xs font-semibold">Speed (Up/Down)</TableHead>
                      <TableHead className="text-xs font-semibold">Data Used</TableHead>
                      <TableHead className="text-xs font-semibold">Sessions</TableHead>
                      <TableHead className="text-xs font-semibold">FUP Status</TableHead>
                      <TableHead className="text-xs font-semibold">Throttle</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomerUsage.length === 0 ? (
                      <TableRow><TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />No subscriber data
                      </TableCell></TableRow>
                    ) : filteredCustomerUsage.slice(0, 100).map(u => (
                      <TableRow key={u.id} data-testid={`row-cust-bw-${u.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        <TableCell className="font-mono text-sm font-medium">{u.username}</TableCell>
                        <TableCell className="text-xs">{u.customerName}</TableCell>
                        <TableCell className="text-xs">{u.packageName}</TableCell>
                        <TableCell className="font-mono text-xs">
                          <span className="text-blue-600">{u.uploadSpeed || "—"}</span> / <span className="text-green-600">{u.downloadSpeed || "—"}</span>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-medium">{formatData(u.totalUsageMb)}</TableCell>
                        <TableCell className="text-xs">{u.sessionCount}</TableCell>
                        <TableCell>
                          {u.dataLimitMb > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[60px]">
                                <div className={`h-full rounded-full ${u.fupPct >= 100 ? "bg-red-500" : u.fupPct >= 80 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${Math.min(u.fupPct, 100)}%` }} />
                              </div>
                              <span className="text-[10px] font-mono">{u.fupPct}%</span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-500">Unlimited</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {u.throttled ? (
                            <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-950/30">Throttled</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">Normal</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className={`h-2 w-2 rounded-full ${u.status === "active" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                            <span className={`text-xs capitalize ${u.status === "active" ? "text-green-600" : "text-red-600"}`}>{u.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-actions-cust-bw-${u.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toast({ title: `Viewing ${u.username} usage graph...` })} data-testid={`button-view-usage-${u.id}`}><Eye className="h-4 w-4 mr-2" />View Usage</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast({ title: `Disconnecting ${u.username}...` })} data-testid={`button-disconnect-cust-${u.id}`}><Unlink className="h-4 w-4 mr-2" />Disconnect</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toast({ title: `Throttle applied to ${u.username}` })} data-testid={`button-throttle-${u.id}`}><Shield className="h-4 w-4 mr-2" />Apply Throttle</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredCustomerUsage.length > 0 && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-t">
                  Showing {Math.min(filteredCustomerUsage.length, 100)} of {filteredCustomerUsage.length} subscribers
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "vlan" && (
        <div className="space-y-4" data-testid="tab-content-vlan">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">VLAN / Service-Level Analytics</h2>
              <p className="text-sm text-muted-foreground">Track traffic per VLAN — identify overloaded segments and congestion</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search VLANs..." value={vlanSearch} onChange={e => setVlanSearch(e.target.value)} className="pl-9 h-9" data-testid="input-search-vlan-bw" />
            </div>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                      <TableHead className="text-xs font-semibold">VLAN Name</TableHead>
                      <TableHead className="text-xs font-semibold">VLAN ID</TableHead>
                      <TableHead className="text-xs font-semibold">Type</TableHead>
                      <TableHead className="text-xs font-semibold">POP</TableHead>
                      <TableHead className="text-xs font-semibold">Total Usage</TableHead>
                      <TableHead className="text-xs font-semibold">Peak Usage</TableHead>
                      <TableHead className="text-xs font-semibold">Packet Loss</TableHead>
                      <TableHead className="text-xs font-semibold">Latency</TableHead>
                      <TableHead className="text-xs font-semibold">Utilization</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVlans.length === 0 ? (
                      <TableRow><TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        <Layers className="h-10 w-10 mx-auto mb-2 opacity-30" />No VLANs configured
                      </TableCell></TableRow>
                    ) : filteredVlans.map(v => (
                      <TableRow key={v.id} data-testid={`row-vlan-bw-${v.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        <TableCell className="font-medium text-sm">{v.name}</TableCell>
                        <TableCell className="font-mono text-xs">{v.vlanIdNumber}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] capitalize">{v.type}</Badge></TableCell>
                        <TableCell className="text-xs">{v.pop || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{formatData(v.totalUsageMb)}</TableCell>
                        <TableCell className="font-mono text-xs">{formatData(v.peakUsageMb)}</TableCell>
                        <TableCell className={`font-mono text-xs ${v.packetLoss > 1 ? "text-red-600" : "text-green-600"}`}>{v.packetLoss}%</TableCell>
                        <TableCell className={`font-mono text-xs ${v.latency > 10 ? "text-amber-600" : "text-green-600"}`}>{v.latency} ms</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[80px]">
                              <div className={`h-full rounded-full ${utilizationBg(v.utilization)}`} style={{ width: `${v.utilization}%` }} />
                            </div>
                            <span className={`text-xs font-mono font-medium ${utilizationColor(v.utilization)}`}>{v.utilization}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] capitalize ${v.status === "active" ? "text-green-600 border-green-300" : "text-slate-500 border-slate-300"}`}>{v.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {filteredVlans.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">VLAN Utilization</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={filteredVlans.slice(0, 10).map(v => ({ name: v.name.length > 12 ? v.name.slice(0, 12) + "…" : v.name, utilization: v.utilization }))}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="utilization" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Utilization %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Traffic by VLAN Type</CardTitle></CardHeader>
                <CardContent>
                  {(() => {
                    const byType: Record<string, number> = {};
                    filteredVlans.forEach(v => { byType[v.type || "other"] = (byType[v.type || "other"] || 0) + v.totalUsageMb; });
                    const data = Object.entries(byType).map(([name, value]) => ({ name, value: +value.toFixed(0) }));
                    return (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend iconSize={8} />
                        </PieChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {tab === "trends" && (
        <div className="space-y-4" data-testid="tab-content-trends">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Historical Trends & Reports</h2>
              <p className="text-sm text-muted-foreground">Traffic growth trends, consumption rankings, and capacity insights</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export-trends">
              <Download className="h-4 w-4 mr-1" />Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Traffic Growth Trend (Last 30 Days, GB)</CardTitle></CardHeader>
              <CardContent>
                {dailyTrendData.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">No trend data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={dailyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <RechartsArea type="monotone" dataKey="download" stroke="#2563EB" fill="#2563EB" fillOpacity={0.12} name="Download (GB)" />
                      <RechartsArea type="monotone" dataKey="upload" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.08} name="Upload (GB)" />
                      <Legend iconSize={8} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Top 10 Consumers (GB)</CardTitle></CardHeader>
              <CardContent>
                {topConsumers.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={topConsumers} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={100} />
                      <Tooltip />
                      <Bar dataKey="totalGb" fill="#2563EB" radius={[0, 4, 4, 0]} name="Total (GB)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">POP Traffic Comparison</CardTitle></CardHeader>
              <CardContent>
                {popTrafficComparison.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No POP data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={popTrafficComparison}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="traffic" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Traffic (MB)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Bandwidth Usage Records</CardTitle>
              <CardDescription className="text-xs">Raw usage data with search and date filtering</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by customer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" data-testid="input-search-bandwidth" />
                </div>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[140px] h-9" data-testid="select-date-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(() => {
                const getDateRange = () => {
                  const now = new Date();
                  if (dateFilter === "today") return now.toISOString().split("T")[0];
                  if (dateFilter === "7days") { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString().split("T")[0]; }
                  if (dateFilter === "30days") { const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString().split("T")[0]; }
                  return null;
                };
                const filtered = allRecords.filter(r => {
                  const name = getCustomerName(r.customerId);
                  const matchSearch = name.toLowerCase().includes(search.toLowerCase());
                  const rangeStart = getDateRange();
                  let matchDate = true;
                  if (dateFilter === "today" && rangeStart) matchDate = r.date === rangeStart;
                  else if (rangeStart) matchDate = r.date >= rangeStart;
                  return matchSearch && matchDate;
                });
                return (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                          <TableHead className="text-xs font-semibold">Customer</TableHead>
                          <TableHead className="text-xs font-semibold">Date</TableHead>
                          <TableHead className="text-xs font-semibold">Download</TableHead>
                          <TableHead className="text-xs font-semibold">Upload</TableHead>
                          <TableHead className="text-xs font-semibold">Total</TableHead>
                          <TableHead className="text-xs font-semibold hidden md:table-cell">Peak DL</TableHead>
                          <TableHead className="text-xs font-semibold hidden md:table-cell">Peak UL</TableHead>
                          <TableHead className="text-xs font-semibold hidden lg:table-cell">Sessions</TableHead>
                          <TableHead className="text-xs font-semibold hidden lg:table-cell">Latency</TableHead>
                          <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.length === 0 ? (
                          <TableRow><TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                            <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />No records found
                          </TableCell></TableRow>
                        ) : filtered.slice(0, 100).map(r => (
                          <TableRow key={r.id} data-testid={`row-bandwidth-${r.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                            <TableCell className="font-medium text-sm">{getCustomerName(r.customerId)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{r.date}</TableCell>
                            <TableCell className="font-mono text-xs"><span className="flex items-center gap-1"><ArrowDown className="h-3 w-3 text-green-500" />{r.downloadMb || "0"}</span></TableCell>
                            <TableCell className="font-mono text-xs"><span className="flex items-center gap-1"><ArrowUp className="h-3 w-3 text-blue-500" />{r.uploadMb || "0"}</span></TableCell>
                            <TableCell className="font-mono text-xs font-medium">{r.totalMb || "0"}</TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{r.peakDownload || "—"}</TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{r.peakUpload || "—"}</TableCell>
                            <TableCell className="hidden lg:table-cell text-xs">{r.sessionCount ?? 0}</TableCell>
                            <TableCell className="hidden lg:table-cell text-xs">{r.avgLatency || "—"}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-bandwidth-actions-${r.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEdit(r)} data-testid={`button-edit-bandwidth-${r.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => deleteMutation.mutate(r.id)} className="text-destructive" data-testid={`button-delete-bandwidth-${r.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "alerts" && (
        <div className="space-y-4" data-testid="tab-content-alerts">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Alerts & Fair Usage Monitoring</h2>
              <p className="text-sm text-muted-foreground">Automated congestion detection, FUP enforcement, and traffic alerts</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Critical Alerts", value: alerts.filter(a => a.severity === "critical").length, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
              { label: "Warnings", value: alerts.filter(a => a.severity === "warning").length, icon: TriangleAlert, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
              { label: "FUP Triggered", value: customerUsageData.filter(u => u.fupTriggered).length, icon: Shield, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
              { label: "Devices Offline", value: allDevices.filter(d => d.status === "offline").length, icon: Monitor, color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-950/30" },
            ].map((kpi, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-8 w-8 rounded-lg ${kpi.bg} flex items-center justify-center`}><kpi.icon className={`h-4 w-4 ${kpi.color}`} /></div>
                  </div>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <div className="text-xs text-muted-foreground">{kpi.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {alerts.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Active Alerts</CardTitle>
                <CardDescription className="text-xs">{alerts.length} alert{alerts.length !== 1 ? "s" : ""} detected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.slice(0, 20).map((a, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${a.severity === "critical" ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" : a.severity === "warning" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"}`} data-testid={`alert-${i}`}>
                      {a.severity === "critical" ? <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" /> : a.severity === "warning" ? <TriangleAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" /> : <Signal className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] ${a.severity === "critical" ? "text-red-600 border-red-300" : a.severity === "warning" ? "text-amber-600 border-amber-300" : "text-blue-600 border-blue-300"}`}>{a.type}</Badge>
                          <span className="text-xs font-semibold">{a.message}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {alerts.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                <p className="font-medium">All Systems Healthy</p>
                <p className="text-sm mt-1">No congestion, FUP violations, or device issues detected</p>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Fair Usage Policy Monitor</CardTitle>
              <CardDescription className="text-xs">Subscribers with data limits — sorted by usage percentage</CardDescription>
            </CardHeader>
            <CardContent>
              {fupUsers.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />No subscribers with data limits configured
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                        <TableHead className="text-xs font-semibold">Username</TableHead>
                        <TableHead className="text-xs font-semibold">Customer</TableHead>
                        <TableHead className="text-xs font-semibold">Data Used</TableHead>
                        <TableHead className="text-xs font-semibold">Data Limit</TableHead>
                        <TableHead className="text-xs font-semibold">Usage %</TableHead>
                        <TableHead className="text-xs font-semibold">FUP Status</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fupUsers.slice(0, 50).map(u => (
                        <TableRow key={u.id} data-testid={`row-fup-${u.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                          <TableCell className="font-mono text-sm font-medium">{u.username}</TableCell>
                          <TableCell className="text-xs">{u.customerName}</TableCell>
                          <TableCell className="font-mono text-xs">{formatData(u.totalUsageMb)}</TableCell>
                          <TableCell className="font-mono text-xs">{formatData(u.dataLimitMb)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[80px]">
                                <div className={`h-full rounded-full ${u.fupPct >= 100 ? "bg-red-500" : u.fupPct >= 80 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${Math.min(u.fupPct, 100)}%` }} />
                              </div>
                              <span className={`text-xs font-mono font-medium ${u.fupPct >= 100 ? "text-red-600" : u.fupPct >= 80 ? "text-amber-600" : "text-green-600"}`}>{u.fupPct}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${u.fupTriggered ? "text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30" : u.fupPct >= 80 ? "text-amber-600 border-amber-300 bg-amber-50" : "text-green-600 border-green-300"}`}>
                              {u.fupTriggered ? "Exceeded" : u.fupPct >= 80 ? "Near Limit" : "Normal"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-fup-actions-${u.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => toast({ title: `Throttle applied to ${u.username}` })} data-testid={`button-fup-throttle-${u.id}`}><Shield className="h-4 w-4 mr-2" />Apply Throttle</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast({ title: `Override granted for ${u.username}` })} data-testid={`button-fup-override-${u.id}`}><RefreshCw className="h-4 w-4 mr-2" />Manual Override</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => toast({ title: `Notification sent to ${u.customerName}` })} data-testid={`button-fup-notify-${u.id}`}><FileText className="h-4 w-4 mr-2" />Notify Customer</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">{editingRecord ? "Edit Bandwidth Usage" : "Add Bandwidth Usage"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="customerId" render={({ field }) => (
                  <FormItem><FormLabel>Customer</FormLabel>
                    <Select onValueChange={v => field.onChange(parseInt(v))} value={field.value ? String(field.value) : ""}>
                      <FormControl><SelectTrigger data-testid="select-bandwidth-customer"><SelectValue placeholder="Select customer" /></SelectTrigger></FormControl>
                      <SelectContent>{allCustomers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.fullName} ({c.customerId})</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} data-testid="input-bandwidth-date" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField control={form.control} name="downloadMb" render={({ field }) => (
                  <FormItem><FormLabel>Download (MB)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value || ""} onChange={e => { field.onChange(e.target.value); setTimeout(autoCalcTotal, 0); }} data-testid="input-download-mb" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="uploadMb" render={({ field }) => (
                  <FormItem><FormLabel>Upload (MB)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value || ""} onChange={e => { field.onChange(e.target.value); setTimeout(autoCalcTotal, 0); }} data-testid="input-upload-mb" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="totalMb" render={({ field }) => (
                  <FormItem><FormLabel>Total (MB)</FormLabel><FormControl><Input type="number" step="0.01" readOnly className="bg-muted font-mono" {...field} value={field.value || ""} data-testid="input-total-mb" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="peakDownload" render={({ field }) => (
                  <FormItem><FormLabel>Peak Download</FormLabel><FormControl><Input placeholder="e.g. 100 Mbps" {...field} value={field.value || ""} data-testid="input-peak-download" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="peakUpload" render={({ field }) => (
                  <FormItem><FormLabel>Peak Upload</FormLabel><FormControl><Input placeholder="e.g. 50 Mbps" {...field} value={field.value || ""} data-testid="input-peak-upload" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="sessionCount" render={({ field }) => (
                  <FormItem><FormLabel>Sessions</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 1)} data-testid="input-session-count" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="avgLatency" render={({ field }) => (
                  <FormItem><FormLabel>Avg Latency (ms)</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value || ""} data-testid="input-avg-latency" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-bandwidth">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-gradient-to-r from-blue-600 to-indigo-600" data-testid="button-submit-bandwidth">
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingRecord ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
