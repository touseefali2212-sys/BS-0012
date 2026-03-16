import { storage } from "./storage";
import { db } from "./db";
import { users, customerTypes, resellerTypes, accountTypes, transactionTypes, cirCustomers, corporateCustomers, approvalRequests } from "@shared/schema";
import { log } from "./index";

async function seedResellerTypes() {
  const existing = await db.select().from(resellerTypes).limit(1);
  if (existing.length > 0) return;
  await storage.createResellerType({ key: "authorized_dealer", label: "Authorized Dealer", description: "Official partners authorized to sell and distribute services in designated territories. They receive full brand support and priority commission rates.", icon: "shield", color: "blue", isDefault: true, status: "active", commissionModel: "percentage", defaultCommissionRate: "15", territoryExclusive: true, allowSubResellers: true, allowCustomBranding: false, allowApiAccess: false, walletEnabled: true, minCustomers: 0, maxCustomers: 0, features: "Territory exclusivity,Brand support,Priority commission,Direct support line", sortOrder: 1 });
  await storage.createResellerType({ key: "sub_reseller", label: "Sub-Reseller", description: "Partners operating under an authorized dealer, extending the sales network to smaller regions or communities.", icon: "network", color: "teal", isDefault: false, status: "active", commissionModel: "percentage", defaultCommissionRate: "10", territoryExclusive: false, allowSubResellers: false, allowCustomBranding: false, allowApiAccess: false, walletEnabled: true, minCustomers: 0, maxCustomers: 500, features: "Flexible territory,Dealer support,Standard commission,Training provided", sortOrder: 2 });
  await storage.createResellerType({ key: "franchise", label: "Franchise", description: "Independent operators using the brand name and business model under a franchise agreement with fixed operational guidelines.", icon: "store", color: "violet", isDefault: false, status: "active", commissionModel: "fixed", defaultCommissionRate: "12", territoryExclusive: true, allowSubResellers: false, allowCustomBranding: false, allowApiAccess: false, walletEnabled: true, minCustomers: 50, maxCustomers: 0, features: "Brand licensing,Operational guidelines,Fixed commission,Marketing support", sortOrder: 3 });
  await storage.createResellerType({ key: "white_label", label: "White Label", description: "Partners who rebrand and sell services under their own company name, ideal for established businesses wanting to expand offerings.", icon: "tag", color: "amber", isDefault: false, status: "active", commissionModel: "bulk", defaultCommissionRate: "20", territoryExclusive: false, allowSubResellers: true, allowCustomBranding: true, allowApiAccess: true, walletEnabled: true, minCustomers: 100, maxCustomers: 0, features: "Custom branding,Own pricing,Bulk rates,API access", sortOrder: 4 });
  log("Reseller types seeded", "seed");
}

async function seedCustomerTypes() {
  const existing = await db.select().from(customerTypes).limit(1);
  if (existing.length > 0) return;
  await storage.createCustomerType({ key: "home", label: "Home", description: "Residential customers with standard home internet and TV services.", icon: "home", color: "blue", isDefault: true, status: "active", billingCycle: "monthly", lateFeePercentage: "0", gracePeriodDays: 7, requiresCnic: false, requiresNtn: false, autoSuspendDays: 30, sortOrder: 1 });
  await storage.createCustomerType({ key: "business", label: "Business", description: "Small to medium businesses requiring reliable connectivity and support.", icon: "building2", color: "violet", isDefault: false, status: "active", billingCycle: "monthly", lateFeePercentage: "2", gracePeriodDays: 10, requiresCnic: true, requiresNtn: false, autoSuspendDays: 15, sortOrder: 2 });
  await storage.createCustomerType({ key: "enterprise", label: "Enterprise", description: "Large-scale enterprise clients with dedicated bandwidth and SLA agreements.", icon: "building", color: "amber", isDefault: false, status: "active", billingCycle: "monthly", lateFeePercentage: "5", gracePeriodDays: 15, requiresCnic: true, requiresNtn: true, autoSuspendDays: 45, sortOrder: 3 });
  await storage.createCustomerType({ key: "reseller", label: "Reseller", description: "Partner resellers who distribute services under their own branding.", icon: "store", color: "green", isDefault: false, status: "active", billingCycle: "monthly", lateFeePercentage: "0", gracePeriodDays: 30, requiresCnic: true, requiresNtn: true, autoSuspendDays: 60, sortOrder: 4 });
  await storage.createCustomerType({ key: "corporate", label: "Corporate", description: "Corporate offices with dedicated SLA, static IPs, and priority support.", icon: "landmark", color: "indigo", isDefault: false, status: "active", billingCycle: "monthly", lateFeePercentage: "3", gracePeriodDays: 14, requiresCnic: true, requiresNtn: true, autoSuspendDays: 30, sortOrder: 5 });
  await storage.createCustomerType({ key: "government", label: "Government", description: "Government agencies and public sector institutions.", icon: "shield", color: "slate", isDefault: false, status: "active", billingCycle: "quarterly", lateFeePercentage: "0", gracePeriodDays: 30, requiresCnic: false, requiresNtn: true, autoSuspendDays: 90, sortOrder: 6 });
  log("Customer types seeded", "seed");
}

async function seedAccountTypes() {
  const existing = await db.select().from(accountTypes).limit(1);
  if (existing.length > 0) return;
  const now = new Date().toISOString();
  const at = (name: string, code: string, category: string, normalBalance: string, parentId: number | null, description: string, opts: any = {}) =>
    storage.createAccountType({ name, code, category, normalBalance, parentId, description, includeTrialBalance: true, includeProfitLoss: opts.pl ?? false, includeBalanceSheet: opts.bs ?? false, allowSubAccounts: opts.sub ?? true, allowDirectPosting: opts.post ?? true, isSystemDefault: true, isActive: true, sortOrder: opts.sort ?? 0, createdAt: now });

  const a1 = await at("Assets", "AT-100", "asset", "debit", null, "All asset accounts", { bs: true, sort: 1 });
  await at("Current Assets", "AT-110", "asset", "debit", a1.id, "Short-term assets convertible to cash within a year", { bs: true, sort: 2 });
  await at("Fixed Assets", "AT-120", "asset", "debit", a1.id, "Long-term tangible assets like equipment and property", { bs: true, sort: 3 });
  await at("Bank Accounts", "AT-130", "asset", "debit", a1.id, "Cash held in bank accounts", { bs: true, sort: 4 });
  await at("Accounts Receivable", "AT-140", "asset", "debit", a1.id, "Money owed by customers for services rendered", { bs: true, sort: 5 });
  await at("Prepaid Expenses", "AT-150", "asset", "debit", a1.id, "Expenses paid in advance", { bs: true, sort: 6 });

  const l1 = await at("Liabilities", "AT-200", "liability", "credit", null, "All liability accounts", { bs: true, sort: 10 });
  await at("Current Liabilities", "AT-210", "liability", "credit", l1.id, "Short-term obligations due within a year", { bs: true, sort: 11 });
  await at("Vendor Payables", "AT-220", "liability", "credit", l1.id, "Amounts owed to vendors and suppliers", { bs: true, sort: 12 });
  await at("Tax Payable", "AT-230", "liability", "credit", l1.id, "Tax obligations including WHT and GST", { bs: true, sort: 13 });
  await at("Reseller Wallet Liability", "AT-240", "liability", "credit", l1.id, "Reseller prepaid wallet balances held as liability", { bs: true, sort: 14 });
  await at("Customer Advances", "AT-250", "liability", "credit", l1.id, "Advance payments received from customers", { bs: true, sort: 15 });

  const e1 = await at("Equity", "AT-300", "equity", "credit", null, "Owner's equity and retained earnings", { bs: true, sort: 20 });
  await at("Owner's Equity", "AT-310", "equity", "credit", e1.id, "Capital invested by the business owner", { bs: true, sort: 21 });
  await at("Retained Earnings", "AT-320", "equity", "credit", e1.id, "Accumulated profits reinvested in the business", { bs: true, sort: 22 });

  const r1 = await at("Revenue", "AT-400", "revenue", "credit", null, "All revenue accounts", { pl: true, sort: 30 });
  await at("Internet Revenue", "AT-410", "revenue", "credit", r1.id, "Revenue from internet service subscriptions", { pl: true, sort: 31 });
  await at("CIR Revenue", "AT-420", "revenue", "credit", r1.id, "Revenue from Committed Information Rate clients", { pl: true, sort: 32 });
  await at("Corporate Revenue", "AT-430", "revenue", "credit", r1.id, "Revenue from corporate and enterprise clients", { pl: true, sort: 33 });
  await at("Installation Charges", "AT-440", "revenue", "credit", r1.id, "One-time installation and setup fees", { pl: true, sort: 34 });
  await at("Other Income", "AT-450", "revenue", "credit", r1.id, "Miscellaneous income and late fee collections", { pl: true, sort: 35 });

  const x1 = await at("Expenses", "AT-500", "expense", "debit", null, "All expense accounts", { pl: true, sort: 40 });
  await at("Bandwidth Expense", "AT-510", "expense", "debit", x1.id, "Costs for upstream bandwidth from vendors", { pl: true, sort: 41 });
  await at("Salary Expense", "AT-520", "expense", "debit", x1.id, "Employee salaries and wages", { pl: true, sort: 42 });
  await at("Commission Expense", "AT-530", "expense", "debit", x1.id, "Reseller and sales commissions", { pl: true, sort: 43 });
  await at("Operational Expense", "AT-540", "expense", "debit", x1.id, "Day-to-day operational costs", { pl: true, sort: 44 });
  await at("Depreciation", "AT-550", "expense", "debit", x1.id, "Depreciation of fixed assets", { pl: true, sort: 45 });
  await at("Utility Expense", "AT-560", "expense", "debit", x1.id, "Electricity, water, and utility bills", { pl: true, sort: 46 });

  log("Account types seeded", "seed");
}

