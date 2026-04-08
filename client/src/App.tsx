import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Moon, Sun, Search, Bell, User } from "lucide-react";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import CustomersPage from "@/pages/customers";
import CustomerProfilePage from "@/pages/customer-profile";
import AddCustomerPage from "@/pages/add-customer";
import EditCustomerPage from "@/pages/edit-customer";
import PackagesPage from "@/pages/packages";
import InvoicesPage from "@/pages/invoices";
import TicketsPage from "@/pages/tickets";
import AreasPage from "@/pages/areas";
import VendorsPage from "@/pages/vendors";
import VendorProfilePage from "@/pages/vendor-profile";
import ResellersPage from "@/pages/resellers";
import AddResellerPage from "@/pages/add-reseller";
import EditResellerPage from "@/pages/edit-reseller";
import ResellerProfilePage from "@/pages/reseller-profile";
import AccountingPage from "@/pages/accounting";
import CompanyBankAccountsPage from "@/pages/company-bank-accounts";
import TransactionsPage from "@/pages/transactions";
import TasksPage from "@/pages/tasks";
import ProjectsPage from "@/pages/projects";
import ProgressTrackingPage from "@/pages/progress-tracking";
import TaskAuditPage from "@/pages/task-audit";
import CreditNotesPage from "@/pages/credit-notes";
import AttendancePage from "@/pages/attendance";
import ExpensesPage from "@/pages/expenses";
import AssetsPage from "@/pages/assets";
import InventoryPage from "@/pages/inventory";
import HRPage from "@/pages/hr";
import EmployeeProfilePage from "@/pages/employee-profile";
import AccessPage from "@/pages/access";
import CompanyPage from "@/pages/company";
import NotificationsPage from "@/pages/notifications";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import AuditLogPage from "@/pages/audit-log";
import BulkMessagingPage from "@/pages/bulk-messaging";
import IpamPage from "@/pages/ipam";
import BillingRulesPage from "@/pages/billing-rules";
import RadiusPage from "@/pages/radius";
import OutagesPage from "@/pages/outages";
import NetworkMonitoringPage from "@/pages/network-monitoring";
import MikroTikPage from "@/pages/mikrotik";
import CustomerPortalPage from "@/pages/customer-portal";
import PaymentGatewayPage from "@/pages/payment-gateway";
import CustomerMapPage from "@/pages/customer-map";
import RevenueAnalyticsPage from "@/pages/revenue-analytics";
import AgingReportPage from "@/pages/aging-report";
import BandwidthUsagePage from "@/pages/bandwidth-usage";
import BandwidthAccountingPage from "@/pages/bandwidth-accounting";
import ResellerPackagesPage from "@/pages/reseller-packages";
import PackageChangePage from "@/pages/package-change";
import ServiceSchedulerPage from "@/pages/service-scheduler";
import DailyCollectionPage from "@/pages/daily-collection";
import LeavesPage from "@/pages/leaves";
import AdvancesPage from "@/pages/advances";
import SalaryPage from "@/pages/salary";
import BonusCommissionPage from "@/pages/bonus-commission";
import EmployeeTypesRolesPage from "@/pages/employee-types-roles";
import ShiftSchedulingPage from "@/pages/shift-scheduling";
import StaffAccountsPage from "@/pages/staff-accounts";
import ClientRequestProfilePage from "@/pages/client-request-profile";
import CirCustomersPage from "@/pages/cir-customers";
import CirCustomerProfilePage from "@/pages/cir-customer-profile";
import CorporateCustomersPage from "@/pages/corporate-customers";
import CorporateCustomerProfilePage from "@/pages/corporate-customer-profile";
import AssetAssignmentsPage from "@/pages/asset-assignments";
import AssetRequestsPage from "@/pages/asset-requests";
import AssetTrackingPage from "@/pages/asset-tracking";
import AssetAllocationPage from "@/pages/asset-allocation";
import ProductTypesPage from "@/pages/product-types";
import SuppliersPage from "@/pages/suppliers";
import BrandsProductsPage from "@/pages/brands-products";
import PurchaseOrdersPage from "@/pages/purchase-orders";
import StockManagementPage from "@/pages/stock-management";
import InventoryListPage from "@/pages/inventory-list";
import BatchSerialPage from "@/pages/batch-serial";
import NotificationTypesPage from "@/pages/notification-types";
import AlertTemplatesPage from "@/pages/alert-templates";
import PushNotificationsPage from "@/pages/push-notifications";
import BulkCampaignsPage from "@/pages/bulk-campaigns";
import SmsEmailApiPage from "@/pages/sms-email-api";
import PushSmsPage from "@/pages/push-sms";
import GeneralSettingsPage from "@/pages/general-settings";
import HrmRightsSetupPage from "@/pages/hrm-rights-setup";
import CustomerRightsPage from "@/pages/customer-rights";
import InvoiceTemplatesPage from "@/pages/invoice-templates";
import NotificationSettingsPage from "@/pages/notification-settings";
import PaymentGatewaySettingsPage from "@/pages/payment-gateway-settings";
import ActivityLogPage from "@/pages/activity-log";
import NetworkMapPage from "@/pages/network-map";
import OltListPage from "@/pages/olt-list";
import OltManagementPage from "@/pages/olt-management";
import NocDashboardPage from "@/pages/noc-dashboard";
import ReportsCustomersPage from "@/pages/reports-customers";
import ReportsBillingPage from "@/pages/reports-billing";
import ReportsPaymentsPage from "@/pages/reports-payments";
import ReportsNetworkPage from "@/pages/reports-network";
import ReportsInventoryPage from "@/pages/reports-inventory";
import ReportsAssetsPage from "@/pages/reports-assets";
import ReportsHrmPage from "@/pages/reports-hrm";
import ReportsNotificationsPage from "@/pages/reports-notifications";
import ReportsActivityPage from "@/pages/reports-activity";
import ReportsVendorsPage from "@/pages/reports-vendors";
import { Skeleton } from "@/components/ui/skeleton";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
      className="rounded-lg text-muted-foreground"
    >
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/customers" component={CustomersPage} />
      <Route path="/customers/add" component={AddCustomerPage} />
      <Route path="/add-customer" component={AddCustomerPage} />
      <Route path="/customers/:id/edit" component={EditCustomerPage} />
      <Route path="/customers/:id" component={CustomerProfilePage} />
      <Route path="/client-requests/:id" component={ClientRequestProfilePage} />
      <Route path="/cir-customers" component={CirCustomersPage} />
      <Route path="/cir-customers/:id" component={CirCustomerProfilePage} />
      <Route path="/corporate-customers" component={CorporateCustomersPage} />
      <Route path="/corporate-customers/:id" component={CorporateCustomerProfilePage} />
      <Route path="/package-change" component={PackageChangePage} />
      <Route path="/service-scheduler" component={ServiceSchedulerPage} />
      <Route path="/packages" component={PackagesPage} />
      <Route path="/invoices" component={InvoicesPage} />
      <Route path="/tickets" component={TicketsPage} />
      <Route path="/areas" component={AreasPage} />
      <Route path="/vendors" component={VendorsPage} />
      <Route path="/resellers/add" component={AddResellerPage} />
      <Route path="/resellers/:id/edit" component={EditResellerPage} />
      <Route path="/resellers/:id" component={ResellerProfilePage} />
      <Route path="/resellers" component={ResellersPage} />
      <Route path="/accounting" component={AccountingPage} />
      <Route path="/company-bank-accounts" component={CompanyBankAccountsPage} />
      <Route path="/transactions" component={TransactionsPage} />
      <Route path="/tasks" component={TasksPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/progress-tracking" component={ProgressTrackingPage} />
      <Route path="/task-audit" component={TaskAuditPage} />
      <Route path="/credit-notes" component={CreditNotesPage} />
      <Route path="/expenses" component={ExpensesPage} />
      <Route path="/assets" component={AssetsPage} />
      <Route path="/asset-assignments" component={AssetAssignmentsPage} />
      <Route path="/asset-requests" component={AssetRequestsPage} />
      <Route path="/asset-tracking" component={AssetTrackingPage} />
      <Route path="/asset-allocation" component={AssetAllocationPage} />
      <Route path="/product-types" component={ProductTypesPage} />
      <Route path="/suppliers" component={SuppliersPage} />
      <Route path="/brands-products" component={BrandsProductsPage} />
      <Route path="/purchase-orders" component={PurchaseOrdersPage} />
      <Route path="/stock-management" component={StockManagementPage} />
      <Route path="/inventory-list" component={InventoryListPage} />
      <Route path="/batch-serial" component={BatchSerialPage} />
      <Route path="/notification-types" component={NotificationTypesPage} />
      <Route path="/alert-templates" component={AlertTemplatesPage} />
      <Route path="/push-notifications" component={PushNotificationsPage} />
      <Route path="/bulk-campaigns" component={BulkCampaignsPage} />
      <Route path="/sms-email-api" component={SmsEmailApiPage} />
      <Route path="/push-sms" component={PushSmsPage} />
      <Route path="/general-settings" component={GeneralSettingsPage} />
      <Route path="/hrm-rights-setup" component={HrmRightsSetupPage} />
      <Route path="/customer-rights" component={CustomerRightsPage} />
      <Route path="/invoice-templates" component={InvoiceTemplatesPage} />
      <Route path="/notification-settings" component={NotificationSettingsPage} />
      <Route path="/payment-gateway-settings" component={PaymentGatewaySettingsPage} />
      <Route path="/activity-log" component={ActivityLogPage} />
      <Route path="/inventory" component={InventoryPage} />
      <Route path="/attendance" component={AttendancePage} />
      <Route path="/leaves" component={LeavesPage} />
      <Route path="/advances" component={AdvancesPage} />
      <Route path="/salary" component={SalaryPage} />
      <Route path="/bonus-commission" component={BonusCommissionPage} />
      <Route path="/employee-types-roles" component={EmployeeTypesRolesPage} />
      <Route path="/shift-scheduling" component={ShiftSchedulingPage} />
      <Route path="/hr" component={HRPage} />
      <Route path="/hr/employees/:id" component={EmployeeProfilePage} />
      <Route path="/access" component={AccessPage} />
      <Route path="/staff-accounts" component={StaffAccountsPage} />
      <Route path="/company" component={CompanyPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/reports/customers" component={ReportsCustomersPage} />
      <Route path="/reports/billing" component={ReportsBillingPage} />
      <Route path="/reports/payments" component={ReportsPaymentsPage} />
      <Route path="/reports/network" component={ReportsNetworkPage} />
      <Route path="/reports/inventory" component={ReportsInventoryPage} />
      <Route path="/reports/assets" component={ReportsAssetsPage} />
      <Route path="/reports/hrm" component={ReportsHrmPage} />
      <Route path="/reports/notifications" component={ReportsNotificationsPage} />
      <Route path="/reports/activity" component={ReportsActivityPage} />
      <Route path="/reports/vendors" component={ReportsVendorsPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/audit-log" component={AuditLogPage} />
      <Route path="/bulk-messaging" component={BulkMessagingPage} />
      <Route path="/ipam" component={IpamPage} />
      <Route path="/billing-rules" component={BillingRulesPage} />
      <Route path="/radius" component={RadiusPage} />
      <Route path="/outages" component={OutagesPage} />
      <Route path="/network-monitoring" component={NetworkMonitoringPage} />
      <Route path="/mikrotik" component={MikroTikPage} />
      <Route path="/customer-portal" component={CustomerPortalPage} />
      <Route path="/payment-gateway" component={PaymentGatewayPage} />
      <Route path="/customer-map" component={CustomerMapPage} />
      <Route path="/revenue-analytics" component={RevenueAnalyticsPage} />
      <Route path="/aging-report" component={AgingReportPage} />
      <Route path="/bandwidth-usage" component={BandwidthUsagePage} />
      <Route path="/bandwidth-accounting" component={BandwidthAccountingPage} />
      <Route path="/reseller-packages" component={ResellerPackagesPage} />
      <Route path="/daily-collection" component={DailyCollectionPage} />
      <Route path="/network-map" component={NetworkMapPage} />
      <Route path="/noc-dashboard" component={NocDashboardPage} />
      <Route path="/olt-management" component={OltListPage} />
      <Route path="/olt-management/:id" component={OltManagementPage} />
      <Route path="/vendors/profile/:id" component={VendorProfilePage} />
      <Route path="/login">{() => <Redirect to="/" />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function TopNavBar() {
  const { data: notifications } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead)?.length || 0;

  return (
    <header className="flex items-center justify-between gap-3 px-4 py-2.5 glass-header sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <SidebarTrigger data-testid="button-sidebar-toggle" className="text-muted-foreground" />
        <div className="hidden sm:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            type="search"
            placeholder="Search anything..."
            className="w-64 h-9 pl-9 rounded-lg bg-background/60 border-border/60 text-sm input-enterprise"
            data-testid="input-global-search"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg relative text-muted-foreground"
          data-testid="button-notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-card">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
        <div className="h-6 w-px bg-border/60 mx-1 hidden sm:block" />
        <Button
          variant="ghost"
          className="px-2.5 rounded-lg gap-2 text-muted-foreground"
          data-testid="button-user-profile"
        >
          <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-medium hidden sm:inline text-foreground">Admin</span>
        </Button>
      </div>
    </header>
  );
}

function AuthenticatedApp() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <TopNavBar />
          <main className="flex-1 overflow-auto bg-background">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { user, isLoading, isAuthenticated, refreshAuth } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center animate-pulse shadow-[0_4px_16px_rgba(0,87,255,0.3)]">
            <div className="w-5 h-5 rounded-full bg-white/30" />
          </div>
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={refreshAuth} />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AppContent />
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
