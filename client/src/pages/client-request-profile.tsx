import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import {
  User,
  Phone,
  Network,
  MapPin,
  Calendar,
  ArrowLeft,
  Package,
  Wifi,
  Building2,
  Users,
  Star,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Printer,
  UserCheck,
  ClipboardList,
  Send,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  BadgeCheck,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import type { CustomerQuery, Package as PackageType, CustomerQueryLog } from "@shared/schema";

const WORKFLOW_STEPS = [
  { key: "Pending", label: "Pending", icon: Clock },
  { key: "Approved", label: "Approved", icon: CheckCircle },
  { key: "Assigned", label: "Assigned", icon: UserCheck },
  { key: "Under Review", label: "Under Review", icon: ClipboardList },
  { key: "Final Approved", label: "Final Approved", icon: BadgeCheck },
  { key: "Converted", label: "Converted", icon: Users },
];

const STATUS_ORDER = WORKFLOW_STEPS.map(s => s.key);

function InfoRow({ label, value }: { label: string; value?: string | null | boolean | number }) {
  const display = value === null || value === undefined || value === "" ? "-" : String(value);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2 border-b border-border last:border-0">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-44 shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground">{display}</span>
    </div>
  );
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border overflow-hidden shadow-sm">
      <div className="bg-[#1c67d4] text-white px-4 py-2.5 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div className="p-4 bg-card">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase().replace(/\s+/g, "-");
  const map: Record<string, string> = {
    pending: "bg-orange-500 text-white",
    approved: "bg-green-600 text-white",
    assigned: "bg-blue-500 text-white",
    "under-review": "bg-purple-600 text-white",
    "final-approved": "bg-emerald-600 text-white",
    rejected: "bg-red-500 text-white",
    converted: "bg-slate-700 text-white",
  };
  return <Badge className={`text-xs px-3 py-1 ${map[s] || "bg-gray-400 text-white"}`}>{status}</Badge>;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  approved: { label: "Approved", color: "text-green-600" },
  rejected: { label: "Rejected", color: "text-red-500" },
  assigned: { label: "Assigned to Employee", color: "text-blue-600" },
  requirements_submitted: { label: "Requirements Submitted", color: "text-purple-600" },
  sent_back_for_revision: { label: "Sent Back for Revision", color: "text-orange-500" },
  final_approved: { label: "Final Approved", color: "text-emerald-600" },
  converted_to_customer: { label: "Converted to Customer", color: "text-slate-700" },
};

