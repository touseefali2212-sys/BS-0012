import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Monitor,
  Cpu,
  Wifi,
  WifiOff,
  AlertTriangle,
  Activity,
  Server,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertNetworkDeviceSchema, type NetworkDevice, type InsertNetworkDevice } from "@shared/schema";
import { z } from "zod";

const deviceFormSchema = insertNetworkDeviceSchema.extend({
  name: z.string().min(1, "Name is required"),
  ipAddress: z.string().min(7, "Valid IP required"),
  type: z.string().min(1, "Type is required"),
  status: z.string().min(1, "Status is required"),
});

export default function NetworkMonitoringPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<NetworkDevice | null>(null);

  const { data: devices, isLoading } = useQuery<NetworkDevice[]>({
    queryKey: ["/api/network-devices"],
  });

  const form = useForm<InsertNetworkDevice>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      name: "",
      type: "router",
      vendor: "mikrotik",
      ipAddress: "",
      macAddress: "",
      location: "",
      area: "",
      status: "online",
      firmware: "",
      model: "",
      serialNumber: "",
      notes: "",
      monitoringEnabled: true,
      alertThreshold: 80,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertNetworkDevice) => {
      const res = await apiRequest("POST", "/api/network-devices", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/network-devices"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Device added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertNetworkDevice> }) => {
      const res = await apiRequest("PATCH", `/api/network-devices/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/network-devices"] });
      setDialogOpen(false);
      setEditingDevice(null);
      form.reset();
      toast({ title: "Device updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/network-devices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/network-devices"] });
      toast({ title: "Device deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingDevice(null);
    form.reset({
      name: "",
      type: "router",
      vendor: "mikrotik",
      ipAddress: "",
      macAddress: "",
      location: "",
      area: "",
      status: "online",
      firmware: "",
      model: "",
      serialNumber: "",
      notes: "",
      monitoringEnabled: true,
      alertThreshold: 80,
    });
    setDialogOpen(true);
  };

  const openEdit = (device: NetworkDevice) => {
    setEditingDevice(device);
    form.reset({
      name: device.name,
      type: device.type,
      vendor: device.vendor || "mikrotik",
      ipAddress: device.ipAddress,
      macAddress: device.macAddress || "",
      location: device.location || "",
      area: device.area || "",
      status: device.status,
      firmware: device.firmware || "",
      model: device.model || "",
      serialNumber: device.serialNumber || "",
      notes: device.notes || "",
      monitoringEnabled: device.monitoringEnabled ?? true,
      alertThreshold: device.alertThreshold ?? 80,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertNetworkDevice) => {
    if (editingDevice) {
      updateMutation.mutate({ id: editingDevice.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = (devices || []).filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.ipAddress.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    const matchType = typeFilter === "all" || d.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const statusConfig: Record<string, { color: string }> = {
    online: { color: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" },
    offline: { color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950" },
    warning: { color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950" },
  };

  const typeColors: Record<string, string> = {
    router: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950",
    switch: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950",
    access_point: "text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950",
    olt: "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950",
    server: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950",
    ups: "text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950",
  };

  const typeLabels: Record<string, string> = {
    router: "Router",
    switch: "Switch",
    access_point: "AP",
    olt: "OLT",
    server: "Server",
    ups: "UPS",
  };

  const allDevices = devices || [];
  const totalDevices = allDevices.length;
  const onlineDevices = allDevices.filter((d) => d.status === "online").length;
  const offlineDevices = allDevices.filter((d) => d.status === "offline").length;
  const warningDevices = allDevices.filter((d) => d.status === "warning").length;
  const avgCpu = totalDevices > 0
    ? Math.round(allDevices.reduce((sum, d) => sum + (d.cpuUsage || 0), 0) / totalDevices)
    : 0;

  const summaryCards = [
    { title: "Total Devices", value: totalDevices, icon: Monitor, color: "text-blue-600 dark:text-blue-400" },
    { title: "Online", value: onlineDevices, icon: Wifi, color: "text-green-600 dark:text-green-400" },
    { title: "Offline", value: offlineDevices, icon: WifiOff, color: "text-red-600 dark:text-red-400" },
    { title: "Warning", value: warningDevices, icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400" },
    { title: "Avg CPU", value: `${avgCpu}%`, icon: Cpu, color: "text-purple-600 dark:text-purple-400" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-monitoring-title">Network Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor and manage all network devices</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={openCreate} data-testid="button-add-device">
            <Plus className="h-4 w-4 mr-1" />
            Add Device
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} data-testid={`card-summary-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid={`text-summary-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
                  {card.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-devices"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-device-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-device-type-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="router">Router</SelectItem>
                <SelectItem value="switch">Switch</SelectItem>
                <SelectItem value="access_point">Access Point</SelectItem>
                <SelectItem value="olt">OLT</SelectItem>
                <SelectItem value="server">Server</SelectItem>
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
              <Monitor className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No devices found</p>
              <p className="text-sm mt-1">Add a new device to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Vendor</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">CPU%</TableHead>
                    <TableHead className="hidden lg:table-cell">Memory%</TableHead>
                    <TableHead className="hidden xl:table-cell">Uptime</TableHead>
                    <TableHead className="hidden xl:table-cell">Last Seen</TableHead>
                    <TableHead className="hidden md:table-cell">Location</TableHead>
                    <TableHead className="hidden lg:table-cell">Area</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((device) => {
                    const sConfig = statusConfig[device.status] || statusConfig.online;
                    return (
                      <TableRow key={device.id} data-testid={`row-device-${device.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium" data-testid={`text-device-name-${device.id}`}>{device.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${typeColors[device.type] || ""}`}>
                            {typeLabels[device.type] || device.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground capitalize">
                          {(device.vendor || "\u2014").replace("_", " ")}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm" data-testid={`text-device-ip-${device.id}`}>{device.ipAddress}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${sConfig.color}`}>
                            {device.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {device.cpuUsage != null ? `${device.cpuUsage}%` : "\u2014"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {device.memoryUsage != null ? `${device.memoryUsage}%` : "\u2014"}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                          {device.uptime || "\u2014"}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                          {device.lastSeen || "\u2014"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {device.location || "\u2014"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {device.area || "\u2014"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-device-actions-${device.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(device)} data-testid={`button-edit-device-${device.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteMutation.mutate(device.id)}
                                data-testid={`button-delete-device-${device.id}`}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-device-dialog-title">
              {editingDevice ? "Edit Device" : "Add Device"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Core Router 1" {...field} data-testid="input-device-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-device-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="router">Router</SelectItem>
                          <SelectItem value="switch">Switch</SelectItem>
                          <SelectItem value="access_point">Access Point</SelectItem>
                          <SelectItem value="olt">OLT</SelectItem>
                          <SelectItem value="server">Server</SelectItem>
                          <SelectItem value="ups">UPS</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vendor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "mikrotik"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-device-vendor">
                            <SelectValue placeholder="Select vendor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mikrotik">MikroTik</SelectItem>
                          <SelectItem value="cisco">Cisco</SelectItem>
                          <SelectItem value="ubiquiti">Ubiquiti</SelectItem>
                          <SelectItem value="tp_link">TP-Link</SelectItem>
                          <SelectItem value="huawei">Huawei</SelectItem>
                          <SelectItem value="zte">ZTE</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ipAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IP Address</FormLabel>
                      <FormControl>
                        <Input placeholder="192.168.1.1" {...field} data-testid="input-device-ip" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="macAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MAC Address</FormLabel>
                      <FormControl>
                        <Input placeholder="AA:BB:CC:DD:EE:FF" {...field} value={field.value || ""} data-testid="input-device-mac" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-device-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Main Office" {...field} value={field.value || ""} data-testid="input-device-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area</FormLabel>
                      <FormControl>
                        <Input placeholder="Zone A" {...field} value={field.value || ""} data-testid="input-device-area" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="CCR1036-8G-2S+" {...field} value={field.value || ""} data-testid="input-device-model" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firmware"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Firmware</FormLabel>
                      <FormControl>
                        <Input placeholder="v7.10" {...field} value={field.value || ""} data-testid="input-device-firmware" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="SN12345678" {...field} value={field.value || ""} data-testid="input-device-serial" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="alertThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alert Threshold (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          {...field}
                          value={field.value ?? 80}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 80)}
                          data-testid="input-device-threshold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="monitoringEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-monitoring-enabled"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Enable Monitoring</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." {...field} value={field.value || ""} data-testid="input-device-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel-device"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-device"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingDevice ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}