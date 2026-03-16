import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Download,
  Edit,
  Save,
  FileText,
  IdCard,
  Calendar,
  Activity,
  Wallet,
  Building2,
  UserCheck,
  Briefcase,
  Heart,
  Globe,
  AlertCircle,
  Clock,
  CreditCard,
  StickyNote,
  ChevronRight,
  Printer,
  X,
  Check,
  MoreHorizontal,
  BadgeCheck,
  BanknoteIcon,
  History,
  Key,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertEmployeeSchema, insertSalaryHistorySchema, type Employee, type InsertEmployee, type SalaryHistory, type InsertSalaryHistory } from "@shared/schema";

const statusColors: Record<string, string> = {
  active: "text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-700",
  on_leave: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-700",
  terminated: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-700",
};

const departmentLabels: Record<string, string> = {
  engineering: "Engineering", support: "Support", sales: "Sales",
  finance: "Finance", admin: "Admin", management: "Management",
  hr: "HR", it: "IT", operations: "Operations",
};

const tabs = ["Employee Information", "Personal Information", "Salary History", "App Login Detail"] as const;
type Tab = typeof tabs[number];

function InfoRow({ label, value, colSpan }: { label: string; value?: string | null; colSpan?: boolean }) {
  return (
    <div className={`flex gap-2 py-2.5 px-4 items-start ${colSpan ? "col-span-2" : ""} border-b border-border last:border-0`}>
      <span className="text-sm text-muted-foreground font-medium min-w-[140px] flex-shrink-0">{label}</span>
      <span className="text-muted-foreground mx-1">:</span>
      <span className="text-sm font-medium flex-1">{value || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
    </div>
  );
}

export default function EmployeeProfilePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("Employee Information");
  const [editOpen, setEditOpen] = useState(false);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<SalaryHistory | null>(null);
  const [salaryMonthFilter, setSalaryMonthFilter] = useState("");
  const [salaryFromDate, setSalaryFromDate] = useState("");
  const [salaryToDate, setSalaryToDate] = useState("");
  const [salarySearch, setSalarySearch] = useState("");
  const [salaryPageSize, setSalaryPageSize] = useState(10);
  const [salaryPage, setSalaryPage] = useState(1);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [epPayAmount, setEpPayAmount] = useState("");
  const [epPayMethod, setEpPayMethod] = useState("bank");
  const [epPayRef, setEpPayRef] = useState("");
  const [epPayRemarks, setEpPayRemarks] = useState("");
  const [epPayMonth, setEpPayMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: ["/api/employees", id],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Employee not found");
      return res.json();
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertEmployee>) => {
      const res = await apiRequest("PATCH", `/api/employees/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setEditOpen(false);
      toast({ title: "Employee updated successfully" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const { data: salaryHistoryData, isLoading: salaryLoading } = useQuery<SalaryHistory[]>({
    queryKey: ["/api/employees", id, "salary-history"],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${id}/salary-history`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch salary history");
      return res.json();
    },
    enabled: !!id,
  });

  const createSalaryMutation = useMutation({
    mutationFn: async (data: InsertSalaryHistory) => {
      const res = await apiRequest("POST", "/api/salary-history", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", id, "salary-history"] });
      setSalaryDialogOpen(false);
      setEditingSalary(null);
      salaryForm.reset();
      toast({ title: "Salary entry added successfully" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateSalaryMutation = useMutation({
    mutationFn: async ({ sid, data }: { sid: number; data: Partial<InsertSalaryHistory> }) => {
      const res = await apiRequest("PATCH", `/api/salary-history/${sid}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", id, "salary-history"] });
      setSalaryDialogOpen(false);
      setEditingSalary(null);
      salaryForm.reset();
      toast({ title: "Salary entry updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const paySalaryMutation = useMutation({
    mutationFn: async (data: { employeeId: number; month: string; amount: string; method: string; ref: string; remarks: string }) => {
      const payrollRes = await apiRequest("POST", "/api/payroll", {
        employeeId: data.employeeId,
        payrollMonth: data.month,
        baseSalary: data.amount,
        netSalary: data.amount,
        status: "processed",
      });
      const payrollEntry = await payrollRes.json();
      await apiRequest("POST", `/api/payroll/${payrollEntry.id}/payments`, {
        amount: data.amount,
        paymentMethod: data.method,
        paymentRef: data.ref,
        remarks: data.remarks || undefined,
      });
      return payrollEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", id, "salary-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/pending-summary"] });
      setPayDialogOpen(false);
      setEpPayAmount("");
      setEpPayMethod("bank");
      setEpPayRef("");
      setEpPayRemarks("");
      toast({ title: "Salary Paid", description: "Salary payment recorded successfully" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteSalaryMutation = useMutation({
    mutationFn: async (sid: number) => {
      await apiRequest("DELETE", `/api/salary-history/${sid}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", id, "salary-history"] });
      toast({ title: "Salary entry deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const salaryForm = useForm<InsertSalaryHistory>({
    defaultValues: {
      employeeId: id,
      salaryDate: new Date().toISOString().split("T")[0],
      salaryMonth: "",
      paidAmount: "0",
      overtime: "0",
      incentive: "0",
      bonus: "0",
      overall: "0",
      remarks: "",
      givenBy: "",
    },
  });

  const openAddSalary = () => {
    setEditingSalary(null);
    salaryForm.reset({
      employeeId: id,
      salaryDate: new Date().toISOString().split("T")[0],
      salaryMonth: "",
      paidAmount: employee?.salary || "0",
      overtime: "0",
      incentive: "0",
      bonus: "0",
      overall: "0",
      remarks: "",
      givenBy: "",
    });
    setSalaryDialogOpen(true);
  };

  const openEditSalary = (entry: SalaryHistory) => {
    setEditingSalary(entry);
    salaryForm.reset({
      employeeId: entry.employeeId,
      salaryDate: entry.salaryDate,
      salaryMonth: entry.salaryMonth,
      paidAmount: entry.paidAmount || "0",
      overtime: entry.overtime || "0",
      incentive: entry.incentive || "0",
      bonus: entry.bonus || "0",
      overall: entry.overall || "0",
      remarks: entry.remarks || "",
      givenBy: entry.givenBy || "",
    });
    setSalaryDialogOpen(true);
  };

  const onSalarySubmit = (data: InsertSalaryHistory) => {
    if (editingSalary) {
      updateSalaryMutation.mutate({ sid: editingSalary.id, data });
    } else {
      createSalaryMutation.mutate({ ...data, employeeId: id });
    }
  };

  const editForm = useForm<InsertEmployee>({
    defaultValues: {},
  });

  const openEdit = () => {
    if (!employee) return;
    editForm.reset({
      empCode: employee.empCode,
      fullName: employee.fullName,
      email: employee.email || "",
      phone: employee.phone,
      cnic: employee.cnic || "",
      department: employee.department,
      designation: employee.designation,
      joinDate: employee.joinDate || "",
      salary: employee.salary || "",
      bankAccount: employee.bankAccount || "",
      address: employee.address || "",
      status: employee.status,
      gender: (employee as any).gender || "",
      dateOfBirth: (employee as any).dateOfBirth || "",
      maritalStatus: (employee as any).maritalStatus || "",
      fatherName: (employee as any).fatherName || "",
      guardianPhone: (employee as any).guardianPhone || "",
      bloodGroup: (employee as any).bloodGroup || "",
      religion: (employee as any).religion || "",
      nationality: (employee as any).nationality || "",
      emergencyContact: (employee as any).emergencyContact || "",
      emergencyPhone: (employee as any).emergencyPhone || "",
      city: (employee as any).city || "",
      country: (employee as any).country || "",
      bankName: (employee as any).bankName || "",
      bankBranch: (employee as any).bankBranch || "",
      salaryType: (employee as any).salaryType || "monthly",
      employmentType: (employee as any).employmentType || "full_time",
      shift: (employee as any).shift || "morning",
      workLocation: (employee as any).workLocation || "",
      reportingTo: (employee as any).reportingTo || "",
      probationEndDate: (employee as any).probationEndDate || "",
      confirmationDate: (employee as any).confirmationDate || "",
    });
    setEditOpen(true);
  };

  const onEditSubmit = (data: InsertEmployee) => {
    updateMutation.mutate(data);
  };

  const handlePrint = () => {
    if (!employee) return;
    const emp = employee as any;
    const dept = departmentLabels[employee.department] || employee.department;
    const salaryEntries = salaryHistoryData || [];
    const esc = (v: any) => String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const salaryRows = salaryEntries.map((e, i) =>
      `<tr${i % 2 === 1 ? ' class="alt"' : ""}>
        <td>${i + 1}</td><td>${esc(e.salaryDate)}</td><td>${esc(e.salaryMonth)}</td>
        <td class="r">${Number(e.paidAmount || 0).toLocaleString()}</td>
        <td class="r">${Number(e.overtime || 0).toLocaleString()}</td>
        <td class="r">${Number(e.incentive || 0).toLocaleString()}</td>
        <td class="r">${Number(e.bonus || 0).toLocaleString()}</td>
        <td class="r b">${Number(e.overall || 0).toLocaleString()}</td>
        <td>${esc(e.remarks) || "—"}</td><td>${esc(e.givenBy) || "—"}</td>
      </tr>`
    ).join("");
    const salaryTotals = {
      paid: salaryEntries.reduce((s, e) => s + Number(e.paidAmount || 0), 0),
      overtime: salaryEntries.reduce((s, e) => s + Number(e.overtime || 0), 0),
      incentive: salaryEntries.reduce((s, e) => s + Number(e.incentive || 0), 0),
      bonus: salaryEntries.reduce((s, e) => s + Number(e.bonus || 0), 0),
      overall: salaryEntries.reduce((s, e) => s + Number(e.overall || 0), 0),
    };
    let qualsHtml = "";
    if (emp.qualifications) {
      try {
        const qs = JSON.parse(emp.qualifications);
        if (qs.length > 0) {
          qualsHtml = `<h3>Qualifications</h3><table><tr><th>Degree</th><th>Institution</th><th>Year</th><th>Grade</th></tr>${qs.map((q: any) => `<tr><td>${esc(q.degree) || "—"}</td><td>${esc(q.institution) || "—"}</td><td>${esc(q.year) || "—"}</td><td>${esc(q.grade) || "—"}</td></tr>`).join("")}</table>`;
        }
      } catch {}
    }
    let expHtml = "";
    if (emp.experiences) {
      try {
        const xs = JSON.parse(emp.experiences);
        if (xs.length > 0) {
          expHtml = `<h3>Work Experience</h3><table><tr><th>Company</th><th>Position</th><th>From</th><th>To</th><th>Reason</th></tr>${xs.map((x: any) => `<tr><td>${x.company || "—"}</td><td>${x.position || "—"}</td><td>${x.from || "—"}</td><td>${x.to || "—"}</td><td>${x.reason || "—"}</td></tr>`).join("")}</table>`;
        }
      } catch {}
    }
    const na = (v: any) => esc(v) || "N/A";
    const htmlContent = `<!DOCTYPE html><html><head><title>Employee Profile - ${esc(employee.empCode)} - ${esc(employee.fullName)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#333;padding:20mm 15mm}
.header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1e293b;padding-bottom:12px;margin-bottom:20px}
.header h1{font-size:20px;color:#1e293b;margin:0}
.header .sub{font-size:11px;color:#666;margin-top:2px}
.header .right{text-align:right}
.header .code{font-family:monospace;font-size:14px;font-weight:bold;color:#1e293b;background:#f1f5f9;padding:4px 10px;border-radius:4px;border:1px solid #e2e8f0}
.section{margin-bottom:18px}
h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#fff;background:#1e293b;padding:8px 14px;margin-bottom:0;border-radius:4px 4px 0 0}
h3{font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#fff;background:#475569;padding:6px 14px;margin-top:0}
table{width:100%;border-collapse:collapse;margin-bottom:4px}
td,th{padding:6px 10px;border:1px solid #e2e8f0;text-align:left;font-size:11px}
th{background:#f1f5f9;font-weight:600;font-size:10px;text-transform:uppercase;color:#64748b}
.alt{background:#f8fafc}
.r{text-align:right;font-variant-numeric:tabular-nums}
.b{font-weight:700}
.info-grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #e2e8f0;border-top:0}
.info-grid .row{display:flex;padding:7px 14px;border-bottom:1px solid #e2e8f0;align-items:center}
.info-grid .row:nth-child(odd){background:#f8fafc}
.info-grid .row .label{min-width:130px;font-weight:600;color:#64748b;font-size:11px}
.info-grid .row .sep{margin:0 6px;color:#94a3b8}
.info-grid .row .val{font-weight:500;font-size:11px}
.salary-badge{display:inline-block;background:#dcfce7;color:#166534;padding:2px 8px;border-radius:3px;font-weight:600;font-size:11px}
.status-badge{display:inline-block;padding:2px 8px;border-radius:3px;font-weight:600;font-size:10px;text-transform:capitalize}
.status-active{background:#dcfce7;color:#166534}
.status-on_leave{background:#fef3c7;color:#92400e}
.status-terminated{background:#fee2e2;color:#991b1b}
.totals td{font-weight:700;background:#f1f5f9;border-top:2px solid #1e293b}
.agreement{margin-top:24px;border:1px solid #e2e8f0;border-radius:6px;padding:20px}
.agreement h2{margin:-20px -20px 16px;border-radius:6px 6px 0 0}
.agreement p{font-size:11px;line-height:1.7;margin-bottom:10px;text-align:justify}
.sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px}
.sig-box{text-align:center}
.sig-line{border-top:1px solid #333;padding-top:6px;margin-top:40px;font-size:11px;font-weight:600}
.sig-label{font-size:10px;color:#666;margin-top:2px}
.footer{margin-top:30px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:10px;color:#999;text-align:center}
@media print{body{padding:10mm}@page{margin:10mm;size:A4}}
</style></head><body>
<div class="header">
  <div>
    <h1>NetSphere Enterprise</h1>
    <div class="sub">Employee Profile Document</div>
  </div>
  <div class="right">
    <div class="code">${esc(employee.empCode)}</div>
    <div class="sub" style="margin-top:4px">Generated: ${new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}</div>
  </div>
</div>

<div class="section">
  <h2>Employee Information</h2>
  <div class="info-grid">
    <div class="row"><span class="label">Full Name</span><span class="sep">:</span><span class="val">${esc(employee.fullName)}</span></div>
    <div class="row"><span class="label">Employee ID</span><span class="sep">:</span><span class="val">${esc(employee.empCode)}</span></div>
    <div class="row"><span class="label">Department</span><span class="sep">:</span><span class="val">${esc(dept)}</span></div>
    <div class="row"><span class="label">Designation</span><span class="sep">:</span><span class="val">${na(employee.designation)}</span></div>
    <div class="row"><span class="label">Salary</span><span class="sep">:</span><span class="val"><span class="salary-badge">Rs. ${employee.salary ? Number(employee.salary).toLocaleString() : "0"}</span></span></div>
    <div class="row"><span class="label">Mobile Number</span><span class="sep">:</span><span class="val">${na(employee.phone)}</span></div>
    <div class="row"><span class="label">Email</span><span class="sep">:</span><span class="val">${na(employee.email)}</span></div>
    <div class="row"><span class="label">CNIC / NIC</span><span class="sep">:</span><span class="val" style="font-family:monospace">${na(employee.cnic)}</span></div>
    <div class="row"><span class="label">Employment Type</span><span class="sep">:</span><span class="val" style="text-transform:capitalize">${esc((emp.employmentType || "full_time").replace("_", " "))}</span></div>
    <div class="row"><span class="label">Salary Type</span><span class="sep">:</span><span class="val" style="text-transform:capitalize">${na(emp.salaryType) || "Monthly"}</span></div>
    <div class="row"><span class="label">Join Date</span><span class="sep">:</span><span class="val">${na(employee.joinDate)}</span></div>
    <div class="row"><span class="label">Status</span><span class="sep">:</span><span class="val"><span class="status-badge status-${esc(employee.status)}">${esc(employee.status.replace("_", " "))}</span></span></div>
    <div class="row"><span class="label">Shift</span><span class="sep">:</span><span class="val">${na(emp.shift)}</span></div>
    <div class="row"><span class="label">Work Location</span><span class="sep">:</span><span class="val">${na(emp.workLocation)}</span></div>
    <div class="row"><span class="label">Reporting To</span><span class="sep">:</span><span class="val">${na(emp.reportingTo)}</span></div>
    <div class="row"><span class="label">Bank Name</span><span class="sep">:</span><span class="val">${na(emp.bankName)}</span></div>
    <div class="row"><span class="label">Bank Account</span><span class="sep">:</span><span class="val">${na(employee.bankAccount)}</span></div>
    <div class="row"><span class="label">Bank Branch</span><span class="sep">:</span><span class="val">${na(emp.bankBranch)}</span></div>
  </div>
</div>

<div class="section">
  <h2>Personal Information</h2>
  <div class="info-grid">
    <div class="row"><span class="label">Gender</span><span class="sep">:</span><span class="val" style="text-transform:capitalize">${na(emp.gender)}</span></div>
    <div class="row"><span class="label">Date of Birth</span><span class="sep">:</span><span class="val">${na(emp.dateOfBirth)}</span></div>
    <div class="row"><span class="label">Father's Name</span><span class="sep">:</span><span class="val">${na(emp.fatherName)}</span></div>
    <div class="row"><span class="label">Marital Status</span><span class="sep">:</span><span class="val" style="text-transform:capitalize">${na(emp.maritalStatus)}</span></div>
    <div class="row"><span class="label">Blood Group</span><span class="sep">:</span><span class="val">${na(emp.bloodGroup)}</span></div>
    <div class="row"><span class="label">Religion</span><span class="sep">:</span><span class="val" style="text-transform:capitalize">${na(emp.religion)}</span></div>
    <div class="row"><span class="label">Nationality</span><span class="sep">:</span><span class="val">${na(emp.nationality)}</span></div>
    <div class="row"><span class="label">Guardian Phone</span><span class="sep">:</span><span class="val">${na(emp.guardianPhone)}</span></div>
    <div class="row"><span class="label">City</span><span class="sep">:</span><span class="val">${na(emp.city)}</span></div>
    <div class="row"><span class="label">Country</span><span class="sep">:</span><span class="val">${na(emp.country)}</span></div>
  </div>
  <div class="info-grid" style="grid-template-columns:1fr;border-top:0">
    <div class="row"><span class="label">Full Address</span><span class="sep">:</span><span class="val">${na(employee.address)}</span></div>
  </div>
  <h3>Emergency Contact</h3>
  <div class="info-grid" style="border-top:0">
    <div class="row"><span class="label">Contact Name</span><span class="sep">:</span><span class="val">${na(emp.emergencyContact)}</span></div>
    <div class="row"><span class="label">Contact Phone</span><span class="sep">:</span><span class="val">${na(emp.emergencyPhone)}</span></div>
  </div>
</div>

${qualsHtml}
${expHtml}

<div class="section" style="page-break-before:auto">
  <h2>Salary History</h2>
  ${salaryEntries.length > 0 ? `<table>
    <tr><th>#</th><th>Date</th><th>Month</th><th style="text-align:right">Paid</th><th style="text-align:right">Overtime</th><th style="text-align:right">Incentive</th><th style="text-align:right">Bonus</th><th style="text-align:right">Overall</th><th>Remarks</th><th>Given By</th></tr>
    ${salaryRows}
    <tr class="totals">
      <td colspan="3" style="text-align:left;font-size:10px;text-transform:uppercase">Total</td>
      <td class="r">${salaryTotals.paid.toLocaleString()}</td>
      <td class="r">${salaryTotals.overtime.toLocaleString()}</td>
      <td class="r">${salaryTotals.incentive.toLocaleString()}</td>
      <td class="r">${salaryTotals.bonus.toLocaleString()}</td>
      <td class="r">${salaryTotals.overall.toLocaleString()}</td>
      <td colspan="2"></td>
    </tr>
  </table>` : `<div style="padding:20px;text-align:center;color:#999;font-style:italic;border:1px solid #e2e8f0;border-top:0">No salary history records</div>`}
</div>

<div class="agreement" style="page-break-before:auto">
  <h2>Employment Agreement</h2>
  <p>This document certifies that <strong>${esc(employee.fullName)}</strong> (${esc(employee.empCode)}), holder of CNIC <strong>${na(employee.cnic)}</strong>, is employed at <strong>NetSphere Enterprise</strong> in the <strong>${esc(dept)}</strong> department as <strong>${na(employee.designation)}</strong>.</p>
  <p>The employee joined the organization on <strong>${na(employee.joinDate)}</strong> with an agreed monthly salary of <strong>Rs. ${employee.salary ? Number(employee.salary).toLocaleString() : "N/A"}</strong>. The employment type is <strong style="text-transform:capitalize">${esc((emp.employmentType || "full_time").replace("_", " "))}</strong> with salary disbursed on a <strong style="text-transform:capitalize">${na(emp.salaryType) || "Monthly"}</strong> basis.</p>
  <p>Both parties agree to abide by the terms and conditions of employment as set forth by NetSphere Enterprise. The employee agrees to perform duties and responsibilities as assigned and to comply with all company policies, rules, and regulations.</p>
  <p>This agreement is subject to the labor laws and regulations of Pakistan. Either party may terminate this agreement with appropriate notice as per company policy.</p>
  <div class="sig-grid">
    <div class="sig-box">
      <div class="sig-line">Employee Signature</div>
      <div class="sig-label">${esc(employee.fullName)}</div>
    </div>
    <div class="sig-box">
      <div class="sig-line">Authorized Signatory</div>
      <div class="sig-label">NetSphere Enterprise</div>
    </div>
  </div>
</div>

<div class="footer">NetSphere Enterprise ERP — Employee Profile Document — Printed on ${new Date().toLocaleString()}</div>
</body></html>`;
    const existingFrame = document.getElementById("print-frame");
    if (existingFrame) existingFrame.remove();
    const iframe = document.createElement("iframe");
    iframe.id = "print-frame";
    iframe.style.position = "fixed";
    iframe.style.top = "-10000px";
    iframe.style.left = "-10000px";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 1000);
    }, 300);
  };

  const handleDownload = () => {
    if (!employee) return;
    const content = `EMPLOYEE PROFILE\n================\nName: ${employee.fullName}\nID: ${employee.empCode}\nDepartment: ${departmentLabels[employee.department] || employee.department}\nDesignation: ${employee.designation}\nPhone: ${employee.phone}\nEmail: ${employee.email || "N/A"}\nCNIC: ${employee.cnic || "N/A"}\nStatus: ${employee.status}\nJoin Date: ${employee.joinDate || "N/A"}\nSalary: Rs. ${employee.salary ? Number(employee.salary).toLocaleString() : "N/A"}\nAddress: ${employee.address || "N/A"}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${employee.empCode}-profile.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-5">
          <Skeleton className="h-80 w-64 flex-shrink-0" />
          <Skeleton className="h-80 flex-1" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
        <AlertCircle className="h-12 w-12 mb-3 opacity-30" />
        <p className="font-medium">Employee not found</p>
        <Link href="/hr">
          <Button variant="outline" size="sm" className="mt-4 gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to HR
          </Button>
        </Link>
      </div>
    );
  }

  const emp = employee as any;

  return (
    <div className="p-4 md:p-6 space-y-4 min-h-full bg-muted/30" data-testid="employee-profile-page">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold text-foreground">Profile</span>
          <ChevronRight className="h-3 w-3" />
          <Link href="/hr"><span className="hover:text-primary cursor-pointer">HR &amp; Payroll</span></Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/hr"><span className="hover:text-primary cursor-pointer">Employee List</span></Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Employee Profile</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={handleDownload} data-testid="button-download-profile">
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={handlePrint} data-testid="button-print-profile">
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={openEdit} data-testid="button-edit-profile">
            <Edit className="h-3.5 w-3.5" /> Edit Employee
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="w-full lg:w-64 flex-shrink-0 bg-white dark:bg-card rounded-xl border border-border shadow-sm overflow-hidden" data-testid="profile-sidebar">
          <div className="bg-gradient-to-b from-[#1e293b] to-[#334155] p-5 flex flex-col items-center gap-3">
            {emp.profilePicture ? (
              <img src={emp.profilePicture} alt={employee.fullName} className="w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-lg" data-testid="profile-photo" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center shadow-lg" data-testid="profile-avatar">
                <User className="h-12 w-12 text-white/70" />
              </div>
            )}
            <div className="text-center">
              <h3 className="font-bold text-white text-sm leading-tight">{employee.fullName}</h3>
              <p className="text-white/70 text-[11px] mt-0.5">{employee.designation}</p>
            </div>
          </div>

          <div className="p-4 border-b border-border">
            <div className="grid grid-cols-2 gap-2">
              <button
                className="flex flex-col items-center gap-1 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-center"
                onClick={() => toast({ title: "CNIC", description: employee.cnic || "No CNIC on file" })}
                data-testid="button-cnic"
              >
                <IdCard className="h-5 w-5 text-primary" />
                <span className="text-[10px] font-medium text-muted-foreground">CNIC</span>
              </button>
              <button
                className="flex flex-col items-center gap-1 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-center"
                onClick={() => toast({ title: "Joining Certificate", description: "No joining certificate on file" })}
                data-testid="button-joining-cert"
              >
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-[10px] font-medium text-muted-foreground leading-tight">Joining Cert.</span>
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {[
              { icon: User, label: "Employee Name", value: employee.fullName },
              { icon: IdCard, label: "Employee Id", value: employee.empCode },
              { icon: Calendar, label: "Date Of Birth", value: emp.dateOfBirth },
              { icon: Briefcase, label: "Department", value: departmentLabels[employee.department] || employee.department },
              { icon: Clock, label: "Join Date", value: employee.joinDate },
              { icon: Activity, label: "Status", value: null, badge: employee.status },
            ].map(({ icon: Icon, label, value, badge }) => (
              <div key={label} className="flex items-start gap-2.5" data-testid={`sidebar-${label.toLowerCase().replace(/ /g,"-")}`}>
                <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</p>
                  {badge ? (
                    <Badge variant="secondary" className={`text-[10px] capitalize mt-0.5 border ${statusColors[badge] || ""}`}>
                      {badge.replace("_", " ")}
                    </Badge>
                  ) : (
                    <p className="text-sm font-medium truncate">{value || <span className="text-muted-foreground text-xs italic">N/A</span>}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 pt-0 space-y-2">
            <Button className="w-full gap-1.5 text-xs h-9" onClick={handleDownload} data-testid="button-sidebar-download">
              <Download className="h-3.5 w-3.5" /> Download Information
            </Button>
            <Link href="/hr">
              <Button variant="outline" className="w-full gap-1.5 text-xs h-9" data-testid="button-goto-list">
                <ArrowLeft className="h-3.5 w-3.5" /> Go To Employee List
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex-1 min-w-0 bg-white dark:bg-card rounded-xl border border-border shadow-sm overflow-hidden" data-testid="profile-main">
          <div className="flex items-center border-b border-border overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
                data-testid={`tab-${tab.toLowerCase().replace(/ /g, "-")}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Employee Information" && (
            <div data-testid="tab-content-employee-info">
              <div className="bg-[#1e293b] dark:bg-slate-800 px-5 py-3">
                <h3 className="text-white font-semibold text-sm tracking-wide">Employee Information</h3>
              </div>
              <div className="divide-y divide-border">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Department</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold">{departmentLabels[employee.department] || employee.department}</span>
                  </div>
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Designation</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold">{employee.designation || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border bg-muted/20">
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Salary</span>
                    <span className="text-muted-foreground">:</span>
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        Rs. {employee.salary ? Number(employee.salary).toLocaleString() : "0.00"}
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Balance</span>
                      <span className="text-sm font-medium text-muted-foreground">
                        Rs. {employee.salary ? Number(employee.salary).toLocaleString() : "0.00"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Mobile Number</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold">{employee.phone}</span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-3 gap-3">
                  <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Email</span>
                  <span className="text-muted-foreground">:</span>
                  <span className="text-sm font-semibold">{employee.email || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border bg-muted/20">
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Employment Type</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold capitalize">{(emp.employmentType || "full_time").replace("_", " ")}</span>
                  </div>
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Salary Type</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold capitalize">{emp.salaryType || "Monthly"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Shift</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold capitalize">{emp.shift || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                  </div>
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Work Location</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold">{emp.workLocation || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border bg-muted/20">
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Reporting To</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold">{emp.reportingTo || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                  </div>
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Status</span>
                    <span className="text-muted-foreground">:</span>
                    <Badge variant="secondary" className={`text-[10px] capitalize border ${statusColors[employee.status] || ""}`}>
                      {employee.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-start px-5 py-3 gap-3">
                  <span className="text-sm text-muted-foreground font-medium min-w-[110px] pt-0.5">Note / Remark</span>
                  <span className="text-muted-foreground">:</span>
                  <span className="text-sm text-muted-foreground italic">{employee.address || "N/A"}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Personal Information" && (
            <div data-testid="tab-content-personal-info">
              <div className="bg-[#1e293b] dark:bg-slate-800 px-5 py-3">
                <h3 className="text-white font-semibold text-sm tracking-wide">Personal Information</h3>
              </div>
              <div className="divide-y divide-border">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Full Name</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold">{employee.fullName}</span>
                  </div>
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Gender</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold capitalize">{emp.gender || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border bg-muted/20">
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Date of Birth</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold">{emp.dateOfBirth || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                  </div>
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Marital Status</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold capitalize">{emp.maritalStatus || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Father's Name</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold">{emp.fatherName || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                  </div>
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">CNIC / NIC</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold font-mono">{employee.cnic || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border bg-muted/20">
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Blood Group</span>
                    <span className="text-muted-foreground">:</span>
                    {emp.bloodGroup ? (
                      <Badge className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 text-xs">{emp.bloodGroup}</Badge>
                    ) : <span className="text-muted-foreground italic text-xs">N/A</span>}
                  </div>
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Religion</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold capitalize">{emp.religion || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Nationality</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold">{emp.nationality || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                  </div>
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Guardian Phone</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold">{emp.guardianPhone || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                  </div>
                </div>
                <div className="bg-[#1e293b] dark:bg-slate-700 px-5 py-2">
                  <h4 className="text-white/80 font-semibold text-xs tracking-wide uppercase">Emergency Contact</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Contact Name</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold">{emp.emergencyContact || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                  </div>
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Contact Phone</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold">{emp.emergencyPhone || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                  </div>
                </div>
                <div className="bg-[#1e293b] dark:bg-slate-700 px-5 py-2">
                  <h4 className="text-white/80 font-semibold text-xs tracking-wide uppercase">Address & Location</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">City</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold">{emp.city || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                  </div>
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Country</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold">{emp.country || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                  </div>
                </div>
                <div className="flex items-start px-5 py-3 gap-3 bg-muted/20">
                  <span className="text-sm text-muted-foreground font-medium min-w-[110px] pt-0.5">Full Address</span>
                  <span className="text-muted-foreground">:</span>
                  <span className="text-sm">{employee.address || <span className="text-muted-foreground italic text-xs">N/A</span>}</span>
                </div>
                {(emp.qualifications) && (
                  <>
                    <div className="bg-[#1e293b] dark:bg-slate-700 px-5 py-2">
                      <h4 className="text-white/80 font-semibold text-xs tracking-wide uppercase">Qualifications</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="text-xs">Degree</TableHead>
                            <TableHead className="text-xs">Institution</TableHead>
                            <TableHead className="text-xs">Year</TableHead>
                            <TableHead className="text-xs">Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => { try { return JSON.parse(emp.qualifications); } catch { return []; } })().map((q: any, i: number) => (
                            <TableRow key={i} className="text-sm">
                              <TableCell>{q.degree || "—"}</TableCell>
                              <TableCell>{q.institution || "—"}</TableCell>
                              <TableCell>{q.year || "—"}</TableCell>
                              <TableCell>{q.grade || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
                {(emp.experiences) && (
                  <>
                    <div className="bg-[#1e293b] dark:bg-slate-700 px-5 py-2">
                      <h4 className="text-white/80 font-semibold text-xs tracking-wide uppercase">Experience</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="text-xs">Company</TableHead>
                            <TableHead className="text-xs">Position</TableHead>
                            <TableHead className="text-xs">From</TableHead>
                            <TableHead className="text-xs">To</TableHead>
                            <TableHead className="text-xs">Reason</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => { try { return JSON.parse(emp.experiences); } catch { return []; } })().map((x: any, i: number) => (
                            <TableRow key={i} className="text-sm">
                              <TableCell>{x.company || "—"}</TableCell>
                              <TableCell>{x.position || "—"}</TableCell>
                              <TableCell>{x.from || "—"}</TableCell>
                              <TableCell>{x.to || "—"}</TableCell>
                              <TableCell>{x.reason || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "Salary History" && (() => {
            const allEntries = salaryHistoryData || [];
            const months = [...new Set(allEntries.map(e => e.salaryMonth))].sort().reverse();
            const filtered = allEntries.filter(e => {
              const matchMonth = !salaryMonthFilter || e.salaryMonth === salaryMonthFilter;
              const matchFrom = !salaryFromDate || e.salaryDate >= salaryFromDate;
              const matchTo = !salaryToDate || e.salaryDate <= salaryToDate;
              const matchSearch = !salarySearch || e.salaryMonth.toLowerCase().includes(salarySearch.toLowerCase()) || (e.remarks || "").toLowerCase().includes(salarySearch.toLowerCase()) || (e.givenBy || "").toLowerCase().includes(salarySearch.toLowerCase());
              return matchMonth && matchFrom && matchTo && matchSearch;
            });
            const totalPages = Math.max(1, Math.ceil(filtered.length / salaryPageSize));
            const paginated = filtered.slice((salaryPage - 1) * salaryPageSize, salaryPage * salaryPageSize);
            const totals = {
              paid: filtered.reduce((s, e) => s + Number(e.paidAmount || 0), 0),
              overtime: filtered.reduce((s, e) => s + Number(e.overtime || 0), 0),
              incentive: filtered.reduce((s, e) => s + Number(e.incentive || 0), 0),
              bonus: filtered.reduce((s, e) => s + Number(e.bonus || 0), 0),
              overall: filtered.reduce((s, e) => s + Number(e.overall || 0), 0),
            };
            return (
              <div data-testid="tab-content-salary-history">
                <div className="bg-[#1e293b] dark:bg-slate-800 px-5 py-3 flex items-center justify-between">
                  <h3 className="text-white font-semibold text-sm tracking-wide">Salary History</h3>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0" onClick={() => { setPayDialogOpen(true); setEpPayAmount(String(Number(employee?.salary || 0))); setEpPayMethod("bank"); setEpPayRef(""); setEpPayRemarks(""); const now = new Date(); setEpPayMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`); }} data-testid="button-pay-salary">
                      <CreditCard className="h-3.5 w-3.5" /> Pay Salary
                    </Button>
                    <Button size="sm" className="h-7 text-xs gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20 border" onClick={openAddSalary} data-testid="button-add-salary">
                      <Plus className="h-3.5 w-3.5" /> Add Salary
                    </Button>
                  </div>
                </div>

                <div className="p-4 border-b border-border space-y-3">
                  <div className="flex flex-wrap gap-4">
                    <div className="min-w-[160px]">
                      <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-1">Salary Month</p>
                      <Select value={salaryMonthFilter} onValueChange={v => { setSalaryMonthFilter(v === "all" ? "" : v); setSalaryPage(1); }}>
                        <SelectTrigger className="h-8 text-xs w-[180px]" data-testid="select-salary-month">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Months</SelectItem>
                          {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-1">From Date</p>
                      <Input type="date" className="h-8 text-xs w-[150px]" value={salaryFromDate} onChange={e => { setSalaryFromDate(e.target.value); setSalaryPage(1); }} data-testid="input-from-date" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-1">To Date</p>
                      <Input type="date" className="h-8 text-xs w-[150px]" value={salaryToDate} onChange={e => { setSalaryToDate(e.target.value); setSalaryPage(1); }} data-testid="input-to-date" />
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-end gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground font-medium">SHOW</span>
                        <Select value={String(salaryPageSize)} onValueChange={v => { setSalaryPageSize(Number(v)); setSalaryPage(1); }}>
                          <SelectTrigger className="h-8 text-xs w-16" data-testid="select-salary-page-size"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground font-medium">ENTRIES</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground font-medium">SEARCH:</span>
                        <Input className="h-8 text-xs w-[160px]" placeholder="Search..." value={salarySearch} onChange={e => { setSalarySearch(e.target.value); setSalaryPage(1); }} data-testid="input-salary-search" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#1e293b] hover:bg-[#1e293b] dark:bg-slate-800">
                        <TableHead className="text-white font-semibold text-xs py-3 w-10">S/N</TableHead>
                        <TableHead className="text-white font-semibold text-xs py-3">Salary Date</TableHead>
                        <TableHead className="text-white font-semibold text-xs py-3">Salary Month</TableHead>
                        <TableHead className="text-white font-semibold text-xs py-3 text-right">Paid Amount</TableHead>
                        <TableHead className="text-white font-semibold text-xs py-3 text-right">Overtime</TableHead>
                        <TableHead className="text-white font-semibold text-xs py-3 text-right">Incentive</TableHead>
                        <TableHead className="text-white font-semibold text-xs py-3 text-right">Bonus</TableHead>
                        <TableHead className="text-white font-semibold text-xs py-3 text-right">Overall</TableHead>
                        <TableHead className="text-white font-semibold text-xs py-3">Remarks</TableHead>
                        <TableHead className="text-white font-semibold text-xs py-3">Given By</TableHead>
                        <TableHead className="text-white font-semibold text-xs py-3 text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salaryLoading ? (
                        <TableRow><TableCell colSpan={11} className="text-center py-8"><Skeleton className="h-4 w-48 mx-auto" /></TableCell></TableRow>
                      ) : paginated.length === 0 ? (
                        <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground text-sm italic">No data available in table</TableCell></TableRow>
                      ) : (
                        paginated.map((entry, idx) => (
                          <TableRow key={entry.id} className="border-b border-border hover:bg-muted/30" data-testid={`salary-row-${entry.id}`}>
                            <TableCell className="text-xs text-muted-foreground py-2.5">{(salaryPage - 1) * salaryPageSize + idx + 1}</TableCell>
                            <TableCell className="text-sm py-2.5">{entry.salaryDate}</TableCell>
                            <TableCell className="text-sm py-2.5 font-medium">{entry.salaryMonth}</TableCell>
                            <TableCell className="text-sm py-2.5 text-right font-semibold text-green-600 dark:text-green-400 tabular-nums">{Number(entry.paidAmount || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-sm py-2.5 text-right tabular-nums">{Number(entry.overtime || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-sm py-2.5 text-right tabular-nums">{Number(entry.incentive || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-sm py-2.5 text-right tabular-nums">{Number(entry.bonus || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-sm py-2.5 text-right font-medium tabular-nums">{Number(entry.overall || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-sm py-2.5 max-w-[120px] truncate">{entry.remarks || "—"}</TableCell>
                            <TableCell className="text-sm py-2.5">{entry.givenBy || "—"}</TableCell>
                            <TableCell className="py-2.5">
                              <div className="flex items-center justify-center gap-0.5">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600 hover:bg-emerald-50" onClick={() => openEditSalary(entry)} data-testid={`btn-edit-salary-${entry.id}`} title="Edit"><Edit className="h-3 w-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-50" onClick={() => { if (confirm("Delete this salary entry?")) deleteSalaryMutation.mutate(entry.id); }} data-testid={`btn-delete-salary-${entry.id}`} title="Delete"><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      <TableRow className="bg-muted/40 font-semibold border-t-2 border-border">
                        <TableCell colSpan={3} className="text-xs font-bold py-2.5 pl-4 uppercase">TOTAL</TableCell>
                        <TableCell className="text-right text-sm font-bold tabular-nums py-2.5">{totals.paid.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums py-2.5">{totals.overtime.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums py-2.5">{totals.incentive.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums py-2.5">{totals.bonus.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm font-bold tabular-nums py-2.5">{totals.overall.toLocaleString()}</TableCell>
                        <TableCell colSpan={3} />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
                  <span>Showing {filtered.length === 0 ? 0 : (salaryPage - 1) * salaryPageSize + 1}–{Math.min(salaryPage * salaryPageSize, filtered.length)} of {filtered.length} entries</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-7 px-3 text-xs" disabled={salaryPage === 1} onClick={() => setSalaryPage(p => p - 1)} data-testid="btn-salary-prev">Previous</Button>
                    <Button variant="outline" size="sm" className="h-7 px-3 text-xs" disabled={salaryPage >= totalPages} onClick={() => setSalaryPage(p => p + 1)} data-testid="btn-salary-next">Next</Button>
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === "App Login Detail" && (
            <div data-testid="tab-content-login-detail">
              <div className="bg-[#1e293b] dark:bg-slate-800 px-5 py-3">
                <h3 className="text-white font-semibold text-sm tracking-wide">App Login Detail</h3>
              </div>
              <div className="divide-y divide-border">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Username</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold font-mono">{employee.email || employee.empCode}</span>
                  </div>
                  <div className="flex items-center px-5 py-3 gap-3">
                    <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Employee Code</span>
                    <span className="text-muted-foreground">:</span>
                    <span className="text-sm font-semibold font-mono">{employee.empCode}</span>
                  </div>
                </div>
                <div className="flex items-center px-5 py-3 gap-3 bg-muted/20">
                  <span className="text-sm text-muted-foreground font-medium min-w-[110px]">Portal Access</span>
                  <span className="text-muted-foreground">:</span>
                  <Badge variant="secondary" className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950 border border-amber-300">Pending Setup</Badge>
                </div>
                <div className="p-8 text-center text-muted-foreground">
                  <Key className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">App portal login not configured</p>
                  <p className="text-xs mt-1">Contact system administrator to set up employee portal access</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-primary" /> Edit Employee — {employee.fullName}
            </DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={editForm.control} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="empCode" render={({ field }) => (
                  <FormItem><FormLabel>Emp Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="cnic" render={({ field }) => (
                  <FormItem><FormLabel>CNIC</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="department" render={({ field }) => (
                  <FormItem><FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(departmentLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="designation" render={({ field }) => (
                  <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="salary" render={({ field }) => (
                  <FormItem><FormLabel>Salary (Rs.)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="joinDate" render={({ field }) => (
                  <FormItem><FormLabel>Join Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="gender" render={({ field }) => (
                  <FormItem><FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="dateOfBirth" render={({ field }) => (
                  <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending} className="gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={salaryDialogOpen} onOpenChange={open => { if (!open) { setSalaryDialogOpen(false); setEditingSalary(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BanknoteIcon className="h-4 w-4 text-primary" />
              {editingSalary ? "Edit Salary Entry" : "Add Salary Payment"}
            </DialogTitle>
          </DialogHeader>
          <Form {...salaryForm}>
            <form onSubmit={salaryForm.handleSubmit(onSalarySubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={salaryForm.control} name="salaryDate" render={({ field }) => (
                  <FormItem><FormLabel>Salary Date <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={salaryForm.control} name="salaryMonth" render={({ field }) => (
                  <FormItem><FormLabel>Salary Month <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input placeholder="e.g. January 2025" {...field} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={salaryForm.control} name="paidAmount" render={({ field }) => (
                  <FormItem><FormLabel>Paid Amount (Rs.)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} value={field.value || "0"} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={salaryForm.control} name="overtime" render={({ field }) => (
                  <FormItem><FormLabel>Overtime (Rs.)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} value={field.value || "0"} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={salaryForm.control} name="incentive" render={({ field }) => (
                  <FormItem><FormLabel>Incentive (Rs.)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} value={field.value || "0"} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={salaryForm.control} name="bonus" render={({ field }) => (
                  <FormItem><FormLabel>Bonus (Rs.)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} value={field.value || "0"} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={salaryForm.control} name="overall" render={({ field }) => (
                  <FormItem><FormLabel>Overall Total (Rs.)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} value={field.value || "0"} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={salaryForm.control} name="givenBy" render={({ field }) => (
                  <FormItem><FormLabel>Given By</FormLabel>
                    <FormControl><Input placeholder="Name of payment giver" {...field} value={field.value || ""} /></FormControl><FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={salaryForm.control} name="remarks" render={({ field }) => (
                <FormItem><FormLabel>Remarks</FormLabel>
                  <FormControl><Input placeholder="Optional notes..." {...field} value={field.value || ""} /></FormControl><FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSalaryDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createSalaryMutation.isPending || updateSalaryMutation.isPending} className="gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  {(createSalaryMutation.isPending || updateSalaryMutation.isPending) ? "Saving..." : editingSalary ? "Update Entry" : "Add Entry"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={payDialogOpen} onOpenChange={open => { if (!open) { setPayDialogOpen(false); setEpPayAmount(""); setEpPayMethod("bank"); setEpPayRef(""); setEpPayRemarks(""); } }}>
        <DialogContent className="max-w-md" data-testid="dialog-ep-pay-salary">
          {employee && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  Pay Salary
                </DialogTitle>
              </DialogHeader>
              <div className="bg-muted/30 border border-border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold" data-testid="text-ep-pay-name">{employee.fullName}</p>
                    <p className="text-[11px] text-muted-foreground">{employee.empCode} - {departmentLabels[employee.department] || employee.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground">Base Salary</p>
                    <p className="text-[12px] text-muted-foreground tabular-nums">Rs. {Number(employee.salary || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 mt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Salary Month</label>
                    <Input
                      type="month"
                      value={epPayMonth}
                      onChange={e => setEpPayMonth(e.target.value)}
                      className="h-9 text-[13px] mt-1"
                      data-testid="input-ep-pay-month"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Paying Amount (Rs.)</label>
                    <Input
                      type="number"
                      value={epPayAmount}
                      onChange={e => setEpPayAmount(e.target.value)}
                      className="h-9 text-[14px] mt-1 font-semibold tabular-nums"
                      min="0"
                      step="1"
                      data-testid="input-ep-pay-amount"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Payment Type</label>
                  <Select value={epPayMethod} onValueChange={v => { setEpPayMethod(v); setEpPayRef(""); }}>
                    <SelectTrigger className="h-9 text-[13px] mt-1" data-testid="select-ep-pay-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank Account</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="online">Online Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {epPayMethod === "bank" && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3" data-testid="section-ep-bank-details">
                    <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2">Bank Account Details</p>
                    {employee.bankAccount || employee.bankName ? (
                      <div className="space-y-1.5 text-[12px]">
                        {employee.bankName && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bank Name</span>
                            <span className="font-medium" data-testid="text-ep-bank-name">{employee.bankName}</span>
                          </div>
                        )}
                        {employee.bankBranch && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Branch</span>
                            <span className="font-medium" data-testid="text-ep-bank-branch">{employee.bankBranch}</span>
                          </div>
                        )}
                        {employee.bankAccount && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Account No.</span>
                            <span className="font-mono font-medium" data-testid="text-ep-bank-account">{employee.bankAccount}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-blue-500 dark:text-blue-400 italic">No bank details on file for this employee</p>
                    )}
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Transaction Reference</label>
                  <Input
                    value={epPayRef}
                    onChange={e => setEpPayRef(e.target.value)}
                    className="h-9 text-[13px] mt-1"
                    placeholder={epPayMethod === "cheque" ? "Cheque No." : epPayMethod === "cash" ? "Receipt No." : "TXN-12345"}
                    data-testid="input-ep-pay-ref"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Remarks</label>
                  <Textarea
                    value={epPayRemarks}
                    onChange={e => setEpPayRemarks(e.target.value)}
                    className="text-[13px] mt-1 min-h-[60px] resize-none"
                    placeholder="Optional payment notes..."
                    data-testid="input-ep-pay-remarks"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPayDialogOpen(false)} data-testid="button-cancel-ep-pay">Cancel</Button>
                <Button
                  onClick={() => paySalaryMutation.mutate({ employeeId: id, month: epPayMonth, amount: epPayAmount, method: epPayMethod, ref: epPayRef, remarks: epPayRemarks })}
                  disabled={paySalaryMutation.isPending || !epPayAmount || Number(epPayAmount) <= 0 || !epPayMonth}
                  data-testid="button-confirm-ep-pay"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {paySalaryMutation.isPending ? "Processing..." : "Confirm Payment"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
