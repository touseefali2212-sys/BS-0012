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
  MessageSquare,
  Send,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Smartphone,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { insertBulkMessageSchema, type BulkMessage, type InsertBulkMessage } from "@shared/schema";
import { z } from "zod";

const bulkMessageFormSchema = insertBulkMessageSchema.extend({
  title: z.string().min(2, "Title is required"),
  message: z.string().min(5, "Message must be at least 5 characters"),
  channel: z.string().min(1, "Channel is required"),
  createdAt: z.string(),
});

export default function BulkMessagingPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<BulkMessage | null>(null);

  const { data: messages, isLoading } = useQuery<BulkMessage[]>({
    queryKey: ["/api/bulk-messages"],
  });

  const form = useForm<InsertBulkMessage>({
    resolver: zodResolver(bulkMessageFormSchema),
    defaultValues: {
      title: "",
      message: "",
      channel: "sms",
      targetType: "all",
      targetArea: "",
      targetStatus: "",
      recipientCount: 0,
      sentCount: 0,
      failedCount: 0,
      status: "draft",
      scheduledAt: "",
      createdBy: "",
      createdAt: new Date().toISOString(),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertBulkMessage) => {
      const res = await apiRequest("POST", "/api/bulk-messages", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bulk-messages"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Campaign created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertBulkMessage> }) => {
      const res = await apiRequest("PATCH", `/api/bulk-messages/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bulk-messages"] });
      setDialogOpen(false);
      setEditingMessage(null);
      form.reset();
      toast({ title: "Campaign updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bulk-messages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bulk-messages"] });
      toast({ title: "Campaign deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const sendNowMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/bulk-messages/${id}`, { status: "sending" });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const res = await apiRequest("PATCH", `/api/bulk-messages/${id}`, {
        status: "sent",
        sentAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bulk-messages"] });
      toast({ title: "Campaign sent successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingMessage(null);
    form.reset({
      title: "",
      message: "",
      channel: "sms",
      targetType: "all",
      targetArea: "",
      targetStatus: "",
      recipientCount: 0,
      sentCount: 0,
      failedCount: 0,
      status: "draft",
      scheduledAt: "",
      createdBy: "",
      createdAt: new Date().toISOString(),
    });
    setDialogOpen(true);
  };

  const openEdit = (msg: BulkMessage) => {
    setEditingMessage(msg);
    form.reset({
      title: msg.title,
      message: msg.message,
      channel: msg.channel,
      targetType: msg.targetType,
      targetArea: msg.targetArea || "",
      targetStatus: msg.targetStatus || "",
      recipientCount: msg.recipientCount ?? 0,
      sentCount: msg.sentCount ?? 0,
      failedCount: msg.failedCount ?? 0,
      status: msg.status,
      scheduledAt: msg.scheduledAt || "",
      createdBy: msg.createdBy || "",
      createdAt: msg.createdAt,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: InsertBulkMessage) => {
    if (editingMessage) {
      updateMutation.mutate({ id: editingMessage.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = (messages || []).filter((m) => {
    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.channel.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusConfig: Record<string, { icon: any; color: string }> = {
    draft: { icon: Clock, color: "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900" },
    scheduled: { icon: Clock, color: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950" },
    sending: { icon: Send, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950" },
    sent: { icon: CheckCircle, color: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" },
    failed: { icon: XCircle, color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950" },
  };

  const channelConfig: Record<string, { icon: any; color: string }> = {
    sms: { icon: Smartphone, color: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950" },
    email: { icon: Mail, color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950" },
    whatsapp: { icon: MessageSquare, color: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" },
    push: { icon: Bell, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950" },
  };

  const allMessages = messages || [];
  const totalCampaigns = allMessages.length;
  const sentCampaigns = allMessages.filter((m) => m.status === "sent").length;
  const scheduledCampaigns = allMessages.filter((m) => m.status === "scheduled").length;
  const failedCampaigns = allMessages.filter((m) => m.status === "failed").length;

  const watchTargetType = form.watch("targetType");

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-bulk-messaging-title">Bulk Messaging</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Send bulk SMS, email, and push notifications</p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-campaign">
          <Plus className="h-4 w-4 mr-1" />
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-campaigns">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <span className="text-sm font-medium text-muted-foreground">Total Campaigns</span>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-campaigns">{totalCampaigns}</div>
            )}
          </CardContent>
        </Card>
        <Card data-testid="card-sent-campaigns">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <span className="text-sm font-medium text-muted-foreground">Sent</span>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-sent-campaigns">{sentCampaigns}</div>
            )}
          </CardContent>
        </Card>
        <Card data-testid="card-scheduled-campaigns">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <span className="text-sm font-medium text-muted-foreground">Scheduled</span>
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-scheduled-campaigns">{scheduledCampaigns}</div>
            )}
          </CardContent>
        </Card>
        <Card data-testid="card-failed-campaigns">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <span className="text-sm font-medium text-muted-foreground">Failed</span>
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-failed-campaigns">{failedCampaigns}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-campaigns"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-campaign-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
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
              <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No campaigns found</p>
              <p className="text-sm mt-1">Create a new campaign to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead className="hidden md:table-cell">Target</TableHead>
                    <TableHead className="hidden lg:table-cell">Recipients</TableHead>
                    <TableHead className="hidden lg:table-cell">Sent</TableHead>
                    <TableHead className="hidden lg:table-cell">Failed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((msg) => {
                    const sConfig = statusConfig[msg.status] || statusConfig.draft;
                    const StatusIcon = sConfig.icon;
                    const cConfig = channelConfig[msg.channel] || channelConfig.sms;
                    const ChannelIcon = cConfig.icon;
                    return (
                      <TableRow key={msg.id} data-testid={`row-campaign-${msg.id}`}>
                        <TableCell>
                          <div className="font-medium max-w-[200px] truncate" data-testid={`text-campaign-title-${msg.id}`}>{msg.title}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${cConfig.color}`} data-testid={`badge-channel-${msg.id}`}>
                            <ChannelIcon className="h-3 w-3 mr-1" />
                            {msg.channel}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground" data-testid={`text-target-${msg.id}`}>
                          {msg.targetType === "all" ? "All Customers" : msg.targetType === "area" ? `Area: ${msg.targetArea || "—"}` : msg.targetType === "status" ? `Status: ${msg.targetStatus || "—"}` : "Custom"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm" data-testid={`text-recipients-${msg.id}`}>
                          {msg.recipientCount ?? 0}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-green-600 dark:text-green-400" data-testid={`text-sent-count-${msg.id}`}>
                          {msg.sentCount ?? 0}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-red-600 dark:text-red-400" data-testid={`text-failed-count-${msg.id}`}>
                          {msg.failedCount ?? 0}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${sConfig.color}`} data-testid={`badge-status-${msg.id}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {msg.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground" data-testid={`text-created-${msg.id}`}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-campaign-actions-${msg.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(msg)} data-testid={`button-edit-campaign-${msg.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {(msg.status === "draft" || msg.status === "scheduled") && (
                                <DropdownMenuItem
                                  onClick={() => sendNowMutation.mutate(msg.id)}
                                  data-testid={`button-send-campaign-${msg.id}`}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Now
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteMutation.mutate(msg.id)}
                                data-testid={`button-delete-campaign-${msg.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-campaign-form">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              {editingMessage ? "Edit Campaign" : "New Campaign"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Campaign title" data-testid="input-campaign-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter your message..." rows={4} data-testid="input-campaign-message" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-campaign-channel">
                            <SelectValue placeholder="Select channel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="push">Push</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-campaign-target">
                            <SelectValue placeholder="Select target" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Customers</SelectItem>
                          <SelectItem value="area">By Area</SelectItem>
                          <SelectItem value="status">By Status</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {watchTargetType === "area" && (
                <FormField
                  control={form.control}
                  name="targetArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Area</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Enter area name" data-testid="input-campaign-target-area" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {watchTargetType === "status" && (
                <FormField
                  control={form.control}
                  name="targetStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-campaign-target-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="recipientCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Count</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-campaign-recipient-count"
                        />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-campaign-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="sending">Sending</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled At (optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} value={field.value || ""} data-testid="input-campaign-scheduled-at" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="createdBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Created By</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Enter name" data-testid="input-campaign-created-by" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-campaign"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingMessage
                      ? "Update Campaign"
                      : "Create Campaign"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
