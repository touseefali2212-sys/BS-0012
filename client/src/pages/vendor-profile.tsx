import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Edit,
  Wallet,
  Phone,
  Mail,
  MapPin,
  User,
  Building2,
  Landmark,
  Globe,
  Network,
  Wifi,
  BarChart3,
  History,
  Headphones,
  Package,
  Star,
  CheckCircle,
  XCircle,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Zap,
  Clock,
  ExternalLink,
  Lock,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  Vendor,
  VendorPackage,
  VendorWalletTransaction,
  VendorBandwidthLink,
} from "@shared/schema";

const formatPKR = (value: string | number | null | undefined) => {
  const num = Number(value || 0);
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

export default function VendorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [profileTab, setProfileTab] = useState("overview");

  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: allBwLinks } = useQuery<VendorBandwidthLink[]>({
    queryKey: ["/api/vendor-bandwidth-links"],
  });

  const { data: allPackages } = useQuery<VendorPackage[]>({
    queryKey: ["/api/vendor-packages"],
  });

  const vendor = vendors?.find(v => v.id === Number(id)) ?? null;
  const vendorType = vendor?.vendorType === "panel" ? "panel" : "bandwidth";

  const { data: txns } = useQuery<VendorWalletTransaction[]>({
    queryKey: ["/api/vendor-wallet-transactions", vendor?.id],
    enabled: !!vendor,
    queryFn: async () => {
      if (!vendor) return [];
      const res = await fetch(`/api/vendor-wallet-transactions/${vendor.id}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const bwLinks = (allBwLinks || []).filter(l => l.vendorId === Number(id));
  const pkgs = (allPackages || []).filter(p => p.vendorId === Number(id));
  const transactions = txns || [];

  const contractDiff = vendor?.contractEndDate
    ? Math.ceil((new Date(vendor.contractEndDate).getTime() - Date.now()) / 86400000)
    : null;
  const totalMonthlyCost = bwLinks.reduce((s, l) => s + Number(l.totalMonthlyCost || 0), 0);
  const totalMbps = bwLinks.reduce((s, l) => s + Number(l.bandwidthMbps || 0), 0);
  const walletBalance = Number(vendor?.walletBalance || 0);
  const totalRecharged = transactions
    .filter(t => t.type === "recharge" || t.type === "credit")
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalDebited = transactions
    .filter(t => t.type === "debit" || t.type === "deduct")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const backUrl = `/vendors?tab=${vendorType === "panel" ? "panel-vendors" : "bandwidth-vendors"}`;

  if (vendorsLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground text-sm">Vendor not found.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setLocation("/vendors")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Vendors
        </Button>
      </div>
    );
  }

  return (
    <div className="page-fade-in">
      {/* Back bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b bg-background/80 sticky top-0 z-30 backdrop-blur-sm">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 text-xs"
          onClick={() => setLocation(backUrl)}
          data-testid="button-vendor-profile-back"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {vendorType === "panel" ? "Panel Vendors" : "Bandwidth Vendors"}
        </Button>
        <span className="text-muted-foreground text-xs hidden sm:block">/ Vendor Profile</span>
        <span className="text-xs font-medium hidden sm:block truncate">{vendor.name}</span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 text-xs"
            onClick={() => setLocation(`/vendors?tab=${vendorType === "panel" ? "panel-vendors" : "bandwidth-vendors"}&edit=${vendor.id}`)}
            data-testid="button-vendor-profile-edit"
          >
            <Edit className="h-3.5 w-3.5" />Edit
          </Button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="vendor-page-header px-6 py-6 text-white relative overflow-hidden">
        <div className="flex items-start gap-5 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white font-bold text-3xl shrink-0 shadow-lg">
            {vendor.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate" data-testid="text-vendor-profile-name">{vendor.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/20 text-xs">
                {vendorType === "bandwidth"
                  ? <><Wifi className="h-3 w-3 mr-1" />Bandwidth Vendor</>
                  : <><Globe className="h-3 w-3 mr-1" />Panel Vendor</>}
              </Badge>
              <Badge className={`text-xs border-0 ${vendor.status === "active" ? "bg-emerald-500/80 text-white hover:bg-emerald-500/80" : "bg-red-500/80 text-white hover:bg-red-500/80"}`}>
                {vendor.status === "active" ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                <span className="capitalize">{vendor.status}</span>
              </Badge>
              {vendor.slaLevel && (
                <Badge className="bg-yellow-500/80 text-white border-0 hover:bg-yellow-500/80 text-xs">
                  <Star className="h-3 w-3 mr-1" />{vendor.slaLevel} SLA
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-2.5 text-white/80 text-sm">
              {vendor.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{vendor.phone}</span>}
              {vendor.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{vendor.email}</span>}
              {vendor.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{vendor.city}</span>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white no-default-hover-elevate"
              onClick={() => setLocation(backUrl)}
              data-testid="button-vendor-profile-back-hero"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Back
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white no-default-hover-elevate"
              onClick={() => setLocation(`/vendors?tab=${vendorType === "panel" ? "panel-vendors" : "bandwidth-vendors"}&edit=${vendor.id}`)}
              data-testid="button-vendor-profile-edit-hero"
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />Edit
            </Button>
          </div>
        </div>

        {/* Quick stats pills */}
        <div className="flex flex-wrap gap-3 mt-5 relative z-10">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-white min-w-[100px]">
            <p className="text-[10px] uppercase tracking-wider text-white/70">Wallet Balance</p>
            <p className="text-lg font-bold">{formatPKR(walletBalance)}</p>
          </div>
          {vendorType === "panel" && (
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-white min-w-[100px]">
              <p className="text-[10px] uppercase tracking-wider text-white/70">Packages</p>
              <p className="text-lg font-bold">{pkgs.length}</p>
            </div>
          )}
          {vendorType === "bandwidth" && (
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-white min-w-[100px]">
              <p className="text-[10px] uppercase tracking-wider text-white/70">Total Bandwidth</p>
              <p className="text-lg font-bold">{totalMbps} <span className="text-sm font-normal">Mbps</span></p>
            </div>
          )}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-white min-w-[100px]">
            <p className="text-[10px] uppercase tracking-wider text-white/70">Transactions</p>
            <p className="text-lg font-bold">{transactions.length}</p>
          </div>
          {contractDiff !== null && (
            <div className={`backdrop-blur-sm rounded-xl px-4 py-2.5 text-white min-w-[100px] ${contractDiff < 0 ? "bg-red-500/40" : contractDiff <= 30 ? "bg-amber-500/40" : "bg-white/15"}`}>
              <p className="text-[10px] uppercase tracking-wider text-white/70">Contract</p>
              <p className="text-lg font-bold">{contractDiff < 0 ? "Expired" : `${contractDiff}d left`}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="p-5">
        <Tabs value={profileTab} onValueChange={setProfileTab}>
          <TabsList className="mb-5 flex-wrap h-auto gap-1 bg-muted/60">
            <TabsTrigger value="overview" className="text-xs gap-1.5"><User className="h-3.5 w-3.5" />Overview</TabsTrigger>
            <TabsTrigger value="connectivity" className="text-xs gap-1.5">
              {vendorType === "bandwidth" ? <><Network className="h-3.5 w-3.5" />Bandwidth Links</> : <><Globe className="h-3.5 w-3.5" />Panel Info</>}
            </TabsTrigger>
            <TabsTrigger value="accounting" className="text-xs gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Accounting</TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs gap-1.5"><History className="h-3.5 w-3.5" />Transactions</TabsTrigger>
            {vendorType === "panel" && <TabsTrigger value="packages" className="text-xs gap-1.5"><Package className="h-3.5 w-3.5" />Packages</TabsTrigger>}
            <TabsTrigger value="support" className="text-xs gap-1.5"><Headphones className="h-3.5 w-3.5" />Support</TabsTrigger>
          </TabsList>

          {/* ─ Overview ─ */}
          <TabsContent value="overview" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10"><User className="h-3.5 w-3.5 text-primary" /></div>
                    Contact & Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {vendor.contactPerson && (
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><User className="h-3.5 w-3.5 text-primary" /></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Contact Person</p><p className="text-sm font-medium">{vendor.contactPerson}</p></div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/40">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0"><Phone className="h-3.5 w-3.5 text-green-600 dark:text-green-400" /></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Phone</p><p className="text-sm font-medium">{vendor.phone}</p></div>
                  </div>
                  {vendor.email && (
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0"><Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p><p className="text-sm font-medium">{vendor.email}</p></div>
                    </div>
                  )}
                  {vendor.city && (
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0"><MapPin className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">City</p><p className="text-sm font-medium">{vendor.city}</p></div>
                    </div>
                  )}
                  {vendor.address && (
                    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0 mt-0.5"><Building2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Address</p><p className="text-sm">{vendor.address}</p></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10"><Building2 className="h-3.5 w-3.5 text-primary" /></div>
                    Business Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Service Type</p>
                      <p className="text-sm font-semibold capitalize">{vendor.serviceType}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">SLA Level</p>
                      <p className={`text-sm font-semibold capitalize ${vendor.slaLevel === "enterprise" ? "text-purple-600 dark:text-purple-400" : vendor.slaLevel === "premium" ? "text-blue-600 dark:text-blue-400" : ""}`}>{vendor.slaLevel || "Standard"}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Vendor Type</p>
                      <p className="text-sm font-semibold capitalize">{vendor.vendorType || vendorType}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Status</p>
                      <p className={`text-sm font-semibold capitalize ${vendor.status === "active" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{vendor.status}</p>
                    </div>
                  </div>
                  {vendor.ntn && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">NTN / Tax ID</p>
                      <p className="text-sm font-mono font-semibold">{vendor.ntn}</p>
                    </div>
                  )}
                  <div className="border rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1"><Calendar className="h-3 w-3" />Contract Period</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Start Date</p>
                        <p className="text-sm font-medium">{vendor.contractStartDate || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">End Date</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          <p className="text-sm font-medium">{vendor.contractEndDate || "—"}</p>
                          {contractDiff !== null && (
                            contractDiff < 0
                              ? <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-950">Expired</Badge>
                              : contractDiff <= 30
                                ? <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-950">{contractDiff}d left</Badge>
                                : <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-green-600 bg-green-50 dark:text-green-300 dark:bg-green-950">{contractDiff}d left</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {(vendor.bankName || vendor.bankAccountNumber || vendor.bankAccountTitle) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10"><Landmark className="h-3.5 w-3.5 text-primary" /></div>
                    Banking Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {vendor.bankName && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Bank Name</p>
                        <p className="text-sm font-semibold">{vendor.bankName}</p>
                      </div>
                    )}
                    {vendor.bankAccountTitle && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Account Title</p>
                        <p className="text-sm font-semibold">{vendor.bankAccountTitle}</p>
                      </div>
                    )}
                    {vendor.bankAccountNumber && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Account No.</p>
                        <p className="text-sm font-mono font-semibold">{vendor.bankAccountNumber}</p>
                      </div>
                    )}
                    {vendor.bankBranchCode && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Branch Code</p>
                        <p className="text-sm font-mono font-semibold">{vendor.bankBranchCode}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ─ Connectivity / Panel Info ─ */}
          <TabsContent value="connectivity" className="space-y-4 mt-0">
            {vendorType === "bandwidth" ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950"><Network className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Links</p></div>
                      <p className="text-2xl font-bold">{bwLinks.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-md bg-cyan-100 dark:bg-cyan-950"><Zap className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Bandwidth</p></div>
                      <p className="text-2xl font-bold">{totalMbps} <span className="text-sm font-normal text-muted-foreground">Mbps</span></p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3 px-4">
                      <div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-950"><DollarSign className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly Cost</p></div>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatPKR(totalMonthlyCost)}</p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Network className="h-4 w-4 text-primary" />Bandwidth Links ({bwLinks.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bwLinks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wifi className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No bandwidth links added yet</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Link Name</TableHead>
                              <TableHead className="text-xs">IP Address</TableHead>
                              <TableHead className="text-xs">VLAN</TableHead>
                              <TableHead className="text-xs">City</TableHead>
                              <TableHead className="text-xs">Mbps</TableHead>
                              <TableHead className="text-xs">Rate/Mbps</TableHead>
                              <TableHead className="text-xs">Monthly Cost</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bwLinks.map(link => (
                              <TableRow key={link.id}>
                                <TableCell className="text-sm font-medium">{link.linkName}</TableCell>
                                <TableCell className="font-mono text-xs">{link.ipAddress || "—"}</TableCell>
                                <TableCell className="text-xs">{link.vlanDetail || "—"}</TableCell>
                                <TableCell className="text-sm">{link.city || "—"}</TableCell>
                                <TableCell className="text-sm font-bold text-blue-600 dark:text-blue-400">{link.bandwidthMbps}</TableCell>
                                <TableCell className="text-sm">{formatPKR(link.bandwidthRate)}</TableCell>
                                <TableCell className="text-sm font-bold">{formatPKR(link.totalMonthlyCost)}</TableCell>
                                <TableCell><Badge variant={link.status === "active" ? "default" : "secondary"} className="text-[10px] no-default-active-elevate capitalize">{link.status}</Badge></TableCell>
                              </TableRow>
                            ))}
                            {bwLinks.length > 1 && (
                              <TableRow className="font-bold bg-muted/60">
                                <TableCell colSpan={4} className="text-xs font-bold">TOTALS</TableCell>
                                <TableCell className="text-sm font-bold text-blue-600 dark:text-blue-400">{totalMbps} Mbps</TableCell>
                                <TableCell />
                                <TableCell className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatPKR(totalMonthlyCost)}</TableCell>
                                <TableCell />
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    {bwLinks.some(l => l.notes) && (
                      <div className="mt-3 space-y-2 pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground">Notes:</p>
                        {bwLinks.filter(l => l.notes).map(link => (
                          <div key={link.id} className="text-xs bg-muted/40 rounded p-2.5">
                            <span className="font-medium">{link.linkName}:</span> {link.notes}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wifi className="h-4 w-4 text-primary" />Service Summary</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Contracted Bandwidth</p>
                        <p className="text-sm font-semibold">{vendor.totalBandwidth || "—"}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Used Bandwidth</p>
                        <p className="text-sm font-semibold">{vendor.usedBandwidth || "—"}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Billing Cost</p>
                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{formatPKR(vendor.bandwidthCost)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10"><Globe className="h-3.5 w-3.5 text-primary" /></div>
                        Panel Access
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {vendor.panelUrl ? (
                        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
                          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Panel URL</p>
                            <a href={vendor.panelUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1">
                              <span className="truncate">{vendor.panelUrl}</span><ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 bg-muted/40 rounded-lg p-3">
                          <Globe className="h-5 w-5 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No panel URL configured</p>
                        </div>
                      )}
                      {vendor.panelUsername ? (
                        <div className="flex items-center gap-3 bg-muted/40 rounded-lg p-3">
                          <Lock className="h-5 w-5 text-primary shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Panel Username</p>
                            <p className="text-sm font-mono font-semibold">{vendor.panelUsername}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 bg-muted/40 rounded-lg p-3">
                          <Lock className="h-5 w-5 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No panel username configured</p>
                        </div>
                      )}
                      {vendor.lastRechargeDate && (
                        <div className="flex items-center gap-3 bg-muted/40 rounded-lg p-3">
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Recharge</p><p className="text-sm font-medium">{vendor.lastRechargeDate}</p></div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-950"><Wallet className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /></div>
                        Panel Wallet
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Current Balance</p>
                        <p className={`text-4xl font-bold ${walletBalance >= 0 ? "text-purple-600 dark:text-purple-400" : "text-red-600 dark:text-red-400"}`}>{formatPKR(walletBalance)}</p>
                        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                          <div className="bg-green-50 dark:bg-green-950/40 rounded p-2">
                            <p className="text-muted-foreground">Total In</p>
                            <p className="font-bold text-green-600 dark:text-green-400">{formatPKR(totalRecharged)}</p>
                          </div>
                          <div className="bg-red-50 dark:bg-red-950/40 rounded p-2">
                            <p className="text-muted-foreground">Total Out</p>
                            <p className="font-bold text-red-600 dark:text-red-400">{formatPKR(totalDebited)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ─ Accounting ─ */}
          <TabsContent value="accounting" className="space-y-4 mt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-md bg-green-100 dark:bg-green-950"><Wallet className="h-3.5 w-3.5 text-green-600 dark:text-green-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Wallet Balance</p></div>
                  <p className={`text-xl font-bold ${walletBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{formatPKR(walletBalance)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950"><ArrowDownLeft className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Recharged</p></div>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatPKR(totalRecharged)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-md bg-red-100 dark:bg-red-950"><ArrowUpRight className="h-3.5 w-3.5 text-red-600 dark:text-red-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Debited</p></div>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatPKR(totalDebited)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-2"><div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-950"><DollarSign className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /></div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Payable Amount</p></div>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{formatPKR(vendor.payableAmount)}</p>
                </CardContent>
              </Card>
            </div>

            {vendorType === "bandwidth" && bwLinks.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Monthly Cost Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Link Name</TableHead>
                          <TableHead className="text-xs">Mbps</TableHead>
                          <TableHead className="text-xs">Rate/Mbps</TableHead>
                          <TableHead className="text-xs">Monthly Cost</TableHead>
                          <TableHead className="text-xs">% of Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bwLinks.map(link => {
                          const cost = Number(link.totalMonthlyCost || 0);
                          const pct = totalMonthlyCost > 0 ? ((cost / totalMonthlyCost) * 100).toFixed(1) : "0";
                          return (
                            <TableRow key={link.id}>
                              <TableCell className="text-sm font-medium">{link.linkName}</TableCell>
                              <TableCell className="text-sm">{link.bandwidthMbps}</TableCell>
                              <TableCell className="text-sm">{formatPKR(link.bandwidthRate)}</TableCell>
                              <TableCell className="text-sm font-bold">{formatPKR(cost)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-20 bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} /></div>
                                  <span className="text-xs text-muted-foreground">{pct}%</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {bwLinks.length > 1 && (
                          <TableRow className="bg-muted/60 font-bold">
                            <TableCell className="text-xs font-bold">TOTAL</TableCell>
                            <TableCell className="text-xs font-bold">{totalMbps} Mbps</TableCell>
                            <TableCell />
                            <TableCell className="text-sm font-bold">{formatPKR(totalMonthlyCost)}</TableCell>
                            <TableCell className="text-xs font-bold">100%</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4 text-primary" />Transaction Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Transactions</p>
                    <p className="text-2xl font-bold">{transactions.length}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/40 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Recharges</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{transactions.filter(t => t.type === "recharge" || t.type === "credit").length}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/40 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Deductions</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{transactions.filter(t => t.type === "debit" || t.type === "deduct").length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─ Transactions ─ */}
          <TabsContent value="transactions" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4 text-primary" />Transaction History ({transactions.length})</CardTitle>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><ArrowDownLeft className="h-3.5 w-3.5" />In: {formatPKR(totalRecharged)}</span>
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><ArrowUpRight className="h-3.5 w-3.5" />Out: {formatPKR(totalDebited)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No transactions yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Date & Time</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs">Amount</TableHead>
                          <TableHead className="text-xs">Balance After</TableHead>
                          <TableHead className="text-xs">Method</TableHead>
                          <TableHead className="text-xs">Reference</TableHead>
                          <TableHead className="text-xs">By</TableHead>
                          <TableHead className="text-xs">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map(txn => {
                          const isIn = txn.type === "recharge" || txn.type === "credit";
                          return (
                            <TableRow key={txn.id} className={isIn ? "bg-green-50/30 dark:bg-green-950/10" : "bg-red-50/30 dark:bg-red-950/10"}>
                              <TableCell className="text-xs whitespace-nowrap">{txn.createdAt ? new Date(txn.createdAt).toLocaleString() : "—"}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${isIn ? "text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950" : "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950"}`}>
                                  {isIn ? <ArrowDownLeft className="h-3 w-3 mr-0.5 inline" /> : <ArrowUpRight className="h-3 w-3 mr-0.5 inline" />}
                                  {txn.type}
                                </Badge>
                              </TableCell>
                              <TableCell className={`text-sm font-bold ${isIn ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{isIn ? "+" : "-"}{formatPKR(txn.amount)}</TableCell>
                              <TableCell className="text-sm">{formatPKR(txn.balanceAfter)}</TableCell>
                              <TableCell className="text-xs capitalize">{txn.paymentMethod?.replace(/_/g, " ") || "—"}</TableCell>
                              <TableCell className="text-xs font-mono">{txn.reference || "—"}</TableCell>
                              <TableCell className="text-xs">{txn.performedBy || "—"}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{txn.description || txn.notes || "—"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─ Packages (Panel only) ─ */}
          {vendorType === "panel" && (
            <TabsContent value="packages" className="mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4 text-primary" />Packages ({pkgs.length})</CardTitle>
                    {pkgs.length > 0 && (
                      <Badge variant="secondary" className="no-default-active-elevate text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950">
                        Avg Margin: {formatPKR(pkgs.reduce((s, p) => s + Number(p.ispSellingPrice || 0) - Number(p.vendorPrice || 0), 0) / pkgs.length)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {pkgs.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No packages assigned to this vendor</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Package Name</TableHead>
                            <TableHead className="text-xs">Speed</TableHead>
                            <TableHead className="text-xs">Vendor Price</TableHead>
                            <TableHead className="text-xs">ISP Price</TableHead>
                            <TableHead className="text-xs">Reseller Price</TableHead>
                            <TableHead className="text-xs">Data Limit</TableHead>
                            <TableHead className="text-xs">Validity</TableHead>
                            <TableHead className="text-xs">Margin</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pkgs.map(pkg => {
                            const margin = Number(pkg.ispSellingPrice || 0) - Number(pkg.vendorPrice || 0);
                            return (
                              <TableRow key={pkg.id}>
                                <TableCell className="text-sm font-medium">{pkg.packageName}</TableCell>
                                <TableCell className="text-sm">{pkg.speed || "—"}</TableCell>
                                <TableCell className="text-sm">{formatPKR(pkg.vendorPrice)}</TableCell>
                                <TableCell className="text-sm">{formatPKR(pkg.ispSellingPrice)}</TableCell>
                                <TableCell className="text-sm">{pkg.resellerPrice ? formatPKR(pkg.resellerPrice) : "—"}</TableCell>
                                <TableCell className="text-sm">{pkg.dataLimit || "Unlimited"}</TableCell>
                                <TableCell className="text-sm">{pkg.validity || "—"}</TableCell>
                                <TableCell className={`text-sm font-semibold ${margin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{formatPKR(margin)}</TableCell>
                                <TableCell><Badge variant={pkg.status === "active" ? "default" : "secondary"} className="text-[10px] no-default-active-elevate capitalize">{pkg.status || "active"}</Badge></TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ─ Support ─ */}
          <TabsContent value="support" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10"><Headphones className="h-3.5 w-3.5 text-primary" /></div>
                    Support Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {vendor.contactPerson && (
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><User className="h-3.5 w-3.5 text-primary" /></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Primary Contact</p><p className="text-sm font-medium">{vendor.contactPerson}</p></div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/40">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0"><Phone className="h-3.5 w-3.5 text-green-600 dark:text-green-400" /></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Phone</p><p className="text-sm font-medium">{vendor.phone}</p></div>
                  </div>
                  {vendor.email && (
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0"><Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /></div>
                      <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p><p className="text-sm font-medium">{vendor.email}</p></div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-yellow-100 dark:bg-yellow-950"><Shield className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" /></div>
                    SLA & Service Level
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className={`rounded-xl p-4 text-center ${vendor.slaLevel === "enterprise" ? "bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900" : vendor.slaLevel === "premium" ? "bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900" : "bg-muted/50"}`}>
                    <Star className={`h-8 w-8 mx-auto mb-2 ${vendor.slaLevel === "enterprise" ? "text-purple-600 dark:text-purple-400" : vendor.slaLevel === "premium" ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
                    <p className={`text-lg font-bold capitalize ${vendor.slaLevel === "enterprise" ? "text-purple-700 dark:text-purple-300" : vendor.slaLevel === "premium" ? "text-blue-700 dark:text-blue-300" : "text-foreground"}`}>{vendor.slaLevel || "Standard"} SLA</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {vendor.slaLevel === "enterprise" ? "Priority support with dedicated account manager" : vendor.slaLevel === "premium" ? "Enhanced support with faster response times" : "Standard support with regular response times"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-muted-foreground">Response Time</p>
                      <p className="font-bold mt-0.5">{vendor.slaLevel === "enterprise" ? "1 hour" : vendor.slaLevel === "premium" ? "4 hours" : "24 hours"}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-muted-foreground">Resolution Time</p>
                      <p className="font-bold mt-0.5">{vendor.slaLevel === "enterprise" ? "4 hours" : vendor.slaLevel === "premium" ? "24 hours" : "72 hours"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10"><Headphones className="h-3.5 w-3.5 text-primary" /></div>
                  Escalation Path
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 text-center text-xs">
                  {["Level 1 — Contact Person", "Level 2 — Technical Team", "Level 3 — Management"].map((level, i) => (
                    <div key={i} className="flex-1 bg-muted/50 rounded-lg p-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto mb-2 text-white text-[11px] font-bold ${i === 0 ? "bg-green-500" : i === 1 ? "bg-blue-500" : "bg-purple-500"}`}>{i + 1}</div>
                      <p className="font-medium">{level.split("—")[0].trim()}</p>
                      <p className="text-muted-foreground mt-0.5">{level.split("—")[1]?.trim()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