async function seedTransactionTypes() {
  const existing = await db.select().from(transactionTypes).limit(1);
  if (existing.length > 0) return;
  const now = new Date().toISOString();
  const tt = (name: string, code: string, category: string, normalBalance: string, description: string, opts: any = {}) =>
    storage.createTransactionType({
      name, code, description, category, normalBalance,
      allowManualOverride: opts.override ?? true, autoJournalEntry: opts.journal ?? true,
      linkCustomer: opts.cust ?? false, linkCirCorporate: opts.cir ?? false, linkVendor: opts.vendor ?? false,
      linkPayroll: opts.payroll ?? false, linkResellerWallet: opts.reseller ?? false,
      linkExpenseEntry: opts.expense ?? false, linkIncomeEntry: opts.income ?? false,
      linkPaymentGateway: opts.gateway ?? false, linkCreditNotes: opts.credit ?? false,
      linkBankReconciliation: opts.bank ?? false,
      autoPostLedger: opts.ledger ?? true, requireApproval: opts.approval ?? false,
      allowEditAfterPosting: opts.editPost ?? false, lockAfterPeriodClose: opts.lock ?? true,
      recurringAllowed: opts.recurring ?? false, taxApplicable: opts.tax ?? false,
      isSystemDefault: true, isActive: true, sortOrder: opts.sort ?? 0, createdAt: now,
    });

  await tt("Customer Monthly Payment", "TT-101", "income", "debit", "Regular monthly subscription payment from customers", { cust: true, income: true, gateway: true, bank: true, recurring: true, tax: true, sort: 1 });
  await tt("Installation Fee", "TT-102", "income", "debit", "One-time installation and setup charges", { cust: true, income: true, tax: true, sort: 2 });
  await tt("Corporate CIR Revenue", "TT-103", "income", "debit", "Committed Information Rate revenue from corporate clients", { cust: true, cir: true, income: true, recurring: true, tax: true, sort: 3 });
  await tt("Late Fee", "TT-104", "income", "debit", "Penalty charged for late payment by customers", { cust: true, income: true, sort: 4 });
  await tt("Reconnection Fee", "TT-105", "income", "debit", "Fee charged when reconnecting suspended service", { cust: true, income: true, sort: 5 });
  await tt("Other Income", "TT-106", "income", "debit", "Miscellaneous income not categorized elsewhere", { income: true, sort: 6 });

  await tt("Vendor Bandwidth Payment", "TT-201", "expense", "debit", "Upstream bandwidth payment to ISP vendors", { vendor: true, expense: true, bank: true, recurring: true, approval: true, sort: 10 });
  await tt("Salary Expense", "TT-202", "expense", "debit", "Employee salary and wages payment", { payroll: true, expense: true, bank: true, recurring: true, approval: true, sort: 11 });
  await tt("Commission Expense", "TT-203", "expense", "debit", "Reseller and sales agent commissions", { reseller: true, expense: true, sort: 12 });
  await tt("Office Rent", "TT-204", "expense", "debit", "Monthly office and facility rental", { expense: true, recurring: true, sort: 13 });
  await tt("Utility Bills", "TT-205", "expense", "debit", "Electricity, internet, and utility expenses", { expense: true, recurring: true, sort: 14 });
  await tt("Equipment Purchase", "TT-206", "expense", "debit", "Hardware and networking equipment purchases", { vendor: true, expense: true, approval: true, sort: 15 });
  await tt("Maintenance Expense", "TT-207", "expense", "debit", "Infrastructure maintenance and repair costs", { expense: true, sort: 16 });
  await tt("Other Expense", "TT-208", "expense", "debit", "Miscellaneous expenses not categorized elsewhere", { expense: true, sort: 17 });

  await tt("Bank to Cash Transfer", "TT-301", "transfer", "debit", "Transfer funds from bank account to cash", { bank: true, override: true, sort: 20 });
  await tt("Branch to Branch Transfer", "TT-302", "transfer", "debit", "Inter-branch fund transfer", { bank: true, approval: true, sort: 21 });
  await tt("Wallet to Bank Transfer", "TT-303", "transfer", "debit", "Transfer reseller wallet balance to bank", { reseller: true, bank: true, sort: 22 });
  await tt("Internal Account Transfer", "TT-304", "transfer", "debit", "Transfer between internal accounts", { bank: true, sort: 23 });

  await tt("Write-Off", "TT-401", "adjustment", "debit", "Write off uncollectable receivables", { cust: true, credit: true, approval: true, sort: 30 });
  await tt("Credit Adjustment", "TT-402", "adjustment", "credit", "Adjust customer credit balance manually", { cust: true, credit: true, sort: 31 });
  await tt("Opening Balance", "TT-403", "adjustment", "debit", "Opening balance entry for new accounts", { override: true, sort: 32 });
  await tt("Period Close Adjustment", "TT-404", "adjustment", "debit", "Adjustment entries during financial period close", { approval: true, lock: true, sort: 33 });

  await tt("Customer Refund", "TT-501", "refund", "debit", "Refund payment to customer", { cust: true, credit: true, gateway: true, bank: true, approval: true, sort: 40 });
  await tt("Vendor Refund", "TT-502", "refund", "credit", "Refund received from vendor", { vendor: true, bank: true, sort: 41 });
  await tt("Overpayment Refund", "TT-503", "refund", "debit", "Refund of customer overpayment", { cust: true, credit: true, bank: true, sort: 42 });

  await tt("Auto Invoice Generation", "TT-601", "system", "debit", "System-generated recurring invoice posting", { cust: true, income: true, recurring: true, editPost: false, sort: 50 });
  await tt("Auto Late Fee Posting", "TT-602", "system", "debit", "System-generated late fee on overdue invoices", { cust: true, income: true, editPost: false, sort: 51 });
  await tt("Gateway Settlement", "TT-603", "system", "credit", "Auto-posting of payment gateway settlement", { gateway: true, bank: true, editPost: false, sort: 52 });
  await tt("Wallet Top-Up", "TT-604", "system", "credit", "Reseller wallet recharge via payment", { reseller: true, gateway: true, editPost: false, sort: 53 });

  log("Transaction types seeded", "seed");
}

