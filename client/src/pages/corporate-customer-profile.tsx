import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft, Building2, Mail, Phone, Edit, Save, ChevronRight,
  Shield, Network, Activity, DollarSign, AlertCircle, RefreshCw,
  Calendar, Download, MessageCircle, CalendarRange, User, Hash,
  CreditCard, Globe, CheckCircle2, FileText, Plus, BarChart3,
  TrendingUp, TrendingDown, MessageSquare, ShoppingBag, Users,
  Trash2, MoreHorizontal, Wifi, Send, Clock,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertCorporateCustomerSchema, insertCorporateConnectionSchema,
  type CorporateCustomer, type InsertCorporateCustomer,
  type CorporateConnection, type InsertCorporateConnection,
} from "@shared/schema";

const INDUSTRY_OPTIONS = ["Technology", "Finance", "Healthcare", "Manufacturing", "Education", "Retail", "Government", "Telecom", "Real Estate", "Pharmaceutical", "Logistics", "Other"];

/* ─── Shared components (match customer-profile.tsx exactly) ─── */
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-0 flex-1">
        <div className="text-white text-xs font-semibold px-5 py-2.5 rounded-md flex-1 bg-[#1c67d4]">{title}</div>
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
      <div className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 opacity-60" /><span className="opacity-80">{label}:</span></div>
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

