# Objective
Build a comprehensive Reports Module with a central Reports Dashboard and 10 dedicated report pages for each system module. Reports use existing API data with client-side aggregation, charts (Recharts), filtering, and CSV/PDF export. Follows existing UI patterns (dark gradient headers, KPI cards, tabs, shadcn/ui).

# Tasks

### T001: Backend — Reports API Endpoints
- **Blocked By**: []
- **Details**:
  - Add dedicated aggregation endpoints in `server/routes.ts`:
    - `GET /api/reports/dashboard` — aggregated KPI stats (total revenue, active customers, stock value, network counts, HR counts, notification stats)
    - `GET /api/reports/customer-stats` — customer growth, area distribution, plan distribution, churn
    - `GET /api/reports/billing-stats` — invoice totals, paid/unpaid, revenue by month, outstanding
    - `GET /api/reports/payment-stats` — payment collection, method breakdown, refunds, failed
    - `GET /api/reports/inventory-stats` — stock summary, low stock, brand/category breakdown
    - `GET /api/reports/asset-stats` — allocation summary, movement, faulty/available counts
    - `GET /api/reports/network-stats` — OLT/PON utilization, ONU online/offline, IP pool usage, P2P status
    - `GET /api/reports/hrm-stats` — attendance summary, salary totals, role distribution, leave summary
    - `GET /api/reports/notification-stats` — SMS/email/WhatsApp delivery stats, campaign performance
    - `GET /api/reports/activity-stats` — user activity, module-wise, critical actions, failed logins
    - `GET /api/reports/vendor-stats` — active vendors, bandwidth, wallet, payment transactions
  - All endpoints use existing storage interface queries with server-side aggregation
  - Files: `server/routes.ts`, `server/storage.ts`
  - Acceptance: All endpoints return valid JSON aggregated data

### T002: Frontend — Reports Dashboard (Landing Page)
- **Blocked By**: [T001]
- **Details**:
  - Replace existing basic `reports.tsx` with a full Reports Dashboard
  - Summary KPI cards: Total Revenue, Active Customers, Stock Value, Network Devices, HR Staff, etc.
  - Charts: Revenue trend line chart, Customer growth bar chart, Payment methods pie chart
  - Quick access grid of report category cards (click to navigate to dedicated pages)
  - Date range filter (Today, Weekly, Monthly, Custom) + Branch filter
  - Dark gradient header matching existing pattern
  - Files: `client/src/pages/reports.tsx`
  - Acceptance: Dashboard renders with real data, charts, KPI cards, and navigation links

### T003: Frontend — Customer Reports Page
- **Blocked By**: [T001]
- **Details**:
  - New page at `/reports/customers`
  - Tabs: Overview, Growth Trend, Area Distribution, Plan Distribution, Churn
  - KPI cards: Active, Suspended, New This Month, Churn Rate
  - Charts: Customer growth line chart, area distribution pie, plan bar chart
  - Data table with filters (date range, branch, plan, status)
  - Export CSV/PDF buttons
  - Files: `client/src/pages/reports-customers.tsx`
  - Acceptance: Page renders with customer analytics and filtering

### T004: Frontend — Billing & Invoice Reports Page
- **Blocked By**: [T001]
- **Details**:
  - New page at `/reports/billing`
  - KPI cards: Total Invoices, Paid, Unpaid, Outstanding Amount
  - Charts: Revenue line graph (12 months), Payment status pie chart, Plan-wise revenue bar
  - Aging report table (0-30, 30-60, 60-90, 90+ days)
  - Filters: Date range, branch, status
  - Export CSV/PDF
  - Files: `client/src/pages/reports-billing.tsx`
  - Acceptance: Billing analytics with proper aggregation

### T005: Frontend — Payment Reports Page
- **Blocked By**: [T001]
- **Details**:
  - New page at `/reports/payments`
  - KPI cards: Total Collected, Cash, Online, Refunds
  - Charts: Daily collection trend, payment method distribution pie
  - Payment table with method/status/branch filters
  - Export CSV/PDF
  - Files: `client/src/pages/reports-payments.tsx`
  - Acceptance: Payment analytics work with real data

### T006: Frontend — Network & IPAM Reports Page
- **Blocked By**: [T001]
- **Details**:
  - New page at `/reports/network`
  - KPI cards: OLTs, PON Utilization %, ONUs Online/Offline, IP Usage, P2P Links
  - Charts: Port utilization bar, ONU status pie, Network status distribution
  - Tables: OLT utilization details, Splitter usage, P2P link status
  - Filters: Status, device type
  - Export CSV/PDF
  - Files: `client/src/pages/reports-network.tsx`
  - Acceptance: Network analytics with infrastructure data

### T007: Frontend — Inventory & Asset Reports Pages
- **Blocked By**: [T001]
- **Details**:
  - Two pages: `/reports/inventory` and `/reports/assets`
  - Inventory: Stock summary KPIs, low stock alerts, product/brand breakdown charts, purchase/sales tables
  - Assets: Allocation summary KPIs, assigned/available/faulty charts, movement history table, depreciation
  - Both: Filters and export
  - Files: `client/src/pages/reports-inventory.tsx`, `client/src/pages/reports-assets.tsx`
  - Acceptance: Both pages render with real data

### T008: Frontend — HRM, Notifications, Activity Log & Vendor Reports Pages
- **Blocked By**: [T001]
- **Details**:
  - Four pages: `/reports/hrm`, `/reports/notifications`, `/reports/activity`, `/reports/vendors`
  - HRM: Attendance, salary summary, role distribution, leave stats
  - Notifications: SMS/Email/WhatsApp delivery stats, campaign performance
  - Activity: User activity, module-wise breakdown, critical actions, failed logins
  - Vendors: Active vendors, bandwidth, wallet, payment transactions
  - All: KPI cards, charts, tables, filters, export
  - Files: `client/src/pages/reports-hrm.tsx`, `client/src/pages/reports-notifications.tsx`, `client/src/pages/reports-activity.tsx`, `client/src/pages/reports-vendors.tsx`
  - Acceptance: All four pages render with data

### T009: Routing & Sidebar Integration
- **Blocked By**: [T002, T003, T004, T005, T006, T007, T008]
- **Details**:
  - Register all new report pages in `client/src/App.tsx`
  - Update sidebar "All Reports" section with all new report page links
  - Ensure navigation between dashboard and individual report pages works
  - Files: `client/src/App.tsx`, `client/src/components/app-sidebar.tsx`
  - Acceptance: All sidebar links work, pages load, navigation between reports is smooth

### T010: Testing & Polish
- **Blocked By**: [T009]
- **Details**:
  - Verify all API endpoints return valid data
  - Verify all report pages render without errors
  - Check chart rendering, filter functionality, export buttons
  - Ensure consistent dark gradient header styling across all pages
  - Update `replit.md` with Reports Module documentation
  - Files: all report files
  - Acceptance: All pages load, charts render, filters work, no console errors