async function seedCirCustomers() {
  const existing = await db.select().from(cirCustomers).limit(1);
  if (existing.length > 0) return;
  const now = new Date().toISOString();
  await storage.createCirCustomer({ companyName: "TechVista Solutions", contactPerson: "Usman Tariq", cnic: "35201-1234567-1", ntn: "1234567-8", email: "usman@techvista.pk", phone: "0333-9876543", address: "42 Johar Town, Lahore", city: "Lahore", branch: "Head Office", committedBandwidth: "100 Mbps", burstBandwidth: "150 Mbps", uploadSpeed: "100 Mbps", downloadSpeed: "100 Mbps", contentionRatio: "1:1", vlanId: "VLAN-110", staticIp: "203.175.72.10", subnetMask: "255.255.255.252", gateway: "203.175.72.9", dns: "8.8.8.8", contractStartDate: "2024-01-01", contractEndDate: "2025-12-31", slaLevel: "Gold", slaPenaltyClause: "2% discount per hour downtime beyond 4hrs/month", autoRenewal: true, monthlyCharges: "85000", installationCharges: "25000", securityDeposit: "50000", billingCycle: "monthly", invoiceType: "tax", lateFeePolicy: "2% per week after 7-day grace", monitoringEnabled: true, snmpMonitoring: true, trafficAlerts: true, status: "active", notes: "Premium corporate client since 2024" });
  await storage.createCirCustomer({ companyName: "Digital Nomad Cafe", contactPerson: "Ali Hassan", cnic: "35202-9876543-1", ntn: "9876543-2", email: "ali@digitalnomad.pk", phone: "0312-3456789", address: "15 Liberty Market, Lahore", city: "Lahore", branch: "Head Office", committedBandwidth: "200 Mbps", burstBandwidth: "300 Mbps", uploadSpeed: "200 Mbps", downloadSpeed: "200 Mbps", contentionRatio: "1:1", vlanId: "VLAN-120", staticIp: "203.175.72.14", subnetMask: "255.255.255.252", gateway: "203.175.72.13", dns: "8.8.8.8", contractStartDate: "2024-03-01", contractEndDate: "2026-02-28", slaLevel: "Platinum", slaPenaltyClause: "3% discount per hour downtime beyond 2hrs/month", autoRenewal: true, monthlyCharges: "150000", installationCharges: "35000", securityDeposit: "100000", billingCycle: "monthly", invoiceType: "tax", lateFeePolicy: "3% per week after 5-day grace", monitoringEnabled: true, snmpMonitoring: true, trafficAlerts: true, status: "active", notes: "High-value enterprise client" });
  await storage.createCirCustomer({ companyName: "MediCare Hospital Network", contactPerson: "Dr. Sara Khan", cnic: "35203-5555555-1", ntn: "5555555-3", email: "sara@medicare.pk", phone: "0300-7654321", address: "120 Canal Road, Lahore", city: "Lahore", branch: "Head Office", committedBandwidth: "50 Mbps", burstBandwidth: "75 Mbps", uploadSpeed: "50 Mbps", downloadSpeed: "50 Mbps", contentionRatio: "1:1", vlanId: "VLAN-130", staticIp: "203.175.72.18", subnetMask: "255.255.255.252", gateway: "203.175.72.17", dns: "8.8.8.8", contractStartDate: "2024-06-01", contractEndDate: "2025-05-31", slaLevel: "Gold", slaPenaltyClause: "1.5% discount per hour downtime beyond 4hrs/month", autoRenewal: false, monthlyCharges: "45000", installationCharges: "15000", securityDeposit: "30000", billingCycle: "monthly", invoiceType: "tax", lateFeePolicy: "1.5% per week after 10-day grace", monitoringEnabled: true, snmpMonitoring: false, trafficAlerts: true, status: "active", notes: "Healthcare sector — critical uptime required" });
  await storage.createCirCustomer({ companyName: "EduSmart Academy", contactPerson: "Hina Malik", cnic: "35204-6666666-1", ntn: "6666666-4", email: "hina@edusmart.pk", phone: "0345-2223344", address: "88 Model Town, Lahore", city: "Lahore", branch: "Branch 2", committedBandwidth: "30 Mbps", burstBandwidth: "50 Mbps", uploadSpeed: "30 Mbps", downloadSpeed: "30 Mbps", contentionRatio: "1:1", vlanId: "VLAN-140", staticIp: "203.175.72.22", subnetMask: "255.255.255.252", gateway: "203.175.72.21", dns: "8.8.8.8", contractStartDate: "2024-09-01", contractEndDate: "2025-08-31", slaLevel: "Silver", slaPenaltyClause: "1% discount per hour downtime beyond 8hrs/month", autoRenewal: true, monthlyCharges: "28000", installationCharges: "10000", securityDeposit: "20000", billingCycle: "monthly", invoiceType: "tax", lateFeePolicy: "1% per week after 15-day grace", monitoringEnabled: true, snmpMonitoring: false, trafficAlerts: false, status: "active", notes: "Education sector client" });
  await storage.createCirCustomer({ companyName: "CloudFirst Technologies", contactPerson: "Zain Abbas", cnic: "35205-7777777-1", ntn: "7777777-5", email: "zain@cloudfirst.pk", phone: "0321-8889900", address: "55 DHA Phase 6, Lahore", city: "Lahore", branch: "Head Office", committedBandwidth: "500 Mbps", burstBandwidth: "1 Gbps", uploadSpeed: "500 Mbps", downloadSpeed: "500 Mbps", contentionRatio: "1:1", vlanId: "VLAN-150", staticIp: "203.175.72.26", subnetMask: "255.255.255.252", gateway: "203.175.72.25", dns: "8.8.8.8", contractStartDate: "2023-01-01", contractEndDate: "2025-12-31", slaLevel: "Platinum", slaPenaltyClause: "5% discount per hour downtime beyond 1hr/month", autoRenewal: true, monthlyCharges: "350000", installationCharges: "75000", securityDeposit: "200000", billingCycle: "monthly", invoiceType: "tax", lateFeePolicy: "5% per week after 3-day grace", monitoringEnabled: true, snmpMonitoring: true, trafficAlerts: true, status: "active", notes: "Data center client — highest SLA" });
  await storage.createCirCustomer({ companyName: "PakMedia Broadcasting", contactPerson: "Kamran Shah", cnic: "35206-8888888-1", ntn: "8888888-6", email: "kamran@pakmedia.pk", phone: "0333-1112233", address: "22 Gulberg III, Lahore", city: "Lahore", branch: "Head Office", committedBandwidth: "150 Mbps", burstBandwidth: "200 Mbps", uploadSpeed: "150 Mbps", downloadSpeed: "150 Mbps", contentionRatio: "1:1", vlanId: "VLAN-160", staticIp: "203.175.72.30", subnetMask: "255.255.255.252", gateway: "203.175.72.29", dns: "8.8.8.8", contractStartDate: "2024-04-01", contractEndDate: "2025-03-31", slaLevel: "Gold", slaPenaltyClause: "2% discount per hour downtime beyond 4hrs/month", autoRenewal: false, monthlyCharges: "120000", installationCharges: "30000", securityDeposit: "80000", billingCycle: "monthly", invoiceType: "tax", lateFeePolicy: "2.5% per week after 7-day grace", monitoringEnabled: true, snmpMonitoring: true, trafficAlerts: true, status: "suspended", notes: "Payment overdue — service suspended" });
  log("CIR customers seeded", "seed");
}

async function seedCorporateCustomers() {
  const existing = await db.select().from(corporateCustomers).limit(1);
  if (existing.length > 0) return;
  await storage.createCorporateCustomer({ companyName: "Habib Industries Group", registrationNumber: "REG-HIG-2018", ntn: "2345678-1", industryType: "Manufacturing", headOfficeAddress: "Plot 45, SITE Area, Karachi", billingAddress: "Plot 45, SITE Area, Karachi 75700", accountManager: "Bilal Hussain", email: "accounts@habibindustries.pk", phone: "021-35891234", centralizedBilling: true, perBranchBilling: false, paymentTerms: "net_30", creditLimit: "2500000", securityDeposit: "500000", contractDuration: "24 months", customSla: "99.5% uptime, 4hr response", dedicatedAccountManager: "Bilal Hussain", managedRouter: true, firewall: true, loadBalancer: false, dedicatedSupport: true, backupLink: true, monitoringSla: true, totalConnections: 5, totalBandwidth: "500 Mbps", monthlyBilling: "375000", status: "active", notes: "Multi-site manufacturing group — top-tier corporate client" });
  await storage.createCorporateCustomer({ companyName: "Allied Healthcare Systems", registrationNumber: "REG-AHS-2019", ntn: "3456789-2", industryType: "Healthcare", headOfficeAddress: "78 Mall Road, Lahore", billingAddress: "78 Mall Road, Lahore 54000", accountManager: "Sara Ahmed", email: "finance@alliedhealthcare.pk", phone: "042-36541234", centralizedBilling: true, perBranchBilling: false, paymentTerms: "net_15", creditLimit: "1500000", securityDeposit: "300000", contractDuration: "36 months", customSla: "99.9% uptime, 2hr response — critical healthcare", dedicatedAccountManager: "Sara Ahmed", managedRouter: true, firewall: true, loadBalancer: true, dedicatedSupport: true, backupLink: true, monitoringSla: true, totalConnections: 8, totalBandwidth: "800 Mbps", monthlyBilling: "520000", status: "active", notes: "Hospital network — mission-critical connectivity required" });
  await storage.createCorporateCustomer({ companyName: "Faisal Education Foundation", registrationNumber: "REG-FEF-2020", ntn: "4567890-3", industryType: "Education", headOfficeAddress: "DHA Phase 4, Lahore", billingAddress: "DHA Phase 4, Lahore 54792", accountManager: "Imran Siddiqui", email: "admin@faisaleducation.pk", phone: "042-35761234", centralizedBilling: false, perBranchBilling: true, paymentTerms: "net_30", creditLimit: "800000", securityDeposit: "150000", contractDuration: "12 months", customSla: "99% uptime, 8hr response", dedicatedAccountManager: "Imran Siddiqui", managedRouter: true, firewall: false, loadBalancer: false, dedicatedSupport: false, backupLink: false, monitoringSla: true, totalConnections: 12, totalBandwidth: "600 Mbps", monthlyBilling: "285000", status: "active", notes: "12-campus education network across Punjab" });
  await storage.createCorporateCustomer({ companyName: "Zenith Financial Services", registrationNumber: "REG-ZFS-2017", ntn: "5678901-4", industryType: "Financial Services", headOfficeAddress: "Blue Area, F-6, Islamabad", billingAddress: "Blue Area, F-6, Islamabad 44000", accountManager: "Kamran Malik", email: "it@zenithfinancial.pk", phone: "051-2891234", centralizedBilling: true, perBranchBilling: false, paymentTerms: "net_15", creditLimit: "3000000", securityDeposit: "600000", contractDuration: "36 months", customSla: "99.95% uptime, 1hr response — banking grade", dedicatedAccountManager: "Kamran Malik", managedRouter: true, firewall: true, loadBalancer: true, dedicatedSupport: true, backupLink: true, monitoringSla: true, totalConnections: 15, totalBandwidth: "2 Gbps", monthlyBilling: "890000", status: "active", notes: "Banking-grade SLA — highest priority corporate client" });
  await storage.createCorporateCustomer({ companyName: "PakLogistics International", registrationNumber: "REG-PLI-2021", ntn: "6789012-5", industryType: "Logistics", headOfficeAddress: "Port Qasim, Karachi", billingAddress: "Port Qasim, Karachi 75020", accountManager: "Naveed Aslam", email: "operations@paklogistics.pk", phone: "021-34561234", centralizedBilling: true, perBranchBilling: false, paymentTerms: "net_45", creditLimit: "1200000", securityDeposit: "250000", contractDuration: "24 months", customSla: "99% uptime, 4hr response", dedicatedAccountManager: "Naveed Aslam", managedRouter: true, firewall: false, loadBalancer: false, dedicatedSupport: true, backupLink: false, monitoringSla: true, totalConnections: 6, totalBandwidth: "300 Mbps", monthlyBilling: "195000", status: "active", notes: "Warehousing and logistics network — multiple sites" });
  await storage.createCorporateCustomer({ companyName: "Metro Retail Group", registrationNumber: "REG-MRG-2019", ntn: "7890123-6", industryType: "Retail", headOfficeAddress: "Gulberg III, Lahore", billingAddress: "Gulberg III, Lahore 54660", accountManager: "Ayesha Tariq", email: "tech@metroretail.pk", phone: "042-35889900", centralizedBilling: true, perBranchBilling: false, paymentTerms: "net_30", creditLimit: "1800000", securityDeposit: "400000", contractDuration: "24 months", customSla: "99.5% uptime, 4hr response", dedicatedAccountManager: "Ayesha Tariq", managedRouter: true, firewall: true, loadBalancer: false, dedicatedSupport: true, backupLink: true, monitoringSla: true, totalConnections: 20, totalBandwidth: "1 Gbps", monthlyBilling: "450000", status: "active", notes: "20-store retail chain — POS and surveillance connectivity" });
  await storage.createCorporateCustomer({ companyName: "NovaTech Solutions", registrationNumber: "REG-NTS-2022", ntn: "8901234-7", industryType: "Technology", headOfficeAddress: "Arfa Tower, Lahore", billingAddress: "Arfa Tower, Lahore 54000", accountManager: "Bilal Hussain", email: "infra@novatech.pk", phone: "042-37891234", centralizedBilling: true, perBranchBilling: false, paymentTerms: "net_15", creditLimit: "500000", securityDeposit: "100000", contractDuration: "12 months", customSla: "99% uptime, 8hr response", dedicatedAccountManager: "Bilal Hussain", managedRouter: false, firewall: false, loadBalancer: false, dedicatedSupport: false, backupLink: false, monitoringSla: false, totalConnections: 2, totalBandwidth: "200 Mbps", monthlyBilling: "95000", status: "suspended", notes: "Payment overdue — service suspended pending recovery" });
  await storage.createCorporateCustomer({ companyName: "Crescent Pharma Ltd", registrationNumber: "REG-CPL-2016", ntn: "9012345-8", industryType: "Pharmaceutical", headOfficeAddress: "Industrial Estate, Hattar", billingAddress: "Corporate Office, F-7, Islamabad", accountManager: "Sara Ahmed", email: "it@crescentpharma.pk", phone: "051-2654321", centralizedBilling: true, perBranchBilling: false, paymentTerms: "net_30", creditLimit: "2000000", securityDeposit: "450000", contractDuration: "36 months", customSla: "99.5% uptime, 2hr response", dedicatedAccountManager: "Sara Ahmed", managedRouter: true, firewall: true, loadBalancer: true, dedicatedSupport: true, backupLink: true, monitoringSla: true, totalConnections: 4, totalBandwidth: "400 Mbps", monthlyBilling: "310000", status: "active", notes: "Pharma manufacturing with lab data requirements" });
  log("Corporate customers seeded", "seed");
}

