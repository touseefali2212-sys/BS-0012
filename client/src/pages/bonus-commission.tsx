import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Gift,
  TrendingUp,
  Users,
  DollarSign,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Award,
  Target,
  Banknote,
  FileText,
  Printer,
  Settings2,
  Zap,
  Cable,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

const typeLabels: Record<string, string> = {
  fixed_bonus: "Fixed Bonus",
  performance_bonus: "Performance Bonus",
  sales_commission: "Sales Commission",
  collection_commission: "Collection Commission",
  installation_commission: "Installation Commission",
  custom_incentive: "Custom Incentive",
};

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
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

const incentiveTypeColors: Record<string, string> = {
  bonus: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  commission: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
};

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(mo) - 1]} ${y}`;
}

export default function BonusCommissionPage() {
  const { toast } = useToast();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const [typesDialog, setTypesDialog] = useState(false);
  const [typeFormDialog, setTypeFormDialog] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [ctName, setCtName] = useState("");
  const [ctCode, setCtCode] = useState("");
  const [ctCategory, setCtCategory] = useState("commission");
  const [ctAmount, setCtAmount] = useState("");
  const [ctCalcMode, setCtCalcMode] = useState("fixed");
  const [ctPercentage, setCtPercentage] = useState("");
  const [ctDescription, setCtDescription] = useState("");
  const [ctIsAutomatic, setCtIsAutomatic] = useState(false);
  const [ctTriggerEvent, setCtTriggerEvent] = useState("");
  const [ctStatus, setCtStatus] = useState("active");

  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formType, setFormType] = useState("fixed_bonus");
  const [formIncentiveType, setFormIncentiveType] = useState("bonus");
  const [formAmount, setFormAmount] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formTargetValue, setFormTargetValue] = useState("");
  const [formAchievedValue, setFormAchievedValue] = useState("");
  const [formCommissionRate, setFormCommissionRate] = useState("");
  const [formLinkedSource, setFormLinkedSource] = useState("");
  const [formLinkedAmount, setFormLinkedAmount] = useState("");
  const [formIncludeInPayroll, setFormIncludeInPayroll] = useState("yes");
  const [formPayrollMonth, setFormPayrollMonth] = useState(currentMonth);
  const [formRemarks, setFormRemarks] = useState("");

  const { data: allData = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/bonus-commissions?month=${selectedMonth}`],
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  const { data: commissionTypesData = [] } = useQuery<any[]>({
    queryKey: ["/api/commission-types"],
  });

  const getTypeLabel = (type: string): string => {
    if (typeLabels[type]) return typeLabels[type];
    if (type.startsWith("custom__")) {
      const id = parseInt(type.replace("custom__", ""));
      const ct = (commissionTypesData as any[]).find((c: any) => c.id === id);
      return ct ? ct.name : type;
    }
    return type;
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/bonus-commissions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bonus-commissions?month=${selectedMonth}`] });
      toast({ title: "Created", description: "Bonus/Commission entry created successfully" });
      setAddDialog(false);
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => await apiRequest("PATCH", `/api/bonus-commissions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bonus-commissions?month=${selectedMonth}`] });
      toast({ title: "Updated", description: "Entry updated successfully" });
      setEditDialog(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await apiRequest("DELETE", `/api/bonus-commissions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bonus-commissions?month=${selectedMonth}`] });
      toast({ title: "Deleted", description: "Entry deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => await apiRequest("POST", `/api/bonus-commissions/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bonus-commissions?month=${selectedMonth}`] });
      toast({ title: "Approved", description: "Entry approved successfully" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => await apiRequest("POST", `/api/bonus-commissions/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bonus-commissions?month=${selectedMonth}`] });
      toast({ title: "Rejected", description: "Entry rejected" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: number) => await apiRequest("POST", `/api/bonus-commissions/${id}/mark-paid`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/bonus-commissions?month=${selectedMonth}`] });
      toast({ title: "Paid", description: "Entry marked as paid" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createTypeMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/commission-types", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commission-types"] });
      toast({ title: "Created", description: "Commission type created successfully" });
      setTypeFormDialog(false);
      resetTypeForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => await apiRequest("PATCH", `/api/commission-types/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commission-types"] });
      toast({ title: "Updated", description: "Commission type updated successfully" });
      setTypeFormDialog(false);
      setEditingType(null);
      resetTypeForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: number) => await apiRequest("DELETE", `/api/commission-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commission-types"] });
      toast({ title: "Deleted", description: "Commission type deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    let result = allData;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r: any) => r.employeeName?.toLowerCase().includes(q) || r.empCode?.toLowerCase().includes(q) || r.reason?.toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") result = result.filter((r: any) => r.type === filterType);
    if (filterStatus !== "all") result = result.filter((r: any) => r.status === filterStatus);
    if (filterDept !== "all") result = result.filter((r: any) => r.department === filterDept);
    return result;
  }, [allData, searchQuery, filterType, filterStatus, filterDept]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalBonus = allData.filter((r: any) => r.incentiveType === "bonus").reduce((s: number, r: any) => s + Number(r.amount), 0);
  const totalCommission = allData.filter((r: any) => r.incentiveType === "commission").reduce((s: number, r: any) => s + Number(r.amount), 0);
  const pendingCount = allData.filter((r: any) => r.status === "pending").length;
  const topEmployee = useMemo(() => {
    const empTotals: Record<string, { name: string; total: number }> = {};
    allData.forEach((r: any) => {
      if (!empTotals[r.employeeId]) empTotals[r.employeeId] = { name: r.employeeName || "Unknown", total: 0 };
      empTotals[r.employeeId].total += Number(r.amount);
    });
    const sorted = Object.values(empTotals).sort((a, b) => b.total - a.total);
    return sorted[0] || null;
  }, [allData]);
  const totalExpense = allData.filter((r: any) => r.status === "paid").reduce((s: number, r: any) => s + Number(r.amount), 0);

  function resetForm() {
    setFormEmployeeId("");
    setFormType("fixed_bonus");
    setFormIncentiveType("bonus");
    setFormAmount("");
    setFormReason("");
    setFormTargetValue("");
    setFormAchievedValue("");
    setFormCommissionRate("");
    setFormLinkedSource("");
    setFormLinkedAmount("");
    setFormIncludeInPayroll("yes");
    setFormPayrollMonth(currentMonth);
    setFormRemarks("");
  }

  function resetTypeForm() {
    setCtName("");
    setCtCode("");
    setCtCategory("commission");
    setCtAmount("");
    setCtCalcMode("fixed");
    setCtPercentage("");
    setCtDescription("");
    setCtIsAutomatic(false);
    setCtTriggerEvent("");
    setCtStatus("active");
  }

  function openEditType(ct: any) {
    setEditingType(ct);
    setCtName(ct.name || "");
    setCtCode(ct.code || "");
    setCtCategory(ct.category || "commission");
    setCtAmount(ct.amount || "");
    setCtCalcMode(ct.calculationMode || "fixed");
    setCtPercentage(ct.percentage || "");
    setCtDescription(ct.description || "");
    setCtIsAutomatic(ct.isAutomatic || false);
    setCtTriggerEvent(ct.triggerEvent || "");
    setCtStatus(ct.status || "active");
    setTypeFormDialog(true);
  }

  function handleTypeSubmit() {
    if (!ctName || !ctCode) {
      toast({ title: "Error", description: "Name and code are required", variant: "destructive" });
      return;
    }
    const data = {
      name: ctName,
      code: ctCode,
      category: ctCategory,
      amount: ctAmount || "0",
      calculationMode: ctCalcMode,
      percentage: ctCalcMode === "percentage" ? ctPercentage : null,
      description: ctDescription || null,
      isAutomatic: ctIsAutomatic,
      triggerEvent: ctIsAutomatic ? ctTriggerEvent : null,
      status: ctStatus,
    };
    if (editingType) {
      updateTypeMutation.mutate({ id: editingType.id, data });
    } else {
      createTypeMutation.mutate(data);
    }
  }

  function calcAutoAmount(): string {
    if (formType === "performance_bonus" && formTargetValue && formAchievedValue) {
      const target = Number(formTargetValue);
      const achieved = Number(formAchievedValue);
      if (target > 0) {
        const pct = (achieved / target) * 100;
        if (pct >= 100) return String(Number(formAmount) || 0);
        return String(Math.round(Number(formAmount || 0) * (pct / 100)));
      }
    }
    if ((formType === "sales_commission" || formType === "collection_commission") && formLinkedAmount && formCommissionRate) {
      return String(Math.round(Number(formLinkedAmount) * (Number(formCommissionRate) / 100)));
    }
    return formAmount;
  }

  function handleSubmit() {
    if (!formEmployeeId) {
      toast({ title: "Error", description: "Select an employee", variant: "destructive" });
      return;
    }
    const autoAmt = calcAutoAmount();
    const data = {
      employeeId: parseInt(formEmployeeId),
      type: formType,
      incentiveType: formType.includes("commission") ? "commission" : "bonus",
      amount: autoAmt || formAmount || "0",
      calculatedAmount: autoAmt || formAmount || "0",
      reason: formReason,
      month: selectedMonth,
      targetValue: formTargetValue || null,
      achievedValue: formAchievedValue || null,
      commissionRate: formCommissionRate || null,
      linkedSource: formLinkedSource || null,
      linkedAmount: formLinkedAmount || null,
      includeInPayroll: formIncludeInPayroll === "yes",
      payrollMonth: formPayrollMonth || selectedMonth,
      status: "pending",
      requestedBy: "Admin",
      remarks: formRemarks || null,
    };
    createMutation.mutate(data);
  }

  function handleUpdate() {
    if (!selectedEntry) return;
    const autoAmt = calcAutoAmount();
    const data = {
      type: formType,
      incentiveType: formType.includes("commission") ? "commission" : "bonus",
      amount: autoAmt || formAmount || "0",
      calculatedAmount: autoAmt || formAmount || "0",
      reason: formReason,
      targetValue: formTargetValue || null,
      achievedValue: formAchievedValue || null,
      commissionRate: formCommissionRate || null,
      linkedSource: formLinkedSource || null,
      linkedAmount: formLinkedAmount || null,
      includeInPayroll: formIncludeInPayroll === "yes",
      payrollMonth: formPayrollMonth,
      remarks: formRemarks || null,
    };
    updateMutation.mutate({ id: selectedEntry.id, data });
  }

  function openEdit(entry: any) {
    setSelectedEntry(entry);
    setFormEmployeeId(String(entry.employeeId));
    setFormType(entry.type);
    setFormIncentiveType(entry.incentiveType);
    setFormAmount(entry.amount);
    setFormReason(entry.reason || "");
    setFormTargetValue(entry.targetValue || "");
    setFormAchievedValue(entry.achievedValue || "");
    setFormCommissionRate(entry.commissionRate || "");
    setFormLinkedSource(entry.linkedSource || "");
    setFormLinkedAmount(entry.linkedAmount || "");
    setFormIncludeInPayroll(entry.includeInPayroll ? "yes" : "no");
    setFormPayrollMonth(entry.payrollMonth || selectedMonth);
    setFormRemarks(entry.remarks || "");
    setEditDialog(true);
  }

  const activeEmployees = employees.filter((e: any) => e.status === "active");

  const deptDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    allData.forEach((r: any) => {
      const dept = r.department || "other";
      map[dept] = (map[dept] || 0) + Number(r.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [allData]);

  const topEmployees = useMemo(() => {
    const map: Record<string, { name: string; total: number }> = {};
    allData.forEach((r: any) => {
      if (!map[r.employeeId]) map[r.employeeId] = { name: r.employeeName || "Unknown", total: 0 };
      map[r.employeeId].total += Number(r.amount);
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [allData]);

  if (isLoading) {
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

  const formFields = (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Employee Information</p>
        </div>
        {!editDialog && (
          <div className="col-span-2">
            <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Employee</label>
            <Select value={formEmployeeId} onValueChange={setFormEmployeeId}>
              <SelectTrigger className="h-9 text-[13px]" data-testid="select-employee">
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map((e: any) => (
                  <SelectItem key={e.id} value={String(e.id)} data-testid={`option-employee-${e.id}`}>
                    {e.empCode} - {e.fullName} ({e.department})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="col-span-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-2 mb-2">Incentive Details</p>
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Type</label>
          <Select value={formType} onValueChange={(v) => {
            setFormType(v);
            const customType = commissionTypesData.find((ct: any) => `custom__${ct.id}` === v);
            if (customType) {
              setFormIncentiveType(customType.category === "commission" ? "commission" : "bonus");
              if (customType.amount && Number(customType.amount) > 0) {
                setFormAmount(String(Number(customType.amount)));
              }
            } else {
              setFormIncentiveType(v.includes("commission") ? "commission" : "bonus");
            }
          }}>
            <SelectTrigger className="h-9 text-[13px]" data-testid="select-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed_bonus">Fixed Bonus</SelectItem>
              <SelectItem value="performance_bonus">Performance Bonus</SelectItem>
              <SelectItem value="sales_commission">Sales Commission</SelectItem>
              <SelectItem value="collection_commission">Collection Commission</SelectItem>
              <SelectItem value="installation_commission">Installation Commission</SelectItem>
              <SelectItem value="custom_incentive">Custom Incentive</SelectItem>
              {commissionTypesData.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-t mt-1 pt-2">Custom Types</div>
                  {commissionTypesData.map((ct: any) => (
                    <SelectItem key={ct.id} value={`custom__${ct.id}`}>
                      {ct.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Amount (Rs.)</label>
          <Input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="h-9 text-[13px]" placeholder="0" data-testid="input-amount" />
          {(() => {
            const customType = formType.startsWith("custom__")
              ? (commissionTypesData as any[]).find((ct: any) => `custom__${ct.id}` === formType)
              : null;
            return customType && Number(customType.amount) > 0 ? (
              <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
                Default from type: Rs. {Number(customType.amount).toLocaleString()} — you can edit this.
              </p>
            ) : null;
          })()}
        </div>
        <div className="col-span-2">
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Reason</label>
          <Input value={formReason} onChange={e => setFormReason(e.target.value)} className="h-9 text-[13px]" placeholder="Reason for incentive" data-testid="input-reason" />
        </div>

        {formType === "performance_bonus" && (
          <>
            <div className="col-span-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-2 mb-2">Performance Calculation</p>
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Target Value</label>
              <Input type="number" value={formTargetValue} onChange={e => setFormTargetValue(e.target.value)} className="h-9 text-[13px]" placeholder="100" data-testid="input-target" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Achieved Value</label>
              <Input type="number" value={formAchievedValue} onChange={e => setFormAchievedValue(e.target.value)} className="h-9 text-[13px]" placeholder="85" data-testid="input-achieved" />
            </div>
            {formTargetValue && formAchievedValue && (
              <div className="col-span-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                  Achievement: {((Number(formAchievedValue) / Number(formTargetValue)) * 100).toFixed(1)}%
                  → Calculated: Rs. {calcAutoAmount()}
                </p>
              </div>
            )}
          </>
        )}

        {(formType === "sales_commission" || formType === "collection_commission") && (
          <>
            <div className="col-span-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-2 mb-2">Commission Calculation</p>
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Linked Source</label>
              <Input value={formLinkedSource} onChange={e => setFormLinkedSource(e.target.value)} className="h-9 text-[13px]" placeholder="Invoice/Collection ref" data-testid="input-linked-source" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Source Amount (Rs.)</label>
              <Input type="number" value={formLinkedAmount} onChange={e => setFormLinkedAmount(e.target.value)} className="h-9 text-[13px]" placeholder="0" data-testid="input-linked-amount" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Commission Rate (%)</label>
              <Input type="number" value={formCommissionRate} onChange={e => setFormCommissionRate(e.target.value)} className="h-9 text-[13px]" placeholder="5" data-testid="input-commission-rate" />
            </div>
            {formLinkedAmount && formCommissionRate && (
              <div className="bg-teal-50 dark:bg-teal-950/30 rounded-lg p-3">
                <p className="text-[11px] text-teal-700 dark:text-teal-300 font-medium">
                  Commission: Rs. {formLinkedAmount} × {formCommissionRate}% = Rs. {calcAutoAmount()}
                </p>
              </div>
            )}
          </>
        )}

        <div className="col-span-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-2 mb-2">Payroll Integration</p>
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Include in Payroll</label>
          <Select value={formIncludeInPayroll} onValueChange={setFormIncludeInPayroll}>
            <SelectTrigger className="h-9 text-[13px]" data-testid="select-include-payroll">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Payroll Month</label>
          <Input type="month" value={formPayrollMonth} onChange={e => setFormPayrollMonth(e.target.value)} className="h-9 text-[13px]" data-testid="input-payroll-month" />
        </div>
        <div className="col-span-2">
          <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Remarks</label>
          <Textarea value={formRemarks} onChange={e => setFormRemarks(e.target.value)} className="text-[13px] min-h-[60px]" placeholder="Additional notes..." data-testid="input-remarks" />
        </div>
      </div>
    </>
  );

  return (
    <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground" data-testid="text-page-title">Bonus & Commission Management</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Performance incentives, bonuses & commission tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5 text-[11px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
            onClick={() => { resetForm(); setAddDialog(true); }}
            data-testid="button-add-bonus"
          >
            <Plus className="h-3.5 w-3.5" /> Add Bonus / Commission
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-[11px]"
            onClick={() => setTypesDialog(true)}
            data-testid="button-manage-types"
          >
            <Settings2 className="h-3.5 w-3.5" /> Manage Types
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-[11px]" data-testid="button-export">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="enterprise-card" data-testid="card-total-bonus">
            <CardContent className="py-3.5 px-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Bonus</p>
                  <p className="text-lg font-bold mt-1 text-purple-600 dark:text-purple-400 tabular-nums" data-testid="text-total-bonus">Rs. {totalBonus.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="enterprise-card" data-testid="card-total-commission">
            <CardContent className="py-3.5 px-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Commission</p>
                  <p className="text-lg font-bold mt-1 text-teal-600 dark:text-teal-400 tabular-nums" data-testid="text-total-commission">Rs. {totalCommission.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="enterprise-card" data-testid="card-pending-approvals">
            <CardContent className="py-3.5 px-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pending Approvals</p>
                  <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400" data-testid="text-pending-count">{pendingCount}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="enterprise-card" data-testid="card-top-performer">
            <CardContent className="py-3.5 px-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Top Performer</p>
                  {topEmployee ? (
                    <>
                      <p className="text-[13px] font-bold mt-1 text-foreground truncate max-w-[120px]" data-testid="text-top-employee">{topEmployee.name}</p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">Rs. {topEmployee.total.toLocaleString()}</p>
                    </>
                  ) : (
                    <p className="text-[13px] mt-1 text-muted-foreground" data-testid="text-top-employee">--</p>
                  )}
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                  <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="enterprise-card" data-testid="card-paid-expense">
            <CardContent className="py-3.5 px-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Paid Expense</p>
                  <p className="text-lg font-bold mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums" data-testid="text-paid-expense">Rs. {totalExpense.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="enterprise-card">
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Month</label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={e => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
                className="h-9 text-[13px] w-[170px]"
                data-testid="input-filter-month"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Type</label>
              <Select value={filterType} onValueChange={v => { setFilterType(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 text-[13px] w-[160px]" data-testid="select-filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="fixed_bonus">Fixed Bonus</SelectItem>
                  <SelectItem value="performance_bonus">Performance Bonus</SelectItem>
                  <SelectItem value="sales_commission">Sales Commission</SelectItem>
                  <SelectItem value="collection_commission">Collection Commission</SelectItem>
                  <SelectItem value="custom_incentive">Custom Incentive</SelectItem>
                  {commissionTypesData.map((ct: any) => (
                    <SelectItem key={ct.id} value={`custom__${ct.id}`}>{ct.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</label>
              <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 text-[13px] w-[130px]" data-testid="select-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Department</label>
              <Select value={filterDept} onValueChange={v => { setFilterDept(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 text-[13px] w-[140px]" data-testid="select-filter-dept">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Depts</SelectItem>
                  {["engineering", "support", "sales", "finance", "admin", "management", "hr", "it", "operations"].map(d => (
                    <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1" />
            <div className="flex flex-col gap-1 justify-end">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                <Input
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="h-9 text-[13px] pl-8 w-[200px]"
                  placeholder="Search name, code..."
                  data-testid="input-search"
                />
              </div>
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
                <th className="text-left py-2.5 px-3 font-semibold">Employee</th>
                <th className="text-left py-2.5 px-3 font-semibold">Department</th>
                <th className="text-left py-2.5 px-3 font-semibold">Type</th>
                <th className="text-left py-2.5 px-3 font-semibold">Linked Source</th>
                <th className="text-right py-2.5 px-3 font-semibold">Amount</th>
                <th className="text-center py-2.5 px-3 font-semibold">Month</th>
                <th className="text-center py-2.5 px-3 font-semibold">Status</th>
                <th className="text-left py-2.5 px-3 font-semibold">Approved By</th>
                <th className="text-center py-2.5 px-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Gift className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-[13px] font-medium">No bonus or commission entries</p>
                      <p className="text-[11px]">Click "Add Bonus / Commission" to create one</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((entry: any, idx: number) => (
                  <tr
                    key={entry.id}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "bg-background" : "bg-muted/10"}`}
                    data-testid={`row-bonus-${entry.id}`}
                  >
                    <td className="py-2 px-3 text-muted-foreground">{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td className="py-2 px-3">
                      <div>
                        <p className="font-medium text-foreground" data-testid={`text-name-${entry.id}`}>{entry.employeeName}</p>
                        <p className="text-[10px] text-muted-foreground">{entry.empCode}</p>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant="secondary" className={`text-[10px] font-medium border-0 ${deptColors[entry.department] || deptColors.admin}`}>
                        {entry.department}
                      </Badge>
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant="secondary" className={`text-[10px] font-medium border-0 ${incentiveTypeColors[entry.incentiveType] || incentiveTypeColors.bonus}`}>
                        {getTypeLabel(entry.type)}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{entry.linkedSource || "—"}</td>
                    <td className="py-2 px-3 text-right font-bold tabular-nums text-foreground" data-testid={`text-amount-${entry.id}`}>
                      Rs. {Number(entry.amount).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center text-muted-foreground">{monthLabel(entry.month)}</td>
                    <td className="py-2 px-3 text-center">
                      <Badge variant="secondary" className={`text-[10px] font-semibold border-0 capitalize ${statusColors[entry.status] || statusColors.draft}`} data-testid={`badge-status-${entry.id}`}>
                        {entry.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-muted-foreground text-[11px]">{entry.approvedBy || "—"}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="outline" size="sm" className="px-2 text-blue-600" onClick={() => { setSelectedEntry(entry); setViewDialog(true); }} data-testid={`button-view-${entry.id}`}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        {entry.status !== "paid" && (
                          <Button variant="outline" size="sm" className="px-2 text-amber-600" onClick={() => openEdit(entry)} data-testid={`button-edit-${entry.id}`}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {entry.status === "pending" && (
                          <>
                            <Button variant="outline" size="sm" className="px-2 text-emerald-600" onClick={() => approveMutation.mutate(entry.id)} data-testid={`button-approve-${entry.id}`}>
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" className="px-2 text-red-600" onClick={() => rejectMutation.mutate(entry.id)} data-testid={`button-reject-${entry.id}`}>
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {entry.status === "approved" && (
                          <Button variant="outline" size="sm" className="px-2 text-emerald-600" onClick={() => markPaidMutation.mutate(entry.id)} data-testid={`button-mark-paid-${entry.id}`}>
                            <Banknote className="h-3 w-3" />
                          </Button>
                        )}
                        {(entry.status === "draft" || entry.status === "pending") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-2 text-red-600"
                            onClick={() => { if (confirm("Delete this entry?")) deleteMutation.mutate(entry.id); }}
                            data-testid={`button-delete-${entry.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-[11px] text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="px-2" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} data-testid="button-first-page">
                First
              </Button>
              <Button variant="outline" size="sm" className="px-2" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} data-testid="button-prev-page">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                if (page > totalPages) return null;
                return (
                  <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm" className="px-2.5 min-w-[32px]" onClick={() => setCurrentPage(page)} data-testid={`button-page-${page}`}>
                    {page}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" className="px-2" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} data-testid="button-next-page">
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="px-2" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} data-testid="button-last-page">
                Last
              </Button>
            </div>
          </div>
        )}
      </Card>

      {allData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="enterprise-card">
            <CardContent className="py-4 px-4">
              <p className="text-[13px] font-bold text-foreground mb-3">Department-wise Distribution</p>
              <div className="space-y-2">
                {deptDistribution.map(([dept, amount]) => {
                  const maxAmt = deptDistribution[0]?.[1] || 1;
                  const pct = (amount / maxAmt) * 100;
                  return (
                    <div key={dept} className="flex items-center gap-3">
                      <Badge variant="secondary" className={`text-[10px] font-medium border-0 w-[90px] justify-center ${deptColors[dept] || deptColors.admin}`}>
                        {dept}
                      </Badge>
                      <div className="flex-1 h-5 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold tabular-nums text-foreground w-[80px] text-right">Rs. {amount.toLocaleString()}</span>
                    </div>
                  );
                })}
                {deptDistribution.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">No data</p>}
              </div>
            </CardContent>
          </Card>
          <Card className="enterprise-card">
            <CardContent className="py-4 px-4">
              <p className="text-[13px] font-bold text-foreground mb-3">Top 5 Employees by Incentive</p>
              <div className="space-y-2.5">
                {topEmployees.map((emp, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white ${
                      i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-600" : "bg-slate-300 dark:bg-slate-600"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-foreground truncate">{emp.name}</p>
                    </div>
                    <span className="text-[12px] font-bold tabular-nums text-foreground">Rs. {emp.total.toLocaleString()}</span>
                  </div>
                ))}
                {topEmployees.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">No data</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-600" /> Add Bonus / Commission
            </DialogTitle>
            <DialogDescription className="text-[12px]">Create a new incentive entry for {monthLabel(selectedMonth)}</DialogDescription>
          </DialogHeader>
          {formFields}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setAddDialog(false)} data-testid="button-cancel-add">Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={createMutation.isPending} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0" data-testid="button-submit-add">
              {createMutation.isPending ? "Saving..." : "Submit for Approval"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Edit className="h-5 w-5 text-amber-600" /> Edit Entry
            </DialogTitle>
            <DialogDescription className="text-[12px]">
              Editing incentive for {selectedEntry?.employeeName}
            </DialogDescription>
          </DialogHeader>
          {formFields}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setEditDialog(false)} data-testid="button-cancel-edit">Cancel</Button>
            <Button size="sm" onClick={handleUpdate} disabled={updateMutation.isPending} data-testid="button-submit-edit">
              {updateMutation.isPending ? "Saving..." : "Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" /> Incentive Details
            </DialogTitle>
            <DialogDescription className="text-[12px]">Full breakdown for {selectedEntry?.employeeName}</DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-xl p-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Employee</p>
                  <p className="text-[13px] font-bold text-foreground">{selectedEntry.employeeName}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedEntry.empCode}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Department</p>
                  <Badge variant="secondary" className={`text-[10px] font-medium border-0 mt-1 ${deptColors[selectedEntry.department] || deptColors.admin}`}>
                    {selectedEntry.department}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Designation</p>
                  <p className="text-[12px] font-medium text-foreground">{selectedEntry.designation}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Month</p>
                  <p className="text-[12px] font-medium text-foreground">{monthLabel(selectedEntry.month)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-xl p-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Type</p>
                  <Badge variant="secondary" className={`text-[10px] font-medium border-0 mt-1 ${incentiveTypeColors[selectedEntry.incentiveType] || incentiveTypeColors.bonus}`}>
                    {getTypeLabel(selectedEntry.type)}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Amount</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">Rs. {Number(selectedEntry.amount).toLocaleString()}</p>
                </div>
                {selectedEntry.linkedSource && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Linked Source</p>
                    <p className="text-[12px] font-medium text-foreground">{selectedEntry.linkedSource}</p>
                  </div>
                )}
                {selectedEntry.linkedAmount && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Source Amount</p>
                    <p className="text-[12px] font-medium text-foreground">Rs. {Number(selectedEntry.linkedAmount).toLocaleString()}</p>
                  </div>
                )}
                {selectedEntry.commissionRate && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Commission Rate</p>
                    <p className="text-[12px] font-medium text-foreground">{selectedEntry.commissionRate}%</p>
                  </div>
                )}
                {selectedEntry.targetValue && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Target / Achieved</p>
                    <p className="text-[12px] font-medium text-foreground">
                      {Number(selectedEntry.achievedValue).toLocaleString()} / {Number(selectedEntry.targetValue).toLocaleString()}
                      <span className="text-muted-foreground ml-1">
                        ({((Number(selectedEntry.achievedValue) / Number(selectedEntry.targetValue)) * 100).toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-xl p-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
                  <Badge variant="secondary" className={`text-[10px] font-semibold border-0 mt-1 capitalize ${statusColors[selectedEntry.status]}`}>
                    {selectedEntry.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Payroll Integration</p>
                  <p className="text-[12px] font-medium text-foreground">{selectedEntry.includeInPayroll ? "Yes" : "No"} — {selectedEntry.payrollMonth ? monthLabel(selectedEntry.payrollMonth) : "N/A"}</p>
                </div>
                {selectedEntry.requestedBy && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Requested By</p>
                    <p className="text-[12px] font-medium text-foreground">{selectedEntry.requestedBy}</p>
                  </div>
                )}
                {selectedEntry.approvedBy && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Approved By</p>
                    <p className="text-[12px] font-medium text-foreground">{selectedEntry.approvedBy}</p>
                  </div>
                )}
                {selectedEntry.approvalDate && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Approval Date</p>
                    <p className="text-[12px] font-medium text-foreground">{selectedEntry.approvalDate}</p>
                  </div>
                )}
                {selectedEntry.paidDate && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Paid Date</p>
                    <p className="text-[12px] font-medium text-foreground">{selectedEntry.paidDate}</p>
                  </div>
                )}
              </div>

              {selectedEntry.reason && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Reason</p>
                  <p className="text-[12px] text-foreground">{selectedEntry.reason}</p>
                </div>
              )}

              {selectedEntry.remarks && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Remarks</p>
                  <p className="text-[12px] text-foreground">{selectedEntry.remarks}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {selectedEntry.status === "pending" && (
                  <>
                    <Button size="sm" className="gap-1.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { approveMutation.mutate(selectedEntry.id); setViewDialog(false); }} data-testid="button-view-approve">
                      <CheckCircle className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1.5 text-[11px]" onClick={() => { rejectMutation.mutate(selectedEntry.id); setViewDialog(false); }} data-testid="button-view-reject">
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </>
                )}
                {selectedEntry.status === "approved" && (
                  <Button size="sm" className="gap-1.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { markPaidMutation.mutate(selectedEntry.id); setViewDialog(false); }} data-testid="button-view-mark-paid">
                    <Banknote className="h-3.5 w-3.5" /> Mark as Paid
                  </Button>
                )}
                <Button variant="outline" size="sm" className="gap-1.5 text-[11px]" onClick={() => window.print()} data-testid="button-print-detail">
                  <Printer className="h-3.5 w-3.5" /> Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={typesDialog} onOpenChange={setTypesDialog}>
        <DialogContent className="max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold" data-testid="text-types-title">Bonus & Commission Types</DialogTitle>
            <DialogDescription className="text-[12px]">Configure bonus and commission types with their amounts and automation rules</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-muted-foreground">{commissionTypesData.length} type(s) configured</p>
              <Button size="sm" className="gap-1.5 text-[11px]" onClick={() => { resetTypeForm(); setEditingType(null); setTypeFormDialog(true); }} data-testid="button-add-type">
                <Plus className="h-3.5 w-3.5" /> Add Type
              </Button>
            </div>
            {commissionTypesData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Settings2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-[13px]">No bonus/commission types configured yet</p>
                <p className="text-[11px] mt-1">Add types to define amounts and automation rules</p>
              </div>
            ) : (
              <div className="space-y-2">
                {commissionTypesData.map((ct: any) => (
                  <div key={ct.id} className="border rounded-lg p-3 flex items-center justify-between gap-3" data-testid={`card-type-${ct.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-foreground">{ct.name}</p>
                        <Badge variant="outline" className="text-[10px]">{ct.code}</Badge>
                        <Badge className={`text-[10px] ${ct.category === "bonus" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" : "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300"}`}>
                          {ct.category}
                        </Badge>
                        {ct.isAutomatic && (
                          <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 gap-0.5">
                            <Zap className="h-2.5 w-2.5" /> Auto
                          </Badge>
                        )}
                        <Badge className={`text-[10px] ${ct.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                          {ct.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-[12px] text-muted-foreground">
                          {ct.calculationMode === "fixed" ? `Rs. ${Number(ct.amount).toLocaleString()} (Fixed)` : `${ct.percentage}% of Amount`}
                        </p>
                        {ct.triggerEvent && (
                          <p className="text-[11px] text-blue-600 dark:text-blue-400">Trigger: {ct.triggerEvent.replace(/_/g, " ")}</p>
                        )}
                        {ct.description && <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{ct.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditType(ct)} data-testid={`button-edit-type-${ct.id}`}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteTypeMutation.mutate(ct.id)} data-testid={`button-delete-type-${ct.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={typeFormDialog} onOpenChange={setTypeFormDialog}>
        <DialogContent className="max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold" data-testid="text-type-form-title">{editingType ? "Edit" : "Add"} Bonus/Commission Type</DialogTitle>
            <DialogDescription className="text-[12px]">Define the type, amount, and automation settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Name</label>
                <Input value={ctName} onChange={e => setCtName(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. Customer Installation Commission" data-testid="input-type-name" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Code</label>
                <Input value={ctCode} onChange={e => setCtCode(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. INSTALL_COMM" data-testid="input-type-code" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Category</label>
                <Select value={ctCategory} onValueChange={setCtCategory}>
                  <SelectTrigger className="h-9 text-[13px]" data-testid="select-type-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bonus">Bonus</SelectItem>
                    <SelectItem value="commission">Commission</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Calculation Mode</label>
                <Select value={ctCalcMode} onValueChange={setCtCalcMode}>
                  <SelectTrigger className="h-9 text-[13px]" data-testid="select-calc-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {ctCalcMode === "fixed" ? (
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Amount (Rs.)</label>
                  <Input type="number" value={ctAmount} onChange={e => setCtAmount(e.target.value)} className="h-9 text-[13px]" placeholder="0" data-testid="input-type-amount" />
                </div>
              ) : (
                <div>
                  <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Percentage (%)</label>
                  <Input type="number" value={ctPercentage} onChange={e => setCtPercentage(e.target.value)} className="h-9 text-[13px]" placeholder="5" data-testid="input-type-percentage" />
                </div>
              )}
              <div className="col-span-2">
                <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Description</label>
                <Input value={ctDescription} onChange={e => setCtDescription(e.target.value)} className="h-9 text-[13px]" placeholder="Description of this type" data-testid="input-type-description" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Status</label>
                <Select value={ctStatus} onValueChange={setCtStatus}>
                  <SelectTrigger className="h-9 text-[13px]" data-testid="select-type-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-5">
                <Switch checked={ctIsAutomatic} onCheckedChange={setCtIsAutomatic} id="auto-switch" data-testid="switch-automatic" />
                <label htmlFor="auto-switch" className="text-[12px] font-medium text-muted-foreground cursor-pointer">Automatic</label>
              </div>
              {ctIsAutomatic && (
                <div className="col-span-2">
                  <label className="text-[12px] font-medium text-muted-foreground mb-1 block">Trigger Event</label>
                  <Select value={ctTriggerEvent} onValueChange={setCtTriggerEvent}>
                    <SelectTrigger className="h-9 text-[13px]" data-testid="select-trigger-event">
                      <SelectValue placeholder="Select trigger event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer_installation">Customer Installation (New Connection)</SelectItem>
                      <SelectItem value="customer_renewal">Customer Renewal</SelectItem>
                      <SelectItem value="customer_upgrade">Customer Package Upgrade</SelectItem>
                      <SelectItem value="invoice_collection">Invoice Collection</SelectItem>
                    </SelectContent>
                  </Select>
                  {ctTriggerEvent === "customer_installation" && (
                    <div className="mt-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Cable className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <p className="text-[11px] font-medium text-blue-700 dark:text-blue-300">Customer Installation Commission</p>
                      </div>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400">
                        Commission will be automatically added to the employee specified in the "Connected By" field when a new customer is created.
                        {ctCalcMode === "fixed"
                          ? ` Each installation earns Rs. ${Number(ctAmount || 0).toLocaleString()}.`
                          : ` Each installation earns ${ctPercentage || 0}% of the customer's monthly bill.`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" className="text-[11px]" onClick={() => setTypeFormDialog(false)} data-testid="button-type-cancel">Cancel</Button>
              <Button size="sm" className="text-[11px] gap-1.5" onClick={handleTypeSubmit} disabled={createTypeMutation.isPending || updateTypeMutation.isPending} data-testid="button-type-save">
                <CheckCircle className="h-3.5 w-3.5" /> {editingType ? "Update" : "Create"} Type
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}