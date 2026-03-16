import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  DollarSign,
  Users,
  TrendingDown,
  CheckCircle,
  Search,
  Download,
  Printer,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Play,
  FileText,
  CreditCard,
  BadgeCheck,
  ArrowUpRight,
  Wallet,
  Banknote,
  Plus,
  Clock,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Payroll, type Employee, type SalaryPayment } from "@shared/schema";

type PayrollWithEmployee = Payroll & {
  employeeName?: string;
  empCode?: string;
  department?: string;
  designation?: string;
};

function PayslipDialog({
  detailEntry,
  setDetailEntry,
  pendingSummary,
  statusBadge,
  monthLabel,
  editPayment,
  setEditPayment,
  editPaymentAmount,
  setEditPaymentAmount,
  editPaymentMethod,
  setEditPaymentMethod,
  editPaymentRef,
  setEditPaymentRef,
  editPaymentRemarks,
  setEditPaymentRemarks,
  updatePaymentMutation,
  deletePaymentMutation,
}: {
  detailEntry: PayrollWithEmployee | null;
  setDetailEntry: (v: PayrollWithEmployee | null) => void;
  pendingSummary: Record<string, { count: number; totalAmount: number; months: string[]; entries: { month: string; status: string; netSalary: number; totalPaid: number; remaining: number }[] }> | undefined;
  statusBadge: (s: string) => string;
  monthLabel: (m: string) => string;
  editPayment: SalaryPayment | null;
  setEditPayment: (v: SalaryPayment | null) => void;
  editPaymentAmount: string;
  setEditPaymentAmount: (v: string) => void;
  editPaymentMethod: string;
  setEditPaymentMethod: (v: string) => void;
  editPaymentRef: string;
  setEditPaymentRef: (v: string) => void;
  editPaymentRemarks: string;
  setEditPaymentRemarks: (v: string) => void;
  updatePaymentMutation: any;
  deletePaymentMutation: any;
}) {
  const { data: payments } = useQuery<SalaryPayment[]>({
    queryKey: ["/api/payroll", detailEntry?.id, "payments"],
    queryFn: () => fetch(`/api/payroll/${detailEntry?.id}/payments`, { credentials: "include" }).then(r => r.json()),
    enabled: !!detailEntry,
  });

  const totalPaid = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const netSalary = detailEntry ? Number(detailEntry.netSalary) : 0;
  const remaining = Math.max(0, netSalary - totalPaid);
  const paidPercent = netSalary > 0 ? Math.min(100, (totalPaid / netSalary) * 100) : 0;

  return (
    <>
      <Dialog open={!!detailEntry} onOpenChange={open => { if (!open) { setDetailEntry(null); setEditPayment(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-payslip">
          {detailEntry && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  Payslip — {detailEntry.employeeName}
                </DialogTitle>
              </DialogHeader>

              <div className="border border-border rounded-lg p-5 bg-background">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                  <div>
                    <h3 className="text-base font-bold text-primary">NetSphere Enterprise</h3>
                    <p className="text-[10px] text-muted-foreground">Salary Slip for {monthLabel(detailEntry.payrollMonth)}</p>
                  </div>
                  <Badge variant="secondary" className={`no-default-active-elevate text-[11px] font-semibold border-0 capitalize ${statusBadge(detailEntry.status)}`}>
                    {detailEntry.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs mb-5">
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Employee</span>
                    <span className="font-semibold">{detailEntry.employeeName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Emp Code</span>
                    <span className="font-mono font-semibold">{detailEntry.empCode}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Department</span>
                    <span className="font-semibold capitalize">{detailEntry.department}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Designation</span>
                    <span className="font-semibold">{detailEntry.designation}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Pay Period</span>
                    <span className="font-semibold">{monthLabel(detailEntry.payrollMonth)}</span>
                  </div>
                  {detailEntry.paidDate && (
                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-muted-foreground">Paid Date</span>
                      <span className="font-semibold">{detailEntry.paidDate}</span>
                    </div>
                  )}
                </div>

                {(() => {
                  const ps = pendingSummary?.[String(detailEntry.employeeId)];
                  if (!ps || ps.count === 0) return null;
                  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                  const fmtMonth = (m: string) => { const [y, mo] = m.split("-"); return `${monthNames[parseInt(mo)-1]} ${y}`; };
                  return (
                    <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-5" data-testid="section-pending-salary-detail">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          <span className="text-[12px] font-semibold text-orange-700 dark:text-orange-300">Pending / Unpaid Salary</span>
                        </div>
                        <Badge variant="secondary" className="no-default-active-elevate text-[10px] font-semibold border border-orange-300 dark:border-orange-700 bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" data-testid="badge-pending-months-detail">
                          {ps.count} month{ps.count > 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="border border-orange-200 dark:border-orange-800 rounded overflow-hidden mb-2">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-orange-100/60 dark:bg-orange-900/30">
                              <TableHead className="text-[10px] h-7 font-semibold text-orange-700 dark:text-orange-300">Month</TableHead>
                              <TableHead className="text-[10px] h-7 font-semibold text-orange-700 dark:text-orange-300 text-center">Status</TableHead>
                              <TableHead className="text-[10px] h-7 font-semibold text-orange-700 dark:text-orange-300 text-right">Net Salary</TableHead>
                              <TableHead className="text-[10px] h-7 font-semibold text-orange-700 dark:text-orange-300 text-right">Paid</TableHead>
                              <TableHead className="text-[10px] h-7 font-semibold text-orange-700 dark:text-orange-300 text-right">Remaining</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ps.entries.sort((a, b) => a.month.localeCompare(b.month)).map((e, i) => (
                              <TableRow key={i} className="border-orange-200 dark:border-orange-800">
                                <TableCell className="text-[11px] py-1.5 font-medium" data-testid={`text-pending-month-${i}`}>{fmtMonth(e.month)}</TableCell>
                                <TableCell className="text-[11px] py-1.5 text-center">
                                  <Badge variant="secondary" className={`no-default-active-elevate text-[9px] font-semibold border-0 capitalize ${e.status === "partial" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" : "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"}`}>
                                    {e.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-[11px] py-1.5 text-right tabular-nums font-medium">Rs. {e.netSalary.toLocaleString()}</TableCell>
                                <TableCell className="text-[11px] py-1.5 text-right tabular-nums">
                                  {e.totalPaid > 0 ? <span className="text-emerald-600 dark:text-emerald-400 font-medium">Rs. {e.totalPaid.toLocaleString()}</span> : <span className="text-muted-foreground">--</span>}
                                </TableCell>
                                <TableCell className="text-[11px] py-1.5 text-right tabular-nums font-semibold text-red-500" data-testid={`text-pending-remaining-${i}`}>Rs. {e.remaining.toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-orange-200 dark:border-orange-800">
                        <span className="text-orange-600 dark:text-orange-400 font-medium">Total Unpaid Amount</span>
                        <span className="font-bold text-orange-700 dark:text-orange-300 tabular-nums" data-testid="text-pending-total-detail">Rs. {ps.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="border border-border rounded-lg p-3">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Earnings</h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span>Base Salary</span><span className="font-semibold tabular-nums">Rs. {Number(detailEntry.baseSalary).toLocaleString()}</span></div>
                      {Number(detailEntry.overtime) > 0 && <div className="flex justify-between"><span>Overtime</span><span className="font-semibold tabular-nums text-purple-600">Rs. {Number(detailEntry.overtime).toLocaleString()}</span></div>}
                      {Number(detailEntry.bonus) > 0 && <div className="flex justify-between"><span>Bonus</span><span className="font-semibold tabular-nums text-violet-600">Rs. {Number(detailEntry.bonus).toLocaleString()}</span></div>}
                      {Number(detailEntry.commission) > 0 && <div className="flex justify-between"><span>Commission</span><span className="font-semibold tabular-nums text-teal-600">Rs. {Number(detailEntry.commission).toLocaleString()}</span></div>}
                      <div className="flex justify-between pt-1 border-t border-border font-semibold">
                        <span>Total Earnings</span>
                        <span className="tabular-nums">Rs. {(Number(detailEntry.baseSalary) + Number(detailEntry.overtime) + Number(detailEntry.bonus) + Number(detailEntry.commission)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Deductions</h4>
                    <div className="space-y-1.5 text-xs">
                      {Number(detailEntry.attendanceDeduction) > 0 && <div className="flex justify-between"><span>Attendance</span><span className="font-semibold tabular-nums text-red-500">-Rs. {Number(detailEntry.attendanceDeduction).toLocaleString()}</span></div>}
                      {Number(detailEntry.loanDeduction) > 0 && <div className="flex justify-between"><span>Loan/Advance</span><span className="font-semibold tabular-nums text-red-500">-Rs. {Number(detailEntry.loanDeduction).toLocaleString()}</span></div>}
                      {Number(detailEntry.tax) > 0 && <div className="flex justify-between"><span>Tax</span><span className="font-semibold tabular-nums text-red-500">-Rs. {Number(detailEntry.tax).toLocaleString()}</span></div>}
                      {Number(detailEntry.otherDeductions) > 0 && <div className="flex justify-between"><span>Other</span><span className="font-semibold tabular-nums text-red-500">-Rs. {Number(detailEntry.otherDeductions).toLocaleString()}</span></div>}
                      {Number(detailEntry.attendanceDeduction) === 0 && Number(detailEntry.loanDeduction) === 0 && Number(detailEntry.tax) === 0 && Number(detailEntry.otherDeductions) === 0 && (
                        <p className="text-muted-foreground">No deductions</p>
                      )}
                      <div className="flex justify-between pt-1 border-t border-border font-semibold">
                        <span>Total Deductions</span>
                        <span className="tabular-nums text-red-500">-Rs. {(Number(detailEntry.attendanceDeduction) + Number(detailEntry.loanDeduction) + Number(detailEntry.tax) + Number(detailEntry.otherDeductions)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 rounded-lg p-4 flex items-center justify-between">
                  <span className="text-sm font-bold">NET PAY</span>
                  <span className="text-2xl font-bold text-primary tabular-nums" data-testid="text-payslip-net">Rs. {Number(detailEntry.netSalary).toLocaleString()}</span>
                </div>

                {(detailEntry.status === "paid" || detailEntry.status === "partial") && payments && payments.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Payment Progress</h4>
                      <span className="text-[11px] font-semibold tabular-nums">{paidPercent.toFixed(0)}%</span>
                    </div>
                    <Progress value={paidPercent} className="h-2 mb-3" />
                    <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2 text-center">
                        <p className="text-[10px] text-muted-foreground">Total Paid</p>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums" data-testid="text-payslip-total-paid">Rs. {totalPaid.toLocaleString()}</p>
                      </div>
                      <div className={`${remaining > 0 ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800" : "bg-muted/30 border-border"} border rounded-lg p-2 text-center`}>
                        <p className="text-[10px] text-muted-foreground">Remaining</p>
                        <p className={`font-bold tabular-nums ${remaining > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"}`} data-testid="text-payslip-remaining">Rs. {remaining.toLocaleString()}</p>
                      </div>
                      <div className="bg-muted/30 border border-border rounded-lg p-2 text-center">
                        <p className="text-[10px] text-muted-foreground">Payments</p>
                        <p className="font-bold tabular-nums" data-testid="text-payslip-payment-count">{payments.length}</p>
                      </div>
                    </div>

                    <div className="border border-border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-[10px] h-8 font-semibold">Date</TableHead>
                            <TableHead className="text-[10px] h-8 font-semibold">Amount</TableHead>
                            <TableHead className="text-[10px] h-8 font-semibold">Method</TableHead>
                            <TableHead className="text-[10px] h-8 font-semibold">Ref</TableHead>
                            <TableHead className="text-[10px] h-8 font-semibold text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map(pm => (
                            <TableRow key={pm.id}>
                              <TableCell className="text-[11px] py-1.5 tabular-nums" data-testid={`text-payment-date-${pm.id}`}>{pm.paidDate}</TableCell>
                              <TableCell className="text-[11px] py-1.5 font-semibold tabular-nums text-emerald-600 dark:text-emerald-400" data-testid={`text-payment-amount-${pm.id}`}>Rs. {Number(pm.amount).toLocaleString()}</TableCell>
                              <TableCell className="text-[11px] py-1.5 capitalize" data-testid={`text-payment-method-${pm.id}`}>{pm.paymentMethod}</TableCell>
                              <TableCell className="text-[11px] py-1.5 text-muted-foreground" data-testid={`text-payment-ref-${pm.id}`}>{pm.paymentRef || "-"}</TableCell>
                              <TableCell className="py-1.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="px-1.5 h-6 text-blue-600 dark:text-blue-400"
                                    onClick={() => {
                                      setEditPayment(pm);
                                      setEditPaymentAmount(String(Number(pm.amount)));
                                      setEditPaymentMethod(pm.paymentMethod || "bank");
                                      setEditPaymentRef(pm.paymentRef || "");
                                      setEditPaymentRemarks(pm.remarks || "");
                                    }}
                                    data-testid={`button-edit-payment-${pm.id}`}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="px-1.5 h-6 text-red-600 dark:text-red-400"
                                    onClick={() => { if (confirm("Delete this payment record?")) deletePaymentMutation.mutate(pm.id); }}
                                    data-testid={`button-delete-payment-${pm.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {payments.some(p => p.remarks) && (
                      <div className="mt-2 space-y-1">
                        {payments.filter(p => p.remarks).map(p => (
                          <p key={p.id} className="text-[10px] text-muted-foreground">
                            {p.paidDate}: {p.remarks}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()} data-testid="button-print-payslip">
                  <Printer className="h-3.5 w-3.5" /> Print Payslip
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPayment} onOpenChange={open => { if (!open) setEditPayment(null); }}>
        <DialogContent className="max-w-md" data-testid="dialog-edit-payment">
          {editPayment && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">Edit Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Amount (Rs.)</label>
                  <Input
                    type="number"
                    value={editPaymentAmount}
                    onChange={e => setEditPaymentAmount(e.target.value)}
                    className="h-9 text-[14px] mt-1 font-semibold tabular-nums"
                    min="0"
                    step="1"
                    data-testid="input-edit-payment-amount"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Payment Type</label>
                  <Select value={editPaymentMethod} onValueChange={v => setEditPaymentMethod(v)}>
                    <SelectTrigger className="h-9 text-[13px] mt-1" data-testid="select-edit-payment-method">
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
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Transaction Reference</label>
                  <Input
                    value={editPaymentRef}
                    onChange={e => setEditPaymentRef(e.target.value)}
                    className="h-9 text-[13px] mt-1"
                    placeholder="Transaction reference..."
                    data-testid="input-edit-payment-ref"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Remarks</label>
                  <Textarea
                    value={editPaymentRemarks}
                    onChange={e => setEditPaymentRemarks(e.target.value)}
                    className="text-[13px] mt-1 min-h-[60px] resize-none"
                    placeholder="Optional notes..."
                    data-testid="input-edit-payment-remarks"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditPayment(null)} data-testid="button-cancel-edit-payment">Cancel</Button>
                <Button
                  onClick={() => updatePaymentMutation.mutate({
                    id: editPayment.id,
                    amount: editPaymentAmount,
                    paymentMethod: editPaymentMethod,
                    paymentRef: editPaymentRef,
                    remarks: editPaymentRemarks,
                  })}
                  disabled={updatePaymentMutation.isPending || !editPaymentAmount || Number(editPaymentAmount) <= 0}
                  data-testid="button-save-payment"
                >
                  {updatePaymentMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PayDialogComponent({
  payDialog,
  setPayDialog,
  payAmount,
  setPayAmount,
  payMethod,
  setPayMethod,
  payRef,
  setPayRef,
  payRemarks,
  setPayRemarks,
  employees,
  markPaidMutation,
  pendingSummary,
  paymentsSummary,
}: {
  payDialog: PayrollWithEmployee | null;
  setPayDialog: (v: PayrollWithEmployee | null) => void;
  payAmount: string;
  setPayAmount: (v: string) => void;
  payMethod: string;
  setPayMethod: (v: string) => void;
  payRef: string;
  setPayRef: (v: string) => void;
  payRemarks: string;
  setPayRemarks: (v: string) => void;
  employees: Employee[] | undefined;
  markPaidMutation: any;
  pendingSummary: Record<string, { count: number; totalAmount: number; months: string[]; entries: { month: string; status: string; netSalary: number; totalPaid: number; remaining: number }[] }> | undefined;
  paymentsSummary: Record<string, { totalPaid: number; paymentCount: number; remaining: number }> | undefined;
}) {
  const [payBankName, setPayBankName] = useState("");
  const [payBankBranch, setPayBankBranch] = useState("");
  const [payBankAccount, setPayBankAccount] = useState("");

  useEffect(() => {
    if (payDialog && employees) {
      const emp = employees.find(e => e.id === payDialog.employeeId);
      setPayBankName(emp?.bankName || "");
      setPayBankBranch(emp?.bankBranch || "");
      setPayBankAccount(emp?.bankAccount || "");
    }
  }, [payDialog?.id, employees]);

  const { data: existingPayments } = useQuery<SalaryPayment[]>({
    queryKey: ["/api/payroll", payDialog?.id, "payments"],
    queryFn: () => fetch(`/api/payroll/${payDialog?.id}/payments`, { credentials: "include" }).then(r => r.json()),
    enabled: !!payDialog,
  });

  const paymentsFromRecords = (existingPayments || []).reduce((s, p) => s + Number(p.amount), 0);
  const netSalary = payDialog ? Number(payDialog.netSalary) : 0;
  const oldPendingAmount = (() => {
    if (!payDialog || !pendingSummary) return 0;
    const ps = pendingSummary[String(payDialog.employeeId)];
    return ps && ps.count > 0 ? ps.totalAmount : 0;
  })();
  const alreadyPaid = (() => {
    if (paymentsFromRecords > 0) return paymentsFromRecords;
    if (!payDialog) return 0;
    const pm = paymentsSummary?.[String(payDialog.id)];
    if (pm && pm.totalPaid > 0) return pm.totalPaid;
    if (payDialog.status === "paid") return netSalary;
    return 0;
  })();
  const totalDue = netSalary + oldPendingAmount;
  const remainingAmount = Math.max(0, totalDue - alreadyPaid);
  const isPartial = payDialog?.status === "partial";

  const defaultAmount = remainingAmount;

  return (
    <Dialog open={!!payDialog} onOpenChange={open => { if (!open) { setPayDialog(null); setPayMethod("bank"); setPayRef(""); setPayRemarks(""); setPayAmount(""); } }}>
      <DialogContent className="max-w-md" data-testid="dialog-mark-paid">
        {payDialog && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">{isPartial ? "Pay Remaining Salary" : "Pay Salary"}</DialogTitle>
            </DialogHeader>
            {(() => {
              const ps = pendingSummary?.[String(payDialog.employeeId)];
              const oldPending = ps && ps.count > 0 ? ps.totalAmount : 0;
              const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
              const fmtMonth = (m: string) => { const [y, mo] = m.split("-"); return `${monthNames[parseInt(mo)-1]} ${y}`; };
              return (
                <>
                  <div className="bg-muted/30 border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-semibold" data-testid="text-pay-employee-name">{payDialog.employeeName}</p>
                        <p className="text-[11px] text-muted-foreground">{payDialog.empCode} - {payDialog.department}</p>
                        {oldPending > 0 && (
                          <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 mt-0.5" data-testid="text-pay-old-pending-label">
                            Old Pending Salary
                            <span className="ml-2 text-red-500 font-bold tabular-nums" data-testid="text-pay-old-pending-due">Due: Rs. {oldPending.toLocaleString()}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-muted-foreground">Net Salary</p>
                        <p className="text-[12px] tabular-nums text-primary font-bold" data-testid="text-pay-original-amount">Rs. {netSalary.toLocaleString()}</p>
                      </div>
                    </div>
                    {alreadyPaid > 0 && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-emerald-600 dark:text-emerald-400">Already Paid</span>
                          <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400" data-testid="text-pay-already-paid">Rs. {alreadyPaid.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] mt-1">
                          <span className="text-yellow-600 dark:text-yellow-400">Remaining</span>
                          <span className="font-bold tabular-nums text-yellow-600 dark:text-yellow-400" data-testid="text-pay-remaining">Rs. {remainingAmount.toLocaleString()}</span>
                        </div>
                        <Progress value={totalDue > 0 ? (alreadyPaid / totalDue) * 100 : 0} className="h-1.5 mt-2" />
                      </div>
                    )}
                    {oldPending > 0 && (
                      <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[12px]">
                        <span className="font-bold">Total Due (Net + Pending)</span>
                        <span className="font-bold tabular-nums text-red-500" data-testid="text-pay-grand-total">Rs. {totalDue.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {oldPending > 0 && ps && (
                    <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mt-2" data-testid="section-pay-pending-salary">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                          <span className="text-[11px] font-semibold text-orange-700 dark:text-orange-300">Old Pending Salary</span>
                        </div>
                        <span className="text-[11px] font-bold text-orange-700 dark:text-orange-300 tabular-nums" data-testid="text-pay-pending-total">Rs. {oldPending.toLocaleString()}</span>
                      </div>
                      {ps.entries.sort((a, b) => a.month.localeCompare(b.month)).map((e, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px] py-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-orange-700 dark:text-orange-300" data-testid={`text-pay-pending-month-${i}`}>{fmtMonth(e.month)}</span>
                            <span className={`px-1 py-0.5 rounded text-[8px] font-semibold uppercase ${e.status === "partial" ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300" : "bg-orange-200 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300"}`}>{e.status}</span>
                          </div>
                          <span className="font-semibold text-red-500 tabular-nums" data-testid={`text-pay-pending-remaining-${i}`}>Due: Rs. {e.remaining.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
            <div className="space-y-3 mt-1">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Paying Amount (Rs.)</label>
                <Input
                  type="number"
                  value={payAmount || String(defaultAmount)}
                  onChange={e => setPayAmount(e.target.value)}
                  className="h-9 text-[14px] mt-1 font-semibold tabular-nums"
                  min="0"
                  step="1"
                  data-testid="input-pay-amount"
                />
                {Number(payAmount || defaultAmount) < remainingAmount && Number(payAmount || defaultAmount) > 0 && (
                  <p className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-1">
                    Partial payment: Rs. {(remainingAmount - Number(payAmount || 0)).toLocaleString()} will remain unpaid
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Payment Type</label>
                <Select value={payMethod} onValueChange={v => { setPayMethod(v); setPayRef(""); }}>
                  <SelectTrigger className="h-9 text-[13px] mt-1" data-testid="select-pay-method">
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
              {payMethod === "bank" && (
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2" data-testid="section-bank-details">
                  <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Bank Account Details</p>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-0.5 block">Bank Name</label>
                    <Input
                      value={payBankName}
                      onChange={e => setPayBankName(e.target.value)}
                      className="h-8 text-[12px] bg-white dark:bg-background"
                      placeholder="e.g. HBL, MCB, UBL"
                      data-testid="input-pay-bank-name"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-0.5 block">Bank Branch</label>
                    <Input
                      value={payBankBranch}
                      onChange={e => setPayBankBranch(e.target.value)}
                      className="h-8 text-[12px] bg-white dark:bg-background"
                      placeholder="Branch name or code"
                      data-testid="input-pay-bank-branch"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-0.5 block">Account No.</label>
                    <Input
                      value={payBankAccount}
                      onChange={e => setPayBankAccount(e.target.value)}
                      className="h-8 text-[12px] font-mono bg-white dark:bg-background"
                      placeholder="Account number"
                      data-testid="input-pay-bank-account"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Transaction Reference</label>
                <Input
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  className="h-9 text-[13px] mt-1"
                  placeholder={payMethod === "cheque" ? "Cheque No." : payMethod === "cash" ? "Receipt No." : "TXN-12345"}
                  data-testid="input-pay-ref"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Remarks</label>
                <Textarea
                  value={payRemarks}
                  onChange={e => setPayRemarks(e.target.value)}
                  className="text-[13px] mt-1 min-h-[60px] resize-none"
                  placeholder="Optional payment notes..."
                  data-testid="input-pay-remarks"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayDialog(null)} data-testid="button-cancel-pay">Cancel</Button>
              <Button
                onClick={() => markPaidMutation.mutate({ id: payDialog.id, method: payMethod, ref: payRef, remarks: payRemarks, amount: payAmount || String(defaultAmount), bankName: payBankName, bankBranch: payBankBranch, bankAccount: payBankAccount })}
                disabled={markPaidMutation.isPending || (!payAmount && !defaultAmount) || Number(payAmount || defaultAmount) <= 0}
                data-testid="button-confirm-pay"
              >
                {markPaidMutation.isPending ? "Processing..." : "Confirm Payment"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function SalaryPage() {
  const { toast } = useToast();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const clearSelection = () => setSelectedIds(new Set());
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailEntry, setDetailEntry] = useState<PayrollWithEmployee | null>(null);
  const [editEntry, setEditEntry] = useState<PayrollWithEmployee | null>(null);
  const [payDialog, setPayDialog] = useState<PayrollWithEmployee | null>(null);
  const [payMethod, setPayMethod] = useState("bank");
  const [payRef, setPayRef] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [editOvertime, setEditOvertime] = useState("0");
  const [editBonus, setEditBonus] = useState("0");
  const [editCommission, setEditCommission] = useState("0");
  const [editOtherDed, setEditOtherDed] = useState("0");
  const [editAttDed, setEditAttDed] = useState("0");
  const [editTax, setEditTax] = useState("0");
  const [editRemarks, setEditRemarks] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkPayDialog, setBulkPayDialog] = useState(false);
  const [bulkPayMethod, setBulkPayMethod] = useState("bank");
  const [bulkPayRef, setBulkPayRef] = useState("");
  const [bulkPayRemarks, setBulkPayRemarks] = useState("");
  const [bulkPayAmounts, setBulkPayAmounts] = useState<Record<number, string>>({});
  const [editPayment, setEditPayment] = useState<SalaryPayment | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("bank");
  const [editPaymentRef, setEditPaymentRef] = useState("");
  const [editPaymentRemarks, setEditPaymentRemarks] = useState("");
  const [pendingDialog, setPendingDialog] = useState(false);
  const [pendingEmployeeId, setPendingEmployeeId] = useState("");
  const [pendingFromMonth, setPendingFromMonth] = useState("");
  const [pendingToMonth, setPendingToMonth] = useState("");
  const [pendingAmount, setPendingAmount] = useState("");
  const [pendingRemarks, setPendingRemarks] = useState("");

  const { data: payrollData, isLoading } = useQuery<PayrollWithEmployee[]>({
    queryKey: [`/api/payroll?month=${selectedMonth}`],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: pendingSummary } = useQuery<Record<string, { count: number; totalAmount: number; months: string[]; entries: { month: string; status: string; netSalary: number; totalPaid: number; remaining: number }[] }>>({
    queryKey: ["/api/payroll/pending-summary", selectedMonth],
    queryFn: () => fetch(`/api/payroll/pending-summary?excludeMonth=${selectedMonth}`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: paymentsSummary } = useQuery<Record<string, { totalPaid: number; paymentCount: number; remaining: number }>>({
    queryKey: ["/api/payroll/payments-summary", selectedMonth],
    queryFn: () => fetch(`/api/payroll/payments-summary?month=${selectedMonth}`, { credentials: "include" }).then(r => r.json()),
  });

  const processMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/payroll/process", { month: selectedMonth }),
    onSuccess: async (res: any) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: [`/api/payroll?month=${selectedMonth}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/pending-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments-summary", selectedMonth] });
      toast({ title: "Payroll Processed", description: data.message || `Processed successfully` });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/payroll/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/payroll?month=${selectedMonth}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/pending-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments-summary", selectedMonth] });
      toast({ title: "Updated", description: "Payroll entry updated" });
      setEditEntry(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id, method, ref, remarks, amount, bankName, bankBranch, bankAccount }: { id: number; method: string; ref: string; remarks: string; amount: string; bankName?: string; bankBranch?: string; bankAccount?: string }) =>
      apiRequest("POST", `/api/payroll/${id}/payments`, {
        amount,
        paymentMethod: method,
        paymentRef: ref,
        remarks: remarks || undefined,
        bankName: bankName || undefined,
        bankBranch: bankBranch || undefined,
        bankAccount: bankAccount || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/payroll?month=${selectedMonth}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/pending-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments-summary", selectedMonth] });
      if (payDialog) queryClient.invalidateQueries({ queryKey: ["/api/payroll", payDialog.id, "payments"] });
      toast({ title: "Payment Recorded", description: "Salary payment has been recorded" });
      setPayDialog(null);
      setPayMethod("bank");
      setPayRef("");
      setPayRemarks("");
      setPayAmount("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, amount, paymentMethod, paymentRef, remarks }: { id: number; amount: string; paymentMethod: string; paymentRef: string; remarks: string }) =>
      apiRequest("PATCH", `/api/salary-payments/${id}`, { amount, paymentMethod, paymentRef, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/payroll?month=${selectedMonth}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/pending-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments-summary", selectedMonth] });
      if (detailEntry) queryClient.invalidateQueries({ queryKey: ["/api/payroll", detailEntry.id, "payments"] });
      toast({ title: "Updated", description: "Payment record updated" });
      setEditPayment(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/salary-payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/payroll?month=${selectedMonth}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/pending-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments-summary", selectedMonth] });
      if (detailEntry) queryClient.invalidateQueries({ queryKey: ["/api/payroll", detailEntry.id, "payments"] });
      toast({ title: "Deleted", description: "Payment record deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/payroll/${id}`, { status: "approved", approvedBy: "Admin" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/payroll?month=${selectedMonth}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/pending-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments-summary", selectedMonth] });
      toast({ title: "Approved", description: "Payroll entry approved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const lockMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/payroll/lock", { month: selectedMonth }),
    onSuccess: async (res: any) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: [`/api/payroll?month=${selectedMonth}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/pending-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments-summary", selectedMonth] });
      toast({ title: "Locked", description: data.message || "Payroll has been locked" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const unlockMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/payroll/unlock", { month: selectedMonth }),
    onSuccess: async (res: any) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: [`/api/payroll?month=${selectedMonth}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/pending-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments-summary", selectedMonth] });
      toast({ title: "Unlocked", description: data.message || "Payroll has been unlocked for editing" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const bulkPayMutation = useMutation({
    mutationFn: ({ ids, method, ref, remarks, amounts }: { ids: number[]; method: string; ref: string; remarks: string; amounts: Record<number, string> }) =>
      apiRequest("POST", "/api/payroll/bulk-pay", { ids, paymentMethod: method, paymentRef: ref, remarks: remarks || undefined, amounts }),
    onSuccess: async (res: any) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: [`/api/payroll?month=${selectedMonth}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/pending-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments-summary", selectedMonth] });
      toast({ title: "Salary Paid", description: data.message || `${selectedIds.size} employee(s) marked as paid` });
      setBulkPayDialog(false);
      setBulkPayMethod("bank");
      setBulkPayRef("");
      setBulkPayRemarks("");
      setBulkPayAmounts({});
      setSelectedIds(new Set());
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const pendingSalaryMutation = useMutation({
    mutationFn: (data: { employeeId: number; fromMonth: string; toMonth: string; amount: string; remarks: string }) =>
      apiRequest("POST", "/api/payroll/add-pending", data),
    onSuccess: async (res: any) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: [`/api/payroll?month=${selectedMonth}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/pending-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/payments-summary", selectedMonth] });
      toast({ title: "Pending Salary Added", description: data.message || "Pending salary entries created successfully" });
      setPendingDialog(false);
      setPendingEmployeeId("");
      setPendingFromMonth("");
      setPendingToMonth("");
      setPendingAmount("");
      setPendingRemarks("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    return (payrollData || []).filter(p => {
      const matchSearch =
        (p.employeeName || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.empCode || "").toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "all" || p.department === deptFilter;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [payrollData, search, deptFilter, statusFilter]);

  const all = payrollData || [];
  const totalEmployees = all.length;
  const totalGross = all.reduce((s, p) => s + Number(p.baseSalary), 0);
  const totalDeductions = all.reduce((s, p) => s + Number(p.attendanceDeduction) + Number(p.loanDeduction) + Number(p.tax) + Number(p.otherDeductions), 0);
  const totalNet = all.reduce((s, p) => s + Number(p.netSalary), 0);
  const paidCount = all.filter(p => p.status === "paid").length;
  const hasLocked = all.some(p => p.status === "locked");
  const payableEntries = filtered.filter(p => p.status !== "paid");
  const payableIds = payableEntries.map(p => p.id);
  const selectedPayable = Array.from(selectedIds).filter(id => payableIds.includes(id));
  const selectedPayableTotal = filtered.filter(p => selectedIds.has(p.id) && p.status !== "paid").reduce((s, p) => s + Number(p.netSalary), 0);
  const allPayableSelected = payableEntries.length > 0 && payableEntries.every(p => selectedIds.has(p.id));

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (allPayableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(payableIds));
    }
  };

  const payrollStatus = all.length === 0 ? "No Data" :
    all.every(p => p.status === "paid") ? "Paid" :
    all.some(p => p.status === "locked") ? "Locked" :
    all.every(p => p.status === "approved" || p.status === "paid") ? "Approved" :
    all.some(p => p.status === "processed") ? "Processed" :
    all.some(p => p.status === "pending") ? "Pending" : "Draft";

  const payrollStatusColor: Record<string, string> = {
    "No Data": "bg-gray-500 text-white",
    "Pending": "bg-orange-500 text-white",
    "Draft": "bg-slate-500 text-white",
    "Processed": "bg-blue-500 text-white",
    "Approved": "bg-amber-500 text-white",
    "Locked": "bg-indigo-500 text-white",
    "Partial": "bg-yellow-500 text-white",
    "Paid": "bg-emerald-500 text-white",
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border border-orange-300 dark:border-orange-700",
      draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      processed: "bg-blue-500 text-white",
      approved: "bg-amber-500 text-white",
      partial: "bg-yellow-500 text-white",
      paid: "bg-emerald-500 text-white",
      rejected: "bg-red-500 text-white",
      locked: "bg-indigo-500 text-white",
    };
    return map[status] || "bg-gray-500 text-white";
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const deptColorMap: Record<string, string> = {
    engineering: "bg-blue-500 text-white",
    support: "bg-teal-500 text-white",
    sales: "bg-violet-500 text-white",
    finance: "bg-amber-500 text-white",
    admin: "bg-slate-500 text-white",
    management: "bg-indigo-500 text-white",
    hr: "bg-pink-500 text-white",
    it: "bg-cyan-500 text-white",
    operations: "bg-orange-500 text-white",
  };

  const monthLabel = (m: string) => {
    const [y, mo] = m.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(mo) - 1]} ${y}`;
  };

  return (
    <div className="p-4 max-w-[1400px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2" data-testid="text-page-title">
            <DollarSign className="h-5 w-5 text-primary" />
            Salary Processing
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">HR & Payroll &rsaquo; Monthly payroll management</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Button variant="outline" size="sm" className="gap-1.5 text-[11px]" onClick={() => window.print()} data-testid="button-print">
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-[11px]" data-testid="button-export">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button
            size="sm"
            className="gap-1.5 text-[11px]"
            onClick={() => {
              setPendingDialog(true);
              setPendingEmployeeId("");
              setPendingFromMonth("");
              setPendingToMonth("");
              setPendingAmount("");
              setPendingRemarks("");
            }}
            data-testid="button-add-pending-salary"
          >
            <Plus className="h-3.5 w-3.5" /> Add Pending Salary
          </Button>
        </div>
      </div>

      <Card className="enterprise-card">
        <CardContent className="py-3.5 px-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Payroll Month</label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={e => { setSelectedMonth(e.target.value); setCurrentPage(1); clearSelection(); }}
                className="h-9 text-[13px] w-[180px]"
                data-testid="input-payroll-month"
              />
            </div>
            <div className="flex flex-col gap-1 justify-end">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</label>
              <Badge variant="secondary" className={`no-default-active-elevate text-[11px] font-semibold border-0 px-3 py-1 ${payrollStatusColor[payrollStatus]}`} data-testid="badge-payroll-status">
                {payrollStatus}
              </Badge>
            </div>
            <div className="flex-1" />
            <Button
              size="sm"
              className="gap-1.5 text-[11px]"
              onClick={() => {
                if (confirm(`Process payroll for ${monthLabel(selectedMonth)}? This will generate salary entries for all active employees.`)) {
                  processMutation.mutate();
                }
              }}
              disabled={processMutation.isPending}
              data-testid="button-process-payroll"
            >
              <Play className="h-3.5 w-3.5" />
              {processMutation.isPending ? "Processing..." : "Process Payroll"}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-[11px]"
              onClick={() => {
                if (all.length === 0) {
                  toast({ title: "No Payroll Data", description: "Process payroll first before locking", variant: "destructive" });
                  return;
                }
                const canLock = all.some(p => p.status !== "paid" && p.status !== "locked");
                if (!canLock) {
                  toast({ title: "Cannot Lock", description: "All entries are already paid or locked", variant: "destructive" });
                  return;
                }
                if (confirm(`Lock payroll for ${monthLabel(selectedMonth)}? No further edits will be allowed.`)) {
                  lockMutation.mutate();
                }
              }}
              disabled={lockMutation.isPending}
              data-testid="button-lock-payroll"
            >
              <Lock className="h-3.5 w-3.5" /> {lockMutation.isPending ? "Locking..." : "Lock Payroll"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-[11px]"
              onClick={() => {
                if (all.length === 0) {
                  toast({ title: "No Payroll Data", description: "Process payroll first before unlocking", variant: "destructive" });
                  return;
                }
                if (!hasLocked) {
                  toast({ title: "Cannot Unlock", description: "No locked entries found. Only locked payroll can be unlocked.", variant: "destructive" });
                  return;
                }
                if (confirm(`Unlock payroll for ${monthLabel(selectedMonth)}? Locked entries will become editable again.`)) {
                  unlockMutation.mutate();
                }
              }}
              disabled={unlockMutation.isPending}
              data-testid="button-unlock-payroll"
            >
              <Unlock className="h-3.5 w-3.5" /> {unlockMutation.isPending ? "Unlocking..." : "Unlock Payroll"}
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              size="sm"
              className="gap-1.5 text-[11px]"
              variant="default"
              onClick={() => {
                if (all.length === 0) {
                  toast({ title: "No Payroll Data", description: "Process payroll first before paying salaries", variant: "destructive" });
                  return;
                }
                if (selectedPayable.length > 0) {
                  setBulkPayDialog(true);
                  setBulkPayMethod("bank");
                  setBulkPayRef("");
                } else if (!all.some(p => p.status !== "paid")) {
                  toast({ title: "All Paid", description: "All salary entries for this month have already been paid", variant: "destructive" });
                } else {
                  toast({ title: "No Selection", description: "Select employees using checkboxes in the table first", variant: "destructive" });
                }
              }}
              disabled={bulkPayMutation.isPending}
              data-testid="button-pay-salary"
            >
              <Banknote className="h-3.5 w-3.5" /> Pay Salary {selectedPayable.length > 0 && `(${selectedPayable.length})`}
            </Button>
            {all.length > 0 && payableEntries.length > 0 && selectedPayable.length === 0 && (
              <span className="text-[11px] text-muted-foreground ml-1">Select employees from table to pay</span>
            )}
            {all.length > 0 && all.every(p => p.status === "paid") && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium ml-1 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> All salaries paid for this month
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Card className="enterprise-card" data-testid="card-total-employees">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Employees</p>
                <p className="text-2xl font-bold mt-1" data-testid="text-total-employees">{totalEmployees}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card" data-testid="card-gross-salary">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Gross Salary</p>
                <p className="text-lg font-bold mt-1 text-foreground tabular-nums" data-testid="text-gross-salary">Rs. {totalGross.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card" data-testid="card-deductions">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Deductions</p>
                <p className="text-lg font-bold mt-1 text-red-600 dark:text-red-400 tabular-nums" data-testid="text-deductions">Rs. {totalDeductions.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card" data-testid="card-net-payable">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Net Payable</p>
                <p className="text-lg font-bold mt-1 text-primary tabular-nums" data-testid="text-net-payable">Rs. {totalNet.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card" data-testid="card-paid-count">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Paid</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400" data-testid="text-paid-count">{paidCount}<span className="text-sm text-muted-foreground font-normal">/{totalEmployees}</span></p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card" data-testid="card-pending-salary">
          <CardContent className="py-3.5 px-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pending Salary</p>
                {(() => {
                  const totalPending = Object.values(pendingSummary || {}).reduce((s, p) => s + p.totalAmount, 0);
                  const totalPendingEmployees = Object.keys(pendingSummary || {}).length;
                  return (
                    <>
                      <p className="text-lg font-bold mt-1 text-orange-600 dark:text-orange-400 tabular-nums" data-testid="text-pending-salary">Rs. {totalPending.toLocaleString()}</p>
                      {totalPendingEmployees > 0 && (
                        <p className="text-[10px] text-orange-500 dark:text-orange-400 mt-0.5">{totalPendingEmployees} employee{totalPendingEmployees > 1 ? "s" : ""}</p>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="enterprise-card">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1 min-w-[120px]">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</label>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); clearSelection(); }}>
                <SelectTrigger className="h-9 text-[13px]" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Department</label>
              <Select value={deptFilter} onValueChange={v => { setDeptFilter(v); setCurrentPage(1); clearSelection(); }}>
                <SelectTrigger className="h-9 text-[13px]" data-testid="select-dept-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {["engineering","support","sales","finance","admin","management","hr","it","operations"].map(d => (
                    <SelectItem key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase()+d.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground font-medium">Show</span>
                <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="h-8 w-[65px] text-[12px]" data-testid="select-page-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[11px] text-muted-foreground font-medium">entries</span>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search employee..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); clearSelection(); }}
                  className="pl-8 h-8 text-[12px] w-[200px]"
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <DollarSign className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium text-sm">No payroll data for {monthLabel(selectedMonth)}</p>
              <p className="text-xs mt-1">Click "Process Payroll" to generate salary entries</p>
            </div>
          ) : (
            <>
              {selectedPayable.length > 0 && (
                <div className="px-4 py-2.5 bg-primary/5 border-b border-border flex items-center justify-between" data-testid="bar-selection-info">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="no-default-active-elevate bg-primary text-white text-[11px] font-semibold border-0">
                      {selectedPayable.length} selected
                    </Badge>
                    <span className="text-[12px] text-muted-foreground">
                      Total payable: <strong className="text-primary tabular-nums">Rs. {selectedPayableTotal.toLocaleString()}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="gap-1.5 text-[11px]"
                      onClick={() => {
                        setBulkPayDialog(true); setBulkPayMethod("bank"); setBulkPayRef(""); setBulkPayRemarks("");
                        const amts: Record<number, string> = {};
                        filtered.filter(p => selectedIds.has(p.id) && p.status !== "paid").forEach(p => { amts[p.id] = String(Number(p.netSalary)); });
                        setBulkPayAmounts(amts);
                      }}
                      data-testid="button-pay-selected"
                    >
                      <Banknote className="h-3.5 w-3.5" /> Pay Selected ({selectedPayable.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[11px]"
                      onClick={() => setSelectedIds(new Set())}
                      data-testid="button-clear-selection"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-800 dark:to-slate-700 hover:from-slate-800 hover:to-slate-700">
                      <TableHead className="text-white py-3 w-[40px] text-center">
                        <Checkbox
                          checked={allPayableSelected}
                          onCheckedChange={toggleSelectAll}
                          className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-slate-800"
                          data-testid="checkbox-select-all"
                        />
                      </TableHead>
                      <TableHead className="text-white font-semibold text-[11px] uppercase py-3 w-[50px] text-center">#</TableHead>
                      <TableHead className="text-white font-semibold text-[11px] uppercase py-3 min-w-[70px]">Emp ID</TableHead>
                      <TableHead className="text-white font-semibold text-[11px] uppercase py-3 min-w-[150px]">Employee</TableHead>
                      <TableHead className="text-white font-semibold text-[11px] uppercase py-3 min-w-[90px]">Department</TableHead>
                      <TableHead className="text-white font-semibold text-[11px] uppercase py-3 text-right min-w-[90px]">Base Salary</TableHead>
                      <TableHead className="text-white font-semibold text-[11px] uppercase py-3 text-right min-w-[70px]">Overtime</TableHead>
                      <TableHead className="text-white font-semibold text-[11px] uppercase py-3 text-right min-w-[70px]">Bonus</TableHead>
                      <TableHead className="text-white font-semibold text-[11px] uppercase py-3 text-right min-w-[70px]">Loan Ded.</TableHead>
                      <TableHead className="text-white font-semibold text-[11px] uppercase py-3 text-right min-w-[60px]">Tax</TableHead>
                      <TableHead className="text-white font-semibold text-[11px] uppercase py-3 text-right min-w-[100px]">Net Salary</TableHead>
                      <TableHead className="text-white font-semibold text-[11px] uppercase py-3 text-right min-w-[90px]">Old Pending</TableHead>
                      <TableHead className="text-white font-semibold text-[11px] uppercase py-3 text-right min-w-[90px]">Paid</TableHead>
                      <TableHead className="text-white font-semibold text-[11px] uppercase py-3 text-right min-w-[100px]">Remaining</TableHead>
                      <TableHead className="text-white font-semibold text-[11px] uppercase py-3 text-center min-w-[80px]">Status</TableHead>
                      <TableHead className="text-white font-semibold text-[11px] uppercase py-3 text-center min-w-[120px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((entry, idx) => {
                      const serialNo = (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <TableRow
                          key={entry.id}
                          className={`border-b border-border transition-colors ${idx % 2 === 0 ? "bg-background" : "bg-muted/20"} hover:bg-primary/5`}
                          data-testid={`row-payroll-${entry.id}`}
                        >
                          <TableCell className="text-center py-2.5">
                            {entry.status !== "paid" ? (
                              <Checkbox
                                checked={selectedIds.has(entry.id)}
                                onCheckedChange={() => toggleSelect(entry.id)}
                                data-testid={`checkbox-select-${entry.id}`}
                              />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center text-[13px] font-medium text-muted-foreground py-2.5">{serialNo}</TableCell>
                          <TableCell className="py-2.5">
                            <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300" data-testid={`text-emp-code-${entry.id}`}>{entry.empCode}</span>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <p className="text-[13px] font-semibold" data-testid={`text-emp-name-${entry.id}`}>{entry.employeeName}</p>
                            <p className="text-[10px] text-muted-foreground">{entry.designation}</p>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge variant="secondary" className={`no-default-active-elevate text-[10px] font-semibold border-0 ${deptColorMap[entry.department || ""] || "bg-gray-500 text-white"}`}>
                              {entry.department ? entry.department.charAt(0).toUpperCase() + entry.department.slice(1) : "--"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5 text-[13px] text-right font-medium tabular-nums">{Number(entry.baseSalary).toLocaleString()}</TableCell>
                          <TableCell className="py-2.5 text-[13px] text-right tabular-nums text-muted-foreground">{Number(entry.overtime) > 0 ? <span className="text-purple-600 dark:text-purple-400 font-medium">+{Number(entry.overtime).toLocaleString()}</span> : "--"}</TableCell>
                          <TableCell className="py-2.5 text-[13px] text-right tabular-nums">{Number(entry.bonus) > 0 ? <span className="text-violet-600 dark:text-violet-400 font-medium">+{Number(entry.bonus).toLocaleString()}</span> : "--"}</TableCell>
                          <TableCell className="py-2.5 text-[13px] text-right tabular-nums">{Number(entry.loanDeduction) > 0 ? <span className="text-red-500 font-medium">-{Number(entry.loanDeduction).toLocaleString()}</span> : "--"}</TableCell>
                          <TableCell className="py-2.5 text-[13px] text-right tabular-nums">{Number(entry.tax) > 0 ? <span className="text-red-500 font-medium">-{Number(entry.tax).toLocaleString()}</span> : "--"}</TableCell>
                          <TableCell className="py-2.5 text-right">
                            <span className="text-[14px] font-bold tabular-nums text-primary" data-testid={`text-net-salary-${entry.id}`}>Rs. {Number(entry.netSalary).toLocaleString()}</span>
                          </TableCell>
                          <TableCell className="py-2.5 text-right" data-testid={`cell-pending-${entry.id}`}>
                            {(() => {
                              const pend = pendingSummary?.[String(entry.employeeId)];
                              if (!pend || pend.count === 0) return <span className="text-[11px] text-muted-foreground">--</span>;
                              return (
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="text-[13px] font-semibold tabular-nums text-orange-600 dark:text-orange-400" data-testid={`text-pending-amount-${entry.id}`}>Rs. {pend.totalAmount.toLocaleString()}</span>
                                  <Badge variant="secondary" className="no-default-active-elevate text-[9px] font-semibold border border-orange-300 dark:border-orange-700 bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" data-testid={`badge-pending-count-${entry.id}`}>
                                    {pend.count} mo
                                  </Badge>
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="py-2.5 text-right" data-testid={`cell-paid-${entry.id}`}>
                            {(() => {
                              const ps = paymentsSummary?.[String(entry.id)];
                              const netSalary = Number(entry.netSalary);
                              const pend = pendingSummary?.[String(entry.employeeId)];
                              const oldPending = pend && pend.count > 0 ? pend.totalAmount : 0;
                              const totalDue = netSalary + oldPending;
                              if (!ps || ps.totalPaid === 0) {
                                if (entry.status === "paid") return <span className="text-[13px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">Rs. {netSalary.toLocaleString()}</span>;
                                return <span className="text-[11px] text-muted-foreground">--</span>;
                              }
                              const pct = Math.round((ps.totalPaid / totalDue) * 100);
                              return (
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="text-[13px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">Rs. {ps.totalPaid.toLocaleString()}</span>
                                  <div className="flex items-center gap-1">
                                    <div className="w-14 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : "bg-yellow-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                    </div>
                                    <span className="text-[9px] text-muted-foreground">{pct}%</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="py-2.5 text-right" data-testid={`cell-remaining-${entry.id}`}>
                            {(() => {
                              const ps = paymentsSummary?.[String(entry.id)];
                              const netSalary = Number(entry.netSalary);
                              const pend = pendingSummary?.[String(entry.employeeId)];
                              const oldPending = pend && pend.count > 0 ? pend.totalAmount : 0;
                              const totalDue = netSalary + oldPending;
                              const totalPaid = ps ? ps.totalPaid : (entry.status === "paid" ? netSalary : 0);
                              const totalRemaining = Math.max(0, totalDue - totalPaid);
                              if (totalRemaining <= 0) return <span className="text-[11px] text-muted-foreground">--</span>;
                              return <span className="text-[13px] font-semibold tabular-nums text-red-500" data-testid={`text-remaining-${entry.id}`}>Rs. {totalRemaining.toLocaleString()}</span>;
                            })()}
                          </TableCell>
                          <TableCell className="py-2.5 text-center">
                            <Badge variant="secondary" className={`no-default-active-elevate text-[10px] font-semibold border-0 capitalize ${statusBadge(entry.status)}`} data-testid={`badge-status-${entry.id}`}>
                              {entry.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="outline" size="sm" className="px-2 text-blue-600 dark:text-blue-400" onClick={() => setDetailEntry(entry)} data-testid={`button-view-${entry.id}`} title="View Payslip">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              {entry.status !== "paid" && entry.status !== "locked" && (
                                <Button variant="outline" size="sm" className="px-2 text-emerald-600 dark:text-emerald-400" onClick={() => { setEditEntry(entry); setEditOvertime(entry.overtime || "0"); setEditBonus(entry.bonus || "0"); setEditCommission(entry.commission || "0"); setEditOtherDed(entry.otherDeductions || "0"); setEditAttDed(entry.attendanceDeduction || "0"); setEditTax(entry.tax || "0"); setEditRemarks(entry.remarks || ""); }} data-testid={`button-edit-${entry.id}`} title="Edit">
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {(() => {
                                const ps = pendingSummary?.[String(entry.employeeId)];
                                const oldPend = ps && ps.count > 0 ? ps.totalAmount : 0;
                                const pm = paymentsSummary?.[String(entry.id)];
                                const paidAmt = pm ? pm.totalPaid : (entry.status === "paid" ? Number(entry.netSalary) : 0);
                                const totalOwed = Number(entry.netSalary) + oldPend;
                                const totalRemaining = totalOwed - paidAmt;
                                const showPay = entry.status === "processed" || entry.status === "approved" || entry.status === "locked" || entry.status === "partial" || (entry.status === "paid" && totalRemaining > 0);
                                if (!showPay) return null;
                                const payLabel = (entry.status === "partial" || (entry.status === "paid" && totalRemaining > 0)) ? "Pay Remaining" : "Mark Paid";
                                return (
                                  <Button variant="outline" size="sm" className="px-2 text-emerald-600 dark:text-emerald-400" onClick={() => { setPayDialog(entry); setPayMethod("bank"); setPayRef(""); setPayRemarks(""); setPayAmount(""); }} data-testid={`button-pay-${entry.id}`} title={payLabel}>
                                    <CreditCard className="h-3.5 w-3.5" />
                                  </Button>
                                );
                              })()}
                              {entry.status === "processed" && (
                                <Button variant="outline" size="sm" className="px-2 text-amber-600 dark:text-amber-400" onClick={() => approveMutation.mutate(entry.id)} data-testid={`button-approve-${entry.id}`} title="Approve">
                                  <BadgeCheck className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <div className="text-[12px] text-muted-foreground">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filtered.length)} to {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="px-2 text-[11px]" disabled={currentPage === 1} onClick={() => setCurrentPage(1)} data-testid="button-first-page">First</Button>
                  <Button variant="outline" size="sm" className="px-2 text-[11px]" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} data-testid="button-prev-page">
                    <ChevronLeft className="h-3 w-3 mr-0.5" /> Prev
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) page = i + 1;
                    else if (currentPage <= 3) page = i + 1;
                    else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                    else page = currentPage - 2 + i;
                    return (
                      <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" className="px-2 min-w-[28px] text-[11px]" onClick={() => setCurrentPage(page)} data-testid={`button-page-${page}`}>{page}</Button>
                    );
                  })}
                  <Button variant="outline" size="sm" className="px-2 text-[11px]" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} data-testid="button-next-page">
                    Next <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="px-2 text-[11px]" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)} data-testid="button-last-page">Last</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {all.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="enterprise-card">
            <CardContent className="pt-5 pb-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Department-wise Distribution
              </h3>
              <div className="space-y-2">
                {["engineering","support","sales","finance","admin","management","hr","it","operations"].map(dept => {
                  const deptEntries = all.filter(p => p.department === dept);
                  if (deptEntries.length === 0) return null;
                  const deptTotal = deptEntries.reduce((s, p) => s + Number(p.netSalary), 0);
                  const pct = totalNet > 0 ? (deptTotal / totalNet) * 100 : 0;
                  return (
                    <div key={dept} className="flex items-center gap-3">
                      <span className="text-[11px] font-medium capitalize w-[90px]">{dept}</span>
                      <div className="flex-1">
                        <Progress value={pct} className="h-2" />
                      </div>
                      <span className="text-[11px] font-semibold tabular-nums w-[100px] text-right">Rs. {deptTotal.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <Card className="enterprise-card">
            <CardContent className="pt-5 pb-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Payroll Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">Total Base Salary</span>
                  <span className="text-sm font-bold tabular-nums">Rs. {totalGross.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">Total Overtime</span>
                  <span className="text-sm font-bold tabular-nums text-purple-600">Rs. {all.reduce((s, p) => s + Number(p.overtime), 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">Total Bonus</span>
                  <span className="text-sm font-bold tabular-nums text-violet-600">Rs. {all.reduce((s, p) => s + Number(p.bonus), 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">Loan Deductions</span>
                  <span className="text-sm font-bold tabular-nums text-red-500">-Rs. {all.reduce((s, p) => s + Number(p.loanDeduction), 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-xs text-muted-foreground">Tax Deductions</span>
                  <span className="text-sm font-bold tabular-nums text-red-500">-Rs. {all.reduce((s, p) => s + Number(p.tax), 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs font-semibold">Net Payable</span>
                  <span className="text-base font-bold tabular-nums text-primary">Rs. {totalNet.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <PayslipDialog
        detailEntry={detailEntry}
        setDetailEntry={setDetailEntry}
        pendingSummary={pendingSummary}
        statusBadge={statusBadge}
        monthLabel={monthLabel}
        editPayment={editPayment}
        setEditPayment={setEditPayment}
        editPaymentAmount={editPaymentAmount}
        setEditPaymentAmount={setEditPaymentAmount}
        editPaymentMethod={editPaymentMethod}
        setEditPaymentMethod={setEditPaymentMethod}
        editPaymentRef={editPaymentRef}
        setEditPaymentRef={setEditPaymentRef}
        editPaymentRemarks={editPaymentRemarks}
        setEditPaymentRemarks={setEditPaymentRemarks}
        updatePaymentMutation={updatePaymentMutation}
        deletePaymentMutation={deletePaymentMutation}
      />

      <Dialog open={!!editEntry} onOpenChange={open => { if (!open) setEditEntry(null); }}>
        <DialogContent className="max-w-lg" data-testid="dialog-edit-payroll">
          {editEntry && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">Edit Payroll — {editEntry.employeeName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Overtime (Rs.)</label>
                    <Input type="number" step="0.01" value={editOvertime} onChange={e => setEditOvertime(e.target.value)} className="h-9 text-[13px] mt-1" data-testid="input-edit-overtime" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Bonus (Rs.)</label>
                    <Input type="number" step="0.01" value={editBonus} onChange={e => setEditBonus(e.target.value)} className="h-9 text-[13px] mt-1" data-testid="input-edit-bonus" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Commission (Rs.)</label>
                    <Input type="number" step="0.01" value={editCommission} onChange={e => setEditCommission(e.target.value)} className="h-9 text-[13px] mt-1" data-testid="input-edit-commission" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Other Deductions (Rs.)</label>
                    <Input type="number" step="0.01" value={editOtherDed} onChange={e => setEditOtherDed(e.target.value)} className="h-9 text-[13px] mt-1" data-testid="input-edit-other-deductions" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Attendance Deduction (Rs.)</label>
                    <Input type="number" step="0.01" value={editAttDed} onChange={e => setEditAttDed(e.target.value)} className="h-9 text-[13px] mt-1" data-testid="input-edit-attendance-ded" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Tax (Rs.)</label>
                    <Input type="number" step="0.01" value={editTax} onChange={e => setEditTax(e.target.value)} className="h-9 text-[13px] mt-1" data-testid="input-edit-tax" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Remarks</label>
                  <Textarea className="text-[13px] resize-none mt-1" rows={2} value={editRemarks} onChange={e => setEditRemarks(e.target.value)} data-testid="input-edit-remarks" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditEntry(null)}>Cancel</Button>
                <Button
                  data-testid="button-save-edit"
                  onClick={() => {
                    const ot = Number(editOvertime) || 0;
                    const bn = Number(editBonus) || 0;
                    const cm = Number(editCommission) || 0;
                    const od = Number(editOtherDed) || 0;
                    const ad = Number(editAttDed) || 0;
                    const tx = Number(editTax) || 0;
                    const base = Number(editEntry.baseSalary);
                    const loan = Number(editEntry.loanDeduction);
                    const net = base + ot + bn + cm - ad - loan - tx - od;
                    updateMutation.mutate({
                      id: editEntry.id,
                      data: {
                        overtime: ot.toFixed(2),
                        bonus: bn.toFixed(2),
                        commission: cm.toFixed(2),
                        otherDeductions: od.toFixed(2),
                        attendanceDeduction: ad.toFixed(2),
                        tax: tx.toFixed(2),
                        netSalary: Math.max(0, net).toFixed(2),
                        remarks: editRemarks,
                      },
                    });
                  }}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PayDialogComponent
        payDialog={payDialog}
        setPayDialog={setPayDialog}
        payAmount={payAmount}
        setPayAmount={setPayAmount}
        payMethod={payMethod}
        setPayMethod={setPayMethod}
        payRef={payRef}
        setPayRef={setPayRef}
        payRemarks={payRemarks}
        setPayRemarks={setPayRemarks}
        employees={employees}
        markPaidMutation={markPaidMutation}
        pendingSummary={pendingSummary}
        paymentsSummary={paymentsSummary}
      />

      <Dialog open={bulkPayDialog} onOpenChange={open => { if (!open) { setBulkPayDialog(false); setBulkPayMethod("bank"); setBulkPayRef(""); setBulkPayRemarks(""); setBulkPayAmounts({}); } }}>
        <DialogContent className="max-w-lg" data-testid="dialog-bulk-pay">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Banknote className="h-4 w-4 text-primary" />
              Pay Salary — {selectedPayable.length} Employee{selectedPayable.length > 1 ? "s" : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="border border-border rounded-lg p-3 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Payment Summary</span>
              <Badge variant="secondary" className="no-default-active-elevate bg-primary text-white text-[11px] font-semibold border-0">
                {selectedPayable.length} employee{selectedPayable.length > 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-1.5">
              {filtered.filter(p => selectedIds.has(p.id) && p.status !== "paid").map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{p.employeeName}</span>
                    <span className="text-muted-foreground ml-1.5">({p.empCode})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">Rs.</span>
                    <Input
                      type="number"
                      value={bulkPayAmounts[p.id] ?? String(Number(p.netSalary))}
                      onChange={e => setBulkPayAmounts(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="h-7 w-[110px] text-[12px] font-semibold tabular-nums text-right"
                      min="0"
                      step="1"
                      data-testid={`input-bulk-amount-${p.id}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
              <span className="text-xs font-semibold">Total Payable</span>
              <span className="text-sm font-bold text-primary tabular-nums" data-testid="text-bulk-total">
                Rs. {Object.values(bulkPayAmounts).reduce((s, v) => s + Number(v || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Payment Type</label>
              <Select value={bulkPayMethod} onValueChange={v => { setBulkPayMethod(v); setBulkPayRef(""); }}>
                <SelectTrigger className="h-9 text-[13px] mt-1" data-testid="select-bulk-pay-method">
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
            {bulkPayMethod === "bank" && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3" data-testid="section-bulk-bank-details">
                <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2">Employee Bank Accounts</p>
                <div className="max-h-[120px] overflow-y-auto space-y-1.5">
                  {filtered.filter(p => selectedIds.has(p.id) && p.status !== "paid").map(p => {
                    const emp = employees?.find(e => e.id === p.employeeId);
                    return (
                      <div key={p.id} className="flex items-center justify-between text-[11px] py-1 border-b border-blue-200 dark:border-blue-800 last:border-0">
                        <span className="font-medium">{p.employeeName}</span>
                        <span className="text-muted-foreground font-mono" data-testid={`text-bulk-bank-${p.id}`}>
                          {emp?.bankAccount || emp?.bankName ? `${emp.bankName || ""} ${emp.bankAccount ? `- ${emp.bankAccount}` : ""}`.trim() : "No bank details"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Transaction Reference</label>
              <Input
                value={bulkPayRef}
                onChange={e => setBulkPayRef(e.target.value)}
                className="h-9 text-[13px] mt-1"
                placeholder={bulkPayMethod === "cheque" ? "Cheque No." : bulkPayMethod === "cash" ? "Receipt No." : "TXN-BATCH-001"}
                data-testid="input-bulk-pay-ref"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Remarks</label>
              <Textarea
                value={bulkPayRemarks}
                onChange={e => setBulkPayRemarks(e.target.value)}
                className="text-[13px] mt-1 min-h-[60px] resize-none"
                placeholder="Optional payment notes..."
                data-testid="input-bulk-pay-remarks"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkPayDialog(false)} data-testid="button-cancel-bulk-pay">Cancel</Button>
            <Button
              onClick={() => bulkPayMutation.mutate({ ids: selectedPayable, method: bulkPayMethod, ref: bulkPayRef, remarks: bulkPayRemarks, amounts: bulkPayAmounts })}
              disabled={bulkPayMutation.isPending}
              data-testid="button-confirm-bulk-pay"
            >
              {bulkPayMutation.isPending ? `Paying ${selectedPayable.length}...` : `Pay ${selectedPayable.length} Employee${selectedPayable.length > 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingDialog} onOpenChange={open => { if (!open) setPendingDialog(false); }}>
        <DialogContent className="max-w-lg" data-testid="dialog-pending-salary">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Add Pending Salary
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Record pending/unpaid salary for past months. This is useful when starting to use the system and need to enter salary history.
          </p>
          <div className="space-y-3 mt-1">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Employee</label>
              <Select value={pendingEmployeeId} onValueChange={(val) => {
                setPendingEmployeeId(val);
                const emp = (employees || []).find(e => e.id === Number(val));
                if (emp && emp.salary) setPendingAmount(emp.salary);
              }}>
                <SelectTrigger className="h-9 text-[13px] mt-1" data-testid="select-pending-employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_employees">All Active Employees</SelectItem>
                  {(employees || []).filter(e => e.status === "active").map(emp => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.empCode} - {emp.fullName} ({emp.department})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">From Month</label>
                <Input
                  type="month"
                  value={pendingFromMonth}
                  onChange={e => setPendingFromMonth(e.target.value)}
                  className="h-9 text-[13px] mt-1"
                  data-testid="input-pending-from-month"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">To Month</label>
                <Input
                  type="month"
                  value={pendingToMonth}
                  onChange={e => setPendingToMonth(e.target.value)}
                  className="h-9 text-[13px] mt-1"
                  data-testid="input-pending-to-month"
                />
              </div>
            </div>
            {pendingEmployeeId && pendingEmployeeId !== "all_employees" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Salary Amount (Rs.)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={pendingAmount}
                  onChange={e => setPendingAmount(e.target.value)}
                  className="h-9 text-[13px] mt-1"
                  placeholder="Employee's monthly salary"
                  data-testid="input-pending-amount"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Remarks</label>
              <Textarea
                value={pendingRemarks}
                onChange={e => setPendingRemarks(e.target.value)}
                className="text-[13px] resize-none mt-1"
                rows={2}
                placeholder="e.g. Pending salary before system migration"
                data-testid="input-pending-remarks"
              />
            </div>
            {pendingFromMonth && pendingToMonth && pendingFromMonth <= pendingToMonth && (
              <div className="border border-border rounded-lg p-3 bg-muted/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Months to create:</span>
                  <span className="font-semibold">
                    {(() => {
                      const [fy, fm] = pendingFromMonth.split("-").map(Number);
                      const [ty, tm] = pendingToMonth.split("-").map(Number);
                      return (ty - fy) * 12 + (tm - fm) + 1;
                    })()} month(s)
                  </span>
                </div>
                {pendingEmployeeId === "all_employees" && (
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Employees:</span>
                    <span className="font-semibold">{(employees || []).filter(e => e.status === "active").length} active</span>
                  </div>
                )}
                {pendingEmployeeId && pendingEmployeeId !== "all_employees" && pendingAmount && (
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Total pending amount:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      Rs. {(Number(pendingAmount) * ((() => {
                        const [fy, fm] = pendingFromMonth.split("-").map(Number);
                        const [ty, tm] = pendingToMonth.split("-").map(Number);
                        return (ty - fy) * 12 + (tm - fm) + 1;
                      })())).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!pendingEmployeeId) {
                  toast({ title: "Select an employee", variant: "destructive" });
                  return;
                }
                if (!pendingFromMonth || !pendingToMonth) {
                  toast({ title: "Select from and to months", variant: "destructive" });
                  return;
                }
                if (pendingFromMonth > pendingToMonth) {
                  toast({ title: "From month must be before or equal to To month", variant: "destructive" });
                  return;
                }
                if (pendingEmployeeId === "all_employees") {
                  pendingSalaryMutation.mutate({
                    employeeId: 0,
                    fromMonth: pendingFromMonth,
                    toMonth: pendingToMonth,
                    amount: "0",
                    remarks: pendingRemarks,
                  });
                } else {
                  if (!pendingAmount || Number(pendingAmount) <= 0) {
                    toast({ title: "Enter a valid salary amount", variant: "destructive" });
                    return;
                  }
                  pendingSalaryMutation.mutate({
                    employeeId: Number(pendingEmployeeId),
                    fromMonth: pendingFromMonth,
                    toMonth: pendingToMonth,
                    amount: pendingAmount,
                    remarks: pendingRemarks,
                  });
                }
              }}
              disabled={pendingSalaryMutation.isPending}
              data-testid="button-confirm-pending"
            >
              {pendingSalaryMutation.isPending ? "Creating..." : "Add Pending Salary"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
