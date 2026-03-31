import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTab } from "@/hooks/use-tab";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, Globe, Network, Server,
  Wifi, Download, CheckCircle, AlertCircle, Shield, RefreshCw, Activity,
  Layers, GitBranch, AlertTriangle, Eye, Lock, Unlock, FileText,
  Monitor, Cpu, Database as DatabaseIcon, BarChart3, ArrowUpDown,
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
  insertIpAddressSchema, insertSubnetSchema, insertVlanSchema,
  type IpAddress, type InsertIpAddress, type Customer,
  type Subnet, type InsertSubnet, type Vlan, type InsertVlan, type IpamLog,
  type NetworkDevice,
} from "@shared/schema";
import { z } from "zod";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const ipFormSchema = insertIpAddressSchema.extend({
  ipAddress: z.string().min(7, "Valid IP required"),
  type: z.string().min(1, "Type is required"),
  status: z.string().min(1, "Status is required"),
});

const subnetFormSchema = insertSubnetSchema.extend({
  name: z.string().min(1, "Name is required"),
  networkAddress: z.string().min(7, "Valid network address required"),
});

const vlanFormSchema = insertVlanSchema.extend({
  name: z.string().min(1, "Name is required"),
  vlanIdNumber: z.coerce.number().min(1).max(4094),
});

const TABS = [
  { value: "overview", label: "IP Pool Overview", icon: BarChart3 },
  { value: "subnets", label: "Subnet Management", icon: GitBranch },
  { value: "vlans", label: "VLAN Configuration", icon: Layers },
  { value: "allocation", label: "IP Allocation", icon: Globe },
  { value: "conflicts", label: "Conflict Detection & Logs", icon: AlertTriangle },
];

const STATUS_COLORS: Record<string, string> = {
  available: "text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30",
  assigned: "text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/30",
  reserved: "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30",
  conflict: "text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30",
  blocked: "text-slate-600 border-slate-300 bg-slate-50 dark:bg-slate-950/30",
  disabled: "text-slate-500 border-slate-300 bg-slate-50 dark:bg-slate-950/30",
};

const STATUS_DOTS: Record<string, string> = {
  available: "bg-green-500",
  assigned: "bg-blue-500",
  reserved: "bg-amber-500",
  conflict: "bg-red-500",
  blocked: "bg-slate-500",
  disabled: "bg-slate-400",
};

const VLAN_COLORS: Record<string, string> = {
  active: "text-green-600 border-green-300",
  disabled: "text-red-600 border-red-300",
  maintenance: "text-amber-600 border-amber-300",
};

function cidrToDetails(cidr: string) {
  const parts = cidr.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
  if (!parts) return null;
  const ipParts = parts[1].split(".").map(Number);
  const prefix = parseInt(parts[2]);
  if (prefix < 0 || prefix > 32) return null;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const network = ((ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]) >>> 0;
  const networkAddr = (network & mask) >>> 0;
  const broadcast = (networkAddr | ~mask) >>> 0;
  const totalHosts = Math.pow(2, 32 - prefix);
  const usableHosts = prefix >= 31 ? totalHosts : totalHosts - 2;
  const toIp = (n: number) => `${(n >>> 24) & 255}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}`;
  const maskStr = toIp(mask);
  const gateway = prefix < 31 ? toIp(networkAddr + 1) : toIp(networkAddr);
  return {
    networkAddress: toIp(networkAddr),
    broadcastAddress: toIp(broadcast),
    subnetMask: maskStr,
    gateway,
    totalHosts,
    usableHosts,
    cidr: prefix,
  };
}

