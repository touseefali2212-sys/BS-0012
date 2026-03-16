import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search, Eye, MapPin, AlertTriangle, Clock, HardDrive, Router,
  Network, Wrench, CheckCircle, XCircle, Truck, Package, Users,
  Shield, Activity, BarChart3, ArrowRightLeft, Server, Monitor,
  Filter, Download, RefreshCw, BookmarkCheck, ChevronRight,
  Wifi, Zap, AlertCircle, Radio, Globe, Box, FileText, History,
  MoreHorizontal, Edit, Layers, Hash, TrendingUp, TrendingDown,
  Power, Cable, X, Info, Bell, Calendar, DollarSign, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTab } from "@/hooks/use-tab";
import type { Asset, AssetTransfer, AssetAssignment } from "@shared/schema";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Legend,
} from "recharts";

const TRACKING_STATUS: Record<string, { icon: any; label: string; color: string; dot: string }> = {
  available: { icon: CheckCircle, label: "In Stock", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", dot: "bg-green-500" },
  deployed: { icon: Router, label: "Active", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  in_transit: { icon: Truck, label: "In Transit", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" },
  assigned: { icon: Users, label: "Assigned", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", dot: "bg-blue-500" },
  maintenance: { icon: Wrench, label: "Under Maintenance", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", dot: "bg-purple-500" },
  faulty: { icon: AlertTriangle, label: "Faulty", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" },
  lost: { icon: AlertCircle, label: "Lost / Missing", color: "bg-gray-800 text-white dark:bg-gray-700", dot: "bg-gray-800" },
  reserved: { icon: BookmarkCheck, label: "Reserved", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", dot: "bg-orange-500" },
  retired: { icon: XCircle, label: "Retired", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", dot: "bg-gray-400" },
};

const LOCATION_TYPES = ["warehouse", "pop", "customer", "technician", "office", "repair_center"];
const ASSET_TYPES = ["ONU", "Router", "CPE", "Switch", "Modem", "OLT", "Fiber Cable", "Power Equipment", "IT Hardware"];
const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899", "#6366f1"];

const WARRANTY_STATUS = (asset: Asset) => {
  if (!asset.warrantyEnd) return { label: "N/A", color: "text-gray-500" };
  const end = new Date(asset.warrantyEnd);
  const now = new Date();
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: "Expired", color: "text-red-600" };
  if (daysLeft < 30) return { label: `${daysLeft}d left`, color: "text-amber-600" };
  return { label: "Active", color: "text-emerald-600" };
};

export default function AssetTrackingPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useTab("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [sortField, setSortField] = useState<string>("assetTag");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [timelineAsset, setTimelineAsset] = useState<Asset | null>(null);

  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: transfers = [] } = useQuery<AssetTransfer[]>({
    queryKey: ["/api/asset-transfers"],
  });

  const { data: assignments = [] } = useQuery<AssetAssignment[]>({
    queryKey: ["/api/asset-assignments"],
  });

  const getCustomerForAsset = (assetId: number) => {
    const active = assignments.find(a => a.assetId === assetId && a.status === "active");
    return active ? `Customer #${active.customerId}` : null;
  };

  const getLastMovementDate = (assetId: number) => {
    const relT = transfers.filter(t => t.assetId === assetId).sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return relT[0]?.dispatchDate || relT[0]?.createdAt || null;
  };

  const searchFilter = (a: Asset, term: string) => {
    const s = term.toLowerCase();
    return (
      a.assetTag?.toLowerCase().includes(s) ||
      a.name?.toLowerCase().includes(s) ||
      a.serialNumber?.toLowerCase().includes(s) ||
      a.macAddress?.toLowerCase().includes(s) ||
      a.ipAddress?.toLowerCase().includes(s) ||
      a.assignedTo?.toLowerCase().includes(s) ||
      a.location?.toLowerCase().includes(s) ||
      a.type?.toLowerCase().includes(s)
    );
  };

  const globalSearchResults = useMemo(() => {
    if (!globalSearch || globalSearch.length < 2) return [];
    return assets.filter(a => searchFilter(a, globalSearch)).slice(0, 20);
  }, [assets, globalSearch]);

  const filteredAssets = useMemo(() => {
    let list = assets;
    if (searchTerm) list = list.filter(a => searchFilter(a, searchTerm));
    if (statusFilter !== "all") list = list.filter(a => a.status === statusFilter);
    if (locationFilter !== "all") list = list.filter(a => a.locationType === locationFilter);
    if (typeFilter !== "all") list = list.filter(a => a.type === typeFilter);
    if (assignedFilter === "assigned") list = list.filter(a => a.assignedTo);
    if (assignedFilter === "unassigned") list = list.filter(a => !a.assignedTo);
    if (conditionFilter !== "all") {
      if (conditionFilter === "warranty_expiring") {
        list = list.filter(a => {
          if (!a.warrantyEnd) return false;
          const d = Math.ceil((new Date(a.warrantyEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return d >= 0 && d < 30;
        });
      } else if (conditionFilter === "warranty_expired") {
        list = list.filter(a => a.warrantyEnd && new Date(a.warrantyEnd) < new Date());
      }
    }
    list = [...list].sort((a, b) => {
      const aVal = (a as any)[sortField] || "";
      const bVal = (b as any)[sortField] || "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [assets, searchTerm, statusFilter, locationFilter, typeFilter, conditionFilter, assignedFilter, sortField, sortDir]);

  const stats = useMemo(() => {
    const byStatus = Object.keys(TRACKING_STATUS).reduce((acc, k) => {
      acc[k] = assets.filter(a => a.status === k).length;
      return acc;
    }, {} as Record<string, number>);

    const byLocation = LOCATION_TYPES.map(loc => ({
      name: loc.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()),
      value: assets.filter(a => a.locationType === loc).length,
    })).filter(d => d.value > 0);

    const byType = ASSET_TYPES.map(t => ({
      name: t,
      value: assets.filter(a => a.type === t).length,
    })).filter(d => d.value > 0);

    const faultRate = ASSET_TYPES.map(t => {
      const total = assets.filter(a => a.type === t).length;
      const faulty = assets.filter(a => a.type === t && (a.status === "faulty" || a.status === "maintenance")).length;
      return {
        name: t,
        rate: total > 0 ? Math.round((faulty / total) * 100) : 0,
        faulty,
        total,
      };
    }).filter(d => d.total > 0);

    const totalValue = assets.reduce((s, a) => s + parseFloat(a.bookValue || a.purchaseCost || "0"), 0);

    const inTransitCount = transfers.filter(t => t.status === "in_transit" || t.status === "approved").length;

    const assignedToCustomers = assignments.filter(a => a.status === "active").length;

    const movementTrend = (() => {
      const months: Record<string, number> = {};
      transfers.forEach(t => {
        const d = t.createdAt || t.dispatchDate;
        if (d) {
          const key = new Date(d).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
          months[key] = (months[key] || 0) + 1;
        }
      });
      return Object.entries(months).slice(-6).map(([name, movements]) => ({ name, movements }));
    })();

    return {
      total: assets.length,
      active: byStatus.deployed || 0,
      inTransit: inTransitCount,
      assignedCustomers: assignedToCustomers,
      maintenance: byStatus.maintenance || 0,
      lost: byStatus.lost || 0,
      faulty: byStatus.faulty || 0,
      reserved: byStatus.reserved || 0,
      totalValue,
      movementTrend,
      byLocation,
      byType,
      faultRate,
      byStatus,
    };
  }, [assets, transfers, assignments]);

  const alerts = useMemo(() => {
    const items: { type: string; severity: string; message: string; assetId?: number }[] = [];
    const now = new Date();

    assets.forEach(a => {
      if (a.warrantyEnd) {
        const end = new Date(a.warrantyEnd);
        const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days >= 0 && days < 30) {
          items.push({ type: "warranty", severity: "warning", message: `${a.assetTag} (${a.name}) warranty expires in ${days} days`, assetId: a.id });
        }
      }
      if (a.status === "lost") {
        items.push({ type: "lost", severity: "critical", message: `${a.assetTag} (${a.name}) is marked as LOST/MISSING`, assetId: a.id });
      }
      if (a.status === "faulty" && parseFloat(a.bookValue || "0") > 50000) {
        items.push({ type: "high_value_faulty", severity: "critical", message: `High-value asset ${a.assetTag} (₨${parseFloat(a.bookValue || "0").toLocaleString()}) is faulty`, assetId: a.id });
      }
      if (a.status === "deployed" && !a.assignedTo && !a.location) {
        items.push({ type: "unaccounted", severity: "warning", message: `${a.assetTag} (${a.name}) is marked deployed but has no assignment or location`, assetId: a.id });
      }
      if (a.nextMaintenanceDate) {
        const next = new Date(a.nextMaintenanceDate);
        const mDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (mDays < 0) {
          items.push({ type: "overdue_maintenance", severity: "warning", message: `${a.assetTag} maintenance overdue by ${Math.abs(mDays)} days`, assetId: a.id });
        }
      }
    });

    transfers.forEach(t => {
      if (t.status === "in_transit" && t.expectedDeliveryDate) {
        const expected = new Date(t.expectedDeliveryDate);
        if (expected < now) {
          items.push({ type: "overdue_transit", severity: "warning", message: `Transfer ${t.transferId} is overdue — expected ${expected.toLocaleDateString()}` });
        }
      }
    });

    return items.sort((a, b) => (a.severity === "critical" ? -1 : 1) - (b.severity === "critical" ? -1 : 1));
  }, [assets, transfers]);

  const assetTimeline = useMemo(() => {
    if (!timelineAsset) return [];
    const events: { date: string; action: string; from?: string; to?: string; person?: string; status?: string; note?: string; color: string }[] = [];

    if (timelineAsset.purchaseDate) {
      events.push({ date: timelineAsset.purchaseDate, action: "Purchased", note: `Cost: ₨${parseFloat(timelineAsset.purchaseCost || "0").toLocaleString()}`, color: "bg-green-500" });
    }
    if (timelineAsset.installationDate) {
      events.push({ date: timelineAsset.installationDate, action: "Installed", person: timelineAsset.installedBy || undefined, to: timelineAsset.location || undefined, color: "bg-blue-500" });
    }

    const relatedTransfers = transfers.filter(t => t.assetId === timelineAsset.id);
    relatedTransfers.forEach(t => {
      events.push({
        date: t.dispatchDate || t.createdAt || "",
        action: `Transfer ${t.status === "completed" ? "Completed" : t.status}`,
        from: t.fromLocation,
        to: t.toLocation,
        person: t.requestedBy || undefined,
        status: t.status,
        color: t.status === "completed" ? "bg-emerald-500" : t.status === "in_transit" ? "bg-amber-500" : "bg-blue-500",
      });
    });

    const relatedAssignments = assignments.filter(a => a.assetId === timelineAsset.id);
    relatedAssignments.forEach(a => {
      events.push({
        date: a.installationDate || a.createdAt || "",
        action: `Assigned to Customer #${a.customerId}`,
        person: a.assignedTechnician || undefined,
        status: a.status,
        color: a.status === "active" ? "bg-blue-500" : a.status === "returned" ? "bg-gray-500" : "bg-red-500",
      });
    });

    if (timelineAsset.lastMaintenanceDate) {
      events.push({ date: timelineAsset.lastMaintenanceDate, action: "Maintenance Performed", color: "bg-purple-500" });
    }
    if (timelineAsset.status === "faulty") {
      events.push({ date: new Date().toISOString(), action: "Marked as Faulty", color: "bg-red-500" });
    }
    if (timelineAsset.status === "lost") {
      events.push({ date: new Date().toISOString(), action: "Marked as Lost/Missing", note: "Investigation required", color: "bg-gray-800" });
    }

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [timelineAsset, transfers, assignments]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Asset> }) => {
      const res = await apiRequest("PATCH", `/api/assets/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({ title: "Asset updated" });
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 page-fade-in">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 page-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-cyan-600 bg-clip-text text-transparent" data-testid="text-page-title">
            Assets Tracking
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time visibility into location, status, ownership, and lifecycle of all assets
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/assets"] })} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Total Assets", value: stats.total, icon: HardDrive, gradient: "from-slate-800 to-slate-600" },
          { label: "Active", value: stats.active, icon: CheckCircle, gradient: "from-emerald-600 to-green-400" },
          { label: "In Transit", value: stats.inTransit, icon: Truck, gradient: "from-amber-600 to-yellow-400" },
          { label: "Assigned", value: stats.assignedCustomers, icon: Users, gradient: "from-blue-600 to-cyan-400" },
          { label: "Maintenance", value: stats.maintenance, icon: Wrench, gradient: "from-purple-600 to-violet-400" },
          { label: "Lost/Missing", value: stats.lost, icon: AlertCircle, gradient: "from-gray-800 to-gray-600" },
          { label: "Faulty", value: stats.faulty, icon: AlertTriangle, gradient: "from-red-600 to-rose-400" },
          { label: "Reserved", value: stats.reserved, icon: BookmarkCheck, gradient: "from-orange-600 to-amber-400" },
        ].map((card, i) => (
          <Card key={i} className={`bg-gradient-to-br ${card.gradient} text-white border-0 shadow-lg`} data-testid={`card-stat-${card.label.toLowerCase().replace(/[\s/]+/g, "-")}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-white/70 leading-tight">{card.label}</p>
                  <p className="text-xl font-bold mt-0.5">{card.value}</p>
                </div>
                <card.icon className="h-6 w-6 text-white/40" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border shadow-sm" data-testid="card-global-search">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-600" />
              <Input
                placeholder="Global Search — Asset ID, Serial Number, MAC Address, IP, Customer, Technician, POP, Warehouse..."
                className="pl-11 h-10 text-sm border-cyan-200 dark:border-cyan-800 focus:ring-cyan-500"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                data-testid="input-global-search"
              />
            </div>
            {globalSearch && (
              <Button variant="ghost" size="sm" onClick={() => setGlobalSearch("")} data-testid="button-clear-global-search">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {globalSearchResults.length > 0 && (
            <div className="mt-3 border rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white text-xs px-3 py-2 font-medium flex items-center justify-between">
                <span>Search Results</span>
                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px]">{globalSearchResults.length} found</Badge>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {globalSearchResults.map(a => {
                  const sc = TRACKING_STATUS[a.status] || TRACKING_STATUS.available;
                  const StatusIcon = sc.icon;
                  const customer = getCustomerForAsset(a.id);
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => setDetailAsset(a)}
                      data-testid={`search-result-${a.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-medium text-cyan-700 dark:text-cyan-400 shrink-0">{a.assetTag}</span>
                        <span className="text-xs font-medium truncate">{a.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{a.type}</span>
                        {a.serialNumber && <span className="text-[10px] font-mono text-muted-foreground shrink-0">SN: {a.serialNumber}</span>}
                        {a.macAddress && <span className="text-[10px] font-mono text-muted-foreground shrink-0">MAC: {a.macAddress}</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {customer && <Badge variant="outline" className="text-[10px]">{customer}</Badge>}
                        <Badge className={`${sc.color} border-0 text-[10px] gap-1`}><StatusIcon className="h-3 w-3" />{sc.label}</Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6" data-testid={`button-view-search-${a.id}`}><Eye className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {globalSearch && globalSearch.length >= 2 && globalSearchResults.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3 mt-2">No assets found matching "{globalSearch}"</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-1 border-b overflow-x-auto">
        {[
          { key: "dashboard", label: "Overview", icon: BarChart3 },
          { key: "tracking", label: "Live Tracking", icon: Radio },
          { key: "map", label: "Location View", icon: Globe },
          { key: "timeline", label: "Lifecycle", icon: History },
          { key: "alerts", label: "Alerts", icon: Bell },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.key ? "border-cyan-600 text-cyan-600 dark:border-cyan-400 dark:text-cyan-400" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid={`tab-${tab.key}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.key === "alerts" && alerts.length > 0 && (
              <Badge className="bg-red-500 text-white border-0 text-[10px] h-5 min-w-[20px] flex items-center justify-center">{alerts.length}</Badge>
            )}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border shadow-sm" data-testid="chart-by-location">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan-600" /> Assets by Location</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.byLocation.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={stats.byLocation} cx="50%" cy="50%" outerRadius={85} innerRadius={40} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {stats.byLocation.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">No location data</div>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm" data-testid="chart-status-dist">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-600" /> Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={Object.entries(TRACKING_STATUS).map(([k, v]) => ({ name: v.label, value: stats.byStatus[k] || 0 })).filter(d => d.value > 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={10} angle={-20} textAnchor="end" height={50} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border shadow-sm" data-testid="chart-by-type">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Layers className="h-4 w-4 text-indigo-600" /> Assets by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.byType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.byType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={11} />
                      <YAxis dataKey="name" type="category" fontSize={11} width={80} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">No type data</div>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm" data-testid="chart-fault-rate">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> Fault Rate by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.faultRate.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.faultRate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={10} angle={-20} textAnchor="end" height={50} />
                      <YAxis fontSize={11} unit="%" />
                      <Tooltip formatter={(v: number) => `${v}%`} />
                      <Bar dataKey="rate" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">No fault data</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-sm" data-testid="chart-movement-trend">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-cyan-600" /> Asset Movement Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.movementTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={stats.movementTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="movements" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No movement data yet</div>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm" data-testid="card-value-summary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-teal-600" /> Portfolio Value Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Total Book Value</p>
                  <p className="text-lg font-bold mt-1">₨{stats.totalValue.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Deployed Value</p>
                  <p className="text-lg font-bold mt-1">₨{assets.filter(a => a.status === "deployed").reduce((s, a) => s + parseFloat(a.bookValue || a.purchaseCost || "0"), 0).toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">At-Risk Value</p>
                  <p className="text-lg font-bold mt-1 text-red-600">₨{assets.filter(a => a.status === "faulty" || a.status === "lost").reduce((s, a) => s + parseFloat(a.bookValue || a.purchaseCost || "0"), 0).toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Active Alerts</p>
                  <p className="text-lg font-bold mt-1 text-amber-600">{alerts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "tracking" && (
        <Card className="border shadow-sm" data-testid="card-live-tracking">
          <CardHeader className="pb-3 bg-gradient-to-r from-slate-900 to-cyan-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Radio className="h-4 w-4" /> Live Asset Tracking
              </CardTitle>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">{filteredAssets.length} assets</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, serial, MAC, IP, name, technician, location..."
                  className="pl-9 h-9 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9 text-sm" data-testid="select-status-filter"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(TRACKING_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[140px] h-9 text-sm" data-testid="select-location-filter"><SelectValue placeholder="Location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {LOCATION_TYPES.map(l => <SelectItem key={l} value={l}>{l.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px] h-9 text-sm" data-testid="select-type-filter"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={conditionFilter} onValueChange={setConditionFilter}>
                <SelectTrigger className="w-[160px] h-9 text-sm" data-testid="select-condition-filter"><SelectValue placeholder="Condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="warranty_expiring">Warranty Expiring</SelectItem>
                  <SelectItem value="warranty_expired">Warranty Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger className="w-[130px] h-9 text-sm" data-testid="select-assigned-filter"><SelectValue placeholder="Assignment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
              {(searchTerm || statusFilter !== "all" || locationFilter !== "all" || typeFilter !== "all" || conditionFilter !== "all" || assignedFilter !== "all") && (
                <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setSearchTerm(""); setStatusFilter("all"); setLocationFilter("all"); setTypeFilter("all"); setConditionFilter("all"); setAssignedFilter("all"); }} data-testid="button-clear-filters">
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-9 text-xs ml-auto" onClick={() => {
                const headers = ["Asset ID","Name","Type","Serial","MAC","Location","Location Type","Assigned To","Customer","IP","VLAN","Warranty","Book Value","Status","Last Movement"];
                const rows = filteredAssets.map(a => [
                  a.assetTag, a.name, a.type || "", a.serialNumber || "", a.macAddress || "",
                  a.location || "", a.locationType || "", a.assignedTo || "",
                  getCustomerForAsset(a.id) || "", a.ipAddress || "", a.vlan || "",
                  WARRANTY_STATUS(a).label, parseFloat(a.bookValue || a.purchaseCost || "0").toString(),
                  (TRACKING_STATUS[a.status] || TRACKING_STATUS.available).label,
                  getLastMovementDate(a.id) || "",
                ]);
                const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url; link.download = `asset-tracking-${new Date().toISOString().split("T")[0]}.csv`;
                link.click(); URL.revokeObjectURL(url);
                toast({ title: `Exported ${filteredAssets.length} assets` });
              }} data-testid="button-export-csv">
                <Download className="h-3 w-3 mr-1" /> Export CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white text-xs">
                    {[
                      { key: "assetTag", label: "Asset ID", left: true, rounded: "rounded-tl-lg" },
                      { key: "name", label: "Name", left: true },
                      { key: "type", label: "Type", left: true },
                      { key: "", label: "Serial / MAC", left: true },
                      { key: "location", label: "Location", left: true },
                      { key: "assignedTo", label: "Assigned To", left: true },
                      { key: "", label: "Customer", left: true },
                      { key: "", label: "IP / VLAN", left: true },
                      { key: "", label: "Condition", left: true },
                      { key: "", label: "Warranty", left: true },
                      { key: "bookValue", label: "Book Value", left: true },
                      { key: "status", label: "Status", left: true },
                      { key: "", label: "Last Movement", left: true },
                    ].map((col, ci) => (
                      <th
                        key={ci}
                        className={`text-left p-3 font-medium ${col.rounded || ""} ${col.key ? "cursor-pointer hover:bg-white/10 select-none" : ""}`}
                        onClick={() => {
                          if (!col.key) return;
                          if (sortField === col.key) setSortDir(d => d === "asc" ? "desc" : "asc");
                          else { setSortField(col.key); setSortDir("asc"); }
                        }}
                        data-testid={`th-${col.label.toLowerCase().replace(/[\s/]+/g, "-")}`}
                      >
                        {col.label}
                        {col.key && sortField === col.key && <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>}
                      </th>
                    ))}
                    <th className="text-right p-3 rounded-tr-lg font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="text-center py-12 text-muted-foreground">
                        <Radio className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="font-medium">No assets match your filters</p>
                        <p className="text-xs mt-1">Try adjusting your search criteria</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset, idx) => {
                      const sc = TRACKING_STATUS[asset.status] || TRACKING_STATUS.available;
                      const StatusIcon = sc.icon;
                      const ws = WARRANTY_STATUS(asset);
                      const customer = getCustomerForAsset(asset.id);
                      const lastMove = getLastMovementDate(asset.id);
                      return (
                        <tr key={asset.id} className={`border-b border-border/50 hover:bg-accent/50 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/20"}`} data-testid={`row-asset-${asset.id}`}>
                          <td className="p-3">
                            <span className="font-mono text-xs font-medium text-cyan-700 dark:text-cyan-400">{asset.assetTag}</span>
                          </td>
                          <td className="p-3 text-xs font-medium max-w-[120px] truncate">{asset.name}</td>
                          <td className="p-3 text-xs">{asset.type || "—"}</td>
                          <td className="p-3">
                            <div className="text-[10px] font-mono text-muted-foreground">{asset.serialNumber || "—"}</div>
                            {asset.macAddress && <div className="text-[10px] font-mono text-muted-foreground">{asset.macAddress}</div>}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-xs">
                              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[100px]">{asset.location || "Unassigned"}</span>
                            </div>
                            {asset.locationType && <div className="text-[10px] text-muted-foreground capitalize ml-4">{asset.locationType.replace("_", " ")}</div>}
                          </td>
                          <td className="p-3 text-xs">{asset.assignedTo || "—"}</td>
                          <td className="p-3 text-xs" data-testid={`text-customer-${asset.id}`}>{customer || "—"}</td>
                          <td className="p-3">
                            {asset.ipAddress ? <div className="text-[10px] font-mono">{asset.ipAddress}</div> : <span className="text-xs text-muted-foreground">—</span>}
                            {asset.vlan && <div className="text-[10px] text-muted-foreground">VLAN: {asset.vlan}</div>}
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] ${asset.status === "faulty" ? "text-red-600 font-medium" : asset.status === "maintenance" ? "text-purple-600" : "text-muted-foreground"}`}>
                              {asset.status === "faulty" ? "Faulty" : asset.status === "maintenance" ? "Under Repair" : "Good"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-medium ${ws.color}`}>{ws.label}</span>
                          </td>
                          <td className="p-3 text-xs font-medium">₨{parseFloat(asset.bookValue || asset.purchaseCost || "0").toLocaleString()}</td>
                          <td className="p-3">
                            <Badge className={`${sc.color} border-0 text-[10px] gap-1`}><StatusIcon className="h-3 w-3" />{sc.label}</Badge>
                          </td>
                          <td className="p-3 text-[10px] text-muted-foreground">{lastMove ? new Date(lastMove).toLocaleDateString() : "—"}</td>
                          <td className="p-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-actions-${asset.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDetailAsset(asset)} data-testid={`action-view-${asset.id}`}><Eye className="h-4 w-4 mr-2" /> View Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setTimelineAsset(asset); setActiveTab("timeline"); }} data-testid={`action-timeline-${asset.id}`}><History className="h-4 w-4 mr-2" /> View Timeline</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { window.location.href = `/assets?tab=transfers`; }} data-testid={`action-transfer-${asset.id}`}>
                                  <ArrowRightLeft className="h-4 w-4 mr-2" /> Transfer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { window.location.href = `/asset-assignments`; }} data-testid={`action-assign-${asset.id}`}>
                                  <Users className="h-4 w-4 mr-2" /> Assign
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {asset.status !== "faulty" && (
                                  <DropdownMenuItem onClick={() => updateMutation.mutate({ id: asset.id, data: { status: "faulty" } })} className="text-red-600" data-testid={`action-faulty-${asset.id}`}>
                                    <AlertTriangle className="h-4 w-4 mr-2" /> Mark Faulty
                                  </DropdownMenuItem>
                                )}
                                {asset.status === "faulty" && (
                                  <DropdownMenuItem onClick={() => updateMutation.mutate({ id: asset.id, data: { status: "available" } })} className="text-emerald-600" data-testid={`action-available-${asset.id}`}>
                                    <CheckCircle className="h-4 w-4 mr-2" /> Mark Available
                                  </DropdownMenuItem>
                                )}
                                {asset.status !== "maintenance" && (
                                  <DropdownMenuItem onClick={() => updateMutation.mutate({ id: asset.id, data: { status: "maintenance" } })} className="text-purple-600" data-testid={`action-maintenance-${asset.id}`}>
                                    <Wrench className="h-4 w-4 mr-2" /> Send to Maintenance
                                  </DropdownMenuItem>
                                )}
                                {asset.status === "deployed" && (
                                  <DropdownMenuItem onClick={() => updateMutation.mutate({ id: asset.id, data: { status: "reserved" } })} className="text-orange-600" data-testid={`action-suspend-${asset.id}`}>
                                    <Shield className="h-4 w-4 mr-2" /> Suspend
                                  </DropdownMenuItem>
                                )}
                                {asset.status !== "lost" && (
                                  <DropdownMenuItem onClick={() => updateMutation.mutate({ id: asset.id, data: { status: "lost" } })} className="text-gray-600" data-testid={`action-lost-${asset.id}`}>
                                    <AlertCircle className="h-4 w-4 mr-2" /> Mark Lost
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "map" && (
        <div className="space-y-6">
          <Card className="border shadow-sm" data-testid="card-location-overview">
            <CardHeader className="pb-3 bg-gradient-to-r from-slate-900 to-cyan-700 text-white rounded-t-lg">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Globe className="h-4 w-4" /> Asset Location Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {LOCATION_TYPES.map(loc => {
                  const locAssets = assets.filter(a => a.locationType === loc);
                  const locName = loc.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase());
                  const icons: Record<string, any> = { warehouse: Package, pop: Server, customer: Users, technician: Wrench, office: Monitor, repair_center: Wrench };
                  const LocIcon = icons[loc] || MapPin;
                  const colors: Record<string, string> = {
                    warehouse: "from-emerald-600 to-green-400",
                    pop: "from-blue-600 to-cyan-400",
                    customer: "from-indigo-600 to-violet-400",
                    technician: "from-amber-600 to-yellow-400",
                    office: "from-slate-600 to-gray-400",
                    repair_center: "from-purple-600 to-fuchsia-400",
                  };
                  return (
                    <Card key={loc} className={`bg-gradient-to-br ${colors[loc] || "from-gray-600 to-gray-400"} text-white border-0`} data-testid={`card-location-${loc}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <LocIcon className="h-5 w-5 text-white/70" />
                            <span className="font-semibold text-sm">{locName}</span>
                          </div>
                          <span className="text-2xl font-bold">{locAssets.length}</span>
                        </div>
                        <div className="space-y-1">
                          {Object.entries(TRACKING_STATUS).map(([k, v]) => {
                            const count = locAssets.filter(a => a.status === k).length;
                            if (count === 0) return null;
                            return (
                              <div key={k} className="flex items-center justify-between text-xs text-white/80">
                                <span className="flex items-center gap-1"><div className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />{v.label}</span>
                                <span>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="border" data-testid="card-unassigned-location">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" /> Assets Without Location Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const noLoc = assets.filter(a => !a.locationType && !a.location);
                    if (noLoc.length === 0) {
                      return <p className="text-sm text-muted-foreground py-4 text-center">All assets have location assignments</p>;
                    }
                    return (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {noLoc.slice(0, 20).map(a => (
                          <div key={a.id} className="flex items-center justify-between p-2 rounded-md bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-cyan-700 dark:text-cyan-400">{a.assetTag}</span>
                              <span className="text-muted-foreground">{a.name}</span>
                            </div>
                            <Badge className={`${(TRACKING_STATUS[a.status] || TRACKING_STATUS.available).color} border-0 text-[10px]`}>{(TRACKING_STATUS[a.status] || TRACKING_STATUS.available).label}</Badge>
                          </div>
                        ))}
                        {noLoc.length > 20 && <p className="text-xs text-muted-foreground text-center">...and {noLoc.length - 20} more</p>}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="border shadow-sm" data-testid="card-timeline-select">
              <CardHeader className="pb-2 bg-gradient-to-r from-slate-900 to-cyan-700 text-white rounded-t-lg">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><History className="h-4 w-4" /> Select Asset</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search assets..." className="pl-9 h-8 text-sm" data-testid="input-timeline-search" />
                </div>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-1.5">
                    {assets.slice(0, 50).map(a => {
                      const sc = TRACKING_STATUS[a.status] || TRACKING_STATUS.available;
                      return (
                        <button
                          key={a.id}
                          onClick={() => setTimelineAsset(a)}
                          className={`w-full text-left p-2.5 rounded-md text-xs transition-colors ${timelineAsset?.id === a.id ? "bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-300 dark:border-cyan-700" : "hover:bg-muted/50 border border-transparent"}`}
                          data-testid={`timeline-asset-${a.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-medium text-cyan-700 dark:text-cyan-400">{a.assetTag}</span>
                            <div className={`w-2 h-2 rounded-full ${sc.dot}`} />
                          </div>
                          <p className="text-muted-foreground truncate mt-0.5">{a.name}</p>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="border shadow-sm" data-testid="card-timeline-view">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <History className="h-4 w-4 text-cyan-600" />
                  {timelineAsset ? `Lifecycle — ${timelineAsset.assetTag}` : "Asset Lifecycle Timeline"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!timelineAsset ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-medium">Select an asset to view its lifecycle</p>
                    <p className="text-xs mt-1">Choose from the list on the left</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-muted/50 border mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div><p className="text-muted-foreground">Asset</p><p className="font-medium">{timelineAsset.name}</p></div>
                        <div><p className="text-muted-foreground">Type</p><p className="font-medium">{timelineAsset.type}</p></div>
                        <div><p className="text-muted-foreground">Serial</p><p className="font-mono">{timelineAsset.serialNumber || "—"}</p></div>
                        <div><p className="text-muted-foreground">Status</p>
                          <Badge className={`${(TRACKING_STATUS[timelineAsset.status] || TRACKING_STATUS.available).color} border-0 text-[10px]`}>
                            {(TRACKING_STATUS[timelineAsset.status] || TRACKING_STATUS.available).label}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {assetTimeline.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                        <p className="text-sm">No lifecycle events recorded</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                        <div className="space-y-4">
                          {assetTimeline.map((event, i) => (
                            <div key={i} className="relative pl-10">
                              <div className={`absolute left-[10px] top-2 w-3 h-3 rounded-full ${event.color} ring-2 ring-white dark:ring-slate-900`} />
                              <div className="p-3 rounded-lg bg-muted/50 border">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-semibold">{event.action}</span>
                                  <span className="text-[10px] text-muted-foreground">{event.date ? new Date(event.date).toLocaleDateString() : ""}</span>
                                </div>
                                <div className="text-xs space-y-0.5 text-muted-foreground">
                                  {event.from && event.to && <p>From: <span className="text-foreground">{event.from}</span> → <span className="text-foreground">{event.to}</span></p>}
                                  {event.to && !event.from && <p>Location: <span className="text-foreground">{event.to}</span></p>}
                                  {event.person && <p>By: <span className="text-foreground">{event.person}</span></p>}
                                  {event.note && <p>{event.note}</p>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "alerts" && (
        <Card className="border shadow-sm" data-testid="card-alerts">
          <CardHeader className="pb-3 bg-gradient-to-r from-slate-900 to-cyan-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Bell className="h-4 w-4" /> Alerts & Exceptions</CardTitle>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">{alerts.length} alerts</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {alerts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-300" />
                <p className="font-medium">All Clear</p>
                <p className="text-xs mt-1">No alerts or exceptions detected</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border ${alert.severity === "critical" ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"}`}
                    data-testid={`alert-${i}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-full ${alert.severity === "critical" ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                        {alert.severity === "critical" ? <AlertCircle className="h-4 w-4 text-red-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Badge className={`border-0 text-[10px] ${alert.severity === "critical" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                            {alert.severity === "critical" ? "CRITICAL" : "WARNING"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground capitalize">{alert.type.replace("_", " ")}</span>
                        </div>
                        <p className="text-sm mt-1">{alert.message}</p>
                      </div>
                      {alert.assetId && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs shrink-0" onClick={() => {
                          const a = assets.find(x => x.id === alert.assetId);
                          if (a) setDetailAsset(a);
                        }}>
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!detailAsset} onOpenChange={() => setDetailAsset(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-cyan-600" />
              Asset Details — {detailAsset?.assetTag}
            </DialogTitle>
          </DialogHeader>
          {detailAsset && (() => {
            const sc = TRACKING_STATUS[detailAsset.status] || TRACKING_STATUS.available;
            const StatusIcon = sc.icon;
            const ws = WARRANTY_STATUS(detailAsset);
            const relatedAssigns = assignments.filter(a => a.assetId === detailAsset.id);
            return (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge className={`${sc.color} border-0 gap-1`}><StatusIcon className="h-3 w-3" />{sc.label}</Badge>
                  <Badge variant="outline" className={ws.color}>{ws.label} Warranty</Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium">{detailAsset.name}</p></div>
                  <div><p className="text-xs text-muted-foreground">Type</p><p className="font-medium">{detailAsset.type}</p></div>
                  <div><p className="text-xs text-muted-foreground">Category</p><p className="font-medium">{detailAsset.category || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Brand / Model</p><p className="font-medium">{detailAsset.brand || "—"} {detailAsset.model || ""}</p></div>
                  <div><p className="text-xs text-muted-foreground">Serial Number</p><p className="font-mono text-xs">{detailAsset.serialNumber || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">MAC Address</p><p className="font-mono text-xs">{detailAsset.macAddress || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">IP Address</p><p className="font-mono text-xs">{detailAsset.ipAddress || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">VLAN</p><p className="font-mono text-xs">{detailAsset.vlan || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Firmware</p><p className="text-xs">{detailAsset.firmwareVersion || "—"}</p></div>
                </div>

                <div className="border-t pt-3">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">LOCATION & ASSIGNMENT</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Location</p><p className="font-medium">{detailAsset.location || "Unassigned"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Location Type</p><p className="capitalize">{detailAsset.locationType?.replace("_", " ") || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Assigned To</p><p>{detailAsset.assignedTo || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Assignment Type</p><p className="capitalize">{detailAsset.assignedType || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Installed By</p><p>{detailAsset.installedBy || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Installation Date</p><p>{detailAsset.installationDate || "—"}</p></div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">FINANCIAL</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Purchase Cost</p><p className="font-medium">₨{parseFloat(detailAsset.purchaseCost || "0").toLocaleString()}</p></div>
                    <div><p className="text-xs text-muted-foreground">Book Value</p><p className="font-medium">₨{parseFloat(detailAsset.bookValue || detailAsset.purchaseCost || "0").toLocaleString()}</p></div>
                    <div><p className="text-xs text-muted-foreground">Depreciation</p><p>{detailAsset.depreciationMethod || "—"} ({detailAsset.depreciationRate || "0"}%)</p></div>
                    <div><p className="text-xs text-muted-foreground">Purchase Date</p><p>{detailAsset.purchaseDate || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Warranty End</p><p className={ws.color}>{detailAsset.warrantyEnd || "—"}</p></div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">MAINTENANCE</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Last Maintenance</p><p>{detailAsset.lastMaintenanceDate || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Next Maintenance</p><p>{detailAsset.nextMaintenanceDate || "—"}</p></div>
                  </div>
                </div>

                {relatedAssigns.length > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">CUSTOMER ASSIGNMENTS ({relatedAssigns.length})</h4>
                    <div className="space-y-2">
                      {relatedAssigns.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-xs">
                          <div>
                            <span className="font-mono font-medium">{a.assignmentId}</span>
                            <span className="text-muted-foreground ml-2">Customer #{a.customerId}</span>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">{a.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detailAsset.notes && (
                  <div className="border-t pt-3">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">NOTES</h4>
                    <p className="text-sm bg-muted/50 rounded p-3">{detailAsset.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" onClick={() => { setDetailAsset(null); setTimelineAsset(detailAsset); setActiveTab("timeline"); }}>
                    <History className="h-4 w-4 mr-1" /> View Timeline
                  </Button>
                  {detailAsset.status !== "faulty" && (
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => { updateMutation.mutate({ id: detailAsset.id, data: { status: "faulty" } }); setDetailAsset(null); }}>
                      <AlertTriangle className="h-4 w-4 mr-1" /> Mark Faulty
                    </Button>
                  )}
                  {detailAsset.status !== "maintenance" && (
                    <Button size="sm" variant="outline" className="text-purple-600 border-purple-200" onClick={() => { updateMutation.mutate({ id: detailAsset.id, data: { status: "maintenance" } }); setDetailAsset(null); }}>
                      <Wrench className="h-4 w-4 mr-1" /> Maintenance
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
