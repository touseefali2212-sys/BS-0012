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
  Bell, BarChart3, CreditCard, UserCog, Boxes, Loader2, Info
} from "lucide-react";

const MODULE_STRUCTURE: Record<string, { icon: any; label: string; submenus: string[] }> = {
  dashboard: { icon: LayoutGrid, label: "Dashboard", submenus: ["Overview", "Analytics", "Quick Actions", "Widgets"] },
  inventory: { icon: Package, label: "Inventory", submenus: ["Product Types", "Suppliers", "Brands & Products", "Purchase Orders", "Stock Management", "Inventory List", "Batch & Serial", "Sales"] },
  sales: { icon: ShoppingCart, label: "Sales", submenus: ["Invoices", "Quotations", "Credit Notes", "Customers", "Payment Collection", "Discounts"] },
  purchase: { icon: CreditCard, label: "Purchase Orders", submenus: ["Create PO", "PO List", "PO Approvals", "Vendor Management", "Receiving"] },
  assets: { icon: Boxes, label: "Assets", submenus: ["Asset Register", "Asset Tracking", "Depreciation", "Asset Transfer", "Maintenance"] },
  outages: { icon: Wrench, label: "Service Outages", submenus: ["Active Outages", "Outage History", "SLA Tracking", "Escalation", "Resolution"] },
  crm: { icon: Users, label: "CRM", submenus: ["Customers", "Leads", "Tickets", "Customer Portal", "Communication"] },
  hrm: { icon: UserCog, label: "HRM", submenus: ["Employees", "Attendance", "Leaves", "Payroll", "Advances", "Departments", "Designations"] },
  notifications: { icon: Bell, label: "Notifications", submenus: ["Alert Templates", "Push Notifications", "Bulk Campaigns", "SMS & Email API"] },
  reports: { icon: BarChart3, label: "Reports", submenus: ["Financial Reports", "Inventory Reports", "Sales Reports", "HR Reports", "Custom Reports"] },
  settings: { icon: Settings, label: "Settings", submenus: ["General", "Company", "Billing", "HRM Rights", "Customer Rights", "User Management"] },
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

  const { data: roles = [], isLoading: rolesLoading } = useQuery<HrmRole[]>({
    queryKey: ["/api/hrm-roles"],
  });

  const { data: permissions = [], isLoading: permsLoading } = useQuery<HrmPermission[]>({
    queryKey: ["/api/hrm-permissions", selectedRoleId],
    enabled: !!selectedRoleId,
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
      toast({ title: "Default roles created", description: "8 system roles initialized successfully" });
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await apiRequest("POST", "/api/hrm-roles", data);
      return res.json();
    },
    onSuccess: (role: HrmRole) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hrm-roles"] });
      setSelectedRoleId(role.id);
      setShowCreateDialog(false);
      setNewRoleName("");
      setNewRoleDesc("");
      toast({ title: "Role created", description: `${role.name} has been created` });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/hrm-roles/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hrm-roles"] });
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
    Object.keys(localPermissions).forEach(mod => {
      Object.keys(localPermissions[mod]).forEach(key => {
        const p = localPermissions[mod][key];
        allPerms.push({
          module: mod,
          submenu: key === "__module__" ? null : key,
          canView: getPermValue(mod, key === "__module__" ? null : key, "canView"),
          canCreate: getPermValue(mod, key === "__module__" ? null : key, "canCreate"),
          canEdit: getPermValue(mod, key === "__module__" ? null : key, "canEdit"),
          canDelete: getPermValue(mod, key === "__module__" ? null : key, "canDelete"),
          canApprove: getPermValue(mod, key === "__module__" ? null : key, "canApprove"),
          canExport: getPermValue(mod, key === "__module__" ? null : key, "canExport"),
          canPrint: getPermValue(mod, key === "__module__" ? null : key, "canPrint"),
          webAccess: getPermValue(mod, key === "__module__" ? null : key, "webAccess"),
          appAccess: getPermValue(mod, key === "__module__" ? null : key, "appAccess"),
          dataScope: (p as any)?.dataScope || getDataScope(mod, key === "__module__" ? null : key),
          conditions: (p as any)?.conditions || null,
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
        if ((mod === "sales" || mod === "purchase") && (p?.canEdit || p?.canDelete || p?.canApprove)) {
          financialAccess = true;
        }
      });
    });

    return { totalGranted, highRisk, financialAccess, deleteRights };
  }, [permissionMap]);

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

                <TabsContent value="matrix" className="mt-4 space-y-2">
                  {Object.entries(MODULE_STRUCTURE).map(([modKey, mod]) => {
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
                            {mod.submenus.map((sub, si) => (
                              <div
                                key={sub}
                                className={`grid grid-cols-[1fr,repeat(7,48px)] items-center px-4 py-2.5 ${si % 2 === 0 ? "bg-white" : "bg-slate-50/40"} hover:bg-indigo-50/30 transition-colors`}
                                data-testid={`row-submenu-${modKey}-${si}`}
                              >
                                <span className="text-sm pl-2">{sub}</span>
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
                            ))}
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
        <DialogContent>
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
                rows={3}
                data-testid="input-new-role-desc"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createRoleMutation.mutate({ name: newRoleName, description: newRoleDesc })}
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
    </div>
  );
}
