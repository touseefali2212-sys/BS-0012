import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, decimal, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("staff"),
  avatar: text("avatar"),
  isActive: boolean("is_active").notNull().default(true),
  employeeId: integer("employee_id"),
  department: text("department"),
  branch: text("branch"),
  loginType: text("login_type").notNull().default("both"),
  accountStatus: text("account_status").notNull().default("active"),
  maxLoginAttempts: integer("max_login_attempts").notNull().default(5),
  deviceRestriction: text("device_restriction").notNull().default("multiple"),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  forcePasswordChange: boolean("force_password_change").notNull().default(false),
  accountExpiryDate: text("account_expiry_date"),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  cnic: text("cnic"),
  address: text("address"),
  area: text("area"),
  customerType: text("customer_type").notNull().default("home"),
  packageId: integer("package_id"),
  status: text("status").notNull().default("active"),
  connectionDate: text("connection_date"),
  monthlyBill: decimal("monthly_bill", { precision: 10, scale: 2 }),
  notes: text("notes"),
  isRecurring: boolean("is_recurring").notNull().default(true),
  recurringDay: integer("recurring_day").default(1),
  nextBillingDate: text("next_billing_date"),
  lastBilledDate: text("last_billed_date"),
  gender: text("gender"),
  occupation: text("occupation"),
  dateOfBirth: text("date_of_birth"),
  fatherName: text("father_name"),
  motherName: text("mother_name"),
  nidNumber: text("nid_number"),
  registrationFormNo: text("registration_form_no"),
  profilePicture: text("profile_picture"),
  nidPicture: text("nid_picture"),
  registrationFormPicture: text("registration_form_picture"),
  mapLatitude: text("map_latitude"),
  mapLongitude: text("map_longitude"),
  phoneNumber: text("phone_number"),
  district: text("district"),
  upazilaThana: text("upazila_thana"),
  roadNumber: text("road_number"),
  houseNumber: text("house_number"),
  presentAddress: text("present_address"),
  permanentAddress: text("permanent_address"),
  facebookUrl: text("facebook_url"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  server: text("server"),
  protocolType: text("protocol_type"),
  zone: text("zone"),
  subzone: text("subzone"),
  box: text("box"),
  connectionType: text("connection_type"),
  cableRequirement: text("cable_requirement"),
  fiberCode: text("fiber_code"),
  numberOfCore: text("number_of_core"),
  coreColor: text("core_color"),
  device: text("device"),
  deviceMacSerial: text("device_mac_serial"),
  macAddress: text("mac_address"),
  vendorId: integer("vendor_id"),
  purchaseDate: text("purchase_date"),
  profile: text("profile"),
  billingStatus: text("billing_status").default("Inactive"),
  usernameIp: text("username_ip"),
  password: text("password"),
  joiningDate: text("joining_date"),
  billingStartMonth: text("billing_start_month"),
  expireDate: text("expire_date"),
  referenceBy: text("reference_by"),
  isVipClient: boolean("is_vip_client").default(false),
  connectedBy: text("connected_by"),
  assignTo: text("assign_to"),
  affiliator: text("affiliator"),
  sendSmsToEmployee: boolean("send_sms_to_employee").default(false),
  sendGreetingSms: boolean("send_greeting_sms").default(false),
  city: text("city"),
  branch: text("branch"),
  cnicBackPicture: text("cnic_back_picture"),
  deviceModel: text("device_model"),
  deviceOwnedBy: text("device_owned_by").default("Company"),
  deviceType: text("device_type").default(""),
  deviceDetail: text("device_detail").default(""),
  deviceCharges: decimal("device_charges", { precision: 10, scale: 2 }).default("0"),
  additionalDevices: text("additional_devices").default("[]"),
  installationCharges: decimal("installation_charges", { precision: 10, scale: 2 }).default("0"),
  discountOnInstallation: decimal("discount_on_installation", { precision: 10, scale: 2 }).default("0"),
  finalInstallationCharges: decimal("final_installation_charges", { precision: 10, scale: 2 }).default("0"),
  packageBill: decimal("package_bill", { precision: 10, scale: 2 }).default("0"),
  discountOnPackage: decimal("discount_on_package", { precision: 10, scale: 2 }).default("0"),
  grandTotal: decimal("grand_total", { precision: 10, scale: 2 }).default("0"),
  additionalPackages: text("additional_packages").default("[]"),
  staticIpEnabled: boolean("static_ip_enabled").default(false),
  staticIpMrc: decimal("static_ip_mrc", { precision: 10, scale: 2 }).default("0"),
  installmentEnabled: boolean("installment_enabled").default(false),
  installmentType: text("installment_type").default(""),
  installmentTotalAmount: decimal("installment_total_amount", { precision: 10, scale: 2 }).default("0"),
  installmentMonths: integer("installment_months").default(0),
  installmentMonthlyAmount: decimal("installment_monthly_amount", { precision: 10, scale: 2 }).default("0"),
  installmentPaidMonths: integer("installment_paid_months").default(0),
  installmentNote: text("installment_note").default(""),
});

export const customerTypes = pgTable("customer_types", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
  icon: text("icon").default("users"),
  color: text("color").default("blue"),
  isDefault: boolean("is_default").default(false),
  status: text("status").notNull().default("active"),
  billingCycle: text("billing_cycle").default("monthly"),
  lateFeePercentage: decimal("late_fee_percentage", { precision: 5, scale: 2 }).default("0"),
  gracePeriodDays: integer("grace_period_days").default(7),
  requiresCnic: boolean("requires_cnic").default(false),
  requiresNtn: boolean("requires_ntn").default(false),
  autoSuspendDays: integer("auto_suspend_days").default(30),
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertCustomerTypeSchema = createInsertSchema(customerTypes).omit({ id: true, createdAt: true });
export type InsertCustomerType = z.infer<typeof insertCustomerTypeSchema>;
export type CustomerType = typeof customerTypes.$inferSelect;

export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  serviceType: text("service_type").notNull().default("internet"),
  speed: text("speed"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  billingCycle: text("billing_cycle").notNull().default("monthly"),
  dataLimit: text("data_limit"),
  channels: text("channels"),
  features: text("features"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  vendorId: integer("vendor_id"),
  whTax: decimal("wh_tax", { precision: 5, scale: 2 }),
  aitTax: decimal("ait_tax", { precision: 5, scale: 2 }),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: integer("customer_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  dueDate: text("due_date").notNull(),
  issueDate: text("issue_date").notNull(),
  paidDate: text("paid_date"),
  description: text("description"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  serviceType: text("service_type"),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: text("ticket_number").notNull().unique(),
  customerId: integer("customer_id").notNull(),
  subject: text("subject").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  category: text("category").notNull().default("general"),
  assignedTo: text("assigned_to"),
  createdAt: text("created_at").notNull(),
  resolvedAt: text("resolved_at"),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  module: text("module").notNull(),
  description: text("description").notNull(),
  userId: integer("user_id"),
  createdAt: text("created_at").notNull(),
});

export const areas = pgTable("areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mainArea: text("main_area"),
  city: text("city").notNull(),
  zone: text("zone"),
  branch: text("branch"),
  totalCustomers: integer("total_customers").default(0),
  totalHousesOffices: integer("total_houses_offices").default(0),
  status: text("status").notNull().default("active"),
});

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  vendorType: text("vendor_type").notNull().default("bandwidth"),
  contactPerson: text("contact_person"),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  serviceType: text("service_type").notNull(),
  ntn: text("ntn"),
  bankAccount: text("bank_account"),
  bankName: text("bank_name"),
  bankAccountTitle: text("bank_account_title"),
  bankAccountNumber: text("bank_account_number"),
  bankBranchCode: text("bank_branch_code"),
  slaLevel: text("sla_level").default("standard"),
  totalBandwidth: text("total_bandwidth"),
  usedBandwidth: text("used_bandwidth"),
  bandwidthCost: decimal("bandwidth_cost", { precision: 10, scale: 2 }),
  contractStartDate: text("contract_start_date"),
  contractEndDate: text("contract_end_date"),
  walletBalance: decimal("wallet_balance", { precision: 12, scale: 2 }).default("0"),
  lastRechargeDate: text("last_recharge_date"),
  panelUrl: text("panel_url"),
  panelUsername: text("panel_username"),
  payableAmount: decimal("payable_amount", { precision: 12, scale: 2 }).default("0"),
  city: text("city"),
  status: text("status").notNull().default("active"),
});

export const resellerTypes = pgTable("reseller_types", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
  icon: text("icon").default("shield"),
  color: text("color").default("blue"),
  isDefault: boolean("is_default").default(false),
  status: text("status").notNull().default("active"),
  commissionModel: text("commission_model").default("percentage"),
  defaultCommissionRate: decimal("default_commission_rate", { precision: 5, scale: 2 }).default("10"),
  territoryExclusive: boolean("territory_exclusive").default(false),
  allowSubResellers: boolean("allow_sub_resellers").default(false),
  allowCustomBranding: boolean("allow_custom_branding").default(false),
  allowApiAccess: boolean("allow_api_access").default(false),
  walletEnabled: boolean("wallet_enabled").default(true),
  minCustomers: integer("min_customers").default(0),
  maxCustomers: integer("max_customers").default(0),
  features: text("features"),
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertResellerTypeSchema = createInsertSchema(resellerTypes).omit({ id: true, createdAt: true });
export type InsertResellerType = z.infer<typeof insertResellerTypeSchema>;
export type ResellerType = typeof resellerTypes.$inferSelect;

export const resellers = pgTable("resellers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  resellerType: text("reseller_type").notNull().default("authorized_dealer"),
  gender: text("gender"),
  occupation: text("occupation"),
  dateOfBirth: text("date_of_birth"),
  fatherName: text("father_name"),
  contactName: text("contact_name"),
  phone: text("phone").notNull(),
  secondaryPhone: text("secondary_phone"),
  email: text("email"),
  cnic: text("cnic"),
  ntn: text("ntn"),
  registrationFormNo: text("registration_form_no"),
  address: text("address"),
  city: text("city"),
  area: text("area"),
  territory: text("territory"),
  profilePicture: text("profile_picture"),
  cnicPicture: text("cnic_picture"),
  registrationFormPicture: text("registration_form_picture"),
  vendorId: integer("vendor_id"),
  packageId: integer("package_id"),
  assignedPackages: text("assigned_packages"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("10"),
  commissionPaymentMethod: text("commission_payment_method").default("wallet"),
  commissionPaymentFrequency: text("commission_payment_frequency").default("monthly"),
  walletBalance: decimal("wallet_balance", { precision: 12, scale: 2 }).default("0"),
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }).default("0"),
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }).default("0"),
  totalCustomers: integer("total_customers").default(0),
  agreementStartDate: text("agreement_start_date"),
  agreementEndDate: text("agreement_end_date"),
  agreementType: text("agreement_type").default("standard"),
  autoRenewal: boolean("auto_renewal").default(false),
  joinDate: text("join_date"),
  uplinkType: text("uplink_type"),
  uplink: text("uplink"),
  exchangeTowerPopName: text("exchange_tower_pop_name"),
  portId: text("port_id"),
  vlanId: text("vlan_id"),
  media: text("media"),
  vendorPanelAllowed: boolean("vendor_panel_allowed").default(false),
  panelUrl: text("panel_url"),
  panelUsername: text("panel_username"),
  panelPassword: text("panel_password"),
  assignedVendorPanels: text("assigned_vendor_panels"),
  vlanIdAllowed: boolean("vlan_id_allowed").default(false),
  vlanIdNote: text("vlan_id_note"),
  connectionType: text("connection_type"),
  bandwidthPlan: text("bandwidth_plan"),
  ipAssignment: text("ip_assignment").default("dynamic"),
  nasId: text("nas_id"),
  serviceZone: text("service_zone"),
  bankName: text("bank_name"),
  bankAccountTitle: text("bank_account_title"),
  bankAccountNumber: text("bank_account_number"),
  bankBranchCode: text("bank_branch_code"),
  billingCycle: text("billing_cycle").default("monthly"),
  paymentMethod: text("payment_method").default("cash"),
  openingBalance: decimal("opening_balance", { precision: 12, scale: 2 }).default("0"),
  supportLevel: text("support_level").default("standard"),
  maxCustomerLimit: integer("max_customer_limit").default(0),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
});

