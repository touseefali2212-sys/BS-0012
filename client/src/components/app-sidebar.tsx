import { useState, useCallback, useSyncExternalStore, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { usePermissions } from "@/hooks/use-permissions";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  LifeBuoy,
  Building2,
  Store,
  MapPin,
  UserCog,
  Shield,
  Handshake,
  DollarSign,
  BookOpen,
  ArrowLeftRight,
  ArrowUpDown,
  CalendarRange,
  ListTodo,
  HardDrive,
  Boxes,
  Bell,
  BarChart3,
  Settings,
  Globe,
  LogOut,
  ChevronRight,
  ChevronDown,
  UserPlus,
  UserCheck,
  List,
  Wallet,
  Receipt,
  TrendingUp,
  Zap,
  GitBranch,
  ClipboardList,
  Calendar,
  Clock,
  BadgeDollarSign,
  Gift,
  Banknote,
  PalmtreeIcon,
  ShieldCheck,
  KeyRound,
  Search,
  Network,
  Layers,
  Send,
  MessageSquare,
  Mail,
  Megaphone,
  Hash,
  CreditCard,
  Activity,
  Radio,
  FileCheck,
  FolderOpen,
  Plus,
  Router,
  Monitor,
  MonitorSmartphone,
  Gauge,
  Map,
  PieChart,
  Timer,
  Download,
  Wifi,
  Briefcase,
  Server,
  Smartphone,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest } from "@/lib/queryClient";

interface SubItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface NavItem {
  title: string;
  icon: LucideIcon;
  url?: string;
  subItems?: SubItem[];
  module?: string;
}

const dashboardNav: NavItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    module: "dashboard",
    subItems: [
      { title: "Overview", url: "/?tab=overview", icon: LayoutDashboard },
      { title: "Customers Dashboard", url: "/?tab=customers", icon: Users },
      { title: "Revenue & Collection", url: "/?tab=revenue", icon: TrendingUp },
      { title: "Quick Actions", url: "/?tab=quick-actions", icon: Zap },
    ],
  },
];

const managementNav: NavItem[] = [
  {
    title: "Company Profile",
    icon: Building2,
    module: "company",
    subItems: [
      { title: "Company Profile", url: "/company?tab=profile", icon: Building2 },
      { title: "Branches & Department", url: "/company?tab=branches", icon: GitBranch },
    ],
  },
  {
    title: "Vendors",
    icon: Store,
    module: "vendors",
    subItems: [
      { title: "Vendor Type", url: "/vendors?tab=types", icon: Layers },
      { title: "Add Vendor", url: "/vendors?tab=add", icon: UserPlus },
      { title: "Vendor List", url: "/vendors?tab=list", icon: List },
      { title: "Vendor Packages", url: "/vendors?tab=packages", icon: Package },
      { title: "Bandwidth Changes", url: "/vendors?tab=bandwidth-changes", icon: Activity },
      { title: "Account & Ledger", url: "/vendors?tab=account", icon: BookOpen },
      { title: "Wallet & Billing", url: "/vendors?tab=wallet", icon: Wallet },
    ],
  },
  {
    title: "Packages",
    icon: Package,
    module: "packages",
    subItems: [
      { title: "Packages List", url: "/packages?tab=list", icon: List },
      { title: "Tax & Extra Fee", url: "/packages?tab=tax", icon: Receipt },
      { title: "Reseller Packages", url: "/reseller-packages", icon: Handshake },
    ],
  },
  {
    title: "Area Management",
    icon: MapPin,
    module: "area_management",
    subItems: [
      { title: "Add Area", url: "/areas?tab=add", icon: UserPlus },
      { title: "Area List", url: "/areas?tab=list", icon: List },
      { title: "Area Allocation", url: "/areas?tab=allocation", icon: MapPin },
      { title: "Service Availability", url: "/areas?tab=availability", icon: Search },
      { title: "Multi Branch Control", url: "/areas?tab=branch-control", icon: Network },
    ],
  },
];

