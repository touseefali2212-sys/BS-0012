import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Wifi,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Plus,
  Trash2,
  Edit,
  Search,
  RefreshCw,
  Activity,
  Wallet,
  Server,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Building2,
  Zap,
  PieChart,
  Calendar,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertBandwidthPurchaseSchema } from "@shared/schema";
import type { BandwidthPurchase, Vendor, Reseller, ResellerWalletTransaction } from "@shared/schema";
import { z } from "zod";

const purchaseFormSchema = insertBandwidthPurchaseSchema.extend({
  capacityMbps: z.union([z.number(), z.string()]).transform(v => String(v)),
  costAmount: z.union([z.number(), z.string()]).transform(v => String(v)),
});

type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

function fmt(n: number | string | undefined | null, decimals = 2) {
  return Number(n || 0).toLocaleString("en-PK", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function StatCard({ title, value, sub, icon: Icon, color, isLoading }: {
  title: string; value: string | number; sub?: string; icon: React.ElementType; color: string; isLoading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </div>
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mini bar chart component
function MiniBarChart({ data, color = "bg-primary" }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className={`w-full rounded-t ${color} opacity-80`}
            style={{ height: `${Math.max(4, (d.value / max) * 56)}px` }}
            title={`${d.label}: ${fmt(d.value)}`}
          />
        </div>
      ))}
    </div>
  );
}

