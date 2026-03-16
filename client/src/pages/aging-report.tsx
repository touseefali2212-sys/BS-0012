import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Download,
  DollarSign,
  Clock,
  AlertTriangle,
  AlertCircle,
  XCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Invoice } from "@shared/schema";

type InvoiceWithCustomer = Invoice & { customerName?: string };

type AgingBucket = "current" | "30-day" | "60-day" | "90+";

function getAgingInfo(dueDate: string): { daysOverdue: number; bucket: AgingBucket } {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = now.getTime() - due.getTime();
  const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  let bucket: AgingBucket = "current";
  if (daysOverdue > 90) bucket = "90+";
  else if (daysOverdue > 60) bucket = "60-day";
  else if (daysOverdue > 30) bucket = "30-day";

  return { daysOverdue, bucket };
}

const bucketConfig: Record<AgingBucket, { label: string; color: string; barColor: string }> = {
  current: {
    label: "Current (0-30)",
    color: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950",
    barColor: "bg-green-500",
  },
  "30-day": {
    label: "31-60 Days",
    color: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950",
    barColor: "bg-amber-500",
  },
  "60-day": {
    label: "61-90 Days",
    color: "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950",
    barColor: "bg-orange-500",
  },
  "90+": {
    label: "90+ Days",
    color: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950",
    barColor: "bg-red-500",
  },
};

