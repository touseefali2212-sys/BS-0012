import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { InsertCorporateCustomer } from "@shared/schema";

export const CORP_FORM_SECTIONS = ["Company Info", "Billing", "Contract & SLA", "Services", "Summary"];

export const INDUSTRY_TYPE_OPTIONS = ["Technology", "Finance", "Healthcare", "Manufacturing", "Education", "Retail", "Government", "Telecom", "Real Estate", "Pharmaceutical", "Logistics", "Other"];

export function CorporateCustomerFormFields({ form, section }: { form: UseFormReturn<InsertCorporateCustomer>; section: number }) {
  return (
    <>
      {section === 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Section A — Company Information</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name *</FormLabel><FormControl><Input data-testid="input-corp-company" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="contactFullName" render={({ field }) => (<FormItem><FormLabel>Contact Full Name</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="registrationNumber" render={({ field }) => (<FormItem><FormLabel>Registration Number</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="ntn" render={({ field }) => (<FormItem><FormLabel>NTN</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="industryType" render={({ field }) => (
              <FormItem><FormLabel>Industry Type</FormLabel><Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger></FormControl><SelectContent>{INDUSTRY_TYPE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )} />
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
        </div>
      )}
      {section === 1 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Section B — Billing Configuration</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="billingMode" render={({ field }) => (<FormItem><FormLabel>Billing Mode</FormLabel><Select onValueChange={field.onChange} value={field.value || "fixed"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="fixed">Fixed</SelectItem><SelectItem value="per_mbps">Per Mbps</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="centralizedBilling" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-6"><FormControl><Switch checked={field.value ?? true} onCheckedChange={field.onChange} /></FormControl><FormLabel>Centralized Billing</FormLabel></FormItem>)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="perBranchBilling" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Per-Branch Billing</FormLabel></FormItem>)} />
            <FormField control={form.control} name="taxEnabled" render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0 pt-2"><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl><FormLabel>Tax Enabled</FormLabel></FormItem>)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="paymentTerms" render={({ field }) => (
              <FormItem><FormLabel>Payment Terms</FormLabel><Select onValueChange={field.onChange} value={field.value || "net_30"}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="net_15">Net 15</SelectItem><SelectItem value="net_30">Net 30</SelectItem><SelectItem value="net_45">Net 45</SelectItem><SelectItem value="net_60">Net 60</SelectItem><SelectItem value="prepaid">Prepaid</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="customInvoiceFormat" render={({ field }) => (<FormItem><FormLabel>Custom Invoice Format</FormLabel><FormControl><Input placeholder="e.g., Detailed Line Items" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField control={form.control} name="monthlyBilling" render={({ field }) => (<FormItem><FormLabel>Monthly Billing</FormLabel><FormControl><Input type="number" data-testid="input-corp-billing" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="creditLimit" render={({ field }) => (<FormItem><FormLabel>Credit Limit</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="securityDeposit" render={({ field }) => (<FormItem><FormLabel>Security Deposit</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField control={form.control} name="whTaxPercent" render={({ field }) => (<FormItem><FormLabel>WHT Tax %</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="aitTaxPercent" render={({ field }) => (<FormItem><FormLabel>AIT Tax %</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="extraFeeTaxPercent" render={({ field }) => (<FormItem><FormLabel>Extra Fee Tax %</FormLabel><FormControl><Input type="number" {...field} value={field.value || "0"} /></FormControl><FormMessage /></FormItem>)} />
          </div>
        </div>
      )}
      {section === 2 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Section C — Contract & SLA</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="contractDuration" render={({ field }) => (<FormItem><FormLabel>Contract Duration</FormLabel><FormControl><Input placeholder="e.g., 12 months" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="dedicatedAccountManager" render={({ field }) => (<FormItem><FormLabel>Dedicated Account Manager</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="contractStartDate" render={({ field }) => (<FormItem><FormLabel>Contract Start</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="contractExpiryDate" render={({ field }) => (<FormItem><FormLabel>Contract Expiry</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <FormField control={form.control} name="customSla" render={({ field }) => (<FormItem><FormLabel>Custom SLA Terms</FormLabel><FormControl><Textarea rows={2} placeholder="SLA terms and uptime guarantee" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="customPricingAgreement" render={({ field }) => (<FormItem><FormLabel>Custom Pricing Agreement</FormLabel><FormControl><Textarea rows={2} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
        </div>
      )}
      {section === 3 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Section D — Managed Services</p>
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
        </div>
      )}
      {section === 4 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Section E — Summary & Status</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="totalConnections" render={({ field }) => (<FormItem><FormLabel>Total Connections</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="totalBandwidth" render={({ field }) => (<FormItem><FormLabel>Total Bandwidth</FormLabel><FormControl><Input placeholder="e.g., 200 Mbps" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={3} {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
        </div>
      )}
    </>
  );
}