export const accountTypes = pgTable("account_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  category: text("category").notNull(),
  normalBalance: text("normal_balance").notNull().default("debit"),
  parentId: integer("parent_id"),
  description: text("description"),
  includeTrialBalance: boolean("include_trial_balance").notNull().default(true),
  includeProfitLoss: boolean("include_profit_loss").notNull().default(false),
  includeBalanceSheet: boolean("include_balance_sheet").notNull().default(false),
  allowSubAccounts: boolean("allow_sub_accounts").notNull().default(true),
  allowDirectPosting: boolean("allow_direct_posting").notNull().default(true),
  isSystemDefault: boolean("is_system_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at"),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  accountTypeId: integer("account_type_id"),
  parentId: integer("parent_id"),
  description: text("description"),
  normalBalance: text("normal_balance").notNull().default("debit"),
  openingBalance: decimal("opening_balance", { precision: 14, scale: 2 }).default("0"),
  openingBalanceDate: text("opening_balance_date"),
  balance: decimal("balance", { precision: 14, scale: 2 }).default("0"),
  currency: text("currency").notNull().default("PKR"),
  linkCustomer: boolean("link_customer").notNull().default(false),
  linkVendor: boolean("link_vendor").notNull().default(false),
  linkPayroll: boolean("link_payroll").notNull().default(false),
  linkResellerWallet: boolean("link_reseller_wallet").notNull().default(false),
  linkCommission: boolean("link_commission").notNull().default(false),
  linkExpense: boolean("link_expense").notNull().default(false),
  linkBankReconciliation: boolean("link_bank_reconciliation").notNull().default(false),
  allowDirectPosting: boolean("allow_direct_posting").notNull().default(true),
  systemGeneratedOnly: boolean("system_generated_only").notNull().default(false),
  lockAfterTransactions: boolean("lock_after_transactions").notNull().default(false),
  taxApplicable: boolean("tax_applicable").notNull().default(false),
  branch: text("branch"),
  reportingGroup: text("reporting_group"),
  categoryTag: text("category_tag"),
  bankName: text("bank_name"),
  bankAccountTitle: text("bank_account_title"),
  bankAccountNumber: text("bank_account_number"),
  bankBranchCode: text("bank_branch_code"),
  bankIban: text("bank_iban"),
  bankSwiftCode: text("bank_swift_code"),
  bankAddress: text("bank_address"),
  isActive: boolean("is_active").notNull().default(true),
  isSystemDefault: boolean("is_system_default").notNull().default(false),
  createdAt: text("created_at").default(sql`now()`),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  txnId: text("txn_id").notNull().unique(),
  type: text("type").notNull(),
  category: text("category"),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 14, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 14, scale: 2 }).default("0"),
  netAmount: decimal("net_amount", { precision: 14, scale: 2 }),
  debitAccountId: integer("debit_account_id"),
  creditAccountId: integer("credit_account_id"),
  accountId: integer("account_id"),
  customerId: integer("customer_id"),
  vendorId: integer("vendor_id"),
  invoiceId: integer("invoice_id"),
  paymentMethod: text("payment_method"),
  reference: text("reference"),
  chequeNumber: text("cheque_number"),
  transactionRef: text("transaction_ref"),
  description: text("description"),
  attachment: text("attachment"),
  date: text("date").notNull(),
  status: text("status").notNull().default("completed"),
  branch: text("branch"),
  costCenter: text("cost_center"),
  autoAdjustReceivable: boolean("auto_adjust_receivable").notNull().default(false),
  allowPartialPayment: boolean("allow_partial_payment").notNull().default(false),
  sendNotification: boolean("send_notification").notNull().default(false),
  lockAfterSave: boolean("lock_after_save").notNull().default(false),
  isRecurring: boolean("is_recurring").notNull().default(false),
  requireApproval: boolean("require_approval").notNull().default(false),
  createdBy: text("created_by"),
  createdAt: text("created_at").default(sql`now()`),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  year: integer("year").notNull(),
  period: text("period").notNull().default("annual"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalAmount: decimal("total_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  allocatedAmount: decimal("allocated_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  usedAmount: decimal("used_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  branch: text("branch"),
  allocationMethod: text("allocation_method").notNull().default("by_account"),
  status: text("status").notNull().default("draft"),
  softWarningPercent: integer("soft_warning_percent").default(80),
  hardStopPercent: integer("hard_stop_percent").default(100),
  requireApprovalOverBudget: boolean("require_approval_over_budget").notNull().default(false),
  emailNotification: boolean("email_notification").notNull().default(false),
  dashboardAlert: boolean("dashboard_alert").notNull().default(true),
  description: text("description"),
  createdBy: text("created_by"),
  createdAt: text("created_at").default(sql`now()`),
});

export const budgetAllocations = pgTable("budget_allocations", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id").notNull(),
  accountId: integer("account_id"),
  department: text("department"),
  costCenter: text("cost_center"),
  allocatedAmount: decimal("allocated_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  usedAmount: decimal("used_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`now()`),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  taskCode: text("task_code"),
  title: text("title").notNull(),
  type: text("type").notNull().default("general"),
  description: text("description"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("pending"),
  assignedTo: text("assigned_to"),
  supervisor: text("supervisor"),
  department: text("department"),
  branch: text("branch"),
  customerId: integer("customer_id"),
  projectId: integer("project_id"),
  startDate: text("start_date"),
  dueDate: text("due_date"),
  reminderDate: text("reminder_date"),
  completedDate: text("completed_date"),
  estimatedHours: text("estimated_hours"),
  progress: integer("progress").default(0),
  checklist: text("checklist"),
  internalNotes: text("internal_notes"),
  customerNotes: text("customer_notes"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`now()`),
});

export const assetTypes = pgTable("asset_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  description: text("description"),
  codePrefix: text("code_prefix"),
  defaultLocationType: text("default_location_type"),
  warrantyDefaultPeriod: integer("warranty_default_period"),
  expectedLifespan: integer("expected_lifespan"),
  depreciationMethod: text("depreciation_method").default("straight_line"),
  depreciationRate: decimal("depreciation_rate", { precision: 5, scale: 2 }),
  maintenanceRequired: boolean("maintenance_required").notNull().default(false),
  criticalAsset: boolean("critical_asset").notNull().default(false),
  trackSerialNumber: boolean("track_serial_number").notNull().default(true),
  trackMacAddress: boolean("track_mac_address").notNull().default(false),
  trackStockQuantity: boolean("track_stock_quantity").notNull().default(false),
  trackAssignment: boolean("track_assignment").notNull().default(true),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  assetTag: text("asset_tag").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  category: text("category"),
  brand: text("brand"),
  model: text("model"),
  serialNumber: text("serial_number"),
  macAddress: text("mac_address"),
  vendorId: integer("vendor_id"),
  purchaseDate: text("purchase_date"),
  purchaseCost: decimal("purchase_cost", { precision: 10, scale: 2 }),
  warrantyEnd: text("warranty_end"),
  location: text("location"),
  locationType: text("location_type"),
  assignedTo: text("assigned_to"),
  assignedType: text("assigned_type"),
  installedBy: text("installed_by"),
  installationDate: text("installation_date"),
  depreciationMethod: text("depreciation_method"),
  depreciationRate: decimal("depreciation_rate", { precision: 5, scale: 2 }),
  bookValue: decimal("book_value", { precision: 10, scale: 2 }),
  ipAddress: text("ip_address"),
  vlan: text("vlan"),
  firmwareVersion: text("firmware_version"),
  lastMaintenanceDate: text("last_maintenance_date"),
  nextMaintenanceDate: text("next_maintenance_date"),
  invoiceReference: text("invoice_reference"),
  notes: text("notes"),
  status: text("status").notNull().default("available"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const assetTransfers = pgTable("asset_transfers", {
  id: serial("id").primaryKey(),
  transferId: text("transfer_id").notNull().unique(),
  assetId: integer("asset_id").notNull(),
  assetName: text("asset_name"),
  assetTag: text("asset_tag"),
  assetType: text("asset_type"),
  transferType: text("transfer_type").notNull(),
  fromLocation: text("from_location").notNull(),
  fromLocationType: text("from_location_type"),
  toLocation: text("to_location").notNull(),
  toLocationType: text("to_location_type"),
  assignedTo: text("assigned_to"),
  requestedBy: text("requested_by"),
  approvedBy: text("approved_by"),
  receivedBy: text("received_by"),
  reason: text("reason"),
  priority: text("priority").notNull().default("normal"),
  requireApproval: boolean("require_approval").notNull().default(true),
  isUrgent: boolean("is_urgent").notNull().default(false),
  notifyReceiver: boolean("notify_receiver").notNull().default(true),
  expectedDeliveryDate: text("expected_delivery_date"),
  dispatchDate: text("dispatch_date"),
  deliveryDate: text("delivery_date"),
  conditionOnTransfer: text("condition_on_transfer"),
  conditionOnReceive: text("condition_on_receive"),
  notes: text("notes"),
  rejectionReason: text("rejection_reason"),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  itemName: text("item_name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(0),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  reorderLevel: integer("reorder_level").default(10),
  vendorId: integer("vendor_id"),
  location: text("location"),
  description: text("description"),
  status: text("status").notNull().default("in_stock"),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  empCode: text("emp_code").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  cnic: text("cnic"),
  department: text("department").notNull(),
  designation: text("designation").notNull(),
  joinDate: text("join_date"),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  bankAccount: text("bank_account"),
  address: text("address"),
  status: text("status").notNull().default("active"),
  gender: text("gender"),
  dateOfBirth: text("date_of_birth"),
  maritalStatus: text("marital_status"),
  fatherName: text("father_name"),
  guardianPhone: text("guardian_phone"),
  bloodGroup: text("blood_group"),
  religion: text("religion"),
  nationality: text("nationality"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  city: text("city"),
  country: text("country"),
  bankName: text("bank_name"),
  bankBranch: text("bank_branch"),
  salaryType: text("salary_type").default("monthly"),
  employmentType: text("employment_type").default("full_time"),
  allowances: text("allowances"),
  deductions: text("deductions"),
  qualifications: text("qualifications"),
  experiences: text("experiences"),
  shift: text("shift"),
  reportingTo: text("reporting_to"),
  probationEndDate: text("probation_end_date"),
  confirmationDate: text("confirmation_date"),
  workLocation: text("work_location"),
  profilePicture: text("profile_picture"),
  documents: text("documents"),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: text("permissions"),
  isSystem: boolean("is_system").notNull().default(false),
  status: text("status").notNull().default("active"),
  department: text("department"),
  reportsTo: text("reports_to"),
  branch: text("branch"),
  roleLevel: text("role_level").default("level_4"),
  salaryGrade: text("salary_grade"),
  commissionEligible: boolean("commission_eligible").default(false),
  incentiveTarget: boolean("incentive_target").default(false),
  defaultAllowances: text("default_allowances"),
  defaultDeductions: text("default_deductions"),
});

export const employeeTypes = pgTable("employee_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull().default("full_time"),
  defaultWorkingHours: decimal("default_working_hours", { precision: 4, scale: 1 }).default("8"),
  salaryStructure: text("salary_structure").notNull().default("fixed"),
  eligibleForBonus: boolean("eligible_for_bonus").default(true),
  eligibleForCommission: boolean("eligible_for_commission").default(false),
  eligibleForOvertime: boolean("eligible_for_overtime").default(true),
  probationPeriodDays: integer("probation_period_days").default(0),
  leavePolicy: text("leave_policy"),
  description: text("description"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertEmployeeTypeSchema = createInsertSchema(employeeTypes).omit({ id: true, createdAt: true });
export type InsertEmployeeType = z.infer<typeof insertEmployeeTypeSchema>;
export type EmployeeType = typeof employeeTypes.$inferSelect;

export const companySettings = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  registrationNo: text("registration_no"),
  ntn: text("ntn"),
  address: text("address"),
  address2: text("address_2"),
  city: text("city"),
  phone: text("phone"),
  phone2: text("phone_2"),
  mobile1: text("mobile_1"),
  mobile2: text("mobile_2"),
  email: text("email"),
  website: text("website"),
  logo: text("logo"),
  currency: text("currency").default("PKR"),
  currencySymbol: text("currency_symbol").default("Rs"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("17"),
  country: text("country").default("Pakistan"),
  countryCode: text("country_code").default("PK"),
  dialCode: text("dial_code").default("+92"),
  language: text("language").default("en"),
  timezone: text("timezone").default("Asia/Karachi"),
  clientCodeType: text("client_code_type").default("automatic"),
  clientCodePrefix: text("client_code_prefix").default("CUST-"),
  showOnLogin: boolean("show_on_login").default(true),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  channel: text("channel").notNull().default("app"),
  recipientType: text("recipient_type").default("all"),
  recipientId: integer("recipient_id"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  parameters: text("parameters"),
  lastRunAt: text("last_run_at"),
  createdBy: text("created_by"),
  status: text("status").notNull().default("active"),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  category: text("category").notNull(),
  description: text("description"),
});

export const notificationTemplates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("general"),
  channel: text("channel").notNull().default("email"),
  subject: text("subject"),
  body: text("body").notNull(),
  variables: text("variables"),
  isActive: boolean("is_active").notNull().default(true),
  module: text("module"),
  priority: text("priority").default("medium"),
  description: text("description"),
  usageCount: integer("usage_count").default(0),
  lastUsedAt: text("last_used_at"),
  createdBy: text("created_by"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const smtpSettings = pgTable("smtp_settings", {
  id: serial("id").primaryKey(),
  host: text("host").notNull(),
  port: integer("port").notNull().default(587),
  username: text("username").notNull(),
  password: text("password").notNull(),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  encryption: text("encryption").notNull().default("tls"),
  isActive: boolean("is_active").notNull().default(true),
});

export const smsSettings = pgTable("sms_settings", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull().default("custom"),
  apiUrl: text("api_url").notNull(),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  senderId: text("sender_id"),
  httpMethod: text("http_method").notNull().default("POST"),
  headerParams: text("header_params"),
  bodyTemplate: text("body_template"),
  isActive: boolean("is_active").notNull().default(true),
});

export const notificationDispatches = pgTable("notification_dispatches", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id"),
  channel: text("channel").notNull(),
  recipient: text("recipient").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  sentAt: text("sent_at"),
  createdAt: text("created_at").notNull(),
});

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  address: text("address"),
  city: text("city"),
  phone: text("phone"),
  email: text("email"),
  managerId: integer("manager_id"),
  status: text("status").notNull().default("active"),
});

export const customerConnections = pgTable("customer_connections", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  username: text("username"),
  ipAddress: text("ip_address"),
  macAddress: text("mac_address"),
  onuSerial: text("onu_serial"),
  routerModel: text("router_model"),
  routerSerial: text("router_serial"),
  connectionType: text("connection_type").default("fiber"),
  port: text("port"),
  vlan: text("vlan"),
  installDate: text("install_date"),
  status: text("status").notNull().default("active"),
});

export const vendorWalletTransactions = pgTable("vendor_wallet_transactions", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 12, scale: 2 }).notNull(),
  reference: text("reference"),
  description: text("description"),
  paymentMethod: text("payment_method"),
  performedBy: text("performed_by"),
  approvedBy: text("approved_by"),
  notes: text("notes"),
  reason: text("reason"),
  customerId: integer("customer_id"),
  resellerId: integer("reseller_id"),
  createdAt: text("created_at").notNull(),
});

export const resellerWalletTransactions = pgTable("reseller_wallet_transactions", {
  id: serial("id").primaryKey(),
  resellerId: integer("reseller_id").notNull(),
  type: text("type").notNull(),
  category: text("category"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 12, scale: 2 }).notNull(),
  reference: text("reference"),
  description: text("description"),
  paymentMethod: text("payment_method"),
  vendorId: integer("vendor_id"),
  customerId: integer("customer_id"),
  createdBy: text("created_by"),
  createdAt: text("created_at").notNull(),
});

export const vendorPackages = pgTable("vendor_packages", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  packageName: text("package_name").notNull(),
  speed: text("speed"),
  vendorPrice: decimal("vendor_price", { precision: 10, scale: 2 }).notNull(),
  ispSellingPrice: decimal("isp_selling_price", { precision: 10, scale: 2 }).notNull(),
  resellerPrice: decimal("reseller_price", { precision: 10, scale: 2 }),
  dataLimit: text("data_limit"),
  validity: text("validity").default("30 days"),
  ispMargin: decimal("isp_margin", { precision: 10, scale: 2 }),
  resellerMargin: decimal("reseller_margin", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
});

export const vendorBandwidthLinks = pgTable("vendor_bandwidth_links", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  linkName: text("link_name").notNull(),
  ipAddress: text("ip_address"),
  vlanDetail: text("vlan_detail"),
  city: text("city"),
  bandwidthMbps: decimal("bandwidth_mbps", { precision: 10, scale: 2 }).notNull(),
  bandwidthRate: decimal("bandwidth_rate", { precision: 10, scale: 2 }).notNull(),
  totalMonthlyCost: decimal("total_monthly_cost", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const customerQueries = pgTable("customer_queries", {
  id: serial("id").primaryKey(),
  queryId: text("query_id").notNull(),
  name: text("name").notNull(),
  gender: text("gender"),
  occupation: text("occupation"),
  dateOfBirth: text("date_of_birth"),
  fatherName: text("father_name"),
  motherName: text("mother_name"),
  nidNumber: text("nid_number"),
  registrationFormNo: text("registration_form_no"),
  remarks: text("remarks"),
  profilePicture: text("profile_picture"),
  nidPicture: text("nid_picture"),
  registrationFormPicture: text("registration_form_picture"),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  area: text("area"),
  city: text("city"),
  district: text("district"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  connectionType: text("connection_type"),
  packageId: integer("package_id"),
  ipAddress: text("ip_address"),
  macAddress: text("mac_address"),
  routerModel: text("router_model"),
  ontSerialNumber: text("ont_serial_number"),
  popLocation: text("pop_location"),
  vlanId: text("vlan_id"),
  serviceType: text("service_type"),
  billingCycle: text("billing_cycle"),
  installationDate: text("installation_date"),
  activationDate: text("activation_date"),
  monthlyCharges: decimal("monthly_charges", { precision: 10, scale: 2 }),
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }),
  installationFee: decimal("installation_fee", { precision: 10, scale: 2 }),
  specialDiscount: decimal("special_discount", { precision: 10, scale: 2 }),
  zone: text("zone"),
  subzone: text("subzone"),
  customerType: text("customer_type"),
  billingDate: integer("billing_date"),
  otcCharge: decimal("otc_charge", { precision: 10, scale: 2 }),
  phyConnectivity: text("phy_connectivity").default("Pending"),
  referredBy: text("referred_by"),
  referredByDetail: text("referred_by_detail"),
  referredById: integer("referred_by_id"),
  referredByType: text("referred_by_type"),
  branch: text("branch"),
  requestDate: text("request_date"),
  staticIp: boolean("static_ip").default(false),
  popId: text("pop_id"),
  bandwidthRequired: text("bandwidth_required"),
  panelUsersCapacity: text("panel_users_capacity"),
  bandwidthVendorId: integer("bandwidth_vendor_id"),
  panelVendorId: integer("panel_vendor_id"),
  createdBy: text("created_by"),
  setupBy: text("setup_by"),
  setupTime: text("setup_time"),
  status: text("status").notNull().default("Pending"),
  approvedBy: text("approved_by"),
  approvedAt: text("approved_at"),
  rejectedBy: text("rejected_by"),
  rejectedReason: text("rejected_reason"),
  assignedEmployeeId: integer("assigned_employee_id"),
  assignedEmployeeName: text("assigned_employee_name"),
  assignedAt: text("assigned_at"),
  requirementsSubmittedAt: text("requirements_submitted_at"),
  finalApprovedBy: text("final_approved_by"),
  finalApprovedAt: text("final_approved_at"),
  convertedAt: text("converted_at"),
  convertedCustomerId: integer("converted_customer_id"),
  createdAt: text("created_at").notNull(),
});

export const customerQueryLogs = pgTable("customer_query_logs", {
  id: serial("id").primaryKey(),
  queryId: integer("query_id").notNull(),
  action: text("action").notNull(),
  performedBy: text("performed_by"),
  performedAt: text("performed_at").notNull(),
  notes: text("notes"),
  metadata: text("metadata"),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  itemType: text("item_type").notNull().default("service"),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  packageId: integer("package_id"),
  sortOrder: integer("sort_order").default(0),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true });
export const insertPackageSchema = createInsertSchema(packages).omit({ id: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true });
export const insertAreaSchema = createInsertSchema(areas).omit({ id: true });
export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true });
export const insertResellerSchema = createInsertSchema(resellers).omit({ id: true });
export const insertAccountTypeSchema = createInsertSchema(accountTypes).omit({ id: true });
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true });
export const insertBudgetSchema = createInsertSchema(budgets).omit({ id: true });
export const insertBudgetAllocationSchema = createInsertSchema(budgetAllocations).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export const insertAssetTypeSchema = createInsertSchema(assetTypes).omit({ id: true, createdAt: true });
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true });
export const insertAssetTransferSchema = createInsertSchema(assetTransfers).omit({ id: true });
export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({ id: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true });
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true });
export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({ id: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });
export const insertCustomerConnectionSchema = createInsertSchema(customerConnections).omit({ id: true });
export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates).omit({ id: true });
export const insertSmtpSettingsSchema = createInsertSchema(smtpSettings).omit({ id: true });
export const insertSmsSettingsSchema = createInsertSchema(smsSettings).omit({ id: true });
export const insertNotificationDispatchSchema = createInsertSchema(notificationDispatches).omit({ id: true });
export const insertBranchSchema = createInsertSchema(branches).omit({ id: true });
export const insertVendorWalletTransactionSchema = createInsertSchema(vendorWalletTransactions).omit({ id: true });
export const insertResellerWalletTransactionSchema = createInsertSchema(resellerWalletTransactions).omit({ id: true });
export const insertVendorPackageSchema = createInsertSchema(vendorPackages).omit({ id: true });
export const insertVendorBandwidthLinkSchema = createInsertSchema(vendorBandwidthLinks).omit({ id: true });