export default function AgingReportPage() {
  const [search, setSearch] = useState("");
  const [bucketFilter, setBucketFilter] = useState("all");

  const { data: invoices, isLoading } = useQuery<InvoiceWithCustomer[]>({
    queryKey: ["/api/invoices"],
  });

  const unpaidInvoices = (invoices || []).filter(
    (inv) => inv.status === "pending" || inv.status === "overdue" || inv.status === "partially_paid"
  );

  const agingData = unpaidInvoices.map((inv) => {
    const { daysOverdue, bucket } = getAgingInfo(inv.dueDate);
    return { ...inv, daysOverdue, bucket };
  });

  const totalOutstanding = agingData.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);

  const bucketTotals = {
    current: { amount: 0, count: 0 },
    "30-day": { amount: 0, count: 0 },
    "60-day": { amount: 0, count: 0 },
    "90+": { amount: 0, count: 0 },
  };

  agingData.forEach((inv) => {
    const amt = parseFloat(inv.totalAmount || "0");
    bucketTotals[inv.bucket].amount += amt;
    bucketTotals[inv.bucket].count += 1;
  });

  const summaryCards = [
    { title: "Total Outstanding", value: totalOutstanding, count: agingData.length, icon: DollarSign, color: "text-blue-600 dark:text-blue-400" },
    { title: "Current (0-30)", value: bucketTotals.current.amount, count: bucketTotals.current.count, icon: Clock, color: "text-green-600 dark:text-green-400" },
    { title: "31-60 Days", value: bucketTotals["30-day"].amount, count: bucketTotals["30-day"].count, icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400" },
    { title: "61-90 Days", value: bucketTotals["60-day"].amount, count: bucketTotals["60-day"].count, icon: AlertCircle, color: "text-orange-600 dark:text-orange-400" },
    { title: "90+ Days", value: bucketTotals["90+"].amount, count: bucketTotals["90+"].count, icon: XCircle, color: "text-red-600 dark:text-red-400" },
  ];

  const filtered = agingData.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customerName || "").toLowerCase().includes(search.toLowerCase());
    const matchBucket = bucketFilter === "all" || inv.bucket === bucketFilter;
    return matchSearch && matchBucket;
  });

  const handleExport = () => {
    const headers = ["Invoice #", "Customer Name", "Amount", "Due Date", "Days Overdue", "Aging Bucket", "Status", "Last Payment"];
    const rows = filtered.map((inv) => [
      inv.invoiceNumber,
      inv.customerName || "",
      parseFloat(inv.totalAmount || "0").toFixed(2),
      inv.dueDate,
      inv.daysOverdue,
      bucketConfig[inv.bucket].label,
      inv.status,
      inv.paidDate || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aging-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (val: number) =>
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-aging-report-title">Customer Aging Report</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Analyze outstanding invoices by aging period</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExport} data-testid="button-export-aging">
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} data-testid={`card-summary-${card.title.toLowerCase().replace(/[\s()]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div>
                  <div className="text-2xl font-bold" data-testid={`text-amount-${card.title.toLowerCase().replace(/[\s()]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}`}>
                    {formatCurrency(card.value)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5" data-testid={`text-count-${card.title.toLowerCase().replace(/[\s()]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}`}>
                    {card.count} invoice{card.count !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card data-testid="card-aging-distribution">
        <CardHeader className="pb-3">
          <span className="text-sm font-medium">Aging Distribution</span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : totalOutstanding === 0 ? (
            <p className="text-sm text-muted-foreground">No outstanding invoices</p>
          ) : (
            <div className="space-y-3">
              <div className="flex h-6 w-full rounded-md overflow-hidden" data-testid="bar-aging-distribution">
                {(["current", "30-day", "60-day", "90+"] as AgingBucket[]).map((bucket) => {
                  const pct = (bucketTotals[bucket].amount / totalOutstanding) * 100;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={bucket}
                      className={`${bucketConfig[bucket].barColor} flex items-center justify-center text-[10px] font-medium text-white`}
                      style={{ width: `${pct}%` }}
                      title={`${bucketConfig[bucket].label}: ${formatCurrency(bucketTotals[bucket].amount)} (${pct.toFixed(1)}%)`}
                      data-testid={`bar-segment-${bucket}`}
                    >
                      {pct >= 8 ? `${pct.toFixed(0)}%` : ""}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {(["current", "30-day", "60-day", "90+"] as AgingBucket[]).map((bucket) => {
                  const pct = totalOutstanding > 0 ? (bucketTotals[bucket].amount / totalOutstanding) * 100 : 0;
                  return (
                    <div key={bucket} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className={`h-2.5 w-2.5 rounded-sm ${bucketConfig[bucket].barColor}`} />
                      <span>{bucketConfig[bucket].label}: {pct.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices or customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-aging"
              />
            </div>
            <Select value={bucketFilter} onValueChange={setBucketFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-aging-bucket-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Buckets</SelectItem>
                <SelectItem value="current">Current (0-30)</SelectItem>
                <SelectItem value="30-day">31-60 Days</SelectItem>
                <SelectItem value="60-day">61-90 Days</SelectItem>
                <SelectItem value="90+">90+ Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No outstanding invoices found</p>
              <p className="text-sm mt-1">All invoices are paid or no matches for your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Days Overdue</TableHead>
                    <TableHead>Aging Bucket</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Last Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => {
                    const config = bucketConfig[inv.bucket];
                    return (
                      <TableRow key={inv.id} data-testid={`row-aging-${inv.id}`}>
                        <TableCell>
                          <span className="font-mono font-medium" data-testid={`text-invoice-number-${inv.id}`}>
                            {inv.invoiceNumber}
                          </span>
                        </TableCell>
                        <TableCell data-testid={`text-customer-name-${inv.id}`}>
                          {inv.customerName || `Customer #${inv.customerId}`}
                        </TableCell>
                        <TableCell className="text-right font-mono" data-testid={`text-amount-${inv.id}`}>
                          {formatCurrency(parseFloat(inv.totalAmount || "0"))}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground" data-testid={`text-due-date-${inv.id}`}>
                          {inv.dueDate}
                        </TableCell>
                        <TableCell className="text-right font-mono" data-testid={`text-days-overdue-${inv.id}`}>
                          {inv.daysOverdue}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${config.color}`} data-testid={`badge-bucket-${inv.id}`}>
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="no-default-active-elevate text-[10px] capitalize" data-testid={`badge-status-${inv.id}`}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground" data-testid={`text-last-payment-${inv.id}`}>
                          {inv.paidDate || "\u2014"}
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
  );
}