async function seedApprovalData() {
  const existing = await db.select().from(approvalRequests).limit(1);
  if (existing.length > 0) return;

  await storage.createApprovalRule({ name: "Refund > 50,000", transactionType: "refund", minAmount: "50000", maxAmount: "500000", approvalLevel: 2, approverRole: "Finance Manager", riskCategory: "high", autoEscalateHours: 12, description: "All refunds above Rs. 50,000 require Finance Manager approval" });
  await storage.createApprovalRule({ name: "Transfer > 200,000", transactionType: "transfer", minAmount: "200000", approvalLevel: 3, approverRole: "Admin / Director", riskCategory: "critical", autoEscalateHours: 6, description: "Fund transfers exceeding Rs. 200,000 require Director approval" });
  await storage.createApprovalRule({ name: "Write-off > 100,000", transactionType: "write_off", minAmount: "100000", approvalLevel: 3, approverRole: "Director", riskCategory: "critical", autoEscalateHours: 8, description: "Write-offs above Rs. 100,000 require Director sign-off" });
  await storage.createApprovalRule({ name: "Wallet Adjustment > 10,000", transactionType: "wallet_adjustment", minAmount: "10000", maxAmount: "100000", approvalLevel: 2, approverRole: "Manager", riskCategory: "medium", autoEscalateHours: 24, description: "Wallet adjustments above Rs. 10,000 need Manager approval" });
  await storage.createApprovalRule({ name: "Standard Collection Approval", transactionType: "collection", minAmount: "100000", approvalLevel: 1, approverRole: "Accounts Officer", riskCategory: "normal", autoEscalateHours: 48, description: "High-value collections require basic verification" });
  await storage.createApprovalRule({ name: "Credit Note > 25,000", transactionType: "credit_note", minAmount: "25000", approvalLevel: 2, approverRole: "Finance Manager", riskCategory: "high", autoEscalateHours: 12, description: "Credit notes exceeding Rs. 25,000 need Finance Manager approval" });

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];

  await storage.createApprovalRequest({ requestId: "APR-001", transactionType: "refund", entityName: "Ahmed Hassan", entityType: "Customer", amount: "75000", branch: "Main Office", requestedBy: "Bilal Khan", approvalLevel: 2, currentLevel: 2, status: "pending", riskCategory: "high", requestDate: today, category: "Overpayment Refund", description: "Customer overpaid Rs. 75,000 on invoice INV-2025-0034" });
  await storage.createApprovalRequest({ requestId: "APR-002", transactionType: "transfer", entityName: "HBL to MCB Transfer", entityType: "Internal", amount: "350000", branch: "Head Office", requestedBy: "Sara Ahmed", approvalLevel: 3, currentLevel: 3, status: "pending", riskCategory: "critical", requestDate: today, category: "Bank Transfer", description: "Operational fund transfer between bank accounts" });
  await storage.createApprovalRequest({ requestId: "APR-003", transactionType: "wallet_adjustment", entityName: "SpeedNet Reseller", entityType: "Reseller", amount: "25000", branch: "Branch 2", requestedBy: "Usman Ali", approvalLevel: 2, currentLevel: 1, status: "pending", riskCategory: "medium", requestDate: yesterday, category: "Wallet Top-Up", description: "Reseller wallet credit adjustment for service credits" });
  await storage.createApprovalRequest({ requestId: "APR-004", transactionType: "write_off", entityName: "Defunct Customer Account", entityType: "Customer", amount: "120000", branch: "Main Office", requestedBy: "Bilal Khan", approvalLevel: 3, currentLevel: 2, status: "under_review", riskCategory: "critical", requestDate: yesterday, category: "Bad Debt Write-Off", description: "Customer account inactive for 12 months, uncollectable balance" });
  await storage.createApprovalRequest({ requestId: "APR-005", transactionType: "collection", entityName: "Habib Industries", entityType: "Corporate", amount: "185000", branch: "Branch 1", requestedBy: "Imran Malik", approvalLevel: 1, currentLevel: 1, status: "pending", riskCategory: "normal", requestDate: today, category: "Corporate Collection", description: "Monthly service payment from Habib Industries" });
  await storage.createApprovalRequest({ requestId: "APR-006", transactionType: "refund", entityName: "Fatima Zahra", entityType: "Customer", amount: "15000", branch: "Branch 2", requestedBy: "Ali Raza", approvalLevel: 1, currentLevel: 1, status: "approved", approvedBy: "Bilal Khan", riskCategory: "normal", requestDate: twoDaysAgo, approvalDate: yesterday, category: "Service Cancellation Refund", description: "Refund for unused prepaid balance on cancellation" });
  await storage.createApprovalRequest({ requestId: "APR-007", transactionType: "credit_note", entityName: "NovaTech Solutions", entityType: "Corporate", amount: "45000", branch: "Head Office", requestedBy: "Sara Ahmed", approvalLevel: 2, currentLevel: 2, status: "pending", riskCategory: "high", requestDate: today, category: "SLA Compensation", description: "Credit note for SLA breach - 8 hours downtime" });
  await storage.createApprovalRequest({ requestId: "APR-008", transactionType: "transfer", entityName: "Petty Cash Replenishment", entityType: "Internal", amount: "50000", branch: "Branch 1", requestedBy: "Usman Ali", approvalLevel: 2, currentLevel: 2, status: "rejected", rejectedBy: "Finance Manager", riskCategory: "medium", requestDate: threeDaysAgo, approvalDate: twoDaysAgo, category: "Cash Transfer", description: "Petty cash fund replenishment request", approvalComments: "Insufficient supporting documentation provided" });
  await storage.createApprovalRequest({ requestId: "APR-009", transactionType: "refund", entityName: "Crescent Pharma", entityType: "Corporate", amount: "92000", branch: "Head Office", requestedBy: "Imran Malik", approvalLevel: 2, currentLevel: 2, status: "escalated", riskCategory: "high", requestDate: threeDaysAgo, category: "Billing Error Refund", description: "Double billing detected on corporate account" });
  await storage.createApprovalRequest({ requestId: "APR-010", transactionType: "wallet_adjustment", entityName: "ConnectPlus Reseller", entityType: "Reseller", amount: "8000", branch: "Branch 2", requestedBy: "Ali Raza", approvalLevel: 1, currentLevel: 1, status: "approved", approvedBy: "Usman Ali", riskCategory: "normal", requestDate: twoDaysAgo, approvalDate: twoDaysAgo, category: "Commission Adjustment", description: "Monthly commission adjustment for Q4 performance" });

  await storage.createApprovalHistory({ requestId: "APR-006", action: "approved", actionBy: "Bilal Khan", actionDate: yesterday, comments: "Verified with accounts, refund is legitimate", ipAddress: "192.168.1.15", previousStatus: "pending", newStatus: "approved", level: 1 });
  await storage.createApprovalHistory({ requestId: "APR-008", action: "rejected", actionBy: "Finance Manager", actionDate: twoDaysAgo, comments: "Insufficient supporting documentation provided", ipAddress: "192.168.1.20", previousStatus: "pending", newStatus: "rejected", level: 2 });
  await storage.createApprovalHistory({ requestId: "APR-009", action: "escalated", actionBy: "System", actionDate: twoDaysAgo, comments: "Auto-escalated: Not actioned within 12 hours", ipAddress: "127.0.0.1", previousStatus: "pending", newStatus: "escalated", level: 2 });
  await storage.createApprovalHistory({ requestId: "APR-010", action: "approved", actionBy: "Usman Ali", actionDate: twoDaysAgo, comments: "Commission calculations verified", ipAddress: "192.168.1.18", previousStatus: "pending", newStatus: "approved", level: 1 });
  await storage.createApprovalHistory({ requestId: "APR-004", action: "submitted", actionBy: "Bilal Khan", actionDate: yesterday, comments: "Submitted for Level 2 review after initial assessment", ipAddress: "192.168.1.15", previousStatus: "pending", newStatus: "under_review", level: 1 });

  log("Approval workflow data seeded", "seed");
}