export const bandwidthChangeHistory = pgTable("bandwidth_change_history", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  linkId: integer("link_id").notNull(),
  changeType: text("change_type").notNull(),
  previousMbps: decimal("previous_mbps", { precision: 10, scale: 2 }).notNull(),
  newMbps: decimal("new_mbps", { precision: 10, scale: 2 }).notNull(),
  previousRate: decimal("previous_rate", { precision: 10, scale: 2 }).notNull(),
  newRate: decimal("new_rate", { precision: 10, scale: 2 }).notNull(),
  previousCost: decimal("previous_cost", { precision: 12, scale: 2 }).notNull(),
  newCost: decimal("new_cost", { precision: 12, scale: 2 }).notNull(),
  reason: text("reason"),
  requestedBy: text("requested_by"),
  approvedBy: text("approved_by"),
  status: text("status").notNull().default("completed"),
  effectiveDate: text("effective_date"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertBandwidthChangeHistorySchema = createInsertSchema(bandwidthChangeHistory).omit({ id: true });

export const insertCustomerQuerySchema = createInsertSchema(customerQueries).omit({ id: true });

export const supportCategories = pgTable("support_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  department: text("department").notNull(),
  categoryType: text("category_type").notNull().default("for_everyone"),
  details: text("details"),
  targetGroup: text("target_group").default("clients"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertSupportCategorySchema = createInsertSchema(supportCategories).omit({ id: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Package = typeof packages.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertArea = z.infer<typeof insertAreaSchema>;
export type Area = typeof areas.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertReseller = z.infer<typeof insertResellerSchema>;
export type Reseller = typeof resellers.$inferSelect;
export type InsertAccountType = z.infer<typeof insertAccountTypeSchema>;
export type AccountType = typeof accountTypes.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;
export type InsertBudgetAllocation = z.infer<typeof insertBudgetAllocationSchema>;
export type BudgetAllocation = typeof budgetAllocations.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertAssetType = z.infer<typeof insertAssetTypeSchema>;
export type AssetType = typeof assetTypes.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertAssetTransfer = z.infer<typeof insertAssetTransferSchema>;
export type AssetTransfer = typeof assetTransfers.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertCustomerConnection = z.infer<typeof insertCustomerConnectionSchema>;
export type CustomerConnection = typeof customerConnections.$inferSelect;
export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertSmtpSettings = z.infer<typeof insertSmtpSettingsSchema>;
export type SmtpSettings = typeof smtpSettings.$inferSelect;
export type InsertSmsSettings = z.infer<typeof insertSmsSettingsSchema>;
export type SmsSettings = typeof smsSettings.$inferSelect;
export type InsertNotificationDispatch = z.infer<typeof insertNotificationDispatchSchema>;
export type NotificationDispatch = typeof notificationDispatches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Branch = typeof branches.$inferSelect;
export type InsertVendorWalletTransaction = z.infer<typeof insertVendorWalletTransactionSchema>;
export type VendorWalletTransaction = typeof vendorWalletTransactions.$inferSelect;
export type InsertResellerWalletTransaction = z.infer<typeof insertResellerWalletTransactionSchema>;
export type ResellerWalletTransaction = typeof resellerWalletTransactions.$inferSelect;
export type InsertVendorPackage = z.infer<typeof insertVendorPackageSchema>;
export type VendorPackage = typeof vendorPackages.$inferSelect;
export type InsertVendorBandwidthLink = z.infer<typeof insertVendorBandwidthLinkSchema>;
export type VendorBandwidthLink = typeof vendorBandwidthLinks.$inferSelect;
export type InsertBandwidthChangeHistory = z.infer<typeof insertBandwidthChangeHistorySchema>;
export type BandwidthChangeHistory = typeof bandwidthChangeHistory.$inferSelect;

export type InsertCustomerQuery = z.infer<typeof insertCustomerQuerySchema>;
export type CustomerQuery = typeof customerQueries.$inferSelect;
export const insertCustomerQueryLogSchema = createInsertSchema(customerQueryLogs).omit({ id: true });
export type InsertCustomerQueryLog = z.infer<typeof insertCustomerQueryLogSchema>;
export type CustomerQueryLog = typeof customerQueryLogs.$inferSelect;
export type InsertSupportCategory = z.infer<typeof insertSupportCategorySchema>;
export type SupportCategory = typeof supportCategories.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  expenseId: text("expense_id").notNull().unique(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  paymentMethod: text("payment_method").default("cash"),
  reference: text("reference"),
  vendorId: integer("vendor_id"),
  approvedBy: text("approved_by"),
  status: text("status").notNull().default("pending"),
  date: text("date").notNull(),
  receipt: text("receipt"),
  notes: text("notes"),
  createdBy: text("created_by"),
  area: text("area"),
  branch: text("branch"),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  date: text("date").notNull(),
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  status: text("status").notNull().default("present"),
  hoursWorked: decimal("hours_worked", { precision: 5, scale: 2 }),
  overtime: decimal("overtime", { precision: 5, scale: 2 }).default("0"),
  notes: text("notes"),
  location: text("location"),
  checkinLocation: text("checkin_location"),
  checkoutLocation: text("checkout_location"),
  checkinDevice: text("checkin_device").default("device"),
  checkoutDevice: text("checkout_device"),
  shift: text("shift"),
  breakMinutes: integer("break_minutes").default(0),
  lateMinutes: integer("late_minutes").default(0),
  earlyLeaveMinutes: integer("early_leave_minutes").default(0),
});

export const attendanceBreaks = pgTable("attendance_breaks", {
  id: serial("id").primaryKey(),
  attendanceId: integer("attendance_id").notNull(),
  breakStart: text("break_start").notNull(),
  breakEnd: text("break_end"),
  breakType: text("break_type").default("break"),
  duration: integer("duration"),
  notes: text("notes"),
});

export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  leaveType: text("leave_type").notNull(),
  dateFrom: text("date_from").notNull(),
  dateTo: text("date_to").notNull(),
  numberOfDays: integer("number_of_days").notNull().default(1),
  remarks: text("remarks"),
  reason: text("reason"),
  status: text("status").notNull().default("requested"),
  approvedBy: text("approved_by"),
  approvedAt: text("approved_at"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: text("date").notNull(),
  description: text("description"),
  type: text("type").notNull().default("public"),
  isRecurring: integer("is_recurring").default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userName: text("user_name"),
  action: text("action").notNull(),
  module: text("module").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  oldValues: text("old_values"),
  newValues: text("new_values"),
  ipAddress: text("ip_address"),
  description: text("description").notNull(),
  createdAt: text("created_at").notNull(),
});

export const taskActivityLogs = pgTable("task_activity_logs", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id"),
  taskCode: text("task_code"),
  taskTitle: text("task_title"),
  projectId: integer("project_id"),
  projectName: text("project_name"),
  actionType: text("action_type").notNull(),
  fieldChanged: text("field_changed"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  performedBy: text("performed_by").notNull(),
  performedByRole: text("performed_by_role"),
  ipAddress: text("ip_address"),
  deviceInfo: text("device_info"),
  description: text("description").notNull(),
  severity: text("severity").default("normal"),
  createdAt: text("created_at").notNull(),
});

export const creditNotes = pgTable("credit_notes", {
  id: serial("id").primaryKey(),
  creditNoteNumber: text("credit_note_number").notNull().unique(),
  customerId: integer("customer_id").notNull(),
  invoiceId: integer("invoice_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  appliedAmount: decimal("applied_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  remainingBalance: decimal("remaining_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  reason: text("reason").notNull(),
  reasonCategory: text("reason_category").notNull().default("other"),
  status: text("status").notNull().default("draft"),
  issueDate: text("issue_date").notNull(),
  appliedDate: text("applied_date"),
  notes: text("notes"),
  createdBy: text("created_by"),
  branch: text("branch"),
  debitAccountId: integer("debit_account_id"),
  creditAccountId: integer("credit_account_id"),
  applicationMode: text("application_mode").notNull().default("credit_balance"),
  allowPartialApplication: boolean("allow_partial_application").notNull().default(true),
  approvalNotes: text("approval_notes"),
  approvedBy: text("approved_by"),
  approvalDate: text("approval_date"),
  createdAt: text("created_at"),
});

export const bulkMessages = pgTable("bulk_messages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  channel: text("channel").notNull().default("sms"),
  targetType: text("target_type").notNull().default("all"),
  targetArea: text("target_area"),
  targetStatus: text("target_status"),
  recipientCount: integer("recipient_count").default(0),
  sentCount: integer("sent_count").default(0),
  failedCount: integer("failed_count").default(0),
  status: text("status").notNull().default("draft"),
  scheduledAt: text("scheduled_at"),
  sentAt: text("sent_at"),
  createdBy: text("created_by"),
  createdAt: text("created_at").notNull(),
});

export const ipAddresses = pgTable("ip_addresses", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull().unique(),
  subnet: text("subnet"),
  gateway: text("gateway"),
  type: text("type").notNull().default("dynamic"),
  status: text("status").notNull().default("available"),
  customerId: integer("customer_id"),
  assignedDate: text("assigned_date"),
  vlan: text("vlan"),
  pool: text("pool"),
  notes: text("notes"),
  macAddress: text("mac_address"),
  serviceType: text("service_type"),
  linkedDevice: text("linked_device"),
  subnetId: integer("subnet_id"),
  vlanId: integer("vlan_id"),
});

export const subnets = pgTable("subnets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  networkAddress: text("network_address").notNull(),
  subnetMask: text("subnet_mask"),
  cidr: integer("cidr"),
  gateway: text("gateway"),
  dns: text("dns"),
  pop: text("pop"),
  associatedDevice: text("associated_device"),
  ipType: text("ip_type").notNull().default("private"),
  totalHosts: integer("total_hosts").default(0),
  usableHosts: integer("usable_hosts").default(0),
  broadcastAddress: text("broadcast_address"),
  usedIps: integer("used_ips").default(0),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
});

export const insertSubnetSchema = createInsertSchema(subnets).omit({ id: true });
export type InsertSubnet = z.infer<typeof insertSubnetSchema>;
export type Subnet = typeof subnets.$inferSelect;

export const vlans = pgTable("vlans", {
  id: serial("id").primaryKey(),
  vlanIdNumber: integer("vlan_id_number").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("internet"),
  pop: text("pop"),
  linkedDevice: text("linked_device"),
  subnetAssignment: text("subnet_assignment"),
  status: text("status").notNull().default("active"),
  description: text("description"),
});

export const insertVlanSchema = createInsertSchema(vlans).omit({ id: true });
export type InsertVlan = z.infer<typeof insertVlanSchema>;
export type Vlan = typeof vlans.$inferSelect;

export const ipamLogs = pgTable("ipam_logs", {
  id: serial("id").primaryKey(),
  actionType: text("action_type").notNull(),
  user: text("user"),
  ipAddress: text("ip_address"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  details: text("details"),
  deviceSyncStatus: text("device_sync_status"),
  timestamp: text("timestamp").default(sql`now()`),
});

export const insertIpamLogSchema = createInsertSchema(ipamLogs).omit({ id: true });
export type InsertIpamLog = z.infer<typeof insertIpamLogSchema>;
export type IpamLog = typeof ipamLogs.$inferSelect;

export const outages = pgTable("outages", {
  id: serial("id").primaryKey(),
  outageId: text("outage_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  affectedArea: text("affected_area"),
  affectedCustomers: integer("affected_customers").default(0),
  severity: text("severity").notNull().default("minor"),
  type: text("type").notNull().default("unplanned"),
  status: text("status").notNull().default("ongoing"),
  startTime: text("start_time").notNull(),
  estimatedRestore: text("estimated_restore"),
  endTime: text("end_time"),
  rootCause: text("root_cause"),
  resolution: text("resolution"),
  notifiedCustomers: boolean("notified_customers").default(false),
  createdBy: text("created_by"),
  outageType: text("outage_type").default("router_down"),
  affectedPop: text("affected_pop"),
  affectedDevice: text("affected_device"),
  affectedVlan: text("affected_vlan"),
  assignedEngineer: text("assigned_engineer"),
  assignedTeam: text("assigned_team"),
  slaLimitMinutes: integer("sla_limit_minutes").default(240),
  responseTime: text("response_time"),
  resolutionTimeMinutes: integer("resolution_time_minutes"),
  slaBreach: boolean("sla_breach").default(false),
  corporateAffected: integer("corporate_affected").default(0),
  revenueImpact: decimal("revenue_impact", { precision: 12, scale: 2 }).default("0"),
  notifyManagement: boolean("notify_management").default(false),
  createLinkedTask: boolean("create_linked_task").default(false),
  escalated: boolean("escalated").default(false),
  escalatedTo: text("escalated_to"),
  escalatedAt: text("escalated_at"),
});

export const outageTimeline = pgTable("outage_timeline", {
  id: serial("id").primaryKey(),
  outageId: integer("outage_id").notNull(),
  action: text("action").notNull(),
  status: text("status").default("info"),
  user: text("user"),
  notes: text("notes"),
  timestamp: text("timestamp").notNull(),
});

// Network Devices for monitoring
export const networkDevices = pgTable("network_devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("router"),
  vendor: text("vendor").default("mikrotik"),
  ipAddress: text("ip_address").notNull(),
  macAddress: text("mac_address"),
  location: text("location"),
  area: text("area"),
  status: text("status").notNull().default("online"),
  lastSeen: text("last_seen"),
  uptime: text("uptime"),
  cpuUsage: integer("cpu_usage"),
  memoryUsage: integer("memory_usage"),
  firmware: text("firmware"),
  model: text("model"),
  serialNumber: text("serial_number"),
  notes: text("notes"),
  monitoringEnabled: boolean("monitoring_enabled").default(true),
  alertThreshold: integer("alert_threshold").default(80),
});

// PPPoE Users managed via MikroTik/RADIUS
export const pppoeUsers = pgTable("pppoe_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  customerId: integer("customer_id"),
  profileName: text("profile_name"),
  serviceType: text("service_type").default("pppoe"),
  status: text("status").notNull().default("active"),
  ipAddress: text("ip_address"),
  macAddress: text("mac_address"),
  uploadSpeed: text("upload_speed"),
  downloadSpeed: text("download_speed"),
  dataLimit: text("data_limit"),
  bytesIn: text("bytes_in").default("0"),
  bytesOut: text("bytes_out").default("0"),
  lastOnline: text("last_online"),
  nasDevice: text("nas_device"),
  callerStationId: text("caller_station_id"),
  sessionTimeout: integer("session_timeout"),
  idleTimeout: integer("idle_timeout"),
  createdAt: text("created_at"),
});

// RADIUS Profiles for bandwidth management
export const radiusProfiles = pgTable("radius_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  downloadRate: text("download_rate").notNull(),
  uploadRate: text("upload_rate").notNull(),
  burstDownload: text("burst_download"),
  burstUpload: text("burst_upload"),
  burstThreshold: text("burst_threshold"),
  burstTime: text("burst_time"),
  priority: integer("priority").default(8),
  dataQuota: text("data_quota"),
  sessionTimeout: integer("session_timeout"),
  idleTimeout: integer("idle_timeout").default(300),
  addressPool: text("address_pool"),
  sharedUsers: integer("shared_users").default(1),
  packageId: integer("package_id"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
});

export const radiusNasDevices = pgTable("radius_nas_devices", {
  id: serial("id").primaryKey(),
  nasName: text("nas_name").notNull(),
  nasIpAddress: text("nas_ip_address").notNull(),
  radiusSecret: text("radius_secret").notNull(),
  nasType: text("nas_type").notNull().default("mikrotik"),
  location: text("location"),
  authPort: integer("auth_port").default(1812),
  acctPort: integer("acct_port").default(1813),
  status: text("status").notNull().default("active"),
  description: text("description"),
  lastSeen: text("last_seen"),
  connectedSubscribers: integer("connected_subscribers").default(0),
});

export const insertRadiusNasDeviceSchema = createInsertSchema(radiusNasDevices).omit({ id: true });
export type InsertRadiusNasDevice = z.infer<typeof insertRadiusNasDeviceSchema>;
export type RadiusNasDevice = typeof radiusNasDevices.$inferSelect;

export const radiusAuthLogs = pgTable("radius_auth_logs", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  username: text("username"),
  nasDevice: text("nas_device"),
  clientIp: text("client_ip"),
  replyMessage: text("reply_message"),
  rejectReason: text("reject_reason"),
  macAddress: text("mac_address"),
  status: text("status").notNull().default("accepted"),
  timestamp: text("timestamp").default(sql`now()`),
});

export const insertRadiusAuthLogSchema = createInsertSchema(radiusAuthLogs).omit({ id: true });
export type InsertRadiusAuthLog = z.infer<typeof insertRadiusAuthLogSchema>;
export type RadiusAuthLog = typeof radiusAuthLogs.$inferSelect;

// Payment gateway config
export const paymentGateways = pgTable("payment_gateways", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  providerType: text("provider_type").notNull().default("online_gateway"),
  merchantId: text("merchant_id"),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  publicKey: text("public_key"),
  webhookUrl: text("webhook_url"),
  callbackUrl: text("callback_url"),
  mode: text("mode").notNull().default("test"),
  status: text("status").notNull().default("testing"),
  isActive: boolean("is_active").notNull().default(false),
  supportedMethods: text("supported_methods"),
  debitAccountId: integer("debit_account_id"),
  creditAccountId: integer("credit_account_id"),
  chargesAccountId: integer("charges_account_id"),
  taxChargesAccountId: integer("tax_charges_account_id"),
  autoMarkPaid: boolean("auto_mark_paid").notNull().default(true),
  partialPayment: boolean("partial_payment").notNull().default(false),
  autoSendReceipt: boolean("auto_send_receipt").notNull().default(true),
  autoGenerateIncome: boolean("auto_generate_income").notNull().default(true),
  autoApplyLateFee: boolean("auto_apply_late_fee").notNull().default(false),
  autoAdjustCredit: boolean("auto_adjust_credit").notNull().default(false),
  maxTransactionLimit: decimal("max_transaction_limit", { precision: 12, scale: 2 }),
  dailyTransactionCap: decimal("daily_transaction_cap", { precision: 14, scale: 2 }),
  ipValidation: boolean("ip_validation").notNull().default(false),
  duplicatePrevention: boolean("duplicate_prevention").notNull().default(true),
  webhookVerification: boolean("webhook_verification").notNull().default(true),
  encryptCredentials: boolean("encrypt_credentials").notNull().default(true),
  gatewayChargePercent: decimal("gateway_charge_percent", { precision: 5, scale: 2 }).default("0"),
  lastTransactionDate: text("last_transaction_date"),
  monthlyCollection: decimal("monthly_collection", { precision: 14, scale: 2 }).default("0"),
  totalTransactions: integer("total_transactions").notNull().default(0),
  notes: text("notes"),
  createdAt: text("created_at"),
});

// Payment records
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  paymentId: text("payment_id").notNull().unique(),
  customerId: integer("customer_id").notNull(),
  invoiceId: integer("invoice_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method").notNull().default("cash"),
  gateway: text("gateway"),
  transactionRef: text("transaction_ref"),
  status: text("status").notNull().default("completed"),
  paidAt: text("paid_at").notNull(),
  receivedBy: text("received_by"),
  notes: text("notes"),
});

