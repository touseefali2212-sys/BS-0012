import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { HrmRole, HrmPermission } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX, Users, Lock, Unlock,
  Plus, Copy, Pencil, Archive, ChevronDown, ChevronRight, Save,
  Smartphone, Monitor, Globe, AlertTriangle, CheckCircle2, XCircle,
  Eye, FilePlus, FileEdit, Trash2, ThumbsUp, Download, Printer,
  LayoutGrid, Settings, Package, ShoppingCart, Building2, Wrench,
  Bell, BarChart3, CreditCard, UserCog, Boxes, Loader2, Info,
  Search, Upload, FileDown, GitCompare, Zap, TriangleAlert,
  MapPin, Store, Handshake, LifeBuoy, FileText, BookOpen, ArrowLeftRight,
  MonitorSmartphone, HardDrive, ListTodo
} from "lucide-react";

const MODULE_STRUCTURE: Record<string, { icon: any; label: string; submenus: string[] }> = {
  dashboard:       { icon: LayoutGrid,       label: "Dashboard",             submenus: ["Overview", "Customers Dashboard", "Revenue & Collection", "Quick Action"] },
  company:         { icon: Building2,         label: "Company",               submenus: ["Company Profile", "Branches & Department"] },
  vendors:         { icon: Store,             label: "Vendors",               submenus: ["Vendor Type", "Add Vendor", "Vendor List", "Vendor Packages", "Bandwidth Changes", "Account & Ledger", "Wallet & Billing"] },
  packages:        { icon: Package,           label: "Packages",              submenus: ["Packages List", "Tax & Extra Fee", "Reseller Packages"] },
  area_management: { icon: MapPin,            label: "Area Management",       submenus: ["Add Area", "Area List", "Area Allocation", "Service Availability", "Multi Branch Control"] },
  hr_payroll:      { icon: UserCog,           label: "HR & Payroll",          submenus: ["Add Employee", "Employee List", "Employee Type/Role", "Shift & Scheduling", "Attendance", "Attendance Tracking", "Salary Processing", "Bonus & Commission", "Advance & Loan", "Holiday & Leave"] },
  hrm:             { icon: ShieldCheck,       label: "HRM",                   submenus: ["HRM Role & Type", "Staff User Login", "Account Management", "App Access Control", "Area Management", "Area Allocation", "Login Activity Log"] },
  customers:       { icon: Users,             label: "Customers",             submenus: ["Customer Type", "Add New Customer", "Customer List", "New Client Request", "Client Request", "CIR Customers", "Corporate Customers"] },
  customer_portal: { icon: MonitorSmartphone, label: "Customer Portal",       submenus: ["Customer Portal"] },
  reseller:        { icon: Handshake,         label: "Reseller Management",   submenus: ["Reseller Type & Role", "Add New Reseller", "Reseller List", "Wallet & Transaction", "Commission Report"] },
  support:         { icon: LifeBuoy,          label: "Support & Ticket",      submenus: ["Support Type", "Open New Ticket", "Support & Ticket", "Support History"] },
  sale:            { icon: FileText,          label: "Sale",                  submenus: ["Invoice Type", "Add New Invoice", "Invoice List", "Daily Collection", "Collection Allocation"] },
  accounting:      { icon: BookOpen,          label: "Accounting",            submenus: ["Account Types", "Add New Account", "Account List", "Income Entry", "Expense Entry", "Budget Allocation", "Expense Tracking", "Credit Notes", "Billing Rule", "Payment Gateway"] },
  transactions:    { icon: ArrowLeftRight,    label: "Transactions",          submenus: ["Transaction Type", "Transactions List", "Customer Collections", "CIR Collections", "Corporate Collections", "Reseller Collections", "Refund & Credit", "Transfer Account", "Wallet & Prepaid", "Recovery Officer Collection", "Approval Workflow"] },
  tasks:           { icon: ListTodo,          label: "Task Management",       submenus: ["Projects", "Tasks", "Team Management", "Progress Tracking", "Task Audit"] },
  network:         { icon: Globe,             label: "Network & IPAM",        submenus: ["Network Monitoring", "Mikrotik Integration", "IP Addresses", "Radius / AAA", "Bandwidth Usage", "Customer Map", "FTTH / P2P Map"] },
  outages:         { icon: Zap,               label: "Service Outages",       submenus: ["Outage Management"] },
  assets:          { icon: HardDrive,         label: "Assets",                submenus: ["Assets Type", "Assets List", "Transfer & Movement", "Request & Approvals", "Asset Tracking", "Asset Allocation", "Assign to Customer"] },
  inventory:       { icon: Boxes,             label: "Inventory",             submenus: ["Product Type", "Suppliers", "Brands & Product", "Purchase Order", "Stock Management", "Purchase", "Sales", "Inventory List", "Batch & Serial", "Expiry & Warranty"] },
  notifications:   { icon: Bell,              label: "Notifications",         submenus: ["Notification Type", "Alert & Templates", "Push Notification", "Bulk Notification", "Bulk & Campaign", "Bulk Messaging", "SMS & Email API", "Push SMS"] },
  reports:         { icon: BarChart3,         label: "All Reports",           submenus: ["Reports Dashboard", "Customer Reports", "Billing & Invoice", "Payment Reports", "Network & IPAM", "Inventory Reports", "Assets Reports", "HRM Reports", "Notification Reports", "Activity Log", "Vendor Reports", "Revenue Analytics", "Aging Report"] },
  settings:        { icon: Settings,          label: "Settings",              submenus: ["General", "Company", "Billing", "HRM Rights Setup", "Customer Rights", "Invoice Template", "Notification Setting", "Payment Gateway", "Activity Log", "Audit Log"] },
};

const PERMISSION_ACTIONS = [
  { key: "canView", label: "View", icon: Eye, color: "text-blue-500" },
  { key: "canCreate", label: "Create", icon: FilePlus, color: "text-green-500" },
  { key: "canEdit", label: "Edit", icon: FileEdit, color: "text-amber-500" },
  { key: "canDelete", label: "Delete", icon: Trash2, color: "text-red-500" },
  { key: "canApprove", label: "Approve", icon: ThumbsUp, color: "text-purple-500" },
  { key: "canExport", label: "Export", icon: Download, color: "text-cyan-500" },
  { key: "canPrint", label: "Print", icon: Printer, color: "text-gray-500" },
] as const;

const DATA_SCOPE_OPTIONS = [
  { value: "own", label: "Own Data Only" },
  { value: "department", label: "Department Data" },
  { value: "all", label: "All Data" },
];

