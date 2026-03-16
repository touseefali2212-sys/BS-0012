import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InvoiceTemplate } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText, Plus, Copy, Pencil, Trash2, Star, Eye, Archive,
  Save, Loader2, Receipt, Building2, Wifi, Users, Package,
  Palette, Settings, Printer, Download, Mail, QrCode, BarChart3,
  Type, Layout, Table, Image, AlignLeft, AlignCenter, AlignRight,
  Hash, Calendar, CreditCard, MapPin, Phone, FileCheck, Ban,
  CheckCircle2, Clock, AlertTriangle, Info
} from "lucide-react";

const INVOICE_CATEGORIES = [
  { key: "customer", label: "Customer Invoice", icon: Receipt, desc: "Standard customer billing invoices" },
  { key: "corporate", label: "Corporate Invoice", icon: Building2, desc: "Corporate account invoices with bulk features" },
  { key: "cir", label: "CIR Invoice", icon: Wifi, desc: "Committed Information Rate billing invoices" },
  { key: "reseller", label: "Reseller Invoice", icon: Users, desc: "Reseller and partner billing invoices" },
  { key: "inventory", label: "Inventory Invoice", icon: Package, desc: "Inventory purchase and sales invoices" },
];

const TEMPLATE_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "proforma", label: "Proforma" },
  { value: "credit_note", label: "Credit Note" },
  { value: "recurring", label: "Recurring" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-green-500/10 text-green-600 border-green-200" },
  draft: { label: "Draft", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  default: { label: "Default", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  scheduled: { label: "Scheduled", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  disabled: { label: "Disabled", color: "bg-red-500/10 text-red-600 border-red-200" },
  archived: { label: "Archived", color: "bg-slate-500/10 text-slate-600 border-slate-200" },
};

const HEADER_FIELDS = [
  { key: "headerShowLogo", label: "Company Logo", icon: Image },
  { key: "headerShowCompanyDetails", label: "Company Details", icon: Building2 },
  { key: "headerShowTaxReg", label: "Tax Registration Number", icon: Hash },
  { key: "headerShowContact", label: "Contact Information", icon: Phone },
];

const INVOICE_FIELDS = [
  { key: "invoiceShowNumber", label: "Invoice Number", icon: Hash },
  { key: "invoiceShowDate", label: "Invoice Date", icon: Calendar },
  { key: "invoiceShowDueDate", label: "Due Date", icon: Clock },
  { key: "invoiceShowPaymentTerms", label: "Payment Terms", icon: FileCheck },
  { key: "invoiceShowCustomerId", label: "Customer ID", icon: Users },
];

const CUSTOMER_FIELDS = [
  { key: "customerShowName", label: "Customer Name", icon: Users },
  { key: "customerShowAddress", label: "Address", icon: MapPin },
  { key: "customerShowContact", label: "Contact Info", icon: Phone },
  { key: "customerShowAccount", label: "Account Number", icon: Hash },
];

const ITEM_FIELDS = [
  { key: "itemShowDescription", label: "Item Description", icon: FileText },
  { key: "itemShowSku", label: "SKU", icon: Hash },
  { key: "itemShowQty", label: "Quantity", icon: BarChart3 },
  { key: "itemShowUnitPrice", label: "Unit Price", icon: CreditCard },
  { key: "itemShowDiscount", label: "Discount", icon: Receipt },
  { key: "itemShowTax", label: "Tax", icon: Receipt },
  { key: "itemShowSubtotal", label: "Subtotal", icon: CreditCard },
  { key: "itemShowTotal", label: "Total", icon: CreditCard },
];

const FOOTER_FIELDS = [
  { key: "footerShowNotes", label: "Notes", icon: FileText },
  { key: "footerShowBankDetails", label: "Bank Details", icon: Building2 },
  { key: "footerShowQrCode", label: "QR Code", icon: QrCode },
  { key: "footerShowSignature", label: "Authorized Signature", icon: FileCheck },
  { key: "footerShowTerms", label: "Terms & Conditions", icon: FileText },
];

export default function InvoiceTemplatesPage() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("customer");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [editTab, setEditTab] = useState("layout");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("standard");
  const [newBranch, setNewBranch] = useState("");
  const [newGroup, setNewGroup] = useState("");

  const { data: allTemplates = [], isLoading } = useQuery<InvoiceTemplate[]>({
    queryKey: ["/api/invoice-templates"],
  });

  const categoryTemplates = useMemo(
    () => allTemplates.filter(t => t.invoiceCategory === activeCategory),
    [allTemplates, activeCategory]
  );

  const selectedTemplate = useMemo(
    () => allTemplates.find(t => t.id === selectedTemplateId),
    [allTemplates, selectedTemplateId]
  );

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/invoice-templates", data);
      return res.json();
    },
    onSuccess: (t: InvoiceTemplate) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-templates"] });
      setSelectedTemplateId(t.id);
      setShowCreateDialog(false);
      setNewName("");
      setNewType("standard");
      setNewBranch("");
      setNewGroup("");
      toast({ title: "Template created", description: t.name });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/invoice-templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-templates"] });
      toast({ title: "Template updated" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/invoice-templates/${id}/duplicate`, {});
      return res.json();
    },
    onSuccess: (t: InvoiceTemplate) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-templates"] });
      setSelectedTemplateId(t.id);
      toast({ title: "Template duplicated", description: t.name });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/invoice-templates/${id}/set-default`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-templates"] });
      toast({ title: "Default template set" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/invoice-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-templates"] });
      setSelectedTemplateId(null);
      setShowDeleteDialog(false);
      toast({ title: "Template deleted" });
    },
    onError: (e: any) => {
      toast({ title: "Cannot delete", description: e.message, variant: "destructive" });
    },
  });

  const updateField = (field: string, value: any) => {
    if (!selectedTemplateId) return;
    updateMutation.mutate({ id: selectedTemplateId, data: { [field]: value } });
  };

  const getVal = (field: string, fallback: any = "") => {
    if (!selectedTemplate) return fallback;
    return (selectedTemplate as any)[field] ?? fallback;
  };

  const summaryByCategory = useMemo(() => {
    const map: Record<string, { total: number; active: number; defaults: number }> = {};
    INVOICE_CATEGORIES.forEach(c => {
      const ts = allTemplates.filter(t => t.invoiceCategory === c.key);
      map[c.key] = { total: ts.length, active: ts.filter(t => t.status === "active" || t.isDefault).length, defaults: ts.filter(t => t.isDefault).length };
    });
    return map;
  }, [allTemplates]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const renderLivePreview = () => {
    if (!selectedTemplate) return null;
    const t = selectedTemplate;
    return (
      <div className="border border-slate-200 rounded-lg bg-white shadow-sm p-6 text-sm max-h-[600px] overflow-y-auto" style={{ fontFamily: t.fontFamily || "Inter" }} data-testid="div-live-preview">
        {t.watermarkText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 text-6xl font-bold text-slate-400 rotate-[-30deg]">
            {t.watermarkText}
          </div>
        )}
        {(t.headerShowLogo || t.headerShowCompanyDetails) && (
          <div className="flex justify-between items-start mb-4 pb-4 border-b" style={{ borderColor: t.accentColor || "#2563EB" }}>
            <div className="flex items-center gap-3">
              {t.headerShowLogo && (
                <div className="w-12 h-12 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: t.primaryColor || "#334155" }}>LOGO</div>
              )}
              {t.headerShowCompanyDetails && (
                <div>
                  <p className="font-bold text-base" style={{ color: t.primaryColor || "#334155" }}>NetSphere Technologies</p>
                  <p className="text-[10px] text-muted-foreground">ISP & Enterprise Solutions</p>
                  {t.headerShowContact && <p className="text-[10px] text-muted-foreground">+92 300 1234567 | info@netsphere.pk</p>}
                  {t.headerShowTaxReg && <p className="text-[10px] text-muted-foreground">Tax Reg: NTN-1234567-8</p>}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-lg font-bold" style={{ color: t.accentColor || "#2563EB" }}>INVOICE</p>
              {t.invoiceShowNumber && <p className="text-[10px]">INV-2026-001234</p>}
              {t.invoiceShowDate && <p className="text-[10px]">Date: Mar 03, 2026</p>}
              {t.invoiceShowDueDate && <p className="text-[10px]">Due: Mar 18, 2026</p>}
            </div>
          </div>
        )}

        {(t.customerShowName || t.customerShowAddress) && (
          <div className="mb-4 p-3 rounded" style={{ backgroundColor: `${t.primaryColor || "#334155"}08` }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Bill To</p>
            {t.customerShowName && <p className="font-medium">Muhammad Ali Khan</p>}
            {t.customerShowAddress && <p className="text-[10px] text-muted-foreground">House 23, Street 5, Gulberg III, Lahore</p>}
            {t.customerShowContact && <p className="text-[10px] text-muted-foreground">+92 321 9876543</p>}
            {t.customerShowAccount && <p className="text-[10px] text-muted-foreground">Account: CUST-001234</p>}
          </div>
        )}

        <table className="w-full mb-4 text-[10px]">
          <thead>
            <tr style={{
              backgroundColor: t.tableHeaderStyle === "filled" ? (t.primaryColor || "#334155") : "transparent",
              color: t.tableHeaderStyle === "filled" ? "white" : (t.primaryColor || "#334155"),
              borderBottom: t.tableHeaderStyle !== "filled" ? `2px solid ${t.primaryColor || "#334155"}` : "none",
            }}>
              {t.itemShowDescription && <th className="text-left py-1.5 px-2">Description</th>}
              {t.itemShowSku && <th className="text-left py-1.5 px-2">SKU</th>}
              {t.itemShowQty && <th className="text-center py-1.5 px-2">Qty</th>}
              {t.itemShowUnitPrice && <th className="text-right py-1.5 px-2">Price</th>}
              {t.itemShowDiscount && <th className="text-right py-1.5 px-2">Disc</th>}
              {t.itemShowTax && <th className="text-right py-1.5 px-2">{t.taxLabel || "Tax"}</th>}
              {t.itemShowTotal && <th className="text-right py-1.5 px-2">Total</th>}
            </tr>
          </thead>
          <tbody>
            {[
              { desc: "Internet Package - 50Mbps", sku: "PKG-050", qty: 1, price: 3500, disc: 0, tax: 612, total: 4112 },
              { desc: "Static IP Address", sku: "SIP-001", qty: 1, price: 500, disc: 50, tax: 78, total: 528 },
              { desc: "Router Rental", sku: "RTR-WF6", qty: 1, price: 200, disc: 0, tax: 35, total: 235 },
            ].map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? "" : "bg-slate-50/50"} style={{ borderBottom: `1px ${t.borderStyle || "solid"} #e2e8f0` }}>
                {t.itemShowDescription && <td className="py-1.5 px-2">{item.desc}</td>}
                {t.itemShowSku && <td className="py-1.5 px-2">{item.sku}</td>}
                {t.itemShowQty && <td className="text-center py-1.5 px-2">{item.qty}</td>}
                {t.itemShowUnitPrice && <td className="text-right py-1.5 px-2">{t.currencyPosition === "before" ? `${t.currencySymbol || "Rs."} ` : ""}{item.price.toFixed(t.decimalPrecision || 2)}{t.currencyPosition === "after" ? ` ${t.currencySymbol || "Rs."}` : ""}</td>}
                {t.itemShowDiscount && <td className="text-right py-1.5 px-2">{item.disc}</td>}
                {t.itemShowTax && <td className="text-right py-1.5 px-2">{item.tax}</td>}
                {t.itemShowTotal && <td className="text-right py-1.5 px-2 font-medium">{t.currencyPosition === "before" ? `${t.currencySymbol || "Rs."} ` : ""}{item.total.toFixed(t.decimalPrecision || 2)}{t.currencyPosition === "after" ? ` ${t.currencySymbol || "Rs."}` : ""}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-4">
          <div className="w-48 text-[10px] space-y-1">
            {t.itemShowSubtotal && <div className="flex justify-between"><span>Subtotal</span><span>{t.currencySymbol || "Rs."} 4,200.00</span></div>}
            {t.showDiscountColumn && <div className="flex justify-between"><span>Discount</span><span>-{t.currencySymbol || "Rs."} 50.00</span></div>}
            {t.showTaxBreakdown && <div className="flex justify-between"><span>{t.taxLabel || "Tax"} (17.5%)</span><span>{t.currencySymbol || "Rs."} 725.00</span></div>}
            {t.lateFeeDisplay && <div className="flex justify-between text-red-500"><span>Late Fee</span><span>{t.currencySymbol || "Rs."} 100.00</span></div>}
            <div className="flex justify-between font-bold pt-1 border-t" style={{ borderColor: t.accentColor || "#2563EB" }}>
              <span>Total</span><span style={{ color: t.accentColor || "#2563EB" }}>{t.currencySymbol || "Rs."} 4,875.00</span>
            </div>
            {t.showGrandTotalWords && <p className="text-[8px] text-muted-foreground italic mt-0.5">Four Thousand Eight Hundred Seventy Five Only</p>}
          </div>
        </div>

        {(t.footerShowNotes || t.footerShowBankDetails || t.footerShowTerms) && (
          <div className="border-t pt-3 space-y-2 text-[9px] text-muted-foreground" style={{ borderColor: t.accentColor || "#2563EB" }}>
            {t.footerShowNotes && <div><p className="font-semibold text-foreground">Notes:</p><p>{t.footerNotesText || "Thank you for your business!"}</p></div>}
            {t.footerShowBankDetails && <div><p className="font-semibold text-foreground">Bank Details:</p><p>{t.footerBankDetailsText || "Bank: HBL | Account: 1234-5678-9012 | IBAN: PK36HABB0001234567890123"}</p></div>}
            {t.footerShowTerms && <div><p className="font-semibold text-foreground">Terms & Conditions:</p><p>{t.footerTermsText || "Payment is due within 15 days. Late payments are subject to a 2% monthly surcharge."}</p></div>}
            <div className="flex justify-between items-end pt-2">
              {t.footerShowQrCode && <div className="w-16 h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-[8px]">QR Code</div>}
              {t.footerShowSignature && (
                <div className="text-center">
                  <div className="w-28 border-b border-slate-400 mb-1" />
                  <p className="text-[8px]">Authorized Signature</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="invoice-templates-page">
      <div className="rounded-xl bg-gradient-to-r from-[#334155] to-[#2563EB] p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <FileText className="h-7 w-7" />
              Invoice Templates
            </h1>
            <p className="text-white/70 mt-1">Design, customize, and manage invoice layouts across all billing categories</p>
          </div>
          <Button variant="secondary" onClick={() => setShowCreateDialog(true)} data-testid="button-create-template">
            <Plus className="h-4 w-4 mr-2" /> New Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {INVOICE_CATEGORIES.map(cat => {
          const s = summaryByCategory[cat.key] || { total: 0, active: 0, defaults: 0 };
          const CIcon = cat.icon;
          return (
            <Card key={cat.key} className={`border-slate-200/60 cursor-pointer transition-all hover:shadow-md ${activeCategory === cat.key ? "ring-2 ring-blue-500 border-blue-300" : ""}`}
              onClick={() => { setActiveCategory(cat.key); setSelectedTemplateId(null); }}
              data-testid={`card-category-${cat.key}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <CIcon className={`h-6 w-6 ${activeCategory === cat.key ? "text-blue-500" : "text-slate-400"}`} />
                  <Badge variant="outline" className="text-[10px]">{s.total}</Badge>
                </div>
                <p className="text-sm font-semibold">{cat.label}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="text-[9px] bg-green-50 text-green-600 border-0">{s.active} active</Badge>
                  {s.defaults > 0 && <Badge className="text-[9px] bg-blue-50 text-blue-600 border-0">{s.defaults} default</Badge>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <Card className="border-slate-200/60" data-testid="card-template-list">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                {INVOICE_CATEGORIES.find(c => c.key === activeCategory)?.label}s
              </CardTitle>
              <CardDescription className="text-xs">{INVOICE_CATEGORIES.find(c => c.key === activeCategory)?.desc}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {categoryTemplates.map(t => {
                  const st = STATUS_CONFIG[t.isDefault ? "default" : (t.status || "draft")];
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setSelectedTemplateId(t.id); setEditTab("layout"); }}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selectedTemplateId === t.id ? "bg-blue-50 border-l-2 border-blue-500" : ""}`}
                      data-testid={`button-template-${t.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{t.name}</span>
                        <Badge variant="outline" className={`text-[9px] shrink-0 ${st.color}`}>{st.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px] text-slate-400">{t.templateType}</Badge>
                        {t.isDefault && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                      </div>
                    </button>
                  );
                })}
                {categoryTemplates.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    No templates yet. Create one to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedTemplate && (
            <Card className="mt-3 border-slate-200/60" data-testid="card-template-actions">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Template Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-xs"
                    onClick={() => duplicateMutation.mutate(selectedTemplate.id)}
                    disabled={duplicateMutation.isPending}
                    data-testid="button-duplicate">
                    <Copy className="h-3 w-3 mr-1" /> Duplicate
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs"
                    onClick={() => setDefaultMutation.mutate(selectedTemplate.id)}
                    disabled={setDefaultMutation.isPending || selectedTemplate.isDefault}
                    data-testid="button-set-default">
                    <Star className="h-3 w-3 mr-1" /> Set Default
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs"
                    onClick={() => updateMutation.mutate({ id: selectedTemplate.id, data: { status: selectedTemplate.status === "active" ? "draft" : "active" } })}
                    data-testid="button-toggle-status">
                    {selectedTemplate.status === "active" ? <Ban className="h-3 w-3 mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {selectedTemplate.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs text-red-500 hover:text-red-600"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={selectedTemplate.isDefault}
                    data-testid="button-delete">
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
                <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                  <div className="flex justify-between"><span className="text-muted-foreground">Template ID</span><span className="font-mono text-[10px]">{selectedTemplate.templateId}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{selectedTemplate.templateType}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Page Size</span><span>{selectedTemplate.pageSize} / {selectedTemplate.pageOrientation}</span></div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="col-span-9">
          {!selectedTemplateId ? (
            <Card className="border-slate-200/60">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <FileText className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-500">Select a Template</h3>
                <p className="text-sm text-muted-foreground mt-1">Choose a template from the list or create a new one</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Input
                    value={getVal("name")}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="text-lg font-bold border-0 shadow-none px-0 h-auto focus-visible:ring-0"
                    data-testid="input-template-name"
                  />
                </div>
              </div>

              <Tabs value={editTab} onValueChange={setEditTab}>
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="layout" data-testid="tab-layout"><Layout className="h-4 w-4 mr-1.5" /> Layout</TabsTrigger>
                  <TabsTrigger value="financial" data-testid="tab-financial"><CreditCard className="h-4 w-4 mr-1.5" /> Financial</TabsTrigger>
                  <TabsTrigger value="branding" data-testid="tab-branding"><Palette className="h-4 w-4 mr-1.5" /> Branding</TabsTrigger>
                  <TabsTrigger value="print" data-testid="tab-print"><Printer className="h-4 w-4 mr-1.5" /> Print & PDF</TabsTrigger>
                  <TabsTrigger value="preview" data-testid="tab-preview"><Eye className="h-4 w-4 mr-1.5" /> Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="layout" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <Card className="border-slate-200/60" data-testid="card-header-section">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2"><Layout className="h-4 w-4 text-blue-500" /> Header Area</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {HEADER_FIELDS.map(f => {
                            const FIcon = f.icon;
                            return (
                              <div key={f.key} className="flex items-center justify-between py-1.5">
                                <div className="flex items-center gap-2"><FIcon className="h-3.5 w-3.5 text-slate-400" /><span className="text-sm">{f.label}</span></div>
                                <Switch checked={getVal(f.key, true)} onCheckedChange={(v) => updateField(f.key, v)} className="scale-90" data-testid={`switch-${f.key}`} />
                              </div>
                            );
                          })}
                          <div className="pt-2">
                            <Label className="text-xs">Custom Header Text</Label>
                            <Input value={getVal("headerCustomText")} onChange={(e) => updateField("headerCustomText", e.target.value)} placeholder="Optional header text" className="text-xs mt-1" data-testid="input-header-text" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200/60" data-testid="card-invoice-section">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4 text-blue-500" /> Invoice Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {INVOICE_FIELDS.map(f => {
                            const FIcon = f.icon;
                            return (
                              <div key={f.key} className="flex items-center justify-between py-1.5">
                                <div className="flex items-center gap-2"><FIcon className="h-3.5 w-3.5 text-slate-400" /><span className="text-sm">{f.label}</span></div>
                                <Switch checked={getVal(f.key, true)} onCheckedChange={(v) => updateField(f.key, v)} className="scale-90" data-testid={`switch-${f.key}`} />
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200/60" data-testid="card-customer-section">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" /> Customer Section</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {CUSTOMER_FIELDS.map(f => {
                            const FIcon = f.icon;
                            return (
                              <div key={f.key} className="flex items-center justify-between py-1.5">
                                <div className="flex items-center gap-2"><FIcon className="h-3.5 w-3.5 text-slate-400" /><span className="text-sm">{f.label}</span></div>
                                <Switch checked={getVal(f.key, true)} onCheckedChange={(v) => updateField(f.key, v)} className="scale-90" data-testid={`switch-${f.key}`} />
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <Card className="border-slate-200/60" data-testid="card-items-section">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2"><Table className="h-4 w-4 text-blue-500" /> Item Table Columns</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {ITEM_FIELDS.map(f => {
                            const FIcon = f.icon;
                            return (
                              <div key={f.key} className="flex items-center justify-between py-1.5">
                                <div className="flex items-center gap-2"><FIcon className="h-3.5 w-3.5 text-slate-400" /><span className="text-sm">{f.label}</span></div>
                                <Switch checked={getVal(f.key, f.key !== "itemShowSku")} onCheckedChange={(v) => updateField(f.key, v)} className="scale-90" data-testid={`switch-${f.key}`} />
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200/60" data-testid="card-footer-section">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-blue-500" /> Footer Section</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {FOOTER_FIELDS.map(f => {
                            const FIcon = f.icon;
                            return (
                              <div key={f.key} className="flex items-center justify-between py-1.5">
                                <div className="flex items-center gap-2"><FIcon className="h-3.5 w-3.5 text-slate-400" /><span className="text-sm">{f.label}</span></div>
                                <Switch checked={getVal(f.key, f.key !== "footerShowQrCode")} onCheckedChange={(v) => updateField(f.key, v)} className="scale-90" data-testid={`switch-${f.key}`} />
                              </div>
                            );
                          })}
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <div>
                              <Label className="text-xs">Notes Text</Label>
                              <Textarea value={getVal("footerNotesText")} onChange={(e) => updateField("footerNotesText", e.target.value)} rows={2} className="text-xs mt-1" data-testid="input-footer-notes" />
                            </div>
                            <div>
                              <Label className="text-xs">Bank Details</Label>
                              <Textarea value={getVal("footerBankDetailsText")} onChange={(e) => updateField("footerBankDetailsText", e.target.value)} rows={2} className="text-xs mt-1" data-testid="input-footer-bank" />
                            </div>
                            <div>
                              <Label className="text-xs">Terms & Conditions</Label>
                              <Textarea value={getVal("footerTermsText")} onChange={(e) => updateField("footerTermsText", e.target.value)} rows={2} className="text-xs mt-1" data-testid="input-footer-terms" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-slate-200/60" data-testid="card-tax-config">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-500" /> Tax & Calculation</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Tax Mode</Label>
                          <Select value={getVal("taxMode", "exclusive")} onValueChange={(v) => updateField("taxMode", v)}>
                            <SelectTrigger className="mt-1" data-testid="select-tax-mode"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inclusive">Tax Inclusive</SelectItem>
                              <SelectItem value="exclusive">Tax Exclusive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Tax Label</Label>
                          <Input value={getVal("taxLabel", "Tax")} onChange={(e) => updateField("taxLabel", e.target.value)} className="mt-1" data-testid="input-tax-label" />
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm">Multi-Tax Support</span>
                          <Switch checked={getVal("multiTaxSupport", false)} onCheckedChange={(v) => updateField("multiTaxSupport", v)} className="scale-90" data-testid="switch-multi-tax" />
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm">Show Tax Breakdown</span>
                          <Switch checked={getVal("showTaxBreakdown", true)} onCheckedChange={(v) => updateField("showTaxBreakdown", v)} className="scale-90" data-testid="switch-tax-breakdown" />
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm">Withholding Tax</span>
                          <Switch checked={getVal("withholdingTax", false)} onCheckedChange={(v) => updateField("withholdingTax", v)} className="scale-90" data-testid="switch-withholding" />
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm">Late Fee Display</span>
                          <Switch checked={getVal("lateFeeDisplay", false)} onCheckedChange={(v) => updateField("lateFeeDisplay", v)} className="scale-90" data-testid="switch-late-fee" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200/60" data-testid="card-currency-config">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><Receipt className="h-4 w-4 text-blue-500" /> Currency & Display</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Currency Symbol</Label>
                          <Input value={getVal("currencySymbol", "Rs.")} onChange={(e) => updateField("currencySymbol", e.target.value)} className="mt-1" data-testid="input-currency-symbol" />
                        </div>
                        <div>
                          <Label className="text-xs">Symbol Position</Label>
                          <Select value={getVal("currencyPosition", "before")} onValueChange={(v) => updateField("currencyPosition", v)}>
                            <SelectTrigger className="mt-1" data-testid="select-currency-position"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="before">Before Amount</SelectItem>
                              <SelectItem value="after">After Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Decimal Precision</Label>
                          <Select value={String(getVal("decimalPrecision", 2))} onValueChange={(v) => updateField("decimalPrecision", parseInt(v))}>
                            <SelectTrigger className="mt-1" data-testid="select-decimal"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0 Decimals</SelectItem>
                              <SelectItem value="1">1 Decimal</SelectItem>
                              <SelectItem value="2">2 Decimals</SelectItem>
                              <SelectItem value="3">3 Decimals</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Rounding Rule</Label>
                          <Select value={getVal("roundingRule", "standard")} onValueChange={(v) => updateField("roundingRule", v)}>
                            <SelectTrigger className="mt-1" data-testid="select-rounding"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="round_up">Always Round Up</SelectItem>
                              <SelectItem value="round_down">Always Round Down</SelectItem>
                              <SelectItem value="bankers">Banker's Rounding</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm">Show Discount Column</span>
                          <Switch checked={getVal("showDiscountColumn", true)} onCheckedChange={(v) => updateField("showDiscountColumn", v)} className="scale-90" data-testid="switch-discount-col" />
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm">Grand Total in Words</span>
                          <Switch checked={getVal("showGrandTotalWords", false)} onCheckedChange={(v) => updateField("showGrandTotalWords", v)} className="scale-90" data-testid="switch-total-words" />
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm">Multi-Currency Support</span>
                          <Switch checked={getVal("multiCurrency", false)} onCheckedChange={(v) => updateField("multiCurrency", v)} className="scale-90" data-testid="switch-multi-currency" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="branding" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-slate-200/60" data-testid="card-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4 text-blue-500" /> Colors</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Primary Color</Label>
                          <div className="flex gap-2 mt-1">
                            <input type="color" value={getVal("primaryColor", "#334155")} onChange={(e) => updateField("primaryColor", e.target.value)} className="w-10 h-10 rounded cursor-pointer" data-testid="color-primary" />
                            <Input value={getVal("primaryColor", "#334155")} onChange={(e) => updateField("primaryColor", e.target.value)} className="flex-1" data-testid="input-primary-color" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Accent Color</Label>
                          <div className="flex gap-2 mt-1">
                            <input type="color" value={getVal("accentColor", "#2563EB")} onChange={(e) => updateField("accentColor", e.target.value)} className="w-10 h-10 rounded cursor-pointer" data-testid="color-accent" />
                            <Input value={getVal("accentColor", "#2563EB")} onChange={(e) => updateField("accentColor", e.target.value)} className="flex-1" data-testid="input-accent-color" />
                          </div>
                        </div>
                        <div className="pt-2">
                          <Label className="text-xs mb-2 block">Preview</Label>
                          <div className="h-8 rounded-md" style={{ background: `linear-gradient(to right, ${getVal("primaryColor", "#334155")}, ${getVal("accentColor", "#2563EB")})` }} />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200/60" data-testid="card-typography">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><Type className="h-4 w-4 text-blue-500" /> Typography & Style</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Font Family</Label>
                          <Select value={getVal("fontFamily", "Inter")} onValueChange={(v) => updateField("fontFamily", v)}>
                            <SelectTrigger className="mt-1" data-testid="select-font"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Poppins">Poppins</SelectItem>
                              <SelectItem value="Roboto">Roboto</SelectItem>
                              <SelectItem value="Open Sans">Open Sans</SelectItem>
                              <SelectItem value="Arial">Arial</SelectItem>
                              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Font Size</Label>
                          <Select value={getVal("fontSize", "12px")} onValueChange={(v) => updateField("fontSize", v)}>
                            <SelectTrigger className="mt-1" data-testid="select-font-size"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10px">10px - Compact</SelectItem>
                              <SelectItem value="11px">11px - Small</SelectItem>
                              <SelectItem value="12px">12px - Standard</SelectItem>
                              <SelectItem value="13px">13px - Medium</SelectItem>
                              <SelectItem value="14px">14px - Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Table Header Style</Label>
                          <Select value={getVal("tableHeaderStyle", "filled")} onValueChange={(v) => updateField("tableHeaderStyle", v)}>
                            <SelectTrigger className="mt-1" data-testid="select-header-style"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="filled">Filled Background</SelectItem>
                              <SelectItem value="bordered">Bottom Border Only</SelectItem>
                              <SelectItem value="minimal">Minimal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Border Style</Label>
                          <Select value={getVal("borderStyle", "solid")} onValueChange={(v) => updateField("borderStyle", v)}>
                            <SelectTrigger className="mt-1" data-testid="select-border"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solid">Solid</SelectItem>
                              <SelectItem value="dashed">Dashed</SelectItem>
                              <SelectItem value="dotted">Dotted</SelectItem>
                              <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Logo Position</Label>
                          <Select value={getVal("logoPosition", "left")} onValueChange={(v) => updateField("logoPosition", v)}>
                            <SelectTrigger className="mt-1" data-testid="select-logo-pos"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Watermark Text</Label>
                          <Input value={getVal("watermarkText")} onChange={(e) => updateField("watermarkText", e.target.value)} placeholder="e.g., DRAFT, COPY, PAID" className="mt-1" data-testid="input-watermark" />
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm">Company Seal / Stamp</span>
                          <Switch checked={getVal("showCompanySeal", false)} onCheckedChange={(v) => updateField("showCompanySeal", v)} className="scale-90" data-testid="switch-seal" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="print" className="mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-slate-200/60" data-testid="card-page-setup">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><Printer className="h-4 w-4 text-blue-500" /> Page Setup</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Page Size</Label>
                          <Select value={getVal("pageSize", "A4")} onValueChange={(v) => updateField("pageSize", v)}>
                            <SelectTrigger className="mt-1" data-testid="select-page-size"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A4">A4 (210×297mm)</SelectItem>
                              <SelectItem value="Letter">Letter (8.5×11in)</SelectItem>
                              <SelectItem value="Legal">Legal (8.5×14in)</SelectItem>
                              <SelectItem value="A5">A5 (148×210mm)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Orientation</Label>
                          <Select value={getVal("pageOrientation", "portrait")} onValueChange={(v) => updateField("pageOrientation", v)}>
                            <SelectTrigger className="mt-1" data-testid="select-orientation"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="portrait">Portrait</SelectItem>
                              <SelectItem value="landscape">Landscape</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Top Margin</Label>
                            <Input value={getVal("marginTop", "20mm")} onChange={(e) => updateField("marginTop", e.target.value)} className="mt-1" data-testid="input-margin-top" />
                          </div>
                          <div>
                            <Label className="text-xs">Bottom Margin</Label>
                            <Input value={getVal("marginBottom", "20mm")} onChange={(e) => updateField("marginBottom", e.target.value)} className="mt-1" data-testid="input-margin-bottom" />
                          </div>
                          <div>
                            <Label className="text-xs">Left Margin</Label>
                            <Input value={getVal("marginLeft", "15mm")} onChange={(e) => updateField("marginLeft", e.target.value)} className="mt-1" data-testid="input-margin-left" />
                          </div>
                          <div>
                            <Label className="text-xs">Right Margin</Label>
                            <Input value={getVal("marginRight", "15mm")} onChange={(e) => updateField("marginRight", e.target.value)} className="mt-1" data-testid="input-margin-right" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm">Show Page Numbers</span>
                          <Switch checked={getVal("showPageNumbers", true)} onCheckedChange={(v) => updateField("showPageNumbers", v)} className="scale-90" data-testid="switch-page-numbers" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200/60" data-testid="card-export-settings">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><Download className="h-4 w-4 text-blue-500" /> Export & Digital</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm">QR Code (Payment Link)</span>
                          <Switch checked={getVal("showQrPaymentLink", false)} onCheckedChange={(v) => updateField("showQrPaymentLink", v)} className="scale-90" data-testid="switch-qr-payment" />
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm">Barcode (Invoice ID)</span>
                          <Switch checked={getVal("showBarcode", false)} onCheckedChange={(v) => updateField("showBarcode", v)} className="scale-90" data-testid="switch-barcode" />
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm">Email-Ready Formatting</span>
                          <Switch checked={getVal("emailReady", true)} onCheckedChange={(v) => updateField("emailReady", v)} className="scale-90" data-testid="switch-email-ready" />
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-sm">Auto Digital Stamp</span>
                          <Switch checked={getVal("autoDigitalStamp", false)} onCheckedChange={(v) => updateField("autoDigitalStamp", v)} className="scale-90" data-testid="switch-digital-stamp" />
                        </div>
                        <div>
                          <Label className="text-xs">Signature Image URL</Label>
                          <Input value={getVal("signatureUploadUrl")} onChange={(e) => updateField("signatureUploadUrl", e.target.value)} placeholder="https://..." className="mt-1" data-testid="input-signature-url" />
                        </div>

                        <Card className="border-blue-200/60 bg-blue-50/30 mt-3">
                          <CardContent className="p-3 flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                            <div className="text-xs text-blue-700">
                              <p className="font-semibold">Email Integration</p>
                              <p className="mt-0.5">When email-ready is enabled, invoices will be automatically attached to billing emails in optimized PDF format.</p>
                            </div>
                          </CardContent>
                        </Card>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                  <Card className="border-slate-200/60">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4 text-blue-500" /> Live Invoice Preview</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{getVal("pageSize", "A4")} / {getVal("pageOrientation", "portrait")}</Badge>
                          <Badge variant="outline" className="text-[10px]">{getVal("fontFamily", "Inter")} {getVal("fontSize", "12px")}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {renderLivePreview()}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice Template</DialogTitle>
            <DialogDescription>Add a new template for {INVOICE_CATEGORIES.find(c => c.key === activeCategory)?.label || "invoices"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Template Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Standard Customer Invoice" data-testid="input-new-name" />
            </div>
            <div>
              <Label className="text-sm">Template Type</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger data-testid="select-new-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Assigned Branch (optional)</Label>
              <Input value={newBranch} onChange={(e) => setNewBranch(e.target.value)} placeholder="e.g., Main Branch" data-testid="input-new-branch" />
            </div>
            <div>
              <Label className="text-sm">Assigned Customer Group (optional)</Label>
              <Input value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder="e.g., Corporate" data-testid="input-new-group" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({
                name: newName,
                invoiceCategory: activeCategory,
                templateType: newType,
                assignedBranch: newBranch || null,
                assignedCustomerGroup: newGroup || null,
              })}
              disabled={!newName.trim() || createMutation.isPending}
              data-testid="button-confirm-create"
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive"
              onClick={() => selectedTemplateId && deleteMutation.mutate(selectedTemplateId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
