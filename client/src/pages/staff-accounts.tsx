import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, Edit, Trash2, Shield, Users, Key, Lock, Unlock,
  Monitor, Smartphone, Globe, Eye, EyeOff, RefreshCw, Download,
  CheckCircle2, XCircle, AlertTriangle, Clock, UserCheck, UserX,
  MoreHorizontal, History, ShieldCheck, Copy, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  type User, type Employee, type Role, type LoginActivityLog,
} from "@shared/schema";
import { z } from "zod";

const createAccountSchema = z.object({
  employeeId: z.number().optional(),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
  role: z.string().min(1, "Role is required"),
  department: z.string().optional(),
  branch: z.string().optional(),
  loginType: z.string().default("both"),
  maxLoginAttempts: z.number().default(5),
  deviceRestriction: z.string().default("multiple"),
  twoFactorEnabled: z.boolean().default(false),
  forcePasswordChange: z.boolean().default(false),
  accountExpiryDate: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type CreateAccountData = z.infer<typeof createAccountSchema>;

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let pwd = "";
  for (let i = 0; i < length; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  return pwd;
}

function generateUsername(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.]/g, "") + Math.floor(Math.random() * 100);
}

function getPasswordStrength(pwd: string): { label: string; color: string; width: string } {
  if (!pwd) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "33%" };
  if (score <= 4) return { label: "Medium", color: "bg-orange-500", width: "66%" };
  return { label: "Strong", color: "bg-green-500", width: "100%" };
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    disabled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    locked: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    not_created: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  return (
    <Badge data-testid={`badge-status-${status}`} className={`${styles[status] || styles.not_created} border-0 font-medium`}>
      {status === "active" && <CheckCircle2 className="h-3 w-3 mr-1" />}
      {status === "disabled" && <XCircle className="h-3 w-3 mr-1" />}
      {status === "locked" && <Lock className="h-3 w-3 mr-1" />}
      {status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
    </Badge>
  );
}