const hrmNav: NavItem[] = [
  {
    title: "HR & Payroll",
    icon: UserCog,
    module: "hr_payroll",
    subItems: [
      { title: "Add Employee", url: "/hr?tab=add", icon: UserPlus },
      { title: "Employee List", url: "/hr?tab=list", icon: List },
      { title: "Employee Type/Role", url: "/employee-types-roles", icon: Shield },
      { title: "Shift & Scheduling", url: "/shift-scheduling", icon: Clock },
      { title: "Attendance", url: "/hr?tab=attendance", icon: ClipboardList },
      { title: "Attendance Tracking", url: "/attendance", icon: Calendar },
      { title: "Salary Processing", url: "/salary", icon: BadgeDollarSign },
      { title: "Bonus & Commission", url: "/bonus-commission", icon: Gift },
      { title: "Advance & Loan", url: "/advances", icon: Banknote },
      { title: "Holiday & Leave", url: "/leaves", icon: PalmtreeIcon },
    ],
  },
  {
    title: "HRM",
    icon: ShieldCheck,
    module: "hrm",
    subItems: [
      { title: "HRM Role & Type", url: "/access?tab=roles", icon: Shield },
      { title: "Staff User Login", url: "/access?tab=users", icon: KeyRound },
      { title: "Account Management", url: "/staff-accounts", icon: UserCog },
      { title: "App Access Control", url: "/access?tab=app-access", icon: MonitorSmartphone },
      { title: "Area Management", url: "/access?tab=areas", icon: MapPin },
      { title: "Area Allocation", url: "/access?tab=area-assignments", icon: Map },
      { title: "Login Activity Log", url: "/access?tab=login-logs", icon: Clock },
    ],
  },
];

const customerNav: NavItem[] = [
  {
    title: "Customers",
    icon: Users,
    module: "customers",
    subItems: [
      { title: "Customer Type", url: "/customers?tab=types", icon: Hash },
      { title: "Add New Customer", url: "/customers?tab=add", icon: UserPlus },
      { title: "Customer List", url: "/customers?tab=list", icon: List },
      { title: "New Client Request", url: "/customers?tab=query-new", icon: Search },
      { title: "Client Request", url: "/customers?tab=query-list", icon: ClipboardList },
      { title: "CIR Customers", url: "/cir-customers", icon: Wifi },
      { title: "Corporate Customers", url: "/corporate-customers", icon: Briefcase },
      { title: "Package Change", url: "/package-change", icon: ArrowUpDown },
      { title: "Service Scheduler", url: "/service-scheduler", icon: CalendarRange },
    ],
  },
  {
    title: "Customer Portal",
    icon: MonitorSmartphone,
    module: "customer_portal",
    url: "/customer-portal",
  },
  {
    title: "Reseller Management",
    icon: Handshake,
    module: "reseller",
    subItems: [
      { title: "Reseller Type & Role", url: "/resellers?tab=types", icon: Hash },
      { title: "Add New Reseller", url: "/resellers/add", icon: UserPlus },
      { title: "Reseller List", url: "/resellers?tab=list", icon: List },
      { title: "Wallet & Transaction", url: "/resellers?tab=wallet", icon: Wallet },
      { title: "Commission Report", url: "/resellers?tab=commission", icon: TrendingUp },
      { title: "Reseller Packages", url: "/reseller-packages", icon: Package },
      { title: "Bandwidth Accounting", url: "/bandwidth-accounting", icon: Wifi },
    ],
  },
];

const billingNav: NavItem[] = [
  {
    title: "Support & Ticket",
    icon: LifeBuoy,
    module: "support",
    subItems: [
      { title: "Support Type", url: "/tickets?tab=types", icon: Hash },
      { title: "Open New Ticket", url: "/tickets?tab=new", icon: Plus },
      { title: "Support & Ticket", url: "/tickets?tab=list", icon: LifeBuoy },
      { title: "Support History", url: "/tickets?tab=history", icon: Clock },
    ],
  },
  {
    title: "Sale",
    icon: FileText,
    module: "sale",
    subItems: [
      { title: "Invoice Type", url: "/invoices?tab=types", icon: Hash },
      { title: "Add New Invoice", url: "/invoices?tab=add", icon: UserPlus },
      { title: "Invoice List", url: "/invoices?tab=list", icon: List },
      { title: "Daily Collection", url: "/daily-collection", icon: BadgeDollarSign },
      { title: "Collection Allocation", url: "/invoices?tab=allocation", icon: Receipt },
    ],
  },
  {
    title: "Accounting",
    icon: BookOpen,
    module: "accounting",
    subItems: [
      { title: "Account Types", url: "/accounting?tab=types", icon: Hash },
      { title: "Add New Account", url: "/accounting?tab=add", icon: UserPlus },
      { title: "Account List", url: "/accounting?tab=accounts", icon: BookOpen },
      { title: "Income Entry", url: "/accounting?tab=income", icon: TrendingUp },
      { title: "Expense Entry", url: "/accounting?tab=expense", icon: Banknote },
      { title: "Budget Allocation", url: "/accounting?tab=budget", icon: DollarSign },
      { title: "Expense Tracking", url: "/expenses", icon: Receipt },
      { title: "Credit Notes", url: "/credit-notes", icon: CreditCard },
      { title: "Billing Rules", url: "/billing-rules", icon: Timer },
      { title: "Payment Gateway", url: "/payment-gateway", icon: Banknote },
    ],
  },
  {
    title: "Transactions",
    icon: ArrowLeftRight,
    module: "transactions",
    subItems: [
      { title: "Transaction Type", url: "/transactions?tab=types", icon: Hash },
      { title: "Transactions List", url: "/transactions?tab=list", icon: List },
      { title: "Customer Collections", url: "/transactions?tab=customer-collections", icon: Users },
      { title: "CIR Collections", url: "/transactions?tab=cir-collections", icon: Wifi },
      { title: "Corporate Collections", url: "/transactions?tab=corporate-collections", icon: Building2 },
      { title: "Reseller Collections", url: "/transactions?tab=reseller-collections", icon: Handshake },
      { title: "Refund & Credit", url: "/transactions?tab=refund", icon: ArrowLeftRight },
      { title: "Transfer Account", url: "/transactions?tab=transfer", icon: Send },
      { title: "Wallet & Prepaid", url: "/transactions?tab=wallet", icon: Wallet },
      { title: "Recovery Officer Collection", url: "/transactions?tab=recovery-officer", icon: MapPin },
      { title: "Approval Workflow", url: "/transactions?tab=approval", icon: FileCheck },
    ],
  },
];

