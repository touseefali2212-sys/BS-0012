import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Shield,
  Users,
  Briefcase,
  UserCheck,
  HardHat,
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  CheckCircle,
  XCircle,
  Settings,
  Copy,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";

const roleLevelLabels: Record<string, string> = {
  level_1: "Level 1 – Admin",
  level_2: "Level 2 – Manager",
  level_3: "Level 3 – Supervisor",
  level_4: "Level 4 – Executive",
  level_5: "Level 5 – Field Staff",
};

const roleLevelColors: Record<string, string> = {
  level_1: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  level_2: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  level_3: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  level_4: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
  level_5: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
};

const deptColors: Record<string, string> = {
  engineering: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  support: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
  sales: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  finance: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  admin: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  management: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  hr: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
  it: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
  operations: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  inactive: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
};

const categoryLabels: Record<string, string> = {
  full_time: "Full-Time",
  part_time: "Part-Time",
  contract: "Contract",
  temporary: "Temporary",
};

const salaryStructureLabels: Record<string, string> = {
  fixed: "Fixed Salary",
  hourly: "Hourly",
  commission_based: "Commission-Based",
  hybrid: "Hybrid",
};

const permissionModules = [
  {
    name: "HR Module",
    key: "hr",
    perms: [
      { key: "hr_view_employees", label: "View Employees" },
      { key: "hr_edit_employees", label: "Edit Employees" },
      { key: "hr_process_payroll", label: "Process Payroll" },
      { key: "hr_approve_salary", label: "Approve Salary" },
    ],
  },
  {
    name: "Finance Module",
    key: "finance",
    perms: [
      { key: "fin_view_accounts", label: "View Accounts" },
      { key: "fin_approve_expenses", label: "Approve Expenses" },
      { key: "fin_manage_commission", label: "Manage Commission" },
    ],
  },
  {
    name: "ISP Billing",
    key: "billing",
    perms: [
      { key: "bill_create_customer", label: "Create Customer" },
      { key: "bill_manage_packages", label: "Manage Packages" },
      { key: "bill_suspend_connection", label: "Suspend Connection" },
    ],
  },
  {
    name: "Vendor Module",
    key: "vendor",
    perms: [
      { key: "vendor_view", label: "View Vendors" },
      { key: "vendor_manage", label: "Manage Vendors" },
    ],
  },
  {
    name: "Reseller Module",
    key: "reseller",
    perms: [
      { key: "reseller_view", label: "View Resellers" },
      { key: "reseller_approve_commission", label: "Approve Commission" },
    ],
  },
  {
    name: "Reports",
    key: "reports",
    perms: [
      { key: "reports_view_financial", label: "View Financial Reports" },
      { key: "reports_export", label: "Export Reports" },
    ],
  },
];