export default function IpamPage() {
  const { toast } = useToast();
  const [tab, changeTab] = useTab("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ipDialogOpen, setIpDialogOpen] = useState(false);
  const [subnetDialogOpen, setSubnetDialogOpen] = useState(false);
  const [vlanDialogOpen, setVlanDialogOpen] = useState(false);
  const [editingIp, setEditingIp] = useState<IpAddress | null>(null);
  const [editingSubnet, setEditingSubnet] = useState<Subnet | null>(null);
  const [editingVlan, setEditingVlan] = useState<Vlan | null>(null);
  const [subnetSearch, setSubnetSearch] = useState("");
  const [vlanSearch, setVlanSearch] = useState("");

  const { data: ipAddresses, isLoading: ipLoading } = useQuery<(IpAddress & { customerName?: string })[]>({
    queryKey: ["/api/ip-addresses"],
  });
  const { data: subnetsData, isLoading: subnetsLoading } = useQuery<Subnet[]>({
    queryKey: ["/api/subnets"],
  });
  const { data: vlansData, isLoading: vlansLoading } = useQuery<Vlan[]>({
    queryKey: ["/api/vlans"],
  });
  const { data: ipamLogsData } = useQuery<IpamLog[]>({
    queryKey: ["/api/ipam-logs"],
  });
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });
  const { data: networkDevices } = useQuery<NetworkDevice[]>({
    queryKey: ["/api/network-devices"],
  });

  const isLoading = ipLoading || subnetsLoading || vlansLoading;
  const allIps = ipAddresses || [];
  const allSubnets = subnetsData || [];
  const allVlans = vlansData || [];
  const allLogs = ipamLogsData || [];
  const allDevices = networkDevices || [];

  const totalIps = allIps.length;
  const usedIps = allIps.filter(ip => ip.status === "assigned").length;
  const availableIps = allIps.filter(ip => ip.status === "available").length;
  const reservedIps = allIps.filter(ip => ip.status === "reserved").length;
  const conflictIps = allIps.filter(ip => ip.status === "conflict").length;

  const ipForm = useForm<InsertIpAddress>({
    resolver: zodResolver(ipFormSchema),
    defaultValues: {
      ipAddress: "", subnet: "", gateway: "", type: "dynamic", status: "available",
      customerId: undefined, assignedDate: "", vlan: "", pool: "", notes: "",
      macAddress: "", serviceType: "", linkedDevice: "",
    },
  });

  const subnetForm = useForm<InsertSubnet>({
    resolver: zodResolver(subnetFormSchema),
    defaultValues: {
      name: "", networkAddress: "", subnetMask: "", gateway: "", dns: "",
      pop: "", associatedDevice: "", ipType: "private", notes: "", status: "active",
    },
  });

  const vlanForm = useForm<InsertVlan>({
    resolver: zodResolver(vlanFormSchema),
    defaultValues: {
      vlanIdNumber: 100, name: "", type: "internet", pop: "",
      linkedDevice: "", subnetAssignment: "", status: "active", description: "",
    },
  });

  const logIpamAction = async (actionType: string, ipAddress?: string, oldValue?: string, newValue?: string, details?: string) => {
    try {
      await apiRequest("POST", "/api/ipam-logs", { actionType, ipAddress, oldValue, newValue, details, user: "admin", deviceSyncStatus: "pending" });
      queryClient.invalidateQueries({ queryKey: ["/api/ipam-logs"] });
    } catch {}
  };

  const createIpMutation = useMutation({
    mutationFn: async (data: InsertIpAddress) => {
      const res = await apiRequest("POST", "/api/ip-addresses", data);
      return res.json();
    },
    onSuccess: (_: any, variables: InsertIpAddress) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ip-addresses"] });
      setIpDialogOpen(false);
      ipForm.reset();
      logIpamAction("IP Created", variables.ipAddress, undefined, variables.status, `Type: ${variables.type}, Subnet: ${variables.subnet || "—"}`);
      toast({ title: "IP address created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateIpMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertIpAddress> }) => {
      const res = await apiRequest("PATCH", `/api/ip-addresses/${id}`, data);
      return res.json();
    },
    onSuccess: (_: any, variables: { id: number; data: Partial<InsertIpAddress> }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ip-addresses"] });
      setIpDialogOpen(false);
      setEditingIp(null);
      ipForm.reset();
      const ip = allIps.find(i => i.id === variables.id);
      logIpamAction("IP Updated", ip?.ipAddress, ip?.status, variables.data.status || ip?.status, `Fields changed: ${Object.keys(variables.data).join(", ")}`);
      toast({ title: "IP address updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteIpMutation = useMutation({
    mutationFn: async (id: number) => {
      const ip = allIps.find(i => i.id === id);
      await apiRequest("DELETE", `/api/ip-addresses/${id}`);
      return ip;
    },
    onSuccess: (ip: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ip-addresses"] });
      logIpamAction("IP Deleted", ip?.ipAddress, ip?.status, undefined, `Removed from pool: ${ip?.pool || "—"}`);
      toast({ title: "IP address deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createSubnetMutation = useMutation({
    mutationFn: async (data: InsertSubnet) => {
      const details = cidrToDetails(data.networkAddress);
      const enriched = details ? {
        ...data,
        subnetMask: details.subnetMask,
        gateway: data.gateway || details.gateway,
        cidr: details.cidr,
        totalHosts: details.totalHosts,
        usableHosts: details.usableHosts,
        broadcastAddress: details.broadcastAddress,
      } : data;
      const res = await apiRequest("POST", "/api/subnets", enriched);
      return res.json();
    },
    onSuccess: (_: any, variables: InsertSubnet) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subnets"] });
      setSubnetDialogOpen(false);
      subnetForm.reset();
      logIpamAction("Subnet Created", variables.networkAddress, undefined, variables.name, `Type: ${variables.ipType}, POP: ${variables.pop || "—"}`);
      toast({ title: "Subnet created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateSubnetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertSubnet> }) => {
      const details = data.networkAddress ? cidrToDetails(data.networkAddress) : null;
      const enriched = details ? {
        ...data,
        subnetMask: details.subnetMask,
        gateway: data.gateway || details.gateway,
        cidr: details.cidr,
        totalHosts: details.totalHosts,
        usableHosts: details.usableHosts,
        broadcastAddress: details.broadcastAddress,
      } : data;
      const res = await apiRequest("PATCH", `/api/subnets/${id}`, enriched);
      return res.json();
    },
    onSuccess: (_: any, variables: { id: number; data: Partial<InsertSubnet> }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subnets"] });
      setSubnetDialogOpen(false);
      setEditingSubnet(null);
      subnetForm.reset();
      logIpamAction("Subnet Updated", variables.data.networkAddress, undefined, undefined, `Subnet ID ${variables.id} updated`);
      toast({ title: "Subnet updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSubnetMutation = useMutation({
    mutationFn: async (id: number) => {
      const s = allSubnets.find(x => x.id === id);
      await apiRequest("DELETE", `/api/subnets/${id}`);
      return s;
    },
    onSuccess: (s: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subnets"] });
      logIpamAction("Subnet Deleted", s?.networkAddress, s?.name, undefined, `Removed subnet: ${s?.name || "—"}`);
      toast({ title: "Subnet deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createVlanMutation = useMutation({
    mutationFn: async (data: InsertVlan) => {
      const res = await apiRequest("POST", "/api/vlans", data);
      return res.json();
    },
    onSuccess: (_: any, variables: InsertVlan) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vlans"] });
      setVlanDialogOpen(false);
      vlanForm.reset();
      logIpamAction("VLAN Created", undefined, undefined, `VLAN ${variables.vlanIdNumber}`, `Name: ${variables.name}, Type: ${variables.type}`);
      toast({ title: "VLAN created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateVlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertVlan> }) => {
      const res = await apiRequest("PATCH", `/api/vlans/${id}`, data);
      return res.json();
    },
    onSuccess: (_: any, variables: { id: number; data: Partial<InsertVlan> }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vlans"] });
      setVlanDialogOpen(false);
      setEditingVlan(null);
      vlanForm.reset();
      const v = allVlans.find(x => x.id === variables.id);
      logIpamAction("VLAN Updated", undefined, `VLAN ${v?.vlanIdNumber}`, undefined, `VLAN ${v?.name || variables.id} updated`);
      toast({ title: "VLAN updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteVlanMutation = useMutation({
    mutationFn: async (id: number) => {
      const v = allVlans.find(x => x.id === id);
      await apiRequest("DELETE", `/api/vlans/${id}`);
      return v;
    },
    onSuccess: (v: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vlans"] });
      logIpamAction("VLAN Deleted", undefined, `VLAN ${v?.vlanIdNumber}`, undefined, `Removed VLAN: ${v?.name || "—"}`);
      toast({ title: "VLAN deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const syncCustomerIpsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sync-customer-ips-to-ipam");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ip-addresses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vlans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ipam-logs"] });
      toast({ title: "Customer IP Sync Complete", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
    },
  });

  const [pingResults, setPingResults] = useState<Record<string, { alive: boolean; latency: number | null }>>({});
  const [pingEnabled, setPingEnabled] = useState(false);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doPingBatch = useCallback(async () => {
    if (!allIps.length) return;
    const ips = allIps.map(ip => ip.ipAddress).filter(ip => /^[\d.]+$/.test(ip));
    if (!ips.length) return;
    try {
      const res = await apiRequest("POST", "/api/ping-batch", { ips });
      const data = await res.json();
      setPingResults(data);
    } catch {}
  }, [allIps]);

  useEffect(() => {
    if (pingEnabled) {
      doPingBatch();
      pingIntervalRef.current = setInterval(doPingBatch, 5000);
    } else {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [pingEnabled, doPingBatch]);

  const openCreateIp = () => {
    setEditingIp(null);
    ipForm.reset({ ipAddress: "", subnet: "", gateway: "", type: "dynamic", status: "available", customerId: undefined, assignedDate: "", vlan: "", pool: "", notes: "", macAddress: "", serviceType: "", linkedDevice: "" });
    setIpDialogOpen(true);
  };
  const openEditIp = (ip: IpAddress) => {
    setEditingIp(ip);
    ipForm.reset({ ipAddress: ip.ipAddress, subnet: ip.subnet || "", gateway: ip.gateway || "", type: ip.type, status: ip.status, customerId: ip.customerId || undefined, assignedDate: ip.assignedDate || "", vlan: ip.vlan || "", pool: ip.pool || "", notes: ip.notes || "", macAddress: ip.macAddress || "", serviceType: ip.serviceType || "", linkedDevice: ip.linkedDevice || "" });
    setIpDialogOpen(true);
  };
  const openCreateSubnet = () => {
    setEditingSubnet(null);
    subnetForm.reset({ name: "", networkAddress: "", subnetMask: "", gateway: "", dns: "", pop: "", associatedDevice: "", ipType: "private", notes: "", status: "active" });
    setSubnetDialogOpen(true);
  };
  const openEditSubnet = (s: Subnet) => {
    setEditingSubnet(s);
    subnetForm.reset({ name: s.name, networkAddress: s.networkAddress, subnetMask: s.subnetMask || "", gateway: s.gateway || "", dns: s.dns || "", pop: s.pop || "", associatedDevice: s.associatedDevice || "", ipType: s.ipType, notes: s.notes || "", status: s.status });
    setSubnetDialogOpen(true);
  };
  const openCreateVlan = () => {
    setEditingVlan(null);
    vlanForm.reset({ vlanIdNumber: 100, name: "", type: "internet", pop: "", linkedDevice: "", subnetAssignment: "", status: "active", description: "" });
    setVlanDialogOpen(true);
  };
  const openEditVlan = (v: Vlan) => {
    setEditingVlan(v);
    vlanForm.reset({ vlanIdNumber: v.vlanIdNumber, name: v.name, type: v.type, pop: v.pop || "", linkedDevice: v.linkedDevice || "", subnetAssignment: v.subnetAssignment || "", status: v.status, description: v.description || "" });
    setVlanDialogOpen(true);
  };

  const onSubmitIp = (data: InsertIpAddress) => {
    if (editingIp) {
      updateIpMutation.mutate({ id: editingIp.id, data });
    } else {
      createIpMutation.mutate(data);
    }
  };
  const onSubmitSubnet = (data: InsertSubnet) => {
    if (editingSubnet) {
      updateSubnetMutation.mutate({ id: editingSubnet.id, data });
    } else {
      createSubnetMutation.mutate(data);
    }
  };
  const onSubmitVlan = (data: InsertVlan) => {
    if (editingVlan) {
      updateVlanMutation.mutate({ id: editingVlan.id, data });
    } else {
      createVlanMutation.mutate(data);
    }
  };

  const filteredIps = useMemo(() => {
    return allIps.filter(ip => {
      const q = search.toLowerCase();
      const matchSearch = !q || ip.ipAddress.toLowerCase().includes(q) || (ip.subnet || "").toLowerCase().includes(q) || (ip.vlan || "").toLowerCase().includes(q) || (ip.pool || "").toLowerCase().includes(q) || (ip.customerName || "").toLowerCase().includes(q) || ((ip as any).vendorName || "").toLowerCase().includes(q) || ((ip as any).customerType || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || ip.status === statusFilter;
      const matchType = typeFilter === "all" || ip.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [allIps, search, statusFilter, typeFilter]);

  const filteredSubnets = useMemo(() => {
    const q = subnetSearch.toLowerCase();
    return allSubnets.filter(s => !q || s.name.toLowerCase().includes(q) || s.networkAddress.toLowerCase().includes(q) || (s.pop || "").toLowerCase().includes(q));
  }, [allSubnets, subnetSearch]);

  const filteredVlans = useMemo(() => {
    const q = vlanSearch.toLowerCase();
    return allVlans.filter(v => !q || v.name.toLowerCase().includes(q) || String(v.vlanIdNumber).includes(q) || (v.type || "").toLowerCase().includes(q));
  }, [allVlans, vlanSearch]);

  const conflicts = useMemo(() => {
    const issues: { type: string; severity: string; detail: string; ip?: string }[] = [];
    const ipCounts = new Map<string, number>();
    allIps.forEach(ip => {
      const c = ipCounts.get(ip.ipAddress) || 0;
      ipCounts.set(ip.ipAddress, c + 1);
    });
    ipCounts.forEach((count, ip) => {
      if (count > 1) {
        issues.push({ type: "Duplicate IP", severity: "critical", detail: `IP ${ip} is assigned ${count} times`, ip });
      }
    });
    const vlanIds = new Map<number, string[]>();
    allVlans.forEach(v => {
      const existing = vlanIds.get(v.vlanIdNumber) || [];
      existing.push(v.name);
      vlanIds.set(v.vlanIdNumber, existing);
    });
    vlanIds.forEach((names, vid) => {
      if (names.length > 1) {
        issues.push({ type: "VLAN ID Conflict", severity: "warning", detail: `VLAN ID ${vid} used by: ${names.join(", ")}` });
      }
    });
    allIps.filter(ip => ip.status === "conflict").forEach(ip => {
      issues.push({ type: "IP Conflict", severity: "critical", detail: `IP ${ip.ipAddress} marked as conflict`, ip: ip.ipAddress });
    });
    const subnetUtilization = new Map<string, { total: number; used: number }>();
    allSubnets.forEach(s => {
      subnetUtilization.set(s.networkAddress, { total: s.usableHosts || 0, used: s.usedIps || 0 });
    });
    subnetUtilization.forEach((util, addr) => {
      if (util.total > 0 && util.used / util.total >= 0.8) {
        issues.push({ type: "IP Exhaustion Alert", severity: util.used >= util.total ? "critical" : "warning", detail: `Subnet ${addr}: ${util.used}/${util.total} IPs used (${Math.round(util.used / util.total * 100)}%)` });
      }
    });
    return issues;
  }, [allIps, allVlans, allSubnets]);

  const pieData = [
    { name: "Available", value: availableIps, color: "#22c55e" },
    { name: "Assigned", value: usedIps, color: "#3b82f6" },
    { name: "Reserved", value: reservedIps, color: "#f59e0b" },
    { name: "Conflict", value: conflictIps, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const subnetBarData = allSubnets.slice(0, 10).map(s => ({
    name: s.name.length > 12 ? s.name.slice(0, 12) + "…" : s.name,
    total: s.usableHosts || 0,
    used: s.usedIps || 0,
  }));

  const vlanTypeData = (() => {
    const counts: Record<string, number> = {};
    allVlans.forEach(v => { counts[v.type] = (counts[v.type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  const VLAN_PIE_COLORS = ["#06b6d4", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981"];

  if (isLoading) {
    return (
      <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-800 to-cyan-500 flex items-center justify-center shadow-lg" data-testid="icon-ipam">
            <Network className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-ipam-title">IP Address / VLAN Management</h1>
            <p className="text-sm text-muted-foreground">Network Operations Center — Structured IP planning, subnet allocation & VLAN control</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open("/api/export/ip-addresses", "_blank")} data-testid="button-export-ips">
            <Download className="h-4 w-4 mr-1" />Export
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => changeTab(t.value)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === t.value ? "bg-gradient-to-r from-blue-800 to-cyan-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-background"}`}
            data-testid={`tab-${t.value}`}
          >
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-5" data-testid="tab-content-overview">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
            {[
              { label: "Total IP Pools", value: allSubnets.length, icon: DatabaseIcon, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
              { label: "Total Subnets", value: allSubnets.length, icon: GitBranch, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
              { label: "Total IPs", value: totalIps, icon: Globe, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
              { label: "Used IPs", value: usedIps, icon: Monitor, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
              { label: "Available IPs", value: availableIps, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
              { label: "Reserved IPs", value: reservedIps, icon: Shield, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
              { label: "VLANs", value: allVlans.length, icon: Layers, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30" },
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
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">IP Utilization</CardTitle></CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No IP data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Subnet Distribution</CardTitle></CardHeader>
              <CardContent>
                {subnetBarData.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No subnets</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={subnetBarData}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#1e3a8a" name="Total" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="used" fill="#06b6d4" name="Used" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">VLAN Usage by Type</CardTitle></CardHeader>
              <CardContent>
                {vlanTypeData.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No VLANs</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={vlanTypeData} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                        {vlanTypeData.map((_, i) => <Cell key={i} fill={VLAN_PIE_COLORS[i % VLAN_PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">IP Pools Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {allSubnets.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-30" />No IP pools configured. Add subnets to get started.
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                        <TableHead className="text-xs font-semibold">Pool Name</TableHead>
                        <TableHead className="text-xs font-semibold">IP Range</TableHead>
                        <TableHead className="text-xs font-semibold">Subnet Mask</TableHead>
                        <TableHead className="text-xs font-semibold">Gateway</TableHead>
                        <TableHead className="text-xs font-semibold">POP / Location</TableHead>
                        <TableHead className="text-xs font-semibold">Device</TableHead>
                        <TableHead className="text-xs font-semibold">Utilization</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allSubnets.map(s => {
                        const utilPct = s.usableHosts && s.usableHosts > 0 ? Math.round((s.usedIps || 0) / s.usableHosts * 100) : 0;
                        return (
                          <TableRow key={s.id} data-testid={`row-pool-${s.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                            <TableCell className="font-medium text-sm">{s.name}</TableCell>
                            <TableCell className="font-mono text-xs">{s.networkAddress}</TableCell>
                            <TableCell className="font-mono text-xs">{s.subnetMask || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{s.gateway || "—"}</TableCell>
                            <TableCell className="text-xs">{s.pop || "—"}</TableCell>
                            <TableCell className="text-xs">{s.associatedDevice || "—"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                  <div className={`h-full rounded-full ${utilPct >= 90 ? "bg-red-500" : utilPct >= 70 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${Math.min(utilPct, 100)}%` }} />
                                </div>
                                <span className="text-xs font-mono">{utilPct}%</span>
                              </div>
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

      {tab === "subnets" && (
        <div className="space-y-4" data-testid="tab-content-subnets">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Subnet Management</h2>
              <p className="text-sm text-muted-foreground">Create, monitor, and manage network subnets with auto CIDR calculation</p>
            </div>
            <Button size="sm" onClick={openCreateSubnet} className="bg-gradient-to-r from-blue-800 to-cyan-600" data-testid="button-add-subnet">
              <Plus className="h-4 w-4 mr-1" />Add Subnet
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search subnets..." value={subnetSearch} onChange={e => setSubnetSearch(e.target.value)} className="pl-9 h-9" data-testid="input-search-subnets" />
            </div>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                      <TableHead className="text-xs font-semibold">Name</TableHead>
                      <TableHead className="text-xs font-semibold">Network Address</TableHead>
                      <TableHead className="text-xs font-semibold">Mask</TableHead>
                      <TableHead className="text-xs font-semibold">Gateway</TableHead>
                      <TableHead className="text-xs font-semibold">DNS</TableHead>
                      <TableHead className="text-xs font-semibold">POP</TableHead>
                      <TableHead className="text-xs font-semibold">Device</TableHead>
                      <TableHead className="text-xs font-semibold">IP Type</TableHead>
                      <TableHead className="text-xs font-semibold">Hosts</TableHead>
                      <TableHead className="text-xs font-semibold">Broadcast</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubnets.length === 0 ? (
                      <TableRow><TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                        <GitBranch className="h-10 w-10 mx-auto mb-2 opacity-30" />No subnets found
                      </TableCell></TableRow>
                    ) : filteredSubnets.map(s => (
                      <TableRow key={s.id} data-testid={`row-subnet-${s.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        <TableCell className="font-medium text-sm">{s.name}</TableCell>
                        <TableCell className="font-mono text-xs">{s.networkAddress}</TableCell>
                        <TableCell className="font-mono text-xs">{s.subnetMask || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{s.gateway || "—"}</TableCell>
                        <TableCell className="text-xs">{s.dns || "—"}</TableCell>
                        <TableCell className="text-xs">{s.pop || "—"}</TableCell>
                        <TableCell className="text-xs">{s.associatedDevice || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] capitalize">{s.ipType}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{s.usableHosts || 0} / {s.totalHosts || 0}</TableCell>
                        <TableCell className="font-mono text-xs">{s.broadcastAddress || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] capitalize ${s.status === "active" ? "text-green-600 border-green-300" : "text-red-600 border-red-300"}`}>{s.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-actions-subnet-${s.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditSubnet(s)} data-testid={`button-edit-subnet-${s.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => deleteSubnetMutation.mutate(s.id)} className="text-destructive" data-testid={`button-delete-subnet-${s.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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

      {tab === "vlans" && (
        <div className="space-y-4" data-testid="tab-content-vlans">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">VLAN Configuration</h2>
              <p className="text-sm text-muted-foreground">Manage VLAN segmentation, tagging, and device-level isolation</p>
            </div>
            <Button size="sm" onClick={openCreateVlan} className="bg-gradient-to-r from-blue-800 to-cyan-600" data-testid="button-add-vlan">
              <Plus className="h-4 w-4 mr-1" />Add VLAN
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search VLANs..." value={vlanSearch} onChange={e => setVlanSearch(e.target.value)} className="pl-9 h-9" data-testid="input-search-vlans" />
            </div>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                      <TableHead className="text-xs font-semibold">VLAN ID</TableHead>
                      <TableHead className="text-xs font-semibold">Name</TableHead>
                      <TableHead className="text-xs font-semibold">Type</TableHead>
                      <TableHead className="text-xs font-semibold">POP</TableHead>
                      <TableHead className="text-xs font-semibold">Linked Device</TableHead>
                      <TableHead className="text-xs font-semibold">Subnet Assignment</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold">Description</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVlans.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        <Layers className="h-10 w-10 mx-auto mb-2 opacity-30" />No VLANs configured
                      </TableCell></TableRow>
                    ) : filteredVlans.map(v => (
                      <TableRow key={v.id} data-testid={`row-vlan-${v.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        <TableCell className="font-mono text-sm font-bold">{v.vlanIdNumber}</TableCell>
                        <TableCell className="font-medium text-sm">{v.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] capitalize">{v.type}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{v.pop || "—"}</TableCell>
                        <TableCell className="text-xs">{v.linkedDevice || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{v.subnetAssignment || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className={`h-2 w-2 rounded-full ${v.status === "active" ? "bg-green-500" : v.status === "disabled" ? "bg-red-500" : "bg-amber-500"}`} />
                            <span className={`text-xs font-medium capitalize ${VLAN_COLORS[v.status] || ""}`}>{v.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{v.description || "—"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-actions-vlan-${v.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditVlan(v)} data-testid={`button-edit-vlan-${v.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => deleteVlanMutation.mutate(v.id)} className="text-destructive" data-testid={`button-delete-vlan-${v.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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

      {tab === "allocation" && (
        <div className="space-y-4" data-testid="tab-content-allocation">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">IP Allocation & Assignment</h2>
              <p className="text-sm text-muted-foreground">Assign, reserve, and release IPs across customers and devices</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => window.open("/api/export/ip-addresses", "_blank")} data-testid="button-export-allocation">
                <Download className="h-4 w-4 mr-1" />Export CSV
              </Button>
              <Button size="sm" variant={pingEnabled ? "default" : "outline"} onClick={() => setPingEnabled(v => !v)} className={pingEnabled ? "bg-green-600 hover:bg-green-700 text-white" : ""} data-testid="button-toggle-ping">
                <Activity className={`h-4 w-4 mr-1 ${pingEnabled ? "animate-pulse" : ""}`} />
                {pingEnabled ? "Ping Live" : "Start Ping"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => syncCustomerIpsMutation.mutate()} disabled={syncCustomerIpsMutation.isPending} data-testid="button-sync-customer-ips">
                <RefreshCw className={`h-4 w-4 mr-1 ${syncCustomerIpsMutation.isPending ? "animate-spin" : ""}`} />
                {syncCustomerIpsMutation.isPending ? "Syncing..." : "Sync Customer IPs"}
              </Button>
              <Button size="sm" onClick={openCreateIp} className="bg-gradient-to-r from-blue-800 to-cyan-600" data-testid="button-add-ip">
                <Plus className="h-4 w-4 mr-1" />Add IP Address
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search IP, subnet, VLAN, pool, customer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" data-testid="input-search-ips" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9" data-testid="select-status-filter"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] h-9" data-testid="select-type-filter"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="static">Static</SelectItem>
                <SelectItem value="dynamic">Dynamic</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                      <TableHead className="text-xs font-semibold">Ping</TableHead>
                      <TableHead className="text-xs font-semibold">IP Address</TableHead>
                      <TableHead className="text-xs font-semibold">Subnet</TableHead>
                      <TableHead className="text-xs font-semibold">VLAN</TableHead>
                      <TableHead className="text-xs font-semibold">Assigned To</TableHead>
                      <TableHead className="text-xs font-semibold">Customer Type</TableHead>
                      <TableHead className="text-xs font-semibold">Vendor</TableHead>
                      <TableHead className="text-xs font-semibold">Service Type</TableHead>
                      <TableHead className="text-xs font-semibold">Device</TableHead>
                      <TableHead className="text-xs font-semibold">Type</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold">Assigned Date</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIps.length === 0 ? (
                      <TableRow><TableCell colSpan={14} className="text-center py-12 text-muted-foreground">
                        <Globe className="h-10 w-10 mx-auto mb-2 opacity-30" />No IP addresses found
                      </TableCell></TableRow>
                    ) : filteredIps.map(ip => {
                      const ping = pingResults[ip.ipAddress];
                      const pingStatus = !pingEnabled ? "idle" : !ping ? "pending" : ping.alive ? "up" : "down";
                      return (
                      <TableRow key={ip.id} data-testid={`row-ip-${ip.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        <TableCell>
                          {pingStatus === "idle" ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : pingStatus === "pending" ? (
                            <div className="flex items-center gap-1.5">
                              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400 animate-pulse" />
                              <span className="text-[10px] text-muted-foreground">...</span>
                            </div>
                          ) : pingStatus === "up" ? (
                            <div className="flex items-center gap-1.5" title={`Latency: ${ping?.latency ?? "?"}ms`}>
                              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                              <span className="text-[10px] font-medium text-emerald-600">{ping?.latency != null ? `${ping.latency}ms` : "Up"}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                              <span className="text-[10px] font-medium text-red-600">Down</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium">{ip.ipAddress}</TableCell>
                        <TableCell className="font-mono text-xs">{ip.subnet || "—"}</TableCell>
                        <TableCell className="text-xs">{ip.vlan || "—"}</TableCell>
                        <TableCell className="text-sm">{(ip as any).customerName || "—"}</TableCell>
                        <TableCell>
                          {(ip as any).customerType ? <Badge variant="outline" className={`text-[10px] uppercase ${(ip as any).customerType === "cir" ? "border-blue-300 text-blue-700 bg-blue-50" : (ip as any).customerType === "corporate" ? "border-purple-300 text-purple-700 bg-purple-50" : ""}`}>{(ip as any).customerType}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-xs">{(ip as any).vendorName || "—"}</TableCell>
                        <TableCell>
                          {ip.serviceType ? <Badge variant="outline" className="text-[10px] capitalize">{ip.serviceType}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-xs">{ip.linkedDevice || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] capitalize">{ip.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className={`h-2 w-2 rounded-full ${STATUS_DOTS[ip.status] || "bg-slate-400"}`} />
                            <span className="text-xs capitalize font-medium">{ip.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{ip.assignedDate || "—"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-actions-ip-${ip.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditIp(ip)} data-testid={`button-edit-ip-${ip.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                              {ip.status === "available" && (
                                <DropdownMenuItem onClick={() => { updateIpMutation.mutate({ id: ip.id, data: { status: "reserved" } }); }} data-testid={`button-reserve-ip-${ip.id}`}><Shield className="h-4 w-4 mr-2" />Reserve</DropdownMenuItem>
                              )}
                              {ip.status === "assigned" && (
                                <DropdownMenuItem onClick={() => { updateIpMutation.mutate({ id: ip.id, data: { status: "available", customerId: undefined } }); }} data-testid={`button-release-ip-${ip.id}`}><Unlock className="h-4 w-4 mr-2" />Release</DropdownMenuItem>
                              )}
                              {ip.status === "reserved" && (
                                <DropdownMenuItem onClick={() => { updateIpMutation.mutate({ id: ip.id, data: { status: "available" } }); }} data-testid={`button-unreserve-ip-${ip.id}`}><Unlock className="h-4 w-4 mr-2" />Unreserve</DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => deleteIpMutation.mutate(ip.id)} className="text-destructive" data-testid={`button-delete-ip-${ip.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                    })}
                  </TableBody>
                </Table>
              </div>
              {filteredIps.length > 0 && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-t flex items-center justify-between">
                  <span>Showing {filteredIps.length} of {allIps.length} IP addresses</span>
                  {pingEnabled && <span className="flex items-center gap-1.5 text-emerald-600"><Activity className="h-3 w-3 animate-pulse" />Auto-ping every 5s</span>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "conflicts" && (
        <div className="space-y-4" data-testid="tab-content-conflicts">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Conflict Detection & Logs</h2>
              <p className="text-sm text-muted-foreground">Smart validation system for duplicate IPs, VLAN conflicts, and subnet issues</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.open("/api/export/ipam-logs", "_blank")} data-testid="button-export-logs">
              <Download className="h-4 w-4 mr-1" />Export Logs
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Duplicate IPs", value: conflicts.filter(c => c.type === "Duplicate IP").length, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
              { label: "VLAN Conflicts", value: conflicts.filter(c => c.type === "VLAN ID Conflict").length, icon: Layers, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
              { label: "IP Conflicts", value: conflicts.filter(c => c.type === "IP Conflict").length, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
              { label: "Exhaustion Alerts", value: conflicts.filter(c => c.type === "IP Exhaustion Alert").length, icon: Activity, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
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

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Active Conflicts & Alerts</CardTitle>
              <CardDescription className="text-xs">Real-time conflict detection across IPs, VLANs, and subnets</CardDescription>
            </CardHeader>
            <CardContent>
              {conflicts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                  <p className="text-sm font-medium">No conflicts detected</p>
                  <p className="text-xs">All IP assignments, VLAN IDs, and subnets are clean</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conflicts.map((c, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${c.severity === "critical" ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800" : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"}`} data-testid={`conflict-${i}`}>
                      {c.severity === "critical" ? <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{c.type}</span>
                          <Badge variant="outline" className={`text-[10px] ${c.severity === "critical" ? "text-red-600 border-red-300" : "text-amber-600 border-amber-300"}`}>{c.severity}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">IPAM Activity Logs</CardTitle>
              <CardDescription className="text-xs">Change history for IP assignments, subnet changes, and VLAN modifications</CardDescription>
            </CardHeader>
            <CardContent>
              {allLogs.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />No activity logs yet
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                        <TableHead className="text-xs font-semibold">Action</TableHead>
                        <TableHead className="text-xs font-semibold">User</TableHead>
                        <TableHead className="text-xs font-semibold">IP Address</TableHead>
                        <TableHead className="text-xs font-semibold">Old Value</TableHead>
                        <TableHead className="text-xs font-semibold">New Value</TableHead>
                        <TableHead className="text-xs font-semibold">Details</TableHead>
                        <TableHead className="text-xs font-semibold">Sync Status</TableHead>
                        <TableHead className="text-xs font-semibold">Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allLogs.slice(0, 100).map(log => (
                        <TableRow key={log.id} data-testid={`row-log-${log.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{log.actionType}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{log.user || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{log.ipAddress || "—"}</TableCell>
                          <TableCell className="text-xs text-red-600">{log.oldValue || "—"}</TableCell>
                          <TableCell className="text-xs text-green-600">{log.newValue || "—"}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">{log.details || "—"}</TableCell>
                          <TableCell>
                            {log.deviceSyncStatus ? (
                              <Badge variant="outline" className={`text-[10px] ${log.deviceSyncStatus === "synced" ? "text-green-600 border-green-300" : "text-amber-600 border-amber-300"}`}>{log.deviceSyncStatus}</Badge>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}</TableCell>
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

      <Dialog open={ipDialogOpen} onOpenChange={setIpDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-ip">{editingIp ? "Edit IP Address" : "Add IP Address"}</DialogTitle>
          </DialogHeader>
          <Form {...ipForm}>
            <form onSubmit={ipForm.handleSubmit(onSubmitIp)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={ipForm.control} name="ipAddress" render={({ field }) => (
                  <FormItem><FormLabel>IP Address</FormLabel><FormControl><Input placeholder="192.168.1.1" className="font-mono" {...field} data-testid="input-ip-address" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={ipForm.control} name="subnet" render={({ field }) => (
                  <FormItem><FormLabel>Subnet</FormLabel><FormControl><Input placeholder="192.168.1.0/24" className="font-mono" {...field} data-testid="input-ip-subnet" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={ipForm.control} name="gateway" render={({ field }) => (
                  <FormItem><FormLabel>Gateway</FormLabel><FormControl><Input placeholder="192.168.1.1" className="font-mono" {...field} data-testid="input-ip-gateway" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={ipForm.control} name="macAddress" render={({ field }) => (
                  <FormItem><FormLabel>MAC Address</FormLabel><FormControl><Input placeholder="AA:BB:CC:DD:EE:FF" className="font-mono" {...field} value={field.value || ""} data-testid="input-ip-mac" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField control={ipForm.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-ip-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="static">Static</SelectItem>
                        <SelectItem value="dynamic">Dynamic</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={ipForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-ip-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={ipForm.control} name="serviceType" render={({ field }) => (
                  <FormItem><FormLabel>Service Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl><SelectTrigger data-testid="select-ip-service"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="pppoe">PPPoE</SelectItem>
                        <SelectItem value="static">Static</SelectItem>
                        <SelectItem value="dhcp">DHCP</SelectItem>
                        <SelectItem value="hotspot">Hotspot</SelectItem>
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={ipForm.control} name="vlan" render={({ field }) => (
                  <FormItem><FormLabel>VLAN</FormLabel><FormControl><Input placeholder="VLAN 100" {...field} data-testid="input-ip-vlan" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={ipForm.control} name="pool" render={({ field }) => (
                  <FormItem><FormLabel>Pool</FormLabel><FormControl><Input placeholder="Pool name" {...field} data-testid="input-ip-pool" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={ipForm.control} name="customerId" render={({ field }) => (
                <FormItem><FormLabel>Assign to Customer</FormLabel>
                  <Select onValueChange={(val) => field.onChange(val ? parseInt(val) : undefined)} value={field.value ? String(field.value) : ""}>
                    <FormControl><SelectTrigger data-testid="select-ip-customer"><SelectValue placeholder="Select customer..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(customers || []).map(c => <SelectItem key={c.id} value={String(c.id)}>{c.fullName}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={ipForm.control} name="linkedDevice" render={({ field }) => (
                  <FormItem><FormLabel>Linked Device</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl><SelectTrigger data-testid="select-ip-device"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        {allDevices.map(d => <SelectItem key={d.id} value={d.name}>{d.name} ({d.ipAddress})</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={ipForm.control} name="assignedDate" render={({ field }) => (
                  <FormItem><FormLabel>Assigned Date</FormLabel><FormControl><Input type="date" {...field} data-testid="input-ip-date" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={ipForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={2} placeholder="Additional notes..." {...field} value={field.value || ""} data-testid="input-ip-notes" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIpDialogOpen(false)} data-testid="button-cancel-ip">Cancel</Button>
                <Button type="submit" disabled={createIpMutation.isPending || updateIpMutation.isPending} className="bg-gradient-to-r from-blue-800 to-cyan-600" data-testid="button-submit-ip">
                  {(createIpMutation.isPending || updateIpMutation.isPending) ? "Saving..." : editingIp ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={subnetDialogOpen} onOpenChange={setSubnetDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-subnet">{editingSubnet ? "Edit Subnet" : "Add Subnet"}</DialogTitle>
          </DialogHeader>
          <Form {...subnetForm}>
            <form onSubmit={subnetForm.handleSubmit(onSubmitSubnet)} className="space-y-3">
              <FormField control={subnetForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Subnet Name</FormLabel><FormControl><Input placeholder="Customer LAN" {...field} data-testid="input-subnet-name" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={subnetForm.control} name="networkAddress" render={({ field }) => (
                  <FormItem><FormLabel>Network Address (CIDR)</FormLabel><FormControl><Input placeholder="192.168.10.0/24" className="font-mono" {...field} data-testid="input-subnet-network" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={subnetForm.control} name="gateway" render={({ field }) => (
                  <FormItem><FormLabel>Gateway IP</FormLabel><FormControl><Input placeholder="Auto-calculated or override" className="font-mono" {...field} data-testid="input-subnet-gateway" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={subnetForm.control} name="dns" render={({ field }) => (
                  <FormItem><FormLabel>DNS</FormLabel><FormControl><Input placeholder="8.8.8.8" className="font-mono" {...field} value={field.value || ""} data-testid="input-subnet-dns" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={subnetForm.control} name="ipType" render={({ field }) => (
                  <FormItem><FormLabel>IP Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-subnet-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="cgnat">CGNAT</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={subnetForm.control} name="pop" render={({ field }) => (
                  <FormItem><FormLabel>POP / Branch</FormLabel><FormControl><Input placeholder="Main POP" {...field} value={field.value || ""} data-testid="input-subnet-pop" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={subnetForm.control} name="associatedDevice" render={({ field }) => (
                  <FormItem><FormLabel>Associated Device</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl><SelectTrigger data-testid="select-subnet-device"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        {allDevices.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={subnetForm.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger data-testid="select-subnet-status"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={subnetForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={2} placeholder="Additional notes..." {...field} value={field.value || ""} data-testid="input-subnet-notes" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSubnetDialogOpen(false)} data-testid="button-cancel-subnet">Cancel</Button>
                <Button type="submit" disabled={createSubnetMutation.isPending || updateSubnetMutation.isPending} className="bg-gradient-to-r from-blue-800 to-cyan-600" data-testid="button-submit-subnet">
                  {(createSubnetMutation.isPending || updateSubnetMutation.isPending) ? "Saving..." : editingSubnet ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={vlanDialogOpen} onOpenChange={setVlanDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title-vlan">{editingVlan ? "Edit VLAN" : "Add VLAN"}</DialogTitle>
          </DialogHeader>
          <Form {...vlanForm}>
            <form onSubmit={vlanForm.handleSubmit(onSubmitVlan)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={vlanForm.control} name="vlanIdNumber" render={({ field }) => (
                  <FormItem><FormLabel>VLAN ID</FormLabel><FormControl><Input type="number" min={1} max={4094} className="font-mono" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} data-testid="input-vlan-id" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={vlanForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>VLAN Name</FormLabel><FormControl><Input placeholder="Internet-Users" {...field} data-testid="input-vlan-name" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={vlanForm.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>VLAN Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-vlan-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="internet">Internet</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                        <SelectItem value="iptv">IPTV</SelectItem>
                        <SelectItem value="voip">VoIP</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="backhaul">Backhaul</SelectItem>
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={vlanForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-vlan-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField control={vlanForm.control} name="pop" render={({ field }) => (
                  <FormItem><FormLabel>POP</FormLabel><FormControl><Input placeholder="Main POP" {...field} value={field.value || ""} data-testid="input-vlan-pop" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={vlanForm.control} name="linkedDevice" render={({ field }) => (
                  <FormItem><FormLabel>Linked Device</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl><SelectTrigger data-testid="select-vlan-device"><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        {allDevices.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={vlanForm.control} name="subnetAssignment" render={({ field }) => (
                <FormItem><FormLabel>Subnet Assignment</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl><SelectTrigger data-testid="select-vlan-subnet"><SelectValue placeholder="Select subnet..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {allSubnets.map(s => <SelectItem key={s.id} value={s.networkAddress}>{s.name} ({s.networkAddress})</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={vlanForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={2} placeholder="VLAN description..." {...field} value={field.value || ""} data-testid="input-vlan-desc" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setVlanDialogOpen(false)} data-testid="button-cancel-vlan">Cancel</Button>
                <Button type="submit" disabled={createVlanMutation.isPending || updateVlanMutation.isPending} className="bg-gradient-to-r from-blue-800 to-cyan-600" data-testid="button-submit-vlan">
                  {(createVlanMutation.isPending || updateVlanMutation.isPending) ? "Saving..." : editingVlan ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
