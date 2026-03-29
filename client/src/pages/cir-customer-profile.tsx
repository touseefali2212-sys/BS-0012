import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft, Building2, Mail, Phone, Wifi, Edit, Save, ChevronRight,
  Shield, Network, Activity, DollarSign, AlertCircle, RefreshCw,
  Calendar, Download, MessageCircle, CalendarRange, User, Hash,
  CreditCard, Globe, CheckCircle2,
} from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCirCustomerSchema, type CirCustomer, type InsertCirCustomer } from "@shared/schema";

/* ─── Shared mini-components (match customer-profile.tsx exactly) ─── */
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
      <span className={`font-medium text-foreground ${capitalize ? "capitalize" : ""}`}>
        {value ?? "-"}
      </span>
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

/* ─── Edit Dialog ─── */
function CirEditDialog({
  open, onClose, customer, id, vendors,
}: {
  open: boolean;
  onClose: () => void;
  customer: CirCustomer;
  id: string;
  vendors: any[];
}) {
  const { toast } = useToast();
  const [section, setSection] = useState(0);

  const form = useForm<InsertCirCustomer>({
    resolver: zodResolver(insertCirCustomerSchema),
    defaultValues: customer as any,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertCirCustomer) => {
      const res = await apiRequest("PATCH", `/api/cir-customers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cir-customers", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/cir-customers"] });
      onClose();
      toast({ title: "CIR Customer updated successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const sections = ["Company Info", "Bandwidth", "IP Config", "Contract & SLA", "Billing", "Monitoring"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update CIR Customer — {customer.companyName}</DialogTitle>
        </DialogHeader>

        {/* Section Nav */}
        <div className="flex flex-wrap gap-1.5 pb-2 border-b">
          {sections.map((s, i) => (
            <button key={s} onClick={() => setSection(i)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${section === i ? "bg-[#1c67d4] text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {s}
            </button>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">

            {/* Section 0: Company Info */}
            {section === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="cnic" render={({ field }) => (<FormItem><FormLabel>CNIC</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="ntn" render={({ field }) => (<FormItem><FormLabel>NTN</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="mobileNo2" render={({ field }) => (<FormItem><FormLabel>Mobile No. 2</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="branch" render={({ field }) => (<FormItem><FormLabel>Branch</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="customerType" render={({ field }) => (<FormItem><FormLabel>Customer Type</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "active"}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="expired">Expired</SelectItem></SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            )}

            {/* Section 1: Bandwidth */}
            {section === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="vendorId" render={({ field }) => (
                    <FormItem><FormLabel>Vendor</FormLabel>
                      <Select onValueChange={v => field.onChange(v ? parseInt(v) : null)} value={field.value?.toString() || ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger></FormControl>
                        <SelectContent>{(vendors || []).map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="serviceType" render={({ field }) => (<FormItem><FormLabel>Service Type</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="linkType" render={({ field }) => (<FormItem><FormLabel>Link Type</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="uplinkPort" render={({ field }) => (<FormItem><FormLabel>Uplink Port</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="media" render={({ field }) => (<FormItem><FormLabel>Media</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="vendorPort" render={({ field }) => (<FormItem><FormLabel>Vendor Port</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="committedBandwidth" render={({ field }) => (<FormItem><FormLabel>Committed Bandwidth</FormLabel><FormControl><Input placeholder="20 Mbps" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="burstBandwidth" render={({ field }) => (<FormItem><FormLabel>Burst Bandwidth</FormLabel><FormControl><Input placeholder="50 Mbps" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="uploadSpeed" render={({ field }) => (<FormItem><FormLabel>Upload Speed</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="downloadSpeed" render={({ field }) => (<FormItem><FormLabel>Download Speed</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="contentionRatio" render={({ field }) => (<FormItem><FormLabel>Contention Ratio</FormLabel><FormControl><Input placeholder="1:1" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="vlanId" render={({ field }) => (<FormItem><FormLabel>VLAN ID</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="onuDevice" render={({ field }) => (<FormItem><FormLabel>ONU / Device</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </div>
            )}

            {/* Section 2: IP Config */}
            {section === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="staticIp" render={({ field }) => (<FormItem><FormLabel>Static IP</FormLabel><FormControl><Input placeholder="203.0.113.10" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="subnetMask" render={({ field }) => (<FormItem><FormLabel>Subnet Mask</FormLabel><FormControl><Input placeholder="255.255.255.0" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="gateway" render={({ field }) => (<FormItem><FormLabel>Gateway</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="dns" render={({ field }) => (<FormItem><FormLabel>Primary DNS</FormLabel><FormControl><Input placeholder="8.8.8.8" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="dns2" render={({ field }) => (<FormItem><FormLabel>Secondary DNS</FormLabel><FormControl><Input placeholder="8.8.4.4" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="publicIpBlock" render={({ field }) => (<FormItem><FormLabel>Public IP Block</FormLabel><FormControl><Input placeholder="/29 block" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </div>
            )}

            {/* Section 3: Contract & SLA */}
            {section === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="contractStartDate" render={({ field }) => (<FormItem><FormLabel>Contract Start</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="contractEndDate" render={({ field }) => (<FormItem><FormLabel>Contract End</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="contractDuration" render={({ field }) => (<FormItem><FormLabel>Contract Duration</FormLabel><FormControl><Input placeholder="12 months" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="slaLevel" render={({ field }) => (<FormItem><FormLabel>SLA Level (%)</FormLabel><FormControl><Input placeholder="99.5" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="accountManager" render={({ field }) => (<FormItem><FormLabel>Account Manager</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="dedicatedAccountManager" render={({ field }) => (<FormItem><FormLabel>Dedicated Account Manager</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="autoRenewal" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Auto Renewal</FormLabel></FormItem>)} />
                <FormField control={form.control} name="slaPenaltyClause" render={({ field }) => (<FormItem><FormLabel>SLA Penalty Clause</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="customSla" render={({ field }) => (<FormItem><FormLabel>Custom SLA Terms</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="customPricingAgreement" render={({ field }) => (<FormItem><FormLabel>Custom Pricing Agreement</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            )}

            {/* Section 4: Billing */}
            {section === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="monthlyCharges" render={({ field }) => (<FormItem><FormLabel>Monthly Charges</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="installationCharges" render={({ field }) => (<FormItem><FormLabel>Installation Charges</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="securityDeposit" render={({ field }) => (<FormItem><FormLabel>Security Deposit</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="billingCycle" render={({ field }) => (
                    <FormItem><FormLabel>Billing Cycle</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "monthly"}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="invoiceType" render={({ field }) => (
                    <FormItem><FormLabel>Invoice Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "tax"}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="tax">Tax Invoice</SelectItem><SelectItem value="non_tax">Non-Tax</SelectItem></SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="paymentTerms" render={({ field }) => (<FormItem><FormLabel>Payment Terms</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="creditLimit" render={({ field }) => (<FormItem><FormLabel>Credit Limit</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="centralizedBilling" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Centralized Billing</FormLabel></FormItem>)} />
                  <FormField control={form.control} name="perBranchBilling" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Per-Branch Billing</FormLabel></FormItem>)} />
                </div>
                <FormField control={form.control} name="lateFeePolicy" render={({ field }) => (<FormItem><FormLabel>Late Fee Policy</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="billingDiscount" render={({ field }) => (<FormItem><FormLabel>Billing Discount</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            )}

            {/* Section 5: Monitoring */}
            {section === 5 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="radiusProfile" render={({ field }) => (<FormItem><FormLabel>Radius Profile</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="bandwidthProfileName" render={({ field }) => (<FormItem><FormLabel>Bandwidth Profile Name</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="monitoringEnabled" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Monitoring</FormLabel></FormItem>)} />
                  <FormField control={form.control} name="snmpMonitoring" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>SNMP</FormLabel></FormItem>)} />
                  <FormField control={form.control} name="trafficAlerts" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Traffic Alerts</FormLabel></FormItem>)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="managedRouter" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Managed Router</FormLabel></FormItem>)} />
                  <FormField control={form.control} name="firewall" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Firewall</FormLabel></FormItem>)} />
                  <FormField control={form.control} name="loadBalancer" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Load Balancer</FormLabel></FormItem>)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="dedicatedSupport" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Dedicated Support</FormLabel></FormItem>)} />
                  <FormField control={form.control} name="backupLink" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Backup Link</FormLabel></FormItem>)} />
                  <FormField control={form.control} name="monitoringSla" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Monitoring SLA</FormLabel></FormItem>)} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-4 border-t">
              <div className="flex gap-2">
                {section > 0 && <Button type="button" variant="outline" size="sm" onClick={() => setSection(s => s - 1)}>← Previous</Button>}
                {section < sections.length - 1 && <Button type="button" variant="outline" size="sm" onClick={() => setSection(s => s + 1)}>Next →</Button>}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                <Button type="submit" size="sm" disabled={updateMutation.isPending} className="bg-[#1c67d4] text-white">
                  {updateMutation.isPending ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</> : <><Save className="h-3.5 w-3.5 mr-1.5" />Save All Changes</>}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Profile Page ─── */
export default function CirCustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("company");
  const [editOpen, setEditOpen] = useState(false);

  const { data: customer, isLoading } = useQuery<CirCustomer>({
    queryKey: ["/api/cir-customers", id],
    queryFn: async () => {
      const res = await fetch(`/api/cir-customers/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: vendors } = useQuery<any[]>({ queryKey: ["/api/vendors"] });

  const statusUpdateMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PATCH", `/api/cir-customers/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cir-customers", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/cir-customers"] });
      toast({ title: "Status updated" });
    },
  });

  const vendor = vendors?.find(v => v.id === customer?.vendorId);

  const tabs = [
    { key: "company", label: "Company Info" },
    { key: "bandwidth", label: "Bandwidth Config" },
    { key: "ip", label: "IP Configuration" },
    { key: "contract", label: "Contract & SLA" },
    { key: "billing", label: "Billing" },
    { key: "monitoring", label: "Monitoring" },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-0">
          <Skeleton className="h-[600px] w-[280px] shrink-0" />
          <Skeleton className="h-[600px] flex-1" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 space-y-4">
        <Link href="/cir-customers"><Button variant="ghost"><ArrowLeft className="h-4 w-4 mr-1" />Back to CIR Customers</Button></Link>
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><AlertCircle className="h-12 w-12 mb-3 opacity-30" /><p className="font-medium">CIR Customer not found</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Breadcrumb bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-[#0057FF]" />
          <h1 className="text-lg font-bold">Profile</h1>
          <span className="text-xs text-muted-foreground">CIR Client Profile</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Link href="/cir-customers" className="text-[#0057FF]">CIR Customers</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/cir-customers" className="text-[#0057FF]">Client list</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Profile</span>
        </div>
      </div>

      <div className="flex gap-0 min-h-[calc(100vh-120px)]">
        {/* ─── Left Sidebar (identical layout to customer-profile.tsx) ─── */}
        <div className="w-[280px] shrink-0 border-r bg-gradient-to-b from-[#1a2332] to-[#243447] text-white">
          <div className="flex flex-col items-center pt-6 pb-4 px-4">
            <div className="w-28 h-28 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center mb-3" data-testid="cir-profile-avatar">
              <Building2 className="h-14 w-14 text-white/50" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
              <Mail className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
              <Phone className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
            </div>
            <h2 className="text-lg font-bold text-center" data-testid="text-cir-name">{customer.companyName}</h2>
            <p className="text-xs opacity-70 capitalize" data-testid="text-cir-type">{customer.customerType || "CIR"}</p>
          </div>

          <div className="px-4 space-y-0 text-xs border-t border-white/10 pt-4">
            <ProfileSidebarItem icon={Hash} label="Client Code" value={`CIR-${customer.id}`} testId="sidebar-cir-code" />
            <ProfileSidebarItem icon={User} label="Contact Person" value={customer.contactPerson || customer.companyName} testId="sidebar-cir-contact" />
            <ProfileSidebarItem icon={Wifi} label="Committed BW" value={customer.committedBandwidth || "Not set"} testId="sidebar-cir-bw" />
            <ProfileSidebarItem icon={CreditCard} label="Monthly Charges" value={`Rs. ${parseFloat(customer.monthlyCharges || "0").toLocaleString()}`} testId="sidebar-cir-charges" />
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 opacity-60" />
                <span className="opacity-80">Active Status</span>
              </div>
              <Switch
                checked={customer.status === "active"}
                onCheckedChange={(c) => statusUpdateMutation.mutate(c ? "active" : "suspended")}
                className="scale-75"
                data-testid="switch-cir-status"
              />
            </div>
            <ProfileSidebarItem icon={Calendar} label="Contract End" value={customer.contractEndDate || "Not set"} testId="sidebar-cir-contract" />
            <ProfileSidebarItem icon={Network} label="Static IP" value={customer.staticIp || "Not assigned"} testId="sidebar-cir-ip" />
            <ProfileSidebarItem icon={Globe} label="Vendor" value={vendor?.name || "Not set"} testId="sidebar-cir-vendor" />
          </div>

          <div className="px-4 pt-4 pb-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" onClick={() => setEditOpen(true)} data-testid="button-cir-update">
                <Edit className="h-3 w-3" /> Update Information
              </Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" data-testid="button-cir-scheduler">
                <CalendarRange className="h-3 w-3" /> Status Scheduler
              </Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" data-testid="button-cir-message">
                <MessageCircle className="h-3 w-3" /> Send Email/Message
              </Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" data-testid="button-cir-pkg-scheduler">
                <Activity className="h-3 w-3" /> Bandwidth Schedule
              </Button>
            </div>
            <Button size="sm" className="w-full text-xs h-9 gap-1.5 bg-[#0057FF]" data-testid="button-cir-download">
              <Download className="h-3.5 w-3.5" /> Download Information
            </Button>
            <Link href="/cir-customers">
              <Button size="sm" variant="outline" className="w-full text-xs h-9 gap-1.5 text-white border-white/30" data-testid="button-cir-list">
                <ArrowLeft className="h-3.5 w-3.5" /> Go To CIR List
              </Button>
            </Link>
          </div>
        </div>

        {/* ─── Right Content ─── */}
        <div className="flex-1 bg-muted/30 overflow-hidden">
          {/* Tab bar */}
          <div className="border-b bg-card">
            <div className="flex flex-wrap px-1">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key ? "border-[#0057FF] text-[#0057FF]" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`} data-testid={`tab-cir-${tab.key}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 overflow-y-auto max-h-[calc(100vh-170px)] space-y-4">

            {/* ── COMPANY INFO ── */}
            {activeTab === "company" && (
              <div className="space-y-4" data-testid="tab-content-cir-company">
                <SectionHeader title="Company Information" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Company Name" value={customer.companyName} />
                    <InfoRow label="Contact Person" value={customer.contactPerson} />
                    <InfoRow label="CNIC" value={customer.cnic} />
                    <InfoRow label="NTN" value={customer.ntn} />
                    <InfoRow label="Email" value={customer.email} />
                    <InfoRow label="Phone" value={customer.phone} />
                    <InfoRow label="Mobile No. 2" value={customer.mobileNo2} />
                    <InfoRow label="Branch" value={customer.branch} />
                    <InfoRow label="City" value={customer.city} />
                    <InfoRow label="Address" value={customer.address} />
                    <InfoRow label="Customer Type" value={customer.customerType} capitalize />
                    <InfoRow label="Service Type" value={customer.serviceType} />
                  </div>
                </div>

                <SectionHeader title="Account Manager" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Account Manager" value={customer.accountManager} />
                    <InfoRow label="Dedicated Account Manager" value={customer.dedicatedAccountManager} />
                    <InfoRow label="Status" value={
                      <Badge variant="secondary" className={`capitalize text-[10px] ${customer.status === "active" ? "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950" : "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950"}`}>
                        {customer.status}
                      </Badge>
                    } />
                    <InfoRow label="Created" value={customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"} />
                  </div>
                </div>
              </div>
            )}

            {/* ── BANDWIDTH ── */}
            {activeTab === "bandwidth" && (
              <div className="space-y-4" data-testid="tab-content-cir-bandwidth">
                <SectionHeader title="Bandwidth Configuration" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Vendor" value={vendor?.name} />
                    <InfoRow label="Vendor Port" value={customer.vendorPort} />
                    <InfoRow label="Service Type" value={customer.serviceType} />
                    <InfoRow label="Link Type" value={customer.linkType} />
                    <InfoRow label="Uplink Port" value={customer.uplinkPort} />
                    <InfoRow label="Media" value={customer.media} />
                  </div>
                </div>

                <SectionHeader title="Speed & Bandwidth" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Committed Bandwidth" value={<span className="font-bold text-teal-700 dark:text-teal-400">{customer.committedBandwidth}</span>} />
                    <InfoRow label="Burst Bandwidth" value={customer.burstBandwidth} />
                    <InfoRow label="Upload Speed" value={customer.uploadSpeed} />
                    <InfoRow label="Download Speed" value={customer.downloadSpeed} />
                    <InfoRow label="Contention Ratio" value={customer.contentionRatio} />
                    <InfoRow label="VLAN ID" value={customer.vlanId} />
                    <InfoRow label="ONU / Device" value={customer.onuDevice} />
                  </div>
                </div>
              </div>
            )}

            {/* ── IP CONFIG ── */}
            {activeTab === "ip" && (
              <div className="space-y-4" data-testid="tab-content-cir-ip">
                <SectionHeader title="IP Configuration" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Static IP" value={<span className="font-mono text-blue-700 dark:text-blue-400">{customer.staticIp}</span>} />
                    <InfoRow label="Subnet Mask" value={<span className="font-mono">{customer.subnetMask}</span>} />
                    <InfoRow label="Gateway" value={<span className="font-mono">{customer.gateway}</span>} />
                    <InfoRow label="Primary DNS" value={<span className="font-mono">{customer.dns}</span>} />
                    <InfoRow label="Secondary DNS" value={<span className="font-mono">{customer.dns2}</span>} />
                    <InfoRow label="Public IP Block" value={<span className="font-mono">{customer.publicIpBlock}</span>} />
                  </div>
                </div>
              </div>
            )}

            {/* ── CONTRACT & SLA ── */}
            {activeTab === "contract" && (
              <div className="space-y-4" data-testid="tab-content-cir-contract">
                <SectionHeader title="Contract Details" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Contract Start Date" value={customer.contractStartDate} />
                    <InfoRow label="Contract End Date" value={customer.contractEndDate} />
                    <InfoRow label="Contract Duration" value={customer.contractDuration} />
                    <InfoRow label="SLA Level" value={customer.slaLevel ? `${customer.slaLevel}%` : "-"} />
                    <InfoRow label="Account Manager" value={customer.accountManager} />
                    <InfoRow label="Dedicated Account Manager" value={customer.dedicatedAccountManager} />
                    <InfoRow label="Auto Renewal" value={<BoolValue v={customer.autoRenewal} />} />
                  </div>
                </div>

                <SectionHeader title="SLA & Legal Terms" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="divide-y">
                    <InfoRow label="SLA Penalty Clause" value={customer.slaPenaltyClause || "-"} />
                    <InfoRow label="Custom SLA Terms" value={customer.customSla || "-"} />
                    <InfoRow label="Custom Pricing Agreement" value={customer.customPricingAgreement || "-"} />
                  </div>
                </div>
              </div>
            )}

            {/* ── BILLING ── */}
            {activeTab === "billing" && (
              <div className="space-y-4" data-testid="tab-content-cir-billing">
                <SectionHeader title="Billing Configuration" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Billing Mode" value={customer.billingMode} capitalize />
                    <InfoRow label="Payment Terms" value={customer.paymentTerms} />
                    <InfoRow label="Billing Cycle" value={customer.billingCycle} capitalize />
                    <InfoRow label="Invoice Type" value={customer.invoiceType === "tax" ? "Tax Invoice" : customer.invoiceType || "-"} />
                    <InfoRow label="Centralized Billing" value={<BoolValue v={customer.centralizedBilling} />} />
                    <InfoRow label="Per-Branch Billing" value={<BoolValue v={customer.perBranchBilling} />} />
                    <InfoRow label="Custom Invoice Format" value={customer.customInvoiceFormat} />
                    <InfoRow label="Late Fee Policy" value={customer.lateFeePolicy} />
                  </div>
                </div>

                <SectionHeader title="Charges" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Monthly Charges" value={<span className="font-bold text-green-700 dark:text-green-400">Rs. {parseFloat(customer.monthlyCharges || "0").toLocaleString()}</span>} />
                    <InfoRow label="Installation Charges" value={`Rs. ${parseFloat(customer.installationCharges || "0").toLocaleString()}`} />
                    <InfoRow label="Security Deposit" value={`Rs. ${parseFloat(customer.securityDeposit || "0").toLocaleString()}`} />
                    <InfoRow label="Credit Limit" value={`Rs. ${parseFloat(customer.creditLimit || "0").toLocaleString()}`} />
                    <InfoRow label="Billing Discount" value={customer.billingDiscount || "-"} />
                    <InfoRow label="OTC Amount" value={customer.otcAmount || "-"} />
                  </div>
                </div>
              </div>
            )}

            {/* ── MONITORING ── */}
            {activeTab === "monitoring" && (
              <div className="space-y-4" data-testid="tab-content-cir-monitoring">
                <SectionHeader title="Radius & Bandwidth Profiles" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Radius Profile" value={<span className="font-mono">{customer.radiusProfile}</span>} />
                    <InfoRow label="Bandwidth Profile Name" value={<span className="font-mono">{customer.bandwidthProfileName}</span>} />
                  </div>
                </div>

                <SectionHeader title="Monitoring Settings" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Monitoring Enabled" value={<BoolValue v={customer.monitoringEnabled} />} />
                    <InfoRow label="SNMP Monitoring" value={<BoolValue v={customer.snmpMonitoring} />} />
                    <InfoRow label="Traffic Alerts" value={<BoolValue v={customer.trafficAlerts} />} />
                  </div>
                </div>

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

                {customer.notes && (
                  <>
                    <SectionHeader title="Notes" />
                    <div className="bg-card border rounded-lg overflow-hidden">
                      <div className="px-4 py-3 text-sm text-foreground">{customer.notes}</div>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      {customer && (
        <CirEditDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          customer={customer}
          id={id || ""}
          vendors={vendors || []}
        />
      )}
    </div>
  );
}