export default function BandwidthAccountingPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [editPurchase, setEditPurchase] = useState<BandwidthPurchase | null>(null);
  const [deletePurchaseId, setDeletePurchaseId] = useState<number | null>(null);
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [txnSearch, setTxnSearch] = useState("");

  const { data: purchases, isLoading: purchasesLoading } = useQuery<BandwidthPurchase[]>({
    queryKey: ["/api/bandwidth-purchases"],
  });

  const { data: poolStats, isLoading: poolLoading } = useQuery<{
    totalPurchasedMbps: number; allocatedMbps: number; availableMbps: number;
    utilizationPct: string; totalPurchaseCost: number; totalRechargeRevenue: number;
    netProfit: number; totalPurchases: number; totalResellers: number; activeResellers: number;
  }>({
    queryKey: ["/api/bandwidth-pool/stats"],
  });

  const { data: profitLoss, isLoading: profitLoading } = useQuery<{
    label: string; key: string; purchaseCost: number; rechargeRevenue: number; profit: number;
  }[]>({
    queryKey: ["/api/profit-loss-report"],
  });

  const { data: vendors } = useQuery<Vendor[]>({ queryKey: ["/api/vendors"] });
  const { data: resellers } = useQuery<Reseller[]>({ queryKey: ["/api/resellers"] });
  const { data: resellerTxns, isLoading: txnsLoading } = useQuery<ResellerWalletTransaction[]>({
    queryKey: ["/api/reseller-wallet-transactions/all"],
  });

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      vendorId: 0,
      vendorName: "",
      capacityMbps: "",
      costAmount: "",
      currency: "PKR",
      purchaseDate: new Date().toISOString().split("T")[0],
      status: "active",
      notes: "",
      reference: "",
      approvedBy: "",
      performedBy: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PurchaseFormValues) => apiRequest("POST", "/api/bandwidth-purchases", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bandwidth-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bandwidth-pool/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profit-loss-report"] });
      setShowAddPurchase(false);
      form.reset();
      toast({ title: "Bandwidth purchase recorded successfully" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PurchaseFormValues> }) =>
      apiRequest("PATCH", `/api/bandwidth-purchases/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bandwidth-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bandwidth-pool/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profit-loss-report"] });
      setEditPurchase(null);
      toast({ title: "Purchase updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/bandwidth-purchases/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bandwidth-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bandwidth-pool/stats"] });
      setDeletePurchaseId(null);
      toast({ title: "Purchase deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const onSubmit = (data: PurchaseFormValues) => {
    const vendor = vendors?.find(v => v.id === Number(data.vendorId));
    createMutation.mutate({ ...data, vendorName: vendor?.companyName || data.vendorName || "" });
  };

  const openEdit = (p: BandwidthPurchase) => {
    setEditPurchase(p);
    form.reset({
      vendorId: p.vendorId,
      vendorName: p.vendorName || "",
      capacityMbps: p.capacityMbps,
      costAmount: p.costAmount,
      currency: p.currency || "PKR",
      purchaseDate: p.purchaseDate,
      status: p.status,
      notes: p.notes || "",
      reference: p.reference || "",
      approvedBy: p.approvedBy || "",
      performedBy: p.performedBy || "",
    });
  };

  const filteredPurchases = useMemo(() => {
    const q = purchaseSearch.toLowerCase();
    return (purchases || []).filter(p =>
      !q || (p.vendorName || "").toLowerCase().includes(q) || (p.reference || "").toLowerCase().includes(q)
    );
  }, [purchases, purchaseSearch]);

  const filteredTxns = useMemo(() => {
    const q = txnSearch.toLowerCase();
    return (resellerTxns || [])
      .filter(t => t.type === "credit" || t.type === "recharge")
      .filter(t => !q || (t.reference || "").toLowerCase().includes(q) || String(t.resellerId).includes(q));
  }, [resellerTxns, txnSearch]);

  const totalRevenue12m = useMemo(() => (profitLoss || []).reduce((s, m) => s + m.rechargeRevenue, 0), [profitLoss]);
  const totalCost12m = useMemo(() => (profitLoss || []).reduce((s, m) => s + m.purchaseCost, 0), [profitLoss]);
  const totalProfit12m = totalRevenue12m - totalCost12m;

  const revenueChartData = (profitLoss || []).map(m => ({ label: m.label, value: m.rechargeRevenue }));
  const costChartData = (profitLoss || []).map(m => ({ label: m.label, value: m.purchaseCost }));
  const profitChartData = (profitLoss || []).map(m => ({ label: m.label, value: Math.max(0, m.profit) }));

  const utilizationPct = parseFloat(poolStats?.utilizationPct || "0");

  // Top resellers by wallet balance
  const topResellers = useMemo(() =>
    [...(resellers || [])].sort((a, b) => parseFloat(b.walletBalance || "0") - parseFloat(a.walletBalance || "0")).slice(0, 5),
    [resellers]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wifi className="w-6 h-6 text-primary" />
            Bandwidth Reseller Accounting
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Internal bandwidth pool management, reseller distribution & profit/loss engine
          </p>
        </div>
        <Button onClick={() => { setShowAddPurchase(true); form.reset(); }} data-testid="btn-add-purchase">
          <Plus className="w-4 h-4 mr-2" />
          Record Bandwidth Purchase
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard"><BarChart3 className="w-4 h-4 mr-1" />Dashboard</TabsTrigger>
          <TabsTrigger value="purchases" data-testid="tab-purchases"><ShoppingCart className="w-4 h-4 mr-1" />Bandwidth Purchases</TabsTrigger>
          <TabsTrigger value="pool" data-testid="tab-pool"><Server className="w-4 h-4 mr-1" />Bandwidth Pool</TabsTrigger>
          <TabsTrigger value="recharges" data-testid="tab-recharges"><Wallet className="w-4 h-4 mr-1" />Reseller Recharges</TabsTrigger>
          <TabsTrigger value="profit-loss" data-testid="tab-profit-loss"><TrendingUp className="w-4 h-4 mr-1" />Profit / Loss</TabsTrigger>
        </TabsList>

        {/* ─── DASHBOARD ─── */}
        <TabsContent value="dashboard" className="space-y-6 mt-4">
          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Bandwidth Purchased"
              value={`${fmt(poolStats?.totalPurchasedMbps, 0)} Mbps`}
              sub={`${poolStats?.totalPurchases || 0} active contracts`}
              icon={Wifi}
              color="bg-blue-600"
              isLoading={poolLoading}
            />
            <StatCard
              title="Total Purchase Cost"
              value={`PKR ${fmt(poolStats?.totalPurchaseCost)}`}
              sub="All active contracts"
              icon={DollarSign}
              color="bg-red-500"
              isLoading={poolLoading}
            />
            <StatCard
              title="Total Recharge Revenue"
              value={`PKR ${fmt(poolStats?.totalRechargeRevenue)}`}
              sub="All time reseller recharges"
              icon={ArrowUpCircle}
              color="bg-green-600"
              isLoading={poolLoading}
            />
            <StatCard
              title="Net Profit"
              value={`PKR ${fmt(poolStats?.netProfit)}`}
              sub="Revenue − Purchase Cost"
              icon={(poolStats?.netProfit || 0) >= 0 ? TrendingUp : TrendingDown}
              color={(poolStats?.netProfit || 0) >= 0 ? "bg-emerald-600" : "bg-orange-600"}
              isLoading={poolLoading}
            />
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Pool Utilization"
              value={`${poolStats?.utilizationPct || 0}%`}
              sub={`${fmt(poolStats?.allocatedMbps, 0)} / ${fmt(poolStats?.totalPurchasedMbps, 0)} Mbps`}
              icon={Activity}
              color={utilizationPct > 85 ? "bg-red-500" : utilizationPct > 60 ? "bg-yellow-500" : "bg-blue-500"}
              isLoading={poolLoading}
            />
            <StatCard
              title="Available Bandwidth"
              value={`${fmt(poolStats?.availableMbps, 0)} Mbps`}
              sub="Unallocated capacity"
              icon={Zap}
              color="bg-violet-600"
              isLoading={poolLoading}
            />
            <StatCard
              title="Total Resellers"
              value={poolStats?.totalResellers || 0}
              sub={`${poolStats?.activeResellers || 0} active`}
              icon={Building2}
              color="bg-indigo-600"
              isLoading={poolLoading}
            />
            <StatCard
              title="12-Month Profit"
              value={`PKR ${fmt(totalProfit12m)}`}
              sub="Last 12 months net"
              icon={PieChart}
              color={totalProfit12m >= 0 ? "bg-teal-600" : "bg-orange-600"}
              isLoading={profitLoading}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ArrowUpCircle className="w-4 h-4 text-green-500" />
                  Revenue Trend (12 Months)
                </CardTitle>
                <CardDescription>PKR {fmt(totalRevenue12m)} total</CardDescription>
              </CardHeader>
              <CardContent>
                {profitLoading ? <Skeleton className="h-16" /> : <MiniBarChart data={revenueChartData} color="bg-green-500" />}
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{profitLoss?.[0]?.label}</span>
                  <span>{profitLoss?.[profitLoss.length - 1]?.label}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ArrowDownCircle className="w-4 h-4 text-red-500" />
                  Purchase Cost Trend (12 Months)
                </CardTitle>
                <CardDescription>PKR {fmt(totalCost12m)} total</CardDescription>
              </CardHeader>
              <CardContent>
                {profitLoading ? <Skeleton className="h-16" /> : <MiniBarChart data={costChartData} color="bg-red-400" />}
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{profitLoss?.[0]?.label}</span>
                  <span>{profitLoss?.[profitLoss.length - 1]?.label}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Net Profit Trend (12 Months)
                </CardTitle>
                <CardDescription>PKR {fmt(totalProfit12m)} total</CardDescription>
              </CardHeader>
              <CardContent>
                {profitLoading ? <Skeleton className="h-16" /> : <MiniBarChart data={profitChartData} color="bg-emerald-500" />}
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{profitLoss?.[0]?.label}</span>
                  <span>{profitLoss?.[profitLoss.length - 1]?.label}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pool Utilization Bar + Top Resellers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" />
                  Bandwidth Pool Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {poolLoading ? <Skeleton className="h-20" /> : (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Purchased</span>
                        <span className="font-semibold">{fmt(poolStats?.totalPurchasedMbps, 0)} Mbps</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${utilizationPct > 85 ? "bg-red-500" : utilizationPct > 60 ? "bg-yellow-500" : "bg-blue-500"}`}
                          style={{ width: `${Math.min(100, utilizationPct)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Allocated: {fmt(poolStats?.allocatedMbps, 0)} Mbps</span>
                        <span>Available: {fmt(poolStats?.availableMbps, 0)} Mbps</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Utilization</p>
                        <p className={`font-bold ${utilizationPct > 85 ? "text-red-500" : utilizationPct > 60 ? "text-yellow-500" : "text-blue-500"}`}>
                          {poolStats?.utilizationPct}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Contracts</p>
                        <p className="font-bold">{poolStats?.totalPurchases}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Vendors</p>
                        <p className="font-bold">{vendors?.filter(v => v.vendorType === "bandwidth")?.length || 0}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Top Resellers by Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topResellers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No resellers found</p>
                  ) : topResellers.map((r, i) => (
                    <div key={r.id} className="flex items-center justify-between text-sm" data-testid={`row-reseller-${r.id}`}>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <span className="font-medium truncate max-w-[140px]">{r.companyName || r.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={r.status === "active" ? "default" : "secondary"} className="text-xs">{r.status}</Badge>
                        <span className="font-semibold text-green-600">PKR {fmt(r.walletBalance)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {utilizationPct > 85 && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-400">High Bandwidth Utilization</p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
                      Pool is at {poolStats?.utilizationPct}%. Consider purchasing additional bandwidth.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {(poolStats?.netProfit || 0) < 0 && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <TrendingDown className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-orange-700 dark:text-orange-400">Negative Profit Margin</p>
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-0.5">
                      Revenue is below purchase cost. Review pricing strategy.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {utilizationPct <= 85 && (poolStats?.netProfit || 0) >= 0 && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">System Operating Normally</p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-0.5">
                      Pool utilization and profitability are within healthy limits.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ─── BANDWIDTH PURCHASES ─── */}
        <TabsContent value="purchases" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search purchases..."
                className="pl-9 w-64"
                value={purchaseSearch}
                onChange={e => setPurchaseSearch(e.target.value)}
                data-testid="input-purchase-search"
              />
            </div>
            <Button onClick={() => { setShowAddPurchase(true); form.reset(); }} data-testid="btn-add-purchase-tab">
              <Plus className="w-4 h-4 mr-2" />
              Add Purchase
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Cost/Mbps</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchasesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      No bandwidth purchases recorded yet. Click "Add Purchase" to get started.
                    </TableCell>
                  </TableRow>
                ) : filteredPurchases.map(p => (
                  <TableRow key={p.id} data-testid={`row-purchase-${p.id}`}>
                    <TableCell className="text-muted-foreground text-xs">{p.id}</TableCell>
                    <TableCell className="font-medium">{p.vendorName || `Vendor #${p.vendorId}`}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-blue-600">{fmt(p.capacityMbps, 0)} Mbps</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{p.currency} {fmt(p.costAmount)}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.costPerMbps ? `${p.currency} ${fmt(p.costPerMbps, 4)}` : "—"}
                    </TableCell>
                    <TableCell>{p.purchaseDate}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "active" ? "default" : p.status === "expired" ? "secondary" : "outline"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)} data-testid={`btn-edit-purchase-${p.id}`}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeletePurchaseId(p.id)} data-testid={`btn-delete-purchase-${p.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Summary row */}
          {filteredPurchases.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-blue-200">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total Capacity</p>
                  <p className="text-xl font-bold text-blue-600">
                    {fmt(filteredPurchases.reduce((s, p) => s + parseFloat(p.capacityMbps || "0"), 0), 0)} Mbps
                  </p>
                </CardContent>
              </Card>
              <Card className="border-red-200">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total Cost</p>
                  <p className="text-xl font-bold text-red-600">
                    PKR {fmt(filteredPurchases.reduce((s, p) => s + parseFloat(p.costAmount || "0"), 0))}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Avg Cost/Mbps</p>
                  <p className="text-xl font-bold">
                    PKR {(() => {
                      const totalCap = filteredPurchases.reduce((s, p) => s + parseFloat(p.capacityMbps || "0"), 0);
                      const totalCost = filteredPurchases.reduce((s, p) => s + parseFloat(p.costAmount || "0"), 0);
                      return totalCap > 0 ? fmt(totalCost / totalCap, 2) : "0.00";
                    })()}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ─── BANDWIDTH POOL ─── */}
        <TabsContent value="pool" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total Purchased" value={`${fmt(poolStats?.totalPurchasedMbps, 0)} Mbps`} icon={Wifi} color="bg-blue-600" isLoading={poolLoading} />
            <StatCard title="Allocated to Resellers" value={`${fmt(poolStats?.allocatedMbps, 0)} Mbps`} icon={Building2} color="bg-indigo-600" isLoading={poolLoading} />
            <StatCard title="Available (Unallocated)" value={`${fmt(poolStats?.availableMbps, 0)} Mbps`} icon={Zap} color="bg-violet-600" isLoading={poolLoading} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Pool Utilization
              </CardTitle>
              <CardDescription>Real-time bandwidth allocation overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {poolLoading ? <Skeleton className="h-24" /> : (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Utilization: {poolStats?.utilizationPct}%</span>
                      <span>{fmt(poolStats?.allocatedMbps, 0)} / {fmt(poolStats?.totalPurchasedMbps, 0)} Mbps</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-6 relative overflow-hidden">
                      <div
                        className={`h-6 rounded-full transition-all flex items-center justify-center text-xs font-bold text-white ${utilizationPct > 85 ? "bg-red-500" : utilizationPct > 60 ? "bg-yellow-500" : "bg-blue-500"}`}
                        style={{ width: `${Math.min(100, utilizationPct)}%` }}
                      >
                        {utilizationPct > 15 ? `${poolStats?.utilizationPct}%` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-muted text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total Contracts</p>
                      <p className="text-2xl font-bold">{poolStats?.totalPurchases}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted text-center">
                      <p className="text-xs text-muted-foreground mb-1">Active Resellers</p>
                      <p className="text-2xl font-bold">{poolStats?.activeResellers}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total Resellers</p>
                      <p className="text-2xl font-bold">{poolStats?.totalResellers}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted text-center">
                      <p className="text-xs text-muted-foreground mb-1">Free Capacity</p>
                      <p className="text-2xl font-bold text-green-600">{fmt(poolStats?.availableMbps, 0)}</p>
                      <p className="text-xs text-muted-foreground">Mbps</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Reseller Bandwidth Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reseller</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Bandwidth Plan</TableHead>
                    <TableHead>Wallet Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(resellers || []).filter(r => r.bandwidthPlan).map(r => (
                    <TableRow key={r.id} data-testid={`row-pool-reseller-${r.id}`}>
                      <TableCell className="font-medium">{r.companyName || r.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.resellerType}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-blue-600">{r.bandwidthPlan} Mbps</span>
                      </TableCell>
                      <TableCell>PKR {fmt(r.walletBalance)}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(resellers || []).filter(r => r.bandwidthPlan).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No resellers with bandwidth plans assigned yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── RESELLER RECHARGES ─── */}
        <TabsContent value="recharges" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search recharges..."
                className="pl-9 w-64"
                value={txnSearch}
                onChange={e => setTxnSearch(e.target.value)}
                data-testid="input-txn-search"
              />
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground items-center">
              <Wallet className="w-4 h-4" />
              <span>{filteredTxns.length} recharge transactions</span>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Reseller</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txnsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredTxns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No reseller recharges found.
                    </TableCell>
                  </TableRow>
                ) : filteredTxns.map(t => {
                  const reseller = (resellers || []).find(r => r.id === t.resellerId);
                  return (
                    <TableRow key={t.id} data-testid={`row-txn-${t.id}`}>
                      <TableCell className="text-muted-foreground text-xs">{t.id}</TableCell>
                      <TableCell className="font-medium">{reseller?.companyName || reseller?.name || `Reseller #${t.resellerId}`}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">PKR {fmt(t.amount)}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{t.reference || "—"}</TableCell>
                      <TableCell className="text-sm">{t.paymentMethod || "—"}</TableCell>
                      <TableCell className="text-sm">{(t.createdAt || "").split("T")[0]}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                          <ArrowUpCircle className="w-3 h-3 mr-1" />
                          Recharge
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {filteredTxns.length > 0 && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">Total Recharge Revenue</span>
                </div>
                <span className="text-2xl font-bold text-green-700">
                  PKR {fmt(filteredTxns.reduce((s, t) => s + parseFloat(t.amount || "0"), 0))}
                </span>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── PROFIT / LOSS ─── */}
        <TabsContent value="profit-loss" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Revenue (12m)"
              value={`PKR ${fmt(totalRevenue12m)}`}
              sub="All reseller recharges"
              icon={TrendingUp}
              color="bg-green-600"
              isLoading={profitLoading}
            />
            <StatCard
              title="Total Cost (12m)"
              value={`PKR ${fmt(totalCost12m)}`}
              sub="Bandwidth purchases"
              icon={DollarSign}
              color="bg-red-500"
              isLoading={profitLoading}
            />
            <StatCard
              title="Net Profit (12m)"
              value={`PKR ${fmt(totalProfit12m)}`}
              sub="Revenue − Cost"
              icon={totalProfit12m >= 0 ? CheckCircle2 : XCircle}
              color={totalProfit12m >= 0 ? "bg-emerald-600" : "bg-orange-600"}
              isLoading={profitLoading}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Monthly Profit & Loss Report
              </CardTitle>
              <CardDescription>
                Formula: Profit = Total Reseller Recharge − Total Bandwidth Purchase Cost
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Purchase Cost (PKR)</TableHead>
                    <TableHead className="text-right">Recharge Revenue (PKR)</TableHead>
                    <TableHead className="text-right">Net Profit (PKR)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (profitLoss || []).map((m, i) => (
                    <TableRow key={i} data-testid={`row-pl-${m.key}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{m.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-medium">
                        {m.purchaseCost > 0 ? fmt(m.purchaseCost) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {m.rechargeRevenue > 0 ? fmt(m.rechargeRevenue) : "—"}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${m.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {m.purchaseCost > 0 || m.rechargeRevenue > 0 ? (m.profit >= 0 ? "+" : "") + fmt(m.profit) : "—"}
                      </TableCell>
                      <TableCell>
                        {m.purchaseCost === 0 && m.rechargeRevenue === 0 ? (
                          <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />No Data</Badge>
                        ) : m.profit >= 0 ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <TrendingUp className="w-3 h-3 mr-1" />Profit
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <TrendingDown className="w-3 h-3 mr-1" />Loss
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals row */}
              {(profitLoss || []).length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-muted/50 flex flex-wrap gap-4 justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">12-Month Total Cost</p>
                    <p className="text-lg font-bold text-red-600">PKR {fmt(totalCost12m)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">12-Month Total Revenue</p>
                    <p className="text-lg font-bold text-green-600">PKR {fmt(totalRevenue12m)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Net Profit</p>
                    <p className={`text-lg font-bold ${totalProfit12m >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      PKR {fmt(totalProfit12m)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Profit Margin</p>
                    <p className={`text-lg font-bold ${totalProfit12m >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {totalRevenue12m > 0 ? `${((totalProfit12m / totalRevenue12m) * 100).toFixed(1)}%` : "—"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── ADD / EDIT PURCHASE DIALOG ─── */}
      <Dialog open={showAddPurchase || !!editPurchase} onOpenChange={(open) => {
        if (!open) { setShowAddPurchase(false); setEditPurchase(null); }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editPurchase ? "Edit Bandwidth Purchase" : "Record Bandwidth Purchase"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(editPurchase
              ? (data) => updateMutation.mutate({ id: editPurchase.id, data })
              : onSubmit
            )} className="space-y-4">
              <FormField control={form.control} name="vendorId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor *</FormLabel>
                  <FormControl>
                    <Select value={String(field.value)} onValueChange={v => {
                      field.onChange(Number(v));
                      const vend = vendors?.find(vnd => vnd.id === Number(v));
                      if (vend) form.setValue("vendorName", vend.companyName || "");
                    }}>
                      <SelectTrigger data-testid="select-vendor">
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {(vendors || []).map(v => (
                          <SelectItem key={v.id} value={String(v.id)}>{v.companyName || v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="capacityMbps" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (Mbps) *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="e.g. 1000" data-testid="input-capacity" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="costAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Cost *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="e.g. 100000" data-testid="input-cost" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PKR">PKR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="purchaseDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="input-purchase-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="contractDurationMonths" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Duration (Months)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} type="number" placeholder="e.g. 12" data-testid="input-contract-duration" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="reference" render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference / Invoice #</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} placeholder="Vendor invoice or reference number" data-testid="input-reference" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} placeholder="Additional notes..." rows={2} data-testid="textarea-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setShowAddPurchase(false); setEditPurchase(null); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="btn-submit-purchase">
                  {(createMutation.isPending || updateMutation.isPending) && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  {editPurchase ? "Update Purchase" : "Record Purchase"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deletePurchaseId} onOpenChange={() => setDeletePurchaseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bandwidth Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this purchase record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletePurchaseId && deleteMutation.mutate(deletePurchaseId)}
              data-testid="btn-confirm-delete"
            >
              {deleteMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
