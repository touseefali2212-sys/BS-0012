import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Server, Plus, Search, Edit, Trash2, Eye, Wifi, WifiOff,
  Cable, Smartphone, MoreHorizontal, Activity, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type OltDevice, type OnuDevice, type GponSplitter } from "@shared/schema";

export default function OltListPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: olts, isLoading } = useQuery<OltDevice[]>({ queryKey: ["/api/olt-devices"] });
  const { data: allOnus } = useQuery<OnuDevice[]>({ queryKey: ["/api/onu-devices"] });
  const { data: allSplitters } = useQuery<GponSplitter[]>({ queryKey: ["/api/gpon-splitters"] });

  const deleteOltMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/olt-devices/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/olt-devices"] }); toast({ title: "OLT deleted" }); },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const createOltMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/olt-devices", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/olt-devices"] });
      setAddDialogOpen(false);
      toast({ title: "OLT device created" });
    },
    onError: (e: Error) => { toast({ title: "Error", description: e.message, variant: "destructive" }); },
  });

  const getOltStats = (oltId: number) => {
    const splitters = (allSplitters || []).filter(s => s.oltId === oltId);
    const splitterIds = new Set(splitters.map(s => s.id));
    const onus = (allOnus || []).filter(o => o.splitterId && splitterIds.has(o.splitterId));
    const online = onus.filter(o => o.status === "online").length;
    return { totalOnus: onus.length, onlineOnus: online, offlineOnus: onus.length - online };
  };

  const filteredOlts = (olts || []).filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return o.name.toLowerCase().includes(q) || o.oltId.toLowerCase().includes(q) || o.ipAddress?.toLowerCase().includes(q) || o.vendor?.toLowerCase().includes(q);
  });

  const totalOnus = (allOnus || []).length;
  const onlineOnus = (allOnus || []).filter(o => o.status === "online").length;
  const activeOlts = (olts || []).filter(o => o.status === "active").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-[#0B1120] to-[#1a4a8a] text-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Server className="h-5 w-5" /> OLT Management</h1>
            <p className="text-xs text-white/60 mt-1">SNMP Monitoring, OLT Integration & ONU/ONT Control</p>
          </div>
          <Button size="sm" onClick={() => setAddDialogOpen(true)} className="bg-white/10 hover:bg-white/20 text-white text-xs border border-white/20" data-testid="button-add-olt">
            <Plus className="h-3 w-3 mr-1" /> Add OLT
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500"><Server className="h-4 w-4 text-white" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total OLTs</p><p className="text-lg font-bold">{(olts || []).length}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500"><Activity className="h-4 w-4 text-white" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Active OLTs</p><p className="text-lg font-bold">{activeOlts}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-violet-500"><Smartphone className="h-4 w-4 text-white" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total ONUs</p><p className="text-lg font-bold">{totalOnus}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-teal-500"><Wifi className="h-4 w-4 text-white" /></div>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">ONUs Online</p><p className="text-lg font-bold">{onlineOnus}</p></div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, IP, vendor..." className="pl-8 h-9 text-xs" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} data-testid="input-search-olt" />
          </div>
        </div>

        <div className="bg-card border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-[#0B1120] to-[#2563EB]">
                <TableHead className="text-white text-xs">OLT ID</TableHead>
                <TableHead className="text-white text-xs">Name</TableHead>
                <TableHead className="text-white text-xs">IP Address</TableHead>
                <TableHead className="text-white text-xs">Vendor / Model</TableHead>
                <TableHead className="text-white text-xs">PON Ports</TableHead>
                <TableHead className="text-white text-xs">ONUs</TableHead>
                <TableHead className="text-white text-xs">Status</TableHead>
                <TableHead className="text-white text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">Loading OLT devices...</TableCell></TableRow>
              ) : filteredOlts.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">{searchQuery ? "No OLTs match your search" : "No OLT devices configured"}</TableCell></TableRow>
              ) : (
                filteredOlts.map(olt => {
                  const stats = getOltStats(olt.id);
                  return (
                    <TableRow key={olt.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setLocation(`/olt-management/${olt.id}`)} data-testid={`row-olt-${olt.id}`}>
                      <TableCell className="text-xs font-mono font-semibold">{olt.oltId}</TableCell>
                      <TableCell className="text-xs font-medium">{olt.name}</TableCell>
                      <TableCell className="text-xs font-mono">{olt.ipAddress || "-"}</TableCell>
                      <TableCell className="text-xs">{olt.vendor} {olt.model || ""}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{olt.usedPonPorts || 0}/{olt.totalPonPorts || 16}</span>
                          <Progress value={((olt.usedPonPorts || 0) / (olt.totalPonPorts || 16)) * 100} className="h-1.5 w-12" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-emerald-600 font-medium">{stats.onlineOnus}</span>
                          <span className="text-muted-foreground">/</span>
                          <span>{stats.totalOnus}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] capitalize ${olt.status === "active" ? "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950" : "text-red-700 bg-red-50"}`}>
                          {olt.status}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-olt-actions-${olt.id}`}>
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => setLocation(`/olt-management/${olt.id}`)}>
                              <Eye className="h-3.5 w-3.5 mr-2" /> Manage
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteOltMutation.mutate(olt.id)}>
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> Add OLT Device</DialogTitle>
          </DialogHeader>
          <AddOltForm onSave={(data) => createOltMutation.mutate(data)} isPending={createOltMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddOltForm({ onSave, isPending }: { onSave: (data: any) => void; isPending: boolean }) {
  const [name, setName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [vendor, setVendor] = useState("Huawei");
  const [model, setModel] = useState("");
  const [totalPonPorts, setTotalPonPorts] = useState("16");
  const [lat, setLat] = useState("0");
  const [lng, setLng] = useState("0");
  const [notes, setNotes] = useState("");
  const [snmpVersion, setSnmpVersion] = useState("v2c");
  const [snmpCommunity, setSnmpCommunity] = useState("public");
  const [snmpPort, setSnmpPort] = useState("161");
  const [snmpTimeout, setSnmpTimeout] = useState("5");
  const [snmpRetries, setSnmpRetries] = useState("3");
  const [snmpPollingInterval, setSnmpPollingInterval] = useState("30");

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Device Information</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="OLT name" className="h-9 text-sm" data-testid="input-add-olt-name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">IP Address</label>
            <Input value={ipAddress} onChange={e => setIpAddress(e.target.value)} placeholder="192.168.1.1" className="h-9 text-sm" data-testid="input-add-olt-ip" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Vendor</label>
            <Select value={vendor} onValueChange={setVendor}>
              <SelectTrigger className="h-9 text-sm" data-testid="select-add-olt-vendor"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Huawei", "ZTE", "FiberHome", "Nokia", "VSOL", "HSGQ", "Other"].map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Model</label>
            <Input value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. MA5800-X15" className="h-9 text-sm" data-testid="input-add-olt-model" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Total PON Ports</label>
            <Input type="number" value={totalPonPorts} onChange={e => setTotalPonPorts(e.target.value)} className="h-9 text-sm" data-testid="input-add-olt-ports" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Latitude</label>
            <Input value={lat} onChange={e => setLat(e.target.value)} placeholder="0" className="h-9 text-sm" data-testid="input-add-olt-lat" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Longitude</label>
            <Input value={lng} onChange={e => setLng(e.target.value)} placeholder="0" className="h-9 text-sm" data-testid="input-add-olt-lng" />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">SNMP Configuration</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">SNMP Version</label>
            <Select value={snmpVersion} onValueChange={setSnmpVersion}>
              <SelectTrigger className="h-9 text-sm" data-testid="select-add-olt-snmp-version"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="v1">v1</SelectItem>
                <SelectItem value="v2c">v2c</SelectItem>
                <SelectItem value="v3">v3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Community String</label>
            <Input value={snmpCommunity} onChange={e => setSnmpCommunity(e.target.value)} placeholder="public" className="h-9 text-sm" data-testid="input-add-olt-snmp-community" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">SNMP Port</label>
            <Input type="number" value={snmpPort} onChange={e => setSnmpPort(e.target.value)} className="h-9 text-sm" data-testid="input-add-olt-snmp-port" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Timeout (seconds)</label>
            <Input type="number" value={snmpTimeout} onChange={e => setSnmpTimeout(e.target.value)} className="h-9 text-sm" data-testid="input-add-olt-snmp-timeout" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Retries</label>
            <Input type="number" value={snmpRetries} onChange={e => setSnmpRetries(e.target.value)} className="h-9 text-sm" data-testid="input-add-olt-snmp-retries" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Polling Interval (seconds)</label>
            <Input type="number" value={snmpPollingInterval} onChange={e => setSnmpPollingInterval(e.target.value)} className="h-9 text-sm" data-testid="input-add-olt-snmp-polling" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Notes</label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="text-sm min-h-[60px]" data-testid="textarea-add-olt-notes" />
      </div>
      <DialogFooter>
        <Button onClick={() => onSave({
          oltId: `OLT-${Date.now().toString(36).toUpperCase()}`, name, ipAddress, vendor, model,
          totalPonPorts: parseInt(totalPonPorts) || 16, lat, lng, notes,
          snmpVersion, snmpCommunity, snmpPort: parseInt(snmpPort) || 161,
          snmpTimeout: parseInt(snmpTimeout) || 5, snmpRetries: parseInt(snmpRetries) || 3,
          snmpPollingInterval: parseInt(snmpPollingInterval) || 30, snmpStatus: "active",
        })} disabled={isPending || !name.trim()} data-testid="button-save-olt">
          {isPending ? "Creating..." : "Create OLT"}
        </Button>
      </DialogFooter>
    </div>
  );
}