// Billing rules for auto late fees / suspension
export const billingRules = pgTable("billing_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("late_fee"),
  customerType: text("customer_type").notNull().default("all"),
  branch: text("branch"),
  status: text("status").notNull().default("active"),
  billingFrequency: text("billing_frequency").default("monthly"),
  invoiceDay: integer("invoice_day").default(1),
  dueDateOffset: integer("due_date_offset").default(7),
  graceDays: integer("grace_days").default(7),
  autoGenerateInvoice: boolean("auto_generate_invoice").notNull().default(true),
  pricingMode: text("pricing_mode").default("plan_based"),
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }),
  taxPercent: decimal("tax_percent", { precision: 5, scale: 2 }).default("0"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  penaltyType: text("penalty_type").default("fixed"),
  penaltyAmount: decimal("penalty_amount", { precision: 10, scale: 2 }),
  penaltyPercent: decimal("penalty_percent", { precision: 5, scale: 2 }),
  maxPenalty: decimal("max_penalty", { precision: 10, scale: 2 }),
  prorationMethod: text("proration_method").default("daily"),
  debitAccountId: integer("debit_account_id"),
  creditAccountId: integer("credit_account_id"),
  taxAccountId: integer("tax_account_id"),
  lateFeeAccountId: integer("late_fee_account_id"),
  autoSuspendDays: integer("auto_suspend_days").default(30),
  autoDisconnectDays: integer("auto_disconnect_days").default(60),
  autoEmailInvoice: boolean("auto_email_invoice").notNull().default(true),
  autoApplyCreditNotes: boolean("auto_apply_credit_notes").notNull().default(false),
  autoSuspendOnNonPayment: boolean("auto_suspend_on_non_payment").notNull().default(false),
  autoApplyLateFee: boolean("auto_apply_late_fee").notNull().default(true),
  autoRecurring: boolean("auto_recurring").notNull().default(true),
  allowManualOverride: boolean("allow_manual_override").notNull().default(true),
  notifyOnApply: boolean("notify_on_apply").default(true),
  isActive: boolean("is_active").notNull().default(true),
  description: text("description"),
  lastExecutionDate: text("last_execution_date"),
  nextExecutionDate: text("next_execution_date"),
  createdAt: text("created_at"),
});

// Bandwidth usage tracking
export const bandwidthUsage = pgTable("bandwidth_usage", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  pppoeUserId: integer("pppoe_user_id"),
  date: text("date").notNull(),
  downloadMb: decimal("download_mb", { precision: 12, scale: 2 }).default("0"),
  uploadMb: decimal("upload_mb", { precision: 12, scale: 2 }).default("0"),
  totalMb: decimal("total_mb", { precision: 12, scale: 2 }).default("0"),
  peakDownload: text("peak_download"),
  peakUpload: text("peak_upload"),
  sessionCount: integer("session_count").default(1),
  avgLatency: decimal("avg_latency", { precision: 6, scale: 2 }),
});

export const insertNetworkDeviceSchema = createInsertSchema(networkDevices).omit({ id: true });
export const insertPppoeUserSchema = createInsertSchema(pppoeUsers).omit({ id: true });
export const insertRadiusProfileSchema = createInsertSchema(radiusProfiles).omit({ id: true });
export const insertPaymentGatewaySchema = createInsertSchema(paymentGateways).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true });
export const insertBillingRuleSchema = createInsertSchema(billingRules).omit({ id: true });
export const insertBandwidthUsageSchema = createInsertSchema(bandwidthUsage).omit({ id: true });

export type InsertNetworkDevice = z.infer<typeof insertNetworkDeviceSchema>;
export type NetworkDevice = typeof networkDevices.$inferSelect;
export type InsertPppoeUser = z.infer<typeof insertPppoeUserSchema>;
export type PppoeUser = typeof pppoeUsers.$inferSelect;
export type InsertRadiusProfile = z.infer<typeof insertRadiusProfileSchema>;
export type RadiusProfile = typeof radiusProfiles.$inferSelect;
export type InsertPaymentGateway = z.infer<typeof insertPaymentGatewaySchema>;
export type PaymentGateway = typeof paymentGateways.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertBillingRule = z.infer<typeof insertBillingRuleSchema>;
export type BillingRule = typeof billingRules.$inferSelect;
export type InsertBandwidthUsage = z.infer<typeof insertBandwidthUsageSchema>;
export type BandwidthUsage = typeof bandwidthUsage.$inferSelect;

export const insertLeaveSchema = createInsertSchema(leaves).omit({ id: true, createdAt: true });
export const insertHolidaySchema = createInsertSchema(holidays).omit({ id: true, createdAt: true });

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertAttendanceBreakSchema = createInsertSchema(attendanceBreaks).omit({ id: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true });
export const insertTaskActivityLogSchema = createInsertSchema(taskActivityLogs).omit({ id: true });
export const insertCreditNoteSchema = createInsertSchema(creditNotes).omit({ id: true });
export const insertBulkMessageSchema = createInsertSchema(bulkMessages).omit({ id: true });
export const insertIpAddressSchema = createInsertSchema(ipAddresses).omit({ id: true });
export const insertOutageSchema = createInsertSchema(outages).omit({ id: true });
export const insertOutageTimelineSchema = createInsertSchema(outageTimeline).omit({ id: true });

export type InsertLeave = z.infer<typeof insertLeaveSchema>;
export type Leave = typeof leaves.$inferSelect;
export type InsertHoliday = z.infer<typeof insertHolidaySchema>;
export type Holiday = typeof holidays.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendanceBreak = z.infer<typeof insertAttendanceBreakSchema>;
export type AttendanceBreak = typeof attendanceBreaks.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertTaskActivityLog = z.infer<typeof insertTaskActivityLogSchema>;
export type TaskActivityLog = typeof taskActivityLogs.$inferSelect;
export type InsertCreditNote = z.infer<typeof insertCreditNoteSchema>;
export type CreditNote = typeof creditNotes.$inferSelect;
export type InsertBulkMessage = z.infer<typeof insertBulkMessageSchema>;
export type BulkMessage = typeof bulkMessages.$inferSelect;
export type InsertIpAddress = z.infer<typeof insertIpAddressSchema>;
export type IpAddress = typeof ipAddresses.$inferSelect;
export type InsertOutage = z.infer<typeof insertOutageSchema>;
export type Outage = typeof outages.$inferSelect;
export type InsertOutageTimeline = z.infer<typeof insertOutageTimelineSchema>;
export type OutageTimeline = typeof outageTimeline.$inferSelect;

