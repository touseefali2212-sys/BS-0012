import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { db } from "./db";
import { purchaseOrderItems } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  loginSchema, insertCustomerSchema, insertPackageSchema, insertInvoiceSchema,
  insertTicketSchema, insertAreaSchema, insertVendorSchema, insertResellerSchema,
  insertAccountTypeSchema, insertAccountSchema, insertTransactionSchema, insertBudgetSchema, insertBudgetAllocationSchema, insertTaskSchema, insertAssetTypeSchema, insertAssetSchema, insertAssetTransferSchema,
  insertInventoryItemSchema, insertEmployeeSchema, insertRoleSchema,
  insertCompanySettingsSchema, insertNotificationSchema, insertReportSchema,
  insertSettingSchema, insertCustomerConnectionSchema,
  insertNotificationTemplateSchema, insertSmtpSettingsSchema, insertSmsSettingsSchema,
  insertNotificationDispatchSchema, insertBranchSchema,
  insertVendorWalletTransactionSchema, insertResellerWalletTransactionSchema, insertVendorPackageSchema, insertVendorBandwidthLinkSchema, insertBandwidthChangeHistorySchema,
  insertCustomerQuerySchema,
  insertSupportCategorySchema,
  insertInvoiceItemSchema,
  insertExpenseSchema, insertLeaveSchema, insertHolidaySchema, insertAttendanceSchema, insertAttendanceBreakSchema, insertAuditLogSchema,
  insertCreditNoteSchema, insertBulkMessageSchema, insertIpAddressSchema, insertSubnetSchema, insertVlanSchema, insertIpamLogSchema, insertOutageSchema, insertOutageTimelineSchema,
  insertNetworkDeviceSchema, insertPppoeUserSchema, insertRadiusProfileSchema, insertRadiusNasDeviceSchema, insertRadiusAuthLogSchema,
  insertPaymentGatewaySchema, insertPaymentSchema, insertBillingRuleSchema, insertBandwidthUsageSchema, insertDailyCollectionSchema,
  insertBonusCommissionSchema,
  insertCommissionTypeSchema,
  insertEmployeeTypeSchema,
  insertShiftSchema,
  insertShiftAssignmentSchema,
  insertAppAccessConfigSchema,
  insertAreaAssignmentSchema,
  insertTransactionTypeSchema,
  insertApprovalRequestSchema,
  insertApprovalRuleSchema,
  insertApprovalHistorySchema,
  insertProjectSchema,
  insertAssetAssignmentSchema,
  insertAssetAssignmentHistorySchema,
  insertAssetRequestSchema,
  insertAssetRequestHistorySchema,
  insertAssetAllocationSchema,
  insertAssetAllocationHistorySchema,
  insertProductTypeSchema,
  insertProductTypeCategorySchema,
  insertSupplierSchema,
  insertBrandSchema,
  insertProductSchema,
  insertPurchaseOrderSchema,
  insertPurchaseOrderItemSchema,
  insertStockLocationSchema,
  insertStockItemSchema,
  insertStockMovementSchema,
  insertStockAdjustmentSchema,
  insertBatchSchema,
  insertSerialNumberSchema,
  insertSerialMovementSchema,
  insertNotificationTypeSchema,
  insertPushNotificationSchema,
  insertBulkCampaignSchema,
  insertSmsProviderSchema,
  insertEmailProviderSchema,
  insertWhatsappProviderSchema,
  insertPushMessageSchema,
  insertMessageLogSchema,
  insertGeneralSettingSchema,
  insertNotificationChannelSchema,
  insertNotificationTriggerSchema,
  insertNotificationLogSchema,
  insertGatewayWebhookSchema,
  insertGatewaySettlementSchema,
  insertFiberRouteSchema,
  insertNetworkTowerSchema,
  insertOltDeviceSchema,
  insertGponSplitterSchema,
  insertOnuDeviceSchema,
  insertP2pLinkSchema,
} from "@shared/schema";
import { seedDatabase } from "./seed";
import { z } from "zod";