export async function seedDatabase() {
  try {
    await seedCustomerTypes();
    await seedResellerTypes();
    await seedAccountTypes();
    await seedTransactionTypes();
    await seedCirCustomers();
    await seedCorporateCustomers();
    await seedApprovalData();

    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      log("Database already seeded, skipping...", "seed");
      return;
    }

    log("Seeding database with sample data...", "seed");

    await storage.createUser({
      username: "admin",
      password: "admin123",
      fullName: "System Administrator",
      email: "admin@netsphere.pk",
      role: "super_admin",
      isActive: true,
    });

    const pkg1 = await storage.createPackage({ name: "Basic Home", serviceType: "internet", speed: "10 Mbps", price: "1500", billingCycle: "monthly", dataLimit: "Unlimited", description: "Ideal for light browsing and social media use", isActive: true });
    const pkg2 = await storage.createPackage({ name: "Standard Home", serviceType: "internet", speed: "25 Mbps", price: "2500", billingCycle: "monthly", dataLimit: "Unlimited", description: "Great for streaming and online gaming", isActive: true });
    const pkg3 = await storage.createPackage({ name: "Premium Home", serviceType: "internet", speed: "50 Mbps", price: "4000", billingCycle: "monthly", dataLimit: "Unlimited", description: "Best for multiple devices and 4K streaming", isActive: true });
    const pkg4 = await storage.createPackage({ name: "Corporate Basic", serviceType: "internet", speed: "100 Mbps", price: "8000", billingCycle: "monthly", dataLimit: "Unlimited", description: "Reliable connectivity for small businesses", isActive: true });
    const pkg5 = await storage.createPackage({ name: "Enterprise Plus", serviceType: "internet", speed: "200 Mbps", price: "15000", billingCycle: "monthly", dataLimit: "Unlimited", description: "Dedicated bandwidth for enterprises with SLA", isActive: true });

    await storage.createPackage({ name: "IPTV Basic", serviceType: "iptv", price: "800", billingCycle: "monthly", channels: "100+ SD Channels", features: "SD quality, Local channels, News, Sports basics", description: "Basic IPTV package with local and news channels", isActive: true });
    await storage.createPackage({ name: "IPTV Premium", serviceType: "iptv", price: "1500", billingCycle: "monthly", channels: "250+ HD Channels", features: "HD quality, Sports HD, Movies, International channels, DVR", description: "Premium IPTV with HD sports and international content", isActive: true });
    await storage.createPackage({ name: "Cable TV Standard", serviceType: "cable_tv", price: "600", billingCycle: "monthly", channels: "80+ Channels", features: "Local channels, News, Entertainment, Sports basics", description: "Standard cable TV with popular local channels", isActive: true });
    await storage.createPackage({ name: "Triple Play Bundle", serviceType: "bundle", speed: "50 Mbps", price: "5500", billingCycle: "monthly", dataLimit: "Unlimited", channels: "200+ HD Channels", features: "Internet 50Mbps + IPTV Premium + Free Router", description: "Complete bundle: Internet + IPTV + Free equipment", isActive: true });

    const c1 = await storage.createCustomer({ customerId: "ISP-1001", fullName: "Ahmed Khan", email: "ahmed.khan@gmail.com", phone: "0321-4567890", cnic: "35201-1234567-1", address: "House 45, Street 12, Gulberg III", area: "Gulberg", customerType: "home", packageId: pkg2.id, status: "active", connectionDate: "2024-06-15", monthlyBill: "2500" });
    const c2 = await storage.createCustomer({ customerId: "ISP-1002", fullName: "Fatima Zahra", email: "fatima.z@outlook.com", phone: "0300-1234567", cnic: "35202-7654321-2", address: "Flat 302, Al-Rehman Tower, DHA Phase 5", area: "DHA Phase 5", customerType: "home", packageId: pkg3.id, status: "active", connectionDate: "2024-08-20", monthlyBill: "4000" });
    const c3 = await storage.createCustomer({ customerId: "ISP-1003", fullName: "TechVista Solutions", email: "info@techvista.pk", phone: "0333-9876543", address: "Office 12, 3rd Floor, Software Technology Park", area: "Johar Town", customerType: "corporate", packageId: pkg4.id, status: "active", connectionDate: "2024-03-10", monthlyBill: "8000" });
    const c4 = await storage.createCustomer({ customerId: "ISP-1004", fullName: "Hassan Ali", email: "hassan.ali@yahoo.com", phone: "0345-6789012", cnic: "35203-9876543-3", address: "House 78, Block C, Model Town", area: "Model Town", customerType: "home", packageId: pkg1.id, status: "suspended", connectionDate: "2024-01-05", monthlyBill: "1500" });
    const c5 = await storage.createCustomer({ customerId: "ISP-1005", fullName: "Digital Nomad Cafe", email: "manager@nomadcafe.pk", phone: "0312-3456789", address: "Shop 5, Liberty Market", area: "Liberty", customerType: "corporate", packageId: pkg5.id, status: "active", connectionDate: "2024-09-01", monthlyBill: "15000" });

    const inv1 = await storage.createInvoice({ invoiceNumber: "INV-2024-001", customerId: c1.id, amount: "2500", tax: "425", totalAmount: "2925", status: "paid", dueDate: "2025-01-15", issueDate: "2025-01-01", paidDate: "2025-01-10", description: "Monthly internet service - January 2025" });
    const inv2 = await storage.createInvoice({ invoiceNumber: "INV-2024-002", customerId: c2.id, amount: "4000", tax: "680", totalAmount: "4680", status: "paid", dueDate: "2025-01-15", issueDate: "2025-01-01", paidDate: "2025-01-12", description: "Monthly internet service - January 2025" });
    const inv3 = await storage.createInvoice({ invoiceNumber: "INV-2024-003", customerId: c3.id, amount: "8000", tax: "1360", totalAmount: "9360", status: "pending", dueDate: "2025-02-15", issueDate: "2025-02-01", description: "Monthly internet service - February 2025" });
    await storage.createInvoice({ invoiceNumber: "INV-2024-004", customerId: c4.id, amount: "1500", tax: "255", totalAmount: "1755", status: "overdue", dueDate: "2024-12-15", issueDate: "2024-12-01", description: "Monthly internet service - December 2024" });
    await storage.createInvoice({ invoiceNumber: "INV-2024-005", customerId: c5.id, amount: "15000", tax: "2550", totalAmount: "17550", status: "pending", dueDate: "2025-02-15", issueDate: "2025-02-01", description: "Monthly internet service - February 2025" });

    await storage.createTicket({ ticketNumber: "TKT-001", customerId: c1.id, subject: "Internet speed slower than subscribed package", description: "Customer reports getting only 5 Mbps instead of 25 Mbps on the Standard Home package.", priority: "high", status: "open", category: "speed", assignedTo: "Technician Usman", createdAt: "2025-02-18T10:30:00Z" });
    await storage.createTicket({ ticketNumber: "TKT-002", customerId: c2.id, subject: "Frequent disconnections during evening hours", description: "Connection drops 3-4 times daily between 7 PM and 11 PM.", priority: "medium", status: "in_progress", category: "connectivity", assignedTo: "Technician Ali", createdAt: "2025-02-19T14:15:00Z" });
    await storage.createTicket({ ticketNumber: "TKT-003", customerId: c3.id, subject: "Request for static IP configuration", description: "Corporate client needs a static IP address for VPN and server hosting.", priority: "medium", status: "open", category: "general", assignedTo: "", createdAt: "2025-02-20T09:00:00Z" });
    await storage.createTicket({ ticketNumber: "TKT-004", customerId: c4.id, subject: "Billing dispute - charged for suspended period", description: "Customer was charged for the month when service was suspended.", priority: "low", status: "open", category: "billing", assignedTo: "", createdAt: "2025-02-21T11:45:00Z" });

    await storage.createArea({ name: "Gulberg", city: "Lahore", zone: "Central", branch: "Main Branch", totalCustomers: 45, status: "active" });
    await storage.createArea({ name: "DHA Phase 5", city: "Lahore", zone: "South", branch: "DHA Branch", totalCustomers: 78, status: "active" });
    await storage.createArea({ name: "Johar Town", city: "Lahore", zone: "East", branch: "Main Branch", totalCustomers: 32, status: "active" });
    await storage.createArea({ name: "Model Town", city: "Lahore", zone: "Central", branch: "Main Branch", totalCustomers: 56, status: "active" });
    await storage.createArea({ name: "Liberty", city: "Lahore", zone: "Central", branch: "Main Branch", totalCustomers: 23, status: "active" });
    await storage.createArea({ name: "Bahria Town", city: "Lahore", zone: "South", branch: "DHA Branch", totalCustomers: 120, status: "active" });
    await storage.createArea({ name: "Clifton", city: "Karachi", zone: "South", branch: "Karachi Branch", totalCustomers: 95, status: "active" });
    await storage.createArea({ name: "F-8", city: "Islamabad", zone: "Central", branch: "Islamabad Branch", totalCustomers: 40, status: "active" });

    const v1 = await storage.createVendor({ name: "FiberLink Technologies", contactPerson: "Bilal Hussain", phone: "042-35761234", email: "sales@fiberlink.pk", address: "23-A Industrial Area, Gulberg", serviceType: "fiber", ntn: "1234567-8", bankAccount: "HBL-001234567890", slaLevel: "premium", status: "active" });
    const v2 = await storage.createVendor({ name: "NetEquip Solutions", contactPerson: "Sara Ahmed", phone: "042-35889900", email: "info@netequip.pk", address: "Office 45, Tech Park, DHA", serviceType: "equipment", ntn: "9876543-2", bankAccount: "MCB-009876543210", slaLevel: "standard", status: "active" });
    await storage.createVendor({ name: "CyberShield Security", contactPerson: "Kamran Malik", phone: "051-2345678", email: "support@cybershield.pk", address: "Blue Area, Islamabad", serviceType: "software", ntn: "5678901-4", slaLevel: "enterprise", status: "active" });
    await storage.createVendor({ name: "TowerTech Maintenance", contactPerson: "Rizwan Qureshi", phone: "0300-9871234", email: "ops@towertech.pk", address: "I-9 Industrial, Islamabad", serviceType: "maintenance", ntn: "3456789-6", slaLevel: "standard", status: "active" });

    await storage.createReseller({ name: "SpeedNet Resellers", contactName: "Imran Siddiqui", phone: "0311-2223344", email: "imran@speednet.pk", address: "Shop 12, Faisal Town", area: "Faisal Town", commissionRate: "12", totalCustomers: 35, status: "active" });
    await storage.createReseller({ name: "ConnectPlus Partners", contactName: "Ayesha Tariq", phone: "0322-5556677", email: "ayesha@connectplus.pk", address: "Plaza 7, Garden Town", area: "Garden Town", commissionRate: "10", totalCustomers: 22, status: "active" });
    await storage.createReseller({ name: "FastWave Distributors", contactName: "Naveed Aslam", phone: "0333-8889900", email: "naveed@fastwave.pk", address: "Market 3, Cantt Area", area: "Cantt", commissionRate: "15", totalCustomers: 48, status: "active" });

    const acc1 = await storage.createAccount({ code: "1000", name: "Cash & Bank", type: "asset", balance: "2500000", description: "Primary cash and bank accounts", isActive: true });
    const acc2 = await storage.createAccount({ code: "2000", name: "Accounts Receivable", type: "asset", balance: "850000", description: "Outstanding customer payments", isActive: true });
    await storage.createAccount({ code: "3000", name: "Accounts Payable", type: "liability", balance: "320000", description: "Vendor and supplier payables", isActive: true });
    const acc4 = await storage.createAccount({ code: "4000", name: "Service Revenue", type: "income", balance: "4500000", description: "Internet service revenue", isActive: true });
    await storage.createAccount({ code: "5000", name: "Operating Expenses", type: "expense", balance: "1200000", description: "Day-to-day operational costs", isActive: true });
    await storage.createAccount({ code: "6000", name: "Owner's Equity", type: "equity", balance: "5000000", description: "Owner's capital investment", isActive: true });

    await storage.createTransaction({ txnId: "TXN-001", type: "payment", amount: "2925", accountId: acc1.id, customerId: c1.id, invoiceId: inv1.id, paymentMethod: "bank_transfer", reference: "HBL-TRF-001", description: "Invoice INV-2024-001 payment", date: "2025-01-10", status: "completed" });
    await storage.createTransaction({ txnId: "TXN-002", type: "payment", amount: "4680", accountId: acc1.id, customerId: c2.id, invoiceId: inv2.id, paymentMethod: "jazzcash", reference: "JC-PAY-002", description: "Invoice INV-2024-002 payment", date: "2025-01-12", status: "completed" });
    await storage.createTransaction({ txnId: "TXN-003", type: "debit", amount: "45000", accountId: acc4.id, description: "Fiber cable purchase from FiberLink", date: "2025-01-20", status: "completed", paymentMethod: "bank_transfer" });
    await storage.createTransaction({ txnId: "TXN-004", type: "credit", amount: "9360", accountId: acc2.id, customerId: c3.id, invoiceId: inv3.id, description: "Invoice INV-2024-003 billed", date: "2025-02-01", status: "pending", paymentMethod: "cash" });

    await storage.createTask({ title: "Install fiber connection - Ahmed Khan", type: "installation", description: "New fiber connection installation at Gulberg III residence", priority: "high", status: "completed", assignedTo: "Technician Usman", customerId: c1.id, dueDate: "2024-06-15", completedDate: "2024-06-15" });
    await storage.createTask({ title: "Router replacement - Fatima Zahra", type: "repair", description: "Replace faulty TP-Link router with new unit", priority: "medium", status: "in_progress", assignedTo: "Technician Ali", customerId: c2.id, dueDate: "2025-02-25" });
    await storage.createTask({ title: "Upgrade bandwidth - TechVista", type: "upgrade", description: "Upgrade from 100 Mbps to 200 Mbps dedicated line", priority: "high", status: "pending", assignedTo: "Engineer Hamza", customerId: c3.id, dueDate: "2025-03-01" });
    await storage.createTask({ title: "Monthly tower maintenance", type: "maintenance", description: "Routine maintenance of main tower equipment", priority: "medium", status: "pending", assignedTo: "Technician Usman", dueDate: "2025-02-28" });
    await storage.createTask({ title: "Network audit - DHA sector", type: "general", description: "Complete network performance audit for DHA Phase 5 area", priority: "low", status: "pending", assignedTo: "Engineer Hamza", dueDate: "2025-03-15" });

    await storage.createAsset({ assetTag: "AST-001", name: "Huawei OLT MA5800-X7", type: "OLT", brand: "Huawei", model: "MA5800-X7", serialNumber: "HW2024X7001", vendorId: v1.id, purchaseDate: "2024-01-15", purchaseCost: "850000", warrantyEnd: "2027-01-15", location: "Main POP - Gulberg", status: "deployed" });
    await storage.createAsset({ assetTag: "AST-002", name: "Cisco Catalyst 9300", type: "switch", brand: "Cisco", model: "C9300-48P", serialNumber: "CSC9300A001", vendorId: v2.id, purchaseDate: "2024-03-20", purchaseCost: "320000", warrantyEnd: "2027-03-20", location: "Main POP - Gulberg", status: "deployed" });
    await storage.createAsset({ assetTag: "AST-003", name: "TP-Link Archer AX73", type: "router", brand: "TP-Link", model: "AX73", serialNumber: "TPL73A0001", vendorId: v2.id, purchaseDate: "2024-06-10", purchaseCost: "12000", warrantyEnd: "2025-06-10", location: "Customer - Ahmed Khan", assignedTo: "Ahmed Khan", status: "deployed" });
    await storage.createAsset({ assetTag: "AST-004", name: "APC Smart-UPS 3000VA", type: "UPS", brand: "APC", model: "SUA3000I", serialNumber: "APC3KVA001", vendorId: v2.id, purchaseDate: "2024-02-01", purchaseCost: "95000", warrantyEnd: "2026-02-01", location: "Main POP - Gulberg", status: "deployed" });
    await storage.createAsset({ assetTag: "AST-005", name: "ZTE ONT F660", type: "ONT", brand: "ZTE", model: "F660", serialNumber: "ZTE660B003", vendorId: v1.id, purchaseDate: "2024-08-15", purchaseCost: "4500", warrantyEnd: "2025-08-15", location: "Warehouse", status: "available" });

    await storage.createInventoryItem({ sku: "INV-FC-001", itemName: "Single Mode Fiber Cable (1km)", category: "fiber_cable", quantity: 25, unitCost: "8500", reorderLevel: 5, vendorId: v1.id, location: "Main Warehouse", description: "G.652D single mode fiber optic cable", status: "in_stock" });
    await storage.createInventoryItem({ sku: "INV-SC-001", itemName: "SC/APC Connectors (Pack of 100)", category: "connectors", quantity: 8, unitCost: "3500", reorderLevel: 10, vendorId: v1.id, location: "Main Warehouse", description: "SC/APC fiber connectors for FTTH", status: "low_stock" });
    await storage.createInventoryItem({ sku: "INV-ONT-001", itemName: "ZTE F660 ONT Unit", category: "ONT", quantity: 45, unitCost: "4500", reorderLevel: 15, vendorId: v1.id, location: "Main Warehouse", description: "GPON ONT for residential customers", status: "in_stock" });
    await storage.createInventoryItem({ sku: "INV-RT-001", itemName: "TP-Link Archer AX73 Router", category: "router", quantity: 12, unitCost: "12000", reorderLevel: 5, vendorId: v2.id, location: "Main Warehouse", description: "WiFi 6 dual-band router for premium customers", status: "in_stock" });
    await storage.createInventoryItem({ sku: "INV-TL-001", itemName: "Fiber Splicing Tool Kit", category: "tools", quantity: 3, unitCost: "45000", reorderLevel: 2, vendorId: v2.id, location: "Field Team", description: "Complete fiber optic splicing toolkit", status: "in_stock" });
    await storage.createInventoryItem({ sku: "INV-SP-001", itemName: "1x8 PLC Splitter", category: "connectors", quantity: 0, unitCost: "2800", reorderLevel: 10, vendorId: v1.id, location: "Main Warehouse", description: "PLC fiber optic splitter", status: "out_of_stock" });

    await storage.createEmployee({ empCode: "EMP-001", fullName: "Usman Tariq", email: "usman@netsphere.pk", phone: "0321-1112233", cnic: "35201-5555555-1", department: "engineering", designation: "Senior Technician", joinDate: "2023-01-15", salary: "65000", bankAccount: "HBL-123456789", address: "House 12, Township", status: "active" });
    await storage.createEmployee({ empCode: "EMP-002", fullName: "Ali Raza", email: "ali@netsphere.pk", phone: "0300-4445566", cnic: "35202-6666666-2", department: "engineering", designation: "Field Technician", joinDate: "2023-06-01", salary: "45000", bankAccount: "MCB-987654321", address: "Flat 5, Iqbal Town", status: "active" });
    await storage.createEmployee({ empCode: "EMP-003", fullName: "Hamza Sheikh", email: "hamza@netsphere.pk", phone: "0333-7778899", cnic: "35203-7777777-3", department: "engineering", designation: "Network Engineer", joinDate: "2022-09-01", salary: "120000", bankAccount: "UBL-456789123", address: "DHA Phase 6", status: "active" });
    await storage.createEmployee({ empCode: "EMP-004", fullName: "Sana Malik", email: "sana@netsphere.pk", phone: "0345-0001122", cnic: "35204-8888888-4", department: "support", designation: "Support Lead", joinDate: "2023-03-15", salary: "55000", address: "Garden Town", status: "active" });
    await storage.createEmployee({ empCode: "EMP-005", fullName: "Zeeshan Qureshi", email: "zeeshan@netsphere.pk", phone: "0311-3334455", cnic: "35205-9999999-5", department: "sales", designation: "Sales Manager", joinDate: "2022-05-01", salary: "85000", address: "Johar Town", status: "active" });
    await storage.createEmployee({ empCode: "EMP-006", fullName: "Nadia Butt", email: "nadia@netsphere.pk", phone: "0322-6667788", department: "finance", designation: "Accountant", joinDate: "2023-08-01", salary: "50000", address: "Model Town", status: "active" });

    await storage.createRole({ name: "Super Admin", description: "Full system access with all permissions", permissions: "dashboard.view,customers.manage,packages.manage,invoices.manage,tickets.manage,reports.view,settings.manage,users.manage,hr.manage", isSystem: true, status: "active" });
    await storage.createRole({ name: "Manager", description: "Management access to most modules", permissions: "dashboard.view,customers.manage,packages.view,invoices.manage,tickets.manage,reports.view,hr.view", isSystem: true, status: "active" });
    await storage.createRole({ name: "Technician", description: "Field operations and customer service", permissions: "dashboard.view,customers.view,tickets.manage,tasks.manage,assets.view", isSystem: false, status: "active" });
    await storage.createRole({ name: "Billing Staff", description: "Billing and invoice management", permissions: "dashboard.view,customers.view,invoices.manage,transactions.manage,accounting.view", isSystem: false, status: "active" });
    await storage.createRole({ name: "Support Agent", description: "Customer support and ticket handling", permissions: "dashboard.view,customers.view,tickets.manage", isSystem: false, status: "active" });

    await storage.upsertCompanySettings({ companyName: "NetSphere Technologies (Pvt) Ltd", registrationNo: "C-12345/LHR/2020", ntn: "1234567-8", address: "23-A, Tech Avenue, Gulberg III", city: "Lahore", phone: "042-35761000", email: "info@netsphere.pk", website: "https://netsphere.pk", currency: "PKR", taxRate: "17" });

    await storage.createNotification({ title: "Payment Received", message: "Payment of Rs. 2,925 received from Ahmed Khan for INV-2024-001", type: "success", channel: "app", recipientType: "staff", createdAt: "2025-01-10T12:00:00Z" });
    await storage.createNotification({ title: "Invoice Overdue", message: "Invoice INV-2024-004 for Hassan Ali is overdue by 45 days", type: "warning", channel: "app", recipientType: "staff", createdAt: "2025-02-01T09:00:00Z" });
    await storage.createNotification({ title: "New Ticket Submitted", message: "Ticket TKT-001: Internet speed slower than subscribed package", type: "info", channel: "app", recipientType: "staff", createdAt: "2025-02-18T10:30:00Z" });
    await storage.createNotification({ title: "System Maintenance", message: "Scheduled maintenance on Feb 25, 2025 from 2 AM to 5 AM", type: "warning", channel: "email", recipientType: "all", createdAt: "2025-02-20T08:00:00Z" });
    await storage.createNotification({ title: "Low Stock Alert", message: "SC/APC Connectors (INV-SC-001) stock is below reorder level", type: "error", channel: "app", recipientType: "staff", createdAt: "2025-02-21T16:00:00Z" });

    await storage.createReport({ name: "Monthly Revenue Report", type: "revenue", description: "Summary of monthly revenue, collections, and outstanding amounts", createdBy: "System", status: "active" });
    await storage.createReport({ name: "Customer Growth Report", type: "customers", description: "New customer acquisitions and churn rate analysis", createdBy: "System", status: "active" });
    await storage.createReport({ name: "Invoice Aging Report", type: "invoices", description: "Outstanding invoices categorized by aging periods", createdBy: "System", status: "active" });
    await storage.createReport({ name: "Ticket Resolution Report", type: "tickets", description: "Support ticket resolution times and satisfaction metrics", createdBy: "System", status: "active" });
    await storage.createReport({ name: "Inventory Status Report", type: "inventory", description: "Current inventory levels, low stock items, and reorder alerts", createdBy: "System", status: "active" });

    await storage.upsertSetting({ key: "billing.tax_rate", value: "17", category: "billing", description: "Default tax rate percentage" });
    await storage.upsertSetting({ key: "billing.invoice_prefix", value: "INV", category: "billing", description: "Prefix for invoice numbers" });
    await storage.upsertSetting({ key: "billing.due_days", value: "15", category: "billing", description: "Default number of days until invoice due" });
    await storage.upsertSetting({ key: "general.company_name", value: "NetSphere Technologies", category: "general", description: "Company display name" });
    await storage.upsertSetting({ key: "general.currency", value: "PKR", category: "general", description: "Default currency" });
    await storage.upsertSetting({ key: "notifications.email_enabled", value: "true", category: "notifications", description: "Enable email notifications" });
    await storage.upsertSetting({ key: "notifications.sms_enabled", value: "false", category: "notifications", description: "Enable SMS notifications" });
    await storage.upsertSetting({ key: "security.session_timeout", value: "24", category: "security", description: "Session timeout in hours" });
    await storage.upsertSetting({ key: "security.max_login_attempts", value: "5", category: "security", description: "Maximum failed login attempts" });

    await storage.createCustomerConnection({ customerId: c1.id, username: "ahmed.khan@isp", ipAddress: "192.168.1.101", macAddress: "AA:BB:CC:DD:EE:01", onuSerial: "ZTEG12345678", routerModel: "TP-Link Archer AX73", routerSerial: "TPL73A0001", connectionType: "fiber", port: "PON1/1/1", vlan: "100", installDate: "2024-06-15", status: "active" });
    await storage.createCustomerConnection({ customerId: c2.id, username: "fatima.z@isp", ipAddress: "192.168.1.102", macAddress: "AA:BB:CC:DD:EE:02", onuSerial: "ZTEG87654321", routerModel: "Huawei AX3 Pro", routerSerial: "HW-AX3P-002", connectionType: "fiber", port: "PON1/1/2", vlan: "100", installDate: "2024-08-20", status: "active" });
    await storage.createCustomerConnection({ customerId: c3.id, username: "techvista@isp", ipAddress: "10.0.1.50", macAddress: "AA:BB:CC:DD:EE:03", onuSerial: "ZTEG11223344", routerModel: "MikroTik hAP ac3", routerSerial: "MT-HAP-003", connectionType: "fiber", port: "PON1/2/1", vlan: "200", installDate: "2024-03-10", status: "active" });
    await storage.createCustomerConnection({ customerId: c5.id, username: "nomadcafe@isp", ipAddress: "10.0.2.100", macAddress: "AA:BB:CC:DD:EE:05", onuSerial: "ZTEG99887766", routerModel: "Cisco RV340", routerSerial: "CSC-RV340-005", connectionType: "fiber", port: "PON1/3/1", vlan: "300", installDate: "2024-09-01", status: "active" });

    await storage.createExpense({ expenseId: "EXP-001", category: "utilities", amount: "35000", description: "Monthly electricity bill for main office", paymentMethod: "bank_transfer", reference: "ELEC-2025-02", status: "approved", date: "2025-02-05", createdBy: "admin" });
    await storage.createExpense({ expenseId: "EXP-002", category: "internet", amount: "120000", description: "Upstream bandwidth from PTCL - February", paymentMethod: "bank_transfer", reference: "PTCL-BWD-02", status: "paid", date: "2025-02-01", createdBy: "admin" });
    await storage.createExpense({ expenseId: "EXP-003", category: "equipment", amount: "85000", description: "10x ZTE F660 ONT units purchase", paymentMethod: "bank_transfer", reference: "PO-2025-012", vendorId: v1.id, status: "pending", date: "2025-02-18", createdBy: "admin" });
    await storage.createExpense({ expenseId: "EXP-004", category: "maintenance", amount: "15000", description: "Tower maintenance and cleaning", paymentMethod: "cash", status: "approved", date: "2025-02-10", createdBy: "admin" });
    await storage.createExpense({ expenseId: "EXP-005", category: "salary", amount: "420000", description: "February staff salaries", paymentMethod: "bank_transfer", status: "paid", date: "2025-02-28", createdBy: "admin" });
    await storage.createExpense({ expenseId: "EXP-006", category: "rent", amount: "80000", description: "Main office rent - February", paymentMethod: "check", reference: "RENT-02-2025", status: "paid", date: "2025-02-01", createdBy: "admin" });

    await storage.createAttendance({ employeeId: 1, date: "2025-02-23", checkIn: "09:00", checkOut: "18:00", status: "present", hoursWorked: "9", overtime: "1", location: "Main Office" });
    await storage.createAttendance({ employeeId: 2, date: "2025-02-23", checkIn: "09:15", checkOut: "17:30", status: "late", hoursWorked: "8.25", overtime: "0", location: "Field" });
    await storage.createAttendance({ employeeId: 3, date: "2025-02-23", checkIn: "08:45", checkOut: "19:00", status: "present", hoursWorked: "10.25", overtime: "2.25", location: "Main Office" });
    await storage.createAttendance({ employeeId: 4, date: "2025-02-23", status: "absent", notes: "Sick leave" });
    await storage.createAttendance({ employeeId: 5, date: "2025-02-23", checkIn: "10:00", checkOut: "14:00", status: "half_day", hoursWorked: "4", location: "Main Office" });
    await storage.createAttendance({ employeeId: 6, date: "2025-02-23", checkIn: "09:00", checkOut: "17:00", status: "present", hoursWorked: "8", location: "Main Office" });

    await storage.createAuditLog({ userName: "admin", action: "login", module: "auth", description: "User admin logged in successfully", ipAddress: "192.168.1.1", createdAt: "2025-02-23T09:00:00Z" });
    await storage.createAuditLog({ userName: "admin", action: "created", module: "customers", entityType: "customer", entityId: c1.id, description: "Created customer Ahmed Khan (ISP-1001)", ipAddress: "192.168.1.1", createdAt: "2025-02-23T09:15:00Z" });
    await storage.createAuditLog({ userName: "admin", action: "updated", module: "invoices", entityType: "invoice", entityId: inv1.id, description: "Updated invoice INV-2024-001 status to paid", ipAddress: "192.168.1.1", createdAt: "2025-02-23T10:00:00Z" });
    await storage.createAuditLog({ userName: "admin", action: "created", module: "tickets", entityType: "ticket", description: "Created support ticket TKT-001", ipAddress: "192.168.1.1", createdAt: "2025-02-23T10:30:00Z" });
    await storage.createAuditLog({ userName: "admin", action: "updated", module: "settings", description: "Updated billing tax rate to 17%", ipAddress: "192.168.1.1", createdAt: "2025-02-23T11:00:00Z" });

    await storage.createCreditNote({ creditNoteNumber: "CN-001", customerId: c4.id, amount: "1755", reason: "Billing for suspended period - customer was not using service", status: "applied", issueDate: "2025-02-15", appliedDate: "2025-02-16", createdBy: "admin" });
    await storage.createCreditNote({ creditNoteNumber: "CN-002", customerId: c1.id, invoiceId: inv1.id, amount: "500", reason: "Service downtime compensation - 2 days outage", status: "approved", issueDate: "2025-02-20", createdBy: "admin" });
    await storage.createCreditNote({ creditNoteNumber: "CN-003", customerId: c3.id, amount: "2000", reason: "Overcharge on corporate package upgrade", status: "draft", issueDate: "2025-02-22", createdBy: "admin" });

    await storage.createBulkMessage({ title: "February Maintenance Notice", message: "Dear customer, scheduled maintenance on Feb 25 from 2 AM to 5 AM. Service may be interrupted.", channel: "sms", targetType: "all", recipientCount: 354, sentCount: 348, failedCount: 6, status: "sent", sentAt: "2025-02-20T08:00:00Z", createdBy: "admin", createdAt: "2025-02-20T07:30:00Z" });
    await storage.createBulkMessage({ title: "Ramadan Package Promotion", message: "Special Ramadan offer! Get 50% extra speed on all packages. Valid till March 31.", channel: "email", targetType: "all", recipientCount: 354, status: "scheduled", scheduledAt: "2025-03-01T09:00:00Z", createdBy: "admin", createdAt: "2025-02-22T14:00:00Z" });
    await storage.createBulkMessage({ title: "DHA Area Outage Update", message: "Dear DHA residents, the network issue has been resolved. Thank you for your patience.", channel: "sms", targetType: "area", targetArea: "DHA Phase 5", recipientCount: 78, sentCount: 78, status: "sent", sentAt: "2025-02-19T16:00:00Z", createdBy: "admin", createdAt: "2025-02-19T15:45:00Z" });

    await storage.createIpAddress({ ipAddress: "192.168.1.101", subnet: "255.255.255.0", gateway: "192.168.1.1", type: "static", status: "assigned", customerId: c1.id, assignedDate: "2024-06-15", vlan: "100", pool: "residential" });
    await storage.createIpAddress({ ipAddress: "192.168.1.102", subnet: "255.255.255.0", gateway: "192.168.1.1", type: "static", status: "assigned", customerId: c2.id, assignedDate: "2024-08-20", vlan: "100", pool: "residential" });
    await storage.createIpAddress({ ipAddress: "10.0.1.50", subnet: "255.255.255.0", gateway: "10.0.1.1", type: "static", status: "assigned", customerId: c3.id, assignedDate: "2024-03-10", vlan: "200", pool: "corporate" });
    await storage.createIpAddress({ ipAddress: "10.0.2.100", subnet: "255.255.255.0", gateway: "10.0.2.1", type: "static", status: "assigned", customerId: c5.id, assignedDate: "2024-09-01", vlan: "300", pool: "corporate" });
    await storage.createIpAddress({ ipAddress: "192.168.1.103", subnet: "255.255.255.0", gateway: "192.168.1.1", type: "dynamic", status: "available", vlan: "100", pool: "residential" });
    await storage.createIpAddress({ ipAddress: "192.168.1.104", subnet: "255.255.255.0", gateway: "192.168.1.1", type: "dynamic", status: "available", vlan: "100", pool: "residential" });
    await storage.createIpAddress({ ipAddress: "10.0.1.51", subnet: "255.255.255.0", gateway: "10.0.1.1", type: "reserved", status: "reserved", vlan: "200", pool: "corporate", notes: "Reserved for upcoming corporate client" });
    await storage.createIpAddress({ ipAddress: "172.16.0.1", subnet: "255.255.0.0", gateway: "172.16.0.1", type: "static", status: "blocked", vlan: "999", pool: "management", notes: "Management interface - do not assign" });

    await storage.createOutage({ outageId: "OUT-001", title: "DHA Phase 5 Fiber Cut", description: "Fiber cable cut during road construction work near DHA Phase 5 main boulevard", affectedArea: "DHA Phase 5", affectedCustomers: 78, severity: "major", type: "unplanned", status: "resolved", startTime: "2025-02-19T14:00:00Z", estimatedRestore: "2025-02-19T18:00:00Z", endTime: "2025-02-19T16:30:00Z", rootCause: "Road construction damaged underground fiber conduit", resolution: "Fiber spliced and conduit repaired", notifiedCustomers: true, createdBy: "admin" });
    await storage.createOutage({ outageId: "OUT-002", title: "Scheduled Maintenance - Core Router Upgrade", description: "Upgrading core router firmware to latest version for improved performance", affectedArea: "All Areas", affectedCustomers: 354, severity: "minor", type: "maintenance", status: "scheduled", startTime: "2025-02-25T02:00:00Z", estimatedRestore: "2025-02-25T05:00:00Z", notifiedCustomers: true, createdBy: "admin" });
    await storage.createOutage({ outageId: "OUT-003", title: "Gulberg Power Outage Impact", description: "Extended power outage affecting Gulberg POP site. Backup generator running.", affectedArea: "Gulberg", affectedCustomers: 45, severity: "critical", type: "unplanned", status: "ongoing", startTime: "2025-02-23T08:00:00Z", estimatedRestore: "2025-02-23T14:00:00Z", notifiedCustomers: true, createdBy: "admin" });

    log("Database seeded successfully!", "seed");
  } catch (error) {
    log(`Seed error: ${error}`, "seed");
  }
}
