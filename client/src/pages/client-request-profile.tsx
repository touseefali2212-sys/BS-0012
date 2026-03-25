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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import type { CustomerQuery, Package as PackageType } from "@shared/schema";

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
  const s = (status || "").toLowerCase();
  const map: Record<string, string> = {
    pending: "bg-orange-500 text-white",
    completed: "bg-green-600 text-white",
    approved: "bg-green-600 text-white",
    rejected: "bg-red-500 text-white",
    converted: "bg-blue-600 text-white",
  };
  return <Badge className={`text-xs px-3 py-1 ${map[s] || "bg-gray-400 text-white"}`}>{status}</Badge>;
}

export default function ClientRequestProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: request, isLoading } = useQuery<CustomerQuery>({
    queryKey: ["/api/customer-queries", Number(id)],
    queryFn: async () => {
      const res = await fetch(`/api/customer-queries/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load request");
      return res.json();
    },
  });

  const { data: pkgs } = useQuery<PackageType[]>({ queryKey: ["/api/packages"] });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("PATCH", `/api/customer-queries/${id}`, { status });
    },
    onSuccess: () => {
      toast({ title: "Status Updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-queries", Number(id)] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-queries"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to update status", variant: "destructive" }),
  });

  const pkgName = request?.packageId && pkgs
    ? pkgs.find(p => p.id === request.packageId)?.name || "-"
    : "-";
  const pkgSpeed = request?.packageId && pkgs
    ? pkgs.find(p => p.id === request.packageId)?.speed || ""
    : "";
  const pkgPrice = request?.packageId && pkgs
    ? pkgs.find(p => p.id === request.packageId)?.price || ""
    : "";

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
        <div className="flex items-center gap-2 shrink-0">
          {request.status === "Pending" && (
            <>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => statusMutation.mutate("Approved")}
                disabled={statusMutation.isPending}
                data-testid="button-approve"
              >
                <CheckCircle className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => statusMutation.mutate("Rejected")}
                disabled={statusMutation.isPending}
                data-testid="button-reject"
              >
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            </>
          )}
          {request.status === "Approved" && (
            <Button size="sm" className="bg-[#1c67d4] hover:bg-[#1558b8] text-white" data-testid="button-convert">
              <Users className="h-4 w-4 mr-1" /> Convert to Customer
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => window.print()} data-testid="button-print">
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      {/* Status Timeline Strip */}
      <div className="flex items-center gap-0 rounded-lg overflow-hidden border text-xs font-medium">
        {["Pending", "Approved", "Completed", "Converted"].map((s, i) => {
          const isActive = request.status === s;
          const statusOrder = ["Pending", "Approved", "Completed", "Converted"];
          const currentIdx = statusOrder.indexOf(request.status);
          const isDone = currentIdx > i;
          return (
            <div
              key={s}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 ${
                isActive
                  ? "bg-[#1c67d4] text-white"
                  : isDone
                  ? "bg-green-600 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isDone ? <CheckCircle className="h-3.5 w-3.5" /> : isActive ? <Clock className="h-3.5 w-3.5" /> : <span className="w-3.5 h-3.5 rounded-full border-2 border-current inline-block" />}
              {s}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Personal Info */}
        <SectionCard icon={<User className="h-4 w-4" />} title="Personal Info">
          <InfoRow label="Full Name" value={request.name} />
          <InfoRow label="Father Name" value={request.fatherName} />
          <InfoRow label="Gender" value={request.gender} />
          <InfoRow label="Remarks / Special Note" value={request.remarks} />
        </SectionCard>

        {/* Section 2: Contact Info */}
        <SectionCard icon={<Phone className="h-4 w-4" />} title="Contact Info">
          <InfoRow
            label="Referred By"
            value={
              (request as any).referredBy
                ? (request as any).referredByDetail
                  ? `${(request as any).referredBy}: ${(request as any).referredByDetail}`
                  : (request as any).referredBy
                : null
            }
          />
          <InfoRow label="Mobile No" value={request.phone} />
          <InfoRow label="Branch" value={(request as any).branch} />
          <InfoRow label="Area" value={request.area} />
          <InfoRow label="City" value={request.city} />
        </SectionCard>
      </div>

      {/* Section 3: Network & Service */}
      <SectionCard icon={<Network className="h-4 w-4" />} title="Network & Service">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <InfoRow label="Customer Type" value={request.customerType} />
            <InfoRow label="Service Type" value={request.serviceType} />
            <InfoRow label="Package" value={pkgName + (pkgSpeed ? ` – ${pkgSpeed}` : "") + (pkgPrice ? ` (${pkgPrice} PKR)` : "")} />
          </div>
          <div>
            <InfoRow label="Static IP" value={(request as any).staticIp ? "Required" : "Not Required"} />
            <InfoRow label="POP ID" value={(request as any).popId} />
            <InfoRow label="Request Date" value={formatDate((request as any).requestDate)} />
          </div>
        </div>
      </SectionCard>

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
          {request.setupTime && (
            <>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Setup Time</span>
                <span className="font-medium">{formatDateTime(request.setupTime)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