/* ─── Corporate Edit Dialog ─── */
function CorpEditDialog({ open, onClose, customer, id }: { open: boolean; onClose: () => void; customer: CorporateCustomer; id: string }) {
  const { toast } = useToast();
  const [section, setSection] = useState(0);
  const form = useForm<InsertCorporateCustomer>({ resolver: zodResolver(insertCorporateCustomerSchema), defaultValues: customer as any });
  const updateMutation = useMutation({
    mutationFn: async (data: InsertCorporateCustomer) => { const res = await apiRequest("PATCH", `/api/corporate-customers/${id}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/corporate-customers", id] }); queryClient.invalidateQueries({ queryKey: ["/api/corporate-customers"] }); onClose(); toast({ title: "Corporate Customer updated successfully" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const sections = ["Company Info", "Billing", "Contract & SLA", "Services", "Summary"];
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Update Corporate Customer — {customer.companyName}</DialogTitle></DialogHeader>
        <div className="flex flex-wrap gap-1.5 pb-2 border-b">
          {sections.map((s, i) => (<button key={s} onClick={() => setSection(i)} className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${section === i ? "bg-[#1c67d4] text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{s}</button>))}
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
            {section === 0 && (<div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="contactFullName" render={({ field }) => (<FormItem><FormLabel>Contact Full Name</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="registrationNumber" render={({ field }) => (<FormItem><FormLabel>Registration Number</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="ntn" render={({ field }) => (<FormItem><FormLabel>NTN</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="industryType" render={({ field }) => (<FormItem><FormLabel>Industry Type</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger></FormControl><SelectContent>{INDUSTRY_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="accountManager" render={({ field }) => (<FormItem><FormLabel>Account Manager</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="mobileNo" render={({ field }) => (<FormItem><FormLabel>Mobile No.</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value || "active"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="headOfficeAddress" render={({ field }) => (<FormItem><FormLabel>Head Office Address</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="billingAddress" render={({ field }) => (<FormItem><FormLabel>Billing Address</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            </div>)}
            {section === 1 && (<div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="billingMode" render={({ field }) => (<FormItem><FormLabel>Billing Mode</FormLabel><Select onValueChange={field.onChange} value={field.value || "fixed"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="fixed">Fixed</SelectItem><SelectItem value="per_mbps">Per Mbps</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="paymentTerms" render={({ field }) => (<FormItem><FormLabel>Payment Terms</FormLabel><Select onValueChange={field.onChange} value={field.value || "net_30"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="net_15">Net 15</SelectItem><SelectItem value="net_30">Net 30</SelectItem><SelectItem value="net_45">Net 45</SelectItem><SelectItem value="net_60">Net 60</SelectItem><SelectItem value="prepaid">Prepaid</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="monthlyBilling" render={({ field }) => (<FormItem><FormLabel>Monthly Billing</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="creditLimit" render={({ field }) => (<FormItem><FormLabel>Credit Limit</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="securityDeposit" render={({ field }) => (<FormItem><FormLabel>Security Deposit</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="centralizedBilling" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel>Centralized Billing</FormLabel></FormItem>)} />
                <FormField control={form.control} name="taxEnabled" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Tax Enabled</FormLabel></FormItem>)} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="whTaxPercent" render={({ field }) => (<FormItem><FormLabel>WHT Tax %</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="aitTaxPercent" render={({ field }) => (<FormItem><FormLabel>AIT Tax %</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="extraFeeTaxPercent" render={({ field }) => (<FormItem><FormLabel>Extra Fee Tax %</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </div>)}
            {section === 2 && (<div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="contractDuration" render={({ field }) => (<FormItem><FormLabel>Contract Duration</FormLabel><FormControl><Input placeholder="12 months" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="dedicatedAccountManager" render={({ field }) => (<FormItem><FormLabel>Dedicated Account Manager</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="contractStartDate" render={({ field }) => (<FormItem><FormLabel>Contract Start</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="contractExpiryDate" render={({ field }) => (<FormItem><FormLabel>Contract Expiry</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="customSla" render={({ field }) => (<FormItem><FormLabel>Custom SLA Terms</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="customPricingAgreement" render={({ field }) => (<FormItem><FormLabel>Custom Pricing Agreement</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            </div>)}
            {section === 3 && (<div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="managedRouter" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Managed Router</FormLabel></FormItem>)} />
                <FormField control={form.control} name="firewall" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Firewall</FormLabel></FormItem>)} />
                <FormField control={form.control} name="loadBalancer" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Load Balancer</FormLabel></FormItem>)} />
                <FormField control={form.control} name="dedicatedSupport" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Dedicated Support</FormLabel></FormItem>)} />
                <FormField control={form.control} name="backupLink" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Backup Link</FormLabel></FormItem>)} />
                <FormField control={form.control} name="monitoringSla" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Monitoring SLA</FormLabel></FormItem>)} />
                <FormField control={form.control} name="monitoringEnabled" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Monitoring</FormLabel></FormItem>)} />
                <FormField control={form.control} name="snmpMonitoring" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>SNMP</FormLabel></FormItem>)} />
                <FormField control={form.control} name="trafficAlerts" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Traffic Alerts</FormLabel></FormItem>)} />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <FormField control={form.control} name="radiusProfile" render={({ field }) => (<FormItem><FormLabel>Radius Profile</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bandwidthProfileName" render={({ field }) => (<FormItem><FormLabel>Bandwidth Profile</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </div>)}
            {section === 4 && (<div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="totalConnections" render={({ field }) => (<FormItem><FormLabel>Total Connections</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="totalBandwidth" render={({ field }) => (<FormItem><FormLabel>Total Bandwidth</FormLabel><FormControl><Input placeholder="200 Mbps" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={4} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
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

/* ─── Connection Dialog ─── */
function ConnectionDialog({ open, onClose, editing, corporateId, onSave, isPending }: { open: boolean; onClose: () => void; editing: CorporateConnection | null; corporateId: number; onSave: (d: InsertCorporateConnection) => void; isPending: boolean }) {
  const form = useForm<InsertCorporateConnection>({
    resolver: zodResolver(insertCorporateConnectionSchema),
    defaultValues: editing || { corporateId, branchName: "", location: "", packageType: "shared", bandwidth: "", staticIp: "", installationDate: new Date().toISOString().split("T")[0], status: "active", monthlyCharges: "0" },
  });
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editing ? "Edit Connection" : "Add Branch Connection"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField control={form.control} name="branchName" render={({ field }) => (<FormItem><FormLabel>Branch Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="packageType" render={({ field }) => (<FormItem><FormLabel>Package Type</FormLabel><Select onValueChange={field.onChange} value={field.value || "shared"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="shared">Shared</SelectItem><SelectItem value="dedicated">Dedicated</SelectItem><SelectItem value="cir">CIR</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="bandwidth" render={({ field }) => (<FormItem><FormLabel>Bandwidth</FormLabel><FormControl><Input placeholder="50 Mbps" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="staticIp" render={({ field }) => (<FormItem><FormLabel>Static IP</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="monthlyCharges" render={({ field }) => (<FormItem><FormLabel>Monthly Charges</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="installationDate" render={({ field }) => (<FormItem><FormLabel>Install Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value || "active"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button type="submit" size="sm" disabled={isPending} className="bg-[#1c67d4] text-white">{isPending ? "Saving..." : editing ? "Update" : "Add Connection"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Profile Page ─── */
export default function CorporateCustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  const [editOpen, setEditOpen] = useState(false);
  const [connDialogOpen, setConnDialogOpen] = useState(false);
  const [editingConn, setEditingConn] = useState<CorporateConnection | null>(null);
  const [schedulerDialogOpen, setSchedulerDialogOpen] = useState(false);
  const [schedulerType, setSchedulerType] = useState("installation");
  const [schedulerDate, setSchedulerDate] = useState("");
  const [schedulerTime, setSchedulerTime] = useState("10:00");
  const [schedulerAssignee, setSchedulerAssignee] = useState("");
  const [schedulerPriority, setSchedulerPriority] = useState("normal");
  const [schedulerNotes, setSchedulerNotes] = useState("");
  const [smsProfileDialogOpen, setSmsProfileDialogOpen] = useState(false);
  const [smsProfileChannel, setSmsProfileChannel] = useState("email");
  const [smsProfileSubject, setSmsProfileSubject] = useState("");
  const [smsProfileMessage, setSmsProfileMessage] = useState("");

  const { data: customer, isLoading } = useQuery<CorporateCustomer>({
    queryKey: ["/api/corporate-customers", id],
    queryFn: async () => { const res = await fetch(`/api/corporate-customers/${id}`, { credentials: "include" }); if (!res.ok) throw new Error("Failed to fetch"); return res.json(); },
    enabled: !!id,
  });
  const { data: connections } = useQuery<CorporateConnection[]>({
    queryKey: ["/api/corporate-connections", id],
    enabled: !!id,
  });
  const { data: invoices, isLoading: invoicesLoading } = useQuery<any[]>({
    queryKey: ["/api/corporate-customers", id, "invoices"],
    queryFn: async () => { const res = await fetch(`/api/corporate-customers/${id}/invoices`, { credentials: "include" }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    enabled: !!id,
  });
  const { data: tickets, isLoading: ticketsLoading } = useQuery<any[]>({
    queryKey: ["/api/corporate-customers", id, "tickets"],
    queryFn: async () => { const res = await fetch(`/api/corporate-customers/${id}/tickets`, { credentials: "include" }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    enabled: !!id,
  });
  const { data: bwHistory, isLoading: bwLoading } = useQuery<any[]>({
    queryKey: ["/api/corporate-customers", id, "bandwidth-history"],
    queryFn: async () => { const res = await fetch(`/api/corporate-customers/${id}/bandwidth-history`, { credentials: "include" }); if (!res.ok) throw new Error("Failed"); return res.json(); },
    enabled: !!id,
  });

  const { data: packageChangeReqs, isLoading: pcrLoading } = useQuery<any[]>({
    queryKey: ["/api/corporate-customers", id, "package-change-requests"],
    queryFn: async () => { const res = await fetch(`/api/corporate-customers/${id}/package-change-requests`, { credentials: "include" }); if (!res.ok) return []; return res.json(); },
    enabled: !!id,
  });

  const { data: serviceRequests } = useQuery<any[]>({
    queryKey: ["/api/corporate-customers", id, "service-requests"],
    queryFn: async () => { try { const res = await fetch(`/api/corporate-customers/${id}/service-requests`, { credentials: "include" }); if (!res.ok) return []; return res.json(); } catch { return []; } },
    enabled: !!id,
  });

  const statusUpdateMutation = useMutation({
    mutationFn: async (status: string) => { const res = await apiRequest("PATCH", `/api/corporate-customers/${id}`, { status }); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/corporate-customers", id] }); toast({ title: "Status updated" }); },
  });

  const scheduleServiceMutation = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", `/api/corporate-customers/${id}/service-requests`, data); return res.json(); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corporate-customers", id, "service-requests"] });
      toast({ title: "Service Scheduled" }); setSchedulerDialogOpen(false);
      setSchedulerType("installation"); setSchedulerDate(""); setSchedulerTime("10:00");
      setSchedulerAssignee(""); setSchedulerPriority("normal"); setSchedulerNotes("");
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const sendProfileNotificationMutation = useMutation({
    mutationFn: async (data: { channel: string; subject: string; message: string }) => {
      if (data.channel === "email") {
        if (!customer?.email) throw new Error("No email address");
        const res = await apiRequest("POST", "/api/notifications/send-email", { to: customer.email, subject: data.subject, body: data.message }); return res.json();
      } else {
        const phone = customer?.mobileNo || customer?.phone;
        if (!phone) throw new Error("No phone number");
        const res = await apiRequest("POST", "/api/notifications/send-sms", { to: phone, message: data.message }); return res.json();
      }
    },
    onSuccess: (_, vars) => { toast({ title: "Sent", description: `${vars.channel === "email" ? "Email" : "SMS"} sent` }); setSmsProfileDialogOpen(false); },
    onError: (err: Error) => { toast({ title: "Failed", description: err.message, variant: "destructive" }); },
  });

  const createConnMutation = useMutation({
    mutationFn: async (data: InsertCorporateConnection) => { const res = await apiRequest("POST", "/api/corporate-connections", data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/corporate-connections", id] }); setConnDialogOpen(false); setEditingConn(null); toast({ title: "Connection added" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const updateConnMutation = useMutation({
    mutationFn: async ({ connId, data }: { connId: number; data: Partial<InsertCorporateConnection> }) => { const res = await apiRequest("PATCH", `/api/corporate-connections/${connId}`, data); return res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/corporate-connections", id] }); setConnDialogOpen(false); setEditingConn(null); toast({ title: "Connection updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const deleteConnMutation = useMutation({
    mutationFn: async (connId: number) => { await apiRequest("DELETE", `/api/corporate-connections/${connId}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/corporate-connections", id] }); toast({ title: "Connection removed" }); },
  });

  const openAddConn = () => { setEditingConn(null); setConnDialogOpen(true); };
  const openEditConn = (c: CorporateConnection) => { setEditingConn(c); setConnDialogOpen(true); };
  const onConnSave = (data: InsertCorporateConnection) => {
    if (editingConn) updateConnMutation.mutate({ connId: editingConn.id, data });
    else createConnMutation.mutate(data);
  };

  const tabsRow1 = [
    { key: "personal", label: "Personal Information" },
    { key: "service", label: "Service Information" },
    { key: "network", label: "Network & Infrastructure" },
    { key: "contract", label: "Contract & SLA" },
    { key: "vas", label: "Value Added Services" },
    { key: "monitoring", label: "Monitoring" },
    { key: "invoices", label: "Generated & Updated Bill/Invoices" },
  ];
  const tabsRow2 = [
    { key: "bwhistory", label: "Bandwidth Upgrade & Downgrade History" },
    { key: "received", label: "Received Bill History" },
    { key: "complain", label: "Complain History" },
    { key: "sms", label: "SMS Message History" },
    { key: "sales", label: "Product & Service Sales Invoices" },
    { key: "referrals", label: "Referrals" },
    { key: "connections", label: "Connections" },
    { key: "service_scheduler", label: "Service Scheduler" },
  ];

  if (isLoading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-0"><Skeleton className="h-[600px] w-[280px] shrink-0" /><Skeleton className="h-[600px] flex-1" /></div>
    </div>
  );
  if (!customer) return (
    <div className="p-6 space-y-4">
      <Link href="/corporate-customers"><Button variant="ghost"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
      <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><AlertCircle className="h-12 w-12 mb-3 opacity-30" /><p>Corporate Customer not found</p></CardContent></Card>
    </div>
  );

  return (
    <div className="space-y-0">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#0057FF]" />
          <h1 className="text-lg font-bold">Profile</h1>
          <span className="text-xs text-muted-foreground">Corporate Client Profile</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/corporate-customers" className="text-[#0057FF]">Corporate</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/corporate-customers" className="text-[#0057FF]">Client list</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Profile</span>
        </div>
      </div>

      <div className="flex gap-0 min-h-[calc(100vh-120px)]">
        {/* ── Sidebar ── */}
        <div className="w-[280px] shrink-0 border-r bg-gradient-to-b from-[#1a2332] to-[#243447] text-white">
          <div className="flex flex-col items-center pt-6 pb-4 px-4">
            <div className="w-28 h-28 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center mb-3">
              <Building2 className="h-14 w-14 text-white/50" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
              <Mail className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
              <Phone className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
            </div>
            <h2 className="text-lg font-bold text-center">{customer.companyName}</h2>
            <p className="text-xs opacity-70">{customer.industryType || "Corporate"}</p>
          </div>
          <div className="px-4 space-y-0 text-xs border-t border-white/10 pt-4">
            <ProfileSidebarItem icon={Hash} label="Client Code" value={`CORP-${customer.id}`} />
            <ProfileSidebarItem icon={User} label="Contact Person" value={customer.contactFullName || customer.companyName} />
            <ProfileSidebarItem icon={DollarSign} label="Monthly Billing" value={`Rs. ${parseFloat(customer.monthlyBilling || "0").toLocaleString()}`} />
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 opacity-60" /><span className="opacity-80">Active Status</span></div>
              <Switch checked={customer.status === "active"} onCheckedChange={(c) => statusUpdateMutation.mutate(c ? "active" : "suspended")} className="scale-75" />
            </div>
            <ProfileSidebarItem icon={Network} label="Connections" value={String(customer.totalConnections || 0)} />
            <ProfileSidebarItem icon={Wifi} label="Total Bandwidth" value={customer.totalBandwidth || "Not set"} />
            <ProfileSidebarItem icon={CreditCard} label="Payment Terms" value={(customer.paymentTerms || "net_30").replace("_", " ")} />
            <ProfileSidebarItem icon={Calendar} label="Contract Expiry" value={customer.contractExpiryDate || "Not set"} />
          </div>
          <div className="px-4 pt-4 pb-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" onClick={() => setEditOpen(true)}><Edit className="h-3 w-3" /> Update Information</Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" onClick={() => setActiveTab("service_scheduler")}><CalendarRange className="h-3 w-3" /> Status Scheduler</Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" onClick={() => { setSmsProfileChannel("email"); setSmsProfileSubject(""); setSmsProfileMessage(""); setSmsProfileDialogOpen(true); }}><MessageCircle className="h-3 w-3" /> Send Email/Message</Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" onClick={() => setActiveTab("connections")}><Network className="h-3 w-3" /> View Connections</Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1 col-span-2" data-testid="button-package-change" onClick={() => setLocation(`/package-change?customerType=Corporate&customerId=${id}&customerName=${encodeURIComponent(customer.companyName)}`)}><ArrowUpDown className="h-3 w-3" /> Package Change Request</Button>
            </div>
            <Button size="sm" className="w-full text-xs h-9 gap-1.5 bg-[#0057FF]"><Download className="h-3.5 w-3.5" /> Download Information</Button>
            <Link href="/corporate-customers"><Button size="sm" variant="outline" className="w-full text-xs h-9 gap-1.5 text-white border-white/30"><ArrowLeft className="h-3.5 w-3.5" /> Go To Corporate List</Button></Link>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 bg-muted/30 overflow-hidden">
          {/* Tab Bar — two rows */}
          <div className="border-b bg-card">
            <div className="flex flex-wrap px-1 border-b border-border/50">
              {tabsRow1.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? "border-[#0057FF] text-[#0057FF]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  data-testid={`tab-corp-${tab.key}`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap px-1">
              {tabsRow2.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? "border-[#0057FF] text-[#0057FF]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  data-testid={`tab-corp-${tab.key}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 overflow-y-auto max-h-[calc(100vh-200px)] space-y-4">

            {/* SERVICE INFORMATION */}
            {activeTab === "service" && (
              <div className="space-y-4">
                <SectionHeader title="Internet Service Information" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Company Name" value={customer.companyName} />
                    <InfoRow label="Industry Type" value={customer.industryType} />
                    <InfoRow label="Billing Mode" value={customer.billingMode} capitalize />
                    <InfoRow label="Billing Status" value={<Badge variant="secondary" className={`capitalize text-[10px] ${customer.status === "active" ? "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950" : "text-red-700 bg-red-50"}`}>{customer.status}</Badge>} />
                    <InfoRow label="Total Connections" value={String(customer.totalConnections || 0)} />
                    <InfoRow label="Total Bandwidth" value={<span className="font-bold text-teal-700 dark:text-teal-400">{customer.totalBandwidth}</span>} />
                    <InfoRow label="Account Manager" value={customer.accountManager} />
                    <InfoRow label="Assigned To" value={customer.dedicatedAccountManager} />
                  </div>
                </div>

                <SectionHeader title="Package Billing" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Monthly Billing" value={<span className="font-bold text-green-700 dark:text-green-400">Rs. {parseFloat(customer.monthlyBilling || "0").toLocaleString()}</span>} />
                    <InfoRow label="Payment Terms" value={(customer.paymentTerms || "net_30").replace("_", " ")} capitalize />
                    <InfoRow label="Credit Limit" value={`Rs. ${parseFloat(customer.creditLimit || "0").toLocaleString()}`} />
                    <InfoRow label="Security Deposit" value={`Rs. ${parseFloat(customer.securityDeposit || "0").toLocaleString()}`} />
                    <InfoRow label="Centralized Billing" value={<BoolValue v={customer.centralizedBilling} />} />
                    <InfoRow label="Per-Branch Billing" value={<BoolValue v={customer.perBranchBilling} />} />
                  </div>
                </div>
              </div>
            )}

            {/* NETWORK & INFRASTRUCTURE */}
            {activeTab === "network" && (
              <div className="space-y-4">
                <SectionHeader title="Network Configuration" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Radius Profile" value={<span className="font-mono">{customer.radiusProfile}</span>} />
                    <InfoRow label="Bandwidth Profile Name" value={<span className="font-mono">{customer.bandwidthProfileName}</span>} />
                    <InfoRow label="Per Mbps Rate" value={customer.perMbpsRate ? `Rs. ${parseFloat(customer.perMbpsRate || "0").toLocaleString()}` : "-"} />
                    <InfoRow label="Bandwidth (Mbps)" value={customer.bandwidthMbps ? `${customer.bandwidthMbps} Mbps` : "-"} />
                    <InfoRow label="Total Bandwidth" value={customer.totalBandwidth} />
                    <InfoRow label="Total Connections" value={String(customer.totalConnections || 0)} />
                  </div>
                </div>

                <SectionHeader title="Branch Connections Overview" action={
                  <Button size="sm" onClick={openAddConn} className="bg-[#1c67d4] text-white text-xs h-8 gap-1"><Plus className="h-3.5 w-3.5" />Add</Button>
                } />
                {(connections || []).length === 0 ? (<EmptyState icon={Network} message="No connections yet" />) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-[#1a3a5c]">
                        <TableHead className="text-white text-xs">Branch</TableHead>
                        <TableHead className="text-white text-xs">Location</TableHead>
                        <TableHead className="text-white text-xs">Package</TableHead>
                        <TableHead className="text-white text-xs">Bandwidth</TableHead>
                        <TableHead className="text-white text-xs">Static IP</TableHead>
                        <TableHead className="text-white text-xs">Status</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {(connections || []).map(c => (
                          <TableRow key={c.id}>
                            <TableCell className="text-xs font-medium">{c.branchName}</TableCell>
                            <TableCell className="text-xs">{c.location || "—"}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px] capitalize">{c.packageType}</Badge></TableCell>
                            <TableCell className="text-xs font-medium text-teal-700 dark:text-teal-400">{c.bandwidth || "—"}</TableCell>
                            <TableCell><code className="text-[10px] bg-muted px-1 py-0.5 rounded">{c.staticIp || "—"}</code></TableCell>
                            <TableCell><Badge variant="secondary" className={`text-[10px] capitalize ${c.status === "active" ? "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950" : "text-red-700 bg-red-50"}`}>{c.status}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* PERSONAL INFORMATION */}
            {activeTab === "personal" && (
              <div className="space-y-4">
                <SectionHeader title="Company Information" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Company Name" value={customer.companyName} />
                    <InfoRow label="Contact Full Name" value={customer.contactFullName} />
                    <InfoRow label="Registration Number" value={customer.registrationNumber} />
                    <InfoRow label="NTN" value={customer.ntn} />
                    <InfoRow label="Industry Type" value={customer.industryType} />
                    <InfoRow label="Account Manager" value={customer.accountManager} />
                    <InfoRow label="Email" value={customer.email} />
                    <InfoRow label="Mobile No." value={customer.mobileNo} />
                    <InfoRow label="Phone" value={customer.phone} />
                    <InfoRow label="Branch" value={customer.branch} />
                    <InfoRow label="City" value={customer.city} />
                    <InfoRow label="Status" value={<Badge variant="secondary" className={`capitalize text-[10px] ${customer.status === "active" ? "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950" : "text-red-700 bg-red-50"}`}>{customer.status}</Badge>} />
                  </div>
                </div>
                <SectionHeader title="Address Information" />
                <div className="bg-card border rounded-lg overflow-hidden divide-y">
                  <InfoRow label="Head Office Address" value={customer.headOfficeAddress} />
                  <InfoRow label="Billing Address" value={customer.billingAddress} />
                </div>
                <SectionHeader title="Account Status" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Creation Date" value={formatDate(customer.createdAt)} />
                    <InfoRow label="Total Connections" value={String(customer.totalConnections || 0)} />
                    <InfoRow label="Monthly Billing" value={`Rs. ${parseFloat(customer.monthlyBilling || "0").toLocaleString()}`} />
                    <InfoRow label="Total Bandwidth" value={customer.totalBandwidth} />
                  </div>
                </div>
              </div>
            )}

            {/* CONTRACT & SLA */}
            {activeTab === "contract" && (
              <div className="space-y-4">
                <SectionHeader title="Contract Details" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Contract Duration" value={customer.contractDuration} />
                    <InfoRow label="Dedicated Account Manager" value={customer.dedicatedAccountManager} />
                    <InfoRow label="Contract Start Date" value={customer.contractStartDate} />
                    <InfoRow label="Contract Expiry Date" value={customer.contractExpiryDate} />
                  </div>
                </div>
                <SectionHeader title="SLA & Legal Terms" />
                <div className="bg-card border rounded-lg overflow-hidden divide-y">
                  <InfoRow label="Custom SLA Terms" value={customer.customSla || "-"} />
                  <InfoRow label="Custom Pricing Agreement" value={customer.customPricingAgreement || "-"} />
                </div>
              </div>
            )}

            {/* VALUE ADDED SERVICES */}
            {activeTab === "vas" && (
              <div className="space-y-4">
                <SectionHeader title="Managed Services" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Managed Router" value={<BoolValue v={customer.managedRouter} />} />
                    <InfoRow label="Firewall" value={<BoolValue v={customer.firewall} />} />
                    <InfoRow label="Load Balancer" value={<BoolValue v={customer.loadBalancer} />} />
                    <InfoRow label="Dedicated Support" value={<BoolValue v={customer.dedicatedSupport} />} />
                    <InfoRow label="Backup Link" value={<BoolValue v={customer.backupLink} />} />
                    <InfoRow label="Monitoring SLA" value={<BoolValue v={customer.monitoringSla} />} />
                  </div>
                </div>
                <SectionHeader title="Tax & Billing Configuration" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Tax Enabled" value={<BoolValue v={customer.taxEnabled} />} />
                    <InfoRow label="WHT Tax %" value={customer.whTaxPercent ? `${customer.whTaxPercent}%` : "-"} />
                    <InfoRow label="AIT Tax %" value={customer.aitTaxPercent ? `${customer.aitTaxPercent}%` : "-"} />
                    <InfoRow label="Extra Fee Tax %" value={customer.extraFeeTaxPercent ? `${customer.extraFeeTaxPercent}%` : "-"} />
                    <InfoRow label="Centralized Billing" value={<BoolValue v={customer.centralizedBilling} />} />
                    <InfoRow label="Per-Branch Billing" value={<BoolValue v={customer.perBranchBilling} />} />
                    <InfoRow label="Custom Invoice Format" value={customer.customInvoiceFormat} />
                  </div>
                </div>
              </div>
            )}

            {/* MONITORING */}
            {activeTab === "monitoring" && (
              <div className="space-y-4">
                <SectionHeader title="Monitoring Configuration" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Monitoring Enabled" value={<BoolValue v={customer.monitoringEnabled} />} />
                    <InfoRow label="SNMP Monitoring" value={<BoolValue v={customer.snmpMonitoring} />} />
                    <InfoRow label="Traffic Alerts" value={<BoolValue v={customer.trafficAlerts} />} />
                    <InfoRow label="Radius Profile" value={<span className="font-mono">{customer.radiusProfile}</span>} />
                    <InfoRow label="Bandwidth Profile Name" value={<span className="font-mono">{customer.bandwidthProfileName}</span>} />
                  </div>
                </div>
                {customer.notes && (<><SectionHeader title="Notes" /><div className="bg-card border rounded-lg px-4 py-3 text-sm">{customer.notes}</div></>)}
              </div>
            )}

            {/* GENERATED & UPDATED BILL/INVOICES */}
            {activeTab === "invoices" && (
              <div className="space-y-4">
                <SectionHeader title="Generated & Updated Bill/Invoices" />
                {invoicesLoading ? (<div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>)
                : !invoices?.length ? (<EmptyState icon={FileText} message="No invoices found for this corporate customer" />)
                : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-[#1a3a5c]">
                        <TableHead className="text-white text-xs">Invoice #</TableHead>
                        <TableHead className="text-white text-xs">Amount</TableHead>
                        <TableHead className="text-white text-xs">Tax</TableHead>
                        <TableHead className="text-white text-xs">Total</TableHead>
                        <TableHead className="text-white text-xs">Status</TableHead>
                        <TableHead className="text-white text-xs">Issue Date</TableHead>
                        <TableHead className="text-white text-xs">Due Date</TableHead>
                        <TableHead className="text-white text-xs">Paid Date</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {invoices.map((inv: any) => (
                          <TableRow key={inv.id}>
                            <TableCell className="text-xs font-mono">{inv.invoiceNumber}</TableCell>
                            <TableCell className="text-xs">{Number(inv.amount).toFixed(2)}</TableCell>
                            <TableCell className="text-xs">{Number(inv.tax || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-xs font-semibold">{Number(inv.totalAmount).toFixed(2)}</TableCell>
                            <TableCell><Badge variant="secondary" className={`text-[10px] capitalize ${inv.status === "paid" ? "text-green-700 bg-green-50" : inv.status === "overdue" ? "text-red-600 bg-red-50" : "text-amber-600 bg-amber-50"}`}>{inv.status}</Badge></TableCell>
                            <TableCell className="text-xs">{formatDate(inv.issueDate)}</TableCell>
                            <TableCell className="text-xs">{formatDate(inv.dueDate)}</TableCell>
                            <TableCell className="text-xs">{inv.paidDate ? formatDate(inv.paidDate) : "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* BANDWIDTH UPGRADE & DOWNGRADE HISTORY */}
            {activeTab === "bwhistory" && (
              <div className="space-y-6">
                <SectionHeader title="Package Change Requests" action={
                  <Button size="sm" className="text-xs h-8 gap-1 bg-[#1c67d4] text-white" data-testid="button-submit-change-request" onClick={() => setLocation(`/package-change?customerType=Corporate&customerId=${id}&customerName=${encodeURIComponent(customer.companyName)}`)}><Plus className="h-3 w-3" />Submit Request</Button>
                } />
                {pcrLoading ? (<div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>)
                : !packageChangeReqs?.length ? (<EmptyState icon={FileText} message="No package change requests found" />)
                : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-[#1a3a5c]">
                        <TableHead className="text-white text-xs">Request #</TableHead>
                        <TableHead className="text-white text-xs">Date</TableHead>
                        <TableHead className="text-white text-xs">Type</TableHead>
                        <TableHead className="text-white text-xs">Previous BW</TableHead>
                        <TableHead className="text-white text-xs">New BW</TableHead>
                        <TableHead className="text-white text-xs">New Price</TableHead>
                        <TableHead className="text-white text-xs">Prorated Charges</TableHead>
                        <TableHead className="text-white text-xs">Adjustment</TableHead>
                        <TableHead className="text-white text-xs">Tax Impact</TableHead>
                        <TableHead className="text-white text-xs">Final Difference</TableHead>
                        <TableHead className="text-white text-xs">Status</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {packageChangeReqs.map((r: any) => (
                          <TableRow key={r.id} data-testid={`row-pcr-${r.id}`}>
                            <TableCell className="text-xs font-medium text-[#0057FF]">{r.requestNumber}</TableCell>
                            <TableCell className="text-xs">{formatDate(r.createdAt)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${r.changeType === "upgrade" ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>
                                {r.changeType === "upgrade" ? <TrendingUp className="h-3 w-3 inline mr-1" /> : <TrendingDown className="h-3 w-3 inline mr-1" />}{r.changeType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{r.currentBandwidth || "-"}</TableCell>
                            <TableCell className="text-xs font-bold text-teal-700 dark:text-teal-400">{r.newBandwidth || "-"}</TableCell>
                            <TableCell className="text-xs font-medium">Rs. {parseFloat(r.newMonthlyBill || "0").toLocaleString()}</TableCell>
                            <TableCell className="text-xs">Rs. {parseFloat(r.proratedCharges || "0").toLocaleString()}</TableCell>
                            <TableCell className="text-xs">Rs. {parseFloat(r.adjustmentAmount || "0").toLocaleString()}</TableCell>
                            <TableCell className="text-xs">Rs. {parseFloat(r.taxImpact || "0").toLocaleString()}</TableCell>
                            <TableCell className={`text-xs font-bold ${parseFloat(r.finalBillDifference || "0") > 0 ? "text-red-600" : "text-green-600"}`}>Rs. {parseFloat(r.finalBillDifference || "0").toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${r.status === "approved" || r.status === "implemented" || r.status === "completed" ? "text-green-700 bg-green-50" : r.status === "rejected" ? "text-red-600 bg-red-50" : r.status === "pending" ? "text-amber-700 bg-amber-50" : "text-blue-700 bg-blue-50"}`}>
                                {r.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <SectionHeader title="Bandwidth Change History" />
                {bwLoading ? (<div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>)
                : !bwHistory?.length ? (<EmptyState icon={BarChart3} message="No bandwidth change history found" />)
                : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-[#1a3a5c]">
                        <TableHead className="text-white text-xs">Date</TableHead>
                        <TableHead className="text-white text-xs">Change Type</TableHead>
                        <TableHead className="text-white text-xs">Previous Bandwidth</TableHead>
                        <TableHead className="text-white text-xs">New Bandwidth</TableHead>
                        <TableHead className="text-white text-xs">Changed By</TableHead>
                        <TableHead className="text-white text-xs">Reason</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {bwHistory.map((h: any) => (
                          <TableRow key={h.id} data-testid={`row-bwh-${h.id}`}>
                            <TableCell className="text-xs">{formatDate(h.effectiveDate || h.createdAt)}</TableCell>
                            <TableCell><Badge variant="secondary" className={`text-[10px] capitalize ${h.changeType === "upgrade" ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>
                              {h.changeType === "upgrade" ? <TrendingUp className="h-3 w-3 inline mr-1" /> : <TrendingDown className="h-3 w-3 inline mr-1" />}{h.changeType}
                            </Badge></TableCell>
                            <TableCell className="text-xs font-medium">{h.previousBandwidth}</TableCell>
                            <TableCell className="text-xs font-bold text-teal-700 dark:text-teal-400">{h.newBandwidth}</TableCell>
                            <TableCell className="text-xs">{h.changedBy || "-"}</TableCell>
                            <TableCell className="text-xs">{h.reason || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* RECEIVED BILL HISTORY */}
            {activeTab === "received" && (
              <div className="space-y-4">
                <SectionHeader title="Received Bill History" />
                {!invoices?.filter((i: any) => i.status === "paid").length ? (<EmptyState icon={CreditCard} message="No received bill history found" />)
                : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-[#1a3a5c]">
                        <TableHead className="text-white text-xs">Invoice #</TableHead>
                        <TableHead className="text-white text-xs">Amount Paid</TableHead>
                        <TableHead className="text-white text-xs">Payment Date</TableHead>
                        <TableHead className="text-white text-xs">Status</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {invoices?.filter((i: any) => i.status === "paid").map((inv: any) => (
                          <TableRow key={inv.id}>
                            <TableCell className="text-xs font-mono">{inv.invoiceNumber}</TableCell>
                            <TableCell className="text-xs font-semibold">Rs. {Number(inv.totalAmount).toLocaleString()}</TableCell>
                            <TableCell className="text-xs">{formatDate(inv.paidDate)}</TableCell>
                            <TableCell><Badge variant="secondary" className="text-[10px] text-green-700 bg-green-50">Paid</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* COMPLAIN HISTORY */}
            {activeTab === "complain" && (
              <div className="space-y-4">
                <SectionHeader title="Complain History" />
                {ticketsLoading ? (<div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>)
                : !tickets?.length ? (<EmptyState icon={AlertCircle} message="No complaints found for this corporate customer" />)
                : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-[#1a3a5c]">
                        <TableHead className="text-white text-xs">Ticket #</TableHead>
                        <TableHead className="text-white text-xs">Subject</TableHead>
                        <TableHead className="text-white text-xs">Priority</TableHead>
                        <TableHead className="text-white text-xs">Status</TableHead>
                        <TableHead className="text-white text-xs">Category</TableHead>
                        <TableHead className="text-white text-xs">Created</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {tickets.map((t: any) => (
                          <TableRow key={t.id}>
                            <TableCell className="text-xs font-mono">{t.ticketNumber}</TableCell>
                            <TableCell className="text-xs">{t.subject}</TableCell>
                            <TableCell><Badge variant="secondary" className={`text-[10px] capitalize ${t.priority === "critical" ? "text-red-600 bg-red-50" : t.priority === "high" ? "text-orange-600 bg-orange-50" : t.priority === "medium" ? "text-amber-600 bg-amber-50" : "text-blue-600 bg-blue-50"}`}>{t.priority}</Badge></TableCell>
                            <TableCell><Badge variant="secondary" className={`text-[10px] capitalize ${t.status === "resolved" || t.status === "closed" ? "text-green-700 bg-green-50" : t.status === "in_progress" ? "text-amber-600 bg-amber-50" : "text-blue-600 bg-blue-50"}`}>{t.status.replace("_", " ")}</Badge></TableCell>
                            <TableCell className="text-xs capitalize">{t.category}</TableCell>
                            <TableCell className="text-xs">{formatDate(t.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* SMS MESSAGE HISTORY */}
            {activeTab === "sms" && (
              <div className="space-y-4">
                <SectionHeader title="SMS Message History" />
                <EmptyState icon={MessageSquare} message="No SMS message history available" />
              </div>
            )}

            {/* PRODUCT & SERVICE SALES INVOICES */}
            {activeTab === "sales" && (
              <div className="space-y-4">
                <SectionHeader title="Product & Service Sales Invoices" />
                <EmptyState icon={ShoppingBag} message="No product & service sales invoices found" />
              </div>
            )}

            {/* REFERRALS */}
            {activeTab === "referrals" && (
              <div className="space-y-4">
                <SectionHeader title="Referrals" />
                <EmptyState icon={Users} message="No referral records found for this corporate customer" />
              </div>
            )}

            {/* CONNECTIONS */}
            {activeTab === "connections" && (
              <div className="space-y-4">
                <SectionHeader title="Branch Connections" action={
                  <Button size="sm" onClick={openAddConn} className="bg-[#1c67d4] text-white text-xs h-8 gap-1.5"><Plus className="h-3.5 w-3.5" />Add Connection</Button>
                } />
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-card border rounded-lg p-3 border-l-4 border-l-blue-500">
                    <p className="text-xs text-muted-foreground">Total Connections</p>
                    <p className="text-xl font-bold">{(connections || []).length}</p>
                  </div>
                  <div className="bg-card border rounded-lg p-3 border-l-4 border-l-green-500">
                    <p className="text-xs text-muted-foreground">Active</p>
                    <p className="text-xl font-bold text-green-600">{(connections || []).filter(c => c.status === "active").length}</p>
                  </div>
                  <div className="bg-card border rounded-lg p-3 border-l-4 border-l-indigo-500">
                    <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                    <p className="text-sm font-bold text-indigo-600">Rs. {(connections || []).reduce((s, c) => s + parseFloat(c.monthlyCharges || "0"), 0).toLocaleString()}</p>
                  </div>
                </div>
                {(connections || []).length === 0 ? (<EmptyState icon={Network} message="No connections yet — add branch connections to get started" />) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-[#1a3a5c]">
                        <TableHead className="text-white text-xs">Branch Name</TableHead>
                        <TableHead className="text-white text-xs">Location</TableHead>
                        <TableHead className="text-white text-xs">Package</TableHead>
                        <TableHead className="text-white text-xs">Bandwidth</TableHead>
                        <TableHead className="text-white text-xs">Static IP</TableHead>
                        <TableHead className="text-white text-xs">Monthly</TableHead>
                        <TableHead className="text-white text-xs">Status</TableHead>
                        <TableHead className="text-white w-10"></TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {(connections || []).map(c => (
                          <TableRow key={c.id}>
                            <TableCell className="text-xs font-medium">{c.branchName}</TableCell>
                            <TableCell className="text-xs">{c.location || "—"}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px] capitalize">{c.packageType}</Badge></TableCell>
                            <TableCell className="text-xs font-medium text-teal-700 dark:text-teal-400">{c.bandwidth || "—"}</TableCell>
                            <TableCell><code className="text-[10px] bg-muted px-1 py-0.5 rounded">{c.staticIp || "—"}</code></TableCell>
                            <TableCell className="text-xs font-semibold">Rs. {parseFloat(c.monthlyCharges || "0").toLocaleString()}</TableCell>
                            <TableCell><Badge variant="secondary" className={`text-[10px] capitalize ${c.status === "active" ? "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950" : "text-red-700 bg-red-50"}`}>{c.status}</Badge></TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditConn(c)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => deleteConnMutation.mutate(c.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* SERVICE SCHEDULER */}
            {activeTab === "service_scheduler" && (
              <div className="space-y-4">
                <SectionHeader title="Service Scheduler" action={
                  <Button size="sm" className="h-8 text-xs gap-1.5 bg-[#0057FF]" onClick={() => setSchedulerDialogOpen(true)} data-testid="button-corp-add-schedule">
                    <Plus className="h-3.5 w-3.5" /> Schedule Service
                  </Button>
                } />
                {(() => {
                  if (!serviceRequests || serviceRequests.length === 0)
                    return <EmptyState icon={CalendarRange} message="No scheduled service requests found" />;
                  return (
                    <div className="bg-card border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Request #</TableHead>
                            <TableHead className="text-xs">Service Type</TableHead>
                            <TableHead className="text-xs">Scheduled Date</TableHead>
                            <TableHead className="text-xs">Assigned To</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                            <TableHead className="text-xs">Priority</TableHead>
                            <TableHead className="text-xs">Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {serviceRequests.map((r: any) => (
                            <TableRow key={r.id}>
                              <TableCell className="text-xs font-medium">SR-{r.id}</TableCell>
                              <TableCell className="text-xs capitalize">{r.serviceType || r.requestType || "—"}</TableCell>
                              <TableCell className="text-xs">{formatDate(r.scheduledDate || r.requestDate)}</TableCell>
                              <TableCell className="text-xs">{r.assignedTo || "—"}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={`text-[10px] capitalize ${
                                  r.status === "completed" ? "text-green-700 bg-green-50" :
                                  r.status === "in_progress" ? "text-blue-700 bg-blue-50" :
                                  r.status === "cancelled" ? "text-red-700 bg-red-50" :
                                  "text-amber-600 bg-amber-50"
                                }`}>{r.status || "pending"}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-[10px] capitalize ${
                                  r.priority === "high" || r.priority === "urgent" ? "text-red-600 border-red-300" :
                                  r.priority === "medium" ? "text-amber-600 border-amber-300" :
                                  "text-green-600 border-green-300"
                                }`}>{r.priority || "normal"}</Badge>
                              </TableCell>
                              <TableCell className="text-xs max-w-[200px] truncate">{r.description || r.notes || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })()}
              </div>
            )}

          </div>
        </div>
      </div>

      {customer && <CorpEditDialog open={editOpen} onClose={() => setEditOpen(false)} customer={customer} id={id || ""} />}
      {customer && (
        <ConnectionDialog
          open={connDialogOpen} onClose={() => { setConnDialogOpen(false); setEditingConn(null); }}
          editing={editingConn} corporateId={customer.id} onSave={onConnSave}
          isPending={createConnMutation.isPending || updateConnMutation.isPending}
        />
      )}

      <Dialog open={schedulerDialogOpen} onOpenChange={setSchedulerDialogOpen}>
        <DialogContent className="max-w-[550px]" data-testid="dialog-corp-schedule-service">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CalendarRange className="h-5 w-5 text-[#0057FF]" /> Schedule Service Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Service Type</span>
              <Select value={schedulerType} onValueChange={setSchedulerType}>
                <SelectTrigger data-testid="select-corp-scheduler-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="installation">New Installation</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="upgrade">Bandwidth Upgrade</SelectItem>
                  <SelectItem value="downgrade">Bandwidth Downgrade</SelectItem>
                  <SelectItem value="relocation">Relocation</SelectItem>
                  <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                  <SelectItem value="disconnection">Disconnection</SelectItem>
                  <SelectItem value="reconnection">Reconnection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">Scheduled Date</span>
                <Input type="date" value={schedulerDate} onChange={e => setSchedulerDate(e.target.value)} data-testid="input-corp-scheduler-date" />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Scheduled Time</span>
                <Input type="time" value={schedulerTime} onChange={e => setSchedulerTime(e.target.value)} data-testid="input-corp-scheduler-time" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">Assign To</span>
                <Input value={schedulerAssignee} onChange={e => setSchedulerAssignee(e.target.value)} placeholder="Technician name..." data-testid="input-corp-scheduler-assignee" />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Priority</span>
                <Select value={schedulerPriority} onValueChange={setSchedulerPriority}>
                  <SelectTrigger data-testid="select-corp-scheduler-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Notes</span>
              <Textarea value={schedulerNotes} onChange={e => setSchedulerNotes(e.target.value)} placeholder="Add service request notes..." className="min-h-[80px]" data-testid="textarea-corp-scheduler-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSchedulerDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#0057FF]" disabled={scheduleServiceMutation.isPending || !schedulerDate}
              onClick={() => scheduleServiceMutation.mutate({ serviceType: schedulerType, scheduledDate: `${schedulerDate}T${schedulerTime}`, assignedTo: schedulerAssignee, priority: schedulerPriority, notes: schedulerNotes, status: "pending" })}
              data-testid="button-corp-confirm-schedule">
              {scheduleServiceMutation.isPending ? "Scheduling..." : "Schedule Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={smsProfileDialogOpen} onOpenChange={setSmsProfileDialogOpen}>
        <DialogContent className="max-w-[500px]" data-testid="dialog-corp-profile-send-message">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-[#0057FF]" /> Send Email / Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Channel</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "email", label: "Email", icon: Mail },
                  { value: "sms", label: "SMS", icon: Phone },
                ].map(ch => (
                  <button key={ch.value} type="button" onClick={() => setSmsProfileChannel(ch.value)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${smsProfileChannel === ch.value ? "border-[#0057FF] bg-blue-50 text-[#0057FF] font-semibold" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                    data-testid={`btn-corp-profile-channel-${ch.value}`}>
                    <ch.icon className="h-4 w-4" /><span className="text-sm">{ch.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {smsProfileChannel === "email" && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Subject</span>
                <Input value={smsProfileSubject} onChange={e => setSmsProfileSubject(e.target.value)} placeholder="Enter subject..." data-testid="input-corp-profile-subject" />
              </div>
            )}
            <div className="space-y-2">
              <span className="text-sm font-medium">Message</span>
              <Textarea value={smsProfileMessage} onChange={e => setSmsProfileMessage(e.target.value)} placeholder="Type your message..." className="min-h-[120px]" data-testid="textarea-corp-profile-message" />
            </div>
            <div className="text-xs text-muted-foreground">
              Sending to: {smsProfileChannel === "email" ? (customer?.email || "No email") : (customer?.mobileNo || customer?.phone || "No phone")}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSmsProfileDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#0057FF]" disabled={sendProfileNotificationMutation.isPending || !smsProfileMessage.trim() || (smsProfileChannel === "email" && !smsProfileSubject.trim())}
              onClick={() => sendProfileNotificationMutation.mutate({ channel: smsProfileChannel, subject: smsProfileSubject, message: smsProfileMessage })}
              data-testid="button-corp-profile-send">
              {sendProfileNotificationMutation.isPending ? "Sending..." : (<><Send className="h-4 w-4 mr-1.5" />{smsProfileChannel === "email" ? "Send Email" : "Send SMS"}</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