const operationsNav: NavItem[] = [
  {
    title: "Task Management",
    icon: ListTodo,
    module: "tasks",
    subItems: [
      { title: "Projects", url: "/projects?tab=dashboard", icon: FolderOpen },
      { title: "Tasks", url: "/tasks?tab=list", icon: ListTodo },
      { title: "Team Management", url: "/tasks?tab=team", icon: Users },
      { title: "Progress Tracking", url: "/progress-tracking", icon: TrendingUp },
      { title: "Task Audit", url: "/task-audit", icon: ClipboardList },
    ],
  },
  {
    title: "Network & IPAM",
    icon: Globe,
    module: "network",
    subItems: [
      { title: "NOC Dashboard", url: "/noc-dashboard", icon: Monitor },
      { title: "Network Monitoring", url: "/network-monitoring", icon: Gauge },
      { title: "MikroTik Integration", url: "/mikrotik", icon: Router },
      { title: "IP Addresses", url: "/ipam", icon: Network },
      { title: "RADIUS / AAA", url: "/radius", icon: Radio },
      { title: "Bandwidth Usage", url: "/bandwidth-usage", icon: Download },
      { title: "Customer Map", url: "/customer-map", icon: Map },
      { title: "FTTH / P2P Map", url: "/network-map", icon: MapPin },
      { title: "OLT Management", url: "/olt-management", icon: Server },
    ],
  },
  {
    title: "Service Outages",
    icon: Zap,
    module: "outages",
    subItems: [
      { title: "Outage Management", url: "/outages", icon: Activity },
    ],
  },
  {
    title: "Assets",
    icon: HardDrive,
    module: "assets",
    subItems: [
      { title: "Assets Type", url: "/assets?tab=types", icon: Hash },
      { title: "Assets List", url: "/assets?tab=list", icon: List },
      { title: "Transfer & Movement", url: "/assets?tab=transfers", icon: ArrowLeftRight },
      { title: "Request & Approvals", url: "/asset-requests", icon: FileCheck },
      { title: "Asset Tracking", url: "/asset-tracking", icon: Search },
      { title: "Asset Allocation", url: "/asset-allocation", icon: Layers },
      { title: "Assign to Customer", url: "/asset-assignments", icon: UserCheck },
    ],
  },
  {
    title: "Inventory",
    icon: Boxes,
    module: "inventory",
    subItems: [
      { title: "Product Type", url: "/product-types", icon: Hash },
      { title: "Suppliers", url: "/suppliers", icon: Store },
      { title: "Brands & Products", url: "/brands-products", icon: Package },
      { title: "Purchase Order", url: "/purchase-orders", icon: FileText },
      { title: "Stock Management", url: "/stock-management", icon: Boxes },
      { title: "Purchase", url: "/inventory?tab=purchase", icon: DollarSign },
      { title: "Sales", url: "/inventory?tab=sales", icon: TrendingUp },
      { title: "Inventory List", url: "/inventory-list", icon: List },
      { title: "Batch & Serial", url: "/batch-serial", icon: Hash },
      { title: "Expiry & Warranty", url: "/inventory?tab=warranty", icon: Calendar },
    ],
  },
];

