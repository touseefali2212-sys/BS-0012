import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, CheckCircle, Clock,
  AlertTriangle, XCircle, Eye, Shield, X, DollarSign, Calendar,
  Activity, FileCheck, RefreshCw, Ban, Send, ArrowUpRight,
  Clipboard, Filter, BarChart3, TrendingUp, AlertCircle, Users,
  MessageSquare, ChevronRight, FileText, Zap, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTab } from "@/hooks/use-tab";
import type { Asset, Employee, AssetRequest, AssetRequestHistory } from "@shared/schema";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const requestFormSchema = z.object({
  requestType: z.string().min(1, "Request type is required"),
  assetType: z.string().min(1, "Asset type is required"),
  assetId: z.number().optional().nullable(),
  fromLocation: z.string().optional(),
  toLocation: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  requestedBy: z.string().min(1, "Requester is required"),
  priority: z.string().default("normal"),
  justification: z.string().min(1, "Justification is required"),
  estimatedValue: z.string().optional(),
  requiredByDate: z.string().optional(),
  requireMultiLevel: z.boolean().default(false),
  isEmergency: z.boolean().default(false),
  notifyDeptHead: z.boolean().default(false),
  notes: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  draft: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: FileText, label: "Draft" },
  pending: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock, label: "Pending Approval" },
  under_review: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: Eye, label: "Under Review" },
  approved: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle, label: "Approved" },
  rejected: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle, label: "Rejected" },
  cancelled: { color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", icon: Ban, label: "Cancelled" },
  escalated: { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: ArrowUpRight, label: "Escalated" },
  executed: { color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400", icon: Zap, label: "Executed" },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", label: "Low" },
  normal: { color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", label: "Normal" },
  high: { color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400", label: "High" },
  critical: { color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400", label: "Critical" },
};

const requestTypeLabels: Record<string, string> = {
  new_issuance: "New Asset Issuance",
  asset_transfer: "Asset Transfer",
  device_replacement: "Device Replacement",
  maintenance: "Maintenance Request",
  asset_return: "Asset Return",
  write_off: "Asset Write-Off",
  emergency: "Emergency Allocation",
};

const timelineActionColors: Record<string, string> = {
  submitted: "bg-blue-500",
  pending: "bg-amber-500",
  under_review: "bg-purple-500",
  approved: "bg-emerald-500",
  rejected: "bg-red-500",
  cancelled: "bg-gray-500",
  escalated: "bg-orange-500",
  executed: "bg-cyan-500",
  info_requested: "bg-indigo-500",
};

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

const departments = ["engineering", "support", "sales", "finance", "admin", "management", "hr", "it", "operations", "network"];

export default function AssetRequestsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useTab("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState<AssetRequest | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailRequest, setDetailRequest] = useState<AssetRequest | null>(null);
  const [approvalDialog, setApprovalDialog] = useState<{ request: AssetRequest; action: string } | null>(null);
  const [approvalComment, setApprovalComment] = useState("");

  const { data: allRequests = [], isLoading } = useQuery<AssetRequest[]>({
    queryKey: ["/api/asset-requests"],
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: requestHistory = [] } = useQuery<AssetRequestHistory[]>({
    queryKey: ["/api/asset-request-history", detailRequest?.id],
    queryFn: () => detailRequest ? apiRequest("GET", `/api/asset-request-history/${detailRequest.id}`).then(r => r.json()) : Promise.resolve([]),
    enabled: !!detailRequest,
  });

  const filteredRequests = useMemo(() => {
    let list = allRequests;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(r =>
        r.requestId.toLowerCase().includes(s) ||
        r.requestedBy.toLowerCase().includes(s) ||
        r.department.toLowerCase().includes(s) ||
        r.justification?.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== "all") list = list.filter(r => r.status === statusFilter);
    if (typeFilter !== "all") list = list.filter(r => r.requestType === typeFilter);
    if (priorityFilter !== "all") list = list.filter(r => r.priority === priorityFilter);
    if (deptFilter !== "all") list = list.filter(r => r.department === deptFilter);
    return list;
  }, [allRequests, searchTerm, statusFilter, typeFilter, priorityFilter, deptFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = allRequests.filter(r => {
      if (!r.createdAt) return false;
      const d = new Date(r.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return {
      totalThisMonth: thisMonth.length,
      pending: allRequests.filter(r => r.status === "pending" || r.status === "under_review").length,
      approved: allRequests.filter(r => r.status === "approved" || r.status === "executed").length,
      rejected: allRequests.filter(r => r.status === "rejected").length,
      escalated: allRequests.filter(r => r.status === "escalated").length,
      totalValue: allRequests.reduce((s, r) => s + parseFloat(r.estimatedValue || "0"), 0),
    };
  }, [allRequests]);

  const chartData = useMemo(() => {
    const byType = Object.entries(requestTypeLabels).map(([key, label]) => ({
      name: label.replace("Asset ", "").replace("Request", "").trim(),
      value: allRequests.filter(r => r.requestType === key).length,
    })).filter(d => d.value > 0);

    const byDept = departments.map(d => ({
      name: d.charAt(0).toUpperCase() + d.slice(1),
      value: allRequests.filter(r => r.department === d).length,
    })).filter(d => d.value > 0);

    const rejectionRate = allRequests.length > 0
      ? Math.round((allRequests.filter(r => r.status === "rejected").length / allRequests.length) * 100)
      : 0;

    return { byType, byDept, rejectionRate };
  }, [allRequests]);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      requestType: "",
      assetType: "",
      department: "",
      requestedBy: "",
      priority: "normal",
      justification: "",
      requireMultiLevel: false,
      isEmergency: false,
      notifyDeptHead: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: RequestFormValues) => {
      const requestId = `REQ-${Date.now().toString(36).toUpperCase()}`;
      const res = await apiRequest("POST", "/api/asset-requests", {
        ...data,
        requestId,
        status: data.isEmergency ? "pending" : "draft",
        currentApprovalStage: "pending",
        approvalLevel: data.requireMultiLevel ? 3 : 1,
        currentLevel: 0,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-requests"] });
      toast({ title: "Request submitted successfully" });
      setShowRequestForm(false);
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: "Failed to submit request", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RequestFormValues & { status?: string; approvedBy?: string; rejectedBy?: string; rejectionReason?: string }> }) => {
      const res = await apiRequest("PATCH", `/api/asset-requests/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-requests"] });
      if (detailRequest) queryClient.invalidateQueries({ queryKey: ["/api/asset-request-history", detailRequest.id] });
      toast({ title: "Request updated" });
      setEditingRequest(null);
      setApprovalDialog(null);
      setApprovalComment("");
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/asset-requests/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-requests"] });
      toast({ title: "Request deleted" });
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const handleApprovalAction = (action: string) => {
    if (!approvalDialog) return;
    const { request } = approvalDialog;
    const data: any = { notes: approvalComment };
    if (action === "approved") {
      data.status = "approved";
      data.approvedBy = "admin";
      data.currentLevel = request.approvalLevel;
    } else if (action === "rejected") {
      data.status = "rejected";
      data.rejectedBy = "admin";
      data.rejectionReason = approvalComment;
    } else if (action === "under_review") {
      data.status = "under_review";
    } else if (action === "escalated") {
      data.status = "escalated";
      data.currentLevel = (request.currentLevel || 0) + 1;
    } else if (action === "info_requested") {
      data.status = "pending";
      data.notes = `Info requested: ${approvalComment}`;
    }
    updateMutation.mutate({ id: request.id, data });
  };

  const handleOpenForm = () => {
    form.reset({
      requestType: "",
      assetType: "",
      department: "",
      requestedBy: "",
      priority: "normal",
      justification: "",
      requireMultiLevel: false,
      isEmergency: false,
      notifyDeptHead: false,
    });
    setEditingRequest(null);
    setShowRequestForm(true);
  };

  const handleEditRequest = (req: AssetRequest) => {
    form.reset({
      requestType: req.requestType,
      assetType: req.assetType,
      assetId: req.assetId,
      fromLocation: req.fromLocation || "",
      toLocation: req.toLocation || "",
      department: req.department,
      requestedBy: req.requestedBy,
      priority: req.priority,
      justification: req.justification,
      estimatedValue: req.estimatedValue || "0",
      requiredByDate: req.requiredByDate || "",
      requireMultiLevel: req.requireMultiLevel,
      isEmergency: req.isEmergency,
      notifyDeptHead: req.notifyDeptHead,
      notes: req.notes || "",
    });
    setEditingRequest(req);
    setShowRequestForm(true);
  };

  const onSubmit = (values: RequestFormValues) => {
    if (editingRequest) {
      updateMutation.mutate({ id: editingRequest.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const pendingRequests = useMemo(() =>
    allRequests.filter(r => r.status === "pending" || r.status === "under_review" || r.status === "escalated"),
    [allRequests]
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 page-fade-in">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 page-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-900 to-emerald-600 bg-clip-text text-transparent" data-testid="text-page-title">
            Asset Request & Approvals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage, review, and authorize all asset-related requests
          </p>
        </div>
        <Button
          onClick={handleOpenForm}
          className="bg-gradient-to-r from-indigo-700 to-emerald-600 hover:from-indigo-800 hover:to-emerald-700 text-white"
          data-testid="button-new-request"
        >
          <Plus className="h-4 w-4 mr-2" /> New Request
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-400 text-white border-0 shadow-lg" data-testid="card-stat-total">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-indigo-100">This Month</p>
                <p className="text-2xl font-bold">{stats.totalThisMonth}</p>
              </div>
              <Clipboard className="h-8 w-8 text-indigo-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400 text-white border-0 shadow-lg" data-testid="card-stat-pending">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-100">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-green-400 text-white border-0 shadow-lg" data-testid="card-stat-approved">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-100">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-600 via-red-500 to-rose-400 text-white border-0 shadow-lg" data-testid="card-stat-rejected">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-100">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 text-white border-0 shadow-lg" data-testid="card-stat-escalated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-100">Escalated</p>
                <p className="text-2xl font-bold">{stats.escalated}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-400 text-white border-0 shadow-lg" data-testid="card-stat-value">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-teal-100">Est. Value</p>
                <p className="text-2xl font-bold">₨{stats.totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-teal-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-1 border-b">
        {[
          { key: "dashboard", label: "Overview", icon: BarChart3 },
          { key: "queue", label: "Pending Queue", icon: Clock },
          { key: "all", label: "All Requests", icon: Clipboard },
          { key: "approvals", label: "Approval Workflow", icon: Shield },
          { key: "audit", label: "Audit Log", icon: FileCheck },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid={`tab-${tab.key}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.key === "queue" && stats.pending > 0 && (
              <Badge className="bg-amber-500 text-white border-0 text-[10px] h-5 min-w-[20px] flex items-center justify-center">{stats.pending}</Badge>
            )}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border shadow-sm" data-testid="chart-by-type">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-indigo-600" /> Requests by Type</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.byType.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={chartData.byType} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {chartData.byType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No request data yet</div>
              )}
            </CardContent>
          </Card>
          <Card className="border shadow-sm" data-testid="chart-by-dept">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-emerald-600" /> Requests by Department</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.byDept.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.byDept}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">No department data yet</div>
              )}
            </CardContent>
          </Card>
          <Card className="border shadow-sm" data-testid="card-rejection-rate">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-red-500" /> Rejection Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="text-5xl font-bold text-red-500">{chartData.rejectionRate}%</div>
                <div className="flex-1 space-y-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3">
                    <div className="bg-red-500 h-3 rounded-full transition-all" style={{ width: `${chartData.rejectionRate}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.rejected} rejected out of {allRequests.length} total requests
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm" data-testid="card-quick-stats">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-indigo-600" /> Quick Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(requestTypeLabels).map(([key, label]) => {
                  const count = allRequests.filter(r => r.requestType === key).length;
                  return (
                    <div key={key} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                      <span className="text-muted-foreground text-xs">{label.replace("Asset ", "")}</span>
                      <Badge variant="secondary" className="text-xs">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "queue" && (
        <Card className="border shadow-sm" data-testid="card-pending-queue">
          <CardHeader className="pb-3 bg-gradient-to-r from-indigo-900 to-emerald-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" /> Pending Requests Queue
              </CardTitle>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">{pendingRequests.length} awaiting</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-300" />
                <p className="font-medium">All clear!</p>
                <p className="text-xs mt-1">No pending requests to review.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(req => {
                  const sc = statusConfig[req.status] || statusConfig.pending;
                  const StatusIcon = sc.icon;
                  const pc = priorityConfig[req.priority] || priorityConfig.normal;
                  return (
                    <div key={req.id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow" data-testid={`queue-item-${req.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-medium text-indigo-600 dark:text-indigo-400">{req.requestId}</span>
                          <Badge className={`${sc.color} border-0 text-[10px] gap-1`}><StatusIcon className="h-3 w-3" />{sc.label}</Badge>
                          <Badge className={`${pc.color} border-0 text-[10px]`}>{pc.label}</Badge>
                          {req.isEmergency && <Badge className="bg-red-500 text-white border-0 text-[10px]"><Zap className="h-3 w-3 mr-1" />Emergency</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground">{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : ""}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-xs mb-3">
                        <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{requestTypeLabels[req.requestType] || req.requestType}</span></div>
                        <div><span className="text-muted-foreground">Department:</span> <span className="font-medium capitalize">{req.department}</span></div>
                        <div><span className="text-muted-foreground">Requested By:</span> <span className="font-medium">{req.requestedBy}</span></div>
                        <div><span className="text-muted-foreground">Est. Value:</span> <span className="font-medium">₨{parseFloat(req.estimatedValue || "0").toLocaleString()}</span></div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{req.justification}</p>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setApprovalDialog({ request: req, action: "approved" }); setApprovalComment(""); }} data-testid={`action-approve-${req.id}`}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => { setApprovalDialog({ request: req, action: "rejected" }); setApprovalComment(""); }} data-testid={`action-reject-${req.id}`}>
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setApprovalDialog({ request: req, action: "under_review" }); setApprovalComment(""); }}>
                          <Eye className="h-3 w-3 mr-1" /> Review
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setApprovalDialog({ request: req, action: "escalated" }); setApprovalComment(""); }}>
                          <ArrowUpRight className="h-3 w-3 mr-1" /> Escalate
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto" onClick={() => setDetailRequest(req)}>
                          <Eye className="h-3 w-3 mr-1" /> Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "all" && (
        <Card className="border shadow-sm" data-testid="card-all-requests">
          <CardHeader className="pb-3 bg-gradient-to-r from-indigo-900 to-emerald-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Clipboard className="h-4 w-4" /> All Requests</CardTitle>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">{filteredRequests.length} records</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search requests..." className="pl-9 h-9 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} data-testid="input-search" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-9 text-sm" data-testid="select-status"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px] h-9 text-sm" data-testid="select-type"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(requestTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[130px] h-9 text-sm" data-testid="select-priority"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-[140px] h-9 text-sm" data-testid="select-dept"><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Depts</SelectItem>
                  {departments.map(d => <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white text-xs">
                    <th className="text-left p-3 rounded-tl-lg font-medium">Request ID</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Asset</th>
                    <th className="text-left p-3 font-medium">Department</th>
                    <th className="text-left p-3 font-medium">Requested By</th>
                    <th className="text-left p-3 font-medium">Priority</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Stage</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 rounded-tr-lg font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-muted-foreground">
                        <Clipboard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="font-medium">No requests found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((r, idx) => {
                      const sc = statusConfig[r.status] || statusConfig.draft;
                      const StatusIcon = sc.icon;
                      const pc = priorityConfig[r.priority] || priorityConfig.normal;
                      return (
                        <tr key={r.id} className={`border-b border-border/50 hover:bg-accent/50 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/20"}`} data-testid={`row-request-${r.id}`}>
                          <td className="p-3 font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400">{r.requestId}</td>
                          <td className="p-3 text-xs">{requestTypeLabels[r.requestType] || r.requestType}</td>
                          <td className="p-3 text-xs">{r.assetType}</td>
                          <td className="p-3 text-xs capitalize">{r.department}</td>
                          <td className="p-3 text-xs">{r.requestedBy}</td>
                          <td className="p-3">
                            <Badge className={`${pc.color} border-0 text-[10px]`}>
                              {r.isEmergency && <Zap className="h-3 w-3 mr-1" />}
                              {pc.label}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                          <td className="p-3 text-xs">
                            <span className="font-mono">{r.currentLevel || 0}/{r.approvalLevel}</span>
                          </td>
                          <td className="p-3">
                            <Badge className={`${sc.color} border-0 text-[10px] gap-1`}><StatusIcon className="h-3 w-3" />{sc.label}</Badge>
                          </td>
                          <td className="p-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-actions-${r.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDetailRequest(r)}><Eye className="h-4 w-4 mr-2" /> View Details</DropdownMenuItem>
                                {(r.status === "draft" || r.status === "pending") && (
                                  <DropdownMenuItem onClick={() => handleEditRequest(r)}><Edit className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {(r.status === "pending" || r.status === "under_review") && (
                                  <>
                                    <DropdownMenuItem onClick={() => { setApprovalDialog({ request: r, action: "approved" }); setApprovalComment(""); }}><CheckCircle className="h-4 w-4 mr-2 text-emerald-600" /> Approve</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setApprovalDialog({ request: r, action: "rejected" }); setApprovalComment(""); }}><XCircle className="h-4 w-4 mr-2 text-red-600" /> Reject</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setApprovalDialog({ request: r, action: "escalated" }); setApprovalComment(""); }}><ArrowUpRight className="h-4 w-4 mr-2 text-orange-600" /> Escalate</DropdownMenuItem>
                                  </>
                                )}
                                {r.status === "draft" && (
                                  <DropdownMenuItem onClick={() => updateMutation.mutate({ id: r.id, data: { status: "pending" } })}><Send className="h-4 w-4 mr-2" /> Submit for Approval</DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "approvals" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border shadow-sm" data-testid="card-approval-workflow">
              <CardHeader className="pb-3 bg-gradient-to-r from-indigo-900 to-emerald-700 text-white rounded-t-lg">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4" /> Approval Workflow Panel</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="mb-6 p-4 rounded-lg bg-muted/50 border">
                  <h4 className="text-sm font-semibold mb-3">Standard Approval Flow</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {["Technician", "Inventory Manager", "Network Manager", "Finance Manager", "Admin"].map((role, i, arr) => (
                      <div key={role} className="flex items-center gap-2">
                        <div className="px-3 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs font-medium text-indigo-700 dark:text-indigo-400">
                          {role}
                        </div>
                        {i < arr.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Finance Manager approves when value exceeds threshold. Admin has final override authority.</p>
                </div>

                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm">No requests awaiting approval</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map(req => {
                      const sc = statusConfig[req.status] || statusConfig.pending;
                      const StatusIcon = sc.icon;
                      return (
                        <div key={req.id} className="p-3 rounded-lg border hover:bg-accent/30 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400">{req.requestId}</span>
                              <Badge className={`${sc.color} border-0 text-[10px] gap-1`}><StatusIcon className="h-3 w-3" />{sc.label}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Level {req.currentLevel || 0} of {req.approvalLevel}</span>
                              <div className="w-16 bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
                                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${req.approvalLevel > 0 ? ((req.currentLevel || 0) / req.approvalLevel) * 100 : 0}%` }} />
                              </div>
                            </div>
                          </div>
                          <p className="text-xs mb-2"><span className="text-muted-foreground">Type:</span> {requestTypeLabels[req.requestType]} • <span className="text-muted-foreground">By:</span> {req.requestedBy} • <span className="text-muted-foreground">Dept:</span> <span className="capitalize">{req.department}</span></p>
                          <div className="flex gap-2">
                            <Button size="sm" className="h-6 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setApprovalDialog({ request: req, action: "approved" }); setApprovalComment(""); }}>Approve</Button>
                            <Button size="sm" variant="destructive" className="h-6 text-[11px]" onClick={() => { setApprovalDialog({ request: req, action: "rejected" }); setApprovalComment(""); }}>Reject</Button>
                            <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={() => { setApprovalDialog({ request: req, action: "info_requested" }); setApprovalComment(""); }}>Request Info</Button>
                            <Button size="sm" variant="ghost" className="h-6 text-[11px] ml-auto" onClick={() => setDetailRequest(req)}>View</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="border shadow-sm" data-testid="card-approval-stats">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-indigo-600" /> Approval Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(statusConfig).map(([key, cfg]) => {
                    const count = allRequests.filter(r => r.status === key).length;
                    const Icon = cfg.icon;
                    return (
                      <div key={key} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs">{cfg.label}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <Card className="border shadow-sm" data-testid="card-audit-log">
          <CardHeader className="pb-3 bg-gradient-to-r from-indigo-900 to-emerald-700 text-white rounded-t-lg">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><FileCheck className="h-4 w-4" /> Audit & Decision Log</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {allRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileCheck className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-medium">No audit entries yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allRequests.slice(0, 30).map(req => {
                  const sc = statusConfig[req.status] || statusConfig.draft;
                  const StatusIcon = sc.icon;
                  return (
                    <div key={req.id} className="p-3 rounded-lg border bg-muted/30" data-testid={`audit-entry-${req.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400">{req.requestId}</span>
                          <Badge className={`${sc.color} border-0 text-[10px] gap-1`}><StatusIcon className="h-3 w-3" />{sc.label}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{req.createdAt ? new Date(req.createdAt).toLocaleString() : ""}</span>
                      </div>
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <p><span className="font-medium text-foreground">Type:</span> {requestTypeLabels[req.requestType]} | <span className="font-medium text-foreground">By:</span> {req.requestedBy} | <span className="font-medium text-foreground">Dept:</span> <span className="capitalize">{req.department}</span></p>
                        {req.approvedBy && <p><span className="font-medium text-emerald-600">Approved by:</span> {req.approvedBy}</p>}
                        {req.rejectedBy && <p><span className="font-medium text-red-600">Rejected by:</span> {req.rejectedBy} — {req.rejectionReason}</p>}
                        {req.justification && <p><span className="font-medium text-foreground">Justification:</span> {req.justification}</p>}
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 text-[11px] mt-2" onClick={() => setDetailRequest(req)}>
                        <Eye className="h-3 w-3 mr-1" /> View Full Audit Trail
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-indigo-600" />
              {editingRequest ? "Edit Request" : "New Asset Request"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 border-b pb-1">Request Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="requestType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Type *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger data-testid="select-request-type"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Object.entries(requestTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="assetType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Type *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger data-testid="select-asset-type"><SelectValue placeholder="Select asset type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="ONU">ONU</SelectItem>
                          <SelectItem value="Router">Router</SelectItem>
                          <SelectItem value="CPE">CPE</SelectItem>
                          <SelectItem value="Switch">Switch</SelectItem>
                          <SelectItem value="Modem">Modem</SelectItem>
                          <SelectItem value="Fiber Cable">Fiber Cable</SelectItem>
                          <SelectItem value="Power Equipment">Power Equipment</SelectItem>
                          <SelectItem value="IT Hardware">IT Hardware</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 border-b pb-1">Location & Assignment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="fromLocation" render={({ field }) => (
                    <FormItem><FormLabel>From Location</FormLabel><FormControl><Input {...field} placeholder="Source location" data-testid="input-from-location" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="toLocation" render={({ field }) => (
                    <FormItem><FormLabel>To Location</FormLabel><FormControl><Input {...field} placeholder="Destination location" data-testid="input-to-location" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="department" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger data-testid="select-department"><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {departments.map(d => <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="requestedBy" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requested By *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger data-testid="select-requester"><SelectValue placeholder="Select requester" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {employees.map(e => <SelectItem key={e.id} value={e.fullName}>{e.fullName} ({e.empCode})</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 border-b pb-1">Priority & Financials</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="priority" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger data-testid="select-priority"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="estimatedValue" render={({ field }) => (
                    <FormItem><FormLabel>Estimated Value Impact</FormLabel><FormControl><Input type="number" step="0.01" {...field} placeholder="0.00" data-testid="input-value" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="requiredByDate" render={({ field }) => (
                    <FormItem><FormLabel>Required By Date</FormLabel><FormControl><Input type="date" {...field} data-testid="input-required-date" /></FormControl></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="justification" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Justification *</FormLabel>
                    <FormControl><Textarea {...field} placeholder="Explain the business reason for this request..." rows={3} data-testid="textarea-justification" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 border-b pb-1">Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="requireMultiLevel" render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-multi-level" /></FormControl>
                      <FormLabel className="text-xs font-normal">Multi-Level Approval</FormLabel>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="isEmergency" render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-emergency" /></FormControl>
                      <FormLabel className="text-xs font-normal">Mark as Emergency</FormLabel>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="notifyDeptHead" render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-notify" /></FormControl>
                      <FormLabel className="text-xs font-normal">Notify Department Head</FormLabel>
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} placeholder="Additional notes..." rows={2} data-testid="textarea-notes" /></FormControl></FormItem>
                )} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowRequestForm(false)} data-testid="button-cancel">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-gradient-to-r from-indigo-700 to-emerald-600 text-white" data-testid="button-submit">
                  {(createMutation.isPending || updateMutation.isPending) && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  {editingRequest ? "Update Request" : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailRequest} onOpenChange={() => setDetailRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-indigo-600" />
              Request Details — {detailRequest?.requestId}
            </DialogTitle>
          </DialogHeader>
          {detailRequest && (() => {
            const sc = statusConfig[detailRequest.status] || statusConfig.draft;
            const StatusIcon = sc.icon;
            const pc = priorityConfig[detailRequest.priority] || priorityConfig.normal;
            return (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge className={`${sc.color} border-0 gap-1`}><StatusIcon className="h-3 w-3" />{sc.label}</Badge>
                  <Badge className={`${pc.color} border-0`}>{pc.label}</Badge>
                  {detailRequest.isEmergency && <Badge className="bg-red-500 text-white border-0"><Zap className="h-3 w-3 mr-1" />Emergency</Badge>}
                  {detailRequest.requireMultiLevel && <Badge variant="outline">Multi-Level</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Request Type</p><p className="font-medium">{requestTypeLabels[detailRequest.requestType]}</p></div>
                  <div><p className="text-xs text-muted-foreground">Asset Type</p><p className="font-medium">{detailRequest.assetType}</p></div>
                  <div><p className="text-xs text-muted-foreground">Department</p><p className="font-medium capitalize">{detailRequest.department}</p></div>
                  <div><p className="text-xs text-muted-foreground">Requested By</p><p className="font-medium">{detailRequest.requestedBy}</p></div>
                  <div><p className="text-xs text-muted-foreground">From</p><p>{detailRequest.fromLocation || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">To</p><p>{detailRequest.toLocation || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Estimated Value</p><p>₨{parseFloat(detailRequest.estimatedValue || "0").toLocaleString()}</p></div>
                  <div><p className="text-xs text-muted-foreground">Required By</p><p>{detailRequest.requiredByDate || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Approval Progress</p><p className="font-mono">{detailRequest.currentLevel || 0} / {detailRequest.approvalLevel}</p></div>
                  <div><p className="text-xs text-muted-foreground">Submitted</p><p>{detailRequest.createdAt ? new Date(detailRequest.createdAt).toLocaleString() : "—"}</p></div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Justification</p>
                  <p className="text-sm bg-muted/50 rounded p-3">{detailRequest.justification}</p>
                </div>
                {detailRequest.approvedBy && <div><p className="text-xs text-muted-foreground">Approved By</p><p className="text-sm text-emerald-600 font-medium">{detailRequest.approvedBy}</p></div>}
                {detailRequest.rejectedBy && (
                  <div>
                    <p className="text-xs text-muted-foreground">Rejected By</p>
                    <p className="text-sm text-red-600 font-medium">{detailRequest.rejectedBy}</p>
                    {detailRequest.rejectionReason && <p className="text-sm bg-red-50 dark:bg-red-950/20 rounded p-2 mt-1">{detailRequest.rejectionReason}</p>}
                  </div>
                )}

                {requestHistory.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-indigo-600" /> Decision Timeline</h4>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                      <div className="space-y-3">
                        {requestHistory.map(entry => {
                          const dotColor = timelineActionColors[entry.action] || "bg-gray-400";
                          return (
                            <div key={entry.id} className="relative pl-10">
                              <div className={`absolute left-[10px] top-1.5 w-3 h-3 rounded-full ${dotColor} ring-2 ring-white dark:ring-slate-900`} />
                              <div className="p-2 rounded-lg bg-muted/50 border text-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold capitalize">{entry.action.replace("_", " ")}</span>
                                  <span className="text-muted-foreground">{new Date(entry.actionDate).toLocaleString()}</span>
                                </div>
                                <p className="text-muted-foreground">By: <span className="text-foreground">{entry.actionBy}</span>{entry.role ? ` (${entry.role})` : ""}</p>
                                {entry.comments && <p className="mt-1">{entry.comments}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <Dialog open={!!approvalDialog} onOpenChange={() => { setApprovalDialog(null); setApprovalComment(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approvalDialog?.action === "approved" && <><CheckCircle className="h-5 w-5 text-emerald-600" /> Approve Request</>}
              {approvalDialog?.action === "rejected" && <><XCircle className="h-5 w-5 text-red-600" /> Reject Request</>}
              {approvalDialog?.action === "under_review" && <><Eye className="h-5 w-5 text-purple-600" /> Mark Under Review</>}
              {approvalDialog?.action === "escalated" && <><ArrowUpRight className="h-5 w-5 text-orange-600" /> Escalate Request</>}
              {approvalDialog?.action === "info_requested" && <><MessageSquare className="h-5 w-5 text-indigo-600" /> Request More Information</>}
            </DialogTitle>
          </DialogHeader>
          {approvalDialog && (
            <div className="space-y-4">
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Request: <span className="font-mono font-medium text-foreground">{approvalDialog.request.requestId}</span></p>
                <p className="text-muted-foreground">Type: <span className="text-foreground">{requestTypeLabels[approvalDialog.request.requestType]}</span></p>
              </div>
              <div>
                <label className="text-sm font-medium">
                  {approvalDialog.action === "rejected" ? "Rejection Reason *" : "Comments"}
                </label>
                <Textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder={approvalDialog.action === "rejected" ? "Provide reason for rejection..." : "Add comments..."}
                  rows={3}
                  data-testid="textarea-approval-comment"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setApprovalDialog(null); setApprovalComment(""); }}>Cancel</Button>
                <Button
                  onClick={() => handleApprovalAction(approvalDialog.action)}
                  disabled={approvalDialog.action === "rejected" && !approvalComment.trim()}
                  className={
                    approvalDialog.action === "approved" ? "bg-emerald-600 hover:bg-emerald-700 text-white" :
                    approvalDialog.action === "rejected" ? "bg-red-600 hover:bg-red-700 text-white" :
                    "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }
                  data-testid="button-confirm-action"
                >
                  {updateMutation.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Confirm
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-red-600 hover:bg-red-700" data-testid="button-confirm-delete">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