const DEFAULT_ROLES = [
  { name: "Admin", description: "Full system access with all permissions", isSystem: true },
  { name: "Finance Manager", description: "Financial operations and reporting", isSystem: true },
  { name: "Inventory Manager", description: "Inventory and stock management", isSystem: true },
  { name: "Sales Manager", description: "Sales operations and customer management", isSystem: true },
  { name: "Warehouse Manager", description: "Warehouse operations and transfers", isSystem: true },
  { name: "HR Manager", description: "Human resource management and payroll", isSystem: true },
  { name: "Customer Support", description: "Customer service and ticket management", isSystem: true },
  { name: "Technician", description: "Field operations and asset tracking", isSystem: true },
];

type TemplatePerms = Record<string, Partial<{ canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean; canApprove: boolean; canExport: boolean; canPrint: boolean; webAccess: boolean; appAccess: boolean }>>;

const ALL_MODULE_KEYS = Object.keys({
  dashboard: 1, company: 1, vendors: 1, packages: 1, area_management: 1,
  hr_payroll: 1, hrm: 1, customers: 1, customer_portal: 1, reseller: 1, support: 1,
  sale: 1, accounting: 1, transactions: 1, tasks: 1, network: 1, outages: 1,
  assets: 1, inventory: 1, notifications: 1, reports: 1, settings: 1,
});

const FULL_PERMS = { canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true, canPrint: true, webAccess: true, appAccess: true };

const ROLE_TEMPLATES: Record<string, { label: string; description: string; permissions: TemplatePerms }> = {
  super_admin: {
    label: "Super Admin",
    description: "Full access to everything — cannot be restricted",
    permissions: Object.fromEntries(ALL_MODULE_KEYS.map(k => [k, FULL_PERMS])),
  },
  admin: {
    label: "Admin",
    description: "Full system access except critical settings",
    permissions: Object.fromEntries(ALL_MODULE_KEYS.filter(k => k !== "settings").map(k => [k, { ...FULL_PERMS, appAccess: false }])),
  },
  branch_manager: {
    label: "Branch Manager",
    description: "Customers, billing, reports & limited staff management",
    permissions: {
      dashboard: { canView: true, webAccess: true },
      customers: { canView: true, canCreate: true, canEdit: true, canExport: true, webAccess: true },
      sale: { canView: true, canCreate: true, canApprove: true, canExport: true, canPrint: true, webAccess: true },
      accounting: { canView: true, canExport: true, webAccess: true },
      hr_payroll: { canView: true, webAccess: true },
      reports: { canView: true, canExport: true, canPrint: true, webAccess: true },
    },
  },
  accountant: {
    label: "Accountant",
    description: "Accounting, transactions, billing and reports only",
    permissions: {
      dashboard: { canView: true, webAccess: true },
      sale: { canView: true, canCreate: true, canEdit: true, canApprove: true, canExport: true, canPrint: true, webAccess: true },
      accounting: { canView: true, canCreate: true, canEdit: true, canApprove: true, canExport: true, canPrint: true, webAccess: true },
      transactions: { canView: true, canCreate: true, canApprove: true, canExport: true, webAccess: true },
      reports: { canView: true, canExport: true, canPrint: true, webAccess: true },
    },
  },
  billing_staff: {
    label: "Billing Staff",
    description: "Invoice, customer billing and collections",
    permissions: {
      dashboard: { canView: true, webAccess: true },
      customers: { canView: true, webAccess: true },
      sale: { canView: true, canCreate: true, canPrint: true, webAccess: true },
      transactions: { canView: true, canCreate: true, webAccess: true },
      reports: { canView: true, canPrint: true, webAccess: true },
    },
  },
  recovery_officer: {
    label: "Recovery Officer",
    description: "Customer list, due payments, collections — limited reports",
    permissions: {
      dashboard: { canView: true, webAccess: true, appAccess: true },
      customers: { canView: true, webAccess: true, appAccess: true },
      sale: { canView: true, webAccess: true, appAccess: true },
      transactions: { canView: true, canCreate: true, webAccess: true, appAccess: true },
      reports: { canView: true, webAccess: true },
    },
  },
  technician: {
    label: "Technician",
    description: "Support tickets, network, customer view — no finance or HR",
    permissions: {
      dashboard: { canView: true, appAccess: true, webAccess: true },
      customers: { canView: true, appAccess: true, webAccess: true },
      support: { canView: true, canCreate: true, canEdit: true, appAccess: true, webAccess: true },
      tasks: { canView: true, canCreate: true, canEdit: true, appAccess: true, webAccess: true },
      network: { canView: true, canEdit: true, appAccess: true, webAccess: true },
      outages: { canView: true, canCreate: true, canEdit: true, appAccess: true, webAccess: true },
    },
  },
  hr_manager: {
    label: "HR Manager",
    description: "Full HR & Payroll access, limited other modules",
    permissions: {
      dashboard: { canView: true, webAccess: true },
      hr_payroll: { ...FULL_PERMS, appAccess: false },
      hrm: { canView: true, canCreate: true, canEdit: true, webAccess: true },
      reports: { canView: true, canExport: true, webAccess: true },
      settings: { canView: true, webAccess: true },
    },
  },
};

type PermissionMap = Record<string, Record<string, Partial<HrmPermission>>>;

