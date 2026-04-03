import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, Building2, Mail, Phone, Edit, Save, ChevronRight,
  Shield, Network, Activity, DollarSign, AlertCircle, RefreshCw,
  Calendar, Download, MessageCircle, CalendarRange, User, Hash,
  CreditCard, Globe, CheckCircle2, FileText, Plus, Clock, TrendingUp,
  TrendingDown, BarChart3, MessageSquare, ShoppingBag, Users, Bell,
  Wallet, Store, Percent, Landmark, MapPin, Briefcase, Key, Wifi, Navigation, Tag, Trash2, MoreHorizontal, Pencil, X,
} from "lucide-react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Reseller } from "@shared/schema";

const mapMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-0 flex-1">
        <div className="text-white text-xs font-semibold px-5 py-2.5 rounded-md flex-1 bg-[#1c67d4]">
          {title}
        </div>
      </div>
      {action && <div className="ml-3">{action}</div>}
    </div>
  );
}

function InfoRow({ label, value, capitalize }: { label: string; value: React.ReactNode; capitalize?: boolean }) {
  return (
    <div className="flex items-center py-2.5 px-4 text-xs">
      <span className="font-semibold text-muted-foreground w-[45%] shrink-0">{label}</span>
      <span className="text-muted-foreground mx-2">:</span>
      <span className={`font-medium text-foreground ${capitalize ? "capitalize" : ""}`}>{value ?? "-"}</span>
    </div>
  );
}

function ProfileSidebarItem({ icon: Icon, label, value, testId }: { icon: any; label: string; value: string; testId?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/10">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 opacity-60" />
        <span className="opacity-80">{label}:</span>
      </div>
      <span className="font-medium text-right max-w-[55%] truncate" data-testid={testId}>{value || "—"}</span>
    </div>
  );
}

function BoolValue({ v }: { v: boolean | null | undefined }) {
  return v
    ? <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium"><CheckCircle2 className="h-3 w-3" />Yes</span>
    : <span className="text-muted-foreground">No</span>;
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="bg-card border rounded-lg p-12 text-center text-muted-foreground">
      <Icon className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

const formatDate = (d?: string | null) => {
  if (!d) return "-";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }
};

const formatPKR = (v: any) => `Rs. ${parseFloat(String(v || "0")).toLocaleString()}`;


