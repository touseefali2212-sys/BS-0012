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
  HardDrive,
  CheckCircle,
  Wrench,
  AlertTriangle,
  XCircle,
  Router,
  Network,
  Cable,
  MapPin,
  Users,
  Clock,
  FileCheck,
  Package,
  Shield,
  Archive,
  Eye,
  TrendingDown,
  Settings,
  Hash,
  Layers,
  Zap,
  Server,
  Monitor,
  Truck,
  Power,
  BarChart3,
  X,
  Wifi,
  DollarSign,
  Calendar,
  Tag,
  Activity,
  Box,
  ArrowRightLeft,
  BookmarkCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTab } from "@/hooks/use-tab";
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
  DropdownMenuSeparator,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertAssetSchema, insertAssetTypeSchema, insertAssetTransferSchema, type Asset, type InsertAsset, type AssetType, type InsertAssetType, type AssetTransfer, type InsertAssetTransfer, type Vendor } from "@shared/schema";
import { z } from "zod";

const assetFormSchema = insertAssetSchema.extend({
  assetTag: z.string().min(1, "Asset tag is required"),
  name: z.string().min(2, "Name is required"),
  type: z.string().min(1, "Type is required"),
});

const assetTypeFormSchema = insertAssetTypeSchema.extend({
  name: z.string().min(2, "Name is required"),
  category: z.string().min(1, "Category is required"),
});

const transferFormSchema = insertAssetTransferSchema.extend({
  transferId: z.string().min(1, "Transfer ID is required"),
  assetId: z.coerce.number().min(1, "Asset is required"),
  transferType: z.string().min(1, "Transfer type is required"),
  fromLocation: z.string().min(1, "From location is required"),
  toLocation: z.string().min(1, "To location is required"),
});

const TRANSFER_TYPES = [
  { value: "warehouse_to_pop", label: "Warehouse to POP" },
  { value: "pop_to_warehouse", label: "POP to Warehouse" },
  { value: "pop_to_pop", label: "POP to POP" },
  { value: "warehouse_to_technician", label: "Warehouse to Technician" },
  { value: "technician_to_warehouse", label: "Technician to Warehouse" },
  { value: "customer_to_warehouse", label: "Customer to Warehouse" },
  { value: "repair_center", label: "Repair Center Transfer" },
];