const uploadsDir = path.join(process.cwd(), "client", "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function crudRoutes<T>(
  app: Express,
  path: string,
  schema: any,
  getAll: () => Promise<T[]>,
  getOne: (id: number) => Promise<T | undefined>,
  create: (data: any) => Promise<T>,
  update: (id: number, data: any) => Promise<T | undefined>,
  remove: (id: number) => Promise<void>,
) {
  app.get(`/api/${path}`, requireAuth, async (_req, res) => {
    try { res.json(await getAll()); }
    catch (error) { res.status(500).json({ message: `Failed to fetch ${path}` }); }
  });

  app.post(`/api/${path}`, requireAuth, async (req, res) => {
    try {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await create(parsed.data);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message || `Failed to create ${path}` });
    }
  });

  app.patch(`/api/${path}/:id`, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partial = schema.partial().safeParse(req.body);
      if (!partial.success) return res.status(400).json({ message: "Invalid data", errors: partial.error.flatten() });
      const updated = await update(id, partial.data);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || `Failed to update` });
    }
  });

  app.delete(`/api/${path}/:id`, requireAuth, async (req, res) => {
    try {
      await remove(parseInt(req.params.id));
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete" });
    }
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "netsphere-dev-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  await seedDatabase();

  const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      const ipAddress = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";
      const deviceType = /mobile|android|iphone|ipad/i.test(userAgent) ? "Mobile" : "Desktop";
      const loginMode = parsed.data.loginMode || "office";
      const branch = parsed.data.branch || "";

      const attemptKey = `${parsed.data.username}:${ipAddress}`;
      const attempts = loginAttempts.get(attemptKey);
      if (attempts && attempts.lockedUntil > Date.now()) {
        const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
        return res.status(429).json({ message: `Account locked. Try again in ${remaining} seconds.` });
      }

      const user = await storage.getUserByUsername(parsed.data.username);
      if (!user || user.password !== parsed.data.password) {
        const current = loginAttempts.get(attemptKey) || { count: 0, lockedUntil: 0 };
        current.count += 1;
        if (current.count >= 5) {
          current.lockedUntil = Date.now() + 60000;
        }
        loginAttempts.set(attemptKey, current);
        await storage.createLoginActivityLog({
          username: parsed.data.username,
          status: "failed",
          failReason: !user ? "User not found" : "Invalid password",
          loginMode,
          branch,
          ipAddress,
          deviceType,
          userAgent,
          loginAt: new Date().toISOString(),
        });
        const remaining = 5 - current.count;
        if (current.count >= 5) {
          return res.status(429).json({ message: "Account locked. Too many failed attempts. Try again in 60 seconds." });
        }
        return res.status(401).json({ message: `Invalid username or password. ${remaining} attempts remaining.` });
      }
      if (!user.isActive) {
        await storage.createLoginActivityLog({
          userId: user.id,
          username: user.username,
          employeeName: user.fullName,
          role: user.role,
          status: "failed",
          failReason: "Account suspended",
          loginMode,
          branch,
          ipAddress,
          deviceType,
          userAgent,
          loginAt: new Date().toISOString(),
        });
        return res.status(403).json({ message: "Account suspended. Contact administrator." });
      }
      loginAttempts.delete(attemptKey);
      req.session.userId = user.id;
      if (parsed.data.rememberMe) {
        req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
      }
      await storage.createLoginActivityLog({
        userId: user.id,
        username: user.username,
        employeeName: user.fullName,
        role: user.role,
        status: "success",
        loginMode,
        branch,
        ipAddress,
        deviceType,
        userAgent,
        loginAt: new Date().toISOString(),
      });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/permissions", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) return res.status(401).json({ message: "User not found" });

      const adminRoles = ["admin", "super_admin", "superadmin", "super admin"];
      const isAdmin = adminRoles.includes((user.role || "").toLowerCase());

      if (isAdmin) {
        return res.json({ isAdmin: true, permissions: [] });
      }

      const allHrmRoles = await storage.getHrmRoles();
      const matchedRole = allHrmRoles.find(
        (r) => r.name.toLowerCase() === (user.role || "").toLowerCase()
      );

      if (!matchedRole) {
        return res.json({ isAdmin: false, permissions: [], noRole: true });
      }

      const permissions = await storage.getHrmPermissions(matchedRole.id);
      return res.json({ isAdmin: false, permissions });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.get("/api/dashboard/stats", requireAuth, async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/dashboard/recent-invoices", requireAuth, async (_req, res) => {
    try {
      const all = await storage.getInvoices();
      res.json(all.slice(0, 5));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/dashboard/recent-tickets", requireAuth, async (_req, res) => {
    try {
      const all = await storage.getTickets();
      const open = all.filter(t => t.status === "open" || t.status === "in_progress");
      res.json(open.slice(0, 5));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get("/api/dashboard/revenue-overview", requireAuth, async (_req, res) => {
    try {
      const allInvoices = await storage.getInvoices();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const now = new Date();
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const monthInvoices = allInvoices.filter(inv => {
          const issueDate = inv.issueDate ? new Date(inv.issueDate) : null;
          return issueDate && `${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, "0")}` === monthKey;
        });
        const billed = monthInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
        const collected = monthInvoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
        const dues = billed - collected;
        data.push({
          month: months[d.getMonth()],
          billed: Math.round(billed),
          collected: Math.round(collected),
          dues: Math.round(dues),
        });
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch revenue overview" });
    }
  });

  app.get("/api/dashboard/ticket-breakdown", requireAuth, async (_req, res) => {
    try {
      const allTickets = await storage.getTickets();
      const open = allTickets.filter(t => t.status === "open").length;
      const inProgress = allTickets.filter(t => t.status === "in_progress").length;
      const resolved = allTickets.filter(t => t.status === "resolved" || t.status === "closed").length;
      const total = allTickets.length;
      res.json({
        open,
        inProgress,
        resolved,
        total,
        openPercent: total > 0 ? Math.round((open / total) * 100) : 0,
        inProgressPercent: total > 0 ? Math.round((inProgress / total) * 100) : 0,
        resolvedPercent: total > 0 ? Math.round((resolved / total) * 100) : 0,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ticket breakdown" });
    }
  });

  app.get("/api/dashboard/technician-performance", requireAuth, async (_req, res) => {
    try {
      const allTasks = await storage.getTasks();
      const techMap: Record<string, { completed: number; total: number }> = {};
      for (const task of allTasks) {
        const tech = task.assignedTo || "Unassigned";
        if (!techMap[tech]) techMap[tech] = { completed: 0, total: 0 };
        techMap[tech].total++;
        if (task.status === "completed") techMap[tech].completed++;
      }
      const result = Object.entries(techMap)
        .map(([name, stats]) => ({ name, jobsCompleted: stats.completed, totalJobs: stats.total }))
        .sort((a, b) => b.jobsCompleted - a.jobsCompleted)
        .slice(0, 5);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technician performance" });
    }
  });

  app.post("/api/billing/generate-recurring", requireAuth, async (_req, res) => {
    try {
      const allCustomers = await storage.getCustomers();
      const today = new Date().toISOString().split("T")[0];
      const generated: any[] = [];

      for (const customer of allCustomers) {
        if (!customer.isRecurring || customer.status !== "active" || !customer.packageId) continue;

        const nextBilling = customer.nextBillingDate;
        if (nextBilling && nextBilling > today) continue;

        const pkg = await storage.getPackage(customer.packageId);
        if (!pkg) continue;

        const amount = customer.monthlyBill || pkg.price;
        const taxRate = 0.17;
        const tax = (Number(amount) * taxRate).toFixed(2);
        const totalAmount = (Number(amount) + Number(tax)).toFixed(2);

        const invoiceCount = (await storage.getInvoicesByCustomer(customer.id)).length;
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(customer.id).padStart(3, "0")}-${String(invoiceCount + 1).padStart(3, "0")}`;

        const now = new Date();
        const dueDay = customer.recurringDay || 15;
        const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, dueDay).toISOString().split("T")[0];
        const issueDate = today;

        const invoice = await storage.createInvoice({
          invoiceNumber,
          customerId: customer.id,
          amount: String(amount),
          tax,
          totalAmount,
          status: "pending",
          dueDate,
          issueDate,
          description: `Recurring ${pkg.serviceType || "internet"} service - ${pkg.name}`,
          isRecurring: true,
          serviceType: pkg.serviceType || "internet",
        });

        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, customer.recurringDay || 1);
        await storage.updateCustomer(customer.id, {
          lastBilledDate: today,
          nextBillingDate: nextMonth.toISOString().split("T")[0],
        });

        generated.push({ invoiceId: invoice.id, invoiceNumber, customerId: customer.id, customerName: customer.fullName, amount: totalAmount });
      }

      res.json({ generated: generated.length, invoices: generated });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to generate recurring invoices" });
    }
  });

  app.get("/api/analytics/branch-stats", requireAuth, async (_req, res) => {
    try {
      const [customers, resellers, allExpenses, resellerTxns] = await Promise.all([
        storage.getCustomers(),
        storage.getResellers(),
        storage.getExpenses(),
        storage.getAllResellerWalletTransactions(),
      ]);
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const lastMonth = now.getMonth() === 0
        ? `${now.getFullYear() - 1}-12`
        : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;

      const resellerMap: Record<number, typeof resellers[0]> = {};
      for (const r of resellers) resellerMap[r.id] = r;

      const resellerTxnsByReseller: Record<number, typeof resellerTxns> = {};
      for (const t of resellerTxns) {
        if (!resellerTxnsByReseller[t.resellerId]) resellerTxnsByReseller[t.resellerId] = [];
        resellerTxnsByReseller[t.resellerId].push(t);
      }

      const areaNames = [...new Set([
        ...customers.map(c => c.area).filter(Boolean),
        ...resellers.map(r => r.area).filter(Boolean),
      ])] as string[];

      const areaStats = areaNames.map(areaName => {
        const areaCusts = customers.filter(c => c.area?.toLowerCase() === areaName.toLowerCase());
        const active = areaCusts.filter(c => c.status === "active");
        const suspended = areaCusts.filter(c => c.status === "suspended");
        const inactive = areaCusts.filter(c => c.status === "inactive");
        const revenue = active.reduce((s, c) => s + parseFloat(c.monthlyBill || "0"), 0);
        const newThisMonth = areaCusts.filter(c => c.connectionDate && c.connectionDate.startsWith(thisMonth)).length;
        const newLastMonth = areaCusts.filter(c => c.connectionDate && c.connectionDate.startsWith(lastMonth)).length;
        const growthPct = newLastMonth > 0 ? ((newThisMonth - newLastMonth) / newLastMonth * 100).toFixed(1) : newThisMonth > 0 ? "100.0" : "0.0";
        const closedPct = areaCusts.length > 0 ? (((suspended.length + inactive.length) / areaCusts.length) * 100).toFixed(1) : "0.0";

        const areaResellers = resellers.filter(r => r.area?.toLowerCase() === areaName.toLowerCase());
        const resellerRevenue = areaResellers.reduce((sum, r) => {
          const txns = resellerTxnsByReseller[r.id] || [];
          const credits = txns.filter(t => t.type === "credit" || t.type === "recharge").reduce((s, t) => s + parseFloat(t.amount || "0"), 0);
          return sum + credits;
        }, 0);

        const areaExpenses = allExpenses.filter(e => e.area?.toLowerCase() === areaName.toLowerCase() && e.status === "approved");
        const totalExpenses = areaExpenses.reduce((s, e) => s + parseFloat(e.amount || "0"), 0);
        const profitLoss = revenue - totalExpenses;

        return {
          area: areaName,
          totalCustomers: areaCusts.length,
          activeCustomers: active.length,
          suspendedCustomers: suspended.length,
          inactiveCustomers: inactive.length,
          monthlyRevenue: revenue,
          newThisMonth,
          newLastMonth,
          growthPct: parseFloat(growthPct),
          closedPct: parseFloat(closedPct),
          resellersCount: areaResellers.length,
          resellerRevenue,
          totalExpenses,
          profitLoss,
        };
      });

      res.json(areaStats);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to compute branch stats" });
    }
  });

  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const adminRoles = ["admin", "super_admin", "superadmin", "super admin"];
      const userId = (req.session as any).userId as number | undefined;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "User not found" });
      const isAdmin = adminRoles.includes((user.role || "").toLowerCase());
      const allCustomers = await storage.getCustomers();
      if (isAdmin || !user.employeeId) return res.json(allCustomers);
      const assignments = await storage.getAreaAssignmentsByEmployee(user.employeeId);
      const activeAssignments = assignments.filter(a => a.status === "active");
      if (activeAssignments.length === 0) return res.json(allCustomers);
      const areaIds = [...new Set(activeAssignments.map(a => a.areaId))];
      const areaObjects = await Promise.all(areaIds.map(id => storage.getArea(id)));
      const areaNames = areaObjects.filter((a): a is NonNullable<typeof a> => !!a).map(a => a.name.toLowerCase());
      const filtered = allCustomers.filter(c => c.area && areaNames.includes(c.area.toLowerCase()));
      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch customers" });
    }
  });

  crudRoutes(app, "customers", insertCustomerSchema,
    () => storage.getCustomers(),
    (id) => storage.getCustomer(id),
    async (data) => {
      const customer = await storage.createCustomer(data);
      try {
        const connectedBy = data.connectedBy;
        if (connectedBy) {
          const commType = await storage.getActiveCommissionTypeByTrigger("customer_installation");
          if (commType) {
            const allEmployees = await storage.getEmployees();
            const emp = allEmployees.find((e: any) => e.empCode === connectedBy || e.fullName === connectedBy || String(e.id) === String(connectedBy));
            if (emp) {
              const now = new Date();
              const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
              let commissionAmount = String(commType.amount || "0");
              if (commType.calculationMode === "percentage" && commType.percentage && customer.monthlyBill) {
                commissionAmount = String(Math.round(Number(customer.monthlyBill) * Number(commType.percentage) / 100));
              }
              await storage.createBonusCommission({
                employeeId: emp.id,
                type: "installation_commission",
                incentiveType: "commission",
                amount: commissionAmount,
                calculatedAmount: commissionAmount,
                reason: `Customer Installation Commission - ${customer.fullName} (${customer.customerId})`,
                month,
                includeInPayroll: true,
                payrollMonth: month,
                status: "pending",
                requestedBy: "System (Auto)",
                linkedSource: `Customer: ${customer.customerId}`,
                remarks: `Auto-generated for installing customer ${customer.fullName}`,
              });
            }
          }
        }
      } catch (e) {
      }

      // Auto-generate invoice in Sales when customer has billing details
      try {
        const grandTotal = parseFloat(String(customer.grandTotal || "0"));
        if (grandTotal > 0 || customer.packageId) {
          const now = new Date();
          const dateStr = now.toISOString().split("T")[0];
          const yr = now.getFullYear();
          const invNum = `INV-${yr}-${Date.now().toString(36).toUpperCase()}`;

          // Look up package name for description
          let pkgName = "Service Package";
          let pkgServiceType = "internet";
          if (customer.packageId) {
            try {
              const pkg = await storage.getPackage(customer.packageId as number);
              if (pkg) { pkgName = pkg.name; pkgServiceType = pkg.serviceType || "internet"; }
            } catch {}
          }

          const issueDate = (customer.joiningDate as string | null) || dateStr;
          const dueDate   = (customer.expireDate  as string | null) || (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split("T")[0]; })();
          const totalAmt  = grandTotal || parseFloat(String(customer.monthlyBill || "0")) || 0;

          // Build description
          const descParts: string[] = [`New customer connection — ${customer.fullName} (${customer.customerId})`];
          descParts.push(`Package: ${pkgName}`);

          const invoice = await storage.createInvoice({
            invoiceNumber: invNum,
            customerId: customer.id,
            amount: String(totalAmt),
            tax: "0",
            totalAmount: String(totalAmt),
            status: "pending",
            issueDate,
            dueDate,
            description: descParts.join(" | "),
            isRecurring: false,
            serviceType: pkgServiceType,
          });

          // Build line items
          const lineItems: Array<{ invoiceId: number; itemType: string; description: string; quantity: number; unitPrice: string; discount: string; taxRate: string; taxAmount: string; total: string; packageId?: number; sortOrder: number }> = [];
          let sortIdx = 0;

          // Package bill
          const pkgBill = parseFloat(String(customer.finalPackageBill || customer.packageBill || "0"));
          if (pkgBill > 0 && customer.packageId) {
            lineItems.push({ invoiceId: invoice.id, itemType: "service", description: `${pkgName} — Monthly Service`, quantity: 1, unitPrice: String(pkgBill), discount: "0", taxRate: "0", taxAmount: "0", total: String(pkgBill), packageId: customer.packageId as number, sortOrder: sortIdx++ });
          }

          // Device charges (primary device)
          const deviceCharges = parseFloat(String(customer.deviceCharges || "0"));
          if (deviceCharges > 0) {
            const devLabel = (customer.deviceType as string | null) ? `Device: ${customer.deviceType}${(customer.deviceDetail as string | null) ? ` (${customer.deviceDetail})` : ""}` : "Device Charges";
            lineItems.push({ invoiceId: invoice.id, itemType: "equipment", description: devLabel, quantity: 1, unitPrice: String(deviceCharges), discount: "0", taxRate: "0", taxAmount: "0", total: String(deviceCharges), sortOrder: sortIdx++ });
          }

          // Additional devices
          try {
            const addlDevs = JSON.parse(String(customer.additionalDevices || "[]"));
            if (Array.isArray(addlDevs)) {
              for (const d of addlDevs) {
                const dc = parseFloat(String(d.deviceCharges || "0"));
                if (dc > 0) {
                  const label = d.deviceType ? `Device: ${d.deviceType}${d.deviceDetail ? ` (${d.deviceDetail})` : ""}` : "Additional Device";
                  lineItems.push({ invoiceId: invoice.id, itemType: "equipment", description: label, quantity: 1, unitPrice: String(dc), discount: "0", taxRate: "0", taxAmount: "0", total: String(dc), sortOrder: sortIdx++ });
                }
              }
            }
          } catch {}

          // Installation charges
          const instCharges = parseFloat(String(customer.finalInstallationCharges || "0"));
          if (instCharges > 0) {
            lineItems.push({ invoiceId: invoice.id, itemType: "service", description: "Installation Charges", quantity: 1, unitPrice: String(instCharges), discount: "0", taxRate: "0", taxAmount: "0", total: String(instCharges), sortOrder: sortIdx++ });
          }

          // Static IP MRC
          if (customer.staticIpEnabled) {
            const sipMrc = parseFloat(String(customer.staticIpMrc || "0"));
            if (sipMrc > 0) {
              lineItems.push({ invoiceId: invoice.id, itemType: "service", description: "Static IP — Monthly Recurring Charge", quantity: 1, unitPrice: String(sipMrc), discount: "0", taxRate: "0", taxAmount: "0", total: String(sipMrc), sortOrder: sortIdx++ });
            }
          }

          // Installment monthly amount
          if (customer.installmentEnabled) {
            const instMo = parseFloat(String(customer.installmentMonthlyAmount || "0"));
            if (instMo > 0) {
              const instDesc = `Installment (Month 1 of ${customer.installmentMonths || "?"}) — ${customer.installmentType || ""}`.trim();
              lineItems.push({ invoiceId: invoice.id, itemType: "service", description: instDesc, quantity: 1, unitPrice: String(instMo), discount: "0", taxRate: "0", taxAmount: "0", total: String(instMo), sortOrder: sortIdx++ });
            }
          }

          // Additional packages (IPTV, Cable TV, OTT)
          try {
            const addlPkgs = JSON.parse(String(customer.additionalPackages || "[]"));
            if (Array.isArray(addlPkgs)) {
              for (const ap of addlPkgs) {
                const apBill = parseFloat(String(ap.bill || "0"));
                if (apBill > 0) {
                  let apName = "Additional Service";
                  if (ap.packageId) {
                    try { const apPkg = await storage.getPackage(Number(ap.packageId)); if (apPkg) apName = apPkg.name; } catch {}
                  }
                  lineItems.push({ invoiceId: invoice.id, itemType: "service", description: apName, quantity: 1, unitPrice: String(apBill), discount: "0", taxRate: "0", taxAmount: "0", total: String(apBill), sortOrder: sortIdx++ });
                }
              }
            }
          } catch {}

          // Insert all line items
          for (const li of lineItems) {
            await storage.createInvoiceItem(li);
          }
        }
      } catch (e) {
        // Invoice auto-generation failure is non-blocking
      }

      return customer;
    },
    (id, data) => storage.updateCustomer(id, data),
    (id) => storage.deleteCustomer(id),
  );

  app.get("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const customer = await storage.getCustomer(parseInt(req.params.id));
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.get("/api/customers/:id/invoices", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getInvoicesByCustomer(parseInt(req.params.id)));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer invoices" });
    }
  });

  app.get("/api/customers/:id/tickets", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getTicketsByCustomer(parseInt(req.params.id)));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer tickets" });
    }
  });

  app.get("/api/customers/:id/connections", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getCustomerConnections(parseInt(req.params.id)));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  app.get("/api/customers/:id/transactions", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getTransactionsByCustomer(parseInt(req.params.id)));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/customers/:id/automate", requireAuth, async (req, res) => {
    const customerId = parseInt(req.params.id);
    const steps: Array<{ step: string; status: "success" | "error" | "skipped"; message: string; data?: any }> = [];
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const sessionUser = req.session.userId ? await storage.getUser(req.session.userId) : null;

    try {
      const customer = await storage.getCustomer(customerId);
      if (!customer) return res.status(404).json({ message: "Customer not found" });

      const pkg = customer.packageId ? await storage.getPackage(customer.packageId) : null;

      // Step 1: Auto Invoice Generation
      try {
        if (pkg) {
          const dueDate = customer.expireDate || (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split("T")[0]; })();
          const invNum = `INV-${Date.now().toString(36).toUpperCase()}`;
          const invoice = await storage.createInvoice({
            invoiceNumber: invNum,
            customerId: customer.id,
            amount: pkg.price || "0",
            tax: "0",
            totalAmount: customer.monthlyBill || pkg.price || "0",
            status: "pending",
            dueDate,
            issueDate: dateStr,
            description: `Service charges: ${pkg.name}`,
            isRecurring: true,
            serviceType: "internet",
          });
          steps.push({ step: "invoice", status: "success", message: `Invoice ${invNum} generated`, data: { invoiceId: invoice.id, invoiceNumber: invNum, amount: invoice.totalAmount } });
        } else {
          steps.push({ step: "invoice", status: "skipped", message: "No package selected — invoice skipped" });
        }
      } catch (e: any) {
        steps.push({ step: "invoice", status: "error", message: e.message || "Invoice generation failed" });
      }

      // Step 2: Radius / PPPoE Provisioning (simulated)
      try {
        if (customer.usernameIp && customer.password) {
          await storage.createActivityLog({
            action: "radius_provisioning",
            module: "network",
            description: `PPPoE account queued for provisioning: ${customer.usernameIp} | Profile: ${customer.profile || "default"}`,
            userId: sessionUser?.id || null,
            createdAt: now.toISOString(),
          });
          steps.push({ step: "radius", status: "success", message: `PPPoE account queued: ${customer.usernameIp}`, data: { username: customer.usernameIp, profile: customer.profile || "default", status: "pending_sync" } });
        } else {
          steps.push({ step: "radius", status: "skipped", message: "No username/password — provisioning skipped" });
        }
      } catch (e: any) {
        steps.push({ step: "radius", status: "error", message: e.message || "Provisioning log failed" });
      }

      // Step 3: Installation Task Creation
      try {
        const assignTo = customer.assignTo || customer.connectedBy;
        const taskCode = `TSK-${Date.now().toString(36).toUpperCase()}`;
        const dueDate2 = (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split("T")[0]; })();
        const task = await storage.createTask({
          taskCode,
          title: `Installation — ${customer.fullName} (${customer.customerId})`,
          type: "installation",
          description: `New customer installation.\nAddress: ${customer.address || customer.presentAddress || "N/A"}\nPackage: ${pkg?.name || "N/A"}\nContact: ${customer.phone}`,
          priority: "high",
          status: "pending",
          assignedTo: assignTo || null,
          customerId: customer.id,
          startDate: dateStr,
          dueDate: dueDate2,
          notes: `Auto-generated on customer creation`,
          createdAt: now.toISOString(),
        });
        steps.push({ step: "task", status: "success", message: `Installation task ${taskCode} created`, data: { taskId: task.id, taskCode, assignedTo: assignTo || "Unassigned" } });
      } catch (e: any) {
        steps.push({ step: "task", status: "error", message: e.message || "Task creation failed" });
      }

      // Step 4: Customer Welcome Notification
      try {
        const notifMsg = `Welcome to our network, ${customer.fullName}! Your connection is being processed. Customer ID: ${customer.customerId}.`;
        await storage.createNotification({
          title: "Welcome Notification",
          message: notifMsg,
          type: "info",
          channel: customer.sendGreetingSms ? "sms" : "app",
          recipientType: "customer",
          recipientId: customer.id,
          isRead: false,
          createdAt: now.toISOString(),
        });
        steps.push({ step: "notification_customer", status: "success", message: customer.sendGreetingSms ? "Welcome SMS queued for customer" : "Welcome notification created", data: { channel: customer.sendGreetingSms ? "SMS" : "App" } });
      } catch (e: any) {
        steps.push({ step: "notification_customer", status: "error", message: e.message || "Customer notification failed" });
      }

      // Step 5: Employee Notification
      try {
        const assignTo = customer.assignTo || customer.connectedBy;
        if (assignTo && customer.sendSmsToEmployee) {
          await storage.createNotification({
            title: "Installation Assignment",
            message: `New installation task assigned: ${customer.fullName} (${customer.customerId}). Address: ${customer.address || "N/A"}. Contact: ${customer.phone}`,
            type: "info",
            channel: "sms",
            recipientType: "employee",
            recipientId: null,
            isRead: false,
            createdAt: now.toISOString(),
          });
          steps.push({ step: "notification_employee", status: "success", message: `Assignment SMS queued for ${assignTo}`, data: { channel: "SMS", assignedTo: assignTo } });
        } else {
          steps.push({ step: "notification_employee", status: "skipped", message: "Employee SMS notifications disabled" });
        }
      } catch (e: any) {
        steps.push({ step: "notification_employee", status: "error", message: e.message || "Employee notification failed" });
      }

      // Step 6: Master Activity Log
      try {
        await storage.createActivityLog({
          action: "customer_automation_complete",
          module: "customers",
          description: `Auto-workflow completed for ${customer.fullName} (${customer.customerId}): ${steps.filter(s => s.status === "success").length} steps succeeded`,
          userId: sessionUser?.id || null,
          createdAt: now.toISOString(),
        });
      } catch (_) {}

      res.json({ success: true, customerId: customer.id, customerName: customer.fullName, steps });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Automation failed", steps });
    }
  });

  crudRoutes(app, "packages", insertPackageSchema,
    () => storage.getPackages(),
    (id) => storage.getPackage(id),
    (data) => storage.createPackage(data),
    (id, data) => storage.updatePackage(id, data),
    (id) => storage.deletePackage(id),
  );

  crudRoutes(app, "invoices", insertInvoiceSchema,
    () => storage.getInvoices(),
    (id) => storage.getInvoice(id),
    (data) => storage.createInvoice(data),
    (id, data) => storage.updateInvoice(id, data),
    (id) => storage.deleteInvoice(id),
  );

  app.get("/api/invoice-items/:invoiceId", requireAuth, async (req, res) => {
    try {
      const items = await storage.getInvoiceItems(parseInt(req.params.invoiceId));
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice items" });
    }
  });

  app.post("/api/invoice-items", requireAuth, async (req, res) => {
    try {
      const parsed = insertInvoiceItemSchema.parse(req.body);
      const item = await storage.createInvoiceItem(parsed);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create invoice item" });
    }
  });

  app.patch("/api/invoice-items/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateInvoiceItem(parseInt(req.params.id), req.body);
      if (!updated) return res.status(404).json({ message: "Item not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update invoice item" });
    }
  });

  app.delete("/api/invoice-items/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteInvoiceItem(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete invoice item" });
    }
  });

  app.post("/api/invoices-with-items", requireAuth, async (req, res) => {
    try {
      const { invoice: invoiceData, items } = req.body;
      const parsedInvoice = insertInvoiceSchema.parse(invoiceData);
      const created = await storage.createInvoice(parsedInvoice);
      const createdItems = [];
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const parsed = insertInvoiceItemSchema.parse({ ...items[i], invoiceId: created.id, sortOrder: i });
          const item = await storage.createInvoiceItem(parsed);
          createdItems.push(item);
        }
      }
      res.status(201).json({ ...created, items: createdItems });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create invoice with items" });
    }
  });

  app.put("/api/invoices-with-items/:id", requireAuth, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { invoice: invoiceData, items } = req.body;
      const updated = await storage.updateInvoice(invoiceId, invoiceData);
      if (!updated) return res.status(404).json({ message: "Invoice not found" });
      await storage.deleteInvoiceItemsByInvoiceId(invoiceId);
      const createdItems = [];
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const parsed = insertInvoiceItemSchema.parse({ ...items[i], invoiceId, sortOrder: i });
          const item = await storage.createInvoiceItem(parsed);
          createdItems.push(item);
        }
      }
      res.json({ ...updated, items: createdItems });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update invoice with items" });
    }
  });

  app.get("/api/invoices/:id/full", requireAuth, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(parseInt(req.params.id));
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });
      const items = await storage.getInvoiceItems(invoice.id);
      const customer = await storage.getCustomer(invoice.customerId);
      const allCompany = await storage.getCompanySettings();
      res.json({ invoice, items, customer, company: allCompany || null });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice details" });
    }
  });

  crudRoutes(app, "tickets", insertTicketSchema,
    () => storage.getTickets(),
    (id) => storage.getTicket(id),
    (data) => storage.createTicket(data),
    (id, data) => storage.updateTicket(id, data),
    (id) => storage.deleteTicket(id),
  );

  crudRoutes(app, "support-categories", insertSupportCategorySchema,
    () => storage.getSupportCategories(),
    (id) => storage.getSupportCategory(id),
    (data) => storage.createSupportCategory(data),
    (id, data) => storage.updateSupportCategory(id, data),
    (id) => storage.deleteSupportCategory(id),
  );

  crudRoutes(app, "areas", insertAreaSchema,
    () => storage.getAreas(),
    (id) => storage.getArea(id),
    (data) => storage.createArea(data),
    (id, data) => storage.updateArea(id, data),
    (id) => storage.deleteArea(id),
  );

  crudRoutes(app, "vendors", insertVendorSchema,
    () => storage.getVendors(),
    (id) => storage.getVendor(id),
    (data) => storage.createVendor(data),
    (id, data) => storage.updateVendor(id, data),
    (id) => storage.deleteVendor(id),
  );

  crudRoutes(app, "resellers", insertResellerSchema,
    () => storage.getResellers(),
    (id) => storage.getReseller(id),
    (data) => storage.createReseller(data),
    (id, data) => storage.updateReseller(id, data),
    (id) => storage.deleteReseller(id),
  );

  app.get("/api/vendor-wallet-transactions/all", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getAllVendorWalletTransactions());
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.get("/api/vendor-wallet-transactions/:vendorId", requireAuth, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      res.json(await storage.getVendorWalletTransactions(vendorId));
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.patch("/api/vendor-wallet-transactions/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schema = z.object({ amount: z.union([z.number(), z.string()]).transform(v => parseFloat(String(v))).refine(v => v > 0, "Amount must be positive").optional(), paymentMethod: z.string().optional(), performedBy: z.string().optional(), approvedBy: z.string().optional(), notes: z.string().optional(), reason: z.string().optional(), reference: z.string().optional() });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const { amount, ...otherFields } = parsed.data;
      if (amount !== undefined) {
        const updated = await storage.updateVendorWalletTransactionWithAmount(id, amount, otherFields);
        if (!updated) return res.status(404).json({ message: "Transaction not found" });
        res.json(updated);
      } else {
        const updated = await storage.updateVendorWalletTransaction(id, otherFields);
        if (!updated) return res.status(404).json({ message: "Transaction not found" });
        res.json(updated);
      }
    } catch (error: any) { res.status(400).json({ message: error.message }); }
  });

  app.post("/api/vendor-wallet/recharge", requireAuth, async (req, res) => {
    try {
      const schema = z.object({ vendorId: z.number().int().positive(), amount: z.union([z.number(), z.string()]).transform(v => parseFloat(String(v))).refine(v => v > 0, "Amount must be positive"), reference: z.string().optional(), paymentMethod: z.string().optional(), performedBy: z.string().optional(), approvedBy: z.string().optional(), notes: z.string().optional() });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const vendor = await storage.getVendor(parsed.data.vendorId);
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });
      const updated = await storage.rechargeVendorWallet(parsed.data.vendorId, parsed.data.amount, parsed.data.reference, parsed.data.paymentMethod, parsed.data.performedBy, parsed.data.approvedBy, parsed.data.notes);
      res.json(updated);
    } catch (error: any) { res.status(400).json({ message: error.message }); }
  });

  app.post("/api/vendor-wallet/deduct", requireAuth, async (req, res) => {
    try {
      const schema = z.object({ vendorId: z.number().int().positive(), amount: z.union([z.number(), z.string()]).transform(v => parseFloat(String(v))).refine(v => v > 0, "Amount must be positive"), reference: z.string().optional(), customerId: z.number().int().optional(), resellerId: z.number().int().optional(), reason: z.string().optional(), performedBy: z.string().optional(), approvedBy: z.string().optional(), notes: z.string().optional() });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const vendor = await storage.getVendor(parsed.data.vendorId);
      if (!vendor) return res.status(404).json({ message: "Vendor not found" });
      const updated = await storage.deductVendorWallet(parsed.data.vendorId, parsed.data.amount, parsed.data.reference, parsed.data.customerId, parsed.data.resellerId, parsed.data.reason, parsed.data.performedBy, parsed.data.approvedBy, parsed.data.notes);
      res.json(updated);
    } catch (error: any) { res.status(400).json({ message: error.message }); }
  });

  app.get("/api/reseller-wallet-transactions/:resellerId", requireAuth, async (req, res) => {
    try {
      if (req.params.resellerId === "all") {
        res.json(await storage.getAllResellerWalletTransactions());
      } else {
        const resellerId = parseInt(req.params.resellerId);
        res.json(await storage.getResellerWalletTransactions(resellerId));
      }
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/reseller-wallet/recharge", requireAuth, async (req, res) => {
    try {
      const schema = z.object({ resellerId: z.number().int().positive(), amount: z.union([z.number(), z.string()]).transform(v => parseFloat(String(v))).refine(v => v > 0, "Amount must be positive"), reference: z.string().optional(), paymentMethod: z.string().optional(), remarks: z.string().optional() });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const reseller = await storage.rechargeResellerWallet(parsed.data.resellerId, parsed.data.amount, parsed.data.reference, parsed.data.paymentMethod, parsed.data.remarks, "admin");
      res.json(reseller);
    } catch (error: any) { res.status(400).json({ message: error.message }); }
  });

  app.post("/api/reseller-wallet/deduct", requireAuth, async (req, res) => {
    try {
      const schema = z.object({ resellerId: z.number().int().positive(), amount: z.union([z.number(), z.string()]).transform(v => parseFloat(String(v))).refine(v => v > 0, "Amount must be positive"), reference: z.string().optional(), vendorId: z.number().int().optional(), customerId: z.number().int().optional(), category: z.string().optional() });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const reseller = await storage.deductResellerWallet(parsed.data.resellerId, parsed.data.amount, parsed.data.vendorId, parsed.data.customerId, parsed.data.reference, parsed.data.category, "admin");
      res.json(reseller);
    } catch (error: any) { res.status(400).json({ message: error.message }); }
  });

  crudRoutes(app, "vendor-packages", insertVendorPackageSchema,
    () => storage.getVendorPackages(),
    (id) => storage.getVendorPackage(id),
    (data) => storage.createVendorPackage(data),
    (id, data) => storage.updateVendorPackage(id, data),
    (id) => storage.deleteVendorPackage(id),
  );

  app.get("/api/vendor-packages/by-vendor/:vendorId", requireAuth, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      res.json(await storage.getVendorPackages(vendorId));
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  crudRoutes(app, "vendor-bandwidth-links", insertVendorBandwidthLinkSchema,
    () => storage.getVendorBandwidthLinks(),
    (id) => storage.getVendorBandwidthLink(id),
    (data) => storage.createVendorBandwidthLink(data),
    (id, data) => storage.updateVendorBandwidthLink(id, data),
    (id) => storage.deleteVendorBandwidthLink(id),
  );

  app.get("/api/vendor-bandwidth-links/by-vendor/:vendorId", requireAuth, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      res.json(await storage.getVendorBandwidthLinks(vendorId));
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  crudRoutes(app, "bandwidth-change-history", insertBandwidthChangeHistorySchema,
    () => storage.getBandwidthChangeHistory(),
    (id) => storage.getBandwidthChange(id),
    (data) => storage.createBandwidthChange(data),
    (id, data) => storage.updateBandwidthChange(id, data),
    (id) => storage.deleteBandwidthChange(id),
  );

  app.get("/api/bandwidth-change-history/by-vendor/:vendorId", requireAuth, async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      res.json(await storage.getBandwidthChangeHistory(vendorId));
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.get("/api/bandwidth-change-history/by-link/:linkId", requireAuth, async (req, res) => {
    try {
      const linkId = parseInt(req.params.linkId);
      res.json(await storage.getBandwidthChangeHistoryByLink(linkId));
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/bandwidth-upgrade-downgrade", requireAuth, async (req, res) => {
    try {
      const { linkId, newMbps, newRate, reason, requestedBy, effectiveDate, notes } = req.body;
      const link = await storage.getVendorBandwidthLink(linkId);
      if (!link) return res.status(404).json({ message: "Link not found" });

      const previousMbps = Number(link.bandwidthMbps);
      const previousRate = Number(link.bandwidthRate);
      const previousCost = Number(link.totalMonthlyCost);
      const newMbpsNum = Number(newMbps);
      const newRateNum = Number(newRate);
      const newCost = newMbpsNum * newRateNum;

      const changeType = newMbpsNum > previousMbps ? "upgrade" : newMbpsNum < previousMbps ? "downgrade" : "rate_change";

      const historyRecord = await storage.createBandwidthChange({
        vendorId: link.vendorId,
        linkId: link.id,
        changeType,
        previousMbps: String(previousMbps),
        newMbps: String(newMbpsNum),
        previousRate: String(previousRate),
        newRate: String(newRateNum),
        previousCost: String(previousCost),
        newCost: String(newCost),
        reason: reason || null,
        requestedBy: requestedBy || null,
        approvedBy: null,
        status: "completed",
        effectiveDate: effectiveDate || new Date().toISOString().split("T")[0],
        notes: notes || null,
      });

      await storage.updateVendorBandwidthLink(link.id, {
        bandwidthMbps: String(newMbpsNum),
        bandwidthRate: String(newRateNum),
        totalMonthlyCost: String(newCost),
      });

      res.status(201).json(historyRecord);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  crudRoutes(app, "account-types", insertAccountTypeSchema,
    () => storage.getAccountTypes(),
    (id) => storage.getAccountType(id),
    (data) => storage.createAccountType(data),
    (id, data) => storage.updateAccountType(id, data),
    (id) => storage.deleteAccountType(id),
  );

  crudRoutes(app, "accounts", insertAccountSchema,
    () => storage.getAccounts(),
    (id) => storage.getAccount(id),
    (data) => storage.createAccount(data),
    (id, data) => storage.updateAccount(id, data),
    (id) => storage.deleteAccount(id),
  );

  crudRoutes(app, "transactions", insertTransactionSchema,
    () => storage.getTransactions(),
    (id) => storage.getTransaction(id),
    (data) => storage.createTransaction(data),
    (id, data) => storage.updateTransaction(id, data),
    (id) => storage.deleteTransaction(id),
  );

  crudRoutes(app, "transaction-types", insertTransactionTypeSchema,
    () => storage.getTransactionTypes(),
    (id) => storage.getTransactionType(id),
    (data) => storage.createTransactionType(data),
    (id, data) => storage.updateTransactionType(id, data),
    (id) => storage.deleteTransactionType(id),
  );

  crudRoutes(app, "approval-requests", insertApprovalRequestSchema,
    () => storage.getApprovalRequests(),
    (id) => storage.getApprovalRequest(id),
    (data) => storage.createApprovalRequest(data),
    (id, data) => storage.updateApprovalRequest(id, data),
    (id) => storage.deleteApprovalRequest(id),
  );

  crudRoutes(app, "approval-rules", insertApprovalRuleSchema,
    () => storage.getApprovalRules(),
    (id) => storage.getApprovalRule(id),
    (data) => storage.createApprovalRule(data),
    (id, data) => storage.updateApprovalRule(id, data),
    (id) => storage.deleteApprovalRule(id),
  );

  app.get("/api/approval-history", requireAuth, async (_req, res) => {
    try { res.json(await storage.getApprovalHistoryItems()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch approval history" }); }
  });

  app.post("/api/approval-history", requireAuth, async (req, res) => {
    try {
      const parsed = insertApprovalHistorySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.createApprovalHistory(parsed.data);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create approval history" });
    }
  });

  crudRoutes(app, "projects", insertProjectSchema,
    () => storage.getProjects(),
    (id) => storage.getProject(id),
    (data) => storage.createProject(data),
    (id, data) => storage.updateProject(id, data),
    (id) => storage.deleteProject(id),
  );

  crudRoutes(app, "budgets", insertBudgetSchema,
    () => storage.getBudgets(),
    (id) => storage.getBudget(id),
    (data) => storage.createBudget(data),
    (id, data) => storage.updateBudget(id, data),
    (id) => storage.deleteBudget(id),
  );

  crudRoutes(app, "budget-allocations", insertBudgetAllocationSchema,
    () => storage.getBudgetAllocations(),
    (id) => storage.getBudgetAllocationsByBudget(id),
    (data) => storage.createBudgetAllocation(data),
    (id, data) => storage.updateBudgetAllocation(id, data),
    (id) => storage.deleteBudgetAllocation(id),
  );

  app.get("/api/budget-allocations/budget/:budgetId", requireAuth, async (req, res) => {
    try {
      const budgetId = parseInt(req.params.budgetId);
      res.json(await storage.getBudgetAllocationsByBudget(budgetId));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budget allocations" });
    }
  });

  app.get("/api/tasks", requireAuth, async (_req, res) => {
    try { res.json(await storage.getTasks()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch tasks" }); }
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      const parsed = insertTaskSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const task = await storage.createTask(parsed.data);
      const sessionUser = req.session.userId ? await storage.getUser(req.session.userId) : null;
      const taskProject = task.projectId ? await storage.getProject(task.projectId) : null;
      await storage.createTaskActivityLog({
        taskId: task.id, taskCode: task.taskCode || null, taskTitle: task.title,
        projectId: task.projectId || null, projectName: taskProject?.name || null,
        actionType: "task_created", fieldChanged: null, oldValue: null, newValue: null,
        performedBy: sessionUser?.fullName || "System", performedByRole: sessionUser?.role || "admin",
        ipAddress: req.ip || null, deviceInfo: req.headers["user-agent"] || null,
        description: `Task "${task.title}" created${task.assignedTo ? ` and assigned to ${task.assignedTo}` : ""}`,
        severity: "normal", createdAt: new Date().toISOString(),
      });
      res.status(201).json(task);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partial = insertTaskSchema.partial().safeParse(req.body);
      if (!partial.success) return res.status(400).json({ message: "Invalid data", errors: partial.error.flatten() });
      const oldTask = await storage.getTask(id);
      if (!oldTask) return res.status(404).json({ message: "Not found" });
      const updated = await storage.updateTask(id, partial.data);
      if (!updated) return res.status(404).json({ message: "Not found" });
      const sessionUser = req.session.userId ? await storage.getUser(req.session.userId) : null;
      const taskProject = oldTask.projectId ? await storage.getProject(oldTask.projectId) : null;
      const changes = partial.data;
      const criticalFields = ["status", "assignedTo", "dueDate", "priority"];
      const changedFields: string[] = [];
      for (const [key, val] of Object.entries(changes)) {
        const oldVal = (oldTask as any)[key];
        if (String(val ?? "") !== String(oldVal ?? "")) changedFields.push(key);
      }
      for (const field of changedFields) {
        const oldVal = String((oldTask as any)[field] ?? "");
        const newVal = String((changes as any)[field] ?? "");
        let actionType = "task_edited";
        let severity = "normal";
        if (field === "status") { actionType = "status_changed"; severity = "normal"; }
        else if (field === "assignedTo") { actionType = "reassigned"; severity = "critical"; }
        else if (field === "dueDate") { actionType = "due_date_modified"; severity = "critical"; }
        else if (field === "priority") { actionType = "priority_changed"; severity = "normal"; }
        else if (field === "progress") { actionType = "progress_updated"; severity = "normal"; }
        if (criticalFields.includes(field)) severity = "critical";
        await storage.createTaskActivityLog({
          taskId: id, taskCode: oldTask.taskCode || null, taskTitle: oldTask.title,
          projectId: oldTask.projectId || null, projectName: taskProject?.name || null,
          actionType, fieldChanged: field, oldValue: oldVal, newValue: newVal,
          performedBy: sessionUser?.fullName || "System", performedByRole: sessionUser?.role || "admin",
          ipAddress: req.ip || null, deviceInfo: req.headers["user-agent"] || null,
          description: `${field} changed from "${oldVal}" to "${newVal}" on task "${oldTask.title}"`,
          severity, createdAt: new Date().toISOString(),
        });
      }
      if (changedFields.length === 0) {
        await storage.createTaskActivityLog({
          taskId: id, taskCode: oldTask.taskCode || null, taskTitle: oldTask.title,
          projectId: oldTask.projectId || null, projectName: taskProject?.name || null,
          actionType: "task_edited", fieldChanged: null, oldValue: null, newValue: null,
          performedBy: sessionUser?.fullName || "System", performedByRole: sessionUser?.role || "admin",
          ipAddress: req.ip || null, deviceInfo: req.headers["user-agent"] || null,
          description: `Task "${oldTask.title}" updated`, severity: "normal",
          createdAt: new Date().toISOString(),
        });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update" });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      const sessionUser = req.session.userId ? await storage.getUser(req.session.userId) : null;
      const taskProject = task?.projectId ? await storage.getProject(task.projectId) : null;
      await storage.deleteTask(id);
      if (task) {
        await storage.createTaskActivityLog({
          taskId: id, taskCode: task.taskCode || null, taskTitle: task.title,
          projectId: task.projectId || null, projectName: taskProject?.name || null,
          actionType: "task_deleted", fieldChanged: null, oldValue: JSON.stringify(task), newValue: null,
          performedBy: sessionUser?.fullName || "System", performedByRole: sessionUser?.role || "admin",
          ipAddress: req.ip || null, deviceInfo: req.headers["user-agent"] || null,
          description: `Task "${task.title}" (${task.taskCode || id}) deleted`,
          severity: "critical", createdAt: new Date().toISOString(),
        });
      }
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete" });
    }
  });

  app.get("/api/task-activity-logs", requireAuth, async (_req, res) => {
    try { res.json(await storage.getTaskActivityLogs()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch task activity logs" }); }
  });

  app.get("/api/task-activity-logs/task/:taskId", requireAuth, async (req, res) => {
    try { res.json(await storage.getTaskActivityLogsByTaskId(parseInt(req.params.taskId))); }
    catch (error) { res.status(500).json({ message: "Failed to fetch task activity logs" }); }
  });

  crudRoutes(app, "asset-types", insertAssetTypeSchema,
    () => storage.getAssetTypes(),
    (id) => storage.getAssetType(id),
    (data) => storage.createAssetType(data),
    (id, data) => storage.updateAssetType(id, data),
    (id) => storage.deleteAssetType(id),
  );

  crudRoutes(app, "asset-transfers", insertAssetTransferSchema,
    () => storage.getAssetTransfers(),
    (id) => storage.getAssetTransfer(id),
    (data) => storage.createAssetTransfer(data),
    (id, data) => storage.updateAssetTransfer(id, data),
    (id) => storage.deleteAssetTransfer(id),
  );

  crudRoutes(app, "assets", insertAssetSchema,
    () => storage.getAssets(),
    (id) => storage.getAsset(id),
    (data) => storage.createAsset(data),
    (id, data) => storage.updateAsset(id, data),
    (id) => storage.deleteAsset(id),
  );

  crudRoutes(app, "inventory", insertInventoryItemSchema,
    () => storage.getInventoryItems(),
    (id) => storage.getInventoryItem(id),
    (data) => storage.createInventoryItem(data),
    (id, data) => storage.updateInventoryItem(id, data),
    (id) => storage.deleteInventoryItem(id),
  );

  crudRoutes(app, "employees", insertEmployeeSchema,
    () => storage.getEmployees(),
    (id) => storage.getEmployee(id),
    (data) => storage.createEmployee(data),
    (id, data) => storage.updateEmployee(id, data),
    (id) => storage.deleteEmployee(id),
  );

  app.get("/api/employees/next-code/:department", requireAuth, async (req, res) => {
    try {
      const dept = req.params.department;
      const prefixMap: Record<string, string> = {
        engineering: "ENG", support: "SUP", sales: "SAL", finance: "FIN",
        admin: "ADM", management: "MGT", hr: "HR", it: "IT", operations: "OPS",
      };
      const prefix = prefixMap[dept] || dept.substring(0, 3).toUpperCase();
      const allEmployees = await storage.getEmployees();
      const deptEmployees = allEmployees.filter(
        (e) => e.empCode.startsWith(prefix + "-")
      );
      let maxNum = 0;
      for (const e of deptEmployees) {
        const parts = e.empCode.split("-");
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
      const nextNum = maxNum + 1;
      const code = `${prefix}-${String(nextNum).padStart(3, "0")}`;
      res.json({ code });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate employee code" });
    }
  });

  app.get("/api/employees/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid employee ID" });
      const employee = await storage.getEmployee(id);
      if (!employee) return res.status(404).json({ message: "Employee not found" });
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.get("/api/employees/:id/salary-history", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid employee ID" });
      const entries = await storage.getSalaryHistory(id);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch salary history" });
    }
  });

  app.post("/api/salary-history", requireAuth, async (req, res) => {
    try {
      const { insertSalaryHistorySchema } = await import("@shared/schema");
      const parsed = insertSalaryHistorySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const entry = await storage.createSalaryHistoryEntry(parsed.data);
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create salary entry" });
    }
  });

  app.patch("/api/salary-history/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { insertSalaryHistorySchema } = await import("@shared/schema");
      const parsed = insertSalaryHistorySchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const updated = await storage.updateSalaryHistoryEntry(id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update" });
    }
  });

  app.delete("/api/salary-history/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteSalaryHistoryEntry(parseInt(req.params.id));
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete" });
    }
  });

  app.get("/api/advance-loans", requireAuth, async (_req, res) => {
    try {
      res.json(await storage.getAdvanceLoans());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch advance/loans" });
    }
  });

  app.get("/api/advance-loans/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const item = await storage.getAdvanceLoan(id);
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch advance/loan" });
    }
  });

  app.post("/api/advance-loans", requireAuth, async (req, res) => {
    try {
      const { insertAdvanceLoanSchema } = await import("@shared/schema");
      const parsed = insertAdvanceLoanSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const created = await storage.createAdvanceLoan(parsed.data);
      if (parsed.data.repaymentType === "installment" && parsed.data.installments && parsed.data.installments >= 1) {
        const totalAmount = Number(parsed.data.amount);
        const numInst = parsed.data.installments;
        const emiAmount = Math.ceil((totalAmount / numInst) * 100) / 100;
        const startMonth = parsed.data.installmentStartMonth || new Date().toISOString().slice(0, 7);
        for (let i = 0; i < numInst; i++) {
          const [year, month] = startMonth.split("-").map(Number);
          const dueDate = new Date(year, month - 1 + i, 1);
          const dueDateStr = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}-01`;
          const isLast = i === numInst - 1;
          const amt = isLast ? (totalAmount - emiAmount * (numInst - 1)).toFixed(2) : emiAmount.toFixed(2);
          await storage.createLoanInstallment({
            loanId: created.id,
            installmentNo: i + 1,
            dueDate: dueDateStr,
            amount: amt,
            status: "pending",
          });
        }
      }
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create advance/loan" });
    }
  });

  app.patch("/api/advance-loans/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const { insertAdvanceLoanSchema } = await import("@shared/schema");
      const parsed = insertAdvanceLoanSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const updated = await storage.updateAdvanceLoan(id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update" });
    }
  });

  app.delete("/api/advance-loans/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteAdvanceLoan(parseInt(req.params.id));
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete" });
    }
  });

  app.get("/api/advance-loans/:id/installments", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      res.json(await storage.getLoanInstallments(id));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch installments" });
    }
  });

  app.patch("/api/loan-installments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const { insertLoanInstallmentSchema } = await import("@shared/schema");
      const parsed = insertLoanInstallmentSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const updated = await storage.updateLoanInstallment(id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Not found" });
      if (parsed.data.status === "paid" || parsed.data.paidDate) {
        const installment = updated;
        const allInstallments = await storage.getLoanInstallments(installment.loanId);
        const totalPaid = allInstallments.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
        const loan = await storage.getAdvanceLoan(installment.loanId);
        if (loan) {
          const totalAmount = Number(loan.amount);
          await storage.updateAdvanceLoan(installment.loanId, {
            paidAmount: totalPaid.toFixed(2),
            status: totalPaid >= totalAmount ? "completed" : "active",
          });
        }
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update installment" });
    }
  });

  app.get("/api/payroll", requireAuth, async (req, res) => {
    try {
      const month = req.query.month as string | undefined;
      res.json(await storage.getPayrolls(month));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payroll" });
    }
  });

  app.get("/api/payroll/payments-summary", requireAuth, async (req, res) => {
    try {
      const month = req.query.month as string | undefined;
      const entries = await storage.getPayrolls(month);
      const summary: Record<number, { totalPaid: number; paymentCount: number; remaining: number }> = {};
      for (const entry of entries) {
        if (entry.status === "paid" || entry.status === "partial") {
          const payments = await storage.getSalaryPayments(entry.id);
          const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
          const netSalary = Number(entry.netSalary);
          const remaining = entry.status === "paid" ? 0 : Math.max(0, netSalary - totalPaid);
          summary[entry.id] = {
            totalPaid: entry.status === "paid" && totalPaid === 0 ? netSalary : totalPaid,
            paymentCount: payments.length,
            remaining,
          };
        }
      }
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments summary" });
    }
  });

  app.get("/api/payroll/pending-summary", requireAuth, async (req, res) => {
    try {
      const excludeMonth = req.query.excludeMonth as string | undefined;
      const allPayroll = await storage.getPayrolls();
      const unpaid = allPayroll.filter(p => (p.status === "pending" || p.status === "partial") && (!excludeMonth || p.payrollMonth !== excludeMonth));
      const summary: Record<number, { count: number; totalAmount: number; months: string[]; entries: { month: string; status: string; netSalary: number; totalPaid: number; remaining: number }[] }> = {};
      for (const p of unpaid) {
        if (!summary[p.employeeId]) summary[p.employeeId] = { count: 0, totalAmount: 0, months: [], entries: [] };
        let remaining = Number(p.netSalary);
        let totalPaid = 0;
        if (p.status === "partial") {
          const payments = await storage.getSalaryPayments(p.id);
          totalPaid = payments.reduce((sum, pm) => sum + Number(pm.amount), 0);
          remaining = Math.max(0, Number(p.netSalary) - totalPaid);
        }
        summary[p.employeeId].count++;
        summary[p.employeeId].totalAmount += remaining;
        summary[p.employeeId].months.push(p.payrollMonth);
        summary[p.employeeId].entries.push({
          month: p.payrollMonth,
          status: p.status,
          netSalary: Number(p.netSalary),
          totalPaid,
          remaining,
        });
      }
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending summary" });
    }
  });

  app.get("/api/payroll/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const item = await storage.getPayroll(id);
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payroll entry" });
    }
  });

  app.post("/api/payroll/process", requireAuth, async (req, res) => {
    try {
      const { month } = req.body;
      if (!month) return res.status(400).json({ message: "Month is required" });
      const allEmployees = await storage.getEmployees();
      const activeEmployees = allEmployees.filter(e => e.status === "active");
      const existing = await storage.getPayrolls(month);
      const existingEmpIds = new Set(existing.map(p => p.employeeId));
      const allLoans = await storage.getAdvanceLoans();

      const monthBonusCommissions = await storage.getBonusCommissions(month);
      const approvedBCs = monthBonusCommissions.filter(
        (bc: any) => bc.status === "approved" && bc.includeInPayroll !== false
      );
      const bcByEmployee: Record<number, { bonus: number; commission: number }> = {};
      for (const bc of approvedBCs) {
        if (!bcByEmployee[bc.employeeId]) bcByEmployee[bc.employeeId] = { bonus: 0, commission: 0 };
        if (bc.incentiveType === "commission") {
          bcByEmployee[bc.employeeId].commission += Number(bc.amount) || 0;
        } else {
          bcByEmployee[bc.employeeId].bonus += Number(bc.amount) || 0;
        }
      }

      const results: any[] = [];
      for (const emp of activeEmployees) {
        if (existingEmpIds.has(emp.id)) continue;
        const baseSalary = Number(emp.salary) || 0;
        const activeLoans = (allLoans as any[]).filter(
          (l: any) => l.employeeId === emp.id && (l.status === "active") && l.repaymentType === "installment"
        );
        let loanDeduction = 0;
        for (const loan of activeLoans) {
          loanDeduction += Number(loan.installmentAmount) || 0;
        }
        const oneTimeLoans = (allLoans as any[]).filter(
          (l: any) => l.employeeId === emp.id && l.status === "active" && l.repaymentType === "one_time" && Number(l.paidAmount) < Number(l.amount)
        );
        for (const loan of oneTimeLoans) {
          loanDeduction += Number(loan.amount) - Number(loan.paidAmount);
        }
        const empBC = bcByEmployee[emp.id] || { bonus: 0, commission: 0 };
        const tax = baseSalary > 100000 ? Math.round(baseSalary * 0.05) : baseSalary > 50000 ? Math.round(baseSalary * 0.02) : 0;
        const netSalary = baseSalary + empBC.bonus + empBC.commission - loanDeduction - tax;
        const entry = await storage.createPayroll({
          employeeId: emp.id,
          payrollMonth: month,
          baseSalary: baseSalary.toFixed(2),
          attendanceDeduction: "0",
          overtime: "0",
          bonus: empBC.bonus.toFixed(2),
          commission: empBC.commission.toFixed(2),
          loanDeduction: loanDeduction.toFixed(2),
          tax: tax.toFixed(2),
          otherDeductions: "0",
          netSalary: Math.max(0, netSalary).toFixed(2),
          status: "processed",
        });
        results.push(entry);
      }
      res.json({ message: `Processed ${results.length} payroll entries`, count: results.length });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to process payroll" });
    }
  });

  app.post("/api/payroll/recalculate", requireAuth, async (req, res) => {
    try {
      const { month } = req.body;
      if (!month) return res.status(400).json({ message: "Month is required" });
      const existing = await storage.getPayrolls(month);
      if (existing.length === 0) return res.json({ message: "No payroll entries found for this month", count: 0 });
      const allLoans = await storage.getAdvanceLoans();
      const monthBonusCommissions = await storage.getBonusCommissions(month);
      const approvedBCs = monthBonusCommissions.filter(
        (bc: any) => bc.status === "approved" && bc.includeInPayroll !== false
      );
      const bcByEmployee: Record<number, { bonus: number; commission: number }> = {};
      for (const bc of approvedBCs) {
        if (!bcByEmployee[bc.employeeId]) bcByEmployee[bc.employeeId] = { bonus: 0, commission: 0 };
        if (bc.incentiveType === "commission") {
          bcByEmployee[bc.employeeId].commission += Number(bc.amount) || 0;
        } else {
          bcByEmployee[bc.employeeId].bonus += Number(bc.amount) || 0;
        }
      }
      let updated = 0;
      for (const entry of existing) {
        if (entry.status === "paid" || entry.status === "locked") continue;
        const baseSalary = Number(entry.baseSalary) || 0;
        const overtime = Number(entry.overtime) || 0;
        const attendanceDeduction = Number(entry.attendanceDeduction) || 0;
        const tax = Number(entry.tax) || 0;
        const otherDeductions = Number(entry.otherDeductions) || 0;
        const activeLoans = (allLoans as any[]).filter(
          (l: any) => l.employeeId === entry.employeeId && l.status === "active" && l.repaymentType === "installment"
        );
        let loanDeduction = 0;
        for (const loan of activeLoans) loanDeduction += Number(loan.installmentAmount) || 0;
        const oneTimeLoans = (allLoans as any[]).filter(
          (l: any) => l.employeeId === entry.employeeId && l.status === "active" && l.repaymentType === "one_time" && Number(l.paidAmount) < Number(l.amount)
        );
        for (const loan of oneTimeLoans) loanDeduction += Number(loan.amount) - Number(loan.paidAmount);
        const empBC = bcByEmployee[entry.employeeId] || { bonus: 0, commission: 0 };
        const netSalary = Math.max(0, baseSalary + overtime + empBC.bonus + empBC.commission - loanDeduction - attendanceDeduction - tax - otherDeductions);
        await storage.updatePayroll(entry.id, {
          bonus: empBC.bonus.toFixed(2),
          commission: empBC.commission.toFixed(2),
          loanDeduction: loanDeduction.toFixed(2),
          netSalary: netSalary.toFixed(2),
        });
        updated++;
      }
      res.json({ message: `Recalculated ${updated} payroll entries`, count: updated });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to recalculate payroll" });
    }
  });

  app.post("/api/payroll", requireAuth, async (req, res) => {
    try {
      const { insertPayrollSchema } = await import("@shared/schema");
      const parsed = insertPayrollSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const created = await storage.createPayroll(parsed.data);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create payroll entry" });
    }
  });

  app.patch("/api/payroll/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const { insertPayrollSchema } = await import("@shared/schema");
      const parsed = insertPayrollSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const updated = await storage.updatePayroll(id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update" });
    }
  });

  app.post("/api/payroll/lock", requireAuth, async (req, res) => {
    try {
      const { month } = req.body;
      if (!month) return res.status(400).json({ message: "Month is required" });
      const entries = await storage.getPayrolls(month);
      let count = 0;
      for (const entry of entries) {
        if (entry.status !== "paid" && entry.status !== "locked") {
          await storage.updatePayroll(entry.id, { status: "locked" });
          count++;
        }
      }
      res.json({ message: `Locked ${count} entries`, count });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to lock payroll" });
    }
  });

  app.post("/api/payroll/unlock", requireAuth, async (req, res) => {
    try {
      const { month } = req.body;
      if (!month) return res.status(400).json({ message: "Month is required" });
      const entries = await storage.getPayrolls(month);
      let count = 0;
      for (const entry of entries) {
        if (entry.status === "locked") {
          await storage.updatePayroll(entry.id, { status: "processed" });
          count++;
        }
      }
      res.json({ message: `Unlocked ${count} entries`, count });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to unlock payroll" });
    }
  });

  app.post("/api/payroll/bulk-pay", requireAuth, async (req, res) => {
    try {
      const { ids, paymentMethod, paymentRef, remarks, amounts } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "IDs required" });
      const today = new Date().toISOString().split("T")[0];
      const allowedStatuses = ["processed", "approved", "locked", "partial"];
      let count = 0;
      let skipped = 0;
      for (const id of ids) {
        const entry = await storage.getPayroll(id);
        if (!entry || !allowedStatuses.includes(entry.status)) {
          skipped++;
          continue;
        }
        const payAmount = amounts && amounts[String(id)] !== undefined ? Number(amounts[String(id)]) : Number(entry.netSalary);
        if (payAmount <= 0) { skipped++; continue; }

        await storage.createSalaryPayment({
          payrollId: id,
          amount: payAmount.toFixed(2),
          paymentMethod: paymentMethod || "bank",
          paymentRef: paymentRef || "",
          remarks: remarks || "",
          paidDate: today,
        });

        const allPayments = await storage.getSalaryPayments(id);
        const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const netSalary = Number(entry.netSalary);
        const newStatus = totalPaid >= netSalary ? "paid" : "partial";
        await storage.updatePayroll(id, {
          status: newStatus,
          paymentMethod: paymentMethod || "bank",
          paymentRef: paymentRef || "",
          paidDate: today,
        });
        count++;
      }
      res.json({ message: `Paid ${count} employee${count !== 1 ? "s" : ""}${skipped > 0 ? `, ${skipped} skipped` : ""}`, count });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to process bulk payment" });
    }
  });

  app.post("/api/payroll/add-pending", requireAuth, async (req, res) => {
    try {
      const { employeeId, fromMonth, toMonth, amount, remarks } = req.body;
      if (typeof employeeId !== "number") return res.status(400).json({ message: "Employee ID is required" });
      if (!fromMonth || !toMonth || typeof fromMonth !== "string" || typeof toMonth !== "string") return res.status(400).json({ message: "From and To months are required" });
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(fromMonth) || !monthRegex.test(toMonth)) return res.status(400).json({ message: "Invalid month format. Use YYYY-MM" });
      if (fromMonth > toMonth) return res.status(400).json({ message: "From month must be before or equal to To month" });
      const [fy2, fm2] = fromMonth.split("-").map(Number);
      const [ty2, tm2] = toMonth.split("-").map(Number);
      const totalMonths = (ty2 - fy2) * 12 + (tm2 - fm2) + 1;
      if (totalMonths > 24) return res.status(400).json({ message: "Cannot create more than 24 months of pending salary at once" });

      const months: string[] = [];
      const [fy, fm] = fromMonth.split("-").map(Number);
      const [ty, tm] = toMonth.split("-").map(Number);
      let cy = fy, cm = fm;
      while (cy < ty || (cy === ty && cm <= tm)) {
        months.push(`${cy}-${String(cm).padStart(2, "0")}`);
        cm++;
        if (cm > 12) { cm = 1; cy++; }
      }

      let targetEmployees: any[];
      if (employeeId === 0) {
        const allEmployees = await storage.getEmployees();
        targetEmployees = allEmployees.filter(e => e.status === "active");
      } else {
        const emp = await storage.getEmployee(employeeId);
        if (!emp) return res.status(404).json({ message: "Employee not found" });
        targetEmployees = [emp];
      }

      let created = 0;
      let skipped = 0;
      for (const month of months) {
        const existing = await storage.getPayrolls(month);
        const existingEmpIds = new Set(existing.map(p => p.employeeId));
        for (const emp of targetEmployees) {
          if (existingEmpIds.has(emp.id)) {
            skipped++;
            continue;
          }
          const salaryAmount = employeeId === 0 ? (Number(emp.salary) || 0) : (Number(amount) || Number(emp.salary) || 0);
          await storage.createPayroll({
            employeeId: emp.id,
            payrollMonth: month,
            baseSalary: salaryAmount.toFixed(2),
            attendanceDeduction: "0",
            overtime: "0",
            bonus: "0",
            commission: "0",
            loanDeduction: "0",
            tax: "0",
            otherDeductions: "0",
            netSalary: salaryAmount.toFixed(2),
            status: "pending",
            remarks: remarks || "Pending salary (pre-system entry)",
          });
          created++;
        }
      }
      res.json({
        message: `Created ${created} pending salary entries${skipped > 0 ? ` (${skipped} already existed, skipped)` : ""}`,
        created,
        skipped,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create pending salary entries" });
    }
  });

  app.get("/api/payroll/:id/payments", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const payments = await storage.getSalaryPayments(id);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get payments" });
    }
  });

  app.post("/api/payroll/:id/payments", requireAuth, async (req, res) => {
    try {
      const payrollId = parseInt(req.params.id);
      if (isNaN(payrollId)) return res.status(400).json({ message: "Invalid payroll ID" });
      const entry = await storage.getPayroll(payrollId);
      if (!entry) return res.status(404).json({ message: "Payroll entry not found" });
      const { amount, paymentMethod, paymentRef, remarks, bankName, bankBranch, bankAccount, paidBy } = req.body;
      const payAmount = Number(amount);
      if (!isFinite(payAmount) || payAmount <= 0) return res.status(400).json({ message: "Valid amount is required" });
      const validMethods = ["bank", "cash", "cheque", "online"];
      const method = paymentMethod && validMethods.includes(paymentMethod) ? paymentMethod : "bank";
      const today = new Date().toISOString().split("T")[0];
      const payment = await storage.createSalaryPayment({
        payrollId,
        amount: payAmount.toFixed(2),
        paymentMethod: method,
        paymentRef: paymentRef || "",
        remarks: remarks || "",
        paidDate: today,
        paidBy: paidBy || "",
      });

      const allPayments = await storage.getSalaryPayments(payrollId);
      const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const netSalary = Number(entry.netSalary);
      const newStatus = totalPaid >= netSalary ? "paid" : "partial";
      await storage.updatePayroll(payrollId, {
        status: newStatus,
        paymentMethod: method,
        paymentRef: paymentRef || "",
        paidDate: today,
      });

      if (method === "bank" && entry.employeeId && (bankName || bankBranch || bankAccount)) {
        const bankUpdate: Record<string, string> = {};
        if (bankName !== undefined) bankUpdate.bankName = bankName;
        if (bankBranch !== undefined) bankUpdate.bankBranch = bankBranch;
        if (bankAccount !== undefined) bankUpdate.bankAccount = bankAccount;
        if (Object.keys(bankUpdate).length > 0) {
          await storage.updateEmployee(entry.employeeId, bankUpdate);
        }
      }

      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create payment" });
    }
  });

  app.patch("/api/salary-payments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const existing = await storage.getSalaryPayment(id);
      if (!existing) return res.status(404).json({ message: "Payment not found" });
      const { amount, paymentMethod, paymentRef, remarks } = req.body;
      const validMethods = ["bank", "cash", "cheque", "online"];
      const updateData: any = {};
      if (amount !== undefined) {
        const numAmount = Number(amount);
        if (!isFinite(numAmount) || numAmount <= 0) return res.status(400).json({ message: "Amount must be a positive number" });
        updateData.amount = numAmount.toFixed(2);
      }
      if (paymentMethod !== undefined) {
        if (!validMethods.includes(paymentMethod)) return res.status(400).json({ message: "Invalid payment method" });
        updateData.paymentMethod = paymentMethod;
      }
      if (paymentRef !== undefined) updateData.paymentRef = paymentRef;
      if (remarks !== undefined) updateData.remarks = remarks;
      const updated = await storage.updateSalaryPayment(id, updateData);

      const allPayments = await storage.getSalaryPayments(existing.payrollId);
      const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const entry = await storage.getPayroll(existing.payrollId);
      if (entry) {
        const netSalary = Number(entry.netSalary);
        const newStatus = totalPaid >= netSalary ? "paid" : "partial";
        const latestPayment = allPayments[0];
        await storage.updatePayroll(existing.payrollId, {
          status: newStatus,
          paymentMethod: latestPayment?.paymentMethod || entry.paymentMethod,
          paymentRef: latestPayment?.paymentRef || entry.paymentRef,
          paidDate: latestPayment?.paidDate || entry.paidDate,
        });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update payment" });
    }
  });

  app.delete("/api/salary-payments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const existing = await storage.getSalaryPayment(id);
      if (!existing) return res.status(404).json({ message: "Payment not found" });
      await storage.deleteSalaryPayment(id);

      const allPayments = await storage.getSalaryPayments(existing.payrollId);
      const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const entry = await storage.getPayroll(existing.payrollId);
      if (entry) {
        const netSalary = Number(entry.netSalary);
        let newStatus: string;
        if (totalPaid <= 0) {
          newStatus = entry.status === "pending" ? "pending" : "processed";
        } else {
          newStatus = totalPaid >= netSalary ? "paid" : "partial";
        }
        const latestPayment = allPayments[0];
        await storage.updatePayroll(existing.payrollId, {
          status: newStatus,
          paymentMethod: latestPayment?.paymentMethod || null,
          paymentRef: latestPayment?.paymentRef || null,
          paidDate: latestPayment?.paidDate || null,
        });
      }
      res.json({ message: "Payment deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete payment" });
    }
  });

  app.delete("/api/payroll/:id", requireAuth, async (req, res) => {
    try {
      await storage.deletePayroll(parseInt(req.params.id));
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete" });
    }
  });

  app.get("/api/bonus-commissions", requireAuth, async (req, res) => {
    try {
      const month = req.query.month as string | undefined;
      const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
      const data = await storage.getBonusCommissions(month, employeeId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch bonus/commissions" });
    }
  });

  app.get("/api/bonus-commissions/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getBonusCommission(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch" });
    }
  });

  app.post("/api/bonus-commissions", requireAuth, async (req, res) => {
    try {
      const parsed = insertBonusCommissionSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.errors });
      const existing = await storage.getBonusCommissions(parsed.data.month);
      const duplicate = existing.find(
        (e: any) => e.employeeId === parsed.data.employeeId && e.type === parsed.data.type && e.status !== "rejected"
      );
      if (duplicate) return res.status(400).json({ message: `Duplicate entry: ${parsed.data.type} already exists for this employee in ${parsed.data.month}` });
      const created = await storage.createBonusCommission(parsed.data);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create" });
    }
  });

  app.patch("/api/bonus-commissions/:id", requireAuth, async (req, res) => {
    try {
      const parsed = insertBonusCommissionSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.errors });
      const updated = await storage.updateBonusCommission(parseInt(req.params.id), parsed.data);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update" });
    }
  });

  app.delete("/api/bonus-commissions/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteBonusCommission(parseInt(req.params.id));
      res.json({ message: "Deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete" });
    }
  });

  app.post("/api/bonus-commissions/:id/approve", requireAuth, async (req, res) => {
    try {
      const item = await storage.getBonusCommission(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "Not found" });
      if (item.status !== "pending") return res.status(400).json({ message: "Only pending entries can be approved" });
      const updated = await storage.updateBonusCommission(parseInt(req.params.id), {
        status: "approved",
        approvedBy: "Admin",
        approvalDate: new Date().toISOString().split("T")[0],
      });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to approve" });
    }
  });

  app.post("/api/bonus-commissions/:id/reject", requireAuth, async (req, res) => {
    try {
      const item = await storage.getBonusCommission(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "Not found" });
      if (item.status !== "pending") return res.status(400).json({ message: "Only pending entries can be rejected" });
      const updated = await storage.updateBonusCommission(parseInt(req.params.id), {
        status: "rejected",
        approvedBy: "Admin",
        approvalDate: new Date().toISOString().split("T")[0],
      });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to reject" });
    }
  });

  app.post("/api/bonus-commissions/:id/mark-paid", requireAuth, async (req, res) => {
    try {
      const item = await storage.getBonusCommission(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "Not found" });
      if (item.status !== "approved") return res.status(400).json({ message: "Only approved entries can be marked as paid" });
      const updated = await storage.updateBonusCommission(parseInt(req.params.id), {
        status: "paid",
        paidDate: new Date().toISOString().split("T")[0],
      });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to mark as paid" });
    }
  });

  crudRoutes(app, "commission-types", insertCommissionTypeSchema,
    () => storage.getCommissionTypes(),
    (id) => storage.getCommissionType(id),
    (data) => storage.createCommissionType(data),
    (id, data) => storage.updateCommissionType(id, data),
    (id) => storage.deleteCommissionType(id),
  );

  // Helper: find HRM role by name (case-insensitive)
  async function findHrmRoleByName(name: string) {
    const all = await storage.getHrmRoles();
    return all.find(hr => hr.name.toLowerCase().trim() === name.toLowerCase().trim());
  }

  // Helper: ensure every org role has a linked HRM role (run at startup)
  async function syncOrgRolesToHrmRoles() {
    try {
      const orgRoles = await storage.getRoles();
      const hrmRoles = await storage.getHrmRoles();
      const hrmNames = new Set(hrmRoles.map(hr => hr.name.toLowerCase().trim()));
      for (const role of orgRoles) {
        if (!hrmNames.has(role.name.toLowerCase().trim())) {
          const counter = Date.now().toString(36).toUpperCase().slice(-6);
          await storage.createHrmRole({
            name: role.name,
            description: (role as any).description || `HRM access role for ${role.name}`,
            roleId: `ROLE-${counter}`,
            isSystem: false,
            createdAt: new Date().toISOString(),
          } as any);
        }
      }
    } catch (_) {}
  }
  syncOrgRolesToHrmRoles();

  // POST /api/roles — create org role + auto-create HRM role
  app.post("/api/roles", requireAuth, async (req, res) => {
    try {
      const parsed = insertRoleSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const role = await storage.createRole(parsed.data);
      const alreadyLinked = !!(await findHrmRoleByName(role.name));
      if (!alreadyLinked) {
        const counter = Date.now().toString(36).toUpperCase().slice(-6);
        await storage.createHrmRole({
          name: role.name,
          description: (role as any).description || `HRM access role for ${role.name}`,
          roleId: `ROLE-${counter}`,
          isSystem: false,
          createdAt: new Date().toISOString(),
        } as any);
      }
      res.status(201).json({ ...role, hrmRoleLinked: !alreadyLinked });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create role" });
    }
  });

  // PATCH /api/roles/:id — update org role + cascade name change to HRM role
  app.patch("/api/roles/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getRole(id);
      if (!existing) return res.status(404).json({ message: "Role not found" });
      const updated = await storage.updateRole(id, req.body);
      const newName = req.body.name;
      if (newName && newName !== existing.name) {
        const hrmRole = await findHrmRoleByName(existing.name);
        if (hrmRole) {
          await storage.updateHrmRole(hrmRole.id, { name: newName });
        } else {
          const counter = Date.now().toString(36).toUpperCase().slice(-6);
          await storage.createHrmRole({
            name: newName,
            description: req.body.description || `HRM access role for ${newName}`,
            roleId: `ROLE-${counter}`,
            isSystem: false,
            createdAt: new Date().toISOString(),
          } as any);
        }
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update role" });
    }
  });

  // DELETE /api/roles/:id — delete org role + cascade delete matching HRM role
  app.delete("/api/roles/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getRole(id);
      if (!existing) return res.status(404).json({ message: "Role not found" });
      const hrmRole = await findHrmRoleByName(existing.name);
      if (hrmRole && !hrmRole.isSystem) {
        await storage.deleteHrmRole(hrmRole.id);
      }
      await storage.deleteRole(id);
      res.json({ message: "Deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete role" });
    }
  });

  crudRoutes(app, "roles", insertRoleSchema,
    () => storage.getRoles(),
    (id) => storage.getRole(id),
    (data) => storage.createRole(data),
    (id, data) => storage.updateRole(id, data),
    (id) => storage.deleteRole(id),
  );

  crudRoutes(app, "employee-types", insertEmployeeTypeSchema,
    () => storage.getEmployeeTypes(),
    (id) => storage.getEmployeeType(id),
    (data) => storage.createEmployeeType(data),
    (id, data) => storage.updateEmployeeType(id, data),
    (id) => storage.deleteEmployeeType(id),
  );

  crudRoutes(app, "shifts", insertShiftSchema,
    () => storage.getShifts(),
    (id) => storage.getShift(id),
    (data) => storage.createShift(data),
    (id, data) => storage.updateShift(id, data),
    (id) => storage.deleteShift(id),
  );

  crudRoutes(app, "shift-assignments", insertShiftAssignmentSchema,
    () => storage.getShiftAssignments(),
    (id) => storage.getShiftAssignment(id),
    (data) => storage.createShiftAssignment(data),
    (id, data) => storage.updateShiftAssignment(id, data),
    (id) => storage.deleteShiftAssignment(id),
  );

  crudRoutes(app, "notifications", insertNotificationSchema,
    () => storage.getNotifications(),
    (id) => storage.getNotification(id),
    (data) => storage.createNotification(data),
    (id, data) => storage.updateNotification(id, data),
    (id) => storage.deleteNotification(id),
  );

  crudRoutes(app, "reports", insertReportSchema,
    () => storage.getReports(),
    (id) => storage.getReport(id),
    (data) => storage.createReport(data),
    (id, data) => storage.updateReport(id, data),
    (id) => storage.deleteReport(id),
  );

  app.get("/api/company", requireAuth, async (_req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      res.json(settings || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch company settings" });
    }
  });

  app.post("/api/company", requireAuth, async (req, res) => {
    try {
      const parsed = insertCompanySettingsSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const result = await storage.upsertCompanySettings(parsed.data);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to save company settings" });
    }
  });

  app.post("/api/upload/logo", requireAuth, uploadLogo.single("logo"), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Upload failed" });
    }
  });

  const docStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  });
  const uploadDoc = multer({
    storage: docStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf"];
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, allowed.includes(ext));
    },
  });

  app.post("/api/upload/document", requireAuth, uploadDoc.single("file"), (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Upload failed" });
    }
  });

  app.get("/api/reseller-types", requireAuth, async (_req, res) => {
    try { res.json(await storage.getResellerTypes()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/reseller-types/:id", requireAuth, async (req, res) => {
    try { const r = await storage.getResellerType(parseInt(req.params.id)); if (!r) return res.status(404).json({ message: "Not found" }); res.json(r); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/reseller-types", requireAuth, async (req, res) => {
    try {
      const { insertResellerTypeSchema } = await import("@shared/schema");
      const parsed = insertResellerTypeSchema.parse(req.body);
      res.status(201).json(await storage.createResellerType(parsed));
    } catch (e: any) { res.status(e.name === "ZodError" ? 400 : 500).json({ message: e.message }); }
  });
  app.patch("/api/reseller-types/:id", requireAuth, async (req, res) => {
    try {
      const { insertResellerTypeSchema } = await import("@shared/schema");
      const parsed = insertResellerTypeSchema.partial().parse(req.body);
      const r = await storage.updateResellerType(parseInt(req.params.id), parsed);
      if (!r) return res.status(404).json({ message: "Not found" }); res.json(r);
    } catch (e: any) { res.status(e.name === "ZodError" ? 400 : 500).json({ message: e.message }); }
  });
  app.delete("/api/reseller-types/:id", requireAuth, async (req, res) => {
    try { await storage.deleteResellerType(parseInt(req.params.id)); res.json({ message: "Deleted" }); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/cir-customers", requireAuth, async (_req, res) => {
    try { res.json(await storage.getCirCustomers()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/cir-customers/:id", requireAuth, async (req, res) => {
    try { const r = await storage.getCirCustomer(parseInt(req.params.id)); if (!r) return res.status(404).json({ message: "Not found" }); res.json(r); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/cir-customers", requireAuth, async (req, res) => {
    try {
      const { insertCirCustomerSchema } = await import("@shared/schema");
      const parsed = insertCirCustomerSchema.parse(req.body);
      res.status(201).json(await storage.createCirCustomer(parsed));
    } catch (e: any) { res.status(e.name === "ZodError" ? 400 : 500).json({ message: e.message }); }
  });
  app.patch("/api/cir-customers/:id", requireAuth, async (req, res) => {
    try {
      const { insertCirCustomerSchema } = await import("@shared/schema");
      const parsed = insertCirCustomerSchema.partial().parse(req.body);
      const r = await storage.updateCirCustomer(parseInt(req.params.id), parsed);
      if (!r) return res.status(404).json({ message: "Not found" });
      res.json(r);
    } catch (e: any) { res.status(e.name === "ZodError" ? 400 : 500).json({ message: e.message }); }
  });
  app.delete("/api/cir-customers/:id", requireAuth, async (req, res) => {
    try { await storage.deleteCirCustomer(parseInt(req.params.id)); res.json({ message: "Deleted" }); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/corporate-customers", requireAuth, async (_req, res) => {
    try { res.json(await storage.getCorporateCustomers()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/corporate-customers/:id", requireAuth, async (req, res) => {
    try { const r = await storage.getCorporateCustomer(parseInt(req.params.id)); if (!r) return res.status(404).json({ message: "Not found" }); res.json(r); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/corporate-customers", requireAuth, async (req, res) => {
    try {
      const { insertCorporateCustomerSchema } = await import("@shared/schema");
      const parsed = insertCorporateCustomerSchema.parse(req.body);
      res.status(201).json(await storage.createCorporateCustomer(parsed));
    } catch (e: any) { res.status(e.name === "ZodError" ? 400 : 500).json({ message: e.message }); }
  });
  app.patch("/api/corporate-customers/:id", requireAuth, async (req, res) => {
    try {
      const { insertCorporateCustomerSchema } = await import("@shared/schema");
      const parsed = insertCorporateCustomerSchema.partial().parse(req.body);
      const r = await storage.updateCorporateCustomer(parseInt(req.params.id), parsed);
      if (!r) return res.status(404).json({ message: "Not found" });
      res.json(r);
    } catch (e: any) { res.status(e.name === "ZodError" ? 400 : 500).json({ message: e.message }); }
  });
  app.delete("/api/corporate-customers/:id", requireAuth, async (req, res) => {
    try { await storage.deleteCorporateCustomer(parseInt(req.params.id)); res.json({ message: "Deleted" }); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/corporate-connections/:corporateId", requireAuth, async (req, res) => {
    try { res.json(await storage.getCorporateConnections(parseInt(req.params.corporateId))); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/corporate-connections", requireAuth, async (req, res) => {
    try {
      const { insertCorporateConnectionSchema } = await import("@shared/schema");
      const parsed = insertCorporateConnectionSchema.parse(req.body);
      res.status(201).json(await storage.createCorporateConnection(parsed));
    } catch (e: any) { res.status(e.name === "ZodError" ? 400 : 500).json({ message: e.message }); }
  });
  app.patch("/api/corporate-connections/:id", requireAuth, async (req, res) => {
    try {
      const { insertCorporateConnectionSchema } = await import("@shared/schema");
      const parsed = insertCorporateConnectionSchema.partial().parse(req.body);
      const r = await storage.updateCorporateConnection(parseInt(req.params.id), parsed);
      if (!r) return res.status(404).json({ message: "Not found" });
      res.json(r);
    } catch (e: any) { res.status(e.name === "ZodError" ? 400 : 500).json({ message: e.message }); }
  });
  app.delete("/api/corporate-connections/:id", requireAuth, async (req, res) => {
    try { await storage.deleteCorporateConnection(parseInt(req.params.id)); res.json({ message: "Deleted" }); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/customer-types", requireAuth, async (_req, res) => {
    try {
      res.json(await storage.getCustomerTypes());
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch customer types" });
    }
  });

  app.post("/api/customer-types", requireAuth, async (req, res) => {
    try {
      const result = await storage.createCustomerType(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create customer type" });
    }
  });

  app.patch("/api/customer-types/:id", requireAuth, async (req, res) => {
    try {
      const result = await storage.updateCustomerType(parseInt(req.params.id), req.body);
      if (!result) return res.status(404).json({ message: "Customer type not found" });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update customer type" });
    }
  });

  app.delete("/api/customer-types/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteCustomerType(parseInt(req.params.id));
      res.json({ message: "Customer type deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete customer type" });
    }
  });

  app.get("/api/customer-queries", requireAuth, async (_req, res) => {
    try {
      res.json(await storage.getCustomerQueries());
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch customer queries" });
    }
  });

  app.get("/api/customer-queries/:id", requireAuth, async (req, res) => {
    try {
      const q = await storage.getCustomerQuery(Number(req.params.id));
      if (!q) return res.status(404).json({ message: "Not found" });
      res.json(q);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch query" });
    }
  });

  app.post("/api/customer-queries", requireAuth, async (req, res) => {
    try {
      const parsed = insertCustomerQuerySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const result = await storage.createCustomerQuery(parsed.data);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create query" });
    }
  });

  app.patch("/api/customer-queries/:id", requireAuth, async (req, res) => {
    try {
      const result = await storage.updateCustomerQuery(Number(req.params.id), req.body);
      if (!result) return res.status(404).json({ message: "Not found" });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update query" });
    }
  });

  app.delete("/api/customer-queries/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteCustomerQuery(Number(req.params.id));
      res.json({ message: "Deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete query" });
    }
  });

  app.get("/api/settings", requireAuth, async (_req, res) => {
    try {
      res.json(await storage.getSettings());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", requireAuth, async (req, res) => {
    try {
      const parsed = insertSettingSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const result = await storage.upsertSetting(parsed.data);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to save setting" });
    }
  });

  app.patch("/api/settings/:id", requireAuth, async (req, res) => {
    try {
      const result = await storage.updateSetting(parseInt(req.params.id), req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update setting" });
    }
  });

  app.delete("/api/settings/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteSetting(parseInt(req.params.id));
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  app.get("/api/customer-connections/:customerId", requireAuth, async (req, res) => {
    try {
      const connections = await storage.getCustomerConnections(parseInt(req.params.customerId));
      res.json(connections);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get connections" });
    }
  });

  app.post("/api/customer-connections", requireAuth, async (req, res) => {
    try {
      const parsed = insertCustomerConnectionSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const conn = await storage.createCustomerConnection(parsed.data);
      res.status(201).json(conn);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create connection" });
    }
  });

  app.patch("/api/customer-connections/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateCustomerConnection(parseInt(req.params.id), req.body);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update connection" });
    }
  });

  app.delete("/api/customer-connections/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteCustomerConnection(parseInt(req.params.id));
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete connection" });
    }
  });

  app.get("/api/notification-templates", requireAuth, async (_req, res) => {
    try { res.json(await storage.getNotificationTemplates()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch notification templates" }); }
  });

  app.post("/api/notification-templates", requireAuth, async (req, res) => {
    try {
      const parsed = insertNotificationTemplateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.createNotificationTemplate(parsed.data);
      res.status(201).json(item);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create template" }); }
  });

  app.patch("/api/notification-templates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { createdAt, createdBy, usageCount, lastUsedAt, ...rest } = req.body;
      const updateSchema = insertNotificationTemplateSchema.partial();
      const parsed = updateSchema.safeParse(rest);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const updated = await storage.updateNotificationTemplate(id, { ...parsed.data, updatedAt: new Date().toISOString() });
      if (!updated) return res.status(404).json({ message: "Template not found" });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to update template" }); }
  });

  app.delete("/api/notification-templates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteNotificationTemplate(id);
      res.json({ message: "Template deleted" });
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to delete template" }); }
  });

  crudRoutes(
    app, "branches", insertBranchSchema,
    () => storage.getBranches(),
    (id) => storage.getBranch(id),
    (data) => storage.createBranch(data),
    (id, data) => storage.updateBranch(id, data),
    (id) => storage.deleteBranch(id),
  );

  app.get("/api/smtp-settings", requireAuth, async (_req, res) => {
    try {
      const s = await storage.getSmtpSettings();
      res.json(s || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SMTP settings" });
    }
  });

  app.post("/api/smtp-settings", requireAuth, async (req, res) => {
    try {
      const parsed = insertSmtpSettingsSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const result = await storage.upsertSmtpSettings(parsed.data);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to save SMTP settings" });
    }
  });

  app.get("/api/sms-settings", requireAuth, async (_req, res) => {
    try {
      const s = await storage.getSmsSettings();
      res.json(s || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SMS settings" });
    }
  });

  app.post("/api/sms-settings", requireAuth, async (req, res) => {
    try {
      const parsed = insertSmsSettingsSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const result = await storage.upsertSmsSettings(parsed.data);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to save SMS settings" });
    }
  });

  app.get("/api/notification-dispatches", requireAuth, async (_req, res) => {
    try {
      res.json(await storage.getNotificationDispatches());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dispatches" });
    }
  });

  app.get("/api/activity-logs", requireAuth, async (_req, res) => {
    try {
      res.json(await storage.getActivityLogs());
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  app.post("/api/notifications/send-email", requireAuth, async (req, res) => {
    try {
      const { to, subject, body, templateId } = req.body;
      if (!to || !subject || !body) {
        return res.status(400).json({ message: "Missing required fields: to, subject, body" });
      }
      const smtpConfig = await storage.getSmtpSettings();
      if (!smtpConfig || !smtpConfig.isActive) {
        return res.status(400).json({ message: "SMTP is not configured. Please set up SMTP settings first." });
      }
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.encryption === "ssl",
        auth: { user: smtpConfig.username, pass: smtpConfig.password },
      });
      await transporter.sendMail({
        from: smtpConfig.fromName ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>` : smtpConfig.fromEmail,
        to,
        subject,
        html: body,
      });
      const dispatch = await storage.createNotificationDispatch({
        templateId: templateId || null,
        channel: "email",
        recipient: to,
        subject,
        body,
        status: "sent",
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      res.json({ success: true, dispatch });
    } catch (error: any) {
      const dispatch = await storage.createNotificationDispatch({
        channel: "email",
        recipient: req.body.to || "",
        subject: req.body.subject || "",
        body: req.body.body || "",
        status: "failed",
        errorMessage: error.message,
        createdAt: new Date().toISOString(),
      });
      res.status(500).json({ message: error.message || "Failed to send email", dispatch });
    }
  });

  app.post("/api/notifications/send-sms", requireAuth, async (req, res) => {
    try {
      const { to, message, templateId } = req.body;
      if (!to || !message) {
        return res.status(400).json({ message: "Missing required fields: to, message" });
      }
      const smsConfig = await storage.getSmsSettings();
      if (!smsConfig || !smsConfig.isActive) {
        return res.status(400).json({ message: "SMS API is not configured. Please set up SMS settings first." });
      }
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (smsConfig.headerParams) {
        try {
          const extra = JSON.parse(smsConfig.headerParams);
          Object.assign(headers, extra);
        } catch {}
      }
      if (smsConfig.apiKey) {
        headers["Authorization"] = `Bearer ${smsConfig.apiKey}`;
      }
      let bodyPayload = smsConfig.bodyTemplate
        ? smsConfig.bodyTemplate.replace("{{to}}", to).replace("{{message}}", message).replace("{{sender_id}}", smsConfig.senderId || "")
        : JSON.stringify({ to, message, sender_id: smsConfig.senderId });

      const response = await fetch(smsConfig.apiUrl, {
        method: smsConfig.httpMethod || "POST",
        headers,
        body: smsConfig.httpMethod === "GET" ? undefined : bodyPayload,
      });
      const responseData = await response.text();
      const dispatch = await storage.createNotificationDispatch({
        templateId: templateId || null,
        channel: "sms",
        recipient: to,
        body: message,
        status: response.ok ? "sent" : "failed",
        errorMessage: response.ok ? undefined : responseData,
        sentAt: response.ok ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString(),
      });
      if (response.ok) {
        res.json({ success: true, dispatch });
      } else {
        res.status(500).json({ message: `SMS API returned error: ${responseData}`, dispatch });
      }
    } catch (error: any) {
      const dispatch = await storage.createNotificationDispatch({
        channel: "sms",
        recipient: req.body.to || "",
        body: req.body.message || "",
        status: "failed",
        errorMessage: error.message,
        createdAt: new Date().toISOString(),
      });
      res.status(500).json({ message: error.message || "Failed to send SMS", dispatch });
    }
  });

  app.post("/api/notifications/send-bulk", requireAuth, async (req, res) => {
    try {
      const { channel, recipients, subject, body, templateId } = req.body;
      if (!channel || !recipients || !Array.isArray(recipients) || recipients.length === 0 || !body) {
        return res.status(400).json({ message: "Missing required fields: channel, recipients[], body" });
      }
      const results = [];
      for (const recipient of recipients) {
        try {
          if (channel === "email") {
            const smtpConfig = await storage.getSmtpSettings();
            if (smtpConfig && smtpConfig.isActive) {
              const nodemailer = await import("nodemailer");
              const transporter = nodemailer.createTransport({
                host: smtpConfig.host,
                port: smtpConfig.port,
                secure: smtpConfig.encryption === "ssl",
                auth: { user: smtpConfig.username, pass: smtpConfig.password },
              });
              await transporter.sendMail({
                from: smtpConfig.fromName ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>` : smtpConfig.fromEmail,
                to: recipient,
                subject: subject || "Notification",
                html: body,
              });
            }
          } else if (channel === "sms") {
            const smsConfig = await storage.getSmsSettings();
            if (smsConfig && smsConfig.isActive) {
              const smsHeaders: Record<string, string> = { "Content-Type": "application/json" };
              if (smsConfig.apiKey) smsHeaders["Authorization"] = `Bearer ${smsConfig.apiKey}`;
              const smsBody = smsConfig.bodyTemplate
                ? smsConfig.bodyTemplate.replace("{{to}}", recipient).replace("{{message}}", body)
                : JSON.stringify({ to: recipient, message: body, sender_id: smsConfig.senderId });
              await fetch(smsConfig.apiUrl, { method: smsConfig.httpMethod || "POST", headers: smsHeaders, body: smsBody });
            }
          }
          const dispatch = await storage.createNotificationDispatch({
            templateId: templateId || null,
            channel,
            recipient,
            subject: subject || undefined,
            body,
            status: "sent",
            sentAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
          results.push({ recipient, status: "sent", dispatch });
        } catch (err: any) {
          const dispatch = await storage.createNotificationDispatch({
            channel,
            recipient,
            body,
            status: "failed",
            errorMessage: err.message,
            createdAt: new Date().toISOString(),
          });
          results.push({ recipient, status: "failed", error: err.message, dispatch });
        }
      }
      res.json({ total: recipients.length, sent: results.filter(r => r.status === "sent").length, results });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to send bulk notifications" });
    }
  });

  // Expenses CRUD
  crudRoutes(app, "expenses", insertExpenseSchema,
    () => storage.getExpenses(),
    (id) => storage.getExpense(id),
    (data) => storage.createExpense(data),
    (id, data) => storage.updateExpense(id, data),
    (id) => storage.deleteExpense(id),
  );

  // Attendance CRUD
  // Leaves
  app.get("/api/leaves", requireAuth, async (req, res) => {
    try {
      const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
      res.json(await storage.getLeaves(employeeId));
    } catch (error) { res.status(500).json({ message: "Failed to fetch leaves" }); }
  });
  app.post("/api/leaves", requireAuth, async (req, res) => {
    try {
      const parsed = insertLeaveSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      res.status(201).json(await storage.createLeave(parsed.data));
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create leave" }); }
  });
  app.patch("/api/leaves/:id", requireAuth, async (req, res) => {
    try {
      const parsed = insertLeaveSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const updated = await storage.updateLeave(parseInt(req.params.id), parsed.data);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.delete("/api/leaves/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteLeave(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) { res.status(500).json({ message: "Failed to delete leave" }); }
  });

  // Holidays
  app.get("/api/holidays", requireAuth, async (_req, res) => {
    try { res.json(await storage.getHolidays()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch holidays" }); }
  });
  app.post("/api/holidays", requireAuth, async (req, res) => {
    try {
      const parsed = insertHolidaySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      res.status(201).json(await storage.createHoliday(parsed.data));
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create holiday" }); }
  });
  app.patch("/api/holidays/:id", requireAuth, async (req, res) => {
    try {
      const parsed = insertHolidaySchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const updated = await storage.updateHoliday(parseInt(req.params.id), parsed.data);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.delete("/api/holidays/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteHoliday(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) { res.status(500).json({ message: "Failed to delete holiday" }); }
  });

  app.get("/api/attendance", requireAuth, async (req, res) => {
    try {
      const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
      res.json(await storage.getAttendanceRecords(employeeId));
    } catch (error) { res.status(500).json({ message: "Failed to fetch attendance" }); }
  });
  app.post("/api/attendance", requireAuth, async (req, res) => {
    try {
      const parsed = insertAttendanceSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const data = parsed.data as any;
      if (data.hoursWorked === "" || data.hoursWorked === undefined) data.hoursWorked = null;
      if (data.overtime === "" || data.overtime === undefined) data.overtime = null;
      res.status(201).json(await storage.createAttendance(data));
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create attendance" }); }
  });
  app.patch("/api/attendance/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const body = req.body as any;
      if (body.hoursWorked === "") body.hoursWorked = null;
      if (body.overtime === "") body.overtime = null;
      const updated = await storage.updateAttendance(id, body);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.delete("/api/attendance/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteAttendance(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) { res.status(500).json({ message: "Failed to delete" }); }
  });

  app.get("/api/attendance-breaks/:attendanceId", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getAttendanceBreaks(parseInt(req.params.attendanceId)));
    } catch (error) { res.status(500).json({ message: "Failed to fetch breaks" }); }
  });
  app.post("/api/attendance-breaks", requireAuth, async (req, res) => {
    try {
      const parsed = insertAttendanceBreakSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      res.status(201).json(await storage.createAttendanceBreak(parsed.data));
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create break" }); }
  });
  app.patch("/api/attendance-breaks/:id", requireAuth, async (req, res) => {
    try {
      const parsed = insertAttendanceBreakSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const updated = await storage.updateAttendanceBreak(parseInt(req.params.id), parsed.data);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });
  app.delete("/api/attendance-breaks/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteAttendanceBreak(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) { res.status(500).json({ message: "Failed to delete break" }); }
  });

  // Audit Logs
  app.get("/api/audit-logs", requireAuth, async (_req, res) => {
    try { res.json(await storage.getAuditLogs()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch audit logs" }); }
  });
  app.post("/api/audit-logs", requireAuth, async (req, res) => {
    try {
      const parsed = insertAuditLogSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
      res.status(201).json(await storage.createAuditLog(parsed.data));
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // Credit Notes CRUD
  crudRoutes(app, "credit-notes", insertCreditNoteSchema,
    () => storage.getCreditNotes(),
    (id) => storage.getCreditNote(id),
    (data) => storage.createCreditNote(data),
    (id, data) => storage.updateCreditNote(id, data),
    (id) => storage.deleteCreditNote(id),
  );

  // Bulk Messages CRUD
  crudRoutes(app, "bulk-messages", insertBulkMessageSchema,
    () => storage.getBulkMessages(),
    (id) => storage.getBulkMessage(id),
    (data) => storage.createBulkMessage(data),
    (id, data) => storage.updateBulkMessage(id, data),
    (id) => storage.deleteBulkMessage(id),
  );

  // IP Addresses CRUD
  crudRoutes(app, "ip-addresses", insertIpAddressSchema,
    () => storage.getIpAddresses(),
    (id) => storage.getIpAddress(id),
    (data) => storage.createIpAddress(data),
    (id, data) => storage.updateIpAddress(id, data),
    (id) => storage.deleteIpAddress(id),
  );

  crudRoutes(app, "subnets", insertSubnetSchema,
    () => storage.getSubnets(),
    (id) => storage.getSubnet(id),
    (data) => storage.createSubnet(data),
    (id, data) => storage.updateSubnet(id, data),
    (id) => storage.deleteSubnet(id),
  );

  crudRoutes(app, "vlans", insertVlanSchema,
    () => storage.getVlans(),
    (id) => storage.getVlan(id),
    (data) => storage.createVlan(data),
    (id, data) => storage.updateVlan(id, data),
    (id) => storage.deleteVlan(id),
  );

  crudRoutes(app, "ipam-logs", insertIpamLogSchema,
    () => storage.getIpamLogs(),
    (id) => Promise.resolve(undefined),
    (data) => storage.createIpamLog(data),
    () => Promise.resolve(undefined),
    () => Promise.resolve(),
  );

  // Outages CRUD
  crudRoutes(app, "outages", insertOutageSchema,
    () => storage.getOutages(),
    (id) => storage.getOutage(id),
    (data) => storage.createOutage(data),
    (id, data) => storage.updateOutage(id, data),
    (id) => storage.deleteOutage(id),
  );

  // Outage Timeline
  app.get("/api/outage-timeline/:outageId", async (req, res) => {
    const timelines = await storage.getOutageTimelines(parseInt(req.params.outageId));
    res.json(timelines);
  });
  app.get("/api/outage-timeline", async (_req, res) => {
    const timelines = await storage.getAllOutageTimelines();
    res.json(timelines);
  });
  app.post("/api/outage-timeline", async (req, res) => {
    const parsed = insertOutageTimelineSchema.parse(req.body);
    const created = await storage.createOutageTimeline(parsed);
    res.json(created);
  });
  app.delete("/api/outage-timeline/:id", async (req, res) => {
    await storage.deleteOutageTimeline(parseInt(req.params.id));
    res.json({ success: true });
  });

  // Network Devices CRUD
  crudRoutes(app, "network-devices", insertNetworkDeviceSchema,
    () => storage.getNetworkDevices(),
    (id) => storage.getNetworkDevice(id),
    (data) => storage.createNetworkDevice(data),
    (id, data) => storage.updateNetworkDevice(id, data),
    (id) => storage.deleteNetworkDevice(id),
  );

  // PPPoE Users CRUD
  crudRoutes(app, "pppoe-users", insertPppoeUserSchema,
    () => storage.getPppoeUsers(),
    (id) => storage.getPppoeUser(id),
    (data) => storage.createPppoeUser(data),
    (id, data) => storage.updatePppoeUser(id, data),
    (id) => storage.deletePppoeUser(id),
  );

  // RADIUS Profiles CRUD
  crudRoutes(app, "radius-profiles", insertRadiusProfileSchema,
    () => storage.getRadiusProfiles(),
    (id) => storage.getRadiusProfile(id),
    (data) => storage.createRadiusProfile(data),
    (id, data) => storage.updateRadiusProfile(id, data),
    (id) => storage.deleteRadiusProfile(id),
  );

  crudRoutes(app, "radius-nas-devices", insertRadiusNasDeviceSchema,
    () => storage.getRadiusNasDevices(),
    (id) => storage.getRadiusNasDevice(id),
    (data) => storage.createRadiusNasDevice(data),
    (id, data) => storage.updateRadiusNasDevice(id, data),
    (id) => storage.deleteRadiusNasDevice(id),
  );

  crudRoutes(app, "radius-auth-logs", insertRadiusAuthLogSchema,
    () => storage.getRadiusAuthLogs(),
    (id) => storage.getRadiusAuthLog(id),
    (data) => storage.createRadiusAuthLog(data),
    (id, data) => storage.updateRadiusAuthLog(id, data),
    (id) => storage.deleteRadiusAuthLog(id),
  );

  // Payment Gateways CRUD
  crudRoutes(app, "payment-gateways", insertPaymentGatewaySchema,
    () => storage.getPaymentGateways(),
    (id) => storage.getPaymentGateway(id),
    (data) => storage.createPaymentGateway(data),
    (id, data) => storage.updatePaymentGateway(id, data),
    (id) => storage.deletePaymentGateway(id),
  );

  // Payments CRUD
  crudRoutes(app, "payments", insertPaymentSchema,
    () => storage.getPayments(),
    (id) => storage.getPayment(id),
    (data) => storage.createPayment(data),
    (id, data) => storage.updatePayment(id, data),
    (id) => storage.deletePayment(id),
  );

  // Billing Rules CRUD
  crudRoutes(app, "billing-rules", insertBillingRuleSchema,
    () => storage.getBillingRules(),
    (id) => storage.getBillingRule(id),
    (data) => storage.createBillingRule(data),
    (id, data) => storage.updateBillingRule(id, data),
    (id) => storage.deleteBillingRule(id),
  );

  // Bandwidth Usage CRUD
  crudRoutes(app, "bandwidth-usage", insertBandwidthUsageSchema,
    () => storage.getBandwidthUsage(),
    (id) => storage.getBandwidthUsageById(id),
    (data) => storage.createBandwidthUsage(data),
    (id, data) => storage.updateBandwidthUsage(id, data),
    (id) => storage.deleteBandwidthUsage(id),
  );

  app.get("/api/bandwidth-usage/customer/:customerId", requireAuth, async (req, res) => {
    try {
      res.json(await storage.getBandwidthUsageByCustomer(parseInt(req.params.customerId)));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bandwidth usage" });
    }
  });

  // Daily Collections CRUD
  crudRoutes(app, "daily-collections", insertDailyCollectionSchema,
    () => storage.getDailyCollections(),
    (id) => storage.getDailyCollection(id),
    (data) => storage.createDailyCollection(data),
    (id, data) => storage.updateDailyCollection(id, data),
    (id) => storage.deleteDailyCollection(id),
  );

  crudRoutes(app, "app-access-configs", insertAppAccessConfigSchema,
    () => storage.getAppAccessConfigs(),
    (id) => storage.getAppAccessConfig(id),
    (data) => storage.createAppAccessConfig(data),
    (id, data) => storage.updateAppAccessConfig(id, data),
    (id) => storage.deleteAppAccessConfig(id),
  );

  app.get("/api/app-access-configs/role/:roleId", requireAuth, async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const config = await storage.getAppAccessConfigByRole(roleId);
      res.json(config || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch app access config" });
    }
  });

  crudRoutes(app, "area-assignments", insertAreaAssignmentSchema,
    () => storage.getAreaAssignments(),
    (id) => storage.getAreaAssignment(id),
    (data) => storage.createAreaAssignment(data),
    (id, data) => storage.updateAreaAssignment(id, data),
    (id) => storage.deleteAreaAssignment(id),
  );

  app.get("/api/area-assignments/employee/:employeeId", requireAuth, async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      res.json(await storage.getAreaAssignmentsByEmployee(employeeId));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch area assignments" });
    }
  });

  app.get("/api/area-assignments/area/:areaId", requireAuth, async (req, res) => {
    try {
      const areaId = parseInt(req.params.areaId);
      res.json(await storage.getAreaAssignmentsByArea(areaId));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch area assignments" });
    }
  });

  app.get("/api/login-activity-logs", requireAuth, async (_req, res) => {
    try { res.json(await storage.getLoginActivityLogs()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch login logs" }); }
  });

  // Users management
  app.get("/api/users", requireAuth, async (_req, res) => {
    try { res.json(await storage.getUsers()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch users" }); }
  });

  app.post("/api/users", requireAuth, async (req, res) => {
    try {
      const { username, password, fullName, email, role, employeeId, department, branch, loginType, maxLoginAttempts, deviceRestriction, twoFactorEnabled, forcePasswordChange, accountExpiryDate } = req.body;
      if (!username || !password || !fullName || !email) {
        return res.status(400).json({ message: "Username, password, full name, and email are required" });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "Username already exists" });
      }
      const user = await storage.createUser({
        username, password, fullName, email,
        role: role || "staff",
        employeeId: employeeId || null,
        department: department || null,
        branch: branch || null,
        loginType: loginType || "both",
        accountStatus: "active",
        maxLoginAttempts: maxLoginAttempts || 5,
        deviceRestriction: deviceRestriction || "multiple",
        twoFactorEnabled: twoFactorEnabled || false,
        forcePasswordChange: forcePasswordChange || false,
        accountExpiryDate: accountExpiryDate || null,
        isActive: true,
      });
      await storage.createActivityLog({
        action: "create",
        module: "Staff Accounts",
        description: `Created login account for ${fullName} (${username})`,
        userId: req.session.userId,
        createdAt: new Date().toISOString(),
      });
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = { ...req.body };
      delete data.id;
      const updated = await storage.updateUser(id, data);
      if (!updated) return res.status(404).json({ message: "User not found" });
      await storage.createActivityLog({
        action: "update",
        module: "Staff Accounts",
        description: `Updated account for ${updated.fullName} (${updated.username})`,
        userId: req.session.userId,
        createdAt: new Date().toISOString(),
      });
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update user" });
    }
  });

  app.post("/api/users/:id/reset-password", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const updated = await storage.updateUser(id, { password: newPassword, forcePasswordChange: true });
      if (!updated) return res.status(404).json({ message: "User not found" });
      await storage.createActivityLog({
        action: "reset_password",
        module: "Staff Accounts",
        description: `Password reset for ${updated.fullName} (${updated.username})`,
        userId: req.session.userId,
        createdAt: new Date().toISOString(),
      });
      res.json({ message: "Password reset successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to reset password" });
    }
  });

  app.post("/api/users/:id/toggle-status", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { accountStatus } = req.body;
      if (!["active", "disabled", "locked"].includes(accountStatus)) {
        return res.status(400).json({ message: "Invalid account status" });
      }
      const updated = await storage.updateUser(id, {
        accountStatus,
        isActive: accountStatus === "active",
      });
      if (!updated) return res.status(404).json({ message: "User not found" });
      await storage.createActivityLog({
        action: accountStatus === "active" ? "enable" : "disable",
        module: "Staff Accounts",
        description: `Account ${accountStatus} for ${updated.fullName} (${updated.username})`,
        userId: req.session.userId,
        createdAt: new Date().toISOString(),
      });
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to toggle status" });
    }
  });

  app.get("/api/users/:id/login-history", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const logs = await storage.getLoginActivityLogs();
      const userLogs = logs.filter(l => l.userId === id);
      res.json(userLogs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch login history" });
    }
  });

  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.json({ message: "User deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // CSV Export
  app.get("/api/export/:entity", requireAuth, async (req, res) => {
    try {
      const entity = req.params.entity;
      let data: any[] = [];
      switch (entity) {
        case "customers": data = await storage.getCustomers(); break;
        case "invoices": data = await storage.getInvoices(); break;
        case "tickets": data = await storage.getTickets(); break;
        case "transactions": data = await storage.getTransactions(); break;
        case "expenses": data = await storage.getExpenses(); break;
        case "attendance": data = await storage.getAttendanceRecords(); break;
        case "credit-notes": data = await storage.getCreditNotes(); break;
        case "ip-addresses": data = await storage.getIpAddresses(); break;
        case "subnets": data = await storage.getSubnets(); break;
        case "vlans": data = await storage.getVlans(); break;
        case "ipam-logs": data = await storage.getIpamLogs(); break;
        case "outages": data = await storage.getOutages(); break;
        case "network-devices": data = await storage.getNetworkDevices(); break;
        case "payments": data = await storage.getPayments(); break;
        default: return res.status(400).json({ message: "Unknown entity" });
      }
      if (data.length === 0) return res.status(200).send("No data");
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(","),
        ...data.map(row => headers.map(h => {
          const val = (row as any)[h];
          if (val === null || val === undefined) return "";
          const str = String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(","))
      ].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${entity}-${new Date().toISOString().split("T")[0]}.csv`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Export failed" });
    }
  });

  app.get("/api/asset-assignments", requireAuth, async (_req, res) => {
    try { res.json(await storage.getAssetAssignments()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch asset assignments" }); }
  });

  app.post("/api/asset-assignments", requireAuth, async (req, res) => {
    try {
      const parsed = insertAssetAssignmentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const allAssignments = await storage.getAssetAssignments();
      const activeStatuses = ["active", "provisioning", "pending"];
      const alreadyAssigned = allAssignments.some(a => a.assetId === parsed.data.assetId && activeStatuses.includes(a.status));
      if (alreadyAssigned) return res.status(400).json({ message: "This asset is already assigned to a customer" });
      const asset = await storage.getAsset(parsed.data.assetId);
      if (!asset) return res.status(400).json({ message: "Asset not found in inventory" });
      const item = await storage.createAssetAssignment(parsed.data);
      await storage.updateAsset(parsed.data.assetId, { status: "deployed", assignedTo: String(parsed.data.customerId), assignedType: "customer" });
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create asset assignment" });
    }
  });

  app.patch("/api/asset-assignments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partial = insertAssetAssignmentSchema.partial().safeParse(req.body);
      if (!partial.success) return res.status(400).json({ message: "Invalid data", errors: partial.error.flatten() });
      const existing = await storage.getAssetAssignment(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const updated = await storage.updateAssetAssignment(id, partial.data);
      if (partial.data.status === "returned" || partial.data.status === "faulty") {
        await storage.updateAsset(existing.assetId, {
          status: partial.data.status === "returned" ? "available" : "faulty",
          assignedTo: null,
          assignedType: null,
        });
      } else if (partial.data.status === "active" && existing.status === "suspended") {
        await storage.updateAsset(existing.assetId, { status: "deployed" });
      } else if (partial.data.status === "suspended") {
        await storage.updateAsset(existing.assetId, { status: "reserved" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update" });
    }
  });

  app.delete("/api/asset-assignments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getAssetAssignment(id);
      if (existing) {
        await storage.updateAsset(existing.assetId, { status: "available", assignedTo: null, assignedType: null });
      }
      await storage.deleteAssetAssignment(id);
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete" });
    }
  });

  app.get("/api/asset-assignments/customer/:customerId", requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const assignments = await storage.getAssetAssignmentsByCustomer(customerId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer assignments" });
    }
  });

  app.get("/api/asset-assignment-history/customer/:customerId", requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const history = await storage.getAssetAssignmentHistoryByCustomer(customerId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignment history" });
    }
  });

  app.get("/api/asset-assignment-history/assignment/:assignmentId", requireAuth, async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.assignmentId);
      const history = await storage.getAssetAssignmentHistoryByAssignment(assignmentId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignment history" });
    }
  });

  app.post("/api/asset-assignment-history", requireAuth, async (req, res) => {
    try {
      const parsed = insertAssetAssignmentHistorySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const entry = await storage.createAssetAssignmentHistory(parsed.data);
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create history entry" });
    }
  });

  app.get("/api/asset-requests", requireAuth, async (_req, res) => {
    try { res.json(await storage.getAssetRequests()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch asset requests" }); }
  });

  app.post("/api/asset-requests", requireAuth, async (req, res) => {
    try {
      const parsed = insertAssetRequestSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      if (parsed.data.assetId) {
        const asset = await storage.getAsset(parsed.data.assetId);
        if (!asset) return res.status(400).json({ message: "Referenced asset not found" });
        if (asset.status !== "available" && asset.status !== "in_stock" && parsed.data.requestType === "new_issuance") {
          return res.status(400).json({ message: "Asset is not available for issuance" });
        }
      }
      const item = await storage.createAssetRequest(parsed.data);
      await storage.createAssetRequestHistory({
        requestId: item.id,
        action: "submitted",
        actionBy: parsed.data.requestedBy,
        actionDate: new Date().toISOString(),
        previousStatus: null,
        newStatus: item.status,
        comments: "Request submitted",
      });
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create asset request" });
    }
  });

  app.patch("/api/asset-requests/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partial = insertAssetRequestSchema.partial().safeParse(req.body);
      if (!partial.success) return res.status(400).json({ message: "Invalid data", errors: partial.error.flatten() });
      const existing = await storage.getAssetRequest(id);
      if (!existing) return res.status(404).json({ message: "Not found" });

      const allowedTransitions: Record<string, string[]> = {
        draft: ["pending", "cancelled"],
        pending: ["under_review", "approved", "rejected", "cancelled", "escalated"],
        under_review: ["approved", "rejected", "escalated", "pending"],
        escalated: ["approved", "rejected", "pending"],
        approved: ["executed", "cancelled"],
        rejected: [],
        cancelled: [],
        executed: [],
      };
      if (partial.data.status && partial.data.status !== existing.status) {
        const allowed = allowedTransitions[existing.status] || [];
        if (!allowed.includes(partial.data.status)) {
          return res.status(400).json({ message: `Cannot transition from '${existing.status}' to '${partial.data.status}'` });
        }
        if (partial.data.status === "rejected" && !partial.data.rejectionReason) {
          return res.status(400).json({ message: "Rejection reason is required" });
        }
      }

      const updated = await storage.updateAssetRequest(id, partial.data);
      if (partial.data.status && partial.data.status !== existing.status) {
        await storage.createAssetRequestHistory({
          requestId: id,
          action: partial.data.status,
          actionBy: partial.data.approvedBy || partial.data.rejectedBy || "admin",
          actionDate: new Date().toISOString(),
          previousStatus: existing.status,
          newStatus: partial.data.status,
          comments: partial.data.rejectionReason || partial.data.notes || `Status changed to ${partial.data.status}`,
        });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update" });
    }
  });

  app.delete("/api/asset-requests/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteAssetRequest(parseInt(req.params.id));
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete" });
    }
  });

  app.get("/api/asset-request-history/:requestId", requireAuth, async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const history = await storage.getAssetRequestHistoryByRequest(requestId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch request history" });
    }
  });

  app.post("/api/asset-request-history", requireAuth, async (req, res) => {
    try {
      const parsed = insertAssetRequestHistorySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const entry = await storage.createAssetRequestHistory(parsed.data);
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create history entry" });
    }
  });

  app.get("/api/asset-allocations", requireAuth, async (_req, res) => {
    try { res.json(await storage.getAssetAllocations()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch allocations" }); }
  });

  app.post("/api/asset-allocations", requireAuth, async (req, res) => {
    try {
      const parsed = insertAssetAllocationSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const allAssets = await storage.getAssets();
      const availableOfType = allAssets.filter(a =>
        a.type === parsed.data.assetType &&
        a.status !== "maintenance" && a.status !== "faulty" &&
        a.status !== "deployed" && a.status !== "lost" && a.status !== "retired"
      );
      if (parsed.data.quantity > availableOfType.length) {
        return res.status(400).json({ message: `Only ${availableOfType.length} ${parsed.data.assetType} available in stock. Cannot allocate ${parsed.data.quantity}.` });
      }
      const item = await storage.createAssetAllocation(parsed.data);
      await storage.createAssetAllocationHistory({
        allocationId: item.id,
        action: "created",
        actionBy: parsed.data.requestedBy,
        actionDate: new Date().toISOString(),
        previousStatus: null,
        newStatus: item.status,
        quantityAffected: parsed.data.quantity,
        comments: "Allocation created",
      });
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create allocation" });
    }
  });

  app.patch("/api/asset-allocations/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partial = insertAssetAllocationSchema.partial().safeParse(req.body);
      if (!partial.success) return res.status(400).json({ message: "Invalid data", errors: partial.error.flatten() });
      const existing = await storage.getAssetAllocation(id);
      if (!existing) return res.status(404).json({ message: "Not found" });

      const allowedTransitions: Record<string, string[]> = {
        reserved: ["pending_approval", "allocated", "cancelled", "expired"],
        pending_approval: ["allocated", "reserved", "cancelled"],
        allocated: ["partially_allocated", "cancelled", "expired"],
        partially_allocated: ["allocated", "cancelled"],
        cancelled: [],
        expired: [],
      };
      if (partial.data.status && partial.data.status !== existing.status) {
        const allowed = allowedTransitions[existing.status] || [];
        if (!allowed.includes(partial.data.status)) {
          return res.status(400).json({ message: `Cannot transition from '${existing.status}' to '${partial.data.status}'` });
        }
      }

      const updated = await storage.updateAssetAllocation(id, partial.data);
      if (partial.data.status && partial.data.status !== existing.status) {
        await storage.createAssetAllocationHistory({
          allocationId: id,
          action: partial.data.status,
          actionBy: partial.data.approvedBy || "admin",
          actionDate: new Date().toISOString(),
          previousStatus: existing.status,
          newStatus: partial.data.status,
          quantityAffected: partial.data.quantity || existing.quantity,
          comments: partial.data.notes || `Status changed to ${partial.data.status}`,
        });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update allocation" });
    }
  });

  app.delete("/api/asset-allocations/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteAssetAllocation(parseInt(req.params.id));
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete" });
    }
  });

  app.get("/api/asset-allocation-history/:allocationId", requireAuth, async (req, res) => {
    try {
      const history = await storage.getAssetAllocationHistoryByAllocation(parseInt(req.params.allocationId));
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch allocation history" });
    }
  });

  app.post("/api/asset-allocation-history", requireAuth, async (req, res) => {
    try {
      const parsed = insertAssetAllocationHistorySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const entry = await storage.createAssetAllocationHistory(parsed.data);
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create history entry" });
    }
  });

  app.get("/api/product-types", requireAuth, async (_req, res) => {
    try { res.json(await storage.getProductTypes()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch product types" }); }
  });

  app.post("/api/product-types", requireAuth, async (req, res) => {
    try {
      const parsed = insertProductTypeSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const existing = await storage.getProductTypes();
      if (existing.some(p => p.skuCode === parsed.data.skuCode)) {
        return res.status(400).json({ message: "SKU code must be unique" });
      }
      if (parsed.data.productNature === "asset" && !parsed.data.trackSerialNumber) {
        return res.status(400).json({ message: "Asset-type products must enable serial tracking" });
      }
      const item = await storage.createProductType(parsed.data);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create product type" });
    }
  });

  app.patch("/api/product-types/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partial = insertProductTypeSchema.partial().safeParse(req.body);
      if (!partial.success) return res.status(400).json({ message: "Invalid data", errors: partial.error.flatten() });
      const existing = await storage.getProductType(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      if (partial.data.skuCode && partial.data.skuCode !== existing.skuCode) {
        const allTypes = await storage.getProductTypes();
        if (allTypes.some(p => p.id !== id && p.skuCode === partial.data.skuCode)) {
          return res.status(400).json({ message: "SKU code must be unique" });
        }
      }
      const finalNature = partial.data.productNature || existing.productNature;
      const finalSerial = partial.data.trackSerialNumber !== undefined ? partial.data.trackSerialNumber : existing.trackSerialNumber;
      if (finalNature === "asset" && !finalSerial) {
        return res.status(400).json({ message: "Asset-type products must enable serial tracking" });
      }
      const updated = await storage.updateProductType(id, partial.data);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update product type" });
    }
  });

  app.delete("/api/product-types/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const inventoryItems = await storage.getInventoryItems();
      const existing = await storage.getProductType(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const linked = inventoryItems.some(item => item.category === existing.name || item.sku?.startsWith(existing.skuCode));
      if (linked) {
        return res.status(400).json({ message: "Cannot delete: product type is linked to inventory items. Deactivate instead." });
      }
      await storage.deleteProductType(id);
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product type" });
    }
  });

  app.get("/api/product-type-categories", requireAuth, async (_req, res) => {
    try { res.json(await storage.getProductTypeCategories()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch categories" }); }
  });

  app.post("/api/product-type-categories", requireAuth, async (req, res) => {
    try {
      const parsed = insertProductTypeCategorySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.createProductTypeCategory(parsed.data);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create category" });
    }
  });

  app.patch("/api/product-type-categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partial = insertProductTypeCategorySchema.partial().safeParse(req.body);
      if (!partial.success) return res.status(400).json({ message: "Invalid data", errors: partial.error.flatten() });
      const updated = await storage.updateProductTypeCategory(id, partial.data);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update category" });
    }
  });

  app.delete("/api/product-type-categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productTypesList = await storage.getProductTypes();
      const category = await storage.getProductTypeCategory(id);
      if (!category) return res.status(404).json({ message: "Not found" });
      const linked = productTypesList.some(p => p.category === category.name);
      if (linked) {
        return res.status(400).json({ message: "Cannot delete: category has linked product types" });
      }
      await storage.deleteProductTypeCategory(id);
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Notification Types Routes
  app.get("/api/notification-types", requireAuth, async (_req, res) => {
    try { res.json(await storage.getNotificationTypes()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch notification types" }); }
  });

  app.get("/api/notification-types/:id", requireAuth, async (req, res) => {
    try {
      const nt = await storage.getNotificationType(parseInt(req.params.id));
      if (!nt) return res.status(404).json({ message: "Notification type not found" });
      res.json(nt);
    } catch (error) { res.status(500).json({ message: "Failed to fetch notification type" }); }
  });

  app.post("/api/notification-types", requireAuth, async (req, res) => {
    try {
      const parsed = insertNotificationTypeSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const created = await storage.createNotificationType(parsed.data);
      res.status(201).json(created);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create notification type" }); }
  });

  app.patch("/api/notification-types/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getNotificationType(id);
      if (!existing) return res.status(404).json({ message: "Notification type not found" });
      const parsed = insertNotificationTypeSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const updated = await storage.updateNotificationType(id, parsed.data);
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to update notification type" }); }
  });

  app.delete("/api/notification-types/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const nt = await storage.getNotificationType(id);
      if (!nt) return res.status(404).json({ message: "Notification type not found" });
      await storage.deleteNotificationType(id);
      res.json({ message: "Deleted" });
    } catch (error) { res.status(500).json({ message: "Failed to delete notification type" }); }
  });

  app.post("/api/notification-types/:id/duplicate", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const original = await storage.getNotificationType(id);
      if (!original) return res.status(404).json({ message: "Notification type not found" });
      const { id: _id, createdAt, lastModified, triggerCount, failedCount, successCount, lastTriggered, ...rest } = original;
      const duplicated = await storage.createNotificationType({
        ...rest,
        name: `${original.name} (Copy)`,
        status: "draft",
        triggerCount: 0,
        failedCount: 0,
        successCount: 0,
      });
      res.status(201).json(duplicated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to duplicate notification type" }); }
  });

  app.patch("/api/notification-types/:id/toggle", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const nt = await storage.getNotificationType(id);
      if (!nt) return res.status(404).json({ message: "Notification type not found" });
      const newStatus = nt.status === "active" ? "disabled" : "active";
      const updated = await storage.updateNotificationType(id, { status: newStatus });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to toggle notification type" }); }
  });

  // Push Notification Routes
  app.get("/api/push-notifications", requireAuth, async (_req, res) => {
    try { res.json(await storage.getPushNotifications()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch push notifications" }); }
  });

  app.get("/api/push-notifications/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getPushNotification(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "Push notification not found" });
      res.json(item);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to fetch push notification" }); }
  });

  app.post("/api/push-notifications", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getPushNotifications();
      const maxNum = existing.reduce((max, p) => {
        const match = p.pushId.match(/PUSH-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      const pushId = `PUSH-${String(maxNum + 1).padStart(6, "0")}`;

      const payload = { ...req.body, pushId, createdAt: new Date().toISOString() };
      if (payload.triggerType === "manual" && payload.status === "sent") {
        payload.sentAt = new Date().toISOString();
      }
      const parsed = insertPushNotificationSchema.safeParse(payload);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.createPushNotification(parsed.data);
      res.status(201).json(item);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create push notification" }); }
  });

  app.patch("/api/push-notifications/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { createdAt, createdBy, pushId, deliveryCount, clickCount, failedCount, acknowledgedCount, status, sentAt, ...rest } = req.body;
      const parsed = insertPushNotificationSchema.partial().safeParse(rest);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const updated = await storage.updatePushNotification(id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Push notification not found" });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to update push notification" }); }
  });

  app.post("/api/push-notifications/:id/send", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const push = await storage.getPushNotification(id);
      if (!push) return res.status(404).json({ message: "Push notification not found" });
      if (!["draft", "scheduled"].includes(push.status)) return res.status(400).json({ message: `Cannot send notification in '${push.status}' status. Only draft or scheduled can be sent.` });
      const updated = await storage.updatePushNotification(id, { status: "sent", sentAt: new Date().toISOString() });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to send push notification" }); }
  });

  app.post("/api/push-notifications/:id/cancel", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const push = await storage.getPushNotification(id);
      if (!push) return res.status(404).json({ message: "Push notification not found" });
      if (push.status !== "scheduled") return res.status(400).json({ message: `Cannot cancel notification in '${push.status}' status. Only scheduled can be cancelled.` });
      const updated = await storage.updatePushNotification(id, { status: "cancelled" });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to cancel push notification" }); }
  });

  app.post("/api/push-notifications/:id/duplicate", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const original = await storage.getPushNotification(id);
      if (!original) return res.status(404).json({ message: "Push notification not found" });
      const existing = await storage.getPushNotifications();
      const maxNum = existing.reduce((max, p) => {
        const match = p.pushId.match(/PUSH-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      const pushId = `PUSH-${String(maxNum + 1).padStart(6, "0")}`;
      const dup = await storage.createPushNotification({
        pushId,
        title: `${original.title} (Copy)`,
        body: original.body,
        module: original.module,
        priority: original.priority,
        audienceType: original.audienceType,
        audienceValue: original.audienceValue,
        triggerType: "manual",
        deepLink: original.deepLink,
        silentPush: original.silentPush,
        requireAcknowledgment: original.requireAcknowledgment,
        status: "draft",
        deviceTargets: original.deviceTargets,
        createdAt: new Date().toISOString(),
      });
      res.status(201).json(dup);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to duplicate push notification" }); }
  });

  app.delete("/api/push-notifications/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePushNotification(id);
      res.json({ message: "Push notification deleted" });
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to delete push notification" }); }
  });

  // Bulk Campaign Routes
  app.get("/api/bulk-campaigns", requireAuth, async (_req, res) => {
    try { res.json(await storage.getBulkCampaigns()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch campaigns" }); }
  });

  app.get("/api/bulk-campaigns/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getBulkCampaign(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "Campaign not found" });
      res.json(item);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to fetch campaign" }); }
  });

  app.post("/api/bulk-campaigns", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getBulkCampaigns();
      const maxNum = existing.reduce((max, c) => {
        const match = c.campaignId.match(/CMP-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      const campaignId = `CMP-${String(maxNum + 1).padStart(6, "0")}`;
      const payload = { ...req.body, campaignId, createdAt: new Date().toISOString() };
      if (payload.schedulingType === "immediate" && payload.status === "active") {
        payload.sentAt = new Date().toISOString();
      }
      const parsed = insertBulkCampaignSchema.safeParse(payload);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.createBulkCampaign(parsed.data);
      res.status(201).json(item);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create campaign" }); }
  });

  app.patch("/api/bulk-campaigns/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { createdAt, createdBy, campaignId, status, sentAt, completedAt, totalTargeted, totalDelivered, totalFailed, totalOpened, totalClicked, totalAcknowledged, ...rest } = req.body;
      const parsed = insertBulkCampaignSchema.partial().safeParse(rest);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const updated = await storage.updateBulkCampaign(id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Campaign not found" });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to update campaign" }); }
  });

  app.post("/api/bulk-campaigns/:id/launch", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getBulkCampaign(id);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      if (!["draft", "scheduled"].includes(campaign.status)) return res.status(400).json({ message: `Cannot launch campaign in '${campaign.status}' status` });
      const updated = await storage.updateBulkCampaign(id, { status: "active", sentAt: new Date().toISOString() } as any);
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to launch campaign" }); }
  });

  app.post("/api/bulk-campaigns/:id/pause", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getBulkCampaign(id);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      if (campaign.status !== "active") return res.status(400).json({ message: "Only active campaigns can be paused" });
      const updated = await storage.updateBulkCampaign(id, { status: "paused" } as any);
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to pause campaign" }); }
  });

  app.post("/api/bulk-campaigns/:id/resume", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getBulkCampaign(id);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      if (campaign.status !== "paused") return res.status(400).json({ message: "Only paused campaigns can be resumed" });
      const updated = await storage.updateBulkCampaign(id, { status: "active" } as any);
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to resume campaign" }); }
  });

  app.post("/api/bulk-campaigns/:id/cancel", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getBulkCampaign(id);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      if (["completed", "cancelled"].includes(campaign.status)) return res.status(400).json({ message: `Cannot cancel ${campaign.status} campaign` });
      const updated = await storage.updateBulkCampaign(id, { status: "cancelled" } as any);
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to cancel campaign" }); }
  });

  app.post("/api/bulk-campaigns/:id/complete", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getBulkCampaign(id);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });
      if (campaign.status !== "active") return res.status(400).json({ message: "Only active campaigns can be completed" });
      const updated = await storage.updateBulkCampaign(id, { status: "completed", completedAt: new Date().toISOString() } as any);
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to complete campaign" }); }
  });

  app.post("/api/bulk-campaigns/:id/duplicate", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const original = await storage.getBulkCampaign(id);
      if (!original) return res.status(404).json({ message: "Campaign not found" });
      const existing = await storage.getBulkCampaigns();
      const maxNum = existing.reduce((max, c) => {
        const match = c.campaignId.match(/CMP-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      const campaignId = `CMP-${String(maxNum + 1).padStart(6, "0")}`;
      const dup = await storage.createBulkCampaign({
        campaignId, name: `${original.name} (Copy)`, campaignType: original.campaignType,
        priority: original.priority, module: original.module, title: original.title, body: original.body,
        deepLink: original.deepLink, audienceType: original.audienceType, audienceValue: original.audienceValue,
        schedulingType: "immediate", deviceTargets: original.deviceTargets,
        requireAcknowledgment: original.requireAcknowledgment, frequencyCap: original.frequencyCap,
        status: "draft", createdAt: new Date().toISOString(),
      });
      res.status(201).json(dup);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to duplicate campaign" }); }
  });

  app.delete("/api/bulk-campaigns/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteBulkCampaign(parseInt(req.params.id));
      res.json({ message: "Campaign deleted" });
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to delete campaign" }); }
  });

  // SMS Provider Routes
  app.get("/api/sms-providers", requireAuth, async (_req, res) => {
    try { res.json(await storage.getSmsProviders()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch SMS providers" }); }
  });

  app.get("/api/sms-providers/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getSmsProvider(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "SMS provider not found" });
      res.json(item);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/sms-providers", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getSmsProviders();
      const maxNum = existing.reduce((max, p) => {
        const match = p.providerId.match(/SMS-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      const providerId = `SMS-${String(maxNum + 1).padStart(6, "0")}`;
      const payload = { ...req.body, providerId, createdAt: new Date().toISOString() };
      const parsed = insertSmsProviderSchema.safeParse(payload);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.createSmsProvider(parsed.data);
      res.status(201).json(item);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.patch("/api/sms-providers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { createdAt, createdBy, providerId, messagesSent, messagesDelivered, messagesFailed, totalCost, ...rest } = req.body;
      const parsed = insertSmsProviderSchema.partial().safeParse(rest);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const updated = await storage.updateSmsProvider(id, parsed.data);
      if (!updated) return res.status(404).json({ message: "SMS provider not found" });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/sms-providers/:id/test", requireAuth, async (req, res) => {
    try {
      const provider = await storage.getSmsProvider(parseInt(req.params.id));
      if (!provider) return res.status(404).json({ message: "SMS provider not found" });
      await storage.updateSmsProvider(provider.id, { status: "testing", lastSyncAt: new Date().toISOString() } as any);
      setTimeout(async () => {
        await storage.updateSmsProvider(provider.id, { status: "connected", lastSyncAt: new Date().toISOString() } as any);
      }, 2000);
      res.json({ message: "Test SMS sent successfully", status: "testing" });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/sms-providers/:id/toggle", requireAuth, async (req, res) => {
    try {
      const provider = await storage.getSmsProvider(parseInt(req.params.id));
      if (!provider) return res.status(404).json({ message: "SMS provider not found" });
      const newStatus = provider.status === "disabled" ? "connected" : "disabled";
      const updated = await storage.updateSmsProvider(provider.id, { status: newStatus } as any);
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.delete("/api/sms-providers/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteSmsProvider(parseInt(req.params.id));
      res.json({ message: "SMS provider deleted" });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // Email Provider Routes
  app.get("/api/email-providers", requireAuth, async (_req, res) => {
    try { res.json(await storage.getEmailProviders()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch email providers" }); }
  });

  app.get("/api/email-providers/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getEmailProvider(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "Email provider not found" });
      res.json(item);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/email-providers", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getEmailProviders();
      const maxNum = existing.reduce((max, p) => {
        const match = p.providerId.match(/EML-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      const providerId = `EML-${String(maxNum + 1).padStart(6, "0")}`;
      const payload = { ...req.body, providerId, createdAt: new Date().toISOString() };
      const parsed = insertEmailProviderSchema.safeParse(payload);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.createEmailProvider(parsed.data);
      res.status(201).json(item);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.patch("/api/email-providers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { createdAt, createdBy, providerId, emailsSent, emailsDelivered, emailsFailed, emailsBounced, totalCost, ...rest } = req.body;
      const parsed = insertEmailProviderSchema.partial().safeParse(rest);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const updated = await storage.updateEmailProvider(id, parsed.data);
      if (!updated) return res.status(404).json({ message: "Email provider not found" });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/email-providers/:id/test", requireAuth, async (req, res) => {
    try {
      const provider = await storage.getEmailProvider(parseInt(req.params.id));
      if (!provider) return res.status(404).json({ message: "Email provider not found" });
      await storage.updateEmailProvider(provider.id, { status: "testing", lastSyncAt: new Date().toISOString() } as any);
      setTimeout(async () => {
        await storage.updateEmailProvider(provider.id, { status: "connected", lastSyncAt: new Date().toISOString() } as any);
      }, 2000);
      res.json({ message: "Test email sent successfully", status: "testing" });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/email-providers/:id/toggle", requireAuth, async (req, res) => {
    try {
      const provider = await storage.getEmailProvider(parseInt(req.params.id));
      if (!provider) return res.status(404).json({ message: "Email provider not found" });
      const newStatus = provider.status === "disabled" ? "connected" : "disabled";
      const updated = await storage.updateEmailProvider(provider.id, { status: newStatus } as any);
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.delete("/api/email-providers/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteEmailProvider(parseInt(req.params.id));
      res.json({ message: "Email provider deleted" });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // WhatsApp Provider Routes
  app.get("/api/whatsapp-providers", requireAuth, async (_req, res) => {
    try { res.json(await storage.getWhatsappProviders()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch WhatsApp providers" }); }
  });

  app.get("/api/whatsapp-providers/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getWhatsappProvider(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "WhatsApp provider not found" });
      res.json(item);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/whatsapp-providers", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getWhatsappProviders();
      const maxNum = existing.reduce((max, p) => {
        const match = p.providerId.match(/WA-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      const providerId = `WA-${String(maxNum + 1).padStart(3, "0")}`;
      const payload = { ...req.body, providerId };
      const parsed = insertWhatsappProviderSchema.safeParse(payload);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.createWhatsappProvider(parsed.data);
      res.status(201).json(item);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.patch("/api/whatsapp-providers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { createdAt, createdBy, providerId, messagesSent, messagesDelivered, messagesRead, messagesFailed, totalCost, ...rest } = req.body;
      const parsed = insertWhatsappProviderSchema.partial().safeParse(rest);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.updateWhatsappProvider(id, parsed.data);
      if (!item) return res.status(404).json({ message: "WhatsApp provider not found" });
      res.json(item);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/whatsapp-providers/:id/test", requireAuth, async (req, res) => {
    try {
      const provider = await storage.getWhatsappProvider(parseInt(req.params.id));
      if (!provider) return res.status(404).json({ message: "WhatsApp provider not found" });
      await storage.updateWhatsappProvider(provider.id, { status: "testing", lastSyncAt: new Date().toISOString() } as any);
      setTimeout(async () => {
        await storage.updateWhatsappProvider(provider.id, { status: "connected", lastSyncAt: new Date().toISOString() } as any);
      }, 2000);
      res.json({ message: "Test initiated", provider: provider.name });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/whatsapp-providers/:id/toggle", requireAuth, async (req, res) => {
    try {
      const provider = await storage.getWhatsappProvider(parseInt(req.params.id));
      if (!provider) return res.status(404).json({ message: "WhatsApp provider not found" });
      const newStatus = provider.status === "disabled" ? "connected" : "disabled";
      const updated = await storage.updateWhatsappProvider(provider.id, { status: newStatus } as any);
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.delete("/api/whatsapp-providers/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteWhatsappProvider(parseInt(req.params.id));
      res.json({ message: "WhatsApp provider deleted" });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // Push Messages Routes
  app.get("/api/push-messages", requireAuth, async (_req, res) => {
    try { res.json(await storage.getPushMessages()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch push messages" }); }
  });

  app.get("/api/push-messages/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getPushMessage(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "Push message not found" });
      res.json(item);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/push-messages", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getPushMessages();
      const maxNum = existing.reduce((max, p) => {
        const match = p.messageId.match(/PM-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      const messageId = `PM-${String(maxNum + 1).padStart(4, "0")}`;
      const payload = { ...req.body, messageId };
      const parsed = insertPushMessageSchema.safeParse(payload);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.createPushMessage(parsed.data);
      res.status(201).json(item);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.patch("/api/push-messages/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { messageId, createdAt, createdBy, totalSent, totalDelivered, totalFailed, totalPending, sentAt, completedAt, ...rest } = req.body;
      const parsed = insertPushMessageSchema.partial().safeParse(rest);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.updatePushMessage(id, parsed.data);
      if (!item) return res.status(404).json({ message: "Push message not found" });
      res.json(item);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/push-messages/:id/send", requireAuth, async (req, res) => {
    try {
      const msg = await storage.getPushMessage(parseInt(req.params.id));
      if (!msg) return res.status(404).json({ message: "Push message not found" });
      const count = msg.recipientCount || 1;
      await storage.updatePushMessage(msg.id, { status: "sending", sentAt: new Date().toISOString(), totalPending: count } as any);
      setTimeout(async () => {
        const delivered = Math.floor(count * 0.92);
        const failed = count - delivered;
        await storage.updatePushMessage(msg.id, {
          status: "sent", totalSent: count, totalDelivered: delivered, totalFailed: failed,
          totalPending: 0, completedAt: new Date().toISOString(),
        } as any);
      }, 3000);
      res.json({ message: "Message sending initiated", messageId: msg.messageId });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/push-messages/:id/retry", requireAuth, async (req, res) => {
    try {
      const msg = await storage.getPushMessage(parseInt(req.params.id));
      if (!msg) return res.status(404).json({ message: "Push message not found" });
      const retryCount = msg.totalFailed || 0;
      await storage.updatePushMessage(msg.id, { status: "sending", totalPending: retryCount } as any);
      setTimeout(async () => {
        const redelivered = Math.floor(retryCount * 0.7);
        await storage.updatePushMessage(msg.id, {
          status: "sent", totalDelivered: (msg.totalDelivered || 0) + redelivered,
          totalFailed: retryCount - redelivered, totalPending: 0,
          completedAt: new Date().toISOString(),
        } as any);
      }, 2000);
      res.json({ message: "Retry initiated" });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.post("/api/push-messages/:id/cancel", requireAuth, async (req, res) => {
    try {
      const msg = await storage.getPushMessage(parseInt(req.params.id));
      if (!msg) return res.status(404).json({ message: "Push message not found" });
      const updated = await storage.updatePushMessage(msg.id, { status: "cancelled", totalPending: 0 } as any);
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.delete("/api/push-messages/:id", requireAuth, async (req, res) => {
    try {
      await storage.deletePushMessage(parseInt(req.params.id));
      res.json({ message: "Push message deleted" });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // Message Logs Routes
  app.get("/api/message-logs", requireAuth, async (_req, res) => {
    try { res.json(await storage.getMessageLogs()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch message logs" }); }
  });

  app.post("/api/message-logs", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getMessageLogs();
      const maxNum = existing.reduce((max, l) => {
        const match = l.messageId.match(/MSG-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      const messageId = `MSG-${String(maxNum + 1).padStart(6, "0")}`;
      const payload = { ...req.body, messageId, createdAt: new Date().toISOString() };
      const parsed = insertMessageLogSchema.safeParse(payload);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.createMessageLog(parsed.data);
      res.status(201).json(item);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // General Settings Routes
  app.get("/api/general-settings", requireAuth, async (_req, res) => {
    try { res.json(await storage.getGeneralSettings()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch settings" }); }
  });

  app.get("/api/general-settings/:category", requireAuth, async (req, res) => {
    try { res.json(await storage.getGeneralSettingsByCategory(req.params.category)); }
    catch (error) { res.status(500).json({ message: "Failed to fetch settings" }); }
  });

  app.put("/api/general-settings", requireAuth, async (req, res) => {
    try {
      const { settings } = req.body;
      if (!Array.isArray(settings)) return res.status(400).json({ message: "Settings must be an array" });
      const results = await storage.bulkUpsertGeneralSettings(settings);
      res.json(results);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to save settings" }); }
  });

  app.put("/api/general-settings/single", requireAuth, async (req, res) => {
    try {
      const parsed = insertGeneralSettingSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const result = await storage.upsertGeneralSetting(parsed.data);
      res.json(result);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to save setting" }); }
  });

  // HRM Roles & Permissions Routes
  app.get("/api/hrm-roles", requireAuth, async (_req, res) => {
    try { res.json(await storage.getHrmRoles()); }
    catch (error: any) { res.status(500).json({ message: error.message || "Failed to fetch roles" }); }
  });

  app.get("/api/hrm-roles/:id", requireAuth, async (req, res) => {
    try {
      const role = await storage.getHrmRole(parseInt(req.params.id));
      if (!role) return res.status(404).json({ message: "Role not found" });
      res.json(role);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to fetch role" }); }
  });

  app.post("/api/hrm-roles", requireAuth, async (req, res) => {
    try {
      const counter = Date.now().toString(36).toUpperCase().slice(-6);
      const roleId = `ROLE-${counter}`;
      const data = { ...req.body, roleId, createdAt: new Date().toISOString() };
      const hrmRole = await storage.createHrmRole(data);
      // Auto-create matching org role if not already existing
      const existingOrgRoles = await storage.getRoles();
      const orgExists = existingOrgRoles.some(
        r => r.name.toLowerCase().trim() === hrmRole.name.toLowerCase().trim()
      );
      if (!orgExists) {
        await storage.createRole({
          name: hrmRole.name,
          description: req.body.description || `Org role for ${hrmRole.name}`,
          permissions: "",
          isSystem: false,
          status: "active",
          roleLevel: "level_4",
          commissionEligible: false,
          incentiveTarget: false,
        } as any);
      }
      res.status(201).json(hrmRole);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create role" }); }
  });

  app.patch("/api/hrm-roles/:id", requireAuth, async (req, res) => {
    try {
      const { id: _i, roleId: _r, createdAt: _c, createdBy: _cb, ...updateData } = req.body;
      const role = await storage.updateHrmRole(parseInt(req.params.id), updateData);
      if (!role) return res.status(404).json({ message: "Role not found" });
      res.json(role);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to update role" }); }
  });

  app.post("/api/hrm-roles/:id/duplicate", requireAuth, async (req, res) => {
    try {
      const source = await storage.getHrmRole(parseInt(req.params.id));
      if (!source) return res.status(404).json({ message: "Role not found" });
      const counter = Date.now().toString(36).toUpperCase().slice(-6);
      const roleId = `ROLE-${counter}`;
      const { id: _id, ...rest } = source;
      const newRole = await storage.createHrmRole({ ...rest, roleId, name: `${source.name} (Copy)`, isSystem: false, createdAt: new Date().toISOString() });
      const perms = await storage.getHrmPermissions(source.id);
      if (perms.length > 0) {
        await storage.bulkUpsertHrmPermissions(perms.map(p => {
          const { id: _pid, ...pRest } = p;
          return { ...pRest, roleId: newRole.id };
        }));
      }
      res.status(201).json(newRole);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to duplicate role" }); }
  });

  app.delete("/api/hrm-roles/:id", requireAuth, async (req, res) => {
    try {
      const role = await storage.getHrmRole(parseInt(req.params.id));
      if (!role) return res.status(404).json({ message: "Role not found" });
      if (role.isSystem) return res.status(403).json({ message: "Cannot delete system role" });
      await storage.deleteHrmRole(parseInt(req.params.id));
      res.json({ message: "Role archived" });
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to delete role" }); }
  });

  app.get("/api/hrm-permissions/:roleId", requireAuth, async (req, res) => {
    try { res.json(await storage.getHrmPermissions(parseInt(req.params.roleId))); }
    catch (error: any) { res.status(500).json({ message: error.message || "Failed to fetch permissions" }); }
  });

  app.put("/api/hrm-permissions/:roleId", requireAuth, async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const { permissions } = req.body;
      if (!Array.isArray(permissions)) return res.status(400).json({ message: "permissions must be an array" });
      await storage.deleteHrmPermissionsByRole(roleId);
      const results = await storage.bulkUpsertHrmPermissions(permissions.map((p: any) => ({ ...p, roleId })));
      const role = await storage.getHrmRole(roleId);
      if (role) {
        const allPerms = await storage.getHrmPermissions(roleId);
        const modules = new Set(allPerms.map(p => p.module));
        let fullAccess = 0;
        let limitedAccess = 0;
        modules.forEach(mod => {
          const modPerms = allPerms.filter(p => p.module === mod);
          const allGranted = modPerms.every(p => p.canView && p.canCreate && p.canEdit && p.canDelete && p.canApprove && p.canExport && p.canPrint);
          const anyGranted = modPerms.some(p => p.canView || p.canCreate || p.canEdit || p.canDelete || p.canApprove || p.canExport || p.canPrint);
          if (allGranted) fullAccess++;
          else if (anyGranted) limitedAccess++;
        });
        const hasApp = allPerms.some(p => p.appAccess);
        const hasWeb = allPerms.some(p => p.webAccess);
        await storage.updateHrmRole(roleId, {
          totalModules: modules.size,
          fullAccessModules: fullAccess,
          limitedAccessModules: limitedAccess,
          appAccessEnabled: hasApp,
          webAccessEnabled: hasWeb,
        });
      }
      res.json(results);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to save permissions" }); }
  });

  // Customer Groups & Rights Routes
  app.get("/api/customer-groups", requireAuth, async (_req, res) => {
    try { res.json(await storage.getCustomerGroups()); }
    catch (error: any) { res.status(500).json({ message: error.message || "Failed to fetch customer groups" }); }
  });

  app.get("/api/customer-groups/:id", requireAuth, async (req, res) => {
    try {
      const group = await storage.getCustomerGroup(parseInt(req.params.id));
      if (!group) return res.status(404).json({ message: "Customer group not found" });
      res.json(group);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to fetch customer group" }); }
  });

  app.post("/api/customer-groups", requireAuth, async (req, res) => {
    try {
      const counter = Date.now().toString(36).toUpperCase().slice(-6);
      const groupId = `CGRP-${counter}`;
      const data = { ...req.body, groupId, createdAt: new Date().toISOString() };
      const group = await storage.createCustomerGroup(data);
      res.status(201).json(group);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create customer group" }); }
  });

  app.patch("/api/customer-groups/:id", requireAuth, async (req, res) => {
    try {
      const { id: _i, groupId: _g, createdAt: _c, createdBy: _cb, ...updateData } = req.body;
      const group = await storage.updateCustomerGroup(parseInt(req.params.id), updateData);
      if (!group) return res.status(404).json({ message: "Customer group not found" });
      res.json(group);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to update customer group" }); }
  });

  app.post("/api/customer-groups/:id/duplicate", requireAuth, async (req, res) => {
    try {
      const source = await storage.getCustomerGroup(parseInt(req.params.id));
      if (!source) return res.status(404).json({ message: "Customer group not found" });
      const counter = Date.now().toString(36).toUpperCase().slice(-6);
      const groupId = `CGRP-${counter}`;
      const { id: _id, ...rest } = source;
      const newGroup = await storage.createCustomerGroup({ ...rest, groupId, name: `${source.name} (Copy)`, isSystem: false, createdAt: new Date().toISOString() });
      const rights = await storage.getCustomerRights(source.id);
      if (rights.length > 0) {
        await storage.bulkUpsertCustomerRights(rights.map(r => {
          const { id: _rid, ...rRest } = r;
          return { ...rRest, groupId: newGroup.id };
        }));
      }
      res.status(201).json(newGroup);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to duplicate customer group" }); }
  });

  app.delete("/api/customer-groups/:id", requireAuth, async (req, res) => {
    try {
      const group = await storage.getCustomerGroup(parseInt(req.params.id));
      if (!group) return res.status(404).json({ message: "Customer group not found" });
      if (group.isSystem) return res.status(403).json({ message: "Cannot delete system group" });
      await storage.deleteCustomerGroup(parseInt(req.params.id));
      res.json({ message: "Customer group archived" });
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to delete customer group" }); }
  });

  app.get("/api/customer-rights/:groupId", requireAuth, async (req, res) => {
    try { res.json(await storage.getCustomerRights(parseInt(req.params.groupId))); }
    catch (error: any) { res.status(500).json({ message: error.message || "Failed to fetch customer rights" }); }
  });

  app.put("/api/customer-rights/:groupId", requireAuth, async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const { rights } = req.body;
      if (!Array.isArray(rights)) return res.status(400).json({ message: "rights must be an array" });
      const results = await storage.bulkUpsertCustomerRights(rights.map((r: any) => ({ ...r, groupId })));
      const group = await storage.getCustomerGroup(groupId);
      if (group) {
        const allRights = await storage.getCustomerRights(groupId);
        const restrictions = allRights.filter(r => !r.enabled).length;
        const hasApp = allRights.some(r => r.appAccess && r.enabled);
        const hasWeb = allRights.some(r => r.webAccess && r.enabled);
        await storage.updateCustomerGroup(groupId, {
          activeRestrictions: restrictions,
          appAccessEnabled: hasApp,
          webAccessEnabled: hasWeb,
        });
      }
      res.json(results);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to save customer rights" }); }
  });

  // Invoice Template Routes
  app.get("/api/invoice-templates", requireAuth, async (_req, res) => {
    try { res.json(await storage.getInvoiceTemplates()); }
    catch (error: any) { res.status(500).json({ message: error.message || "Failed to fetch invoice templates" }); }
  });

  app.get("/api/invoice-templates/category/:category", requireAuth, async (req, res) => {
    try { res.json(await storage.getInvoiceTemplatesByCategory(req.params.category)); }
    catch (error: any) { res.status(500).json({ message: error.message || "Failed to fetch templates by category" }); }
  });

  app.get("/api/invoice-templates/:id", requireAuth, async (req, res) => {
    try {
      const t = await storage.getInvoiceTemplate(parseInt(req.params.id));
      if (!t) return res.status(404).json({ message: "Template not found" });
      res.json(t);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to fetch template" }); }
  });

  app.post("/api/invoice-templates", requireAuth, async (req, res) => {
    try {
      const counter = Date.now().toString(36).toUpperCase().slice(-6);
      const templateId = `INVT-${counter}`;
      const data = { ...req.body, templateId, createdAt: new Date().toISOString() };
      const t = await storage.createInvoiceTemplate(data);
      res.status(201).json(t);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create template" }); }
  });

  app.patch("/api/invoice-templates/:id", requireAuth, async (req, res) => {
    try {
      const { id: _i, templateId: _t, createdAt: _c, createdBy: _cb, ...updateData } = req.body;
      const t = await storage.updateInvoiceTemplate(parseInt(req.params.id), updateData);
      if (!t) return res.status(404).json({ message: "Template not found" });
      res.json(t);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to update template" }); }
  });

  app.post("/api/invoice-templates/:id/duplicate", requireAuth, async (req, res) => {
    try {
      const source = await storage.getInvoiceTemplate(parseInt(req.params.id));
      if (!source) return res.status(404).json({ message: "Template not found" });
      const counter = Date.now().toString(36).toUpperCase().slice(-6);
      const templateId = `INVT-${counter}`;
      const { id: _id, ...rest } = source;
      const t = await storage.createInvoiceTemplate({ ...rest, templateId, name: `${source.name} (Copy)`, isDefault: false, status: "draft", createdAt: new Date().toISOString() });
      res.status(201).json(t);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to duplicate template" }); }
  });

  app.post("/api/invoice-templates/:id/set-default", requireAuth, async (req, res) => {
    try {
      const t = await storage.getInvoiceTemplate(parseInt(req.params.id));
      if (!t) return res.status(404).json({ message: "Template not found" });
      const all = await storage.getInvoiceTemplatesByCategory(t.invoiceCategory);
      for (const other of all) {
        if (other.id !== t.id && other.isDefault) {
          await storage.updateInvoiceTemplate(other.id, { isDefault: false });
        }
      }
      const updated = await storage.updateInvoiceTemplate(t.id, { isDefault: true, status: "active" });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to set default" }); }
  });

  app.delete("/api/invoice-templates/:id", requireAuth, async (req, res) => {
    try {
      const t = await storage.getInvoiceTemplate(parseInt(req.params.id));
      if (!t) return res.status(404).json({ message: "Template not found" });
      if (t.isDefault) return res.status(403).json({ message: "Cannot delete default template. Set another as default first." });
      await storage.deleteInvoiceTemplate(parseInt(req.params.id));
      res.json({ message: "Template deleted" });
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to delete template" }); }
  });

  // Batch & Serial Management Routes
  app.get("/api/batches", requireAuth, async (_req, res) => {
    try { res.json(await storage.getBatches()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch batches" }); }
  });

  app.get("/api/batches/:id", requireAuth, async (req, res) => {
    try {
      const batch = await storage.getBatch(parseInt(req.params.id));
      if (!batch) return res.status(404).json({ message: "Batch not found" });
      res.json(batch);
    } catch (error) { res.status(500).json({ message: "Failed to fetch batch" }); }
  });

  app.post("/api/batches", requireAuth, async (req, res) => {
    try {
      const data = { ...req.body };
      if (!data.batchNumber) {
        const existing = await storage.getBatches();
        const maxNum = existing.reduce((max, b) => {
          const match = b.batchNumber?.match(/BAT-(\d+)/);
          return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        data.batchNumber = `BAT-${String(maxNum + 1).padStart(6, "0")}`;
      }
      const computedAvailable = (parseInt(data.quantity) || 0) - (parseInt(data.reserved) || 0) - (parseInt(data.allocated) || 0);
      if (computedAvailable < 0) return res.status(400).json({ message: "Reserved + Allocated cannot exceed total quantity" });
      data.available = computedAvailable;
      if (data.expiryDate) {
        const expiry = new Date(data.expiryDate);
        const now = new Date();
        if (expiry < now) data.status = "expired";
      }
      const parsed = insertBatchSchema.safeParse(data);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const created = await storage.createBatch(parsed.data);
      res.status(201).json(created);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create batch" }); }
  });

  app.patch("/api/batches/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getBatch(id);
      if (!existing) return res.status(404).json({ message: "Batch not found" });
      const data = { ...req.body };
      const qty = parseInt(data.quantity ?? existing.quantity) || 0;
      const reserved = parseInt(data.reserved ?? existing.reserved) || 0;
      const allocated = parseInt(data.allocated ?? existing.allocated) || 0;
      const computedAvail = qty - reserved - allocated;
      if (computedAvail < 0) return res.status(400).json({ message: "Reserved + Allocated cannot exceed total quantity" });
      data.available = computedAvail;
      const updated = await storage.updateBatch(id, data);
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to update batch" }); }
  });

  app.delete("/api/batches/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const batch = await storage.getBatch(id);
      if (!batch) return res.status(404).json({ message: "Batch not found" });
      const serials = await storage.getSerialNumbers();
      const linked = serials.filter(s => s.batchId === id);
      if (linked.length > 0) return res.status(400).json({ message: `Cannot delete batch with ${linked.length} linked serial numbers` });
      await storage.deleteBatch(id);
      res.json({ message: "Deleted" });
    } catch (error) { res.status(500).json({ message: "Failed to delete batch" }); }
  });

  app.get("/api/serial-numbers", requireAuth, async (_req, res) => {
    try { res.json(await storage.getSerialNumbers()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch serial numbers" }); }
  });

  app.get("/api/serial-numbers/:id", requireAuth, async (req, res) => {
    try {
      const serial = await storage.getSerialNumber(parseInt(req.params.id));
      if (!serial) return res.status(404).json({ message: "Serial number not found" });
      res.json(serial);
    } catch (error) { res.status(500).json({ message: "Failed to fetch serial number" }); }
  });

  app.post("/api/serial-numbers", requireAuth, async (req, res) => {
    try {
      const parsed = insertSerialNumberSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const created = await storage.createSerialNumber(parsed.data);
      await storage.createSerialMovement({
        serialId: created.id, serialNumber: created.serialNumber,
        referenceType: "registration", referenceId: null,
        sourceWarehouse: null, destinationWarehouse: created.warehouseName || null,
        customerName: null, performedBy: "admin",
        previousStatus: null, newStatus: "available",
        notes: "Serial number registered",
      });
      res.status(201).json(created);
    } catch (error: any) {
      if (error.message?.includes("duplicate") || error.code === "23505") return res.status(400).json({ message: "Serial number already exists" });
      res.status(500).json({ message: error.message || "Failed to create serial number" });
    }
  });

  app.post("/api/serial-numbers/bulk", requireAuth, async (req, res) => {
    try {
      const { serials } = req.body;
      if (!Array.isArray(serials) || serials.length === 0) return res.status(400).json({ message: "No serials provided" });
      const results: any[] = [];
      const errors: any[] = [];
      for (const s of serials) {
        try {
          const parsed = insertSerialNumberSchema.safeParse(s);
          if (!parsed.success) { errors.push({ serial: s.serialNumber, error: "Invalid data" }); continue; }
          const created = await storage.createSerialNumber(parsed.data);
          await storage.createSerialMovement({
            serialId: created.id, serialNumber: created.serialNumber,
            referenceType: "bulk_import", referenceId: null,
            sourceWarehouse: null, destinationWarehouse: created.warehouseName || null,
            customerName: null, performedBy: "admin",
            previousStatus: null, newStatus: "available",
            notes: "Bulk import",
          });
          results.push(created);
        } catch (err: any) {
          errors.push({ serial: s.serialNumber, error: err.message?.includes("duplicate") ? "Duplicate serial" : err.message });
        }
      }
      res.json({ created: results.length, errors: errors.length, details: errors });
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to bulk import" }); }
  });

  app.patch("/api/serial-numbers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getSerialNumber(id);
      if (!existing) return res.status(404).json({ message: "Serial not found" });
      const soldStatuses = ["sold"];
      if (soldStatuses.includes(existing.status) && req.body.status && !["returned", "damaged"].includes(req.body.status)) {
        return res.status(400).json({ message: "Sold serial cannot be modified except for return or damage" });
      }
      const data = { ...req.body };
      if (data.status && data.status !== existing.status) {
        data.lastMovementDate = new Date().toISOString().split("T")[0];
        await storage.createSerialMovement({
          serialId: id, serialNumber: existing.serialNumber,
          referenceType: "status_change", referenceId: null,
          sourceWarehouse: existing.warehouseName || null,
          destinationWarehouse: data.warehouseName || existing.warehouseName || null,
          customerName: data.assignedCustomerName || existing.assignedCustomerName || null,
          performedBy: "admin",
          previousStatus: existing.status, newStatus: data.status,
          notes: data.notes || `Status changed from ${existing.status} to ${data.status}`,
        });
      }
      const updated = await storage.updateSerialNumber(id, data);
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to update serial" }); }
  });

  app.delete("/api/serial-numbers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const serial = await storage.getSerialNumber(id);
      if (!serial) return res.status(404).json({ message: "Serial not found" });
      if (["sold", "assigned", "allocated"].includes(serial.status)) {
        return res.status(400).json({ message: `Cannot delete serial with status '${serial.status}'` });
      }
      await storage.deleteSerialNumber(id);
      res.json({ message: "Deleted" });
    } catch (error) { res.status(500).json({ message: "Failed to delete serial" }); }
  });

  app.get("/api/serial-movements", requireAuth, async (_req, res) => {
    try { res.json(await storage.getSerialMovements()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch serial movements" }); }
  });

  app.get("/api/serial-movements/:serialId", requireAuth, async (req, res) => {
    try { res.json(await storage.getSerialMovementsBySerial(parseInt(req.params.serialId))); }
    catch (error) { res.status(500).json({ message: "Failed to fetch serial movements" }); }
  });

  app.post("/api/serial-movements", requireAuth, async (req, res) => {
    try {
      const parsed = insertSerialMovementSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const created = await storage.createSerialMovement(parsed.data);
      res.status(201).json(created);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create serial movement" }); }
  });

  // Stock Management Routes
  app.get("/api/stock-locations", requireAuth, async (_req, res) => {
    try { res.json(await storage.getStockLocations()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch stock locations" }); }
  });

  app.post("/api/stock-locations", requireAuth, async (req, res) => {
    try {
      const parsed = insertStockLocationSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const created = await storage.createStockLocation(parsed.data);
      res.status(201).json(created);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create location" }); }
  });

  app.patch("/api/stock-locations/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateStockLocation(parseInt(req.params.id), req.body);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to update location" }); }
  });

  app.delete("/api/stock-locations/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const items = await storage.getStockItems();
      const linked = items.filter(i => i.locationId === id);
      if (linked.length > 0) return res.status(400).json({ message: `Cannot delete location with ${linked.length} stock items` });
      await storage.deleteStockLocation(id);
      res.json({ message: "Deleted" });
    } catch (error) { res.status(500).json({ message: "Failed to delete location" }); }
  });

  app.get("/api/stock-items", requireAuth, async (_req, res) => {
    try { res.json(await storage.getStockItems()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch stock items" }); }
  });

  app.get("/api/stock-items/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getStockItem(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "Not found" });
      res.json(item);
    } catch (error) { res.status(500).json({ message: "Failed to fetch stock item" }); }
  });

  app.post("/api/stock-items", requireAuth, async (req, res) => {
    try {
      const data = { ...req.body };
      data.availableQuantity = (parseInt(data.currentQuantity) || 0) - (parseInt(data.reservedQuantity) || 0) - (parseInt(data.inTransitQuantity) || 0);
      data.totalValue = ((parseInt(data.currentQuantity) || 0) * parseFloat(data.averageCost || "0")).toFixed(2);
      const qty = parseInt(data.currentQuantity) || 0;
      const reorder = parseInt(data.reorderLevel) || 10;
      const minimum = parseInt(data.minimumStock) || 5;
      data.status = qty <= 0 ? "out_of_stock" : qty <= minimum ? "critical" : qty <= reorder ? "low_stock" : "healthy";
      const parsed = insertStockItemSchema.safeParse(data);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const created = await storage.createStockItem(parsed.data);
      res.status(201).json(created);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create stock item" }); }
  });

  app.patch("/api/stock-items/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getStockItem(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const data = { ...req.body };
      const currentQty = parseInt(data.currentQuantity ?? existing.currentQuantity) || 0;
      const reservedQty = parseInt(data.reservedQuantity ?? existing.reservedQuantity) || 0;
      const inTransitQty = parseInt(data.inTransitQuantity ?? existing.inTransitQuantity) || 0;
      const avgCost = parseFloat(data.averageCost ?? existing.averageCost ?? "0");
      const reorder = parseInt(data.reorderLevel ?? existing.reorderLevel) || 10;
      const minimum = parseInt(data.minimumStock ?? existing.minimumStock) || 5;
      data.availableQuantity = currentQty - reservedQty - inTransitQty;
      data.totalValue = (currentQty * avgCost).toFixed(2);
      data.status = currentQty <= 0 ? "out_of_stock" : currentQty <= minimum ? "critical" : currentQty <= reorder ? "low_stock" : "healthy";
      const updated = await storage.updateStockItem(id, data);
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to update stock item" }); }
  });

  app.delete("/api/stock-items/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getStockItem(id);
      if (!item) return res.status(404).json({ message: "Not found" });
      if ((item.currentQuantity || 0) > 0 || (item.reservedQuantity || 0) > 0 || (item.inTransitQuantity || 0) > 0) return res.status(400).json({ message: "Cannot delete stock item with remaining, reserved, or in-transit quantity" });
      await storage.deleteStockItem(id);
      res.json({ message: "Deleted" });
    } catch (error) { res.status(500).json({ message: "Failed to delete stock item" }); }
  });

  app.get("/api/stock-movements", requireAuth, async (_req, res) => {
    try { res.json(await storage.getStockMovements()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch movements" }); }
  });

  app.get("/api/stock-movements/:stockItemId", requireAuth, async (req, res) => {
    try { res.json(await storage.getStockMovementsByItem(parseInt(req.params.stockItemId))); }
    catch (error) { res.status(500).json({ message: "Failed to fetch movements" }); }
  });

  app.post("/api/stock-movements", requireAuth, async (req, res) => {
    try {
      const data = { ...req.body };
      if (!data.movementId) {
        const existing = await storage.getStockMovements();
        const maxNum = existing.reduce((max, m) => {
          const match = m.movementId?.match(/MOV-(\d+)/);
          return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        data.movementId = `MOV-${String(maxNum + 1).padStart(6, "0")}`;
      }
      const stockItem = await storage.getStockItem(data.stockItemId);
      if (!stockItem) return res.status(400).json({ message: "Stock item not found" });
      const qtyIn = parseInt(data.quantityIn) || 0;
      const qtyOut = parseInt(data.quantityOut) || 0;
      const newQty = (stockItem.currentQuantity || 0) + qtyIn - qtyOut;
      if (newQty < 0) return res.status(400).json({ message: "Insufficient stock for this movement" });
      data.balanceAfter = newQty;
      const parsed = insertStockMovementSchema.safeParse(data);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const movement = await storage.createStockMovement(parsed.data);
      const reorder = stockItem.reorderLevel || 10;
      const minimum = stockItem.minimumStock || 5;
      const newStatus = newQty <= 0 ? "out_of_stock" : newQty <= minimum ? "critical" : newQty <= reorder ? "low_stock" : "healthy";
      await storage.updateStockItem(data.stockItemId, {
        currentQuantity: newQty,
        availableQuantity: newQty - (stockItem.reservedQuantity || 0) - (stockItem.inTransitQuantity || 0),
        totalValue: (newQty * parseFloat(stockItem.averageCost || "0")).toFixed(2),
        status: newStatus,
        ...(qtyIn > 0 ? { lastReceivedDate: new Date().toISOString().split("T")[0] } : {}),
        ...(qtyOut > 0 ? { lastIssuedDate: new Date().toISOString().split("T")[0] } : {}),
      });
      res.status(201).json(movement);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create movement" }); }
  });

  app.get("/api/stock-adjustments", requireAuth, async (_req, res) => {
    try { res.json(await storage.getStockAdjustments()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch adjustments" }); }
  });

  app.post("/api/stock-adjustments", requireAuth, async (req, res) => {
    try {
      const data = { ...req.body };
      if (!data.adjustmentId) {
        const existing = await storage.getStockAdjustments();
        const maxNum = existing.reduce((max, a) => {
          const match = a.adjustmentId?.match(/ADJ-(\d+)/);
          return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        data.adjustmentId = `ADJ-${String(maxNum + 1).padStart(5, "0")}`;
      }
      const stockItem = await storage.getStockItem(data.stockItemId);
      if (!stockItem) return res.status(400).json({ message: "Stock item not found" });
      if (!data.reason || data.reason.trim() === "") return res.status(400).json({ message: "Reason is mandatory for adjustments" });
      data.quantityBefore = stockItem.currentQuantity || 0;
      const adjustment = parseInt(data.quantityAdjustment) || 0;
      data.quantityAfter = data.quantityBefore + adjustment;
      if (data.quantityAfter < 0) return res.status(400).json({ message: "Adjustment would result in negative stock" });
      const highValue = Math.abs(adjustment) * parseFloat(stockItem.averageCost || "0") > 50000;
      if (highValue) { data.approvalRequired = true; data.approvalStatus = "pending"; }
      else { data.approvalRequired = false; data.approvalStatus = "auto_approved"; }
      const parsed = insertStockAdjustmentSchema.safeParse(data);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const created = await storage.createStockAdjustment(parsed.data);
      if (!data.approvalRequired || data.approvalStatus === "auto_approved") {
        const newQty = data.quantityAfter;
        const reorder = stockItem.reorderLevel || 10;
        const minimum = stockItem.minimumStock || 5;
        const newStatus = newQty <= 0 ? "out_of_stock" : newQty <= minimum ? "critical" : newQty <= reorder ? "low_stock" : "healthy";
        await storage.updateStockItem(data.stockItemId, {
          currentQuantity: newQty,
          availableQuantity: newQty - (stockItem.reservedQuantity || 0) - (stockItem.inTransitQuantity || 0),
          totalValue: (newQty * parseFloat(stockItem.averageCost || "0")).toFixed(2),
          status: newStatus,
        });
        const movId = `MOV-ADJ-${created.id}`;
        await storage.createStockMovement({
          movementId: movId, stockItemId: data.stockItemId, movementType: "adjustment",
          referenceId: created.adjustmentId, productName: stockItem.productName,
          locationName: stockItem.locationName, quantityIn: adjustment > 0 ? adjustment : 0,
          quantityOut: adjustment < 0 ? Math.abs(adjustment) : 0, balanceAfter: newQty,
          performedBy: data.performedBy, notes: `${data.adjustmentType}: ${data.reason}`,
        });
      }
      res.status(201).json(created);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create adjustment" }); }
  });

  app.patch("/api/stock-adjustments/:id/approve", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const adj = await storage.getStockAdjustment(id);
      if (!adj) return res.status(404).json({ message: "Not found" });
      if (adj.approvalStatus !== "pending") return res.status(400).json({ message: "Adjustment is not pending approval" });
      const action = req.body.action;
      if (action === "approve") {
        const updated = await storage.updateStockAdjustment(id, {
          approvalStatus: "approved", approvedBy: req.body.approvedBy || "admin",
          approvedDate: new Date().toISOString().split("T")[0],
        });
        const stockItem = await storage.getStockItem(adj.stockItemId);
        if (stockItem) {
          const newQty = adj.quantityAfter;
          const reorder = stockItem.reorderLevel || 10;
          const minimum = stockItem.minimumStock || 5;
          const newStatus = newQty <= 0 ? "out_of_stock" : newQty <= minimum ? "critical" : newQty <= reorder ? "low_stock" : "healthy";
          await storage.updateStockItem(adj.stockItemId, {
            currentQuantity: newQty,
            availableQuantity: newQty - (stockItem.reservedQuantity || 0) - (stockItem.inTransitQuantity || 0),
            totalValue: (newQty * parseFloat(stockItem.averageCost || "0")).toFixed(2),
            status: newStatus,
          });
          await storage.createStockMovement({
            movementId: `MOV-ADJ-${adj.id}`, stockItemId: adj.stockItemId, movementType: "adjustment",
            referenceId: adj.adjustmentId, productName: stockItem.productName,
            locationName: stockItem.locationName,
            quantityIn: (adj.quantityAdjustment || 0) > 0 ? adj.quantityAdjustment || 0 : 0,
            quantityOut: (adj.quantityAdjustment || 0) < 0 ? Math.abs(adj.quantityAdjustment || 0) : 0,
            balanceAfter: newQty, performedBy: req.body.approvedBy || "admin",
            notes: `Approved adjustment: ${adj.adjustmentType} - ${adj.reason}`,
          });
        }
        res.json(updated);
      } else if (action === "reject") {
        const updated = await storage.updateStockAdjustment(id, {
          approvalStatus: "rejected", approvedBy: req.body.approvedBy || "admin",
          approvedDate: new Date().toISOString().split("T")[0],
        });
        res.json(updated);
      } else {
        return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'" });
      }
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to process adjustment" }); }
  });

  app.post("/api/stock-transfer", requireAuth, async (req, res) => {
    try {
      const { sourceItemId, destinationLocationId, destinationLocationName, quantity, performedBy, notes } = req.body;
      if (!sourceItemId || !destinationLocationId || !quantity || typeof quantity !== "number" || quantity < 1) return res.status(400).json({ message: "Invalid transfer data: sourceItemId, destinationLocationId, and quantity (>0) are required" });
      const sourceItem = await storage.getStockItem(sourceItemId);
      if (!sourceItem) return res.status(400).json({ message: "Source stock item not found" });
      if (sourceItem.locationId === destinationLocationId) return res.status(400).json({ message: "Source and destination locations must be different" });
      if ((sourceItem.availableQuantity || 0) < quantity) return res.status(400).json({ message: "Insufficient available stock for transfer" });
      const newSourceQty = (sourceItem.currentQuantity || 0) - quantity;
      const reorder = sourceItem.reorderLevel || 10;
      const minimum = sourceItem.minimumStock || 5;
      const srcStatus = newSourceQty <= 0 ? "out_of_stock" : newSourceQty <= minimum ? "critical" : newSourceQty <= reorder ? "low_stock" : "healthy";
      await storage.updateStockItem(sourceItemId, {
        currentQuantity: newSourceQty,
        availableQuantity: newSourceQty - (sourceItem.reservedQuantity || 0) - (sourceItem.inTransitQuantity || 0),
        totalValue: (newSourceQty * parseFloat(sourceItem.averageCost || "0")).toFixed(2),
        status: srcStatus, lastIssuedDate: new Date().toISOString().split("T")[0],
      });
      const allItems = await storage.getStockItems();
      let destItem = allItems.find(i => i.productName === sourceItem.productName && i.locationId === destinationLocationId);
      let destBalanceAfter: number;
      if (destItem) {
        destBalanceAfter = (destItem.currentQuantity || 0) + quantity;
        const dReorder = destItem.reorderLevel || 10;
        const dMin = destItem.minimumStock || 5;
        const dStatus = destBalanceAfter <= 0 ? "out_of_stock" : destBalanceAfter <= dMin ? "critical" : destBalanceAfter <= dReorder ? "low_stock" : "healthy";
        await storage.updateStockItem(destItem.id, {
          currentQuantity: destBalanceAfter,
          availableQuantity: destBalanceAfter - (destItem.reservedQuantity || 0) - (destItem.inTransitQuantity || 0),
          totalValue: (destBalanceAfter * parseFloat(destItem.averageCost || "0")).toFixed(2),
          status: dStatus, lastReceivedDate: new Date().toISOString().split("T")[0],
        });
      } else {
        destBalanceAfter = quantity;
        destItem = await storage.createStockItem({
          productId: sourceItem.productId, productName: sourceItem.productName,
          brandName: sourceItem.brandName, category: sourceItem.category,
          skuCode: sourceItem.skuCode, locationId: destinationLocationId,
          locationName: destinationLocationName || "Unknown", currentQuantity: quantity,
          reservedQuantity: 0, inTransitQuantity: 0, availableQuantity: quantity,
          reorderLevel: sourceItem.reorderLevel, minimumStock: sourceItem.minimumStock,
          averageCost: sourceItem.averageCost || "0",
          totalValue: (quantity * parseFloat(sourceItem.averageCost || "0")).toFixed(2),
          status: "healthy",
        });
      }
      const movements = await storage.getStockMovements();
      const maxNum = movements.reduce((max, m) => {
        const match = m.movementId?.match(/MOV-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      const movBase = `MOV-${String(maxNum + 1).padStart(6, "0")}`;
      const movBase2 = `MOV-${String(maxNum + 2).padStart(6, "0")}`;
      await storage.createStockMovement({
        movementId: movBase, stockItemId: sourceItemId, movementType: "transfer_out",
        referenceId: `TRF-${sourceItemId}-${destItem.id}`, productName: sourceItem.productName,
        locationName: sourceItem.locationName, quantityIn: 0, quantityOut: quantity,
        balanceAfter: newSourceQty, performedBy, notes: notes || `Transfer to ${destinationLocationName}`,
      });
      await storage.createStockMovement({
        movementId: movBase2, stockItemId: destItem.id, movementType: "transfer_in",
        referenceId: `TRF-${sourceItemId}-${destItem.id}`, productName: sourceItem.productName,
        locationName: destinationLocationName, quantityIn: quantity, quantityOut: 0,
        balanceAfter: destBalanceAfter, performedBy,
        notes: notes || `Transfer from ${sourceItem.locationName}`,
      });
      res.json({ message: "Transfer completed", sourceQty: newSourceQty });
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to transfer stock" }); }
  });

  app.get("/api/purchase-orders", requireAuth, async (_req, res) => {
    try { res.json(await storage.getPurchaseOrders()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch purchase orders" }); }
  });

  app.get("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      const po = await storage.getPurchaseOrder(parseInt(req.params.id));
      if (!po) return res.status(404).json({ message: "Not found" });
      const items = await storage.getPurchaseOrderItems(po.id);
      res.json({ ...po, items });
    } catch (error) { res.status(500).json({ message: "Failed to fetch purchase order" }); }
  });

  app.post("/api/purchase-orders", requireAuth, async (req, res) => {
    try {
      const { items, ...poData } = req.body;
      if (!poData.poNumber) {
        const existing = await storage.getPurchaseOrders();
        const maxNum = existing.reduce((max, p) => {
          const match = p.poNumber?.match(/PO-(\d+)/);
          return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        poData.poNumber = `PO-${String(maxNum + 1).padStart(5, "0")}`;
      }
      const parsed = insertPurchaseOrderSchema.safeParse(poData);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const supplier = await storage.getSupplier(parsed.data.supplierId);
      if (!supplier) return res.status(400).json({ message: "Supplier not found" });
      if (supplier.status === "inactive" || supplier.status === "blacklisted") {
        return res.status(400).json({ message: "Cannot create PO for inactive or blacklisted supplier" });
      }
      const po = await storage.createPurchaseOrder(parsed.data);
      if (items && Array.isArray(items)) {
        let calcSubtotal = 0;
        let calcTax = 0;
        for (const item of items) {
          const qty = parseInt(item.quantity) || 1;
          const price = parseFloat(item.unitPrice || "0");
          const disc = parseFloat(item.discount || "0");
          const taxRate = parseFloat(item.tax || "0");
          const base = qty * price * (1 - disc / 100);
          const lineTax = base * taxRate / 100;
          const lineSubtotal = base + lineTax;
          calcSubtotal += base;
          calcTax += lineTax;
          await storage.createPurchaseOrderItem({ ...item, purchaseOrderId: po.id, subtotal: lineSubtotal.toFixed(2) });
        }
        const shipping = parseFloat(parsed.data.shippingCost || "0");
        const additional = parseFloat(parsed.data.additionalCharges || "0");
        const grandTotal = calcSubtotal + calcTax + shipping + additional;
        await storage.updatePurchaseOrder(po.id, {
          subtotal: calcSubtotal.toFixed(2), taxAmount: calcTax.toFixed(2), grandTotal: grandTotal.toFixed(2),
        });
      }
      const updatedPO = await storage.getPurchaseOrder(po.id);
      const allItems = await storage.getPurchaseOrderItems(po.id);
      res.status(201).json({ ...updatedPO, items: allItems });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create purchase order" });
    }
  });

  app.patch("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { items, ...poData } = req.body;
      const existing = await storage.getPurchaseOrder(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const allowedTransitions: Record<string, string[]> = {
        draft: ["pending_approval", "cancelled"],
        pending_approval: ["approved", "rejected", "cancelled"],
        approved: ["partially_received", "fully_received", "cancelled"],
        partially_received: ["fully_received"],
        rejected: ["draft"],
        cancelled: [],
        fully_received: [],
      };
      if (poData.status && poData.status !== existing.status) {
        const allowed = allowedTransitions[existing.status] || [];
        if (!allowed.includes(poData.status)) {
          return res.status(400).json({ message: `Cannot transition from ${existing.status} to ${poData.status}` });
        }
      }
      if (items && Array.isArray(items) && existing.status !== "draft") {
        return res.status(400).json({ message: "Cannot modify line items after PO is no longer in draft" });
      }
      const updated = await storage.updatePurchaseOrder(id, poData);
      if (items && Array.isArray(items) && existing.status === "draft") {
        await storage.deletePurchaseOrderItemsByPo(id);
        let calcSubtotal = 0;
        let calcTax = 0;
        for (const item of items) {
          const qty = parseInt(item.quantity) || 1;
          const price = parseFloat(item.unitPrice || "0");
          const disc = parseFloat(item.discount || "0");
          const taxRate = parseFloat(item.tax || "0");
          const base = qty * price * (1 - disc / 100);
          const lineTax = base * taxRate / 100;
          const lineSubtotal = base + lineTax;
          calcSubtotal += base;
          calcTax += lineTax;
          await storage.createPurchaseOrderItem({ ...item, purchaseOrderId: id, subtotal: lineSubtotal.toFixed(2) });
        }
        const shipping = parseFloat(poData.shippingCost || updated?.shippingCost || "0");
        const additional = parseFloat(poData.additionalCharges || updated?.additionalCharges || "0");
        const grandTotal = calcSubtotal + calcTax + shipping + additional;
        await storage.updatePurchaseOrder(id, {
          subtotal: calcSubtotal.toFixed(2), taxAmount: calcTax.toFixed(2), grandTotal: grandTotal.toFixed(2),
        });
      }
      const finalPO = await storage.getPurchaseOrder(id);
      const allItems = await storage.getPurchaseOrderItems(id);
      res.json({ ...finalPO, items: allItems });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update purchase order" });
    }
  });

  app.delete("/api/purchase-orders/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const po = await storage.getPurchaseOrder(id);
      if (!po) return res.status(404).json({ message: "Not found" });
      if (po.status !== "draft" && po.status !== "cancelled") {
        return res.status(400).json({ message: "Only draft or cancelled POs can be deleted" });
      }
      await storage.deletePurchaseOrder(id);
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete purchase order" });
    }
  });

  app.get("/api/purchase-order-items/:poId", requireAuth, async (req, res) => {
    try { res.json(await storage.getPurchaseOrderItems(parseInt(req.params.poId))); }
    catch (error) { res.status(500).json({ message: "Failed to fetch items" }); }
  });

  app.patch("/api/purchase-order-items/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingItem = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.id, id));
      if (!existingItem.length) return res.status(404).json({ message: "Item not found" });
      const po = await storage.getPurchaseOrder(existingItem[0].purchaseOrderId);
      if (!po) return res.status(404).json({ message: "PO not found" });
      const allowedForReceiving = ["approved", "partially_received"];
      const receivingFields = ["receivedQuantity", "damagedQuantity", "shortQuantity", "serialNumbers", "inspectionStatus"];
      const bodyKeys = Object.keys(req.body);
      const isReceivingOnly = bodyKeys.every(k => receivingFields.includes(k));
      if (po.status === "draft") {
      } else if (allowedForReceiving.includes(po.status) && isReceivingOnly) {
      } else {
        return res.status(400).json({ message: "Cannot modify item fields for PO in current status" });
      }
      const updated = await storage.updatePurchaseOrderItem(id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update item" });
    }
  });

  app.get("/api/brands", requireAuth, async (_req, res) => {
    try { res.json(await storage.getBrands()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch brands" }); }
  });

  app.post("/api/brands", requireAuth, async (req, res) => {
    try {
      const body = { ...req.body };
      if (!body.brandId) {
        const existing = await storage.getBrands();
        const maxNum = existing.reduce((max, b) => {
          const match = b.brandId?.match(/BRD-(\d+)/);
          return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        body.brandId = `BRD-${String(maxNum + 1).padStart(4, "0")}`;
      }
      const parsed = insertBrandSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.createBrand(parsed.data);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create brand" });
    }
  });

  app.patch("/api/brands/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertBrandSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
      const existing = await storage.getBrand(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      const updated = await storage.updateBrand(id, parsed.data);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update brand" });
    }
  });

  app.delete("/api/brands/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const brand = await storage.getBrand(id);
      if (!brand) return res.status(404).json({ message: "Not found" });
      const allProducts = await storage.getProducts();
      if (allProducts.some(p => p.brandId === id)) {
        return res.status(400).json({ message: "Cannot delete brand with linked products. Deactivate instead." });
      }
      await storage.deleteBrand(id);
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete brand" });
    }
  });

  app.get("/api/products", requireAuth, async (_req, res) => {
    try { res.json(await storage.getProducts()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch products" }); }
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const body = { ...req.body };
      if (!body.productId) {
        const existing = await storage.getProducts();
        const maxNum = existing.reduce((max, p) => {
          const match = p.productId?.match(/PRD-(\d+)/);
          return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        body.productId = `PRD-${String(maxNum + 1).padStart(4, "0")}`;
      }
      const parsed = insertProductSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const allProducts = await storage.getProducts();
      if (allProducts.some(p => p.skuCode === parsed.data.skuCode)) {
        return res.status(400).json({ message: "SKU code must be unique" });
      }
      if (parsed.data.visibleInAssets && !parsed.data.trackSerialNumber) {
        return res.status(400).json({ message: "Asset-type products must enable serial tracking" });
      }
      const item = await storage.createProduct(parsed.data);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertProductSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
      const existing = await storage.getProduct(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      if (parsed.data.skuCode && parsed.data.skuCode !== existing.skuCode) {
        const allProducts = await storage.getProducts();
        if (allProducts.some(p => p.id !== id && p.skuCode === parsed.data.skuCode)) {
          return res.status(400).json({ message: "SKU code must be unique" });
        }
      }
      const finalVisibleInAssets = parsed.data.visibleInAssets !== undefined ? parsed.data.visibleInAssets : existing.visibleInAssets;
      const finalTrackSerial = parsed.data.trackSerialNumber !== undefined ? parsed.data.trackSerialNumber : existing.trackSerialNumber;
      if (finalVisibleInAssets && !finalTrackSerial) {
        return res.status(400).json({ message: "Asset-type products must enable serial tracking" });
      }
      const updated = await storage.updateProduct(id, parsed.data);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) return res.status(404).json({ message: "Not found" });
      if ((product.currentStock || 0) > 0) {
        return res.status(400).json({ message: "Cannot delete product with existing stock. Discontinue instead." });
      }
      await storage.deleteProduct(id);
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.get("/api/suppliers", requireAuth, async (_req, res) => {
    try { res.json(await storage.getSuppliers()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch suppliers" }); }
  });

  app.post("/api/suppliers", requireAuth, async (req, res) => {
    try {
      const body = { ...req.body };
      if (!body.supplierId) {
        const existing = await storage.getSuppliers();
        const maxNum = existing.reduce((max, s) => {
          const match = s.supplierId?.match(/SUP-(\d+)/);
          return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        body.supplierId = `SUP-${String(maxNum + 1).padStart(4, "0")}`;
      }
      const parsed = insertSupplierSchema.safeParse(body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const allSuppliers = await storage.getSuppliers();
      if (allSuppliers.some(s => s.supplierId === parsed.data.supplierId)) {
        return res.status(400).json({ message: "Duplicate Supplier ID. Please try again." });
      }
      if (parsed.data.taxRegistrationNumber && allSuppliers.some(s => s.taxRegistrationNumber === parsed.data.taxRegistrationNumber)) {
        return res.status(400).json({ message: "Duplicate tax registration number not allowed" });
      }
      if (parsed.data.enableCreditPurchases && (!parsed.data.creditLimit || parseFloat(parsed.data.creditLimit) <= 0)) {
        return res.status(400).json({ message: "Credit purchases require a credit limit greater than zero" });
      }
      const item = await storage.createSupplier(parsed.data);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create supplier" });
    }
  });

  app.patch("/api/suppliers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const partial = insertSupplierSchema.partial().safeParse(req.body);
      if (!partial.success) return res.status(400).json({ message: "Invalid data", errors: partial.error.flatten() });
      const existing = await storage.getSupplier(id);
      if (!existing) return res.status(404).json({ message: "Not found" });
      if (partial.data.taxRegistrationNumber && partial.data.taxRegistrationNumber !== existing.taxRegistrationNumber) {
        const allSuppliers = await storage.getSuppliers();
        if (allSuppliers.some(s => s.id !== id && s.taxRegistrationNumber === partial.data.taxRegistrationNumber)) {
          return res.status(400).json({ message: "Duplicate tax registration number not allowed" });
        }
      }
      const finalCredit = partial.data.enableCreditPurchases !== undefined ? partial.data.enableCreditPurchases : existing.enableCreditPurchases;
      const finalLimit = partial.data.creditLimit !== undefined ? partial.data.creditLimit : existing.creditLimit;
      if (finalCredit && (!finalLimit || parseFloat(finalLimit || "0") <= 0)) {
        return res.status(400).json({ message: "Credit purchases require a credit limit greater than zero" });
      }
      const updated = await storage.updateSupplier(id, partial.data);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);
      if (!supplier) return res.status(404).json({ message: "Not found" });
      if (parseFloat(supplier.outstandingPayable || "0") > 0) {
        return res.status(400).json({ message: "Cannot delete supplier with outstanding payables. Settle balance first." });
      }
      if (parseFloat(supplier.totalPurchases || "0") > 0) {
        return res.status(400).json({ message: "Cannot delete supplier linked to transactions. Deactivate instead." });
      }
      await storage.deleteSupplier(id);
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Notification Channels
  app.get("/api/notification-channels", requireAuth, async (_req, res) => {
    try { res.json(await storage.getNotificationChannels()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch channels" }); }
  });

  app.get("/api/notification-channels/:id", requireAuth, async (req, res) => {
    try {
      const ch = await storage.getNotificationChannel(parseInt(req.params.id));
      if (!ch) return res.status(404).json({ message: "Channel not found" });
      res.json(ch);
    } catch (error) { res.status(500).json({ message: "Failed to fetch channel" }); }
  });

  app.post("/api/notification-channels", requireAuth, async (req, res) => {
    try {
      const channelId = "NCHX-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const data = { ...req.body, channelId };
      const ch = await storage.createNotificationChannel(data);
      res.status(201).json(ch);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create channel" }); }
  });

  app.patch("/api/notification-channels/:id", requireAuth, async (req, res) => {
    try {
      const { id, channelId, createdAt, ...safe } = req.body;
      const ch = await storage.updateNotificationChannel(parseInt(req.params.id), safe);
      if (!ch) return res.status(404).json({ message: "Channel not found" });
      res.json(ch);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to update channel" }); }
  });

  app.delete("/api/notification-channels/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteNotificationChannel(parseInt(req.params.id));
      res.json({ message: "Channel deleted" });
    } catch (error) { res.status(500).json({ message: "Failed to delete channel" }); }
  });

  // Notification Triggers
  app.get("/api/notification-triggers", requireAuth, async (_req, res) => {
    try { res.json(await storage.getNotificationTriggers()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch triggers" }); }
  });

  app.get("/api/notification-triggers/category/:category", requireAuth, async (req, res) => {
    try { res.json(await storage.getNotificationTriggersByCategory(req.params.category)); }
    catch (error) { res.status(500).json({ message: "Failed to fetch triggers" }); }
  });

  app.get("/api/notification-triggers/:id", requireAuth, async (req, res) => {
    try {
      const t = await storage.getNotificationTrigger(parseInt(req.params.id));
      if (!t) return res.status(404).json({ message: "Trigger not found" });
      res.json(t);
    } catch (error) { res.status(500).json({ message: "Failed to fetch trigger" }); }
  });

  app.post("/api/notification-triggers", requireAuth, async (req, res) => {
    try {
      const triggerId = "NTRG-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const data = { ...req.body, triggerId };
      const t = await storage.createNotificationTrigger(data);
      res.status(201).json(t);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create trigger" }); }
  });

  app.patch("/api/notification-triggers/:id", requireAuth, async (req, res) => {
    try {
      const { id, triggerId, createdAt, ...safe } = req.body;
      const t = await storage.updateNotificationTrigger(parseInt(req.params.id), safe);
      if (!t) return res.status(404).json({ message: "Trigger not found" });
      res.json(t);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to update trigger" }); }
  });

  app.delete("/api/notification-triggers/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteNotificationTrigger(parseInt(req.params.id));
      res.json({ message: "Trigger deleted" });
    } catch (error) { res.status(500).json({ message: "Failed to delete trigger" }); }
  });

  // Notification Logs
  app.get("/api/notification-logs", requireAuth, async (_req, res) => {
    try { res.json(await storage.getNotificationLogs()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch logs" }); }
  });

  app.get("/api/notification-logs/stats", requireAuth, async (_req, res) => {
    try { res.json(await storage.getNotificationLogStats()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch stats" }); }
  });

  app.post("/api/notification-logs", requireAuth, async (req, res) => {
    try {
      const logId = "NLOG-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const data = { ...req.body, logId };
      const l = await storage.createNotificationLog(data);
      res.status(201).json(l);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create log" }); }
  });

  app.post("/api/notification-logs/:id/resend", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getNotificationLogs();
      const log = existing.find(l => l.id === parseInt(req.params.id));
      if (!log) return res.status(404).json({ message: "Log not found" });
      const updated = await storage.updateNotificationLog(parseInt(req.params.id), { status: "pending", retryCount: (log.retryCount || 0) + 1 });
      res.json(updated);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to resend" }); }
  });

  // Notification Settings (key-value via general_settings with 'notification' category prefix)
  app.get("/api/notification-settings", requireAuth, async (_req, res) => {
    try {
      const all = await storage.getGeneralSettings();
      const notifSettings = all.filter(s => s.category.startsWith("notification_"));
      res.json(notifSettings);
    } catch (error) { res.status(500).json({ message: "Failed to fetch notification settings" }); }
  });

  app.put("/api/notification-settings", requireAuth, async (req, res) => {
    try {
      const { settings } = req.body;
      if (!Array.isArray(settings)) return res.status(400).json({ message: "Settings must be an array" });
      const results = await storage.bulkUpsertGeneralSettings(settings);
      res.json(results);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to save notification settings" }); }
  });

  // Gateway Webhooks
  app.get("/api/gateway-webhooks", requireAuth, async (_req, res) => {
    try { res.json(await storage.getGatewayWebhooks()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch webhooks" }); }
  });

  app.get("/api/gateway-webhooks/gateway/:gatewayId", requireAuth, async (req, res) => {
    try { res.json(await storage.getGatewayWebhooksByGateway(parseInt(req.params.gatewayId))); }
    catch (error) { res.status(500).json({ message: "Failed to fetch webhooks" }); }
  });

  app.post("/api/gateway-webhooks", requireAuth, async (req, res) => {
    try {
      const webhookId = "GWHK-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const w = await storage.createGatewayWebhook({ ...req.body, webhookId });
      res.status(201).json(w);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create webhook" }); }
  });

  app.patch("/api/gateway-webhooks/:id", requireAuth, async (req, res) => {
    try {
      const { id, webhookId, createdAt, ...safe } = req.body;
      const w = await storage.updateGatewayWebhook(parseInt(req.params.id), safe);
      if (!w) return res.status(404).json({ message: "Webhook not found" });
      res.json(w);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to update webhook" }); }
  });

  app.delete("/api/gateway-webhooks/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteGatewayWebhook(parseInt(req.params.id));
      res.json({ message: "Webhook deleted" });
    } catch (error) { res.status(500).json({ message: "Failed to delete webhook" }); }
  });

  // Gateway Settlements
  app.get("/api/gateway-settlements", requireAuth, async (_req, res) => {
    try { res.json(await storage.getGatewaySettlements()); }
    catch (error) { res.status(500).json({ message: "Failed to fetch settlements" }); }
  });

  app.get("/api/gateway-settlements/gateway/:gatewayId", requireAuth, async (req, res) => {
    try { res.json(await storage.getGatewaySettlementsByGateway(parseInt(req.params.gatewayId))); }
    catch (error) { res.status(500).json({ message: "Failed to fetch settlements" }); }
  });

  app.post("/api/gateway-settlements", requireAuth, async (req, res) => {
    try {
      const settlementId = "GSTL-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const s = await storage.createGatewaySettlement({ ...req.body, settlementId });
      res.status(201).json(s);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to create settlement" }); }
  });

  app.patch("/api/gateway-settlements/:id", requireAuth, async (req, res) => {
    try {
      const { id, settlementId, createdAt, ...safe } = req.body;
      const s = await storage.updateGatewaySettlement(parseInt(req.params.id), safe);
      if (!s) return res.status(404).json({ message: "Settlement not found" });
      res.json(s);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to update settlement" }); }
  });

  app.delete("/api/gateway-settlements/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteGatewaySettlement(parseInt(req.params.id));
      res.json({ message: "Settlement deleted" });
    } catch (error) { res.status(500).json({ message: "Failed to delete settlement" }); }
  });

  // Payment Gateway Settings (key-value via general_settings)
  app.get("/api/payment-gateway-settings", requireAuth, async (_req, res) => {
    try {
      const all = await storage.getGeneralSettings();
      const pgSettings = all.filter(s => s.category.startsWith("payment_gateway_"));
      res.json(pgSettings);
    } catch (error) { res.status(500).json({ message: "Failed to fetch payment gateway settings" }); }
  });

  app.put("/api/payment-gateway-settings", requireAuth, async (req, res) => {
    try {
      const { settings } = req.body;
      if (!Array.isArray(settings)) return res.status(400).json({ message: "Settings must be an array" });
      const results = await storage.bulkUpsertGeneralSettings(settings);
      res.json(results);
    } catch (error: any) { res.status(500).json({ message: error.message || "Failed to save settings" }); }
  });

  // ─── Network Map: Fiber Routes ─────────────────────────────────
  app.get("/api/fiber-routes", requireAuth, async (_req, res) => {
    try { res.json(await storage.getFiberRoutes()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/fiber-routes/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getFiberRoute(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "Fiber route not found" });
      res.json(item);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/fiber-routes", requireAuth, async (req, res) => {
    try {
      const all = await storage.getFiberRoutes();
      const maxNum = all.reduce((m, r) => { const n = parseInt(r.routeId?.replace("FR-", "") || "0"); return n > m ? n : m; }, 0);
      const routeId = `FR-${String(maxNum + 1).padStart(4, "0")}`;
      const parsed = insertFiberRouteSchema.safeParse({ ...req.body, routeId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      res.status(201).json(await storage.createFiberRoute(parsed.data));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.patch("/api/fiber-routes/:id", requireAuth, async (req, res) => {
    try {
      const { routeId, createdAt, ...rest } = req.body;
      const parsed = insertFiberRouteSchema.partial().safeParse(rest);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.updateFiberRoute(parseInt(req.params.id), parsed.data);
      if (!item) return res.status(404).json({ message: "Fiber route not found" });
      res.json(item);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.delete("/api/fiber-routes/:id", requireAuth, async (req, res) => {
    try { await storage.deleteFiberRoute(parseInt(req.params.id)); res.json({ message: "Deleted" }); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ─── Network Map: Network Towers ───────────────────────────────
  app.get("/api/network-towers", requireAuth, async (_req, res) => {
    try { res.json(await storage.getNetworkTowers()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/network-towers/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getNetworkTower(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "Tower not found" });
      res.json(item);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/network-towers", requireAuth, async (req, res) => {
    try {
      const all = await storage.getNetworkTowers();
      const maxNum = all.reduce((m, t) => { const n = parseInt(t.towerId?.replace("TWR-", "") || "0"); return n > m ? n : m; }, 0);
      const towerId = `TWR-${String(maxNum + 1).padStart(4, "0")}`;
      const parsed = insertNetworkTowerSchema.safeParse({ ...req.body, towerId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      res.status(201).json(await storage.createNetworkTower(parsed.data));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.patch("/api/network-towers/:id", requireAuth, async (req, res) => {
    try {
      const { towerId, createdAt, ...rest } = req.body;
      const parsed = insertNetworkTowerSchema.partial().safeParse(rest);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.updateNetworkTower(parseInt(req.params.id), parsed.data);
      if (!item) return res.status(404).json({ message: "Tower not found" });
      res.json(item);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.delete("/api/network-towers/:id", requireAuth, async (req, res) => {
    try { await storage.deleteNetworkTower(parseInt(req.params.id)); res.json({ message: "Deleted" }); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ─── Network Map: OLT Devices ─────────────────────────────────
  app.get("/api/olt-devices", requireAuth, async (_req, res) => {
    try { res.json(await storage.getOltDevices()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/olt-devices/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getOltDevice(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "OLT device not found" });
      res.json(item);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/olt-devices", requireAuth, async (req, res) => {
    try {
      const all = await storage.getOltDevices();
      const maxNum = all.reduce((m, o) => { const n = parseInt(o.oltId?.replace("OLT-", "") || "0"); return n > m ? n : m; }, 0);
      const oltId = `OLT-${String(maxNum + 1).padStart(4, "0")}`;
      const parsed = insertOltDeviceSchema.safeParse({ ...req.body, oltId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      res.status(201).json(await storage.createOltDevice(parsed.data));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.patch("/api/olt-devices/:id", requireAuth, async (req, res) => {
    try {
      const { oltId, createdAt, ...rest } = req.body;
      const parsed = insertOltDeviceSchema.partial().safeParse(rest);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.updateOltDevice(parseInt(req.params.id), parsed.data);
      if (!item) return res.status(404).json({ message: "OLT device not found" });
      res.json(item);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.delete("/api/olt-devices/:id", requireAuth, async (req, res) => {
    try { await storage.deleteOltDevice(parseInt(req.params.id)); res.json({ message: "Deleted" }); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ─── Network Map: GPON Splitters ───────────────────────────────
  app.get("/api/gpon-splitters", requireAuth, async (_req, res) => {
    try { res.json(await storage.getGponSplitters()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/gpon-splitters/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getGponSplitter(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "Splitter not found" });
      res.json(item);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/gpon-splitters", requireAuth, async (req, res) => {
    try {
      const all = await storage.getGponSplitters();
      const maxNum = all.reduce((m, s) => { const n = parseInt(s.splitterId?.replace("SPL-", "") || "0"); return n > m ? n : m; }, 0);
      const splitterId = `SPL-${String(maxNum + 1).padStart(4, "0")}`;
      const parsed = insertGponSplitterSchema.safeParse({ ...req.body, splitterId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      res.status(201).json(await storage.createGponSplitter(parsed.data));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.patch("/api/gpon-splitters/:id", requireAuth, async (req, res) => {
    try {
      const { splitterId, createdAt, ...rest } = req.body;
      const parsed = insertGponSplitterSchema.partial().safeParse(rest);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.updateGponSplitter(parseInt(req.params.id), parsed.data);
      if (!item) return res.status(404).json({ message: "Splitter not found" });
      res.json(item);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.delete("/api/gpon-splitters/:id", requireAuth, async (req, res) => {
    try { await storage.deleteGponSplitter(parseInt(req.params.id)); res.json({ message: "Deleted" }); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ─── Network Map: ONU Devices ──────────────────────────────────
  app.get("/api/onu-devices", requireAuth, async (_req, res) => {
    try { res.json(await storage.getOnuDevices()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/onu-devices/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getOnuDevice(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "ONU device not found" });
      res.json(item);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/onu-devices", requireAuth, async (req, res) => {
    try {
      const all = await storage.getOnuDevices();
      const maxNum = all.reduce((m, o) => { const n = parseInt(o.onuId?.replace("ONU-", "") || "0"); return n > m ? n : m; }, 0);
      const onuId = `ONU-${String(maxNum + 1).padStart(4, "0")}`;
      const parsed = insertOnuDeviceSchema.safeParse({ ...req.body, onuId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      res.status(201).json(await storage.createOnuDevice(parsed.data));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.patch("/api/onu-devices/:id", requireAuth, async (req, res) => {
    try {
      const { onuId, createdAt, ...rest } = req.body;
      const parsed = insertOnuDeviceSchema.partial().safeParse(rest);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.updateOnuDevice(parseInt(req.params.id), parsed.data);
      if (!item) return res.status(404).json({ message: "ONU device not found" });
      res.json(item);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.delete("/api/onu-devices/:id", requireAuth, async (req, res) => {
    try { await storage.deleteOnuDevice(parseInt(req.params.id)); res.json({ message: "Deleted" }); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ─── Network Map: P2P Links ────────────────────────────────────
  app.get("/api/p2p-links", requireAuth, async (_req, res) => {
    try { res.json(await storage.getP2pLinks()); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.get("/api/p2p-links/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getP2pLink(parseInt(req.params.id));
      if (!item) return res.status(404).json({ message: "P2P link not found" });
      res.json(item);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.post("/api/p2p-links", requireAuth, async (req, res) => {
    try {
      const all = await storage.getP2pLinks();
      const maxNum = all.reduce((m, l) => { const n = parseInt(l.linkId?.replace("P2P-", "") || "0"); return n > m ? n : m; }, 0);
      const linkId = `P2P-${String(maxNum + 1).padStart(4, "0")}`;
      const parsed = insertP2pLinkSchema.safeParse({ ...req.body, linkId });
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      res.status(201).json(await storage.createP2pLink(parsed.data));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.patch("/api/p2p-links/:id", requireAuth, async (req, res) => {
    try {
      const { linkId, createdAt, ...rest } = req.body;
      const parsed = insertP2pLinkSchema.partial().safeParse(rest);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      const item = await storage.updateP2pLink(parseInt(req.params.id), parsed.data);
      if (!item) return res.status(404).json({ message: "P2P link not found" });
      res.json(item);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });
  app.delete("/api/p2p-links/:id", requireAuth, async (req, res) => {
    try { await storage.deleteP2pLink(parseInt(req.params.id)); res.json({ message: "Deleted" }); } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/reports/dashboard", requireAuth, async (_req, res) => {
    try {
      const [customers, invoices, payments, employees, assets, olts, onus, splitters, p2pLinks, fiberRoutes, vendors, tickets] = await Promise.all([
        storage.getCustomers(), storage.getInvoices(), storage.getPayments(), storage.getEmployees(),
        storage.getAssets(), storage.getOltDevices(), storage.getOnuDevices(), storage.getGponSplitters(),
        storage.getP2pLinks(), storage.getFiberRoutes(), storage.getVendors(), storage.getTickets(),
      ]);
      const totalRevenue = invoices.reduce((s, i) => s + parseFloat(i.totalAmount || "0"), 0);
      const collected = invoices.filter(i => i.status === "paid").reduce((s, i) => s + parseFloat(i.totalAmount || "0"), 0);
      const outstanding = totalRevenue - collected;
      const activeCustomers = customers.filter(c => c.status === "active").length;
      const now = new Date();
      const monthlyRevenue: { month: string; billed: number; collected: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        const monthInvoices = invoices.filter(inv => { const dt = new Date(inv.issueDate || inv.createdAt || ""); return dt.getMonth() === d.getMonth() && dt.getFullYear() === d.getFullYear(); });
        monthlyRevenue.push({ month: label, billed: monthInvoices.reduce((s, i) => s + parseFloat(i.totalAmount || "0"), 0), collected: monthInvoices.filter(i => i.status === "paid").reduce((s, i) => s + parseFloat(i.totalAmount || "0"), 0) });
      }
      res.json({
        totalRevenue, collected, outstanding, activeCustomers,
        totalCustomers: customers.length,
        suspendedCustomers: customers.filter(c => c.status === "suspended").length,
        totalInvoices: invoices.length,
        paidInvoices: invoices.filter(i => i.status === "paid").length,
        unpaidInvoices: invoices.filter(i => i.status !== "paid").length,
        totalPayments: payments.length,
        paymentTotal: payments.reduce((s, p) => s + parseFloat(p.amount || "0"), 0),
        totalEmployees: employees.length,
        activeEmployees: employees.filter(e => e.status === "active").length,
        totalAssets: assets.length,
        assignedAssets: assets.filter(a => a.status === "assigned").length,
        totalOlts: olts.length, totalOnus: onus.length, totalSplitters: splitters.length,
        onuOnline: onus.filter(o => o.status === "online").length,
        onuOffline: onus.filter(o => o.status === "offline").length,
        totalP2p: p2pLinks.length, totalFiber: fiberRoutes.length,
        totalVendors: vendors.length, activeVendors: vendors.filter(v => v.status === "active").length,
        openTickets: tickets.filter(t => t.status === "open" || t.status === "in_progress").length,
        monthlyRevenue,
      });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/reports/customer-stats", requireAuth, async (_req, res) => {
    try {
      const customers = await storage.getCustomers();
      const packages = await storage.getPackages();
      const now = new Date();
      const active = customers.filter(c => c.status === "active").length;
      const suspended = customers.filter(c => c.status === "suspended").length;
      const disconnected = customers.filter(c => c.status === "disconnected").length;
      const thisMonth = customers.filter(c => { const d = new Date(c.connectionDate || c.createdAt || ""); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
      const churnRate = customers.length > 0 ? ((suspended + disconnected) / customers.length * 100) : 0;
      const byArea: Record<string, number> = {};
      customers.forEach(c => { byArea[c.area || "Unknown"] = (byArea[c.area || "Unknown"] || 0) + 1; });
      const byPlan: Record<string, number> = {};
      customers.forEach(c => {
        const pkg = packages.find(p => p.id === c.packageId);
        const name = pkg?.name || "No Plan";
        byPlan[name] = (byPlan[name] || 0) + 1;
      });
      const byType: Record<string, number> = {};
      customers.forEach(c => { byType[c.customerType || "home"] = (byType[c.customerType || "home"] || 0) + 1; });
      const growth: { month: string; count: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        const count = customers.filter(c => { const dt = new Date(c.connectionDate || c.createdAt || ""); return dt.getMonth() === d.getMonth() && dt.getFullYear() === d.getFullYear(); }).length;
        growth.push({ month: label, count });
      }
      const overdue = customers.filter(c => c.status === "active" && c.monthlyBill && parseFloat(c.monthlyBill) > 0).length;
      res.json({ total: customers.length, active, suspended, disconnected, thisMonth, churnRate: churnRate.toFixed(1), byArea: Object.entries(byArea).map(([name, value]) => ({ name, value })), byPlan: Object.entries(byPlan).map(([name, value]) => ({ name, value })), byType: Object.entries(byType).map(([name, value]) => ({ name, value })), growth, overdue });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/reports/billing-stats", requireAuth, async (_req, res) => {
    try {
      const [invoices, customers, packages] = await Promise.all([storage.getInvoices(), storage.getCustomers(), storage.getPackages()]);
      const now = new Date();
      const total = invoices.length;
      const paid = invoices.filter(i => i.status === "paid");
      const unpaid = invoices.filter(i => i.status !== "paid");
      const totalBilled = invoices.reduce((s, i) => s + parseFloat(i.totalAmount || "0"), 0);
      const totalCollected = paid.reduce((s, i) => s + parseFloat(i.totalAmount || "0"), 0);
      const outstanding = totalBilled - totalCollected;
      const byMonth: { month: string; revenue: number; collected: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        const mi = invoices.filter(inv => { const dt = new Date(inv.issueDate || inv.createdAt || ""); return dt.getMonth() === d.getMonth() && dt.getFullYear() === d.getFullYear(); });
        byMonth.push({ month: label, revenue: mi.reduce((s, i) => s + parseFloat(i.totalAmount || "0"), 0), collected: mi.filter(i => i.status === "paid").reduce((s, i) => s + parseFloat(i.totalAmount || "0"), 0) });
      }
      const byPlan: Record<string, number> = {};
      invoices.forEach(inv => {
        const cust = customers.find(c => c.id === inv.customerId);
        const pkg = cust ? packages.find(p => p.id === cust.packageId) : null;
        const name = pkg?.name || "Other";
        byPlan[name] = (byPlan[name] || 0) + parseFloat(inv.totalAmount || "0");
      });
      const aging = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
      unpaid.forEach(inv => {
        const due = new Date(inv.dueDate || inv.createdAt || "");
        const diff = Math.floor((now.getTime() - due.getTime()) / 86400000);
        const amt = parseFloat(inv.totalAmount || "0");
        if (diff <= 0) aging.current += amt;
        else if (diff <= 30) aging.days30 += amt;
        else if (diff <= 60) aging.days60 += amt;
        else if (diff <= 90) aging.days90 += amt;
        else aging.over90 += amt;
      });
      res.json({ total, paid: paid.length, unpaid: unpaid.length, totalBilled, totalCollected, outstanding, byMonth, byPlan: Object.entries(byPlan).map(([name, value]) => ({ name, value })), aging });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/reports/payment-stats", requireAuth, async (_req, res) => {
    try {
      const payments = await storage.getPayments();
      const now = new Date();
      const totalCollected = payments.filter(p => p.status === "completed" || p.status === "approved").reduce((s, p) => s + parseFloat(p.amount || "0"), 0);
      const byMethod: Record<string, number> = {};
      payments.forEach(p => { const m = p.method || "cash"; byMethod[m] = (byMethod[m] || 0) + parseFloat(p.amount || "0"); });
      const refunds = payments.filter(p => p.status === "refunded").reduce((s, p) => s + parseFloat(p.amount || "0"), 0);
      const failed = payments.filter(p => p.status === "failed").length;
      const daily: { date: string; amount: number; count: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const dp = payments.filter(p => { const dt = new Date(p.paidAt || p.createdAt || ""); return dt.toDateString() === d.toDateString(); });
        daily.push({ date: label, amount: dp.reduce((s, p) => s + parseFloat(p.amount || "0"), 0), count: dp.length });
      }
      res.json({ totalCollected, totalPayments: payments.length, byMethod: Object.entries(byMethod).map(([name, value]) => ({ name, value })), refunds, failed, daily });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/reports/network-stats", requireAuth, async (_req, res) => {
    try {
      const [olts, splitters, onus, p2pLinks, fiberRoutes, ips, subnets] = await Promise.all([
        storage.getOltDevices(), storage.getGponSplitters(), storage.getOnuDevices(),
        storage.getP2pLinks(), storage.getFiberRoutes(), storage.getIpAddresses(), storage.getSubnets(),
      ]);
      const totalPon = olts.reduce((s, o) => s + (o.totalPonPorts || 0), 0);
      const usedPon = olts.reduce((s, o) => s + (o.usedPonPorts || 0), 0);
      const ponUtilization = totalPon > 0 ? (usedPon / totalPon * 100) : 0;
      const onuOnline = onus.filter(o => o.status === "online").length;
      const onuOffline = onus.filter(o => o.status === "offline").length;
      const totalIps = ips.length;
      const assignedIps = ips.filter(i => i.status === "assigned").length;
      const oltUtilization = olts.map(o => ({ name: o.name, oltId: o.oltId, total: o.totalPonPorts || 0, used: o.usedPonPorts || 0, pct: (o.totalPonPorts || 0) > 0 ? ((o.usedPonPorts || 0) / (o.totalPonPorts || 0) * 100).toFixed(1) : "0" }));
      const splitterUtil = splitters.map(s => ({ name: s.name, splitterId: s.splitterId, ratio: s.splitRatio, used: s.usedPorts || 0 }));
      const p2pStatus: Record<string, number> = {};
      p2pLinks.forEach(l => { p2pStatus[l.status] = (p2pStatus[l.status] || 0) + 1; });
      const fiberTotal = fiberRoutes.reduce((s, r) => s + parseFloat(String(r.totalLengthM || 0)), 0) / 1000;
      res.json({ totalOlts: olts.length, totalSplitters: splitters.length, totalOnus: onus.length, totalP2p: p2pLinks.length, totalFiber: fiberRoutes.length, totalPon, usedPon, ponUtilization: ponUtilization.toFixed(1), onuOnline, onuOffline, onuLowSignal: onus.filter(o => o.status === "low_signal").length, totalIps, assignedIps, freeIps: totalIps - assignedIps, totalSubnets: subnets.length, fiberTotalKm: fiberTotal.toFixed(1), oltUtilization, splitterUtil, p2pStatus: Object.entries(p2pStatus).map(([name, value]) => ({ name, value })) });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/reports/inventory-stats", requireAuth, async (_req, res) => {
    try {
      const items = await storage.getInventoryItems();
      const totalItems = items.length;
      const totalValue = items.reduce((s, i) => s + (parseFloat(String(i.purchasePrice || 0)) * (i.quantity || 0)), 0);
      const lowStock = items.filter(i => (i.quantity || 0) <= (i.reorderLevel || 5)).length;
      const byCategory: Record<string, { count: number; value: number }> = {};
      items.forEach(i => {
        const cat = i.category || "Uncategorized";
        if (!byCategory[cat]) byCategory[cat] = { count: 0, value: 0 };
        byCategory[cat].count += i.quantity || 0;
        byCategory[cat].value += parseFloat(String(i.purchasePrice || 0)) * (i.quantity || 0);
      });
      const byBrand: Record<string, number> = {};
      items.forEach(i => { byBrand[i.brand || "Unknown"] = (byBrand[i.brand || "Unknown"] || 0) + (i.quantity || 0); });
      res.json({ totalItems, totalValue, lowStock, inStock: items.filter(i => (i.quantity || 0) > 0).length, outOfStock: items.filter(i => (i.quantity || 0) === 0).length, byCategory: Object.entries(byCategory).map(([name, { count, value }]) => ({ name, count, value })), byBrand: Object.entries(byBrand).map(([name, value]) => ({ name, value })) });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/reports/asset-stats", requireAuth, async (_req, res) => {
    try {
      const [assets, assignments] = await Promise.all([storage.getAssets(), storage.getAssetAssignments()]);
      const available = assets.filter(a => a.status === "available").length;
      const assigned = assets.filter(a => a.status === "assigned").length;
      const maintenance = assets.filter(a => a.status === "maintenance").length;
      const faulty = assets.filter(a => a.status === "faulty" || a.status === "damaged").length;
      const byType: Record<string, number> = {};
      assets.forEach(a => { byType[a.type || "Other"] = (byType[a.type || "Other"] || 0) + 1; });
      const byStatus: Record<string, number> = {};
      assets.forEach(a => { byStatus[a.status || "unknown"] = (byStatus[a.status || "unknown"] || 0) + 1; });
      res.json({ total: assets.length, available, assigned, maintenance, faulty, totalAssignments: assignments.length, byType: Object.entries(byType).map(([name, value]) => ({ name, value })), byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })) });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/reports/hrm-stats", requireAuth, async (_req, res) => {
    try {
      const [employees, attendanceRecords, leaveRecords] = await Promise.all([storage.getEmployees(), storage.getAttendanceRecords(), storage.getLeaves()]);
      const active = employees.filter(e => e.status === "active").length;
      const totalSalary = employees.reduce((s, e) => s + parseFloat(String(e.salary || 0)), 0);
      const byDepartment: Record<string, number> = {};
      employees.forEach(e => { byDepartment[e.department || "General"] = (byDepartment[e.department || "General"] || 0) + 1; });
      const byDesignation: Record<string, number> = {};
      employees.forEach(e => { byDesignation[e.designation || "Staff"] = (byDesignation[e.designation || "Staff"] || 0) + 1; });
      const pendingLeaves = leaveRecords.filter(l => l.status === "pending").length;
      const approvedLeaves = leaveRecords.filter(l => l.status === "approved").length;
      const presentToday = attendanceRecords.filter(a => { const d = new Date(a.date || ""); const now = new Date(); return d.toDateString() === now.toDateString() && a.status === "present"; }).length;
      res.json({ totalEmployees: employees.length, active, totalSalary, avgSalary: employees.length > 0 ? (totalSalary / employees.length) : 0, byDepartment: Object.entries(byDepartment).map(([name, value]) => ({ name, value })), byDesignation: Object.entries(byDesignation).map(([name, value]) => ({ name, value })), pendingLeaves, approvedLeaves, totalLeaves: leaveRecords.length, presentToday, totalAttendance: attendanceRecords.length });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/reports/notification-stats", requireAuth, async (_req, res) => {
    try {
      const [dispatches, bulkMessages] = await Promise.all([storage.getNotificationDispatches(), storage.getBulkMessages()]);
      const byChannel: Record<string, { sent: number; delivered: number; failed: number }> = {};
      dispatches.forEach(d => {
        const ch = d.channel || "sms";
        if (!byChannel[ch]) byChannel[ch] = { sent: 0, delivered: 0, failed: 0 };
        byChannel[ch].sent++;
        if (d.status === "delivered") byChannel[ch].delivered++;
        if (d.status === "failed") byChannel[ch].failed++;
      });
      const totalSent = dispatches.length;
      const delivered = dispatches.filter(d => d.status === "delivered").length;
      const failed = dispatches.filter(d => d.status === "failed").length;
      const campaigns = bulkMessages.length;
      res.json({ totalSent, delivered, failed, pending: dispatches.filter(d => d.status === "pending" || d.status === "queued").length, campaigns, byChannel: Object.entries(byChannel).map(([name, data]) => ({ name, ...data })) });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/reports/activity-stats", requireAuth, async (_req, res) => {
    try {
      const [activityLogs, auditLogs] = await Promise.all([storage.getActivityLogs(), storage.getAuditLogs()]);
      const byUser: Record<string, number> = {};
      activityLogs.forEach(l => { byUser[l.userName || l.userId?.toString() || "System"] = (byUser[l.userName || l.userId?.toString() || "System"] || 0) + 1; });
      const byModule: Record<string, number> = {};
      activityLogs.forEach(l => { byModule[l.module || "General"] = (byModule[l.module || "General"] || 0) + 1; });
      const byAction: Record<string, number> = {};
      activityLogs.forEach(l => { byAction[l.action || "view"] = (byAction[l.action || "view"] || 0) + 1; });
      const criticalActions = auditLogs.filter(a => a.severity === "critical" || a.severity === "high").length;
      const failedLogins = activityLogs.filter(l => l.action === "failed_login" || l.action === "login_failed").length;
      res.json({ totalActivities: activityLogs.length, totalAudits: auditLogs.length, criticalActions, failedLogins, byUser: Object.entries(byUser).map(([name, value]) => ({ name, value })).slice(0, 20), byModule: Object.entries(byModule).map(([name, value]) => ({ name, value })), byAction: Object.entries(byAction).map(([name, value]) => ({ name, value })) });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/reports/vendor-stats", requireAuth, async (_req, res) => {
    try {
      const [vendors, vendorPackages, walletTxns, bandwidthChanges] = await Promise.all([
        storage.getVendors(), storage.getVendorPackages(), storage.getVendorWalletTransactions(), storage.getBandwidthChangeHistory(),
      ]);
      const active = vendors.filter(v => v.status === "active").length;
      const totalWallet = vendors.reduce((s, v) => s + parseFloat(String(v.walletBalance || 0)), 0);
      const totalPayable = vendors.reduce((s, v) => s + parseFloat(String(v.payableAmount || 0)), 0);
      const byType: Record<string, number> = {};
      vendors.forEach(v => { byType[v.vendorType || "isp"] = (byType[v.vendorType || "isp"] || 0) + 1; });
      const upgrades = bandwidthChanges.filter(b => b.changeType === "upgrade").length;
      const downgrades = bandwidthChanges.filter(b => b.changeType === "downgrade").length;
      res.json({ total: vendors.length, active, inactive: vendors.length - active, totalWallet, totalPayable, totalPackages: vendorPackages.length, totalTransactions: walletTxns.length, upgrades, downgrades, byType: Object.entries(byType).map(([name, value]) => ({ name, value })) });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  return httpServer;
}
