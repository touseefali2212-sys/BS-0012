import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { InsertCirCustomer } from "@shared/schema";

export const CIR_FORM_SECTIONS = ["Company Info", "Bandwidth", "IP Config", "Contract & SLA", "Billing", "Monitoring"];

export function CirCustomerFormFields({ form, section, vendors }: { form: UseFormReturn<InsertCirCustomer>; section: number; vendors: any[] }) {
  return (
    <>
      {section === 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Section A — Company Information</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name *</FormLabel><FormControl><Input data-testid="input-cir-company" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input data-testid="input-cir-contact" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
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
          <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="customerType" render={({ field }) => (<FormItem><FormLabel>Customer Type</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value || "active"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="expired">Expired</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        </div>
      )}
      {section === 1 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Section B — Bandwidth Configuration</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="vendorId" render={({ field }) => (
              <FormItem><FormLabel>Vendor</FormLabel><Select onValueChange={v => field.onChange(v ? parseInt(v) : null)} value={field.value?.toString() || ""}><FormControl><SelectTrigger data-testid="select-cir-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger></FormControl><SelectContent>{(vendors || []).map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="vendorPort" render={({ field }) => (<FormItem><FormLabel>Vendor Port</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="serviceType" render={({ field }) => (<FormItem><FormLabel>Service Type</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="linkType" render={({ field }) => (<FormItem><FormLabel>Link Type</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="media" render={({ field }) => (<FormItem><FormLabel>Media</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="committedBandwidth" render={({ field }) => (<FormItem><FormLabel>Committed Bandwidth</FormLabel><FormControl><Input placeholder="e.g., 20 Mbps" data-testid="input-cir-bandwidth" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="burstBandwidth" render={({ field }) => (<FormItem><FormLabel>Burst Bandwidth</FormLabel><FormControl><Input placeholder="e.g., 50 Mbps" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="uploadSpeed" render={({ field }) => (<FormItem><FormLabel>Upload Speed</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="downloadSpeed" render={({ field }) => (<FormItem><FormLabel>Download Speed</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="contentionRatio" render={({ field }) => (<FormItem><FormLabel>Contention Ratio</FormLabel><FormControl><Input placeholder="1:1" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="vlanId" render={({ field }) => (<FormItem><FormLabel>VLAN ID</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="onuDevice" render={({ field }) => (<FormItem><FormLabel>ONU / Device</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
        </div>
      )}
      {section === 2 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Section C — IP Configuration</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="staticIp" render={({ field }) => (<FormItem><FormLabel>Static IP</FormLabel><FormControl><Input placeholder="e.g., 203.0.113.10" data-testid="input-cir-ip" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="subnetMask" render={({ field }) => (<FormItem><FormLabel>Subnet Mask</FormLabel><FormControl><Input placeholder="255.255.255.0" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="gateway" render={({ field }) => (<FormItem><FormLabel>Gateway</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="dns" render={({ field }) => (<FormItem><FormLabel>Primary DNS</FormLabel><FormControl><Input placeholder="8.8.8.8" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="dns2" render={({ field }) => (<FormItem><FormLabel>Secondary DNS</FormLabel><FormControl><Input placeholder="8.8.4.4" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="publicIpBlock" render={({ field }) => (<FormItem><FormLabel>Public IP Block</FormLabel><FormControl><Input placeholder="e.g., /29 block" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
        </div>
      )}
      {section === 3 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Section D — Contract & SLA</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="contractStartDate" render={({ field }) => (<FormItem><FormLabel>Contract Start</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="contractEndDate" render={({ field }) => (<FormItem><FormLabel>Contract End</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="contractDuration" render={({ field }) => (<FormItem><FormLabel>Duration</FormLabel><FormControl><Input placeholder="12 months" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="slaLevel" render={({ field }) => (<FormItem><FormLabel>SLA Level (% Uptime)</FormLabel><FormControl><Input placeholder="99.5" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <FormField control={form.control} name="autoRenewal" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Auto Renewal</FormLabel></FormItem>)} />
          <FormField control={form.control} name="slaPenaltyClause" render={({ field }) => (<FormItem><FormLabel>SLA Penalty Clause</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="customSla" render={({ field }) => (<FormItem><FormLabel>Custom SLA Terms</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="customPricingAgreement" render={({ field }) => (<FormItem><FormLabel>Custom Pricing Agreement</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
        </div>
      )}
      {section === 4 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Section E — Billing Configuration</p>
          <div className="grid grid-cols-3 gap-4">
            <FormField control={form.control} name="monthlyCharges" render={({ field }) => (<FormItem><FormLabel>Monthly Charges</FormLabel><FormControl><Input type="number" data-testid="input-cir-monthly" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="installationCharges" render={({ field }) => (<FormItem><FormLabel>Installation</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="securityDeposit" render={({ field }) => (<FormItem><FormLabel>Security Deposit</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="billingCycle" render={({ field }) => (
              <FormItem><FormLabel>Billing Cycle</FormLabel><Select onValueChange={field.onChange} value={field.value || "monthly"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="invoiceType" render={({ field }) => (
              <FormItem><FormLabel>Invoice Type</FormLabel><Select onValueChange={field.onChange} value={field.value || "tax"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="tax">Tax Invoice</SelectItem><SelectItem value="non_tax">Non-Tax</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="paymentTerms" render={({ field }) => (<FormItem><FormLabel>Payment Terms</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="lateFeePolicy" render={({ field }) => (<FormItem><FormLabel>Late Fee Policy</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="centralizedBilling" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Centralized Billing</FormLabel></FormItem>)} />
            <FormField control={form.control} name="perBranchBilling" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Per-Branch Billing</FormLabel></FormItem>)} />
          </div>
        </div>
      )}
      {section === 5 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Section F — Monitoring & Radius</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="radiusProfile" render={({ field }) => (<FormItem><FormLabel>Radius Profile</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="bandwidthProfileName" render={({ field }) => (<FormItem><FormLabel>Bandwidth Profile</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField control={form.control} name="monitoringEnabled" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Monitoring</FormLabel></FormItem>)} />
            <FormField control={form.control} name="snmpMonitoring" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">SNMP</FormLabel></FormItem>)} />
            <FormField control={form.control} name="trafficAlerts" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Traffic Alerts</FormLabel></FormItem>)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField control={form.control} name="managedRouter" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Managed Router</FormLabel></FormItem>)} />
            <FormField control={form.control} name="firewall" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Firewall</FormLabel></FormItem>)} />
            <FormField control={form.control} name="loadBalancer" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Load Balancer</FormLabel></FormItem>)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField control={form.control} name="dedicatedSupport" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Dedicated Support</FormLabel></FormItem>)} />
            <FormField control={form.control} name="backupLink" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Backup Link</FormLabel></FormItem>)} />
            <FormField control={form.control} name="monitoringSla" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel className="text-sm">Monitoring SLA</FormLabel></FormItem>)} />
          </div>
          <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
        </div>
      )}
    </>
  );
}