const TRANSFER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending Approval", color: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950" },
  approved: { label: "Approved", color: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" },
  in_transit: { label: "In Transit", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950" },
  received: { label: "Received", color: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950" },
  completed: { label: "Completed", color: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" },
  rejected: { label: "Rejected", color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950" },
  cancelled: { label: "Cancelled", color: "text-gray-500 bg-gray-50 dark:bg-gray-900" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  high: { label: "High", color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950" },
  normal: { label: "Normal", color: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950" },
  low: { label: "Low", color: "text-gray-500 bg-gray-50 dark:bg-gray-900" },
};

const CATEGORIES = [
  { value: "network_equipment", label: "Network Equipment" },
  { value: "olt", label: "OLT" },
  { value: "router", label: "Router" },
  { value: "switch", label: "Switch" },
  { value: "onu", label: "ONU" },
  { value: "fiber_infrastructure", label: "Fiber Infrastructure" },
  { value: "power_equipment", label: "Power Equipment" },
  { value: "office_equipment", label: "Office Equipment" },
  { value: "tools", label: "Tools" },
  { value: "vehicles", label: "Vehicles" },
  { value: "it_hardware", label: "IT Hardware" },
];

const DEPRECIATION_METHODS = [
  { value: "straight_line", label: "Straight Line" },
  { value: "reducing_balance", label: "Reducing Balance" },
  { value: "manual", label: "Manual" },
];

const LOCATION_TYPES = [
  { value: "pop", label: "POP" },
  { value: "warehouse", label: "Warehouse" },
  { value: "office", label: "Office" },
  { value: "field", label: "Field" },
];

const TYPE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" },
  limited: { label: "Limited Use", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950" },
  deprecated: { label: "Deprecated", color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950" },
  under_review: { label: "Under Review", color: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950" },
  archived: { label: "Archived", color: "text-gray-500 bg-gray-50 dark:bg-gray-900" },
};

const ASSET_STATUS_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  available: { icon: CheckCircle, label: "In Stock", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950" },
  deployed: { icon: Router, label: "Deployed", color: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" },
  maintenance: { icon: Wrench, label: "Under Maintenance", color: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950" },
  reserved: { icon: BookmarkCheck, label: "Reserved", color: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950" },
  faulty: { icon: AlertTriangle, label: "Faulty", color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950" },
  retired: { icon: XCircle, label: "Retired", color: "text-gray-500 bg-gray-50 dark:bg-gray-900" },
  lost: { icon: AlertTriangle, label: "Lost", color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950" },
};

const CATEGORY_ICONS: Record<string, any> = {
  network_equipment: Network,
  olt: Server,
  router: Router,
  switch: HardDrive,
  onu: Network,
  fiber_infrastructure: Cable,
  power_equipment: Power,
  office_equipment: Monitor,
  tools: Wrench,
  vehicles: Truck,
  it_hardware: Monitor,
};

function getCategoryLabel(val: string) {
  return CATEGORIES.find((c) => c.value === val)?.label || val;
}

function getDepreciationLabel(val: string) {
  return DEPRECIATION_METHODS.find((d) => d.value === val)?.label || val;
}

function AssetDetailsDrawer({ asset, vendors, onClose, onEdit, onStatusChange }: {
  asset: Asset;
  vendors: Vendor[];
  onClose: () => void;
  onEdit: (a: Asset) => void;
  onStatusChange: (id: number, status: string) => void;
}) {
  const stConfig = ASSET_STATUS_CONFIG[asset.status] || ASSET_STATUS_CONFIG.available;
  const StatusIcon = stConfig.icon;
  const vendor = vendors.find((v) => v.id === asset.vendorId);

  const purchaseCost = parseFloat(asset.purchaseCost || "0");
  const bookValue = parseFloat(asset.bookValue || asset.purchaseCost || "0");
  const depRate = parseFloat(asset.depreciationRate || "0");

  const warrantyDaysLeft = asset.warrantyEnd
    ? Math.ceil((new Date(asset.warrantyEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" data-testid="drawer-asset-details">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background border-l border-border shadow-xl overflow-y-auto animate-in slide-in-from-right duration-200">
        <div className="sticky top-0 z-10 bg-background border-b border-border p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold" data-testid="text-drawer-asset-name">{asset.name}</h2>
            <p className="text-xs text-muted-foreground font-mono">{asset.assetTag}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(asset)} data-testid="button-drawer-edit">
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-drawer-close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-5">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className={`no-default-active-elevate text-xs ${stConfig.color}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {stConfig.label}
            </Badge>
            {warrantyDaysLeft !== null && (
              <Badge variant="secondary" className={`no-default-active-elevate text-xs ${warrantyDaysLeft < 30 ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950" : warrantyDaysLeft < 90 ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950" : "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950"}`}>
                {warrantyDaysLeft > 0 ? `${warrantyDaysLeft}d warranty left` : "Warranty expired"}
              </Badge>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">General Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Asset ID</span><p className="font-mono font-medium" data-testid="text-drawer-id">AST-{String(asset.id).padStart(4, "0")}</p></div>
              <div><span className="text-muted-foreground">Type</span><p className="font-medium capitalize">{asset.type}</p></div>
              <div><span className="text-muted-foreground">Category</span><p className="font-medium">{asset.category ? getCategoryLabel(asset.category) : "\u2014"}</p></div>
              <div><span className="text-muted-foreground">Brand / Model</span><p className="font-medium">{[asset.brand, asset.model].filter(Boolean).join(" ") || "\u2014"}</p></div>
              <div><span className="text-muted-foreground">Serial Number</span><p className="font-mono text-xs" data-testid="text-drawer-serial">{asset.serialNumber || "\u2014"}</p></div>
              <div><span className="text-muted-foreground">MAC Address</span><p className="font-mono text-xs" data-testid="text-drawer-mac">{asset.macAddress || "\u2014"}</p></div>
              <div><span className="text-muted-foreground">Vendor</span><p className="font-medium">{vendor?.name || "\u2014"}</p></div>
              <div><span className="text-muted-foreground">Invoice Ref.</span><p className="font-mono text-xs">{asset.invoiceReference || "\u2014"}</p></div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Deployment Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Location</span><p className="font-medium">{asset.location || "\u2014"}</p></div>
              <div><span className="text-muted-foreground">Location Type</span><p className="font-medium capitalize">{asset.locationType || "\u2014"}</p></div>
              <div><span className="text-muted-foreground">Assigned To</span><p className="font-medium">{asset.assignedTo || "\u2014"}</p></div>
              <div><span className="text-muted-foreground">Assigned Type</span><p className="font-medium capitalize">{asset.assignedType || "\u2014"}</p></div>
              <div><span className="text-muted-foreground">Installed By</span><p className="font-medium">{asset.installedBy || "\u2014"}</p></div>
              <div><span className="text-muted-foreground">Installation Date</span><p className="font-medium">{asset.installationDate || "\u2014"}</p></div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Financial Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Purchase Cost</span><p className="font-medium">Rs. {purchaseCost.toLocaleString()}</p></div>
              <div><span className="text-muted-foreground">Book Value</span><p className="font-medium text-green-600 dark:text-green-400" data-testid="text-drawer-book-value">Rs. {bookValue.toLocaleString()}</p></div>
              <div><span className="text-muted-foreground">Purchase Date</span><p className="font-medium">{asset.purchaseDate || "\u2014"}</p></div>
              <div><span className="text-muted-foreground">Warranty Expiry</span><p className="font-medium">{asset.warrantyEnd || "\u2014"}</p></div>
              <div><span className="text-muted-foreground">Depreciation</span><p className="font-medium">{asset.depreciationMethod ? getDepreciationLabel(asset.depreciationMethod) : "\u2014"}</p></div>
              <div><span className="text-muted-foreground">Dep. Rate</span><p className="font-medium">{depRate > 0 ? `${depRate}%` : "\u2014"}</p></div>
            </div>
          </div>

          {(asset.ipAddress || asset.vlan || asset.firmwareVersion) && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Technical Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">IP Address</span><p className="font-mono text-xs">{asset.ipAddress || "\u2014"}</p></div>
                  <div><span className="text-muted-foreground">VLAN</span><p className="font-mono text-xs">{asset.vlan || "\u2014"}</p></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Firmware</span><p className="font-mono text-xs">{asset.firmwareVersion || "\u2014"}</p></div>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Maintenance</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Last Maintenance</span><p className="font-medium">{asset.lastMaintenanceDate || "\u2014"}</p></div>
              <div><span className="text-muted-foreground">Next Scheduled</span><p className="font-medium">{asset.nextMaintenanceDate || "\u2014"}</p></div>
            </div>
          </div>

          {asset.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{asset.notes}</p>
              </div>
            </>
          )}

          <Separator />

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Status Change</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ASSET_STATUS_CONFIG).filter(([k]) => k !== asset.status).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => onStatusChange(asset.id, key)}
                    data-testid={`button-status-${key}`}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {cfg.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<AssetType | null>(null);
  const [typeSearch, setTypeSearch] = useState("");
  const [typeCategoryFilter, setTypeCategoryFilter] = useState("all");
  const [typeStatusFilter, setTypeStatusFilter] = useState("all");

  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferSearch, setTransferSearch] = useState("");
  const [transferStatusFilter, setTransferStatusFilter] = useState("all");
  const [selectedTransfer, setSelectedTransfer] = useState<AssetTransfer | null>(null);

  const { data: assets, isLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: assetTypesData, isLoading: typesLoading } = useQuery<AssetType[]>({
    queryKey: ["/api/asset-types"],
  });

  const { data: transfers, isLoading: transfersLoading } = useQuery<AssetTransfer[]>({
    queryKey: ["/api/asset-transfers"],
  });

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const form = useForm<InsertAsset>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      assetTag: "", name: "", type: "router", category: "", brand: "", model: "",
      serialNumber: "", macAddress: "", vendorId: undefined, purchaseDate: "",
      purchaseCost: "", warrantyEnd: "", location: "", locationType: "warehouse",
      assignedTo: "", assignedType: "staff", installedBy: "", installationDate: "",
      depreciationMethod: "straight_line", depreciationRate: "", bookValue: "",
      ipAddress: "", vlan: "", firmwareVersion: "", lastMaintenanceDate: "",
      nextMaintenanceDate: "", invoiceReference: "", notes: "", status: "available",
    },
  });

  const typeForm = useForm<InsertAssetType>({
    resolver: zodResolver(assetTypeFormSchema),
    defaultValues: {
      name: "", category: "network_equipment", subcategory: "", description: "",
      codePrefix: "", defaultLocationType: "warehouse", warrantyDefaultPeriod: 12,
      expectedLifespan: 5, depreciationMethod: "straight_line", depreciationRate: "10",
      maintenanceRequired: false, criticalAsset: false, trackSerialNumber: true,
      trackMacAddress: false, trackStockQuantity: false, trackAssignment: true, status: "active",
    },
  });

  const transferForm = useForm<InsertAssetTransfer>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      transferId: "", assetId: 0, assetName: "", assetTag: "", assetType: "",
      transferType: "warehouse_to_pop", fromLocation: "", fromLocationType: "warehouse",
      toLocation: "", toLocationType: "pop", assignedTo: "", requestedBy: "Admin",
      approvedBy: "", receivedBy: "", reason: "", priority: "normal",
      requireApproval: true, isUrgent: false, notifyReceiver: true,
      expectedDeliveryDate: "", dispatchDate: "", deliveryDate: "",
      conditionOnTransfer: "good", conditionOnReceive: "", notes: "",
      rejectionReason: "", status: "pending",
    },
  });

  const createTransferMutation = useMutation({
    mutationFn: async (data: InsertAssetTransfer) => {
      const res = await apiRequest("POST", "/api/asset-transfers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-transfers"] });
      setTransferDialogOpen(false);
      transferForm.reset();
      toast({ title: "Transfer request created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateTransferMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAssetTransfer> }) => {
      const res = await apiRequest("PATCH", `/api/asset-transfers/${id}`, data);
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-transfers"] });
      if (selectedTransfer && updated) setSelectedTransfer(updated);
      toast({ title: "Transfer updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertAsset) => {
      const res = await apiRequest("POST", "/api/assets", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Asset created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAsset> }) => {
      const res = await apiRequest("PATCH", `/api/assets/${id}`, data);
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDialogOpen(false);
      setEditingAsset(null);
      if (selectedAsset && updated) setSelectedAsset(updated);
      form.reset();
      toast({ title: "Asset updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/assets/${id}`, { status: "retired" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({ title: "Asset archived (retired)" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const statusChangeMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/assets/${id}`, { status });
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      if (selectedAsset && updated) setSelectedAsset(updated);
      toast({ title: "Status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createTypeMutation = useMutation({
    mutationFn: async (data: InsertAssetType) => {
      const res = await apiRequest("POST", "/api/asset-types", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-types"] });
      setTypeDialogOpen(false);
      typeForm.reset();
      toast({ title: "Asset type created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAssetType> }) => {
      const res = await apiRequest("PATCH", `/api/asset-types/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-types"] });
      setTypeDialogOpen(false);
      setEditingType(null);
      typeForm.reset();
      toast({ title: "Asset type updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/asset-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-types"] });
      toast({ title: "Asset type deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getDefaultAssetValues = (): InsertAsset => ({
    assetTag: "", name: "", type: "router", category: "", brand: "", model: "",
    serialNumber: "", macAddress: "", vendorId: undefined, purchaseDate: "",
    purchaseCost: "", warrantyEnd: "", location: "", locationType: "warehouse",
    assignedTo: "", assignedType: "staff", installedBy: "", installationDate: "",
    depreciationMethod: "straight_line", depreciationRate: "", bookValue: "",
    ipAddress: "", vlan: "", firmwareVersion: "", lastMaintenanceDate: "",
    nextMaintenanceDate: "", invoiceReference: "", notes: "", status: "available",
  });

  const openCreate = () => {
    setEditingAsset(null);
    form.reset(getDefaultAssetValues());
    setDialogOpen(true);
  };

  const openEdit = (asset: Asset) => {
    setEditingAsset(asset);
    form.reset({
      assetTag: asset.assetTag, name: asset.name, type: asset.type,
      category: asset.category || "", brand: asset.brand || "", model: asset.model || "",
      serialNumber: asset.serialNumber || "", macAddress: asset.macAddress || "",
      vendorId: asset.vendorId ?? undefined, purchaseDate: asset.purchaseDate || "",
      purchaseCost: asset.purchaseCost || "", warrantyEnd: asset.warrantyEnd || "",
      location: asset.location || "", locationType: asset.locationType || "warehouse",
      assignedTo: asset.assignedTo || "", assignedType: asset.assignedType || "staff",
      installedBy: asset.installedBy || "", installationDate: asset.installationDate || "",
      depreciationMethod: asset.depreciationMethod || "straight_line",
      depreciationRate: asset.depreciationRate || "", bookValue: asset.bookValue || "",
      ipAddress: asset.ipAddress || "", vlan: asset.vlan || "",
      firmwareVersion: asset.firmwareVersion || "",
      lastMaintenanceDate: asset.lastMaintenanceDate || "",
      nextMaintenanceDate: asset.nextMaintenanceDate || "",
      invoiceReference: asset.invoiceReference || "", notes: asset.notes || "",
      status: asset.status,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertAsset) => {
    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openCreateType = () => {
    setEditingType(null);
    typeForm.reset({
      name: "", category: "network_equipment", subcategory: "", description: "",
      codePrefix: "", defaultLocationType: "warehouse", warrantyDefaultPeriod: 12,
      expectedLifespan: 5, depreciationMethod: "straight_line", depreciationRate: "10",
      maintenanceRequired: false, criticalAsset: false, trackSerialNumber: true,
      trackMacAddress: false, trackStockQuantity: false, trackAssignment: true, status: "active",
    });
    setTypeDialogOpen(true);
  };

  const openEditType = (at: AssetType) => {
    setEditingType(at);
    typeForm.reset({
      name: at.name, category: at.category, subcategory: at.subcategory || "",
      description: at.description || "", codePrefix: at.codePrefix || "",
      defaultLocationType: at.defaultLocationType || "warehouse",
      warrantyDefaultPeriod: at.warrantyDefaultPeriod ?? 12,
      expectedLifespan: at.expectedLifespan ?? 5,
      depreciationMethod: at.depreciationMethod || "straight_line",
      depreciationRate: at.depreciationRate || "10",
      maintenanceRequired: at.maintenanceRequired, criticalAsset: at.criticalAsset,
      trackSerialNumber: at.trackSerialNumber, trackMacAddress: at.trackMacAddress,
      trackStockQuantity: at.trackStockQuantity, trackAssignment: at.trackAssignment,
      status: at.status,
    });
    setTypeDialogOpen(true);
  };

  const onTypeSubmit = (data: InsertAssetType) => {
    if (editingType) {
      updateTypeMutation.mutate({ id: editingType.id, data });
    } else {
      createTypeMutation.mutate(data);
    }
  };

  const generateTransferId = () => {
    const num = ((transfers || []).length + 1).toString().padStart(4, "0");
    return `TRF-${num}`;
  };

  const openCreateTransfer = () => {
    transferForm.reset({
      transferId: generateTransferId(), assetId: 0, assetName: "", assetTag: "", assetType: "",
      transferType: "warehouse_to_pop", fromLocation: "", fromLocationType: "warehouse",
      toLocation: "", toLocationType: "pop", assignedTo: "", requestedBy: "Admin",
      approvedBy: "", receivedBy: "", reason: "", priority: "normal",
      requireApproval: true, isUrgent: false, notifyReceiver: true,
      expectedDeliveryDate: "", dispatchDate: "", deliveryDate: "",
      conditionOnTransfer: "good", conditionOnReceive: "", notes: "",
      rejectionReason: "", status: "pending",
    });
    setTransferDialogOpen(true);
  };

  const onTransferSubmit = (data: InsertAssetTransfer) => {
    createTransferMutation.mutate(data);
  };

  const handleTransferStatusChange = (id: number, newStatus: string) => {
    const updates: Partial<InsertAssetTransfer> = { status: newStatus };
    if (newStatus === "in_transit") updates.dispatchDate = new Date().toISOString().split("T")[0];
    if (newStatus === "completed") updates.deliveryDate = new Date().toISOString().split("T")[0];
    updateTransferMutation.mutate({ id, data: updates });
  };

  const allTransfers = transfers || [];
  const filteredTransfers = allTransfers.filter((t) => {
    const matchSearch = t.transferId.toLowerCase().includes(transferSearch.toLowerCase()) ||
      (t.assetName || "").toLowerCase().includes(transferSearch.toLowerCase()) ||
      (t.assetTag || "").toLowerCase().includes(transferSearch.toLowerCase()) ||
      t.fromLocation.toLowerCase().includes(transferSearch.toLowerCase()) ||
      t.toLocation.toLowerCase().includes(transferSearch.toLowerCase());
    const matchStatus = transferStatusFilter === "all" || t.status === transferStatusFilter;
    return matchSearch && matchStatus;
  });

  const transfersThisMonth = allTransfers.filter((t) => {
    if (!t.createdAt) return false;
    const d = new Date(t.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const inTransitCount = allTransfers.filter((t) => t.status === "in_transit").length;
  const pendingApprovalCount = allTransfers.filter((t) => t.status === "pending").length;
  const completedTransfers = allTransfers.filter((t) => t.status === "completed").length;
  const rejectedTransfers = allTransfers.filter((t) => t.status === "rejected").length;
  const returnTransfers = allTransfers.filter((t) => ["pop_to_warehouse", "technician_to_warehouse", "customer_to_warehouse"].includes(t.transferType)).length;

  const filtered = (assets || []).filter((a) => {
    const matchSearch =
      a.assetTag.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.serialNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.macAddress || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchType = typeFilter === "all" || a.type === typeFilter;
    const matchLocation = locationFilter === "all" || a.locationType === locationFilter;
    return matchSearch && matchStatus && matchType && matchLocation;
  });

  const [activeTab, setActiveTab] = useTab("list");

  const allAssets = assets || [];
  const deployedAssets = allAssets.filter((a) => a.status === "deployed");
  const maintenanceAssets = allAssets.filter((a) => a.status === "maintenance");
  const availableAssets = allAssets.filter((a) => a.status === "available");
  const retiredAssets = allAssets.filter((a) => a.status === "retired");
  const faultyAssets = allAssets.filter((a) => a.status === "faulty");
  const allocatedAssets = allAssets.filter((a) => a.assignedTo);
  const networkDevices = allAssets.filter((a) => ["router", "ONT", "OLT", "switch"].includes(a.type));
  const criticalAssets = allAssets.filter((a) => {
    const at = (assetTypesData || []).find((t) => t.name.toLowerCase() === a.type.toLowerCase());
    return at?.criticalAsset;
  });

  const totalBookValue = allAssets.reduce((sum, a) => sum + parseFloat(a.bookValue || a.purchaseCost || "0"), 0);

  const warrantyExpiringSoon = allAssets.filter((a) => {
    if (!a.warrantyEnd) return false;
    const days = Math.ceil((new Date(a.warrantyEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 30;
  });

  const allTypes = assetTypesData || [];
  const filteredTypes = allTypes.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(typeSearch.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(typeSearch.toLowerCase()) ||
      (t.codePrefix || "").toLowerCase().includes(typeSearch.toLowerCase());
    const matchCategory = typeCategoryFilter === "all" || t.category === typeCategoryFilter;
    const matchStatus = typeStatusFilter === "all" || t.status === typeStatusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const activeTypes = allTypes.filter((t) => t.status === "active").length;
  const archivedTypes = allTypes.filter((t) => t.status === "archived").length;
  const networkTypes = allTypes.filter((t) => ["network_equipment", "olt", "router", "switch", "onu"].includes(t.category)).length;
  const infraTypes = allTypes.filter((t) => ["fiber_infrastructure", "power_equipment"].includes(t.category)).length;
  const officeTypes = allTypes.filter((t) => ["office_equipment", "it_hardware"].includes(t.category)).length;

  const getAssetCountForType = (typeName: string) => {
    return allAssets.filter((a) => a.type.toLowerCase() === typeName.toLowerCase()).length;
  };

  const depreciationBreakdown = DEPRECIATION_METHODS.map((dm) => ({
    ...dm,
    count: allTypes.filter((t) => t.depreciationMethod === dm.value).length,
  }));

  const categoryDistribution = CATEGORIES.map((c) => ({
    ...c,
    count: allAssets.filter((a) => a.category === c.value).length,
  })).filter((c) => c.count > 0);

  const locationDistribution = LOCATION_TYPES.map((l) => ({
    ...l,
    count: allAssets.filter((a) => a.locationType === l.value).length,
  }));

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-assets-title">Network Assets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage network equipment and infrastructure assets</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "types" ? (
            <Button onClick={openCreateType} data-testid="button-add-asset-type">
              <Plus className="h-4 w-4 mr-1" />
              Add Asset Type
            </Button>
          ) : activeTab === "list" ? (
            <Button onClick={openCreate} data-testid="button-add-asset">
              <Plus className="h-4 w-4 mr-1" />
              Add New Asset
            </Button>
          ) : activeTab === "transfers" ? (
            <Button onClick={openCreateTransfer} data-testid="button-new-transfer">
              <Plus className="h-4 w-4 mr-1" />
              New Transfer
            </Button>
          ) : null}
        </div>
      </div>

      {activeTab === "types" && (
        <div className="mt-5 space-y-6" data-testid="tab-content-types">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card data-testid="card-kpi-total-types">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Total Types</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" data-testid="text-kpi-total-types">{allTypes.length}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-kpi-network-types">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Network Equip.</CardTitle>
                <Network className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" data-testid="text-kpi-network-types">{networkTypes}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-kpi-infra-types">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Infrastructure</CardTitle>
                <Cable className="h-4 w-4 text-teal-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" data-testid="text-kpi-infra-types">{infraTypes}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-kpi-office-types">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Office / IT</CardTitle>
                <Monitor className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" data-testid="text-kpi-office-types">{officeTypes}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-kpi-active-types">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Active</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-green-600" data-testid="text-kpi-active-types">{activeTypes}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-kpi-archived-types">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Archived</CardTitle>
                <Archive className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-gray-500" data-testid="text-kpi-archived-types">{archivedTypes}</div>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card data-testid="card-category-distribution">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Category Distribution</CardTitle></CardHeader>
              <CardContent>
                {CATEGORIES.map((cat) => {
                  const count = allTypes.filter((t) => t.category === cat.value).length;
                  if (count === 0) return null;
                  const CatIcon = CATEGORY_ICONS[cat.value] || Package;
                  return (
                    <div key={cat.value} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 text-sm"><CatIcon className="h-3.5 w-3.5 text-muted-foreground" /><span>{cat.label}</span></div>
                      <Badge variant="secondary" className="no-default-active-elevate text-xs">{count}</Badge>
                    </div>
                  );
                })}
                {allTypes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No types defined yet</p>}
              </CardContent>
            </Card>
            <Card data-testid="card-depreciation-breakdown">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Depreciation Methods</CardTitle></CardHeader>
              <CardContent>
                {depreciationBreakdown.map((dm) => (
                  <div key={dm.value} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 text-sm"><TrendingDown className="h-3.5 w-3.5 text-muted-foreground" /><span>{dm.label}</span></div>
                    <Badge variant="secondary" className="no-default-active-elevate text-xs">{dm.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card data-testid="card-type-usage">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Top Types by Usage</CardTitle></CardHeader>
              <CardContent>
                {allTypes.map((t) => ({ ...t, assetCount: getAssetCountForType(t.name) })).sort((a, b) => b.assetCount - a.assetCount).slice(0, 6).map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 text-sm"><BarChart3 className="h-3.5 w-3.5 text-muted-foreground" /><span className="truncate max-w-[140px]">{t.name}</span></div>
                    <Badge variant="secondary" className="no-default-active-elevate text-xs">{t.assetCount} assets</Badge>
                  </div>
                ))}
                {allTypes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No types defined yet</p>}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search asset types..." value={typeSearch} onChange={(e) => setTypeSearch(e.target.value)} className="pl-9" data-testid="input-search-asset-types" />
                </div>
                <Select value={typeCategoryFilter} onValueChange={setTypeCategoryFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-type-category-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={typeStatusFilter} onValueChange={setTypeStatusFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-type-status-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="limited">Limited Use</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {typesLoading ? (
                <div className="p-5 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filteredTypes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Layers className="h-12 w-12 mb-3 opacity-30" /><p className="font-medium">No asset types found</p><p className="text-sm mt-1">Create your first asset type to classify inventory</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead>
                        <TableHead className="hidden md:table-cell">Code Prefix</TableHead>
                        <TableHead className="hidden lg:table-cell">Depreciation</TableHead>
                        <TableHead className="hidden lg:table-cell">Lifespan</TableHead>
                        <TableHead className="hidden md:table-cell">Maintenance</TableHead>
                        <TableHead className="hidden lg:table-cell">Assets</TableHead>
                        <TableHead>Status</TableHead><TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTypes.map((at) => {
                        const stConfig = TYPE_STATUS_CONFIG[at.status] || TYPE_STATUS_CONFIG.active;
                        const CatIcon = CATEGORY_ICONS[at.category] || Package;
                        const assetCount = getAssetCountForType(at.name);
                        return (
                          <TableRow key={at.id} data-testid={`row-asset-type-${at.id}`}>
                            <TableCell className="font-mono text-xs text-muted-foreground" data-testid={`text-type-id-${at.id}`}>AT-{String(at.id).padStart(3, "0")}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <CatIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div>
                                  <div className="font-medium text-sm" data-testid={`text-type-name-${at.id}`}>{at.name}</div>
                                  {at.description && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{at.description}</div>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="secondary" className="no-default-active-elevate text-[10px]">{getCategoryLabel(at.category)}</Badge></TableCell>
                            <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground" data-testid={`text-type-prefix-${at.id}`}>{at.codePrefix || "\u2014"}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                              {getDepreciationLabel(at.depreciationMethod || "straight_line")}
                              {at.depreciationRate && <span className="text-xs ml-1">({at.depreciationRate}%)</span>}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{at.expectedLifespan ? `${at.expectedLifespan} yrs` : "\u2014"}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {at.maintenanceRequired ? (
                                <Badge variant="secondary" className="no-default-active-elevate text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950"><Wrench className="h-3 w-3 mr-1" />Yes</Badge>
                              ) : <span className="text-xs text-muted-foreground">No</span>}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell"><Badge variant="secondary" className="no-default-active-elevate text-xs" data-testid={`text-type-asset-count-${at.id}`}>{assetCount}</Badge></TableCell>
                            <TableCell><Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${stConfig.color}`}>{stConfig.label}</Badge></TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-type-actions-${at.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditType(at)} data-testid={`button-edit-type-${at.id}`}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                                  {at.status !== "archived" && <DropdownMenuItem onClick={() => updateTypeMutation.mutate({ id: at.id, data: { status: "archived" } })} data-testid={`button-archive-type-${at.id}`}><Archive className="h-4 w-4 mr-2" />Archive</DropdownMenuItem>}
                                  {at.status === "archived" && <DropdownMenuItem onClick={() => updateTypeMutation.mutate({ id: at.id, data: { status: "active" } })} data-testid={`button-activate-type-${at.id}`}><CheckCircle className="h-4 w-4 mr-2" />Activate</DropdownMenuItem>}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => {
                                    if (assetCount > 0) { toast({ title: "Cannot delete", description: `${assetCount} asset(s) exist under this type. Archive instead.`, variant: "destructive" }); return; }
                                    deleteTypeMutation.mutate(at.id);
                                  }} data-testid={`button-delete-type-${at.id}`}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card data-testid="card-lifecycle-stages">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Settings className="h-4 w-4" />Lifecycle Stages</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["Purchased", "In Stock", "Deployed", "Under Maintenance", "Retired", "Disposed"].map((stage, i) => (
                    <Badge key={stage} variant="secondary" className={`no-default-active-elevate text-xs ${i === 0 ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950" : i === 1 ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950" : i === 2 ? "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950" : i === 3 ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950" : i === 4 ? "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800" : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950"}`}>{stage}</Badge>
                  ))}
                </div>
                <div className="mt-4 space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Automation Rules:</p>
                  {["Auto-assign depreciation rules when asset created", "Auto-apply lifespan from type definition", "Stop depreciation on asset retirement"].map((r) => (
                    <div key={r} className="flex items-start gap-2 text-xs text-muted-foreground"><Zap className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" /><span>{r}</span></div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-financial-mapping">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingDown className="h-4 w-4" />Financial Mapping</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["Asset Account", "Depreciation Account", "Expense Account"].map((a) => (
                    <div key={a} className="flex items-center justify-between py-1.5 border-b border-border/50"><span className="text-sm">{a}</span><Badge variant="secondary" className="no-default-active-elevate text-xs">Linked to Accounting</Badge></div>
                  ))}
                </div>
                <div className="mt-4 space-y-1.5">
                  {["Depreciation syncs with accounting module", "Retirement triggers accounting adjustment"].map((r) => (
                    <div key={r} className="flex items-start gap-2 text-xs text-muted-foreground"><Shield className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" /><span>{r}</span></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "list" && (
        <div className="mt-5 space-y-6" data-testid="tab-content-list">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            <Card data-testid="card-kpi-total-assets">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Total Assets</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" data-testid="text-kpi-total-assets">{allAssets.length}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-kpi-network-devices">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Network Devices</CardTitle>
                <Network className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" data-testid="text-kpi-network-devices">{networkDevices.length}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-kpi-in-stock">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">In Stock</CardTitle>
                <Box className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-amber-600" data-testid="text-kpi-in-stock">{availableAssets.length}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-kpi-deployed">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Deployed</CardTitle>
                <Router className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-green-600" data-testid="text-kpi-deployed">{deployedAssets.length}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-kpi-maintenance">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Maintenance</CardTitle>
                <Wrench className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-blue-600" data-testid="text-kpi-maintenance">{maintenanceAssets.length}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-kpi-retired">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Retired</CardTitle>
                <XCircle className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-gray-500" data-testid="text-kpi-retired">{retiredAssets.length}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-kpi-critical">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Critical</CardTitle>
                <Shield className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-red-600" data-testid="text-kpi-critical">{criticalAssets.length}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card data-testid="card-assets-by-category">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Assets by Category</CardTitle></CardHeader>
              <CardContent>
                {categoryDistribution.length > 0 ? categoryDistribution.map((c) => {
                  const CatIcon = CATEGORY_ICONS[c.value] || Package;
                  return (
                    <div key={c.value} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 text-sm"><CatIcon className="h-3.5 w-3.5 text-muted-foreground" /><span>{c.label}</span></div>
                      <Badge variant="secondary" className="no-default-active-elevate text-xs">{c.count}</Badge>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No categorized assets yet</p>
                )}
              </CardContent>
            </Card>
            <Card data-testid="card-deployment-by-location">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Deployment by Location</CardTitle></CardHeader>
              <CardContent>
                {locationDistribution.map((l) => (
                  <div key={l.value} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 text-sm"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /><span>{l.label}</span></div>
                    <Badge variant="secondary" className="no-default-active-elevate text-xs">{l.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card data-testid="card-asset-value-summary">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Financial Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-muted-foreground">Total Book Value</span>
                  <span className="font-semibold text-green-600 dark:text-green-400" data-testid="text-total-book-value">Rs. {totalBookValue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-muted-foreground">Warranty Expiring Soon</span>
                  <Badge variant="secondary" className={`no-default-active-elevate text-xs ${warrantyExpiringSoon.length > 0 ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950" : ""}`}>
                    {warrantyExpiringSoon.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-muted-foreground">Faulty Devices</span>
                  <Badge variant="secondary" className={`no-default-active-elevate text-xs ${faultyAssets.length > 0 ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950" : ""}`}>
                    {faultyAssets.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, tag, serial, MAC..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-assets"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-asset-status-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">In Stock</SelectItem>
                    <SelectItem value="deployed">Deployed</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="faulty">Faulty</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-asset-type-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="router">Router</SelectItem>
                    <SelectItem value="ONT">ONT</SelectItem>
                    <SelectItem value="OLT">OLT</SelectItem>
                    <SelectItem value="switch">Switch</SelectItem>
                    <SelectItem value="cable">Cable</SelectItem>
                    <SelectItem value="splitter">Splitter</SelectItem>
                    <SelectItem value="UPS">UPS</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-asset-location-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {LOCATION_TYPES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <HardDrive className="h-12 w-12 mb-3 opacity-30" /><p className="font-medium">No assets found</p><p className="text-sm mt-1">Add your first network asset to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="hidden md:table-cell">Serial / MAC</TableHead>
                        <TableHead className="hidden md:table-cell">Brand / Model</TableHead>
                        <TableHead className="hidden lg:table-cell">Location</TableHead>
                        <TableHead className="hidden lg:table-cell">Assigned To</TableHead>
                        <TableHead className="hidden xl:table-cell">Warranty</TableHead>
                        <TableHead className="hidden xl:table-cell">Book Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((asset) => {
                        const config = ASSET_STATUS_CONFIG[asset.status] || ASSET_STATUS_CONFIG.available;
                        const StatusIcon = config.icon;
                        const warrantyDays = asset.warrantyEnd ? Math.ceil((new Date(asset.warrantyEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                        return (
                          <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedAsset(asset)} data-testid={`row-asset-${asset.id}`}>
                            <TableCell className="font-mono text-xs" data-testid={`text-asset-tag-${asset.id}`}>{asset.assetTag}</TableCell>
                            <TableCell>
                              <div className="font-medium text-sm max-w-[180px] truncate">{asset.name}</div>
                              {asset.category && <div className="text-xs text-muted-foreground">{getCategoryLabel(asset.category)}</div>}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="no-default-active-elevate text-[10px] capitalize">{asset.type}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {asset.serialNumber && <div className="font-mono text-xs" data-testid={`text-serial-${asset.id}`}>{asset.serialNumber}</div>}
                              {asset.macAddress && <div className="font-mono text-xs text-muted-foreground" data-testid={`text-mac-${asset.id}`}>{asset.macAddress}</div>}
                              {!asset.serialNumber && !asset.macAddress && <span className="text-xs text-muted-foreground">{"\u2014"}</span>}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                              {[asset.brand, asset.model].filter(Boolean).join(" ") || "\u2014"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="text-sm">{asset.location || "\u2014"}</div>
                              {asset.locationType && <div className="text-xs text-muted-foreground capitalize">{asset.locationType}</div>}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                              {asset.assignedTo || "\u2014"}
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                              {warrantyDays !== null ? (
                                <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${warrantyDays <= 0 ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950" : warrantyDays <= 30 ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950" : "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950"}`}>
                                  {warrantyDays <= 0 ? "Expired" : `${warrantyDays}d`}
                                </Badge>
                              ) : <span className="text-xs text-muted-foreground">{"\u2014"}</span>}
                            </TableCell>
                            <TableCell className="hidden xl:table-cell text-sm">
                              {asset.bookValue || asset.purchaseCost ? (
                                <span className="font-medium">Rs. {parseFloat(asset.bookValue || asset.purchaseCost || "0").toLocaleString()}</span>
                              ) : <span className="text-muted-foreground">{"\u2014"}</span>}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${config.color}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />{config.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} data-testid={`button-asset-actions-${asset.id}`}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); }} data-testid={`button-view-asset-${asset.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(asset); }} data-testid={`button-edit-asset-${asset.id}`}>
                                    <Edit className="h-4 w-4 mr-2" />Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); statusChangeMutation.mutate({ id: asset.id, status: "maintenance" }); }}>
                                    <Wrench className="h-4 w-4 mr-2" />Mark Maintenance
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); statusChangeMutation.mutate({ id: asset.id, status: "deployed" }); }}>
                                    <Router className="h-4 w-4 mr-2" />Mark Deployed
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); archiveMutation.mutate(asset.id); }} data-testid={`button-archive-asset-${asset.id}`}>
                                    <Archive className="h-4 w-4 mr-2" />Retire Asset
                                  </DropdownMenuItem>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card data-testid="card-lifecycle-tracking">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><Activity className="h-4 w-4" />Asset Lifecycle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { label: "Purchased", color: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950" },
                    { label: "In Stock", color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950" },
                    { label: "Deployed", color: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" },
                    { label: "Under Maintenance", color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950" },
                    { label: "Faulty", color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950" },
                    { label: "Retired", color: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800" },
                    { label: "Disposed", color: "text-gray-500 bg-gray-50 dark:bg-gray-900" },
                  ].map((s) => (
                    <Badge key={s.label} variant="secondary" className={`no-default-active-elevate text-xs ${s.color}`}>{s.label}</Badge>
                  ))}
                </div>
                <div className="space-y-1.5">
                  {[
                    "When deployed: Update location automatically",
                    "When faulty: Create maintenance task",
                    "Warranty < 30 days: Generate alert",
                    "When retired: Stop depreciation",
                  ].map((r) => (
                    <div key={r} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Zap className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" /><span>{r}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-maintenance-summary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><Wrench className="h-4 w-4" />Maintenance Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-sm">Under Maintenance</span>
                  <Badge variant="secondary" className="no-default-active-elevate text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950">{maintenanceAssets.length}</Badge>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-sm">Faulty Devices</span>
                  <Badge variant="secondary" className={`no-default-active-elevate text-xs ${faultyAssets.length > 0 ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950" : ""}`}>{faultyAssets.length}</Badge>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-sm">Warranty Expiring (30d)</span>
                  <Badge variant="secondary" className={`no-default-active-elevate text-xs ${warrantyExpiringSoon.length > 0 ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950" : ""}`}>{warrantyExpiringSoon.length}</Badge>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm">Total Book Value</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">Rs. {totalBookValue.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "transfers" && (
        <div className="mt-5 space-y-6" data-testid="tab-content-transfers">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card data-testid="card-kpi-transfers-month">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">This Month</CardTitle>
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold" data-testid="text-transfers-month">{transfersThisMonth}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-kpi-in-transit">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">In Transit</CardTitle>
                <Truck className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-amber-600" data-testid="text-in-transit">{inTransitCount}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-kpi-pending-approval">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-blue-600" data-testid="text-pending-approval">{pendingApprovalCount}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-kpi-completed-transfers">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-green-600" data-testid="text-completed-transfers">{completedTransfers}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-kpi-returned">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Returned</CardTitle>
                <ArrowRightLeft className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-purple-600" data-testid="text-returned">{returnTransfers}</div>
              </CardContent>
            </Card>
            <Card data-testid="card-kpi-rejected-transfers">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-red-600" data-testid="text-rejected-transfers">{rejectedTransfers}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card data-testid="card-transfers-by-type">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Transfers by Type</CardTitle></CardHeader>
              <CardContent>
                {TRANSFER_TYPES.map((tt) => {
                  const cnt = allTransfers.filter((t) => t.transferType === tt.value).length;
                  return (
                    <div key={tt.value} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 text-sm"><ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" /><span>{tt.label}</span></div>
                      <Badge variant="secondary" className="no-default-active-elevate text-xs">{cnt}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <Card data-testid="card-transfers-by-status">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Status Distribution</CardTitle></CardHeader>
              <CardContent>
                {Object.entries(TRANSFER_STATUS_CONFIG).map(([key, cfg]) => {
                  const cnt = allTransfers.filter((t) => t.status === key).length;
                  return (
                    <div key={key} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 text-sm"><Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${cfg.color}`}>{cfg.label}</Badge></div>
                      <span className="text-sm font-medium">{cnt}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <Card data-testid="card-approval-workflow">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Shield className="h-4 w-4" />Approval Workflow</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { step: "1. Request Initiated", desc: "Technician or manager creates transfer request" },
                    { step: "2. Approval", desc: "Inventory manager reviews and approves" },
                    { step: "3. Dispatch", desc: "Asset dispatched, status set to In Transit" },
                    { step: "4. Receiving", desc: "Receiving party confirms delivery" },
                    { step: "5. Completed", desc: "Transfer finalized, location updated" },
                  ].map((s) => (
                    <div key={s.step} className="text-sm">
                      <p className="font-medium">{s.step}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search transfers..." value={transferSearch} onChange={(e) => setTransferSearch(e.target.value)} className="pl-9" data-testid="input-search-transfers" />
                </div>
                <Select value={transferStatusFilter} onValueChange={setTransferStatusFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-transfer-status-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(TRANSFER_STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {transfersLoading ? (
                <div className="p-5 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filteredTransfers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ArrowRightLeft className="h-12 w-12 mb-3 opacity-30" /><p className="font-medium">No transfers found</p><p className="text-sm mt-1">Create your first asset transfer request</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transfer ID</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead className="hidden md:table-cell">Type</TableHead>
                        <TableHead className="hidden md:table-cell">Requested By</TableHead>
                        <TableHead className="hidden lg:table-cell">Priority</TableHead>
                        <TableHead className="hidden lg:table-cell">Dispatch</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransfers.map((tr) => {
                        const stCfg = TRANSFER_STATUS_CONFIG[tr.status] || TRANSFER_STATUS_CONFIG.pending;
                        const priCfg = PRIORITY_CONFIG[tr.priority] || PRIORITY_CONFIG.normal;
                        return (
                          <TableRow key={tr.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedTransfer(tr)} data-testid={`row-transfer-${tr.id}`}>
                            <TableCell className="font-mono text-xs" data-testid={`text-transfer-id-${tr.id}`}>{tr.transferId}</TableCell>
                            <TableCell>
                              <div className="font-medium text-sm max-w-[150px] truncate">{tr.assetName || "\u2014"}</div>
                              {tr.assetTag && <div className="text-xs text-muted-foreground font-mono">{tr.assetTag}</div>}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{tr.fromLocation}</div>
                              {tr.fromLocationType && <div className="text-xs text-muted-foreground capitalize">{tr.fromLocationType}</div>}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{tr.toLocation}</div>
                              {tr.toLocationType && <div className="text-xs text-muted-foreground capitalize">{tr.toLocationType}</div>}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="secondary" className="no-default-active-elevate text-[10px]">{TRANSFER_TYPES.find((t) => t.value === tr.transferType)?.label || tr.transferType}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{tr.requestedBy || "\u2014"}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${priCfg.color}`}>
                                {tr.isUrgent && <AlertTriangle className="h-3 w-3 mr-0.5" />}{priCfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{tr.dispatchDate || "\u2014"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${stCfg.color}`}>{stCfg.label}</Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} data-testid={`button-transfer-actions-${tr.id}`}><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedTransfer(tr); }} data-testid={`button-view-transfer-${tr.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />View Details
                                  </DropdownMenuItem>
                                  {tr.status === "pending" && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTransferStatusChange(tr.id, "approved"); }}>
                                      <CheckCircle className="h-4 w-4 mr-2" />Approve
                                    </DropdownMenuItem>
                                  )}
                                  {tr.status === "approved" && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTransferStatusChange(tr.id, "in_transit"); }}>
                                      <Truck className="h-4 w-4 mr-2" />Mark Dispatched
                                    </DropdownMenuItem>
                                  )}
                                  {tr.status === "in_transit" && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTransferStatusChange(tr.id, "received"); }}>
                                      <Package className="h-4 w-4 mr-2" />Mark Received
                                    </DropdownMenuItem>
                                  )}
                                  {tr.status === "received" && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleTransferStatusChange(tr.id, "completed"); }}>
                                      <CheckCircle className="h-4 w-4 mr-2" />Complete
                                    </DropdownMenuItem>
                                  )}
                                  {tr.status === "pending" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleTransferStatusChange(tr.id, "rejected"); }}>
                                        <XCircle className="h-4 w-4 mr-2" />Reject
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {!["completed", "cancelled", "rejected"].includes(tr.status) && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleTransferStatusChange(tr.id, "cancelled"); }}>
                                        <XCircle className="h-4 w-4 mr-2" />Cancel
                                      </DropdownMenuItem>
                                    </>
                                  )}
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

          {selectedTransfer && (
            <div className="fixed inset-0 z-50 flex justify-end" data-testid="drawer-transfer-details">
              <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedTransfer(null)} />
              <div className="relative w-full max-w-lg bg-background border-l border-border shadow-xl overflow-y-auto animate-in slide-in-from-right duration-200">
                <div className="sticky top-0 z-10 bg-background border-b border-border p-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold" data-testid="text-drawer-transfer-id">{selectedTransfer.transferId}</h2>
                    <p className="text-xs text-muted-foreground">{selectedTransfer.assetName || "Asset Transfer"}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedTransfer(null)} data-testid="button-close-transfer-drawer"><X className="h-4 w-4" /></Button>
                </div>
                <div className="p-4 space-y-5">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className={`no-default-active-elevate text-xs ${(TRANSFER_STATUS_CONFIG[selectedTransfer.status] || TRANSFER_STATUS_CONFIG.pending).color}`}>
                      {(TRANSFER_STATUS_CONFIG[selectedTransfer.status] || TRANSFER_STATUS_CONFIG.pending).label}
                    </Badge>
                    <Badge variant="secondary" className={`no-default-active-elevate text-xs ${(PRIORITY_CONFIG[selectedTransfer.priority] || PRIORITY_CONFIG.normal).color}`}>
                      {selectedTransfer.isUrgent && <AlertTriangle className="h-3 w-3 mr-0.5" />}{(PRIORITY_CONFIG[selectedTransfer.priority] || PRIORITY_CONFIG.normal).label} Priority
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Asset Information</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Asset ID</span><p className="font-mono text-xs">AST-{String(selectedTransfer.assetId).padStart(4, "0")}</p></div>
                      <div><span className="text-muted-foreground">Asset Tag</span><p className="font-mono text-xs">{selectedTransfer.assetTag || "\u2014"}</p></div>
                      <div><span className="text-muted-foreground">Asset Name</span><p className="font-medium">{selectedTransfer.assetName || "\u2014"}</p></div>
                      <div><span className="text-muted-foreground">Asset Type</span><p className="font-medium capitalize">{selectedTransfer.assetType || "\u2014"}</p></div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Transfer Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Transfer Type</span><p className="font-medium">{TRANSFER_TYPES.find((t) => t.value === selectedTransfer.transferType)?.label || selectedTransfer.transferType}</p></div>
                      <div><span className="text-muted-foreground">Assigned To</span><p className="font-medium">{selectedTransfer.assignedTo || "\u2014"}</p></div>
                      <div><span className="text-muted-foreground">From Location</span><p className="font-medium">{selectedTransfer.fromLocation}</p></div>
                      <div><span className="text-muted-foreground">To Location</span><p className="font-medium">{selectedTransfer.toLocation}</p></div>
                      <div><span className="text-muted-foreground">From Type</span><p className="font-medium capitalize">{selectedTransfer.fromLocationType || "\u2014"}</p></div>
                      <div><span className="text-muted-foreground">To Type</span><p className="font-medium capitalize">{selectedTransfer.toLocationType || "\u2014"}</p></div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">People & Dates</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Requested By</span><p className="font-medium">{selectedTransfer.requestedBy || "\u2014"}</p></div>
                      <div><span className="text-muted-foreground">Approved By</span><p className="font-medium">{selectedTransfer.approvedBy || "\u2014"}</p></div>
                      <div><span className="text-muted-foreground">Received By</span><p className="font-medium">{selectedTransfer.receivedBy || "\u2014"}</p></div>
                      <div><span className="text-muted-foreground">Expected Delivery</span><p className="font-medium">{selectedTransfer.expectedDeliveryDate || "\u2014"}</p></div>
                      <div><span className="text-muted-foreground">Dispatch Date</span><p className="font-medium">{selectedTransfer.dispatchDate || "\u2014"}</p></div>
                      <div><span className="text-muted-foreground">Delivery Date</span><p className="font-medium">{selectedTransfer.deliveryDate || "\u2014"}</p></div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Condition</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">On Transfer</span><p className="font-medium capitalize">{selectedTransfer.conditionOnTransfer || "\u2014"}</p></div>
                      <div><span className="text-muted-foreground">On Receive</span><p className="font-medium capitalize">{selectedTransfer.conditionOnReceive || "\u2014"}</p></div>
                    </div>
                  </div>

                  {selectedTransfer.reason && (
                    <>
                      <Separator />
                      <div><h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Reason</h3><p className="text-sm">{selectedTransfer.reason}</p></div>
                    </>
                  )}

                  {selectedTransfer.rejectionReason && (
                    <>
                      <Separator />
                      <div><h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-red-600">Rejection Reason</h3><p className="text-sm text-red-600 dark:text-red-400">{selectedTransfer.rejectionReason}</p></div>
                    </>
                  )}

                  {selectedTransfer.notes && (
                    <>
                      <Separator />
                      <div><h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</h3><p className="text-sm text-muted-foreground">{selectedTransfer.notes}</p></div>
                    </>
                  )}

                  <Separator />

                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Status Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedTransfer.status === "pending" && (
                        <>
                          <Button variant="outline" size="sm" className="text-xs" onClick={() => handleTransferStatusChange(selectedTransfer.id, "approved")} data-testid="button-drawer-approve"><CheckCircle className="h-3 w-3 mr-1" />Approve</Button>
                          <Button variant="outline" size="sm" className="text-xs text-destructive" onClick={() => handleTransferStatusChange(selectedTransfer.id, "rejected")} data-testid="button-drawer-reject"><XCircle className="h-3 w-3 mr-1" />Reject</Button>
                        </>
                      )}
                      {selectedTransfer.status === "approved" && (
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => handleTransferStatusChange(selectedTransfer.id, "in_transit")} data-testid="button-drawer-dispatch"><Truck className="h-3 w-3 mr-1" />Dispatch</Button>
                      )}
                      {selectedTransfer.status === "in_transit" && (
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => handleTransferStatusChange(selectedTransfer.id, "received")} data-testid="button-drawer-receive"><Package className="h-3 w-3 mr-1" />Mark Received</Button>
                      )}
                      {selectedTransfer.status === "received" && (
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => handleTransferStatusChange(selectedTransfer.id, "completed")} data-testid="button-drawer-complete"><CheckCircle className="h-3 w-3 mr-1" />Complete</Button>
                      )}
                      {!["completed", "cancelled", "rejected"].includes(selectedTransfer.status) && (
                        <Button variant="outline" size="sm" className="text-xs text-destructive" onClick={() => handleTransferStatusChange(selectedTransfer.id, "cancelled")} data-testid="button-drawer-cancel"><XCircle className="h-3 w-3 mr-1" />Cancel</Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "requests" && (
        <div className="mt-5" data-testid="tab-content-requests">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Request & Approvals</CardTitle>
              <p className="text-sm text-muted-foreground">Asset request and approval workflow</p>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : allAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileCheck className="h-12 w-12 mb-3 opacity-30" /><p className="font-medium">No asset requests</p><p className="text-sm mt-1">Asset requests will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead><TableHead>Type</TableHead><TableHead>Requested By</TableHead>
                        <TableHead>Request Date</TableHead><TableHead>Status</TableHead><TableHead>Approval</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allAssets.map((asset) => {
                        const cfg = ASSET_STATUS_CONFIG[asset.status] || ASSET_STATUS_CONFIG.available;
                        return (
                          <TableRow key={asset.id} data-testid={`row-request-${asset.id}`}>
                            <TableCell className="font-medium" data-testid={`text-request-name-${asset.id}`}>{asset.name}</TableCell>
                            <TableCell><Badge variant="secondary" className="no-default-active-elevate text-[10px] capitalize">{asset.type}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground" data-testid={`text-request-by-${asset.id}`}>{asset.assignedTo || "Unassigned"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{asset.purchaseDate || "\u2014"}</TableCell>
                            <TableCell><Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${cfg.color}`}>{cfg.label}</Badge></TableCell>
                            <TableCell data-testid={`text-approval-status-${asset.id}`}>
                              <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${asset.status === "deployed" ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" : asset.status === "available" ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950" : "text-muted-foreground"}`}>
                                {asset.status === "deployed" ? "Approved" : asset.status === "available" ? "Pending" : "Review"}
                              </Badge>
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

      {activeTab === "tracking" && (
        <div className="mt-5 space-y-4" data-testid="tab-content-tracking">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card data-testid="card-tracking-deployed">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2"><CardTitle className="text-sm font-medium">Deployed Assets</CardTitle><Router className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent><div className="text-2xl font-bold" data-testid="text-deployed-count">{deployedAssets.length}</div><p className="text-xs text-muted-foreground mt-1">Currently in the field</p></CardContent>
            </Card>
            <Card data-testid="card-tracking-maintenance">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2"><CardTitle className="text-sm font-medium">Under Maintenance</CardTitle><Wrench className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent><div className="text-2xl font-bold" data-testid="text-maintenance-count">{maintenanceAssets.length}</div><p className="text-xs text-muted-foreground mt-1">Being serviced or repaired</p></CardContent>
            </Card>
            <Card data-testid="card-tracking-total">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2"><CardTitle className="text-sm font-medium">Total Assets</CardTitle><HardDrive className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent><div className="text-2xl font-bold" data-testid="text-total-count">{allAssets.length}</div><p className="text-xs text-muted-foreground mt-1">All tracked assets</p></CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Asset Locations & Status</CardTitle><p className="text-sm text-muted-foreground">Track asset locations and maintenance history</p></CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : allAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><MapPin className="h-12 w-12 mb-3 opacity-30" /><p className="font-medium">No assets to track</p><p className="text-sm mt-1">Add assets to start tracking</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset Tag</TableHead><TableHead>Name</TableHead><TableHead>Location</TableHead>
                        <TableHead>Assigned To</TableHead><TableHead>Status</TableHead><TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allAssets.map((asset) => {
                        const config = ASSET_STATUS_CONFIG[asset.status] || ASSET_STATUS_CONFIG.available;
                        const StatusIcon = config.icon;
                        return (
                          <TableRow key={asset.id} data-testid={`row-tracking-${asset.id}`}>
                            <TableCell className="font-mono text-xs" data-testid={`text-tracking-tag-${asset.id}`}>{asset.assetTag}</TableCell>
                            <TableCell className="font-medium">{asset.name}</TableCell>
                            <TableCell data-testid={`text-tracking-location-${asset.id}`}>
                              <div className="flex items-center gap-1.5 text-sm"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{asset.location || "Unassigned"}</div>
                              {asset.locationType && <div className="text-xs text-muted-foreground capitalize ml-5">{asset.locationType}</div>}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{asset.assignedTo || "\u2014"}</TableCell>
                            <TableCell><Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${config.color}`}><StatusIcon className="h-3 w-3 mr-1" />{config.label}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{asset.purchaseDate || "\u2014"}</div>
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

      {activeTab === "allocation" && (
        <div className="mt-5 space-y-4" data-testid="tab-content-allocation">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card data-testid="card-allocated-count">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2"><CardTitle className="text-sm font-medium">Allocated Assets</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent><div className="text-2xl font-bold" data-testid="text-allocated-count">{allocatedAssets.length}</div><p className="text-xs text-muted-foreground mt-1">Assigned to employees or locations</p></CardContent>
            </Card>
            <Card data-testid="card-unallocated-count">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2"><CardTitle className="text-sm font-medium">Unallocated Assets</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader>
              <CardContent><div className="text-2xl font-bold" data-testid="text-unallocated-count">{allAssets.length - allocatedAssets.length}</div><p className="text-xs text-muted-foreground mt-1">Available for assignment</p></CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Asset Allocation</CardTitle><p className="text-sm text-muted-foreground">Assets assigned to employees and locations</p></CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : allocatedAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Users className="h-12 w-12 mb-3 opacity-30" /><p className="font-medium">No allocated assets</p><p className="text-sm mt-1">Assign assets to employees or locations</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset Tag</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead>
                        <TableHead>Assigned To</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allocatedAssets.map((asset) => {
                        const config = ASSET_STATUS_CONFIG[asset.status] || ASSET_STATUS_CONFIG.available;
                        const StatusIcon = config.icon;
                        return (
                          <TableRow key={asset.id} data-testid={`row-allocation-${asset.id}`}>
                            <TableCell className="font-mono text-xs" data-testid={`text-allocation-tag-${asset.id}`}>{asset.assetTag}</TableCell>
                            <TableCell className="font-medium">{asset.name}</TableCell>
                            <TableCell><Badge variant="secondary" className="no-default-active-elevate text-[10px] capitalize">{asset.type}</Badge></TableCell>
                            <TableCell data-testid={`text-allocation-assigned-${asset.id}`}>
                              <div className="flex items-center gap-1.5 text-sm"><Users className="h-3.5 w-3.5 text-muted-foreground" />{asset.assignedTo}</div>
                            </TableCell>
                            <TableCell data-testid={`text-allocation-location-${asset.id}`}>
                              <div className="flex items-center gap-1.5 text-sm"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{asset.location || "No location"}</div>
                            </TableCell>
                            <TableCell><Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${config.color}`}><StatusIcon className="h-3 w-3 mr-1" />{config.label}</Badge></TableCell>
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

      {selectedAsset && (
        <AssetDetailsDrawer
          asset={selectedAsset}
          vendors={vendors || []}
          onClose={() => setSelectedAsset(null)}
          onEdit={(a) => { setSelectedAsset(null); openEdit(a); }}
          onStatusChange={(id, status) => statusChangeMutation.mutate({ id, status })}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAsset ? "Edit Asset" : "Add New Asset"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="border border-border rounded-lg p-4 space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">General Information</p>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="assetTag" render={({ field }) => (
                    <FormItem><FormLabel>Asset Tag</FormLabel><FormControl><Input placeholder="AST-001" data-testid="input-asset-tag" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Asset Name</FormLabel><FormControl><Input placeholder="MikroTik hEX S" data-testid="input-asset-name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "router"}>
                        <FormControl><SelectTrigger data-testid="select-asset-type"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="router">Router</SelectItem><SelectItem value="ONT">ONT</SelectItem>
                          <SelectItem value="OLT">OLT</SelectItem><SelectItem value="switch">Switch</SelectItem>
                          <SelectItem value="cable">Cable</SelectItem><SelectItem value="splitter">Splitter</SelectItem>
                          <SelectItem value="UPS">UPS</SelectItem><SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl><SelectTrigger data-testid="select-asset-category"><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="brand" render={({ field }) => (
                    <FormItem><FormLabel>Brand</FormLabel><FormControl><Input placeholder="MikroTik" data-testid="input-asset-brand" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="model" render={({ field }) => (
                    <FormItem><FormLabel>Model</FormLabel><FormControl><Input placeholder="RB760iGS" data-testid="input-asset-model" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="serialNumber" render={({ field }) => (
                    <FormItem><FormLabel>Serial Number</FormLabel><FormControl><Input placeholder="SN-XXXX" className="font-mono" data-testid="input-asset-serial" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="macAddress" render={({ field }) => (
                    <FormItem><FormLabel>MAC Address</FormLabel><FormControl><Input placeholder="AA:BB:CC:DD:EE:FF" className="font-mono" data-testid="input-asset-mac" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "available"}>
                        <FormControl><SelectTrigger data-testid="select-asset-status"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Object.entries(ASSET_STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">Purchase & Vendor</p>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="vendorId" render={({ field }) => (
                    <FormItem><FormLabel>Vendor</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === "none" ? undefined : parseInt(v))} value={field.value?.toString() || "none"}>
                        <FormControl><SelectTrigger data-testid="select-asset-vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="none">No vendor</SelectItem>
                          {(vendors || []).map((v) => <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>)}
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="purchaseDate" render={({ field }) => (
                    <FormItem><FormLabel>Purchase Date</FormLabel><FormControl><Input type="date" data-testid="input-asset-purchase-date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="invoiceReference" render={({ field }) => (
                    <FormItem><FormLabel>Invoice Reference</FormLabel><FormControl><Input placeholder="INV-001" data-testid="input-asset-invoice-ref" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="purchaseCost" render={({ field }) => (
                    <FormItem><FormLabel>Purchase Cost (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-asset-cost" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="warrantyEnd" render={({ field }) => (
                    <FormItem><FormLabel>Warranty Expiry</FormLabel><FormControl><Input type="date" data-testid="input-asset-warranty" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="bookValue" render={({ field }) => (
                    <FormItem><FormLabel>Book Value (Rs.)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" data-testid="input-asset-book-value" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">Location & Assignment</p>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="POP-Downtown" data-testid="input-asset-location" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="locationType" render={({ field }) => (
                    <FormItem><FormLabel>Location Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "warehouse"}>
                        <FormControl><SelectTrigger data-testid="select-asset-location-type"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{LOCATION_TYPES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="assignedTo" render={({ field }) => (
                    <FormItem><FormLabel>Assigned To</FormLabel><FormControl><Input placeholder="Person, POP, or customer" data-testid="input-asset-assigned-to" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="assignedType" render={({ field }) => (
                    <FormItem><FormLabel>Assigned Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "staff"}>
                        <FormControl><SelectTrigger data-testid="select-asset-assigned-type"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem><SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="pop">POP</SelectItem><SelectItem value="warehouse">Warehouse</SelectItem>
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="installedBy" render={({ field }) => (
                    <FormItem><FormLabel>Installed By</FormLabel><FormControl><Input placeholder="Technician name" data-testid="input-asset-installed-by" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="installationDate" render={({ field }) => (
                    <FormItem><FormLabel>Installation Date</FormLabel><FormControl><Input type="date" data-testid="input-asset-install-date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">Technical & Network</p>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="ipAddress" render={({ field }) => (
                    <FormItem><FormLabel>IP Address</FormLabel><FormControl><Input placeholder="192.168.1.1" className="font-mono" data-testid="input-asset-ip" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="vlan" render={({ field }) => (
                    <FormItem><FormLabel>VLAN</FormLabel><FormControl><Input placeholder="VLAN 100" className="font-mono" data-testid="input-asset-vlan" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="firmwareVersion" render={({ field }) => (
                    <FormItem><FormLabel>Firmware Version</FormLabel><FormControl><Input placeholder="v7.12" className="font-mono" data-testid="input-asset-firmware" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">Depreciation & Maintenance</p>
                <div className="grid grid-cols-4 gap-4">
                  <FormField control={form.control} name="depreciationMethod" render={({ field }) => (
                    <FormItem><FormLabel>Depreciation Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "straight_line"}>
                        <FormControl><SelectTrigger data-testid="select-asset-dep-method"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{DEPRECIATION_METHODS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="depreciationRate" render={({ field }) => (
                    <FormItem><FormLabel>Dep. Rate (%)</FormLabel><FormControl><Input type="number" step="0.01" min={0} max={100} placeholder="10" data-testid="input-asset-dep-rate" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="lastMaintenanceDate" render={({ field }) => (
                    <FormItem><FormLabel>Last Maintenance</FormLabel><FormControl><Input type="date" data-testid="input-asset-last-maint" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="nextMaintenanceDate" render={({ field }) => (
                    <FormItem><FormLabel>Next Maintenance</FormLabel><FormControl><Input type="date" data-testid="input-asset-next-maint" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Additional notes..." className="resize-none" rows={2} data-testid="input-asset-notes" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-asset">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingAsset ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingType ? "Edit Asset Type" : "Add Asset Type"}</DialogTitle></DialogHeader>
          <Form {...typeForm}>
            <form onSubmit={typeForm.handleSubmit(onTypeSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={typeForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Asset Type Name</FormLabel><FormControl><Input placeholder="e.g. MikroTik Router" data-testid="input-type-name" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={typeForm.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger data-testid="select-type-category"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={typeForm.control} name="subcategory" render={({ field }) => (
                  <FormItem><FormLabel>Subcategory</FormLabel><FormControl><Input placeholder="Optional subcategory" data-testid="input-type-subcategory" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={typeForm.control} name="codePrefix" render={({ field }) => (
                  <FormItem><FormLabel>Asset Code Prefix</FormLabel><FormControl><Input placeholder="e.g. OLT, RTR, SW" data-testid="input-type-prefix" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={typeForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Brief description..." className="resize-none" rows={2} data-testid="input-type-description" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-3 gap-4">
                <FormField control={typeForm.control} name="defaultLocationType" render={({ field }) => (
                  <FormItem><FormLabel>Default Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "warehouse"}>
                      <FormControl><SelectTrigger data-testid="select-type-location"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{LOCATION_TYPES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={typeForm.control} name="warrantyDefaultPeriod" render={({ field }) => (
                  <FormItem><FormLabel>Warranty (months)</FormLabel><FormControl><Input type="number" min={0} placeholder="12" data-testid="input-type-warranty" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={typeForm.control} name="expectedLifespan" render={({ field }) => (
                  <FormItem><FormLabel>Lifespan (years)</FormLabel><FormControl><Input type="number" min={1} placeholder="5" data-testid="input-type-lifespan" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={typeForm.control} name="depreciationMethod" render={({ field }) => (
                  <FormItem><FormLabel>Depreciation Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "straight_line"}>
                      <FormControl><SelectTrigger data-testid="select-type-depreciation"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{DEPRECIATION_METHODS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={typeForm.control} name="depreciationRate" render={({ field }) => (
                  <FormItem><FormLabel>Depreciation Rate (%)</FormLabel><FormControl><Input type="number" step="0.01" min={0} max={100} placeholder="10" data-testid="input-type-depreciation-rate" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={typeForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "active"}>
                      <FormControl><SelectTrigger data-testid="select-type-status"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem><SelectItem value="limited">Limited Use</SelectItem>
                        <SelectItem value="deprecated">Deprecated</SelectItem><SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
              </div>
              <div className="border border-border rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">Tracking & Maintenance Options</p>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={typeForm.control} name="maintenanceRequired" render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2"><FormLabel className="text-sm font-normal">Maintenance Required</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-maintenance" /></FormControl></FormItem>
                  )} />
                  <FormField control={typeForm.control} name="criticalAsset" render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2"><FormLabel className="text-sm font-normal">Critical Asset</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-critical" /></FormControl></FormItem>
                  )} />
                  <FormField control={typeForm.control} name="trackSerialNumber" render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2"><FormLabel className="text-sm font-normal">Track Serial Number</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-serial" /></FormControl></FormItem>
                  )} />
                  <FormField control={typeForm.control} name="trackMacAddress" render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2"><FormLabel className="text-sm font-normal">Track MAC Address</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-mac" /></FormControl></FormItem>
                  )} />
                  <FormField control={typeForm.control} name="trackStockQuantity" render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2"><FormLabel className="text-sm font-normal">Track Stock Quantity</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-stock" /></FormControl></FormItem>
                  )} />
                  <FormField control={typeForm.control} name="trackAssignment" render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2"><FormLabel className="text-sm font-normal">Track Assignment</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-assignment" /></FormControl></FormItem>
                  )} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setTypeDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createTypeMutation.isPending || updateTypeMutation.isPending} data-testid="button-save-type">
                  {createTypeMutation.isPending || updateTypeMutation.isPending ? "Saving..." : editingType ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Transfer Request</DialogTitle></DialogHeader>
          <Form {...transferForm}>
            <form onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-4">
              <div className="border border-border rounded-lg p-4 space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">Transfer Information</p>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={transferForm.control} name="transferId" render={({ field }) => (
                    <FormItem><FormLabel>Transfer ID</FormLabel><FormControl><Input className="font-mono" data-testid="input-transfer-id" {...field} readOnly /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={transferForm.control} name="assetId" render={({ field }) => (
                    <FormItem><FormLabel>Asset</FormLabel>
                      <Select onValueChange={(v) => {
                        const id = parseInt(v);
                        field.onChange(id);
                        const a = (assets || []).find((x) => x.id === id);
                        if (a) {
                          transferForm.setValue("assetName", a.name);
                          transferForm.setValue("assetTag", a.assetTag);
                          transferForm.setValue("assetType", a.type);
                          transferForm.setValue("fromLocation", a.location || "");
                          transferForm.setValue("fromLocationType", a.locationType || "warehouse");
                        }
                      }} value={field.value?.toString() || "0"}>
                        <FormControl><SelectTrigger data-testid="select-transfer-asset"><SelectValue placeholder="Select asset" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="0" disabled>Select asset...</SelectItem>
                          {(assets || []).filter((a) => !["retired", "lost"].includes(a.status)).map((a) => (
                            <SelectItem key={a.id} value={a.id.toString()}>{a.assetTag} - {a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={transferForm.control} name="transferType" render={({ field }) => (
                    <FormItem><FormLabel>Transfer Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger data-testid="select-transfer-type"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{TRANSFER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">Locations</p>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={transferForm.control} name="fromLocation" render={({ field }) => (
                    <FormItem><FormLabel>From Location</FormLabel><FormControl><Input placeholder="Current location" data-testid="input-transfer-from" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={transferForm.control} name="toLocation" render={({ field }) => (
                    <FormItem><FormLabel>To Location</FormLabel><FormControl><Input placeholder="Destination" data-testid="input-transfer-to" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={transferForm.control} name="fromLocationType" render={({ field }) => (
                    <FormItem><FormLabel>From Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "warehouse"}>
                        <FormControl><SelectTrigger data-testid="select-transfer-from-type"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{LOCATION_TYPES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={transferForm.control} name="toLocationType" render={({ field }) => (
                    <FormItem><FormLabel>To Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "pop"}>
                        <FormControl><SelectTrigger data-testid="select-transfer-to-type"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{LOCATION_TYPES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">Assignment & Schedule</p>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={transferForm.control} name="assignedTo" render={({ field }) => (
                    <FormItem><FormLabel>Assigned To</FormLabel><FormControl><Input placeholder="Technician / Staff" data-testid="input-transfer-assigned" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={transferForm.control} name="requestedBy" render={({ field }) => (
                    <FormItem><FormLabel>Requested By</FormLabel><FormControl><Input data-testid="input-transfer-requested-by" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={transferForm.control} name="expectedDeliveryDate" render={({ field }) => (
                    <FormItem><FormLabel>Expected Delivery</FormLabel><FormControl><Input type="date" data-testid="input-transfer-delivery-date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={transferForm.control} name="priority" render={({ field }) => (
                    <FormItem><FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "normal"}>
                        <FormControl><SelectTrigger data-testid="select-transfer-priority"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={transferForm.control} name="conditionOnTransfer" render={({ field }) => (
                    <FormItem><FormLabel>Condition</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "good"}>
                        <FormControl><SelectTrigger data-testid="select-transfer-condition"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem><SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem><SelectItem value="damaged">Damaged</SelectItem>
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">Options</p>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={transferForm.control} name="requireApproval" render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2"><FormLabel className="text-sm font-normal">Require Approval</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-require-approval" /></FormControl></FormItem>
                  )} />
                  <FormField control={transferForm.control} name="isUrgent" render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2"><FormLabel className="text-sm font-normal">Mark as Urgent</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-urgent" /></FormControl></FormItem>
                  )} />
                  <FormField control={transferForm.control} name="notifyReceiver" render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2"><FormLabel className="text-sm font-normal">Notify Receiver</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-notify-receiver" /></FormControl></FormItem>
                  )} />
                </div>
              </div>

              <FormField control={transferForm.control} name="reason" render={({ field }) => (
                <FormItem><FormLabel>Reason for Transfer</FormLabel><FormControl><Textarea placeholder="Explain the reason..." className="resize-none" rows={2} data-testid="input-transfer-reason" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={transferForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Additional notes..." className="resize-none" rows={2} data-testid="input-transfer-notes" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createTransferMutation.isPending} data-testid="button-save-transfer">
                  {createTransferMutation.isPending ? "Creating..." : "Create Transfer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
