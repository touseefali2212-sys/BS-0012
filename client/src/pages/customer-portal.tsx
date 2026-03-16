import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search,
  MoreHorizontal,
  Users,
  UserCheck,
  KeyRound,
  TicketCheck,
  Globe,
  CheckCircle,
  XCircle,
  Settings,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTab } from "@/hooks/use-tab";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Customer, Setting, Ticket, Package as Pkg } from "@shared/schema";

interface PortalSettings {
  enablePortal: boolean;
  allowTickets: boolean;
  allowInvoices: boolean;
  allowUsage: boolean;
  portalUrl: string;
  customMessage: string;
}

const defaultPortalSettings: PortalSettings = {
  enablePortal: false,
  allowTickets: true,
  allowInvoices: true,
  allowUsage: false,
  portalUrl: "",
  customMessage: "",
};

export default function CustomerPortalPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useTab("settings");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [portalSettings, setPortalSettings] = useState<PortalSettings>(defaultPortalSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: tickets } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  const { data: packages } = useQuery<Pkg[]>({
    queryKey: ["/api/packages"],
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

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(portalSettings);
  };

  const allCustomers = customers || [];
  const totalCustomers = allCustomers.length;
  const activeCustomers = allCustomers.filter((c) => c.status === "active").length;
  const portalEnabled = allCustomers.filter((c) => c.password && c.password.length > 0).length;
  const pendingTickets = (tickets || []).filter((t) => t.status === "open" || t.status === "pending").length;

  const getPackageName = (packageId: number | null) => {
    if (!packageId || !packages) return "\u2014";
    const pkg = packages.find((p) => p.id === packageId);
    return pkg ? pkg.name : "\u2014";
  };

  const filtered = allCustomers.filter((c) => {
    const matchSearch =
      c.customerId.toLowerCase().includes(search.toLowerCase()) ||
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase());
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
    { title: "Total Customers", value: totalCustomers, icon: Users, color: "text-blue-600 dark:text-blue-400" },
    { title: "Active", value: activeCustomers, icon: UserCheck, color: "text-green-600 dark:text-green-400" },
    { title: "Portal Enabled", value: portalEnabled, icon: KeyRound, color: "text-purple-600 dark:text-purple-400" },
    { title: "Pending Tickets", value: pendingTickets, icon: TicketCheck, color: "text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-portal-title">Customer Portal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage customer self-service portal settings and access</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} data-testid={`card-summary-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid={`text-summary-${card.title.toLowerCase().replace(/\s+/g, "-")}`}>
                  {card.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-portal">
          <TabsTrigger value="settings" data-testid="tab-portal-settings">Portal Settings</TabsTrigger>
          <TabsTrigger value="access" data-testid="tab-customer-access">Customer Access</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Portal Configuration
              </CardTitle>
              <CardDescription>Configure the customer self-service portal features and behavior</CardDescription>
            </CardHeader>
            <CardContent>
              {settingsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enable-portal" className="text-sm font-medium">Enable Customer Portal</Label>
                      <p className="text-sm text-muted-foreground">Allow customers to access the self-service portal</p>
                    </div>
                    <Switch
                      id="enable-portal"
                      checked={portalSettings.enablePortal}
                      onCheckedChange={(checked) => setPortalSettings({ ...portalSettings, enablePortal: checked })}
                      data-testid="switch-enable-portal"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-tickets" className="text-sm font-medium">Allow Ticket Submission</Label>
                      <p className="text-sm text-muted-foreground">Let customers submit and track support tickets</p>
                    </div>
                    <Switch
                      id="allow-tickets"
                      checked={portalSettings.allowTickets}
                      onCheckedChange={(checked) => setPortalSettings({ ...portalSettings, allowTickets: checked })}
                      data-testid="switch-allow-tickets"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-invoices" className="text-sm font-medium">Allow Invoice Viewing</Label>
                      <p className="text-sm text-muted-foreground">Let customers view and download their invoices</p>
                    </div>
                    <Switch
                      id="allow-invoices"
                      checked={portalSettings.allowInvoices}
                      onCheckedChange={(checked) => setPortalSettings({ ...portalSettings, allowInvoices: checked })}
                      data-testid="switch-allow-invoices"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-usage" className="text-sm font-medium">Allow Usage Viewing</Label>
                      <p className="text-sm text-muted-foreground">Let customers view their data usage statistics</p>
                    </div>
                    <Switch
                      id="allow-usage"
                      checked={portalSettings.allowUsage}
                      onCheckedChange={(checked) => setPortalSettings({ ...portalSettings, allowUsage: checked })}
                      data-testid="switch-allow-usage"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portal-url" className="text-sm font-medium">Portal URL</Label>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="portal-url"
                        placeholder="https://portal.yourisp.com"
                        value={portalSettings.portalUrl}
                        onChange={(e) => setPortalSettings({ ...portalSettings, portalUrl: e.target.value })}
                        data-testid="input-portal-url"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom-message" className="text-sm font-medium">Custom Portal Message</Label>
                    <Textarea
                      id="custom-message"
                      placeholder="Welcome to the customer portal. Here you can manage your account..."
                      value={portalSettings.customMessage}
                      onChange={(e) => setPortalSettings({ ...portalSettings, customMessage: e.target.value })}
                      data-testid="input-custom-message"
                    />
                  </div>

                  <Button
                    onClick={handleSaveSettings}
                    disabled={saveSettingsMutation.isPending}
                    data-testid="button-save-portal-settings"
                  >
                    {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-customers"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
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
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No customers found</p>
                  <p className="text-sm mt-1">Adjust your search or filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="hidden md:table-cell">Phone</TableHead>
                        <TableHead className="hidden lg:table-cell">Package</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Portal Access</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((customer) => {
                        const hasPortalAccess = !!(customer.password && customer.password.length > 0);
                        return (
                          <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                            <TableCell>
                              <span className="font-mono font-medium" data-testid={`text-customer-id-${customer.id}`}>
                                {customer.customerId}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium" data-testid={`text-customer-name-${customer.id}`}>
                                {customer.fullName}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                              {customer.email || "\u2014"}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                              {customer.phone}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                              {getPackageName(customer.packageId)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[customer.status] || ""}`}>
                                {customer.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`no-default-active-elevate text-[10px] ${
                                  hasPortalAccess
                                    ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950"
                                    : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950"
                                }`}
                                data-testid={`badge-portal-access-${customer.id}`}
                              >
                                {hasPortalAccess ? (
                                  <><CheckCircle className="h-3 w-3 mr-1" />Yes</>
                                ) : (
                                  <><XCircle className="h-3 w-3 mr-1" />No</>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" data-testid={`button-customer-actions-${customer.id}`}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {hasPortalAccess ? (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        toast({ title: "Portal access disabled", description: `Disabled portal for ${customer.fullName}` });
                                      }}
                                      data-testid={`button-disable-portal-${customer.id}`}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Disable Portal
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        toast({ title: "Portal access enabled", description: `Enabled portal for ${customer.fullName}` });
                                      }}
                                      data-testid={`button-enable-portal-${customer.id}`}
                                    >
                                      <Shield className="h-4 w-4 mr-2" />
                                      Enable Portal
                                    </DropdownMenuItem>
                                  )}
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
      </Tabs>
    </div>
  );
}