export const dailyCollections = pgTable("daily_collections", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  customerId: integer("customer_id").notNull(),
  invoiceId: integer("invoice_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  received: decimal("received", { precision: 10, scale: 2 }).notNull().default("0"),
  vat: decimal("vat", { precision: 10, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  balanceDue: decimal("balance_due", { precision: 10, scale: 2 }).default("0"),
  paymentMethod: text("payment_method").default("cash"),
  receivedBy: text("received_by"),
  approvedBy: text("approved_by"),
  createdBy: text("created_by"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  connectionType: text("connection_type"),
  area: text("area"),
  transactionType: text("transaction_type").default("collection"),
});

export const insertDailyCollectionSchema = createInsertSchema(dailyCollections).omit({ id: true });
export type InsertDailyCollection = z.infer<typeof insertDailyCollectionSchema>;
export type DailyCollection = typeof dailyCollections.$inferSelect;

export const salaryHistory = pgTable("salary_history", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  salaryDate: text("salary_date").notNull(),
  salaryMonth: text("salary_month").notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  overtime: decimal("overtime", { precision: 10, scale: 2 }).default("0"),
  incentive: decimal("incentive", { precision: 10, scale: 2 }).default("0"),
  bonus: decimal("bonus", { precision: 10, scale: 2 }).default("0"),
  overall: decimal("overall", { precision: 10, scale: 2 }).default("0"),
  remarks: text("remarks"),
  givenBy: text("given_by"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertSalaryHistorySchema = createInsertSchema(salaryHistory).omit({ id: true, createdAt: true });
export type InsertSalaryHistory = z.infer<typeof insertSalaryHistorySchema>;
export type SalaryHistory = typeof salaryHistory.$inferSelect;

export const advanceLoans = pgTable("advance_loans", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  type: text("type").notNull().default("advance"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  reason: text("reason"),
  issueDate: text("issue_date").notNull(),
  repaymentType: text("repayment_type").notNull().default("one_time"),
  installments: integer("installments").default(1),
  installmentAmount: decimal("installment_amount", { precision: 12, scale: 2 }),
  installmentStartMonth: text("installment_start_month"),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).default("0"),
  requestedBy: text("requested_by"),
  approvedBy: text("approved_by"),
  approvalStatus: text("approval_status").notNull().default("pending"),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertAdvanceLoanSchema = createInsertSchema(advanceLoans).omit({ id: true, createdAt: true });
export type InsertAdvanceLoan = z.infer<typeof insertAdvanceLoanSchema>;
export type AdvanceLoan = typeof advanceLoans.$inferSelect;

export const loanInstallments = pgTable("loan_installments", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").notNull(),
  installmentNo: integer("installment_no").notNull(),
  dueDate: text("due_date").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paidDate: text("paid_date"),
  status: text("status").notNull().default("pending"),
});

export const insertLoanInstallmentSchema = createInsertSchema(loanInstallments).omit({ id: true });
export type InsertLoanInstallment = z.infer<typeof insertLoanInstallmentSchema>;
export type LoanInstallment = typeof loanInstallments.$inferSelect;

export const payroll = pgTable("payroll", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  payrollMonth: text("payroll_month").notNull(),
  baseSalary: decimal("base_salary", { precision: 12, scale: 2 }).notNull().default("0"),
  attendanceDeduction: decimal("attendance_deduction", { precision: 12, scale: 2 }).default("0"),
  overtime: decimal("overtime", { precision: 12, scale: 2 }).default("0"),
  bonus: decimal("bonus", { precision: 12, scale: 2 }).default("0"),
  commission: decimal("commission", { precision: 12, scale: 2 }).default("0"),
  loanDeduction: decimal("loan_deduction", { precision: 12, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 12, scale: 2 }).default("0"),
  otherDeductions: decimal("other_deductions", { precision: 12, scale: 2 }).default("0"),
  netSalary: decimal("net_salary", { precision: 12, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("draft"),
  paymentMethod: text("payment_method"),
  paymentRef: text("payment_ref"),
  paidDate: text("paid_date"),
  approvedBy: text("approved_by"),
  remarks: text("remarks"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertPayrollSchema = createInsertSchema(payroll).omit({ id: true, createdAt: true });
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type Payroll = typeof payroll.$inferSelect;

export const salaryPayments = pgTable("salary_payments", {
  id: serial("id").primaryKey(),
  payrollId: integer("payroll_id").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull().default("bank"),
  paymentRef: text("payment_ref"),
  remarks: text("remarks"),
  paidDate: text("paid_date").notNull(),
  paidBy: text("paid_by"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertSalaryPaymentSchema = createInsertSchema(salaryPayments).omit({ id: true, createdAt: true });
export type InsertSalaryPayment = z.infer<typeof insertSalaryPaymentSchema>;
export type SalaryPayment = typeof salaryPayments.$inferSelect;

export const bonusCommissions = pgTable("bonus_commissions", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  type: text("type").notNull().default("fixed_bonus"),
  incentiveType: text("incentive_type").notNull().default("bonus"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  calculatedAmount: decimal("calculated_amount", { precision: 12, scale: 2 }).default("0"),
  reason: text("reason"),
  month: text("month").notNull(),
  targetValue: decimal("target_value", { precision: 12, scale: 2 }),
  achievedValue: decimal("achieved_value", { precision: 12, scale: 2 }),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
  linkedSource: text("linked_source"),
  linkedAmount: decimal("linked_amount", { precision: 12, scale: 2 }),
  includeInPayroll: boolean("include_in_payroll").default(true),
  payrollMonth: text("payroll_month"),
  status: text("status").notNull().default("draft"),
  requestedBy: text("requested_by"),
  approvedBy: text("approved_by"),
  approvalDate: text("approval_date"),
  paidDate: text("paid_date"),
  remarks: text("remarks"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertBonusCommissionSchema = createInsertSchema(bonusCommissions).omit({ id: true, createdAt: true });
export type InsertBonusCommission = z.infer<typeof insertBonusCommissionSchema>;
export type BonusCommission = typeof bonusCommissions.$inferSelect;

export const commissionTypes = pgTable("commission_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  category: text("category").notNull().default("commission"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  calculationMode: text("calculation_mode").notNull().default("fixed"),
  percentage: decimal("percentage", { precision: 5, scale: 2 }),
  description: text("description"),
  isAutomatic: boolean("is_automatic").default(false),
  triggerEvent: text("trigger_event"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertCommissionTypeSchema = createInsertSchema(commissionTypes).omit({ id: true, createdAt: true });
export type InsertCommissionType = z.infer<typeof insertCommissionTypeSchema>;
export type CommissionType = typeof commissionTypes.$inferSelect;

export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  branch: text("branch"),
  department: text("department"),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  totalHours: decimal("total_hours", { precision: 4, scale: 1 }).notNull().default("8"),
  breakMinutes: integer("break_minutes").default(0),
  paidBreak: boolean("paid_break").default(false),
  overtimeAllowed: boolean("overtime_allowed").default(false),
  overtimeAfterHours: decimal("overtime_after_hours", { precision: 4, scale: 1 }).default("8"),
  overtimeMultiplier: decimal("overtime_multiplier", { precision: 3, scale: 1 }).default("1.5"),
  lateGraceMinutes: integer("late_grace_minutes").default(10),
  earlyExitGraceMinutes: integer("early_exit_grace_minutes").default(5),
  shiftType: text("shift_type").notNull().default("fixed"),
  nightShiftAllowance: decimal("night_shift_allowance", { precision: 10, scale: 2 }).default("0"),
  shiftAllowance: decimal("shift_allowance", { precision: 10, scale: 2 }).default("0"),
  color: text("color").default("#3b82f6"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertShiftSchema = createInsertSchema(shifts).omit({ id: true, createdAt: true });
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shifts.$inferSelect;

export const shiftAssignments = pgTable("shift_assignments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  shiftId: integer("shift_id").notNull(),
  effectiveFrom: text("effective_from").notNull(),
  effectiveTo: text("effective_to"),
  assignmentType: text("assignment_type").notNull().default("individual"),
  rotationCycleDays: integer("rotation_cycle_days"),
  rotationSequence: text("rotation_sequence"),
  weekendDays: text("weekend_days").default("friday,saturday"),
  status: text("status").notNull().default("active"),
  assignedBy: text("assigned_by"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertShiftAssignmentSchema = createInsertSchema(shiftAssignments).omit({ id: true, createdAt: true });
export type InsertShiftAssignment = z.infer<typeof insertShiftAssignmentSchema>;
export type ShiftAssignment = typeof shiftAssignments.$inferSelect;

export const appAccessConfigs = pgTable("app_access_configs", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull(),
  allowAppLogin: boolean("allow_app_login").notNull().default(false),
  appLoginType: text("app_login_type").notNull().default("office"),
  deviceRestriction: text("device_restriction").notNull().default("single_device"),
  gpsTrackingRequired: boolean("gps_tracking_required").default(false),
  liveLocationRequired: boolean("live_location_required").default(false),
  appFeatures: text("app_features"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertAppAccessConfigSchema = createInsertSchema(appAccessConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAppAccessConfig = z.infer<typeof insertAppAccessConfigSchema>;
export type AppAccessConfig = typeof appAccessConfigs.$inferSelect;

export const areaAssignments = pgTable("area_assignments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  areaId: integer("area_id").notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  assignmentPurpose: text("assignment_purpose").notNull().default("general"),
  effectiveFrom: text("effective_from").notNull(),
  effectiveTo: text("effective_to"),
  status: text("status").notNull().default("active"),
  assignedBy: text("assigned_by"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertAreaAssignmentSchema = createInsertSchema(areaAssignments).omit({ id: true, createdAt: true });
export type InsertAreaAssignment = z.infer<typeof insertAreaAssignmentSchema>;
export type AreaAssignment = typeof areaAssignments.$inferSelect;

export const loginActivityLogs = pgTable("login_activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  username: text("username").notNull(),
  employeeName: text("employee_name"),
  role: text("role"),
  loginMode: text("login_mode"),
  branch: text("branch"),
  ipAddress: text("ip_address"),
  deviceType: text("device_type"),
  userAgent: text("user_agent"),
  status: text("status").notNull().default("success"),
  failReason: text("fail_reason"),
  loginAt: text("login_at").notNull(),
  logoutAt: text("logout_at"),
});

export const insertLoginActivityLogSchema = createInsertSchema(loginActivityLogs).omit({ id: true });
export type InsertLoginActivityLog = z.infer<typeof insertLoginActivityLogSchema>;
export type LoginActivityLog = typeof loginActivityLogs.$inferSelect;

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  loginMode: z.string().optional(),
  branch: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

export type LoginData = z.infer<typeof loginSchema>;

export const cirCustomers = pgTable("cir_customers", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person"),
  cnic: text("cnic"),
  ntn: text("ntn"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  branch: text("branch"),
  vendorId: integer("vendor_id"),
  vendorPort: text("vendor_port"),
  committedBandwidth: text("committed_bandwidth"),
  burstBandwidth: text("burst_bandwidth"),
  uploadSpeed: text("upload_speed"),
  downloadSpeed: text("download_speed"),
  contentionRatio: text("contention_ratio"),
  vlanId: text("vlan_id"),
  onuDevice: text("onu_device"),
  staticIp: text("static_ip"),
  subnetMask: text("subnet_mask"),
  gateway: text("gateway"),
  dns: text("dns"),
  publicIpBlock: text("public_ip_block"),
  contractStartDate: text("contract_start_date"),
  contractEndDate: text("contract_end_date"),
  slaLevel: text("sla_level"),
  slaPenaltyClause: text("sla_penalty_clause"),
  autoRenewal: boolean("auto_renewal").default(false),
  monthlyCharges: decimal("monthly_charges", { precision: 12, scale: 2 }).default("0"),
  installationCharges: decimal("installation_charges", { precision: 10, scale: 2 }).default("0"),
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }).default("0"),
  billingCycle: text("billing_cycle").default("monthly"),
  invoiceType: text("invoice_type").default("tax"),
  lateFeePolicy: text("late_fee_policy"),
  radiusProfile: text("radius_profile"),
  bandwidthProfileName: text("bandwidth_profile_name"),
  monitoringEnabled: boolean("monitoring_enabled").default(false),
  snmpMonitoring: boolean("snmp_monitoring").default(false),
  trafficAlerts: boolean("traffic_alerts").default(false),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertCirCustomerSchema = createInsertSchema(cirCustomers).omit({ id: true, createdAt: true });
export type InsertCirCustomer = z.infer<typeof insertCirCustomerSchema>;
export type CirCustomer = typeof cirCustomers.$inferSelect;

export const corporateCustomers = pgTable("corporate_customers", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  contactFullName: text("contact_full_name"),
  registrationNumber: text("registration_number"),
  ntn: text("ntn"),
  industryType: text("industry_type"),
  headOfficeAddress: text("head_office_address"),
  billingAddress: text("billing_address"),
  accountManager: text("account_manager"),
  email: text("email"),
  mobileNo: text("mobile_no"),
  phone: text("phone"),
  branch: text("branch"),
  city: text("city"),
  centralizedBilling: boolean("centralized_billing").default(true),
  perBranchBilling: boolean("per_branch_billing").default(false),
  customInvoiceFormat: text("custom_invoice_format"),
  paymentTerms: text("payment_terms").default("net_30"),
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }).default("0"),
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }).default("0"),
  contractDuration: text("contract_duration"),
  customSla: text("custom_sla"),
  dedicatedAccountManager: text("dedicated_account_manager"),
  customPricingAgreement: text("custom_pricing_agreement"),
  managedRouter: boolean("managed_router").default(false),
  firewall: boolean("firewall").default(false),
  loadBalancer: boolean("load_balancer").default(false),
  dedicatedSupport: boolean("dedicated_support").default(false),
  backupLink: boolean("backup_link").default(false),
  monitoringSla: boolean("monitoring_sla").default(false),
  totalConnections: integer("total_connections").default(0),
  totalBandwidth: text("total_bandwidth"),
  monthlyBilling: decimal("monthly_billing", { precision: 12, scale: 2 }).default("0"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertCorporateCustomerSchema = createInsertSchema(corporateCustomers).omit({ id: true, createdAt: true });
export type InsertCorporateCustomer = z.infer<typeof insertCorporateCustomerSchema>;
export type CorporateCustomer = typeof corporateCustomers.$inferSelect;

export const corporateConnections = pgTable("corporate_connections", {
  id: serial("id").primaryKey(),
  corporateId: integer("corporate_id").notNull(),
  branchName: text("branch_name").notNull(),
  location: text("location"),
  packageType: text("package_type").default("shared"),
  bandwidth: text("bandwidth"),
  staticIp: text("static_ip"),
  installationDate: text("installation_date"),
  status: text("status").notNull().default("active"),
  monthlyCharges: decimal("monthly_charges", { precision: 10, scale: 2 }).default("0"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertCorporateConnectionSchema = createInsertSchema(corporateConnections).omit({ id: true, createdAt: true });
export type InsertCorporateConnection = z.infer<typeof insertCorporateConnectionSchema>;
export type CorporateConnection = typeof corporateConnections.$inferSelect;

export const transactionTypes = pgTable("transaction_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  description: text("description"),
  category: text("category").notNull().default("income"),
  normalBalance: text("normal_balance").notNull().default("debit"),
  defaultDebitAccountId: integer("default_debit_account_id"),
  defaultCreditAccountId: integer("default_credit_account_id"),
  allowManualOverride: boolean("allow_manual_override").notNull().default(true),
  autoJournalEntry: boolean("auto_journal_entry").notNull().default(true),
  linkCustomer: boolean("link_customer").notNull().default(false),
  linkCirCorporate: boolean("link_cir_corporate").notNull().default(false),
  linkVendor: boolean("link_vendor").notNull().default(false),
  linkPayroll: boolean("link_payroll").notNull().default(false),
  linkResellerWallet: boolean("link_reseller_wallet").notNull().default(false),
  linkExpenseEntry: boolean("link_expense_entry").notNull().default(false),
  linkIncomeEntry: boolean("link_income_entry").notNull().default(false),
  linkPaymentGateway: boolean("link_payment_gateway").notNull().default(false),
  linkCreditNotes: boolean("link_credit_notes").notNull().default(false),
  linkBankReconciliation: boolean("link_bank_reconciliation").notNull().default(false),
  autoPostLedger: boolean("auto_post_ledger").notNull().default(true),
  requireApproval: boolean("require_approval").notNull().default(false),
  allowEditAfterPosting: boolean("allow_edit_after_posting").notNull().default(false),
  lockAfterPeriodClose: boolean("lock_after_period_close").notNull().default(true),
  recurringAllowed: boolean("recurring_allowed").notNull().default(false),
  taxApplicable: boolean("tax_applicable").notNull().default(false),
  isSystemDefault: boolean("is_system_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at"),
});

export const insertTransactionTypeSchema = createInsertSchema(transactionTypes).omit({ id: true });
export type InsertTransactionType = z.infer<typeof insertTransactionTypeSchema>;
export type TransactionType = typeof transactionTypes.$inferSelect;

export const approvalRequests = pgTable("approval_requests", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull(),
  transactionId: integer("transaction_id"),
  transactionType: text("transaction_type").notNull(),
  entityName: text("entity_name").notNull(),
  entityType: text("entity_type"),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  branch: text("branch"),
  requestedBy: text("requested_by").notNull(),
  approvalLevel: integer("approval_level").notNull().default(1),
  currentLevel: integer("current_level").notNull().default(1),
  status: text("status").notNull().default("pending"),
  approvedBy: text("approved_by"),
  rejectedBy: text("rejected_by"),
  comments: text("comments"),
  approvalComments: text("approval_comments"),
  ipAddress: text("ip_address"),
  riskCategory: text("risk_category").default("normal"),
  requestDate: text("request_date").notNull(),
  approvalDate: text("approval_date"),
  category: text("category"),
  description: text("description"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertApprovalRequestSchema = createInsertSchema(approvalRequests).omit({ id: true });
export type InsertApprovalRequest = z.infer<typeof insertApprovalRequestSchema>;
export type ApprovalRequest = typeof approvalRequests.$inferSelect;

export const approvalRules = pgTable("approval_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  transactionType: text("transaction_type").notNull(),
  minAmount: decimal("min_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  maxAmount: decimal("max_amount", { precision: 14, scale: 2 }),
  approvalLevel: integer("approval_level").notNull().default(1),
  approverRole: text("approver_role").notNull(),
  branch: text("branch"),
  riskCategory: text("risk_category").default("normal"),
  autoEscalateHours: integer("auto_escalate_hours").default(24),
  isActive: boolean("is_active").notNull().default(true),
  description: text("description"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertApprovalRuleSchema = createInsertSchema(approvalRules).omit({ id: true });
export type InsertApprovalRule = z.infer<typeof insertApprovalRuleSchema>;
export type ApprovalRule = typeof approvalRules.$inferSelect;

export const approvalHistory = pgTable("approval_history", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull(),
  action: text("action").notNull(),
  actionBy: text("action_by").notNull(),
  actionDate: text("action_date").notNull(),
  comments: text("comments"),
  ipAddress: text("ip_address"),
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  level: integer("level"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertApprovalHistorySchema = createInsertSchema(approvalHistory).omit({ id: true });
export type InsertApprovalHistory = z.infer<typeof insertApprovalHistorySchema>;
export type ApprovalHistory = typeof approvalHistory.$inferSelect;

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  projectCode: text("project_code").notNull().unique(),
  name: text("name").notNull(),
  department: text("department").notNull().default("operations"),
  branch: text("branch"),
  projectType: text("project_type").notNull().default("internal_operations"),
  description: text("description"),
  status: text("status").notNull().default("planning"),
  priority: text("priority").notNull().default("medium"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  estimatedDuration: text("estimated_duration"),
  estimatedBudget: decimal("estimated_budget", { precision: 12, scale: 2 }).default("0"),
  approvedBudget: decimal("approved_budget", { precision: 12, scale: 2 }).default("0"),
  usedBudget: decimal("used_budget", { precision: 12, scale: 2 }).default("0"),
  budgetSource: text("budget_source"),
  budgetCategory: text("budget_category"),
  linkedExpenseAccountId: integer("linked_expense_account_id"),
  projectManager: text("project_manager"),
  teamMembers: text("team_members"),
  externalVendor: text("external_vendor"),
  progress: integer("progress").default(0),
  totalTasks: integer("total_tasks").default(0),
  completedTasks: integer("completed_tasks").default(0),
  milestones: text("milestones"),
  tags: text("tags"),
  notes: text("notes"),
  createdBy: text("created_by"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const assetAssignments = pgTable("asset_assignments", {
  id: serial("id").primaryKey(),
  assignmentId: text("assignment_id").notNull().unique(),
  customerId: integer("customer_id").notNull(),
  serviceId: text("service_id"),
  assetId: integer("asset_id").notNull(),
  assetType: text("asset_type").notNull(),
  serialNumber: text("serial_number"),
  macAddress: text("mac_address"),
  ipAddress: text("ip_address"),
  vlan: text("vlan"),
  installationDate: text("installation_date"),
  assignedTechnician: text("assigned_technician"),
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }).default("0"),
  ownershipType: text("ownership_type").notNull().default("rental"),
  deviceCondition: text("device_condition").notNull().default("new"),
  autoProvision: boolean("auto_provision").notNull().default(false),
  sendConfig: boolean("send_config").notNull().default(false),
  notifyCustomer: boolean("notify_customer").notNull().default(false),
  generateInvoice: boolean("generate_invoice").notNull().default(false),
  depositStatus: text("deposit_status").notNull().default("pending"),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const assetAssignmentHistory = pgTable("asset_assignment_history", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull(),
  customerId: integer("customer_id").notNull(),
  assetId: integer("asset_id"),
  action: text("action").notNull(),
  ipAddress: text("ip_address"),
  technician: text("technician"),
  reason: text("reason"),
  billingImpact: text("billing_impact"),
  notes: text("notes"),
  performedBy: text("performed_by"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertAssetAssignmentSchema = createInsertSchema(assetAssignments).omit({ id: true });
export type InsertAssetAssignment = z.infer<typeof insertAssetAssignmentSchema>;
export type AssetAssignment = typeof assetAssignments.$inferSelect;

export const insertAssetAssignmentHistorySchema = createInsertSchema(assetAssignmentHistory).omit({ id: true });
export type InsertAssetAssignmentHistory = z.infer<typeof insertAssetAssignmentHistorySchema>;
export type AssetAssignmentHistory = typeof assetAssignmentHistory.$inferSelect;

export const assetRequests = pgTable("asset_requests", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().unique(),
  requestType: text("request_type").notNull(),
  assetType: text("asset_type").notNull(),
  assetId: integer("asset_id"),
  fromLocation: text("from_location"),
  toLocation: text("to_location"),
  customerId: integer("customer_id"),
  department: text("department").notNull(),
  requestedBy: text("requested_by").notNull(),
  priority: text("priority").notNull().default("normal"),
  justification: text("justification").notNull(),
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }).default("0"),
  requiredByDate: text("required_by_date"),
  requireMultiLevel: boolean("require_multi_level").notNull().default(false),
  isEmergency: boolean("is_emergency").notNull().default(false),
  notifyDeptHead: boolean("notify_dept_head").notNull().default(false),
  currentApprovalStage: text("current_approval_stage").notNull().default("pending"),
  approvalLevel: integer("approval_level").notNull().default(1),
  currentLevel: integer("current_level").notNull().default(0),
  approvedBy: text("approved_by"),
  rejectedBy: text("rejected_by"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const assetRequestHistory = pgTable("asset_request_history", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(),
  action: text("action").notNull(),
  actionBy: text("action_by").notNull(),
  actionDate: text("action_date").notNull(),
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  comments: text("comments"),
  approvalLevel: integer("approval_level"),
  role: text("role"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertAssetRequestSchema = createInsertSchema(assetRequests).omit({ id: true });
export type InsertAssetRequest = z.infer<typeof insertAssetRequestSchema>;
export type AssetRequest = typeof assetRequests.$inferSelect;

export const insertAssetRequestHistorySchema = createInsertSchema(assetRequestHistory).omit({ id: true });
export type InsertAssetRequestHistory = z.infer<typeof insertAssetRequestHistorySchema>;
export type AssetRequestHistory = typeof assetRequestHistory.$inferSelect;

export const assetAllocations = pgTable("asset_allocations", {
  id: serial("id").primaryKey(),
  allocationId: text("allocation_id").notNull().unique(),
  allocationType: text("allocation_type").notNull(),
  assetType: text("asset_type").notNull(),
  quantity: integer("quantity").notNull().default(1),
  fulfilledQuantity: integer("fulfilled_quantity").notNull().default(0),
  sourceWarehouse: text("source_warehouse").notNull(),
  destination: text("destination").notNull(),
  destinationType: text("destination_type").notNull(),
  linkedProject: text("linked_project"),
  linkedProjectId: integer("linked_project_id"),
  expectedUsageDate: text("expected_usage_date"),
  reservationExpiry: text("reservation_expiry"),
  priority: text("priority").notNull().default("normal"),
  justification: text("justification").notNull(),
  requestedBy: text("requested_by").notNull(),
  approvedBy: text("approved_by"),
  approvalRequired: boolean("approval_required").notNull().default(true),
  reserveSerials: boolean("reserve_serials").notNull().default(false),
  autoSelect: boolean("auto_select").notNull().default(true),
  notifyResponsible: boolean("notify_responsible").notNull().default(false),
  reservedSerialNumbers: text("reserved_serial_numbers"),
  status: text("status").notNull().default("reserved"),
  notes: text("notes"),
  convertedToTransferId: text("converted_to_transfer_id"),
  convertedToAssignmentId: text("converted_to_assignment_id"),
  createdAt: text("created_at").default(sql`now()`),
});

export const assetAllocationHistory = pgTable("asset_allocation_history", {
  id: serial("id").primaryKey(),
  allocationId: integer("allocation_id").notNull(),
  action: text("action").notNull(),
  actionBy: text("action_by").notNull(),
  actionDate: text("action_date").notNull(),
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  quantityAffected: integer("quantity_affected"),
  relatedTransferId: text("related_transfer_id"),
  relatedAssignmentId: text("related_assignment_id"),
  comments: text("comments"),
});

export const insertAssetAllocationSchema = createInsertSchema(assetAllocations).omit({ id: true });
export type InsertAssetAllocation = z.infer<typeof insertAssetAllocationSchema>;
export type AssetAllocation = typeof assetAllocations.$inferSelect;

export const insertAssetAllocationHistorySchema = createInsertSchema(assetAllocationHistory).omit({ id: true });
export type InsertAssetAllocationHistory = z.infer<typeof insertAssetAllocationHistorySchema>;
export type AssetAllocationHistory = typeof assetAllocationHistory.$inferSelect;

export const productTypes = pgTable("product_types", {
  id: serial("id").primaryKey(),
  productTypeId: text("product_type_id").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  subCategory: text("sub_category"),
  productNature: text("product_nature").notNull(),
  brand: text("brand"),
  model: text("model"),
  skuCode: text("sku_code").notNull().unique(),
  defaultUnit: text("default_unit").notNull().default("piece"),
  defaultPurchaseCost: decimal("default_purchase_cost", { precision: 12, scale: 2 }),
  defaultSalePrice: decimal("default_sale_price", { precision: 12, scale: 2 }),
  taxCategory: text("tax_category"),
  depreciationApplicable: boolean("depreciation_applicable").notNull().default(false),
  warrantyPeriod: integer("warranty_period"),
  trackSerialNumber: boolean("track_serial_number").notNull().default(false),
  trackMacAddress: boolean("track_mac_address").notNull().default(false),
  requireIpAllocation: boolean("require_ip_allocation").notNull().default(false),
  reorderLevel: integer("reorder_level").default(10),
  minimumStockLevel: integer("minimum_stock_level").default(5),
  description: text("description"),
  visibleInPos: boolean("visible_in_pos").notNull().default(false),
  allowDiscount: boolean("allow_discount").notNull().default(true),
  allowBulkImport: boolean("allow_bulk_import").notNull().default(true),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").default(sql`now()`),
});

export const productTypeCategories = pgTable("product_type_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  parentId: integer("parent_id"),
  color: text("color").default("#3b82f6"),
  description: text("description"),
  depreciationMethod: text("depreciation_method"),
  depreciationRate: decimal("depreciation_rate", { precision: 5, scale: 2 }),
  customAttributes: text("custom_attributes"),
  status: text("status").notNull().default("active"),
});

export const insertProductTypeSchema = createInsertSchema(productTypes).omit({ id: true });
export type InsertProductType = z.infer<typeof insertProductTypeSchema>;
export type ProductType = typeof productTypes.$inferSelect;

export const insertProductTypeCategorySchema = createInsertSchema(productTypeCategories).omit({ id: true });
export type InsertProductTypeCategory = z.infer<typeof insertProductTypeCategorySchema>;
export type ProductTypeCategory = typeof productTypeCategories.$inferSelect;

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  supplierId: text("supplier_id").notNull().unique(),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  officeAddress: text("office_address"),
  city: text("city"),
  country: text("country").default("Pakistan"),
  taxRegistrationNumber: text("tax_registration_number"),
  bankName: text("bank_name"),
  bankAccountTitle: text("bank_account_title"),
  bankAccountNumber: text("bank_account_number"),
  bankBranchCode: text("bank_branch_code"),
  paymentTerms: text("payment_terms").notNull().default("cash"),
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }).default("0"),
  preferredCurrency: text("preferred_currency").default("PKR"),
  productCategoriesSupplied: text("product_categories_supplied"),
  defaultDeliveryDays: integer("default_delivery_days"),
  supplierRating: integer("supplier_rating").default(3),
  notes: text("notes"),
  isPreferredVendor: boolean("is_preferred_vendor").notNull().default(false),
  enableCreditPurchases: boolean("enable_credit_purchases").notNull().default(false),
  requirePoApproval: boolean("require_po_approval").notNull().default(true),
  totalPurchases: decimal("total_purchases", { precision: 14, scale: 2 }).default("0"),
  totalPayments: decimal("total_payments", { precision: 14, scale: 2 }).default("0"),
  outstandingPayable: decimal("outstanding_payable", { precision: 14, scale: 2 }).default("0"),
  lastPaymentDate: text("last_payment_date"),
  lastPurchaseDate: text("last_purchase_date"),
  onTimeDeliveryRate: decimal("on_time_delivery_rate", { precision: 5, scale: 2 }).default("100"),
  orderFulfillmentRate: decimal("order_fulfillment_rate", { precision: 5, scale: 2 }).default("100"),
  qualityIssueRate: decimal("quality_issue_rate", { precision: 5, scale: 2 }).default("0"),
  returnRate: decimal("return_rate", { precision: 5, scale: 2 }).default("0"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true });
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  brandId: text("brand_id").notNull().unique(),
  name: text("name").notNull(),
  countryOfOrigin: text("country_of_origin"),
  officialDistributor: text("official_distributor"),
  warrantyPolicy: text("warranty_policy"),
  notes: text("notes"),
  isPreferred: boolean("is_preferred").notNull().default(false),
  highReliability: boolean("high_reliability").notNull().default(false),
  warrantySupport: boolean("warranty_support").notNull().default(false),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertBrandSchema = createInsertSchema(brands).omit({ id: true });
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brands.$inferSelect;

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  productId: text("product_id").notNull().unique(),
  name: text("name").notNull(),
  productTypeId: integer("product_type_id"),
  brandId: integer("brand_id"),
  model: text("model"),
  skuCode: text("sku_code").notNull().unique(),
  barcode: text("barcode"),
  unitOfMeasure: text("unit_of_measure").default("piece"),
  purchaseCost: decimal("purchase_cost", { precision: 12, scale: 2 }).default("0"),
  salePrice: decimal("sale_price", { precision: 12, scale: 2 }).default("0"),
  taxCategory: text("tax_category"),
  warrantyPeriod: integer("warranty_period"),
  depreciationApplicable: boolean("depreciation_applicable").notNull().default(false),
  trackSerialNumber: boolean("track_serial_number").notNull().default(false),
  trackMacAddress: boolean("track_mac_address").notNull().default(false),
  allowRental: boolean("allow_rental").notNull().default(false),
  allowDiscount: boolean("allow_discount").notNull().default(true),
  minimumStockLevel: integer("minimum_stock_level").default(0),
  reorderLevel: integer("reorder_level").default(10),
  description: text("description"),
  visibleInPos: boolean("visible_in_pos").notNull().default(true),
  visibleInAssets: boolean("visible_in_assets").notNull().default(false),
  currentStock: integer("current_stock").notNull().default(0),
  reservedStock: integer("reserved_stock").notNull().default(0),
  category: text("category"),
  supplierId: integer("supplier_id"),
  status: text("status").notNull().default("in_stock"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNumber: text("po_number").notNull().unique(),
  supplierId: integer("supplier_id").notNull(),
  warehouseDestination: text("warehouse_destination"),
  poDate: text("po_date").notNull(),
  expectedDeliveryDate: text("expected_delivery_date"),
  paymentTerms: text("payment_terms").default("cash"),
  currency: text("currency").default("PKR"),
  linkedAllocationId: text("linked_allocation_id"),
  priorityLevel: text("priority_level").default("normal"),
  approvalRequired: boolean("approval_required").notNull().default(true),
  approvedBy: text("approved_by"),
  approvedDate: text("approved_date"),
  rejectedBy: text("rejected_by"),
  rejectionReason: text("rejection_reason"),
  shippingCost: decimal("shipping_cost", { precision: 12, scale: 2 }).default("0"),
  additionalCharges: decimal("additional_charges", { precision: 12, scale: 2 }).default("0"),
  subtotal: decimal("subtotal", { precision: 14, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
  grandTotal: decimal("grand_total", { precision: 14, scale: 2 }).default("0"),
  receivedAmount: decimal("received_amount", { precision: 14, scale: 2 }).default("0"),
  paidAmount: decimal("paid_amount", { precision: 14, scale: 2 }).default("0"),
  paymentStatus: text("payment_status").default("unpaid"),
  paymentDueDate: text("payment_due_date"),
  notes: text("notes"),
  createdBy: text("created_by"),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({ id: true });
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").notNull(),
  productId: integer("product_id"),
  productName: text("product_name").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
  discount: decimal("discount", { precision: 5, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 5, scale: 2 }).default("0"),
  subtotal: decimal("subtotal", { precision: 14, scale: 2 }).default("0"),
  receivedQuantity: integer("received_quantity").default(0),
  damagedQuantity: integer("damaged_quantity").default(0),
  shortQuantity: integer("short_quantity").default(0),
  serialNumbers: text("serial_numbers"),
  inspectionStatus: text("inspection_status").default("pending"),
});

export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({ id: true });
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;

export const stockLocations = pgTable("stock_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  locationType: text("location_type").notNull().default("warehouse"),
  address: text("address"),
  manager: text("manager"),
  capacity: integer("capacity"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertStockLocationSchema = createInsertSchema(stockLocations).omit({ id: true });
export type InsertStockLocation = z.infer<typeof insertStockLocationSchema>;
export type StockLocation = typeof stockLocations.$inferSelect;

export const stockItems = pgTable("stock_items", {
  id: serial("id").primaryKey(),
  productId: integer("product_id"),
  productName: text("product_name").notNull(),
  brandName: text("brand_name"),
  category: text("category"),
  skuCode: text("sku_code"),
  locationId: integer("location_id"),
  locationName: text("location_name").default("Main Warehouse"),
  currentQuantity: integer("current_quantity").notNull().default(0),
  reservedQuantity: integer("reserved_quantity").notNull().default(0),
  inTransitQuantity: integer("in_transit_quantity").notNull().default(0),
  availableQuantity: integer("available_quantity").notNull().default(0),
  reorderLevel: integer("reorder_level").default(10),
  minimumStock: integer("minimum_stock").default(5),
  averageCost: decimal("average_cost", { precision: 12, scale: 2 }).default("0"),
  totalValue: decimal("total_value", { precision: 14, scale: 2 }).default("0"),
  lastReceivedDate: text("last_received_date"),
  lastIssuedDate: text("last_issued_date"),
  status: text("status").notNull().default("healthy"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertStockItemSchema = createInsertSchema(stockItems).omit({ id: true });
export type InsertStockItem = z.infer<typeof insertStockItemSchema>;
export type StockItem = typeof stockItems.$inferSelect;

export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  movementId: text("movement_id").notNull().unique(),
  stockItemId: integer("stock_item_id").notNull(),
  movementType: text("movement_type").notNull(),
  referenceId: text("reference_id"),
  productName: text("product_name"),
  locationName: text("location_name"),
  quantityIn: integer("quantity_in").default(0),
  quantityOut: integer("quantity_out").default(0),
  balanceAfter: integer("balance_after").default(0),
  performedBy: text("performed_by"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({ id: true });
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;

export const stockAdjustments = pgTable("stock_adjustments", {
  id: serial("id").primaryKey(),
  adjustmentId: text("adjustment_id").notNull().unique(),
  stockItemId: integer("stock_item_id").notNull(),
  productName: text("product_name"),
  locationName: text("location_name"),
  adjustmentType: text("adjustment_type").notNull(),
  quantityBefore: integer("quantity_before").notNull().default(0),
  quantityAdjustment: integer("quantity_adjustment").notNull().default(0),
  quantityAfter: integer("quantity_after").notNull().default(0),
  reason: text("reason").notNull(),
  approvalRequired: boolean("approval_required").notNull().default(false),
  approvalStatus: text("approval_status").default("pending"),
  approvedBy: text("approved_by"),
  approvedDate: text("approved_date"),
  performedBy: text("performed_by"),
  supportingDocument: text("supporting_document"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertStockAdjustmentSchema = createInsertSchema(stockAdjustments).omit({ id: true });
export type InsertStockAdjustment = z.infer<typeof insertStockAdjustmentSchema>;
export type StockAdjustment = typeof stockAdjustments.$inferSelect;

export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  batchNumber: text("batch_number").notNull().unique(),
  productId: integer("product_id"),
  productName: text("product_name").notNull(),
  skuCode: text("sku_code"),
  warehouseId: integer("warehouse_id"),
  warehouseName: text("warehouse_name"),
  quantity: integer("quantity").notNull().default(0),
  available: integer("available").notNull().default(0),
  reserved: integer("reserved").notNull().default(0),
  allocated: integer("allocated").notNull().default(0),
  unitCost: decimal("unit_cost", { precision: 12, scale: 2 }).default("0"),
  manufacturingDate: text("manufacturing_date"),
  expiryDate: text("expiry_date"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertBatchSchema = createInsertSchema(batches).omit({ id: true });
export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type Batch = typeof batches.$inferSelect;

export const serialNumbers = pgTable("serial_numbers", {
  id: serial("id").primaryKey(),
  serialNumber: text("serial_number").notNull().unique(),
  macAddress: text("mac_address"),
  imei: text("imei"),
  batchId: integer("batch_id"),
  batchNumber: text("batch_number"),
  productId: integer("product_id"),
  productName: text("product_name").notNull(),
  skuCode: text("sku_code"),
  warehouseId: integer("warehouse_id"),
  warehouseName: text("warehouse_name"),
  status: text("status").notNull().default("available"),
  assignedCustomerId: integer("assigned_customer_id"),
  assignedCustomerName: text("assigned_customer_name"),
  invoiceReference: text("invoice_reference"),
  warrantyStartDate: text("warranty_start_date"),
  warrantyExpiry: text("warranty_expiry"),
  lastMovementDate: text("last_movement_date"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertSerialNumberSchema = createInsertSchema(serialNumbers).omit({ id: true });
export type InsertSerialNumber = z.infer<typeof insertSerialNumberSchema>;
export type SerialNumber = typeof serialNumbers.$inferSelect;

export const serialMovements = pgTable("serial_movements", {
  id: serial("id").primaryKey(),
  serialId: integer("serial_id").notNull(),
  serialNumber: text("serial_number").notNull(),
  referenceType: text("reference_type").notNull(),
  referenceId: text("reference_id"),
  sourceWarehouse: text("source_warehouse"),
  destinationWarehouse: text("destination_warehouse"),
  customerName: text("customer_name"),
  performedBy: text("performed_by"),
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertSerialMovementSchema = createInsertSchema(serialMovements).omit({ id: true });
export type InsertSerialMovement = z.infer<typeof insertSerialMovementSchema>;
export type SerialMovement = typeof serialMovements.$inferSelect;

export const notificationTypes = pgTable("notification_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  moduleSource: text("module_source").notNull(),
  eventTrigger: text("event_trigger").notNull(),
  triggerCondition: text("trigger_condition"),
  deliveryChannels: text("delivery_channels").array().default(sql`ARRAY['in_app']::text[]`),
  priorityLevel: text("priority_level").notNull().default("medium"),
  audienceType: text("audience_type").notNull().default("all"),
  audienceRoles: text("audience_roles").array(),
  audienceUsers: text("audience_users").array(),
  emailTemplate: text("email_template"),
  emailSubject: text("email_subject"),
  smsTemplate: text("sms_template"),
  inAppMessage: text("in_app_message"),
  whatsappTemplate: text("whatsapp_template"),
  pushTitle: text("push_title"),
  pushBody: text("push_body"),
  dynamicVariables: text("dynamic_variables"),
  triggerType: text("trigger_type").notNull().default("event"),
  triggerEvent: text("trigger_event"),
  delayMinutes: integer("delay_minutes").default(0),
  escalationEnabled: boolean("escalation_enabled").default(false),
  escalationLevels: text("escalation_levels"),
  escalationTimeoutMinutes: integer("escalation_timeout_minutes").default(60),
  repeatEnabled: boolean("repeat_enabled").default(false),
  repeatIntervalMinutes: integer("repeat_interval_minutes"),
  repeatMaxCount: integer("repeat_max_count"),
  lastTriggered: text("last_triggered"),
  triggerCount: integer("trigger_count").default(0),
  failedCount: integer("failed_count").default(0),
  successCount: integer("success_count").default(0),
  status: text("status").notNull().default("active"),
  createdBy: text("created_by"),
  lastModified: text("last_modified").default(sql`now()`),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertNotificationTypeSchema = createInsertSchema(notificationTypes).omit({ id: true });
export type InsertNotificationType = z.infer<typeof insertNotificationTypeSchema>;
export type NotificationType = typeof notificationTypes.$inferSelect;

export const pushNotifications = pgTable("push_notifications", {
  id: serial("id").primaryKey(),
  pushId: text("push_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  module: text("module"),
  priority: text("priority").notNull().default("medium"),
  icon: text("icon"),
  imageBanner: text("image_banner"),
  audienceType: text("audience_type").notNull().default("all"),
  audienceValue: text("audience_value"),
  triggerType: text("trigger_type").notNull().default("manual"),
  scheduledAt: text("scheduled_at"),
  recurringPattern: text("recurring_pattern"),
  deepLink: text("deep_link"),
  expiryTime: text("expiry_time"),
  silentPush: boolean("silent_push").default(false),
  requireAcknowledgment: boolean("require_acknowledgment").default(false),
  status: text("status").notNull().default("draft"),
  deviceTargets: text("device_targets").default("all"),
  deliveryCount: integer("delivery_count").default(0),
  clickCount: integer("click_count").default(0),
  failedCount: integer("failed_count").default(0),
  acknowledgedCount: integer("acknowledged_count").default(0),
  sentAt: text("sent_at"),
  createdBy: text("created_by"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertPushNotificationSchema = createInsertSchema(pushNotifications).omit({ id: true });
export type InsertPushNotification = z.infer<typeof insertPushNotificationSchema>;
export type PushNotification = typeof pushNotifications.$inferSelect;

export const bulkCampaigns = pgTable("bulk_campaigns", {
  id: serial("id").primaryKey(),
  campaignId: text("campaign_id").notNull(),
  name: text("name").notNull(),
  campaignType: text("campaign_type").notNull().default("operational"),
  priority: text("priority").notNull().default("medium"),
  module: text("module"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  bannerImage: text("banner_image"),
  icon: text("icon"),
  deepLink: text("deep_link"),
  audienceType: text("audience_type").notNull().default("all_users"),
  audienceValue: text("audience_value"),
  audienceCount: integer("audience_count").default(0),
  schedulingType: text("scheduling_type").notNull().default("immediate"),
  scheduledAt: text("scheduled_at"),
  recurringPattern: text("recurring_pattern"),
  timezone: text("timezone").default("Asia/Karachi"),
  expiryTime: text("expiry_time"),
  requireAcknowledgment: boolean("require_acknowledgment").default(false),
  frequencyCap: integer("frequency_cap"),
  deviceTargets: text("device_targets").default("all"),
  status: text("status").notNull().default("draft"),
  totalTargeted: integer("total_targeted").default(0),
  totalDelivered: integer("total_delivered").default(0),
  totalFailed: integer("total_failed").default(0),
  totalOpened: integer("total_opened").default(0),
  totalClicked: integer("total_clicked").default(0),
  totalAcknowledged: integer("total_acknowledged").default(0),
  sentAt: text("sent_at"),
  completedAt: text("completed_at"),
  createdBy: text("created_by"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertBulkCampaignSchema = createInsertSchema(bulkCampaigns).omit({ id: true });
export type InsertBulkCampaign = z.infer<typeof insertBulkCampaignSchema>;
export type BulkCampaign = typeof bulkCampaigns.$inferSelect;

export const smsProviders = pgTable("sms_providers", {
  id: serial("id").primaryKey(),
  providerId: text("provider_id").notNull(),
  name: text("name").notNull(),
  apiBaseUrl: text("api_base_url").notNull(),
  apiKey: text("api_key").notNull(),
  secretKey: text("secret_key"),
  senderId: text("sender_id"),
  routeType: text("route_type").notNull().default("transactional"),
  countryCode: text("country_code").default("+92"),
  encoding: text("encoding").default("gsm"),
  rateLimit: integer("rate_limit").default(100),
  fallbackProvider: text("fallback_provider"),
  retryAttempts: integer("retry_attempts").default(3),
  timeoutDuration: integer("timeout_duration").default(30),
  callbackUrl: text("callback_url"),
  ipWhitelist: text("ip_whitelist"),
  testMode: boolean("test_mode").default(false),
  status: text("status").notNull().default("configured"),
  priority: integer("priority").default(1),
  messagesSent: integer("messages_sent").default(0),
  messagesDelivered: integer("messages_delivered").default(0),
  messagesFailed: integer("messages_failed").default(0),
  totalCost: text("total_cost").default("0.00"),
  lastSyncAt: text("last_sync_at"),
  createdBy: text("created_by"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertSmsProviderSchema = createInsertSchema(smsProviders).omit({ id: true });
export type InsertSmsProvider = z.infer<typeof insertSmsProviderSchema>;
export type SmsProvider = typeof smsProviders.$inferSelect;

export const emailProviders = pgTable("email_providers", {
  id: serial("id").primaryKey(),
  providerId: text("provider_id").notNull(),
  name: text("name").notNull(),
  providerType: text("provider_type").notNull().default("smtp"),
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  encryption: text("encryption").default("tls"),
  username: text("username"),
  password: text("password"),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  apiEndpoint: text("api_endpoint"),
  apiKey: text("api_key"),
  domain: text("domain"),
  webhookUrl: text("webhook_url"),
  dkimStatus: text("dkim_status").default("unchecked"),
  spfStatus: text("spf_status").default("unchecked"),
  bounceHandling: boolean("bounce_handling").default(true),
  throttleRate: integer("throttle_rate").default(50),
  bulkRate: integer("bulk_rate").default(200),
  fallbackProvider: text("fallback_provider"),
  retryAttempts: integer("retry_attempts").default(3),
  timeoutDuration: integer("timeout_duration").default(30),
  testMode: boolean("test_mode").default(false),
  status: text("status").notNull().default("configured"),
  priority: integer("priority").default(1),
  emailsSent: integer("emails_sent").default(0),
  emailsDelivered: integer("emails_delivered").default(0),
  emailsFailed: integer("emails_failed").default(0),
  emailsBounced: integer("emails_bounced").default(0),
  totalCost: text("total_cost").default("0.00"),
  lastSyncAt: text("last_sync_at"),
  createdBy: text("created_by"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertEmailProviderSchema = createInsertSchema(emailProviders).omit({ id: true });
export type InsertEmailProvider = z.infer<typeof insertEmailProviderSchema>;
export type EmailProvider = typeof emailProviders.$inferSelect;

export const whatsappProviders = pgTable("whatsapp_providers", {
  id: serial("id").primaryKey(),
  providerId: text("provider_id").notNull(),
  name: text("name").notNull(),
  providerType: text("provider_type").notNull().default("cloud_api"),
  businessAccountId: text("business_account_id"),
  phoneNumberId: text("phone_number_id"),
  displayPhoneNumber: text("display_phone_number"),
  apiBaseUrl: text("api_base_url").notNull().default("https://graph.facebook.com/v18.0"),
  accessToken: text("access_token"),
  appSecret: text("app_secret"),
  webhookVerifyToken: text("webhook_verify_token"),
  webhookUrl: text("webhook_url"),
  businessName: text("business_name"),
  businessVerified: boolean("business_verified").default(false),
  qualityRating: text("quality_rating").default("unknown"),
  messagingLimit: text("messaging_limit").default("1k"),
  rateLimit: integer("rate_limit").default(80),
  templateNamespace: text("template_namespace"),
  defaultLanguage: text("default_language").default("en"),
  fallbackProvider: text("fallback_provider"),
  retryAttempts: integer("retry_attempts").default(3),
  timeoutDuration: integer("timeout_duration").default(30),
  testMode: boolean("test_mode").default(false),
  status: text("status").notNull().default("configured"),
  priority: integer("priority").default(1),
  messagesSent: integer("messages_sent").default(0),
  messagesDelivered: integer("messages_delivered").default(0),
  messagesRead: integer("messages_read").default(0),
  messagesFailed: integer("messages_failed").default(0),
  totalCost: text("total_cost").default("0.00"),
  lastSyncAt: text("last_sync_at"),
  createdBy: text("created_by"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertWhatsappProviderSchema = createInsertSchema(whatsappProviders).omit({ id: true });
export type InsertWhatsappProvider = z.infer<typeof insertWhatsappProviderSchema>;
export type WhatsappProvider = typeof whatsappProviders.$inferSelect;

export const messageLogs = pgTable("message_logs", {
  id: serial("id").primaryKey(),
  messageId: text("message_id").notNull(),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerId: integer("provider_id"),
  recipient: text("recipient").notNull(),
  subject: text("subject"),
  body: text("body"),
  module: text("module"),
  campaign: text("campaign"),
  status: text("status").notNull().default("pending"),
  sentAt: text("sent_at"),
  deliveredAt: text("delivered_at"),
  failureReason: text("failure_reason"),
  cost: text("cost").default("0.00"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertMessageLogSchema = createInsertSchema(messageLogs).omit({ id: true });
export type InsertMessageLog = z.infer<typeof insertMessageLogSchema>;
export type MessageLog = typeof messageLogs.$inferSelect;

export const generalSettings = pgTable("general_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value"),
  category: text("category").notNull(),
  label: text("label"),
  description: text("description"),
  fieldType: text("field_type").default("text"),
  updatedAt: text("updated_at").default(sql`now()`),
  updatedBy: text("updated_by"),
});

export const insertGeneralSettingSchema = createInsertSchema(generalSettings).omit({ id: true });
export type InsertGeneralSetting = z.infer<typeof insertGeneralSettingSchema>;
export type GeneralSetting = typeof generalSettings.$inferSelect;

export const hrmRoles = pgTable("hrm_roles", {
  id: serial("id").primaryKey(),
  roleId: text("role_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isSystem: boolean("is_system").default(false),
  isArchived: boolean("is_archived").default(false),
  totalModules: integer("total_modules").default(0),
  fullAccessModules: integer("full_access_modules").default(0),
  limitedAccessModules: integer("limited_access_modules").default(0),
  appAccessEnabled: boolean("app_access_enabled").default(true),
  webAccessEnabled: boolean("web_access_enabled").default(true),
  createdBy: text("created_by"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
  updatedBy: text("updated_by"),
});

export const insertHrmRoleSchema = createInsertSchema(hrmRoles).omit({ id: true });
export type InsertHrmRole = z.infer<typeof insertHrmRoleSchema>;
export type HrmRole = typeof hrmRoles.$inferSelect;

export const hrmPermissions = pgTable("hrm_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull(),
  module: text("module").notNull(),
  submenu: text("submenu"),
  canView: boolean("can_view").default(false),
  canCreate: boolean("can_create").default(false),
  canEdit: boolean("can_edit").default(false),
  canDelete: boolean("can_delete").default(false),
  canApprove: boolean("can_approve").default(false),
  canExport: boolean("can_export").default(false),
  canPrint: boolean("can_print").default(false),
  webAccess: boolean("web_access").default(true),
  appAccess: boolean("app_access").default(false),
  dataScope: text("data_scope").default("all"),
  conditions: text("conditions"),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertHrmPermissionSchema = createInsertSchema(hrmPermissions).omit({ id: true });
export type InsertHrmPermission = z.infer<typeof insertHrmPermissionSchema>;
export type HrmPermission = typeof hrmPermissions.$inferSelect;

export const customerGroups = pgTable("customer_groups", {
  id: serial("id").primaryKey(),
  groupId: text("group_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  groupType: text("group_type").default("custom"),
  isSystem: boolean("is_system").default(false),
  isArchived: boolean("is_archived").default(false),
  totalCustomers: integer("total_customers").default(0),
  appAccessEnabled: boolean("app_access_enabled").default(true),
  webAccessEnabled: boolean("web_access_enabled").default(true),
  activeRestrictions: integer("active_restrictions").default(0),
  createdBy: text("created_by"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
  updatedBy: text("updated_by"),
});

export const insertCustomerGroupSchema = createInsertSchema(customerGroups).omit({ id: true });
export type InsertCustomerGroup = z.infer<typeof insertCustomerGroupSchema>;
export type CustomerGroup = typeof customerGroups.$inferSelect;

export const customerRights = pgTable("customer_rights", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  category: text("category").notNull(),
  featureKey: text("feature_key").notNull(),
  enabled: boolean("enabled").default(false),
  webAccess: boolean("web_access").default(true),
  appAccess: boolean("app_access").default(false),
  conditions: text("conditions"),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertCustomerRightSchema = createInsertSchema(customerRights).omit({ id: true });
export type InsertCustomerRight = z.infer<typeof insertCustomerRightSchema>;
export type CustomerRight = typeof customerRights.$inferSelect;

export const invoiceTemplates = pgTable("invoice_templates", {
  id: serial("id").primaryKey(),
  templateId: text("template_id").notNull(),
  name: text("name").notNull(),
  invoiceCategory: text("invoice_category").notNull().default("customer"),
  templateType: text("template_type").default("standard"),
  status: text("status").default("draft"),
  isDefault: boolean("is_default").default(false),
  assignedCustomerGroup: text("assigned_customer_group"),
  assignedBranch: text("assigned_branch"),
  headerShowLogo: boolean("header_show_logo").default(true),
  headerShowCompanyDetails: boolean("header_show_company_details").default(true),
  headerShowTaxReg: boolean("header_show_tax_reg").default(true),
  headerShowContact: boolean("header_show_contact").default(true),
  headerCustomText: text("header_custom_text"),
  invoiceShowNumber: boolean("invoice_show_number").default(true),
  invoiceShowDate: boolean("invoice_show_date").default(true),
  invoiceShowDueDate: boolean("invoice_show_due_date").default(true),
  invoiceShowPaymentTerms: boolean("invoice_show_payment_terms").default(true),
  invoiceShowCustomerId: boolean("invoice_show_customer_id").default(true),
  customerShowName: boolean("customer_show_name").default(true),
  customerShowAddress: boolean("customer_show_address").default(true),
  customerShowContact: boolean("customer_show_contact").default(true),
  customerShowAccount: boolean("customer_show_account").default(true),
  itemShowDescription: boolean("item_show_description").default(true),
  itemShowSku: boolean("item_show_sku").default(false),
  itemShowQty: boolean("item_show_qty").default(true),
  itemShowUnitPrice: boolean("item_show_unit_price").default(true),
  itemShowDiscount: boolean("item_show_discount").default(true),
  itemShowTax: boolean("item_show_tax").default(true),
  itemShowSubtotal: boolean("item_show_subtotal").default(true),
  itemShowTotal: boolean("item_show_total").default(true),
  footerShowNotes: boolean("footer_show_notes").default(true),
  footerShowBankDetails: boolean("footer_show_bank_details").default(true),
  footerShowQrCode: boolean("footer_show_qr_code").default(false),
  footerShowSignature: boolean("footer_show_signature").default(true),
  footerShowTerms: boolean("footer_show_terms").default(true),
  footerCustomText: text("footer_custom_text"),
  footerTermsText: text("footer_terms_text"),
  footerBankDetailsText: text("footer_bank_details_text"),
  footerNotesText: text("footer_notes_text"),
  taxMode: text("tax_mode").default("exclusive"),
  multiTaxSupport: boolean("multi_tax_support").default(false),
  taxLabel: text("tax_label").default("Tax"),
  currencySymbol: text("currency_symbol").default("Rs."),
  currencyPosition: text("currency_position").default("before"),
  decimalPrecision: integer("decimal_precision").default(2),
  roundingRule: text("rounding_rule").default("standard"),
  showDiscountColumn: boolean("show_discount_column").default(true),
  showTaxBreakdown: boolean("show_tax_breakdown").default(true),
  showGrandTotalWords: boolean("show_grand_total_words").default(false),
  multiCurrency: boolean("multi_currency").default(false),
  withholdingTax: boolean("withholding_tax").default(false),
  lateFeeDisplay: boolean("late_fee_display").default(false),
  primaryColor: text("primary_color").default("#334155"),
  accentColor: text("accent_color").default("#2563EB"),
  fontFamily: text("font_family").default("Inter"),
  fontSize: text("font_size").default("12px"),
  tableHeaderStyle: text("table_header_style").default("filled"),
  borderStyle: text("border_style").default("solid"),
  watermarkText: text("watermark_text"),
  showCompanySeal: boolean("show_company_seal").default(false),
  logoPosition: text("logo_position").default("left"),
  pageSize: text("page_size").default("A4"),
  pageOrientation: text("page_orientation").default("portrait"),
  marginTop: text("margin_top").default("20mm"),
  marginBottom: text("margin_bottom").default("20mm"),
  marginLeft: text("margin_left").default("15mm"),
  marginRight: text("margin_right").default("15mm"),
  showPageNumbers: boolean("show_page_numbers").default(true),
  showQrPaymentLink: boolean("show_qr_payment_link").default(false),
  showBarcode: boolean("show_barcode").default(false),
  emailReady: boolean("email_ready").default(true),
  signatureUploadUrl: text("signature_upload_url"),
  autoDigitalStamp: boolean("auto_digital_stamp").default(false),
  createdBy: text("created_by"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertInvoiceTemplateSchema = createInsertSchema(invoiceTemplates).omit({ id: true });
export type InsertInvoiceTemplate = z.infer<typeof insertInvoiceTemplateSchema>;
export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;

export const notificationChannels = pgTable("notification_channels", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull(),
  name: text("name").notNull(),
  channelType: text("channel_type").notNull(),
  enabled: boolean("enabled").notNull().default(false),
  apiStatus: text("api_status").default("disconnected"),
  deliveryTimeout: integer("delivery_timeout").default(30),
  retryAttempts: integer("retry_attempts").default(3),
  fallbackChannel: text("fallback_channel"),
  templateMapping: text("template_mapping"),
  priority: integer("priority").default(0),
  config: text("config"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertNotificationChannelSchema = createInsertSchema(notificationChannels).omit({ id: true });
export type InsertNotificationChannel = z.infer<typeof insertNotificationChannelSchema>;
export type NotificationChannel = typeof notificationChannels.$inferSelect;

export const notificationTriggers = pgTable("notification_triggers", {
  id: serial("id").primaryKey(),
  triggerId: text("trigger_id").notNull(),
  eventName: text("event_name").notNull(),
  eventCategory: text("event_category").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  channels: text("channels").default("[]"),
  priority: text("priority").default("normal"),
  messageTemplate: text("message_template"),
  delay: text("delay").default("instant"),
  delayMinutes: integer("delay_minutes").default(0),
  roleBasedTrigger: boolean("role_based_trigger").default(false),
  targetRoles: text("target_roles").default("[]"),
  customerGroupTrigger: boolean("customer_group_trigger").default(false),
  targetCustomerGroups: text("target_customer_groups").default("[]"),
  branchSpecific: boolean("branch_specific").default(false),
  targetBranches: text("target_branches").default("[]"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertNotificationTriggerSchema = createInsertSchema(notificationTriggers).omit({ id: true });
export type InsertNotificationTrigger = z.infer<typeof insertNotificationTriggerSchema>;
export type NotificationTrigger = typeof notificationTriggers.$inferSelect;

export const notificationLogs = pgTable("notification_logs", {
  id: serial("id").primaryKey(),
  logId: text("log_id").notNull(),
  triggerId: text("trigger_id"),
  channelType: text("channel_type").notNull(),
  recipient: text("recipient"),
  subject: text("subject"),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  apiResponse: text("api_response"),
  retryCount: integer("retry_count").default(0),
  sentAt: text("sent_at"),
  deliveredAt: text("delivered_at"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertNotificationLogSchema = createInsertSchema(notificationLogs).omit({ id: true });
export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;
export type NotificationLog = typeof notificationLogs.$inferSelect;

export const gatewayWebhooks = pgTable("gateway_webhooks", {
  id: serial("id").primaryKey(),
  webhookId: text("webhook_id").notNull(),
  gatewayId: integer("gateway_id").notNull(),
  eventType: text("event_type").notNull(),
  webhookUrl: text("webhook_url").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  retryOnFailure: boolean("retry_on_failure").default(true),
  maxRetries: integer("max_retries").default(3),
  notifyAdminOnFailure: boolean("notify_admin_on_failure").default(true),
  lastTriggered: text("last_triggered"),
  lastStatus: text("last_status"),
  totalDelivered: integer("total_delivered").default(0),
  totalFailed: integer("total_failed").default(0),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertGatewayWebhookSchema = createInsertSchema(gatewayWebhooks).omit({ id: true });
export type InsertGatewayWebhook = z.infer<typeof insertGatewayWebhookSchema>;
export type GatewayWebhook = typeof gatewayWebhooks.$inferSelect;

export const gatewaySettlements = pgTable("gateway_settlements", {
  id: serial("id").primaryKey(),
  settlementId: text("settlement_id").notNull(),
  gatewayId: integer("gateway_id").notNull(),
  transactionFeePercent: decimal("transaction_fee_percent", { precision: 5, scale: 2 }).default("0"),
  fixedFee: decimal("fixed_fee", { precision: 10, scale: 2 }).default("0"),
  settlementCycle: text("settlement_cycle").default("daily"),
  autoFeeDeduction: boolean("auto_fee_deduction").default(true),
  taxOnTransaction: decimal("tax_on_transaction", { precision: 5, scale: 2 }).default("0"),
  grossAmount: decimal("gross_amount", { precision: 14, scale: 2 }).default("0"),
  gatewayFee: decimal("gateway_fee", { precision: 12, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
  netAmount: decimal("net_amount", { precision: 14, scale: 2 }).default("0"),
  status: text("status").default("pending"),
  periodStart: text("period_start"),
  periodEnd: text("period_end"),
  settledAt: text("settled_at"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertGatewaySettlementSchema = createInsertSchema(gatewaySettlements).omit({ id: true });
export type InsertGatewaySettlement = z.infer<typeof insertGatewaySettlementSchema>;
export type GatewaySettlement = typeof gatewaySettlements.$inferSelect;

export const pushMessages = pgTable("push_messages", {
  id: serial("id").primaryKey(),
  messageId: text("message_id").notNull(),
  channel: text("channel").notNull().default("sim_sms"),
  recipientType: text("recipient_type").notNull().default("individual"),
  recipientValue: text("recipient_value"),
  recipientNames: text("recipient_names"),
  recipientCount: integer("recipient_count").default(1),
  subject: text("subject"),
  body: text("body").notNull(),
  templateId: text("template_id"),
  variables: text("variables"),
  mediaUrl: text("media_url"),
  ctaButton: text("cta_button"),
  paymentLink: boolean("payment_link").default(false),
  scheduledAt: text("scheduled_at"),
  expiryAt: text("expiry_at"),
  recurring: boolean("recurring").default(false),
  recurringPattern: text("recurring_pattern"),
  batchSize: integer("batch_size").default(50),
  sendingSpeed: integer("sending_speed").default(10),
  channelPriority: text("channel_priority").default("sim_sms"),
  fallbackChannel: text("fallback_channel"),
  campaignName: text("campaign_name"),
  status: text("status").notNull().default("draft"),
  totalSent: integer("total_sent").default(0),
  totalDelivered: integer("total_delivered").default(0),
  totalFailed: integer("total_failed").default(0),
  totalPending: integer("total_pending").default(0),
  sentAt: text("sent_at"),
  completedAt: text("completed_at"),
  createdBy: text("created_by"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertPushMessageSchema = createInsertSchema(pushMessages).omit({ id: true });
export type InsertPushMessage = z.infer<typeof insertPushMessageSchema>;
export type PushMessage = typeof pushMessages.$inferSelect;

export const fiberRoutes = pgTable("fiber_routes", {
  id: serial("id").primaryKey(),
  routeId: text("route_id").notNull().unique(),
  name: text("name").notNull(),
  coordinates: text("coordinates").notNull(),
  oltId: integer("olt_id"),
  fiberCoreCount: integer("fiber_core_count").default(12),
  usedFibers: integer("used_fibers").default(0),
  totalLengthM: decimal("total_length_m").default("0"),
  cableType: text("cable_type").default("single_mode"),
  status: text("status").notNull().default("active"),
  color: text("color").default("#3B82F6"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertFiberRouteSchema = createInsertSchema(fiberRoutes).omit({ id: true });
export type InsertFiberRoute = z.infer<typeof insertFiberRouteSchema>;
export type FiberRoute = typeof fiberRoutes.$inferSelect;

export const networkTowers = pgTable("network_towers", {
  id: serial("id").primaryKey(),
  towerId: text("tower_id").notNull().unique(),
  name: text("name").notNull(),
  lat: decimal("lat").notNull(),
  lng: decimal("lng").notNull(),
  height: decimal("height").default("30"),
  towerType: text("tower_type").default("monopole"),
  status: text("status").notNull().default("active"),
  address: text("address"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertNetworkTowerSchema = createInsertSchema(networkTowers).omit({ id: true });
export type InsertNetworkTower = z.infer<typeof insertNetworkTowerSchema>;
export type NetworkTower = typeof networkTowers.$inferSelect;

export const oltDevices = pgTable("olt_devices", {
  id: serial("id").primaryKey(),
  oltId: text("olt_id").notNull().unique(),
  name: text("name").notNull(),
  lat: decimal("lat").notNull(),
  lng: decimal("lng").notNull(),
  ipAddress: text("ip_address"),
  vendor: text("vendor").default("Huawei"),
  model: text("model"),
  totalPonPorts: integer("total_pon_ports").default(16),
  usedPonPorts: integer("used_pon_ports").default(0),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertOltDeviceSchema = createInsertSchema(oltDevices).omit({ id: true });
export type InsertOltDevice = z.infer<typeof insertOltDeviceSchema>;
export type OltDevice = typeof oltDevices.$inferSelect;

export const gponSplitters = pgTable("gpon_splitters", {
  id: serial("id").primaryKey(),
  splitterId: text("splitter_id").notNull().unique(),
  name: text("name").notNull(),
  lat: decimal("lat").notNull(),
  lng: decimal("lng").notNull(),
  oltId: integer("olt_id"),
  ponPort: integer("pon_port"),
  splitRatio: text("split_ratio").notNull().default("1:8"),
  usedPorts: integer("used_ports").default(0),
  fiberRouteId: integer("fiber_route_id"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertGponSplitterSchema = createInsertSchema(gponSplitters).omit({ id: true });
export type InsertGponSplitter = z.infer<typeof insertGponSplitterSchema>;
export type GponSplitter = typeof gponSplitters.$inferSelect;

export const onuDevices = pgTable("onu_devices", {
  id: serial("id").primaryKey(),
  onuId: text("onu_id").notNull().unique(),
  serialNumber: text("serial_number"),
  macAddress: text("mac_address"),
  customerId: integer("customer_id"),
  splitterId: integer("splitter_id"),
  splitterPort: integer("splitter_port"),
  lat: decimal("lat").notNull(),
  lng: decimal("lng").notNull(),
  opticalPower: decimal("optical_power"),
  servicePlan: text("service_plan"),
  ipAddress: text("ip_address"),
  status: text("status").notNull().default("online"),
  activationDate: text("activation_date"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertOnuDeviceSchema = createInsertSchema(onuDevices).omit({ id: true });
export type InsertOnuDevice = z.infer<typeof insertOnuDeviceSchema>;
export type OnuDevice = typeof onuDevices.$inferSelect;

export const p2pLinks = pgTable("p2p_links", {
  id: serial("id").primaryKey(),
  linkId: text("link_id").notNull().unique(),
  name: text("name").notNull(),
  towerAId: integer("tower_a_id"),
  towerBId: integer("tower_b_id"),
  towerALat: decimal("tower_a_lat").notNull(),
  towerALng: decimal("tower_a_lng").notNull(),
  towerBLat: decimal("tower_b_lat").notNull(),
  towerBLng: decimal("tower_b_lng").notNull(),
  frequencyBand: text("frequency_band").default("5GHz"),
  bandwidthMbps: integer("bandwidth_mbps").default(100),
  distanceKm: decimal("distance_km"),
  rssi: decimal("rssi"),
  latencyMs: decimal("latency_ms"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
})

export const insertP2pLinkSchema = createInsertSchema(p2pLinks).omit({ id: true });
export type InsertP2pLink = z.infer<typeof insertP2pLinkSchema>;
export type P2pLink = typeof p2pLinks.$inferSelect;
