import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type {
  FiberRoute, OltDevice, GponSplitter, OnuDevice, NetworkTower, P2pLink,
  Customer, IpAddress, Subnet,
} from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Layers, MapPin, Plus, Trash2, Edit, Eye, Search, Download,
  Server, Wifi, Radio, Globe, Signal, Smartphone,
  ChevronRight, AlertTriangle, CheckCircle2, X, Cable,
  Loader2, MoreVertical, RefreshCw, Navigation,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MAP_LAYERS: Record<string, { url: string; attribution: string; label: string }> = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    label: "Street View",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    label: "Satellite",
  },
  dark: {
    url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
    label: "Dark Network",
  },
  hybrid: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    label: "Hybrid",
  },
};

const STATUS_COLORS: Record<string, string> = {
  active: "#22C55E",
  warning: "#EAB308",
  planned: "#3B82F6",
  maintenance: "#F97316",
  down: "#EF4444",
  disconnected: "#374151",
  online: "#22C55E",
  offline: "#EF4444",
  low_signal: "#EAB308",
  suspended: "#374151",
  stable: "#22C55E",
  congested: "#EAB308",
};

const statusBadgeClass: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  online: "bg-green-100 text-green-700 border-green-200",
  stable: "bg-green-100 text-green-700 border-green-200",
  warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low_signal: "bg-yellow-100 text-yellow-700 border-yellow-200",
  congested: "bg-yellow-100 text-yellow-700 border-yellow-200",
  planned: "bg-blue-100 text-blue-700 border-blue-200",
  maintenance: "bg-orange-100 text-orange-700 border-orange-200",
  down: "bg-red-100 text-red-700 border-red-200",
  offline: "bg-red-100 text-red-700 border-red-200",
  disconnected: "bg-gray-100 text-gray-500 border-gray-200",
  suspended: "bg-gray-100 text-gray-500 border-gray-200",
};