export default function ClientRequestProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [approveOpen, setApproveOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [requirementsOpen, setRequirementsOpen] = useState(false);
  const [finalApproveOpen, setFinalApproveOpen] = useState(false);
  const [finalApproveNotes, setFinalApproveNotes] = useState("");
  const [sendBackOpen, setSendBackOpen] = useState(false);
  const [sendBackNotes, setSendBackNotes] = useState("");
  const [convertOpen, setConvertOpen] = useState(false);

  const [reqForm, setReqForm] = useState({
    packageId: "",
    serviceType: "",
    connectionType: "",
    bandwidthRequired: "",
    monthlyCharges: "",
    otcCharge: "",
    installationFee: "",
    securityDeposit: "",
    popId: "",
    staticIp: false,
    remarks: "",
  });

  const { data: request, isLoading } = useQuery<CustomerQuery>({
    queryKey: ["/api/customer-queries", Number(id)],
    queryFn: async () => {
      const res = await fetch(`/api/customer-queries/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load request");
      return res.json();
    },
  });

  const { data: pkgs } = useQuery<PackageType[]>({ queryKey: ["/api/packages"] });
  const { data: vendors } = useQuery<any[]>({ queryKey: ["/api/vendors"] });
  const { data: employees } = useQuery<any[]>({ queryKey: ["/api/employees"] });
  const { data: logs } = useQuery<CustomerQueryLog[]>({
    queryKey: ["/api/customer-queries", Number(id), "logs"],
    queryFn: async () => {
      const res = await fetch(`/api/customer-queries/${id}/logs`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load logs");
      return res.json();
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/customer-queries", Number(id)] });
    queryClient.invalidateQueries({ queryKey: ["/api/customer-queries", Number(id), "logs"] });
    queryClient.invalidateQueries({ queryKey: ["/api/customer-queries"] });
  };

  const approveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/customer-queries/${id}/approve`, { notes: approveNotes }),
    onSuccess: () => { toast({ title: "Approved", description: "Request has been approved." }); invalidate(); setApproveOpen(false); setApproveNotes(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed to approve", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/customer-queries/${id}/reject`, { reason: rejectReason }),
    onSuccess: () => { toast({ title: "Rejected", description: "Request has been rejected." }); invalidate(); setRejectOpen(false); setRejectReason(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed to reject", variant: "destructive" }),
  });

  const assignMutation = useMutation({
    mutationFn: () => {
      const emp = (employees || []).find((e: any) => String(e.id) === assignEmployeeId);
      return apiRequest("POST", `/api/customer-queries/${id}/assign`, {
        employeeId: emp ? emp.id : null,
        employeeName: emp ? emp.fullName : assignEmployeeId,
        notes: assignNotes,
      });
    },
    onSuccess: () => { toast({ title: "Assigned", description: "Employee assigned successfully." }); invalidate(); setAssignOpen(false); setAssignEmployeeId(""); setAssignNotes(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed to assign", variant: "destructive" }),
  });

  const requirementsMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/customer-queries/${id}/submit-requirements`, {
      packageId: reqForm.packageId ? Number(reqForm.packageId) : null,
      serviceType: reqForm.serviceType || null,
      connectionType: reqForm.connectionType || null,
      bandwidthRequired: reqForm.bandwidthRequired || null,
      monthlyCharges: reqForm.monthlyCharges || null,
      otcCharge: reqForm.otcCharge || null,
      installationFee: reqForm.installationFee || null,
      securityDeposit: reqForm.securityDeposit || null,
      popId: reqForm.popId || null,
      staticIp: reqForm.staticIp,
      remarks: reqForm.remarks || null,
      notes: reqForm.remarks,
    }),
    onSuccess: () => { toast({ title: "Submitted", description: "Requirements submitted for review." }); invalidate(); setRequirementsOpen(false); },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed to submit", variant: "destructive" }),
  });

  const finalApproveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/customer-queries/${id}/final-approve`, { notes: finalApproveNotes }),
    onSuccess: () => { toast({ title: "Final Approved", description: "Request is ready for conversion." }); invalidate(); setFinalApproveOpen(false); setFinalApproveNotes(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed to final approve", variant: "destructive" }),
  });

  const sendBackMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/customer-queries/${id}/send-back`, { notes: sendBackNotes }),
    onSuccess: () => { toast({ title: "Sent Back", description: "Request sent back for revision." }); invalidate(); setSendBackOpen(false); setSendBackNotes(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed to send back", variant: "destructive" }),
  });

  const convertMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/customer-queries/${id}/convert`, {}),
    onSuccess: () => { toast({ title: "Converted!", description: "Client has been added to the customer list." }); invalidate(); setConvertOpen(false); },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed to convert", variant: "destructive" }),
  });


  const getVendorName = (vendorId: number | null | undefined) => {
    if (!vendorId || !vendors) return "-";
    const v = vendors.find((v: any) => v.id === vendorId);
    return v ? v.name : "-";
  };

  const pkgName = request?.packageId && pkgs ? pkgs.find(p => p.id === request.packageId)?.name || "-" : "-";
  const pkgSpeed = request?.packageId && pkgs ? pkgs.find(p => p.id === request.packageId)?.speed || "" : "";
  const pkgPrice = request?.packageId && pkgs ? pkgs.find(p => p.id === request.packageId)?.price || "" : "";

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "-";
    try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }); }
    catch { return d; }
  };

  const formatDateTime = (d: string | null | undefined) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
        " " + new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch { return d; }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <FileText className="h-12 w-12 mb-3 opacity-30" />
        <p className="font-medium">Client request not found</p>
        <Link href="/customers">
          <Button variant="outline" className="mt-4"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers</Button>
        </Link>
      </div>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(request.status);
  const isRejected = request.status === "Rejected";
  const req = request as any;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/customers">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{request.name}</h1>
              <StatusBadge status={request.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Request ID: <span className="font-mono font-semibold text-foreground">{request.queryId}</span>
              {" · "}Submitted: {formatDateTime(request.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {request.status === "Pending" && (
            <>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setApproveOpen(true)} data-testid="button-approve">
                <CheckCircle className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)} data-testid="button-reject">
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            </>
          )}
          {request.status === "Approved" && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setAssignOpen(true)} data-testid="button-assign">
              <UserCheck className="h-4 w-4 mr-1" /> Assign Employee
            </Button>
          )}
          {request.status === "Assigned" && (
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => {
              setReqForm({
                packageId: String(request.packageId || ""),
                serviceType: request.serviceType || "",
                connectionType: request.connectionType || "",
                bandwidthRequired: request.bandwidthRequired || "",
                monthlyCharges: String(request.monthlyCharges || ""),
                otcCharge: String(request.otcCharge || ""),
                installationFee: String(request.installationFee || ""),
                securityDeposit: String(request.securityDeposit || ""),
                popId: request.popId || "",
                staticIp: request.staticIp || false,
                remarks: request.remarks || "",
              });
              setRequirementsOpen(true);
            }} data-testid="button-submit-requirements">
              <ClipboardList className="h-4 w-4 mr-1" /> Submit Site Requirements
            </Button>
          )}
          {request.status === "Under Review" && (
            <>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setFinalApproveOpen(true)} data-testid="button-final-approve">
                <BadgeCheck className="h-4 w-4 mr-1" /> Final Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSendBackOpen(true)} data-testid="button-send-back">
                <RefreshCw className="h-4 w-4 mr-1" /> Send Back for Revision
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)} data-testid="button-reject-review">
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            </>
          )}
          {request.status === "Final Approved" && (
            <Button size="sm" className="bg-[#1c67d4] hover:bg-[#1558b8] text-white" onClick={() => setConvertOpen(true)} data-testid="button-convert">
              <Users className="h-4 w-4 mr-1" /> Convert to Customer
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => window.print()} data-testid="button-print">
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      {/* Quick Status Buttons */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0 mr-1">Set Status:</span>
        {([
          {
            status: "Pending",
            active: "bg-orange-500 text-white border-orange-500",
            idle: "border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30",
            onClick: () => setSendBackOpen(true),
          },
          {
            status: "Approved",
            active: "bg-green-600 text-white border-green-600",
            idle: "border-green-400 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30",
            onClick: () => setApproveOpen(true),
          },
          {
            status: "Assigned",
            active: "bg-blue-600 text-white border-blue-600",
            idle: "border-blue-400 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30",
            onClick: () => setAssignOpen(true),
          },
          {
            status: "Under Review",
            active: "bg-purple-600 text-white border-purple-600",
            idle: "border-purple-400 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30",
            onClick: () => {
              setReqForm({
                packageId: String(request.packageId || ""),
                serviceType: request.serviceType || "",
                connectionType: request.connectionType || "",
                bandwidthRequired: request.bandwidthRequired || "",
                monthlyCharges: String(request.monthlyCharges || ""),
                otcCharge: String(request.otcCharge || ""),
                installationFee: String(request.installationFee || ""),
                securityDeposit: String(request.securityDeposit || ""),
                popId: request.popId || "",
                staticIp: request.staticIp || false,
                remarks: request.remarks || "",
              });
              setRequirementsOpen(true);
            },
          },
          {
            status: "Final Approved",
            active: "bg-emerald-600 text-white border-emerald-600",
            idle: "border-emerald-400 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
            onClick: () => setFinalApproveOpen(true),
          },
          {
            status: "Converted",
            active: "bg-slate-700 text-white border-slate-700",
            idle: "border-slate-400 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/30",
            onClick: () => setConvertOpen(true),
          },
        ] as { status: string; active: string; idle: string; onClick: () => void }[]).map(({ status, active, idle, onClick }) => {
          const isCurrent = request.status === status;
          return (
            <button
              key={status}
              onClick={() => !isCurrent && onClick()}
              data-testid={`btn-quick-status-${status.toLowerCase().replace(/\s+/g, "-")}`}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                isCurrent
                  ? `${active} cursor-default ring-2 ring-offset-1 ring-current`
                  : `bg-transparent ${idle} cursor-pointer`
              }`}
            >
              {status}
              {isCurrent && " ✓"}
            </button>
          );
        })}
        {request.status === "Rejected" && (
          <span className="px-3 py-1.5 text-xs font-semibold rounded-md border bg-red-500 text-white border-red-500 ring-2 ring-offset-1 ring-red-500 cursor-default">
            Rejected ✓
          </span>
        )}
      </div>

      {/* Status Timeline */}
      {!isRejected ? (
        <div className="flex items-stretch rounded-lg overflow-hidden border text-xs font-medium">
          {WORKFLOW_STEPS.map((step, i) => {
            const isActive = request.status === step.key;
            const isDone = currentIdx > i;
            const Icon = step.icon;
            return (
              <div
                key={step.key}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 text-center ${
                  isActive ? "bg-[#1c67d4] text-white" : isDone ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="leading-tight hidden sm:block">{step.label}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-red-600">
          <XCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Request Rejected</p>
            {req.rejectedReason && <p className="text-xs mt-0.5 text-red-500">Reason: {req.rejectedReason}</p>}
            {req.rejectedBy && <p className="text-xs text-red-400">By: {req.rejectedBy}</p>}
          </div>
        </div>
      )}

      {/* Workflow Status Cards */}
      {(req.approvedBy || req.assignedEmployeeName || req.requirementsSubmittedAt || req.finalApprovedBy || req.convertedAt) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {req.approvedBy && (
            <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-3">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">Approved By</p>
              <p className="font-medium text-sm mt-1">{req.approvedBy}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(req.approvedAt)}</p>
            </div>
          )}
          {req.assignedEmployeeName && (
            <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-3">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Assigned To</p>
              <p className="font-medium text-sm mt-1">{req.assignedEmployeeName}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(req.assignedAt)}</p>
            </div>
          )}
          {req.requirementsSubmittedAt && (
            <div className="rounded-lg border bg-purple-50 dark:bg-purple-950/20 p-3">
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide">Requirements Submitted</p>
              <p className="text-xs text-muted-foreground mt-1">{formatDateTime(req.requirementsSubmittedAt)}</p>
            </div>
          )}
          {req.finalApprovedBy && (
            <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 p-3">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Final Approved By</p>
              <p className="font-medium text-sm mt-1">{req.finalApprovedBy}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(req.finalApprovedAt)}</p>
            </div>
          )}
          {req.convertedAt && (
            <div className="rounded-lg border bg-slate-100 dark:bg-slate-800 p-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Converted</p>
              <p className="text-xs text-muted-foreground mt-1">{formatDateTime(req.convertedAt)}</p>
              {req.convertedCustomerId && (
                <Link href={`/customers/${req.convertedCustomerId}`}>
                  <span className="text-xs text-blue-600 hover:underline cursor-pointer">View Customer →</span>
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard icon={<User className="h-4 w-4" />} title="Personal Info">
          <InfoRow label="Full Name" value={request.name} />
          <InfoRow label="Father Name" value={request.fatherName} />
          <InfoRow label="Gender" value={request.gender} />
          <InfoRow label="Remarks / Special Note" value={request.remarks} />
        </SectionCard>

        <SectionCard icon={<Phone className="h-4 w-4" />} title="Contact Info">
          <InfoRow
            label="Referred By"
            value={req.referredBy ? (req.referredByDetail ? `${req.referredBy}: ${req.referredByDetail}` : req.referredBy) : null}
          />
          <InfoRow label="Mobile No" value={request.phone} />
          <InfoRow label="Email" value={request.email} />
          <InfoRow label="Branch" value={req.branch} />
          <InfoRow label="Area" value={request.area} />
          <InfoRow label="City" value={request.city} />
        </SectionCard>
      </div>

      <SectionCard icon={<Network className="h-4 w-4" />} title="Network & Service">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <InfoRow label="Customer Type" value={request.customerType} />
            <InfoRow label="Service Type" value={request.serviceType} />
            <InfoRow label="Connection Type" value={request.connectionType} />
            {(request.customerType === "CIR" || request.customerType === "Corporate") && (
              <InfoRow label="Bandwidth Required" value={request.bandwidthRequired} />
            )}
            {request.customerType === "CIR" && (
              <InfoRow label="Bandwidth Vendor" value={getVendorName(request.bandwidthVendorId)} />
            )}
            {request.customerType === "Reseller" && (
              <InfoRow label="Panel Users Capacity" value={request.panelUsersCapacity} />
            )}
            {request.customerType === "Reseller" && (
              <InfoRow label="Panel Vendor" value={getVendorName(request.panelVendorId)} />
            )}
            {!["CIR", "Corporate", "Reseller"].includes(request.customerType || "") && (
              <InfoRow label="Package" value={pkgName + (pkgSpeed ? ` – ${pkgSpeed}` : "") + (pkgPrice ? ` (${pkgPrice} PKR)` : "")} />
            )}
          </div>
          <div>
            <InfoRow label="Static IP" value={request.staticIp ? "Required" : "Not Required"} />
            <InfoRow label="POP ID" value={request.popId} />
            <InfoRow label="Request Date" value={formatDate(request.requestDate)} />
          </div>
        </div>
      </SectionCard>

      {/* Financial Details (filled after site visit) */}
      {(request.monthlyCharges || request.otcCharge || request.installationFee || request.securityDeposit) && (
        <SectionCard icon={<Star className="h-4 w-4" />} title="Financial Details (Site Visit)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoRow label="Monthly Charges" value={request.monthlyCharges ? `PKR ${Number(request.monthlyCharges).toLocaleString()}` : null} />
            <InfoRow label="OTC Charge" value={request.otcCharge ? `PKR ${Number(request.otcCharge).toLocaleString()}` : null} />
            <InfoRow label="Installation Fee" value={request.installationFee ? `PKR ${Number(request.installationFee).toLocaleString()}` : null} />
            <InfoRow label="Security Deposit" value={request.securityDeposit ? `PKR ${Number(request.securityDeposit).toLocaleString()}` : null} />
          </div>
        </SectionCard>
      )}

      {/* Audit Log */}
      {logs && logs.length > 0 && (
        <SectionCard icon={<History className="h-4 w-4" />} title="Activity Log">
          <div className="space-y-2">
            {logs.map((log, i) => {
              const info = ACTION_LABELS[log.action] || { label: log.action, color: "text-foreground" };
              return (
                <div key={log.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <div className="mt-0.5 h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-semibold ${info.color}`}>{info.label}</span>
                    {log.notes && <p className="text-xs text-muted-foreground mt-0.5">"{log.notes}"</p>}
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{log.performedBy || "System"}</span>
                      <span>·</span>
                      <span>{formatDateTime(log.performedAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Meta Info */}
      <div className="rounded-lg border p-4 bg-muted/30">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Request ID</span>
            <span className="font-mono font-semibold text-foreground">{request.queryId}</span>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Created By</span>
            <span className="font-medium">{request.createdBy || "-"}</span>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Submitted On</span>
            <span className="font-medium">{formatDateTime(request.createdAt)}</span>
          </div>
          {request.setupBy && (
            <>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Setup By</span>
                <span className="font-medium">{request.setupBy}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Dialogs ──────────────────────────────────────── */}

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Approve / Reject Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Review <strong>{request.name}</strong>'s request before confirming approval or rejection.</p>
            <div className="rounded-md border bg-green-50 dark:bg-green-950/20 px-3 py-2.5 space-y-1">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">Approver Details</p>
              <p className="text-sm text-muted-foreground">Your logged-in account will be recorded as the approver.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Approval Notes (optional)</label>
              <textarea value={approveNotes} onChange={e => setApproveNotes(e.target.value)} rows={2} placeholder="Any notes for the approval..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" data-testid="textarea-approve-notes" />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setApproveOpen(false)} className="sm:mr-auto">Cancel</Button>
            <Button variant="destructive" onClick={() => { setApproveOpen(false); setRejectOpen(true); }} data-testid="button-switch-to-reject">
              <XCircle className="h-4 w-4 mr-1" /> Reject Instead
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} data-testid="button-confirm-approve">
              {approveMutation.isPending ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" /> Reject Request</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will reject the request. Please provide a reason.</p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Reason for Rejection <span className="text-red-500">*</span></label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Explain why this request is being rejected..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" data-testid="textarea-reject-reason" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending || !rejectReason.trim()} data-testid="button-confirm-reject">
              {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Employee Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-blue-600" /> Assign Employee</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Select an employee to visit the client site and collect requirements.</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Employee <span className="text-red-500">*</span></label>
              <Select value={assignEmployeeId} onValueChange={setAssignEmployeeId}>
                <SelectTrigger data-testid="select-assign-employee"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {(employees || []).filter((e: any) => e.status === "active").map((e: any) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.fullName} — {e.designation}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Assignment Notes (optional)</label>
              <textarea value={assignNotes} onChange={e => setAssignNotes(e.target.value)} rows={2} placeholder="Instructions for the employee..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" data-testid="textarea-assign-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending || !assignEmployeeId} data-testid="button-confirm-assign">
              {assignMutation.isPending ? "Assigning..." : "Assign Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Site Requirements Dialog */}
      <Dialog open={requirementsOpen} onOpenChange={setRequirementsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-purple-600" /> Submit Site Requirements</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Fill in the requirements collected during the site visit. This will be submitted to the admin for final approval.</p>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              {!["CIR", "Corporate", "Reseller"].includes(request.customerType || "") && (
                <div className="col-span-2 space-y-1.5">
                  <label className="text-sm font-medium">Package</label>
                  <Select value={reqForm.packageId} onValueChange={v => setReqForm(prev => ({ ...prev, packageId: v }))}>
                    <SelectTrigger data-testid="select-req-package"><SelectValue placeholder="Select package" /></SelectTrigger>
                    <SelectContent>
                      {(pkgs || []).filter(p => p.isActive).map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.name} — {p.speed}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(request.customerType === "CIR" || request.customerType === "Corporate") && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Bandwidth Required</label>
                  <Input value={reqForm.bandwidthRequired} onChange={e => setReqForm(prev => ({ ...prev, bandwidthRequired: e.target.value }))} placeholder="e.g. 100 Mbps" data-testid="input-req-bandwidth" />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Connectivity Type</label>
                <Select value={reqForm.serviceType} onValueChange={v => setReqForm(prev => ({ ...prev, serviceType: v }))}>
                  <SelectTrigger data-testid="select-req-service-type"><SelectValue placeholder="Select connectivity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fiber">Fiber / FTTH</SelectItem>
                    <SelectItem value="Wireless">Wireless / Radio</SelectItem>
                    <SelectItem value="DSL">DSL</SelectItem>
                    <SelectItem value="Cable">Cable</SelectItem>
                    <SelectItem value="VSAT">VSAT / Satellite</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Connection Type</label>
                <Select value={reqForm.connectionType} onValueChange={v => setReqForm(prev => ({ ...prev, connectionType: v }))}>
                  <SelectTrigger data-testid="select-req-connection-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New Connection</SelectItem>
                    <SelectItem value="Migration">Migration</SelectItem>
                    <SelectItem value="Upgrade">Upgrade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Monthly Charges (PKR)</label>
                <Input type="number" value={reqForm.monthlyCharges} onChange={e => setReqForm(prev => ({ ...prev, monthlyCharges: e.target.value }))} placeholder="0.00" data-testid="input-req-monthly" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">OTC Charges (PKR)</label>
                <Input type="number" value={reqForm.otcCharge} onChange={e => setReqForm(prev => ({ ...prev, otcCharge: e.target.value }))} placeholder="0.00" data-testid="input-req-otc" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Installation Fee (PKR)</label>
                <Input type="number" value={reqForm.installationFee} onChange={e => setReqForm(prev => ({ ...prev, installationFee: e.target.value }))} placeholder="0.00" data-testid="input-req-installation" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Security Deposit (PKR)</label>
                <Input type="number" value={reqForm.securityDeposit} onChange={e => setReqForm(prev => ({ ...prev, securityDeposit: e.target.value }))} placeholder="0.00" data-testid="input-req-deposit" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">POP / Exchange Location</label>
                <Input value={reqForm.popId} onChange={e => setReqForm(prev => ({ ...prev, popId: e.target.value }))} placeholder="POP ID or location" data-testid="input-req-pop" />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="req-static-ip" checked={reqForm.staticIp} onChange={e => setReqForm(prev => ({ ...prev, staticIp: e.target.checked }))} className="h-4 w-4 cursor-pointer" data-testid="checkbox-req-static-ip" />
                <label htmlFor="req-static-ip" className="text-sm font-medium cursor-pointer">Static IP Required</label>
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Site Visit Notes / Installation Requirements</label>
                <textarea value={reqForm.remarks} onChange={e => setReqForm(prev => ({ ...prev, remarks: e.target.value }))} rows={3} placeholder="Fiber deployment needed, router installation, additional notes..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" data-testid="textarea-req-notes" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequirementsOpen(false)}>Cancel</Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => requirementsMutation.mutate()} disabled={requirementsMutation.isPending} data-testid="button-confirm-requirements">
              {requirementsMutation.isPending ? "Submitting..." : "Submit for Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Approve Dialog */}
      <Dialog open={finalApproveOpen} onOpenChange={setFinalApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-600" /> Final Approval / Rejection</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Review the site requirements submitted for <strong>{request.name}</strong> and give your final decision.</p>
            <div className="rounded-md border bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2.5 space-y-1">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Approver Details</p>
              <p className="text-sm text-muted-foreground">Your logged-in account will be recorded as the final approver/rejector.</p>
            </div>
            {req.requirementsSubmittedAt && (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm space-y-1">
                <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Submitted Requirements</p>
                {req.serviceType && <p><span className="text-muted-foreground">Connectivity:</span> {req.serviceType}</p>}
                {req.bandwidthRequired && <p><span className="text-muted-foreground">Bandwidth:</span> {req.bandwidthRequired}</p>}
                {req.monthlyCharges && <p><span className="text-muted-foreground">Monthly Charges:</span> PKR {Number(req.monthlyCharges).toLocaleString()}</p>}
                {req.installationFee && <p><span className="text-muted-foreground">Installation:</span> PKR {Number(req.installationFee).toLocaleString()}</p>}
                {req.popId && <p><span className="text-muted-foreground">POP:</span> {req.popId}</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Final Notes (optional)</label>
              <textarea value={finalApproveNotes} onChange={e => setFinalApproveNotes(e.target.value)} rows={2} placeholder="Any final notes..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" data-testid="textarea-final-approve-notes" />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setFinalApproveOpen(false)} className="sm:mr-auto">Cancel</Button>
            <Button variant="destructive" onClick={() => { setFinalApproveOpen(false); setRejectOpen(true); }} data-testid="button-final-reject-instead">
              <XCircle className="h-4 w-4 mr-1" /> Reject Instead
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => finalApproveMutation.mutate()} disabled={finalApproveMutation.isPending} data-testid="button-confirm-final-approve">
              {finalApproveMutation.isPending ? "Approving..." : "Final Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Back / Reset to Pending Dialog */}
      <Dialog open={sendBackOpen} onOpenChange={setSendBackOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-orange-500" /> Reset to Pending</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">This will reset <strong>{request.name}</strong>'s request back to <span className="font-semibold text-orange-600">Pending</span> status. Your name will be recorded as the accepting officer.</p>
            <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Accepted by: <strong className="text-foreground">Logged-in User</strong></span>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Reason / Notes <span className="text-red-500">*</span></label>
              <textarea value={sendBackNotes} onChange={e => setSendBackNotes(e.target.value)} rows={3} placeholder="State why this is being reset to pending..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" data-testid="textarea-send-back-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendBackOpen(false)}>Cancel</Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => sendBackMutation.mutate()} disabled={sendBackMutation.isPending || !sendBackNotes.trim()} data-testid="button-confirm-send-back">
              {sendBackMutation.isPending ? "Processing..." : "Reset to Pending"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Customer Dialog */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-[#1c67d4]" /> Convert to Customer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">This will automatically create a new customer profile for <strong>{request.name}</strong> using all the data collected in this request.</p>
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {request.name}</p>
              <p><span className="text-muted-foreground">Phone:</span> {request.phone}</p>
              <p><span className="text-muted-foreground">Type:</span> {request.customerType}</p>
              {request.monthlyCharges && <p><span className="text-muted-foreground">Monthly:</span> PKR {Number(request.monthlyCharges).toLocaleString()}</p>}
            </div>
            <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              The customer will be set to active status. Login credentials can be configured in the customer profile.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button className="bg-[#1c67d4] hover:bg-[#1558b8] text-white" onClick={() => convertMutation.mutate()} disabled={convertMutation.isPending} data-testid="button-confirm-convert">
              {convertMutation.isPending ? "Converting..." : "Convert to Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
