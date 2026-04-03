import { eq, desc, sql, and, count, aliasedTable, isNull } from "drizzle-orm";
import { db } from "./db";
import {
  users, customers, packages, invoices, tickets, activityLogs,
  areas, vendors, resellers, accountTypes, accounts, transactions, budgets, budgetAllocations, tasks,
  assetTypes, assets, assetTransfers, inventoryItems, employees, roles, companySettings,
  notifications, reports, settings, customerConnections,
  notificationTemplates, smtpSettings, smsSettings, notificationDispatches, branches,
  vendorWalletTransactions, resellerWalletTransactions, resellerMonthlySummaries, vendorPackages, vendorBandwidthLinks, bandwidthChangeHistory, customerQueries, customerQueryLogs, supportCategories, invoiceItems,
  expenses, attendance, attendanceBreaks, leaves, holidays, auditLogs, taskActivityLogs, creditNotes, bulkMessages, ipAddresses, subnets, vlans, ipamLogs, outages, outageTimeline,
  networkDevices, pppoeUsers, radiusProfiles, radiusNasDevices, radiusAuthLogs, paymentGateways, payments, billingRules, bandwidthUsage, dailyCollections, salaryHistory, advanceLoans, loanInstallments, payroll, salaryPayments, bonusCommissions, commissionTypes, employeeTypes, shifts, shiftAssignments,
  transactionTypes,
  type User, type InsertUser,
  type Customer, type InsertCustomer,
  type Package, type InsertPackage,
  type Invoice, type InsertInvoice,
  type Ticket, type InsertTicket,
  type ActivityLog, type InsertActivityLog,
  type Area, type InsertArea,
  type Vendor, type InsertVendor,
  type Reseller, type InsertReseller,
  type AccountType, type InsertAccountType,
  type Account, type InsertAccount,
  type Transaction, type InsertTransaction,
  type Budget, type InsertBudget,
  type BudgetAllocation, type InsertBudgetAllocation,
  type Task, type InsertTask,
  type AssetType, type InsertAssetType,
  type Asset, type InsertAsset,
  type AssetTransfer, type InsertAssetTransfer,
  type InventoryItem, type InsertInventoryItem,
  type Employee, type InsertEmployee,
  type Role, type InsertRole,
  type CompanySettings, type InsertCompanySettings,
  type Notification, type InsertNotification,
  type Report, type InsertReport,
  type Setting, type InsertSetting,
  type CustomerConnection, type InsertCustomerConnection,
  type NotificationTemplate, type InsertNotificationTemplate,
  type SmtpSettings, type InsertSmtpSettings,
  type SmsSettings, type InsertSmsSettings,
  type NotificationDispatch, type InsertNotificationDispatch,
  type Branch, type InsertBranch,
  type VendorWalletTransaction, type InsertVendorWalletTransaction,
  type ResellerWalletTransaction, type InsertResellerWalletTransaction,
  type ResellerMonthlySummary, type InsertResellerMonthlySummary,
  type VendorPackage, type InsertVendorPackage,
  type VendorBandwidthLink, type InsertVendorBandwidthLink,
  type BandwidthChangeHistory, type InsertBandwidthChangeHistory,
  type CustomerQuery, type InsertCustomerQuery,
  type CustomerQueryLog, type InsertCustomerQueryLog,
  type SupportCategory, type InsertSupportCategory,
  type InvoiceItem, type InsertInvoiceItem,
  type Expense, type InsertExpense,
  type Leave, type InsertLeave,
  type Holiday, type InsertHoliday,
  type Attendance, type InsertAttendance,
  type AttendanceBreak, type InsertAttendanceBreak,
  type AuditLog, type InsertAuditLog,
  type TaskActivityLog, type InsertTaskActivityLog,
  type CreditNote, type InsertCreditNote,
  type BulkMessage, type InsertBulkMessage,
  type IpAddress, type InsertIpAddress,
  type Subnet, type InsertSubnet,
  type Vlan, type InsertVlan,
  type IpamLog, type InsertIpamLog,
  type Outage, type InsertOutage, type OutageTimeline, type InsertOutageTimeline,
  type NetworkDevice, type InsertNetworkDevice,
  type PppoeUser, type InsertPppoeUser,
  type RadiusProfile, type InsertRadiusProfile,
  type RadiusNasDevice, type InsertRadiusNasDevice,
  type RadiusAuthLog, type InsertRadiusAuthLog,
  type PaymentGateway, type InsertPaymentGateway,
  type Payment, type InsertPayment,
  type BillingRule, type InsertBillingRule,
  type BandwidthUsage, type InsertBandwidthUsage,
  type DailyCollection, type InsertDailyCollection,
  type SalaryHistory, type InsertSalaryHistory,
  type AdvanceLoan, type InsertAdvanceLoan,
  type LoanInstallment, type InsertLoanInstallment,
  type Payroll, type InsertPayroll,
  type SalaryPayment, type InsertSalaryPayment,
  type BonusCommission, type InsertBonusCommission,
  type CommissionType, type InsertCommissionType,
  type EmployeeType, type InsertEmployeeType,
  type Shift, type InsertShift,
  type ShiftAssignment, type InsertShiftAssignment,
  type AppAccessConfig, type InsertAppAccessConfig,
  type AreaAssignment, type InsertAreaAssignment,
  type LoginActivityLog, type InsertLoginActivityLog,
  type TransactionType, type InsertTransactionType,
  type CustomerType, type InsertCustomerType,
  type ResellerType, type InsertResellerType,
  type CirCustomer, type InsertCirCustomer,
  type CorporateCustomer, type InsertCorporateCustomer,
  type CorporateConnection, type InsertCorporateConnection,
  type ApprovalRequest, type InsertApprovalRequest,
  type ApprovalRule, type InsertApprovalRule,
  type ApprovalHistory, type InsertApprovalHistory,
  appAccessConfigs, areaAssignments, loginActivityLogs, customerTypes,
  resellerTypes, cirCustomers, corporateCustomers, corporateConnections,
  approvalRequests, approvalRules, approvalHistory,
  projects, type Project, type InsertProject,
  assetAssignments, assetAssignmentHistory,
  type AssetAssignment, type InsertAssetAssignment,
  type AssetAssignmentHistory, type InsertAssetAssignmentHistory,
  assetRequests, assetRequestHistory,
  type AssetRequest, type InsertAssetRequest,
  type AssetRequestHistory, type InsertAssetRequestHistory,
  assetAllocations, assetAllocationHistory,
  type AssetAllocation, type InsertAssetAllocation,
  type AssetAllocationHistory, type InsertAssetAllocationHistory,
  productTypes, productTypeCategories,
  type ProductType, type InsertProductType,
  type ProductTypeCategory, type InsertProductTypeCategory,
  suppliers,
  type Supplier, type InsertSupplier,
  brands, products,
  type Brand, type InsertBrand,
  type Product, type InsertProduct,
  purchaseOrders, purchaseOrderItems,
  type PurchaseOrder, type InsertPurchaseOrder,
  type PurchaseOrderItem, type InsertPurchaseOrderItem,
  stockLocations, stockItems, stockMovements, stockAdjustments,
  type StockLocation, type InsertStockLocation,
  type StockItem, type InsertStockItem,
  type StockMovement, type InsertStockMovement,
  type StockAdjustment, type InsertStockAdjustment,
  batches, serialNumbers, serialMovements,
  type Batch, type InsertBatch,
  type SerialNumber, type InsertSerialNumber,
  type SerialMovement, type InsertSerialMovement,
  notificationTypes,
  type NotificationType, type InsertNotificationType,
  pushNotifications,
  type PushNotification, type InsertPushNotification,
  bulkCampaigns,
  type BulkCampaign, type InsertBulkCampaign,
  smsProviders,
  type SmsProvider, type InsertSmsProvider,
  emailProviders,
  type EmailProvider, type InsertEmailProvider,
  whatsappProviders,
  type WhatsappProvider, type InsertWhatsappProvider,
  messageLogs,
  type MessageLog, type InsertMessageLog,
  pushMessages,
  type PushMessage, type InsertPushMessage,
  generalSettings,
  type GeneralSetting, type InsertGeneralSetting,
  hrmRoles,
  type HrmRole, type InsertHrmRole,
  hrmPermissions,
  type HrmPermission, type InsertHrmPermission,
  customerGroups,
  type CustomerGroup, type InsertCustomerGroup,
  customerRights,
  type CustomerRight, type InsertCustomerRight,
  invoiceTemplates,
  type InvoiceTemplate, type InsertInvoiceTemplate,
  notificationChannels,
  type NotificationChannel, type InsertNotificationChannel,
  notificationTriggers,
  type NotificationTrigger, type InsertNotificationTrigger,
  notificationLogs,
  type NotificationLog, type InsertNotificationLog,
  gatewayWebhooks,
  type GatewayWebhook, type InsertGatewayWebhook,
  gatewaySettlements,
  type GatewaySettlement, type InsertGatewaySettlement,
  fiberRoutes,
  type FiberRoute, type InsertFiberRoute,
  networkTowers,
  type NetworkTower, type InsertNetworkTower,
  oltDevices,
  type OltDevice, type InsertOltDevice,
  gponSplitters,
  type GponSplitter, type InsertGponSplitter,
  onuDevices,
  type OnuDevice, type InsertOnuDevice,
  p2pLinks,
  type P2pLink, type InsertP2pLink,
  bandwidthHistory,
  type BandwidthHistory, type InsertBandwidthHistory,
  serviceSchedulerRequests,
  type ServiceSchedulerRequest, type InsertServiceSchedulerRequest,
  bandwidthPurchases,
  type BandwidthPurchase, type InsertBandwidthPurchase,
  resellerCompanyPackages,
  type ResellerCompanyPackage, type InsertResellerCompanyPackage,
  resellerPackageAssignments,
  type ResellerPackageAssignment, type InsertResellerPackageAssignment,
  companyBankAccounts,
  type CompanyBankAccount, type InsertCompanyBankAccount,
  companyAccountLedger,
  type CompanyAccountLedgerEntry, type InsertCompanyAccountLedger,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(c: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, c: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<void>;

  getCustomerTypes(): Promise<CustomerType[]>;
  getCustomerType(id: number): Promise<CustomerType | undefined>;
  createCustomerType(data: InsertCustomerType): Promise<CustomerType>;
  updateCustomerType(id: number, data: Partial<InsertCustomerType>): Promise<CustomerType | undefined>;
  deleteCustomerType(id: number): Promise<void>;

  getResellerTypes(): Promise<ResellerType[]>;
  getResellerType(id: number): Promise<ResellerType | undefined>;
  createResellerType(data: InsertResellerType): Promise<ResellerType>;
  updateResellerType(id: number, data: Partial<InsertResellerType>): Promise<ResellerType | undefined>;
  deleteResellerType(id: number): Promise<void>;

  getCirCustomers(): Promise<CirCustomer[]>;
  getCirCustomer(id: number): Promise<CirCustomer | undefined>;
  createCirCustomer(data: InsertCirCustomer): Promise<CirCustomer>;
  updateCirCustomer(id: number, data: Partial<InsertCirCustomer>): Promise<CirCustomer | undefined>;
  deleteCirCustomer(id: number): Promise<void>;

  getCorporateCustomers(): Promise<CorporateCustomer[]>;
  getCorporateCustomer(id: number): Promise<CorporateCustomer | undefined>;
  createCorporateCustomer(data: InsertCorporateCustomer): Promise<CorporateCustomer>;
  updateCorporateCustomer(id: number, data: Partial<InsertCorporateCustomer>): Promise<CorporateCustomer | undefined>;
  deleteCorporateCustomer(id: number): Promise<void>;

  getCorporateConnections(corporateId: number): Promise<CorporateConnection[]>;
  createCorporateConnection(data: InsertCorporateConnection): Promise<CorporateConnection>;
  updateCorporateConnection(id: number, data: Partial<InsertCorporateConnection>): Promise<CorporateConnection | undefined>;
  deleteCorporateConnection(id: number): Promise<void>;

  getPackages(): Promise<Package[]>;
  getPackage(id: number): Promise<Package | undefined>;
  createPackage(p: InsertPackage): Promise<Package>;
  updatePackage(id: number, p: Partial<InsertPackage>): Promise<Package | undefined>;
  deletePackage(id: number): Promise<void>;

  getInvoices(): Promise<(Invoice & { customerName?: string; customerCode?: string; customerPhone?: string; customerArea?: string; customerZone?: string; customerType?: string; connectionType?: string; packageName?: string; packageSpeed?: string; customerServer?: string; customerUsernameIp?: string; customerExpireDate?: string; customerMonthlyBill?: string; customerBillingStatus?: string; customerStatus?: string })[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByCustomer(customerId: number): Promise<Invoice[]>;
  getInvoicesByCirCustomer(cirCustomerId: number): Promise<Invoice[]>;
  getInvoicesByCorporateCustomer(corporateCustomerId: number): Promise<Invoice[]>;
  createInvoice(i: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, i: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<void>;

  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined>;
  deleteInvoiceItem(id: number): Promise<void>;
  deleteInvoiceItemsByInvoiceId(invoiceId: number): Promise<void>;

  getTickets(): Promise<(Ticket & { customerName?: string; customerCode?: string; customerPhone?: string; customerArea?: string })[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  getTicketsByCustomer(customerId: number): Promise<Ticket[]>;
  getTicketsByCirCustomer(cirCustomerId: number): Promise<Ticket[]>;
  getTicketsByCorporateCustomer(corporateCustomerId: number): Promise<Ticket[]>;
  createTicket(t: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, t: Partial<InsertTicket>): Promise<Ticket | undefined>;
  deleteTicket(id: number): Promise<void>;
  getBandwidthHistory(customerType: string, customerId: number): Promise<BandwidthHistory[]>;
  createBandwidthHistory(data: InsertBandwidthHistory): Promise<BandwidthHistory>;

  getAreas(): Promise<Area[]>;
  getArea(id: number): Promise<Area | undefined>;
  createArea(a: InsertArea): Promise<Area>;
  updateArea(id: number, a: Partial<InsertArea>): Promise<Area | undefined>;
  deleteArea(id: number): Promise<void>;

  getVendors(): Promise<Vendor[]>;
  getVendor(id: number): Promise<Vendor | undefined>;
  createVendor(v: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, v: Partial<InsertVendor>): Promise<Vendor | undefined>;
  deleteVendor(id: number): Promise<void>;

  getResellers(): Promise<Reseller[]>;
  getReseller(id: number): Promise<Reseller | undefined>;
  createReseller(r: InsertReseller): Promise<Reseller>;
  updateReseller(id: number, r: Partial<InsertReseller>): Promise<Reseller | undefined>;
  deleteReseller(id: number): Promise<void>;

  getVendorWalletTransactions(vendorId: number): Promise<VendorWalletTransaction[]>;
  getAllVendorWalletTransactions(): Promise<VendorWalletTransaction[]>;
  createVendorWalletTransaction(t: InsertVendorWalletTransaction): Promise<VendorWalletTransaction>;
  updateVendorWalletTransaction(id: number, data: Partial<InsertVendorWalletTransaction>): Promise<VendorWalletTransaction | undefined>;
  updateVendorWalletTransactionWithAmount(id: number, newAmount: number, data: Partial<InsertVendorWalletTransaction>): Promise<VendorWalletTransaction | undefined>;
  rechargeVendorWallet(vendorId: number, amount: number, reference?: string, paymentMethod?: string, performedBy?: string, approvedBy?: string, notes?: string): Promise<Vendor>;
  deductVendorWallet(vendorId: number, amount: number, reference?: string, customerId?: number, resellerId?: number, reason?: string, performedBy?: string, approvedBy?: string, notes?: string): Promise<Vendor>;

  getResellerWalletTransactions(resellerId: number): Promise<ResellerWalletTransaction[]>;
  getAllResellerWalletTransactions(): Promise<ResellerWalletTransaction[]>;
  createResellerWalletTransaction(t: InsertResellerWalletTransaction): Promise<ResellerWalletTransaction>;
  rechargeResellerWallet(resellerId: number, amount: number, reference?: string, paymentMethod?: string, remarks?: string, createdBy?: string, paymentStatus?: string, vendorId?: number, bankAccountId?: number): Promise<Reseller>;
  deductResellerWallet(resellerId: number, amount: number, vendorId?: number, customerId?: number, reference?: string, category?: string, createdBy?: string): Promise<Reseller>;

  getResellerMonthlySummaries(resellerId: number, month?: string): Promise<ResellerMonthlySummary[]>;
  getResellerMonthlySummary(id: number): Promise<ResellerMonthlySummary | undefined>;
  upsertResellerMonthlySummary(data: InsertResellerMonthlySummary): Promise<ResellerMonthlySummary>;
  deleteResellerMonthlySummary(id: number): Promise<void>;

  getBandwidthPurchases(vendorId?: number): Promise<BandwidthPurchase[]>;
  getBandwidthPurchase(id: number): Promise<BandwidthPurchase | undefined>;
  createBandwidthPurchase(data: InsertBandwidthPurchase): Promise<BandwidthPurchase>;
  updateBandwidthPurchase(id: number, data: Partial<InsertBandwidthPurchase>): Promise<BandwidthPurchase>;
  deleteBandwidthPurchase(id: number): Promise<void>;

  getCompanyBankAccounts(): Promise<CompanyBankAccount[]>;
  getCompanyBankAccount(id: number): Promise<CompanyBankAccount | undefined>;
  createCompanyBankAccount(data: InsertCompanyBankAccount): Promise<CompanyBankAccount>;
  updateCompanyBankAccount(id: number, data: Partial<InsertCompanyBankAccount>): Promise<CompanyBankAccount>;
  deleteCompanyBankAccount(id: number): Promise<void>;
  creditCompanyAccount(accountId: number, amount: number, referenceModule?: string, referenceId?: string, description?: string, remarks?: string, createdBy?: string): Promise<CompanyBankAccount>;
  debitCompanyAccount(accountId: number, amount: number, referenceModule?: string, referenceId?: string, description?: string, remarks?: string, createdBy?: string): Promise<CompanyBankAccount>;
  transferBetweenAccounts(fromAccountId: number, toAccountId: number, amount: number, remarks?: string, createdBy?: string): Promise<void>;
  getCompanyAccountLedger(accountId?: number): Promise<CompanyAccountLedgerEntry[]>;
  createCompanyAccountLedgerEntry(data: InsertCompanyAccountLedger): Promise<CompanyAccountLedgerEntry>;

  getResellerCompanyPackages(): Promise<ResellerCompanyPackage[]>;
  getResellerCompanyPackage(id: number): Promise<ResellerCompanyPackage | undefined>;
  createResellerCompanyPackage(data: InsertResellerCompanyPackage): Promise<ResellerCompanyPackage>;
  updateResellerCompanyPackage(id: number, data: Partial<InsertResellerCompanyPackage>): Promise<ResellerCompanyPackage>;
  deleteResellerCompanyPackage(id: number): Promise<void>;

  getResellerPackageAssignments(resellerId?: number): Promise<ResellerPackageAssignment[]>;
  createResellerPackageAssignment(data: InsertResellerPackageAssignment): Promise<ResellerPackageAssignment>;
  updateResellerPackageAssignment(id: number, data: Partial<InsertResellerPackageAssignment>): Promise<ResellerPackageAssignment>;
  deleteResellerPackageAssignment(id: number): Promise<void>;

  getVendorPackages(vendorId?: number): Promise<VendorPackage[]>;
  getVendorPackage(id: number): Promise<VendorPackage | undefined>;
  createVendorPackage(p: InsertVendorPackage): Promise<VendorPackage>;
  updateVendorPackage(id: number, p: Partial<InsertVendorPackage>): Promise<VendorPackage | undefined>;
  deleteVendorPackage(id: number): Promise<void>;

  getVendorBandwidthLinks(vendorId?: number): Promise<VendorBandwidthLink[]>;
  getVendorBandwidthLink(id: number): Promise<VendorBandwidthLink | undefined>;
  createVendorBandwidthLink(l: InsertVendorBandwidthLink): Promise<VendorBandwidthLink>;
  updateVendorBandwidthLink(id: number, l: Partial<InsertVendorBandwidthLink>): Promise<VendorBandwidthLink | undefined>;
  deleteVendorBandwidthLink(id: number): Promise<void>;

  getCustomerQueries(): Promise<CustomerQuery[]>;
  getCustomerQuery(id: number): Promise<CustomerQuery | undefined>;
  createCustomerQuery(q: InsertCustomerQuery): Promise<CustomerQuery>;
  updateCustomerQuery(id: number, q: Partial<InsertCustomerQuery>): Promise<CustomerQuery | undefined>;
  deleteCustomerQuery(id: number): Promise<void>;
  createCustomerQueryLog(log: InsertCustomerQueryLog): Promise<CustomerQueryLog>;
  getCustomerQueryLogs(queryId: number): Promise<CustomerQueryLog[]>;

  getSupportCategories(): Promise<SupportCategory[]>;
  getSupportCategory(id: number): Promise<SupportCategory | undefined>;
  createSupportCategory(c: InsertSupportCategory): Promise<SupportCategory>;
  updateSupportCategory(id: number, c: Partial<InsertSupportCategory>): Promise<SupportCategory | undefined>;
  deleteSupportCategory(id: number): Promise<void>;

  getAccountTypes(): Promise<AccountType[]>;
  getAccountType(id: number): Promise<AccountType | undefined>;
  createAccountType(a: InsertAccountType): Promise<AccountType>;
  updateAccountType(id: number, a: Partial<InsertAccountType>): Promise<AccountType | undefined>;
  deleteAccountType(id: number): Promise<void>;

  getAccounts(): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(a: InsertAccount): Promise<Account>;
  updateAccount(id: number, a: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<void>;

  getTransactions(): Promise<(Transaction & { customerName?: string; accountName?: string; vendorName?: string; debitAccountName?: string; creditAccountName?: string })[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByCustomer(customerId: number): Promise<Transaction[]>;
  createTransaction(t: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, t: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<void>;

  getBudgets(): Promise<Budget[]>;
  getBudget(id: number): Promise<Budget | undefined>;
  createBudget(b: InsertBudget): Promise<Budget>;
  updateBudget(id: number, b: Partial<InsertBudget>): Promise<Budget | undefined>;
  deleteBudget(id: number): Promise<void>;

  getBudgetAllocations(): Promise<(BudgetAllocation & { accountName?: string })[]>;
  getBudgetAllocationsByBudget(budgetId: number): Promise<(BudgetAllocation & { accountName?: string })[]>;
  createBudgetAllocation(a: InsertBudgetAllocation): Promise<BudgetAllocation>;
  updateBudgetAllocation(id: number, a: Partial<InsertBudgetAllocation>): Promise<BudgetAllocation | undefined>;
  deleteBudgetAllocation(id: number): Promise<void>;

  getTasks(): Promise<(Task & { customerName?: string })[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(t: InsertTask): Promise<Task>;
  updateTask(id: number, t: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<void>;

  getAssetTypes(): Promise<AssetType[]>;
  getAssetType(id: number): Promise<AssetType | undefined>;
  createAssetType(a: InsertAssetType): Promise<AssetType>;
  updateAssetType(id: number, a: Partial<InsertAssetType>): Promise<AssetType | undefined>;
  deleteAssetType(id: number): Promise<void>;

  getAssets(): Promise<Asset[]>;
  getAsset(id: number): Promise<Asset | undefined>;
  createAsset(a: InsertAsset): Promise<Asset>;
  updateAsset(id: number, a: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(id: number): Promise<void>;

  getAssetTransfers(): Promise<AssetTransfer[]>;
  getAssetTransfer(id: number): Promise<AssetTransfer | undefined>;
  createAssetTransfer(t: InsertAssetTransfer): Promise<AssetTransfer>;
  updateAssetTransfer(id: number, t: Partial<InsertAssetTransfer>): Promise<AssetTransfer | undefined>;
  deleteAssetTransfer(id: number): Promise<void>;

  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  createInventoryItem(i: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, i: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<void>;

  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(e: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, e: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<void>;

  getSalaryHistory(employeeId: number): Promise<SalaryHistory[]>;
  getSalaryHistoryEntry(id: number): Promise<SalaryHistory | undefined>;
  createSalaryHistoryEntry(data: InsertSalaryHistory): Promise<SalaryHistory>;
  updateSalaryHistoryEntry(id: number, data: Partial<InsertSalaryHistory>): Promise<SalaryHistory | undefined>;
  deleteSalaryHistoryEntry(id: number): Promise<void>;

  getAdvanceLoans(): Promise<(AdvanceLoan & { employeeName?: string; empCode?: string; department?: string; designation?: string; salary?: string })[]>;
  getAdvanceLoan(id: number): Promise<AdvanceLoan | undefined>;
  createAdvanceLoan(data: InsertAdvanceLoan): Promise<AdvanceLoan>;
  updateAdvanceLoan(id: number, data: Partial<InsertAdvanceLoan>): Promise<AdvanceLoan | undefined>;
  deleteAdvanceLoan(id: number): Promise<void>;

  getLoanInstallments(loanId: number): Promise<LoanInstallment[]>;
  getLoanInstallment(id: number): Promise<LoanInstallment | undefined>;
  createLoanInstallment(data: InsertLoanInstallment): Promise<LoanInstallment>;
  updateLoanInstallment(id: number, data: Partial<InsertLoanInstallment>): Promise<LoanInstallment | undefined>;
  deleteLoanInstallment(id: number): Promise<void>;
  deleteLoanInstallmentsByLoanId(loanId: number): Promise<void>;

  getPayrolls(month?: string): Promise<(Payroll & { employeeName?: string; empCode?: string; department?: string; designation?: string })[]>;
  getPayroll(id: number): Promise<Payroll | undefined>;
  createPayroll(data: InsertPayroll): Promise<Payroll>;
  updatePayroll(id: number, data: Partial<InsertPayroll>): Promise<Payroll | undefined>;
  deletePayroll(id: number): Promise<void>;
  deletePayrollsByMonth(month: string): Promise<void>;

  getSalaryPayments(payrollId: number): Promise<SalaryPayment[]>;
  getSalaryPayment(id: number): Promise<SalaryPayment | undefined>;
  createSalaryPayment(data: InsertSalaryPayment): Promise<SalaryPayment>;
  updateSalaryPayment(id: number, data: Partial<InsertSalaryPayment>): Promise<SalaryPayment | undefined>;
  deleteSalaryPayment(id: number): Promise<void>;

  getBonusCommissions(month?: string, employeeId?: number): Promise<(BonusCommission & { employeeName?: string; empCode?: string; department?: string; designation?: string })[]>;
  getBonusCommission(id: number): Promise<BonusCommission | undefined>;
  createBonusCommission(data: InsertBonusCommission): Promise<BonusCommission>;
  updateBonusCommission(id: number, data: Partial<InsertBonusCommission>): Promise<BonusCommission | undefined>;
  deleteBonusCommission(id: number): Promise<void>;

  getEmployeeTypes(): Promise<EmployeeType[]>;
  getEmployeeType(id: number): Promise<EmployeeType | undefined>;
  createEmployeeType(data: InsertEmployeeType): Promise<EmployeeType>;
  updateEmployeeType(id: number, data: Partial<InsertEmployeeType>): Promise<EmployeeType | undefined>;
  deleteEmployeeType(id: number): Promise<void>;

  getCommissionTypes(): Promise<CommissionType[]>;
  getCommissionType(id: number): Promise<CommissionType | undefined>;
  createCommissionType(data: InsertCommissionType): Promise<CommissionType>;
  updateCommissionType(id: number, data: Partial<InsertCommissionType>): Promise<CommissionType | undefined>;
  deleteCommissionType(id: number): Promise<void>;
  getActiveCommissionTypeByTrigger(triggerEvent: string): Promise<CommissionType | undefined>;

  getShifts(): Promise<Shift[]>;
  getShift(id: number): Promise<Shift | undefined>;
  createShift(data: InsertShift): Promise<Shift>;
  updateShift(id: number, data: Partial<InsertShift>): Promise<Shift | undefined>;
  deleteShift(id: number): Promise<void>;

  getShiftAssignments(): Promise<(ShiftAssignment & { employeeName?: string; empCode?: string; department?: string; shiftName?: string; shiftCode?: string; shiftStartTime?: string; shiftEndTime?: string; shiftColor?: string })[]>;
  getShiftAssignment(id: number): Promise<ShiftAssignment | undefined>;
  createShiftAssignment(data: InsertShiftAssignment): Promise<ShiftAssignment>;
  updateShiftAssignment(id: number, data: Partial<InsertShiftAssignment>): Promise<ShiftAssignment | undefined>;
  deleteShiftAssignment(id: number): Promise<void>;

  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  createRole(r: InsertRole): Promise<Role>;
  updateRole(id: number, r: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<void>;

  getCompanySettings(): Promise<CompanySettings | undefined>;
  upsertCompanySettings(s: InsertCompanySettings): Promise<CompanySettings>;

  getNotifications(): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(n: InsertNotification): Promise<Notification>;
  updateNotification(id: number, n: Partial<InsertNotification>): Promise<Notification | undefined>;
  deleteNotification(id: number): Promise<void>;

  getReports(): Promise<Report[]>;
  getReport(id: number): Promise<Report | undefined>;
  createReport(r: InsertReport): Promise<Report>;
  updateReport(id: number, r: Partial<InsertReport>): Promise<Report | undefined>;
  deleteReport(id: number): Promise<void>;

  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  upsertSetting(s: InsertSetting): Promise<Setting>;
  updateSetting(id: number, data: Partial<InsertSetting>): Promise<Setting>;
  deleteSetting(id: number): Promise<void>;

  getCustomerConnections(customerId: number): Promise<CustomerConnection[]>;
  createCustomerConnection(c: InsertCustomerConnection): Promise<CustomerConnection>;
  updateCustomerConnection(id: number, c: Partial<InsertCustomerConnection>): Promise<CustomerConnection | undefined>;
  deleteCustomerConnection(id: number): Promise<void>;

  getDashboardStats(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    totalRevenue: string;
    pendingInvoices: number;
    openTickets: number;
    totalPackages: number;
    overdueAmount: string;
    collectedAmount: string;
  }>;

  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(): Promise<ActivityLog[]>;

  getNotificationTemplates(): Promise<NotificationTemplate[]>;
  getNotificationTemplate(id: number): Promise<NotificationTemplate | undefined>;
  createNotificationTemplate(t: InsertNotificationTemplate): Promise<NotificationTemplate>;
  updateNotificationTemplate(id: number, t: Partial<InsertNotificationTemplate>): Promise<NotificationTemplate | undefined>;
  deleteNotificationTemplate(id: number): Promise<void>;

  getSmtpSettings(): Promise<SmtpSettings | undefined>;
  upsertSmtpSettings(s: InsertSmtpSettings): Promise<SmtpSettings>;

  getSmsSettings(): Promise<SmsSettings | undefined>;
  upsertSmsSettings(s: InsertSmsSettings): Promise<SmsSettings>;

  getNotificationDispatches(): Promise<NotificationDispatch[]>;
  createNotificationDispatch(d: InsertNotificationDispatch): Promise<NotificationDispatch>;

  getBranches(): Promise<Branch[]>;
  getBranch(id: number): Promise<Branch | undefined>;
  createBranch(b: InsertBranch): Promise<Branch>;
  updateBranch(id: number, b: Partial<InsertBranch>): Promise<Branch | undefined>;
  deleteBranch(id: number): Promise<void>;

  getExpenses(): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(e: InsertExpense): Promise<Expense>;
  updateExpense(id: number, e: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<void>;

  getLeaves(employeeId?: number): Promise<(Leave & { employeeName?: string; employeeCode?: string })[]>;
  getLeave(id: number): Promise<Leave | undefined>;
  createLeave(l: InsertLeave): Promise<Leave>;
  updateLeave(id: number, l: Partial<InsertLeave>): Promise<Leave | undefined>;
  deleteLeave(id: number): Promise<void>;

  getHolidays(): Promise<Holiday[]>;
  createHoliday(h: InsertHoliday): Promise<Holiday>;
  updateHoliday(id: number, h: Partial<InsertHoliday>): Promise<Holiday | undefined>;
  deleteHoliday(id: number): Promise<void>;

  getAttendanceRecords(employeeId?: number): Promise<(Attendance & { employeeName?: string; employeeCode?: string; employeeShift?: string })[]>;
  createAttendance(a: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, a: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: number): Promise<void>;
  getAttendanceBreaks(attendanceId: number): Promise<AttendanceBreak[]>;
  createAttendanceBreak(b: InsertAttendanceBreak): Promise<AttendanceBreak>;
  updateAttendanceBreak(id: number, b: Partial<InsertAttendanceBreak>): Promise<AttendanceBreak | undefined>;
  deleteAttendanceBreak(id: number): Promise<void>;

  getAuditLogs(): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  getCreditNotes(): Promise<(CreditNote & { customerName?: string })[]>;
  getCreditNote(id: number): Promise<CreditNote | undefined>;
  createCreditNote(cn: InsertCreditNote): Promise<CreditNote>;
  updateCreditNote(id: number, cn: Partial<InsertCreditNote>): Promise<CreditNote | undefined>;
  deleteCreditNote(id: number): Promise<void>;

  getBulkMessages(): Promise<BulkMessage[]>;
  getBulkMessage(id: number): Promise<BulkMessage | undefined>;
  createBulkMessage(m: InsertBulkMessage): Promise<BulkMessage>;
  updateBulkMessage(id: number, m: Partial<InsertBulkMessage>): Promise<BulkMessage | undefined>;
  deleteBulkMessage(id: number): Promise<void>;

  getIpAddresses(): Promise<(IpAddress & { customerName?: string })[]>;
  getIpAddress(id: number): Promise<IpAddress | undefined>;
  createIpAddress(ip: InsertIpAddress): Promise<IpAddress>;
  updateIpAddress(id: number, ip: Partial<InsertIpAddress>): Promise<IpAddress | undefined>;
  deleteIpAddress(id: number): Promise<void>;

  getSubnets(): Promise<Subnet[]>;
  getSubnet(id: number): Promise<Subnet | undefined>;
  createSubnet(s: InsertSubnet): Promise<Subnet>;
  updateSubnet(id: number, s: Partial<InsertSubnet>): Promise<Subnet | undefined>;
  deleteSubnet(id: number): Promise<void>;

  getVlans(): Promise<Vlan[]>;
  getVlan(id: number): Promise<Vlan | undefined>;
  createVlan(v: InsertVlan): Promise<Vlan>;
  updateVlan(id: number, v: Partial<InsertVlan>): Promise<Vlan | undefined>;
  deleteVlan(id: number): Promise<void>;

  getIpamLogs(): Promise<IpamLog[]>;
  createIpamLog(l: InsertIpamLog): Promise<IpamLog>;

  getOutages(): Promise<Outage[]>;
  getOutage(id: number): Promise<Outage | undefined>;
  createOutage(o: InsertOutage): Promise<Outage>;
  updateOutage(id: number, o: Partial<InsertOutage>): Promise<Outage | undefined>;
  deleteOutage(id: number): Promise<void>;

  getOutageTimelines(outageId: number): Promise<OutageTimeline[]>;
  getAllOutageTimelines(): Promise<OutageTimeline[]>;
  createOutageTimeline(t: InsertOutageTimeline): Promise<OutageTimeline>;
  deleteOutageTimeline(id: number): Promise<void>;

  getNetworkDevices(): Promise<NetworkDevice[]>;
  getNetworkDevice(id: number): Promise<NetworkDevice | undefined>;
  createNetworkDevice(d: InsertNetworkDevice): Promise<NetworkDevice>;
  updateNetworkDevice(id: number, d: Partial<InsertNetworkDevice>): Promise<NetworkDevice | undefined>;
  deleteNetworkDevice(id: number): Promise<void>;

  getPppoeUsers(): Promise<(PppoeUser & { customerName?: string })[]>;
  getPppoeUser(id: number): Promise<PppoeUser | undefined>;
  createPppoeUser(u: InsertPppoeUser): Promise<PppoeUser>;
  updatePppoeUser(id: number, u: Partial<InsertPppoeUser>): Promise<PppoeUser | undefined>;
  deletePppoeUser(id: number): Promise<void>;

  getRadiusProfiles(): Promise<RadiusProfile[]>;
  getRadiusProfile(id: number): Promise<RadiusProfile | undefined>;
  createRadiusProfile(p: InsertRadiusProfile): Promise<RadiusProfile>;
  updateRadiusProfile(id: number, p: Partial<InsertRadiusProfile>): Promise<RadiusProfile | undefined>;
  deleteRadiusProfile(id: number): Promise<void>;

  getRadiusNasDevices(): Promise<RadiusNasDevice[]>;
  getRadiusNasDevice(id: number): Promise<RadiusNasDevice | undefined>;
  createRadiusNasDevice(d: InsertRadiusNasDevice): Promise<RadiusNasDevice>;
  updateRadiusNasDevice(id: number, d: Partial<InsertRadiusNasDevice>): Promise<RadiusNasDevice | undefined>;
  deleteRadiusNasDevice(id: number): Promise<void>;

  getRadiusAuthLogs(): Promise<RadiusAuthLog[]>;
  getRadiusAuthLog(id: number): Promise<RadiusAuthLog | undefined>;
  createRadiusAuthLog(l: InsertRadiusAuthLog): Promise<RadiusAuthLog>;
  updateRadiusAuthLog(id: number, data: Partial<InsertRadiusAuthLog>): Promise<RadiusAuthLog | undefined>;
  deleteRadiusAuthLog(id: number): Promise<void>;

  getPaymentGateways(): Promise<PaymentGateway[]>;
  getPaymentGateway(id: number): Promise<PaymentGateway | undefined>;
  createPaymentGateway(g: InsertPaymentGateway): Promise<PaymentGateway>;
  updatePaymentGateway(id: number, g: Partial<InsertPaymentGateway>): Promise<PaymentGateway | undefined>;
  deletePaymentGateway(id: number): Promise<void>;

  getPayments(): Promise<(Payment & { customerName?: string })[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(p: InsertPayment): Promise<Payment>;
  updatePayment(id: number, p: Partial<InsertPayment>): Promise<Payment | undefined>;
  deletePayment(id: number): Promise<void>;

  getBillingRules(): Promise<BillingRule[]>;
  getBillingRule(id: number): Promise<BillingRule | undefined>;
  createBillingRule(r: InsertBillingRule): Promise<BillingRule>;
  updateBillingRule(id: number, r: Partial<InsertBillingRule>): Promise<BillingRule | undefined>;
  deleteBillingRule(id: number): Promise<void>;

  getBandwidthUsage(): Promise<(BandwidthUsage & { customerName?: string })[]>;
  getBandwidthUsageById(id: number): Promise<BandwidthUsage | undefined>;
  getBandwidthUsageByCustomer(customerId: number): Promise<BandwidthUsage[]>;
  createBandwidthUsage(u: InsertBandwidthUsage): Promise<BandwidthUsage>;
  updateBandwidthUsage(id: number, u: Partial<InsertBandwidthUsage>): Promise<BandwidthUsage | undefined>;
  deleteBandwidthUsage(id: number): Promise<void>;

  getDailyCollections(): Promise<(DailyCollection & { customerName?: string; customerCode?: string; customerPhone?: string; customerUsername?: string; monthlyBill?: string })[]>;
  getDailyCollection(id: number): Promise<DailyCollection | undefined>;
  createDailyCollection(d: InsertDailyCollection): Promise<DailyCollection>;
  updateDailyCollection(id: number, d: Partial<InsertDailyCollection>): Promise<DailyCollection | undefined>;
  deleteDailyCollection(id: number): Promise<void>;

  getUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;

  getAppAccessConfigs(): Promise<(AppAccessConfig & { roleName?: string })[]>;
  getAppAccessConfig(id: number): Promise<AppAccessConfig | undefined>;
  getAppAccessConfigByRole(roleId: number): Promise<AppAccessConfig | undefined>;
  createAppAccessConfig(data: InsertAppAccessConfig): Promise<AppAccessConfig>;
  updateAppAccessConfig(id: number, data: Partial<InsertAppAccessConfig>): Promise<AppAccessConfig | undefined>;
  deleteAppAccessConfig(id: number): Promise<void>;

  getAreaAssignments(): Promise<(AreaAssignment & { employeeName?: string; empCode?: string; department?: string; areaName?: string; areaCity?: string; areaZone?: string; areaBranch?: string; areaTotalCustomers?: number })[]>;
  getAreaAssignment(id: number): Promise<AreaAssignment | undefined>;
  getAreaAssignmentsByEmployee(employeeId: number): Promise<AreaAssignment[]>;
  getAreaAssignmentsByArea(areaId: number): Promise<AreaAssignment[]>;
  createAreaAssignment(data: InsertAreaAssignment): Promise<AreaAssignment>;
  updateAreaAssignment(id: number, data: Partial<InsertAreaAssignment>): Promise<AreaAssignment | undefined>;
  deleteAreaAssignment(id: number): Promise<void>;

  getLoginActivityLogs(): Promise<LoginActivityLog[]>;
  createLoginActivityLog(data: InsertLoginActivityLog): Promise<LoginActivityLog>;
  updateLoginActivityLog(id: number, data: Partial<InsertLoginActivityLog>): Promise<LoginActivityLog | undefined>;

  getTransactionTypes(): Promise<TransactionType[]>;
  getTransactionType(id: number): Promise<TransactionType | undefined>;
  createTransactionType(t: InsertTransactionType): Promise<TransactionType>;
  updateTransactionType(id: number, t: Partial<InsertTransactionType>): Promise<TransactionType | undefined>;
  deleteTransactionType(id: number): Promise<void>;

  getApprovalRequests(): Promise<ApprovalRequest[]>;
  getApprovalRequest(id: number): Promise<ApprovalRequest | undefined>;
  createApprovalRequest(data: InsertApprovalRequest): Promise<ApprovalRequest>;
  updateApprovalRequest(id: number, data: Partial<InsertApprovalRequest>): Promise<ApprovalRequest | undefined>;
  deleteApprovalRequest(id: number): Promise<void>;

  getApprovalRules(): Promise<ApprovalRule[]>;
  getApprovalRule(id: number): Promise<ApprovalRule | undefined>;
  createApprovalRule(data: InsertApprovalRule): Promise<ApprovalRule>;
  updateApprovalRule(id: number, data: Partial<InsertApprovalRule>): Promise<ApprovalRule | undefined>;
  deleteApprovalRule(id: number): Promise<void>;

  getApprovalHistoryItems(): Promise<ApprovalHistory[]>;
  createApprovalHistory(data: InsertApprovalHistory): Promise<ApprovalHistory>;

  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(data: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;

  getTaskActivityLogs(): Promise<TaskActivityLog[]>;
  getTaskActivityLogsByTaskId(taskId: number): Promise<TaskActivityLog[]>;
  createTaskActivityLog(data: InsertTaskActivityLog): Promise<TaskActivityLog>;

  getAssetRequests(): Promise<AssetRequest[]>;
  getAssetRequest(id: number): Promise<AssetRequest | undefined>;
  createAssetRequest(data: InsertAssetRequest): Promise<AssetRequest>;
  updateAssetRequest(id: number, data: Partial<InsertAssetRequest>): Promise<AssetRequest | undefined>;
  deleteAssetRequest(id: number): Promise<void>;
  getAssetRequestHistoryByRequest(requestId: number): Promise<AssetRequestHistory[]>;
  createAssetRequestHistory(data: InsertAssetRequestHistory): Promise<AssetRequestHistory>;

  getAssetAssignments(): Promise<AssetAssignment[]>;
  getAssetAssignment(id: number): Promise<AssetAssignment | undefined>;
  getAssetAssignmentsByCustomer(customerId: number): Promise<AssetAssignment[]>;
  createAssetAssignment(data: InsertAssetAssignment): Promise<AssetAssignment>;
  updateAssetAssignment(id: number, data: Partial<InsertAssetAssignment>): Promise<AssetAssignment | undefined>;
  deleteAssetAssignment(id: number): Promise<void>;

  getAssetAssignmentHistoryByCustomer(customerId: number): Promise<AssetAssignmentHistory[]>;
  getAssetAssignmentHistoryByAssignment(assignmentId: number): Promise<AssetAssignmentHistory[]>;
  createAssetAssignmentHistory(data: InsertAssetAssignmentHistory): Promise<AssetAssignmentHistory>;

  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(data: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<void>;

  getBrands(): Promise<Brand[]>;
  getBrand(id: number): Promise<Brand | undefined>;
  createBrand(data: InsertBrand): Promise<Brand>;
  updateBrand(id: number, data: Partial<InsertBrand>): Promise<Brand | undefined>;
  deleteBrand(id: number): Promise<void>;

  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(data: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;

  getPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(data: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: number, data: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder | undefined>;
  deletePurchaseOrder(id: number): Promise<void>;

  getPurchaseOrderItems(poId: number): Promise<PurchaseOrderItem[]>;
  createPurchaseOrderItem(data: InsertPurchaseOrderItem): Promise<PurchaseOrderItem>;
  updatePurchaseOrderItem(id: number, data: Partial<InsertPurchaseOrderItem>): Promise<PurchaseOrderItem | undefined>;
  deletePurchaseOrderItem(id: number): Promise<void>;
  deletePurchaseOrderItemsByPo(poId: number): Promise<void>;

  getStockLocations(): Promise<StockLocation[]>;
  getStockLocation(id: number): Promise<StockLocation | undefined>;
  createStockLocation(data: InsertStockLocation): Promise<StockLocation>;
  updateStockLocation(id: number, data: Partial<InsertStockLocation>): Promise<StockLocation | undefined>;
  deleteStockLocation(id: number): Promise<void>;

  getStockItems(): Promise<StockItem[]>;
  getStockItem(id: number): Promise<StockItem | undefined>;
  createStockItem(data: InsertStockItem): Promise<StockItem>;
  updateStockItem(id: number, data: Partial<InsertStockItem>): Promise<StockItem | undefined>;
  deleteStockItem(id: number): Promise<void>;

  getStockMovements(): Promise<StockMovement[]>;
  getStockMovementsByItem(stockItemId: number): Promise<StockMovement[]>;
  createStockMovement(data: InsertStockMovement): Promise<StockMovement>;

  getStockAdjustments(): Promise<StockAdjustment[]>;
  getStockAdjustment(id: number): Promise<StockAdjustment | undefined>;
  createStockAdjustment(data: InsertStockAdjustment): Promise<StockAdjustment>;
  updateStockAdjustment(id: number, data: Partial<InsertStockAdjustment>): Promise<StockAdjustment | undefined>;

  getBatches(): Promise<Batch[]>;
  getBatch(id: number): Promise<Batch | undefined>;
  createBatch(data: InsertBatch): Promise<Batch>;
  updateBatch(id: number, data: Partial<InsertBatch>): Promise<Batch | undefined>;
  deleteBatch(id: number): Promise<void>;

  getSerialNumbers(): Promise<SerialNumber[]>;
  getSerialNumber(id: number): Promise<SerialNumber | undefined>;
  createSerialNumber(data: InsertSerialNumber): Promise<SerialNumber>;
  updateSerialNumber(id: number, data: Partial<InsertSerialNumber>): Promise<SerialNumber | undefined>;
  deleteSerialNumber(id: number): Promise<void>;

  getSerialMovements(): Promise<SerialMovement[]>;
  getSerialMovementsBySerial(serialId: number): Promise<SerialMovement[]>;
  createSerialMovement(data: InsertSerialMovement): Promise<SerialMovement>;

  getNotificationTypes(): Promise<NotificationType[]>;
  getNotificationType(id: number): Promise<NotificationType | undefined>;
  createNotificationType(data: InsertNotificationType): Promise<NotificationType>;
  updateNotificationType(id: number, data: Partial<InsertNotificationType>): Promise<NotificationType | undefined>;
  deleteNotificationType(id: number): Promise<void>;

  getPushNotifications(): Promise<PushNotification[]>;
  getPushNotification(id: number): Promise<PushNotification | undefined>;
  createPushNotification(data: InsertPushNotification): Promise<PushNotification>;
  updatePushNotification(id: number, data: Partial<InsertPushNotification>): Promise<PushNotification | undefined>;
  deletePushNotification(id: number): Promise<void>;

  getBulkCampaigns(): Promise<BulkCampaign[]>;
  getBulkCampaign(id: number): Promise<BulkCampaign | undefined>;
  createBulkCampaign(data: InsertBulkCampaign): Promise<BulkCampaign>;
  updateBulkCampaign(id: number, data: Partial<InsertBulkCampaign>): Promise<BulkCampaign | undefined>;
  deleteBulkCampaign(id: number): Promise<void>;

  getSmsProviders(): Promise<SmsProvider[]>;
  getSmsProvider(id: number): Promise<SmsProvider | undefined>;
  createSmsProvider(data: InsertSmsProvider): Promise<SmsProvider>;
  updateSmsProvider(id: number, data: Partial<InsertSmsProvider>): Promise<SmsProvider | undefined>;
  deleteSmsProvider(id: number): Promise<void>;

  getEmailProviders(): Promise<EmailProvider[]>;
  getEmailProvider(id: number): Promise<EmailProvider | undefined>;
  createEmailProvider(data: InsertEmailProvider): Promise<EmailProvider>;
  updateEmailProvider(id: number, data: Partial<InsertEmailProvider>): Promise<EmailProvider | undefined>;
  deleteEmailProvider(id: number): Promise<void>;

  getWhatsappProviders(): Promise<WhatsappProvider[]>;
  getWhatsappProvider(id: number): Promise<WhatsappProvider | undefined>;
  createWhatsappProvider(data: InsertWhatsappProvider): Promise<WhatsappProvider>;
  updateWhatsappProvider(id: number, data: Partial<InsertWhatsappProvider>): Promise<WhatsappProvider | undefined>;
  deleteWhatsappProvider(id: number): Promise<void>;

  getPushMessages(): Promise<PushMessage[]>;
  getPushMessage(id: number): Promise<PushMessage | undefined>;
  createPushMessage(data: InsertPushMessage): Promise<PushMessage>;
  updatePushMessage(id: number, data: Partial<InsertPushMessage>): Promise<PushMessage | undefined>;
  deletePushMessage(id: number): Promise<void>;

  getMessageLogs(): Promise<MessageLog[]>;
  createMessageLog(data: InsertMessageLog): Promise<MessageLog>;

  getGeneralSettings(): Promise<GeneralSetting[]>;
  getGeneralSettingsByCategory(category: string): Promise<GeneralSetting[]>;
  upsertGeneralSetting(data: InsertGeneralSetting): Promise<GeneralSetting>;
  bulkUpsertGeneralSettings(settings: InsertGeneralSetting[]): Promise<GeneralSetting[]>;

  getHrmRoles(): Promise<HrmRole[]>;
  getHrmRole(id: number): Promise<HrmRole | undefined>;
  createHrmRole(data: InsertHrmRole): Promise<HrmRole>;
  updateHrmRole(id: number, data: Partial<InsertHrmRole>): Promise<HrmRole | undefined>;
  deleteHrmRole(id: number): Promise<void>;

  getHrmPermissions(roleId: number): Promise<HrmPermission[]>;
  upsertHrmPermission(data: InsertHrmPermission): Promise<HrmPermission>;
  bulkUpsertHrmPermissions(permissions: InsertHrmPermission[]): Promise<HrmPermission[]>;
  deleteHrmPermissionsByRole(roleId: number): Promise<void>;

  getCustomerGroups(): Promise<CustomerGroup[]>;
  getCustomerGroup(id: number): Promise<CustomerGroup | undefined>;
  createCustomerGroup(data: InsertCustomerGroup): Promise<CustomerGroup>;
  updateCustomerGroup(id: number, data: Partial<InsertCustomerGroup>): Promise<CustomerGroup | undefined>;
  deleteCustomerGroup(id: number): Promise<void>;

  getCustomerRights(groupId: number): Promise<CustomerRight[]>;
  upsertCustomerRight(data: InsertCustomerRight): Promise<CustomerRight>;
  bulkUpsertCustomerRights(rights: InsertCustomerRight[]): Promise<CustomerRight[]>;
  deleteCustomerRightsByGroup(groupId: number): Promise<void>;

  getInvoiceTemplates(): Promise<InvoiceTemplate[]>;
  getInvoiceTemplatesByCategory(category: string): Promise<InvoiceTemplate[]>;
  getInvoiceTemplate(id: number): Promise<InvoiceTemplate | undefined>;
  createInvoiceTemplate(data: InsertInvoiceTemplate): Promise<InvoiceTemplate>;
  updateInvoiceTemplate(id: number, data: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | undefined>;
  deleteInvoiceTemplate(id: number): Promise<void>;

  getNotificationChannels(): Promise<NotificationChannel[]>;
  getNotificationChannel(id: number): Promise<NotificationChannel | undefined>;
  createNotificationChannel(data: InsertNotificationChannel): Promise<NotificationChannel>;
  updateNotificationChannel(id: number, data: Partial<InsertNotificationChannel>): Promise<NotificationChannel | undefined>;
  deleteNotificationChannel(id: number): Promise<void>;

  getNotificationTriggers(): Promise<NotificationTrigger[]>;
  getNotificationTriggersByCategory(category: string): Promise<NotificationTrigger[]>;
  getNotificationTrigger(id: number): Promise<NotificationTrigger | undefined>;
  createNotificationTrigger(data: InsertNotificationTrigger): Promise<NotificationTrigger>;
  updateNotificationTrigger(id: number, data: Partial<InsertNotificationTrigger>): Promise<NotificationTrigger | undefined>;
  deleteNotificationTrigger(id: number): Promise<void>;

  getNotificationLogs(): Promise<NotificationLog[]>;
  getNotificationLogStats(): Promise<{ total: number; delivered: number; failed: number; pending: number }>;
  createNotificationLog(data: InsertNotificationLog): Promise<NotificationLog>;
  updateNotificationLog(id: number, data: Partial<InsertNotificationLog>): Promise<NotificationLog | undefined>;

  getGatewayWebhooks(): Promise<GatewayWebhook[]>;
  getGatewayWebhooksByGateway(gatewayId: number): Promise<GatewayWebhook[]>;
  getGatewayWebhook(id: number): Promise<GatewayWebhook | undefined>;
  createGatewayWebhook(data: InsertGatewayWebhook): Promise<GatewayWebhook>;
  updateGatewayWebhook(id: number, data: Partial<InsertGatewayWebhook>): Promise<GatewayWebhook | undefined>;
  deleteGatewayWebhook(id: number): Promise<void>;

  getGatewaySettlements(): Promise<GatewaySettlement[]>;
  getGatewaySettlementsByGateway(gatewayId: number): Promise<GatewaySettlement[]>;
  createGatewaySettlement(data: InsertGatewaySettlement): Promise<GatewaySettlement>;
  updateGatewaySettlement(id: number, data: Partial<InsertGatewaySettlement>): Promise<GatewaySettlement | undefined>;
  getGatewaySettlement(id: number): Promise<GatewaySettlement | undefined>;
  deleteGatewaySettlement(id: number): Promise<void>;

  getFiberRoutes(): Promise<FiberRoute[]>;
  getFiberRoute(id: number): Promise<FiberRoute | undefined>;
  createFiberRoute(data: InsertFiberRoute): Promise<FiberRoute>;
  updateFiberRoute(id: number, data: Partial<InsertFiberRoute>): Promise<FiberRoute | undefined>;
  deleteFiberRoute(id: number): Promise<void>;

  getNetworkTowers(): Promise<NetworkTower[]>;
  getNetworkTower(id: number): Promise<NetworkTower | undefined>;
  createNetworkTower(data: InsertNetworkTower): Promise<NetworkTower>;
  updateNetworkTower(id: number, data: Partial<InsertNetworkTower>): Promise<NetworkTower | undefined>;
  deleteNetworkTower(id: number): Promise<void>;

  getOltDevices(): Promise<OltDevice[]>;
  getOltDevice(id: number): Promise<OltDevice | undefined>;
  createOltDevice(data: InsertOltDevice): Promise<OltDevice>;
  updateOltDevice(id: number, data: Partial<InsertOltDevice>): Promise<OltDevice | undefined>;
  deleteOltDevice(id: number): Promise<void>;

  getGponSplitters(): Promise<GponSplitter[]>;
  getGponSplitter(id: number): Promise<GponSplitter | undefined>;
  createGponSplitter(data: InsertGponSplitter): Promise<GponSplitter>;
  updateGponSplitter(id: number, data: Partial<InsertGponSplitter>): Promise<GponSplitter | undefined>;
  deleteGponSplitter(id: number): Promise<void>;

  getOnuDevices(): Promise<OnuDevice[]>;
  getOnuDevice(id: number): Promise<OnuDevice | undefined>;
  createOnuDevice(data: InsertOnuDevice): Promise<OnuDevice>;
  updateOnuDevice(id: number, data: Partial<InsertOnuDevice>): Promise<OnuDevice | undefined>;
  deleteOnuDevice(id: number): Promise<void>;

  getP2pLinks(): Promise<P2pLink[]>;
  getP2pLink(id: number): Promise<P2pLink | undefined>;
  createP2pLink(data: InsertP2pLink): Promise<P2pLink>;
  updateP2pLink(id: number, data: Partial<InsertP2pLink>): Promise<P2pLink | undefined>;
  deleteP2pLink(id: number): Promise<void>;

  getServiceSchedulerRequests(customerId: number): Promise<ServiceSchedulerRequest[]>;
  getServiceSchedulerRequest(id: number): Promise<ServiceSchedulerRequest | undefined>;
  createServiceSchedulerRequest(data: InsertServiceSchedulerRequest): Promise<ServiceSchedulerRequest>;
  updateServiceSchedulerRequest(id: number, data: Partial<InsertServiceSchedulerRequest>): Promise<ServiceSchedulerRequest | undefined>;
  deleteServiceSchedulerRequest(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(desc(customers.id));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(eq(customers.id, id));
    return c;
  }

  async createCustomer(c: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values(c).returning();
    return created;
  }

  async updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db.update(customers).set(data).where(eq(customers.id, id)).returning();
    return updated;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  async getCustomerTypes(): Promise<CustomerType[]> {
    return db.select().from(customerTypes).orderBy(customerTypes.sortOrder);
  }

  async getCustomerType(id: number): Promise<CustomerType | undefined> {
    const [item] = await db.select().from(customerTypes).where(eq(customerTypes.id, id));
    return item;
  }

  async createCustomerType(data: InsertCustomerType): Promise<CustomerType> {
    const [item] = await db.insert(customerTypes).values(data).returning();
    return item;
  }

  async updateCustomerType(id: number, data: Partial<InsertCustomerType>): Promise<CustomerType | undefined> {
    const [item] = await db.update(customerTypes).set(data).where(eq(customerTypes.id, id)).returning();
    return item;
  }

  async deleteCustomerType(id: number): Promise<void> {
    await db.delete(customerTypes).where(eq(customerTypes.id, id));
  }

  async getResellerTypes(): Promise<ResellerType[]> {
    return db.select().from(resellerTypes).orderBy(resellerTypes.sortOrder, resellerTypes.id);
  }

  async getResellerType(id: number): Promise<ResellerType | undefined> {
    const [item] = await db.select().from(resellerTypes).where(eq(resellerTypes.id, id));
    return item;
  }

  async createResellerType(data: InsertResellerType): Promise<ResellerType> {
    const [item] = await db.insert(resellerTypes).values(data).returning();
    return item;
  }

  async updateResellerType(id: number, data: Partial<InsertResellerType>): Promise<ResellerType | undefined> {
    const [item] = await db.update(resellerTypes).set(data).where(eq(resellerTypes.id, id)).returning();
    return item;
  }

  async deleteResellerType(id: number): Promise<void> {
    await db.delete(resellerTypes).where(eq(resellerTypes.id, id));
  }

  async getCirCustomers(): Promise<CirCustomer[]> {
    return db.select().from(cirCustomers).orderBy(desc(cirCustomers.id));
  }

  async getCirCustomer(id: number): Promise<CirCustomer | undefined> {
    const [item] = await db.select().from(cirCustomers).where(eq(cirCustomers.id, id));
    return item;
  }

  async createCirCustomer(data: InsertCirCustomer): Promise<CirCustomer> {
    const [item] = await db.insert(cirCustomers).values(data).returning();
    return item;
  }

  async updateCirCustomer(id: number, data: Partial<InsertCirCustomer>): Promise<CirCustomer | undefined> {
    const [item] = await db.update(cirCustomers).set(data).where(eq(cirCustomers.id, id)).returning();
    return item;
  }

  async deleteCirCustomer(id: number): Promise<void> {
    await db.delete(cirCustomers).where(eq(cirCustomers.id, id));
  }

  async getCorporateCustomers(): Promise<CorporateCustomer[]> {
    return db.select().from(corporateCustomers).orderBy(desc(corporateCustomers.id));
  }

  async getCorporateCustomer(id: number): Promise<CorporateCustomer | undefined> {
    const [item] = await db.select().from(corporateCustomers).where(eq(corporateCustomers.id, id));
    return item;
  }

  async createCorporateCustomer(data: InsertCorporateCustomer): Promise<CorporateCustomer> {
    const [item] = await db.insert(corporateCustomers).values(data).returning();
    return item;
  }

  async updateCorporateCustomer(id: number, data: Partial<InsertCorporateCustomer>): Promise<CorporateCustomer | undefined> {
    const [item] = await db.update(corporateCustomers).set(data).where(eq(corporateCustomers.id, id)).returning();
    return item;
  }

  async deleteCorporateCustomer(id: number): Promise<void> {
    await db.delete(corporateCustomers).where(eq(corporateCustomers.id, id));
  }

  async getCorporateConnections(corporateId: number): Promise<CorporateConnection[]> {
    return db.select().from(corporateConnections).where(eq(corporateConnections.corporateId, corporateId)).orderBy(desc(corporateConnections.id));
  }

  async createCorporateConnection(data: InsertCorporateConnection): Promise<CorporateConnection> {
    const [item] = await db.insert(corporateConnections).values(data).returning();
    return item;
  }

  async updateCorporateConnection(id: number, data: Partial<InsertCorporateConnection>): Promise<CorporateConnection | undefined> {
    const [item] = await db.update(corporateConnections).set(data).where(eq(corporateConnections.id, id)).returning();
    return item;
  }

  async deleteCorporateConnection(id: number): Promise<void> {
    await db.delete(corporateConnections).where(eq(corporateConnections.id, id));
  }

  async getPackages(): Promise<Package[]> {
    return db.select().from(packages).orderBy(desc(packages.id));
  }

  async getPackage(id: number): Promise<Package | undefined> {
    const [p] = await db.select().from(packages).where(eq(packages.id, id));
    return p;
  }

  async createPackage(p: InsertPackage): Promise<Package> {
    const [created] = await db.insert(packages).values(p).returning();
    return created;
  }

  async updatePackage(id: number, data: Partial<InsertPackage>): Promise<Package | undefined> {
    const [updated] = await db.update(packages).set(data).where(eq(packages.id, id)).returning();
    return updated;
  }

  async deletePackage(id: number): Promise<void> {
    await db.delete(packages).where(eq(packages.id, id));
  }

  async getInvoices(): Promise<(Invoice & { customerName?: string; customerCode?: string; customerPhone?: string; customerArea?: string; customerZone?: string; customerType?: string; connectionType?: string; packageName?: string; packageSpeed?: string; customerServer?: string; customerUsernameIp?: string; customerExpireDate?: string; customerMonthlyBill?: string; customerBillingStatus?: string; customerStatus?: string })[]> {
    const result = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        customerId: invoices.customerId,
        amount: invoices.amount,
        tax: invoices.tax,
        totalAmount: invoices.totalAmount,
        status: invoices.status,
        dueDate: invoices.dueDate,
        issueDate: invoices.issueDate,
        paidDate: invoices.paidDate,
        description: invoices.description,
        isRecurring: invoices.isRecurring,
        serviceType: invoices.serviceType,
        customerName: customers.fullName,
        customerCode: customers.customerId,
        customerPhone: customers.phone,
        customerArea: customers.area,
        customerZone: customers.zone,
        customerType: customers.customerType,
        connectionType: customers.connectionType,
        packageName: packages.name,
        packageSpeed: packages.speed,
        customerServer: customers.server,
        customerUsernameIp: customers.usernameIp,
        customerExpireDate: customers.expireDate,
        customerMonthlyBill: customers.monthlyBill,
        customerBillingStatus: customers.billingStatus,
        customerStatus: customers.status,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(packages, eq(customers.packageId, packages.id))
      .orderBy(desc(invoices.id));
    return result.map(r => ({
      ...r,
      customerName: r.customerName || undefined,
      customerCode: r.customerCode || undefined,
      customerPhone: r.customerPhone || undefined,
      customerArea: r.customerArea || undefined,
      customerZone: r.customerZone || undefined,
      customerType: r.customerType || undefined,
      connectionType: r.connectionType || undefined,
      packageName: r.packageName || undefined,
      packageSpeed: r.packageSpeed || undefined,
      customerServer: r.customerServer || undefined,
      customerUsernameIp: r.customerUsernameIp || undefined,
      customerExpireDate: r.customerExpireDate || undefined,
      customerMonthlyBill: r.customerMonthlyBill || undefined,
      customerBillingStatus: r.customerBillingStatus || undefined,
      customerStatus: r.customerStatus || undefined,
    }));
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
    return inv;
  }

  async getInvoicesByCustomer(customerId: number): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.customerId, customerId)).orderBy(desc(invoices.id));
  }

  async getInvoicesByCirCustomer(cirCustomerId: number): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.cirCustomerId, cirCustomerId)).orderBy(desc(invoices.id));
  }

  async getInvoicesByCorporateCustomer(corporateCustomerId: number): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.corporateCustomerId, corporateCustomerId)).orderBy(desc(invoices.id));
  }

  async createInvoice(i: InsertInvoice): Promise<Invoice> {
    const [created] = await db.insert(invoices).values(i).returning();
    return created;
  }

  async updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updated] = await db.update(invoices).set(data).where(eq(invoices.id, id)).returning();
    return updated;
  }

  async deleteInvoice(id: number): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId)).orderBy(invoiceItems.sortOrder);
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const [created] = await db.insert(invoiceItems).values(item).returning();
    return created;
  }

  async updateInvoiceItem(id: number, data: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    const [updated] = await db.update(invoiceItems).set(data).where(eq(invoiceItems.id, id)).returning();
    return updated;
  }

  async deleteInvoiceItem(id: number): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.id, id));
  }

  async deleteInvoiceItemsByInvoiceId(invoiceId: number): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async getTickets(): Promise<(Ticket & { customerName?: string; customerCode?: string; customerPhone?: string; customerArea?: string })[]> {
    const result = await db
      .select({
        id: tickets.id,
        ticketNumber: tickets.ticketNumber,
        customerId: tickets.customerId,
        subject: tickets.subject,
        description: tickets.description,
        priority: tickets.priority,
        status: tickets.status,
        category: tickets.category,
        assignedTo: tickets.assignedTo,
        createdAt: tickets.createdAt,
        resolvedAt: tickets.resolvedAt,
        customerName: customers.fullName,
        customerCode: customers.customerId,
        customerPhone: customers.phone,
        customerArea: customers.area,
      })
      .from(tickets)
      .leftJoin(customers, eq(tickets.customerId, customers.id))
      .orderBy(desc(tickets.id));
    return result.map(r => ({
      ...r,
      customerName: r.customerName || undefined,
      customerCode: r.customerCode || undefined,
      customerPhone: r.customerPhone || undefined,
      customerArea: r.customerArea || undefined,
    }));
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    const [t] = await db.select().from(tickets).where(eq(tickets.id, id));
    return t;
  }

  async getTicketsByCustomer(customerId: number): Promise<Ticket[]> {
    return db.select().from(tickets).where(eq(tickets.customerId, customerId)).orderBy(desc(tickets.id));
  }

  async getTicketsByCirCustomer(cirCustomerId: number): Promise<Ticket[]> {
    return db.select().from(tickets).where(eq(tickets.cirCustomerId, cirCustomerId)).orderBy(desc(tickets.id));
  }

  async getTicketsByCorporateCustomer(corporateCustomerId: number): Promise<Ticket[]> {
    return db.select().from(tickets).where(eq(tickets.corporateCustomerId, corporateCustomerId)).orderBy(desc(tickets.id));
  }

  async getBandwidthHistory(customerType: string, customerId: number): Promise<BandwidthHistory[]> {
    return db.select().from(bandwidthHistory)
      .where(and(eq(bandwidthHistory.customerType, customerType), eq(bandwidthHistory.customerId, customerId)))
      .orderBy(desc(bandwidthHistory.id));
  }

  async createBandwidthHistory(data: InsertBandwidthHistory): Promise<BandwidthHistory> {
    const [created] = await db.insert(bandwidthHistory).values(data).returning();
    return created;
  }

  async createTicket(t: InsertTicket): Promise<Ticket> {
    const [created] = await db.insert(tickets).values(t).returning();
    return created;
  }

  async updateTicket(id: number, data: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const [updated] = await db.update(tickets).set(data).where(eq(tickets.id, id)).returning();
    return updated;
  }

  async deleteTicket(id: number): Promise<void> {
    await db.delete(tickets).where(eq(tickets.id, id));
  }

  async getAreas(): Promise<Area[]> {
    return db.select().from(areas).orderBy(desc(areas.id));
  }

  async getArea(id: number): Promise<Area | undefined> {
    const [a] = await db.select().from(areas).where(eq(areas.id, id));
    return a;
  }

  async createArea(a: InsertArea): Promise<Area> {
    const [created] = await db.insert(areas).values(a).returning();
    return created;
  }

  async updateArea(id: number, data: Partial<InsertArea>): Promise<Area | undefined> {
    const [updated] = await db.update(areas).set(data).where(eq(areas.id, id)).returning();
    return updated;
  }

  async deleteArea(id: number): Promise<void> {
    await db.delete(areas).where(eq(areas.id, id));
  }

  async getVendors(): Promise<Vendor[]> {
    return db.select().from(vendors).orderBy(desc(vendors.id));
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    const [v] = await db.select().from(vendors).where(eq(vendors.id, id));
    return v;
  }

  async createVendor(v: InsertVendor): Promise<Vendor> {
    const [created] = await db.insert(vendors).values(v).returning();
    return created;
  }

  async updateVendor(id: number, data: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const [updated] = await db.update(vendors).set(data).where(eq(vendors.id, id)).returning();
    return updated;
  }

  async deleteVendor(id: number): Promise<void> {
    await db.delete(vendors).where(eq(vendors.id, id));
  }

  async getResellers(): Promise<Reseller[]> {
    return db.select().from(resellers).orderBy(desc(resellers.id));
  }

  async getReseller(id: number): Promise<Reseller | undefined> {
    const [r] = await db.select().from(resellers).where(eq(resellers.id, id));
    return r;
  }

  async createReseller(r: InsertReseller): Promise<Reseller> {
    const [created] = await db.insert(resellers).values(r).returning();
    return created;
  }

  async updateReseller(id: number, data: Partial<InsertReseller>): Promise<Reseller | undefined> {
    const [updated] = await db.update(resellers).set(data).where(eq(resellers.id, id)).returning();
    return updated;
  }

  async deleteReseller(id: number): Promise<void> {
    await db.delete(resellers).where(eq(resellers.id, id));
  }

  async getVendorWalletTransactions(vendorId: number): Promise<VendorWalletTransaction[]> {
    return db.select().from(vendorWalletTransactions).where(eq(vendorWalletTransactions.vendorId, vendorId)).orderBy(desc(vendorWalletTransactions.id));
  }

  async getAllVendorWalletTransactions(): Promise<VendorWalletTransaction[]> {
    return db.select().from(vendorWalletTransactions).orderBy(desc(vendorWalletTransactions.id));
  }

  async createVendorWalletTransaction(t: InsertVendorWalletTransaction): Promise<VendorWalletTransaction> {
    const [created] = await db.insert(vendorWalletTransactions).values(t).returning();
    return created;
  }

  async updateVendorWalletTransaction(id: number, data: Partial<InsertVendorWalletTransaction>): Promise<VendorWalletTransaction | undefined> {
    const [updated] = await db.update(vendorWalletTransactions).set(data).where(eq(vendorWalletTransactions.id, id)).returning();
    return updated;
  }

  async updateVendorWalletTransactionWithAmount(id: number, newAmount: number, data: Partial<InsertVendorWalletTransaction>): Promise<VendorWalletTransaction | undefined> {
    const existing = await db.select().from(vendorWalletTransactions).where(eq(vendorWalletTransactions.id, id));
    if (!existing.length) return undefined;
    const txn = existing[0];
    const oldAmount = parseFloat(txn.amount);
    const amountDiff = newAmount - oldAmount;
    const isCredit = txn.type === "credit" || txn.type === "recharge";
    const newBalanceAfter = parseFloat(txn.balanceAfter) + amountDiff;
    const [updated] = await db.update(vendorWalletTransactions).set({ ...data, amount: newAmount.toString(), balanceAfter: newBalanceAfter.toString() }).where(eq(vendorWalletTransactions.id, id)).returning();
    const vendor = await this.getVendor(txn.vendorId);
    if (vendor) {
      const currentBalance = parseFloat(vendor.walletBalance || "0");
      const adjustedBalance = isCredit ? currentBalance + amountDiff : currentBalance - amountDiff;
      await db.update(vendors).set({ walletBalance: adjustedBalance.toString() }).where(eq(vendors.id, txn.vendorId));
    }
    return updated;
  }

  async rechargeVendorWallet(vendorId: number, amount: number, reference?: string, paymentMethod?: string, performedBy?: string, approvedBy?: string, notes?: string): Promise<Vendor> {
    const vendor = await this.getVendor(vendorId);
    if (!vendor) throw new Error("Vendor not found");
    const currentBalance = parseFloat(vendor.walletBalance || "0");
    const newBalance = currentBalance + amount;
    const now = new Date().toISOString();
    await this.createVendorWalletTransaction({
      vendorId,
      type: "credit",
      amount: amount.toString(),
      balanceAfter: newBalance.toString(),
      reference: reference || `Recharge-${Date.now()}`,
      description: `Wallet recharge of ${amount}`,
      paymentMethod: paymentMethod || null,
      performedBy: performedBy || null,
      approvedBy: approvedBy || null,
      notes: notes || null,
      createdAt: now,
    });
    const [updated] = await db.update(vendors).set({ walletBalance: newBalance.toString(), lastRechargeDate: now }).where(eq(vendors.id, vendorId)).returning();
    return updated;
  }

  async deductVendorWallet(vendorId: number, amount: number, reference?: string, customerId?: number, resellerId?: number, reason?: string, performedBy?: string, approvedBy?: string, notes?: string): Promise<Vendor> {
    const vendor = await this.getVendor(vendorId);
    if (!vendor) throw new Error("Vendor not found");
    const currentBalance = parseFloat(vendor.walletBalance || "0");
    if (currentBalance < amount) throw new Error("Insufficient vendor wallet balance");
    const newBalance = currentBalance - amount;
    const now = new Date().toISOString();
    await this.createVendorWalletTransaction({
      vendorId,
      type: "debit",
      amount: amount.toString(),
      balanceAfter: newBalance.toString(),
      reference: reference || `Deduction-${Date.now()}`,
      description: `Wallet deduction of ${amount}`,
      reason: reason || null,
      performedBy: performedBy || null,
      approvedBy: approvedBy || null,
      notes: notes || null,
      customerId,
      resellerId,
      createdAt: now,
    });
    const [updated] = await db.update(vendors).set({ walletBalance: newBalance.toString() }).where(eq(vendors.id, vendorId)).returning();
    return updated;
  }

  async getResellerWalletTransactions(resellerId: number): Promise<ResellerWalletTransaction[]> {
    return db.select().from(resellerWalletTransactions).where(eq(resellerWalletTransactions.resellerId, resellerId)).orderBy(desc(resellerWalletTransactions.id));
  }

  async getAllResellerWalletTransactions(): Promise<ResellerWalletTransaction[]> {
    return db.select().from(resellerWalletTransactions).orderBy(desc(resellerWalletTransactions.id));
  }

  async createResellerWalletTransaction(t: InsertResellerWalletTransaction): Promise<ResellerWalletTransaction> {
    const [created] = await db.insert(resellerWalletTransactions).values(t).returning();
    return created;
  }

  async rechargeResellerWallet(resellerId: number, amount: number, reference?: string, paymentMethod?: string, remarks?: string, createdBy?: string, paymentStatus?: string, vendorId?: number, bankAccountId?: number): Promise<Reseller> {
    const reseller = await this.getReseller(resellerId);
    if (!reseller) throw new Error("Reseller not found");
    const currentBalance = parseFloat(reseller.walletBalance || "0");
    const newBalance = currentBalance + amount;
    const now = new Date().toISOString();
    const txnRef = reference || `Recharge-${Date.now()}`;
    await this.createResellerWalletTransaction({
      resellerId,
      type: "credit",
      category: "recharge",
      amount: amount.toString(),
      balanceAfter: newBalance.toString(),
      reference: txnRef,
      description: remarks || `Wallet recharge of ${amount}`,
      paymentMethod: paymentMethod || "cash",
      paymentStatus: paymentStatus || "paid",
      vendorId: vendorId || undefined,
      bankAccountId: bankAccountId || undefined,
      createdBy: createdBy || "admin",
      createdAt: now,
    });
    if (bankAccountId) {
      try {
        await this.debitCompanyAccount(bankAccountId, amount, "reseller_recharge", String(resellerId), `Recharge for reseller #${resellerId}`, remarks, createdBy || "admin");
      } catch (_) {}
    }
    const [updated] = await db.update(resellers).set({ walletBalance: newBalance.toString() }).where(eq(resellers.id, resellerId)).returning();
    return updated;
  }

  async deductResellerWallet(resellerId: number, amount: number, vendorId?: number, customerId?: number, reference?: string, category?: string, createdBy?: string): Promise<Reseller> {
    const reseller = await this.getReseller(resellerId);
    if (!reseller) throw new Error("Reseller not found");
    const currentBalance = parseFloat(reseller.walletBalance || "0");
    const creditLimit = parseFloat(reseller.creditLimit || "0");
    if (currentBalance + creditLimit < amount) throw new Error("Insufficient balance (exceeds credit limit)");
    const newBalance = currentBalance - amount;
    const now = new Date().toISOString();
    await this.createResellerWalletTransaction({
      resellerId,
      type: "debit",
      category: category || "general",
      amount: amount.toString(),
      balanceAfter: newBalance.toString(),
      reference: reference || `Deduction-${Date.now()}`,
      description: `Wallet deduction of ${amount}`,
      vendorId,
      customerId,
      createdBy: createdBy || "admin",
      createdAt: now,
    });
    const [updated] = await db.update(resellers).set({ walletBalance: newBalance.toString() }).where(eq(resellers.id, resellerId)).returning();
    return updated;
  }

  async getResellerMonthlySummaries(resellerId: number, month?: string): Promise<ResellerMonthlySummary[]> {
    if (month) {
      return db.select().from(resellerMonthlySummaries)
        .where(and(eq(resellerMonthlySummaries.resellerId, resellerId), eq(resellerMonthlySummaries.month, month)))
        .orderBy(desc(resellerMonthlySummaries.id));
    }
    return db.select().from(resellerMonthlySummaries)
      .where(eq(resellerMonthlySummaries.resellerId, resellerId))
      .orderBy(desc(resellerMonthlySummaries.id));
  }

  async getResellerMonthlySummary(id: number): Promise<ResellerMonthlySummary | undefined> {
    const [row] = await db.select().from(resellerMonthlySummaries).where(eq(resellerMonthlySummaries.id, id));
    return row;
  }

  async upsertResellerMonthlySummary(data: InsertResellerMonthlySummary): Promise<ResellerMonthlySummary> {
    const existing = await db.select().from(resellerMonthlySummaries)
      .where(and(
        eq(resellerMonthlySummaries.resellerId, data.resellerId),
        eq(resellerMonthlySummaries.vendorPackageId, data.vendorPackageId),
        eq(resellerMonthlySummaries.month, data.month),
      ));
    if (existing.length > 0) {
      const [updated] = await db.update(resellerMonthlySummaries)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(resellerMonthlySummaries.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(resellerMonthlySummaries).values(data).returning();
    return created;
  }

  async deleteResellerMonthlySummary(id: number): Promise<void> {
    await db.delete(resellerMonthlySummaries).where(eq(resellerMonthlySummaries.id, id));
  }

  async getBandwidthPurchases(vendorId?: number): Promise<BandwidthPurchase[]> {
    if (vendorId) {
      return db.select().from(bandwidthPurchases).where(eq(bandwidthPurchases.vendorId, vendorId)).orderBy(desc(bandwidthPurchases.id));
    }
    return db.select().from(bandwidthPurchases).orderBy(desc(bandwidthPurchases.id));
  }

  async getBandwidthPurchase(id: number): Promise<BandwidthPurchase | undefined> {
    const [row] = await db.select().from(bandwidthPurchases).where(eq(bandwidthPurchases.id, id));
    return row;
  }

  async createBandwidthPurchase(data: InsertBandwidthPurchase): Promise<BandwidthPurchase> {
    const [row] = await db.insert(bandwidthPurchases).values(data).returning();
    return row;
  }

  async updateBandwidthPurchase(id: number, data: Partial<InsertBandwidthPurchase>): Promise<BandwidthPurchase> {
    const [row] = await db.update(bandwidthPurchases).set(data).where(eq(bandwidthPurchases.id, id)).returning();
    return row;
  }

  async deleteBandwidthPurchase(id: number): Promise<void> {
    await db.delete(bandwidthPurchases).where(eq(bandwidthPurchases.id, id));
  }

  async getCompanyBankAccounts(): Promise<CompanyBankAccount[]> {
    return db.select().from(companyBankAccounts).orderBy(desc(companyBankAccounts.id));
  }

  async getCompanyBankAccount(id: number): Promise<CompanyBankAccount | undefined> {
    const [row] = await db.select().from(companyBankAccounts).where(eq(companyBankAccounts.id, id));
    return row;
  }

  async createCompanyBankAccount(data: InsertCompanyBankAccount): Promise<CompanyBankAccount> {
    const balance = data.openingBalance || "0";
    const [row] = await db.insert(companyBankAccounts).values({ ...data, currentBalance: balance }).returning();
    return row;
  }

  async updateCompanyBankAccount(id: number, data: Partial<InsertCompanyBankAccount>): Promise<CompanyBankAccount> {
    const [row] = await db.update(companyBankAccounts).set(data).where(eq(companyBankAccounts.id, id)).returning();
    return row;
  }

  async deleteCompanyBankAccount(id: number): Promise<void> {
    await db.delete(companyAccountLedger).where(eq(companyAccountLedger.accountId, id));
    await db.delete(companyBankAccounts).where(eq(companyBankAccounts.id, id));
  }

  async createCompanyAccountLedgerEntry(data: InsertCompanyAccountLedger): Promise<CompanyAccountLedgerEntry> {
    const [row] = await db.insert(companyAccountLedger).values(data).returning();
    return row;
  }

  async getCompanyAccountLedger(accountId?: number): Promise<CompanyAccountLedgerEntry[]> {
    if (accountId) {
      return db.select().from(companyAccountLedger).where(eq(companyAccountLedger.accountId, accountId)).orderBy(desc(companyAccountLedger.id));
    }
    return db.select().from(companyAccountLedger).orderBy(desc(companyAccountLedger.id));
  }

  async creditCompanyAccount(accountId: number, amount: number, referenceModule?: string, referenceId?: string, description?: string, remarks?: string, createdBy?: string): Promise<CompanyBankAccount> {
    const account = await this.getCompanyBankAccount(accountId);
    if (!account) throw new Error("Company account not found");
    const newBalance = parseFloat(account.currentBalance || "0") + amount;
    await this.createCompanyAccountLedgerEntry({
      accountId, type: "credit", amount: amount.toString(), balanceAfter: newBalance.toString(),
      referenceModule, referenceId, description, remarks, createdBy: createdBy || "admin",
    });
    const [updated] = await db.update(companyBankAccounts).set({ currentBalance: newBalance.toString() }).where(eq(companyBankAccounts.id, accountId)).returning();
    return updated;
  }

  async debitCompanyAccount(accountId: number, amount: number, referenceModule?: string, referenceId?: string, description?: string, remarks?: string, createdBy?: string): Promise<CompanyBankAccount> {
    const account = await this.getCompanyBankAccount(accountId);
    if (!account) throw new Error("Company account not found");
    const newBalance = parseFloat(account.currentBalance || "0") - amount;
    await this.createCompanyAccountLedgerEntry({
      accountId, type: "debit", amount: amount.toString(), balanceAfter: newBalance.toString(),
      referenceModule, referenceId, description, remarks, createdBy: createdBy || "admin",
    });
    const [updated] = await db.update(companyBankAccounts).set({ currentBalance: newBalance.toString() }).where(eq(companyBankAccounts.id, accountId)).returning();
    return updated;
  }

  async transferBetweenAccounts(fromAccountId: number, toAccountId: number, amount: number, remarks?: string, createdBy?: string): Promise<void> {
    await this.debitCompanyAccount(fromAccountId, amount, "transfer", String(toAccountId), `Transfer to account #${toAccountId}`, remarks, createdBy);
    await this.creditCompanyAccount(toAccountId, amount, "transfer", String(fromAccountId), `Transfer from account #${fromAccountId}`, remarks, createdBy);
  }

  async getResellerCompanyPackages(): Promise<ResellerCompanyPackage[]> {
    return db.select().from(resellerCompanyPackages).orderBy(desc(resellerCompanyPackages.id));
  }

  async getResellerCompanyPackage(id: number): Promise<ResellerCompanyPackage | undefined> {
    const [row] = await db.select().from(resellerCompanyPackages).where(eq(resellerCompanyPackages.id, id));
    return row;
  }

  async createResellerCompanyPackage(data: InsertResellerCompanyPackage): Promise<ResellerCompanyPackage> {
    const [row] = await db.insert(resellerCompanyPackages).values(data).returning();
    return row;
  }

  async updateResellerCompanyPackage(id: number, data: Partial<InsertResellerCompanyPackage>): Promise<ResellerCompanyPackage> {
    const [row] = await db.update(resellerCompanyPackages).set(data).where(eq(resellerCompanyPackages.id, id)).returning();
    return row;
  }

  async deleteResellerCompanyPackage(id: number): Promise<void> {
    await db.delete(resellerCompanyPackages).where(eq(resellerCompanyPackages.id, id));
  }

  async getResellerPackageAssignments(resellerId?: number): Promise<ResellerPackageAssignment[]> {
    if (resellerId) {
      return db.select().from(resellerPackageAssignments).where(eq(resellerPackageAssignments.resellerId, resellerId)).orderBy(desc(resellerPackageAssignments.id));
    }
    return db.select().from(resellerPackageAssignments).orderBy(desc(resellerPackageAssignments.id));
  }

  async createResellerPackageAssignment(data: InsertResellerPackageAssignment): Promise<ResellerPackageAssignment> {
    const [row] = await db.insert(resellerPackageAssignments).values(data).returning();
    return row;
  }

  async updateResellerPackageAssignment(id: number, data: Partial<InsertResellerPackageAssignment>): Promise<ResellerPackageAssignment> {
    const [row] = await db.update(resellerPackageAssignments).set(data).where(eq(resellerPackageAssignments.id, id)).returning();
    return row;
  }

  async deleteResellerPackageAssignment(id: number): Promise<void> {
    await db.delete(resellerPackageAssignments).where(eq(resellerPackageAssignments.id, id));
  }

  async getVendorPackages(vendorId?: number): Promise<VendorPackage[]> {
    if (vendorId) {
      return db.select().from(vendorPackages).where(eq(vendorPackages.vendorId, vendorId)).orderBy(desc(vendorPackages.id));
    }
    return db.select().from(vendorPackages).orderBy(desc(vendorPackages.id));
  }

  async getVendorPackage(id: number): Promise<VendorPackage | undefined> {
    const [p] = await db.select().from(vendorPackages).where(eq(vendorPackages.id, id));
    return p;
  }

  async createVendorPackage(p: InsertVendorPackage): Promise<VendorPackage> {
    const ispMargin = (parseFloat(p.ispSellingPrice) - parseFloat(p.vendorPrice)).toString();
    const resellerMargin = p.resellerPrice ? (parseFloat(p.resellerPrice) - parseFloat(p.vendorPrice)).toString() : null;
    const [created] = await db.insert(vendorPackages).values({ ...p, ispMargin, resellerMargin }).returning();
    return created;
  }

  async updateVendorPackage(id: number, data: Partial<InsertVendorPackage>): Promise<VendorPackage | undefined> {
    const updates: any = { ...data };
    if (data.vendorPrice && data.ispSellingPrice) {
      updates.ispMargin = (parseFloat(data.ispSellingPrice) - parseFloat(data.vendorPrice)).toString();
    }
    if (data.vendorPrice && data.resellerPrice) {
      updates.resellerMargin = (parseFloat(data.resellerPrice) - parseFloat(data.vendorPrice)).toString();
    }
    const [updated] = await db.update(vendorPackages).set(updates).where(eq(vendorPackages.id, id)).returning();
    return updated;
  }

  async deleteVendorPackage(id: number): Promise<void> {
    await db.delete(vendorPackages).where(eq(vendorPackages.id, id));
  }

  async getVendorBandwidthLinks(vendorId?: number): Promise<VendorBandwidthLink[]> {
    if (vendorId) {
      return db.select().from(vendorBandwidthLinks).where(eq(vendorBandwidthLinks.vendorId, vendorId)).orderBy(desc(vendorBandwidthLinks.id));
    }
    return db.select().from(vendorBandwidthLinks).orderBy(desc(vendorBandwidthLinks.id));
  }

  async getVendorBandwidthLink(id: number): Promise<VendorBandwidthLink | undefined> {
    const [link] = await db.select().from(vendorBandwidthLinks).where(eq(vendorBandwidthLinks.id, id));
    return link;
  }

  async createVendorBandwidthLink(l: InsertVendorBandwidthLink): Promise<VendorBandwidthLink> {
    const [created] = await db.insert(vendorBandwidthLinks).values(l).returning();
    return created;
  }

  async updateVendorBandwidthLink(id: number, data: Partial<InsertVendorBandwidthLink>): Promise<VendorBandwidthLink | undefined> {
    const [updated] = await db.update(vendorBandwidthLinks).set(data).where(eq(vendorBandwidthLinks.id, id)).returning();
    return updated;
  }

  async deleteVendorBandwidthLink(id: number): Promise<void> {
    await db.delete(vendorBandwidthLinks).where(eq(vendorBandwidthLinks.id, id));
  }

  async getBandwidthChangeHistory(vendorId?: number): Promise<BandwidthChangeHistory[]> {
    if (vendorId) {
      return db.select().from(bandwidthChangeHistory).where(eq(bandwidthChangeHistory.vendorId, vendorId)).orderBy(desc(bandwidthChangeHistory.id));
    }
    return db.select().from(bandwidthChangeHistory).orderBy(desc(bandwidthChangeHistory.id));
  }

  async getBandwidthChangeHistoryByLink(linkId: number): Promise<BandwidthChangeHistory[]> {
    return db.select().from(bandwidthChangeHistory).where(eq(bandwidthChangeHistory.linkId, linkId)).orderBy(desc(bandwidthChangeHistory.id));
  }

  async getBandwidthChange(id: number): Promise<BandwidthChangeHistory | undefined> {
    const [record] = await db.select().from(bandwidthChangeHistory).where(eq(bandwidthChangeHistory.id, id));
    return record;
  }

  async createBandwidthChange(data: InsertBandwidthChangeHistory): Promise<BandwidthChangeHistory> {
    const [created] = await db.insert(bandwidthChangeHistory).values(data).returning();
    return created;
  }

  async updateBandwidthChange(id: number, data: Partial<InsertBandwidthChangeHistory>): Promise<BandwidthChangeHistory | undefined> {
    const [updated] = await db.update(bandwidthChangeHistory).set(data).where(eq(bandwidthChangeHistory.id, id)).returning();
    return updated;
  }

  async deleteBandwidthChange(id: number): Promise<void> {
    await db.delete(bandwidthChangeHistory).where(eq(bandwidthChangeHistory.id, id));
  }

  async getAccountTypes(): Promise<AccountType[]> {
    return db.select().from(accountTypes).orderBy(accountTypes.sortOrder, accountTypes.id);
  }

  async getAccountType(id: number): Promise<AccountType | undefined> {
    const [a] = await db.select().from(accountTypes).where(eq(accountTypes.id, id));
    return a;
  }

  async createAccountType(a: InsertAccountType): Promise<AccountType> {
    const [created] = await db.insert(accountTypes).values(a).returning();
    return created;
  }

  async updateAccountType(id: number, data: Partial<InsertAccountType>): Promise<AccountType | undefined> {
    const [updated] = await db.update(accountTypes).set(data).where(eq(accountTypes.id, id)).returning();
    return updated;
  }

  async deleteAccountType(id: number): Promise<void> {
    await db.delete(accountTypes).where(eq(accountTypes.id, id));
  }

  async getAccounts(): Promise<Account[]> {
    return db.select().from(accounts).orderBy(accounts.code);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [a] = await db.select().from(accounts).where(eq(accounts.id, id));
    return a;
  }

  async createAccount(a: InsertAccount): Promise<Account> {
    const [created] = await db.insert(accounts).values(a).returning();
    return created;
  }

  async updateAccount(id: number, data: Partial<InsertAccount>): Promise<Account | undefined> {
    const [updated] = await db.update(accounts).set(data).where(eq(accounts.id, id)).returning();
    return updated;
  }

  async deleteAccount(id: number): Promise<void> {
    await db.delete(accounts).where(eq(accounts.id, id));
  }

  async getTransactions(): Promise<(Transaction & { customerName?: string; accountName?: string; vendorName?: string; debitAccountName?: string; creditAccountName?: string })[]> {
    const debitAccounts = aliasedTable(accounts, "debit_accounts");
    const creditAccounts = aliasedTable(accounts, "credit_accounts");
    const result = await db
      .select({
        id: transactions.id,
        txnId: transactions.txnId,
        type: transactions.type,
        category: transactions.category,
        amount: transactions.amount,
        tax: transactions.tax,
        discount: transactions.discount,
        netAmount: transactions.netAmount,
        debitAccountId: transactions.debitAccountId,
        creditAccountId: transactions.creditAccountId,
        accountId: transactions.accountId,
        customerId: transactions.customerId,
        vendorId: transactions.vendorId,
        invoiceId: transactions.invoiceId,
        paymentMethod: transactions.paymentMethod,
        reference: transactions.reference,
        chequeNumber: transactions.chequeNumber,
        transactionRef: transactions.transactionRef,
        description: transactions.description,
        attachment: transactions.attachment,
        date: transactions.date,
        status: transactions.status,
        branch: transactions.branch,
        costCenter: transactions.costCenter,
        autoAdjustReceivable: transactions.autoAdjustReceivable,
        allowPartialPayment: transactions.allowPartialPayment,
        sendNotification: transactions.sendNotification,
        lockAfterSave: transactions.lockAfterSave,
        isRecurring: transactions.isRecurring,
        requireApproval: transactions.requireApproval,
        createdBy: transactions.createdBy,
        createdAt: transactions.createdAt,
        customerName: customers.fullName,
        accountName: accounts.name,
        vendorName: vendors.name,
        debitAccountName: debitAccounts.name,
        creditAccountName: creditAccounts.name,
      })
      .from(transactions)
      .leftJoin(customers, eq(transactions.customerId, customers.id))
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(vendors, eq(transactions.vendorId, vendors.id))
      .leftJoin(debitAccounts, eq(transactions.debitAccountId, debitAccounts.id))
      .leftJoin(creditAccounts, eq(transactions.creditAccountId, creditAccounts.id))
      .orderBy(desc(transactions.id));
    return result.map(r => ({ ...r, customerName: r.customerName || undefined, accountName: r.accountName || undefined, vendorName: r.vendorName || undefined, debitAccountName: r.debitAccountName || undefined, creditAccountName: r.creditAccountName || undefined }));
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [t] = await db.select().from(transactions).where(eq(transactions.id, id));
    return t;
  }

  async getTransactionsByCustomer(customerId: number): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.customerId, customerId)).orderBy(desc(transactions.id));
  }

  async createTransaction(t: InsertTransaction): Promise<Transaction> {
    const [created] = await db.insert(transactions).values(t).returning();
    return created;
  }

  async updateTransaction(id: number, data: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [updated] = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
    return updated;
  }

  async deleteTransaction(id: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  async getBudgets(): Promise<Budget[]> {
    return db.select().from(budgets).orderBy(desc(budgets.id));
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    const [b] = await db.select().from(budgets).where(eq(budgets.id, id));
    return b;
  }

  async createBudget(b: InsertBudget): Promise<Budget> {
    const [created] = await db.insert(budgets).values(b).returning();
    return created;
  }

  async updateBudget(id: number, data: Partial<InsertBudget>): Promise<Budget | undefined> {
    const [updated] = await db.update(budgets).set(data).where(eq(budgets.id, id)).returning();
    return updated;
  }

  async deleteBudget(id: number): Promise<void> {
    await db.delete(budgetAllocations).where(eq(budgetAllocations.budgetId, id));
    await db.delete(budgets).where(eq(budgets.id, id));
  }

  async getBudgetAllocations(): Promise<(BudgetAllocation & { accountName?: string })[]> {
    const result = await db
      .select({
        id: budgetAllocations.id,
        budgetId: budgetAllocations.budgetId,
        accountId: budgetAllocations.accountId,
        department: budgetAllocations.department,
        costCenter: budgetAllocations.costCenter,
        allocatedAmount: budgetAllocations.allocatedAmount,
        usedAmount: budgetAllocations.usedAmount,
        notes: budgetAllocations.notes,
        createdAt: budgetAllocations.createdAt,
        accountName: accounts.name,
      })
      .from(budgetAllocations)
      .leftJoin(accounts, eq(budgetAllocations.accountId, accounts.id))
      .orderBy(desc(budgetAllocations.id));
    return result.map(r => ({ ...r, accountName: r.accountName || undefined }));
  }

  async getBudgetAllocationsByBudget(budgetId: number): Promise<(BudgetAllocation & { accountName?: string })[]> {
    const result = await db
      .select({
        id: budgetAllocations.id,
        budgetId: budgetAllocations.budgetId,
        accountId: budgetAllocations.accountId,
        department: budgetAllocations.department,
        costCenter: budgetAllocations.costCenter,
        allocatedAmount: budgetAllocations.allocatedAmount,
        usedAmount: budgetAllocations.usedAmount,
        notes: budgetAllocations.notes,
        createdAt: budgetAllocations.createdAt,
        accountName: accounts.name,
      })
      .from(budgetAllocations)
      .leftJoin(accounts, eq(budgetAllocations.accountId, accounts.id))
      .where(eq(budgetAllocations.budgetId, budgetId))
      .orderBy(budgetAllocations.id);
    return result.map(r => ({ ...r, accountName: r.accountName || undefined }));
  }

  async createBudgetAllocation(a: InsertBudgetAllocation): Promise<BudgetAllocation> {
    const [created] = await db.insert(budgetAllocations).values(a).returning();
    return created;
  }

  async updateBudgetAllocation(id: number, data: Partial<InsertBudgetAllocation>): Promise<BudgetAllocation | undefined> {
    const [updated] = await db.update(budgetAllocations).set(data).where(eq(budgetAllocations.id, id)).returning();
    return updated;
  }

  async deleteBudgetAllocation(id: number): Promise<void> {
    await db.delete(budgetAllocations).where(eq(budgetAllocations.id, id));
  }

  async getTasks(): Promise<(Task & { customerName?: string })[]> {
    const result = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        type: tasks.type,
        description: tasks.description,
        priority: tasks.priority,
        status: tasks.status,
        assignedTo: tasks.assignedTo,
        customerId: tasks.customerId,
        dueDate: tasks.dueDate,
        completedDate: tasks.completedDate,
        notes: tasks.notes,
        customerName: customers.fullName,
      })
      .from(tasks)
      .leftJoin(customers, eq(tasks.customerId, customers.id))
      .orderBy(desc(tasks.id));
    return result.map(r => ({ ...r, customerName: r.customerName || undefined }));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [t] = await db.select().from(tasks).where(eq(tasks.id, id));
    return t;
  }

  async createTask(t: InsertTask): Promise<Task> {
    const [created] = await db.insert(tasks).values(t).returning();
    return created;
  }

  async updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getAssetTypes(): Promise<AssetType[]> {
    return db.select().from(assetTypes).orderBy(desc(assetTypes.id));
  }

  async getAssetType(id: number): Promise<AssetType | undefined> {
    const [at] = await db.select().from(assetTypes).where(eq(assetTypes.id, id));
    return at;
  }

  async createAssetType(a: InsertAssetType): Promise<AssetType> {
    const [created] = await db.insert(assetTypes).values(a).returning();
    return created;
  }

  async updateAssetType(id: number, data: Partial<InsertAssetType>): Promise<AssetType | undefined> {
    const [updated] = await db.update(assetTypes).set(data).where(eq(assetTypes.id, id)).returning();
    return updated;
  }

  async deleteAssetType(id: number): Promise<void> {
    await db.delete(assetTypes).where(eq(assetTypes.id, id));
  }

  async getAssets(): Promise<Asset[]> {
    return db.select().from(assets).orderBy(desc(assets.id));
  }

  async getAsset(id: number): Promise<Asset | undefined> {
    const [a] = await db.select().from(assets).where(eq(assets.id, id));
    return a;
  }

  async createAsset(a: InsertAsset): Promise<Asset> {
    const [created] = await db.insert(assets).values(a).returning();
    return created;
  }

  async updateAsset(id: number, data: Partial<InsertAsset>): Promise<Asset | undefined> {
    const [updated] = await db.update(assets).set(data).where(eq(assets.id, id)).returning();
    return updated;
  }

  async deleteAsset(id: number): Promise<void> {
    await db.delete(assets).where(eq(assets.id, id));
  }

  async getAssetTransfers(): Promise<AssetTransfer[]> {
    return db.select().from(assetTransfers).orderBy(desc(assetTransfers.id));
  }

  async getAssetTransfer(id: number): Promise<AssetTransfer | undefined> {
    const [t] = await db.select().from(assetTransfers).where(eq(assetTransfers.id, id));
    return t;
  }

  async createAssetTransfer(data: InsertAssetTransfer): Promise<AssetTransfer> {
    const [t] = await db.insert(assetTransfers).values(data).returning();
    return t;
  }

  async updateAssetTransfer(id: number, data: Partial<InsertAssetTransfer>): Promise<AssetTransfer | undefined> {
    const [t] = await db.update(assetTransfers).set(data).where(eq(assetTransfers.id, id)).returning();
    return t;
  }

  async deleteAssetTransfer(id: number): Promise<void> {
    await db.delete(assetTransfers).where(eq(assetTransfers.id, id));
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems).orderBy(desc(inventoryItems.id));
  }

  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    const [i] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return i;
  }

  async createInventoryItem(i: InsertInventoryItem): Promise<InventoryItem> {
    const [created] = await db.insert(inventoryItems).values(i).returning();
    return created;
  }

  async updateInventoryItem(id: number, data: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const [updated] = await db.update(inventoryItems).set(data).where(eq(inventoryItems.id, id)).returning();
    return updated;
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
  }

  async getEmployees(): Promise<Employee[]> {
    return db.select().from(employees).orderBy(desc(employees.id));
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [e] = await db.select().from(employees).where(eq(employees.id, id));
    return e;
  }

  async createEmployee(e: InsertEmployee): Promise<Employee> {
    const [created] = await db.insert(employees).values(e).returning();
    return created;
  }

  async updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [updated] = await db.update(employees).set(data).where(eq(employees.id, id)).returning();
    return updated;
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  async getSalaryHistory(employeeId: number): Promise<SalaryHistory[]> {
    return db.select().from(salaryHistory).where(eq(salaryHistory.employeeId, employeeId)).orderBy(desc(salaryHistory.id));
  }

  async getSalaryHistoryEntry(id: number): Promise<SalaryHistory | undefined> {
    const [entry] = await db.select().from(salaryHistory).where(eq(salaryHistory.id, id));
    return entry;
  }

  async createSalaryHistoryEntry(data: InsertSalaryHistory): Promise<SalaryHistory> {
    const [entry] = await db.insert(salaryHistory).values(data).returning();
    return entry;
  }

  async updateSalaryHistoryEntry(id: number, data: Partial<InsertSalaryHistory>): Promise<SalaryHistory | undefined> {
    const [updated] = await db.update(salaryHistory).set(data).where(eq(salaryHistory.id, id)).returning();
    return updated;
  }

  async deleteSalaryHistoryEntry(id: number): Promise<void> {
    await db.delete(salaryHistory).where(eq(salaryHistory.id, id));
  }

  async getRoles(): Promise<Role[]> {
    return db.select().from(roles).orderBy(roles.name);
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [r] = await db.select().from(roles).where(eq(roles.id, id));
    return r;
  }

  async createRole(r: InsertRole): Promise<Role> {
    const [created] = await db.insert(roles).values(r).returning();
    return created;
  }

  async updateRole(id: number, data: Partial<InsertRole>): Promise<Role | undefined> {
    const [updated] = await db.update(roles).set(data).where(eq(roles.id, id)).returning();
    return updated;
  }

  async deleteRole(id: number): Promise<void> {
    await db.delete(roles).where(eq(roles.id, id));
  }

  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const [s] = await db.select().from(companySettings).limit(1);
    return s;
  }

  async upsertCompanySettings(s: InsertCompanySettings): Promise<CompanySettings> {
    const existing = await this.getCompanySettings();
    if (existing) {
      const [updated] = await db.update(companySettings).set(s).where(eq(companySettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(companySettings).values(s).returning();
    return created;
  }

  async getNotifications(): Promise<Notification[]> {
    return db.select().from(notifications).orderBy(desc(notifications.id));
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [n] = await db.select().from(notifications).where(eq(notifications.id, id));
    return n;
  }

  async createNotification(n: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(n).returning();
    return created;
  }

  async updateNotification(id: number, data: Partial<InsertNotification>): Promise<Notification | undefined> {
    const [updated] = await db.update(notifications).set(data).where(eq(notifications.id, id)).returning();
    return updated;
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async getReports(): Promise<Report[]> {
    return db.select().from(reports).orderBy(desc(reports.id));
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [r] = await db.select().from(reports).where(eq(reports.id, id));
    return r;
  }

  async createReport(r: InsertReport): Promise<Report> {
    const [created] = await db.insert(reports).values(r).returning();
    return created;
  }

  async updateReport(id: number, data: Partial<InsertReport>): Promise<Report | undefined> {
    const [updated] = await db.update(reports).set(data).where(eq(reports.id, id)).returning();
    return updated;
  }

  async deleteReport(id: number): Promise<void> {
    await db.delete(reports).where(eq(reports.id, id));
  }

  async getSettings(): Promise<Setting[]> {
    return db.select().from(settings).orderBy(settings.category, settings.key);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [s] = await db.select().from(settings).where(eq(settings.key, key));
    return s;
  }

  async upsertSetting(s: InsertSetting): Promise<Setting> {
    const existing = await this.getSetting(s.key);
    if (existing) {
      const [updated] = await db.update(settings).set(s).where(eq(settings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(settings).values(s).returning();
    return created;
  }

  async updateSetting(id: number, data: Partial<InsertSetting>): Promise<Setting> {
    const [updated] = await db.update(settings).set(data).where(eq(settings.id, id)).returning();
    return updated;
  }

  async deleteSetting(id: number): Promise<void> {
    await db.delete(settings).where(eq(settings.id, id));
  }

  async getCustomerConnections(customerId: number): Promise<CustomerConnection[]> {
    return db.select().from(customerConnections).where(eq(customerConnections.customerId, customerId));
  }

  async createCustomerConnection(c: InsertCustomerConnection): Promise<CustomerConnection> {
    const [created] = await db.insert(customerConnections).values(c).returning();
    return created;
  }

  async updateCustomerConnection(id: number, data: Partial<InsertCustomerConnection>): Promise<CustomerConnection | undefined> {
    const [updated] = await db.update(customerConnections).set(data).where(eq(customerConnections.id, id)).returning();
    return updated;
  }

  async deleteCustomerConnection(id: number): Promise<void> {
    await db.delete(customerConnections).where(eq(customerConnections.id, id));
  }

  async getDashboardStats() {
    const [customerStats] = await db
      .select({
        total: count(),
        active: sql<number>`count(*) filter (where ${customers.status} = 'active')`,
      })
      .from(customers);

    const [invoiceStats] = await db
      .select({
        totalRevenue: sql<string>`coalesce(sum(${invoices.totalAmount}::numeric), 0)::text`,
        pending: sql<number>`count(*) filter (where ${invoices.status} = 'pending')`,
        overdueAmount: sql<string>`coalesce(sum(case when ${invoices.status} = 'overdue' then ${invoices.totalAmount}::numeric else 0 end), 0)::text`,
        collectedAmount: sql<string>`coalesce(sum(case when ${invoices.status} = 'paid' then ${invoices.totalAmount}::numeric else 0 end), 0)::text`,
      })
      .from(invoices);

    const [ticketStats] = await db
      .select({
        open: sql<number>`count(*) filter (where ${tickets.status} in ('open', 'in_progress'))`,
      })
      .from(tickets);

    const [pkgStats] = await db.select({ total: count() }).from(packages);

    return {
      totalCustomers: customerStats.total,
      activeCustomers: Number(customerStats.active),
      totalRevenue: invoiceStats.totalRevenue,
      pendingInvoices: Number(invoiceStats.pending),
      openTickets: Number(ticketStats.open),
      totalPackages: pkgStats.total,
      overdueAmount: invoiceStats.overdueAmount,
      collectedAmount: invoiceStats.collectedAmount,
    };
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [created] = await db.insert(activityLogs).values(log).returning();
    return created;
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    return db.select().from(activityLogs).orderBy(desc(activityLogs.id));
  }

  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    return db.select().from(notificationTemplates).orderBy(desc(notificationTemplates.id));
  }

  async getNotificationTemplate(id: number): Promise<NotificationTemplate | undefined> {
    const [t] = await db.select().from(notificationTemplates).where(eq(notificationTemplates.id, id));
    return t;
  }

  async createNotificationTemplate(t: InsertNotificationTemplate): Promise<NotificationTemplate> {
    const [created] = await db.insert(notificationTemplates).values(t).returning();
    return created;
  }

  async updateNotificationTemplate(id: number, data: Partial<InsertNotificationTemplate>): Promise<NotificationTemplate | undefined> {
    const [updated] = await db.update(notificationTemplates).set(data).where(eq(notificationTemplates.id, id)).returning();
    return updated;
  }

  async deleteNotificationTemplate(id: number): Promise<void> {
    await db.delete(notificationTemplates).where(eq(notificationTemplates.id, id));
  }

  async getSmtpSettings(): Promise<SmtpSettings | undefined> {
    const [s] = await db.select().from(smtpSettings).limit(1);
    return s;
  }

  async upsertSmtpSettings(s: InsertSmtpSettings): Promise<SmtpSettings> {
    const existing = await this.getSmtpSettings();
    if (existing) {
      const [updated] = await db.update(smtpSettings).set(s).where(eq(smtpSettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(smtpSettings).values(s).returning();
    return created;
  }

  async getSmsSettings(): Promise<SmsSettings | undefined> {
    const [s] = await db.select().from(smsSettings).limit(1);
    return s;
  }

  async upsertSmsSettings(s: InsertSmsSettings): Promise<SmsSettings> {
    const existing = await this.getSmsSettings();
    if (existing) {
      const [updated] = await db.update(smsSettings).set(s).where(eq(smsSettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(smsSettings).values(s).returning();
    return created;
  }

  async getNotificationDispatches(): Promise<NotificationDispatch[]> {
    return db.select().from(notificationDispatches).orderBy(desc(notificationDispatches.id));
  }

  async createNotificationDispatch(d: InsertNotificationDispatch): Promise<NotificationDispatch> {
    const [created] = await db.insert(notificationDispatches).values(d).returning();
    return created;
  }

  async getBranches(): Promise<Branch[]> {
    return db.select().from(branches).orderBy(desc(branches.id));
  }

  async getBranch(id: number): Promise<Branch | undefined> {
    const [b] = await db.select().from(branches).where(eq(branches.id, id));
    return b;
  }

  async createBranch(b: InsertBranch): Promise<Branch> {
    const [created] = await db.insert(branches).values(b).returning();
    return created;
  }

  async updateBranch(id: number, data: Partial<InsertBranch>): Promise<Branch | undefined> {
    const [updated] = await db.update(branches).set(data).where(eq(branches.id, id)).returning();
    return updated;
  }

  async deleteBranch(id: number): Promise<void> {
    await db.delete(branches).where(eq(branches.id, id));
  }

  async getCustomerQueries(): Promise<CustomerQuery[]> {
    return db.select().from(customerQueries).orderBy(desc(customerQueries.id));
  }

  async getCustomerQuery(id: number): Promise<CustomerQuery | undefined> {
    const [q] = await db.select().from(customerQueries).where(eq(customerQueries.id, id));
    return q;
  }

  async createCustomerQuery(q: InsertCustomerQuery): Promise<CustomerQuery> {
    const [created] = await db.insert(customerQueries).values(q).returning();
    return created;
  }

  async updateCustomerQuery(id: number, data: Partial<InsertCustomerQuery>): Promise<CustomerQuery | undefined> {
    const [updated] = await db.update(customerQueries).set(data).where(eq(customerQueries.id, id)).returning();
    return updated;
  }

  async deleteCustomerQuery(id: number): Promise<void> {
    await db.delete(customerQueries).where(eq(customerQueries.id, id));
  }

  async createCustomerQueryLog(log: InsertCustomerQueryLog): Promise<CustomerQueryLog> {
    const [created] = await db.insert(customerQueryLogs).values(log).returning();
    return created;
  }

  async getCustomerQueryLogs(queryId: number): Promise<CustomerQueryLog[]> {
    return db.select().from(customerQueryLogs)
      .where(eq(customerQueryLogs.queryId, queryId))
      .orderBy(desc(customerQueryLogs.id));
  }

  async getSupportCategories(): Promise<SupportCategory[]> {
    return db.select().from(supportCategories).orderBy(desc(supportCategories.id));
  }

  async getSupportCategory(id: number): Promise<SupportCategory | undefined> {
    const [cat] = await db.select().from(supportCategories).where(eq(supportCategories.id, id));
    return cat;
  }

  async createSupportCategory(c: InsertSupportCategory): Promise<SupportCategory> {
    const [cat] = await db.insert(supportCategories).values(c).returning();
    return cat;
  }

  async updateSupportCategory(id: number, data: Partial<InsertSupportCategory>): Promise<SupportCategory | undefined> {
    const [updated] = await db.update(supportCategories).set(data).where(eq(supportCategories.id, id)).returning();
    return updated;
  }

  async deleteSupportCategory(id: number): Promise<void> {
    await db.delete(supportCategories).where(eq(supportCategories.id, id));
  }

  async getExpenses(): Promise<Expense[]> {
    return db.select().from(expenses).orderBy(desc(expenses.id));
  }
  async getExpense(id: number): Promise<Expense | undefined> {
    const [e] = await db.select().from(expenses).where(eq(expenses.id, id));
    return e;
  }
  async createExpense(e: InsertExpense): Promise<Expense> {
    const [created] = await db.insert(expenses).values(e).returning();
    return created;
  }
  async updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updated] = await db.update(expenses).set(data).where(eq(expenses.id, id)).returning();
    return updated;
  }
  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async getLeaves(employeeId?: number): Promise<(Leave & { employeeName?: string; employeeCode?: string })[]> {
    const result = await db
      .select({
        id: leaves.id,
        employeeId: leaves.employeeId,
        leaveType: leaves.leaveType,
        dateFrom: leaves.dateFrom,
        dateTo: leaves.dateTo,
        numberOfDays: leaves.numberOfDays,
        remarks: leaves.remarks,
        reason: leaves.reason,
        status: leaves.status,
        approvedBy: leaves.approvedBy,
        approvedAt: leaves.approvedAt,
        createdAt: leaves.createdAt,
        employeeName: employees.fullName,
        employeeCode: employees.empCode,
      })
      .from(leaves)
      .leftJoin(employees, eq(leaves.employeeId, employees.id))
      .orderBy(desc(leaves.id));
    if (employeeId) return result.filter(r => r.employeeId === employeeId);
    return result;
  }

  async getLeave(id: number): Promise<Leave | undefined> {
    const [result] = await db.select().from(leaves).where(eq(leaves.id, id));
    return result;
  }

  async createLeave(l: InsertLeave): Promise<Leave> {
    const [result] = await db.insert(leaves).values(l).returning();
    return result;
  }

  async updateLeave(id: number, l: Partial<InsertLeave>): Promise<Leave | undefined> {
    const [result] = await db.update(leaves).set(l).where(eq(leaves.id, id)).returning();
    return result;
  }

  async deleteLeave(id: number): Promise<void> {
    await db.delete(leaves).where(eq(leaves.id, id));
  }

  async getHolidays(): Promise<Holiday[]> {
    return db.select().from(holidays).orderBy(desc(holidays.id));
  }

  async createHoliday(h: InsertHoliday): Promise<Holiday> {
    const [result] = await db.insert(holidays).values(h).returning();
    return result;
  }

  async updateHoliday(id: number, h: Partial<InsertHoliday>): Promise<Holiday | undefined> {
    const [result] = await db.update(holidays).set(h).where(eq(holidays.id, id)).returning();
    return result;
  }

  async deleteHoliday(id: number): Promise<void> {
    await db.delete(holidays).where(eq(holidays.id, id));
  }

  async getAttendanceRecords(employeeId?: number): Promise<(Attendance & { employeeName?: string; employeeCode?: string; employeeShift?: string })[]> {
    const result = await db
      .select({
        id: attendance.id,
        employeeId: attendance.employeeId,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        status: attendance.status,
        hoursWorked: attendance.hoursWorked,
        overtime: attendance.overtime,
        notes: attendance.notes,
        location: attendance.location,
        checkinLocation: attendance.checkinLocation,
        checkoutLocation: attendance.checkoutLocation,
        checkinDevice: attendance.checkinDevice,
        checkoutDevice: attendance.checkoutDevice,
        shift: attendance.shift,
        breakMinutes: attendance.breakMinutes,
        lateMinutes: attendance.lateMinutes,
        earlyLeaveMinutes: attendance.earlyLeaveMinutes,
        employeeName: employees.fullName,
        employeeCode: employees.empCode,
        employeeShift: employees.shift,
      })
      .from(attendance)
      .leftJoin(employees, eq(attendance.employeeId, employees.id))
      .orderBy(desc(attendance.id));
    if (employeeId) {
      return result.filter(r => r.employeeId === employeeId).map(r => ({
        ...r,
        employeeName: r.employeeName || undefined,
        employeeCode: r.employeeCode || undefined,
        employeeShift: r.employeeShift || undefined,
      }));
    }
    return result.map(r => ({
      ...r,
      employeeName: r.employeeName || undefined,
      employeeCode: r.employeeCode || undefined,
      employeeShift: r.employeeShift || undefined,
    }));
  }
  async createAttendance(a: InsertAttendance): Promise<Attendance> {
    const [created] = await db.insert(attendance).values(a).returning();
    return created;
  }
  async updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const [updated] = await db.update(attendance).set(data).where(eq(attendance.id, id)).returning();
    return updated;
  }
  async deleteAttendance(id: number): Promise<void> {
    await db.delete(attendanceBreaks).where(eq(attendanceBreaks.attendanceId, id));
    await db.delete(attendance).where(eq(attendance.id, id));
  }
  async getAttendanceBreaks(attendanceId: number): Promise<AttendanceBreak[]> {
    return db.select().from(attendanceBreaks).where(eq(attendanceBreaks.attendanceId, attendanceId)).orderBy(attendanceBreaks.id);
  }
  async createAttendanceBreak(b: InsertAttendanceBreak): Promise<AttendanceBreak> {
    const [created] = await db.insert(attendanceBreaks).values(b).returning();
    return created;
  }
  async updateAttendanceBreak(id: number, b: Partial<InsertAttendanceBreak>): Promise<AttendanceBreak | undefined> {
    const [updated] = await db.update(attendanceBreaks).set(b).where(eq(attendanceBreaks.id, id)).returning();
    return updated;
  }
  async deleteAttendanceBreak(id: number): Promise<void> {
    await db.delete(attendanceBreaks).where(eq(attendanceBreaks.id, id));
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.id)).limit(500);
  }
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async getCreditNotes(): Promise<(CreditNote & { customerName?: string })[]> {
    const result = await db
      .select({
        id: creditNotes.id,
        creditNoteNumber: creditNotes.creditNoteNumber,
        customerId: creditNotes.customerId,
        invoiceId: creditNotes.invoiceId,
        amount: creditNotes.amount,
        reason: creditNotes.reason,
        status: creditNotes.status,
        issueDate: creditNotes.issueDate,
        appliedDate: creditNotes.appliedDate,
        notes: creditNotes.notes,
        createdBy: creditNotes.createdBy,
        customerName: customers.fullName,
      })
      .from(creditNotes)
      .leftJoin(customers, eq(creditNotes.customerId, customers.id))
      .orderBy(desc(creditNotes.id));
    return result.map(r => ({ ...r, customerName: r.customerName || undefined }));
  }
  async getCreditNote(id: number): Promise<CreditNote | undefined> {
    const [cn] = await db.select().from(creditNotes).where(eq(creditNotes.id, id));
    return cn;
  }
  async createCreditNote(cn: InsertCreditNote): Promise<CreditNote> {
    const [created] = await db.insert(creditNotes).values(cn).returning();
    return created;
  }
  async updateCreditNote(id: number, data: Partial<InsertCreditNote>): Promise<CreditNote | undefined> {
    const [updated] = await db.update(creditNotes).set(data).where(eq(creditNotes.id, id)).returning();
    return updated;
  }
  async deleteCreditNote(id: number): Promise<void> {
    await db.delete(creditNotes).where(eq(creditNotes.id, id));
  }

  async getBulkMessages(): Promise<BulkMessage[]> {
    return db.select().from(bulkMessages).orderBy(desc(bulkMessages.id));
  }
  async getBulkMessage(id: number): Promise<BulkMessage | undefined> {
    const [m] = await db.select().from(bulkMessages).where(eq(bulkMessages.id, id));
    return m;
  }
  async createBulkMessage(m: InsertBulkMessage): Promise<BulkMessage> {
    const [created] = await db.insert(bulkMessages).values(m).returning();
    return created;
  }
  async updateBulkMessage(id: number, data: Partial<InsertBulkMessage>): Promise<BulkMessage | undefined> {
    const [updated] = await db.update(bulkMessages).set(data).where(eq(bulkMessages.id, id)).returning();
    return updated;
  }
  async deleteBulkMessage(id: number): Promise<void> {
    await db.delete(bulkMessages).where(eq(bulkMessages.id, id));
  }

  async getIpAddresses(): Promise<(IpAddress & { customerName?: string })[]> {
    const result = await db
      .select({
        id: ipAddresses.id,
        ipAddress: ipAddresses.ipAddress,
        subnet: ipAddresses.subnet,
        gateway: ipAddresses.gateway,
        type: ipAddresses.type,
        status: ipAddresses.status,
        customerId: ipAddresses.customerId,
        customerType: ipAddresses.customerType,
        assignedDate: ipAddresses.assignedDate,
        vlan: ipAddresses.vlan,
        pool: ipAddresses.pool,
        notes: ipAddresses.notes,
        macAddress: ipAddresses.macAddress,
        serviceType: ipAddresses.serviceType,
        linkedDevice: ipAddresses.linkedDevice,
        subnetId: ipAddresses.subnetId,
        vlanId: ipAddresses.vlanId,
        vendorId: ipAddresses.vendorId,
        vendorName: ipAddresses.vendorName,
        customerName: customers.fullName,
      })
      .from(ipAddresses)
      .leftJoin(customers, eq(ipAddresses.customerId, customers.id))
      .orderBy(ipAddresses.ipAddress);
    return result.map(r => ({ ...r, customerName: r.customerName || undefined }));
  }
  async getIpAddress(id: number): Promise<IpAddress | undefined> {
    const [ip] = await db.select().from(ipAddresses).where(eq(ipAddresses.id, id));
    return ip;
  }
  async createIpAddress(ip: InsertIpAddress): Promise<IpAddress> {
    const [created] = await db.insert(ipAddresses).values(ip).returning();
    return created;
  }
  async updateIpAddress(id: number, data: Partial<InsertIpAddress>): Promise<IpAddress | undefined> {
    const [updated] = await db.update(ipAddresses).set(data).where(eq(ipAddresses.id, id)).returning();
    return updated;
  }
  async deleteIpAddress(id: number): Promise<void> {
    await db.delete(ipAddresses).where(eq(ipAddresses.id, id));
  }

  async getSubnets(): Promise<Subnet[]> {
    return db.select().from(subnets).orderBy(subnets.networkAddress);
  }
  async getSubnet(id: number): Promise<Subnet | undefined> {
    const [s] = await db.select().from(subnets).where(eq(subnets.id, id));
    return s;
  }
  async createSubnet(s: InsertSubnet): Promise<Subnet> {
    const [created] = await db.insert(subnets).values(s).returning();
    return created;
  }
  async updateSubnet(id: number, data: Partial<InsertSubnet>): Promise<Subnet | undefined> {
    const [updated] = await db.update(subnets).set(data).where(eq(subnets.id, id)).returning();
    return updated;
  }
  async deleteSubnet(id: number): Promise<void> {
    await db.delete(subnets).where(eq(subnets.id, id));
  }

  async getVlans(): Promise<Vlan[]> {
    return db.select().from(vlans).orderBy(vlans.vlanIdNumber);
  }
  async getVlan(id: number): Promise<Vlan | undefined> {
    const [v] = await db.select().from(vlans).where(eq(vlans.id, id));
    return v;
  }
  async createVlan(v: InsertVlan): Promise<Vlan> {
    const [created] = await db.insert(vlans).values(v).returning();
    return created;
  }
  async updateVlan(id: number, data: Partial<InsertVlan>): Promise<Vlan | undefined> {
    const [updated] = await db.update(vlans).set(data).where(eq(vlans.id, id)).returning();
    return updated;
  }
  async deleteVlan(id: number): Promise<void> {
    await db.delete(vlans).where(eq(vlans.id, id));
  }

  async getIpamLogs(): Promise<IpamLog[]> {
    return db.select().from(ipamLogs).orderBy(desc(ipamLogs.id));
  }
  async createIpamLog(l: InsertIpamLog): Promise<IpamLog> {
    const [created] = await db.insert(ipamLogs).values(l).returning();
    return created;
  }

  async getOutages(): Promise<Outage[]> {
    return db.select().from(outages).orderBy(desc(outages.id));
  }
  async getOutage(id: number): Promise<Outage | undefined> {
    const [o] = await db.select().from(outages).where(eq(outages.id, id));
    return o;
  }
  async createOutage(o: InsertOutage): Promise<Outage> {
    const [created] = await db.insert(outages).values(o).returning();
    return created;
  }
  async updateOutage(id: number, data: Partial<InsertOutage>): Promise<Outage | undefined> {
    const [updated] = await db.update(outages).set(data).where(eq(outages.id, id)).returning();
    return updated;
  }
  async deleteOutage(id: number): Promise<void> {
    await db.delete(outages).where(eq(outages.id, id));
  }

  async getOutageTimelines(outageId: number): Promise<OutageTimeline[]> {
    return db.select().from(outageTimeline).where(eq(outageTimeline.outageId, outageId)).orderBy(desc(outageTimeline.id));
  }
  async getAllOutageTimelines(): Promise<OutageTimeline[]> {
    return db.select().from(outageTimeline).orderBy(desc(outageTimeline.id));
  }
  async createOutageTimeline(t: InsertOutageTimeline): Promise<OutageTimeline> {
    const [created] = await db.insert(outageTimeline).values(t).returning();
    return created;
  }
  async deleteOutageTimeline(id: number): Promise<void> {
    await db.delete(outageTimeline).where(eq(outageTimeline.id, id));
  }

  async getNetworkDevices(): Promise<NetworkDevice[]> {
    return db.select().from(networkDevices).orderBy(desc(networkDevices.id));
  }
  async getNetworkDevice(id: number): Promise<NetworkDevice | undefined> {
    const [d] = await db.select().from(networkDevices).where(eq(networkDevices.id, id));
    return d;
  }
  async createNetworkDevice(d: InsertNetworkDevice): Promise<NetworkDevice> {
    const [created] = await db.insert(networkDevices).values(d).returning();
    return created;
  }
  async updateNetworkDevice(id: number, data: Partial<InsertNetworkDevice>): Promise<NetworkDevice | undefined> {
    const [updated] = await db.update(networkDevices).set(data).where(eq(networkDevices.id, id)).returning();
    return updated;
  }
  async deleteNetworkDevice(id: number): Promise<void> {
    await db.delete(networkDevices).where(eq(networkDevices.id, id));
  }

  async getPppoeUsers(): Promise<(PppoeUser & { customerName?: string })[]> {
    const result = await db
      .select({
        id: pppoeUsers.id,
        username: pppoeUsers.username,
        password: pppoeUsers.password,
        customerId: pppoeUsers.customerId,
        profileName: pppoeUsers.profileName,
        serviceType: pppoeUsers.serviceType,
        status: pppoeUsers.status,
        ipAddress: pppoeUsers.ipAddress,
        macAddress: pppoeUsers.macAddress,
        uploadSpeed: pppoeUsers.uploadSpeed,
        downloadSpeed: pppoeUsers.downloadSpeed,
        dataLimit: pppoeUsers.dataLimit,
        bytesIn: pppoeUsers.bytesIn,
        bytesOut: pppoeUsers.bytesOut,
        lastOnline: pppoeUsers.lastOnline,
        nasDevice: pppoeUsers.nasDevice,
        callerStationId: pppoeUsers.callerStationId,
        sessionTimeout: pppoeUsers.sessionTimeout,
        idleTimeout: pppoeUsers.idleTimeout,
        createdAt: pppoeUsers.createdAt,
        customerName: customers.fullName,
      })
      .from(pppoeUsers)
      .leftJoin(customers, eq(pppoeUsers.customerId, customers.id))
      .orderBy(desc(pppoeUsers.id));
    return result.map(r => ({ ...r, customerName: r.customerName || undefined }));
  }
  async getPppoeUser(id: number): Promise<PppoeUser | undefined> {
    const [u] = await db.select().from(pppoeUsers).where(eq(pppoeUsers.id, id));
    return u;
  }
  async createPppoeUser(u: InsertPppoeUser): Promise<PppoeUser> {
    const [created] = await db.insert(pppoeUsers).values(u).returning();
    return created;
  }
  async updatePppoeUser(id: number, data: Partial<InsertPppoeUser>): Promise<PppoeUser | undefined> {
    const [updated] = await db.update(pppoeUsers).set(data).where(eq(pppoeUsers.id, id)).returning();
    return updated;
  }
  async deletePppoeUser(id: number): Promise<void> {
    await db.delete(pppoeUsers).where(eq(pppoeUsers.id, id));
  }

  async getRadiusProfiles(): Promise<RadiusProfile[]> {
    return db.select().from(radiusProfiles).orderBy(desc(radiusProfiles.id));
  }
  async getRadiusProfile(id: number): Promise<RadiusProfile | undefined> {
    const [p] = await db.select().from(radiusProfiles).where(eq(radiusProfiles.id, id));
    return p;
  }
  async createRadiusProfile(p: InsertRadiusProfile): Promise<RadiusProfile> {
    const [created] = await db.insert(radiusProfiles).values(p).returning();
    return created;
  }
  async updateRadiusProfile(id: number, data: Partial<InsertRadiusProfile>): Promise<RadiusProfile | undefined> {
    const [updated] = await db.update(radiusProfiles).set(data).where(eq(radiusProfiles.id, id)).returning();
    return updated;
  }
  async deleteRadiusProfile(id: number): Promise<void> {
    await db.delete(radiusProfiles).where(eq(radiusProfiles.id, id));
  }

  async getRadiusNasDevices(): Promise<RadiusNasDevice[]> {
    return db.select().from(radiusNasDevices).orderBy(desc(radiusNasDevices.id));
  }
  async getRadiusNasDevice(id: number): Promise<RadiusNasDevice | undefined> {
    const [d] = await db.select().from(radiusNasDevices).where(eq(radiusNasDevices.id, id));
    return d;
  }
  async createRadiusNasDevice(d: InsertRadiusNasDevice): Promise<RadiusNasDevice> {
    const [created] = await db.insert(radiusNasDevices).values(d).returning();
    return created;
  }
  async updateRadiusNasDevice(id: number, data: Partial<InsertRadiusNasDevice>): Promise<RadiusNasDevice | undefined> {
    const [updated] = await db.update(radiusNasDevices).set(data).where(eq(radiusNasDevices.id, id)).returning();
    return updated;
  }
  async deleteRadiusNasDevice(id: number): Promise<void> {
    await db.delete(radiusNasDevices).where(eq(radiusNasDevices.id, id));
  }

  async getRadiusAuthLogs(): Promise<RadiusAuthLog[]> {
    return db.select().from(radiusAuthLogs).orderBy(desc(radiusAuthLogs.id));
  }
  async getRadiusAuthLog(id: number): Promise<RadiusAuthLog | undefined> {
    const [l] = await db.select().from(radiusAuthLogs).where(eq(radiusAuthLogs.id, id));
    return l;
  }
  async createRadiusAuthLog(l: InsertRadiusAuthLog): Promise<RadiusAuthLog> {
    const [created] = await db.insert(radiusAuthLogs).values(l).returning();
    return created;
  }
  async updateRadiusAuthLog(id: number, data: Partial<InsertRadiusAuthLog>): Promise<RadiusAuthLog | undefined> {
    const [updated] = await db.update(radiusAuthLogs).set(data).where(eq(radiusAuthLogs.id, id)).returning();
    return updated;
  }
  async deleteRadiusAuthLog(id: number): Promise<void> {
    await db.delete(radiusAuthLogs).where(eq(radiusAuthLogs.id, id));
  }

  async getPaymentGateways(): Promise<PaymentGateway[]> {
    return db.select().from(paymentGateways).orderBy(desc(paymentGateways.id));
  }
  async getPaymentGateway(id: number): Promise<PaymentGateway | undefined> {
    const [g] = await db.select().from(paymentGateways).where(eq(paymentGateways.id, id));
    return g;
  }
  async createPaymentGateway(g: InsertPaymentGateway): Promise<PaymentGateway> {
    const [created] = await db.insert(paymentGateways).values(g).returning();
    return created;
  }
  async updatePaymentGateway(id: number, data: Partial<InsertPaymentGateway>): Promise<PaymentGateway | undefined> {
    const [updated] = await db.update(paymentGateways).set(data).where(eq(paymentGateways.id, id)).returning();
    return updated;
  }
  async deletePaymentGateway(id: number): Promise<void> {
    await db.delete(paymentGateways).where(eq(paymentGateways.id, id));
  }

  async getPayments(): Promise<(Payment & { customerName?: string })[]> {
    const result = await db
      .select({
        id: payments.id,
        paymentId: payments.paymentId,
        customerId: payments.customerId,
        invoiceId: payments.invoiceId,
        amount: payments.amount,
        method: payments.method,
        gateway: payments.gateway,
        transactionRef: payments.transactionRef,
        status: payments.status,
        paidAt: payments.paidAt,
        receivedBy: payments.receivedBy,
        notes: payments.notes,
        customerName: customers.fullName,
      })
      .from(payments)
      .leftJoin(customers, eq(payments.customerId, customers.id))
      .orderBy(desc(payments.id));
    return result.map(r => ({ ...r, customerName: r.customerName || undefined }));
  }
  async getPayment(id: number): Promise<Payment | undefined> {
    const [p] = await db.select().from(payments).where(eq(payments.id, id));
    return p;
  }
  async createPayment(p: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(p).returning();
    return created;
  }
  async updatePayment(id: number, data: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [updated] = await db.update(payments).set(data).where(eq(payments.id, id)).returning();
    return updated;
  }
  async deletePayment(id: number): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  async getBillingRules(): Promise<BillingRule[]> {
    return db.select().from(billingRules).orderBy(desc(billingRules.id));
  }
  async getBillingRule(id: number): Promise<BillingRule | undefined> {
    const [r] = await db.select().from(billingRules).where(eq(billingRules.id, id));
    return r;
  }
  async createBillingRule(r: InsertBillingRule): Promise<BillingRule> {
    const [created] = await db.insert(billingRules).values(r).returning();
    return created;
  }
  async updateBillingRule(id: number, data: Partial<InsertBillingRule>): Promise<BillingRule | undefined> {
    const [updated] = await db.update(billingRules).set(data).where(eq(billingRules.id, id)).returning();
    return updated;
  }
  async deleteBillingRule(id: number): Promise<void> {
    await db.delete(billingRules).where(eq(billingRules.id, id));
  }

  async getBandwidthUsage(): Promise<(BandwidthUsage & { customerName?: string })[]> {
    const result = await db
      .select({
        id: bandwidthUsage.id,
        customerId: bandwidthUsage.customerId,
        pppoeUserId: bandwidthUsage.pppoeUserId,
        date: bandwidthUsage.date,
        downloadMb: bandwidthUsage.downloadMb,
        uploadMb: bandwidthUsage.uploadMb,
        totalMb: bandwidthUsage.totalMb,
        peakDownload: bandwidthUsage.peakDownload,
        peakUpload: bandwidthUsage.peakUpload,
        sessionCount: bandwidthUsage.sessionCount,
        avgLatency: bandwidthUsage.avgLatency,
        customerName: customers.fullName,
      })
      .from(bandwidthUsage)
      .leftJoin(customers, eq(bandwidthUsage.customerId, customers.id))
      .orderBy(desc(bandwidthUsage.id));
    return result.map(r => ({ ...r, customerName: r.customerName || undefined }));
  }
  async getBandwidthUsageById(id: number): Promise<BandwidthUsage | undefined> {
    const [u] = await db.select().from(bandwidthUsage).where(eq(bandwidthUsage.id, id));
    return u;
  }
  async getBandwidthUsageByCustomer(customerId: number): Promise<BandwidthUsage[]> {
    return db.select().from(bandwidthUsage).where(eq(bandwidthUsage.customerId, customerId)).orderBy(desc(bandwidthUsage.id));
  }
  async createBandwidthUsage(u: InsertBandwidthUsage): Promise<BandwidthUsage> {
    const [created] = await db.insert(bandwidthUsage).values(u).returning();
    return created;
  }
  async updateBandwidthUsage(id: number, data: Partial<InsertBandwidthUsage>): Promise<BandwidthUsage | undefined> {
    const [updated] = await db.update(bandwidthUsage).set(data).where(eq(bandwidthUsage.id, id)).returning();
    return updated;
  }
  async deleteBandwidthUsage(id: number): Promise<void> {
    await db.delete(bandwidthUsage).where(eq(bandwidthUsage.id, id));
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.id));
  }
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }
  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getDailyCollections(): Promise<(DailyCollection & { customerName?: string; customerCode?: string; customerPhone?: string; customerUsername?: string; monthlyBill?: string })[]> {
    const result = await db
      .select({
        id: dailyCollections.id,
        date: dailyCollections.date,
        customerId: dailyCollections.customerId,
        invoiceId: dailyCollections.invoiceId,
        amount: dailyCollections.amount,
        received: dailyCollections.received,
        vat: dailyCollections.vat,
        discount: dailyCollections.discount,
        balanceDue: dailyCollections.balanceDue,
        paymentMethod: dailyCollections.paymentMethod,
        receivedBy: dailyCollections.receivedBy,
        approvedBy: dailyCollections.approvedBy,
        createdBy: dailyCollections.createdBy,
        notes: dailyCollections.notes,
        status: dailyCollections.status,
        connectionType: dailyCollections.connectionType,
        area: dailyCollections.area,
        transactionType: dailyCollections.transactionType,
        customerName: customers.fullName,
        customerCode: customers.customerId,
        customerPhone: customers.phone,
        customerUsername: customers.usernameIp,
        monthlyBill: customers.monthlyBill,
      })
      .from(dailyCollections)
      .leftJoin(customers, eq(dailyCollections.customerId, customers.id))
      .orderBy(desc(dailyCollections.id));
    return result.map(r => ({
      ...r,
      customerName: r.customerName || undefined,
      customerCode: r.customerCode || undefined,
      customerPhone: r.customerPhone || undefined,
      customerUsername: r.customerUsername || undefined,
      monthlyBill: r.monthlyBill || undefined,
    }));
  }

  async getDailyCollection(id: number): Promise<DailyCollection | undefined> {
    const [item] = await db.select().from(dailyCollections).where(eq(dailyCollections.id, id));
    return item;
  }

  async createDailyCollection(d: InsertDailyCollection): Promise<DailyCollection> {
    const [created] = await db.insert(dailyCollections).values(d).returning();
    return created;
  }

  async updateDailyCollection(id: number, d: Partial<InsertDailyCollection>): Promise<DailyCollection | undefined> {
    const [updated] = await db.update(dailyCollections).set(d).where(eq(dailyCollections.id, id)).returning();
    return updated;
  }

  async deleteDailyCollection(id: number): Promise<void> {
    await db.delete(dailyCollections).where(eq(dailyCollections.id, id));
  }

  async getAdvanceLoans(): Promise<(AdvanceLoan & { employeeName?: string; empCode?: string; department?: string; designation?: string; salary?: string })[]> {
    const result = await db
      .select({
        id: advanceLoans.id,
        employeeId: advanceLoans.employeeId,
        type: advanceLoans.type,
        amount: advanceLoans.amount,
        paidAmount: advanceLoans.paidAmount,
        reason: advanceLoans.reason,
        issueDate: advanceLoans.issueDate,
        repaymentType: advanceLoans.repaymentType,
        installments: advanceLoans.installments,
        installmentAmount: advanceLoans.installmentAmount,
        installmentStartMonth: advanceLoans.installmentStartMonth,
        interestRate: advanceLoans.interestRate,
        requestedBy: advanceLoans.requestedBy,
        approvedBy: advanceLoans.approvedBy,
        approvalStatus: advanceLoans.approvalStatus,
        status: advanceLoans.status,
        notes: advanceLoans.notes,
        createdAt: advanceLoans.createdAt,
        employeeName: employees.fullName,
        empCode: employees.empCode,
        department: employees.department,
        designation: employees.designation,
        salary: employees.salary,
      })
      .from(advanceLoans)
      .leftJoin(employees, eq(advanceLoans.employeeId, employees.id))
      .orderBy(desc(advanceLoans.id));
    return result.map(r => ({
      ...r,
      employeeName: r.employeeName || undefined,
      empCode: r.empCode || undefined,
      department: r.department || undefined,
      designation: r.designation || undefined,
      salary: r.salary || undefined,
    }));
  }

  async getAdvanceLoan(id: number): Promise<AdvanceLoan | undefined> {
    const [item] = await db.select().from(advanceLoans).where(eq(advanceLoans.id, id));
    return item;
  }

  async createAdvanceLoan(data: InsertAdvanceLoan): Promise<AdvanceLoan> {
    const [created] = await db.insert(advanceLoans).values(data).returning();
    return created;
  }

  async updateAdvanceLoan(id: number, data: Partial<InsertAdvanceLoan>): Promise<AdvanceLoan | undefined> {
    const [updated] = await db.update(advanceLoans).set(data).where(eq(advanceLoans.id, id)).returning();
    return updated;
  }

  async deleteAdvanceLoan(id: number): Promise<void> {
    await db.delete(loanInstallments).where(eq(loanInstallments.loanId, id));
    await db.delete(advanceLoans).where(eq(advanceLoans.id, id));
  }

  async getLoanInstallments(loanId: number): Promise<LoanInstallment[]> {
    return db.select().from(loanInstallments).where(eq(loanInstallments.loanId, loanId)).orderBy(loanInstallments.installmentNo);
  }

  async getLoanInstallment(id: number): Promise<LoanInstallment | undefined> {
    const [item] = await db.select().from(loanInstallments).where(eq(loanInstallments.id, id));
    return item;
  }

  async createLoanInstallment(data: InsertLoanInstallment): Promise<LoanInstallment> {
    const [created] = await db.insert(loanInstallments).values(data).returning();
    return created;
  }

  async updateLoanInstallment(id: number, data: Partial<InsertLoanInstallment>): Promise<LoanInstallment | undefined> {
    const [updated] = await db.update(loanInstallments).set(data).where(eq(loanInstallments.id, id)).returning();
    return updated;
  }

  async deleteLoanInstallment(id: number): Promise<void> {
    await db.delete(loanInstallments).where(eq(loanInstallments.id, id));
  }

  async deleteLoanInstallmentsByLoanId(loanId: number): Promise<void> {
    await db.delete(loanInstallments).where(eq(loanInstallments.loanId, loanId));
  }

  async getPayrolls(month?: string): Promise<(Payroll & { employeeName?: string; empCode?: string; department?: string; designation?: string })[]> {
    const conditions = month ? [eq(payroll.payrollMonth, month)] : [];
    const result = await db
      .select({
        id: payroll.id,
        employeeId: payroll.employeeId,
        payrollMonth: payroll.payrollMonth,
        baseSalary: payroll.baseSalary,
        attendanceDeduction: payroll.attendanceDeduction,
        overtime: payroll.overtime,
        bonus: payroll.bonus,
        commission: payroll.commission,
        loanDeduction: payroll.loanDeduction,
        tax: payroll.tax,
        otherDeductions: payroll.otherDeductions,
        netSalary: payroll.netSalary,
        status: payroll.status,
        paymentMethod: payroll.paymentMethod,
        paymentRef: payroll.paymentRef,
        paidDate: payroll.paidDate,
        approvedBy: payroll.approvedBy,
        remarks: payroll.remarks,
        createdAt: payroll.createdAt,
        employeeName: employees.fullName,
        empCode: employees.empCode,
        department: employees.department,
        designation: employees.designation,
      })
      .from(payroll)
      .leftJoin(employees, eq(payroll.employeeId, employees.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(payroll.id));
    return result.map(r => ({
      ...r,
      employeeName: r.employeeName || undefined,
      empCode: r.empCode || undefined,
      department: r.department || undefined,
      designation: r.designation || undefined,
    }));
  }

  async getPayroll(id: number): Promise<Payroll | undefined> {
    const [item] = await db.select().from(payroll).where(eq(payroll.id, id));
    return item;
  }

  async createPayroll(data: InsertPayroll): Promise<Payroll> {
    const [created] = await db.insert(payroll).values(data).returning();
    return created;
  }

  async updatePayroll(id: number, data: Partial<InsertPayroll>): Promise<Payroll | undefined> {
    const [updated] = await db.update(payroll).set(data).where(eq(payroll.id, id)).returning();
    return updated;
  }

  async deletePayroll(id: number): Promise<void> {
    await db.delete(payroll).where(eq(payroll.id, id));
  }

  async deletePayrollsByMonth(month: string): Promise<void> {
    await db.delete(payroll).where(eq(payroll.payrollMonth, month));
  }

  async getSalaryPayments(payrollId: number): Promise<SalaryPayment[]> {
    return db.select().from(salaryPayments).where(eq(salaryPayments.payrollId, payrollId)).orderBy(desc(salaryPayments.id));
  }

  async getSalaryPayment(id: number): Promise<SalaryPayment | undefined> {
    const [item] = await db.select().from(salaryPayments).where(eq(salaryPayments.id, id));
    return item;
  }

  async createSalaryPayment(data: InsertSalaryPayment): Promise<SalaryPayment> {
    const [created] = await db.insert(salaryPayments).values(data).returning();
    return created;
  }

  async updateSalaryPayment(id: number, data: Partial<InsertSalaryPayment>): Promise<SalaryPayment | undefined> {
    const [updated] = await db.update(salaryPayments).set(data).where(eq(salaryPayments.id, id)).returning();
    return updated;
  }

  async deleteSalaryPayment(id: number): Promise<void> {
    await db.delete(salaryPayments).where(eq(salaryPayments.id, id));
  }

  async getBonusCommissions(month?: string, employeeId?: number): Promise<(BonusCommission & { employeeName?: string; empCode?: string; department?: string; designation?: string })[]> {
    const conditions: any[] = [];
    if (month) conditions.push(eq(bonusCommissions.month, month));
    if (employeeId) conditions.push(eq(bonusCommissions.employeeId, employeeId));
    const result = await db
      .select({
        ...bonusCommissions,
        employeeName: employees.fullName,
        empCode: employees.empCode,
        department: employees.department,
        designation: employees.designation,
      })
      .from(bonusCommissions)
      .leftJoin(employees, eq(bonusCommissions.employeeId, employees.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(bonusCommissions.id));
    return result.map(r => ({
      ...r,
      employeeName: r.employeeName || undefined,
      empCode: r.empCode || undefined,
      department: r.department || undefined,
      designation: r.designation || undefined,
    }));
  }

  async getBonusCommission(id: number): Promise<BonusCommission | undefined> {
    const [item] = await db.select().from(bonusCommissions).where(eq(bonusCommissions.id, id));
    return item;
  }

  async createBonusCommission(data: InsertBonusCommission): Promise<BonusCommission> {
    const [created] = await db.insert(bonusCommissions).values(data).returning();
    return created;
  }

  async updateBonusCommission(id: number, data: Partial<InsertBonusCommission>): Promise<BonusCommission | undefined> {
    const [updated] = await db.update(bonusCommissions).set(data).where(eq(bonusCommissions.id, id)).returning();
    return updated;
  }

  async deleteBonusCommission(id: number): Promise<void> {
    await db.delete(bonusCommissions).where(eq(bonusCommissions.id, id));
  }

  async getEmployeeTypes(): Promise<EmployeeType[]> {
    return await db.select().from(employeeTypes).orderBy(employeeTypes.name);
  }

  async getEmployeeType(id: number): Promise<EmployeeType | undefined> {
    const [item] = await db.select().from(employeeTypes).where(eq(employeeTypes.id, id));
    return item;
  }

  async createEmployeeType(data: InsertEmployeeType): Promise<EmployeeType> {
    const [created] = await db.insert(employeeTypes).values(data).returning();
    return created;
  }

  async updateEmployeeType(id: number, data: Partial<InsertEmployeeType>): Promise<EmployeeType | undefined> {
    const [updated] = await db.update(employeeTypes).set(data).where(eq(employeeTypes.id, id)).returning();
    return updated;
  }

  async deleteEmployeeType(id: number): Promise<void> {
    await db.delete(employeeTypes).where(eq(employeeTypes.id, id));
  }

  async getCommissionTypes(): Promise<CommissionType[]> {
    return await db.select().from(commissionTypes).orderBy(commissionTypes.name);
  }

  async getCommissionType(id: number): Promise<CommissionType | undefined> {
    const [item] = await db.select().from(commissionTypes).where(eq(commissionTypes.id, id));
    return item;
  }

  async createCommissionType(data: InsertCommissionType): Promise<CommissionType> {
    const [created] = await db.insert(commissionTypes).values(data).returning();
    return created;
  }

  async updateCommissionType(id: number, data: Partial<InsertCommissionType>): Promise<CommissionType | undefined> {
    const [updated] = await db.update(commissionTypes).set(data).where(eq(commissionTypes.id, id)).returning();
    return updated;
  }

  async deleteCommissionType(id: number): Promise<void> {
    await db.delete(commissionTypes).where(eq(commissionTypes.id, id));
  }

  async getActiveCommissionTypeByTrigger(triggerEvent: string): Promise<CommissionType | undefined> {
    const [item] = await db.select().from(commissionTypes).where(and(eq(commissionTypes.triggerEvent, triggerEvent), eq(commissionTypes.status, "active"), eq(commissionTypes.isAutomatic, true)));
    return item;
  }

  async getShifts(): Promise<Shift[]> {
    return await db.select().from(shifts).orderBy(shifts.name);
  }

  async getShift(id: number): Promise<Shift | undefined> {
    const [item] = await db.select().from(shifts).where(eq(shifts.id, id));
    return item;
  }

  async createShift(data: InsertShift): Promise<Shift> {
    const [created] = await db.insert(shifts).values(data).returning();
    return created;
  }

  async updateShift(id: number, data: Partial<InsertShift>): Promise<Shift | undefined> {
    const [updated] = await db.update(shifts).set(data).where(eq(shifts.id, id)).returning();
    return updated;
  }

  async deleteShift(id: number): Promise<void> {
    await db.delete(shifts).where(eq(shifts.id, id));
  }

  async getShiftAssignments(): Promise<(ShiftAssignment & { employeeName?: string; empCode?: string; department?: string; shiftName?: string; shiftCode?: string; shiftStartTime?: string; shiftEndTime?: string; shiftColor?: string })[]> {
    const result = await db
      .select({
        ...shiftAssignments,
        employeeName: employees.fullName,
        empCode: employees.empCode,
        department: employees.department,
        shiftName: shifts.name,
        shiftCode: shifts.code,
        shiftStartTime: shifts.startTime,
        shiftEndTime: shifts.endTime,
        shiftColor: shifts.color,
      })
      .from(shiftAssignments)
      .leftJoin(employees, eq(shiftAssignments.employeeId, employees.id))
      .leftJoin(shifts, eq(shiftAssignments.shiftId, shifts.id))
      .orderBy(desc(shiftAssignments.id));
    return result.map(r => ({
      ...r,
      employeeName: r.employeeName || undefined,
      empCode: r.empCode || undefined,
      department: r.department || undefined,
      shiftName: r.shiftName || undefined,
      shiftCode: r.shiftCode || undefined,
      shiftStartTime: r.shiftStartTime || undefined,
      shiftEndTime: r.shiftEndTime || undefined,
      shiftColor: r.shiftColor || undefined,
    }));
  }

  async getShiftAssignment(id: number): Promise<ShiftAssignment | undefined> {
    const [item] = await db.select().from(shiftAssignments).where(eq(shiftAssignments.id, id));
    return item;
  }

  async createShiftAssignment(data: InsertShiftAssignment): Promise<ShiftAssignment> {
    const [created] = await db.insert(shiftAssignments).values(data).returning();
    return created;
  }

  async updateShiftAssignment(id: number, data: Partial<InsertShiftAssignment>): Promise<ShiftAssignment | undefined> {
    const [updated] = await db.update(shiftAssignments).set(data).where(eq(shiftAssignments.id, id)).returning();
    return updated;
  }

  async deleteShiftAssignment(id: number): Promise<void> {
    await db.delete(shiftAssignments).where(eq(shiftAssignments.id, id));
  }

  async getAppAccessConfigs(): Promise<(AppAccessConfig & { roleName?: string })[]> {
    const result = await db.select({
      ...appAccessConfigs,
      roleName: roles.name,
    }).from(appAccessConfigs).leftJoin(roles, eq(appAccessConfigs.roleId, roles.id)).orderBy(desc(appAccessConfigs.id));
    return result.map(r => ({ ...r, roleName: r.roleName || undefined }));
  }

  async getAppAccessConfig(id: number): Promise<AppAccessConfig | undefined> {
    const [item] = await db.select().from(appAccessConfigs).where(eq(appAccessConfigs.id, id));
    return item;
  }

  async getAppAccessConfigByRole(roleId: number): Promise<AppAccessConfig | undefined> {
    const [item] = await db.select().from(appAccessConfigs).where(eq(appAccessConfigs.roleId, roleId));
    return item;
  }

  async createAppAccessConfig(data: InsertAppAccessConfig): Promise<AppAccessConfig> {
    const [created] = await db.insert(appAccessConfigs).values(data).returning();
    return created;
  }

  async updateAppAccessConfig(id: number, data: Partial<InsertAppAccessConfig>): Promise<AppAccessConfig | undefined> {
    const [updated] = await db.update(appAccessConfigs).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(appAccessConfigs.id, id)).returning();
    return updated;
  }

  async deleteAppAccessConfig(id: number): Promise<void> {
    await db.delete(appAccessConfigs).where(eq(appAccessConfigs.id, id));
  }

  async getAreaAssignments(): Promise<(AreaAssignment & { employeeName?: string; empCode?: string; department?: string; areaName?: string; areaCity?: string; areaZone?: string; areaBranch?: string; areaTotalCustomers?: number })[]> {
    const result = await db.select({
      ...areaAssignments,
      employeeName: employees.fullName,
      empCode: employees.empCode,
      department: employees.department,
      areaName: areas.name,
      areaCity: areas.city,
      areaZone: areas.zone,
      areaBranch: areas.branch,
      areaTotalCustomers: areas.totalCustomers,
    }).from(areaAssignments)
      .leftJoin(employees, eq(areaAssignments.employeeId, employees.id))
      .leftJoin(areas, eq(areaAssignments.areaId, areas.id))
      .orderBy(desc(areaAssignments.id));
    return result.map(r => ({
      ...r,
      employeeName: r.employeeName || undefined,
      empCode: r.empCode || undefined,
      department: r.department || undefined,
      areaName: r.areaName || undefined,
      areaCity: r.areaCity || undefined,
      areaZone: r.areaZone || undefined,
      areaBranch: r.areaBranch || undefined,
      areaTotalCustomers: r.areaTotalCustomers ?? undefined,
    }));
  }

  async getAreaAssignment(id: number): Promise<AreaAssignment | undefined> {
    const [item] = await db.select().from(areaAssignments).where(eq(areaAssignments.id, id));
    return item;
  }

  async getAreaAssignmentsByEmployee(employeeId: number): Promise<AreaAssignment[]> {
    return db.select().from(areaAssignments).where(eq(areaAssignments.employeeId, employeeId));
  }

  async getAreaAssignmentsByArea(areaId: number): Promise<AreaAssignment[]> {
    return db.select().from(areaAssignments).where(eq(areaAssignments.areaId, areaId));
  }

  async createAreaAssignment(data: InsertAreaAssignment): Promise<AreaAssignment> {
    const [created] = await db.insert(areaAssignments).values(data).returning();
    return created;
  }

  async updateAreaAssignment(id: number, data: Partial<InsertAreaAssignment>): Promise<AreaAssignment | undefined> {
    const [updated] = await db.update(areaAssignments).set(data).where(eq(areaAssignments.id, id)).returning();
    return updated;
  }

  async deleteAreaAssignment(id: number): Promise<void> {
    await db.delete(areaAssignments).where(eq(areaAssignments.id, id));
  }

  async getLoginActivityLogs(): Promise<LoginActivityLog[]> {
    return db.select().from(loginActivityLogs).orderBy(desc(loginActivityLogs.id));
  }

  async createLoginActivityLog(data: InsertLoginActivityLog): Promise<LoginActivityLog> {
    const [created] = await db.insert(loginActivityLogs).values(data).returning();
    return created;
  }

  async updateLoginActivityLog(id: number, data: Partial<InsertLoginActivityLog>): Promise<LoginActivityLog | undefined> {
    const [updated] = await db.update(loginActivityLogs).set(data).where(eq(loginActivityLogs.id, id)).returning();
    return updated;
  }

  async getTransactionTypes(): Promise<TransactionType[]> {
    return db.select().from(transactionTypes).orderBy(transactionTypes.sortOrder, transactionTypes.id);
  }

  async getTransactionType(id: number): Promise<TransactionType | undefined> {
    const [t] = await db.select().from(transactionTypes).where(eq(transactionTypes.id, id));
    return t;
  }

  async createTransactionType(t: InsertTransactionType): Promise<TransactionType> {
    const [created] = await db.insert(transactionTypes).values(t).returning();
    return created;
  }

  async updateTransactionType(id: number, data: Partial<InsertTransactionType>): Promise<TransactionType | undefined> {
    const [updated] = await db.update(transactionTypes).set(data).where(eq(transactionTypes.id, id)).returning();
    return updated;
  }

  async deleteTransactionType(id: number): Promise<void> {
    await db.delete(transactionTypes).where(eq(transactionTypes.id, id));
  }

  async getApprovalRequests(): Promise<ApprovalRequest[]> {
    return db.select().from(approvalRequests).orderBy(desc(approvalRequests.id));
  }

  async getApprovalRequest(id: number): Promise<ApprovalRequest | undefined> {
    const [r] = await db.select().from(approvalRequests).where(eq(approvalRequests.id, id));
    return r;
  }

  async createApprovalRequest(data: InsertApprovalRequest): Promise<ApprovalRequest> {
    const [created] = await db.insert(approvalRequests).values(data).returning();
    return created;
  }

  async updateApprovalRequest(id: number, data: Partial<InsertApprovalRequest>): Promise<ApprovalRequest | undefined> {
    const [updated] = await db.update(approvalRequests).set(data).where(eq(approvalRequests.id, id)).returning();
    return updated;
  }

  async deleteApprovalRequest(id: number): Promise<void> {
    await db.delete(approvalRequests).where(eq(approvalRequests.id, id));
  }

  async getApprovalRules(): Promise<ApprovalRule[]> {
    return db.select().from(approvalRules).orderBy(approvalRules.id);
  }

  async getApprovalRule(id: number): Promise<ApprovalRule | undefined> {
    const [r] = await db.select().from(approvalRules).where(eq(approvalRules.id, id));
    return r;
  }

  async createApprovalRule(data: InsertApprovalRule): Promise<ApprovalRule> {
    const [created] = await db.insert(approvalRules).values(data).returning();
    return created;
  }

  async updateApprovalRule(id: number, data: Partial<InsertApprovalRule>): Promise<ApprovalRule | undefined> {
    const [updated] = await db.update(approvalRules).set(data).where(eq(approvalRules.id, id)).returning();
    return updated;
  }

  async deleteApprovalRule(id: number): Promise<void> {
    await db.delete(approvalRules).where(eq(approvalRules.id, id));
  }

  async getApprovalHistoryItems(): Promise<ApprovalHistory[]> {
    return db.select().from(approvalHistory).orderBy(desc(approvalHistory.id));
  }

  async createApprovalHistory(data: InsertApprovalHistory): Promise<ApprovalHistory> {
    const [created] = await db.insert(approvalHistory).values(data).returning();
    return created;
  }

  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(desc(projects.id));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(data: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(data).returning();
    return created;
  }

  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db.update(projects).set(data).where(eq(projects.id, id)).returning();
    return updated;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getTaskActivityLogs(): Promise<TaskActivityLog[]> {
    return await db.select().from(taskActivityLogs).orderBy(desc(taskActivityLogs.id));
  }

  async getTaskActivityLogsByTaskId(taskId: number): Promise<TaskActivityLog[]> {
    return await db.select().from(taskActivityLogs).where(eq(taskActivityLogs.taskId, taskId)).orderBy(desc(taskActivityLogs.id));
  }

  async createTaskActivityLog(data: InsertTaskActivityLog): Promise<TaskActivityLog> {
    const [log] = await db.insert(taskActivityLogs).values(data).returning();
    return log;
  }

  async getAssetAssignments(): Promise<AssetAssignment[]> {
    return db.select().from(assetAssignments).orderBy(desc(assetAssignments.id));
  }

  async getAssetAssignment(id: number): Promise<AssetAssignment | undefined> {
    const [assignment] = await db.select().from(assetAssignments).where(eq(assetAssignments.id, id));
    return assignment;
  }

  async getAssetAssignmentsByCustomer(customerId: number): Promise<AssetAssignment[]> {
    return db.select().from(assetAssignments).where(eq(assetAssignments.customerId, customerId)).orderBy(desc(assetAssignments.id));
  }

  async createAssetAssignment(data: InsertAssetAssignment): Promise<AssetAssignment> {
    const [created] = await db.insert(assetAssignments).values(data).returning();
    return created;
  }

  async updateAssetAssignment(id: number, data: Partial<InsertAssetAssignment>): Promise<AssetAssignment | undefined> {
    const [updated] = await db.update(assetAssignments).set(data).where(eq(assetAssignments.id, id)).returning();
    return updated;
  }

  async deleteAssetAssignment(id: number): Promise<void> {
    await db.delete(assetAssignments).where(eq(assetAssignments.id, id));
  }

  async getAssetAssignmentHistoryByCustomer(customerId: number): Promise<AssetAssignmentHistory[]> {
    return db.select().from(assetAssignmentHistory).where(eq(assetAssignmentHistory.customerId, customerId)).orderBy(desc(assetAssignmentHistory.id));
  }

  async getAssetAssignmentHistoryByAssignment(assignmentId: number): Promise<AssetAssignmentHistory[]> {
    return db.select().from(assetAssignmentHistory).where(eq(assetAssignmentHistory.assignmentId, assignmentId)).orderBy(desc(assetAssignmentHistory.id));
  }

  async createAssetAssignmentHistory(data: InsertAssetAssignmentHistory): Promise<AssetAssignmentHistory> {
    const [created] = await db.insert(assetAssignmentHistory).values(data).returning();
    return created;
  }

  async getAssetRequests(): Promise<AssetRequest[]> {
    return db.select().from(assetRequests).orderBy(desc(assetRequests.id));
  }

  async getAssetRequest(id: number): Promise<AssetRequest | undefined> {
    const [request] = await db.select().from(assetRequests).where(eq(assetRequests.id, id));
    return request;
  }

  async createAssetRequest(data: InsertAssetRequest): Promise<AssetRequest> {
    const [created] = await db.insert(assetRequests).values(data).returning();
    return created;
  }

  async updateAssetRequest(id: number, data: Partial<InsertAssetRequest>): Promise<AssetRequest | undefined> {
    const [updated] = await db.update(assetRequests).set(data).where(eq(assetRequests.id, id)).returning();
    return updated;
  }

  async deleteAssetRequest(id: number): Promise<void> {
    await db.delete(assetRequests).where(eq(assetRequests.id, id));
  }

  async getAssetRequestHistoryByRequest(requestId: number): Promise<AssetRequestHistory[]> {
    return db.select().from(assetRequestHistory).where(eq(assetRequestHistory.requestId, requestId)).orderBy(desc(assetRequestHistory.id));
  }

  async createAssetRequestHistory(data: InsertAssetRequestHistory): Promise<AssetRequestHistory> {
    const [created] = await db.insert(assetRequestHistory).values(data).returning();
    return created;
  }

  async getAssetAllocations(): Promise<AssetAllocation[]> {
    return db.select().from(assetAllocations).orderBy(desc(assetAllocations.id));
  }

  async getAssetAllocation(id: number): Promise<AssetAllocation | undefined> {
    const [item] = await db.select().from(assetAllocations).where(eq(assetAllocations.id, id));
    return item;
  }

  async createAssetAllocation(data: InsertAssetAllocation): Promise<AssetAllocation> {
    const [created] = await db.insert(assetAllocations).values(data).returning();
    return created;
  }

  async updateAssetAllocation(id: number, data: Partial<InsertAssetAllocation>): Promise<AssetAllocation | undefined> {
    const [updated] = await db.update(assetAllocations).set(data).where(eq(assetAllocations.id, id)).returning();
    return updated;
  }

  async deleteAssetAllocation(id: number): Promise<void> {
    await db.delete(assetAllocations).where(eq(assetAllocations.id, id));
  }

  async getAssetAllocationHistoryByAllocation(allocationId: number): Promise<AssetAllocationHistory[]> {
    return db.select().from(assetAllocationHistory).where(eq(assetAllocationHistory.allocationId, allocationId)).orderBy(desc(assetAllocationHistory.id));
  }

  async createAssetAllocationHistory(data: InsertAssetAllocationHistory): Promise<AssetAllocationHistory> {
    const [created] = await db.insert(assetAllocationHistory).values(data).returning();
    return created;
  }

  async getProductTypes(): Promise<ProductType[]> {
    return db.select().from(productTypes).orderBy(desc(productTypes.id));
  }

  async getProductType(id: number): Promise<ProductType | undefined> {
    const [item] = await db.select().from(productTypes).where(eq(productTypes.id, id));
    return item;
  }

  async createProductType(data: InsertProductType): Promise<ProductType> {
    const [created] = await db.insert(productTypes).values(data).returning();
    return created;
  }

  async updateProductType(id: number, data: Partial<InsertProductType>): Promise<ProductType | undefined> {
    const [updated] = await db.update(productTypes).set(data).where(eq(productTypes.id, id)).returning();
    return updated;
  }

  async deleteProductType(id: number): Promise<void> {
    await db.delete(productTypes).where(eq(productTypes.id, id));
  }

  async getProductTypeCategories(): Promise<ProductTypeCategory[]> {
    return db.select().from(productTypeCategories).orderBy(productTypeCategories.name);
  }

  async getProductTypeCategory(id: number): Promise<ProductTypeCategory | undefined> {
    const [item] = await db.select().from(productTypeCategories).where(eq(productTypeCategories.id, id));
    return item;
  }

  async createProductTypeCategory(data: InsertProductTypeCategory): Promise<ProductTypeCategory> {
    const [created] = await db.insert(productTypeCategories).values(data).returning();
    return created;
  }

  async updateProductTypeCategory(id: number, data: Partial<InsertProductTypeCategory>): Promise<ProductTypeCategory | undefined> {
    const [updated] = await db.update(productTypeCategories).set(data).where(eq(productTypeCategories.id, id)).returning();
    return updated;
  }

  async deleteProductTypeCategory(id: number): Promise<void> {
    await db.delete(productTypeCategories).where(eq(productTypeCategories.id, id));
  }

  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers).orderBy(desc(suppliers.id));
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [item] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return item;
  }

  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const [created] = await db.insert(suppliers).values(data).returning();
    return created;
  }

  async updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [updated] = await db.update(suppliers).set(data).where(eq(suppliers.id, id)).returning();
    return updated;
  }

  async deleteSupplier(id: number): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  async getBrands(): Promise<Brand[]> {
    return db.select().from(brands).orderBy(desc(brands.id));
  }

  async getBrand(id: number): Promise<Brand | undefined> {
    const [item] = await db.select().from(brands).where(eq(brands.id, id));
    return item;
  }

  async createBrand(data: InsertBrand): Promise<Brand> {
    const [created] = await db.insert(brands).values(data).returning();
    return created;
  }

  async updateBrand(id: number, data: Partial<InsertBrand>): Promise<Brand | undefined> {
    const [updated] = await db.update(brands).set(data).where(eq(brands.id, id)).returning();
    return updated;
  }

  async deleteBrand(id: number): Promise<void> {
    await db.delete(brands).where(eq(brands.id, id));
  }

  async getProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(desc(products.id));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [item] = await db.select().from(products).where(eq(products.id, id));
    return item;
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(data).returning();
    return created;
  }

  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.id));
  }

  async getPurchaseOrder(id: number): Promise<PurchaseOrder | undefined> {
    const [item] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return item;
  }

  async createPurchaseOrder(data: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const [created] = await db.insert(purchaseOrders).values(data).returning();
    return created;
  }

  async updatePurchaseOrder(id: number, data: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder | undefined> {
    const [updated] = await db.update(purchaseOrders).set(data).where(eq(purchaseOrders.id, id)).returning();
    return updated;
  }

  async deletePurchaseOrder(id: number): Promise<void> {
    await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
    await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
  }

  async getPurchaseOrderItems(poId: number): Promise<PurchaseOrderItem[]> {
    return db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, poId));
  }

  async createPurchaseOrderItem(data: InsertPurchaseOrderItem): Promise<PurchaseOrderItem> {
    const [created] = await db.insert(purchaseOrderItems).values(data).returning();
    return created;
  }

  async updatePurchaseOrderItem(id: number, data: Partial<InsertPurchaseOrderItem>): Promise<PurchaseOrderItem | undefined> {
    const [updated] = await db.update(purchaseOrderItems).set(data).where(eq(purchaseOrderItems.id, id)).returning();
    return updated;
  }

  async deletePurchaseOrderItem(id: number): Promise<void> {
    await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.id, id));
  }

  async deletePurchaseOrderItemsByPo(poId: number): Promise<void> {
    await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, poId));
  }

  async getStockLocations(): Promise<StockLocation[]> {
    return db.select().from(stockLocations).orderBy(stockLocations.name);
  }

  async getStockLocation(id: number): Promise<StockLocation | undefined> {
    const [item] = await db.select().from(stockLocations).where(eq(stockLocations.id, id));
    return item;
  }

  async createStockLocation(data: InsertStockLocation): Promise<StockLocation> {
    const [created] = await db.insert(stockLocations).values(data).returning();
    return created;
  }

  async updateStockLocation(id: number, data: Partial<InsertStockLocation>): Promise<StockLocation | undefined> {
    const [updated] = await db.update(stockLocations).set(data).where(eq(stockLocations.id, id)).returning();
    return updated;
  }

  async deleteStockLocation(id: number): Promise<void> {
    await db.delete(stockLocations).where(eq(stockLocations.id, id));
  }

  async getStockItems(): Promise<StockItem[]> {
    return db.select().from(stockItems).orderBy(stockItems.productName);
  }

  async getStockItem(id: number): Promise<StockItem | undefined> {
    const [item] = await db.select().from(stockItems).where(eq(stockItems.id, id));
    return item;
  }

  async createStockItem(data: InsertStockItem): Promise<StockItem> {
    const [created] = await db.insert(stockItems).values(data).returning();
    return created;
  }

  async updateStockItem(id: number, data: Partial<InsertStockItem>): Promise<StockItem | undefined> {
    const [updated] = await db.update(stockItems).set(data).where(eq(stockItems.id, id)).returning();
    return updated;
  }

  async deleteStockItem(id: number): Promise<void> {
    await db.delete(stockItems).where(eq(stockItems.id, id));
  }

  async getStockMovements(): Promise<StockMovement[]> {
    return db.select().from(stockMovements).orderBy(desc(stockMovements.id));
  }

  async getStockMovementsByItem(stockItemId: number): Promise<StockMovement[]> {
    return db.select().from(stockMovements).where(eq(stockMovements.stockItemId, stockItemId)).orderBy(desc(stockMovements.id));
  }

  async createStockMovement(data: InsertStockMovement): Promise<StockMovement> {
    const [created] = await db.insert(stockMovements).values(data).returning();
    return created;
  }

  async getStockAdjustments(): Promise<StockAdjustment[]> {
    return db.select().from(stockAdjustments).orderBy(desc(stockAdjustments.id));
  }

  async getStockAdjustment(id: number): Promise<StockAdjustment | undefined> {
    const [item] = await db.select().from(stockAdjustments).where(eq(stockAdjustments.id, id));
    return item;
  }

  async createStockAdjustment(data: InsertStockAdjustment): Promise<StockAdjustment> {
    const [created] = await db.insert(stockAdjustments).values(data).returning();
    return created;
  }

  async updateStockAdjustment(id: number, data: Partial<InsertStockAdjustment>): Promise<StockAdjustment | undefined> {
    const [updated] = await db.update(stockAdjustments).set(data).where(eq(stockAdjustments.id, id)).returning();
    return updated;
  }

  async getBatches(): Promise<Batch[]> {
    return db.select().from(batches).orderBy(desc(batches.id));
  }

  async getBatch(id: number): Promise<Batch | undefined> {
    const [item] = await db.select().from(batches).where(eq(batches.id, id));
    return item;
  }

  async createBatch(data: InsertBatch): Promise<Batch> {
    const [created] = await db.insert(batches).values(data).returning();
    return created;
  }

  async updateBatch(id: number, data: Partial<InsertBatch>): Promise<Batch | undefined> {
    const [updated] = await db.update(batches).set(data).where(eq(batches.id, id)).returning();
    return updated;
  }

  async deleteBatch(id: number): Promise<void> {
    await db.delete(batches).where(eq(batches.id, id));
  }

  async getSerialNumbers(): Promise<SerialNumber[]> {
    return db.select().from(serialNumbers).orderBy(desc(serialNumbers.id));
  }

  async getSerialNumber(id: number): Promise<SerialNumber | undefined> {
    const [item] = await db.select().from(serialNumbers).where(eq(serialNumbers.id, id));
    return item;
  }

  async createSerialNumber(data: InsertSerialNumber): Promise<SerialNumber> {
    const [created] = await db.insert(serialNumbers).values(data).returning();
    return created;
  }

  async updateSerialNumber(id: number, data: Partial<InsertSerialNumber>): Promise<SerialNumber | undefined> {
    const [updated] = await db.update(serialNumbers).set(data).where(eq(serialNumbers.id, id)).returning();
    return updated;
  }

  async deleteSerialNumber(id: number): Promise<void> {
    await db.delete(serialNumbers).where(eq(serialNumbers.id, id));
  }

  async getSerialMovements(): Promise<SerialMovement[]> {
    return db.select().from(serialMovements).orderBy(desc(serialMovements.id));
  }

  async getSerialMovementsBySerial(serialId: number): Promise<SerialMovement[]> {
    return db.select().from(serialMovements).where(eq(serialMovements.serialId, serialId)).orderBy(desc(serialMovements.id));
  }

  async createSerialMovement(data: InsertSerialMovement): Promise<SerialMovement> {
    const [created] = await db.insert(serialMovements).values(data).returning();
    return created;
  }

  async getNotificationTypes(): Promise<NotificationType[]> {
    return db.select().from(notificationTypes).orderBy(desc(notificationTypes.id));
  }

  async getNotificationType(id: number): Promise<NotificationType | undefined> {
    const [item] = await db.select().from(notificationTypes).where(eq(notificationTypes.id, id));
    return item;
  }

  async createNotificationType(data: InsertNotificationType): Promise<NotificationType> {
    const [created] = await db.insert(notificationTypes).values(data).returning();
    return created;
  }

  async updateNotificationType(id: number, data: Partial<InsertNotificationType>): Promise<NotificationType | undefined> {
    const [updated] = await db.update(notificationTypes).set({ ...data, lastModified: new Date().toISOString() }).where(eq(notificationTypes.id, id)).returning();
    return updated;
  }

  async deleteNotificationType(id: number): Promise<void> {
    await db.delete(notificationTypes).where(eq(notificationTypes.id, id));
  }

  async getPushNotifications(): Promise<PushNotification[]> {
    return db.select().from(pushNotifications).orderBy(desc(pushNotifications.id));
  }

  async getPushNotification(id: number): Promise<PushNotification | undefined> {
    const [item] = await db.select().from(pushNotifications).where(eq(pushNotifications.id, id));
    return item;
  }

  async createPushNotification(data: InsertPushNotification): Promise<PushNotification> {
    const [item] = await db.insert(pushNotifications).values(data).returning();
    return item;
  }

  async updatePushNotification(id: number, data: Partial<InsertPushNotification>): Promise<PushNotification | undefined> {
    const [updated] = await db.update(pushNotifications).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(pushNotifications.id, id)).returning();
    return updated;
  }

  async deletePushNotification(id: number): Promise<void> {
    await db.delete(pushNotifications).where(eq(pushNotifications.id, id));
  }

  async getBulkCampaigns(): Promise<BulkCampaign[]> {
    return db.select().from(bulkCampaigns).orderBy(desc(bulkCampaigns.id));
  }

  async getBulkCampaign(id: number): Promise<BulkCampaign | undefined> {
    const [item] = await db.select().from(bulkCampaigns).where(eq(bulkCampaigns.id, id));
    return item;
  }

  async createBulkCampaign(data: InsertBulkCampaign): Promise<BulkCampaign> {
    const [item] = await db.insert(bulkCampaigns).values(data).returning();
    return item;
  }

  async updateBulkCampaign(id: number, data: Partial<InsertBulkCampaign>): Promise<BulkCampaign | undefined> {
    const [updated] = await db.update(bulkCampaigns).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(bulkCampaigns.id, id)).returning();
    return updated;
  }

  async deleteBulkCampaign(id: number): Promise<void> {
    await db.delete(bulkCampaigns).where(eq(bulkCampaigns.id, id));
  }

  async getSmsProviders(): Promise<SmsProvider[]> {
    return db.select().from(smsProviders).orderBy(desc(smsProviders.id));
  }

  async getSmsProvider(id: number): Promise<SmsProvider | undefined> {
    const [item] = await db.select().from(smsProviders).where(eq(smsProviders.id, id));
    return item;
  }

  async createSmsProvider(data: InsertSmsProvider): Promise<SmsProvider> {
    const [item] = await db.insert(smsProviders).values(data).returning();
    return item;
  }

  async updateSmsProvider(id: number, data: Partial<InsertSmsProvider>): Promise<SmsProvider | undefined> {
    const [updated] = await db.update(smsProviders).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(smsProviders.id, id)).returning();
    return updated;
  }

  async deleteSmsProvider(id: number): Promise<void> {
    await db.delete(smsProviders).where(eq(smsProviders.id, id));
  }

  async getEmailProviders(): Promise<EmailProvider[]> {
    return db.select().from(emailProviders).orderBy(desc(emailProviders.id));
  }

  async getEmailProvider(id: number): Promise<EmailProvider | undefined> {
    const [item] = await db.select().from(emailProviders).where(eq(emailProviders.id, id));
    return item;
  }

  async createEmailProvider(data: InsertEmailProvider): Promise<EmailProvider> {
    const [item] = await db.insert(emailProviders).values(data).returning();
    return item;
  }

  async updateEmailProvider(id: number, data: Partial<InsertEmailProvider>): Promise<EmailProvider | undefined> {
    const [updated] = await db.update(emailProviders).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(emailProviders.id, id)).returning();
    return updated;
  }

  async deleteEmailProvider(id: number): Promise<void> {
    await db.delete(emailProviders).where(eq(emailProviders.id, id));
  }

  async getWhatsappProviders(): Promise<WhatsappProvider[]> {
    return db.select().from(whatsappProviders).orderBy(desc(whatsappProviders.id));
  }

  async getWhatsappProvider(id: number): Promise<WhatsappProvider | undefined> {
    const [item] = await db.select().from(whatsappProviders).where(eq(whatsappProviders.id, id));
    return item;
  }

  async createWhatsappProvider(data: InsertWhatsappProvider): Promise<WhatsappProvider> {
    const [item] = await db.insert(whatsappProviders).values(data).returning();
    return item;
  }

  async updateWhatsappProvider(id: number, data: Partial<InsertWhatsappProvider>): Promise<WhatsappProvider | undefined> {
    const { providerId, createdAt, createdBy, messagesSent, messagesDelivered, messagesRead, messagesFailed, totalCost, ...safe } = data as any;
    const [item] = await db.update(whatsappProviders).set({ ...safe, updatedAt: new Date().toISOString() }).where(eq(whatsappProviders.id, id)).returning();
    return item;
  }

  async deleteWhatsappProvider(id: number): Promise<void> {
    await db.delete(whatsappProviders).where(eq(whatsappProviders.id, id));
  }

  async getPushMessages(): Promise<PushMessage[]> {
    return db.select().from(pushMessages).orderBy(desc(pushMessages.id));
  }

  async getPushMessage(id: number): Promise<PushMessage | undefined> {
    const [item] = await db.select().from(pushMessages).where(eq(pushMessages.id, id));
    return item;
  }

  async createPushMessage(data: InsertPushMessage): Promise<PushMessage> {
    const [item] = await db.insert(pushMessages).values(data).returning();
    return item;
  }

  async updatePushMessage(id: number, data: Partial<InsertPushMessage>): Promise<PushMessage | undefined> {
    const [item] = await db.update(pushMessages).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(pushMessages.id, id)).returning();
    return item;
  }

  async deletePushMessage(id: number): Promise<void> {
    await db.delete(pushMessages).where(eq(pushMessages.id, id));
  }

  async getMessageLogs(): Promise<MessageLog[]> {
    return db.select().from(messageLogs).orderBy(desc(messageLogs.id));
  }

  async createMessageLog(data: InsertMessageLog): Promise<MessageLog> {
    const [item] = await db.insert(messageLogs).values(data).returning();
    return item;
  }

  async getGeneralSettings(): Promise<GeneralSetting[]> {
    return db.select().from(generalSettings).orderBy(generalSettings.category, generalSettings.settingKey);
  }

  async getGeneralSettingsByCategory(category: string): Promise<GeneralSetting[]> {
    return db.select().from(generalSettings).where(eq(generalSettings.category, category));
  }

  async upsertGeneralSetting(data: InsertGeneralSetting): Promise<GeneralSetting> {
    const existing = await db.select().from(generalSettings).where(eq(generalSettings.settingKey, data.settingKey));
    if (existing.length > 0) {
      const [updated] = await db.update(generalSettings).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(generalSettings.settingKey, data.settingKey)).returning();
      return updated;
    }
    const [item] = await db.insert(generalSettings).values({ ...data, updatedAt: new Date().toISOString() }).returning();
    return item;
  }

  async bulkUpsertGeneralSettings(settings: InsertGeneralSetting[]): Promise<GeneralSetting[]> {
    const results: GeneralSetting[] = [];
    for (const s of settings) {
      results.push(await this.upsertGeneralSetting(s));
    }
    return results;
  }
  async getHrmRoles(): Promise<HrmRole[]> {
    return db.select().from(hrmRoles).where(eq(hrmRoles.isArchived, false)).orderBy(hrmRoles.name);
  }

  async getHrmRole(id: number): Promise<HrmRole | undefined> {
    const [role] = await db.select().from(hrmRoles).where(eq(hrmRoles.id, id));
    return role;
  }

  async createHrmRole(data: InsertHrmRole): Promise<HrmRole> {
    const [role] = await db.insert(hrmRoles).values(data).returning();
    return role;
  }

  async updateHrmRole(id: number, data: Partial<InsertHrmRole>): Promise<HrmRole | undefined> {
    const [role] = await db.update(hrmRoles).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(hrmRoles.id, id)).returning();
    return role;
  }

  async deleteHrmRole(id: number): Promise<void> {
    await db.update(hrmRoles).set({ isArchived: true, updatedAt: new Date().toISOString() }).where(eq(hrmRoles.id, id));
  }

  async getHrmPermissions(roleId: number): Promise<HrmPermission[]> {
    return db.select().from(hrmPermissions).where(eq(hrmPermissions.roleId, roleId));
  }

  async upsertHrmPermission(data: InsertHrmPermission): Promise<HrmPermission> {
    const existing = await db.select().from(hrmPermissions)
      .where(and(
        eq(hrmPermissions.roleId, data.roleId),
        eq(hrmPermissions.module, data.module),
        data.submenu ? eq(hrmPermissions.submenu, data.submenu) : isNull(hrmPermissions.submenu)
      ));
    if (existing.length > 0) {
      const [updated] = await db.update(hrmPermissions)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(hrmPermissions.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(hrmPermissions).values(data).returning();
    return created;
  }

  async bulkUpsertHrmPermissions(permissions: InsertHrmPermission[]): Promise<HrmPermission[]> {
    const results: HrmPermission[] = [];
    for (const p of permissions) {
      results.push(await this.upsertHrmPermission(p));
    }
    return results;
  }

  async deleteHrmPermissionsByRole(roleId: number): Promise<void> {
    await db.delete(hrmPermissions).where(eq(hrmPermissions.roleId, roleId));
  }

  async getCustomerGroups(): Promise<CustomerGroup[]> {
    return db.select().from(customerGroups).where(eq(customerGroups.isArchived, false)).orderBy(customerGroups.name);
  }

  async getCustomerGroup(id: number): Promise<CustomerGroup | undefined> {
    const [group] = await db.select().from(customerGroups).where(eq(customerGroups.id, id));
    return group;
  }

  async createCustomerGroup(data: InsertCustomerGroup): Promise<CustomerGroup> {
    const [group] = await db.insert(customerGroups).values(data).returning();
    return group;
  }

  async updateCustomerGroup(id: number, data: Partial<InsertCustomerGroup>): Promise<CustomerGroup | undefined> {
    const [group] = await db.update(customerGroups).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(customerGroups.id, id)).returning();
    return group;
  }

  async deleteCustomerGroup(id: number): Promise<void> {
    await db.update(customerGroups).set({ isArchived: true, updatedAt: new Date().toISOString() }).where(eq(customerGroups.id, id));
  }

  async getCustomerRights(groupId: number): Promise<CustomerRight[]> {
    return db.select().from(customerRights).where(eq(customerRights.groupId, groupId));
  }

  async upsertCustomerRight(data: InsertCustomerRight): Promise<CustomerRight> {
    const existing = await db.select().from(customerRights)
      .where(and(
        eq(customerRights.groupId, data.groupId),
        eq(customerRights.category, data.category),
        eq(customerRights.featureKey, data.featureKey)
      ));
    if (existing.length > 0) {
      const [updated] = await db.update(customerRights)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(customerRights.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(customerRights).values(data).returning();
    return created;
  }

  async bulkUpsertCustomerRights(rights: InsertCustomerRight[]): Promise<CustomerRight[]> {
    const results: CustomerRight[] = [];
    for (const r of rights) {
      results.push(await this.upsertCustomerRight(r));
    }
    return results;
  }

  async deleteCustomerRightsByGroup(groupId: number): Promise<void> {
    await db.delete(customerRights).where(eq(customerRights.groupId, groupId));
  }

  async getInvoiceTemplates(): Promise<InvoiceTemplate[]> {
    return db.select().from(invoiceTemplates).orderBy(desc(invoiceTemplates.updatedAt));
  }

  async getInvoiceTemplatesByCategory(category: string): Promise<InvoiceTemplate[]> {
    return db.select().from(invoiceTemplates).where(eq(invoiceTemplates.invoiceCategory, category)).orderBy(desc(invoiceTemplates.updatedAt));
  }

  async getInvoiceTemplate(id: number): Promise<InvoiceTemplate | undefined> {
    const [t] = await db.select().from(invoiceTemplates).where(eq(invoiceTemplates.id, id));
    return t;
  }

  async createInvoiceTemplate(data: InsertInvoiceTemplate): Promise<InvoiceTemplate> {
    const [t] = await db.insert(invoiceTemplates).values(data).returning();
    return t;
  }

  async updateInvoiceTemplate(id: number, data: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | undefined> {
    const [t] = await db.update(invoiceTemplates).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(invoiceTemplates.id, id)).returning();
    return t;
  }

  async deleteInvoiceTemplate(id: number): Promise<void> {
    await db.delete(invoiceTemplates).where(eq(invoiceTemplates.id, id));
  }

  async getNotificationChannels(): Promise<NotificationChannel[]> {
    return db.select().from(notificationChannels).orderBy(notificationChannels.priority);
  }

  async getNotificationChannel(id: number): Promise<NotificationChannel | undefined> {
    const [ch] = await db.select().from(notificationChannels).where(eq(notificationChannels.id, id));
    return ch;
  }

  async createNotificationChannel(data: InsertNotificationChannel): Promise<NotificationChannel> {
    const [ch] = await db.insert(notificationChannels).values(data).returning();
    return ch;
  }

  async updateNotificationChannel(id: number, data: Partial<InsertNotificationChannel>): Promise<NotificationChannel | undefined> {
    const { channelId, createdAt, ...safe } = data as any;
    const [ch] = await db.update(notificationChannels).set({ ...safe, updatedAt: new Date().toISOString() }).where(eq(notificationChannels.id, id)).returning();
    return ch;
  }

  async deleteNotificationChannel(id: number): Promise<void> {
    await db.delete(notificationChannels).where(eq(notificationChannels.id, id));
  }

  async getNotificationTriggers(): Promise<NotificationTrigger[]> {
    return db.select().from(notificationTriggers).orderBy(notificationTriggers.eventCategory, notificationTriggers.eventName);
  }

  async getNotificationTriggersByCategory(category: string): Promise<NotificationTrigger[]> {
    return db.select().from(notificationTriggers).where(eq(notificationTriggers.eventCategory, category)).orderBy(notificationTriggers.eventName);
  }

  async getNotificationTrigger(id: number): Promise<NotificationTrigger | undefined> {
    const [t] = await db.select().from(notificationTriggers).where(eq(notificationTriggers.id, id));
    return t;
  }

  async createNotificationTrigger(data: InsertNotificationTrigger): Promise<NotificationTrigger> {
    const [t] = await db.insert(notificationTriggers).values(data).returning();
    return t;
  }

  async updateNotificationTrigger(id: number, data: Partial<InsertNotificationTrigger>): Promise<NotificationTrigger | undefined> {
    const { triggerId, createdAt, ...safe } = data as any;
    const [t] = await db.update(notificationTriggers).set({ ...safe, updatedAt: new Date().toISOString() }).where(eq(notificationTriggers.id, id)).returning();
    return t;
  }

  async deleteNotificationTrigger(id: number): Promise<void> {
    await db.delete(notificationTriggers).where(eq(notificationTriggers.id, id));
  }

  async getNotificationLogs(): Promise<NotificationLog[]> {
    return db.select().from(notificationLogs).orderBy(desc(notificationLogs.id)).limit(500);
  }

  async getNotificationLogStats(): Promise<{ total: number; delivered: number; failed: number; pending: number }> {
    const all = await db.select().from(notificationLogs);
    return {
      total: all.length,
      delivered: all.filter(l => l.status === "delivered").length,
      failed: all.filter(l => l.status === "failed").length,
      pending: all.filter(l => l.status === "pending").length,
    };
  }

  async createNotificationLog(data: InsertNotificationLog): Promise<NotificationLog> {
    const [l] = await db.insert(notificationLogs).values(data).returning();
    return l;
  }

  async updateNotificationLog(id: number, data: Partial<InsertNotificationLog>): Promise<NotificationLog | undefined> {
    const [l] = await db.update(notificationLogs).set(data).where(eq(notificationLogs.id, id)).returning();
    return l;
  }

  async getGatewayWebhooks(): Promise<GatewayWebhook[]> {
    return db.select().from(gatewayWebhooks).orderBy(desc(gatewayWebhooks.id));
  }

  async getGatewayWebhooksByGateway(gatewayId: number): Promise<GatewayWebhook[]> {
    return db.select().from(gatewayWebhooks).where(eq(gatewayWebhooks.gatewayId, gatewayId)).orderBy(gatewayWebhooks.eventType);
  }

  async getGatewayWebhook(id: number): Promise<GatewayWebhook | undefined> {
    const [w] = await db.select().from(gatewayWebhooks).where(eq(gatewayWebhooks.id, id));
    return w;
  }

  async createGatewayWebhook(data: InsertGatewayWebhook): Promise<GatewayWebhook> {
    const [w] = await db.insert(gatewayWebhooks).values(data).returning();
    return w;
  }

  async updateGatewayWebhook(id: number, data: Partial<InsertGatewayWebhook>): Promise<GatewayWebhook | undefined> {
    const { webhookId, createdAt, ...safe } = data as any;
    const [w] = await db.update(gatewayWebhooks).set({ ...safe, updatedAt: new Date().toISOString() }).where(eq(gatewayWebhooks.id, id)).returning();
    return w;
  }

  async deleteGatewayWebhook(id: number): Promise<void> {
    await db.delete(gatewayWebhooks).where(eq(gatewayWebhooks.id, id));
  }

  async getGatewaySettlements(): Promise<GatewaySettlement[]> {
    return db.select().from(gatewaySettlements).orderBy(desc(gatewaySettlements.id));
  }

  async getGatewaySettlementsByGateway(gatewayId: number): Promise<GatewaySettlement[]> {
    return db.select().from(gatewaySettlements).where(eq(gatewaySettlements.gatewayId, gatewayId)).orderBy(desc(gatewaySettlements.id));
  }

  async createGatewaySettlement(data: InsertGatewaySettlement): Promise<GatewaySettlement> {
    const [s] = await db.insert(gatewaySettlements).values(data).returning();
    return s;
  }

  async updateGatewaySettlement(id: number, data: Partial<InsertGatewaySettlement>): Promise<GatewaySettlement | undefined> {
    const { settlementId, createdAt, ...safe } = data as any;
    const [s] = await db.update(gatewaySettlements).set(safe).where(eq(gatewaySettlements.id, id)).returning();
    return s;
  }

  async getGatewaySettlement(id: number): Promise<GatewaySettlement | undefined> {
    const [s] = await db.select().from(gatewaySettlements).where(eq(gatewaySettlements.id, id));
    return s;
  }

  async deleteGatewaySettlement(id: number): Promise<void> {
    await db.delete(gatewaySettlements).where(eq(gatewaySettlements.id, id));
  }

  async getFiberRoutes(): Promise<FiberRoute[]> {
    return db.select().from(fiberRoutes).orderBy(desc(fiberRoutes.id));
  }
  async getFiberRoute(id: number): Promise<FiberRoute | undefined> {
    const [r] = await db.select().from(fiberRoutes).where(eq(fiberRoutes.id, id));
    return r;
  }
  async createFiberRoute(data: InsertFiberRoute): Promise<FiberRoute> {
    const [r] = await db.insert(fiberRoutes).values(data).returning();
    return r;
  }
  async updateFiberRoute(id: number, data: Partial<InsertFiberRoute>): Promise<FiberRoute | undefined> {
    const [r] = await db.update(fiberRoutes).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(fiberRoutes.id, id)).returning();
    return r;
  }
  async deleteFiberRoute(id: number): Promise<void> {
    await db.delete(fiberRoutes).where(eq(fiberRoutes.id, id));
  }

  async getNetworkTowers(): Promise<NetworkTower[]> {
    return db.select().from(networkTowers).orderBy(desc(networkTowers.id));
  }
  async getNetworkTower(id: number): Promise<NetworkTower | undefined> {
    const [t] = await db.select().from(networkTowers).where(eq(networkTowers.id, id));
    return t;
  }
  async createNetworkTower(data: InsertNetworkTower): Promise<NetworkTower> {
    const [t] = await db.insert(networkTowers).values(data).returning();
    return t;
  }
  async updateNetworkTower(id: number, data: Partial<InsertNetworkTower>): Promise<NetworkTower | undefined> {
    const [t] = await db.update(networkTowers).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(networkTowers.id, id)).returning();
    return t;
  }
  async deleteNetworkTower(id: number): Promise<void> {
    await db.delete(networkTowers).where(eq(networkTowers.id, id));
  }

  async getOltDevices(): Promise<OltDevice[]> {
    return db.select().from(oltDevices).orderBy(desc(oltDevices.id));
  }
  async getOltDevice(id: number): Promise<OltDevice | undefined> {
    const [o] = await db.select().from(oltDevices).where(eq(oltDevices.id, id));
    return o;
  }
  async createOltDevice(data: InsertOltDevice): Promise<OltDevice> {
    const [o] = await db.insert(oltDevices).values(data).returning();
    return o;
  }
  async updateOltDevice(id: number, data: Partial<InsertOltDevice>): Promise<OltDevice | undefined> {
    const [o] = await db.update(oltDevices).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(oltDevices.id, id)).returning();
    return o;
  }
  async deleteOltDevice(id: number): Promise<void> {
    await db.delete(oltDevices).where(eq(oltDevices.id, id));
  }

  async getGponSplitters(): Promise<GponSplitter[]> {
    return db.select().from(gponSplitters).orderBy(desc(gponSplitters.id));
  }
  async getGponSplitter(id: number): Promise<GponSplitter | undefined> {
    const [s] = await db.select().from(gponSplitters).where(eq(gponSplitters.id, id));
    return s;
  }
  async createGponSplitter(data: InsertGponSplitter): Promise<GponSplitter> {
    const [s] = await db.insert(gponSplitters).values(data).returning();
    return s;
  }
  async updateGponSplitter(id: number, data: Partial<InsertGponSplitter>): Promise<GponSplitter | undefined> {
    const [s] = await db.update(gponSplitters).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(gponSplitters.id, id)).returning();
    return s;
  }
  async deleteGponSplitter(id: number): Promise<void> {
    await db.delete(gponSplitters).where(eq(gponSplitters.id, id));
  }

  async getOnuDevices(): Promise<OnuDevice[]> {
    return db.select().from(onuDevices).orderBy(desc(onuDevices.id));
  }
  async getOnuDevice(id: number): Promise<OnuDevice | undefined> {
    const [o] = await db.select().from(onuDevices).where(eq(onuDevices.id, id));
    return o;
  }
  async createOnuDevice(data: InsertOnuDevice): Promise<OnuDevice> {
    const [o] = await db.insert(onuDevices).values(data).returning();
    return o;
  }
  async updateOnuDevice(id: number, data: Partial<InsertOnuDevice>): Promise<OnuDevice | undefined> {
    const [o] = await db.update(onuDevices).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(onuDevices.id, id)).returning();
    return o;
  }
  async deleteOnuDevice(id: number): Promise<void> {
    await db.delete(onuDevices).where(eq(onuDevices.id, id));
  }

  async getP2pLinks(): Promise<P2pLink[]> {
    return db.select().from(p2pLinks).orderBy(desc(p2pLinks.id));
  }
  async getP2pLink(id: number): Promise<P2pLink | undefined> {
    const [l] = await db.select().from(p2pLinks).where(eq(p2pLinks.id, id));
    return l;
  }
  async createP2pLink(data: InsertP2pLink): Promise<P2pLink> {
    const [l] = await db.insert(p2pLinks).values(data).returning();
    return l;
  }
  async updateP2pLink(id: number, data: Partial<InsertP2pLink>): Promise<P2pLink | undefined> {
    const [l] = await db.update(p2pLinks).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(p2pLinks.id, id)).returning();
    return l;
  }
  async deleteP2pLink(id: number): Promise<void> {
    await db.delete(p2pLinks).where(eq(p2pLinks.id, id));
  }

  async getServiceSchedulerRequests(customerId: number): Promise<ServiceSchedulerRequest[]> {
    return db.select().from(serviceSchedulerRequests)
      .where(eq(serviceSchedulerRequests.customerId, customerId))
      .orderBy(desc(serviceSchedulerRequests.id));
  }
  async getServiceSchedulerRequest(id: number): Promise<ServiceSchedulerRequest | undefined> {
    const [r] = await db.select().from(serviceSchedulerRequests).where(eq(serviceSchedulerRequests.id, id));
    return r;
  }
  async createServiceSchedulerRequest(data: InsertServiceSchedulerRequest): Promise<ServiceSchedulerRequest> {
    const [r] = await db.insert(serviceSchedulerRequests).values(data).returning();
    return r;
  }
  async updateServiceSchedulerRequest(id: number, data: Partial<InsertServiceSchedulerRequest>): Promise<ServiceSchedulerRequest | undefined> {
    const [r] = await db.update(serviceSchedulerRequests).set(data).where(eq(serviceSchedulerRequests.id, id)).returning();
    return r;
  }
  async deleteServiceSchedulerRequest(id: number): Promise<void> {
    await db.delete(serviceSchedulerRequests).where(eq(serviceSchedulerRequests.id, id));
  }
}

export const storage = new DatabaseStorage();
