import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  LifeBuoy,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  History,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  UserPlus,
  TicketCheck,
  CircleDot,
  Timer,
  FileText,
  FileSpreadsheet,
  Monitor,
  Users,
  Info,
  UserCheck,
  Wifi,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTab } from "@/hooks/use-tab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
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
import { insertTicketSchema, type Ticket, type InsertTicket, type Customer, type CustomerConnection, insertSupportCategorySchema, type SupportCategory, type InsertSupportCategory, type Employee, type Reseller, type Vendor, type NetworkTower } from "@shared/schema";
import { z } from "zod";

type TicketWithCustomer = Ticket & { customerName?: string; customerCode?: string; customerPhone?: string; customerArea?: string };

const ticketFormSchema = insertTicketSchema.extend({
  subject: z.string().min(3, "Subject is required"),
});

export default function TicketsPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [viewingTicket, setViewingTicket] = useState<TicketWithCustomer | null>(null);
  const [activeTab, setActiveTab] = useTab("list");

  const { data: tickets, isLoading } = useQuery<TicketWithCustomer[]>({
    queryKey: ["/api/tickets"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: supportCategories } = useQuery<SupportCategory[]>({
    queryKey: ["/api/support-categories"],
  });

  const { data: resellers } = useQuery<Reseller[]>({
    queryKey: ["/api/resellers"],
  });

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: networkTowers } = useQuery<NetworkTower[]>({
    queryKey: ["/api/network-towers"],
  });

  const { data: currentUser } = useQuery<{ id: number; username: string; fullName?: string; role?: string }>({
    queryKey: ["/api/auth/me"],
  });

  const form = useForm<InsertTicket>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      ticketNumber: "",
      customerId: 0,
      subject: "",
      description: "",
      priority: "medium",
      status: "open",
      category: "general",
      assignedTo: "",
      createdAt: new Date().toISOString(),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTicket) => {
      const res = await apiRequest("POST", "/api/tickets", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Ticket created successfully" });
      setActiveTab("list");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertTicket> }) => {
      const res = await apiRequest("PATCH", `/api/tickets/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setDialogOpen(false);
      setEditingTicket(null);
      form.reset();
      toast({ title: "Ticket updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tickets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Ticket deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingTicket(null);
    form.reset({
      ticketNumber: "",
      customerId: 0,
      subject: "",
      description: "",
      priority: "medium",
      status: "open",
      category: "general",
      assignedTo: "",
      createdAt: new Date().toISOString(),
    });
    setDialogOpen(true);
  };

  const openEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    form.reset({
      ticketNumber: ticket.ticketNumber,
      customerId: ticket.customerId,
      subject: ticket.subject,
      description: ticket.description || "",
      priority: ticket.priority,
      status: ticket.status,
      category: ticket.category,
      assignedTo: ticket.assignedTo || "",
      createdAt: ticket.createdAt,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertTicket) => {
    if (editingTicket) {
      updateMutation.mutate({ id: editingTicket.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-tickets-title">Support & Ticketing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Daily Support Ticket Management</p>
        </div>
        {activeTab !== "new" && (
          <Button className="bg-[#0057FF] gap-1.5" onClick={() => setActiveTab("new")} data-testid="button-add-ticket">
            <Plus className="h-4 w-4" />
            Open New Ticket
          </Button>
        )}
      </div>

      {activeTab === "types" && <SupportCategoriesView />}

      {activeTab === "new" && (
        <NewTicketView
          customers={customers || []}
          supportCategories={supportCategories || []}
          resellers={resellers || []}
          vendors={vendors || []}
          networkTowers={networkTowers || []}
          createdBy={currentUser?.fullName || currentUser?.username || ""}
          onSubmit={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
          onCancel={() => setActiveTab("list")}
        />
      )}

      {activeTab === "view" && viewingTicket && (
        <ViewTicketView
          ticket={viewingTicket}
          customers={customers || []}
          resellers={resellers || []}
          vendors={vendors || []}
          networkTowers={networkTowers || []}
          supportCategories={supportCategories || []}
          onBack={() => setActiveTab("list")}
          onEdit={() => { openEdit(viewingTicket); setActiveTab("list"); }}
        />
      )}

      {activeTab === "list" && (
        <TicketListView
          tickets={tickets || []}
          isLoading={isLoading}
          supportCategories={supportCategories || []}
          onEdit={openEdit}
          onDelete={(id) => deleteMutation.mutate(id)}
          onView={(ticket) => { setViewingTicket(ticket); setActiveTab("view"); }}
        />
      )}

      {activeTab === "history" && (
        <TicketHistoryView
          tickets={tickets || []}
          isLoading={isLoading}
          supportCategories={supportCategories || []}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTicket ? "Edit Ticket" : "Create Ticket"}</DialogTitle>
            <DialogDescription>
              {editingTicket ? "Update the ticket details below" : "Fill in the details to create a new support ticket"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ticketNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticket Number</FormLabel>
                      <FormControl>
                        <Input placeholder="TKT-001" data-testid="input-ticket-number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-ticket-customer">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(customers || []).map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject / Problem</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of the issue" data-testid="input-ticket-subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detailed description..." data-testid="input-ticket-desc" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "medium"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "open"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tkt-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "general"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="connectivity">Connectivity</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="speed">Speed Issue</SelectItem>
                          <SelectItem value="hardware">Hardware</SelectItem>
                          <SelectItem value="installation">Installation</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <FormControl>
                      <Input placeholder="Technician name" data-testid="input-assigned-to" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-ticket">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingTicket ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewTicketView({
  customers,
  supportCategories,
  resellers,
  vendors,
  networkTowers,
  createdBy,
  onSubmit,
  isPending,
  onCancel,
}: {
  customers: Customer[];
  supportCategories: SupportCategory[];
  resellers: Reseller[];
  vendors: Vendor[];
  networkTowers: NetworkTower[];
  createdBy?: string;
  onSubmit: (data: InsertTicket) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  const [supportGroup, setSupportGroup] = useState("customers");
  const [customerSubType, setCustomerSubType] = useState("regular");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [connectionData, setConnectionData] = useState<CustomerConnection | null>(null);
  const [entitySearch, setEntitySearch] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [selectedEntityName, setSelectedEntityName] = useState("");
  const [showEntityDropdown, setShowEntityDropdown] = useState(false);
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("");
  const [complainedNumber, setComplainedNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [assignedToList, setAssignedToList] = useState<string[]>([]);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [sendSms, setSendSms] = useState(true);

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: fetchedConnection } = useQuery<CustomerConnection[]>({
    queryKey: ["/api/customer-connections", selectedCustomer?.id],
    enabled: !!selectedCustomer?.id,
  });

  const connection = fetchedConnection?.[0] || connectionData;

  const handleSupportGroupChange = (group: string) => {
    setSupportGroup(group);
    setCustomerSearch("");
    setSelectedCustomer(null);
    setConnectionData(null);
    setEntitySearch("");
    setSelectedEntityId(null);
    setSelectedEntityName("");
    setCategory("");
    setComplainedNumber("");
  };

  const filteredCustomers = customers.filter(c => {
    if (!customerSearch) return false;
    const s = customerSearch.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(s) ||
      c.customerId.toLowerCase().includes(s) ||
      (c.phone || "").includes(s)
    );
  });

  const filteredResellers = resellers.filter(r => {
    if (!entitySearch) return true;
    const s = entitySearch.toLowerCase();
    return r.name.toLowerCase().includes(s) || (r.phone || "").includes(s) || (r.area || "").toLowerCase().includes(s);
  });

  const filteredVendors = vendors.filter(v => {
    if (!entitySearch) return true;
    const s = entitySearch.toLowerCase();
    return v.name.toLowerCase().includes(s) || (v.phone || "").includes(s);
  });

  const filteredTowers = networkTowers.filter(t => {
    if (!entitySearch) return true;
    const s = entitySearch.toLowerCase();
    return t.name.toLowerCase().includes(s) || t.towerId.toLowerCase().includes(s) || (t.address || "").toLowerCase().includes(s);
  });

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(`${customer.fullName} (${customer.customerId})`);
    setComplainedNumber(customer.phone || "");
    setShowCustomerDropdown(false);
  };

  const selectEntity = (id: number, name: string, phone?: string) => {
    setSelectedEntityId(id);
    setSelectedEntityName(name);
    setEntitySearch(name);
    setComplainedNumber(phone || "");
    setShowEntityDropdown(false);
  };

  const toggleAssignee = (name: string) => {
    setAssignedToList(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const generateTicketNumber = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `TKT-${y}${m}${d}-${rand}`;
  };

  const isCustomerGroup = supportGroup === "customers";
  const isEntitySelected = !isCustomerGroup ? !!selectedEntityId : !!selectedCustomer;
  const canSubmit = isEntitySelected && !!category && !!remarks.trim();

  const filteredCategories = supportCategories.length > 0
    ? supportCategories.filter(c => !c.targetGroup || c.targetGroup === supportGroup)
    : ["General", "Connectivity", "Billing", "Speed Issue", "Hardware", "Installation"].map(n => ({ name: n }));

  const handleSubmit = () => {
    if (!canSubmit) return;
    const ticketData: InsertTicket = {
      ticketNumber: generateTicketNumber(),
      customerId: selectedCustomer?.id || 0,
      subject: category,
      description: remarks,
      priority,
      status: "open",
      category,
      assignedTo: assignedToList.length > 0 ? assignedToList.join(",") : undefined,
      createdAt: new Date().toISOString(),
      supportGroup,
      entityId: isCustomerGroup ? null : selectedEntityId,
      entityName: isCustomerGroup ? null : selectedEntityName,
      customerSubType: isCustomerGroup ? customerSubType : null,
      createdBy: createdBy || undefined,
    } as InsertTicket;
    onSubmit(ticketData);
  };

  const handleClear = () => {
    setCustomerSearch("");
    setSelectedCustomer(null);
    setConnectionData(null);
    setEntitySearch("");
    setSelectedEntityId(null);
    setSelectedEntityName("");
    setPriority("medium");
    setCategory("");
    setComplainedNumber("");
    setRemarks("");
    setAssignedToList([]);
    setSendSms(true);
  };

  const readonlyFieldClass = "h-9 text-xs bg-muted/50 border-muted cursor-default";

  const supportGroupOptions = [
    { key: "customers", label: "Customers", icon: Users },
    { key: "resellers", label: "Resellers", icon: UserCheck },
    { key: "pops", label: "POP's", icon: Wifi },
    { key: "vendors", label: "Vendors", icon: Building2 },
  ];

  return (
    <div className="mt-4 space-y-5">
      <div className="bg-[#1a3a5c] text-white py-3 px-6 rounded-t-lg flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-wide" data-testid="text-new-ticket-title">New Support Ticket</h2>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={onCancel} data-testid="button-close-new-ticket">
          <XCircle className="h-5 w-5" />
        </Button>
      </div>

      <div className="bg-card border rounded-b-lg rounded-t-none -mt-5 p-6 space-y-6">

        {/* Support Type Selector */}
        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">
            Support Type <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {supportGroupOptions.map(g => {
              const Icon = g.icon;
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => handleSupportGroupChange(g.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    supportGroup === g.key
                      ? "bg-[#1a3a5c] text-white border-[#1a3a5c]"
                      : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                  data-testid={`btn-support-group-${g.key}`}
                >
                  <Icon className="h-4 w-4" />
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer-specific: sub-type then search */}
        {isCustomerGroup && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">
                Customer Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[
                  { key: "regular", label: "Customer" },
                  { key: "corporate", label: "Corporate Customer" },
                  { key: "cir", label: "CIR Customer" },
                ].map(st => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => { setCustomerSubType(st.key); setCustomerSearch(""); setSelectedCustomer(null); }}
                    className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                      customerSubType === st.key
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    }`}
                    data-testid={`btn-customer-subtype-${st.key}`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">
                User Name (ID) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  className="h-10 text-sm pr-10"
                  placeholder={`Search ${customerSubType === "cir" ? "CIR" : customerSubType === "corporate" ? "corporate" : ""} customer by name, ID, or phone...`}
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                    if (!e.target.value) { setSelectedCustomer(null); setConnectionData(null); }
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  data-testid="input-customer-search"
                />
                <Search className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" />
                {showCustomerDropdown && customerSearch && filteredCustomers.length > 0 && (
                  <div className="absolute z-50 w-full bg-popover border rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {filteredCustomers.slice(0, 10).map(c => (
                      <button
                        key={c.id}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm flex items-center justify-between gap-2 border-b last:border-b-0"
                        onClick={() => selectCustomer(c)}
                        data-testid={`option-customer-${c.id}`}
                      >
                        <div>
                          <span className="font-medium">{c.fullName}</span>
                          <span className="text-xs text-muted-foreground ml-2">({c.customerId})</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Non-customer entity selectors */}
        {!isCustomerGroup && (
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">
              {supportGroup === "resellers" ? "Reseller" : supportGroup === "vendors" ? "Vendor" : "POP / Tower"} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                className="h-10 text-sm pr-10"
                placeholder={`Search ${supportGroup === "resellers" ? "resellers" : supportGroup === "vendors" ? "vendors" : "POP's / towers"} by name...`}
                value={entitySearch}
                onChange={(e) => {
                  setEntitySearch(e.target.value);
                  setShowEntityDropdown(true);
                  if (!e.target.value) { setSelectedEntityId(null); setSelectedEntityName(""); }
                }}
                onFocus={() => setShowEntityDropdown(true)}
                data-testid="input-entity-search"
              />
              <Search className="h-4 w-4 absolute right-3 top-3 text-muted-foreground" />
              {showEntityDropdown && (
                <div className="absolute z-50 w-full bg-popover border rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                  {supportGroup === "resellers" && filteredResellers.slice(0, 15).map(r => (
                    <button
                      key={r.id}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm flex items-center justify-between gap-2 border-b last:border-b-0"
                      onClick={() => selectEntity(r.id, r.name, r.phone)}
                      data-testid={`option-reseller-${r.id}`}
                    >
                      <div>
                        <span className="font-medium">{r.name}</span>
                        <span className="text-xs text-muted-foreground ml-2 capitalize">{r.resellerType?.replace(/_/g, " ")}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{r.area}</span>
                    </button>
                  ))}
                  {supportGroup === "vendors" && filteredVendors.slice(0, 15).map(v => (
                    <button
                      key={v.id}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm flex items-center justify-between gap-2 border-b last:border-b-0"
                      onClick={() => selectEntity(v.id, v.name, v.phone)}
                      data-testid={`option-vendor-${v.id}`}
                    >
                      <div>
                        <span className="font-medium">{v.name}</span>
                        <span className="text-xs text-muted-foreground ml-2 capitalize">{v.vendorType}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{v.contactPerson}</span>
                    </button>
                  ))}
                  {supportGroup === "pops" && filteredTowers.slice(0, 15).map(t => (
                    <button
                      key={t.id}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm flex items-center justify-between gap-2 border-b last:border-b-0"
                      onClick={() => selectEntity(t.id, t.name, undefined)}
                      data-testid={`option-tower-${t.id}`}
                    >
                      <div>
                        <span className="font-medium">{t.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{t.towerId}</span>
                      </div>
                      <span className={`text-xs font-medium ${t.status === "active" ? "text-green-600" : "text-red-500"}`}>{t.status}</span>
                    </button>
                  ))}
                  {((supportGroup === "resellers" && filteredResellers.length === 0) ||
                    (supportGroup === "vendors" && filteredVendors.length === 0) ||
                    (supportGroup === "pops" && filteredTowers.length === 0)) && (
                    <div className="px-4 py-3 text-sm text-muted-foreground text-center">No results found</div>
                  )}
                </div>
              )}
            </div>
            {selectedEntityId && (
              <div className="mt-2 flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                <CheckCircle className="h-3.5 w-3.5" />
                Selected: <span className="font-semibold">{selectedEntityName}</span>
              </div>
            )}
          </div>
        )}

        {/* Customer info card */}
        {isCustomerGroup && selectedCustomer && (
          <>
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Customer Name</label>
                  <Input className={readonlyFieldClass} value={selectedCustomer.fullName} readOnly data-testid="field-customer-name" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Mobile Number</label>
                  <Input className={readonlyFieldClass} value={selectedCustomer.phone || "-"} readOnly data-testid="field-mobile" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Client Address</label>
                  <Input className={readonlyFieldClass} value={selectedCustomer.address || selectedCustomer.presentAddress || "-"} readOnly data-testid="field-address" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Zone</label>
                  <Input className={readonlyFieldClass} value={selectedCustomer.zone || selectedCustomer.area || "-"} readOnly data-testid="field-zone" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Client Code</label>
                  <Input className={readonlyFieldClass} value={selectedCustomer.customerId || "-"} readOnly data-testid="field-client-code" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Billing Status</label>
                  <Input className={readonlyFieldClass} value={selectedCustomer.status || "-"} readOnly data-testid="field-billing-status" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Monthly Bill</label>
                  <Input className={readonlyFieldClass} value={selectedCustomer.monthlyBill ? `Rs. ${selectedCustomer.monthlyBill}` : "-"} readOnly data-testid="field-monthly-bill" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Last Paid Amount</label>
                  <Input className={readonlyFieldClass} value={"-"} readOnly data-testid="field-last-paid" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Payment Status</label>
                  <Input className={readonlyFieldClass} value={selectedCustomer.status === "active" ? "Paid" : "Unpaid"} readOnly data-testid="field-payment-status" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Package</label>
                  <Input className={readonlyFieldClass} value={selectedCustomer.packageId ? `PKG-${selectedCustomer.packageId}` : "-"} readOnly data-testid="field-package" />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">MAC Address/Caller ID</label>
                  <Input className={readonlyFieldClass} value={connection?.macAddress || "-"} readOnly data-testid="field-mac-address" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">IP Address</label>
                  <Input className={readonlyFieldClass} value={connection?.ipAddress || "-"} readOnly data-testid="field-ip-address" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Connectivity Status</label>
                  <Input className={readonlyFieldClass} value={connection?.status || "-"} readOnly />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Connection Type</label>
                  <Badge variant="outline" className="mt-1 text-xs">{connection?.connectionType || "Not Found"}</Badge>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Problem Category, Priority, Complained Number, Assign To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">
              Problem Category <span className="text-red-500">*</span>
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 text-xs" data-testid="select-new-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map(c => (
                  <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                ))}
                {filteredCategories.length === 0 && (
                  <SelectItem value="general">General</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">
              Problem Priority <span className="text-red-500">*</span>
            </label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="h-9 text-xs" data-testid="select-new-priority">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">
              Complained Number <span className="text-red-500">*</span>
            </label>
            <Input
              className="h-9 text-xs"
              value={complainedNumber}
              onChange={(e) => setComplainedNumber(e.target.value)}
              placeholder="Phone number"
              data-testid="input-complained-number"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">
              Assign To (Multiple)
            </label>
            <div className="relative">
              <button
                type="button"
                className="w-full h-9 px-3 text-xs border rounded-md bg-background text-left flex items-center justify-between gap-2 hover:border-foreground/40 transition-colors"
                onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                data-testid="button-assign-to-toggle"
              >
                <span className={assignedToList.length === 0 ? "text-muted-foreground" : "text-foreground"}>
                  {assignedToList.length === 0 ? "Select assignees..." : assignedToList.join(", ")}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
              {showAssignDropdown && (
                <div className="absolute z-50 w-full bg-popover border rounded-lg shadow-lg mt-1 max-h-52 overflow-y-auto">
                  {(employees || []).length === 0 ? (
                    <div className="px-4 py-3 text-xs text-muted-foreground text-center">No employees found</div>
                  ) : (employees || []).map(emp => (
                    <button
                      key={emp.id}
                      type="button"
                      className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm flex items-center gap-3 border-b last:border-b-0"
                      onClick={() => toggleAssignee(emp.fullName)}
                      data-testid={`option-assignee-${emp.id}`}
                    >
                      <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${assignedToList.includes(emp.fullName) ? "bg-blue-600 border-blue-600" : "border-muted-foreground"}`}>
                        {assignedToList.includes(emp.fullName) && <CheckCircle className="h-3 w-3 text-white" />}
                      </div>
                      <div>
                        <span className="font-medium text-xs">{emp.fullName}</span>
                        {(emp as any).designation && <span className="text-[10px] text-muted-foreground ml-1">— {(emp as any).designation}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">
            Remarks/Note/Comments <span className="text-red-500">*</span>
          </label>
          <Textarea
            className="min-h-[120px] text-sm"
            placeholder="Enter detailed remarks, notes, or comments about the issue..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            data-testid="input-remarks"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-muted-foreground accent-blue-500"
              checked={sendSms}
              onChange={(e) => setSendSms(e.target.checked)}
              data-testid="checkbox-send-sms"
            />
            Send SMS to {isCustomerGroup ? "Client" : supportGroup === "resellers" ? "Reseller" : supportGroup === "vendors" ? "Vendor" : "Contact"}?
          </label>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-3">
            <Button
              variant="destructive"
              className="px-8"
              onClick={onCancel}
              data-testid="button-cancel-ticket"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="px-8 bg-orange-500 text-white hover:bg-orange-600 border-0"
              onClick={handleClear}
              data-testid="button-clear-ticket"
            >
              Clear
            </Button>
          </div>
          <Button
            className="px-8 bg-[#1a3a5c] hover:bg-[#1a3a5c]/90 text-white"
            onClick={handleSubmit}
            disabled={isPending || !canSubmit}
            data-testid="button-submit-ticket"
          >
            {isPending ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ViewTicketView({
  ticket,
  customers,
  resellers,
  vendors,
  networkTowers,
  supportCategories,
  onBack,
  onEdit,
}: {
  ticket: TicketWithCustomer;
  customers: Customer[];
  resellers: Reseller[];
  vendors: Vendor[];
  networkTowers: NetworkTower[];
  supportCategories: SupportCategory[];
  onBack: () => void;
  onEdit: () => void;
}) {
  const sg = (ticket as any).supportGroup || "customers";
  const entityId = (ticket as any).entityId as number | null;
  const entityName = (ticket as any).entityName as string | null;
  const customerSubType = (ticket as any).customerSubType as string | null;
  const createdBy = (ticket as any).createdBy as string | null;

  const customer = customers.find(c => c.id === ticket.customerId);
  const reseller = sg === "resellers" && entityId ? resellers.find(r => r.id === entityId) : null;
  const vendor = sg === "vendors" && entityId ? vendors.find(v => v.id === entityId) : null;
  const tower = sg === "pops" && entityId ? networkTowers.find(t => t.id === entityId) : null;

  const supportGroupConfig: Record<string, { label: string; icon: typeof Users; color: string }> = {
    customers: { label: "Customers", icon: Users, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    resellers: { label: "Resellers", icon: UserCheck, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
    pops: { label: "POP's", icon: Wifi, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
    vendors: { label: "Vendors", icon: Building2, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  };

  const priorityConfig: Record<string, { label: string; className: string }> = {
    critical: { label: "Critical", className: "bg-red-600 text-white" },
    high: { label: "High", className: "bg-red-500 text-white" },
    medium: { label: "Medium", className: "bg-amber-500 text-white" },
    low: { label: "Low", className: "bg-green-500 text-white" },
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    open: { label: "Open / Pending", className: "bg-amber-500 text-white" },
    in_progress: { label: "In Progress", className: "bg-blue-500 text-white" },
    resolved: { label: "Resolved", className: "bg-green-500 text-white" },
    closed: { label: "Closed", className: "bg-gray-500 text-white" },
  };

  const groupInfo = supportGroupConfig[sg] || supportGroupConfig.customers;
  const GroupIcon = groupInfo.icon;
  const priorityInfo = priorityConfig[ticket.priority] || priorityConfig.medium;
  const statusInfo = statusConfig[ticket.status] || statusConfig.open;

  const readonlyFieldClass = "h-9 text-xs bg-muted/50 border-muted cursor-default";

  const assignedToList = ticket.assignedTo ? ticket.assignedTo.split(",").map(s => s.trim()).filter(Boolean) : [];

  return (
    <div className="mt-4 space-y-5">
      {/* Header */}
      <div className="bg-[#1a3a5c] text-white py-3 px-6 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white/80 hover:text-white transition-colors" data-testid="button-view-back">
            <ChevronDown className="h-5 w-5 rotate-90" />
          </button>
          <h2 className="text-lg font-bold tracking-wide" data-testid="text-view-ticket-title">
            Ticket Details — {ticket.ticketNumber}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20 h-8 gap-1.5 text-xs"
            onClick={onEdit}
            data-testid="button-view-edit"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit Ticket
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={onBack} data-testid="button-view-close">
            <XCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-b-lg rounded-t-none -mt-5 p-6 space-y-6">

        {/* Ticket Meta Row */}
        <div className="flex flex-wrap items-center gap-3 pb-4 border-b">
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${groupInfo.color}`} data-testid="badge-support-group">
            <GroupIcon className="h-3.5 w-3.5" />
            {groupInfo.label}
          </span>
          {customerSubType && sg === "customers" && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border capitalize">
              {customerSubType === "cir" ? "CIR Customer" : customerSubType === "corporate" ? "Corporate Customer" : "Regular Customer"}
            </span>
          )}
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusInfo.className}`} data-testid="badge-ticket-status">
            {statusInfo.label}
          </span>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${priorityInfo.className}`} data-testid="badge-ticket-priority">
            {ticket.priority?.charAt(0).toUpperCase()}{ticket.priority?.slice(1)} Priority
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            Created: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "-"}
          </span>
        </div>

        {/* Entity Info — Customer */}
        {sg === "customers" && customer && (
          <>
            <div>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3">Customer Information</h3>
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Customer Name</label>
                    <Input className={readonlyFieldClass} value={customer.fullName} readOnly data-testid="view-field-customer-name" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Mobile Number</label>
                    <Input className={readonlyFieldClass} value={customer.phone || "-"} readOnly />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Client Address</label>
                    <Input className={readonlyFieldClass} value={customer.address || customer.presentAddress || "-"} readOnly />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Zone / Area</label>
                    <Input className={readonlyFieldClass} value={customer.zone || customer.area || "-"} readOnly />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Client Code</label>
                    <Input className={readonlyFieldClass} value={customer.customerId} readOnly />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Billing Status</label>
                    <Input className={readonlyFieldClass} value={customer.status || "-"} readOnly />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Monthly Bill</label>
                    <Input className={readonlyFieldClass} value={customer.monthlyBill ? `Rs. ${customer.monthlyBill}` : "-"} readOnly />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Payment Status</label>
                    <Input className={readonlyFieldClass} value={customer.status === "active" ? "Paid" : "Unpaid"} readOnly />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Package</label>
                    <Input className={readonlyFieldClass} value={customer.packageId ? `PKG-${customer.packageId}` : "-"} readOnly />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* No customer found (legacy ticket) */}
        {sg === "customers" && !customer && ticket.customerId > 0 && (
          <div className="border rounded-lg p-4 bg-muted/20">
            <p className="text-sm text-muted-foreground">Customer ID: {ticket.customerId} — details not available</p>
          </div>
        )}

        {/* Entity Info — Reseller */}
        {sg === "resellers" && (
          <div>
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3">Reseller Information</h3>
            <div className="border rounded-lg p-4 bg-muted/20">
              {reseller ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Reseller Name</label>
                    <Input className={readonlyFieldClass} value={reseller.name} readOnly data-testid="view-field-reseller-name" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Phone</label>
                    <Input className={readonlyFieldClass} value={reseller.phone || "-"} readOnly />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Area</label>
                    <Input className={readonlyFieldClass} value={reseller.area || "-"} readOnly />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Reseller Type</label>
                    <Input className={readonlyFieldClass} value={reseller.resellerType?.replace(/_/g, " ") || "-"} readOnly />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{entityName || `Reseller ID: ${entityId}`}</p>
              )}
            </div>
          </div>
        )}

        {/* Entity Info — Vendor */}
        {sg === "vendors" && (
          <div>
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3">Vendor Information</h3>
            <div className="border rounded-lg p-4 bg-muted/20">
              {vendor ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Vendor Name</label>
                    <Input className={readonlyFieldClass} value={vendor.name} readOnly data-testid="view-field-vendor-name" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Phone</label>
                    <Input className={readonlyFieldClass} value={vendor.phone || "-"} readOnly />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Vendor Type</label>
                    <Input className={readonlyFieldClass} value={vendor.vendorType || "-"} readOnly />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Contact Person</label>
                    <Input className={readonlyFieldClass} value={vendor.contactPerson || "-"} readOnly />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{entityName || `Vendor ID: ${entityId}`}</p>
              )}
            </div>
          </div>
        )}

        {/* Entity Info — POP/Tower */}
        {sg === "pops" && (
          <div>
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3">POP / Tower Information</h3>
            <div className="border rounded-lg p-4 bg-muted/20">
              {tower ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Tower Name</label>
                    <Input className={readonlyFieldClass} value={tower.name} readOnly data-testid="view-field-tower-name" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Tower ID</label>
                    <Input className={readonlyFieldClass} value={tower.towerId} readOnly />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Tower Type</label>
                    <Input className={readonlyFieldClass} value={tower.towerType || "-"} readOnly />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Status</label>
                    <Input className={readonlyFieldClass} value={tower.status || "-"} readOnly />
                  </div>
                  {tower.address && (
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Address</label>
                      <Input className={readonlyFieldClass} value={tower.address} readOnly />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{entityName || `Tower ID: ${entityId}`}</p>
              )}
            </div>
          </div>
        )}

        {/* Ticket Details */}
        <div>
          <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3">Ticket Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Ticket Number</label>
              <Input className={readonlyFieldClass} value={ticket.ticketNumber} readOnly data-testid="view-field-ticket-number" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Problem Category</label>
              <Input className={readonlyFieldClass} value={ticket.category} readOnly data-testid="view-field-category" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Priority</label>
              <div className="flex items-center h-9">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityInfo.className}`}>
                  {ticket.priority?.charAt(0).toUpperCase()}{ticket.priority?.slice(1)}
                </span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Status</label>
              <div className="flex items-center h-9">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.className}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Assigned To</label>
              {assignedToList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center">
                  {assignedToList.map((a, i) => (
                    <span key={i} className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <Input className={readonlyFieldClass} value="Unassigned" readOnly data-testid="view-field-assigned" />
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Date Opened</label>
              <Input className={readonlyFieldClass} value={ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "-"} readOnly data-testid="view-field-created-at" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Date Resolved</label>
              <Input className={readonlyFieldClass} value={ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString() : "Not Resolved Yet"} readOnly data-testid="view-field-resolved-at" />
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3">Remarks / Description</h3>
          <div className="border rounded-lg p-4 bg-muted/20 min-h-[100px] text-sm leading-relaxed" data-testid="view-field-description">
            {ticket.description || ticket.subject || <span className="text-muted-foreground italic">No remarks provided.</span>}
          </div>
        </div>

        {/* Generated By */}
        <div className="border rounded-xl p-5 bg-gradient-to-br from-[#1a3a5c]/5 to-[#0057FF]/5 border-[#1a3a5c]/20">
          <h3 className="text-xs font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
            <Info className="h-3.5 w-3.5" />
            Ticket Generation Info
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Generated By</label>
              <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-background text-sm font-medium" data-testid="view-field-created-by">
                <div className="h-6 w-6 rounded-full bg-[#1a3a5c] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {createdBy ? createdBy.charAt(0).toUpperCase() : "?"}
                </div>
                {createdBy || <span className="text-muted-foreground">Unknown</span>}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Support Group</label>
              <div className={`flex items-center gap-2 h-9 px-3 border rounded-md text-xs font-semibold ${groupInfo.color}`}>
                <GroupIcon className="h-3.5 w-3.5" />
                {groupInfo.label}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Ticket ID</label>
              <Input className={readonlyFieldClass} value={`#${ticket.id}`} readOnly />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button variant="outline" onClick={onBack} className="gap-1.5" data-testid="button-view-back-bottom">
            <ChevronDown className="h-4 w-4 rotate-90" />
            Back to List
          </Button>
          <Button className="bg-[#1a3a5c] hover:bg-[#1a3a5c]/90 text-white gap-1.5" onClick={onEdit} data-testid="button-view-edit-bottom">
            <Edit className="h-4 w-4" />
            Edit Ticket
          </Button>
        </div>
      </div>
    </div>
  );
}

function TicketListView({
  tickets,
  isLoading,
  supportCategories,
  onEdit,
  onDelete,
  onView,
}: {
  tickets: TicketWithCustomer[];
  isLoading: boolean;
  supportCategories: SupportCategory[];
  onEdit: (ticket: TicketWithCustomer) => void;
  onDelete: (id: number) => void;
  onView: (ticket: TicketWithCustomer) => void;
}) {
  const [search, setSearch] = useState("");
  const [entriesCount, setEntriesCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState("customers");

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAssignedTo, setFilterAssignedTo] = useState("all");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");

  const allTickets = tickets;

  const groupFiltered = allTickets.filter(t => {
    const sg = (t as any).supportGroup || "customers";
    return sg === activeGroup;
  });

  const filtered = groupFiltered.filter(t => {
    if (search) {
      const s = search.toLowerCase();
      const matchSearch =
        t.subject.toLowerCase().includes(s) ||
        t.ticketNumber.toLowerCase().includes(s) ||
        (t.customerName || "").toLowerCase().includes(s) ||
        (t.customerCode || "").toLowerCase().includes(s) ||
        (t.customerPhone || "").toLowerCase().includes(s) ||
        (t.description || "").toLowerCase().includes(s);
      if (!matchSearch) return false;
    }
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterAssignedTo !== "all" && (t.assignedTo || "") !== filterAssignedTo) return false;
    if (filterFromDate && t.createdAt && new Date(t.createdAt) < new Date(filterFromDate)) return false;
    if (filterToDate && t.createdAt && new Date(t.createdAt) > new Date(filterToDate + "T23:59:59")) return false;
    return true;
  });

  const totalTickets = groupFiltered.length;
  const pendingTickets = groupFiltered.filter(t => t.status === "open").length;
  const processingTickets = groupFiltered.filter(t => t.status === "in_progress").length;
  const solvedTickets = groupFiltered.filter(t => t.status === "resolved" || t.status === "closed").length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesCount));
  const paginated = filtered.slice((currentPage - 1) * entriesCount, currentPage * entriesCount);

  const uniqueAssignees = Array.from(new Set(allTickets.map(t => t.assignedTo).filter(Boolean))) as string[];

  const categoryNames = supportCategories.length > 0
    ? supportCategories.map(c => c.name)
    : ["General", "Connectivity", "Billing", "Speed Issue", "Hardware", "Installation"];

  const groupTabs = [
    { key: "customers", label: "Customers", icon: Users },
    { key: "resellers", label: "Resellers", icon: UserCheck },
    { key: "pops", label: "POP's", icon: Wifi },
    { key: "vendors", label: "Vendors", icon: Building2 },
  ];

  const priorityConfig: Record<string, string> = {
    critical: "bg-red-600 text-white",
    high: "bg-red-500 text-white",
    medium: "bg-amber-500 text-white",
    low: "bg-green-500 text-white",
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    open: { label: "Pending", color: "bg-amber-500 text-white" },
    in_progress: { label: "Processing", color: "bg-blue-500 text-white" },
    resolved: { label: "Solved", color: "bg-green-500 text-white" },
    closed: { label: "Closed", color: "bg-gray-500 text-white" },
  };

  const getDuration = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="mt-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {groupTabs.map(g => {
            const Icon = g.icon;
            return (
              <Button
                key={g.key}
                size="sm"
                variant={activeGroup === g.key ? "default" : "outline"}
                className={`text-xs gap-1.5 ${activeGroup === g.key ? "bg-[#1a3a5c]" : ""}`}
                onClick={() => { setActiveGroup(g.key); setCurrentPage(1); }}
                data-testid={`button-ticket-group-${g.key}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {g.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white" data-testid="card-total-tickets">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-blue-100">Total Tickets</p>
                <p className="text-3xl font-bold mt-1">{totalTickets}</p>
                <p className="text-[10px] text-blue-200 mt-1">Total tickets of Current Month</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <TicketCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-green-500 to-green-600 text-white" data-testid="card-pending-tickets">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-green-100">Pending Tickets</p>
                <p className="text-3xl font-bold mt-1">{pendingTickets}</p>
                <p className="text-[10px] text-green-200 mt-1">Total pending tickets for filtered data</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <CircleDot className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-orange-500 to-red-500 text-white" data-testid="card-processing-tickets">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-orange-100">Processing Tickets</p>
                <p className="text-3xl font-bold mt-1">{processingTickets}</p>
                <p className="text-[10px] text-orange-200 mt-1">Total processing tickets for filtered data</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-teal-600 to-teal-700 text-white" data-testid="card-solved-tickets">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-teal-100">Solved Tickets</p>
                <p className="text-3xl font-bold mt-1">{solvedTickets}</p>
                <p className="text-[10px] text-teal-200 mt-1">Total solved tickets for filtered data</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg bg-card p-4">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-foreground w-full"
          data-testid="button-toggle-filters"
        >
          <Filter className="h-4 w-4 text-muted-foreground" />
          Advanced Filters
          {filtersOpen ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
        </button>
        {filtersOpen && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase mb-1 block">Support Category</label>
                <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs" data-testid="filter-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="connectivity">Connectivity</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="speed">Speed Issue</SelectItem>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="installation">Installation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase mb-1 block">Status</label>
                <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs" data-testid="filter-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Pending</SelectItem>
                    <SelectItem value="in_progress">Processing</SelectItem>
                    <SelectItem value="resolved">Solved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase mb-1 block">Solved By / Assign To</label>
                <Select value={filterAssignedTo} onValueChange={(v) => { setFilterAssignedTo(v); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs" data-testid="filter-assigned"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueAssignees.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase mb-1 block">Priority</label>
                <Select value={filterPriority} onValueChange={(v) => { setFilterPriority(v); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs" data-testid="filter-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase mb-1 block">From Date</label>
                <Input
                  type="date"
                  className="h-9 text-xs"
                  value={filterFromDate}
                  onChange={(e) => { setFilterFromDate(e.target.value); setCurrentPage(1); }}
                  data-testid="filter-from-date"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase mb-1 block">To Date</label>
                <Input
                  type="date"
                  className="h-9 text-xs"
                  value={filterToDate}
                  onChange={(e) => { setFilterToDate(e.target.value); setCurrentPage(1); }}
                  data-testid="filter-to-date"
                />
              </div>
              <div className="lg:col-span-2 flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setFilterCategory("all");
                    setFilterStatus("all");
                    setFilterPriority("all");
                    setFilterAssignedTo("all");
                    setFilterFromDate("");
                    setFilterToDate("");
                    setCurrentPage(1);
                  }}
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground">SHOW</span>
          <Select value={String(entriesCount)} onValueChange={(v) => { setEntriesCount(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger className="h-7 w-[65px] text-xs" data-testid="select-ticket-entries"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="font-semibold text-muted-foreground">ENTRIES</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground">SEARCH:</span>
          <Input
            className="h-7 w-[200px] text-xs"
            placeholder="Ticket, Customer, Phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            data-testid="input-search-tickets"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1a3a5c] border-[#1a3a5c]">
                  <TableHead className="text-white text-[11px] font-semibold w-[70px]">Ticket No.</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold">Client Code</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold">Customer Name</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold">Phone</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold">Zone</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold">Problem</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold w-[80px]">Priority</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold">Complain Time</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold w-[90px]">Status</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold">Assign To</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold">Duration</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold w-[80px] text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                      <LifeBuoy className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">No tickets found</p>
                      <p className="text-xs mt-1">All quiet on the support front</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((ticket) => {
                    const sConfig = statusConfig[ticket.status] || statusConfig.open;
                    return (
                      <TableRow key={ticket.id} data-testid={`row-ticket-${ticket.id}`} className="hover:bg-muted/50">
                        <TableCell className="text-xs font-mono font-medium cursor-pointer" data-testid={`text-ticket-number-${ticket.id}`} onClick={() => onView(ticket)}>
                          <span className="text-[#0057FF] hover:underline">{ticket.ticketNumber}</span>
                        </TableCell>
                        <TableCell className="text-xs cursor-pointer" data-testid={`text-ticket-code-${ticket.id}`} onClick={() => onView(ticket)}>
                          <span className="text-[#0057FF] hover:underline">{ticket.customerCode || ((ticket as any).entityName) || `#${ticket.customerId}`}</span>
                        </TableCell>
                        <TableCell className="text-xs font-medium cursor-pointer" data-testid={`text-ticket-customer-${ticket.id}`} onClick={() => onView(ticket)}>
                          <span className="hover:text-[#0057FF] hover:underline transition-colors">{ticket.customerName || (ticket as any).entityName || "Unknown"}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground" data-testid={`text-ticket-phone-${ticket.id}`}>
                          {ticket.customerPhone || "-"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground" data-testid={`text-ticket-zone-${ticket.id}`}>
                          {ticket.customerArea || "-"}
                        </TableCell>
                        <TableCell className="text-xs max-w-[150px]" data-testid={`text-ticket-problem-${ticket.id}`}>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">{ticket.subject}</span>
                        </TableCell>
                        <TableCell data-testid={`badge-ticket-priority-${ticket.id}`}>
                          <Badge className={`text-[10px] font-semibold capitalize border-0 ${priorityConfig[ticket.priority] || priorityConfig.medium}`}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap" data-testid={`text-ticket-time-${ticket.id}`}>
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString("en-US", {
                            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true
                          }) : "-"}
                        </TableCell>
                        <TableCell data-testid={`badge-ticket-status-${ticket.id}`}>
                          <Badge className={`text-[10px] font-semibold capitalize border-0 ${sConfig.color}`}>
                            {sConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs" data-testid={`text-ticket-assigned-${ticket.id}`}>
                          {ticket.assignedTo ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">{ticket.assignedTo}</span>
                          ) : (
                            <Button variant="outline" size="sm" className="text-[10px] h-6 px-2 gap-1 text-blue-600 border-blue-200" data-testid={`button-assign-${ticket.id}`}>
                              <UserPlus className="h-3 w-3" /> Assign
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap" data-testid={`text-ticket-duration-${ticket.id}`}>
                          <div className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {ticket.createdAt ? getDuration(ticket.createdAt) : "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(ticket)} data-testid={`button-view-ticket-${ticket.id}`} title="View Ticket">
                              <Eye className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(ticket)} data-testid={`button-edit-ticket-${ticket.id}`} title="Edit Ticket">
                              <Edit className="h-4 w-4 text-[#0057FF]" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(ticket.id)} data-testid={`button-delete-ticket-${ticket.id}`} title="Delete Ticket">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span data-testid="text-ticket-showing">
          Showing {filtered.length === 0 ? 0 : (currentPage - 1) * entriesCount + 1} to {Math.min(currentPage * entriesCount, filtered.length)} of {filtered.length} entries
          {search && ` (filtered from ${groupFiltered.length} total entries)`}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="text-xs h-7 px-2" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} data-testid="button-ticket-prev">
              Previous
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className={`text-xs h-7 w-7 p-0 ${currentPage === page ? "bg-[#0057FF]" : ""}`}
                  onClick={() => setCurrentPage(page)}
                  data-testid={`button-ticket-page-${page}`}
                >
                  {page}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" className="text-xs h-7 px-2" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} data-testid="button-ticket-next">
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function TicketHistoryView({ tickets, isLoading, supportCategories }: { tickets: TicketWithCustomer[]; isLoading: boolean; supportCategories: SupportCategory[] }) {
  const historyTickets = tickets.filter(t => t.status === "resolved" || t.status === "closed");
  const [search, setSearch] = useState("");
  const [entriesCount, setEntriesCount] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeGroup, setActiveGroup] = useState("customers");

  const [filterSolvedBy, setFilterSolvedBy] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterZone, setFilterZone] = useState("all");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");

  const groupFiltered = historyTickets.filter(t => {
    const sg = (t as any).supportGroup || "customers";
    return sg === activeGroup;
  });

  const filtered = groupFiltered.filter(t => {
    if (search) {
      const s = search.toLowerCase();
      const matchSearch =
        t.subject.toLowerCase().includes(s) ||
        t.ticketNumber.toLowerCase().includes(s) ||
        (t.customerName || "").toLowerCase().includes(s) ||
        (t.customerCode || "").toLowerCase().includes(s) ||
        (t.customerPhone || "").toLowerCase().includes(s);
      if (!matchSearch) return false;
    }
    if (filterSolvedBy !== "all" && (t.assignedTo || "") !== filterSolvedBy) return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (filterZone !== "all" && (t.customerArea || "") !== filterZone) return false;
    if (filterFromDate) {
      const ticketDate = t.resolvedAt ? new Date(t.resolvedAt) : t.createdAt ? new Date(t.createdAt) : null;
      if (ticketDate && ticketDate < new Date(filterFromDate)) return false;
    }
    if (filterToDate) {
      const ticketDate = t.resolvedAt ? new Date(t.resolvedAt) : t.createdAt ? new Date(t.createdAt) : null;
      if (ticketDate && ticketDate > new Date(filterToDate + "T23:59:59")) return false;
    }
    return true;
  });

  const totalTickets = filtered.length;
  const fromClientPortal = 0;
  const fromAdminPortal = filtered.length;
  const highCount = filtered.filter(t => t.priority === "high" || t.priority === "critical").length;
  const mediumCount = filtered.filter(t => t.priority === "medium").length;
  const lowCount = filtered.filter(t => t.priority === "low").length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesCount));
  const paginated = filtered.slice((currentPage - 1) * entriesCount, currentPage * entriesCount);

  const uniqueSolvers = Array.from(new Set(historyTickets.map(t => t.assignedTo).filter(Boolean))) as string[];
  const uniqueZones = Array.from(new Set(historyTickets.map(t => t.customerArea).filter(Boolean))) as string[];
  const categoryNames = supportCategories.length > 0
    ? supportCategories.map(c => c.name)
    : Array.from(new Set(historyTickets.map(t => t.category).filter(Boolean))) as string[];

  const getDuration = (createdAt: string, resolvedAt?: string | null) => {
    const start = new Date(createdAt);
    const end = resolvedAt ? new Date(resolvedAt) : new Date();
    const diff = end.getTime() - start.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${days}d:${String(hours).padStart(2, "0")}h:${String(mins).padStart(2, "0")}m:${String(secs).padStart(2, "0")}s`;
  };

  const groupTabs = [
    { key: "customers", label: "Customers", icon: Users },
    { key: "resellers", label: "Resellers", icon: UserCheck },
    { key: "pops", label: "POP's", icon: Wifi },
    { key: "vendors", label: "Vendors", icon: Building2 },
  ];

  const exportCSV = () => {
    const headers = ["Sr.No.", "Date", "Ticket No.", "Client Code", "Username", "Mobile No.", "Zone", "Category", "Solve Time", "Solved By", "Duration"];
    const rows = filtered.map((t, i) => [
      i + 1,
      t.createdAt ? new Date(t.createdAt).toLocaleString() : "",
      t.ticketNumber,
      t.customerCode || "",
      t.customerName || "",
      t.customerPhone || "",
      t.customerArea || "",
      t.category,
      t.resolvedAt ? new Date(t.resolvedAt).toLocaleString() : "",
      t.assignedTo || "",
      t.createdAt ? getDuration(t.createdAt, t.resolvedAt) : "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `support_history_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    window.print();
  };

  const renderPagination = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="mt-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-[#0057FF]" />
          <div>
            <h2 className="text-lg font-bold" data-testid="text-history-title">Monthly Support</h2>
            <p className="text-xs text-muted-foreground">Monthly Support History</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Support & Ticketing &gt; <span className="font-semibold text-foreground">Support History</span>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {groupTabs.map(g => {
            const Icon = g.icon;
            return (
            <Button
              key={g.key}
              size="sm"
              variant={activeGroup === g.key ? "default" : "outline"}
              className={`text-xs gap-1.5 ${activeGroup === g.key ? "bg-[#1a3a5c] hover:bg-[#1a3a5c]/90" : ""}`}
              onClick={() => { setActiveGroup(g.key); setCurrentPage(1); }}
              data-testid={`button-history-group-${g.key}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {g.label}
            </Button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="text-xs gap-1.5 bg-[#1a3a5c] text-white hover:bg-[#1a3a5c]/90 border-0" onClick={exportPDF} data-testid="button-generate-pdf">
            <FileText className="h-3.5 w-3.5" />
            Generate PDF
          </Button>
          <Button size="sm" variant="outline" className="text-xs gap-1.5 bg-[#1a3a5c] text-white hover:bg-[#1a3a5c]/90 border-0" onClick={exportCSV} data-testid="button-generate-csv">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Generate CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white" data-testid="card-history-total">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-blue-100">Total Tickets</p>
                <p className="text-3xl font-bold mt-1">{totalTickets}</p>
                <p className="text-[10px] text-blue-200 mt-1">Total tickets according to all filters.!</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-green-500 to-green-600 text-white" data-testid="card-history-client-portal">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-green-100">From Client Portal</p>
                <p className="text-3xl font-bold mt-1">{fromClientPortal}</p>
                <p className="text-[10px] text-green-200 mt-1">Tickets from client portal according to all filters.!</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Monitor className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-red-500 to-orange-500 text-white" data-testid="card-history-admin-portal">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-orange-100">From Admin Portal</p>
                <p className="text-3xl font-bold mt-1">{fromAdminPortal}</p>
                <p className="text-[10px] text-orange-200 mt-1">Tickets from admin portal according to all filters.!</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-amber-500 to-orange-500 text-white" data-testid="card-history-priority">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-amber-100">Ticket's Priority</p>
                <p className="text-2xl font-bold mt-1">H:{highCount} M:{mediumCount} L:{lowCount}</p>
                <p className="text-[10px] text-amber-200 mt-1">Total processing tickets according to all filters.!</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">From Date</label>
          <Input
            type="date"
            className="h-9 text-xs"
            value={filterFromDate}
            onChange={(e) => { setFilterFromDate(e.target.value); setCurrentPage(1); }}
            data-testid="input-history-from-date"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">To Date</label>
          <Input
            type="date"
            className="h-9 text-xs"
            value={filterToDate}
            onChange={(e) => { setFilterToDate(e.target.value); setCurrentPage(1); }}
            data-testid="input-history-to-date"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Solved By</label>
          <Select value={filterSolvedBy} onValueChange={(v) => { setFilterSolvedBy(v); setCurrentPage(1); }}>
            <SelectTrigger className="h-9 text-xs" data-testid="select-history-solved-by"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Select</SelectItem>
              {uniqueSolvers.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Problem Category</label>
          <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setCurrentPage(1); }}>
            <SelectTrigger className="h-9 text-xs" data-testid="select-history-category"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Select</SelectItem>
              {categoryNames.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Zone</label>
          <Select value={filterZone} onValueChange={(v) => { setFilterZone(v); setCurrentPage(1); }}>
            <SelectTrigger className="h-9 text-xs" data-testid="select-history-zone"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Select</SelectItem>
              {uniqueZones.map(z => (
                <SelectItem key={z} value={z}>{z}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground">SHOW</span>
          <Select value={String(entriesCount)} onValueChange={(v) => { setEntriesCount(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger className="h-7 w-[70px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="font-semibold text-muted-foreground">ENTRIES</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground">SEARCH:</span>
          <Input
            className="h-7 w-[200px] text-xs"
            placeholder="Search history..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            data-testid="input-search-history"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1a3a5c] border-[#1a3a5c]">
                  <TableHead className="text-white text-[11px] font-semibold">Sr.No.</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold">Date</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold">TicketNo.</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold">ClientCode</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold">Username</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold">MobileNo.</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold">Zone</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold">Category</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold whitespace-nowrap">Solve Time ⬇</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold">Solved By</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold">Duration</TableHead>
                  <TableHead className="text-white text-[11px] font-semibold text-center">Ticketing Info</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                      <History className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium" data-testid="text-no-history">No resolved tickets found</p>
                      <p className="text-xs mt-1">Resolved and closed tickets will appear here</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((ticket, index) => (
                    <TableRow key={ticket.id} className="hover:bg-muted/30 border-b" data-testid={`row-history-ticket-${ticket.id}`}>
                      <TableCell className="text-xs text-center font-medium">{(currentPage - 1) * entriesCount + index + 1}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString("en-US", { month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "-"}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{ticket.ticketNumber}</TableCell>
                      <TableCell className="text-xs font-mono">{ticket.customerCode || "-"}</TableCell>
                      <TableCell className="text-xs font-medium">{ticket.customerName || `#${ticket.customerId}`}</TableCell>
                      <TableCell className="text-xs">{ticket.customerPhone || "-"}</TableCell>
                      <TableCell className="text-xs">{ticket.customerArea || "-"}</TableCell>
                      <TableCell className="text-xs text-blue-600 dark:text-blue-400">{ticket.category || "-"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString("en-US", { month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "-"}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium cursor-pointer hover:underline">
                          {ticket.assignedTo || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-red-500 font-medium whitespace-nowrap">
                          {ticket.createdAt ? getDuration(ticket.createdAt, ticket.resolvedAt) : "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-blue-500/10 hover:bg-blue-500/20" data-testid={`button-history-info-${ticket.id}`}>
                          <Info className="h-3.5 w-3.5 text-blue-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {filtered.length === 0 ? 0 : (currentPage - 1) * entriesCount + 1} to {Math.min(currentPage * entriesCount, filtered.length)} of {filtered.length} entries
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="text-xs h-7 px-2" disabled={currentPage === 1} onClick={() => setCurrentPage(1)} data-testid="button-history-first">
            First
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-7 px-2" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} data-testid="button-history-prev">
            Previous
          </Button>
          {renderPagination().map((page, i) =>
            page === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1">...</span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className={`text-xs h-7 w-7 p-0 ${currentPage === page ? "bg-[#0057FF]" : ""}`}
                onClick={() => setCurrentPage(page as number)}
              >
                {page}
              </Button>
            )
          )}
          <Button variant="outline" size="sm" className="text-xs h-7 px-2" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} data-testid="button-history-next">
            Next
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-7 px-2" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} data-testid="button-history-last">
            Last
          </Button>
        </div>
      </div>
    </div>
  );
}

function SupportCategoriesView() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [entriesCount, setEntriesCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SupportCategory | null>(null);
  const [activeGroup, setActiveGroup] = useState("customers");

  const { data: categories, isLoading } = useQuery<SupportCategory[]>({
    queryKey: ["/api/support-categories"],
  });

  const form = useForm<InsertSupportCategory>({
    resolver: zodResolver(insertSupportCategorySchema),
    defaultValues: {
      name: "",
      department: "",
      categoryType: "for_everyone",
      details: "",
      targetGroup: "customers",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSupportCategory) => {
      const res = await apiRequest("POST", "/api/support-categories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support-categories"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Support category created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertSupportCategory> }) => {
      const res = await apiRequest("PATCH", `/api/support-categories/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support-categories"] });
      setDialogOpen(false);
      setEditingCategory(null);
      form.reset();
      toast({ title: "Support category updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/support-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support-categories"] });
      toast({ title: "Support category deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingCategory(null);
    form.reset({ name: "", department: "", categoryType: "for_everyone", details: "", targetGroup: activeGroup });
    setDialogOpen(true);
  };

  const openEdit = (cat: SupportCategory) => {
    setEditingCategory(cat);
    form.reset({
      name: cat.name,
      department: cat.department,
      categoryType: cat.categoryType,
      details: cat.details || "",
      targetGroup: cat.targetGroup || "clients",
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertSupportCategory) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const allCategories = categories || [];
  const groupFiltered = allCategories.filter(c => (c.targetGroup || "customers") === activeGroup);
  const filtered = groupFiltered.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.department.toLowerCase().includes(s) || (c.details || "").toLowerCase().includes(s);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesCount));
  const paginated = filtered.slice((currentPage - 1) * entriesCount, currentPage * entriesCount);

  const groupButtons = [
    { key: "customers", label: "Customers", icon: Users },
    { key: "resellers", label: "Resellers", icon: UserCheck },
    { key: "pops", label: "POP's", icon: Wifi },
    { key: "vendors", label: "Vendors", icon: Building2 },
  ];

  return (
    <div className="mt-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {groupButtons.map(g => {
            const Icon = g.icon;
            return (
              <Button
                key={g.key}
                size="sm"
                variant={activeGroup === g.key ? "default" : "outline"}
                className={`text-xs gap-1.5 ${activeGroup === g.key ? "bg-[#1a3a5c] hover:bg-[#1a3a5c]/90" : ""}`}
                onClick={() => { setActiveGroup(g.key); setCurrentPage(1); }}
                data-testid={`button-group-${g.key}`}
              >
                <Icon className="h-3.5 w-3.5" /> {g.label}
              </Button>
            );
          })}
        </div>
        <Button size="sm" className="text-xs gap-1.5 bg-[#0057FF]" onClick={openCreate} data-testid="button-add-support-category">
          <Plus className="h-3.5 w-3.5" /> Support Category
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground">SHOW</span>
          <Select value={String(entriesCount)} onValueChange={(v) => { setEntriesCount(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger className="h-7 w-[65px] text-xs" data-testid="select-entries"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="font-semibold text-muted-foreground">ENTRIES</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground">SEARCH:</span>
          <Input
            className="h-7 w-[180px] text-xs"
            placeholder=""
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            data-testid="input-search-categories"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1a3a5c] border-[#1a3a5c]">
                <TableHead className="text-white text-xs font-semibold w-[60px]">Serial</TableHead>
                <TableHead className="text-white text-xs font-semibold">Support Category</TableHead>
                <TableHead className="text-white text-xs font-semibold">Department</TableHead>
                <TableHead className="text-white text-xs font-semibold w-[140px]">Category Type</TableHead>
                <TableHead className="text-white text-xs font-semibold">Details</TableHead>
                <TableHead className="text-white text-xs font-semibold w-[80px] text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <LifeBuoy className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No support categories found</p>
                    <p className="text-xs mt-1">Create your first support category</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((cat, index) => (
                  <TableRow key={cat.id} data-testid={`row-category-${cat.id}`}>
                    <TableCell className="text-xs font-medium text-center">{(currentPage - 1) * entriesCount + index + 1}</TableCell>
                    <TableCell className="text-xs font-medium" data-testid={`text-category-name-${cat.id}`}>{cat.name}</TableCell>
                    <TableCell className="text-xs" data-testid={`text-category-dept-${cat.id}`}>{cat.department}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-semibold ${
                          cat.categoryType === "only_for_office"
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-green-500 text-white border-green-500"
                        }`}
                        data-testid={`badge-category-type-${cat.id}`}
                      >
                        {cat.categoryType === "only_for_office" ? "Only For Office" : "For Everyone"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate" data-testid={`text-category-details-${cat.id}`}>
                      {cat.details || ""}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)} data-testid={`button-edit-category-${cat.id}`}>
                          <Edit className="h-3.5 w-3.5 text-[#0057FF]" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(cat.id)} data-testid={`button-delete-category-${cat.id}`}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span data-testid="text-showing-entries">
          Showing {filtered.length === 0 ? 0 : (currentPage - 1) * entriesCount + 1} to {Math.min(currentPage * entriesCount, filtered.length)} of {filtered.length} entries
          {search && ` (filtered from ${groupFiltered.length} total entries)`}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              data-testid="button-prev-page"
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className={`text-xs h-7 w-7 p-0 ${currentPage === page ? "bg-[#0057FF]" : ""}`}
                onClick={() => setCurrentPage(page)}
                data-testid={`button-page-${page}`}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              data-testid="button-next-page"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Support Category" : "Add Support Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Update the support category details" : "Create a new support category for ticket management"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Support Category Name</FormLabel><FormControl>
                  <Input placeholder="e.g. Customer Support" data-testid="input-category-name" {...field} />
                </FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="department" render={({ field }) => (
                <FormItem><FormLabel>Department</FormLabel><FormControl>
                  <Input placeholder="e.g. Service, Sales & Marketing" data-testid="input-category-dept" {...field} />
                </FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="categoryType" render={({ field }) => (
                <FormItem><FormLabel>Category Type</FormLabel><FormControl>
                  <Select onValueChange={field.onChange} value={field.value || "for_everyone"}>
                    <SelectTrigger data-testid="select-category-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="for_everyone">For Everyone</SelectItem>
                      <SelectItem value="only_for_office">Only For Office</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="targetGroup" render={({ field }) => (
                <FormItem><FormLabel>Target Group</FormLabel><FormControl>
                  <Select onValueChange={field.onChange} value={field.value || "customers"}>
                    <SelectTrigger data-testid="select-target-group"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customers">Customers</SelectItem>
                      <SelectItem value="resellers">Resellers</SelectItem>
                      <SelectItem value="pops">POP's</SelectItem>
                      <SelectItem value="vendors">Vendors</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="details" render={({ field }) => (
                <FormItem><FormLabel>Details</FormLabel><FormControl>
                  <Textarea placeholder="Category description or details..." data-testid="input-category-details" {...field} value={field.value || ""} />
                </FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-category">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingCategory ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