function LoginTypeBadge({ type }: { type: string }) {
  const styles: Record<string, { icon: any; cls: string }> = {
    web: { icon: Monitor, cls: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    app: { icon: Smartphone, cls: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300" },
    both: { icon: Globe, cls: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  };
  const s = styles[type] || styles.both;
  const Icon = s.icon;
  return (
    <Badge data-testid={`badge-login-type-${type}`} className={`${s.cls} border-0 font-medium`}>
      <Icon className="h-3 w-3 mr-1" />{type === "both" ? "Web + App" : type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}

export default function StaffAccountsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { data: usersData, isLoading: usersLoading } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: employees } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });
  const { data: roles } = useQuery<Role[]>({ queryKey: ["/api/roles"] });
  const { data: loginLogs } = useQuery<LoginActivityLog[]>({ queryKey: ["/api/login-activity-logs"] });
  const { data: userHistory, isLoading: historyLoading } = useQuery<LoginActivityLog[]>({
    queryKey: ["/api/users", selectedUser?.id, "login-history"],
    enabled: !!selectedUser && historyDialogOpen,
  });

  const users = usersData || [];
  const totalAccounts = users.length;
  const activeUsers = users.filter(u => (u as any).accountStatus === "active").length;
  const lockedAccounts = users.filter(u => (u as any).accountStatus === "locked").length;
  const webUsers = users.filter(u => (u as any).loginType === "web" || (u as any).loginType === "both").length;
  const appUsers = users.filter(u => (u as any).loginType === "app" || (u as any).loginType === "both").length;

  const filteredUsers = users.filter(u => {
    const matchSearch = !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || (u as any).accountStatus === statusFilter;
    const matchBranch = branchFilter === "all" || (u as any).branch === branchFilter;
    return matchSearch && matchRole && matchStatus && matchBranch;
  });

  const uniqueRoles = [...new Set(users.map(u => u.role))];
  const uniqueBranches = [...new Set(users.map(u => (u as any).branch).filter(Boolean))];

  const form = useForm<CreateAccountData>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      fullName: "", email: "", username: "", password: "", confirmPassword: "",
      role: "staff", department: "", branch: "", loginType: "both",
      maxLoginAttempts: 5, deviceRestriction: "multiple",
      twoFactorEnabled: false, forcePasswordChange: false, accountExpiryDate: "",
    },
  });

  const watchedPassword = form.watch("password");
  const passwordStrength = getPasswordStrength(watchedPassword || "");

  const createMutation = useMutation({
    mutationFn: async (data: CreateAccountData) => {
      const { confirmPassword, ...payload } = data;
      return apiRequest("POST", "/api/users", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({ title: "Account Created", description: "Staff login account has been created successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to create account", variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, accountStatus }: { id: number; accountStatus: string }) => {
      return apiRequest("POST", `/api/users/${id}/toggle-status`, { accountStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Status Updated", description: "Account status has been updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to update status", variant: "destructive" }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      return apiRequest("POST", `/api/users/${id}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setResetPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
      toast({ title: "Password Reset", description: "Password has been reset successfully." });
    },
    onError: () => toast({ title: "Error", description: "Failed to reset password", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Account Deleted", description: "Staff account has been removed." });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete account", variant: "destructive" }),
  });

  function handleEmployeeSelect(empId: string) {
    const emp = employees?.find(e => e.id === parseInt(empId));
    if (emp) {
      form.setValue("employeeId", emp.id);
      form.setValue("fullName", emp.fullName);
      form.setValue("email", emp.email || "");
      form.setValue("department", emp.department || "");
      form.setValue("username", generateUsername(emp.fullName));
    }
  }

  function handleExportCSV() {
    const headers = ["Employee Name", "Username", "Role", "Login Type", "Account Status", "Last Login"];
    const rows = filteredUsers.map(u => [
      u.fullName, u.username, u.role, (u as any).loginType || "both",
      (u as any).accountStatus || "active", (u as any).lastLoginAt || "Never",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff-accounts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const summaryCards = [
    { label: "Total Staff Accounts", value: totalAccounts, icon: Users, color: "from-blue-600 to-blue-500", textColor: "text-white" },
    { label: "Active Users", value: activeUsers, icon: UserCheck, color: "from-emerald-600 to-emerald-500", textColor: "text-white" },
    { label: "Locked Accounts", value: lockedAccounts, icon: Lock, color: "from-orange-600 to-orange-500", textColor: "text-white" },
    { label: "Web Access", value: webUsers, icon: Monitor, color: "from-indigo-600 to-indigo-500", textColor: "text-white" },
    { label: "App Access", value: appUsers, icon: Smartphone, color: "from-teal-600 to-teal-500", textColor: "text-white" },
  ];

  if (usersLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-5 gap-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto" data-testid="staff-accounts-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#002B5B] to-[#007BFF] bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300" data-testid="text-page-title">
            Staff User Login & Account Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create, manage, and control employee system access</p>
        </div>
        <Button
          data-testid="button-create-account"
          onClick={() => { form.reset(); setCreateDialogOpen(true); }}
          className="bg-gradient-to-r from-[#002B5B] to-[#007BFF] hover:from-[#001d3d] hover:to-[#0056b3] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />Create Staff Login
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards.map((card, i) => (
          <Card key={i} className="overflow-hidden border-0 shadow-md" data-testid={`card-summary-${i}`}>
            <CardContent className={`p-4 bg-gradient-to-br ${card.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-medium ${card.textColor} opacity-80`}>{card.label}</p>
                  <p className={`text-2xl font-bold ${card.textColor} mt-1`}>{card.value}</p>
                </div>
                <div className="bg-white/20 rounded-xl p-2.5">
                  <card.icon className={`h-5 w-5 ${card.textColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-gray-200 dark:border-gray-800 shadow-sm rounded-[14px] overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-search"
                placeholder="Search by name, username, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] h-9" data-testid="select-role-filter">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {uniqueRoles.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9" data-testid="select-status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>
              {uniqueBranches.length > 0 && (
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="w-[140px] h-9" data-testid="select-branch-filter">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {uniqueBranches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" size="sm" className="h-9" onClick={handleExportCSV} data-testid="button-export">
                <Download className="h-4 w-4 mr-1" />Export
              </Button>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-800 hover:to-slate-700">
              <TableHead className="text-white font-semibold text-xs">Employee Name</TableHead>
              <TableHead className="text-white font-semibold text-xs">Username</TableHead>
              <TableHead className="text-white font-semibold text-xs">Role</TableHead>
              <TableHead className="text-white font-semibold text-xs">Login Type</TableHead>
              <TableHead className="text-white font-semibold text-xs">Status</TableHead>
              <TableHead className="text-white font-semibold text-xs">Last Login</TableHead>
              <TableHead className="text-white font-semibold text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No staff accounts found</p>
                  <p className="text-sm">Create a new staff login to get started</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user, idx) => {
                const lastLog = loginLogs?.filter(l => l.userId === user.id).sort((a, b) => new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime())[0];
                return (
                  <TableRow
                    key={user.id}
                    data-testid={`row-user-${user.id}`}
                    className={idx % 2 === 0 ? "bg-white dark:bg-gray-950" : "bg-gray-50/70 dark:bg-gray-900/50"}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${user.role === "admin" ? "bg-gradient-to-br from-purple-600 to-purple-500" : "bg-gradient-to-br from-blue-600 to-blue-500"}`}>
                          {user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{user.fullName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono">{user.username}</code>
                    </TableCell>
                    <TableCell>
                      <Badge data-testid={`badge-role-${user.id}`} className={`border-0 font-medium ${user.role === "admin" ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" : user.role === "manager" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>
                        {user.role === "admin" && <ShieldCheck className="h-3 w-3 mr-1" />}
                        {user.role === "manager" && <Shield className="h-3 w-3 mr-1" />}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell><LoginTypeBadge type={(user as any).loginType || "both"} /></TableCell>
                    <TableCell><StatusBadge status={(user as any).accountStatus || "active"} /></TableCell>
                    <TableCell>
                      {lastLog ? (
                        <div className="text-xs">
                          <p className="font-medium">{new Date(lastLog.loginAt).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">{new Date(lastLog.loginAt).toLocaleTimeString()}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          data-testid={`button-reset-password-${user.id}`}
                          variant="ghost" size="sm"
                          className="h-8 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                          onClick={() => { setSelectedUser(user); setNewPassword(""); setResetPasswordDialogOpen(true); }}
                        >
                          <Key className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-actions-${user.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              data-testid={`menu-history-${user.id}`}
                              onClick={() => { setSelectedUser(user); setHistoryDialogOpen(true); }}
                            >
                              <History className="h-4 w-4 mr-2" />Login History
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {(user as any).accountStatus === "active" ? (
                              <DropdownMenuItem
                                data-testid={`menu-disable-${user.id}`}
                                onClick={() => toggleStatusMutation.mutate({ id: user.id, accountStatus: "disabled" })}
                                className="text-red-600"
                              >
                                <UserX className="h-4 w-4 mr-2" />Disable Account
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                data-testid={`menu-enable-${user.id}`}
                                onClick={() => toggleStatusMutation.mutate({ id: user.id, accountStatus: "active" })}
                                className="text-emerald-600"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />Enable Account
                              </DropdownMenuItem>
                            )}
                            {(user as any).accountStatus === "locked" && (
                              <DropdownMenuItem
                                data-testid={`menu-unlock-${user.id}`}
                                onClick={() => toggleStatusMutation.mutate({ id: user.id, accountStatus: "active" })}
                                className="text-blue-600"
                              >
                                <Unlock className="h-4 w-4 mr-2" />Unlock Account
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              data-testid={`menu-delete-${user.id}`}
                              onClick={() => {
                                if (confirm(`Delete account for ${user.fullName}?`)) deleteMutation.mutate(user.id);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {filteredUsers.length > 0 && (
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 text-xs text-muted-foreground bg-gray-50/50 dark:bg-gray-900/50">
            Showing {filteredUsers.length} of {users.length} accounts
          </div>
        )}
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold bg-gradient-to-r from-[#002B5B] to-[#007BFF] bg-clip-text text-transparent">
              Create Staff Login Account
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />Employee Selection
                </h3>
                <Separator className="mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-sm font-medium mb-1.5 block">Select Employee (Optional)</Label>
                    <Select onValueChange={handleEmployeeSelect}>
                      <SelectTrigger data-testid="select-employee">
                        <SelectValue placeholder="Choose from employee list..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees?.filter(e => e.status === "active").map(emp => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.empCode} - {emp.fullName} ({emp.department || "N/A"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input {...field} data-testid="input-fullname" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" {...field} data-testid="input-email" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-role"><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles?.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="department" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl><Input {...field} data-testid="input-department" placeholder="e.g. Operations" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Key className="h-4 w-4" />Account Credentials
                </h3>
                <Separator className="mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="username" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <div className="flex gap-2">
                        <FormControl><Input {...field} data-testid="input-username" /></FormControl>
                        <Button type="button" variant="outline" size="sm" className="shrink-0"
                          onClick={() => { const name = form.getValues("fullName"); if (name) form.setValue("username", generateUsername(name)); }}
                          data-testid="button-auto-username"
                        ><Zap className="h-3.5 w-3.5" /></Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="branch" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
                      <FormControl><Input {...field} data-testid="input-branch" placeholder="e.g. Main Branch" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <FormControl>
                            <Input type={showPassword ? "text" : "password"} {...field} data-testid="input-password" />
                          </FormControl>
                          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)} data-testid="button-toggle-password">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <Button type="button" variant="outline" size="sm" className="shrink-0"
                          onClick={() => { const pwd = generatePassword(); form.setValue("password", pwd); form.setValue("confirmPassword", pwd); }}
                          data-testid="button-generate-password"
                        ><RefreshCw className="h-3.5 w-3.5" /></Button>
                      </div>
                      {watchedPassword && (
                        <div className="mt-2">
                          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`} style={{ width: passwordStrength.width }} />
                          </div>
                          <p className={`text-xs mt-1 ${passwordStrength.color.replace("bg-", "text-")}`}>{passwordStrength.label}</p>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input type={showConfirmPassword ? "text" : "password"} {...field} data-testid="input-confirm-password" />
                        </FormControl>
                        <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)} data-testid="button-toggle-confirm-password">
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex items-center gap-6 mt-4">
                  <FormField control={form.control} name="forcePasswordChange" render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-force-password" />
                      <Label className="text-sm">Force password change on first login</Label>
                    </div>
                  )} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />Login Access Configuration
                </h3>
                <Separator className="mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="loginType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-login-type"><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="web">Web Only</SelectItem>
                          <SelectItem value="app">App Only</SelectItem>
                          <SelectItem value="both">Web + App</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="maxLoginAttempts" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Login Attempts</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={20} {...field} onChange={e => field.onChange(parseInt(e.target.value) || 5)}
                          data-testid="input-max-attempts" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="deviceRestriction" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Restriction</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-device-restriction"><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single">Single Device</SelectItem>
                          <SelectItem value="multiple">Multiple Devices</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="accountExpiryDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Expiry Date (Optional)</FormLabel>
                      <FormControl><Input type="date" {...field} data-testid="input-expiry-date" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex items-center gap-6 mt-4">
                  <FormField control={form.control} name="twoFactorEnabled" render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-2fa" />
                      <Label className="text-sm">Two-Factor Authentication</Label>
                    </div>
                  )} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} data-testid="button-cancel-create">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-gradient-to-r from-[#002B5B] to-[#007BFF] text-white"
                  data-testid="button-submit-create"
                >
                  {createMutation.isPending ? "Creating..." : "Create Account"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-orange-500" />Reset Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <p className="text-sm font-medium">{selectedUser?.fullName}</p>
              <p className="text-xs text-muted-foreground">Username: {selectedUser?.username}</p>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">New Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password..."
                    data-testid="input-new-password"
                  />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowNewPassword(!showNewPassword)} data-testid="button-toggle-new-password">
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setNewPassword(generatePassword())} data-testid="button-generate-new-password">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(newPassword); toast({ title: "Copied!" }); }}
                  data-testid="button-copy-password" disabled={!newPassword}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              {newPassword && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${getPasswordStrength(newPassword).color}`}
                      style={{ width: getPasswordStrength(newPassword).width }} />
                  </div>
                  <p className="text-xs mt-1">{getPasswordStrength(newPassword).label}</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)} data-testid="button-cancel-reset">Cancel</Button>
            <Button
              onClick={() => selectedUser && resetPasswordMutation.mutate({ id: selectedUser.id, newPassword })}
              disabled={!newPassword || newPassword.length < 6 || resetPasswordMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              data-testid="button-submit-reset"
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-500" />Login History — {selectedUser?.fullName}
            </DialogTitle>
          </DialogHeader>
          {historyLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : !userHistory?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No login activity found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700">
                  <TableHead className="text-white text-xs">Date & Time</TableHead>
                  <TableHead className="text-white text-xs">IP Address</TableHead>
                  <TableHead className="text-white text-xs">Device</TableHead>
                  <TableHead className="text-white text-xs">Status</TableHead>
                  <TableHead className="text-white text-xs">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userHistory.map((log, idx) => (
                  <TableRow key={log.id} className={idx % 2 === 0 ? "" : "bg-gray-50/70 dark:bg-gray-900/50"}>
                    <TableCell className="text-xs">
                      <p className="font-medium">{new Date(log.loginAt).toLocaleDateString()}</p>
                      <p className="text-muted-foreground">{new Date(log.loginAt).toLocaleTimeString()}</p>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{log.ipAddress || "—"}</TableCell>
                    <TableCell>
                      <Badge className={`border-0 text-xs ${log.deviceType === "Mobile" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                        {log.deviceType === "Mobile" ? <Smartphone className="h-3 w-3 mr-1" /> : <Monitor className="h-3 w-3 mr-1" />}
                        {log.deviceType || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`border-0 text-xs ${log.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {log.status === "success" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.failReason || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