function createSvgIcon(color: string, shape: string, size: number = 28) {
  let svgContent = "";
  if (shape === "olt") {
    svgContent = `<rect x="4" y="6" width="20" height="16" rx="3" fill="${color}" stroke="#fff" stroke-width="2"/>
      <rect x="8" y="10" width="3" height="3" rx="1" fill="#fff"/>
      <rect x="13" y="10" width="3" height="3" rx="1" fill="#fff"/>
      <rect x="18" y="10" width="3" height="3" rx="1" fill="#fff"/>
      <rect x="8" y="15" width="3" height="3" rx="1" fill="#fff" opacity="0.6"/>
      <rect x="13" y="15" width="3" height="3" rx="1" fill="#fff" opacity="0.6"/>`;
  } else if (shape === "splitter") {
    svgContent = `<circle cx="14" cy="14" r="10" fill="${color}" stroke="#fff" stroke-width="2"/>
      <line x1="14" y1="6" x2="14" y2="14" stroke="#fff" stroke-width="2"/>
      <line x1="14" y1="14" x2="7" y2="20" stroke="#fff" stroke-width="1.5"/>
      <line x1="14" y1="14" x2="14" y2="22" stroke="#fff" stroke-width="1.5"/>
      <line x1="14" y1="14" x2="21" y2="20" stroke="#fff" stroke-width="1.5"/>`;
  } else if (shape === "onu") {
    svgContent = `<rect x="6" y="8" width="16" height="12" rx="2" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="10" cy="14" r="2" fill="#fff"/>
      <rect x="14" y="12" width="5" height="1.5" rx="0.5" fill="#fff"/>
      <rect x="14" y="15" width="5" height="1.5" rx="0.5" fill="#fff" opacity="0.6"/>`;
  } else if (shape === "tower") {
    svgContent = `<polygon points="14,2 22,26 6,26" fill="${color}" stroke="#fff" stroke-width="2"/>
      <line x1="9" y1="18" x2="19" y2="18" stroke="#fff" stroke-width="1.5"/>
      <line x1="10" y1="13" x2="18" y2="13" stroke="#fff" stroke-width="1.5"/>
      <circle cx="14" cy="9" r="2" fill="#fff"/>`;
  } else {
    svgContent = `<circle cx="14" cy="14" r="10" fill="${color}" stroke="#fff" stroke-width="2"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 28 28">${svgContent}</svg>`;
  return L.divIcon({
    html: svg,
    className: "custom-network-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function MapClickHandler({ onMapClick, enabled }: { onMapClick: (lat: number, lng: number) => void; enabled: boolean }) {
  useMapEvents({
    click(e) {
      if (enabled) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const DEFAULT_CENTER: [number, number] = [31.5204, 74.3587];
const DEFAULT_ZOOM = 12;

export default function NetworkMapPage() {
  const { toast } = useToast();
  const [mapLayer, setMapLayer] = useState("street");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("map");
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; data: any } | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addType, setAddType] = useState<string>("olt");
  const [editMode, setEditMode] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [mapClickMode, setMapClickMode] = useState<string | null>(null);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const [layers, setLayers] = useState({
    fiberRoutes: true,
    wirelessLinks: true,
    oltNodes: true,
    splitters: true,
    onuDevices: true,
    towers: true,
    ipOverlay: false,
  });

  const fiberRoutesQ = useQuery<FiberRoute[]>({ queryKey: ["/api/fiber-routes"] });
  const towersQ = useQuery<NetworkTower[]>({ queryKey: ["/api/network-towers"] });
  const oltsQ = useQuery<OltDevice[]>({ queryKey: ["/api/olt-devices"] });
  const splittersQ = useQuery<GponSplitter[]>({ queryKey: ["/api/gpon-splitters"] });
  const onusQ = useQuery<OnuDevice[]>({ queryKey: ["/api/onu-devices"] });
  const p2pLinksQ = useQuery<P2pLink[]>({ queryKey: ["/api/p2p-links"] });
  const customersQ = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const ipAddressesQ = useQuery<IpAddress[]>({ queryKey: ["/api/ip-addresses"] });
  const subnetsQ = useQuery<Subnet[]>({ queryKey: ["/api/subnets"] });

  const fiberRoutes = fiberRoutesQ.data || [];
  const towers = towersQ.data || [];
  const olts = oltsQ.data || [];
  const splitters = splittersQ.data || [];
  const onus = onusQ.data || [];
  const p2pLinks = p2pLinksQ.data || [];
  const customers = customersQ.data || [];
  const ipAddresses = ipAddressesQ.data || [];
  const subnets = subnetsQ.data || [];

  const isLoading = fiberRoutesQ.isLoading || towersQ.isLoading || oltsQ.isLoading || splittersQ.isLoading || onusQ.isLoading || p2pLinksQ.isLoading;

  const [formData, setFormData] = useState<Record<string, any>>({});

  const setFormField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
    setFormData(prev => ({ ...prev, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
    if (mapClickMode === "fiber_point") {
      setFormData(prev => {
        const existing = prev.coordinatePoints || [];
        return { ...prev, coordinatePoints: [...existing, [lat, lng]] };
      });
    }
  }, [mapClickMode]);

  const createMutation = useMutation({
    mutationFn: async ({ type, data }: { type: string; data: any }) => {
      const endpoints: Record<string, string> = {
        olt: "/api/olt-devices",
        splitter: "/api/gpon-splitters",
        onu: "/api/onu-devices",
        tower: "/api/network-towers",
        fiber: "/api/fiber-routes",
        p2p: "/api/p2p-links",
      };
      return (await apiRequest("POST", endpoints[type], data)).json();
    },
    onSuccess: () => {
      toast({ title: "Created successfully" });
      invalidateAll();
      setAddDialogOpen(false);
      setFormData({});
      setMapClickMode(null);
      setClickedCoords(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ type, id, data }: { type: string; id: number; data: any }) => {
      const endpoints: Record<string, string> = {
        olt: "/api/olt-devices",
        splitter: "/api/gpon-splitters",
        onu: "/api/onu-devices",
        tower: "/api/network-towers",
        fiber: "/api/fiber-routes",
        p2p: "/api/p2p-links",
      };
      return (await apiRequest("PATCH", `${endpoints[type]}/${id}`, data)).json();
    },
    onSuccess: () => {
      toast({ title: "Updated successfully" });
      invalidateAll();
      setAddDialogOpen(false);
      setEditMode(false);
      setEditItem(null);
      setFormData({});
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      const endpoints: Record<string, string> = {
        olt: "/api/olt-devices",
        splitter: "/api/gpon-splitters",
        onu: "/api/onu-devices",
        tower: "/api/network-towers",
        fiber: "/api/fiber-routes",
        p2p: "/api/p2p-links",
      };
      return apiRequest("DELETE", `${endpoints[type]}/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Deleted successfully" });
      invalidateAll();
      setDetailDialogOpen(false);
      setSelectedEntity(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["/api/fiber-routes"] });
    queryClient.invalidateQueries({ queryKey: ["/api/network-towers"] });
    queryClient.invalidateQueries({ queryKey: ["/api/olt-devices"] });
    queryClient.invalidateQueries({ queryKey: ["/api/gpon-splitters"] });
    queryClient.invalidateQueries({ queryKey: ["/api/onu-devices"] });
    queryClient.invalidateQueries({ queryKey: ["/api/p2p-links"] });
  }

  function flyToEntity(type: string, data: any) {
    setDetailDialogOpen(false);
    setActiveTab("map");
    setTimeout(() => {
      if (!mapRef.current) {
        toast({ title: "Map not ready", description: "Please try again", variant: "destructive" });
        return;
      }
      if (type === "fiber") {
        try {
          const coords = JSON.parse(data.coordinates) as [number, number][];
          if (coords.length > 0) {
            const bounds = L.latLngBounds(coords.map(c => L.latLng(c[0], c[1])));
            mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
          }
        } catch {
          toast({ title: "Invalid coordinates", variant: "destructive" });
        }
      } else if (type === "p2p") {
        const aLat = parseFloat(String(data.towerALat));
        const aLng = parseFloat(String(data.towerALng));
        const bLat = parseFloat(String(data.towerBLat));
        const bLng = parseFloat(String(data.towerBLng));
        if (!isNaN(aLat) && !isNaN(aLng) && !isNaN(bLat) && !isNaN(bLng)) {
          const bounds = L.latLngBounds([L.latLng(aLat, aLng), L.latLng(bLat, bLng)]);
          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
      } else if (data.lat != null && data.lng != null) {
        const lat = parseFloat(String(data.lat));
        const lng = parseFloat(String(data.lng));
        if (!isNaN(lat) && !isNaN(lng)) {
          mapRef.current.flyTo([lat, lng], 17, { duration: 1 });
        }
      }
    }, 150);
  }

  function openAdd(type: string) {
    setAddType(type);
    setEditMode(false);
    setEditItem(null);
    setFormData({});
    setClickedCoords(null);
    if (type === "fiber") {
      setMapClickMode("fiber_point");
      setFormData({ coordinatePoints: [] });
    } else {
      setMapClickMode("place");
    }
    setAddDialogOpen(true);
  }

  function openEdit(type: string, item: any) {
    setAddType(type);
    setEditMode(true);
    setEditItem(item);
    const data: Record<string, any> = { ...item };
    if (type === "fiber" && item.coordinates) {
      try {
        data.coordinatePoints = JSON.parse(item.coordinates);
      } catch { data.coordinatePoints = []; }
    }
    setFormData(data);
    setMapClickMode(null);
    setAddDialogOpen(true);
  }

  function handleSave() {
    const data: Record<string, any> = { ...formData };
    if (addType === "fiber") {
      const pts = data.coordinatePoints || [];
      data.coordinates = JSON.stringify(pts);
      delete data.coordinatePoints;
      if (pts.length >= 2) {
        let totalDist = 0;
        for (let i = 1; i < pts.length; i++) {
          const [lat1, lng1] = pts[i - 1];
          const [lat2, lng2] = pts[i];
          const R = 6371000;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLng = (lng2 - lng1) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          totalDist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }
        data.totalLengthM = totalDist.toFixed(1);
      }
    }
    if (addType === "p2p" && data.towerALat && data.towerBLat) {
      const R = 6371;
      const dLat = (parseFloat(data.towerBLat) - parseFloat(data.towerALat)) * Math.PI / 180;
      const dLng = (parseFloat(data.towerBLng) - parseFloat(data.towerALng)) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(parseFloat(data.towerALat) * Math.PI / 180) * Math.cos(parseFloat(data.towerBLat) * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      data.distanceKm = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
    }

    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;

    if (addType === "olt") {
      delete data.oltId;
      if (data.totalPonPorts != null) data.totalPonPorts = Number(data.totalPonPorts);
      if (data.usedPonPorts != null) data.usedPonPorts = Number(data.usedPonPorts);
    }
    if (addType === "splitter") {
      delete data.splitterId;
      if (data.oltId != null && data.oltId !== "") data.oltId = Number(data.oltId); else delete data.oltId;
      if (data.ponPort != null) data.ponPort = Number(data.ponPort);
      if (data.usedPorts != null) data.usedPorts = Number(data.usedPorts);
    }
    if (addType === "onu") {
      delete data.onuId;
      if (data.customerId != null && data.customerId !== "") data.customerId = Number(data.customerId); else delete data.customerId;
      if (data.splitterId != null && data.splitterId !== "") data.splitterId = Number(data.splitterId); else delete data.splitterId;
      if (data.splitterPort != null && data.splitterPort !== "") data.splitterPort = Number(data.splitterPort); else delete data.splitterPort;
    }
    if (addType === "fiber") {
      delete data.routeId;
      if (data.oltId != null && data.oltId !== "") data.oltId = Number(data.oltId); else delete data.oltId;
      if (data.fiberCoreCount != null) data.fiberCoreCount = Number(data.fiberCoreCount);
      if (data.usedFibers != null) data.usedFibers = Number(data.usedFibers);
    }
    if (addType === "p2p") {
      delete data.linkId;
      if (data.bandwidthMbps != null) data.bandwidthMbps = Number(data.bandwidthMbps);
      if (data.towerAId != null && data.towerAId !== "") data.towerAId = Number(data.towerAId); else delete data.towerAId;
      if (data.towerBId != null && data.towerBId !== "") data.towerBId = Number(data.towerBId); else delete data.towerBId;
    }
    if (addType === "tower") {
      delete data.towerId;
      if (data.height != null) data.height = String(data.height);
    }

    if (editMode && editItem) {
      updateMutation.mutate({ type: addType, id: editItem.id, data });
    } else {
      createMutation.mutate({ type: addType, data });
    }
  }

  const kpiData = useMemo(() => [
    { label: "Fiber Routes", value: fiberRoutes.length, icon: Cable, color: "from-blue-600 to-blue-400", active: fiberRoutes.filter(r => r.status === "active").length },
    { label: "OLT Devices", value: olts.length, icon: Server, color: "from-emerald-600 to-emerald-400", active: olts.filter(o => o.status === "active").length },
    { label: "Splitters", value: splitters.length, icon: Radio, color: "from-violet-600 to-violet-400", active: splitters.filter(s => s.status === "active").length },
    { label: "ONU/ONT", value: onus.length, icon: Smartphone, color: "from-cyan-600 to-cyan-400", active: onus.filter(o => o.status === "online").length },
    { label: "Towers", value: towers.length, icon: Signal, color: "from-amber-600 to-amber-400", active: towers.filter(t => t.status === "active").length },
    { label: "P2P Links", value: p2pLinks.length, icon: Wifi, color: "from-rose-600 to-rose-400", active: p2pLinks.filter(l => l.status === "active").length },
    { label: "IP Addresses", value: ipAddresses.length, icon: Globe, color: "from-indigo-600 to-indigo-400", sub: `${ipAddresses.filter(i => i.status === "assigned").length} assigned` },
    { label: "Subnets", value: subnets.length, icon: Navigation, color: "from-teal-600 to-teal-400", sub: `${subnets.reduce((a, s) => a + (parseInt(String(s.usableHosts || "0"))), 0)} hosts` },
  ], [fiberRoutes, olts, splitters, onus, towers, p2pLinks, ipAddresses, subnets]);

  const parsedFiberCoords = useMemo(() => {
    return fiberRoutes.map(r => {
      try { return { ...r, parsedCoords: JSON.parse(r.coordinates) as [number, number][] }; }
      catch { return { ...r, parsedCoords: [] as [number, number][] }; }
    });
  }, [fiberRoutes]);

  function getOltForSplitter(s: GponSplitter) {
    return olts.find(o => o.id === s.oltId);
  }

  function getCustomerForOnu(o: OnuDevice) {
    return customers.find(c => c.id === o.customerId);
  }

  function getSplitRatioPorts(ratio: string): number {
    const parts = ratio.split(":");
    return parseInt(parts[1] || "8");
  }

  function exportCSV(type: string) {
    let csvContent = "";
    let filename = "";
    if (type === "olts") {
      csvContent = "OLT ID,Name,IP Address,Vendor,Model,PON Ports,Used Ports,Status\n";
      olts.forEach(o => { csvContent += `${o.oltId},${o.name},${o.ipAddress || ""},${o.vendor},${o.model || ""},${o.totalPonPorts},${o.usedPonPorts},${o.status}\n`; });
      filename = "olt_devices.csv";
    } else if (type === "splitters") {
      csvContent = "Splitter ID,Name,Split Ratio,Used Ports,OLT,PON Port,Status\n";
      splitters.forEach(s => { const olt = getOltForSplitter(s); csvContent += `${s.splitterId},${s.name},${s.splitRatio},${s.usedPorts},${olt?.name || ""},${s.ponPort || ""},${s.status}\n`; });
      filename = "gpon_splitters.csv";
    } else if (type === "onus") {
      csvContent = "ONU ID,Serial,MAC,Customer,Plan,IP,Optical Power,Status\n";
      onus.forEach(o => { const c = getCustomerForOnu(o); csvContent += `${o.onuId},${o.serialNumber || ""},${o.macAddress || ""},${c?.fullName || ""},${o.servicePlan || ""},${o.ipAddress || ""},${o.opticalPower || ""},${o.status}\n`; });
      filename = "onu_devices.csv";
    }
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8" data-testid="loading-network-map">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-muted-foreground">Loading network data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4" data-testid="page-network-map">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0B1120] to-[#2563EB] bg-clip-text text-transparent" data-testid="text-page-title">
            Network & IPAM Map
          </h1>
          <p className="text-sm text-muted-foreground">FTTH Fiber Routes, P2P Links, GPON Infrastructure & IP Management</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search infrastructure..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-64"
              data-testid="input-search-network"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gradient-to-r from-[#0B1120] to-[#2563EB] text-white" data-testid="button-add-infrastructure">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => openAdd("olt")} data-testid="menu-add-olt">
                <Server className="w-4 h-4 mr-2" /> OLT Device
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openAdd("splitter")} data-testid="menu-add-splitter">
                <Radio className="w-4 h-4 mr-2" /> GPON Splitter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openAdd("onu")} data-testid="menu-add-onu">
                <Smartphone className="w-4 h-4 mr-2" /> ONU/ONT Device
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openAdd("tower")} data-testid="menu-add-tower">
                <Signal className="w-4 h-4 mr-2" /> Network Tower
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openAdd("fiber")} data-testid="menu-add-fiber">
                <Cable className="w-4 h-4 mr-2" /> Fiber Route
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openAdd("p2p")} data-testid="menu-add-p2p">
                <Wifi className="w-4 h-4 mr-2" /> P2P Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => invalidateAll()} data-testid="button-refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {kpiData.map(kpi => (
          <Card key={kpi.label} className="border" data-testid={`card-kpi-${kpi.label.toLowerCase().replace(/[\s\/]+/g, "-")}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                  <kpi.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <div className="text-lg font-bold">{kpi.value}</div>
              {"active" in kpi && <span className="text-xs text-green-600">{(kpi as any).active} active</span>}
              {"sub" in kpi && <span className="text-xs text-muted-foreground">{(kpi as any).sub}</span>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-network-map">
          <TabsTrigger value="map" data-testid="tab-map">Network Map</TabsTrigger>
          <TabsTrigger value="olts" data-testid="tab-olts">OLT Devices</TabsTrigger>
          <TabsTrigger value="splitters" data-testid="tab-splitters">GPON Splitters</TabsTrigger>
          <TabsTrigger value="onus" data-testid="tab-onus">ONU/ONT</TabsTrigger>
          <TabsTrigger value="fiber" data-testid="tab-fiber">Fiber Routes</TabsTrigger>
          <TabsTrigger value="p2p" data-testid="tab-p2p">P2P Links</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-3">
          <div className="grid grid-cols-[280px_1fr] gap-3 h-[calc(100vh-320px)]">
            <div className="space-y-3 overflow-y-auto">
              <Card>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm flex items-center gap-1"><Layers className="w-4 h-4" /> Layer Control</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  {[
                    { key: "fiberRoutes", label: "Fiber Routes", icon: Cable, color: "text-blue-500" },
                    { key: "wirelessLinks", label: "P2P Links", icon: Wifi, color: "text-rose-500" },
                    { key: "oltNodes", label: "OLT Nodes", icon: Server, color: "text-emerald-500" },
                    { key: "splitters", label: "Splitters", icon: Radio, color: "text-violet-500" },
                    { key: "onuDevices", label: "ONU/ONT", icon: Smartphone, color: "text-cyan-500" },
                    { key: "towers", label: "Towers", icon: Signal, color: "text-amber-500" },
                    { key: "ipOverlay", label: "IP Subnets", icon: Globe, color: "text-indigo-500" },
                  ].map(layer => (
                    <div key={layer.key} className="flex items-center justify-between" data-testid={`toggle-layer-${layer.key}`}>
                      <div className="flex items-center gap-2">
                        <layer.icon className={`w-3.5 h-3.5 ${layer.color}`} />
                        <span className="text-xs">{layer.label}</span>
                      </div>
                      <Switch
                        checked={layers[layer.key as keyof typeof layers]}
                        onCheckedChange={v => setLayers(prev => ({ ...prev, [layer.key]: v }))}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm">Map Style</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <Select value={mapLayer} onValueChange={setMapLayer}>
                    <SelectTrigger data-testid="select-map-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MAP_LAYERS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm">Status Legend</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-1">
                  {[
                    { label: "Active / Online", color: "#22C55E" },
                    { label: "Warning / Low Signal", color: "#EAB308" },
                    { label: "Planned", color: "#3B82F6" },
                    { label: "Maintenance", color: "#F97316" },
                    { label: "Down / Offline", color: "#EF4444" },
                    { label: "Disconnected", color: "#374151" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-xs">{s.label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm">Network Summary</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-1 text-xs">
                  <div className="flex justify-between"><span>Total Fiber Length</span><span className="font-medium">{(fiberRoutes.reduce((a, r) => a + parseFloat(String(r.totalLengthM || 0)), 0) / 1000).toFixed(1)} km</span></div>
                  <div className="flex justify-between"><span>Total PON Ports</span><span className="font-medium">{olts.reduce((a, o) => a + (o.totalPonPorts || 0), 0)}</span></div>
                  <div className="flex justify-between"><span>Used PON Ports</span><span className="font-medium">{olts.reduce((a, o) => a + (o.usedPonPorts || 0), 0)}</span></div>
                  <div className="flex justify-between"><span>Online ONUs</span><span className="font-medium text-green-600">{onus.filter(o => o.status === "online").length}</span></div>
                  <div className="flex justify-between"><span>Offline ONUs</span><span className="font-medium text-red-600">{onus.filter(o => o.status === "offline").length}</span></div>
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden" style={{ isolation: "isolate", zIndex: 0 }}>
              <div className="h-full relative" data-testid="map-container">
                {mapClickMode && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    {mapClickMode === "fiber_point" ? "Click on map to add fiber route points" : "Click on map to set location"}
                    <Button size="sm" variant="ghost" className="text-white ml-2 h-6" onClick={() => setMapClickMode(null)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: "100%", width: "100%" }} zoomControl={true} ref={mapRef}>
                  <TileLayer url={MAP_LAYERS[mapLayer].url} attribution={MAP_LAYERS[mapLayer].attribution} />
                  <MapClickHandler onMapClick={handleMapClick} enabled={!!mapClickMode} />

                  {layers.fiberRoutes && parsedFiberCoords.map(route => (
                    route.parsedCoords.length >= 2 && (
                      <Polyline
                        key={route.id}
                        positions={route.parsedCoords}
                        pathOptions={{
                          color: route.color || STATUS_COLORS[route.status] || "#3B82F6",
                          weight: 3,
                          opacity: 0.8,
                          dashArray: route.status === "planned" ? "10 5" : undefined,
                        }}
                        eventHandlers={{
                          click: () => { setSelectedEntity({ type: "fiber", data: route }); setDetailDialogOpen(true); }
                        }}
                      >
                        <Popup>
                          <div className="text-xs space-y-1">
                            <div className="font-bold">{route.name}</div>
                            <div>ID: {route.routeId}</div>
                            <div>Length: {(parseFloat(String(route.totalLengthM || 0)) / 1000).toFixed(2)} km</div>
                            <div>Fibers: {route.usedFibers}/{route.fiberCoreCount}</div>
                          </div>
                        </Popup>
                      </Polyline>
                    )
                  ))}

                  {layers.oltNodes && olts.map(olt => (
                    <Marker
                      key={`olt-${olt.id}`}
                      position={[parseFloat(String(olt.lat)), parseFloat(String(olt.lng))]}
                      icon={createSvgIcon(STATUS_COLORS[olt.status] || "#22C55E", "olt", 32)}
                      eventHandlers={{
                        click: () => { setSelectedEntity({ type: "olt", data: olt }); setDetailDialogOpen(true); }
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1">
                          <div className="font-bold">{olt.name}</div>
                          <div>ID: {olt.oltId}</div>
                          <div>IP: {olt.ipAddress}</div>
                          <div>PON: {olt.usedPonPorts}/{olt.totalPonPorts}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {layers.splitters && splitters.map(spl => (
                    <Marker
                      key={`spl-${spl.id}`}
                      position={[parseFloat(String(spl.lat)), parseFloat(String(spl.lng))]}
                      icon={createSvgIcon(STATUS_COLORS[spl.status] || "#7C3AED", "splitter", 24)}
                      eventHandlers={{
                        click: () => { setSelectedEntity({ type: "splitter", data: spl }); setDetailDialogOpen(true); }
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1">
                          <div className="font-bold">{spl.name}</div>
                          <div>Ratio: {spl.splitRatio}</div>
                          <div>Ports: {spl.usedPorts}/{getSplitRatioPorts(spl.splitRatio)}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {layers.onuDevices && onus.map(onu => (
                    <Marker
                      key={`onu-${onu.id}`}
                      position={[parseFloat(String(onu.lat)), parseFloat(String(onu.lng))]}
                      icon={createSvgIcon(STATUS_COLORS[onu.status] || "#06B6D4", "onu", 20)}
                      eventHandlers={{
                        click: () => { setSelectedEntity({ type: "onu", data: onu }); setDetailDialogOpen(true); }
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1">
                          <div className="font-bold">{onu.onuId}</div>
                          <div>S/N: {onu.serialNumber || "N/A"}</div>
                          <div>Customer: {getCustomerForOnu(onu)?.fullName || "Unassigned"}</div>
                          <div>Signal: {onu.opticalPower ? `${onu.opticalPower} dBm` : "N/A"}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {layers.towers && towers.map(tower => (
                    <Marker
                      key={`twr-${tower.id}`}
                      position={[parseFloat(String(tower.lat)), parseFloat(String(tower.lng))]}
                      icon={createSvgIcon(STATUS_COLORS[tower.status] || "#F59E0B", "tower", 30)}
                      eventHandlers={{
                        click: () => { setSelectedEntity({ type: "tower", data: tower }); setDetailDialogOpen(true); }
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1">
                          <div className="font-bold">{tower.name}</div>
                          <div>ID: {tower.towerId}</div>
                          <div>Height: {tower.height}m</div>
                          <div>Type: {tower.towerType}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {layers.wirelessLinks && p2pLinks.map(link => (
                    <Polyline
                      key={`p2p-${link.id}`}
                      positions={[
                        [parseFloat(String(link.towerALat)), parseFloat(String(link.towerALng))],
                        [parseFloat(String(link.towerBLat)), parseFloat(String(link.towerBLng))],
                      ]}
                      pathOptions={{
                        color: STATUS_COLORS[link.status] || "#EF4444",
                        weight: 2,
                        opacity: 0.7,
                        dashArray: "8 4",
                      }}
                      eventHandlers={{
                        click: () => { setSelectedEntity({ type: "p2p", data: link }); setDetailDialogOpen(true); }
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1">
                          <div className="font-bold">{link.name}</div>
                          <div>Freq: {link.frequencyBand}</div>
                          <div>BW: {link.bandwidthMbps} Mbps</div>
                          <div>Dist: {link.distanceKm} km</div>
                        </div>
                      </Popup>
                    </Polyline>
                  ))}

                  {mapClickMode === "fiber_point" && formData.coordinatePoints?.length > 0 && (
                    <Polyline
                      positions={formData.coordinatePoints}
                      pathOptions={{ color: "#3B82F6", weight: 3, opacity: 0.6, dashArray: "5 5" }}
                    />
                  )}
                  {clickedCoords && mapClickMode === "place" && (
                    <Marker position={[clickedCoords.lat, clickedCoords.lng]} icon={createSvgIcon("#3B82F6", "circle", 16)} />
                  )}
                </MapContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="olts" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Server className="w-4 h-4" /> OLT Devices</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportCSV("olts")} data-testid="button-export-olts"><Download className="w-3.5 h-3.5 mr-1" /> Export</Button>
                  <Button size="sm" onClick={() => openAdd("olt")} data-testid="button-add-olt-tab"><Plus className="w-3.5 h-3.5 mr-1" /> Add OLT</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-[#0B1120] to-[#2563EB]">
                      {["OLT ID", "Name", "IP Address", "Vendor", "Model", "PON Ports", "Used", "Status", "Actions"].map(h => (
                        <TableHead key={h} className="text-white text-xs font-medium">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {olts.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No OLT devices found</TableCell></TableRow>
                    ) : olts.map(olt => (
                      <TableRow key={olt.id} data-testid={`row-olt-${olt.id}`}>
                        <TableCell className="text-xs font-mono">{olt.oltId}</TableCell>
                        <TableCell className="text-xs font-medium">{olt.name}</TableCell>
                        <TableCell className="text-xs font-mono">{olt.ipAddress || "-"}</TableCell>
                        <TableCell className="text-xs">{olt.vendor}</TableCell>
                        <TableCell className="text-xs">{olt.model || "-"}</TableCell>
                        <TableCell className="text-xs">{olt.totalPonPorts}</TableCell>
                        <TableCell className="text-xs">{olt.usedPonPorts}</TableCell>
                        <TableCell><Badge className={`text-[10px] ${statusBadgeClass[olt.status] || ""}`}>{olt.status}</Badge></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-3.5 h-3.5" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => { setSelectedEntity({ type: "olt", data: olt }); setDetailDialogOpen(true); }}><Eye className="w-3.5 h-3.5 mr-2" /> View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => flyToEntity("olt", olt)}><MapPin className="w-3.5 h-3.5 mr-2" /> View on Map</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit("olt", olt)}><Edit className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate({ type: "olt", id: olt.id })}><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
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
        </TabsContent>

        <TabsContent value="splitters" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Radio className="w-4 h-4" /> GPON Splitters</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportCSV("splitters")} data-testid="button-export-splitters"><Download className="w-3.5 h-3.5 mr-1" /> Export</Button>
                  <Button size="sm" onClick={() => openAdd("splitter")} data-testid="button-add-splitter-tab"><Plus className="w-3.5 h-3.5 mr-1" /> Add Splitter</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-[#0B1120] to-[#2563EB]">
                      {["Splitter ID", "Name", "Split Ratio", "Used Ports", "Total Ports", "OLT", "PON Port", "Status", "Actions"].map(h => (
                        <TableHead key={h} className="text-white text-xs font-medium">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {splitters.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No splitters found</TableCell></TableRow>
                    ) : splitters.map(spl => {
                      const olt = getOltForSplitter(spl);
                      const totalPorts = getSplitRatioPorts(spl.splitRatio);
                      return (
                        <TableRow key={spl.id} data-testid={`row-splitter-${spl.id}`}>
                          <TableCell className="text-xs font-mono">{spl.splitterId}</TableCell>
                          <TableCell className="text-xs font-medium">{spl.name}</TableCell>
                          <TableCell className="text-xs">{spl.splitRatio}</TableCell>
                          <TableCell className="text-xs">{spl.usedPorts}</TableCell>
                          <TableCell className="text-xs">{totalPorts}</TableCell>
                          <TableCell className="text-xs">{olt?.name || "-"}</TableCell>
                          <TableCell className="text-xs">{spl.ponPort || "-"}</TableCell>
                          <TableCell><Badge className={`text-[10px] ${statusBadgeClass[spl.status] || ""}`}>{spl.status}</Badge></TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-3.5 h-3.5" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => { setSelectedEntity({ type: "splitter", data: spl }); setDetailDialogOpen(true); }}><Eye className="w-3.5 h-3.5 mr-2" /> View</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => flyToEntity("splitter", spl)}><MapPin className="w-3.5 h-3.5 mr-2" /> View on Map</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEdit("splitter", spl)}><Edit className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate({ type: "splitter", id: spl.id })}><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
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
        </TabsContent>

        <TabsContent value="onus" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Smartphone className="w-4 h-4" /> ONU/ONT Devices</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportCSV("onus")} data-testid="button-export-onus"><Download className="w-3.5 h-3.5 mr-1" /> Export</Button>
                  <Button size="sm" onClick={() => openAdd("onu")} data-testid="button-add-onu-tab"><Plus className="w-3.5 h-3.5 mr-1" /> Add ONU</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-[#0B1120] to-[#2563EB]">
                      {["ONU ID", "Serial", "Customer", "Plan", "IP", "Optical Power", "Status", "Actions"].map(h => (
                        <TableHead key={h} className="text-white text-xs font-medium">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onus.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No ONU devices found</TableCell></TableRow>
                    ) : onus.map(onu => {
                      const cust = getCustomerForOnu(onu);
                      return (
                        <TableRow key={onu.id} data-testid={`row-onu-${onu.id}`}>
                          <TableCell className="text-xs font-mono">{onu.onuId}</TableCell>
                          <TableCell className="text-xs font-mono">{onu.serialNumber || "-"}</TableCell>
                          <TableCell className="text-xs">{cust?.fullName || "-"}</TableCell>
                          <TableCell className="text-xs">{onu.servicePlan || "-"}</TableCell>
                          <TableCell className="text-xs font-mono">{onu.ipAddress || "-"}</TableCell>
                          <TableCell className="text-xs">{onu.opticalPower ? `${onu.opticalPower} dBm` : "-"}</TableCell>
                          <TableCell><Badge className={`text-[10px] ${statusBadgeClass[onu.status] || ""}`}>{onu.status}</Badge></TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-3.5 h-3.5" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => { setSelectedEntity({ type: "onu", data: onu }); setDetailDialogOpen(true); }}><Eye className="w-3.5 h-3.5 mr-2" /> View</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => flyToEntity("onu", onu)}><MapPin className="w-3.5 h-3.5 mr-2" /> View on Map</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEdit("onu", onu)}><Edit className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate({ type: "onu", id: onu.id })}><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
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
        </TabsContent>

        <TabsContent value="fiber" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Cable className="w-4 h-4" /> Fiber Routes</CardTitle>
                <Button size="sm" onClick={() => openAdd("fiber")} data-testid="button-add-fiber-tab"><Plus className="w-3.5 h-3.5 mr-1" /> Add Route</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-[#0B1120] to-[#2563EB]">
                      {["Route ID", "Name", "Length", "Fiber Cores", "Used", "Cable Type", "Status", "Actions"].map(h => (
                        <TableHead key={h} className="text-white text-xs font-medium">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fiberRoutes.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No fiber routes found</TableCell></TableRow>
                    ) : fiberRoutes.map(route => (
                      <TableRow key={route.id} data-testid={`row-fiber-${route.id}`}>
                        <TableCell className="text-xs font-mono">{route.routeId}</TableCell>
                        <TableCell className="text-xs font-medium">{route.name}</TableCell>
                        <TableCell className="text-xs">{(parseFloat(String(route.totalLengthM || 0)) / 1000).toFixed(2)} km</TableCell>
                        <TableCell className="text-xs">{route.fiberCoreCount}</TableCell>
                        <TableCell className="text-xs">{route.usedFibers}</TableCell>
                        <TableCell className="text-xs">{route.cableType}</TableCell>
                        <TableCell><Badge className={`text-[10px] ${statusBadgeClass[route.status] || ""}`}>{route.status}</Badge></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-3.5 h-3.5" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => { setSelectedEntity({ type: "fiber", data: route }); setDetailDialogOpen(true); }}><Eye className="w-3.5 h-3.5 mr-2" /> View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => flyToEntity("fiber", route)}><MapPin className="w-3.5 h-3.5 mr-2" /> View on Map</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit("fiber", route)}><Edit className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate({ type: "fiber", id: route.id })}><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
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
        </TabsContent>

        <TabsContent value="p2p" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Wifi className="w-4 h-4" /> P2P Wireless Links</CardTitle>
                <Button size="sm" onClick={() => openAdd("p2p")} data-testid="button-add-p2p-tab"><Plus className="w-3.5 h-3.5 mr-1" /> Add Link</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-[#0B1120] to-[#2563EB]">
                      {["Link ID", "Name", "Frequency", "Bandwidth", "Distance", "RSSI", "Latency", "Status", "Actions"].map(h => (
                        <TableHead key={h} className="text-white text-xs font-medium">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {p2pLinks.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No P2P links found</TableCell></TableRow>
                    ) : p2pLinks.map(link => (
                      <TableRow key={link.id} data-testid={`row-p2p-${link.id}`}>
                        <TableCell className="text-xs font-mono">{link.linkId}</TableCell>
                        <TableCell className="text-xs font-medium">{link.name}</TableCell>
                        <TableCell className="text-xs">{link.frequencyBand}</TableCell>
                        <TableCell className="text-xs">{link.bandwidthMbps} Mbps</TableCell>
                        <TableCell className="text-xs">{link.distanceKm ? `${link.distanceKm} km` : "-"}</TableCell>
                        <TableCell className="text-xs">{link.rssi ? `${link.rssi} dBm` : "-"}</TableCell>
                        <TableCell className="text-xs">{link.latencyMs ? `${link.latencyMs} ms` : "-"}</TableCell>
                        <TableCell><Badge className={`text-[10px] ${statusBadgeClass[link.status] || ""}`}>{link.status}</Badge></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-3.5 h-3.5" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => { setSelectedEntity({ type: "p2p", data: link }); setDetailDialogOpen(true); }}><Eye className="w-3.5 h-3.5 mr-2" /> View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => flyToEntity("p2p", link)}><MapPin className="w-3.5 h-3.5 mr-2" /> View on Map</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit("p2p", link)}><Edit className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate({ type: "p2p", id: link.id })}><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
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
        </TabsContent>
      </Tabs>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEntity?.type === "olt" && <><Server className="w-5 h-5" /> OLT Device Details</>}
              {selectedEntity?.type === "splitter" && <><Radio className="w-5 h-5" /> GPON Splitter Details</>}
              {selectedEntity?.type === "onu" && <><Smartphone className="w-5 h-5" /> ONU/ONT Details</>}
              {selectedEntity?.type === "tower" && <><Signal className="w-5 h-5" /> Tower Details</>}
              {selectedEntity?.type === "fiber" && <><Cable className="w-5 h-5" /> Fiber Route Details</>}
              {selectedEntity?.type === "p2p" && <><Wifi className="w-5 h-5" /> P2P Link Details</>}
            </DialogTitle>
          </DialogHeader>
          {selectedEntity && (
            <div className="space-y-4">
              {selectedEntity.type === "olt" && (() => {
                const olt = selectedEntity.data as OltDevice;
                const connectedSplitters = splitters.filter(s => s.oltId === olt.id);
                return (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <DetailField label="OLT ID" value={olt.oltId} />
                      <DetailField label="Name" value={olt.name} />
                      <DetailField label="IP Address" value={olt.ipAddress || "-"} />
                      <DetailField label="Vendor" value={olt.vendor || "-"} />
                      <DetailField label="Model" value={olt.model || "-"} />
                      <DetailField label="Status" value={olt.status} badge />
                      <DetailField label="Total PON Ports" value={String(olt.totalPonPorts)} />
                      <DetailField label="Used PON Ports" value={String(olt.usedPonPorts)} />
                      <DetailField label="Location" value={`${olt.lat}, ${olt.lng}`} />
                    </div>
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium mb-2">PON Structure</h4>
                      <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                        <div className="font-medium text-blue-600">{olt.name} ({olt.oltId})</div>
                        {connectedSplitters.length > 0 ? connectedSplitters.map(spl => {
                          const connOnus = onus.filter(o => o.splitterId === spl.id);
                          return (
                            <div key={spl.id} className="ml-4 space-y-1">
                              <div className="flex items-center gap-1">
                                <ChevronRight className="w-3 h-3 text-violet-500" />
                                <span>PON {spl.ponPort || "?"}</span>
                                <ChevronRight className="w-3 h-3" />
                                <span className="text-violet-600">{spl.name} ({spl.splitRatio})</span>
                              </div>
                              {connOnus.map(o => (
                                <div key={o.id} className="ml-8 flex items-center gap-1">
                                  <ChevronRight className="w-3 h-3 text-cyan-500" />
                                  <span>{o.onuId}</span>
                                  <span className="text-muted-foreground">- {getCustomerForOnu(o)?.fullName || "Unassigned"}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }) : <div className="ml-4 text-muted-foreground">No splitters connected</div>}
                      </div>
                    </div>
                  </>
                );
              })()}
              {selectedEntity.type === "splitter" && (() => {
                const spl = selectedEntity.data as GponSplitter;
                const olt = getOltForSplitter(spl);
                const connOnus = onus.filter(o => o.splitterId === spl.id);
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <DetailField label="Splitter ID" value={spl.splitterId} />
                    <DetailField label="Name" value={spl.name} />
                    <DetailField label="Split Ratio" value={spl.splitRatio} />
                    <DetailField label="Used Ports" value={`${spl.usedPorts} / ${getSplitRatioPorts(spl.splitRatio)}`} />
                    <DetailField label="OLT" value={olt?.name || "Unassigned"} />
                    <DetailField label="PON Port" value={String(spl.ponPort || "-")} />
                    <DetailField label="Status" value={spl.status} badge />
                    <DetailField label="Location" value={`${spl.lat}, ${spl.lng}`} />
                    <div className="col-span-2 border-t pt-2">
                      <h4 className="text-sm font-medium mb-1">Connected ONUs ({connOnus.length})</h4>
                      {connOnus.length > 0 ? connOnus.map(o => (
                        <div key={o.id} className="text-xs flex items-center gap-2 py-0.5">
                          <Badge className={`text-[9px] ${statusBadgeClass[o.status] || ""}`}>{o.status}</Badge>
                          <span className="font-mono">{o.onuId}</span>
                          <span className="text-muted-foreground">{getCustomerForOnu(o)?.fullName || ""}</span>
                        </div>
                      )) : <p className="text-xs text-muted-foreground">No ONUs connected</p>}
                    </div>
                  </div>
                );
              })()}
              {selectedEntity.type === "onu" && (() => {
                const onu = selectedEntity.data as OnuDevice;
                const cust = getCustomerForOnu(onu);
                const spl = splitters.find(s => s.id === onu.splitterId);
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <DetailField label="ONU ID" value={onu.onuId} />
                    <DetailField label="Serial Number" value={onu.serialNumber || "-"} />
                    <DetailField label="MAC Address" value={onu.macAddress || "-"} />
                    <DetailField label="Customer" value={cust?.fullName || "Unassigned"} />
                    <DetailField label="Service Plan" value={onu.servicePlan || "-"} />
                    <DetailField label="IP Address" value={onu.ipAddress || "-"} />
                    <DetailField label="Optical Power" value={onu.opticalPower ? `${onu.opticalPower} dBm` : "-"} />
                    <DetailField label="Status" value={onu.status} badge />
                    <DetailField label="Splitter" value={spl?.name || "Unassigned"} />
                    <DetailField label="Splitter Port" value={String(onu.splitterPort || "-")} />
                    <DetailField label="Activation Date" value={onu.activationDate || "-"} />
                    <DetailField label="Location" value={`${onu.lat}, ${onu.lng}`} />
                  </div>
                );
              })()}
              {selectedEntity.type === "tower" && (() => {
                const tower = selectedEntity.data as NetworkTower;
                const connLinks = p2pLinks.filter(l => l.towerAId === tower.id || l.towerBId === tower.id);
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <DetailField label="Tower ID" value={tower.towerId} />
                    <DetailField label="Name" value={tower.name} />
                    <DetailField label="Height" value={`${tower.height}m`} />
                    <DetailField label="Type" value={tower.towerType || "-"} />
                    <DetailField label="Status" value={tower.status} badge />
                    <DetailField label="Address" value={tower.address || "-"} />
                    <DetailField label="Location" value={`${tower.lat}, ${tower.lng}`} />
                    <div className="col-span-2 border-t pt-2">
                      <h4 className="text-sm font-medium mb-1">P2P Links ({connLinks.length})</h4>
                      {connLinks.length > 0 ? connLinks.map(l => (
                        <div key={l.id} className="text-xs flex items-center gap-2 py-0.5">
                          <Badge className={`text-[9px] ${statusBadgeClass[l.status] || ""}`}>{l.status}</Badge>
                          <span className="font-mono">{l.linkId}</span>
                          <span>{l.name} - {l.bandwidthMbps} Mbps</span>
                        </div>
                      )) : <p className="text-xs text-muted-foreground">No P2P links</p>}
                    </div>
                  </div>
                );
              })()}
              {selectedEntity.type === "fiber" && (() => {
                const route = selectedEntity.data as FiberRoute;
                const olt = olts.find(o => o.id === route.oltId);
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <DetailField label="Route ID" value={route.routeId} />
                    <DetailField label="Name" value={route.name} />
                    <DetailField label="Length" value={`${(parseFloat(String(route.totalLengthM || 0)) / 1000).toFixed(2)} km`} />
                    <DetailField label="Fiber Cores" value={String(route.fiberCoreCount)} />
                    <DetailField label="Used Fibers" value={String(route.usedFibers)} />
                    <DetailField label="Available" value={String((route.fiberCoreCount || 0) - (route.usedFibers || 0))} />
                    <DetailField label="Cable Type" value={route.cableType || "-"} />
                    <DetailField label="Status" value={route.status} badge />
                    <DetailField label="OLT" value={olt?.name || "Unassigned"} />
                    <DetailField label="Color" value={route.color || "#3B82F6"} />
                  </div>
                );
              })()}
              {selectedEntity.type === "p2p" && (() => {
                const link = selectedEntity.data as P2pLink;
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <DetailField label="Link ID" value={link.linkId} />
                    <DetailField label="Name" value={link.name} />
                    <DetailField label="Frequency" value={link.frequencyBand || "-"} />
                    <DetailField label="Bandwidth" value={`${link.bandwidthMbps} Mbps`} />
                    <DetailField label="Distance" value={link.distanceKm ? `${link.distanceKm} km` : "-"} />
                    <DetailField label="RSSI" value={link.rssi ? `${link.rssi} dBm` : "-"} />
                    <DetailField label="Latency" value={link.latencyMs ? `${link.latencyMs} ms` : "-"} />
                    <DetailField label="Status" value={link.status} badge />
                    <DetailField label="Point A" value={`${link.towerALat}, ${link.towerALng}`} />
                    <DetailField label="Point B" value={`${link.towerBLat}, ${link.towerBLng}`} />
                  </div>
                );
              })()}
            </div>
          )}
          <DialogFooter>
            {selectedEntity && (
              <div className="flex gap-2">
                <Button variant="outline" className="bg-gradient-to-r from-[#0B1120] to-[#2563EB] text-white border-0 hover:opacity-90" onClick={() => flyToEntity(selectedEntity.type, selectedEntity.data)} data-testid="button-view-on-map">
                  <MapPin className="w-3.5 h-3.5 mr-1" /> View on Map
                </Button>
                <Button variant="outline" onClick={() => { if (selectedEntity) openEdit(selectedEntity.type, selectedEntity.data); setDetailDialogOpen(false); }} data-testid="button-edit-detail">
                  <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                <Button variant="destructive" onClick={() => { if (selectedEntity) deleteMutation.mutate({ type: selectedEntity.type, id: selectedEntity.data.id }); }} data-testid="button-delete-detail">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={v => { if (!v) { setMapClickMode(null); setClickedCoords(null); } setAddDialogOpen(v); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit" : "Add"} {addType === "olt" ? "OLT Device" : addType === "splitter" ? "GPON Splitter" : addType === "onu" ? "ONU/ONT Device" : addType === "tower" ? "Network Tower" : addType === "fiber" ? "Fiber Route" : "P2P Link"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {addType === "olt" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Name *</Label><Input value={formData.name || ""} onChange={e => setFormField("name", e.target.value)} data-testid="input-olt-name" /></div>
                  <div><Label className="text-xs">IP Address</Label><Input value={formData.ipAddress || ""} onChange={e => setFormField("ipAddress", e.target.value)} placeholder="192.168.1.1" data-testid="input-olt-ip" /></div>
                  <div><Label className="text-xs">Vendor</Label><Input value={formData.vendor || "Huawei"} onChange={e => setFormField("vendor", e.target.value)} data-testid="input-olt-vendor" /></div>
                  <div><Label className="text-xs">Model</Label><Input value={formData.model || ""} onChange={e => setFormField("model", e.target.value)} data-testid="input-olt-model" /></div>
                  <div><Label className="text-xs">Total PON Ports</Label><Input type="number" value={formData.totalPonPorts ?? 16} onChange={e => setFormField("totalPonPorts", parseInt(e.target.value))} data-testid="input-olt-pon-ports" /></div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={formData.status || "active"} onValueChange={v => setFormField("status", v)}>
                      <SelectTrigger data-testid="select-olt-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["active", "planned", "maintenance", "down"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Latitude *</Label><Input value={formData.lat || ""} onChange={e => setFormField("lat", e.target.value)} placeholder="31.5204" data-testid="input-olt-lat" /></div>
                  <div><Label className="text-xs">Longitude *</Label><Input value={formData.lng || ""} onChange={e => setFormField("lng", e.target.value)} placeholder="74.3587" data-testid="input-olt-lng" /></div>
                </div>
                {!editMode && <p className="text-xs text-blue-600">Click on the map to set coordinates automatically</p>}
                <div><Label className="text-xs">Notes</Label><Textarea value={formData.notes || ""} onChange={e => setFormField("notes", e.target.value)} rows={2} data-testid="input-olt-notes" /></div>
              </>
            )}
            {addType === "splitter" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Name *</Label><Input value={formData.name || ""} onChange={e => setFormField("name", e.target.value)} data-testid="input-splitter-name" /></div>
                  <div>
                    <Label className="text-xs">Split Ratio</Label>
                    <Select value={formData.splitRatio || "1:8"} onValueChange={v => setFormField("splitRatio", v)}>
                      <SelectTrigger data-testid="select-splitter-ratio"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["1:2", "1:4", "1:8", "1:16", "1:32", "1:64"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">OLT</Label>
                    <Select value={String(formData.oltId || "")} onValueChange={v => setFormField("oltId", parseInt(v))}>
                      <SelectTrigger data-testid="select-splitter-olt"><SelectValue placeholder="Select OLT" /></SelectTrigger>
                      <SelectContent>
                        {olts.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name} ({o.oltId})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">PON Port</Label><Input type="number" value={formData.ponPort || ""} onChange={e => setFormField("ponPort", parseInt(e.target.value))} data-testid="input-splitter-pon" /></div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={formData.status || "active"} onValueChange={v => setFormField("status", v)}>
                      <SelectTrigger data-testid="select-splitter-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["active", "planned", "maintenance", "down"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Latitude *</Label><Input value={formData.lat || ""} onChange={e => setFormField("lat", e.target.value)} data-testid="input-splitter-lat" /></div>
                  <div><Label className="text-xs">Longitude *</Label><Input value={formData.lng || ""} onChange={e => setFormField("lng", e.target.value)} data-testid="input-splitter-lng" /></div>
                </div>
                {!editMode && <p className="text-xs text-blue-600">Click on the map to set coordinates automatically</p>}
                <div><Label className="text-xs">Notes</Label><Textarea value={formData.notes || ""} onChange={e => setFormField("notes", e.target.value)} rows={2} data-testid="input-splitter-notes" /></div>
              </>
            )}
            {addType === "onu" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Serial Number</Label><Input value={formData.serialNumber || ""} onChange={e => setFormField("serialNumber", e.target.value)} data-testid="input-onu-serial" /></div>
                  <div><Label className="text-xs">MAC Address</Label><Input value={formData.macAddress || ""} onChange={e => setFormField("macAddress", e.target.value)} placeholder="AA:BB:CC:DD:EE:FF" data-testid="input-onu-mac" /></div>
                  <div>
                    <Label className="text-xs">Customer</Label>
                    <Select value={String(formData.customerId || "")} onValueChange={v => setFormField("customerId", parseInt(v))}>
                      <SelectTrigger data-testid="select-onu-customer"><SelectValue placeholder="Select customer" /></SelectTrigger>
                      <SelectContent>
                        {customers.slice(0, 50).map(c => <SelectItem key={c.id} value={String(c.id)}>{c.fullName} ({c.customerId})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Splitter</Label>
                    <Select value={String(formData.splitterId || "")} onValueChange={v => setFormField("splitterId", parseInt(v))}>
                      <SelectTrigger data-testid="select-onu-splitter"><SelectValue placeholder="Select splitter" /></SelectTrigger>
                      <SelectContent>
                        {splitters.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.splitterId})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Splitter Port</Label><Input type="number" value={formData.splitterPort || ""} onChange={e => setFormField("splitterPort", parseInt(e.target.value))} data-testid="input-onu-splitter-port" /></div>
                  <div><Label className="text-xs">Service Plan</Label><Input value={formData.servicePlan || ""} onChange={e => setFormField("servicePlan", e.target.value)} data-testid="input-onu-plan" /></div>
                  <div><Label className="text-xs">IP Address</Label><Input value={formData.ipAddress || ""} onChange={e => setFormField("ipAddress", e.target.value)} data-testid="input-onu-ip" /></div>
                  <div><Label className="text-xs">Optical Power (dBm)</Label><Input value={formData.opticalPower || ""} onChange={e => setFormField("opticalPower", e.target.value)} placeholder="-18.5" data-testid="input-onu-power" /></div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={formData.status || "online"} onValueChange={v => setFormField("status", v)}>
                      <SelectTrigger data-testid="select-onu-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["online", "offline", "low_signal", "suspended"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Latitude *</Label><Input value={formData.lat || ""} onChange={e => setFormField("lat", e.target.value)} data-testid="input-onu-lat" /></div>
                  <div><Label className="text-xs">Longitude *</Label><Input value={formData.lng || ""} onChange={e => setFormField("lng", e.target.value)} data-testid="input-onu-lng" /></div>
                </div>
                {!editMode && <p className="text-xs text-blue-600">Click on the map to set coordinates automatically</p>}
                <div><Label className="text-xs">Notes</Label><Textarea value={formData.notes || ""} onChange={e => setFormField("notes", e.target.value)} rows={2} data-testid="input-onu-notes" /></div>
              </>
            )}
            {addType === "tower" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Name *</Label><Input value={formData.name || ""} onChange={e => setFormField("name", e.target.value)} data-testid="input-tower-name" /></div>
                  <div><Label className="text-xs">Height (m)</Label><Input value={formData.height || "30"} onChange={e => setFormField("height", e.target.value)} data-testid="input-tower-height" /></div>
                  <div>
                    <Label className="text-xs">Tower Type</Label>
                    <Select value={formData.towerType || "monopole"} onValueChange={v => setFormField("towerType", v)}>
                      <SelectTrigger data-testid="select-tower-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["monopole", "lattice", "guyed", "rooftop", "stealth"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={formData.status || "active"} onValueChange={v => setFormField("status", v)}>
                      <SelectTrigger data-testid="select-tower-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["active", "planned", "maintenance", "down"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label className="text-xs">Address</Label><Input value={formData.address || ""} onChange={e => setFormField("address", e.target.value)} data-testid="input-tower-address" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Latitude *</Label><Input value={formData.lat || ""} onChange={e => setFormField("lat", e.target.value)} data-testid="input-tower-lat" /></div>
                  <div><Label className="text-xs">Longitude *</Label><Input value={formData.lng || ""} onChange={e => setFormField("lng", e.target.value)} data-testid="input-tower-lng" /></div>
                </div>
                {!editMode && <p className="text-xs text-blue-600">Click on the map to set coordinates automatically</p>}
                <div><Label className="text-xs">Notes</Label><Textarea value={formData.notes || ""} onChange={e => setFormField("notes", e.target.value)} rows={2} data-testid="input-tower-notes" /></div>
              </>
            )}
            {addType === "fiber" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Route Name *</Label><Input value={formData.name || ""} onChange={e => setFormField("name", e.target.value)} data-testid="input-fiber-name" /></div>
                  <div><Label className="text-xs">Fiber Core Count</Label><Input type="number" value={formData.fiberCoreCount ?? 12} onChange={e => setFormField("fiberCoreCount", parseInt(e.target.value))} data-testid="input-fiber-cores" /></div>
                  <div>
                    <Label className="text-xs">Cable Type</Label>
                    <Select value={formData.cableType || "single_mode"} onValueChange={v => setFormField("cableType", v)}>
                      <SelectTrigger data-testid="select-fiber-cable"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["single_mode", "multi_mode", "armored", "aerial", "underground"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">OLT</Label>
                    <Select value={String(formData.oltId || "")} onValueChange={v => setFormField("oltId", parseInt(v))}>
                      <SelectTrigger data-testid="select-fiber-olt"><SelectValue placeholder="Assign to OLT" /></SelectTrigger>
                      <SelectContent>
                        {olts.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Route Color</Label>
                    <Input type="color" value={formData.color || "#3B82F6"} onChange={e => setFormField("color", e.target.value)} className="h-9" data-testid="input-fiber-color" />
                  </div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={formData.status || "active"} onValueChange={v => setFormField("status", v)}>
                      <SelectTrigger data-testid="select-fiber-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["active", "planned", "maintenance", "down"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium">Route Points ({formData.coordinatePoints?.length || 0})</Label>
                    <div className="flex gap-1">
                      <Button size="sm" variant={mapClickMode === "fiber_point" ? "default" : "outline"} onClick={() => setMapClickMode(mapClickMode === "fiber_point" ? null : "fiber_point")} className="h-6 text-[10px]" data-testid="button-toggle-fiber-draw">
                        <MapPin className="w-3 h-3 mr-1" /> {mapClickMode === "fiber_point" ? "Drawing..." : "Draw on Map"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setFormField("coordinatePoints", [])} className="h-6 text-[10px]" data-testid="button-clear-fiber-points">Clear</Button>
                    </div>
                  </div>
                  {(formData.coordinatePoints || []).length > 0 ? (
                    <div className="max-h-24 overflow-y-auto text-[10px] font-mono space-y-0.5">
                      {formData.coordinatePoints.map((p: number[], i: number) => (
                        <div key={i} className="flex items-center justify-between bg-background px-2 py-0.5 rounded">
                          <span>Point {i + 1}: [{p[0].toFixed(5)}, {p[1].toFixed(5)}]</span>
                          <Button size="sm" variant="ghost" className="h-4 w-4 p-0" onClick={() => {
                            const pts = [...formData.coordinatePoints];
                            pts.splice(i, 1);
                            setFormField("coordinatePoints", pts);
                          }}><X className="w-2.5 h-2.5" /></Button>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-[10px] text-muted-foreground">Click on the map to draw fiber route points</p>}
                </div>
                <div><Label className="text-xs">Notes</Label><Textarea value={formData.notes || ""} onChange={e => setFormField("notes", e.target.value)} rows={2} data-testid="input-fiber-notes" /></div>
              </>
            )}
            {addType === "p2p" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Link Name *</Label><Input value={formData.name || ""} onChange={e => setFormField("name", e.target.value)} data-testid="input-p2p-name" /></div>
                  <div>
                    <Label className="text-xs">Frequency Band</Label>
                    <Select value={formData.frequencyBand || "5GHz"} onValueChange={v => setFormField("frequencyBand", v)}>
                      <SelectTrigger data-testid="select-p2p-freq"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["2.4GHz", "5GHz", "6GHz", "11GHz", "24GHz", "60GHz", "80GHz"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Bandwidth (Mbps)</Label><Input type="number" value={formData.bandwidthMbps ?? 100} onChange={e => setFormField("bandwidthMbps", parseInt(e.target.value))} data-testid="input-p2p-bw" /></div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={formData.status || "active"} onValueChange={v => setFormField("status", v)}>
                      <SelectTrigger data-testid="select-p2p-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["active", "stable", "congested", "down", "planned"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Tower A</Label>
                    <Select value={String(formData.towerAId || "")} onValueChange={v => {
                      const t = towers.find(tw => tw.id === parseInt(v));
                      setFormData(prev => ({ ...prev, towerAId: parseInt(v), towerALat: t?.lat, towerALng: t?.lng }));
                    }}>
                      <SelectTrigger data-testid="select-p2p-tower-a"><SelectValue placeholder="Select tower" /></SelectTrigger>
                      <SelectContent>
                        {towers.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Tower B</Label>
                    <Select value={String(formData.towerBId || "")} onValueChange={v => {
                      const t = towers.find(tw => tw.id === parseInt(v));
                      setFormData(prev => ({ ...prev, towerBId: parseInt(v), towerBLat: t?.lat, towerBLng: t?.lng }));
                    }}>
                      <SelectTrigger data-testid="select-p2p-tower-b"><SelectValue placeholder="Select tower" /></SelectTrigger>
                      <SelectContent>
                        {towers.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Or enter coordinates manually:</p>
                <div className="grid grid-cols-4 gap-2">
                  <div><Label className="text-[10px]">A Lat</Label><Input value={formData.towerALat || ""} onChange={e => setFormField("towerALat", e.target.value)} className="text-xs" data-testid="input-p2p-a-lat" /></div>
                  <div><Label className="text-[10px]">A Lng</Label><Input value={formData.towerALng || ""} onChange={e => setFormField("towerALng", e.target.value)} className="text-xs" data-testid="input-p2p-a-lng" /></div>
                  <div><Label className="text-[10px]">B Lat</Label><Input value={formData.towerBLat || ""} onChange={e => setFormField("towerBLat", e.target.value)} className="text-xs" data-testid="input-p2p-b-lat" /></div>
                  <div><Label className="text-[10px]">B Lng</Label><Input value={formData.towerBLng || ""} onChange={e => setFormField("towerBLng", e.target.value)} className="text-xs" data-testid="input-p2p-b-lng" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">RSSI (dBm)</Label><Input value={formData.rssi || ""} onChange={e => setFormField("rssi", e.target.value)} placeholder="-65" data-testid="input-p2p-rssi" /></div>
                  <div><Label className="text-xs">Latency (ms)</Label><Input value={formData.latencyMs || ""} onChange={e => setFormField("latencyMs", e.target.value)} placeholder="2.5" data-testid="input-p2p-latency" /></div>
                </div>
                <div><Label className="text-xs">Notes</Label><Textarea value={formData.notes || ""} onChange={e => setFormField("notes", e.target.value)} rows={2} data-testid="input-p2p-notes" /></div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); setMapClickMode(null); setClickedCoords(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-entity">
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editMode ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        .custom-network-icon { background: none !important; border: none !important; }
      `}</style>
    </div>
  );
}

function DetailField({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  return (
    <div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <div className="text-sm font-medium mt-0.5">
        {badge ? <Badge className={`text-[10px] ${statusBadgeClass[value] || ""}`}>{value}</Badge> : value}
      </div>
    </div>
  );
}
