import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTab } from "@/hooks/use-tab";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, Shield, Wifi,
  Users, Activity, Download, Server, Eye, EyeOff, RefreshCw,
  CheckCircle, AlertTriangle, Clock, Zap, FileText,
  BarChart3, Layers, Signal, MonitorSpeaker,
  XCircle, Unlink,
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertRadiusProfileSchema, insertRadiusNasDeviceSchema,
  type RadiusProfile, type InsertRadiusProfile,
  type RadiusNasDevice, type InsertRadiusNasDevice,
  type RadiusAuthLog,
  type PppoeUser, type BandwidthUsage, type Customer,
} from "@shared/schema";
import { z } from "zod";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const profileFormSchema = insertRadiusProfileSchema.extend({
  name: z.string().min(1, "Profile name is required"),
  downloadRate: z.string().min(1, "Download rate is required"),
  uploadRate: z.string().min(1, "Upload rate is required"),
  status: z.string().min(1, "Status is required"),
});

const nasFormSchema = insertRadiusNasDeviceSchema.extend({
  nasName: z.string().min(1, "NAS name is required"),
  nasIpAddress: z.string().min(7, "Valid IP address required"),
  radiusSecret: z.string().min(1, "RADIUS secret is required"),
});

const TABS = [
  { value: "dashboard", label: "Profile Dashboard", icon: BarChart3 },
  { value: "profiles", label: "Bandwidth Profiles", icon: Wifi },
  { value: "nas", label: "NAS / Devices", icon: Server },
  { value: "accounting", label: "Session Accounting", icon: Activity },
  { value: "logs", label: "Authentication Logs", icon: FileText },
];

const EVENT_COLORS: Record<string, string> = {
  "Auth-Accept": "text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30",
  "Auth-Reject": "text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30",
  "Acct-Start": "text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/30",
  "Acct-Stop": "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30",
  "Acct-Interim": "text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-950/30",
};

