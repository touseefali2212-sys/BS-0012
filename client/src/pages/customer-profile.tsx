import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Wifi,
  WifiOff,
  Edit,
  Plus,
  Trash2,
  FileText,
  Hash,
  CreditCard,
  AlertCircle,
  Network,
  StickyNote,
  Save,
  Download,
  MessageCircle,
  CalendarRange,
  ChevronRight,
  Shield,
  Globe,
  Eye,
  EyeOff,
  Clock,
  Settings,
  Package,
  RefreshCw,
  Bell,
  Calculator,
  Building2,
  Smartphone,
  LocateFixed,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  type Customer,
  type Invoice,
  type Ticket,
  type CustomerConnection,
  type InsertCustomerConnection,
  insertCustomerConnectionSchema,
  type Package as PackageType,
  type Vendor,
  type ServiceSchedulerRequest,
} from "@shared/schema";

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  const [notes, setNotes] = useState("");
  const [notesEditing, setNotesEditing] = useState(false);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<CustomerConnection | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [gpsLat, setGpsLat] = useState("");
  const [gpsLng, setGpsLng] = useState("");
  const [gpsLocating, setGpsLocating] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [serviceSchedulerOpen, setServiceSchedulerOpen] = useState(false);
  const [serviceRequestType, setServiceRequestType] = useState("package_upgrade");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [effectiveMonth, setEffectiveMonth] = useState("current_month");
  const [equipmentType, setEquipmentType] = useState("");
  const [equipmentAction, setEquipmentAction] = useState("new");
  const [serviceDescription, setServiceDescription] = useState("");
  const [servicePriority, setServicePriority] = useState("normal");
  const [statusSchedulerOpen, setStatusSchedulerOpen] = useState(false);
  const [scheduledStatus, setScheduledStatus] = useState("inactive");
  const [scheduledDate, setScheduledDate] = useState("");
  const [statusScheduleReason, setStatusScheduleReason] = useState("");
  const [pcrDetailOpen, setPcrDetailOpen] = useState(false);
  const [selectedPcr, setSelectedPcr] = useState<any>(null);
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const [messageChannel, setMessageChannel] = useState("email");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageCategory, setMessageCategory] = useState("bill_reminder");

  const smsCategories = [
    { value: "bill_reminder", label: "Bill Reminder", defaultMsg: "Dear {name}, your bill of {amount} is due. Please pay before the due date to avoid service interruption." },
    { value: "invoice_softcopy", label: "Invoice Softcopy (WhatsApp/Email)", defaultMsg: "Dear {name}, please find your invoice #{invoice} attached. Amount: {amount}." },
    { value: "account_suspend", label: "Account Suspend Notice", defaultMsg: "Dear {name}, your account has been suspended due to non-payment. Please clear your dues to restore service." },
    { value: "payment_confirmation", label: "Payment Confirmation", defaultMsg: "Dear {name}, we have received your payment of {amount}. Thank you!" },
    { value: "service_activation", label: "Service Activation", defaultMsg: "Dear {name}, your internet service has been activated. Enjoy your connection!" },
    { value: "package_change", label: "Package Change Notification", defaultMsg: "Dear {name}, your package has been changed successfully. New package details will be reflected in your next bill." },
    { value: "maintenance_notice", label: "Maintenance Notice", defaultMsg: "Dear {name}, scheduled maintenance will be performed in your area. We apologize for any inconvenience." },
    { value: "welcome_message", label: "Welcome Message", defaultMsg: "Welcome to our network, {name}! We are glad to have you as a customer." },
    { value: "custom", label: "Custom Message", defaultMsg: "" },
  ];

  const { data: customer, isLoading: customerLoading } = useQuery<Customer>({
    queryKey: ["/api/customers", id],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch customer");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: packages } = useQuery<PackageType[]>({
    queryKey: ["/api/packages"],
  });

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/customers", id, "invoices"],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}/invoices`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: tickets, isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/customers", id, "tickets"],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}/tickets`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: connections, isLoading: connectionsLoading } = useQuery<CustomerConnection[]>({
    queryKey: ["/api/customers", id, "connections"],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}/connections`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: referrals, isLoading: referralsLoading } = useQuery<any[]>({
    queryKey: ["/api/customer-queries/by-referrer", "customer", id],
    queryFn: async () => {
      const res = await fetch(`/api/customer-queries/by-referrer?type=customer&id=${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch referrals");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: serviceRequests, isLoading: serviceRequestsLoading } = useQuery<ServiceSchedulerRequest[]>({
    queryKey: ["/api/customers", id, "service-requests"],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}/service-requests`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch service requests");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: auditLogs, isLoading: auditLogsLoading } = useQuery<any[]>({
    queryKey: ["/api/customers", id, "audit-logs"],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}/audit-logs`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: enableDisableLogs, isLoading: enableDisableLogsLoading } = useQuery<any[]>({
    queryKey: ["/api/customers", id, "enable-disable-logs"],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}/enable-disable-logs`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch enable/disable logs");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: messageHistory, isLoading: messageHistoryLoading } = useQuery<any[]>({
    queryKey: ["/api/customers", id, "message-history"],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}/message-history`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch message history");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: pkgChangeHistory, isLoading: pkgChangeLoading } = useQuery<any[]>({
    queryKey: ["/api/customers", id, "package-change-history"],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}/package-change-history`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch package change history");
      return res.json();
    },
    enabled: !!id,
  });

  const createServiceRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/service-requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", id, "service-requests"] });
      setServiceSchedulerOpen(false);
      resetServiceForm();
      toast({ title: "Service request created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateServiceRequestMutation = useMutation({
    mutationFn: async ({ reqId, data }: { reqId: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/service-requests/${reqId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", id, "service-requests"] });
      toast({ title: "Service request updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteServiceRequestMutation = useMutation({
    mutationFn: async (reqId: number) => {
      const res = await apiRequest("DELETE", `/api/service-requests/${reqId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", id, "service-requests"] });
      toast({ title: "Service request deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetServiceForm = () => {
    setServiceRequestType("package_upgrade");
    setSelectedPackageId("");
    setEffectiveMonth("current_month");
    setEquipmentType("");
    setEquipmentAction("new");
    setServiceDescription("");
    setServicePriority("normal");
  };

  const handleServiceRequestSubmit = () => {
    const data: any = {
      customerId: parseInt(id || "0"),
      requestType: serviceRequestType,
      priority: servicePriority,
      description: serviceDescription,
    };
    if (serviceRequestType === "package_upgrade" || serviceRequestType === "package_downgrade") {
      data.currentPackageId = customer?.packageId;
      data.requestedPackageId = selectedPackageId ? parseInt(selectedPackageId) : null;
      data.effectiveMonth = effectiveMonth;
    }
    if (serviceRequestType === "equipment_new" || serviceRequestType === "equipment_replace") {
      data.equipmentType = equipmentType;
      data.equipmentAction = serviceRequestType === "equipment_new" ? "new" : "replace";
    }
    createServiceRequestMutation.mutate(data);
  };

  const statusSchedulerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/service-requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", id, "service-requests"] });
      setStatusSchedulerOpen(false);
      setScheduledStatus("inactive");
      setScheduledDate("");
      setStatusScheduleReason("");
      toast({ title: "Status change scheduled successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleStatusSchedulerSubmit = () => {
    if (!scheduledDate) {
      toast({ title: "Error", description: "Please select a scheduled date", variant: "destructive" });
      return;
    }
    statusSchedulerMutation.mutate({
      customerId: parseInt(id || "0"),
      requestType: "status_change",
      description: `Change status to "${scheduledStatus}" on ${scheduledDate}. Reason: ${statusScheduleReason || "N/A"}`,
      effectiveMonth: scheduledDate,
      equipmentType: scheduledStatus,
      priority: "normal",
    });
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { channel: string; subject: string; message: string; category: string }) => {
      if (data.channel === "email") {
        if (!customer?.email) throw new Error("Customer has no email address");
        const res = await apiRequest("POST", "/api/notifications/send-email", {
          to: customer.email, subject: data.subject, body: data.message,
        });
        return res.json();
      } else if (data.channel === "sms") {
        if (!customer?.phone) throw new Error("Customer has no phone number");
        const res = await apiRequest("POST", "/api/notifications/send-sms", {
          to: customer.phone, message: data.message,
        });
        return res.json();
      } else if (data.channel === "whatsapp") {
        if (!customer?.phone && !customer?.phoneNumber) throw new Error("Customer has no phone/mobile number");
        const res = await apiRequest("POST", "/api/notifications/send-sms", {
          to: customer.phoneNumber || customer.phone, message: data.message,
        });
        return res.json();
      } else if (data.channel === "in_app") {
        const res = await apiRequest("POST", "/api/notification-dispatches", {
          channel: "in_app", recipient: customer?.email || customer?.customerId,
          subject: data.subject, body: data.message, status: "sent",
          createdAt: new Date().toISOString(),
        });
        return res.json();
      }
    },
    onSuccess: (_, vars) => {
      toast({ title: "Sent Successfully", description: `${vars.channel === "email" ? "Email" : vars.channel === "sms" ? "SMS" : vars.channel === "whatsapp" ? "WhatsApp" : "In-App Notification"} sent to ${customer?.fullName}` });
      setSendMessageOpen(false);
      setMessageSubject("");
      setMessageBody("");
      setMessageChannel("email");
      setMessageCategory("bill_reminder");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to Send", description: error.message, variant: "destructive" });
    },
  });

  const handleCategoryChange = (value: string) => {
    setMessageCategory(value);
    const cat = smsCategories.find(c => c.value === value);
    if (cat && customer) {
      setMessageBody(cat.defaultMsg.replace("{name}", customer.fullName));
      if (value === "invoice_softcopy") setMessageSubject("Invoice Copy");
      else if (value === "bill_reminder") setMessageSubject("Bill Reminder");
      else if (value === "account_suspend") setMessageSubject("Account Suspension Notice");
      else if (value === "payment_confirmation") setMessageSubject("Payment Confirmation");
      else setMessageSubject("");
    }
  };

  const openSendMessageDialog = () => {
    setMessageChannel("sms");
    setMessageCategory("bill_reminder");
    const cat = smsCategories.find(c => c.value === "bill_reminder");
    setMessageBody(cat?.defaultMsg.replace("{name}", customer?.fullName || "") || "");
    setMessageSubject("");
    setSendMessageOpen(true);
  };


  const statusUpdateMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PATCH", `/api/customers/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const notesMutation = useMutation({
    mutationFn: async (notesValue: string) => {
      const res = await apiRequest("PATCH", `/api/customers/${id}`, { notes: notesValue });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", id] });
      setNotesEditing(false);
      toast({ title: "Notes saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const gpsMutation = useMutation({
    mutationFn: async ({ lat, lng }: { lat: string; lng: string }) => {
      const res = await apiRequest("PATCH", `/api/customers/${id}`, {
        mapLatitude: lat,
        mapLongitude: lng,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", id] });
      toast({ title: "GPS coordinates saved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error saving GPS", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "GPS_COORDS_PICKED") {
        setGpsLat(e.data.lat);
        setGpsLng(e.data.lng);
        setMapPickerOpen(false);
        toast({ title: "Location selected", description: `Lat: ${e.data.lat}, Lng: ${e.data.lng}` });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", description: "Your browser does not support GPS.", variant: "destructive" });
      return;
    }
    setGpsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLat(String(pos.coords.latitude));
        setGpsLng(String(pos.coords.longitude));
        setGpsLocating(false);
        toast({ title: "Location detected", description: `Lat: ${pos.coords.latitude.toFixed(6)}, Lng: ${pos.coords.longitude.toFixed(6)}` });
      },
      (err) => {
        setGpsLocating(false);
        toast({ title: "GPS error", description: err.message, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Sync GPS fields when customer data loads
  const customerGpsLat = (customer as any)?.mapLatitude || "";
  const customerGpsLng = (customer as any)?.mapLongitude || "";

  const connectionForm = useForm<InsertCustomerConnection>({
    resolver: zodResolver(insertCustomerConnectionSchema),
    defaultValues: {
      customerId: parseInt(id || "0"),
      username: "",
      ipAddress: "",
      macAddress: "",
      onuSerial: "",
      routerModel: "",
      routerSerial: "",
      connectionType: "fiber",
      port: "",
      vlan: "",
      installDate: "",
      status: "active",
    },
  });

  const createConnectionMutation = useMutation({
    mutationFn: async (data: InsertCustomerConnection) => {
      const res = await apiRequest("POST", "/api/customer-connections", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", id, "connections"] });
      setConnectionDialogOpen(false);
      setEditingConnection(null);
      connectionForm.reset({ customerId: parseInt(id || "0"), connectionType: "fiber", status: "active" });
      toast({ title: "Connection added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateConnectionMutation = useMutation({
    mutationFn: async ({ connId, data }: { connId: number; data: Partial<InsertCustomerConnection> }) => {
      const res = await apiRequest("PATCH", `/api/customer-connections/${connId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", id, "connections"] });
      setConnectionDialogOpen(false);
      setEditingConnection(null);
      connectionForm.reset({ customerId: parseInt(id || "0"), connectionType: "fiber", status: "active" });
      toast({ title: "Connection updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: async (connId: number) => {
      await apiRequest("DELETE", `/api/customer-connections/${connId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", id, "connections"] });
      toast({ title: "Connection deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openAddConnection = () => {
    setEditingConnection(null);
    connectionForm.reset({
      customerId: parseInt(id || "0"),
      username: "",
      ipAddress: "",
      macAddress: "",
      onuSerial: "",
      routerModel: "",
      routerSerial: "",
      connectionType: "fiber",
      port: "",
      vlan: "",
      installDate: "",
      status: "active",
    });
    setConnectionDialogOpen(true);
  };

  const openEditConnection = (conn: CustomerConnection) => {
    setEditingConnection(conn);
    connectionForm.reset({
      customerId: conn.customerId,
      username: conn.username || "",
      ipAddress: conn.ipAddress || "",
      macAddress: conn.macAddress || "",
      onuSerial: conn.onuSerial || "",
      routerModel: conn.routerModel || "",
      routerSerial: conn.routerSerial || "",
      connectionType: conn.connectionType || "fiber",
      port: conn.port || "",
      vlan: conn.vlan || "",
      installDate: conn.installDate || "",
      status: conn.status,
    });
    setConnectionDialogOpen(true);
  };

  const onConnectionSubmit = (data: InsertCustomerConnection) => {
    if (editingConnection) {
      updateConnectionMutation.mutate({ connId: editingConnection.id, data });
    } else {
      createConnectionMutation.mutate({ ...data, customerId: parseInt(id || "0") });
    }
  };

  const customerPackage = packages?.find((p) => p.id === customer?.packageId);
  const customerVendor = vendors?.find((v) => v.id === customer?.vendorId);

  const handleDownloadInfo = () => {
    if (!customer) return;
    const fmtD = (d: string | null | undefined) => {
      if (!d) return "-";
      try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }
    };
    const pkg = customerPackage;
    const vendor = customerVendor;
    const conns = connections || [];
    const section = (title: string, rows: [string, string][]) => {
      return `<div class="section"><div class="section-title">${title}</div><table>${rows.map(([k, v]) => `<tr><td class="label">${k}</td><td class="value">${v || "-"}</td></tr>`).join("")}</table></div>`;
    };
    const personalRows: [string, string][] = [
      ["Customer ID", customer.customerId],
      ["Full Name", customer.fullName],
      ["Father's Name", customer.fatherName || "-"],
      ["Mother's Name", customer.motherName || "-"],
      ["Gender", customer.gender || "-"],
      ["Date of Birth", fmtD(customer.dateOfBirth)],
      ["Occupation", customer.occupation || "-"],
      ["Phone", customer.phone],
      ["Phone (Secondary)", customer.phoneNumber || "-"],
      ["Email", customer.email || "-"],
      ["Present Address", customer.presentAddress || customer.address || "-"],
      ["Permanent Address", customer.permanentAddress || "-"],
      ["District", customer.district || "-"],
      ["Upazila / Thana", customer.upazilaThana || "-"],
      ["Area / Zone", customer.area || customer.zone || "-"],
      ["Road Number", customer.roadNumber || "-"],
      ["House Number", customer.houseNumber || "-"],
      ["Facebook", customer.facebookUrl || "-"],
      ["LinkedIn", customer.linkedinUrl || "-"],
      ["Twitter", customer.twitterUrl || "-"],
      ["VIP Client", customer.isVipClient ? "Yes" : "No"],
      ["Joining Date", fmtD(customer.joiningDate)],
      ["Reference By", customer.referenceBy || "-"],
      ["Connected By", customer.connectedBy || "-"],
      ["Assign To", customer.assignTo || "-"],
      ["Notes", customer.notes || "-"],
    ];
    const docRows: [string, string][] = [
      ["NID Number", customer.nidNumber || "-"],
      ["CNIC", customer.cnic || "-"],
      ["Registration Form No", customer.registrationFormNo || "-"],
      ["Profile Picture", customer.profilePicture ? "Uploaded" : "Not Uploaded"],
      ["NID Picture", customer.nidPicture ? "Uploaded" : "Not Uploaded"],
      ["Registration Form", customer.registrationFormPicture ? "Uploaded" : "Not Uploaded"],
    ];
    const serviceRows: [string, string][] = [
      ["Customer Type", (customer.customerType || "-").replace(/_/g, " ")],
      ["Package", pkg?.name || "-"],
      ["Monthly Bill", customer.monthlyBill ? `৳ ${customer.monthlyBill}` : "-"],
      ["Status", customer.status],
      ["Billing Status", customer.billingStatus || "-"],
      ["Recurring Billing", customer.isRecurring ? "Yes" : "No"],
      ["Recurring Day", customer.recurringDay?.toString() || "-"],
      ["Billing Start Month", customer.billingStartMonth || "-"],
      ["Next Billing Date", fmtD(customer.nextBillingDate)],
      ["Last Billed Date", fmtD(customer.lastBilledDate)],
      ["Connection Date", fmtD(customer.connectionDate)],
      ["Expire Date", fmtD(customer.expireDate)],
      ["Vendor", vendor?.name || "-"],
      ["Purchase Date", fmtD(customer.purchaseDate)],
      ["Affiliator", customer.affiliator || "-"],
    ];
    const networkRows: [string, string][] = [
      ["Server", customer.server || "-"],
      ["Protocol Type", customer.protocolType || "-"],
      ["Username / IP", customer.usernameIp || "-"],
      ["Password", customer.password || "-"],
      ["Profile", customer.profile || "-"],
      ["Zone", customer.zone || "-"],
      ["Sub Zone", customer.subzone || "-"],
      ["Box", customer.box || "-"],
      ["Connection Type", customer.connectionType || "-"],
      ["Cable Requirement", customer.cableRequirement || "-"],
      ["Fiber Code", customer.fiberCode || "-"],
      ["Number of Core", customer.numberOfCore || "-"],
      ["Core Color", customer.coreColor || "-"],
      ["Device", customer.device || "-"],
      ["Device MAC/Serial", customer.deviceMacSerial || "-"],
      ["MAC Address", customer.macAddress || "-"],
      ["Map Latitude", customer.mapLatitude || "-"],
      ["Map Longitude", customer.mapLongitude || "-"],
    ];
    let connectionsHtml = "";
    if (conns.length > 0) {
      connectionsHtml = `<div class="section"><div class="section-title">Connection Details (${conns.length})</div><table>
        <tr class="header-row"><td class="label"><b>Username</b></td><td class="label"><b>IP Address</b></td><td class="label"><b>MAC</b></td><td class="label"><b>ONU Serial</b></td><td class="label"><b>Router</b></td><td class="label"><b>Type</b></td><td class="label"><b>Port</b></td><td class="label"><b>VLAN</b></td><td class="label"><b>Status</b></td></tr>
        ${conns.map(c => `<tr><td class="value">${c.username || "-"}</td><td class="value">${c.ipAddress || "-"}</td><td class="value">${c.macAddress || "-"}</td><td class="value">${c.onuSerial || "-"}</td><td class="value">${c.routerModel || "-"} ${c.routerSerial ? `(${c.routerSerial})` : ""}</td><td class="value">${c.connectionType || "-"}</td><td class="value">${c.port || "-"}</td><td class="value">${c.vlan || "-"}</td><td class="value">${c.status}</td></tr>`).join("")}
      </table></div>`;
    }
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Customer Info - ${customer.fullName}</title><style>
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { margin: 15mm; } }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 20px; font-size: 12px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0057FF; padding-bottom: 12px; margin-bottom: 20px; }
      .header h1 { font-size: 20px; color: #0057FF; }
      .header .meta { text-align: right; font-size: 11px; color: #555; }
      .header .meta span { display: block; }
      .section { margin-bottom: 16px; break-inside: avoid; }
      .section-title { background: #0a2540; color: #fff; padding: 7px 14px; font-size: 13px; font-weight: 600; border-radius: 4px 4px 0 0; }
      table { width: 100%; border-collapse: collapse; border: 1px solid #ddd; border-top: none; }
      tr:nth-child(even) { background: #f7f9fc; }
      td { padding: 5px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
      .label { color: #555; font-weight: 500; width: 180px; white-space: nowrap; }
      .value { color: #1a1a1a; }
      .header-row td { background: #e8edf3; font-size: 11px; }
      .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; text-align: center; font-size: 10px; color: #888; }
    </style></head><body>
      <div class="header">
        <div><h1>Customer Information Report</h1><p style="margin-top:4px;font-size:11px;color:#666;">${customer.fullName} — ${customer.customerId}</p></div>
        <div class="meta"><span>Generated: ${new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span><span>Status: ${customer.status}</span></div>
      </div>
      ${section("Personal Information", personalRows)}
      ${section("Documents", docRows)}
      ${section("Service Information", serviceRows)}
      ${section("Network & Infrastructure", networkRows)}
      ${connectionsHtml}
      <div class="footer">NetSphere ISP Management System — Confidential Customer Record</div>
      <script>window.onload=function(){window.print();}</script>
    </body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.onafterprint = () => { win.close(); URL.revokeObjectURL(url); };
    }
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return d;
    }
  };

  const tabs = [
    { key: "personal", label: "Personal Information" },
    { key: "documents", label: "Documents" },
    { key: "service", label: "Service Information" },
    { key: "network", label: "Network & Infrastructure" },
    { key: "service_scheduler", label: "Service Scheduler" },
    { key: "pkg_history", label: "Package Upgrade & Downgrade History" },
    { key: "changelog", label: "Customer Change Log" },
    { key: "enablelog", label: "Customer Enable/Disable Log" },
    { key: "sales", label: "Product & Service Sales Invoices" },
    { key: "invoices", label: "Generated & Updated Bill/Invoices" },
    { key: "received", label: "Received Bill History" },
    { key: "remarks", label: "Remarks History" },
    { key: "complain", label: "Support & Ticket History" },
    { key: "messages", label: "Email/Message History" },
    { key: "referrals", label: "Referrals" },
  ];

  if (customerLoading) {
    return (
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-6">
          <Skeleton className="h-[500px] w-[280px] shrink-0" />
          <Skeleton className="h-[500px] flex-1" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        <Link href="/customers">
          <Button variant="ghost" data-testid="button-back-customers">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Customers
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">Customer not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-[#0057FF]" />
          <h1 className="text-lg font-bold" data-testid="text-page-title">Profile</h1>
          <span className="text-xs text-muted-foreground">Client Profile</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="breadcrumb">
          <Link href="/customers" className="text-[#0057FF]">Client</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/customers?tab=list" className="text-[#0057FF]">Client list</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Profile</span>
        </div>
      </div>

      <div className="flex gap-0 min-h-[calc(100vh-120px)]">
        <div className="w-[280px] shrink-0 border-r bg-gradient-to-b from-[#1a2332] to-[#243447] text-white">
          <div className="flex flex-col items-center pt-6 pb-4 px-4">
            <div className="w-28 h-28 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center mb-3" data-testid="customer-avatar">
              {customer.profilePicture ? (
                <img src={customer.profilePicture} alt={customer.fullName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="h-14 w-14 text-white/50" />
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
              <Mail className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
              <Phone className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
            </div>
            <h2 className="text-lg font-bold text-center" data-testid="text-customer-name">{customer.fullName}</h2>
            <p className="text-xs opacity-70 capitalize" data-testid="text-customer-type">{customer.customerType}</p>
          </div>

          <div className="px-4 space-y-2.5 text-xs border-t border-white/10 pt-4">
            <ProfileSidebarItem icon={Hash} label="Client Code" value={customer.customerId} testId="sidebar-client-code" />
            <ProfileSidebarItem icon={User} label="Client ID/IP" value={customer.usernameIp || customer.fullName} testId="sidebar-client-id" />
            <ProfileSidebarItem icon={CreditCard} label="Billing Status" value={customer.billingStatus || "Inactive"} testId="sidebar-billing-status" />
            <div className="flex items-center justify-between py-1.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 opacity-60" />
                <span className="opacity-80">Mikrotik Status</span>
              </div>
              <Switch
                checked={customer.status === "active"}
                onCheckedChange={(checked) => statusUpdateMutation.mutate(checked ? "active" : "inactive")}
                className="scale-75"
                data-testid="switch-mikrotik-status"
              />
            </div>
            <ProfileSidebarItem icon={Calendar} label="Creation Date" value={formatDate(customer.joiningDate || customer.connectionDate)} testId="sidebar-creation-date" />
          </div>

          <div className="px-4 pt-4 pb-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" data-testid="button-update-info" onClick={() => setLocation(`/customers/${id}/edit`)}>
                <Edit className="h-3 w-3" /> Update Information
              </Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" data-testid="button-status-scheduler" onClick={() => setStatusSchedulerOpen(true)}>
                <CalendarRange className="h-3 w-3" /> Status Scheduler
              </Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1" data-testid="button-send-email" onClick={openSendMessageDialog}>
                <MessageCircle className="h-3 w-3" /> Send Email/Message
              </Button>
              <Button size="sm" variant="secondary" className="text-[10px] h-8 gap-1 md:col-span-2" data-testid="button-package-change" onClick={() => setLocation(`/package-change?customerType=Normal&customerId=${id}&customerName=${encodeURIComponent(customer?.fullName || customer?.name || "")}`)}>
                <ArrowUpDown className="h-3 w-3" /> Package Change
              </Button>
            </div>
            <Button size="sm" className="w-full text-xs h-9 gap-1.5 bg-[#0057FF]" data-testid="button-download-info" onClick={handleDownloadInfo}>
              <Download className="h-3.5 w-3.5" /> Download Information
            </Button>
            <Link href="/customers?tab=list">
              <Button size="sm" variant="outline" className="w-full text-xs h-9 gap-1.5 text-white border-white/30" data-testid="button-go-client-list">
                <ArrowLeft className="h-3.5 w-3.5" /> Go To Client List
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex-1 bg-muted/30 overflow-hidden">
          <div className="border-b bg-card">
            <div className="flex flex-wrap px-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-[#0057FF] text-[#0057FF]"
                      : "border-transparent text-muted-foreground"
                  }`}
                  data-testid={`tab-${tab.key}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 overflow-y-auto max-h-[calc(100vh-170px)]">
            {activeTab === "service" && (
              <div className="space-y-5" data-testid="tab-content-service">
                <SectionHeader title="Internet Service Information" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Package" value={customerPackage ? customerPackage.name : "-"} />
                    <InfoRow label="Vendor" value={customerVendor?.name || "-"} />
                    <InfoRow label="Joining Date" value={formatDate(customer.joiningDate)} />
                    <InfoRow label="Expire Date" value={customer.expireDate || "-"} />
                    <InfoRow label="Billing Start Month" value={formatDate(customer.billingStartMonth)} />
                    <InfoRow label="Billing Status" value={customer.billingStatus || "Inactive"} />
                    <InfoRow label="Username / PPPoE / IP" value={customer.usernameIp || "-"} />
                    <InfoRow label="Password" value={
                      <span className="flex items-center gap-1.5">
                        {showPassword ? (customer.password || "Not set") : (customer.password ? "••••••••" : "Not set")}
                        {customer.password && (
                          <button onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground" data-testid="button-toggle-password">
                            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </span>
                    } />
                    <InfoRow label="Client Type" value={customer.customerType} capitalize />
                    <InfoRow label="Profile" value={customer.profile || "-"} />
                    <InfoRow label="Connection Setup By" value={customer.connectedBy || "-"} />
                    <InfoRow label="Assigned To" value={customer.assignTo || "-"} />
                    <InfoRow label="Reference By" value={customer.referenceBy || "-"} />
                    <InfoRow label="Last Log In" value="-" />
                  </div>
                </div>

                <SectionHeader title="Package Billing" />
                {(() => {
                  // Compute tax-inclusive amounts from package rates
                  const base    = parseFloat(String(customerPackage?.price  ?? "0")) || 0;
                  const whtPct  = parseFloat(String(customerPackage?.whTax  ?? "0")) || 0;
                  const aitPct  = parseFloat(String(customerPackage?.aitTax ?? "0")) || 0;
                  const whtAmt  = parseFloat(((base * whtPct) / 100).toFixed(2));
                  const aitAmt  = parseFloat(((base * aitPct) / 100).toFixed(2));
                  const taxInclusiveTotal = base + whtAmt + aitAmt;

                  const savedPkgBill = parseFloat(String(customer.packageBill ?? "0")) || 0;
                  const pkgBill = savedPkgBill > 0 ? savedPkgBill : taxInclusiveTotal;
                  const discount     = parseFloat(String(customer.discountOnPackage ?? "0")) || 0;
                  const finalPkgBill = Math.max(0, pkgBill - discount);

                  const inst  = parseFloat(String(customer.finalInstallationCharges ?? "0")) || 0;

                  const deviceCharges   = parseFloat(String((customer as any).deviceCharges  ?? "0")) || 0;
                  const staticIpEnabled = (customer as any).staticIpEnabled;
                  const staticIpMrc     = parseFloat(String((customer as any).staticIpMrc    ?? "0")) || 0;
                  const instEnabled     = (customer as any).installmentEnabled;
                  const instMonthly     = parseFloat(String((customer as any).installmentMonthlyAmount ?? "0")) || 0;

                  let addlPkgs: { packageId: number; bill: string }[] = [];
                  try { addlPkgs = JSON.parse((customer as any).additionalPackages || "[]"); } catch {}
                  const addlPkgsTotal = addlPkgs.reduce((s, p) => s + (parseFloat(p.bill) || 0), 0);

                  let addlDevices: { deviceType: string; deviceDetail: string; deviceCharges: string }[] = [];
                  try { addlDevices = JSON.parse((customer as any).additionalDevices || "[]"); } catch {}
                  const addlDevicesTotal = addlDevices.reduce((s, d) => s + (parseFloat(d.deviceCharges) || 0), 0);

                  const grand = parseFloat(String(customer.grandTotal ?? "0")) || (finalPkgBill + inst + deviceCharges + (staticIpEnabled ? staticIpMrc : 0) + (instEnabled ? instMonthly : 0) + addlPkgsTotal + addlDevicesTotal);

                  // Build breakdown text
                  const breakdownParts: string[] = [];
                  if (finalPkgBill > 0) breakdownParts.push(`PKR ${finalPkgBill.toFixed(0)} pkg`);
                  if (deviceCharges > 0) breakdownParts.push(`PKR ${deviceCharges.toFixed(0)} device`);
                  if (addlDevicesTotal > 0) breakdownParts.push(`PKR ${addlDevicesTotal.toFixed(0)} addl. devices`);
                  if (inst > 0) breakdownParts.push(`PKR ${inst.toFixed(0)} install`);
                  if (staticIpEnabled && staticIpMrc > 0) breakdownParts.push(`PKR ${staticIpMrc.toFixed(0)} static IP`);
                  if (instEnabled && instMonthly > 0) breakdownParts.push(`PKR ${instMonthly.toFixed(0)} installment`);
                  if (addlPkgsTotal > 0) breakdownParts.push(`PKR ${addlPkgsTotal.toFixed(0)} addl. pkgs`);

                  return (
                    <>
                      <div className="bg-card border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-2 divide-x divide-y">
                          <InfoRow label="Package Base Price" value={base > 0 ? `PKR ${base.toFixed(2)}` : "-"} />
                          <InfoRow label="WHT Tax" value={whtPct > 0 ? `${whtPct}% (PKR ${whtAmt.toFixed(2)})` : "-"} />
                          <InfoRow label="AIT Tax" value={aitPct > 0 ? `${aitPct}% (PKR ${aitAmt.toFixed(2)})` : "-"} />
                          <InfoRow label="Package Bill (incl. Tax)" value={pkgBill > 0 ? `PKR ${pkgBill.toFixed(2)}` : "-"} />
                          <InfoRow label="Discount on Package" value={`PKR ${discount.toFixed(2)}`} />
                          <InfoRow label="Final Package Bill" value={
                            <span className="font-semibold text-green-700 dark:text-green-400">PKR {finalPkgBill.toFixed(2)}</span>
                          } />
                        </div>
                      </div>

                      {/* Primary Device Billing */}
                      {deviceCharges > 0 && (
                        <>
                          <SectionHeader title="Device Billing" />
                          <div className="bg-card border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-2 divide-x divide-y">
                              <InfoRow label="Device Type" value={(customer as any).deviceType || "-"} />
                              <InfoRow label="Device Detail" value={(customer as any).deviceDetail || "-"} />
                              <InfoRow label="Device Charges" value={`PKR ${deviceCharges.toFixed(2)}`} />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Additional Devices Billing */}
                      {addlDevices.length > 0 && (
                        <>
                          <SectionHeader title="Additional Devices Billing" />
                          <div className="bg-card border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-2 divide-x divide-y">
                              {addlDevices.map((d, i) => (
                                <>
                                  <InfoRow key={`adt-${i}`} label={`Device ${i + 1}`} value={`${d.deviceType}${d.deviceDetail ? ` — ${d.deviceDetail}` : ""}`} />
                                  <InfoRow key={`adc-${i}`} label={`Device ${i + 1} Charges`} value={Number(d.deviceCharges) > 0 ? `PKR ${Number(d.deviceCharges).toFixed(2)}` : "-"} />
                                </>
                              ))}
                              <InfoRow label="Additional Devices Total" value={<span className="font-semibold">PKR {addlDevicesTotal.toFixed(2)}</span>} />
                            </div>
                          </div>
                        </>
                      )}

                      <SectionHeader title="Installation Charges" />
                      <div className="bg-card border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-2 divide-x divide-y">
                          <InfoRow label="Installation Charges" value={customer.installationCharges ? `PKR ${Number(customer.installationCharges).toFixed(2)}` : "PKR 0.00"} />
                          <InfoRow label="Discount on Installation" value={customer.discountOnInstallation ? `PKR ${Number(customer.discountOnInstallation).toFixed(2)}` : "PKR 0.00"} />
                          <InfoRow label="Final Installation Charges" value={`PKR ${inst.toFixed(2)}`} />
                          <InfoRow label="Charge Created On" value={formatDate(customer.connectionDate)} />
                          <InfoRow label="Received By" value={customer.connectedBy || "-"} />
                          <InfoRow label="Payment Date" value={formatDate(customer.connectionDate)} />
                        </div>
                      </div>

                      {/* Static IP Add-on */}
                      {staticIpEnabled && (
                        <>
                          <SectionHeader title="Static IP Add-on" />
                          <div className="bg-card border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-2 divide-x divide-y">
                              <InfoRow label="Static IP" value={<span className="text-green-600 font-medium">Enabled</span>} />
                              <InfoRow label="Monthly Recurring Charge" value={`PKR ${staticIpMrc.toFixed(2)}`} />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Installment Plan */}
                      {instEnabled && (
                        <>
                          <SectionHeader title="Installment Plan" />
                          <div className="bg-card border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-2 divide-x divide-y">
                              <InfoRow label="Installment Type" value={(customer as any).installmentType || "-"} />
                              <InfoRow label="Total Amount" value={`PKR ${parseFloat(String((customer as any).installmentTotalAmount ?? "0")).toFixed(2)}`} />
                              <InfoRow label="Total Months" value={String((customer as any).installmentMonths || "-")} />
                              <InfoRow label="Monthly Amount" value={`PKR ${instMonthly.toFixed(2)}`} />
                              <InfoRow label="Months Paid" value={String((customer as any).installmentPaidMonths ?? "0")} />
                              <InfoRow label="Remaining Months" value={String(Math.max(0, ((customer as any).installmentMonths || 0) - ((customer as any).installmentPaidMonths || 0)))} />
                              {(customer as any).installmentNote && (
                                <InfoRow label="Note" value={(customer as any).installmentNote} />
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Additional Packages */}
                      {addlPkgs.length > 0 && (
                        <>
                          <SectionHeader title="Additional Packages" />
                          <div className="bg-card border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-2 divide-x divide-y">
                              {addlPkgs.map((ap, i) => {
                                const pkg = packages?.find(p => p.id === ap.packageId);
                                return (
                                  <>
                                    <InfoRow key={`apn-${i}`} label={`Package ${i + 1}`} value={pkg?.name || `Package #${ap.packageId}`} />
                                    <InfoRow key={`apb-${i}`} label={`Package ${i + 1} Bill`} value={parseFloat(ap.bill) > 0 ? `PKR ${parseFloat(ap.bill).toFixed(2)}` : "-"} />
                                  </>
                                );
                              })}
                              <InfoRow label="Additional Packages Total" value={<span className="font-semibold">PKR {addlPkgsTotal.toFixed(2)}</span>} />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Grand Total Banner */}
                      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between shadow-md" data-testid="grand-total-banner">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center">
                            <Calculator className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">Grand Total (First Payment)</p>
                            <p className="text-[11px] text-blue-200">{breakdownParts.length > 0 ? breakdownParts.join(" + ") : "No billing components"}</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-white" data-testid="text-grand-total">PKR {grand.toFixed(2)}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {activeTab === "network" && (
              <div className="space-y-5" data-testid="tab-content-network">
                <SectionHeader title="Connection & Protocol" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Protocol Type" value={customer.protocolType || "-"} />
                    <InfoRow label="Connection Type" value={customer.connectionType || "-"} capitalize />
                    <InfoRow label="Server" value={customer.server || "-"} />
                    <InfoRow label="Zone" value={customer.zone || "-"} />
                    <InfoRow label="Sub Zone" value={customer.subzone || "-"} />
                    <InfoRow label="Box" value={customer.box || "-"} />
                    <InfoRow label="Cable Requirement (m)" value={customer.cableRequirement || "-"} />
                    <InfoRow label="Fiber Code" value={customer.fiberCode || "-"} />
                    <InfoRow label="Number of Core" value={customer.numberOfCore || "-"} />
                    <InfoRow label="Core Color" value={customer.coreColor || "-"} />
                  </div>
                </div>

                <SectionHeader title="Device Information" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Device Type" value={(customer as any).deviceType || customer.device || "-"} />
                    <InfoRow label="Device Model" value={(customer as any).deviceModel || "-"} />
                    <InfoRow label="Device Detail" value={(customer as any).deviceDetail || "-"} />
                    <InfoRow label="Device Charges" value={(customer as any).deviceCharges && Number((customer as any).deviceCharges) > 0 ? `PKR ${Number((customer as any).deviceCharges).toFixed(2)}` : "-"} />
                    <InfoRow label="Device Serial No" value={customer.deviceMacSerial || "-"} />
                    <InfoRow label="Device MAC Address" value={(customer as any).macAddress || "-"} />
                    <InfoRow label="Device Owned By" value={(customer as any).deviceOwnedBy || "-"} />
                    <InfoRow label="Vendor" value={customerVendor?.name || "-"} />
                    <InfoRow label="Purchase Date" value={formatDate(customer.purchaseDate)} />
                  </div>
                </div>

                {(() => {
                  const raw = (customer as any).additionalDevices;
                  let addlDevices: { deviceType: string; deviceDetail: string; deviceCharges: string }[] = [];
                  try { addlDevices = JSON.parse(raw || "[]"); } catch {}
                  if (!addlDevices.length) return null;
                  return (
                    <>
                      <SectionHeader title="Additional Devices" />
                      <div className="bg-card border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-2 divide-x divide-y">
                          {addlDevices.map((d, i) => (
                            <>
                              <InfoRow key={`type-${i}`} label={`Device ${i + 1} — Type`} value={d.deviceType || "-"} />
                              <InfoRow key={`detail-${i}`} label={`Device ${i + 1} — Detail`} value={d.deviceDetail || "-"} />
                              <InfoRow key={`charge-${i}`} label={`Device ${i + 1} — Charges`} value={Number(d.deviceCharges) > 0 ? `PKR ${Number(d.deviceCharges).toFixed(2)}` : "-"} />
                            </>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}

                {connections && connections.length > 0 && (
                  <>
                    <SectionHeader title="Connection Details" action={
                      <Button size="sm" variant="outline" onClick={openAddConnection} className="text-xs" data-testid="button-add-connection">
                        <Plus className="h-3 w-3 mr-1" /> Add Connection
                      </Button>
                    } />
                    {connections.map((conn) => (
                      <div key={conn.id} className="bg-card border rounded-lg overflow-hidden" data-testid={`card-connection-${conn.id}`}>
                        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={`text-[10px] capitalize ${conn.status === "active" ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>
                              {conn.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground capitalize">{conn.connectionType}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditConnection(conn)} data-testid={`button-edit-connection-${conn.id}`}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteConnectionMutation.mutate(conn.id)} data-testid={`button-delete-connection-${conn.id}`}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-y">
                          <InfoRow label="Username/PPPoE" value={conn.username || "-"} />
                          <InfoRow label="IP Address" value={conn.ipAddress || "-"} />
                          <InfoRow label="MAC Address" value={conn.macAddress || "-"} />
                          <InfoRow label="ONU Serial" value={conn.onuSerial || "-"} />
                          <InfoRow label="Router Model" value={conn.routerModel || "-"} />
                          <InfoRow label="Router Serial" value={conn.routerSerial || "-"} />
                          <InfoRow label="Port" value={conn.port || "-"} />
                          <InfoRow label="VLAN" value={conn.vlan || "-"} />
                          <InfoRow label="Install Date" value={formatDate(conn.installDate)} />
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {(!connections || connections.length === 0) && (
                  <>
                    <SectionHeader title="Connection Details" action={
                      <Button size="sm" variant="outline" onClick={openAddConnection} className="text-xs" data-testid="button-add-connection">
                        <Plus className="h-3 w-3 mr-1" /> Add Connection
                      </Button>
                    } />
                    <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
                      <Network className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">No connections found</p>
                      <p className="text-xs mt-1">Add a connection to get started</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "personal" && (
              <div className="space-y-5" data-testid="tab-content-personal">
                <SectionHeader title="Personal Information" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Full Name" value={customer.fullName} />
                    <InfoRow label="Father Name" value={customer.fatherName || "-"} />
                    <InfoRow label="Gender" value={customer.gender || "-"} capitalize />
                    <InfoRow label="Date of Birth" value={formatDate(customer.dateOfBirth)} />
                    <InfoRow label="CNIC / NID Number" value={customer.cnic || customer.nidNumber || "-"} />
                    <InfoRow label="Mobile Number" value={customer.phone} />
                    <InfoRow label="Email Address" value={customer.email || "-"} />
                    <InfoRow label="Customer Type" value={customer.customerType || "-"} capitalize />
                    <InfoRow label="Occupation" value={customer.occupation || "-"} capitalize />
                    <InfoRow label="Remarks / Notes" value={customer.notes || "-"} />
                  </div>
                </div>

                <SectionHeader title="Area Information" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="Branch" value={(customer as any).branch || "-"} />
                    <InfoRow label="Area" value={customer.area || "-"} />
                    <InfoRow label="City" value={(customer as any).city || "-"} />
                    <InfoRow label="Zone" value={(customer as any).zone || "-"} />
                    <InfoRow label="Subzone" value={(customer as any).subzone || "-"} />
                    <InfoRow label="CNIC Address" value={customer.address || "-"} />
                    <InfoRow label="Current Address" value={customer.presentAddress || "-"} />
                  </div>
                </div>

                <SectionHeader title="GPS Coordinates" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  {/* Editable GPS inputs */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Map Latitude</label>
                        <Input
                          data-testid="input-gps-lat"
                          placeholder={customerGpsLat || "e.g. 31.5204"}
                          value={gpsLat || customerGpsLat}
                          onChange={e => setGpsLat(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Map Longitude</label>
                        <Input
                          data-testid="input-gps-lng"
                          placeholder={customerGpsLng || "e.g. 74.3587"}
                          value={gpsLng || customerGpsLng}
                          onChange={e => setGpsLng(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Action buttons row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        data-testid="button-get-gps"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
                        onClick={handleGetGps}
                        disabled={gpsLocating}
                      >
                        <LocateFixed className={`h-3.5 w-3.5 ${gpsLocating ? "animate-pulse" : ""}`} />
                        {gpsLocating ? "Detecting…" : "Get GPS Location"}
                      </Button>

                      <Button
                        data-testid="button-get-gps-map"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
                        onClick={() => setMapPickerOpen(true)}
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        Get GPS from Map
                      </Button>

                      <Button
                        data-testid="button-save-gps"
                        size="sm"
                        className="h-8 gap-1.5 text-xs bg-[#1c67d4] hover:bg-[#1558b8]"
                        onClick={() => {
                          const lat = gpsLat || customerGpsLat;
                          const lng = gpsLng || customerGpsLng;
                          if (!lat || !lng) {
                            toast({ title: "Enter coordinates", description: "Please fill in both latitude and longitude.", variant: "destructive" });
                            return;
                          }
                          gpsMutation.mutate({ lat, lng });
                        }}
                        disabled={gpsMutation.isPending}
                      >
                        <Save className="h-3.5 w-3.5" />
                        {gpsMutation.isPending ? "Saving…" : "Save Coordinates"}
                      </Button>

                      {(gpsLat || customerGpsLat) && (gpsLng || customerGpsLng) && (
                        <a
                          href={`https://maps.google.com/?q=${gpsLat || customerGpsLat},${gpsLng || customerGpsLng}`}
                          target="_blank"
                          rel="noreferrer"
                          data-testid="link-open-maps"
                        >
                          <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs text-green-700 hover:text-green-800 hover:bg-green-50 dark:text-green-400">
                            <MapPin className="h-3.5 w-3.5" /> Open in Google Maps
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Current saved coordinates display */}
                  {(customerGpsLat || customerGpsLng) && (
                    <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Saved:</span>
                      <span className="text-[11px] font-mono text-foreground">{customerGpsLat}, {customerGpsLng}</span>
                    </div>
                  )}
                </div>

                {mapPickerOpen && (
                  <Dialog open={mapPickerOpen} onOpenChange={setMapPickerOpen}>
                    <DialogContent className="max-w-3xl h-[600px] flex flex-col p-0">
                      <div className="px-6 pt-6 pb-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-green-600" />
                          Pick Location from Map
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">Click on the map to select GPS coordinates</p>
                      </div>
                      <div className="flex-1 px-6">
                        <iframe
                          data-testid="iframe-map-picker"
                          className="w-full h-full rounded-lg border"
                          style={{ minHeight: "400px" }}
                          srcDoc={`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
  body { margin: 0; padding: 0; }
  #map { width: 100%; height: 100vh; }
  .coords-box {
    position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
    z-index: 1000; background: white; padding: 8px 16px; border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2); font-family: system-ui; font-size: 13px;
    display: flex; align-items: center; gap: 12px;
  }
  .coords-box button {
    background: #1c67d4; color: white; border: none; padding: 6px 14px;
    border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;
  }
  .coords-box button:hover { background: #1558b8; }
</style>
</head>
<body>
<div id="map"></div>
<div class="coords-box" id="coordsBox" style="display:none;">
  <span id="coordsText"></span>
  <button onclick="confirmCoords()">Use This Location</button>
</div>
<script>
  var initLat = ${(gpsLat || customerGpsLat) ? parseFloat(gpsLat || customerGpsLat) || 31.5204 : 31.5204};
  var initLng = ${(gpsLng || customerGpsLng) ? parseFloat(gpsLng || customerGpsLng) || 74.3587 : 74.3587};
  var initZoom = ${(gpsLat || customerGpsLat) ? 15 : 6};
  var map = L.map('map').setView([initLat, initLng], initZoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);
  var marker = null;
  var selectedLat = null, selectedLng = null;
  ${(gpsLat || customerGpsLat) ? `marker = L.marker([initLat, initLng]).addTo(map); selectedLat = initLat; selectedLng = initLng; document.getElementById('coordsBox').style.display = 'flex'; document.getElementById('coordsText').textContent = 'Lat: ' + initLat.toFixed(6) + ', Lng: ' + initLng.toFixed(6);` : ''}
  map.on('click', function(e) {
    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;
    if (marker) map.removeLayer(marker);
    marker = L.marker([selectedLat, selectedLng]).addTo(map);
    document.getElementById('coordsBox').style.display = 'flex';
    document.getElementById('coordsText').textContent = 'Lat: ' + selectedLat.toFixed(6) + ', Lng: ' + selectedLng.toFixed(6);
  });
  function confirmCoords() {
    if (selectedLat !== null && selectedLng !== null) {
      window.parent.postMessage({ type: 'GPS_COORDS_PICKED', lat: selectedLat.toFixed(6), lng: selectedLng.toFixed(6) }, '*');
    }
  }
<\/script>
</body>
</html>`}
                        />
                      </div>
                      <div className="px-6 py-3 border-t flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => setMapPickerOpen(false)} data-testid="button-close-map">
                          Close
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-5" data-testid="tab-content-documents">
                <SectionHeader title="Customer Documents" />
                {(() => {
                  const cnicFront = customer.nidPicture;
                  const cnicBack  = (customer as any).cnicBackPicture;
                  const regForm   = customer.registrationFormPicture;
                  const docs = [
                    { label: "CNIC Front", url: cnicFront },
                    { label: "CNIC Back",  url: cnicBack  },
                    { label: "Registration Form", url: regForm },
                  ].filter(d => d.url);

                  if (docs.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                        <FileText className="h-12 w-12 opacity-30" />
                        <p className="text-sm">No documents uploaded for this customer.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {docs.map(doc => (
                        <div key={doc.label} className="border rounded-xl overflow-hidden shadow-sm" data-testid={`card-doc-${doc.label.replace(/\s+/g, "-").toLowerCase()}`}>
                          <div className="bg-muted/40 px-4 py-2.5 flex items-center justify-between border-b">
                            <span className="text-sm font-semibold">{doc.label}</span>
                            <a href={doc.url!} target="_blank" rel="noreferrer">
                              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                                <Download className="h-3.5 w-3.5" /> View
                              </Button>
                            </a>
                          </div>
                          <div className="bg-card flex items-center justify-center p-3 min-h-[200px]">
                            <img
                              src={doc.url!}
                              alt={doc.label}
                              className="max-h-52 object-contain rounded"
                              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <SectionHeader title="Document References" />
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-y">
                    <InfoRow label="CNIC / NID Number" value={customer.nidNumber || "-"} />
                    <InfoRow label="Registration Form No" value={customer.registrationFormNo || "-"} />
                    <InfoRow label="CNIC Front" value={customer.nidPicture ? "Uploaded" : "Not uploaded"} />
                    <InfoRow label="CNIC Back" value={(customer as any).cnicBackPicture ? "Uploaded" : "Not uploaded"} />
                    <InfoRow label="Registration Form" value={customer.registrationFormPicture ? "Uploaded" : "Not uploaded"} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "invoices" && (
              <div className="space-y-5" data-testid="tab-content-invoices">
                <SectionHeader title="Generated & Updated Bill/Invoices" />
                {invoicesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : !invoices?.length ? (
                  <EmptyState icon={FileText} message="No invoices found" />
                ) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#1a3a5c] border-[#1a3a5c]">
                          <TableHead className="text-white text-xs font-semibold">Invoice #</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Amount</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Tax</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Total</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Status</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Issue Date</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Due Date</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Paid Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((inv) => (
                          <TableRow key={inv.id} data-testid={`row-invoice-${inv.id}`}>
                            <TableCell className="text-xs font-mono">{inv.invoiceNumber}</TableCell>
                            <TableCell className="text-xs">{Number(inv.amount).toFixed(2)}</TableCell>
                            <TableCell className="text-xs">{Number(inv.tax || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-xs font-semibold">{Number(inv.totalAmount).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${
                                inv.status === "paid" ? "text-green-700 bg-green-50" :
                                inv.status === "overdue" ? "text-red-600 bg-red-50" :
                                "text-amber-600 bg-amber-50"
                              }`}>{inv.status}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">{formatDate(inv.issueDate)}</TableCell>
                            <TableCell className="text-xs">{formatDate(inv.dueDate)}</TableCell>
                            <TableCell className="text-xs">{inv.paidDate ? formatDate(inv.paidDate) : "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "received" && (
              <div className="space-y-5" data-testid="tab-content-received">
                <SectionHeader title="Received Bill History" />
                {!invoices?.filter(i => i.status === "paid").length ? (
                  <EmptyState icon={CreditCard} message="No received bill history" />
                ) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#1a3a5c] border-[#1a3a5c]">
                          <TableHead className="text-white text-xs font-semibold">Invoice #</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Amount Paid</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Payment Date</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices?.filter(i => i.status === "paid").map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell className="text-xs font-mono">{inv.invoiceNumber}</TableCell>
                            <TableCell className="text-xs">{Number(inv.totalAmount).toFixed(2)}</TableCell>
                            <TableCell className="text-xs">{formatDate(inv.paidDate)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px] text-green-700 bg-green-50">Paid</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "complain" && (
              <div className="space-y-5" data-testid="tab-content-complain">
                <SectionHeader title="Support & Ticket History" />
                {ticketsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : !tickets?.length ? (
                  <EmptyState icon={AlertCircle} message="No complaints found" />
                ) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#1a3a5c] border-[#1a3a5c]">
                          <TableHead className="text-white text-xs font-semibold">Ticket #</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Subject</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Priority</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Status</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Category</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tickets.map((ticket) => (
                          <TableRow key={ticket.id} data-testid={`row-ticket-${ticket.id}`}>
                            <TableCell className="text-xs font-mono">{ticket.ticketNumber}</TableCell>
                            <TableCell className="text-xs">{ticket.subject}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${
                                ticket.priority === "critical" ? "text-red-600 bg-red-50" :
                                ticket.priority === "high" ? "text-orange-600 bg-orange-50" :
                                ticket.priority === "medium" ? "text-amber-600 bg-amber-50" :
                                "text-blue-600 bg-blue-50"
                              }`}>{ticket.priority}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${
                                ticket.status === "resolved" || ticket.status === "closed" ? "text-green-700 bg-green-50" :
                                ticket.status === "in_progress" ? "text-amber-600 bg-amber-50" :
                                "text-blue-600 bg-blue-50"
                              }`}>{ticket.status.replace("_", " ")}</Badge>
                            </TableCell>
                            <TableCell className="text-xs capitalize">{ticket.category}</TableCell>
                            <TableCell className="text-xs">{formatDate(ticket.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "remarks" && (
              <div className="space-y-5" data-testid="tab-content-remarks">
                <SectionHeader title="Remarks History" action={
                  notesEditing ? (
                    <Button size="sm" onClick={() => notesMutation.mutate(notes)} disabled={notesMutation.isPending} className="text-xs" data-testid="button-save-notes">
                      <Save className="h-3 w-3 mr-1" /> {notesMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setNotes(customer.notes || ""); setNotesEditing(true); }} className="text-xs" data-testid="button-edit-notes">
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                  )
                } />
                <div className="bg-card border rounded-lg p-4">
                  {notesEditing ? (
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add remarks about this customer..."
                      className="min-h-[200px]"
                      data-testid="textarea-notes"
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap" data-testid="text-notes">
                      {customer.notes || "No remarks added yet."}
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "messages" && (
              <div className="space-y-5" data-testid="tab-content-messages">
                <SectionHeader title="Email/Message History" />
                {messageHistoryLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : !messageHistory?.length ? (
                  <EmptyState icon={MessageCircle} message="No email or message history found for this customer" />
                ) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#1a3a5c] border-[#1a3a5c]">
                          <TableHead className="text-white text-xs font-semibold">Date</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Channel</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Recipient</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Subject</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Status</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Source</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {messageHistory.map((msg: any, idx: number) => (
                          <TableRow key={msg.id} data-testid={`row-message-${msg.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                            <TableCell className="text-xs">{formatDate(msg.sentAt)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${
                                msg.channel === "email" ? "text-blue-700 bg-blue-50" : "text-purple-700 bg-purple-50"
                              }`}>
                                {msg.channel === "email" ? "Email" : "SMS"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{msg.recipient}</TableCell>
                            <TableCell className="text-xs max-w-[250px] truncate">{msg.subject || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${
                                msg.status === "sent" || msg.status === "delivered" ? "text-green-700 bg-green-50" :
                                msg.status === "failed" ? "text-red-600 bg-red-50" :
                                "text-amber-600 bg-amber-50"
                              }`}>{msg.status}</Badge>
                            </TableCell>
                            <TableCell className="text-xs capitalize">{msg.source === "notification" ? "Notification" : "Message Log"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "changelog" && (
              <div className="space-y-5" data-testid="tab-content-changelog">
                <SectionHeader title="Customer Change Log" />
                {auditLogsLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : !auditLogs?.length ? (
                  <EmptyState icon={Clock} message="No change log entries found for this customer" />
                ) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#1a3a5c] border-[#1a3a5c]">
                          <TableHead className="text-white text-xs font-semibold">Date & Time</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Action</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Module</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Description</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Reason</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Changed By</TableHead>
                          <TableHead className="text-white text-xs font-semibold">IP Address</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map((log: any, idx: number) => {
                          const reasonMatch = log.description?.match(/Reason:\s*(.+)/i);
                          const reason = reasonMatch ? reasonMatch[1].trim() : "-";
                          const descCleaned = log.description?.replace(/\.\s*Reason:\s*.+/i, "") || log.description;
                          return (
                          <TableRow key={log.id} data-testid={`row-audit-${log.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                            <TableCell className="text-xs">{formatDate(log.createdAt)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${
                                log.action?.includes("create") ? "text-green-700 bg-green-50" :
                                log.action?.includes("delete") ? "text-red-600 bg-red-50" :
                                log.action?.includes("update") ? "text-blue-600 bg-blue-50" :
                                "text-gray-600 bg-gray-50"
                              }`}>{log.action}</Badge>
                            </TableCell>
                            <TableCell className="text-xs capitalize">{log.module}</TableCell>
                            <TableCell className="text-xs max-w-[250px] truncate">{descCleaned}</TableCell>
                            <TableCell className="text-xs max-w-[180px]">
                              {reason !== "-" ? (
                                <Badge variant="outline" className="text-[10px] font-normal">{reason}</Badge>
                              ) : "-"}
                            </TableCell>
                            <TableCell className="text-xs">{log.userName || "System"}</TableCell>
                            <TableCell className="text-xs font-mono">{log.ipAddress || "-"}</TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "enablelog" && (
              <div className="space-y-5" data-testid="tab-content-enablelog">
                <SectionHeader title="Customer Enable/Disable Log" />
                {enableDisableLogsLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : !enableDisableLogs?.length ? (
                  <EmptyState icon={RefreshCw} message="No enable/disable log entries found for this customer" />
                ) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#1a3a5c] border-[#1a3a5c]">
                          <TableHead className="text-white text-xs font-semibold">Date & Time</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Action</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Description</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Changed By</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Old Values</TableHead>
                          <TableHead className="text-white text-xs font-semibold">New Values</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enableDisableLogs.map((log: any, idx: number) => {
                          let oldStatus = "-";
                          let newStatus = "-";
                          try {
                            if (log.oldValues) { const parsed = JSON.parse(log.oldValues); oldStatus = parsed.status || "-"; }
                          } catch {}
                          try {
                            if (log.newValues) { const parsed = JSON.parse(log.newValues); newStatus = parsed.status || "-"; }
                          } catch {}
                          return (
                            <TableRow key={log.id} data-testid={`row-enablelog-${log.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                              <TableCell className="text-xs">{formatDate(log.createdAt)}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={`text-[10px] capitalize ${
                                  log.action?.includes("enable") || log.action?.includes("activate") ? "text-green-700 bg-green-50" :
                                  log.action?.includes("disable") || log.action?.includes("suspend") ? "text-red-600 bg-red-50" :
                                  "text-amber-600 bg-amber-50"
                                }`}>{log.action}</Badge>
                              </TableCell>
                              <TableCell className="text-xs max-w-[250px] truncate">{log.description}</TableCell>
                              <TableCell className="text-xs">{log.userName || "System"}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px] capitalize">{oldStatus}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={`text-[10px] capitalize ${
                                  newStatus === "active" ? "text-green-700 bg-green-50" :
                                  newStatus === "suspended" ? "text-red-600 bg-red-50" :
                                  newStatus === "inactive" ? "text-gray-600 bg-gray-50" :
                                  "text-amber-600 bg-amber-50"
                                }`}>{newStatus}</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "sales" && (
              <div className="space-y-5" data-testid="tab-content-sales">
                <SectionHeader title="Product & Service Sales Invoices" />
                {invoicesLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : (() => {
                  const salesInvoices = invoices?.filter(inv =>
                    inv.invoiceType === "product_sale" || inv.invoiceType === "one_time" ||
                    inv.invoiceType === "service_sale" || inv.invoiceType === "equipment"
                  ) || [];
                  return !salesInvoices.length ? (
                    <EmptyState icon={FileText} message="No product & service sales invoices found" />
                  ) : (
                    <div className="bg-card border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-[#1a3a5c] border-[#1a3a5c]">
                            <TableHead className="text-white text-xs font-semibold">Invoice #</TableHead>
                            <TableHead className="text-white text-xs font-semibold">Type</TableHead>
                            <TableHead className="text-white text-xs font-semibold">Amount</TableHead>
                            <TableHead className="text-white text-xs font-semibold">Tax</TableHead>
                            <TableHead className="text-white text-xs font-semibold">Total</TableHead>
                            <TableHead className="text-white text-xs font-semibold">Status</TableHead>
                            <TableHead className="text-white text-xs font-semibold">Issue Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salesInvoices.map((inv, idx) => (
                            <TableRow key={inv.id} data-testid={`row-sales-${inv.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                              <TableCell className="text-xs font-mono">{inv.invoiceNumber}</TableCell>
                              <TableCell className="text-xs capitalize">{(inv.invoiceType || "sale").replace("_", " ")}</TableCell>
                              <TableCell className="text-xs">{Number(inv.amount).toFixed(2)}</TableCell>
                              <TableCell className="text-xs">{Number(inv.tax || 0).toFixed(2)}</TableCell>
                              <TableCell className="text-xs font-semibold">{Number(inv.totalAmount).toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={`text-[10px] capitalize ${
                                  inv.status === "paid" ? "text-green-700 bg-green-50" :
                                  inv.status === "overdue" ? "text-red-600 bg-red-50" :
                                  "text-amber-600 bg-amber-50"
                                }`}>{inv.status}</Badge>
                              </TableCell>
                              <TableCell className="text-xs">{formatDate(inv.issueDate)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === "referrals" && (
              <div className="space-y-5" data-testid="tab-content-referrals">
                <SectionHeader title="Referred Client Requests" />
                {referralsLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : !referrals?.length ? (
                  <EmptyState icon={User} message="No referred client requests found" />
                ) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#1a3a5c] border-[#1a3a5c]">
                          <TableHead className="text-white text-xs font-semibold">Request ID</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Name</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Phone</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Area</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Service Type</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Status</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Request Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referrals.map((r: any, idx: number) => (
                          <TableRow key={r.id} data-testid={`row-referral-${r.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                            <TableCell className="text-xs font-mono">
                              <a href={`/client-requests/${r.id}`} className="text-blue-600 hover:underline" data-testid={`link-referral-${r.id}`}>{r.queryId || `#${r.id}`}</a>
                            </TableCell>
                            <TableCell className="text-xs font-medium">{r.name}</TableCell>
                            <TableCell className="text-xs">{r.phone || "—"}</TableCell>
                            <TableCell className="text-xs">{r.area || "—"}</TableCell>
                            <TableCell className="text-xs capitalize">{r.serviceType || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${
                                r.status === "approved" ? "text-blue-700 bg-blue-50" :
                                r.status === "completed" ? "text-green-700 bg-green-50" :
                                r.status === "converted" ? "text-purple-700 bg-purple-50" :
                                r.status === "rejected" ? "text-red-600 bg-red-50" :
                                "text-amber-600 bg-amber-50"
                              }`}>{r.status || "pending"}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">{r.requestDate || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
            {activeTab === "service_scheduler" && (
              <div className="space-y-5" data-testid="tab-content-service-scheduler">
                <SectionHeader title="Service Scheduler" action={
                  <Button size="sm" className="gap-1.5 bg-[#0057FF]" onClick={() => setServiceSchedulerOpen(true)} data-testid="button-new-service-request">
                    <Plus className="h-3.5 w-3.5" /> New Service Request
                  </Button>
                } />

                {serviceRequestsLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                ) : !serviceRequests?.length ? (
                  <EmptyState icon={CalendarRange} message="No service requests yet. Click 'New Service Request' to create one." />
                ) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#1a3a5c] border-[#1a3a5c]">
                          <TableHead className="text-white text-xs font-semibold">ID</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Request Type</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Details</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Effective</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Priority</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Status</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Date</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serviceRequests.map((req, idx) => {
                          const reqPkg = packages?.find(p => p.id === req.requestedPackageId);
                          const curPkg = packages?.find(p => p.id === req.currentPackageId);
                          const typeLabels: Record<string, string> = {
                            package_upgrade: "Package Upgrade",
                            package_downgrade: "Package Downgrade",
                            equipment_new: "New Equipment",
                            equipment_replace: "Equipment Replacement",
                            status_change: "Status Change",
                            other: "Other Service Request",
                          };
                          return (
                            <TableRow key={req.id} data-testid={`row-service-request-${req.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                              <TableCell className="text-xs font-mono">#{req.id}</TableCell>
                              <TableCell className="text-xs font-medium">{typeLabels[req.requestType] || req.requestType}</TableCell>
                              <TableCell className="text-xs max-w-[200px]">
                                {(req.requestType === "package_upgrade" || req.requestType === "package_downgrade") ? (
                                  <span>{curPkg?.name || "Current"} → {reqPkg?.name || "Requested"}</span>
                                ) : (req.requestType === "equipment_new" || req.requestType === "equipment_replace") ? (
                                  <span>{req.equipmentAction === "replace" ? "Replace" : "New"}: {req.equipmentType || "-"}</span>
                                ) : req.requestType === "status_change" ? (
                                  <span>Change to: <span className="capitalize font-medium">{req.equipmentType || "-"}</span></span>
                                ) : (
                                  <span className="truncate block">{req.description || "-"}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs capitalize">{req.effectiveMonth?.replace("_", " ") || "-"}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={`text-[10px] capitalize ${
                                  req.priority === "high" || req.priority === "urgent" ? "text-red-600 bg-red-50" :
                                  req.priority === "normal" ? "text-blue-700 bg-blue-50" :
                                  "text-gray-600 bg-gray-50"
                                }`} data-testid={`badge-priority-${req.id}`}>{req.priority}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={`text-[10px] capitalize ${
                                  req.status === "completed" ? "text-green-700 bg-green-50" :
                                  req.status === "approved" ? "text-blue-700 bg-blue-50" :
                                  req.status === "in_progress" ? "text-amber-600 bg-amber-50" :
                                  req.status === "rejected" ? "text-red-600 bg-red-50" :
                                  "text-gray-600 bg-gray-100"
                                }`} data-testid={`badge-status-${req.id}`}>{(req.status || "pending").replace("_", " ")}</Badge>
                              </TableCell>
                              <TableCell className="text-xs">{req.createdAt ? new Date(req.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"}</TableCell>
                              <TableCell>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteServiceRequestMutation.mutate(req.id)} data-testid={`button-delete-request-${req.id}`}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "pkg_history" && (
              <div className="space-y-4" data-testid="tab-content-pkg-history">
                <SectionHeader title="Package Upgrade & Downgrade History" action={
                  <Button size="sm" className="gap-1.5 bg-[#0057FF] text-white" onClick={() => setLocation(`/package-change?customerType=Normal&customerId=${id}&customerName=${encodeURIComponent(customer?.fullName || customer?.name || "")}`)} data-testid="button-new-pkg-change">
                    <Plus className="h-3.5 w-3.5" /> Submit Request
                  </Button>
                } />
                {pkgChangeLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : !pkgChangeHistory?.length ? (
                  <EmptyState icon={ArrowUpDown} message="No package change history found" />
                ) : (
                  <div className="bg-card border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#1a3a5c]">
                          <TableHead className="text-white text-xs font-semibold">Request #</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Date</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Type</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Previous Package</TableHead>
                          <TableHead className="text-white text-xs font-semibold">New Package</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Bandwidth</TableHead>
                          <TableHead className="text-white text-xs font-semibold">New Price</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Prorated Charges</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Adjustment</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Tax Impact</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Final Difference</TableHead>
                          <TableHead className="text-white text-xs font-semibold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pkgChangeHistory.map((h: any, idx: number) => (
                          <TableRow key={h.id} className={`cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 ${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}`} data-testid={`row-pcr-${h.id}`} onClick={() => { setSelectedPcr(h); setPcrDetailOpen(true); }}>
                            <TableCell className="text-xs font-mono text-blue-600">{h.requestNumber}</TableCell>
                            <TableCell className="text-xs">{h.createdAt ? new Date(h.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${h.changeType === "upgrade" ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>
                                {h.changeType === "upgrade" ? <TrendingUp className="h-3 w-3 inline mr-1" /> : <TrendingDown className="h-3 w-3 inline mr-1" />}{h.changeType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs font-medium">{h.currentPackageName || "—"}</TableCell>
                            <TableCell className="text-xs font-bold text-teal-700 dark:text-teal-400">{h.newPackageName || "—"}</TableCell>
                            <TableCell className="text-xs">{h.currentBandwidth || "—"} → {h.newBandwidth || "—"}</TableCell>
                            <TableCell className="text-xs font-medium">Rs. {parseFloat(h.newMonthlyBill || "0").toLocaleString()}</TableCell>
                            <TableCell className="text-xs">Rs. {parseFloat(h.proratedCharges || "0").toLocaleString()}</TableCell>
                            <TableCell className="text-xs">Rs. {parseFloat(h.adjustmentAmount || "0").toLocaleString()}</TableCell>
                            <TableCell className="text-xs">Rs. {parseFloat(h.taxImpact || "0").toLocaleString()}</TableCell>
                            <TableCell className={`text-xs font-bold ${parseFloat(h.finalBillDifference || "0") > 0 ? "text-red-600" : "text-green-600"}`}>Rs. {parseFloat(h.finalBillDifference || "0").toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${
                                h.status === "completed" || h.status === "approved" || h.status === "implemented" ? "text-green-700 bg-green-50" :
                                h.status === "implementing" ? "text-amber-600 bg-amber-50" :
                                h.status === "rejected" ? "text-red-600 bg-red-50" :
                                h.status === "pending" ? "text-yellow-700 bg-yellow-50" :
                                "text-gray-600 bg-gray-100"
                              }`}>{h.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={pcrDetailOpen} onOpenChange={setPcrDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#0057FF]" />
              Package Change Request — {selectedPcr?.requestNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedPcr && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Change Type</p>
                  <Badge variant="secondary" className={`text-xs capitalize mt-1 ${selectedPcr.changeType === "upgrade" ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>
                    {selectedPcr.changeType === "upgrade" ? <TrendingUp className="h-3 w-3 inline mr-1" /> : <TrendingDown className="h-3 w-3 inline mr-1" />}{selectedPcr.changeType}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Current Status</p>
                  <Badge variant="secondary" className={`text-xs capitalize mt-1 ${
                    selectedPcr.status === "completed" || selectedPcr.status === "approved" || selectedPcr.status === "implemented" ? "text-green-700 bg-green-50" :
                    selectedPcr.status === "implementing" ? "text-amber-600 bg-amber-50" :
                    selectedPcr.status === "rejected" ? "text-red-600 bg-red-50" :
                    selectedPcr.status === "pending" ? "text-yellow-700 bg-yellow-50" : "text-gray-600 bg-gray-100"
                  }`}>{selectedPcr.status}</Badge>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-[#1a3a5c] text-white text-xs font-semibold px-4 py-2">Package & Billing Details</div>
                <div className="divide-y text-xs">
                  <div className="grid grid-cols-2">
                    <div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">Previous Package</span></div>
                    <div className="px-4 py-2.5 font-medium">{selectedPcr.currentPackageName || "—"}</div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">New Package</span></div>
                    <div className="px-4 py-2.5 font-bold text-teal-700 dark:text-teal-400">{selectedPcr.newPackageName || "—"}</div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">Previous Bandwidth</span></div>
                    <div className="px-4 py-2.5">{selectedPcr.currentBandwidth || "—"}</div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">New Bandwidth</span></div>
                    <div className="px-4 py-2.5 font-bold text-teal-700 dark:text-teal-400">{selectedPcr.newBandwidth || "—"}</div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">Previous Monthly Bill</span></div>
                    <div className="px-4 py-2.5">Rs. {parseFloat(selectedPcr.currentMonthlyBill || "0").toLocaleString()}</div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">New Price</span></div>
                    <div className="px-4 py-2.5 font-bold">Rs. {parseFloat(selectedPcr.newMonthlyBill || "0").toLocaleString()}</div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">Prorated Charges</span></div>
                    <div className="px-4 py-2.5">Rs. {parseFloat(selectedPcr.proratedCharges || "0").toLocaleString()}</div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">Adjustment</span></div>
                    <div className="px-4 py-2.5">Rs. {parseFloat(selectedPcr.adjustmentAmount || "0").toLocaleString()}</div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">Tax Impact</span></div>
                    <div className="px-4 py-2.5">Rs. {parseFloat(selectedPcr.taxImpact || "0").toLocaleString()}</div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">Final Difference</span></div>
                    <div className={`px-4 py-2.5 font-bold ${parseFloat(selectedPcr.finalBillDifference || "0") > 0 ? "text-red-600" : "text-green-600"}`}>Rs. {parseFloat(selectedPcr.finalBillDifference || "0").toLocaleString()}</div>
                  </div>
                  {selectedPcr.reason && (
                    <div className="grid grid-cols-2">
                      <div className="px-4 py-2.5 bg-muted/30"><span className="font-semibold text-muted-foreground">Reason</span></div>
                      <div className="px-4 py-2.5">{selectedPcr.reason}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-[#1a3a5c] text-white text-xs font-semibold px-4 py-2">Request Tracking Timeline</div>
                <div className="p-4 space-y-0">
                  <div className="relative pl-8 pb-6 border-l-2 border-blue-200 dark:border-blue-800 ml-3">
                    <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center"><Plus className="h-3 w-3 text-white" /></div>
                    <div className="pt-0.5">
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-400">New Request Submitted</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{selectedPcr.createdAt ? new Date(selectedPcr.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
                      <p className="text-xs mt-1">Requested by: <span className="font-medium">{selectedPcr.requestedBy || "—"}</span></p>
                      {selectedPcr.isUrgent && <Badge variant="secondary" className="text-[10px] mt-1 text-red-600 bg-red-50">Urgent</Badge>}
                    </div>
                  </div>

                  {(selectedPcr.status === "approved" || selectedPcr.status === "implementing" || selectedPcr.status === "implemented" || selectedPcr.status === "completed") && (
                    <div className="relative pl-8 pb-6 border-l-2 border-green-200 dark:border-green-800 ml-3">
                      <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"><Shield className="h-3 w-3 text-white" /></div>
                      <div className="pt-0.5">
                        <p className="text-xs font-bold text-green-700 dark:text-green-400">Approved</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{selectedPcr.approvedAt ? new Date(selectedPcr.approvedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
                        <p className="text-xs mt-1">Approved by: <span className="font-medium">{selectedPcr.approvedBy || "—"}</span></p>
                      </div>
                    </div>
                  )}

                  {selectedPcr.status === "rejected" && (
                    <div className="relative pl-8 pb-6 border-l-2 border-red-200 dark:border-red-800 ml-3">
                      <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"><AlertCircle className="h-3 w-3 text-white" /></div>
                      <div className="pt-0.5">
                        <p className="text-xs font-bold text-red-700 dark:text-red-400">Rejected</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{selectedPcr.rejectedAt ? new Date(selectedPcr.rejectedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
                        <p className="text-xs mt-1">Rejected by: <span className="font-medium">{selectedPcr.rejectedBy || "—"}</span></p>
                        {selectedPcr.rejectionReason && <p className="text-xs mt-1 text-red-600">Reason: {selectedPcr.rejectionReason}</p>}
                      </div>
                    </div>
                  )}

                  {(selectedPcr.status === "implementing" || selectedPcr.status === "implemented" || selectedPcr.status === "completed") && (
                    <div className="relative pl-8 pb-6 border-l-2 border-amber-200 dark:border-amber-800 ml-3">
                      <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center"><Settings className="h-3 w-3 text-white" /></div>
                      <div className="pt-0.5">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Implementation</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{selectedPcr.implementedAt ? new Date(selectedPcr.implementedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "In progress..."}</p>
                        <p className="text-xs mt-1">Implemented by: <span className="font-medium">{selectedPcr.implementedBy || "—"}</span></p>
                        {selectedPcr.implementationNotes && <p className="text-xs mt-1">Notes: {selectedPcr.implementationNotes}</p>}
                        {selectedPcr.networkSyncStatus && <p className="text-xs mt-1">Network Sync: <Badge variant="secondary" className="text-[10px] capitalize">{selectedPcr.networkSyncStatus}</Badge></p>}
                        {selectedPcr.billingUpdated !== undefined && <p className="text-xs mt-1">Billing Updated: <span className="font-medium">{selectedPcr.billingUpdated ? "Yes" : "No"}</span></p>}
                      </div>
                    </div>
                  )}

                  {(selectedPcr.status === "implemented" || selectedPcr.status === "completed") && (
                    <div className="relative pl-8 pb-2 ml-3">
                      <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center"><Shield className="h-3 w-3 text-white" /></div>
                      <div className="pt-0.5">
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Completed</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{selectedPcr.updatedAt ? new Date(selectedPcr.updatedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
                        <p className="text-xs mt-1">Package change is now active and billing has been updated.</p>
                      </div>
                    </div>
                  )}

                  {selectedPcr.status === "pending" && (
                    <div className="relative pl-8 pb-2 ml-3">
                      <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"><Clock className="h-3 w-3 text-white" /></div>
                      <div className="pt-0.5">
                        <p className="text-xs font-medium text-muted-foreground">Awaiting Approval...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedPcr.effectiveDate && (
                <div className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Effective Date:</span>
                  <span>{new Date(selectedPcr.effectiveDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  {selectedPcr.effectiveDateType && <Badge variant="secondary" className="text-[10px] capitalize">{selectedPcr.effectiveDateType}</Badge>}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPcrDetailOpen(false)} data-testid="button-close-pcr-detail">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={serviceSchedulerOpen} onOpenChange={setServiceSchedulerOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-[#0057FF]" />
              New Service Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-3">
              <span className="text-sm font-semibold">Request Type</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  { value: "package_upgrade", label: "Package Upgrade", icon: "↑" },
                  { value: "package_downgrade", label: "Package Downgrade", icon: "↓" },
                  { value: "equipment_new", label: "New Equipment", icon: "+" },
                  { value: "equipment_replace", label: "Replace Equipment", icon: "↻" },
                  { value: "other", label: "Other Request", icon: "..." },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setServiceRequestType(opt.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      serviceRequestType === opt.value
                        ? "border-[#0057FF] bg-blue-50 dark:bg-blue-950 ring-1 ring-[#0057FF]"
                        : "border-border hover:border-muted-foreground/40"
                    }`}
                    data-testid={`btn-type-${opt.value}`}
                  >
                    <div className="text-lg mb-1">{opt.icon}</div>
                    <div className="text-xs font-medium">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {(serviceRequestType === "package_upgrade" || serviceRequestType === "package_downgrade") && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                <div className="space-y-2">
                  <span className="text-sm font-semibold">Current Package</span>
                  <div className="p-3 bg-card rounded-md border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" data-testid="text-current-package">{packages?.find(p => p.id === customer?.packageId)?.name || "No package assigned"}</span>
                      <Badge variant="secondary" className="text-[10px]">{packages?.find(p => p.id === customer?.packageId)?.speed || "-"}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-semibold">{serviceRequestType === "package_upgrade" ? "Upgrade To" : "Downgrade To"}</span>
                  <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                    <SelectTrigger data-testid="select-requested-package"><SelectValue placeholder="Select a package" /></SelectTrigger>
                    <SelectContent>
                      {packages?.filter(p => p.id !== customer?.packageId && p.isActive !== false).map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name} - {p.speed || "N/A"} ({p.price ? `$${p.price}` : "N/A"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-semibold">Effective Period</span>
                  <Select value={effectiveMonth} onValueChange={setEffectiveMonth}>
                    <SelectTrigger data-testid="select-effective-month"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current_month">Current Month</SelectItem>
                      <SelectItem value="next_month">Next Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {(serviceRequestType === "equipment_new" || serviceRequestType === "equipment_replace") && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                <div className="space-y-2">
                  <span className="text-sm font-semibold">Equipment Type</span>
                  <Select value={equipmentType} onValueChange={setEquipmentType}>
                    <SelectTrigger data-testid="select-equipment-type"><SelectValue placeholder="Select equipment type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="router">Router</SelectItem>
                      <SelectItem value="onu">ONU/ONT</SelectItem>
                      <SelectItem value="switch">Network Switch</SelectItem>
                      <SelectItem value="cable">Cable/Fiber</SelectItem>
                      <SelectItem value="antenna">Antenna</SelectItem>
                      <SelectItem value="ups">UPS/Power Backup</SelectItem>
                      <SelectItem value="media_converter">Media Converter</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {serviceRequestType === "equipment_replace" && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                      Equipment replacement request. The old equipment will need to be returned or marked as faulty.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <span className="text-sm font-semibold">Priority</span>
              <Select value={servicePriority} onValueChange={setServicePriority}>
                <SelectTrigger data-testid="select-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-semibold">Description / Notes</span>
              <Textarea
                placeholder="Add any additional details about this service request..."
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                className="min-h-[100px]"
                data-testid="textarea-service-description"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => { setServiceSchedulerOpen(false); resetServiceForm(); }} data-testid="button-cancel-service-request">Cancel</Button>
            <Button
              onClick={handleServiceRequestSubmit}
              disabled={createServiceRequestMutation.isPending}
              className="bg-[#0057FF]"
              data-testid="button-submit-service-request"
            >
              {createServiceRequestMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusSchedulerOpen} onOpenChange={setStatusSchedulerOpen}>
        <DialogContent className="max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-[#0057FF]" />
              Status Scheduler — All Scheduled Requests
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" data-testid="text-status-customer-name">{customer?.fullName}</p>
                <p className="text-xs text-muted-foreground">{customer?.customerId}</p>
              </div>
              <Badge variant="secondary" className={`text-[10px] capitalize ${
                customer?.status === "active" ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"
              }`} data-testid="badge-current-status">Current: {customer?.status || "unknown"}</Badge>
            </div>

            {serviceRequestsLoading ? (
              <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (() => {
              const allScheduled = serviceRequests || [];
              return allScheduled.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground gap-2">
                  <CalendarRange className="h-10 w-10 opacity-30" />
                  <p className="text-sm">No scheduled requests found for this customer.</p>
                </div>
              ) : (
                <div className="bg-card border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#1a3a5c] border-[#1a3a5c]">
                        <TableHead className="text-white text-xs font-semibold">ID</TableHead>
                        <TableHead className="text-white text-xs font-semibold">Type</TableHead>
                        <TableHead className="text-white text-xs font-semibold">Details</TableHead>
                        <TableHead className="text-white text-xs font-semibold">Effective</TableHead>
                        <TableHead className="text-white text-xs font-semibold">Priority</TableHead>
                        <TableHead className="text-white text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-white text-xs font-semibold">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allScheduled.map((req, idx) => {
                        const typeLabels: Record<string, string> = {
                          package_upgrade: "Pkg Upgrade",
                          package_downgrade: "Pkg Downgrade",
                          equipment_new: "New Equipment",
                          equipment_replace: "Equip Replace",
                          status_change: "Status Change",
                          other: "Other",
                        };
                        const reqPkg = packages?.find(p => p.id === req.requestedPackageId);
                        const curPkg = packages?.find(p => p.id === req.currentPackageId);
                        return (
                          <TableRow key={req.id} data-testid={`row-sched-${req.id}`} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                            <TableCell className="text-xs font-mono">#{req.id}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] whitespace-nowrap ${
                                req.requestType === "status_change" ? "text-purple-700 bg-purple-50" :
                                req.requestType.includes("package") ? "text-blue-700 bg-blue-50" :
                                req.requestType.includes("equipment") ? "text-amber-700 bg-amber-50" :
                                "text-gray-600 bg-gray-50"
                              }`}>{typeLabels[req.requestType] || req.requestType}</Badge>
                            </TableCell>
                            <TableCell className="text-xs max-w-[160px] truncate">
                              {req.requestType === "status_change" ? (
                                <span>→ <span className="capitalize font-medium">{req.equipmentType || "-"}</span></span>
                              ) : (req.requestType === "package_upgrade" || req.requestType === "package_downgrade") ? (
                                <span>{curPkg?.name || "Current"} → {reqPkg?.name || "New"}</span>
                              ) : req.description || "-"}
                            </TableCell>
                            <TableCell className="text-xs">{req.effectiveMonth || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${
                                req.priority === "high" || req.priority === "urgent" ? "text-red-600 bg-red-50" :
                                req.priority === "normal" ? "text-blue-700 bg-blue-50" : "text-gray-600 bg-gray-50"
                              }`}>{req.priority}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] capitalize ${
                                req.status === "completed" ? "text-green-700 bg-green-50" :
                                req.status === "approved" ? "text-blue-700 bg-blue-50" :
                                req.status === "rejected" ? "text-red-600 bg-red-50" :
                                req.status === "in_progress" ? "text-amber-600 bg-amber-50" :
                                "text-gray-600 bg-gray-50"
                              }`}>{req.status?.replace("_", " ")}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">{formatDate(req.createdAt)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              );
            })()}

            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4" /> Schedule New Status Change
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium">Change Status To</span>
                  <Select value={scheduledStatus} onValueChange={setScheduledStatus}>
                    <SelectTrigger className="h-9" data-testid="select-scheduled-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active (Enable)</SelectItem>
                      <SelectItem value="inactive">Inactive (Disable)</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-medium">Scheduled Date</span>
                  <Input type="date" className="h-9" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} data-testid="input-scheduled-date" />
                </div>
              </div>
              <div className="space-y-1.5 mt-3">
                <span className="text-xs font-medium">Reason</span>
                <Textarea placeholder="Reason for the status change..." value={statusScheduleReason} onChange={(e) => setStatusScheduleReason(e.target.value)} className="min-h-[60px]" data-testid="textarea-status-reason" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStatusSchedulerOpen(false)} data-testid="button-cancel-status-scheduler">Close</Button>
            <Button
              onClick={handleStatusSchedulerSubmit}
              disabled={statusSchedulerMutation.isPending || !scheduledDate}
              className="bg-[#0057FF]"
              data-testid="button-submit-status-scheduler"
            >
              {statusSchedulerMutation.isPending ? "Scheduling..." : "Schedule Status Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sendMessageOpen} onOpenChange={setSendMessageOpen}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="dialog-send-notification">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-[#0057FF]" /> Send Notification
            </DialogTitle>
          </DialogHeader>
          {customer && (
            <div className="space-y-5">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0057FF] flex items-center justify-center text-white font-bold text-sm">
                    {customer.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" data-testid="text-msg-customer-name">{customer.fullName}</p>
                    <p className="text-xs text-muted-foreground">{customer.customerId} • {customer.phone || "No phone"} • {customer.email || "No email"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Notification Type</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: "in_app", label: "In-App", icon: Bell, color: "text-purple-600 bg-purple-50 border-purple-200" },
                    { value: "sms", label: "SMS", icon: Smartphone, color: "text-green-600 bg-green-50 border-green-200" },
                    { value: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                    { value: "email", label: "Email", icon: Mail, color: "text-blue-600 bg-blue-50 border-blue-200" },
                  ].map(ch => (
                    <button
                      key={ch.value}
                      type="button"
                      onClick={() => setMessageChannel(ch.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                        messageChannel === ch.value
                          ? `${ch.color} ring-2 ring-offset-1 ring-current font-semibold`
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                      data-testid={`btn-channel-${ch.value}`}
                    >
                      <ch.icon className="h-5 w-5" />
                      <span className="text-xs">{ch.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Message Category</span>
                <Select value={messageCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger data-testid="select-msg-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {smsCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(messageChannel === "email" || messageChannel === "in_app") && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Subject</span>
                  <Input
                    value={messageSubject}
                    onChange={e => setMessageSubject(e.target.value)}
                    placeholder="Enter subject..."
                    data-testid="input-msg-subject"
                  />
                </div>
              )}

              <div className="space-y-2">
                <span className="text-sm font-medium">Message</span>
                <Textarea
                  value={messageBody}
                  onChange={e => setMessageBody(e.target.value)}
                  placeholder="Type your message..."
                  className="min-h-[120px]"
                  data-testid="textarea-msg-body"
                />
              </div>

              {messageChannel === "sms" && !customer.phone && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" /> Customer has no phone number
                </div>
              )}
              {messageChannel === "email" && !customer.email && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" /> Customer has no email address
                </div>
              )}
              {messageChannel === "whatsapp" && !customer.phone && !customer.phoneNumber && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" /> Customer has no phone or mobile number
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSendMessageOpen(false)} data-testid="button-cancel-send-msg">Cancel</Button>
            <Button
              onClick={() => sendMessageMutation.mutate({
                channel: messageChannel, subject: messageSubject, message: messageBody, category: messageCategory,
              })}
              disabled={
                sendMessageMutation.isPending || !messageBody.trim() ||
                (messageChannel === "email" && (!messageSubject.trim() || !customer?.email)) ||
                (messageChannel === "sms" && !customer?.phone) ||
                (messageChannel === "whatsapp" && !customer?.phone && !customer?.phoneNumber) ||
                (messageChannel === "in_app" && !messageSubject.trim())
              }
              className="bg-[#0057FF]"
              data-testid="button-send-notification"
            >
              {sendMessageMutation.isPending ? "Sending..." : (
                <>
                  <Send className="h-4 w-4 mr-1.5" />
                  {messageChannel === "email" ? "Send Email" : messageChannel === "sms" ? "Send SMS" : messageChannel === "whatsapp" ? "Send WhatsApp" : "Send Notification"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={connectionDialogOpen} onOpenChange={setConnectionDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingConnection ? "Edit Connection" : "Add Connection"}</DialogTitle>
          </DialogHeader>
          <Form {...connectionForm}>
            <form onSubmit={connectionForm.handleSubmit(onConnectionSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={connectionForm.control} name="username" render={({ field }) => (
                  <FormItem><FormLabel>Username/PPPoE</FormLabel><FormControl><Input placeholder="PPPoE username" data-testid="input-conn-username" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="ipAddress" render={({ field }) => (
                  <FormItem><FormLabel>IP Address</FormLabel><FormControl><Input placeholder="192.168.1.1" data-testid="input-conn-ip" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="macAddress" render={({ field }) => (
                  <FormItem><FormLabel>MAC Address</FormLabel><FormControl><Input placeholder="AA:BB:CC:DD:EE:FF" data-testid="input-conn-mac" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="onuSerial" render={({ field }) => (
                  <FormItem><FormLabel>ONU Serial</FormLabel><FormControl><Input placeholder="ONU serial number" data-testid="input-conn-onu" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="routerModel" render={({ field }) => (
                  <FormItem><FormLabel>Router Model</FormLabel><FormControl><Input placeholder="Router model" data-testid="input-conn-router-model" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="routerSerial" render={({ field }) => (
                  <FormItem><FormLabel>Router Serial</FormLabel><FormControl><Input placeholder="Router serial" data-testid="input-conn-router-serial" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="connectionType" render={({ field }) => (
                  <FormItem><FormLabel>Connection Type</FormLabel><FormControl>
                    <Select onValueChange={field.onChange} value={field.value || "fiber"}>
                      <SelectTrigger data-testid="select-conn-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fiber">Fiber</SelectItem>
                        <SelectItem value="wireless">Wireless</SelectItem>
                        <SelectItem value="cable">Cable</SelectItem>
                        <SelectItem value="dsl">DSL</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="port" render={({ field }) => (
                  <FormItem><FormLabel>Port</FormLabel><FormControl><Input placeholder="Port" data-testid="input-conn-port" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="vlan" render={({ field }) => (
                  <FormItem><FormLabel>VLAN</FormLabel><FormControl><Input placeholder="VLAN ID" data-testid="input-conn-vlan" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="installDate" render={({ field }) => (
                  <FormItem><FormLabel>Install Date</FormLabel><FormControl><Input type="date" data-testid="input-conn-install-date" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={connectionForm.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel><FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger data-testid="select-conn-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setConnectionDialogOpen(false)} data-testid="button-cancel-connection">Cancel</Button>
                <Button type="submit" disabled={createConnectionMutation.isPending || updateConnectionMutation.isPending} data-testid="button-submit-connection">
                  {createConnectionMutation.isPending || updateConnectionMutation.isPending ? "Saving..." : editingConnection ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-0 flex-1">
        <div className="text-white text-xs font-semibold px-5 py-2.5 rounded-md flex-1 bg-[#1c67d4]" data-testid={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {title}
        </div>
      </div>
      {action && <div className="ml-3">{action}</div>}
    </div>
  );
}

function InfoRow({ label, value, capitalize }: { label: string; value: React.ReactNode; capitalize?: boolean }) {
  return (
    <div className="flex items-center py-2.5 px-4 text-xs">
      <span className="font-semibold text-muted-foreground w-[45%] shrink-0">{label}</span>
      <span className="text-muted-foreground mx-2">:</span>
      <span className={`font-medium text-foreground ${capitalize ? "capitalize" : ""}`} data-testid={`info-${label.toLowerCase().replace(/[\s\/]+/g, '-')}`}>
        {value}
      </span>
    </div>
  );
}

function ProfileSidebarItem({ icon: Icon, label, value, testId }: { icon: typeof User; label: string; value: string; testId: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/10">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 opacity-60" />
        <span className="opacity-80">{label}:</span>
      </div>
      <span className="font-medium text-right max-w-[50%] truncate" data-testid={testId}>{value}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: typeof User; message: string }) {
  return (
    <div className="bg-card border rounded-lg p-12 text-center text-muted-foreground">
      <Icon className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