export default function EmployeeTypesRolesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("types");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");

  const [typeDialog, setTypeDialog] = useState(false);
  const [editTypeDialog, setEditTypeDialog] = useState(false);
  const [roleDialog, setRoleDialog] = useState(false);
  const [editRoleDialog, setEditRoleDialog] = useState(false);
  const [viewRoleDialog, setViewRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<any>(null);

  const [typeName, setTypeName] = useState("");
  const [typeCategory, setTypeCategory] = useState("full_time");
  const [typeHours, setTypeHours] = useState("8");
  const [typeSalaryStructure, setTypeSalaryStructure] = useState("fixed");
  const [typeBonus, setTypeBonus] = useState(true);
  const [typeCommission, setTypeCommission] = useState(false);
  const [typeOvertime, setTypeOvertime] = useState(true);
  const [typeProbation, setTypeProbation] = useState("0");
  const [typeLeavePolicy, setTypeLeavePolicy] = useState("");
  const [typeDescription, setTypeDescription] = useState("");
  const [typeStatus, setTypeStatus] = useState("active");

  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleDept, setRoleDept] = useState("");
  const [roleReportsTo, setRoleReportsTo] = useState("");
  const [roleBranch, setRoleBranch] = useState("");
  const [roleLevel, setRoleLevel] = useState("level_4");
  const [roleSalaryGrade, setRoleSalaryGrade] = useState("");
  const [roleCommissionEligible, setRoleCommissionEligible] = useState(false);
  const [roleIncentiveTarget, setRoleIncentiveTarget] = useState(false);
  const [roleDefaultAllowances, setRoleDefaultAllowances] = useState("");
  const [roleDefaultDeductions, setRoleDefaultDeductions] = useState("");
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});
  const [roleStatus, setRoleStatus] = useState("active");

  const { data: types = [], isLoading: typesLoading } = useQuery<any[]>({
    queryKey: ["/api/employee-types"],
  });

  const { data: rolesData = [], isLoading: rolesLoading } = useQuery<any[]>({
    queryKey: ["/api/roles"],
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  const createTypeMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/employee-types", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-types"] });
      toast({ title: "Created", description: "Employee type created successfully" });
      setTypeDialog(false);
      resetTypeForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => await apiRequest("PATCH", `/api/employee-types/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-types"] });
      toast({ title: "Updated", description: "Employee type updated" });
      setEditTypeDialog(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: number) => await apiRequest("DELETE", `/api/employee-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-types"] });
      toast({ title: "Deleted", description: "Employee type deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/roles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({ title: "Created", description: "Role created successfully" });
      setRoleDialog(false);
      resetRoleForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => await apiRequest("PATCH", `/api/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({ title: "Updated", description: "Role updated" });
      setEditRoleDialog(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => await apiRequest("DELETE", `/api/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({ title: "Deleted", description: "Role deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function resetTypeForm() {
    setTypeName(""); setTypeCategory("full_time"); setTypeHours("8"); setTypeSalaryStructure("fixed");
    setTypeBonus(true); setTypeCommission(false); setTypeOvertime(true); setTypeProbation("0");
    setTypeLeavePolicy(""); setTypeDescription(""); setTypeStatus("active");
  }

  function resetRoleForm() {
    setRoleName(""); setRoleDescription(""); setRoleDept(""); setRoleReportsTo(""); setRoleBranch("");
    setRoleLevel("level_4"); setRoleSalaryGrade(""); setRoleCommissionEligible(false); setRoleIncentiveTarget(false);
    setRoleDefaultAllowances(""); setRoleDefaultDeductions(""); setRolePermissions({}); setRoleStatus("active");
  }

  function handleSubmitType() {
    if (!typeName.trim()) { toast({ title: "Error", description: "Type name is required", variant: "destructive" }); return; }
    createTypeMutation.mutate({
      name: typeName, category: typeCategory, defaultWorkingHours: typeHours, salaryStructure: typeSalaryStructure,
      eligibleForBonus: typeBonus, eligibleForCommission: typeCommission, eligibleForOvertime: typeOvertime,
      probationPeriodDays: parseInt(typeProbation) || 0, leavePolicy: typeLeavePolicy || null,
      description: typeDescription || null, status: typeStatus,
    });
  }

  function handleUpdateType() {
    if (!selectedType) return;
    updateTypeMutation.mutate({
      id: selectedType.id, data: {
        name: typeName, category: typeCategory, defaultWorkingHours: typeHours, salaryStructure: typeSalaryStructure,
        eligibleForBonus: typeBonus, eligibleForCommission: typeCommission, eligibleForOvertime: typeOvertime,
        probationPeriodDays: parseInt(typeProbation) || 0, leavePolicy: typeLeavePolicy || null,
        description: typeDescription || null, status: typeStatus,
      },
    });
  }

  function openEditType(t: any) {
    setSelectedType(t); setTypeName(t.name); setTypeCategory(t.category); setTypeHours(t.defaultWorkingHours || "8");
    setTypeSalaryStructure(t.salaryStructure); setTypeBonus(t.eligibleForBonus); setTypeCommission(t.eligibleForCommission);
    setTypeOvertime(t.eligibleForOvertime); setTypeProbation(String(t.probationPeriodDays || 0));
    setTypeLeavePolicy(t.leavePolicy || ""); setTypeDescription(t.description || ""); setTypeStatus(t.status);
    setEditTypeDialog(true);
  }

  function handleSubmitRole() {
    if (!roleName.trim()) { toast({ title: "Error", description: "Role name is required", variant: "destructive" }); return; }
    const perms = Object.entries(rolePermissions).filter(([, v]) => v).map(([k]) => k).join(",");
    createRoleMutation.mutate({
      name: roleName, description: roleDescription || null, department: roleDept || null, reportsTo: roleReportsTo || null,
      branch: roleBranch || null, roleLevel, salaryGrade: roleSalaryGrade || null,
      commissionEligible: roleCommissionEligible, incentiveTarget: roleIncentiveTarget,
      defaultAllowances: roleDefaultAllowances || null, defaultDeductions: roleDefaultDeductions || null,
      permissions: perms || null, status: roleStatus,
    });
  }

  function handleUpdateRole() {
    if (!selectedRole) return;
    const perms = Object.entries(rolePermissions).filter(([, v]) => v).map(([k]) => k).join(",");
    updateRoleMutation.mutate({
      id: selectedRole.id, data: {
        name: roleName, description: roleDescription || null, department: roleDept || null, reportsTo: roleReportsTo || null,
        branch: roleBranch || null, roleLevel, salaryGrade: roleSalaryGrade || null,
        commissionEligible: roleCommissionEligible, incentiveTarget: roleIncentiveTarget,
        defaultAllowances: roleDefaultAllowances || null, defaultDeductions: roleDefaultDeductions || null,
        permissions: perms || null, status: roleStatus,
      },
    });
  }

  function openEditRole(r: any) {
    setSelectedRole(r); setRoleName(r.name); setRoleDescription(r.description || ""); setRoleDept(r.department || "");
    setRoleReportsTo(r.reportsTo || ""); setRoleBranch(r.branch || ""); setRoleLevel(r.roleLevel || "level_4");
    setRoleSalaryGrade(r.salaryGrade || ""); setRoleCommissionEligible(r.commissionEligible || false);
    setRoleIncentiveTarget(r.incentiveTarget || false); setRoleDefaultAllowances(r.defaultAllowances || "");
    setRoleDefaultDeductions(r.defaultDeductions || ""); setRoleStatus(r.status);
    const permMap: Record<string, boolean> = {};
    (r.permissions || "").split(",").filter(Boolean).forEach((p: string) => { permMap[p] = true; });
    setRolePermissions(permMap);
    setEditRoleDialog(true);
  }

  function cloneRole(r: any) {
    resetRoleForm();
    setRoleName(`${r.name} (Copy)`); setRoleDescription(r.description || ""); setRoleDept(r.department || "");
    setRoleReportsTo(r.reportsTo || ""); setRoleBranch(r.branch || ""); setRoleLevel(r.roleLevel || "level_4");
    setRoleSalaryGrade(r.salaryGrade || ""); setRoleCommissionEligible(r.commissionEligible || false);
    setRoleIncentiveTarget(r.incentiveTarget || false); setRoleDefaultAllowances(r.defaultAllowances || "");
    setRoleDefaultDeductions(r.defaultDeductions || "");
    const permMap: Record<string, boolean> = {};
    (r.permissions || "").split(",").filter(Boolean).forEach((p: string) => { permMap[p] = true; });
    setRolePermissions(permMap);
    setRoleDialog(true);
  }

  const totalTypes = types.length;
  const activeRoles = rolesData.filter((r: any) => r.status === "active").length;
  const mgmtRoles = rolesData.filter((r: any) => r.roleLevel === "level_1" || r.roleLevel === "level_2").length;
  const fieldStaff = rolesData.filter((r: any) => r.roleLevel === "level_5").length;
  const contractTypes = types.filter((t: any) => t.category === "contract").length;

  const filteredRoles = useMemo(() => {
    let result = rolesData;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r: any) => r.name?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
    }
    if (filterStatus !== "all") result = result.filter((r: any) => r.status === filterStatus);
    if (filterDept !== "all") result = result.filter((r: any) => r.department === filterDept);
    if (filterLevel !== "all") result = result.filter((r: any) => r.roleLevel === filterLevel);
    return result;
  }, [rolesData, searchQuery, filterStatus, filterDept, filterLevel]);

  const filteredTypes = useMemo(() => {
    let result = types;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t: any) => t.name?.toLowerCase().includes(q));
    }
    if (filterStatus !== "all") result = result.filter((t: any) => t.status === filterStatus);
    return result;
  }, [types, searchQuery, filterStatus]);

  const empCountByDept = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((e: any) => { const d = e.department || "other"; map[d] = (map[d] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [employees]);

  const empCountByType = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((e: any) => { const t = e.employmentType || "full_time"; map[t] = (map[t] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [employees]);

  const hierarchyTree = useMemo(() => {
    const sorted = [...rolesData].sort((a: any, b: any) => {
      const lvlA = parseInt(a.roleLevel?.replace("level_", "") || "5");
      const lvlB = parseInt(b.roleLevel?.replace("level_", "") || "5");
      return lvlA - lvlB;
    });
    return sorted;
  }, [rolesData]);

  if (typesLoading || rolesLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const typeFormFields = (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Type Name</label>
        <Input value={typeName} onChange={e => setTypeName(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. Permanent, Contract" data-testid="input-type-name" />
      </div>
      <div>
        <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Employment Category</label>
        <Select value={typeCategory} onValueChange={setTypeCategory}>
          <SelectTrigger className="h-9 text-[13px]" data-testid="select-type-category"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="full_time">Full-Time</SelectItem>
            <SelectItem value="part_time">Part-Time</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="temporary">Temporary</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Default Working Hours</label>
        <Input type="number" value={typeHours} onChange={e => setTypeHours(e.target.value)} className="h-9 text-[13px]" data-testid="input-type-hours" />
      </div>
      <div>
        <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Salary Structure</label>
        <Select value={typeSalaryStructure} onValueChange={setTypeSalaryStructure}>
          <SelectTrigger className="h-9 text-[13px]" data-testid="select-salary-structure"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Fixed Salary</SelectItem>
            <SelectItem value="hourly">Hourly</SelectItem>
            <SelectItem value="commission_based">Commission-Based</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Probation Period (days)</label>
        <Input type="number" value={typeProbation} onChange={e => setTypeProbation(e.target.value)} className="h-9 text-[13px]" data-testid="input-probation" />
      </div>
      <div>
        <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Status</label>
        <Select value={typeStatus} onValueChange={setTypeStatus}>
          <SelectTrigger className="h-9 text-[13px]" data-testid="select-type-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Leave Policy</label>
        <Input value={typeLeavePolicy} onChange={e => setTypeLeavePolicy(e.target.value)} className="h-9 text-[13px]" placeholder="Standard, Extended" data-testid="input-leave-policy" />
      </div>
      <div className="col-span-2 grid grid-cols-3 gap-4 bg-muted/30 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-medium text-muted-foreground">Eligible for Bonus</label>
          <Switch checked={typeBonus} onCheckedChange={setTypeBonus} data-testid="switch-bonus" />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-medium text-muted-foreground">Eligible for Commission</label>
          <Switch checked={typeCommission} onCheckedChange={setTypeCommission} data-testid="switch-commission" />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-medium text-muted-foreground">Eligible for Overtime</label>
          <Switch checked={typeOvertime} onCheckedChange={setTypeOvertime} data-testid="switch-overtime" />
        </div>
      </div>
      <div className="col-span-2">
        <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Description</label>
        <Textarea value={typeDescription} onChange={e => setTypeDescription(e.target.value)} className="text-[13px] min-h-[60px]" placeholder="Description..." data-testid="input-type-description" />
      </div>
    </div>
  );

  const roleFormFields = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Role Information</p>
        </div>
        <div className="col-span-2">
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Role Name</label>
          <Input value={roleName} onChange={e => setRoleName(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. HR Manager, Network Engineer" data-testid="input-role-name" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Department</label>
          <Select value={roleDept} onValueChange={setRoleDept}>
            <SelectTrigger className="h-9 text-[13px]" data-testid="select-role-dept"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {["engineering", "support", "sales", "finance", "admin", "management", "hr", "it", "operations"].map(d => (
                <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Role Level</label>
          <Select value={roleLevel} onValueChange={setRoleLevel}>
            <SelectTrigger className="h-9 text-[13px]" data-testid="select-role-level"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(roleLevelLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Reports To</label>
          <Input value={roleReportsTo} onChange={e => setRoleReportsTo(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. CEO, HR Manager" data-testid="input-reports-to" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Branch</label>
          <Input value={roleBranch} onChange={e => setRoleBranch(e.target.value)} className="h-9 text-[13px]" placeholder="Main Office" data-testid="input-branch" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Status</label>
          <Select value={roleStatus} onValueChange={setRoleStatus}>
            <SelectTrigger className="h-9 text-[13px]" data-testid="select-role-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Salary Grade</label>
          <Input value={roleSalaryGrade} onChange={e => setRoleSalaryGrade(e.target.value)} className="h-9 text-[13px]" placeholder="Grade A, B, C" data-testid="input-salary-grade" />
        </div>
        <div className="col-span-2">
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Description</label>
          <Textarea value={roleDescription} onChange={e => setRoleDescription(e.target.value)} className="text-[13px] min-h-[50px]" placeholder="Role description..." data-testid="input-role-description" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-medium text-muted-foreground">Commission Eligible</label>
          <Switch checked={roleCommissionEligible} onCheckedChange={setRoleCommissionEligible} data-testid="switch-role-commission" />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-medium text-muted-foreground">Incentive Target</label>
          <Switch checked={roleIncentiveTarget} onCheckedChange={setRoleIncentiveTarget} data-testid="switch-role-incentive" />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Module Permissions</p>
        <div className="space-y-3">
          {permissionModules.map(mod => (
            <div key={mod.key} className="bg-muted/30 rounded-xl p-3">
              <p className="text-[12px] font-bold text-foreground mb-2">{mod.name}</p>
              <div className="grid grid-cols-2 gap-2">
                {mod.perms.map(p => (
                  <label key={p.key} className="flex items-center gap-2 text-[12px] text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rolePermissions[p.key] || false}
                      onChange={e => setRolePermissions(prev => ({ ...prev, [p.key]: e.target.checked }))}
                      className="rounded border-border"
                      data-testid={`checkbox-perm-${p.key}`}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Default Allowances</label>
          <Input value={roleDefaultAllowances} onChange={e => setRoleDefaultAllowances(e.target.value)} className="h-9 text-[13px]" placeholder="Transport, Meal" data-testid="input-allowances" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Default Deductions</label>
          <Input value={roleDefaultDeductions} onChange={e => setRoleDefaultDeductions(e.target.value)} className="h-9 text-[13px]" placeholder="Tax, Insurance" data-testid="input-deductions" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground" data-testid="text-page-title">Employee Types & Roles</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Manage employment categories, organizational roles & permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-[11px]" data-testid="button-export">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Employee Types", value: totalTypes, icon: Briefcase, color: "blue" },
          { label: "Active Roles", value: activeRoles, icon: Shield, color: "teal" },
          { label: "Management Roles", value: mgmtRoles, icon: UserCheck, color: "purple" },
          { label: "Field Staff", value: fieldStaff, icon: HardHat, color: "green" },
          { label: "Contract Types", value: contractTypes, icon: FileText, color: "orange" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="enterprise-card" data-testid={`card-${card.label.toLowerCase().replace(/\s/g, "-")}`}>
              <CardContent className="py-3.5 px-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                    <p className={`text-2xl font-bold mt-1 text-${card.color}-600 dark:text-${card.color}-400`}>{card.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-xl bg-${card.color}-100 dark:bg-${card.color}-950/50 flex items-center justify-center`}>
                    <card.icon className={`h-5 w-5 text-${card.color}-600 dark:text-${card.color}-400`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="types" className="text-[12px] gap-1.5" data-testid="tab-types">
            <Briefcase className="h-3.5 w-3.5" /> Employee Types
          </TabsTrigger>
          <TabsTrigger value="roles" className="text-[12px] gap-1.5" data-testid="tab-roles">
            <Shield className="h-3.5 w-3.5" /> Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="hierarchy" className="text-[12px] gap-1.5" data-testid="tab-hierarchy">
            <Users className="h-3.5 w-3.5" /> Org Hierarchy
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-[12px] gap-1.5" data-testid="tab-analytics">
            <Settings className="h-3.5 w-3.5" /> Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="mt-4 space-y-3">
          <Card className="enterprise-card">
            <CardContent className="py-3 px-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  className="gap-1.5 text-[11px] bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white border-0"
                  onClick={() => { resetTypeForm(); setTypeDialog(true); }}
                  data-testid="button-add-type"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Employee Type
                </Button>
                <div className="flex-1" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 text-[13px] w-[120px]" data-testid="select-filter-status-types"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-9 text-[13px] pl-8 w-[180px]" placeholder="Search types..." data-testid="input-search-types" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="enterprise-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                    <th className="text-left py-2.5 px-3 font-semibold">#</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Type Name</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Category</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Hours</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Salary Structure</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Bonus</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Commission</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Overtime</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Status</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTypes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Briefcase className="h-8 w-8 text-muted-foreground/40" />
                          <p className="text-[13px] font-medium">No employee types configured</p>
                          <p className="text-[11px]">Click "Add Employee Type" to create one</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTypes.map((t: any, idx: number) => (
                      <tr key={t.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "bg-background" : "bg-muted/10"}`} data-testid={`row-type-${t.id}`}>
                        <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-foreground">{t.name}</td>
                        <td className="py-2 px-3">
                          <Badge variant="secondary" className="text-[10px] font-medium border-0">{categoryLabels[t.category] || t.category}</Badge>
                        </td>
                        <td className="py-2 px-3 text-center text-muted-foreground">{t.defaultWorkingHours}h</td>
                        <td className="py-2 px-3">
                          <Badge variant="secondary" className="text-[10px] font-medium border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">{salaryStructureLabels[t.salaryStructure] || t.salaryStructure}</Badge>
                        </td>
                        <td className="py-2 px-3 text-center">{t.eligibleForBonus ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-red-400 mx-auto" />}</td>
                        <td className="py-2 px-3 text-center">{t.eligibleForCommission ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-red-400 mx-auto" />}</td>
                        <td className="py-2 px-3 text-center">{t.eligibleForOvertime ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-red-400 mx-auto" />}</td>
                        <td className="py-2 px-3 text-center">
                          <Badge variant="secondary" className={`text-[10px] font-semibold border-0 capitalize ${statusColors[t.status]}`}>{t.status}</Badge>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="outline" size="sm" className="px-2 text-amber-600" onClick={() => openEditType(t)} data-testid={`button-edit-type-${t.id}`}><Edit className="h-3 w-3" /></Button>
                            <Button variant="outline" size="sm" className="px-2 text-red-600" onClick={() => { if (confirm("Delete this type?")) deleteTypeMutation.mutate(t.id); }} data-testid={`button-delete-type-${t.id}`}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4 space-y-3">
          <Card className="enterprise-card">
            <CardContent className="py-3 px-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  className="gap-1.5 text-[11px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0"
                  onClick={() => { resetRoleForm(); setRoleDialog(true); }}
                  data-testid="button-add-role"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Role
                </Button>
                <div className="flex-1" />
                <Select value={filterDept} onValueChange={setFilterDept}>
                  <SelectTrigger className="h-9 text-[13px] w-[130px]" data-testid="select-filter-dept"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Depts</SelectItem>
                    {["engineering", "support", "sales", "finance", "admin", "management", "hr", "it", "operations"].map(d => (
                      <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="h-9 text-[13px] w-[160px]" data-testid="select-filter-level"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {Object.entries(roleLevelLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 text-[13px] w-[120px]" data-testid="select-filter-status-roles"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-9 text-[13px] pl-8 w-[180px]" placeholder="Search roles..." data-testid="input-search-roles" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="enterprise-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                    <th className="text-left py-2.5 px-3 font-semibold">#</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Role Name</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Department</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Level</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Reports To</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Commission</th>
                    <th className="text-left py-2.5 px-3 font-semibold">Salary Grade</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Status</th>
                    <th className="text-center py-2.5 px-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Shield className="h-8 w-8 text-muted-foreground/40" />
                          <p className="text-[13px] font-medium">No roles configured</p>
                          <p className="text-[11px]">Click "Add Role" to create one</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRoles.map((r: any, idx: number) => (
                      <tr key={r.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "bg-background" : "bg-muted/10"}`} data-testid={`row-role-${r.id}`}>
                        <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div>
                            <p className="font-medium text-foreground">{r.name}</p>
                            {r.description && <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{r.description}</p>}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          {r.department ? (
                            <Badge variant="secondary" className={`text-[10px] font-medium border-0 ${deptColors[r.department] || deptColors.admin}`}>{r.department}</Badge>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-2 px-3">
                          <Badge variant="secondary" className={`text-[10px] font-medium border-0 ${roleLevelColors[r.roleLevel] || roleLevelColors.level_4}`}>
                            {roleLevelLabels[r.roleLevel] || r.roleLevel || "—"}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground text-[11px]">{r.reportsTo || "—"}</td>
                        <td className="py-2 px-3 text-center">{r.commissionEligible ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-red-400 mx-auto" />}</td>
                        <td className="py-2 px-3 text-muted-foreground text-[11px]">{r.salaryGrade || "—"}</td>
                        <td className="py-2 px-3 text-center">
                          <Badge variant="secondary" className={`text-[10px] font-semibold border-0 capitalize ${statusColors[r.status]}`}>{r.status}</Badge>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="outline" size="sm" className="px-2 text-blue-600" onClick={() => { setSelectedRole(r); setViewRoleDialog(true); }} data-testid={`button-view-role-${r.id}`}><Eye className="h-3 w-3" /></Button>
                            <Button variant="outline" size="sm" className="px-2 text-amber-600" onClick={() => openEditRole(r)} data-testid={`button-edit-role-${r.id}`}><Edit className="h-3 w-3" /></Button>
                            <Button variant="outline" size="sm" className="px-2 text-indigo-600" onClick={() => cloneRole(r)} data-testid={`button-clone-role-${r.id}`}><Copy className="h-3 w-3" /></Button>
                            {!r.isSystem && (
                              <Button variant="outline" size="sm" className="px-2 text-red-600" onClick={() => { if (confirm("Delete this role?")) deleteRoleMutation.mutate(r.id); }} data-testid={`button-delete-role-${r.id}`}><Trash2 className="h-3 w-3" /></Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchy" className="mt-4">
          <Card className="enterprise-card">
            <CardContent className="py-4 px-4">
              <p className="text-[13px] font-bold text-foreground mb-4">Organizational Hierarchy</p>
              {hierarchyTree.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-[13px]">No roles defined yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {hierarchyTree.map((r: any, idx: number) => {
                    const lvl = parseInt(r.roleLevel?.replace("level_", "") || "5");
                    const indent = (lvl - 1) * 24;
                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors group"
                        style={{ paddingLeft: `${indent + 12}px` }}
                        data-testid={`hierarchy-node-${r.id}`}
                      >
                        {lvl > 1 && (
                          <span className="text-muted-foreground/40">
                            <ChevronRightIcon className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white ${
                          lvl === 1 ? "bg-red-500" : lvl === 2 ? "bg-purple-500" : lvl === 3 ? "bg-blue-500" : lvl === 4 ? "bg-teal-500" : "bg-green-500"
                        }`}>
                          L{lvl}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-foreground">{r.name}</p>
                          <div className="flex items-center gap-2">
                            {r.department && (
                              <Badge variant="secondary" className={`text-[9px] font-medium border-0 ${deptColors[r.department] || deptColors.admin}`}>{r.department}</Badge>
                            )}
                            {r.reportsTo && <span className="text-[9px] text-muted-foreground">→ {r.reportsTo}</span>}
                          </div>
                        </div>
                        <Badge variant="secondary" className={`text-[9px] font-semibold border-0 capitalize ${statusColors[r.status]}`}>{r.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="enterprise-card">
              <CardContent className="py-4 px-4">
                <p className="text-[13px] font-bold text-foreground mb-3">Employees by Department</p>
                <div className="space-y-2">
                  {empCountByDept.map(([dept, count]) => {
                    const max = empCountByDept[0]?.[1] || 1;
                    const pct = (count / (max as number)) * 100;
                    return (
                      <div key={dept} className="flex items-center gap-3">
                        <Badge variant="secondary" className={`text-[10px] font-medium border-0 w-[90px] justify-center ${deptColors[dept] || deptColors.admin}`}>{dept}</Badge>
                        <div className="flex-1 h-5 bg-muted/50 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] font-bold tabular-nums text-foreground w-[30px] text-right">{count}</span>
                      </div>
                    );
                  })}
                  {empCountByDept.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">No data</p>}
                </div>
              </CardContent>
            </Card>
            <Card className="enterprise-card">
              <CardContent className="py-4 px-4">
                <p className="text-[13px] font-bold text-foreground mb-3">Employees by Type</p>
                <div className="space-y-2.5">
                  {empCountByType.map(([type, count], i) => (
                    <div key={type} className="flex items-center gap-3">
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white ${
                        i === 0 ? "bg-emerald-500" : i === 1 ? "bg-blue-500" : i === 2 ? "bg-amber-500" : "bg-violet-500"
                      }`}>
                        {count as number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-foreground">{categoryLabels[type] || type}</p>
                      </div>
                      <span className="text-[11px] font-bold tabular-nums text-foreground">{count} employees</span>
                    </div>
                  ))}
                  {empCountByType.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">No data</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={typeDialog} onOpenChange={setTypeDialog}>
        <DialogContent className="max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2"><Plus className="h-5 w-5 text-blue-600" /> Add Employee Type</DialogTitle>
            <DialogDescription className="text-[12px]">Define a new employment category</DialogDescription>
          </DialogHeader>
          {typeFormFields}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setTypeDialog(false)} data-testid="button-cancel-type">Cancel</Button>
            <Button size="sm" onClick={handleSubmitType} disabled={createTypeMutation.isPending} className="bg-gradient-to-r from-blue-600 to-teal-600 text-white border-0" data-testid="button-submit-type">
              {createTypeMutation.isPending ? "Saving..." : "Save Type"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editTypeDialog} onOpenChange={setEditTypeDialog}>
        <DialogContent className="max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2"><Edit className="h-5 w-5 text-amber-600" /> Edit Employee Type</DialogTitle>
            <DialogDescription className="text-[12px]">Update employment category</DialogDescription>
          </DialogHeader>
          {typeFormFields}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setEditTypeDialog(false)} data-testid="button-cancel-edit-type">Cancel</Button>
            <Button size="sm" onClick={handleUpdateType} disabled={updateTypeMutation.isPending} data-testid="button-update-type">
              {updateTypeMutation.isPending ? "Saving..." : "Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
        <DialogContent className="max-w-[650px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2"><Plus className="h-5 w-5 text-purple-600" /> Add Role</DialogTitle>
            <DialogDescription className="text-[12px]">Define organizational role with permissions</DialogDescription>
          </DialogHeader>
          {roleFormFields}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setRoleDialog(false)} data-testid="button-cancel-role">Cancel</Button>
            <Button size="sm" onClick={handleSubmitRole} disabled={createRoleMutation.isPending} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0" data-testid="button-submit-role">
              {createRoleMutation.isPending ? "Saving..." : "Save Role"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editRoleDialog} onOpenChange={setEditRoleDialog}>
        <DialogContent className="max-w-[650px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2"><Edit className="h-5 w-5 text-amber-600" /> Edit Role</DialogTitle>
            <DialogDescription className="text-[12px]">Update role and permissions</DialogDescription>
          </DialogHeader>
          {roleFormFields}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setEditRoleDialog(false)} data-testid="button-cancel-edit-role">Cancel</Button>
            <Button size="sm" onClick={handleUpdateRole} disabled={updateRoleMutation.isPending} data-testid="button-update-role">
              {updateRoleMutation.isPending ? "Saving..." : "Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewRoleDialog} onOpenChange={setViewRoleDialog}>
        <DialogContent className="max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2"><Eye className="h-5 w-5 text-blue-600" /> Role Details</DialogTitle>
            <DialogDescription className="text-[12px]">{selectedRole?.name}</DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-xl p-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Role Name</p>
                  <p className="text-[13px] font-bold text-foreground">{selectedRole.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Level</p>
                  <Badge variant="secondary" className={`text-[10px] font-medium border-0 mt-1 ${roleLevelColors[selectedRole.roleLevel] || roleLevelColors.level_4}`}>
                    {roleLevelLabels[selectedRole.roleLevel] || selectedRole.roleLevel}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Department</p>
                  {selectedRole.department ? <Badge variant="secondary" className={`text-[10px] font-medium border-0 mt-1 ${deptColors[selectedRole.department] || deptColors.admin}`}>{selectedRole.department}</Badge> : <p className="text-[12px] text-muted-foreground">—</p>}
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Reports To</p>
                  <p className="text-[12px] font-medium text-foreground">{selectedRole.reportsTo || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Salary Grade</p>
                  <p className="text-[12px] font-medium text-foreground">{selectedRole.salaryGrade || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
                  <Badge variant="secondary" className={`text-[10px] font-semibold border-0 capitalize mt-1 ${statusColors[selectedRole.status]}`}>{selectedRole.status}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  {selectedRole.commissionEligible ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-400" />}
                  <span className="text-[12px] font-medium text-foreground">Commission Eligible</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedRole.incentiveTarget ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-400" />}
                  <span className="text-[12px] font-medium text-foreground">Incentive Target</span>
                </div>
              </div>
              {selectedRole.permissions && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Permissions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRole.permissions.split(",").filter(Boolean).map((p: string) => (
                      <Badge key={p} variant="secondary" className="text-[10px] font-medium border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">{p.replace(/_/g, " ")}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedRole.description && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                  <p className="text-[12px] text-foreground">{selectedRole.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}