const systemNav: NavItem[] = [
  {
    title: "Notifications",
    icon: Bell,
    module: "notifications",
    subItems: [
      { title: "Notification Type", url: "/notification-types", icon: Hash },
      { title: "Alert & Templates", url: "/alert-templates", icon: FileText },
      { title: "Push Notification", url: "/push-notifications", icon: Bell },
      { title: "Bulk & Campaign", url: "/bulk-campaigns", icon: Megaphone },
      { title: "Bulk Messaging", url: "/bulk-messaging", icon: Send },
      { title: "SMS & Email API", url: "/sms-email-api", icon: MessageSquare },
      { title: "Push SMS", url: "/push-sms", icon: Send },
    ],
  },
  {
    title: "All Reports",
    icon: BarChart3,
    module: "reports",
    subItems: [
      { title: "Reports Dashboard", url: "/reports", icon: BarChart3 },
      { title: "Customer Reports", url: "/reports/customers", icon: Users },
      { title: "Billing & Invoice", url: "/reports/billing", icon: FileText },
      { title: "Payment Reports", url: "/reports/payments", icon: CreditCard },
      { title: "Network & IPAM", url: "/reports/network", icon: Server },
      { title: "Inventory Reports", url: "/reports/inventory", icon: Boxes },
      { title: "Asset Reports", url: "/reports/assets", icon: HardDrive },
      { title: "HRM Reports", url: "/reports/hrm", icon: Briefcase },
      { title: "Notification Reports", url: "/reports/notifications", icon: Bell },
      { title: "Activity Log", url: "/reports/activity", icon: ClipboardCheck },
      { title: "Vendor Reports", url: "/reports/vendors", icon: Store },
      { title: "Revenue Analytics", url: "/revenue-analytics", icon: PieChart },
      { title: "Aging Report", url: "/aging-report", icon: Timer },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    module: "settings",
    subItems: [
      { title: "General", url: "/general-settings", icon: Settings },
      { title: "Company", url: "/settings?tab=company", icon: Building2 },
      { title: "Billing", url: "/settings?tab=billing", icon: CreditCard },
      { title: "HRM Rights Setup", url: "/hrm-rights-setup", icon: ShieldCheck },
      { title: "Customer Rights", url: "/customer-rights", icon: Users },
      { title: "Invoice Template", url: "/invoice-templates", icon: FileText },
      { title: "Notification Setting", url: "/notification-settings", icon: Bell },
      { title: "Payment Gateway", url: "/payment-gateway-settings", icon: CreditCard },
      { title: "Activity Log", url: "/activity-log", icon: Activity },
      { title: "Audit Log", url: "/audit-log", icon: Shield },
    ],
  },
];

function getBasePath(url: string) {
  return url.split("?")[0];
}

function subscribeToUrl(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener("pushstate", callback);
  window.addEventListener("replacestate", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("pushstate", callback);
    window.removeEventListener("replacestate", callback);
  };
}

function useSearch() {
  return useSyncExternalStore(subscribeToUrl, () => window.location.search, () => "");
}

function CollapsibleNavItem({ item }: { item: NavItem }) {
  const [location, navigate] = useLocation();
  const currentPath = location.split("?")[0];
  const currentSearch = useSearch();

  const isParentActive = item.subItems
    ? item.subItems.some((sub) => {
        const subPath = getBasePath(sub.url);
        return subPath === "/" ? currentPath === "/" : currentPath.startsWith(subPath);
      })
    : item.url
    ? getBasePath(item.url) === "/" ? currentPath === "/" : currentPath.startsWith(getBasePath(item.url))
    : false;

  const [isOpen, setIsOpen] = useState(isParentActive);

  if (!item.subItems) {
    const isActive = item.url
      ? getBasePath(item.url) === "/" ? currentPath === "/" : currentPath.startsWith(getBasePath(item.url))
      : false;
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          data-active={isActive}
          className={`group relative mx-1 rounded-lg ${
            isActive
              ? "bg-white/12 text-white shadow-[0_0_12px_rgba(0,135,255,0.15)] border border-white/10"
              : "text-blue-100/70 border border-transparent"
          }`}
        >
          <Link href={item.url || "/"} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
            <item.icon className={`h-4 w-4 transition-colors ${isActive ? "text-blue-300" : "text-blue-200/50 group-hover:text-blue-300/80"}`} />
            <span className="flex-1 text-[13px] font-medium">{item.title}</span>
            {isActive && <ChevronRight className="h-3.5 w-3.5 text-blue-300/60" />}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
            className={`group relative mx-1 rounded-lg cursor-pointer ${
              isParentActive
                ? "bg-white/8 text-white border border-white/8"
                : "text-blue-100/70 border border-transparent"
            }`}
          >
            <item.icon className={`h-4 w-4 transition-colors ${isParentActive ? "text-blue-300" : "text-blue-200/50 group-hover:text-blue-300/80"}`} />
            <span className="flex-1 text-[13px] font-medium">{item.title}</span>
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-blue-300/60 transition-transform" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-blue-200/40 transition-transform" />
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-4 mt-0.5 mb-1 space-y-0.5 border-l border-white/8 pl-2">
            {item.subItems.map((sub) => {
              const subBasePath = getBasePath(sub.url);
              const subTab = sub.url.includes("?tab=") ? sub.url.split("?tab=")[1] : "";
              const currentTab = currentSearch.includes("tab=") ? new URLSearchParams(currentSearch).get("tab") || "" : "";
              const isSubActive = subBasePath === currentPath && (subTab === currentTab || (!currentTab && subTab === item.subItems![0].url.split("?tab=")[1]));

              return (
                <SidebarMenuButton
                  key={sub.title}
                  className={`rounded-md h-7 text-[12px] mx-0 ${
                    isSubActive
                      ? "bg-white/10 text-white font-medium"
                      : "text-blue-100/55 hover:text-blue-100/80 hover:bg-white/5"
                  }`}
                  onClick={(e) => { e.preventDefault(); navigate(sub.url); }}
                  data-testid={`nav-sub-${sub.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <sub.icon className={`h-3 w-3 ${isSubActive ? "text-blue-300" : "text-blue-200/40"}`} />
                  <span>{sub.title}</span>
                </SidebarMenuButton>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

function NavGroup({
  label,
  items,
}: {
  label: string;
  items: NavItem[];
}) {
  if (items.length === 0) return null;
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-200/50 dark:text-blue-300/40 px-3 mb-0.5">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <CollapsibleNavItem key={item.title} item={item} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { isAdmin, canView, canViewSubmenu, isLoading } = usePermissions();

  const filterNav = useCallback(
    (items: NavItem[]) => {
      if (isLoading || isAdmin) return items;
      return items
        .map((item) => {
          if (!item.module || !item.subItems) return item;
          const filteredSubs = item.subItems.filter((sub) =>
            canViewSubmenu(item.module!, sub.title)
          );
          return { ...item, subItems: filteredSubs };
        })
        .filter((item) => {
          if (!item.module) return true;
          if (item.subItems && item.subItems.length === 0) return false;
          return canView(item.module);
        });
    },
    [isAdmin, canView, canViewSubmenu, isLoading]
  );

  const filteredDashboard = useMemo(() => filterNav(dashboardNav), [filterNav]);
  const filteredManagement = useMemo(() => filterNav(managementNav), [filterNav]);
  const filteredHrm = useMemo(() => filterNav(hrmNav), [filterNav]);
  const filteredCustomer = useMemo(() => filterNav(customerNav), [filterNav]);
  const filteredBilling = useMemo(() => filterNav(billingNav), [filterNav]);
  const filteredOperations = useMemo(() => filterNav(operationsNav), [filterNav]);
  const filteredSystem = useMemo(() => filterNav(systemNav), [filterNav]);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <Sidebar className="gradient-sidebar border-r-0">
      <SidebarHeader className="px-4 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl gradient-primary shadow-[0_2px_10px_rgba(0,87,255,0.3)]">
            <Globe className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold tracking-tight text-white" data-testid="text-brand-name">NetSphere</span>
            <span className="text-[10px] font-medium text-blue-200/50 tracking-wide uppercase">ISP Platform</span>
          </div>
        </Link>
      </SidebarHeader>
      <div className="mx-3 h-px bg-white/8" />
      <SidebarContent>
        <ScrollArea className="flex-1 py-2">
          <NavGroup label="Overview" items={filteredDashboard} />
          <NavGroup label="Management" items={filteredManagement} />
          <NavGroup label="HR & People" items={filteredHrm} />
          <NavGroup label="Customers & Resellers" items={filteredCustomer} />
          <NavGroup label="Billing & Finance" items={filteredBilling} />
          <NavGroup label="Operations" items={filteredOperations} />
          <NavGroup label="System" items={filteredSystem} />
        </ScrollArea>
      </SidebarContent>
      <div className="mx-3 h-px bg-white/8" />
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              data-testid="button-logout"
              className="mx-1 rounded-lg text-blue-100/60 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-[13px] font-medium">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