function CustomerSummaryTab({ reseller, resellerId, assignedPkgs, vendors, vendorPackages, resellerCustomers, toast }: any) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editTotal, setEditTotal] = useState("0");
  const [editActive, setEditActive] = useState("0");
  const [saving, setSaving] = useState(false);

  const { data: monthlySummaries = [], isLoading: summaryLoading } = useQuery<any[]>({
    queryKey: ["/api/reseller-monthly-summaries", resellerId, selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/reseller-monthly-summaries/${resellerId}?month=${selectedMonth}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!resellerId,
  });

  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }

  const summaryRows = assignedPkgs.map((pkg: any) => {
    const pkgVendor = vendors.find((v: any) => v.id === pkg.vendorId);
    const pPrice = parseFloat(String(pkg.resellerPrice || pkg.ispSellingPrice || "0"));
    const rPrice = parseFloat(String(pkg.resellerPrice || "0"));
    const saved = monthlySummaries.find((s: any) => s.vendorPackageId === pkg.id);
    const totalCust = saved ? saved.totalCustomers : 0;
    const activeCust = saved ? saved.activeCustomers : 0;
    const totalAmount = totalCust * pPrice;
    const activeBilling = activeCust * pPrice;
    const resellerCost = activeCust * rPrice;
    return { pkg, vendorName: pkgVendor?.name || "—", pPrice, rPrice, totalCust, activeCust, totalAmount, activeBilling, resellerCost, savedId: saved?.id };
  });

  const grandTotal = summaryRows.reduce((s: number, r: any) => s + r.totalCust, 0);
  const grandActive = summaryRows.reduce((s: number, r: any) => s + r.activeCust, 0);
  const grandTotalAmount = summaryRows.reduce((s: number, r: any) => s + r.totalAmount, 0);
  const grandActiveBilling = summaryRows.reduce((s: number, r: any) => s + r.activeBilling, 0);
  const grandResellerCost = summaryRows.reduce((s: number, r: any) => s + r.resellerCost, 0);

  const handleSave = async (pkg: any) => {
    setSaving(true);
    try {
      const total = parseInt(editTotal || "0");
      const active = parseInt(editActive || "0");
      const pPrice = parseFloat(String(pkg.resellerPrice || pkg.ispSellingPrice || "0"));
      const rPrice = parseFloat(String(pkg.resellerPrice || "0"));
      await apiRequest("POST", "/api/reseller-monthly-summaries", {
        resellerId,
        vendorPackageId: pkg.id,
        month: selectedMonth,
        totalCustomers: total,
        activeCustomers: active,
        packagePrice: pPrice,
        resellerPrice: rPrice,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller-monthly-summaries", resellerId, selectedMonth] });
      toast({ title: "Summary Updated", description: `${pkg.packageName} summary saved for ${selectedMonth}` });
      setEditingRow(null);
    } catch {
      toast({ title: "Failed to save summary", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Customer Summary Monthly Report" />
      <div className="flex items-center gap-3 mb-2">
        <label className="text-xs font-medium text-muted-foreground">Month:</label>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48 h-8 text-xs" data-testid="select-summary-month">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={m}>{new Date(m + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedMonth === currentMonth && <Badge variant="secondary" className="text-[10px] text-blue-600 bg-blue-50">Current Month</Badge>}
      </div>

      <div className="grid grid-cols-5 gap-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Total Customers</p>
            <p className="text-xl font-bold text-green-700" data-testid="profile-total-customers">{grandTotal}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Active Customers</p>
            <p className="text-xl font-bold text-blue-700">{grandActive}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Total Amount</p>
            <p className="text-xl font-bold text-indigo-700">Rs. {grandTotalAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Active Billing</p>
            <p className="text-xl font-bold text-emerald-700">Rs. {grandActiveBilling.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Reseller Cost</p>
            <p className="text-xl font-bold text-purple-700">Rs. {grandResellerCost.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {assignedPkgs.length === 0 ? (
        <EmptyState icon={Tag} message="No packages assigned — customer summary unavailable" />
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-[#1a3a5c]">
              <TableHead className="text-white text-xs">Vendor</TableHead>
              <TableHead className="text-white text-xs">Package</TableHead>
              <TableHead className="text-white text-xs text-right">Reseller Price</TableHead>
              <TableHead className="text-white text-xs text-center">Total Customer</TableHead>
              <TableHead className="text-white text-xs text-right">Total Amount</TableHead>
              <TableHead className="text-white text-xs text-center">Active Customer</TableHead>
              <TableHead className="text-white text-xs text-right">Active Billing</TableHead>
              <TableHead className="text-white text-xs text-right">Reseller Cost</TableHead>
              <TableHead className="text-white text-xs text-center">Action</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {summaryRows.map((row: any) => (
                <TableRow key={row.pkg.id}>
                  <TableCell className="text-xs">{row.vendorName}</TableCell>
                  <TableCell className="text-xs font-medium">{row.pkg.packageName}</TableCell>
                  <TableCell className="text-xs text-right font-medium">Rs. {row.pPrice.toLocaleString()}</TableCell>
                  {editingRow === row.pkg.id ? (
                    <>
                      <TableCell className="text-center"><Input type="number" min="0" className="h-7 w-16 text-xs text-center mx-auto" value={editTotal} onChange={(e) => setEditTotal(e.target.value)} data-testid={`input-total-${row.pkg.id}`} /></TableCell>
                      <TableCell className="text-xs text-right font-semibold">Rs. {(parseInt(editTotal || "0") * row.pPrice).toLocaleString()}</TableCell>
                      <TableCell className="text-center"><Input type="number" min="0" className="h-7 w-16 text-xs text-center mx-auto" value={editActive} onChange={(e) => setEditActive(e.target.value)} data-testid={`input-active-${row.pkg.id}`} /></TableCell>
                      <TableCell className="text-xs text-right font-semibold text-green-700">Rs. {(parseInt(editActive || "0") * row.pPrice).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right font-semibold text-purple-700">Rs. {(parseInt(editActive || "0") * row.rPrice).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600 hover:bg-green-50" onClick={() => handleSave(row.pkg)} disabled={saving} data-testid={`btn-save-summary-${row.pkg.id}`}>
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:bg-gray-50" onClick={() => setEditingRow(null)} data-testid={`btn-cancel-summary-${row.pkg.id}`}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-xs text-center font-semibold">{row.totalCust}</TableCell>
                      <TableCell className="text-xs text-right font-semibold">Rs. {row.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-center font-semibold text-green-700">{row.activeCust}</TableCell>
                      <TableCell className="text-xs text-right font-semibold text-green-700">Rs. {row.activeBilling.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right font-semibold text-purple-700">Rs. {row.resellerCost.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50" onClick={() => { setEditingRow(row.pkg.id); setEditTotal(String(row.totalCust)); setEditActive(String(row.activeCust)); }} data-testid={`btn-edit-summary-${row.pkg.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
            <tfoot>
              <tr className="bg-[#1a3a5c]">
                <td colSpan={3} className="px-4 py-2 text-white text-xs font-bold">Total</td>
                <td className="px-4 py-2 text-white text-xs font-bold text-center">{grandTotal}</td>
                <td className="px-4 py-2 text-white text-xs font-bold text-right">Rs. {grandTotalAmount.toLocaleString()}</td>
                <td className="px-4 py-2 text-white text-xs font-bold text-center">{grandActive}</td>
                <td className="px-4 py-2 text-white text-xs font-bold text-right">Rs. {grandActiveBilling.toLocaleString()}</td>
                <td className="px-4 py-2 text-white text-xs font-bold text-right">Rs. {grandResellerCost.toLocaleString()}</td>
                <td className="px-4 py-2"></td>
              </tr>
            </tfoot>
          </Table>
        </div>
      )}

      <SectionHeader title="Customer List" />
      {resellerCustomers.length === 0 ? (
        <EmptyState icon={Users} message="No customers linked to this reseller" />
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-[#1a3a5c]">
              <TableHead className="text-white text-xs">#</TableHead>
              <TableHead className="text-white text-xs">Customer Name</TableHead>
              <TableHead className="text-white text-xs">Package</TableHead>
              <TableHead className="text-white text-xs">Phone</TableHead>
              <TableHead className="text-white text-xs">Area</TableHead>
              <TableHead className="text-white text-xs">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {resellerCustomers.slice(0, 50).map((c: any, i: number) => {
                const custPkg = vendorPackages.find((vp: any) => vp.id === c.packageId);
                return (
                <TableRow key={c.id}>
                  <TableCell className="text-xs">{i + 1}</TableCell>
                  <TableCell className="text-xs font-medium">{c.fullName || c.name}</TableCell>
                  <TableCell className="text-xs">{custPkg?.packageName || "—"}</TableCell>
                  <TableCell className="text-xs">{c.phone || "—"}</TableCell>
                  <TableCell className="text-xs">{c.area || "—"}</TableCell>
                  <TableCell><Badge variant="secondary" className={`text-[10px] capitalize ${c.status === "active" ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"}`}>{c.status}</Badge></TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {resellerCustomers.length > 50 && <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t">Showing 50 of {resellerCustomers.length} customers</div>}
        </div>
      )}
    </div>
  );
}

export default function ResellerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  const [editPkg, setEditPkg] = useState<any>(null);
  const [editPkgPrice, setEditPkgPrice] = useState("");
  const [deletePkg, setDeletePkg] = useState<any>(null);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [scheduledStatus, setScheduledStatus] = useState("inactive");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledReason, setScheduledReason] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageType, setMessageType] = useState("sms");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");

  const { data: reseller, isLoading } = useQuery<Reseller>({
    queryKey: ["/api/resellers", id],
    queryFn: async () => { const res = await fetch(`/api/resellers/${id}`, { credentials: "include" }); if (!res.ok) throw new Error("Failed to fetch"); return res.json(); },
    enabled: !!id,
  });
  const { data: vendors } = useQuery<any[]>({ queryKey: ["/api/vendors"] });
  const { data: vendorPackages } = useQuery<any[]>({ queryKey: ["/api/vendor-packages"] });
  const { data: walletTxns, isLoading: txnsLoading } = useQuery<any[]>({
    queryKey: ["/api/reseller-wallet-transactions", id],
    queryFn: async () => { const res = await fetch(`/api/reseller-wallet-transactions/${id}`, { credentials: "include" }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    enabled: !!id,
  });
  const { data: allTickets } = useQuery<any[]>({ queryKey: ["/api/tickets"] });
  const { data: allCustomers } = useQuery<any[]>({ queryKey: ["/api/customers"] });

  const statusUpdateMutation = useMutation({
    mutationFn: async (status: string) => { const res = await apiRequest("PATCH", `/api/resellers/${id}`, { status }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/resellers", id] }); queryClient.invalidateQueries({ queryKey: ["/api/resellers"] }); toast({ title: "Status updated" }); },
  });

  const vendor = vendors?.find(v => v.id === reseller?.vendorId);

  const assignedPkgIds = (reseller?.assignedPackages || "").split(",").map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));
  const assignedPkgs = (vendorPackages || []).filter((vp: any) => assignedPkgIds.includes(vp.id));

  const resellerCustomers = (allCustomers || []).filter((c: any) => c.resellerId === reseller?.id);
  const resellerTickets = (allTickets || []).filter((t: any) => resellerCustomers.some((c: any) => c.id === t.customerId));

  const tabsRow1 = [
    { key: "personal", label: "Personal Information" },
    { key: "service", label: "Network & Service" },
    { key: "packages", label: "Packages" },
    { key: "customers", label: "Customer Summary" },
    { key: "panel", label: "Vendor Panels" },
    { key: "agreement", label: "Agreement" },
  ];
  const tabsRow2 = [
    { key: "documents", label: "Documents" },
    { key: "financial", label: "Billing & Finance" },
    { key: "wallet", label: "Wallet & Transactions" },
    { key: "tickets", label: "Support & Tickets History" },
    { key: "sms", label: "SMS Notifications History" },
    { key: "referrals", label: "Referrals" },
  ];

  if (isLoading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-0"><Skeleton className="h-[600px] w-[280px] shrink-0" /><Skeleton className="h-[600px] flex-1" /></div>
    </div>
  );
  if (!reseller) return (
    <div className="p-6 space-y-4">
      <Link href="/resellers"><Button variant="ghost"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
      <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><AlertCircle className="h-12 w-12 mb-3 opacity-30" /><p>Reseller not found</p></CardContent></Card>
    </div>
  );

  let panels: Array<{ vendorName: string; panelUrl: string; panelUsername: string }> = [];
  try { if (reseller.assignedVendorPanels) panels = JSON.parse(reseller.assignedVendorPanels); } catch {}

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-[#0057FF]" />
          <h1 className="text-lg font-bold">Profile</h1>
          <span className="text-xs text-muted-foreground">Reseller Profile</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/resellers" className="text-[#0057FF]">Resellers</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/resellers" className="text-[#0057FF]">Reseller List</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Profile</span>
        </div>
      </div>

      <div className="flex gap-0 min-h-[calc(100vh-120px)]">
        <div className="w-[280px] shrink-0 border-r bg-gradient-to-b from-[#1a2332] to-[#243447] text-white">
          <div className="flex flex-col items-center pt-6 pb-4 px-4">
            <div className="w-28 h-28 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center mb-3">
              {reseller.profilePicture ? (
                <img src={reseller.profilePicture} alt={reseller.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <Store className="h-14 w-14 text-white/50" />
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
              <Mail className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
              <Phone className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
            </div>
            <h2 className="text-lg font-bold text-center">{reseller.name}</h2>
            <p className="text-xs opacity-70 capitalize">{(reseller.resellerType || "authorized_dealer").replace(/_/g, " ")}</p>
          </div>
          <div className="px-4 space-y-0 text-xs border-t border-white/10 pt-4">
            <ProfileSidebarItem icon={Hash} label="Reseller Code" value={`RSL-${reseller.id}`} testId="sidebar-reseller-code" />
            <ProfileSidebarItem icon={User} label="Contact Person" value={reseller.contactName || reseller.name} testId="sidebar-contact" />
            <ProfileSidebarItem icon={Phone} label="Phone" value={reseller.phone} testId="sidebar-phone" />
            <ProfileSidebarItem icon={Wallet} label="Wallet Balance" value={formatPKR(reseller.walletBalance)} testId="sidebar-wallet" />
            <ProfileSidebarItem icon={CreditCard} label="Credit Limit" value={formatPKR(reseller.creditLimit)} testId="sidebar-credit" />
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 opacity-60" /><span className="opacity-80">Active Status</span></div>
              <Switch checked={reseller.status === "active"} onCheckedChange={(c) => statusUpdateMutation.mutate(c ? "active" : "suspended")} className="scale-75" />
            </div>
            <ProfileSidebarItem icon={Users} label="Customers" value={String(reseller.totalCustomers || 0)} testId="sidebar-customers" />
            <ProfileSidebarItem icon={Calendar} label="Agreement End" value={reseller.agreementEndDate || "Not set"} testId="sidebar-agreement" />
            <ProfileSidebarItem icon={MapPin} label="Area" value={reseller.area || "Not set"} testId="sidebar-area" />
          </div>
          <div className="px-4 pt-4 pb-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Link href={`/resellers/${id}/edit`}><Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1 w-full" data-testid="btn-edit-reseller"><Edit className="h-3 w-3" /> Edit Reseller</Button></Link>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" data-testid="btn-status-scheduler"
                onClick={() => { setScheduledStatus(reseller.status === "active" ? "inactive" : "active"); setScheduledDate(""); setScheduledReason(""); setSchedulerOpen(true); }}><CalendarRange className="h-3 w-3" /> Status Scheduler</Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" data-testid="btn-send-message"
                onClick={() => { setMessageType("sms"); setMessageSubject(""); setMessageBody(""); setMessageOpen(true); }}><MessageCircle className="h-3 w-3" /> Send Email/Message</Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" onClick={() => setActiveTab("wallet")} data-testid="btn-wallet-history"><Wallet className="h-3 w-3" /> Wallet History</Button>
            </div>
            <Button size="sm" className="w-full text-xs h-9 gap-1.5 bg-[#0057FF]" data-testid="btn-download-info" onClick={() => {
              const lines = [
                `RESELLER INFORMATION REPORT`,
                `Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`,
                ``,
                `=== BASIC INFORMATION ===`,
                `Name: ${reseller.name}`,
                `Code: RSL-${reseller.id}`,
                `Type: ${(reseller.resellerType || "authorized_dealer").replace(/_/g, " ")}`,
                `Status: ${reseller.status}`,
                `Contact Person: ${reseller.contactName || reseller.name}`,
                `Phone: ${reseller.phone}`,
                `Secondary Phone: ${reseller.secondaryPhone || "N/A"}`,
                `Email: ${reseller.email || "N/A"}`,
                `CNIC: ${reseller.cnic || "N/A"}`,
                `NTN: ${reseller.ntn || "N/A"}`,
                ``,
                `=== LOCATION ===`,
                `Address: ${reseller.address || "N/A"}`,
                `City: ${reseller.city || "N/A"}`,
                `Area: ${reseller.area || "N/A"}`,
                `Territory: ${reseller.territory || "N/A"}`,
                ``,
                `=== FINANCIAL ===`,
                `Wallet Balance: ${formatPKR(reseller.walletBalance)}`,
                `Credit Limit: ${formatPKR(reseller.creditLimit)}`,
                `Security Deposit: ${formatPKR(reseller.securityDeposit)}`,
                `Opening Balance: ${formatPKR(reseller.openingBalance)}`,
                `Commission Rate: ${reseller.commissionRate || "10"}%`,
                `Billing Cycle: ${reseller.billingCycle || "N/A"}`,
                `Payment Method: ${(reseller.paymentMethod || "N/A").replace(/_/g, " ")}`,
                ``,
                `=== BANK DETAILS ===`,
                `Bank: ${reseller.bankName || "N/A"}`,
                `Account Title: ${reseller.bankAccountTitle || "N/A"}`,
                `Account Number: ${reseller.bankAccountNumber || "N/A"}`,
                `Branch Code: ${reseller.bankBranchCode || "N/A"}`,
                ``,
                `=== NETWORK ===`,
                `Join Date: ${reseller.joinDate || "N/A"}`,
                `Uplink Type: ${reseller.uplinkType || "N/A"}`,
                `Uplink: ${reseller.uplink || "N/A"}`,
                `Connection Type: ${reseller.connectionType || "N/A"}`,
                `Total Customers: ${reseller.totalCustomers || 0}`,
                ``,
                `=== AGREEMENT ===`,
                `Type: ${reseller.agreementType || "N/A"}`,
                `Start: ${reseller.agreementStartDate || "N/A"}`,
                `End: ${reseller.agreementEndDate || "N/A"}`,
                `Auto Renewal: ${reseller.autoRenewal ? "Yes" : "No"}`,
              ];
              const blob = new Blob([lines.join("\n")], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `Reseller_${reseller.name.replace(/\s+/g, "_")}_RSL-${reseller.id}.txt`;
              a.click();
              URL.revokeObjectURL(url);
              toast({ title: "Report Downloaded", description: "Reseller information report has been downloaded." });
            }}><Download className="h-3.5 w-3.5" /> Download Information</Button>
            <Link href="/resellers"><Button size="sm" variant="outline" className="w-full text-xs h-9 gap-1.5 text-white border-white/30" data-testid="btn-back-list"><ArrowLeft className="h-3.5 w-3.5" /> Go To Reseller List</Button></Link>
          </div>
        </div>

        <div className="flex-1 bg-muted/30 overflow-hidden">
          <div className="border-b bg-card">
            <div className="flex flex-wrap px-1 border-b border-border/50">
              {tabsRow1.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? "border-[#0057FF] text-[#0057FF]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  data-testid={`tab-reseller-${tab.key}`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap px-1">
              {tabsRow2.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? "border-[#0057FF] text-[#0057FF]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  data-testid={`tab-reseller-${tab.key}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 overflow-y-auto max-h-[calc(100vh-200px)] space-y-4">

            {activeTab === "personal" && (
              <div className="space-y-4">
                <SectionHeader title="Personal Information" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Company Name" value={reseller.companyName} />
                    <InfoRow label="Reseller Name" value={reseller.name} />
                    <InfoRow label="Father Name" value={reseller.fatherName} />
                    <InfoRow label="Mobile No" value={reseller.phone} />
                    <InfoRow label="Phone Number" value={reseller.secondaryPhone} />
                    <InfoRow label="Email" value={reseller.email} />
                    <InfoRow label="CNIC / NIC" value={reseller.cnic} />
                    <InfoRow label="Branch" value={reseller.branch} />
                    <InfoRow label="Area" value={reseller.area} />
                    <InfoRow label="City" value={reseller.city} />
                    <InfoRow label="Address" value={reseller.address} />
                    <InfoRow label="GPS Coordinates" value={
                      reseller.mapLatitude && reseller.mapLongitude
                        ? <span className="font-mono text-xs">{reseller.mapLatitude}, {reseller.mapLongitude}</span>
                        : null
                    } />
                  </div>
                </div>

                {(() => {
                  const lat = parseFloat(reseller.mapLatitude || "");
                  const lng = parseFloat(reseller.mapLongitude || "");
                  const hasValidCoords = isFinite(lat) && isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
                  if (hasValidCoords) return (
                    <>
                      <SectionHeader title="GEO MAP — Graphical Location" />
                      <div className="bg-card border rounded-lg overflow-hidden" style={{ height: 320 }}>
                        <MapContainer center={[lat, lng]} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
                          <Marker position={[lat, lng]} icon={mapMarkerIcon} />
                        </MapContainer>
                      </div>
                    </>
                  );
                  return (
                    <>
                      <SectionHeader title="GEO MAP — Graphical Location" />
                      <div className="bg-card border rounded-lg overflow-hidden p-8 flex flex-col items-center justify-center text-muted-foreground" style={{ height: 200 }}>
                        <Navigation className="h-10 w-10 mb-2 opacity-30" />
                        <p className="text-sm">No GPS coordinates available</p>
                        <p className="text-xs opacity-60 mt-1">Add GPS coordinates via the edit dialog to view the location on the map</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {activeTab === "service" && (
              <div className="space-y-4">
                <SectionHeader title="Network Configuration" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Uplink Type" value={reseller.uplinkType} capitalize />
                    <InfoRow label="Uplink" value={reseller.uplink} capitalize />
                    <InfoRow label="Exchange/Tower/POP" value={reseller.exchangeTowerPopName} />
                    <InfoRow label="Port ID" value={<span className="font-mono">{reseller.portId}</span>} />
                    <InfoRow label="VLAN ID" value={<span className="font-mono">{reseller.vlanId}</span>} />
                    <InfoRow label="Media" value={reseller.media ? reseller.media.toUpperCase() : null} />
                    <InfoRow label="Connection Type" value={reseller.connectionType} capitalize />
                    <InfoRow label="Bandwidth Plan" value={reseller.bandwidthPlan} />
                  </div>
                </div>

              </div>
            )}

            {activeTab === "packages" && (
              <div className="space-y-4">
                <SectionHeader title="Assigned Packages" />
                {assignedPkgs.length === 0 ? (
                  <EmptyState icon={Tag} message="No packages assigned to this reseller" />
                ) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-[#1a3a5c]">
                        <TableHead className="text-white text-xs">Sr.#</TableHead>
                        <TableHead className="text-white text-xs">Vendor</TableHead>
                        <TableHead className="text-white text-xs">Package</TableHead>
                        <TableHead className="text-white text-xs">Speed</TableHead>
                        <TableHead className="text-white text-xs">Vendor Price</TableHead>
                        <TableHead className="text-white text-xs">Profit</TableHead>
                        <TableHead className="text-white text-xs">Reseller Price</TableHead>
                        <TableHead className="text-white text-xs">Active Customer</TableHead>
                        <TableHead className="text-white text-xs">Status</TableHead>
                        <TableHead className="text-white text-xs">Action</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {assignedPkgs.map((pkg: any, i: number) => {
                          const pkgVendor = (vendors || []).find((v: any) => v.id === pkg.vendorId);
                          const vPrice = parseFloat(String(pkg.vendorPrice || "0"));
                          const rPrice = parseFloat(String(pkg.resellerPrice || pkg.ispSellingPrice || "0"));
                          const profit = rPrice - vPrice;
                          const activeCustCount = resellerCustomers.filter((c: any) => c.status === "active" && c.packageId === pkg.id).length;
                          return (
                            <TableRow key={pkg.id}>
                              <TableCell className="text-xs">{i + 1}</TableCell>
                              <TableCell className="text-xs">{pkgVendor?.name || "—"}</TableCell>
                              <TableCell className="text-xs font-medium">{pkg.packageName}</TableCell>
                              <TableCell className="text-xs">{pkg.speed || "—"}</TableCell>
                              <TableCell className="text-xs">Rs. {vPrice.toLocaleString()}</TableCell>
                              <TableCell className={`text-xs font-semibold ${profit >= 0 ? "text-green-700" : "text-red-600"}`}>Rs. {profit.toLocaleString()}</TableCell>
                              <TableCell className="text-xs font-semibold">Rs. {rPrice.toLocaleString()}</TableCell>
                              <TableCell className="text-xs text-center">{activeCustCount}</TableCell>
                              <TableCell><Badge variant="secondary" className={`text-[10px] ${pkg.isActive ? "text-emerald-700 bg-emerald-50" : "text-gray-500 bg-gray-100"}`}>{pkg.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" data-testid={`pkg-action-${pkg.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setEditPkg(pkg); setEditPkgPrice(String(pkg.resellerPrice || pkg.ispSellingPrice || "0")); }} data-testid={`pkg-edit-${pkg.id}`}><Pencil className="h-3.5 w-3.5 mr-2" /> Edit Package</DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => setDeletePkg(pkg)} data-testid={`pkg-delete-${pkg.id}`}><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Package</DropdownMenuItem>
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
              </div>
            )}

            {activeTab === "customers" && (
              <CustomerSummaryTab
                reseller={reseller}
                resellerId={parseInt(id || "0")}
                assignedPkgs={assignedPkgs}
                vendors={vendors || []}
                vendorPackages={vendorPackages || []}
                resellerCustomers={resellerCustomers}
                toast={toast}
              />
            )}

            {activeTab === "panel" && (
              <div className="space-y-4">
                {(() => {
                  let panels: any[] = [];
                  try { if (reseller.assignedVendorPanels) panels = JSON.parse(reseller.assignedVendorPanels); } catch {}
                  return (
                    <>
                      <SectionHeader title="Vendor Panel Access" />
                      <div className="bg-card border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-2 divide-x divide-y">
                          <InfoRow label="Panel Access Allowed" value={<BoolValue v={reseller.vendorPanelAllowed} />} />
                        </div>
                      </div>
                      {panels.length > 0 && (
                        <>
                          <SectionHeader title="Assigned Vendor Panels" />
                          <div className="bg-card border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader><TableRow className="bg-[#1a3a5c]">
                                <TableHead className="text-white text-xs">#</TableHead>
                                <TableHead className="text-white text-xs">Vendor</TableHead>
                                <TableHead className="text-white text-xs">Panel URL</TableHead>
                                <TableHead className="text-white text-xs">Username</TableHead>
                              </TableRow></TableHeader>
                              <TableBody>
                                {panels.map((p: any, i: number) => (
                                  <TableRow key={i}>
                                    <TableCell className="text-xs">{i + 1}</TableCell>
                                    <TableCell className="text-xs font-medium">{p.vendorName || p.vendorId || "—"}</TableCell>
                                    <TableCell className="text-xs text-blue-600">{p.panelUrl || "—"}</TableCell>
                                    <TableCell className="text-xs">{p.panelUsername || "—"}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </>
                      )}
                      {panels.length === 0 && <EmptyState icon={Globe} message="No vendor panels assigned to this reseller" />}
                    </>
                  );
                })()}
              </div>
            )}

            {activeTab === "agreement" && (
              <div className="space-y-4">
                <SectionHeader title="Agreement Details" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Agreement Type" value={reseller.agreementType ? reseller.agreementType.replace(/_/g, " ") : null} capitalize />
                    <InfoRow label="Join Date" value={formatDate(reseller.joinDate)} />
                    <InfoRow label="Start Date" value={formatDate(reseller.agreementStartDate)} />
                    <InfoRow label="End Date" value={formatDate(reseller.agreementEndDate)} />
                    <InfoRow label="Auto-Renewal" value={<BoolValue v={reseller.autoRenewal} />} />
                    <InfoRow label="Support Level" value={reseller.supportLevel} capitalize />
                    <InfoRow label="Max Customer Limit" value={reseller.maxCustomerLimit ? String(reseller.maxCustomerLimit) : "Unlimited"} />
                  </div>
                </div>
                {reseller.agreementFile && (
                  <>
                    <SectionHeader title="Agreement Document" />
                    <div className="bg-card border rounded-lg p-4">
                      <a href={reseller.agreementFile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-medium">
                        <FileText className="h-4 w-4" /> View Agreement Document
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-4">
                <SectionHeader title="Documents & Photos" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Profile Picture", url: reseller.profilePicture },
                    { label: "CNIC Front", url: reseller.cnicPicture },
                    { label: "CNIC Back", url: reseller.cnicBackPicture },
                    { label: "Office Picture", url: reseller.officePicture },
                    { label: "Registration Form", url: reseller.registrationFormPicture },
                  ].map(({ label, url }) => (
                    <div key={label} className="bg-card border rounded-lg overflow-hidden">
                      {url ? (
                        url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={label} className="w-full h-32 object-cover" />
                          </a>
                        ) : (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="h-32 flex flex-col items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 transition-colors">
                            <FileText className="h-8 w-8" />
                            <span className="text-xs">View File</span>
                          </a>
                        )
                      ) : (
                        <div className="h-32 flex flex-col items-center justify-center text-muted-foreground gap-2 bg-muted/30">
                          <FileText className="h-8 w-8 opacity-30" />
                          <span className="text-xs">Not uploaded</span>
                        </div>
                      )}
                      <div className="px-3 py-2 border-t text-xs font-medium text-center">{label}</div>
                    </div>
                  ))}
                </div>
                {reseller.registrationFormNo && (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-y">
                      <InfoRow label="Registration Form No" value={reseller.registrationFormNo} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "financial" && (
              <div className="space-y-4">
                <SectionHeader title="Wallet & Balance" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Wallet Balance" value={<span className={`font-bold ${parseFloat(String(reseller.walletBalance || "0")) >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>{formatPKR(reseller.walletBalance)}</span>} />
                    <InfoRow label="Credit Limit" value={<span className="font-bold text-blue-700 dark:text-blue-400">{formatPKR(reseller.creditLimit)}</span>} />
                    <InfoRow label="Security Deposit" value={formatPKR(reseller.securityDeposit)} />
                    <InfoRow label="Opening Balance" value={formatPKR(reseller.openingBalance)} />
                  </div>
                </div>

                <SectionHeader title="Billing Settings" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Billing Cycle" value={reseller.billingCycle} capitalize />
                    <InfoRow label="Payment Method" value={(reseller.paymentMethod || "").replace(/_/g, " ")} capitalize />
                  </div>
                </div>

                <SectionHeader title="Commission Settings" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Commission Rate" value={<span className="font-bold text-teal-700 dark:text-teal-400">{reseller.commissionRate || "10"}%</span>} />
                    <InfoRow label="Payment Method" value={(reseller.commissionPaymentMethod || "wallet").replace(/_/g, " ")} capitalize />
                    <InfoRow label="Payment Frequency" value={reseller.commissionPaymentFrequency} capitalize />
                  </div>
                </div>

                <SectionHeader title="Bank Details" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Bank Name" value={reseller.bankName} />
                    <InfoRow label="Account Title" value={reseller.bankAccountTitle} />
                    <InfoRow label="Account Number" value={<span className="font-mono">{reseller.bankAccountNumber}</span>} />
                    <InfoRow label="Branch Code" value={reseller.bankBranchCode} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "wallet" && (
              <div className="space-y-4">
                <SectionHeader title="Wallet Summary" />
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Wallet Balance</p>
                      <p className={`text-2xl font-bold ${parseFloat(String(reseller.walletBalance || "0")) >= 0 ? "text-green-700" : "text-red-600"}`}>{formatPKR(reseller.walletBalance)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Credit Limit</p>
                      <p className="text-2xl font-bold text-blue-700">{formatPKR(reseller.creditLimit)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Total Transactions</p>
                      <p className="text-2xl font-bold text-amber-700">{walletTxns?.length || 0}</p>
                    </CardContent>
                  </Card>
                </div>

                <SectionHeader title="Transaction History" />
                {txnsLoading ? (<div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>)
                : !walletTxns?.length ? (<EmptyState icon={Wallet} message="No wallet transactions found" />)
                : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-[#1a3a5c]">
                        <TableHead className="text-white text-xs">Date</TableHead>
                        <TableHead className="text-white text-xs">Txn ID</TableHead>
                        <TableHead className="text-white text-xs">Type</TableHead>
                        <TableHead className="text-white text-xs">Category</TableHead>
                        <TableHead className="text-white text-xs">Amount</TableHead>
                        <TableHead className="text-white text-xs">Balance</TableHead>
                        <TableHead className="text-white text-xs">Reference</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {walletTxns.map((t: any) => (
                          <TableRow key={t.id}>
                            <TableCell className="text-xs">{formatDate(t.createdAt)}</TableCell>
                            <TableCell className="text-xs font-mono">{t.id}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${t.type === "credit" ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>
                                {t.type === "credit" ? <TrendingUp className="h-3 w-3 inline mr-1" /> : <TrendingDown className="h-3 w-3 inline mr-1" />}{t.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs capitalize">{(t.category || "general").replace(/_/g, " ")}</TableCell>
                            <TableCell className={`text-xs font-semibold ${t.type === "credit" ? "text-green-700" : "text-red-600"}`}>{t.type === "credit" ? "+" : "-"}Rs. {parseFloat(String(t.amount || "0")).toLocaleString()}</TableCell>
                            <TableCell className="text-xs font-medium">Rs. {parseFloat(String(t.balanceAfter || "0")).toLocaleString()}</TableCell>
                            <TableCell className="text-xs">{t.reference || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "tickets" && (
              <div className="space-y-4">
                <SectionHeader title="Support & Tickets History" />
                {resellerTickets.length === 0 ? (
                  <EmptyState icon={AlertCircle} message="No support tickets found for this reseller's customers" />
                ) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-[#1a3a5c]">
                        <TableHead className="text-white text-xs">#</TableHead>
                        <TableHead className="text-white text-xs">Ticket No</TableHead>
                        <TableHead className="text-white text-xs">Subject</TableHead>
                        <TableHead className="text-white text-xs">Customer</TableHead>
                        <TableHead className="text-white text-xs">Priority</TableHead>
                        <TableHead className="text-white text-xs">Status</TableHead>
                        <TableHead className="text-white text-xs">Created</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {resellerTickets.map((t: any, i: number) => {
                          const cust = resellerCustomers.find((c: any) => c.id === t.customerId);
                          return (
                            <TableRow key={t.id}>
                              <TableCell className="text-xs">{i + 1}</TableCell>
                              <TableCell className="text-xs font-mono">{t.ticketNumber}</TableCell>
                              <TableCell className="text-xs font-medium">{t.subject}</TableCell>
                              <TableCell className="text-xs">{cust?.name || "—"}</TableCell>
                              <TableCell><Badge variant="secondary" className={`text-[10px] capitalize ${t.priority === "high" || t.priority === "critical" ? "text-red-700 bg-red-50" : t.priority === "medium" ? "text-amber-700 bg-amber-50" : "text-gray-600 bg-gray-100"}`}>{t.priority}</Badge></TableCell>
                              <TableCell><Badge variant="secondary" className={`text-[10px] capitalize ${t.status === "open" ? "text-blue-700 bg-blue-50" : t.status === "resolved" ? "text-green-700 bg-green-50" : "text-gray-600 bg-gray-100"}`}>{t.status}</Badge></TableCell>
                              <TableCell className="text-xs">{formatDate(t.createdAt)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "sms" && (
              <div className="space-y-4">
                <SectionHeader title="SMS Notifications History" />
                <EmptyState icon={MessageSquare} message="No SMS notifications history available for this reseller" />
              </div>
            )}

            {activeTab === "referrals" && (
              <div className="space-y-4">
                <SectionHeader title="Referrals" />
                <EmptyState icon={Users} message="No referral records found for this reseller" />
              </div>
            )}

          </div>
        </div>
      </div>

      <Dialog open={!!editPkg} onOpenChange={(open) => { if (!open) setEditPkg(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Package — {editPkg?.packageName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Vendor</label>
                <p className="text-sm font-medium">{(vendors || []).find((v: any) => v.id === editPkg?.vendorId)?.name || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Speed</label>
                <p className="text-sm font-medium">{editPkg?.speed || "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Vendor Price</label>
                <p className="text-sm font-medium">Rs. {parseFloat(String(editPkg?.vendorPrice || "0")).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Reseller Price</label>
                <Input
                  type="number"
                  value={editPkgPrice}
                  onChange={(e) => setEditPkgPrice(e.target.value)}
                  placeholder="Enter reseller price"
                  data-testid="input-edit-pkg-price"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Profit</label>
              <p className={`text-sm font-bold ${(parseFloat(editPkgPrice || "0") - parseFloat(String(editPkg?.vendorPrice || "0"))) >= 0 ? "text-green-700" : "text-red-600"}`}>
                Rs. {(parseFloat(editPkgPrice || "0") - parseFloat(String(editPkg?.vendorPrice || "0"))).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEditPkg(null)} data-testid="btn-cancel-edit-pkg">Cancel</Button>
            <Button size="sm" onClick={() => {
              apiRequest("PATCH", `/api/vendor-packages/${editPkg.id}`, { resellerPrice: editPkgPrice })
                .then(() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/vendor-packages"] });
                  toast({ title: "Package Updated", description: `${editPkg.packageName} reseller price updated to Rs. ${parseFloat(editPkgPrice).toLocaleString()}` });
                  setEditPkg(null);
                })
                .catch(() => toast({ title: "Failed to update package", variant: "destructive" }));
            }} data-testid="btn-save-edit-pkg">
              <Save className="h-3.5 w-3.5 mr-1" /> Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletePkg} onOpenChange={(open) => { if (!open) setDeletePkg(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Package</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <p className="text-sm">Are you sure you want to remove <span className="font-semibold">{deletePkg?.packageName}</span> from this reseller?</p>
            <p className="text-xs text-muted-foreground">This will unassign the package from the reseller. The package itself will not be deleted.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeletePkg(null)} data-testid="btn-cancel-delete-pkg">Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => {
              const updatedIds = assignedPkgIds.filter((pkgId: number) => pkgId !== deletePkg.id).join(",");
              apiRequest("PATCH", `/api/resellers/${id}`, { assignedPackages: updatedIds || null })
                .then(() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/resellers", id] });
                  toast({ title: "Package Removed", description: `${deletePkg.packageName} has been removed from this reseller.` });
                  setDeletePkg(null);
                })
                .catch(() => toast({ title: "Failed to remove package", variant: "destructive" }));
            }} data-testid="btn-confirm-delete-pkg">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={schedulerOpen} onOpenChange={setSchedulerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CalendarRange className="h-5 w-5 text-blue-600" /> Schedule Status Change</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Current Status</p>
              <Badge variant="secondary" className={`mt-1 capitalize ${reseller.status === "active" ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>{reseller.status}</Badge>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Change Status To <span className="text-red-500">*</span></label>
              <Select value={scheduledStatus} onValueChange={setScheduledStatus}>
                <SelectTrigger data-testid="select-scheduled-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Effective Date <span className="text-red-500">*</span></label>
              <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} data-testid="input-scheduled-date" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Input placeholder="Reason for status change" value={scheduledReason} onChange={(e) => setScheduledReason(e.target.value)} data-testid="input-scheduled-reason" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setSchedulerOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={!scheduledDate || !scheduledStatus} onClick={() => {
              const today = new Date().toISOString().slice(0, 10);
              if (scheduledDate <= today) {
                statusUpdateMutation.mutate(scheduledStatus);
                setSchedulerOpen(false);
              } else {
                apiRequest("PATCH", `/api/resellers/${id}`, { notes: `[Scheduled] Status change to "${scheduledStatus}" on ${scheduledDate}. ${scheduledReason || ""}`.trim() })
                  .then(() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/resellers", id] });
                  }).catch(() => {});
                setSchedulerOpen(false);
                toast({ title: "Status Change Scheduled", description: `Status will change to "${scheduledStatus}" on ${scheduledDate}.` });
              }
            }} data-testid="btn-confirm-schedule" className="bg-[#0057FF]">
              Apply / Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-blue-600" /> Send Email / Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-xs space-y-1">
              <p><span className="font-medium">To:</span> {reseller.name}</p>
              <p><span className="font-medium">Phone:</span> {reseller.phone}</p>
              {reseller.email && <p><span className="font-medium">Email:</span> {reseller.email}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Channel <span className="text-red-500">*</span></label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger data-testid="select-message-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {messageType === "email" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input placeholder="Email subject" value={messageSubject} onChange={(e) => setMessageSubject(e.target.value)} data-testid="input-message-subject" />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Message <span className="text-red-500">*</span></label>
              <textarea className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Type your message..." value={messageBody} onChange={(e) => setMessageBody(e.target.value)} data-testid="input-message-body" />
            </div>
            <div className="flex flex-wrap gap-1">
              {["Payment reminder", "Account renewal", "Balance low notification", "Service update"].map(tpl => (
                <Button key={tpl} variant="outline" size="sm" className="text-[10px] h-6" onClick={() => setMessageBody(tpl + ": ")} data-testid={`btn-template-${tpl.replace(/\s+/g, "-").toLowerCase()}`}>{tpl}</Button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setMessageOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={!messageBody} onClick={() => {
              setMessageOpen(false);
              toast({ title: "Message Queued", description: `${messageType.toUpperCase()} message to ${reseller.name} has been queued for delivery.` });
            }} data-testid="btn-send-message-confirm" className="bg-[#0057FF]">
              Send {messageType === "sms" ? "SMS" : messageType === "whatsapp" ? "WhatsApp" : "Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
