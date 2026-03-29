import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search, MoreHorizontal, Users, UserCheck, KeyRound, TicketCheck,
  Globe, CheckCircle, XCircle, Settings, Shield, Wifi, Activity,
  Package, CreditCard, Headphones, User, RefreshCw, ChevronRight,
  Download, Bell, Zap, BarChart3, Clock, FileText, ExternalLink,
  Eye, AlertCircle, CheckCircle2, Plus, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTab } from "@/hooks/use-tab";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartTooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { Customer, Setting, Ticket, Package as Pkg, Invoice } from "@shared/schema";

interface PortalSettings {
  enablePortal: boolean;
  allowTickets: boolean;
  allowInvoices: boolean;
  allowUsage: boolean;
  allowPayments: boolean;
  allowProfileUpdate: boolean;
  allowSpeedTest: boolean;
  allowPackageChange: boolean;
  portalUrl: string;
  customMessage: string;
  welcomeTitle: string;
}

const defaultPortalSettings: PortalSettings = {
  enablePortal: true,
  allowTickets: true,
  allowInvoices: true,
  allowUsage: true,
  allowPayments: true,
  allowProfileUpdate: true,
  allowSpeedTest: true,
  allowPackageChange: false,
  portalUrl: "",
  customMessage: "",
  welcomeTitle: "Customer Self-Service Portal",
};

const weekUsageData = [
  { day: "Mon", gb: 12.5 },
  { day: "Tue", gb: 18.2 },
  { day: "Wed", gb: 15.8 },
  { day: "Thu", gb: 22.1 },
  { day: "Fri", gb: 28.4 },
  { day: "Sat", gb: 35.2 },
  { day: "Sun", gb: 30.1 },
];

const totalWeekGB = weekUsageData.reduce((s, d) => s + d.gb, 0).toFixed(1);

function ConnectionStatusCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border ${color}`}>
      <Icon className="h-7 w-7 opacity-80" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}

function PortalPreview({ customer, tickets, packages, invoices }: {
  customer: Customer | null;
  tickets: Ticket[];
  packages: Pkg[];
  invoices: Invoice[];
}) {
  const [refreshing, setRefreshing] = useState(false);

  const pkg = packages.find(p => p.id === customer?.packageId);
  const customerTickets = tickets.filter(t => t.customerId === customer?.id).slice(0, 3);
  const customerInvoices = invoices.filter(i => i.customerId === customer?.id).slice(0, 3);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return "Rs. 0";
    const n = typeof amount === "string" ? parseFloat(amount) : amount;
    return `Rs. ${n.toLocaleString("en-PK")}`;
  };

  const ticketStatusColor: Record<string, string> = {
    open: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
    in_progress: "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300",
    resolved: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300",
    closed: "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400",
    pending: "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
  };

  const ticketStatusLabel: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
    pending: "Pending",
  };

  const invoiceStatusColor: Record<string, string> = {
    paid: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300",
    unpaid: "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400",
    partial: "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300",
    overdue: "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
  };

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
        <User className="h-12 w-12 opacity-20" />
        <p className="font-medium">Select a customer to preview the portal</p>
        <p className="text-sm">Use the dropdown above to choose a customer</p>
      </div>
    );
  }

  const outstandingInv = customerInvoices.find(i => i.status === "unpaid" || i.status === "overdue" || i.status === "partial");
  const balance = outstandingInv ? outstandingInv.amount : null;
  const validTill = customer.connectionDate
    ? new Date(new Date(customer.connectionDate).setMonth(new Date(customer.connectionDate).getMonth() + 1)).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="space-y-4">
      {/* Customer Banner */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b5fc0 50%, #6366f1 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center flex-shrink-0">
              <User className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white" data-testid="text-portal-customer-name">{customer.fullName}</h2>
              <p className="text-blue-200 text-sm">Customer ID: {customer.customerId}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-400/30 text-green-200 font-semibold border border-green-400/40 capitalize">{customer.status}</span>
                {pkg && <span className="text-[10px] text-blue-200">{pkg.name}</span>}
              </div>
            </div>
          </div>
          <div className="text-right sm:text-right">
            <p className="text-blue-200 text-xs">Current Balance</p>
            <p className="text-white text-2xl font-bold">{balance ? formatCurrency(balance) : "Rs. 0"}</p>
            <p className="text-blue-200 text-xs mt-0.5">Valid till: {validTill}</p>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: FileText, label: "View Current Bill", desc: "Download or pay your latest invoice", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { icon: CreditCard, label: "Make Payment", desc: "Pay via card, bank, or wallet", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30" },
          { icon: Headphones, label: "Raise Support Ticket", desc: "Get help from our support team", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30" },
          { icon: User, label: "Update Profile", desc: "Manage your account details", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30" },
        ].map(({ icon: Icon, label, desc, color, bg }) => (
          <div key={label} className="bg-card border rounded-xl p-4 hover:shadow-md cursor-pointer transition-all hover:border-blue-200 dark:hover:border-blue-800 group" data-testid={`card-action-${label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-sm font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Connection Status */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Connection Status</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground gap-1.5" onClick={handleRefresh} data-testid="button-refresh-connection">
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <Wifi className="h-6 w-6 text-green-500" />
                  <span className="text-xs text-muted-foreground">Status</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">Online</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                  <Activity className="h-6 w-6 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Current Speed</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{pkg ? `${pkg.downloadSpeed || "48.5"} Mbps` : "48.5 Mbps"}</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900">
                  <Package className="h-6 w-6 text-violet-500" />
                  <span className="text-xs text-muted-foreground">Package</span>
                  <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{pkg ? pkg.name.split(" ").slice(-1)[0] : "50 Mbps"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Usage Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Data Usage This Week</CardTitle>
                <span className="text-xs text-muted-foreground font-medium">Total: {totalWeekGB} GB</span>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weekUsageData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <RechartTooltip
                    formatter={(value: number) => [`${value} GB`, "Usage"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid rgba(148,163,184,0.2)" }}
                  />
                  <Bar dataKey="gb" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Bills */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recent Bills</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 dark:text-blue-400 gap-1" data-testid="button-view-all-bills">
                  View All <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {customerInvoices.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-muted-foreground gap-2">
                  <FileText className="h-8 w-8 opacity-20" />
                  <p className="text-sm">No bills found</p>
                </div>
              ) : (
                customerInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors" data-testid={`row-invoice-${inv.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Invoice #{inv.invoiceNumber || inv.id}</p>
                        <p className="text-[10px] text-muted-foreground">Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{formatCurrency(inv.amount)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${invoiceStatusColor[inv.status] || ""}`}>{inv.status}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" data-testid={`button-download-invoice-${inv.id}`}>
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
              {customerInvoices.length === 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">March 2026</p>
                      <p className="text-[10px] text-muted-foreground">Due: 30 Mar 2026</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">Rs. 4,500</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-medium">Unpaid</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Support Tickets */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Support Tickets</CardTitle>
                <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-new-ticket">
                  <Plus className="h-3 w-3 mr-1" />
                  New Ticket
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {customerTickets.length === 0 ? (
                <>
                  <div className="flex items-start justify-between p-3 rounded-lg bg-muted/40 border-l-2 border-blue-400">
                    <div>
                      <p className="text-xs font-semibold">Slow internet speed</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">TKT-001 • 2024-02-15</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium whitespace-nowrap">In Progress</span>
                  </div>
                  <div className="flex items-start justify-between p-3 rounded-lg bg-muted/40 border-l-2 border-green-400">
                    <div>
                      <p className="text-xs font-semibold">Bill query</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">TKT-002 • 2024-02-10</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 font-medium">Resolved</span>
                  </div>
                </>
              ) : (
                customerTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/40 border-l-2 border-blue-400" data-testid={`row-ticket-${ticket.id}`}>
                    <div>
                      <p className="text-xs font-semibold">{ticket.subject}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">TKT-{String(ticket.id).padStart(3, "0")} • {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "2-digit", day: "2-digit" }) : "—"}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${ticketStatusColor[ticket.status] || ""}`}>
                      {ticketStatusLabel[ticket.status] || ticket.status}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {[
                { icon: Zap, label: "Speed Test", color: "text-blue-500" },
                { icon: Package, label: "Change Package", color: "text-violet-500" },
                { icon: CreditCard, label: "Payment History", color: "text-green-500" },
                { icon: Download, label: "Download Usage Report", color: "text-orange-500" },
                { icon: Bell, label: "Notification Settings", color: "text-pink-500" },
                { icon: User, label: "Update Profile", color: "text-teal-500" },
              ].map(({ icon: Icon, label, color }, i, arr) => (
                <button
                  key={label}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/60 transition-colors text-left ${i < arr.length - 1 ? "border-b border-border/50" : ""}`}
                  data-testid={`link-${label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0">
              {[
                { label: "Phone", value: customer.phone || "—" },
                { label: "Email", value: customer.email || "—" },
                { label: "Area", value: customer.area || "—" },
                { label: "Connection Type", value: customer.connectionType || "Fiber" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-medium text-right truncate max-w-[140px]">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CustomerPortalPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useTab("preview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [portalSettings, setPortalSettings] = useState<PortalSettings>(defaultPortalSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: tickets = [] } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  const { data: packages = [] } = useQuery<Pkg[]>({
    queryKey: ["/api/packages"],
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: allSettings, isLoading: settingsLoading } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  if (allSettings && !settingsLoaded) {
    const portalSetting = allSettings.find((s) => s.key === "portal_settings");
    if (portalSetting) {
      try {
        const parsed = JSON.parse(portalSetting.value);
        setPortalSettings({ ...defaultPortalSettings, ...parsed });
      } catch {}
    }
    setSettingsLoaded(true);
  }

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: PortalSettings) => {
      const res = await apiRequest("POST", "/api/settings", {
        key: "portal_settings",
        value: JSON.stringify(data),
        category: "portal",
        description: "Customer portal configuration",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Portal settings saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const allCustomers = customers || [];
  const activeCustomers = allCustomers.filter(c => c.status === "active");
  const portalEnabled = allCustomers.filter(c => c.password && c.password.length > 0).length;
  const pendingTickets = tickets.filter(t => t.status === "open" || t.status === "pending").length;

  const selectedCustomer = allCustomers.find(c => String(c.id) === selectedCustomerId) ||
    (allCustomers.length > 0 ? allCustomers[0] : null);

  const getPackageName = (packageId: number | null) => {
    if (!packageId) return "—";
    return packages.find(p => p.id === packageId)?.name || "—";
  };

  const filtered = allCustomers.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = c.customerId.toLowerCase().includes(q) || c.fullName.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColors: Record<string, string> = {
    active: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950",
    inactive: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950",
    suspended: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950",
    expired: "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950",
  };

  const summaryCards = [
    { title: "Total Customers", value: allCustomers.length, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { title: "Active Customers", value: activeCustomers.length, icon: UserCheck, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30" },
    { title: "Portal Enabled", value: portalEnabled, icon: KeyRound, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30" },
    { title: "Open Tickets", value: pendingTickets, icon: TicketCheck, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
  ];

  return (
    <div className="p-5 space-y-5 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-portal-title">Customer Self-Service Portal</h1>
          <p className="text-sm text-muted-foreground">Customers can update profiles, view bills, and request support</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-xs h-8" data-testid="button-view-live-portal">
            <ExternalLink className="h-3.5 w-3.5" />
            View Live Portal
          </Button>
          <Button size="sm" className="gap-2 text-xs h-8 bg-[#1c3557] hover:bg-[#162b47] text-white" onClick={() => setActiveTab("settings")} data-testid="button-portal-settings">
            <Settings className="h-3.5 w-3.5" />
            Portal Settings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <Card key={card.title} className="border" data-testid={`card-summary-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              {customersLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <div className="text-2xl font-bold" data-testid={`text-summary-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>{card.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-portal" className="h-9">
          <TabsTrigger value="preview" className="text-xs gap-1.5" data-testid="tab-portal-preview">
            <Eye className="h-3.5 w-3.5" />
            Portal Preview
          </TabsTrigger>
          <TabsTrigger value="access" className="text-xs gap-1.5" data-testid="tab-customer-access">
            <Users className="h-3.5 w-3.5" />
            Customer Access
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs gap-1.5" data-testid="tab-portal-settings">
            <Settings className="h-3.5 w-3.5" />
            Portal Settings
          </TabsTrigger>
        </TabsList>

        {/* Portal Preview Tab */}
        <TabsContent value="preview" className="mt-4">
          <div className="space-y-4">
            {/* Customer Selector */}
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border">
              <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground">Previewing portal as:</p>
              <Select
                value={selectedCustomerId || (allCustomers[0] ? String(allCustomers[0].id) : "")}
                onValueChange={setSelectedCustomerId}
              >
                <SelectTrigger className="h-8 text-xs w-64" data-testid="select-preview-customer">
                  <SelectValue placeholder="Select a customer..." />
                </SelectTrigger>
                <SelectContent>
                  {allCustomers.slice(0, 50).map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.fullName} ({c.customerId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customersLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>

            {customersLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <div className="grid grid-cols-4 gap-3">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
              </div>
            ) : (
              <PortalPreview
                customer={selectedCustomer}
                tickets={tickets}
                packages={packages}
                invoices={invoices}
              />
            )}
          </div>
        </TabsContent>

        {/* Customer Access Tab */}
        <TabsContent value="access" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Customer Portal Access
              </CardTitle>
              <CardDescription className="text-xs">Manage which customers can access the self-service portal</CardDescription>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-8 text-xs"
                    data-testid="input-search-customers"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs" data-testid="select-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {customersLoading ? (
                <div className="p-5 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="h-10 w-10 mb-3 opacity-20" />
                  <p className="font-medium text-sm">No customers found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-xs font-semibold">Customer ID</TableHead>
                        <TableHead className="text-xs font-semibold">Name</TableHead>
                        <TableHead className="text-xs font-semibold hidden md:table-cell">Email</TableHead>
                        <TableHead className="text-xs font-semibold hidden md:table-cell">Phone</TableHead>
                        <TableHead className="text-xs font-semibold hidden lg:table-cell">Package</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold">Portal Access</TableHead>
                        <TableHead className="text-xs font-semibold">Preview</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(customer => {
                        const hasPortalAccess = !!(customer.password && customer.password.length > 0);
                        return (
                          <TableRow key={customer.id} className="text-xs" data-testid={`row-customer-${customer.id}`}>
                            <TableCell className="font-mono font-medium">{customer.customerId}</TableCell>
                            <TableCell className="font-medium">{customer.fullName}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">{customer.email || "—"}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">{customer.phone}</TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground">{getPackageName(customer.packageId)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[customer.status] || ""}`}>
                                {customer.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${hasPortalAccess ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950"}`} data-testid={`badge-portal-access-${customer.id}`}>
                                {hasPortalAccess ? <><CheckCircle className="h-3 w-3 mr-1" />Enabled</> : <><XCircle className="h-3 w-3 mr-1" />Disabled</>}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[10px] gap-1 text-blue-600 dark:text-blue-400"
                                onClick={() => { setSelectedCustomerId(String(customer.id)); setActiveTab("preview"); }}
                                data-testid={`button-preview-${customer.id}`}
                              >
                                <Eye className="h-3 w-3" />
                                Preview
                              </Button>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-customer-actions-${customer.id}`}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {hasPortalAccess ? (
                                    <DropdownMenuItem onClick={() => toast({ title: "Portal access disabled", description: `Disabled portal for ${customer.fullName}` })} data-testid={`button-disable-portal-${customer.id}`}>
                                      <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                      Disable Portal Access
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => toast({ title: "Portal access enabled", description: `Enabled portal for ${customer.fullName}` })} data-testid={`button-enable-portal-${customer.id}`}>
                                      <Shield className="h-4 w-4 mr-2 text-green-500" />
                                      Enable Portal Access
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => { setSelectedCustomerId(String(customer.id)); setActiveTab("preview"); }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview Portal
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toast({ title: "Reset link sent", description: `Password reset sent to ${customer.email || customer.phone}` })}>
                                    <KeyRound className="h-4 w-4 mr-2" />
                                    Send Reset Link
                                  </DropdownMenuItem>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portal Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  General Settings
                </CardTitle>
                <CardDescription className="text-xs">Configure portal availability and URL</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {settingsLoading ? (
                  <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Enable Customer Portal</Label>
                        <p className="text-xs text-muted-foreground">Allow customers to access the self-service portal</p>
                      </div>
                      <Switch checked={portalSettings.enablePortal} onCheckedChange={v => setPortalSettings({ ...portalSettings, enablePortal: v })} data-testid="switch-enable-portal" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Portal URL</Label>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <Input placeholder="https://portal.yourisp.com" value={portalSettings.portalUrl} onChange={e => setPortalSettings({ ...portalSettings, portalUrl: e.target.value })} className="h-8 text-sm" data-testid="input-portal-url" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Welcome Title</Label>
                      <Input placeholder="Customer Self-Service Portal" value={portalSettings.welcomeTitle} onChange={e => setPortalSettings({ ...portalSettings, welcomeTitle: e.target.value })} className="h-8 text-sm" data-testid="input-welcome-title" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Custom Welcome Message</Label>
                      <Textarea placeholder="Welcome to our customer portal..." value={portalSettings.customMessage} onChange={e => setPortalSettings({ ...portalSettings, customMessage: e.target.value })} className="text-sm resize-none" rows={3} data-testid="input-custom-message" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Feature Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Feature Permissions
                </CardTitle>
                <CardDescription className="text-xs">Control which features customers can access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "allowTickets" as const, label: "Ticket Submission", desc: "Let customers submit and track support tickets" },
                  { key: "allowInvoices" as const, label: "Invoice Viewing", desc: "Let customers view and download invoices" },
                  { key: "allowUsage" as const, label: "Usage Statistics", desc: "Let customers view their data usage" },
                  { key: "allowPayments" as const, label: "Online Payments", desc: "Allow customers to pay bills online" },
                  { key: "allowProfileUpdate" as const, label: "Profile Updates", desc: "Allow customers to update their info" },
                  { key: "allowSpeedTest" as const, label: "Speed Test", desc: "Let customers run speed tests" },
                  { key: "allowPackageChange" as const, label: "Package Change Requests", desc: "Allow customers to request package changes" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={portalSettings[key] as boolean}
                      onCheckedChange={v => setPortalSettings({ ...portalSettings, [key]: v })}
                      data-testid={`switch-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => saveSettingsMutation.mutate(portalSettings)}
              disabled={saveSettingsMutation.isPending}
              className="gap-2"
              data-testid="button-save-portal-settings"
            >
              {saveSettingsMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : "Save Portal Settings"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
