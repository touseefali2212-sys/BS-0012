import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  Users,
  MapPin,
  MonitorSmartphone,
  Smartphone,
  Map as MapIcon,
  Eye,
  Star,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Monitor,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTab } from "@/hooks/use-tab";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertRoleSchema,
  insertAppAccessConfigSchema,
  insertAreaAssignmentSchema,
  type Role,
  type InsertRole,
  type Employee,
  type Area,
  type AppAccessConfig,
  type InsertAppAccessConfig,
  type AreaAssignment,
  type InsertAreaAssignment,
  type LoginActivityLog,
} from "@shared/schema";
import { z } from "zod";

const roleFormSchema = insertRoleSchema.extend({
  name: z.string().min(1, "Role name is required"),
});

const appAccessFormSchema = insertAppAccessConfigSchema.extend({
  roleId: z.number().min(1, "Role is required"),
});

const areaAssignmentFormSchema = insertAreaAssignmentSchema.extend({
  employeeId: z.number().min(1, "Employee is required"),
  areaId: z.number().min(1, "Area is required"),
  effectiveFrom: z.string().min(1, "Effective from date is required"),
});

const appLoginTypes = [
  { value: "office", label: "Office Mode", color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  { value: "field", label: "Field Mode", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  { value: "recovery", label: "Recovery Mode", color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  { value: "sales", label: "Sales Mode", color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  { value: "technician", label: "Technician Mode", color: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300" },
];

const deviceRestrictions = [
  { value: "single_device", label: "Single Device Only" },
  { value: "multiple_devices", label: "Multiple Devices" },
  { value: "device_binding", label: "Device Binding Required" },
];

const officeFeatures = [
  { key: "view_customers", label: "View Customers" },
  { key: "edit_customers", label: "Edit Customers" },
  { key: "view_billing", label: "View Billing" },
  { key: "approve_payments", label: "Approve Payments" },
  { key: "view_reports", label: "View Reports" },
  { key: "hr_access", label: "HR Access" },
];

const recoveryFeatures = [
  { key: "view_assigned_customers", label: "View Assigned Customers Only" },
  { key: "collect_payment", label: "Collect Payment" },
  { key: "generate_receipt", label: "Generate Receipt" },
  { key: "update_payment_status", label: "Update Payment Status" },
  { key: "mark_promise_to_pay", label: "Mark Promise to Pay" },
  { key: "view_defaulter_list", label: "View Defaulter List" },
  { key: "call_customer", label: "Call Customer" },
  { key: "gps_checkin_required", label: "GPS Check-in Required" },
];

const technicianFeatures = [
  { key: "view_assigned_tickets", label: "View Assigned Tickets" },
  { key: "update_ticket_status", label: "Update Ticket Status" },
  { key: "upload_installation_photo", label: "Upload Installation Photo" },
  { key: "close_ticket", label: "Close Ticket" },
  { key: "view_network_map", label: "View Network Map" },
];

const salesFeatures = [
  { key: "add_new_customer", label: "Add New Customer" },
  { key: "view_packages", label: "View Packages" },
  { key: "create_lead", label: "Create Lead" },
  { key: "convert_lead", label: "Convert Lead" },
  { key: "view_commission", label: "View Commission" },
];

const fieldFeatures = [
  { key: "view_assigned_areas", label: "View Assigned Areas" },
  { key: "customer_survey", label: "Customer Survey" },
  { key: "site_inspection", label: "Site Inspection" },
  { key: "gps_tracking", label: "GPS Tracking" },
  { key: "field_report", label: "Field Report" },
];

function getFeaturesForMode(mode: string) {
  switch (mode) {
    case "office": return officeFeatures;
    case "recovery": return recoveryFeatures;
    case "technician": return technicianFeatures;
    case "sales": return salesFeatures;
    case "field": return fieldFeatures;
    default: return officeFeatures;
  }
}

export default function AccessPage() {
  const { toast } = useToast();
  const [tab, setTab] = useTab("roles");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [appAccessDialogOpen, setAppAccessDialogOpen] = useState(false);
  const [editingAppAccess, setEditingAppAccess] = useState<(AppAccessConfig & { roleName?: string }) | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [areaAssignmentDialogOpen, setAreaAssignmentDialogOpen] = useState(false);
  const [editingAreaAssignment, setEditingAreaAssignment] = useState<(AreaAssignment & { employeeName?: string; areaName?: string }) | null>(null);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [bulkSelectedAreas, setBulkSelectedAreas] = useState<number[]>([]);
  const [bulkEmployeeId, setBulkEmployeeId] = useState<number>(0);
  const [bulkPurpose, setBulkPurpose] = useState("general");
  const [bulkEffectiveFrom, setBulkEffectiveFrom] = useState(new Date().toISOString().split("T")[0]);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [purposeFilter, setPurposeFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [areaSearch, setAreaSearch] = useState("");
  const [viewConfigDialog, setViewConfigDialog] = useState<(AppAccessConfig & { roleName?: string }) | null>(null);

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: areas, isLoading: areasLoading } = useQuery<Area[]>({
    queryKey: ["/api/areas"],
  });

  const { data: appAccessConfigs, isLoading: appAccessLoading } = useQuery<(AppAccessConfig & { roleName?: string })[]>({
    queryKey: ["/api/app-access-configs"],
  });

  const { data: areaAssignments, isLoading: areaAssignmentsLoading } = useQuery<(AreaAssignment & { employeeName?: string; empCode?: string; department?: string; areaName?: string; areaCity?: string; areaZone?: string; areaBranch?: string; areaTotalCustomers?: number })[]>({
    queryKey: ["/api/area-assignments"],
  });

  const { data: loginLogs, isLoading: loginLogsLoading } = useQuery<LoginActivityLog[]>({
    queryKey: ["/api/login-activity-logs"],
  });

  const [logSearch, setLogSearch] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState("all");
  const [logRoleFilter, setLogRoleFilter] = useState("all");

  const form = useForm<InsertRole>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: "",
      isSystem: false,
      status: "active",
    },
  });

  const appAccessForm = useForm<InsertAppAccessConfig>({
    resolver: zodResolver(appAccessFormSchema),
    defaultValues: {
      roleId: 0,
      allowAppLogin: false,
      appLoginType: "office",
      deviceRestriction: "single_device",
      gpsTrackingRequired: false,
      liveLocationRequired: false,
      appFeatures: "",
      status: "active",
    },
  });

  const areaAssignmentForm = useForm<InsertAreaAssignment>({
    resolver: zodResolver(areaAssignmentFormSchema),
    defaultValues: {
      employeeId: 0,
      areaId: 0,
      isPrimary: false,
      assignmentPurpose: "general",
      effectiveFrom: new Date().toISOString().split("T")[0],
      effectiveTo: "",
      status: "active",
      assignedBy: "",
      notes: "",
    },
  });

  const watchLoginType = appAccessForm.watch("appLoginType");

  const createMutation = useMutation({
    mutationFn: async (data: InsertRole) => {
      const res = await apiRequest("POST", "/api/roles", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Role created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertRole> }) => {
      const res = await apiRequest("PATCH", `/api/roles/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setDialogOpen(false);
      setEditingRole(null);
      form.reset();
      toast({ title: "Role updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({ title: "Role deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createAppAccessMutation = useMutation({
    mutationFn: async (data: InsertAppAccessConfig) => {
      const res = await apiRequest("POST", "/api/app-access-configs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-access-configs"] });
      setAppAccessDialogOpen(false);
      appAccessForm.reset();
      setSelectedFeatures([]);
      toast({ title: "App access configuration saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateAppAccessMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAppAccessConfig> }) => {
      const res = await apiRequest("PATCH", `/api/app-access-configs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-access-configs"] });
      setAppAccessDialogOpen(false);
      setEditingAppAccess(null);
      appAccessForm.reset();
      setSelectedFeatures([]);
      toast({ title: "App access configuration updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAppAccessMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/app-access-configs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-access-configs"] });
      toast({ title: "App access configuration deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createAreaAssignmentMutation = useMutation({
    mutationFn: async (data: InsertAreaAssignment) => {
      const res = await apiRequest("POST", "/api/area-assignments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/area-assignments"] });
      setAreaAssignmentDialogOpen(false);
      areaAssignmentForm.reset();
      toast({ title: "Area assignment created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateAreaAssignmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAreaAssignment> }) => {
      const res = await apiRequest("PATCH", `/api/area-assignments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/area-assignments"] });
      setAreaAssignmentDialogOpen(false);
      setEditingAreaAssignment(null);
      areaAssignmentForm.reset();
      toast({ title: "Area assignment updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAreaAssignmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/area-assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/area-assignments"] });
      toast({ title: "Area assignment deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingRole(null);
    form.reset({ name: "", description: "", permissions: "", isSystem: false, status: "active" });
    setDialogOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    form.reset({ name: role.name, description: role.description || "", permissions: role.permissions || "", isSystem: role.isSystem, status: role.status });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertRole) => {
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openAppAccessCreate = () => {
    setEditingAppAccess(null);
    setSelectedFeatures([]);
    appAccessForm.reset({
      roleId: 0,
      allowAppLogin: false,
      appLoginType: "office",
      deviceRestriction: "single_device",
      gpsTrackingRequired: false,
      liveLocationRequired: false,
      appFeatures: "",
      status: "active",
    });
    setAppAccessDialogOpen(true);
  };

  const openAppAccessEdit = (config: AppAccessConfig & { roleName?: string }) => {
    setEditingAppAccess(config);
    const features = config.appFeatures ? config.appFeatures.split(",").filter(Boolean) : [];
    setSelectedFeatures(features);
    appAccessForm.reset({
      roleId: config.roleId,
      allowAppLogin: config.allowAppLogin,
      appLoginType: config.appLoginType,
      deviceRestriction: config.deviceRestriction,
      gpsTrackingRequired: config.gpsTrackingRequired ?? false,
      liveLocationRequired: config.liveLocationRequired ?? false,
      appFeatures: config.appFeatures || "",
      status: config.status,
    });
    setAppAccessDialogOpen(true);
  };

  const onAppAccessSubmit = (data: InsertAppAccessConfig) => {
    const submitData = { ...data, appFeatures: selectedFeatures.join(",") };
    if (editingAppAccess) {
      updateAppAccessMutation.mutate({ id: editingAppAccess.id, data: submitData });
    } else {
      createAppAccessMutation.mutate(submitData);
    }
  };

  const toggleFeature = (key: string) => {
    setSelectedFeatures(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  const openAreaAssignmentCreate = () => {
    setEditingAreaAssignment(null);
    areaAssignmentForm.reset({
      employeeId: 0,
      areaId: 0,
      isPrimary: false,
      assignmentPurpose: "general",
      effectiveFrom: new Date().toISOString().split("T")[0],
      effectiveTo: "",
      status: "active",
      assignedBy: "",
      notes: "",
    });
    setAreaAssignmentDialogOpen(true);
  };

  const openAreaAssignmentEdit = (assignment: AreaAssignment & { employeeName?: string; areaName?: string }) => {
    setEditingAreaAssignment(assignment);
    areaAssignmentForm.reset({
      employeeId: assignment.employeeId,
      areaId: assignment.areaId,
      isPrimary: assignment.isPrimary,
      assignmentPurpose: assignment.assignmentPurpose || "general",
      effectiveFrom: assignment.effectiveFrom,
      effectiveTo: assignment.effectiveTo || "",
      status: assignment.status,
      assignedBy: assignment.assignedBy || "",
      notes: assignment.notes || "",
    });
    setAreaAssignmentDialogOpen(true);
  };

  const openBulkAssign = () => {
    setBulkSelectedAreas([]);
    setBulkEmployeeId(0);
    setBulkPurpose("general");
    setBulkEffectiveFrom(new Date().toISOString().split("T")[0]);
    setBulkAssignDialogOpen(true);
  };

  const toggleBulkArea = (areaId: number) => {
    setBulkSelectedAreas(prev =>
      prev.includes(areaId) ? prev.filter(id => id !== areaId) : [...prev, areaId]
    );
  };

  const onAreaAssignmentSubmit = (data: InsertAreaAssignment) => {
    if (editingAreaAssignment) {
      updateAreaAssignmentMutation.mutate({ id: editingAreaAssignment.id, data });
    } else {
      createAreaAssignmentMutation.mutate(data);
    }
  };

  const filtered = (roles || []).filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColors: Record<string, string> = {
    active: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950",
    inactive: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950",
  };

  const loginTypeColor = (type: string) =>
    appLoginTypes.find(t => t.value === type)?.color || "";

  const tabs = [
    { id: "roles", label: "HRM Roles", icon: Shield },
    { id: "users", label: "Staff Users", icon: Users },
    { id: "app-access", label: "App Access", icon: MonitorSmartphone },
    { id: "areas", label: "Areas", icon: MapPin },
    { id: "area-assignments", label: "Area Allocation", icon: MapIcon },
    { id: "login-logs", label: "Login Logs", icon: Activity },
  ];

  const totalAppAccessEnabled = (appAccessConfigs || []).filter(c => c.allowAppLogin).length;
  const totalAreaAssignments = (areaAssignments || []).length;
  const activeAreaAssignments = (areaAssignments || []).filter(a => a.status === "active").length;
  const primaryAssignments = (areaAssignments || []).filter(a => a.isPrimary).length;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[#002B5B] to-[#007BFF] bg-clip-text text-transparent" data-testid="text-access-title">
            HRM Access & Territory Control
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage roles, app access, staff users, and area allocations</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            data-testid={`tab-${t.id}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.id
                ? "bg-white dark:bg-slate-800 text-[#002B5B] dark:text-blue-300 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-slate-800/50"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "roles" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreate} data-testid="button-add-role" className="bg-gradient-to-r from-[#002B5B] to-[#007BFF] hover:from-[#001f42] hover:to-[#0066dd]">
              <Plus className="h-4 w-4 mr-1" />
              Add Role
            </Button>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by role name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-roles" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No roles found</p>
                  <p className="text-sm mt-1">Add your first role to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700">
                        <TableHead className="text-white">Role Name</TableHead>
                        <TableHead className="text-white hidden md:table-cell">Description</TableHead>
                        <TableHead className="text-white hidden lg:table-cell">Permissions</TableHead>
                        <TableHead className="text-white">System Role</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((role, idx) => (
                        <TableRow key={role.id} data-testid={`row-role-${role.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                          <TableCell>
                            <div className="font-medium flex items-center gap-1.5">
                              <Shield className="h-3.5 w-3.5 text-blue-600" />
                              {role.name}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{role.description || "—"}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {role.permissions ? role.permissions.split(",").map((p, i) => p.trim()).filter(Boolean).map((perm, i) => (
                                <Badge key={i} variant="secondary" className="no-default-active-elevate text-[9px] font-mono">{perm}</Badge>
                              )) : <span className="text-xs text-muted-foreground">No permissions</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {role.isSystem ? (
                              <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950">
                                <ShieldCheck className="h-3 w-3 mr-1" />System
                              </Badge>
                            ) : <span className="text-xs text-muted-foreground">Custom</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[role.status] || ""}`}>{role.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-actions-${role.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(role)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(role.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Staff User Login Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {employeesLoading ? (
                <div className="p-5 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !employees || employees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No staff users found</p>
                  <p className="text-sm mt-1">Staff users will appear here once added via HR module</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700">
                        <TableHead className="text-white" data-testid="th-emp-code">Emp Code</TableHead>
                        <TableHead className="text-white" data-testid="th-full-name">Full Name</TableHead>
                        <TableHead className="text-white" data-testid="th-email">Email</TableHead>
                        <TableHead className="text-white" data-testid="th-department">Department</TableHead>
                        <TableHead className="text-white" data-testid="th-designation">Designation</TableHead>
                        <TableHead className="text-white" data-testid="th-status">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((emp, idx) => (
                        <TableRow key={emp.id} data-testid={`row-user-${emp.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                          <TableCell><span className="font-mono text-sm" data-testid={`text-emp-code-${emp.id}`}>{emp.empCode}</span></TableCell>
                          <TableCell><span className="font-medium" data-testid={`text-user-name-${emp.id}`}>{emp.fullName}</span></TableCell>
                          <TableCell><span className="text-sm text-muted-foreground" data-testid={`text-user-email-${emp.id}`}>{emp.email || "—"}</span></TableCell>
                          <TableCell><span className="text-sm" data-testid={`text-user-department-${emp.id}`}>{emp.department}</span></TableCell>
                          <TableCell><span className="text-sm text-muted-foreground" data-testid={`text-user-designation-${emp.id}`}>{emp.designation}</span></TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[emp.status] || ""}`} data-testid={`badge-user-status-${emp.id}`}>{emp.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "app-access" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Configs</p>
                    <p className="text-2xl font-bold" data-testid="text-total-configs">{(appAccessConfigs || []).length}</p>
                  </div>
                  <MonitorSmartphone className="h-8 w-8 text-blue-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">App Login Enabled</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-enabled-count">{totalAppAccessEnabled}</p>
                  </div>
                  <Smartphone className="h-8 w-8 text-green-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">GPS Required</p>
                    <p className="text-2xl font-bold text-orange-600" data-testid="text-gps-count">{(appAccessConfigs || []).filter(c => c.gpsTrackingRequired).length}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-orange-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Roles</p>
                    <p className="text-2xl font-bold text-purple-600" data-testid="text-roles-count">{(roles || []).length}</p>
                  </div>
                  <Shield className="h-8 w-8 text-purple-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={openAppAccessCreate} data-testid="button-add-app-access" className="bg-gradient-to-r from-[#002B5B] to-[#007BFF] hover:from-[#001f42] hover:to-[#0066dd]">
              <Plus className="h-4 w-4 mr-1" />
              Configure App Access
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MonitorSmartphone className="h-5 w-5 text-blue-600" />
                App Login Control Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {appAccessLoading ? (
                <div className="p-5 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !appAccessConfigs || appAccessConfigs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <MonitorSmartphone className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No app access configurations</p>
                  <p className="text-sm mt-1">Configure app access for roles to control mobile app features</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700">
                        <TableHead className="text-white">Role</TableHead>
                        <TableHead className="text-white">App Login</TableHead>
                        <TableHead className="text-white">Login Type</TableHead>
                        <TableHead className="text-white">Device Restriction</TableHead>
                        <TableHead className="text-white">GPS</TableHead>
                        <TableHead className="text-white">Live Location</TableHead>
                        <TableHead className="text-white">Features</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appAccessConfigs.map((config, idx) => {
                        const featureCount = config.appFeatures ? config.appFeatures.split(",").filter(Boolean).length : 0;
                        return (
                          <TableRow key={config.id} data-testid={`row-app-access-${config.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                            <TableCell>
                              <div className="font-medium flex items-center gap-1.5">
                                <Shield className="h-3.5 w-3.5 text-blue-600" />
                                {config.roleName || `Role #${config.roleId}`}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${config.allowAppLogin ? "text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-950" : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950"}`}>
                                {config.allowAppLogin ? "Enabled" : "Disabled"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${loginTypeColor(config.appLoginType)}`}>
                                {appLoginTypes.find(t => t.value === config.appLoginType)?.label || config.appLoginType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{deviceRestrictions.find(d => d.value === config.deviceRestriction)?.label || config.deviceRestriction}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${config.gpsTrackingRequired ? "text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-950" : "text-slate-500 bg-slate-50 dark:text-slate-400 dark:bg-slate-900"}`}>
                                {config.gpsTrackingRequired ? "Required" : "Off"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${config.liveLocationRequired ? "text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-950" : "text-slate-500 bg-slate-50 dark:text-slate-400 dark:bg-slate-900"}`}>
                                {config.liveLocationRequired ? "Required" : "Off"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950">
                                {featureCount} features
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[config.status] || ""}`}>{config.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" data-testid={`button-app-access-actions-${config.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setViewConfigDialog(config)}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openAppAccessEdit(config)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => deleteAppAccessMutation.mutate(config.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
        </div>
      )}

      {tab === "areas" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Areas</p>
                    <p className="text-2xl font-bold" data-testid="text-total-areas">{(areas || []).length}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-blue-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Areas</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-active-areas">{(areas || []).filter(a => a.status === "active").length}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-green-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                    <p className="text-2xl font-bold text-purple-600" data-testid="text-total-area-customers">{(areas || []).reduce((sum, a) => sum + (a.totalCustomers ?? 0), 0)}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Area Master Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {areasLoading ? (
                <div className="p-5 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !areas || areas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <MapPin className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No areas found</p>
                  <p className="text-sm mt-1">Areas will appear here once configured in the Areas module</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700">
                        <TableHead className="text-white" data-testid="th-area-name">Area Name</TableHead>
                        <TableHead className="text-white" data-testid="th-area-city">City</TableHead>
                        <TableHead className="text-white" data-testid="th-area-zone">Zone</TableHead>
                        <TableHead className="text-white" data-testid="th-area-branch">Branch</TableHead>
                        <TableHead className="text-white" data-testid="th-area-customers">Customers</TableHead>
                        <TableHead className="text-white">Assigned Staff</TableHead>
                        <TableHead className="text-white" data-testid="th-area-status">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {areas.map((area, idx) => {
                        const areaStaff = (areaAssignments || []).filter(a => a.areaId === area.id && a.status === "active");
                        const assignedCount = areaStaff.length;
                        const uniqueStaff = [...new globalThis.Map(areaStaff.map(a => [a.employeeId, { name: a.employeeName || `Emp #${a.employeeId}`, code: a.empCode }])).values()];
                        return (
                          <TableRow key={area.id} data-testid={`row-area-${area.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                            <TableCell>
                              <div className="font-medium flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-blue-600" />
                                <span data-testid={`text-area-name-${area.id}`}>{area.name}</span>
                              </div>
                            </TableCell>
                            <TableCell><span className="text-sm" data-testid={`text-area-city-${area.id}`}>{area.city}</span></TableCell>
                            <TableCell><span className="text-sm text-muted-foreground" data-testid={`text-area-zone-${area.id}`}>{area.zone || "—"}</span></TableCell>
                            <TableCell><span className="text-sm text-muted-foreground" data-testid={`text-area-branch-${area.id}`}>{area.branch || "—"}</span></TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950" data-testid={`text-area-customers-${area.id}`}>
                                {area.totalCustomers ?? 0} customers
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div data-testid={`text-area-staff-${area.id}`}>
                                {assignedCount === 0 ? (
                                  <span className="text-xs text-muted-foreground">No staff assigned</span>
                                ) : (
                                  <div className="flex flex-col gap-0.5">
                                    {uniqueStaff.slice(0, 3).map((s, i) => (
                                      <span key={i} className="text-xs font-medium">
                                        {s.name}
                                        {s.code && <span className="text-muted-foreground ml-1">({s.code})</span>}
                                      </span>
                                    ))}
                                    {uniqueStaff.length > 3 && (
                                      <span className="text-[10px] text-muted-foreground">+{uniqueStaff.length - 3} more</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[area.status] || ""}`} data-testid={`badge-area-status-${area.id}`}>{area.status}</Badge>
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
        </div>
      )}

      {tab === "area-assignments" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Assignments</p>
                    <p className="text-2xl font-bold" data-testid="text-total-assignments">{totalAreaAssignments}</p>
                  </div>
                  <MapIcon className="h-8 w-8 text-blue-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Assignments</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-active-assignments">{activeAreaAssignments}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-green-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Primary Areas</p>
                    <p className="text-2xl font-bold text-orange-600" data-testid="text-primary-assignments">{primaryAssignments}</p>
                  </div>
                  <Star className="h-8 w-8 text-orange-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Unique Employees</p>
                    <p className="text-2xl font-bold text-purple-600" data-testid="text-unique-employees">{new Set((areaAssignments || []).map(a => a.employeeId)).size}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-2 flex-wrap items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employee or area..."
                    value={areaSearch}
                    onChange={(e) => setAreaSearch(e.target.value)}
                    className="pl-9 w-[220px] h-9"
                    data-testid="input-area-search"
                  />
                </div>
                <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                  <SelectTrigger className="w-[180px] h-9" data-testid="select-employee-filter">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {[...new Map((areaAssignments || []).map(a => [a.employeeId, { id: a.employeeId, name: a.employeeName || `Emp #${a.employeeId}`, code: a.empCode }])).values()].map(emp => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}{emp.code ? ` (${emp.code})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                  <SelectTrigger className="w-[160px] h-9" data-testid="select-purpose-filter">
                    <SelectValue placeholder="All Purposes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Purposes</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="complaints">Complaints</SelectItem>
                    <SelectItem value="recovery">Recovery</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="survey">Survey</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={openBulkAssign} variant="outline" data-testid="button-bulk-assign-areas">
                  <MapIcon className="h-4 w-4 mr-1" />
                  Bulk Assign Areas
                </Button>
                <Button onClick={openAreaAssignmentCreate} data-testid="button-add-area-assignment" className="bg-gradient-to-r from-[#002B5B] to-[#007BFF] hover:from-[#001f42] hover:to-[#0066dd]">
                  <Plus className="h-4 w-4 mr-1" />
                  Assign Area
                </Button>
              </div>
            </div>

            {employeeFilter !== "all" && (() => {
              const empId = parseInt(employeeFilter);
              const empAssignments = (areaAssignments || []).filter(a => a.employeeId === empId && a.status === "active");
              const empName = empAssignments[0]?.employeeName || `Employee #${empId}`;
              const totalAreas = empAssignments.length;
              const totalCust = empAssignments.reduce((sum, a) => sum + (a.areaTotalCustomers || 0), 0);
              const recoveryAreas = empAssignments.filter(a => (a.assignmentPurpose || "general") === "recovery").length;
              const complaintAreas = empAssignments.filter(a => (a.assignmentPurpose || "general") === "complaints").length;
              return (
                <Card className="border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        {empName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold" data-testid="text-filtered-employee-name">{empName}</p>
                        <p className="text-xs text-muted-foreground">{empAssignments[0]?.empCode} • {empAssignments[0]?.department || "N/A"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-blue-600" data-testid="text-emp-total-areas">{totalAreas}</p>
                        <p className="text-xs text-muted-foreground">Assigned Areas</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-emerald-600" data-testid="text-emp-total-customers">{totalCust}</p>
                        <p className="text-xs text-muted-foreground">Total Customers</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-orange-600" data-testid="text-emp-recovery-areas">{recoveryAreas}</p>
                        <p className="text-xs text-muted-foreground">Recovery Areas</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 text-center">
                        <p className="text-xl font-bold text-red-600" data-testid="text-emp-complaint-areas">{complaintAreas}</p>
                        <p className="text-xs text-muted-foreground">Complaint Areas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-blue-600" />
                Area Allocation & Territory Management
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {areaAssignmentsLoading ? (
                <div className="p-5 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : !areaAssignments || areaAssignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <MapIcon className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">No area assignments</p>
                  <p className="text-sm mt-1">Assign areas to employees for territory management</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700">
                        <TableHead className="text-white">Employee</TableHead>
                        <TableHead className="text-white">Department</TableHead>
                        <TableHead className="text-white">Area</TableHead>
                        <TableHead className="text-white">City / Zone</TableHead>
                        <TableHead className="text-white">Customers</TableHead>
                        <TableHead className="text-white">Recovery</TableHead>
                        <TableHead className="text-white">Purpose</TableHead>
                        <TableHead className="text-white">Type</TableHead>
                        <TableHead className="text-white">Allowed Areas</TableHead>
                        <TableHead className="text-white">Effective</TableHead>
                        <TableHead className="text-white">Status</TableHead>
                        <TableHead className="text-white w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(areaAssignments || [])
                        .filter(a => purposeFilter === "all" || (a.assignmentPurpose || "general") === purposeFilter)
                        .filter(a => employeeFilter === "all" || a.employeeId === parseInt(employeeFilter))
                        .filter(a => {
                          if (!areaSearch) return true;
                          const q = areaSearch.toLowerCase();
                          return (a.employeeName || "").toLowerCase().includes(q) || (a.areaName || "").toLowerCase().includes(q) || (a.empCode || "").toLowerCase().includes(q);
                        })
                        .map((assignment, idx) => {
                        const purposeColors: Record<string, string> = {
                          general: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                          complaints: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
                          recovery: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
                          sales: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
                          installation: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
                          maintenance: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
                          survey: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
                        };
                        const empAllowedAreas = (areaAssignments || []).filter(a => a.employeeId === assignment.employeeId && a.status === "active").length;
                        const empRecoveryCount = (areaAssignments || []).filter(a => a.employeeId === assignment.employeeId && a.status === "active" && (a.assignmentPurpose || "general") === "recovery").reduce((sum, a) => sum + (a.areaTotalCustomers || 0), 0);
                        return (
                        <TableRow key={assignment.id} data-testid={`row-area-assignment-${assignment.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                          <TableCell>
                            <div>
                              <span className="font-medium" data-testid={`text-assignment-employee-${assignment.id}`}>{assignment.employeeName || `Emp #${assignment.employeeId}`}</span>
                              {assignment.empCode && <span className="text-xs text-muted-foreground ml-1">({assignment.empCode})</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{assignment.department || "—"}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-blue-600" />
                              <span className="font-medium" data-testid={`text-assignment-area-${assignment.id}`}>{assignment.areaName || `Area #${assignment.areaId}`}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{[assignment.areaCity, assignment.areaZone].filter(Boolean).join(" / ") || "—"}</span>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <span className="text-sm font-semibold text-emerald-600" data-testid={`text-area-customers-${assignment.id}`}>{assignment.areaTotalCustomers || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              {(assignment.assignmentPurpose || "general") === "recovery" ? (
                                <span className="text-sm font-semibold text-orange-600" data-testid={`text-area-recovery-${assignment.id}`}>{assignment.areaTotalCustomers || 0}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground" data-testid={`text-area-recovery-${assignment.id}`}>—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`no-default-active-elevate text-[10px] border-0 capitalize ${purposeColors[assignment.assignmentPurpose] || purposeColors.general}`} data-testid={`badge-purpose-${assignment.id}`}>
                              {assignment.assignmentPurpose || "General"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${assignment.isPrimary ? "text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-950" : "text-slate-600 bg-slate-50 dark:text-slate-300 dark:bg-slate-900"}`}>
                              {assignment.isPrimary ? "Primary" : "Secondary"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <span className="text-sm font-bold text-blue-600" data-testid={`text-allowed-areas-${assignment.id}`}>{empAllowedAreas}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <p>{assignment.effectiveFrom}</p>
                              <p className="text-muted-foreground">{assignment.effectiveTo || "Ongoing"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${statusColors[assignment.status] || ""}`}>{assignment.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`button-assignment-actions-${assignment.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openAreaAssignmentEdit(assignment)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteAreaAssignmentMutation.mutate(assignment.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
        </div>
      )}

      {tab === "login-logs" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Logins</p>
                    <p className="text-2xl font-bold" data-testid="text-total-logins">{(loginLogs || []).length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Successful</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-success-logins">{(loginLogs || []).filter(l => l.status === "success").length}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Failed Attempts</p>
                    <p className="text-2xl font-bold text-red-600" data-testid="text-failed-logins">{(loginLogs || []).filter(l => l.status === "failed").length}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Unique Users</p>
                    <p className="text-2xl font-bold text-purple-600" data-testid="text-unique-logins">{new Set((loginLogs || []).filter(l => l.userId).map(l => l.userId)).size}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Login Activity Log
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap mt-3">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by username or name..." value={logSearch} onChange={(e) => setLogSearch(e.target.value)} className="pl-9" data-testid="input-search-logs" />
                </div>
                <Select value={logStatusFilter} onValueChange={setLogStatusFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-log-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={logRoleFilter} onValueChange={setLogRoleFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-log-role-filter">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loginLogsLoading ? (
                <div className="p-5 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : (() => {
                const filtered = (loginLogs || []).filter(l => {
                  const matchSearch = !logSearch ||
                    l.username.toLowerCase().includes(logSearch.toLowerCase()) ||
                    (l.employeeName && l.employeeName.toLowerCase().includes(logSearch.toLowerCase()));
                  const matchStatus = logStatusFilter === "all" || l.status === logStatusFilter;
                  const matchRole = logRoleFilter === "all" || l.role === logRoleFilter;
                  return matchSearch && matchStatus && matchRole;
                });
                return filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mb-3 opacity-30" />
                    <p className="font-medium">No login activity recorded</p>
                    <p className="text-sm mt-1">Login attempts will be logged here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700">
                          <TableHead className="text-white">User</TableHead>
                          <TableHead className="text-white">Role</TableHead>
                          <TableHead className="text-white">Login Mode</TableHead>
                          <TableHead className="text-white">Branch</TableHead>
                          <TableHead className="text-white">IP Address</TableHead>
                          <TableHead className="text-white">Device</TableHead>
                          <TableHead className="text-white">Login Time</TableHead>
                          <TableHead className="text-white">Status</TableHead>
                          <TableHead className="text-white">Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((log, idx) => (
                          <TableRow key={log.id} data-testid={`row-login-log-${log.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                            <TableCell>
                              <div>
                                <span className="font-medium">{log.employeeName || log.username}</span>
                                {log.employeeName && <span className="text-xs text-muted-foreground block">@{log.username}</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="no-default-active-elevate text-[10px] capitalize">{log.role || "—"}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm capitalize">{log.loginMode || "—"}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">{log.branch || "—"}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-mono text-muted-foreground">{log.ipAddress || "—"}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {log.deviceType === "Mobile" ? <Smartphone className="h-3.5 w-3.5 text-blue-500" /> : <Monitor className="h-3.5 w-3.5 text-slate-500" />}
                                <span className="text-xs">{log.deviceType || "—"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs">{log.loginAt ? new Date(log.loginAt).toLocaleString() : "—"}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${log.status === "success" ? "text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-950" : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950"}`}>
                                {log.status === "success" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">{log.failReason || "—"}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Add New Role"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl><Input placeholder="e.g. Admin, Operator" data-testid="input-role-name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Role description" data-testid="input-description" {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="permissions" render={({ field }) => (
                <FormItem>
                  <FormLabel>Permissions</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Comma-separated permissions, e.g. dashboard.view, customers.create" data-testid="input-permissions" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="isSystem" render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>System Role</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-is-system" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "active"}>
                      <FormControl><SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-role" className="bg-gradient-to-r from-[#002B5B] to-[#007BFF]">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingRole ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={appAccessDialogOpen} onOpenChange={setAppAccessDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MonitorSmartphone className="h-5 w-5 text-blue-600" />
              {editingAppAccess ? "Edit App Access Configuration" : "Configure App Access"}
            </DialogTitle>
          </DialogHeader>
          <Form {...appAccessForm}>
            <form onSubmit={appAccessForm.handleSubmit(onAppAccessSubmit)} className="space-y-6">
              <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">App Login Control</h3>
                <FormField control={appAccessForm.control} name="roleId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Role</FormLabel>
                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString() || "0"}>
                      <FormControl><SelectTrigger data-testid="select-app-access-role"><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {(roles || []).map(r => (
                          <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={appAccessForm.control} name="allowAppLogin" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm font-medium">Allow App Login</FormLabel>
                      <p className="text-xs text-muted-foreground">Enable mobile app access for this role</p>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-allow-app-login" /></FormControl>
                  </FormItem>
                )} />

                <FormField control={appAccessForm.control} name="appLoginType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>App Login Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "office"}>
                      <FormControl><SelectTrigger data-testid="select-login-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {appLoginTypes.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={appAccessForm.control} name="deviceRestriction" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Restriction</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "single_device"}>
                      <FormControl><SelectTrigger data-testid="select-device-restriction"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {deviceRestrictions.map(d => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={appAccessForm.control} name="gpsTrackingRequired" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel className="text-sm font-medium">GPS Tracking</FormLabel>
                        <p className="text-xs text-muted-foreground">Require GPS</p>
                      </div>
                      <FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="switch-gps-tracking" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={appAccessForm.control} name="liveLocationRequired" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel className="text-sm font-medium">Live Location</FormLabel>
                        <p className="text-xs text-muted-foreground">Require live</p>
                      </div>
                      <FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="switch-live-location" /></FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>

              <Separator />

              <div className="space-y-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  App Feature Permissions — {appLoginTypes.find(t => t.value === watchLoginType)?.label || "Office Mode"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {getFeaturesForMode(watchLoginType || "office").map(feature => (
                    <div key={feature.key} className="flex items-center space-x-3 rounded-lg border bg-white dark:bg-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => toggleFeature(feature.key)}>
                      <Checkbox
                        checked={selectedFeatures.includes(feature.key)}
                        onCheckedChange={() => toggleFeature(feature.key)}
                        data-testid={`checkbox-feature-${feature.key}`}
                      />
                      <Label className="text-sm cursor-pointer flex-1">{feature.label}</Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{selectedFeatures.length} features selected</p>
              </div>

              <FormField control={appAccessForm.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "active"}>
                    <FormControl><SelectTrigger data-testid="select-app-access-status"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setAppAccessDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createAppAccessMutation.isPending || updateAppAccessMutation.isPending} data-testid="button-save-app-access" className="bg-gradient-to-r from-[#002B5B] to-[#007BFF]">
                  {createAppAccessMutation.isPending || updateAppAccessMutation.isPending ? "Saving..." : editingAppAccess ? "Update" : "Save Configuration"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewConfigDialog} onOpenChange={() => setViewConfigDialog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              App Access Details — {viewConfigDialog?.roleName || ""}
            </DialogTitle>
          </DialogHeader>
          {viewConfigDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">App Login</p>
                  <p className="font-medium mt-0.5">{viewConfigDialog.allowAppLogin ? "Enabled" : "Disabled"}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Login Type</p>
                  <p className="font-medium mt-0.5">{appLoginTypes.find(t => t.value === viewConfigDialog.appLoginType)?.label}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Device Restriction</p>
                  <p className="font-medium mt-0.5">{deviceRestrictions.find(d => d.value === viewConfigDialog.deviceRestriction)?.label}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">GPS Tracking</p>
                  <p className="font-medium mt-0.5">{viewConfigDialog.gpsTrackingRequired ? "Required" : "Not Required"}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Live Location</p>
                  <p className="font-medium mt-0.5">{viewConfigDialog.liveLocationRequired ? "Required" : "Not Required"}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize mt-0.5 ${statusColors[viewConfigDialog.status] || ""}`}>{viewConfigDialog.status}</Badge>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-semibold mb-2">Enabled Features</p>
                <div className="flex flex-wrap gap-2">
                  {viewConfigDialog.appFeatures ? viewConfigDialog.appFeatures.split(",").filter(Boolean).map((f, i) => (
                    <Badge key={i} variant="secondary" className="no-default-active-elevate text-[10px] text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950">
                      {f.replace(/_/g, " ")}
                    </Badge>
                  )) : <span className="text-sm text-muted-foreground">No features configured</span>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={areaAssignmentDialogOpen} onOpenChange={setAreaAssignmentDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-blue-600" />
              {editingAreaAssignment ? "Edit Area Assignment" : "Assign Area to Employee"}
            </DialogTitle>
          </DialogHeader>
          <Form {...areaAssignmentForm}>
            <form onSubmit={areaAssignmentForm.handleSubmit(onAreaAssignmentSubmit)} className="space-y-4">
              <FormField control={areaAssignmentForm.control} name="employeeId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Employee</FormLabel>
                  <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString() || "0"}>
                    <FormControl><SelectTrigger data-testid="select-assignment-employee"><SelectValue placeholder="Select employee" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(employees || []).filter(e => e.status === "active").map(emp => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>{emp.fullName} ({emp.empCode})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={areaAssignmentForm.control} name="areaId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Area</FormLabel>
                  <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString() || "0"}>
                    <FormControl><SelectTrigger data-testid="select-assignment-area"><SelectValue placeholder="Select area" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(areas || []).filter(a => a.status === "active").map(area => (
                        <SelectItem key={area.id} value={area.id.toString()}>{area.name} — {area.city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={areaAssignmentForm.control} name="assignmentPurpose" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment Purpose</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "general"}>
                    <FormControl><SelectTrigger data-testid="select-assignment-purpose"><SelectValue placeholder="Select purpose" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="general">General (All Tasks)</SelectItem>
                      <SelectItem value="complaints">Complaints</SelectItem>
                      <SelectItem value="recovery">Recovery</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="installation">Installation</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="survey">Survey</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={areaAssignmentForm.control} name="isPrimary" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-sm font-medium">Primary Area</FormLabel>
                    <p className="text-xs text-muted-foreground">Set as the employee's primary operating area</p>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-is-primary" /></FormControl>
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={areaAssignmentForm.control} name="effectiveFrom" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective From</FormLabel>
                    <FormControl><Input type="date" data-testid="input-effective-from" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={areaAssignmentForm.control} name="effectiveTo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective To (Optional)</FormLabel>
                    <FormControl><Input type="date" data-testid="input-effective-to" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={areaAssignmentForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea placeholder="Assignment notes..." data-testid="input-assignment-notes" {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={areaAssignmentForm.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "active"}>
                    <FormControl><SelectTrigger data-testid="select-assignment-status"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setAreaAssignmentDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createAreaAssignmentMutation.isPending || updateAreaAssignmentMutation.isPending} data-testid="button-save-area-assignment" className="bg-gradient-to-r from-[#002B5B] to-[#007BFF]">
                  {createAreaAssignmentMutation.isPending || updateAreaAssignmentMutation.isPending ? "Saving..." : editingAreaAssignment ? "Update" : "Assign Area"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-blue-600" />
              Bulk Assign Multiple Areas to Employee
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Select Employee</Label>
              <Select onValueChange={(val) => setBulkEmployeeId(parseInt(val))} value={bulkEmployeeId?.toString() || "0"}>
                <SelectTrigger data-testid="select-bulk-employee"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {(employees || []).filter(e => e.status === "active").map(emp => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>{emp.fullName} ({emp.empCode})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Assignment Purpose</Label>
              <Select onValueChange={setBulkPurpose} value={bulkPurpose}>
                <SelectTrigger data-testid="select-bulk-purpose"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General (All Tasks)</SelectItem>
                  <SelectItem value="complaints">Complaints</SelectItem>
                  <SelectItem value="recovery">Recovery</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="survey">Survey</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Effective From</Label>
              <Input type="date" value={bulkEffectiveFrom} onChange={(e) => setBulkEffectiveFrom(e.target.value)} data-testid="input-bulk-effective-from" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Select Areas ({bulkSelectedAreas.length} selected)</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setBulkSelectedAreas((areas || []).filter(a => a.status === "active").map(a => a.id))} data-testid="button-select-all-areas">
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setBulkSelectedAreas([])} data-testid="button-clear-areas">
                    Clear
                  </Button>
                </div>
              </div>
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {(areas || []).filter(a => a.status === "active").map(area => {
                  const isSelected = bulkSelectedAreas.includes(area.id);
                  return (
                    <div
                      key={area.id}
                      className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer transition-colors ${isSelected ? "bg-blue-50 dark:bg-blue-950/30" : "hover:bg-gray-50 dark:hover:bg-gray-900"}`}
                      onClick={() => toggleBulkArea(area.id)}
                      data-testid={`checkbox-area-${area.id}`}
                    >
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleBulkArea(area.id)} />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-blue-600" />
                          <span className="font-medium text-sm">{area.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{area.city}{area.zone ? ` / ${area.zone}` : ""}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setBulkAssignDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!bulkEmployeeId || bulkSelectedAreas.length === 0 || bulkAssigning}
              data-testid="button-save-bulk-assign"
              className="bg-gradient-to-r from-[#002B5B] to-[#007BFF]"
              onClick={async () => {
                setBulkAssigning(true);
                try {
                  for (const areaId of bulkSelectedAreas) {
                    await apiRequest("POST", "/api/area-assignments", {
                      employeeId: bulkEmployeeId,
                      areaId,
                      isPrimary: false,
                      assignmentPurpose: bulkPurpose,
                      effectiveFrom: bulkEffectiveFrom,
                      effectiveTo: "",
                      status: "active",
                      assignedBy: "",
                      notes: `Bulk assigned for ${bulkPurpose}`,
                    });
                  }
                  queryClient.invalidateQueries({ queryKey: ["/api/area-assignments"] });
                  setBulkAssignDialogOpen(false);
                  toast({ title: "Areas Assigned", description: `${bulkSelectedAreas.length} areas assigned successfully.` });
                } catch (error: any) {
                  toast({ title: "Error", description: error.message || "Failed to assign areas", variant: "destructive" });
                } finally {
                  setBulkAssigning(false);
                }
              }}
            >
              {bulkAssigning ? "Assigning..." : `Assign ${bulkSelectedAreas.length} Area${bulkSelectedAreas.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}