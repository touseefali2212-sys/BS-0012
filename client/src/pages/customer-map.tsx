import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Search, MapPin, Users, Activity, X, Server, Globe, Eye,
  Phone, Calendar, Wifi, Building2, AlertTriangle,
  BarChart3, Shield, ExternalLink, Navigation, Layers,
  ChevronRight, Signal, Zap, MapPinned, Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { Customer, Package as Pkg, NetworkDevice } from "@shared/schema";

const CHART_COLORS = ["#2563EB", "#14B8A6", "#7C3AED", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4", "#10B981"];

function createColorIcon(color: string) {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  });
}

const icons: Record<string, L.Icon> = {
  active: createColorIcon("green"),
  suspended: createColorIcon("orange"),
  disconnected: createColorIcon("red"),
  corporate: createColorIcon("blue"),
  heavy: createColorIcon("violet"),
  offline: createColorIcon("black"),
  pop: createColorIcon("gold"),
};

const MAP_LAYERS: Record<string, { url: string; attribution: string; label: string }> = {
  light: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    label: "Light Map",
  },
  dark: {
    url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
    label: "Dark Map",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    label: "Satellite",
  },
  hybrid: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    label: "Hybrid",
  },
};

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 1 }); }, [center, zoom]);
  return null;
}

export default function CustomerMapPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [popFilter, setPopFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [mapLayer, setMapLayer] = useState<string>("light");
  const [showInfra, setShowInfra] = useState(true);
  const [showPanel, setShowPanel] = useState<"list" | "analytics" | null>("list");
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.8103, 90.4125]);
  const [mapZoom, setMapZoom] = useState(7);

  const { data: customers, isLoading } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: packages } = useQuery<Pkg[]>({ queryKey: ["/api/packages"] });
  const { data: devices } = useQuery<NetworkDevice[]>({ queryKey: ["/api/network-devices"] });
  const allCustomers = customers || [];
  const allPackages = packages || [];
  const allDevices = devices || [];

  const packageMap = useMemo(() => {
    const m: Record<number, Pkg> = {};
    allPackages.forEach(p => { m[p.id] = p; });
    return m;
  }, [allPackages]);

  const getPackageName = (id: number | null | undefined) => id ? packageMap[id]?.name || "—" : "—";
  const getPackageSpeed = (id: number | null | undefined) => id ? packageMap[id]?.speed || "—" : "—";

  const uniqueAreas = useMemo(() => [...new Set(allCustomers.map(c => c.area).filter(Boolean))] as string[], [allCustomers]);
  const uniquePops = useMemo(() => [...new Set(allCustomers.map(c => c.server).filter(Boolean))] as string[], [allCustomers]);
  const uniqueServiceTypes = useMemo(() => [...new Set(allCustomers.map(c => c.connectionType).filter(Boolean))] as string[], [allCustomers]);

  const filtered = useMemo(() => {
    return allCustomers.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.fullName.toLowerCase().includes(q) || (c.customerId || "").toLowerCase().includes(q) || (c.area || "").toLowerCase().includes(q) || (c.address || "").toLowerCase().includes(q) || (c.usernameIp || "").toLowerCase().includes(q);
      const matchArea = areaFilter === "all" || c.area === areaFilter;
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchPop = popFilter === "all" || c.server === popFilter;
      const matchPkg = packageFilter === "all" || String(c.packageId) === packageFilter;
      const matchService = serviceTypeFilter === "all" || c.connectionType === serviceTypeFilter;
      return matchSearch && matchArea && matchStatus && matchPop && matchPkg && matchService;
    });
  }, [allCustomers, search, areaFilter, statusFilter, popFilter, packageFilter, serviceTypeFilter]);

  const customersWithCoords = useMemo(() => {
    return filtered.filter(c => c.mapLatitude && c.mapLongitude).map(c => ({
      ...c,
      lat: parseFloat(c.mapLatitude!),
      lng: parseFloat(c.mapLongitude!),
    }));
  }, [filtered]);

  const devicesWithCoords = useMemo(() => {
    return allDevices.filter(d => d.location).map(d => {
      const parts = (d.location || "").split(",").map(s => parseFloat(s.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { ...d, lat: parts[0], lng: parts[1] };
      }
      return null;
    }).filter(Boolean) as (NetworkDevice & { lat: number; lng: number })[];
  }, [allDevices]);

  const totalCustomers = allCustomers.length;
  const activeCustomers = allCustomers.filter(c => c.status === "active").length;
  const suspendedCustomers = allCustomers.filter(c => c.status === "suspended").length;
  const corporateClients = allCustomers.filter(c => c.customerType === "corporate").length;
  const popCount = uniquePops.length;
  const coverageAreas = uniqueAreas.length;

  const getMarkerIcon = (c: Customer) => {
    if (c.customerType === "corporate") return icons.corporate;
    if (c.status === "suspended") return icons.suspended;
    if (c.status === "disconnected") return icons.disconnected;
    return icons.active;
  };

  const areaAnalytics = useMemo(() => {
    const map: Record<string, { total: number; active: number; suspended: number; revenue: number; customers: Customer[] }> = {};
    allCustomers.forEach(c => {
      const area = c.area || "Unknown";
      if (!map[area]) map[area] = { total: 0, active: 0, suspended: 0, revenue: 0, customers: [] };
      map[area].total++;
      if (c.status === "active") map[area].active++;
      if (c.status === "suspended") map[area].suspended++;
      map[area].revenue += parseFloat(String(c.monthlyBill || "0"));
      map[area].customers.push(c);
    });
    return Object.entries(map).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.total - a.total);
  }, [allCustomers]);

  const areaChartData = areaAnalytics.slice(0, 10).map(a => ({
    name: a.name.length > 12 ? a.name.slice(0, 12) + "…" : a.name,
    customers: a.total,
    revenue: +a.revenue.toFixed(0),
  }));

  const statusDistribution = [
    { name: "Active", value: activeCustomers, color: "#22c55e" },
    { name: "Suspended", value: suspendedCustomers, color: "#f59e0b" },
    { name: "Disconnected", value: allCustomers.filter(c => c.status === "disconnected").length, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const serviceTypeDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    allCustomers.forEach(c => {
      const t = c.connectionType || "Unknown";
      map[t] = (map[t] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allCustomers]);

  const handleViewOnGoogleMaps = (c: Customer) => {
    if (c.mapLatitude && c.mapLongitude) {
      window.open(`https://www.google.com/maps?q=${c.mapLatitude},${c.mapLongitude}`, "_blank");
    } else {
      toast({ title: "No coordinates available for this customer" });
    }
  };

  const focusCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    if (c.mapLatitude && c.mapLongitude) {
      setMapCenter([parseFloat(c.mapLatitude), parseFloat(c.mapLongitude)]);
      setMapZoom(16);
    }
  };

  const focusArea = (areaName: string) => {
    setSelectedArea(areaName);
    setShowPanel("analytics");
    const areaCusts = customersWithCoords.filter(c => c.area === areaName);
    if (areaCusts.length > 0) {
      const avgLat = areaCusts.reduce((s, c) => s + c.lat, 0) / areaCusts.length;
      const avgLng = areaCusts.reduce((s, c) => s + c.lng, 0) / areaCusts.length;
      setMapCenter([avgLat, avgLng]);
      setMapZoom(13);
    }
  };

  const selectedAreaData = selectedArea ? areaAnalytics.find(a => a.name === selectedArea) : null;

  const computeMapCenter = useMemo<[number, number]>(() => {
    if (customersWithCoords.length > 0) {
      const avgLat = customersWithCoords.reduce((s, c) => s + c.lat, 0) / customersWithCoords.length;
      const avgLng = customersWithCoords.reduce((s, c) => s + c.lng, 0) / customersWithCoords.length;
      return [avgLat, avgLng];
    }
    return [23.8103, 90.4125];
  }, [customersWithCoords]);

  useEffect(() => {
    if (customersWithCoords.length > 0 && mapZoom === 7) {
      setMapCenter(computeMapCenter);
      setMapZoom(10);
    }
  }, [computeMapCenter]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shadow-lg" data-testid="icon-customer-map">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-customer-map-title">Customer Map</h1>
            <p className="text-sm text-muted-foreground">Network footprint intelligence — {customersWithCoords.length} pinned of {totalCustomers} customers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={mapLayer} onValueChange={setMapLayer}>
            <SelectTrigger className="w-[130px] h-8 text-xs" data-testid="select-map-layer"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(MAP_LAYERS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant={showInfra ? "default" : "outline"} size="sm" className={`h-8 text-xs ${showInfra ? "bg-teal-600" : ""}`} onClick={() => setShowInfra(!showInfra)} data-testid="button-toggle-infra">
            <Server className="h-3.5 w-3.5 mr-1" />Infra
          </Button>
          <Button variant={showPanel === "list" ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setShowPanel(showPanel === "list" ? null : "list")} data-testid="button-toggle-list">
            <Users className="h-3.5 w-3.5 mr-1" />List
          </Button>
          <Button variant={showPanel === "analytics" ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => { setShowPanel(showPanel === "analytics" ? null : "analytics"); setSelectedArea(null); }} data-testid="button-toggle-analytics">
            <BarChart3 className="h-3.5 w-3.5 mr-1" />Analytics
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: "Total Customers", value: totalCustomers, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Active", value: activeCustomers, icon: Activity, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
          { label: "Suspended", value: suspendedCustomers, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "Corporate", value: corporateClients, icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
          { label: "POP Count", value: popCount, icon: Server, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
          { label: "Coverage Areas", value: coverageAreas, icon: MapPinned, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30" },
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

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" data-testid="input-search-customers" />
        </div>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-[140px] h-9" data-testid="select-area-filter"><SelectValue placeholder="All Areas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {uniqueAreas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9" data-testid="select-status-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="disconnected">Disconnected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={popFilter} onValueChange={setPopFilter}>
          <SelectTrigger className="w-[140px] h-9" data-testid="select-pop-filter"><SelectValue placeholder="All POPs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All POPs</SelectItem>
            {uniquePops.map(p => <SelectItem key={p} value={p!}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={packageFilter} onValueChange={setPackageFilter}>
          <SelectTrigger className="w-[140px] h-9" data-testid="select-package-filter"><SelectValue placeholder="All Packages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Packages</SelectItem>
            {allPackages.filter(p => p.isActive).map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
          <SelectTrigger className="w-[140px] h-9" data-testid="select-service-filter"><SelectValue placeholder="All Services" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {uniqueServiceTypes.map(s => <SelectItem key={s} value={s!}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-green-500" />Active</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Suspended</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Disconnected</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" />Corporate</span>
        </div>
      </div>

      <div className={`grid gap-4 ${showPanel ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}>
        <Card className={`border-0 shadow-sm ${showPanel ? "lg:col-span-2" : ""}`} data-testid="map-container">
          <CardContent className="p-0">
            <div className="rounded-lg overflow-hidden" style={{ height: "520px" }}>
              <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                <MapUpdater center={mapCenter} zoom={mapZoom} />
                <TileLayer url={MAP_LAYERS[mapLayer].url} attribution={MAP_LAYERS[mapLayer].attribution} />

                {customersWithCoords.map(c => (
                  <Marker key={c.id} position={[c.lat, c.lng]} icon={getMarkerIcon(c)}>
                    <Popup maxWidth={280}>
                      <div className="space-y-2 text-xs min-w-[220px]">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">{c.fullName}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${c.status === "active" ? "bg-green-100 text-green-700" : c.status === "suspended" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{c.status}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          <div><span className="text-gray-500">ID:</span> {c.customerId}</div>
                          <div><span className="text-gray-500">Speed:</span> {getPackageSpeed(c.packageId)}</div>
                          <div><span className="text-gray-500">IP:</span> {c.usernameIp || "—"}</div>
                          <div><span className="text-gray-500">VLAN:</span> {c.zone || "—"}</div>
                          <div><span className="text-gray-500">POP:</span> {c.server || "—"}</div>
                          <div><span className="text-gray-500">Type:</span> {c.connectionType || "—"}</div>
                          <div><span className="text-gray-500">Package:</span> {getPackageName(c.packageId)}</div>
                          <div><span className="text-gray-500">Since:</span> {c.connectionDate || "—"}</div>
                        </div>
                        <div className="flex gap-1 pt-1 border-t">
                          <button onClick={() => focusCustomer(c)} className="flex-1 text-center py-1 rounded bg-blue-50 text-blue-600 font-medium text-[10px]" data-testid={`button-popup-details-${c.id}`}>View Details</button>
                          <button onClick={() => handleViewOnGoogleMaps(c)} className="flex-1 text-center py-1 rounded bg-teal-50 text-teal-600 font-medium text-[10px]" data-testid={`button-popup-navigate-${c.id}`}>Navigate</button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {showInfra && devicesWithCoords.map(d => (
                  <Marker key={`dev-${d.id}`} position={[d.lat, d.lng]} icon={icons.pop}>
                    <Popup maxWidth={250}>
                      <div className="space-y-1 text-xs min-w-[180px]">
                        <div className="font-bold text-sm flex items-center gap-1">
                          <Server className="h-3.5 w-3.5 text-teal-600" /> {d.name}
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          <div><span className="text-gray-500">Type:</span> {d.type}</div>
                          <div><span className="text-gray-500">IP:</span> {d.ipAddress}</div>
                          <div><span className="text-gray-500">Status:</span> <span className={d.status === "online" ? "text-green-600" : "text-red-600"}>{d.status}</span></div>
                          <div><span className="text-gray-500">CPU:</span> {d.cpuUsage || 0}%</div>
                          <div><span className="text-gray-500">Memory:</span> {d.memoryUsage || 0}%</div>
                          <div><span className="text-gray-500">Vendor:</span> {d.vendor || "—"}</div>
                        </div>
                        {((d.cpuUsage || 0) > 80 || (d.memoryUsage || 0) > 80) && (
                          <div className="text-[10px] text-red-600 font-medium pt-1 border-t flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> High utilization detected</div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {showPanel === "list" && (
          <Card className="border-0 shadow-sm" data-testid="panel-customer-list">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Customer List ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-y-auto max-h-[470px]">
                {filtered.length === 0 ? (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />No customers found
                  </div>
                ) : (
                  <div className="divide-y">
                    {filtered.slice(0, 100).map(c => (
                      <button key={c.id} onClick={() => focusCustomer(c)} className="w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900" data-testid={`list-customer-${c.id}`}>
                        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${c.status === "active" ? "bg-green-500" : c.status === "suspended" ? "bg-amber-500" : "bg-red-500"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{c.fullName}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{c.area || "—"} • {getPackageName(c.packageId)} • {c.usernameIp || "—"}</div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {filtered.length > 100 && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-t">Showing 100 of {filtered.length}</div>
              )}
            </CardContent>
          </Card>
        )}

        {showPanel === "analytics" && (
          <Card className="border-0 shadow-sm overflow-y-auto max-h-[560px]" data-testid="panel-analytics">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{selectedArea ? `Area: ${selectedArea}` : "Area Analytics"}</CardTitle>
              {selectedArea && <button onClick={() => setSelectedArea(null)} className="text-[10px] text-blue-600 font-medium" data-testid="button-back-all-areas">← All Areas</button>}
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAreaData ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Total", value: selectedAreaData.total },
                      { label: "Active", value: selectedAreaData.active },
                      { label: "Suspended", value: selectedAreaData.suspended },
                      { label: "Revenue", value: `৳${selectedAreaData.revenue.toFixed(0)}` },
                    ].map((s, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
                        <div className="text-lg font-bold">{s.value}</div>
                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                          <TableHead className="text-[10px] font-semibold">Customer</TableHead>
                          <TableHead className="text-[10px] font-semibold">Status</TableHead>
                          <TableHead className="text-[10px] font-semibold">Package</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedAreaData.customers.slice(0, 30).map(c => (
                          <TableRow key={c.id} className="cursor-pointer" onClick={() => focusCustomer(c)} data-testid={`row-area-customer-${c.id}`}>
                            <TableCell className="text-xs font-medium py-1.5">{c.fullName}</TableCell>
                            <TableCell className="py-1.5">
                              <div className={`h-2 w-2 rounded-full inline-block ${c.status === "active" ? "bg-green-500" : c.status === "suspended" ? "bg-amber-500" : "bg-red-500"}`} />
                            </TableCell>
                            <TableCell className="text-[10px] text-muted-foreground py-1.5">{getPackageName(c.packageId)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <div className="text-xs font-medium mb-2">Customers by Area</div>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={areaChartData} layout="vertical">
                          <XAxis type="number" tick={{ fontSize: 9 }} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={80} />
                          <Tooltip />
                          <Bar dataKey="customers" fill="#2563EB" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <div className="text-xs font-medium mb-2">Status Distribution</div>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                            {statusDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip />
                          <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {serviceTypeDistribution.length > 0 && (
                      <div>
                        <div className="text-xs font-medium mb-2">Service Types</div>
                        <ResponsiveContainer width="100%" height={160}>
                          <PieChart>
                            <Pie data={serviceTypeDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                              {serviceTypeDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-medium mb-2">Area Quick Access</div>
                    <div className="space-y-1">
                      {areaAnalytics.slice(0, 15).map(a => (
                        <button key={a.name} onClick={() => focusArea(a.name)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900" data-testid={`button-area-${a.name}`}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-teal-600" />
                            <span className="text-xs font-medium">{a.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">{a.total} customers</span>
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40" onClick={() => setSelectedCustomer(null)} data-testid="customer-detail-overlay">
          <Card className="w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()} data-testid="card-customer-detail">
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div>
                <h3 className="font-semibold text-lg" data-testid="text-detail-name">{selectedCustomer.fullName}</h3>
                <p className="text-xs text-muted-foreground">{selectedCustomer.customerId} • {selectedCustomer.area || "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] capitalize ${selectedCustomer.status === "active" ? "text-green-600 border-green-300" : selectedCustomer.status === "suspended" ? "text-amber-600 border-amber-300" : "text-red-600 border-red-300"}`} data-testid="badge-detail-status">{selectedCustomer.status}</Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedCustomer(null)} data-testid="button-close-detail"><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Wifi className="h-3 w-3" />Package</p>
                  <p className="font-medium text-xs" data-testid="text-detail-package">{getPackageName(selectedCustomer.packageId)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />Speed</p>
                  <p className="font-medium text-xs font-mono">{getPackageSpeed(selectedCustomer.packageId)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Signal className="h-3 w-3" />IP Address</p>
                  <p className="font-medium text-xs font-mono">{selectedCustomer.usernameIp || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Layers className="h-3 w-3" />VLAN / Zone</p>
                  <p className="font-medium text-xs">{selectedCustomer.zone || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Server className="h-3 w-3" />POP / Router</p>
                  <p className="font-medium text-xs">{selectedCustomer.server || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Radio className="h-3 w-3" />Connection Type</p>
                  <p className="font-medium text-xs capitalize">{selectedCustomer.connectionType || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Installation Date</p>
                  <p className="font-medium text-xs">{selectedCustomer.connectionDate || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" />Monthly Bill</p>
                  <p className="font-medium text-xs font-mono">৳{selectedCustomer.monthlyBill || "0"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />Address</p>
                  <p className="font-medium text-xs" data-testid="text-detail-address">{selectedCustomer.address || selectedCustomer.presentAddress || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />Phone</p>
                  <p className="font-medium text-xs" data-testid="text-detail-phone">{selectedCustomer.phone || selectedCustomer.phoneNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Activity className="h-3 w-3" />Last Activity</p>
                  <p className="font-medium text-xs">{selectedCustomer.expireDate || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => { window.location.href = `/customer-profile/${selectedCustomer.id}`; }} data-testid="button-view-profile">
                  <Eye className="h-3.5 w-3.5 mr-1" />View Profile
                </Button>
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => handleViewOnGoogleMaps(selectedCustomer)} data-testid="button-navigate">
                  <Navigation className="h-3.5 w-3.5 mr-1" />Navigate
                </Button>
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => toast({ title: "Task created", description: `Task created for ${selectedCustomer.fullName}` })} data-testid="button-create-task">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />Create Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