export default function RadiusPage() {
  const { toast } = useToast();
  const [tab, changeTab] = useTab("dashboard");
  const [profileSearch, setProfileSearch] = useState("");
  const [profileStatusFilter, setProfileStatusFilter] = useState("all");
  const [nasSearch, setNasSearch] = useState("");
  const [sessionSearch, setSessionSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [logEventFilter, setLogEventFilter] = useState("all");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [nasDialogOpen, setNasDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<RadiusProfile | null>(null);
  const [editingNas, setEditingNas] = useState<RadiusNasDevice | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<number, boolean>>({});

  const { data: profiles, isLoading: profilesLoading } = useQuery<RadiusProfile[]>({
    queryKey: ["/api/radius-profiles"],
  });
  const { data: nasDevices, isLoading: nasLoading } = useQuery<RadiusNasDevice[]>({
    queryKey: ["/api/radius-nas-devices"],
  });
  const { data: pppoeUsers } = useQuery<PppoeUser[]>({
    queryKey: ["/api/pppoe-users"],
  });
  const { data: authLogs } = useQuery<RadiusAuthLog[]>({
    queryKey: ["/api/radius-auth-logs"],
  });
  const { data: bandwidthData } = useQuery<BandwidthUsage[]>({
    queryKey: ["/api/bandwidth-usage"],
  });
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const isLoading = profilesLoading || nasLoading;
  const allProfiles = profiles || [];
  const allNas = nasDevices || [];
  const allPppoe = pppoeUsers || [];
  const allLogs = authLogs || [];
  const allBandwidth = bandwidthData || [];
  const allCustomers = customers || [];

  const activeProfiles = allProfiles.filter(p => p.status === "active").length;
  const inactiveProfiles = allProfiles.filter(p => p.status === "inactive").length;
  const totalSubscribers = allPppoe.length;
  const onlineSessions = allPppoe.filter(u => u.status === "active").length;
  const totalNas = allNas.length;
  const activeNas = allNas.filter(d => d.status === "active").length;

  const profileForm = useForm<InsertRadiusProfile>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "", downloadRate: "", uploadRate: "", burstDownload: "", burstUpload: "",
      burstThreshold: "", burstTime: "", priority: 8, dataQuota: "",
      sessionTimeout: undefined, idleTimeout: 300, addressPool: "",
      sharedUsers: 1, status: "active", notes: "",
    },
  });

  const nasForm = useForm<InsertRadiusNasDevice>({
    resolver: zodResolver(nasFormSchema),
    defaultValues: {
      nasName: "", nasIpAddress: "", radiusSecret: "", nasType: "mikrotik",
      location: "", authPort: 1812, acctPort: 1813, status: "active", description: "",
    },
  });

  const logAuthEvent = async (eventType: string, username?: string, nasDevice?: string, clientIp?: string, status?: string, replyMessage?: string, rejectReason?: string) => {
    try {
      await apiRequest("POST", "/api/radius-auth-logs", { eventType, username, nasDevice, clientIp, status: status || "accepted", replyMessage, rejectReason });
      queryClient.invalidateQueries({ queryKey: ["/api/radius-auth-logs"] });
    } catch {}
  };

  const createProfileMutation = useMutation({
    mutationFn: async (data: InsertRadiusProfile) => {
      const res = await apiRequest("POST", "/api/radius-profiles", data);
      return res.json();
    },
    onSuccess: (_: any, v: InsertRadiusProfile) => {
      queryClient.invalidateQueries({ queryKey: ["/api/radius-profiles"] });
      setProfileDialogOpen(false);
      profileForm.reset();
      logAuthEvent("Profile-Created", v.name, undefined, undefined, "accepted", `Profile ${v.name} created: ${v.downloadRate}/${v.uploadRate}`);
      toast({ title: "Profile created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertRadiusProfile> }) => {
      const res = await apiRequest("PATCH", `/api/radius-profiles/${id}`, data);
      return res.json();
    },
    onSuccess: (_: any, v: { id: number; data: Partial<InsertRadiusProfile> }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/radius-profiles"] });
      setProfileDialogOpen(false);
      setEditingProfile(null);
      profileForm.reset();
      const p = allProfiles.find(x => x.id === v.id);
      logAuthEvent("Profile-Updated", p?.name, undefined, undefined, "accepted", `Fields: ${Object.keys(v.data).join(", ")}`);
      toast({ title: "Profile updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (id: number) => {
      const p = allProfiles.find(x => x.id === id);
      await apiRequest("DELETE", `/api/radius-profiles/${id}`);
      return p;
    },
    onSuccess: (p: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/radius-profiles"] });
      logAuthEvent("Profile-Deleted", p?.name, undefined, undefined, "accepted", `Profile ${p?.name} removed`);
      toast({ title: "Profile deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createNasMutation = useMutation({
    mutationFn: async (data: InsertRadiusNasDevice) => {
      const res = await apiRequest("POST", "/api/radius-nas-devices", data);
      return res.json();
    },
    onSuccess: (_: any, v: InsertRadiusNasDevice) => {
      queryClient.invalidateQueries({ queryKey: ["/api/radius-nas-devices"] });
      setNasDialogOpen(false);
      nasForm.reset();
      logAuthEvent("NAS-Added", undefined, v.nasName, v.nasIpAddress, "accepted", `NAS ${v.nasName} (${v.nasType}) added`);
      toast({ title: "NAS device added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateNasMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertRadiusNasDevice> }) => {
      const res = await apiRequest("PATCH", `/api/radius-nas-devices/${id}`, data);
      return res.json();
    },
    onSuccess: (_: any, v: { id: number; data: Partial<InsertRadiusNasDevice> }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/radius-nas-devices"] });
      setNasDialogOpen(false);
      setEditingNas(null);
      nasForm.reset();
      const d = allNas.find(x => x.id === v.id);
      logAuthEvent("NAS-Updated", undefined, d?.nasName, d?.nasIpAddress, "accepted", `NAS updated`);
      toast({ title: "NAS device updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteNasMutation = useMutation({
    mutationFn: async (id: number) => {
      const d = allNas.find(x => x.id === id);
      await apiRequest("DELETE", `/api/radius-nas-devices/${id}`);
      return d;
    },
    onSuccess: (d: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/radius-nas-devices"] });
      logAuthEvent("NAS-Removed", undefined, d?.nasName, d?.nasIpAddress, "accepted", `NAS ${d?.nasName} removed`);
      toast({ title: "NAS device deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openCreateProfile = () => {
    setEditingProfile(null);
    profileForm.reset({ name: "", downloadRate: "", uploadRate: "", burstDownload: "", burstUpload: "", burstThreshold: "", burstTime: "", priority: 8, dataQuota: "", sessionTimeout: undefined, idleTimeout: 300, addressPool: "", sharedUsers: 1, status: "active", notes: "" });
    setProfileDialogOpen(true);
  };
  const openEditProfile = (p: RadiusProfile) => {
    setEditingProfile(p);
    profileForm.reset({ name: p.name, downloadRate: p.downloadRate, uploadRate: p.uploadRate, burstDownload: p.burstDownload || "", burstUpload: p.burstUpload || "", burstThreshold: p.burstThreshold || "", burstTime: p.burstTime || "", priority: p.priority || 8, dataQuota: p.dataQuota || "", sessionTimeout: p.sessionTimeout || undefined, idleTimeout: p.idleTimeout || 300, addressPool: p.addressPool || "", sharedUsers: p.sharedUsers || 1, status: p.status, notes: p.notes || "" });
    setProfileDialogOpen(true);
  };
  const openCreateNas = () => {
    setEditingNas(null);
    nasForm.reset({ nasName: "", nasIpAddress: "", radiusSecret: "", nasType: "mikrotik", location: "", authPort: 1812, acctPort: 1813, status: "active", description: "" });
    setNasDialogOpen(true);
  };
  const openEditNas = (d: RadiusNasDevice) => {
    setEditingNas(d);
    nasForm.reset({ nasName: d.nasName, nasIpAddress: d.nasIpAddress, radiusSecret: d.radiusSecret, nasType: d.nasType, location: d.location || "", authPort: d.authPort || 1812, acctPort: d.acctPort || 1813, status: d.status, description: d.description || "" });
    setNasDialogOpen(true);
  };

  const onSubmitProfile = (data: InsertRadiusProfile) => {
    if (editingProfile) updateProfileMutation.mutate({ id: editingProfile.id, data });
    else createProfileMutation.mutate(data);
  };
  const onSubmitNas = (data: InsertRadiusNasDevice) => {
    if (editingNas) updateNasMutation.mutate({ id: editingNas.id, data });
    else createNasMutation.mutate(data);
  };

  const filteredProfiles = useMemo(() => {
    return allProfiles.filter(p => {
      const q = profileSearch.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.downloadRate.toLowerCase().includes(q) || p.uploadRate.toLowerCase().includes(q) || (p.addressPool || "").toLowerCase().includes(q);
      const matchStatus = profileStatusFilter === "all" || p.status === profileStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [allProfiles, profileSearch, profileStatusFilter]);

  const filteredNas = useMemo(() => {
    const q = nasSearch.toLowerCase();
    return allNas.filter(d => !q || d.nasName.toLowerCase().includes(q) || d.nasIpAddress.toLowerCase().includes(q) || (d.nasType || "").toLowerCase().includes(q) || (d.location || "").toLowerCase().includes(q));
  }, [allNas, nasSearch]);

  const filteredSessions = useMemo(() => {
    const q = sessionSearch.toLowerCase();
    return allPppoe.filter(u => !q || u.username.toLowerCase().includes(q) || (u.ipAddress || "").toLowerCase().includes(q) || (u.profileName || "").toLowerCase().includes(q) || (u.nasDevice || "").toLowerCase().includes(q));
  }, [allPppoe, sessionSearch]);

  const filteredLogs = useMemo(() => {
    const q = logSearch.toLowerCase();
    return allLogs.filter(l => {
      const matchSearch = !q || (l.username || "").toLowerCase().includes(q) || (l.nasDevice || "").toLowerCase().includes(q) || (l.clientIp || "").toLowerCase().includes(q);
      const matchEvent = logEventFilter === "all" || l.eventType === logEventFilter;
      return matchSearch && matchEvent;
    });
  }, [allLogs, logSearch, logEventFilter]);

  const profileDistribution = [
    { name: "Active", value: activeProfiles, color: "#22c55e" },
    { name: "Inactive", value: inactiveProfiles, color: "#94a3b8" },
  ].filter(d => d.value > 0);

  const profileBarData = allProfiles.slice(0, 10).map(p => {
    const subs = allPppoe.filter(u => u.profileName === p.name).length;
    return { name: p.name.length > 10 ? p.name.slice(0, 10) + "…" : p.name, subscribers: subs };
  }).sort((a, b) => b.subscribers - a.subscribers);

  const quotaBarData = allProfiles.filter(p => p.dataQuota).slice(0, 8).map(p => ({
    name: p.name.length > 10 ? p.name.slice(0, 10) + "…" : p.name,
    quota: parseInt(p.dataQuota || "0") || 0,
  }));

  const handleExport = () => {
    const headers = ["Name", "Download", "Upload", "Burst DL", "Burst UL", "Priority", "Quota", "Pool", "Status"];
    const rows = allProfiles.map(p => [p.name, p.downloadRate, p.uploadRate, p.burstDownload || "", p.burstUpload || "", String(p.priority || 8), p.dataQuota || "Unlimited", p.addressPool || "", p.status]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "radius-profiles.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSecret = (id: number) => setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));

  if (isLoading) {
    return (
      <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-900 to-violet-600 flex items-center justify-center shadow-lg" data-testid="icon-radius">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-radius-title">RADIUS / AAA Integration</h1>
            <p className="text-sm text-muted-foreground">Authentication, Authorization & Accounting — Multi-RADIUS subscriber management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} data-testid="button-export-profiles">
            <Download className="h-4 w-4 mr-1" />Export
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => changeTab(t.value)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === t.value ? "bg-gradient-to-r from-indigo-900 to-violet-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-background"}`}
            data-testid={`tab-${t.value}`}
          >
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="space-y-5" data-testid="tab-content-dashboard">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            {[
              { label: "Total Profiles", value: allProfiles.length, icon: Wifi, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
              { label: "Active Profiles", value: activeProfiles, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
              { label: "Inactive", value: inactiveProfiles, icon: XCircle, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-950/30" },
              { label: "Total Subscribers", value: totalSubscribers, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
              { label: "Online Sessions", value: onlineSessions, icon: Signal, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
              { label: "NAS Devices", value: totalNas, icon: Server, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
              { label: "Active NAS", value: activeNas, icon: MonitorSpeaker, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30" },
              { label: "Auth Events", value: allLogs.length, icon: FileText, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
            ].map((kpi, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-8 w-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                      <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold" data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>{kpi.value}</div>
                  <div className="text-xs text-muted-foreground">{kpi.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Profile Status Distribution</CardTitle></CardHeader>
              <CardContent>
                {profileDistribution.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No profiles</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={profileDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {profileDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Subscribers per Profile</CardTitle></CardHeader>
              <CardContent>
                {profileBarData.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={profileBarData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="subscribers" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Data Quota by Profile (GB)</CardTitle></CardHeader>
              <CardContent>
                {quotaBarData.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No quota profiles</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={quotaBarData}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="quota" fill="#312e81" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Profile Quick Stats</CardTitle>
              <CardDescription className="text-xs">Overview of all bandwidth profiles with subscriber counts</CardDescription>
            </CardHeader>
            <CardContent>
              {allProfiles.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Wifi className="h-8 w-8 mx-auto mb-2 opacity-30" />No profiles configured
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                        <TableHead className="text-xs font-semibold">Profile</TableHead>
                        <TableHead className="text-xs font-semibold">Download</TableHead>
                        <TableHead className="text-xs font-semibold">Upload</TableHead>
                        <TableHead className="text-xs font-semibold">Burst</TableHead>
                        <TableHead className="text-xs font-semibold">Subscribers</TableHead>
                        <TableHead className="text-xs font-semibold">Active Sessions</TableHead>
                        <TableHead className="text-xs font-semibold">Quota</TableHead>
                        <TableHead className="text-xs font-semibold">Pool</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allProfiles.map(p => {
                        const subs = allPppoe.filter(u => u.profileName === p.name);
                        const activeSess = subs.filter(u => u.status === "active").length;
                        return (
                          <TableRow key={p.id} data-testid={`row-dash-profile-${p.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                            <TableCell className="font-medium text-sm">{p.name}</TableCell>
                            <TableCell className="font-mono text-xs">{p.downloadRate}</TableCell>
                            <TableCell className="font-mono text-xs">{p.uploadRate}</TableCell>
                            <TableCell className="font-mono text-xs">{p.burstDownload ? `${p.burstDownload}/${p.burstUpload || "—"}` : "—"}</TableCell>
                            <TableCell className="text-sm font-medium">{subs.length}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <div className={`h-2 w-2 rounded-full ${activeSess > 0 ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
                                <span className="text-sm">{activeSess}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{p.dataQuota || "Unlimited"}</TableCell>
                            <TableCell className="font-mono text-xs">{p.addressPool || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] capitalize ${p.status === "active" ? "text-green-600 border-green-300" : "text-slate-500 border-slate-300"}`}>{p.status}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "profiles" && (
        <div className="space-y-4" data-testid="tab-content-profiles">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Bandwidth Profiles</h2>
              <p className="text-sm text-muted-foreground">Manage RADIUS bandwidth profiles, QoS settings, and data quotas</p>
            </div>
            <Button size="sm" onClick={openCreateProfile} className="bg-gradient-to-r from-indigo-900 to-violet-600" data-testid="button-add-profile">
              <Plus className="h-4 w-4 mr-1" />Add Profile
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search profiles..." value={profileSearch} onChange={e => setProfileSearch(e.target.value)} className="pl-9 h-9" data-testid="input-search-profiles" />
            </div>
            <Select value={profileStatusFilter} onValueChange={setProfileStatusFilter}>
              <SelectTrigger className="w-[140px] h-9" data-testid="select-profile-status-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                      <TableHead className="text-xs font-semibold">Name</TableHead>
                      <TableHead className="text-xs font-semibold">Download</TableHead>
                      <TableHead className="text-xs font-semibold">Upload</TableHead>
                      <TableHead className="text-xs font-semibold hidden lg:table-cell">Burst DL/UL</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">Priority</TableHead>
                      <TableHead className="text-xs font-semibold hidden lg:table-cell">Quota</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">Session/Idle</TableHead>
                      <TableHead className="text-xs font-semibold">Pool</TableHead>
                      <TableHead className="text-xs font-semibold hidden md:table-cell">Shared</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.length === 0 ? (
                      <TableRow><TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                        <Wifi className="h-10 w-10 mx-auto mb-2 opacity-30" />No profiles found
                      </TableCell></TableRow>
                    ) : filteredProfiles.map(p => (
                      <TableRow key={p.id} data-testid={`row-profile-${p.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        <TableCell className="font-medium text-sm">{p.name}</TableCell>
                        <TableCell className="font-mono text-xs text-green-600">{p.downloadRate}</TableCell>
                        <TableCell className="font-mono text-xs text-blue-600">{p.uploadRate}</TableCell>
                        <TableCell className="font-mono text-xs hidden lg:table-cell">{p.burstDownload ? `${p.burstDownload}/${p.burstUpload || "—"}` : "—"}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-[10px]">P{p.priority || 8}</Badge>
                        </TableCell>
                        <TableCell className="text-xs hidden lg:table-cell">{p.dataQuota || "Unlimited"}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{p.sessionTimeout ? `${p.sessionTimeout}s` : "—"} / {p.idleTimeout ? `${p.idleTimeout}s` : "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{p.addressPool || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs">{p.sharedUsers || 1}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] capitalize ${p.status === "active" ? "text-green-600 border-green-300" : "text-slate-500 border-slate-300"}`}>{p.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-actions-profile-${p.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditProfile(p)} data-testid={`button-edit-profile-${p.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const { id, ...rest } = p;
                                createProfileMutation.mutate({ ...rest, name: `${p.name} (Copy)` } as InsertRadiusProfile);
                              }} data-testid={`button-duplicate-profile-${p.id}`}><Layers className="h-4 w-4 mr-2" />Duplicate</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => deleteProfileMutation.mutate(p.id)} className="text-destructive" data-testid={`button-delete-profile-${p.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredProfiles.length > 0 && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-t">
                  Showing {filteredProfiles.length} of {allProfiles.length} profiles
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "nas" && (
        <div className="space-y-4" data-testid="tab-content-nas">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">NAS / Device Management</h2>
              <p className="text-sm text-muted-foreground">Manage Network Access Servers that authenticate against RADIUS</p>
            </div>
            <Button size="sm" onClick={openCreateNas} className="bg-gradient-to-r from-indigo-900 to-violet-600" data-testid="button-add-nas">
              <Plus className="h-4 w-4 mr-1" />Add NAS Device
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search NAS devices..." value={nasSearch} onChange={e => setNasSearch(e.target.value)} className="pl-9 h-9" data-testid="input-search-nas" />
            </div>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                      <TableHead className="text-xs font-semibold">NAS Name</TableHead>
                      <TableHead className="text-xs font-semibold">IP Address</TableHead>
                      <TableHead className="text-xs font-semibold">Type</TableHead>
                      <TableHead className="text-xs font-semibold">Location</TableHead>
                      <TableHead className="text-xs font-semibold">RADIUS Secret</TableHead>
                      <TableHead className="text-xs font-semibold">Auth Port</TableHead>
                      <TableHead className="text-xs font-semibold">Acct Port</TableHead>
                      <TableHead className="text-xs font-semibold">Subscribers</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNas.length === 0 ? (
                      <TableRow><TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        <Server className="h-10 w-10 mx-auto mb-2 opacity-30" />No NAS devices configured
                      </TableCell></TableRow>
                    ) : filteredNas.map(d => {
                      const linkedSubs = allPppoe.filter(u => u.nasDevice === d.nasName || u.nasDevice === d.nasIpAddress).length;
                      return (
                        <TableRow key={d.id} data-testid={`row-nas-${d.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                          <TableCell className="font-medium text-sm">{d.nasName}</TableCell>
                          <TableCell className="font-mono text-xs">{d.nasIpAddress}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] capitalize">{d.nasType}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{d.location || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs">{showSecrets[d.id] ? d.radiusSecret : "••••••••"}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSecret(d.id)} data-testid={`button-toggle-secret-${d.id}`}>
                                {showSecrets[d.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{d.authPort || 1812}</TableCell>
                          <TableCell className="font-mono text-xs">{d.acctPort || 1813}</TableCell>
                          <TableCell className="text-sm font-medium">{linkedSubs + (d.connectedSubscribers || 0)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div className={`h-2 w-2 rounded-full ${d.status === "active" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                              <span className={`text-xs font-medium capitalize ${d.status === "active" ? "text-green-600" : "text-red-600"}`}>{d.status}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-actions-nas-${d.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditNas(d)} data-testid={`button-edit-nas-${d.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast({ title: `Testing ${d.nasName}...`, description: `Connecting to ${d.nasIpAddress}:${d.authPort}` })} data-testid={`button-test-nas-${d.id}`}><RefreshCw className="h-4 w-4 mr-2" />Test Connection</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => deleteNasMutation.mutate(d.id)} className="text-destructive" data-testid={`button-delete-nas-${d.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "accounting" && (
        <div className="space-y-4" data-testid="tab-content-accounting">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Session Accounting</h2>
              <p className="text-sm text-muted-foreground">Real-time and historical subscriber session monitoring with data usage tracking</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Sessions", value: allPppoe.length, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
              { label: "Active Now", value: onlineSessions, icon: Signal, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
              { label: "Total Data (MB)", value: allBandwidth.reduce((a, b) => a + parseFloat(String(b.totalMb || "0")), 0).toFixed(0), icon: Activity, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
              { label: "Avg Sessions", value: allBandwidth.length > 0 ? Math.round(allBandwidth.reduce((a, b) => a + (b.sessionCount || 1), 0) / allBandwidth.length) : 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
            ].map((kpi, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-8 w-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                      <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <div className="text-xs text-muted-foreground">{kpi.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search sessions..." value={sessionSearch} onChange={e => setSessionSearch(e.target.value)} className="pl-9 h-9" data-testid="input-search-sessions" />
            </div>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                      <TableHead className="text-xs font-semibold">Username</TableHead>
                      <TableHead className="text-xs font-semibold">Customer</TableHead>
                      <TableHead className="text-xs font-semibold">NAS Device</TableHead>
                      <TableHead className="text-xs font-semibold">IP Address</TableHead>
                      <TableHead className="text-xs font-semibold">MAC Address</TableHead>
                      <TableHead className="text-xs font-semibold">Profile</TableHead>
                      <TableHead className="text-xs font-semibold">Download</TableHead>
                      <TableHead className="text-xs font-semibold">Upload</TableHead>
                      <TableHead className="text-xs font-semibold">Service</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.length === 0 ? (
                      <TableRow><TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />No sessions found
                      </TableCell></TableRow>
                    ) : filteredSessions.map(u => {
                      const cust = allCustomers.find(c => c.id === u.customerId);
                      return (
                        <TableRow key={u.id} data-testid={`row-session-${u.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                          <TableCell className="font-mono text-sm font-medium">{u.username}</TableCell>
                          <TableCell className="text-xs">{cust?.fullName || "—"}</TableCell>
                          <TableCell className="text-xs">{u.nasDevice || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{u.ipAddress || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{u.macAddress || "—"}</TableCell>
                          <TableCell className="text-xs">{u.profileName || "—"}</TableCell>
                          <TableCell className="font-mono text-xs text-green-600">{u.downloadSpeed || u.bytesIn || "—"}</TableCell>
                          <TableCell className="font-mono text-xs text-blue-600">{u.uploadSpeed || u.bytesOut || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] capitalize">{u.serviceType || "pppoe"}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div className={`h-2 w-2 rounded-full ${u.status === "active" ? "bg-green-500 animate-pulse" : u.status === "suspended" ? "bg-amber-500" : "bg-red-500"}`} />
                              <span className={`text-xs font-medium capitalize ${u.status === "active" ? "text-green-600" : u.status === "suspended" ? "text-amber-600" : "text-red-600"}`}>{u.status}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Disconnect" onClick={() => toast({ title: `Disconnecting ${u.username}...` })} data-testid={`button-disconnect-${u.id}`}>
                              <Unlink className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {filteredSessions.length > 0 && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-t">
                  Showing {filteredSessions.length} of {allPppoe.length} sessions
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "logs" && (
        <div className="space-y-4" data-testid="tab-content-logs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Authentication Logs</h2>
              <p className="text-sm text-muted-foreground">Track all RADIUS authentication and accounting events</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Auth-Accept", value: allLogs.filter(l => l.eventType === "Auth-Accept").length, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
              { label: "Auth-Reject", value: allLogs.filter(l => l.eventType === "Auth-Reject").length, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
              { label: "Acct-Start", value: allLogs.filter(l => l.eventType === "Acct-Start").length, icon: Zap, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
              { label: "Acct-Stop", value: allLogs.filter(l => l.eventType === "Acct-Stop").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
              { label: "Other Events", value: allLogs.filter(l => !["Auth-Accept", "Auth-Reject", "Acct-Start", "Acct-Stop"].includes(l.eventType)).length, icon: FileText, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
            ].map((kpi, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-8 w-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                      <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <div className="text-xs text-muted-foreground">{kpi.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search logs..." value={logSearch} onChange={e => setLogSearch(e.target.value)} className="pl-9 h-9" data-testid="input-search-logs" />
            </div>
            <Select value={logEventFilter} onValueChange={setLogEventFilter}>
              <SelectTrigger className="w-[160px] h-9" data-testid="select-log-event"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="Auth-Accept">Auth-Accept</SelectItem>
                <SelectItem value="Auth-Reject">Auth-Reject</SelectItem>
                <SelectItem value="Acct-Start">Acct-Start</SelectItem>
                <SelectItem value="Acct-Stop">Acct-Stop</SelectItem>
                <SelectItem value="Acct-Interim">Acct-Interim</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                      <TableHead className="text-xs font-semibold">Timestamp</TableHead>
                      <TableHead className="text-xs font-semibold">Event Type</TableHead>
                      <TableHead className="text-xs font-semibold">Username</TableHead>
                      <TableHead className="text-xs font-semibold">NAS Device</TableHead>
                      <TableHead className="text-xs font-semibold">Client IP</TableHead>
                      <TableHead className="text-xs font-semibold">MAC</TableHead>
                      <TableHead className="text-xs font-semibold">Reply / Reason</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />No authentication logs
                      </TableCell></TableRow>
                    ) : filteredLogs.slice(0, 200).map(l => (
                      <TableRow key={l.id} data-testid={`row-log-${l.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{l.timestamp ? new Date(l.timestamp).toLocaleString() : "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${EVENT_COLORS[l.eventType] || ""}`}>{l.eventType}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{l.username || "—"}</TableCell>
                        <TableCell className="text-xs">{l.nasDevice || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{l.clientIp || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{l.macAddress || "—"}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{l.rejectReason || l.replyMessage || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className={`h-2 w-2 rounded-full ${l.status === "accepted" ? "bg-green-500" : l.status === "rejected" ? "bg-red-500" : "bg-amber-500"}`} />
                            <span className="text-xs capitalize">{l.status}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredLogs.length > 0 && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-t">
                  Showing {Math.min(filteredLogs.length, 200)} of {filteredLogs.length} log entries
                </div>
              )}
            </CardContent>
          </Card>

          {allLogs.filter(l => l.eventType === "Auth-Reject").length > 0 && (
            <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <CardTitle className="text-sm font-semibold text-red-600">Failed Authentication Alerts</CardTitle>
                </div>
                <CardDescription className="text-xs">Recent authentication rejections detected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allLogs.filter(l => l.eventType === "Auth-Reject").slice(0, 5).map((l, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold font-mono">{l.username || "Unknown"}</span>
                          <span className="text-[10px] text-muted-foreground">from {l.nasDevice || "—"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{l.rejectReason || "Authentication failed"} • {l.timestamp ? new Date(l.timestamp).toLocaleString() : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-profile">{editingProfile ? "Edit Profile" : "Add Bandwidth Profile"}</DialogTitle>
          </DialogHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-3">
              <FormField control={profileForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Profile Name</FormLabel><FormControl><Input placeholder="e.g. Premium-25M" {...field} data-testid="input-profile-name" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={profileForm.control} name="downloadRate" render={({ field }) => (
                  <FormItem><FormLabel>Download Rate</FormLabel><FormControl><Input placeholder="e.g. 25M" className="font-mono" {...field} data-testid="input-profile-download" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={profileForm.control} name="uploadRate" render={({ field }) => (
                  <FormItem><FormLabel>Upload Rate</FormLabel><FormControl><Input placeholder="e.g. 10M" className="font-mono" {...field} data-testid="input-profile-upload" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={profileForm.control} name="burstDownload" render={({ field }) => (
                  <FormItem><FormLabel>Burst Download</FormLabel><FormControl><Input placeholder="e.g. 30M" className="font-mono" {...field} value={field.value || ""} data-testid="input-profile-burst-dl" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={profileForm.control} name="burstUpload" render={({ field }) => (
                  <FormItem><FormLabel>Burst Upload</FormLabel><FormControl><Input placeholder="e.g. 15M" className="font-mono" {...field} value={field.value || ""} data-testid="input-profile-burst-ul" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={profileForm.control} name="burstThreshold" render={({ field }) => (
                  <FormItem><FormLabel>Burst Threshold</FormLabel><FormControl><Input placeholder="e.g. 20M" className="font-mono" {...field} value={field.value || ""} data-testid="input-profile-burst-threshold" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={profileForm.control} name="burstTime" render={({ field }) => (
                  <FormItem><FormLabel>Burst Time</FormLabel><FormControl><Input placeholder="e.g. 10s" className="font-mono" {...field} value={field.value || ""} data-testid="input-profile-burst-time" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField control={profileForm.control} name="priority" render={({ field }) => (
                  <FormItem><FormLabel>Priority (1-8)</FormLabel><FormControl><Input type="number" min={1} max={8} {...field} onChange={e => field.onChange(parseInt(e.target.value) || 8)} data-testid="input-profile-priority" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={profileForm.control} name="dataQuota" render={({ field }) => (
                  <FormItem><FormLabel>Data Quota</FormLabel><FormControl><Input placeholder="e.g. 100GB" {...field} value={field.value || ""} data-testid="input-profile-quota" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={profileForm.control} name="sharedUsers" render={({ field }) => (
                  <FormItem><FormLabel>Shared Users</FormLabel><FormControl><Input type="number" min={1} {...field} onChange={e => field.onChange(parseInt(e.target.value) || 1)} data-testid="input-profile-shared" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={profileForm.control} name="sessionTimeout" render={({ field }) => (
                  <FormItem><FormLabel>Session Timeout (s)</FormLabel><FormControl><Input type="number" placeholder="e.g. 3600" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} data-testid="input-profile-session-timeout" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={profileForm.control} name="idleTimeout" render={({ field }) => (
                  <FormItem><FormLabel>Idle Timeout (s)</FormLabel><FormControl><Input type="number" placeholder="e.g. 300" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 300)} data-testid="input-profile-idle-timeout" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={profileForm.control} name="addressPool" render={({ field }) => (
                  <FormItem><FormLabel>Address Pool</FormLabel><FormControl><Input placeholder="e.g. pool-residential" {...field} value={field.value || ""} data-testid="input-profile-pool" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={profileForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-profile-form-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={profileForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={2} placeholder="Additional notes..." {...field} value={field.value || ""} data-testid="input-profile-notes" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setProfileDialogOpen(false)} data-testid="button-cancel-profile">Cancel</Button>
                <Button type="submit" disabled={createProfileMutation.isPending || updateProfileMutation.isPending} className="bg-gradient-to-r from-indigo-900 to-violet-600" data-testid="button-submit-profile">
                  {(createProfileMutation.isPending || updateProfileMutation.isPending) ? "Saving..." : editingProfile ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={nasDialogOpen} onOpenChange={setNasDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-nas">{editingNas ? "Edit NAS Device" : "Add NAS Device"}</DialogTitle>
          </DialogHeader>
          <Form {...nasForm}>
            <form onSubmit={nasForm.handleSubmit(onSubmitNas)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={nasForm.control} name="nasName" render={({ field }) => (
                  <FormItem><FormLabel>NAS Name</FormLabel><FormControl><Input placeholder="e.g. MikroTik-Core-1" {...field} data-testid="input-nas-name" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={nasForm.control} name="nasIpAddress" render={({ field }) => (
                  <FormItem><FormLabel>NAS IP Address</FormLabel><FormControl><Input placeholder="192.168.1.1" className="font-mono" {...field} data-testid="input-nas-ip" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={nasForm.control} name="radiusSecret" render={({ field }) => (
                <FormItem><FormLabel>RADIUS Secret</FormLabel><FormControl><Input type="password" placeholder="Shared secret key" {...field} data-testid="input-nas-secret" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={nasForm.control} name="nasType" render={({ field }) => (
                  <FormItem><FormLabel>NAS Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-nas-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="mikrotik">MikroTik</SelectItem>
                        <SelectItem value="cisco">Cisco</SelectItem>
                        <SelectItem value="huawei">Huawei</SelectItem>
                        <SelectItem value="juniper">Juniper</SelectItem>
                        <SelectItem value="ubiquiti">Ubiquiti</SelectItem>
                        <SelectItem value="generic">Generic</SelectItem>
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={nasForm.control} name="location" render={({ field }) => (
                  <FormItem><FormLabel>Location / POP</FormLabel><FormControl><Input placeholder="Main POP" {...field} value={field.value || ""} data-testid="input-nas-location" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={nasForm.control} name="authPort" render={({ field }) => (
                  <FormItem><FormLabel>Auth Port</FormLabel><FormControl><Input type="number" className="font-mono" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 1812)} data-testid="input-nas-auth-port" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={nasForm.control} name="acctPort" render={({ field }) => (
                  <FormItem><FormLabel>Accounting Port</FormLabel><FormControl><Input type="number" className="font-mono" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 1813)} data-testid="input-nas-acct-port" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={nasForm.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-nas-status"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={nasForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={2} placeholder="NAS device description..." {...field} value={field.value || ""} data-testid="input-nas-desc" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setNasDialogOpen(false)} data-testid="button-cancel-nas">Cancel</Button>
                <Button type="submit" disabled={createNasMutation.isPending || updateNasMutation.isPending} className="bg-gradient-to-r from-indigo-900 to-violet-600" data-testid="button-submit-nas">
                  {(createNasMutation.isPending || updateNasMutation.isPending) ? "Saving..." : editingNas ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