export default function HrmRightsSetupPage() {
  const { toast } = useToast();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("matrix");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(["dashboard"]));
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDesc, setEditRoleDesc] = useState("");
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [localPermissions, setLocalPermissions] = useState<PermissionMap>({});
  const [moduleSearch, setModuleSearch] = useState("");
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [compareRoleId, setCompareRoleId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const { data: roles = [], isLoading: rolesLoading } = useQuery<HrmRole[]>({
    queryKey: ["/api/hrm-roles"],
    staleTime: 0,
  });

  const { data: permissions = [], isLoading: permsLoading } = useQuery<HrmPermission[]>({
    queryKey: ["/api/hrm-permissions", selectedRoleId],
    enabled: !!selectedRoleId,
  });

  const { data: comparePermissions = [] } = useQuery<HrmPermission[]>({
    queryKey: ["/api/hrm-permissions", compareRoleId],
    enabled: !!compareRoleId,
  });

  const selectedRole = useMemo(() => roles.find(r => r.id === selectedRoleId), [roles, selectedRoleId]);

  const permissionMap = useMemo(() => {
    const map: PermissionMap = {};
    permissions.forEach(p => {
      if (!map[p.module]) map[p.module] = {};
      const key = p.submenu || "__module__";
      map[p.module][key] = p;
    });
    Object.keys(localPermissions).forEach(mod => {
      if (!map[mod]) map[mod] = {};
      Object.keys(localPermissions[mod]).forEach(sub => {
        map[mod][sub] = { ...map[mod][sub], ...localPermissions[mod][sub] };
      });
    });
    return map;
  }, [permissions, localPermissions]);

  const initDefaultRolesMutation = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const role of DEFAULT_ROLES) {
        const res = await apiRequest("POST", "/api/hrm-roles", role);
        results.push(await res.json());
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hrm-roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({ title: "Default roles created", description: "8 system roles initialized successfully" });
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await apiRequest("POST", "/api/hrm-roles", data);
      return res.json();
    },
    onSuccess: async (role: HrmRole) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hrm-roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setSelectedRoleId(role.id);
      setShowCreateDialog(false);
      setNewRoleName("");
      setNewRoleDesc("");
      if (selectedTemplate && selectedTemplate !== "none") {
        const template = ROLE_TEMPLATES[selectedTemplate];
        if (template) {
          const noPerms = { canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false, canPrint: false, webAccess: false, appAccess: false };
          const permsList: any[] = [];
          Object.entries(MODULE_STRUCTURE).forEach(([modKey, mod]) => {
            const modTemplate = template.permissions[modKey];
            const base = modTemplate ? { ...noPerms, ...modTemplate } : noPerms;
            mod.submenus.forEach(sub => permsList.push({ module: modKey, submenu: sub, ...base }));
            permsList.push({ module: modKey, submenu: null, ...base });
          });
          await apiRequest("PUT", `/api/hrm-permissions/${role.id}`, { permissions: permsList });
          queryClient.invalidateQueries({ queryKey: ["/api/hrm-permissions", role.id] });
          toast({ title: "Role created with template", description: `${role.name} created from "${template.label}" template` });
        }
        setSelectedTemplate("");
      } else {
        toast({ title: "Role created", description: `${role.name} has been created` });
      }
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/hrm-roles/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hrm-roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setShowEditDialog(false);
      toast({ title: "Role updated" });
    },
  });

  const duplicateRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/hrm-roles/${id}/duplicate`, {});
      return res.json();
    },
    onSuccess: (role: HrmRole) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hrm-roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setSelectedRoleId(role.id);
      toast({ title: "Role duplicated", description: `${role.name} created` });
    },
  });

  const archiveRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/hrm-roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hrm-roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setSelectedRoleId(null);
      toast({ title: "Role archived" });
    },
  });

  const savePermissionsMutation = useMutation({
    mutationFn: async (data: { roleId: number; permissions: any[] }) => {
      const res = await apiRequest("PUT", `/api/hrm-permissions/${data.roleId}`, { permissions: data.permissions });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hrm-permissions", selectedRoleId] });
      queryClient.invalidateQueries({ queryKey: ["/api/hrm-roles"] });
      setLocalPermissions({});
      setUnsavedChanges(false);
      toast({ title: "Permissions saved", description: "All permission changes have been applied" });
    },
  });

  const toggleModule = useCallback((mod: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(mod) ? next.delete(mod) : next.add(mod);
      return next;
    });
  }, []);

  const updatePermission = useCallback((module: string, submenu: string | null, field: string, value: any) => {
    const key = submenu || "__module__";
    setLocalPermissions(prev => ({
      ...prev,
      [module]: {
        ...(prev[module] || {}),
        [key]: {
          ...(prev[module]?.[key] || {}),
          module,
          submenu,
          [field]: value,
        },
      },
    }));
    setUnsavedChanges(true);
  }, []);

  const toggleAllSubmenuPermissions = useCallback((module: string, field: string, value: boolean) => {
    const subs = MODULE_STRUCTURE[module]?.submenus || [];
    setLocalPermissions(prev => {
      const modPerms = { ...(prev[module] || {}) };
      subs.forEach(sub => {
        modPerms[sub] = { ...(modPerms[sub] || {}), module, submenu: sub, [field]: value };
      });
      modPerms["__module__"] = { ...(modPerms["__module__"] || {}), module, submenu: null, [field]: value };
      return { ...prev, [module]: modPerms };
    });
    setUnsavedChanges(true);
  }, []);

  const grantFullAccess = useCallback((module: string) => {
    const subs = MODULE_STRUCTURE[module]?.submenus || [];
    setLocalPermissions(prev => {
      const modPerms = { ...(prev[module] || {}) };
      const fullPerms = { canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true, canPrint: true, webAccess: true, appAccess: true };
      subs.forEach(sub => { modPerms[sub] = { ...(modPerms[sub] || {}), module, submenu: sub, ...fullPerms }; });
      modPerms["__module__"] = { ...(modPerms["__module__"] || {}), module, submenu: null, ...fullPerms };
      return { ...prev, [module]: modPerms };
    });
    setUnsavedChanges(true);
  }, []);

  const revokeAllAccess = useCallback((module: string) => {
    const subs = MODULE_STRUCTURE[module]?.submenus || [];
    setLocalPermissions(prev => {
      const modPerms = { ...(prev[module] || {}) };
      const noPerms = { canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false, canPrint: false, webAccess: false, appAccess: false };
      subs.forEach(sub => { modPerms[sub] = { ...(modPerms[sub] || {}), module, submenu: sub, ...noPerms }; });
      modPerms["__module__"] = { ...(modPerms["__module__"] || {}), module, submenu: null, ...noPerms };
      return { ...prev, [module]: modPerms };
    });
    setUnsavedChanges(true);
  }, []);

  const getPermValue = (module: string, submenu: string | null, field: string): boolean => {
    const key = submenu || "__module__";
    const local = localPermissions[module]?.[key];
    if (local && field in local) return !!(local as any)[field];
    const saved = permissionMap[module]?.[key];
    if (saved && field in saved) return !!(saved as any)[field];
    return false;
  };

  const getDataScope = (module: string, submenu: string | null): string => {
    const key = submenu || "__module__";
    return (localPermissions[module]?.[key] as any)?.dataScope
      || (permissionMap[module]?.[key] as any)?.dataScope
      || "all";
  };

  const getModuleAccessLevel = (module: string): { level: string; color: string; icon: any } => {
    const subs = MODULE_STRUCTURE[module]?.submenus || [];
    const allKeys = ["__module__", ...subs];
    let hasAny = false;
    let allFull = true;
    allKeys.forEach(key => {
      const p = permissionMap[module]?.[key];
      if (p) {
        const any = p.canView || p.canCreate || p.canEdit || p.canDelete || p.canApprove || p.canExport || p.canPrint;
        const full = p.canView && p.canCreate && p.canEdit && p.canDelete && p.canApprove && p.canExport && p.canPrint;
        if (any) hasAny = true;
        if (!full) allFull = false;
      } else {
        allFull = false;
      }
    });
    if (hasAny && allFull) return { level: "Full Access", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: ShieldCheck };
    if (hasAny) return { level: "Limited", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: ShieldAlert };
    return { level: "No Access", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: ShieldX };
  };

  const handleSavePermissions = () => {
    if (!selectedRoleId) return;
    const allPerms: any[] = [];
    Object.entries(MODULE_STRUCTURE).forEach(([modKey, mod]) => {
      allPerms.push({
        module: modKey,
        submenu: null,
        canView: getPermValue(modKey, null, "canView"),
        canCreate: getPermValue(modKey, null, "canCreate"),
        canEdit: getPermValue(modKey, null, "canEdit"),
        canDelete: getPermValue(modKey, null, "canDelete"),
        canApprove: getPermValue(modKey, null, "canApprove"),
        canExport: getPermValue(modKey, null, "canExport"),
        canPrint: getPermValue(modKey, null, "canPrint"),
        webAccess: getPermValue(modKey, null, "webAccess"),
        appAccess: getPermValue(modKey, null, "appAccess"),
        dataScope: getDataScope(modKey, null),
        conditions: null,
      });
      mod.submenus.forEach(sub => {
        allPerms.push({
          module: modKey,
          submenu: sub,
          canView: getPermValue(modKey, sub, "canView"),
          canCreate: getPermValue(modKey, sub, "canCreate"),
          canEdit: getPermValue(modKey, sub, "canEdit"),
          canDelete: getPermValue(modKey, sub, "canDelete"),
          canApprove: getPermValue(modKey, sub, "canApprove"),
          canExport: getPermValue(modKey, sub, "canExport"),
          canPrint: getPermValue(modKey, sub, "canPrint"),
          webAccess: getPermValue(modKey, sub, "webAccess"),
          appAccess: getPermValue(modKey, sub, "appAccess"),
          dataScope: getDataScope(modKey, sub),
          conditions: null,
        });
      });
    });
    savePermissionsMutation.mutate({ roleId: selectedRoleId, permissions: allPerms });
  };

  const permissionSummary = useMemo(() => {
    let totalGranted = 0;
    let highRisk = 0;
    let financialAccess = false;
    let deleteRights = 0;

    Object.keys(permissionMap).forEach(mod => {
      Object.keys(permissionMap[mod]).forEach(key => {
        const p = permissionMap[mod][key];
        PERMISSION_ACTIONS.forEach(a => {
          if ((p as any)?.[a.key]) {
            totalGranted++;
            if (a.key === "canDelete") { deleteRights++; highRisk++; }
            if (a.key === "canApprove") highRisk++;
          }
        });
        if ((mod === "sale" || mod === "accounting" || mod === "transactions") && (p?.canEdit || p?.canDelete || p?.canApprove)) {
          financialAccess = true;
        }
      });
    });

    return { totalGranted, highRisk, financialAccess, deleteRights };
  }, [permissionMap]);

  const comparePermissionMap = useMemo(() => {
    const map: PermissionMap = {};
    comparePermissions.forEach(p => {
      if (!map[p.module]) map[p.module] = {};
      const key = p.submenu || "__module__";
      map[p.module][key] = p;
    });
    return map;
  }, [comparePermissions]);

  const filteredModules = useMemo(() => {
    if (!moduleSearch.trim()) return Object.entries(MODULE_STRUCTURE);
    const q = moduleSearch.toLowerCase();
    return Object.entries(MODULE_STRUCTURE).filter(([, mod]) =>
      mod.label.toLowerCase().includes(q) ||
      mod.submenus.some(s => s.toLowerCase().includes(q))
    );
  }, [moduleSearch]);

  const applyTemplate = useCallback((templateKey: string) => {
    const template = ROLE_TEMPLATES[templateKey];
    if (!template) return;
    const noPerms = { canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false, canPrint: false, webAccess: false, appAccess: false };
    const newPerms: PermissionMap = {};
    Object.entries(MODULE_STRUCTURE).forEach(([modKey, mod]) => {
      const modTemplate = template.permissions[modKey];
      const base = modTemplate ? { ...noPerms, ...modTemplate } : noPerms;
      newPerms[modKey] = {};
      mod.submenus.forEach(sub => {
        newPerms[modKey][sub] = { module: modKey, submenu: sub, ...base } as any;
      });
      newPerms[modKey]["__module__"] = { module: modKey, submenu: null, ...base } as any;
    });
    setLocalPermissions(newPerms);
    setUnsavedChanges(true);
    toast({ title: `Template applied: ${template.label}`, description: template.description });
  }, [toast]);

  const exportPermissions = () => {
    if (!selectedRole) return;
    const data = {
      role: selectedRole.name,
      roleId: selectedRole.roleId,
      exportedAt: new Date().toISOString(),
      permissions: Object.keys(permissionMap).flatMap(mod =>
        Object.keys(permissionMap[mod]).map(key => ({
          module: mod,
          submenu: key === "__module__" ? null : key,
          ...(permissionMap[mod][key] as any),
        }))
      ),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedRole.name.replace(/\s+/g, "_")}-permissions.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Permissions exported", description: `${selectedRole.name} permissions downloaded as JSON` });
  };

  const importPermissions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const newPerms: PermissionMap = {};
        (data.permissions || []).forEach((p: any) => {
          const { module, submenu, ...rest } = p;
          if (!module) return;
          if (!newPerms[module]) newPerms[module] = {};
          newPerms[module][submenu || "__module__"] = { module, submenu: submenu || null, ...rest };
        });
        setLocalPermissions(newPerms);
        setUnsavedChanges(true);
        toast({ title: "Permissions imported", description: "Review changes and click Save to apply" });
      } catch {
        toast({ title: "Import failed", description: "Invalid or corrupted JSON file", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const hasConflict = (module: string, submenu: string): boolean => {
    const canView = getPermValue(module, submenu, "canView");
    const canCreate = getPermValue(module, submenu, "canCreate");
    const canEdit = getPermValue(module, submenu, "canEdit");
    const canDelete = getPermValue(module, submenu, "canDelete");
    return !canView && (canCreate || canEdit || canDelete);
  };

  const getCompareValue = (module: string, submenu: string | null, field: string): boolean => {
    const key = submenu || "__module__";
    const saved = comparePermissionMap[module]?.[key];
    if (saved && field in saved) return !!(saved as any)[field];
    return false;
  };

  if (rolesLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="hrm-rights-setup-page">
      <div className="rounded-xl bg-gradient-to-r from-[#334155] to-[#4F46E5] p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Shield className="h-7 w-7" />
              HRM Rights Setup
            </h1>
            <p className="text-white/70 mt-1">Role-based access control for modules & submenus across Web and App platforms</p>
          </div>
          <div className="flex items-center gap-2">
            {unsavedChanges && (
              <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/30 animate-pulse" data-testid="badge-unsaved">
                <AlertTriangle className="h-3 w-3 mr-1" /> Unsaved Changes
              </Badge>
            )}
            {roles.length === 0 && (
              <Button
                variant="secondary"
                onClick={() => initDefaultRolesMutation.mutate()}
                disabled={initDefaultRolesMutation.isPending}
                data-testid="button-init-roles"
              >
                {initDefaultRolesMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Initialize Default Roles
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => setShowCreateDialog(true)}
              data-testid="button-create-role"
            >
              <Plus className="h-4 w-4 mr-2" /> New Role
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {[
          { label: "Total Roles", value: roles.length, icon: Users, color: "text-indigo-500" },
          { label: "System Roles", value: roles.filter(r => r.isSystem).length, icon: Lock, color: "text-slate-500" },
          { label: "Custom Roles", value: roles.filter(r => !r.isSystem).length, icon: Unlock, color: "text-emerald-500" },
          { label: "Total Modules", value: selectedRole?.totalModules || 0, icon: LayoutGrid, color: "text-blue-500" },
          { label: "Full Access", value: selectedRole?.fullAccessModules || 0, icon: ShieldCheck, color: "text-green-500" },
          { label: "Limited Access", value: selectedRole?.limitedAccessModules || 0, icon: ShieldAlert, color: "text-amber-500" },
        ].map((kpi, i) => (
          <Card key={i} className="border-slate-200/60" data-testid={`card-kpi-${i}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <kpi.icon className={`h-8 w-8 ${kpi.color} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <Card className="border-slate-200/60" data-testid="card-role-selector">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" /> Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {roles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => { setSelectedRoleId(role.id); setLocalPermissions({}); setUnsavedChanges(false); }}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selectedRoleId === role.id ? "bg-indigo-50 border-l-2 border-indigo-500" : ""}`}
                    data-testid={`button-role-${role.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {role.isSystem ? <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" /> : <Unlock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                        <span className="font-medium text-sm truncate">{role.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 ml-1">
                        {role.totalModules || 0}
                      </Badge>
                    </div>
                    {role.description && (
                      <p className="text-[11px] text-muted-foreground mt-1 truncate pl-5.5">{role.description}</p>
                    )}
                  </button>
                ))}
                {roles.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    No roles configured. Initialize default roles or create a new one.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedRole && (
            <Card className="mt-3 border-slate-200/60" data-testid="card-role-actions">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Role Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => { setEditRoleName(selectedRole.name); setEditRoleDesc(selectedRole.description || ""); setShowEditDialog(true); }}
                    data-testid="button-edit-role"
                  >
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => duplicateRoleMutation.mutate(selectedRole.id)}
                    disabled={duplicateRoleMutation.isPending}
                    data-testid="button-duplicate-role"
                  >
                    <Copy className="h-3 w-3 mr-1" /> Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={exportPermissions}
                    data-testid="button-export-role"
                  >
                    <FileDown className="h-3 w-3 mr-1" /> Export
                  </Button>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={importPermissions}
                      data-testid="input-import-role"
                    />
                    <span className="flex items-center justify-center gap-1 text-xs h-8 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground w-full">
                      <Upload className="h-3 w-3" /> Import
                    </span>
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs col-span-2"
                    onClick={() => { setCompareRoleId(null); setShowCompareDialog(true); }}
                    data-testid="button-compare-role"
                  >
                    <GitCompare className="h-3 w-3 mr-1" /> Compare with Role
                  </Button>
                  {!selectedRole.isSystem && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-red-500 hover:text-red-600 col-span-2"
                      onClick={() => archiveRoleMutation.mutate(selectedRole.id)}
                      disabled={archiveRoleMutation.isPending}
                      data-testid="button-archive-role"
                    >
                      <Archive className="h-3 w-3 mr-1" /> Archive Role
                    </Button>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Web Access</span>
                    <Badge variant="outline" className={`text-[10px] ${selectedRole.webAccessEnabled ? "text-green-500" : "text-red-500"}`}>
                      {selectedRole.webAccessEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">App Access</span>
                    <Badge variant="outline" className={`text-[10px] ${selectedRole.appAccessEnabled ? "text-green-500" : "text-red-500"}`}>
                      {selectedRole.appAccessEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Role ID</span>
                    <span className="font-mono text-[10px]">{selectedRole.roleId}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="col-span-9">
          {!selectedRoleId ? (
            <Card className="border-slate-200/60">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Shield className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-500">Select a Role</h3>
                <p className="text-sm text-muted-foreground mt-1">Choose a role from the left panel to configure its permissions</p>
              </CardContent>
            </Card>
          ) : permsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-500" />
                    {selectedRole?.name} — Permissions
                  </h2>
                  <p className="text-xs text-muted-foreground">{selectedRole?.description}</p>
                </div>
                <Button
                  onClick={handleSavePermissions}
                  disabled={!unsavedChanges || savePermissionsMutation.isPending}
                  className="bg-gradient-to-r from-[#334155] to-[#4F46E5] hover:from-[#1e293b] hover:to-[#4338CA]"
                  data-testid="button-save-permissions"
                >
                  {savePermissionsMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save All Permissions
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="matrix" data-testid="tab-matrix">
                    <LayoutGrid className="h-4 w-4 mr-1.5" /> Permission Matrix
                  </TabsTrigger>
                  <TabsTrigger value="actions" data-testid="tab-actions">
                    <Settings className="h-4 w-4 mr-1.5" /> Action-Level
                  </TabsTrigger>
                  <TabsTrigger value="platform" data-testid="tab-platform">
                    <Globe className="h-4 w-4 mr-1.5" /> App vs Web
                  </TabsTrigger>
                  <TabsTrigger value="summary" data-testid="tab-summary">
                    <BarChart3 className="h-4 w-4 mr-1.5" /> Summary
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="matrix" className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search modules or submenus..."
                        value={moduleSearch}
                        onChange={(e) => setModuleSearch(e.target.value)}
                        className="pl-9 h-9 text-sm"
                        data-testid="input-module-search"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => { Object.keys(MODULE_STRUCTURE).forEach(m => grantFullAccess(m)); }}
                      data-testid="button-grant-all-modules"
                    >
                      <Zap className="h-3.5 w-3.5 text-green-500" /> Full Access All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => { Object.keys(MODULE_STRUCTURE).forEach(m => revokeAllAccess(m)); }}
                      data-testid="button-revoke-all-modules"
                    >
                      <XCircle className="h-3.5 w-3.5 text-red-500" /> Revoke All
                    </Button>
                    <Select value={selectedTemplate} onValueChange={(v) => { setSelectedTemplate(v); if (v) applyTemplate(v); }}>
                      <SelectTrigger className="h-9 w-[170px] text-xs" data-testid="select-template">
                        <Zap className="h-3 w-3 mr-1.5 text-indigo-500" />
                        <SelectValue placeholder="Apply Template" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_TEMPLATES).map(([key, t]) => (
                          <SelectItem key={key} value={key}>
                            <div>
                              <p className="font-medium text-xs">{t.label}</p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {filteredModules.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No modules match "<span className="font-medium">{moduleSearch}</span>"
                    </div>
                  )}
                  {filteredModules.map(([modKey, mod]) => {
                    const isExpanded = expandedModules.has(modKey);
                    const accessLevel = getModuleAccessLevel(modKey);
                    const AccessIcon = accessLevel.icon;
                    const ModIcon = mod.icon;
                    return (
                      <Card key={modKey} className="border-slate-200/60 overflow-hidden" data-testid={`card-module-${modKey}`}>
                        <div
                          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
                          onClick={() => toggleModule(modKey)}
                        >
                          <div className="flex items-center gap-3">
                            <button className="p-0.5">
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                            </button>
                            <ModIcon className="h-5 w-5 text-indigo-500" />
                            <span className="font-semibold text-sm">{mod.label}</span>
                            <Badge variant="outline" className={`text-[10px] ${accessLevel.color}`}>
                              <AccessIcon className="h-3 w-3 mr-1" /> {accessLevel.level}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] text-slate-400">{mod.submenus.length} submenus</Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-green-500 hover:text-green-600"
                                    onClick={(e) => { e.stopPropagation(); grantFullAccess(modKey); }}
                                    data-testid={`button-grant-all-${modKey}`}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Grant Full Access</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-red-500 hover:text-red-600"
                                    onClick={(e) => { e.stopPropagation(); revokeAllAccess(modKey); }}
                                    data-testid={`button-revoke-all-${modKey}`}
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Revoke All Access</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-100">
                            <div className="grid grid-cols-[1fr,repeat(7,48px)] items-center px-4 py-2 bg-slate-50/80 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              <span>Submenu</span>
                              {PERMISSION_ACTIONS.map(a => {
                                const AIcon = a.icon;
                                return (
                                  <TooltipProvider key={a.key}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          className="flex justify-center hover:opacity-80"
                                          onClick={() => {
                                            const allTrue = mod.submenus.every(sub => getPermValue(modKey, sub, a.key));
                                            toggleAllSubmenuPermissions(modKey, a.key, !allTrue);
                                          }}
                                        >
                                          <AIcon className={`h-3.5 w-3.5 ${a.color}`} />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>{a.label} — Toggle All</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              })}
                            </div>
                            {mod.submenus.map((sub, si) => {
                              const conflict = hasConflict(modKey, sub);
                              return (
                                <div
                                  key={sub}
                                  className={`grid grid-cols-[1fr,repeat(7,48px)] items-center px-4 py-2.5 ${conflict ? "bg-red-50/40 border-l-2 border-red-400" : si % 2 === 0 ? "bg-white" : "bg-slate-50/40"} hover:bg-indigo-50/30 transition-colors`}
                                  data-testid={`row-submenu-${modKey}-${si}`}
                                >
                                  <div className="flex items-center gap-1.5 pl-2">
                                    <span className="text-sm">{sub}</span>
                                    {conflict && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span>
                                              <TriangleAlert className="h-3.5 w-3.5 text-red-500" />
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            Conflict: Write/Delete access granted without View — add View permission to fix
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                  {PERMISSION_ACTIONS.map(a => (
                                    <div key={a.key} className="flex justify-center">
                                      <Switch
                                        checked={getPermValue(modKey, sub, a.key)}
                                        onCheckedChange={(v) => updatePermission(modKey, sub, a.key, v)}
                                        className="scale-75"
                                        data-testid={`switch-${modKey}-${sub}-${a.key}`}
                                      />
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </TabsContent>

                <TabsContent value="actions" className="mt-4 space-y-4">
                  <Card className="border-slate-200/60">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Settings className="h-4 w-4 text-indigo-500" /> Action-Level Permission Configuration
                      </CardTitle>
                      <CardDescription className="text-xs">Configure granular data scope and conditional access for each module</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(MODULE_STRUCTURE).map(([modKey, mod]) => {
                        const ModIcon = mod.icon;
                        return (
                          <Card key={modKey} className="border-slate-200/60" data-testid={`card-actions-${modKey}`}>
                            <div className="px-4 py-3 flex items-center gap-2 bg-slate-50/80 border-b border-slate-100">
                              <ModIcon className="h-4 w-4 text-indigo-500" />
                              <span className="font-semibold text-sm">{mod.label}</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                              {mod.submenus.map((sub, si) => (
                                <div key={sub} className={`px-4 py-3 ${si % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{sub}</span>
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-2">
                                        <Label className="text-xs text-muted-foreground">Data Scope:</Label>
                                        <Select
                                          value={getDataScope(modKey, sub)}
                                          onValueChange={(v) => updatePermission(modKey, sub, "dataScope", v)}
                                        >
                                          <SelectTrigger className="h-7 w-[140px] text-xs" data-testid={`select-scope-${modKey}-${sub}`}>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {DATA_SCOPE_OPTIONS.map(o => (
                                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        {PERMISSION_ACTIONS.slice(0, 5).map(a => {
                                          const AIcon = a.icon;
                                          const isOn = getPermValue(modKey, sub, a.key);
                                          return (
                                            <TooltipProvider key={a.key}>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <button
                                                    onClick={() => updatePermission(modKey, sub, a.key, !isOn)}
                                                    className={`p-1 rounded ${isOn ? `${a.color} bg-slate-100` : "text-slate-300"}`}
                                                    data-testid={`action-btn-${modKey}-${sub}-${a.key}`}
                                                  >
                                                    <AIcon className="h-3.5 w-3.5" />
                                                  </button>
                                                </TooltipTrigger>
                                                <TooltipContent>{a.label}: {isOn ? "Enabled" : "Disabled"}</TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Card>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card className="border-amber-200/60 bg-amber-50/30" data-testid="card-conditional-access">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="h-4 w-4" /> Conditional Access Rules
                      </CardTitle>
                      <CardDescription className="text-xs">Restrict access based on department, location, or amount thresholds</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { label: "View Own Data Only", desc: "User can only see records they created", field: "viewOwnOnly" },
                          { label: "View Department Data", desc: "User can see records from their department", field: "viewDeptData" },
                          { label: "Restrict Deletion", desc: "User cannot delete any records", field: "restrictDelete" },
                          { label: "Restrict Financial Fields", desc: "Hide cost price and financial data", field: "restrictFinancial" },
                          { label: "Restrict Cost Visibility", desc: "User cannot see cost/profit margins", field: "restrictCost" },
                        ].map(rule => (
                          <div key={rule.field} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/60 border border-amber-100">
                            <div>
                              <p className="text-sm font-medium">{rule.label}</p>
                              <p className="text-[11px] text-muted-foreground">{rule.desc}</p>
                            </div>
                            <Switch className="scale-90" data-testid={`switch-conditional-${rule.field}`} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="platform" className="mt-4 space-y-4">
                  <Card className="border-slate-200/60">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Globe className="h-4 w-4 text-indigo-500" /> App vs Web Access Control
                      </CardTitle>
                      <CardDescription className="text-xs">Configure platform-specific access for each module and submenu</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(MODULE_STRUCTURE).map(([modKey, mod]) => {
                          const ModIcon = mod.icon;
                          return (
                            <Card key={modKey} className="border-slate-200/60" data-testid={`card-platform-${modKey}`}>
                              <div
                                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50/50"
                                onClick={() => toggleModule(modKey)}
                              >
                                <div className="flex items-center gap-2">
                                  {expandedModules.has(modKey) ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                  <ModIcon className="h-4 w-4 text-indigo-500" />
                                  <span className="font-semibold text-sm">{mod.label}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1.5">
                                    <Monitor className="h-3.5 w-3.5 text-blue-500" />
                                    <span className="text-[10px] font-medium">Web</span>
                                    <Switch
                                      checked={getPermValue(modKey, null, "webAccess")}
                                      onCheckedChange={(v) => {
                                        const subs = mod.submenus;
                                        subs.forEach(sub => updatePermission(modKey, sub, "webAccess", v));
                                        updatePermission(modKey, null, "webAccess", v);
                                      }}
                                      className="scale-75"
                                      data-testid={`switch-web-${modKey}`}
                                    />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Smartphone className="h-3.5 w-3.5 text-emerald-500" />
                                    <span className="text-[10px] font-medium">App</span>
                                    <Switch
                                      checked={getPermValue(modKey, null, "appAccess")}
                                      onCheckedChange={(v) => {
                                        const subs = mod.submenus;
                                        subs.forEach(sub => updatePermission(modKey, sub, "appAccess", v));
                                        updatePermission(modKey, null, "appAccess", v);
                                      }}
                                      className="scale-75"
                                      data-testid={`switch-app-${modKey}`}
                                    />
                                  </div>
                                </div>
                              </div>
                              {expandedModules.has(modKey) && (
                                <div className="border-t border-slate-100 divide-y divide-slate-50">
                                  {mod.submenus.map((sub, si) => {
                                    const webOn = getPermValue(modKey, sub, "webAccess");
                                    const appOn = getPermValue(modKey, sub, "appAccess");
                                    let platformLabel = "Disabled";
                                    let platformColor = "text-red-500";
                                    if (webOn && appOn) { platformLabel = "Both"; platformColor = "text-green-500"; }
                                    else if (webOn) { platformLabel = "Web Only"; platformColor = "text-blue-500"; }
                                    else if (appOn) { platformLabel = "App Only"; platformColor = "text-emerald-500"; }
                                    return (
                                      <div key={sub} className={`grid grid-cols-[1fr,120px,120px,80px] items-center px-4 py-2.5 ${si % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                                        <span className="text-sm pl-4">{sub}</span>
                                        <div className="flex items-center gap-1.5 justify-center">
                                          <Monitor className="h-3 w-3 text-blue-400" />
                                          <Switch
                                            checked={webOn}
                                            onCheckedChange={(v) => updatePermission(modKey, sub, "webAccess", v)}
                                            className="scale-75"
                                            data-testid={`switch-web-${modKey}-${sub}`}
                                          />
                                        </div>
                                        <div className="flex items-center gap-1.5 justify-center">
                                          <Smartphone className="h-3 w-3 text-emerald-400" />
                                          <Switch
                                            checked={appOn}
                                            onCheckedChange={(v) => updatePermission(modKey, sub, "appAccess", v)}
                                            className="scale-75"
                                            data-testid={`switch-app-${modKey}-${sub}`}
                                          />
                                        </div>
                                        <Badge variant="outline" className={`text-[10px] justify-center ${platformColor}`}>
                                          {platformLabel}
                                        </Badge>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="summary" className="mt-4 space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <Card className="border-slate-200/60" data-testid="card-summary-total">
                      <CardContent className="p-4 text-center">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{permissionSummary.totalGranted}</p>
                        <p className="text-xs text-muted-foreground">Total Permissions Granted</p>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200/60" data-testid="card-summary-highrisk">
                      <CardContent className="p-4 text-center">
                        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{permissionSummary.highRisk}</p>
                        <p className="text-xs text-muted-foreground">High-Risk Permissions</p>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200/60" data-testid="card-summary-financial">
                      <CardContent className="p-4 text-center">
                        <CreditCard className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{permissionSummary.financialAccess ? "Yes" : "No"}</p>
                        <p className="text-xs text-muted-foreground">Financial Access</p>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200/60" data-testid="card-summary-delete">
                      <CardContent className="p-4 text-center">
                        <Trash2 className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{permissionSummary.deleteRights}</p>
                        <p className="text-xs text-muted-foreground">Delete Rights Enabled</p>
                      </CardContent>
                    </Card>
                  </div>

                  {permissionSummary.highRisk > 5 && (
                    <Card className="border-amber-200 bg-amber-50/50" data-testid="card-warning-highrisk">
                      <CardContent className="p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm text-amber-700">High-Risk Permission Warning</p>
                          <p className="text-xs text-amber-600 mt-1">This role has {permissionSummary.highRisk} high-risk permissions (Delete + Approve). Review carefully before saving.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {permissionSummary.financialAccess && selectedRole && !["Admin", "Finance Manager"].includes(selectedRole.name) && (
                    <Card className="border-red-200 bg-red-50/50" data-testid="card-warning-financial">
                      <CardContent className="p-4 flex items-start gap-3">
                        <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm text-red-700">Financial Access Alert</p>
                          <p className="text-xs text-red-600 mt-1">Financial module access granted to a non-finance role ({selectedRole.name}). Ensure this is intentional.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-slate-200/60" data-testid="card-module-summary">
                    <CardHeader>
                      <CardTitle className="text-sm">Module Access Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(MODULE_STRUCTURE).map(([modKey, mod]) => {
                          const access = getModuleAccessLevel(modKey);
                          const AccessIcon = access.icon;
                          const ModIcon = mod.icon;
                          const webOn = getPermValue(modKey, null, "webAccess");
                          const appOn = getPermValue(modKey, null, "appAccess");
                          return (
                            <div key={modKey} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/30">
                              <div className="flex items-center gap-2">
                                <ModIcon className="h-4 w-4 text-indigo-500" />
                                <span className="text-sm font-medium">{mod.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {webOn && <Badge variant="outline" className="text-[9px] text-blue-500"><Monitor className="h-2.5 w-2.5 mr-0.5" />Web</Badge>}
                                {appOn && <Badge variant="outline" className="text-[9px] text-emerald-500"><Smartphone className="h-2.5 w-2.5 mr-0.5" />App</Badge>}
                                <Badge variant="outline" className={`text-[10px] ${access.color}`}>
                                  <AccessIcon className="h-3 w-3 mr-1" /> {access.level}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200/60" data-testid="card-permission-inheritance">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" /> Permission Inheritance Rules
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {[
                          { icon: ShieldCheck, text: "Admin role automatically receives full access to all modules", color: "text-green-500" },
                          { icon: ShieldX, text: "If a parent module is disabled, all its submenus are automatically disabled", color: "text-red-500" },
                          { icon: Lock, text: "System roles (Admin, Finance Manager, etc.) cannot be deleted — only permissions can be modified", color: "text-slate-500" },
                          { icon: AlertTriangle, text: "Conflicting permissions are resolved by the most restrictive rule", color: "text-amber-500" },
                          { icon: ShieldAlert, text: "Financial module access to non-finance roles triggers a compliance warning", color: "text-purple-500" },
                        ].map((rule, i) => {
                          const RIcon = rule.icon;
                          return (
                            <div key={i} className="flex items-start gap-2 p-2 rounded bg-slate-50/50">
                              <RIcon className={`h-4 w-4 ${rule.color} shrink-0 mt-0.5`} />
                              <span className="text-muted-foreground">{rule.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>Add a custom role with specific permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Role Name</Label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g., Regional Manager"
                data-testid="input-new-role-name"
              />
            </div>
            <div>
              <Label className="text-sm">Description</Label>
              <Textarea
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                placeholder="Describe the role's responsibilities..."
                rows={2}
                data-testid="input-new-role-desc"
              />
            </div>
            <div>
              <Label className="text-sm flex items-center gap-1.5 mb-1.5">
                <Zap className="h-3.5 w-3.5 text-indigo-500" /> Start from a Permission Template (optional)
              </Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="h-9" data-testid="select-create-template">
                  <SelectValue placeholder="No template — start blank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template — start blank</SelectItem>
                  {Object.entries(ROLE_TEMPLATES).map(([key, t]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span className="font-medium">{t.label}</span>
                        <span className="text-[11px] text-muted-foreground">{t.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && selectedTemplate !== "none" && (
                <p className="text-[11px] text-indigo-600 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {ROLE_TEMPLATES[selectedTemplate]?.description}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); setSelectedTemplate(""); }}>Cancel</Button>
            <Button
              onClick={() => {
                createRoleMutation.mutate({ name: newRoleName, description: newRoleDesc });
              }}
              disabled={!newRoleName.trim() || createRoleMutation.isPending}
              data-testid="button-confirm-create"
            >
              {createRoleMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role name and description</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Role Name</Label>
              <Input
                value={editRoleName}
                onChange={(e) => setEditRoleName(e.target.value)}
                data-testid="input-edit-role-name"
              />
            </div>
            <div>
              <Label className="text-sm">Description</Label>
              <Textarea
                value={editRoleDesc}
                onChange={(e) => setEditRoleDesc(e.target.value)}
                rows={3}
                data-testid="input-edit-role-desc"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button
              onClick={() => selectedRoleId && updateRoleMutation.mutate({ id: selectedRoleId, data: { name: editRoleName, description: editRoleDesc } })}
              disabled={!editRoleName.trim() || updateRoleMutation.isPending}
              data-testid="button-confirm-edit"
            >
              {updateRoleMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-indigo-500" /> Compare Role Permissions
            </DialogTitle>
            <DialogDescription>
              Comparing <span className="font-semibold text-foreground">{selectedRole?.name}</span> against another role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200">
                <p className="text-xs text-muted-foreground">Role A (current)</p>
                <p className="font-semibold text-sm">{selectedRole?.name}</p>
              </div>
              <GitCompare className="h-5 w-5 text-slate-400 shrink-0" />
              <div className="flex-1">
                <Select value={compareRoleId?.toString() || ""} onValueChange={(v) => setCompareRoleId(Number(v))}>
                  <SelectTrigger className="h-9" data-testid="select-compare-role">
                    <SelectValue placeholder="Select Role B to compare..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.filter(r => r.id !== selectedRoleId).map(r => (
                      <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {compareRoleId && (
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-[180px,1fr,1fr] bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                  <div className="px-3 py-2 border-r">Module / Submenu</div>
                  <div className="px-3 py-2 border-r text-indigo-600">{selectedRole?.name}</div>
                  <div className="px-3 py-2 text-emerald-600">{roles.find(r => r.id === compareRoleId)?.name}</div>
                </div>
                {Object.entries(MODULE_STRUCTURE).map(([modKey, mod]) => {
                  const ModIcon = mod.icon;
                  return (
                    <div key={modKey}>
                      <div className="grid grid-cols-[180px,1fr,1fr] bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-200">
                        <div className="px-3 py-2 flex items-center gap-1.5 border-r font-semibold text-xs">
                          <ModIcon className="h-3.5 w-3.5 text-indigo-500" />
                          {mod.label}
                        </div>
                        <div className="px-3 py-2 border-r">
                          <div className="flex flex-wrap gap-1">
                            {PERMISSION_ACTIONS.map(a => {
                              const on = getPermValue(modKey, null, a.key);
                              const AIcon = a.icon;
                              return on ? <AIcon key={a.key} className={`h-3 w-3 ${a.color}`} /> : null;
                            })}
                          </div>
                        </div>
                        <div className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {PERMISSION_ACTIONS.map(a => {
                              const on = getCompareValue(modKey, null, a.key);
                              const AIcon = a.icon;
                              return on ? <AIcon key={a.key} className={`h-3 w-3 ${a.color}`} /> : null;
                            })}
                          </div>
                        </div>
                      </div>
                      {mod.submenus.map((sub, si) => {
                        const aPerms = PERMISSION_ACTIONS.map(a => getPermValue(modKey, sub, a.key));
                        const bPerms = PERMISSION_ACTIONS.map(a => getCompareValue(modKey, sub, a.key));
                        const hasDiff = aPerms.some((v, i) => v !== bPerms[i]);
                        return (
                          <div
                            key={sub}
                            className={`grid grid-cols-[180px,1fr,1fr] border-t border-slate-100 ${hasDiff ? "bg-amber-50/40" : si % 2 === 0 ? "" : "bg-slate-50/20"}`}
                          >
                            <div className="px-3 py-1.5 border-r text-[11px] text-muted-foreground pl-6 flex items-center gap-1">
                              {hasDiff && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />}
                              {sub}
                            </div>
                            <div className="px-3 py-1.5 border-r">
                              <div className="flex flex-wrap gap-1">
                                {PERMISSION_ACTIONS.map((a, i) => {
                                  const on = aPerms[i];
                                  const AIcon = a.icon;
                                  return (
                                    <span key={a.key} className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] ${on ? `${a.color} bg-slate-100` : "text-slate-300"}`}>
                                      <AIcon className="h-2.5 w-2.5" />
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="px-3 py-1.5">
                              <div className="flex flex-wrap gap-1">
                                {PERMISSION_ACTIONS.map((a, i) => {
                                  const on = bPerms[i];
                                  const AIcon = a.icon;
                                  return (
                                    <span key={a.key} className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] ${on ? `${a.color} bg-slate-100` : "text-slate-300"}`}>
                                      <AIcon className="h-2.5 w-2.5" />
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {!compareRoleId && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <GitCompare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                Select a role above to see the side-by-side comparison
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompareDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
