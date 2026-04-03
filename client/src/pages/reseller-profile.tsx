import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, Building2, Mail, Phone, Edit, Save, ChevronRight,
  Shield, Network, Activity, DollarSign, AlertCircle, RefreshCw,
  Calendar, Download, MessageCircle, CalendarRange, User, Hash,
  CreditCard, Globe, CheckCircle2, FileText, Plus, Clock, TrendingUp,
  TrendingDown, BarChart3, MessageSquare, ShoppingBag, Users, Bell,
  Wallet, Store, Percent, Landmark, MapPin, Briefcase, Key, Wifi, Navigation, Tag, Trash2, MoreHorizontal, Pencil, X,
  Upload, Check, Eye, EyeOff, Map, ScrollText, Image,
} from "lucide-react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Reseller } from "@shared/schema";

const mapMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const editMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function FieldGroup({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div className={`grid gap-4 ${cols === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

function EditSectionHeader({ icon: Icon, title, description }: { icon: any; title: string; description?: string }) {
  return (
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
      </div>
    </CardHeader>
  );
}

function FileUploadPreview({ label, required, value, onChange, testId }: {
  label: string; required?: boolean; value: string; onChange: (url: string) => void; testId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/document", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onChange(data.url);
    } catch { onChange(""); } finally { setUploading(false); }
  };
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <div
        className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden ${value ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-border hover:border-blue-400 hover:bg-blue-50/50"}`}
        onClick={() => inputRef.current?.click()}
        data-testid={testId}
      >
        <input ref={inputRef} type="file" className="hidden" accept="image/*,.pdf" onChange={handleUpload} disabled={uploading} />
        {value ? (
          <div className="flex items-center gap-3 p-3">
            {value.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={value} alt="Preview" className="h-12 w-16 object-cover rounded-lg border" />
            ) : (
              <div className="h-12 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center"><FileText className="h-6 w-6 text-blue-600" /></div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Uploaded</p>
              <p className="text-xs text-muted-foreground truncate">{value.split("/").pop()}</p>
            </div>
            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); onChange(""); }}><X className="h-3.5 w-3.5" /></Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Upload className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-sm font-medium">{uploading ? "Uploading..." : "Click to upload"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG or PDF</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const { data: branches } = useQuery<any[]>({ queryKey: ["/api/branches"] });
  const { data: areas } = useQuery<any[]>({ queryKey: ["/api/areas"] });
  const { data: companyPackagesList } = useQuery<any[]>({ queryKey: ["/api/reseller-company-packages"] });
  const { data: companySetting } = useQuery<any>({ queryKey: ["/api/company"] });

  const statusUpdateMutation = useMutation({
    mutationFn: async (status: string) => { const res = await apiRequest("PATCH", `/api/resellers/${id}`, { status }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/resellers", id] }); queryClient.invalidateQueries({ queryKey: ["/api/resellers"] }); toast({ title: "Status updated" }); },
  });

  const patchReseller = async (data: Record<string, any>) => {
    await apiRequest("PATCH", `/api/resellers/${id}`, data);
    queryClient.invalidateQueries({ queryKey: ["/api/resellers", id] });
    queryClient.invalidateQueries({ queryKey: ["/api/resellers"] });
  };

  const [saving, setSaving] = useState<string | null>(null);

  const [pf, setPf] = useState({
    name: "", companyName: "", contactName: "", fatherName: "",
    resellerType: "authorized_dealer", territory: "", branch: "", area: "", city: "", address: "",
    phone: "", secondaryPhone: "", email: "", cnic: "", ntn: "",
    mapLatitude: "", mapLongitude: "", notes: "",
    uplinkType: "", uplink: "", exchangeTowerPopName: "", portId: "", media: "", connectionType: "",
    bandwidthPlan: "", ipAssignment: "dynamic", nasId: "", serviceZone: "",
    vlanIdAllowed: false, vlanInput: "", vlanIdNote: "",
    vendorPanelAllowed: false,
    vpVendorId: "", vpPanelUrl: "", vpPanelUsername: "", vpPanelPassword: "",
    agreementType: "", agreementStartDate: "", agreementEndDate: "", joinDate: "",
    autoRenewal: false, supportLevel: "", maxCustomerLimit: "",
    profilePicture: "", cnicPicture: "", cnicBackPicture: "", officePicture: "",
    registrationFormPicture: "", registrationFormNo: "", agreementFile: "",
  });
  const upPf = (k: string, v: any) => setPf(prev => ({ ...prev, [k]: v }));

  const [profileVlans, setProfileVlans] = useState<{ id: string; note: string }[]>([]);
  const addProfileVlan = () => {
    const v = pf.vlanInput.trim();
    if (!v || profileVlans.some(x => x.id === v)) { upPf("vlanInput", ""); return; }
    setProfileVlans(prev => [...prev, { id: v, note: pf.vlanIdNote.trim() }]);
    upPf("vlanInput", ""); upPf("vlanIdNote", "");
  };

  const [profilePanels, setProfilePanels] = useState<{ vendorId: string; vendorName: string; panelUrl: string; panelUsername: string; panelPassword: string }[]>([]);
  const [showVpPass, setShowVpPass] = useState(false);

  const [pkgForm, setPkgForm] = useState({ vendorId: "", packageId: "", vendorPrice: "0", profit: "0" });
  const pkgResellerPrice = (parseFloat(pkgForm.vendorPrice || "0") + parseFloat(pkgForm.profit || "0")).toFixed(2);
  const [showAddPkg, setShowAddPkg] = useState(false);

  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [mapPickedPos, setMapPickedPos] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!reseller) return;
    let parsedVlans: { id: string; note: string }[] = [];
    try {
      if (reseller.vlanId) {
        const parsed = JSON.parse(reseller.vlanId as string);
        if (Array.isArray(parsed) && parsed[0]?.id) { parsedVlans = parsed; }
        else { parsedVlans = String(reseller.vlanId).split(",").filter(Boolean).map((x: string) => ({ id: x.trim(), note: "" })); }
      }
    } catch { if (reseller.vlanId) parsedVlans = String(reseller.vlanId).split(",").filter(Boolean).map((x: string) => ({ id: x.trim(), note: "" })); }
    setProfileVlans(parsedVlans);

    let parsedPanels: any[] = [];
    try { if (reseller.assignedVendorPanels) parsedPanels = JSON.parse(reseller.assignedVendorPanels); } catch {}
    setProfilePanels(parsedPanels);

    setPf(prev => ({
      ...prev,
      name: reseller.name || "", companyName: reseller.companyName || "",
      contactName: reseller.contactName || "", fatherName: reseller.fatherName || "",
      resellerType: reseller.resellerType || "authorized_dealer", territory: reseller.territory || "",
      branch: reseller.branch || "", area: reseller.area || "", city: reseller.city || "",
      address: reseller.address || "", phone: reseller.phone || "",
      secondaryPhone: reseller.secondaryPhone || "", email: reseller.email || "",
      cnic: reseller.cnic || "", ntn: reseller.ntn || "",
      mapLatitude: reseller.mapLatitude || "", mapLongitude: reseller.mapLongitude || "",
      notes: reseller.notes || "",
      uplinkType: reseller.uplinkType || "", uplink: reseller.uplink || "",
      exchangeTowerPopName: reseller.exchangeTowerPopName || "", portId: reseller.portId || "",
      media: reseller.media || "", connectionType: reseller.connectionType || "",
      bandwidthPlan: reseller.bandwidthPlan || "", ipAssignment: reseller.ipAssignment || "dynamic",
      nasId: reseller.nasId || "", serviceZone: reseller.serviceZone || "",
      vlanIdAllowed: !!reseller.vlanIdAllowed,
      vendorPanelAllowed: !!reseller.vendorPanelAllowed,
      agreementType: reseller.agreementType || "",
      agreementStartDate: reseller.agreementStartDate || "", agreementEndDate: reseller.agreementEndDate || "",
      joinDate: reseller.joinDate || "", autoRenewal: !!reseller.autoRenewal,
      supportLevel: reseller.supportLevel || "", maxCustomerLimit: reseller.maxCustomerLimit ? String(reseller.maxCustomerLimit) : "",
      profilePicture: reseller.profilePicture || "", cnicPicture: reseller.cnicPicture || "",
      cnicBackPicture: reseller.cnicBackPicture || "", officePicture: reseller.officePicture || "",
      registrationFormPicture: reseller.registrationFormPicture || "",
      registrationFormNo: reseller.registrationFormNo || "", agreementFile: reseller.agreementFile || "",
    }));
  }, [reseller]);

  const saveSection = async (section: string, data: Record<string, any>) => {
    setSaving(section);
    try {
      await patchReseller(data);
      toast({ title: "Saved", description: `${section} updated successfully.` });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    setSaving(null);
  };

  const filteredAreas = (areas || []).filter((a: any) => {
    const branchObj = (branches || []).find((b: any) => String(b.id) === pf.branch || b.name === pf.branch);
    return !branchObj || a.branch === branchObj.name;
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
                <Card>
                  <EditSectionHeader icon={User} title="Personal Information" description="Identity, contact details and location" />
                  <CardContent className="space-y-4">
                    <FieldGroup>
                      <Field label="Company Name"><Input value={pf.companyName} onChange={e => upPf("companyName", e.target.value)} placeholder="Company name" data-testid="pf-company-name" /></Field>
                      <Field label="Reseller Name" required><Input value={pf.name} onChange={e => upPf("name", e.target.value)} placeholder="Full name" data-testid="pf-reseller-name" /></Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field label="Father Name"><Input value={pf.fatherName} onChange={e => upPf("fatherName", e.target.value)} placeholder="Father's full name" data-testid="pf-father-name" /></Field>
                      <Field label="Contact Person"><Input value={pf.contactName} onChange={e => upPf("contactName", e.target.value)} placeholder="Primary contact name" data-testid="pf-contact-name" /></Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field label="Mobile No" required><Input value={pf.phone} onChange={e => upPf("phone", e.target.value)} placeholder="03XX-XXXXXXX" data-testid="pf-phone" /></Field>
                      <Field label="Phone No"><Input value={pf.secondaryPhone} onChange={e => upPf("secondaryPhone", e.target.value)} placeholder="Alternate / landline" data-testid="pf-secondary-phone" /></Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field label="Email"><Input type="email" value={pf.email} onChange={e => upPf("email", e.target.value)} placeholder="reseller@company.pk" data-testid="pf-email" /></Field>
                      <Field label="CNIC / NID"><Input value={pf.cnic} onChange={e => upPf("cnic", e.target.value)} placeholder="XXXXX-XXXXXXX-X" data-testid="pf-cnic" /></Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field label="NTN"><Input value={pf.ntn} onChange={e => upPf("ntn", e.target.value)} placeholder="NTN number" data-testid="pf-ntn" /></Field>
                      <Field label="Territory"><Input value={pf.territory} onChange={e => upPf("territory", e.target.value)} placeholder="Territory" data-testid="pf-territory" /></Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field label="Branch">
                        <Select value={pf.branch} onValueChange={v => upPf("branch", v)}>
                          <SelectTrigger data-testid="pf-branch"><SelectValue placeholder="Select branch" /></SelectTrigger>
                          <SelectContent>
                            {(branches || []).map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Area">
                        <Select value={pf.area} onValueChange={v => upPf("area", v)}>
                          <SelectTrigger data-testid="pf-area"><SelectValue placeholder="Select area" /></SelectTrigger>
                          <SelectContent>
                            {(filteredAreas.length > 0 ? filteredAreas : (areas || [])).map((a: any) => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field label="City"><Input value={pf.city} onChange={e => upPf("city", e.target.value)} placeholder="City" data-testid="pf-city" /></Field>
                      <Field label="Reseller Type">
                        <Select value={pf.resellerType} onValueChange={v => upPf("resellerType", v)}>
                          <SelectTrigger data-testid="pf-reseller-type"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="authorized_dealer">Authorized Dealer</SelectItem>
                            <SelectItem value="franchise">Franchise</SelectItem>
                            <SelectItem value="sub_reseller">Sub Reseller</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>
                    <Field label="Address"><Textarea value={pf.address} onChange={e => upPf("address", e.target.value)} placeholder="Street, block, building, landmark..." className="min-h-[80px]" data-testid="pf-address" /></Field>

                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">GPS Coordinates</p>
                        <Button type="button" variant="outline" size="sm" onClick={() => { setMapPickedPos(pf.mapLatitude && pf.mapLongitude ? { lat: parseFloat(pf.mapLatitude), lng: parseFloat(pf.mapLongitude) } : null); setMapPickerOpen(true); }} className="gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50" data-testid="pf-btn-map">
                          <Map className="h-3.5 w-3.5" /> Pick from Map
                        </Button>
                      </div>
                      <FieldGroup>
                        <Field label="Latitude"><Input value={pf.mapLatitude} onChange={e => upPf("mapLatitude", e.target.value)} placeholder="e.g. 31.5204" data-testid="pf-latitude" /></Field>
                        <Field label="Longitude"><Input value={pf.mapLongitude} onChange={e => upPf("mapLongitude", e.target.value)} placeholder="e.g. 74.3587" data-testid="pf-longitude" /></Field>
                      </FieldGroup>
                      {pf.mapLatitude && pf.mapLongitude && isFinite(parseFloat(pf.mapLatitude)) && isFinite(parseFloat(pf.mapLongitude)) && (
                        <div className="rounded-md overflow-hidden border h-48">
                          <MapContainer center={[parseFloat(pf.mapLatitude), parseFloat(pf.mapLongitude)]} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} attributionControl={false}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[parseFloat(pf.mapLatitude), parseFloat(pf.mapLongitude)]} icon={editMarkerIcon} />
                          </MapContainer>
                        </div>
                      )}
                    </div>

                    <Separator />
                    <Field label="Notes / Remarks"><Textarea value={pf.notes} onChange={e => upPf("notes", e.target.value)} placeholder="Internal notes..." className="min-h-[80px]" data-testid="pf-notes" /></Field>

                    <div className="flex justify-end pt-2">
                      <Button onClick={() => saveSection("Personal Information", { name: pf.name, companyName: pf.companyName || null, contactName: pf.contactName || null, fatherName: pf.fatherName || null, resellerType: pf.resellerType, territory: pf.territory || null, branch: pf.branch || null, area: pf.area || null, city: pf.city || null, address: pf.address || null, phone: pf.phone, secondaryPhone: pf.secondaryPhone || null, email: pf.email || null, cnic: pf.cnic || null, ntn: pf.ntn || null, mapLatitude: pf.mapLatitude || null, mapLongitude: pf.mapLongitude || null, notes: pf.notes || null })} disabled={saving === "Personal Information" || !pf.name || !pf.phone} data-testid="pf-save-personal" className="bg-[#0057FF]">
                        {saving === "Personal Information" ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Save Personal Info
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "service" && (
              <div className="space-y-4">
                <Card>
                  <EditSectionHeader icon={Wifi} title="Uplink & Connectivity" description="Network uplink type and connection details" />
                  <CardContent className="space-y-4">
                    <FieldGroup>
                      <Field label="Uplink Type">
                        <Select value={pf.uplinkType || ""} onValueChange={v => upPf("uplinkType", v)}>
                          <SelectTrigger data-testid="pf-uplink-type"><SelectValue placeholder="Select uplink type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fiber">Fiber</SelectItem>
                            <SelectItem value="wireless">Wireless</SelectItem>
                            <SelectItem value="coaxial">Coaxial</SelectItem>
                            <SelectItem value="ethernet">Ethernet</SelectItem>
                            <SelectItem value="dsl">DSL</SelectItem>
                            <SelectItem value="leased_line">Leased Line</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Uplink / Media Name"><Input value={pf.uplink} onChange={e => upPf("uplink", e.target.value)} placeholder="e.g. FiberLink-Main" data-testid="pf-uplink" /></Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field label="Exchange / Tower / POP Name"><Input value={pf.exchangeTowerPopName} onChange={e => upPf("exchangeTowerPopName", e.target.value)} placeholder="Exchange or POP name" data-testid="pf-exchange" /></Field>
                      <Field label="Port ID"><Input value={pf.portId} onChange={e => upPf("portId", e.target.value)} placeholder="Port identifier" data-testid="pf-port-id" /></Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field label="Media Type">
                        <Select value={pf.media || ""} onValueChange={v => upPf("media", v)}>
                          <SelectTrigger data-testid="pf-media"><SelectValue placeholder="Select media type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fiber_p2p">Fiber P2P</SelectItem>
                            <SelectItem value="wireless">Wireless</SelectItem>
                            <SelectItem value="exchange">Exchange</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Connection Type">
                        <Select value={pf.connectionType || ""} onValueChange={v => upPf("connectionType", v)}>
                          <SelectTrigger data-testid="pf-connection-type"><SelectValue placeholder="Select connection type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FTTP">FTTP</SelectItem>
                            <SelectItem value="media_converter">Media Converter</SelectItem>
                            <SelectItem value="switch_port">Switch Port</SelectItem>
                            <SelectItem value="dish_p2p">Dish P2P</SelectItem>
                            <SelectItem value="dplc">DPLC</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field label="Bandwidth Plan"><Input value={pf.bandwidthPlan} onChange={e => upPf("bandwidthPlan", e.target.value)} placeholder="e.g. 100Mbps Shared" data-testid="pf-bandwidth-plan" /></Field>
                      <Field label="Service Zone"><Input value={pf.serviceZone} onChange={e => upPf("serviceZone", e.target.value)} placeholder="Service zone" data-testid="pf-service-zone" /></Field>
                    </FieldGroup>

                    <Separator />
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div><p className="text-sm font-medium">VLAN ID Allowed</p><p className="text-xs text-muted-foreground">Enable VLAN access for this reseller</p></div>
                      <Switch checked={pf.vlanIdAllowed} onCheckedChange={v => upPf("vlanIdAllowed", v)} data-testid="pf-vlan-allowed" />
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">VLAN IDs</p>
                      <div className="flex gap-2">
                        <Input value={pf.vlanInput} onChange={e => upPf("vlanInput", e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addProfileVlan(); } }} placeholder="VLAN ID (e.g. 100)" className="w-36 shrink-0" data-testid="pf-vlan-input" />
                        <Input value={pf.vlanIdNote} onChange={e => upPf("vlanIdNote", e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addProfileVlan(); } }} placeholder="Note (optional)" className="flex-1" data-testid="pf-vlan-note" />
                        <Button type="button" variant="outline" size="sm" onClick={addProfileVlan} disabled={!pf.vlanInput.trim()} className="gap-1.5 shrink-0" data-testid="pf-add-vlan"><Plus className="h-3.5 w-3.5" /> Add</Button>
                      </div>
                      {profileVlans.length > 0 && (
                        <div className="border rounded-lg overflow-hidden mt-2">
                          <div className="px-3 py-2 bg-muted text-xs font-semibold text-muted-foreground uppercase tracking-wide grid grid-cols-[auto_1fr_auto] gap-3">
                            <span>VLAN ID</span><span>Note</span><span></span>
                          </div>
                          {profileVlans.map(entry => (
                            <div key={entry.id} className="px-3 py-2 border-t text-sm grid grid-cols-[auto_1fr_auto] gap-3 items-center">
                              <span className="font-mono font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded text-xs">{entry.id}</span>
                              <span className="text-muted-foreground text-xs truncate">{entry.note || <span className="italic">—</span>}</span>
                              <button type="button" onClick={() => setProfileVlans(prev => prev.filter(x => x.id !== entry.id))} className="text-muted-foreground hover:text-red-500 transition-colors" data-testid={`pf-remove-vlan-${entry.id}`}><X className="h-3.5 w-3.5" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                      {profileVlans.length === 0 && <p className="text-xs text-muted-foreground">No VLAN IDs added yet. You can add multiple.</p>}
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button onClick={() => saveSection("Network & Service", { uplinkType: pf.uplinkType || null, uplink: pf.uplink || null, exchangeTowerPopName: pf.exchangeTowerPopName || null, portId: pf.portId || null, media: pf.media || null, connectionType: pf.connectionType || null, bandwidthPlan: pf.bandwidthPlan || null, serviceZone: pf.serviceZone || null, vlanIdAllowed: pf.vlanIdAllowed, vlanId: profileVlans.length > 0 ? JSON.stringify(profileVlans) : null })} disabled={saving === "Network & Service"} data-testid="pf-save-network" className="bg-[#0057FF]">
                        {saving === "Network & Service" ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Save Network & Service
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "packages" && (
              <div className="space-y-4">
                <Card>
                  <EditSectionHeader icon={Tag} title="Assign Packages" description="Internet packages and reseller pricing tiers" />
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Select Vendor">
                        <Select value={pkgForm.vendorId} onValueChange={v => setPkgForm(prev => ({ ...prev, vendorId: v, packageId: "", vendorPrice: "0" }))}>
                          <SelectTrigger data-testid="pf-pkg-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                          <SelectContent>
                            {(companyPackagesList || []).some((p: any) => p.isActive) && (
                              <SelectItem value="my-company">{companySetting?.companyName?.trim() || "My Company"} (My Company)</SelectItem>
                            )}
                            {(vendors || []).filter((v: any) => (vendorPackages || []).some((vp: any) => vp.vendorId === v.id && vp.isActive)).map((v: any) => (
                              <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Select Package">
                        <Select value={pkgForm.packageId} disabled={!pkgForm.vendorId} onValueChange={v => {
                          if (pkgForm.vendorId === "my-company") {
                            const p = (companyPackagesList || []).find((p: any) => String(p.id) === v);
                            setPkgForm(prev => ({ ...prev, packageId: v, vendorPrice: p?.sellingPrice || "0" }));
                          } else {
                            const p = (vendorPackages || []).find((p: any) => String(p.id) === v);
                            setPkgForm(prev => ({ ...prev, packageId: v, vendorPrice: p?.vendorPrice || "0" }));
                          }
                        }}>
                          <SelectTrigger data-testid="pf-pkg-package"><SelectValue placeholder={pkgForm.vendorId ? "Choose package" : "Select vendor first"} /></SelectTrigger>
                          <SelectContent>
                            {pkgForm.vendorId === "my-company"
                              ? (companyPackagesList || []).filter((p: any) => p.isActive).map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.packageName} — Rs.{p.sellingPrice}</SelectItem>)
                              : (vendorPackages || []).filter((p: any) => p.isActive && String(p.vendorId) === pkgForm.vendorId).map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.packageName} — {p.speed}</SelectItem>)
                            }
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="Vendor Price (Rs.)">
                        <Input type="number" value={pkgForm.vendorPrice} onChange={e => setPkgForm(prev => ({ ...prev, vendorPrice: e.target.value }))} data-testid="pf-pkg-vendor-price" />
                      </Field>
                      <Field label="Profit (Rs.)">
                        <Input type="number" value={pkgForm.profit} onChange={e => setPkgForm(prev => ({ ...prev, profit: e.target.value }))} data-testid="pf-pkg-profit" />
                      </Field>
                      <Field label="Reseller Price (Rs.)">
                        <div className={`flex items-center h-10 px-3 rounded-md border bg-muted text-sm font-mono font-semibold ${parseFloat(pkgResellerPrice) > parseFloat(pkgForm.vendorPrice || "0") ? "text-green-600" : "text-muted-foreground"}`}>
                          Rs. {pkgResellerPrice}
                        </div>
                      </Field>
                    </div>
                    <Button type="button" disabled={!pkgForm.packageId || !pkgForm.vendorId || saving === "Packages"} data-testid="pf-add-pkg"
                      onClick={async () => {
                        if (!pkgForm.packageId || !pkgForm.vendorId) return;
                        setSaving("Packages");
                        try {
                          const isMyCompany = pkgForm.vendorId === "my-company";
                          if (!isMyCompany) {
                            const newIds = [...assignedPkgIds, parseInt(pkgForm.packageId)].filter((v, i, a) => a.indexOf(v) === i);
                            await patchReseller({ assignedPackages: newIds.join(",") });
                          }
                          setPkgForm({ vendorId: "", packageId: "", vendorPrice: "0", profit: "0" });
                          toast({ title: "Package added successfully" });
                        } catch { toast({ title: "Failed to add package", variant: "destructive" }); }
                        setSaving(null);
                      }}>
                      <Plus className="h-4 w-4 mr-1" /> Add Package
                    </Button>
                  </CardContent>
                </Card>

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
                <Card>
                  <EditSectionHeader icon={Globe} title="Vendor Panel Access" description="Configure vendor panel access and credentials" />
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div><p className="text-sm font-medium">Allow Vendor Panel Access</p><p className="text-xs text-muted-foreground">Enable vendor panel login credentials for this reseller</p></div>
                      <Switch checked={pf.vendorPanelAllowed} onCheckedChange={v => upPf("vendorPanelAllowed", v)} data-testid="pf-vp-allowed" />
                    </div>

                    {pf.vendorPanelAllowed && (
                      <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                        <p className="text-sm font-semibold text-foreground">Add Vendor Panel</p>
                        <Field label="Vendor">
                          <Select value={pf.vpVendorId} onValueChange={v => upPf("vpVendorId", v)}>
                            <SelectTrigger data-testid="pf-vp-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="my-company">{companySetting?.companyName?.trim() || "My Company"} (My Company)</SelectItem>
                              {(vendors || []).map((v: any) => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label="Panel URL"><Input value={pf.vpPanelUrl} onChange={e => upPf("vpPanelUrl", e.target.value)} placeholder="https://panel.vendor.com" data-testid="pf-vp-url" /></Field>
                        <FieldGroup>
                          <Field label="Username"><Input value={pf.vpPanelUsername} onChange={e => upPf("vpPanelUsername", e.target.value)} placeholder="Panel username" data-testid="pf-vp-username" /></Field>
                          <Field label="Password">
                            <div className="relative">
                              <Input type={showVpPass ? "text" : "password"} value={pf.vpPanelPassword} onChange={e => upPf("vpPanelPassword", e.target.value)} placeholder="Panel password" data-testid="pf-vp-password" className="pr-10" />
                              <button type="button" onClick={() => setShowVpPass(v => !v)} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">{showVpPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                            </div>
                          </Field>
                        </FieldGroup>
                        <Button type="button" variant="outline" size="sm" disabled={!pf.vpVendorId || !pf.vpPanelUrl} data-testid="pf-add-vp"
                          onClick={() => {
                            if (!pf.vpVendorId || !pf.vpPanelUrl) return;
                            const vName = pf.vpVendorId === "my-company" ? (companySetting?.companyName?.trim() || "My Company") : (vendors || []).find((v: any) => String(v.id) === pf.vpVendorId)?.name || pf.vpVendorId;
                            setProfilePanels(prev => [...prev, { vendorId: pf.vpVendorId, vendorName: vName, panelUrl: pf.vpPanelUrl, panelUsername: pf.vpPanelUsername, panelPassword: pf.vpPanelPassword }]);
                            upPf("vpVendorId", ""); upPf("vpPanelUrl", ""); upPf("vpPanelUsername", ""); upPf("vpPanelPassword", "");
                          }}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Panel
                        </Button>
                      </div>
                    )}

                    {profilePanels.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="px-3 py-2 bg-muted text-xs font-semibold text-muted-foreground uppercase tracking-wide grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-3">
                          <span>#</span><span>Vendor</span><span>Panel URL</span><span>Username</span><span></span>
                        </div>
                        {profilePanels.map((p, i) => (
                          <div key={i} className="px-3 py-2 border-t text-sm grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-3 items-center">
                            <span className="text-xs text-muted-foreground">{i + 1}</span>
                            <span className="font-medium text-xs truncate">{p.vendorName}</span>
                            <span className="text-blue-600 text-xs truncate">{p.panelUrl}</span>
                            <span className="text-xs truncate">{p.panelUsername || "—"}</span>
                            <button type="button" onClick={() => setProfilePanels(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-500 transition-colors" data-testid={`pf-remove-panel-${i}`}><X className="h-3.5 w-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    {profilePanels.length === 0 && !pf.vendorPanelAllowed && <p className="text-xs text-muted-foreground">Enable Vendor Panel Access to add vendor panels.</p>}
                    {profilePanels.length === 0 && pf.vendorPanelAllowed && <p className="text-xs text-muted-foreground">No panels added yet. Use the form above to add a vendor panel.</p>}

                    <div className="flex justify-end pt-2">
                      <Button onClick={() => saveSection("Vendor Panels", { vendorPanelAllowed: pf.vendorPanelAllowed, assignedVendorPanels: profilePanels.length > 0 ? JSON.stringify(profilePanels) : null })} disabled={saving === "Vendor Panels"} data-testid="pf-save-panels" className="bg-[#0057FF]">
                        {saving === "Vendor Panels" ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Save Vendor Panels
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "agreement" && (
              <div className="space-y-4">
                <Card>
                  <EditSectionHeader icon={ScrollText} title="Agreement Details" description="Contract type, dates and renewal settings" />
                  <CardContent className="space-y-4">
                    <Field label="Agreement Type">
                      <Select value={pf.agreementType} onValueChange={v => upPf("agreementType", v)}>
                        <SelectTrigger data-testid="pf-agreement-type"><SelectValue placeholder="Select agreement type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard Agreement</SelectItem>
                          <SelectItem value="exclusive">Exclusive Territory Agreement</SelectItem>
                          <SelectItem value="franchise">Franchise Agreement</SelectItem>
                          <SelectItem value="white_label">White Label Agreement</SelectItem>
                          <SelectItem value="custom">Custom Agreement</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <FieldGroup>
                      <Field label="Agreement Start Date"><Input type="date" value={pf.agreementStartDate} onChange={e => upPf("agreementStartDate", e.target.value)} data-testid="pf-agreement-start" /></Field>
                      <Field label="Agreement End Date"><Input type="date" value={pf.agreementEndDate} onChange={e => upPf("agreementEndDate", e.target.value)} data-testid="pf-agreement-end" /></Field>
                    </FieldGroup>
                    <FieldGroup>
                      <Field label="Join Date"><Input type="date" value={pf.joinDate} onChange={e => upPf("joinDate", e.target.value)} data-testid="pf-join-date" /></Field>
                      <Field label="Support Level">
                        <Select value={pf.supportLevel} onValueChange={v => upPf("supportLevel", v)}>
                          <SelectTrigger data-testid="pf-support-level"><SelectValue placeholder="Select support level" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="dedicated">Dedicated</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div><p className="text-sm font-medium">Auto-Renewal</p><p className="text-xs text-muted-foreground">Automatically renew agreement when it expires</p></div>
                      <Switch checked={pf.autoRenewal} onCheckedChange={v => upPf("autoRenewal", v)} data-testid="pf-auto-renewal" />
                    </div>
                    <FieldGroup>
                      <Field label="Max Customer Limit"><Input type="number" min="0" value={pf.maxCustomerLimit} onChange={e => upPf("maxCustomerLimit", e.target.value)} placeholder="Leave blank for unlimited" data-testid="pf-max-customers" /></Field>
                    </FieldGroup>
                    <Field label="Agreement Summary (Preview)">
                      {pf.agreementType ? (
                        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 p-4 space-y-2">
                          <div className="flex items-center gap-2"><ScrollText className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-blue-800 dark:text-blue-200 text-sm">{pf.agreementType === "standard" ? "Standard Agreement" : pf.agreementType === "exclusive" ? "Exclusive Territory" : pf.agreementType === "franchise" ? "Franchise Agreement" : pf.agreementType === "white_label" ? "White Label Agreement" : "Custom Agreement"}</span>
                          </div>
                          <div className="flex gap-4 text-xs">
                            {pf.agreementStartDate && <div><p className="text-muted-foreground">Start</p><p className="font-medium">{new Date(pf.agreementStartDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</p></div>}
                            {pf.agreementEndDate && <div><p className="text-muted-foreground">End</p><p className="font-medium">{new Date(pf.agreementEndDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</p></div>}
                          </div>
                          <Badge className={`text-xs ${pf.autoRenewal ? "bg-green-100 text-green-700 border-0" : "bg-gray-100 text-gray-600 border-0"}`}>
                            {pf.autoRenewal ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Auto-Renewal On</> : "Manual Renewal"}
                          </Badge>
                        </div>
                      ) : <p className="text-xs text-muted-foreground">Select an agreement type to see the summary.</p>}
                    </Field>
                    <Separator />
                    <FileUploadPreview label="Agreement Document" value={pf.agreementFile} onChange={url => upPf("agreementFile", url)} testId="pf-upload-agreement" />

                    <div className="flex justify-end pt-2">
                      <Button onClick={() => saveSection("Agreement", { agreementType: pf.agreementType || null, agreementStartDate: pf.agreementStartDate || null, agreementEndDate: pf.agreementEndDate || null, joinDate: pf.joinDate || null, autoRenewal: pf.autoRenewal, supportLevel: pf.supportLevel || null, maxCustomerLimit: pf.maxCustomerLimit ? parseInt(pf.maxCustomerLimit) : null, agreementFile: pf.agreementFile || null })} disabled={saving === "Agreement"} data-testid="pf-save-agreement" className="bg-[#0057FF]">
                        {saving === "Agreement" ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Save Agreement
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-4">
                <Card>
                  <EditSectionHeader icon={Image} title="Profile Photo" description="Upload or change the reseller's profile photo" />
                  <CardContent>
                    <div className="max-w-sm">
                      <FileUploadPreview label="Profile Picture" value={pf.profilePicture} onChange={url => upPf("profilePicture", url)} testId="pf-upload-profile-pic" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <EditSectionHeader icon={FileText} title="Document Uploads" description="Upload CNIC and office documents for verification" />
                  <CardContent className="space-y-5">
                    <FieldGroup>
                      <FileUploadPreview label="CNIC Front" value={pf.cnicPicture} onChange={url => upPf("cnicPicture", url)} testId="pf-upload-cnic-front" />
                      <FileUploadPreview label="CNIC Back" value={pf.cnicBackPicture} onChange={url => upPf("cnicBackPicture", url)} testId="pf-upload-cnic-back" />
                    </FieldGroup>
                    <Separator />
                    <div className="max-w-sm">
                      <FileUploadPreview label="Office Picture" value={pf.officePicture} onChange={url => upPf("officePicture", url)} testId="pf-upload-office" />
                    </div>
                    <Separator />
                    <FieldGroup>
                      <FileUploadPreview label="Registration Form" value={pf.registrationFormPicture} onChange={url => upPf("registrationFormPicture", url)} testId="pf-upload-reg-form" />
                      <Field label="Registration Form No">
                        <Input value={pf.registrationFormNo} onChange={e => upPf("registrationFormNo", e.target.value)} placeholder="Registration form number" data-testid="pf-reg-form-no" />
                      </Field>
                    </FieldGroup>

                    <div className="flex justify-end pt-2">
                      <Button onClick={() => saveSection("Documents", { profilePicture: pf.profilePicture || null, cnicPicture: pf.cnicPicture || null, cnicBackPicture: pf.cnicBackPicture || null, officePicture: pf.officePicture || null, registrationFormPicture: pf.registrationFormPicture || null, registrationFormNo: pf.registrationFormNo || null })} disabled={saving === "Documents"} data-testid="pf-save-documents" className="bg-[#0057FF]">
                        {saving === "Documents" ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Save Documents
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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

      <Dialog open={mapPickerOpen} onOpenChange={setMapPickerOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base"><Map className="h-4 w-4 text-blue-600" /> Pick Location on Map</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Click anywhere on the map to drop a pin. Confirm to save the coordinates.</p>
          </DialogHeader>
          <div className="h-[420px] w-full">
            <MapContainer center={mapPickedPos ? [mapPickedPos.lat, mapPickedPos.lng] : [30.3753, 69.3451]} zoom={mapPickedPos ? 15 : 5} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
              <MapClickHandler onPick={(lat, lng) => setMapPickedPos({ lat, lng })} />
              {mapPickedPos && <Marker position={[mapPickedPos.lat, mapPickedPos.lng]} icon={editMarkerIcon} />}
            </MapContainer>
          </div>
          <DialogFooter className="px-5 py-3 bg-muted/30 border-t flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {mapPickedPos ? <span className="font-medium text-foreground">📍 {mapPickedPos.lat.toFixed(6)}, {mapPickedPos.lng.toFixed(6)}</span> : "No location selected — click on the map"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setMapPickerOpen(false)}>Cancel</Button>
              <Button size="sm" disabled={!mapPickedPos} onClick={() => {
                if (!mapPickedPos) return;
                upPf("mapLatitude", String(mapPickedPos.lat));
                upPf("mapLongitude", String(mapPickedPos.lng));
                setMapPickerOpen(false);
              }} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Check className="h-3.5 w-3.5 mr-1" /> Confirm Location
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
