import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  MapPin,
  Building2,
  Users,
  CheckCircle,
  XCircle,
  GitBranch,
  BarChart3,
  Globe,
  Settings,
  Home,
  TrendingUp,
  TrendingDown,
  UserCheck,
  BadgeDollarSign,
  Wallet,
  AlertTriangle,
  Activity,
  UserPlus,
  UserMinus,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useTab } from "@/hooks/use-tab";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertAreaSchema, type Area, type InsertArea, type Customer, type Reseller, type Branch } from "@shared/schema";
import { z } from "zod";

const areaFormSchema = insertAreaSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  city: z.string().min(2, "City is required"),
  mainArea: z.string().optional(),
});

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const pinIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const customerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33],
});

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

export default function AreasPage() {
  const { toast } = useToast();
  const [tab, changeTab] = useTab("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [availabilitySearch, setAvailabilitySearch] = useState("");
  const [coordLat, setCoordLat] = useState("");
  const [coordLng, setCoordLng] = useState("");
  const [pinLat, setPinLat] = useState<number | null>(null);
  const [pinLng, setPinLng] = useState<number | null>(null);
  const [reverseAddress, setReverseAddress] = useState("");
  const [addrSearch, setAddrSearch] = useState("");
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<{ display_name: string; lat: string; lon: string; type: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapLayer, setMapLayer] = useState<"street" | "satellite" | "topo">("street");

  const { data: areas, isLoading } = useQuery<Area[]>({
    queryKey: ["/api/areas"],
  });

  const { data: branches = [] } = useQuery<Branch[]>({ queryKey: ["/api/branches"] });
  const { data: allCustomers } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: allResellers } = useQuery<Reseller[]>({ queryKey: ["/api/resellers"] });
  const { data: branchStats, isLoading: branchStatsLoading } = useQuery<{
    area: string; totalCustomers: number; activeCustomers: number;
    suspendedCustomers: number; inactiveCustomers: number; monthlyRevenue: number;
    newThisMonth: number; newLastMonth: number; growthPct: number; closedPct: number;
    resellersCount: number; resellerRevenue: number; totalExpenses: number; profitLoss: number;
  }[]>({ queryKey: ["/api/analytics/branch-stats"] });

  const form = useForm<InsertArea>({
    resolver: zodResolver(areaFormSchema),
    defaultValues: {
      name: "",
      mainArea: "",
      city: "",
      zone: "",
      branch: "",
      totalCustomers: 0,
      totalHousesOffices: 0,
      status: "active",
    },
  });

  const addForm = useForm<InsertArea>({
    resolver: zodResolver(areaFormSchema),
    defaultValues: {
      name: "",
      mainArea: "",
      city: "",
      zone: "",
      branch: "",
      totalCustomers: 0,
      totalHousesOffices: 0,
      status: "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertArea) => {
      const res = await apiRequest("POST", "/api/areas", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/areas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDialogOpen(false);
      form.reset();
      addForm.reset();
      toast({ title: "Area created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertArea> }) => {
      const res = await apiRequest("PATCH", `/api/areas/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/areas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDialogOpen(false);
      setEditingArea(null);
      form.reset();
      toast({ title: "Area updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/areas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/areas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Area deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingArea(null);
    form.reset({
      name: "",
      mainArea: "",
      city: "",
      zone: "",
      branch: "",
      totalCustomers: 0,
      totalHousesOffices: 0,
      status: "active",
    });
    setDialogOpen(true);
  };

  const openEdit = (area: Area) => {
    setEditingArea(area);
    form.reset({
      name: area.name,
      mainArea: area.mainArea || "",
      city: area.city,
      zone: area.zone || "",
      branch: area.branch || "",
      totalCustomers: area.totalCustomers || 0,
      totalHousesOffices: area.totalHousesOffices || 0,
      status: area.status,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertArea) => {
    if (editingArea) {
      updateMutation.mutate({ id: editingArea.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const onAddSubmit = (data: InsertArea) => {
    createMutation.mutate(data);
  };

  const filtered = (areas || []).filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.city.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColors: Record<string, string> = {
    active: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950",
    inactive: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950",
  };

  const availabilityFiltered = (areas || []).filter((a) =>
    availabilitySearch
      ? a.name.toLowerCase().includes(availabilitySearch.toLowerCase()) ||
        a.city.toLowerCase().includes(availabilitySearch.toLowerCase())
      : true
  );

  const branchGroups = (areas || []).reduce<Record<string, Area[]>>((acc, area) => {
    const branch = area.branch || "Unassigned";
    if (!acc[branch]) acc[branch] = [];
    acc[branch].push(area);
    return acc;
  }, {});

  const totalCustomersAll = (areas || []).reduce((sum, a) => sum + (a.totalCustomers || 0), 0);
  const activeAreas = (areas || []).filter((a) => a.status === "active");

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en", "User-Agent": "NetSphere-ISP-App/1.0" } }
      );
      const data = await res.json();
      setReverseAddress(data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } catch {
      setReverseAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPinLat(lat);
    setPinLng(lng);
    setCoordLat(lat.toFixed(6));
    setCoordLng(lng.toFixed(6));
    setShowSuggestions(false);
    reverseGeocode(lat, lng);
  };

  const handleCoordCheck = () => {
    const lat = parseFloat(coordLat);
    const lng = parseFloat(coordLng);
    if (isNaN(lat) || isNaN(lng)) {
      toast({ title: "Invalid coordinates", description: "Please enter valid latitude and longitude values.", variant: "destructive" });
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({ title: "Out of range", description: "Latitude must be -90 to 90, longitude -180 to 180.", variant: "destructive" });
      return;
    }
    setPinLat(lat);
    setPinLng(lng);
    setFlyTarget({ lat, lng });
    reverseGeocode(lat, lng);
  };

  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 3) { setSearchSuggestions([]); return; }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1&countrycodes=pk,in,ae,sa,gb,us`,
        { headers: { "Accept-Language": "en", "User-Agent": "NetSphere-ISP-App/1.0" } }
      );
      const data = await res.json();
      setSearchSuggestions(data || []);
      setShowSuggestions(true);
    } catch {
      setSearchSuggestions([]);
    }
  };

  const handleAddressSearch = async () => {
    if (!addrSearch.trim()) return;
    setGeocodeLoading(true);
    setShowSuggestions(false);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addrSearch)}&format=json&limit=1&addressdetails=1`,
        { headers: { "Accept-Language": "en", "User-Agent": "NetSphere-ISP-App/1.0" } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setPinLat(lat);
        setPinLng(lng);
        setCoordLat(lat.toFixed(6));
        setCoordLng(lng.toFixed(6));
        setFlyTarget({ lat, lng });
        setReverseAddress(data[0].display_name);
        setSearchSuggestions([]);
      } else {
        toast({ title: "Location not found", description: "Try adding city name, e.g. 'Gulberg, Lahore, Pakistan'", variant: "destructive" });
      }
    } catch {
      toast({ title: "Search failed", description: "Unable to reach geocoding service.", variant: "destructive" });
    } finally {
      setGeocodeLoading(false);
    }
  };

  const selectSuggestion = (s: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setPinLat(lat);
    setPinLng(lng);
    setCoordLat(lat.toFixed(6));
    setCoordLng(lng.toFixed(6));
    setFlyTarget({ lat, lng });
    setReverseAddress(s.display_name);
    setAddrSearch(s.display_name.split(",")[0]);
    setShowSuggestions(false);
    setSearchSuggestions([]);
  };

  const mapTileLayers = {
    street: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri &mdash; Sources: Esri, HERE, Garmin, USGS, NGA, EPA, USDA, NPS",
      label: "Street",
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, DigitalGlobe, GeoEye, i-cubed, USDA FSA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community",
      label: "Satellite",
    },
    topo: {
      url: "https://tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution: 'Map data: &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
      label: "Topo",
    },
  };

  const customersWithCoords = (allCustomers || []).filter(
    c => c.mapLatitude && c.mapLongitude && c.status === "active"
  );

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-areas-title">Service Areas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage service coverage areas</p>
        </div>
      </div>

      {tab === "list" && (
        <div className="mt-5" data-testid="tab-content-list">
          <div className="flex justify-end mb-4">
            <Button onClick={openCreate} data-testid="button-add-area">
              <Plus className="h-4 w-4 mr-1" />
              Add Area
            </Button>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or city..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-areas"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <MapPin className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No areas found</p>
                  <p className="text-sm mt-1">Add your first service area to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="vendor-table-enterprise">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>City / Zone</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Houses & Offices</TableHead>
                        <TableHead>Active Customers</TableHead>
                        <TableHead>Monthly Income</TableHead>
                        <TableHead>Active Resellers</TableHead>
                        <TableHead>Reseller Revenue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((area) => {
                        const activeCusts = (allCustomers || []).filter(
                          c => c.area?.toLowerCase() === area.name.toLowerCase() && c.status === "active"
                        );
                        const monthlyIncome = activeCusts.reduce((sum, c) => sum + Number(c.monthlyBill || 0), 0);
                        const areaResellers = (allResellers || []).filter(
                          r => r.area?.toLowerCase() === area.name.toLowerCase() && r.status === "active"
                        );
                        const resellerRevenue = areaResellers.reduce((sum, r) => sum + Number(r.walletBalance || 0), 0);
                        return (
                        <TableRow key={area.id} data-testid={`row-area-${area.id}`}>
                          <TableCell>
                            <div className="font-medium flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              {area.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                {area.city}
                              </span>
                              {area.zone && <span className="text-xs text-muted-foreground pl-4">{area.zone}</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{area.branch || "—"}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Home className="h-3.5 w-3.5 text-purple-500" />
                              <span className="font-semibold text-sm" data-testid={`text-houses-${area.id}`}>
                                {(area.totalHousesOffices || 0).toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-blue-500" />
                              <span className="font-semibold text-sm" data-testid={`text-active-custs-${area.id}`}>
                                {activeCusts.length}
                              </span>
                              <span className="text-xs text-muted-foreground">active</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                              <span className="font-semibold text-sm text-green-700 dark:text-green-400" data-testid={`text-monthly-income-${area.id}`}>
                                Rs. {monthlyIncome.toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="h-3.5 w-3.5 text-amber-500" />
                              <span className="font-semibold text-sm" data-testid={`text-active-resellers-${area.id}`}>
                                {areaResellers.length}
                              </span>
                              <span className="text-xs text-muted-foreground">active</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <BadgeDollarSign className="h-3.5 w-3.5 text-cyan-500" />
                              <span className="font-semibold text-sm text-cyan-700 dark:text-cyan-400" data-testid={`text-reseller-revenue-${area.id}`}>
                                Rs. {resellerRevenue.toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`no-default-active-elevate text-[10px] capitalize ${statusColors[area.status] || ""}`}
                            >
                              {area.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-actions-${area.id}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(area)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => deleteMutation.mutate(area.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {tab === "add" && (
        <div className="mt-5" data-testid="tab-content-add">
          <Card>
            <CardHeader>
              <CardTitle>Add New Area</CardTitle>
              <CardDescription>Create a new service coverage area</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4 max-w-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Area Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Gulberg III" data-testid="input-add-area-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addForm.control}
                      name="mainArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Main Area Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Gulberg" data-testid="input-add-area-main-area" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Lahore" data-testid="input-add-area-city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addForm.control}
                      name="zone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zone</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. North Zone" data-testid="input-add-area-zone" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={addForm.control}
                    name="branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-add-area-branch">
                              <SelectValue placeholder="Select branch" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {branches.filter(b => b.status === "active").map((b) => (
                              <SelectItem key={b.id} value={b.name}>
                                {b.name}{b.city ? ` — ${b.city}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="totalHousesOffices"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Houses & Offices Estimate</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              data-testid="input-add-area-total-houses"
                              {...field}
                              value={field.value ?? 0}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addForm.control}
                      name="totalCustomers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Customers Estimate</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              data-testid="input-add-area-total-customers"
                              {...field}
                              value={field.value ?? 0}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={addForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "active"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-add-area-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-create-area"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Area"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "allocation" && (
        <div className="mt-5" data-testid="tab-content-allocation">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Areas</CardDescription>
                <CardTitle className="text-2xl" data-testid="text-total-areas">{(areas || []).length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Customers</CardDescription>
                <CardTitle className="text-2xl" data-testid="text-total-customers">{totalCustomersAll}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Areas</CardDescription>
                <CardTitle className="text-2xl" data-testid="text-active-areas">{activeAreas.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Customer Allocation by Area</CardTitle>
              <CardDescription>Overview of customer distribution across service areas</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (areas || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No allocation data</p>
                  <p className="text-sm mt-1">Add areas to see customer allocation</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Area</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Total Customers</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Allocation %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(areas || []).map((area) => {
                        const percentage = totalCustomersAll > 0
                          ? ((area.totalCustomers || 0) / totalCustomersAll * 100).toFixed(1)
                          : "0.0";
                        return (
                          <TableRow key={area.id} data-testid={`row-allocation-${area.id}`}>
                            <TableCell>
                              <div className="font-medium flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {area.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{area.city}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{area.branch || "N/A"}</TableCell>
                            <TableCell>
                              <span className="text-sm flex items-center gap-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                {area.totalCustomers || 0}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`no-default-active-elevate text-[10px] capitalize ${statusColors[area.status] || ""}`}
                              >
                                {area.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium" data-testid={`text-allocation-percent-${area.id}`}>{percentage}%</span>
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

      {tab === "availability" && (
        <div className="mt-5 space-y-4" data-testid="tab-content-availability">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                Map Coverage Checker
              </CardTitle>
              <CardDescription>
                Enter customer GPS coordinates or search an address to see their location on the map and check service coverage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search by Address / Area Name</p>
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10" />
                        <Input
                          placeholder="e.g. Gulberg III, Lahore, Pakistan"
                          value={addrSearch}
                          onChange={(e) => {
                            setAddrSearch(e.target.value);
                            fetchSuggestions(e.target.value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddressSearch();
                            if (e.key === "Escape") setShowSuggestions(false);
                          }}
                          onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                          className="pl-9 text-sm"
                          data-testid="input-address-search"
                        />
                      </div>
                      <Button onClick={handleAddressSearch} disabled={geocodeLoading} size="sm" data-testid="button-address-search">
                        {geocodeLoading ? "Searching..." : "Search"}
                      </Button>
                    </div>
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute z-50 top-full mt-1 left-0 right-14 bg-background border border-border rounded-md shadow-lg overflow-hidden">
                        {searchSuggestions.map((s, i) => (
                          <button
                            key={i}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-start gap-2 border-b border-border last:border-0"
                            onClick={() => selectSuggestion(s)}
                            data-testid={`suggestion-${i}`}
                          >
                            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{s.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Tip: Include city & country for best results, e.g. "DHA Phase 5, Lahore, Pakistan"</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Enter GPS Coordinates</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Latitude (e.g. 31.5204)"
                      value={coordLat}
                      onChange={(e) => setCoordLat(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCoordCheck()}
                      className="text-sm"
                      data-testid="input-coord-lat"
                    />
                    <Input
                      placeholder="Longitude (e.g. 74.3587)"
                      value={coordLng}
                      onChange={(e) => setCoordLng(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCoordCheck()}
                      className="text-sm"
                      data-testid="input-coord-lng"
                    />
                    <Button onClick={handleCoordCheck} size="sm" variant="secondary" data-testid="button-check-coords" title="Check coordinates on map">
                      <MapPin className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Paste coordinates from WhatsApp location share or Google Maps</p>
                </div>
              </div>

              {reverseAddress && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                  <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Pinned Location</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{reverseAddress}</p>
                    {pinLat && pinLng && (
                      <p className="text-[10px] text-blue-500 dark:text-blue-500 mt-0.5 font-mono select-all">
                        {pinLat.toFixed(6)}, {pinLng.toFixed(6)}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] px-2"
                    onClick={() => { setPinLat(null); setPinLng(null); setReverseAddress(""); setCoordLat(""); setCoordLng(""); }}
                  >
                    Clear
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-muted-foreground">Map Style:</p>
                {(["street", "satellite", "topo"] as const).map(layer => (
                  <Button
                    key={layer}
                    size="sm"
                    variant={mapLayer === layer ? "default" : "outline"}
                    className="h-6 text-[10px] px-2 capitalize"
                    onClick={() => setMapLayer(layer)}
                    data-testid={`button-layer-${layer}`}
                  >
                    {mapTileLayers[layer].label}
                  </Button>
                ))}
                <span className="ml-auto text-[10px] text-muted-foreground">Click anywhere on map to drop a pin</span>
              </div>

              <div className="rounded-lg overflow-hidden border border-border" style={{ height: "500px" }}>
                <MapContainer
                  center={[30.3753, 69.3451]}
                  zoom={6}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={true}
                  data-testid="map-container"
                >
                  <TileLayer
                    key={mapLayer}
                    url={mapTileLayers[mapLayer].url}
                    attribution={mapTileLayers[mapLayer].attribution}
                    maxZoom={19}
                  />
                  <MapClickHandler onMapClick={handleMapClick} />
                  {flyTarget && <FlyTo lat={flyTarget.lat} lng={flyTarget.lng} />}
                  {pinLat && pinLng && (
                    <Marker position={[pinLat, pinLng]} icon={pinIcon}>
                      <Popup maxWidth={260}>
                        <div className="space-y-1 py-1">
                          <p className="font-semibold text-red-600 text-sm">📍 Pinned Location</p>
                          {reverseAddress && (
                            <p className="text-xs text-gray-700 leading-snug">{reverseAddress}</p>
                          )}
                          <p className="text-xs font-mono text-gray-500 select-all">{pinLat.toFixed(6)}, {pinLng.toFixed(6)}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  {customersWithCoords.map(c => (
                    <Marker
                      key={c.id}
                      position={[Number(c.mapLatitude), Number(c.mapLongitude)]}
                      icon={customerIcon}
                    >
                      <Popup maxWidth={220}>
                        <div className="space-y-1 py-1">
                          <p className="font-semibold text-green-700 text-sm">👤 {c.fullName}</p>
                          <p className="text-xs text-gray-600">{c.area} · {c.customerType}</p>
                          <p className="text-xs text-gray-500 leading-snug">{c.address}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground items-center">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block flex-shrink-0"></span> Searched / pinned location</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block flex-shrink-0"></span> Existing active customers</span>
                <span className="ml-auto">Powered by Esri &amp; OpenStreetMap</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Service Area Coverage</CardTitle>
              <CardDescription>All configured service areas — search to filter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by area or city..."
                  value={availabilitySearch}
                  onChange={(e) => setAvailabilitySearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-availability-search"
                />
              </div>
              {isLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : availabilityFiltered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Globe className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm font-medium">No matching areas found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Area</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Zone</TableHead>
                        <TableHead>Active Customers</TableHead>
                        <TableHead>Service Status</TableHead>
                        <TableHead>Availability</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availabilityFiltered.map((area) => {
                        const areaActiveCusts = (allCustomers || []).filter(
                          c => c.area?.toLowerCase() === area.name.toLowerCase() && c.status === "active"
                        );
                        return (
                          <TableRow key={area.id} data-testid={`row-availability-${area.id}`}>
                            <TableCell>
                              <div className="font-medium flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {area.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{area.city}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{area.zone || "—"}</TableCell>
                            <TableCell>
                              <span className="text-sm flex items-center gap-1">
                                <Users className="h-3 w-3 text-blue-500" />
                                {areaActiveCusts.length}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`no-default-active-elevate text-[10px] capitalize ${statusColors[area.status] || ""}`}
                              >
                                {area.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {area.status === "active" ? (
                                <span className="flex items-center gap-1 text-sm text-green-700 dark:text-green-300" data-testid={`text-available-${area.id}`}>
                                  <CheckCircle className="h-4 w-4" />
                                  Available
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400" data-testid={`text-unavailable-${area.id}`}>
                                  <XCircle className="h-4 w-4" />
                                  Unavailable
                                </span>
                              )}
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

      {tab === "branch-control" && (
        <div className="mt-5 space-y-6" data-testid="tab-content-branch-control">
          {(isLoading || branchStatsLoading) ? (
            <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-64 w-full" />)}</div>
          ) : Object.keys(branchGroups).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <GitBranch className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No branches found</p>
              <p className="text-sm mt-1">Add areas with branch information to use branch control</p>
            </div>
          ) : (
            <>
              {(() => {
                const totalRevAll = (branchStats || []).reduce((s, a) => s + a.monthlyRevenue, 0);
                const totalActAll = (branchStats || []).reduce((s, a) => s + a.activeCustomers, 0);
                const totalCustAll = (branchStats || []).reduce((s, a) => s + a.totalCustomers, 0);
                const totalExpAll = (branchStats || []).reduce((s, a) => s + a.totalExpenses, 0);
                const totalPLAll = totalRevAll - totalExpAll;
                const totalNewAll = (branchStats || []).reduce((s, a) => s + a.newThisMonth, 0);
                const totalResAll = (branchStats || []).reduce((s, a) => s + a.resellersCount, 0);
                const totalResellerRevAll = (branchStats || []).reduce((s, a) => s + a.resellerRevenue, 0);
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Total Customers", value: totalCustAll, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950" },
                      { label: "Active Customers", value: totalActAll, icon: UserCheck, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950" },
                      { label: "Monthly Revenue", value: `Rs. ${totalRevAll.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950" },
                      { label: "New This Month", value: totalNewAll, icon: UserPlus, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950" },
                      { label: "Reseller Revenue", value: `Rs. ${totalResellerRevAll.toLocaleString()}`, icon: Wallet, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950" },
                      { label: "Total Expenses", value: `Rs. ${totalExpAll.toLocaleString()}`, icon: AlertTriangle, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950" },
                      { label: "Net Profit / Loss", value: `Rs. ${totalPLAll.toLocaleString()}`, icon: totalPLAll >= 0 ? TrendingUp : TrendingDown, color: totalPLAll >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400", bg: totalPLAll >= 0 ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950" },
                      { label: "Total Resellers", value: totalResAll, icon: Activity, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950" },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                      <Card key={label} className="border">
                        <CardContent className="p-4 flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${bg} flex-shrink-0`}>
                            <Icon className={`h-4 w-4 ${color}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground truncate">{label}</p>
                            <p className={`text-lg font-bold truncate ${color}`} data-testid={`stat-${label.replace(/\s+/g, "-").toLowerCase()}`}>{value}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                );
              })()}

              {Object.entries(branchGroups).map(([branch, branchAreas]) => {
                const branchAreaNames = branchAreas.map(a => a.name.toLowerCase());
                const bStats = (branchStats || []).filter(s => branchAreaNames.includes(s.area.toLowerCase()));
                const bRevenue = bStats.reduce((s, a) => s + a.monthlyRevenue, 0);
                const bActive = bStats.reduce((s, a) => s + a.activeCustomers, 0);
                const bTotal = bStats.reduce((s, a) => s + a.totalCustomers, 0);
                const bSuspended = bStats.reduce((s, a) => s + a.suspendedCustomers, 0);
                const bExpenses = bStats.reduce((s, a) => s + a.totalExpenses, 0);
                const bPL = bRevenue - bExpenses;
                const bGrowth = bStats.reduce((s, a) => s + a.newThisMonth, 0);
                const bResellers = bStats.reduce((s, a) => s + a.resellersCount, 0);
                const bResellerRev = bStats.reduce((s, a) => s + a.resellerRevenue, 0);
                const bClosedPct = bTotal > 0 ? ((bSuspended / bTotal) * 100).toFixed(1) : "0.0";
                const branchActive = branchAreas.filter(a => a.status === "active").length;

                return (
                  <Card key={branch} data-testid={`card-branch-${branch}`} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            {branch}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {branchAreas.length} area{branchAreas.length !== 1 ? "s" : ""} · {branchActive}/{branchAreas.length} active · {bResellers} reseller{bResellers !== 1 ? "s" : ""}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className={`no-default-active-elevate ${bPL >= 0 ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>
                            {bPL >= 0 ? "Profitable" : "Loss"}
                          </Badge>
                          <Badge variant="secondary" className="no-default-active-elevate">
                            {branchActive}/{branchAreas.length} Active
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-3 pt-3 border-t border-border">
                        {[
                          { label: "Total", value: bTotal, icon: Users, cls: "text-foreground" },
                          { label: "Active", value: bActive, icon: UserCheck, cls: "text-green-600 dark:text-green-400" },
                          { label: "Suspended", value: bSuspended, icon: UserMinus, cls: "text-yellow-600 dark:text-yellow-400" },
                          { label: "Monthly Revenue", value: `Rs. ${bRevenue.toLocaleString()}`, icon: DollarSign, cls: "text-emerald-600 dark:text-emerald-400" },
                          { label: "Reseller Rev.", value: `Rs. ${bResellerRev.toLocaleString()}`, icon: Wallet, cls: "text-orange-600 dark:text-orange-400" },
                          { label: "Expenses", value: `Rs. ${bExpenses.toLocaleString()}`, icon: AlertTriangle, cls: "text-red-600 dark:text-red-400" },
                          { label: "Profit / Loss", value: `Rs. ${bPL.toLocaleString()}`, icon: bPL >= 0 ? ArrowUpRight : ArrowDownRight, cls: bPL >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400" },
                        ].map(({ label, value, icon: Icon, cls }) => (
                          <div key={label} className="text-center p-2 rounded-lg bg-muted/50">
                            <Icon className={`h-3.5 w-3.5 mx-auto mb-0.5 ${cls}`} />
                            <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
                            <p className={`text-xs font-semibold mt-0.5 ${cls}`}>{value}</p>
                          </div>
                        ))}
                      </div>
                    </CardHeader>

                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="text-xs">Area</TableHead>
                              <TableHead className="text-xs">City / Zone</TableHead>
                              <TableHead className="text-xs text-center">Total</TableHead>
                              <TableHead className="text-xs text-center">Active</TableHead>
                              <TableHead className="text-xs text-center">Suspended</TableHead>
                              <TableHead className="text-xs text-right">Monthly Rev.</TableHead>
                              <TableHead className="text-xs text-center">Resellers</TableHead>
                              <TableHead className="text-xs text-right">Reseller Rev.</TableHead>
                              <TableHead className="text-xs text-right">Expenses</TableHead>
                              <TableHead className="text-xs text-right">Profit/Loss</TableHead>
                              <TableHead className="text-xs text-center">Growth</TableHead>
                              <TableHead className="text-xs text-center">Closed%</TableHead>
                              <TableHead className="text-xs text-center">New/Mo</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                              <TableHead className="w-8"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {branchAreas.map((area) => {
                              const as = (branchStats || []).find(s => s.area.toLowerCase() === area.name.toLowerCase());
                              const pl = as ? as.profitLoss : 0;
                              return (
                                <TableRow key={area.id} data-testid={`row-branch-area-${area.id}`}>
                                  <TableCell>
                                    <div className="font-medium flex items-center gap-1 text-sm">
                                      <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                      {area.name}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-xs">
                                      <span>{area.city}</span>
                                      {area.zone && <span className="text-muted-foreground"> · {area.zone}</span>}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center text-sm font-medium">{as?.totalCustomers ?? "—"}</TableCell>
                                  <TableCell className="text-center">
                                    <span className="text-green-600 dark:text-green-400 font-semibold text-sm">{as?.activeCustomers ?? "—"}</span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {as && as.suspendedCustomers > 0 ? (
                                      <span className="text-yellow-600 dark:text-yellow-400 font-semibold text-sm">{as.suspendedCustomers}</span>
                                    ) : <span className="text-muted-foreground text-sm">0</span>}
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                    {as ? `Rs. ${as.monthlyRevenue.toLocaleString()}` : "—"}
                                  </TableCell>
                                  <TableCell className="text-center text-sm">{as?.resellersCount ?? 0}</TableCell>
                                  <TableCell className="text-right text-sm text-orange-600 dark:text-orange-400">
                                    {as ? `Rs. ${as.resellerRevenue.toLocaleString()}` : "—"}
                                  </TableCell>
                                  <TableCell className="text-right text-sm text-red-600 dark:text-red-400">
                                    {as ? `Rs. ${as.totalExpenses.toLocaleString()}` : "—"}
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-semibold">
                                    {as ? (
                                      <span className={pl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                        Rs. {pl.toLocaleString()}
                                      </span>
                                    ) : "—"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {as ? (
                                      <span className={`text-xs font-semibold flex items-center justify-center gap-0.5 ${as.growthPct >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                        {as.growthPct >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                        {as.growthPct}%
                                      </span>
                                    ) : "—"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {as ? (
                                      <span className={`text-xs font-semibold ${as.closedPct > 20 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                                        {as.closedPct}%
                                      </span>
                                    ) : "—"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {as ? (
                                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center justify-center gap-0.5">
                                        <UserPlus className="h-3 w-3" />{as.newThisMonth}
                                      </span>
                                    ) : "—"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[area.status] || ""}`}>
                                      {area.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-branch-actions-${area.id}`}>
                                          <Settings className="h-3.5 w-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openEdit(area)}>
                                          <Edit className="h-4 w-4 mr-2" /> Edit Area
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { const newStatus = area.status === "active" ? "inactive" : "active"; updateMutation.mutate({ id: area.id, data: { status: newStatus } }); }}>
                                          {area.status === "active" ? <><XCircle className="h-4 w-4 mr-2" />Deactivate</> : <><CheckCircle className="h-4 w-4 mr-2" />Activate</>}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(area.id)}>
                                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="px-4 pb-3 pt-2 border-t border-border flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Active</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Suspended</span>
                        <span className="text-[10px] italic">Growth % = (new this month - last month) / last month × 100. Expenses require tagging in Expenses module.</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArea ? "Edit Area" : "Add New Area"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Gulberg III" data-testid="input-area-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mainArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Area Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Gulberg" data-testid="input-area-main-area" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Lahore" data-testid="input-area-city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. North Zone" data-testid="input-area-zone" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-area-branch">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.filter(b => b.status === "active").map((b) => (
                          <SelectItem key={b.id} value={b.name}>
                            {b.name}{b.city ? ` — ${b.city}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="totalHousesOffices"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Houses & Offices Estimate</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          data-testid="input-area-total-houses"
                          {...field}
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalCustomers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Customers Estimate</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          data-testid="input-area-total-customers"
                          {...field}
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "active"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-area-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-area"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingArea ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}