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
  Bell,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Send,
  Mail,
  MessageSquare,
  Settings,
  FileText,
  Users,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTab } from "@/hooks/use-tab";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  insertNotificationSchema,
  insertNotificationTemplateSchema,
  insertSmtpSettingsSchema,
  insertSmsSettingsSchema,
  type Notification,
  type NotificationTemplate,
  type SmtpSettings,
  type SmsSettings,
  type NotificationDispatch,
} from "@shared/schema";
import { z } from "zod";

const notificationFormSchema = insertNotificationSchema.extend({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
});

const templateFormSchema = insertNotificationTemplateSchema.extend({
  name: z.string().min(1, "Name is required"),
  body: z.string().min(1, "Body is required"),
});

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  info: { icon: Info, color: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950", label: "Info" },
  warning: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950", label: "Warning" },
  error: { icon: XCircle, color: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950", label: "Error" },
  success: { icon: CheckCircle, color: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950", label: "Success" },
};

function NotificationTypesTab() {
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const counts = (notifications || []).reduce(
    (acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(typeConfig).map(([type, config]) => {
          const TypeIcon = config.icon;
          const count = counts[type] || 0;
          return (
            <Card key={type} data-testid={`card-type-${type}`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-md ${config.color}`}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground capitalize">{config.label}</p>
                    <p className="text-2xl font-bold" data-testid={`text-type-count-${type}`}>{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
          <CardDescription>Overview of all notification types in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground" data-testid="text-total-notifications">
            Total notifications: <span className="font-semibold text-foreground">{notifications?.length || 0}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-unread-notifications">
            Unread: <span className="font-semibold text-foreground">{(notifications || []).filter(n => !n.isRead).length}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function TemplatesTab() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

  const { data: templates, isLoading } = useQuery<NotificationTemplate[]>({
    queryKey: ["/api/notification-templates"],
  });

  const form = useForm({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      type: "general",
      channel: "email",
      subject: "",
      body: "",
      variables: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/notification-templates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-templates"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Template created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/notification-templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-templates"] });
      setDialogOpen(false);
      setEditingTemplate(null);
      form.reset();
      toast({ title: "Template updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notification-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-templates"] });
      toast({ title: "Template deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingTemplate(null);
    form.reset({ name: "", type: "general", channel: "email", subject: "", body: "", variables: "", isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    form.reset({
      name: template.name,
      type: template.type,
      channel: template.channel,
      subject: template.subject || "",
      body: template.body,
      variables: template.variables || "",
      isActive: template.isActive,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: any) => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold" data-testid="text-templates-title">Notification Templates</h3>
          <p className="text-sm text-muted-foreground">Manage reusable notification templates</p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-template">
          <Plus className="h-4 w-4 mr-1" />
          Add Template
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : !templates?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No templates found</p>
              <p className="text-sm mt-1">Create a template to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead className="hidden md:table-cell">Subject</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                      <TableCell className="font-medium" data-testid={`text-template-name-${template.id}`}>{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="no-default-active-elevate text-[10px] capitalize" data-testid={`badge-template-type-${template.id}`}>
                          {template.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="no-default-active-elevate text-[10px] capitalize" data-testid={`badge-template-channel-${template.id}`}>
                          {template.channel}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        <span className="max-w-[200px] truncate block" data-testid={`text-template-subject-${template.id}`}>
                          {template.subject || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`no-default-active-elevate text-[10px] ${template.isActive ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" : "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950"}`}
                          data-testid={`badge-template-active-${template.id}`}
                        >
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-template-actions-${template.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(template)} data-testid={`button-edit-template-${template.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(template.id)} data-testid={`button-delete-template-${template.id}`}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="Template name" data-testid="input-template-name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "general"}>
                      <FormControl><SelectTrigger data-testid="select-template-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="channel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "email"}>
                      <FormControl><SelectTrigger data-testid="select-template-channel"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="push">Push</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl><Input placeholder="Email subject line" data-testid="input-template-subject" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="body" render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl><Textarea placeholder="Template body content..." rows={5} data-testid="input-template-body" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="variables" render={({ field }) => (
                <FormItem>
                  <FormLabel>Variables (comma-separated)</FormLabel>
                  <FormControl><Input placeholder="name, email, amount" data-testid="input-template-variables" {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isActive" render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormLabel className="mt-0">Active</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-template-active" />
                  </FormControl>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)} data-testid="button-cancel-template">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-template">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingTemplate ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PushNotificationsTab() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const form = useForm({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      title: "",
      message: "",
      type: "info",
      channel: "app",
      recipientType: "all",
      recipientId: undefined as number | undefined,
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/notifications", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Notification created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/notifications/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setDialogOpen(false);
      setEditingNotification(null);
      form.reset();
      toast({ title: "Notification updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Notification deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditingNotification(null);
    form.reset({ title: "", message: "", type: "info", channel: "app", recipientType: "all", recipientId: undefined, isRead: false, createdAt: new Date().toISOString() });
    setDialogOpen(true);
  };

  const openEdit = (notification: Notification) => {
    setEditingNotification(notification);
    form.reset({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      channel: notification.channel,
      recipientType: notification.recipientType || "all",
      recipientId: notification.recipientId || undefined,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: any) => {
    if (editingNotification) {
      updateMutation.mutate({ id: editingNotification.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = (notifications || []).filter((n) => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || n.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold" data-testid="text-push-title">Push Notifications</h3>
          <p className="text-sm text-muted-foreground">Manage system notifications and alerts</p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-notification">
          <Plus className="h-4 w-4 mr-1" />
          Create Notification
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search notifications..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-search-notifications" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-notification-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="success">Success</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No notifications found</p>
              <p className="text-sm mt-1">Create a new notification to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Message</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden sm:table-cell">Channel</TableHead>
                    <TableHead>Read</TableHead>
                    <TableHead className="hidden lg:table-cell">Created At</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((notification) => {
                    const config = typeConfig[notification.type] || typeConfig.info;
                    const TypeIcon = config.icon;
                    return (
                      <TableRow key={notification.id} data-testid={`row-notification-${notification.id}`}>
                        <TableCell className={notification.isRead ? "" : "font-bold"}>
                          <span data-testid={`text-notification-title-${notification.id}`}>{notification.title}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          <span className="max-w-[200px] truncate block" data-testid={`text-notification-message-${notification.id}`}>{notification.message}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`no-default-active-elevate text-[10px] capitalize ${config.color}`} data-testid={`badge-notification-type-${notification.id}`}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {notification.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary" className="no-default-active-elevate text-[10px] capitalize" data-testid={`badge-notification-channel-${notification.id}`}>
                            {notification.channel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${notification.isRead ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950"}`} data-testid={`badge-notification-read-${notification.id}`}>
                            {notification.isRead ? "Read" : "Unread"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground" data-testid={`text-notification-date-${notification.id}`}>
                          {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-notification-actions-${notification.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(notification)} data-testid={`button-edit-notification-${notification.id}`}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(notification.id)} data-testid={`button-delete-notification-${notification.id}`}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNotification ? "Edit Notification" : "Create Notification"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input placeholder="Notification title" data-testid="input-notification-title" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl><Textarea placeholder="Notification message..." data-testid="input-notification-message" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "info"}>
                      <FormControl><SelectTrigger data-testid="select-form-notification-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="channel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "app"}>
                      <FormControl><SelectTrigger data-testid="select-notification-channel"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="app">App</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="push">Push</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="recipientType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "all"}>
                      <FormControl><SelectTrigger data-testid="select-recipient-type"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="recipientId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient ID (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="ID" data-testid="input-recipient-id" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)} data-testid="button-cancel-notification">Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-notification">
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingNotification ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BulkCampaignTab() {
  const { toast } = useToast();
  const [channel, setChannel] = useState("email");
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const { data: templates } = useQuery<NotificationTemplate[]>({
    queryKey: ["/api/notification-templates"],
  });

  const { data: dispatches, isLoading: dispatchesLoading } = useQuery<NotificationDispatch[]>({
    queryKey: ["/api/notification-dispatches"],
  });

  const sendBulkMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/notifications/send-bulk", payload);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-dispatches"] });
      toast({ title: `Bulk send complete: ${data.sent}/${data.total} sent` });
      setRecipients("");
      setSubject("");
      setBody("");
      setSelectedTemplate("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId && templateId !== "none") {
      const tpl = templates?.find((t) => t.id === parseInt(templateId));
      if (tpl) {
        setSubject(tpl.subject || "");
        setBody(tpl.body || "");
        setChannel(tpl.channel || "email");
      }
    }
  };

  const handleSendBulk = () => {
    const recipientList = recipients.split(",").map((r) => r.trim()).filter(Boolean);
    if (!recipientList.length) {
      toast({ title: "Error", description: "Please add at least one recipient", variant: "destructive" });
      return;
    }
    if (!body) {
      toast({ title: "Error", description: "Body is required", variant: "destructive" });
      return;
    }
    sendBulkMutation.mutate({
      channel,
      recipients: recipientList,
      subject: channel === "email" ? subject : undefined,
      body,
      templateId: selectedTemplate && selectedTemplate !== "none" ? parseInt(selectedTemplate) : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Send
          </CardTitle>
          <CardDescription>Send notifications to multiple recipients at once</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label data-testid="label-bulk-channel">Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger data-testid="select-bulk-channel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label data-testid="label-bulk-template">Template (optional)</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger data-testid="select-bulk-template"><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {(templates || []).filter((t) => t.isActive).map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label data-testid="label-bulk-recipients">Recipients (comma-separated)</Label>
            <Textarea placeholder="user1@example.com, user2@example.com, ..." value={recipients} onChange={(e) => setRecipients(e.target.value)} rows={3} data-testid="input-bulk-recipients" />
          </div>
          {channel === "email" && (
            <div className="space-y-2">
              <Label data-testid="label-bulk-subject">Subject</Label>
              <Input placeholder="Email subject" value={subject} onChange={(e) => setSubject(e.target.value)} data-testid="input-bulk-subject" />
            </div>
          )}
          <div className="space-y-2">
            <Label data-testid="label-bulk-body">Body</Label>
            <Textarea placeholder="Message body..." value={body} onChange={(e) => setBody(e.target.value)} rows={5} data-testid="input-bulk-body" />
          </div>
          <Button onClick={handleSendBulk} disabled={sendBulkMutation.isPending} data-testid="button-send-bulk">
            {sendBulkMutation.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Sending...</> : <><Send className="h-4 w-4 mr-1" /> Send Bulk</>}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dispatch History</CardTitle>
          <CardDescription>Log of all sent notifications</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {dispatchesLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : !dispatches?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Send className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No dispatches yet</p>
              <p className="text-sm mt-1">Send notifications to see dispatch history</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead className="hidden md:table-cell">Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatches.map((d) => (
                    <TableRow key={d.id} data-testid={`row-dispatch-${d.id}`}>
                      <TableCell>
                        <Badge variant="secondary" className="no-default-active-elevate text-[10px] capitalize" data-testid={`badge-dispatch-channel-${d.id}`}>{d.channel}</Badge>
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-dispatch-recipient-${d.id}`}>{d.recipient}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        <span className="max-w-[200px] truncate block" data-testid={`text-dispatch-subject-${d.id}`}>{d.subject || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`no-default-active-elevate text-[10px] ${d.status === "sent" ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950" : "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950"}`} data-testid={`badge-dispatch-status-${d.id}`}>
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground" data-testid={`text-dispatch-date-${d.id}`}>
                        {d.sentAt ? new Date(d.sentAt).toLocaleString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SmsEmailApiTab() {
  const { toast } = useToast();

  const { data: smtpData, isLoading: smtpLoading } = useQuery<SmtpSettings | null>({
    queryKey: ["/api/smtp-settings"],
  });

  const { data: smsData, isLoading: smsLoading } = useQuery<SmsSettings | null>({
    queryKey: ["/api/sms-settings"],
  });

  const [smtpForm, setSmtpForm] = useState({
    host: "", port: 587, username: "", password: "", fromEmail: "", fromName: "", encryption: "tls", isActive: true,
  });

  const [smsForm, setSmsForm] = useState({
    provider: "custom", apiUrl: "", apiKey: "", apiSecret: "", senderId: "", httpMethod: "POST", headerParams: "", bodyTemplate: "", isActive: true,
  });

  const [smtpLoaded, setSmtpLoaded] = useState(false);
  const [smsLoaded, setSmsLoaded] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState("");
  const [testSmsTo, setTestSmsTo] = useState("");

  if (smtpData && !smtpLoaded) {
    setSmtpForm({
      host: smtpData.host || "",
      port: smtpData.port || 587,
      username: smtpData.username || "",
      password: smtpData.password || "",
      fromEmail: smtpData.fromEmail || "",
      fromName: smtpData.fromName || "",
      encryption: smtpData.encryption || "tls",
      isActive: smtpData.isActive ?? true,
    });
    setSmtpLoaded(true);
  }

  if (smsData && !smsLoaded) {
    setSmsForm({
      provider: smsData.provider || "custom",
      apiUrl: smsData.apiUrl || "",
      apiKey: smsData.apiKey || "",
      apiSecret: smsData.apiSecret || "",
      senderId: smsData.senderId || "",
      httpMethod: smsData.httpMethod || "POST",
      headerParams: smsData.headerParams || "",
      bodyTemplate: smsData.bodyTemplate || "",
      isActive: smsData.isActive ?? true,
    });
    setSmsLoaded(true);
  }

  const saveSmtpMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/smtp-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smtp-settings"] });
      toast({ title: "SMTP settings saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const saveSmsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/sms-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-settings"] });
      toast({ title: "SMS settings saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/notifications/send-email", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-dispatches"] });
      toast({ title: "Test email sent successfully" });
      setTestEmailTo("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const testSmsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/notifications/send-sms", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-dispatches"] });
      toast({ title: "Test SMS sent successfully" });
      setTestSmsTo("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            SMTP Configuration
          </CardTitle>
          <CardDescription>Configure email sending via SMTP</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {smtpLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Host</Label>
                  <Input placeholder="smtp.gmail.com" value={smtpForm.host} onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })} data-testid="input-smtp-host" />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input type="number" placeholder="587" value={smtpForm.port} onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 587 })} data-testid="input-smtp-port" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input placeholder="user@gmail.com" value={smtpForm.username} onChange={(e) => setSmtpForm({ ...smtpForm, username: e.target.value })} data-testid="input-smtp-username" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="App password" value={smtpForm.password} onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })} data-testid="input-smtp-password" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input placeholder="noreply@company.com" value={smtpForm.fromEmail} onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })} data-testid="input-smtp-from-email" />
                </div>
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input placeholder="NetSphere" value={smtpForm.fromName} onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })} data-testid="input-smtp-from-name" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Encryption</Label>
                  <Select value={smtpForm.encryption} onValueChange={(v) => setSmtpForm({ ...smtpForm, encryption: v })}>
                    <SelectTrigger data-testid="select-smtp-encryption"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tls">TLS</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex items-end gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={smtpForm.isActive} onCheckedChange={(v) => setSmtpForm({ ...smtpForm, isActive: v })} data-testid="switch-smtp-active" />
                    <Label>Active</Label>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => saveSmtpMutation.mutate(smtpForm)} disabled={saveSmtpMutation.isPending} data-testid="button-save-smtp">
                  {saveSmtpMutation.isPending ? "Saving..." : "Save SMTP Settings"}
                </Button>
              </div>
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-2">Send Test Email</p>
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="space-y-1 flex-1 min-w-[200px]">
                    <Label>To</Label>
                    <Input placeholder="test@example.com" value={testEmailTo} onChange={(e) => setTestEmailTo(e.target.value)} data-testid="input-test-email-to" />
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (!testEmailTo) { toast({ title: "Error", description: "Enter a recipient email", variant: "destructive" }); return; }
                      testEmailMutation.mutate({ to: testEmailTo, subject: "Test Email from NetSphere", body: "<p>This is a test email from your SMTP configuration.</p>" });
                    }}
                    disabled={testEmailMutation.isPending}
                    data-testid="button-test-email"
                  >
                    {testEmailMutation.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Sending...</> : <><Send className="h-4 w-4 mr-1" /> Test Email</>}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS API Configuration
          </CardTitle>
          <CardDescription>Configure SMS sending via API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {smsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Input placeholder="twilio, custom, etc." value={smsForm.provider} onChange={(e) => setSmsForm({ ...smsForm, provider: e.target.value })} data-testid="input-sms-provider" />
                </div>
                <div className="space-y-2">
                  <Label>API URL</Label>
                  <Input placeholder="https://api.sms-provider.com/send" value={smsForm.apiUrl} onChange={(e) => setSmsForm({ ...smsForm, apiUrl: e.target.value })} data-testid="input-sms-api-url" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input type="password" placeholder="API key" value={smsForm.apiKey} onChange={(e) => setSmsForm({ ...smsForm, apiKey: e.target.value })} data-testid="input-sms-api-key" />
                </div>
                <div className="space-y-2">
                  <Label>API Secret</Label>
                  <Input type="password" placeholder="API secret" value={smsForm.apiSecret} onChange={(e) => setSmsForm({ ...smsForm, apiSecret: e.target.value })} data-testid="input-sms-api-secret" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sender ID</Label>
                  <Input placeholder="NetSphere" value={smsForm.senderId} onChange={(e) => setSmsForm({ ...smsForm, senderId: e.target.value })} data-testid="input-sms-sender-id" />
                </div>
                <div className="space-y-2">
                  <Label>HTTP Method</Label>
                  <Select value={smsForm.httpMethod} onValueChange={(v) => setSmsForm({ ...smsForm, httpMethod: v })}>
                    <SelectTrigger data-testid="select-sms-http-method"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="GET">GET</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Header Params (JSON)</Label>
                <Textarea placeholder='{"X-Custom-Header": "value"}' value={smsForm.headerParams} onChange={(e) => setSmsForm({ ...smsForm, headerParams: e.target.value })} rows={2} data-testid="input-sms-header-params" />
              </div>
              <div className="space-y-2">
                <Label>Body Template</Label>
                <Textarea placeholder='{"to": "{{to}}", "message": "{{message}}", "sender_id": "{{sender_id}}"}' value={smsForm.bodyTemplate} onChange={(e) => setSmsForm({ ...smsForm, bodyTemplate: e.target.value })} rows={3} data-testid="input-sms-body-template" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={smsForm.isActive} onCheckedChange={(v) => setSmsForm({ ...smsForm, isActive: v })} data-testid="switch-sms-active" />
                <Label>Active</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => saveSmsMutation.mutate(smsForm)} disabled={saveSmsMutation.isPending} data-testid="button-save-sms">
                  {saveSmsMutation.isPending ? "Saving..." : "Save SMS Settings"}
                </Button>
              </div>
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-2">Send Test SMS</p>
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="space-y-1 flex-1 min-w-[200px]">
                    <Label>To</Label>
                    <Input placeholder="+923001234567" value={testSmsTo} onChange={(e) => setTestSmsTo(e.target.value)} data-testid="input-test-sms-to" />
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (!testSmsTo) { toast({ title: "Error", description: "Enter a recipient phone number", variant: "destructive" }); return; }
                      testSmsMutation.mutate({ to: testSmsTo, message: "Test SMS from NetSphere" });
                    }}
                    disabled={testSmsMutation.isPending}
                    data-testid="button-test-sms"
                  >
                    {testSmsMutation.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Sending...</> : <><Send className="h-4 w-4 mr-1" /> Test SMS</>}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function NotificationsPage() {
  const [tab, changeTab] = useTab("types");

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-notifications-title">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage notifications, templates, and messaging channels</p>
      </div>

      {tab === "types" && (<div className="mt-5" data-testid="tab-content-types">
          <NotificationTypesTab />
        </div>)}

      {tab === "templates" && (<div className="mt-5" data-testid="tab-content-templates">
          <TemplatesTab />
        </div>)}

      {tab === "push" && (<div className="mt-5" data-testid="tab-content-push">
          <PushNotificationsTab />
        </div>)}

      {tab === "bulk" && (<div className="mt-5" data-testid="tab-content-bulk">
          <BulkCampaignTab />
        </div>)}

      {tab === "api" && (<div className="mt-5" data-testid="tab-content-api">
          <SmsEmailApiTab />
        </div>)}
    </div>
  );
}
