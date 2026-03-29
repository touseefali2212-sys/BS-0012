import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft, Building2, Mail, Phone, Edit, Save, ChevronRight,
  Shield, Network, Activity, DollarSign, AlertCircle, RefreshCw,
  Calendar, Download, MessageCircle, CalendarRange, User, Hash,
  CreditCard, Globe, CheckCircle2, FileText, Plus, Clock, TrendingUp,
  TrendingDown, BarChart3, MessageSquare, ShoppingBag, Users, Bell,
  Wallet, Store, Percent, Landmark, MapPin, Briefcase, Key, Wifi, Navigation,
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertResellerSchema, type Reseller, type InsertReseller } from "@shared/schema";

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

function ResellerEditDialog({ open, onClose, reseller, id }: { open: boolean; onClose: () => void; reseller: Reseller; id: string }) {
  const { toast } = useToast();
  const [section, setSection] = useState(0);
  const form = useForm<InsertReseller>({ resolver: zodResolver(insertResellerSchema), defaultValues: reseller as any });
  const updateMutation = useMutation({
    mutationFn: async (data: InsertReseller) => { const res = await apiRequest("PATCH", `/api/resellers/${id}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/resellers", id] }); queryClient.invalidateQueries({ queryKey: ["/api/resellers"] }); onClose(); toast({ title: "Reseller updated successfully" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const sections = ["Personal Info", "Location & Contact", "Network & Service", "Billing & Finance", "Commission & Bank", "Agreement & Settings", "Vendor Panels"];
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Update Reseller — {reseller.name}</DialogTitle></DialogHeader>
        <div className="flex flex-wrap gap-1.5 pb-2 border-b">
          {sections.map((s, i) => (<button key={s} onClick={() => setSection(i)} className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${section === i ? "bg-[#1c67d4] text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{s}</button>))}
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
            {section === 0 && (<div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Reseller Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="fatherName" render={({ field }) => (<FormItem><FormLabel>Father Name</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="cnic" render={({ field }) => (<FormItem><FormLabel>CNIC / NIC</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="dateOfBirth" render={({ field }) => (<FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="occupation" render={({ field }) => (<FormItem><FormLabel>Occupation</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="resellerType" render={({ field }) => (<FormItem><FormLabel>Reseller Type</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value || "active"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="blocked">Blocked</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>)}
            {section === 1 && (<div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Mobile No *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="secondaryPhone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="branch" render={({ field }) => (<FormItem><FormLabel>Branch</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="area" render={({ field }) => (<FormItem><FormLabel>Area</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="mapLatitude" render={({ field }) => (<FormItem><FormLabel>Latitude</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g. 31.5204" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="mapLongitude" render={({ field }) => (<FormItem><FormLabel>Longitude</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g. 74.3587" /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => { form.setValue("mapLatitude", pos.coords.latitude.toFixed(6)); form.setValue("mapLongitude", pos.coords.longitude.toFixed(6)); },
                    () => {},
                  );
                }
              }} data-testid="button-get-gps-edit">
                <Navigation className="h-4 w-4 mr-1.5" /> Get GPS from Device
              </Button>
            </div>)}
            {section === 2 && (<div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="uplinkType" render={({ field }) => (<FormItem><FormLabel>Uplink Type</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent><SelectItem value="fiber">Fiber</SelectItem><SelectItem value="wireless">Wireless</SelectItem><SelectItem value="copper">Copper</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="uplink" render={({ field }) => (<FormItem><FormLabel>Uplink</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent><SelectItem value="dedicated">Dedicated</SelectItem><SelectItem value="shared">Shared</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="exchangeTowerPopName" render={({ field }) => (<FormItem><FormLabel>Exchange/Tower/POP</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="portId" render={({ field }) => (<FormItem><FormLabel>Port ID</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="vlanId" render={({ field }) => (<FormItem><FormLabel>VLAN ID</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="media" render={({ field }) => (<FormItem><FormLabel>Media</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent><SelectItem value="sfp">SFP</SelectItem><SelectItem value="utp">UTP</SelectItem><SelectItem value="dish">Dish</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="connectionType" render={({ field }) => (<FormItem><FormLabel>Connection Type</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bandwidthPlan" render={({ field }) => (<FormItem><FormLabel>Bandwidth Plan</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="ipAssignment" render={({ field }) => (<FormItem><FormLabel>IP Assignment</FormLabel><Select onValueChange={field.onChange} value={field.value || "dynamic"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="dynamic">Dynamic</SelectItem><SelectItem value="static">Static</SelectItem><SelectItem value="pppoe">PPPoE</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="nasId" render={({ field }) => (<FormItem><FormLabel>NAS ID</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="serviceZone" render={({ field }) => (<FormItem><FormLabel>Service Zone</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            </div>)}
            {section === 3 && (<div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="walletBalance" render={({ field }) => (<FormItem><FormLabel>Wallet Balance</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="creditLimit" render={({ field }) => (<FormItem><FormLabel>Credit Limit</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="securityDeposit" render={({ field }) => (<FormItem><FormLabel>Security Deposit</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="openingBalance" render={({ field }) => (<FormItem><FormLabel>Opening Balance</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="billingCycle" render={({ field }) => (<FormItem><FormLabel>Billing Cycle</FormLabel><Select onValueChange={field.onChange} value={field.value || "monthly"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="paymentMethod" render={({ field }) => (<FormItem><FormLabel>Payment Method</FormLabel><Select onValueChange={field.onChange} value={field.value || "cash"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="online">Online</SelectItem><SelectItem value="cheque">Cheque</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
            </div>)}
            {section === 4 && (<div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="commissionRate" render={({ field }) => (<FormItem><FormLabel>Commission Rate (%)</FormLabel><FormControl><Input type="number" {...field} value={field.value || "10"} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="commissionPaymentMethod" render={({ field }) => (<FormItem><FormLabel>Commission Method</FormLabel><Select onValueChange={field.onChange} value={field.value || "wallet"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="wallet">Wallet</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cash">Cash</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="commissionPaymentFrequency" render={({ field }) => (<FormItem><FormLabel>Frequency</FormLabel><Select onValueChange={field.onChange} value={field.value || "monthly"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="bankName" render={({ field }) => (<FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bankAccountTitle" render={({ field }) => (<FormItem><FormLabel>Account Title</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="bankAccountNumber" render={({ field }) => (<FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bankBranchCode" render={({ field }) => (<FormItem><FormLabel>Branch Code</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </div>)}
            {section === 5 && (<div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="agreementStartDate" render={({ field }) => (<FormItem><FormLabel>Agreement Start</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="agreementEndDate" render={({ field }) => (<FormItem><FormLabel>Agreement End</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="agreementType" render={({ field }) => (<FormItem><FormLabel>Agreement Type</FormLabel><Select onValueChange={field.onChange} value={field.value || "standard"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="standard">Standard</SelectItem><SelectItem value="premium">Premium</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="joinDate" render={({ field }) => (<FormItem><FormLabel>Join Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="autoRenewal" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Auto Renewal</FormLabel></FormItem>)} />
                <FormField control={form.control} name="supportLevel" render={({ field }) => (<FormItem><FormLabel>Support Level</FormLabel><Select onValueChange={field.onChange} value={field.value || "standard"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="standard">Standard</SelectItem><SelectItem value="priority">Priority</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="maxCustomerLimit" render={({ field }) => (<FormItem><FormLabel>Max Customer Limit</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            </div>)}
            {section === 6 && (<div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="vendorPanelAllowed" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Vendor Panel Allowed</FormLabel></FormItem>)} />
                <FormField control={form.control} name="vlanIdAllowed" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>VLAN ID Allowed</FormLabel></FormItem>)} />
              </div>
              <FormField control={form.control} name="vlanIdNote" render={({ field }) => (<FormItem><FormLabel>VLAN ID Note</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="panelUrl" render={({ field }) => (<FormItem><FormLabel>Panel URL</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="panelUsername" render={({ field }) => (<FormItem><FormLabel>Panel Username</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="panelPassword" render={({ field }) => (<FormItem><FormLabel>Panel Password</FormLabel><FormControl><Input type="password" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            </div>)}
            <div className="flex items-center justify-between gap-2 pt-4 border-t">
              <div className="flex gap-2">
                {section > 0 && <Button type="button" variant="outline" size="sm" onClick={() => setSection(s => s - 1)}>← Previous</Button>}
                {section < sections.length - 1 && <Button type="button" variant="outline" size="sm" onClick={() => setSection(s => s + 1)}>Next →</Button>}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                <Button type="submit" size="sm" disabled={updateMutation.isPending} className="bg-[#1c67d4] text-white">
                  {updateMutation.isPending ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</> : <><Save className="h-3.5 w-3.5 mr-1.5" />Save All</>}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function ResellerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  const [editOpen, setEditOpen] = useState(false);

  const { data: reseller, isLoading } = useQuery<Reseller>({
    queryKey: ["/api/resellers", id],
    queryFn: async () => { const res = await fetch(`/api/resellers/${id}`, { credentials: "include" }); if (!res.ok) throw new Error("Failed to fetch"); return res.json(); },
    enabled: !!id,
  });
  const { data: vendors } = useQuery<any[]>({ queryKey: ["/api/vendors"] });
  const { data: walletTxns, isLoading: txnsLoading } = useQuery<any[]>({
    queryKey: ["/api/reseller-wallet-transactions", id],
    queryFn: async () => { const res = await fetch(`/api/reseller-wallet-transactions/${id}`, { credentials: "include" }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    enabled: !!id,
  });

  const statusUpdateMutation = useMutation({
    mutationFn: async (status: string) => { const res = await apiRequest("PATCH", `/api/resellers/${id}`, { status }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/resellers", id] }); queryClient.invalidateQueries({ queryKey: ["/api/resellers"] }); toast({ title: "Status updated" }); },
  });

  const vendor = vendors?.find(v => v.id === reseller?.vendorId);

  const tabsRow1 = [
    { key: "personal", label: "Personal Information" },
    { key: "service", label: "Network & Service" },
    { key: "financial", label: "Billing & Finance" },
    { key: "commission", label: "Commission & Bank" },
    { key: "agreement", label: "Agreement & Settings" },
    { key: "panel", label: "Vendor Panels" },
  ];
  const tabsRow2 = [
    { key: "wallet", label: "Wallet Transactions" },
    { key: "customers", label: "Customer Summary" },
    { key: "complain", label: "Complain History" },
    { key: "sms", label: "SMS Message History" },
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
            <ProfileSidebarItem icon={Percent} label="Commission" value={`${reseller.commissionRate || "10"}%`} testId="sidebar-commission" />
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
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" onClick={() => setEditOpen(true)} data-testid="btn-update-info"><Edit className="h-3 w-3" /> Update Information</Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" data-testid="btn-status-scheduler"><CalendarRange className="h-3 w-3" /> Status Scheduler</Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" data-testid="btn-send-message"><MessageCircle className="h-3 w-3" /> Send Email/Message</Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" onClick={() => setActiveTab("wallet")} data-testid="btn-wallet-history"><Wallet className="h-3 w-3" /> Wallet History</Button>
            </div>
            <Button size="sm" className="w-full text-xs h-9 gap-1.5 bg-[#0057FF]" data-testid="btn-download-info"><Download className="h-3.5 w-3.5" /> Download Information</Button>
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

                <SectionHeader title="IP & Service Settings" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="IP Assignment" value={reseller.ipAssignment} capitalize />
                    <InfoRow label="NAS ID" value={<span className="font-mono">{reseller.nasId}</span>} />
                    <InfoRow label="Service Zone" value={reseller.serviceZone} />
                    <InfoRow label="Vendor" value={vendor?.name} />
                    <InfoRow label="VLAN ID Allowed" value={<BoolValue v={reseller.vlanIdAllowed} />} />
                    <InfoRow label="Vendor Panel Allowed" value={<BoolValue v={reseller.vendorPanelAllowed} />} />
                  </div>
                </div>
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
              </div>
            )}

            {activeTab === "commission" && (
              <div className="space-y-4">
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

            {activeTab === "agreement" && (
              <div className="space-y-4">
                <SectionHeader title="Agreement Details" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Agreement Type" value={reseller.agreementType} capitalize />
                    <InfoRow label="Agreement Start" value={formatDate(reseller.agreementStartDate)} />
                    <InfoRow label="Agreement End" value={formatDate(reseller.agreementEndDate)} />
                    <InfoRow label="Join Date" value={formatDate(reseller.joinDate)} />
                    <InfoRow label="Auto Renewal" value={<BoolValue v={reseller.autoRenewal} />} />
                    <InfoRow label="Support Level" value={reseller.supportLevel} capitalize />
                  </div>
                </div>

                <SectionHeader title="Limits & Notes" />
                <div className="bg-card border rounded-lg overflow-hidden divide-y">
                  <InfoRow label="Max Customer Limit" value={reseller.maxCustomerLimit ? String(reseller.maxCustomerLimit) : "Unlimited"} />
                  <InfoRow label="Total Customers" value={String(reseller.totalCustomers || 0)} />
                </div>
                {reseller.notes && (<><SectionHeader title="Notes" /><div className="bg-card border rounded-lg px-4 py-3 text-sm">{reseller.notes}</div></>)}
              </div>
            )}

            {activeTab === "panel" && (
              <div className="space-y-4">
                <SectionHeader title="Vendor Panel Access" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Vendor Panel Allowed" value={<BoolValue v={reseller.vendorPanelAllowed} />} />
                    <InfoRow label="VLAN ID Allowed" value={<BoolValue v={reseller.vlanIdAllowed} />} />
                  </div>
                </div>
                {reseller.vlanIdNote && (
                  <><SectionHeader title="VLAN ID Note" /><div className="bg-card border rounded-lg px-4 py-3 text-sm">{reseller.vlanIdNote}</div></>
                )}

                <SectionHeader title="Assigned Vendor Panels" />
                {panels.length === 0 ? (
                  <EmptyState icon={Globe} message="No vendor panels assigned" />
                ) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-[#1a3a5c]">
                        <TableHead className="text-white text-xs">#</TableHead>
                        <TableHead className="text-white text-xs">Vendor Name</TableHead>
                        <TableHead className="text-white text-xs">Panel URL</TableHead>
                        <TableHead className="text-white text-xs">Username</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {panels.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs">{i + 1}</TableCell>
                            <TableCell className="text-xs font-medium">{p.vendorName}</TableCell>
                            <TableCell className="text-xs text-blue-600">{p.panelUrl}</TableCell>
                            <TableCell className="text-xs">{p.panelUsername}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <SectionHeader title="Network Details" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Port ID" value={<span className="font-mono">{reseller.portId}</span>} />
                    <InfoRow label="VLAN ID" value={<span className="font-mono">{reseller.vlanId}</span>} />
                    <InfoRow label="Media" value={reseller.media ? reseller.media.toUpperCase() : null} />
                    <InfoRow label="Exchange/Tower/POP" value={reseller.exchangeTowerPopName} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "wallet" && (
              <div className="space-y-4">
                <SectionHeader title="Wallet Transaction History" />
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

            {activeTab === "customers" && (
              <div className="space-y-4">
                <SectionHeader title="Customer Summary" />
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Total Customers</p>
                      <p className="text-2xl font-bold text-green-700" data-testid="profile-total-customers">{reseller.totalCustomers || 0}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Max Customer Limit</p>
                      <p className="text-2xl font-bold text-blue-700">{reseller.maxCustomerLimit || "Unlimited"}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Commission Rate</p>
                      <p className="text-2xl font-bold text-purple-700">{reseller.commissionRate || "10"}%</p>
                    </CardContent>
                  </Card>
                </div>
                <EmptyState icon={Users} message="Detailed customer list will be shown here once connected" />
              </div>
            )}

            {activeTab === "complain" && (
              <div className="space-y-4">
                <SectionHeader title="Complain History" />
                <EmptyState icon={AlertCircle} message="No complaints found for this reseller" />
              </div>
            )}

            {activeTab === "sms" && (
              <div className="space-y-4">
                <SectionHeader title="SMS Message History" />
                <EmptyState icon={MessageSquare} message="No SMS message history available" />
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

      {reseller && (
        <ResellerEditDialog open={editOpen} onClose={() => setEditOpen(false)} reseller={reseller} id={id || ""} />
      )}
    </div>
  );
}
